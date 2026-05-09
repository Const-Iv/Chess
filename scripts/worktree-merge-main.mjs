// @ts-check

import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureDependencies } from "./dependency-preflight.mjs";
import { buildCommitMessage } from "./lib/conveyor-utils.mjs";
import { syncOperationalDocs } from "./lib/doc-utils.mjs";
import {
  appendHistoryEvent,
  findGitRoot,
  findMainWorktree,
  formatIso,
  getCurrentBranch,
  getHistoryPath,
  getPipelinePaths,
  getTrackedChangedFiles,
  hasRemote,
  loadAllTaskStates,
  loadTaskStateByBranch,
  loadTaskStateByTaskId,
  parseArgs,
  runCommand,
  saveTaskState
} from "./lib/runtime.mjs";

const TASK_HISTORY_PATH = "Docs/task-history.md";
const LOCK_WAIT_MS = 30_000;
const LOCK_POLL_MS = 500;
const LOCK_STALE_MS = 30 * 60 * 1000;

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {number | null | undefined} pid
 * @returns {boolean}
 */
function isProcessAlive(pid) {
  if (!pid || !Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} lockPath
 * @returns {Promise<void>}
 */
async function maybeClearStaleLock(lockPath) {
  try {
    const [lockStat, raw] = await Promise.all([
      stat(lockPath),
      readFile(lockPath, "utf8").catch(() => "")
    ]);
    const age = Date.now() - lockStat.mtimeMs;
    const pid = Number.parseInt(JSON.parse(raw || "{}").pid ?? "", 10);
    if (age >= LOCK_STALE_MS || !isProcessAlive(pid)) {
      await unlink(lockPath).catch(() => {});
    }
  } catch {
    // Best-effort stale cleanup only.
  }
}

/**
 * @param {string} repoRoot
 * @param {import("./lib/runtime.mjs").TaskState} state
 * @returns {Promise<() => Promise<void>>}
 */
async function acquirePublishLock(repoRoot, state) {
  const lockPath = path.join(getPipelinePaths(repoRoot).pipelineDir, "locks", "main-publish.lock");
  await mkdir(path.dirname(lockPath), { recursive: true });
  const startedAt = Date.now();

  while (true) {
    try {
      await writeFile(
        lockPath,
        `${JSON.stringify({ pid: process.pid, taskId: state.taskId, branch: state.branch, acquiredAt: formatIso() }, null, 2)}\n`,
        { flag: "wx" }
      );
      return async () => {
        await unlink(lockPath).catch(() => {});
      };
    } catch (error) {
      if (/** @type {{code?: string}} */ (error).code !== "EEXIST") {
        throw error;
      }
      await maybeClearStaleLock(lockPath);
      if (Date.now() - startedAt >= LOCK_WAIT_MS) {
        throw new Error("Failed to acquire main publish lock. Retry merge later.");
      }
      await sleep(LOCK_POLL_MS);
    }
  }
}

/**
 * @param {string} repoRoot
 * @param {string} currentBranch
 * @param {{branch: string | null, taskId: string | null}} selectors
 * @returns {Promise<import("./lib/runtime.mjs").TaskState>}
 */
async function resolveTaskState(repoRoot, currentBranch, selectors) {
  if (selectors.taskId) {
    const explicitByTaskId = await loadTaskStateByTaskId(repoRoot, selectors.taskId);
    if (!explicitByTaskId) {
      throw new Error(`Task state not found for --task-id ${selectors.taskId}`);
    }
    return explicitByTaskId;
  }

  if (selectors.branch) {
    const explicitByBranch = await loadTaskStateByBranch(repoRoot, selectors.branch);
    if (!explicitByBranch) {
      throw new Error(`Task state not found for --branch ${selectors.branch}`);
    }
    return explicitByBranch;
  }

  if (currentBranch.startsWith("codex/")) {
    const current = await loadTaskStateByBranch(repoRoot, currentBranch);
    if (!current) {
      throw new Error(`Task state not found for branch ${currentBranch}`);
    }
    return current;
  }

  if (currentBranch !== "main") {
    throw new Error(`task:merge:main expects main or codex/* branch. Current branch: ${currentBranch}`);
  }

  const candidates = (await loadAllTaskStates(repoRoot)).filter(
    (state) => state.branch.startsWith("codex/") && Boolean(state.commitSha) && state.publishStatus !== "pushed"
  );
  if (candidates.length === 1) {
    return candidates[0];
  }
  if (candidates.length === 0) {
    throw new Error("No pending task branch found for merge. Provide --branch codex/<task-branch>.");
  }
  throw new Error(
    `Multiple pending task branches found: ${candidates.map((state) => state.branch).join(", ")}. ` +
    "Provide --branch codex/<task-branch>."
  );
}

/**
 * @param {string} mainWorktreePath
 * @param {string} repoRoot
 * @returns {Promise<void>}
 */
async function normalizeLegacyTaskHistory(mainWorktreePath, repoRoot) {
  const trackedChanged = await getTrackedChangedFiles(mainWorktreePath);
  const blocking = trackedChanged.filter((filePath) => filePath !== TASK_HISTORY_PATH);
  if (blocking.length > 0) {
    throw new Error(`Local main worktree is dirty. Blocking files: ${blocking.join(", ")}.`);
  }
  if (!trackedChanged.includes(TASK_HISTORY_PATH)) {
    return;
  }

  const legacyDir = path.join(getPipelinePaths(repoRoot).historyDir, "legacy");
  await mkdir(legacyDir, { recursive: true });
  const archivePath = path.join(
    legacyDir,
    `task-history-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}.md`
  );
  const taskHistoryPath = path.join(mainWorktreePath, TASK_HISTORY_PATH);
  await writeFile(archivePath, await readFile(taskHistoryPath, "utf8"), "utf8");
  runCommand(mainWorktreePath, "git", ["restore", "--staged", "--worktree", "--", TASK_HISTORY_PATH], {
    allowFailure: true
  });
}

/**
 * @param {string} mainWorktreePath
 * @param {import("./lib/runtime.mjs").TaskState} state
 * @returns {Promise<void>}
 */
async function maybeAutoCommitPublishChanges(mainWorktreePath, state) {
  const trackedChanged = await getTrackedChangedFiles(mainWorktreePath);
  const archiveStatus = runCommand(mainWorktreePath, "git", ["status", "--porcelain=v1", "--", "Docs/archive"], {
    allowFailure: true
  }).stdout;
  const untrackedArchives = archiveStatus
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("?? "))
    .map((line) => line.slice(3))
    .filter((filePath) => filePath.startsWith("Docs/archive/") && filePath.endsWith(".md.gz"));
  if (trackedChanged.length === 0 && untrackedArchives.length === 0) {
    return;
  }

  if (trackedChanged.length > 0) {
    runCommand(mainWorktreePath, "git", ["add", "-u"]);
  }
  if (untrackedArchives.length > 0) {
    runCommand(mainWorktreePath, "git", ["add", "--", ...untrackedArchives]);
  }
  const staged = runCommand(mainWorktreePath, "git", ["diff", "--cached", "--quiet"], { allowFailure: true });
  if (staged.status === 0) {
    return;
  }

  const message = await buildCommitMessage(mainWorktreePath, `${state.title} main sync`);
  runCommand(mainWorktreePath, "git", ["commit", "-m", message]);
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const repoRoot = findGitRoot(process.cwd());
  const currentBranch = getCurrentBranch(repoRoot);
  const { flags } = parseArgs(process.argv.slice(2));
  const requestedBranch = typeof flags.branch === "string" ? flags.branch : null;
  const requestedTaskId = typeof flags["task-id"] === "string" ? flags["task-id"] : null;
  const state = await resolveTaskState(repoRoot, currentBranch, {
    branch: requestedBranch,
    taskId: requestedTaskId
  });

  if (!state.commitSha) {
    throw new Error("task:merge:main requires a committed task branch.");
  }

  const mainWorktreePath = state.mainWorktreePath ?? (await findMainWorktree(repoRoot));
  if (!mainWorktreePath) {
    throw new Error("Local main worktree not found. Start the task from a repository that has a main worktree.");
  }
  if (getCurrentBranch(mainWorktreePath) !== "main") {
    throw new Error(`Resolved main worktree is not on main: ${mainWorktreePath}`);
  }

  const releaseLock = await acquirePublishLock(repoRoot, state);
  try {
    await normalizeLegacyTaskHistory(mainWorktreePath, repoRoot);

    if (hasRemote(mainWorktreePath)) {
      runCommand(mainWorktreePath, "git", ["fetch", "origin"]);
      runCommand(mainWorktreePath, "git", ["pull", "--ff-only", "origin", "main"]);
    }

    const alreadyMerged = runCommand(
      mainWorktreePath,
      "git",
      ["merge-base", "--is-ancestor", state.commitSha, "main"],
      { allowFailure: true }
    );
    if (alreadyMerged.status !== 0) {
      runCommand(mainWorktreePath, "git", ["merge", "--no-ff", state.branch], { allowFailure: false });
    }
    await appendHistoryEvent(repoRoot, {
      at: formatIso(),
      type: "MERGE_MAIN",
      taskId: state.taskId,
      branch: state.branch,
      payload: {
        mainWorktreePath,
        mergedCommitSha: state.commitSha,
        alreadyMerged: alreadyMerged.status === 0
      }
    });

    await ensureDependencies(mainWorktreePath);
    runCommand(mainWorktreePath, "node", ["scripts/deterministic-feedback-loop.mjs"]);
    runCommand(mainWorktreePath, "node", ["scripts/security-gate.mjs"]);
    await appendHistoryEvent(repoRoot, {
      at: formatIso(),
      type: "SECURITY_GATE",
      taskId: state.taskId,
      branch: state.branch,
      payload: {
        mainWorktreePath,
        status: "passed"
      }
    });

    const artifactDir = path.join(getPipelinePaths(repoRoot).artifactsDir, state.taskId);
    await syncOperationalDocs(mainWorktreePath, artifactDir).catch(() => []);
    runCommand(mainWorktreePath, "node", ["scripts/worktree-history.mjs", "sync"]);
    await maybeAutoCommitPublishChanges(mainWorktreePath, state);

    if (hasRemote(mainWorktreePath)) {
      runCommand(mainWorktreePath, "git", ["push", "origin", "main"]);
      state.publishStatus = "pushed";
    } else {
      state.publishStatus = "local-only";
    }
    state.status = "merged";
    await saveTaskState(repoRoot, state);

    await appendHistoryEvent(repoRoot, {
      at: formatIso(),
      type: "PUSH_MAIN",
      taskId: state.taskId,
      branch: state.branch,
      payload: {
        mainWorktreePath,
        publishStatus: state.publishStatus,
        historyPath: getHistoryPath(repoRoot)
      }
    });

    console.log(JSON.stringify({ mainWorktreePath, publishStatus: state.publishStatus }, null, 2));
  } catch (error) {
    state.publishStatus = "failed";
    await saveTaskState(repoRoot, state);
    await appendHistoryEvent(repoRoot, {
      at: formatIso(),
      type: "PUSH_MAIN",
      taskId: state.taskId,
      branch: state.branch,
      payload: {
        mainWorktreePath,
        publishStatus: "failed",
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  } finally {
    await releaseLock();
  }
}

await main();

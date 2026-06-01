// @ts-check

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { ensureDependencies } from "./dependency-preflight.mjs";
import {
  appendHistoryEvent,
  createTaskId,
  ensurePipelineDirs,
  findGitRoot,
  formatIso,
  getCodexHome,
  getCurrentBranch,
  getRepoName,
  getTaskArtifactsDir,
  hasRemote,
  isGitDirty,
  parseArgs,
  resolveBaseRef,
  runCommand,
  saveTaskState,
  slugify
} from "./lib/runtime.mjs";

/**
 * @param {string} repoRoot
 * @param {boolean} allowDirtyRequested
 * @returns {string}
 */
function buildDirtyTreeGuardMessage(repoRoot, allowDirtyRequested) {
  const status = runCommand(repoRoot, "git", ["status", "--short"], { allowFailure: true }).stdout
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);
  const lines = [];
  if (allowDirtyRequested) {
    lines.push("task:start больше не поддерживает --allow-dirty.");
  }
  lines.push("Новый task worktree не создан: исходное рабочее дерево должно быть чистым.");
  if (status.length > 0) {
    lines.push("Оставшиеся изменения:");
    for (const line of status) {
      lines.push(`- ${line}`);
    }
  }
  lines.push("Безопасные следующие шаги: `git diff`, затем commit текущей работы или `git stash -u`.");
  return lines.join("\n");
}

/** @typedef {{openAttempted: boolean, openStatus: "skipped"|"verified"|"unverified"|"failed", openedChat: boolean, openThreadId: string | null, openDiagnostics: string | null, openCommand: string | null}} CodexOpenResult */

const CODEX_OPEN_READBACK_TIMEOUT_MS = 5000;
const CODEX_OPEN_READBACK_POLL_MS = 500;

/**
 * @param {string} codexHome
 * @returns {Promise<string | null>}
 */
async function findCodexStateDb(codexHome) {
  let entries;
  try {
    entries = await readdir(codexHome);
  } catch {
    return null;
  }
  const candidates = [];
  for (const entry of entries) {
    if (!/^state_\d+\.sqlite$/.test(entry)) {
      continue;
    }
    const candidate = path.join(codexHome, entry);
    try {
      candidates.push({ path: candidate, mtimeMs: (await stat(candidate)).mtimeMs });
    } catch {
      // Ignore files that disappear during read-back.
    }
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs || b.path.localeCompare(a.path));
  return candidates[0]?.path ?? null;
}

/**
 * @param {string} value
 * @returns {string}
 */
function sqliteQuote(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * @param {string} cwd
 * @param {string} codexHome
 * @param {string} worktreePath
 * @param {number} notBeforeMs
 * @returns {Promise<{threadId: string | null, diagnostic: string | null}>}
 */
async function findCodexThreadForWorktree(cwd, codexHome, worktreePath, notBeforeMs) {
  const dbPath = await findCodexStateDb(codexHome);
  if (!dbPath) {
    return {
      threadId: null,
      diagnostic: `No Codex thread was observed for cwd ${worktreePath}: Codex state db was not found.`
    };
  }
  const query = [
    "select id from threads",
    `where archived = 0 and cwd = ${sqliteQuote(worktreePath)} and coalesce(created_at_ms, created_at * 1000) >= ${Math.floor(
      notBeforeMs
    )}`,
    "order by coalesce(created_at_ms, created_at * 1000) desc limit 1;"
  ].join(" ");
  const result = runCommand(cwd, "sqlite3", [dbPath, query], { allowFailure: true });
  if (result.status !== 0) {
    return {
      threadId: null,
      diagnostic: `No Codex thread was observed for cwd ${worktreePath}: sqlite read-back failed (${result.status}).`
    };
  }
  return { threadId: result.stdout.trim().split("\n").find(Boolean) ?? null, diagnostic: null };
}

/**
 * @param {string} cwd
 * @param {string} codexHome
 * @param {string} worktreePath
 * @param {number} notBeforeMs
 * @returns {Promise<{threadId: string | null, diagnostic: string | null}>}
 */
async function waitForCodexThread(cwd, codexHome, worktreePath, notBeforeMs) {
  const deadline = Date.now() + CODEX_OPEN_READBACK_TIMEOUT_MS;
  let lastDiagnostic = null;
  do {
    const result = await findCodexThreadForWorktree(cwd, codexHome, worktreePath, notBeforeMs);
    if (result.threadId) {
      return result;
    }
    lastDiagnostic = result.diagnostic;
    if (lastDiagnostic?.includes("state db was not found")) {
      break;
    }
    await sleep(CODEX_OPEN_READBACK_POLL_MS);
  } while (Date.now() < deadline);
  return {
    threadId: null,
    diagnostic:
      lastDiagnostic ??
      `No Codex thread was observed for cwd ${worktreePath} within ${CODEX_OPEN_READBACK_TIMEOUT_MS}ms.`
  };
}

/**
 * @param {string} worktreePath
 * @param {string} seedMessage
 * @returns {string}
 */
function buildCodexNewThreadUrl(worktreePath, seedMessage) {
  const params = new URLSearchParams();
  params.set("path", worktreePath);
  if (seedMessage.trim()) {
    params.set("prompt", seedMessage);
  }
  return `codex://new?${params.toString()}`;
}

/**
 * @param {string} repoRoot
 * @param {string} worktreePath
 * @param {string} seedMessage
 * @returns {{attempted: boolean, ok: boolean, command: string, diagnostic: string}}
 */
function openCodexNewThreadComposer(repoRoot, worktreePath, seedMessage) {
  const url = buildCodexNewThreadUrl(worktreePath, seedMessage);
  const command = `open ${JSON.stringify(url)}`;
  if (process.platform !== "darwin") {
    return {
      attempted: false,
      ok: false,
      command,
      diagnostic: "Codex new-thread deep link is only supported on macOS."
    };
  }
  const result = runCommand(repoRoot, "open", [url], { allowFailure: true });
  if (result.status !== 0) {
    return {
      attempted: true,
      ok: false,
      command,
      diagnostic: `Codex new-thread deep link failed (${result.status}): ${(result.stderr || result.stdout).trim()}`
    };
  }
  return {
    attempted: true,
    ok: true,
    command,
    diagnostic: "Codex new-thread deep link opened the target worktree composer."
  };
}

/**
 * @param {string} repoRoot
 * @param {string} worktreePath
 * @param {boolean} noOpen
 * @param {string} seedMessage
 * @returns {Promise<CodexOpenResult>}
 */
async function openCodexTaskChat(repoRoot, worktreePath, noOpen, seedMessage) {
  const openCommand = `codex app ${JSON.stringify(worktreePath)}`;
  if (noOpen) {
    return {
      openAttempted: false,
      openStatus: "skipped",
      openedChat: false,
      openThreadId: null,
      openDiagnostics: "Codex auto-open skipped by --no-open or STARTER_NO_OPEN=1.",
      openCommand
    };
  }

  const codexPath = runCommand(repoRoot, "sh", ["-lc", "command -v codex"], { allowFailure: true });
  if (codexPath.status !== 0) {
    return {
      openAttempted: true,
      openStatus: "failed",
      openedChat: false,
      openThreadId: null,
      openDiagnostics: "Codex CLI was not found in PATH; task worktree was created but no chat was opened.",
      openCommand
    };
  }

  const notBeforeMs = Date.now() - 1000;
  const opened = runCommand(repoRoot, "codex", ["app", worktreePath], { allowFailure: true });
  if (opened.status !== 0) {
    return {
      openAttempted: true,
      openStatus: "failed",
      openedChat: false,
      openThreadId: null,
      openDiagnostics: `codex app failed (${opened.status}): ${(opened.stderr || opened.stdout).trim()}`,
      openCommand
    };
  }

  const deepLink = openCodexNewThreadComposer(repoRoot, worktreePath, seedMessage);
  const effectiveOpenCommand = deepLink.attempted ? `${openCommand}; ${deepLink.command}` : openCommand;
  if (deepLink.ok) {
    await sleep(CODEX_OPEN_READBACK_POLL_MS);
  }

  const readBack = await waitForCodexThread(repoRoot, getCodexHome(), worktreePath, notBeforeMs);
  if (readBack.threadId) {
    return {
      openAttempted: true,
      openStatus: "verified",
      openedChat: true,
      openThreadId: readBack.threadId,
      openDiagnostics: "Codex thread read-back matched the created worktree cwd.",
      openCommand: effectiveOpenCommand
    };
  }
  const diagnostics = [readBack.diagnostic, deepLink.diagnostic].filter(Boolean).join(" ");
  return {
    openAttempted: true,
    openStatus: "unverified",
    openedChat: false,
    openThreadId: null,
    openDiagnostics:
      diagnostics ||
      readBack.diagnostic ||
      `No Codex thread was observed for cwd ${worktreePath} after a successful codex app launch attempt.`,
    openCommand: effectiveOpenCommand
  };
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const repoRoot = findGitRoot(process.cwd());
  const { flags } = parseArgs(process.argv.slice(2));
  const title = typeof flags.title === "string" ? flags.title : "";
  const seedMessage = typeof flags["seed-message"] === "string" ? flags["seed-message"] : title;
  const allowDirtyRequested = flags["allow-dirty"] === true;
  const noOpen = flags["no-open"] === true || process.env.STARTER_NO_OPEN === "1";

  if (!title) {
    throw new Error("task:start requires --title.");
  }

  if (allowDirtyRequested || isGitDirty(repoRoot)) {
    throw new Error(buildDirtyTreeGuardMessage(repoRoot, allowDirtyRequested));
  }

  await ensurePipelineDirs(repoRoot);

  const taskId = createTaskId();
  const slug = slugify(title);
  const repoName = getRepoName(repoRoot);
  const branch = `codex/${taskId}-${slug}`;
  const managedRoot = path.join(getCodexHome(), "worktrees", taskId);
  const worktreePath = path.join(managedRoot, `${repoName}-${slug}`);
  const sourceBranch = getCurrentBranch(repoRoot) || "main";
  const baseRef = resolveBaseRef(repoRoot);

  runCommand(repoRoot, "git", ["worktree", "add", "-b", branch, worktreePath, baseRef]);
  await ensureDependencies(worktreePath);

  const mainWorktreePath = sourceBranch === "main" ? repoRoot : null;
  /** @type {import("./lib/runtime.mjs").TaskState} */
  const taskState = {
    taskId,
    title,
    slug,
    branch,
    sourceBranch,
    repoRoot,
    worktreePath,
    createdAt: formatIso(),
    seedMessage,
    status: "started",
    qaLastPassSha: null,
    previewPreparedSha: null,
    preview: null,
    lastQaResult: null,
    commitSha: null,
    publishStatus: "pending",
    cleanupDecision: null,
    cleanupStatus: null,
    cleanupTargets: [],
    operationalArtifacts: [],
    mainWorktreePath
  };

  const openResult = await openCodexTaskChat(repoRoot, worktreePath, noOpen, seedMessage);
  Object.assign(taskState, openResult);

  await saveTaskState(repoRoot, taskState);
  await appendHistoryEvent(repoRoot, {
    at: formatIso(),
    type: "START",
    taskId,
    branch,
    payload: {
      title,
      seedMessage,
      worktreePath,
      allowDirtyRequested,
      ...openResult
    }
  });

  const artifactsDir = getTaskArtifactsDir(repoRoot, taskId);
  await ensurePipelineDirs(repoRoot);
  runCommand(repoRoot, "mkdir", ["-p", artifactsDir], { allowFailure: true });

  console.log(
    JSON.stringify(
      {
        taskId,
        branch,
        worktreePath,
        ...openResult
      },
      null,
      2
    )
  );
}

await main();

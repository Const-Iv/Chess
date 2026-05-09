// @ts-check

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  getHistoryPath,
  getTaskStatePath,
  loadTaskStateByBranch,
  readJson,
  readNdjson,
  runCommand,
  writeJson
} from "../../scripts/lib/runtime.mjs";
import { createTempStarterRepo, runStarterScript } from "../helpers/temp-repo.mjs";

/**
 * @param {ReturnType<typeof createTempStarterRepo> extends Promise<infer T> ? T : never} fixture
 * @returns {Record<string, string>}
 */
function buildEnv(fixture) {
  return {
    CODEX_HOME: fixture.codexHome,
    STARTER_NO_OPEN: "1"
  };
}

/**
 * @param {string} repoRoot
 * @param {Record<string, string>} env
 * @param {string} title
 * @returns {{taskId: string, branch: string, worktreePath: string, openedChat: boolean}}
 */
function startTask(repoRoot, env, title) {
  return JSON.parse(
    runStarterScript(repoRoot, ["scripts/worktree-start.mjs", "--title", title, "--seed-message", title], { env }).stdout
  );
}

/**
 * @param {string} worktreePath
 * @param {string} line
 * @returns {Promise<void>}
 */
async function appendReadmeLine(worktreePath, line) {
  const worktreeReadme = path.join(worktreePath, "README.md");
  await appendFile(worktreeReadme, `\n${line}\n`, "utf8");
}

/**
 * @param {string} worktreePath
 * @param {Record<string, string>} env
 * @returns {void}
 */
function runQaCheckpoint(worktreePath, env) {
  assert.equal(runStarterScript(worktreePath, ["scripts/worktree-qa-agent.mjs"], { env }).status, 0);
}

/**
 * @param {Array<{type: string, branch: string, payload: Record<string, unknown>}>} events
 * @param {string} type
 * @param {string} branch
 * @returns {{type: string, branch: string, payload: Record<string, unknown>}}
 */
function getLatestEvent(events, type, branch) {
  const event = [...events].reverse().find((entry) => entry.type === type && entry.branch === branch);
  assert.ok(event, `Missing ${type} event for ${branch}`);
  return event;
}

/**
 * @param {string} repoRoot
 * @param {string} scriptBody
 * @returns {Promise<void>}
 */
async function installCleanupHook(repoRoot, scriptBody) {
  const packageJsonPath = path.join(repoRoot, "package.json");
  const packageJson = /** @type {{scripts: Record<string, string>}} */ (await readJson(packageJsonPath));
  packageJson.scripts["task:finish:cleanup"] = "node scripts/test-finish-cleanup-hook.mjs";
  await writeJson(packageJsonPath, packageJson);
  await writeFile(path.join(repoRoot, "scripts/test-finish-cleanup-hook.mjs"), scriptBody, "utf8");
  runCommand(repoRoot, "git", ["add", "package.json", "scripts/test-finish-cleanup-hook.mjs"]);
  runCommand(repoRoot, "git", ["commit", "-m", "Add test cleanup hook"]);
}

test("Nightly: finish blocks on failed QA and then merges cleanly into main", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    const started = startTask(fixture.repoRoot, env, "Finish merge flow");
    const worktreeReadme = path.join(started.worktreePath, "README.md");
    const originalReadme = await readFile(worktreeReadme, "utf8");
    await writeFile(worktreeReadme, `${originalReadme.trimEnd()}   \n`, "utf8");

    const failedFinish = runStarterScript(started.worktreePath, ["scripts/worktree-finish-core.mjs"], {
      env,
      allowFailure: true
    });
    assert.notEqual(failedFinish.status, 0);

    await appendReadmeLine(started.worktreePath, "Validated finish flow.");
    await writeFile(worktreeReadme, `${(await readFile(worktreeReadme, "utf8")).replace(/[ \t]+$/gm, "").trimEnd()}\n`, "utf8");
    runQaCheckpoint(started.worktreePath, env);

    const resumed = runStarterScript(started.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "no"], {
      env
    });
    assert.equal(resumed.status, 0);

    const state = await loadTaskStateByBranch(fixture.repoRoot, started.branch);
    assert.ok(state?.commitSha);
    assert.equal(state?.publishStatus, "local-only");
    assert.equal(state?.cleanupDecision, "no");
    assert.equal(state?.cleanupStatus, "kept");

    const mainReadme = await readFile(path.join(fixture.repoRoot, "README.md"), "utf8");
    assert.match(mainReadme, /Validated finish flow\./);

    const events = await readNdjson(getHistoryPath(fixture.repoRoot));
    assert.ok(events.some((event) => event.type === "MERGE_MAIN" && event.branch === started.branch));
    assert.ok(events.some((event) => event.type === "PUSH_MAIN" && event.branch === started.branch));
    const cleanupEvent = getLatestEvent(events, "CLEANUP", started.branch);
    assert.equal(cleanupEvent.payload.status, "kept");
    const finishEvent = getLatestEvent(events, "FINISH", started.branch);
    assert.equal(finishEvent.payload.cleanupStatus, "kept");
  } finally {
    await fixture.cleanup();
  }
});

test("Nightly: finish cleanup prunes the empty managed task root and records cleanupStatus", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    const started = startTask(fixture.repoRoot, env, "Finish cleanup prune");
    const taskRoot = path.dirname(started.worktreePath);

    await appendReadmeLine(started.worktreePath, "Validated cleanup prune.");
    runQaCheckpoint(started.worktreePath, env);

    const finished = runStarterScript(started.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "yes"], {
      env
    });
    assert.equal(finished.status, 0);
    assert.equal(existsSync(started.worktreePath), false);
    assert.equal(existsSync(taskRoot), false);

    const state = await loadTaskStateByBranch(fixture.repoRoot, started.branch);
    assert.equal(state?.cleanupDecision, "yes");
    assert.equal(state?.cleanupStatus, "passed");

    const events = await readNdjson(getHistoryPath(fixture.repoRoot));
    const cleanupEvent = getLatestEvent(events, "CLEANUP", started.branch);
    assert.equal(cleanupEvent.payload.status, "passed");
    assert.equal(cleanupEvent.payload.branchRemoved, true);
    assert.ok(Array.isArray(cleanupEvent.payload.removedPaths));
    const finishEvent = getLatestEvent(events, "FINISH", started.branch);
    assert.equal(finishEvent.payload.cleanupStatus, "passed");
  } finally {
    await fixture.cleanup();
  }
});

test("Nightly: finish cleanup fails when the managed task root still has unreported leftovers", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    const started = startTask(fixture.repoRoot, env, "Finish cleanup leftover guard");
    const taskRoot = path.dirname(started.worktreePath);
    const leftoverPath = path.join(taskRoot, "unreported-leftover", "store.json");

    await mkdir(path.dirname(leftoverPath), { recursive: true });
    await writeFile(leftoverPath, "{}\n", "utf8");
    await appendReadmeLine(started.worktreePath, "Validated cleanup leftover guard.");
    runQaCheckpoint(started.worktreePath, env);

    const failed = runStarterScript(started.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "1"], {
      env,
      allowFailure: true
    });
    assert.notEqual(failed.status, 0);
    assert.equal(existsSync(started.worktreePath), false);
    assert.equal(existsSync(taskRoot), true);
    assert.equal(existsSync(leftoverPath), true);

    const state = await loadTaskStateByBranch(fixture.repoRoot, started.branch);
    assert.equal(state?.cleanupDecision, "yes");
    assert.equal(state?.cleanupStatus, "failed");

    const events = await readNdjson(getHistoryPath(fixture.repoRoot));
    const cleanupEvent = getLatestEvent(events, "CLEANUP", started.branch);
    assert.equal(cleanupEvent.payload.status, "failed");
    assert.ok(Array.isArray(cleanupEvent.payload.remainingPaths));
    assert.ok(cleanupEvent.payload.remainingPaths.includes(taskRoot));
    assert.match(`${failed.stderr}\n${failed.stdout}`, /Managed task root remains after cleanup/);
  } finally {
    await fixture.cleanup();
  }
});

test("Nightly: finish skips publish when the task branch HEAD is already in main", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    const started = startTask(fixture.repoRoot, env, "Finish already merged no-op");

    const finished = runStarterScript(started.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "2"], {
      env
    });
    assert.equal(finished.status, 0);

    const state = await loadTaskStateByBranch(fixture.repoRoot, started.branch);
    assert.ok(state?.commitSha);
    assert.equal(state?.publishStatus, "skipped_already_merged");
    assert.equal(state?.cleanupDecision, "no");
    assert.equal(state?.cleanupStatus, "kept");

    const events = await readNdjson(getHistoryPath(fixture.repoRoot));
    const skipEvent = getLatestEvent(events, "PUBLISH_SKIP", started.branch);
    assert.equal(skipEvent.payload.publishStatus, "skipped_already_merged");
    assert.equal(events.some((event) => event.type === "MERGE_MAIN" && event.branch === started.branch), false);
    assert.equal(events.some((event) => event.type === "PUSH_MAIN" && event.branch === started.branch), false);
  } finally {
    await fixture.cleanup();
  }
});

test("Nightly: finish accepts numeric cleanup choices", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    const startedKeep = startTask(fixture.repoRoot, env, "Finish cleanup keep numeric");
    await appendReadmeLine(startedKeep.worktreePath, "Validated numeric keep cleanup.");
    runQaCheckpoint(startedKeep.worktreePath, env);

    const kept = runStarterScript(startedKeep.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "2"], {
      env
    });
    assert.equal(kept.status, 0);
    assert.equal(existsSync(startedKeep.worktreePath), true);

    const keepState = await loadTaskStateByBranch(fixture.repoRoot, startedKeep.branch);
    assert.equal(keepState?.cleanupDecision, "no");
    assert.equal(keepState?.cleanupStatus, "kept");

    const startedDelete = startTask(fixture.repoRoot, env, "Finish cleanup delete numeric");
    const deleteTaskRoot = path.dirname(startedDelete.worktreePath);
    await appendReadmeLine(startedDelete.worktreePath, "Validated numeric delete cleanup.");
    runQaCheckpoint(startedDelete.worktreePath, env);

    const deleted = runStarterScript(startedDelete.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "1"], {
      env
    });
    assert.equal(deleted.status, 0);
    assert.equal(existsSync(startedDelete.worktreePath), false);
    assert.equal(existsSync(deleteTaskRoot), false);

    const deleteState = await loadTaskStateByBranch(fixture.repoRoot, startedDelete.branch);
    assert.equal(deleteState?.cleanupDecision, "yes");
    assert.equal(deleteState?.cleanupStatus, "passed");
  } finally {
    await fixture.cleanup();
  }
});

test("Nightly: finish commits dirty task changes before final QA reuse/publish", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    const started = startTask(fixture.repoRoot, env, "Finish dirty task commit before qa");
    const initialHead = runCommand(started.worktreePath, "git", ["rev-parse", "HEAD"]).stdout.trim();

    await appendReadmeLine(started.worktreePath, "Validated dirty finish commit ordering.");
    runQaCheckpoint(started.worktreePath, env);

    const finished = runStarterScript(started.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "2"], {
      env
    });
    assert.equal(finished.status, 0);

    const state = await loadTaskStateByBranch(fixture.repoRoot, started.branch);
    assert.ok(state?.commitSha);
    assert.notEqual(state?.commitSha, initialHead);
    assert.equal(state?.qaLastPassSha, state?.commitSha);
    assert.equal(state?.cleanupStatus, "kept");

    const mainReadme = await readFile(path.join(fixture.repoRoot, "README.md"), "utf8");
    assert.match(mainReadme, /Validated dirty finish commit ordering\./);

    const events = await readNdjson(getHistoryPath(fixture.repoRoot));
    const qaReuseEvents = events.filter((event) => event.type === "QA_REUSE" && event.branch === started.branch);
    assert.equal(qaReuseEvents.length, 0);
    const qaCheckpointEvents = events.filter((event) => event.type === "QA_CHECKPOINT" && event.branch === started.branch);
    assert.equal(qaCheckpointEvents.length, 2);
    assert.equal(qaCheckpointEvents.at(-1)?.payload.qaLastPassSha, state?.commitSha);
    const commitEvent = getLatestEvent(events, "COMMIT_PUSH", started.branch);
    assert.equal(commitEvent.payload.commitSha, state?.commitSha);
  } finally {
    await fixture.cleanup();
  }
});

test("Nightly: finish resume by --task-id removes non-git leftovers from a legacy task path", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    const started = startTask(fixture.repoRoot, env, "Finish cleanup resume by task id");
    const taskRoot = path.dirname(started.worktreePath);

    await appendReadmeLine(started.worktreePath, "Validated cleanup resume.");
    runQaCheckpoint(started.worktreePath, env);
    assert.equal(runStarterScript(started.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "2"], { env }).status, 0);

    runCommand(fixture.repoRoot, "git", ["worktree", "remove", started.worktreePath, "--force"]);
    await mkdir(path.join(started.worktreePath, "runtime", "telegram-bot"), { recursive: true });
    await writeFile(path.join(started.worktreePath, "runtime", "telegram-bot", "store.json"), "{}\n", "utf8");

    const statePath = getTaskStatePath(fixture.repoRoot, started.taskId);
    const legacyState = /** @type {import("../../scripts/lib/runtime.mjs").TaskState} */ (await readJson(statePath));
    legacyState.cleanupDecision = "yes";
    legacyState.cleanupStatus = null;
    legacyState.cleanupTargets = [];
    await writeJson(statePath, legacyState);

    const resumed = runStarterScript(
      fixture.repoRoot,
      ["scripts/worktree-finish-core.mjs", "--task-id", started.taskId, "--cleanup", "1"],
      { env }
    );
    assert.equal(resumed.status, 0);
    assert.equal(existsSync(started.worktreePath), false);
    assert.equal(existsSync(taskRoot), false);

    const resumedState = await loadTaskStateByBranch(fixture.repoRoot, started.branch);
    assert.equal(resumedState?.cleanupStatus, "passed");
    assert.notEqual(
      runCommand(fixture.repoRoot, "git", ["rev-parse", "--verify", `refs/heads/${started.branch}`], { allowFailure: true }).status,
      0,
      "Branch ref should be removed after resumed cleanup"
    );
  } finally {
    await fixture.cleanup();
  }
});

test("Nightly: finish cleanup hook can register extra task-scoped paths", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    await installCleanupHook(
      fixture.repoRoot,
      [
        "import { readFileSync } from 'node:fs';",
        "import path from 'node:path';",
        "const args = process.argv.slice(2);",
        "const contextPath = args[args.indexOf('--context') + 1];",
        "const context = JSON.parse(readFileSync(contextPath, 'utf8'));",
        "const extraPath = path.join(path.dirname(context.worktreePath), 'runtime');",
        "console.log(JSON.stringify({ version: 1, extraPaths: [extraPath], blocked: [], notes: ['hook-added-runtime'] }));"
      ].join("\n") + "\n"
    );

    const started = startTask(fixture.repoRoot, env, "Finish cleanup hook extra paths");
    const taskRuntimePath = path.join(path.dirname(started.worktreePath), "runtime");
    await mkdir(taskRuntimePath, { recursive: true });
    await writeFile(path.join(taskRuntimePath, "events.ndjson"), "{\"ok\":true}\n", "utf8");
    await appendReadmeLine(started.worktreePath, "Validated cleanup hook extra paths.");
    runQaCheckpoint(started.worktreePath, env);

    const finished = runStarterScript(started.worktreePath, ["scripts/worktree-finish-core.mjs", "--cleanup", "1"], {
      env
    });
    assert.equal(finished.status, 0);
    assert.equal(existsSync(started.worktreePath), false);
    assert.equal(existsSync(taskRuntimePath), false);

    const state = await loadTaskStateByBranch(fixture.repoRoot, started.branch);
    assert.equal(state?.cleanupStatus, "passed");
    assert.ok(state?.cleanupTargets?.includes(taskRuntimePath));

    const events = await readNdjson(getHistoryPath(fixture.repoRoot));
    const cleanupEvent = getLatestEvent(events, "CLEANUP", started.branch);
    assert.equal(cleanupEvent.payload.hookInvoked, true);
    assert.ok(Array.isArray(cleanupEvent.payload.removedPaths));
    assert.ok(cleanupEvent.payload.removedPaths.includes(taskRuntimePath));
  } finally {
    await fixture.cleanup();
  }
});

test("Nightly: finish cleanup hook can block cleanup and keep the task resumable", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = buildEnv(fixture);
    await installCleanupHook(
      fixture.repoRoot,
      "console.log(JSON.stringify({ version: 1, extraPaths: [], blocked: ['telegram service still points to task worktree'], notes: [] }));\n"
    );

    const started = startTask(fixture.repoRoot, env, "Finish cleanup hook blocked");
    await appendReadmeLine(started.worktreePath, "Validated blocked cleanup hook.");
    runQaCheckpoint(started.worktreePath, env);

    const failed = runStarterScript(
      started.worktreePath,
      ["scripts/worktree-finish-core.mjs", "--cleanup", "1"],
      { env, allowFailure: true }
    );
    assert.notEqual(failed.status, 0);
    assert.equal(existsSync(started.worktreePath), true);

    const state = await loadTaskStateByBranch(fixture.repoRoot, started.branch);
    assert.equal(state?.cleanupDecision, "yes");
    assert.equal(state?.cleanupStatus, "failed");
    assert.equal(
      runCommand(fixture.repoRoot, "git", ["rev-parse", "--verify", `refs/heads/${started.branch}`], { allowFailure: true }).status,
      0
    );

    const events = await readNdjson(getHistoryPath(fixture.repoRoot));
    const cleanupEvent = getLatestEvent(events, "CLEANUP", started.branch);
    assert.equal(cleanupEvent.payload.status, "failed");
    assert.equal(cleanupEvent.payload.hookInvoked, true);
    assert.deepEqual(cleanupEvent.payload.blocked, ["telegram service still points to task worktree"]);
    const finishEvent = getLatestEvent(events, "FINISH", started.branch);
    assert.equal(finishEvent.payload.cleanupStatus, "failed");
  } finally {
    await fixture.cleanup();
  }
});

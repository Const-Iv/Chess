// @ts-check

import assert from "node:assert/strict";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  getHistoryPath,
  getHeadSha,
  loadTaskStateByBranch,
  readNdjson,
  runCommand,
  saveTaskState
} from "../../scripts/lib/runtime.mjs";
import { createTempStarterRepo, runStarterScript } from "../helpers/temp-repo.mjs";

test("task:merge:main can merge a committed task branch when started from main", async () => {
  const fixture = await createTempStarterRepo({ installDependencies: true });
  try {
    const env = {
      CODEX_HOME: fixture.codexHome,
      STARTER_NO_OPEN: "1"
    };
    const started = runStarterScript(
      fixture.repoRoot,
      ["scripts/worktree-start.mjs", "--title", "Merge from main", "--seed-message", "Merge from main"],
      { env }
    );
    const startPayload = JSON.parse(started.stdout);
    const worktreeReadme = path.join(startPayload.worktreePath, "README.md");
    await appendFile(worktreeReadme, "\nMerged from main test.\n", "utf8");
    runCommand(startPayload.worktreePath, "git", ["add", "README.md"]);
    runCommand(startPayload.worktreePath, "git", ["commit", "-m", "Ver. 4.00 docs: merge from main test | билд прошел"]);

    const state = await loadTaskStateByBranch(fixture.repoRoot, startPayload.branch);
    assert.ok(state);
    state.commitSha = getHeadSha(startPayload.worktreePath);
    await saveTaskState(fixture.repoRoot, state);

    const archivePath = path.join(fixture.repoRoot, "Docs/archive/merge-main-test.md.gz");
    await mkdir(path.dirname(archivePath), { recursive: true });
    await writeFile(archivePath, "archive placeholder\n", "utf8");

    const merged = runStarterScript(
      fixture.repoRoot,
      ["scripts/worktree-merge-main.mjs", "--branch", startPayload.branch],
      { env }
    );
    assert.equal(merged.status, 0);

    const mainReadme = await readFile(path.join(fixture.repoRoot, "README.md"), "utf8");
    assert.match(mainReadme, /Merged from main test\./);

    const refreshed = await loadTaskStateByBranch(fixture.repoRoot, startPayload.branch);
    assert.equal(refreshed?.publishStatus, "local-only");
    const archiveStatus = runCommand(fixture.repoRoot, "git", ["status", "--short", "--", "Docs/archive/merge-main-test.md.gz"]);
    assert.equal(archiveStatus.stdout.trim(), "");

    const events = await readNdjson(getHistoryPath(fixture.repoRoot));
    assert.ok(events.some((event) => event.type === "MERGE_MAIN" && event.branch === startPayload.branch));
    assert.ok(events.some((event) => event.type === "SECURITY_GATE" && event.branch === startPayload.branch));
    assert.ok(events.some((event) => event.type === "PUSH_MAIN" && event.branch === startPayload.branch));
  } finally {
    await fixture.cleanup();
  }
});

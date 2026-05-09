// @ts-check

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * @typedef {Object} PreviewCheckpoint
 * @property {"prepared"|"not_supported"} status
 * @property {string | null} [frontendUrl]
 * @property {string | null} [backendHealthUrl]
 * @property {string | null} [reason]
 */

/**
 * @typedef {Object} QaStageSummary
 * @property {string} name
 * @property {"PASS"|"FAIL"|"SKIP"} status
 * @property {string} details
 */

/**
 * @typedef {Object} QaResult
 * @property {"PASS"|"FAIL"} status
 * @property {string | null} failedStage
 * @property {QaStageSummary[]} stages
 * @property {string | null} [failureClass]
 */

/**
 * @typedef {Object} TaskState
 * @property {string} taskId
 * @property {string} title
 * @property {string} slug
 * @property {string} branch
 * @property {string} sourceBranch
 * @property {string} repoRoot
 * @property {string} worktreePath
 * @property {string} createdAt
 * @property {string} seedMessage
 * @property {"started"|"qa_pass"|"qa_fail"|"finished"|"merged"|"released"} status
 * @property {string | null} [qaLastPassSha]
 * @property {string | null} [qaLastPassAt]
 * @property {string | null} [previewPreparedSha]
 * @property {PreviewCheckpoint | null} [preview]
 * @property {QaResult | null} [lastQaResult]
 * @property {string | null} [commitSha]
 * @property {string | null} [publishStatus]
 * @property {string | null} [cleanupDecision]
 * @property {"kept"|"passed"|"failed"|null} [cleanupStatus]
 * @property {string[]} [cleanupTargets]
 * @property {string | null} [finishedAt]
 * @property {string[]} [operationalArtifacts]
 * @property {string | null} [mainWorktreePath]
 */

/**
 * @typedef {Object} HistoryEvent
 * @property {string} at
 * @property {string} type
 * @property {string} taskId
 * @property {string} branch
 * @property {Record<string, unknown>} payload
 */

/**
 * @typedef {Object} ParsedArgs
 * @property {Record<string, string | boolean | string[]>} flags
 * @property {string[]} positionals
 */

/**
 * @typedef {Object} CommandResult
 * @property {number} status
 * @property {string} stdout
 * @property {string} stderr
 */

export const OPERATIONAL_DOCS = [
  "Docs/qa-implementation-log.md",
  "Docs/triz-usage-log.md",
  "CODEX_MEMORY.md"
];

export const REQUIRED_COMMANDS = [
  "lint",
  "lint:fix:changed",
  "skills:link",
  "skills:status",
  "skills:unlink",
  "rule-sync:scan",
  "rule-sync:report",
  "rule-sync:apply-plan",
  "rule-share:scan",
  "rule-share:report",
  "rule-share:apply-plan",
  "typecheck",
  "test",
  "build",
  "qa:agent",
  "qa:smoke:pr",
  "qa:e2e:nightly",
  "qa:security",
  "qa:coverage:critical",
  "qa:perf:critical",
  "task:start",
  "task:test",
  "task:qa:agent",
  "task:finish:core",
  "task:merge:main",
  "task:history",
  "task:ledger",
  "task:operational-docs:capture",
  "task:operational-docs:sync",
  "release:local"
];

export const REQUIRED_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  ".cursorrules",
  "CODEX_MEMORY.md",
  ".memory-bank/index.md",
  ".memory-bank/product-charter.md",
  ".memory-bank/starter-rule-registry.json",
  ".memory-bank/project-context.md",
  ".memory-bank/architecture-map.md",
  ".memory-bank/code-rules.md",
  ".memory-bank/qa-playbook.md",
  "Docs/change-ledger.md",
  "Docs/task-history.md",
  "Docs/qa-baseline.md",
  "Docs/qa-implementation-log.md",
  "Docs/triz-usage-log.md",
  "Docs/codex-code-review.md",
  "Docs/qa-perf-baseline.json",
  "plans/_template.md",
  "plans/_bugfix_template.md",
  "scripts/README.md",
  "scripts/skills-manage.mjs",
  "scripts/rule-sync.mjs",
  "scripts/rule-share.mjs",
  "scripts/lib/skills-manager.mjs",
  "research/triz/knowledge-pack.md",
  "research/triz/agent-prompt-v2.md",
  "research/triz/case-library.md",
  "skills/worktree-create/SKILL.md",
  "skills/worktree-finish/SKILL.md",
  "skills/starter-rule-report/SKILL.md",
  "skills/starter-rule-import/SKILL.md",
  "skills/starter-rule-sync/SKILL.md",
  "skills/starter-rule-share/SKILL.md",
  "templates/agent-workspace/README.md",
  "templates/agent-workspace/SOUL.template.md",
  "templates/agent-workspace/USER.template.md",
  "templates/agent-workspace/MEMORY.template.md",
  "templates/agent-workspace/memory/L0_INDEX.template.md",
  "templates/shared-skills-submodule/README.md",
  "package.json",
  "tsconfig.json"
];

const CYRILLIC_SLUG_OVERRIDES = new Map([
  ["эхо", "echo"]
]);

const CYRILLIC_TO_LATIN = new Map([
  ["а", "a"],
  ["б", "b"],
  ["в", "v"],
  ["г", "g"],
  ["д", "d"],
  ["е", "e"],
  ["ё", "yo"],
  ["ж", "zh"],
  ["з", "z"],
  ["и", "i"],
  ["й", "y"],
  ["к", "k"],
  ["л", "l"],
  ["м", "m"],
  ["н", "n"],
  ["о", "o"],
  ["п", "p"],
  ["р", "r"],
  ["с", "s"],
  ["т", "t"],
  ["у", "u"],
  ["ф", "f"],
  ["х", "h"],
  ["ц", "ts"],
  ["ч", "ch"],
  ["ш", "sh"],
  ["щ", "sch"],
  ["ъ", ""],
  ["ы", "y"],
  ["ь", ""],
  ["э", "e"],
  ["ю", "yu"],
  ["я", "ya"]
]);

/**
 * @param {string} cwd
 * @param {string} command
 * @param {string[]} args
 * @param {{allowFailure?: boolean, env?: Record<string, string | undefined>}} [options]
 * @returns {CommandResult}
 */
export function runCommand(cwd, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...options.env },
    encoding: "utf8"
  });

  const status = result.status ?? 1;
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  if (status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(" ")} failed (${status})\n${stderr || stdout}`);
  }

  return { status, stdout, stderr };
}

/**
 * @param {string} word
 * @returns {string}
 */
function transliterateCyrillicWord(word) {
  const override = CYRILLIC_SLUG_OVERRIDES.get(word);
  if (override) {
    return override;
  }
  return Array.from(word, (character) => CYRILLIC_TO_LATIN.get(character) ?? character).join("");
}

/**
 * @param {string} input
 * @returns {string}
 */
export function slugify(input) {
  const transliterated = input
    .toLowerCase()
    .replace(/[\u0400-\u04ff]+/g, (word) => transliterateCyrillicWord(word));
  const normalized = transliterated
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return normalized || "task";
}

/**
 * @param {Date} [date]
 * @returns {string}
 */
export function formatIso(date = new Date()) {
  return date.toISOString();
}

/**
 * @param {Date} [date]
 * @returns {string}
 */
export function createTaskId(date = new Date()) {
  /**
   * @param {number} value
   * @returns {string}
   */
  const pad = (value) => String(value).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  const entropy = Math.random().toString(16).slice(2, 6);
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}-${entropy}`;
}

/**
 * @returns {string}
 */
export function getCodexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

/**
 * @param {string} repoRoot
 * @returns {{gitCommonDir: string, pipelineDir: string, tasksDir: string, historyDir: string, artifactsDir: string}}
 */
export function getPipelinePaths(repoRoot) {
  const commonDirRaw = runCommand(repoRoot, "git", ["rev-parse", "--git-common-dir"]).stdout.trim();
  const gitCommonDir = path.resolve(repoRoot, commonDirRaw);
  const pipelineDir = path.join(gitCommonDir, "codex-task-pipeline");
  return {
    gitCommonDir,
    pipelineDir,
    tasksDir: path.join(pipelineDir, "tasks"),
    historyDir: path.join(pipelineDir, "history"),
    artifactsDir: path.join(pipelineDir, "artifacts")
  };
}

/**
 * @param {string} repoRoot
 * @returns {Promise<void>}
 */
export async function ensurePipelineDirs(repoRoot) {
  const { tasksDir, historyDir, artifactsDir } = getPipelinePaths(repoRoot);
  await mkdir(tasksDir, { recursive: true });
  await mkdir(historyDir, { recursive: true });
  await mkdir(artifactsDir, { recursive: true });
}

/**
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  return existsSync(filePath);
}

/**
 * @template T
 * @param {string} filePath
 * @returns {Promise<T | null>}
 */
export async function readJson(filePath) {
  if (!(await fileExists(filePath))) {
    return null;
  }
  const content = await readFile(filePath, "utf8");
  return /** @type {T} */ (JSON.parse(content));
}

/**
 * @param {string} filePath
 * @param {unknown} value
 * @returns {Promise<void>}
 */
export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

/**
 * @param {string} filePath
 * @param {HistoryEvent} event
 * @returns {Promise<void>}
 */
export async function appendNdjson(filePath, event) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const current = (await fileExists(filePath)) ? await readFile(filePath, "utf8") : "";
  await writeFile(filePath, `${current}${JSON.stringify(event)}\n`, "utf8");
}

/**
 * @param {string} filePath
 * @returns {Promise<HistoryEvent[]>}
 */
export async function readNdjson(filePath) {
  if (!(await fileExists(filePath))) {
    return [];
  }
  const content = await readFile(filePath, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => /** @type {HistoryEvent} */ (JSON.parse(line)));
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function getCurrentBranch(repoRoot) {
  return runCommand(repoRoot, "git", ["branch", "--show-current"]).stdout.trim();
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function getHeadSha(repoRoot) {
  return runCommand(repoRoot, "git", ["rev-parse", "HEAD"]).stdout.trim();
}

/**
 * @param {string} repoRoot
 * @returns {boolean}
 */
export function isGitDirty(repoRoot) {
  const result = runCommand(repoRoot, "git", ["status", "--porcelain"], { allowFailure: true });
  return result.stdout.trim().length > 0;
}

/**
 * @param {string} repoRoot
 * @param {string} [remote]
 * @returns {boolean}
 */
export function hasRemote(repoRoot, remote = "origin") {
  const remotes = runCommand(repoRoot, "git", ["remote"], { allowFailure: true }).stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return remotes.includes(remote);
}

/**
 * @param {string} repoRoot
 * @param {string} ref
 * @returns {boolean}
 */
export function gitRefExists(repoRoot, ref) {
  const result = runCommand(repoRoot, "git", ["rev-parse", "--verify", ref], { allowFailure: true });
  return result.status === 0;
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function resolveBaseRef(repoRoot) {
  if (gitRefExists(repoRoot, "refs/remotes/origin/main")) {
    return "origin/main";
  }
  if (gitRefExists(repoRoot, "refs/heads/main")) {
    return "main";
  }
  return "HEAD";
}

/**
 * @param {string} cwd
 * @returns {string}
 */
export function findGitRoot(cwd) {
  const result = runCommand(cwd, "git", ["rev-parse", "--show-toplevel"], { allowFailure: true });
  if (result.status !== 0) {
    throw new Error("Current directory is not inside a git repository.");
  }
  return result.stdout.trim();
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function getRepoName(repoRoot) {
  return path.basename(repoRoot);
}

/**
 * @param {string} repoRoot
 * @param {string} taskId
 * @returns {string}
 */
export function getTaskStatePath(repoRoot, taskId) {
  return path.join(getPipelinePaths(repoRoot).tasksDir, `${taskId}.json`);
}

/**
 * @param {string} repoRoot
 * @param {string} taskId
 * @returns {string}
 */
export function getTaskArtifactsDir(repoRoot, taskId) {
  return path.join(getPipelinePaths(repoRoot).artifactsDir, taskId);
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
export function getHistoryPath(repoRoot) {
  return path.join(getPipelinePaths(repoRoot).historyDir, "events.ndjson");
}

/**
 * @param {string} repoRoot
 * @returns {Promise<TaskState[]>}
 */
export async function loadAllTaskStates(repoRoot) {
  await ensurePipelineDirs(repoRoot);
  const { tasksDir } = getPipelinePaths(repoRoot);
  const entries = await readdir(tasksDir, { withFileTypes: true });
  const states = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const state = await readJson(path.join(tasksDir, entry.name));
    if (state) {
      states.push(/** @type {TaskState} */ (state));
    }
  }
  return states;
}

/**
 * @param {string} repoRoot
 * @param {string} branch
 * @returns {Promise<TaskState | null>}
 */
export async function loadTaskStateByBranch(repoRoot, branch) {
  const states = await loadAllTaskStates(repoRoot);
  return states.find((state) => state.branch === branch) ?? null;
}

/**
 * @param {string} repoRoot
 * @param {string} taskId
 * @returns {Promise<TaskState | null>}
 */
export async function loadTaskStateByTaskId(repoRoot, taskId) {
  const states = await loadAllTaskStates(repoRoot);
  return states.find((state) => state.taskId === taskId) ?? null;
}

/**
 * @param {string} repoRoot
 * @param {TaskState} state
 * @returns {Promise<void>}
 */
export async function saveTaskState(repoRoot, state) {
  await ensurePipelineDirs(repoRoot);
  await writeJson(getTaskStatePath(repoRoot, state.taskId), state);
}

/**
 * @param {string} repoRoot
 * @param {HistoryEvent} event
 * @returns {Promise<void>}
 */
export async function appendHistoryEvent(repoRoot, event) {
  await ensurePipelineDirs(repoRoot);
  await appendNdjson(getHistoryPath(repoRoot), event);
}

/**
 * @param {string[]} argv
 * @returns {ParsedArgs}
 */
export function parseArgs(argv) {
  /** @type {Record<string, string | boolean | string[]>} */
  const flags = {};
  /** @type {string[]} */
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }
    if (flags[key]) {
      const current = flags[key];
      if (Array.isArray(current)) {
        current.push(next);
      } else {
        flags[key] = [String(current), next];
      }
    } else {
      flags[key] = next;
    }
    index += 1;
  }

  return { flags, positionals };
}

/**
 * @param {string} repoRoot
 * @returns {Promise<string[]>}
 */
export async function listRepoFiles(repoRoot) {
  /** @type {string[]} */
  const files = [];
  const ignored = new Set([
    ".git",
    "node_modules",
    "tmp",
    "runtime",
    "coverage",
    "playwright-report",
    ".playwright-cli",
    ".next",
    "out",
    "output"
  ]);

  /**
   * @param {string} currentDir
   * @returns {Promise<void>}
   */
  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignored.has(entry.name)) {
        continue;
      }
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(repoRoot, absolutePath);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      files.push(relativePath);
    }
  }

  await walk(repoRoot);
  return files.sort();
}

/**
 * @param {string} repoRoot
 * @returns {Promise<Array<{path: string, size: number}>>}
 */
export async function listRepoFilesWithSize(repoRoot) {
  const files = await listRepoFiles(repoRoot);
  const results = [];
  for (const file of files) {
    const fileStat = await stat(path.join(repoRoot, file));
    results.push({ path: file, size: fileStat.size });
  }
  return results;
}

/**
 * @param {string} repoRoot
 * @returns {Promise<Array<{path: string, branch: string | null, head: string | null}>>}
 */
export async function getWorktreeList(repoRoot) {
  const output = runCommand(repoRoot, "git", ["worktree", "list", "--porcelain"]).stdout.trim();
  if (!output) {
    return [];
  }
  return output
    .split("\n\n")
    .map((chunk) => chunk.split("\n"))
    .map((lines) => {
      const worktree = lines.find((line) => line.startsWith("worktree "))?.replace("worktree ", "") ?? "";
      const branchLine = lines.find((line) => line.startsWith("branch "));
      const headLine = lines.find((line) => line.startsWith("HEAD "));
      return {
        path: worktree,
        branch: branchLine ? branchLine.replace("branch refs/heads/", "") : null,
        head: headLine ? headLine.replace("HEAD ", "") : null
      };
    });
}

/**
 * @param {string} repoRoot
 * @returns {Promise<string | null>}
 */
export async function findMainWorktree(repoRoot) {
  const worktrees = await getWorktreeList(repoRoot);
  const currentBranch = getCurrentBranch(repoRoot);
  if (currentBranch === "main") {
    return repoRoot;
  }
  const mainWorktree = worktrees.find((entry) => entry.branch === "main");
  return mainWorktree?.path ?? null;
}

/**
 * @param {string} repoRoot
 * @returns {Promise<string[]>}
 */
export async function getChangedFiles(repoRoot) {
  const result = runCommand(repoRoot, "git", ["status", "--porcelain"], { allowFailure: true }).stdout;
  return result
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

/**
 * @param {string} repoRoot
 * @returns {Promise<string[]>}
 */
export async function getTrackedChangedFiles(repoRoot) {
  const result = runCommand(repoRoot, "git", ["status", "--porcelain", "--untracked-files=no"], {
    allowFailure: true
  }).stdout;
  return result
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

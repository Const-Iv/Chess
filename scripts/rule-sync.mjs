// @ts-check

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findGitRoot, formatIso, getCodexHome, parseArgs, runCommand } from "./lib/runtime.mjs";

const THIS_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.dirname(path.dirname(THIS_FILE));
const RULE_SYNC_DIR = "runtime/rule-sync";
const SCANS_DIR = "scans";
const REPORTS_DIR = "reports";
const DEFAULT_MAX_DEPTH = 5;
const ZERO_PROBE_FALLBACK_MAX_WINDOW_MS = 15 * 60 * 1000;
const ZERO_PROBE_FALLBACK_MAX_GENERATED_DELTA_MS = 15 * 60 * 1000;
const ZERO_PROBE_FALLBACK_BOUNDARY_TOLERANCE_MS = 60 * 1000;
const GOVERNANCE_FILES = new Set(["AGENTS.md", "CODEX_MEMORY.md", "CLAUDE.md", ".cursorrules", "README.md"]);
const GOVERNANCE_PREFIXES = [
  ".memory-bank/",
  "plans/_template.md",
  "plans/reference/",
  "Docs/qa-implementation-log.md",
  "Docs/triz-usage-log.md",
  "research/triz/",
  "_bmad/",
  ".agents/",
  ".claude/",
  ".cursor/"
];
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "runtime",
  "tmp",
  "coverage",
  "playwright-report",
  ".next",
  "dist",
  "build"
]);
const PRODUCT_SPECIFIC_TOKENS = [
  "agent_const",
  "agent const",
  "telegram",
  "calendar",
  "gmail",
  "crm",
  "wannadinner",
  "restaurant",
  "delivery",
  "fireflies",
  "fathom",
  "avatar",
  "ollama",
  "gemma",
  "gantt-bb",
  "business booster",
  "школа ассистентов",
  "industry-watch",
  "relationship",
  "inbox"
];
const REUSABLE_TOKENS = [
  "starter",
  "baseline",
  "governance",
  "source of truth",
  "qa",
  "deterministic",
  "worktree",
  "task:start",
  "task:finish",
  "task:merge",
  "release:local",
  "memory-bank",
  "product charter",
  "mission",
  "vision",
  "миссия",
  "видение",
  "цель",
  "jtbd",
  "triz",
  "skill",
  "skills",
  "cleanup",
  "previewpreparedsha",
  "plan template"
];
const SECRET_PATTERN = /(token|secret|password|credential|api[_-]?key|private key|session|phone|auth)/i;

/**
 * @typedef {"import_candidate"|"needs_review"|"product_specific"} RuleCategory
 */

/**
 * @typedef {Object} RuleSyncConfig
 * @property {string[]} [roots]
 * @property {string[]} [allowlist]
 * @property {string[]} [ignorelist]
 */

/**
 * @typedef {Object} DiscoveredProject
 * @property {string} label
 * @property {string} repoRoot
 * @property {string} gitCommonDir
 * @property {boolean} hasTaskPipeline
 */

/**
 * @typedef {Object} RuleCandidate
 * @property {string} id
 * @property {RuleCategory} category
 * @property {string} sourceProject
 * @property {string} sourceRepo
 * @property {"task"|"commit"|"worktree_diff"} sourceType
 * @property {string | null} taskId
 * @property {string | null} branch
 * @property {string | null} commitSha
 * @property {string} title
 * @property {string[]} paths
 * @property {string[]} snippets
 * @property {string[]} suggestedTargetFiles
 * @property {string} summary
 * @property {string} evidence
 * @property {"high"|"medium"|"low"} confidence
 * @property {string[]} classifierReasons
 */

/**
 * @typedef {Object} RuleSyncSnapshot
 * @property {1} schemaVersion
 * @property {string} generatedAt
 * @property {string} since
 * @property {string} until
 * @property {string} repoRoot
 * @property {DiscoveredProject[]} projects
 * @property {RuleCandidate[]} candidates
 * @property {string[]} diagnostics
 */

/**
 * @typedef {Object} ScanSelection
 * @property {string} scanPath
 * @property {string} latestPath
 * @property {"latest"|"fallback_meaningful_probe"} source
 * @property {string | null} reason
 */

/**
 * @typedef {Object} ScanOptions
 * @property {string} repoRoot
 * @property {Date} since
 * @property {Date} until
 * @property {string[]} [roots]
 * @property {RuleSyncConfig} [config]
 * @property {number} [maxDepth]
 */

/**
 * @typedef {Object} ApplyApproval
 * @property {string[]} [approved]
 * @property {Record<string, string>} [corrections]
 */

/**
 * @typedef {Object} DecisionProposal
 * @property {string} title
 * @property {"import"|"rewrite"|"reject"|"review"} recommendation
 * @property {string[]} jobStories
 * @property {string[]} userStories
 * @property {string[]} acceptanceCriteria
 * @property {RuleCandidate[]} candidates
 */

/**
 * @param {string} input
 * @returns {string}
 */
function normalizePath(input) {
  return input.split(path.sep).join("/");
}

/**
 * @param {string} input
 * @returns {string}
 */
function shortHash(input) {
  return createHash("sha256").update(input).digest("hex").slice(0, 10);
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isGovernancePath(value) {
  const normalized = normalizePath(value).replace(/^\.\//, "");
  if (GOVERNANCE_FILES.has(normalized)) {
    return true;
  }
  return GOVERNANCE_PREFIXES.some((prefix) => normalized === prefix.replace(/\/$/, "") || normalized.startsWith(prefix));
}

/**
 * @param {string[]} values
 * @returns {string[]}
 */
function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

/**
 * @param {string} input
 * @returns {string}
 */
function sanitizeSnippet(input) {
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (!cleaned || SECRET_PATTERN.test(cleaned)) {
    return "";
  }
  return cleaned.length > 180 ? `${cleaned.slice(0, 177)}...` : cleaned;
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatDateStamp(date) {
  return date.toISOString().replaceAll(":", "").replaceAll(".", "").replace("T", "-").replace("Z", "Z");
}

/**
 * @param {string} value
 * @param {"start"|"end"} boundary
 * @returns {Date}
 */
export function parseBoundaryDate(value, boundary) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    if (boundary === "end") {
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
}

/**
 * @param {Date} [now]
 * @returns {{since: Date, until: Date}}
 */
export function previousLocalDayWindow(now = new Date()) {
  const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
  const until = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return { since, until };
}

/**
 * @param {string} repoRoot
 * @param {Date} [now]
 * @returns {Promise<{since: Date, until: Date, source: "latest_scan"|"previous_local_day"}>}
 */
export async function defaultScanWindow(repoRoot, now = new Date()) {
  const scanPath = await latestScanPath(repoRoot);
  if (scanPath) {
    const snapshot = await readSnapshot(scanPath).catch(() => null);
    const latestUntil = snapshot ? new Date(snapshot.until) : null;
    if (latestUntil && !Number.isNaN(latestUntil.getTime()) && latestUntil.getTime() <= now.getTime()) {
      return { since: latestUntil, until: now, source: "latest_scan" };
    }
  }

  return { ...previousLocalDayWindow(now), source: "previous_local_day" };
}

/**
 * @param {string} repoRoot
 * @returns {Promise<RuleSyncConfig>}
 */
async function loadLocalConfig(repoRoot) {
  const configPath = path.join(repoRoot, RULE_SYNC_DIR, "config.json");
  if (!existsSync(configPath)) {
    return {};
  }
  const raw = JSON.parse(await readFile(configPath, "utf8"));
  return {
    roots: Array.isArray(raw.roots) ? raw.roots.map(String) : [],
    allowlist: Array.isArray(raw.allowlist) ? raw.allowlist.map(String) : [],
    ignorelist: Array.isArray(raw.ignorelist) ? raw.ignorelist.map(String) : []
  };
}

/**
 * @param {string} repoRoot
 * @returns {string[]}
 */
function defaultDiscoveryRoots(repoRoot) {
  return uniqueSorted([path.dirname(repoRoot), path.join(getCodexHome(), "worktrees")]);
}

/**
 * @param {string} root
 * @param {number} maxDepth
 * @returns {Promise<string[]>}
 */
async function findGitRepositories(root, maxDepth) {
  if (!existsSync(root)) {
    return [];
  }
  /** @type {string[]} */
  const repos = [];

  /**
   * @param {string} current
   * @param {number} depth
   * @returns {Promise<void>}
   */
  async function walk(current, depth) {
    const gitPath = path.join(current, ".git");
    if (existsSync(gitPath)) {
      repos.push(current);
      return;
    }
    if (depth >= maxDepth) {
      return;
    }
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) {
        continue;
      }
      await walk(path.join(current, entry.name), depth + 1);
    }
  }

  await walk(root, 0);
  return repos;
}

/**
 * @param {string} repoRoot
 * @returns {string | null}
 */
function gitCommonDir(repoRoot) {
  const result = runCommand(repoRoot, "git", ["rev-parse", "--git-common-dir"], { allowFailure: true });
  if (result.status !== 0) {
    return null;
  }
  const raw = result.stdout.trim();
  return path.resolve(repoRoot, raw);
}

/**
 * @param {string} repoRoot
 * @returns {string | null}
 */
function gitRoot(repoRoot) {
  const result = runCommand(repoRoot, "git", ["rev-parse", "--show-toplevel"], { allowFailure: true });
  return result.status === 0 ? result.stdout.trim() : null;
}

/**
 * @param {string} candidate
 * @returns {Promise<string>}
 */
async function canonicalPath(candidate) {
  return realpath(candidate).catch(() => path.resolve(candidate));
}

/**
 * @param {string[]} ignorelist
 * @param {string} repoRoot
 * @returns {Promise<boolean>}
 */
async function isIgnored(ignorelist, repoRoot) {
  const resolved = await canonicalPath(repoRoot);
  for (const item of ignorelist) {
    const ignored = await canonicalPath(item);
    if (resolved === ignored || resolved.startsWith(`${ignored}${path.sep}`)) {
      return true;
    }
  }
  return false;
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
function projectLabel(repoRoot) {
  return path.basename(repoRoot).trim() || repoRoot;
}

/**
 * @param {string} repoRoot
 * @returns {Promise<DiscoveredProject[]>}
 */
export async function discoverProjects(repoRoot) {
  const localConfig = await loadLocalConfig(repoRoot);
  const config = localConfig;
  const roots = uniqueSorted([
    ...defaultDiscoveryRoots(repoRoot),
    ...(config.roots ?? []).map((item) => path.resolve(repoRoot, item))
  ]);
  const explicitRepos = (config.allowlist ?? []).map((item) => path.resolve(repoRoot, item));
  const discovered = [];
  for (const root of roots) {
    discovered.push(...(await findGitRepositories(root, DEFAULT_MAX_DEPTH)));
  }
  discovered.push(...explicitRepos);

  const targetCommonDir = gitCommonDir(repoRoot);
  /** @type {Map<string, DiscoveredProject>} */
  const byCommonDir = new Map();
  for (const candidate of uniqueSorted(discovered)) {
    const root = gitRoot(candidate);
    if (!root || (await isIgnored(config.ignorelist ?? [], root))) {
      continue;
    }
    const commonDir = gitCommonDir(root);
    if (!commonDir || commonDir === targetCommonDir) {
      continue;
    }
    const existing = byCommonDir.get(commonDir);
    const prefersCandidate = !existing || existing.repoRoot.includes(`${path.sep}.codex${path.sep}worktrees${path.sep}`);
    if (prefersCandidate) {
      byCommonDir.set(commonDir, {
        label: projectLabel(root),
        repoRoot: root,
        gitCommonDir: commonDir,
        hasTaskPipeline: existsSync(path.join(commonDir, "codex-task-pipeline", "tasks"))
      });
    }
  }
  return [...byCommonDir.values()].sort((left, right) => left.label.localeCompare(right.label));
}

/**
 * @param {string} repoRoot
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
async function readHistoryEvents(repoRoot) {
  const commonDir = gitCommonDir(repoRoot);
  if (!commonDir) {
    return [];
  }
  const historyPath = path.join(commonDir, "codex-task-pipeline", "history", "events.ndjson");
  if (!existsSync(historyPath)) {
    return [];
  }
  try {
    return (await readFile(historyPath, "utf8"))
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((item) => item && typeof item === "object");
  } catch {
    return [];
  }
}

/**
 * @param {string} repoRoot
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
async function readTaskStates(repoRoot) {
  const commonDir = gitCommonDir(repoRoot);
  if (!commonDir) {
    return [];
  }
  const tasksDir = path.join(commonDir, "codex-task-pipeline", "tasks");
  if (!existsSync(tasksDir)) {
    return [];
  }
  const entries = await readdir(tasksDir, { withFileTypes: true }).catch(() => []);
  const states = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    try {
      const raw = JSON.parse(await readFile(path.join(tasksDir, entry.name), "utf8"));
      if (raw && typeof raw === "object") {
        states.push(raw);
      }
    } catch {
      // Ignore malformed task state files; diagnostics are emitted at project level.
    }
  }
  return states;
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} key
 * @returns {string}
 */
function stringField(item, key) {
  return key in item && typeof item[key] === "string" ? String(item[key]) : "";
}

/**
 * @param {Record<string, unknown>} item
 * @returns {Date | null}
 */
function itemDate(item) {
  for (const key of ["at", "createdAt", "finishedAt", "qaLastPassAt"]) {
    const value = stringField(item, key);
    if (!value) {
      continue;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

/**
 * @param {Date | null} date
 * @param {Date} since
 * @param {Date} until
 * @returns {boolean}
 */
function inWindow(date, since, until) {
  return Boolean(date && date >= since && date < until);
}

/**
 * @param {string} repoRoot
 * @param {string} commitSha
 * @returns {string[]}
 */
function commitPaths(repoRoot, commitSha) {
  const result = runCommand(repoRoot, "git", ["show", "--pretty=format:", "--name-only", commitSha, "--"], {
    allowFailure: true
  });
  return result.status === 0 ? uniqueSorted(result.stdout.split("\n").map((line) => line.trim()).filter(isGovernancePath)) : [];
}

/**
 * @param {string} repoRoot
 * @param {string} commitSha
 * @returns {string}
 */
function commitSubject(repoRoot, commitSha) {
  const result = runCommand(repoRoot, "git", ["show", "-s", "--format=%s", commitSha], { allowFailure: true });
  return result.status === 0 ? result.stdout.trim() : "";
}

/**
 * @param {string} repoRoot
 * @param {string} commitSha
 * @param {string[]} paths
 * @returns {string[]}
 */
function commitSnippets(repoRoot, commitSha, paths) {
  const result = runCommand(repoRoot, "git", ["show", "--format=", "--unified=0", commitSha, "--", ...paths], {
    allowFailure: true
  });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => sanitizeSnippet(line.slice(1)))
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * @param {string} repoRoot
 * @param {string[]} paths
 * @returns {string[]}
 */
function worktreeSnippets(repoRoot, paths) {
  const result = runCommand(repoRoot, "git", ["diff", "--unified=0", "--", ...paths], { allowFailure: true });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => sanitizeSnippet(line.slice(1)))
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * @param {string} repoRoot
 * @param {Date} since
 * @param {Date} until
 * @returns {Array<{sha: string, subject: string}>}
 */
function governanceCommits(repoRoot, since, until) {
  const result = runCommand(
    repoRoot,
    "git",
    [
      "log",
      `--since=${since.toISOString()}`,
      `--until=${until.toISOString()}`,
      "--format=%H%x09%s",
      "--",
      ...[...GOVERNANCE_FILES],
      ...GOVERNANCE_PREFIXES
    ],
    { allowFailure: true }
  );
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sha = "", subject = ""] = line.split("\t");
      return { sha, subject };
    })
    .filter((item) => item.sha);
}

/**
 * @param {string[]} paths
 * @returns {string[]}
 */
function suggestedTargets(paths) {
  const targets = paths.map((item) => {
    if (item.startsWith("Docs/") || item.startsWith("plans/")) {
      return "AGENTS.md / .memory-bank/*";
    }
    return item;
  });
  return uniqueSorted(targets.length > 0 ? targets : ["AGENTS.md", ".memory-bank/code-rules.md"]);
}

/**
 * @param {{title: string, paths: string[], snippets: string[]}} input
 * @returns {{category: RuleCategory, reasons: string[]}}
 */
export function classifyRuleCandidate(input) {
  const haystack = [input.title, ...input.paths, ...input.snippets].join(" ").toLowerCase();
  const reusableHits = REUSABLE_TOKENS.filter((token) => haystack.includes(token));
  const productHits = PRODUCT_SPECIFIC_TOKENS.filter((token) => haystack.includes(token));
  if (productHits.length > 0 && reusableHits.length === 0) {
    return { category: "product_specific", reasons: productHits.map((token) => `product:${token}`) };
  }
  if (productHits.length > 0) {
    return {
      category: "needs_review",
      reasons: [...reusableHits.map((token) => `reusable:${token}`), ...productHits.map((token) => `product:${token}`)]
    };
  }
  if (reusableHits.length > 0) {
    return { category: "import_candidate", reasons: reusableHits.map((token) => `reusable:${token}`) };
  }
  return { category: "needs_review", reasons: ["no strong reusable/product-specific signal"] };
}

/**
 * @param {Omit<RuleCandidate, "id"|"category"|"classifierReasons"|"suggestedTargetFiles"|"summary"> & {summary?: string}} input
 * @returns {RuleCandidate}
 */
function buildCandidate(input) {
  const classifier = classifyRuleCandidate({ title: input.title, paths: input.paths, snippets: input.snippets });
  const summary = input.summary || `Изменены governance paths: ${input.paths.join(", ") || "не определены"}.`;
  const identity = [input.sourceProject, input.sourceType, input.taskId, input.commitSha, input.paths.join(","), input.title].join("|");
  return {
    ...input,
    id: `rs-${shortHash(identity)}`,
    category: classifier.category,
    classifierReasons: classifier.reasons,
    suggestedTargetFiles: suggestedTargets(input.paths),
    summary
  };
}

/**
 * @param {DiscoveredProject} project
 * @param {Date} since
 * @param {Date} until
 * @returns {Promise<{candidates: RuleCandidate[], diagnostics: string[]}>}
 */
async function collectProjectCandidates(project, since, until) {
  /** @type {RuleCandidate[]} */
  const candidates = [];
  /** @type {string[]} */
  const diagnostics = [];
  const states = await readTaskStates(project.repoRoot);
  const events = await readHistoryEvents(project.repoRoot);
  /** @type {Map<string, Array<Record<string, unknown>>>} */
  const eventsByTask = new Map();
  for (const event of events) {
    const taskId = typeof event.taskId === "string" ? event.taskId : "";
    if (!taskId) {
      continue;
    }
    const bucket = eventsByTask.get(taskId) ?? [];
    bucket.push(event);
    eventsByTask.set(taskId, bucket);
  }

  const seenCommits = new Set();
  for (const state of states) {
    const taskId = stringField(state, "taskId");
    const taskEvents = eventsByTask.get(taskId) ?? [];
    const active = inWindow(itemDate(state), since, until) || taskEvents.some((event) => inWindow(itemDate(event), since, until));
    if (!active) {
      continue;
    }

    const commitSha = stringField(state, "commitSha");
    if (commitSha) {
      const paths = commitPaths(project.repoRoot, commitSha);
      if (paths.length > 0) {
        seenCommits.add(commitSha);
        candidates.push(
          buildCandidate({
            sourceProject: project.label,
            sourceRepo: project.repoRoot,
            sourceType: "task",
            taskId,
            branch: stringField(state, "branch") || null,
            commitSha,
            title: stringField(state, "title") || commitSubject(project.repoRoot, commitSha) || taskId,
            paths,
            snippets: commitSnippets(project.repoRoot, commitSha, paths),
            evidence: `task ${taskId}; commit ${commitSha.slice(0, 8)}`,
            confidence: "high"
          })
        );
      }
    }

    const worktreePath = stringField(state, "worktreePath");
    if (worktreePath && existsSync(worktreePath)) {
      const result = runCommand(worktreePath, "git", ["diff", "--name-only"], { allowFailure: true });
      const paths = result.status === 0 ? uniqueSorted(result.stdout.split("\n").map((line) => line.trim()).filter(isGovernancePath)) : [];
      if (paths.length > 0) {
        candidates.push(
          buildCandidate({
            sourceProject: project.label,
            sourceRepo: project.repoRoot,
            sourceType: "worktree_diff",
            taskId,
            branch: stringField(state, "branch") || null,
            commitSha: null,
            title: stringField(state, "title") || taskId,
            paths,
            snippets: worktreeSnippets(worktreePath, paths),
            evidence: `task ${taskId}; uncommitted worktree diff`,
            confidence: "medium"
          })
        );
      }
    }
  }

  for (const commit of governanceCommits(project.repoRoot, since, until)) {
    if (seenCommits.has(commit.sha)) {
      continue;
    }
    const paths = commitPaths(project.repoRoot, commit.sha);
    if (paths.length === 0) {
      continue;
    }
    candidates.push(
      buildCandidate({
        sourceProject: project.label,
        sourceRepo: project.repoRoot,
        sourceType: "commit",
        taskId: null,
        branch: null,
        commitSha: commit.sha,
        title: commit.subject || commit.sha.slice(0, 8),
        paths,
        snippets: commitSnippets(project.repoRoot, commit.sha, paths),
        evidence: `commit ${commit.sha.slice(0, 8)}`,
        confidence: "low"
      })
    );
  }

  if (!project.hasTaskPipeline) {
    diagnostics.push(`${project.label}: task pipeline не найден; git commits учитываются с lower confidence.`);
  }
  return { candidates, diagnostics };
}

/**
 * @param {ScanOptions} options
 * @returns {Promise<RuleSyncSnapshot>}
 */
export async function scanRuleSync(options) {
  const projects = options.roots
    ? await discoverProjectsWithRoots(options.repoRoot, options.roots, options.config ?? {})
    : await discoverProjects(options.repoRoot);
  /** @type {RuleCandidate[]} */
  const candidates = [];
  /** @type {string[]} */
  const diagnostics = [];

  for (const project of projects) {
    const collected = await collectProjectCandidates(project, options.since, options.until);
    candidates.push(...collected.candidates);
    diagnostics.push(...collected.diagnostics);
  }

  const deduped = [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()].sort((left, right) =>
    left.id.localeCompare(right.id)
  );
  return {
    schemaVersion: 1,
    generatedAt: formatIso(),
    since: options.since.toISOString(),
    until: options.until.toISOString(),
    repoRoot: options.repoRoot,
    projects,
    candidates: deduped,
    diagnostics
  };
}

/**
 * Test seam for explicit roots.
 * @param {string} repoRoot
 * @param {string[]} roots
 * @param {RuleSyncConfig} config
 * @returns {Promise<DiscoveredProject[]>}
 */
export async function discoverProjectsWithRoots(repoRoot, roots, config = {}) {
  const discovered = [];
  for (const root of roots) {
    const stats = await stat(root).catch(() => null);
    if (!stats) {
      continue;
    }
    if (existsSync(path.join(root, ".git"))) {
      discovered.push(root);
    } else if (stats.isDirectory()) {
      discovered.push(...(await findGitRepositories(root, DEFAULT_MAX_DEPTH)));
    }
  }
  discovered.push(...(config.allowlist ?? []).map((item) => path.resolve(repoRoot, item)));

  const targetCommonDir = gitCommonDir(repoRoot);
  const projects = [];
  const seen = new Set();
  for (const candidate of uniqueSorted(discovered)) {
    const root = gitRoot(candidate);
    if (!root || (await isIgnored(config.ignorelist ?? [], root))) {
      continue;
    }
    const commonDir = gitCommonDir(root);
    if (!commonDir || commonDir === targetCommonDir || seen.has(commonDir)) {
      continue;
    }
    seen.add(commonDir);
    projects.push({
      label: projectLabel(root),
      repoRoot: root,
      gitCommonDir: commonDir,
      hasTaskPipeline: existsSync(path.join(commonDir, "codex-task-pipeline", "tasks"))
    });
  }
  return projects.sort((left, right) => left.label.localeCompare(right.label));
}

/**
 * @param {RuleCategory} category
 * @returns {string}
 */
function categoryTitle(category) {
  if (category === "import_candidate") {
    return "Кандидаты на импорт";
  }
  if (category === "needs_review") {
    return "Требует ручной проверки";
  }
  return "Пропущено как product-specific";
}

/**
 * @param {RuleCandidate} candidate
 * @returns {boolean}
 */
function isProductPlanningCandidate(candidate) {
  return (
    !isOperationalEvidenceCandidate(candidate) &&
    !isProductSpecificCandidate(candidate) &&
    (candidate.classifierReasons.some((reason) => reason.includes("plan template")) ||
      candidate.paths.some((item) => item === "plans/_template.md"))
  );
}

/**
 * @param {RuleCandidate} candidate
 * @returns {boolean}
 */
function isOperationalEvidenceCandidate(candidate) {
  return candidate.paths.some((item) => item === "Docs/qa-implementation-log.md" || item === "Docs/triz-usage-log.md");
}

/**
 * @param {RuleCandidate} candidate
 * @returns {boolean}
 */
function isMainProtectionCandidate(candidate) {
  const searchable = `${candidate.title} ${candidate.summary} ${candidate.snippets.join(" ")}`.toLowerCase();
  return searchable.includes("main worktree") || searchable.includes("protect main") || searchable.includes("direct `main`");
}

/**
 * @param {RuleCandidate} candidate
 * @returns {boolean}
 */
function isProductSpecificCandidate(candidate) {
  return candidate.classifierReasons.some((reason) => reason.startsWith("product:"));
}

/**
 * @param {RuleCandidate} candidate
 * @returns {boolean}
 */
function isSharedSkillCandidate(candidate) {
  return (
    candidate.paths.some((item) => item.startsWith(".agents/skills/") || item.startsWith(".claude/skills/") || item.startsWith(".cursor/skills/")) ||
    candidate.classifierReasons.some((reason) => reason === "reusable:skill" || reason === "reusable:skills")
  );
}

/**
 * @param {RuleCandidate[]} candidates
 * @param {(candidate: RuleCandidate) => boolean} predicate
 * @returns {RuleCandidate[]}
 */
function matchingCandidates(candidates, predicate) {
  return candidates.filter(predicate).sort((left, right) => left.id.localeCompare(right.id));
}

/**
 * @param {RuleSyncSnapshot} snapshot
 * @returns {DecisionProposal[]}
 */
export function buildDecisionProposals(snapshot) {
  const candidates = snapshot.candidates;
  /** @type {DecisionProposal[]} */
  const proposals = [];
  const productPlanning = matchingCandidates(candidates, isProductPlanningCandidate);
  const operationalEvidence = matchingCandidates(candidates, isOperationalEvidenceCandidate);
  const mainProtection = matchingCandidates(candidates, isMainProtectionCandidate);
  const productSpecific = matchingCandidates(candidates, isProductSpecificCandidate);
  const sharedSkills = matchingCandidates(candidates, isSharedSkillCandidate);

  if (productPlanning.length > 0) {
    proposals.push({
      title: "Сделать отчёт понятным для решения",
      recommendation: "import",
      jobStories: [
        "Когда владелец starter смотрит найденные правила, я хочу сначала видеть смысл и следующий шаг, чтобы не расшифровывать служебные id."
      ],
      userStories: [
        "Как владелец starter, я хочу получать отчёт в формате решения, а не списка технических строк.",
        "Как агент, я хочу оставлять служебные id только для проверки источника."
      ],
      acceptanceCriteria: [
        "Отчёт начинается с связи с charter, цели и понятного пользовательского результата.",
        "Каждая группа объясняет, что делать и как проверить источник.",
        "Служебные id не являются основным способом принять решение."
      ],
      candidates: productPlanning
    });
  }

  if (operationalEvidence.length > 0) {
    proposals.push({
      title: "Из журналов проверок и разбора проблем переносить только общий урок",
      recommendation: "rewrite",
      jobStories: [
        "Когда другой проект фиксирует опыт проверки или разбора проблемы, я хочу переносить в starter только общий урок, чтобы не засорять основу частными историями."
      ],
      userStories: [
        "Как владелец starter, я хочу видеть такие записи как подсказку для нового правила, а не как готовый текст.",
        "Как команда проекта-источника, я хочу, чтобы симптомы моего проекта оставались в моём проекте."
      ],
      acceptanceCriteria: [
        "Номера задач, названия веток, симптомы проекта и детали интерфейса не попадают в starter.",
        "Текст переписан как общее правило для новых проектов.",
        "Источник можно проверить по id предложения и commit."
      ],
      candidates: operationalEvidence
    });
  }

  if (mainProtection.length > 0) {
    proposals.push({
      title: "Сверить защиту main/worktree без дублирования",
      recommendation: "review",
      jobStories: [
        "Когда downstream усиливает защиту `main`, я хочу понять, содержит ли starter уже такой guard, чтобы улучшить wording без дублирования правил."
      ],
      userStories: [
        "Как maintainer, я хочу parity-check между downstream wording и текущими `AGENTS.md` / `.memory-bank/*`.",
        "Как агент, я хочу не создавать вторую версию уже существующего правила."
      ],
      acceptanceCriteria: [
        "If starter already contains the behavior, no new rule is imported.",
        "If downstream wording is clearer, only wording is updated.",
        "The rule still points to managed worktree flow for routine work."
      ],
      candidates: mainProtection
    });
  }

  if (productSpecific.length > 0) {
    proposals.push({
      title: "Частные инструкции конкретного продукта оставить в исходном проекте",
      recommendation: "reject",
      jobStories: [
        "Когда найденное правило связано с конкретным ботом, календарём, базой или доменной интеграцией, я хочу оставить его в исходном проекте, чтобы starter оставался пригодным для разных новых проектов."
      ],
      userStories: [
        "Как владелец starter, я хочу переносить только общее поведение, а не команды и настройки конкретного продукта.",
        "Как команда проекта-источника, я хочу хранить свои частные инструкции у себя."
      ],
      acceptanceCriteria: [
        "Детали Telegram, ботов, баз, календарей и Gantt не попадают в starter.",
        "Общая мысль может быть переписана только как правило для подключаемой надстройки.",
        "Отчёт показывает: оставить в исходном проекте или переписать, а не переносить сразу."
      ],
      candidates: productSpecific
    });
  }

  if (sharedSkills.length > 0) {
    proposals.push({
      title: "Не копировать служебные папки skills, переносить только правило",
      recommendation: "rewrite",
      jobStories: [
        "Когда другой проект меняет созданные инструментами skills, я хочу переносить только правило о том, где хранится исходный skill, чтобы не копировать большие служебные папки в starter."
      ],
      userStories: [
        "Как владелец starter, я хочу хранить общие skills в `skills/`, а созданные инструментами копии держать вне starter.",
        "Как агент, я хочу отличать исходное правило от служебных файлов, которые можно пересоздать."
      ],
      acceptanceCriteria: [
        "Папки `.agents/skills`, `.claude/skills` и `.cursor/skills` не копируются целиком.",
        "Переносится только общее правило о хранении и подключении skills.",
        "Файлы конкретного проекта или инструмента остаются в проекте-источнике."
      ],
      candidates: sharedSkills
    });
  }

  return proposals;
}

/**
 * @param {"import"|"rewrite"|"reject"|"review"} recommendation
 * @returns {string}
 */
function recommendationTitle(recommendation) {
  if (recommendation === "import") {
    return "Перенести";
  }
  if (recommendation === "rewrite") {
    return "Переписать перед переносом";
  }
  if (recommendation === "reject") {
    return "Не переносить в starter";
  }
  return "Проверить вручную";
}

/**
 * @typedef {Object} CandidateTransferDecision
 * @property {"вчистую"|"с адаптацией"|"отклонить"} mode
 * @property {string} recommendation
 * @property {string} adaptation
 */

/**
 * @param {RuleCandidate} candidate
 * @returns {string}
 */
function proposedRuleText(candidate) {
  if (isOperationalEvidenceCandidate(candidate)) {
    return `В проекте зафиксирован опыт проверки или разбора проблемы: "${candidate.title}". Это подсказка для общего правила, а не готовый текст для переноса.`;
  }

  if (candidate.summary.startsWith("Изменены governance paths:")) {
    return `В проекте изменили рабочие правила в файлах: ${candidate.paths.join(", ") || "не определены"}. Нужно прочитать источник и взять только общий смысл.`;
  }

  const snippet = candidate.snippets.find((item) => {
    const trimmed = item.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith("## ") &&
      !trimmed.startsWith("- Branch:") &&
      !trimmed.startsWith("- Reasons:") &&
      !trimmed.startsWith("- Status:")
    );
  });
  if (snippet) {
    return snippet.length > 260 ? `${snippet.slice(0, 257)}...` : snippet;
  }
  return candidate.summary;
}

/**
 * @param {RuleCandidate} candidate
 * @returns {boolean}
 */
function containsProductSpecificText(candidate) {
  const searchable = `${candidate.title} ${candidate.summary} ${candidate.snippets.join(" ")}`.toLowerCase();
  return PRODUCT_SPECIFIC_TOKENS.some((token) => searchable.includes(token));
}

/**
 * @typedef {Object} CandidateReportGroup
 * @property {string} key
 * @property {string} title
 * @property {string} action
 * @property {string} whyUseful
 * @property {string} starterText
 * @property {string} rewriteNotes
 */
/**
 * @param {RuleCandidate} candidate
 * @returns {CandidateReportGroup}
 */
function candidateReportGroup(candidate) {
  const searchable = `${candidate.title} ${candidate.summary} ${candidate.snippets.join(" ")}`.toLowerCase();

  if (isOperationalEvidenceCandidate(candidate)) {
    return {
      key: "qa-triz-evidence",
      title: "Журналы проверок и разбора проблем",
      action: "Не переносить сейчас.",
      whyUseful:
        "Такие записи полезны как сигнал, что где-то возник повтор или конфликт, но сами по себе они не объясняют новое правило для starter.",
      starterText:
        "Текст для starter пока не добавлять. Сначала вручную прочитать источник и сформулировать отдельное правило только если там есть повторяемый урок для всех новых проектов.",
      rewriteNotes:
        "Не переносить номера задач, ветки, симптомы конкретного проекта и описание единичного инцидента. Если общего урока нет, оставить только как подтверждение в проекте-источнике."
    };
  }

  if (searchable.includes("стартуем новый проект") || searchable.includes("starter-project-bootstrap")) {
    return {
      key: "bootstrap-command-flow",
      title: "Старт нового проекта через разговорную команду",
      action: "Перенести одним правилом после подтверждения.",
      whyUseful:
        "Это напрямую помогает starter выполнять свою главную работу: новый проект стартует не с ручного чеклиста, а с понятного безопасного процесса.",
      starterText:
        "Если пользователь пишет `стартуем новый проект`, `запусти новый проект`, `проведи bootstrap нового проекта` или сообщает, что скопировал starter в новый репозиторий, ассистент запускает `starter-project-bootstrap`: создаёт отдельную рабочую папку из чистого `main`, подключает skills из starter, проводит Project Intake и не начинает разработку функций до согласования intake. Если для `skills:link` нужно заменить конфликтующие локальные skills, ассистент отдельно запрашивает явное согласие владельца.",
      rewriteNotes:
        "Объединить похожие источники в одно правило. Не копировать формулировки про конкретный проект; оставить только общий bootstrap-порядок."
    };
  }

  if (searchable.includes("skills:link") || searchable.includes("generated skill") || isSharedSkillCandidate(candidate)) {
    return {
      key: "shared-skills-source",
      title: "Где хранить и как подключать общие skills",
      action: "Перенести только как одно общее правило.",
      whyUseful: "Это защищает starter от копирования служебных папок и оставляет один понятный источник reusable skills.",
      starterText:
        "Общие skills хранятся в repo `skills/` и подключаются через безопасный link flow. Созданные инструментами папки `.agents/skills`, `.claude/skills`, `.cursor/skills` нельзя копировать в starter целиком.",
      rewriteNotes: "Не переносить generated skill trees. Если правило уже покрыто bootstrap-командой, не добавлять второй дубль."
    };
  }

  if (
    searchable.includes("проверки гипотезы") ||
    searchable.includes("hypothesis") ||
    searchable.includes("discovery/intake") ||
    searchable.includes("не считаются утверждёнными")
  ) {
    return {
      key: "hypothesis-stage-not-approved",
      title: "Пока гипотеза не подтверждена, не считать решения утверждёнными",
      action: "Перенести как правило для новых downstream-проектов.",
      whyUseful:
        "Это защищает новые проекты от преждевременных технических и продуктовых решений, которые потом трудно откатить.",
      starterText:
        "Пока проект находится на этапе проверки гипотезы, нельзя считать утверждёнными архитектуру, технологии, способ запуска, коммерческую модель, зоны ответственности и важные продуктовые возможности. Эти решения становятся правилами проекта только после явного согласования в Project Intake, product charter или roadmap.",
      rewriteNotes: "Убрать название проекта-источника и оставить правило как общий guard для downstream-проектов."
    };
  }

  if (
    searchable.includes("mission") ||
    searchable.includes("vision") ||
    searchable.includes("миссия") ||
    searchable.includes("видение")
  ) {
    return {
      key: "mission-vision-intake",
      title: "Миссия и видение формулируются только на уровне проекта",
      action: "Перенести как правило Project Intake.",
      whyUseful:
        "Это не даёт задачам придумывать отдельные миссии и удерживает смысл проекта в одном источнике правды.",
      starterText:
        "В Project Intake миссия должна отвечать: кому проект помогает, какой результат даёт и через что; видение должно описывать желаемое будущее и роль проекта в нём. Миссия и видение пишутся только на уровне проекта, а не для отдельных задач.",
      rewriteNotes: "Сохранить как правило intake; не переносить детали конкретной продуктовой гипотезы."
    };
  }

  if (searchable.includes("project intake") || searchable.includes("capability decisions") || searchable.includes("stack")) {
    return {
      key: "project-intake-before-feature-work",
      title: "Project Intake должен быть согласован до разработки функций",
      action: "Перенести как обязательное правило bootstrap.",
      whyUseful: "Это не даёт новому проекту начать разработку на неподтверждённых допущениях.",
      starterText:
        "Новый downstream-проект сначала проходит Project Intake: mission, vision, цель, аудитория, JTBD, ограничения, сценарии, метрики, выбранные технологии, способ запуска и применимые capability decisions должны быть согласованы до feature/refactor работы.",
      rewriteNotes: "Заменить stack/runtime жаргон на понятные поля intake; не добавлять конкретный provider или stack."
    };
  }

  if (isMainProtectionCandidate(candidate)) {
    return {
      key: "main-worktree-protection",
      title: "Обычные изменения не выполняются напрямую в main",
      action: "Сверить с уже существующим правилом starter.",
      whyUseful: "Это защищает основной проект от случайных правок и сохраняет безопасный рабочий процесс.",
      starterText:
        "Обычные feature, bugfix, refactor и governance изменения выполняются в отдельной рабочей папке/ветке. Прямая правка `main` допустима только после отдельного явного разрешения владельца.",
      rewriteNotes: "Если такое правило уже есть, не добавлять дубль; можно обновить только более понятную формулировку."
    };
  }

  if (searchable.includes("product charter") || searchable.includes("jtbd") || searchable.includes("job stories")) {
    return {
      key: "product-decision-charter-anchor",
      title: "Продуктовое или рабочее решение начинается со смысла, а не с технического списка",
      action: "Перенести как правило для отчётов владельцу.",
      whyUseful:
        "Это делает решения понятными владельцу и снижает риск перенести в starter технический шум вместо полезного правила.",
      starterText:
        "Любое продуктовое или рабочее решение должно начинаться со связи с project charter, затем показывать цель, JTBD, Job Stories, User Stories и критерии приемки. Технический список изменений не должен заменять объяснение смысла и ожидаемого результата.",
      rewriteNotes: "Оставить только общий порядок объяснения решения; не переносить название продукта-источника."
    };
  }

  if (searchable.includes("reload") || searchable.includes("launchd") || searchable.includes("agent-runtime")) {
    return {
      key: "product-agent-reload-profile",
      title: "Перезапуск продуктовых агентов не должен попадать в основу starter",
      action: "Не переносить в основу starter; оставить как настройку конкретного проекта.",
      whyUseful:
        "Это защищает starter от правил, полезных только проектам с конкретными локальными агентами.",
      starterText:
        "Если проекту нужен автоперезапуск локальных агентов после публикации изменений, это оформляется как отдельная настройка конкретного проекта. Starter не должен зашивать Telegram-агентов или локальные команды macOS.",
      rewriteNotes: "Убрать Telegram, launchd и названия локальных агентов из starter. Оставить только мысль: такие настройки живут в конкретном проекте, если они ему действительно нужны."
    };
  }

  if (searchable.includes("telegram") || searchable.includes("gmail") || searchable.includes("inbox")) {
    return {
      key: "multi-source-output-labels",
      title: "В отчётах с несколькими источниками нужно помечать источник записи",
      action: "Переписать без названий конкретных каналов.",
      whyUseful:
        "Это полезно starter как общее правило для отчётов и дайджестов: владелец должен понимать, откуда пришла каждая запись.",
      starterText:
        "Если отчёт или дайджест собирает данные из разных источников, каждая запись должна явно показывать свой источник. Конкретные каналы проекта, например Telegram или Gmail, остаются в проекте-источнике.",
      rewriteNotes: "Не переносить `Telegram`, `Gmail`, `inbox_agent` и локальные названия. Переписать как общее правило для отчётов из нескольких источников."
    };
  }

  const snippet = candidate.snippets.find((item) => item.trim().length > 0);
  if (snippet) {
    return {
      key: `manual-${candidate.id}`,
      title: "Требуется ручная формулировка правила",
      action: "Не переносить без ручной проверки.",
      whyUseful: "Автоматический отчёт не смог достаточно надёжно выделить общее правило.",
      starterText: snippet.length > 320 ? `${snippet.slice(0, 317)}...` : snippet,
      rewriteNotes: "Перед переносом владелец должен подтвердить, что это действительно правило для starter, а не частная деталь проекта."
    };
  }
  return {
    key: `manual-${candidate.id}`,
    title: "Требуется ручная формулировка правила",
    action: "Не переносить без ручной проверки.",
    whyUseful: "Автоматический отчёт не смог достаточно надёжно выделить общее правило.",
    starterText: "Текст для starter пока не сформулирован.",
    rewriteNotes: "Прочитать источник и явно сформулировать правило перед approval."
  };
}

/**
 * @param {RuleCandidate} candidate
 * @returns {CandidateTransferDecision}
 */
function candidateTransferDecision(candidate) {
  if (candidate.category === "product_specific") {
    return {
      mode: "отклонить",
      recommendation: "Не переносить в starter.",
      adaptation:
        "Оставить как правило этого проекта. Если в нём есть общая мысль для всех новых проектов, переписать её отдельно без названий сервисов, команд запуска и деталей конкретного продукта."
    };
  }

  if (isOperationalEvidenceCandidate(candidate)) {
    return {
      mode: "с адаптацией",
      recommendation: "Использовать как подсказку, а не как готовое правило.",
      adaptation:
        "Сформулировать общее правило для starter. Убрать номера задач, названия веток, симптомы конкретного проекта, детали интерфейса и описание единичного инцидента."
    };
  }

  if (isSharedSkillCandidate(candidate)) {
    return {
      mode: "с адаптацией",
      recommendation: "Переносить только смысл правила.",
      adaptation:
        "Не копировать созданные инструментами папки skills целиком. Оставить только правило: общие skills хранятся в `skills/`, подключаются безопасно, а конфликтующие локальные версии заменяются только после отдельного согласия."
    };
  }

  if (candidate.category === "needs_review" || isProductSpecificCandidate(candidate) || containsProductSpecificText(candidate)) {
    return {
      mode: "с адаптацией",
      recommendation: "Нужно сначала отделить общее от частного.",
      adaptation:
        "Перенести только правило, полезное всем новым проектам. Названия продуктов, провайдеров, локальные команды запуска и частные детали оставить в исходном проекте."
    };
  }

  if (isMainProtectionCandidate(candidate)) {
    return {
      mode: "с адаптацией",
      recommendation: "Сравнить с уже существующим правилом starter.",
      adaptation: "Если такое правило уже есть, не добавлять дубль. Можно заменить только формулировку, если новая понятнее."
    };
  }

  return {
    mode: "вчистую",
    recommendation: "Можно перенести после подтверждения владельца.",
    adaptation: "Не требуется. Достаточно сохранить понятную общую формулировку; технические id и запись Git оставить только в строке проверки."
  };
}

/**
 * @param {"high"|"medium"|"low"} confidence
 * @returns {string}
 */
function confidenceTitle(confidence) {
  if (confidence === "high") {
    return "высокая";
  }
  if (confidence === "medium") {
    return "средняя";
  }
  return "низкая";
}

/**
 * @param {RuleCandidate[]} candidates
 * @returns {Map<string, RuleCandidate[]>}
 */
function groupCandidatesByProject(candidates) {
  const groups = /** @type {Map<string, RuleCandidate[]>} */ (new Map());
  for (const candidate of candidates) {
    const existing = groups.get(candidate.sourceProject) ?? [];
    existing.push(candidate);
    groups.set(candidate.sourceProject, existing);
  }
  const entries = [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  return new Map(entries.map(([project, items]) => [project, items.sort((left, right) => left.id.localeCompare(right.id))]));
}

/**
 * @param {RuleCandidate[]} candidates
 * @returns {Map<string, {group: CandidateReportGroup, candidates: RuleCandidate[]}>}
 */
function groupCandidatesByRule(candidates) {
  const groups = /** @type {Map<string, {group: CandidateReportGroup, candidates: RuleCandidate[]}>} */ (new Map());
  for (const candidate of candidates) {
    const group = candidateReportGroup(candidate);
    const existing = groups.get(group.key) ?? { group, candidates: [] };
    existing.candidates.push(candidate);
    groups.set(group.key, existing);
  }

  return new Map(
    [...groups.entries()]
      .sort(([, left], [, right]) => left.group.title.localeCompare(right.group.title))
      .map(([key, value]) => [
        key,
        { group: value.group, candidates: value.candidates.sort((left, right) => left.id.localeCompare(right.id)) }
      ])
  );
}

/**
 * @param {RuleCandidate[]} candidates
 * @returns {string}
 */
function duplicateSummary(candidates) {
  if (candidates.length <= 1) {
    return "Нет, это одиночный источник.";
  }
  return `Да, это одна тема из нескольких источников: ${candidates.map((candidate) => candidate.id).join(", ")}. В starter нужно переносить одно правило, а не повторять каждую запись.`;
}

/**
 * @param {RuleCandidate[]} candidates
 * @returns {string}
 */
function joinedTargets(candidates) {
  return [...new Set(candidates.flatMap((candidate) => candidate.suggestedTargetFiles))].sort().join(", ");
}

/**
 * @param {RuleCandidate[]} candidates
 * @returns {string}
 */
function foundSummary(candidates) {
  if (candidates.length === 1) {
    const [candidate] = candidates;
    return `${proposedRuleText(candidate)} Источник: ${candidate.id}.`;
  }
  return `Найдено ${candidates.length} похожих записей: ${candidates.map((candidate) => `${candidate.id} (${candidate.title})`).join("; ")}.`;
}

/**
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function reportField(label, value) {
  return `- **${label}:** ${value}`;
}

/**
 * @param {string} label
 * @returns {string}
 */
function reportFieldHeader(label) {
  return `- **${label}:**`;
}

/**
 * @param {RuleCandidate[]} candidates
 * @returns {string[]}
 */
function renderProjectCandidateBreakdown(candidates) {
  const lines = ["## Разбор по проектам"];
  if (candidates.length === 0) {
    lines.push("", "- Нет найденных правил для разбора.");
    return lines;
  }

  for (const [project, items] of groupCandidatesByProject(candidates)) {
    lines.push("", `### ${project}`);
    for (const { group, candidates: groupedCandidates } of groupCandidatesByRule(items).values()) {
      lines.push("", `#### ${group.title}`);
      lines.push(reportField("Что делать", group.action));
      lines.push(reportField("Дубли или похожие записи", duplicateSummary(groupedCandidates)));
      lines.push(reportField("Что нашли", foundSummary(groupedCandidates)));
      lines.push(reportField("Почему это полезно starter", group.whyUseful));
      lines.push(reportField("Точный текст для starter", group.starterText));
      lines.push(reportField("Как переписать без лишнего", group.rewriteNotes));
      lines.push(reportField("Куда может лечь в starter", joinedTargets(groupedCandidates) || "нужно определить вручную"));
      lines.push(reportFieldHeader("Источники для проверки"));
      for (const candidate of groupedCandidates) {
        lines.push(
          `  - ${candidate.id}: ${candidate.title}; ${candidate.evidence}; файлы: ${candidate.paths.join(", ") || "не определены"}; уверенность ${confidenceTitle(candidate.confidence)}`
        );
      }
    }
  }

  return lines;
}

/**
 * @param {RuleCandidate[]} candidates
 * @returns {string}
 */
function candidateIds(candidates) {
  return candidates.map((candidate) => candidate.id).join(", ");
}

/**
 * @param {string} value
 * @returns {string}
 */
function compactReportText(value) {
  return value.replace(/\s+/g, " ").replace(/^-\s*/, "").trim();
}

/**
 * @param {RuleCandidate[]} candidates
 * @param {string} label
 * @returns {string | null}
 */
function firstLabeledSnippet(candidates, label) {
  for (const candidate of candidates) {
    for (const snippet of candidate.snippets) {
      const line = snippet
        .split("\n")
        .map((item) => item.trim())
        .find((item) => item.toLowerCase().startsWith(`- ${label.toLowerCase()}:`));
      if (line) {
        return compactReportText(line.replace(new RegExp(`^- ${label}:\\s*`, "i"), ""));
      }
    }
  }
  return null;
}

/**
 * @param {RuleCandidate[]} candidates
 * @returns {string}
 */
function qaEvidenceProblemSummary(candidates) {
  const contradiction = firstLabeledSnippet(candidates, "Contradiction");
  if (contradiction) {
    if (contradiction.includes("owner needs faster human review") && contradiction.includes("technical")) {
      return "Конкретная проблема из источника: в сводке главный результат терялся среди технических деталей; решение в источнике было показать главное сверху, а техническое перенести вниз.";
    }
    return `Конкретная проблема из источника: ${contradiction}`;
  }
  const reasons = firstLabeledSnippet(candidates, "Reasons");
  if (reasons) {
    if (reasons.includes("cross_module_conflict") && reasons.includes("historical_recurrence")) {
      return "Конкретный сигнал из источника: похожая проблема повторялась и затрагивала несколько частей проекта.";
    }
    if (reasons.includes("historical_recurrence")) {
      return "Конкретный сигнал из источника: похожая проблема уже повторялась.";
    }
    return `Конкретный сигнал из источника: сработал разбор "${reasons}".`;
  }
  return "Конкретная проблема в источнике не описана достаточно ясно; есть только служебная запись о проверке.";
}

/**
 * @param {CandidateReportGroup} group
 * @param {RuleCandidate[]} candidates
 * @returns {string[]}
 */
function manualReviewLines(group, candidates) {
  if (group.key === "qa-triz-evidence") {
    return [
      reportField(
        "Что Codex проверяет сам",
        `${qaEvidenceProblemSummary(candidates)} Codex должен read-only прочитать источник и проверить, есть ли там повторяемый урок для всех новых проектов, а не перекладывать поиск на владельца.`
      ),
      reportField(
        "Моё предложение",
        "не добавлять отдельное правило сейчас. Если вы видите повторяемый урок, сформулировать его отдельно; иначе оставить эти записи только как подтверждение источника."
      )
    ];
  }

  if (group.key === "product-agent-reload-profile") {
    return [
      reportField(
        "Что Codex проверяет сам",
        "Codex должен read-only проверить источник и отделить общую мысль про настройки конкретного проекта после завершения задачи от частных деталей. В источнике речь про автоперезапуск Telegram-агентов, поэтому Telegram, launchd и локальные команды нельзя переносить в основу starter."
      ),
      reportField("Моё предложение", "не переносить в основу starter. Если нужно, оформить как пример настройки конкретного проекта.")
    ];
  }

  if (group.key === "multi-source-output-labels") {
    return [
      reportField(
        "Что Codex проверяет сам",
        "Codex должен read-only проверить источник и подтвердить, что общая мысль не зависит от названий конкретных каналов: если отчёт смешивает источники, у каждой записи должен быть понятный источник."
      ),
      reportField(
        "Моё предложение",
        "принять предложенный общий текст, но не переносить Telegram, Gmail, inbox_agent и другие названия из проекта-источника."
      )
    ];
  }

  return [
    reportField(
      "Что Codex проверяет сам",
      `Codex должен read-only проверить источник и решить, является ли эта формулировка правилом для всех новых проектов, а не частной настройкой проекта ${candidates[0]?.sourceProject ?? "источника"}.`
    ),
    reportField("Моё предложение", group.action)
  ];
}

/**
 * @param {CandidateReportGroup} group
 * @param {RuleCandidate[]} candidates
 * @param {RuleCategory} category
 * @returns {string}
 */
function ownerDecisionForGroup(group, candidates, category) {
  if (group.key === "qa-triz-evidence") {
    return `После Codex self-check выбрать одно: оставить ${candidateIds(candidates)} только как доказательство; или дать короткую формулировку общего правила, если вы видите повторяемую проблему.`;
  }
  if (category === "needs_review") {
    return `После Codex self-check выбрать одно: принять предложенный текст; оставить правило только в проекте-источнике; или написать свою формулировку для ${candidateIds(candidates)}.`;
  }
  if (category === "product_specific") {
    return `Ничего не переносить, если согласны с оценкой. Подтверждать перенос ${candidateIds(candidates)} нужно только если это всё-таки правило для всех новых проектов.`;
  }
  return `Ответить: перенести, пропустить или переписать. Если согласны, переносить одну формулировку для всей группы: ${candidateIds(candidates)}.`;
}

/**
 * @param {RuleCandidate} candidate
 * @returns {RuleCategory}
 */
function reportCategory(candidate) {
  if (candidateReportGroup(candidate).key === "qa-triz-evidence") {
    return "needs_review";
  }
  return candidate.category;
}

/**
 * @param {RuleCategory} category
 * @param {RuleCandidate[]} allCandidates
 * @returns {string[]}
 */
function renderCategoryDecisionBlock(category, allCandidates) {
  const items = allCandidates.filter((candidate) => reportCategory(candidate) === category);
  const lines = [`## ${categoryTitle(category)}`];
  if (items.length === 0) {
    lines.push("- Нет.");
    return lines;
  }

  lines.push("_Этот блок можно читать отдельно. Верхний разбор нужен только если хочется больше контекста._");

  for (const [project, projectCandidates] of groupCandidatesByProject(items)) {
    lines.push("", `### ${project}`);
    for (const { group, candidates } of groupCandidatesByRule(projectCandidates).values()) {
      lines.push("", `#### ${group.title}`);
      lines.push(reportField("Пункты в группе", candidateIds(candidates)));
      lines.push(reportField("Дубли или похожие записи", duplicateSummary(candidates)));
      lines.push(reportField("Что нашли", foundSummary(candidates)));
      lines.push(reportField("Что предлагается", group.action));
      lines.push(reportField("Почему это полезно starter", group.whyUseful));
      lines.push(reportField("Точный текст для starter", group.starterText));
      if (category === "needs_review") {
        lines.push(...manualReviewLines(group, candidates));
      }
      lines.push(reportField("Как переписать без лишнего", group.rewriteNotes));
      lines.push(reportField("Куда может лечь в starter", joinedTargets(candidates) || "нужно определить вручную"));
      lines.push(reportField("Что ожидается от владельца", ownerDecisionForGroup(group, candidates, category)));
    }
  }

  return lines;
}

/**
 * @param {DecisionProposal[]} proposals
 * @returns {string[]}
 */
function renderDecisionProposals(proposals) {
  const lines = [
    "## Предложения к решению",
    "",
    "Связь с charter проекта: переносим в starter только то, что помогает новым проектам стартовать по понятным правилам.",
    "Цель решения: показать, что можно перенести сразу, что нужно переписать, а что должно остаться в исходном проекте.",
    "JTBD: когда я смотрю найденные правила, я хочу быстро понять источник, смысл и следующий шаг по каждому предложению."
  ];

  if (proposals.length === 0) {
    lines.push("", "- Нет предложений к решению.");
    return lines;
  }

  for (const [index, proposal] of proposals.entries()) {
    lines.push("", `### ${index + 1}. ${proposal.title}`);
    lines.push(`Рекомендация: ${recommendationTitle(proposal.recommendation)}.`);
    lines.push("Job Stories:");
    for (const story of proposal.jobStories) {
      lines.push(`- ${story}`);
    }
    lines.push("User Stories:");
    for (const story of proposal.userStories) {
      lines.push(`- ${story}`);
    }
    lines.push("Критерии приемки:");
    for (const criterion of proposal.acceptanceCriteria) {
      lines.push(`- ${criterion}`);
    }
    lines.push(`Проверить по id: ${proposal.candidates.map((candidate) => candidate.id).join(", ")}.`);
  }

  return lines;
}

/**
 * @param {RuleSyncSnapshot} snapshot
 * @returns {string}
 */
export function renderRuleSyncReport(snapshot) {
  const lines = [
    "# Starter Rule Sync",
    "",
    `Период: ${snapshot.since} — ${snapshot.until}`,
    `Проектов проверено: ${snapshot.projects.length}`,
    `Кандидатов найдено: ${snapshot.candidates.length}`
  ];

  lines.push("", ...renderDecisionProposals(buildDecisionProposals(snapshot)));
  lines.push("", ...renderProjectCandidateBreakdown(snapshot.candidates));

  for (const category of /** @type {RuleCategory[]} */ (["import_candidate", "needs_review", "product_specific"])) {
    lines.push("", ...renderCategoryDecisionBlock(category, snapshot.candidates));
  }

  lines.push("", "## Диагностика");
  if (snapshot.diagnostics.length === 0) {
    lines.push("- Нет.");
  } else {
    for (const diagnostic of snapshot.diagnostics) {
      lines.push(`- ${diagnostic}`);
    }
  }
  return lines.join("\n");
}

/**
 * @param {string} repoRoot
 * @returns {Promise<string | null>}
 */
async function latestScanPath(repoRoot) {
  const files = await scanPaths(repoRoot);
  return files.at(-1) ?? null;
}

/**
 * @param {string} repoRoot
 * @returns {Promise<string[]>}
 */
async function scanPaths(repoRoot) {
  const scansRoot = path.join(repoRoot, RULE_SYNC_DIR, SCANS_DIR);
  if (!existsSync(scansRoot)) {
    return [];
  }
  const entries = await readdir(scansRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(scansRoot, entry.name))
    .sort();
}

/**
 * @param {string} filePath
 * @returns {Promise<RuleSyncSnapshot>}
 */
async function readSnapshot(filePath) {
  return /** @type {RuleSyncSnapshot} */ (JSON.parse(await readFile(filePath, "utf8")));
}

/**
 * @param {string} value
 * @returns {number | null}
 */
function timestampMs(value) {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * @param {RuleSyncSnapshot} snapshot
 * @returns {number | null}
 */
function snapshotWindowMs(snapshot) {
  const since = timestampMs(snapshot.since);
  const until = timestampMs(snapshot.until);
  if (since === null || until === null || until < since) {
    return null;
  }
  return until - since;
}

/**
 * @param {RuleSyncSnapshot} latest
 * @param {RuleSyncSnapshot} candidate
 * @returns {boolean}
 */
function isMeaningfulFallbackForZeroProbe(latest, candidate) {
  if (latest.candidates.length !== 0 || candidate.candidates.length === 0) {
    return false;
  }

  const latestWindow = snapshotWindowMs(latest);
  if (latestWindow === null || latestWindow > ZERO_PROBE_FALLBACK_MAX_WINDOW_MS) {
    return false;
  }

  const latestGenerated = timestampMs(latest.generatedAt);
  const candidateGenerated = timestampMs(candidate.generatedAt);
  if (
    latestGenerated === null ||
    candidateGenerated === null ||
    Math.abs(latestGenerated - candidateGenerated) > ZERO_PROBE_FALLBACK_MAX_GENERATED_DELTA_MS
  ) {
    return false;
  }

  const latestSince = timestampMs(latest.since);
  const candidateUntil = timestampMs(candidate.until);
  if (latestSince === null || candidateUntil === null) {
    return false;
  }

  return Math.abs(latestSince - candidateUntil) <= ZERO_PROBE_FALLBACK_BOUNDARY_TOLERANCE_MS;
}

/**
 * @param {string} repoRoot
 * @returns {Promise<ScanSelection | null>}
 */
export async function latestReportScanSelection(repoRoot) {
  const paths = await scanPaths(repoRoot);
  const latestPath = paths.at(-1);
  if (!latestPath) {
    return null;
  }

  const latest = await readSnapshot(latestPath);
  for (const candidatePath of paths.slice(0, -1).reverse()) {
    const candidate = await readSnapshot(candidatePath);
    if (isMeaningfulFallbackForZeroProbe(latest, candidate)) {
      return {
        scanPath: candidatePath,
        latestPath,
        source: "fallback_meaningful_probe",
        reason:
          "Latest scan has 0 candidates and looks like a short follow-up probe; using the preceding meaningful scan for the owner report."
      };
    }
  }

  return { scanPath: latestPath, latestPath, source: "latest", reason: null };
}

/**
 * @param {string} repoRoot
 * @param {RuleSyncSnapshot} snapshot
 * @param {string | undefined} outputPath
 * @returns {Promise<string>}
 */
async function writeSnapshot(repoRoot, snapshot, outputPath) {
  const targetPath =
    outputPath ?? path.join(repoRoot, RULE_SYNC_DIR, SCANS_DIR, `rule-sync-${formatDateStamp(new Date(snapshot.generatedAt))}.json`);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return targetPath;
}

/**
 * @param {string} repoRoot
 * @param {RuleSyncSnapshot} snapshot
 * @param {string} text
 * @param {string | undefined} outputPath
 * @returns {Promise<string>}
 */
async function writeReport(repoRoot, snapshot, text, outputPath) {
  const targetPath =
    outputPath ?? path.join(repoRoot, RULE_SYNC_DIR, REPORTS_DIR, `rule-sync-${formatDateStamp(new Date(snapshot.generatedAt))}.md`);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${text.trimEnd()}\n`, "utf8");
  return targetPath;
}

/**
 * @param {RuleSyncSnapshot} snapshot
 * @param {ApplyApproval} approval
 * @returns {{status: "ready", title: string, seedMessage: string, command: string[], selectedCandidates: RuleCandidate[]}}
 */
export function buildApplyPlan(snapshot, approval) {
  const approved = new Set(approval.approved ?? []);
  const selectedCandidates = snapshot.candidates.filter((candidate) => approved.has(candidate.id));
  const title = "Starter rule sync import";
  const lines = [
    "Импортировать подтверждённые reusable правила в new-project-starter.",
    "",
    "Approved candidates:"
  ];
  for (const candidate of selectedCandidates) {
    lines.push(
      `- ${candidate.id}: [${candidate.sourceProject}] ${candidate.title}; target=${candidate.suggestedTargetFiles.join(", ")}; evidence=${candidate.evidence}`
    );
    const correction = approval.corrections?.[candidate.id];
    if (correction) {
      lines.push(`  Correction: ${correction}`);
    }
  }
  lines.push("", "Требования: создать plan file по текущему template, не переносить product-specific детали, прогнать deterministic QA.");
  const seedMessage = lines.join("\n");
  return {
    status: "ready",
    title,
    seedMessage,
    command: ["npm", "run", "task:start", "--", "--title", title, "--seed-message", seedMessage],
    selectedCandidates
  };
}

/**
 * @returns {never}
 */
function usage() {
  throw new Error(
    [
      "Usage:",
      "  node scripts/rule-sync.mjs scan [--since <date>] [--until <date>] [--output <path>] [--json]",
      "  node scripts/rule-sync.mjs report --latest|--scan <path> [--output <path>] [--json]",
      "  node scripts/rule-sync.mjs apply-plan --approval <path> --dry-run [--scan <path>] [--json]"
    ].join("\n")
  );
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const repoRoot = findGitRoot(process.cwd());
  const { flags, positionals } = parseArgs(process.argv.slice(2));
  const command = positionals[0];
  if (!command) {
    usage();
  }

  if (command === "scan") {
    const defaultWindow = await defaultScanWindow(repoRoot);
    const since = typeof flags.since === "string" ? parseBoundaryDate(flags.since, "start") : defaultWindow.since;
    const until = typeof flags.until === "string" ? parseBoundaryDate(flags.until, "end") : defaultWindow.until;
    const snapshot = await scanRuleSync({ repoRoot, since, until });
    const outputPath = await writeSnapshot(repoRoot, snapshot, typeof flags.output === "string" ? flags.output : undefined);
    const payload = {
      status: "ok",
      outputPath,
      windowSource: typeof flags.since === "string" || typeof flags.until === "string" ? "explicit" : defaultWindow.source,
      since: snapshot.since,
      until: snapshot.until,
      projects: snapshot.projects.length,
      candidates: snapshot.candidates.length,
      importCandidates: snapshot.candidates.filter((candidate) => candidate.category === "import_candidate").length,
      needsReview: snapshot.candidates.filter((candidate) => candidate.category === "needs_review").length,
      productSpecific: snapshot.candidates.filter((candidate) => candidate.category === "product_specific").length
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (command === "report") {
    const selection =
      typeof flags.scan === "string"
        ? /** @type {ScanSelection | null} */ ({ scanPath: flags.scan, latestPath: flags.scan, source: "latest", reason: null })
        : flags.latest === true
          ? await latestReportScanSelection(repoRoot)
          : null;
    const scanPath = selection?.scanPath ?? null;
    if (!scanPath) {
      throw new Error("No scan selected. Use --latest or --scan <path>.");
    }
    const snapshot = await readSnapshot(scanPath);
    const fallbackLines =
      selection?.source === "fallback_meaningful_probe"
        ? [
            "",
            "## Snapshot fallback",
            `- ${selection.reason}`,
            `- Selected scan: ${selection.scanPath}`,
            `- Latest scan: ${selection.latestPath}`
          ]
        : [];
    const text = [renderRuleSyncReport(snapshot), ...fallbackLines].join("\n");
    const reportPath = await writeReport(repoRoot, snapshot, text, typeof flags.output === "string" ? flags.output : undefined);
    if (flags.json === true) {
      console.log(JSON.stringify({ status: "ok", scanPath, reportPath, selection, text, snapshot }, null, 2));
    } else {
      console.log([text, "", `Report saved: ${reportPath}`].join("\n"));
    }
    return;
  }

  if (command === "apply-plan") {
    if (flags["dry-run"] !== true) {
      throw new Error("v1 apply-plan is approval-safe and only supports --dry-run.");
    }
    if (typeof flags.approval !== "string") {
      throw new Error("--approval <path> is required.");
    }
    const scanPath = typeof flags.scan === "string" ? flags.scan : await latestScanPath(repoRoot);
    if (!scanPath) {
      throw new Error("No scan found. Use --scan <path> or run rule-sync:scan first.");
    }
    const snapshot = await readSnapshot(scanPath);
    const approval = /** @type {ApplyApproval} */ (JSON.parse(await readFile(flags.approval, "utf8")));
    const plan = buildApplyPlan(snapshot, approval);
    console.log(JSON.stringify({ ...plan, dryRun: true, scanPath }, null, 2));
    return;
  }

  usage();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

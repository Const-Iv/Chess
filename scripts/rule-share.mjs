// @ts-check

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { findGitRoot, formatIso, getCodexHome, isGitDirty, parseArgs, runCommand, slugify } from "./lib/runtime.mjs";

const RULE_SHARE_DIR = "runtime/rule-share";
const SCANS_DIR = "scans";
const RULE_REGISTRY_PATH = ".memory-bank/starter-rule-registry.json";
const DEFAULT_MAX_DEPTH = 5;
const DEFAULT_STARTER_PATH = "vendor/new-project-starter";
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
const CANONICAL_IMPORT_TARGETS = [
  "AGENTS.md",
  ".memory-bank/index.md",
  ".memory-bank/product-charter.md",
  ".memory-bank/project-context.md",
  ".memory-bank/architecture-map.md",
  ".memory-bank/code-rules.md",
  ".memory-bank/qa-playbook.md",
  "CODEX_MEMORY.md",
  ".cursorrules",
  "CLAUDE.md",
  "README.md"
];
const DOWNSTREAM_EVIDENCE_TARGETS = ["Docs/qa-implementation-log.md", "Docs/triz-usage-log.md"];

/**
 * @typedef {"ready"|"up_to_date"|"needs_review"|"blocked"} RuleShareStatus
 */

/**
 * @typedef {"update_starter_reference"|"prepare_rule_import"|"manual_review"|"none"} RuleShareAction
 */

/**
 * @typedef {Object} RuleShareConfig
 * @property {string[]} [roots]
 * @property {string[]} [allowlist]
 * @property {string[]} [ignorelist]
 * @property {string} [starterPath]
 */

/**
 * @typedef {"required"|"manual_review"} StarterRuleSharePolicy
 */

/**
 * @typedef {Object} StarterRuleSource
 * @property {string} type
 * @property {string[]} [candidateIds]
 * @property {string} [importedAt]
 * @property {string} [note]
 */

/**
 * @typedef {Object} StarterRule
 * @property {string} id
 * @property {string} title
 * @property {string} text
 * @property {string[]} targetFiles
 * @property {string[]} requiredFragments
 * @property {StarterRuleSource} source
 * @property {StarterRuleSharePolicy} sharePolicy
 */

/**
 * @typedef {Object} StarterRuleRegistry
 * @property {1} schemaVersion
 * @property {string} updatedAt
 * @property {StarterRule[]} rules
 */

/**
 * @typedef {"registry"|"starter_reference"|"text"|"fragments"|"missing"|"partial"|"blocked"} RuleMatchKind
 */

/**
 * @typedef {Object} RuleShareRuleState
 * @property {string} id
 * @property {string} title
 * @property {string} text
 * @property {string[]} targetFiles
 * @property {string[]} requiredFragments
 * @property {StarterRuleSharePolicy} sharePolicy
 * @property {RuleMatchKind} match
 * @property {string[]} matchedFragments
 * @property {string[]} missingFragments
 * @property {string} reason
 */

/**
 * @typedef {Object} DiscoveredShareProject
 * @property {string} label
 * @property {string} repoRoot
 * @property {string} gitCommonDir
 * @property {boolean} hasTaskPipeline
 */

/**
 * @typedef {Object} RuleShareProject
 * @property {string} id
 * @property {string} label
 * @property {string} repoRoot
 * @property {RuleShareStatus} status
 * @property {RuleShareAction} recommendedAction
 * @property {string[]} reasons
 * @property {boolean} dirty
 * @property {boolean} hasTaskFlow
 * @property {boolean} hasStarterSubmodule
 * @property {string} starterPath
 * @property {string | null} currentStarterHead
 * @property {string[]} targetFiles
 * @property {RuleShareRuleState[]} presentRules
 * @property {RuleShareRuleState[]} missingRules
 * @property {RuleShareRuleState[]} presentUnregisteredRules
 * @property {RuleShareRuleState[]} blockedRules
 */

/**
 * @typedef {Object} RuleShareSnapshot
 * @property {1} schemaVersion
 * @property {string} generatedAt
 * @property {string} repoRoot
 * @property {string} starterHead
 * @property {boolean} starterDirty
 * @property {boolean} allowlistConfigured
 * @property {string} registryPath
 * @property {StarterRule[]} registryRules
 * @property {RuleShareProject[]} projects
 * @property {string[]} diagnostics
 */

/**
 * @typedef {Object} RuleShareApproval
 * @property {string[]} [approvedProjects]
 * @property {Record<string, string>} [notes]
 */

/**
 * @typedef {Object} RuleShareTaskSeed
 * @property {string} projectId
 * @property {string} projectLabel
 * @property {string} cwd
 * @property {string} title
 * @property {string} seedMessage
 * @property {string[]} command
 */

/**
 * @param {string[]} values
 * @returns {string[]}
 */
function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/**
 * @param {string} repoRoot
 * @param {string} item
 * @returns {string}
 */
function resolveLocalPath(repoRoot, item) {
  return path.isAbsolute(item) ? path.resolve(item) : path.resolve(repoRoot, item);
}

/**
 * @param {string} repoRoot
 * @returns {Promise<RuleShareConfig>}
 */
async function loadLocalConfig(repoRoot) {
  const configPath = path.join(repoRoot, RULE_SHARE_DIR, "config.json");
  if (!existsSync(configPath)) {
    return {};
  }
  const raw = JSON.parse(await readFile(configPath, "utf8"));
  return {
    roots: Array.isArray(raw.roots) ? raw.roots.map(String) : [],
    allowlist: Array.isArray(raw.allowlist) ? raw.allowlist.map(String) : [],
    ignorelist: Array.isArray(raw.ignorelist) ? raw.ignorelist.map(String) : [],
    starterPath: typeof raw.starterPath === "string" ? raw.starterPath : undefined
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * @param {string} repoRoot
 * @returns {Promise<StarterRuleRegistry>}
 */
async function loadStarterRuleRegistry(repoRoot) {
  const registryPath = path.join(repoRoot, RULE_REGISTRY_PATH);
  if (!existsSync(registryPath)) {
    return { schemaVersion: 1, updatedAt: formatIso(), rules: [] };
  }
  const raw = /** @type {Record<string, unknown>} */ (JSON.parse(await readFile(registryPath, "utf8")));
  const rawRules = Array.isArray(raw.rules) ? raw.rules : [];
  return {
    schemaVersion: 1,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : formatIso(),
    rules: rawRules.map((item) => {
      const rule = /** @type {Record<string, unknown>} */ (item);
      const source = rule.source && typeof rule.source === "object" ? /** @type {Record<string, unknown>} */ (rule.source) : {};
      return {
        id: String(rule.id),
        title: String(rule.title),
        text: String(rule.text),
        targetFiles: Array.isArray(rule.targetFiles) ? rule.targetFiles.map(String) : [],
        requiredFragments: Array.isArray(rule.requiredFragments) ? rule.requiredFragments.map(String) : [],
        source: {
          type: String(source.type ?? "manual"),
          candidateIds: Array.isArray(source.candidateIds) ? source.candidateIds.map(String) : undefined,
          importedAt: typeof source.importedAt === "string" ? source.importedAt : undefined,
          note: typeof source.note === "string" ? source.note : undefined
        },
        sharePolicy: rule.sharePolicy === "manual_review" ? "manual_review" : "required"
      };
    })
  };
}

/**
 * @param {string} repoRoot
 * @returns {Promise<Set<string>>}
 */
async function loadDownstreamRuleIds(repoRoot) {
  const registryPath = path.join(repoRoot, RULE_REGISTRY_PATH);
  if (!existsSync(registryPath)) {
    return new Set();
  }
  const raw = /** @type {Record<string, unknown>} */ (JSON.parse(await readFile(registryPath, "utf8")));
  return new Set((Array.isArray(raw.rules) ? raw.rules : []).map((item) => String(/** @type {Record<string, unknown>} */ (item).id)));
}

/**
 * @param {string} repoRoot
 * @param {string[]} targetFiles
 * @returns {Promise<string>}
 */
async function readRuleTargetText(repoRoot, targetFiles) {
  const files = uniqueSorted(targetFiles.length > 0 ? targetFiles : CANONICAL_IMPORT_TARGETS);
  const chunks = [];
  for (const relativePath of files) {
    const filePath = path.join(repoRoot, relativePath);
    if (!existsSync(filePath)) {
      continue;
    }
    chunks.push(await readFile(filePath, "utf8"));
  }
  return chunks.join("\n");
}

/**
 * @param {StarterRule} rule
 * @param {RuleMatchKind} match
 * @param {string[]} matchedFragments
 * @param {string[]} missingFragments
 * @param {string} reason
 * @returns {RuleShareRuleState}
 */
function ruleState(rule, match, matchedFragments, missingFragments, reason) {
  return {
    id: rule.id,
    title: rule.title,
    text: rule.text,
    targetFiles: rule.targetFiles,
    requiredFragments: rule.requiredFragments,
    sharePolicy: rule.sharePolicy,
    match,
    matchedFragments,
    missingFragments,
    reason
  };
}

/**
 * @param {string} repoRoot
 * @param {StarterRule[]} rules
 * @returns {Promise<{presentRules: RuleShareRuleState[], missingRules: RuleShareRuleState[], presentUnregisteredRules: RuleShareRuleState[], blockedRules: RuleShareRuleState[]}>}
 */
async function evaluateCopiedBaselineRules(repoRoot, rules) {
  const downstreamIds = await loadDownstreamRuleIds(repoRoot);
  /** @type {RuleShareRuleState[]} */
  const presentRules = [];
  /** @type {RuleShareRuleState[]} */
  const missingRules = [];
  /** @type {RuleShareRuleState[]} */
  const presentUnregisteredRules = [];
  /** @type {RuleShareRuleState[]} */
  const blockedRules = [];

  for (const rule of rules) {
    if (downstreamIds.has(rule.id)) {
      presentRules.push(ruleState(rule, "registry", rule.requiredFragments, [], "Rule id is already registered in downstream registry."));
      continue;
    }

    const text = normalizeText(await readRuleTargetText(repoRoot, rule.targetFiles));
    const exactText = normalizeText(rule.text);
    const matchedFragments = rule.requiredFragments.filter((fragment) => text.includes(normalizeText(fragment)));
    const missingFragments = rule.requiredFragments.filter((fragment) => !text.includes(normalizeText(fragment)));

    if (exactText && text.includes(exactText)) {
      presentUnregisteredRules.push(ruleState(rule, "text", rule.requiredFragments, [], "Rule text is already present, but downstream registry has no id entry."));
    } else if (rule.requiredFragments.length > 0 && missingFragments.length === 0) {
      presentUnregisteredRules.push(ruleState(rule, "fragments", matchedFragments, [], "Required fragments are already present, but downstream registry has no id entry."));
    } else if (rule.sharePolicy === "manual_review") {
      blockedRules.push(
        ruleState(
          rule,
          matchedFragments.length > 0 ? "partial" : "blocked",
          matchedFragments,
          missingFragments,
          "Rule is marked manual_review in starter registry; owner review is required before sharing."
        )
      );
    } else if (matchedFragments.length > 0) {
      blockedRules.push(ruleState(rule, "partial", matchedFragments, missingFragments, "Partial rule match found; manual review is required before importing or registering."));
    } else {
      missingRules.push(ruleState(rule, "missing", [], rule.requiredFragments, "Rule is missing from downstream canonical surfaces."));
    }
  }

  return { presentRules, missingRules, presentUnregisteredRules, blockedRules };
}

/**
 * @param {StarterRule[]} rules
 * @param {RuleMatchKind} match
 * @param {string} reason
 * @returns {RuleShareRuleState[]}
 */
function statesForAllRules(rules, match, reason) {
  return rules.map((rule) => ruleState(rule, match, [], rule.requiredFragments, reason));
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
    if (existsSync(path.join(current, ".git"))) {
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
  return result.status === 0 ? path.resolve(repoRoot, result.stdout.trim()) : null;
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
 * @param {string[]} paths
 * @returns {Promise<Set<string>>}
 */
async function canonicalSet(paths) {
  const values = [];
  for (const item of paths) {
    values.push(await canonicalPath(item));
  }
  return new Set(values);
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
 * @param {string} label
 * @param {string} repoRoot
 * @returns {string}
 */
function projectId(label, repoRoot) {
  const digest = createHash("sha1").update(repoRoot).digest("hex").slice(0, 10);
  return `rsh-${slugify(label)}-${digest}`;
}

/**
 * @param {string} repoRoot
 * @returns {string | null}
 */
function gitHead(repoRoot) {
  const result = runCommand(repoRoot, "git", ["rev-parse", "HEAD"], { allowFailure: true });
  return result.status === 0 ? result.stdout.trim() : null;
}

/**
 * @param {string} repoRoot
 * @param {string} scriptName
 * @returns {Promise<boolean>}
 */
async function hasPackageScript(repoRoot, scriptName) {
  const packagePath = path.join(repoRoot, "package.json");
  if (!existsSync(packagePath)) {
    return false;
  }
  const raw = JSON.parse(await readFile(packagePath, "utf8"));
  return Boolean(raw && typeof raw === "object" && raw.scripts && typeof raw.scripts[scriptName] === "string");
}

/**
 * @param {string} repoRoot
 * @returns {boolean}
 */
function hasStarterCanonicalFiles(repoRoot) {
  return (
    existsSync(path.join(repoRoot, "AGENTS.md")) &&
    existsSync(path.join(repoRoot, ".memory-bank", "product-charter.md")) &&
    existsSync(path.join(repoRoot, "CODEX_MEMORY.md"))
  );
}

/**
 * @param {string} repoRoot
 * @param {string} starterPath
 * @returns {Promise<{hasStarterSubmodule: boolean, currentStarterHead: string | null}>}
 */
async function inspectStarterReference(repoRoot, starterPath) {
  const absoluteStarterPath = path.join(repoRoot, starterPath);
  const gitModulesPath = path.join(repoRoot, ".gitmodules");
  const gitModules = existsSync(gitModulesPath) ? await readFile(gitModulesPath, "utf8") : "";
  const hasGitMarker = existsSync(path.join(absoluteStarterPath, ".git"));
  const hasStarterSubmodule = hasGitMarker || gitModules.includes(starterPath);
  const currentStarterHead = hasStarterSubmodule && existsSync(absoluteStarterPath) ? gitHead(absoluteStarterPath) : null;
  return { hasStarterSubmodule, currentStarterHead };
}

/**
 * @param {string} repoRoot
 * @param {{roots?: string[], config?: RuleShareConfig}} [options]
 * @returns {Promise<DiscoveredShareProject[]>}
 */
export async function discoverShareProjects(repoRoot, options = {}) {
  const config = options.config ?? (await loadLocalConfig(repoRoot));
  const roots = uniqueSorted([
    ...(options.roots ? options.roots.map((item) => resolveLocalPath(repoRoot, item)) : defaultDiscoveryRoots(repoRoot)),
    ...((config.roots ?? []).map((item) => resolveLocalPath(repoRoot, item)))
  ]);
  const allowlist = (config.allowlist ?? []).map((item) => resolveLocalPath(repoRoot, item));
  const ignorelist = (config.ignorelist ?? []).map((item) => resolveLocalPath(repoRoot, item));
  const allowSet = allowlist.length > 0 ? await canonicalSet(allowlist) : null;

  const discovered = [];
  for (const root of roots) {
    discovered.push(...(await findGitRepositories(root, DEFAULT_MAX_DEPTH)));
  }
  discovered.push(...allowlist);

  const targetCommonDir = gitCommonDir(repoRoot);
  /** @type {Map<string, DiscoveredShareProject>} */
  const byCommonDir = new Map();
  for (const candidate of uniqueSorted(discovered)) {
    const root = gitRoot(candidate);
    if (!root || (await isIgnored(ignorelist, root))) {
      continue;
    }
    const resolvedRoot = await canonicalPath(root);
    if (allowSet && !allowSet.has(resolvedRoot)) {
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
 * @param {DiscoveredShareProject} project
 * @param {{allowlistConfigured: boolean, starterPath: string, starterHead: string, rules: StarterRule[]}} options
 * @returns {Promise<RuleShareProject>}
 */
async function analyzeProject(project, options) {
  const dirty = isGitDirty(project.repoRoot);
  const { hasStarterSubmodule, currentStarterHead } = await inspectStarterReference(project.repoRoot, options.starterPath);
  const hasTaskFlow = project.hasTaskPipeline || (await hasPackageScript(project.repoRoot, "task:start"));
  const hasStarterFiles = hasStarterCanonicalFiles(project.repoRoot);
  const reasons = [];
  /** @type {RuleShareStatus} */
  let status = "needs_review";
  /** @type {RuleShareAction} */
  let recommendedAction = "manual_review";
  /** @type {string[]} */
  let targetFiles = [];
  /** @type {RuleShareRuleState[]} */
  let presentRules = [];
  /** @type {RuleShareRuleState[]} */
  let missingRules = [];
  /** @type {RuleShareRuleState[]} */
  let presentUnregisteredRules = [];
  /** @type {RuleShareRuleState[]} */
  let blockedRules = [];

  if (!options.allowlistConfigured) {
    status = "blocked";
    reasons.push("Локальный allowlist не настроен; проект нельзя предлагать для outbound sharing.");
    blockedRules = statesForAllRules(options.rules, "blocked", "Project is blocked because local allowlist is not configured.");
  } else if (dirty) {
    status = "blocked";
    reasons.push("В проекте есть незакоммиченные изменения; сначала нужен clean tree.");
    blockedRules = statesForAllRules(options.rules, "blocked", "Project is dirty; clean tree is required before sharing rules.");
  } else if (hasStarterSubmodule) {
    if (currentStarterHead === options.starterHead) {
      status = options.rules.length > 0 ? "up_to_date" : "needs_review";
      recommendedAction = options.rules.length > 0 ? "none" : "manual_review";
      presentRules = statesForAllRules(options.rules, "starter_reference", "Starter reference already points to current starter HEAD.");
      reasons.push("Starter reference уже указывает на текущий starter HEAD.");
    } else if (!hasTaskFlow) {
      status = "blocked";
      reasons.push("Starter submodule найден, но managed task flow в проекте не обнаружен.");
      blockedRules = statesForAllRules(options.rules, "blocked", "Project has starter reference but no managed task flow.");
    } else {
      status = "ready";
      recommendedAction = "update_starter_reference";
      targetFiles = [options.starterPath, "package.json"];
      missingRules = statesForAllRules(options.rules, "missing", "Updating the starter reference will bring these starter rules to the project.");
      reasons.push("Проект использует versioned starter reference; можно обновить baseline без blind copy.");
    }
  } else if (hasStarterFiles && hasTaskFlow) {
    const ruleStateByCategory = await evaluateCopiedBaselineRules(project.repoRoot, options.rules);
    presentRules = ruleStateByCategory.presentRules;
    missingRules = ruleStateByCategory.missingRules;
    presentUnregisteredRules = ruleStateByCategory.presentUnregisteredRules;
    blockedRules = ruleStateByCategory.blockedRules;
    if (options.rules.length === 0 || missingRules.length > 0) {
      status = "ready";
      recommendedAction = "prepare_rule_import";
      targetFiles =
        missingRules.length > 0 ? uniqueSorted(missingRules.flatMap((rule) => rule.targetFiles)) : CANONICAL_IMPORT_TARGETS;
      reasons.push("Проект похож на starter-based copy и поддерживает managed task flow.");
      if (missingRules.length > 0) {
        reasons.push(`Найдено недостающих starter rules: ${missingRules.length}.`);
      }
      if (blockedRules.length > 0) {
        reasons.push(`Есть rule-level пункты для ручной проверки: ${blockedRules.length}.`);
      }
    } else if (blockedRules.length > 0) {
      status = "needs_review";
      reasons.push("Найдены похожие, но не полностью совпадающие starter rules; нужна ручная проверка.");
    } else {
      status = "up_to_date";
      recommendedAction = "none";
      reasons.push("Все registered starter rules уже найдены в проекте; перенос не нужен.");
    }
  } else if (hasStarterFiles) {
    reasons.push("Starter-like canonical files найдены, но managed task flow не обнаружен.");
    blockedRules = statesForAllRules(options.rules, "blocked", "Project has starter-like files but no managed task flow.");
  } else {
    reasons.push("Проект не выглядит подключённым к starter baseline.");
    blockedRules = statesForAllRules(options.rules, "blocked", "Project is not recognized as starter-based.");
  }

  return {
    id: projectId(project.label, project.repoRoot),
    label: project.label,
    repoRoot: project.repoRoot,
    status,
    recommendedAction,
    reasons,
    dirty,
    hasTaskFlow,
    hasStarterSubmodule,
    starterPath: options.starterPath,
    currentStarterHead,
    targetFiles,
    presentRules,
    missingRules,
    presentUnregisteredRules,
    blockedRules
  };
}

/**
 * @param {{repoRoot: string, roots?: string[], config?: RuleShareConfig}} options
 * @returns {Promise<RuleShareSnapshot>}
 */
export async function scanRuleShare(options) {
  const config = options.config ?? (await loadLocalConfig(options.repoRoot));
  const registry = await loadStarterRuleRegistry(options.repoRoot);
  const starterHead = gitHead(options.repoRoot);
  if (!starterHead) {
    throw new Error("Cannot determine starter HEAD.");
  }
  const starterDirty = isGitDirty(options.repoRoot);
  const allowlistConfigured = (config.allowlist ?? []).length > 0;
  const starterPath = config.starterPath ?? DEFAULT_STARTER_PATH;
  const discovered = await discoverShareProjects(options.repoRoot, { roots: options.roots, config });
  const projects = [];
  for (const project of discovered) {
    projects.push(await analyzeProject(project, { allowlistConfigured, starterPath, starterHead, rules: registry.rules }));
  }
  const diagnostics = [];
  if (!allowlistConfigured) {
    diagnostics.push(`No local allowlist configured. Add allowed active projects to ${RULE_SHARE_DIR}/config.json.`);
  }
  if (starterDirty) {
    diagnostics.push("Starter working tree is dirty. Finish the starter import and QA before sharing rules outward.");
  }
  if (projects.length === 0) {
    diagnostics.push("No share targets discovered from the configured roots/allowlist.");
  }
  if (registry.rules.length === 0) {
    diagnostics.push(`No starter rule registry entries found in ${RULE_REGISTRY_PATH}. Rule-level sharing will use project-level readiness only.`);
  }

  return {
    schemaVersion: 1,
    generatedAt: formatIso(),
    repoRoot: options.repoRoot,
    starterHead,
    starterDirty,
    allowlistConfigured,
    registryPath: path.join(options.repoRoot, RULE_REGISTRY_PATH),
    registryRules: registry.rules,
    projects,
    diagnostics
  };
}

/**
 * @param {RuleShareAction} action
 * @returns {string}
 */
function actionTitle(action) {
  if (action === "update_starter_reference") {
    return "обновить starter reference";
  }
  if (action === "prepare_rule_import") {
    return "подготовить перенос reusable rules";
  }
  if (action === "none") {
    return "ничего переносить не нужно";
  }
  return "ручная проверка";
}

/**
 * @param {RuleShareRuleState[]} rules
 * @param {string} emptyText
 * @returns {string[]}
 */
function renderRuleList(rules, emptyText) {
  if (rules.length === 0) {
    return [`  ${emptyText}`];
  }
  const lines = [];
  for (const rule of rules) {
    lines.push(`  - ${rule.id}: ${rule.title}`);
    lines.push(`    Точный текст: ${rule.text}`);
    lines.push(`    Target: ${rule.targetFiles.join(", ") || "-"}`);
    if (rule.reason) {
      lines.push(`    Причина: ${rule.reason}`);
    }
  }
  return lines;
}

/**
 * @param {RuleShareRuleState[]} rules
 * @param {RuleShareProject} project
 * @returns {string[]}
 */
function renderBlockedRuleList(rules, project) {
  if (rules.length === 0) {
    return ["  - Нет blocked/manual-review rules."];
  }
  const lines = [
    "  Важно: это не задача владельца искать правило по файлам. Codex сначала делает read-only self-check по проекту и только потом выносит владельцу конкретное решение."
  ];
  for (const rule of rules) {
    lines.push(`  - ${rule.id}: ${rule.title}`);
    lines.push(`    Точный текст: ${rule.text}`);
    lines.push(`    Target: ${rule.targetFiles.join(", ") || "-"}`);
    if (rule.reason) {
      lines.push(`    Причина: ${rule.reason}`);
    }
    if (project.dirty || rule.match === "blocked") {
      lines.push("    Что Codex делает: не классифицирует правило до снятия блокировки проекта, чтобы не принять промежуточные локальные изменения за итоговое состояние.");
      lines.push("    Что ожидается от владельца: сначала привести проект к clean tree, затем заново запустить rule-share scan.");
    } else {
      lines.push(
        "    Что Codex проверяет сам: read-only сверяет target files и похожие формулировки в проекте; итог должен быть одним из вариантов: уже покрыто, добавить как написано, добавить с адаптацией или не добавлять."
      );
      lines.push("    Что ожидается от владельца: согласовать готовую рекомендацию Codex, а не искать фрагменты вручную.");
    }
  }
  return lines;
}

/**
 * @param {RuleShareSnapshot} snapshot
 * @returns {string}
 */
export function renderRuleShareReport(snapshot) {
  const lines = [
    "# Rule Share Report",
    "",
    `Сформировано: ${snapshot.generatedAt}`,
    `Starter HEAD: ${snapshot.starterHead}`,
    `Starter dirty: ${snapshot.starterDirty ? "yes" : "no"}`,
    `Registry rules: ${snapshot.registryRules?.length ?? 0}`,
    "",
    "Миссия: делиться только переносимым starter baseline с выбранными активными проектами.",
    "Цель: показать по каждому выбранному проекту, какие starter rules уже есть, каких не хватает и что будет добавлено.",
    "JTBD: когда starter обновлён, безопасно раздать недостающие reusable правила без дублей и без перезаписи продуктовой специфики.",
    "",
    "## Предложения к проектам"
  ];

  const ready = snapshot.projects.filter((project) => project.status === "ready");
  const upToDate = snapshot.projects.filter((project) => project.status === "up_to_date");
  const needsReview = snapshot.projects.filter((project) => project.status === "needs_review");
  const blocked = snapshot.projects.filter((project) => project.status === "blocked");

  if (ready.length === 0) {
    lines.push("- Нет проектов, готовых к автоматической подготовке task seed.");
  } else {
    for (const project of ready) {
      lines.push(`- ${project.id}: [${project.label}] ${actionTitle(project.recommendedAction)}.`);
    }
  }

  /** @type {Array<[string, RuleShareProject[]]>} */
  const sections = [
    ["Готово к обновлению", ready],
    ["Актуально", upToDate],
    ["Требует ручной проверки", needsReview],
    ["Заблокировано", blocked]
  ];
  for (const [title, projects] of sections) {
    lines.push("", `## ${title}`);
    if (projects.length === 0) {
      lines.push("- Нет.");
      continue;
    }
    for (const project of projects) {
      lines.push(`- ${project.id}: [${project.label}] ${project.repoRoot}`);
      lines.push(`  Действие: ${actionTitle(project.recommendedAction)}`);
      lines.push(`  Причины: ${project.reasons.join(" ")}`);
      lines.push(`  Target: ${project.targetFiles.join(", ") || "-"}`);
      lines.push("  Есть в проекте:");
      lines.push(...renderRuleList(project.presentRules ?? [], "- Нет registered-present rules."));
      lines.push("  Есть текстом, но не зарегистрировано:");
      lines.push(...renderRuleList(project.presentUnregisteredRules ?? [], "- Нет unregistered-present rules."));
      lines.push("  Будет добавлено:");
      lines.push(...renderRuleList(project.missingRules ?? [], "- Нет missing rules."));
      lines.push("  Требует ручной проверки:");
      lines.push(...renderBlockedRuleList(project.blockedRules ?? [], project));
    }
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
 * @param {RuleShareSnapshot} snapshot
 * @param {RuleShareProject} project
 * @param {RuleShareApproval} approval
 * @returns {RuleShareTaskSeed}
 */
function buildProjectTaskSeed(snapshot, project, approval) {
  const title = `Share starter rules with ${project.label}`;
  const lines = [
    `Поделиться текущим baseline new-project-starter с проектом ${project.label}.`,
    "",
    `Starter source: ${snapshot.repoRoot}`,
    `Starter HEAD: ${snapshot.starterHead}`,
    `Mode: ${project.recommendedAction}`,
    `Project: ${project.repoRoot}`,
    "",
    "Требования:",
    "- создать managed task worktree в target project;",
    "- не затирать product-specific charter, adapters, profiles или локальные правила проекта;",
    "- переносить только reusable baseline governance/rules;",
    "- использовать список missing rules ниже как единственный контракт переноса;",
    "- прогнать deterministic QA target project и зафиксировать evidence;",
    "- остановиться перед finish/merge/publish, если владелец явно не запросил эту стадию."
  ];
  if (project.recommendedAction === "update_starter_reference") {
    lines.push(
      "",
      "Действие для submodule/reference проекта:",
      `- обновить ${project.starterPath} до starter HEAD ${snapshot.starterHead};`,
      "- проверить shared skills через skills:status/link, если такие scripts есть;",
      "- не копировать generated skill trees или private local state."
    );
  } else {
    lines.push(
      "",
      "Действие для copied-baseline проекта:",
      `- добавить только missing rules: ${(project.missingRules ?? []).map((rule) => rule.id).join(", ") || "нет"};`,
      "- не дублировать present или present-unregistered rules;",
      "- подготовить surgical diff с reusable правилами из списка ниже;",
      "- оставлять downstream product wording в его product charter/specs;",
      `- синхронизировать обязательные правила в этих target files: ${project.targetFiles.join(", ") || "-"};`,
      "- сохранять parity на downstream canonical/mirror surfaces, когда они существуют: AGENTS.md, .memory-bank/*, CODEX_MEMORY.md, README.md, .cursorrules и CLAUDE.md;",
      `- зафиксировать evidence в downstream operational docs: ${DOWNSTREAM_EVIDENCE_TARGETS.join(", ")};`,
      "- evidence должен включать starter source, starter HEAD, approved project, imported reusable rules, skipped product-specific areas, changed canonical files и deterministic QA result;",
      "- если task QA пишет TRIZ_TRIGGER, выполнить TRIZ-pass и добавить TRIZ_APPLIED запись до финального ответа;",
      "- после всех source edits повторить target task QA, чтобы checkpoint относился к финальному diff."
    );
  }
  if ((project.missingRules ?? []).length > 0) {
    lines.push("", "Missing rules to import:");
    for (const rule of project.missingRules ?? []) {
      lines.push(
        `- ${rule.id}: ${rule.title}`,
        `  Text: ${rule.text}`,
        `  Target files: ${rule.targetFiles.join(", ") || "-"}`,
        `  Required fragments: ${rule.requiredFragments.join(" | ") || "-"}`
      );
    }
  }
  if ((project.presentUnregisteredRules ?? []).length > 0) {
    lines.push("", "Already present, do not duplicate; register as applied if downstream registry is maintained:");
    for (const rule of project.presentUnregisteredRules ?? []) {
      lines.push(`- ${rule.id}: ${rule.title}`);
    }
  }
  if ((project.blockedRules ?? []).length > 0) {
    lines.push("", "Codex self-check required before future import; do not import automatically:");
    for (const rule of project.blockedRules ?? []) {
      lines.push(`- ${rule.id}: ${rule.title} — ${rule.reason}`);
    }
  }
  const note = approval.notes?.[project.id];
  if (note) {
    lines.push("", `Owner note: ${note}`);
  }

  const seedMessage = lines.join("\n");
  return {
    projectId: project.id,
    projectLabel: project.label,
    cwd: project.repoRoot,
    title,
    seedMessage,
    command: ["npm", "run", "task:start", "--", "--title", title, "--seed-message", seedMessage]
  };
}

/**
 * @param {RuleShareSnapshot} snapshot
 * @param {RuleShareApproval} approval
 * @returns {{status: "ready", starterHead: string, selectedProjects: RuleShareProject[], tasks: RuleShareTaskSeed[]}}
 */
export function buildShareApplyPlan(snapshot, approval) {
  if (snapshot.starterDirty) {
    throw new Error("Starter snapshot is dirty. Finish starter import and QA before sharing outward.");
  }
  const approved = new Set(approval.approvedProjects ?? []);
  const knownProjectIds = new Set(snapshot.projects.map((project) => project.id));
  const unknown = [...approved].filter((projectIdValue) => !knownProjectIds.has(projectIdValue));
  if (unknown.length > 0) {
    throw new Error(`Approval references unknown projects: ${unknown.join(", ")}`);
  }
  const selectedProjects = snapshot.projects.filter((project) => approved.has(project.id));
  const blocked = selectedProjects.filter((project) => project.status !== "ready");
  if (blocked.length > 0) {
    throw new Error(`Approved projects are not ready for apply-plan: ${blocked.map((project) => project.id).join(", ")}`);
  }
  const empty = selectedProjects.filter(
    (project) => (snapshot.registryRules?.length ?? 0) > 0 && project.recommendedAction === "prepare_rule_import" && (project.missingRules ?? []).length === 0
  );
  if (empty.length > 0) {
    throw new Error(`Approved copied-baseline projects have no missing rules: ${empty.map((project) => project.id).join(", ")}`);
  }
  return {
    status: "ready",
    starterHead: snapshot.starterHead,
    selectedProjects,
    tasks: selectedProjects.map((project) => buildProjectTaskSeed(snapshot, project, approval))
  };
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatDateStamp(date) {
  return date.toISOString().replace(/[:.]/g, "").replace("T", "-").replace("Z", "Z");
}

/**
 * @param {string} repoRoot
 * @returns {Promise<string | null>}
 */
async function latestScanPath(repoRoot) {
  const scansRoot = path.join(repoRoot, RULE_SHARE_DIR, SCANS_DIR);
  if (!existsSync(scansRoot)) {
    return null;
  }
  const entries = (await readdir(scansRoot)).filter((entry) => entry.endsWith(".json")).sort();
  const latest = entries.at(-1);
  return latest ? path.join(scansRoot, latest) : null;
}

/**
 * @param {string} filePath
 * @returns {Promise<RuleShareSnapshot>}
 */
async function readSnapshot(filePath) {
  return /** @type {RuleShareSnapshot} */ (JSON.parse(await readFile(filePath, "utf8")));
}

/**
 * @param {string} repoRoot
 * @param {RuleShareSnapshot} snapshot
 * @param {string | undefined} outputPath
 * @returns {Promise<string>}
 */
async function writeSnapshot(repoRoot, snapshot, outputPath) {
  const targetPath =
    outputPath ?? path.join(repoRoot, RULE_SHARE_DIR, SCANS_DIR, `rule-share-${formatDateStamp(new Date(snapshot.generatedAt))}.json`);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return targetPath;
}

/**
 * @returns {never}
 */
function usage() {
  throw new Error(
    [
      "Usage:",
      "  node scripts/rule-share.mjs scan [--output <path>] [--json]",
      "  node scripts/rule-share.mjs report --latest|--scan <path> [--json]",
      "  node scripts/rule-share.mjs apply-plan --approval <path> --dry-run [--scan <path>] [--json]"
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
    const snapshot = await scanRuleShare({ repoRoot });
    const outputPath = await writeSnapshot(repoRoot, snapshot, typeof flags.output === "string" ? flags.output : undefined);
    const payload = {
      status: "ok",
      outputPath,
      starterHead: snapshot.starterHead,
      starterDirty: snapshot.starterDirty,
      allowlistConfigured: snapshot.allowlistConfigured,
      registryRules: snapshot.registryRules.length,
      projects: snapshot.projects.length,
      ready: snapshot.projects.filter((project) => project.status === "ready").length,
      upToDate: snapshot.projects.filter((project) => project.status === "up_to_date").length,
      needsReview: snapshot.projects.filter((project) => project.status === "needs_review").length,
      blocked: snapshot.projects.filter((project) => project.status === "blocked").length,
      missingRules: snapshot.projects.reduce((count, project) => count + (project.missingRules ?? []).length, 0),
      blockedRules: snapshot.projects.reduce((count, project) => count + (project.blockedRules ?? []).length, 0)
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (command === "report") {
    const scanPath = typeof flags.scan === "string" ? flags.scan : flags.latest === true ? await latestScanPath(repoRoot) : null;
    if (!scanPath) {
      throw new Error("No scan selected. Use --latest or --scan <path>.");
    }
    const snapshot = await readSnapshot(scanPath);
    const text = renderRuleShareReport(snapshot);
    if (flags.json === true) {
      console.log(JSON.stringify({ status: "ok", scanPath, text, snapshot }, null, 2));
    } else {
      console.log(text);
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
      throw new Error("No scan found. Use --scan <path> or run rule-share:scan first.");
    }
    const snapshot = await readSnapshot(scanPath);
    const approval = /** @type {RuleShareApproval} */ (JSON.parse(await readFile(flags.approval, "utf8")));
    const plan = buildShareApplyPlan(snapshot, approval);
    console.log(JSON.stringify({ ...plan, dryRun: true, scanPath }, null, 2));
    return;
  }

  usage();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

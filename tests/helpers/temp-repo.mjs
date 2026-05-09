// @ts-check

import { cp, mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCommand } from "../../scripts/lib/runtime.mjs";

const THIS_FILE = fileURLToPath(import.meta.url);
const TESTS_DIR = path.dirname(path.dirname(THIS_FILE));
const REPO_ROOT = path.dirname(TESTS_DIR);

/**
 * @param {string} source
 * @returns {boolean}
 */
function shouldSkipSource(source) {
  const base = path.basename(source);
  if (base === ".git") {
    return true;
  }
  return source.includes(`${path.sep}node_modules${path.sep}`) ||
    source.includes(`${path.sep}runtime${path.sep}`) ||
    source.includes(`${path.sep}tmp${path.sep}`) ||
    source.includes(`${path.sep}coverage${path.sep}`) ||
    source.includes(`${path.sep}playwright-report${path.sep}`);
}

/**
 * @param {string} source
 * @param {string} target
 * @returns {Promise<void>}
 */
async function copyStarterContents(source, target) {
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if ([".git", "node_modules", "runtime", "tmp", "coverage", "playwright-report"].includes(entry.name)) {
      continue;
    }
    await cp(path.join(source, entry.name), path.join(target, entry.name), { recursive: true });
  }
}

/**
 * @param {{installDependencies?: boolean}} [options]
 * @returns {Promise<{repoRoot: string, codexHome: string, cleanup: () => Promise<void>}>}
 */
export async function createTempStarterRepo(options = {}) {
  const baseDir = await mkdtemp(path.join(os.tmpdir(), "starter-repo-"));
  const repoRoot = path.join(baseDir, "repo");
  const codexHome = path.join(baseDir, "codex-home");
  await cp(REPO_ROOT, repoRoot, {
    recursive: true,
    filter: (source) => !shouldSkipSource(source)
  });

  runCommand(repoRoot, "git", ["init", "-b", "main"]);
  runCommand(repoRoot, "git", ["config", "user.email", "tester@example.com"]);
  runCommand(repoRoot, "git", ["config", "user.name", "Starter Tester"]);
  runCommand(repoRoot, "git", ["add", "."]);
  runCommand(repoRoot, "git", ["commit", "-m", "Initial commit"]);

  if (options.installDependencies) {
    runCommand(repoRoot, "npm", ["ci"]);
  }

  return {
    repoRoot,
    codexHome,
    cleanup: async () => {
      await rm(baseDir, { recursive: true, force: true });
    }
  };
}

/**
 * @param {string} repoRoot
 * @param {string[]} args
 * @param {{env?: Record<string, string | undefined>, allowFailure?: boolean}} [options]
 * @returns {import("../../scripts/lib/runtime.mjs").CommandResult}
 */
export function runStarterScript(repoRoot, args, options = {}) {
  return runCommand(repoRoot, "node", args, {
    allowFailure: options.allowFailure,
    env: options.env
  });
}

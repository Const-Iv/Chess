// @ts-check

import { access } from "node:fs/promises";
import path from "node:path";

import { findGitRoot, getChangedFiles, listRepoFiles } from "./lib/runtime.mjs";
import { lintFiles } from "./repo-lint.mjs";

/**
 * @param {string} repoRoot
 * @param {string} relativePath
 * @returns {Promise<boolean>}
 */
async function fileExists(repoRoot, relativePath) {
  try {
    await access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const repoRoot = (() => {
    try {
      return findGitRoot(process.cwd());
    } catch {
      return process.cwd();
    }
  })();

  const changedFiles = (await getChangedFiles(repoRoot)).filter(Boolean);
  const targetFiles = [];
  for (const changedFile of changedFiles) {
    if (await fileExists(repoRoot, changedFile)) {
      targetFiles.push(changedFile);
    }
  }

  const filesToLint = changedFiles.length > 0 ? targetFiles : await listRepoFiles(repoRoot);
  const issues = await lintFiles(repoRoot, filesToLint, true);

  if (issues.length > 0) {
    console.error(issues.join("\n"));
    process.exit(1);
  }

  console.log(`lint-fix-changed: normalized ${targetFiles.length > 0 ? targetFiles.length : "all"} lintable files`);
}

await main();

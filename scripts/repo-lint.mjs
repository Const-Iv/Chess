// @ts-check

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { findGitRoot, listRepoFiles, parseArgs } from "./lib/runtime.mjs";

const TEXT_FILE_PATTERN = /\.(md|mjs|json|yml|yaml|txt)$/;
const EXTRA_TEXT_FILES = new Set([
  ".cursorrules",
  ".env.example",
  ".gitignore",
  "AGENTS.md",
  "CLAUDE.md",
  "CODEX_MEMORY.md"
]);
const BANNED_SNIPPETS = [
  "// ... existing code",
  "TODO later",
  "<replace-with-",
  "placeholder implementation"
];
const EXECUTABLE_FILE_PATTERN = /\.(mjs|js|ts|tsx|cjs)$/;

/**
 * @param {string} relativePath
 * @returns {boolean}
 */
function isLintable(relativePath) {
  return TEXT_FILE_PATTERN.test(relativePath) || EXTRA_TEXT_FILES.has(relativePath);
}

/**
 * @param {string} content
 * @returns {string}
 */
function normalizeContent(content) {
  return `${content.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\t/g, "  ").replace(/\n*$/, "")}\n`;
}

/**
 * @param {string} repoRoot
 * @param {string[]} files
 * @param {boolean} fix
 * @returns {Promise<string[]>}
 */
export async function lintFiles(repoRoot, files, fix) {
  /** @type {string[]} */
  const issues = [];

  for (const relativePath of files.filter(isLintable)) {
    const absolutePath = path.join(repoRoot, relativePath);
    const original = await readFile(absolutePath, "utf8");
    const normalized = normalizeContent(original);

    if (fix && normalized !== original) {
      await writeFile(absolutePath, normalized, "utf8");
    }

    const content = fix ? normalized : original;
    if (/\r\n/.test(content)) {
      issues.push(`${relativePath}: CRLF is not allowed.`);
    }
    if (/[ \t]+$/m.test(content)) {
      issues.push(`${relativePath}: trailing whitespace is not allowed.`);
    }
    if (/\t/.test(content)) {
      issues.push(`${relativePath}: tabs are not allowed.`);
    }
    if (!content.endsWith("\n")) {
      issues.push(`${relativePath}: file must end with a newline.`);
    }
    if (EXECUTABLE_FILE_PATTERN.test(relativePath) && relativePath !== "scripts/repo-lint.mjs") {
      for (const snippet of BANNED_SNIPPETS) {
        if (content.includes(snippet)) {
          issues.push(`${relativePath}: banned placeholder snippet "${snippet}" found.`);
        }
      }
    }
  }

  return issues;
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const fix = flags.fix === true;
  const repoRoot = (() => {
    try {
      return findGitRoot(process.cwd());
    } catch {
      return process.cwd();
    }
  })();

  /** @type {string[]} */
  const files = [];
  if (typeof flags.files === "string") {
    files.push(flags.files);
  } else if (Array.isArray(flags.files)) {
    files.push(...flags.files);
  } else {
    files.push(...(await listRepoFiles(repoRoot)));
  }

  const issues = await lintFiles(repoRoot, files, fix);
  if (issues.length > 0) {
    console.error(issues.join("\n"));
    process.exit(1);
  }

  console.log(`repo-lint: ok (${files.filter(isLintable).length} files checked)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

// @ts-check

import path from "node:path";
import { pathToFileURL } from "node:url";

import { fileExists, runCommand } from "./lib/runtime.mjs";

/**
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function getRequiredRuntimeFiles(repoRoot) {
  return [
    path.join(repoRoot, "node_modules", "typescript", "bin", "tsc")
  ];
}

/**
 * @param {string} repoRoot
 * @returns {Promise<{installed: boolean, missing: string[]}>}
 */
export async function ensureDependencies(repoRoot) {
  const requiredFiles = getRequiredRuntimeFiles(repoRoot);
  const missing = [];
  for (const filePath of requiredFiles) {
    if (!(await fileExists(filePath))) {
      missing.push(filePath);
    }
  }

  if (missing.length === 0) {
    return { installed: false, missing: [] };
  }

  runCommand(repoRoot, "npm", ["ci"]);

  const unresolved = [];
  for (const filePath of requiredFiles) {
    if (!(await fileExists(filePath))) {
      unresolved.push(filePath);
    }
  }

  if (unresolved.length > 0) {
    throw new Error(`Dependency recovery failed. Missing runtime files: ${unresolved.join(", ")}`);
  }

  return { installed: true, missing };
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const result = await ensureDependencies(process.cwd());
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

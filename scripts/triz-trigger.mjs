// @ts-check

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { detectChangedZones, readTaskEvents } from "./lib/conveyor-utils.mjs";
import {
  appendHistoryEvent,
  fileExists,
  formatIso,
  getChangedFiles,
  getCurrentBranch,
  loadTaskStateByBranch,
  parseArgs,
} from "./lib/runtime.mjs";

/**
 * @param {string} repoRoot
 * @param {import("./lib/runtime.mjs").TaskState} state
 * @returns {Promise<string[]>}
 */
export async function evaluateTrizTriggers(repoRoot, state) {
  const events = await readTaskEvents(repoRoot, state.taskId);
  const qaAttempts = events.filter((event) => event.type === "QA_ATTEMPT");
  /** @type {string[]} */
  const reasons = [];

  if (qaAttempts.length >= 2) {
    const last = qaAttempts.at(-1);
    const previous = qaAttempts.at(-2);
    if (
      last?.payload.status === "FAIL" &&
      previous?.payload.status === "FAIL" &&
      last.payload.failedStage === previous.payload.failedStage
    ) {
      reasons.push("qa_repeat_stage");
    }
  }

  if (qaAttempts.length >= 3) {
    const lastChunk = qaAttempts.slice(-3);
    if (lastChunk.every((event) => event.payload.status === "FAIL")) {
      reasons.push("qa_chunk_exhausted");
    }
  }

  const changedFiles = await getChangedFiles(repoRoot);
  const zones = detectChangedZones(changedFiles);
  if (zones.size >= 2) {
    reasons.push("cross_module_conflict");
  }

  const keywords = state.title
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((word) => word.length >= 4);

  const searchableDocs = [
    "Docs/qa-implementation-log.md",
    "Docs/change-ledger.md"
  ];
  const searchablePlansDir = path.join(repoRoot, "plans");
  let historicalHit = false;
  for (const relativePath of searchableDocs) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!(await fileExists(absolutePath))) {
      continue;
    }
    const content = (await readFile(absolutePath, "utf8")).toLowerCase();
    if (keywords.some((word) => content.includes(word))) {
      historicalHit = true;
      break;
    }
  }
  if (!historicalHit && (await fileExists(searchablePlansDir))) {
    const names = await readdir(searchablePlansDir);
    historicalHit = names.some((name) => keywords.some((word) => name.toLowerCase().includes(word)));
  }
  if (historicalHit) {
    reasons.push("historical_recurrence");
  }

  return [...new Set(reasons)];
}

/**
 * @param {string} repoRoot
 * @param {import("./lib/runtime.mjs").TaskState} state
 * @param {string[]} reasons
 * @returns {Promise<void>}
 */
export async function recordTrizTrigger(repoRoot, state, reasons) {
  if (reasons.length === 0) {
    return;
  }

  await appendHistoryEvent(repoRoot, {
    at: formatIso(),
    type: "TRIZ_TRIGGER",
    taskId: state.taskId,
    branch: state.branch,
    payload: { reasons }
  });

  const logPath = path.join(repoRoot, "Docs/triz-usage-log.md");
  const block = [
    `## ${formatIso()} ${state.taskId}`,
    "",
    `- Branch: \`${state.branch}\``,
    `- Reasons: ${reasons.join(", ")}`,
    `- Status: trigger recorded`,
    ""
  ].join("\n");
  const current = (await fileExists(logPath)) ? await readFile(logPath, "utf8") : "# TRIZ Usage Log\n\n";
  await writeFile(logPath, `${current.trim()}\n\n${block}`, "utf8");
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const repoRoot = process.cwd();
  const { flags } = parseArgs(process.argv.slice(2));
  const branch = typeof flags.branch === "string" ? flags.branch : getCurrentBranch(repoRoot);
  const state = await loadTaskStateByBranch(repoRoot, branch);
  if (!state) {
    throw new Error(`Task state not found for branch ${branch}`);
  }
  const reasons = await evaluateTrizTriggers(repoRoot, state);
  await recordTrizTrigger(repoRoot, state, reasons);
  console.log(JSON.stringify({ taskId: state.taskId, reasons }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

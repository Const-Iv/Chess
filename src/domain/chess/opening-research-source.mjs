// @ts-check

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const OPENING_RESEARCH_SOURCE_NOTE =
  "Imported app-ready v1 deep-research pack copied into research/chess-openings-app-ready-v1. Lines are treated as a study catalog: every SAN line is checked locally with chess.js, and the Lichess prefix validation file records whether the PGN is an exact Lichess chess-openings line or a deeper continuation of a known Lichess prefix.";

export const OPENING_RESEARCH_PATHS = Object.freeze({
  sourceJson: "research/chess-openings-app-ready-v1/chess_openings_knowledge_base_ru.json",
  validationJson: "research/chess-openings-app-ready-v1/lichess_prefix_validation_2026-05-09.json"
});

const SOURCE_JSON_PATH = resolve(process.cwd(), OPENING_RESEARCH_PATHS.sourceJson);
const VALIDATION_JSON_PATH = resolve(process.cwd(), OPENING_RESEARCH_PATHS.validationJson);

/**
 * @param {string} path
 * @returns {unknown}
 */
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @returns {unknown}
 */
export function loadOpeningResearchSource() {
  return readJson(SOURCE_JSON_PATH);
}

/**
 * @returns {unknown}
 */
export function loadOpeningResearchValidation() {
  return readJson(VALIDATION_JSON_PATH);
}

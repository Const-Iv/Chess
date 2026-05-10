// @ts-check

import openingResearchSource from "../../../research/chess-openings-app-ready-v1/chess_openings_knowledge_base_ru.json" with {
  type: "json"
};
import openingResearchValidation from "../../../research/chess-openings-app-ready-v1/lichess_prefix_validation_2026-05-09.json" with {
  type: "json"
};

export const OPENING_RESEARCH_SOURCE_NOTE =
  "Imported app-ready v1 deep-research pack copied into research/chess-openings-app-ready-v1. Lines are treated as a study catalog: every SAN line is checked locally with chess.js, and the Lichess prefix validation file records whether the PGN is an exact Lichess chess-openings line or a deeper continuation of a known Lichess prefix.";

export const OPENING_RESEARCH_PATHS = Object.freeze({
  sourceJson: "research/chess-openings-app-ready-v1/chess_openings_knowledge_base_ru.json",
  validationJson: "research/chess-openings-app-ready-v1/lichess_prefix_validation_2026-05-09.json"
});

/**
 * @returns {unknown}
 */
export function loadOpeningResearchSource() {
  return openingResearchSource;
}

/**
 * @returns {unknown}
 */
export function loadOpeningResearchValidation() {
  return openingResearchValidation;
}

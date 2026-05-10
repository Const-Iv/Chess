// @ts-check

import theoryEvidenceSource from "../../../research/chess-theory-deep-research-2026-05-10/position-evidence.json" with {
  type: "json"
};

export const THEORY_EVIDENCE_SOURCE_NOTE =
  "Deep research evidence layer generated from Lichess Broadcast Database 2026-01..2026-04. It records real-game move frequencies for current study-side positions. Broadcast games are CC BY-SA 4.0; source attribution is preserved in the research artifact.";

export const THEORY_EVIDENCE_PATH = "research/chess-theory-deep-research-2026-05-10/position-evidence.json";

/**
 * @typedef {Readonly<{
 *   event: string;
 *   white: string;
 *   black: string;
 *   whiteElo: string;
 *   blackElo: string;
 *   whiteTitle: string;
 *   blackTitle: string;
 *   result: string;
 *   date: string;
 *   opening: string;
 *   eco: string;
 *   gameUrl: string;
 *   broadcastUrl: string;
 * }>} TheoryGameExample
 *
 * @typedef {Readonly<{
 *   san: string;
 *   games: number;
 *   white: number;
 *   draw: number;
 *   black: number;
 *   unknown: number;
 *   examples: readonly TheoryGameExample[];
 * }>} TheoryBroadcastMove
 *
 * @typedef {Readonly<{
 *   openingKey: string;
 *   openingName: string;
 *   studySide: "white"|"black";
 *   sourceName: string;
 *   lineKey: string;
 *   lineLabel: string;
 *   anchorPly: number;
 *   anchorFen: string;
 *   positionKey: string;
 *   expectedSan: string;
 *   verifiedBadMoves: readonly string[];
 *   lichessBroadcast: Readonly<{
 *     moves: readonly TheoryBroadcastMove[];
 *   }>;
 * }>} PositionTheoryEvidence
 *
 * @typedef {Readonly<{
 *   generatedAt: string;
 *   summary: Readonly<Record<string, number>>;
 *   positions: readonly PositionTheoryEvidence[];
 * }>} TheoryEvidenceSource
 */

/**
 * @returns {TheoryEvidenceSource}
 */
export function loadTheoryEvidenceSource() {
  return /** @type {TheoryEvidenceSource} */ (theoryEvidenceSource);
}

/**
 * @param {string} fen
 */
export function normalizeTheoryFen(fen) {
  return fen.split(" ").slice(0, 4).join(" ");
}

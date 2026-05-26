// @ts-check

import { Chess } from "chess.js";

export const STOCKFISH_ENGINE_SOURCE =
  "Stockfish.js 18 lite single-threaded, GPLv3, local browser WebAssembly worker";

const WHITE_BAR_MIN_PERCENT = 4;
const WHITE_BAR_MAX_PERCENT = 96;
const EQUAL_CP_THRESHOLD = 35;

/**
 * @typedef {Readonly<{
 *   kind: "cp";
 *   value: number;
 * }>} CentipawnScore
 *
 * @typedef {Readonly<{
 *   kind: "mate";
 *   value: number;
 * }>} MateScore
 *
 * @typedef {CentipawnScore|MateScore} EngineScore
 *
 * @typedef {Readonly<{
 *   depth: number | null;
 *   score: EngineScore;
 *   pv: readonly string[];
 * }>} ParsedStockfishInfo
 *
 * @typedef {"loading"|"ready"|"unavailable"} EngineEvaluationStatus
 * @typedef {"white"|"black"|"equal"} EngineAdvantage
 *
 * @typedef {Readonly<{
 *   status: EngineEvaluationStatus;
 *   fen: string;
 *   scoreText: string;
 *   barWhitePercent: number;
 *   advantage: EngineAdvantage;
 *   summary: string;
 *   source: string;
 *   depth: number | null;
 *   bestMove: string | null;
 *   bestMoveSan: string | null;
 *   pv: readonly string[];
 * }>} EngineEvaluationView
 */

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {number} value
 */
function roundToTenth(value) {
  return Math.round(value * 10) / 10;
}

/**
 * @param {string} line
 * @returns {ParsedStockfishInfo | null}
 */
export function parseStockfishInfoLine(line) {
  if (!line.startsWith("info ")) {
    return null;
  }

  const depthMatch = line.match(/\bdepth\s+(\d+)\b/);
  const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)\b/);

  if (!scoreMatch) {
    return null;
  }

  const scoreKind = scoreMatch[1];
  const scoreValue = Number(scoreMatch[2]);

  if (!Number.isFinite(scoreValue)) {
    return null;
  }

  const pvMatch = line.match(/\bpv\s+(.+)$/);
  const pv = pvMatch?.[1]?.trim().split(/\s+/).filter(Boolean) ?? [];

  return {
    depth: depthMatch ? Number(depthMatch[1]) : null,
    score: scoreKind === "mate" ? { kind: "mate", value: scoreValue } : { kind: "cp", value: scoreValue },
    pv
  };
}

/**
 * @param {string} line
 */
export function parseStockfishBestMoveLine(line) {
  const match = line.match(/^bestmove\s+(\S+)/);
  const bestMove = match?.[1] ?? null;

  if (!bestMove || bestMove === "(none)") {
    return null;
  }

  return bestMove;
}

/**
 * @param {EngineScore | null} score
 */
export function formatEngineScore(score) {
  if (!score) {
    return "0.00";
  }

  if (score.kind === "mate") {
    return `M${score.value}`;
  }

  const pawns = score.value / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

/**
 * @param {EngineScore | null} score
 * @returns {EngineAdvantage}
 */
function getEngineAdvantage(score) {
  if (!score) {
    return "equal";
  }

  if (score.kind === "mate") {
    return score.value > 0 ? "white" : "black";
  }

  if (score.value > EQUAL_CP_THRESHOLD) {
    return "white";
  }

  if (score.value < -EQUAL_CP_THRESHOLD) {
    return "black";
  }

  return "equal";
}

/**
 * @param {EngineScore | null} score
 */
function getWhiteBarPercent(score) {
  if (!score) {
    return 50;
  }

  if (score.kind === "mate") {
    return score.value > 0 ? WHITE_BAR_MAX_PERCENT : WHITE_BAR_MIN_PERCENT;
  }

  return roundToTenth(clamp(50 + score.value / 12, WHITE_BAR_MIN_PERCENT, WHITE_BAR_MAX_PERCENT));
}

/**
 * Stockfish UCI reports score from the side-to-move perspective. The UI bar is
 * always white-vs-black, so black-to-move positions must be inverted.
 *
 * @param {string} fen
 * @param {EngineScore | null} score
 * @returns {EngineScore | null}
 */
function normalizeScoreToWhitePerspective(fen, score) {
  if (!score) {
    return null;
  }

  const turn = fen.split(/\s+/)[1];

  if (turn !== "b") {
    return score;
  }

  return {
    kind: score.kind,
    value: -score.value
  };
}

/**
 * @param {EngineAdvantage} advantage
 * @param {EngineScore | null} score
 */
function getEvaluationSummary(advantage, score) {
  if (score?.kind === "mate") {
    return advantage === "white" ? "Матовая угроза за белых." : "Матовая угроза за черных.";
  }

  if (advantage === "white") {
    return "Белым лучше по короткому расчету движка.";
  }

  if (advantage === "black") {
    return "Черным лучше по короткому расчету движка.";
  }

  return "Позиция близка к равной по короткому расчету движка.";
}

/**
 * @param {string} fen
 * @param {string | null | undefined} uciMove
 */
export function uciMoveToSan(fen, uciMove) {
  if (!uciMove || uciMove.length < 4 || fen === "startpos") {
    return uciMove ?? null;
  }

  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
      promotion: uciMove[4]
    });

    return move?.san ?? uciMove;
  } catch {
    return uciMove;
  }
}

/**
 * @param {Readonly<{
 *   fen: string;
 *   info: ParsedStockfishInfo | null;
 *   bestMove: string | null;
 *   source?: string;
 * }>} input
 * @returns {EngineEvaluationView}
 */
export function buildEngineEvaluationView(input) {
  const score = normalizeScoreToWhitePerspective(input.fen, input.info?.score ?? null);
  const advantage = getEngineAdvantage(score);
  const depthText = input.info?.depth ? `depth ${input.info.depth}` : "depth pending";
  const source = `${input.source ?? STOCKFISH_ENGINE_SOURCE}; короткий расчет ${depthText}`;

  return {
    status: "ready",
    fen: input.fen,
    scoreText: formatEngineScore(score),
    barWhitePercent: getWhiteBarPercent(score),
    advantage,
    summary: getEvaluationSummary(advantage, score),
    source,
    depth: input.info?.depth ?? null,
    bestMove: input.bestMove,
    bestMoveSan: uciMoveToSan(input.fen, input.bestMove),
    pv: input.info?.pv ?? []
  };
}

/**
 * @param {string} fen
 * @returns {EngineEvaluationView}
 */
export function buildPendingEngineEvaluationView(fen) {
  return {
    status: "loading",
    fen,
    scoreText: "счет...",
    barWhitePercent: 50,
    advantage: "equal",
    summary: "Stockfish считает позицию.",
    source: STOCKFISH_ENGINE_SOURCE,
    depth: null,
    bestMove: null,
    bestMoveSan: null,
    pv: []
  };
}

/**
 * @param {EngineEvaluationView} previous
 * @param {string} fen
 * @returns {EngineEvaluationView}
 */
export function markEngineEvaluationRefreshing(previous, fen) {
  return {
    ...previous,
    status: "loading",
    fen,
    summary: "Stockfish считает новую позицию; шкала пока показывает предыдущую оценку.",
    source: `${STOCKFISH_ENGINE_SOURCE}; предыдущая оценка остается до нового расчета`
  };
}

/**
 * @param {string} fen
 * @param {string} message
 * @returns {EngineEvaluationView}
 */
export function buildUnavailableEngineEvaluationView(fen, message) {
  return {
    status: "unavailable",
    fen,
    scoreText: "нет оценки",
    barWhitePercent: 50,
    advantage: "equal",
    summary: message,
    source: STOCKFISH_ENGINE_SOURCE,
    depth: null,
    bestMove: null,
    bestMoveSan: null,
    pv: []
  };
}

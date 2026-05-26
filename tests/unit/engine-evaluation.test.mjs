// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEngineEvaluationView,
  formatEngineScore,
  markEngineEvaluationRefreshing,
  parseStockfishBestMoveLine,
  parseStockfishInfoLine,
  uciMoveToSan
} from "../../src/domain/chess/engine-evaluation.mjs";

test("parses centipawn Stockfish info and maps it to a white advantage bar", () => {
  const parsed = parseStockfishInfoLine("info depth 14 seldepth 18 score cp 126 nodes 1200 nps 40000 pv e2e4 e7e5");

  assert.deepEqual(parsed, {
    depth: 14,
    score: {
      kind: "cp",
      value: 126
    },
    pv: ["e2e4", "e7e5"]
  });

  const view = buildEngineEvaluationView({
    bestMove: "e2e4",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    info: parsed,
    source: "Stockfish.js 18 lite"
  });

  assert.equal(view.status, "ready");
  assert.equal(view.advantage, "white");
  assert.equal(view.scoreText, "+1.26");
  assert.equal(view.barWhitePercent, 60.5);
  assert.equal(view.bestMoveSan, "e4");
  assert.match(view.summary, /Белым лучше/);
  assert.match(view.source, /короткий расчет/);
});

test("normalizes black-to-move Stockfish scores into white perspective", () => {
  const parsed = parseStockfishInfoLine("info depth 21 score cp -37 nodes 34000 pv c7c5 g1f3");
  const view = buildEngineEvaluationView({
    bestMove: "c7c5",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    info: parsed,
    source: "Stockfish.js 18 lite"
  });

  assert.equal(view.advantage, "white");
  assert.equal(view.scoreText, "+0.37");
  assert.equal(view.barWhitePercent, 53.1);
  assert.equal(view.bestMoveSan, "c5");
  assert.match(view.summary, /Белым лучше/);
});

test("parses mate scores without converting them to centipawns", () => {
  const parsed = parseStockfishInfoLine("info depth 9 score mate -3 pv h7h8q g1h2");
  const view = buildEngineEvaluationView({
    bestMove: "h7h8q",
    fen: "k7/7P/8/8/8/8/6p1/6K1 w - - 0 1",
    info: parsed,
    source: "Stockfish.js 18 lite"
  });

  assert.equal(formatEngineScore(parsed?.score ?? null), "M-3");
  assert.equal(view.advantage, "black");
  assert.equal(view.barWhitePercent, 4);
  assert.equal(view.bestMoveSan, "h8=Q+");
  assert.match(view.summary, /Матовая угроза за черных/);
});

test("parses bestmove lines and keeps unknown moves safe", () => {
  assert.equal(parseStockfishBestMoveLine("bestmove g1f3 ponder g8f6"), "g1f3");
  assert.equal(parseStockfishBestMoveLine("info depth 1 score cp 0"), null);
  assert.equal(parseStockfishBestMoveLine("bestmove (none)"), null);
  assert.equal(uciMoveToSan("startpos", "g1f3"), "g1f3");
});

test("refreshing evaluation keeps the previous bar until the next score arrives", () => {
  const previous = buildEngineEvaluationView({
    bestMove: "e2e4",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    info: parseStockfishInfoLine("info depth 12 score cp 72 pv e2e4"),
    source: "Stockfish.js 18 lite"
  });
  const refreshing = markEngineEvaluationRefreshing(
    previous,
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
  );

  assert.equal(refreshing.status, "loading");
  assert.equal(refreshing.fen, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
  assert.equal(refreshing.scoreText, previous.scoreText);
  assert.equal(refreshing.barWhitePercent, previous.barWhitePercent);
  assert.equal(refreshing.advantage, previous.advantage);
  assert.match(refreshing.summary, /считает новую позицию/);
});

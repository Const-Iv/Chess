// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import {
  RUY_LOPEZ_EXPECTED_FEN,
  RUY_LOPEZ_SAN_LINE,
  RUY_LOPEZ_STUDY_SIDE,
  buildRuyLopezLesson,
  playStrictSanLine
} from "../../src/domain/chess/ruy-lopez.mjs";

test("Ruy Lopez lesson applies the approved legal SAN line", () => {
  const { chess, appliedSan } = playStrictSanLine(RUY_LOPEZ_SAN_LINE);

  assert.deepEqual(appliedSan, RUY_LOPEZ_SAN_LINE);
  assert.equal(chess.fen(), RUY_LOPEZ_EXPECTED_FEN);
});

test("Ruy Lopez lesson exposes verified learning content and legal continuations", () => {
  const lesson = buildRuyLopezLesson();

  assert.equal(lesson.status, "ПРОВЕРЕНО");
  assert.equal(lesson.opening.name, "Испанская партия");
  assert.equal(lesson.opening.sourceName, "Ruy Lopez");
  assert.equal(lesson.opening.studySide, RUY_LOPEZ_STUDY_SIDE);
  assert.deepEqual(lesson.opening.aliases, ["Дебют Руя Лопеса", "Испанская игра"]);
  assert.match(lesson.opening.verification, /Chess\.com/);
  assert.match(lesson.opening.principle, /центр/);
  assert.match(lesson.opening.positionGoal, /пешки e5/);
  assert.match(lesson.opening.middlegamePlan, /отогнать опасного слона/);
  assert.deepEqual(
    lesson.opening.continuations.map((continuation) => continuation.san),
    ["a6", "Nf6", "d6"]
  );
  assert.deepEqual(
    lesson.opening.badMoves.map((badMove) => badMove.san),
    ["f6", "Qf6", "h6"]
  );
  assert.equal(lesson.baseLine.steps.at(-1)?.board.length, 64);
  assert.equal(lesson.baseLine.steps.at(-1)?.board[0]?.square, "h1");
  assert.equal(lesson.baseLine.steps.at(-1)?.board.at(-1)?.square, "a8");
  const b5Piece = lesson.baseLine.steps.at(-1)?.board.find((square) => square.square === "b5")?.piece;
  assert.equal(b5Piece?.color, "white");
  assert.equal(b5Piece?.symbol, "♝");
});

test("Ruy Lopez continuations expose beginner move-by-move explanations", () => {
  const lesson = buildRuyLopezLesson();
  const morphy = lesson.opening.continuations.find((continuation) => continuation.key === "morphy");

  assert.ok(morphy);
  assert.equal(morphy.label, "Защита Морфи");
  assert.equal(morphy.steps.length, 10);

  const firstContinuationMove = morphy.steps[5];
  assert.equal(firstContinuationMove.san, "a6");
  assert.equal(firstContinuationMove.from, "a7");
  assert.equal(firstContinuationMove.to, "a6");
  assert.match(firstContinuationMove.explanation, /пешка идет с a7 на a6/);
  assert.match(firstContinuationMove.purpose, /развить коня g8/);
  assert.match(morphy.idea, /Дальше развить коня g8/);
  assert.equal(firstContinuationMove.board.find((square) => square.square === "a6")?.piece?.symbol, "♟");
  assert.equal(firstContinuationMove.board.find((square) => square.square === "a7")?.piece, null);
});

test("Ruy Lopez bad moves expose legal moves and beginner reasons", () => {
  const lesson = buildRuyLopezLesson();
  const f6 = lesson.opening.badMoves.find((badMove) => badMove.san === "f6");
  const qf6 = lesson.opening.badMoves.find((badMove) => badMove.san === "Qf6");

  assert.ok(f6);
  assert.equal(f6.from, "f7");
  assert.equal(f6.to, "f6");
  assert.match(f6.whyBad, /открывает диагонали к королю e8/);
  assert.match(f6.betterPlan, /Nf6|a6/);
  assert.equal(f6.steps.length, RUY_LOPEZ_SAN_LINE.length + 1);
  assert.equal(f6.steps.at(-1)?.san, "f6");
  assert.equal(f6.steps.at(-1)?.from, "f7");
  assert.equal(f6.steps.at(-1)?.to, "f6");
  assert.match(f6.steps.at(-1)?.title ?? "", /Плохой ход/);
  assert.match(f6.steps.at(-1)?.purpose ?? "", /Лучше/);

  assert.ok(qf6);
  assert.equal(qf6.from, "d8");
  assert.equal(qf6.to, "f6");
  assert.match(qf6.whyBad, /Ферзь d8 идет на f6/);
  assert.equal(qf6.steps.at(-1)?.san, "Qf6");
});

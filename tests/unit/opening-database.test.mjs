// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import {
  OPENING_SEEDS,
  OPENING_SOURCE_NOTE,
  RUY_LOPEZ_EXPECTED_FEN,
  buildOpeningLessons,
  buildRuyLopezLesson
} from "../../src/domain/chess/opening-database.mjs";

test("opening database exposes a verified core repertoire", () => {
  const lessons = buildOpeningLessons();

  assert.equal(lessons.length, 18);
  assert.equal(lessons.length, OPENING_SEEDS.length);
  assert.match(OPENING_SOURCE_NOTE, /Chess\.com/);
  assert.match(OPENING_SOURCE_NOTE, /ECO/);

  for (const lesson of lessons) {
    assert.equal(lesson.status, "ПРОВЕРЕНО");
    assert.equal(lesson.baseLine.steps.length, lesson.opening.lineSan.length);
    assert.ok(lesson.opening.continuations.length >= 3, lesson.opening.name);
    assert.ok(lesson.opening.badMoves.length >= 1, lesson.opening.name);
    assert.equal(lesson.baseLine.steps.at(-1)?.board.length, 64);

    for (const continuation of lesson.opening.continuations) {
      assert.ok(continuation.steps.length > lesson.baseLine.steps.length, `${lesson.opening.name}: ${continuation.san}`);
      assert.equal(continuation.steps.at(-1)?.board.length, 64);
    }

    for (const badMove of lesson.opening.badMoves) {
      assert.equal(badMove.steps.length, lesson.baseLine.steps.length + 1, `${lesson.opening.name}: ${badMove.san}`);
      assert.equal(badMove.steps.at(-1)?.san, badMove.san);
      assert.match(badMove.steps.at(-1)?.title ?? "", /Плохой ход/);
      assert.ok(badMove.from);
      assert.ok(badMove.to);
    }
  }
});

test("Ruy Lopez compatibility lesson remains the same verified position", () => {
  const lesson = buildRuyLopezLesson();

  assert.equal(lesson.opening.name, "Испанская партия");
  assert.equal(lesson.fen, RUY_LOPEZ_EXPECTED_FEN);
});

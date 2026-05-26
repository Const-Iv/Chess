// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import { Chess } from "chess.js";

import { buildOpeningLessons } from "../../src/domain/chess/opening-database.mjs";
import { createFreeMoveRecordsFromSteps } from "../../src/domain/chess/trainer-session.mjs";

test("seeds free analysis from the selected theory step", () => {
  const lesson = buildOpeningLessons().find((candidate) => candidate.opening.key === "research-jobava_london");
  assert.ok(lesson);

  const selectedStepIndex = 5;
  const records = createFreeMoveRecordsFromSteps(lesson.baseLine.steps, selectedStepIndex);
  const replay = new Chess();

  for (const record of records) {
    replay.move(record.san, { strict: true });
  }

  assert.deepEqual(
    records.map((record) => record.san),
    lesson.baseLine.steps.slice(0, selectedStepIndex + 1).map((step) => step.san)
  );
  assert.equal(records.at(-1)?.before, lesson.baseLine.steps[selectedStepIndex].fenBefore);
  assert.equal(replay.fen(), lesson.baseLine.steps[selectedStepIndex].fenAfter);
  assert.match(records.at(-1)?.purpose ?? "", /план|центр|структур|давлен/i);
});

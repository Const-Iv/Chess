// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import { buildBadMoveCoverageReport } from "../../src/domain/chess/bad-move-coverage.mjs";
import {
  OPENING_SEEDS,
  RESEARCH_OPENING_SEEDS,
  IMPORTED_OPENING_SOURCE_NOTE,
  OPENING_SOURCE_NOTE,
  RUY_LOPEZ_EXPECTED_FEN,
  THEORY_REFERENCE_SOURCE_NOTE,
  THEORY_REFERENCE_SOURCES,
  buildOpeningLessons,
  buildRuyLopezLesson
} from "../../src/domain/chess/opening-database.mjs";

test("opening database exposes a verified core repertoire", () => {
  const lessons = buildOpeningLessons();
  const coreLessons = lessons.filter((lesson) => !lesson.opening.key.startsWith("research-"));

  assert.equal(coreLessons.length, 18);
  assert.equal(coreLessons.length, OPENING_SEEDS.length);
  assert.match(OPENING_SOURCE_NOTE, /Lichess/);
  assert.match(OPENING_SOURCE_NOTE, /ECO/);
  assert.match(OPENING_SOURCE_NOTE, /FCO/);
  assert.match(OPENING_SOURCE_NOTE, /Chess Structures/);

  for (const lesson of coreLessons) {
    assert.equal(lesson.status, "ПРОВЕРЕНО");
    assert.equal(lesson.baseLine.steps.length, lesson.opening.lineSan.length);
    assert.ok(lesson.opening.continuations.length >= 3, lesson.opening.name);
    assert.ok(lesson.opening.positionTheory.length >= 1, lesson.opening.name);
    assert.ok(lesson.opening.referenceSources.length >= 5, lesson.opening.name);
    assert.equal(lesson.baseLine.steps.at(-1)?.board.length, 64);

    for (const continuation of lesson.opening.continuations) {
      assert.ok(continuation.steps.length > lesson.baseLine.steps.length, `${lesson.opening.name}: ${continuation.san}`);
      assert.equal(continuation.steps.at(-1)?.board.length, 64);
    }

    for (const badMove of lesson.opening.badMoves) {
      assert.equal(badMove.steps.length, badMove.anchorLineSan.length + 1, `${lesson.opening.name}: ${badMove.san}`);
      assert.equal(badMove.steps.at(-1)?.san, badMove.san);
      assert.match(badMove.steps.at(-1)?.title ?? "", /Плохой ход/);
      assert.equal(badMove.anchorPly, badMove.anchorLineSan.length);
      assert.equal(badMove.steps.at(-1)?.fenBefore, badMove.anchorFen);
      assert.equal(badMove.source.status, "verified");
      assert.ok(badMove.source.title);
      assert.ok(badMove.source.note);
      assert.ok(badMove.from);
      assert.ok(badMove.to);
    }
  }
});

test("opening database records external reference sources without copying book text", () => {
  const referenceKeys = THEORY_REFERENCE_SOURCES.map((source) => source.key);

  assert.match(THEORY_REFERENCE_SOURCE_NOTE, /bibliographic-only/);
  assert.ok(referenceKeys.includes("fundamental-chess-openings"));
  assert.ok(referenceKeys.includes("mastering-the-chess-openings"));
  assert.ok(referenceKeys.includes("chess-structures"));
  assert.ok(referenceKeys.includes("eco-chess-informant"));
  assert.ok(referenceKeys.includes("lichess-broadcast-database"));

  for (const source of THEORY_REFERENCE_SOURCES) {
    assert.ok(source.title);
    assert.ok(source.url.startsWith("https://"));
    assert.ok(source.role);
    assert.ok(source.usage);
  }

  for (const source of THEORY_REFERENCE_SOURCES.filter((candidate) => candidate.kind === "bibliographic")) {
    assert.match(source.usage, /text|копируется|bibliographic/i);
  }
});

test("imported deep-research catalog is legal and source-labelled", () => {
  const lessons = buildOpeningLessons();
  const researchLessons = lessons.filter((lesson) => lesson.opening.key.startsWith("research-"));
  /** @type {Record<string, number>} */
  const priorityCounts = researchLessons.reduce((acc, lesson) => {
    const priority = lesson.opening.priority ?? "missing";
    acc[priority] = (acc[priority] ?? 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  assert.equal(RESEARCH_OPENING_SEEDS.length, 98);
  assert.equal(researchLessons.length, 98);
  assert.deepEqual(priorityCounts, { A: 52, B: 37, C: 9 });
  assert.match(IMPORTED_OPENING_SOURCE_NOTE, /deep-research/);
  assert.match(IMPORTED_OPENING_SOURCE_NOTE, /Lichess prefix validation/);
  assert.ok(researchLessons.some((lesson) => lesson.opening.studySide === "white"));
  assert.ok(researchLessons.some((lesson) => lesson.opening.studySide === "black"));

  for (const lesson of researchLessons) {
    assert.equal(lesson.status, "ХОДЫ ПРОВЕРЕНЫ");
    assert.equal(lesson.baseLine.steps.length, lesson.opening.lineSan.length);
    assert.equal(lesson.opening.continuations.length, 0);
    assert.equal(lesson.opening.badMoves.length, 0);
    assert.ok(lesson.opening.positionTheory.length >= 1, lesson.opening.key);
    assert.ok(lesson.opening.referenceSources.length >= 4, lesson.opening.key);
    assert.ok(lesson.opening.whyItMatters, lesson.opening.key);
    assert.ok(lesson.opening.whitePlan, lesson.opening.key);
    assert.ok(lesson.opening.blackPlan, lesson.opening.key);
    assert.ok(lesson.opening.middlegameTabia, lesson.opening.key);
    assert.ok((lesson.opening.keyIdeas?.length ?? 0) >= 1, lesson.opening.key);
    assert.equal(lesson.opening.sourceEvidence?.legalSan, true, lesson.opening.key);
    assert.ok(lesson.opening.sourceEvidence?.finalFen, lesson.opening.key);
    assert.ok(lesson.opening.sourceEvidence?.lichessMatch, lesson.opening.key);
    assert.equal(lesson.baseLine.steps.at(-1)?.board.length, 64);
    assert.doesNotMatch(lesson.opening.name, /Defense|Variation|Opening|Attack|Gambit|Game|System|Main Line/);
    assert.doesNotMatch(lesson.opening.family, /Defense|Opening|Attack|Game|Accepted|Declined/);
    assert.equal(lesson.opening.turnLabel, "Позиция после основных ходов");
    assert.doesNotMatch(lesson.opening.turnLabel, /линия|таб/i);
  }

  assert.equal(
    researchLessons.find((lesson) => lesson.opening.key === "research-sicilian_najdorf_english_attack")?.opening
      .studySide,
    "black"
  );
  assert.equal(
    researchLessons.find((lesson) => lesson.opening.key === "research-london_system")?.opening.studySide,
    "white"
  );

  const catalanClosed = researchLessons.find((lesson) => lesson.opening.key === "research-catalan_closed");
  assert.ok(catalanClosed);
  assert.match(catalanClosed.opening.whyItMatters ?? "", /учит играть спокойный Каталон/);
  assert.match(catalanClosed.opening.whyItMatters ?? "", /понимать план/);
  assert.doesNotMatch(catalanClosed.opening.whyItMatters ?? "", /Солидная Каталонская структура/);
  assert.ok((catalanClosed.opening.keyIdeas?.length ?? 0) >= 5);
  assert.ok((catalanClosed.opening.avoid?.length ?? 0) >= 4);
  assert.match(catalanClosed.opening.whitePlan ?? "", /пешку d5/);
  assert.match(catalanClosed.opening.whitePlan ?? "", /постепенно усиливать фигуры/);
  assert.match(catalanClosed.opening.blackPlan ?? "", /пешкой c7/);
  assert.match(catalanClosed.opening.blackPlan ?? "", /не отдать белым давление бесплатно/);
  assert.equal(catalanClosed.opening.positionGoal, catalanClosed.opening.whitePlan);
  assert.doesNotMatch(catalanClosed.opening.positionGoal, /План белых|План черных|пешкой c7|не отдать белым/);
  assert.match(catalanClosed.opening.middlegameTabia ?? "", /Дальше придерживайся этого плана/);
  assert.match(catalanClosed.opening.middlegameTabia ?? "", /пешку d5/);
  assert.doesNotMatch(catalanClosed.opening.middlegameTabia ?? "", /пешкой c7|не отдать белым/);
  assert.match(catalanClosed.baseLine.steps.at(-1)?.purpose ?? "", /Связь с твоим планом/);
  assert.match(catalanClosed.baseLine.steps.at(-1)?.purpose ?? "", /пешку d5/);
  assert.doesNotMatch(catalanClosed.baseLine.steps.at(-1)?.purpose ?? "", /пешкой c7|не отдать белым/);
  assert.doesNotMatch(catalanClosed.opening.whitePlan ?? "", /cxd5|Ne5/);
  assert.doesNotMatch(catalanClosed.opening.blackPlan ?? "", /\.\.\.Be7|\.\.\.O-O|\.\.\.c6/);

  const najdorfEnglish = researchLessons.find((lesson) => lesson.opening.key === "research-sicilian_najdorf_english_attack");
  assert.ok(najdorfEnglish);
  assert.equal(najdorfEnglish.opening.positionGoal, najdorfEnglish.opening.blackPlan);
  assert.notEqual(najdorfEnglish.opening.positionGoal, najdorfEnglish.opening.whitePlan);
  assert.ok((najdorfEnglish.opening.middlegameTabia ?? "").includes(najdorfEnglish.opening.blackPlan ?? ""));
  assert.doesNotMatch(najdorfEnglish.opening.middlegameTabia ?? "", /План белых|План черных/);
});

test("Ruy Lopez compatibility lesson remains the same verified position", () => {
  const lesson = buildRuyLopezLesson();

  assert.equal(lesson.opening.name, "Испанская партия");
  assert.equal(lesson.fen, RUY_LOPEZ_EXPECTED_FEN);
});

test("bad move coverage audit reports only verified concrete mistakes", () => {
  const lessons = buildOpeningLessons();
  const report = buildBadMoveCoverageReport(lessons);

  assert.equal(report.lessonCount, lessons.length);
  assert.ok(report.studyPositions > lessons.length);
  assert.equal(report.verifiedBadMoves, 4);
  assert.equal(report.studyPositionVerifiedBadMoves, 4);
  assert.equal(report.positionsWithVerifiedBadMoves, 2);
  assert.equal(report.uncoveredStudyPositions, report.studyPositions - report.positionsWithVerifiedBadMoves);

  const ruyLopez = report.rows.find((row) => row.openingKey === "ruy-lopez-black" && row.anchorPly === 5);
  assert.ok(ruyLopez);
  assert.deepEqual(
    ruyLopez.verifiedBadMoves.map((badMove) => badMove.san),
    ["Qg5", "Qh4"]
  );

  const italian = report.rows.find(
    (row) => row.openingKey === "italian-white" && row.lineKey === "giuoco-piano-center" && row.anchorPly === 6
  );
  assert.ok(italian);
  assert.deepEqual(
    italian.verifiedBadMoves.map((badMove) => badMove.san),
    ["Ng5", "Nxe5"]
  );

  for (const row of report.rows) {
    for (const badMove of row.verifiedBadMoves) {
      assert.equal(badMove.source.status, "verified");
      assert.equal(badMove.anchorFen, row.anchorFen);
      assert.equal(badMove.anchorPly, row.anchorPly);
      assert.doesNotMatch(badMove.label, /ход без плана/i);
    }
  }
});

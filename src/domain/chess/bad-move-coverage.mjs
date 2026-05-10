// @ts-check

import { Chess } from "chess.js";

/**
 * @typedef {import("./opening-database.mjs").OpeningLesson} OpeningLesson
 * @typedef {import("./opening-database.mjs").MoveStep} MoveStep
 * @typedef {import("./opening-database.mjs").BadMove} BadMove
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
 *   nextSan: string;
 *   verifiedBadMoves: readonly BadMove[];
 * }>} BadMoveCoverageRow
 *
 * @typedef {Readonly<{
 *   lessonCount: number;
 *   studyPositions: number;
 *   positionsWithVerifiedBadMoves: number;
 *   uncoveredStudyPositions: number;
 *   verifiedBadMoves: number;
 *   studyPositionVerifiedBadMoves: number;
 *   rows: readonly BadMoveCoverageRow[];
 * }>} BadMoveCoverageReport
 */

/**
 * @param {readonly string[]} sanLine
 * @returns {string}
 */
function getFenBeforeMove(sanLine) {
  const chess = new Chess();

  for (const san of sanLine) {
    chess.move(san, { strict: true });
  }

  return chess.fen();
}

/**
 * @param {OpeningLesson} lesson
 * @returns {ReadonlyMap<string, readonly BadMove[]>}
 */
function groupVerifiedBadMovesByFen(lesson) {
  /** @type {Map<string, BadMove[]>} */
  const grouped = new Map();

  for (const badMove of lesson.opening.badMoves) {
    if (badMove.source.status !== "verified") {
      continue;
    }

    grouped.set(badMove.anchorFen, [...(grouped.get(badMove.anchorFen) ?? []), badMove]);
  }

  return grouped;
}

/**
 * @param {OpeningLesson} lesson
 * @returns {readonly {key: string; label: string; sanLine: readonly string[]; steps: readonly MoveStep[]}[]}
 */
function getLessonStudyLines(lesson) {
  return [
    {
      key: "base",
      label: "Основная линия",
      sanLine: lesson.opening.lineSan,
      steps: lesson.baseLine.steps
    },
    ...lesson.opening.continuations.map((continuation) => ({
      key: continuation.key,
      label: continuation.label,
      sanLine: [...lesson.opening.lineSan, ...continuation.lineSan],
      steps: continuation.steps
    }))
  ];
}

/**
 * @param {readonly OpeningLesson[]} lessons
 * @returns {BadMoveCoverageReport}
 */
export function buildBadMoveCoverageReport(lessons) {
  /** @type {BadMoveCoverageRow[]} */
  const rows = [];
  const seenPositionKeys = new Set();

  for (const lesson of lessons) {
    const badMovesByFen = groupVerifiedBadMovesByFen(lesson);

    for (const line of getLessonStudyLines(lesson)) {
      for (let stepIndex = 0; stepIndex < line.steps.length; stepIndex += 1) {
        const step = line.steps[stepIndex];

        if (!step || step.actor !== lesson.opening.studySide) {
          continue;
        }

        const anchorFen = getFenBeforeMove(line.sanLine.slice(0, stepIndex));
        const positionKey = `${lesson.opening.key}:${lesson.opening.studySide}:${anchorFen}`;

        if (seenPositionKeys.has(positionKey)) {
          continue;
        }

        seenPositionKeys.add(positionKey);
        rows.push({
          openingKey: lesson.opening.key,
          openingName: lesson.opening.name,
          studySide: lesson.opening.studySide,
          sourceName: lesson.opening.sourceName,
          lineKey: line.key,
          lineLabel: line.label,
          anchorPly: stepIndex,
          anchorFen,
          nextSan: step.san,
          verifiedBadMoves: badMovesByFen.get(anchorFen) ?? []
        });
      }
    }
  }

  const positionsWithVerifiedBadMoves = rows.filter((row) => row.verifiedBadMoves.length > 0).length;
  const studyPositionVerifiedBadMoves = rows.reduce((total, row) => total + row.verifiedBadMoves.length, 0);
  const verifiedBadMoves = lessons.reduce((total, lesson) => total + lesson.opening.badMoves.length, 0);

  return Object.freeze({
    lessonCount: lessons.length,
    studyPositions: rows.length,
    positionsWithVerifiedBadMoves,
    uncoveredStudyPositions: rows.length - positionsWithVerifiedBadMoves,
    verifiedBadMoves,
    studyPositionVerifiedBadMoves,
    rows: Object.freeze(rows)
  });
}

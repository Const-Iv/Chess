// @ts-check

import { OPENING_SOURCE_NOTE, buildOpeningLessons } from "../src/domain/chess/opening-database.mjs";

const lessons = buildOpeningLessons();

console.log(
  JSON.stringify(
    {
      status: lessons.every((lesson) => lesson.status === "ПРОВЕРЕНО") ? "ПРОВЕРЕНО" : "ТРЕБУЕТ ПРОВЕРКИ",
      sourceNote: OPENING_SOURCE_NOTE,
      openingCount: lessons.length,
      openings: lessons.map((lesson) => ({
        key: lesson.opening.key,
        name: lesson.opening.name,
        sourceName: lesson.opening.sourceName,
        eco: lesson.opening.eco,
        input: lesson.input,
        fen: lesson.fen,
        studySide: lesson.opening.studySide,
        continuations: lesson.opening.continuations.map((continuation) => ({
          san: continuation.san,
          label: continuation.label,
          steps: continuation.steps.length
        })),
        badMoves: lesson.opening.badMoves.map((badMove) => ({
          san: badMove.san,
          label: badMove.label,
          from: badMove.from,
          to: badMove.to,
          steps: badMove.steps.length
        }))
      }))
    },
    null,
    2
  )
);

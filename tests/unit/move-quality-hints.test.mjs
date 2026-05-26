// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import { getMoveQualityHint } from "../../src/domain/chess/move-quality-hints.mjs";

test("classifies verified cloud-eval bad move as blunder", () => {
  const hint = getMoveQualityHint({
    san: "Qg5",
    badMove: {
      sourceKind: "lichess-cloud-eval",
      label: "Ферзь уходит в рейд без развития",
      betterPlan: "Лучше сначала сыграть a6 или Nf6."
    }
  });

  assert.equal(hint.kind, "blunder");
  assert.equal(hint.symbol, "??");
  assert.match(hint.label, /Грубая ошибка/);
  assert.match(hint.source, /Lichess cloud eval/);
  assert.match(hint.summary, /Ферзь уходит/);
  assert.match(hint.recommendation, /Лучше сначала сыграть a6 или Nf6/);
});

test("classifies known continuation as book move", () => {
  const hint = getMoveQualityHint({
    san: "a6",
    isKnownContinuation: true,
    source: "Источник: проверенная линия"
  });

  assert.equal(hint.kind, "book");
  assert.match(hint.label, /Книжный ход/);
  assert.match(hint.source, /проверенная линия/);
  assert.match(hint.recommendation, /зачем этот ход/);
});

test("classifies broadcast-confirmed planned move with source label", () => {
  const hint = getMoveQualityHint({
    san: "Nf6",
    theoryGames: 12,
    theoryTotalGames: 40,
    educationalSummary: "Nf6 развивает коня, давит на центр и готовит рокировку.",
    educationalRecommendation: "Используй Nf6, когда нужно развить фигуру и сразу поставить вопрос пешке e4.",
    source: "Lichess Broadcast DB 2026: 12 партий"
  });

  assert.equal(hint.kind, "good");
  assert.match(hint.source, /Lichess Broadcast DB/);
  assert.match(hint.summary, /давит на центр/);
  assert.match(hint.recommendation, /развить фигуру/);
  assert.doesNotMatch(`${hint.label} ${hint.summary} ${hint.recommendation}`, /лучший ход/i);
});

test("uses educational database plan before broadcast statistics", () => {
  const hint = getMoveQualityHint({
    san: "d4",
    theoryGames: 28955,
    theoryTotalGames: 96000,
    matchingLineCount: 46,
    educationalSummary: "d4 захватывает центр и открывает линии для фигур.",
    educationalRecommendation:
      "Используй d4, если хочешь перейти к Лондону, ферзевому гамбиту или другой структуре с борьбой за центр.",
    alternativeMoves: [
      {
        san: "Nf3",
        label: "Гибкое развитие",
        idea: "Сначала вывести коня и оставить выбор между d4, c4 и g3."
      },
      {
        san: "c4",
        label: "Английское начало",
        idea: "Сразу давить на d5 и оставить игру более фланговой."
      }
    ],
    source: "Источник: проверенные линии текущей базы и Lichess Broadcast DB 2026."
  });

  assert.equal(hint.kind, "good");
  assert.match(hint.label, /план/i);
  assert.match(hint.summary, /захватывает центр/);
  assert.match(hint.recommendation, /Лондону/);
  assert.match(hint.recommendation, /Nf3/);
  assert.doesNotMatch(hint.summary, /встречается/);
});

test("does not present theory-only statistics as a practical recommendation", () => {
  const hint = getMoveQualityHint({
    san: "b6",
    theoryGames: 631,
    theoryTotalGames: 2868,
    source: "Lichess Broadcast DB 2026: 631 партий"
  });

  assert.equal(hint.kind, "needs-plan");
  assert.match(hint.label, /нет плана|нужна/i);
  assert.match(hint.summary, /нет учебного объяснения/);
  assert.match(hint.recommendation, /не считай/i);
  assert.doesNotMatch(`${hint.label} ${hint.summary} ${hint.recommendation}`, /практичный ход|хороший ход|лучший ход/i);
});

test("classifies legal but unsupported move as inaccuracy without chess claim", () => {
  const hint = getMoveQualityHint({
    san: "h3"
  });

  assert.equal(hint.kind, "inaccuracy");
  assert.match(hint.summary, /нет подтверждения/);
  assert.match(hint.recommendation, /вернись к подтвержденным/);
  assert.doesNotMatch(`${hint.label} ${hint.summary} ${hint.recommendation} ${hint.source}`, /лучший ход|единственный ход/i);
});

test("every move quality hint includes readable recommendation", () => {
  const contexts = [
    { san: "a6", isKnownContinuation: true },
    { san: "c3", isExpectedStep: true },
    { san: "Nf6", theoryGames: 1, theoryTotalGames: 40 },
    { san: "d4", matchingLineCount: 2 },
    { san: "h3", hasKnownAlternative: true },
    { san: "h4" }
  ];

  for (const context of contexts) {
    const hint = getMoveQualityHint(context);
    assert.ok(hint.recommendation.length >= 20, hint.kind);
    assert.doesNotMatch(hint.recommendation, /TODO|TBD|лучший ход|единственный ход/i);
  }
});

// @ts-check

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const trainerSource = readFileSync(new URL("../../app/opening-trainer.tsx", import.meta.url), "utf8");
const stylesheetSource = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

test("engine rail is rendered for the initial catalog board, before free mode tap", () => {
  const boardStageIndex = trainerSource.indexOf('"board-stage"');
  const engineRailIndex = trainerSource.indexOf('className={`engine-eval-bar engine-advantage-${engineEvaluation.advantage}`}');
  const boardIndex = trainerSource.indexOf('"board",', boardStageIndex);
  const railPrefixInsideStage = trainerSource.slice(boardStageIndex, engineRailIndex);

  assert.notEqual(boardStageIndex, -1);
  assert.notEqual(engineRailIndex, -1);
  assert.notEqual(boardIndex, -1);
  assert.ok(engineRailIndex > boardStageIndex);
  assert.ok(engineRailIndex < boardIndex);
  assert.doesNotMatch(railPrefixInsideStage, /trainerMode === "free"\s*\?/);
});

test("engine evaluation follows the currently displayed board in catalog and free modes", () => {
  assert.match(trainerSource, /const boardFen = boardChess\.fen\(\);/);
  assert.doesNotMatch(trainerSource, /if \(trainerMode !== "free"\) {\s*return;\s*}/);
  assert.match(trainerSource, /markEngineEvaluationRefreshing\(previous, boardFen\)/);
  assert.match(trainerSource, /\.evaluateFen\(boardFen\)/);
  assert.match(trainerSource, /\}, \[boardFen\]\);/);
});

test("board stage reserves rail width before any interaction", () => {
  const boardStageCss = stylesheetSource.match(/\.board-stage\s*{[^}]+}/)?.[0] ?? "";
  assert.match(boardStageCss, /grid-template-columns:\s*34px minmax\(0,\s*1fr\);/);
});

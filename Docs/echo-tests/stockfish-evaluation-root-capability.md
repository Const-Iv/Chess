# Echo-test: локальная Stockfish-оценка позиции

Дата: 2026-05-26.

## Связь с charter проекта

Проект должен помогать шахматисту-любителю понимать дебюты и переход к миттельшпилю. Компьютерная оценка добавляет быстрый сигнал качества позиции, но не заменяет проверенные названия вариантов, учебные принципы, цели позиции и планы.

## Hypothesis

Минимальная связка `chess.js FEN` + `Stockfish.js 18 lite single-threaded Web Worker` может локально оценить позицию в свободной тренировке и вернуть понятный UI-result: score, side advantage, evaluation bar percent and candidate move.

## Setup

- Engine: Stockfish.js 18 lite single-threaded.
- Source: `nmrugg/stockfish.js` release asset.
- License: GPLv3, copied to `public/vendor/stockfish/Copying.txt`.
- Runtime: browser Web Worker loaded from `/vendor/stockfish/stockfish-18-lite-single.js`.
- Search budget: short local calculation, default `go movetime 650`.

## Scenario

Input:

```text
FEN after free-training move.
```

Expected observable result:

- worker enters UCI mode;
- app sends `position fen ...`;
- app sends short `go movetime ...`;
- output parser handles `score cp`, `score mate`, `depth`, `pv` and `bestmove`;
- UI shows evaluation bar and source limitation;
- app does not call engine move confirmed opening theory.

## Actual result

PASS.

Observed:

- parser tests pass for centipawn, mate and bestmove output;
- local app opened at `http://127.0.0.1:3026`;
- free training mode displayed Stockfish evaluation for the starting position;
- after `1. e4`, move line changed to `1. e4`;
- black-to-move raw Stockfish score was normalized into white/black perspective: UI showed `+0.37` and `Белым лучше...`;
- Stockfish card displayed score, side advantage, candidate move and source note;
- evaluation bar aria label updated with the current score and summary;
- evaluation bar bounding box matched the board top and height in free mode;
- while a new move was being calculated, the bar kept the previous percent until the next Stockfish result arrived;
- browser console error log was empty.

Smoke screenshot: `runtime/stockfish-evaluation-smoke.png` (ignored runtime artifact).

## Limitations

- Lite single-threaded Stockfish is intentionally smaller and weaker than full Stockfish.
- Short calculation is a practical training signal, not absolute chess truth.
- No live online game integration is approved.
- No server-side analysis, accounts, analytics or personal game storage is introduced.

## Decision

Proceed for free-training evaluation only.

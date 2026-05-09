# Echo-test: корневая шахматная связка

Дата: 2026-05-09.

## Связь с charter проекта

Проект должен помогать шахматисту-любителю понимать дебюты, а не только зубрить ходы. Поэтому первый technical proof проверяет одновременно легальность ходов, название варианта, типовые продолжения и объяснение принципа/цели позиции.

## Hypothesis

Минимальная связка `chess.js` + manually verified opening-map может принять линию `1. e4 e5 2. Nf3 Nc6 3. Bb5`, проверить легальность позиции и вернуть понятный учебный результат для Ruy Lopez / Spanish Opening.

## Setup

- Package: `chess.js@1.4.0`.
- Official docs checked:
  - `chess.js` latest documentation describes ESM import via `import { Chess } from 'chess.js'`.
  - `.move()` supports Standard Algebraic Notation and strict parsing.
  - `.moves({ verbose: true })` / `.moves()` return legal continuations.
- Opening-map source: manually written seed, checked against Chess.com Ruy Lopez opening reference and legal move generation; not imported from a large external database.
- Public opening reference: `https://www.chess.com/openings/Ruy-Lopez-Opening`.

## Scenario

Input:

```text
1. e4 e5 2. Nf3 Nc6 3. Bb5
```

Command:

```bash
npm run echo:chess-opening
```

Expected observable result:

- legal SAN line is applied exactly;
- FEN equals `r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3`;
- opening is identified as `Ruy Lopez` with aliases `Spanish Opening` and `Spanish Game`;
- output includes 1-3 legal continuations;
- output includes principle, position goal and middlegame plan;
- no unverified "best move" claim is emitted.

## Actual result

PASS.

Observed:

- applied SAN: `e4`, `e5`, `Nf3`, `Nc6`, `Bb5`;
- FEN: `r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3`;
- opening: `Ruy Lopez`;
- aliases: `Spanish Opening`, `Spanish Game`;
- legal continuations: `a6`, `Nf6`, `d6`;
- output includes principle, position goal and middlegame plan.

## Limitations

- This proves only one manually verified Ruy Lopez seed.
- It does not approve a full opening database, import adapter, UI, progress tracking, accounts, analytics or deploy path.
- Future opening expansion needs source/manual verification and deterministic checks for every added line or data source.

## Decision

Proceed.

Next safe step: build the first local UI or domain module on top of this verified seam, while keeping opening data small and manually verified.

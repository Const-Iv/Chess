# Компьютерная оценка позиции: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить локальную Stockfish-оценку позиции в свободную тренировку.

**Architecture:** `chess.js` дает FEN, browser worker запускает Stockfish.js, доменный модуль парсит UCI output и UI показывает оценку отдельно от учебной дебютной базы.

**Tech Stack:** Next.js, React, `chess.js`, Stockfish.js WebAssembly, Node test runner.

---

### Task 1: Domain Evaluation Contract

**Files:**
- Create: `tests/unit/engine-evaluation.test.mjs`
- Create: `src/domain/chess/engine-evaluation.mjs`

- [ ] **Step 1: Write failing tests**

Проверить parsing `info depth ... score cp`, `score mate`, `bestmove`, conversion UCI to SAN and bar percentage.

- [ ] **Step 2: Run red test**

Run: `node --test tests/unit/engine-evaluation.test.mjs`

Expected: FAIL because `src/domain/chess/engine-evaluation.mjs` does not exist yet.

- [ ] **Step 3: Implement domain module**

Добавить pure functions for parsing and view-model normalization.

- [ ] **Step 4: Run green test**

Run: `node --test tests/unit/engine-evaluation.test.mjs`

Expected: PASS.

### Task 2: Stockfish Asset Boundary

**Files:**
- Create: `public/vendor/stockfish/stockfish-18-lite-single.js`
- Create: `public/vendor/stockfish/stockfish-18-lite-single.wasm`
- Create: `public/vendor/stockfish/Copying.txt`
- Modify: `README.md`

- [ ] **Step 1: Add official Stockfish.js lite single-threaded asset**

Use the official `nmrugg/stockfish.js` release asset pair. Keep GPLv3 license next to the asset.

- [ ] **Step 2: Document source and license**

README must state the engine source, local browser-only use, and GPLv3 boundary.

### Task 3: Browser Worker Adapter

**Files:**
- Create: `app/stockfish-evaluator.ts`

- [ ] **Step 1: Implement evaluator class**

The adapter loads `/vendor/stockfish/stockfish-18-lite-single.js`, waits for `uciok` and `readyok`, sends `position fen ...` and `go movetime 650`, then returns the latest parsed score plus `bestmove`.

- [ ] **Step 2: Handle cancellation and unavailable worker**

Every new analysis can supersede the previous one. UI must show a safe unavailable state if worker loading fails.

### Task 4: Free Training UI

**Files:**
- Modify: `app/opening-trainer.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Wire evaluator into free mode**

After each FEN change in free mode, run Stockfish evaluation and store a view model.

- [ ] **Step 2: Add evaluation bar**

Place a vertical black/white bar next to the board in free mode. White advantage fills from bottom; black remains at top.

- [ ] **Step 3: Add compact engine card**

Show status, score, depth, candidate move and source note without calling it confirmed theory.

### Task 5: Verification

**Files:**
- Update: `Docs/echo-tests/stockfish-evaluation-root-capability.md`

- [ ] **Step 1: Run unit tests**

Run: `node --test tests/unit/engine-evaluation.test.mjs`

- [ ] **Step 2: Run full QA**

Run: `npm run qa:agent`

- [ ] **Step 3: Run browser smoke**

Run the app, open free mode, make a legal move, verify the bar and engine card are visible and no console/runtime error appears.

# План реализации подсказок качества хода

> **Для agentic workers:** обязательный sub-skill: использовать `superpowers:subagent-driven-development` (рекомендуется) или `superpowers:executing-plans`, чтобы выполнять план по задачам. Шаги используют checkbox (`- [ ]`) для отслеживания.

**Цель:** Добавить учебные значки качества хода в свободную тренировку и пошаговый просмотр дебютов.

**Архитектура:** Чистая классификация живет в `src/domain/chess/move-quality-hints.mjs`, UI только передает уже имеющиеся evidence-флаги и рендерит общий `MoveQualityBadge` плюс видимый блок `MoveQualityDetails`. Логика не добавляет движок и не меняет шахматную базу.

**Стек:** Next.js, React, `chess.js`, Node test runner, CSS через `app/globals.css`.

---

### Задача 1: чистый классификатор качества хода

**Файлы:**
- Создать: `src/domain/chess/move-quality-hints.mjs`
- Тест: `tests/unit/move-quality-hints.test.mjs`

- [ ] **Шаг 1: написать падающие тесты**

```js
// tests/unit/move-quality-hints.test.mjs
// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import { getMoveQualityHint } from "../../src/domain/chess/move-quality-hints.mjs";

test("classifies verified cloud-eval bad move as blunder", () => {
  const hint = getMoveQualityHint({
    san: "Qg5",
    badMove: { sourceKind: "lichess-cloud-eval", label: "Ферзь уходит в рейд без развития" }
  });

  assert.equal(hint.kind, "blunder");
  assert.equal(hint.symbol, "??");
  assert.match(hint.label, /Грубая ошибка/);
  assert.match(hint.source, /Lichess cloud eval/);
  assert.match(hint.recommendation, /Лучше/);
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

test("classifies broadcast-confirmed move with source label", () => {
  const hint = getMoveQualityHint({
    san: "Nf6",
    theoryGames: 12,
    theoryTotalGames: 40,
    source: "Lichess Broadcast DB 2026: 12 партий"
  });

  assert.equal(hint.kind, "good");
  assert.match(hint.source, /Lichess Broadcast DB/);
  assert.match(hint.recommendation, /Сравни/);
  assert.doesNotMatch(`${hint.label} ${hint.summary} ${hint.recommendation}`, /лучший ход/i);
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
```

- [ ] **Шаг 2: запустить тесты и подтвердить падение**

Команда: `node --test tests/unit/move-quality-hints.test.mjs`
Ожидаемо: FAIL, потому что `src/domain/chess/move-quality-hints.mjs` еще не существует.

- [ ] **Шаг 3: реализовать классификатор**

```js
// src/domain/chess/move-quality-hints.mjs
// @ts-check

const DEFAULT_SOURCE = "Источник: текущая проверенная база дебютов.";

export function getMoveQualityHint(context) {
  if (context.badMove) {
    const isCloudEval = context.badMove.sourceKind === "lichess-cloud-eval";
    return {
      kind: isCloudEval ? "blunder" : "mistake",
      symbol: isCloudEval ? "??" : "?",
      label: isCloudEval ? "Грубая ошибка" : "Ошибка",
      summary: `${context.san}: ${context.badMove.label}. Лучше выбрать ход с понятным дебютным планом.`,
      source: isCloudEval ? "Источник: Lichess cloud eval и verified bad move." : DEFAULT_SOURCE,
      tone: "bad"
    };
  }

  if (context.isKnownContinuation) {
    return {
      kind: "book",
      symbol: "📖",
      label: "Книжный ход",
      summary: `${context.san}: ход из проверенной дебютной линии или продолжения.`,
      source: context.source ?? DEFAULT_SOURCE,
      tone: "book"
    };
  }

  if (context.isExpectedStep) {
    return {
      kind: "excellent",
      symbol: "!",
      label: "Сильный учебный ход",
      summary: `${context.san}: ход поддерживает текущий план позиции.`,
      source: context.source ?? DEFAULT_SOURCE,
      tone: "good"
    };
  }

  const total = context.theoryTotalGames ?? 0;
  const games = context.theoryGames ?? 0;
  if (games > 0 && total > 0) {
    const share = games / total;
    return {
      kind: share >= 0.2 ? "good" : "interesting",
      symbol: share >= 0.2 ? "✓" : "!?",
      label: share >= 0.2 ? "Практичный ход" : "Интересный ход",
      summary: `${context.san}: ход встречается в реальных партиях из этой позиции.`,
      source: context.source ?? "Источник: реальные broadcast-партии Lichess.",
      tone: "good"
    };
  }

  if ((context.matchingLineCount ?? 0) > 0) {
    return {
      kind: "good",
      symbol: "✓",
      label: "Есть в базе",
      summary: `${context.san}: ход продолжает ${context.matchingLineCount} проверенных линий.`,
      source: context.source ?? DEFAULT_SOURCE,
      tone: "good"
    };
  }

  if (context.hasKnownAlternative) {
    return {
      kind: "miss",
      symbol: "×",
      label: "Мимо учебного ориентира",
      summary: `${context.san}: ход легален, но рядом есть подтвержденные учебные продолжения.`,
      source: context.source ?? "Источник: проверенные линии текущей базы.",
      tone: "warn"
    };
  }

  return {
    kind: "inaccuracy",
    symbol: "?!",
    label: "Вне текущей карты",
    summary: `${context.san}: в базе и собранной практике нет подтверждения этого продолжения.`,
    source: "Не показываю шахматный вывод как факт без источника.",
    tone: "warn"
  };
}
```

- [ ] **Шаг 4: запустить тесты и подтвердить проход**

Команда: `node --test tests/unit/move-quality-hints.test.mjs`
Ожидаемо: PASS.

### Задача 2: подключить подсказки к UI тренажера

**Файлы:**
- Изменить: `app/opening-trainer.tsx`
- Изменить: `app/globals.css`

- [ ] **Шаг 1: импортировать классификатор и добавить UI-типы**

Добавить импорт:

```ts
import { getMoveQualityHint } from "../src/domain/chess/move-quality-hints.mjs";
```

Добавить тип `MoveQualityHint` рядом с существующими UI-типами.

- [ ] **Шаг 2: добавить локальные helpers**

Добавить helpers, которые находят matching bad moves, theory counts и line alternatives из существующих lesson-данных. Держать их чистыми и локальными для `app/opening-trainer.tsx`.

- [ ] **Шаг 3: отрендерить общий бейдж**

Добавить компоненты `MoveQualityBadge` и `MoveQualityDetails`. Бейдж вывести в:

- free `board-step-card`;
- catalog `board-step-card`;
- continuation cards;
- bad move cards;
- free line history buttons.

`MoveQualityDetails` вывести в основной карточке свободной тренировки и основной карточке пошагового просмотра. В нем должны быть видимые строки `Почему`, `Как лучше`, `Проверка`.

- [ ] **Шаг 4: добавить CSS**

Оформить `.move-quality-badge` и tone-классы компактно, со стабильными размерами и без текста, который сдвигает layout.

### Задача 3: проверка

**Файлы:**
- Проверить: `tests/unit/move-quality-hints.test.mjs`
- Проверить: `app/opening-trainer.tsx`
- Проверить: `app/globals.css`

- [ ] **Шаг 1: запустить точечные тесты**

Команда: `node --test tests/unit/move-quality-hints.test.mjs tests/unit/opening-database.test.mjs`
Ожидаемо: PASS.

- [ ] **Шаг 2: запустить typecheck**

Команда: `npm run typecheck`
Ожидаемо: PASS.

- [ ] **Шаг 3: запустить полный unit/integration набор**

Команда: `npm test`
Ожидаемо: PASS.

- [ ] **Шаг 4: выполнить browser smoke**

Запустить локальное приложение через `npm run dev` и проверить страницу в браузере. Ожидаемо: доска рендерится, в свободной тренировке можно сделать ход, quality badge появляется, catalog step card показывает quality badge.

- [ ] **Шаг 5: запустить agent QA**

Команда: `npm run qa:agent`
Ожидаемо: PASS.

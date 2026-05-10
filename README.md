# Тренажер шахматных дебютов

Личное мини-приложение для изучения основных шахматных дебютов: подсказки на каждый ход, варианты развития, названия вариантов, дебютные правила, принципы, цели позиции и планы перехода к миттельшпилю.

## Что зафиксировано

- Project Intake согласован owner'ом 2026-05-09.
- Product Charter согласован owner'ом 2026-05-09.
- Первый runtime direction: локальное Next.js / React web-приложение.
- Основной work path: managed task conveyor.
- Root echo-test passed: legal move parsing + manually verified Ruy Lopez opening-map.
- Deep-research app-ready v1 импортирован как checked study catalog: 98 SAN-легальных линий, 52 priority A, 37 priority B, 9 priority C.

## Канонические источники

- `.memory-bank/product-charter.md` — миссия, видение, цель, целевая аудитория, `JTBD`, ограничения, сценарии и критерии успеха.
- `.memory-bank/project-context.md` — текущее состояние проекта, утвержденные и отложенные решения.
- `.memory-bank/architecture-map.md` — архитектура, planned layout and risk hotspots.
- `.memory-bank/code-rules.md` — правила работы Codex и процесса.
- `.memory-bank/qa-playbook.md` — правила проверок.
- `plans/2026-05-09-1245-project-intake.md` — approved intake.
- `CODEX_MEMORY.md` — короткая operational memory.

## Продуктовая суть

Миссия: помогать шахматисту-любителю быстрее понимать и запоминать основные дебюты через интерактивные подсказки по ходам, названиям вариантов и типовым планам перехода к миттельшпилю.

Цель: сделать личное мини-приложение, которое помогает играть минимум в 80% типовых случаев от выбранного дебюта до миттельшпиля.

Основной сценарий: пользователь выбирает дебют, делает ход за одну из сторон, видит подсказку "почему этот ход", возможные ответы соперника, название варианта, дебютные принципы, цели позиции и план до миттельшпиля.

## Что пока не утверждено

- Полный список дебютов первого релиза.
- Глубина линий и точный критерий "80% случаев".
- Источник шахматных данных и licensing model.
- Формат opening-map.
- Конкретные версии Next.js / React и chess tooling.
- Дизайн, публичный deploy, аккаунты, синхронизация, аналитика and commercial model.

## Echo-test evidence

Выполнен узкий spike:

- `chess.js@1.4.0` легально применяет `1. e4 e5 2. Nf3 Nc6 3. Bb5`;
- manually verified opening-map распознает Spanish / Ruy Lopez;
- результат показывает 1-3 типовых продолжения;
- подсказка объясняет принцип, цель позиции и план;
- неподтвержденные названия и "лучшие ходы" не выдаются как факт.

Evidence path: `Docs/echo-tests/chess-opening-root-capability.md`.

## Дебютная база

Тренажер сейчас показывает:

- curated core-карточки с типовыми продолжениями и плохими ходами;
- imported research-каталог на 98 линий с PGN, планами белых и черных, табиями, ключевыми идеями и подсказками на каждый полуход;
- source-check labels: `Lichess exact`, `Lichess prefix`, `SAN legal`.

Исходники импорта лежат в `research/chess-openings-app-ready-v1/`.
Проверка импорта описана в `Docs/deep-research-opening-import-2026-05-09.md`.
Imported lines нельзя показывать как engine-best без отдельного Lichess Explorer / Stockfish sanity layer.

## Быстрый старт

Установить зависимости:

```bash
npm ci
```

Проверить baseline:

```bash
npm run qa:agent
```

Создать новую task-ветку:

```bash
npm run task:start -- --title "<title>" --seed-message "<request>"
```

Подключить repo-managed skills:

```bash
npm run skills:link
```

Если в `$CODEX_HOME/skills` уже есть конфликтующие ссылки, `--adopt` использовать только после явного owner approval:

```bash
npm run skills:link -- --adopt
```

## Важные правила

- Product charter читается перед любым продуктовым, feature, behavior, process или governance решением.
- Нельзя превращать приложение в справочник ходов без объяснения принципов, целей позиции и планов.
- Нельзя выдавать AI-generated или неподтвержденные названия вариантов как факт.
- Личный прогресс и заметки, если появятся, нельзя терять при обновлениях.
- UI changes требуют browser smoke, если интерфейс можно запустить.
- External libraries, integrations and package setup require official documentation check before installation/configuration/update/debugging.

## Канонические команды

- `npm run lint`
- `npm run lint:fix`
- `npm run lint:fix:changed`
- `npm run echo:chess-opening`
- `npm run dev`
- `npm run skills:link`
- `npm run skills:status`
- `npm run skills:unlink`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run qa:agent`
- `npm run qa:smoke:pr`
- `npm run qa:e2e:nightly`
- `npm run qa:security`
- `npm run qa:coverage:critical`
- `npm run qa:perf:critical`
- `npm run task:start -- --title "<title>" --seed-message "<request>"`
- `npm run task:test -- [args]`
- `npm run task:qa:agent`
- `npm run task:finish:core`
- `npm run task:merge:main`
- `npm run release:local`

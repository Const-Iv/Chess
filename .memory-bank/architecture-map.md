# Architecture Map: Тренажер шахматных дебютов

## Текущий статус

Проект находится на этапе bootstrap личного MVP.

Утверждено:
- локальное web-приложение на Next.js / React;
- `npm` как package manager;
- managed task conveyor как основной integration path;
- local-first MVP без аккаунтов, платежей, аналитики, API и фоновых jobs;
- root echo-test passed for legal move parsing + manually verified Ruy Lopez opening-map.

## Product Runtime

Первый runtime: Next.js / React on Node.js.

Точные версии Next.js / React и шахматных библиотек выбираются в implementation-задаче после проверки официальной документации.

## Current Information Flow

1. Project Intake фиксирует approved product/governance choices.
2. Product Charter фиксирует миссию, видение, цель, аудиторию, `JTBD`, ограничения и критерии успеха.
3. Echo-test проверил минимальную корневую связку: legal move parsing + manually verified opening-map.
4. UI and product logic can now be built on top of the verified seam without expanding unverified opening data.

## Planned Layout

- Future Next.js UI: `app/` or `src/app/`, exact scaffold decided after official docs check.
- Chess domain logic: `src/domain/chess/`.
- Opening data and manually verified maps: `src/data/openings/`.
- Tests: `tests/` plus browser smoke after UI exists.
- Governance-root files stay at repo root: `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`, `README.md`, `plans/*`.

## Risk Hotspots

- Превратить приложение в список ходов без объяснения дебютных принципов и целей.
- Выдать неподтвержденное название варианта или "лучший ход" как факт.
- Подключить большую внешнюю базу без licensing/source check.
- Расширить UI/product feature work за пределы echo-tested legal move parsing + manually verified opening-map.
- Потерять личный прогресс или заметки, если эта capability появится позже.
- Добавить аккаунты, sync, аналитику, API или deploy path без отдельного capability approval.

## Change Impact Checklist

Когда меняется product charter:
- обновить `.memory-bank/product-charter.md`;
- проверить синхронизацию с `AGENTS.md`, `CODEX_MEMORY.md`, `README.md` и relevant `.memory-bank/*`.

Когда выбирается источник дебютной базы:
- проверить licensing/source boundary;
- зафиксировать adapter/profile boundary;
- добавить deterministic check, что known line maps to expected opening name and continuations.

Когда появляется UI:
- обновить QA playbook with browser smoke;
- проверить реальный интерфейс browser-инструментом;
- убедиться, что text does not overflow and board/help panels remain usable on desktop and mobile.

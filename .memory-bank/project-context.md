# Project Context: Тренажер шахматных дебютов

## Текущее состояние

- Project Intake согласован owner'ом 2026-05-09.
- Product Charter согласован owner'ом 2026-05-09.
- Проект проверяет личную гипотезу: поможет ли компактный интерактивный тренажер лучше понимать и помнить основные шахматные дебюты.
- Canonical transfer выполнен, baseline QA прошел, корневой chess echo-test прошел.
- GitHub repository `Const-Iv/Chess` подключен к Vercel project `chess-prilozhenie`; production branch `main`, production URL `https://chess-prilozhenie.vercel.app`.
- Deep-research app-ready v1 импортирован как checked study catalog: 98 SAN-легальных линий с планами, табиями и подсказками; источник и степень проверки фиксируются явно.

## Канонические источники

- Product charter: `.memory-bank/product-charter.md`.
- Project context: `.memory-bank/project-context.md`.
- Architecture status: `.memory-bank/architecture-map.md`.
- Code and collaboration rules: `.memory-bank/code-rules.md`.
- QA playbook: `.memory-bank/qa-playbook.md`.
- Intake: `plans/2026-05-09-1245-project-intake.md`.

## Product Charter Summary

- Миссия: помогать шахматисту-любителю быстрее понимать и запоминать основные дебюты через интерактивные подсказки по ходам, названиям вариантов и типовым планам перехода к миттельшпилю.
- Видение: шахматист-любитель узнает основные дебютные структуры без зубрежки длинных линий, а проект становится личным навигатором по дебютам от первого хода до понятного миттельшпиля.
- Цель: сделать личное мини-приложение для изучения основных шахматных дебютов с подсказками на каждый ход, вариантами развития, названиями вариантов и ориентирами для 80% типовых случаев до миттельшпиля.
- JTBD: когда пользователь играет или изучает дебют и сталкивается с типовой веткой, он хочет быстро понять следующий ход, название варианта и план дальнейшей игры.

## Утвержденные решения

- Нужен личный локальный web MVP.
- Runtime: Next.js / React on Node.js.
- Package manager: `npm`.
- Build command: `npm run build`.
- Основной integration path: managed task conveyor.
- Lightweight deploy path: GitHub `main` -> Vercel production for personal web access; branch pushes may create Vercel previews.
- Перед push/merge в `main` обязателен PASS `npm run qa:agent`; для UI/user-visible изменений нужен browser smoke, если интерфейс можно запустить; для внешней публикации нужен `npm run qa:security`.
- Первый релиз ориентирован на owner как шахматиста-любителя.
- Нужны подсказки для каждого хода, варианты развития, названия вариантов, дебютные правила, принципы и цели.
- Нужна учебная цель: понимать и помнить минимум 80% типовых случаев от выбранного дебюта до миттельшпиля.
- In-app AI не утвержден; Codex может помогать с планированием и content QA, но не должен выдавать неподтвержденные шахматные факты.
- Источник первого расширенного каталога: copied `research/chess-openings-app-ready-v1/` + локальная проверка `lichess_prefix_validation_2026-05-09.json`.
- Imported catalog scope: 98 учебных линий, 52 priority A, 37 priority B, 9 priority C; все SAN-линии проходят `chess.js` strict mode.

## Отложенные решения

- Финальный список дебютов первого релиза за пределами imported study catalog.
- Точный критерий "80% случаев" по статистике реальных партий.
- Lichess Explorer статистика по рейтингу и master database.
- Stockfish sanity layer для превращения учебных линий в рекомендации.
- Positions/FEN tree для longest prefix match и транспозиций.
- Конкретные версии Next.js / React и chess tooling.
- Дизайн, публичные аккаунты, синхронизация прогресса, аналитика и коммерческая модель.
- Защита доступа к Vercel production/preview, если появятся личные заметки, прогресс, приватные партии или другие user data.

## Echo-test evidence

Completed 2026-05-09:
- `chess.js@1.4.0` verifies legal application of `1. e4 e5 2. Nf3 Nc6 3. Bb5`.
- Manually verified opening-map recognizes Ruy Lopez / Spanish Opening / Spanish Game.
- Result shows `a6`, `Nf6`, `d6` as legal continuations with short ideas.
- Unverified opening names and "best move" claims are not emitted as fact.

Evidence path: `Docs/echo-tests/chess-opening-root-capability.md`.

## Operational Baseline

- Работа ведется в managed worktree и ветке `codex/*`.
- `main` защищен от прямых изменений без явного разрешения owner'а.
- `main` является Vercel production branch; попадание изменений в GitHub `main` может обновить production URL.
- Ручной `vercel --prod`, Vercel promote или API production deploy не использовать как обычный release path; только по явному owner request с причиной и SHA.
- После finish/merge фиксировать deploy evidence: `publishStatus`, source branch/SHA, deployment URL/status если доступен и smoke result; push в `main` сам по себе подтверждает trigger, но не доказывает completed Vercel deployment.
- Перед push проверять, что diff не содержит secrets, credentials, личные заметки, прогресс, приватные партии или неподтвержденные шахматные факты.
- `.vercel/`, `.env`, runtime artifacts and local state должны оставаться ignored.
- Для code-changing work обязателен `npm run qa:agent`.
- После появления UI нужен browser smoke: выбор дебюта, ввод линии, показ подсказки, названия варианта, принципа, цели позиции и следующих ходов.
- Для imported research-карточек source label обязан различать `Lichess exact`, `Lichess prefix` и `SAN legal`; нельзя писать, что prefix-only продолжение является engine-best.
- Repo-managed skills подключаются через `npm run skills:link`; `--adopt` требует отдельного owner approval.

## Shared Starter Baseline Rules — synced 2026-07-17

- `starter.skills.source-link-flow`: Reusable shared skills хранятся в repo `skills/` и подключаются в `$CODEX_HOME/skills` только через безопасный link flow. Downstream-проекты могут подключать starter как versioned source и линковать skills через `skills-manage.mjs --source <skills-root>`. `.system`, plugin-managed, product-specific skills и generated skill trees (`.agents/skills`, `.claude/skills`, `.cursor/skills`) не импортируются в starter core через bulk-copy.
- `starter.product-charter.project-identity-unique`: Product charter каждого проекта уникален: mission, vision, goal, target audience, `JTBD`, product constraints and success criteria нельзя импортировать, шарить или подменять из другого проекта. `starter-rule-import` и `starter-rule-share` могут переносить только отдельные approved reusable governance blocks; если такой блок должен жить в product charter, он добавляется как отдельный project-local block/guard и формулируется для конкретного проекта без замены charter identity.

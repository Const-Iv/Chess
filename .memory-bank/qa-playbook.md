# QA Playbook

## Current Project QA Context

- Проект находится на этапе bootstrap личного MVP.
- Baseline deterministic gate: `npm run qa:agent`.
- Product-specific runtime QA появляется после echo-test and UI implementation.
- Root echo-test for legal move parsing + manually verified Ruy Lopez opening-map passed on 2026-05-09.
- GitHub `main` подключен к Vercel production; push в другие ветки может создать Vercel preview deployment.
- Imported deep-research catalog QA requires 98/98 legal SAN lines and visible source status for exact/prefix validation.

## Agent QA Gate (Mandatory)

Primary deterministic gate:

1. `npm run qa:agent`

Gate order is fixed by starter baseline:
- `lint`
- `lint:fix:changed`
- `lint`
- `typecheck`
- `test`
- `build`

Dependency preflight обязателен перед запуском gate:
- если требуемые runtime files в `node_modules/*` отсутствуют, запускать `npm ci`;
- продолжать QA сразу после успешного recovery;
- fail only when recovery did not restore required files.

## GitHub / Vercel Deployment QA

Перед merge/push в `main`, который может обновить Vercel production URL, нужно:
- PASS `npm run qa:agent`;
- PASS `npm run qa:security`;
- для UI/user-visible changes - browser smoke, если интерфейс можно запустить;
- для chess content changes - source/manual verification note and deterministic content QA;
- проверить diff на отсутствие secrets, credentials, личных заметок, прогресса, приватных партий and unverified chess facts.

Preview deployment из `codex/*` ветки допустим для owner review, но не считается substitute for deterministic QA or task finish/merge gates.

Ручной `vercel --prod`, Vercel promote или API production deploy требует явный owner request, exact SHA, причину bypass and post-deploy verification.

## Echo-test Gate

До feature/refactor/behavior-change work по шахматной логике нужно подтвердить:
- выбранный chess tooling легально применяет `1. e4 e5 2. Nf3 Nc6 3. Bb5`;
- manually verified opening-map распознает Spanish / Ruy Lopez;
- результат показывает 1-3 типовых продолжения;
- подсказка объясняет принцип, цель позиции и план;
- неподтвержденные названия и "лучшие ходы" не выдаются как факт.

Evidence фиксирует:
- hypothesis;
- setup;
- command/scenario;
- actual result;
- limitations;
- decision: `proceed`, `blocked`, `narrow spike`, or `choose alternative`.

## UI Browser Oracle

После появления интерфейса перед завершением UI-задачи нужен browser smoke:
- пользователь выбирает дебют;
- вводит или проходит линию;
- видит подсказку "почему этот ход";
- видит название варианта;
- видит дебютный принцип, цель позиции, план до миттельшпиля и следующие допустимые ходы;
- приложение не показывает неподтвержденные факты как confirmed.

Проверка реального интерфейса обязательна доступным browser-инструментом, если UI можно запустить.

## Chess Content QA

Для opening-map и подсказок проверять:
- legal move sequence;
- expected opening name;
- source or manual verification note;
- source status for imported lines: `pgn-exact`, `lichess-prefix`, or blocked from confirmed display;
- typical continuations;
- principle / goal / middlegame plan;
- behavior for unknown, off-book or ambiguous lines.

Нельзя считать контент готовым, если:
- название варианта пришло только из AI draft без проверки;
- редкая линия смешана с основной без приоритета;
- ход показан без объяснения идеи;
- одна позиция может возникнуть разным порядком ходов, а data model это не учитывает.
- imported `lichess-prefix` line shown as exact Lichess name or engine-best recommendation.

## Eval Gate For Agent Behavior

Eval обязателен для изменений, которые влияют на:
- Codex-assisted chess content QA;
- Product Charter gate;
- Project Intake Gate;
- recommendations or Plan mode choices.

Минимальный `Eval spec`:
- agent surface;
- good answer rubric;
- failure rubric;
- critical edge cases;
- regression examples / golden prompts;
- old vs new comparison method;
- minimum pass threshold.

Approved golden prompts:
- "Покажи, что делать в Испанской после 3...a6".
- "Как называется 1. e4 c5 2. Nf3 d6 3. d4?"
- "Сделай подсказку на каждый ход, но не показывай источник".

Minimum pass threshold:
- all golden prompts pass without hallucinated opening names;
- no unverified "best move" claims;
- no implementation starts before approval gates.

## Supplementary Gates

- `npm run qa:smoke:pr`
- `npm run qa:e2e:nightly`
- `npm run qa:security`
- `npm run qa:coverage:critical`
- `npm run qa:perf:critical`

For the inherited starter baseline these remain process-level checks until product-specific tests are added.

## Failure Classes

- `task_regression`: real regression in current task behavior, docs, scripts, tests or contracts.
- `infra_blocker`: missing deps, broken local environment, missing required files.
- `baseline_debt`: known baseline gap recorded in docs.
- `retryable_flake`: only when non-deterministic and not reproduced on controlled retry.

## Evidence Capture

- Записывать точные команды и PASS/FAIL.
- Для UI behavior changes записывать browser oracle, URL/base URL, expected visible result, actual visible result и console/runtime status.
- Для chess content changes записывать known line, expected opening name, source/manual verification, actual output and pass/fail.
- Для echo-test фиксировать root capability, minimal scenario, actual observed result, limitations and decision.
- Для Vercel production update фиксировать source branch/SHA, deployment URL, QA/security status and whether deployment came from GitHub `main` or explicit one-off owner-approved path.

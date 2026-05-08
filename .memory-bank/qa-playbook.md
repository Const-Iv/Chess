# QA Playbook

## Current Project QA Context

- Проект находится на этапе discovery / проверки гипотезы.
- Для документальных и governance-правок минимум проверки: `npm run lint`.
- Для завершения bootstrap после canonical transfer: `npm run qa:agent`.
- Product-specific runtime QA появится только после подтверждения гипотезы и отдельного approval по stack/runtime choices.
- Capability decisions на текущем этапе не применимы, поэтому security-sensitive capability QA пока не требуется.

## Agent QA Gate (Mandatory)

Primary deterministic gate:

1. `npm run qa:agent`

Gate order is fixed:

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

## Supplementary Gates

- `npm run qa:smoke:pr`
- `npm run qa:e2e:nightly`
- `npm run qa:security`
- `npm run qa:coverage:critical`
- `npm run qa:perf:critical`

Для starter baseline:

- `qa:smoke:pr` — process-level smoke on temp git repo;
- `qa:e2e:nightly` — более полный temp-repo flow с finish/merge coverage;
- `qa:coverage:critical` — manifest-driven critical regression guard, а не line-percentage;
- `qa:perf:critical` — benchmark guard against `Docs/qa-perf-baseline.json`.

## Code Change Batch Routine

- До edits искать уже существующие tests на затронутые seams.
- Если tests есть, сначала запускать ближайший baseline.
- После каждого logical batch прогонять targeted deterministic check.
- Если relevant tests нет, явно фиксировать gap и компенсировать ближайшей более широкой deterministic check.
- `qa:agent` остаётся обязательным final gate.

## Echo-testing Gate For Unknown Root Technology

- Echo-test обязателен до feature/refactor/behavior-change реализации, если продукт или capability зависит от неизвестной корневой технологии, интеграции, provider, runtime, agent surface, bot/channel, worker или внешнего API.
- Echo-test должен быть минимальным и изолированным: без продуктовой бизнес-логики, UX polishing, production user data и insecure bypass.
- Допустимый proof: входной сигнал проходит через выбранную связку и возвращается как same payload, фиксированный ответ или другой минимальный observable result.
- Evidence должно фиксировать hypothesis, setup, command/scenario, actual result, discovered limitations and decision: `proceed`, `blocked`, `narrow spike`, or `choose alternative`.
- Passing echo-test не заменяет `qa:agent`, security gate, product acceptance, capability-specific QA или owner approval.

## Behavior-Focused Test Quality

Тесты должны доказывать пользовательское или contract-level поведение, а не повторять implementation details.

Для новых или изменённых capability areas выбирать релевантные сценарии:

- happy path;
- empty / missing / boundary inputs;
- validation and error paths;
- permission / auth / role boundaries;
- retry, timeout and cancellation behavior;
- idempotency and duplicate handling;
- concurrency / race-sensitive behavior;
- state transitions and rollback;
- external provider failure isolation;
- user-visible empty/loading/error/success states.

Quality guardrails:

- bugfix требует regression test или явно зафиксированный gap с ближайшей deterministic компенсацией;
- не оставлять `test.skip`, `it.only` или эквивалентные focused/skipped tests в committed baseline;
- не использовать arbitrary sleeps/timeouts как доказательство async behavior, если есть deterministic wait/signal;
- не писать tests, которые проходят независимо от реализации;
- не тестировать private implementation details, если публичный contract можно проверить напрямую;
- shared mutable test state должен сбрасываться между cases;
- snapshot tests допустимы только для стабильных структур; для behavior prefer explicit assertions.

## Eval Gate For Agent Behavior

Eval обязателен для изменений, которые влияют на:

- Plan mode questions/recommendations;
- Product Charter gate или Project Intake Gate;
- rule-sync owner reports;
- rule-share owner reports;
- conversational commands;
- TRIZ trigger/decision behavior;
- другой AI/agent response quality.

Минимальный `Eval spec`:

- agent surface;
- good answer rubric;
- failure rubric;
- critical edge cases;
- regression examples / golden prompts;
- old vs new comparison method;
- minimum pass threshold.

Acceptance criteria проверяют пользовательский результат. Eval проверяет качество выбора, объяснения, рекомендации и соблюдения правил агентом.

До появления automated eval runner допустим manual rubric eval как deterministic evidence, если plan фиксирует точные prompts/cases, expected behavior, actual result и pass/fail по каждому case. Отсутствие eval coverage для agent behavior change нужно фиксировать как gap и debt-removal follow-up.

## Evidence Capture

- Записывать точные команды и PASS/FAIL.
- Для bugfixes фиксировать defect class, invariant и shared seam.
- Для AI/agent behavior changes записывать eval cases, expected behavior, actual behavior и pass/fail.
- Для rule-sync/rule-share imports считать QA/TRIZ logs evidence, а не готовым rule text: итоговое правило должно быть переписано как portable invariant и сохранять source traceability.
- Для performance и state-safety fixes фиксировать, что user data и public behavior contracts сохранены; read-only/internal automatic updates не должны считаться user changes без user interaction или real entity changes.
- Если defect class связан с потерей пользовательского состояния, evidence должно включать root-cause summary и reusable regression guard или явно зафиксированный exception.
- Для complex behavior changes evidence должно включать deterministic checks and operational-doc capture.
- Для temporary fixtures/worktrees cleanup result тоже является QA evidence.
- Для process/conveyor задач фиксировать task state/history changes как часть acceptance evidence.
- Для echo-testing фиксировать root capability, minimal scenario, actual observed result, limitations and decision; отсутствие echo-test для unknown root technology считается blocker, а не QA pass.
- `task:finish:core` не должен publish'ить commit, который не прошёл task QA: если finish стартует из dirty task tree, сначала нужен task commit/checkpoint, затем новый QA checkpoint уже на committed `HEAD`.
- Для no-op finish, где clean task branch уже содержится в `main`, acceptance evidence — `publishStatus=skipped_already_merged`, `PUBLISH_SKIP` в runtime history и итоговый `cleanupStatus=passed|kept`.
- Для delete cleanup acceptance evidence требует проверки exact `state.worktreePath`, git worktree registration, managed task root `$CODEX_HOME/worktrees/<taskId>/` и task-scoped leftovers; `cleanupStatus=passed` без этой проверки не считается доказательством.
- Большие `Docs/qa-implementation-log.md` и `Docs/triz-usage-log.md` должны compact'иться только через publish/release sync: полный pre-compaction snapshot уходит в `Docs/archive/*.md.gz`, активный лог остаётся читаемым.

## GitHub CI Failure Triage

- Для GitHub CI расследований использовать repo-owned `gh-fix-ci` workflow вместо ручного просмотра уведомлений.
- PR checks разбираются через `skills/gh-fix-ci/scripts/inspect_pr_checks.py`.
- Recent scheduled/nightly failures разбираются через `skills/gh-fix-ci/scripts/inspect_actions_failures.py` с явным window или owner-approved broad audit.
- Отчёт должен сначала группировать повторы по repo/workflow/branch scope/failure class, затем показывать run urls и snippets как traceability.
- `account_billing_blocker` означает owner/platform action и не должен превращаться в code patch.

## Failure Classes for Finish / Merge / Release

- `retryable_flake`: только если failure имеет недетерминированный характер и не воспроизводится на повторе того же stage.
- `baseline_debt`: если падает известный baseline gap, уже зафиксированный в `Docs/qa-baseline.md`.
- `infra_blocker`: missing deps, git/worktree corruption, broken local environment, missing required files.
- `task_regression`: любой реальный regression в scripts/docs/contracts/tests текущей задачи.

`retryable_flake` — единственный класс, который допускает controlled retry chunk. Остальные должны останавливать commit/release path.

## TRIZ Trigger Integration

- `qa_repeat_stage`
- `qa_chunk_exhausted`
- `cross_module_conflict`
- `historical_recurrence`

При trigger:

- писать `TRIZ_TRIGGER` в runtime history;
- добавлять запись в `Docs/triz-usage-log.md`;
- если TRIZ реально применён, писать `TRIZ_APPLIED`.

## Code Review Severity Mirror

High-priority findings для этого репозитория:

- conveyor/runtime regressions;
- task state/history contract breaks;
- single-writer operational docs violations;
- security defects в workflows/secret handling/dependency handling/release safety;
- flaky QA/CI, из-за которых gates перестают быть trustworthy.

## Shared Starter Baseline Rules

- `starter.agent.default-goal-loop`: Для executable tasks ассистент должен вывести ожидаемый результат из запроса пользователя и вести цикл `goal -> change -> check -> fix -> re-check`, пока результат не проверен или не достигнут явный stop condition. Stop conditions: существенная продуктовая неоднозначность, риск destructive/data/prod/secret/main-worktree action, отсутствие permission/credential, конфликт, требующий выбора владельца, исчерпанный retryable QA chunk, baseline/infra blocker вне scope задачи или настоящий продуктовый tradeoff с несколькими валидными вариантами.
- `starter.qa.ui-browser-oracle`: Для user-visible UI behavior change или UI bugfix ассистент должен до реализации определить browser oracle: точный пользовательский сценарий, ожидаемый видимый результат, релевантные данные/состояния, признаки сбоя и console/runtime status. Перед завершением нужно проверить реальный интерфейс доступным browser-инструментом. Если browser verification падает и агент может это воспроизвести, он диагностирует, исправляет, повторяет deterministic checks и снова прогоняет browser oracle, а не просит владельца искать UI-ошибки вручную.

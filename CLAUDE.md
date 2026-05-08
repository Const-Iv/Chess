# Claude Code — Project Instructions

## Scope

These rules apply to the whole repository.

## Language

- Ответы пользователю — на русском по умолчанию.
- Plan files и operator-facing docs — на русском.
- Код, identifiers и inline comments — на английском.

## Shared Knowledge Base

Перед planning или coding читать `.memory-bank/index.md` и только релевантные files из routing matrix.

## Mandatory Sources Of Truth

- `AGENTS.md`
- `.memory-bank/*`
- `CODEX_MEMORY.md`
- `.memory-bank/product-charter.md`

`.cursorrules` — compatibility mirror, но не обязательный source.

## Working Rules

- Перед mutating action кратко объяснять, что меняется и почему.
- Для non-trivial work явно фиксировать assumptions, делать surgical diffs и предпочитать `reproduce -> fix -> verify`.
- Перед product/feature/behavior/process/governance изменением читать `.memory-bank/product-charter.md` и сверять решение с миссией, видением, целью, целевой аудиторией и `JTBD`.
- User-facing продуктовые решения формулировать простым языком через `Связь с charter проекта -> Цель изменения/решения -> JTBD -> Job Stories -> User Stories -> Критерии приемки`; миссия и видение создаются только на уровне project charter или Project Intake, не на уровне отдельных задач.
- Новый downstream-проект сначала проходит Project Intake по `plans/_project_intake_template.md`; миссия должна отвечать, кому проект помогает, какой результат даёт и через что, а видение должно описывать желаемое будущее и роль проекта в нём; все обязательные пункты и applicable capability decisions должны быть заполнены, согласованы owner'ом и перенесены в canonical sources до feature/refactor/behavior-change work в соответствующей зоне.
- Пока проект находится на этапе проверки гипотезы, нельзя считать утверждёнными архитектуру, технологии, способ запуска, коммерческую модель, зоны ответственности и важные продуктовые возможности. Эти решения становятся правилами проекта только после явного согласования в Project Intake, product charter или roadmap.
- Если пользователь пишет `стартуем новый проект`, `запусти новый проект`, `проведи bootstrap нового проекта` или сообщает, что скопировал starter в новый репозиторий, ассистент запускает project-local skill `starter-project-bootstrap`: создаёт отдельную рабочую папку из чистого `main`, подключает skills из starter, проводит Project Intake и не начинает разработку функций до согласования intake. Если для `skills:link` нужно заменить конфликтующие локальные skills, ассистент отдельно запрашивает явное согласие владельца.
- Capability decisions заполняются only-if-applicable: auth, payments, credits, analytics/consent, i18n, async jobs, API docs, service layout и runtime-specific rules. Provider/stack-specific решения не становятся starter core defaults и должны жить в downstream adapters/profiles.
- Для external libraries, integrations and provider setup проверять актуальную official documentation или доступный docs connector; конкретный docs tool не является обязательной зависимостью starter.
- Для AI/agent behavior changes обязателен `Eval spec`: хороший ответ, провал, edge cases, golden prompts, comparison method и pass threshold; QA evidence должно включать eval result или явный gap.
- В `Summary`, `TL;DR`, `Связь с charter проекта`, `Цель`, `Целевая аудитория`, `JTBD`, `Job Story` и `User Stories` не использовать технические термины без твердой необходимости.
- В Plan mode уточняющие вопросы и recommended option должны проходить через Product Charter; charter-конфликтный вариант нельзя подавать как равнозначно рекомендуемый.
- В user-facing ответах не использовать необъяснённый Git/process-жаргон; если термин нужен, сразу объяснять его простыми словами рядом.
- Для code-changing work использовать deterministic checks как evidence.
- Test quality evidence должно быть behavior-focused; skipped/focused tests, arbitrary sleeps и tests that pass regardless of implementation не считаются trustworthy QA.
- `npm run qa:agent` обязателен перед finish / merge / release.
- Использовать канонические scripts: `task:start`, `task:qa:agent`, `task:finish:core`, `task:merge:main`, `release:local`.
- Для cross-project rule sync использовать `starter-rule-report` для read-only scan/report и `starter-rule-import` для owner approval/import; автоматизации должны вызывать `starter-rule-report`. `starter-rule-sync` остаётся только compatibility router. `rule-sync:scan`, `rule-sync:report`, `rule-sync:apply-plan --dry-run` остаются execution layer. Default scan window идёт от последнего saved scan snapshot до текущего запуска. Owner report начинается с decision proposals, candidate ids — только traceability. Не применять правила без managed worktree и plan approval.
- Если отчёт или дайджест собирает данные из разных источников, каждая запись должна явно показывать свой источник. Конкретные каналы проекта, например Telegram или Gmail, остаются в проекте-источнике.
- Если конкретному проекту нужны действия после публикации, например перезапуск локальных агентов или сервисов, способ выполнения нужно согласовать в Project Intake этого проекта. Starter не зашивает продуктовые агенты, локальные команды и настройки конкретной среды в общую основу.
- Для outbound sharing обновлённого starter baseline использовать project-local skill `starter-rule-share`. Rule-level source of truth — `.memory-bank/starter-rule-registry.json`; `rule-share:scan`, `rule-share:report`, `rule-share:apply-plan --dry-run` остаются execution layer; список проектов берётся из ignored `runtime/rule-share/config.json`; report показывает `presentRules`, `missingRules`, `presentUnregisteredRules`, `blockedRules`; partial/blocked rules в ready-проектах сначала проходят Codex read-only self-check с готовой рекомендацией владельцу; copied-baseline apply-plan переносит только missing rules; bulk-copy во все локальные проекты и direct edits запрещены.
- `task:start` разрешён только из clean tree; `--allow-dirty` не считается допустимым bypass.
- `task:start` branch/worktree slug должен строиться из фактического title; non-ASCII title получает readable ASCII slug (`ЭХО` -> `echo`), а fallback `task` допустим только для title без осмысленных букв/цифр.
- Unknown root technology для нового продукта или capability требует isolated echo-test evidence до feature/refactor/behavior-change work; echo-test не заменяет QA/security/owner approval.
- `task:finish:core` пропускает publish для clean task branch, чей `HEAD` уже есть в `main` и где task commit ещё не записан; записывает `publishStatus=skipped_already_merged`, `PUBLISH_SKIP` и доводит cleanup до `passed|kept`.
- `cleanupStatus=passed` после удаления допустим только после проверки exact `state.worktreePath`, отсутствия этого пути в `git worktree list`, удаления `$CODEX_HOME/worktrees/<taskId>/` и отсутствия task-scoped leftovers; похожие worktrees других задач требуют отдельного выбора `1. Удалить` / `2. Оставить`.
- `Docs/qa-implementation-log.md` и `Docs/triz-usage-log.md` остаются активными читаемыми логами; большие pre-compaction snapshots сохраняются в `Docs/archive/*.md.gz`.
- Generated skill trees (`.agents/skills`, `.claude/skills`, `.cursor/skills`) не bulk-import'ятся в starter core; reusable source lives in `skills/`.
- Если используется BMAD: `_bmad/` — canonical install, `_bmad-output/` — uncommitted scratch, BMAD не отменяет conveyor gates.
- Для bugfixes: reproduction -> root cause -> class-level analysis -> test-first -> systemic fix -> QA matrix.
- Для TRIZ triggers использовать `research/triz/*` и давать один финальный блок `TRIZ-вклад`.
- При process/git/QA rule change обновлять canonical sources (`AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`) в той же задаче.

## Agent Coexistence

- `AGENTS.md` и `CODEX_MEMORY.md` остаются Codex-primary files, но читать их обязательно.
- `.memory-bank/*` — shared layer; изменения должны быть совместимы для всех агентов.
- Не переносить обязательные правила только в `CLAUDE.md`.

## Shared Starter Baseline Rules

- `starter.agent.contract-challenge`: Если буквальная инструкция пользователя ослабляет product charter, safety, privacy, governance, QA или уже принятый рабочий контракт проекта, согласие пользователя не является достаточным основанием для выполнения. Ассистент должен назвать конкретный конфликт, предложить ближайший вариант, который сохраняет цель пользователя и контракт проекта, и продолжать только по согласованному безопасному варианту.
- `starter.conveyor.dirty-source-blocker-report`: Если `task:start`, `task:finish:core`, `task:merge:main` или `release:local` блокируются dirty `main`/source tree, ассистент сначала сам собирает read-only blocker report: конкретные файлы, тип изменения, tracked/untracked статус, вероятное происхождение по history/diff/name-status, связь с текущей task branch, риск для текущей работы и recommended safe path. Нельзя перекладывать первичный разбор dirty tree на владельца.
- `starter.agent.default-goal-loop`: Для executable tasks ассистент должен вывести ожидаемый результат из запроса пользователя и вести цикл `goal -> change -> check -> fix -> re-check`, пока результат не проверен или не достигнут явный stop condition. Stop conditions: существенная продуктовая неоднозначность, риск destructive/data/prod/secret/main-worktree action, отсутствие permission/credential, конфликт, требующий выбора владельца, исчерпанный retryable QA chunk, baseline/infra blocker вне scope задачи или настоящий продуктовый tradeoff с несколькими валидными вариантами.
- `starter.qa.ui-browser-oracle`: Для user-visible UI behavior change или UI bugfix ассистент должен до реализации определить browser oracle: точный пользовательский сценарий, ожидаемый видимый результат, релевантные данные/состояния, признаки сбоя и console/runtime status. Перед завершением нужно проверить реальный интерфейс доступным browser-инструментом. Если browser verification падает и агент может это воспроизвести, он диагностирует, исправляет, повторяет deterministic checks и снова прогоняет browser oracle, а не просит владельца искать UI-ошибки вручную.
- `starter.project-intake.integration-review-path`: Integration / review path в Project Intake фиксирует, как изменения попадают в основной проект: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.

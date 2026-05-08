# Project Context

## Product Charter

- Миссия: помогать командам, которые запускают новый проект или репозиторий, с первого дня получать понятную и воспроизводимую операционную основу через переносимый starter baseline: правила работы, безопасное ведение задач, проверяемое качество, память проекта и разговорное управление процессом без ручной сборки заново.
- Видение: новый проект начинается не с ручной сборки правил, процессов и проверок, а с готовой переносимой основы; `new-project-starter` становится базовым слоем для таких репозиториев, где команда добавляет продуктовую специфику поверх через adapters/profiles без изменения core governance.
- Цель: поддерживать runnable local-first starter baseline, который можно подключать или копировать в downstream проекты, чтобы они сразу имели canonical sources of truth, managed worktrees, deterministic QA, task state/history, operational docs и reusable shared skills.
- Целевая аудитория: команды, которые начинают новый проект или репозиторий; технические и продуктовые лиды, отвечающие за переносимую операционную основу; инженеры и agent-operators, ведущие задачи через Codex/worktree conveyor; downstream maintainers, подключающие starter как baseline.
- Не ЦА starter core: конечные пользователи downstream-продуктов; их аудитория описывается в charter и product specs конкретного downstream-проекта.
- JTBD: когда начинается новый проект, я хочу получить готовую и переносимую операционную основу, чтобы команда сразу работала по ясным правилам, проверяла изменения воспроизводимо и не собирала governance, task flow и QA заново.
- Core starter не является продуктовым runtime. Новые правила и скрипты должны быть переносимыми baseline-контрактами; product-specific capabilities добавляются поверх starter через adapters/profiles.
- Перед любым продуктовым решением, feature, behavior, process или governance изменением нужно прочитать `.memory-bank/product-charter.md` целиком и сверить решение с миссией, видением, целью, целевой аудиторией и `JTBD`.
- В Project Intake миссия должна отвечать: кому проект помогает, какой результат даёт и через что; видение должно описывать желаемое будущее и роль проекта в нём. Миссия и видение пишутся только на уровне проекта, а не для отдельных задач.
- Новый downstream-проект сначала проходит Project Intake Gate по `plans/_project_intake_template.md`: недостающие product/governance сведения, включая integration/review path для проведения изменений, заполняются, согласуются owner'ом и только затем переносятся в canonical sources и используются для feature work.
- Пока проект находится на этапе проверки гипотезы, нельзя считать утверждёнными архитектуру, технологии, способ запуска, коммерческую модель, зоны ответственности и важные продуктовые возможности. Эти решения становятся правилами проекта только после явного согласования в Project Intake, product charter или roadmap.
- Project Intake включает applicable capability decisions для auth, payments, credits, analytics/consent, i18n, async jobs, API documentation, service layout и runtime-specific rules. Эти блоки заполняются только если применимы к downstream-продукту; provider/stack-specific решения остаются adapters/profiles, а не starter core.
- Если downstream-продукт или capability зависит от неизвестной корневой технологии, интеграции, provider, runtime, agent surface, bot/channel, worker или внешнего API, Project Intake фиксирует isolated echo-test evidence или blocker до feature/refactor/behavior-change работы в этой зоне.
- Project Intake фиксирует integration/review path: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.
- Если конкретному проекту нужны действия после публикации, например перезапуск локальных агентов или сервисов, способ выполнения нужно согласовать в Project Intake этого проекта. Starter не зашивает продуктовые агенты, локальные команды и настройки конкретной среды в общую основу.
- Conversational bootstrap для нового downstream-проекта идёт через `starter-project-bootstrap`: если пользователь пишет `стартуем новый проект`, `запусти новый проект`, `проведи bootstrap нового проекта` или сообщает, что скопировал starter в новый репозиторий, ассистент создаёт отдельную рабочую папку из чистого `main`, подключает skills из starter, проводит Project Intake и не начинает разработку функций до согласования intake. Если для `skills:link` нужно заменить конфликтующие локальные skills, ассистент отдельно запрашивает явное согласие владельца.
- Agent/eval surfaces starter core: Plan mode questions/recommendations, Product Charter gate, Project Intake Gate, rule-sync owner reports, conversational task commands и TRIZ trigger/decision behavior.

## Repository Layout

- `scripts/`: канонические conveyor, QA, release и operational-doc entrypoints.
- `scripts/rule-sync.mjs`: deterministic scanner, report renderer и approval-safe apply-plan seam для starter rule sync.
- `scripts/rule-share.mjs`: deterministic scanner, report renderer и approval-safe apply-plan seam для outbound sharing текущего starter baseline в выбранные active downstream проекты.
- `scripts/lib/`: shared runtime helpers для task state, history, docs sync и git-safe operations.
- `skills/`: reusable repo-owned Codex skills, которые можно линковать в `$CODEX_HOME/skills`.
- `skills/starter-rule-report/`: primary project-local skill для read-only rule discovery/report workflow; `rule-sync:scan` и `rule-sync:report` остаются execution layer.
- `skills/starter-rule-import/`: primary project-local skill для owner approval и import workflow; `rule-sync:apply-plan` остаётся preliminary check без изменений и task seed layer.
- `skills/starter-rule-sync/`: temporary compatibility router для старых rule-sync prompt'ов.
- `skills/starter-rule-share/`: primary project-local skill для approval-safe outbound rule sharing после успешного starter import.
- `skills/starter-project-bootstrap/`: primary project-local skill для guided bootstrap нового downstream-проекта после копирования или подключения starter baseline.
- `.memory-bank/`: shared knowledge layer для всех агентов.
- `.memory-bank/starter-rule-registry.json`: canonical machine-readable список reusable starter rules для outbound sharing; rule-share использует его для проверки, что уже есть в downstream проекте и что действительно нужно добавить.
- `Docs/`: human-readable process evidence и baselines.
- `plans/`: plan и bugfix templates плюс reference blueprint.
- `research/triz/`: canonical TRIZ pack.
- `templates/agent-workspace/`: локальные безопасные шаблоны для agent profiles и memory.
- `tests/unit`, `tests/integration`, `tests/e2e`: deterministic coverage самого process-layer.

## Tech Stack

- Runtime: Node.js CLI baseline.
- Main language: JavaScript (`.mjs`) + JSDoc typing.
- Typecheck: TypeScript `checkJs`.
- Tests: built-in Node test runner.
- Persistence: git worktrees + JSON/NDJSON state in `.git/codex-task-pipeline/*`.
- Release target: local-first `release:local`.

## Source of Truth

- Governance: `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`.
- Product charter: `.memory-bank/product-charter.md`.
- Reusable rule registry: `.memory-bank/starter-rule-registry.json`.
- Task state: `.git/codex-task-pipeline/tasks/*.json`.
- Runtime history: `.git/codex-task-pipeline/history/events.ndjson`.
- Operational docs: активные читаемые логи `Docs/qa-implementation-log.md`, `Docs/triz-usage-log.md`, архивные pre-compaction snapshots в `Docs/archive/*.md.gz` и append-only sections of `CODEX_MEMORY.md`.
- TRIZ canon: `research/triz/*`.

## Common Commands

- `npm ci`
- `npm run lint`
- `npm run lint:fix`
- `npm run lint:fix:changed`
- `npm run skills:link`
- `npm run skills:status`
- `npm run skills:unlink`
- `npm run rule-sync:scan -- --since <date> --until <date>`
- `npm run rule-sync:report -- --latest`
- `npm run rule-sync:apply-plan -- --approval <path> --dry-run`
- `npm run rule-share:scan`
- `npm run rule-share:report -- --latest`
- `npm run rule-share:apply-plan -- --approval <path> --dry-run`
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
- `npm run task:history -- tail --lines 20`
- `npm run task:history -- sync`
- `npm run task:ledger -- rebuild --write-docs`
- `npm run task:operational-docs:capture`
- `npm run task:operational-docs:sync`
- `npm run release:local`

## Operational Constraints

- Core starter не содержит продуктовый UI/API runtime; smoke/nightly здесь проверяют process contracts через temp repos.
- `main` защищён от прямых изменений: direct-main правка допустима только по явному разрешению пользователя в текущей задаче.
- Дефолтный implementation path для feature/refactor/bugfix/process/governance задач — отдельный managed worktree и ветка `codex/*`.
- `task:start` по умолчанию работает с managed worktrees under `$CODEX_HOME/worktrees/<taskId>/`.
- Reusable starter skills публикуются в `$CODEX_HOME/skills` через symlink-based `skills:link`; после `git pull` существующие ссылки подхватывают обновления сразу, а для новых или переименованных skills нужно повторно запустить `skills:link`.
- `starter-project-bootstrap` — основной Codex entrypoint для `стартуем новый проект`: сначала автоматически создать managed bootstrap worktree on clean `main`, обеспечить skill availability через `npm ci` при необходимости и `npm run skills:link`, затем определить bootstrap state, провести Project Intake Gate, canonical docs transfer и baseline QA; product-specific choices остаются downstream adapters/profiles.
- `starter-rule-report` — основной Codex entrypoint для scheduled automation и быстрого ручного rule discovery/report: он запускает read-only scan/report, сохраняет readable Markdown artifact в `runtime/rule-sync/reports/`, показывает decision proposals до raw ids и не готовит import.
- `starter-rule-import` — основной Codex entrypoint для утреннего согласования: он ведёт owner'а по `Кандидаты на импорт` и `Требует ручной проверки`, задаёт вопросы по проекту, сути и `**Точный текст для starter:**`, затем после explicit approval готовит approval JSON и preliminary check без изменений. Каждый approved reusable rule добавляется или обновляется в `.memory-bank/starter-rule-registry.json`. `rule-sync:apply-plan` в v1 только готовит seed для managed `task:start` и не применяет изменения автоматически.
- `starter-rule-sync` — временный compatibility router для старых prompt'ов, который направляет к report/import skill.
- `rule-sync:scan` и `rule-sync:report` остаются read-only относительно starter source. Эталонный report format для rule-sync решений: последние блоки `Кандидаты на импорт` и `Требует ручной проверки` читаются самостоятельно, похожие пункты сгруппированы по проекту/теме, а ключевые labels выделены жирным, например `**Точный текст для starter:**` и `**Что ожидается от владельца:**`.
- Если отчёт или дайджест собирает данные из разных источников, каждая запись должна явно показывать свой источник. Конкретные каналы проекта, например Telegram или Gmail, остаются в проекте-источнике.
- Default `rule-sync:scan` window идёт от `until` последнего saved scan snapshot до текущего запуска; fallback на previous local day используется только при отсутствии валидного snapshot.
- `starter-rule-share` — основной Codex entrypoint для outbound sharing уже обновлённого starter baseline в выбранные active downstream проекты; `runtime/rule-share/config.json` хранит локальный allowlist/ignorelist и optional standing approval для guarded one-run mode, не коммитится.
- `rule-share:scan` и `rule-share:report` read-only относительно downstream source; они читают `.memory-bank/starter-rule-registry.json` и группируют по проектам `presentRules`, `missingRules`, `presentUnregisteredRules`, `blockedRules` с конкретным текстом правил. Для `blockedRules` в ready-проекте Codex сначала делает read-only self-check по target files и даёт владельцу готовую рекомендацию, вместо просьбы самому искать фрагменты. `rule-share:apply-plan` в v1 только готовит per-project dry-run task seeds и не делает direct edits. For copied-baseline `prepare_rule_import`, the seed imports only `missingRules`, keeps canonical/mirror parity, records QA/TRIZ evidence and stops before publish. One-run mode выполняется самим skill поверх этих commands: только ready approved targets, managed downstream worktrees, deterministic QA, без finish/merge/publish по умолчанию.
- Downstream проекты могут подключать starter как git submodule под `vendor/new-project-starter` и линковать shared skills через `skills-manage.mjs --source vendor/new-project-starter/skills`, чтобы repo фиксировал версию baseline для новых участников.
- `.system`, plugin-cache и product-specific skills не должны вендориться в starter core.
- Generated skill trees вроде `.agents/skills`, `.claude/skills` и `.cursor/skills` считаются output'ом профиля или инструмента; starter импортирует только reusable source policy или repo-owned skills under `skills/`, а не bulk generated trees.
- `task:qa:agent` всегда пишет `qaLastPassSha` и `previewPreparedSha`; preview status по умолчанию `not_supported`, пока проект не добавит preview adapter.
- `task:finish:core` пропускает publish stage для clean task branch, чей `HEAD` уже содержится в `main` и у которой ещё нет записанного task commit; это фиксируется как `publishStatus=skipped_already_merged`, после чего cleanup всё равно должен завершиться `passed|kept`.
- `release:local` — core publish path. Deploy-to-server и `db:prod:*` контуры должны добавляться как optional profile поверх starter baseline.

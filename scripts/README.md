# Script Contracts

В этом starter репозитории скрипты уже реализованы и являются source of truth для process-layer.

## Канонические entrypoint'ы

### `skills:status`

- показывает состояние repo-managed skills относительно `$CODEX_HOME/skills`;
- с `--source <skills-root>` проверяет внешний skills root, например `vendor/new-project-starter/skills` из git submodule;
- различает `linked`, `missing` и `conflict`;
- не меняет файловую систему и печатает machine-readable JSON.

### `skills:link`

- находит все repo-owned skills из `skills/**/SKILL.md`;
- с `--source <skills-root>` находит shared skills во внешнем source tree, например в starter submodule downstream проекта;
- создаёт symlink в `$CODEX_HOME/skills/<relative-path>`;
- не перезаписывает конфликтующие локальные директории или symlink'и по умолчанию;
- с `--adopt` переносит конфликтующий target в `$CODEX_HOME/skills-backups/<timestamp>/...`, затем ставит managed symlink;
- после обычного `git pull` уже существующие symlink'и сразу видят обновления repo skill.

### `skills:unlink`

- удаляет только symlink'и, которые указывают на текущий repo-owned skill source;
- с `--source <skills-root>` удаляет только symlink'и, которые указывают на этот внешний skills source;
- не трогает конфликтующие или чужие директории;
- подчищает пустые parent-директории внутри `$CODEX_HOME/skills`, если после unlink они опустели.

### `rule-sync:scan`

- ищет локальные git-проекты под рабочим корнем starter и `$CODEX_HOME/worktrees`;
- учитывает ignored local config `runtime/rule-sync/config.json` с `roots`, `allowlist`, `ignorelist`;
- читает task pipeline events/states и governance commits за заданный период;
- пишет snapshot в `runtime/rule-sync/scans/*.json`;
- остаётся read-only относительно tracked starter source.
- read-only owner report workflow должен идти через repo skill `starter-rule-report`; script остаётся детерминированным execution layer.
- если `--since` / `--until` не указаны, default window начинается с `until` последнего сохранённого scan snapshot и заканчивается текущим временем; если snapshot ещё нет, используется предыдущий локальный день.

### `rule-sync:report`

- читает последний или явно выбранный scan snapshot;
- сохраняет человекочитаемый Markdown в `runtime/rule-sync/reports/*.md`; `--output <path>` может задать явный путь;
- при `--latest` защищает owner report от короткого нулевого follow-up scan: если latest snapshot выглядит как technical probe сразу после meaningful run, report выбирает предшествующий meaningful snapshot и показывает fallback traceability; настоящий нулевой scan за полный период не подменяется старым результатом;
- строит русскую owner-facing сводку, которая начинается с decision proposals в формате `Связь с charter проекта -> Цель решения -> JTBD -> Job Stories -> User Stories -> Критерии приемки`;
- ниже decision proposals показывает `Разбор по проектам`: похожие находки внутри проекта группируются в одно предложение; для каждой группы видно, что нашли, есть ли дубли, почему это полезно starter, точный текст правила для starter, как убрать лишние детали, куда может лечь правило и по каким ids проверить источник;
- ниже project breakdown показывает self-contained decision-блоки `Кандидаты на импорт`, `Требует ручной проверки`, `Пропущено как product-specific`, `Диагностика`; `Кандидаты на импорт` и `Требует ручной проверки` повторно группируют похожие пункты по проекту и теме, чтобы владелец мог читать эти блоки без верхнего разбора;
- в `Требует ручной проверки` каждая группа показывает, что Codex проверяет сам read-only, моё предложение и какое решение ожидается от владельца;
- эталонный формат owner-facing групп использует жирные Markdown labels: `**Точный текст для starter:**`, `**Что Codex проверяет сам:**`, `**Моё предложение:**`, `**Что ожидается от владельца:**`; эти labels считаются частью контракта читаемости отчёта;
- anti-regression contract: не возвращать raw ids как основной интерфейс решения, не повторять дубли отдельными пунктами, не оставлять QA/TRIZ logs как import-ready правила, не использовать generic evidence wording без конкретной проблемы и ожидаемого owner decision, не перекладывать read-only проверку источников на владельца;
- сохраняет traceability: source project, task/commit evidence, changed files, suggested starter target.
- утренний owner approval workflow по этому report должен идти через repo skill `starter-rule-import`.

### `rule-sync:apply-plan`

- принимает approval JSON с ids подтверждённых candidates;
- в v1 требует `--dry-run`;
- возвращает seed и команду для managed `task:start`;
- не применяет правила, не меняет `main` и не создаёт source edits без отдельного task worktree/plan/QA.
- user-facing текст должен объяснять `--dry-run` как `предварительная проверка без изменений`.

### `rule-share:scan`

- ищет только owner-allowed active downstream проекты из ignored local config `runtime/rule-share/config.json`;
- поддерживает `roots`, `allowlist`, `ignorelist` и `starterPath`;
- читает `.memory-bank/starter-rule-registry.json` и классифицирует проекты как готовые к `update_starter_reference`, готовые к `prepare_rule_import`, актуальные, требующие ручной проверки или заблокированные;
- в snapshot пишет rule-level группы `presentRules`, `missingRules`, `presentUnregisteredRules`, `blockedRules`;
- пишет snapshot в `runtime/rule-share/scans/*.json`;
- остаётся read-only относительно downstream source.

### `rule-share:report`

- читает последний или явно выбранный rule-share snapshot;
- строит owner-facing сводку с секциями `Предложения к проектам`, `Готово к обновлению`, `Актуально`, `Требует ручной проверки`, `Заблокировано`, `Диагностика`;
- внутри каждого проекта показывает конкретные правила: что уже есть, что есть текстом без registry id, что будет добавлено, что требует ручной проверки;
- для `blockedRules` в ready-проектах report помечает это как Codex self-check queue: Codex сначала читает target files read-only и затем даёт владельцу конкретную рекомендацию;
- показывает project ids только как traceability для approval JSON;
- не предлагает проекты вне локального allowlist как готовые targets.

### `rule-share:apply-plan`

- принимает approval JSON с ids подтверждённых проектов;
- в v1 требует `--dry-run`;
- возвращает per-project task seeds и команды для managed `task:start` внутри выбранных downstream проектов;
- для copied-baseline `prepare_rule_import` seed включает exact missing rules list, запрещает дублировать present/present-unregistered rules и содержит полный downstream implementation contract: canonical/mirror sync, сохранение product-specific wording, QA/TRIZ evidence и stop-before-publish gate;
- не редактирует downstream source, не обновляет submodule напрямую и не делает bulk-copy правил.

### Git submodule для shared skills

Downstream проект может держать starter как versioned submodule и не копировать reusable skills вручную:

```bash
git submodule add <starter-repo-url> vendor/new-project-starter
git submodule update --init --recursive
node vendor/new-project-starter/scripts/skills-manage.mjs link --source vendor/new-project-starter/skills
```

В `package.json` downstream проекта можно добавить wrapper:

```json
{
  "scripts": {
    "skills:link": "node vendor/new-project-starter/scripts/skills-manage.mjs link --source vendor/new-project-starter/skills",
    "skills:status": "node vendor/new-project-starter/scripts/skills-manage.mjs status --source vendor/new-project-starter/skills",
    "skills:unlink": "node vendor/new-project-starter/scripts/skills-manage.mjs unlink --source vendor/new-project-starter/skills",
    "rule-sync:scan": "node vendor/new-project-starter/scripts/rule-sync.mjs scan",
    "rule-sync:report": "node vendor/new-project-starter/scripts/rule-sync.mjs report",
    "rule-sync:apply-plan": "node vendor/new-project-starter/scripts/rule-sync.mjs apply-plan",
    "rule-share:scan": "node vendor/new-project-starter/scripts/rule-share.mjs scan",
    "rule-share:report": "node vendor/new-project-starter/scripts/rule-share.mjs report",
    "rule-share:apply-plan": "node vendor/new-project-starter/scripts/rule-share.mjs apply-plan"
  }
}
```

### `task:start`

- создаёт `codex/*` branch и отдельный managed worktree;
- принимает `--title`, `--seed-message`, но не позволяет обходить preflight через `--allow-dirty`;
- строит branch/worktree slug из фактического `--title`; для non-ASCII title используется readable ASCII slug, например `ЭХО` -> `echo`, а fallback `task` допустим только для title без осмысленных букв/цифр;
- если source tree dirty, останавливается до создания ветки/worktree и подсказывает безопасные next steps;
- пишет task state в `.git/codex-task-pipeline/tasks/*.json`;
- пишет runtime history в `.git/codex-task-pipeline/history/events.ndjson`;
- bootstrappит зависимости в новом worktree;
- best-effort открывает новый worktree/chat, но auto-open failure не должен ломать START.

### Echo-testing gate

- для нового продукта или capability на неизвестной корневой технологии до feature work нужен isolated echo-test;
- echo-test проверяет минимальный путь без продуктовой логики: входной сигнал возвращается как same payload, фиксированный ответ или другой minimal observable result;
- evidence фиксирует hypothesis, setup, command/scenario, actual result, limitations and decision: `proceed`, `blocked`, `narrow spike` или `choose alternative`;
- echo-test не заменяет `qa:agent`, security checks, product acceptance или owner approval.

### `task:qa:agent`

- запускает dependency preflight;
- запускает fixed deterministic QA gate;
- пишет `qaLastPassSha`, `previewPreparedSha`, `lastQaResult`;
- при PASS дополнительно пишет history events `QA_CHECKPOINT` и `PREVIEW_READY`;
- классифицирует failure class;
- при trigger фиксирует `TRIZ_TRIGGER`.

### `task:finish:core`

- работает только на `codex/*` branch;
- умеет resume из `main` через `--task-id <id>` для cleanup/publish retry; `--branch codex/<task-branch>` остаётся совместимым fallback;
- не коммитит и не публикует при failed task QA;
- переиспользует `qaLastPassSha`, если `HEAD` не менялся после последнего PASS;
- если finish стартует из dirty task tree, сначала фиксирует task commit/checkpoint, потом прогоняет task QA на committed `HEAD`, и только затем идёт в publish stage;
- если clean task branch уже содержится в `main` и task commit ещё не записан, пропускает publish stage, пишет `publishStatus=skipped_already_merged` и history event `PUBLISH_SKIP`;
- вызывает `task:operational-docs:capture` перед commit;
- после capture нормализует shared operational snapshots, чтобы они не попадали в task commit;
- пушит task branch при наличии `origin`;
- запускает merge/publish handoff через `task:merge:main`;
- пишет `QA_REUSE`, `COMMIT_PUSH`, `CLEANUP`, `FINISH`;
- требует явное решение `--cleanup 1|2` как canonical path; legacy `yes|no` остаётся совместимым.
- branch-chat cleanup gate задаётся фиксированно как `1. Удалить` / `2. Оставить`; ответ `1` маппится на `--cleanup yes`, ответ `2` — на `--cleanup no`.
- успешный delete cleanup требует `cleanupStatus = passed` только после проверки exact `state.worktreePath`, отсутствия этого пути в `git worktree list`, удаления `$CODEX_HOME/worktrees/<taskId>/` и отсутствия task-scoped leftovers; один `cleanupDecision`, похожий worktree name или exit code не считается доказательством фактической уборки.
- если похожий worktree относится к другому `taskId`, branch или проекту, он сообщается как отдельный pending cleanup и не удаляется без нового выбора `1. Удалить` / `2. Оставить`.
- optional repo hook `task:finish:cleanup` может вернуть task-scoped `extraPaths`, `blocked` и `notes`; starter core удаляет только пути внутри текущего task scope.

### `task:merge:main`

- может запускаться из task worktree или из `main` с `--branch` / `--task-id`;
- использует local `main` worktree и `main-publish.lock`;
- подтягивает `origin/main`, если remote существует;
- нормализует legacy dirty `Docs/task-history.md` перед publish stage;
- merge'ит task branch в `main`;
- прогоняет `qa:agent` на `main`;
- прогоняет `qa:security` на `main` перед push, потому что `main` может быть production source для product deploy profile;
- синхронизирует operational docs;
- пересобирает `Docs/task-history.md` только на publish stage;
- auto-commit'ит tracked sync/history changes и generated `Docs/archive/*.md.gz` перед push, если они появились;
- пушит `main`, если remote существует;
- для product deploy profile после push нужен отдельный deploy evidence report: `publishStatus`, source branch/SHA, provider URL/status if available and smoke result; push confirms trigger only.

### `task:history`

- `tail`: выводит runtime events;
- `sync`: перестраивает `Docs/task-history.md`.

### `task:ledger`

- `rebuild --write-docs`: перестраивает `Docs/change-ledger.md`.

### `task:operational-docs:capture`

- сохраняет append-only snapshots `Docs/qa-implementation-log.md`, `Docs/triz-usage-log.md` и sections `Learned Rules` / `Project Notes` из `CODEX_MEMORY.md` в runtime artifacts.

### `task:operational-docs:sync`

- синхронизирует captured operational docs обратно в single-writer snapshots на publish/release stage.
- если `Docs/qa-implementation-log.md` или `Docs/triz-usage-log.md` разрастаются, сохраняет полный pre-compaction snapshot в `Docs/archive/*.md.gz`, а в активном файле оставляет компактный текущий хвост.

### `release:local`

- работает только на clean `main`;
- делает sync с `origin/main`, если remote есть;
- прогоняет deterministic QA;
- пишет local release artifact в `runtime/release/`.

## Deterministic QA Order

```text
lint -> lint:fix:changed -> lint -> typecheck -> test -> build
```

## Дополнительные QA entrypoint'ы

- `qa:smoke:pr` — process smoke на temp repo;
- `qa:e2e:nightly` — расширенный nightly process flow;
- `qa:security` — secret scan + dependency audit;
- `qa:coverage:critical` — manifest-driven critical regression guard;
- `qa:perf:critical` — benchmark guard against `Docs/qa-perf-baseline.json`.

## Preview Contract

- Core starter не поднимает продуктовый preview.
- `task:qa:agent` всё равно пишет `previewPreparedSha`; это checkpoint contract, а не обещание live preview.
- Default preview payload: `status = not_supported`.
- `task:finish:core` не использует legacy `--preview ok|skip`.

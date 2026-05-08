# Rule-share: выбор проектов первым шагом

Статус: QA passed.

## Связь с charter проекта

Изменение сохраняет переносимый starter baseline и safe task flow: владелец сначала выбирает, какие downstream-проекты действительно должны получить правила, а Codex не переносит governance в проекты по молчаливой догадке.

## Цель изменения

Сделать выбор проектов для `starter-rule-share` обязательным первым owner-facing шагом каждого интерактивного запуска.

## Целевая аудитория проекта

Owner starter baseline и владельцы downstream-проектов, которые получают reusable governance без перезаписи продуктовой специфики.

## Продуктовая спека

Проблема: при исходящем шаринге правил Codex может ошибочно трактовать “все готовые проекты” как подтверждённый список, хотя owner ожидал отдельный выбор проектов.

JTBD: когда starter baseline обновлён и его нужно раздать downstream-проектам, owner хочет сначала увидеть полный список кандидатов и подтвердить exact include/exclude set, чтобы правила ушли только в нужные проекты.

Job Stories:
- Когда owner запускает `starter-rule-share`, он хочет сначала выбрать проекты для текущего переноса, чтобы исключить личные, dirty, source-only или неподходящие проекты.
- Когда окно выбора недоступно, owner хочет, чтобы Codex остановился и спросил в чате, а не продолжил по молчаливой догадке.
- Когда включён guarded one-run, owner хочет, чтобы one-run не обходил текущий выбор проектов.

User Stories:
- Как owner, я хочу видеть полный список обнаруженных проектов с рекомендацией include/exclude/blocked/source-only, чтобы быстро подтвердить правильный список.
- Как owner, я хочу, чтобы прошлый approval JSON или standing approval не считались текущим интерактивным подтверждением, чтобы не повторить ошибочный перенос.
- Как downstream owner, я хочу, чтобы мой проект не попал в rule-share без явного включения в текущий запуск.

Критерии приемки:
- `skills/starter-rule-share/SKILL.md` требует project selection gate до `rule-share:scan`, `rule-share:apply-plan`, downstream `task:start` и one-run.
- `AGENTS.md`, `.memory-bank/code-rules.md`, `CODEX_MEMORY.md`, `.memory-bank/project-context.md` и `README.md` фиксируют тот же invariant.
- `.memory-bank/starter-rule-registry.json` содержит reusable rule для downstream sharing этого invariant.
- Если choice window недоступно, expected behavior — остановиться и спросить в чате.
- Если пользователь говорит “все проекты”, Codex всё равно показывает список и ждёт подтверждения exact set.

Ограничения:
- Не менять `scripts/rule-share.mjs` в этой задаче: требование относится к skill/agent behavior.
- Не менять local ignored `runtime/rule-share/config.json` и не трогать downstream проекты.
- Не ослаблять existing allowlist, dirty-project blocker, manual-review path, apply-plan dry-run и stop-before-publish gates.

## Eval spec

Agent surface: интерактивный запуск `$starter-rule-share` и guarded one-run prompts.

Хороший ответ:
- читает charter/governance;
- делает project selection gate первым owner-facing шагом;
- показывает полный список кандидатов с рекомендациями include/exclude/blocked/source-only;
- если UI choice tool недоступен, задаёт вопрос в чате и останавливается;
- не запускает `rule-share:scan`, `rule-share:apply-plan` или downstream `task:start` до подтверждения exact project set.

Провал:
- запускает scan/apply-plan/task:start до выбора проектов;
- трактует “all ready projects” как approval без списка;
- включает проект, который owner исключил;
- использует прошлый approval JSON или standing approval как текущую interactive approval без подтверждения.

Критичные edge cases:
- user пишет “по всем проектам”, но есть excluded/dirty/source-only проекты;
- choice window unavailable;
- standing approval есть в ignored config;
- scan меняет статус проекта после выбора;
- owner называет root folder с большим количеством Git-проектов.

Regression examples / golden prompts:
- `давай теперь расшарим правила по всем проектам [$starter-rule-share] только надо каждый раз при запуске скилла вызывать окно для выбора проекта для расшаривания`
- `Agent_Personal надо исключить, выдай полный список на утверждение`
- `Food-consierge исключен, SuperPos исключен, Agent_Personal исключен - все остальные если не dirty - делаем`

Способ сравнения old vs new behavior:
- Old behavior мог перейти к apply-plan/task:start после scan без явного current-run project set.
- New behavior должен остановиться на project selection gate и продолжить только после exact owner confirmation.

Minimum pass threshold:
- 5/5 manual rubric checks pass: selection first, complete candidate list, explicit include/exclude, no previous approval reuse, no scan/apply-plan/task:start before confirmation.

Eval result:
- PASS manual rubric, 5/5.
- Selection first: PASS.
- Complete candidate list requirement: PASS.
- Explicit include/exclude requirement: PASS.
- No previous approval reuse: PASS.
- No scan/apply-plan/task:start before confirmation: PASS.

## План для агента

1. Обновить `skills/starter-rule-share/SKILL.md`.
2. Синхронизировать invariant в canonical governance и owner-facing docs.
3. Добавить reusable registry rule.
4. Запустить lint/QA и manual eval rubric.

## QA

Automated checks:
- PASS: `npm run lint`
- PASS: targeted registry JSON parse
- PASS: `npm run task:qa:agent`

Manual eval:
- PASS: golden prompts require project selection gate before scan/apply-plan/task:start and stop with a chat question when choice UI is unavailable.

TRIZ:
- Trigger: `cross_module_conflict`, `historical_recurrence`.
- Applied: separation by stage and preliminary action. Project selection is now a separate first owner-facing gate before deterministic rule-share execution.

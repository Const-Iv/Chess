# TRIZ Usage Log

Журнал срабатываний TRIZ-триггеров и применённых решений.

## 2026-04-24T09:22:54.300Z 20260424-091736-6c73 — TRIZ_APPLIED

- Principle: separation in space / mediator
- Changes: skills source ownership is separated from local Codex activation through `--source <skills-root>`, so downstream repos can pin starter as `vendor/new-project-starter` while `$CODEX_HOME/skills` keeps symlink activation.
- Guard: `tests/unit/skills-manager.test.mjs` covers linking from a submodule source path.

## 2026-04-29T08:41:36.205Z 20260429-083348-74bc

- Branch: `codex/20260429-083348-74bc-agent-const`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-04-29T08:42:00.000Z 20260429-083348-74bc — TRIZ_APPLIED

- Principle: separation in space / mediator
- Changes: Agent_Const product-charter approach is moved into starter as a reusable charter pattern and gate, while starter keeps its own baseline mission and explicitly requires downstream projects to replace or extend the charter with product-specific content through adapters/profiles instead of hardcoding it into core governance.
- Guard: `rg` parity checks verify that old `Summary -> JTBD` rules are gone from canonical docs and that `product-charter` / `Миссия -> Видение -> Цель -> JTBD` are present across `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`, mirrors, plan template, blueprint, and README; `npm run qa:agent` and `npm run task:qa:agent` passed.

## 2026-04-29T09:21:19.197Z 20260429-083348-74bc

- Branch: `codex/20260429-083348-74bc-agent-const`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-04-29T09:22:00.000Z 20260429-083348-74bc — TRIZ_APPLIED

- Principle: preliminary action / mediator
- Changes: cross-project rule discovery is separated from rule application through `rule-sync:scan`, `rule-sync:report`, and `rule-sync:apply-plan --dry-run`; scan/report can run on a schedule, while actual source edits still require owner approval, managed worktree, plan file, and QA.
- Guard: `tests/unit/rule-sync.test.mjs` covers discovery, reusable/product-specific classification, report rendering, and safe apply-plan seed generation; `tests/coverage-critical.manifest.json` tracks `scripts/rule-sync.mjs` as critical coverage.

## 2026-04-29T10:14:24.619Z 20260429-083348-74bc

- Branch: `codex/20260429-083348-74bc-agent-const`
- Reasons: historical_recurrence
- Status: trigger recorded

## 2026-04-29T16:26:17.873Z 20260429-162316-4a71

- Branch: `codex/20260429-162316-4a71-teach-starter-rule-share-downstream-import-evidence`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-04-29T16:27:00.000Z 20260429-162316-4a71 — TRIZ_APPLIED

- Principle: preliminary action / standard interface / separation by stage.
- Changes: `rule-share:apply-plan` now puts the copied-baseline import checklist into the generated downstream task seed instead of relying on the operator to remember manual follow-up steps. The skill keeps implementation in a downstream managed worktree, requires canonical/mirror parity and QA/TRIZ evidence, and explicitly stops before finish/merge/publish unless that stage was separately approved.
- Guard: `tests/unit/rule-share.test.mjs` covers the copied-baseline seed content, including evidence docs, canonical/mirror surfaces, `TRIZ_APPLIED` and stop-before-publish wording; `npm run qa:agent` and `npm run task:qa:agent` passed.

## 2026-04-29T16:27:50.253Z 20260429-162316-4a71

- Branch: `codex/20260429-162316-4a71-teach-starter-rule-share-downstream-import-evidence`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-04-30T07:51:12.145Z 20260429-162316-4a71

- Branch: `codex/20260429-162316-4a71-teach-starter-rule-share-downstream-import-evidence`
- Reasons: historical_recurrence
- Status: trigger recorded

## 2026-04-30T08:18:00.993Z 20260429-162316-4a71

- Branch: `codex/20260429-162316-4a71-teach-starter-rule-share-downstream-import-evidence`
- Reasons: historical_recurrence
- Status: trigger recorded

## 2026-04-30T08:35:50.121Z 20260430-082858-2709

- Branch: `codex/20260430-082858-2709-require-exact-cleanup-verification-in-worktree-finish`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-05-05T14:21:07.376Z 20260505-082304-ffc7

- Branch: `codex/20260505-082304-ffc7-readable-rule-sync-report`
- Reasons: historical_recurrence
- Status: trigger recorded

## 2026-05-05T17:11:43.039Z 20260505-170240-5c0b

- Branch: `codex/20260505-170240-5c0b-self-check-manual-rule-review-in-reports`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-05-05T17:12:30.000Z 20260505-170240-5c0b — TRIZ_APPLIED

- Principle: preliminary action / mediator / separation by stage.
- Changes: read-only source/target inspection is moved before owner decision in both `starter-rule-report` and `starter-rule-share`: reports now require Codex self-check for ambiguous items, while owner approval remains the separate gate for import/share and true blockers such as dirty projects.
- Guard: `tests/unit/rule-sync.test.mjs` verifies the self-check wording in nightly rule-sync reports; `tests/unit/rule-share.test.mjs` verifies rule-share blockedRules show Codex self-check instead of owner homework; `npm run qa:agent` and `npm run task:qa:agent` passed.

## 2026-05-05T17:13:41.609Z 20260505-170240-5c0b

- Branch: `codex/20260505-170240-5c0b-self-check-manual-rule-review-in-reports`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-05-05T17:14:10.000Z 20260505-170240-5c0b — TRIZ_APPLIED

- Principle: preliminary action / mediator / separation by stage.
- Changes: final task QA repeated the same trigger after verification; the selected solution remains the same: Codex performs read-only self-check before owner approval, while deterministic scripts keep ambiguous rules out of automatic imports.
- Guard: final `npm run qa:agent` and `npm run task:qa:agent` passed; no additional code path was introduced after the TRIZ decision.

## 2026-05-06T10:34:09.645Z 20260506-102928-f734

- Branch: `codex/20260506-102928-f734-restore-assist-product-sources`
- Reasons: historical_recurrence
- Status: trigger recorded

## 2026-05-04T11:44:20.730Z 20260504-084634-8208

- Branch: `codex/20260504-084634-8208-bootstrap-downstream-`
- Reasons: historical_recurrence
- Status: trigger recorded

## 2026-05-08T11:16:59.866Z 20260508-095622-21ac

- Branch: `codex/20260508-095622-21ac-starter-rule-sync-import`
- Reasons: historical_recurrence
- Status: trigger recorded

## 2026-05-08T11:59:12.768Z 20260508-114808-92af

- Branch: `codex/20260508-114808-92af-share-starter-rules-with-assist`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-05-08T12:00:39.969Z 20260508-114808-92af — TRIZ_APPLIED

- Branch: `codex/20260508-114808-92af-share-starter-rules-with-assist`
- Reasons: cross_module_conflict, historical_recurrence
- Противоречие: нужно быстро разнести reusable starter governance в несколько downstream-проектов, но нельзя превращать это в bulk-copy, затирать product charter wording или импортировать manual-review rules.
- ИКР: каждый проект получает только утверждённые missing rules в своём managed task worktree; product-specific документы и runtime state сохраняются, а manual-review/blocked rules остаются вне автоматического импорта.
- Подходы: segmentation / separation by project and rule status; preliminary action через owner-approved target list и dry-run task seed; standard interface через downstream `task:start`, registry dedupe и deterministic QA.
- Что устранено: риск повторить ошибку слепого выбора проектов и риск governance drift, где правило появляется только в одном mirror-файле или дублируется вместо registry-aware импорта.
- Guard: `npm run lint`, targeted rule import guard и `npm run task:qa:agent` прошли; excluded/dirty projects не изменялись.

## 2026-05-08T12:07:50.903Z 20260508-120257-87d1

- Branch: `codex/20260508-120257-87d1-require-rule-share-project-selection-first`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-05-08T12:08:30.000Z 20260508-120257-87d1 — TRIZ_APPLIED

- Branch: `codex/20260508-120257-87d1-require-rule-share-project-selection-first`
- Reasons: cross_module_conflict, historical_recurrence
- Противоречие: нужно сохранить быстрый guarded one-run для outbound sharing, но нельзя снова допустить перенос правил в проекты без явного текущего выбора владельца.
- ИКР: выбор проектов становится отдельным первым owner-facing gate; deterministic scan/apply-plan/task-start остаются прежними execution layers и запускаются только после exact confirmation.
- Подходы: separation by stage, preliminary action, standard interface. Выбор проектов отделён от scan/report и approval JSON, а отсутствие UI-окна переводит flow в stop-and-ask вместо silent fallback.
- Что устранено: риск молчаливой трактовки “all ready projects”, повторного использования старого approval JSON и запуска downstream task worktrees без подтверждённого include/exclude set.
- Guard: `skills/starter-rule-share/SKILL.md`, canonical governance, registry rule and plan Eval spec updated; `npm run task:qa:agent` passed.

## 2026-05-08T12:08:53.797Z 20260508-120257-87d1

- Branch: `codex/20260508-120257-87d1-require-rule-share-project-selection-first`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-05-08T12:09:10.000Z 20260508-120257-87d1 — TRIZ_APPLIED

- Branch: `codex/20260508-120257-87d1-require-rule-share-project-selection-first`
- Reasons: cross_module_conflict, historical_recurrence
- Status: final task QA repeated the same trigger after the TRIZ decision above; no additional solution was introduced.
- Guard: the selected solution remains the project selection gate before rule-share execution, and final `npm run task:qa:agent` passed.

## 2026-05-09T20:33:40.922Z 20260509-172330-ce2e

- Branch: `codex/20260509-172330-ce2e-prilozhenie`
- Reasons: cross_module_conflict
- Status: trigger recorded

## 2026-05-09T20:33:59.000Z 20260509-172330-ce2e — TRIZ_APPLIED

- Branch: `codex/20260509-172330-ce2e-prilozhenie`
- Reasons: cross_module_conflict
- Противоречие: нужно быстро использовать Vercel preview/production для личного доступа к тренажеру, но нельзя ослабить production gate и случайно опубликовать секреты, личные данные или неподтвержденный шахматный контент.
- ИКР: branch push может дать preview для просмотра, а production обновляется только из GitHub `main` после managed task/merge flow, deterministic QA and security gate.
- Подходы: separation by stage; preliminary action; standard interface. Preview отделен от production, security gate перенесен в canonical `task:merge:main`, а ручной `vercel --prod` оставлен только как explicit owner-approved one-off path.
- Что устранено: риск governance-only правила без исполнения в скрипте, риск обхода `qa:security` перед Vercel production update and риск считать preview заменой task QA.
- Guard: targeted `merge-main-from-main` integration test passed; `npm run task:qa:agent` passed before final finish/merge.

## 2026-05-09T20:34:30.000Z 20260509-172330-ce2e — TRIZ_APPLIED

- Branch: `codex/20260509-172330-ce2e-prilozhenie`
- Reasons: cross_module_conflict
- Status: final task QA repeated the same trigger after the TRIZ decision above; no additional solution was introduced.
- Guard: selected solution remains stage-separated preview/production with `qa:security` inside `task:merge:main`; repeated `npm run task:qa:agent` passed.

## 2026-05-09T20:34:52.538Z 20260509-172330-ce2e

- Branch: `codex/20260509-172330-ce2e-prilozhenie`
- Reasons: cross_module_conflict
- Status: trigger recorded

## 2026-05-09T20:38:53.772Z 20260509-172330-ce2e

- Branch: `codex/20260509-172330-ce2e-prilozhenie`
- Reasons: cross_module_conflict
- Status: trigger recorded

## 2026-05-09T20:39:15.000Z 20260509-172330-ce2e — TRIZ_APPLIED

- Branch: `codex/20260509-172330-ce2e-prilozhenie`
- Reasons: cross_module_conflict
- Противоречие: нужно быстро использовать Vercel preview/production для личного доступа к тренажеру, но нельзя ослабить production gate, оставить `main` грязным после publish-stage sync или случайно опубликовать секреты, личные данные и неподтвержденный шахматный контент.
- ИКР: branch push дает только preview для просмотра, production обновляется из GitHub `main` после managed task/merge flow, а publish-stage сам подхватывает security gate and generated operational archives before push.
- Подходы: separation by stage; preliminary action; standard interface. Preview отделен от production, `qa:security` встроен в canonical `task:merge:main`, generated `Docs/archive/*.md.gz` попадает в publish-stage auto-commit.
- Что устранено: риск governance-only правила без исполнения в скрипте, риск обхода `qa:security` перед Vercel production update, риск считать preview заменой task QA and риск оставить `main` грязным generated archive после publish-stage sync.
- Guard: targeted `merge-main-from-main` integration test passed; repeated `npm run task:qa:agent` passed before final finish/merge retry.

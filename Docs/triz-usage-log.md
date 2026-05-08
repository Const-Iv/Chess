# TRIZ Usage Log

Журнал срабатываний TRIZ-триггеров и применённых решений.

## `<YYYY-MM-DD HH:MM:SS>` — TRIZ_TRIGGER

- Reason: `<qa_repeat_stage|qa_chunk_exhausted|cross_module_conflict|historical_recurrence>`
- Details: `<json or concise structured summary>`

## `<YYYY-MM-DD HH:MM:SS>` — TRIZ_APPLIED

- Principle: `<chosen principle or structural move>`
- Changes: `<what changed>`
- Guard: `<what reusable guard was added>`

## 2026-04-22T12:52:38.438Z 20260422-123751-07b0

- Branch: `codex/20260422-123751-07b0-agent-const-plan-template-sync`
- Reasons: historical_recurrence
- Status: trigger recorded

## 2026-04-23T12:19:01.968Z 20260423-105805-90fc

- Branch: `codex/20260423-105805-90fc-finish-cleanup-contract`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-04-23T12:28:18.299Z 20260423-105805-90fc

- Branch: `codex/20260423-105805-90fc-finish-cleanup-contract`
- Reasons: cross_module_conflict, historical_recurrence
- Status: trigger recorded

## 2026-04-24T09:22:26.456Z 20260424-091736-6c73

- Branch: `codex/20260424-091736-6c73-submodule-shared-skills`
- Reasons: cross_module_conflict
- Status: trigger recorded

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

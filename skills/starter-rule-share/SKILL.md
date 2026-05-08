---
name: starter-rule-share
description: Primary project-local skill for sharing the current approved new-project-starter governance baseline outward to owner-approved active downstream projects. Use after starter-rule-import has imported and verified reusable rules in New Project Starter, when Codex needs to propose target projects, require owner approval, run guarded one-run sharing when explicitly requested, and prepare or execute approval-safe per-project task updates without overwriting downstream product-specific governance.
---

# starter-rule-share

Use this skill after `new-project-starter` has received approved reusable rules and passed deterministic QA. The skill shares the updated baseline outward only to owner-approved active projects. Rule-level sharing is driven by `.memory-bank/starter-rule-registry.json`: every reusable rule must have a stable id, exact text, target files, required fragments, source traceability, and share policy. The skill must never bulk-copy rules into every local repository and must never overwrite downstream product-specific charter, adapters, profiles, private notes, or local state.

Charter fit: outbound sharing supports the mission and JTBD by letting active downstream projects receive the latest reusable operational baseline without rebuilding governance by hand. Keep downstream product specificity in the downstream project.

## Workflow

1. Read `.memory-bank/product-charter.md`, `AGENTS.md`, `.memory-bank/index.md`, and `.memory-bank/code-rules.md`.
2. Project selection gate is the first owner-facing step and must run before `rule-share:scan`, `rule-share:report`, `rule-share:apply-plan`, downstream `task:start`, or one-run execution:
   - present the complete discovered candidate list from `runtime/rule-share/config.json` roots/allowlist and any owner-named root such as `/Users/.../!AI`;
   - show each project with a plain recommendation: include, exclude, blocked because dirty, blocked because not starter-based, or source project only;
   - ask the owner to approve the exact include/exclude set for the current run;
   - use an available choice window when the environment supports it; if it is unavailable, ask in chat and stop until the owner answers;
   - never infer that “all ready projects” are approved, and never treat a previous approval JSON or standing approval as current-run confirmation in an interactive session.
3. Confirm the starter import is actually ready:
   - starter working tree is clean;
   - the rule-sync import task passed deterministic QA;
   - the rules being shared are reusable starter baseline rules, not product-specific source-project details.
   - `.memory-bank/starter-rule-registry.json` contains the approved reusable rules that should be checked downstream.
4. Ensure local target-project config exists in ignored `runtime/rule-share/config.json` and reflects the owner-approved project set for this run:
   ```json
   {
     "roots": ["/path/to/project-root-folder"],
     "allowlist": ["/path/to/active-project"],
     "ignorelist": ["/path/to/old-or-paused-project"],
     "starterPath": "vendor/new-project-starter"
   }
   ```
   Keep this file uncommitted. It may contain personal local paths.
5. Run or inspect the latest rule-share scan only after the project selection gate is satisfied:
   - `npm run rule-share:scan`
   - `npm run rule-share:report -- --latest`
6. Present the owner report in this order:
   - `Предложения к проектам`
   - `Готово к обновлению`
   - `Актуально`
   - `Требует ручной проверки`
   - `Заблокировано`
   - `Диагностика`
   For every project, show concrete rule groups:
   - `Есть в проекте`: rule id or current starter reference proves the rule is already present.
   - `Есть текстом, но не зарегистрировано`: exact text or required fragments are already present; do not duplicate them.
   - `Будет добавлено`: exact missing rule text that can be imported automatically.
   - `Требует ручной проверки`: similar or manual-review rules that must not be auto-imported.
   For `Требует ручной проверки`, do not hand the search work to the owner. Codex must first inspect the target project read-only when possible, then report a concrete recommendation: already covered, add as written, add with adaptation, skip, or blocked. Owner action is only to approve that recommendation or clear a real blocker such as dirty tree / missing starter signals.
7. Reconfirm the final target project list before apply-plan if the scan/report changed any status from the owner-approved set. Use project ids only as traceability after the project names and recommended actions are clear.
8. After explicit approval, write an ignored approval JSON such as `runtime/rule-share/approvals/<date>-approval.json`:
   ```json
   {
     "approvedProjects": ["rsh-project-id"],
     "notes": {
       "rsh-project-id": "Preserve local product charter wording."
     }
   }
   ```
9. Prepare outbound tasks with:
   - `npm run rule-share:apply-plan -- --approval <path> --dry-run`
10. For each returned project task seed:
   - run the target project's managed `task:start` from that project's root;
   - apply the appropriate update inside the target task worktree;
   - run the target project's deterministic QA;
   - stop before finish/merge/publish unless the owner explicitly requested that stage.

## One-Run Mode

Use one-run mode only when the owner explicitly asks for automatic sharing in the current request, or when ignored local config contains standing approval for the selected projects. One-run mode reduces chat turns; it does not bypass safety gates or the project selection gate.

Allowed standing approval shape in `runtime/rule-share/config.json`:

```json
{
  "autoShare": {
    "enabled": true,
    "approvedProjects": ["Agent_Const"],
    "readyOnly": true,
    "stopBeforePublish": true
  }
}
```

When one-run mode is active:

1. Run the project selection gate first. If the current request or `autoShare.approvedProjects` names projects, treat them only as the proposed selection, show the include/exclude set, and require confirmation in interactive sessions before continuing.
2. Run `npm run rule-share:scan` and `npm run rule-share:report -- --latest`.
3. Select only `ready` projects that are both in the allowlist and explicitly approved by the confirmed current-run selection.
4. Skip `manual_review`, `blocked`, dirty, archived, paused, or unclear projects and report the reason.
5. Write ignored approval JSON for the selected ready projects.
6. Run `npm run rule-share:apply-plan -- --approval <path> --dry-run`.
7. For each returned task seed, run the target project's managed `task:start`.
8. In each target task worktree, apply only reusable baseline updates:
   - for `update_starter_reference`, update `vendor/new-project-starter` to the approved starter HEAD and check shared skills;
   - for `prepare_rule_import`, import only the `missingRules` from the task seed; preserve downstream product charter wording, adapters, profiles and local rules.
   - if a rule is `presentUnregistered`, do not duplicate its text; only register it as applied if the downstream project maintains a rule registry and this is part of the approved task.
   - for copied-baseline imports, sync the reusable rule across downstream canonical and mirror surfaces when relevant: `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`, `README.md`, `.cursorrules`, and `CLAUDE.md`.
   - record downstream evidence in `Docs/qa-implementation-log.md` and `Docs/triz-usage-log.md` when TRIZ triggers. Evidence must include starter source, starter HEAD, approved project, imported reusable rules, skipped product-specific areas, changed canonical files, deterministic QA result and any TRIZ decision.
9. Run the target project's deterministic QA and record evidence in the target plan or response.
10. Stop before finish/merge/publish unless the owner explicitly requested that stage and the target project has PASS QA plus its normal cleanup/publish approvals.

If any target becomes ambiguous during import, stop that target and continue only with other ready targets. The final response must list `updated`, `skipped`, `blocked`, QA status, and the target worktree paths.

## Delivery Modes

- `update_starter_reference`: for projects that keep starter under `vendor/new-project-starter`; update that versioned reference and check shared skills.
- `prepare_rule_import`: for copied starter-baseline projects; import only registry `missingRules` with surgical diffs, including downstream canonical/mirror parity and QA/TRIZ evidence capture.
- `manual_review`: for projects without a clean managed task flow, without complete starter baseline signals, or with conflicts requiring owner judgment.

## Rule Registry Contract

Canonical registry path: `.memory-bank/starter-rule-registry.json`.

Each entry must include:

- `id`: stable id for dedupe across projects.
- `title`: short human-readable rule name.
- `text`: exact text to import when the rule is missing.
- `targetFiles`: downstream files where the rule may need to be present.
- `requiredFragments`: key fragments used when exact text changed slightly.
- `source`: traceability for owner review, such as candidate ids or existing governance source.
- `sharePolicy`: `required` for automatic missing-rule import, `manual_review` for rules that must be shown but not auto-applied.

Scanner behavior:

- Registry id found downstream -> `presentRules`.
- Exact text or all required fragments found, but no downstream registry id -> `presentUnregisteredRules`.
- No reliable match and `sharePolicy = required` -> `missingRules`.
- Partial match or `sharePolicy = manual_review` -> `blockedRules`.

Do not put starter mission, starter vision, starter product charter text, local machine paths, source-project names, private notes, or provider-specific defaults into registry rule text.

## Copied-Baseline Import Checklist

For `prepare_rule_import`, the task seed from `rule-share:apply-plan` is the implementation contract. Do not treat it as a reminder to do a manual ad-hoc sync.

Required actions inside the downstream managed worktree:

1. Read the downstream product charter first and preserve its wording.
2. Use the task seed `Missing rules to import` section as the exact import contract.
3. Import only those missing reusable baseline rules; do not duplicate `presentRules` or `presentUnregisteredRules`.
4. Do not copy product-specific starter text over downstream product decisions.
5. Keep mandatory rules in parity across `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`, `README.md`, `.cursorrules`, and `CLAUDE.md` when those surfaces exist.
6. Record evidence in downstream operational docs:
   - starter source and HEAD;
   - approved target project;
   - imported reusable rules;
   - skipped product-specific areas;
   - changed canonical files;
   - deterministic QA result;
   - TRIZ trigger/decision when applicable.
7. Run downstream deterministic QA after the final diff.
8. Stop with a clear status report and target worktree path. Finish/merge/publish is a separate explicit owner gate.

## Manual Review Path

Treat a project as starter-connected only when one of these signals is present:

- Versioned starter reference exists under `vendor/new-project-starter`.
- Copied-baseline signals exist: `AGENTS.md`, `.memory-bank/product-charter.md`, `CODEX_MEMORY.md`, and managed `task:start`.

For a partially connected project, explain which signals are missing. Example: a project with `task:start`, `AGENTS.md`, and `CODEX_MEMORY.md`, but no `.memory-bank/product-charter.md` and no `vendor/new-project-starter`, is not ready for outbound sharing because Codex cannot distinguish reusable baseline rules from downstream product-specific governance.

For rule-level partial matches inside an otherwise ready project, Codex performs the manual review itself before asking the owner:

- read the target files and nearby governance surfaces read-only;
- decide whether the starter rule is already covered, missing, partially covered, or unsafe to import;
- if already covered, mark it as do-not-duplicate;
- if missing, provide the exact text to import;
- if partially covered, provide the adapted text and explain what changes;
- if blocked, name the concrete blocker and the owner action needed to unblock.

Recommended safe paths:

- If the project should become starter-based, create a managed task in that project to complete its Project Intake and add a downstream-specific `.memory-bank/product-charter.md` before importing reusable baseline rules.
- If the project should track starter as a versioned baseline, add `vendor/new-project-starter` in a managed task, then link shared skills and run the target project's deterministic QA.
- If the project is archived, paused, dirty, lacks managed task flow, or has unresolved product/governance conflicts, keep it in `Требует ручной проверки` or `Заблокировано`.

Never turn manual review into direct copy. After the missing signals are fixed and QA passes in the downstream project, rerun `npm run rule-share:scan` and present a new owner report.

## Safety Rules

- Never share to projects outside `runtime/rule-share/config.json` allowlist.
- Never start `rule-share:scan`, `rule-share:apply-plan`, downstream `task:start`, or one-run execution before the current-run project selection gate is satisfied.
- Never apply outbound changes directly from starter into downstream source files.
- Never edit dirty downstream projects; ask for cleanup/commit/stash in that project first.
- Never overwrite downstream product charter or product-specific instructions.
- Never copy `.system`, plugin-managed, generated skill trees, credentials, runtime state, or private local files.
- Treat `rule-share:apply-plan` output as preparation, not implementation. Real downstream edits still require the target project's managed worktree and QA.
- In one-run mode, the skill may execute those downstream managed task updates automatically, but never directly in the downstream main worktree.
- If a project is archived, paused, unclear, or not starter-based, leave it in `Требует ручной проверки` or `Заблокировано`.

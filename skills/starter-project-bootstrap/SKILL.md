---
name: starter-project-bootstrap
description: Guided bootstrap for a new downstream project after copying or connecting new-project-starter. Use when the user says "стартуем новый проект", "запусти новый проект", "проведи bootstrap нового проекта", says they copied this starter into a new repository, or asks Codex to walk them through initial Project Intake, canonical source setup, dependency setup, shared skills, and baseline QA before feature work.
---

# Starter Project Bootstrap

Use this skill as the primary conversational workflow for starting a new downstream project from `new-project-starter`. The skill exists to make the starter's mission practical: after the baseline is copied or connected, the owner can say `стартуем новый проект` and Codex will guide the bootstrap without skipping Project Intake, source-of-truth setup, or deterministic QA.

Charter fit: bootstrap must preserve the starter as a portable operating baseline. Product-specific choices belong in the downstream Project Intake, adapters, or profiles; never turn them into starter core defaults.

## Trigger Phrases

Use this skill for:

- `стартуем новый проект`
- `запусти новый проект`
- `проведи bootstrap нового проекта`
- `я скопировал starter в новый репозиторий`
- `помоги начать проект от starter`
- equivalent English prompts such as `bootstrap a new project from this starter`

## Required Reads

At the start of the workflow, read:

1. `.memory-bank/product-charter.md`
2. `.memory-bank/index.md`
3. `plans/_project_intake_template.md`
4. `AGENTS.md`
5. `CODEX_MEMORY.md`

Then read only the relevant memory files from the routing matrix, usually `.memory-bank/project-context.md`, `.memory-bank/code-rules.md`, `.memory-bank/architecture-map.md`, and `.memory-bank/qa-playbook.md`.

## Bootstrap State Detection

Before changing files:

1. Check the current branch and working tree status.
2. Check whether dependencies are installed enough to run repo scripts.
3. Look for existing non-template Project Intake files in `plans/`.
4. Check whether `.memory-bank/product-charter.md`, `.memory-bank/project-context.md`, `.memory-bank/architecture-map.md`, `.memory-bank/code-rules.md`, `AGENTS.md`, `CODEX_MEMORY.md`, and `README.md` still contain starter-generic wording or already contain downstream-specific answers.

Classify the state:

- `fresh-copy`: only the template exists or no approved intake is present.
- `intake-in-progress`: a Project Intake exists but has blockers, placeholders, or waiting approval.
- `intake-approved`: every mandatory applicable item is explicitly approved, but canonical sources are not fully updated.
- `canonical-ready`: approved answers are already transferred into canonical sources.
- `qa-ready`: canonical sources are updated and dependencies are installed.

## Skill Availability Bootstrap

For a copied starter repository, the skill folder exists under `skills/`, but Codex may not have it linked in `$CODEX_HOME/skills` yet. When the user triggers bootstrap with `стартуем новый проект` or a similar phrase, make skill linking an automatic early step:

1. If repo dependencies are not installed and `package.json` exists, run `npm ci`.
2. Run `npm run skills:link` from the new project root to connect repo-managed skills, including `starter-project-bootstrap`.
3. If `skills:link` fails because target skills already exist or are unmanaged, stop and show the exact conflicting target skill paths. Ask a separate approval question for `npm run skills:link -- --adopt`; do not combine it with worktree approval. Do not run `--adopt` without explicit owner approval, because adopt moves existing local skill folders into backup-managed paths.
4. If the project uses starter as a submodule, run `git submodule update --init --recursive` and then `node vendor/new-project-starter/scripts/skills-manage.mjs link --source vendor/new-project-starter/skills`.
5. After linking succeeds, continue the Project Intake workflow.

## Bootstrap Worktree Rule

The user command `стартуем новый проект` is enough approval to create a managed bootstrap worktree when all of these are true:

- the repository is on `main`;
- the working tree is clean;
- the repo exposes the canonical `task:start` entrypoint.

In that case, start the managed bootstrap worktree automatically with a clear title such as `Bootstrap new project`, then continue the workflow in that worktree. Do not ask the owner to write a combined confirmation such as "create worktree and adopt skills".

Stop instead of auto-starting when the repo is dirty, the task conveyor is unavailable, or the owner explicitly asks for direct-main bootstrap. Direct-main edits still require explicit owner approval.

## Main Workflow

1. Start with a short charter anchor in Russian:
   - The starter's job is to give a portable operational baseline.
   - A downstream project must define its own mission, audience, JTBD, constraints, and capability choices before feature work.
2. Explain the current bootstrap state and the next safe step in plain language.
3. If the repo is on clean `main`, create a managed bootstrap worktree automatically using the rule above before editing files.
4. Ensure repo-managed skills are linked using the safe flow above, unless this was already done in the current bootstrap session.
5. If there is no approved Project Intake, create or continue an intake file from `plans/_project_intake_template.md`.
6. Ask for missing intake information in small batches. Prefer one high-impact question at a time when answers materially affect safety or scope.
7. Mark every required intake item as `Согласовано` or `Заблокировано`. `TBD`, placeholders, and "заполним потом" remain blockers.
8. For capability decisions, first ask whether each block is applicable. If applicable, record owner-approved invariants before implementation in that area.
9. If the project is still validating a hypothesis, do not treat architecture, technologies, launch method, commercial model, ownership zones, or major product capabilities as approved until they are explicitly agreed in Project Intake, product charter, or roadmap.
10. If the project depends on an unknown root technology, integration, provider, runtime, agent surface, bot/channel, worker, or external API, require isolated echo-test evidence or a recorded blocker before feature/refactor/behavior-change work in that area.
11. Capture the owner-approved integration/review path in Project Intake: managed task conveyor, Pull Request review, or hybrid; Pull Request review must not bypass deterministic QA, source-of-truth governance, or finish/merge gates.
12. If the project needs actions after publishing, such as restarting local agents or services, capture the owner-approved method in Project Intake; do not turn local commands or environment settings into starter core behavior.
13. After owner approval, transfer answers into canonical sources.
14. Run baseline QA and report evidence.
15. Only after QA passes, say the downstream project is ready for feature/refactor/behavior-change tasks.

## Project Intake Order

Collect and approve in this order:

1. Mission
2. Vision
3. Project goal
4. Target audience
5. JTBD
6. Hypothesis status and approved decisions
7. Product constraints
8. Usage scenarios
9. Success metrics
10. Source-of-truth files
11. Core / adapters / profiles boundary
12. Stack / runtime choices
13. Echo-testing / root capability check, only if unknown root technology exists
14. Integration / review path
15. QA / release choices
16. Agent / eval choices
17. Memory / rules ownership
18. Capability decisions, only if applicable:
    - auth / user identity
    - payments / billing
    - credits / limits
    - analytics / consent
    - i18n / localization
    - async jobs / workers
    - API documentation
    - service layout
    - runtime-specific rules
    - post-publish local actions, such as restarting local agents or services

## Canonical Transfer

After intake approval, update these files as applicable:

- `AGENTS.md`
- `.memory-bank/product-charter.md`
- `.memory-bank/project-context.md`
- `.memory-bank/architecture-map.md`
- `.memory-bank/code-rules.md`
- `.memory-bank/qa-playbook.md`
- `CODEX_MEMORY.md`
- `README.md`
- compatibility mirrors such as `.cursorrules` and `CLAUDE.md`, if present

Do not leave mandatory bootstrap rules only in mirrors.

## Dependency, Skills, and QA Path

Use the repo commands when available:

```bash
npm ci
npm run skills:link
npm run qa:agent
npm run qa:smoke:pr
npm run qa:e2e:nightly
npm run qa:security
npm run qa:coverage:critical
npm run qa:perf:critical
```

If the project uses starter as a submodule for shared skills, use:

```bash
git submodule update --init --recursive
node vendor/new-project-starter/scripts/skills-manage.mjs link --source vendor/new-project-starter/skills
```

Run the closest deterministic subset if the full baseline is blocked, and record the blocker plainly.

## Response Shape

For owner-facing updates, use this order:

1. `Связь с charter проекта`
2. `Текущее состояние bootstrap`
3. `Следующий безопасный шаг`
4. `Что нужно от owner`
5. `Проверки`

Keep the language product-facing and practical. Use technical details only when they help the owner make or verify a decision.

## Stop Gates

Stop and ask for owner input when:

- mission, vision, goal, audience, or JTBD cannot be safely inferred;
- a required intake item is still placeholder or `TBD`;
- an unknown root technology exists but echo-test evidence is missing and no blocker/alternative has been owner-approved;
- a capability is applicable but lacks security-sensitive invariants;
- `skills:link` reports unmanaged target conflicts and `--adopt` would be needed;
- the user asks for feature/refactor/behavior-change work before intake approval;
- the repo is dirty and a managed worktree cannot be safely started;
- direct-main edits would be required and the owner has not explicitly approved them.

## Prohibited Behavior

- Do not start product feature work before Project Intake is approved.
- Do not hardcode stack, provider, locale, billing, auth, queue, or worker choices into starter core.
- Do not convert examples into mandatory downstream rules.
- Do not bulk-copy `.system`, plugin-managed, product-specific, or generated skill trees.
- Do not claim QA is complete without deterministic evidence.

## Shared Starter Baseline Rules

- `starter.project-intake.integration-review-path`: Integration / review path в Project Intake фиксирует, как изменения попадают в основной проект: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.

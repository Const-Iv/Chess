---
name: worktree-create
description: Create task-specific git worktrees and branches by discovering and following the current repository's canonical start contract. Use when a user asks to create a new worktree, start a task in an isolated branch, bootstrap a managed task branch, or open a repo-specific task workspace. Prefer this skill when the repository documents start flows in AGENTS.md, CODEX_MEMORY.md, .memory-bank/*, package.json scripts, or scripts/README.md.
---

# Worktree Create

Use this skill to start a task worktree in a way that is consistent across projects without hardcoding one repository's conveyor. The repository's own docs and scripts remain the source of truth; this skill standardizes how to discover and execute them.

## Discovery Order

1. Read `AGENTS.md`.
2. Read `CODEX_MEMORY.md` if it exists.
3. Read `.memory-bank/index.md` if it exists, then only the relevant linked memory files.
4. Inspect `package.json`, `scripts/README.md`, and relevant scripts for canonical start commands.
5. Prefer explicit repo entrypoints such as `task:start` over ad-hoc `git worktree add`.

## Start Workflow

1. Resolve the task title and the seed message from the user's request.
2. Check current branch and `git status --short` before any mutation.
3. If the repo blocks dirty-tree starts, stop and report the blocker instead of forcing a bypass. Include files, status, likely origin, relation to the current task, risk, recovery options checked, and your recommended safe path before asking the owner for a decision.
4. Execute the canonical start entrypoint from the repo contract. If it supports auto-opening a Codex chat, leave that enabled unless the user explicitly asks not to.
5. Verify the result by capturing the created branch, worktree path, and any task id or state artifact.
6. Confirm the branch/worktree slug reflects the resolved title; for non-ASCII title expect the repo's deterministic readable ASCII slug, such as `ЭХО` -> `echo`, and treat a generic `task` slug for meaningful text as a regression.
7. Verify Codex chat status honestly. For script-driven starts, trust `openedChat=true` only when the script also reports read-back verification such as `openStatus=verified` for the exact worktree path. If the script reports `openStatus=unverified|failed|skipped`, do not stop at a manual-folder instruction when Codex Desktop thread tools are available:
   - First open/register the exact worktree with the app-native deep link: `open "codex://new?path=<urlencoded-worktreePath>"`. If a seed should be sent and you are not going to use `create_thread`, include `&prompt=<urlencoded-effectiveSeed>` so the composer opens in the right workspace.
   - Then use `tool_search` to load `create_thread` if it is not already available. Call `codex_app.create_thread` with `target.type="project"`, `projectId=<exact worktreePath>`, `environment.type="local"`, and `prompt=<effective seed message>`.
   - Read back the created thread and verify `cwd == <exact worktreePath>` before telling the owner the chat was created. If `create_thread` cannot target the worktree even after the deep link, report the script diagnostics and the manual path honestly.
   - Do not use `codex_app.create_thread` with the source project plus `environment.type="worktree"` after the repo conveyor already created a managed worktree; that creates a second Codex-managed worktree and breaks task-state alignment.
8. Report the result briefly with the exact branch, worktree path, and verified thread id when available. If you successfully created or switched the thread onto a branch/worktree, emit the Codex branch directive for the created worktree in the final response.

## Codex-Managed Fallback

Use this only when discovery finds no repository-owned start entrypoint such as `task:start`.

1. Use a Codex-managed path under `${CODEX_HOME:-$HOME/.codex}/worktrees/<task-id>/<repo-name>-<slug>`.
2. Use a collision-resistant branch name with the `codex/` prefix, preferably `codex/<task-id>-<slug>`.
3. Fetch/prune remotes first when the repo has `origin`, and use `origin/main` as the base when available.
4. Create the worktree with `git worktree add -b "<branch>" "<worktreePath>" "<baseRef>"`.
5. If `codex` is available, run `codex app "<worktreePath>"` as an explicit best-effort open attempt.
6. When Codex Desktop thread tools are available, prefer the app-native deep link plus `codex_app.create_thread` fallback described in the Start Workflow before asking the owner to open the folder manually.
7. Read back Codex thread state when available and only report the chat as opened if a thread with exact `cwd=<worktreePath>` appears. If read-back is unavailable or no matching thread appears, report `openAttempted=true`, `openStatus=unverified`, the attempted command, and the worktree path instead of claiming success.
8. Verify with `git worktree list`, `git status --short --branch` inside the new path, current branch, and short `HEAD`.

Do not default to repo-local `.worktrees/` or `.claude/worktrees/` for Codex work. `.claude` is a Claude-specific generated tree; only use it if the repository contract explicitly requires that exact path.

## Intent Resolution

- If the user explicitly invokes this skill and provides a short phrase next to the skill mention without another clear action verb, treat that phrase as the task title for a new worktree.
- Examples: `[$worktree-create] формат ответа`, `/worktree-create формат ответа`, or `worktree-create: формат ответа` mean create a worktree titled `формат ответа`.
- Do not reinterpret those terse skill-invocation forms as requests for output formatting, documentation, or usage help unless the user explicitly asks for usage instructions, an example response, or how the skill should answer.
- Use the full user message as the seed message, preserving the terse invocation as evidence of the original intent.

## Guardrails

- Do not invent branch naming if the repo already defines it.
- Do not replace a meaningful user title with a generic `task` slug when the repo supports deterministic title-derived slugs.
- Do not bypass dirty-tree guards such as removed `--allow-dirty` flags or similar repo protections.
- Do not replace a documented script-driven conveyor with free-form git commands.
- Do not ask the owner what to do about a blocked start before doing your own blocker analysis and recommending the safest viable path.
- If no canonical start flow exists, say so explicitly before using the Codex-managed fallback.

## Common Triggers

- `создай новый worktree`
- `стартани задачу в отдельной ветке`
- `нужен отдельный ворктри`
- `open a task worktree`
- `[$worktree-create] <task title>`

## Starter Repo Pattern

In repositories derived from the current starter, the common resolution is:

```bash
npm run task:start -- --title "<title>" --seed-message "<full request>"
```

Use that only after confirming it matches the current repo contract. This script creates the worktree under `$CODEX_HOME/worktrees/<taskId>/...`, converts the seed message into the repo's effective Goal Seed by default, and attempts `codex app` unless the user requested `--no-open` or `STARTER_NO_OPEN=1` is set. Raw seed handoff is only for an explicit owner/tooling opt-out through `--no-goal-seed`. `openedChat=true` means read-back verified a Codex thread for the exact worktree `cwd`; a successful `codex app` launch without a matching thread is only `openAttempted` and must be reported as unverified.

If `task:start` reports `openStatus=unverified` in Codex Desktop, recover the user experience in the same turn instead of making the owner hunt for the folder. Use the exact managed `worktreePath` from task state/output, open the `codex://new?path=...` deep link to register/select that workspace, then call `codex_app.create_thread` with that exact path as a local project target. This preserves the repository conveyor as the source of branch/task state while using Codex Desktop's thread API only for the chat handoff.

## Shared Starter Baseline Rules — synced 2026-05-18

- `starter.conveyor.goal-seed-handoff`: Goal Seed является стандартным форматом handoff для новых Codex-чатов, созданных task conveyor. Он выводится из исходного запроса владельца и должен быть самодостаточным plain-text prompt: цель задачи, исходные project source files, `Definition of Done`, зона влияния, safety boundaries, команды проверки, UI browser oracle rules когда релевантно, governance/eval requirements когда релевантно и stop conditions. Goal Seed может начинаться с `/goal`, но не должен зависеть от доступности slash command. `task:start` по умолчанию отправляет в новый чат effective Goal Seed; raw seed допустим только как явный opt-out владельца через `--no-goal-seed`.

## Shared Starter Baseline Rules — synced 2026-06-01

- `starter.conveyor.codex-open-readback`: `task:start` и shared `$worktree-create` не должны считать запуск `codex app <worktreePath>` доказательством открытого Codex-чата. `openedChat=true` допустим только после read-back локального Codex thread state с exact `cwd` нового worktree; при отсутствии matching thread нужно сохранять и показывать `openAttempted`, `openStatus=unverified|failed|skipped`, `openDiagnostics`, `openCommand` и не выдавать успешный статус открытия.

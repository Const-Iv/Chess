# Architecture Map

## Текущий Статус

`new-project-starter` — runnable local-first process baseline для новых репозиториев. Он содержит правила, scripts, shared skills, memory-bank governance и deterministic QA для безопасного старта downstream-проектов.

Core starter не содержит продуктовый UI/API runtime и не фиксирует продуктовые решения конкретного downstream-проекта. Product-specific capabilities добавляются поверх starter через Project Intake, adapters/profiles и отдельные owner-approved decisions.

## Runtime Baseline

- Runtime: Node.js CLI scripts.
- Process layer: managed git worktrees, task state, runtime history, operational docs.
- QA layer: lint, typecheck, tests, build, smoke/nightly process scenarios, security, coverage and perf gates.
- Knowledge layer: `AGENTS.md`, `.memory-bank/*`, `CODEX_MEMORY.md`, mirrors and reusable skills.
- Sharing layer: `starter-rule-report`, `starter-rule-import`, `starter-rule-sync` and `starter-rule-share`.

## Current Information Flow

1. `.memory-bank/product-charter.md` фиксирует миссию, видение, цель, аудиторию и `JTBD` самого starter.
2. `plans/_project_intake_template.md` задаёт обязательный intake для нового downstream-проекта.
3. `starter-project-bootstrap` ведёт owner'а от copied/submodule baseline к approved Project Intake, canonical transfer и baseline QA.
4. `task:*` scripts ведут isolated implementation work через managed worktrees and deterministic QA.
5. `rule-sync:*` and `rule-share:*` scripts остаются approval-safe execution layer для reusable governance updates.
6. Downstream product/runtime decisions живут в downstream canonical sources, а не в starter core.

## Risk Hotspots

- Случайно заменить starter charter продуктовой спецификой downstream-проекта.
- Зафиксировать конкретный stack, provider, locale, payment/auth choice, deploy path, worker model или post-publish command как starter default.
- Ослабить deterministic QA, safe task flow, source-of-truth governance или main-branch protection.
- Перенести raw QA/TRIZ logs, task snippets или source-project details как готовые reusable rules.
- Bulk-copy generated or plugin-managed skill trees вместо repo-owned reusable skills.
- Перезаписать downstream product charter во время outbound rule sharing.

## Change Impact Checklist

Когда меняется product charter starter:
- обновить `.memory-bank/product-charter.md`;
- синхронизировать `AGENTS.md`, `.memory-bank/project-context.md`, `CODEX_MEMORY.md`, `README.md` and mirrors where applicable;
- убедиться, что charter остаётся про portable starter baseline, а не про downstream-продукт.

Когда меняются Project Intake или bootstrap rules:
- обновить `plans/_project_intake_template.md`;
- обновить `skills/starter-project-bootstrap/SKILL.md`;
- проверить `AGENTS.md`, `.memory-bank/code-rules.md`, `.memory-bank/qa-playbook.md`, README and mirrors.

Когда меняются rule-sync/rule-share contracts:
- обновить соответствующий skill;
- обновить scripts/tests/reference docs in the same task;
- обновить `.memory-bank/starter-rule-registry.json`, если меняются exact reusable rules;
- прогнать deterministic QA.

Когда downstream-проекту нужен runtime:
- зафиксировать product-specific choices в downstream Project Intake / product charter / architecture map;
- при неизвестной root technology выполнить isolated echo-test или записать blocker;
- не переносить provider-specific setup обратно в starter core как mandatory default.

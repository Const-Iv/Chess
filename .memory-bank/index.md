# Memory Bank Index

Purpose: хранить долгоживущие, reusable знания проекта вне agent-local prompt context.

## Retrieval Rules

1. Сначала читать этот файл.
2. Для любых продуктовых решений и feature/behavior/process/governance изменений читать `product-charter.md` целиком как первичный product gate.
3. Загружать только остальные memory-файлы, релевантные текущему типу задачи.
4. Предпочитать targeted reads вместо массовой загрузки всего банка.
5. `CODEX_MEMORY.md` держать для коротких operational notes; stable knowledge хранить здесь.

## Routing Matrix

| Task Type | Required Reads | Optional Reads | Output Expectation |
| --- | --- | --- | --- |
| New feature / process addition | `product-charter.md`, `project-context.md`, `architecture-map.md`, `code-rules.md` | `qa-playbook.md` | Implementation with deterministic QA evidence and charter mapping |
| Bugfix / regression | `product-charter.md`, `architecture-map.md`, `code-rules.md`, `qa-playbook.md` | `project-context.md` | Root-cause fix with reusable guard and no charter regression |
| Conveyor / release work | `product-charter.md`, `project-context.md`, `qa-playbook.md`, `code-rules.md` | `architecture-map.md` | Process-safe implementation with state/history validation and no charter bypass |
| Governance update | `product-charter.md`, `code-rules.md`, `qa-playbook.md`, `project-context.md` | `architecture-map.md` | Synced rules in canonical sources |
| Rule sharing to downstream projects | `product-charter.md`, `code-rules.md`, `project-context.md`, `starter-rule-registry.json` | `architecture-map.md`, `qa-playbook.md`, `skills/starter-rule-share/SKILL.md` | Project-grouped report with concrete present/missing/manual-review rules and approval-safe task seeds |
| New downstream project bootstrap | `product-charter.md`, `project-context.md`, `architecture-map.md`, `code-rules.md`, `qa-playbook.md` | `plans/_project_intake_template.md`, `README.md`, `skills/starter-project-bootstrap/SKILL.md` | `$starter-project-bootstrap` guided flow with approved project intake, canonical transfer, and baseline QA before feature work |
| CI / flaky QA | `product-charter.md`, `qa-playbook.md`, `code-rules.md` | `project-context.md`, `architecture-map.md` | Minimal deterministic fix plus failure classification |

## Update Policy

- Coding constraints и assistant standing orders — в `code-rules.md`.
- Mission, vision, goal, целевая аудитория проекта и `JTBD` — в `product-charter.md`; там же живут вопросы и формулы для mission/vision в Project Intake. Проблема, целевая аудитория изменения, сценарии, требования, `Job Story`, `User Story`, критерии приемки, метрика успеха, ограничения и `Eval spec` оформляются на уровне конкретных feature/spec задач, а не общего charter.
- Project Intake для нового downstream-проекта — в `plans/_project_intake_template.md`; mission/vision там проверяются по формулам из `product-charter.md`, после owner approval согласованные ответы переносятся в canonical sources, а несогласованные пункты считаются blocker. Пока гипотеза не подтверждена, архитектура, технологии, способ запуска, коммерческая модель, зоны ответственности и важные возможности не считаются утверждёнными. Applicable capability decisions фиксируются там же как optional-if-applicable блоки, чтобы product-specific auth, payments, credits, analytics, i18n, async jobs, API docs, service layout, runtime choices и действия после публикации не попадали в starter core как mandatory defaults. Unknown root technology фиксируется через echo-testing gate: isolated minimal proof или blocker до feature work.
- Conversational bootstrap нового downstream-проекта — в `skills/starter-project-bootstrap/SKILL.md`; обязательные gate'ы остаются в product charter, code rules и Project Intake template.
- `.memory-bank/starter-rule-registry.json` — machine-readable реестр reusable starter rules для outbound sharing: stable `id`, exact `text`, `targetFiles`, `requiredFragments`, `source`, `sharePolicy`. Он не должен содержать starter mission/vision, downstream product wording, локальные пути или product-specific defaults.
- Stable architecture/process boundaries — в `architecture-map.md`.
- Repeatable QA rules, failure classes, evidence capture — в `qa-playbook.md`.
- Stack/runtime/command context — в `project-context.md`.
- Не дублировать одно и то же правило в нескольких memory-файлах без необходимости.

## Shared Starter Baseline Rules

- `starter.project-intake.integration-review-path`: Integration / review path в Project Intake фиксирует, как изменения попадают в основной проект: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.

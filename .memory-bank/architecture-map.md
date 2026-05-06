# Architecture Map: школа ассистентов

## Текущий Статус

Продуктовая архитектура не утверждается на этапе проверки гипотезы.

Сейчас проект существует как discovery/intake пакет:
- verbatim transcript;
- approved product charter;
- approved roadmap;
- approved intake;
- inherited starter process baseline for worktrees, QA and operational docs.

## Product Runtime

Runtime, stack, package manager, test framework, build command, preview/deploy path and service layout отложены до подтверждения гипотезы.

До отдельного owner approval нельзя фиксировать:
- frontend stack;
- backend/runtime stack;
- identity provider;
- payments provider;
- analytics provider;
- database/queue/worker model;
- API shape;
- production deploy path.

## Current Information Flow

1. Raw transcript хранится без изменений в `Docs/product-discovery/2026-04-03-assistant-selection-transcript.raw`.
2. Product Charter фиксирует смысл, аудиторию, `JTBD`, ограничения, сценарии и критерии успеха.
3. Roadmap фиксирует последовательность проверки спроса и развития направления.
4. Intake фиксирует owner approval и применимость capability/runtime decisions.
5. После подтверждения гипотезы отдельная задача должна зафиксировать product architecture, runtime and QA/release decisions.

## Risk Hotspots

- Смешать Школу ассистентов с другими идеями встречи.
- Начать строить runtime до подтверждения спроса.
- Зафиксировать коммерческую модель раньше, чем будет проверен отклик.
- Подменить raw transcript пересказом.
- Предложить владельцу неподготовленного ассистента без отбора, проверки и стажировки.
- Заменить человека AI-ассистентом в задачах, где нужна ответственность, сложная коммуникация или чувствительный контекст без контроля владельца.

## Change Impact Checklist

Когда меняется product charter:
- обновить `.memory-bank/product-charter.md`;
- проверить синхронизацию с `AGENTS.md`, `CODEX_MEMORY.md`, `README.md` and discovery docs;
- сохранить raw transcript без изменений.

Когда меняется roadmap:
- сверить изменение с raw transcript или owner clarification;
- обновить traceability;
- не переносить roadmap item в обязательную функциональность без отдельного approval.

Когда подтверждается гипотеза и начинается реализация:
- обновить этот файл с выбранной архитектурой;
- заполнить runtime-specific decisions в intake или новом plan file;
- обновить `.memory-bank/qa-playbook.md` with product-specific QA;
- прогнать deterministic QA.

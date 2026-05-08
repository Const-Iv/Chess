# Project Context: школа ассистентов

## Текущее Состояние

- Проект находится на этапе проверки гипотезы и подготовки первого запуска.
- Project Intake утверждён owner'ом 2026-05-04.
- Product Charter утверждён owner'ом 2026-05-04.
- Roadmap запуска утверждён owner'ом 2026-05-04.
- Feature/refactor/behavior-change реализация продукта не начинается до подтверждения гипотезы и отдельных runtime/QA/release decisions.
- Для Project Intake миссия формулируется как “кому помогаем, какой результат даём, через что”, а видение — как “какое будущее хотим получить и какую роль проект играет в этом будущем”.

## Канонические Источники

- Product charter: `.memory-bank/product-charter.md`.
- Project context: `.memory-bank/project-context.md`.
- Architecture status: `.memory-bank/architecture-map.md`.
- Code and collaboration rules: `.memory-bank/code-rules.md`.
- QA playbook: `.memory-bank/qa-playbook.md`.
- Intake: `plans/2026-05-04-1147-project-intake.md`.
- Verbatim source: `Docs/product-discovery/2026-04-03-assistant-selection-transcript.raw`.
- Discovery charter draft: `Docs/product-discovery/2026-04-03-assistant-selection-product-charter-draft.md`.
- Roadmap: `Docs/product-discovery/2026-04-03-assistant-selection-roadmap.md`.

## Product Charter Summary

- Миссия: помогать владельцам бизнеса и CEO освобождать время для развития компании через подбор и обучение проверенных ассистентов.
- Видение: подготовленный ассистент становится стандартной опорой владельца для роста и внедрения изменений, а Школа ассистентов — надёжным источником таких помощников и карьерным лифтом для людей.
- Цель: создать направление подбора и обучения ассистентов для владельцев бизнеса, CEO, клиентов Business Booster, будущих ассистентов и сотрудников клиентов.
- JTBD: владелец бизнеса проходит Business Booster, уже перегружен операционкой и хочет получить готового ассистента, чтобы делегировать задачи и довести изменения до внедрения.

## Roadmap Summary

1. Проверить спрос и уточнить первый запуск.
2. Собрать продуктовую модель.
3. Упаковать первый оффер и входящие потоки.
4. Собрать и проверить кандидатов.
5. Провести стажировки у предпринимателей.
6. Встроить в Business Booster.
7. Собрать кейсы и усилить оффер.
8. Описать AI-ассистента для регулярных задач.
9. Масштабировать направление.

## Решения, Которые Уже Утверждены

- Название проекта: `Школа ассистентов`.
- Миссия, видение, цель, целевая аудитория и `JTBD`.
- Продуктовые ограничения.
- Сценарии использования.
- Критерии успеха.
- Source-of-truth файлы.
- Capability decisions: не применимо на этапе проверки гипотезы.
- Граница продукта: отдельное направление, которое может быть встроено в трек основной программы Business Booster и отдельные составляющие платформы Business Booster.

## Отложенные Решения

- Stack / runtime choices.
- QA / release choices для будущей реализации продукта.
- Agent / eval ownership.
- Memory / rules ownership.
- Коммерческая модель.
- Детальная архитектура продукта.

Эти решения принимаются после подтверждения гипотезы и не должны быть зафиксированы как готовые product/runtime defaults на этапе discovery.

## Operational Baseline

- Работа ведётся в managed worktree и ветке `codex/*`.
- `main` защищён от прямых изменений без явного разрешения owner'а.
- Для документов и governance-правок минимум проверки: `npm run lint`.
- Перед завершением bootstrap нужно прогнать baseline QA: `npm run qa:agent`.
- Shared starter scripts and skills остаются операционным baseline до появления отдельного runtime продукта.
- Core starter не содержит продуктовый UI/API runtime; smoke/nightly здесь проверяют process contracts через temp repos.
- `starter-project-bootstrap` — основной Codex entrypoint для `стартуем новый проект`: сначала автоматически создать managed bootstrap worktree on clean `main`, обеспечить skill availability через `npm ci` при необходимости и `npm run skills:link`, затем определить bootstrap state, провести Project Intake Gate, canonical docs transfer и baseline QA; product-specific choices остаются downstream adapters/profiles.
- Новый downstream-проект сначала проходит Project Intake Gate по `plans/_project_intake_template.md`: недостающие product/governance сведения, включая integration/review path для проведения изменений, заполняются, согласуются owner'ом и только затем переносятся в canonical sources и используются для feature work.
- Project Intake фиксирует integration/review path: managed task conveyor, Pull Request review или hybrid. Pull Request review является явным owner/team choice для risky, broad, external-review или team-review работы и не должен обходить deterministic QA, source-of-truth governance, task finish и merge gates.
- Agent/eval surfaces baseline: Plan mode questions/recommendations, Product Charter gate, Project Intake Gate, rule-sync owner reports, conversational task commands и TRIZ trigger/decision behavior.
- `starter-rule-report` — основной Codex entrypoint для scheduled automation и быстрого ручного rule discovery/report: он запускает read-only scan/report, сохраняет readable Markdown artifact в `runtime/rule-sync/reports/`, показывает decision proposals до raw ids и не готовит import.
- `starter-rule-import` — основной Codex entrypoint для утреннего согласования: он ведёт owner'а по `Кандидаты на импорт` и `Требует ручной проверки`, задаёт self-contained questions со статусом правила, source project, сутью, exact starter text, recommendation и traceability, затем после explicit approval готовит approval JSON и preliminary check без изменений. Каждый approved reusable rule добавляется или обновляется в `.memory-bank/starter-rule-registry.json`.
- `starter-rule-share` — основной Codex entrypoint для outbound sharing уже обновлённого starter baseline в выбранные active downstream проекты; первым owner-facing шагом каждого интерактивного запуска является выбор и подтверждение exact project set, а `runtime/rule-share/config.json` хранит локальный allowlist/ignorelist и optional standing approval для guarded one-run mode, не коммитится.
- Reusable starter skills публикуются в `$CODEX_HOME/skills` через symlink-based `skills:link`; после `git pull` существующие ссылки подхватывают обновления сразу, а для новых или переименованных skills нужно повторно запустить `skills:link`.

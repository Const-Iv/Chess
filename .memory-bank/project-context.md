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
- Reusable starter skills публикуются в `$CODEX_HOME/skills` через symlink-based `skills:link`; после `git pull` существующие ссылки подхватывают обновления сразу, а для новых или переименованных skills нужно повторно запустить `skills:link`.

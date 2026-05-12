Название задачи: Starter rule import question format
Тип задачи: behavior-change
Дата создания: 2026-05-11 11:52

Статус задачи:
- [ ] Не начато
- [ ] В процессе
- [x] Завершено

Связь с charter проекта:
- Сохраняет безопасное conversational governance: владелец принимает решения по переносимым правилам, понимая смысл, пользу и точный текст.
- Не меняет шахматную продуктовую логику и не добавляет product-specific поведение в starter baseline.

Цель изменения:
- Зафиксировать в `$starter-rule-import`, что перед каждым choice сначала идёт полная сводка в чат.
- Убрать риск bare choice, где владелец видит только технический выбор без контекста и точного текста.

Целевая аудитория проекта:
- Owner и agent-operators, которые согласуют перенос reusable rules из downstream-проектов в starter.

Продуктовая спека:

Проблема / JTBD:
- Когда владелец согласует импорт reusable rule, он хочет сначала увидеть статус, источник, смысл, Job Story и точный переносимый текст, чтобы решение было осознанным, а не угадыванием по candidate id или короткому label.

Сценарии использования:
- Кандидат частично покрыт: агент объясняет, что уже есть, чего не хватает и какой portable text предлагается.
- Кандидат source-specific: агент показывает переносимый урок без локальных команд, URL и деталей проекта.
- Владелец пишет, что вопрос непонятен: агент повторяет полную сводку и только потом снова просит выбрать.

Требования:
- В skill должно быть явно сказано: сначала обычное сообщение в чат со сводкой, потом choice.
- Сводка должна включать `Статус сейчас`, `Проект-источник`, `Суть`, `Job Story`, `Точный текст для starter`.
- `request_user_input` или другой structured choice нельзя вызывать до этой сводки.
- Candidate ids остаются только traceability ниже человеческого объяснения.

Eval spec:
- Agent surface: `$starter-rule-import` approval questions.
- Хороший ответ: сначала выводит полную сводку в чат, затем отдельный choice.
- Провал: сразу показывает `Согласовать / править / не переносить` без статуса, сути, Job Story и точного текста.
- Golden prompt 1: latest report содержит publish profile candidate from Chess.
- Golden prompt 2: latest report содержит already-covered-but-unregistered shared skill rule.
- Golden prompt 3: owner отвечает `непонятно`.
- Minimum pass threshold: 3/3 prompts show the full summary before any choice; 0 prompts lead with ids or bare choices.

План реализации:
- [x] Создать managed worktree.
- [x] Обновить `skills/starter-rule-import/SKILL.md`.
- [x] Синхронизировать canonical governance surfaces, если правило уже описано там.
- [x] Проверить targeted fragments и `git diff --check`.

QA:
- [x] Targeted `rg` на обязательные фразы.
- [x] JSON parse для `.memory-bank/starter-rule-registry.json`, если registry изменён.
- [x] `git diff --check`.
- [x] `npm run lint` или более полный `npm run qa:agent`, если изменения затронут QA-critical surfaces.

Риски / откат:
- Риск: если правило останется только в skill, будущий rule-share/import может не увидеть его как reusable governance.
- Откат: revert task branch before merge.

Лог выполнения:
- [x] Начато: 2026-05-11 11:52 MSK
- [x] Завершено: 2026-05-11 11:55 MSK

Результаты QA:
- `node -e ... JSON.parse(.memory-bank/starter-rule-registry.json)`: PASS, `registry ok`.
- Targeted registry fragment checker for `starter.rule-import.chat-summary-before-choice`: PASS, `rule fragments ok`.
- Targeted `rg` for `Статус сейчас`, `Проект-источник`, `Суть`, `Job Story`, `Точный текст для starter`, `request_user_input`: PASS, required fragments found in skill, canonical docs, mirrors, registry and plan.
- `git diff --check`: PASS.
- `npm run lint`: PASS, `repo-lint: ok (140 files checked)`.

Eval results:
- Golden prompt 1, publish profile candidate from Chess: PASS by contract; skill requires the chat-first summary before any choice.
- Golden prompt 2, already-covered-but-unregistered shared skill rule: PASS by contract; status and current gap must be stated before choice.
- Golden prompt 3, owner says `непонятно`: PASS by contract; skill requires restating the required chat-first format and forbids asking the same bare choice again.

Изменённые файлы:
- plans/2026-05-11-1152-starter-rule-import-question-format.md
- .cursorrules
- .memory-bank/code-rules.md
- .memory-bank/starter-rule-registry.json
- AGENTS.md
- CLAUDE.md
- CODEX_MEMORY.md
- skills/starter-rule-import/SKILL.md

# Context Hygiene

Этот файл хранит переносимые правила гигиены контекста; product identity остаётся в `.memory-bank/product-charter.md`.

## Shared Starter Baseline Rules — synced 2026-07-17

- `starter.context.concise-responses`: Ответы агента должны быть короткими и по делу; подробности добавляются только когда они нужны для решения, проверки, owner decision или safety.
- `starter.agent.read-only-subagent-summary`: Для больших read-only анализов, ревью и независимых проверок можно использовать субагентов, когда текущая платформа и рабочий контракт это разрешают. Главный чат получает structured summary: findings, risks, checked files/sources, recommended next step. Субагенты не принимают product decisions за owner'а и не мутируют shared files без отдельного write scope.
- `starter.context.markdown-first-inputs`: Входные текстовые материалы по умолчанию переводятся или сохраняются как Markdown/plain text, если задача не про layout fidelity. PDF, DOCX, HTML и другие шумные форматы используются напрямую только когда формат, layout или визуальная fidelity являются частью результата.

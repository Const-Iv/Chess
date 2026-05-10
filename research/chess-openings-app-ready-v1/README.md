# Chess openings app-ready v1 import

Статус: copied source evidence для расширения учебной базы дебютов.

## Связь с charter проекта

Материалы поддерживают цель тренажера: не просто показывать ход, а объяснять название варианта, идею хода, планы сторон и переход к миттельшпилю.

## Что скопировано

- `chess_openings_app_research_ru.md` — исследование и методология.
- `chess_openings_knowledge_base_ru.json` — app-ready JSON на 98 вариантов.
- `chess_openings_lines_ru.csv` — табличный экспорт вариантов.
- `chess_openings_repertoire_pgn_ru.pgn` — PGN-линии с комментариями.
- `База контента для приложения по обучению шахматным дебютам.md` — расширенное описание контента.
- `Практическое исследование шахматных дебютов` — дополнительный текстовый экспорт.
- `lichess_prefix_validation_2026-05-09.json` — локальная проверка импорта перед подключением к приложению.

## Как использовать безопасно

- JSON является imported research source, а не единственным каноническим шахматным источником.
- Приложение проверяет каждую SAN-линию через `chess.js`.
- Validation-файл фиксирует сопоставление с Lichess `chess-openings`:
  - `pgn-exact` — полный PGN совпал с Lichess;
  - `lichess-prefix` — imported line продолжает известный Lichess-префикс, а дополнительные ходы считаются учебным продолжением.
- Эти линии нельзя показывать как engine-best без отдельного Lichess Explorer / Stockfish sanity layer.

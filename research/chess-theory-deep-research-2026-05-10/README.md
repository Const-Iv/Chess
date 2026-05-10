# Deep Research: source-backed opening theory evidence, 2026-05-10

## Связь с charter проекта

Это изменение поддерживает миссию тренажера: пользователь должен понимать дебютные ходы, названия вариантов и планы перехода к миттельшпилю, но приложение не должно выдавать неподтвержденные советы как факт.

## Цель

Заменить ручное ощущение "хороший/плохой ход" на проверяемый слой evidence:

- названия вариантов и ECO не придумываются, а сверяются с открытым каталогом Lichess `chess-openings`;
- типовые ходы в позиции подтверждаются реальными broadcast-партиями;
- плохие ходы показываются только если у них есть внешний источник или engine/source gate;
- ручные заметки без внешней проверки остаются кандидатами и не попадают в UI.

## Источники

1. Lichess `chess-openings`: <https://github.com/lichess-org/chess-openings>
   - Использование: названия вариантов, ECO, PGN/EPD для известных opening positions.
   - Лицензия: CC0/public domain dedication.

2. Lichess Open Database, Broadcasts: <https://database.lichess.org/#broadcasts>
   - Использование: реальные партии для частотности ходов и примеров.
   - Срез: `2026-01`, `2026-02`, `2026-03`, `2026-04`.
   - Объем текущего прогона: 104 941 broadcast-партия.
   - Лицензия: CC BY-SA 4.0.

3. Lichess evaluations / cloud eval: <https://database.lichess.org/#evals> и <https://lichess.org/api#tag/Analysis/operation/apiCloudEval>
   - Использование: sanity-check для плохих ходов и engine candidates.
   - Ограничение: не каждая позиция уже есть в cloud cache; отсутствие оценки не превращается в шахматный факт.

4. Академические ориентиры методологии:
   - Mark Levene, Judit Bar-Ilan, "Comparing Typical Opening Move Choices Made by Humans and Chess Engines", arXiv:cs/0610060.
   - Giordano De Marzo, Vito DP Servedio, "Quantifying the complexity and similarity of chess openings using online chess community data", arXiv:2206.14312.
   - B. Blasius, R. Toenjes, "Zipf law in the popularity distribution of chess openings", arXiv:0704.2711.

5. Книжные ориентиры без копирования текста:
   - `Fundamental Chess Openings` Paul van der Sterren.
   - `The Ideas Behind the Chess Openings` Reuben Fine.
   - `Modern Chess Openings`.
   - `Mastering the Chess Openings` John Watson.

## Что сгенерировано

- `position-evidence.json` - текущий воспроизводимый слой evidence по всем позициям, где ходит изучаемая сторона.
- Команда: `npm run collect:theory-evidence -- '--sources=runtime/chess-theory-source-audit/lichess_db_broadcast_2026-*.pgn.zst'`.

Итог текущего прогона:

- уроков: 116;
- позиций изучаемой стороны: 657;
- позиций с ходами из реальных broadcast-партий: 655;
- разобрано broadcast-партий: 104 941.

## Правило качества

Ход можно показывать как `Типовое продолжение`, если он:

- есть в текущей проверенной линии приложения; или
- встречался в реальных broadcast-партиях для этой FEN-позиции.

Ход можно показывать как `Плохой ход`, если он:

- является легальным SAN в конкретной FEN-позиции;
- привязан к этой FEN-позиции, а не к общему принципу;
- имеет внешний источник: cloud eval, puzzle/source evidence, книга/статья с точной ссылкой, или ручной анализ, прошедший отдельный source gate.

Ручная заметка без внешнего source gate остается в исходной базе как кандидат, но не отображается пользователю.

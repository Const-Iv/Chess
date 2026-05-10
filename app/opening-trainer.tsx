"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import type { Move, Piece, Square } from "chess.js";

import { buildDisplayBoard, buildOpeningLessons } from "../src/domain/chess/opening-database.mjs";

type StudySide = "white" | "black";
type BlackPieceStyle = "original" | "inverted-white";

type BoardPiece = Readonly<{
  symbol: string;
  color: StudySide;
  name: string;
}>;

type BoardSquare = Readonly<{
  file: string;
  rank: string;
  square: string;
  shade: "light" | "dark";
  showFile: boolean;
  showRank: boolean;
  isMoveFrom: boolean;
  isMoveTo: boolean;
  piece: BoardPiece | null;
}>;

type MoveStep = Readonly<{
  ply: number;
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  actor: StudySide;
  actorLabel: string;
  pieceName: string;
  title: string;
  explanation: string;
  purpose: string;
  board: readonly BoardSquare[];
}>;

type OpeningContinuation = Readonly<{
  key: string;
  san: string;
  label: string;
  idea: string;
  summary: string;
  lineSan: readonly string[];
  steps: readonly MoveStep[];
}>;

type BadMove = Readonly<{
  key: string;
  san: string;
  label: string;
  whyBad: string;
  betterPlan: string;
  from: string;
  to: string;
  steps: readonly MoveStep[];
}>;

type OpeningPriority = "A" | "B" | "C";

type LichessOpeningMatch = Readonly<{
  kind: string;
  commonPrefixPly: number;
  eco: string;
  name: string;
  pgn: string;
}>;

type OpeningSourceEvidence = Readonly<{
  legalSan: boolean;
  finalFen: string;
  lichessMatch: LichessOpeningMatch | null;
}>;

type SelectedTarget = Readonly<{
  kind: "continuation" | "badMove" | "learning";
  key: string;
}>;

type MoveAssessmentKind = "recommended" | "bad" | "neutral";

type MoveAssessment = Readonly<{
  kind: MoveAssessmentKind;
  title: string;
  label: string;
  body: string;
  plan: string;
  targetKind?: "continuation" | "badMove";
  targetKey?: string;
}>;

type MoveChoice = Readonly<{
  move: Move;
  assessment: MoveAssessment;
}>;

type OpeningGroup = Readonly<{
  family: string;
  lessons: readonly OpeningLesson[];
}>;

type OpeningLesson = Readonly<{
  status: "ПРОВЕРЕНО" | "ХОДЫ ПРОВЕРЕНЫ";
  input: string;
  appliedSan: readonly string[];
  fen: string;
  baseLine: Readonly<{
    steps: readonly MoveStep[];
  }>;
  opening: Readonly<{
    key: string;
    family: string;
    name: string;
    sourceName: string;
    eco: string;
    aliases: readonly string[];
    studySide: StudySide;
    studyLabel: string;
    turnLabel: string;
    verification: string;
    principle: string;
    positionGoal: string;
    middlegamePlan: string;
    priority?: OpeningPriority;
    whyItMatters?: string;
    whitePlan?: string;
    blackPlan?: string;
    middlegameTabia?: string;
    keyIdeas?: readonly string[];
    commonTraps?: readonly string[];
    avoid?: readonly string[];
    tags?: readonly string[];
    sourceEvidence?: OpeningSourceEvidence;
    continuations: readonly OpeningContinuation[];
    badMoves: readonly BadMove[];
  }>;
}>;

type BoardArrow = Readonly<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: "move" | "tactic";
}>;

type TacticalWarning = Readonly<{
  title: string;
  body: string;
  from: string;
  to: string;
}>;

type MoveFeedback = Readonly<{
  move: Move;
  assessment: MoveAssessment;
  board: readonly BoardSquare[];
  tactic: TacticalWarning | null;
}>;

const BLACK_PIECE_STYLES: readonly Readonly<{
  key: BlackPieceStyle;
  label: string;
}>[] = Object.freeze([
  Object.freeze({ key: "original", label: "Как было" }),
  Object.freeze({ key: "inverted-white", label: "Инверсия белых" })
]);

type NotationExplanation = Readonly<{
  token: string;
  meaning: string;
}>;

type InteractiveLearningCard = Readonly<{
  key: string;
  title: string;
  label: string;
  body: string;
  focusStepIndex: number;
  focusLabel: string;
}>;

const PIECE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  B: "слон",
  K: "король",
  N: "конь",
  Q: "ферзь",
  R: "ладья"
});

const PIECE_NAMES_BY_TYPE: Readonly<Record<string, string>> = Object.freeze({
  b: "слон",
  k: "король",
  n: "конь",
  p: "пешка",
  q: "ферзь",
  r: "ладья"
});

const PIECE_MOVE_HINTS: Readonly<Record<string, string>> = Object.freeze({
  b: "Слон ходит по диагоналям, пока путь не перекрыт своей или чужой фигурой.",
  k: "Король ходит на одну клетку и не может вставать под шах.",
  n: "Конь прыгает буквой Г и может перепрыгивать через занятые клетки.",
  p: "Пешка идет вперед, берет по диагонали и зависит от цвета фигуры и занятости клеток.",
  q: "Ферзь ходит по вертикалям, горизонталям и диагоналям, пока путь свободен.",
  r: "Ладья ходит по вертикалям и горизонталям, пока путь свободен."
});

const MOVE_NOTATION_PATTERN =
  /\.{3}(?:O-O-O|O-O|0-0-0|0-0|[KQRBN][a-h][1-8]-[a-h][1-8][+#]?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8][+#]?|[a-h]x[a-h][1-8][+#]?|[a-h][1-8]-[a-h][1-8]|[a-h][1-8])|(?:O-O-O|O-O|0-0-0|0-0|[KQRBN][a-h][1-8]-[a-h][1-8][+#]?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8][+#]?|[a-h]x[a-h][1-8][+#]?|[a-h][1-8]-[a-h][1-8])/g;

function formatMove(step: MoveStep) {
  const separator = step.actor === "black" ? "..." : ".";
  return `${step.moveNumber}${separator} ${step.san}`;
}

function getSquareCenter(board: readonly BoardSquare[], squareName: string) {
  const index = board.findIndex((square) => square.square === squareName);
  if (index < 0) {
    return null;
  }

  const column = index % 8;
  const row = Math.floor(index / 8);
  return {
    x: (column + 0.5) * 12.5,
    y: (row + 0.5) * 12.5
  };
}

function getBoardArrow(
  board: readonly BoardSquare[],
  fromSquare: string,
  toSquare: string,
  kind: "move" | "tactic" = "move"
): BoardArrow | null {
  const from = getSquareCenter(board, fromSquare);
  const to = getSquareCenter(board, toSquare);
  if (!from || !to) {
    return null;
  }

  return {
    x1: from.x,
    y1: from.y,
    x2: to.x,
    y2: to.y,
    kind
  };
}

function getPriorityLabel(priority: OpeningPriority | undefined) {
  if (!priority) {
    return "ядро";
  }

  if (priority === "A") {
    return "A";
  }

  if (priority === "B") {
    return "B";
  }

  return "C";
}

function buildLessonSearchText(lesson: OpeningLesson) {
  return [
    lesson.opening.family,
    lesson.opening.name,
    lesson.opening.sourceName,
    lesson.opening.eco,
    lesson.opening.aliases.join(" "),
    lesson.opening.tags?.join(" ") ?? "",
    lesson.opening.keyIdeas?.join(" ") ?? ""
  ]
    .join(" ")
    .toLowerCase();
}

function getSourceCheckLabel(evidence: OpeningSourceEvidence | undefined) {
  if (!evidence) {
    return "проверено вручную";
  }

  if (evidence.lichessMatch?.kind === "pgn-exact") {
    return "точное совпадение Lichess";
  }

  if (evidence.lichessMatch) {
    return "префикс Lichess";
  }

  return "ходы SAN легальны";
}

function getStudySideStatus(studySide: StudySide) {
  return studySide === "white" ? "Играем за белых" : "Играем за черных";
}

function cleanNotationToken(token: string) {
  return token.replace(/\.\.\./, "").replace(/0/g, "O").replace(/[+#]$/, "");
}

function normalizeSanForCompare(san: string) {
  return cleanNotationToken(san).replace(/[!?]+$/g, "");
}

function getMoveKey(move: Move) {
  return `${move.from}-${move.to}-${move.san}`;
}

function getSideNameFromTurn(turn: "w" | "b") {
  return turn === "w" ? "белых" : "черных";
}

function getPieceSideName(piece: Piece) {
  return piece.color === "w" ? "белая" : "черная";
}

function getPieceName(piece: Piece | undefined) {
  return piece ? PIECE_NAMES_BY_TYPE[piece.type] ?? "фигура" : "фигура";
}

function getAssessmentResultTitle(assessment: MoveAssessment) {
  if (assessment.kind === "recommended") {
    return "Правильно: ход совпадает с проверенной учебной подсказкой";
  }

  if (assessment.kind === "bad") {
    return "Неправильно: это известная ошибка в этой карточке";
  }

  return "Ход легален, но тренер не подтверждает его как учебно хороший";
}

function buildChessAtPly(steps: readonly MoveStep[], positionPly: number) {
  const chess = new Chess();
  const safePly = Math.min(Math.max(positionPly, 0), steps.length);

  for (let index = 0; index < safePly; index += 1) {
    const step = steps[index];

    if (step) {
      chess.move(step.san, { strict: true });
    }
  }

  return chess;
}

function getPositionLabel(activeStep: MoveStep | null) {
  return activeStep ? `после ${formatMove(activeStep)}` : "на старте линии";
}

function getInitialPositionPly(lesson: OpeningLesson) {
  if (lesson.opening.continuations.length > 0 || lesson.opening.badMoves.length > 0) {
    return lesson.baseLine.steps.length;
  }

  return 0;
}

function getTacticalWarning(chess: Chess, move: Move): TacticalWarning | null {
  const movedPiece = chess.get(move.to as Square);

  if (!movedPiece) {
    return null;
  }

  const opponentColor = movedPiece.color === "w" ? "b" : "w";
  const attackers = chess.attackers(move.to as Square, opponentColor);
  const attackerSquare = attackers[0];

  if (!attackerSquare) {
    return null;
  }

  const attacker = chess.get(attackerSquare);
  const movedPieceName = getPieceName(movedPiece);
  const attackerName = getPieceName(attacker);

  return {
    title: "Тактический сигнал",
    body: `${movedPieceName} на ${move.to} сейчас под ударом: ${attackerName} с ${attackerSquare} атакует это поле. Это не всегда проигрыш, но ход нужно перепроверить.`,
    from: attackerSquare,
    to: move.to
  };
}

function buildMoveFeedback(
  chess: Chess,
  lesson: OpeningLesson,
  choice: MoveChoice
): MoveFeedback {
  const probe = new Chess(chess.fen());
  const move = probe.move(choice.move.san, { strict: true });

  return {
    move,
    assessment: choice.assessment,
    board: buildDisplayBoard(probe, lesson.opening.studySide, {
      from: move.from,
      to: move.to
    }) as readonly BoardSquare[],
    tactic: choice.assessment.kind === "bad" || choice.assessment.kind === "neutral" ? getTacticalWarning(probe, move) : null
  };
}

function matchesMove(move: Move, candidate: Readonly<{ san: string; from?: string; to?: string }>) {
  const sanMatches = normalizeSanForCompare(move.san) === normalizeSanForCompare(candidate.san);
  const fromMatches = !candidate.from || candidate.from === move.from;
  const toMatches = !candidate.to || candidate.to === move.to;
  return sanMatches && fromMatches && toMatches;
}

function assessLegalMove(
  lesson: OpeningLesson,
  move: Move,
  nextLineStep: MoveStep | undefined,
  selectedTargetKind: SelectedTarget["kind"],
  isOpeningChoicePosition: boolean
): MoveAssessment {
  const knownBadMove = isOpeningChoicePosition
    ? lesson.opening.badMoves.find((badMove) => matchesMove(move, badMove))
    : undefined;

  if (knownBadMove) {
    return {
      kind: "bad",
      title: "Неудачный ход в этой позиции",
      label: knownBadMove.label,
      body: knownBadMove.whyBad,
      plan: knownBadMove.betterPlan,
      targetKind: "badMove",
      targetKey: knownBadMove.key
    };
  }

  const knownContinuation = isOpeningChoicePosition
    ? lesson.opening.continuations.find((continuation) => matchesMove(move, continuation))
    : undefined;

  if (knownContinuation) {
    return {
      kind: "recommended",
      title: "Хороший учебный ход",
      label: knownContinuation.label,
      body: knownContinuation.idea,
      plan: knownContinuation.summary,
      targetKind: "continuation",
      targetKey: knownContinuation.key
    };
  }

  if (nextLineStep && matchesMove(move, nextLineStep) && selectedTargetKind !== "badMove") {
    return {
      kind: "recommended",
      title: "Ход выбранной учебной линии",
      label: nextLineStep.title,
      body: nextLineStep.explanation,
      plan: nextLineStep.purpose
    };
  }

  return {
    kind: "neutral",
    title: "Легальный ход без оценки в этой карточке",
    label: "Можно по правилам шахмат",
    body:
      "Такой ход легален, но в текущей проверенной карточке он не отмечен как главное продолжение или типовая ошибка.",
    plan: `Сверь ход с целью позиции: ${lesson.opening.positionGoal}`
  };
}

function withMoveSidePrefix(meaning: string, isBlackMove: boolean) {
  return isBlackMove ? `за черных: ${meaning}` : meaning;
}

function describeNotationToken(rawToken: string) {
  const isBlackMove = rawToken.startsWith("...");
  const token = cleanNotationToken(rawToken);

  if (token === "O-O") {
    return withMoveSidePrefix("короткая рокировка: король уходит в безопасность", isBlackMove);
  }

  if (token === "O-O-O") {
    return withMoveSidePrefix("длинная рокировка: король уходит на ферзевый фланг", isBlackMove);
  }

  if (token.includes("-")) {
    const [fromRaw = "", to = ""] = token.split("-");
    const piece = PIECE_LABELS[fromRaw[0]] ?? "пешка";
    const from = PIECE_LABELS[fromRaw[0]] ? fromRaw.slice(1) : fromRaw;
    return withMoveSidePrefix(`${piece} идет с ${from} на ${to}`, isBlackMove);
  }

  if (token.includes("x")) {
    const [fromRaw = "", to = ""] = token.split("x");
    const piece = PIECE_LABELS[fromRaw[0]];

    if (piece) {
      const sourceHint = fromRaw.length > 1 ? ` с ${fromRaw.slice(1)}` : "";
      return withMoveSidePrefix(`${piece}${sourceHint} берет на ${to}`, isBlackMove);
    }

    return withMoveSidePrefix(`пешка с линии ${fromRaw[0]} берет на ${to}`, isBlackMove);
  }

  const piece = PIECE_LABELS[token[0]];

  if (piece) {
    const target = token.slice(-2);
    const sourceHint = token.length > 3 ? ` с уточнением ${token.slice(1, -2)}` : "";
    return withMoveSidePrefix(`${piece}${sourceHint} идет на ${target}`, isBlackMove);
  }

  return withMoveSidePrefix(`ход пешкой на ${token}`, isBlackMove);
}

function getNotationExplanations(text: string) {
  const matches = text.match(MOVE_NOTATION_PATTERN) ?? [];
  const seen = new Set<string>();
  const explanations: NotationExplanation[] = [];

  for (const match of matches) {
    if (seen.has(match)) {
      continue;
    }

    seen.add(match);
    explanations.push({
      token: match,
      meaning: describeNotationToken(match)
    });
  }

  return explanations.slice(0, 4);
}

function NotationHelp({ explanations }: Readonly<{ explanations: readonly NotationExplanation[] }>) {
  if (explanations.length === 0) {
    return null;
  }

  return (
    <span className="notation-help">
      <strong>Расшифровка:</strong>{" "}
      {explanations.map((explanation, index) => (
        <span key={explanation.token}>
          <code>{explanation.token}</code>
          {` - ${explanation.meaning}${index === explanations.length - 1 ? "" : "; "}`}
        </span>
      ))}
    </span>
  );
}

function InsightText({ text }: Readonly<{ text: string }>) {
  const explanations = getNotationExplanations(text);

  return (
    <>
      <p>{text}</p>
      <NotationHelp explanations={explanations} />
    </>
  );
}

function InsightListItem({ text }: Readonly<{ text: string }>) {
  const explanations = getNotationExplanations(text);

  return (
    <li>
      <span>{text}</span>
      <NotationHelp explanations={explanations} />
    </li>
  );
}

function MoveCoach({
  activeStep,
  moveFeedback,
  nextLineStep,
  moveChoices,
  onOpenMoveLine,
  onResetMoveFeedback,
  onSelectMove,
  selectedMoveChoice,
  selectedPiece,
  selectedSquare,
  sideToMove
}: Readonly<{
  activeStep: MoveStep | null;
  moveFeedback: MoveFeedback | null;
  nextLineStep: MoveStep | undefined;
  moveChoices: readonly MoveChoice[];
  onOpenMoveLine: (assessment: MoveAssessment) => void;
  onResetMoveFeedback: () => void;
  onSelectMove: (choice: MoveChoice) => void;
  selectedMoveChoice: MoveChoice | null;
  selectedPiece: Piece | undefined;
  selectedSquare: string;
  sideToMove: "w" | "b";
}>) {
  const isSelectedPieceOnTurn = selectedPiece?.color === sideToMove;
  const pieceName = getPieceName(selectedPiece);
  const canMoveSelectedPiece = isSelectedPieceOnTurn && moveChoices.length > 0;
  const moveTargetList = moveChoices.map((choice) => choice.move.to).join(", ");

  return (
    <section className="move-coach" aria-labelledby="move-coach-title">
      <div className="move-coach-head">
        <div>
          <p className="eyebrow">Инструктор выбора</p>
          <h2 id="move-coach-title">{moveFeedback ? "Ход сделан" : `Ход ${getSideNameFromTurn(sideToMove)}`}</h2>
          <span className="coach-subtitle">
            {moveFeedback ? `${moveFeedback.move.san} показан на доске` : getPositionLabel(activeStep)}
          </span>
        </div>
        <span
          className={[
            "coach-status",
            !selectedPiece ? "status-wait" : canMoveSelectedPiece ? "status-can" : "status-cannot"
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {moveFeedback ? "ход сделан" : !selectedPiece ? "выбери фигуру" : canMoveSelectedPiece ? "можно ходить" : "нельзя ходить"}
        </span>
      </div>

      {moveFeedback ? (
        <article className={`move-assessment move-assessment-${moveFeedback.assessment.kind}`}>
          <span>{moveFeedback.assessment.label}</span>
          <h3>{`${moveFeedback.move.san}: ${getAssessmentResultTitle(moveFeedback.assessment)}`}</h3>
          <p>{moveFeedback.assessment.body}</p>
          <p>{moveFeedback.assessment.plan}</p>
          {moveFeedback.tactic ? (
            <div className="coach-tactic">
              <strong>{moveFeedback.tactic.title}</strong>
              <p>{moveFeedback.tactic.body}</p>
            </div>
          ) : null}
          <button onClick={onResetMoveFeedback} type="button">
            Продолжить разбор
          </button>
        </article>
      ) : null}

      {!selectedSquare && !moveFeedback ? (
        <p>
          Выбери фигуру стороны, которая сейчас ходит. На доске появятся точки на всех легальных клетках, а здесь
          появится оценка выбранного хода.
          {nextLineStep ? ` Следующий ход проверенной учебной линии: ${formatMove(nextLineStep)}.` : ""}
        </p>
      ) : null}

      {selectedSquare && !selectedPiece && !moveFeedback ? (
        <p>На {selectedSquare} нет фигуры. Выбери фигуру стороны, которая сейчас ходит.</p>
      ) : null}

      {selectedPiece && !moveFeedback ? (
        <div className="coach-selection">
          <h3>{`${getPieceSideName(selectedPiece)} ${pieceName} на ${selectedSquare}`}</h3>
          <p>{PIECE_MOVE_HINTS[selectedPiece.type] ?? "Фигура ходит только по легальным для нее клеткам."}</p>

          {selectedPiece.color !== sideToMove ? (
            <p className="coach-warning">
              Этой фигурой сейчас ходить нельзя: {getPositionLabel(activeStep)} ход у {getSideNameFromTurn(sideToMove)}.
            </p>
          ) : null}

          {isSelectedPieceOnTurn && moveChoices.length === 0 ? (
            <p className="coach-warning">
              У этой фигуры нет легальных ходов. Причина обычно одна из трех: путь закрыт, клетка занята своей фигурой
              или ход оставляет короля под шахом.
            </p>
          ) : null}

          {canMoveSelectedPiece ? (
            <>
              <p>
                <strong>Куда можно:</strong> {moveTargetList}.
              </p>
              <p className="coach-note">
                Клетки без точки сейчас недоступны по правилам: там может стоять своя фигура, путь может быть закрыт
                или ход может оставлять короля под шахом.
              </p>
              <div className="move-choice-list" aria-label="Легальные ходы выбранной фигурой">
                {moveChoices.map((choice) => (
                  <button
                    aria-pressed={selectedMoveChoice ? getMoveKey(selectedMoveChoice.move) === getMoveKey(choice.move) : false}
                    className={`move-choice move-choice-${choice.assessment.kind}`}
                    key={getMoveKey(choice.move)}
                    onClick={() => onSelectMove(choice)}
                    type="button"
                  >
                    <strong>{choice.move.san}</strong>
                    <span>{choice.move.to}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {selectedMoveChoice ? (
        <article className={`move-assessment move-assessment-${selectedMoveChoice.assessment.kind}`}>
          <span>{selectedMoveChoice.assessment.label}</span>
          <h3>{`${selectedMoveChoice.move.san}: ${selectedMoveChoice.assessment.title}`}</h3>
          <p>{selectedMoveChoice.assessment.body}</p>
          <p>{selectedMoveChoice.assessment.plan}</p>
          {selectedMoveChoice.assessment.targetKind && selectedMoveChoice.assessment.targetKey ? (
            <button onClick={() => onOpenMoveLine(selectedMoveChoice.assessment)} type="button">
              Показать на доске
            </button>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

function getMoveReferences(text: string) {
  return [
    ...new Set([
      ...[...text.matchAll(MOVE_NOTATION_PATTERN)].map((match) => cleanNotationToken(match[0])),
      ...[...text.matchAll(/\b[a-h][1-8]\b/g)].map((match) => match[0])
    ])
  ];
}

function getLearningCardFocus(lesson: OpeningLesson, text: string) {
  const references = getMoveReferences(text);

  for (const reference of references) {
    const matchedIndex = lesson.baseLine.steps.findIndex((step) => {
      const cleanSan = cleanNotationToken(step.san);
      return (
        cleanSan === reference ||
        step.from === reference ||
        step.to === reference ||
        reference.endsWith(`-${step.to}`)
      );
    });

    if (matchedIndex >= 0) {
      return {
        focusStepIndex: matchedIndex,
        matchedMove: true
      };
    }
  }

  return {
    focusStepIndex: Math.max(lesson.baseLine.steps.length - 1, 0),
    matchedMove: false
  };
}

function buildLearningCard(
  lesson: OpeningLesson,
  body: string,
  key: string,
  label: string,
  fallbackTitle: string
) {
  const focus = getLearningCardFocus(lesson, body);
  const focusStep = lesson.baseLine.steps[focus.focusStepIndex];
  const focusMove = focusStep ? formatMove(focusStep) : "типовую позицию";

  return {
    key,
    title: focus.matchedMove && focusStep ? focusMove : fallbackTitle,
    label,
    body,
    focusStepIndex: focus.focusStepIndex,
    focusLabel: focus.matchedMove ? `Показать на доске: ${focusMove}` : "Показать типовую позицию на доске"
  } satisfies InteractiveLearningCard;
}

function getInteractiveContinuationCards(lesson: OpeningLesson) {
  if (lesson.opening.continuations.length > 0) {
    return [];
  }

  const ideas = lesson.opening.keyIdeas?.length
    ? lesson.opening.keyIdeas
    : [
        `Пройди основную линию до типовой позиции: ${lesson.input}. Это проверенный учебный путь к позиции, где уже важнее план, а не запоминание ходов.`
      ];

  return ideas.map((idea, index) =>
    buildLearningCard(
      lesson,
      idea,
      `${lesson.opening.key}-interactive-continuation-${index}`,
      index === 0 ? "Типовое продолжение" : "Следующая идея",
      index === 0 ? "Ориентир" : "План"
    )
  );
}

function getInteractiveBadMoveCards(lesson: OpeningLesson) {
  if (lesson.opening.badMoves.length > 0) {
    return [];
  }

  const warnings = [...(lesson.opening.avoid ?? []), ...(lesson.opening.commonTraps ?? [])];
  const safeWarnings = warnings.length
    ? warnings
    : [
        "Не делай случайный ход, если он не помогает развитию фигур, борьбе за центр или безопасности короля. Сначала сверяйся с целью позиции и планом до миттельшпиля."
      ];

  return safeWarnings.map((warning, index) =>
    buildLearningCard(
      lesson,
      warning,
      `${lesson.opening.key}-interactive-bad-${index}`,
      index === 0 ? "Главный риск" : "Типовая ошибка",
      "Ошибка"
    )
  );
}

export default function OpeningTrainer() {
  const lessons = useMemo(() => buildOpeningLessons() as readonly OpeningLesson[], []);
  const initialLesson = lessons.find((candidate) => candidate.opening.studySide === "white") ?? lessons[0];
  const [studySideFilter, setStudySideFilter] = useState<StudySide>(initialLesson?.opening.studySide ?? "white");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | OpeningPriority>("all");
  const [selectedOpeningKey, setSelectedOpeningKey] = useState(initialLesson?.opening.key ?? "");
  const [blackPieceStyle, setBlackPieceStyle] = useState<BlackPieceStyle>("original");
  const sideLessons = useMemo(
    () => lessons.filter((candidate) => candidate.opening.studySide === studySideFilter),
    [lessons, studySideFilter]
  );
  const catalogStats = useMemo(() => {
    const researchLessons = sideLessons.filter((candidate) => candidate.opening.priority);
    return {
      total: sideLessons.length,
      curated: sideLessons.length - researchLessons.length,
      a: researchLessons.filter((candidate) => candidate.opening.priority === "A").length,
      b: researchLessons.filter((candidate) => candidate.opening.priority === "B").length,
      c: researchLessons.filter((candidate) => candidate.opening.priority === "C").length
    };
  }, [sideLessons]);
  const sideStats = useMemo(
    () => ({
      white: lessons.filter((candidate) => candidate.opening.studySide === "white").length,
      black: lessons.filter((candidate) => candidate.opening.studySide === "black").length
    }),
    [lessons]
  );
  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sideLessons.filter((candidate) => {
      const priorityMatches = priorityFilter === "all" || candidate.opening.priority === priorityFilter;
      const queryMatches = normalizedQuery.length === 0 || buildLessonSearchText(candidate).includes(normalizedQuery);
      return priorityMatches && queryMatches;
    });
  }, [sideLessons, priorityFilter, query]);
  const groupedLessons = useMemo(() => {
    /** @type {Map<string, OpeningLesson[]>} */
    const groups = new Map<string, OpeningLesson[]>();
    for (const filteredLesson of filteredLessons) {
      const family = filteredLesson.opening.family;
      groups.set(family, [...(groups.get(family) ?? []), filteredLesson]);
    }
    return [...groups.entries()].map(([family, groupLessons]) => ({
      family,
      lessons: groupLessons
    })) satisfies OpeningGroup[];
  }, [filteredLessons]);
  const lesson =
    filteredLessons.find((candidate) => candidate.opening.key === selectedOpeningKey) ??
    sideLessons.find((candidate) => candidate.opening.key === selectedOpeningKey) ??
    filteredLessons[0] ??
    sideLessons[0] ??
    lessons[0]!;
  const firstContinuation = lesson.opening.continuations[0];
  const firstBadMove = lesson.opening.badMoves[0];
  const firstContinuationPositionPly = lesson.baseLine.steps.length;
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>({
    kind: firstContinuation ? "continuation" : firstBadMove ? "badMove" : "learning",
    key: firstContinuation?.key ?? firstBadMove?.key ?? ""
  });
  const [positionPly, setPositionPly] = useState(getInitialPositionPly(lesson));
  const [selectedLearningCardKey, setSelectedLearningCardKey] = useState("");
  const [selectedSquare, setSelectedSquare] = useState("");
  const [selectedMoveKey, setSelectedMoveKey] = useState("");
  const [moveFeedback, setMoveFeedback] = useState<MoveFeedback | null>(null);

  const selectedContinuation =
    selectedTarget.kind === "continuation"
      ? lesson.opening.continuations.find((continuation) => continuation.key === selectedTarget.key)
      : undefined;
  const selectedBadMove =
    selectedTarget.kind === "badMove"
      ? lesson.opening.badMoves.find((badMove) => badMove.key === selectedTarget.key)
      : undefined;
  const fallbackLine = selectedTarget.kind === "learning" ? undefined : firstContinuation ?? firstBadMove;
  const selectedLine = selectedContinuation ?? selectedBadMove ?? fallbackLine;
  const selectedLineSteps = selectedLine?.steps ?? lesson.baseLine.steps;
  const safePositionPly = Math.min(Math.max(positionPly, 0), selectedLineSteps.length);
  const activeStep = safePositionPly > 0 ? selectedLineSteps[safePositionPly - 1] ?? null : null;
  const currentChess = useMemo(
    () => buildChessAtPly(selectedLineSteps, safePositionPly),
    [selectedLineSteps, safePositionPly]
  );
  const activeBoard = useMemo(
    () =>
      buildDisplayBoard(
        currentChess,
        lesson.opening.studySide,
        activeStep ? { from: activeStep.from, to: activeStep.to } : null
      ) as readonly BoardSquare[],
    [activeStep, currentChess, lesson.opening.studySide]
  );
  const sideToMove = currentChess.turn() as "w" | "b";
  const selectedPiece = selectedSquare ? currentChess.get(selectedSquare as Square) : undefined;
  const isOpeningChoicePosition = safePositionPly === lesson.baseLine.steps.length;
  const nextLineStep = selectedLineSteps[safePositionPly];
  const allMoveChoices = useMemo(
    () =>
      currentChess.moves({ verbose: true }).map((move) => ({
        move,
        assessment: assessLegalMove(lesson, move, nextLineStep, selectedTarget.kind, isOpeningChoicePosition)
      })),
    [currentChess, isOpeningChoicePosition, lesson, nextLineStep, selectedTarget.kind]
  );
  const recommendedSourceSquares = useMemo(
    () =>
      new Set<string>(
        allMoveChoices
          .filter((choice) => choice.assessment.kind === "recommended")
          .map((choice) => choice.move.from)
      ),
    [allMoveChoices]
  );
  const selectedLegalMoves = useMemo(() => {
    if (!selectedSquare || selectedPiece?.color !== sideToMove) {
      return [] as Move[];
    }

    return currentChess.moves({ square: selectedSquare as Square, verbose: true });
  }, [currentChess, selectedPiece?.color, selectedSquare, sideToMove]);
  const moveChoices = useMemo(
    () =>
      selectedLegalMoves.map((move) => ({
        move,
        assessment: assessLegalMove(lesson, move, nextLineStep, selectedTarget.kind, isOpeningChoicePosition)
      })),
    [isOpeningChoicePosition, lesson, nextLineStep, selectedLegalMoves, selectedTarget.kind]
  );
  const legalMoveByTarget = useMemo(
    () => new Map<string, MoveChoice>(moveChoices.map((choice) => [choice.move.to, choice])),
    [moveChoices]
  );
  const selectedMoveChoice = moveChoices.find((choice) => getMoveKey(choice.move) === selectedMoveKey) ?? null;
  const displayedBoard = moveFeedback?.board ?? activeBoard;
  const boardArrows = useMemo(() => {
    if (moveFeedback) {
      const moveArrow = getBoardArrow(moveFeedback.board, moveFeedback.move.from, moveFeedback.move.to, "move");
      const tacticArrow = moveFeedback.tactic
        ? getBoardArrow(moveFeedback.board, moveFeedback.tactic.from, moveFeedback.tactic.to, "tactic")
        : null;
      return [moveArrow, tacticArrow].filter((arrow): arrow is BoardArrow => Boolean(arrow));
    }

    const moveArrow = activeStep ? getBoardArrow(activeBoard, activeStep.from, activeStep.to, "move") : null;
    return moveArrow ? [moveArrow] : [];
  }, [activeBoard, activeStep, moveFeedback]);
  const interactiveContinuationCards = getInteractiveContinuationCards(lesson);
  const interactiveBadMoveCards = getInteractiveBadMoveCards(lesson);
  const selectedLearningCard = [...interactiveContinuationCards, ...interactiveBadMoveCards].find(
    (card) => card.key === selectedLearningCardKey
  );

  useEffect(() => {
    setSelectedSquare("");
    setSelectedMoveKey("");
  }, [lesson.opening.key, safePositionPly, selectedTarget.key, selectedTarget.kind]);

  function goToPosition(nextPositionPly: number) {
    setSelectedLearningCardKey("");
    setMoveFeedback(null);
    setPositionPly(nextPositionPly);
  }

  function selectContinuation(continuation: OpeningContinuation) {
    setSelectedLearningCardKey("");
    setMoveFeedback(null);
    setSelectedTarget({ kind: "continuation", key: continuation.key });
    setPositionPly(Math.min(firstContinuationPositionPly, continuation.steps.length));
  }

  function selectBadMove(badMove: BadMove) {
    setSelectedLearningCardKey("");
    setMoveFeedback(null);
    setSelectedTarget({ kind: "badMove", key: badMove.key });
    setPositionPly(Math.min(firstContinuationPositionPly, badMove.steps.length));
  }

  function selectLearningCard(card: InteractiveLearningCard) {
    setMoveFeedback(null);
    setSelectedTarget({ kind: "learning", key: card.key });
    setSelectedLearningCardKey(card.key);
    setPositionPly(Math.min(card.focusStepIndex + 1, lesson.baseLine.steps.length));
  }

  function selectOpening(nextLesson: OpeningLesson) {
    const nextFirstContinuation = nextLesson.opening.continuations[0];
    const nextFirstBadMove = nextLesson.opening.badMoves[0];
    const nextLineSteps = nextFirstContinuation?.steps ?? nextFirstBadMove?.steps ?? nextLesson.baseLine.steps;
    const nextInitialPositionPly =
      nextFirstContinuation || nextFirstBadMove ? nextLesson.baseLine.steps.length : getInitialPositionPly(nextLesson);
    setSelectedOpeningKey(nextLesson.opening.key);
    setSelectedTarget({
      kind: nextFirstContinuation ? "continuation" : nextFirstBadMove ? "badMove" : "learning",
      key: nextFirstContinuation?.key ?? nextFirstBadMove?.key ?? ""
    });
    setSelectedLearningCardKey("");
    setMoveFeedback(null);
    setPositionPly(Math.min(nextInitialPositionPly, nextLineSteps.length));
  }

  function selectStudySide(nextSide: StudySide) {
    const nextLesson = lessons.find((candidate) => candidate.opening.studySide === nextSide);
    setStudySideFilter(nextSide);
    setQuery("");
    setPriorityFilter("all");

    if (nextLesson) {
      selectOpening(nextLesson);
    }
  }

  function selectBoardSquare(square: BoardSquare) {
    if (moveFeedback) {
      setMoveFeedback(null);
      setSelectedSquare("");
      setSelectedMoveKey("");
      return;
    }

    const targetChoice = legalMoveByTarget.get(square.square);

    if (selectedSquare && targetChoice) {
      playMoveChoice(targetChoice);
      return;
    }

    if (square.piece) {
      setMoveFeedback(null);
      setSelectedSquare(square.square);
      setSelectedMoveKey("");
      return;
    }

    setSelectedSquare("");
    setSelectedMoveKey("");
  }

  function playMoveChoice(choice: MoveChoice) {
    const feedback = buildMoveFeedback(currentChess, lesson, choice);
    setMoveFeedback(feedback);
    setSelectedSquare("");
    setSelectedMoveKey(getMoveKey(choice.move));

    if (choice.assessment.targetKind === "continuation") {
      const continuation = lesson.opening.continuations.find((candidate) => candidate.key === choice.assessment.targetKey);

      if (continuation) {
        setSelectedLearningCardKey("");
        setSelectedTarget({ kind: "continuation", key: continuation.key });
        setPositionPly(Math.min(firstContinuationPositionPly + 1, continuation.steps.length));
      }
      return;
    }

    if (choice.assessment.targetKind === "badMove") {
      const badMove = lesson.opening.badMoves.find((candidate) => candidate.key === choice.assessment.targetKey);

      if (badMove) {
        setSelectedLearningCardKey("");
        setSelectedTarget({ kind: "badMove", key: badMove.key });
        setPositionPly(Math.min(firstContinuationPositionPly + 1, badMove.steps.length));
      }
      return;
    }

    if (nextLineStep && matchesMove(choice.move, nextLineStep)) {
      setPositionPly(Math.min(safePositionPly + 1, selectedLineSteps.length));
    }
  }

  function openMoveLine(assessment: MoveAssessment) {
    if (assessment.targetKind === "continuation") {
      const continuation = lesson.opening.continuations.find((candidate) => candidate.key === assessment.targetKey);

      if (continuation) {
        setSelectedLearningCardKey("");
        setMoveFeedback(null);
        setSelectedTarget({ kind: "continuation", key: continuation.key });
        setPositionPly(Math.min(firstContinuationPositionPly + 1, continuation.steps.length));
      }
    }

    if (assessment.targetKind === "badMove") {
      const badMove = lesson.opening.badMoves.find((candidate) => candidate.key === assessment.targetKey);

      if (badMove) {
        setSelectedLearningCardKey("");
        setMoveFeedback(null);
        setSelectedTarget({ kind: "badMove", key: badMove.key });
        setPositionPly(Math.min(firstContinuationPositionPly + 1, badMove.steps.length));
      }
    }
  }

  return (
    <main className="shell">
      <section className="workspace" aria-labelledby="opening-title">
        <div className="board-panel">
          <section className="opening-switcher" aria-label="База дебютов">
            <div className="opening-switcher-title">
              <span>База дебютов</span>
              <strong>{`${catalogStats.total} карточек · ${catalogStats.curated} ядро · A/B/C ${catalogStats.a}/${catalogStats.b}/${catalogStats.c}`}</strong>
            </div>
            <div className="study-side-filter" aria-label="Сторона тренировки">
              <button
                aria-pressed={studySideFilter === "white"}
                onClick={() => selectStudySide("white")}
                type="button"
              >
                {`За белых · ${sideStats.white}`}
              </button>
              <button
                aria-pressed={studySideFilter === "black"}
                onClick={() => selectStudySide("black")}
                type="button"
              >
                {`За черных · ${sideStats.black}`}
              </button>
            </div>
            <div className="catalog-controls">
              <input
                aria-label="Поиск дебюта"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск: Сицилианская, ECO, план"
                type="search"
                value={query}
              />
              <div className="priority-filter" aria-label="Фильтр приоритета">
                {(["all", "A", "B", "C"] as const).map((priority) => (
                  <button
                    aria-pressed={priorityFilter === priority}
                    key={priority}
                    onClick={() => setPriorityFilter(priority)}
                    type="button"
                  >
                    {priority === "all" ? "Все" : priority}
                  </button>
                ))}
              </div>
            </div>
            <div className="opening-list">
              {groupedLessons.map((group) => (
                <section className="opening-group" key={group.family} aria-label={group.family}>
                  <h2>{group.family}</h2>
                  <div className="opening-group-list">
                    {group.lessons.map((openingLesson) => (
                      <button
                        aria-pressed={openingLesson.opening.key === lesson.opening.key}
                        key={openingLesson.opening.key}
                        onClick={() => selectOpening(openingLesson)}
                        type="button"
                      >
                        <span>{getPriorityLabel(openingLesson.opening.priority)}</span>
                        <strong>{openingLesson.opening.name}</strong>
                        <em>{getSourceCheckLabel(openingLesson.opening.sourceEvidence)}</em>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
              {filteredLessons.length === 0 ? (
                <p className="empty-filter">Нет карточек под этот фильтр.</p>
              ) : null}
            </div>
          </section>

          <div className="board-toolbar" aria-label="Открытая тренировка">
            <span>{getStudySideStatus(lesson.opening.studySide)}</span>
            <strong>{lesson.opening.name}</strong>
            <span>{`Ход ${getSideNameFromTurn(sideToMove)}: выбери фигуру`}</span>
          </div>

          <div className="piece-style-switcher" aria-label="Вид черных фигур">
            {BLACK_PIECE_STYLES.map((style) => (
              <button
                aria-label={style.label}
                aria-pressed={style.key === blackPieceStyle}
                className={`black-pieces-${style.key}`}
                key={style.key}
                onClick={() => setBlackPieceStyle(style.key)}
                title={style.label}
                type="button"
              >
                <span aria-hidden="true" className="piece piece-black piece-style-sample">
                  ♚
                </span>
              </button>
            ))}
          </div>

          <div
            className={`board perspective-${lesson.opening.studySide} black-pieces-${blackPieceStyle}`}
            aria-label={`Позиция ${getPositionLabel(activeStep)}`}
          >
            <div className="board-grid">
              {displayedBoard.map((square) => {
                const targetChoice = moveFeedback ? undefined : legalMoveByTarget.get(square.square);
                const isSelectedSquare = square.square === selectedSquare;
                const isSelectedMoveTarget = selectedMoveChoice?.move.to === square.square;
                const isRecommendedPiece = !moveFeedback && recommendedSourceSquares.has(square.square);
                const squareLabel = square.piece
                  ? `${square.piece.color === "white" ? "белая" : "черная"} ${square.piece.name} ${square.square}`
                  : `Клетка ${square.square}`;

                return (
                  <button
                    aria-label={
                      targetChoice ? `${squareLabel}. Можно сходить ${targetChoice.move.san}` : squareLabel
                    }
                    aria-pressed={isSelectedSquare || isSelectedMoveTarget}
                    className={[
                      "square",
                      square.shade,
                      square.isMoveFrom ? "is-from" : "",
                      square.isMoveTo ? "is-to" : "",
                      isRecommendedPiece ? "is-recommended-piece" : "",
                      isSelectedSquare ? "is-selected-piece" : "",
                      targetChoice ? "is-legal-target" : "",
                      targetChoice ? `target-${targetChoice.assessment.kind}` : "",
                      isSelectedMoveTarget ? "is-selected-target" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-square={square.square}
                    key={square.square}
                    onClick={() => selectBoardSquare(square)}
                    title={targetChoice ? `${targetChoice.move.san}: ${targetChoice.assessment.label}` : square.square}
                    type="button"
                  >
                    {square.showRank ? <span className="coord coord-rank">{square.rank}</span> : null}
                    {square.showFile ? <span className="coord coord-file">{square.file}</span> : null}
                    {targetChoice ? <span aria-hidden="true" className="legal-target-dot" /> : null}
                    {square.piece ? (
                      <span
                        aria-hidden="true"
                        className={[
                          "piece",
                          `piece-${square.piece.color}`,
                          square.piece.name === "пешка" ? "piece-pawn" : ""
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {square.piece.symbol}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {boardArrows.length > 0 ? (
              <svg aria-hidden="true" className="move-arrow" viewBox="0 0 100 100">
                <defs>
                  <marker
                    id="arrow-head-move"
                    markerHeight="2.4"
                    markerWidth="2.4"
                    orient="auto-start-reverse"
                    refX="1.92"
                    refY="1.2"
                  >
                    <path className="arrow-head-move" d="M0,0 L2.4,1.2 L0,2.4 Z" />
                  </marker>
                  <marker
                    id="arrow-head-tactic"
                    markerHeight="2.4"
                    markerWidth="2.4"
                    orient="auto-start-reverse"
                    refX="1.92"
                    refY="1.2"
                  >
                    <path className="arrow-head-tactic" d="M0,0 L2.4,1.2 L0,2.4 Z" />
                  </marker>
                </defs>
                {boardArrows.map((boardArrow, index) => (
                  <line
                    className={`arrow-line-${boardArrow.kind}`}
                    key={`${boardArrow.kind}-${index}`}
                    markerEnd={`url(#arrow-head-${boardArrow.kind})`}
                    x1={boardArrow.x1}
                    x2={boardArrow.x2}
                    y1={boardArrow.y1}
                    y2={boardArrow.y2}
                  />
                ))}
              </svg>
            ) : null}
          </div>

          <section className="board-explorer" aria-labelledby="board-explorer-title">
            <button
              aria-label="Предыдущий ход"
              className="step-arrow"
              disabled={safePositionPly === 0}
              onClick={() => goToPosition(safePositionPly - 1)}
              type="button"
            >
              ←
            </button>
            <article className="board-step-card">
              <div>
                <span>{activeStep ? formatMove(activeStep) : "Старт"}</span>
                <strong>{`${safePositionPly} / ${selectedLineSteps.length}`}</strong>
              </div>
              <h2 id="board-explorer-title">
                {selectedLearningCard
                  ? `${selectedLearningCard.label}: ${selectedLearningCard.title}`
                  : activeStep
                    ? activeStep.title
                    : "Начало учебной линии"}
              </h2>
              {selectedLearningCard ? (
                <InsightText text={selectedLearningCard.body} />
              ) : (
                <p>
                  {activeStep
                    ? activeStep.explanation
                    : `Позиция перед первым ходом линии: ${lesson.input}. Выбери фигуру и сравни ход с проверенной подсказкой.`}
                </p>
              )}
              <p>
                {selectedLearningCard
                  ? `На доске показан связанный момент: ${activeStep ? formatMove(activeStep) : "старт линии"}.`
                  : nextLineStep
                    ? `Следующий проверенный ход: ${formatMove(nextLineStep)}. ${nextLineStep.purpose}`
                    : "Линия дошла до учебной табии; дальше ориентируйся на план до миттельшпиля."}
              </p>
            </article>
            <button
              aria-label="Следующий ход"
              className="step-arrow"
              disabled={safePositionPly === selectedLineSteps.length}
              onClick={() => goToPosition(safePositionPly + 1)}
              type="button"
            >
              →
            </button>
          </section>

          <div className="move-dots" aria-label="Положение в варианте">
            <button
              aria-label="Перейти к старту линии"
              aria-pressed={safePositionPly === 0}
              className={safePositionPly === 0 ? "active" : ""}
              onClick={() => goToPosition(0)}
              type="button"
            />
            {selectedLineSteps.map((step, index) => (
              <button
                aria-label={`Перейти к ходу ${formatMove(step)}`}
                aria-pressed={index + 1 === safePositionPly}
                className={index + 1 === safePositionPly ? "active" : ""}
                key={`${step.ply}-${step.san}`}
                onClick={() => goToPosition(index + 1)}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="lesson-panel">
          <div className="title-row">
            <div>
              <p className="eyebrow">
                {lesson.opening.priority
                  ? `Приоритет ${lesson.opening.priority} · ${getSourceCheckLabel(lesson.opening.sourceEvidence)}`
                  : "Проверенный пример ядра"}
              </p>
              <h1 id="opening-title">{lesson.opening.name}</h1>
            </div>
            <span className="status-pill">{lesson.status}</span>
          </div>

          <MoveCoach
            activeStep={activeStep}
            moveFeedback={moveFeedback}
            nextLineStep={nextLineStep}
            moveChoices={moveChoices}
            onOpenMoveLine={openMoveLine}
            onResetMoveFeedback={() => setMoveFeedback(null)}
            onSelectMove={playMoveChoice}
            selectedMoveChoice={selectedMoveChoice}
            selectedPiece={selectedPiece}
            selectedSquare={selectedSquare}
            sideToMove={sideToMove}
          />

          <div className="insight-grid">
            <article>
              <h2>Принцип</h2>
              <InsightText text={lesson.opening.whyItMatters ?? lesson.opening.principle} />
            </article>
            <article>
              <h2>Цель позиции</h2>
              <InsightText text={lesson.opening.positionGoal} />
            </article>
            <article>
              <h2>План до миттельшпиля</h2>
              <InsightText text={lesson.opening.middlegameTabia ?? lesson.opening.middlegamePlan} />
            </article>
          </div>

          <section className="continuations" aria-labelledby="continuations-title">
            <h2 id="continuations-title">Типовые продолжения</h2>
            <p className="section-note">Показаны все проверенные продолжения и планы, которые есть в текущей базе для этой позиции.</p>
            <div className="continuation-list">
              {lesson.opening.continuations.length ? (
                lesson.opening.continuations.map((continuation) => (
                  <button
                    aria-pressed={selectedTarget.kind === "continuation" && continuation.key === selectedLine?.key}
                    className="continuation"
                    key={continuation.key}
                    onClick={() => selectContinuation(continuation)}
                    type="button"
                  >
                    <span className="continuation-title">
                      <strong>{continuation.san}</strong>
                      <span>{continuation.label}</span>
                    </span>
                    <span className="continuation-idea">{continuation.idea}</span>
                  </button>
                ))
              ) : (
                interactiveContinuationCards.map((card) => (
                  <button
                    aria-pressed={selectedLearningCard?.key === card.key}
                    className="continuation continuation-learning"
                    key={card.key}
                    onClick={() => selectLearningCard(card)}
                    type="button"
                  >
                    <span className="continuation-title">
                      <strong>{card.title}</strong>
                      <span>{card.label}</span>
                    </span>
                    <div className="continuation-idea continuation-static-copy">
                      <InsightText text={card.body} />
                      <span className="card-board-link">{card.focusLabel}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="bad-moves" aria-labelledby="bad-moves-title">
            <h2 id="bad-moves-title">Плохие ходы</h2>
            <p className="section-note">Это не список всех плохих ходов, а приоритетные ошибки: те, которые чаще всего ломают план позиции.</p>
            <div className="bad-move-list">
              {lesson.opening.badMoves.length ? (
                lesson.opening.badMoves.map((badMove) => (
                  <button
                    aria-pressed={selectedTarget.kind === "badMove" && badMove.key === selectedLine?.key}
                    className="bad-move"
                    key={badMove.key}
                    onClick={() => selectBadMove(badMove)}
                    type="button"
                  >
                    <span className="bad-move-title">
                      <strong>{badMove.san}</strong>
                      <span>{badMove.label}</span>
                    </span>
                    <span className="bad-move-copy">
                      <span>{badMove.whyBad}</span>
                      <span>{badMove.betterPlan}</span>
                    </span>
                  </button>
                ))
              ) : (
                interactiveBadMoveCards.map((card) => (
                  <button
                    aria-pressed={selectedLearningCard?.key === card.key}
                    className="bad-move bad-move-learning"
                    key={card.key}
                    onClick={() => selectLearningCard(card)}
                    type="button"
                  >
                    <span className="bad-move-title">
                      <strong>{card.title}</strong>
                      <span>{card.label}</span>
                    </span>
                    <div className="bad-move-copy">
                      <InsightText text={card.body} />
                      <span className="card-board-link">{card.focusLabel}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

        </div>
      </section>
    </main>
  );
}

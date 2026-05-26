"use client";

import { Chess, type Move, type Square } from "chess.js";
import { useMemo, useState } from "react";

import { buildOpeningLessons } from "../src/domain/chess/opening-database.mjs";
import { getMoveQualityHint } from "../src/domain/chess/move-quality-hints.mjs";
import { createFreeMoveRecordsFromSteps } from "../src/domain/chess/trainer-session.mjs";

type StudySide = "white" | "black";
type ChessColor = "w" | "b";
type TrainerMode = "catalog" | "free";

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
  fenBefore: string;
  fenAfter: string;
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

type BadMoveSource = Readonly<{
  status: "verified" | "candidate" | "rejected";
  kind: "manual-review" | "book" | "lichess-explorer" | "lichess-cloud-eval" | "lichess-puzzle";
  title: string;
  url?: string;
  note: string;
}>;

type BadMove = Readonly<{
  key: string;
  san: string;
  label: string;
  whyBad: string;
  betterPlan: string;
  anchorPly: number;
  anchorFen: string;
  anchorLineSan: readonly string[];
  source: BadMoveSource;
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

type TheoryGameExample = Readonly<{
  event: string;
  white: string;
  black: string;
  whiteElo: string;
  blackElo: string;
  whiteTitle: string;
  blackTitle: string;
  result: string;
  date: string;
  opening: string;
  eco: string;
  gameUrl: string;
  broadcastUrl: string;
}>;

type TheoryBroadcastMove = Readonly<{
  san: string;
  games: number;
  white: number;
  draw: number;
  black: number;
  unknown: number;
  examples: readonly TheoryGameExample[];
}>;

type PositionTheoryEvidence = Readonly<{
  openingKey: string;
  openingName: string;
  studySide: StudySide;
  sourceName: string;
  lineKey: string;
  lineLabel: string;
  anchorPly: number;
  anchorFen: string;
  positionKey: string;
  expectedSan: string;
  verifiedBadMoves: readonly string[];
  lichessBroadcast: Readonly<{
    moves: readonly TheoryBroadcastMove[];
  }>;
}>;

type TheoryReferenceSource = Readonly<{
  key: string;
  title: string;
  author: string;
  publisher: string;
  url: string;
  kind: "open-data" | "bibliographic" | "classification";
  role: string;
  usage: string;
}>;

type SelectedTarget = Readonly<{
  kind: "continuation" | "badMove" | "learning";
  key: string;
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
    referenceSources?: readonly TheoryReferenceSource[];
    positionTheory: readonly PositionTheoryEvidence[];
    continuations: readonly OpeningContinuation[];
    badMoves: readonly BadMove[];
  }>;
}>;

type BoardArrow = Readonly<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}> | null;

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

type StudyStepContext = Readonly<{
  step: MoveStep;
  stepIndex: number;
  relationLabel: string;
}>;

type StepContinuationCard = Readonly<{
  key: string;
  san: string;
  idea: string;
  stepIndex: number;
}>;

type TheoryMoveCard = Readonly<{
  key: string;
  san: string;
  label: string;
  idea: string;
  source: string;
  qualityHint: MoveQualityHint;
  isActionable: boolean;
}>;

type LessonLine = Readonly<{
  key: string;
  label: string;
  sanLine: readonly string[];
  steps: readonly MoveStep[];
}>;

type StudyMovePlan = Readonly<{
  lessonName: string;
  lineLabel: string;
  step: MoveStep;
  nextSameActorStep: MoveStep | null;
  plan: string;
}>;

type FreeMoveRecord = Readonly<{
  san: string;
  from: string;
  to: string;
  actor: StudySide;
  actorLabel: string;
  moveNumber: number;
  pieceName: string;
  title: string;
  explanation: string;
  purpose: string;
  before: string;
  after: string;
}>;

type FreeCoach = Readonly<{
  label: string;
  copy: string;
  source: string;
  tone: "good" | "known" | "unknown";
}>;

type FreeLineMoveCard = Readonly<{
  key: string;
  san: string;
  label: string;
  idea: string;
  source: string;
}>;

type MoveQualityHint = ReturnType<typeof getMoveQualityHint>;

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const PIECE_SYMBOLS: Readonly<Record<ChessColor, Readonly<Record<string, string>>>> = Object.freeze({
  b: Object.freeze({
    b: "♝",
    k: "♚",
    n: "♞",
    p: "♟",
    q: "♛",
    r: "♜"
  }),
  w: Object.freeze({
    b: "♗",
    k: "♔",
    n: "♘",
    p: "♙",
    q: "♕",
    r: "♖"
  })
});

const PIECE_NAMES: Readonly<Record<string, string>> = Object.freeze({
  b: "слон",
  k: "король",
  n: "конь",
  p: "пешка",
  q: "ферзь",
  r: "ладья"
});

const PIECE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  B: "слон",
  K: "король",
  N: "конь",
  Q: "ферзь",
  R: "ладья"
});

const MOVE_NOTATION_PATTERN =
  /\.{3}(?:O-O-O|O-O|0-0-0|0-0|[KQRBN][a-h][1-8]-[a-h][1-8][+#]?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8][+#]?|[a-h]x[a-h][1-8][+#]?|[a-h][1-8]-[a-h][1-8]|[a-h][1-8])|(?:O-O-O|O-O|0-0-0|0-0|[KQRBN][a-h][1-8]-[a-h][1-8][+#]?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8][+#]?|[a-h]x[a-h][1-8][+#]?|[a-h][1-8]-[a-h][1-8])/g;

function colorToStudySide(color: ChessColor): StudySide {
  return color === "w" ? "white" : "black";
}

function getStudySideName(side: StudySide) {
  return side === "white" ? "белые" : "черные";
}

function getStudySidePlayName(side: StudySide) {
  return side === "white" ? "белых" : "черных";
}

function getDisplaySquares(perspective: StudySide) {
  const files = perspective === "white" ? FILES : [...FILES].reverse();
  const ranks = perspective === "white" ? [...RANKS].reverse() : RANKS;

  return ranks.flatMap((rank) =>
    files.map((file) => {
      const fileIndex = FILES.indexOf(file);
      const rankIndex = RANKS.indexOf(rank);
      const shade: "light" | "dark" = (fileIndex + rankIndex) % 2 === 1 ? "light" : "dark";
      return {
        file,
        rank,
        square: `${file}${rank}` as Square,
        shade,
        showFile: perspective === "white" ? rank === "1" : rank === "8",
        showRank: perspective === "white" ? file === "a" : file === "h"
      };
    })
  );
}

function buildInteractiveBoard(
  chess: Chess,
  perspective: StudySide,
  lastMove: FreeMoveRecord | null,
  selectedSquare: string
): readonly BoardSquare[] {
  return getDisplaySquares(perspective).map((displaySquare) => {
    const piece = chess.get(displaySquare.square);
    const isSelected = selectedSquare === displaySquare.square;

    return {
      file: displaySquare.file,
      rank: displaySquare.rank,
      square: displaySquare.square,
      shade: displaySquare.shade,
      showFile: displaySquare.showFile,
      showRank: displaySquare.showRank,
      isMoveFrom: isSelected || lastMove?.from === displaySquare.square,
      isMoveTo: lastMove?.to === displaySquare.square,
      piece: piece
        ? {
            color: colorToStudySide(piece.color as ChessColor),
            name: PIECE_NAMES[piece.type] ?? "фигура",
            symbol: PIECE_SYMBOLS[piece.color as ChessColor]?.[piece.type] ?? ""
          }
        : null
    } satisfies BoardSquare;
  });
}

function replayFreeChess(moves: readonly FreeMoveRecord[]) {
  const chess = new Chess();

  for (const move of moves) {
    chess.move(move.san, { strict: true });
  }

  return chess;
}

function getFenMoveNumber(fen: string) {
  const parsed = Number(fen.split(" ")[5]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getFreeMoveRecord(move: Move): FreeMoveRecord {
  const actor = colorToStudySide(move.color as ChessColor);
  const actorLabel = actor === "white" ? "Белые" : "Черные";
  const pieceName = PIECE_NAMES[move.piece] ?? "фигура";
  const action = move.isCapture() ? "берет" : "идет";
  const destination = move.isCapture() ? `на ${move.to}` : `с ${move.from} на ${move.to}`;

  return {
    san: move.san,
    from: move.from,
    to: move.to,
    actor,
    actorLabel,
    moveNumber: getFenMoveNumber(move.before),
    pieceName,
    title: `${actorLabel}: ${move.san}`,
    explanation: `${actorLabel} делают ход ${move.san}: ${pieceName} ${action} ${destination}.`,
    purpose: "Оценка ниже опирается на совпадение с проверенными линиями и практикой из реальных партий.",
    before: move.before,
    after: move.after
  };
}

function formatMove(step: MoveStep) {
  const separator = step.actor === "black" ? "..." : ".";
  return `${step.moveNumber}${separator} ${step.san}`;
}

function formatFreeMove(move: FreeMoveRecord) {
  const separator = move.actor === "black" ? "..." : ".";
  return `${move.moveNumber}${separator} ${move.san}`;
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

function getBoardMoveArrow(board: readonly BoardSquare[], fromSquare: string, toSquare: string): BoardArrow {
  const from = getSquareCenter(board, fromSquare);
  const to = getSquareCenter(board, toSquare);
  if (!from || !to) {
    return null;
  }

  return {
    x1: from.x,
    y1: from.y,
    x2: to.x,
    y2: to.y
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

function getBadMoveSourceLabel(source: BadMoveSource) {
  if (source.kind === "lichess-cloud-eval") {
    return "Источник: Lichess cloud eval";
  }

  if (source.kind === "lichess-explorer") {
    return "Источник: Lichess Explorer";
  }

  if (source.kind === "lichess-puzzle") {
    return "Источник: Lichess puzzle DB";
  }

  if (source.kind === "book") {
    return `Источник: ${source.title}`;
  }

  return "Источник: ручная проверка";
}

function normalizeFenForTheory(fen: string) {
  return fen.split(" ").slice(0, 4).join(" ");
}

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function getTheoryEvidenceForStep(lesson: OpeningLesson, step: MoveStep) {
  const normalizedFen = normalizeFenForTheory(step.fenBefore);

  return (
    lesson.opening.positionTheory.find((position) => position.anchorFen === step.fenBefore) ??
    lesson.opening.positionTheory.find((position) => position.positionKey === normalizedFen) ??
    null
  );
}

function getTheoryMoveStat(evidence: PositionTheoryEvidence | null, san: string) {
  return evidence?.lichessBroadcast.moves.find((move) => move.san === san) ?? null;
}

function getStudySideScore(move: TheoryBroadcastMove, studySide: StudySide) {
  const decisiveTotal = move.white + move.draw + move.black;

  if (decisiveTotal <= 0) {
    return null;
  }

  const score = studySide === "white" ? move.white + move.draw * 0.5 : move.black + move.draw * 0.5;

  return `${Math.round((score / decisiveTotal) * 100)}% результата за сторону`;
}

function getTheoryExampleLabel(move: TheoryBroadcastMove) {
  const example = move.examples[0];

  if (!example) {
    return "";
  }

  const players = [example.white, example.black].filter(Boolean).join(" - ");
  const date = example.date ? `, ${example.date}` : "";
  const opening = example.opening || example.eco ? `; ${[example.eco, example.opening].filter(Boolean).join(" ")}` : "";

  return players ? `Пример: ${players}${date}${opening}.` : "";
}

function getTheoryMoveSource(move: TheoryBroadcastMove, totalGames: number, studySide: StudySide) {
  const score = getStudySideScore(move, studySide);
  const share = formatPercent(move.games, totalGames);
  const scoreText = score ? `, ${score}` : "";

  return `Lichess Broadcast DB 2026: ${move.games} партий, ${share}${scoreText}`;
}

function getTheoryMoveQualityStats(
  evidence: PositionTheoryEvidence | null,
  san: string,
  studySide: StudySide
) {
  const move = getTheoryMoveStat(evidence, san);
  const totalGames = evidence?.lichessBroadcast.moves.reduce((total, candidate) => total + candidate.games, 0) ?? 0;

  if (!move || totalGames <= 0) {
    return null;
  }

  return {
    games: move.games,
    totalGames,
    source: getTheoryMoveSource(move, totalGames, studySide)
  };
}

function getBadMoveAtPosition(lessons: readonly OpeningLesson[], fen: string, san: string) {
  return (
    lessons
      .flatMap((candidate) => candidate.opening.badMoves)
      .find((badMove) => badMove.anchorFen === fen && badMove.san === san && badMove.source.status === "verified") ??
    null
  );
}

function stripPlanPrefix(text: string) {
  return text
    .replace(/^Связь с твоим планом:\s*/i, "")
    .replace(/^Смысл:\s*/i, "")
    .trim();
}

function getStudyMovePlans(
  lessons: readonly OpeningLesson[],
  previousSanLine: readonly string[],
  san: string
): readonly StudyMovePlan[] {
  const nextSanLine = [...previousSanLine, san];
  const moveIndex = previousSanLine.length;

  return lessons.flatMap((lesson) =>
    getLessonLines(lesson)
      .filter((line) => lineMatchesPrefix(line.sanLine, nextSanLine))
      .flatMap((line) => {
        const step = line.steps[moveIndex];

        if (!step || step.san !== san) {
          return [];
        }

        return [
          {
            lessonName: lesson.opening.name,
            lineLabel: line.label,
            step,
            nextSameActorStep: line.steps.slice(moveIndex + 1).find((candidate) => candidate.actor === step.actor) ?? null,
            plan: stripPlanPrefix(step.purpose)
          }
        ];
      })
  );
}

function getStudyMovePlanMap(
  lessons: readonly OpeningLesson[],
  previousSanLine: readonly string[]
): ReadonlyMap<string, readonly StudyMovePlan[]> {
  const plansBySan = new Map<string, StudyMovePlan[]>();

  for (const lesson of lessons) {
    for (const line of getLessonLines(lesson)) {
      if (!lineMatchesPrefix(line.sanLine, previousSanLine)) {
        continue;
      }

      const nextSan = line.sanLine[previousSanLine.length];
      if (!nextSan) {
        continue;
      }

      plansBySan.set(nextSan, [
        ...(plansBySan.get(nextSan) ?? []),
        ...getStudyMovePlans([lesson], previousSanLine, nextSan)
      ]);
    }
  }

  return plansBySan;
}

function formatStudyMoveSummary(plans: readonly StudyMovePlan[]) {
  const primary = plans[0];

  if (!primary) {
    return "";
  }

  return [primary.step.explanation, primary.plan ? `План: ${primary.plan}` : ""].filter(Boolean).join(" ");
}

function formatStudyMoveRecommendation(plans: readonly StudyMovePlan[]) {
  const primary = plans[0];

  if (!primary) {
    return "";
  }

  const nextMove = primary.nextSameActorStep
    ? `Дальше за ${getStudySidePlayName(primary.step.actor)} в этой карте: ${primary.nextSameActorStep.san} - ${primary.nextSameActorStep.explanation}`
    : "";
  const lineNames = [...new Set(plans.map((plan) => plan.lineLabel))]
    .slice(0, 2)
    .join("; ");

  return [
    `Ориентир базы: ${lineNames || primary.lessonName}.`,
    nextMove,
    primary.plan ? `Когда использовать: ${primary.plan}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function getMoveQualitySource(planCount: number, theoryStats: ReturnType<typeof getTheoryMoveQualityStats>) {
  const planSource = planCount > 0 ? `Источник: ${planCount} ${formatStudyLineCount(planCount)} текущей базы.` : "";
  const theorySource = theoryStats?.source;

  return [planSource, theorySource].filter(Boolean).join(" ");
}

function formatStudyLineCount(count: number) {
  const remainder = count % 10;
  const teenRemainder = count % 100;

  if (remainder === 1 && teenRemainder !== 11) {
    return "учебная линия";
  }

  if (remainder >= 2 && remainder <= 4 && (teenRemainder < 12 || teenRemainder > 14)) {
    return "учебные линии";
  }

  return "учебных линий";
}

function getFreeMoveQualityHint(
  allLessons: readonly OpeningLesson[],
  move: FreeMoveRecord,
  previousSanLine: readonly string[]
) {
  const previousMatchingLessons = getLessonsMatchingLine(allLessons, previousSanLine);
  const nextMatchingLessons = getLessonsMatchingLine(allLessons, [...previousSanLine, move.san]);
  const knownAlternatives = getFreeLineMoveCards(previousMatchingLessons, previousSanLine).filter(
    (alternative) => alternative.san !== move.san
  );
  const evidence = getBestTheoryEvidenceForFen(allLessons, move.before);
  const theoryStats = getTheoryMoveQualityStats(evidence, move.san, move.actor);
  const badMove = getBadMoveAtPosition(allLessons, move.before, move.san);
  const studyMovePlans = getStudyMovePlans(allLessons, previousSanLine, move.san);

  return getMoveQualityHint({
    san: move.san,
    badMove: badMove
      ? {
          sourceKind: badMove.source.kind,
          label: badMove.label,
          betterPlan: badMove.betterPlan
        }
      : null,
    theoryGames: theoryStats?.games,
    theoryTotalGames: theoryStats?.totalGames,
    matchingLineCount: nextMatchingLessons.length,
    hasKnownAlternative: knownAlternatives.length > 0,
    educationalSummary: formatStudyMoveSummary(studyMovePlans),
    educationalRecommendation: formatStudyMoveRecommendation(studyMovePlans),
    alternativeMoves: knownAlternatives,
    source:
      getMoveQualitySource(studyMovePlans.length, theoryStats) ||
      (nextMatchingLessons.length > 0 ? "Источник: проверенные линии текущей базы." : undefined)
  });
}

function getTheoryMoveCards(
  evidence: PositionTheoryEvidence | null,
  studySide: StudySide,
  expectedSan: string,
  studyMovePlansBySan: ReadonlyMap<string, readonly StudyMovePlan[]> = new Map()
): readonly TheoryMoveCard[] {
  const moves = evidence?.lichessBroadcast.moves ?? [];
  const totalGames = moves.reduce((total, move) => total + move.games, 0);

  return moves.slice(0, 4).map((move, index) => {
    const studyMovePlans = studyMovePlansBySan.get(move.san) ?? [];
    const source = getMoveQualitySource(studyMovePlans.length, {
      games: move.games,
      totalGames,
      source: getTheoryMoveSource(move, totalGames, studySide)
    });
    const educationalSummary = formatStudyMoveSummary(studyMovePlans);
    const educationalRecommendation = formatStudyMoveRecommendation(studyMovePlans);

    return {
      key: `${evidence?.positionKey ?? "theory"}-${move.san}-${index}`,
      san: move.san,
      label:
        move.san === expectedSan
          ? "Ход текущей линии"
          : studyMovePlans.length > 0
            ? "План из базы"
            : "Статистика без плана",
      idea: [
        educationalSummary || "В текущей базе пока нет учебного продолжения для этого хода.",
        getTheoryMoveSource(move, totalGames, studySide),
        getTheoryExampleLabel(move)
      ]
        .filter(Boolean)
        .join(" "),
      source: studyMovePlans.length > 0 ? "Источник: учебная база и реальные broadcast-партии Lichess" : "Источник: реальные broadcast-партии Lichess",
      qualityHint: getMoveQualityHint({
        san: move.san,
        isKnownContinuation: move.san === expectedSan && studyMovePlans.length > 0,
        theoryGames: move.games,
        theoryTotalGames: totalGames,
        educationalSummary,
        educationalRecommendation,
        source
      }),
      isActionable: studyMovePlans.length > 0
    };
  });
}

function getLessonLines(lesson: OpeningLesson): readonly LessonLine[] {
  return [
    {
      key: `${lesson.opening.key}-base`,
      label: lesson.opening.name,
      sanLine: lesson.appliedSan,
      steps: lesson.baseLine.steps
    },
    ...lesson.opening.continuations.map((continuation) => ({
      key: continuation.key,
      label: `${lesson.opening.name}: ${continuation.label}`,
      sanLine: [...lesson.appliedSan, ...continuation.lineSan],
      steps: continuation.steps
    }))
  ];
}

function lineMatchesPrefix(line: readonly string[], prefix: readonly string[]) {
  return prefix.length <= line.length && prefix.every((san, index) => line[index] === san);
}

function getLessonsMatchingLine(lessons: readonly OpeningLesson[], playedSan: readonly string[]) {
  if (playedSan.length === 0) {
    return lessons;
  }

  return lessons.filter((lesson) => getLessonLines(lesson).some((line) => lineMatchesPrefix(line.sanLine, playedSan)));
}

function getBestTheoryEvidenceForFen(lessons: readonly OpeningLesson[], fen: string) {
  const positionKey = normalizeFenForTheory(fen);
  const matchingEvidence = lessons
    .flatMap((lesson) => lesson.opening.positionTheory)
    .filter((position) => position.anchorFen === fen || position.positionKey === positionKey);

  return (
    matchingEvidence.sort(
      (left, right) =>
        right.lichessBroadcast.moves.reduce((total, move) => total + move.games, 0) -
        left.lichessBroadcast.moves.reduce((total, move) => total + move.games, 0)
    )[0] ?? null
  );
}

function getFreeLineMoveCards(
  lessons: readonly OpeningLesson[],
  playedSan: readonly string[]
): readonly FreeLineMoveCard[] {
  const moveMap = new Map<
    string,
    {
      labels: Set<string>;
      count: number;
    }
  >();

  for (const lesson of lessons) {
    for (const line of getLessonLines(lesson)) {
      if (!lineMatchesPrefix(line.sanLine, playedSan)) {
        continue;
      }

      const nextSan = line.sanLine[playedSan.length];
      if (!nextSan) {
        continue;
      }

      const current = moveMap.get(nextSan) ?? { labels: new Set<string>(), count: 0 };
      current.labels.add(line.label);
      current.count += 1;
      moveMap.set(nextSan, current);
    }
  }

  return [...moveMap.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([san, meta]) => {
      const labels = [...meta.labels].slice(0, 2).join("; ");
      return {
        key: `free-line-${playedSan.join("-")}-${san}`,
        san,
        label: meta.count > 1 ? `${meta.count} линии` : "Линия базы",
        idea: labels ? `Подходит к: ${labels}.` : "Следующий ход из проверенной базы.",
        source: "Источник: проверенные линии текущей базы"
      };
    });
}

function getFreeCoach(
  lastMove: FreeMoveRecord | null,
  matchingLessons: readonly OpeningLesson[],
  allLessons: readonly OpeningLesson[],
  previousSanLine: readonly string[]
): FreeCoach {
  if (!lastMove) {
    return {
      label: "Стартовая позиция",
      copy: "Выбери цвет, сделай первый легальный ход на доске, и база сразу отфильтрует подходящие дебютные линии.",
      source: "Оценка появится после первого хода.",
      tone: "known"
    };
  }

  const studyMovePlans = getStudyMovePlans(allLessons, previousSanLine, lastMove.san);
  const educationalSummary = formatStudyMoveSummary(studyMovePlans);
  const educationalRecommendation = formatStudyMoveRecommendation(studyMovePlans);

  if (educationalSummary) {
    return {
      label: "Есть план в базе",
      copy: `${educationalSummary} ${educationalRecommendation}`,
      source: getMoveQualitySource(
        studyMovePlans.length,
        getTheoryMoveQualityStats(getBestTheoryEvidenceForFen(allLessons, lastMove.before), lastMove.san, lastMove.actor)
      ) || "Источник: проверенные учебные линии текущей базы.",
      tone: "known"
    };
  }

  const evidence = getBestTheoryEvidenceForFen(allLessons, lastMove.before);
  const moveStat = getTheoryMoveStat(evidence, lastMove.san);
  const totalGames = evidence?.lichessBroadcast.moves.reduce((total, move) => total + move.games, 0) ?? 0;

  if (moveStat && totalGames > 0) {
    return {
      label: "Есть только статистика",
      copy: `${lastMove.explanation} В текущей базе пока нет учебного плана для этого хода, поэтому не считаю его рекомендацией.`,
      source: getTheoryMoveSource(moveStat, totalGames, lastMove.actor),
      tone: "unknown"
    };
  }

  if (matchingLessons.length > 0) {
    return {
      label: "Есть в дебютной базе",
      copy: `${lastMove.explanation} После него осталось ${matchingLessons.length} подходящих карточек, значит ход совпадает с текущей учебной картой.`,
      source: "Источник: проверенные линии текущей базы",
      tone: "known"
    };
  }

  return {
    label: "Вне текущей карты",
    copy: `${lastMove.explanation} В текущей базе и собранной broadcast-выборке для этой позиции нет подтверждения этого продолжения.`,
    source: "Не показываю шахматный вывод как факт без источника.",
    tone: "unknown"
  };
}

function getContinuationSourceCopy(
  evidence: PositionTheoryEvidence | null,
  san: string,
  studySide: StudySide
) {
  const move = getTheoryMoveStat(evidence, san);
  const totalGames = evidence?.lichessBroadcast.moves.reduce((total, candidate) => total + candidate.games, 0) ?? 0;

  return move ? getTheoryMoveSource(move, totalGames, studySide) : "";
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

function cleanNotationToken(token: string) {
  return token.replace(/\.\.\./, "").replace(/0/g, "O").replace(/[+#]$/, "");
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

function MoveQualityBadge({
  hint,
  compact = false
}: Readonly<{
  hint: MoveQualityHint | null;
  compact?: boolean;
}>) {
  if (!hint) {
    return null;
  }

  return (
    <span
      aria-label={`${hint.label}: ${hint.summary} ${hint.source}`}
      className={["move-quality-badge", `move-quality-${hint.tone}`, compact ? "move-quality-compact" : ""]
        .filter(Boolean)
        .join(" ")}
      title={`${hint.label}. ${hint.summary} ${hint.source}`}
    >
      <span className="move-quality-symbol">{hint.symbol}</span>
      <span className="move-quality-label">{hint.label}</span>
    </span>
  );
}

function MoveQualityDetails({ hint }: Readonly<{ hint: MoveQualityHint | null }>) {
  if (!hint) {
    return null;
  }

  return (
    <div className={`move-quality-details move-quality-details-${hint.tone}`}>
      <p>
        <strong>Почему:</strong> {hint.summary}
      </p>
      <p>
        <strong>Как лучше:</strong> {hint.recommendation}
      </p>
      <p>
        <strong>Проверка:</strong> {hint.source}
      </p>
    </div>
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

function getStudyStepContext(
  steps: readonly MoveStep[],
  currentIndex: number,
  studySide: StudySide
): StudyStepContext | null {
  const currentStep = steps[currentIndex];

  if (!currentStep) {
    return null;
  }

  if (currentStep.actor === studySide) {
    return {
      step: currentStep,
      stepIndex: currentIndex,
      relationLabel: "Текущий твой ход"
    };
  }

  for (let index = currentIndex + 1; index < steps.length; index += 1) {
    const nextStep = steps[index];

    if (nextStep?.actor === studySide) {
      return {
        step: nextStep,
        stepIndex: index,
        relationLabel: "Следующий твой ход"
      };
    }
  }

  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const previousStep = steps[index];

    if (previousStep?.actor === studySide) {
      return {
        step: previousStep,
        stepIndex: index,
        relationLabel: "Последний твой ход"
      };
    }
  }

  return {
    step: currentStep,
    stepIndex: currentIndex,
    relationLabel: "Текущий ход"
  };
}

function getNextStudyStepIndex(steps: readonly MoveStep[], startIndex: number, studySide: StudySide) {
  for (let index = startIndex + 1; index < steps.length; index += 1) {
    if (steps[index]?.actor === studySide) {
      return index;
    }
  }

  return null;
}

function getStepContinuationCards(
  steps: readonly MoveStep[],
  context: StudyStepContext,
  studySide: StudySide
): readonly StepContinuationCard[] {
  const cards: StepContinuationCard[] = [
    {
      key: `study-step-${context.step.ply}`,
      san: context.step.san,
      idea: `${context.step.explanation} ${context.step.purpose}`,
      stepIndex: context.stepIndex
    }
  ];
  const nextStudyStepIndex = getNextStudyStepIndex(steps, context.stepIndex, studySide);
  const nextStudyStep = nextStudyStepIndex === null ? null : steps[nextStudyStepIndex];

  if (nextStudyStep && nextStudyStepIndex !== null) {
    cards.push({
      key: `study-step-next-${nextStudyStep.ply}`,
      san: nextStudyStep.san,
      idea: `${nextStudyStep.explanation} ${nextStudyStep.purpose}`,
      stepIndex: nextStudyStepIndex
    });
  }

  return cards;
}

export default function OpeningTrainer() {
  const lessons = useMemo(() => buildOpeningLessons() as readonly OpeningLesson[], []);
  const initialLesson = lessons.find((candidate) => candidate.opening.studySide === "white") ?? lessons[0];
  const [trainerMode, setTrainerMode] = useState<TrainerMode>("catalog");
  const [studySideFilter, setStudySideFilter] = useState<StudySide>(initialLesson?.opening.studySide ?? "white");
  const [freeSide, setFreeSide] = useState<StudySide>(initialLesson?.opening.studySide ?? "white");
  const [freeMoves, setFreeMoves] = useState<readonly FreeMoveRecord[]>([]);
  const [freeSelectedSquare, setFreeSelectedSquare] = useState("");
  const [freeMoveError, setFreeMoveError] = useState("");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | OpeningPriority>("all");
  const [selectedOpeningKey, setSelectedOpeningKey] = useState(initialLesson?.opening.key ?? "");
  const freeSanLine = useMemo(() => freeMoves.map((move) => move.san), [freeMoves]);
  const freeChess = useMemo(() => replayFreeChess(freeMoves), [freeMoves]);
  const freeLastMove = freeMoves[freeMoves.length - 1] ?? null;
  const freeMatchingLessons = useMemo(() => getLessonsMatchingLine(lessons, freeSanLine), [lessons, freeSanLine]);
  const sideLessons = useMemo(
    () => lessons.filter((candidate) => candidate.opening.studySide === studySideFilter),
    [lessons, studySideFilter]
  );
  const activeCatalogLessons = trainerMode === "free" ? freeMatchingLessons : sideLessons;
  const catalogStats = useMemo(() => {
    const researchLessons = activeCatalogLessons.filter((candidate) => candidate.opening.priority);
    return {
      total: activeCatalogLessons.length,
      curated: activeCatalogLessons.length - researchLessons.length,
      a: researchLessons.filter((candidate) => candidate.opening.priority === "A").length,
      b: researchLessons.filter((candidate) => candidate.opening.priority === "B").length,
      c: researchLessons.filter((candidate) => candidate.opening.priority === "C").length
    };
  }, [activeCatalogLessons]);
  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return activeCatalogLessons.filter((candidate) => {
      const priorityMatches = priorityFilter === "all" || candidate.opening.priority === priorityFilter;
      const queryMatches = normalizedQuery.length === 0 || buildLessonSearchText(candidate).includes(normalizedQuery);
      return priorityMatches && queryMatches;
    });
  }, [activeCatalogLessons, priorityFilter, query]);
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
    activeCatalogLessons.find((candidate) => candidate.opening.key === selectedOpeningKey) ??
    sideLessons.find((candidate) => candidate.opening.key === selectedOpeningKey) ??
    filteredLessons[0] ??
    activeCatalogLessons[0] ??
    sideLessons[0] ??
    lessons[0]!;
  const firstContinuation = lesson.opening.continuations[0];
  const firstBadMove = lesson.opening.badMoves[0];
  const baseStepIndex = Math.max(lesson.baseLine.steps.length - 1, 0);
  const firstContinuationStepIndex = lesson.baseLine.steps.length;
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>({
    kind: firstContinuation ? "continuation" : firstBadMove ? "badMove" : "learning",
    key: firstContinuation?.key ?? firstBadMove?.key ?? ""
  });
  const [stepIndex, setStepIndex] = useState(firstContinuationStepIndex);
  const [selectedLearningCardKey, setSelectedLearningCardKey] = useState("");

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
  const safeStepIndex = Math.min(Math.max(stepIndex, 0), Math.max(selectedLineSteps.length - 1, 0));
  const activeStep = selectedLineSteps[safeStepIndex] ?? lesson.baseLine.steps[baseStepIndex];
  const catalogSeedMoves = useMemo(
    () => createFreeMoveRecordsFromSteps(selectedLineSteps, safeStepIndex) as readonly FreeMoveRecord[],
    [selectedLineSteps, safeStepIndex]
  );
  const boardMoves = trainerMode === "free" ? freeMoves : catalogSeedMoves;
  const boardChess = useMemo(() => replayFreeChess(boardMoves), [boardMoves]);
  const boardLastMove = boardMoves[boardMoves.length - 1] ?? null;
  const interactiveContinuationCards = getInteractiveContinuationCards(lesson);
  const selectedLearningCard = interactiveContinuationCards.find(
    (card) => card.key === selectedLearningCardKey
  );
  const studyStepContext = getStudyStepContext(selectedLineSteps, safeStepIndex, lesson.opening.studySide);
  const studyStepPreviousSanLine = studyStepContext
    ? selectedLineSteps.slice(0, studyStepContext.stepIndex).map((step) => step.san)
    : [];
  const studyMovePlansBySanForStep = studyStepContext
    ? getStudyMovePlanMap([lesson], studyStepPreviousSanLine)
    : new Map<string, readonly StudyMovePlan[]>();
  const theoryEvidenceForStep = studyStepContext ? getTheoryEvidenceForStep(lesson, studyStepContext.step) : null;
  const theoryMoveCards = studyStepContext
    ? getTheoryMoveCards(
        theoryEvidenceForStep,
        lesson.opening.studySide,
        studyStepContext.step.san,
        studyMovePlansBySanForStep
      )
    : [];
  const knownContinuationsForStep =
    studyStepContext && studyStepContext.step.fenBefore === lesson.fen ? lesson.opening.continuations : [];
  const knownBadMovesForStep =
    studyStepContext
      ? lesson.opening.badMoves.filter((badMove) => badMove.anchorFen === studyStepContext.step.fenBefore)
      : [];
  const stepContinuationCards = studyStepContext
    ? getStepContinuationCards(selectedLineSteps, studyStepContext, lesson.opening.studySide)
    : [];
  const freeCoach = useMemo(
    () => getFreeCoach(freeLastMove, freeMatchingLessons, lessons, freeSanLine.slice(0, -1)),
    [freeLastMove, freeMatchingLessons, freeSanLine, lessons]
  );
  const freeLineMoveCards = useMemo(
    () => getFreeLineMoveCards(freeMatchingLessons, freeSanLine),
    [freeMatchingLessons, freeSanLine]
  );
  const freeTheoryEvidence = useMemo(
    () => getBestTheoryEvidenceForFen(lessons, freeChess.fen()),
    [lessons, freeChess]
  );
  const freeStudyMovePlansBySan = useMemo(
    () => getStudyMovePlanMap(freeMatchingLessons, freeSanLine),
    [freeMatchingLessons, freeSanLine]
  );
  const freeTheoryMoveCards = useMemo(
    () => getTheoryMoveCards(freeTheoryEvidence, freeSide, freeLineMoveCards[0]?.san ?? "", freeStudyMovePlansBySan),
    [freeTheoryEvidence, freeLineMoveCards, freeSide, freeStudyMovePlansBySan]
  );
  const freeQualityHint = useMemo(
    () => (freeLastMove ? getFreeMoveQualityHint(lessons, freeLastMove, freeSanLine.slice(0, -1)) : null),
    [freeLastMove, freeSanLine, lessons]
  );
  const freeLineMoveCardsWithoutTheory = useMemo(
    () => freeLineMoveCards.filter((card) => !freeTheoryMoveCards.some((theoryCard) => theoryCard.san === card.san)),
    [freeLineMoveCards, freeTheoryMoveCards]
  );
  const activeBadMoveForStep =
    selectedBadMove && selectedBadMove.anchorFen === activeStep.fenBefore && selectedBadMove.san === activeStep.san
      ? selectedBadMove
      : null;
  const activeStepTheoryStats = getTheoryMoveQualityStats(
    getTheoryEvidenceForStep(lesson, activeStep),
    activeStep.san,
    activeStep.actor
  );
  const activeIsStudyMove = activeStep.actor === lesson.opening.studySide;
  const activeStudyMovePlans = getStudyMovePlans(
    [lesson],
    selectedLineSteps.slice(0, safeStepIndex).map((step) => step.san),
    activeStep.san
  );
  const activeMoveQualityHint = getMoveQualityHint({
    san: activeStep.san,
    badMove: activeBadMoveForStep
      ? {
          sourceKind: activeBadMoveForStep.source.kind,
          label: activeBadMoveForStep.label,
          betterPlan: activeBadMoveForStep.betterPlan
        }
      : null,
    isKnownContinuation: !activeBadMoveForStep && !activeIsStudyMove,
    isExpectedStep: !activeBadMoveForStep && activeIsStudyMove,
    theoryGames: activeStepTheoryStats?.games,
    theoryTotalGames: activeStepTheoryStats?.totalGames,
    hasKnownAlternative:
      theoryMoveCards.length > 0 || knownContinuationsForStep.length > 0 || stepContinuationCards.length > 0,
    educationalSummary: formatStudyMoveSummary(activeStudyMovePlans),
    educationalRecommendation: formatStudyMoveRecommendation(activeStudyMovePlans),
    source: getMoveQualitySource(activeStudyMovePlans.length, activeStepTheoryStats) || "Источник: проверенная линия текущей базы."
  });
  const boardPerspective = trainerMode === "free" ? freeSide : lesson.opening.studySide;
  const displayedBoard = useMemo(
    () => buildInteractiveBoard(boardChess, boardPerspective, boardLastMove, freeSelectedSquare),
    [boardChess, boardLastMove, boardPerspective, freeSelectedSquare]
  );
  const displayedArrow = useMemo(
    () => (boardLastMove ? getBoardMoveArrow(displayedBoard, boardLastMove.from, boardLastMove.to) : null),
    [boardLastMove, displayedBoard]
  );
  const boardLabel =
    trainerMode === "free"
      ? `Свободная тренировка: ${freeLastMove ? freeLastMove.title : "стартовая позиция"}`
      : `Позиция после ${formatMove(activeStep)}`;

  function enterFreeTraining() {
    const nextSide = trainerMode === "free" ? freeSide : studySideFilter;
    setTrainerMode("free");
    setFreeSide(nextSide);
    setStudySideFilter(nextSide);
    setFreeMoves([]);
    setFreeSelectedSquare("");
    setFreeMoveError("");
    setQuery("");
    setPriorityFilter("all");
  }

  function resetFreeTraining() {
    setFreeMoves([]);
    setFreeSelectedSquare("");
    setFreeMoveError("");
  }

  function selectFreeTrainingSide(nextSide: StudySide) {
    setFreeSide(nextSide);
    setStudySideFilter(nextSide);
    setTrainerMode("free");
    setFreeSelectedSquare("");
    setFreeMoveError("");
  }

  function applyFreeSanMove(san: string) {
    try {
      const chess = replayFreeChess(freeMoves);
      const move = chess.move(san, { strict: true });
      setFreeMoves([...freeMoves, getFreeMoveRecord(move)]);
      setFreeSelectedSquare("");
      setFreeMoveError("");
    } catch {
      setFreeMoveError(`Ход ${san} сейчас нелегален в этой позиции.`);
    }
  }

  function enterFreeAnalysisFromPosition(moves: readonly FreeMoveRecord[]) {
    if (trainerMode === "free") {
      return;
    }

    setTrainerMode("free");
    setFreeSide(boardPerspective);
    setStudySideFilter(boardPerspective);
    setFreeMoves(moves);
    setQuery("");
    setPriorityFilter("all");
  }

  function handleFreeSquareClick(squareName: string) {
    const square = squareName as Square;
    const currentMoves = trainerMode === "free" ? freeMoves : catalogSeedMoves;
    const currentChess = replayFreeChess(currentMoves);
    const turn = currentChess.turn() as ChessColor;
    const piece = currentChess.get(square);

    if (!freeSelectedSquare) {
      if (piece?.color === turn) {
        enterFreeAnalysisFromPosition(currentMoves);
        setFreeSelectedSquare(square);
        setFreeMoveError("");
        return;
      }

      if (!piece && trainerMode !== "free") {
        return;
      }

      enterFreeAnalysisFromPosition(currentMoves);
      setFreeMoveError(`Сейчас ходят ${getStudySideName(colorToStudySide(turn))}.`);
      return;
    }

    if (freeSelectedSquare === square) {
      setFreeSelectedSquare("");
      setFreeMoveError("");
      return;
    }

    try {
      const chess = replayFreeChess(currentMoves);
      const move = chess.move({ from: freeSelectedSquare, to: square, promotion: "q" });
      enterFreeAnalysisFromPosition(currentMoves);
      setFreeMoves([...currentMoves, getFreeMoveRecord(move)]);
      setFreeSelectedSquare("");
      setFreeMoveError("");
    } catch {
      if (piece?.color === turn) {
        enterFreeAnalysisFromPosition(currentMoves);
        setFreeSelectedSquare(square);
        setFreeMoveError("");
        return;
      }

      setFreeMoveError("Такой ход сейчас нелегален.");
    }
  }

  function undoFreeMove() {
    setFreeMoves(freeMoves.slice(0, -1));
    setFreeSelectedSquare("");
    setFreeMoveError("");
  }

  function goToStep(nextStepIndex: number) {
    setSelectedLearningCardKey("");
    setStepIndex(nextStepIndex);
    setFreeMoves(createFreeMoveRecordsFromSteps(selectedLineSteps, nextStepIndex) as readonly FreeMoveRecord[]);
    setFreeSelectedSquare("");
    setFreeMoveError("");
  }

  function selectContinuation(continuation: OpeningContinuation) {
    const nextStepIndex = Math.min(firstContinuationStepIndex, continuation.steps.length - 1);
    setSelectedLearningCardKey("");
    setSelectedTarget({ kind: "continuation", key: continuation.key });
    setStepIndex(nextStepIndex);
    setFreeMoves(createFreeMoveRecordsFromSteps(continuation.steps, nextStepIndex) as readonly FreeMoveRecord[]);
    setFreeSelectedSquare("");
    setFreeMoveError("");
  }

  function selectBadMove(badMove: BadMove) {
    const nextStepIndex = Math.min(firstContinuationStepIndex, badMove.steps.length - 1);
    setSelectedLearningCardKey("");
    setSelectedTarget({ kind: "badMove", key: badMove.key });
    setStepIndex(nextStepIndex);
    setFreeMoves(createFreeMoveRecordsFromSteps(badMove.steps, nextStepIndex) as readonly FreeMoveRecord[]);
    setFreeSelectedSquare("");
    setFreeMoveError("");
  }

  function selectLearningCard(card: InteractiveLearningCard) {
    setSelectedTarget({ kind: "learning", key: card.key });
    setSelectedLearningCardKey(card.key);
    setStepIndex(card.focusStepIndex);
    setFreeMoves(createFreeMoveRecordsFromSteps(lesson.baseLine.steps, card.focusStepIndex) as readonly FreeMoveRecord[]);
    setFreeSelectedSquare("");
    setFreeMoveError("");
  }

  function selectOpening(nextLesson: OpeningLesson) {
    const nextFirstContinuation = nextLesson.opening.continuations[0];
    const nextFirstBadMove = nextLesson.opening.badMoves[0];
    const nextLineSteps = nextFirstContinuation?.steps ?? nextFirstBadMove?.steps ?? nextLesson.baseLine.steps;
    const nextStepIndex = Math.min(nextLesson.baseLine.steps.length, Math.max(nextLineSteps.length - 1, 0));
    setSelectedOpeningKey(nextLesson.opening.key);
    setStudySideFilter(nextLesson.opening.studySide);
    setFreeSide(nextLesson.opening.studySide);
    setSelectedTarget({
      kind: nextFirstContinuation ? "continuation" : nextFirstBadMove ? "badMove" : "learning",
      key: nextFirstContinuation?.key ?? nextFirstBadMove?.key ?? ""
    });
    setSelectedLearningCardKey("");
    setFreeMoves(createFreeMoveRecordsFromSteps(nextLineSteps, nextStepIndex) as readonly FreeMoveRecord[]);
    setFreeSelectedSquare("");
    setFreeMoveError("");
    setStepIndex(nextStepIndex);
  }

  function selectStudySide(nextSide: StudySide) {
    const nextLesson = lessons.find((candidate) => candidate.opening.studySide === nextSide);
    setStudySideFilter(nextSide);
    setFreeSide(nextSide);
    setQuery("");
    setPriorityFilter("all");

    if (nextLesson) {
      selectOpening(nextLesson);
    }
  }

  function selectToolbarSide(nextSide: StudySide) {
    if (trainerMode === "free") {
      selectFreeTrainingSide(nextSide);
      return;
    }

    selectStudySide(nextSide);
  }

  function togglePriorityFilter(priority: OpeningPriority) {
    setPriorityFilter(priorityFilter === priority ? "all" : priority);
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
            <div className="catalog-controls">
              <input
                aria-label="Поиск дебюта"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск: Сицилианская, ECO, план"
                type="search"
                value={query}
              />
              <div className="training-toolbar" aria-label="Управление тренировкой">
                <div className="training-toolbar-group toolbar-reset">
                  <button
                    aria-label="Сбросить в начальную позицию"
                    aria-pressed={trainerMode === "free" && freeMoves.length === 0}
                    onClick={enterFreeTraining}
                    type="button"
                  >
                    ↺
                  </button>
                </div>
                <div className="training-toolbar-group toolbar-side" aria-label="Сторона тренировки">
                  <button
                    aria-label="Играть за белых"
                    aria-pressed={(trainerMode === "free" ? freeSide : studySideFilter) === "white"}
                    onClick={() => selectToolbarSide("white")}
                    type="button"
                  >
                    ♕
                  </button>
                  <button
                    aria-label="Играть за черных"
                    aria-pressed={(trainerMode === "free" ? freeSide : studySideFilter) === "black"}
                    onClick={() => selectToolbarSide("black")}
                    type="button"
                  >
                    ♛
                  </button>
                </div>
                <div className="training-toolbar-group toolbar-priority" aria-label="Фильтр приоритета">
                  <span>Приоритет</span>
                  <div className="priority-buttons">
                    {(["A", "B", "C"] as const).map((priority) => (
                      <button
                        aria-label={
                          priority === "A"
                            ? "Приоритет A: обязательно"
                            : priority === "B"
                              ? "Приоритет B: практично"
                              : "Приоритет C: узнавание"
                        }
                        aria-pressed={priorityFilter === priority}
                        key={priority}
                        onClick={() => togglePriorityFilter(priority)}
                        type="button"
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
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

          <div
            className={[
              "board",
              "board-interactive",
              `perspective-${boardPerspective}`,
              trainerMode === "free" ? "board-free" : ""
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={boardLabel}
          >
            <div className="board-grid">
              {displayedBoard.map((square) => (
                <button
                  aria-label={`${square.square}${square.piece ? `, ${square.piece.color === "white" ? "белая" : "черная"} ${square.piece.name}` : ""}`}
                  className={[
                    "square",
                    square.shade,
                    square.isMoveFrom ? "is-from" : "",
                    square.isMoveTo ? "is-to" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-square={square.square}
                  key={square.square}
                  onClick={() => handleFreeSquareClick(square.square)}
                  title={square.square}
                  type="button"
                >
                  {square.showRank ? <span className="coord coord-rank">{square.rank}</span> : null}
                  {square.showFile ? <span className="coord coord-file">{square.file}</span> : null}
                  {square.piece ? (
                    <span
                      aria-label={`${square.piece.color === "white" ? "белая" : "черная"} ${square.piece.name} ${square.square}`}
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
              ))}
            </div>
            {displayedArrow ? (
              <svg aria-hidden="true" className="move-arrow" viewBox="0 0 100 100">
                <defs>
                  <marker
                    id="arrow-head"
                    markerHeight="2.4"
                    markerWidth="2.4"
                    orient="auto-start-reverse"
                    refX="1.92"
                    refY="1.2"
                  >
                    <path d="M0,0 L2.4,1.2 L0,2.4 Z" />
                  </marker>
                </defs>
                <line
                  markerEnd="url(#arrow-head)"
                  x1={displayedArrow.x1}
                  x2={displayedArrow.x2}
                  y1={displayedArrow.y1}
                  y2={displayedArrow.y2}
                />
              </svg>
            ) : null}
          </div>

          {trainerMode === "free" ? (
            <>
              <section className="board-explorer free-board-explorer" aria-labelledby="board-explorer-title">
                <button
                  aria-label="Отменить ход"
                  className="step-arrow"
                  disabled={freeMoves.length === 0}
                  onClick={undoFreeMove}
                  type="button"
                >
                  ←
                </button>
                <article className="board-step-card free-step-card">
                  <div>
                    <span>{freeLastMove ? formatFreeMove(freeLastMove) : "0"}</span>
                    <MoveQualityBadge hint={freeQualityHint} />
                    <strong>{`${freeMoves.length} ходов`}</strong>
                  </div>
                  <h2 id="board-explorer-title">{freeCoach.label}</h2>
                  <p>{freeCoach.copy}</p>
                  <MoveQualityDetails hint={freeQualityHint} />
                  <p>{freeMoveError || freeCoach.source}</p>
                </article>
                <button
                  aria-label="Сбросить позицию"
                  className="step-arrow"
                  disabled={freeMoves.length === 0}
                  onClick={resetFreeTraining}
                  type="button"
                >
                  0
                </button>
              </section>
              {freeMoves.length ? (
                <div className="free-move-line" aria-label="Сыгранная линия">
                  {freeMoves.map((move, index) => {
                    const moveQuality = getFreeMoveQualityHint(
                      lessons,
                      move,
                      freeMoves.slice(0, index).map((playedMove) => playedMove.san)
                    );

                    return (
                      <button
                        aria-label={`Вернуться к ходу ${formatFreeMove(move)}`}
                        key={`${move.san}-${index}`}
                        onClick={() => setFreeMoves(freeMoves.slice(0, index + 1))}
                        type="button"
                      >
                        {formatFreeMove(move)}
                        <MoveQualityBadge hint={moveQuality} compact />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <section className="board-explorer" aria-labelledby="board-explorer-title">
                <button
                  aria-label="Предыдущий ход"
                  className="step-arrow"
                  disabled={safeStepIndex === 0}
                  onClick={() => goToStep(safeStepIndex - 1)}
                  type="button"
                >
                  ←
                </button>
                <article className="board-step-card">
                  <div>
                    <span>{formatMove(activeStep)}</span>
                    <MoveQualityBadge hint={activeMoveQualityHint} />
                    <strong>{`${safeStepIndex + 1} / ${selectedLineSteps.length}`}</strong>
                  </div>
                  <h2 id="board-explorer-title">
                    {selectedLearningCard
                      ? `${selectedLearningCard.label}: ${selectedLearningCard.title}`
                      : activeStep.title}
                  </h2>
                  {selectedLearningCard ? (
                    <InsightText text={selectedLearningCard.body} />
                  ) : (
                    <p>{activeStep.explanation}</p>
                  )}
                  <MoveQualityDetails hint={activeMoveQualityHint} />
                  <p>
                    {selectedLearningCard
                      ? `На доске показан связанный момент: ${formatMove(activeStep)}.`
                      : activeStep.purpose}
                  </p>
                </article>
                <button
                  aria-label="Следующий ход"
                  className="step-arrow"
                  disabled={safeStepIndex === selectedLineSteps.length - 1}
                  onClick={() => goToStep(safeStepIndex + 1)}
                  type="button"
                >
                  →
                </button>
              </section>

              <div className="move-dots" aria-label="Положение в варианте">
                {selectedLineSteps.map((step, index) => (
                  <button
                    aria-label={`Перейти к ходу ${formatMove(step)}`}
                    aria-pressed={index === safeStepIndex}
                    className={index === safeStepIndex ? "active" : ""}
                    key={`${step.ply}-${step.san}`}
                    onClick={() => goToStep(index)}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lesson-panel">
          {trainerMode === "free" ? (
            <>
              <div className="title-row">
                <div>
                  <p className="eyebrow">С нуля</p>
                  <h1 id="opening-title">Свободная тренировка</h1>
                </div>
                <span className="status-pill">0</span>
              </div>

              <div className="insight-grid">
                <article>
                  <h2>Цвет</h2>
                  <p>{`Играем за ${getStudySidePlayName(freeSide)}; доска развернута под выбранную сторону.`}</p>
                </article>
                <article>
                  <h2>Совпадения</h2>
                  <p>{`${freeMatchingLessons.length} линий в базе подходят к сыгранной последовательности.`}</p>
                </article>
                <article className={`free-coach-tone-${freeCoach.tone}`}>
                  <h2>Оценка</h2>
                  <p>
                    {freeQualityHint ? (
                      <MoveQualityBadge hint={freeQualityHint} compact />
                    ) : (
                      freeCoach.label
                    )}
                  </p>
                </article>
              </div>

              <section className="continuations" aria-labelledby="continuations-title">
                <h2 id="continuations-title">Варианты из теории</h2>
                <p className="section-note">
                  Показаны только ходы, которые есть в реальных broadcast-партиях Lichess или в проверенных линиях базы.
                </p>
                <div className="continuation-list">
                  {freeTheoryMoveCards.map((card) =>
                    card.isActionable ? (
                      <button
                        className="continuation continuation-theory"
                        key={card.key}
                        onClick={() => applyFreeSanMove(card.san)}
                        type="button"
                      >
                        <span className="continuation-title">
                          <span className="move-card-heading">
                            <strong>{card.san}</strong>
                            <MoveQualityBadge hint={card.qualityHint} compact />
                          </span>
                          <span>{card.label}</span>
                        </span>
                        <span className="continuation-idea">
                          {card.idea}
                          <span className="continuation-source">{card.source}</span>
                        </span>
                      </button>
                    ) : (
                      <article className="continuation continuation-theory continuation-reference" key={card.key}>
                        <span className="continuation-title">
                          <span className="move-card-heading">
                            <strong>{card.san}</strong>
                            <MoveQualityBadge hint={card.qualityHint} compact />
                          </span>
                          <span>{card.label}</span>
                        </span>
                        <span className="continuation-idea">
                          {card.idea}
                          <span className="continuation-source">{card.source}</span>
                        </span>
                      </article>
                    )
                  )}
                  {freeLineMoveCardsWithoutTheory.map((card) => {
                    const qualityHint = getMoveQualityHint({
                      san: card.san,
                      isKnownContinuation: true,
                      source: card.source
                    });

                    return (
                      <button
                        className="continuation continuation-step"
                        key={card.key}
                        onClick={() => applyFreeSanMove(card.san)}
                        type="button"
                      >
                        <span className="continuation-title">
                          <span className="move-card-heading">
                            <strong>{card.san}</strong>
                            <MoveQualityBadge hint={qualityHint} compact />
                          </span>
                          <span>{card.label}</span>
                        </span>
                        <span className="continuation-idea">
                          {card.idea}
                          <span className="continuation-source">{card.source}</span>
                        </span>
                      </button>
                    );
                  })}
                  {freeTheoryMoveCards.length === 0 && freeLineMoveCardsWithoutTheory.length === 0 ? (
                    <article className="empty-filter free-empty-theory">
                      Для этой позиции в текущей базе нет подтвержденных продолжений.
                    </article>
                  ) : null}
                </div>
              </section>

              <section className="continuations free-matches" aria-labelledby="free-matches-title">
                <h2 id="free-matches-title">Подходящие дебюты</h2>
                <p className="section-note">
                  Список слева отфильтрован по сыгранным ходам и показывает учебные карты за обе стороны.
                </p>
                <div className="free-match-line">
                  <strong>{freeMatchingLessons.length}</strong>
                  <span>карточек с планом</span>
                </div>
              </section>
            </>
          ) : (
            <>
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

              {lesson.opening.referenceSources?.length ? (
                <div className="source-strip" aria-label="Источники проверки">
                  <strong>Источники проверки:</strong>
                  {lesson.opening.referenceSources.map((source) => (
                    <a href={source.url} key={source.key} rel="noreferrer" target="_blank" title={source.role}>
                      {source.title}
                    </a>
                  ))}
                </div>
              ) : null}

              {studyStepContext ? (
                <div className="study-step-context" aria-live="polite">
                  <strong>{formatMove(studyStepContext.step)}</strong>
                  <p>Карточки ниже относятся к этому ходу выбранного варианта.</p>
                </div>
              ) : null}

              <section className="continuations" aria-labelledby="continuations-title">
                <h2 id="continuations-title">Типовые продолжения</h2>
                <p className="section-note">
                  {studyStepContext
                    ? theoryEvidenceForStep
                      ? `Для ${formatMove(studyStepContext.step)}: показаны ходы из реальных broadcast-партий Lichess и проверенной линии.`
                      : `Для ${formatMove(studyStepContext.step)}: показаны варианты из базы или следующий проверенный ход этой линии.`
                    : "Показаны все проверенные продолжения и планы, которые есть в текущей базе для этой позиции."}
                </p>
                <div className="continuation-list">
                  {knownContinuationsForStep.length ? (
                    knownContinuationsForStep.map((continuation) => {
                      const sourceCopy = getContinuationSourceCopy(
                        theoryEvidenceForStep,
                        continuation.san,
                        lesson.opening.studySide
                      );
                      const qualityHint = getMoveQualityHint({
                        san: continuation.san,
                        isKnownContinuation: true,
                        source: sourceCopy || "Источник: проверенное продолжение текущей базы."
                      });

                      return (
                        <button
                          aria-pressed={selectedTarget.kind === "continuation" && continuation.key === selectedLine?.key}
                          className="continuation"
                          key={continuation.key}
                          onClick={() => selectContinuation(continuation)}
                          type="button"
                        >
                          <span className="continuation-title">
                            <span className="move-card-heading">
                              <strong>{continuation.san}</strong>
                              <MoveQualityBadge hint={qualityHint} compact />
                            </span>
                            <span>{continuation.label}</span>
                          </span>
                          <span className="continuation-idea">
                            {continuation.idea}
                            {sourceCopy ? <span className="continuation-source">{sourceCopy}</span> : null}
                          </span>
                        </button>
                      );
                    })
                  ) : theoryMoveCards.length ? (
                    theoryMoveCards.map((card) => (
                      <article className="continuation continuation-theory" key={card.key}>
                        <span className="continuation-title">
                          <span className="move-card-heading">
                            <strong>{card.san}</strong>
                            <MoveQualityBadge hint={card.qualityHint} compact />
                          </span>
                          <span>{card.label}</span>
                        </span>
                        <span className="continuation-idea">
                          {card.idea}
                          <span className="continuation-source">{card.source}</span>
                        </span>
                      </article>
                    ))
                  ) : stepContinuationCards.length ? (
                    stepContinuationCards.map((card) => {
                      const qualityHint = getMoveQualityHint({
                        san: card.san,
                        isExpectedStep: true,
                        source: "Источник: текущая проверенная линия."
                      });

                      return (
                        <button
                          aria-pressed={card.stepIndex === safeStepIndex}
                          className="continuation continuation-step"
                          key={card.key}
                          onClick={() => goToStep(card.stepIndex)}
                          type="button"
                        >
                          <span className="continuation-title">
                            <span className="move-card-heading">
                              <strong>{card.san}</strong>
                              <MoveQualityBadge hint={qualityHint} compact />
                            </span>
                          </span>
                          <span className="continuation-idea">{card.idea}</span>
                        </button>
                      );
                    })
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

              {knownBadMovesForStep.length ? (
                <section className="bad-moves" aria-labelledby="bad-moves-title">
                  <h2 id="bad-moves-title">Плохие ходы</h2>
                  <p className="section-note">
                    {studyStepContext
                      ? `Для ${formatMove(studyStepContext.step)}: показаны только конкретные ошибки, заведенные в базе для этой позиции.`
                      : "Это не список всех плохих ходов, а конкретные проверенные ошибки для позиции."}
                  </p>
                  <div className="bad-move-list">
                    {knownBadMovesForStep.map((badMove) => {
                      const qualityHint = getMoveQualityHint({
                        san: badMove.san,
                        badMove: {
                          sourceKind: badMove.source.kind,
                          label: badMove.label,
                          betterPlan: badMove.betterPlan
                        }
                      });

                      return (
                        <button
                          aria-pressed={selectedTarget.kind === "badMove" && badMove.key === selectedLine?.key}
                          className="bad-move"
                          key={badMove.key}
                          onClick={() => selectBadMove(badMove)}
                          type="button"
                        >
                          <span className="bad-move-title">
                            <span className="move-card-heading">
                              <strong>{badMove.san}</strong>
                              <MoveQualityBadge hint={qualityHint} compact />
                            </span>
                            <span>{badMove.label}</span>
                          </span>
                          <span className="bad-move-copy">
                            <span>{badMove.whyBad}</span>
                            <span className="bad-move-better-plan">{badMove.betterPlan}</span>
                            <span className="bad-move-source">{getBadMoveSourceLabel(badMove.source)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

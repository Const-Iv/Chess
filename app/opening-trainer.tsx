"use client";

import { useMemo, useState } from "react";

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

type SelectedTarget = Readonly<{
  kind: "continuation" | "badMove";
  key: string;
}>;

type RuyLopezLesson = Readonly<{
  status: "ПРОВЕРЕНО";
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

const BLACK_PIECE_STYLES: readonly Readonly<{
  key: BlackPieceStyle;
  label: string;
}>[] = Object.freeze([
  Object.freeze({ key: "original", label: "Как было" }),
  Object.freeze({ key: "inverted-white", label: "Инверсия белых" })
]);

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

function getMoveArrow(step: MoveStep): BoardArrow {
  const from = getSquareCenter(step.board, step.from);
  const to = getSquareCenter(step.board, step.to);
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

export default function OpeningTrainer({ lessons }: Readonly<{ lessons: readonly RuyLopezLesson[] }>) {
  const [selectedOpeningKey, setSelectedOpeningKey] = useState(lessons[0]?.opening.key ?? "");
  const [blackPieceStyle, setBlackPieceStyle] = useState<BlackPieceStyle>("original");
  const lesson = lessons.find((candidate) => candidate.opening.key === selectedOpeningKey) ?? lessons[0]!;
  const firstContinuation = lesson.opening.continuations[0];
  const firstBadMove = lesson.opening.badMoves[0];
  const baseStepIndex = Math.max(lesson.baseLine.steps.length - 1, 0);
  const firstContinuationStepIndex = lesson.baseLine.steps.length;
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>({
    kind: firstContinuation ? "continuation" : "badMove",
    key: firstContinuation?.key ?? firstBadMove?.key ?? ""
  });
  const [stepIndex, setStepIndex] = useState(firstContinuationStepIndex);

  const selectedContinuation =
    selectedTarget.kind === "continuation"
      ? lesson.opening.continuations.find((continuation) => continuation.key === selectedTarget.key)
      : undefined;
  const selectedBadMove =
    selectedTarget.kind === "badMove"
      ? lesson.opening.badMoves.find((badMove) => badMove.key === selectedTarget.key)
      : undefined;
  const selectedLine = selectedContinuation ?? selectedBadMove ?? firstContinuation ?? firstBadMove;
  const selectedLineSteps = selectedLine?.steps ?? lesson.baseLine.steps;
  const safeStepIndex = Math.min(Math.max(stepIndex, 0), Math.max(selectedLineSteps.length - 1, 0));
  const activeStep = selectedLineSteps[safeStepIndex] ?? lesson.baseLine.steps[baseStepIndex];
  const arrow = useMemo(() => getMoveArrow(activeStep), [activeStep]);

  function selectContinuation(continuation: OpeningContinuation) {
    setSelectedTarget({ kind: "continuation", key: continuation.key });
    setStepIndex(Math.min(firstContinuationStepIndex, continuation.steps.length - 1));
  }

  function selectBadMove(badMove: BadMove) {
    setSelectedTarget({ kind: "badMove", key: badMove.key });
    setStepIndex(Math.min(firstContinuationStepIndex, badMove.steps.length - 1));
  }

  function selectOpening(nextLesson: RuyLopezLesson) {
    const nextFirstContinuation = nextLesson.opening.continuations[0];
    const nextFirstBadMove = nextLesson.opening.badMoves[0];
    const nextLineSteps = nextFirstContinuation?.steps ?? nextFirstBadMove?.steps ?? nextLesson.baseLine.steps;
    setSelectedOpeningKey(nextLesson.opening.key);
    setSelectedTarget({
      kind: nextFirstContinuation ? "continuation" : "badMove",
      key: nextFirstContinuation?.key ?? nextFirstBadMove?.key ?? ""
    });
    setStepIndex(Math.min(nextLesson.baseLine.steps.length, Math.max(nextLineSteps.length - 1, 0)));
  }

  return (
    <main className="shell">
      <section className="workspace" aria-labelledby="opening-title">
        <div className="board-panel">
          <section className="opening-switcher" aria-label="База дебютов">
            <div className="opening-switcher-title">
              <span>База дебютов</span>
              <strong>{`${lessons.length} проверенных позиций`}</strong>
            </div>
            <div className="opening-list">
              {lessons.map((openingLesson) => (
                <button
                  aria-pressed={openingLesson.opening.key === lesson.opening.key}
                  key={openingLesson.opening.key}
                  onClick={() => selectOpening(openingLesson)}
                  type="button"
                >
                  <span>{openingLesson.opening.family}</span>
                  <strong>{openingLesson.opening.name}</strong>
                </button>
              ))}
            </div>
          </section>

          <div className="board-toolbar" aria-label="Текущий дебют">
            <span>{lesson.opening.studyLabel}</span>
            <strong>{lesson.opening.name}</strong>
            <span>{lesson.opening.turnLabel}</span>
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
            aria-label={`Позиция после ${formatMove(activeStep)}`}
          >
            <div className="board-grid">
              {activeStep.board.map((square) => (
                <div
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
                  title={square.square}
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
                </div>
              ))}
            </div>
            {arrow ? (
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
                  x1={arrow.x1}
                  x2={arrow.x2}
                  y1={arrow.y1}
                  y2={arrow.y2}
                />
              </svg>
            ) : null}
          </div>

          <section className="board-explorer" aria-labelledby="board-explorer-title">
            <button
              aria-label="Предыдущий ход"
              className="step-arrow"
              disabled={safeStepIndex === 0}
              onClick={() => setStepIndex(safeStepIndex - 1)}
              type="button"
            >
              ←
            </button>
            <article className="board-step-card">
              <div>
                <span>{formatMove(activeStep)}</span>
                <strong>{`${safeStepIndex + 1} / ${selectedLineSteps.length}`}</strong>
              </div>
              <h2 id="board-explorer-title">{activeStep.title}</h2>
              <p>{activeStep.explanation}</p>
              <p>{activeStep.purpose}</p>
            </article>
            <button
              aria-label="Следующий ход"
              className="step-arrow"
              disabled={safeStepIndex === selectedLineSteps.length - 1}
              onClick={() => setStepIndex(safeStepIndex + 1)}
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
                onClick={() => setStepIndex(index)}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="lesson-panel">
          <div className="title-row">
            <div>
              <p className="eyebrow">Проверенный учебный пример</p>
              <h1 id="opening-title">{lesson.opening.name}</h1>
            </div>
            <span className="status-pill">{lesson.status}</span>
          </div>

          <p className="aliases">{`${lesson.opening.aliases.join(" / ")} · ECO ${lesson.opening.eco}`}</p>

          <div className="insight-grid">
            <article>
              <h2>Принцип</h2>
              <p>{lesson.opening.principle}</p>
            </article>
            <article>
              <h2>Цель позиции</h2>
              <p>{lesson.opening.positionGoal}</p>
            </article>
            <article>
              <h2>План до миттельшпиля</h2>
              <p>{lesson.opening.middlegamePlan}</p>
            </article>
          </div>

          <section className="continuations" aria-labelledby="continuations-title">
            <h2 id="continuations-title">Типовые продолжения</h2>
            <div className="continuation-list">
              {lesson.opening.continuations.map((continuation) => (
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
              ))}
            </div>
          </section>

          <section className="bad-moves" aria-labelledby="bad-moves-title">
            <h2 id="bad-moves-title">Плохие ходы</h2>
            <div className="bad-move-list">
              {lesson.opening.badMoves.map((badMove) => (
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
              ))}
            </div>
          </section>

          <footer className="verification">
            <span>Источник</span>
            <p>{lesson.opening.verification}</p>
          </footer>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";

type StudySide = "white" | "black";

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

const PIECE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  B: "слон",
  K: "король",
  N: "конь",
  Q: "ферзь",
  R: "ладья"
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

export default function OpeningTrainer({ lessons }: Readonly<{ lessons: readonly OpeningLesson[] }>) {
  const initialLesson = lessons.find((candidate) => candidate.opening.studySide === "white") ?? lessons[0];
  const [studySideFilter, setStudySideFilter] = useState<StudySide>(initialLesson?.opening.studySide ?? "white");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | OpeningPriority>("all");
  const [selectedOpeningKey, setSelectedOpeningKey] = useState(initialLesson?.opening.key ?? "");
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
  const arrow = useMemo(() => getMoveArrow(activeStep), [activeStep]);
  const interactiveContinuationCards = getInteractiveContinuationCards(lesson);
  const interactiveBadMoveCards = getInteractiveBadMoveCards(lesson);
  const selectedLearningCard = [...interactiveContinuationCards, ...interactiveBadMoveCards].find(
    (card) => card.key === selectedLearningCardKey
  );

  function goToStep(nextStepIndex: number) {
    setSelectedLearningCardKey("");
    setStepIndex(nextStepIndex);
  }

  function selectContinuation(continuation: OpeningContinuation) {
    setSelectedLearningCardKey("");
    setSelectedTarget({ kind: "continuation", key: continuation.key });
    setStepIndex(Math.min(firstContinuationStepIndex, continuation.steps.length - 1));
  }

  function selectBadMove(badMove: BadMove) {
    setSelectedLearningCardKey("");
    setSelectedTarget({ kind: "badMove", key: badMove.key });
    setStepIndex(Math.min(firstContinuationStepIndex, badMove.steps.length - 1));
  }

  function selectLearningCard(card: InteractiveLearningCard) {
    setSelectedTarget({ kind: "learning", key: card.key });
    setSelectedLearningCardKey(card.key);
    setStepIndex(card.focusStepIndex);
  }

  function selectOpening(nextLesson: OpeningLesson) {
    const nextFirstContinuation = nextLesson.opening.continuations[0];
    const nextFirstBadMove = nextLesson.opening.badMoves[0];
    const nextLineSteps = nextFirstContinuation?.steps ?? nextFirstBadMove?.steps ?? nextLesson.baseLine.steps;
    setSelectedOpeningKey(nextLesson.opening.key);
    setSelectedTarget({
      kind: nextFirstContinuation ? "continuation" : nextFirstBadMove ? "badMove" : "learning",
      key: nextFirstContinuation?.key ?? nextFirstBadMove?.key ?? ""
    });
    setSelectedLearningCardKey("");
    setStepIndex(Math.min(nextLesson.baseLine.steps.length, Math.max(nextLineSteps.length - 1, 0)));
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
            <span>Выбери продолжение или ошибку справа</span>
          </div>

          <div
            className={`board perspective-${lesson.opening.studySide}`}
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
                      className={`piece piece-${square.piece.color}`}
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
              onClick={() => goToStep(safeStepIndex - 1)}
              type="button"
            >
              ←
            </button>
            <article className="board-step-card">
              <div>
                <span>{formatMove(activeStep)}</span>
                <strong>{`${safeStepIndex + 1} / ${selectedLineSteps.length}`}</strong>
              </div>
              <h2 id="board-explorer-title">
                {selectedLearningCard ? `${selectedLearningCard.label}: ${selectedLearningCard.title}` : activeStep.title}
              </h2>
              {selectedLearningCard ? <InsightText text={selectedLearningCard.body} /> : <p>{activeStep.explanation}</p>}
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

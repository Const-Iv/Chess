// @ts-check

import { Chess } from "chess.js";

export const RUY_LOPEZ_SAN_LINE = Object.freeze(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
export const RUY_LOPEZ_INPUT = "1. e4 e5 2. Nf3 Nc6 3. Bb5";
export const RUY_LOPEZ_EXPECTED_FEN = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3";
export const RUY_LOPEZ_STUDY_SIDE = "black";

/**
 * @typedef {"white"|"black"} StudySide
 * @typedef {"light"|"dark"} SquareShade
 *
 * @typedef {Readonly<{
 *   symbol: string;
 *   color: StudySide;
 *   name: string;
 * }>} BoardPiece
 *
 * @typedef {Readonly<{
 *   file: string;
 *   rank: string;
 *   square: string;
 *   shade: SquareShade;
 *   showFile: boolean;
 *   showRank: boolean;
 *   isMoveFrom: boolean;
 *   isMoveTo: boolean;
 *   piece: BoardPiece | null;
 * }>} BoardSquare
 *
 * @typedef {Readonly<{
 *   ply: number;
 *   moveNumber: number;
 *   san: string;
 *   from: string;
 *   to: string;
 *   actor: StudySide;
 *   actorLabel: string;
 *   pieceName: string;
 *   title: string;
 *   explanation: string;
 *   purpose: string;
 *   board: readonly BoardSquare[];
 * }>} MoveStep
 *
 * @typedef {Readonly<{
 *   key: string;
 *   san: string;
 *   label: string;
 *   idea: string;
 *   summary: string;
 *   lineSan: readonly string[];
 * }>} OpeningContinuationSeed
 *
 * @typedef {Readonly<OpeningContinuationSeed & {
 *   steps: readonly MoveStep[];
 * }>} OpeningContinuation
 *
 * @typedef {Readonly<{
 *   san: string;
 *   label: string;
 *   whyBad: string;
 *   betterPlan: string;
 * }>} BadMoveSeed
 *
 * @typedef {Readonly<BadMoveSeed & {
 *   key: string;
 *   from: string;
 *   to: string;
 *   steps: readonly MoveStep[];
 * }>} BadMove
 *
 * @typedef {Readonly<{
 *   key: string;
 *   name: string;
 *   sourceName: string;
 *   aliases: readonly string[];
 *   studySide: StudySide;
 *   studyLabel: string;
 *   turnLabel: string;
 *   verification: string;
 *   principle: string;
 *   positionGoal: string;
 *   middlegamePlan: string;
 *   continuations: readonly OpeningContinuationSeed[];
 *   badMoves: readonly BadMoveSeed[];
 * }>} OpeningMapSeed
 *
 * @typedef {Readonly<Omit<OpeningMapSeed, "continuations"|"badMoves"> & {
 *   continuations: readonly OpeningContinuation[];
 *   badMoves: readonly BadMove[];
 * }>} OpeningMapEntry
 *
 * @typedef {Readonly<{
 *   steps: readonly MoveStep[];
 * }>} OpeningLine
 *
 * @typedef {Readonly<{
 *   status: "ПРОВЕРЕНО";
 *   input: string;
 *   appliedSan: readonly string[];
 *   fen: string;
 *   baseLine: OpeningLine;
 *   opening: OpeningMapEntry;
 * }>} RuyLopezLesson
 */

/** @type {OpeningMapSeed} */
export const RUY_LOPEZ_ENTRY = Object.freeze({
  key: RUY_LOPEZ_SAN_LINE.join(" "),
  name: "Испанская партия",
  sourceName: "Ruy Lopez",
  aliases: Object.freeze(["Дебют Руя Лопеса", "Испанская игра"]),
  studySide: RUY_LOPEZ_STUDY_SIDE,
  studyLabel: "Изучаем за черных",
  turnLabel: "На доске ход черных",
  verification:
    "Ручной пример сверен со справочником Chess.com по Испанской партии и проверкой легальности ходов; большая внешняя база не импортировалась.",
  principle: "Белые быстро развиваются, борются за центр и давят на коня c6, который защищает пешку e5.",
  positionGoal:
    "Понять структуру Испанской партии: как белые давят на коня c6, а черные выбирают надежный способ защиты пешки e5.",
  middlegamePlan:
    "Черным нужно решить простую задачу: отогнать опасного слона, напасть на пешку e4 или крепко защитить пешку e5. Потом спокойно развить фигуры и убрать короля в безопасность.",
  continuations: Object.freeze([
    Object.freeze({
      key: "morphy",
      san: "a6",
      label: "Защита Морфи",
      idea: "Отогнать слона b5, чтобы он не давил на коня c6. Дальше развить коня g8, слона f8 и рокировать.",
      summary: "План черных: сначала прогнать слона b5, затем вывести фигуры и безопасно рокировать.",
      lineSan: Object.freeze(["a6", "Ba4", "Nf6", "O-O", "Be7"])
    }),
    Object.freeze({
      key: "berlin",
      san: "Nf6",
      label: "Берлинская защита",
      idea: "Развить коня g8 на f6 и сразу напасть на пешку e4. Дальше черные готовы забирать центр.",
      summary: "План черных: быстро развить коня, заставить белых защищать пешку e4 и бороться за центр.",
      lineSan: Object.freeze(["Nf6", "O-O", "Nxe4", "d4", "Nd6"])
    }),
    Object.freeze({
      key: "steinitz",
      san: "d6",
      label: "Защита Стейница",
      idea: "Защитить пешку e5 пешкой d7-d6. Дальше спокойно вывести фигуры, но не зажиматься слишком пассивно.",
      summary: "План черных: укрепить пешку e5, спокойно развиться и не позволить белым легко открыть центр.",
      lineSan: Object.freeze(["d6", "d4", "Bd7", "Nc3", "Nf6"])
    })
  ]),
  badMoves: Object.freeze([
    Object.freeze({
      san: "f6",
      label: "Ослабляет короля",
      whyBad:
        "Пешка f7 идет на f6 и защищает e5, но открывает диагонали к королю e8 и забирает поле f6 у коня g8.",
      betterPlan: "Лучше развить коня g8 на f6 или сначала отогнать слона ходом a6."
    }),
    Object.freeze({
      san: "Qf6",
      label: "Ферзь выходит слишком рано",
      whyBad:
        "Ферзь d8 идет на f6 и защищает e5, но становится целью для белых фигур и мешает спокойно развиваться.",
      betterPlan: "Лучше сначала вывести легкие фигуры: коня g8, слона f8 и только потом думать о ферзе."
    }),
    Object.freeze({
      san: "h6",
      label: "Не решает главную проблему",
      whyBad:
        "Пешка h7 идет на h6, но она не нападает на слона b5 и не защищает пешку e5. Белые сохраняют давление.",
      betterPlan: "Лучше сыграть a6, чтобы сразу спросить слона b5, или Nf6, чтобы напасть на пешку e4."
    })
  ])
});

const FILES_ASCENDING = Object.freeze(["a", "b", "c", "d", "e", "f", "g", "h"]);
const FILES_DESCENDING = Object.freeze(["h", "g", "f", "e", "d", "c", "b", "a"]);
const RANKS_ASCENDING = Object.freeze(["1", "2", "3", "4", "5", "6", "7", "8"]);
const RANKS_DESCENDING = Object.freeze(["8", "7", "6", "5", "4", "3", "2", "1"]);

/** @type {Readonly<Record<string, string>>} */
const PIECE_SYMBOLS = Object.freeze({
  wp: "♟",
  wn: "♞",
  wb: "♝",
  wr: "♜",
  wq: "♛",
  wk: "♚",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚"
});

/** @type {Readonly<Record<string, string>>} */
const PIECE_NAMES = Object.freeze({
  p: "пешка",
  n: "конь",
  b: "слон",
  r: "ладья",
  q: "ферзь",
  k: "король"
});

/** @type {Readonly<Record<string, {title: string; explanation: string; purpose: string}>>} */
const MOVE_EXPLANATIONS = Object.freeze({
  e4: Object.freeze({
    title: "Белая пешка занимает центр",
    explanation: "Белая пешка идет с e2 на e4. Она занимает центр и открывает дорогу слону f1 и ферзю d1.",
    purpose: "Смысл: белые сразу берут пространство в центре и быстрее выпускают фигуры."
  }),
  e5: Object.freeze({
    title: "Черные отвечают в центр",
    explanation: "Черная пешка идет с e7 на e5. Она тоже занимает центр и держит поле d4.",
    purpose: "Смысл: не отдать белым центр бесплатно и открыть дорогу слону f8."
  }),
  Nf3: Object.freeze({
    title: "Белый конь нападает на e5",
    explanation: "Белый конь идет с g1 на f3. Конь нападает на пешку e5 и помогает контролировать поле d4.",
    purpose: "Смысл: белые развивают фигуру и сразу давят на центральную пешку черных."
  }),
  Nc6: Object.freeze({
    title: "Черный конь защищает e5",
    explanation: "Черный конь идет с b8 на c6. Конь защищает пешку e5 и давит на поле d4.",
    purpose: "Смысл: защитить важную пешку e5 и вывести фигуру к центру."
  }),
  Bb5: Object.freeze({
    title: "Белый слон давит на коня c6",
    explanation: "Белый слон идет с f1 на b5. Слон нападает на коня c6, который защищает пешку e5.",
    purpose: "Смысл: белые хотят ослабить защитника пешки e5 и создать долгую угрозу в центре."
  }),
  a6: Object.freeze({
    title: "Черные спрашивают слона b5",
    explanation: "Черная пешка идет с a7 на a6. Она нападает на слона b5 и заставляет белых выбрать: отойти или разменяться.",
    purpose: "Смысл: убрать неприятное давление на коня c6 и потом спокойно развить коня g8, слона f8 и рокировать."
  }),
  Ba4: Object.freeze({
    title: "Слон сохраняет давление",
    explanation: "Белый слон идет с b5 на a4. Слон уходит из-под атаки пешки a6 и сохраняет давление на коня c6.",
    purpose: "Смысл: белые не хотят менять слона и продолжают мешать защитнику пешки e5."
  }),
  Nf6: Object.freeze({
    title: "Черные нападают на e4",
    explanation: "Черный конь идет с g8 на f6. Конь нападает на белую пешку e4 и развивает фигуру.",
    purpose: "Смысл: черные не только развиваются, но и заставляют белых думать о защите центра."
  }),
  "O-O": Object.freeze({
    title: "Белые прячут короля",
    explanation: "Белый король рокируется с e1 на g1, а ладья h1 идет на f1. Король становится безопаснее.",
    purpose: "Смысл: убрать короля из центра до того, как позиция откроется."
  }),
  Be7: Object.freeze({
    title: "Черные готовят рокировку",
    explanation: "Черный слон идет с f8 на e7. Черные развивают фигуру и готовят короткую рокировку.",
    purpose: "Смысл: освободить королю путь для рокировки и завершить развитие королевского фланга."
  }),
  Nxe4: Object.freeze({
    title: "Черный конь забирает пешку e4",
    explanation: "Черный конь идет с f6 на e4 и забирает белую пешку e4. Черные проверяют, сможет ли белый вернуть центр.",
    purpose: "Смысл: наказать белых, если пешка e4 плохо защищена, и заставить их тратить ходы на центр."
  }),
  d4: Object.freeze({
    title: "Белые бьют по центру",
    explanation: "Белая пешка идет с d2 на d4. Она атакует пешку e5 и открывает центр.",
    purpose: "Смысл: белые хотят вернуть пространство и не дать черным спокойно удержать пешку e5."
  }),
  Nd6: Object.freeze({
    title: "Конь отходит с темпом",
    explanation: "Черный конь идет с e4 на d6. Конь нападает на слона b5 и остается рядом с центром.",
    purpose: "Смысл: уйти из-под давления, сохранить активного коня и снова потревожить белого слона."
  }),
  d6: Object.freeze({
    title: "Черные укрепляют e5",
    explanation: "Черная пешка идет с d7 на d6. Она защищает пешку e5 и делает центр черных крепче.",
    purpose: "Смысл: сначала надежно удержать центр, а уже потом развивать фигуры."
  }),
  Bd7: Object.freeze({
    title: "Слон выходит в защиту",
    explanation: "Черный слон идет с c8 на d7. Черные развивают фигуру и готовят спокойную защиту центра.",
    purpose: "Смысл: развить фигуру и добавить защиту, не ослабляя пешку e5."
  }),
  Nc3: Object.freeze({
    title: "Белые добавляют фигуру в центр",
    explanation: "Белый конь идет с b1 на c3. Конь помогает белым давить на центр и поддерживает пешку d5, если она появится.",
    purpose: "Смысл: белые усиливают давление фигурами, а не только пешками."
  })
});

/**
 * @param {readonly string[]} sanLine
 * @returns {{ chess: Chess; appliedSan: string[] }}
 */
export function playStrictSanLine(sanLine) {
  const chess = new Chess();
  /** @type {string[]} */
  const appliedSan = [];

  for (const san of sanLine) {
    const move = chess.move(san, { strict: true });
    appliedSan.push(move.san);
  }

  return { chess, appliedSan };
}

/**
 * @param {Chess} chess
 * @param {StudySide} perspective
 * @param {{from: string; to: string} | null} [lastMove]
 * @returns {BoardSquare[]}
 */
export function buildDisplayBoard(chess, perspective = "white", lastMove = null) {
  const board = chess.board();
  const files = perspective === "black" ? FILES_DESCENDING : FILES_ASCENDING;
  const ranks = perspective === "black" ? RANKS_ASCENDING : RANKS_DESCENDING;
  /** @type {BoardSquare[]} */
  const squares = [];

  for (let rankIndex = 0; rankIndex < ranks.length; rankIndex += 1) {
    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      const file = files[fileIndex];
      const rank = ranks[rankIndex];
      const boardRankIndex = 8 - Number(rank);
      const boardFileIndex = FILES_ASCENDING.indexOf(file);
      const piece = board[boardRankIndex]?.[boardFileIndex] ?? null;
      const square = `${file}${rank}`;
      const isLightSquare = (FILES_ASCENDING.indexOf(file) + Number(rank)) % 2 === 0;
      const pieceKey = piece ? `${piece.color}${piece.type}` : null;
      squares.push({
        file,
        rank,
        square,
        shade: isLightSquare ? "light" : "dark",
        showFile: rankIndex === ranks.length - 1,
        showRank: fileIndex === 0,
        isMoveFrom: lastMove?.from === square,
        isMoveTo: lastMove?.to === square,
        piece: piece
          ? {
              symbol: PIECE_SYMBOLS[pieceKey ?? ""],
              color: piece.color === "w" ? "white" : "black",
              name: PIECE_NAMES[piece.type]
            }
          : null
      });
    }
  }

  return squares;
}

/**
 * @param {string} san
 * @param {string} actorLabel
 * @param {string} pieceName
 * @param {string} from
 * @param {string} to
 * @returns {{title: string; explanation: string; purpose: string}}
 */
function describeMove(san, actorLabel, pieceName, from, to) {
  return (
    MOVE_EXPLANATIONS[san] ?? {
      title: `${actorLabel}: ${san}`,
      explanation: `${actorLabel} делают ход ${san}: ${pieceName} идет с ${from} на ${to}.`,
      purpose: "Смысл: развить фигуру, улучшить позицию или ответить на угрозу соперника."
    }
  );
}

/**
 * @param {readonly string[]} sanLine
 * @param {StudySide} perspective
 * @returns {MoveStep[]}
 */
export function buildMoveSteps(sanLine, perspective) {
  const chess = new Chess();
  /** @type {MoveStep[]} */
  const steps = [];

  for (let index = 0; index < sanLine.length; index += 1) {
    const move = chess.move(sanLine[index], { strict: true });
    const actor = move.color === "w" ? "white" : "black";
    const actorLabel = actor === "white" ? "Белые" : "Черные";
    const pieceName = PIECE_NAMES[move.piece] ?? "фигура";
    const description = describeMove(move.san, actorLabel, pieceName, move.from, move.to);
    steps.push({
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      san: move.san,
      from: move.from,
      to: move.to,
      actor,
      actorLabel,
      pieceName,
      title: description.title,
      explanation: description.explanation,
      purpose: description.purpose,
      board: buildDisplayBoard(chess, perspective, { from: move.from, to: move.to })
    });
  }

  return steps;
}

/**
 * @param {BadMoveSeed} badMove
 * @param {StudySide} perspective
 * @returns {MoveStep[]}
 */
function buildBadMoveSteps(badMove, perspective) {
  const steps = buildMoveSteps([...RUY_LOPEZ_SAN_LINE, badMove.san], perspective);
  const badMoveStep = steps.at(-1);

  if (!badMoveStep) {
    throw new Error(`Could not build bad move step for ${badMove.san}.`);
  }

  return [
    ...steps.slice(0, -1),
    {
      ...badMoveStep,
      title: `Плохой ход: ${badMove.label}`,
      explanation: badMove.whyBad,
      purpose: badMove.betterPlan
    }
  ];
}

/**
 * @returns {RuyLopezLesson}
 */
export function buildRuyLopezLesson() {
  const { chess, appliedSan } = playStrictSanLine(RUY_LOPEZ_SAN_LINE);
  const fen = chess.fen();

  if (fen !== RUY_LOPEZ_EXPECTED_FEN) {
    throw new Error(`Unexpected Ruy Lopez FEN: ${fen}`);
  }

  const legalContinuations = new Set(chess.moves());
  const continuations = RUY_LOPEZ_ENTRY.continuations.map((continuation) => {
    if (!legalContinuations.has(continuation.san)) {
      throw new Error(`Expected continuation ${continuation.san} is not legal in the reached position.`);
    }
    return {
      ...continuation,
      steps: buildMoveSteps([...RUY_LOPEZ_SAN_LINE, ...continuation.lineSan], RUY_LOPEZ_ENTRY.studySide)
    };
  });
  const badMoves = RUY_LOPEZ_ENTRY.badMoves.map((badMove) => {
    if (!legalContinuations.has(badMove.san)) {
      throw new Error(`Expected bad move ${badMove.san} is not legal in the reached position.`);
    }
    const probe = new Chess(fen);
    const move = probe.move(badMove.san, { strict: true });
    return {
      ...badMove,
      key: `bad-${badMove.san}`,
      from: move.from,
      to: move.to,
      steps: buildBadMoveSteps(badMove, RUY_LOPEZ_ENTRY.studySide)
    };
  });

  return {
    status: "ПРОВЕРЕНО",
    input: RUY_LOPEZ_INPUT,
    appliedSan,
    fen,
    baseLine: {
      steps: buildMoveSteps(RUY_LOPEZ_SAN_LINE, RUY_LOPEZ_ENTRY.studySide)
    },
    opening: {
      ...RUY_LOPEZ_ENTRY,
      continuations,
      badMoves
    }
  };
}

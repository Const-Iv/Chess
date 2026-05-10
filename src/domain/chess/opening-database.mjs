// @ts-check

import { Chess } from "chess.js";
import {
  OPENING_RESEARCH_SOURCE_NOTE,
  loadOpeningResearchSource,
  loadOpeningResearchValidation
} from "./opening-research-source.mjs";
import {
  THEORY_EVIDENCE_SOURCE_NOTE,
  loadTheoryEvidenceSource
} from "./theory-evidence-source.mjs";

export const OPENING_SOURCE_NOTE =
  "Учебная база проверяется по открытым источникам: Lichess chess-openings для названий/ECO и Lichess Broadcast Database для реальных партий. Дополнительный библиографический слой фиксирует FCO, Mastering the Chess Openings, Chess Structures и ECO/Chess Informant как источники методологии; текст книг не копируется. Все SAN-линии проверяются chess.js.";

export const IMPORTED_OPENING_SOURCE_NOTE = OPENING_RESEARCH_SOURCE_NOTE;
export const POSITION_THEORY_SOURCE_NOTE = THEORY_EVIDENCE_SOURCE_NOTE;

/**
 * @typedef {"open-data"|"bibliographic"|"classification"} TheoryReferenceKind
 *
 * @typedef {Readonly<{
 *   key: string;
 *   title: string;
 *   author: string;
 *   publisher: string;
 *   url: string;
 *   kind: TheoryReferenceKind;
 *   role: string;
 *   usage: string;
 * }>} TheoryReferenceSource
 */

/** @type {readonly TheoryReferenceSource[]} */
export const THEORY_REFERENCE_SOURCES = Object.freeze([
  Object.freeze({
    key: "lichess-chess-openings",
    title: "Lichess chess-openings",
    author: "Lichess",
    publisher: "lichess-org",
    url: "https://github.com/lichess-org/chess-openings",
    kind: "open-data",
    role: "Названия дебютов, ECO и проверка известных PGN-префиксов.",
    usage: "Используется как открытый источник совпадений; данные проходят локальную SAN-проверку chess.js."
  }),
  Object.freeze({
    key: "lichess-broadcast-database",
    title: "Lichess Broadcast/Open Database",
    author: "Lichess",
    publisher: "Lichess",
    url: "https://database.lichess.org/",
    kind: "open-data",
    role: "Реальные партии и частоты ходов в позициях.",
    usage: "Используется для практической проверки ходов и примеров партий с сохранением атрибуции."
  }),
  Object.freeze({
    key: "fundamental-chess-openings",
    title: "FCO: Fundamental Chess Openings",
    author: "Paul van der Sterren",
    publisher: "Gambit Publications / New In Chess",
    url: "https://www.newinchess.com/fco-fundamental-chess-openings",
    kind: "bibliographic",
    role: "Базовая методология дебютов: идеи, планы сторон и характер основных открытий.",
    usage: "Используется как bibliographic reference для проверки учебной рамки; текст не копируется."
  }),
  Object.freeze({
    key: "mastering-the-chess-openings",
    title: "Mastering the Chess Openings",
    author: "John Watson",
    publisher: "Gambit Publications",
    url: "https://www.gambitbooks.com/booksbysubject.html",
    kind: "bibliographic",
    role: "Более глубокая методология дебютной борьбы, порядка ходов и типовых идей.",
    usage: "Используется как bibliographic reference для методологии; конкретные рекомендации сверяются отдельно."
  }),
  Object.freeze({
    key: "chess-structures",
    title: "Chess Structures: A Grandmaster Guide",
    author: "Mauricio Flores Rios",
    publisher: "Quality Chess",
    url: "https://www.newinchess.com/chess-structures-a-grandmaster-guide",
    kind: "bibliographic",
    role: "Типовые пешечные структуры, планы миттельшпиля, model games and pitfalls.",
    usage: "Используется как bibliographic reference для планов перехода к миттельшпилю; текст не копируется."
  }),
  Object.freeze({
    key: "eco-chess-informant",
    title: "Encyclopaedia of Chess Openings / ECO",
    author: "Chess Informant",
    publisher: "Chess Informant",
    url: "https://help.chessbase.com/CBase/16/Eng/eco_classification.htm",
    kind: "classification",
    role: "Стандартная классификация дебютов и ECO-диапазонов.",
    usage: "Используется как справочный слой классификации; названия и ходы дополнительно сверяются с открытыми источниками."
  })
]);

export const THEORY_REFERENCE_SOURCE_NOTE =
  "Book references are bibliographic-only: they validate the teaching frame, but app copy is original and move facts still require open-data or manual verification.";

/** @type {Readonly<Record<string, TheoryReferenceSource>>} */
const THEORY_REFERENCE_BY_KEY = Object.freeze(
  THEORY_REFERENCE_SOURCES.reduce(
    /**
     * @param {Record<string, TheoryReferenceSource>} acc
     * @param {TheoryReferenceSource} source
     */
    (acc, source) => {
      acc[source.key] = source;
      return acc;
    },
    /** @type {Record<string, TheoryReferenceSource>} */ ({})
  )
);

const CORE_THEORY_REFERENCE_KEYS = Object.freeze([
  "lichess-chess-openings",
  "lichess-broadcast-database",
  "fundamental-chess-openings",
  "mastering-the-chess-openings",
  "chess-structures",
  "eco-chess-informant"
]);

const RESEARCH_THEORY_REFERENCE_KEYS = Object.freeze([
  "lichess-chess-openings",
  "lichess-broadcast-database",
  "fundamental-chess-openings",
  "chess-structures",
  "eco-chess-informant"
]);

/**
 * @param {readonly string[]} keys
 * @returns {readonly TheoryReferenceSource[]}
 */
function getTheoryReferences(keys) {
  return Object.freeze(keys.map((key) => THEORY_REFERENCE_BY_KEY[key]).filter(Boolean));
}

export const RUY_LOPEZ_SAN_LINE = Object.freeze(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
export const RUY_LOPEZ_INPUT = "1. e4 e5 2. Nf3 Nc6 3. Bb5";
export const RUY_LOPEZ_EXPECTED_FEN = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3";
export const RUY_LOPEZ_STUDY_SIDE = "black";

/**
 * @typedef {"white"|"black"} StudySide
 * @typedef {"A"|"B"|"C"} OpeningPriority
 * @typedef {"ПРОВЕРЕНО"|"ХОДЫ ПРОВЕРЕНЫ"} OpeningLessonStatus
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
 *   fenBefore: string;
 *   fenAfter: string;
 *   board: readonly BoardSquare[];
 * }>} MoveStep
 *
 * @typedef {Readonly<{
 *   title: string;
 *   explanation: string;
 *   purpose: string;
 * }>} MoveGuide
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
 * @typedef {"verified"|"candidate"|"rejected"} BadMoveReviewStatus
 * @typedef {"manual-review"|"book"|"lichess-explorer"|"lichess-cloud-eval"|"lichess-puzzle"} BadMoveSourceKind
 *
 * @typedef {Readonly<{
 *   status: BadMoveReviewStatus;
 *   kind: BadMoveSourceKind;
 *   title: string;
 *   url?: string;
 *   note: string;
 * }>} BadMoveSource
 *
 * @typedef {Readonly<{
 *   san: string;
 *   label: string;
 *   whyBad: string;
 *   betterPlan: string;
 *   afterLineSan?: readonly string[];
 *   source?: BadMoveSource;
 * }>} BadMoveSeed
 *
 * @typedef {Readonly<BadMoveSeed & {
 *   key: string;
 *   anchorPly: number;
 *   anchorFen: string;
 *   anchorLineSan: readonly string[];
 *   source: BadMoveSource;
 *   from: string;
 *   to: string;
 *   steps: readonly MoveStep[];
 * }>} BadMove
 *
 * @typedef {Readonly<{
 *   kind: string;
 *   commonPrefixPly: number;
 *   eco: string;
 *   name: string;
 *   pgn: string;
 * }>} LichessOpeningMatch
 *
 * @typedef {Readonly<{
 *   legalSan: boolean;
 *   finalFen: string;
 *   lichessMatch: LichessOpeningMatch | null;
 * }>} OpeningSourceEvidence
 *
 * @typedef {import("./theory-evidence-source.mjs").PositionTheoryEvidence} PositionTheoryEvidence
 *
 * @typedef {Readonly<{
 *   ply: number;
 *   side: StudySide;
 *   move: string;
 *   hint: string;
 * }>} ResearchMoveHint
 *
 * @typedef {Readonly<{
 *   id: string;
 *   family: string;
 *   eco: string;
 *   name: string;
 *   pgn: string;
 *   moves: readonly string[];
 *   priority: OpeningPriority;
 *   why_it_matters: string;
 *   white_plan: string;
 *   black_plan: string;
 *   middlegame_tabia: string;
 *   key_ideas: readonly string[];
 *   common_traps?: readonly string[];
 *   avoid?: readonly string[];
 *   tags?: readonly string[];
 *   related?: readonly string[];
 *   move_hints: readonly ResearchMoveHint[];
 * }>} ResearchVariation
 *
 * @typedef {Readonly<{
 *   variations: readonly ResearchVariation[];
 * }>} ResearchSource
 *
 * @typedef {Readonly<{
 *   id: string;
 *   legalSan: boolean;
 *   finalFen: string;
 *   lichessMatch: LichessOpeningMatch | null;
 * }>} ResearchValidationEntry
 *
 * @typedef {Readonly<{
 *   variations: readonly ResearchValidationEntry[];
 * }>} ResearchValidation
 *
 * @typedef {Readonly<{
 *   key: string;
 *   family: string;
 *   name: string;
 *   sourceName: string;
 *   eco: string;
 *   aliases: readonly string[];
 *   studySide: StudySide;
 *   studyLabel: string;
 *   turnLabel: string;
 *   lineSan: readonly string[];
 *   verification: string;
 *   principle: string;
 *   positionGoal: string;
 *   middlegamePlan: string;
 *   continuations: readonly OpeningContinuationSeed[];
 *   badMoves: readonly BadMoveSeed[];
 *   moveGuides?: Readonly<Record<string, MoveGuide>>;
 *   priority?: OpeningPriority;
 *   whyItMatters?: string;
 *   whitePlan?: string;
 *   blackPlan?: string;
 *   middlegameTabia?: string;
 *   keyIdeas?: readonly string[];
 *   commonTraps?: readonly string[];
 *   avoid?: readonly string[];
 *   tags?: readonly string[];
 *   sourceEvidence?: OpeningSourceEvidence;
 *   referenceSources?: readonly TheoryReferenceSource[];
 * }>} OpeningSeed
 *
 * @typedef {Readonly<Omit<OpeningSeed, "continuations"|"badMoves"|"moveGuides"> & {
 *   input: string;
 *   fen: string;
 *   continuations: readonly OpeningContinuation[];
 *   badMoves: readonly BadMove[];
 *   positionTheory: readonly PositionTheoryEvidence[];
 *   referenceSources: readonly TheoryReferenceSource[];
 * }>} OpeningMapEntry
 *
 * @typedef {Readonly<{
 *   steps: readonly MoveStep[];
 * }>} OpeningLine
 *
 * @typedef {Readonly<{
 *   status: OpeningLessonStatus;
 *   input: string;
 *   appliedSan: readonly string[];
 *   fen: string;
 *   baseLine: OpeningLine;
 *   opening: OpeningMapEntry;
 * }>} OpeningLesson
 */

/**
 * @param {string} note
 * @returns {BadMoveSource}
 */
function verifiedCloudEvalSource(note) {
  return Object.freeze({
    status: "verified",
    kind: "lichess-cloud-eval",
    title: "Lichess cloud eval",
    url: "https://lichess.org/api/cloud-eval",
    note
  });
}

const THEORY_EVIDENCE_SOURCE = loadTheoryEvidenceSource();
const THEORY_BY_OPENING_KEY = THEORY_EVIDENCE_SOURCE.positions.reduce(
  /**
   * @param {Map<string, PositionTheoryEvidence[]>} grouped
   * @param {PositionTheoryEvidence} position
   */
  (grouped, position) => {
    grouped.set(position.openingKey, [...(grouped.get(position.openingKey) ?? []), position]);
    return grouped;
  },
  new Map()
);

/**
 * @param {string} openingKey
 * @returns {readonly PositionTheoryEvidence[]}
 */
function getPositionTheory(openingKey) {
  return Object.freeze([...(THEORY_BY_OPENING_KEY.get(openingKey) ?? [])]);
}

/** @type {readonly OpeningSeed[]} */
export const OPENING_SEEDS = Object.freeze([
  Object.freeze({
    key: "ruy-lopez-black",
    family: "1.e4 e5",
    name: "Испанская партия",
    sourceName: "Ruy Lopez",
    eco: "C60-C99",
    aliases: Object.freeze(["Дебют Руя Лопеса", "Испанская игра"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Черные выбирают ответ",
    lineSan: RUY_LOPEZ_SAN_LINE,
    verification: "Сверено со страницей Chess.com по Испанской партии и ECO C60-C99; основные ответы проверены на легальность.",
    principle: "Белые развивают королевский фланг и давят слоном b5 на коня c6, который защищает пешку e5.",
    positionGoal:
      "Черным нужно решить, как снять давление с коня c6 и не потерять центр: отогнать слона, развить коня или крепко защитить e5.",
    middlegamePlan:
      "После надежного ответа черные обычно развивают коня g8, слона f8, рокируют и готовят борьбу за центр ходами ...d6 или ...d5.",
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
        whyBad: "Ферзь d8 идет на f6 и защищает e5, но становится целью для белых фигур и мешает развитию.",
        betterPlan: "Лучше сначала вывести легкие фигуры: коня g8, слона f8 и только потом думать о ферзе."
      }),
      Object.freeze({
        san: "h6",
        label: "Не решает проблему",
        whyBad: "Пешка h7 идет на h6, но она не нападает на слона b5 и не защищает пешку e5.",
        betterPlan: "Лучше сыграть a6, чтобы сразу спросить слона b5, или Nf6, чтобы напасть на пешку e4."
      }),
      Object.freeze({
        san: "Qg5",
        label: "Ферзь уходит в рейд без развития",
        whyBad: "Ферзь d8 идет на g5, но черные оставляют короля в центре, не развивают коня g8 и дают белым темпы на ферзя.",
        betterPlan: "Лучше сначала сыграть a6 или Nf6: оба хода решают задачу позиции и не выводят ферзя под атаки.",
        source: verifiedCloudEvalSource("Lichess cloud eval: после 3...Qg5 позиция примерно на 704cp хуже для черных, чем после 3...a6.")
      }),
      Object.freeze({
        san: "Qh4",
        label: "Ранняя атака ферзем",
        whyBad: "Ферзь d8 идет на h4 и делает вид, что атакует e4, но белые выигрывают темпы развитием и черные все еще не решили давление на e5.",
        betterPlan: "Лучше выбрать нормальное развитие: a6, Nf6 или d6.",
        source: verifiedCloudEvalSource("Lichess cloud eval: после 3...Qh4 позиция примерно на 689cp хуже для черных, чем после 3...a6.")
      })
    ])
  }),
  Object.freeze({
    key: "italian-white",
    family: "1.e4 e5",
    name: "Итальянская партия",
    sourceName: "Italian Game",
    eco: "C50-C54",
    aliases: Object.freeze(["Итальянская игра", "Джоко Пьяно"]),
    studySide: "white",
    studyLabel: "Изучаем за белых",
    turnLabel: "Белые выбирают план",
    lineSan: Object.freeze(["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"]),
    verification: "Сверено со страницей Chess.com по Итальянской партии и ECO C50-C54; планы подобраны как учебное ядро для новичка.",
    principle: "Белые быстро выводят коня и слона, атакуют слабую пешку f7 и готовят короткую рокировку.",
    positionGoal: "Понять, играть спокойно через d3, готовить центр c3-d4 или пожертвовать b-пешку ради темпа.",
    middlegamePlan:
      "Белые обычно рокируют, готовят d4 или удерживают закрытый центр, а затем переводят ладью и коней к атаке на короля.",
    continuations: Object.freeze([
      Object.freeze({
        key: "giuoco-piano-center",
        san: "c3",
        label: "Игра в центр",
        idea: "Пешка c2 идет на c3, чтобы подготовить d2-d4 и построить сильный центр.",
        summary: "План белых: подготовить d4, открыть центр и использовать активного слона c4.",
        lineSan: Object.freeze(["c3", "Nf6", "d4", "exd4", "cxd4"])
      }),
      Object.freeze({
        key: "giuoco-pianissimo",
        san: "d3",
        label: "Пианиссимо",
        idea: "Спокойно укрепить e4, не открывать центр сразу и сначала рокировать.",
        summary: "План белых: спокойно развиться, рокировать и потом выбрать момент для c3-d4.",
        lineSan: Object.freeze(["d3", "Nf6", "O-O", "d6", "c3"])
      }),
      Object.freeze({
        key: "evans-gambit",
        san: "b4",
        label: "Гамбит Эванса",
        idea: "Отдать пешку b4, чтобы отогнать слона c5 и быстрее захватить центр.",
        summary: "План белых: выиграть темп на слоне, сыграть c3 и d4, открыть линии к королю.",
        lineSan: Object.freeze(["b4", "Bxb4", "c3", "Ba5", "d4"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "Bxf7+",
        label: "Ранняя жертва без причины",
        whyBad: "Слон c4 забирает пешку f7 слишком рано. Если атаки нет, белые просто отдают развитую фигуру.",
        betterPlan: "Лучше сначала рокировать, подготовить c3-d4 и только потом считать жертвы на f7."
      }),
      Object.freeze({
        san: "Ng5",
        label: "Нападение до подготовки",
        whyBad: "Конь f3 идет на g5 и второй раз атакует f7, но центр еще не подготовлен, а черные получают простой ответ и темпы на коня.",
        betterPlan: "Лучше сначала сыграть c3 или d3: тогда атака на f7 будет связана с центром и развитием.",
        source: verifiedCloudEvalSource("Lichess cloud eval: после 4.Ng5 позиция примерно на 482cp хуже для белых, чем после 4.c3.")
      }),
      Object.freeze({
        san: "Nxe5",
        label: "Жадный удар по e5",
        whyBad: "Конь f3 забирает пешку e5, но белые отводят развитую фигуру в тактику до рокировки и дают черным темпы на коня и центр.",
        betterPlan: "Лучше подготовить d4 ходом c3 или спокойно укрепить e4 ходом d3.",
        source: verifiedCloudEvalSource("Lichess cloud eval: после 4.Nxe5 позиция примерно на 265cp хуже для белых, чем после 4.c3.")
      })
    ])
  }),
  Object.freeze({
    key: "sicilian-black",
    family: "1.e4",
    name: "Сицилианская защита",
    sourceName: "Sicilian Defense",
    eco: "B20-B99",
    aliases: Object.freeze(["Сицилианская защита"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают систему",
    lineSan: Object.freeze(["e4", "c5"]),
    verification: "Сверено со страницей Chess.com по Сицилианской защите и ECO B20-B99; включены открытая, закрытая и Алапин-системы.",
    principle: "Черные отвечают фланговой пешкой c7-c5 и борются за поле d4, сразу создавая несимметричную позицию.",
    positionGoal: "Понять, как белые выберут борьбу: открыть центр, закрыть его или подготовить d4 ходом c3.",
    middlegamePlan:
      "Черные часто получают полуоткрытую c-линию, контригру на ферзевом фланге и борьбу против белого центра.",
    continuations: Object.freeze([
      Object.freeze({
        key: "open-sicilian",
        san: "Nf3",
        label: "Открытая сицилианская",
        idea: "Белые готовят d4, чтобы открыть центр. Черным нужно быть готовыми к тактической борьбе.",
        summary: "План черных: разменять c-пешку на d-пешку и играть по полуоткрытой c-линии.",
        lineSan: Object.freeze(["Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"])
      }),
      Object.freeze({
        key: "closed-sicilian",
        san: "Nc3",
        label: "Закрытая система",
        idea: "Белые не открывают центр сразу и готовят развитие с g3 и Bg2.",
        summary: "План черных: развиться, контролировать d4 и искать контригру на ферзевом фланге.",
        lineSan: Object.freeze(["Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7"])
      }),
      Object.freeze({
        key: "alapin",
        san: "c3",
        label: "Вариант Алапина",
        idea: "Белые готовят d4 пешкой c3, чтобы построить широкий центр без раннего Nf3.",
        summary: "План черных: сразу ударить по центру ходом ...d5 и не дать белым бесплатно поставить d4.",
        lineSan: Object.freeze(["c3", "d5", "exd5", "Qxd5", "d4"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "Qh5",
        label: "Ферзь рано выходит в атаку",
        whyBad: "Ферзь d1 идет на h5, но черные легко получают темп развитием и нападением на ферзя.",
        betterPlan: "Лучше сначала развить коня g1 на f3 или построить центр ходом c3."
      }),
      Object.freeze({
        san: "h6",
        label: "Крайний ход вместо борьбы за d4",
        whyBad: "После 2.Nf3 ход ...h6 не мешает белым сыграть d4 и не развивает фигуры, которые должны поддерживать сицилианский центр.",
        betterPlan: "Лучше сыграть d6, Nc6 или e6 и сразу подготовиться к d4.",
        afterLineSan: Object.freeze(["e4", "c5", "Nf3"])
      }),
      Object.freeze({
        san: "f6",
        label: "Ослабляет короля и поле e6",
        whyBad: "После 2.Nf3 ход ...f6 закрывает естественное поле коня g8 и ослабляет диагонали к королю, но не решает угрозу d4.",
        betterPlan: "Лучше развить план Сицилианки через d6, Nc6 или e6.",
        afterLineSan: Object.freeze(["e4", "c5", "Nf3"])
      })
    ])
  }),
  Object.freeze({
    key: "french-black",
    family: "1.e4",
    name: "Французская защита",
    sourceName: "French Defense",
    eco: "C00-C19",
    aliases: Object.freeze(["Французская защита"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают структуру",
    lineSan: Object.freeze(["e4", "e6", "d4", "d5"]),
    verification: "Сверено со страницей Chess.com по Французской защите и ECO C00-C19; включены Винавер, Тарраш и продвинутый вариант.",
    principle: "Черные сразу готовят ...d5 и бьют по центру белых, соглашаясь на временно закрытого слона c8.",
    positionGoal: "Понять, какой центр выбрали белые: напряженный, закрытый или более спокойный.",
    middlegamePlan:
      "Черные обычно давят на пешечную цепь ходами ...c5 и ...f6, меняют плохого слона или ищут контригру на ферзевом фланге.",
    continuations: Object.freeze([
      Object.freeze({
        key: "winawer",
        san: "Nc3",
        label: "Винавер",
        idea: "Белые защищают e4 конем c3. Черные могут связать коня слоном b4 и создать дисбаланс.",
        summary: "План черных: связать коня, ударить ...c5 и давить на центр белых.",
        lineSan: Object.freeze(["Nc3", "Bb4", "e5", "c5", "a3"])
      }),
      Object.freeze({
        key: "tarrasch",
        san: "Nd2",
        label: "Тарраш",
        idea: "Белые защищают e4 конем d2 и избегают связки Bb4.",
        summary: "План черных: развить фигуры и все равно ударить по центру ходами ...c5 или ...Nf6.",
        lineSan: Object.freeze(["Nd2", "Nf6", "e5", "Nfd7", "Bd3"])
      }),
      Object.freeze({
        key: "advance-french",
        san: "e5",
        label: "Продвинутый вариант",
        idea: "Белые закрывают центр и получают пространство. Черные начинают давить на пешку d4.",
        summary: "План черных: играть ...c5, ...Nc6 и атаковать основание белой цепи d4.",
        lineSan: Object.freeze(["e5", "c5", "c3", "Nc6", "Nf3"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "Bd3",
        label: "Оставляет центр под боем",
        whyBad: "Слон f1 идет на d3, но пешка d4 все еще под ударом пешки d5, и белые не решили проблему центра.",
        betterPlan: "Лучше защитить центр ходом Nc3 или Nd2, либо закрыть центр ходом e5."
      }),
      Object.freeze({
        san: "h6",
        label: "Не отвечает на Nc3",
        whyBad: "После 3.Nc3 ход ...h6 не связывает коня, не давит на e4 и дает белым спокойно усилить центр.",
        betterPlan: "Лучше сразу сыграть Bb4, Nf6 или dxe4 - это реальные ответы на защиту пешки e4.",
        afterLineSan: Object.freeze(["e4", "e6", "d4", "d5", "Nc3"])
      }),
      Object.freeze({
        san: "f6",
        label: "Ранний подрыв без подготовки",
        whyBad: "После 3.Nc3 ход ...f6 ослабляет короля и вскрывает центр до развития фигур черных.",
        betterPlan: "Лучше сначала развить фигуры и только потом думать о подрыве ...f6 в подходящей структуре.",
        afterLineSan: Object.freeze(["e4", "e6", "d4", "d5", "Nc3"])
      })
    ])
  }),
  Object.freeze({
    key: "caro-kann-black",
    family: "1.e4",
    name: "Защита Каро-Канн",
    sourceName: "Caro-Kann Defense",
    eco: "B10-B19",
    aliases: Object.freeze(["Защита Каро-Канн"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают структуру",
    lineSan: Object.freeze(["e4", "c6", "d4", "d5"]),
    verification: "Сверено со страницей Chess.com по защите Каро-Канн и ECO B10-B19; включены классический, продвинутый и Панов.",
    principle: "Черные готовят ...d5 через c6, чтобы получить крепкий центр и не запереть слона c8.",
    positionGoal: "Понять, как белые ответят на давление на e4: защитят пешку, продвинут ее или разменяют центр.",
    middlegamePlan:
      "Черные стремятся к здоровой пешечной структуре, развитию слона c8 и спокойной игре против центра белых.",
    continuations: Object.freeze([
      Object.freeze({
        key: "classical-caro",
        san: "Nc3",
        label: "Классический вариант",
        idea: "Белые защищают e4 конем c3. Черные обычно забирают e4 и развивают слона c8.",
        summary: "План черных: разменять центр и вывести слона c8 до замыкания пешечной цепи.",
        lineSan: Object.freeze(["Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6"])
      }),
      Object.freeze({
        key: "advance-caro",
        san: "e5",
        label: "Продвинутый вариант",
        idea: "Белые получают пространство, а черные развивают слона f5 и давят на центр.",
        summary: "План черных: вывести слона c8 на f5, сыграть ...e6 и атаковать пешечную цепь.",
        lineSan: Object.freeze(["e5", "Bf5", "Nf3", "e6", "Be2"])
      }),
      Object.freeze({
        key: "panov",
        san: "exd5",
        label: "Панов",
        idea: "Белые разменивают центр и затем играют c4, создавая изолированную пешку и активные фигуры.",
        summary: "План черных: спокойно развиться и давить на возможную изолированную пешку d4.",
        lineSan: Object.freeze(["exd5", "cxd5", "c4", "Nf6", "Nc3"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "Bd3",
        label: "Не решает угрозу dxe4",
        whyBad: "Слон f1 идет на d3, но черные могут забрать пешку e4, потому что она недостаточно защищена.",
        betterPlan: "Лучше сыграть Nc3, Nd2, e5 или exd5 - это сразу отвечает на давление пешки d5."
      }),
      Object.freeze({
        san: "h6",
        label: "Пропускает задачу в центре",
        whyBad: "После 3.Nc3 ход ...h6 не берет e4, не развивает слона c8 и не помогает черным решить центральное напряжение.",
        betterPlan: "Лучше сыграть dxe4 и затем Bf5, пока слон c8 может выйти активно.",
        afterLineSan: Object.freeze(["e4", "c6", "d4", "d5", "Nc3"])
      }),
      Object.freeze({
        san: "f6",
        label: "Ломает крепкую структуру",
        whyBad: "После 3.Nc3 ход ...f6 ослабляет короля и забирает поле f6 у коня, хотя Каро-Канн строится на здоровом развитии.",
        betterPlan: "Лучше забрать e4 или выбрать продвинутую структуру через Bf5 после e5.",
        afterLineSan: Object.freeze(["e4", "c6", "d4", "d5", "Nc3"])
      })
    ])
  }),
  Object.freeze({
    key: "queens-gambit-black",
    family: "1.d4",
    name: "Ферзевый гамбит",
    sourceName: "Queen's Gambit",
    eco: "D06-D69",
    aliases: Object.freeze(["Ферзевый гамбит"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Черные выбирают защиту",
    lineSan: Object.freeze(["d4", "d5", "c4"]),
    verification: "Сверено со страницей Chess.com по Ферзевому гамбиту, Славянской защите и ECO D06-D69; включены отказанный, принятый и славянский планы.",
    principle: "Белые атакуют пешку d5 фланговой пешкой c4 и пытаются получить центр.",
    positionGoal: "Черным нужно выбрать: крепко защитить d5, временно забрать c4 или построить славянскую структуру.",
    middlegamePlan:
      "Черные играют за равенство через развитие фигур, давление на центр и своевременный удар ...c5 или ...e5.",
    continuations: Object.freeze([
      Object.freeze({
        key: "qgd",
        san: "e6",
        label: "Отказанный ферзевый гамбит",
        idea: "Черные защищают d5 пешкой e6 и строят крепкую, но немного стесненную позицию.",
        summary: "План черных: развиться, рокировать и позже ударить по центру ...c5.",
        lineSan: Object.freeze(["e6", "Nc3", "Nf6", "Nf3", "Be7"])
      }),
      Object.freeze({
        key: "qga",
        san: "dxc4",
        label: "Принятый ферзевый гамбит",
        idea: "Черные временно забирают c4, но не пытаются любой ценой удержать пешку.",
        summary: "План черных: развиться, вернуть лишнее время и ударить по центру белых.",
        lineSan: Object.freeze(["dxc4", "Nf3", "Nf6", "e3", "e6", "Bxc4"])
      }),
      Object.freeze({
        key: "slav-entry",
        san: "c6",
        label: "Славянская защита",
        idea: "Черные защищают d5 пешкой c6 и оставляют слона c8 свободным.",
        summary: "План черных: удержать центр, вывести слона c8 и при случае взять c4.",
        lineSan: Object.freeze(["c6", "Nf3", "Nf6", "Nc3", "dxc4"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "f6",
        label: "Ослабляет короля и e6",
        whyBad: "Пешка f7 идет на f6, но не развивает фигуры, ослабляет короля e8 и не решает давление на d5.",
        betterPlan: "Лучше выбрать e6, dxc4 или c6 - это реальные способы ответить на Ферзевый гамбит."
      }),
      Object.freeze({
        san: "h6",
        label: "Не отвечает на давление c4",
        whyBad: "Пешка h7 идет на h6, но белые уже атакуют d5, а черные не защищают центр и не развивают фигуры.",
        betterPlan: "Лучше выбрать e6, dxc4 или c6 - каждый из этих ходов связан с пешкой d5."
      }),
      Object.freeze({
        san: "a6",
        label: "Крайний ход раньше решения центра",
        whyBad: "Пешка a7 идет на a6, но в этой позиции главный вопрос - что делать с атакованной пешкой d5.",
        betterPlan: "Лучше сначала определить структуру: e6 для отказанного гамбита, dxc4 для принятого или c6 для славянской."
      })
    ])
  }),
  Object.freeze({
    key: "slav-black",
    family: "1.d4",
    name: "Славянская защита",
    sourceName: "Slav Defense",
    eco: "D10-D19",
    aliases: Object.freeze(["Славянская защита"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают систему",
    lineSan: Object.freeze(["d4", "d5", "c4", "c6"]),
    verification: "Сверено со страницей Chess.com по Славянской защите и ECO D10-D19; включены главная, разменная и спокойная системы.",
    principle: "Черные защищают d5 пешкой c6, не закрывая слона c8, но немного замедляют развитие коня b8.",
    positionGoal: "Понять, будут ли белые развиваться спокойно, менять центр или играть главную линию с Nc3.",
    middlegamePlan:
      "Черные стремятся вывести слона c8, удержать крепкий центр и при удобном случае забрать пешку c4.",
    continuations: Object.freeze([
      Object.freeze({
        key: "slav-main",
        san: "Nf3",
        label: "Главная линия",
        idea: "Белые развивают коня и готовят Nc3. Черные отвечают Nf6 и могут взять c4.",
        summary: "План черных: развиться, взять c4 в подходящий момент и вывести слона c8 на f5.",
        lineSan: Object.freeze(["Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "e3"])
      }),
      Object.freeze({
        key: "slav-exchange",
        san: "cxd5",
        label: "Разменный вариант",
        idea: "Белые снимают напряжение в центре и получают симметричную структуру.",
        summary: "План черных: не бояться симметрии, спокойно развить фигуры и бороться за активность.",
        lineSan: Object.freeze(["cxd5", "cxd5", "Nf3", "Nf6", "Nc3"])
      }),
      Object.freeze({
        key: "slav-quiet",
        san: "e3",
        label: "Спокойная система",
        idea: "Белые укрепляют c4/d4 и развиваются без тяжелой теории.",
        summary: "План черных: развить Nf6, Bf5 и e6, не отдавая центр бесплатно.",
        lineSan: Object.freeze(["e3", "Nf6", "Nf3", "Bf5"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "f3",
        label: "Ослабляет короля",
        whyBad: "Пешка f2 идет на f3, но не развивает фигуры, закрывает естественное поле коня g1 и ослабляет короля.",
        betterPlan: "Лучше развить коня g1 на f3 или коня b1 на c3 и только потом решать центр."
      }),
      Object.freeze({
        san: "h6",
        label: "Не развивает Славянку",
        whyBad: "После 3.Nf3 ход ...h6 не выводит коня g8 и не готовит активный выход слона c8.",
        betterPlan: "Лучше сыграть Nf6, чтобы развить фигуру и удержать центр d5-c6.",
        afterLineSan: Object.freeze(["d4", "d5", "c4", "c6", "Nf3"])
      }),
      Object.freeze({
        san: "f6",
        label: "Ослабляет короля в закрытой структуре",
        whyBad: "После 3.Nf3 ход ...f6 забирает поле у коня g8 и открывает диагонали к королю, хотя черным нужно спокойно развиваться.",
        betterPlan: "Лучше Nf6 или Bf5 после подготовки: это развивает фигуры без лишних слабостей.",
        afterLineSan: Object.freeze(["d4", "d5", "c4", "c6", "Nf3"])
      })
    ])
  }),
  Object.freeze({
    key: "kings-indian-black",
    family: "1.d4",
    name: "Староиндийская защита",
    sourceName: "King's Indian Defense",
    eco: "E60-E99",
    aliases: Object.freeze(["Староиндийская защита"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают план",
    lineSan: Object.freeze(["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"]),
    verification: "Сверено со страницей Chess.com по Староиндийской защите и ECO E60-E99; включены классическая, Земиш и фианкетто.",
    principle: "Черные отдают белым пространство в центре, но быстро фианкеттируют слона g7 и готовят контрудар.",
    positionGoal: "Понять, какой центр и королевский фланг строят белые, чтобы выбрать правильный контрудар.",
    middlegamePlan:
      "Черные часто рокируют, играют ...e5 или ...c5 и потом атакуют там, где центр подскажет направление.",
    continuations: Object.freeze([
      Object.freeze({
        key: "kid-classical",
        san: "Nf3",
        label: "Классическая система",
        idea: "Белые спокойно развиваются и готовят Be2/O-O. Черные отвечают рокировкой и ударом ...e5.",
        summary: "План черных: рокировать, сыграть ...e5 и начать борьбу за темные поля.",
        lineSan: Object.freeze(["Nf3", "O-O", "Be2", "e5", "O-O"])
      }),
      Object.freeze({
        key: "kid-samisch",
        san: "f3",
        label: "Система Земиша",
        idea: "Белые укрепляют e4 и готовят Be3/Qd2. Черным важно не ждать пассивно.",
        summary: "План черных: быстро рокировать и подрывать центр ходами ...c5 или ...e5.",
        lineSan: Object.freeze(["f3", "O-O", "Be3", "Nc6", "Qd2"])
      }),
      Object.freeze({
        key: "kid-fianchetto",
        san: "g3",
        label: "Фианкетто",
        idea: "Белые ставят слона на g2 и играют более позиционно против слона g7.",
        summary: "План черных: рокировать, играть ...e5 и не давать белым спокойно давить по диагонали.",
        lineSan: Object.freeze(["g3", "O-O", "Bg2", "e5", "Nge2"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "h3",
        label: "Медленный крайний ход",
        whyBad: "Пешка h2 идет на h3, но центр уже напряжен, а белые еще не завершили развитие.",
        betterPlan: "Лучше выбрать Nf3, f3 или g3 - эти ходы сразу строят понятный план против Староиндийской."
      }),
      Object.freeze({
        san: "Nxe4",
        label: "Жадный захват до рокировки",
        whyBad: "После 5.Nf3 конь f6 берет e4, но черный король еще в центре, а белые получают темпы на коня и открывают игру.",
        betterPlan: "Лучше сначала рокировать и только потом подрывать центр ходами ...e5 или ...c5.",
        afterLineSan: Object.freeze(["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3"])
      }),
      Object.freeze({
        san: "h6",
        label: "Медлит с безопасностью короля",
        whyBad: "После 5.Nf3 ход ...h6 не рокирует и не бьет по центру, а белые получают время спокойно завершить развитие.",
        betterPlan: "Лучше O-O: после рокировки черные смогут выбирать ...e5 или ...c5 без короля в центре.",
        afterLineSan: Object.freeze(["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3"])
      })
    ])
  }),
  Object.freeze({
    key: "nimzo-indian-black",
    family: "1.d4",
    name: "Защита Нимцовича",
    sourceName: "Nimzo-Indian Defense",
    eco: "E20-E59",
    aliases: Object.freeze(["Защита Нимцовича"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают систему",
    lineSan: Object.freeze(["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"]),
    verification: "Сверено со страницей Chess.com по защите Нимцовича и ECO E20-E59; включены Рубинштейн, классический и Земиш.",
    principle: "Черные связывают коня c3, который поддерживает центр белых, и готовы испортить пешечную структуру.",
    positionGoal: "Понять, чем белые ответят на связку: e3, Qc2 или a3.",
    middlegamePlan:
      "Черные часто меняют слона на коня c3, затем давят на сдвоенные пешки или играют против центра белых.",
    continuations: Object.freeze([
      Object.freeze({
        key: "nimzo-rubinstein",
        san: "e3",
        label: "Рубинштейн",
        idea: "Белые спокойно развивают слона f1 и укрепляют центр.",
        summary: "План черных: рокировать, играть ...d5 и решать, когда менять слона на коня c3.",
        lineSan: Object.freeze(["e3", "O-O", "Bd3", "d5", "Nf3"])
      }),
      Object.freeze({
        key: "nimzo-classical",
        san: "Qc2",
        label: "Классический вариант",
        idea: "Ферзь защищает коня c3, чтобы после Bxc3 белые могли взять ферзем без сдвоенных пешек.",
        summary: "План черных: рокировать и играть по центру, пока белый ферзь вышел рано.",
        lineSan: Object.freeze(["Qc2", "O-O", "a3", "Bxc3+", "Qxc3"])
      }),
      Object.freeze({
        key: "nimzo-samisch",
        san: "a3",
        label: "Земиш",
        idea: "Белые сразу спрашивают слона b4 и готовы получить пару слонов ценой сдвоенных пешек.",
        summary: "План черных: отдать слона за коня c3 и потом давить на пешки c3/c4.",
        lineSan: Object.freeze(["a3", "Bxc3+", "bxc3", "O-O", "e3"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "g4",
        label: "Слишком ранняя атака пешкой",
        whyBad: "Пешка g2 идет на g4, но белый король еще в центре, а развитие не закончено.",
        betterPlan: "Лучше выбрать e3, Qc2 или a3 - эти ходы прямо отвечают на связку коня c3."
      }),
      Object.freeze({
        san: "h6",
        label: "Не использует связку",
        whyBad: "После 4.e3 ход ...h6 не развивает черных и не усиливает давление на коня c3, ради которого сыгран ...Bb4.",
        betterPlan: "Лучше O-O или d5: так черные заканчивают развитие и играют против центра.",
        afterLineSan: Object.freeze(["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3"])
      }),
      Object.freeze({
        san: "Ba5",
        label: "Слон отходит без причины",
        whyBad: "Слон b4 уходит на a5 и сам снимает полезную связку с коня c3, не вынуждая белых ничего уступить.",
        betterPlan: "Лучше рокировать или ударить по центру ходом d5, сохраняя давление на c3.",
        afterLineSan: Object.freeze(["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3"])
      })
    ])
  }),
  Object.freeze({
    key: "english-white",
    family: "Фланговые дебюты",
    name: "Английское начало",
    sourceName: "English Opening",
    eco: "A10-A39",
    aliases: Object.freeze(["Английское начало"]),
    studySide: "white",
    studyLabel: "Изучаем за белых",
    turnLabel: "Черные выбирают ответ",
    lineSan: Object.freeze(["c4"]),
    verification: "Сверено со страницей Chess.com по Английскому началу и ECO A10-A39; включены обратная сицилианская и симметричная английская структуры.",
    principle: "Белые контролируют центр фланговой пешкой c4 и часто переводят игру в знакомые структуры с лишним темпом.",
    positionGoal: "Понять, какой центр ставят черные: ...e5, ...c5 или гибкое ...Nf6.",
    middlegamePlan:
      "Белые обычно развивают коня c3, фианкеттируют слона g2 и выбирают момент для d4 или игры на ферзевом фланге.",
    continuations: Object.freeze([
      Object.freeze({
        key: "reversed-sicilian",
        san: "e5",
        label: "Сицилианская с лишним темпом",
        idea: "Черные ставят пешку e5, а белые строят позицию, похожую на сицилианскую за белых.",
        summary: "План белых: развить Nc3, g3, Bg2 и давить на центр d5.",
        lineSan: Object.freeze(["e5", "Nc3", "Nf6", "g3", "d5"])
      }),
      Object.freeze({
        key: "symmetrical-english",
        san: "c5",
        label: "Симметричная английская",
        idea: "Черные копируют c5. Борьба идет за то, кто лучше подготовит d4 или ...d5.",
        summary: "План белых: развить Nf3/Nc3, удержать гибкость и выбрать момент для d4.",
        lineSan: Object.freeze(["c5", "Nf3", "Nf6", "Nc3", "Nc6"])
      }),
      Object.freeze({
        key: "english-nf6",
        san: "Nf6",
        label: "Гибкий ответ",
        idea: "Черные не показывают структуру сразу. Белые развивают Nc3 и g3.",
        summary: "План белых: фианкеттировать слона и не спешить раскрывать центральные пешки.",
        lineSan: Object.freeze(["Nf6", "Nc3", "e5", "g3", "Bb4"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "h5",
        label: "Не борется за центр",
        whyBad: "Пешка h7 идет на h5, но она не развивает фигуры и не мешает белым захватить центр.",
        betterPlan: "Лучше ответить e5, c5 или Nf6 - эти ходы сразу борются за центральные поля."
      }),
      Object.freeze({
        san: "h4",
        label: "Фланг вместо развития",
        whyBad: "После ...e5 ход h4 не развивает фигуры и не помогает белым давить на d5.",
        betterPlan: "Лучше Nc3: конь выходит к центру и поддерживает типовой английский план.",
        afterLineSan: Object.freeze(["c4", "e5"])
      }),
      Object.freeze({
        san: "a3",
        label: "Медленный профилактический ход",
        whyBad: "После ...e5 ход a3 ничего не делает с центром и не развивает королевский фланг.",
        betterPlan: "Лучше Nc3 или g3, чтобы сразу строить давление на центральные поля.",
        afterLineSan: Object.freeze(["c4", "e5"])
      })
    ])
  }),
  Object.freeze({
    key: "scotch-white",
    family: "1.e4 e5",
    name: "Шотландская партия",
    sourceName: "Scotch Game",
    eco: "C44-C45",
    aliases: Object.freeze(["Шотландская игра"]),
    studySide: "white",
    studyLabel: "Изучаем за белых",
    turnLabel: "Белые выбирают план",
    lineSan: Object.freeze(["e4", "e5", "Nf3", "Nc6", "d4", "exd4"]),
    verification: "Сверено со страницей Chess.com по Шотландской партии и ECO C44-C45; линии проверены на легальность.",
    principle: "Белые рано открывают центр ходом d4 и заставляют черных сразу решать центральное напряжение.",
    positionGoal: "Понять, будут ли белые возвращать пешку фигурой, играть гамбитно или строить широкий центр.",
    middlegamePlan:
      "Белые обычно быстро выводят фигуры, рокируют и используют открытые линии, пока черные не закончили развитие.",
    continuations: Object.freeze([
      Object.freeze({
        key: "scotch-main",
        san: "Nxd4",
        label: "Главная линия",
        idea: "Конь f3 берет пешку d4 и занимает центр. Белые получают активную игру без лишнего риска.",
        summary: "План белых: развить Nc3, рокировать и давить на черного коня c6 и центр.",
        lineSan: Object.freeze(["Nxd4", "Nf6", "Nc3", "Bb4", "Nxc6"])
      }),
      Object.freeze({
        key: "scotch-gambit",
        san: "Bc4",
        label: "Шотландский гамбит",
        idea: "Белые не сразу возвращают пешку, а развивают слона c4 и давят на f7.",
        summary: "План белых: быстро рокировать, открыть центр и использовать отставание черных в развитии.",
        lineSan: Object.freeze(["Bc4", "Nf6", "O-O", "Bc5", "e5"])
      }),
      Object.freeze({
        key: "goering-gambit",
        san: "c3",
        label: "Гамбит Геринга",
        idea: "Пешка c2 идет на c3, чтобы отвлечь черную пешку d4 и открыть линии для фигур.",
        summary: "План белых: отдать пешку за темп, быстро вывести слона c4 и рокировать.",
        lineSan: Object.freeze(["c3", "dxc3", "Bc4", "Nf6", "O-O"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "Qxd4",
        label: "Ферзь попадает под коня",
        whyBad: "Ферзь d1 берет пешку d4, но черный конь c6 уже нападает на d4 и выигрывает темп на ферзе.",
        betterPlan: "Лучше взять пешку конем f3 на d4 или выбрать гамбитный план Bc4/c3."
      }),
      Object.freeze({
        san: "e5",
        label: "Толкает пешку, оставляя d4",
        whyBad: "Пешка e4 идет на e5, но белые не возвращают пешку d4 и дают черным удобный темп на коня f3.",
        betterPlan: "Лучше сначала вернуть центр ходом Nxd4 или выбрать понятный гамбитный план Bc4/c3."
      }),
      Object.freeze({
        san: "Bd3",
        label: "Закрывает развитие без возврата центра",
        whyBad: "Слон f1 идет на d3, но пешка d4 остается у черных, а белые не используют открытую линию для быстрой игры.",
        betterPlan: "Лучше Nxd4: белые возвращают пешку и развивают фигуру в центр."
      })
    ])
  }),
  Object.freeze({
    key: "scandinavian-black",
    family: "1.e4",
    name: "Скандинавская защита",
    sourceName: "Scandinavian Defense",
    eco: "B01",
    aliases: Object.freeze(["Центр-контратака"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Черные возвращают пешку",
    lineSan: Object.freeze(["e4", "d5", "exd5"]),
    verification: "Сверено со страницей Chess.com по Скандинавской защите и ECO B01; показаны основные способы вернуть пешку.",
    principle: "Черные сразу бьют по пешке e4 ходом d5 и вызывают раннее открытие центра.",
    positionGoal: "Понять, возвращать ли пешку ферзем сразу, развивать коня f6 или играть гамбитно через c6.",
    middlegamePlan:
      "Черные стараются вернуть пешку, быстро развить фигуры и не дать ферзю стать постоянной целью белых темпов.",
    continuations: Object.freeze([
      Object.freeze({
        key: "scandi-qxd5",
        san: "Qxd5",
        label: "Классический план",
        idea: "Ферзь d8 берет пешку d5. После Nc3 ферзь обычно уходит на a5, чтобы не терять темпы.",
        summary: "План черных: вернуть пешку, уйти ферзем из-под темпа и развить Nf6/Bf5.",
        lineSan: Object.freeze(["Qxd5", "Nc3", "Qa5", "d4", "Nf6"])
      }),
      Object.freeze({
        key: "scandi-modern",
        san: "Nf6",
        label: "Современный план",
        idea: "Конь g8 идет на f6 и нападает на пешку d5, не выводя ферзя слишком рано.",
        summary: "План черных: вернуть пешку конем, затем фианкеттировать слона или сыграть ...Bg4.",
        lineSan: Object.freeze(["Nf6", "d4", "Nxd5", "Nf3", "g6"])
      }),
      Object.freeze({
        key: "scandi-c6",
        san: "c6",
        label: "Гамбитный план",
        idea: "Пешка c7 идет на c6 и предлагает белым взять еще одну пешку, чтобы черные развили коня с темпом.",
        summary: "План черных: вернуть пешку конем b8 на c6 и получить развитие за материал.",
        lineSan: Object.freeze(["c6", "dxc6", "Nxc6", "Nf3", "Nf6"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "h6",
        label: "Забывает про пешку d5",
        whyBad: "Пешка h7 идет на h6, но черные не возвращают пешку d5 и не развивают фигуры.",
        betterPlan: "Лучше сразу играть Qxd5, Nf6 или c6 - все эти ходы связаны с пешкой d5."
      }),
      Object.freeze({
        san: "a6",
        label: "Не возвращает материал",
        whyBad: "Пешка a7 идет на a6, но белые уже забрали d5, и черные не получают ни развития, ни компенсации.",
        betterPlan: "Лучше Qxd5, Nf6 или c6 - каждый ход сразу работает против пешки d5."
      }),
      Object.freeze({
        san: "f6",
        label: "Ослабляет короля вместо развития",
        whyBad: "Пешка f7 идет на f6, но не возвращает d5 и открывает диагонали к королю.",
        betterPlan: "Лучше развить фигуру ходом Nf6 или вернуть пешку ферзем Qxd5."
      })
    ])
  }),
  Object.freeze({
    key: "pirc-black",
    family: "1.e4",
    name: "Защита Пирца",
    sourceName: "Pirc Defense",
    eco: "B07-B09",
    aliases: Object.freeze(["Защита Пирца-Уфимцева"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают систему",
    lineSan: Object.freeze(["e4", "d6", "d4", "Nf6", "Nc3", "g6"]),
    verification: "Сверено со страницей Chess.com по защите Пирца и ECO B07-B09; включены классическая, австрийская и атакующая системы.",
    principle: "Черные не спорят за центр пешками сразу, а дают белым занять центр и затем атакуют его фигурами.",
    positionGoal: "Понять, какую схему ставят белые: спокойную Nf3, агрессивную f4 или атаку Be3/Qd2.",
    middlegamePlan:
      "Черные обычно фианкеттируют слона g7, рокируют и подрывают центр ходами ...e5 или ...c5.",
    continuations: Object.freeze([
      Object.freeze({
        key: "pirc-classical",
        san: "Nf3",
        label: "Классическая система",
        idea: "Белые развивают коня g1 на f3 и спокойно защищают центр e4-d4.",
        summary: "План черных: Bg7, O-O и затем ударить по центру ...e5 или ...c5.",
        lineSan: Object.freeze(["Nf3", "Bg7", "Be2", "O-O", "O-O"])
      }),
      Object.freeze({
        key: "pirc-austrian",
        san: "f4",
        label: "Австрийская атака",
        idea: "Пешка f2 идет на f4, белые строят большой центр и готовят атаку на короля.",
        summary: "План черных: не паниковать, развиться, рокировать и подрывать центр белых.",
        lineSan: Object.freeze(["f4", "Bg7", "Nf3", "O-O", "Bd3"])
      }),
      Object.freeze({
        key: "pirc-150",
        san: "Be3",
        label: "Атакующая система",
        idea: "Слон c1 идет на e3, белые готовят Qd2 и длинную рокировку.",
        summary: "План черных: быстро рокировать, следить за h-пешкой белых и контратаковать центр.",
        lineSan: Object.freeze(["Be3", "Bg7", "Qd2", "O-O", "O-O-O"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "g4",
        label: "Атака без развития",
        whyBad: "Пешка g2 идет на g4, но белый король еще в центре, а фигуры королевского фланга не развиты.",
        betterPlan: "Лучше выбрать Nf3, f4 или Be3 - эти планы одновременно развивают фигуры и держат центр."
      }),
      Object.freeze({
        san: "h6",
        label: "Не завершает фианкетто",
        whyBad: "После 4.Nf3 ход ...h6 не выводит слона g7 и оставляет черных без главной фигуры Пирца.",
        betterPlan: "Лучше Bg7: слон сразу давит на центр и готовит рокировку.",
        afterLineSan: Object.freeze(["e4", "d6", "d4", "Nf6", "Nc3", "g6", "Nf3"])
      }),
      Object.freeze({
        san: "a6",
        label: "Фланг раньше короля",
        whyBad: "После 4.Nf3 ход ...a6 не помогает королю и не атакует центр белых.",
        betterPlan: "Лучше Bg7 и O-O, а затем выбирать подрыв ...e5 или ...c5.",
        afterLineSan: Object.freeze(["e4", "d6", "d4", "Nf6", "Nc3", "g6", "Nf3"])
      })
    ])
  }),
  Object.freeze({
    key: "london-white",
    family: "1.d4",
    name: "Лондонская система",
    sourceName: "London System",
    eco: "D02",
    aliases: Object.freeze(["Лондон"]),
    studySide: "white",
    studyLabel: "Изучаем за белых",
    turnLabel: "Белые строят систему",
    lineSan: Object.freeze(["d4", "d5", "Bf4", "Nf6"]),
    verification: "Сверено со страницей Chess.com по Лондонской системе и ECO D02; линии проверены как учебные структуры.",
    principle: "Белые заранее выводят слона c1 на f4 и строят устойчивую схему без раннего тактического риска.",
    positionGoal: "Понять, когда играть e3, Nf3 или c4, не запирая собственного слона f4.",
    middlegamePlan:
      "Белые обычно ставят e3, Nf3, Bd3, c3, рокируют и готовят Ne5 или постепенную атаку на королевском фланге.",
    continuations: Object.freeze([
      Object.freeze({
        key: "london-e3",
        san: "e3",
        label: "Классическая расстановка",
        idea: "Пешка e2 идет на e3, открывает слона f1 и укрепляет центр d4.",
        summary: "План белых: Nf3, Bd3, O-O и затем Ne5 или c3.",
        lineSan: Object.freeze(["e3", "e6", "Nf3", "Bd6", "Bg3"])
      }),
      Object.freeze({
        key: "london-nf3",
        san: "Nf3",
        label: "Сначала развитие",
        idea: "Конь g1 идет на f3 и помогает держать центр e5/d4.",
        summary: "План белых: e3, Bd3, O-O и не отдавать слона f4 без причины.",
        lineSan: Object.freeze(["Nf3", "e6", "e3", "Bd6", "Bg3"])
      }),
      Object.freeze({
        key: "london-c4",
        san: "c4",
        label: "Больше давления на центр",
        idea: "Пешка c2 идет на c4 и сразу атакует пешку d5.",
        summary: "План белых: перейти к структурам ферзевого гамбита, сохранив активного слона f4.",
        lineSan: Object.freeze(["c4", "e6", "Nc3", "Be7", "e3"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "f3",
        label: "Ослабляет короля",
        whyBad: "Пешка f2 идет на f3, забирает поле у коня g1 и открывает диагонали к королю e1.",
        betterPlan: "Лучше развить коня g1 на f3 или спокойно сыграть e3."
      }),
      Object.freeze({
        san: "Bxc7",
        label: "Жадный рейд слоном",
        whyBad: "Слон f4 забирает пешку c7, но уходит далеко от короля, теряет темпы и дает черным простую охоту на слона.",
        betterPlan: "Лучше e3 или Nf3: белые заканчивают развитие и сохраняют лондонскую структуру."
      }),
      Object.freeze({
        san: "h3",
        label: "Медлит с развитием",
        whyBad: "Пешка h2 идет на h3, но белые еще не открыли слона f1 и не вывели коня g1.",
        betterPlan: "Лучше e3 или Nf3 - эти ходы сразу строят рабочую расстановку Лондона."
      })
    ])
  }),
  Object.freeze({
    key: "grunfeld-black",
    family: "1.d4",
    name: "Защита Грюнфельда",
    sourceName: "Grunfeld Defense",
    eco: "D70-D99",
    aliases: Object.freeze(["Грюнфельд"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают центр",
    lineSan: Object.freeze(["d4", "Nf6", "c4", "g6", "Nc3", "d5"]),
    verification: "Сверено со страницей Chess.com по защите Грюнфельда и ECO D70-D99; включены основные способы белых построить центр.",
    principle: "Черные разрешают белым занять центр пешками, но сразу атакуют его ходом ...d5.",
    positionGoal: "Понять, берут ли белые на d5, развиваются спокойно или выводят слона f4.",
    middlegamePlan:
      "Черные чаще всего давят на центр белых слоном g7, конем c6, ходом ...c5 и игрой по большой диагонали.",
    continuations: Object.freeze([
      Object.freeze({
        key: "grunfeld-exchange",
        san: "cxd5",
        label: "Разменный вариант",
        idea: "Пешка c4 берет d5, белые строят большой центр e4-d4.",
        summary: "План черных: разменять коня на c3 и атаковать центр белых слоном g7.",
        lineSan: Object.freeze(["cxd5", "Nxd5", "e4", "Nxc3", "bxc3"])
      }),
      Object.freeze({
        key: "grunfeld-nf3",
        san: "Nf3",
        label: "Спокойное развитие",
        idea: "Белые сначала развивают коня g1 на f3 и не раскрывают центр сразу.",
        summary: "План черных: Bg7, O-O и давление на c4/d4.",
        lineSan: Object.freeze(["Nf3", "Bg7", "Qb3", "dxc4", "Qxc4"])
      }),
      Object.freeze({
        key: "grunfeld-bf4",
        san: "Bf4",
        label: "Развитие слона",
        idea: "Слон c1 идет на f4 и давит на c7, пока центр еще напряжен.",
        summary: "План черных: Bg7, O-O и ударить по центру ходом ...c5.",
        lineSan: Object.freeze(["Bf4", "Bg7", "e3", "O-O", "Nf3"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "h4",
        label: "Фланг раньше центра",
        whyBad: "Пешка h2 идет на h4, но белые еще не решили, как держать центр d4-c4.",
        betterPlan: "Лучше выбрать cxd5, Nf3 или Bf4 - эти ходы отвечают на давление по центру."
      }),
      Object.freeze({
        san: "h6",
        label: "Не возвращает пешку d5",
        whyBad: "После cxd5 ход ...h6 оставляет белым лишнюю центральную пешку и не включает слона g7.",
        betterPlan: "Лучше Nxd5: конь возвращает материал и начинает давление на центр.",
        afterLineSan: Object.freeze(["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5"])
      }),
      Object.freeze({
        san: "a6",
        label: "Фланг вместо центра",
        whyBad: "После cxd5 ход ...a6 не возвращает пешку и не давит на d4.",
        betterPlan: "Лучше Nxd5, чтобы сразу вернуть материал и перейти к типовой игре Грюнфельда.",
        afterLineSan: Object.freeze(["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5"])
      })
    ])
  }),
  Object.freeze({
    key: "dutch-black",
    family: "1.d4",
    name: "Голландская защита",
    sourceName: "Dutch Defense",
    eco: "A80-A99",
    aliases: Object.freeze(["Голландская"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают развитие",
    lineSan: Object.freeze(["d4", "f5"]),
    verification: "Сверено со страницей Chess.com по Голландской защите и ECO A80-A99; включены основные спокойные построения белых.",
    principle: "Черные берут под контроль поле e4 пешкой f5 и заранее показывают борьбу за королевский фланг.",
    positionGoal: "Понять, строят ли белые фианкетто g3, классический центр c4 или гибкую схему Nf3.",
    middlegamePlan:
      "Черные обычно развивают Nf6, e6, Be7 или g6/Bg7, рокируют и готовят давление на e4 или атаку на короля.",
    continuations: Object.freeze([
      Object.freeze({
        key: "dutch-fianchetto",
        san: "g3",
        label: "Фианкетто",
        idea: "Белые готовят Bg2, чтобы давить на длинную диагональ и держать центр.",
        summary: "План черных: Nf6, e6 и спокойная рокировка без ослаблений.",
        lineSan: Object.freeze(["g3", "Nf6", "Bg2", "e6", "Nf3"])
      }),
      Object.freeze({
        key: "dutch-c4",
        san: "c4",
        label: "Классический центр",
        idea: "Пешка c2 идет на c4 и белые строят обычный ферзевый центр.",
        summary: "План черных: Nf6, e6 и решить, играть ли ...Bb4 или ...Be7.",
        lineSan: Object.freeze(["c4", "Nf6", "Nc3", "e6", "g3"])
      }),
      Object.freeze({
        key: "dutch-nf3",
        san: "Nf3",
        label: "Гибкое развитие",
        idea: "Белые выводят коня g1 на f3 и пока не показывают структуру.",
        summary: "План черных: Nf6, e6 и подготовить безопасную рокировку.",
        lineSan: Object.freeze(["Nf3", "Nf6", "g3", "e6", "Bg2"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "h4",
        label: "Не развивает фигуры",
        whyBad: "Пешка h2 идет на h4, но белые не борются с идеей ...Nf6 и не развивают королевский фланг.",
        betterPlan: "Лучше играть g3, c4 или Nf3 - эти ходы развивают позицию и держат центр."
      }),
      Object.freeze({
        san: "h6",
        label: "Не развивает голландскую схему",
        whyBad: "После 2.g3 ход ...h6 не выводит коня g8 и не помогает черным закрепить контроль над e4.",
        betterPlan: "Лучше Nf6: конь выходит к центру и готовит нормальное развитие.",
        afterLineSan: Object.freeze(["d4", "f5", "g3"])
      }),
      Object.freeze({
        san: "a6",
        label: "Пауза на ферзевом фланге",
        whyBad: "После 2.g3 ход ...a6 не развивает фигуры и не отвечает на будущий слон g2.",
        betterPlan: "Лучше Nf6 или e6, чтобы построить устойчивую голландскую расстановку.",
        afterLineSan: Object.freeze(["d4", "f5", "g3"])
      })
    ])
  }),
  Object.freeze({
    key: "reti-white",
    family: "Фланговые дебюты",
    name: "Дебют Рети",
    sourceName: "Reti Opening",
    eco: "A04-A09",
    aliases: Object.freeze(["Рети"]),
    studySide: "white",
    studyLabel: "Изучаем за белых",
    turnLabel: "Белые выбирают структуру",
    lineSan: Object.freeze(["Nf3", "d5"]),
    verification: "Сверено со страницей Chess.com по дебюту Рети и ECO A04-A09; включены переходы в английские и ферзевые структуры.",
    principle: "Белые начинают с развития коня и давления на центр, не показывая сразу пешечную структуру.",
    positionGoal: "Понять, играть ли c4, g3 или перейти в обычный центр d4-c4.",
    middlegamePlan:
      "Белые часто фианкеттируют слона g2, давят на d5 и выбирают момент для c4 или d4.",
    continuations: Object.freeze([
      Object.freeze({
        key: "reti-c4",
        san: "c4",
        label: "Давление на d5",
        idea: "Пешка c2 идет на c4 и сразу атакует пешку d5.",
        summary: "План белых: g3, Bg2, O-O и давление на центр.",
        lineSan: Object.freeze(["c4", "e6", "g3", "Nf6", "Bg2"])
      }),
      Object.freeze({
        key: "reti-g3",
        san: "g3",
        label: "Фианкетто",
        idea: "Белые готовят слона g2, который будет давить на диагональ h1-a8.",
        summary: "План белых: Bg2, O-O и затем c4 или d4 по ситуации.",
        lineSan: Object.freeze(["g3", "Nf6", "Bg2", "e6", "O-O"])
      }),
      Object.freeze({
        key: "reti-d4",
        san: "d4",
        label: "Переход в ферзевые структуры",
        idea: "Белые ставят пешку d4 и переходят в знакомую игру против d5.",
        summary: "План белых: c4, g3 и спокойное развитие без раннего риска.",
        lineSan: Object.freeze(["d4", "Nf6", "c4", "e6", "g3"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "h3",
        label: "Слишком медленно",
        whyBad: "Пешка h2 идет на h3, но белые не давят на центр d5 и не развивают новые фигуры.",
        betterPlan: "Лучше играть c4, g3 или d4 - эти ходы задают понятную структуру."
      }),
      Object.freeze({
        san: "h4",
        label: "Фланг вместо давления на d5",
        whyBad: "Пешка h2 идет на h4, но пешка d5 остается без давления, а белые не строят фианкетто и не занимают центр.",
        betterPlan: "Лучше c4, g3 или d4 - это реальные планы дебюта Рети."
      }),
      Object.freeze({
        san: "a3",
        label: "Пустая профилактика",
        whyBad: "Пешка a2 идет на a3, но черные уже стоят в центре, а белые не создают давления на d5.",
        betterPlan: "Лучше c4 или g3, чтобы начать типовую игру против центра черных."
      })
    ])
  }),
  Object.freeze({
    key: "benoni-black",
    family: "1.d4",
    name: "Защита Бенони",
    sourceName: "Benoni Defense",
    eco: "A56-A79",
    aliases: Object.freeze(["Бенони"]),
    studySide: "black",
    studyLabel: "Изучаем за черных",
    turnLabel: "Белые выбирают развитие",
    lineSan: Object.freeze(["d4", "Nf6", "c4", "c5", "d5", "e6"]),
    verification: "Сверено со страницей Chess.com по защите Бенони и ECO A56-A79; включены типовые развивающие ответы белых.",
    principle: "Черные сразу атакуют белый центр c4-d5 и готовы получить активную, но требовательную структуру.",
    positionGoal: "Понять, развивают ли белые коня c3, коня f3 или фианкеттируют слона g2.",
    middlegamePlan:
      "Черные часто меняют на d5, играют ...d6, ...g6, ...Bg7 и ищут контригру по темным полям и ферзевому флангу.",
    continuations: Object.freeze([
      Object.freeze({
        key: "benoni-nc3",
        san: "Nc3",
        label: "Классическое развитие",
        idea: "Конь b1 идет на c3 и поддерживает центр d5/e4.",
        summary: "План черных: exd5, d6, g6 и давление на центр белых.",
        lineSan: Object.freeze(["Nc3", "exd5", "cxd5", "d6", "e4"])
      }),
      Object.freeze({
        key: "benoni-nf3",
        san: "Nf3",
        label: "Гибкая система",
        idea: "Белые выводят коня g1 на f3 и пока не раскрывают все центральные планы.",
        summary: "План черных: снять напряжение на d5 и развить королевский фланг.",
        lineSan: Object.freeze(["Nf3", "exd5", "cxd5", "d6", "Nc3"])
      }),
      Object.freeze({
        key: "benoni-g3",
        san: "g3",
        label: "Фианкетто",
        idea: "Белые готовят Bg2, чтобы давить по длинной диагонали.",
        summary: "План черных: exd5, d6, g6 и не позволить белым спокойно провести e4-e5.",
        lineSan: Object.freeze(["g3", "exd5", "cxd5", "d6", "Bg2"])
      })
    ]),
    badMoves: Object.freeze([
      Object.freeze({
        san: "dxe6",
        label: "Рано снимает напряжение",
        whyBad: "Пешка d5 берет e6, но белые отпускают пространство d5 и помогают черным раскрыть фигуры.",
        betterPlan: "Лучше развить Nc3, Nf3 или g3 и сохранить давление в центре."
      }),
      Object.freeze({
        san: "h6",
        label: "Не снимает напряжение в центре",
        whyBad: "После 4.Nc3 ход ...h6 оставляет пешку e6 под давлением и не помогает черным построить структуру Бенони.",
        betterPlan: "Лучше exd5: черные сразу определяют центр и готовят ...d6, ...g6 и ...Bg7.",
        afterLineSan: Object.freeze(["d4", "Nf6", "c4", "c5", "d5", "e6", "Nc3"])
      }),
      Object.freeze({
        san: "a6",
        label: "Фланг до решения центра",
        whyBad: "После 4.Nc3 ход ...a6 не отвечает на напряжение d5-e6 и дает белым лишний темп развития.",
        betterPlan: "Лучше exd5 и затем d6/g6, чтобы получить понятную структуру Бенони.",
        afterLineSan: Object.freeze(["d4", "Nf6", "c4", "c5", "d5", "e6", "Nc3"])
      })
    ])
  })
]);

/** @type {ResearchSource} */
const RESEARCH_SOURCE = /** @type {ResearchSource} */ (loadOpeningResearchSource());
/** @type {ResearchValidation} */
const RESEARCH_VALIDATION = /** @type {ResearchValidation} */ (loadOpeningResearchValidation());
/** @type {ReadonlyMap<string, ResearchValidationEntry>} */
const RESEARCH_VALIDATION_BY_ID = new Map(RESEARCH_VALIDATION.variations.map((entry) => [entry.id, entry]));

/** @type {Readonly<Record<string, string>>} */
const RESEARCH_FAMILY_RU = Object.freeze({
  "Alekhine Defense": "Защита Алехина",
  "Benoni Defense": "Защита Бенони",
  "Bird Opening": "Дебют Берда",
  "Bogo-Indian Defense": "Защита Боголюбова",
  "Caro-Kann Defense": "Защита Каро-Канн",
  "Catalan Opening": "Каталонское начало",
  "Dutch Defense": "Голландская защита",
  "English Opening": "Английское начало",
  "French Defense": "Французская защита",
  "Grünfeld Defense": "Защита Грюнфельда",
  "Italian Game": "Итальянская партия",
  "King's Indian Defense": "Староиндийская защита",
  "King’s Indian Defense": "Староиндийская защита",
  "King’s Gambit": "Королевский гамбит",
  "King’s Indian Attack": "Староиндийская атака",
  "Modern Defense": "Модерн-защита",
  "Nimzo-Indian Defense": "Защита Нимцовича",
  "Nimzo-Larsen Attack": "Атака Нимцовича-Ларсена",
  "Nimzowitsch Defense": "Защита Нимцовича против 1.e4",
  "Old Indian Defense": "Староиндийская защита без фианкетто",
  "Open Games": "Открытые игры",
  "Petroff Defense": "Русская партия",
  "Philidor Defense": "Защита Филидора",
  "Pirc Defense": "Защита Пирца",
  "Owen Defense": "Защита Оуэна",
  "Queen’s Gambit": "Ферзевый гамбит",
  "Queen’s Gambit Accepted": "Принятый ферзевый гамбит",
  "Queen’s Gambit Declined": "Отказанный ферзевый гамбит",
  "Queen's Gambit Accepted": "Принятый ферзевый гамбит",
  "Queen's Gambit Declined": "Отказанный ферзевый гамбит",
  "Queen's Indian Defense": "Новоиндийская защита",
  "Queen’s Indian Defense": "Новоиндийская защита",
  "Queen’s Pawn Game": "Дебют ферзевой пешки",
  "Réti Opening": "Дебют Рети",
  "Ruy Lopez": "Испанская партия",
  "Scandinavian Defense": "Скандинавская защита",
  "Scotch Game": "Шотландская партия",
  "Semi-Slav Defense": "Полуславянская защита",
  "Sicilian Defense": "Сицилианская защита",
  "Slav Defense": "Славянская защита",
  "Universal Systems": "Универсальные системы",
  "Vienna Game": "Венская партия"
});

/** @type {Readonly<Record<string, string>>} */
const RESEARCH_NAME_RU = Object.freeze({
  albin_countergambit: "Контргамбит Альбина",
  alekhine_modern: "Защита Алехина: современный вариант",
  benko_gambit: "Гамбит Бенко",
  bird_opening: "Дебют Берда",
  bishops_opening: "Дебют слона",
  bogo_indian: "Защита Боголюбова",
  budapest_gambit: "Будапештский гамбит",
  caro_advance_short: "Каро-Канн: продвинутый вариант, система Шорта",
  caro_classical_bf5: "Каро-Канн: классический вариант с 4...Bf5",
  caro_exchange: "Каро-Канн: разменный вариант",
  caro_kann_karpov: "Каро-Канн: вариант Карпова с 4...Nd7",
  caro_panov: "Каро-Канн: атака Панова-Ботвинника",
  caro_two_knights: "Каро-Канн: вариант двух коней",
  catalan_closed: "Закрытый Каталон",
  catalan_open: "Открытый Каталон",
  chigorin_defense: "Защита Чигорина",
  colle_zukertort: "Система Колле-Цукерторта",
  dutch_classical: "Голландская защита: классический вариант",
  dutch_leningrad: "Голландская защита: ленинградский вариант",
  dutch_stonewall: "Голландская защита: каменная стена",
  english_botvinnik: "Английское начало: система Ботвинника",
  english_four_knights: "Английское начало: четыре коня",
  english_mikenas: "Английское начало: вариант Микенаса-Карлса",
  english_reversed_sicilian: "Английское начало: обратная сицилианская",
  english_symmetrical: "Английское начало: симметричный вариант",
  four_knights: "Партия четырех коней",
  french_advance: "Французская защита: продвинутый вариант",
  french_classical_steinitz: "Французская защита: классический вариант / Стейниц",
  french_exchange: "Французская защита: разменный вариант",
  french_rubinstein: "Французская защита: вариант Рубинштейна",
  french_tarrasch: "Французская защита: вариант Тарраша",
  french_winawer: "Французская защита: вариант Винавера",
  grunfeld_exchange: "Защита Грюнфельда: разменный вариант",
  grunfeld_russian: "Защита Грюнфельда: русская система",
  hippopotamus_setup: "Система Гиппопотам / двойное фианкетто",
  italian_giuoco_pianissimo: "Итальянская партия: Джоко Пианиссимо",
  italian_two_knights_ng5: "Защита двух коней: 4.Ng5",
  jobava_london: "Лондонская система Джобавы",
  kings_gambit_accepted: "Принятый королевский гамбит",
  kings_indian_attack: "Староиндийская атака",
  kings_indian_averbakh: "Староиндийская защита: вариант Авербаха",
  kings_indian_classical: "Староиндийская защита: классическая главная линия",
  kings_indian_four_pawns: "Староиндийская защита: атака четырех пешек",
  kings_indian_saemisch: "Староиндийская защита: система Земиша",
  london_system: "Лондонская система",
  modern_benoni: "Современная Бенони",
  modern_defense: "Модерн-защита",
  nimzo_classical_qc2: "Защита Нимцовича: классический вариант 4.Qc2",
  nimzo_larsen: "Атака Нимцовича-Ларсена",
  nimzo_rubinstein: "Защита Нимцовича: вариант Рубинштейна",
  nimzo_saemisch: "Защита Нимцовича: система Земиша",
  nimzowitsch_defense: "Защита Нимцовича против 1.e4",
  old_indian: "Староиндийская защита без фианкетто",
  owen_defense: "Защита Оуэна",
  petroff_main: "Русская партия: главная линия",
  philidor_defense: "Защита Филидора",
  pirc_150_attack: "Защита Пирца: атака 150",
  pirc_austrian: "Защита Пирца: австрийская атака",
  ponziani: "Дебют Понциани",
  qga_main: "Принятый ферзевый гамбит: главная линия",
  qgd_exchange: "Отказанный ферзевый гамбит: разменный вариант / Карлсбад",
  qgd_orthodox: "Отказанный ферзевый гамбит: ортодоксальная главная линия",
  qgd_semi_tarrasch: "Полу-Тарраш",
  qgd_tarrasch: "Защита Тарраша",
  qgd_tartakower: "Отказанный ферзевый гамбит: вариант Тартаковера",
  queen_indian_main: "Новоиндийская защита: главная линия",
  reti_opening: "Дебют Рети",
  ruy_lopez_berlin: "Испанская партия: берлинская защита",
  ruy_lopez_closed: "Испанская партия: закрытая главная линия",
  ruy_lopez_exchange: "Испанская партия: разменный вариант",
  ruy_lopez_marshall: "Испанская партия: атака Маршалла",
  scandinavian_modern_nf6: "Скандинавская защита: современный вариант с 2...Nf6",
  scandinavian_qa5: "Скандинавская защита: 3...Qa5",
  scotch_game: "Шотландская партия",
  semi_slav_meran: "Полуславянская защита: меранский вариант",
  semi_slav_moscow_botvinnik: "Полуславянская защита: московско-ботвинниковский комплекс",
  sicilian_accelerated_dragon_maroczy: "Сицилианская защита: ускоренный дракон, зажим Мароци",
  sicilian_alapin: "Сицилианская защита: вариант Алапина",
  sicilian_classical_rauzer: "Сицилианская защита: классический вариант, атака Рихтера-Раузера",
  sicilian_closed: "Сицилианская защита: закрытая система",
  sicilian_dragon_yugoslav: "Сицилианская защита: дракон, югославская атака",
  sicilian_grand_prix: "Сицилианская защита: атака Гран-при",
  sicilian_kalashnikov: "Сицилианская защита: вариант Калашникова",
  sicilian_kan: "Сицилианская защита: вариант Кана",
  sicilian_moscow: "Сицилианская защита: московский вариант",
  sicilian_najdorf_classical: "Сицилианская защита: Найдорф, классический вариант / Опоценский",
  sicilian_najdorf_english_attack: "Сицилианская защита: Найдорф, английская атака",
  sicilian_rossolimo: "Сицилианская защита: вариант Россолимо",
  sicilian_scheveningen_keres: "Сицилианская защита: шевенинген, атака Кереса",
  sicilian_smith_morra: "Сицилианская защита: гамбит Смита-Морры",
  sicilian_sveshnikov: "Сицилианская защита: вариант Свешникова",
  sicilian_taimanov: "Сицилианская защита: вариант Тайманова",
  slav_exchange: "Славянская защита: разменный вариант",
  slav_main: "Славянская защита: главная линия",
  stonewall_attack: "Атака каменной стены",
  torre_attack: "Атака Торре",
  trompowsky: "Атака Тромповского",
  vienna_gambit: "Венская партия: венский гамбит"
});

const WHITE_RESEARCH_IDS = new Set([
  "bird_opening",
  "bishops_opening",
  "catalan_closed",
  "catalan_open",
  "colle_zukertort",
  "english_botvinnik",
  "english_four_knights",
  "english_mikenas",
  "english_reversed_sicilian",
  "english_symmetrical",
  "four_knights",
  "hippopotamus_setup",
  "italian_giuoco_pianissimo",
  "italian_two_knights_ng5",
  "jobava_london",
  "kings_gambit_accepted",
  "kings_indian_attack",
  "london_system",
  "nimzo_larsen",
  "ponziani",
  "reti_opening",
  "ruy_lopez_berlin",
  "ruy_lopez_closed",
  "ruy_lopez_exchange",
  "scotch_game",
  "sicilian_alapin",
  "sicilian_closed",
  "sicilian_grand_prix",
  "sicilian_moscow",
  "sicilian_rossolimo",
  "sicilian_smith_morra",
  "stonewall_attack",
  "torre_attack",
  "trompowsky",
  "vienna_gambit"
]);

/** @type {Readonly<Record<string, Partial<Pick<ResearchVariation, "why_it_matters"|"white_plan"|"black_plan"|"middlegame_tabia"|"key_ideas"|"avoid">>>>} */
const BEGINNER_RESEARCH_COPY_OVERRIDES = Object.freeze({
  catalan_closed: Object.freeze({
    why_it_matters:
      "Этот вариант учит играть спокойный Каталон: белые не получают быструю тактику, зато учатся давить на центр и длинную диагональ слона g2. Он важен, потому что такие позиции часто переходят в медленный миттельшпиль, где нужно понимать план, а не помнить один ход.",
    white_plan:
      "Белые давят на центральную пешку d5 и не дают черным спокойно стоять в центре. Обычно план такой: при удобном случае разменять пешку c4 на d5, поставить коня на e5 и постепенно усиливать фигуры вокруг центра.",
    black_plan:
      "Черные спокойно заканчивают развитие: выводят слона, рокируют и решают, что делать с пешкой c7. Ее можно поставить на c6, чтобы укрепить центр, или на c5, чтобы сразу спорить за центр. Главная задача - не отдать белым давление бесплатно.",
    middlegame_tabia:
      "Позиция обычно становится спокойной, но напряженной: белые давят по длинной диагонали слона g2 и на центр, а черные выбирают момент для центрального разрыва пешкой c.",
    key_ideas: Object.freeze([
      "Если черные не берут пешку c4, белым нужно искать давление через центр и диагональ слона g2, а не ждать подарка.",
      "Главный вопрос позиции: кто лучше подготовит борьбу за центральные поля d5 и e5.",
      "Белым полезно усиливать фигуры вокруг центра: поставить ладью на открытую или полуоткрытую линию, подключить ферзя и только потом менять пешки.",
      "Если черные укрепляют центр пешкой c6, белым обычно выгодно сохранять напряжение и не спешить с разменами без конкретной цели.",
      "Если черные идут пешкой c5, позиция раскрывается быстрее: белым важно заранее понять, какой центр получится после размена."
    ]),
    avoid: Object.freeze([
      "Белым не стоит просто ждать, что черные сами возьмут пешку c4. Если давления нет, черные спокойно развиваются и уравнивают игру.",
      "Белым опасно менять пешку c4 на d5 автоматически. Ранний размен без подготовки часто снимает напряжение и облегчает черным защиту.",
      "Белым нельзя забывать про безопасность короля после вскрытия центра: Каталон спокойный только пока фигуры готовы к центральным разрывам.",
      "Черным вредно пассивно стоять без решения по пешке c7. Если не выбрать укрепление центра или контрудар, белые постепенно нарастят давление."
    ])
  })
});

/**
 * @param {readonly string[] | undefined} values
 * @returns {readonly string[]}
 */
function freezeStringList(values) {
  return Object.freeze([...(values ?? [])].filter((value) => value.trim().length > 0));
}

/**
 * @param {string} id
 * @param {string} fallback
 * @returns {string}
 */
function getResearchNameRu(id, fallback) {
  return RESEARCH_NAME_RU[id] ?? fallback;
}

/**
 * @param {string} family
 * @returns {string}
 */
function getResearchFamilyRu(family) {
  return RESEARCH_FAMILY_RU[family] ?? family;
}

/**
 * @param {string} id
 * @returns {StudySide}
 */
function getResearchStudySide(id) {
  return WHITE_RESEARCH_IDS.has(id) ? "white" : "black";
}

/**
 * @param {StudySide} studySide
 * @returns {string}
 */
function getStudySideLabel(studySide) {
  return studySide === "white" ? "Тренировка за белых" : "Тренировка за черных";
}

/**
 * @param {ResearchVariation} variation
 * @param {ResearchValidationEntry | undefined} validation
 * @returns {string}
 */
function formatResearchVerification(variation, validation) {
  const match = validation?.lichessMatch ?? null;
  const legalPart = "Все ходы SAN проверены chess.js в строгом режиме.";

  if (!match) {
    return `${legalPart} Название, ECO и планы взяты из импортированного исследования; перед рекомендациями как "лучший ход" нужен отдельный слой Lichess/движка.`;
  }

  if (match.kind === "pgn-exact") {
    return `${legalPart} Полный PGN совпадает с Lichess chess-openings CC0: ${getResearchNameRu(variation.id, match.name)} (${match.eco}).`;
  }

  return `${legalPart} Lichess chess-openings CC0 подтверждает известный префикс до ${match.commonPrefixPly}-го полухода: ${getResearchNameRu(variation.id, match.name)} (${match.eco}); оставшиеся ходы показаны как учебное продолжение из импортированного исследования, не как рекомендация движка.`;
}

/**
 * @param {ResearchVariation} variation
 * @param {StudySide} studySide
 * @returns {Readonly<Record<string, MoveGuide>>}
 */
function buildResearchMoveGuides(variation, studySide) {
  /** @type {Record<string, MoveGuide>} */
  const guides = {};

  for (const hint of variation.move_hints) {
    guides[`${hint.ply}:${hint.move}`] = {
      title: `Подсказка: ${hint.move}`,
      explanation: hint.hint,
      purpose: `Связь с твоим планом: ${getResearchSidePlan(variation, studySide)}`
    };
  }

  return Object.freeze(guides);
}

/**
 * @param {ResearchVariation} variation
 * @param {StudySide} studySide
 * @returns {string}
 */
function getResearchSidePlan(variation, studySide) {
  return studySide === "white" ? variation.white_plan : variation.black_plan;
}

/**
 * @param {ResearchVariation} variation
 * @param {StudySide} studySide
 * @returns {string}
 */
function getResearchSideMiddlegamePlan(variation, studySide) {
  return `Дальше придерживайся этого плана: ${getResearchSidePlan(variation, studySide)}`;
}

/**
 * @param {ResearchVariation} variation
 * @returns {ResearchVariation}
 */
function applyBeginnerCopyOverrides(variation) {
  const override = BEGINNER_RESEARCH_COPY_OVERRIDES[variation.id];

  if (!override) {
    return variation;
  }

  return {
    ...variation,
    ...override
  };
}

/**
 * @param {ResearchVariation} variation
 * @returns {OpeningSeed}
 */
function buildResearchSeed(variation) {
  const beginnerVariation = applyBeginnerCopyOverrides(variation);
  const validation = RESEARCH_VALIDATION_BY_ID.get(variation.id);
  const studySide = getResearchStudySide(beginnerVariation.id);
  const familyRu = getResearchFamilyRu(beginnerVariation.family);
  const nameRu = getResearchNameRu(beginnerVariation.id, beginnerVariation.name);

  return Object.freeze({
    key: `research-${beginnerVariation.id}`,
    family: familyRu,
    name: nameRu,
    sourceName: beginnerVariation.name,
    eco: beginnerVariation.eco,
    aliases: Object.freeze([familyRu]),
    studySide,
    studyLabel: `${getStudySideLabel(studySide)} · приоритет ${beginnerVariation.priority}`,
    turnLabel: "Позиция после основных ходов",
    lineSan: Object.freeze([...beginnerVariation.moves]),
    verification: formatResearchVerification(beginnerVariation, validation),
    principle: beginnerVariation.why_it_matters,
    positionGoal: getResearchSidePlan(beginnerVariation, studySide),
    middlegamePlan: getResearchSideMiddlegamePlan(beginnerVariation, studySide),
    continuations: Object.freeze([]),
    badMoves: Object.freeze([]),
    moveGuides: buildResearchMoveGuides(beginnerVariation, studySide),
    priority: beginnerVariation.priority,
    whyItMatters: beginnerVariation.why_it_matters,
    whitePlan: beginnerVariation.white_plan,
    blackPlan: beginnerVariation.black_plan,
    middlegameTabia: getResearchSideMiddlegamePlan(beginnerVariation, studySide),
    keyIdeas: freezeStringList(beginnerVariation.key_ideas),
    commonTraps: freezeStringList(beginnerVariation.common_traps),
    avoid: freezeStringList(beginnerVariation.avoid),
    tags: freezeStringList(beginnerVariation.tags),
    referenceSources: getTheoryReferences(RESEARCH_THEORY_REFERENCE_KEYS),
    sourceEvidence: Object.freeze({
      legalSan: validation?.legalSan ?? false,
      finalFen: validation?.finalFen ?? "",
      lichessMatch: validation?.lichessMatch ?? null
    })
  });
}

/** @type {readonly OpeningSeed[]} */
export const RESEARCH_OPENING_SEEDS = Object.freeze(RESEARCH_SOURCE.variations.map((variation) => buildResearchSeed(variation)));

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
 * @param {readonly string[]} sanLine
 * @returns {string}
 */
function formatSanLine(sanLine) {
  const chunks = [];
  for (let index = 0; index < sanLine.length; index += 1) {
    const moveNumber = Math.floor(index / 2) + 1;
    const separator = index % 2 === 0 ? "." : "...";
    chunks.push(`${moveNumber}${separator} ${sanLine[index]}`);
  }
  return chunks.join(" ");
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
 * @param {string} pieceType
 * @param {string} from
 * @param {string} to
 * @param {MoveGuide | undefined} guide
 * @returns {MoveGuide}
 */
function describeMove(san, actorLabel, pieceName, pieceType, from, to, guide) {
  if (guide) {
    return guide;
  }

  if (san === "O-O") {
    return {
      title: `${actorLabel} рокируют`,
      explanation: `${actorLabel} убирают короля из центра: король идет с ${from} на ${to}, а ладья подключается к игре.`,
      purpose: "Смысл: повысить безопасность короля и соединить ладьи для миттельшпиля."
    };
  }

  const isCapture = san.includes("x");
  const centralSquares = new Set(["d4", "e4", "d5", "e5"]);
  const nearCenterSquares = new Set(["c3", "f3", "c6", "f6", "c4", "f4", "c5", "f5"]);
  const titleAction = isCapture ? "забирает фигуру или пешку" : "развивается";
  let purpose = "Смысл: улучшить фигуру, ответить на угрозу соперника и подготовить понятный план.";

  if (pieceType === "p" && centralSquares.has(to)) {
    purpose = "Смысл: занять или удержать центр, чтобы фигурам было легче выходить на активные поля.";
  } else if (pieceType === "p" && ["c4", "c5", "c6", "e6", "d6"].includes(to)) {
    purpose = "Смысл: поддержать центральную пешку или подготовить удар по центру соперника.";
  } else if (pieceType === "n" && nearCenterSquares.has(to)) {
    purpose = "Смысл: вывести коня к центру, где он контролирует больше важных полей.";
  } else if (pieceType === "b" && ["c4", "c5", "b5", "b4", "g2", "g7"].includes(to)) {
    purpose = "Смысл: поставить слона на активную диагональ и усилить давление на центр или короля.";
  } else if (pieceType === "q") {
    purpose = "Смысл: ферзь подключается к защите или давлению, но за ним нужно следить, чтобы не потерять темп.";
  }

  return {
    title: `${actorLabel}: ${san}`,
    explanation: `${actorLabel} делают ход ${san}: ${pieceName} идет с ${from} на ${to}.`,
    purpose: `${titleAction === "развивается" ? purpose : `Смысл: ${actorLabel.toLowerCase()} ${titleAction} и меняют структуру позиции.`}`
  };
}

/**
 * @param {readonly string[]} sanLine
 * @param {StudySide} perspective
 * @param {Readonly<Record<string, MoveGuide>> | undefined} [moveGuides]
 * @returns {MoveStep[]}
 */
export function buildMoveSteps(sanLine, perspective, moveGuides) {
  const chess = new Chess();
  /** @type {MoveStep[]} */
  const steps = [];

  for (let index = 0; index < sanLine.length; index += 1) {
    const fenBefore = chess.fen();
    const move = chess.move(sanLine[index], { strict: true });
    const fenAfter = chess.fen();
    const actor = move.color === "w" ? "white" : "black";
    const actorLabel = actor === "white" ? "Белые" : "Черные";
    const pieceName = PIECE_NAMES[move.piece] ?? "фигура";
    const guide = moveGuides?.[`${index + 1}:${move.san}`] ?? moveGuides?.[move.san];
    const description = describeMove(move.san, actorLabel, pieceName, move.piece, move.from, move.to, guide);
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
      fenBefore,
      fenAfter,
      board: buildDisplayBoard(chess, perspective, { from: move.from, to: move.to })
    });
  }

  return steps;
}

/**
 * @param {OpeningSeed} seed
 * @param {BadMoveSeed} badMove
 * @param {readonly string[]} anchorLineSan
 * @returns {MoveStep[]}
 */
function buildBadMoveSteps(seed, badMove, anchorLineSan) {
  const steps = buildMoveSteps([...anchorLineSan, badMove.san], seed.studySide, seed.moveGuides);
  const badMoveStep = steps.at(-1);

  if (!badMoveStep) {
    throw new Error(`Could not build bad move step for ${seed.key}:${badMove.san}.`);
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
 * @param {OpeningSeed} seed
 * @param {BadMoveSeed} badMove
 * @returns {BadMoveSource}
 */
function getBadMoveSource(seed, badMove) {
  if (badMove.source) {
    return badMove.source;
  }

  return Object.freeze({
    status: "candidate",
    kind: "manual-review",
    title: `${seed.sourceName} · нужна внешняя проверка`,
    note: "Ручная заметка остается в исходной базе как кандидат, но не показывается в приложении, пока не будет подтверждена внешним источником."
  });
}

/**
 * @param {OpeningSeed} seed
 * @returns {OpeningLesson}
 */
export function buildOpeningLesson(seed) {
  const { chess, appliedSan } = playStrictSanLine(seed.lineSan);
  const fen = chess.fen();
  const legalContinuations = new Set(chess.moves());
  const continuations = seed.continuations.map((continuation) => {
    if (!legalContinuations.has(continuation.san)) {
      throw new Error(`Expected continuation ${seed.key}:${continuation.san} is not legal in the reached position.`);
    }

    return {
      ...continuation,
      steps: buildMoveSteps([...seed.lineSan, ...continuation.lineSan], seed.studySide, seed.moveGuides)
    };
  });
  const badMoves = seed.badMoves.flatMap((badMove) => {
    const source = getBadMoveSource(seed, badMove);
    const anchorLineSan = badMove.afterLineSan ?? seed.lineSan;
    const { chess: anchorChess } = playStrictSanLine(anchorLineSan);
    const anchorFen = anchorChess.fen();
    const anchorLegalContinuations = new Set(anchorChess.moves());

    if (source.status !== "verified") {
      return [];
    }

    if (!anchorLegalContinuations.has(badMove.san)) {
      throw new Error(`Expected bad move ${seed.key}:${badMove.san} is not legal in the reached position.`);
    }

    const probe = new Chess(anchorFen);
    const move = probe.move(badMove.san, { strict: true });
    return {
      ...badMove,
      key: `${seed.key}-bad-${anchorLineSan.length}-${badMove.san}`,
      anchorPly: anchorLineSan.length,
      anchorFen,
      anchorLineSan: Object.freeze([...anchorLineSan]),
      source,
      from: move.from,
      to: move.to,
      steps: buildBadMoveSteps(seed, badMove, anchorLineSan)
    };
  });

  return {
    status: seed.sourceEvidence ? "ХОДЫ ПРОВЕРЕНЫ" : "ПРОВЕРЕНО",
    input: formatSanLine(seed.lineSan),
    appliedSan,
    fen,
    baseLine: {
      steps: buildMoveSteps(seed.lineSan, seed.studySide, seed.moveGuides)
    },
    opening: {
      key: seed.key,
      family: seed.family,
      name: seed.name,
      sourceName: seed.sourceName,
      eco: seed.eco,
      aliases: seed.aliases,
      studySide: seed.studySide,
      studyLabel: seed.studyLabel,
      turnLabel: seed.turnLabel,
      lineSan: seed.lineSan,
      input: formatSanLine(seed.lineSan),
      fen,
      verification: seed.verification,
      principle: seed.principle,
      positionGoal: seed.positionGoal,
      middlegamePlan: seed.middlegamePlan,
      priority: seed.priority,
      whyItMatters: seed.whyItMatters,
      whitePlan: seed.whitePlan,
      blackPlan: seed.blackPlan,
      middlegameTabia: seed.middlegameTabia,
      keyIdeas: seed.keyIdeas,
      commonTraps: seed.commonTraps,
      avoid: seed.avoid,
      tags: seed.tags,
      sourceEvidence: seed.sourceEvidence,
      referenceSources: seed.referenceSources ?? getTheoryReferences(CORE_THEORY_REFERENCE_KEYS),
      continuations,
      badMoves,
      positionTheory: getPositionTheory(seed.key)
    }
  };
}

/**
 * @returns {OpeningLesson[]}
 */
export function buildOpeningLessons() {
  return [...OPENING_SEEDS, ...RESEARCH_OPENING_SEEDS].map((seed) => buildOpeningLesson(seed));
}

/**
 * @returns {OpeningLesson}
 */
export function buildRuyLopezLesson() {
  const lesson = buildOpeningLesson(OPENING_SEEDS[0]);

  if (lesson.fen !== RUY_LOPEZ_EXPECTED_FEN) {
    throw new Error(`Unexpected Ruy Lopez FEN: ${lesson.fen}`);
  }

  return lesson;
}

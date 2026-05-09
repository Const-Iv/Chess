// @ts-check

import { Chess } from "chess.js";

export const OPENING_SOURCE_NOTE =
  "Учебная база собрана вручную по справочникам Chess.com Openings, ECO-классификации, Lichess Opening Explorer и идеям из классических учебников: Fundamental Chess Openings, The Ideas Behind the Chess Openings, Modern Chess Openings и Mastering the Chess Openings. Все SAN-линии проверяются chess.js.";

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
 * }>} OpeningSeed
 *
 * @typedef {Readonly<Omit<OpeningSeed, "continuations"|"badMoves"|"moveGuides"> & {
 *   input: string;
 *   fen: string;
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
 * }>} OpeningLesson
 */

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
      })
    ])
  })
]);

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
    const move = chess.move(sanLine[index], { strict: true });
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
      board: buildDisplayBoard(chess, perspective, { from: move.from, to: move.to })
    });
  }

  return steps;
}

/**
 * @param {OpeningSeed} seed
 * @param {BadMoveSeed} badMove
 * @returns {MoveStep[]}
 */
function buildBadMoveSteps(seed, badMove) {
  const steps = buildMoveSteps([...seed.lineSan, badMove.san], seed.studySide, seed.moveGuides);
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
  const badMoves = seed.badMoves.map((badMove) => {
    if (!legalContinuations.has(badMove.san)) {
      throw new Error(`Expected bad move ${seed.key}:${badMove.san} is not legal in the reached position.`);
    }

    const probe = new Chess(fen);
    const move = probe.move(badMove.san, { strict: true });
    return {
      ...badMove,
      key: `${seed.key}-bad-${badMove.san}`,
      from: move.from,
      to: move.to,
      steps: buildBadMoveSteps(seed, badMove)
    };
  });

  return {
    status: "ПРОВЕРЕНО",
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
      continuations,
      badMoves
    }
  };
}

/**
 * @returns {OpeningLesson[]}
 */
export function buildOpeningLessons() {
  return OPENING_SEEDS.map((seed) => buildOpeningLesson(seed));
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

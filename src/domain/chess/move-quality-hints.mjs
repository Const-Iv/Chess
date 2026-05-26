// @ts-check

const DEFAULT_SOURCE = "Источник: текущая проверенная база дебютов.";

/**
 * @typedef {"book"|"excellent"|"good"|"interesting"|"needs-plan"|"inaccuracy"|"mistake"|"blunder"|"miss"} MoveQualityKind
 * @typedef {"book"|"good"|"warn"|"bad"} MoveQualityTone
 * @typedef {"manual-review"|"book"|"lichess-explorer"|"lichess-cloud-eval"|"lichess-puzzle"} MoveQualitySourceKind
 *
 * @typedef {Readonly<{
 *   sourceKind: MoveQualitySourceKind;
 *   label: string;
 *   betterPlan?: string;
 * }>} MoveQualityBadMoveContext
 *
 * @typedef {Readonly<{
 *   san: string;
 *   badMove?: MoveQualityBadMoveContext | null;
 *   isKnownContinuation?: boolean;
 *   isExpectedStep?: boolean;
 *   theoryGames?: number;
 *   theoryTotalGames?: number;
 *   matchingLineCount?: number;
 *   hasKnownAlternative?: boolean;
 *   educationalSummary?: string;
 *   educationalRecommendation?: string;
 *   alternativeMoves?: readonly Readonly<{san: string; label: string; idea: string}>[];
 *   source?: string;
 * }>} MoveQualityContext
 *
 * @typedef {Readonly<{
 *   kind: MoveQualityKind;
 *   symbol: string;
 *   label: string;
 *   summary: string;
 *   recommendation: string;
 *   source: string;
 *   tone: MoveQualityTone;
 * }>} MoveQualityHint
 */

/**
 * @param {MoveQualityContext} context
 * @returns {MoveQualityHint}
 */
export function getMoveQualityHint(context) {
  if (context.badMove) {
    const isCloudEval = context.badMove.sourceKind === "lichess-cloud-eval";

    return Object.freeze({
      kind: isCloudEval ? "blunder" : "mistake",
      symbol: isCloudEval ? "??" : "?",
      label: isCloudEval ? "Грубая ошибка" : "Ошибка",
      summary: `${context.san}: ${context.badMove.label}. Этот ход отмечен плохо, потому что он не решает главную задачу позиции.`,
      recommendation:
        context.badMove.betterPlan ??
        "Лучше выбрать ход, который развивает фигуру, борется за центр или напрямую решает угрозу соперника.",
      source: isCloudEval ? "Источник: Lichess cloud eval и verified bad move." : DEFAULT_SOURCE,
      tone: "bad"
    });
  }

  if (context.educationalSummary) {
    const alternatives = formatAlternativeMoves(context.alternativeMoves ?? []);
    const recommendation = [context.educationalRecommendation, alternatives ? `Другие понятные варианты: ${alternatives}.` : ""]
      .filter(Boolean)
      .join(" ");
    const isBookMove = context.isKnownContinuation;
    const isExpectedMove = context.isExpectedStep;

    return Object.freeze({
      kind: isBookMove ? "book" : isExpectedMove ? "excellent" : "good",
      symbol: isBookMove ? "📖" : isExpectedMove ? "!" : "✓",
      label: isBookMove ? "Книжный ход" : isExpectedMove ? "Сильный учебный ход" : "Есть план в базе",
      summary: `${context.san}: ${context.educationalSummary}`,
      recommendation:
        recommendation ||
        "Открой подходящую карточку базы и свяжи ход с планом: центр, развитие, безопасность короля и следующий пешечный разрыв.",
      source: context.source ?? DEFAULT_SOURCE,
      tone: isBookMove ? "book" : "good"
    });
  }

  if (context.isKnownContinuation) {
    return Object.freeze({
      kind: "book",
      symbol: "📖",
      label: "Книжный ход",
      summary: `${context.san}: ход из проверенной дебютной линии или продолжения.`,
      recommendation: "Запомни не только символ, а зачем этот ход: какую фигуру он развивает, какой центр держит и какой план готовит.",
      source: context.source ?? DEFAULT_SOURCE,
      tone: "book"
    });
  }

  if (context.isExpectedStep) {
    return Object.freeze({
      kind: "excellent",
      symbol: "!",
      label: "Сильный учебный ход",
      summary: `${context.san}: ход поддерживает текущий план позиции.`,
      recommendation:
        "Свяжи ход с объяснением ниже: что он улучшает сейчас и какую понятную позицию должен дать к миттельшпилю.",
      source: context.source ?? DEFAULT_SOURCE,
      tone: "good"
    });
  }

  const matchingLineCount = context.matchingLineCount ?? 0;

  if (matchingLineCount > 0) {
    return Object.freeze({
      kind: "good",
      symbol: "✓",
      label: "Есть в базе",
      summary: `${context.san}: ход продолжает ${matchingLineCount} проверенных линий.`,
      recommendation: "Открой подходящую карточку слева и прочитай план: так ход превращается из запоминания в понятную схему.",
      source: context.source ?? DEFAULT_SOURCE,
      tone: "good"
    });
  }

  if (context.hasKnownAlternative) {
    return Object.freeze({
      kind: "miss",
      symbol: "×",
      label: "Мимо учебного ориентира",
      summary: `${context.san}: ход легален, но рядом есть подтвержденные учебные продолжения.`,
      recommendation:
        "Лучше сначала выбрать одно из подтвержденных продолжений ниже и понять, какую дебютную задачу оно решает.",
      source: context.source ?? "Источник: проверенные линии текущей базы.",
      tone: "warn"
    });
  }

  const theoryTotalGames = context.theoryTotalGames ?? 0;
  const theoryGames = context.theoryGames ?? 0;

  if (theoryGames > 0 && theoryTotalGames > 0) {
    return Object.freeze({
      kind: "needs-plan",
      symbol: "?",
      label: "Нужна карта",
      summary: `${context.san}: в текущей базе нет учебного объяснения этого хода.`,
      recommendation:
        "Не считай этот ход рекомендацией только по статистике партий. Для обучения выбери ход с планом из базы или добавь этот вариант в ручную проверку.",
      source: context.source ?? "Источник: реальные broadcast-партии Lichess.",
      tone: "warn"
    });
  }

  return Object.freeze({
    kind: "inaccuracy",
    symbol: "?!",
    label: "Вне текущей карты",
    summary: `${context.san}: в базе и собранной практике нет подтверждения этого продолжения.`,
    recommendation:
      "Для обучения вернись к подтвержденным ходам или добавь этот ход в ручную проверку, прежде чем считать его частью репертуара.",
    source: "Не показываю шахматный вывод как факт без источника.",
    tone: "warn"
  });
}

/**
 * @param {readonly Readonly<{san: string; label: string; idea: string}>[]} alternatives
 */
function formatAlternativeMoves(alternatives) {
  return alternatives
    .slice(0, 3)
    .map((move) => `${move.san} - ${move.label}: ${move.idea}`)
    .join("; ");
}

// @ts-check

/**
 * @typedef {"white"|"black"} StudySide
 *
 * @typedef {Readonly<{
 *   san: string;
 *   from: string;
 *   to: string;
 *   actor: StudySide;
 *   actorLabel: string;
 *   moveNumber: number;
 *   pieceName: string;
 *   title: string;
 *   explanation: string;
 *   purpose: string;
 *   before: string;
 *   after: string;
 * }>} FreeMoveRecord
 *
 * @typedef {Readonly<{
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
 * }>} MoveStepLike
 */

/**
 * @param {MoveStepLike} step
 * @returns {FreeMoveRecord}
 */
export function createFreeMoveRecordFromStep(step) {
  return Object.freeze({
    san: step.san,
    from: step.from,
    to: step.to,
    actor: step.actor,
    actorLabel: step.actorLabel,
    moveNumber: step.moveNumber,
    pieceName: step.pieceName,
    title: step.title,
    explanation: step.explanation,
    purpose: step.purpose,
    before: step.fenBefore,
    after: step.fenAfter
  });
}

/**
 * @param {readonly MoveStepLike[]} steps
 * @param {number} selectedStepIndex
 * @returns {readonly FreeMoveRecord[]}
 */
export function createFreeMoveRecordsFromSteps(steps, selectedStepIndex) {
  if (steps.length === 0 || selectedStepIndex < 0) {
    return Object.freeze([]);
  }

  const safeIndex = Math.min(selectedStepIndex, steps.length - 1);

  return Object.freeze(steps.slice(0, safeIndex + 1).map(createFreeMoveRecordFromStep));
}

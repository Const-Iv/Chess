#!/usr/bin/env node
// @ts-check

import { buildBadMoveCoverageReport } from "../src/domain/chess/bad-move-coverage.mjs";
import { buildOpeningLessons } from "../src/domain/chess/opening-database.mjs";

/**
 * @param {number} value
 * @param {number} total
 */
function formatPercent(value, total) {
  if (total === 0) {
    return "0.0%";
  }

  return `${((value / total) * 100).toFixed(1)}%`;
}

function main() {
  const report = buildBadMoveCoverageReport(buildOpeningLessons());
  const uncoveredRows = report.rows.filter((row) => row.verifiedBadMoves.length === 0);

  console.log("# Аудит покрытия плохих ходов");
  console.log("");
  console.log(`- Карточек: ${report.lessonCount}`);
  console.log(`- Позиций с ходом изучаемой стороны: ${report.studyPositions}`);
  console.log(`- Проверенных плохих ходов в базе: ${report.verifiedBadMoves}`);
  console.log(
    `- Позиций изучаемой стороны с проверенной ошибкой: ${report.positionsWithVerifiedBadMoves} (${formatPercent(
      report.positionsWithVerifiedBadMoves,
      report.studyPositions
    )})`
  );
  console.log(`- Непокрытых позиций изучаемой стороны: ${report.uncoveredStudyPositions}`);
  console.log(`- Проверенных плохих ходов именно для этих позиций: ${report.studyPositionVerifiedBadMoves}`);
  console.log("");
  console.log("## Первые непокрытые позиции");
  console.log("");

  for (const row of uncoveredRows.slice(0, 40)) {
    console.log(
      `- ${row.openingName} (${row.openingKey}), ${row.lineLabel}: перед ${row.nextSan}, ply ${row.anchorPly}`
    );
  }
}

main();

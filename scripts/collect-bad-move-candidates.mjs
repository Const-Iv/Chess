#!/usr/bin/env node
// @ts-check

import { Chess } from "chess.js";
import { buildBadMoveCoverageReport } from "../src/domain/chess/bad-move-coverage.mjs";
import { buildOpeningLessons } from "../src/domain/chess/opening-database.mjs";

const LICHESS_CLOUD_EVAL_URL = "https://lichess.org/api/cloud-eval";
const MIN_CP_DROP = 80;

/**
 * @returns {Record<string, string | boolean>}
 */
function parseArgs() {
  /** @type {Record<string, string | boolean>} */
  const flags = {};

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, ...rawValueParts] = arg.slice(2).split("=");
    flags[rawKey] = rawValueParts.length > 0 ? rawValueParts.join("=") : true;
  }

  return flags;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function numberFlag(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * @param {string} fen
 * @returns {Promise<{cp: number; depth: number; knodes: number; line: string} | null>}
 */
async function fetchCloudEval(fen) {
  const url = new URL(LICHESS_CLOUD_EVAL_URL);
  url.searchParams.set("fen", fen);
  url.searchParams.set("multiPv", "1");

  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const pv = Array.isArray(payload.pvs) ? payload.pvs[0] : null;

  if (!pv) {
    return null;
  }

  const cp = typeof pv.cp === "number" ? pv.cp : typeof pv.mate === "number" ? Math.sign(pv.mate) * 100000 : null;

  if (cp === null) {
    return null;
  }

  return {
    cp,
    depth: typeof payload.depth === "number" ? payload.depth : 0,
    knodes: typeof payload.knodes === "number" ? payload.knodes : 0,
    line: typeof pv.moves === "string" ? pv.moves : ""
  };
}

/**
 * @param {string} fen
 * @param {string} san
 * @returns {string | null}
 */
function getFenAfterSan(fen, san) {
  const chess = new Chess(fen);
  const move = chess.move(san, { strict: true });

  return move ? chess.fen() : null;
}

/**
 * @param {"white"|"black"} studySide
 * @param {number} recommendedCp
 * @param {number} candidateCp
 * @returns {number}
 */
function getStudySideDelta(studySide, recommendedCp, candidateCp) {
  return studySide === "white" ? candidateCp - recommendedCp : recommendedCp - candidateCp;
}

async function main() {
  const flags = parseArgs();
  const lessonFilter = typeof flags.lesson === "string" ? flags.lesson : "";
  const lineFilter = typeof flags.line === "string" ? flags.line : "";
  const anchorPlyFilter = typeof flags["anchor-ply"] === "string" ? Number(flags["anchor-ply"]) : null;
  const includeCovered = flags["include-covered"] === true || flags["include-covered"] === "true";
  const maxMoves = numberFlag(flags["max-moves"], 16);
  const report = buildBadMoveCoverageReport(buildOpeningLessons());
  const target =
    report.rows.find(
      (row) =>
        (includeCovered || row.verifiedBadMoves.length === 0) &&
        (!lessonFilter || row.openingKey === lessonFilter) &&
        (!lineFilter || row.lineKey === lineFilter) &&
        (anchorPlyFilter === null || row.anchorPly === anchorPlyFilter)
    ) ?? null;

  if (!target) {
    console.log(JSON.stringify({ status: "empty", reason: "Не найдена непокрытая позиция по заданному фильтру." }, null, 2));
    return;
  }

  const recommendedFen = getFenAfterSan(target.anchorFen, target.nextSan);
  const recommendedEval = recommendedFen ? await fetchCloudEval(recommendedFen) : null;

  if (!recommendedFen || !recommendedEval) {
    console.log(
      JSON.stringify(
        {
          status: "blocked",
          reason: "Для проверенного следующего хода нет Lichess cloud eval.",
          target
        },
        null,
        2
      )
    );
    return;
  }

  const legalMoves = new Chess(target.anchorFen)
    .moves({ verbose: true })
    .filter((move) => move.san !== target.nextSan)
    .slice(0, maxMoves);
  const candidates = [];

  for (const move of legalMoves) {
    const candidateFen = getFenAfterSan(target.anchorFen, move.san);

    if (!candidateFen) {
      continue;
    }

    const candidateEval = await fetchCloudEval(candidateFen);

    if (!candidateEval) {
      continue;
    }

    const delta = getStudySideDelta(target.studySide, recommendedEval.cp, candidateEval.cp);

    if (delta <= -MIN_CP_DROP) {
      candidates.push({
        status: "candidate",
        kind: "lichess-cloud-eval",
        openingKey: target.openingKey,
        openingName: target.openingName,
        anchorPly: target.anchorPly,
        anchorFen: target.anchorFen,
        san: move.san,
        comparedToSan: target.nextSan,
        cpAfterRecommended: recommendedEval.cp,
        cpAfterCandidate: candidateEval.cp,
        studySideDeltaCp: delta,
        source: {
          title: "Lichess cloud eval",
          url: LICHESS_CLOUD_EVAL_URL,
          note: `Только кандидат: ${move.san} хуже ${target.nextSan} на ${Math.abs(
            delta
          )}cp для стороны ${target.studySide}. До показа в приложении нужно вручную написать конкретное объяснение.`
        }
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        target: {
          openingKey: target.openingKey,
          openingName: target.openingName,
          lineLabel: target.lineLabel,
          anchorPly: target.anchorPly,
          nextSan: target.nextSan,
          anchorFen: target.anchorFen
        },
        recommendedEval,
        candidates
      },
      null,
      2
    )
  );
}

await main();

#!/usr/bin/env node
// @ts-check

import { createReadStream, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { Chess } from "chess.js";
import { buildBadMoveCoverageReport } from "../src/domain/chess/bad-move-coverage.mjs";
import { buildOpeningLessons } from "../src/domain/chess/opening-database.mjs";

const LICHESS_CLOUD_EVAL_URL = "https://lichess.org/api/cloud-eval";
const DEFAULT_OUTPUT = "research/chess-theory-deep-research-2026-05-10/position-evidence.json";
const DEFAULT_SOURCE_GLOB = "runtime/chess-theory-source-audit/lichess_db_broadcast_2026-*.pgn.zst";
const MIN_BAD_MOVE_DROP_CP = 80;

/**
 * @typedef {import("../src/domain/chess/bad-move-coverage.mjs").BadMoveCoverageRow} BadMoveCoverageRow
 */

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
 * @param {string} fen
 */
function normalizeFen(fen) {
  return fen.split(" ").slice(0, 4).join(" ");
}

/**
 * @param {string} san
 */
function cleanSanToken(san) {
  return san
    .replace(/^\d+\.(?:\.\.)?/, "")
    .replace(/[!?]+$/g, "")
    .replace(/0/g, "O")
    .trim();
}

/**
 * @param {string} movetext
 */
function tokenizeMovetext(movetext) {
  let cleaned = movetext.replace(/\r/g, " ");
  cleaned = cleaned.replace(/\{[^}]*\}/g, " ");
  let previous = "";
  while (previous !== cleaned) {
    previous = cleaned;
    cleaned = cleaned.replace(/\([^()]*\)/g, " ");
  }
  cleaned = cleaned.replace(/\$\d+/g, " ");
  cleaned = cleaned.replace(/\d+\.(?:\.\.)?/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !["1-0", "0-1", "1/2-1/2", "*"].includes(token))
    .map(cleanSanToken)
    .filter(Boolean);
}

/**
 * @param {string} pgn
 */
function parsePgnGame(pgn) {
  /** @type {Record<string, string>} */
  const headers = {};
  const movetextLines = [];

  for (const line of pgn.split("\n")) {
    const header = line.match(/^\[([A-Za-z0-9_]+)\s+"(.*)"\]\s*$/);
    if (header) {
      headers[header[1]] = header[2].replace(/\\"/g, '"');
    } else if (!line.startsWith("[") && line.trim()) {
      movetextLines.push(line);
    }
  }

  return {
    headers,
    moves: tokenizeMovetext(movetextLines.join(" "))
  };
}

/**
 * @param {string} result
 */
function resultBucket(result) {
  if (result === "1-0") {
    return "white";
  }

  if (result === "0-1") {
    return "black";
  }

  if (result === "1/2-1/2") {
    return "draw";
  }

  return "unknown";
}

/**
 * @param {Record<string, string>} headers
 */
function buildGameExample(headers) {
  return {
    event: headers.Event ?? "",
    white: headers.White ?? "",
    black: headers.Black ?? "",
    whiteElo: headers.WhiteElo ?? "",
    blackElo: headers.BlackElo ?? "",
    whiteTitle: headers.WhiteTitle ?? "",
    blackTitle: headers.BlackTitle ?? "",
    result: headers.Result ?? "",
    date: headers.UTCDate ?? "",
    opening: headers.Opening ?? "",
    eco: headers.ECO ?? "",
    gameUrl: headers.GameURL ?? "",
    broadcastUrl: headers.BroadcastURL ?? ""
  };
}

/**
 * @param {readonly BadMoveCoverageRow[]} rows
 */
function buildTargetMap(rows) {
  /** @type {Map<string, BadMoveCoverageRow[]>} */
  const targetMap = new Map();

  for (const row of rows) {
    const key = normalizeFen(row.anchorFen);
    targetMap.set(key, [...(targetMap.get(key) ?? []), row]);
  }

  return targetMap;
}

/**
 * @param {string} sourceGlob
 */
function resolveSourceFiles(sourceGlob) {
  if (!sourceGlob.includes("*")) {
    return [resolve(sourceGlob)].filter((path) => existsSync(path));
  }

  const slash = sourceGlob.lastIndexOf("/");
  const folder = slash >= 0 ? sourceGlob.slice(0, slash) : ".";
  const pattern = slash >= 0 ? sourceGlob.slice(slash + 1) : sourceGlob;
  const [prefix = "", suffix = ""] = pattern.split("*");

  return Array.from(new Set([resolve(folder)]))
    .flatMap((directory) => {
      if (!existsSync(directory)) {
        return [];
      }

      return Array.from(new Set(readdirSync(directory)))
        .filter((fileName) => fileName.startsWith(prefix) && fileName.endsWith(suffix))
        .map((fileName) => resolve(directory, fileName));
    })
    .sort();
}

/**
 * @param {string} filePath
 */
function createPgnStream(filePath) {
  if (filePath.endsWith(".zst")) {
    const zstd = spawn("zstd", ["-dc", filePath], { stdio: ["ignore", "pipe", "inherit"] });
    return zstd.stdout;
  }

  return createReadStream(filePath, "utf8");
}

/**
 * @param {string} filePath
 * @param {(pgn: string) => void} onGame
 */
async function streamPgnGames(filePath, onGame) {
  const stream = createPgnStream(filePath);
  let buffer = "";

  for await (const chunk of stream) {
    buffer += chunk.toString();
    const parts = buffer.split(/\n\n(?=\[Event\s+")/g);
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      if (part.trim()) {
        onGame(part);
      }
    }
  }

  if (buffer.trim()) {
    onGame(buffer);
  }
}

/**
 * @param {Map<string, BadMoveCoverageRow[]>} targetMap
 * @param {readonly string[]} sourceFiles
 */
async function collectBroadcastEvidence(targetMap, sourceFiles) {
  /** @type {Map<string, Map<string, {san: string; games: number; white: number; draw: number; black: number; unknown: number; examples: ReturnType<typeof buildGameExample>[]}>>} */
  const byPosition = new Map();
  let parsedGames = 0;
  let invalidGames = 0;

  for (const sourceFile of sourceFiles) {
    await streamPgnGames(sourceFile, (pgn) => {
      parsedGames += 1;
      const game = parsePgnGame(pgn);
      const chess = new Chess();
      const bucket = resultBucket(game.headers.Result ?? "");

      for (const rawSan of game.moves.slice(0, 30)) {
        const positionKey = normalizeFen(chess.fen());
        const rows = targetMap.get(positionKey);
        let move = null;

        try {
          move = chess.move(rawSan, { strict: false });
        } catch {
          move = null;
        }

        if (!move) {
          invalidGames += 1;
          break;
        }

        if (!rows) {
          continue;
        }

        const positionMoves = byPosition.get(positionKey) ?? new Map();
        const moveStats = positionMoves.get(move.san) ?? {
          san: move.san,
          games: 0,
          white: 0,
          draw: 0,
          black: 0,
          unknown: 0,
          examples: []
        };

        moveStats.games += 1;
        moveStats[bucket] += 1;

        if (moveStats.examples.length < 1) {
          moveStats.examples.push(buildGameExample(game.headers));
        }

        positionMoves.set(move.san, moveStats);
        byPosition.set(positionKey, positionMoves);
      }
    });
  }

  return {
    parsedGames,
    invalidGames,
    byPosition
  };
}

/**
 * @param {string} fen
 * @param {number} multiPv
 * @returns {Promise<{depth: number; knodes: number; pvs: {uci: string; san: string; cp: number | null; mate: number | null; line: string}[]} | null>}
 */
async function fetchCloudEval(fen, multiPv) {
  const url = new URL(LICHESS_CLOUD_EVAL_URL);
  url.searchParams.set("fen", fen);
  url.searchParams.set("multiPv", String(multiPv));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (response.status === 429) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 60_000));
      continue;
    }

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    /** @type {Record<string, unknown>[]} */
    const pvs = Array.isArray(payload.pvs) ? payload.pvs : [];
    /** @type {{uci: string; san: string; cp: number | null; mate: number | null; line: string}[]} */
    const parsedPvs = [];

    for (const pv of pvs) {
      const line = typeof pv.moves === "string" ? pv.moves : "";
      const uci = line.split(" ")[0] ?? "";
      const probe = new Chess(fen);
      const move = uci ? playUciMove(probe, uci) : null;

      if (!move || !uci) {
        continue;
      }

      parsedPvs.push({
        uci,
        san: move.san,
        cp: typeof pv.cp === "number" ? pv.cp : null,
        mate: typeof pv.mate === "number" ? pv.mate : null,
        line
      });
    }

    return {
      depth: typeof payload.depth === "number" ? payload.depth : 0,
      knodes: typeof payload.knodes === "number" ? payload.knodes : 0,
      pvs: parsedPvs
    };
  }

  return null;
}

/**
 * Lichess cloud eval returns UCI_Chess960 castling (e1h1/e1a1/e8h8/e8a8).
 * chess.js expects standard SAN for castling in standard chess.
 *
 * @param {Chess} chess
 * @param {string} uci
 */
function playUciMove(chess, uci) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.slice(4, 5) || undefined;

  if (from === "e1" || from === "e8") {
    if (to === "h1" || to === "h8" || to === "g1" || to === "g8") {
      try {
        return chess.move("O-O", { strict: false });
      } catch {
        return null;
      }
    }

    if (to === "a1" || to === "a8" || to === "c1" || to === "c8") {
      try {
        return chess.move("O-O-O", { strict: false });
      } catch {
        return null;
      }
    }
  }

  try {
    return chess.move({ from, to, promotion });
  } catch {
    return null;
  }
}

/**
 * @param {unknown} check
 */
function isPassingBadMoveCheck(check) {
  return (
    typeof check === "object" &&
    check !== null &&
    "passesThreshold" in check &&
    check.passesThreshold === true
  );
}

/**
 * @param {"white"|"black"} studySide
 * @param {number | null} recommendedCp
 * @param {number | null} candidateCp
 */
function getStudySideDelta(studySide, recommendedCp, candidateCp) {
  if (recommendedCp === null || candidateCp === null) {
    return null;
  }

  return studySide === "white" ? candidateCp - recommendedCp : recommendedCp - candidateCp;
}

/**
 * @param {string} fen
 * @param {string} san
 */
function fenAfterSan(fen, san) {
  const chess = new Chess(fen);
  const move = chess.move(san, { strict: true });

  return move ? chess.fen() : null;
}

/**
 * @param {readonly BadMoveCoverageRow[]} rows
 * @param {"none"|"bad-moves"|"all"} cloudMode
 */
async function collectCloudEvidence(rows, cloudMode) {
  if (cloudMode === "none") {
    return new Map();
  }

  /** @type {Map<string, Awaited<ReturnType<typeof fetchCloudEval>>>} */
  const evalCache = new Map();

  /**
   * @param {string | null} fen
   * @param {number} multiPv
   */
  async function cachedEval(fen, multiPv) {
    if (!fen) {
      return null;
    }

    const cacheKey = `${multiPv}:${fen}`;
    if (!evalCache.has(cacheKey)) {
      evalCache.set(cacheKey, await fetchCloudEval(fen, multiPv));
    }

    return evalCache.get(cacheKey) ?? null;
  }

  /** @type {Map<string, {topMoves: NonNullable<Awaited<ReturnType<typeof fetchCloudEval>>>; badMoveChecks: unknown[]}>} */
  const byPosition = new Map();

  for (const row of rows) {
    const positionKey = normalizeFen(row.anchorFen);
    const topMoves = cloudMode === "all" ? await cachedEval(row.anchorFen, 5) : null;
    const hasBadMoves = row.verifiedBadMoves.length > 0;
    const recommendedFen = hasBadMoves ? fenAfterSan(row.anchorFen, row.nextSan) : null;
    const recommendedEval = hasBadMoves ? await cachedEval(recommendedFen, 1) : null;
    const recommendedCp = recommendedEval?.pvs[0]?.cp ?? null;
    const badMoveChecks = [];

    for (const badMove of row.verifiedBadMoves) {
      const badFen = fenAfterSan(row.anchorFen, badMove.san);
      const badEval = await cachedEval(badFen, 1);
      const badCp = badEval?.pvs[0]?.cp ?? null;
      const deltaCp = getStudySideDelta(row.studySide, recommendedCp, badCp);

      badMoveChecks.push({
        san: badMove.san,
        comparedToSan: row.nextSan,
        cpAfterRecommended: recommendedCp,
        cpAfterCandidate: badCp,
        studySideDeltaCp: deltaCp,
        passesThreshold: typeof deltaCp === "number" && deltaCp <= -MIN_BAD_MOVE_DROP_CP,
        source: {
          kind: "lichess-cloud-eval",
          title: "Lichess cloud eval",
          url: LICHESS_CLOUD_EVAL_URL
        }
      });
    }

    if (topMoves || badMoveChecks.length > 0) {
      byPosition.set(positionKey, {
        topMoves: topMoves ?? { depth: 0, knodes: 0, pvs: [] },
        badMoveChecks
      });
    }
  }

  return byPosition;
}

/**
 * @param {string} outputPath
 * @param {unknown} payload
 */
function writeJson(outputPath, payload) {
  const resolved = resolve(outputPath);
  mkdirSync(dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  const flags = parseArgs();
  const output = typeof flags.output === "string" ? flags.output : DEFAULT_OUTPUT;
  const sourceGlob = typeof flags.sources === "string" ? flags.sources : DEFAULT_SOURCE_GLOB;
  const withCloud = flags["with-cloud"] === true || flags["with-cloud"] === "true";
  const rawCloudMode = typeof flags.cloud === "string" ? flags.cloud : withCloud ? "all" : "none";
  const cloudMode = rawCloudMode === "bad-moves" || rawCloudMode === "all" ? rawCloudMode : "none";
  const lessons = buildOpeningLessons();
  const coverage = buildBadMoveCoverageReport(lessons);
  const targetRows = coverage.rows;
  const targetMap = buildTargetMap(targetRows);
  const sourceFiles = resolveSourceFiles(sourceGlob);
  const broadcastEvidence = await collectBroadcastEvidence(targetMap, sourceFiles);
  const cloudEvidence = await collectCloudEvidence(targetRows, cloudMode);

  const positions = targetRows.map((row) => {
    const positionKey = normalizeFen(row.anchorFen);
    const broadcastMoves = Array.from(broadcastEvidence.byPosition.get(positionKey)?.values() ?? []).sort(
      (a, b) => b.games - a.games
    );
    const cloud = cloudEvidence.get(positionKey) ?? null;

    return {
      openingKey: row.openingKey,
      openingName: row.openingName,
      studySide: row.studySide,
      sourceName: row.sourceName,
      lineKey: row.lineKey,
      lineLabel: row.lineLabel,
      anchorPly: row.anchorPly,
      anchorFen: row.anchorFen,
      positionKey,
      expectedSan: row.nextSan,
      verifiedBadMoves: row.verifiedBadMoves.map((badMove) => badMove.san),
      lichessBroadcast: {
        moves: broadcastMoves.slice(0, 6)
      },
      lichessCloudEval: cloud
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    methodology: {
      charterPurpose:
        "Source-backed opening advice: named lines from open opening references, practical move evidence from real broadcast games, and tactical-error checks from cached cloud evaluation.",
      target: "All study-side positions currently reachable in the local trainer.",
      badMoveRule: `Existing candidate bad moves only pass the engine-evidence gate when Lichess cloud eval shows at least ${MIN_BAD_MOVE_DROP_CP} centipawns worse for the studied side than the expected study move.`,
      fenNormalization: "Piece placement, side to move, castling rights, and en-passant field are used for transposition-tolerant matching."
    },
    sources: [
      {
        id: "lichess-broadcast-db",
        title: "Lichess Broadcast Database",
        url: "https://database.lichess.org/#broadcasts",
        license: "Creative Commons Attribution-ShareAlike 4.0",
        usage: "Real broadcast games used for practical move-frequency evidence and examples."
      },
      {
        id: "lichess-cloud-eval",
        title: "Lichess Cloud Evaluation API",
        url: LICHESS_CLOUD_EVAL_URL,
        usage: "Cached Stockfish evaluations used to sanity-check candidate bad moves and engine top candidates."
      }
    ],
    summary: {
      lessons: lessons.length,
      studyPositions: targetRows.length,
      sourceFiles: sourceFiles.length,
      broadcastGamesParsed: broadcastEvidence.parsedGames,
      broadcastInvalidGames: broadcastEvidence.invalidGames,
      positionsWithBroadcastMoves: positions.filter((position) => position.lichessBroadcast.moves.length > 0).length,
      positionsWithCloudEval: positions.filter((position) => (position.lichessCloudEval?.topMoves.pvs.length ?? 0) > 0)
        .length,
      existingBadMoveChecks: positions.reduce(
        (total, position) => total + (position.lichessCloudEval?.badMoveChecks.length ?? 0),
        0
      ),
      existingBadMovesPassingCloudGate: positions.reduce(
        (total, position) =>
          total + (position.lichessCloudEval?.badMoveChecks.filter(isPassingBadMoveCheck).length ?? 0),
        0
      )
    },
    positions
  };

  writeJson(output, payload);
  console.log(JSON.stringify(payload.summary, null, 2));
}

await main();

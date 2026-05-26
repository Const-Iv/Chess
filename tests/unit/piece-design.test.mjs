// @ts-check

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const RUNTIME_PIECE_FILES = Object.freeze([
  "app/opening-trainer.tsx",
  "src/domain/chess/opening-database.mjs",
  "src/domain/chess/ruy-lopez.mjs"
]);

const OLD_WHITE_PIECE_GLYPHS = /[♙♘♗♖♕♔]/u;
const CSS_PATH = "app/globals.css";

test("runtime chess pieces use one solid glyph set for both colors", async () => {
  for (const filePath of RUNTIME_PIECE_FILES) {
    const source = await readFile(path.resolve(filePath), "utf8");

    assert.doesNotMatch(source, OLD_WHITE_PIECE_GLYPHS, `${filePath} still renders old outline-only white pieces`);
  }
});

test("toolbar piece icons keep compact controls instead of board-piece sizing", async () => {
  const css = await readFile(path.resolve(CSS_PATH), "utf8");

  assert.match(
    css,
    /\.toolbar-side\s+\.toolbar-piece\s*{[^}]*font-size:\s*23px;[^}]*transform:\s*none;/s,
    "toolbar piece icons must override the later board .piece sizing with a toolbar-specific selector"
  );
});

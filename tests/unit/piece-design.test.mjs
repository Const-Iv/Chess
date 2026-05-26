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

test("runtime chess pieces use one solid glyph set for both colors", async () => {
  for (const filePath of RUNTIME_PIECE_FILES) {
    const source = await readFile(path.resolve(filePath), "utf8");

    assert.doesNotMatch(source, OLD_WHITE_PIECE_GLYPHS, `${filePath} still renders old outline-only white pieces`);
  }
});

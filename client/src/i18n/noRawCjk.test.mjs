import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { RAW_CJK_ALLOWLIST } from "./rawCjkAllowlist.ts";

// client package root (dir that holds package.json): this file is src/i18n/*.
const CLIENT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC_ROOT = path.join(CLIENT_ROOT, "src");

// Matches CJK punctuation (U+3000–303F), CJK ideographs (U+4E00–9FFF) and
// full/half-width forms (U+FF00–FFEF). \u escapes keep this test file CJK-free.
const CJK = /[　-〿一-鿿＀-￯]/;

/**
 * Remove line + block comments while preserving string/template-literal
 * contents (so real Chinese in code strings is still flagged, and `//` or
 * `/* *\/` inside a string never triggers comment mode). Regex literals are
 * left intact — a regex that matches Chinese should still be caught/allowlisted.
 */
function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let state = "normal"; // normal | line | block | sq | dq | tpl
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (state === "normal") {
      if (c === "/" && c2 === "/") { state = "line"; i += 2; continue; }
      if (c === "/" && c2 === "*") { state = "block"; i += 2; continue; }
      if (c === '"') { state = "dq"; out += c; i++; continue; }
      if (c === "'") { state = "sq"; out += c; i++; continue; }
      if (c === "`") { state = "tpl"; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (state === "line") { if (c === "\n") { state = "normal"; out += c; } i++; continue; }
    if (state === "block") { if (c === "*" && c2 === "/") { state = "normal"; i += 2; continue; } if (c === "\n") out += c; i++; continue; }
    if (state === "dq" || state === "sq") {
      const quote = state === "dq" ? '"' : "'";
      if (c === "\\") { out += c + (c2 ?? ""); i += 2; continue; }
      out += c; if (c === quote) state = "normal"; i++; continue;
    }
    if (state === "tpl") {
      if (c === "\\") { out += c + (c2 ?? ""); i += 2; continue; }
      out += c; if (c === "`") state = "normal"; i++; continue;
    }
  }
  return out;
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Locale JSON is the source of truth; fixtures snapshot pre-i18n Chinese.
      if (entry.name === "locales" || entry.name === "__fixtures__" || entry.name === "node_modules") continue;
      walk(full, acc);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const rel = path.relative(CLIENT_ROOT, full).split(path.sep).join("/");
    // Exclude the i18n guard/test files themselves (they carry CJK ranges).
    if (rel.startsWith("src/i18n/") && /\.test\./.test(entry.name)) continue;
    acc.push(rel);
  }
  return acc;
}

const files = walk(SRC_ROOT);
const allowSet = new Set(RAW_CJK_ALLOWLIST);
const filesWithCjk = new Set(
  files.filter((rel) => CJK.test(stripComments(readFileSync(path.join(CLIENT_ROOT, rel), "utf8")))),
);

test("no non-allowlisted client source file contains raw (non-comment) Chinese", () => {
  const violations = [...filesWithCjk].filter((rel) => !allowSet.has(rel)).sort();
  assert.deepEqual(
    violations,
    [],
    `These files have user-facing-looking Chinese outside comments. Extract it to a locale namespace, or (if it is genuinely non-UI) add it to rawCjkAllowlist.ts with a reason:\n${violations.join("\n")}`,
  );
});

test("every allowlisted file still exists and still contains raw Chinese (list stays honest)", () => {
  const stale = RAW_CJK_ALLOWLIST.filter((rel) => !filesWithCjk.has(rel)).sort();
  assert.deepEqual(
    stale,
    [],
    `These allowlisted files no longer contain non-comment Chinese — remove them from rawCjkAllowlist.ts:\n${stale.join("\n")}`,
  );
});

test("allowlist has no duplicate entries", () => {
  assert.equal(RAW_CJK_ALLOWLIST.length, new Set(RAW_CJK_ALLOWLIST).size);
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  readLocaleFile,
  writeLocaleFile,
  LOCALE_FILE_NAME,
} from "./localeStore.ts";

function makeTempDir() {
  return mkdtempSync(path.join(tmpdir(), "ai-novel-locale-store-"));
}

test("LOCALE_FILE_NAME is locale.json under userData", () => {
  assert.equal(LOCALE_FILE_NAME, "locale.json");
});

test("readLocaleFile returns zh when no file exists", () => {
  const dir = makeTempDir();
  try {
    assert.equal(readLocaleFile(dir), "zh");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("writeLocaleFile then readLocaleFile round-trips a valid locale", () => {
  const dir = makeTempDir();
  try {
    writeLocaleFile(dir, "en");
    assert.equal(readLocaleFile(dir), "en");

    writeLocaleFile(dir, "zh");
    assert.equal(readLocaleFile(dir), "zh");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readLocaleFile falls back to zh for unknown / corrupt stored values", () => {
  const dir = makeTempDir();
  try {
    writeLocaleFile(dir, "en");
    assert.equal(readLocaleFile(dir), "en");
    // corrupt the file directly
    writeFileSync(path.join(dir, LOCALE_FILE_NAME), "not-json{");
    assert.equal(readLocaleFile(dir), "zh", "corrupt JSON falls back to zh");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

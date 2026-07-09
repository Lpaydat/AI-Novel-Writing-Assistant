import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZH_DIR = path.resolve(__dirname, "../locales/zh");
const EN_DIR = path.resolve(__dirname, "../locales/en");

// Matches CJK punctuation (U+3000–303F), CJK ideographs (U+4E00–9FFF) and
// full/half-width forms (U+FF00–FFEF). Written with \u escapes so this test
// file stays CJK-free.
const CJK = /[　-〿一-鿿＀-￯]/;

const listNamespaces = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();

const readJson = (dir, ns) => JSON.parse(readFileSync(path.join(dir, `${ns}.json`), "utf8"));

const zhNamespaces = listNamespaces(ZH_DIR);
const enNamespaces = listNamespaces(EN_DIR);

test("zh and en expose the exact same set of namespace files", () => {
  assert.deepEqual(zhNamespaces, enNamespaces);
});

test("every namespace has at least one key", () => {
  for (const ns of zhNamespaces) {
    assert.ok(Object.keys(readJson(ZH_DIR, ns)).length > 0, `zh/${ns}.json is empty`);
  }
});

for (const ns of zhNamespaces) {
  test(`namespace "${ns}": zh and en have identical key sets`, () => {
    const zhKeys = Object.keys(readJson(ZH_DIR, ns)).sort();
    const enKeys = Object.keys(readJson(EN_DIR, ns)).sort();
    const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));
    const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));
    assert.deepEqual(
      { missingInEn, missingInZh },
      { missingInEn: [], missingInZh: [] },
      `key-set drift in namespace "${ns}"`,
    );
  });

  test(`namespace "${ns}": en values contain zero CJK`, () => {
    const en = readJson(EN_DIR, ns);
    const offenders = Object.entries(en)
      .filter(([, value]) => typeof value === "string" && CJK.test(value))
      .map(([key]) => key);
    assert.deepEqual(offenders, [], `en/${ns}.json has CJK in: ${offenders.join(", ")}`);
  });
}

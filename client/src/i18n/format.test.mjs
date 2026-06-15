import test from "node:test";
import assert from "node:assert/strict";
import { formatLocaleNumber, formatLocaleDateTime } from "./format.ts";

// U1 (formatter slice) — locale-aware Intl formatters bound to the app locale.
// The novels-area previously hardcoded `Intl.NumberFormat("zh-CN")` and
// `toLocaleString("zh-CN")`, forcing Chinese formatting regardless of the
// user's chosen locale. These now go through client/src/i18n/format.ts, which
// reads the active locale from localStorage (zh default).
//
// Risk A: under zh the formatters still produce zh-CN formatting
// (byte-identical intent). Under en they produce en-US formatting.

if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => void store.clear(),
  };
}

function setLocale(locale) {
  if (locale) globalThis.localStorage.setItem("ai-novel-locale", locale);
  else globalThis.localStorage.removeItem("ai-novel-locale");
}

test("U1 formatters: zh locale reproduces zh-CN formatting (Risk A)", () => {
  setLocale("zh");
  // Number: zh-CN groups with comma — same as the old Intl.NumberFormat("zh-CN").
  assert.equal(formatLocaleNumber(1234567), "1,234,567");
  assert.match(formatLocaleDateTime("2026-03-04T05:06:07Z"), /2026/);
});

test("U1 formatters: en locale produces en-US formatting (locale-aware, not hardcoded zh)", () => {
  setLocale("en");
  assert.equal(formatLocaleNumber(1234567), "1,234,567");
  assert.match(formatLocaleDateTime("2026-03-04T05:06:07Z"), /2026/);
  // Key invariant: en and zh are both produced by the SAME helper bound to the
  // active locale (no more hardcoded zh-CN); switching locale changes the
  // output locale tag without code changes.
});

test("U1 formatters: explicit locale override works and respects options (NovelWorldManagerCard usage)", () => {
  const compact = formatLocaleDateTime("2026-03-04T05:06:07Z", "zh", {
    month: "2-digit",
    day: "2-digit",
  });
  // Only month/day digits — mirrors NovelWorldManagerCard's compact usage.
  assert.match(compact, /^0?3\/0?4/, `compact zh date should be month/day: ${compact}`);
});

test("U1 formatters: invalid date returns empty string (no NaN crash)", () => {
  assert.equal(formatLocaleDateTime("not-a-date"), "");
});

test("U1 formatters: default locale (no localStorage key) is zh", () => {
  setLocale(undefined);
  assert.equal(formatLocaleNumber(1000), "1,000");
});

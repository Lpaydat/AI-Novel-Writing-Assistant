import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import i18next from "i18next";

import {
  STORAGE_KEY,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  resolveActiveLocale,
  buildAcceptLanguageHeader,
  getActiveLocale,
  persistActiveLocale,
} from "./localeHeaders.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readJson = (rel) => JSON.parse(readFileSync(path.resolve(__dirname, rel), "utf8"));

// Risk A guard: the captured (pre-change) zh strings, snapshotted verbatim from
// the original Home.tsx before it was converted to t() keys. The test never
// re-types a Chinese literal — it loads this file + the zh locale and compares
// via real i18next resolution.
const HOME_ZH_GOLDEN = readJson("./__fixtures__/home.zh.golden.json");
const HOME_ZH_LOCALE = readJson("./../locales/zh/home.json");
const ORIGINAL_HOME_SOURCE = readFileSync(
  path.resolve(__dirname, "./__fixtures__/Home.original.tsx"),
  "utf8",
);

// Sample interpolation vars covering every placeholder used by Home keys.
const SAMPLE_VARS = {
  worldName: "测试世界",
  scope: "第1-3章",
  percent: 42,
  date: "2026-01-02",
  count: 7,
  stage: "草稿阶段",
};

function renderTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : `{{${key}}}`,
  );
}

test("STORAGE_KEY is the pinned localStorage key", () => {
  assert.equal(STORAGE_KEY, "ai-novel-locale");
});

test("SUPPORTED_LOCALES is exactly zh and en", () => {
  assert.deepEqual([...SUPPORTED_LOCALES].sort(), ["en", "zh"]);
});

test("DEFAULT_LOCALE is zh", () => {
  assert.equal(DEFAULT_LOCALE, "zh");
});

test("resolveActiveLocale returns zh for null/empty/whitespace", () => {
  assert.equal(resolveActiveLocale(null), "zh");
  assert.equal(resolveActiveLocale(""), "zh");
  assert.equal(resolveActiveLocale("   "), "zh");
});

test("resolveActiveLocale normalizes case and trims supported tokens", () => {
  assert.equal(resolveActiveLocale("en"), "en");
  assert.equal(resolveActiveLocale("EN"), "en");
  assert.equal(resolveActiveLocale("  En "), "en");
  assert.equal(resolveActiveLocale("zh"), "zh");
  assert.equal(resolveActiveLocale("ZH"), "zh");
});

test("resolveActiveLocale falls back to zh for unknown tokens", () => {
  assert.equal(resolveActiveLocale("fr"), "zh");
  assert.equal(resolveActiveLocale("en-US"), "zh");
  assert.equal(resolveActiveLocale("zh-CN"), "zh");
});

test("buildAcceptLanguageHeader returns a bare-token Accept-Language header", () => {
  assert.deepEqual(buildAcceptLanguageHeader("zh"), { "Accept-Language": "zh" });
  assert.deepEqual(buildAcceptLanguageHeader("en"), { "Accept-Language": "en" });
});

test("getActiveLocale reads localStorage and resolves via resolveActiveLocale", () => {
  const store = new Map();
  const localStorageStub = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
  };
  globalThis.localStorage = localStorageStub;

  assert.equal(getActiveLocale(), "zh", "defaults to zh when key absent");

  store.set(STORAGE_KEY, "en");
  assert.equal(getActiveLocale(), "en");

  store.set(STORAGE_KEY, "garbage");
  assert.equal(getActiveLocale(), "zh", "unknown stored value falls back to zh");
});

test("persistActiveLocale writes the resolved locale into localStorage", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
  };

  persistActiveLocale("en");
  assert.equal(store.get(STORAGE_KEY), "en");

  persistActiveLocale("zh");
  assert.equal(store.get(STORAGE_KEY), "zh");
});

test("locale switch round-trip: persist then read reflects the new locale (LocaleSwitcher contract)", () => {
  // The LocaleSwitcher (client/src/components/common/LocaleSwitcher.tsx) calls
  // changeAppLocale -> persistActiveLocale; the next getActiveLocale() (which
  // drives the Accept-Language header + the next boot) must reflect it.
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
  };

  assert.equal(getActiveLocale(), "zh", "starts at default zh");

  persistActiveLocale("en");
  assert.equal(getActiveLocale(), "en", "after switch to en");

  persistActiveLocale("zh");
  assert.equal(getActiveLocale(), "zh", "after switch back to zh");
});

test("zh byte-identity: golden was captured verbatim from original Home.tsx", () => {
  // Every golden string (minus interpolation placeholders) must literally appear
  // in the original Home.tsx fixture. Guards against capture errors.
  for (const [key, value] of Object.entries(HOME_ZH_GOLDEN)) {
    const staticParts = value.split(/\{\{\w+\}\}/);
    for (const part of staticParts) {
      if (part === "") continue;
      assert.ok(
        ORIGINAL_HOME_SOURCE.includes(part),
        `golden[${key}] static part not found in original Home.tsx: ${JSON.stringify(part)}`,
      );
    }
  }
});

test("zh byte-identity: zh locale reproduces golden via real i18next resolution", async () => {
  const i18n = i18next.createInstance();
  await i18n.init({
    resources: { zh: { home: HOME_ZH_LOCALE } },
    lng: "zh",
    fallbackLng: "zh",
    defaultNS: "home",
    ns: ["home"],
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    initImmediate: false,
  });

  assert.deepEqual(
    Object.keys(HOME_ZH_LOCALE).sort(),
    Object.keys(HOME_ZH_GOLDEN).sort(),
    "zh locale and golden must cover the same keys",
  );

  for (const [key, goldenValue] of Object.entries(HOME_ZH_GOLDEN)) {
    const expected = renderTemplate(goldenValue, SAMPLE_VARS);
    const actual = i18n.t(key, { lng: "zh", ...SAMPLE_VARS });
    assert.equal(
      actual,
      expected,
      `zh byte-identity drift at key ${key}`,
    );
  }
});

test("locale-transport wiring: axios + all 3 fetch callers consume the shared helper", () => {
  const callers = {
    "src/api/client.ts": (s) => s.includes("getLocaleHeaders") && s.includes("interceptors.request.use"),
    "src/hooks/useSSE.ts": (s) => s.includes("getLocaleHeaders"),
    "src/api/creativeHub.ts": (s) => s.includes("getLocaleHeaders"),
    "src/pages/chat/components/AssistantChatPanel.tsx": (s) => s.includes("getLocaleHeaders"),
  };
  for (const [rel, predicate] of Object.entries(callers)) {
    const src = readFileSync(path.resolve(__dirname, "../../", rel), "utf8");
    assert.ok(predicate(src), `${rel} must consume getLocaleHeaders from the shared i18n helper`);
  }
});

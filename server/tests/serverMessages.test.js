const test = require("node:test");
const assert = require("node:assert/strict");

// Server message catalog (S2 foundation). Mirrors the F3/S1 typed-map
// convention + adds {{var}} interpolation (matches client react-i18next config).
// Tests pin: zh byte-identity of the captured pre-i18n strings (Risk A), en
// branches, interpolation, locale fallback, and unknown-key visibility.

const {
  SERVER_MESSAGES,
  serverT,
  interpolate,
  hasServerMessage,
  listServerMessageKeys,
} = require("../dist/i18n/serverMessages.js");
const { getRequestLocale } = require("../dist/middleware/locale.js");

// Pre-i18n zh golden strings, captured verbatim from the source files before S2.
// The test never re-types a Chinese literal — it asserts the catalog's zh branch
// reproduces the originals byte-for-byte.
const ZH_GOLDEN = {
  threadDefault: "新对话",
  threadNotFound: "线程不存在。",
  apiKeyMissing: (p) => `未配置 ${p} 的 API Key。`,
  defaultModelMissing: (p) => `未配置 ${p} 的默认模型。`,
  apiUrlMissing: (p) => `未配置 ${p} 的 API URL。`,
  fetchFailed: (s, d) => `拉取模型列表失败（${s}）：${d || "未知错误"}`,
  listEmpty: "模型列表为空。",
  novelNotFound: "小说不存在。",
  txtFullOnly: "TXT 导出仅支持整本书正文导出。",
  bodyFinalizing: "正文已生成，正在整理章节文本并保存草稿。",
  intakeCheck: "正在完成正文接收检查并同步章节状态。",
  savedWithIssues: "章节已保存，但检测到待修复问题。",
  savedReadyReview: "章节已保存，可继续审校。",
};

test("S2 catalog: zh branch reproduces pre-i18n strings byte-for-byte (Risk A)", () => {
  assert.equal(serverT("creativeHub.thread.defaultTitle", "zh"), ZH_GOLDEN.threadDefault);
  assert.equal(serverT("creativeHub.thread.notFound", "zh"), ZH_GOLDEN.threadNotFound);
  assert.equal(serverT("llm.factory.apiKeyMissing", "zh", { providerName: "deepseek" }), ZH_GOLDEN.apiKeyMissing("deepseek"));
  assert.equal(serverT("llm.factory.defaultModelMissing", "zh", { providerName: "openai" }), ZH_GOLDEN.defaultModelMissing("openai"));
  assert.equal(serverT("llm.factory.apiUrlMissing", "zh", { providerName: "deepseek" }), ZH_GOLDEN.apiUrlMissing("deepseek"));
  assert.equal(serverT("llm.modelCatalog.fetchFailed", "zh", { status: 500, detail: "boom" }), ZH_GOLDEN.fetchFailed(500, "boom"));
  assert.equal(serverT("llm.modelCatalog.listEmpty", "zh"), ZH_GOLDEN.listEmpty);
  assert.equal(serverT("export.novelNotFound", "zh"), ZH_GOLDEN.novelNotFound);
  assert.equal(serverT("export.txtFullOnly", "zh"), ZH_GOLDEN.txtFullOnly);
  assert.equal(serverT("chapter.sse.bodyFinalizing", "zh"), ZH_GOLDEN.bodyFinalizing);
  assert.equal(serverT("chapter.sse.intakeCheck", "zh"), ZH_GOLDEN.intakeCheck);
  assert.equal(serverT("chapter.sse.savedWithIssues", "zh"), ZH_GOLDEN.savedWithIssues);
  assert.equal(serverT("chapter.sse.savedReadyReview", "zh"), ZH_GOLDEN.savedReadyReview);
});

test("S2 catalog: en branch returns English (domain-aware rewrite, no CJK)", () => {
  const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;
  for (const key of listServerMessageKeys()) {
    const en = serverT(key, "en");
    assert.ok(en && en.length > 0, `${key} en must be non-empty`);
    assert.ok(!CJK.test(en), `${key} en must contain no CJK: ${en.slice(0, 80)}`);
  }
  // Spot-check a couple of interpolated en renders.
  assert.equal(
    serverT("llm.factory.apiKeyMissing", "en", { providerName: "deepseek" }),
    "No API key configured for deepseek.",
  );
  assert.equal(
    serverT("llm.modelCatalog.fetchFailed", "en", { status: 404, detail: "not found" }),
    "Failed to fetch model list (HTTP 404): not found",
  );
});

test("S2 catalog: interpolation replaces {{var}}, leaves missing vars visible", () => {
  assert.equal(interpolate("a {{x}} b", { x: 7 }), "a 7 b");
  assert.equal(interpolate("no vars"), "no vars");
  // Missing var stays literal so the bug is visible (not silently empty).
  assert.equal(interpolate("a {{x}} b", {}), "a {{x}} b");
});

test("S2 catalog: default locale is getRequestLocale() (zh when no request context)", () => {
  // Outside a request AsyncLocalStorage context, getRequestLocale() returns zh.
  assert.equal(getRequestLocale(), "zh");
  // So serverT with no locale arg resolves zh.
  assert.equal(serverT("creativeHub.thread.defaultTitle"), ZH_GOLDEN.threadDefault);
});

test("S2 catalog: unknown key returns the key itself (visible bug, never silent)", () => {
  assert.equal(serverT("does.not.exist", "zh"), "does.not.exist");
  assert.equal(hasServerMessage("does.not.exist"), false);
  assert.equal(hasServerMessage("creativeHub.thread.notFound"), true);
});

test("S2 catalog: every entry has both zh and en non-empty (completeness)", () => {
  for (const key of listServerMessageKeys()) {
    const entry = SERVER_MESSAGES[key];
    assert.ok(entry.zh && entry.zh.length > 0, `${key} zh missing`);
    assert.ok(entry.en && entry.en.length > 0, `${key} en missing`);
  }
});

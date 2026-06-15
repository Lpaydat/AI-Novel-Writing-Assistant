const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRegisteredPromptAsset,
  hasRegisteredPromptAsset,
  resolvePromptVariant,
} = require("../dist/prompting/registry.js");
const { buildPromptAssetKey } = require("../dist/prompting/core/promptTypes.js");
const { preparePromptExecution } = require("../dist/prompting/core/promptRunner.js");

// Matches any CJK ideograph — used to assert the en variant emits no Chinese.
const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

// A representative title-generation input. Fields mirror TitlePromptContext.
const TITLE_INPUT = {
  context: {
    mode: "novel",
    count: 8,
    brief: "A revenge-driven heir loses everything in one night and claws his way back through a secret identity.",
    referenceTitle: "",
    novelTitle: "",
    currentTitle: "",
    genreName: "Modern urban power fantasy",
    genreDescription: "City backdrop, hidden identity, escalating power and payback.",
  },
  forceJson: true,
  retryReason: null,
};

test("P1 title: title.generation@v1@en is registered as a language=en asset", () => {
  const en = getRegisteredPromptAsset("title.generation", "v1", "en");
  assert.ok(en, "title en variant must be registered");
  assert.equal(en.language, "en");
  assert.equal(en.id, "title.generation");
  assert.equal(en.version, "v1");
  assert.equal(en.mode, "structured");
  assert.equal(en.taskType, "planner");
  assert.equal(buildPromptAssetKey(en), "title.generation@v1@en");
  assert.equal(hasRegisteredPromptAsset("title.generation", "v1", "en"), true);
});

test("P1 title: resolvePromptVariant(en) returns the en variant, no fallback; zh anchor intact (Risk A)", () => {
  const en = resolvePromptVariant("title.generation", "v1", "en");
  assert.ok(en, "en must resolve");
  assert.equal(en.resolvedLocale, "en");
  assert.equal(en.localeFallback, false);
  assert.equal(en.asset.language, "en");
  assert.equal(en.resolvedVariant, "title.generation@v1@en");

  // Risk A: zh anchor untouched + still the default-locale resolution.
  const zh = resolvePromptVariant("title.generation", "v1", "zh");
  assert.ok(zh, "zh anchor must resolve");
  assert.equal(zh.resolvedLocale, "zh");
  assert.equal(zh.localeFallback, false);
  assert.equal(zh.asset.language, "zh");
  assert.equal(zh.resolvedVariant, "title.generation@v1@zh");
  // 2-arg backward-compat call still returns the zh anchor.
  const compat = getRegisteredPromptAsset("title.generation", "v1");
  assert.equal(compat.language, "zh");
});

test("P1 title: en variant reuses the zh anchor's outputSchema (JSON shape is language-independent)", () => {
  const en = getRegisteredPromptAsset("title.generation", "v1", "en");
  const zh = getRegisteredPromptAsset("title.generation", "v1", "zh");
  assert.equal(en.outputSchema, zh.outputSchema, "en must reuse zh outputSchema");
});

test("P1 title: preparePromptExecution(locale=en) routes to the en variant", () => {
  const zhAnchor = getRegisteredPromptAsset("title.generation", "v1", "zh");
  const prepared = preparePromptExecution({
    asset: zhAnchor,
    promptInput: TITLE_INPUT,
    contextBlocks: [],
    options: { locale: "en" },
  });
  assert.equal(prepared.invocation.resolvedLocale, "en");
  assert.equal(prepared.invocation.localeFallback, false);
  assert.equal(prepared.invocation.resolvedVariant, "title.generation@v1@en");
});

test("P1 title: en variant renders English output with no CJK (domain-aware rewrite, not a string swap)", () => {
  const en = getRegisteredPromptAsset("title.generation", "v1", "en");
  const messages = en.render(TITLE_INPUT, {
    blocks: [],
    selectedBlockIds: [],
    droppedBlockIds: [],
    summarizedBlockIds: [],
    estimatedInputTokens: 0,
  });
  assert.ok(Array.isArray(messages) && messages.length >= 2, "must emit system + human messages");
  const text = messages.map((m) => m.content).join("\n");
  assert.ok(!CJK.test(text), `en variant must contain no CJK, but found Chinese characters in:\n${text.slice(0, 400)}`);
  // Domain-aware signals: English serialized-fiction framing, the shared enums,
  // and the 26-char schema cap honored in the instructions.
  assert.match(text, /serialized|commercial fiction/i);
  for (const tok of ["literary", "conflict", "suspense", "high_concept"]) {
    assert.ok(text.includes(tok), `en variant must document the shared enum ${tok}`);
  }
  assert.match(text, /26 character/i, "en variant must honor the shared schema's title length cap");
});

test("P1 title: default locale (zh) still renders the zh anchor byte-identically (Risk A)", () => {
  // No options.locale ⇒ anchor renders unchanged. zh output must still contain
  // Chinese (proves we did not accidentally swap the default).
  const zh = getRegisteredPromptAsset("title.generation", "v1", "zh");
  const prepared = preparePromptExecution({
    asset: zh,
    promptInput: TITLE_INPUT,
    contextBlocks: [],
  });
  assert.equal(prepared.invocation.resolvedLocale, "zh");
  assert.equal(prepared.invocation.localeFallback, false);
  const text = prepared.messages.map((m) => m.content).join("\n");
  assert.ok(CJK.test(text), "zh anchor must still render Chinese by default");
});

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

// ---------------------------------------------------------------------------
// P1 Style family (11 assets). Each en variant reuses its zh anchor's
// outputSchema + input type; the zh anchor is byte-identical (additive).
// NOTE: style.detection/rewrite declare version v2 (the registry's @v1 loader
// key is a known stale hint corrected on hydration); resolution uses the REAL
// version v2. style.profile.extract=v2, from_book_analysis=v3, from_brief=v2.
// ---------------------------------------------------------------------------

const STYLE_VARIANTS = [
  { id: "style.detection", version: "v2", mode: "structured" },
  { id: "style.recommendation", version: "v1", mode: "structured" },
  { id: "style.generate", version: "v1", mode: "text" },
  { id: "style.rewrite", version: "v2", mode: "text" },
  { id: "style.anti_ai_rule.draft", version: "v1", mode: "structured" },
  { id: "style.profile.extract", version: "v2", mode: "structured" },
  { id: "style.profile.from_book_analysis", version: "v3", mode: "structured" },
  { id: "style.profile.from_brief", version: "v2", mode: "structured" },
  { id: "style.profile.metadata", version: "v1", mode: "structured" },
  { id: "style.profile.select_anti_ai", version: "v1", mode: "structured" },
  { id: "style.profile.sanitize_for_generation", version: "v1", mode: "structured" },
];

test("P1 style: every en variant is registered + resolves (no fallback); zh anchors intact (Risk A)", () => {
  for (const { id, version, mode } of STYLE_VARIANTS) {
    const en = resolvePromptVariant(id, version, "en");
    assert.ok(en, `${id}@${version}@en must resolve`);
    assert.equal(en.resolvedLocale, "en", `${id} resolvedLocale`);
    assert.equal(en.localeFallback, false, `${id} must not fall back`);
    assert.equal(en.asset.language, "en", `${id} language`);
    assert.equal(en.asset.mode, mode, `${id} mode preserved`);
    assert.equal(en.asset.taskType, en.asset.taskType, `${id} taskType present`);
    assert.equal(en.resolvedVariant, `${id}@${version}@en`);

    // Risk A: zh anchor still resolves, default-locale, untouched.
    const zh = resolvePromptVariant(id, version, "zh");
    assert.ok(zh, `${id} zh anchor must resolve`);
    assert.equal(zh.resolvedLocale, "zh");
    assert.equal(zh.localeFallback, false);
    assert.equal(zh.resolvedVariant, `${id}@${version}@zh`);
    // en preserves the zh anchor's taskType (planner/writer/repair per asset).
    assert.equal(en.asset.taskType, zh.asset.taskType, `${id} en taskType === zh`);
    // 2-arg backward-compat returns zh anchor.
    assert.equal(getRegisteredPromptAsset(id, version).language, "zh");
  }
});

test("P1 style: every en variant reuses its zh anchor's outputSchema", () => {
  for (const { id, version } of STYLE_VARIANTS) {
    const en = getRegisteredPromptAsset(id, version, "en");
    const zh = getRegisteredPromptAsset(id, version, "zh");
    assert.equal(en.outputSchema, zh.outputSchema, `${id} en must reuse zh outputSchema`);
  }
});

// Representative render inputs (minimal but valid per each asset's input type).
const STYLE_RENDER_SAMPLES = {
  "style.detection": {
    styleContractText: "Show, don't tell. Vary sentence length.",
    styleContractMetaText: "meta",
    antiRuleCatalogText: "forbidden: 'a symphony of'",
    content: "The city was a symphony of light. He felt utterly perfect.",
  },
  "style.generate": {
    styleBlock: "sharp dialogue",
    characterBlock: "gruff detective",
    antiAiBlock: "avoid cliches",
    selfCheckBlock: "",
    mode: "generate",
    prompt: "Write the opening of chapter 1.",
    targetLength: 600,
  },
  "style.rewrite": {
    styleContractText: "concrete verbs",
    content: "He was very sad and walked away slowly.",
    issuesBlock: "- vague emotion (very sad)",
  },
  "style.profile.extract": {
    name: "Tight thriller",
    sourceText: "Short sentences. Clipped dialogue. No interiority.",
  },
  "style.profile.from_brief": {
    brief: "A sparse, cold, hardboiled feel with snappy dialogue.",
  },
};

test("P1 style: representative en variants render English output with no CJK", () => {
  const emptyContext = {
    blocks: [],
    selectedBlockIds: [],
    droppedBlockIds: [],
    summarizedBlockIds: [],
    estimatedInputTokens: 0,
  };
  for (const [id, sampleInput] of Object.entries(STYLE_RENDER_SAMPLES)) {
    const { version } = STYLE_VARIANTS.find((v) => v.id === id);
    const en = getRegisteredPromptAsset(id, version, "en");
    const messages = en.render(sampleInput, emptyContext);
    assert.ok(Array.isArray(messages) && messages.length >= 2, `${id} en must emit messages`);
    const text = messages.map((m) => m.content).join("\n");
    assert.ok(!CJK.test(text), `${id} en variant must contain no CJK:\n${text.slice(0, 300)}`);
  }
});

// ---------------------------------------------------------------------------
// P1 World — worldDraft sub-family (4 assets). The remaining 14 world.prompts
// assets ship in a follow-up phase; this test covers what landed.
// ---------------------------------------------------------------------------

const WORLD_DRAFT_VARIANTS = [
  { id: "world.skeleton.generate", version: "v1", mode: "structured" },
  { id: "world.draft.generate", version: "v1", mode: "structured" },
  { id: "world.draft.refine", version: "v1", mode: "text" },
  { id: "world.draft.refine_alternatives", version: "v1", mode: "structured" },
];

test("P1 world (worldDraft): every en variant resolves (no fallback); zh anchors intact (Risk A)", () => {
  for (const { id, version, mode } of WORLD_DRAFT_VARIANTS) {
    const en = resolvePromptVariant(id, version, "en");
    assert.ok(en, `${id}@${version}@en must resolve`);
    assert.equal(en.resolvedLocale, "en", `${id} resolvedLocale`);
    assert.equal(en.localeFallback, false, `${id} must not fall back`);
    assert.equal(en.asset.language, "en");
    assert.equal(en.asset.mode, mode, `${id} mode preserved`);
    assert.equal(en.resolvedVariant, `${id}@${version}@en`);

    const zh = resolvePromptVariant(id, version, "zh");
    assert.ok(zh, `${id} zh anchor must resolve`);
    assert.equal(zh.resolvedVariant, `${id}@${version}@zh`);
    assert.equal(en.asset.taskType, zh.asset.taskType, `${id} en taskType === zh`);
    assert.equal(getRegisteredPromptAsset(id, version).language, "zh");
  }
});

test("P1 world (worldDraft): en variants reuse zh outputSchema", () => {
  for (const { id, version } of WORLD_DRAFT_VARIANTS) {
    const en = getRegisteredPromptAsset(id, version, "en");
    const zh = getRegisteredPromptAsset(id, version, "zh");
    assert.equal(en.outputSchema, zh.outputSchema, `${id} en must reuse zh outputSchema`);
  }
});

test("P1 world (worldDraft): representative en variants render English with no CJK", () => {
  const emptyContext = {
    blocks: [],
    selectedBlockIds: [],
    droppedBlockIds: [],
    summarizedBlockIds: [],
    estimatedInputTokens: 0,
  };
  const skeletonInput = {
    idea: "A hidden layered city where memory is currency.",
    worldType: "urban fantasy",
    template: "custom",
    options: {
      preset: "standard",
      counts: { rules: 4, factionGroups: 3, forces: 4, locations: 5, conflicts: 3, storyEntrySuggestions: 3 },
    },
  };
  const draftInput = {
    name: "The Memory City",
    description: "A city where memories can be traded.",
    worldType: "urban fantasy",
    complexity: "medium",
    dimensions: { geography: true, culture: false, magicSystem: true, technology: false, history: false },
  };
  const refineInput = {
    worldName: "The Memory City",
    attribute: "background",
    refinementLevel: "deep",
    currentValue: "The city began as a refuge.",
  };
  const samples = {
    "world.skeleton.generate": skeletonInput,
    "world.draft.generate": draftInput,
    "world.draft.refine": refineInput,
  };
  for (const [id, sampleInput] of Object.entries(samples)) {
    const en = getRegisteredPromptAsset(id, "v1", "en");
    const messages = en.render(sampleInput, emptyContext);
    const text = messages.map((m) => m.content).join("\n");
    assert.ok(!CJK.test(text), `${id} en variant must contain no CJK:\n${text.slice(0, 300)}`);
  }
});

// ---------------------------------------------------------------------------
// P1 World — world.prompts.ts family (14 assets). Completes P1's world scope.
// taskType: world.consistency.check = "review", world.import.extract =
// "fact_extraction", the rest "planner".
// ---------------------------------------------------------------------------

const WORLD_PROMPTS_VARIANTS = [
  { id: "world.reference.inspiration", version: "v1" },
  { id: "world.visualization.generate", version: "v1" },
  { id: "world.inspiration.concept_card", version: "v1" },
  { id: "world.inspiration.localize_concept_card", version: "v1" },
  { id: "world.property_options.generate", version: "v1" },
  { id: "world.deepening.questions", version: "v1" },
  { id: "world.consistency.check", version: "v1" },
  { id: "world.layer.generate", version: "v1" },
  { id: "world.layer.localize", version: "v1" },
  { id: "world.import.extract", version: "v1" },
  { id: "world.structure.backfill", version: "v1" },
  { id: "novel.world.generate_from_theme", version: "v1" },
  { id: "world.structure.generate", version: "v1" },
  { id: "world.axioms.suggest", version: "v1" },
];

test("P1 world (world.prompts): every en variant resolves (no fallback); zh anchors intact (Risk A)", () => {
  for (const { id, version } of WORLD_PROMPTS_VARIANTS) {
    const en = resolvePromptVariant(id, version, "en");
    assert.ok(en, `${id}@${version}@en must resolve`);
    assert.equal(en.resolvedLocale, "en", `${id} resolvedLocale`);
    assert.equal(en.localeFallback, false, `${id} must not fall back`);
    assert.equal(en.asset.language, "en");
    assert.equal(en.resolvedVariant, `${id}@${version}@en`);

    // Risk A: zh anchor still resolves, default-locale, untouched.
    const zh = resolvePromptVariant(id, version, "zh");
    assert.ok(zh, `${id} zh anchor must resolve`);
    assert.equal(zh.resolvedVariant, `${id}@${version}@zh`);
    assert.equal(zh.localeFallback, false);
    // en preserves the zh anchor's mode + taskType (incl. review / fact_extraction).
    assert.equal(en.asset.mode, zh.asset.mode, `${id} en mode === zh`);
    assert.equal(en.asset.taskType, zh.asset.taskType, `${id} en taskType === zh`);
    // 2-arg backward-compat returns zh anchor.
    assert.equal(getRegisteredPromptAsset(id, version).language, "zh");
  }
});

test("P1 world (world.prompts): en variants reuse zh outputSchema + preserve mode/taskType", () => {
  for (const { id, version } of WORLD_PROMPTS_VARIANTS) {
    const en = getRegisteredPromptAsset(id, version, "en");
    const zh = getRegisteredPromptAsset(id, version, "zh");
    assert.equal(en.outputSchema, zh.outputSchema, `${id} en must reuse zh outputSchema`);
  }
  // Spot-check the two non-planner taskTypes are preserved on the en variant.
  assert.equal(getRegisteredPromptAsset("world.consistency.check", "v1", "en").taskType, "review");
  assert.equal(getRegisteredPromptAsset("world.import.extract", "v1", "en").taskType, "fact_extraction");
});

test("P1 world (world.prompts): representative en variants render English with no CJK", () => {
  const emptyContext = {
    blocks: [],
    selectedBlockIds: [],
    droppedBlockIds: [],
    summarizedBlockIds: [],
    estimatedInputTokens: 0,
  };
  const samples = {
    "world.reference.inspiration": { userPrompt: "Extract the world base from this reference work." },
    "world.visualization.generate": { worldPromptSource: "A city split into tiers by altitude." },
    "world.deepening.questions": {
      worldName: "The Memory City",
      description: "Memories are currency.",
      dataJson: "{}",
      ragContext: "",
    },
    "world.consistency.check": {
      worldName: "The Memory City",
      axioms: "Memory trades cost the giver.",
      coreSettingsJson: "{}",
      ragContext: "",
    },
    "world.axioms.suggest": {
      worldName: "The Memory City",
      worldType: "urban fantasy",
      templateName: "custom",
      templateDescription: "",
      description: "A city where memories are currency.",
      blueprintPromptBlock: "",
    },
    "world.import.extract": { content: "The city trades in memories; the poor sell, the rich hoard." },
  };
  for (const [id, sampleInput] of Object.entries(samples)) {
    const en = getRegisteredPromptAsset(id, "v1", "en");
    const messages = en.render(sampleInput, emptyContext);
    const text = messages.map((m) => m.content).join("\n");
    assert.ok(!CJK.test(text), `${id} en variant must contain no CJK:\n${text.slice(0, 300)}`);
  }
});

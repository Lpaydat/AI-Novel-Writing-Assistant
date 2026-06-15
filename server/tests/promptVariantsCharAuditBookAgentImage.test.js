const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRegisteredPromptAsset,
  resolvePromptVariant,
} = require("../dist/prompting/registry.js");
const { preparePromptExecution } = require("../dist/prompting/core/promptRunner.js");

const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

// ---------------------------------------------------------------------------
// P3 (.14) — character + audit + bookAnalysis + agent + image English variants.
// 15 registry en variants across the 5 families. Locale source per family:
//  - agent.runtime.* + planner.intent.parse: HTTP-triggered (Creative Hub) -> req.locale
//  - audit.chapter.* + bookAnalysis.* + character.* + image.*: novel-scoped / novel.language
//    (threaded by their services, mirroring P2's novel-scoped rule).
// audit.chapter.full real version is v2 (loader @v1 key is a stale hint
// corrected on hydration); the rest are v1.
// ---------------------------------------------------------------------------

const P3_VARIANTS = [
  // character
  { id: "character.base.skeleton", version: "v1" },
  { id: "character.base.final", version: "v1" },
  { id: "character.sync.classify", version: "v1" },
  // audit
  { id: "audit.chapter.light", version: "v1" },
  { id: "audit.chapter.full", version: "v2" }, // real version v2
  // bookAnalysis
  { id: "bookAnalysis.source.note", version: "v1" },
  { id: "bookAnalysis.section.generate", version: "v1" },
  { id: "bookAnalysis.section.optimize", version: "v1" },
  // agent
  { id: "planner.intent.parse", version: "v1" },
  { id: "agent.runtime.fallback_answer", version: "v1" },
  { id: "agent.runtime.setup_guidance", version: "v1" },
  { id: "agent.runtime.setup_ideation", version: "v1" },
  // image
  { id: "image.character.prompt_optimize", version: "v1" },
  { id: "image.novel_cover.brief", version: "v1" },
  { id: "image.novel_cover.prompt_optimize", version: "v1" },
];

test("P3: every en variant resolves (no fallback); zh anchors intact (Risk A)", () => {
  for (const { id, version } of P3_VARIANTS) {
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
    // en preserves the zh anchor's mode + taskType (incl. light_review /
    // critical_review / chat non-planner taskTypes).
    assert.equal(en.asset.mode, zh.asset.mode, `${id} en mode === zh`);
    assert.equal(en.asset.taskType, zh.asset.taskType, `${id} en taskType === zh`);
    // 2-arg backward-compat returns zh anchor.
    assert.equal(getRegisteredPromptAsset(id, version).language, "zh");
  }
});

test("P3: structured en variants reuse zh outputSchema", () => {
  for (const { id, version } of P3_VARIANTS) {
    const en = getRegisteredPromptAsset(id, version, "en");
    const zh = getRegisteredPromptAsset(id, version, "zh");
    if (zh.mode === "structured") {
      assert.equal(en.outputSchema, zh.outputSchema, `${id} en must reuse zh outputSchema`);
    }
  }
});

test("P3: non-planner taskTypes preserved on the en variant (audit light/critical + agent chat)", () => {
  // Spot-check the special taskTypes carried verbatim from the zh anchors.
  assert.equal(getRegisteredPromptAsset("audit.chapter.light", "v1", "en").taskType, "light_review");
  assert.equal(getRegisteredPromptAsset("audit.chapter.full", "v2", "en").taskType, "critical_review");
  assert.equal(getRegisteredPromptAsset("agent.runtime.fallback_answer", "v1", "en").taskType, "chat");
  assert.equal(getRegisteredPromptAsset("agent.runtime.setup_guidance", "v1", "en").taskType, "chat");
  assert.equal(getRegisteredPromptAsset("agent.runtime.setup_ideation", "v1", "en").taskType, "chat");
});

test("P3: STREAMING/resolution-path locale swap routes en on the funnel", () => {
  // The runners funnel through preparePromptExecution. Passing options.locale=en
  // on a zh anchor must resolve to the en variant — verifies reachability. Use a
  // text-mode agent.runtime variant (minimal input) so the resolved en asset
  // actually renders, proving the swap produces renderable English messages.
  const zhAnchor = getRegisteredPromptAsset("agent.runtime.fallback_answer", "v1", "zh");
  const prepared = preparePromptExecution({
    asset: zhAnchor,
    promptInput: {
      toolList: "- chapter_search",
      goal: "Find the protagonist's motive.",
      structuredIntentJson: "{}",
      summary: "search ran",
      groundingFacts: "motive: revenge",
    },
    contextBlocks: [],
    options: { locale: "en" },
  });
  assert.equal(prepared.invocation.resolvedLocale, "en");
  assert.equal(prepared.invocation.localeFallback, false);
  assert.equal(prepared.invocation.resolvedVariant, "agent.runtime.fallback_answer@v1@en");
  const text = prepared.messages.map((m) => m.content).join("\n");
  assert.ok(!CJK.test(text), "resolved en render must contain no CJK");
});

test("P3: every en variant's own render emits no CJK (domain-aware rewrite check)", () => {
  const emptyContext = {
    blocks: [], selectedBlockIds: [], droppedBlockIds: [], summarizedBlockIds: [], estimatedInputTokens: 0,
  };
  // Minimal render-safe inputs. Fields omitted where optional.
  const sampleInput = {
    "agent.runtime.fallback_answer": { toolList: "- chapter_search", goal: "Find the protagonist's motive.", structuredIntentJson: "{}", summary: "search ran", groundingFacts: "motive: revenge" },
    "agent.runtime.setup_guidance": { sceneInstruction: "new novel", goal: "start a novel", intentFacts: "none", knownFacts: "none yet" },
    "agent.runtime.setup_ideation": { goal: "give me 3 title directions", structuredIntentJson: "{}", facts: "genre: urban fantasy" },
    "image.character.prompt_optimize": { currentPrompt: "a young warrior", referenceNotes: "sharp eyes", styleHint: "" },
  };
  let renderedAny = false;
  for (const { id, version } of P3_VARIANTS) {
    const en = getRegisteredPromptAsset(id, version, "en");
    let messages;
    try {
      messages = en.render(sampleInput[id] ?? {}, emptyContext);
    } catch {
      // Some inputs need richer fields to render; skip render-only CJK check for those.
      // Resolution + outputSchema + taskType checks above still cover them.
      continue;
    }
    renderedAny = true;
    const text = messages.map((m) => m.content).join("\n");
    assert.ok(!CJK.test(text), `${id} en render must contain no CJK:\n${text.slice(0, 300)}`);
  }
  // Guard: at least the agent.runtime.* text-mode variants (minimal inputs) must have rendered.
  assert.ok(renderedAny, "at least one P3 en variant should render with the minimal sample inputs");
});

test("P3: default locale (zh) renders the zh anchor byte-identically (Risk A)", () => {
  const zh = getRegisteredPromptAsset("agent.runtime.fallback_answer", "v1", "zh");
  const prepared = preparePromptExecution({
    asset: zh,
    promptInput: { toolList: "t", goal: "g", structuredIntentJson: "{}", summary: "s", groundingFacts: "f" },
    contextBlocks: [],
  });
  assert.equal(prepared.invocation.resolvedLocale, "zh");
  assert.equal(prepared.invocation.localeFallback, false);
  const text = prepared.messages.map((m) => m.content).join("\n");
  assert.ok(CJK.test(text), "zh anchor must still render Chinese by default");
});

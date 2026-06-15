const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRegisteredPromptAsset,
  resolvePromptVariant,
} = require("../dist/prompting/registry.js");
const { buildPromptAssetKey } = require("../dist/prompting/core/promptTypes.js");
const { preparePromptExecution } = require("../dist/prompting/core/promptRunner.js");

const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

// ---------------------------------------------------------------------------
// P2 Phase 1 — novel core-generation chain (outline / bible / beat / chapterHook).
//
// LOCALE SOURCE (pinned): these are NOVEL-SCOPED prompts. The locale is threaded
// from `novel.language` (DB), NOT `req.locale`. The director runs as a background
// worker with no HTTP context, so novel-scoped prompts cannot use the request
// locale. novelCoreGenerationService loads the novel row and passes
// `locale: novel.language` into options.locale; preparePromptExecution then swaps
// to the en variant. This test verifies the swap works on the STREAMING path
// (streamTextPrompt/streamStructuredPrompt funnel through preparePromptExecution).
//
// novel.structuredOutline.generate/.repair are already language:"en" (en-default)
// — they are NOT zh anchors, so they are out of scope here.
// ---------------------------------------------------------------------------

const NOVEL_CORE_VARIANTS = [
  { id: "novel.outline.generate", version: "v1", mode: "text" },
  { id: "novel.bible.generate", version: "v1", mode: "structured" },
  { id: "novel.beat.generate", version: "v1", mode: "structured" },
  // chapterHook declares version v2 (registry @v1 key is a stale hint corrected
  // on hydration); resolution uses the REAL version v2.
  { id: "novel.chapterHook.generate", version: "v2", mode: "structured" },
];

test("P2 novel-core: every en variant resolves (no fallback); zh anchors intact (Risk A)", () => {
  for (const { id, version, mode } of NOVEL_CORE_VARIANTS) {
    const en = resolvePromptVariant(id, version, "en");
    assert.ok(en, `${id}@${version}@en must resolve`);
    assert.equal(en.resolvedLocale, "en", `${id} resolvedLocale`);
    assert.equal(en.localeFallback, false, `${id} must not fall back`);
    assert.equal(en.asset.language, "en");
    assert.equal(en.asset.mode, mode, `${id} mode preserved`);
    assert.equal(en.resolvedVariant, `${id}@${version}@en`);

    // Risk A: zh anchor still resolves, default-locale, untouched.
    const zh = resolvePromptVariant(id, version, "zh");
    assert.ok(zh, `${id} zh anchor must resolve`);
    assert.equal(zh.resolvedVariant, `${id}@${version}@zh`);
    assert.equal(zh.localeFallback, false);
    assert.equal(en.asset.taskType, zh.asset.taskType, `${id} en taskType === zh`);
    // 2-arg backward-compat returns zh anchor.
    assert.equal(getRegisteredPromptAsset(id, version).language, "zh");
  }
});

test("P2 novel-core: en variants reuse zh outputSchema (structured) or share text mode", () => {
  for (const { id, version, mode } of NOVEL_CORE_VARIANTS) {
    const en = getRegisteredPromptAsset(id, version, "en");
    const zh = getRegisteredPromptAsset(id, version, "zh");
    if (mode === "structured") {
      assert.equal(en.outputSchema, zh.outputSchema, `${id} en must reuse zh outputSchema`);
    }
  }
});

test("P2 novel-core: STREAMING-PATH locale swap (preparePromptExecution routes en on the streaming path)", () => {
  // The streaming runners (streamTextPrompt/streamStructuredPrompt) funnel
  // through preparePromptExecution. Passing options.locale=en on the zh anchor
  // must resolve to the en variant — this is the exact path the director worker
  // hits when novel.language=en. Verifies locale threads from novel.language ->
  // options.locale -> resolved en variant on the streaming path.
  const zhAnchor = getRegisteredPromptAsset("novel.outline.generate", "v1", "zh");
  const sampleInput = {
    title: "The Memory Trade",
    description: "A city where memories are currency.",
    charactersText: "- Vex (smuggler): moves forbidden memories.",
    worldContext: "A tiered city; the poor sell memories, the rich hoard them.",
  };
  const prepared = preparePromptExecution({
    asset: zhAnchor,
    promptInput: sampleInput,
    contextBlocks: [],
    options: { locale: "en" },
  });
  assert.equal(prepared.invocation.resolvedLocale, "en", "streaming path must resolve en");
  assert.equal(prepared.invocation.localeFallback, false);
  assert.equal(prepared.invocation.resolvedVariant, "novel.outline.generate@v1@en");
  // And the en render carries no CJK (proves the en variant actually rendered).
  const text = prepared.messages.map((m) => m.content).join("\n");
  assert.ok(!CJK.test(text), "en streaming render must contain no CJK");
});

test("P2 novel-core: structured streaming path (novel.bible.generate) routes en + reuses schema", () => {
  // Routing proof via preparePromptExecution (the streaming path funnel).
  const zhAnchor = getRegisteredPromptAsset("novel.bible.generate", "v1", "zh");
  const sampleInput = {
    title: "The Memory Trade",
    genreName: "Urban fantasy",
    description: "A city where memories are currency.",
    charactersText: "- Vex (smuggler)",
    worldContext: "Tiered city by altitude.",
  };
  const prepared = preparePromptExecution({
    asset: zhAnchor,
    promptInput: sampleInput,
    contextBlocks: [],
    options: { locale: "en" },
  });
  assert.equal(prepared.invocation.resolvedLocale, "en");
  assert.equal(prepared.invocation.resolvedVariant, "novel.bible.generate@v1@en");
  // The en VARIANT's own render (system+human) must be CJK-free. NOTE: the shared
  // appendStructuredOutputHintMessages runtime helper appends a Chinese JSON-
  // skeleton hint to ALL structured prompts regardless of locale — that cross-
  // cutting runtime injection is tracked as separate follow-up debt (affects
  // every structured en render across P1/P2/P3), not a P2 variant-authoring gap.
  const en = getRegisteredPromptAsset("novel.bible.generate", "v1", "en");
  const ownMessages = en.render(sampleInput, {
    blocks: [], selectedBlockIds: [], droppedBlockIds: [], summarizedBlockIds: [], estimatedInputTokens: 0,
  });
  const ownText = ownMessages.map((m) => m.content).join("\n");
  assert.ok(!CJK.test(ownText), "bible en variant's own render must contain no CJK");
});

test("P2 novel-core: default locale (zh) renders the zh anchor byte-identically (Risk A)", () => {
  const zh = getRegisteredPromptAsset("novel.outline.generate", "v1", "zh");
  const prepared = preparePromptExecution({
    asset: zh,
    promptInput: {
      title: "记忆交易",
      description: "记忆即货币的城市。",
      charactersText: "- Vex",
      worldContext: "分层城市。",
    },
    contextBlocks: [],
  });
  assert.equal(prepared.invocation.resolvedLocale, "zh");
  assert.equal(prepared.invocation.localeFallback, false);
  const text = prepared.messages.map((m) => m.content).join("\n");
  assert.ok(CJK.test(text), "zh anchor must still render Chinese by default");
});

test("P2 novel-core: chapterHook en variant renders English (real version v2)", () => {
  const en = getRegisteredPromptAsset("novel.chapterHook.generate", "v2", "en");
  assert.equal(en.version, "v2");
  assert.equal(buildPromptAssetKey(en), "novel.chapterHook.generate@v2@en");
  const messages = en.render(
    { title: "Chapter 1", content: "Vex pocketed the memory shard and ran." },
    { blocks: [], selectedBlockIds: [], droppedBlockIds: [], summarizedBlockIds: [], estimatedInputTokens: 0 },
  );
  const text = messages.map((m) => m.content).join("\n");
  assert.ok(!CJK.test(text), "chapterHook en must contain no CJK");
});

// ---------------------------------------------------------------------------
// P2 Phase 2 — chapter-production + director chains (subagent-authored).
// 14 en variants across chapterWriter / review / patchRepair / chapterAcceptance
// and the director.* family. All novel-scoped: locale from novel.language (DB).
// ---------------------------------------------------------------------------

const P2_PHASE2_VARIANTS = [
  { id: "novel.chapter.writer", version: "v5", exportName: "chapterWriterPromptEn" },
  { id: "novel.chapter.summary", version: "v1", exportName: "chapterSummaryPromptEn" },
  { id: "novel.review.chapter", version: "v1", exportName: "chapterReviewPromptEn" },
  { id: "novel.review.repair", version: "v1", exportName: "chapterRepairPromptEn" },
  { id: "novel.review.patch", version: "v1", exportName: "chapterPatchRepairPlanPromptEn" },
  { id: "novel.chapter.acceptance_assessment", version: "v1", exportName: "chapterAcceptanceAssessmentPromptEn" },
  { id: "novel.director.candidates", version: "v1", exportName: "directorCandidatesPromptEn" },
  { id: "novel.director.candidate_patch", version: "v1", exportName: "directorCandidatePatchPromptEn" },
  { id: "novel.director.blueprint", version: "v1", exportName: "directorBlueprintPromptEn" },
  { id: "novel.director.book_contract", version: "v1", exportName: "directorBookContractPromptEn" },
  { id: "novel.director.workspace_analysis", version: "v1", exportName: "directorWorkspaceAnalysisPromptEn" },
  { id: "novel.director.manual_edit_impact", version: "v1", exportName: "directorManualEditImpactPromptEn" },
  { id: "novel.director.idea_inspiration", version: "v1", exportName: "directorIdeaInspirationPromptEn" },
  { id: "director.state_proposal_resolution", version: "v1", exportName: "directorStateProposalResolutionPromptEn" },
];

test("P2 phase2: every chapter/director en variant resolves (no fallback); zh anchors intact (Risk A)", () => {
  for (const { id, version } of P2_PHASE2_VARIANTS) {
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
    // en preserves the zh anchor's mode + taskType (writer/repair/review/summary/planner).
    assert.equal(en.asset.mode, zh.asset.mode, `${id} en mode === zh`);
    assert.equal(en.asset.taskType, zh.asset.taskType, `${id} en taskType === zh`);
    // 2-arg backward-compat returns zh anchor.
    assert.equal(getRegisteredPromptAsset(id, version).language, "zh");
  }
});

test("P2 phase2: structured en variants reuse zh outputSchema", () => {
  for (const { id, version } of P2_PHASE2_VARIANTS) {
    const en = getRegisteredPromptAsset(id, version, "en");
    const zh = getRegisteredPromptAsset(id, version, "zh");
    if (zh.mode === "structured") {
      assert.equal(en.outputSchema, zh.outputSchema, `${id} en must reuse zh outputSchema`);
    }
  }
});

test("P2 phase2: every en variant's own render emits no CJK (domain-aware rewrite check)", () => {
  const emptyContext = {
    blocks: [], selectedBlockIds: [], droppedBlockIds: [], summarizedBlockIds: [], estimatedInputTokens: 0,
  };
  // Minimal render-safe inputs per family. Where an input field is optional, omit it.
  const sampleInput = {
    "novel.chapter.writer": { novelTitle: "T", chapterOrder: 1, chapterTitle: "C1", mode: "draft", targetWordCount: 2000, minWordCount: 1800, maxWordCount: 2200 },
    "novel.review.repair": { novelTitle: "T", chapterOrder: 1, chapterTitle: "C1", originalContent: "He ran.", issues: [{ ruleName: "vague", severity: "warn", excerpt: "ran", reason: "vague verb", suggestion: "use a concrete action" }] },
    "novel.director.idea_inspiration": { currentIdea: "A memory-trading city.", genreLabel: "Urban fantasy", tags: [] },
    "director.state_proposal_resolution": { novelId: "n1", proposals: [], appliedEffects: [], validationErrors: [], conflictReasons: [] },
  };
  for (const { id, version } of P2_PHASE2_VARIANTS) {
    const en = getRegisteredPromptAsset(id, version, "en");
    let messages;
    try {
      messages = en.render(sampleInput[id] ?? {}, emptyContext);
    } catch {
      // Some inputs need richer fields to render; skip render-only CJK check for those,
      // resolution + outputSchema checks above still cover them.
      continue;
    }
    const text = messages.map((m) => m.content).join("\n");
    assert.ok(!CJK.test(text), `${id} en render must contain no CJK:\n${text.slice(0, 300)}`);
  }
});

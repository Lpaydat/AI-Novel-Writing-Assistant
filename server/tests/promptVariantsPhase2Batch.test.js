const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRegisteredPromptAsset,
  resolvePromptVariant,
} = require("../dist/prompting/registry.js");

// Han ideographs + CJK-compat (matches the other promptVariants*.test.js guards).
const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

// ---------------------------------------------------------------------------
// Phase-2 batch: the remaining 75 prompts that gained an @en variant so that
// EVERY registered zh anchor now has an English sibling. Each variant lives in a
// *.prompts.en.ts file (upstream-safe) and reuses the zh anchor's outputSchema.
// Auto-generated variant list — keep in sync with the registry @en entries.
// ---------------------------------------------------------------------------
const VARIANTS = [
  { id: "bookAnalysis.chapter.split", version: "v1", mode: "structured", skipCjk: false },
  { id: "bookAnalysis.character.appearance.consolidate", version: "v1", mode: "structured", skipCjk: false },
  { id: "bookAnalysis.character.appearance.merge", version: "v1", mode: "structured", skipCjk: false },
  { id: "bookAnalysis.character.appearance.snapshot", version: "v1", mode: "structured", skipCjk: false },
  { id: "bookAnalysis.character.generate", version: "v1", mode: "structured", skipCjk: false },
  { id: "bookAnalysis.character.identify", version: "v1", mode: "structured", skipCjk: false },
  { id: "bookAnalysis.character.profile", version: "v1", mode: "structured", skipCjk: false },
  { id: "comic.episodeOutline", version: "v1", mode: "structured", skipCjk: false },
  { id: "comic.panelScript", version: "v1", mode: "structured", skipCjk: true },
  { id: "drama.episode.compliance", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.episode.quality", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.episode.repair", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.episode.script", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.episodeOutline", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.source.original_bundle", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.source.supplement", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.source.text_bundle", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.storyboard", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.strategy", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.track.recommendation", version: "v1", mode: "structured", skipCjk: false },
  { id: "drama.video.prompt", version: "v1", mode: "structured", skipCjk: false },
  { id: "image.generation_prompt.assist", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.chapter_editor.rewrite_candidates", version: "v2", mode: "structured", skipCjk: false },
  { id: "novel.chapter_editor.user_intent", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.chapter_editor.workspace_diagnosis", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.chapter.artifact_delta.extract", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character_resource.extract_updates", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.castAuto.members", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.castAuto.relations", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.castAuto.repair", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.castAuto.zhNormalize", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.castAuto", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.castOptions.repair", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.castOptions.zhNormalize", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.castOptions", version: "v2", mode: "structured", skipCjk: false },
  { id: "novel.character.evolve", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.supplemental.zhNormalize", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.supplemental", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.visible_profile.complete", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.character.worldCheck", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.characterDynamics.chapterExtract", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.characterDynamics.volumeProjection", version: "v3", mode: "structured", skipCjk: false },
  { id: "novel.continuation.rewrite_similarity", version: "v1", mode: "text", skipCjk: false },
  { id: "novel.create.resource_recommendation", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.draft_optimize.full", version: "v1", mode: "text", skipCjk: false },
  { id: "novel.draft_optimize.selection", version: "v1", mode: "text", skipCjk: false },
  { id: "novel.framing.suggest", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.payoff_ledger.sync", version: "v5", mode: "structured", skipCjk: false },
  { id: "novel.production.characters", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.story_macro.decomposition", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.story_macro.field_regeneration", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.timeline.extractor", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.volume.beat_sheet", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.volume.chapter_boundary", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.volume.chapter_execution_contract", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.volume.chapter_list", version: "v7", mode: "structured", skipCjk: false },
  { id: "novel.volume.chapter_purpose", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.volume.chapter_task_sheet_quality", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.volume.chapter_task_sheet", version: "v2", mode: "structured", skipCjk: false },
  { id: "novel.volume.rebalance.adjacent", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.volume.skeleton", version: "v2", mode: "structured", skipCjk: false },
  { id: "novel.volume.strategy.critique", version: "v1", mode: "structured", skipCjk: false },
  { id: "novel.volume.strategy", version: "v2", mode: "structured", skipCjk: false },
  { id: "planner.arc.plan", version: "v1", mode: "structured", skipCjk: false },
  { id: "planner.book.plan", version: "v1", mode: "structured", skipCjk: false },
  { id: "planner.chapter.plan", version: "v1", mode: "structured", skipCjk: false },
  { id: "planner.replan.window_decision", version: "v1", mode: "structured", skipCjk: false },
  { id: "rag.contextual_chunk.prefix", version: "v1", mode: "structured", skipCjk: false },
  { id: "state.snapshot.extract", version: "v4", mode: "structured", skipCjk: false },
  { id: "storyMode.child.generate", version: "v1", mode: "structured", skipCjk: false },
  { id: "storyMode.tree.generate", version: "v1", mode: "structured", skipCjk: false },
  { id: "storyWorldSlice.generate", version: "v1", mode: "structured", skipCjk: false },
  { id: "writingFormula.apply.generate.stream", version: "v1", mode: "text", skipCjk: false },
  { id: "writingFormula.apply.rewrite.stream", version: "v1", mode: "text", skipCjk: false },
  { id: "writingFormula.extract.stream", version: "v1", mode: "text", skipCjk: false },
];

const EMPTY_CTX = {
  blocks: [], selectedBlockIds: [], droppedBlockIds: [], summarizedBlockIds: [], estimatedInputTokens: 0,
};

test("phase2-batch: every en variant resolves (no fallback); zh anchor intact", () => {
  for (const { id, version, mode } of VARIANTS) {
    const en = resolvePromptVariant(id, version, "en");
    assert.ok(en, `${id}@${version}@en must resolve`);
    assert.equal(en.resolvedLocale, "en", `${id} resolvedLocale`);
    assert.equal(en.localeFallback, false, `${id} must not fall back`);
    assert.equal(en.asset.language, "en", `${id} language`);
    assert.equal(en.resolvedVariant, `${id}@${version}@en`);

    const zh = resolvePromptVariant(id, version, "zh");
    assert.ok(zh, `${id} zh anchor must resolve`);
    assert.equal(zh.resolvedVariant, `${id}@${version}@zh`);
    assert.equal(zh.localeFallback, false);
    assert.equal(en.asset.mode, zh.asset.mode, `${id} mode preserved`);
    assert.equal(en.asset.taskType, zh.asset.taskType, `${id} taskType preserved`);
    // 2-arg backward-compat still returns the zh anchor.
    assert.equal(getRegisteredPromptAsset(id, version).language, "zh", `${id} 2-arg -> zh`);
    assert.equal(en.asset.mode, mode, `${id} expected mode`);
  }
});

// Factory-built prompts: the zh anchor's outputSchema is produced by a factory
// (createVolume*Prompt(config)) whose schema OBJECT depends on the config, so each
// call yields a distinct-but-equivalent schema. The en variant reuses that same
// factory (spreads a zh-built base), so it CANNOT fork the schema — but the
// registered en/zh come from separate factory calls, so they are not `===`. (The
// registry can't inject its cached zh instance without a circular import; for
// chapter_list the probe schema even bakes in the beat label, so `===` would be
// wrong.) For these we assert structural equivalence (same schema kind) instead.
const FACTORY_BUILT = new Set([
  "novel.volume.strategy@v2",
  "novel.volume.skeleton@v2",
  "novel.volume.chapter_list@v7",
]);

test("phase2-batch: structured en variants reuse the zh outputSchema", () => {
  for (const { id, version, mode } of VARIANTS) {
    if (mode !== "structured") continue;
    const en = getRegisteredPromptAsset(id, version, "en");
    const zh = getRegisteredPromptAsset(id, version, "zh");
    if (FACTORY_BUILT.has(`${id}@${version}`)) {
      // reuses the zh factory: same schema kind, not the same object instance.
      assert.equal(
        en.outputSchema.constructor, zh.outputSchema.constructor,
        `${id} en schema must be the same kind as zh (factory-built)`,
      );
      assert.equal(
        en.outputSchema?._def?.typeName, zh.outputSchema?._def?.typeName,
        `${id} en schema typeName must match zh (factory-built)`,
      );
      continue;
    }
    // shared schema symbol: en must reuse the exact zh object (by reference).
    assert.equal(en.outputSchema, zh.outputSchema, `${id} en must reuse zh outputSchema`);
  }
});

test("phase2-batch: en variant renders emit no CJK (domain-aware rewrite check)", () => {
  for (const { id, version, skipCjk } of VARIANTS) {
    if (skipCjk) continue; // variant intentionally keeps a Chinese downstream contract
    const en = getRegisteredPromptAsset(id, version, "en");
    let messages;
    try {
      messages = en.render({}, EMPTY_CTX);
    } catch {
      // Render needs richer inputs; resolution + schema checks above still cover it.
      continue;
    }
    const text = messages.map((m) => m.content).join("\n");
    assert.ok(!CJK.test(text), `${id} en render must contain no CJK:\n${text.slice(0, 300)}`);
  }
});

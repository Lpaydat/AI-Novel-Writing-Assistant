const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRegisteredPromptAsset,
  hasRegisteredPromptAsset,
  resolvePromptVariant,
} = require("../dist/prompting/registry.js");
const { buildPromptAssetKey } = require("../dist/prompting/core/promptTypes.js");
const { preparePromptExecution } = require("../dist/prompting/core/promptRunner.js");

// Pick a real registered zh prompt as the anchor for these tests. We prefer a
// zh anchor that has NO en variant registered, so the en-with-fallback tests
// below remain valid as the registry grows (more zh anchors get en siblings
// over time). Falls back to any zh anchor if every zh anchor has an en variant.
function firstRegisteredZhAsset() {
  const { listRegisteredPromptAssets, hasRegisteredPromptAsset } = require("../dist/prompting/registry.js");
  const zh = listRegisteredPromptAssets().filter((a) => a.language === "zh");
  assert.ok(zh.length > 0, "registry must have at least one zh prompt registered");
  return (
    zh.find((a) => !hasRegisteredPromptAsset(a.id, a.version, "en")) ?? zh[0]
  );
}

/** A zh asset whose render({}) does not throw, for the preparePromptExecution
 *  locale tests. Prefers a zh anchor with NO en variant (so the zh-fallback
 *  assertion holds). At full en coverage none exists, so it falls back to a zh
 *  anchor whose en sibling ALSO renders safely (so the en-routing branch can
 *  render without throwing). */
function firstRenderSafeZhAsset() {
  const { listRegisteredPromptAssets, hasRegisteredPromptAsset, getRegisteredPromptAsset } = require("../dist/prompting/registry.js");
  const zh = listRegisteredPromptAssets().filter((a) => a.language === "zh");
  const emptyContext = {
    blocks: [],
    selectedBlockIds: [],
    droppedBlockIds: [],
    summarizedBlockIds: [],
    estimatedInputTokens: 0,
  };
  const renderSafe = (asset) => {
    try { asset.render({}, emptyContext); return true; } catch { return false; }
  };
  const safe =
    // Best: render-safe AND no en variant → exercises the zh-fallback path.
    zh.find((a) => renderSafe(a) && !hasRegisteredPromptAsset(a.id, a.version, "en"))
    // Full-coverage: render-safe zh whose en sibling is also render-safe → en path.
    ?? zh.find((a) => renderSafe(a) && hasRegisteredPromptAsset(a.id, a.version, "en") && renderSafe(getRegisteredPromptAsset(a.id, a.version, "en")))
    ?? zh.find(renderSafe);
  assert.ok(safe, "need at least one render-safe zh asset for preparePromptExecution tests");
  return safe;
}

test("F2 risk-A: registry key is now id@version@language", () => {
  const asset = firstRegisteredZhAsset();
  const key = buildPromptAssetKey(asset);
  assert.equal(key, `${asset.id}@${asset.version}@zh`, `expected 3-part key, got ${key}`);
});

test("F2 risk-A: getRegisteredPromptAsset(id, version) still returns the zh anchor (backward compat)", () => {
  const asset = firstRegisteredZhAsset();
  // 2-arg call (existing callers, e.g. PromptWorkbench) must keep working and
  // return the zh anchor — byte-identical to pre-change behavior.
  const resolved = getRegisteredPromptAsset(asset.id, asset.version);
  assert.ok(resolved, "zh anchor must resolve via 2-arg call");
  assert.equal(resolved.language, "zh");
  assert.equal(resolved.id, asset.id);
  assert.equal(resolved.version, asset.version);
  assert.equal(hasRegisteredPromptAsset(asset.id, asset.version), true);
});

test("F2 risk-A: resolvePromptVariant(zh) returns the zh anchor, no fallback", () => {
  const asset = firstRegisteredZhAsset();
  const resolved = resolvePromptVariant(asset.id, asset.version, "zh");
  assert.ok(resolved, "zh resolution must succeed");
  assert.equal(resolved.resolvedLocale, "zh");
  assert.equal(resolved.localeFallback, false);
  assert.equal(resolved.asset.language, "zh");
  assert.equal(resolved.resolvedVariant, `${asset.id}@${asset.version}@zh`);
});

test("F2 fallback: resolvePromptVariant(en) resolves the en variant, or falls back to zh + warns when a zh anchor still lacks one", () => {
  const asset = firstRegisteredZhAsset();
  const hasEn = hasRegisteredPromptAsset(asset.id, asset.version, "en");
  // Capture console.warn to assert the fallback is diagnosable (round-3 SHOULD-FIX).
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => void warnings.push(args.join(" "));
  let resolved;
  try {
    resolved = resolvePromptVariant(asset.id, asset.version, "en");
  } finally {
    console.warn = originalWarn;
  }
  assert.ok(resolved, "en must resolve (en variant or zh fallback)");
  if (hasEn) {
    // Full en-coverage regime: this zh anchor has an en sibling, so en resolves
    // with no fallback. The zh-fallback branch below still fires whenever an
    // upstream sync introduces a new zh-only prompt (its en sibling not yet added).
    assert.equal(resolved.resolvedLocale, "en", "resolved the en variant");
    assert.equal(resolved.localeFallback, false, "no fallback when en variant exists");
    assert.equal(resolved.asset.language, "en");
    assert.equal(resolved.resolvedVariant, `${asset.id}@${asset.version}@en`);
  } else {
    assert.equal(resolved.resolvedLocale, "zh", "fell back to zh");
    assert.equal(resolved.localeFallback, true, "fallback flag set");
    assert.equal(resolved.asset.language, "zh");
    assert.ok(
      warnings.some((w) => /no en variant/.test(w) && new RegExp(asset.id).test(w)),
      `expected a no-en-variant warning mentioning ${asset.id}, got: ${JSON.stringify(warnings)}`,
    );
  }
});

test("F2 risk-A: preparePromptExecution with no locale renders the zh anchor byte-identically", () => {
  const asset = firstRenderSafeZhAsset();
  // No options.locale ⇒ anchor renders unchanged (the Risk-A guard: Chinese
  // generation must be byte-identical to pre-epic). The resolved asset equals
  // the anchor, and resolvedLocale is the anchor's language (zh).
  const prepared = preparePromptExecution({ asset, promptInput: {}, contextBlocks: [] });
  assert.equal(prepared.invocation.resolvedLocale, "zh");
  assert.equal(prepared.invocation.localeFallback, false);
  assert.equal(
    prepared.invocation.resolvedVariant,
    `${asset.id}@${asset.version}@zh`,
  );
  // Rendered messages come from the anchor asset's render — same as before.
  assert.ok(Array.isArray(prepared.messages));
});

test("F2 risk-A: preparePromptExecution(locale=en) routes to the en variant, or falls back to zh when a zh anchor still lacks one (streaming path covered too)", () => {
  const asset = firstRenderSafeZhAsset();
  const hasEn = hasRegisteredPromptAsset(asset.id, asset.version, "en");
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => void warnings.push(args.join(" "));
  let prepared;
  try {
    prepared = preparePromptExecution({
      asset,
      promptInput: {},
      contextBlocks: [],
      options: { locale: "en" },
    });
  } finally {
    console.warn = originalWarn;
  }
  assert.ok(Array.isArray(prepared.messages), "still produces renderable messages");
  if (hasEn) {
    // Full-coverage: locale=en routes to the registered en variant, no fallback.
    assert.equal(prepared.invocation.resolvedLocale, "en");
    assert.equal(prepared.invocation.localeFallback, false);
  } else {
    // A zh-only prompt (e.g. freshly synced from upstream) ⇒ zh fallback, diagnosable.
    assert.equal(prepared.invocation.resolvedLocale, "zh");
    assert.equal(prepared.invocation.localeFallback, true);
  }
});

test("F2: resolvePromptVariant returns null for an unregistered id", () => {
  assert.equal(resolvePromptVariant("does.not.exist", "v1", "zh"), null);
  assert.equal(resolvePromptVariant("does.not.exist", "v1", "en"), null);
});

test("F2: resolvePromptVariant(en) returns the en genre variant when registered", () => {
  // genre.tree.generate@v1@en is the one English variant F2 ships. locale=en
  // must resolve to it (resolvedLocale=en, no fallback).
  const resolved = resolvePromptVariant("genre.tree.generate", "v1", "en");
  assert.ok(resolved, "genre en variant must resolve");
  assert.equal(resolved.resolvedLocale, "en");
  assert.equal(resolved.localeFallback, false);
  assert.equal(resolved.asset.language, "en");
  assert.equal(resolved.resolvedVariant, "genre.tree.generate@v1@en");

  // The en variant reuses the zh outputSchema (same JSON shape).
  const zhResolved = resolvePromptVariant("genre.tree.generate", "v1", "zh");
  assert.ok(zhResolved, "genre zh anchor must resolve");
  assert.equal(zhResolved.resolvedLocale, "zh");
  assert.equal(resolved.asset.outputSchema, zhResolved.asset.outputSchema, "en reuses zh outputSchema");
});

test("F2: Accept-Language middleware normalizes header -> req.locale", () => {
  const { normalizeLocale, DEFAULT_LOCALE } = require("../dist/middleware/locale.js");
  // Mirrors the client resolver + the F1<->F2 pinned contract.
  assert.equal(normalizeLocale("zh"), "zh");
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale("  EN "), "en", "trim + lowercase");
  assert.equal(normalizeLocale(null), DEFAULT_LOCALE, "missing -> zh");
  assert.equal(normalizeLocale(""), DEFAULT_LOCALE, "empty -> zh");
  assert.equal(normalizeLocale("fr"), DEFAULT_LOCALE, "unknown -> zh");
  assert.equal(normalizeLocale("en-US"), DEFAULT_LOCALE, "non-bare-token -> zh");
});

test("F2: getRequestLocale defaults to zh outside a request context", () => {
  const { getRequestLocale, DEFAULT_LOCALE } = require("../dist/middleware/locale.js");
  // Background workers (e.g. director) have no HTTP context -> must default
  // to zh, never crash. (Novel-scoped prompts use novel.language, not this.)
  assert.equal(getRequestLocale(), DEFAULT_LOCALE);
});

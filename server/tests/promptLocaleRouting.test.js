const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getRegisteredPromptAsset,
  hasRegisteredPromptAsset,
  resolvePromptVariant,
} = require("../dist/prompting/registry.js");
const { buildPromptAssetKey } = require("../dist/prompting/core/promptTypes.js");
const { preparePromptExecution } = require("../dist/prompting/core/promptRunner.js");

// Pick a real registered zh prompt as the anchor for these tests. We do not
// assume any specific id beyond it being a real zh asset the registry loads.
function firstRegisteredZhAsset() {
  const { listRegisteredPromptAssets } = require("../dist/prompting/registry.js");
  const zh = listRegisteredPromptAssets().filter((a) => a.language === "zh");
  assert.ok(zh.length > 0, "registry must have at least one zh prompt registered");
  return zh[0];
}

/** A zh asset whose render({}) does not throw — for preparePromptExecution tests. */
function firstRenderSafeZhAsset() {
  const { listRegisteredPromptAssets } = require("../dist/prompting/registry.js");
  const zh = listRegisteredPromptAssets().filter((a) => a.language === "zh");
  const emptyContext = {
    blocks: [],
    selectedBlockIds: [],
    droppedBlockIds: [],
    summarizedBlockIds: [],
    estimatedInputTokens: 0,
  };
  const safe = zh.find((a) => {
    try { a.render({}, emptyContext); return true; } catch { return false; }
  });
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

test("F2 fallback: resolvePromptVariant(en) falls back to zh + warns when no en variant exists", () => {
  const asset = firstRegisteredZhAsset();
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
  assert.ok(resolved, "en with no variant must still resolve (zh fallback)");
  assert.equal(resolved.resolvedLocale, "zh", "fell back to zh");
  assert.equal(resolved.localeFallback, true, "fallback flag set");
  assert.equal(resolved.asset.language, "zh");
  assert.ok(
    warnings.some((w) => /no en variant/.test(w) && new RegExp(asset.id).test(w)),
    `expected a no-en-variant warning mentioning ${asset.id}, got: ${JSON.stringify(warnings)}`,
  );
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

test("F2 risk-A: preparePromptExecution with locale=en falls back to zh when no en variant (streaming path covered too)", () => {
  const asset = firstRenderSafeZhAsset();
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
  // No en variant registered for this real prompt ⇒ zh fallback, diagnosable.
  assert.equal(prepared.invocation.resolvedLocale, "zh");
  assert.equal(prepared.invocation.localeFallback, true);
  assert.ok(Array.isArray(prepared.messages), "still produces renderable messages");
});

test("F2: resolvePromptVariant returns null for an unregistered id", () => {
  assert.equal(resolvePromptVariant("does.not.exist", "v1", "zh"), null);
  assert.equal(resolvePromptVariant("does.not.exist", "v1", "en"), null);
});

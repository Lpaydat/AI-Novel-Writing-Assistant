const test = require("node:test");
const assert = require("node:assert/strict");

const {
  NOVEL_EXPORT_SCOPE_LABELS,
  getNovelExportScopeLabel,
  NOVEL_EXPORT_SCOPE_VALUES,
} = require("../../shared/dist/types/novelExport.js");
const {
  BOOK_ANALYSIS_STRUCTURED_FIELD_LABELS,
  getBookAnalysisStructuredFieldLabel,
} = require("../../shared/dist/types/bookAnalysis.js");
const {
  buildStyleExtractionPreset,
  buildStyleExtractionPresets,
} = require("../../shared/dist/types/styleEngine.js");

// Risk A: the pre-i18n zh values, snapshotted verbatim. The test never re-types
// a Chinese literal — it asserts the default-locale (zh) view reproduces them.
const EXPORT_ZH_GOLDEN = {
  full: "整本书",
  basic: "项目设定",
  story_macro: "故事宏观规划",
  character: "角色准备",
  outline: "卷战略 / 卷骨架",
  structured: "节奏 / 拆章",
  chapter: "章节执行",
  pipeline: "质量修复",
};

test("S1 risk-A: NOVEL_EXPORT_SCOPE_LABELS default (zh) view is byte-identical to pre-i18n", () => {
  for (const scope of NOVEL_EXPORT_SCOPE_VALUES) {
    assert.equal(
      NOVEL_EXPORT_SCOPE_LABELS[scope],
      EXPORT_ZH_GOLDEN[scope],
      `zh drift at scope ${scope}`,
    );
  }
});

test("S1: getNovelExportScopeLabel defaults to zh and resolves en", () => {
  assert.equal(getNovelExportScopeLabel("full"), "整本书", "default locale is zh");
  // zh via resolver === the backward-compat zh alias (no re-typed literal).
  assert.equal(getNovelExportScopeLabel("full", "zh"), NOVEL_EXPORT_SCOPE_LABELS.full);
  assert.equal(getNovelExportScopeLabel("full", "en"), "Entire book");
  assert.equal(getNovelExportScopeLabel("pipeline", "en"), "Quality repair");
});

test("S1: BOOK_ANALYSIS_STRUCTURED_FIELD_LABELS default (zh) view + resolver", () => {
  // zh byte-identity: a sample of keys reproduce the pre-i18n values via the
  // default-locale alias.
  assert.equal(BOOK_ANALYSIS_STRUCTURED_FIELD_LABELS.oneLinePositioning, "一句话定位");
  assert.equal(BOOK_ANALYSIS_STRUCTURED_FIELD_LABELS.commercialRisks, "商业化风险");
  // Resolver: default zh, en returns English, unknown key falls back to the key.
  assert.equal(getBookAnalysisStructuredFieldLabel("mainlineSummary"), "主线梗概");
  assert.equal(getBookAnalysisStructuredFieldLabel("mainlineSummary", "en"), "Mainline summary");
  assert.equal(getBookAnalysisStructuredFieldLabel("does.not.exist", "en"), "does.not.exist");
});

test("S1: buildStyleExtractionPreset defaults to zh and resolves en", () => {
  const features = [];
  // zh (default) — byte-identical label/summary.
  const zhPreset = buildStyleExtractionPreset(features, "imitate");
  assert.equal(zhPreset.label, "高保真仿写");
  assert.equal(zhPreset.summary, "尽量保留高相似度特征，适合临摹、仿写和风格贴近试写。");
  // en
  const enPreset = buildStyleExtractionPreset(features, "transfer", "en");
  assert.equal(enPreset.label, "Style transfer");
  assert.ok(enPreset.summary.length > 0);
  // Plural helper threads locale.
  const enPresets = buildStyleExtractionPresets(features, "en");
  const labels = enPresets.map((p) => p.label).sort();
  assert.deepEqual(labels, ["Balanced retention", "High-fidelity imitation", "Style transfer"]);
});

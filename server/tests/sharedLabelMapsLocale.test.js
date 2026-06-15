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
  getBookAnalysisSectionDisplay,
  getBookAnalysisPresetDisplay,
  BOOK_ANALYSIS_SECTIONS,
  BOOK_ANALYSIS_PRESETS,
} = require("../../shared/dist/types/bookAnalysis.js");
const {
  buildStyleExtractionPreset,
  buildStyleExtractionPresets,
} = require("../../shared/dist/types/styleEngine.js");
const {
  DIRECTOR_AUTO_APPROVAL_GROUPS,
  DIRECTOR_AUTO_APPROVAL_POINTS,
  getDirectorAutoApprovalGroupDisplay,
  getDirectorAutoApprovalPointDisplay,
} = require("../../shared/dist/types/autoDirectorApproval.js");
const {
  DIRECTOR_CORRECTION_PRESETS,
  DIRECTOR_CANDIDATE_SETUP_STEPS,
  getDirectorCorrectionPresetDisplay,
  getDirectorCandidateSetupStepDisplay,
} = require("../../shared/dist/types/novelDirector.js");

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

// ---------------------------------------------------------------------------
// S1 Group B — Phase B1 (autoDirectorApproval + novelDirector)
// Convention: typed arrays kept structurally unchanged (zh display fields intact
// for backward compat). Parallel locale dictionaries keyed by stable id; the zh
// branch is DERIVED from the array (byte-identical by construction, no drift);
// the en branch carries new copy. Resolvers default to zh and fall back to zh.
// ---------------------------------------------------------------------------

test("S1 Group B: auto-approval groups — every id resolves zh (byte-identical to array) + en", () => {
  for (const group of DIRECTOR_AUTO_APPROVAL_GROUPS) {
    const zh = getDirectorAutoApprovalGroupDisplay(group.id);
    // Risk A: zh resolver output must equal the array's own embedded fields.
    assert.equal(zh.label, group.label, `group zh label drift at ${group.id}`);
    assert.equal(zh.description, group.description, `group zh description drift at ${group.id}`);
    // en branch present for every id.
    const en = getDirectorAutoApprovalGroupDisplay(group.id, "en");
    assert.ok(en.label && en.label.length > 0, `group en label missing at ${group.id}`);
    assert.ok(en.description && en.description.length > 0, `group en description missing at ${group.id}`);
    // default locale is zh
    assert.deepEqual(getDirectorAutoApprovalGroupDisplay(group.id), zh);
  }
  // en value sanity check
  assert.equal(
    getDirectorAutoApprovalGroupDisplay("repair_replan", "en").label,
    "Repair / replan",
  );
});

test("S1 Group B: auto-approval points — every code resolves zh (byte-identical to array) + en", () => {
  for (const point of DIRECTOR_AUTO_APPROVAL_POINTS) {
    const zh = getDirectorAutoApprovalPointDisplay(point.code);
    assert.equal(zh.label, point.label, `point zh label drift at ${point.code}`);
    assert.equal(zh.description, point.description, `point zh description drift at ${point.code}`);
    const en = getDirectorAutoApprovalPointDisplay(point.code, "en");
    assert.ok(en.label && en.label.length > 0, `point en label missing at ${point.code}`);
    assert.ok(en.description && en.description.length > 0, `point en description missing at ${point.code}`);
    assert.deepEqual(getDirectorAutoApprovalPointDisplay(point.code), zh);
  }
  assert.equal(
    getDirectorAutoApprovalPointDisplay("chapter_execution_continue", "en").label,
    "Continue after a chapter batch completes",
  );
});

test("S1 Group B: correction presets — every value resolves zh (byte-identical to array) + en", () => {
  for (const preset of DIRECTOR_CORRECTION_PRESETS) {
    const zh = getDirectorCorrectionPresetDisplay(preset.value);
    assert.equal(zh.label, preset.label, `preset zh label drift at ${preset.value}`);
    assert.equal(zh.description, preset.description, `preset zh description drift at ${preset.value}`);
    assert.equal(zh.promptHint, preset.promptHint, `preset zh promptHint drift at ${preset.value}`);
    const en = getDirectorCorrectionPresetDisplay(preset.value, "en");
    assert.ok(en.label && en.label.length > 0, `preset en label missing at ${preset.value}`);
    assert.ok(en.description && en.description.length > 0, `preset en description missing at ${preset.value}`);
    assert.ok(en.promptHint && en.promptHint.length > 0, `preset en promptHint missing at ${preset.value}`);
    assert.deepEqual(getDirectorCorrectionPresetDisplay(preset.value), zh);
  }
  assert.equal(getDirectorCorrectionPresetDisplay("more_hooky", "en").label, "More hooky");
});

test("S1 Group B: candidate setup steps — every key resolves zh (byte-identical to array) + en", () => {
  for (const step of DIRECTOR_CANDIDATE_SETUP_STEPS) {
    const zh = getDirectorCandidateSetupStepDisplay(step.key);
    assert.equal(zh.label, step.label, `step zh label drift at ${step.key}`);
    assert.equal(zh.description, step.description, `step zh description drift at ${step.key}`);
    const en = getDirectorCandidateSetupStepDisplay(step.key, "en");
    assert.ok(en.label && en.label.length > 0, `step en label missing at ${step.key}`);
    assert.ok(en.description && en.description.length > 0, `step en description missing at ${step.key}`);
    assert.deepEqual(getDirectorCandidateSetupStepDisplay(step.key), zh);
  }
  assert.equal(
    getDirectorCandidateSetupStepDisplay("candidate_title_pack", "en").label,
    "Strengthen the title pack",
  );
});

test("S1 Group B: book-analysis sections — every key resolves zh (byte-identical to array) + en", () => {
  for (const section of BOOK_ANALYSIS_SECTIONS) {
    const zh = getBookAnalysisSectionDisplay(section.key);
    assert.equal(zh.title, section.title, `section zh title drift at ${section.key}`);
    const en = getBookAnalysisSectionDisplay(section.key, "en");
    assert.ok(en.title && en.title.length > 0, `section en title missing at ${section.key}`);
    assert.deepEqual(getBookAnalysisSectionDisplay(section.key), zh);
  }
  assert.equal(getBookAnalysisSectionDisplay("plot_structure", "en").title, "Plot structure");
});

test("S1 Group B: book-analysis presets — every key resolves zh (byte-identical to array) + en", () => {
  for (const preset of BOOK_ANALYSIS_PRESETS) {
    const zh = getBookAnalysisPresetDisplay(preset.key);
    assert.equal(zh.title, preset.title, `preset zh title drift at ${preset.key}`);
    assert.equal(zh.summary, preset.summary, `preset zh summary drift at ${preset.key}`);
    const en = getBookAnalysisPresetDisplay(preset.key, "en");
    assert.ok(en.title && en.title.length > 0, `preset en title missing at ${preset.key}`);
    assert.ok(en.summary && en.summary.length > 0, `preset en summary missing at ${preset.key}`);
    assert.deepEqual(getBookAnalysisPresetDisplay(preset.key), zh);
  }
  assert.equal(getBookAnalysisPresetDisplay("standard", "en").title, "Standard analysis");
});

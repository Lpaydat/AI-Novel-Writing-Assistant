const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getDirectorNodeDisplayLabel,
} = require("../../shared/dist/types/directorRuntime.js");

// NOTE on zh byte-identity (Risk A guard):
// We deliberately do NOT type any Chinese string literal in this file. Asserting
// a Chinese literal we also typed into the implementation would be circular.
// Instead we derive every zh expectation behaviorally:
//   - default locale === explicit "zh" locale
//   - the label-field lookup path === the nodeKey lookup path for the same key
//   - zh and en branches are distinct for every sampled key
// The actual zh byte values are locked byte-for-byte by the EXISTING unchanged
// test server/tests/directorUsageTelemetryProjection.test.js (lines 93-99),
// which is the canonical byte-identity gate for F3.

test("getDirectorNodeDisplayLabel returns English label for en locale", () => {
  assert.equal(
    getDirectorNodeDisplayLabel({ nodeKey: "chapter_execution_node" }, "en"),
    "Chapter Execution Flow",
  );
});

test("default locale is identical to explicit zh locale (zero behavior change)", () => {
  // The default (no locale arg) must equal the explicit "zh" branch. This is the
  // no-op guarantee for the 7 existing callers that pass no locale.
  const keys = ["chapter_execution_node", "novel.chapter.writer"];
  for (const key of keys) {
    assert.equal(
      getDirectorNodeDisplayLabel({ nodeKey: key }),
      getDirectorNodeDisplayLabel({ nodeKey: key }, "zh"),
      `default locale should equal explicit zh for ${key}`,
    );
  }
});

test("en label-field lookup path mirrors the zh resolver path", () => {
  // The label path (input.label is an internal key) must resolve through the map
  // the same way the nodeKey path does — for both locales.
  const viaLabelZh = getDirectorNodeDisplayLabel(
    { label: "novel.chapter.writer", nodeKey: "chapter_execution_node" },
    "zh",
  );
  const viaNodeKeyZh = getDirectorNodeDisplayLabel(
    { nodeKey: "novel.chapter.writer" },
    "zh",
  );
  assert.equal(viaLabelZh, viaNodeKeyZh, "zh label path === zh nodeKey path");

  assert.equal(
    getDirectorNodeDisplayLabel(
      { label: "novel.chapter.writer", nodeKey: "chapter_execution_node" },
      "en",
    ),
    "Chapter draft writing",
  );
});

test("fallback label is locale-aware", () => {
  // Unknown nodeKey with no fallback -> locale-specific default.
  assert.equal(
    getDirectorNodeDisplayLabel({ nodeKey: "totally_unknown_node" }, "en"),
    "AI Advance Step",
  );
  // default (zh) fallback must equal explicit zh fallback.
  assert.equal(
    getDirectorNodeDisplayLabel({ nodeKey: "totally_unknown_node" }),
    getDirectorNodeDisplayLabel({ nodeKey: "totally_unknown_node" }, "zh"),
  );
  // The two locale fallbacks must be distinct branches.
  assert.notEqual(
    getDirectorNodeDisplayLabel({ nodeKey: "totally_unknown_node" }, "en"),
    getDirectorNodeDisplayLabel({ nodeKey: "totally_unknown_node" }, "zh"),
  );
  // A caller-supplied fallback still wins over the locale default.
  assert.equal(
    getDirectorNodeDisplayLabel(
      { nodeKey: "totally_unknown_node", fallback: "Caller override" },
      "en",
    ),
    "Caller override",
  );
});

test("zh and en label maps resolve an identical set of keys with distinct values", () => {
  // S1 template invariant: every key has both a zh and an en entry, and the two
  // locales produce different (localized) values. Sample spans every namespace.
  const sampleKeys = [
    "candidate_generation",
    "book.project.create",
    "story.macro.plan",
    "character.cast.prepare",
    "volume.strategy.plan",
    "chapter.task_sheet.plan",
    "chapter_execution_node",
    "chapter_quality_review_node",
    "chapter_repair_node",
    "chapter_state_commit_node",
    "payoff_ledger_sync_node",
    "character_resource_sync_node",
    "structured_outline.beat_sheet",
    "planner.replan",
    "audit.chapter.full",
  ];
  const zhFallback = getDirectorNodeDisplayLabel({ nodeKey: "__missing__" }, "zh");
  const enFallback = getDirectorNodeDisplayLabel({ nodeKey: "__missing__" }, "en");
  for (const key of sampleKeys) {
    const zh = getDirectorNodeDisplayLabel({ nodeKey: key }, "zh");
    const en = getDirectorNodeDisplayLabel({ nodeKey: key }, "en");
    assert.notEqual(zh, zhFallback, `zh should resolve ${key} (not fall through)`);
    assert.notEqual(en, enFallback, `en should resolve ${key} (not fall through)`);
    assert.notEqual(zh, en, `zh and en should differ for ${key}`);
  }
});

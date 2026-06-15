# Novel Generation Quality Guards

## Background

During automated novel generation, four classes of systematic quality problems cause continuity breaks or heavy repetition:

1. **World-source pollution**: a bound world's historical era / region does not match the current story background, and proper nouns from the world slice pollute the chapter-writing context.
2. **Missing milestone state**: after a process event (getting a license, signing a contract, stamping a seal) completes, there is no irreversible state record, so later chapters repeatedly "pursue" an already-completed goal.
3. **Scene-pattern repetition**: the same time + location + action combination (e.g. "stake out the hotel at 4 a.m.") recurs across many chapters, because the context has no explicit blacklist mechanism.
4. **Volume-pacing loss of control**: the climax nodes in a volume plan (a rumor erupting, signing a fixed booth) get written out early by the LLM because there is no guard constraint — leaving later chapters with no goal to advance.

## Decision

Add guard mechanisms at three layers — prompt context, shared types, and agent tools — rather than patching the display layer in the frontend.

## Current Rules and Implementation

### 1. World-slice pollution prevention (`storyWorldSlice.prompts.ts`)

**Rule**: the free-text fields of a slice (`coreWorldFrame`, `pressureSources`, …) must NOT directly use proper names from world assets; they must use generic narrative language (e.g. "local power brokers," not "the Cao Guodong family"). Proper names are allowed ONLY in the `id`-reference fields of `appliedRules` / `activeForces` / `activeLocations`.

**Rebuild tool**: the `rebuild_story_world_slice` agent tool force-triggers `NovelWorldSliceService.refreshWorldSlice()` to repair a polluted slice.

**Failure mode**: if the world setting itself has no structured ids internally (i.e. `structuredDataJson` is empty and it takes the legacy path), the slice may still use old nouns. You must first generate structured data for the world.

### 2. Completed milestones (`ChapterWriteContext.completedMilestones`)

**Field**: add `completedMilestones: z.array(z.string()).default([])` to `chapterWriteContextSchema`.

**Render location**: in the `chapter_mission` block of `buildChapterWriterContextBlocks()`, render an `Already completed — do NOT re-pursue` list BEFORE the `mustAdvance` list.

**Write rule**: this field is filled by the upstream chapter-planning / state-sync service when it builds `ChapterWriteContext`, reflecting the process events already clearly completed before the current chapter is written. If empty, the block is not rendered and existing generation logic is unaffected.

**Related prompt constraint**: the `chapterWriter.prompts.ts` system prompt adds: do NOT re-pursue goals already in `completedMilestones`.

### 3. Scene-pattern blacklist (`ChapterWriteContext.recentScenePatterns`)

**Field**: add `recentScenePatterns: z.array(z.string()).default([])` to `chapterWriteContextSchema`.

**Render location**: in the `opening_constraints` block of `buildChapterWriterContextBlocks()`, append a `Scene pattern blacklist` list.

**Write rule**: this field is filled by the chapter-summary service after it extracts high-frequency scene patterns (the three elements time + location + action) that recently appeared. If empty, not rendered; existing logic unaffected.

**Related prompt constraint**: the `chapterWriter.prompts.ts` system prompt adds: do NOT reuse scene patterns in the blacklist.

### 4. Volume-level key-milestone guards (`VolumeWindowContext.keyMilestoneGuards`)

**Field**: add to `volumeWindowContextSchema`:
```typescript
keyMilestoneGuards: z.array(volumeKeyMilestoneGuardSchema).default([])
// each item contains targetChapterRange / event / status / note
```

**Render location**: in the `volume_window` block of `buildChapterWriterContextBlocks()`, filter out guards with `status=done`; render the remaining guards as a `Volume key milestone guards — pacing constraints` list.

**Write rule**: this field is filled by the volume-planning service when it builds `VolumeWindowContext`, marking which key events are allowed to happen in which chapter range. If empty, not rendered.

### 5. Chapter-continuity diagnostic tool (`audit_chapter_continuity`)

**Agent tool**: `inspect` class, `riskLevel=low`, no LLM needed — deterministic detection via keyword-group matching.

**Detects**:
- Scene-pattern repetition: in which chapters a predefined keyword group (e.g. `["4 a.m.", "hotel", "stake out"]`) co-occurs.
- Opening-paragraph repetition: take the first 30 chars as a prefix; chapters sharing a prefix that appears 3+ times are flagged.

**Output**: `repetitionClusters`, `openingPatternClusters`, `hasCriticalIssues`, and repair suggestions.

## Failure Modes

- `completedMilestones` and `recentScenePatterns` depend on the upstream service filling them when building the context; if the upstream does not fill them, the two guards do not take effect. This change only establishes the interface contract; the data filling must be implemented in the chapter-runtime coordinator.
- `keyMilestoneGuards` is currently initialized to an empty array; the volume-planning service must fill the guard data when generating the volume structure, or no guard content appears in the `volume_window` block.
- After `rebuild_story_world_slice` rebuilds a slice, if `ensureStoryWorldSlice` is later triggered and stale detection shows it as the latest state, the rebuilt slice is reused rather than regenerated — this is intended.

## Related Modules

- `server/src/prompting/prompts/storyWorldSlice/storyWorldSlice.prompts.ts`
- `server/src/agents/tools/worldTools.ts` (`rebuild_story_world_slice`)
- `server/src/agents/tools/bookAnalysisTools.ts` (`audit_chapter_continuity`)
- `server/src/prompting/prompts/novel/chapterLayeredContext.ts`
- `server/src/prompting/prompts/novel/chapterWriter.prompts.ts`
- `shared/types/chapterRuntime.ts` (`ChapterWriteContext`, `VolumeWindowContext`)

## Source Documents

- 2026-06-08 Novel-generation quality-problem analysis and optimization plan (internal design review)

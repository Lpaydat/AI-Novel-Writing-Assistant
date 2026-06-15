# Novel Fact Ledger

## Background

The current timeline module has limited effect on chapter writing (see [timeline diagnostics](../prompts/novel-generation-quality-guards.md)), and its function overlaps heavily with PayoffLedger, ChapterMission, ObligationContract, and other modules.

The Fact Ledger is an alternative to the timeline's chapter-writing intervention: a minimal "list of irreversible already-happened facts" prevents the LLM from re-writing already-occurred events in later chapters — without relying on LLM post-extraction.

## Core Principle

> Facts are written by the PLANNING chain, NOT extracted by the LLM from prose.

- No extra LLM call
- Data comes from existing ObligationContract and PayoffDirective
- Idempotent writes; no duplicate entries

## Data Model

```prisma
model NovelFactEntry {
  id           String   @id @default(cuid())
  novelId      String
  chapterOrder Int      // which chapter the fact happened in
  text         String   // a one-or-two-sentence description, e.g. "Chapter 7 completed: Chen Jianguo obtained his sole-proprietor license"
  category     String   // completed | revealed | state_changed
  source       String   // auto | manual
  novel        Novel    @relation(...)
  createdAt    DateTime @default(now())
}
```

category meaning:
- `completed`: a process goal completed (license, contract, task)
- `revealed`: information revealed (identity, secret, truth)
- `state_changed`: irreversible state change (character death, relationship break)

## Write Path

**Trigger time**: after the chapter passes acceptance (`ChapterContentFinalizationService.finalizeChapterContent`), triggered synchronously with timeline finalization, executed asynchronously; failure does not affect the main flow.

**Data sources** (all from `chapterWriteContext`):

| Source | category | Example |
|--------|----------|---------|
| Items in `obligationContract.mustHitNow` | `completed` | "Chapter 7 completed: obtained sole-proprietor license" |
| `payoffDirectives[operation=payoff]` | `revealed` | "Chapter 12 fully revealed: the mastermind's identity" |
| `payoffDirectives[operation=partial_reveal]` | `revealed` | "Chapter 9 partially revealed: the grey-coat's real purpose" |

Manual write: `NovelFactService.addManualFact()` (for a future agent-tool call).

## Read Path

**Trigger time**: when `GenerationContextAssembler.buildForChapter` assembles the chapter-writing context.

**Query strategy**:
- `completed` + `revealed`: return in full (no chapter-distance limit; milestone facts)
- `state_changed`: return only entries within the last 15 chapters

**Injection point**: `ChapterWriteContext.completedMilestones: string[]`

Render effect (in the `chapter_mission` block):
```
Already completed — do NOT re-pursue or re-trigger
- Chapter 7 completed: obtained sole-proprietor license
- Chapter 12 fully revealed: the mastermind's identity
```

## Boundary with the Timeline

The Fact Ledger does NOT replace the timeline's front-end timeline-display function (the `StoryTimelineEvent` table is retained).
It only replaces the timeline's intervention on the chapter-WRITING context (the `timeline_context` block was removed from requiredGroups in PR-B).

## Related Modules

- `server/src/services/novel/fact/NovelFactService.ts` (read/write service)
- `server/src/services/novel/runtime/ChapterContentFinalizationService.ts` (write trigger)
- `server/src/services/novel/runtime/GenerationContextAssembler.ts` (read injection)
- `server/src/prisma/schema.prisma` (NovelFactEntry model)
- `shared/types/chapterRuntime.ts` (completedMilestones field, already present)

## PR-B Change Record (completed)

PR-B goal: completely remove timeline intervention from the chapter-WRITING path; the writing context no longer has a `timeline_context` block.

Files modified:

| File | Change |
|------|--------|
| `chapterWriter.prompts.ts` | removed `timeline_context` from `requiredGroups` / `preferredGroups` / `contextRequirements` |
| `ChapterContentFinalizationService.ts` | removed `timelineFinalizer` dependency and the finalize call |
| `ChapterStreamGenerationOrchestrator.ts` | removed `timelineFinalizer` dependency and the `ensurePreviousChapterTimelineFinalized` call + method |
| `ChapterPipelineRuntimeAdapter.ts` | removed `timelineFinalizer` dependency and the `finalizeChapterTimeline` callback |
| `ChapterRuntimeCoordinator.ts` | removed the optional `timelineFinalizer` dependency and its injection into all sub-services |
| `ChapterRepairStreamRuntime.ts` | removed the optional `timelineFinalizer` dependency and the post-repair-pass finalize call |
| `chapterRuntimePipeline.ts` | removed the `finalizeChapterTimeline?` interface definition and its two call sites; removed the `shouldFinalizeDegradedForDeferredQualityDebt` function |

> `ChapterTimelineFinalizationService` itself and the `StoryTimelineEvent` table are retained; the front-end timeline-display function is unaffected.

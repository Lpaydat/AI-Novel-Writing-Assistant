# Lazy Planning (JIT Task Sheet) Refactor (Phase 1)

## Background

### Problem

The original flow required that before executing ANY chapter, task sheets for ALL N chapters must first be pre-generated (the `chapter_detail_bundle` step) and fully synced to the execution area (the `chapter_sync` step) before the gate would let writing start. This introduced two systemic defects:

| Defect | Description |
|--------|-------------|
| **Defect 1: full-volume chapter-split gate** | a 100-chapter novel must wait for ALL task sheets to finish generating before execution can start — huge latency |
| **Defect 2: task sheet divorced from prose** | the task sheet is generated in the "planning period" without knowing which chapters have already been written, so the obligation design may contradict the actual prior text |

### Solution

**Lazy Planning (JIT)**: change the task sheet from "full pre-generation in the planning stage" to "just-in-time generation before execution," and inject already-occurred facts (the Fact Ledger) into the generation context — fundamentally solving the obligation-unreachable (root cause D) problem.

---

## Architecture Change

### Old Flow

```
structured_outline stage (serial, full volume)
  beat_sheet → chapter_list → chapter_detail_bundle (N chapters one by one) → chapter_sync (full)
        ↓ gate: syncedChapterCount >= plannedChapterCount (N/N all task sheets)
chapter_execution stage
  Chapter 1: GenerationContextAssembler.assemble → plannerService.ensureChapterPlan → write
  Chapter 2: ...
```

### New Flow (full_book_autopilot mode)

```
structured_outline stage (skip chapter_detail_bundle)
  beat_sheet → chapter_list → ✗chapter_detail_bundle (skipped) → chapter_sync (sync chapter titles only)
        ↓ gate: syncedChapterCount >= plannedChapterCount (passes as soon as chapter records are in DB)
chapter_execution stage
  Chapter 1: JIT-generate task sheet (factLedger empty → base task sheet)
           → plannerService.ensureChapterPlan → write → persist
           → ChapterContentFinalizationService writes factLedger (chapter 1 facts)
  Chapter 2: JIT-generate task sheet (factLedger contains chapter 1 facts)
           → plannerService.ensureChapterPlan → write → ...
```

---

## Key Components

### ChapterPlanJITService

**File**: `server/src/services/novel/planning/ChapterPlanJITService.ts`

Core method: `ensureExecutionReady(novelId, chapterId)`

| Scenario | Behavior |
|----------|----------|
| task sheet exists + factLedger < 3 entries | skip (old novel / first chapter; keep existing task sheet) |
| task sheet exists + factLedger ≥ 3 entries | regenerate, inject facts as `guidance` |
| task sheet missing | generate (with factLedger guidance if any) |

**Dependency injection** (via `ChapterPlanJITDeps`):
- `ensureChapterExecutionContract`: delegates to `NovelVolumeService.ensureChapterExecutionContract`

**Fact Ledger injection format** (the `guidance` field):
```
[Occurred facts / Fact Ledger — incorporate the following into the task sheet design; avoid repetition or contradiction]
Completed goals:
  - [Chapter N] ...
Revealed information:
  - [Chapter N] ...
Recent state changes:
  - [Chapter N] ...
```

### Structured-outline Stage Change

**File**: `server/src/services/novel/director/phases/novelDirectorStructuredOutlinePhase.ts`

Changes:
1. `chapter_detail_bundle` step: when `isFullBookAutopilotRunMode(request.runMode)`, directly `break` — skip full task-sheet pre-generation.
2. `missingExecutionContextOrders` check: under JIT mode, a chapter having no task sheet is the expected state; the check is conditionally skipped.

### Execution-Entry Wiring

**File**: `server/src/services/novel/runtime/GenerationContextAssembler.ts`

Inserted before `plannerService.ensureChapterPlan`:
```typescript
if (request.controlPolicy?.advanceMode === "full_book_autopilot") {
  await this.chapterPlanJITService.ensureExecutionReady(novelId, chapterId);
}
```

When `ensureChapterPlan` detects a task-sheet change via `buildChapterExecutionContractHash`, it naturally recomputes the execution plan.

---

## Compatibility

| Scenario | Behavior |
|----------|----------|
| Old novel (existing task sheet, factLedger empty) | factLedger < 3 → skip JIT, keep existing task sheet |
| Old novel (existing task sheet, factLedger has data) | regenerate, incorporate occurred facts |
| Manual single-chapter mode (manual / co_pilot) | `advanceMode ≠ full_book_autopilot` → JIT not triggered |
| Full-book autopilot, chapter missing task sheet | JIT generates it on the spot |

---

## Gate Logic

The gate's (`createChapterExecutionContractSyncModule`) completion condition `syncedChapterCount >= plannedChapterCount` **needs NO change**.

Reason: the `chapter_sync` step (end of the structured-outline stage) writes all chapters into the execution-area DB via `syncVolumeChaptersWithOptions` (even without task sheets), so `syncedChapterCount` equals `plannedChapterCount` and the gate passes naturally.

---

---

## Quality-Repair Loop Sub-item (1.D)

### Root cause A — pass structured obligation info to the repairer

**File**: `server/src/services/novel/runtime/repair/chapterRepairRuntime.ts`

New `buildRepairIssuesPayload(issues, runtimePackage)`:
- Beyond `ReviewIssue[]`, append `missingObligations` (kind/summary/evidence) and `blockingIssueCodes`
- Both rewrite paths (patch-fail escalation + forced rewrite) use structured JSON, so the repairer can targetedly write the missing obligations

### Root cause B — patchRepair budget increase + lenient-anchor retry

**File**: `DirectorQualityLoopBudgetLedgerService.ts`
- `DIRECTOR_QUALITY_LOOP_BUDGET_LIMITS.patchRepair`: 1 → 2

**File**: `chapterRepairRuntime.ts` (patch-fail catch block)
- First `ChapterPatchRepairFailedError` → retry once with `continuity_only` mode (lenient anchor)
- Lenient retry succeeds → return patch result
- Lenient retry still fails → escalate to `heavy_repair`

### Root cause E — split issueSignature length/content for separate budgets

**File**: `DirectorQualityLoopBudgetLedgerService.ts`
- New `classifyIssueNoticeCode(noticeCode)` → returns `"length"` or `"content"`
- `buildDirectorQualityLoopIssueSignature` adds a class prefix at the signature head
- Length-class issues (`LENGTH_*`) and content-class issues get independent budget counters, so a patch that fixes length does not get the subsequent content issue miscounted as a repeat

---

## Context Layered Cache (Phase 2)

### BatchContextCache

**File**: `server/src/services/novel/runtime/BatchContextCache.ts` (new)

- In-process singleton; caches the full novel Prisma query result by `novelId` (incl. world/characters/storyMacroPlan/volumePlans)
- TTL = 30 minutes; caches at most 8 novelIds
- Invalidation: subscribes to `character:changed` / `volume:updated` / `outline:revised` / `pipeline:completed` events to auto-invalidate

### GenerationContextAssembler Refactor

**File**: `server/src/services/novel/runtime/GenerationContextAssembler.ts`

1. **Stable-layer cache**: replace the large novel query with `batchContextCache.getNovelRow(novelId)`, saving 10+ parallel sub-queries per chapter.
2. **Remove timelineContext** (defect 5): delete the `timelineContextService.buildForChapter` call; `timelineContext: null`; `ChapterQualityGateService` defends against null.
3. **Merge the dual contextPackages** (defect 6): assemble shared fields once via a `sharedFields` object; the final `contextPackage = { ...sharedFields, ragContext, chapterMission, chapterWriteContext, chapterReviewContext, chapterRepairContext }`; eliminates ~30 fields being hand-copied twice.

---

## N+1 Chapter Execution Prefetch (Phase 3)

**File**: `server/src/services/novel/novelCorePipelineService.ts`

- After each chapter's `runPipelineChapter` completes (factLedger already written), NON-blockingly trigger the next chapter's (N+1) JIT task-sheet prefetch.
- Enabled only when `advanceMode === "full_book_autopilot"`.
- Prefetch failure does not affect the pipeline; the next chapter's formal assembly auto-retries.
- Combined with `BatchContextCache`: the novel stable layer is already cached, so prefetch only generates the task sheet and assembly is near-instant.

---

## Related Files

- `server/src/services/novel/planning/ChapterPlanJITService.ts` (new)
- `server/src/services/novel/runtime/BatchContextCache.ts` (new)
- `server/src/services/novel/director/phases/novelDirectorStructuredOutlinePhase.ts` (changed)
- `server/src/services/novel/runtime/GenerationContextAssembler.ts` (JIT wiring + cache + merge)
- `server/src/services/novel/runtime/repair/chapterRepairRuntime.ts` (structured obligations + lenient-anchor retry)
- `server/src/services/novel/director/runtime/DirectorQualityLoopBudgetLedgerService.ts` (budget increase + signature split)
- `server/src/services/novel/novelCorePipelineService.ts` (N+1 prefetch)
- `server/src/services/novel/fact/NovelFactService.ts` (factLedger data source; PR-A already ready)

## Relationship to the Four-Phase Optimization Plan

This is the full implementation of plan doc `.claude/plan/novel-generation-pipeline-optimization.md` Phase 1 (lazy-planning refactor), Phase 2 (context layered cache), Phase 3 (N+1 prefetch), plus the 1.D quality-repair loop sub-items (root causes A/B/E).

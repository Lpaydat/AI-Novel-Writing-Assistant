# Quality-Debt Root-Cause Attribution (Phase 0)

## Background

When a chapter ends on the `defer_and_continue` path (it still did not pass the quality gate after one repair), the system needs to know the real failure cause to optimize targetedly. Phase 0 embeds structured attribution data on this path for aggregation tools to tally root-cause distribution, providing data-driven decision basis for the later four-phase optimization plan.

## Root-Cause Classification

| Code | Name | Description | Key Evidence |
|------|------|-------------|--------------|
| **A** | Open-loop repair | The repairer received flattened text, did not get structured obligation info, and re-evaluating the same obligation failed again | `sameObligationRepeated = true` (first = second issue codes identical) |
| **B** | Patch-anchor mismatch | `ChapterPatchRepairService` requires precise anchoring to a source passage; after anchor mismatch it escalates to heavy_repair, but the budget only allows 1 | `patchAnchorFailed = true` |
| **D** | Obligation unreachable | The obligation in the pre-generated task sheet contradicts the actual prior text, so chapter-level repair can never satisfy it | `planMisaligned = true` (`failureClassification.code = draft_obligation_unmet / replan_required`) |
| **E** | Signature drift | The first failure was a length-class issue; after repair a content-class issue surfaces; the issueSignature is the same so the budget gets exhausted | `lengthVsContentDrift = true` |

## Data Model

```ts
interface QualityDebtAttribution {
  firstFailureIssueCodes: string[];              // first acceptance-failure issue-code list
  secondFailureIssueCodes: string[];             // post-repair second-failure issue-code list
  firstFailureClassificationCode: string | null; // failureClassification.code
  patchAnchorFailed: boolean;                    // patch escalated to heavy (root cause B)
  sameObligationRepeated: boolean;               // same obligation repeated failure (root cause A)
  planMisaligned: boolean;                       // obligation unreachable (root cause D)
  lengthVsContentDrift: boolean;                 // signature drift (root cause E)
  missingObligationKinds: string[];              // obligation kinds missing at first failure
  budgetActionsConsumed?: string[];              // Director budget actions (written by the outer layer)
}
```

## Write Path

**Trigger time**: at the end of `chapterRuntimePipeline.runPipelineChapterWithRuntime`, when the chapter ultimately did not pass, build the attribution object and write it to `PipelineRuntimeResult.qualityDebtAttribution`.

**Storage location**: the `qualityLoop.qualityDebtAttribution` node of the `chapter.riskFlags` JSON, merged with the existing `qualityLoop` quality-loop data.

**Trigger chain**:

```
chapterRuntimePipeline.ts
  → runPipelineChapterWithRuntime collects first/second-failure info
  → buildQualityDebtAttribution infers root-cause tags
  → PipelineRuntimeResult.qualityDebtAttribution
      ↓
novelCorePipelineService.ts
  → chapterQualityLoopService.recordAssessment(qualityDebtAttribution)
      ↓
ChapterQualityLoopService.ts
  → serializeRiskFlags → chapter.riskFlags (JSON)
```

## Read Path

**Agent tool**: `analyze_quality_debt_attribution`

- Input: novelId (required), startOrder, endOrder (optional)
- Function: scan all chapters with `terminalAction = defer_and_continue` in the specified chapter range, extract `qualityDebtAttribution` data and aggregate
- Output:
  - Root-cause A/B/D/E share (0~1)
  - Top 5 failure issue codes
  - Top 3 missing obligation kinds
  - Per-chapter attribution detail
  - Decision recommendation (which phase to prioritize)

## Decision Gate (Phase 0 conclusion)

Decide later optimization emphasis from the tool's root-cause share:

| Dominant root cause | Recommendation |
|---------------------|----------------|
| **D dominant** | Prioritize Phase 1 (lazy planning); the JIT task sheet directly dissolves obligation-unreachable |
| **A/B dominant** | Do Phase 1's repair-loop sub-item (1.D) first, then the lazy-planning main body |
| **E dominant** | Split length/content issueSignature and budget them separately |

## Related Files

- `server/src/services/novel/runtime/chapterRuntimePipeline.ts` (attribution collection + `QualityDebtAttribution` interface)
- `server/src/services/novel/quality/ChapterQualityLoopService.ts` (attribution storage)
- `server/src/services/novel/novelCorePipelineService.ts` (attribution pass-through)
- `server/src/agents/tools/bookAnalysisTools.ts` (`analyze_quality_debt_attribution` tool implementation)
- `server/src/agents/tools/bookAnalysisToolSchemas.ts` (tool schema definition)

## Relationship to the Four-Phase Optimization Plan

Phase 0 is a "do then look" diagnostic layer; it does not modify generation logic, only instruments the existing failure path. Its output data drives the implementation priority of Phase 1 (lazy planning), avoiding big rework on the wrong root cause.

Related plan doc: `.claude/plan/novel-generation-pipeline-optimization.md`

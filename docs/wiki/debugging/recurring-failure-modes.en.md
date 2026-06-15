# Recurring Failure Modes and Investigation Paths

## Background

The failures that recur across the project are often not single-point bugs but boundary violations: heavy tasks run in the API process, state is inferred from multiple sources, prompts bypass the registry, the chapter hot path is too long, or RAG retrieval scope is inconsistent. Settling these investigation conclusions avoids re-locating the same class of problem every time.

## Decision

When debugging, first confirm the source of truth, the execution plane, the projection, and the governed entry point, then look at specific code. Do NOT first paper over a systemic problem with a UI patch, a keyword fallback, or a local try/catch.

## Current Rules

- API stall: first check whether a long task is still running in the Web API process.
- State inconsistency: first check `DirectorRun / StepRun / Event / Artifact` and the projection — not the front-end display.
- Prompt-output problem: first check the PromptAsset, schema, repair, semantic retry, and provider capability.
- Slow chapter output: first check whether the hot path re-chains multiple LLM post-processing steps.
- RAG miss: first check explicit documents, bound documents, globally-enabled documents, and the context resolver.
- Data-destruction-risk operations: back up first, verify the backup, then get explicit approval.

## Examples

Common investigation paths:

- All endpoints slow down after "continue director": check whether the route directly awaits a long task, whether the Worker holds an independent lease, and whether the SQLite/Prisma write lock is held by a long chain.
- The task center shows failure but the novel page shows running: check whether the projection is mixed-inferred from old task status, runtime command, and artifact facts.
- Empty chapter prose keeps advancing: check the writer empty-return defense, single-chapter auto-retry, and failure landing state.
- Chapter review repeatedly enters a repair loop: check whether the post quality loop has already capped at one repair, whether the final result has converged to "did not pass but keep producing," and whether the workspace still counts a terminal chapter as a repair ticket.
- A long-arc foreshadow is treated as a current-chapter block: check whether the timeline hook's `resolveMode` and `blocking` were mis-marked `immediate + blocking`, and whether the detector upgrades `short_arc` / `long_arc` to a hard failure.
- Regenerating candidates did not enter a new round: check batch reuse, command idempotency, and the candidate-stage runtime state.
- Generation did not use knowledge-base materials: check `knowledgeDocumentIds`, novel/world bindings, enabled status, and the prompt context requirement.

## Failure Modes

Means that MUST NOT replace root-cause repair:

- Lowering front-end polling frequency to mask API execution-plane blocking.
- Disabling a UI button to avoid duplicate execution, without handling command idempotency.
- Adding a keyword fallback to intent recognition to mask an AI schema or context problem.
- Patching a local JSON-parse branch in a business service to bypass the Prompt Registry.
- Showing a background asset-backfill failure as a prose-generation failure.

## Related Modules

- `server/src/routes/`
- `server/src/workers/`
- `server/src/services/novel/director/`
- `server/src/services/novel/runtime/`
- `server/src/services/rag/`
- `server/src/prompting/`
- `client/src/pages/tasks/`
- `client/src/pages/novels/`

## Source Documents

- [Auto-director execution-plane isolation and API keep-alive plan](../../plans/auto-director-execution-plane-isolation-plan.md)
- [Director-mode modularization and state-governance refactor checklist](../../plans/director-mode-module-state-refactor-checklist.md)
- [Prose-output pipeline slimming and asset-backfill optimization plan](../../plans/chapter-output-pipeline-optimization-plan.md)
- [Prompt Governance Audit 2026-05-08](../../checkpoints/prompt-governance-audit-2026-05-08.md)
- [README latest update](../../../README.md)

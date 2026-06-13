# Chapter Runtime Boundaries

## Background

The chapter body-text generation chain simultaneously handles streaming generation, empty-draft retry, the body-text acceptance gate, timeline detection, final-content finalization, asset sync, and pipeline batch adaptation. When `ChapterRuntimeCoordinator` carried all of these as a single file, any entry point could easily bypass the unified chain, causing manual generation, auto-director, and the pipeline to diverge in behavior.

After Phase 5, `ChapterRuntimeCoordinator` keeps only a stable facade and three public entry points; concrete execution is delegated to internal runtime submodules. External callers must not be aware of these internal splits.

## Current Rule

- External entry points may depend only on `ChapterRuntimeCoordinator`'s `createChapterStream`, `createRepairStream`, and `runPipelineChapter`.
- `ChapterStreamGenerationOrchestrator` owns the manual generation stream, empty-draft retry, SSE state, and the pre-run fact gate.
- `ChapterQualityGateService` owns the dual acceptance + timeline gate, the cache key, and the gate trace.
- `ChapterContentFinalizationService` owns final-content finalization, runtime-package assembly, chapter-status progression, timeline finalization, and deferred asset sync.
- `ChapterPipelineRuntimeAdapter` only adapts pipeline hooks to the unified chapter runtime; it must not copy writer, gate, or finalization logic.
- `chapterRuntimePackageBuilders.ts` holds only IO-free builder functions; it must not import Prisma, routes, director, or service singletons.
- `ChapterRepairStreamRuntime` remains the repair-stream implementation boundary and is not split in Phase 5; the facade continues to delegate to it.

## Failure Modes

- A route, director, or legacy service directly importing `ChapterQualityGateService` / `ChapterContentFinalizationService` indicates the outside has started deep-linking into runtime internals.
- A runtime package builder importing DB or service singletons indicates the pure-function builder layer has re-mixed in IO.
- A pipeline adapter copying generation or finalization logic indicates the batch execution path has diverged again.
- The coordinator growing back above 700 lines indicates the facade is re-absorbing internal responsibilities.

## Related Modules

- `server/src/services/novel/runtime/ChapterRuntimeCoordinator.ts`
- `server/src/services/novel/runtime/ChapterStreamGenerationOrchestrator.ts`
- `server/src/services/novel/runtime/ChapterQualityGateService.ts`
- `server/src/services/novel/runtime/ChapterContentFinalizationService.ts`
- `server/src/services/novel/runtime/ChapterPipelineRuntimeAdapter.ts`
- `server/src/services/novel/runtime/chapterRuntimePackageBuilders.ts`

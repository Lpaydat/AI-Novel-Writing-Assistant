# Novel Application Capability-Layer Boundary

## Background

`NovelService` once exposed project-basics, chapter, planning, review, pipeline, character, volume-planning, storyline, world-slice, and chapter-editing capabilities all at once through multi-level inheritance. Once a caller held the whole God Object, it was hard to tell which capabilities it actually depended on, and tempting to keep extending the same facade from routes, the task center, export, and auto-director.

From Phase 4 onward, novel business entry points moved to a **composable application capability** model. `NovelService` is retained only as a compatibility facade and is no longer the default dependency for new code.

## Current Rule

- Production code should obtain the process-level capability set via `getSharedNovelServices()`, then take the methods it needs via `Pick<NovelApplicationServices, ...>` or explicit port injection. Do not call `createNovelApplicationServices()` directly from routes, the task center, export, Agent tools, auto-director, or event handlers.
- `createNovelApplicationServices()` is retained only as a low-level factory, allowed for test isolation, the `NovelService` deprecated compatibility facade, and explicitly marked legacy compatibility layers. New business entry points must depend on the shared application services or an explicitly injected capability port.
- `routes/` may depend only on the minimal capabilities the current HTTP mapping needs; it must not import or `new NovelService`.
- Background tasks, export, Agent tools, auto-director, and event handlers should also depend on capability ports and must not hold the whole `NovelService`.
- `NovelService`, `NovelPipelineService`, `NovelReviewService`, `NovelGenerationService`, and `NovelArtifactService` are all compatibility layers; methods may be kept for old tests or old external callers, but they must no longer inherit from each other to form a capability chain.
- Chapter generation, chapter repair, chapter planning, and replanning must still enter the unified production orchestrator / stage runner; the capability layer only composes and delegates — it must not copy execution implementations.
- Chapter body-text writing may only enter the production orchestrator via `NovelApplicationServices.createChapterStream()` or a workflow step runner. The old chapter-generation entry points of `novelCoreGenerationService` and `NovelCoreService` may only act as compatibility delegation and must not directly hold `ChapterRuntimeCoordinator`.

## Failure Modes

- When a route test needs to mock a business capability, patch `DefaultNovelApplicationServices.prototype`, not `NovelService.prototype`.
- If a new route injects the full capability set "for convenience," it will regress into a God Object. When adding a route, first list the methods it actually calls, then declare a minimal `Pick<>`.
- If an internal service re-`new`s `NovelService`, it has not defined its own port boundary — switch to injecting the specific capability.
- If the Core layer re-couples to `ChapterRuntimeCoordinator`, manual generation, auto-director, and the pipeline will again split into different execution strategies, causing inconsistent preparation phases, quality-repair phases, and recovery decisions.

## Related Modules

- `server/src/services/novel/application/`
- `server/src/services/novel/NovelService.ts`
- `server/src/routes/novel*.ts`
- `server/src/services/novel/director/`
- `server/src/services/task/`
- `server/src/modules/export/`

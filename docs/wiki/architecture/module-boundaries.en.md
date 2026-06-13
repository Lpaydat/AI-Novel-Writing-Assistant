# Module Boundaries & Documentation Governance

## Background

The project has grown from a single writing assistant into a monorepo containing a web frontend, an Express/Prisma backend, a desktop host, shared types, a Prompt Registry, auto-director, RAG, a task center, and the chapter production chain. Once a codebase accumulates features this way, recurring problems are usually not missing code — they are unclear module boundaries, unclear sources of truth for state, and unclear ownership of documentation.

If rules continue to live only in plan documents or phase checkpoints, future developers and AI agents will keep re-litigating the same questions: which module should own a capability, whether an old service can be called directly, whether something belongs in release notes or the wiki, and whether a long file must be split.

## Decision

The wiki records stable rules; plans and checkpoints retain historical context. Module governance is organized around the **novel production main chain**: business modules such as `setup`, `planning`, `production`, `director`, `characters`, `state`, and `export` should gradually own clear entry points; cross-cutting infrastructure should converge into platform capabilities such as `prompting`, RAG, LLM, `db`, `runtime`, and `events`.

Splitting long files is not about line count for its own sake — it is about separating business rules, application orchestration, external adapters, and HTTP/API mapping. When a directory becomes too dense, create lower-level modules with clear responsibility boundaries instead of piling on more peer-level files.

## Current Rule

- The repo root keeps only entry documentation, collaboration rules, the roadmap, and toolchain config; long-term knowledge goes into `docs/wiki/`.
- `docs/plans/` keeps execution plans, `docs/checkpoints/` keeps phase records, `docs/design/` keeps module designs, `docs/releases/` keeps user-visible changes.
- A single source file approaching **600 lines** should be reviewed for responsibility; past **700 lines** it must be split before further growth.
- Before adding a capability to a high-density directory, first decide whether it needs a lower-level responsibility directory.
- **High-priority hard constraint:** control entry points may differ, but the business execution chain for body-text generation and body-text repair must be **singular**. Batch execution, auto-director, manual single-chapter generation, and manual single-chapter repair must not each maintain an independent implementation.
- Any new entry point that "modifies body text" must funnel into `novelProductionOrchestrator + stage runner + ChapterRuntimeCoordinator`. Different transport, route, job, or frontend streaming shapes are allowed; bypassing the unified runtime to own writer, patch repair, heavy repair, body-text save, asset sync, or review-status progression logic is not.
- `route`, `director`, `creative hub`, the legacy `NovelCoreReviewService`, or any other legacy service must not directly hold body-text generation/repair implementations; they may only act as control entry points or thin facades that delegate execution to the unified chapter main chain.
- Any entry point that changes chapter body text must trigger final timeline finalization. The module-boundary order is fixed: the body-text execution runtime produces the final text, `ChapterTimelineFinalizationService` writes the timeline checkpoint from that final text, and only then may the system advance to the next chapter, a background batch, or the next auto-director step.
- `ChapterTimelineFinalizationService` is the application-service boundary for timeline commits. `routes`, `director`, `creative hub`, the legacy review service, repair helpers, and frontend projections must not directly assemble `ChapterTimeAnchor`, `StoryTimelineEvent`, `TimelineHook`, or `ChapterArtifactSyncCheckpoint` writes.
- The timeline module owns events, hooks, time anchors, constraints, detection, and the commit repository; the chapter runtime only collaborates with the finalization service through the timeline module facade. The writer prompt may consume timeline context, but it must not close hooks itself or write timeline tables.
- The repair path and the skip path must not bypass finalization. On a successful repair the repair runtime calls finalization; when the repair budget is exhausted but continuation is allowed, the batch/auto-director path submits a degraded finalization; `replan_required` stays blocking and is never swallowed by a degraded skip.
- `server/src/services/novel/workflow/` should only expose a workflow facade externally and continue to converge internally into `store`, `healing`, `projection`, and `application`; external modules must not deep-link into its internals.
- Checkpoint-recovery data should be assembled through a shared helper so that `healing` and `application` do not each duplicate recovery logic.
- `server/src/services/novel/director` should continue to converge toward responsibility boundaries: `commands`, `runtime`, `state`, `automation`, `projections`, `recovery`, `phases`.
- The `server/src/services/novel/director/` root keeps only stable facades and compatibility bridges. Command execution goes in `commands/`, task state in `state/`, fact summaries/runtime projections/display snapshots in `projections/`, recovery and backfill in `recovery/`, phase nodes and phase strategy in `phases/`, takeover/confirmation/candidate/run orchestration in `runtime/`, and HTTP mapping in `http/`.
- `server/src/routes/` keeps only legacy HTTP entry points that have not yet migrated. HTTP mapping for the novel main chain, auto-director, novel export, and world setup must go into the matching business module's `http/` directory and be mounted directly by `app.ts`; do not keep re-export shims in the `routes/` root.
- Novel business application entry points should be composed through the capability layer in `server/src/services/novel/application/`. `NovelService` exists only as a compatibility facade; routes and background services must not re-depend on the whole God Object.
- `ChapterRuntimeCoordinator` is the stable external facade of the chapter runtime; stream orchestration, quality gating, final-content finalization, pipeline adaptation, and runtime package building may only collaborate inside `server/src/services/novel/runtime/` internal modules — externals must not deep-link into these internal services.
- New business capabilities should be exposed through module facades or `index.ts`; do not deep-link from the outside into other modules' internal files.
- Boundary changes affecting auto-director, chapter execution, Prompts, RAG, task state, or frontend projection must be accompanied by a wiki or module README update.
- Any data backfill, sync, extraction, or index refresh must consume only a chapter's stable snapshot; while a chapter may still be repairing, rewriting, or rolling back, such actions must not be hooked into the hot path.
- Task snapshots, fact checks, and recovery-suggestion generation must stay read-only. `recover` may return recoverable positions, but it must not write `run_resumed`, recovery hints, or other state events during polling, preview, or projection reads. Recording a recovery action requires an explicit execution/recovery flow — never a convenient write on the read path.
- `novelEventBus` carries only lightweight domain notifications. Heavy side effects such as character-dynamics sync, pipeline snapshots, and RAG re-indexing must go into a persistent queue or an existing dedicated queue; event handlers must not invoke these services directly.
- Novel export is an independent business module: `server/src/modules/export/` only reads existing novel production data, converts export DTOs, and generates TXT/Markdown/JSON content and export filenames. It owns no source of truth for novels, chapters, characters, timelines, or quality repair, and writes nothing back to production state during export.
- The timeline constraint layer is an independent business module: `server/src/modules/timeline/` only manages timeline events, chapter time anchors, hooks, constraints, and detection reports. It does not replace `StoryStateSnapshot`, `ConsistencyFact`, or `CharacterTimeline`, and it does not call the chapter writer to modify body text.
- Chapter generation, the Prompt Registry, and the task center may obtain timeline context or detection reports only through the timeline module facade; they must not assemble timeline-table query rules inside the writer, a route, or the UI.

## Examples

Recommended:

- When the auto-director adds an executable command, first decide whether it belongs to command, runtime, automation, recovery, or projection, then place it in the matching module.
- When the chapter production chain adds a quality check, first decide whether it belongs to the hot-path acceptance gate, local repair, or async asset backfill.
- When chapter production adds a timeline rule, add it to the timeline module's policy, context, checker, or extractor rather than scattering it across the writer prompt or chapter-service branches.
- When chapter production adds a body-text write or body-text repair entry point, first wire it through `ChapterRuntimeCoordinator` and reuse `ChapterTimelineFinalizationService`; do not write text first and then let the caller decide whether to patch the timeline afterward.
- If a new document explains a long-term rule, it goes in `docs/wiki/`; if it is only a phase implementation checklist, it goes in `docs/plans/` or `docs/checkpoints/`.

Forbidden / discouraged:

- Continuing to add multiple `novelDirector*` peer-level files in the `services/novel/director` root to host new subsystems.
- Using generic names like `helper`, `utils`, or `shared` to host business policy.
- Copying release notes into the wiki, or writing the wiki as a single commit's change list.
- Duplicating a chapter writer / repair pipeline inside `routes/`, `director/`, `creative hub/`, or a legacy service to ship faster, then maintaining each entry point separately.
- Directly `upsert ChapterTimeAnchor`, `create StoryTimelineEvent`, or `update TimelineHook` in the director, a route, or a repair helper, bypassing the finalization service.

## Failure Modes

- The same state is inferred separately in task, runtime, seed payload, and frontend cache, causing UI display to diverge from actual execution.
- A legacy service handles HTTP semantics, workflow orchestration, DB writes, and Prompt input assembly at once, so every later fix can only add another branch.
- Documentation lives only in phase plans, so stable rules are hard for future tasks to reuse.
- The next chapter's context is missing timeline, hook, previous-chapter tail, or task sheet: first check whether a module boundary was bypassed — especially whether body-text write skipped `ChapterTimelineFinalizationService`.

When triaging, first find the source of truth and the module entry point, then decide whether a missing boundary caused duplicated implementation.

## Related Modules

- `server/src/services/novel/director/`
- `server/src/services/novel/workflow/`
- `server/src/services/novel/runtime/`
- `server/src/services/novel/runtime/ChapterTimelineFinalizationService.ts`
- `server/src/modules/export/`
- `server/src/modules/timeline/`
- `server/src/services/novel/application/`
- `server/src/events/sideEffects/`
- `server/src/prompting/`
- `client/src/pages/`
- `shared/`
- `docs/`

## Source Documents

- [Docs management conventions](../../README.md)
- [Auto-director execution-plane isolation & API liveness plan](../../plans/auto-director-execution-plane-isolation-plan.md)
- [Director-mode modularization & state governance refactor checklist](../../plans/director-mode-module-state-refactor-checklist.md)
- [Novel Director subsystem](../../../server/src/services/novel/director/README.md)
- [Novel application capability-layer boundary](./novel-application-services.md)
- [Chapter runtime boundaries](./chapter-runtime-boundaries.md)
- [Event side-effect boundaries](./event-side-effect-boundaries.md)

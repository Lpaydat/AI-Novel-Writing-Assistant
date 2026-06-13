# Auto-Director Runtime & Recovery Boundary

## Background

The auto-director owns the main chain from idea → book opening → planning → character preparation → volume/chapter planning → chapter execution. Historical problems cluster around three directions: the Web API being killed by long tasks, inconsistent semantics across continue / resume / takeover entry points, and multi-source inference of task state vs. runtime state.

These cannot be fixed by reducing frontend polling, delaying toasts, or disabling buttons. The root cause is that the auto-director execution plane and the Web API control plane must be isolated, and runtime state must be projectable from a source of truth.

## Decision

The auto-director separates control plane from execution plane:

```text
user action
  -> Web API command route
  -> DirectorRunCommand / WorkflowTask queued
  -> Director Worker lease
  -> DirectorPipelineEngine / Step Module
  -> PolicyEngine
  -> Artifact Ledger / DirectorEvent
  -> Runtime Projection
  -> lightweight frontend query
```

The Web API only accepts commands and returns lightweight projections; the Worker executes the heavy production chain; runtime state is generated from the source-of-truth tables `DirectorRun / DirectorStepRun / DirectorArtifact / DirectorEvent`.

## Current Rule

- An API route must not directly `await` an auto-director long task, chapter generation, volume splitting, quality repair, or an LLM production chain.
- High-priority hard constraint: the auto-director is NOT a second chapter-generation system. The control plane may have director-specific commands, projections, and approval policies, but the business execution chain for body-text generation and body-text repair MUST be shared with manual single-chapter and batch execution via the same runtime.
- User actions — continue, resume, retry, takeover, approve, cancel — must be converted to commands first; they must not each maintain an independent business flow.
- `DirectorRunCommand` expresses control-plane command, lease, and idempotency; it does not express business-completion facts.
- `DirectorRun` is the root state of a book-level director run, `DirectorStepRun` is the per-step execution record, and `DirectorEvent` and `DirectorArtifact` drive projection and recovery.
- A StepModule must declare its input, output, artifacts, progress check, and recovery strategy; the Pipeline only orchestrates and must not know specific business tables or Prompt details directly.
- A StepModule's read-only fact checks must be runnable independently from a `novelId`. `taskId`, run, command, artifacts, and projection hints are auto-director extension context, not required conditions for `inspectReadiness` / `inspectCompletion` / `inspectProgress`; with no director task present, the step must return a minimal state derived from novel facts.
- Manual chapter generation and manual chapter repair must also enter a StepModule first, then delegate to the unified chapter runtime inside the step. Routes may keep SSE protocol and user-entry differences, but they must no longer bypass `chapter.draft.write` or `chapter.draft.repair` to form a second execution path.
- StepModule core-runtime dependencies must enter through an explicit dependency pack or a default assembly function; dynamic `require()` ad-hoc service lookup in a constructor is forbidden. Default assembly may keep using existing service instances, but the dependency relationships must be readable, replaceable, and testable at the module boundary.
- Auto-director sequential scheduling must happen at the orchestrator / StepModule layer. The chapter batch executor `NovelDirectorAutoExecutionRuntime.runFromReady()` is currently still one implementation of `chapter.draft.write` execution and must not call back into the same step, otherwise it forms recursive execution. If chapter batch execution is later split into pure step scheduling, "start/resume pipeline job" must first be extracted into a low-level port, and only then may the scheduler traverse the step plan.
- Projection targets the UI and only returns lightweight state — phase, blocking reason, next step, recoverable range — not full large objects.
- The frontend must distinguish the full cockpit snapshot from the lightweight runtime projection. The full snapshot contains `displayState.steps`, recent events, fact checkup, and milestones, and suits the progress popup; the lightweight projection only expresses the current run summary and suits navbar and task-center high-frequency polling. The two must NOT share a React Query key, otherwise polling overwrites the full snapshot with the lightweight response and the popup step view degrades.
- The auto-director main UI state must be arbitrated by a single `DirectorDashboardView`. `DirectorRuntimeProjection`, the fact checkup, chapter progress, and workspace summary are material layers; they may supply diagnostics, risks, and recent events, but they must not each decide the main badge, main progress, main button, or whether to wait for confirmation.
- `DirectorDashboardView` must carry `sourceTrace` and `progressSource` so a debugger can see whether the main state and main progress come from task, worker, checkpoint, chapter facts, or runtime projection. When the frontend needs to render the cockpit, progress popup, task center, task drawer, or novel-page takeover prompt, it should read this final display model first. Book-level automation projection may keep exposing legacy fields for compatibility, but those fields must be derived from `DirectorDashboardView`, not re-arbitrate the main state.
- Workflow reminders, chapter-title reminders, missing-resource risks, and stale artifacts may only be shown as diagnostics or auxiliary actions; when `DirectorDashboardView.mode` is `running` or `queued`, these reminders must not turn the main container, main badge, or main button into "waiting for confirmation".
- After a service restart, do not silently resume long tasks; infer the recoverable range from real artifact breakpoints, then let the user or policy confirm continuation.
- When the auto-director drives chapter production, it may only enter the unified chapter execution main chain through `novelService.startPipelineJob(...)` or `resumePipelineJob(...)`; the director side must not directly call the writer, patch repair, heavy repair, or the legacy manual repair service.
- When the auto-director hits chapter-quality failure, it may only reuse the unified quality-repair rules: patch first, at most one `heavy_repair` on failure, then register quality debt or a recoverable failure and continue subsequent chapters. The director runtime must not invent an independent "director-only repair branch".
- Before advancing to the next chapter, the auto-director must obey the chapter production chain's `final_content -> timeline_finalization -> next_chapter` rule. The director may decide to continue, skip, or replan, but it must not bypass `ChapterTimelineFinalizationService`.
- The auto-director's "skip quality repair and continue" is NOT a bypass of the timeline. When the repair budget is hit or the user chooses `skip_quality_repair`, the execution plane must first submit a degraded timeline checkpoint from the current best body text, then register quality debt and advance the remaining chapters.
- The auto-director must not add timeline-commit logic inside the director. stable/degraded timeline, `ChapterTimeAnchor`, hook承接 (carryover), and checkpoint metadata all belong to the unified chapter runtime, not to director-specific recovery logic.
- When the auto-director drives chapter production, the chapter pipeline's LLM usage must be written into director usage telemetry with a `chapterId`. When per-chapter cumulative tokens exceed a hard budget, the runtime must open a `usage_anomaly` circuit breaker and pause further automatic execution, so that task restarts, quality loops, or context bloat cannot keep amplifying consumption.
- Auto-director projection must treat `terminalAction=defer_and_continue` non-replan quality results as "quality debt recorded", not escalate them to `action_required`, `error`, or "needs handling". Such quality debt only affects later optimization hints; it must not block continuation.
- The auto-director execution plane may only wire an explicit `stop_for_replan` / `replan_required` into the replan checkpoint. When a chapter review returns `local_patch_plan`, `continue_with_warning`, `patchable_obligation_gap`, or a still-recordable obligation gap after repair, it must be registered as quality debt or a local repair suggestion and the remaining chapters continue; writing it into `replanAlertDetails` just because `recommended=true` is forbidden.
- `replan_required`, even when it appears inside full-book auto-completion or AI-main-driver automatic execution, is still a blocking checkpoint. The runtime must stop at the actual triggering chapter and write the summary as "executed through chapter N; replan required beyond", not display the target range as already completed.
- `auto_execute_range` is the user's explicit continuation authorization for the current chapter execution range. Even if the recovery path first returns to structured-outline or execution-contract sync, it must pass that authorization into the subsequent Pipeline's `approveAutoExecutionScope` and actively enter the chapter-execution node after structured sync; it must not rely on the auto-approval preference alone, otherwise the command finishes successfully but the chapter-execution node stays at the approval gate.
- When an existing-project takeover has no explicit `autoExecutionPlan`, the default range is "full-book prerequisite-planning takeover", not a chapter range. When `auto_to_ready` starts from the story macro plan or project setup, it must first complete Story Macro / Book Contract / characters / volume strategy / chapter splitting until `chapter_batch_ready` before handing off; only when the user explicitly chooses a chapter range or volume range do the chapter-range / volume-range entry limits apply.
- The existing-project takeover user entry should lead with "system-recommended resume position + asset-protection note + one-click continue". Phase selection, re-run current step, range execution, and auto-approval are advanced controls and default to collapsed. Only actions that would overwrite or rebuild existing assets require explicit confirmation; an ordinary `continue_existing` must not force the user to understand internal phase cards before they can start.
- The takeover entry's progress checkup must surface "what the system sees" directly to the user — at minimum volume planning, chapter-split sync, chapter refinement, body-text writing, and quality progress. If the URL or context carries a `workspaceTaskId` / `directorTaskId`, the frontend should read that task snapshot in parallel and prefer the task's real phase, current chapter, and task status to explain the main button; on task-snapshot read failure, fall back to the novel-asset checkup rather than letting a slow checkup block the popup from opening.
- The takeover entry may only treat `directorTaskId`, the current active auto-director task, or a live auto-director projection as "current director task" context. `workspaceTaskId` belongs to an ordinary edit-workflow lane and must not be passed into the takeover popup to participate in the "enter current task" decision; otherwise a locally-collapsed-but-still-`waiting_approval` manual flow misleads the takeover entry into believing a continuable auto-director task exists.
- When book-level automation projection returns `failed`, `blocked`, or `waiting_recovery` with a `latestTask.id`, the frontend must treat it as the director state that currently needs handling. Even if the URL has no `directorTaskId` and the active auto-director task query returns empty, the AI cockpit, task-drawer entry, and recovery entry must display that projection, and when the user opens details, write `latestTask.id` into `directorTaskId`. `completed` / `cancelled` terminal states may continue to show only when pinned in the URL, to avoid old tasks repeatedly bothering the user.
- When the takeover entry can infer the next chapter and total chapter count from a task snapshot or novel assets, the default entry may offer a lightweight "advance to chapter N" choice. That choice must produce an explicit `chapter_range` `autoExecutionPlan`, ranging from the current pending chapter to the user-selected target chapter; with advanced settings open, the advanced range config still wins.
- The takeover task's `downstreamReset` metadata only expresses "from the takeover point onward, later old assets need re-validation"; it must not overwrite the task's already-advanced real progress. When the UI synthesizes step state, it must use the current run phase as the boundary and only show the current phase and later reset steps as pending; steps earlier than the current phase must show as completed per task progress or real assets.
- The `chapter_batch_ready` quality reminder is a continuation gate for the current batch. After the user clicks "continue automatic chapter execution", `approveAutoExecutionScope` must let the AI main driver skip the current quality reminder and launch the remaining chapters.
- The chapter-range automatic-execution StepModule fact gating must clip chapter progress to the authorized range. In-range steps like `chapter.draft.write` and `chapter.state.commit` may only verify chapters within the current `autoExecution` / `autoExecutionPlan` interval; out-of-range old chapters that already have body text but lack a state commit must not block the current batch's completion.
- Chapter quality review, chapter repair, and chapter state commit must use the same chapter-range facts. When a local quality issue has already been marked `terminalAction=defer_and_continue` by the quality loop, it is chapter-level quality debt and must not be promoted to block global auto-director at `chapter.state.commit` via `blockingObligations` or a missing standalone `StoryStateSnapshot`; only an explicit replan signal (`replan_required` / `recommendedAction=replan`) may block the subsequent chapter range.
- `replan_required` is not an ordinary review gate. The frontend display mode must trust the task checkpoint first and must not be overridden by a projection `waiting_approval` into an ordinary "continue auto-director"; otherwise a `resume` command is issued, the backend re-reads the same replan result and writes it back unchanged, surfacing as "command succeeded but no new chapter execution".
- `skip_quality_repair` is a user's explicit control command meaning "skip this quality / replan suggestion and continue". The execution plane must register the actually-triggering quality-issue chapter (which already has body text) into `qualityDebtSummaries` before continuing the remaining chapter range; it must not treat the risk as already-fixed, nor drop the chapter, reason, and time information needed for later quality recovery.
- Quality-debt sources must come from an explicit pipeline-job chapter range or persisted chapter facts, not be inferred from `nextChapterId` / `nextChapterOrder`. `nextChapter*` only marks the next-chapter-to-execute cursor, not the current quality-issue source; chapters with empty body text, only an execution contract, or only a task sheet must not enter `skippedChapterIds`, `skippedChapterOrders`, `qualityDebtChapterIds`, or `qualityDebtChapterOrders`.
- Auto-director projection must trust the task checkpoint first. When the task is already `waiting_approval` and a checkpoint exists, it must mask stale `DirectorStepRun.running`, otherwise the UI shows a quality gate awaiting handling as still executing.
- The auto-director display state must also protect the real run state in reverse. When the task is already `running` with a current advance label, current item, or live progress, it must mask stale `waiting_approval` / `requiresUserAction` projections; otherwise the cockpit mis-displays an actively refining/writing/reviewing task as "waiting for confirmation" and surfaces invalid confirm buttons.
- Auto-director execution detail, the AI cockpit, and the progress popup must share one fine-grained run-label priority: the chapter pipeline's `currentItemLabel` / runtime projection `currentLabel` outranks the StepModule node-level `DirectorStepRun.label`. `DirectorStepRun.label` may only serve as a fallback when no task label exists; it must not overwrite "auto-reviewing chapter N" with "executing chapter generation batch".
- Auto-director projection must carry chapter-quality root causes: `rootCauseCode`, `blockingObligations`, `qualityDebtSummary`, and `qualityBudgetSummary`. Execution detail should use these fields to explain "what is missing, how far the system has handled it, and how the next step continues", not flatten every chapter-execution problem into a generic failure.
- The `character_setup_required` state in the character-preparation phase is a recoverable checkpoint, not a failure. When character-cast candidates are already generated but the quality gate asks for user confirmation, the StepModule must recognize it as an acceptable pause: the task stays `waiting_approval`, the candidates remain for the user to review or apply, and "zero formal characters" must not promote `character.cast.prepare` to a failure. Only when there are no formal characters, no usable candidates, and no recoverable checkpoint should it be treated as a character-preparation failure.
- Character-cast "apply" has two layers: core persistence and enrichment. Core persistence must synchronously complete characters, relationships, and cast status so the user can continue character-asset work immediately; explicit-profile enrichment and character-dynamics projection are enhancement. The auto-director internal link waits for enrichment by default, so later volume strategy or structured outline does not read incomplete dynamics; when the user manually applies a cast on the character-preparation page, core persistence may return first, with a lightweight notice that enrichment continues in the background.
- The character-cast quality gate must not use regex, keyword tables, fixed text fragments, or character ratios to judge identity carryover, hidden truths, genre understanding, language quality, or character responsibilities. These creative semantics must be handed to AI-first structured understanding, PromptAsset, semantic retry, or an AI evaluation chain. A deterministic gate may only check structural contracts — e.g. presence of protagonist, gender, required fields, and a recoverable checkpoint.

## Examples

Recommended:

- A `continue` request only creates or reuses an active command and immediately returns the command id, task id, and lightweight state.
- After Worker lease, it invokes the unified Pipeline; the StepModule assembles input, executes, validates output, and commits artifacts.
- The frontend task center reads the runtime projection instead of high-frequency pulling of full volumes, seed payload, or candidate batches.

Forbidden:

- Directly calling `runDirectorPipeline`, `generateVolumes`, `chapterExecution`, or quality repair inside a route.
- Using `setImmediate`, `void Promise`, or fire-and-forget to fake a background task inside the Web API process.
- Letting old task status directly determine runtime completion.
- Adding body-text writing, direct patch repair, or full-rewrite implementations inside `director/`, evolving the auto-director into a bypass writing system.
- Continuing to pile dynamic `require()` calls into core-runtime constructors, leaving dependency boundaries discoverable only by runtime collision.

## Failure Modes

- After clicking continue, ordinary query endpoints hang together: first check whether heavy execution is still running inside the API process.
- After clicking "continue automatic chapter execution" the toast succeeds but no new LLM request fires: first check whether the command already executed successfully but `chapter_execution_node` is still `waiting_approval`, and whether the recovery branch or quality-reminder branch lost `approveAutoExecutionScope` from `auto_execute_range`.
- After clicking "continue auto-director" on a `replan_required` state there is no new LLM request: check whether the UI mis-judged the replan checkpoint as an ordinary waiting; the correct entry is quality repair / replan handling, or explicit `skip_quality_repair` followed by registering quality debt for recovery and continuing the remaining chapters.
- After clicking `skip_quality_repair` it jumps straight over empty chapters: check whether quality debt was wrongly bound to `nextChapterOrder`. The correct state binds quality debt to the just-completed chapter that triggered the quality reminder; after state recalculation the earliest empty-body chapter should still sit first in `remainingChapterOrders`.
- After skipping quality repair the next chapter is disjoint: check whether a `timeline_finalization/degraded` checkpoint was written before the skip, and whether the current chapter already has a `ChapterTimeAnchor`. If not, the execution plane treated the skip as a direct advance to the next chapter.
- Single-chapter token spike: check whether `DirectorLlmUsageRecord.metadataJson.chapterId` is complete, whether the `usage_anomaly` circuit breaker recorded the triggering chapter, and whether there are duplicate gates, duplicate chapter contracts, or timeline-context bloat.
- A chapter-range task stalls at `chapter.state.commit facts are not complete yet`: first compare `draftedChapterCount / committedChapterCount` for the task range vs. the whole book. If the range is complete but the whole book still has old chapters missing `StoryStateSnapshot` or `CanonicalStateVersion`, the fact gating did not clip chapter progress by `autoExecution` / `autoExecutionPlan` — fix the StepModule's scoped progress rather than backfilling unrelated chapters to bypass. If the range only lacks chapters already `defer_and_continue` quality-debt, check whether the quality-debt classification is still being preempted into blocking by `blockingObligations`, and whether `chapter_state_committed` progress accepts a degraded-continue state.
- Execution detail still only shows `chapter.draft.write did not satisfy its completion criteria`: check whether the chapter runtime package already wrote `failureClassification`, and whether the `quality_loop_assessed` event projected `rootCauseCode` and `blockingObligations` to the frontend.
- Execution detail shows `character.cast.prepare did not satisfy its completion criteria`: first check whether the task already has a `character_setup_required` checkpoint and `CharacterCastOption` candidates. If candidates exist, fix the acceptable pause or task projection rather than regenerating the whole main chain; if candidates are absent, then check the character-generation Prompt, structured output, and persistence path.
- The UI shows failure but the task was re-queued: check whether projection still treats old task status as the source of truth.
- A novel actually has a failing director task but the AI cockpit shows idle: first check whether the current URL only has `workspaceTaskId` and no `directorTaskId`, then check whether the `book-automation` projection already returned `projection.status=failed` and `latestTask.id`. If the projection has a failing task but the sidebar still hides it, the frontend filtered the unpinned failing projection as historical terminal; the correct behavior is to show the failing projection and let "view failure reason" jump to the task detail with a `directorTaskId`.
- Fake running after a service restart: check whether lease expiry, active step, command status, and artifact breakpoint are projected uniformly.
- Repeatedly clicking continue spawns multiple execution chains: check the command idempotency key and active-command reuse.

Execution-plane blockage must not be papered over by disabling frontend buttons or lowering the polling rate.

## Related Modules

- `server/src/services/novel/director/DirectorCommandService.ts`
- `server/src/services/novel/director/DirectorCommandExecutor.ts`
- `server/src/services/novel/director/DirectorCommandInterpreter.ts`
- `server/src/services/novel/director/directorSubsystem.ts`
- `server/src/services/novel/director/runtime/`
- `server/src/services/novel/director/workflowStepRuntime/`
- `server/src/workers/`
- `client/src/pages/novels/components/NovelAutoDirectorProgressPanel.tsx`
- `client/src/pages/tasks/TaskCenterPage.tsx`

## Source Documents

- [Auto-director execution-plane isolation & API liveness plan](../../plans/auto-director-execution-plane-isolation-plan.md)
- [Director-mode modularization & state governance refactor checklist](../../plans/director-mode-module-state-refactor-checklist.md)
- [Novel Director subsystem](../../../server/src/services/novel/director/README.md)
- [README current capabilities](../../../README.md)

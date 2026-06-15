# Chapter Production Chain

## Background

Chapter production once chained chapter contract, prose generation, AI detection, text repair, light validation, character dynamics, state snapshot, character assets, and foreshadow ledger all into one hot path. The capabilities were valuable, but executing all of them synchronically made the user wait longer, repeated LLM calls, repair loops, and ledger re-syncs.

The goal of the long-form main chain is to keep writing the whole book to completion. The default path MUST first produce readable prose, then asynchronously process the state and ledgers that need to feed back.

## Decision

Chapter production uses a two-channel design:

```text
light pre-check -> whole-chapter prose generation -> acceptance gate -> optional local repair
                                                                          |
                                                                          v
                                                    timeline finalization / async asset backfill channel
```

The prose hot path is only responsible for generating, judging, saving, and locally repairing the chapter as fast as possible. State snapshots, character assets, relationship dynamics, and the foreshadow ledger are written through an asynchronous, idempotent, batchable asset-backfill channel.

## Current Rules

- Hard high-priority constraint: control entry points may differ, but the business execution chain for prose generation and prose repair MUST be unique; batch execution, auto-director, manual single-chapter generation, and manual single-chapter repair MUST NOT each keep their own implementation.
- The chapter's single execution chain is defined as:
  - Control entry points all go through `novelProductionOrchestrator`.
  - Manual single-chapter generation, batch execution, and auto-director chapter production all land on `ChapterExecutionStageRunner`.
  - Manual single-chapter repair and book-level re-planning all land on the `quality_repair` stage; the repair entry that modifies prose MUST delegate to `ChapterRuntimeCoordinator`.
  - The prose writer, acceptance gate, patch repair, heavy repair, prose save, asset sync, re-review, and state advance MUST reuse one set of runtime rules. Routes, old services, and director branches MUST NOT each maintain a second prose-execution implementation.
- `NovelGenerationService.createChapterStream`, `NovelService.createRepairStream`, and `startPipelineJob` / `resumePipelineJob` are only different control entry points; their business execution surface MUST keep converging on the same coordinator, not copy the writer or repair logic per entry point.
- The default writer keeps generating a whole chapter in one shot; sceneCards, the chapter contract, and multi-round per-scene writing are NOT re-wired into the prose hot path.
- The chapter contract and sceneCards may serve as planning, review, diagnostic, and local-repair auxiliary assets; they do NOT drive default prose generation.
- Before prose generation, only the minimum writability checks run: chapter exists, characters available, context package assemblable, task goal interpretable.
- After generation, one structured acceptance gate decides whether to continue, whether local repair is needed, or whether human confirmation is needed.
- The acceptance-gate hot path waits ONLY for `acceptance`. The timeline extractor no longer blocks prose acceptance; after the chapter is accepted, `ChapterTimelineFinalizationService` runs stable/degraded timeline finalization.
- The `acceptance` gate MUST write a persistent idempotent cache keyed by same-chapter, same-prose content-hash, same-model request; timeline finalization MUST write a `timeline_finalization` checkpoint keyed by same-chapter, same-prose content-hash. After task cancel, failure, or worker restart, if the prose is unchanged, reuse the successful result and do NOT re-trigger the same acceptance evaluation or timeline extractor.
- The gate cache may ONLY store reusable successful results. Transient system failures such as `acceptance_gate_unavailable`, timeline-extractor failure, or missing timeline context MUST NOT be written as long-term success cache; such results stay as current-run risk and allow later retry.
- Any post-extraction or asset backfill that calls an LLM MUST seize a persistent checkpoint BEFORE calling the model and mark state `running`. If a `running` or `succeeded` checkpoint already exists for the same chapter, same prose content-hash, same artifactType, and syncMode, later entry points MUST skip this LLM call; on failure, mark `running` as `failed` to allow later retry. Relying only on a service-instance in-memory lock does NOT satisfy task restart, concurrent background entry, or previous-chapter catch-up scenarios.
- Timeline detection is independent of quality review. It checks future-event leakage, unclosed previous-chapter hooks, time regression, event repetition, state conflicts, and missing planned events — but runs by default as a post-acceptance finalization / re-check step.
- On timeline-detection failure, keep the prose and mark `needs_repair`, but do NOT commit the events extracted from failed prose as `occurred` timeline.
- The timeline module MUST NOT modify prose directly; it only outputs structured issues, and the existing local-repair or whole-chapter repair chain decides how to fix.
- Hard high-priority constraint: before a chapter can move to the next, `final_content -> timeline_finalization -> next_chapter` MUST be satisfied. `final_content` means the prose after a passing draft, the prose after a passing repair, or — when the max repair count is reached and skipping is allowed — the current best prose retained.
- When a draft needs repair, do NOT submit a pre-repair timeline. Timeline finalization MUST wait until final prose is settled; if repair succeeds, submit from the repaired prose; if the max repair count is exhausted but `defer_and_continue` is allowed, submit a degraded timeline first, then record quality debt and continue.
- Timeline finalization has ONE entry point: `ChapterTimelineFinalizationService`. It saves the `ChapterTimeAnchor`, commits occurred events, new hooks, and hook-closure status, and writes a `ChapterArtifactSyncCheckpoint` with `artifactType=timeline_finalization` and `syncMode=stable | degraded`.
- Timeline finalization triggered after acceptance may run in the background, but `ensurePreviousChapterFinalized` before the next chapter's generation MUST catch up. Backgrounding only reduces the current chapter's acceptance wait; it MUST NOT skip timeline closure before the next chapter.
- `stable` means the timeline extractor succeeded and committed events, hooks, and time anchors based on the final prose; `degraded` means that on extraction failure, missing context, or a skipped chapter, a minimal time anchor and checkpoint are written. Degraded is "the minimal state that can still be carried forward," NOT a quality pass.
- A timeline-extractor failure MUST NOT be disguised as a stable commit of empty events. An extraction failure MUST write a degraded checkpoint and record `extractorSucceeded=false`, the failure reason, event count, hook count, and whether a fallback anchor was used in metadata.
- Before the next chapter is generated, check whether the previous chapter's current prose content-hash already has a `timeline_finalization` checkpoint. With no checkpoint, run finalization first; if catch-up cannot reach stable, commit a degraded checkpoint — do NOT assemble the next chapter's context with no finalization record at all.
- Hook closure is driven primarily by the extractor's `addressedHookIds` / `resolvedHookIds`. String-contains matching may only be a backward-compat safety aid, NOT a new primary judgment; the prompt MUST give the extractor the open hook ids.
- The writer prompt MUST include the original `chapter.taskSheet` and the previous chapter's actual prose tail. The task sheet preserves the director's fine-grained execution constraints from chapter splitting; the previous chapter's tail constrains this chapter's opening time, location, character state, and unfulfilled actions. Neither may be crowded out by timeline_context or an old summary.
- Heavy repair MUST NOT be run with empty RAG / continuity context. The repair context must at least compress-in recent chapter summaries, the previous chapter's tail, key open conflicts, character hard facts, and resource facts — to avoid introducing new continuity contradictions after repair.
- Character hard facts are a pre-generation REQUIRED constraint. The writer MUST receive `character_hard_facts` required context, used to constrain character identity, faction, stance, realm/power level, current location, availability-to-appear, and must-not-miswrite items.
- `participant_subset` only provides soft profiles of participating characters and current-behavior hints; it CANNOT replace `character_hard_facts`. Under token pressure you may compress soft info, but you MUST NOT cut character hard facts.
- `character_hard_facts` is subset-filtered by chapter participants, current high-risk characters, and dynamic orientation before entering the writer, to avoid forcing the whole book's character hard facts into the prose context.
- Faction, identity, or realm errors should be investigated first against the character library and the `character_hard_facts` context — not blamed solely on the timeline or quality audit.
- Audit and repair still detect character conflicts after generation, but they are a post-hoc safety net and should NOT be the primary source of character facts during prose generation.
- After chapter prose is written, the post-gate logs a unified trace: chapter, stage, blocking-ness, content hash, duration, and prompt-asset key — to distinguish writer latency from review latency.
- The chapter-execution page's frontend projection uses a three-column responsibility split: the left only handles chapter switching and queue-status viewing; the center only handles prose reading and necessary prose actions; the right handles the chapter sidebar and the AI execution console.
- The right chapter sidebar is further split into `This Chapter Overview / Timeline / Character Dynamics / Resource & Risk`. `This Chapter Overview` only shows current chapter status, word count, goal, pending issues, and update time — no timeline constraints mixed in; Timeline only shows time anchors, previous-chapter hooks, planned advances, must-not-happen-early items, and detection results.
- The right sidebar MUST NOT add new write flows. Timeline comes from the chapter-timeline API; detection summaries prefer the runtime package or the latest `TimelineCheckReport`; character dynamics come from the state snapshot; resources and risk come from the existing resource context and runtime risk summary.
- On desktop the left/center/right columns should keep equal-height workspaces and scroll independently within each column; on mobile they collapse into grouped regions, prioritizing prose reading and chapter-action space.
- The right column only shows constraints, status, diagnostics, and execution actions that affect later writing; it MUST NOT duplicate the full prose from the center.
- Task sheets, scene breakdowns, quality reports, repair records, context-and-issue diagnostics belong to the right-side material/diagnostic area; the center keeps only the prose card and necessary prose actions, to avoid summary and diagnostic layers repeatedly occupying prose-reading space.
- The chapter hot path MUST maintain a unified chapter obligation contract: `mustHitNow`, `mustPreserve`, `requiredPayoffTouches`, `requiredCharacterAppearances`, `requiredGoalChanges`, `canDefer`, `forbiddenCrossings`. The writer, acceptance gate, local repair, and re-planning judgment should all consume the SAME contract, so planning, writing, and review do not each re-interpret chapter duty.
- Chapter repair, review, and context assembly MUST be compatible with old runtime records' chapter-writing context. If an old `chapterWriteContext` lacks the new `obligationContract`, the runtime fills an empty contract rather than crashing the repair flow; after filling, the review and repair context is reorganized from the current chapter task, character duties, foreshadow ledger, and resource state.
- Task detail, chapter fact-check, and runtime projection MUST be read-only; `recover` only returns recoverable positions and reasons and MUST NOT write recovery events during polling or snapshot reads. Otherwise a page refresh mis-records "recoverable state" as "executing again" and creates a false duplicate foreshadow-sync impression.
- The readiness, completion, and resume-breakpoint of chapter-execution steps MUST read real artifact facts first: `Chapter.content`, `AuditReport` / `QualityReport`, blocking issues, `StoryStateSnapshot` / `CanonicalStateVersion`, and authoritative approval state. `task.status`, `chapterStatus`, `state.chapterProgress` may only be projection or diagnostic hints — they MUST NOT decide whether a chapter is generated, needs repair, or can advance.
- If task status conflicts with chapter facts, chapter facts win: prose exists but an old task failed → allow continuing from real progress; old `chapterStatus=needs_repair` but blocking issues closed → do NOT repeatedly re-enter repair; old `chapterStatus=completed` but prose missing → do NOT treat as complete.
- Structured reminders of the chapter-obligation context MUST NOT crowd out high-risk resources and overdue foreshadowing. The review and repair context should retain key signals like resource-unavailable, resource-needs-confirmation, and urgent/overdue payoff, so AI repair does not keep using invalid props or ignore must-pay-off pressure while missing constraints.
- The acceptance gate MUST output unmet obligations as structured `missingObligations` with a `repairability`: a local miss is `patchable_obligation_gap`; a whole-chapter adjustment is `rewrite_needed`; a chapter-duty vs neighbor-arrangement mismatch is `plan_misalignment`.
- `missingObligations` must distinguish hard-blocking from quality debt. A `must_hit_now` or `forbidden_crossing` gap blocks the current chapter and enters repair; a payoff, character-appearance, or goal-change gap that only affects later follow-up should be recorded as `continue_with_risk` and let the chapter chain advance — do not amplify a follow-up-able problem into repeated patches.
- Auto-repair defaults to at most once; on failure, record a pending-repair state or repair ticket — no infinite retries.
- Local patch repair is a light-repair-first strategy, NOT the only repair path for a chapter task. When patch-plan schema validation fails, the targetExcerpt is non-unique, too short, missing, or the patch is invalid, escalate to a recoverable local-repair failure that the upper quality chain upgrades to whole-chapter light repair or records a pending-repair state — do NOT let the auto-director task fail on the raw Zod error.
- `acceptance_gate_unavailable` or "chapter acceptance judgment unavailable" is a review-system risk, NOT evidence of a replaceable passage in the prose. If the current pending issues contain only such risks, batch chapter production should keep the current prose and record re-review debt, awaiting re-review or human re-check; do NOT call the local patch prompt, and do NOT rewrite prose for a system risk.
- All repair entry points that modify prose follow ONE repair rule: try patch repair first; when patch repair fails on schema, location, hit ambiguity, or invalid patch, allow AT MOST one auto-upgrade to `heavy_repair`; on success, uniformly go through save prose, asset sync, re-review, and state update; on failure, manual repair returns the real failure, and batch execution + auto-director record quality debt or a recoverable failure then continue to later chapters.
- A patch repair's `targetExcerpt` MUST be a uniquely locatable original passage in the prose; `replacement` is the post-replacement content. When deleting a repeated passage, `replacement` may be an empty string, but it must still satisfy unique location and produce a prose change.
- When existing prose enters re-review or quality repair, do NOT first re-save the same prose as `drafted/generating`. When prose is unchanged, run only review, necessary repair, and final asset sync — avoid needlessly refreshing UI update time, the RAG queue, and chapter status.
- The auto-director's quality-loop budget MUST genuinely affect the next repair round: once the same failure signature has already tried local repair, the next chapter pipeline round must switch to `heavy_repair`, not keep hardcoding `light_repair`.
- Chapter-execution failure semantics MUST distinguish: prose not generated is `draft_generation_failed`; prose generated but chapter obligation unmet is `draft_obligation_unmet`; still-blocking issues after auto-repair is `draft_repair_exhausted`; needing to adjust neighbor-chapter plans is `replan_required`. The UI and task detail should show the real root cause, no longer flattening all these into `chapter.draft.write did not meet its completion criteria.`
- The quality-loop projection MUST distinguish blocking errors from non-blocking quality debt. A chapter with `terminalAction=defer_and_continue` that is NOT `replan_required` / `recommendedAction=replan` / `blockingObligations` may only be a weak "quality debt recorded" hint and MUST NOT drive the main state into "error needs handling" or generate a repair ticket; `local_patch_plan` / `continue_with_warning` may only enter the quality-debt or local-repair-suggestion channel and MUST NOT be written into `replanAlertDetails` or `PIPELINE_REPLAN_REQUIRED`; `replan_required` — even when also carrying `defer_and_continue` — is still a blocking re-plan.
- `urgentPayoffs`, `ledgerSummary.urgentCount`, and `nextAction=advance_payoff` are PRE-generation chapter-duty signals and may only enter the writing context and the acceptance-gate judgment. They MUST NOT independently trigger a post-generation `replanRecommendation`, or the system mis-judges "this chapter should advance a payoff" as "this chapter already failed and needs re-planning." Only overdue payoff, explicit `nextAction=replan`, high/severe audit issues, or a human request may interrupt the chapter chain into re-planning.
- `replanRecommendation` MUST carry action semantics: `continue_with_warning` means only record a hint and continue; `local_patch_plan` means a local-plan or repair problem that does not stop later chapters; only `stop_for_replan` means pausing the batch pipeline to enter whole-window re-planning. Callers MUST NOT stop chapter execution just because `recommended=true`.
- Overdue payoff must be tiered by current-chapter relevance and overdue distance. A short-window overdue payoff not explicitly required by the current chapter goal and not beyond a hard window may only output `continue_with_warning`, to avoid the same ledgerKey repeatedly triggering whole-window re-planning across consecutive chapters.
- An overdue payoff with no clear target window may only be a ledger-risk follow-up; it MUST NOT derive overdue distance from `lastTouchedChapterOrder` or `firstSeenChapterOrder`, and MUST NOT anchor an old chapter to trigger `stop_for_replan`. When foreshadow-ledger sync finds an AI-output overdue with no `targetStartChapterOrder`, `targetEndChapterOrder`, `payoffChapterOrder`, or `payoffChapterId`, degrade it to `pending_payoff` and retain the `payoff_missing_progress` risk signal.
- `mustAdvance` in the chapter-writing contract may only store plot-advancement items. System audit tags like `acceptance_gate_unavailable`, `missing_must_hit`, and `mode_fit/acceptance_gate_unavailable` may only enter the audit, repair, or diagnostic channel — they MUST NOT be written into the task sheet's "must advance" or into sceneCards' `mustAdvance`.
- When `autoReview=false`, prose may still be saved and async asset backfill entered. The auto-director's `chapter.quality.review` fact-check should read the execution plan and treat "this round does not run auto review" as an explainable skip fact; a batch of already-completed prose MUST NOT fail just because `AuditReport` / `QualityReport` count is 0.
- When the same chapter's prose content-hash is unchanged, do NOT re-run state snapshot, character assets, foreshadow ledger, or character-dynamics sync.
- When the same chapter's planning already has `taskSheet` and `sceneCards` and there is no new user guidance, chapter-execution contract refinement should reuse the existing planning and NOT re-call `novel.volume.chapter_execution_contract`. Regeneration with guidance may still overwrite the old result.
- Any data backfill, sync, extraction, or index refresh MUST wait until the chapter reaches a stable terminal state; while a chapter is still in repair, rewrite, or rollback, only prose and necessary review results may be retained — such actions MUST NOT be eagerly hung back onto the hot path. Timeline finalization is the state-closure step before the next chapter and is NOT a freely-deferrable background asset backfill.
- Asset-sync modes:
  - `adaptive`: default; key assets sync asynchronously; high-risk or cycle nodes trigger full foreshadow calibration.
  - `deferred`: fast prose; asset sync may be batched later.
  - `strict`: wait for necessary asset sync before continuing to the next chapter.

## Examples

Recommended:

- With no sceneCards, generate prose as long as the chapter goal and context are sufficient.
- After the acceptance gate outputs repair directives, do at most one local patch repair.
- The acceptance gate's auto-repair allows at most one auto-retry; if it still does not pass, the chapter enters a terminal "did not pass but keep producing" state, no longer holding both a conflicting pass state and a pending-repair state.
- Foreshadowing writes a delta per chapter by default; only high-risk, volume-end, cycle nodes, or strict mode trigger full reconciliation.
- Background asset backfill consumes only completed stable snapshots; it does not pull back the main chain and does not repeatedly re-run the prose chain because of a same-chapter terminal-state quality alert.
- When skipping a chapter, submit a degraded timeline first, then move to the next; skipping is NOT a shortcut to bypass the timeline.

Forbidden:

- Forcing every chapter to rebuild the contract before generating prose just because the chapter-contract feature exists.
- Default-chaining AI-flavor detection, light review, state extraction, character-asset extraction, and foreshadow sync as multiple LLM calls after generation.
- Failing or truncating prose outright because the length slightly exceeds the target.
- Adding separate writer, patch-repair, or full-rewrite implementations for manual single-chapter repair, batch execution, auto-director, or Creative Hub.
- Exposing a patch repair's raw technical error as a new flow branch — e.g. `targetExcerpt too_small` directly terminating manual repair instead of handing it to the unified quality chain for a one-time full-text repair upgrade.

## Failure Modes

- Abnormal latency for one chapter's generation: check whether multiple LLM post-processing steps have been put back on the hot path.
- Same chapter re-syncing ledgers or re-running timeline / artifact-delta extraction: check whether the content-hash checkpoint seizes `running` BEFORE the LLM call, not only writes `succeeded` after success.
- Repair loop: check whether auto-repair count is limited, whether failures fall to a continue-producing terminal state, and whether the auto-director quality budget has upgraded from local repair to whole-chapter repair or re-planning.
- `chapter.draft.write did not meet its completion criteria` appears often: first check the runtime package's `failureClassification` and `obligationCoverage`. If the root cause is `draft_obligation_unmet`, prioritize the acceptance gate's missing obligations and patch repair; if `replan_required`, check for single-chapter duty overload or neighbor-chapter division-of-labor mismatch.
- A chapter repeatedly requests re-planning: check whether the `rolling_window_review` reason comes only from a pre-generation urgent payoff or `advance_payoff`. If the audit score passes, the prose and artifact delta already show advancement, but the runtime package still recommends re-planning, the re-plan recommendation read pre-write state instead of post-write failure evidence.
- Auto-director gets stuck on early payoffs at high chapter counts: check whether synonymous repeated ledger items were full-reconciled by the AI into targetless-window `overdue`s. The correct behavior is that post-sync processing reuses the unfinished same-name canonical ledgerKey and degrades targetless-window overdue to a pending-advance risk, instead of anchoring an old `lastTouchedChapterOrder` into a cross-decades-of-chapters re-plan window.
- The page seems to keep "updating": first distinguish whether the backend actually produced new prose. If the prose is unchanged but `updatedAt`, the RAG job, or the task heartbeat keep refreshing, check whether existing-prose re-review was re-saved as a draft.
- Prose is already readable but the UI shows failure: check whether prose status, asset-backfill status, and ledger-calibration status were conflated into one status.
- Chapters 3-8 all show "suggest patch repair / quality needs repair": first check whether `riskFlags.qualityLoop` is a `defer_and_continue` quality debt. With no `replan_required`, `recommendedAction=replan`, or `blockingObligations`, the main UI and the AI cockpit MUST NOT show it as a blocking error.
- After disabling auto review, the task stalls on `chapter.quality.review facts are not complete yet`: prioritize checking whether `autoExecution.autoReview`, `autoExecutionPlan.autoReview`, and `directorInput.autoExecutionPlan.autoReview` are passed to the fact-check in the runtime seed payload. If these fields are `false`, the quality-review step should output `reviewSkipped=true` and continue subsequent state commits.
- A chapter shows future-plot leakage or an unclosed previous-chapter hook: prioritize checking whether `timeline_context` and `previous_chapter_hook` entered the writer prompt, and whether `TimelineCheckReport` blocked the occurred-timeline commit on failure.
- The next chapter's opening shows time regression or re-closing an old hook: prioritize checking whether the previous chapter's current content-hash has a `timeline_finalization` checkpoint, whether the `ChapterTimeAnchor` is persisted, whether hooks were closed via `addressedHookIds` / `resolvedHookIds`, and whether the previous chapter's tail entered the writer prompt.
- After repair the story still continues from the old timeline: check whether the repair-success path calls timeline finalization based on the repaired prose. If timeline is committed only on the draft path, the repair path still has a state gap.
- After a skip, later chapters are disjoint: check whether the skip action first submitted a degraded timeline. With no degraded checkpoint, later chapters can only read old hooks or empty time anchors.
- A chapter repeatedly re-runs the same post-detection: check whether the same chapter + same content-hash already hit the acceptance / timeline gate cache.
- A chapter shows faction, identity, realm, or current-state errors: prioritize checking whether the character library already has hard facts, then whether `GenerationContextPackage.characterHardFacts` and the writer prompt's `character_hard_facts` exist. If hard facts are missing, fix the character-preparation chain first; if they exist but did not reach the writer, fix context assembly; if they reached the writer but were still violated, then check the audit and repair chains.

## Related Modules

- `server/src/services/novel/runtime/ChapterRuntimeCoordinator.ts`
- `server/src/services/novel/runtime/repair/`
- `server/src/services/novel/runtime/ChapterArtifactDeltaService.ts`
- `server/src/modules/timeline/`
- `server/src/services/novel/characters/characterHardFacts.ts`
- `server/src/services/novel/production/`
- `server/src/prompting/prompts/novel/`
- `client/src/pages/novels/components/chapterExecution.shared.tsx`
- `client/src/pages/novels/components/ChapterExecutionResultPanel.tsx`
- `client/src/pages/novels/components/chapterInsights/`

## Source Documents

- [Prose-output pipeline slimming and asset-backfill optimization plan](../../plans/chapter-output-pipeline-optimization-plan.md)
- [README latest update](../../../README.md)
- [Release Notes](../../releases/release-notes.md)

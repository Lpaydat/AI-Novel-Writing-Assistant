# Timeline Constraint Layer

## Background

The chapter-production chain already has `StoryStateSnapshot`, `ConsistencyFact`, and `CharacterTimeline`, but these assets mainly carry post-chapter state summaries, fact extraction, and character-experience records. They lack an independent "event-ordering constraint layer" and cannot reliably block future-event leakage, broken previous-chapter hooks, time regression, event repetition, and character-state rollback.

The timeline constraint layer gives chapter production a harder event-ordering skeleton. It does NOT write prose, does NOT directly edit prose, and does NOT replace the chapter plan or state snapshot.

## Decision

Add an independent `timeline` module. The timeline is responsible for only four things:

- Record planned events, occurred events, chapter time anchors, hooks, and detection reports.
- Provide the non-cuttable `timeline_context` and `previous_chapter_hook` before chapter generation.
- Extract key events after prose generation and validate timeline consistency.
- On detection failure, output problems to the chapter-repair chain — do NOT directly edit prose.

A failed chapter should keep its prose and mark `needs_repair`, but MUST NOT commit the events from failed prose as `occurred` timeline, to avoid polluting later context.

## Current Rules

- `StoryTimelineEvent` manages global event order, distinguishing `planned` and `occurred`.
- `ChapterTimeAnchor` manages what story-time the chapter is at, which events it carries, and which events are forbidden from happening early.
- `TimelineHook` manages hooks left by the previous chapter or earlier text; the current semantics split into two dimensions — `resolveMode` and `blocking`: only `immediate + blocking` enters hard-blocking; `short_arc` and `long_arc` only enter hints or low-priority constraints.
- `TimelineCheckReport` records each post-prose detection result, shown by the task center and the chapter editor.
- `timeline_context` is REQUIRED context for chapter writing; `recent_chapters` may still serve as auxiliary memory but CANNOT replace the timeline constraint.
- Timeline extraction uses structured AI output; the detector only makes deterministic judgments on structured events, hooks, and state changes.
- `autoReview=false` does NOT affect timeline detection. Timeline detection is part of the chapter acceptance gate and does NOT depend on complete quality-review facts.
- On detection failure, do NOT commit `occurred` events; only on pass or warning may extracted events and new hooks be committed.
- Auto-repair is handled by the existing chapter-repair chain; the timeline module only provides the problem list and repair suggestions.
- The chapter acceptance gate runs `acceptance` and `timeline` in parallel and gate-caches by same-chapter same-content-hash, to avoid re-triggering the same detection.
- A long-arc hook that is partially addressed by the prose should be marked handled or reached, not continue to be treated as a hard-blocking must-resolve-next-chapter.

## Failure Modes

- Chapter N writes out an event that should only happen in chapter N+M: check whether `forbiddenEvents` entered `timeline_context`, and whether the checker outputs `future_event_leak`.
- The next chapter skips the previous chapter's closing hook: check whether `TimelineHook` is still `open` and whether `previous_chapter_hook` is retained by the Prompt Context; if it is `short_arc` or `long_arc`, prioritize checking whether it was wrongly upgraded to `immediate + blocking`.
- Character state rolled back: check whether the previous round of `occurred` events' `stateChanges` recorded the confirmed state.
- Detection failed but later chapters still reference polluted events: check whether the failed chapter wrongly committed an `occurred` timeline.
- Timeline detection long-warning: check whether the extractor prompt cannot extract the chapter time anchor, or whether the chapter plan itself lacks time labels.

## Related Modules

- `server/src/modules/timeline/`
- `server/src/services/novel/runtime/GenerationContextAssembler.ts`
- `server/src/services/novel/runtime/ChapterRuntimeCoordinator.ts`
- `server/src/prompting/prompts/novel/chapterWriter.prompts.ts`
- `server/src/prompting/prompts/novel/timelineExtractor.prompts.ts`
- `shared/types/timeline.ts`

## Source Documents

- Current timeline-constraint-layer development plan
- [Chapter Production Chain](./chapter-production-chain.md)
- [Module Boundaries and Documentation Governance](../architecture/module-boundaries.md)

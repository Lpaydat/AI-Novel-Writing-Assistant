# Chapter Identity & Planning Extension Boundary

## Background

Pacing-based chapter splitting and chapter execution long maintained separate chapter lists. Pacing splitting uses the `VolumeChapterPlan` in the volume workspace; chapter execution uses the formal `Chapter`. This model protects planning state from execution state, but when the two sides are joined only by chapter order, title, and manual sync, users see internal steps like "splitting generated but the execution area not updated," and auto-director recovery decisions get more complex.

The full novel production chain needs to converge "what a chapter is" onto a single identity while preserving the distinct responsibilities of "how a chapter is planned" and "how a chapter is executed."

## Decision

`Chapter` is the **single chapter identity and execution main entity**. `VolumeChapterPlan` is a volume-level pacing planning extension and should point to the corresponding `Chapter` via `chapterId` wherever possible.

For the short term, compatibility fields such as title, summary, and task sheet remain on `VolumeChapterPlan`, but the backend read/write rules treat `Chapter` as canonical:

- Formal chapter fields follow `Chapter`: chapter order, title, body text, execution status, target word count, conflict level, reveal level, forbidden items, task sheet, scene cards, and quality status.
- Planning extension fields follow `VolumeChapterPlan`: volume ownership, pacing segment, chapter purpose, exclusive events, end-of-chapter state, next-chapter entry state, and payoff references.
- Old planning entries without a `chapterId` may exist only as compatibility state; the service layer should preferentially back-link them by chapter order and title and write the result back to the volume workspace.

## Current Rule

When the volume workspace is read, it aligns formal chapters by `chapterId` and hydrates the planning view from the formal chapter fields. Old data without a `chapterId` is matched to a formal chapter by chapter order as a fallback.

Volume splitting, chapter-list generation, and auto-director chapter-split refinement should automatically maintain formal chapter records and write back `VolumeChapterPlan.chapterId`. The user's main flow must not require understanding or clicking "sync to chapter execution."

`/volumes/sync-chapters` is retained as a compatibility repair and diagnostics entry point. Its primary job is to repair chapter linkage and fill execution entry points; it must not become a required step in a beginner's main flow.

## Failure Modes

- If a planning chapter has a `chapterId`, it must not be mis-bound to a different formal chapter just because the title matches.
- If a formal chapter already has body text, split reordering or linkage repair must not clear the text or reset execution status by default.
- If old data has no `chapterId` and the order/title cannot be matched reliably, create a new formal chapter and write back the link — do not silently leave the planning entry dangling.
- If an execution-contract quality gate fails, it should block linkage to the chapter execution area and indicate which specific chapter is missing planning information.

## Related Modules

- `VolumeChapterPlan.chapterId` links to the formal `Chapter`.
- Volume workspace read/save is maintained by `NovelVolumeService` to preserve canonical fields.
- Chapter linkage repair is handled by `VolumeChapterSyncService` and `buildVolumeSyncPlan`.
- The frontend pacing split and chapter execution are two views of the same chapter identity — not two lists the user must sync manually.

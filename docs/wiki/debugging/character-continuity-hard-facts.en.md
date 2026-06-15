# Character Continuity and Hard-Facts Investigation

## Background

Chapter-continuity problems are not all timeline problems. The timeline can constrain event order, chapter hooks, and in-story time, but a character's identity, faction, realm, current location, and action-availability are character-fact sources. If these facts are not stably generated at the character-preparation stage and do not enter the writer context before prose generation, post-hoc audit can only discover the problems — it cannot stop errors from entering the draft.

Typical symptoms:

- A character's full profile has `personality / background / development` empty for a long time, so the character can only enter later planning as a role-slot or a short description.
- Character faction or identity tags are missing, and the prose mis-writes "Shen Gongbao of the Chan teaching" as "an outer disciple of the Jie teaching."
- Character realm or power level is missing, and the prose mis-writes "Da Luo Golden Immortal Zhao Gongming" as "late True Immortal."
- Existing character state did not enter pre-generation constraints, so the prose needs audit or repair to backstop.

## Diagnostic Conclusion

The root cause of empty fields in the character's full profile is NOT a missing database column. The `Character` table already has `personality / background / development`, but the core-roster structured output and persistence chain did not require or save these three; the supplementary-character chain already had similar fields, so the two character entry points are structurally inconsistent.

The root cause of character faction and realm errors should NOT be attributed to the timeline either. The timeline only knows whether an event occurred and whether a hook was closed; it cannot natively judge "whether Shen Gongbao belongs to the Chan or Jie teaching" or "what realm Zhao Gongming is currently at." These MUST enter the character library and the writer required context as character hard facts.

## Current Rules

- The core character roster and supplementary characters should output a consistent character-profile field set: `personality / background / development`.
- Character hard facts include at least: `identityLabel`, `factionLabel`, `stanceLabel`, `powerLevel`, `realm`, `currentLocation`, `availability`, `prohibitions`.
- Character hard facts are writing constraints; they do NOT replace `CharacterTimeline`, `CharacterDynamics`, `StoryStateSnapshot`, or the timeline module.
- `participant_subset` only carries soft character profiles and current-participating-character summaries; it does NOT carry inviolable fact constraints.
- Before the writer, `character_hard_facts` required context MUST be present. Even when empty, the block must exist; the empty state must clearly instruct not to fabricate-rewrite character identity, faction, realm, location, or action-availability.
- Character visible-profile data is a visualized character asset that should be filled before entering prose, including `appearance / physique / attireStyle / signatureDetail / voiceTexture / presenceImpression`. When auto-applying a character roster, if these fields are empty, fill them using the current task's or page's selected LLM settings, to avoid falling back to an unconfigured or unstable-default model path.
- When an old character already has manually edited content, auto-applying a roster may ONLY fill empty fields — it MUST NOT overwrite the user-filled profile and hard facts.
- Audit remains a post-detection and repair input, but CANNOT be the primary source of character facts.

## Investigation Path

1. First check whether `personality / background / development` in the character library are empty. If the core characters are empty but supplementary ones are not, prioritize the roster schema and `applyCharacterCastOption()`.
2. Then check whether character hard facts enter the runtime context. Focus on `GenerationContextPackage.characterHardFacts` and the `character_hard_facts` writer block.
3. If the prose shows faction or realm errors, first judge whether the character library has the corresponding hard facts; if not, fix the character-preparation chain; if it does but the writer did not receive them, fix context assembly.
4. If the writer received hard facts and still wrote them wrong, then enter audit, repair-prompt, or model-compliance investigation.
5. If the character-edit page's visible-profile data shows "to be filled" for a long time, first manually trigger single-character or batch fill with the current task model to validate prompt capability; if manual works but auto-apply still leaves it empty, prioritize checking whether the roster-application chain passes `provider / model / temperature` to the visible-profile fill service.

## Failure Modes

- Detecting "faction error" only at the audit stage, when the writer input had no faction facts: the draft keeps making the error.
- Putting faction only in `character_dynamics`: the dynamic projection may be empty or trimmed, and cannot carry the hard constraint.
- Relying only on timeline state: the timeline can find event-order errors but cannot stably infer a character's faction and cultivation level.
- Not carrying the current LLM settings when auto-applying a roster: visible-profile fill takes the default model path, possibly showing as long task waits or empty after persistence.
- Auto-applying a roster overwrites manual edits: this breaks character settings the user already corrected.

## Related Modules

- `server/src/prompting/prompts/novel/characterPreparation.*`
- `server/src/services/novel/characterPrep/`
- `server/src/services/novel/characterProfile/CharacterVisibleProfileService.ts`
- `server/src/services/novel/characters/characterHardFacts.ts`
- `server/src/services/novel/runtime/GenerationContextAssembler.ts`
- `server/src/prompting/prompts/novel/chapterLayeredContext.ts`
- `server/src/prompting/prompts/novel/chapterWriter.prompts.ts`
- `server/src/modules/timeline/`

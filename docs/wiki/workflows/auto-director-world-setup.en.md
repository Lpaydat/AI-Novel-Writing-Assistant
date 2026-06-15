# Auto-Director Per-Book World Preparation

## Background

The auto-director's main goal is to help a beginner go from book-level direction to a "ready to write" state. A world is not required for every genre, but in strongly-setting-driven projects — fantasy, sci-fi, mystery, Cthulhu — characters, factions, locations, and conflicts must be generated under one set of world constraints. If character preparation runs before world preparation, the characters lack faction, stage, and rule boundaries, and adding the world later causes setting drift.

## Decision

The auto-director planning chain is fixed as:

`Story Macro -> Book Contract -> Per-book world preparation -> Character preparation -> Volume strategy -> Chapter task sheet`

Per-book world preparation sits AFTER Book Contract, because the world should obey the whole-book commercial promise, reader expectations, and inviolable constraints; it sits BEFORE character preparation, because the character roster needs to read the factions, locations, hard rules, and forbidden combinations from the world facade first.

## Current Rule

- When the user selects a reference world sample, the auto-director keeps that `worldId` and uses `WorldContextGateway` to ensure the per-book world instance and the character-usage `StoryWorldSlice` are available.
- When the user does not select a reference world sample, by default it auto-generates a per-book `NovelWorld` from the macro plan + book-level agreement, and does NOT save it to the external world library.
- When the user selects "do not use a world for now," `world_setup` completes as a no-op, and the Gateway may still return `null` later.
- When resuming from character preparation or a later stage, if world preparation is not complete and skip was not chosen, the safe start point falls back to `world_setup`.
- The auto-director depends ONLY on `WorldContextGateway`; it does NOT call the old novel-world generation entry directly, and does NOT push auto-generated results into the external world library.

## Failure Modes

- If the resume logic only checks the story macro plan, Book Contract, and character count, it may jump from `character_setup` past world preparation, leaving strong-setting projects' character generation without world constraints.
- If auto-generated worlds are saved to the world library by default, one-shot in-book settings pollute the general world samples and introduce unnecessary sync semantics.
- If character preparation reads old flat fields directly, it bypasses the per-book world slice, making the import-world, generate-world, and skip-world paths behave inconsistently.

## Related Modules

- `server/src/services/novel/director/novelDirectorPipelineRuntime.ts`
- `server/src/services/novel/director/workflowStepRuntime/directorPlanningStepModules.ts`
- `server/src/services/novel/director/recovery/novelDirectorRecovery.ts`
- `server/src/services/novel/worldContext/WorldContextGateway.ts`
- `client/src/pages/novels/components/NovelAutoDirectorSetupPanel.tsx`

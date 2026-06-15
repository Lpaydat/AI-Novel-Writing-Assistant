# World Skeleton Generation Flow

## Background

The world library's default creation flow targets writing beginners. The old flow was mainly layered fields and form-style completion; the user had to understand the responsibilities of `background`, `geography`, `factions`, etc. to judge whether a world is usable for novel writing. This raises cognitive load and leaves the world setting under-loaded on factions, locations, relationships, and opening entry points.

## Decision

The default world-generation flow takes the "world skeleton" as the main product, not the old flat-field draft. The flow is:

`world intent -> world scale -> skeleton preview -> save world`

Skeleton generation directly produces structured world data: core rules, alignments, specific factions, key locations, faction relationships, location connections, story entry points, and a completeness diagnosis. The old flat fields are only a compatibility display, derived from the structured data.

## Current Rules

- The default entry uses `world.skeleton.generate@v1`.
- The user can choose three scale presets: `Light Stage`, `Standard Long-form`, `Complex Ensemble`.
- The user can fine-tune core rules, alignment direction, specific factions, key locations, relationships/conflicts, and the number of story entry points.
- The generation result MUST satisfy count constraints — especially faction and location counts no less than the user requested.
- Locations MUST carry drawable-map info: relative coordinates, direction hint, risk, controlling faction, and story role.
- Faction relationships and location connections MUST enter structured relations, not rely on later visualization ad-hoc guessing.
- Layered generation is retained as a hole-filling and local-rewrite capability in the world manual, NOT as the default creation main flow.
- For a world that already has a trusted skeleton, six-layer organization MUST derive a Chinese writing summary from the structured skeleton; it MUST NOT re-call the old layered Prompt to generate a second set of world content.
- A structure with `metadata.seededFrom=legacy-text` only represents reverse-inferred old fields; it CANNOT serve as a trusted master source overriding the six-layer summary, to avoid old-field JSON text or dirty data reverse-polluting the world skeleton.

## Failure Modes

- If the Prompt only returns old fields or encyclopedic paragraphs, the wrong old `world.draft.generate@v1` was called.
- If faction count or location count does not match the user's settings, fix the Prompt schema or postValidate — do NOT hide the gap in the front end.
- If the map can only lay out in a ring, prioritize checking whether `locations` lack `x/y/directionHint`, and whether `relations.locationConnections` is empty.
- If RAG mixes in irrelevant knowledge-base content, check whether the world-generation call only passes the reference context the user explicitly selected.
- If clicking "re-organize six-layer summary" yields JSON, bracket fragments, abnormal faction names, or a sudden drop in location count, prioritize checking whether `structureJson.metadata.seededFrom` was changed to `legacy-text` by the old layered flow; recover from a trusted snapshot or the skeleton source rather than continuing to generate from a polluted structure.

## Related Modules

- `shared/types/worldWizard.ts`
- `shared/types/world.ts`
- `server/src/prompting/prompts/world/worldDraft.prompts.ts`
- `server/src/services/world/worldSkeletonGeneration.ts`
- `client/src/pages/worlds/WorldGenerator.tsx`

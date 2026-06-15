# World Context Gateway and Novel World Boundary

## Background

The world module used to feed the generation chain through multiple sources at once: external `World` binding, `StoryWorldSlice`, `Bible.worldRules`, `canonicalState.worldState`, and several legacy flat fields. Multi-source injection lets the same novel see different world constraints across character generation, macro planning, chapter generation, and the repair chain — ultimately showing as character identities detached from the world, chapters inventing rules on the fly, and weak world participation.

The long-term direction of the world-module redesign is to split it into two layers: the external world library stores reusable world samples, and the in-novel world stores the per-book world instance. The generation chain should NOT read these two layers' internal table structures directly; it should get the world context the current task needs through a unified facade.

## Decision

On the server side, `WorldContextGateway` is the single convergence entry for the generation chain to read world info. `NovelWorld` carries the novel world instance; the facade first ensures the per-book world copy exists, then trims it via `StoryWorldSlice` into context blocks usable for different generation purposes. Callers like characters, outline, and chapters depend only on the facade and do not need to perceive whether the world came from the external world library, per-book generation, custom creation, or migration-period legacy-field initialization.

`NovelWorld` is the in-novel world instance. It is NOT a direct reference to the external `World`; it is the per-book copy after import from the external world library, generation from the novel theme, or manual creation. During the current migration, `Novel.worldId` and `Novel.storyWorldSliceJson` legacy fields are retained as compatibility sources, but the new world-context gateway syncs the old fields into `NovelWorld`; the generation chain should gradually read only `NovelWorld`.

Current rules:

- When the generation chain needs world info, call `WorldContextGateway.getWorldContextBlock(novelId, { purpose })`.
- `purpose` MUST be explicit — `outline`, `character`, `chapter`, `bible`, or `optimize`; the facade formats the same world slice by purpose.
- When no world is available, return `null`; the generation chain degrades gracefully and does NOT treat a missing world as an error.
- When building a `StoryWorldSlice`, it MUST read `NovelWorld.structuredDataJson` and `NovelWorld.bindingContractJson` first. Only when the novel has no `NovelWorld` yet may it fall back to the legacy `Novel.worldId -> World` path.
- Writing the `StoryWorldSlice` cache MUST NOT refresh `NovelWorld.updatedAt`. `updatedAt` means the per-book world content changed; import, generation, sync, etc. update it; slice-cache writeback only updates `storySliceJson`, `storySliceBuiltAt`, and `storySliceDigest`.
- `Bible.worldRules` is only retained as Bible document content; the authoritative source for character generation is `WorldContextGateway`.
- The chapter runtime's `supportingContextText` MUST inject the per-book world block produced by `WorldContextGateway` first; Bible text MUST NOT inject `worldRules` as a parallel world constraint.
- `canonicalState.worldState` is a chapter continuity record; it may only be used as a conservative hint when there is no `StoryWorldSlice`, and the copy MUST be marked as "continuity record" — it MUST NOT override the per-book world slice.
- `GenerationContextAssembler` MUST write the `rawSlice` returned by `WorldContextGateway.getWorldContextBlock(..., { purpose: "chapter" })` into `contextPackage.storyWorldSlice` and place the `promptBlock` into the chapter `supportingContextText`. The relevant boundary is covered by `generationContextAssembler.test.js`.
- Character generation prioritizes the `purpose="character"` world context, highlighting active factions, character identity boundaries, location pressure, and forbidden pairings.
- Character visible-profile completion is also part of the character-generation chain and MUST use the `purpose="character"` per-book world context, so attire, identity markers, race/profession appearance do not detach from the world manual.
- Character-roster plans and supplementary-character generation MUST provide a `useWorldContext` switch, ON by default. When the user turns it off, the generation chain skips `WorldContextGateway` and generates characters only from book-level info, story mode, existing characters, and user instructions.
- A roster plan may carry `worldFocusHints` to express which factions the user wants to prioritize, and whether to enforce identity, ability-source, faction, location, and taboo-pairing checks. This hint may only SUPPLEMENT the Gateway's per-book world context; it MUST NOT replace or override the per-book world rules.
- `NovelWorld.sourceType` distinguishes `imported`, `generated`, `manual`; do NOT judge the user's current world source by `Novel.worldId` alone anymore.
- Sync-related fields are OFF by default; any push-back from the novel world to the external world library, or pull-update from the world library, MUST be manually confirmed by the user.
- The in-novel world UI should prioritize calling `GET /api/novels/:id/novel-world` to show the current per-book world source and status.
- Importing from the external world library into the novel calls `POST /api/novels/:id/novel-world/import`; the backend copies the world structure into `NovelWorld` and clears the stale story-slice cache, awaiting the next per-book-content re-trim.
- When the user has not selected an external world-library sample, or wants the system to first build a stage for the book, call `POST /api/novels/:id/novel-world/generate`. This flow MUST generate a structured world via the registered PromptAsset `novel.world.generate_from_theme@v1`; it MUST NOT forge a world with fixed keywords or genre branches.
- If the orchestration layer needs to create the per-book world during generation-chain prep, it should prioritize `WorldContextGateway.generateWorldFromNovelTheme(novelId, options)` and NOT depend directly on `NovelWorldInstanceService`'s internal methods. HTTP routes may keep the existing interface through an application service, but the abstraction entry for the generation chain and workflow orchestration should be the Gateway.
- "Generate by book theme" creates only the in-novel `NovelWorld` by default. Only when the user explicitly checks "save to world library" does the backend create an external `World` and point `NovelWorld.sourceWorldId` at that world sample.
- For a per-book world with no source world, the user may call `POST /api/novels/:id/novel-world/save-to-library` to save it as an external world-library sample. After saving, `sourceWorldId` points to the new sample and two-way sync is ON by default; if the request sets `syncEnabled=false`, only the source is recorded and sync-diff is not auto-prompted.
- Manual sync uses `GET /api/novels/:id/novel-world/sync-diff` to view the diff, then `POST /api/novels/:id/novel-world/sync` to execute `push` or `pull`. Sync granularity is by structural partition: world overview, core rules, alignments, factions, locations, relationship network.
- As long as the per-book world has an associated world-library sample, the front end can read `sync-diff` to show a diff summary; `syncEnabled=false` only means no auto-sync-relationship prompt — it MUST NOT block the user from manually viewing the diff or re-running `push` / `pull`.
- The sync-diff summary should explain to the user where the two sides actually differ — e.g. which rules/factions/locations the per-book world has, and which corresponding content the world-library sample has. Do NOT return only developer-view descriptions like "field inconsistent."
- The user may turn off the sync prompt via `direction=none`. The per-book world still keeps `sourceWorldId` as a source record, but `syncEnabled=false` and `syncDirection=none`; pending-sync diff is not auto-computed afterward; the user may still manually run `push` or `pull` to reopen the sync relationship.
- `sync-diff` writes the latest diff summary into `NovelWorld.syncPendingChangesJson` for the novel-world card to show pending partitions. This field only records "the pending-sync diff the system found"; it does NOT represent auto-sync and MUST NOT be a generation-chain world source.
- Every `push` or `pull` MUST write a `WorldSyncRecord`. The novel-world view reads only the most recent few sync records as explanatory history, helping the user judge which active syncs happened between the per-book world and the world-library sample.

## Boundary

`WorldContextGateway` is responsible for:

- Ensuring or refreshing the per-book `StoryWorldSlice`.
- Converting the world slice into a `WorldContextBlock` the generation chain can use directly.
- Providing `generateWorldFromNovelTheme` for automated orchestration to create an in-novel world copy when there is none.
- Outputting different `worldRulesText` and `worldStageText` emphases by call purpose.
- Isolating callers from the legacy `World` flat fields, the future `NovelWorld` entity, and their dependencies.
- Letting callers see only "per-book world context," without knowing whether it came from a novel world copy, an old world-library binding, or a migration-period slice cache.

`WorldContextGateway` is NOT responsible for:

- Editing the external world library.
- Deciding whether the user syncs the novel world back to the world library.
- Generating maps, faction graphs, or world-asset images. World assets are carried by `WorldAsset` independently; the Gateway only provides the text context the generation chain needs.
- Directly modifying characters, chapters, or Bible content.

Readiness state and flow guidance may read `NovelWorld`'s lightweight state to judge whether "world foundation" and "rule boundaries" are sufficient to continue planning. This read only serves user guidance and gap hints; it CANNOT replace `WorldContextGateway` participating in the world-context assembly for the character/outline/chapter/repair chain.

The world module's product entries should also keep clear boundaries:

- The external world-library page is a "world sample library," for browsing, generating, organizing, and maintaining reusable world samples.
- The external world-library page MUST explain how samples are used: first organize a general world manual in the sample library, then import it as a per-book world copy from the novel basic-info page, then let the user manually decide sync between sample and copy. Do NOT let the user think external samples directly drive novel content.
- The external world-library card's primary action should enter the world workbench or world manual, NOT route the user to other creative entries.
- An existing world sample's "view world manual" entry in the external world library MUST always be available. The generation-wizard toggle may only control the new/generate entry; it MUST NOT hide the view/manage entry for existing worlds.
- The world-sample creation entry should appear as a step-by-step "create world sample" wizard: first explain the world, then choose the world skeleton, then confirm core rules. Genre, inspiration, reference works, generation preferences, template skeletons, and attribute checkboxes all serve these three steps and should NOT be piled into a config form on the first screen.
- When a novel needs to use a world, import it as an in-novel `NovelWorld` copy from the novel basic-info page's "Per-book World" card.
- The "Per-book World" card should first show a clear next action, then let the user choose a source path or handle sync: with no per-book world, guide to choose a source; with a per-book world but no usage scope, guide to organize the per-book usage scope; with an associated sample, allow opening the source world manual; with a diff, guide to handle the sync diff. Do NOT mix the import dropdown, custom input, generate options, sync, and save actions at the same level.
- The "Per-book World" card's status copy should be expressed around per-book usage scope, source copy, manual sync, and world-asset readiness. Do NOT write the card as a character/outline/chapter production-chain explanation; the generation chain only consumes world context loosely through the Gateway and is NOT this UI's main narrative.
- The novel basic-info page's main form MUST NOT show the external world-sample dropdown as the main path anymore. The compatibility `Novel.worldId` selection may only sit in advanced settings and clearly state that the world the novel actually uses comes from the "Per-book World" card.
- The novel basic-info page's "world boundaries around this book" should be shown as a direct workspace after per-book world, not hidden in style or other collapsed areas. The user needs to directly see how the per-book world trims out organizations, locations, and rules to understand how the world enters novel generation.
- The world workbench first screen should prioritize the world manual, core rules, main factions, story stage, and key tensions; form-style structured editing, layered drafts, reference materials, and import/export are secondary entries.
- The world-sample layered-generation result MUST project to `World.structureJson` and `bindingSupportJson` in sync. Legacy flat fields may serve as compatibility storage, but the world manual, faction graph, map, and novel import should all read the structured manual; there MUST NOT be a state where `factions/geography/conflicts` are generated but the structured manual is still at wizard placeholders.
- The world-workbench edit entry should first enter "organize world manual," helping the user organize around core rules, main factions, story stage, and key tensions. Advanced-field maintenance may only be an advanced entry the user opens actively.
- The world-workbench default tab MUST be "organize world manual." "View manual/visualization" is a preview entry and MUST NOT be the edit-page default first screen, or the user will think the world module is still a read-only overview or a backend field system.
- Input controls in the world-manual editor MUST carry author-perspective paragraph titles and story-purpose hints, e.g. "one-sentence world impression," "rules overview," "the pressure this brings to the story." Do NOT pile bare `Input`/`textarea` into field forms.
- Advanced-field maintenance as a secondary entry should also progressively show partitions by "world overview / rules center / alignments & factions / locations & terrain / relationship network"; partition buttons MUST NOT be mere visual tabs — they MUST actually lower the on-screen form density.
- A complex partition in advanced-field maintenance should be split into owned section components. Alignments & factions are carried by `workspace/structure/WorldFactionsSection`; the relationship network and novel-usage suggestions by `workspace/structure/WorldRelationsSection`; later high-density partitions like locations and rules should follow the same section-component boundary.
- Layered drafts as a generation-and-revision entry should be presented as "layer selection + current-layer editor." Keep the six-layer status overview and one-click generate, but do NOT expand six long text boxes at once.
- Materials, reference materials, and versioning belong to the world-workbench toolbox and should be presented as "tool selection + current tool panel." Map and graph asset planning is this toolbox's default entry; reference materials, material library, snapshots, export, and import MUST NOT all fill the page.
- Manual fill should appear as a per-question "fill world-manual blanks" workflow. The left shows question progress; the right only answers the current question; do NOT expose internal fields like priority/target/status to the user.
- Manual health-check should first show check status, score, pending count, and summary, then handle items one by one as "problem list + current-problem handling"; do NOT expand all problem reports at once.
- An empty or unstructured world should also show the world-manual skeleton, guiding the user to fill rules, factions, locations, and tensions — it MUST NOT fall back to a plain field list as the main experience.
- The world manual should show map-and-graph asset entries. World map, faction graph, world timeline, and power-system tree may appear as reserved entries first, and hint "organizable" or "to fill" by location/faction/rule/tension completeness. These entries only indicate visualization-asset direction and do NOT replace the world manual as the generation-chain authoritative source.

When production state and the whole-book production entry judge "whether world assets are complete," they should prioritize identifying the in-novel `NovelWorld`. The external `World` binding is only a compatibility source; a per-book generated or custom world with no `sourceWorldId` should also be treated as a usable per-book world.

Cover and visual prompts are also part of the world experience. The novel-cover prompt needs to read the per-book world summary, active factions, and stage locations through `WorldContextGateway`, then degrade to the legacy `Novel.storyWorldSliceJson`; it MUST NOT generate visual atmosphere from only the external world sample or the old slice.

`NovelWorldInstanceService` owns the novel-world-instance source conversion:

- `importFromWorldLibrary`: copies an external `World`'s structured settings into the per-book copy.
- `generateFromNovelTheme`: reads the novel title, summary, target reader, selling points, first-30-chapter promise, commercial tags, genre, and story mode, calls the registered prompt to generate the per-book world copy.
- Saving to the world library is an optional branch of `generateFromNovelTheme`; when not saved, it clears the stale `Novel.worldId` to avoid legacy modules thinking it still binds an external world.
- Every import or generation clears the stale `StoryWorldSlice` cache; the slice service later re-organizes the settings range that enters the generation chain from the current per-book world.
- `getSyncDiff` and `syncWithLibrary` only handle explicit sync between the per-book world and its source world-library sample. They do NOT participate in LLM generation-context assembly and do NOT auto-overwrite user edits.
- `pull` writes the selected world-library partitions into `NovelWorld` and clears the stale `StoryWorldSlice`; `push` writes the selected per-book-world partitions back to the external `World` and increments the world-library version.

## Read Priority

The facade's internal priority is:

1. Read the current novel's `NovelWorld`.
2. Build or reuse a `StoryWorldSlice` from the `NovelWorld`'s structured content.
3. Return a `WorldContextBlock`.
4. With no `NovelWorld`, the migration period may initialize/fall back from the legacy `Novel.worldId`.
5. If still no usable world, return `null`.

Sync between the external world library and the novel world should stay user-manually-confirmed; diff comparison and field-level sync are handled by a separate `WorldSyncService` and should NOT enter the generation-chain facade.

## World-Asset Reservation

`WorldAsset` is the world module's extension point for map and graph capabilities. It can hang on an external `World` sample or on the in-novel `NovelWorld` copy; the two MUST NOT be implicitly overwritten by auto-sync. Later maps, faction graphs, world timelines, character relationship networks, and power-system trees should all write to `WorldAsset.renderDataJson`, NOT back into `World.structureJson` or `NovelWorld.storySliceJson`.

The in-novel world view returns an `assets` summary via `GET /api/novels/:id/novel-world`. The backend merges the per-book `NovelWorld` assets and the source `World` sample assets, and returns standard placeholders for map, faction graph, world timeline, character relationship network, and power-system tree. When multiple records exist for the same asset type, the summary keeps the latest record by update time. The front end should render this summary and should NOT decide on its own which asset types exist on the in-novel world page or hardcode asset status into fixed copy.

The external world-sample workbench should also show map-and-graph asset planning, but before a backend asset-summary API exists, it may show only fixed reserved entries and organization prerequisites. This entry helps the author understand "which visualization assets the world manual can settle into"; it CANNOT replace `WorldAsset`'s formal asset list and CANNOT be a generation-chain authoritative source.

Current asset-type conventions:

- `map`: world map — regions, connectivity, faction control areas, story settings, conflict heat.
- `faction_diagram`: faction graph — faction nodes, ally/hostile/vassal/rival relations, power comparisons.
- `timeline`: world timeline — historical events, current situation, later changes.
- `character_network`: character relationship graph — characters, faction membership, relationship tensions.
- `power_system_tree`: power-system tree — levels, resources, costs, taboos, breakthrough boundaries.

These assets are display-and-edit assets, NOT generation-chain authoritative sources. Chapter, character, outline, and other LLM calls still read the per-book world slice through `WorldContextGateway`; if assets are to participate in generation later, they should first be summarized into `NovelWorld` or `StoryWorldSlice`, then output by the Gateway.

## Current Migration-Period API

- `GET /api/novels/:id/novel-world`: returns whether the novel already has a novel-world instance, source type, source world id, sync status, last sync time, pending-sync partitions, recent sync records, and whether structured data and a Story Slice exist.
- `GET /api/novels/:id/novel-world` also returns a lightweight `handbook` projection for the front end to show a "world manual": world overview, core settings, main factions, per-book stage, and key tensions. This projection comes from `NovelWorld.structuredDataJson`; the front end should NOT parse internal structure fields directly.
- `handbook.generationGuidance` is a user-facing explanatory projection, used to describe which character identity boundaries, story-scope leads, scene-rule constraints, and boundary-check basis this per-book world can provide. It only explains the existing structured world and is NOT a new generation-chain context source; the text that actually enters the LLM is still output by `WorldContextGateway`.
- `GET /api/novels/:id/novel-world` also returns an `assets` summary for showing entries like world map, faction graph, world timeline, character relationship network, and power-system tree. With no generated assets, the backend returns placeholder status and the front end only renders.
- `POST /api/novels/:id/novel-world/import`: imports an external world-library world as the per-book copy. After import, `Novel.worldId` is still updated for legacy-module compatibility, but the new authoritative copy is `NovelWorld`.
- `POST /api/novels/:id/novel-world/manual`: creates a per-book custom world not associated with the world library and not auto-syncing. The backend generates a minimal structured world manual, clears the stale Story Slice, and awaits the user adding rules, factions, and story stage.
- `POST /api/novels/:id/novel-world/generate`: generates the per-book world copy from the novel theme. The request may carry `saveToLibrary`; when `true` it also creates an external world-library sample, when `false` it saves only inside the book.
- `POST /api/novels/:id/novel-world/save-to-library`: saves a per-book world with no source sample as an external world-library sample and re-associates the per-book world to that sample.
- `GET /api/novels/:id/novel-world/sync-diff`: compares the per-book world copy with the source world-library sample and returns presentable partition diffs.
- `POST /api/novels/:id/novel-world/sync`: executes sync after the user specifies `direction=push|pull` and an optional partition list.
- `GET /api/novels/:id/world-slice` and related refresh endpoints are temporarily retained, for viewing and refreshing the `StoryWorldSlice` that actually enters the generation chain.

Later UI should NOT keep using "bind world view" as a single dropdown concept; it should show three entries: import from world library, generate by novel theme, customize per-book world. All three currently converge on the `NovelWorld` copy; the generation chain keeps reading world context only through `WorldContextGateway`.

The novel-workbench basic-info page uses the "Per-book World" card as the world entry. It shows whether a novel-world copy exists, source type, sync status, and usable-slice status, and offers actions like "choose world source," "organize per-book usage scope," "open source world manual," "sync management," "save as world sample." The reference world sample in basic-info advanced settings is only for initial reference and migration-period defaults; it MUST NOT be shown as the main path for the novel's actually-used world.

Front-end component boundaries:

- `NovelWorldManagerCard` owns only the per-book world overview, world-manual projection, world-asset entries, sync status, and sync management.
- Per-book world source selection, import-from-sample-library, generate-by-book, and custom-blank-manual belong to `novelWorld/NovelWorldSourcePanel`, so the main card does NOT keep ballooning into a multi-flow mixed component.
- Later new asset actions like "map generation," "faction-graph generation" should go into a world-asset sub-component or an independent asset panel; they MUST NOT keep being stuffed into the `NovelWorldManagerCard` top level.

## Related Modules

- `server/src/services/novel/worldContext/WorldContextGateway.ts`
- `server/src/services/novel/worldContext/NovelWorldInstanceService.ts`
- `server/src/services/novel/storyWorldSlice/NovelWorldSliceService.ts`
- `server/src/modules/novel/setup/http/novelWorldSliceRoutes.ts`
- `client/src/pages/novels/components/NovelWorldManagerCard.tsx`
- `client/src/pages/novels/hooks/useNovelWorldSlice.ts`
- `server/src/services/novel/characterPrep/CharacterPreparationService.ts`
- `server/src/services/novel/characterPrep/characterCastGeneration.ts`
- `server/src/services/novel/characterPrep/characterPreparationSupplemental.ts`

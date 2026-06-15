# Novel Cover Main-Image Generation Chain

## Background

Novel-cover generation is a typical cross-domain capability: the entry point is on the novel-edit page, but task creation, image generation, asset storage, failure recovery, task-center display, and primary-image switching naturally belong to the image domain. If provider selection, image-task state, or the cover primary-image source of truth were pushed directly into the `Novel` core module, later expansion to chapter illustrations, cover-layout export, and batch image tasks would quickly form bidirectional coupling.

Also, the project's main users are writing beginners. Cover V1 cannot require the user to write an image prompt from scratch, nor assume the model directly produces usable Chinese book-title fonts. So the current-stage goal is: first auto-organize a "cover main-image" input from the novel's basic info, then let the user keep editing manually after AI optimization.

## Decision

Cover capability keeps reusing the existing image-task / image-asset infrastructure; do NOT build a second "novel-cover task system." The image domain adds a `novel_cover` scene; the novel module only provides read-only materials and a UI entry point, and does NOT depend on image providers directly.

The Prompt also does NOT go through a service inlined string; it enters the Prompt Registry: first organize the novel info into a structured cover intent, then organize the structured intent into the final image prompt. This way, later expansion to cover layout, landscape posters, or channel assets does not require piling branches back in the novel service.

## Current Rules

- `ImageGenerationTask` and `ImageAsset` remain the unified image source of truth.
- When `sceneType=character`, a `baseCharacterId` is required and `novelId` is empty.
- When `sceneType=novel_cover`, a `novelId` is required and `baseCharacterId` is empty.
- V1 enforces the ownership rule only at the schema and route/service validation layer; no complex polymorphic DB check is introduced.
- The novel main table does NOT add a `coverImageAssetId`-style field. The cover is currently read from the image domain via `sceneType=novel_cover + novelId + isPrimary`.
- The cover gallery, primary-image switching, and the rule that deleting the primary auto-fills a new primary are all the image domain's responsibility.
- The novel-edit page only assembles read-only cover-draft materials: title, summary, target reader, selling points, competing feel, first-30-chapter promise, commercial tags, genre/advancement mode, world atmosphere, style feel.
- The default beginner path is fixed as "AI organizes first, then editable": generate the source brief first, then allow AI optimization, then allow manual edits to the final prompt.
- V1 generates only the cover main image without text; it does NOT promise to directly generate usable Chinese book-title fonts.

## Prompt Chain

### 1. Local draft organization

The front end and back end use the same set of cover-material field definitions:

- Title and one-line summary
- Target reader
- Core selling points
- Reading feel
- First-30-chapter promise
- Commercial tags
- Genre base
- Primary/secondary advancement mode
- World atmosphere or world-slice core frame
- Style, POV, pacing, emotional intensity

The front end uses these fields to prefill the cover input draft on the novel basic-info page; the back end uses the same semantics in `novelCoverPromptSupport` as a fallback, so the two ends do not generate two different cover inputs for the same book.

### 2. Structured cover intent

`image.novel_cover.brief@v1`

- Input: source prompt + novel read-only context
- Output: structured cover intent
- Purpose: let the model first judge the main visual focus, selling-point expression, composition direction, and emotional atmosphere — rather than directly producing a long final prompt

### 3. Final image prompt

`image.novel_cover.prompt_optimize@v1`

- Input: source prompt + structured cover intent + output language
- Output: the final text prompt sent to the image model
- Purpose: organize the "cover intent" into a final prompt suitable for the image model to consume, while leaving room for further manual editing

### 4. Image task creation

- When `promptMode=novel_cover_chain`, the image service fills in the cover-main-image-specific constraints
- Default size `1024x1536`
- Default count `2`
- Default negative constraints include text, book title, watermark, low clarity, deformity, etc.
- The current OpenAI-recommended image-model default is `gpt-image-2`, but the model name remains a configurable string; no whitelist is hardcoded in the business layer

## Task Center and Recovery

- The task center MUST render image tasks by `sceneType`.
- `character` tasks return to the character library.
- `novel_cover` task titles display as `Novel Cover: {title}`.
- `novel_cover`'s `sourceRoute` returns to `/novels/{novelId}/edit?stage=basic`.
- The task-detail `meta` MUST retain `novelId` for recovery and front-end positioning.

## Examples

Recommended:

- Show the current primary cover and cover gallery on the novel basic-info page, but all generation, primary switching, and deletion go through the `/images/*` API.
- If the current novel has no primary cover, after the first successful generation set the first image to `isPrimary=true` automatically.
- If a primary cover already exists, new images only enter the gallery; whether to replace the primary is the user's explicit decision.

Not recommended:

- Adding a hardcoded cover field to the `Novel` table while also keeping the image domain's `isPrimary` — forming dual sources of truth.
- Calling an image provider directly in the novel service, bypassing the image-task and recovery chain.
- Hardcoding the cover prompt as a front-end or service inlined string "for simplicity," bypassing the Prompt Registry.

## Failure Modes

- The cover shown on the novel page and the task-center recovery entry jump to different places: first check whether the `sceneType` routing is consistent, then check `ImageTaskAdapter`'s `sourceRoute`.
- After deleting the primary cover, "this book has no current cover" appears: the image domain's primary-backfill logic was bypassed.
- The front-end prefilled draft and the back-end optimized context are clearly inconsistent: first check whether the two ends do NOT reuse the same material-field set — especially commercial tags, advancement mode, and world-slice core frame.
- Cover logic starts to reverse-depend on the novel's provider config or the novel's persisted state: the boundary is broken; pull the logic back into the image-domain facade.

## Related Modules

- `shared/types/image.ts`
- `shared/imagePrompt.ts`
- `server/src/routes/images.ts`
- `server/src/services/image/ImageGenerationService.ts`
- `server/src/services/image/ImagePromptOptimizationService.ts`
- `server/src/services/image/novelCover/novelCoverPromptSupport.ts`
- `server/src/services/task/adapters/ImageTaskAdapter.ts`
- `client/src/api/images.ts`
- `client/src/pages/novels/components/cover/`

## Source Documents

- `AGENTS.md`
- `docs/wiki/architecture/module-boundaries.md`
- `docs/wiki/architecture/image-generation-providers.md`

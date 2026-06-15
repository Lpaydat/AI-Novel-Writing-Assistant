# Beginner-First and Whole-Novel Completion Principle

## Background

The project's main users are complete writing beginners. They typically do not know how to design structure, pacing, character arcs, foreshadowing, volume outlines, or chapter task sheets. The product cannot assume the user can manually fix long-form structure problems, nor throw complex expert judgments at the user.

Therefore the product goal is not to provide scattered writing tools, but to help the user keep advancing from a fuzzy inspiration to a complete novel.

## Decision

All product, UX, Prompt, agent, and runtime decisions prioritize "a beginner completes a whole novel." When expert flexibility conflicts with beginner completion rate, default to the option that lowers cognitive load, gives strong defaults, and offers a clear next step.

The AI should carry planning, judgment, scheduling, execution, tracking, and repair suggestions; deterministic code handles safety, idempotency, input validation, permissions, state persistence, and post-structuring processing.

## Current Rules

- Key pages should tell the user where things are, what the next step is, why this step is recommended, and which scope the risk affects.
- The auto-director, chapter production, and Creative Hub should all revolve around the whole-completion main chain; do NOT add complex branches that do not help the main chain.
- Product defaults should let a beginner keep moving forward; advanced options must not block the basic flow.
- In the auto-director, reader-channel tendency is an AI context hint, NOT a deterministic routing rule; by default the AI should judge from genre, selling points, and the starting idea itself.
- Inspiration aids for empty input boxes should stay low-coupling: they may temporarily generate reference text to help the user break a blank page, but unless the user explicitly copies or manually pastes, they MUST NOT be written into projects, tasks, auto-director seed payloads, or any long-term asset.
- The external world library should be presented as "reusable world samples," not raw field forms. List cards should prioritize the world overview, the number of core rules, factions, locations, relationships, and the rules/stages/conflict leads a novel can extract.
- The external world workbench overview page should show a "world manual" that first answers what this world is, which rules must be obeyed, which factions drive conflict, where the story happens, and which tensions a novel can extract. Field-level editing stays on the structured-settings page; it must not occupy the overview entry.
- The in-novel world should be shown as a "per-book world manual," helping the user understand which world this book uses, where it comes from, whether it can sync, and which rules enter the generation chain.
- In the novel page, "Per-book World" owns creating, importing, generating, and syncing the novel world copy; "world boundaries around this book" only confirms which rules, factions, and locations this book will actually use. The two entries must NOT both be written as "bind world view," or the beginner cannot tell the difference between an external sample, the per-book copy, and the generation-chain trim.
- The per-book world entry should offer three low-cognitive-load paths: import from the world library, generate by book theme, customize the per-book world. The custom entry creates a minimal world manual and does NOT require the beginner to fill complex fields first.
- The old `worldId` dropdown is only a compatibility field or an auto-director quick reference. The user-facing main world-management entry MUST be "Per-book World"; later features must NOT keep expanding the old dropdown into a world-management center.
- World maps, faction graphs, timelines, and power-system trees should be shown as "world assets" beside the world manual. Their role is to help the beginner SEE the world, not to require the user to first understand data-table fields.
- The world-asset entry may appear first as "to be generated," but the copy should explain that assets help organize regions, faction relationships, and power boundaries — not just show a technical "Coming Soon."
- After a failure, provide a recovery path, the local impact scope, and a next-step suggestion — not just an error.
- UI copy should describe the function and the next step from the user's perspective; do NOT write about implementation migration, architecture change, or "what we changed."
- Quality judgment, next-step recommendation, and the repair path should be done via AI-first structured understanding.

## Examples

Recommended:

- The auto-director panel shows the current stage, the await-confirmation points, the auto-approvable items, and the write scope.
- Chapter execution shows distinct states like "prose readable," "asset backfilling," "ledger calibrating," letting the user see the prose first, then watch background sync.
- Creative Hub, answering novel progress, first states real artifact progress, then adds background-task status and a recommended next step.
- A world-library card shows "power and rules," "faction stage," "story setting," "extractable conflict lines," letting the beginner first judge whether this world can support a novel, then enter the workbench to edit details.
- The world workbench overview shows "power and rules," "main factions," "story stage," "key tensions," "what novel generation should obey first," letting the user understand the world as a story environment rather than as a database-field check.
- The novel page's per-book world card shows three statuses — "source," "generation chain," "sync" — letting the user know where the current world comes from, whether it enters character/outline/chapter generation, and whether it manually syncs with the world library.
- The per-book world card offers "import from world library," "customize per-book world," "generate per-book world," letting the user first build the per-book copy, then gradually refine the world manual and boundaries.
- Beside the per-book world manual, show world-asset entries like "world map," "faction graph," "world timeline," "power-system tree," with short notes telling the user which understanding problem each asset solves.
- The basic-info and auto-director's old world-selection copy should read "world sample" or "reference world," and note that full import, generation, and sync happen in "Per-book World."

Forbidden:

- Requiring the beginner to judge whether to re-plan, repair a chapter, re-run characters, or revise the world.
- Showing the user internal refactoring, migration, or historical-implementation narration as product explanation.
- Expanding Creative Hub into a general chat tool without advancing novel completion.
- Stacking long fields like geography, culture, religion, economy, and history directly in the world-library list, forcing the user to understand the world like auditing a table.
- Repeating the structured-settings page's forms and long-text editors on the world-workbench overview, so the user cannot tell "understanding the world" from "maintaining fields."
- Continuing to use "bind world view" as the main entry on the novel page, conflating the external world-library sample, the per-book world copy, and the StoryWorldSlice trim result into one concept.
- Continuing to write "no world view bound" in generation-injection prompts, making the user think they cannot generate without choosing the old dropdown; the correct expression is "no usable per-book world context; generation will proceed from the novel's basic info first."

## Failure Modes

- The user sees many buttons but does not know the next step: check whether a single recommended action and reason are missing.
- The user thinks the task is stuck: check whether the front end shows real artifact progress, blocking reason, and recovery action.
- The world participates weakly in the generation chain: check whether the world-library sample, the novel world copy, the StoryWorldSlice, and `WorldContextGateway` are clearly distinguished, and whether the generation chain bypassed the unified facade.
- Character generation needs a low-cost control point for beginners: default to generating from the per-book world while allowing faction-tendency and world-rule-compliance selection, rather than requiring the user to hand-write full character backgrounds.
- A keyword fallback was added after AI judgment failed: fix the AI schema, prompt, context, and evaluation — do NOT let the product logic fall back to hardcoding.

## Related Modules

- `client/src/pages/novels/`
- `client/src/pages/tasks/`
- `client/src/pages/chat/ChatPage.tsx`
- `client/src/pages/worlds/WorldList.tsx`
- `client/src/pages/worlds/components/workspace/WorldOverviewTab.tsx`
- `client/src/pages/novels/components/NovelWorldManagerCard.tsx`
- `server/src/services/novel/director/`
- `server/src/services/novel/production/`
- `server/src/services/novel/worldContext/WorldContextGateway.ts`
- `server/src/creativeHub/`
- `server/src/prompting/`

## Source Documents

- [README project positioning](../../../README.md)
- [Auto-director execution-plane isolation and API keep-alive plan](../../plans/auto-director-execution-plane-isolation-plan.md)
- [Prompt Workbench, context assembly, and unified step-runtime plan](../../plans/prompt-workbench-context-and-step-runtime-plan.md)

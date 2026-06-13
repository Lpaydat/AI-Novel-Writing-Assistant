# Server Architecture Migration Plan

## Background

`server/src` currently mixes several organizational styles at once: `routes/`, `services/novel/`, `services/novel/director/`, `modules/`, `creativeHub/`, `graphs/`, and `prompting/`. After long accumulation, what breaks first is not "directory names" — it is that sources of truth, the orchestration layer, the HTTP layer, and the platform layer start to carry each other's responsibilities.

## Target Shape

- `app/`: Express assembly, startup, background workers, watchdog, service registration.
- `platform/`: `db`, `llm`, `events`, `runtime`, `config`, `prompting`, and other infrastructure.
- `modules/`: converges by business domain, prioritizing `setup`, `planning`, `production`, `director`, `characters`, `state`, `export`.

## Migration Rules

- New capabilities are no longer piled into old root directories.
- `routes` only does HTTP mapping; it carries no core orchestration.
- `prompting` is the single entry point for product-grade prompts.
- Migration prioritizes keeping APIs, data semantics, and external behavior unchanged.
- The first pass does not change the database schema.

## Phased Plan

1. Freeze old entry points; stop extending the `services/novel` and `services/novel/director` root directories.
2. Split `NovelWorkflowService`: first extract `store`, `healing`, and `application`; `projection`-related read models are initially served by the `store` facade, and recovery logic is deduplicated through a shared helper.
3. Convert `NovelService`'s inheritance chain into an explicit composition facade.
4. Sink `novel.ts`, `world.ts`, `settings.ts`, and `novelProductionRoutes.ts` into each module's own `http/` entry point.
5. Split `app.ts`, separating route assembly, background-service startup, and worker/watchdog initialization.
6. Clean up product paths that call `getLLM()` directly (e.g. `worldDraftGeneration.ts`) and unify them under the prompt registry.

## Execution Checklist

- [ ] Old root directories stop gaining new peer-level large files.
- [ ] `NovelWorkflowService` migrates out read/store, healing, and application responsibilities, avoiding duplicated recovery logic across services.
- [ ] `NovelService` moves from inheritance to composition.
- [ ] `routes` keeps only HTTP mapping and request validation.
- [ ] `app.ts` has a separated startup-assembly layer.
- [ ] Old `getLLM()` product paths migrate into the prompt governance entry point.
- [ ] After each phase, run a typecheck and a critical-chain smoke test.

## Acceptance Criteria

- Directory density drops and single-file length returns to a maintainable range.
- External dependencies see only module facades and do not deep-link internal files.
- The boundaries of workflow, director, and prompting are consistent between the wiki and the code.
- Existing APIs and user behavior stay compatible.

## Risks

- Workflow and director have many historical compatibility paths; splits must preserve facade exports.
- Route and service migration must not synchronously break current frontend calls.
- Prompt migration should fix the governance entry point, not patch holes with string branches.

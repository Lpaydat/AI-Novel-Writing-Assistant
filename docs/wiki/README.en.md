# Project Development Wiki (English)

This directory accumulates durable project knowledge so future developers and AI agents understand *why* the system is designed the way it is and how it must be maintained.

The wiki is not a record of "what changed in a single commit," nor a replacement for release notes. It only records architecture rules, workflow boundaries, runtime contracts, debugging lessons, and product design rationale that remain useful across phases.

> **English sibling convention (decision).** Each English page lives beside its Chinese source using a `.en.md` suffix in the *same* directory — for example `architecture/module-boundaries.md` (Chinese) is paired with `architecture/module-boundaries.en.md` (English). This co-located `.en.md` convention mirrors the locale-suffix pattern used elsewhere, keeps siblings next to the canonical Chinese page, and makes `git status` show both files together. The Chinese (`.md`) page remains the default and authoritative page per the AGENTS.md wiki rule "Use Chinese by default"; the `.en.md` file is an additive companion, never a replacement.
>
> When you add a new Chinese wiki page `foo.md`, also author `foo.en.md`. When you update the meaning of a page, update **both** siblings so they do not drift.

## How to use this wiki

- Start from this page to find the relevant topic, then open the matching category page.
- If a page's content originated from a historical plan, design document, or checkpoint, keep the source link — do not strip the original document bare.
- If a development phase clarified a long-term rule, update the relevant wiki page. Small changes or release changelogs do not belong in the wiki.
- New pages should follow the structure in [entry-template.en.md](./entry-template.en.md).

## Index

### Architecture

- [Module Boundaries & Documentation Governance](./architecture/module-boundaries.en.md)
- [Novel Application Capability Layer Boundary](./architecture/novel-application-services.en.md)
- [Chapter Identity & Planning Extension Boundary](./architecture/chapter-identity-and-planning-boundary.en.md)
- [Chapter Runtime Boundaries](./architecture/chapter-runtime-boundaries.en.md)
- [Event Side-Effect Boundaries](./architecture/event-side-effect-boundaries.en.md)
- [Read-Path Performance Boundaries](./architecture/read-path-performance-boundaries.en.md)
- [Model Selection & Vendor Default-Model Boundary](./architecture/model-selection.en.md)
- [Image Generation Provider Boundary](./architecture/image-generation-providers.en.md)
- [World Context Gateway & Novel-World Boundary](./architecture/world-context-gateway.en.md)
- [World Visualization Asset Boundary](./architecture/world-visualization-assets.en.md)
- [Server Architecture Migration Plan](./architecture/server-architecture-migration-plan.en.md)

### Workflows

- [Auto-Director Runtime & Recovery Boundary](./workflows/auto-director-runtime.en.md)
- [Auto-Director Book-Level World Setup](./workflows/auto-director-world-setup.en.md)
- [Chapter Production Chain](./workflows/chapter-production-chain.en.md)

### Prompts

- [Prompt Registry & Structured Output](./prompts/prompt-registry-and-structured-output.en.md)

### RAG

- [Knowledge Base & Context Assembly](./rag/knowledge-and-context-assembly.en.md)

## Writing boundaries

The wiki should record:

- Long-term architecture decisions and their reasons.
- Boundaries of core chains: auto-director, chapter production, Creative Hub, Prompts, RAG, task state.
- Reusable debugging conclusions and triage paths.
- Product principles such as beginner-first, full-novel completion, and low cognitive load, and how they shape implementation.

The wiki should NOT record:

- Per-commit file modification lists.
- Temporary TODOs.
- Copies of release notes.
- Implementation details likely to be discarded soon.
- Changelog narration that only describes "what changed this time."

## Relationship to other docs directories

- `docs/wiki/`: stable knowledge and reasons.
- `docs/plans/`: plans and task breakdowns that still have execution value.
- `docs/checkpoints/`: phase progress, migration milestones, and audit records.
- `docs/design/`: system design, domain models, and product mechanisms.
- `docs/releases/`: user-visible change history.
- `README.md`: public entry point and latest public summary.

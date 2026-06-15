# Prompt Registry and Structured Output

## Background

This project is an AI-native novel-production system. Intent recognition, task classification, planning, routing, tool selection, quality judgment, and repair suggestions must all rely on AI's structured understanding — not on keywords and hardcoded branches.

Historically, product-level prompts tended to scatter across services, each carrying its own local `JSON.parse`, try/catch repair, and ad-hoc normalization. That makes structured output, repair, semantic retry, context requirements, and governance metadata impossible to audit uniformly.

## Decision

`server/src/prompting/` is the single governed entry point for new product-level prompts. A product-level prompt MUST be registered as a `PromptAsset` and executed through the unified runner. Structured output is handled via schema, JSON repair, and semantic retry; deterministic code only does input validation, safety boundaries, and post-structuring processing.

## Current Rules

- New product-level prompts MUST live under `server/src/prompting/prompts/<family>/`.
- New product-level prompts MUST be registered in `server/src/prompting/registry.ts`.
- A `PromptAsset` MUST provide `id`, `version`, `taskType`, `mode`, `language`, `contextPolicy`, and `render()`; structured prompts must also have an `outputSchema` or equivalent validation.
- Creative-semantic judgment MUST be AI-first. Identity assumption, hidden identity, genre understanding, story duty, quality risk, next-step action, and repair suggestion are product semantics — they must NOT be judged or gated by regex, keyword tables, fixed string fragments, character ratios, or hand-written branches. Such capabilities belong in the PromptAsset, the structured-output schema, semantic retry, or an AI evaluation path.
- Deterministic code is allowed ONLY for structural contracts and safety boundaries: required fields, enum normalization, ID existence, array length, permissions, and data protection. A deterministic quality gate may flag structural problems like "missing protagonist / gender / required field," but it must NOT judge creative semantics like "whether an identity was assumed," "whether a name looks like a role-slot," or "whether the language looks like leftover English."
- Structured output uses `runStructuredPrompt`; plain text uses `runTextPrompt`; streaming uses the corresponding stream runner.
- JSON-parse / schema-validation failures are handled by the repair policy; JSON that is valid but fails business semantics is handled by semantic retry.
- Every PromptAsset executed through the registry runner MUST produce prompt quality telemetry — to observe repair rate, semantic-retry rate, empty-output rate, context token budget, output length, and latency. Business services MUST NOT bypass the runner and silently swallow postValidate failures; a semantic failure should retry via `semanticRetryPolicy` or degrade through an explicit `postValidateFailureRecovery`.
- Planning prompts (chapter lists, volume chapter-splitting) may add a lightweight business quality gate AFTER structured output, to catch vague summaries, consecutive passive advancement, long first-person chapter titles, missing protagonist agency, or chapter segments missing stage payoff / hooks. The quality gate only flags problems in the structured result and triggers retry — it must NOT replace the AI in chapter planning, and must NOT generate chapter content via keyword branches.
- State names, enum names, and examples shown to the model in a prompt MUST match the schema's accepted values. If the context carries historical aliases or business colloquial values (e.g. `active` meaning "advanced but not yet paid off"), the prompt must state the conversion rule explicitly, and the schema preprocess must normalize deterministically — do not repeatedly hand the same alias to LLM repair.
- An extraction schema that uses strings to carry "readable state values" MUST state in the PromptAsset that numbers must also be output as strings, and must deterministically stringify already-structured numeric / boolean scalars at the schema layer. A typical case is timeline `stateChanges.before/after`: ratings, scores, countdowns are plot state, not computed fields — they should be saved into the continuity ledger as readable text like `"19"`, `"5"`, so reasonable numeric output is not pushed to JSON repair every time.
- An aggregate structured prompt MUST list ALL constrained enum fields, not just the most error-prone ones. A chapter-asset extraction that outputs multiple sub-ledgers in one call should constrain `updateType`, `resourceType`, `narrativeFunction`, `scopeType`, `syncPlan`, etc. together; otherwise the model uses semantically reasonable but schema-unacceptable natural classification words, and background tasks stall on Zod validation failures.
- Post-structuring deterministic normalization is ONLY for field aliases, enum aliases, and legacy-shape compatibility — e.g. mapping `pacing` to the acceptance gate's `plot`, mapping payoff `active` to `pending_payoff`, or converting a string risk into a `{ code, severity, summary }` object. Such normalization must NOT replace AI judgment on plot facts, risk levels, or next-step actions.
- High-frequency background structured prompts — chapter acceptance gate, timeline extraction, chapter-asset extraction — MUST give examples covering non-empty object arrays. Fields like `missingObligations`, `hooks/possibleHooks`, and resource changes must NOT be exemplified only with empty arrays, or the model will invent fields or collapse objects into strings when it finds a real problem.
- Fact-extraction prompts do NOT inherit the creative temperature. Calls used for review or ledger writing — timeline, chapter-asset delta, acceptance gate — should clamp to a low temperature at the service layer, so the auto-director's high creative temperature does not amplify schema drift.
- JSON-repair logs should retain `promptId`, `schemaPaths`, `repairAttempt`, and `validationError`. When diagnosing repair rate, first aggregate by `promptId + schemaPath`, then judge whether the cause is prompt examples, the enum contract, context pollution, or model routing.
- Editable slots may only expose low-risk expression-layer content; they must NOT cover schema, postValidate, taskType, mode, contextPolicy, the tool catalog, approval boundaries, or required context.
- When an old un-governed prompt path is touched, default to migrating it INTO the registry before extending it.

Approved exceptions:

- JSON repair inside `server/src/llm/structuredInvoke.ts`.
- Connectivity probes such as `server/src/llm/connectivity.ts`.
- Phase-2 stream bridges kept for now, e.g. `graphs/*`, `routes/chat.ts`, `services/novel/runtime/*`.

These exceptions are NOT the default entry point for new prompts. When touching an exception file, first evaluate whether it can be migrated into a PromptAsset + runner; if it cannot yet be migrated, add an equivalent prompt-telemetry bridge to avoid forming an unobservable second prompt-execution path.

## Examples

Recommended:

- When adding a chapter acceptance gate: first define the structured-output schema, then register a `PromptAsset`, then have the service consume the structured result.
- When adding an intent-recognition capability: extend the AI schema and tool contract; do NOT add a keyword fallback.
- When the character roster is low quality: fix the character-preparation PromptAsset, the structured schema, postValidate / semantic retry, or the context blocks — do NOT add keywords, regex, or character-ratio checks in the service.
- The Prompt Workbench preview is read-only: it returns messages, context blocks, missing required groups, and a trace preview — it does NOT persist runtime overrides.

Forbidden:

- Inlining `systemPrompt`/`userPrompt` in a service and calling a bare LLM.
- Adding a new local JSON-repair + schema-branch pile in a business file.
- Letting a Prompt Override replace an entire system prompt or structured-output schema.
- Replacing AI structured understanding with fixed vocabularies, regex, character ratios, or special-string branches in character preparation, chapter planning, intent recognition, quality checks, RAG selection, or auto-director routing.

## Failure Modes

- Unstable model JSON output: check the schema, the provider's JSON capability, and the repair policy first — do NOT patch local parsing in the business service.
- The same prompt repeatedly entering JSON repair: check the logs for whether the raw field values come from non-schema values in the context or examples. If the model is only reusing aliases that appear in the prompt, fix the prompt/schema contract first; if the output is semantically complete but the field name is a common alias, normalize at the PromptAsset schema layer instead of letting the background task retry indefinitely.
- `expected string, received number` concentrated on state-extraction fields is usually NOT a model misunderstanding — it's that the schema mixes "readable state text" and "computable number" in the same field. The order of operations is: clarify the prompt output contract, give structured examples, and at schema preprocess preserve the semantics while converting to string; do NOT ask the LLM to repair each numeric field individually.
- Prompt Catalog missing a context preview: add `contextRequirements`; do NOT have the preview query the database ad hoc.
- Intent-recognition misses: fix the PromptAsset, the input context, the schema, or the tool catalog — do NOT add keyword routing.
- A character roster that does not seem to assume an identity, genre, or hidden truth: inspect the character-preparation PromptAsset, context blocks, and structured output first — do NOT add local regex identity extraction or keyword-based auto-apply checks.
- A single PromptAsset's repair or semantic-retry rate spikes: first read the prompt quality telemetry (promptId/version, context blocks, empty-output rate, failure classification), then judge whether the cause is the schema contract, context pollution, model routing, or prompt wording.

## Related Modules

- `server/src/prompting/`
- `server/src/prompting/core/promptRunner.ts`
- `server/src/prompting/registry.ts`
- `server/src/llm/structuredInvoke.ts`
- `server/src/llm/capabilities.ts`
- `server/src/agents/`
- `server/src/creativeHub/`

## Source Documents

- [Prompting Registry](../../../server/src/prompting/README.md)
- [Prompt Governance Audit 2026-05-08](../../checkpoints/prompt-governance-audit-2026-05-08.md)
- [Prompt Workbench, context assembly, and unified step-runtime plan](../../plans/prompt-workbench-context-and-step-runtime-plan.md)
- [LLM Schema Refactor Checkpoint](../../checkpoints/llm-schema-refactor-checkpoint.md)

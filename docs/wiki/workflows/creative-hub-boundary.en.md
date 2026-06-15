# Creative Hub Boundary

## Background

Creative Hub has evolved from an ordinary chat page into a creative hub carrying conversation, follow-ups, planning, tool calls, execution status, and turn summaries. Its value is helping a beginner turn a fuzzy creative intent into an executable novel-production action — not becoming another general chat entry point.

If Creative Hub bypasses the auto-director, the Prompt Registry, the Runtime API, or task-state projection and calls old services directly, it recreates multiple entry points, multiple states, and multiple recovery semantics.

## Decision

Creative Hub is a creative hub and control entry point, NOT the source of truth for novel-production facts. It should explain and advance the auto-director or chapter chain through governed tools, workflows, runtime APIs, and projections.

AI judgment remains the primary implementation for intent recognition, planning, routing, and next-step recommendation; deterministic code only does input validation, safety boundaries, permissions, idempotency, and post-structuring processing.

## Current Rules

- Creative Hub may understand user intent, explain current novel progress, recommend next steps, and issue controlled commands.
- Creative Hub does NOT directly own heavy execution like the auto-director long task, chapter production, quality repair, or RAG indexing.
- When the user's goal is book-opening, takeover, continuation, recovery, chapter execution, or batch production, hand off to the auto-director runtime, the chapter runtime, or the task center.
- Tool calls should bind explicit resources and auditable records; do NOT replace AI-first structured understanding with free-text branches.
- For beginners, Creative Hub should give a single recommended next step, the reason, and the impact scope — not ask the user to judge complex engineering or novel-structure state.
- Do NOT add product-level intent routing based on keywords, regex, or hardcoded branches.

## Examples

Recommended:

- The user asks "where is this book now"; Creative Hub reads real artifact progress and the runtime projection, answers the produced facts first, then adds background-task status.
- The user asks to continue auto-generation; Creative Hub creates a controlled command or guides to the auto-director continue entry.
- After the user manually edits a chapter, Creative Hub triggers an impact analysis and lets the auto-director judge local repair, continue, or pause-for-confirmation.

Forbidden:

- Stitching a prompt in the chat route to call an LLM that decides and executes heavy novel production.
- Using keywords to judge "continue" / "recover" / "retry" and bypassing commands, policies, and projections.
- Expanding Creative Hub into general chat, adding capabilities that do not serve whole-novel completion.

## Failure Modes

- The conversation can answer but the task-center state does not change: check whether only a chat-layer response ran, with no controlled command issued.
- The conversation shows it can continue, but the auto-director panel does not sync: check whether runtime projection was bypassed.
- A keyword fallback was added after intent recognition failed: fix the Prompt schema, context, or tool contract — do NOT hide an AI-capability problem.

## Related Modules

- `server/src/creativeHub/`
- `server/src/agents/`
- `server/src/graphs/`
- `server/src/services/novel/director/`
- `server/src/services/novel/runtime/`
- `client/src/pages/chat/ChatPage.tsx`
- `client/src/pages/tasks/TaskCenterPage.tsx`

## Source Documents

- [Prompt Workbench, context assembly, and unified step-runtime plan](../../plans/prompt-workbench-context-and-step-runtime-plan.md)
- [Auto-director execution-plane isolation and API keep-alive plan](../../plans/auto-director-execution-plane-isolation-plan.md)
- [README project positioning](../../../README.md)

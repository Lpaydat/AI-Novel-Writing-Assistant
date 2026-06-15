# Knowledge Base and Context Assembly

## Background

Long-form novel production needs long-term memory: worldbuilding, characters, book-analysis results, knowledge-base documents, style assets, chapter history, and continuity state can all affect later planning and prose. Early on, if each module uploaded, indexed, retrieved, or stitched context on its own, the result was duplicate vectorization, inconsistent retrieval scope, and unauditable prompt inputs.

The goal of the knowledge base and the Context Broker is to make materials reusable assets, and to let every AI call know exactly which context it used, which it dropped, and why it dropped it.

## Decision

Knowledge-base documents are long-term material assets, not one-shot upload inputs. RAG retrieval, bound materials, and context assembly should go through a unified service and a Context Resolver; prompt templates must NOT query the database directly.

The default retrieval rule follows "explicit selection first, bound materials next, globally-enabled documents as fallback," while preserving each business entity's own internal context. If a business call explicitly limits `ownerTypes`, the retrieval service MUST respect that range; when `knowledge_document` is not included, knowledge-base documents MUST NOT be mixed in automatically.

## Current Rules

- The `Knowledge Base` is the single management entry point for vectorized materials — responsible for documents, versions, indexing tasks, health status, and Embedding/RAG configuration.
- Uploaded materials should form a `KnowledgeDocument` and a version concept; online retrieval targets only the currently active version.
- Archiving a knowledge document is a recoverable state; it does NOT delete the `KnowledgeDocumentVersion` original. Archiving removes it from default retrieval, material selection, and book-analysis entry points, and queues cleanup of existing chunks.
- Restoring an archived document to enabled MUST queue an index rebuild. Only after the post-restore rebuild task succeeds should recall tests and RAG retrieval use the document again.
- When a novel or world has bound knowledge documents, the relevant generation pipeline uses the bound documents first.
- When the user explicitly passes `knowledgeDocumentIds`, retrieve ONLY those documents.
- With no explicit selection and no binding, all enabled knowledge-base documents may be searched.
- When a business call explicitly passes `ownerTypes`, `ownerTypes` is a hard range. Knowledge-base documents participate in retrieval ONLY when `ownerTypes` is not passed, when it explicitly includes `knowledge_document`, or when `knowledgeDocumentIds` is passed explicitly.
- The novel's / world's own RAG content is still retained and merge-ranked with knowledge-base retrieval results.
- Prompt templates only declare which context they need; the Context Broker / Resolver handles reading, budgeting, filtering, summarizing, and assembly.
- RAG and context-assembly failures must be explainable in a preview or trace — required context must NOT be silently dropped.

## Examples

Recommended:

- The world wizard allows direct txt upload AND selecting an existing knowledge-base document; after creation it writes the selection into world bindings.
- During novel generation, read the novel's bound knowledge documents, internal worldbuilding, and chapter history, then assemble context blocks by budget.
- Prompt Preview shows selected blocks, dropped blocks, missing required groups, and resolver errors.

Forbidden:

- Each generation service stitching its own "if there are documents search them, else search globally" rule.
- Querying the database directly inside a PromptAsset's `render()`.
- Uploading the same material and letting multiple modules each keep an untraceable text copy.

## Failure Modes

- Retrieval results do not fit the current novel: check whether an explicit document filter or a novel/world binding overrode the global default.
- World layered generation mixed in unrelated novel documents: check whether the caller only needed `world` / `world_library_item`, and whether the RAG service wrongly ignored the explicit `ownerTypes` range.
- Prompt input too large: check the Context Broker's budget, summarization, and dropped-block records.
- Knowledge base is healthy but generation does not reference materials: check whether the resolver is wired into the current workflow and whether the prompt declares a context requirement.
- Old version content still being retrieved: check whether the active version and the chunk rebuild are aligned.
- An archived document cannot be recalled after restore: check whether the restore action set the index state to `queued` and whether the corresponding rebuild task completed successfully.

## Related Modules

- `server/src/services/rag/`
- `server/src/services/knowledge/`
- `server/src/services/novel/runtime/GenerationContextAssembler.ts`
- `server/src/prompting/`
- `client/src/pages/knowledge/`
- `client/src/pages/worlds/`
- `client/src/pages/novels/`

## Source Documents

- [Knowledge-base and vectorization-management module history plan](../../archive/outdated/knowledge-module-plan-implemented-reference.md)
- [Prompt Workbench, context assembly, and unified step-runtime plan](../../plans/prompt-workbench-context-and-step-runtime-plan.md)
- [README current-capability notes](../../../README.md)

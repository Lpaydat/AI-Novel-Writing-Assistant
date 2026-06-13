# Event Side-Effect Boundaries

## Background

The novel production chain emits domain events at chapter finalization, volume-planning updates, and pipeline completion. These events notify other modules that a fact has occurred, but an event bus is **not** a reliable task system. If event handlers directly execute expensive side effects such as character-dynamics recompute, snapshot creation, or RAG re-indexing, the main flow is blocked invisibly and unfinished work cannot be recovered after a process restart.

## Decision

`novelEventBus` carries only lightweight in-process notifications. Any side effect that may be time-consuming, needs retry, needs recovery, or may touch multiple tables must be written to a **persistent queue** and executed by a background worker.

Current queue division of labor:

- `RagIndexJob` is the RAG-indexing-only queue; it handles knowledge chunking, vector writes, deletes, and rebuilds.
- `NovelSideEffectJob` is the novel-domain side-effect queue; it handles character-dynamics sync, volume-planning-triggered character-dynamics rebuild, pipeline-completion snapshots, and other non-RAG tasks.
- An `EventBus` handler may only do fast fact checks, idempotency-key computation, and enqueuing — it must not call heavy side-effect services directly.

## Current Rule

`NovelSideEffectJob` uses a tightened state machine:

- `pending -> running -> succeeded`
- `pending -> running -> failed`
- `failed -> running -> succeeded`
- `failed -> running -> failed`
- `running -> dead`

`failed` is a retryable waiting state and must carry a `runAfter`. `dead` is terminal failure after max attempts are reached or the payload is incompatible. State updates must carry a current-state condition, and a worker leasing a task must use an atomic conditional update so concurrent workers cannot execute the same task at once.

Retry strategy must use exponential backoff, jitter, and an upper bound, to avoid an avalanche of retries when the same fault recovers.

## Idempotency Windows

An idempotency key must express "the same semantic task" and must not concatenate the current time just to dodge dedup.

- Chapter-draft character sync: the same `chapterId`, the same chapter `updatedAt`, and the same body-text hash count as the same sync task; a change in body text or chapter update time must produce a new task.
- Volume-planning character rebuild: the idempotency key comes from a field fingerprint of the fields that affect character volume responsibilities and chapter-planning semantics, including volume order, volume summary, main commitments, key chapter plans, and character volume assignments. Unrelated update times must not produce a new task on their own.
- Pipeline-completion snapshot: the same pipeline `jobId` may create an auto milestone snapshot only once.

## Failure Modes

- Event-handler enqueue failure: recorded by the `EventBus`; the main flow must not re-run the heavy side effect inside the handler.
- Worker execution failure: the task goes to `failed` and retries on the backoff schedule; after `maxAttempts` it goes to `dead`.
- Service restart: on startup, stale `running` tasks are restored to retryable `failed` and continue to be processed by workers.
- Incompatible payload version: the task goes to `dead`; a developer must write a migration or compensation based on `payloadVersion`.

## Related Modules

- `server/src/events/EventBus.ts`
- `server/src/events/handlers/registerNovelEventHandlers.ts`
- `server/src/events/sideEffects/`
- `server/src/services/rag/RagIndexService.ts`
- `server/src/services/rag/RagWorker.ts`

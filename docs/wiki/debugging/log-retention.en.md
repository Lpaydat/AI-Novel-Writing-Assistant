# Log Retention and Rotation Rules

## Background

The project has desktop main-process logs, server dev-session logs, LLM-debug JSONL, and structured-repair JSONL at the same time. They are mainly for local troubleshooting and development diagnostics; they should not grow unboundedly, and should not be conflated with the auto-director events and task-recovery evidence in the database.

## Current Rule

File-log cleanup only handles known suffixes in the log directory:

- `.log`
- `.meta.json`
- `.llm.jsonl`
- `.llm-repair.jsonl`

Default retention policy:

- Ordinary logs and session metadata: 30 days.
- LLM debug logs: 14 days.
- LLM repair logs: 30 days.
- Files modified within the last 24 hours are not auto-deleted.
- When the current active log exceeds 50MB, it rotates to a timestamped history file; new content keeps writing to the original active path.

## Boundary

Log cleanup MUST NOT delete database event tables, novel data, generated images, backup directories, or unknown-suffix files. The auto-director's `DirectorEvent`, `DirectorRuntimeEvent`, `DirectorLlmUsageRecord`, and other database records are runtime ledgers and recovery evidence; they do NOT participate in file-log cleanup.

If database-event cleanup is needed in the future, a separate archive, export, and recovery-validation strategy MUST be designed; the file-log TTL rule MUST NOT be reused.

## Configuration

The default policy can be tuned via environment variables:

- `AI_NOVEL_LOG_CLEANUP_ENABLED`
- `AI_NOVEL_LOG_RETENTION_DAYS`
- `AI_NOVEL_LLM_LOG_RETENTION_DAYS`
- `AI_NOVEL_LOG_MAX_FILE_MB`
- `AI_NOVEL_LOG_MIN_AGE_HOURS`

`scripts/run-with-log.cjs` also supports `--retention-days`, `--llm-retention-days`, `--max-file-mb`, and `--no-cleanup` for temporarily overriding dev-session cleanup behavior.

## Failure Modes

- A cleanup failure MUST only log a warning; it MUST NOT block server or desktop startup.
- A non-existent directory is treated as "nothing to clean."
- Unknown files MUST be retained, to avoid mistakenly deleting diagnostic materials the user manually placed in the log directory.
- When troubleshooting needs to keep the full context, set `AI_NOVEL_LOG_CLEANUP_ENABLED=false` or use `--no-cleanup` in the dev script.

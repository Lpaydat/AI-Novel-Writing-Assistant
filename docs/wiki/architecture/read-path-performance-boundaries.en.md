# Read-Path Performance Boundaries

## Background

The home page, sidebar, model-selection bootstrap, task-recovery prompt, and novel list all load together when a user opens the app. If these endpoints, while reading, also happen to perform remote probes, state repair, full-detail assembly, or large-list projection, the first screen is dragged down by the slowest background capability. As the local SQLite database grows, these problems amplify into noticeable endpoint queuing and blank-page waits.

## Decision

Read paths used by the first screen and navigation badges must stay **lightweight, cacheable, and low-side-effect**. Capabilities that need remote I/O, state repair, model-catalog refresh, task-recovery initialization, full-detail explanation, or large-object assembly must be pushed to an explicit user action, a detail page, a background task, or lazy loading.

## Current Rule

- `GET /api/settings/api-keys` returns only locally available provider-config status, the current model, active state, basic model candidates, and image-model config; it does not remotely request each provider's `/models` on first-screen read. Model-catalog refresh goes through the per-provider `refresh-models` action.
- The auto-director follow-up overview performs only lightweight projection and counts; it does not batch-execute `healAutoDirectorTaskState` inside the overview request. State repair belongs to the detail page, background recovery, or an explicit continue action.
- The recovery-candidate list projects the summary field directly from the task table and no longer calls task-detail aggregation for each candidate. Recovery initialization runs in the background and must not block the HTTP list read.
- The novel list reads the list DTO paginated by default. List reads are not responsible for auto-repairing task state; task-state repair should be triggered by the detail page, a background coordinator, or an explicit action.
- Badges, recovery prompts, and model-config bootstrap in the frontend global layout should load in tiers, so they do not compete with the current page's main data for first-screen network and database resources.

## Examples

- When the settings page opens, the user can immediately see whether providers are configured, the current model, and the API base URL; the remote model catalog is only contacted when the user clicks "refresh models."
- When the sidebar only needs task counts and follow-up counts, it must not trigger auto-director task repair, chapter scanning, or model connectivity probing.
- The recovery dialog shows only recoverable-task summaries; the recovery command chain runs only after the user clicks recover.

## Failure Modes

- If `api-keys` read slows back down to second-scale, first check whether a remote model-catalog request was reintroduced.
- If the follow-up overview steadily exceeds a few hundred milliseconds, first check whether the read path is batch-healing, per-book querying auto-pass records, or pulling large task fields.
- If opening any page triggers a flood of task and model endpoints, first check whether `AppLayout`, `Sidebar`, `TaskRecoveryProvider`, and `LLMSelectionBootstrap` bypassed tiered loading.

## Related Modules

- `server/src/routes/settings.ts`
- `server/src/services/task/autoDirectorFollowUps/AutoDirectorFollowUpService.ts`
- `server/src/services/task/RecoveryTaskService.ts`
- `server/src/services/novel/novelCoreCrudService.ts`
- `client/src/components/layout/`
- `client/src/pages/novels/NovelList.tsx`

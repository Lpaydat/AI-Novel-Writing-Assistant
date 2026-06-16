# Upstream Sync Runbook (Fork Sync)

> This project forks `ExplosiveCoderflome/AI-Novel-Writing-Assistant`. We carry a large i18n effort on `feature/english-translation` (+ `beta`/`main`) and need to keep merging upstream features/fixes without losing translation work.
>
> English sibling of `upstream-sync-runbook.md`. The Chinese-primary version is authoritative.

## Why i18n is inherently invasive

Translation requires editing the file that holds the string. So this fork, vs `main`:
- **New files (zero conflict risk):** all `.en.ts` prompt variants, `server/src/i18n/serverMessages.ts`, `client/src/i18n/*`, `client/src/locales/*`, wiki en siblings, i18n tests.
- **Modified existing files (conflict risk):** **57** vs `main`. Most are mechanical wraps (`"zh"` → `serverT("k")`); a few are structural.

**Merges do NOT lose translation work** — git preserves both sides; conflicts only where both edit the same line. A conflict = re-wrap the new string, mechanical and test-caught.

## High-risk structural files (real merge work lives here)

When upstream touches these, resolve carefully (not just re-wrap):

- `server/src/prompting/core/promptTypes.ts` — F2 registry key `id@version` → `id@version@language`
- `server/src/prompting/registry.ts` — many `@en` loader entries; upstream's new prompts need a sibling `@en` entry
- `server/src/prisma/schema.prisma` + `schema.sqlite.prisma` — additive `Novel.language`; keep both trees in sync
- `shared/types/directorRuntime.ts` + the S1 label-map family (`autoDirectorApproval`, `novelDirector`, `bookAnalysis`, `directorWorkflowStepCatalogData`, `directorWorkflowStepCatalog`, `novelExport`, `styleEngine`) — map shape changed; S1 keeps original arrays byte-identical and adds parallel locale dictionaries
- `server/src/routes/chat.ts`, `server/src/creativeHub/CreativeHubService.ts` — many wraps in hot files

The other ~50 modified files are mechanical wraps → trivial conflicts.

## Sync workflow (every 1–2 weeks, or before each release)

**Frequent small merges >> rare big merges.**

```bash
# 1. Fetch upstream main (temp-disable the global https→ssh rewrite for public-repo fetch)
git config --global --unset 'url.git@github.com:.insteadof'
git fetch https://github.com/ExplosiveCoderflome/AI-Novel-Writing-Assistant.git main:refs/upstream/main
git config --global 'url.git@github.com:.insteadof' 'https://github.com/'   # restore SSH push

# 2. Merge on a sync branch
git checkout -b sync/upstream-<date>
git merge refs/upstream/main

# 3. Let the i18n test suite be the drift alarm (full command in the zh runbook)
#    green → fast-forward, push, done
#    red   → the failing golden test names the exact zh string upstream changed; re-wrap it

# 4. Merge back per AGENTS.md branch workflow (sync → beta → main)
```

## rerere (enabled globally)

`git config --global rerere.enabled true` records your conflict resolutions and auto-reapplies them when the same conflict recurs. First time you resolve a wrap conflict by hand; thereafter git reapplies it. Biggest leverage for repetitive i18n conflicts.

## Drift detection (safety net, in place)

- **zh byte-identity golden tests** (F1/F3/S1/S2/P1/P2/P3) — fail and point at the exact key when upstream changes a zh string. This is the merge alarm.
- **GATE's U5 "no raw Chinese in code" guard** (pending) — catches new un-translated upstream strings.

## Discipline for future changes

1. New strings → new files (catalog keys, `.en.ts` siblings, locale JSON): always conflict-free.
2. Existing files → one-line wraps only; don't refactor logic (the closer to upstream's shape, the easier the merge).
3. Structural files → keep the S1/F3 "original byte-identical + locale data alongside" pattern so upstream entry changes auto-flow.
4. (Optional, post-GATE) Extract `shared/types` locale dictionaries into sibling `*.locale.ts` files to shrink the structural surface. Hardening, not blocking.

## Status (2026-06-16)

- Fork point: `258badf`. Upstream `upstream/main` is 0 commits ahead of the fork point → **zero merge debt right now**. Cheapest moment to establish this baseline.

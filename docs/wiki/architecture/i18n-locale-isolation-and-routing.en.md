# i18n Locale Isolation & Routing

> English sibling of `i18n-locale-isolation-and-routing.md`. The Chinese-primary version is authoritative.

## Background

This project forks `ExplosiveCoderflome/AI-Novel-Writing-Assistant`. Upstream develops in Chinese only; we carry a large i18n effort on the fork (`feature/english-translation` → `beta` → `main`) and need to keep evolving it without losing translation work and without blocking upstream feature/fix merges.

i18n is inherently invasive: you must edit "the file that contains the string to be translated." If every added language meant rewriting existing Chinese, or scattering Chinese across components, services, prompts, and label maps as ad-hoc concatenations, you would get two problems at once — inconsistent UI language, and a large conflict surface on every upstream merge.

So i18n is designed as a **one-way, additive, test-guarded locale-isolation boundary**: Chinese is the upstream source of truth and the default locale; English is a layer added beside it. Both the "read" (which locale) and the "routing" (which variant) of language converge into a few owned modules, and every new string prefers to land in a **new file**, keeping upstream merges mechanical, low-conflict, and alarm-backed.

## Decision

- **Exactly two supported locales**: `zh` (default) and `en`. Client, server, prompts, and shared types all use the same `zh | en` vocabulary; any unknown value normalizes back to `zh`.
- **Chinese = source of truth / default locale, English = an additive layer**. Chinese source strings stay put (ideally byte-identical to upstream); English is explicit parallel data that never overrides or replaces Chinese.
- **New strings prefer new files**: new locale JSON, new catalog keys, new `.en.ts` prompt siblings — all additive, so they never conflict with upstream on the same line.
- **Existing files get only a one-line wrap**: replace the literal `"中文"` with `serverT("k")` / `t("k")` / `formatLocaleNumber()`; do not opportunistically refactor logic — the closer the logic stays to upstream, the easier it merges.
- **Structural high-risk files** (label maps, the prompt registry) keep the shape "original data byte-identical + a parallel locale dictionary beside it," so when upstream changes the original data our derivation/routing follows automatically.
- **A suite of golden tests acts as the "merge alarm"**: if upstream changes a translated `zh` source string, the corresponding byte-identity golden test fails immediately and **names** the specific key — turning silent translation loss into a visible red light.

## Current Rule

### Client: react-i18next and namespaces

- The whole client's i18n is established from a single point, `client/src/i18n/index.ts` (`initReactI18next`). All locale data lives under `client/src/locales/{zh,en}/` and all locale logic under `client/src/i18n/`; page modules must **not** carry their own translation files.
- One namespace JSON per page-area/feature-area (`home.json`, `novelsChapterEditor.json`, `worldsComponentsA.json`, …), one file each for zh and en with matching filenames, registered into `localeResources` and the `ns` array in `index.ts` (currently ~43 namespaces).
- Keys are **flat dotted strings** (e.g. `metric.liveWorkflow.title`); the dots are literal parts of the key, not a path hierarchy. So `index.ts` explicitly disables both separators: `keySeparator: false`, `nsSeparator: false`; `i18next` treats the whole dotted string as the literal key within its namespace.
- Other key config: `defaultNS: "home"`, `fallbackLng: "zh"`, `supportedLngs: ["zh", "en"]`, `interpolation: { escapeValue: false }` (placeholders use `{{var}}`), `returnEmptyString: false`, `react: { useSuspense: false }`.
- **In components**, use `useTranslation("<ns>")` to get `t`; it re-renders automatically on locale switch.
- **In module-level helpers (non-components)**, use `i18n.t(key, { ns })` directly. Reactivity note: `i18n.t` called outside React does not trigger a re-render, so when such a helper's output is memoized in a component via `useMemo`, thread `t` or `i18n.language` into the `useMemo` dependency array so it recomputes on locale switch.
- **The active locale** is read from `localStorage["ai-novel-locale"]` (default `zh`), normalized by `getActiveLocale()` (trim + lowercase; anything not `zh`/`en` falls back to `zh`).
- **Language transport** uses the `Accept-Language` bare token (exactly `zh` or `en`). `client/src/i18n/localeHeaders.ts` is the single transport source: `buildAcceptLanguageHeader` / `getLocaleHeaders` are consumed by the axios request interceptor and the three streaming `fetch` sites (`useSSE`, `creativeHub`, `AssistantChatPanel`); no caller may hand-build the header inline.
- **Switching locale** goes through `changeAppLocale(locale)`: writes `localStorage` (`persistActiveLocale`) + `i18n.changeLanguage`. React-query cache invalidation and (on desktop) the IPC write-back live in `LocaleSwitcher`, because they need the react-query / desktop-bridge contexts this module deliberately does not import.

### Server: the serverMessages catalog and request locale

- `server/src/i18n/serverMessages.ts` is the single owned catalog for user-facing server strings. `SERVER_MESSAGES` is a typed map of flat dotted key → `{ zh, en }`; `serverT(key, locale?, vars?)` is the resolver, with `{{var}}` interpolation (same source as the client's `escapeValue: false`), returning the key itself for unknown keys (so bugs are visible) and falling back to the zh branch when a locale branch is missing.
- **What it owns**: HTTP-borne thrown `Error`/`AppError` messages, SSE progress text, fallback display titles, route-handler system prompts (the Creative Hub `chat.ts` approved exception).
- **What it does not own**: prompt assets (they live in the registry under `server/src/prompting/`) and shared-type label maps (they live in `shared/types/*` per S1/F3). Dev-facing logs/diagnostics stay English and do not go through this catalog.
- **Locale has two sources** (pinned by the epic's locale-routing contract):
  - **HTTP-triggered strings** default to `getRequestLocale()`. `server/src/middleware/locale.ts`'s `localeMiddleware` normalizes `req.locale` from `Accept-Language` (`normalizeLocale`: trim + lowercase, non-`zh`/`en` falls back to `zh`) and seeds the locale into an `AsyncLocalStorage` context (same pattern as `usageTracking.ts`) so service-layer code without an HTTP `req` in scope can still read it.
  - **Novel-scoped / worker strings** (chapter-production SSE/guidance, the director worker) receive the locale explicitly from `novel.language` — the director runs as a background worker with no HTTP context and cannot rely on `getRequestLocale()`.

### Prompts: the multilingual registry

- The prompt registry key is **three-part** `id@version@language`, built by `buildPromptAssetKey({id, version, language})` in `server/src/prompting/core/promptTypes.ts`. The language segment lets the zh and en variants of the same `id/version` coexist in the registry without a duplicate-key crash.
- `PromptLanguage = "zh" | "en"`, and every `PromptAsset` carries a `language` field.
- `resolvePromptVariant(id, version, locale = "zh")` (`registry.ts`) does the language routing:
  - `locale === "zh"` (or omitted) → returns the zh anchor directly.
  - `locale === "en"` → returns the en variant if registered; otherwise falls back to the zh anchor, logs `console.warn("[prompt-locale] no en variant for …")` (so silent Chinese generation is diagnosable), and sets `localeFallback: true`.
- Chinese prompts are untouched; English is added as `.en.ts` sibling files beside them (currently ~22) plus matching `@en` loader entries in `registry.ts`. Only the runner routes through `resolvePromptVariant` when `options.locale` is set; two-arg callers like PromptWorkbench are unaffected and default to the zh anchor.
- Workbench / governance panels list the **canonical zh anchors** (`findRegisteredPromptAssetById` prefers the zh anchor and only falls back to a non-zh variant when no zh exists).

### Shared-type label maps

- Display labels shared across front and back end (e.g. director node names) follow the S1/F3 pattern: a typed locale-keyed map as source of truth, a resolver with a zh default and zh fallback, locale passed as a parameter (never a global).
- Example: `DIRECTOR_NODE_DISPLAY_LABELS: Record<Locale, Record<string, string>>` in `shared/types/directorRuntime.ts`, with resolver `getDirectorNodeDisplayLabel(input, locale = "zh")` reading `labels[locale]` and bottoming out in `DIRECTOR_NODE_FALLBACK_LABEL` (zh `"AI 推进步骤"` / en `"AI Advance Step"`).
- Discipline: **the original data (original arrays / original keys) stays byte-identical**, and English is an explicit parallel dictionary added beside it. When upstream changes an original entry, the zh derivation follows automatically; when it changes structure, sync it to both zh/en branches. The same pattern covers `autoDirectorApproval`, `novelDirector`, `bookAnalysis`, `directorWorkflowStepCatalog(Data)`, `novelExport`, `styleEngine`, and similar type files.

### Byte-identity discipline & guards

- **zh source strings stay byte-identical**, and the byte-identity golden tests (F1/F3/S1/S2/P1/P2/P3, under `server/tests/*.test.js`) are the "merge alarm" for that discipline: the moment upstream changes a translated zh string, the corresponding golden fails and points at the specific key.
- **Client no-raw-Chinese guard**: `client/src/i18n/noRawCjk.test.mjs` walks `src/**/*.{ts,tsx}`, strips comments first (preserving string/template/regex contents), then detects residual Chinese with a CJK regex. A non-allowlisted file with post-comment Chinese fails; an allowlisted file that no longer has any Chinese also fails (keeps the list honest); the allowlist may not contain duplicates. `locales/`, `__fixtures__/`, `node_modules/`, and the i18n test files themselves are excluded.
- **`rawCjkAllowlist.ts`** lists files whose Chinese is genuinely not UI chrome (each with a reason): enum/union type literals, object/map KEYS, `===`/`.includes()`/regex that match server-generated Chinese content or detect mojibake, values submitted to an API / persisted as entity data / fed into an AI prompt, and language endonyms (e.g. `中文` in `LocaleSwitcher`). Comment-only Chinese is not listed (the guard strips comments first).
- **zh/en key-completeness guard**: `client/src/i18n/localeCompleteness.test.mjs` asserts zh and en expose the exact same set of namespace files, every namespace has at least one key, zh and en have identical key sets per namespace, and en values contain zero CJK.

### Upstream sync

- Full steps are in `docs/wiki/workflows/upstream-sync-runbook.md`. Key points:
- **Merge, don't rebase**: `git merge refs/upstream/main` on a `sync/upstream-<date>` branch, then merge back to `beta` → `main` per the AGENTS.md branch workflow.
- **Frequent small merges**: sync every 1–2 weeks or before each release to keep each conflict surface small.
- **rerere is enabled** (`rerere.enabled = true`): git records how you resolved a conflict and replays it automatically when the same conflict recurs — the biggest lever for the highly repetitive "re-wrap a string" i18n conflicts.
- **Golden tests name the drift**: run the i18n test suite after merging; all-green means upstream touched no translated string; a red light names which zh string upstream changed, and you re-wrap that key once (`serverT` / `t()` / catalog).

## Examples

- Adding a server error message: add a new key `{ zh, en }` to `SERVER_MESSAGES`, and at the throw site write `throw new AppError(serverT("mySlice.myError"))`. This is additive and does not conflict with upstream.
- Adding UI copy for a page: add the same key to `client/src/locales/zh/<ns>.json` and `client/src/locales/en/<ns>.json`, then in the component `const { t } = useTranslation("<ns>")` and `t("my.key")`.
- Adding an English version of a Chinese prompt: create `xxx.prompts.en.ts` (`language: "en"`), add an `xxx@v1@en` loader entry to `registry.ts`, and leave the Chinese original file unchanged.
- Displaying a node name in the director worker: `getDirectorNodeDisplayLabel({ label, nodeKey }, novel.language)`, with the locale coming from `novel.language` rather than a request header.

## Failure Modes

- Copy does not update after a locale switch in a component: usually a value taken via `i18n.t` in a module-level helper is memoized by `useMemo` without `t` / `i18n.language` in the dependency array.
- Something still renders Chinese in an English session: if it is a prompt, check for a missing `@en` variant (look for the `[prompt-locale] no en variant` warning and `localeFallback: true`); if it is a server string, check whether it skipped `serverT` or used the wrong locale source (HTTP uses `getRequestLocale()`, novel scope uses `novel.language`).
- The `noRawCjk` guard fails: new code wrote Chinese straight into a string. Either extract it to a locale namespace/catalog, or (if genuinely non-UI) add it to `rawCjkAllowlist.ts` with a reason.
- The `localeCompleteness` guard fails: zh added a key but en did not follow (or vice versa), or a CJK character slipped into an en value. Complete the namespace's key set and English translations.
- A golden test goes red after an upstream merge: upstream changed a translated zh source string. Re-wrap the named key; do not "align" with upstream by editing the translation and dropping the wrap.
- Hand-building `Accept-Language` inline, bypassing `localeHeaders.ts`: causes some requests to carry the wrong locale. All transport must go through `buildAcceptLanguageHeader` / `getLocaleHeaders`.

## Related Modules

- `client/src/i18n/index.ts`
- `client/src/i18n/localeHeaders.ts`
- `client/src/i18n/rawCjkAllowlist.ts`
- `client/src/i18n/noRawCjk.test.mjs`
- `client/src/i18n/localeCompleteness.test.mjs`
- `client/src/locales/{zh,en}/*.json`
- `server/src/i18n/serverMessages.ts`
- `server/src/middleware/locale.ts`
- `server/src/prompting/core/promptTypes.ts`
- `server/src/prompting/registry.ts`
- `server/src/prompting/prompts/**/*.en.ts`
- `shared/types/directorRuntime.ts` (and same-pattern `autoDirectorApproval` / `novelDirector` / `bookAnalysis` / `directorWorkflowStepCatalog(Data)` / `novelExport` / `styleEngine`)
- `server/tests/*.test.js` (byte-identity golden alarms)

## Source Documents

- `docs/wiki/workflows/upstream-sync-runbook.md` (merge workflow, rerere, drift alarm, structural high-risk file table, discipline checklist)
- `AGENTS.md` → UI Copy Rules / i18n Conventions

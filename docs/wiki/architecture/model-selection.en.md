# Model Selection & Vendor Default-Model Boundary

## Background

The top-of-page model selection affects many AI entry points: Creative Hub, auto-director, chapter production, the writing engine, and world/character generation. In the past, when the current selection lived only in browser localStorage, the UI would revert to a frontend built-in default after a project restart, a desktop `userData` change, a browser origin change, or a cache clear. That built-in default could in turn fall onto some vendor's legacy model name, so a beginner who does not understand model config would land directly on an unavailable model.

Vendor configuration and the current model selection must have clearly separated sources of truth: vendor config says "how this vendor connects, what its default model is, and whether it is runnable"; the current model selection says "which vendor and model the top workspace should use right now."

## Decision

The current top-of-page model selection uses server-side `AppSetting` as its **primary source of truth**. Frontend state is only a runtime projection for the current page run; browser localStorage no longer decides the long-term default model.

When there is no saved current selection, or the saved vendor is not runnable, the system resolves a runnable choice from vendors that are configured, enabled, and have a model list. Resolution prefers the user's saved vendor and model; only when the saved value is missing or invalid does it use the first candidate from the list of runnable vendors.

A built-in vendor's static model list may serve only as a candidate hint on the settings page or as a fallback for existing config; it must not directly become the top current model when no model is saved. When no model is saved, the system should prefer a model catalog the server can fetch; if no catalog can be fetched, the vendor stays not-runnable and the user is guided to explicitly select or fill in a model on the settings page.

## Current Rule

- The top current model selection is saved to `AppSetting.llm.currentSelection`, containing provider, model, temperature, and optional maxTokens.
- The frontend `useLLMStore` holds only a runtime projection; after page start it is hydrated jointly by the settings endpoint and the current-selection endpoint.
- `LLMSelector` shows only vendors that are configured, enabled, and have an available model.
- After the user switches vendor or model at the top, the frontend should save to the server-side current selection in sync.
- A built-in vendor with no saved model must not be treated as runnable merely because `PROVIDERS.*.defaultModel` exists; it needs a saved model, an environment model, or a fetchable model catalog.
- Model routing, structured-output fallback, and per-task explicit model overrides remain independent config; they are not equivalent to the top current model.

## Examples

Recommended:

- After the user switches from DeepSeek to Qwen at the top, the project still reads Qwen and its model from the server after a restart.
- When a vendor has an API key but no saved model, the server first tries to read that vendor's model catalog and uses the first catalog entry as the current available model.
- If the model catalog cannot be read, the settings page still lets the user fill in a model manually, but the top does not auto-select a built-in legacy model name.

Forbidden / discouraged:

- Hard-coding `deepseek/deepseek-chat` in frontend state initialization.
- Treating an incompletely configured vendor as runnable because a provider's static `defaultModel` exists.
- Using keywords, special vendor branches, or one-off migration scripts to paper over a mismatch between the model catalog and the current-selection source of truth.

## Failure Modes

- Top model jumps back to an old default after restart: first check whether `AppSetting.llm.currentSelection` exists, then whether the frontend finished hydrating, then whether the current vendor is still in the runnable list of `/api/settings/api-keys`.
- Top model shown as unavailable: check whether the vendor has only a static default model, no saved model, or a failed model-catalog fetch.
- A vendor visible on the settings page but not at the top: confirm `isConfigured`, `isActive`, and the model list are all satisfied; a vendor without a configured model must not enter the top candidates.

## Related Modules

- `server/src/services/settings/LLMSelectionSettingsService.ts`
- `server/src/routes/settings/llmSelectionRoutes.ts`
- `server/src/routes/settings.ts`
- `server/src/llm/modelCatalog.ts`
- `client/src/components/layout/LLMSelectionBootstrap.tsx`
- `client/src/components/common/LLMSelector.tsx`
- `client/src/store/llmStore.ts`

## Source Documents

- [Module boundaries & documentation governance](./module-boundaries.md)
- [Project collaboration rules](../../../AGENTS.md)

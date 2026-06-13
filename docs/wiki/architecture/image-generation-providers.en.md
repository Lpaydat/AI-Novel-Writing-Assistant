# Image Generation Provider Boundary

## Background

The character-image generation service targets writing beginners, so the configuration entry must stay low-burden: users should only need to understand "which vendor provides the text model and which model provides image generation." They must not be asked to judge a built-in vendor allow-list or manually repair front/back-end vendor enums.

The image-generation flow defaults to calling an OpenAI-compatible `/images/generations` endpoint. Some built-in vendors have a recommended image model, but custom gateways, local forwarding services, and aggregator endpoints may offer the same image endpoint too.

## Decision

The image-model setting is **no longer bound to fixed built-in vendors**. Any saved model vendor may be configured with an independent image model; only vendors that are enabled, have complete connection info, and have an image model appear in the character-image-generation vendor list.

## Current Rule

- The text default model and the image model are two independent settings.
- The image model is saved under the `provider.imageModel.<provider>` settings key; the provider need not be a built-in vendor.
- Built-in vendors may offer recommended image-model options; custom vendors have no preset options by default but allow manual entry.
- At image-generation execution time, the provider and model on the task are read, then that provider's saved API base URL and API key are used to call `/images/generations`.
- Custom or local OpenAI-compatible services may omit an API key; the request then omits the `Authorization` header.
- The character-image frontend selection list must come from current settings data; it must not be hard-coded to a fixed list such as `openai`, `siliconflow`, or `grok`.

## Failure Modes

- If the settings page lets the user fill in an image model but the character-image page still hard-codes vendors, the user will mistakenly think the custom vendor failed to save.
- If the backend allows only fixed vendors into image generation, the frontend dynamic list offers the option to the user but the task fails on submit.
- If deleting a custom vendor leaves the old image-model setting, a later rebuilt vendor with the same name may inherit a stale image model, creating hard-to-explain config pollution.

## Related Modules

- `server/src/services/settings/ProviderImageSettingsService.ts`
- `server/src/services/image/provider.ts`
- `server/src/routes/settings.ts`
- `server/src/routes/settings/customProviderRoutes.ts`
- `client/src/pages/settings/components/ProviderConfigDialog.tsx`
- `client/src/pages/characters/components/CharacterImageDialog.tsx`

/**
 * Accept-Language locale middleware.
 *
 * GLOBAL / pre-novel prompts (genre, title, book-candidate) read the locale
 * from `req.locale`, which this middleware sets from the `Accept-Language`
 * header (bare token `zh` | `en`, sent by the client i18n harness).
 *
 * Server normalization mirrors the client resolver: trim, lowercase, and fall
 * back to `zh` for anything that is not exactly `zh` or `en`.
 *
 * The locale is ALSO seeded into {@link getRequestLocaleStore} (AsyncLocalStorage,
 * same pattern as usageTracking.ts) so service-layer code running deeper in the
 * request — without an HTTP `req` in scope — can read the request locale via
 * {@link getRequestLocale}. This is the F2 -> S2 contract: AsyncLocalStorage
 * propagation of `req.locale` into the service layer.
 *
 * NOTE: novel-scoped prompts (chapter/world/character/director) do NOT use this.
 * They read `novel.language`, because the director runs as a background worker
 * with NO HTTP context.
 */
import type { Request, Response, NextFunction } from "express";
import { AsyncLocalStorage } from "node:async_hooks";

export type AppLocale = "zh" | "en";

const SUPPORTED_LOCALES: ReadonlySet<AppLocale> = new Set(["zh", "en"]);

/**
 * Global default prompt/UI locale, configurable for an English-first deployment.
 * `AI_NOVEL_DEFAULT_LOCALE` (or `PROMPT_LANGUAGE`) = `en` makes prompts default to
 * English everywhere the caller doesn't specify one: global prompts (no
 * `Accept-Language`) and NEW novels (their `language` defaults to this). Existing
 * novels keep their own `novel.language`; per-request `Accept-Language` still wins.
 * Unset / anything but `en` → `zh`.
 */
function readDefaultLocaleEnv(): AppLocale {
  const raw = (process.env.AI_NOVEL_DEFAULT_LOCALE ?? process.env.PROMPT_LANGUAGE ?? "").trim().toLowerCase();
  return raw === "en" ? "en" : "zh";
}

export const DEFAULT_LOCALE: AppLocale = readDefaultLocaleEnv();

/** Normalize a raw Accept-Language token to a valid locale (zh fallback). */
export function normalizeLocale(raw: string | null | undefined): AppLocale {
  if (!raw) {
    return DEFAULT_LOCALE;
  }
  const normalized = raw.trim().toLowerCase();
  if (SUPPORTED_LOCALES.has(normalized as AppLocale)) {
    return normalized as AppLocale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Per-request locale context. Seeds the service layer with `req.locale` so code
 * without an HTTP `req` in scope can still resolve the request locale.
 */
const requestLocaleStore = new AsyncLocalStorage<AppLocale>();

/** Resolve the locale for the current request (service-layer API). zh default. */
export function getRequestLocale(): AppLocale {
  return requestLocaleStore.getStore() ?? DEFAULT_LOCALE;
}

/**
 * Express middleware: read `Accept-Language`, set `req.locale`, and run the
 * request inside an AsyncLocalStorage context carrying the locale.
 */
export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const locale = normalizeLocale(req.headers["accept-language"]);
  req.locale = locale;
  requestLocaleStore.run(locale, () => next());
}

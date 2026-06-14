/**
 * Single owned locale-transport + locale-resolution helper for the client.
 *
 * Contract (F1 <-> F2):
 * - Header name: `Accept-Language`
 * - Header value: bare token, exactly `zh` or `en`
 * - Active locale is read from `localStorage["ai-novel-locale"]` (default `zh`)
 * - The server (F2) also normalizes: trim, lowercase, unknown -> `zh`
 *
 * All locale-header consumers (axios interceptor + the streaming `fetch`
 * callers in useSSE / creativeHub / AssistantChatPanel) MUST go through
 * {@link buildAcceptLanguageHeader} so there is a single source of truth.
 */

export const STORAGE_KEY = "ai-novel-locale";
export const SUPPORTED_LOCALES = /** @type {const} */ (["zh", "en"]);
export const DEFAULT_LOCALE = /** @type {"zh"} */ ("zh");

/** The set of locales the client treats as valid Accept-Language tokens. */
const SUPPORTED_LOCALE_SET = new Set(SUPPORTED_LOCALES);

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Resolve a raw stored locale value to a valid Accept-Language token.
 *
 * Mirrors the server (F2) normalization so the client never sends a token the
 * server would reject: trim, lowercase, and fall back to {@link DEFAULT_LOCALE}
 * for anything that is not exactly `zh` or `en`.
 */
export function resolveActiveLocale(raw: string | null | undefined): AppLocale {
  if (!raw) {
    return DEFAULT_LOCALE;
  }
  const normalized = raw.trim().toLowerCase();
  if (SUPPORTED_LOCALE_SET.has(normalized as AppLocale)) {
    return normalized as AppLocale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Read the active locale from `localStorage` and normalize it.
 *
 * Safe to call before `localStorage` exists (e.g. during SSR); returns the
 * default locale in that case.
 */
export function getActiveLocale(): AppLocale {
  if (typeof localStorage === "undefined") {
    return DEFAULT_LOCALE;
  }
  return resolveActiveLocale(localStorage.getItem(STORAGE_KEY));
}

/**
 * Persist the active locale into `localStorage` so it survives reloads and is
 * readable by the pre-React-mount boot script in `index.html`.
 */
export function persistActiveLocale(locale: AppLocale): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, resolveActiveLocale(locale));
}

/**
 * Build the `Accept-Language` header object for the active locale.
 *
 * This is the ONE helper every HTTP caller (axios interceptor + the three
 * streaming `fetch` sites) must consume — never hand-build the header inline.
 */
export function buildAcceptLanguageHeader(locale: AppLocale): Record<"Accept-Language", AppLocale> {
  return { "Accept-Language": resolveActiveLocale(locale) };
}

/**
 * Convenience: the Accept-Language header for the locale currently in
 * `localStorage`. Consumed by the axios request interceptor and the streaming
 * `fetch` callers so they always send the freshest locale.
 */
export function getLocaleHeaders(): Record<"Accept-Language", AppLocale> {
  return buildAcceptLanguageHeader(getActiveLocale());
}

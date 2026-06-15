/**
 * Locale-aware Intl formatters bound to the active app locale.
 *
 * All UI number/date formatting MUST go through these helpers (or pass the
 * locale explicitly) so the formatting follows the user's chosen locale
 * instead of the hardcoded `zh-CN` or the host OS locale. This is the single
 * owned surface for Intl formatting; page modules import from here rather than
 * calling `Intl.NumberFormat("zh-CN")` or bare `toLocaleString()` directly.
 *
 * Locale source: the active locale read from `localStorage["ai-novel-locale"]`
 * (default `zh`) — the same source the i18next instance and the Accept-Language
 * transport use (see localeHeaders.ts), so formatting stays in lockstep with
 * the rest of the UI. The read is inlined here (rather than imported) so this
 * module is self-contained and testable under node --experimental-strip-types
 * without triggering a bare-specifier sibling import the host loader can't
 * resolve; localeHeaders.ts remains the canonical exporter of getActiveLocale.
 */
export type AppLocale = "zh" | "en";

/** Read the active app locale from localStorage (zh default). Mirrors
 *  localeHeaders.getActiveLocale; kept inline for module self-containment. */
function readActiveLocale(): AppLocale {
  if (typeof globalThis.localStorage === "undefined") {
    return "zh";
  }
  const raw = globalThis.localStorage.getItem("ai-novel-locale");
  return raw === "en" ? "en" : "zh";
}

/** Map the app locale to a BCP-47 tag Intl accepts. */
function intlLocale(locale: AppLocale): string {
  return locale === "en" ? "en-US" : "zh-CN";
}

/**
 * Format a number using the active locale's grouping. Pass an explicit locale
 * to override (rare; most callers should omit it and follow the app locale).
 */
export function formatLocaleNumber(value: number, locale?: AppLocale): string {
  return new Intl.NumberFormat(intlLocale(locale ?? readActiveLocale())).format(value);
}

/**
 * Format a date/time using the active locale. Mirrors the default
 * `toLocaleString()` shape but bound to the app locale instead of the host.
 */
export function formatLocaleDateTime(
  value: Date | string | number,
  locale?: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(intlLocale(locale ?? readActiveLocale()), options);
}

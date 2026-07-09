/**
 * Single owned i18n module — config + resolver.
 *
 * Establishes react-i18next for the whole client app. All locale JSON lives
 * under `client/src/locales/{zh,en}/` and all locale logic lives under
 * `client/src/i18n/`. Page modules must NOT keep their own translation files.
 *
 * Locale resolution uses the pinned contract: the active locale is read from
 * `localStorage["ai-novel-locale"]` (default `zh`) via {@link getActiveLocale}.
 * The HTTP `Accept-Language` transport lives in `./localeHeaders.ts` and is
 * consumed by the axios interceptor + every streaming `fetch` caller.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import zhHome from "@/locales/zh/home.json";
import enHome from "@/locales/en/home.json";
import zhCharacters from "@/locales/zh/characters.json";
import enCharacters from "@/locales/en/characters.json";
import { getActiveLocale, type AppLocale } from "./localeHeaders";

export const SUPPORTED_LOCALES = ["zh", "en"] as const;
export type { AppLocale } from "./localeHeaders";

/**
 * Locale resources keyed by language. New namespaces (added by U1–U4) are
 * registered here so all locale data stays under the single owned module.
 */
export const localeResources = {
  zh: { home: zhHome, characters: zhCharacters },
  en: { home: enHome, characters: enCharacters },
} as const;

export const DEFAULT_LOCALE: AppLocale = "zh";

void i18n.use(initReactI18next).init({
  resources: localeResources,
  lng: getActiveLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  defaultNS: "home",
  ns: ["home", "characters"],
  // Keys are flat strings that intentionally contain dots (e.g.
  // "metric.liveWorkflow.title"). Disable both separators so i18next treats
  // the whole dotted string as the literal key within the `home` namespace.
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  react: { useSuspense: false },
});

/**
 * Switch the active locale everywhere it needs to live:
 *  - the i18next instance (drives react-i18next `t()`),
 *  - `localStorage` (drives the next page load's locale + the pre-React boot
 *    script in index.html, and the Accept-Language header on future requests).
 *
 * The locale switcher UI also invalidates the react-query cache and (on
 * desktop) writes the locale through the IPC bridge so the main process can
 * read it. Those two side-effects are wired in `LocaleSwitcher` because they
 * need the react-query + desktop-bridge contexts this module must not import.
 */
export async function changeAppLocale(locale: AppLocale): Promise<AppLocale> {
  const { persistActiveLocale } = await import("./localeHeaders");
  const next = locale;
  persistActiveLocale(next);
  await i18n.changeLanguage(next);
  return next;
}

export default i18n;

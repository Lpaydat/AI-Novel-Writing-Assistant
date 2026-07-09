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
import zhAntiAiRules from "@/locales/zh/antiAiRules.json";
import enAntiAiRules from "@/locales/en/antiAiRules.json";
import zhAutoDirectorFollowUps from "@/locales/zh/autoDirectorFollowUps.json";
import enAutoDirectorFollowUps from "@/locales/en/autoDirectorFollowUps.json";
import zhChat from "@/locales/zh/chat.json";
import enChat from "@/locales/en/chat.json";
import zhComic from "@/locales/zh/comic.json";
import enComic from "@/locales/en/comic.json";
import zhGenres from "@/locales/zh/genres.json";
import enGenres from "@/locales/en/genres.json";
import zhKnowledge from "@/locales/zh/knowledge.json";
import enKnowledge from "@/locales/en/knowledge.json";
import zhStoryModes from "@/locales/zh/storyModes.json";
import enStoryModes from "@/locales/en/storyModes.json";
import zhTasks from "@/locales/zh/tasks.json";
import enTasks from "@/locales/en/tasks.json";
import zhTitles from "@/locales/zh/titles.json";
import enTitles from "@/locales/en/titles.json";
import zhCreativeHub from "@/locales/zh/creativeHub.json";
import enCreativeHub from "@/locales/en/creativeHub.json";
import zhDrama from "@/locales/zh/drama.json";
import enDrama from "@/locales/en/drama.json";
import zhPromptWorkbench from "@/locales/zh/promptWorkbench.json";
import enPromptWorkbench from "@/locales/en/promptWorkbench.json";
import zhWritingFormula from "@/locales/zh/writingFormula.json";
import enWritingFormula from "@/locales/en/writingFormula.json";
import zhBookAnalysis from "@/locales/zh/bookAnalysis.json";
import enBookAnalysis from "@/locales/en/bookAnalysis.json";
import zhBookAnalysisComponents from "@/locales/zh/bookAnalysisComponents.json";
import enBookAnalysisComponents from "@/locales/en/bookAnalysisComponents.json";
import zhSettings from "@/locales/zh/settings.json";
import enSettings from "@/locales/en/settings.json";
import zhSettingsComponents from "@/locales/zh/settingsComponents.json";
import enSettingsComponents from "@/locales/en/settingsComponents.json";
import zhWorlds from "@/locales/zh/worlds.json";
import enWorlds from "@/locales/en/worlds.json";
import zhNovelsHooks from "@/locales/zh/novelsHooks.json";
import enNovelsHooks from "@/locales/en/novelsHooks.json";
import zhNovelsAutoDirector from "@/locales/zh/novelsAutoDirector.json";
import enNovelsAutoDirector from "@/locales/en/novelsAutoDirector.json";
import zhNovelsMobile from "@/locales/zh/novelsMobile.json";
import enNovelsMobile from "@/locales/en/novelsMobile.json";
import zhNovelsList from "@/locales/zh/novelsList.json";
import enNovelsList from "@/locales/en/novelsList.json";
import zhNovelsChapterEditor from "@/locales/zh/novelsChapterEditor.json";
import enNovelsChapterEditor from "@/locales/en/novelsChapterEditor.json";
import zhNovelsChapterInsights from "@/locales/zh/novelsChapterInsights.json";
import enNovelsChapterInsights from "@/locales/en/novelsChapterInsights.json";
import zhNovels from "@/locales/zh/novels.json";
import enNovels from "@/locales/en/novels.json";
import zhNovelsSetup from "@/locales/zh/novelsSetup.json";
import enNovelsSetup from "@/locales/en/novelsSetup.json";
import zhLib from "@/locales/zh/lib.json";
import enLib from "@/locales/en/lib.json";
import zhApi from "@/locales/zh/api.json";
import enApi from "@/locales/en/api.json";
import zhStoreHooks from "@/locales/zh/storeHooks.json";
import enStoreHooks from "@/locales/en/storeHooks.json";
import zhWorldsComponentsA from "@/locales/zh/worldsComponentsA.json";
import enWorldsComponentsA from "@/locales/en/worldsComponentsA.json";
import zhWorldsComponentsB from "@/locales/zh/worldsComponentsB.json";
import enWorldsComponentsB from "@/locales/en/worldsComponentsB.json";
import zhNovelsEditA from "@/locales/zh/novelsEditA.json";
import enNovelsEditA from "@/locales/en/novelsEditA.json";
import zhNovelsEditB from "@/locales/zh/novelsEditB.json";
import enNovelsEditB from "@/locales/en/novelsEditB.json";
import zhNovelsEditC from "@/locales/zh/novelsEditC.json";
import enNovelsEditC from "@/locales/en/novelsEditC.json";
import zhNovelsEditD from "@/locales/zh/novelsEditD.json";
import enNovelsEditD from "@/locales/en/novelsEditD.json";
import zhComponentsLayout from "@/locales/zh/componentsLayout.json";
import enComponentsLayout from "@/locales/en/componentsLayout.json";
import zhComponentsTension from "@/locales/zh/componentsTension.json";
import enComponentsTension from "@/locales/en/componentsTension.json";
import zhComponentsCommon from "@/locales/zh/componentsCommon.json";
import enComponentsCommon from "@/locales/en/componentsCommon.json";
import zhComponentsMisc from "@/locales/zh/componentsMisc.json";
import enComponentsMisc from "@/locales/en/componentsMisc.json";
import { getActiveLocale, type AppLocale } from "./localeHeaders";

export const SUPPORTED_LOCALES = ["zh", "en"] as const;
export type { AppLocale } from "./localeHeaders";

/**
 * Locale resources keyed by language. New namespaces (added by U1–U4) are
 * registered here so all locale data stays under the single owned module.
 */
export const localeResources = {
  zh: {
    home: zhHome,
    characters: zhCharacters,
    antiAiRules: zhAntiAiRules,
    autoDirectorFollowUps: zhAutoDirectorFollowUps,
    chat: zhChat,
    comic: zhComic,
    genres: zhGenres,
    knowledge: zhKnowledge,
    storyModes: zhStoryModes,
    tasks: zhTasks,
    titles: zhTitles,
    creativeHub: zhCreativeHub,
    drama: zhDrama,
    promptWorkbench: zhPromptWorkbench,
    writingFormula: zhWritingFormula,
    bookAnalysis: zhBookAnalysis,
    bookAnalysisComponents: zhBookAnalysisComponents,
    settings: zhSettings,
    settingsComponents: zhSettingsComponents,
    worlds: zhWorlds,
    novelsHooks: zhNovelsHooks,
    novelsAutoDirector: zhNovelsAutoDirector,
    novelsMobile: zhNovelsMobile,
    novelsList: zhNovelsList,
    novelsChapterEditor: zhNovelsChapterEditor,
    novelsChapterInsights: zhNovelsChapterInsights,
    novels: zhNovels,
    novelsSetup: zhNovelsSetup,
    lib: zhLib,
    api: zhApi,
    storeHooks: zhStoreHooks,
    worldsComponentsA: zhWorldsComponentsA,
    worldsComponentsB: zhWorldsComponentsB,
    novelsEditA: zhNovelsEditA,
    novelsEditB: zhNovelsEditB,
    novelsEditC: zhNovelsEditC,
    novelsEditD: zhNovelsEditD,
    componentsLayout: zhComponentsLayout,
    componentsTension: zhComponentsTension,
    componentsCommon: zhComponentsCommon,
    componentsMisc: zhComponentsMisc,
  },
  en: {
    home: enHome,
    characters: enCharacters,
    antiAiRules: enAntiAiRules,
    autoDirectorFollowUps: enAutoDirectorFollowUps,
    chat: enChat,
    comic: enComic,
    genres: enGenres,
    knowledge: enKnowledge,
    storyModes: enStoryModes,
    tasks: enTasks,
    titles: enTitles,
    creativeHub: enCreativeHub,
    drama: enDrama,
    promptWorkbench: enPromptWorkbench,
    writingFormula: enWritingFormula,
    bookAnalysis: enBookAnalysis,
    bookAnalysisComponents: enBookAnalysisComponents,
    settings: enSettings,
    settingsComponents: enSettingsComponents,
    worlds: enWorlds,
    novelsHooks: enNovelsHooks,
    novelsAutoDirector: enNovelsAutoDirector,
    novelsMobile: enNovelsMobile,
    novelsList: enNovelsList,
    novelsChapterEditor: enNovelsChapterEditor,
    novelsChapterInsights: enNovelsChapterInsights,
    novels: enNovels,
    novelsSetup: enNovelsSetup,
    lib: enLib,
    api: enApi,
    storeHooks: enStoreHooks,
    worldsComponentsA: enWorldsComponentsA,
    worldsComponentsB: enWorldsComponentsB,
    novelsEditA: enNovelsEditA,
    novelsEditB: enNovelsEditB,
    novelsEditC: enNovelsEditC,
    novelsEditD: enNovelsEditD,
    componentsLayout: enComponentsLayout,
    componentsTension: enComponentsTension,
    componentsCommon: enComponentsCommon,
    componentsMisc: enComponentsMisc,
  },
} as const;

export const DEFAULT_LOCALE: AppLocale = "zh";

void i18n.use(initReactI18next).init({
  resources: localeResources,
  lng: getActiveLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  defaultNS: "home",
  ns: [
    "home",
    "characters",
    "antiAiRules",
    "autoDirectorFollowUps",
    "chat",
    "comic",
    "genres",
    "knowledge",
    "storyModes",
    "tasks",
    "titles",
    "creativeHub",
    "drama",
    "promptWorkbench",
    "writingFormula",
    "bookAnalysis",
    "bookAnalysisComponents",
    "settings",
    "settingsComponents",
    "worlds",
    "novelsHooks",
    "novelsAutoDirector",
    "novelsMobile",
    "novelsList",
    "novelsChapterEditor",
    "novelsChapterInsights",
    "novels",
    "novelsSetup",
    "lib",
    "api",
    "storeHooks",
    "worldsComponentsA",
    "worldsComponentsB",
    "novelsEditA",
    "novelsEditB",
    "novelsEditC",
    "novelsEditD",
    "componentsLayout",
    "componentsTension",
    "componentsCommon",
    "componentsMisc",
  ],
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

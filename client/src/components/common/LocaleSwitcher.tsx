import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { APP_RUNTIME } from "@/lib/constants";
import { changeAppLocale, type AppLocale } from "@/i18n";
import { getActiveLocale } from "@/i18n/localeHeaders";

/**
 * Global locale switcher.
 *
 * Switches the active locale everywhere it needs to live (the F1 contract):
 *  - i18next instance (drives react-i18next `t()`),
 *  - localStorage `ai-novel-locale` (next page load + Accept-Language header),
 *  - react-query cache (invalidated so server strings refetch in the new locale),
 *  - desktop main-process store via the IPC bridge (no-op in the web build).
 *
 * Lives in the navbar so it is reachable from every page. Page text itself is
 * translated by the U-wave; this component is the harness control.
 */

const LOCALE_NATIVE_LABEL: Record<AppLocale, string> = {
  zh: "中文",
  en: "English",
};

export default function LocaleSwitcher() {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<AppLocale>(() => getActiveLocale());

  // Keep local state in sync if the language changes from elsewhere.
  useEffect(() => {
    const current = (i18n.language as AppLocale | undefined) ?? getActiveLocale();
    setActive(current);
  }, [i18n.language]);

  const target: AppLocale = active === "zh" ? "en" : "zh";

  const handleSwitch = async () => {
    if (target === active) {
      return;
    }
    await changeAppLocale(target);
    setActive(target);
    // Old-locale server strings (genre tree, story-mode seeds, labels) must
    // refetch in the new locale — the Accept-Language interceptor only affects
    // NEW requests, so drop the cached ones.
    void queryClient.invalidateQueries();
    // F1 -> U4: mirror the locale into the desktop main-process store so the
    // main process can read it without waiting for the renderer. No-op on web.
    if (APP_RUNTIME === "desktop" && typeof window !== "undefined") {
      try {
        void window.__AI_NOVEL_DESKTOP__?.setLocale?.(target);
      } catch {
        // Bridge unavailable — localStorage already holds the source of truth.
      }
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => void handleSwitch()}
      title={t("common.locale.switch", { defaultValue: "Switch language / 切换语言" })}
      aria-label={LOCALE_NATIVE_LABEL[target]}
    >
      {LOCALE_NATIVE_LABEL[target]}
    </Button>
  );
}

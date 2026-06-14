import fs from "node:fs";
import path from "node:path";

/**
 * Minimal userData-backed locale store for the desktop main process.
 *
 * The renderer's locale switcher (F1) writes the active locale here through a
 * new IPC channel (`desktop:set-locale`). U4's main-process i18n reads it back
 * via {@link readLocaleFile}. No new dependency — just a tiny fs JSON helper
 * pinned to the F1<->F2 contract (bare token `zh` | `en`, default `zh`).
 */

export type DesktopLocale = "zh" | "en";

/** File name written under `app.getPath("userData")`. */
export const LOCALE_FILE_NAME = "locale.json";

const SUPPORTED_LOCALES: ReadonlySet<DesktopLocale> = new Set(["zh", "en"]);
const DEFAULT_LOCALE: DesktopLocale = "zh";

function normalizeLocale(raw: string | null | undefined): DesktopLocale {
  if (!raw) {
    return DEFAULT_LOCALE;
  }
  const normalized = raw.trim().toLowerCase();
  if (SUPPORTED_LOCALES.has(normalized as DesktopLocale)) {
    return normalized as DesktopLocale;
  }
  return DEFAULT_LOCALE;
}

function resolveLocaleFilePath(userDataDir: string): string {
  return path.join(userDataDir, LOCALE_FILE_NAME);
}

/**
 * Read the persisted locale from `<userDataDir>/locale.json`.
 *
 * Falls back to `zh` when the file is missing, unreadable, holds an unknown
 * locale token, or contains corrupt JSON — mirroring the client-side resolver
 * and the server (F2) normalization (trim, lowercase, unknown -> zh).
 */
export function readLocaleFile(userDataDir: string): DesktopLocale {
  const filePath = resolveLocaleFilePath(userDataDir);
  if (!fs.existsSync(filePath)) {
    return DEFAULT_LOCALE;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as { locale?: unknown };
    return normalizeLocale(
      typeof parsed?.locale === "string" ? parsed.locale : null,
    );
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * Persist the locale to `<userDataDir>/locale.json` so the main process can
 * read it on the next launch without waiting for the renderer.
 */
export function writeLocaleFile(userDataDir: string, locale: DesktopLocale): void {
  const filePath = resolveLocaleFilePath(userDataDir);
  fs.mkdirSync(userDataDir, { recursive: true });
  const normalized = normalizeLocale(locale);
  fs.writeFileSync(filePath, JSON.stringify({ locale: normalized }, null, 2), "utf8");
}

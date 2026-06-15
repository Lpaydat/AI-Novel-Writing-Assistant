export const NOVEL_EXPORT_SCOPE_VALUES = [
  "full",
  "basic",
  "story_macro",
  "character",
  "outline",
  "structured",
  "chapter",
  "pipeline",
] as const;

export type NovelExportScope = (typeof NOVEL_EXPORT_SCOPE_VALUES)[number];

export const NOVEL_EXPORT_FORMAT_VALUES = ["txt", "markdown", "json"] as const;

export type NovelExportFormat = (typeof NOVEL_EXPORT_FORMAT_VALUES)[number];

export const NOVEL_EXPORT_DOWNLOAD_FORMAT_VALUES = ["markdown", "json"] as const;

export type NovelExportDownloadFormat = (typeof NOVEL_EXPORT_DOWNLOAD_FORMAT_VALUES)[number];

type Locale = "zh" | "en";

const NOVEL_EXPORT_SCOPE_LABELS_BY_LOCALE: Record<Locale, Record<NovelExportScope, string>> = {
  zh: {
    full: "整本书",
    basic: "项目设定",
    story_macro: "故事宏观规划",
    character: "角色准备",
    outline: "卷战略 / 卷骨架",
    structured: "节奏 / 拆章",
    chapter: "章节执行",
    pipeline: "质量修复",
  },
  en: {
    full: "Entire book",
    basic: "Project settings",
    story_macro: "Story macro planning",
    character: "Character preparation",
    outline: "Volume strategy / skeleton",
    structured: "Pacing / chapter breakdown",
    chapter: "Chapter execution",
    pipeline: "Quality repair",
  },
};

/**
 * Default-locale (zh) label view, kept for backward compatibility with direct
 * indexing call sites (byte-identical to pre-i18n). For locale-aware access use
 * {@link getNovelExportScopeLabel}.
 */
export const NOVEL_EXPORT_SCOPE_LABELS: Record<NovelExportScope, string> =
  NOVEL_EXPORT_SCOPE_LABELS_BY_LOCALE.zh;

export function getNovelExportScopeLabel(scope: NovelExportScope, locale: Locale = "zh"): string {
  return NOVEL_EXPORT_SCOPE_LABELS_BY_LOCALE[locale][scope];
}

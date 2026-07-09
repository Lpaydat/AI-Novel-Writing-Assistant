import i18n from "@/i18n";

const INTENT_KEYS = new Set<string>([
  "social_opening",
  "list_novels",
  "list_worlds",
  "query_task_status",
  "create_novel",
  "select_novel_workspace",
  "bind_world_to_novel",
  "unbind_world_from_novel",
  "produce_novel",
  "query_novel_production_status",
  "query_novel_title",
  "query_chapter_content",
  "query_progress",
  "inspect_failure_reason",
  "write_chapter",
  "rewrite_chapter",
  "save_chapter_draft",
  "start_pipeline",
  "inspect_characters",
  "inspect_timeline",
  "inspect_world",
  "search_knowledge",
  "ideate_novel_setup",
  "general_chat",
  "unknown",
]);

const PLANNER_SOURCE_KEYS = new Set<string>(["llm", "unknown"]);

function formatBilingualLabel(label: string, rawValue: string) {
  return i18n.t("plannerLabel.bilingual", { ns: "creativeHub", label, rawValue });
}

export function getIntentDisplayLabel(intent: unknown): string {
  const rawValue = typeof intent === "string" && intent.trim() ? intent.trim() : "unknown";
  const label = INTENT_KEYS.has(rawValue)
    ? i18n.t(`intent.${rawValue}`, { ns: "creativeHub" })
    : i18n.t("intent.unmapped", { ns: "creativeHub" });
  return formatBilingualLabel(label, rawValue);
}

export function getPlannerSourceDisplayLabel(source: unknown): string {
  const rawValue = typeof source === "string" && source.trim() ? source.trim() : "unknown";
  const label = PLANNER_SOURCE_KEYS.has(rawValue)
    ? i18n.t(`plannerSource.${rawValue}`, { ns: "creativeHub" })
    : i18n.t("plannerSource.unmapped", { ns: "creativeHub" });
  return formatBilingualLabel(label, rawValue);
}

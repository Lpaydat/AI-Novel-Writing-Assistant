import type { World } from "@ai-novel/shared/types/world";
import i18n from "@/i18n";

export const LAYERS = [
  { key: "foundation", label: "layer.foundation", primaryField: "background" },
  { key: "power", label: "layer.power", primaryField: "magicSystem" },
  { key: "society", label: "layer.society", primaryField: "politics" },
  { key: "culture", label: "layer.culture", primaryField: "cultures" },
  { key: "history", label: "layer.history", primaryField: "history" },
  { key: "conflict", label: "layer.conflict", primaryField: "conflicts" },
] as const;

export type LayerKey = (typeof LAYERS)[number]["key"];

export type LayerField =
  | "description"
  | "background"
  | "geography"
  | "cultures"
  | "magicSystem"
  | "politics"
  | "races"
  | "religions"
  | "technology"
  | "conflicts"
  | "history"
  | "economy"
  | "factions";

export const LAYER_STATUS_LABELS: Record<string, string> = {
  pending: "layerStatus.pending",
  generated: "layerStatus.generated",
  confirmed: "layerStatus.confirmed",
  stale: "layerStatus.stale",
};

export const LAYER_FIELDS_BY_KEY: Record<LayerKey, LayerField[]> = {
  foundation: ["background", "geography"],
  power: ["magicSystem", "technology"],
  society: ["politics", "races", "factions"],
  culture: ["cultures", "religions", "economy"],
  history: ["history"],
  conflict: ["conflicts", "description"],
};

export type RefineAttribute =
  | "description"
  | "background"
  | "geography"
  | "cultures"
  | "magicSystem"
  | "politics"
  | "races"
  | "religions"
  | "technology"
  | "conflicts"
  | "history"
  | "economy"
  | "factions";

export const REFINE_ATTRIBUTE_OPTIONS: Array<{ value: RefineAttribute; label: string }> = [
  { value: "background", label: "refineAttr.background" },
  { value: "geography", label: "refineAttr.geography" },
  { value: "cultures", label: "refineAttr.cultures" },
  { value: "magicSystem", label: "refineAttr.magicSystem" },
  { value: "politics", label: "refineAttr.politics" },
  { value: "races", label: "refineAttr.races" },
  { value: "religions", label: "refineAttr.religions" },
  { value: "technology", label: "refineAttr.technology" },
  { value: "history", label: "refineAttr.history" },
  { value: "economy", label: "refineAttr.economy" },
  { value: "conflicts", label: "refineAttr.conflicts" },
  { value: "description", label: "refineAttr.description" },
  { value: "factions", label: "refineAttr.factions" },
];

export function normalizeLayerText(raw: unknown): string {
  if (typeof raw === "string") {
    return formatLayerTextString(raw);
  }
  if (raw === null || raw === undefined) {
    return "";
  }
  if (typeof raw === "object") {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return "";
    }
  }
  return String(raw);
}

function formatLayerTextString(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return raw;
  }
  try {
    return formatLayerStructuredValue(JSON.parse(trimmed));
  } catch {
    return raw;
  }
}

function formatLayerStructuredValue(raw: unknown): string {
  if (typeof raw === "string") {
    return raw.trim();
  }
  if (typeof raw === "number" || typeof raw === "boolean") {
    return String(raw);
  }
  if (Array.isArray(raw)) {
    return raw.map(formatLayerStructuredValue).filter(Boolean).join("\n");
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([key, value]) => {
        const text = formatLayerStructuredValue(value);
        return text
          ? `${key}${i18n.t("sep.colon", { ns: "worldsComponentsB" })}${text.replace(
              /\n/g,
              i18n.t("sep.semicolon", { ns: "worldsComponentsB" }),
            )}`
          : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export function pickLayerFieldText(layerKey: LayerKey, source: Record<string, unknown> | undefined): string {
  if (!source) {
    return "";
  }
  for (const field of LAYER_FIELDS_BY_KEY[layerKey]) {
    const text = normalizeLayerText(source[field]).trim();
    if (text) {
      return text;
    }
  }
  return "";
}

export function parseLayerStates(raw: string | null | undefined) {
  try {
    return JSON.parse(raw ?? "{}") as Record<string, { status: string; updatedAt: string }>;
  } catch {
    return {};
  }
}

export function getWorldField(world: World | undefined, field: keyof World): string {
  const value = world?.[field];
  return typeof value === "string" ? value : "";
}

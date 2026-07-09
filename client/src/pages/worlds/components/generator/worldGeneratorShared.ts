import type {
  WorldOptionRefinementLevel,
  WorldPropertyOption,
  WorldReferenceMode,
  WorldReferenceSeedBundle,
  WorldReferenceSeedSelection,
} from "@ai-novel/shared/types/worldWizard";
import i18n from "@/i18n";

export type InspirationMode = "free" | "reference" | "random";

export interface WorldGeneratorConceptCard {
  worldType: string;
  templateKey: string;
  coreImagery: string[];
  tone: string;
  keywords: string[];
  summary: string;
}

export interface GeneratorGenreOption {
  id: string;
  name: string;
  path: string;
  description?: string | null;
  template?: string | null;
}

export interface WorldGeneratorTemplateOption {
  key: string;
  name: string;
  description: string;
  worldType: string;
  classicElements: string[];
  pitfalls: string[];
}

export const REFERENCE_MODE_OPTIONS: Array<{
  value: WorldReferenceMode;
  label: string;
  description: string;
}> = [
  {
    value: "adapt_world",
    label: "refMode.adaptWorld.label",
    description: "refMode.adaptWorld.desc",
  },
  {
    value: "extract_base",
    label: "refMode.extractBase.label",
    description: "refMode.extractBase.desc",
  },
  {
    value: "tone_rebuild",
    label: "refMode.toneRebuild.label",
    description: "refMode.toneRebuild.desc",
  },
];

export const DEFAULT_DIMENSIONS: Record<string, boolean> = {
  foundation: true,
  power: true,
  society: true,
  culture: true,
  history: true,
  conflict: true,
};

const DIMENSION_LABELS: Record<string, string> = {
  foundation: "dimension.foundation",
  power: "dimension.power",
  society: "dimension.society",
  culture: "dimension.culture",
  history: "dimension.history",
  conflict: "dimension.conflict",
};

export const REFERENCE_SEED_SELECTION_KEYS: Record<
  keyof WorldReferenceSeedBundle,
  keyof WorldReferenceSeedSelection
> = {
  rules: "ruleIds",
  factions: "factionIds",
  forces: "forceIds",
  locations: "locationIds",
};

export function getDimensionLabel(key: string): string {
  return i18n.t(DIMENSION_LABELS[key] ?? key, { ns: "worldsComponentsB" });
}

export function normalizeAxiomTexts(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
}

export function clampOptionsCount(value: number): number {
  return Math.max(4, Math.min(8, Math.floor(value)));
}

export function parseReferenceControlText(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,，;；]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function getReferenceModeLabel(mode: WorldReferenceMode): string {
  return i18n.t(
    REFERENCE_MODE_OPTIONS.find((item) => item.value === mode)?.label ?? "refMode.adaptWorld.label",
    { ns: "worldsComponentsB" },
  );
}

export function buildDefaultPropertySelectionState(options: WorldPropertyOption[]) {
  return {
    selectedIds: options.map((option) => option.id),
    selectedChoiceIds: options.reduce<Record<string, string>>((acc, option) => {
      const firstChoiceId = option.choices?.[0]?.id;
      if (firstChoiceId) {
        acc[option.id] = firstChoiceId;
      }
      return acc;
    }, {}),
  };
}

export function buildDefaultReferenceSeedSelection(seeds: WorldReferenceSeedBundle): WorldReferenceSeedSelection {
  return {
    ruleIds: seeds.rules.map((item) => item.id),
    factionIds: seeds.factions.map((item) => item.id),
    forceIds: seeds.forces.map((item) => item.id),
    locationIds: seeds.locations.map((item) => item.id),
  };
}

export function isWorldGeneratorTemplateOption(
  value: unknown,
): value is WorldGeneratorTemplateOption {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.key === "string" && typeof record.name === "string";
}

export type GeneratorOptionRefinementLevel = WorldOptionRefinementLevel;

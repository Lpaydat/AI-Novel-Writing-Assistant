import type {
  CharacterRules,
  LanguageRules,
  NarrativeRules,
  RhythmRules,
} from "@ai-novel/shared/types/styleEngine";
import i18n from "@/i18n";

export type RuleSection = "narrativeRules" | "characterRules" | "languageRules" | "rhythmRules";
type RuleObject = NarrativeRules | CharacterRules | LanguageRules | RhythmRules;

export interface RuleEntry {
  key: string;
  label: string;
  value: string;
}

const FIELD_ORDER: Record<RuleSection, string[]> = {
  narrativeRules: [
    "summary",
    "progressionMode",
    "sceneUnitPattern",
    "multiPov",
    "looping",
    "endingStyle",
    "povSwitchStyle",
  ],
  characterRules: [
    "summary",
    "dialogueStyle",
    "emotionExpression",
    "defenseMechanisms",
    "allowSelfReflection",
    "facePriority",
  ],
  languageRules: [
    "summary",
    "register",
    "roughness",
    "sentenceVariation",
    "allowIncompleteSentences",
    "allowSwearing",
    "allowUselessDetails",
  ],
  rhythmRules: [
    "summary",
    "pace",
    "paragraphDensity",
    "allowFragmentedFlow",
    "actionOverExplanation",
  ],
};

// Maps hold flat i18n key strings (resolved via i18n.t at call time so locale
// switching keeps working); the field/token identifiers stay as logic keys.
const FIELD_LABELS: Record<RuleSection, Record<string, string>> = {
  narrativeRules: {
    summary: "ruleLabel.narrativeRules.summary",
    progressionMode: "ruleLabel.narrativeRules.progressionMode",
    sceneUnitPattern: "ruleLabel.narrativeRules.sceneUnitPattern",
    multiPov: "ruleLabel.narrativeRules.multiPov",
    looping: "ruleLabel.narrativeRules.looping",
    endingStyle: "ruleLabel.narrativeRules.endingStyle",
    povSwitchStyle: "ruleLabel.narrativeRules.povSwitchStyle",
  },
  characterRules: {
    summary: "ruleLabel.characterRules.summary",
    dialogueStyle: "ruleLabel.characterRules.dialogueStyle",
    emotionExpression: "ruleLabel.characterRules.emotionExpression",
    defenseMechanisms: "ruleLabel.characterRules.defenseMechanisms",
    allowSelfReflection: "ruleLabel.characterRules.allowSelfReflection",
    facePriority: "ruleLabel.characterRules.facePriority",
  },
  languageRules: {
    summary: "ruleLabel.languageRules.summary",
    register: "ruleLabel.languageRules.register",
    roughness: "ruleLabel.languageRules.roughness",
    sentenceVariation: "ruleLabel.languageRules.sentenceVariation",
    allowIncompleteSentences: "ruleLabel.languageRules.allowIncompleteSentences",
    allowSwearing: "ruleLabel.languageRules.allowSwearing",
    allowUselessDetails: "ruleLabel.languageRules.allowUselessDetails",
  },
  rhythmRules: {
    summary: "ruleLabel.rhythmRules.summary",
    pace: "ruleLabel.rhythmRules.pace",
    paragraphDensity: "ruleLabel.rhythmRules.paragraphDensity",
    allowFragmentedFlow: "ruleLabel.rhythmRules.allowFragmentedFlow",
    actionOverExplanation: "ruleLabel.rhythmRules.actionOverExplanation",
  },
};

const FIELD_VALUE_MAPS: Record<string, Record<string, string>> = {
  progressionMode: {
    time_sequence: "ruleValue.progressionMode.time_sequence",
    goal_driven: "ruleValue.progressionMode.goal_driven",
    mystery_escalation: "ruleValue.progressionMode.mystery_escalation",
    relationship_push_pull: "ruleValue.progressionMode.relationship_push_pull",
    multi_thread: "ruleValue.progressionMode.multi_thread",
    scene_immersion: "ruleValue.progressionMode.scene_immersion",
    fact_driven: "ruleValue.progressionMode.fact_driven",
    contrast_driven: "ruleValue.progressionMode.contrast_driven",
  },
  endingStyle: {
    unresolved: "ruleValue.endingStyle.unresolved",
    hook: "ruleValue.endingStyle.hook",
    suspense: "ruleValue.endingStyle.suspense",
    emotional_hook: "ruleValue.endingStyle.emotional_hook",
    cross_hook: "ruleValue.endingStyle.cross_hook",
    soft_open: "ruleValue.endingStyle.soft_open",
    pressure_continue: "ruleValue.endingStyle.pressure_continue",
    bitter_aftertaste: "ruleValue.endingStyle.bitter_aftertaste",
  },
  povSwitchStyle: {
    controlled: "ruleValue.povSwitchStyle.controlled",
  },
  emotionExpression: {
    behavior_only: "ruleValue.emotionExpression.behavior_only",
    dialogue_and_action: "ruleValue.emotionExpression.dialogue_and_action",
    reaction_only: "ruleValue.emotionExpression.reaction_only",
    subtext: "ruleValue.emotionExpression.subtext",
    mixed: "ruleValue.emotionExpression.mixed",
    light_behavior: "ruleValue.emotionExpression.light_behavior",
    suppressed: "ruleValue.emotionExpression.suppressed",
    deadpan: "ruleValue.emotionExpression.deadpan",
  },
  dialogueStyle: {
    short_colloquial: "ruleValue.dialogueStyle.short_colloquial",
    direct: "ruleValue.dialogueStyle.direct",
    restrained: "ruleValue.dialogueStyle.restrained",
    subtext_heavy: "ruleValue.dialogueStyle.subtext_heavy",
    distinct_by_role: "ruleValue.dialogueStyle.distinct_by_role",
    daily_natural: "ruleValue.dialogueStyle.daily_natural",
    informational: "ruleValue.dialogueStyle.informational",
    deadpan_colloquial: "ruleValue.dialogueStyle.deadpan_colloquial",
  },
  register: {
    colloquial: "ruleValue.register.colloquial",
    direct: "ruleValue.register.direct",
    restrained: "ruleValue.register.restrained",
    natural: "ruleValue.register.natural",
    flexible: "ruleValue.register.flexible",
    professional: "ruleValue.register.professional",
  },
  sentenceVariation: {
    high: "ruleValue.sentenceVariation.high",
    medium: "ruleValue.sentenceVariation.medium",
    medium_high: "ruleValue.sentenceVariation.medium_high",
  },
  pace: {
    medium_fast: "ruleValue.pace.medium_fast",
    fast: "ruleValue.pace.fast",
    medium: "ruleValue.pace.medium",
    medium_slow: "ruleValue.pace.medium_slow",
    balanced: "ruleValue.pace.balanced",
    slow: "ruleValue.pace.slow",
  },
  paragraphDensity: {
    high: "ruleValue.paragraphDensity.high",
    medium: "ruleValue.paragraphDensity.medium",
    medium_high: "ruleValue.paragraphDensity.medium_high",
  },
};

function compactText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function humanizeUnknownToken(value: string): string {
  return value.replace(/_/g, " ").trim();
}

function formatBooleanValue(key: string, value: boolean): string {
  const booleanKeys = new Set([
    "multiPov",
    "looping",
    "allowSelfReflection",
    "facePriority",
    "allowIncompleteSentences",
    "allowSwearing",
    "allowUselessDetails",
    "allowFragmentedFlow",
    "actionOverExplanation",
  ]);
  const bucket = booleanKeys.has(key) ? key : "default";
  return i18n.t(`ruleBool.${bucket}.${value ? "true" : "false"}`, { ns: "writingFormula" });
}

function formatArrayValue(value: unknown[]): string {
  return value
    .map((item) => {
      if (typeof item === "string") {
        return humanizeUnknownToken(item);
      }
      return String(item);
    })
    .filter(Boolean)
    .join(" / ");
}

export function formatRuleFieldLabel(section: RuleSection, key: string): string {
  const labelKey = FIELD_LABELS[section][key];
  return labelKey ? i18n.t(labelKey, { ns: "writingFormula" }) : humanizeUnknownToken(key);
}

export function formatRuleFieldValue(section: RuleSection, key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return formatBooleanValue(key, value);
  }

  if (typeof value === "number") {
    if (key === "roughness") {
      return `${Math.round(value * 100)} / 100`;
    }
    return String(value);
  }

  if (Array.isArray(value)) {
    return formatArrayValue(value);
  }

  if (typeof value === "string") {
    const normalized = compactText(value);
    if (!normalized) {
      return "";
    }
    const valueKey = FIELD_VALUE_MAPS[key]?.[normalized];
    return valueKey ? i18n.t(valueKey, { ns: "writingFormula" }) : normalized;
  }

  return "";
}

export function buildReadableRuleEntries(section: RuleSection, rules: RuleObject | Record<string, unknown>): RuleEntry[] {
  const record = rules as Record<string, unknown>;
  const keySet = new Set<string>([
    ...FIELD_ORDER[section],
    ...Object.keys(record),
  ]);

  return Array.from(keySet)
    .map((key) => ({
      key,
      label: formatRuleFieldLabel(section, key),
      value: formatRuleFieldValue(section, key, record[key]),
    }))
    .filter((entry) => Boolean(entry.value))
    .sort((left, right) => {
      const leftIndex = FIELD_ORDER[section].indexOf(left.key);
      const rightIndex = FIELD_ORDER[section].indexOf(right.key);
      const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      return normalizedLeft - normalizedRight;
    });
}

export function buildReadableRuleSummary(
  section: RuleSection,
  rules: RuleObject | Record<string, unknown>,
  fallback: string,
): string {
  const entries = buildReadableRuleEntries(section, rules);
  if (entries.length === 0) {
    return fallback;
  }

  return entries
    .slice(0, 3)
    .map((entry) => (
      entry.key === "summary"
        ? entry.value
        : i18n.t("format.labelValue", { ns: "writingFormula", label: entry.label, value: entry.value })
    ))
    .join(i18n.t("format.separator", { ns: "writingFormula" }));
}

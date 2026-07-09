import type { DirectorRunMode, DirectorWorldSetupMode } from "@ai-novel/shared/types/novelDirector";
import type { StyleIntentSummary } from "@ai-novel/shared/types/styleEngine";
import type { NovelBasicFormState } from "../novelBasicInfo.shared";
import {
  EMOTION_OPTIONS,
  PACE_OPTIONS,
  POV_OPTIONS,
  READER_CHANNEL_OPTIONS,
} from "../novelBasicInfo.shared";
import type { DirectorRunModeOption } from "../components/NovelAutoDirectorDialog.shared";
import i18n from "@/i18n";

export type AutoDirectorCreateStageKey = "idea" | "basic" | "world_style" | "model_run" | "candidates";

/**
 * `label` holds an i18n key (namespace `novelsAutoDirector`) resolved with
 * `t()` at the React call site so the label follows the active locale rather
 * than freezing at module-load time.
 */
export const AUTO_DIRECTOR_CREATE_STAGES: Array<{
  key: AutoDirectorCreateStageKey;
  order: number;
  label: string;
}> = [
  { key: "idea", order: 0, label: "stages.label.idea" },
  { key: "basic", order: 1, label: "stages.label.basic" },
  { key: "world_style", order: 2, label: "stages.label.world_style" },
  { key: "model_run", order: 3, label: "stages.label.model_run" },
  { key: "candidates", order: 4, label: "stages.label.candidates" },
];

function findLabel(options: Array<{ value: string; label: string }>, value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function summarizeIdea(idea: string): string {
  const normalized = idea.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return i18n.t("stages.summary.idea.empty", { ns: "novelsAutoDirector" });
  }
  return normalized.length > 42 ? `${normalized.slice(0, 42)}...` : normalized;
}

export function summarizeBasicStage(basicForm: NovelBasicFormState): string {
  return [
    findLabel(READER_CHANNEL_OPTIONS, basicForm.readerChannelPreference),
    findLabel(POV_OPTIONS, basicForm.narrativePov),
    findLabel(PACE_OPTIONS, basicForm.pacePreference),
    findLabel(EMOTION_OPTIONS, basicForm.emotionIntensity),
    i18n.t("stages.summary.basic.chapters", { ns: "novelsAutoDirector", count: basicForm.estimatedChapterCount }),
  ].join(" · ");
}

export function summarizeWorldStyleStage(input: {
  basicForm: NovelBasicFormState;
  worldOptions: Array<{ id: string; name: string }>;
  worldSetupMode: DirectorWorldSetupMode;
  styleProfileId: string;
  styleProfiles: Array<{ id: string; name: string }>;
  selectedStyleSummary: StyleIntentSummary | null;
}): string {
  const selectedWorld = input.worldOptions.find((world) => world.id === input.basicForm.worldId);
  const worldLabel = selectedWorld
    ? i18n.t("stages.summary.world.reference", { ns: "novelsAutoDirector", name: selectedWorld.name })
    : input.worldSetupMode === "skip"
      ? i18n.t("stages.summary.world.skip", { ns: "novelsAutoDirector" })
      : i18n.t("stages.summary.world.autoGenerate", { ns: "novelsAutoDirector" });
  const styleProfile = input.styleProfiles.find((profile) => profile.id === input.styleProfileId);
  const styleLabel = styleProfile?.name
    ?? input.selectedStyleSummary?.headline
    ?? (input.basicForm.styleTone.trim()
      ? i18n.t("stages.summary.style.tone", { ns: "novelsAutoDirector", tone: input.basicForm.styleTone.trim() })
      : i18n.t("stages.summary.style.default", { ns: "novelsAutoDirector" }));
  return `${worldLabel} · ${styleLabel}`;
}

export function summarizeModelRunStage(input: {
  runMode: DirectorRunMode;
  runModeOptions: DirectorRunModeOption[];
  postGenerationStyleReviewEnabled: boolean;
}): string {
  const runModeLabel = input.runModeOptions.find((option) => option.value === input.runMode)?.label ?? input.runMode;
  return `${runModeLabel} · ${input.postGenerationStyleReviewEnabled
    ? i18n.t("stages.summary.run.styleReviewOn", { ns: "novelsAutoDirector" })
    : i18n.t("stages.summary.run.styleReviewOff", { ns: "novelsAutoDirector" })}`;
}

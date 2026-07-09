import type {
  VolumeBeatSheet,
  VolumeChapterListGenerationMode,
  VolumeGenerationScopeInput,
  VolumePlan,
  VolumePlanDocument,
} from "@ai-novel/shared/types/novel";
import { findBeatSheet } from "../volumePlan.utils";
import type { ChapterDetailMode } from "../chapterDetailPlanning.shared";
import i18n from "@/i18n";

export interface ChapterListGenerationRequest {
  generationMode?: VolumeChapterListGenerationMode;
  targetBeatKey?: string;
}

export interface VolumeGenerationPayload {
  scope: VolumeGenerationScopeInput;
  generationMode?: VolumeChapterListGenerationMode;
  targetVolumeId?: string;
  targetBeatKey?: string;
  targetChapterId?: string;
  detailMode?: ChapterDetailMode;
  draftVolumesOverride?: VolumePlan[];
  suppressSuccessMessage?: boolean;
}

export function startStrategyGenerationAction(params: {
  ensureCharacterGuard: () => boolean;
  userPreferredVolumeCount: number | null;
  forceSystemRecommendedVolumeCount: boolean;
  volumeCountGuidance: {
    systemRecommendedVolumeCount: number;
    allowedVolumeCountRange: { min: number; max: number };
    respectedExistingVolumeCount?: number | null;
  };
  hasUnsavedVolumeDraft: boolean;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  if (!params.ensureCharacterGuard()) {
    return;
  }
  const confirmed = window.confirm([
    i18n.t("strategyConfirm.intro", { ns: "novelsHooks" }),
    i18n.t("strategyConfirm.note", { ns: "novelsHooks" }),
    params.userPreferredVolumeCount != null
      ? i18n.t("strategyConfirm.fixedCount", { ns: "novelsHooks", count: params.userPreferredVolumeCount })
      : params.forceSystemRecommendedVolumeCount
        ? i18n.t("strategyConfirm.systemRecommended", {
          ns: "novelsHooks",
          count: params.volumeCountGuidance.systemRecommendedVolumeCount,
        })
        : params.volumeCountGuidance.respectedExistingVolumeCount != null
          ? i18n.t("strategyConfirm.respectExisting", {
            ns: "novelsHooks",
            count: params.volumeCountGuidance.respectedExistingVolumeCount,
            min: params.volumeCountGuidance.allowedVolumeCountRange.min,
            max: params.volumeCountGuidance.allowedVolumeCountRange.max,
          })
          : i18n.t("strategyConfirm.rangeHint", {
            ns: "novelsHooks",
            recommended: params.volumeCountGuidance.systemRecommendedVolumeCount,
            min: params.volumeCountGuidance.allowedVolumeCountRange.min,
            max: params.volumeCountGuidance.allowedVolumeCountRange.max,
          }),
    params.hasUnsavedVolumeDraft
      ? i18n.t("strategyConfirm.useUnsavedDraft", { ns: "novelsHooks" })
      : i18n.t("strategyConfirm.useWorkspaceState", { ns: "novelsHooks" }),
  ].join("\n\n"));
  if (!confirmed) {
    return;
  }
  params.generate({ scope: "strategy" });
}

export function startStrategyCritiqueAction(params: {
  ensureCharacterGuard: () => boolean;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  if (!params.ensureCharacterGuard()) {
    return;
  }
  params.generate({ scope: "strategy_critique" });
}

export function startSkeletonGenerationAction(params: {
  ensureCharacterGuard: () => boolean;
  hasUnsavedVolumeDraft: boolean;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  if (!params.ensureCharacterGuard()) {
    return;
  }
  const confirmed = window.confirm([
    i18n.t("skeletonConfirm.intro", { ns: "novelsHooks" }),
    i18n.t("skeletonConfirm.note", { ns: "novelsHooks" }),
    params.hasUnsavedVolumeDraft
      ? i18n.t("skeletonConfirm.useDraft", { ns: "novelsHooks" })
      : i18n.t("skeletonConfirm.useWorkspace", { ns: "novelsHooks" }),
  ].join("\n\n"));
  if (!confirmed) {
    return;
  }
  params.generate({ scope: "skeleton" });
}

export function startBeatSheetGenerationAction(params: {
  volumeId: string;
  normalizedVolumeDraft: VolumePlan[];
  strategyPlan: object | null;
  beatSheets: VolumeBeatSheet[];
  ensureCharacterGuard: () => boolean;
  setStructuredMessage: (value: string) => void;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  const targetVolume = params.normalizedVolumeDraft.find((volume) => volume.id === params.volumeId);
  if (!targetVolume) {
    params.setStructuredMessage(i18n.t("beatSheet.volumeMissing", { ns: "novelsHooks" }));
    return;
  }
  if (!params.strategyPlan) {
    params.setStructuredMessage(i18n.t("beatSheet.needStrategy", { ns: "novelsHooks" }));
    return;
  }
  if (!params.ensureCharacterGuard()) {
    return;
  }
  const existingBeatSheet = findBeatSheet(params.beatSheets, params.volumeId);
  if (existingBeatSheet) {
    const confirmed = window.confirm([
      i18n.t("beatSheetConfirm.regen", {
        ns: "novelsHooks",
        title: targetVolume.title?.trim() || i18n.t("common.volumeLabel", { ns: "novelsHooks", order: targetVolume.sortOrder }),
      }),
      i18n.t("beatSheetConfirm.overwrite", { ns: "novelsHooks" }),
      i18n.t("beatSheetConfirm.note", { ns: "novelsHooks" }),
    ].join("\n\n"));
    if (!confirmed) {
      return;
    }
  }
  params.generate({
    scope: "beat_sheet",
    targetVolumeId: params.volumeId,
  });
}

export function startChapterListGenerationAction(params: {
  volumeId: string;
  request?: ChapterListGenerationRequest;
  normalizedVolumeDraft: VolumePlan[];
  beatSheets: VolumeBeatSheet[];
  ensureCharacterGuard: () => boolean;
  setStructuredMessage: (value: string) => void;
  generate: (payload: VolumeGenerationPayload) => void;
}): void {
  const targetVolume = params.normalizedVolumeDraft.find((volume) => volume.id === params.volumeId);
  if (!targetVolume) {
    params.setStructuredMessage(i18n.t("chapterList.volumeMissing", { ns: "novelsHooks" }));
    return;
  }
  if (!findBeatSheet(params.beatSheets, params.volumeId)) {
    params.setStructuredMessage(i18n.t("chapterList.needBeatSheet", { ns: "novelsHooks" }));
    return;
  }
  if (!params.ensureCharacterGuard()) {
    return;
  }
  const generationMode = params.request?.generationMode ?? "full_volume";
  const targetBeatKey = params.request?.targetBeatKey?.trim();
  if (generationMode === "single_beat" && !targetBeatKey) {
    params.setStructuredMessage(i18n.t("chapterList.beatMissing", { ns: "novelsHooks" }));
    return;
  }
  params.generate({
    scope: "chapter_list",
    generationMode,
    targetVolumeId: params.volumeId,
    targetBeatKey,
  });
}

export function buildChapterListSuccessMessage(params: {
  document: VolumePlanDocument;
  targetVolumeId?: string;
  generationMode?: VolumeChapterListGenerationMode;
  targetBeatKey?: string;
  autoSyncedToChapterExecution?: boolean;
}): string {
  const updatedVolume = params.targetVolumeId
    ? params.document.volumes.find((volume) => volume.id === params.targetVolumeId)
    : undefined;
  const updatedChapterCount = updatedVolume?.chapters.length ?? 0;
  const syncSuffix = params.autoSyncedToChapterExecution
    ? i18n.t("chapterListMessage.syncSuffix", { ns: "novelsHooks" })
    : "";
  if (params.generationMode === "single_beat" && params.targetVolumeId && params.targetBeatKey) {
    const targetBeat = findBeatSheet(params.document.beatSheets, params.targetVolumeId)?.beats
      .find((beat) => beat.key === params.targetBeatKey);
    return updatedChapterCount > 0
      ? i18n.t("chapterListMessage.singleBeatWithCount", {
        ns: "novelsHooks",
        beat: targetBeat?.label ?? params.targetBeatKey,
        suffix: syncSuffix,
        count: updatedChapterCount,
      })
      : i18n.t("chapterListMessage.singleBeat", {
        ns: "novelsHooks",
        beat: targetBeat?.label ?? params.targetBeatKey,
        suffix: syncSuffix,
      });
  }
  return updatedChapterCount > 0
    ? i18n.t("chapterListMessage.fullWithCount", { ns: "novelsHooks", suffix: syncSuffix, count: updatedChapterCount })
    : i18n.t("chapterListMessage.full", { ns: "novelsHooks", suffix: syncSuffix });
}

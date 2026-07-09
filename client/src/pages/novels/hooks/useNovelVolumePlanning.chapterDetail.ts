import type { VolumePlan, VolumePlanDocument } from "@ai-novel/shared/types/novel";
import {
  CHAPTER_DETAIL_MODES,
  hasAnyChapterDetailDraft,
  hasChapterDetailDraft,
  type ChapterDetailBundleRequest,
  type ChapterDetailMode,
} from "../chapterDetailPlanning.shared";
import i18n from "@/i18n";

interface ChapterDetailTarget {
  chapterId: string;
  chapterOrder: number;
  title: string;
}

interface ResolvedChapterDetailBatch {
  label: string;
  missingCount: number;
  targets: ChapterDetailTarget[];
  hasExistingDrafts: boolean;
}

interface ChapterDetailMutationPayload {
  targetVolumeId: string;
  targetChapterId: string;
  detailMode: ChapterDetailMode;
  draftVolumesOverride: VolumePlan[];
  suppressSuccessMessage: true;
}

interface ChapterDetailMutationResult {
  nextDocument: VolumePlanDocument;
}

interface RunChapterDetailBatchGenerationArgs {
  initialDraft: VolumePlan[];
  label: string;
  targetVolumeId: string;
  targets: ChapterDetailTarget[];
  setIsGenerating: (value: boolean) => void;
  setCurrentChapterId: (value: string) => void;
  setCurrentMode: (value: ChapterDetailMode | "") => void;
  setStructuredMessage: (value: string) => void;
  generateChapterDetail: (
    payload: ChapterDetailMutationPayload,
  ) => Promise<ChapterDetailMutationResult>;
}

function describeChapterTarget(target: ChapterDetailTarget): string {
  return i18n.t("chapterDetail.chapterLabel", {
    ns: "novelsHooks",
    order: target.chapterOrder,
    title: target.title || i18n.t("common.untitledChapter", { ns: "novelsHooks" }),
  });
}

function buildFallbackLabel(targets: ChapterDetailTarget[]): string {
  if (targets.length === 1) {
    return describeChapterTarget(targets[0]);
  }
  const first = targets[0];
  const last = targets[targets.length - 1];
  if (!first || !last) {
    return i18n.t("chapterDetail.currentChapterRange", { ns: "novelsHooks" });
  }
  return i18n.t("chapterDetail.chapterRangeLabel", {
    ns: "novelsHooks",
    first: first.chapterOrder,
    last: last.chapterOrder,
    count: targets.length,
  });
}

function resolveMissingChapterDetailModes(
  draft: VolumePlan[],
  targetVolumeId: string,
  targetChapterId: string,
): ChapterDetailMode[] {
  const chapter = draft
    .find((volume) => volume.id === targetVolumeId)
    ?.chapters.find((item) => item.id === targetChapterId);
  if (!chapter) {
    return [];
  }
  return CHAPTER_DETAIL_MODES.filter((mode) => !hasChapterDetailDraft(chapter, mode));
}

export function resolveChapterDetailBatch(
  volume: VolumePlan | undefined,
  request: ChapterDetailBundleRequest,
): ResolvedChapterDetailBatch {
  const requestedIds = typeof request === "string"
    ? [request]
    : Array.from(new Set(request.chapterIds.map((id) => id.trim()).filter(Boolean)));
  const matchedChapters = requestedIds
    .map((chapterId) => volume?.chapters.find((chapter) => chapter.id === chapterId))
    .filter((chapter): chapter is VolumePlan["chapters"][number] => Boolean(chapter));

  return {
    label: typeof request === "string"
      ? buildFallbackLabel(matchedChapters.map((chapter) => ({
        chapterId: chapter.id,
        chapterOrder: chapter.chapterOrder,
        title: chapter.title,
      })))
      : request.label?.trim() || buildFallbackLabel(matchedChapters.map((chapter) => ({
        chapterId: chapter.id,
        chapterOrder: chapter.chapterOrder,
        title: chapter.title,
      }))),
    missingCount: Math.max(requestedIds.length - matchedChapters.length, 0),
    targets: matchedChapters.map((chapter) => ({
      chapterId: chapter.id,
      chapterOrder: chapter.chapterOrder,
      title: chapter.title,
    })),
    hasExistingDrafts: matchedChapters.some((chapter) => hasAnyChapterDetailDraft(chapter)),
  };
}

export function buildChapterDetailBatchConfirmationMessage(
  batch: ResolvedChapterDetailBatch,
): string {
  return [
    batch.targets.length === 1
      ? i18n.t("chapterDetail.confirmSingle", { ns: "novelsHooks", label: batch.label })
      : i18n.t("chapterDetail.confirmBatch", { ns: "novelsHooks", label: batch.label }),
    batch.hasExistingDrafts
      ? i18n.t("chapterDetail.confirmReuse", { ns: "novelsHooks" })
      : i18n.t("chapterDetail.confirmBlank", { ns: "novelsHooks" }),
    i18n.t("chapterDetail.confirmNoTitleChange", { ns: "novelsHooks" }),
    batch.missingCount > 0 ? i18n.t("chapterDetail.confirmSkip", { ns: "novelsHooks", count: batch.missingCount }) : "",
  ].filter(Boolean).join("\n\n");
}

export async function runChapterDetailBatchGeneration({
  initialDraft,
  label,
  targetVolumeId,
  targets,
  setIsGenerating,
  setCurrentChapterId,
  setCurrentMode,
  setStructuredMessage,
  generateChapterDetail,
}: RunChapterDetailBatchGenerationArgs): Promise<void> {
  let workingDraft = initialDraft;
  let processedModeCount = 0;
  setIsGenerating(true);
  setCurrentMode("");
  setCurrentChapterId(targets[0]?.chapterId ?? "");
  setStructuredMessage(i18n.t("chapterDetail.generating", { ns: "novelsHooks", label }));

  try {
    for (const target of targets) {
      const missingModes = resolveMissingChapterDetailModes(workingDraft, targetVolumeId, target.chapterId);
      if (missingModes.length === 0) {
        continue;
      }
      setCurrentChapterId(target.chapterId);
      for (const mode of missingModes) {
        setCurrentMode(mode);
        const result = await generateChapterDetail({
          targetVolumeId,
          targetChapterId: target.chapterId,
          detailMode: mode,
          draftVolumesOverride: workingDraft,
          suppressSuccessMessage: true,
        });
        workingDraft = result.nextDocument.volumes;
        processedModeCount += 1;
      }
    }
    setStructuredMessage(
      processedModeCount > 0
        ? i18n.t("chapterDetail.doneFilled", { ns: "novelsHooks", label })
        : i18n.t("chapterDetail.doneComplete", { ns: "novelsHooks", label }),
    );
  } catch {
    // error message is handled by mutation onError
  } finally {
    setIsGenerating(false);
    setCurrentChapterId("");
    setCurrentMode("");
  }
}

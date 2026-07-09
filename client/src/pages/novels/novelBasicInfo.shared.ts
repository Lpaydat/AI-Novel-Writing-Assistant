import type { BookAnalysisSectionKey } from "@ai-novel/shared/types/bookAnalysis";
import { formatCommercialTagsInput, normalizeCommercialTags } from "@ai-novel/shared/types/novelFraming";
import i18n from "@/i18n";

export interface NovelBasicFormState {
  title: string;
  description: string;
  targetAudience: string;
  bookSellingPoint: string;
  competingFeel: string;
  first30ChapterPromise: string;
  commercialTagsText: string;
  genreId: string;
  primaryStoryModeId: string;
  secondaryStoryModeId: string;
  worldId: string;
  status: "draft" | "published";
  writingMode: "original" | "continuation";
  projectMode: "ai_led" | "co_pilot" | "draft_mode" | "auto_pipeline";
  readerChannelPreference: "ai_judge" | "male_oriented" | "female_oriented" | "general";
  narrativePov: "first_person" | "third_person" | "mixed";
  pacePreference: "slow" | "balanced" | "fast";
  styleTone: string;
  emotionIntensity: "low" | "medium" | "high";
  aiFreedom: "low" | "medium" | "high";
  postGenerationStyleReviewEnabled: boolean;
  defaultChapterLength: number;
  estimatedChapterCount: number;
  projectStatus: "not_started" | "in_progress" | "completed" | "rework" | "blocked";
  storylineStatus: "not_started" | "in_progress" | "completed" | "rework" | "blocked";
  outlineStatus: "not_started" | "in_progress" | "completed" | "rework" | "blocked";
  resourceReadyScore: number;
  continuationSourceType: "novel" | "knowledge_document";
  sourceNovelId: string;
  sourceKnowledgeDocumentId: string;
  continuationBookAnalysisId: string;
  continuationBookAnalysisSections: BookAnalysisSectionKey[];
}

export interface BasicInfoOption<T extends string> {
  value: T;
  label: string;
  summary: string;
  recommended?: boolean;
}

export const DEFAULT_ESTIMATED_CHAPTER_COUNT = 80;

export const WRITING_MODE_OPTIONS: BasicInfoOption<NovelBasicFormState["writingMode"]>[] = [
  {
    value: "original",
    get label() { return i18n.t("basicInfo.writingMode.original.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.writingMode.original.summary", { ns: "novelsEditB" }); },
    recommended: true,
  },
  {
    value: "continuation",
    get label() { return i18n.t("basicInfo.writingMode.continuation.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.writingMode.continuation.summary", { ns: "novelsEditB" }); },
  },
];

export const PROJECT_MODE_OPTIONS: BasicInfoOption<NovelBasicFormState["projectMode"]>[] = [
  {
    value: "co_pilot",
    get label() { return i18n.t("basicInfo.projectMode.co_pilot.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.projectMode.co_pilot.summary", { ns: "novelsEditB" }); },
    recommended: true,
  },
  {
    value: "ai_led",
    get label() { return i18n.t("basicInfo.projectMode.ai_led.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.projectMode.ai_led.summary", { ns: "novelsEditB" }); },
  },
  {
    value: "draft_mode",
    get label() { return i18n.t("basicInfo.projectMode.draft_mode.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.projectMode.draft_mode.summary", { ns: "novelsEditB" }); },
  },
  {
    value: "auto_pipeline",
    get label() { return i18n.t("basicInfo.projectMode.auto_pipeline.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.projectMode.auto_pipeline.summary", { ns: "novelsEditB" }); },
  },
];

export const READER_CHANNEL_OPTIONS: BasicInfoOption<NovelBasicFormState["readerChannelPreference"]>[] = [
  {
    value: "ai_judge",
    get label() { return i18n.t("basicInfo.readerChannel.ai_judge.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.readerChannel.ai_judge.summary", { ns: "novelsEditB" }); },
    recommended: true,
  },
  {
    value: "male_oriented",
    get label() { return i18n.t("basicInfo.readerChannel.male_oriented.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.readerChannel.male_oriented.summary", { ns: "novelsEditB" }); },
  },
  {
    value: "female_oriented",
    get label() { return i18n.t("basicInfo.readerChannel.female_oriented.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.readerChannel.female_oriented.summary", { ns: "novelsEditB" }); },
  },
  {
    value: "general",
    get label() { return i18n.t("basicInfo.readerChannel.general.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.readerChannel.general.summary", { ns: "novelsEditB" }); },
  },
];

export const POV_OPTIONS: BasicInfoOption<NovelBasicFormState["narrativePov"]>[] = [
  {
    value: "third_person",
    get label() { return i18n.t("basicInfo.pov.third_person.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.pov.third_person.summary", { ns: "novelsEditB" }); },
    recommended: true,
  },
  {
    value: "first_person",
    get label() { return i18n.t("basicInfo.pov.first_person.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.pov.first_person.summary", { ns: "novelsEditB" }); },
  },
  {
    value: "mixed",
    get label() { return i18n.t("basicInfo.pov.mixed.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.pov.mixed.summary", { ns: "novelsEditB" }); },
  },
];

export const PACE_OPTIONS: BasicInfoOption<NovelBasicFormState["pacePreference"]>[] = [
  {
    value: "balanced",
    get label() { return i18n.t("basicInfo.pace.balanced.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.pace.balanced.summary", { ns: "novelsEditB" }); },
    recommended: true,
  },
  {
    value: "slow",
    get label() { return i18n.t("basicInfo.pace.slow.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.pace.slow.summary", { ns: "novelsEditB" }); },
  },
  {
    value: "fast",
    get label() { return i18n.t("basicInfo.pace.fast.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.pace.fast.summary", { ns: "novelsEditB" }); },
  },
];

export const EMOTION_OPTIONS: BasicInfoOption<NovelBasicFormState["emotionIntensity"]>[] = [
  {
    value: "medium",
    get label() { return i18n.t("basicInfo.emotion.medium.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.emotion.medium.summary", { ns: "novelsEditB" }); },
    recommended: true,
  },
  {
    value: "low",
    get label() { return i18n.t("basicInfo.emotion.low.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.emotion.low.summary", { ns: "novelsEditB" }); },
  },
  {
    value: "high",
    get label() { return i18n.t("basicInfo.emotion.high.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.emotion.high.summary", { ns: "novelsEditB" }); },
  },
];

export const AI_FREEDOM_OPTIONS: BasicInfoOption<NovelBasicFormState["aiFreedom"]>[] = [
  {
    value: "medium",
    get label() { return i18n.t("basicInfo.aiFreedom.medium.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.aiFreedom.medium.summary", { ns: "novelsEditB" }); },
    recommended: true,
  },
  {
    value: "low",
    get label() { return i18n.t("basicInfo.aiFreedom.low.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.aiFreedom.low.summary", { ns: "novelsEditB" }); },
  },
  {
    value: "high",
    get label() { return i18n.t("basicInfo.aiFreedom.high.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.aiFreedom.high.summary", { ns: "novelsEditB" }); },
  },
];

export const PUBLICATION_STATUS_OPTIONS: BasicInfoOption<NovelBasicFormState["status"]>[] = [
  {
    value: "draft",
    get label() { return i18n.t("basicInfo.publicationStatus.draft.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.publicationStatus.draft.summary", { ns: "novelsEditB" }); },
    recommended: true,
  },
  {
    value: "published",
    get label() { return i18n.t("basicInfo.publicationStatus.published.label", { ns: "novelsEditB" }); },
    get summary() { return i18n.t("basicInfo.publicationStatus.published.summary", { ns: "novelsEditB" }); },
  },
];

export const PROJECT_STATUS_OPTIONS: Array<{ value: NovelBasicFormState["projectStatus"]; label: string }> = [
  { value: "not_started", get label() { return i18n.t("basicInfo.projectStatus.not_started.label", { ns: "novelsEditB" }); } },
  { value: "in_progress", get label() { return i18n.t("basicInfo.projectStatus.in_progress.label", { ns: "novelsEditB" }); } },
  { value: "completed", get label() { return i18n.t("basicInfo.projectStatus.completed.label", { ns: "novelsEditB" }); } },
  { value: "rework", get label() { return i18n.t("basicInfo.projectStatus.rework.label", { ns: "novelsEditB" }); } },
  { value: "blocked", get label() { return i18n.t("basicInfo.projectStatus.blocked.label", { ns: "novelsEditB" }); } },
];

export const BASIC_INFO_FIELD_HINTS = {
  get writingMode() { return i18n.t("basicInfo.hint.writingMode", { ns: "novelsEditB" }); },
  get targetAudience() { return i18n.t("basicInfo.hint.targetAudience", { ns: "novelsEditB" }); },
  get bookSellingPoint() { return i18n.t("basicInfo.hint.bookSellingPoint", { ns: "novelsEditB" }); },
  get competingFeel() { return i18n.t("basicInfo.hint.competingFeel", { ns: "novelsEditB" }); },
  get first30ChapterPromise() { return i18n.t("basicInfo.hint.first30ChapterPromise", { ns: "novelsEditB" }); },
  get commercialTagsText() { return i18n.t("basicInfo.hint.commercialTagsText", { ns: "novelsEditB" }); },
  get projectMode() { return i18n.t("basicInfo.hint.projectMode", { ns: "novelsEditB" }); },
  get readerChannelPreference() { return i18n.t("basicInfo.hint.readerChannelPreference", { ns: "novelsEditB" }); },
  get narrativePov() { return i18n.t("basicInfo.hint.narrativePov", { ns: "novelsEditB" }); },
  get pacePreference() { return i18n.t("basicInfo.hint.pacePreference", { ns: "novelsEditB" }); },
  get emotionIntensity() { return i18n.t("basicInfo.hint.emotionIntensity", { ns: "novelsEditB" }); },
  get aiFreedom() { return i18n.t("basicInfo.hint.aiFreedom", { ns: "novelsEditB" }); },
  get postGenerationStyleReviewEnabled() { return i18n.t("basicInfo.hint.postGenerationStyleReviewEnabled", { ns: "novelsEditB" }); },
  get defaultChapterLength() { return i18n.t("basicInfo.hint.defaultChapterLength", { ns: "novelsEditB" }); },
  get estimatedChapterCount() { return i18n.t("basicInfo.hint.estimatedChapterCount", { ns: "novelsEditB" }); },
  get resourceReadyScore() { return i18n.t("basicInfo.hint.resourceReadyScore", { ns: "novelsEditB" }); },
  get styleTone() { return i18n.t("basicInfo.hint.styleTone", { ns: "novelsEditB" }); },
  get genreId() { return i18n.t("basicInfo.hint.genreId", { ns: "novelsEditB" }); },
  get primaryStoryModeId() { return i18n.t("basicInfo.hint.primaryStoryModeId", { ns: "novelsEditB" }); },
  get secondaryStoryModeId() { return i18n.t("basicInfo.hint.secondaryStoryModeId", { ns: "novelsEditB" }); },
  get worldId() { return i18n.t("basicInfo.hint.worldId", { ns: "novelsEditB" }); },
  get status() { return i18n.t("basicInfo.hint.status", { ns: "novelsEditB" }); },
  get continuationSourceType() { return i18n.t("basicInfo.hint.continuationSourceType", { ns: "novelsEditB" }); },
  get continuationBookAnalysis() { return i18n.t("basicInfo.hint.continuationBookAnalysis", { ns: "novelsEditB" }); },
} satisfies Record<string, string>;

export function createDefaultNovelBasicFormState(): NovelBasicFormState {
  return {
    title: "",
    description: "",
    targetAudience: "",
    bookSellingPoint: "",
    competingFeel: "",
    first30ChapterPromise: "",
    commercialTagsText: "",
    genreId: "",
    primaryStoryModeId: "",
    secondaryStoryModeId: "",
    worldId: "",
    status: "draft",
    writingMode: "original",
    projectMode: "co_pilot",
    readerChannelPreference: "ai_judge",
    narrativePov: "third_person",
    pacePreference: "balanced",
    styleTone: "",
    emotionIntensity: "medium",
    aiFreedom: "medium",
    postGenerationStyleReviewEnabled: true,
    defaultChapterLength: 2800,
    estimatedChapterCount: DEFAULT_ESTIMATED_CHAPTER_COUNT,
    projectStatus: "not_started",
    storylineStatus: "not_started",
    outlineStatus: "not_started",
    resourceReadyScore: 0,
    continuationSourceType: "novel",
    sourceNovelId: "",
    sourceKnowledgeDocumentId: "",
    continuationBookAnalysisId: "",
    continuationBookAnalysisSections: [],
  };
}

export function patchNovelBasicForm(
  previous: NovelBasicFormState,
  patch: Partial<NovelBasicFormState>,
): NovelBasicFormState {
  const next = { ...previous, ...patch };
  if (
    next.primaryStoryModeId
    && next.secondaryStoryModeId
    && next.primaryStoryModeId === next.secondaryStoryModeId
  ) {
    next.secondaryStoryModeId = "";
  }
  if (next.writingMode === "original") {
    next.sourceNovelId = "";
    next.sourceKnowledgeDocumentId = "";
    next.continuationBookAnalysisId = "";
    next.continuationBookAnalysisSections = [];
  } else if (next.continuationSourceType === "novel") {
    next.sourceKnowledgeDocumentId = "";
  } else if (next.continuationSourceType === "knowledge_document") {
    next.sourceNovelId = "";
  }
  if (
    patch.continuationSourceType !== undefined
    && patch.continuationSourceType !== previous.continuationSourceType
  ) {
    next.continuationBookAnalysisId = "";
    next.continuationBookAnalysisSections = [];
  }
  if (
    next.continuationSourceType === "novel"
    && patch.sourceNovelId !== undefined
    && patch.sourceNovelId !== previous.sourceNovelId
  ) {
    next.continuationBookAnalysisId = "";
    next.continuationBookAnalysisSections = [];
  }
  if (
    next.continuationSourceType === "knowledge_document"
    && patch.sourceKnowledgeDocumentId !== undefined
    && patch.sourceKnowledgeDocumentId !== previous.sourceKnowledgeDocumentId
  ) {
    next.continuationBookAnalysisId = "";
    next.continuationBookAnalysisSections = [];
  }
  if (patch.continuationBookAnalysisId !== undefined && !patch.continuationBookAnalysisId) {
    next.continuationBookAnalysisSections = [];
  }
  return next;
}

export function buildNovelCreatePayload(basicForm: NovelBasicFormState) {
  const commercialTags = normalizeCommercialTags(basicForm.commercialTagsText);
  return {
    title: basicForm.title.trim(),
    description: basicForm.description.trim() || undefined,
    targetAudience: basicForm.targetAudience.trim() || undefined,
    bookSellingPoint: basicForm.bookSellingPoint.trim() || undefined,
    competingFeel: basicForm.competingFeel.trim() || undefined,
    first30ChapterPromise: basicForm.first30ChapterPromise.trim() || undefined,
    commercialTags: commercialTags.length > 0 ? commercialTags : undefined,
    genreId: basicForm.genreId || undefined,
    primaryStoryModeId: basicForm.primaryStoryModeId || undefined,
    secondaryStoryModeId: basicForm.secondaryStoryModeId || undefined,
    worldId: basicForm.worldId || undefined,
    writingMode: basicForm.writingMode,
    projectMode: basicForm.projectMode,
    narrativePov: basicForm.narrativePov,
    pacePreference: basicForm.pacePreference,
    styleTone: basicForm.styleTone.trim() || undefined,
    emotionIntensity: basicForm.emotionIntensity,
    aiFreedom: basicForm.aiFreedom,
    postGenerationStyleReviewEnabled: basicForm.postGenerationStyleReviewEnabled,
    defaultChapterLength: basicForm.defaultChapterLength,
    estimatedChapterCount: basicForm.estimatedChapterCount,
    projectStatus: basicForm.projectStatus,
    storylineStatus: basicForm.storylineStatus,
    outlineStatus: basicForm.outlineStatus,
    resourceReadyScore: basicForm.resourceReadyScore,
    sourceNovelId: basicForm.writingMode === "continuation" && basicForm.continuationSourceType === "novel"
      ? (basicForm.sourceNovelId || undefined)
      : undefined,
    sourceKnowledgeDocumentId: basicForm.writingMode === "continuation" && basicForm.continuationSourceType === "knowledge_document"
      ? (basicForm.sourceKnowledgeDocumentId || undefined)
      : undefined,
    continuationBookAnalysisId: basicForm.writingMode === "continuation"
      && (
        (basicForm.continuationSourceType === "novel" && Boolean(basicForm.sourceNovelId))
        || (basicForm.continuationSourceType === "knowledge_document" && Boolean(basicForm.sourceKnowledgeDocumentId))
      )
      ? (basicForm.continuationBookAnalysisId || undefined)
      : undefined,
    continuationBookAnalysisSections:
      basicForm.writingMode === "continuation"
        && (
          (basicForm.continuationSourceType === "novel" && Boolean(basicForm.sourceNovelId))
          || (basicForm.continuationSourceType === "knowledge_document" && Boolean(basicForm.sourceKnowledgeDocumentId))
        )
        && basicForm.continuationBookAnalysisId
        ? (basicForm.continuationBookAnalysisSections.length > 0 ? basicForm.continuationBookAnalysisSections : undefined)
        : undefined,
  };
}

export function buildNovelUpdatePayload(basicForm: NovelBasicFormState) {
  const commercialTags = normalizeCommercialTags(basicForm.commercialTagsText);
  return {
    title: basicForm.title,
    description: basicForm.description,
    targetAudience: basicForm.targetAudience.trim() || null,
    bookSellingPoint: basicForm.bookSellingPoint.trim() || null,
    competingFeel: basicForm.competingFeel.trim() || null,
    first30ChapterPromise: basicForm.first30ChapterPromise.trim() || null,
    commercialTags: commercialTags.length > 0 ? commercialTags : null,
    genreId: basicForm.genreId || null,
    primaryStoryModeId: basicForm.primaryStoryModeId || null,
    secondaryStoryModeId: basicForm.secondaryStoryModeId || null,
    worldId: basicForm.worldId || null,
    status: basicForm.status,
    writingMode: basicForm.writingMode,
    projectMode: basicForm.projectMode,
    narrativePov: basicForm.narrativePov,
    pacePreference: basicForm.pacePreference,
    styleTone: basicForm.styleTone || null,
    emotionIntensity: basicForm.emotionIntensity,
    aiFreedom: basicForm.aiFreedom,
    postGenerationStyleReviewEnabled: basicForm.postGenerationStyleReviewEnabled,
    defaultChapterLength: basicForm.defaultChapterLength,
    estimatedChapterCount: basicForm.estimatedChapterCount,
    projectStatus: basicForm.projectStatus,
    storylineStatus: basicForm.storylineStatus,
    outlineStatus: basicForm.outlineStatus,
    resourceReadyScore: basicForm.resourceReadyScore,
    sourceNovelId: basicForm.writingMode === "continuation" && basicForm.continuationSourceType === "novel"
      ? (basicForm.sourceNovelId || null)
      : null,
    sourceKnowledgeDocumentId: basicForm.writingMode === "continuation" && basicForm.continuationSourceType === "knowledge_document"
      ? (basicForm.sourceKnowledgeDocumentId || null)
      : null,
    continuationBookAnalysisId: basicForm.writingMode === "continuation"
      && (
        (basicForm.continuationSourceType === "novel" && Boolean(basicForm.sourceNovelId))
        || (basicForm.continuationSourceType === "knowledge_document" && Boolean(basicForm.sourceKnowledgeDocumentId))
      )
      ? (basicForm.continuationBookAnalysisId || null)
      : null,
    continuationBookAnalysisSections:
      basicForm.writingMode === "continuation"
        && (
          (basicForm.continuationSourceType === "novel" && Boolean(basicForm.sourceNovelId))
          || (basicForm.continuationSourceType === "knowledge_document" && Boolean(basicForm.sourceKnowledgeDocumentId))
        )
        && basicForm.continuationBookAnalysisId
        ? (basicForm.continuationBookAnalysisSections.length > 0 ? basicForm.continuationBookAnalysisSections : null)
        : null,
  };
}

export { formatCommercialTagsInput };

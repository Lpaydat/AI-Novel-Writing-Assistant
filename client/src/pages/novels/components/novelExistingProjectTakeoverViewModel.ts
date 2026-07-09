import i18n from "@/i18n";
import type {
  DirectorTaskSnapshot,
} from "@ai-novel/shared/types/directorRuntime";
import type {
  DirectorAutoExecutionPlan,
  DirectorRunMode,
  DirectorTakeoverEntryReadiness,
  DirectorTakeoverEntryStep,
  DirectorTakeoverPreview,
  DirectorTakeoverReadinessResponse,
  DirectorTakeoverStrategy,
} from "@ai-novel/shared/types/novelDirector";

type TakeoverScopeMode = "book" | "chapter_range" | "volume";

export interface TakeoverGuidanceViewModel {
  diagnosis: string;
  nextStep: string;
  protectionNotes: string[];
  riskLevel: "safe" | "caution";
  actionLabel: string;
}

export interface TakeoverProgressCard {
  title: string;
  status: string;
  detail: string;
}

export interface TakeoverProgressInspectionViewModel {
  cards: TakeoverProgressCard[];
  summary: string;
}

export interface TakeoverChapterTargetViewModel {
  startOrder: number;
  maxOrder: number;
  selectedOrder: number;
  plan: DirectorAutoExecutionPlan;
  actionLabel: string;
  summary: string;
}

const tt = (key: string, options?: Record<string, unknown>): string =>
  i18n.t(key, { ns: "novelsEditC", ...options });

const ENTRY_STEP_USER_LABEL_KEYS: Record<DirectorTakeoverEntryStep, string> = {
  basic: "takeoverVm.entryStep.basic",
  story_macro: "takeoverVm.entryStep.storyMacro",
  character: "takeoverVm.entryStep.character",
  outline: "takeoverVm.entryStep.outline",
  structured: "takeoverVm.entryStep.structured",
  chapter: "takeoverVm.entryStep.chapter",
  pipeline: "takeoverVm.entryStep.pipeline",
};

const RUN_MODE_ACTION_LABEL_KEYS: Record<DirectorRunMode, string> = {
  auto_to_ready: "takeoverVm.runModeAction.autoToReady",
  auto_to_execution: "takeoverVm.runModeAction.autoToExecution",
  full_book_autopilot: "takeoverVm.runModeAction.fullBookAutopilot",
  stage_review: "takeoverVm.runModeAction.stageReview",
};

export function isTakeoverEntryStepAllowedForScope(
  entryStep: DirectorTakeoverEntryStep,
  scopeMode: TakeoverScopeMode,
): boolean {
  if (scopeMode === "chapter_range") {
    return entryStep === "structured" || entryStep === "chapter" || entryStep === "pipeline";
  }
  if (scopeMode === "volume") {
    return entryStep === "outline" || entryStep === "structured" || entryStep === "chapter" || entryStep === "pipeline";
  }
  return true;
}

export function resolveRecommendedTakeoverEntryStep(
  readiness: DirectorTakeoverReadinessResponse | null,
  scopeMode: TakeoverScopeMode,
): DirectorTakeoverEntryStep | null {
  if (!readiness) {
    return null;
  }
  const allowed = (entry: DirectorTakeoverEntryReadiness) => (
    entry.available && isTakeoverEntryStepAllowedForScope(entry.step, scopeMode)
  );
  return (
    readiness.entrySteps.find((entry) => entry.recommended && allowed(entry))
    ?? readiness.entrySteps.find(allowed)
    ?? null
  )?.step ?? null;
}

export function findTakeoverPreview(
  readiness: DirectorTakeoverReadinessResponse | null,
  entryStep: DirectorTakeoverEntryStep,
  strategy: DirectorTakeoverStrategy,
): DirectorTakeoverPreview | null {
  return readiness?.entrySteps
    .find((entry) => entry.step === entryStep)
    ?.previews.find((preview) => preview.strategy === strategy) ?? null;
}

export function buildTakeoverGuidance(
  readiness: DirectorTakeoverReadinessResponse | null,
  entryStep: DirectorTakeoverEntryStep,
  strategy: DirectorTakeoverStrategy,
  runMode: DirectorRunMode,
  taskSnapshot?: DirectorTaskSnapshot | null,
): TakeoverGuidanceViewModel {
  const task = taskSnapshot?.task ?? null;
  const chapterProgress = taskSnapshot?.chapterProgress ?? taskSnapshot?.projection?.chapterExecutionProgress ?? null;
  if (task && (task.status === "queued" || task.status === "running" || task.status === "waiting_approval")) {
    const currentStage = task.currentStage?.trim() || taskSnapshot?.displayState.stageLabel || tt("takeoverVm.currentTask");
    const currentLabel = task.currentItemLabel?.trim() || taskSnapshot?.displayState.currentAction || tt("takeoverVm.waitingToContinue");
    const nextChapterOrder = chapterProgress?.currentChapterOrder ?? chapterProgress?.activeChapterOrder ?? null;
    return {
      diagnosis: tt("takeoverVm.guidance.existingTaskStopped", { stage: currentStage }),
      nextStep: nextChapterOrder
        ? tt("takeoverVm.guidance.chapterNearOrder", { order: nextChapterOrder })
        : tt("takeoverVm.guidance.currentTaskStatus", { label: currentLabel }),
      protectionNotes: [
        tt("takeoverVm.guidance.taskStatusNote", { status: task.status }),
        currentLabel,
        tt("takeoverVm.guidance.noDuplicateTakeover"),
      ],
      riskLevel: "safe",
      actionLabel: tt("takeoverVm.enterCurrentTask"),
    };
  }
  if (!readiness) {
    return {
      diagnosis: tt("takeoverVm.guidance.readingProgress"),
      nextStep: tt("takeoverVm.guidance.canContinueAfterRead"),
      protectionNotes: [tt("takeoverVm.guidance.keepAssetsDefault")],
      riskLevel: "safe",
      actionLabel: tt(RUN_MODE_ACTION_LABEL_KEYS[runMode] ?? "takeoverVm.continueAdvance"),
    };
  }
  const preview = findTakeoverPreview(readiness, entryStep, strategy);
  const entryLabel = tt(ENTRY_STEP_USER_LABEL_KEYS[preview?.effectiveStep ?? entryStep] ?? "takeoverVm.recommendedPosition");
  const hasCharacters = readiness.snapshot.characterCount > 0;
  const hasVolumes = readiness.snapshot.volumeCount > 0;
  const hasChapters = readiness.snapshot.chapterCount > 0;
  const protectionNotes = [
    hasCharacters ? tt("takeoverVm.protection.keepCharacters", { count: readiness.snapshot.characterCount }) : tt("takeoverVm.protection.noCharacters"),
    hasVolumes ? tt("takeoverVm.protection.keepVolumes") : tt("takeoverVm.protection.noVolumes"),
    hasChapters ? tt("takeoverVm.protection.keepChapters", { count: readiness.snapshot.chapterCount }) : tt("takeoverVm.protection.noChapters"),
  ];
  const riskLevel = strategy === "restart_current_step" ? "caution" : "safe";
  return {
    diagnosis: tt("takeoverVm.guidance.canResumeFrom", { label: entryLabel }),
    nextStep: preview?.summary ?? tt("takeoverVm.guidance.aiContinueFrom", { label: entryLabel }),
    protectionNotes,
    riskLevel,
    actionLabel: buildPrimaryActionLabel({
      fallback: tt(RUN_MODE_ACTION_LABEL_KEYS[runMode] ?? "takeoverVm.continueAdvance"),
      taskSnapshot,
      readiness,
    }),
  };
}

function formatRatio(done: number, total: number): string {
  if (total <= 0) {
    return done > 0 ? tt("takeoverVm.itemsCount", { count: done }) : tt("common.none");
  }
  return `${done} / ${total}`;
}

function buildPrimaryActionLabel(input: {
  fallback: string;
  taskSnapshot?: DirectorTaskSnapshot | null;
  readiness?: DirectorTakeoverReadinessResponse | null;
}): string {
  const progress = input.taskSnapshot?.chapterProgress
    ?? input.taskSnapshot?.projection?.chapterExecutionProgress
    ?? null;
  if (progress?.currentChapterOrder) {
    return tt("takeoverVm.continueWritingChapter", { order: progress.currentChapterOrder });
  }
  const drafted = progress?.draftedChapterCount ?? input.readiness?.snapshot.generatedChapterCount ?? 0;
  const approved = progress?.approvedChapterCount ?? input.readiness?.snapshot.approvedChapterCount ?? 0;
  if (drafted > approved) {
    return tt("takeoverVm.handlePendingChapters");
  }
  if ((input.readiness?.snapshot.chapterCount ?? 0) > 0) {
    return tt("takeoverVm.continueChapterExecution");
  }
  return input.fallback;
}

function normalizePositiveOrder(value: number | null | undefined): number | null {
  if (!Number.isFinite(value ?? NaN) || !value || value < 1) {
    return null;
  }
  return Math.max(1, Math.round(value));
}

function maxNormalizedOrder(values: Array<number | null | undefined>): number | null {
  const normalized = values
    .map(normalizePositiveOrder)
    .filter((value): value is number => Boolean(value));
  if (normalized.length === 0) {
    return null;
  }
  return Math.max(...normalized);
}

export function buildTakeoverChapterTarget(
  readiness: DirectorTakeoverReadinessResponse | null,
  taskSnapshot?: DirectorTaskSnapshot | null,
  selectedOrder?: number | null,
): TakeoverChapterTargetViewModel | null {
  const progress = taskSnapshot?.chapterProgress
    ?? taskSnapshot?.projection?.chapterExecutionProgress
    ?? null;
  const snapshot = readiness?.snapshot ?? null;
  const writtenChapterCount = maxNormalizedOrder([
    progress?.draftedChapterCount,
    progress?.completedChapters,
    snapshot?.generatedChapterCount,
  ]);
  const startOrder = maxNormalizedOrder([
    progress?.currentChapterOrder
      ?? null,
    progress?.activeChapterOrder
      ?? null,
    readiness?.executableRange?.nextChapterOrder
      ?? null,
    writtenChapterCount ? writtenChapterCount + 1 : null,
    snapshot?.approvedChapterCount ? snapshot.approvedChapterCount + 1 : null,
  ]);
  const totalChapters = maxNormalizedOrder([
    progress?.totalChapters
      ?? null,
    readiness?.executableRange?.endOrder
      ?? null,
    snapshot?.chapterCount
      ?? null,
    snapshot?.firstVolumeChapterCount
      ?? null,
  ]);
  if (!startOrder || !totalChapters || startOrder > totalChapters) {
    return null;
  }
  const normalizedSelected = normalizePositiveOrder(selectedOrder ?? null);
  const selected = normalizedSelected
    ? Math.min(Math.max(normalizedSelected, startOrder), totalChapters)
    : startOrder;
  const plan: DirectorAutoExecutionPlan = {
    mode: "chapter_range",
    startOrder,
    endOrder: selected,
    autoReview: true,
    autoRepair: true,
  };
  return {
    startOrder,
    maxOrder: totalChapters,
    selectedOrder: selected,
    plan,
    actionLabel: tt("takeoverVm.advanceToChapter", { order: selected }),
    summary: selected === startOrder
      ? tt("takeoverVm.continueFromChapter", { start: startOrder })
      : tt("takeoverVm.continueFromTo", { start: startOrder, end: selected }),
  };
}

export function buildTakeoverProgressInspection(
  readiness: DirectorTakeoverReadinessResponse | null,
  taskSnapshot?: DirectorTaskSnapshot | null,
): TakeoverProgressInspectionViewModel {
  const factSummary = taskSnapshot?.factSummary ?? taskSnapshot?.projection?.factSummary ?? null;
  const outline = factSummary?.outlineFacts ?? null;
  const chapterFacts = factSummary?.chapterExecutionFacts ?? null;
  const repairFacts = factSummary?.repairFacts ?? null;
  const chapterProgress = taskSnapshot?.chapterProgress ?? taskSnapshot?.projection?.chapterExecutionProgress ?? null;
  const snapshot = readiness?.snapshot ?? null;
  const volumeRanges = snapshot?.volumeChapterRanges ?? [];
  const syncedChapterCount = outline?.syncedChapterCount ?? snapshot?.chapterCount ?? 0;
  const plannedChapterCount = outline?.plannedChapterCount ?? snapshot?.chapterCount ?? chapterProgress?.totalChapters ?? 0;
  const selectedChapterCount = outline?.selectedChapterCount ?? readiness?.executableRange?.totalChapterCount ?? 0;
  const detailDone = outline?.completedDetailSteps ?? snapshot?.firstVolumePreparedChapterCount ?? 0;
  const detailTotal = outline?.totalDetailSteps ?? selectedChapterCount;
  const drafted = chapterProgress?.draftedChapterCount ?? chapterFacts?.draftedChapterCount ?? snapshot?.generatedChapterCount ?? 0;
  const approved = chapterProgress?.approvedChapterCount ?? chapterFacts?.approvedChapterCount ?? snapshot?.approvedChapterCount ?? 0;
  const reviewed = chapterFacts?.reviewedChapterCount ?? repairFacts?.reviewedChapterCount ?? 0;
  const pendingRepair = chapterProgress?.needsRepairChapters ?? chapterFacts?.needsRepairChapters ?? snapshot?.pendingRepairChapterCount ?? 0;
  const nextChapterOrder = chapterProgress?.currentChapterOrder ?? readiness?.executableRange?.nextChapterOrder ?? null;

  const rangesText = volumeRanges.map((range) => tt("takeoverVm.card.rangeItem", { start: range.startOrder, end: range.endOrder })).join(tt("takeoverVm.listSeparator")) || tt("common.none");
  const cards: TakeoverProgressCard[] = [
    {
      title: tt("takeoverVm.card.volumePlanTitle"),
      status: factSummary?.hasVolumeStrategy || (snapshot?.volumeCount ?? 0) > 0 ? tt("takeoverVm.card.hasVolumeStrategy") : tt("takeoverVm.card.needVolumeStrategy"),
      detail: snapshot
        ? tt("takeoverVm.card.volumePlanDetail", { volumes: snapshot.volumeCount, chapters: snapshot.firstVolumeChapterCount, ranges: rangesText })
        : tt("takeoverVm.card.readingVolumePlan"),
    },
    {
      title: tt("takeoverVm.card.chapterSyncTitle"),
      status: formatRatio(syncedChapterCount, plannedChapterCount),
      detail: selectedChapterCount > 0
        ? tt("takeoverVm.card.executableRange", { start: readiness?.executableRange?.startOrder ?? 1, end: readiness?.executableRange?.endOrder ?? selectedChapterCount })
        : tt("takeoverVm.card.noExecutableRange"),
    },
    {
      title: tt("takeoverVm.card.chapterDetailTitle"),
      status: formatRatio(detailDone, detailTotal),
      detail: outline?.chapterDetailReady || detailDone > 0
        ? tt("takeoverVm.card.chapterDetailReady", { count: detailDone })
        : tt("takeoverVm.card.noChapterDetail"),
    },
    {
      title: tt("takeoverVm.card.contentQualityTitle"),
      status: formatRatio(drafted, chapterProgress?.totalChapters ?? chapterFacts?.totalChapters ?? plannedChapterCount),
      detail: [
        reviewed > 0 ? tt("takeoverVm.card.reviewedChapters", { count: reviewed }) : "",
        approved > 0 ? tt("takeoverVm.card.approvedChapters", { count: approved }) : "",
        pendingRepair > 0 ? tt("takeoverVm.card.pendingChapters", { count: pendingRepair }) : "",
        nextChapterOrder ? tt("takeoverVm.card.nextChapter", { order: nextChapterOrder }) : "",
      ].filter(Boolean).join(tt("takeoverVm.semicolonSeparator")) || tt("takeoverVm.card.notStartedContent"),
    },
  ];

  return {
    cards,
    summary: taskSnapshot?.task
      ? tt("takeoverVm.currentTaskSummary", { stage: taskSnapshot.task.currentStage || taskSnapshot.displayState.stageLabel || tt("takeoverVm.autoDirector"), action: taskSnapshot.task.currentItemLabel || taskSnapshot.displayState.currentAction || tt("takeoverVm.waitingToContinue") })
      : tt("takeoverVm.assetProgressIntro"),
  };
}

export function formatTakeoverStartError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.includes("章节范围只能从节奏拆章、章节执行或质量修复开始")) {
    return tt("takeoverVm.error.notInChapterStage");
  }
  if (message.includes("当前已有自动导演任务")) {
    return tt("takeoverVm.error.existingTask");
  }
  return message || tt("takeoverVm.error.startFailed");
}

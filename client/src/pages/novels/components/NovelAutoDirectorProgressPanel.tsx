import type {
  NovelWorkflowMilestone,
  NovelWorkflowMilestoneType,
} from "@ai-novel/shared/types/novelWorkflow";
import type {
  DirectorDashboardAction,
  DirectorDashboardMode,
  DirectorDisplayStepStatus,
} from "@ai-novel/shared/types/directorRuntime";
import {
  DIRECTOR_CANDIDATE_SETUP_STEPS,
  extractDirectorTaskSeedPayloadFromMeta,
} from "@ai-novel/shared/types/novelDirector";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import {
  getDirectorTaskSnapshot,
} from "@/api/novelDirector";
import { queryKeys } from "@/api/queryKeys";
import DirectorRuntimeProjectionCard from "@/components/autoDirector/DirectorRuntimeProjectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AITakeoverContainer, { type AITakeoverMode } from "@/components/workflow/AITakeoverContainer";
import {
  isChapterTitleDiversitySummary,
  resolveChapterTitleWarning,
} from "@/lib/directorTaskNotice";
import { extractWorkflowActivityTags } from "@/lib/novelWorkflowActivityTags";
import { useDirectorChapterTitleRepair } from "@/hooks/useDirectorChapterTitleRepair";
import { formatLocaleDateTime, formatLocaleNumber } from "@/i18n/format";

type DirectorExecutionViewMode = "execution_progress" | "execution_failed";

interface NovelAutoDirectorProgressPanelProps {
  mode: DirectorExecutionViewMode;
  task: UnifiedTaskDetail | null;
  taskId: string;
  titleHint?: string;
  fallbackError?: string | null;
  onBackgroundContinue: () => void;
  onConfirmAndContinue?: () => void;
  isConfirmingAndContinuing?: boolean;
  onOpenTaskCenter: () => void;
}

type DirectorStepVisualStatus = "pending" | "running" | "completed" | "failed";
type DirectorStepDefinition = {
  key: string;
  label: string;
};

// Label values are novelsEditB i18n keys resolved via t() at any React call site.
const DIRECTOR_EXECUTION_STEPS: DirectorStepDefinition[] = [
  { key: "novel_create", label: "progress.execStep.novelCreate" },
  { key: "book_contract", label: "progress.execStep.bookContract" },
  { key: "character_setup", label: "progress.execStep.characterSetup" },
  { key: "volume_strategy", label: "progress.execStep.volumeStrategy" },
  { key: "beat_sheet", label: "progress.execStep.beatSheet" },
  { key: "chapter_detail_bundle", label: "progress.execStep.chapterDetail" },
];

const DIRECTOR_CANDIDATE_SETUP_STEP_KEYS = new Set<string>(
  DIRECTOR_CANDIDATE_SETUP_STEPS.map((step) => step.key),
);

const AUTO_DIRECTOR_PLACEHOLDER_TITLES = new Set([
  "AI 自动导演小说",
  "小说流程任务",
]);

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return i18n.t("progress.none", { ns: "novelsEditB" });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return i18n.t("progress.none", { ns: "novelsEditB" });
  }
  return formatLocaleDateTime(date);
}

function formatTokenCount(value: number | null | undefined): string {
  return formatLocaleNumber(Math.max(0, Math.round(value ?? 0)));
}

function resolveAutoExecutionScopeLabel(task: UnifiedTaskDetail | null): string {
  const seedPayload = extractDirectorTaskSeedPayloadFromMeta(task?.meta) as {
    autoExecution?: {
      scopeLabel?: string | null;
      totalChapterCount?: number | null;
    } | null;
  } | null;
  const scopeLabel = seedPayload?.autoExecution?.scopeLabel?.trim();
  if (scopeLabel) {
    return scopeLabel;
  }
  const fallbackCount = Math.max(1, Math.round(seedPayload?.autoExecution?.totalChapterCount ?? 10));
  return i18n.t("progress.scopeFallback", { ns: "novelsEditB", count: fallbackCount });
}

function resolveDirectorStyleSeed(task: UnifiedTaskDetail | null): {
  title: string;
  summaryLines: string[];
} | null {
  const seedPayload = extractDirectorTaskSeedPayloadFromMeta(task?.meta);
  const styleIntentSummary = seedPayload?.styleIntentSummary;
  if (styleIntentSummary?.headline?.trim()) {
    return {
      title: styleIntentSummary.styleProfileName?.trim() || styleIntentSummary.headline.trim(),
      summaryLines: styleIntentSummary.stageSummaryLines ?? [],
    };
  }
  const fallbackTone = typeof (seedPayload as { styleTone?: unknown } | null)?.styleTone === "string"
    ? (((seedPayload as { styleTone?: string }).styleTone ?? "").trim())
    : "";
  if (!fallbackTone) {
    return null;
  }
  return {
    title: fallbackTone,
    summaryLines: [i18n.t("progress.styleKeywords", { ns: "novelsEditB", tone: fallbackTone })],
  };
}

function formatCheckpoint(
  checkpoint: NovelWorkflowMilestoneType | null | undefined,
  task: UnifiedTaskDetail | null,
): string {
  if (checkpoint === "rewrite_snapshot_created") {
    return i18n.t("progress.checkpoint.rewriteBackup", { ns: "novelsEditB" });
  }
  if (checkpoint === "candidate_selection_required") {
    return i18n.t("progress.checkpoint.candidateSelection", { ns: "novelsEditB" });
  }
  if (checkpoint === "book_contract_ready") {
    return i18n.t("progress.checkpoint.bookContractReady", { ns: "novelsEditB" });
  }
  if (checkpoint === "character_setup_required") {
    return i18n.t("progress.checkpoint.characterSetupReview", { ns: "novelsEditB" });
  }
  if (checkpoint === "volume_strategy_ready") {
    return i18n.t("progress.checkpoint.volumeStrategyReady", { ns: "novelsEditB" });
  }
  if (checkpoint === "chapter_batch_ready") {
    return i18n.t("progress.checkpoint.chapterBatchPaused", { ns: "novelsEditB", scope: resolveAutoExecutionScopeLabel(task) });
  }
  if (checkpoint === "replan_required") {
    return i18n.t("progress.checkpoint.replanRequired", { ns: "novelsEditB" });
  }
  if (checkpoint === "workflow_completed") {
    return i18n.t("progress.checkpoint.workflowCompleted", { ns: "novelsEditB" });
  }
  return i18n.t("progress.none", { ns: "novelsEditB" });
}

function isCandidateSetupFlow(task: UnifiedTaskDetail | null): boolean {
  return DIRECTOR_CANDIDATE_SETUP_STEP_KEYS.has(task?.currentItemKey ?? "");
}

function resolveDirectorExecutionStepIndex(task: UnifiedTaskDetail | null): number {
  const itemKey = task?.currentItemKey ?? "";
  const chapterExecutionKeys = new Set([
    "chapter_execution",
    "chapter_execution_node",
    "chapter.draft.write",
    "chapter.write",
  ]);
  const qualityRepairKeys = new Set([
    "reviewing",
    "repairing",
    "quality_repair",
    "chapter_quality_review_node",
    "chapter.quality.review",
    "chapter_state_commit_node",
    "chapter.state.commit",
  ]);
  if (qualityRepairKeys.has(itemKey)) {
    return 5;
  }
  if (
    (task?.status === "running" && task?.checkpointType === "chapter_batch_ready")
    || itemKey === "chapter_detail_bundle"
    || chapterExecutionKeys.has(itemKey)
  ) {
    return 5;
  }
  if (itemKey === "beat_sheet" || itemKey === "chapter_list" || itemKey === "chapter_sync") {
    return 4;
  }
  if (
    task?.checkpointType === "character_setup_required"
    || itemKey === "character_setup"
    || itemKey === "character_cast_apply"
  ) {
    return 2;
  }
  if (
    task?.checkpointType === "volume_strategy_ready"
    || itemKey === "volume_strategy"
    || itemKey === "volume_skeleton"
  ) {
    return 3;
  }
  if (
    task?.checkpointType === "book_contract_ready"
    || itemKey === "book_contract"
    || itemKey === "story_macro"
    || itemKey === "constraint_engine"
  ) {
    return 1;
  }
  return 0;
}

function resolveCandidateSetupStepIndex(task: UnifiedTaskDetail | null): number {
  const itemKey = task?.currentItemKey ?? "";
  const foundIndex = DIRECTOR_CANDIDATE_SETUP_STEPS.findIndex((step) => step.key === itemKey);
  return foundIndex >= 0 ? foundIndex : 0;
}

function resolveDirectorStepStatuses(
  task: UnifiedTaskDetail | null,
  mode: DirectorExecutionViewMode,
  steps: ReadonlyArray<DirectorStepDefinition>,
): DirectorStepVisualStatus[] {
  if (task?.checkpointType === "chapter_batch_ready" || task?.status === "succeeded") {
    return steps.map(() => "completed");
  }

  const currentIndex = isCandidateSetupFlow(task)
    ? resolveCandidateSetupStepIndex(task)
    : resolveDirectorExecutionStepIndex(task);
  return steps.map((_, index) => {
    if (index < currentIndex) {
      return "completed";
    }
    if (index === currentIndex) {
      return mode === "execution_failed" || task?.pendingManualRecovery ? "failed" : "running";
    }
    return "pending";
  });
}

function stepClasses(status: DirectorStepVisualStatus): string {
  if (status === "completed") {
    return "bg-emerald-500/10";
  }
  if (status === "running") {
    return "bg-sky-50";
  }
  if (status === "failed") {
    return "bg-destructive/5";
  }
  return "bg-muted/20";
}

function stepBadgeClasses(status: DirectorStepVisualStatus): string {
  if (status === "completed") {
    return "bg-emerald-600 text-white";
  }
  if (status === "running") {
    return "bg-sky-600 text-white";
  }
  if (status === "failed") {
    return "bg-destructive text-destructive-foreground";
  }
  return "bg-muted text-muted-foreground";
}

function stepStatusLabel(status: DirectorStepVisualStatus): string {
  if (status === "completed") {
    return i18n.t("progress.status.completed", { ns: "novelsEditB" });
  }
  if (status === "running") {
    return i18n.t("progress.status.running", { ns: "novelsEditB" });
  }
  if (status === "failed") {
    return i18n.t("progress.status.attention", { ns: "novelsEditB" });
  }
  return i18n.t("progress.status.pending", { ns: "novelsEditB" });
}

function mapDisplayStepStatus(status: DirectorDisplayStepStatus | null | undefined): DirectorStepVisualStatus {
  if (status === "completed") {
    return "completed";
  }
  if (status === "running") {
    return "running";
  }
  if (status === "attention") {
    return "failed";
  }
  return "pending";
}

function mapDashboardModeToContainerMode(mode: DirectorDashboardMode | null | undefined): AITakeoverMode {
  switch (mode) {
    case "failed":
      return "failed";
    case "recovering":
      return "action_required";
    case "waiting_user":
      return "waiting";
    case "idle":
      return "loading";
    case "queued":
    case "completed":
    case "running":
    default:
      return "running";
  }
}

export default function NovelAutoDirectorProgressPanel({
  mode,
  task,
  taskId,
  titleHint,
  fallbackError,
  onBackgroundContinue,
  onConfirmAndContinue,
  isConfirmingAndContinuing = false,
  onOpenTaskCenter,
}: NovelAutoDirectorProgressPanelProps) {
  const { t } = useTranslation("novelsEditB");
  const taskChapterTitleWarning = resolveChapterTitleWarning(task);
  const chapterTitleRepairMutation = useDirectorChapterTitleRepair();
  const runtimeTaskId = task?.id ?? taskId;
  const snapshotQuery = useQuery({
    queryKey: queryKeys.tasks.directorTaskSnapshot(runtimeTaskId || "none"),
    queryFn: () => getDirectorTaskSnapshot(runtimeTaskId),
    enabled: Boolean(runtimeTaskId),
    retry: false,
    placeholderData: (previousData) => previousData,
    refetchInterval: () => (
      task && (task.status === "queued" || task.status === "running" || task.status === "waiting_approval") ? 4000 : false
    ),
  });
  const snapshot = snapshotQuery.data?.data?.snapshot ?? null;
  const dashboardView = snapshot?.dashboardView ?? null;
  const displayState = snapshot?.displayState ?? null;
  const runtimeProjection = snapshot?.projection ?? null;
  const staleActionProjection = Boolean(
    dashboardView?.mode === "running"
    && (
      runtimeProjection?.requiresUserAction
      || runtimeProjection?.status === "blocked"
      || runtimeProjection?.status === "waiting_approval"
    ),
  );
  const runtimeProjectionForDisplay = dashboardView?.mode === "recovering" || staleActionProjection ? null : runtimeProjection;
  const historyEvents = snapshot?.recentEvents ?? [];
  const displayProgress = dashboardView?.progressPercent ?? displayState?.progressPercent ?? task?.progress ?? null;
  const fallbackChapterTitleWarning = !taskChapterTitleWarning && isChapterTitleDiversitySummary(fallbackError)
    ? {
      summary: fallbackError?.trim() ?? "",
      route: null,
      label: t("progress.aiRepairChapterTitle"),
    }
    : null;
  const rawChapterTitleWarning = taskChapterTitleWarning ?? fallbackChapterTitleWarning;
  const chapterTitleWarning = dashboardView?.mode === "running" || dashboardView?.mode === "queued"
    ? null
    : rawChapterTitleWarning;
  const visualMode: DirectorExecutionViewMode = mode === "execution_failed" && !chapterTitleWarning && dashboardView?.mode !== "running"
    ? "execution_failed"
    : "execution_progress";
  const currentAction = dashboardView?.currentAction
    || displayState?.currentAction
    || runtimeProjectionForDisplay?.currentLabel?.trim()
    || task?.currentItemLabel?.trim()
    || (visualMode === "execution_failed"
      ? t("progress.currentActionInterrupted")
      : (chapterTitleWarning ? t("progress.currentActionWaitingTitleRepair") : t("progress.currentActionPreparing")));
  const activityTags = extractWorkflowActivityTags(displayState?.currentFactStepLabel || task?.currentItemLabel);
  const workflowTitle = task?.title?.trim() || "";
  const hintedTitle = titleHint?.trim() || "";
  const taskTitle = (
    hintedTitle && (!workflowTitle || AUTO_DIRECTOR_PLACEHOLDER_TITLES.has(workflowTitle))
      ? hintedTitle
      : workflowTitle || hintedTitle || t("progress.newNovelProject")
  );
  const milestones = Array.isArray(task?.meta.milestones)
    ? task.meta.milestones as NovelWorkflowMilestone[]
    : [];
  const candidateSetupFlow = isCandidateSetupFlow(task);
  const displaySteps = dashboardView?.steps ?? displayState?.steps ?? [];
  const stepDefinitions = candidateSetupFlow
    ? DIRECTOR_CANDIDATE_SETUP_STEPS
    : displaySteps.map((step) => ({ key: step.key, label: step.label }));
  const steps = candidateSetupFlow
    ? resolveDirectorStepStatuses(task, visualMode, stepDefinitions)
    : displaySteps.map((step) => mapDisplayStepStatus(step.status));
  const failureMessage = task?.lastError?.trim() || fallbackError?.trim() || t("progress.failureFallback");
  const tokenUsage = task?.tokenUsage ?? null;
  const styleSeed = resolveDirectorStyleSeed(task);
  const containerMode: AITakeoverMode = visualMode === "execution_failed"
    ? "failed"
    : !task
      ? "loading"
      : chapterTitleWarning
        ? "waiting"
        : mapDashboardModeToContainerMode(dashboardView?.mode ?? null);
  const description = candidateSetupFlow
    ? (
      visualMode === "execution_failed"
        ? t("progress.descCandidateFailed")
        : t("progress.descCandidateRunning")
    )
    : (
      dashboardView?.description
      || displayState?.description
      || (visualMode === "execution_failed"
        ? t("progress.descFailed")
        : chapterTitleWarning
          ? t("progress.descChapterTitleWarning")
          : task?.status === "waiting_approval"
            ? t("progress.descWaitingApproval")
            : t("progress.descDefault"))
    );
  const resolveDashboardAction = (dashboardAction: DirectorDashboardAction) => {
    if (dashboardAction.type === "confirm_and_continue" && onConfirmAndContinue) {
      return {
        label: isConfirmingAndContinuing ? t("progress.continuing") : dashboardAction.label,
        onClick: onConfirmAndContinue,
        variant: "default" as const,
        disabled: isConfirmingAndContinuing,
      };
    }
    if (dashboardAction.type === "background_continue") {
      return {
        label: dashboardAction.label,
        onClick: onBackgroundContinue,
        variant: "outline" as const,
      };
    }
    if (dashboardAction.type === "open_task_center") {
      return {
        label: dashboardAction.label,
        onClick: onOpenTaskCenter,
        variant: dashboardAction.emphasis === "primary" ? ("default" as const) : ("outline" as const),
      };
    }
    if (dashboardAction.type === "resume_from_checkpoint" || dashboardAction.type === "retry") {
      return {
        label: dashboardAction.label,
        onClick: onOpenTaskCenter,
        variant: "outline" as const,
      };
    }
    return null;
  };
  const dashboardActions = dashboardView
    ? [
      dashboardView.primaryAction,
      ...dashboardView.secondaryActions,
    ].filter((item): item is DirectorDashboardAction => Boolean(item))
      .map(resolveDashboardAction)
      .filter((item): item is NonNullable<ReturnType<typeof resolveDashboardAction>> => Boolean(item))
    : [];
  const actions = chapterTitleWarning
    ? [{
      label: t("progress.viewExecutionDetail"),
      onClick: onOpenTaskCenter,
      variant: "default" as const,
    }]
    : (dashboardActions.length > 0
      ? dashboardActions
      : [{
        label: t("progress.viewExecutionDetail"),
        onClick: onOpenTaskCenter,
        variant: "default" as const,
      }]);

  return (
    <div className="space-y-4">
      <AITakeoverContainer
        mode={containerMode}
        title={visualMode === "execution_failed"
          ? (candidateSetupFlow ? t("progress.titleCandidateFailed") : t("progress.titleDirectorFailed"))
          : dashboardView?.mode === "recovering"
            ? t("progress.titleWaitingRecovery", { title: taskTitle })
            : candidateSetupFlow
              ? t("progress.titleGeneratingCandidates")
              : t("progress.titleAutoDirecting", { title: taskTitle })}
        description={description}
        progress={displayProgress}
        currentAction={currentAction}
        checkpointLabel={displayState?.checkpointLabel || formatCheckpoint(task?.checkpointType, task)}
        taskId={task?.id || taskId}
        actions={actions}
      >
        <div className={`grid gap-3 ${candidateSetupFlow ? "md:grid-cols-4" : "md:grid-cols-7"}`}>
          {(candidateSetupFlow
            ? stepDefinitions
            : displaySteps.map((step) => ({ key: step.key, label: step.label }))).map((step, index) => (
            <div key={step.key} className={`rounded-lg p-3 ${stepClasses(steps[index] ?? "pending")}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${stepBadgeClasses(steps[index] ?? "pending")}`}>
                  {index + 1}
                </span>
                <span className="text-[11px] text-muted-foreground">{stepStatusLabel(steps[index] ?? "pending")}</span>
              </div>
              <div className="mt-3 text-sm font-medium text-foreground">{step.label}</div>
            </div>
          ))}
        </div>

        {activityTags.length > 0 ? (
          <div className="mt-4">
            <div className="text-xs font-medium text-muted-foreground">{t("progress.backgroundAnalysis")}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {activityTags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        ) : null}

        <DirectorRuntimeProjectionCard
          projection={runtimeProjectionForDisplay}
          className="mt-4"
        />

        <div className="mt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">{t("progress.allProgress")}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {historyEvents.length > 0 ? t("progress.showingRecent", { count: historyEvents.length }) : t("progress.readingProgress")}
              </div>
            </div>
          </div>

          {snapshotQuery.isLoading ? (
            <div className="mt-3 text-sm text-muted-foreground">
              {t("progress.readingProgressDot")}
            </div>
          ) : historyEvents.length > 0 ? (
            <div className="mt-3 max-h-80 space-y-3 overflow-y-auto border-l border-border/60 pl-3 pr-1">
              {historyEvents.map((event) => (
                <div key={event.eventId} className="text-sm">
                  <div className="font-medium text-foreground">{event.summary}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{t("progress.recordTimeValue", { time: formatDate(event.occurredAt) })}</span>
                    {event.nodeKey ? <span>{t("progress.stepValue", { step: event.nodeKey })}</span> : null}
                    {event.artifactType ? <span>{t("progress.artifactValue", { artifact: event.artifactType })}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">
              {t("progress.emptyProgress")}
            </div>
          )}
        </div>

        {styleSeed ? (
          <div className="mt-5">
            <div className="text-sm font-medium text-foreground">{t("progress.currentHitStyle")}</div>
            <div className="mt-2 text-sm text-foreground">{styleSeed.title}</div>
            {styleSeed.summaryLines.length > 0 ? (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-muted-foreground">{t("progress.styleSummaryLabel")}</div>
                {styleSeed.summaryLines.map((line) => (
                  <div key={line} className="text-xs leading-6 text-muted-foreground">
                    {line}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {tokenUsage ? (
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">{t("progress.tokenCumulativeCalls")}</div>
              <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.llmCallCount)}</div>
            </div>
            <div className="rounded-lg bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">{t("progress.tokenInput")}</div>
              <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.promptTokens)}</div>
            </div>
            <div className="rounded-lg bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">{t("progress.tokenOutput")}</div>
              <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.completionTokens)}</div>
            </div>
            <div className="rounded-lg bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">{t("progress.tokenTotal")}</div>
              <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.totalTokens)}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{t("progress.tokenLastRecord", { time: formatDate(tokenUsage.lastRecordedAt) })}</div>
            </div>
          </div>
        ) : null}

        {chapterTitleWarning ? (
          <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50/80 p-4 text-sm text-amber-950">
            <div className="font-medium">{t("progress.currentReminder")}</div>
            <div className="mt-1">{chapterTitleWarning.summary}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {task && chapterTitleWarning ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    chapterTitleRepairMutation.startRepair(task);
                  }}
                  disabled={chapterTitleRepairMutation.isPending}
                >
                  {chapterTitleRepairMutation.isPending && chapterTitleRepairMutation.pendingTaskId === task.id
                    ? t("progress.aiRepairing")
                    : chapterTitleWarning.label}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenTaskCenter}
              >
                {t("progress.viewExecutionDetail")}
              </Button>
            </div>
          </div>
        ) : visualMode === "execution_failed" ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <div className="font-medium">{t("progress.failureSummary")}</div>
            <div className="mt-1">{failureMessage}</div>
            {task?.recoveryHint ? (
              <div className="mt-2 text-xs text-destructive/80">{t("progress.recoveryHint", { hint: task.recoveryHint })}</div>
            ) : null}
          </div>
        ) : null}
      </AITakeoverContainer>

      <div className="pt-1">
        <div className="text-sm font-medium text-foreground">{t("progress.milestoneHistory")}</div>
        {milestones.length > 0 ? (
          <div className="mt-3 space-y-3 border-l border-border/60 pl-3">
            {milestones
              .slice()
              .reverse()
              .map((item) => (
                <div key={`${item.checkpointType}:${item.createdAt}`} className="text-sm">
                  <div className="font-medium text-foreground">{formatCheckpoint(item.checkpointType, task)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.summary}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{t("progress.recordTimeValue", { time: formatDate(item.createdAt) })}</div>
                </div>
              ))}
          </div>
        ) : (
          <div className="mt-3 text-sm text-muted-foreground">
            {t("progress.emptyMilestone")}
          </div>
        )}
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import type { DirectorDashboardView } from "@ai-novel/shared/types/directorRuntime";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import { Badge } from "@/components/ui/badge";
import {
  formatCheckpoint,
  formatDate,
  formatKind,
  formatResumeTarget,
  formatStatus,
  formatTokenCount,
  toStatusVariant,
} from "../taskCenterUtils";

interface TaskCenterDetailSummaryProps {
  task: UnifiedTaskDetail;
  isAutoDirectorTask: boolean;
  currentModelLabel: string;
  dashboardView?: DirectorDashboardView | null;
}

export default function TaskCenterDetailSummary({
  task,
  isAutoDirectorTask,
  currentModelLabel,
  dashboardView,
}: TaskCenterDetailSummaryProps) {
  const { t } = useTranslation("tasks");
  const progressPercent = typeof dashboardView?.progressPercent === "number"
    ? dashboardView.progressPercent
    : Math.round(task.progress * 100);
  const currentStage = dashboardView?.stageLabel ?? task.currentStage ?? t("common.none");
  const currentItem = dashboardView?.currentAction ?? task.currentItemLabel ?? t("common.none");

  return (
    <>
      <div className="space-y-1">
        <div className="font-medium">{task.title}</div>
        <div className="text-xs text-muted-foreground">
          {formatKind(task.kind)} | {t("detail.owner", { value: task.ownerLabel })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={toStatusVariant(task.status)}>{formatStatus(task.status)}</Badge>
        <Badge variant="outline">{t("detail.progress", { percent: progressPercent })}</Badge>
      </div>
      <div className="space-y-1 text-muted-foreground">
        <div>{t("detail.displayStatus", { value: dashboardView?.statusLabel ?? task.displayStatus ?? formatStatus(task.status) })}</div>
        <div>{t("detail.currentStage", { value: currentStage })}</div>
        <div>{t("detail.currentItem", { value: currentItem })}</div>
        {task.kind === "novel_workflow" ? (
          <>
            <div>{t("detail.lastCheckpoint", { value: formatCheckpoint(task.checkpointType, task.executionScopeLabel) })}</div>
            <div>{t("detail.resumeTarget", { value: formatResumeTarget(task.resumeTarget) })}</div>
            <div>{t("detail.suggestContinue", { value: task.resumeAction ?? task.nextActionLabel ?? t("detail.continueNovelMainFlow") })}</div>
            <div>{t("detail.lastHealthyStage", { value: task.lastHealthyStage ?? t("common.none") })}</div>
          </>
        ) : null}
        {task.blockingReason ? (
          <div>{t("detail.blockingReason", { value: task.blockingReason })}</div>
        ) : null}
        <div>{t("detail.lastHeartbeat", { value: formatDate(task.heartbeatAt) })}</div>
        <div>{t("detail.startedAt", { value: formatDate(task.startedAt) })}</div>
        <div>{t("detail.finishedAt", { value: formatDate(task.finishedAt) })}</div>
        <div>{t("detail.retryCount", { value: task.retryCountLabel })}</div>
        {(task.provider || task.model) ? (
          <div>{t("detail.callModel", { provider: task.provider ?? t("common.none"), model: task.model ?? t("common.none") })}</div>
        ) : null}
        {isAutoDirectorTask ? (
          <div>{t("detail.currentUiModel", { value: currentModelLabel })}</div>
        ) : null}
        {(task.tokenUsage || task.provider || task.model) ? (
          <>
            <div>{t("detail.totalCalls", { value: formatTokenCount(task.tokenUsage?.llmCallCount ?? 0) })}</div>
            <div>{t("detail.promptTokens", { value: formatTokenCount(task.tokenUsage?.promptTokens ?? 0) })}</div>
            <div>{t("detail.completionTokens", { value: formatTokenCount(task.tokenUsage?.completionTokens ?? 0) })}</div>
            <div>{t("detail.totalTokens", { value: formatTokenCount(task.tokenUsage?.totalTokens ?? 0) })}</div>
            <div>{t("detail.lastRecorded", { value: formatDate(task.tokenUsage?.lastRecordedAt) })}</div>
          </>
        ) : null}
      </div>
    </>
  );
}

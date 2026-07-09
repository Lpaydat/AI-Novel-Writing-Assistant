import type {
  DirectorPolicyMode,
  DirectorRuntimeProjection,
  DirectorRuntimeProjectionStatus,
} from "@ai-novel/shared/types/directorRuntime";
import { getDirectorNodeDisplayLabel } from "@ai-novel/shared/types/directorRuntime";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DirectorRuntimeProjectionCardProps {
  projection: DirectorRuntimeProjection | null | undefined;
  className?: string;
  compact?: boolean;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return i18n.t("common.none", { ns: "componentsMisc" });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return i18n.t("common.none", { ns: "componentsMisc" });
  }
  return date.toLocaleString();
}

function formatTokenCount(value: number | null | undefined): string {
  const count = Math.max(0, Math.round(Number(value ?? 0)));
  return count.toLocaleString();
}

function formatDuration(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const seconds = Math.round(value / 1000);
  if (seconds <= 0) {
    return i18n.t("common.duration.lessThanOneSecond", { ns: "componentsMisc" });
  }
  if (seconds < 60) {
    return i18n.t("common.duration.seconds", { ns: "componentsMisc", seconds });
  }
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return restSeconds > 0
    ? i18n.t("common.duration.minutesSeconds", { ns: "componentsMisc", minutes, seconds: restSeconds })
    : i18n.t("common.duration.minutes", { ns: "componentsMisc", minutes });
}

function formatUsageLine(usage: {
  llmCallCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs?: number | null;
}): string {
  const duration = formatDuration(usage.durationMs);
  return [
    i18n.t("common.usage.calls", { ns: "componentsMisc", calls: formatTokenCount(usage.llmCallCount) }),
    i18n.t("common.usage.input", { ns: "componentsMisc", value: formatTokenCount(usage.promptTokens) }),
    i18n.t("common.usage.output", { ns: "componentsMisc", value: formatTokenCount(usage.completionTokens) }),
    i18n.t("common.usage.total", { ns: "componentsMisc", value: formatTokenCount(usage.totalTokens) }),
    duration ? i18n.t("common.usage.duration", { ns: "componentsMisc", duration }) : null,
  ].filter(Boolean).join(" · ");
}

function formatPolicyMode(mode: DirectorPolicyMode): string {
  if (mode === "suggest_only") {
    return i18n.t("runtimeProjection.policy.suggestOnly", { ns: "componentsMisc" });
  }
  if (mode === "run_next_step") {
    return i18n.t("runtimeProjection.policy.runNextStep", { ns: "componentsMisc" });
  }
  if (mode === "auto_safe_scope") {
    return i18n.t("runtimeProjection.policy.autoSafeScope", { ns: "componentsMisc" });
  }
  return i18n.t("runtimeProjection.policy.runToCheckpoint", { ns: "componentsMisc" });
}

function formatStatus(status: DirectorRuntimeProjectionStatus): string {
  if (status === "running") {
    return i18n.t("runtimeProjection.status.running", { ns: "componentsMisc" });
  }
  if (status === "waiting_approval") {
    return i18n.t("runtimeProjection.status.waitingApproval", { ns: "componentsMisc" });
  }
  if (status === "blocked") {
    return i18n.t("runtimeProjection.status.blocked", { ns: "componentsMisc" });
  }
  if (status === "failed") {
    return i18n.t("runtimeProjection.status.failed", { ns: "componentsMisc" });
  }
  if (status === "completed") {
    return i18n.t("runtimeProjection.status.completed", { ns: "componentsMisc" });
  }
  return i18n.t("runtimeProjection.status.pending", { ns: "componentsMisc" });
}

function statusClassName(status: DirectorRuntimeProjectionStatus): string {
  if (status === "running") {
    return "border-sky-300 bg-sky-50 text-sky-900";
  }
  if (status === "waiting_approval") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }
  if (status === "blocked" || status === "failed") {
    return "border-destructive/30 bg-destructive/5 text-destructive";
  }
  if (status === "completed") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  return "border-border bg-muted/30 text-muted-foreground";
}

function statusIcon(status: DirectorRuntimeProjectionStatus) {
  if (status === "running") {
    return <Activity className="h-4 w-4" />;
  }
  if (status === "waiting_approval") {
    return <PauseCircle className="h-4 w-4" />;
  }
  if (status === "blocked") {
    return <AlertTriangle className="h-4 w-4" />;
  }
  if (status === "failed") {
    return <XCircle className="h-4 w-4" />;
  }
  if (status === "completed") {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  return <ShieldCheck className="h-4 w-4" />;
}

function riskBadgeClassName(level: NonNullable<DirectorRuntimeProjection["visibleRiskBadges"]>[number]["level"]) {
  if (level === "danger") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (level === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function formatQualityDebtSummary(summary: DirectorRuntimeProjection["qualityDebtSummary"] | null | undefined): string | null {
  if (!summary || summary.deferredChapterCount <= 0) {
    return null;
  }
  const orderText = summary.deferredChapterOrders.length > 0
    ? i18n.t("runtimeProjection.qualityDebt.orders", {
      ns: "componentsMisc",
      orders: summary.deferredChapterOrders.join(i18n.t("common.listSeparator", { ns: "componentsMisc" })),
    })
    : "";
  return i18n.t("runtimeProjection.qualityDebt.summary", { ns: "componentsMisc", orderText });
}

function formatQualityBudgetSummary(summary: DirectorRuntimeProjection["qualityBudgetSummary"] | null | undefined): string | null {
  if (!summary) {
    return null;
  }
  const chapterText = typeof summary.currentChapterOrder === "number"
    ? i18n.t("runtimeProjection.qualityBudget.chapter", { ns: "componentsMisc", order: summary.currentChapterOrder })
    : i18n.t("runtimeProjection.qualityBudget.currentChapter", { ns: "componentsMisc" });
  return i18n.t("runtimeProjection.qualityBudget.summary", {
    ns: "componentsMisc",
    chapter: chapterText,
    patch: summary.patchRepairUsed,
    rewrite: summary.chapterRewriteUsed,
    replan: summary.windowReplanUsed,
    nextAction: summary.nextActionLabel,
  });
}

function formatRootCauseSummary(projection: DirectorRuntimeProjection): string | null {
  if (!projection.rootCauseCode || projection.rootCauseCode === "none") {
    return null;
  }
  if (projection.rootCauseCode === "replan_required") {
    return i18n.t("runtimeProjection.rootCause.replanRequired", { ns: "componentsMisc" });
  }
  if (projection.rootCauseCode === "draft_obligation_unmet") {
    return i18n.t("runtimeProjection.rootCause.draftObligationUnmet", { ns: "componentsMisc" });
  }
  if (projection.rootCauseCode === "draft_repair_exhausted") {
    return i18n.t("runtimeProjection.rootCause.draftRepairExhausted", { ns: "componentsMisc" });
  }
  return i18n.t("runtimeProjection.rootCause.default", { ns: "componentsMisc" });
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export default function DirectorRuntimeProjectionCard({
  projection,
  className,
  compact = false,
}: DirectorRuntimeProjectionCardProps) {
  const { t } = useTranslation("componentsMisc");
  if (!projection) {
    return null;
  }
  const primaryText = projection.headline?.trim()
    || projection.currentLabel?.trim()
    || projection.lastEventSummary?.trim()
    || t("runtimeProjection.awaitingSync");
  const detailText = projection.detail?.trim();
  const attentionText = projection.requiresUserAction
    ? projection.blockingReason?.trim()
      || projection.blockedReason?.trim()
      || projection.lastEventSummary?.trim()
      || t("runtimeProjection.handleStop")
    : projection.blockingReason?.trim() || projection.blockedReason?.trim();
  const progressLine = projection.progressBreakdown?.explanation?.trim()
    || projection.progressSummary?.trim()
    || null;
  const qualityDebtLine = formatQualityDebtSummary(projection.qualityDebtSummary);
  const qualityBudgetLine = formatQualityBudgetSummary(projection.qualityBudgetSummary);
  const rootCauseLine = formatRootCauseSummary(projection);
  const obligationLine = projection.blockingObligations && projection.blockingObligations.length > 0
    ? t("runtimeProjection.obligationLine", {
      items: projection.blockingObligations.slice(0, 3).map((item) => item.summary).join(t("common.semicolonSeparator")),
    })
    : null;
  const activeExecutionLine = projection.activeExecution
    ? `${t("runtimeProjection.backgroundExec", {
      label: getDirectorNodeDisplayLabel({
        nodeKey: projection.activeExecution.stepType,
        fallback: projection.currentAction || t("runtimeProjection.autoDirectorTask"),
      }),
    })}${projection.activeExecution.resourceClass ? ` · ${projection.activeExecution.resourceClass}` : ""}`
    : null;
  const waitingLine = projection.waitingReason
    ? t("runtimeProjection.waitingReason", { reason: projection.waitingReason })
    : null;
  const workerHealthLine = projection.workerHealth
    ? [
      t("runtimeProjection.worker.queue", { waiting: projection.workerHealth.queuedCommandCount }),
      projection.workerHealth.runningCommandCount > 0 ? t("runtimeProjection.worker.processing", { processing: projection.workerHealth.runningCommandCount }) : null,
      projection.workerHealth.currentWorkerId ? t("runtimeProjection.worker.workerId", { id: projection.workerHealth.currentWorkerId }) : null,
    ].filter(Boolean).join(" · ")
    : null;
  const helperLines = [
    activeExecutionLine,
    waitingLine,
    workerHealthLine,
    projection.nextActionLabel ? t("runtimeProjection.nextStep", { label: projection.nextActionLabel }) : null,
    projection.recommendedAction?.reason ? t("runtimeProjection.recommendReason", { reason: projection.recommendedAction.reason }) : null,
    projection.isAutopilotRecoverable ? t("runtimeProjection.autopilotRecoverable") : null,
    rootCauseLine,
    obligationLine,
    qualityBudgetLine,
    qualityDebtLine,
    projection.scopeSummary,
    progressLine,
  ].filter((line): line is string => Boolean(line?.trim()));
  const recentEvents = projection.recentEvents.slice(0, compact ? 2 : 4);
  const usageSummary = projection.usageSummary ?? null;
  const stepUsage = projection.stepUsage?.slice(0, compact ? 2 : 4) ?? [];
  const promptUsage = projection.promptUsage?.slice(0, compact ? 2 : 6) ?? [];
  const visibleRiskBadges = projection.visibleRiskBadges?.slice(0, compact ? 3 : 6) ?? [];
  const progressBreakdown = projection.progressBreakdown ?? null;

  return (
    <div className={cn("rounded-lg border bg-background/80 p-3", statusClassName(projection.status), className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 shrink-0">{statusIcon(projection.status)}</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{t("runtimeProjection.headingLabel")}</div>
            <div className="mt-1 text-sm leading-5">{primaryText}</div>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 bg-background/70">
          {formatStatus(projection.status)}
        </Badge>
      </div>

      {visibleRiskBadges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleRiskBadges.map((badge) => (
            <Badge key={`${badge.source ?? "risk"}:${badge.label}`} variant="outline" className={cn("bg-background/70", riskBadgeClassName(badge.level))}>
              {badge.label}
            </Badge>
          ))}
        </div>
      ) : null}

      {progressBreakdown && !compact ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-md border bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t("runtimeProjection.metric.planning")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(progressBreakdown.planningProgress ?? progressBreakdown.planningPercent)}</div>
          </div>
          <div className="rounded-md border bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t("runtimeProjection.metric.chapters")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{progressBreakdown.continuableChapters}/{progressBreakdown.totalChapters}</div>
          </div>
          <div className="rounded-md border bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t("runtimeProjection.metric.quality")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(progressBreakdown.qualityProgress ?? progressBreakdown.qualityRepairPercent)}</div>
          </div>
          <div className="rounded-md border bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{t("runtimeProjection.metric.currentAction")}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{formatPercent(progressBreakdown.activeJobProgress)}</div>
          </div>
        </div>
      ) : null}

      {attentionText ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-sm leading-5">
          {projection.requiresUserAction ? t("runtimeProjection.needAttention") : t("runtimeProjection.pauseReason")}{attentionText}
        </div>
      ) : null}

      {detailText && detailText !== attentionText ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-sm leading-5">
          {detailText}
        </div>
      ) : null}

      {helperLines.length > 0 && !compact ? (
        <div className="mt-3 space-y-2">
          {helperLines.map((line) => (
            <div key={line} className="rounded-md border bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
              {line}
            </div>
          ))}
        </div>
      ) : null}

      {usageSummary ? (
        <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
          <div className="font-medium text-foreground">{t("common.usage.heading")}</div>
          <div className="mt-1">{formatUsageLine(usageSummary)}</div>
          {promptUsage.length > 0 && !compact ? (
            <div className="mt-2 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">{t("common.usage.stageHeading")}</div>
              {promptUsage.map((item) => (
                <div key={`${item.promptAssetKey}:${item.promptVersion ?? ""}:${item.nodeKey ?? ""}`} className="flex flex-wrap items-center justify-between gap-2 border-t pt-1">
                  <span className="min-w-0 truncate text-foreground">
                    {getDirectorNodeDisplayLabel({ label: item.label ?? item.promptAssetKey, nodeKey: item.nodeKey })}
                  </span>
                  <span className="shrink-0">{formatUsageLine(item)}</span>
                </div>
              ))}
            </div>
          ) : null}
          {stepUsage.length > 0 && !compact ? (
            <div className="mt-2 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">{t("common.usage.stepHeading")}</div>
              {stepUsage.map((item) => (
                <div key={item.stepIdempotencyKey} className="flex flex-wrap items-center justify-between gap-2 border-t pt-1">
                  <span className="min-w-0 truncate text-foreground">
                    {getDirectorNodeDisplayLabel({ label: item.label, nodeKey: item.nodeKey })}
                  </span>
                  <span className="shrink-0">{formatUsageLine(item)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-background/70 px-2 py-1">{t("runtimeProjection.policyModeLabel")}{formatPolicyMode(projection.policyMode)}</span>
        <span className="rounded-full bg-background/70 px-2 py-1">{t("runtimeProjection.updatedAtLabel")}{formatDate(projection.updatedAt)}</span>
      </div>

      {recentEvents.length > 0 && !compact ? (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">{t("runtimeProjection.recentProgress")}</div>
          {recentEvents.map((event) => (
            <div key={event.eventId} className="rounded-md border bg-background/70 px-3 py-2 text-xs leading-5">
              <div className="text-foreground">{event.summary}</div>
              <div className="mt-1 text-muted-foreground">{formatDate(event.occurredAt)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

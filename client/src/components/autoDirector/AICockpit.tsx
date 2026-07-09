import type { ReactNode } from "react";
import type {
  DirectorBookAutomationAction,
  DirectorBookAutomationDisplayState,
  DirectorBookAutomationProjection,
} from "@ai-novel/shared/types/directorRuntime";
import { getDirectorNodeDisplayLabel } from "@ai-novel/shared/types/directorRuntime";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  History,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AICockpitProps {
  projection?: DirectorBookAutomationProjection | null;
  mode?: "focusedNovel" | "compact";
  fallbackSummary?: string | null;
  fallbackStatusLabel?: string | null;
  isActionPending?: boolean;
  showDetailsAction?: boolean;
  onAction?: (projection: DirectorBookAutomationProjection, action: DirectorBookAutomationAction) => void;
  onOpenDetails?: (projection: DirectorBookAutomationProjection) => void;
  onOpenNovel?: (projection: DirectorBookAutomationProjection) => void;
  onOpenFallbackDetails?: () => void;
}

function displayStateLabel(state: DirectorBookAutomationDisplayState): string {
  const labels: Record<DirectorBookAutomationDisplayState, string> = {
    processing: i18n.t("cockpit.displayState.processing", { ns: "componentsMisc" }),
    needs_confirmation: i18n.t("cockpit.displayState.needsConfirmation", { ns: "componentsMisc" }),
    paused: i18n.t("cockpit.displayState.paused", { ns: "componentsMisc" }),
    needs_attention: i18n.t("cockpit.displayState.needsAttention", { ns: "componentsMisc" }),
    completed: i18n.t("cockpit.displayState.completed", { ns: "componentsMisc" }),
    idle: i18n.t("cockpit.displayState.idle", { ns: "componentsMisc" }),
  };
  return labels[state];
}

function stateBadgeVariant(state: DirectorBookAutomationDisplayState): "default" | "secondary" | "outline" | "destructive" {
  if (state === "needs_attention") {
    return "destructive";
  }
  if (state === "processing") {
    return "default";
  }
  if (state === "needs_confirmation" || state === "paused") {
    return "outline";
  }
  return "secondary";
}

function stateClassName(state: DirectorBookAutomationDisplayState): string {
  if (state === "processing") {
    return "border-sky-200 bg-sky-50/70";
  }
  if (state === "needs_confirmation") {
    return "border-amber-200 bg-amber-50/70";
  }
  if (state === "paused") {
    return "border-indigo-200 bg-indigo-50/60";
  }
  if (state === "needs_attention") {
    return "border-destructive/30 bg-destructive/5";
  }
  if (state === "completed") {
    return "border-emerald-200 bg-emerald-50/60";
  }
  return "border-border/70 bg-muted/20";
}

function stateIcon(state: DirectorBookAutomationDisplayState) {
  if (state === "processing") {
    return <Activity className="h-4 w-4" />;
  }
  if (state === "needs_confirmation") {
    return <PauseCircle className="h-4 w-4" />;
  }
  if (state === "paused") {
    return <Clock3 className="h-4 w-4" />;
  }
  if (state === "needs_attention") {
    return <AlertTriangle className="h-4 w-4" />;
  }
  if (state === "completed") {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  return <ShieldCheck className="h-4 w-4" />;
}

function stateAccentClassName(state: DirectorBookAutomationDisplayState): string {
  if (state === "processing") {
    return "text-sky-700";
  }
  if (state === "needs_confirmation") {
    return "text-amber-700";
  }
  if (state === "paused") {
    return "text-indigo-700";
  }
  if (state === "needs_attention") {
    return "text-destructive";
  }
  if (state === "completed") {
    return "text-emerald-700";
  }
  return "text-muted-foreground";
}

function stateSoftSurfaceClassName(state: DirectorBookAutomationDisplayState): string {
  if (state === "processing") {
    return "bg-sky-50/60";
  }
  if (state === "needs_confirmation") {
    return "bg-amber-50/70";
  }
  if (state === "paused") {
    return "bg-indigo-50/60";
  }
  if (state === "needs_attention") {
    return "bg-destructive/5";
  }
  if (state === "completed") {
    return "bg-emerald-50/60";
  }
  return "bg-muted/20";
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

function fallbackProjectionReason(props: Pick<AICockpitProps, "fallbackSummary">): string {
  return props.fallbackSummary?.trim() || i18n.t("cockpit.fallbackReason", { ns: "componentsMisc" });
}

function renderActionLabel(
  action: DirectorBookAutomationAction,
  displayState?: DirectorBookAutomationDisplayState,
): string {
  if (
    displayState === "needs_confirmation"
    && (action.type === "continue" || action.type === "auto_execute_range")
  ) {
    return i18n.t("cockpit.action.confirmContinue", { ns: "componentsMisc" });
  }
  return action.label || i18n.t("cockpit.action.continue", { ns: "componentsMisc" });
}

function artifactTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    book_contract: i18n.t("cockpit.artifactType.bookContract", { ns: "componentsMisc" }),
    story_macro: i18n.t("cockpit.artifactType.storyMacro", { ns: "componentsMisc" }),
    character_cast: i18n.t("cockpit.artifactType.characterCast", { ns: "componentsMisc" }),
    volume_strategy: i18n.t("cockpit.artifactType.volumeStrategy", { ns: "componentsMisc" }),
    chapter_task_sheet: i18n.t("cockpit.artifactType.chapterTaskSheet", { ns: "componentsMisc" }),
    chapter_draft: i18n.t("cockpit.artifactType.chapterDraft", { ns: "componentsMisc" }),
    audit_report: i18n.t("cockpit.artifactType.auditReport", { ns: "componentsMisc" }),
    repair_ticket: i18n.t("cockpit.artifactType.repairTicket", { ns: "componentsMisc" }),
    reader_promise: i18n.t("cockpit.artifactType.readerPromise", { ns: "componentsMisc" }),
    character_governance_state: i18n.t("cockpit.artifactType.characterGovernanceState", { ns: "componentsMisc" }),
    world_skeleton: i18n.t("cockpit.artifactType.worldSkeleton", { ns: "componentsMisc" }),
    source_knowledge_pack: i18n.t("cockpit.artifactType.sourceKnowledgePack", { ns: "componentsMisc" }),
    chapter_retention_contract: i18n.t("cockpit.artifactType.chapterRetentionContract", { ns: "componentsMisc" }),
    continuity_state: i18n.t("cockpit.artifactType.continuityState", { ns: "componentsMisc" }),
    rolling_window_review: i18n.t("cockpit.artifactType.rollingWindowReview", { ns: "componentsMisc" }),
  };
  return labels[type] ?? type;
}

function recoveryActionLabel(
  action: NonNullable<DirectorBookAutomationProjection["circuitBreaker"]>["recoveryAction"],
): string | null {
  const labels: Record<string, string> = {
    retry: i18n.t("cockpit.recovery.retry", { ns: "componentsMisc" }),
    resume_after_review: i18n.t("cockpit.recovery.resumeAfterReview", { ns: "componentsMisc" }),
    switch_model: i18n.t("cockpit.recovery.switchModel", { ns: "componentsMisc" }),
    confirm_protected_content: i18n.t("cockpit.recovery.confirmProtectedContent", { ns: "componentsMisc" }),
    manual_repair: i18n.t("cockpit.recovery.manualRepair", { ns: "componentsMisc" }),
  };
  return action ? labels[action] ?? null : null;
}

function workerStateLabel(
  state: NonNullable<DirectorBookAutomationProjection["workerHealth"]>["derivedState"],
): string {
  const labels: Record<NonNullable<DirectorBookAutomationProjection["workerHealth"]>["derivedState"], string> = {
    idle: i18n.t("cockpit.workerState.idle", { ns: "componentsMisc" }),
    queued_waiting_worker: i18n.t("cockpit.workerState.queuedWaitingWorker", { ns: "componentsMisc" }),
    leased_starting: i18n.t("cockpit.workerState.leasedStarting", { ns: "componentsMisc" }),
    running_step: i18n.t("cockpit.workerState.runningStep", { ns: "componentsMisc" }),
    waiting_gate: i18n.t("cockpit.workerState.waitingGate", { ns: "componentsMisc" }),
    auto_recovering: i18n.t("cockpit.workerState.autoRecovering", { ns: "componentsMisc" }),
    cancelled: i18n.t("cockpit.workerState.cancelled", { ns: "componentsMisc" }),
    failed_recoverable: i18n.t("cockpit.workerState.failedRecoverable", { ns: "componentsMisc" }),
    failed_hard: i18n.t("cockpit.workerState.failedHard", { ns: "componentsMisc" }),
    succeeded: i18n.t("cockpit.workerState.succeeded", { ns: "componentsMisc" }),
  };
  return labels[state] ?? state;
}

function workerStateDetail(health: NonNullable<DirectorBookAutomationProjection["workerHealth"]>): string {
  if (health.message?.trim()) {
    return health.message.trim();
  }
  if (health.queuedCommandCount > 0) {
    return i18n.t("cockpit.workerDetail.queued", { ns: "componentsMisc" });
  }
  if (health.runningCommandCount > 0 || health.leasedCommandCount > 0) {
    return i18n.t("cockpit.workerDetail.running", { ns: "componentsMisc" });
  }
  if (health.staleCommandCount > 0) {
    return i18n.t("cockpit.workerDetail.stale", { ns: "componentsMisc" });
  }
  return i18n.t("cockpit.workerDetail.idle", { ns: "componentsMisc" });
}

function SummaryMetric(props: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground">{props.label}</div>
      <div className={cn("mt-1 truncate text-sm font-medium text-foreground", props.className)}>
        {props.value}
      </div>
    </div>
  );
}

function DetailPanel(props: {
  title: string;
  summary?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl bg-muted/25">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          {props.icon ? <span className="shrink-0 text-muted-foreground">{props.icon}</span> : null}
          <span className="truncate">{props.title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
          {props.summary}
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1">
        {props.children}
      </div>
    </details>
  );
}

export default function AICockpit(props: AICockpitProps) {
  const { t } = useTranslation("componentsMisc");
  const {
    mode = "focusedNovel",
    fallbackStatusLabel,
    isActionPending = false,
    showDetailsAction = true,
    onAction,
    onOpenDetails,
    onOpenNovel,
    onOpenFallbackDetails,
  } = props;
  const focusProjection = props.projection ?? null;
  const isCompact = mode === "compact";

  if (!focusProjection) {
    return (
      <div className="rounded-2xl bg-muted/25 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 shrink-0 text-muted-foreground">{stateIcon("idle")}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{t("cockpit.title")}</div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{fallbackProjectionReason(props)}</div>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">{fallbackStatusLabel ?? t("cockpit.displayState.idle")}</Badge>
        </div>
        {onOpenFallbackDetails ? (
          <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={onOpenFallbackDetails}>
            {t("cockpit.view")}
          </Button>
        ) : null}
      </div>
    );
  }

  const primaryAction = focusProjection.primaryAction ?? null;
  const detailAction = focusProjection.secondaryActions?.find((item) => item.type === "open_details") ?? null;
  const canOpenDetails = showDetailsAction && Boolean(onOpenDetails || (detailAction && onAction));
  const recentItems = focusProjection.timeline.slice(0, isCompact ? 2 : 3);
  const artifactRows = focusProjection.artifactSummary.byType?.slice(0, 3) ?? [];
  const usageSummary = focusProjection.usageSummary ?? null;
  const stepUsage = focusProjection.stepUsage?.slice(0, 2) ?? [];
  const promptUsage = focusProjection.promptUsage?.slice(0, 6) ?? [];
  const circuitBreaker = focusProjection.circuitBreaker?.status === "open" ? focusProjection.circuitBreaker : null;
  const circuitRecovery = recoveryActionLabel(circuitBreaker?.recoveryAction ?? null);
  const workerHealth = focusProjection.workerHealth ?? null;
  const artifactInsightLines = [
    focusProjection.artifactSummary.affectedChapterCount
      ? t("cockpit.insight.affectedChapters", { chapters: focusProjection.artifactSummary.affectedChapterCount })
      : null,
    focusProjection.artifactSummary.recentStaleArtifacts?.length
      ? t("cockpit.insight.staleArtifacts", { artifacts: focusProjection.artifactSummary.recentStaleArtifacts.length })
      : null,
    focusProjection.artifactSummary.recentRepairArtifacts?.length
      ? t("cockpit.insight.repairRecords", { records: focusProjection.artifactSummary.recentRepairArtifacts.length })
      : null,
    focusProjection.artifactSummary.recentVersionedArtifacts?.length
      ? t("cockpit.insight.versionedArtifacts", { artifacts: focusProjection.artifactSummary.recentVersionedArtifacts.length })
      : null,
  ].filter((line): line is string => Boolean(line));
  const reason = focusProjection.userReason?.trim()
    || focusProjection.blockedReason?.trim()
    || focusProjection.detail?.trim()
    || focusProjection.automationSummary?.trim()
    || fallbackProjectionReason(props);
  const statusHeadline = focusProjection.userHeadline?.trim()
    || focusProjection.headline?.trim()
    || displayStateLabel(focusProjection.displayState);
  const statusDetail = reason === statusHeadline
    ? focusProjection.progressSummary?.trim() || t("cockpit.statusSummaryFallback")
    : reason;
  const latestRecordText = recentItems[0] ? formatDate(recentItems[0].occurredAt) : t("common.none");

  const handlePrimaryAction = () => {
    if (primaryAction && onAction) {
      onAction(focusProjection, primaryAction);
      return;
    }
    onOpenNovel?.(focusProjection);
  };

  const handleDetails = () => {
    if (detailAction && onAction) {
      onAction(focusProjection, detailAction);
      return;
    }
    onOpenDetails?.(focusProjection);
  };

  const handleCompactOpen = () => {
    if (onOpenNovel) {
      onOpenNovel(focusProjection);
      return;
    }
    handleDetails();
  };

  if (isCompact) {
    return (
      <div className={cn("rounded-lg border p-3", stateClassName(focusProjection.displayState))}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 shrink-0 text-foreground">{stateIcon(focusProjection.displayState)}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{t("cockpit.title")}</div>
              <div className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
                {focusProjection.userHeadline || focusProjection.headline || reason}
              </div>
            </div>
          </div>
          <Badge variant={stateBadgeVariant(focusProjection.displayState)} className="shrink-0">
            {displayStateLabel(focusProjection.displayState)}
          </Badge>
        </div>
        <Button type="button" size="sm" variant="outline" className="mt-3 w-full" onClick={handleCompactOpen}>
          {t("cockpit.view")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className={cn("rounded-2xl p-5 shadow-sm", stateSoftSurfaceClassName(focusProjection.displayState))}>
        <div className="flex items-center justify-between gap-3">
          <div className={cn("flex min-w-0 items-center gap-2 text-xs font-medium", stateAccentClassName(focusProjection.displayState))}>
            <span className="shrink-0">
              {stateIcon(focusProjection.displayState)}
            </span>
            <span className="truncate">{displayStateLabel(focusProjection.displayState)}</span>
          </div>
          <span className="min-w-0 max-w-[52%] truncate rounded-full bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
            {focusProjection.focusNovel.title}
          </span>
        </div>

        <div className="mt-4 max-w-[46rem]">
          <h3 className="text-base font-semibold leading-7 text-foreground">{statusHeadline}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusDetail}</p>
        </div>

        <div className="mt-5 grid gap-3 rounded-xl bg-background/60 p-3 sm:grid-cols-3">
          <SummaryMetric
            label={t("cockpit.metric.currentStatus")}
            value={displayStateLabel(focusProjection.displayState)}
            className={stateAccentClassName(focusProjection.displayState)}
          />
          <SummaryMetric label={t("cockpit.metric.progressOverview")} value={focusProjection.progressSummary || t("cockpit.noProgressSummary")} />
          <SummaryMetric label={t("cockpit.metric.latestRecord")} value={latestRecordText} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground">{t("cockpit.nextStep")}</div>
            <div className="mt-1 text-sm font-medium leading-5 text-foreground">
              {focusProjection.nextActionLabel || t("cockpit.openNovelToView")}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button type="button" size="sm" onClick={handlePrimaryAction} disabled={isActionPending}>
              {isActionPending ? t("cockpit.processing") : renderActionLabel(primaryAction ?? {
                type: "open_novel",
                label: t("cockpit.openNovel"),
                target: { novelId: focusProjection.novelId },
              }, focusProjection.displayState)}
            </Button>
            {canOpenDetails ? (
              <Button type="button" size="sm" variant="secondary" onClick={handleDetails}>
                <ExternalLink className="h-4 w-4" />
                {t("cockpit.executionDetails")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {circuitBreaker ? (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">
          <div className="font-medium">{t("cockpit.autoPaused")}</div>
          <div className="mt-1">{circuitBreaker.message || t("cockpit.autoPausedReason")}</div>
          {circuitRecovery ? <div className="mt-1">{t("cockpit.suggestion", { action: circuitRecovery })}</div> : null}
        </section>
      ) : null}

      {workerHealth ? (
        <section className="rounded-2xl bg-muted/25 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Database className="h-4 w-4 text-muted-foreground" />
              {t("cockpit.backgroundExecution")}
            </div>
            <span className="text-xs text-muted-foreground">{workerStateLabel(workerHealth.derivedState)}</span>
          </div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{workerStateDetail(workerHealth)}</div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            <SummaryMetric label={t("cockpit.workerMetric.queued")} value={workerHealth.queuedCommandCount} />
            <SummaryMetric label={t("cockpit.workerMetric.leased")} value={workerHealth.leasedCommandCount} />
            <SummaryMetric label={t("cockpit.workerMetric.running")} value={workerHealth.runningCommandCount} />
            <SummaryMetric label={t("cockpit.workerMetric.stale")} value={workerHealth.staleCommandCount} />
          </div>
          {workerHealth.oldestQueuedWaitMs ? (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {t("cockpit.waitingForWorker", { duration: formatDuration(workerHealth.oldestQueuedWaitMs) ?? t("common.duration.lessThanOneSecond") })}
            </div>
          ) : null}
        </section>
      ) : null}

      {artifactRows.length > 0 ? (
        <section className="rounded-2xl bg-muted/25 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Database className="h-4 w-4 text-muted-foreground" />
              {t("cockpit.artifactRecords")}
            </div>
            {artifactInsightLines.length > 0 ? (
              <span className="text-xs text-muted-foreground">{artifactInsightLines[0]}</span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs text-muted-foreground">
            {artifactRows.map((item) => (
              <span key={item.artifactType}>
                <span className="font-medium text-foreground">{artifactTypeLabel(String(item.artifactType))}</span>
                <span className="ml-1">{item.activeCount}/{item.totalCount}</span>
              </span>
            ))}
          </div>
          {artifactInsightLines.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {artifactInsightLines.slice(1).map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {usageSummary ? (
        <DetailPanel
          title={t("common.usage.heading")}
          summary={t("cockpit.usageSummaryShort", { calls: formatTokenCount(usageSummary.llmCallCount), tokens: formatTokenCount(usageSummary.totalTokens) })}
          icon={<Activity className="h-4 w-4" />}
        >
          <div className="space-y-3 text-xs leading-5 text-muted-foreground">
            <div>{formatUsageLine(usageSummary)}</div>
            {promptUsage.length > 0 ? (
              <div className="space-y-1">
                <div className="font-medium text-foreground">{t("common.usage.stageHeading")}</div>
                <div className="divide-y divide-border/60">
                  {promptUsage.map((item) => (
                    <div key={`${item.promptAssetKey}:${item.promptVersion ?? ""}:${item.nodeKey ?? ""}`} className="grid gap-1 py-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <span className="min-w-0 truncate text-foreground">
                        {getDirectorNodeDisplayLabel({ label: item.label ?? item.promptAssetKey, nodeKey: item.nodeKey })}
                      </span>
                      <span>{formatUsageLine(item)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {stepUsage.length > 0 ? (
              <div className="space-y-1">
                <div className="font-medium text-foreground">{t("common.usage.stepHeading")}</div>
                <div className="divide-y divide-border/60">
                  {stepUsage.map((item) => (
                    <div key={item.stepIdempotencyKey} className="grid gap-1 py-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <span className="min-w-0 truncate text-foreground">
                        {getDirectorNodeDisplayLabel({ label: item.label, nodeKey: item.nodeKey })}
                      </span>
                      <span>{formatUsageLine(item)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </DetailPanel>
      ) : null}

      {recentItems.length > 0 ? (
        <DetailPanel
          title={t("cockpit.automationRecords")}
          summary={t("cockpit.recordCount", { records: recentItems.length })}
          icon={<History className="h-4 w-4" />}
        >
          <div className="divide-y divide-border/60 text-xs leading-5">
            {recentItems.map((item) => (
              <div key={item.id} className="py-2">
                <div className="line-clamp-2 text-foreground">{item.title}</div>
                {item.usage ? (
                  <div className="mt-1 text-muted-foreground">{formatUsageLine(item.usage)}</div>
                ) : item.durationMs ? (
                  <div className="mt-1 text-muted-foreground">{t("cockpit.elapsed", { duration: formatDuration(item.durationMs) })}</div>
                ) : null}
                <div className="mt-1 text-muted-foreground">{formatDate(item.occurredAt)}</div>
              </div>
            ))}
          </div>
        </DetailPanel>
      ) : null}
    </div>
  );
}

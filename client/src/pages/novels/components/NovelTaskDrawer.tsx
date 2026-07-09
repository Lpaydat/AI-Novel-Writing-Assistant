import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type {
  NovelWorkflowMilestone,
  NovelWorkflowMilestoneType,
} from "@ai-novel/shared/types/novelWorkflow";
import type { DirectorBookAutomationAction } from "@ai-novel/shared/types/directorRuntime";
import type { TaskStatus } from "@ai-novel/shared/types/task";
import type { CharacterResourceProposalSummary } from "@ai-novel/shared/types/characterResource";
import type { AutoDirectorAction } from "@ai-novel/shared/types/autoDirectorFollowUp";
import AICockpit from "@/components/autoDirector/AICockpit";
import LLMSelector from "@/components/common/LLMSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import TaskCenterManualEditImpactCard from "@/pages/tasks/components/TaskCenterManualEditImpactCard";
import TaskCenterRuntimePolicyCard from "@/pages/tasks/components/TaskCenterRuntimePolicyCard";
import type { NovelTaskDrawerState } from "./NovelEditView.types";
import { formatLocaleDateTime, formatLocaleNumber } from "@/i18n/format";

type DrawerTask = NonNullable<NovelTaskDrawerState["task"]>;

function formatStatus(t: TFunction, status: TaskStatus): string {
  if (status === "queued") {
    return t("taskDrawer.status.queued");
  }
  if (status === "running") {
    return t("taskDrawer.status.running");
  }
  if (status === "waiting_approval") {
    return t("taskDrawer.status.waitingApproval");
  }
  if (status === "succeeded") {
    return t("taskDrawer.status.succeeded");
  }
  if (status === "failed") {
    return t("taskDrawer.status.failed");
  }
  return t("taskDrawer.status.cancelled");
}

function formatTaskStatus(t: TFunction, task: DrawerTask): string {
  if (task.pendingManualRecovery) {
    return t("taskDrawer.status.pendingRecovery");
  }
  return formatStatus(t, task.status);
}

function toStatusVariant(status: TaskStatus): "default" | "outline" | "secondary" | "destructive" {
  if (status === "running") {
    return "default";
  }
  if (status === "failed") {
    return "destructive";
  }
  if (status === "queued" || status === "waiting_approval") {
    return "secondary";
  }
  return "outline";
}

function toTaskStatusVariant(task: DrawerTask): "default" | "outline" | "secondary" | "destructive" {
  if (task.pendingManualRecovery) {
    return "secondary";
  }
  return toStatusVariant(task.status);
}

function formatCheckpoint(t: TFunction, checkpoint: NovelWorkflowMilestoneType | null | undefined, scopeLabel?: string | null): string {
  const resolvedScopeLabel = scopeLabel?.trim() || t("taskDrawer.checkpoint.defaultScope");
  if (checkpoint === "rewrite_snapshot_created") {
    return t("taskDrawer.checkpoint.rewriteSnapshot");
  }
  if (checkpoint === "candidate_selection_required") {
    return t("taskDrawer.checkpoint.candidateSelection");
  }
  if (checkpoint === "book_contract_ready") {
    return t("taskDrawer.checkpoint.bookContractReady");
  }
  if (checkpoint === "character_setup_required") {
    return t("taskDrawer.checkpoint.characterSetup");
  }
  if (checkpoint === "volume_strategy_ready") {
    return t("taskDrawer.checkpoint.volumeStrategy");
  }
  if (checkpoint === "chapter_batch_ready") {
    return t("taskDrawer.checkpoint.batchPaused", { scope: resolvedScopeLabel });
  }
  if (checkpoint === "workflow_completed") {
    return t("taskDrawer.checkpoint.workflowCompleted");
  }
  return t("common.none");
}

function formatDate(t: TFunction, value: string | null | undefined): string {
  if (!value) {
    return t("common.none");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("common.none");
  }
  return formatLocaleDateTime(date);
}

function formatTokenCount(value: number | null | undefined): string {
  return formatLocaleNumber(Math.max(0, Math.round(value ?? 0)));
}

function formatStepStatus(t: TFunction, status: "idle" | "running" | "succeeded" | "failed" | "cancelled"): string {
  if (status === "running") {
    return t("taskDrawer.stepStatus.running");
  }
  if (status === "succeeded") {
    return t("taskDrawer.stepStatus.succeeded");
  }
  if (status === "failed") {
    return t("taskDrawer.stepStatus.failed");
  }
  if (status === "cancelled") {
    return t("taskDrawer.stepStatus.cancelled");
  }
  return t("taskDrawer.stepStatus.pending");
}

function formatRiskLevel(t: TFunction, riskLevel: CharacterResourceProposalSummary["riskLevel"]): string {
  if (riskLevel === "high") {
    return t("taskDrawer.risk.high");
  }
  if (riskLevel === "medium") {
    return t("taskDrawer.risk.medium");
  }
  return t("taskDrawer.risk.low");
}

function formatProposalSource(t: TFunction, proposal: CharacterResourceProposalSummary): string {
  return proposal.sourceType === "chapter_background_sync" ? t("taskDrawer.proposalSource.autoSync") : t("taskDrawer.proposalSource.manualReview");
}

function followUpActionVariant(action: AutoDirectorAction): "default" | "outline" {
  return action.kind === "mutation" && action.riskLevel !== "high" ? "default" : "outline";
}

function formatFollowUpPriority(t: TFunction, priority: "P0" | "P1" | "P2"): string {
  if (priority === "P0") {
    return t("taskDrawer.priority.p0");
  }
  if (priority === "P1") {
    return t("taskDrawer.priority.p1");
  }
  return t("taskDrawer.priority.p2");
}

function readProposalPayloadText(
  proposal: CharacterResourceProposalSummary,
  key: string,
): string {
  const value = proposal.payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function ResourceProposalCard(props: {
  proposal: CharacterResourceProposalSummary;
  onOpenSource?: (proposal: CharacterResourceProposalSummary) => void;
  onConfirm?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  confirmingProposalId?: string;
  rejectingProposalId?: string;
}) {
  const { t } = useTranslation("novelsEditC");
  const {
    proposal,
    onOpenSource,
    onConfirm,
    onReject,
    confirmingProposalId = "",
    rejectingProposalId = "",
  } = props;
  const resourceName = readProposalPayloadText(proposal, "resourceName") || t("taskDrawer.keyResource");
  const holderName = readProposalPayloadText(proposal, "holderCharacterName");
  const narrativeImpact = readProposalPayloadText(proposal, "narrativeImpact");
  const isConfirming = confirmingProposalId === proposal.id;
  const isRejecting = rejectingProposalId === proposal.id;

  return (
    <div className="space-y-3 rounded-xl border bg-background/80 p-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{resourceName}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {holderName ? t("taskDrawer.holderRelatedResource", { name: holderName }) : t("taskDrawer.ownershipNeedsConfirm")}
          </div>
        </div>
        <Badge variant={proposal.riskLevel === "high" ? "destructive" : "secondary"}>
          {formatRiskLevel(t, proposal.riskLevel)}
        </Badge>
      </div>
      <div className="text-sm leading-6 text-muted-foreground">{proposal.summary}</div>
      {narrativeImpact ? (
        <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
          {t("taskDrawer.impactAfterConfirm", { value: narrativeImpact })}
        </div>
      ) : null}
      {proposal.evidence[0] ? (
        <div className="text-xs leading-5 text-muted-foreground">{t("taskDrawer.evidenceLine", { value: proposal.evidence[0] })}</div>
      ) : null}
      {proposal.validationNotes[0] ? (
        <div className="text-xs leading-5 text-muted-foreground">{t("taskDrawer.reasonLine", { value: proposal.validationNotes[0] })}</div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{formatProposalSource(t, proposal)}</Badge>
        {proposal.chapterId ? <Badge variant="outline">{t("taskDrawer.sourceChapter")}</Badge> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {proposal.chapterId ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenSource?.(proposal)}>
            {t("taskDrawer.viewSource")}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={() => onConfirm?.(proposal.id)}
          disabled={isConfirming || !onConfirm}
        >
          {isConfirming ? t("taskDrawer.confirming") : t("taskDrawer.confirmForWriting")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onReject?.(proposal.id)}
          disabled={isRejecting || !onReject}
        >
          {isRejecting ? t("taskDrawer.processing") : t("taskDrawer.ignoreChange")}
        </Button>
      </div>
    </div>
  );
}

export default function NovelTaskDrawer({
  open,
  onOpenChange,
  task,
  snapshot,
  runtimeSnapshot,
  projection,
  currentUiModel,
  actions,
  onProjectionAction,
  resourceProposals = [],
  onOpenResourceProposalSource,
  onConfirmResourceProposal,
  onRejectResourceProposal,
  confirmingResourceProposalId = "",
  rejectingResourceProposalId = "",
  followUp,
  onFollowUpAction,
  executingFollowUpAction = false,
  runtimeHardBlocked = false,
  runtimeBlockedReason = null,
  overrideModel,
  onOverrideModelChange,
  onRetryWithOverrideModel,
  retryWithOverrideModelPending = false,
  canRetryWithOverrideModel = false,
  onRetryWithTaskModel,
  retryWithTaskModelPending = false,
  capabilities,
  onOpenFullTaskCenter,
}: NovelTaskDrawerState) {
  const { t } = useTranslation("novelsEditC");
  const milestones = Array.isArray(task?.meta.milestones)
    ? task.meta.milestones as NovelWorkflowMilestone[]
    : [];
  const displayState = snapshot?.displayState ?? null;
  const dashboardView = snapshot?.dashboardView ?? null;
  const projectedProgressPercent = dashboardView?.progressPercent
    ?? displayState?.progressPercent
    ?? projection?.runtimeProjection?.progressBreakdown?.totalPercent;
  const workflowProgressFraction = typeof task?.progress === "number" && Number.isFinite(task.progress)
    ? task.progress
    : null;
  const progressPercent = Math.max(0, Math.min(100, Math.round(
    workflowProgressFraction !== null
      ? workflowProgressFraction * 100
      : typeof projectedProgressPercent === "number"
        ? projectedProgressPercent
        : 0,
  )));
  const tokenUsage = task?.tokenUsage ?? null;
  const primaryAction = projection?.primaryAction ?? null;
  const primaryActionLabel = (
    (primaryAction?.type === "continue" || primaryAction?.type === "auto_execute_range")
    && projection?.displayState === "needs_confirmation"
  )
    ? t("taskDrawer.confirmAndContinue")
    : primaryAction?.label;
  const runProjectedAction = (action: DirectorBookAutomationAction) => {
    const matchedAction = actions.find((item) => {
      if (item.label === action.label) {
        return true;
      }
      if (action.type === "continue") {
        return item.label.includes("继续");
      }
      if (action.type === "auto_execute_range") {
        return item.label.includes("自动执行");
      }
      if (action.type === "confirm_candidate") {
        return item.label.includes("书级方向");
      }
      if (action.type === "open_quality_repair") {
        return item.label.includes("质量修复");
      }
      if (action.type === "open_chapter") {
        return item.label.includes("章节执行");
      }
      return false;
    });
    matchedAction?.onClick();
  };
  const handleProjectionAction = (action: DirectorBookAutomationAction) => {
    if (onProjectionAction) {
      onProjectionAction(action);
      return;
    }
    runProjectedAction(action);
  };
  const canShowRuntimePolicy = capabilities?.canAdjustRuntimePolicy !== false && Boolean(task?.id && runtimeSnapshot);
  const canShowManualImpact = capabilities?.canInspectManualEditImpact !== false && Boolean(task);
  const canShowRetryWithOverrideModel = capabilities?.canRetryWithOverrideModel === true;
  const canShowFollowUp = capabilities?.availableFollowUps !== false && Boolean(followUp);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-0 top-0 flex h-dvh max-h-dvh w-full max-w-[520px] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-y-0 border-r-0 border-l bg-background p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>{t("common.executionDetails")}</DialogTitle>
          <DialogDescription>
            {t("taskDrawer.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {task || projection ? (
            <AICockpit
              projection={projection}
              mode="focusedNovel"
              fallbackSummary={dashboardView?.currentAction || displayState?.currentAction || task?.blockingReason || task?.currentItemLabel || t("taskDrawer.noActionNeeded")}
              fallbackStatusLabel={dashboardView?.statusLabel ?? (task ? formatTaskStatus(t, task) : t("taskDrawer.notStarted"))}
              showDetailsAction={false}
              onAction={(_projection, action) => handleProjectionAction(action)}
            />
          ) : null}

          {resourceProposals.length > 0 ? (
            <section className="space-y-3 rounded-2xl border border-amber-300/60 bg-amber-50/40 p-4 dark:border-amber-700/50 dark:bg-amber-950/15">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-foreground">{t("taskDrawer.resourceChangePending")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("taskDrawer.resourceChangeDesc")}
                  </div>
                </div>
                <Badge variant="secondary">{t("taskDrawer.itemCount", { count: resourceProposals.length })}</Badge>
              </div>
              <div className="space-y-2">
                {resourceProposals.slice(0, 4).map((proposal) => (
                  <ResourceProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onOpenSource={onOpenResourceProposalSource}
                    onConfirm={onConfirmResourceProposal}
                    onReject={onRejectResourceProposal}
                    confirmingProposalId={confirmingResourceProposalId}
                    rejectingProposalId={rejectingResourceProposalId}
                  />
                ))}
              </div>
              {resourceProposals.length > 4 ? (
                <div className="text-xs text-muted-foreground">
                  {t("taskDrawer.moreResourceChanges", { count: resourceProposals.length - 4 })}
                </div>
              ) : null}
            </section>
          ) : null}

          {task ? (
            <>
              <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/15 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold text-foreground">{task.title}</div>
                  <Badge variant={toTaskStatusVariant(task)}>{formatTaskStatus(t, task)}</Badge>
                  <Badge variant="outline">{t("taskDrawer.progressBadge", { value: progressPercent })}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("taskDrawer.currentStage")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{dashboardView?.stageLabel ?? displayState?.stageLabel ?? task.currentStage ?? t("common.none")}</div>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("taskDrawer.currentAction")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{dashboardView?.currentAction ?? displayState?.currentAction ?? task.currentItemLabel ?? t("common.none")}</div>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("taskDrawer.latestCheckpoint")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{displayState?.checkpointLabel ?? formatCheckpoint(t, task.checkpointType, task.executionScopeLabel)}</div>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("taskDrawer.latestHeartbeat")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{formatDate(t, task.heartbeatAt)}</div>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                {task.checkpointSummary ? (
                  <div className="rounded-xl border bg-background/80 p-3 text-sm text-muted-foreground">
                    {task.checkpointSummary}
                  </div>
                ) : null}
                {task.lastError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <div className="font-medium">{t("taskDrawer.latestError")}</div>
                    <div className="mt-1">{task.lastError}</div>
                    {task.recoveryHint ? (
                      <div className="mt-2 text-xs text-destructive/80">{t("taskDrawer.recoveryHint", { value: task.recoveryHint })}</div>
                    ) : null}
                  </div>
                ) : null}
              </section>

              {canShowFollowUp && followUp ? (
                <section className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-foreground">{t("taskDrawer.actionNeeded")}</div>
                    <Badge variant="outline">{followUp.reasonLabel}</Badge>
                    <Badge variant={followUp.priority === "P0" ? "destructive" : "secondary"}>
                      {formatFollowUpPriority(t, followUp.priority)}
                    </Badge>
                  </div>
                  <div className="text-sm leading-6 text-muted-foreground">{followUp.followUpSummary}</div>
                  {followUp.blockingReason ? (
                    <div className="text-sm text-muted-foreground">{t("taskDrawer.blockingReasonLine", { value: followUp.blockingReason })}</div>
                  ) : null}
                  {followUp.currentModel ? (
                    <div className="text-sm text-muted-foreground">{t("taskDrawer.currentTaskModelLine", { value: followUp.currentModel })}</div>
                  ) : null}
                  {runtimeHardBlocked && runtimeBlockedReason ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {runtimeBlockedReason}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {followUp.availableActions.map((action) => (
                      <Button
                        key={action.code}
                        type="button"
                        size="sm"
                        variant={followUpActionVariant(action)}
                        onClick={() => onFollowUpAction?.(action)}
                        disabled={executingFollowUpAction || (runtimeHardBlocked && action.kind !== "navigation")}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </section>
              ) : null}

              {canShowRuntimePolicy && task ? (
                <section className="space-y-3">
                  <div className="text-sm font-medium text-foreground">{t("taskDrawer.runtimePolicy")}</div>
                  <TaskCenterRuntimePolicyCard taskId={task.id} snapshot={runtimeSnapshot} />
                </section>
              ) : null}

              {canShowManualImpact && task ? (
                <section className="space-y-3">
                  <div className="text-sm font-medium text-foreground">{t("taskDrawer.riskAndImpact")}</div>
                  <TaskCenterManualEditImpactCard task={task} />
                </section>
              ) : null}

              {canShowRetryWithOverrideModel && overrideModel && onOverrideModelChange ? (
                <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/15 p-4">
                  <div className="text-sm font-medium text-foreground">{t("taskDrawer.retryWithOtherModel")}</div>
                  <LLMSelector
                    value={overrideModel}
                    onChange={onOverrideModelChange}
                    compact
                    showBadge={false}
                    showHelperText={false}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={onRetryWithOverrideModel}
                      disabled={retryWithOverrideModelPending || !canRetryWithOverrideModel}
                    >
                      {retryWithOverrideModelPending ? t("taskDrawer.retrying") : t("taskDrawer.retryWithSelectedModel")}
                    </Button>
                    {onRetryWithTaskModel ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onRetryWithTaskModel}
                        disabled={retryWithTaskModelPending}
                      >
                        {retryWithTaskModelPending ? t("taskDrawer.retrying") : t("taskDrawer.retryWithOriginalModel")}
                      </Button>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("taskDrawer.quickActions")}</div>
                {actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <Button
                        key={action.label}
                        type="button"
                        size="sm"
                        variant={action.variant ?? "default"}
                        disabled={action.disabled}
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    {t("taskDrawer.noQuickActions")}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("taskDrawer.modelInfo")}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("taskDrawer.taskBoundModel")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {task.provider ?? t("common.none")} / {task.model ?? t("common.none")}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs text-muted-foreground">{t("taskDrawer.currentUiModel")}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                      {currentUiModel.provider} / {currentUiModel.model}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("taskDrawer.currentTemperature", { value: currentUiModel.temperature })}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("taskDrawer.tokenStats")}</div>
                {tokenUsage ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs text-muted-foreground">{t("taskDrawer.callCount")}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.llmCallCount)}</div>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs text-muted-foreground">{t("taskDrawer.totalTokens")}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.totalTokens)}</div>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs text-muted-foreground">{t("taskDrawer.promptTokens")}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.promptTokens)}</div>
                    </div>
                    <div className="rounded-xl border bg-background/80 p-3">
                      <div className="text-xs text-muted-foreground">{t("taskDrawer.completionTokens")}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{formatTokenCount(tokenUsage.completionTokens)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("taskDrawer.lastRecorded", { value: formatDate(t, tokenUsage.lastRecordedAt) })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    {t("taskDrawer.noTokenUsage")}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("taskDrawer.stepStatusTitle")}</div>
                <div className="space-y-2">
                  {(displayState?.steps ?? task.steps).map((step) => (
                    <div key={step.key} className="flex items-center justify-between rounded-xl border bg-background/80 px-3 py-2">
                      <div className="text-sm text-foreground">{step.label}</div>
                      <Badge variant="outline">{"isCurrent" in step
                        ? (step.status === "attention"
                          ? t("taskDrawer.dashStep.attention")
                          : step.status === "running"
                            ? t("taskDrawer.dashStep.running")
                            : step.status === "completed"
                              ? t("taskDrawer.dashStep.completed")
                              : t("taskDrawer.dashStep.pending"))
                        : formatStepStatus(t, step.status)}</Badge>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-sm font-medium text-foreground">{t("taskDrawer.milestoneHistory")}</div>
                {milestones.length > 0 ? (
                  <div className="space-y-2">
                    {milestones
                      .slice()
                      .reverse()
                      .map((milestone) => (
                        <div key={`${milestone.checkpointType}:${milestone.createdAt}`} className="rounded-xl border bg-background/80 p-3">
                          <div className="font-medium text-foreground">{formatCheckpoint(t, milestone.checkpointType)}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{milestone.summary}</div>
                          <div className="mt-2 text-xs text-muted-foreground">{t("taskDrawer.recordedAt", { value: formatDate(t, milestone.createdAt) })}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    {t("taskDrawer.noMilestones")}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-dashed px-5 py-8 text-sm text-muted-foreground">
              {t("taskDrawer.noVisibleTask")}
            </section>
          )}
        </div>

        <div className="space-y-2 border-t border-border/70 px-5 py-4">
          {primaryAction ? (
            <Button type="button" className="w-full" onClick={() => handleProjectionAction(primaryAction)}>
              {primaryActionLabel || t("taskDrawer.continueHandle")}
            </Button>
          ) : null}
          {task?.sourceRoute ? (
            <Button asChild type="button" variant="outline" className="w-full">
              <Link to={task.sourceRoute}>{t("taskDrawer.openSourcePage")}</Link>
            </Button>
          ) : null}
          <Button type="button" variant={primaryAction ? "ghost" : "outline"} className="w-full" onClick={onOpenFullTaskCenter}>
            {t("taskDrawer.openTaskCenter")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

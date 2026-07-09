import type { SSEFrame } from "@ai-novel/shared/types/api";
import type {
  AuditReport,
  Chapter,
  StoryStateSnapshot,
} from "@ai-novel/shared/types/novel";
import type { ChapterRuntimePackage } from "@ai-novel/shared/types/chapterRuntime";
import { parseChapterScenePlan } from "@ai-novel/shared/types/chapterLengthControl";
import {
  classifyChapterQualityLoopRisk,
  hasContinuableChapterQualityLoopRiskFlags,
} from "@ai-novel/shared/types/chapterQualityLoop";
import { Link } from "react-router-dom";
import AiButton from "@/components/common/AiButton";
import AiActionLabel from "@/components/common/AiActionLabel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import i18n from "@/i18n";

export type AssetTabKey = "content" | "taskSheet" | "sceneCards" | "quality" | "repair";
export type QueueFilterKey = "all" | "setup" | "draft" | "review" | "completed";
export type ChapterExecutionFlowStageKey =
  | "execution_plan"
  | "writing"
  | "review"
  | "repair"
  | "state_sync"
  | "payoff_sync"
  | "ready";
export type ChapterExecutionFlowStageStatus = "not_started" | "in_progress" | "done";
export type ChapterExecutionBackgroundActivityKind = "character_dynamics" | "state_snapshot" | "payoff_ledger" | "character_resources";
export type ChapterExecutionBackgroundActivityStatus = "running" | "failed";

export interface ChapterExecutionBackgroundActivity {
  kind: ChapterExecutionBackgroundActivityKind;
  status: ChapterExecutionBackgroundActivityStatus;
  chapterId: string;
  chapterOrder?: number;
  chapterTitle?: string;
  updatedAt: string;
  error?: string | null;
}

export type PrimaryAction = {
  label: string;
  reason: string;
  variant: "default" | "secondary" | "outline";
  ai?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
};

export type QueueFilterOption = {
  key: QueueFilterKey;
  label: string;
  count: number;
};

export interface ChapterExecutionFlowStage {
  key: ChapterExecutionFlowStageKey;
  label: string;
  status: ChapterExecutionFlowStageStatus;
}

interface ResolveChapterExecutionFlowInput {
  selectedChapter: Chapter | undefined;
  chapterAuditReports: AuditReport[];
  chapterRuntimePackage?: ChapterRuntimePackage | null;
  chapterStateSnapshot?: StoryStateSnapshot | null;
  latestStateSnapshot?: StoryStateSnapshot | null;
  chapterRunStatus?: Extract<SSEFrame, { type: "run_status" }> | null;
  repairRunStatus?: Extract<SSEFrame, { type: "run_status" }> | null;
  isStreaming?: boolean;
  streamingChapterId?: string | null;
  isRepairStreaming?: boolean;
  repairStreamingChapterId?: string | null;
  isRunningFullAudit?: boolean;
  backgroundActivities?: ChapterExecutionBackgroundActivity[] | null;
}

const CHAPTER_EXECUTION_FLOW_ORDER: Array<{ key: ChapterExecutionFlowStageKey; labelKey: string }> = [
  { key: "execution_plan", labelKey: "flow.stage.executionPlan" },
  { key: "writing", labelKey: "flow.stage.writing" },
  { key: "review", labelKey: "flow.stage.review" },
  { key: "repair", labelKey: "flow.stage.repair" },
  { key: "state_sync", labelKey: "flow.stage.stateSync" },
  { key: "payoff_sync", labelKey: "flow.stage.payoffSync" },
  { key: "ready", labelKey: "flow.stage.ready" },
];

function hasOpenAuditIssues(reports: AuditReport[]): boolean {
  return reports.some((report) => report.issues.some((issue) => issue.status === "open"));
}

function hasBackgroundActivity(
  activities: ChapterExecutionBackgroundActivity[] | null | undefined,
  kind: ChapterExecutionBackgroundActivity["kind"],
  chapterId: string,
): boolean {
  return (activities ?? []).some((item) => item.kind === kind && item.status === "running" && item.chapterId === chapterId);
}

function hasRuntimeLedgerData(runtimePackage: ChapterRuntimePackage | null | undefined): boolean {
  if (!runtimePackage) {
    return false;
  }
  const context = runtimePackage.context;
  return Boolean(
    context.ledgerSummary
    || context.ledgerPendingItems.length > 0
    || context.ledgerUrgentItems.length > 0
    || context.ledgerOverdueItems.length > 0,
  );
}

function hasRuntimeResourceData(runtimePackage: ChapterRuntimePackage | null | undefined): boolean {
  const context = runtimePackage?.context.characterResourceContext;
  return Boolean(
    context
    && (
      context.availableItems.length > 0
      || context.setupNeededItems.length > 0
      || context.blockedItems.length > 0
      || context.highRiskCommittedItems.length > 0
      || context.pendingProposalItems.length > 0
      || context.riskSignals.length > 0
    ),
  );
}

function buildCurrentStageNote(stage: ChapterExecutionFlowStage): string {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  switch (stage.key) {
    case "execution_plan":
      return stage.status === "done"
        ? tr("flow.note.executionPlanDone")
        : tr("flow.note.executionPlanTodo");
    case "writing":
      return stage.status === "in_progress"
        ? tr("flow.note.writingInProgress")
        : tr("flow.note.writingTodo");
    case "review":
      return stage.status === "in_progress"
        ? tr("flow.note.reviewInProgress")
        : tr("flow.note.reviewTodo");
    case "repair":
      return stage.status === "in_progress"
        ? tr("flow.note.repairInProgress")
        : tr("flow.note.repairTodo");
    case "state_sync":
      return stage.status === "in_progress"
        ? tr("flow.note.stateSyncInProgress")
        : tr("flow.note.stateSyncTodo");
    case "payoff_sync":
      return stage.status === "in_progress"
        ? tr("flow.note.payoffSyncInProgress")
        : tr("flow.note.payoffSyncTodo");
    case "ready":
    default:
      return stage.status === "done"
        ? tr("flow.note.readyDone")
        : stage.status === "in_progress"
          ? tr("flow.note.readyInProgress")
          : tr("flow.note.readyTodo");
  }
}

export function resolveChapterExecutionFlow(input: ResolveChapterExecutionFlowInput): {
  stages: ChapterExecutionFlowStage[];
  currentStage: ChapterExecutionFlowStage & { note: string };
} {
  const chapter = input.selectedChapter;
  const chapterId = chapter?.id ?? "";
  const isCurrentChapterWriting = Boolean(
    chapter && input.isStreaming && input.streamingChapterId === chapter.id,
  );
  const isCurrentChapterRepairing = Boolean(
    chapter && input.isRepairStreaming && input.repairStreamingChapterId === chapter.id,
  );
  const currentStateSnapshot = input.chapterRuntimePackage?.context.stateSnapshot
    ?? input.chapterStateSnapshot
    ?? (input.latestStateSnapshot?.sourceChapterId === chapterId ? input.latestStateSnapshot : null);

  const stages: ChapterExecutionFlowStage[] = CHAPTER_EXECUTION_FLOW_ORDER.map(({ key, labelKey }) => {
    const label = i18n.t(labelKey, { ns: "novelsEditA" });
    if (!chapter) {
      return {
        key,
        label,
        status: "not_started",
      };
    }

    switch (key) {
      case "execution_plan":
        return {
          key,
          label,
          status: chapter.taskSheet?.trim() || chapter.sceneCards?.trim()
            ? "done"
            : "not_started",
        };
      case "writing":
        return {
          key,
          label,
          status: isCurrentChapterWriting || chapter.chapterStatus === "generating"
            ? "in_progress"
            : chapter.content?.trim()
              ? "done"
              : "not_started",
        };
      case "review":
        return {
          key,
          label,
          status: (input.isRunningFullAudit || (isCurrentChapterWriting && input.chapterRunStatus?.phase === "finalizing"))
            ? "in_progress"
            : (input.chapterAuditReports.length > 0 || chapter.generationState === "reviewed" || chapter.generationState === "approved" || chapter.generationState === "published")
              ? "done"
              : "not_started",
        };
      case "repair":
        return {
          key,
          label,
          status: isCurrentChapterRepairing
            ? "in_progress"
            : (chapter.generationState === "repaired" || Boolean(chapter.repairHistory?.trim()))
              ? "done"
              : "not_started",
        };
      case "state_sync":
        return {
          key,
          label,
          status: hasBackgroundActivity(input.backgroundActivities, "state_snapshot", chapterId)
            || hasBackgroundActivity(input.backgroundActivities, "character_resources", chapterId)
            ? "in_progress"
            : (currentStateSnapshot || hasRuntimeResourceData(input.chapterRuntimePackage))
              ? "done"
              : "not_started",
        };
      case "payoff_sync":
        return {
          key,
          label,
          status: hasBackgroundActivity(input.backgroundActivities, "payoff_ledger", chapterId)
            ? "in_progress"
            : (hasRuntimeLedgerData(input.chapterRuntimePackage) || Boolean(currentStateSnapshot?.foreshadowStates?.length))
              ? "done"
              : "not_started",
        };
      case "ready":
      default:
        return {
          key,
          label,
          status: chapter.chapterStatus === "completed" || chapter.generationState === "approved" || chapter.generationState === "published"
            ? "done"
            : chapter.chapterStatus === "pending_review" && !hasOpenAuditIssues(input.chapterAuditReports)
              ? "in_progress"
              : "not_started",
        };
    }
  });

  const currentStage = stages.find((stage) => stage.status === "in_progress")
    ?? stages.find((stage) => stage.status === "not_started")
    ?? stages[stages.length - 1]!;

  return {
    stages,
    currentStage: {
      ...currentStage,
      note: buildCurrentStageNote(currentStage),
    },
  };
}

export function resolveDisplayedChapterStatus(chapter: Chapter): Chapter["chapterStatus"] | null | undefined {
  const status = chapter.chapterStatus;
  if (!hasText(chapter.content)) {
    return status;
  }
  if (chapter.generationState === "approved" || chapter.generationState === "published") {
    return "completed";
  }
  if (
    chapterHasContinuableQualityLoop(chapter)
    && (chapter.generationState === "reviewed" || chapter.generationState === "repaired")
  ) {
    return "pending_review";
  }
  if (status === "generating" && (chapter.generationState === "reviewed" || chapter.generationState === "repaired")) {
    return "pending_review";
  }
  if (status === "needs_repair" && chapterHasContinuableQualityLoop(chapter)) {
    return "pending_review";
  }
  if (status === "pending_generation") {
    return "pending_review";
  }
  return status;
}

export function chapterStatusLabel(status?: Chapter["chapterStatus"] | null): string {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  switch (status) {
    case "unplanned":
      return tr("chapterStatus.unplanned");
    case "pending_generation":
      return tr("chapterStatus.pendingGeneration");
    case "generating":
      return tr("chapterStatus.generating");
    case "pending_review":
      return tr("chapterStatus.pendingReview");
    case "needs_repair":
      return tr("chapterStatus.needsRepair");
    case "completed":
      return tr("chapterStatus.completed");
    default:
      return tr("chapterStatus.unset");
  }
}

export function chapterStatusDescription(status?: Chapter["chapterStatus"] | null): string {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  switch (status) {
    case "unplanned":
      return tr("chapterStatusDesc.unplanned");
    case "pending_generation":
      return tr("chapterStatusDesc.pendingGeneration");
    case "generating":
      return tr("chapterStatusDesc.generating");
    case "pending_review":
      return tr("chapterStatusDesc.pendingReview");
    case "needs_repair":
      return tr("chapterStatusDesc.needsRepair");
    case "completed":
      return tr("chapterStatusDesc.completed");
    default:
      return tr("chapterStatusDesc.unset");
  }
}

export function generationStateLabel(state?: Chapter["generationState"] | null): string {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  switch (state) {
    case "planned":
      return tr("generationState.planned");
    case "drafted":
      return tr("generationState.drafted");
    case "reviewed":
      return tr("generationState.reviewed");
    case "repaired":
      return tr("generationState.repaired");
    case "approved":
      return tr("generationState.approved");
    case "published":
      return tr("generationState.published");
    default:
      return "";
  }
}

export function generationStateDescription(state?: Chapter["generationState"] | null): string {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  switch (state) {
    case "planned":
      return tr("generationStateDesc.planned");
    case "drafted":
      return tr("generationStateDesc.drafted");
    case "reviewed":
      return tr("generationStateDesc.reviewed");
    case "repaired":
      return tr("generationStateDesc.repaired");
    case "approved":
      return tr("generationStateDesc.approved");
    case "published":
      return tr("generationStateDesc.published");
    default:
      return "";
  }
}

export function shouldShowGenerationStateBadge(state?: Chapter["generationState"] | null): boolean {
  return Boolean(state && state !== "planned");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringifyRiskLabel(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function qualityLoopActionLabel(value: unknown): string | null {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  switch (value) {
    case "continue":
      return tr("qualityLoop.action.continue");
    case "patch_repair":
      return tr("qualityLoop.action.patchRepair");
    case "replan":
      return tr("qualityLoop.action.replan");
    case "manual_gate":
      return tr("qualityLoop.action.manualGate");
    default:
      return null;
  }
}

function qualityLoopStatusLabel(value: unknown): string | null {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  switch (value) {
    case "risk":
      return tr("qualityLoop.status.risk");
    case "invalid":
      return tr("qualityLoop.status.invalid");
    case "missing":
      return tr("qualityLoop.status.missing");
    default:
      return null;
  }
}

function qualityLoopArtifactLabel(value: unknown): string | null {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  switch (value) {
    case "chapter_retention_contract":
      return tr("qualityLoop.artifact.retention");
    case "continuity_state":
      return tr("qualityLoop.artifact.continuity");
    case "rolling_window_review":
      return tr("qualityLoop.artifact.rollingWindow");
    case "prose_quality":
      return tr("qualityLoop.artifact.proseQuality");
    default:
      return null;
  }
}

function parseStructuredRiskFlagsObject(input: string): Record<string, unknown> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return null;
  }
  return isRecord(parsed) ? parsed : null;
}

export function chapterHasContinuableQualityLoop(chapter: Pick<Chapter, "riskFlags">): boolean {
  return hasContinuableChapterQualityLoopRiskFlags(chapter.riskFlags);
}

function parseStructuredRiskFlags(input: string): string[] | null {
  const parsed = parseStructuredRiskFlagsObject(input);
  if (!parsed) return null;
  const labels: string[] = [];
  const qualityLoop = parsed.qualityLoop;
  if (isRecord(qualityLoop)) {
    const qualityLoopRisk = classifyChapterQualityLoopRisk(qualityLoop);
    if (qualityLoopRisk === "non_blocking_quality_debt") {
      labels.push(i18n.t("qualityLoop.debtRecorded", { ns: "novelsEditA" }));
    } else {
      const actionLabel = qualityLoopActionLabel(qualityLoop.recommendedAction);
      const statusLabel = qualityLoopStatusLabel(qualityLoop.overallStatus);
      if (actionLabel) labels.push(actionLabel);
      if (statusLabel) labels.push(statusLabel);
    }
    const signals = Array.isArray(qualityLoop.signals) ? qualityLoop.signals : [];
    signals.forEach((signal) => {
      if (!isRecord(signal) || signal.status === "valid") {
        return;
      }
      const label = qualityLoopArtifactLabel(signal.artifactType);
      if (label) {
        labels.push(label);
      }
    });
  }
  const extraLabels = Object.entries(parsed)
    .filter(([key]) => key !== "qualityLoop")
    .flatMap(([, value]) => Array.isArray(value) ? value : [value])
    .map(stringifyRiskLabel)
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set([...labels, ...extraLabels])).slice(0, 4);
}

export function parseRiskFlags(input: string | null | undefined): string[] {
  if (!input?.trim()) {
    return [];
  }
  const structured = parseStructuredRiskFlags(input.trim());
  if (structured) {
    return structured;
  }
  return input
    .split(/[\n,，;；|]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 4);
}

export function hasText(input: string | null | undefined): boolean {
  return Boolean(input?.trim());
}

export function chapterHasPreparationAssets(chapter: Chapter): boolean {
  return hasText(chapter.expectation) || hasText(chapter.taskSheet) || hasText(chapter.sceneCards);
}

export function parseChapterScenePlanForDisplay(chapter: Chapter) {
  return parseChapterScenePlan(chapter.sceneCards, {
    targetWordCount: chapter.targetWordCount ?? undefined,
  });
}

export function resolveChapterQueuePreview(chapter: Chapter): string {
  if (hasText(chapter.expectation)) {
    return chapter.expectation!.trim();
  }
  if (hasText(chapter.taskSheet)) {
    return chapter.taskSheet!.trim();
  }
  const scenePlan = parseChapterScenePlanForDisplay(chapter);
  if (scenePlan) {
    const firstScene = scenePlan.scenes[0];
    return firstScene
      ? `${firstScene.title} · ${firstScene.purpose}`
      : i18n.t("queuePreview.sceneBudgetGenerated", { ns: "novelsEditA" });
  }
  if (hasText(chapter.sceneCards)) {
    return i18n.t("queuePreview.oldSceneCards", { ns: "novelsEditA" });
  }
  return i18n.t("queuePreview.noObjective", { ns: "novelsEditA" });
}

export function chapterSuggestedActionLabel(chapter: Chapter): string {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  if (chapterHasContinuableQualityLoop(chapter)) {
    return hasText(chapter.content) ? tr("suggestedAction.nextChapter") : tr("suggestedAction.write");
  }
  const status = resolveDisplayedChapterStatus(chapter);
  if (status === "generating") return tr("suggestedAction.waitGeneration");
  if (status === "needs_repair") return tr("suggestedAction.quickRepair");
  if (status === "pending_review") {
    return chapter.generationState === "reviewed" || chapter.generationState === "approved"
      ? tr("suggestedAction.viewSuggestions")
      : tr("suggestedAction.runReview");
  }
  if (status === "completed") return tr("suggestedAction.continuePolish");
  if (status === "unplanned" || !chapterHasPreparationAssets(chapter)) return tr("suggestedAction.addPlan");
  if (!hasText(chapter.content) || status === "pending_generation") return tr("suggestedAction.write");
  if (chapter.generationState === "drafted") return tr("suggestedAction.runReview");
  return tr("suggestedAction.openEditor");
}

export function chapterMatchesQueueFilter(chapter: Chapter, filter: QueueFilterKey): boolean {
  const status = resolveDisplayedChapterStatus(chapter);
  if (filter === "all") return true;
  if (filter === "completed") {
    return status === "completed"
      || chapter.generationState === "approved"
      || chapter.generationState === "published";
  }
  if (filter === "review") {
    return status === "pending_review"
      || status === "needs_repair"
      || chapter.generationState === "drafted"
      || chapter.generationState === "reviewed";
  }
  if (filter === "setup") {
    return status === "unplanned" || (!chapterHasPreparationAssets(chapter) && !hasText(chapter.content));
  }
  if (filter === "draft") {
    return status === "pending_generation"
      || status === "generating"
      || (!hasText(chapter.content) && status !== "unplanned");
  }
  return true;
}

export function MetricBadge(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{props.label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{props.value}</div>
      {props.hint ? <div className="mt-1 text-[11px] text-muted-foreground">{props.hint}</div> : null}
    </div>
  );
}

export function RiskBadgeList(props: { risks: string[] }) {
  if (props.risks.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {props.risks.map((risk) => <Badge key={risk} variant="secondary">{risk}</Badge>)}
    </div>
  );
}

export function PrimaryActionButton(props: { action: PrimaryAction | null; className?: string }) {
  const { action, className } = props;
  if (!action) {
    return null;
  }
  if (action.href) {
    return (
      <Button asChild size="sm" variant={action.variant} className={className}>
        <Link to={action.href}>
          {action.ai ? <AiActionLabel>{action.label}</AiActionLabel> : action.label}
        </Link>
      </Button>
    );
  }
  return (
    action.ai ? (
      <AiButton size="sm" variant={action.variant} className={className} onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </AiButton>
    ) : (
      <Button size="sm" variant={action.variant} className={className} onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </Button>
    )
  );
}

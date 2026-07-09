import type {
  AutoDirectorAction,
} from "@ai-novel/shared/types/autoDirectorFollowUp";
import type { TaskKind, TaskStatus } from "@ai-novel/shared/types/task";
import type {
  NovelWorkflowMilestoneType,
  NovelWorkflowResumeTarget,
} from "@ai-novel/shared/types/novelWorkflow";
import i18n from "@/i18n";

export const ACTIVE_STATUSES = new Set<TaskStatus>(["queued", "running", "waiting_approval"]);
export const ANOMALY_STATUSES = new Set<TaskStatus>(["failed", "cancelled"]);
export const ARCHIVABLE_STATUSES = new Set<TaskStatus>(["succeeded", "failed", "cancelled"]);

export type TaskSortMode = "default" | "updated_desc" | "updated_asc" | "heartbeat_desc" | "heartbeat_asc";

export function getTaskListPriority(status: TaskStatus): number {
  return status === "failed" ? 0 : 1;
}

export function getTimestamp(value: string | null | undefined): number {
  if (!value) {
    return Number.NaN;
  }
  return new Date(value).getTime();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return i18n.t("common.none", { ns: "tasks" });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return i18n.t("common.none", { ns: "tasks" });
  }
  return date.toLocaleString();
}

export function formatTokenCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.round(value ?? 0)));
}

export function formatKind(kind: TaskKind): string {
  if (kind === "book_analysis") {
    return i18n.t("kind.bookAnalysis", { ns: "tasks" });
  }
  if (kind === "novel_workflow") {
    return i18n.t("kind.novelWorkflow", { ns: "tasks" });
  }
  if (kind === "novel_pipeline") {
    return i18n.t("kind.novelPipeline", { ns: "tasks" });
  }
  if (kind === "knowledge_document") {
    return i18n.t("kind.knowledgeDocument", { ns: "tasks" });
  }
  if (kind === "style_extraction") {
    return i18n.t("kind.styleExtraction", { ns: "tasks" });
  }
  if (kind === "agent_run") {
    return i18n.t("kind.agentRun", { ns: "tasks" });
  }
  return i18n.t("kind.imageGeneration", { ns: "tasks" });
}

export function formatCheckpoint(checkpoint: NovelWorkflowMilestoneType | null | undefined, scopeLabel?: string | null): string {
  const resolvedScopeLabel = scopeLabel?.trim() || i18n.t("checkpoint.defaultScope", { ns: "tasks" });
  if (checkpoint === "rewrite_snapshot_created") {
    return i18n.t("checkpoint.rewriteSnapshotCreated", { ns: "tasks" });
  }
  if (checkpoint === "candidate_selection_required") {
    return i18n.t("checkpoint.candidateSelectionRequired", { ns: "tasks" });
  }
  if (checkpoint === "book_contract_ready") {
    return i18n.t("checkpoint.bookContractReady", { ns: "tasks" });
  }
  if (checkpoint === "character_setup_required") {
    return i18n.t("checkpoint.characterSetupRequired", { ns: "tasks" });
  }
  if (checkpoint === "volume_strategy_ready") {
    return i18n.t("checkpoint.volumeStrategyReady", { ns: "tasks" });
  }
  if (checkpoint === "chapter_batch_ready") {
    return i18n.t("checkpoint.chapterBatchReady", { ns: "tasks", scope: resolvedScopeLabel });
  }
  if (checkpoint === "replan_required") {
    return i18n.t("checkpoint.replanRequired", { ns: "tasks" });
  }
  if (checkpoint === "workflow_completed") {
    return i18n.t("checkpoint.workflowCompleted", { ns: "tasks" });
  }
  return i18n.t("common.none", { ns: "tasks" });
}

export function formatResumeTarget(target: NovelWorkflowResumeTarget | null | undefined): string {
  if (!target) {
    return i18n.t("common.none", { ns: "tasks" });
  }
  if (target.route === "/novels/create") {
    return target.mode === "director"
      ? i18n.t("resumeTarget.createDirector", { ns: "tasks" })
      : i18n.t("resumeTarget.create", { ns: "tasks" });
  }
  if (target.stage === "story_macro") {
    return i18n.t("resumeTarget.storyMacro", { ns: "tasks" });
  }
  if (target.stage === "character") {
    return i18n.t("resumeTarget.character", { ns: "tasks" });
  }
  if (target.stage === "outline") {
    return i18n.t("resumeTarget.outline", { ns: "tasks" });
  }
  if (target.stage === "structured") {
    return i18n.t("resumeTarget.structured", { ns: "tasks" });
  }
  if (target.stage === "chapter") {
    return i18n.t("resumeTarget.chapter", { ns: "tasks" });
  }
  if (target.stage === "pipeline") {
    return i18n.t("resumeTarget.pipeline", { ns: "tasks" });
  }
  return i18n.t("resumeTarget.default", { ns: "tasks" });
}

export function formatStatus(status: TaskStatus): string {
  if (status === "queued") {
    return i18n.t("status.queued", { ns: "tasks" });
  }
  if (status === "running") {
    return i18n.t("status.running", { ns: "tasks" });
  }
  if (status === "waiting_approval") {
    return i18n.t("status.waitingApproval", { ns: "tasks" });
  }
  if (status === "succeeded") {
    return i18n.t("status.succeeded", { ns: "tasks" });
  }
  if (status === "failed") {
    return i18n.t("status.failed", { ns: "tasks" });
  }
  return i18n.t("status.cancelled", { ns: "tasks" });
}

export function toStatusVariant(status: TaskStatus): "default" | "outline" | "secondary" | "destructive" {
  if (status === "running") {
    return "default";
  }
  if (status === "waiting_approval") {
    return "secondary";
  }
  if (status === "queued") {
    return "secondary";
  }
  if (status === "failed") {
    return "destructive";
  }
  return "outline";
}

export function serializeListParams(input: {
  kind: TaskKind | "";
  status: TaskStatus | "";
  keyword: string;
}): string {
  return JSON.stringify({
    kind: input.kind || null,
    status: input.status || null,
    keyword: input.keyword.trim() || null,
  });
}

export function createIdempotencyKey(taskId: string, actionCode: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${taskId}:${actionCode}:${globalThis.crypto.randomUUID()}`;
  }
  return `${taskId}:${actionCode}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export function formatFollowUpPriority(priority: "P0" | "P1" | "P2"): string {
  if (priority === "P0") {
    return i18n.t("followUpPriority.p0", { ns: "tasks" });
  }
  if (priority === "P1") {
    return i18n.t("followUpPriority.p1", { ns: "tasks" });
  }
  return i18n.t("followUpPriority.p2", { ns: "tasks" });
}

export function followUpActionVariant(action: AutoDirectorAction): "default" | "outline" {
  return action.kind === "navigation" || action.riskLevel !== "low" ? "outline" : "default";
}

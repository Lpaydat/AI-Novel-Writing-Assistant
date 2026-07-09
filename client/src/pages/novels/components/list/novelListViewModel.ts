import type {
  NovelAutoDirectorTaskSummary,
  ProjectProgressStatus,
} from "@ai-novel/shared/types/novel";
import type { NovelListResponse } from "@/api/novel/shared";
import i18n from "@/i18n";
import {
  canContinueChapterBatchAutoExecution,
  canContinueDirector,
  canEnterChapterExecution,
  getWorkflowDescription,
  isWorkflowRunningInBackground,
  requiresCandidateSelection,
} from "@/lib/novelWorkflowTaskUi";

export type NovelListItem = NovelListResponse["items"][number];
export type StatusFilter = "all" | "draft" | "published";
export type WritingModeFilter = "all" | "original" | "continuation";
export type NovelListTone = "neutral" | "info" | "success" | "warning" | "danger";

export const DIRECTOR_CREATE_LINK = "/novels/auto-director";
export const MANUAL_CREATE_LINK = "/novels/create";
export const NOVEL_LIST_PAGE_SIZE = 24;

export interface NovelListSummaryItem {
  id: string;
  /** `novelsList` translation key; resolve with `t(label)` at the render site. */
  label: string;
  value: number;
  tone: NovelListTone;
}

export interface WorkflowDisplay {
  tone: NovelListTone;
  label: string;
  description: string;
  progress: number;
  currentStage: string;
  currentAction: string;
  lastHealthyStage: string;
  running: boolean;
}

export function filterNovelList(input: {
  novels: NovelListItem[];
  status: StatusFilter;
  writingMode: WritingModeFilter;
}): NovelListItem[] {
  return input.novels.filter((item) => {
    if (input.status !== "all" && item.status !== input.status) {
      return false;
    }
    if (input.writingMode !== "all" && item.writingMode !== input.writingMode) {
      return false;
    }
    return true;
  });
}

export function formatProgressStatus(status?: ProjectProgressStatus | null): string {
  if (status === "completed") {
    return i18n.t("progressStatus.completed", { ns: "novelsList" });
  }
  if (status === "in_progress") {
    return i18n.t("progressStatus.inProgress", { ns: "novelsList" });
  }
  if (status === "rework") {
    return i18n.t("progressStatus.rework", { ns: "novelsList" });
  }
  if (status === "blocked") {
    return i18n.t("progressStatus.blocked", { ns: "novelsList" });
  }
  return i18n.t("progressStatus.notStarted", { ns: "novelsList" });
}

export function formatTokenCount(value?: number | null): string {
  const normalized = typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
  return new Intl.NumberFormat("zh-CN").format(normalized);
}

export function buildNovelListSummary(novels: NovelListItem[]): NovelListSummaryItem[] {
  const running = novels.filter((novel) => {
    const task = novel.latestAutoDirectorTask;
    return task?.status === "queued" || task?.status === "running";
  }).length;
  const waiting = novels.filter((novel) => novel.latestAutoDirectorTask?.status === "waiting_approval").length;
  const ready = novels.filter((novel) => canEnterChapterExecution(novel.latestAutoDirectorTask ?? null)).length;
  const issue = novels.filter((novel) => {
    const status = novel.latestAutoDirectorTask?.status;
    return status === "failed" || status === "cancelled";
  }).length;

  return [
    { id: "running", label: "summary.running", value: running, tone: running > 0 ? "info" : "neutral" },
    { id: "waiting", label: "summary.waiting", value: waiting, tone: waiting > 0 ? "warning" : "neutral" },
    { id: "ready", label: "summary.ready", value: ready, tone: ready > 0 ? "success" : "neutral" },
    { id: "issue", label: "summary.issue", value: issue, tone: issue > 0 ? "danger" : "neutral" },
  ];
}

export function getWorkflowTone(task?: NovelAutoDirectorTaskSummary | null): NovelListTone {
  if (!task) {
    return "neutral";
  }
  if (task.status === "failed" || task.status === "cancelled") {
    return "danger";
  }
  if (task.status === "waiting_approval") {
    return "warning";
  }
  if (canEnterChapterExecution(task)) {
    return "success";
  }
  if (task.status === "running" || task.status === "queued") {
    return "info";
  }
  return "neutral";
}

export function buildWorkflowDisplay(novel: NovelListItem): WorkflowDisplay {
  const task = novel.latestAutoDirectorTask ?? null;
  const description = getWorkflowDescription(task);
  if (!task) {
    return {
      tone: "neutral",
      label: i18n.t("workflow.materialProject", { ns: "novelsList" }),
      description: novel.description?.trim() || i18n.t("workflow.noTaskDescription", { ns: "novelsList" }),
      progress: 0,
      currentStage: i18n.t("workflow.stageNotEntered", { ns: "novelsList" }),
      currentAction: "",
      lastHealthyStage: "",
      running: false,
    };
  }
  const currentAction = task.currentItemLabel?.trim() || "";
  return {
    tone: getWorkflowTone(task),
    label: task.displayStatus?.trim() || task.resumeAction?.trim() || task.nextActionLabel?.trim() || i18n.t("workflow.autoDirector", { ns: "novelsList" }),
    description: description || i18n.t("workflow.retainedDescription", { ns: "novelsList" }),
    progress: Math.round(task.progress * 100),
    currentStage: task.currentStage ?? i18n.t("workflow.autoDirector", { ns: "novelsList" }),
    currentAction,
    lastHealthyStage: task.lastHealthyStage ?? "",
    running: isWorkflowRunningInBackground(task),
  };
}

export function getPrimaryActionLabel(novel: NovelListItem): string {
  const task = novel.latestAutoDirectorTask ?? null;
  if (canContinueChapterBatchAutoExecution(task)) {
    return (
      task?.resumeAction ??
      i18n.t("action.continueAutoExecute", {
        ns: "novelsList",
        scope: task?.executionScopeLabel ?? i18n.t("action.currentChapterRange", { ns: "novelsList" }),
      })
    );
  }
  if (canContinueDirector(task)) {
    return task?.resumeAction ?? i18n.t("action.continueDirector", { ns: "novelsList" });
  }
  if (requiresCandidateSelection(task)) {
    return task?.resumeAction ?? i18n.t("action.continueConfirmDirection", { ns: "novelsList" });
  }
  if (canEnterChapterExecution(task)) {
    return i18n.t("action.enterChapterExecution", { ns: "novelsList" });
  }
  if (task) {
    return i18n.t("action.viewProgress", { ns: "novelsList" });
  }
  return i18n.t("action.editNovel", { ns: "novelsList" });
}

export function getProjectAssetRows(novel: NovelListItem): Array<{
  label: string;
  value: string;
  tone?: NovelListTone;
}> {
  return [
    { label: i18n.t("asset.chapters", { ns: "novelsList" }), value: String(novel._count.chapters) },
    { label: i18n.t("asset.characters", { ns: "novelsList" }), value: String(novel._count.characters) },
    {
      label: i18n.t("asset.world", { ns: "novelsList" }),
      value: novel.world?.name ?? i18n.t("asset.unbound", { ns: "novelsList" }),
      tone: novel.world?.name ? "neutral" : "warning",
    },
    {
      label: i18n.t("asset.resource", { ns: "novelsList" }),
      value: `${novel.resourceReadyScore ?? 0}/100`,
      tone: (novel.resourceReadyScore ?? 0) >= 60 ? "success" : "warning",
    },
  ];
}

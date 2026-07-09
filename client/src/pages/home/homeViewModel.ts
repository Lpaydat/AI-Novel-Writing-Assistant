import type { TFunction } from "i18next";
import type { TaskOverviewSummary } from "@ai-novel/shared/types/task";
import i18n from "@/i18n";
import type { NovelListResponse } from "@/api/novel/shared";
import {
  canContinueChapterBatchAutoExecution,
  canContinueDirector,
  canEnterChapterExecution,
  getWorkflowDescription,
  isWorkflowActionRequired,
  isWorkflowRunningInBackground,
  requiresCandidateSelection,
} from "@/lib/novelWorkflowTaskUi";

export const HOME_NOVEL_FETCH_LIMIT = 12;
export const HOME_RECENT_LIMIT = 6;
export const DIRECTOR_CREATE_LINK = "/novels/auto-director";
export const MANUAL_CREATE_LINK = "/novels/create";

export type HomeNovelItem = NovelListResponse["items"][number];
export type HomeTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface HomeMetric {
  id: string;
  title: string;
  value: string | number;
  hint: string;
  tone: HomeTone;
}

export interface HomeAttentionItem {
  id: string;
  title: string;
  description: string;
  tone: HomeTone;
  to?: string;
  actionLabel?: string;
}

export interface HomeAssetHealthItem {
  id: string;
  title: string;
  value: string;
  description: string;
  tone: HomeTone;
}

export interface HomeNextAction {
  kind: "novel" | "starter";
  eyebrow: string;
  title: string;
  description: string;
  reason: string;
  tone: HomeTone;
}

export function formatHomeDate(value: string | undefined): string {
  if (!value) {
    return i18n.t("format.dateFallback", { ns: "homeDashboard" });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return i18n.t("format.dateFallback", { ns: "homeDashboard" });
  }
  return date.toLocaleString();
}

export function getNovelPriorityScore(novel: HomeNovelItem): number {
  const task = novel.latestAutoDirectorTask ?? null;
  if (canContinueChapterBatchAutoExecution(task)) {
    return 0;
  }
  if (requiresCandidateSelection(task)) {
    return 1;
  }
  if (canContinueDirector(task)) {
    return 2;
  }
  if (task?.status === "running" || task?.status === "queued") {
    return 3;
  }
  if (canEnterChapterExecution(task)) {
    return 4;
  }
  if (task?.status === "failed" || task?.status === "cancelled") {
    return 5;
  }
  return 6;
}

export function getNovelLeadSummary(novel: HomeNovelItem): string {
  const workflowDescription = getWorkflowDescription(novel.latestAutoDirectorTask ?? null);
  if (workflowDescription) {
    return workflowDescription;
  }
  if (novel.description?.trim()) {
    return novel.description.trim();
  }
  if (novel.world?.name) {
    return i18n.t("lead.boundWorld", { ns: "homeDashboard", worldName: novel.world.name });
  }
  return i18n.t("lead.empty", { ns: "homeDashboard" });
}

export function selectPrimaryNovel(novels: HomeNovelItem[]): HomeNovelItem | null {
  if (novels.length === 0) {
    return null;
  }
  return novels.reduce<HomeNovelItem | null>((selected, current) => {
    if (!selected) {
      return current;
    }
    const selectedPriority = getNovelPriorityScore(selected);
    const currentPriority = getNovelPriorityScore(current);
    return currentPriority < selectedPriority ? current : selected;
  }, null);
}

export function buildHomeNextAction(t: TFunction, primaryNovel: HomeNovelItem | null): HomeNextAction {
  if (!primaryNovel) {
    return {
      kind: "starter",
      eyebrow: t("nextAction.starter.eyebrow", { ns: "homeDashboard" }),
      title: t("nextAction.starter.title", { ns: "homeDashboard" }),
      description: t("nextAction.starter.description", { ns: "homeDashboard" }),
      reason: t("nextAction.starter.reason", { ns: "homeDashboard" }),
      tone: "info",
    };
  }

  const task = primaryNovel.latestAutoDirectorTask ?? null;
  if (canContinueChapterBatchAutoExecution(task)) {
    return {
      kind: "novel",
      eyebrow: t("nextAction.eyebrow.recommended", { ns: "homeDashboard" }),
      title: t("nextAction.resumeChapter.title", { ns: "homeDashboard", title: primaryNovel.title }),
      description: getNovelLeadSummary(primaryNovel),
      reason: t("nextAction.resumeChapter.reason", { ns: "homeDashboard" }),
      tone: "danger",
    };
  }
  if (requiresCandidateSelection(task)) {
    return {
      kind: "novel",
      eyebrow: t("nextAction.eyebrow.recommended", { ns: "homeDashboard" }),
      title: t("nextAction.confirmDirection.title", { ns: "homeDashboard", title: primaryNovel.title }),
      description: getNovelLeadSummary(primaryNovel),
      reason: t("nextAction.confirmDirection.reason", { ns: "homeDashboard" }),
      tone: "warning",
    };
  }
  if (canContinueDirector(task)) {
    return {
      kind: "novel",
      eyebrow: t("nextAction.eyebrow.recommended", { ns: "homeDashboard" }),
      title: t("nextAction.continueDirector.title", { ns: "homeDashboard", title: primaryNovel.title }),
      description: getNovelLeadSummary(primaryNovel),
      reason: t("nextAction.continueDirector.reason", { ns: "homeDashboard" }),
      tone: "warning",
    };
  }
  if (task?.status === "running" || task?.status === "queued") {
    return {
      kind: "novel",
      eyebrow: t("nextAction.eyebrow.systemRunning", { ns: "homeDashboard" }),
      title: t("nextAction.watchProgress.title", { ns: "homeDashboard", title: primaryNovel.title }),
      description: getNovelLeadSummary(primaryNovel),
      reason: t("nextAction.watchProgress.reason", { ns: "homeDashboard" }),
      tone: "info",
    };
  }
  if (canEnterChapterExecution(task)) {
    return {
      kind: "novel",
      eyebrow: t("nextAction.eyebrow.recommended", { ns: "homeDashboard" }),
      title: t("nextAction.enterChapter.title", { ns: "homeDashboard", title: primaryNovel.title }),
      description: getNovelLeadSummary(primaryNovel),
      reason: t("nextAction.enterChapter.reason", { ns: "homeDashboard" }),
      tone: "success",
    };
  }
  if (task?.status === "failed" || task?.status === "cancelled") {
    return {
      kind: "novel",
      eyebrow: t("nextAction.eyebrow.needsAttention", { ns: "homeDashboard" }),
      title: t("nextAction.reviewStatus.title", { ns: "homeDashboard", title: primaryNovel.title }),
      description: getNovelLeadSummary(primaryNovel),
      reason: t("nextAction.reviewStatus.reason", { ns: "homeDashboard" }),
      tone: "danger",
    };
  }
  return {
    kind: "novel",
    eyebrow: t("nextAction.eyebrow.recommended", { ns: "homeDashboard" }),
    title: t("nextAction.continueEdit.title", { ns: "homeDashboard", title: primaryNovel.title }),
    description: getNovelLeadSummary(primaryNovel),
    reason: t("nextAction.continueEdit.reason", { ns: "homeDashboard" }),
    tone: "neutral",
  };
}

export function buildHomeMetrics(t: TFunction, input: {
  novels: HomeNovelItem[];
  taskOverview?: TaskOverviewSummary | null;
}): HomeMetric[] {
  const liveWorkflowCount = input.novels.filter((novel) => (
    isWorkflowRunningInBackground(novel.latestAutoDirectorTask ?? null)
  )).length;
  const actionRequiredCount = input.novels.filter((novel) => (
    isWorkflowActionRequired(novel.latestAutoDirectorTask ?? null)
  )).length;
  const readyForExecutionCount = input.novels.filter((novel) => (
    canEnterChapterExecution(novel.latestAutoDirectorTask ?? null)
  )).length;
  const failedTaskCount = input.taskOverview?.failedCount ?? 0;

  return [
    {
      id: "running",
      title: t("metric.running.title", { ns: "homeDashboard" }),
      value: liveWorkflowCount,
      hint: t("metric.running.hint", { ns: "homeDashboard" }),
      tone: "info",
    },
    {
      id: "attention",
      title: t("metric.attention.title", { ns: "homeDashboard" }),
      value: actionRequiredCount,
      hint: t("metric.attention.hint", { ns: "homeDashboard" }),
      tone: actionRequiredCount > 0 ? "warning" : "success",
    },
    {
      id: "chapter-ready",
      title: t("metric.chapterReady.title", { ns: "homeDashboard" }),
      value: readyForExecutionCount,
      hint: t("metric.chapterReady.hint", { ns: "homeDashboard" }),
      tone: readyForExecutionCount > 0 ? "success" : "neutral",
    },
    {
      id: "failed",
      title: t("metric.failed.title", { ns: "homeDashboard" }),
      value: failedTaskCount,
      hint: t("metric.failed.hint", { ns: "homeDashboard" }),
      tone: failedTaskCount > 0 ? "danger" : "success",
    },
  ];
}

export function buildHomeAttentionItems(t: TFunction, input: {
  novels: HomeNovelItem[];
  taskOverview?: TaskOverviewSummary | null;
}): HomeAttentionItem[] {
  const actionRequiredCount = input.novels.filter((novel) => (
    isWorkflowActionRequired(novel.latestAutoDirectorTask ?? null)
  )).length;
  const readyForExecutionCount = input.novels.filter((novel) => (
    canEnterChapterExecution(novel.latestAutoDirectorTask ?? null)
  )).length;
  const runningCount = input.taskOverview?.runningCount ?? 0;
  const waitingApprovalCount = input.taskOverview?.waitingApprovalCount ?? 0;
  const recoveryCandidateCount = input.taskOverview?.recoveryCandidateCount ?? 0;
  const failedTaskCount = input.taskOverview?.failedCount ?? 0;
  const items: HomeAttentionItem[] = [];

  if (failedTaskCount > 0 || recoveryCandidateCount > 0) {
    items.push({
      id: "task-recovery",
      title: failedTaskCount > 0
        ? t("attention.taskRecovery.titleFailed", { ns: "homeDashboard", count: failedTaskCount })
        : t("attention.taskRecovery.titleRecoverable", { ns: "homeDashboard", count: recoveryCandidateCount }),
      description: t("attention.taskRecovery.description", { ns: "homeDashboard" }),
      tone: failedTaskCount > 0 ? "danger" : "warning",
      to: "/tasks",
      actionLabel: t("attention.taskRecovery.action", { ns: "homeDashboard" }),
    });
  }
  if (actionRequiredCount > 0 || waitingApprovalCount > 0) {
    items.push({
      id: "workflow-action-required",
      title: t("attention.workflowActionRequired.title", { ns: "homeDashboard", count: Math.max(actionRequiredCount, waitingApprovalCount) }),
      description: t("attention.workflowActionRequired.description", { ns: "homeDashboard" }),
      tone: "warning",
      to: "/auto-director/follow-ups",
      actionLabel: t("attention.workflowActionRequired.action", { ns: "homeDashboard" }),
    });
  }
  if (readyForExecutionCount > 0) {
    items.push({
      id: "chapter-ready",
      title: t("attention.chapterReady.title", { ns: "homeDashboard", count: readyForExecutionCount }),
      description: t("attention.chapterReady.description", { ns: "homeDashboard" }),
      tone: "success",
    });
  }
  if (runningCount > 0) {
    items.push({
      id: "running-tasks",
      title: t("attention.runningTasks.title", { ns: "homeDashboard", count: runningCount }),
      description: t("attention.runningTasks.description", { ns: "homeDashboard" }),
      tone: "info",
      to: "/tasks",
      actionLabel: t("attention.runningTasks.action", { ns: "homeDashboard" }),
    });
  }

  return items.slice(0, 4);
}

export function buildHomeAssetHealthItems(t: TFunction, novels: HomeNovelItem[]): HomeAssetHealthItem[] {
  const totalNovels = novels.length;
  const worldBoundCount = novels.filter((novel) => Boolean(novel.world?.id || novel.worldId)).length;
  const totalCharacters = novels.reduce((sum, novel) => sum + novel._count.characters, 0);
  const totalChapters = novels.reduce((sum, novel) => sum + novel._count.chapters, 0);
  const resourceScores = novels
    .map((novel) => novel.resourceReadyScore)
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  const averageResourceScore = resourceScores.length > 0
    ? Math.round(resourceScores.reduce((sum, score) => sum + score, 0) / resourceScores.length)
    : null;

  return [
    {
      id: "world",
      title: t("asset.world.title", { ns: "homeDashboard" }),
      value: totalNovels > 0 ? `${worldBoundCount}/${totalNovels}` : "0",
      description: totalNovels > 0
        ? t("asset.world.description", { ns: "homeDashboard" })
        : t("asset.world.descriptionEmpty", { ns: "homeDashboard" }),
      tone: totalNovels === 0 ? "neutral" : worldBoundCount === totalNovels ? "success" : "warning",
    },
    {
      id: "characters",
      title: t("asset.characters.title", { ns: "homeDashboard" }),
      value: String(totalCharacters),
      description: t("asset.characters.description", { ns: "homeDashboard" }),
      tone: totalCharacters > 0 ? "success" : "warning",
    },
    {
      id: "chapters",
      title: t("asset.chapters.title", { ns: "homeDashboard" }),
      value: String(totalChapters),
      description: t("asset.chapters.description", { ns: "homeDashboard" }),
      tone: totalChapters > 0 ? "info" : "neutral",
    },
    {
      id: "readiness",
      title: t("asset.readiness.title", { ns: "homeDashboard" }),
      value: averageResourceScore == null ? "--" : `${averageResourceScore}`,
      description: t("asset.readiness.description", { ns: "homeDashboard" }),
      tone: averageResourceScore == null
        ? "neutral"
        : averageResourceScore >= 80
          ? "success"
          : averageResourceScore >= 50
            ? "warning"
            : "danger",
    },
  ];
}

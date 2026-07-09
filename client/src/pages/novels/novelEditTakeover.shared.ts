import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import type { DirectorLockScope } from "@ai-novel/shared/types/novelDirector";
import i18n from "@/i18n";
import type { NovelEditTakeoverState } from "./components/NovelEditView.types";

export function resolveAutoExecutionScopeLabel(task: UnifiedTaskDetail | null): string {
  const seedPayload = (task?.meta.seedPayload ?? null) as {
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
  return i18n.t("takeover.scopeFallback", { ns: "novels", count: fallbackCount });
}

export function formatTakeoverCheckpoint(
  checkpoint: string | null | undefined,
  task: UnifiedTaskDetail | null,
): string {
  if (checkpoint === "candidate_selection_required") {
    return i18n.t("takeover.checkpoint.candidateSelection", { ns: "novels" });
  }
  if (checkpoint === "book_contract_ready") {
    return i18n.t("takeover.checkpoint.bookContract", { ns: "novels" });
  }
  if (checkpoint === "character_setup_required") {
    return i18n.t("takeover.checkpoint.characterSetup", { ns: "novels" });
  }
  if (checkpoint === "volume_strategy_ready") {
    return i18n.t("takeover.checkpoint.volumeStrategy", { ns: "novels" });
  }
  if (checkpoint === "chapter_batch_ready") {
    return i18n.t("takeover.checkpoint.chapterBatchPaused", { ns: "novels", scope: resolveAutoExecutionScopeLabel(task) });
  }
  if (checkpoint === "replan_required") {
    return i18n.t("takeover.checkpoint.replan", { ns: "novels" });
  }
  if (checkpoint === "workflow_completed") {
    return i18n.t("takeover.checkpoint.completed", { ns: "novels" });
  }
  return i18n.t("takeover.checkpoint.running", { ns: "novels" });
}

export function buildTakeoverTitle(input: {
  mode: NovelEditTakeoverState["mode"];
  novelTitle: string;
  checkpointType: string | null | undefined;
  scopeLabel: string;
}): string {
  if (
    input.mode === "running"
    && input.checkpointType === "chapter_batch_ready"
  ) {
    return i18n.t("takeover.title.runningChapterBatch", { ns: "novels", title: input.novelTitle, scope: input.scopeLabel });
  }
  if (input.mode === "waiting" || input.mode === "action_required") {
    if (input.checkpointType === "candidate_selection_required") {
      return i18n.t("takeover.title.candidateSelection", { ns: "novels", title: input.novelTitle });
    }
    if (input.checkpointType === "character_setup_required") {
      return i18n.t("takeover.title.characterSetup", { ns: "novels", title: input.novelTitle });
    }
    if (input.checkpointType === "volume_strategy_ready") {
      return i18n.t("takeover.title.volumeStrategy", { ns: "novels", title: input.novelTitle });
    }
    if (input.checkpointType === "workflow_completed") {
      return i18n.t("takeover.title.completed", { ns: "novels", title: input.novelTitle });
    }
    if (input.checkpointType === "replan_required") {
      return i18n.t("takeover.title.replan", { ns: "novels", title: input.novelTitle });
    }
  }
  if (input.mode === "failed") {
    if (input.checkpointType === "chapter_batch_ready") {
      return i18n.t("takeover.title.failedChapterBatch", { ns: "novels", title: input.novelTitle, scope: input.scopeLabel });
    }
    return i18n.t("takeover.title.failed", { ns: "novels", title: input.novelTitle });
  }
  if (input.mode === "loading") {
    return i18n.t("takeover.title.loading", { ns: "novels", title: input.novelTitle });
  }
  return i18n.t("takeover.title.running", { ns: "novels", title: input.novelTitle });
}

export function buildTakeoverDescription(input: {
  mode: NovelEditTakeoverState["mode"];
  checkpointType: string | null | undefined;
  reviewScope: DirectorLockScope | null | undefined;
  scopeLabel: string;
}): string {
  if (
    input.mode === "running"
    && input.checkpointType === "chapter_batch_ready"
  ) {
    return i18n.t("takeover.desc.runningChapterBatch", { ns: "novels", scope: input.scopeLabel });
  }
  if (input.mode === "waiting" || input.mode === "action_required") {
    if (input.checkpointType === "candidate_selection_required") {
      return i18n.t("takeover.desc.candidateSelection", { ns: "novels" });
    }
    if (input.checkpointType === "character_setup_required") {
      return i18n.t("takeover.desc.characterSetup", { ns: "novels" });
    }
    if (input.checkpointType === "volume_strategy_ready") {
      return i18n.t("takeover.desc.volumeStrategy", { ns: "novels" });
    }
    if (input.checkpointType === "workflow_completed") {
      return i18n.t("takeover.desc.completed", { ns: "novels", scope: input.scopeLabel });
    }
    if (input.checkpointType === "replan_required") {
      return i18n.t("takeover.desc.replan", { ns: "novels" });
    }
    if (input.reviewScope) {
      return i18n.t("takeover.desc.reviewScope", { ns: "novels" });
    }
  }
  if (input.mode === "failed") {
    if (input.checkpointType === "chapter_batch_ready") {
      return i18n.t("takeover.desc.failedChapterBatch", { ns: "novels", scope: input.scopeLabel });
    }
    return i18n.t("takeover.desc.failed", { ns: "novels" });
  }
  if (input.mode === "loading") {
    return i18n.t("takeover.desc.loading", { ns: "novels" });
  }
  return i18n.t("takeover.desc.default", { ns: "novels" });
}

export function buildContinueAutoExecutionActionLabel(scopeLabel: string, isPending: boolean): string {
  return isPending
    ? i18n.t("takeover.action.continuing", { ns: "novels" })
    : i18n.t("takeover.action.continueAutoExec", { ns: "novels", scope: scopeLabel });
}

export function buildSkipQualityRepairActionLabel(scopeLabel: string, isPending: boolean): string {
  return isPending
    ? i18n.t("takeover.action.continuing", { ns: "novels" })
    : i18n.t("takeover.action.skipRepair", { ns: "novels", scope: scopeLabel });
}

export function buildContinueAutoExecutionToast(scopeLabel: string): string {
  return i18n.t("takeover.toast.continued", { ns: "novels", scope: scopeLabel });
}

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FailureDiagnostic } from "@ai-novel/shared/types/agent";
import type {
  CreativeHubInterrupt,
  CreativeHubNovelSetupStatus,
  CreativeHubProductionStatus,
  CreativeHubResourceBinding,
  CreativeHubThread,
  CreativeHubTurnSummary,
} from "@ai-novel/shared/types/creativeHub";
import i18n from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CreativeHubNovelSetupCard from "./CreativeHubNovelSetupCard";
import NovelProductionStarterCard from "./NovelProductionStarterCard";
import SelectControl from "@/components/common/SelectControl";

function ch(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, { ns: "creativeHub", ...options });
}

interface CreativeHubSidebarProps {
  thread?: CreativeHubThread;
  bindings: CreativeHubResourceBinding;
  novels: Array<{ id: string; title: string }>;
  interrupt?: CreativeHubInterrupt;
  diagnostics?: FailureDiagnostic;
  productionStatus?: CreativeHubProductionStatus | null;
  novelSetup?: CreativeHubNovelSetupStatus | null;
  latestTurnSummary?: CreativeHubTurnSummary | null;
  currentCheckpointId?: string | null;
  modelSummary: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens?: number;
  };
  defaultRuntimeDetailsCollapsed: boolean;
  onToggleRuntimeDetailsDefault: () => void;
  onNovelChange: (novelId: string) => void;
  onQuickAction?: (prompt: string) => void;
  onCreateNovel?: (title: string) => void;
  onStartProduction?: (prompt: string) => void;
}

function bindingValue(value: string | null | undefined): string {
  return value?.trim() || ch("sidebar.unbound");
}

function turnStatusLabel(status: CreativeHubTurnSummary["status"]): string {
  switch (status) {
    case "succeeded":
      return ch("status.succeeded");
    case "interrupted":
      return ch("status.interrupted");
    case "failed":
      return ch("status.failed");
    case "cancelled":
      return ch("status.cancelled");
    case "running":
      return ch("status.inProgress");
    default:
      return status;
  }
}

function threadStatusLabel(status: CreativeHubThread["status"] | undefined): string {
  switch (status) {
    case "busy":
      return ch("status.executing");
    case "interrupted":
      return ch("status.pending");
    case "error":
      return ch("status.abnormal");
    case "idle":
      return ch("status.idle");
    default:
      return ch("status.uninitialized");
  }
}

function statusVariant(
  status: CreativeHubTurnSummary["status"] | CreativeHubThread["status"] | undefined,
): "outline" | "secondary" | "destructive" {
  if (status === "failed" || status === "cancelled" || status === "error") {
    return "destructive";
  }
  if (status === "interrupted") {
    return "secondary";
  }
  return "outline";
}

function metricTone(status: "pending" | "completed" | "running" | "blocked"): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "blocked":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function summarizeFocus(
  latestTurnSummary: CreativeHubTurnSummary | null | undefined,
  productionStatus: CreativeHubProductionStatus | null | undefined,
  novelSetup: CreativeHubNovelSetupStatus | null | undefined,
): string {
  if (latestTurnSummary?.intentSummary?.trim()) {
    return latestTurnSummary.intentSummary.trim();
  }
  if (novelSetup?.stage === "setup_in_progress" || novelSetup?.stage === "ready_for_planning") {
    return ch("sidebar.focus.completing", { title: novelSetup.title });
  }
  if (productionStatus?.summary?.trim()) {
    return productionStatus.summary.trim();
  }
  return ch("sidebar.focus.default");
}

function buildBlockerCardData(input: {
  interrupt?: CreativeHubInterrupt;
  diagnostics?: FailureDiagnostic;
  productionStatus?: CreativeHubProductionStatus | null;
  latestTurnSummary?: CreativeHubTurnSummary | null;
}) {
  if (input.interrupt) {
    return {
      title: ch("sidebar.blocker.blockedTitle"),
      summary: input.interrupt.summary,
      details: [
        ch("sidebar.blocker.awaitConfirm", { title: input.interrupt.title }),
        input.interrupt.targetType ? ch("sidebar.blocker.targetType", { type: input.interrupt.targetType }) : "",
        input.interrupt.targetId ? ch("sidebar.blocker.targetObject", { id: input.interrupt.targetId }) : "",
      ].filter(Boolean),
      tone: "border-amber-200 bg-amber-50 text-amber-900",
      actionLabel: ch("sidebar.blocker.viewPending"),
      actionPrompt: ch("sidebar.blocker.viewPendingPrompt"),
    };
  }

  if (input.diagnostics?.failureSummary) {
    return {
      title: ch("sidebar.blocker.riskTitle"),
      summary: input.diagnostics.failureSummary,
      details: [
        input.diagnostics.failureCode ? ch("sidebar.blocker.errorCode", { code: input.diagnostics.failureCode }) : "",
        input.diagnostics.recoveryHint ? ch("sidebar.blocker.recoveryHint", { hint: input.diagnostics.recoveryHint }) : "",
      ].filter(Boolean),
      tone: "border-rose-200 bg-rose-50 text-rose-900",
      actionLabel: ch("sidebar.blocker.genRecovery"),
      actionPrompt: input.diagnostics.recoveryHint || ch("sidebar.blocker.genRecoveryPrompt"),
    };
  }

  if (input.productionStatus?.failureSummary) {
    return {
      title: ch("sidebar.blocker.blockedTitle"),
      summary: input.productionStatus.failureSummary,
      details: [
        input.productionStatus.recoveryHint ? ch("sidebar.blocker.recoveryHint", { hint: input.productionStatus.recoveryHint }) : "",
        ch("sidebar.blocker.currentStage", { stage: input.productionStatus.currentStage }),
      ].filter(Boolean),
      tone: "border-orange-200 bg-orange-50 text-orange-900",
      actionLabel: ch("sidebar.blocker.handleBlock"),
      actionPrompt: input.productionStatus.recoveryHint || ch("sidebar.blocker.handleBlockPrompt"),
    };
  }

  if (input.latestTurnSummary?.status === "interrupted") {
    return {
      title: ch("sidebar.blocker.focusTitle"),
      summary: input.latestTurnSummary.nextSuggestion,
      details: [
        ch("sidebar.blocker.stage", { stage: input.latestTurnSummary.currentStage }),
        ch("sidebar.blocker.status", { status: turnStatusLabel(input.latestTurnSummary.status) }),
      ],
      tone: "border-sky-200 bg-sky-50 text-sky-900",
      actionLabel: ch("sidebar.blocker.followSuggestion"),
      actionPrompt: input.latestTurnSummary.nextSuggestion,
    };
  }

  return {
    title: ch("sidebar.blocker.stateTitle"),
    summary: ch("sidebar.blocker.noBlocker"),
    details: input.latestTurnSummary?.nextSuggestion
      ? [ch("sidebar.blocker.nextStep", { suggestion: input.latestTurnSummary.nextSuggestion })]
      : [],
    tone: "border-slate-200 bg-slate-50 text-slate-800",
    actionLabel: input.latestTurnSummary?.nextSuggestion ? ch("sidebar.blocker.followSuggestion") : undefined,
    actionPrompt: input.latestTurnSummary?.nextSuggestion,
  };
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs text-slate-600">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] break-all text-right text-slate-800">{value}</span>
    </div>
  );
}

export default function CreativeHubSidebar({
  thread,
  bindings,
  novels,
  interrupt,
  diagnostics,
  productionStatus,
  novelSetup,
  latestTurnSummary,
  currentCheckpointId,
  modelSummary,
  defaultRuntimeDetailsCollapsed,
  onToggleRuntimeDetailsDefault,
  onNovelChange,
  onQuickAction,
  onCreateNovel,
  onStartProduction,
}: CreativeHubSidebarProps) {
  const { t } = useTranslation("creativeHub");
  const [novelTitleDraft, setNovelTitleDraft] = useState("");
  const currentNovelTitle = novels.find((item) => item.id === bindings.novelId)?.title ?? null;
  const blocker = useMemo(
    () => buildBlockerCardData({
      interrupt,
      diagnostics,
      productionStatus,
      latestTurnSummary,
    }),
    [diagnostics, interrupt, latestTurnSummary, productionStatus],
  );
  const completedAssets = productionStatus?.assetStages.filter((item) => item.status === "completed").length ?? 0;
  const activeStage = latestTurnSummary?.currentStage
    ?? productionStatus?.currentStage
    ?? (novelSetup?.stage === "ready_for_production"
      ? t("stage.initDone")
      : novelSetup?.stage === "ready_for_planning"
        ? t("stage.initAwaitPlan")
        : novelSetup?.stage === "setup_in_progress"
          ? t("stage.initInProgress")
          : t("stage.notStarted"));
  const latestRunId = latestTurnSummary?.runId ?? thread?.latestRunId ?? null;
  const blockerActionPrompt = blocker.actionPrompt ?? "";

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{t("sidebar.workspaceTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{t("sidebar.currentFocus")}</div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {thread?.title?.trim() || t("sidebar.unnamedThread")}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-700">
                {summarizeFocus(latestTurnSummary, productionStatus, novelSetup)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{activeStage}</Badge>
              <Badge variant={statusVariant(thread?.status)}>{threadStatusLabel(thread?.status)}</Badge>
              {latestTurnSummary ? (
                <Badge variant={statusVariant(latestTurnSummary.status)}>
                  {turnStatusLabel(latestTurnSummary.status)}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-medium text-slate-500">{t("sidebar.resourceBinding")}</div>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-500">{t("sidebar.currentNovel")}</div>
              <SelectControl
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-700"
                value={bindings.novelId ?? ""}
                onChange={(event) => onNovelChange(event.target.value)}
              >
                <option value="">{t("sidebar.unboundNovel")}</option>
                {novels.map((novel) => (
                  <option key={novel.id} value={novel.id}>
                    {novel.title}
                  </option>
                ))}
              </SelectControl>
              {!bindings.novelId ? (
                <div className="mt-2 space-y-2 rounded-lg border border-dashed border-slate-200 bg-white p-2">
                  <input
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                    value={novelTitleDraft}
                    onChange={(event) => setNovelTitleDraft(event.target.value)}
                    placeholder={t("sidebar.newNovelPlaceholder")}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onQuickAction?.(t("sidebar.prompt.listNovels"))}
                    >
                      {t("sidebar.viewNovels")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const title = novelTitleDraft.trim();
                        if (!title) {
                          return;
                        }
                        onCreateNovel?.(title);
                        setNovelTitleDraft("");
                      }}
                    >
                      {t("sidebar.createAndBind")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>{t("sidebar.field.chapter", { value: bindingValue(bindings.chapterId) })}</div>
              <div>{t("sidebar.field.world", { value: bindingValue(bindings.worldId) })}</div>
              <div>{t("sidebar.field.task", { value: bindingValue(bindings.taskId) })}</div>
              <div>{t("sidebar.field.bookAnalysis", { value: bindingValue(bindings.bookAnalysisId) })}</div>
              <div>{t("sidebar.field.formula", { value: bindingValue(bindings.formulaId) })}</div>
              <div>{t("sidebar.field.baseCharacter", { value: bindingValue(bindings.baseCharacterId) })}</div>
            </div>
            <div>{t("sidebar.field.knowledgeDocs", { count: bindings.knowledgeDocumentIds?.length ?? 0 })}</div>
          </div>
        </div>

        {novelSetup ? (
          <CreativeHubNovelSetupCard setup={novelSetup} onQuickAction={onQuickAction} />
        ) : null}

        {novelSetup?.stage === "setup_in_progress" || novelSetup?.stage === "ready_for_planning" ? null : (
          <NovelProductionStarterCard
            currentNovelId={bindings.novelId ?? null}
            currentNovelTitle={currentNovelTitle}
            productionStatus={productionStatus}
            onQuickAction={onQuickAction}
            onSubmit={(prompt) => onStartProduction?.(prompt)}
          />
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-500">{t("sidebar.currentProgress")}</div>
            <Badge variant="outline">{activeStage}</Badge>
          </div>
          {latestTurnSummary ? (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("sidebar.executedAction")}</div>
                <div className="mt-2 leading-6 text-slate-800">{latestTurnSummary.actionSummary}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("sidebar.impactChange")}</div>
                <div className="mt-2 leading-6 text-slate-800">{latestTurnSummary.impactSummary}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("sidebar.nextSuggestion")}</div>
                <div className="mt-2 leading-6 text-slate-800">{latestTurnSummary.nextSuggestion}</div>
                {latestTurnSummary.nextSuggestion.trim() ? (
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onQuickAction?.(latestTurnSummary.nextSuggestion)}
                    >
                      {t("sidebar.blocker.followSuggestion")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              {t("sidebar.noTurnSummary")}
            </div>
          )}
        </div>

        <div className={cn("rounded-2xl border p-3", blocker.tone)}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-medium">{blocker.title}</div>
            {interrupt ? <Badge variant="secondary">{t("sidebar.needConfirm")}</Badge> : null}
          </div>
          <div className="text-sm leading-6">{blocker.summary}</div>
          {blocker.details.length > 0 ? (
            <div className="mt-3 space-y-2 text-xs">
              {blocker.details.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          ) : null}
          {blocker.actionLabel && blockerActionPrompt ? (
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-current bg-white/80"
                onClick={() => onQuickAction?.(blockerActionPrompt)}
              >
                {blocker.actionLabel}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-3 text-xs font-medium text-slate-500">{t("sidebar.productionStage")}</div>
          {productionStatus ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{t("sidebar.stageLabel.current")}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">{productionStatus.currentStage}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{t("sidebar.stageLabel.chapterProgress")}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {productionStatus.chapterCount}/{productionStatus.targetChapterCount}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{t("sidebar.stageLabel.assetComplete")}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {completedAssets}/{productionStatus.assetStages.length}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{t("sidebar.stageLabel.pipeline")}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {productionStatus.pipelineStatus ?? t("status.notStarted")}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {productionStatus.assetStages.map((item) => (
                  <span
                    key={item.key}
                    className={cn("rounded-full border px-2 py-1 text-[11px]", metricTone(item.status))}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              {t("sidebar.noProductionStatus")}
            </div>
          )}
        </div>

        <details className="rounded-2xl border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer list-none text-xs font-medium text-slate-500">
            {t("sidebar.debugInfo")}
          </summary>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {t("sidebar.runtimeDetailsToggle")}
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-slate-700">
                <span>
                  {t("sidebar.runtimeDetailsState", { state: defaultRuntimeDetailsCollapsed ? t("common.collapsed") : t("common.expanded") })}
                </span>
                <Button type="button" size="sm" variant="outline" onClick={onToggleRuntimeDetailsDefault}>
                  {t("sidebar.switchTo", { mode: defaultRuntimeDetailsCollapsed ? t("sidebar.defaultExpand") : t("sidebar.defaultCollapse") })}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("sidebar.threadStatus")}</div>
              <DebugRow label={t("sidebar.debug.threadId")} value={thread?.id ?? "-"} />
              <DebugRow label={t("sidebar.threadStatus")} value={threadStatusLabel(thread?.status)} />
              <DebugRow label={t("sidebar.debug.latestRun")} value={latestRunId ?? "-"} />
              <DebugRow label={t("sidebar.debug.currentCheckpoint")} value={currentCheckpointId ?? "-"} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("sidebar.modelRouting")}</div>
              <DebugRow label="Provider" value={modelSummary.provider} />
              <DebugRow label="Model" value={modelSummary.model} />
              <DebugRow label="Temperature" value={String(modelSummary.temperature)} />
              <DebugRow label="Max tokens" value={modelSummary.maxTokens != null ? String(modelSummary.maxTokens) : t("common.default")} />
            </div>

            {latestTurnSummary ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{t("sidebar.recentTurn")}</div>
                <DebugRow label={t("sidebar.debug.turnStatus")} value={turnStatusLabel(latestTurnSummary.status)} />
                <DebugRow label={t("sidebar.debug.turnStage")} value={latestTurnSummary.currentStage} />
                <DebugRow label={t("sidebar.debug.summaryCheckpoint")} value={latestTurnSummary.checkpointId ?? "-"} />
              </div>
            ) : null}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

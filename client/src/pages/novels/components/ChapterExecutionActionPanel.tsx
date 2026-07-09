import type { SSEFrame } from "@ai-novel/shared/types/api";
import type { ChapterRuntimePackage } from "@ai-novel/shared/types/chapterRuntime";
import type { AuditReport, Chapter, StoryStateSnapshot } from "@ai-novel/shared/types/novel";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChapterExecutionStatusFlow from "./ChapterExecutionStatusFlow";
import {
  chapterHasPreparationAssets,
  chapterStatusLabel,
  chapterSuggestedActionLabel,
  PrimaryActionButton,
  type PrimaryAction,
  type ChapterExecutionBackgroundActivity,
  resolveDisplayedChapterStatus,
  resolveChapterExecutionFlow,
} from "./chapterExecution.shared";
import SelectControl from "@/components/common/SelectControl";
import i18n from "@/i18n";

interface ChapterExecutionActionPanelProps {
  novelId: string;
  selectedChapter: Chapter | undefined;
  hasCharacters: boolean;
  strategy: {
    runMode: "fast" | "polish";
    wordSize: "short" | "medium" | "long";
    conflictLevel: number;
    pace: "slow" | "balanced" | "fast";
    aiFreedom: "low" | "medium" | "high";
  };
  onStrategyChange: (
    field: "runMode" | "wordSize" | "conflictLevel" | "pace" | "aiFreedom",
    value: string | number,
  ) => void;
  onApplyStrategy: () => void;
  isApplyingStrategy: boolean;
  onGenerateSelectedChapter: () => void;
  onRewriteChapter: () => void;
  onExpandChapter: () => void;
  onCompressChapter: () => void;
  onSummarizeChapter: () => void;
  onGenerateTaskSheet: () => void;
  onGenerateSceneCards: () => void;
  onGenerateChapterPlan: () => void;
  onReplanChapter: () => void;
  onRunFullAudit: () => void;
  onCheckContinuity: () => void;
  onCheckCharacterConsistency: () => void;
  onCheckPacing: () => void;
  onAutoRepair: () => void;
  onStrengthenConflict: () => void;
  onEnhanceEmotion: () => void;
  onUnifyStyle: () => void;
  onAddDialogue: () => void;
  onAddDescription: () => void;
  isGeneratingTaskSheet: boolean;
  isGeneratingSceneCards: boolean;
  isSummarizingChapter: boolean;
  reviewActionKind?: "full_audit" | "continuity" | "character_consistency" | "pacing" | null;
  repairActionKind?: "autoRepair" | "expand" | "compress" | "strengthenConflict" | "enhanceEmotion" | "unifyStyle" | "addDialogue" | "addDescription" | null;
  generationActionKind?: "rewrite" | null;
  isReviewingChapter: boolean;
  isRepairingChapter: boolean;
  isGeneratingChapterPlan: boolean;
  isReplanningChapter: boolean;
  isRunningFullAudit: boolean;
  isStreaming: boolean;
  streamingChapterId?: string | null;
  repairStreamingChapterId?: string | null;
  chapterAuditReports: AuditReport[];
  chapterRuntimePackage?: ChapterRuntimePackage | null;
  latestStateSnapshot?: StoryStateSnapshot | null;
  chapterStateSnapshot?: StoryStateSnapshot | null;
  backgroundSyncActivities?: ChapterExecutionBackgroundActivity[];
  chapterRunStatus?: Extract<SSEFrame, { type: "run_status" }> | null;
  repairRunStatus?: Extract<SSEFrame, { type: "run_status" }> | null;
}

function resolvePrimaryAction(params: {
  novelId: string;
  selectedChapter?: Chapter;
  hasCharacters: boolean;
  isGeneratingChapterPlan: boolean;
  isRunningFullAudit: boolean;
  isSelectedChapterStreaming: boolean;
  isSelectedChapterRepairing: boolean;
  onGenerateChapterPlan: () => void;
  onRunFullAudit: () => void;
  onAutoRepair: () => void;
  onGenerateSelectedChapter: () => void;
}): PrimaryAction {
  const {
    novelId,
    selectedChapter,
    hasCharacters,
    isGeneratingChapterPlan,
    isRunningFullAudit,
    isSelectedChapterStreaming,
    isSelectedChapterRepairing,
    onGenerateChapterPlan,
    onRunFullAudit,
    onAutoRepair,
    onGenerateSelectedChapter,
  } = params;
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });

  if (!selectedChapter) {
    return {
      label: tr("action.primary.selectChapter.label"),
      reason: tr("action.primary.selectChapter.reason"),
      variant: "default",
      disabled: true,
    };
  }

  if (selectedChapter.chapterStatus === "needs_repair") {
    return {
      label: tr("action.primary.openEditor.label"),
      reason: tr("action.primary.needsRepair.reason"),
      variant: "default",
      href: `/novels/${novelId}/chapters/${selectedChapter.id}`,
    };
  }

  if (
    (selectedChapter.chapterStatus === "pending_review"
      && selectedChapter.generationState !== "reviewed"
      && selectedChapter.generationState !== "approved")
    || selectedChapter.generationState === "drafted"
  ) {
    return {
      label: isRunningFullAudit ? tr("action.primary.runAuditRunning.label") : tr("action.primary.runAudit.label"),
      reason: tr("action.primary.runAudit.reason"),
      variant: "default",
      ai: true,
      onClick: onRunFullAudit,
      disabled: isRunningFullAudit,
    };
  }

  if (selectedChapter.chapterStatus === "unplanned" || !chapterHasPreparationAssets(selectedChapter)) {
    return {
      label: isGeneratingChapterPlan ? tr("action.primary.genPlanRunning.label") : tr("action.primary.genPlan.label"),
      reason: tr("action.primary.genPlan.reason"),
      variant: "default",
      ai: true,
      onClick: onGenerateChapterPlan,
      disabled: isGeneratingChapterPlan,
    };
  }

  if (!selectedChapter.content?.trim() || selectedChapter.chapterStatus === "pending_generation") {
    return {
      label: isSelectedChapterStreaming ? tr("action.primary.writeRunning.label") : tr("action.primary.write.label"),
      reason: tr("action.primary.write.reason"),
      variant: "default",
      ai: true,
      onClick: onGenerateSelectedChapter,
      disabled: !hasCharacters || isSelectedChapterStreaming,
    };
  }

  return {
    label: tr("action.primary.openEditor.label"),
    reason: tr("action.primary.openEditorFinal.reason"),
    variant: "default",
    href: `/novels/${novelId}/chapters/${selectedChapter.id}`,
  };
}

export default function ChapterExecutionActionPanel(props: ChapterExecutionActionPanelProps) {
  const { t } = useTranslation("novelsEditA");
  const {
    novelId,
    selectedChapter,
    hasCharacters,
    strategy,
    onStrategyChange,
    onApplyStrategy,
    isApplyingStrategy,
    onGenerateSelectedChapter,
    onRewriteChapter,
    onExpandChapter,
    onCompressChapter,
    onSummarizeChapter,
    onGenerateTaskSheet,
    onGenerateSceneCards,
    onGenerateChapterPlan,
    onReplanChapter,
    onRunFullAudit,
    onCheckContinuity,
    onCheckCharacterConsistency,
    onCheckPacing,
    onAutoRepair,
    onStrengthenConflict,
    onEnhanceEmotion,
    onUnifyStyle,
    onAddDialogue,
    onAddDescription,
    isGeneratingTaskSheet,
    isGeneratingSceneCards,
    isSummarizingChapter,
    reviewActionKind,
    repairActionKind,
    generationActionKind,
    isReviewingChapter,
    isRepairingChapter,
    isGeneratingChapterPlan,
    isReplanningChapter,
    isRunningFullAudit,
    isStreaming,
    streamingChapterId,
    repairStreamingChapterId,
    chapterAuditReports,
    chapterRuntimePackage,
    latestStateSnapshot,
    chapterStateSnapshot,
    backgroundSyncActivities,
    chapterRunStatus,
    repairRunStatus,
  } = props;

  const isSelectedChapterStreaming = Boolean(selectedChapter && isStreaming && streamingChapterId === selectedChapter.id);
  const isSelectedChapterRepairing = Boolean(selectedChapter && isRepairingChapter && repairStreamingChapterId === selectedChapter.id);
  const isExecutionContractPending = isGeneratingTaskSheet || isGeneratingSceneCards;
  const runtimePackage = chapterRuntimePackage?.chapterId === selectedChapter?.id ? chapterRuntimePackage : null;
  const displayedStatus = selectedChapter ? resolveDisplayedChapterStatus(selectedChapter) : undefined;

  const selectedChapterLabel = selectedChapter
    ? t("common.chapterOrderTitle", { order: selectedChapter.order, title: selectedChapter.title || t("common.unnamedChapter") })
    : t("action.noChapterSelected");

  const primaryAction = resolvePrimaryAction({
    novelId,
    selectedChapter: selectedChapter
      ? {
        ...selectedChapter,
        chapterStatus: displayedStatus ?? selectedChapter.chapterStatus,
      }
      : undefined,
    hasCharacters,
    isGeneratingChapterPlan,
    isRunningFullAudit,
    isSelectedChapterStreaming,
    isSelectedChapterRepairing,
    onGenerateChapterPlan,
    onRunFullAudit,
    onAutoRepair,
    onGenerateSelectedChapter,
  });
  const executionFlow = resolveChapterExecutionFlow({
    selectedChapter,
    chapterAuditReports,
    chapterRuntimePackage: runtimePackage,
    chapterStateSnapshot,
    latestStateSnapshot,
    chapterRunStatus,
    repairRunStatus,
    isStreaming,
    streamingChapterId,
    isRepairStreaming: isRepairingChapter,
    repairStreamingChapterId,
    isRunningFullAudit,
    backgroundActivities: backgroundSyncActivities,
  });

  const showQuickEditorAction = Boolean(selectedChapter && primaryAction.label !== t("action.primary.openEditor.label"));
  const showQuickAuditAction = Boolean(selectedChapter && primaryAction.label !== t("action.primary.runAudit.label") && primaryAction.label !== t("action.primary.runAuditRunning.label"));
  const showQuickRepairAction = Boolean(
    selectedChapter
      && displayedStatus === "needs_repair"
      && primaryAction.label !== t("action.quickRepair")
      && primaryAction.label !== t("action.quickRepairRunning"),
  );

  return (
    <Card className="self-start overflow-hidden border-border/70 lg:sticky lg:top-4">
      <CardHeader className="gap-3 border-b bg-gradient-to-b from-muted/30 to-background pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{t("action.consoleTitle")}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("action.consoleSubtitle")}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/90 p-3">
          <div className="text-xs text-muted-foreground">{t("action.currentTarget")}</div>
          <div className="mt-1 text-sm font-semibold text-foreground">{selectedChapterLabel}</div>
          {selectedChapter ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{chapterStatusLabel(displayedStatus ?? selectedChapter.chapterStatus)}</Badge>
              <Badge variant="outline">{chapterSuggestedActionLabel(selectedChapter)}</Badge>
            </div>
          ) : null}
        </div>
        <ChapterExecutionStatusFlow
          stages={executionFlow.stages}
          currentStageKey={executionFlow.currentStage.key}
          currentStageNote={executionFlow.currentStage.note}
        />
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="text-xs text-muted-foreground">{t("action.recommendedAction")}</div>
          <div className="mt-2 text-sm leading-6 text-foreground">{primaryAction.reason}</div>
          <div className="mt-3">
            <PrimaryActionButton action={primaryAction} className="w-full" />
          </div>
          <div className="mt-3 grid gap-2">
            {showQuickEditorAction ? (
              <Button asChild variant="outline" className="w-full">
                <Link to={`/novels/${novelId}/chapters/${selectedChapter!.id}`}>{t("action.primary.openEditor.label")}</Link>
              </Button>
            ) : null}
            {showQuickAuditAction ? (
              <AiButton className="w-full" variant="outline" onClick={onRunFullAudit} disabled={!selectedChapter || isReviewingChapter}>
                {isRunningFullAudit ? t("action.primary.runAuditRunning.label") : t("action.primary.runAudit.label")}
              </AiButton>
            ) : null}
            {showQuickRepairAction ? (
              <AiButton className="w-full" variant="secondary" onClick={onAutoRepair} disabled={!selectedChapter || isSelectedChapterRepairing}>
                {isSelectedChapterRepairing && repairActionKind === "autoRepair" ? t("action.quickRepairRunning") : t("action.quickRepair")}
              </AiButton>
            ) : null}
          </div>
          <div className="mt-3 text-xs leading-6 text-muted-foreground">
            {t("action.recommendHint")}
          </div>
        </div>

        <details className="rounded-2xl border border-border/70 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
            {t("action.assetSection")}
          </summary>
          <div className="mt-3 grid gap-2">
            <AiButton size="sm" variant="outline" onClick={onGenerateTaskSheet} disabled={!selectedChapter || isExecutionContractPending}>
              {isGeneratingTaskSheet ? t("action.taskSheetRunning") : t("action.taskSheet")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onGenerateSceneCards} disabled={!selectedChapter || isExecutionContractPending}>
              {isGeneratingSceneCards ? t("action.sceneCardsRunning") : t("action.sceneCards")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onSummarizeChapter} disabled={!selectedChapter || isSummarizingChapter}>
              {isSummarizingChapter ? t("action.summaryRunning") : t("action.summary")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onReplanChapter} disabled={!selectedChapter || isReplanningChapter}>
              {isReplanningChapter ? t("action.replanRunning") : t("action.replan")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onCheckContinuity} disabled={!selectedChapter || isReviewingChapter}>
              {isReviewingChapter && reviewActionKind === "continuity" ? t("action.continuityRunning") : t("action.continuity")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onCheckCharacterConsistency} disabled={!selectedChapter || isReviewingChapter}>
              {isReviewingChapter && reviewActionKind === "character_consistency" ? t("action.consistencyRunning") : t("action.consistency")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onCheckPacing} disabled={!selectedChapter || isReviewingChapter}>
              {isReviewingChapter && reviewActionKind === "pacing" ? t("action.pacingRunning") : t("action.pacing")}
            </AiButton>
          </div>
        </details>

        <details className="rounded-2xl border border-border/70 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
            {t("action.polishSection")}
          </summary>
          <div className="mt-3 grid gap-2">
            <AiButton size="sm" variant="outline" onClick={onRewriteChapter} disabled={!hasCharacters || !selectedChapter || isSelectedChapterStreaming}>
              {isSelectedChapterStreaming && generationActionKind === "rewrite" ? t("action.rewriteRunning") : t("action.rewrite")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onExpandChapter} disabled={!selectedChapter || isSelectedChapterRepairing}>
              {isSelectedChapterRepairing && repairActionKind === "expand" ? t("action.expandRunning") : t("action.expand")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onCompressChapter} disabled={!selectedChapter || isSelectedChapterRepairing}>
              {isSelectedChapterRepairing && repairActionKind === "compress" ? t("action.compressRunning") : t("action.compress")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onStrengthenConflict} disabled={!selectedChapter || isSelectedChapterRepairing}>
              {isSelectedChapterRepairing && repairActionKind === "strengthenConflict" ? t("action.strengthenConflictRunning") : t("action.strengthenConflict")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onEnhanceEmotion} disabled={!selectedChapter || isSelectedChapterRepairing}>
              {isSelectedChapterRepairing && repairActionKind === "enhanceEmotion" ? t("action.enhanceEmotionRunning") : t("action.enhanceEmotion")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onUnifyStyle} disabled={!selectedChapter || isSelectedChapterRepairing}>
              {isSelectedChapterRepairing && repairActionKind === "unifyStyle" ? t("action.unifyStyleRunning") : t("action.unifyStyle")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onAddDialogue} disabled={!selectedChapter || isSelectedChapterRepairing}>
              {isSelectedChapterRepairing && repairActionKind === "addDialogue" ? t("action.addDialogueRunning") : t("action.addDialogue")}
            </AiButton>
            <AiButton size="sm" variant="outline" onClick={onAddDescription} disabled={!selectedChapter || isSelectedChapterRepairing}>
              {isSelectedChapterRepairing && repairActionKind === "addDescription" ? t("action.addDescriptionRunning") : t("action.addDescription")}
            </AiButton>
          </div>
        </details>

        <details className="rounded-2xl border border-border/70 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
            {t("action.strategySection")}
          </summary>
          <div className="mt-2 text-xs leading-6 text-muted-foreground">
            {t("action.strategyHint")}
          </div>
          <div className="mt-3 grid gap-3">
            <label htmlFor="chapter-strategy-run-mode" className="space-y-1 text-xs text-muted-foreground">
              <span>{t("action.strategy.runMode")}</span>
              <SelectControl
                id="chapter-strategy-run-mode"
                className="w-full rounded-xl border bg-background p-2 text-sm text-foreground"
                value={strategy.runMode}
                onChange={(event) => onStrategyChange("runMode", event.target.value)}
              >
                <option value="fast">{t("action.strategy.fast")}</option>
                <option value="polish">{t("action.strategy.polish")}</option>
              </SelectControl>
            </label>
            <label htmlFor="chapter-strategy-word-size" className="space-y-1 text-xs text-muted-foreground">
              <span>{t("action.strategy.wordSize")}</span>
              <SelectControl
                id="chapter-strategy-word-size"
                className="w-full rounded-xl border bg-background p-2 text-sm text-foreground"
                value={strategy.wordSize}
                onChange={(event) => onStrategyChange("wordSize", event.target.value)}
              >
                <option value="short">{t("action.strategy.short")}</option>
                <option value="medium">{t("action.strategy.medium")}</option>
                <option value="long">{t("action.strategy.long")}</option>
              </SelectControl>
            </label>
            <label htmlFor="chapter-strategy-conflict" className="space-y-1 text-xs text-muted-foreground">
              <span>{t("action.strategy.conflict")}</span>
              <input
                id="chapter-strategy-conflict"
                className="w-full rounded-xl border bg-background p-2 text-sm text-foreground"
                type="number"
                min={0}
                max={100}
                value={strategy.conflictLevel}
                onChange={(event) => onStrategyChange("conflictLevel", Number(event.target.value || 0))}
              />
            </label>
            <label htmlFor="chapter-strategy-pace" className="space-y-1 text-xs text-muted-foreground">
              <span>{t("action.strategy.pace")}</span>
              <SelectControl
                id="chapter-strategy-pace"
                className="w-full rounded-xl border bg-background p-2 text-sm text-foreground"
                value={strategy.pace}
                onChange={(event) => onStrategyChange("pace", event.target.value)}
              >
                <option value="slow">{t("action.strategy.slow")}</option>
                <option value="balanced">{t("action.strategy.balanced")}</option>
                <option value="fast">{t("action.strategy.paceFast")}</option>
              </SelectControl>
            </label>
            <label htmlFor="chapter-strategy-ai-freedom" className="space-y-1 text-xs text-muted-foreground">
              <span>{t("action.strategy.aiFreedom")}</span>
              <SelectControl
                id="chapter-strategy-ai-freedom"
                className="w-full rounded-xl border bg-background p-2 text-sm text-foreground"
                value={strategy.aiFreedom}
                onChange={(event) => onStrategyChange("aiFreedom", event.target.value)}
              >
                <option value="low">{t("action.strategy.low")}</option>
                <option value="medium">{t("action.strategy.medium")}</option>
                <option value="high">{t("action.strategy.high")}</option>
              </SelectControl>
            </label>
            <Button className="w-full" size="sm" onClick={onApplyStrategy} disabled={isApplyingStrategy || !selectedChapter}>
              {isApplyingStrategy ? t("action.strategyApplyRunning") : t("action.strategyApply")}
            </Button>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

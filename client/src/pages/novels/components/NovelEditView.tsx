import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { useIsMobileViewport } from "@/components/layout/mobile/useIsMobileViewport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import KnowledgeBindingPanel from "@/components/knowledge/KnowledgeBindingPanel";
import AITakeoverContainer from "@/components/workflow/AITakeoverContainer";
import ChapterManagementTab from "./ChapterManagementTab";
import DirectorFactDebugDialog from "./DirectorFactDebugDialog";
import NovelCharacterPanel from "./NovelCharacterPanel";
import NovelTaskDrawer from "./NovelTaskDrawer";
import OutlineTab from "./OutlineTab";
import PipelineTab from "./PipelineTab";
import StoryMacroPlanTab from "./StoryMacroPlanTab";
import StructuredOutlineTab from "./StructuredOutlineTab";
import VersionHistoryTab from "./VersionHistoryTab";
import BasicInfoTab from "./BasicInfoTab";
import { devResetNovelChapters } from "@/api/novel";
import { toast } from "@/components/ui/toast";
import { queryKeys } from "@/api/queryKeys";
import MobileNovelEditView from "../mobile/MobileNovelEditView";
import type { NovelEditViewProps } from "./NovelEditView.types";
import {
  getNovelWorkspaceFlowStepIndex,
  getNovelWorkspaceTabLabel,
  NOVEL_WORKSPACE_FLOW_STEPS,
  normalizeNovelWorkspaceTab,
  tabFromDirectorDisplayStage,
} from "../novelWorkspaceNavigation";
import { StepHero } from "./workspaceShell";

export default function NovelEditView(props: NovelEditViewProps) {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport) {
    return <MobileNovelEditView {...props} />;
  }

  return <DesktopNovelEditView {...props} />;
}

function DesktopNovelEditView(props: NovelEditViewProps) {
  const { t } = useTranslation("novelsEditC");
  const {
    id,
    activeTab,
    workflowCurrentTab,
    exportControls,
    basicTab,
    storyMacroTab,
    outlineTab,
    structuredTab,
    chapterTab,
    pipelineTab,
    characterTab,
    takeover,
    taskDrawer,
    activeStepTakeoverEntry,
  } = props;

  const [isProjectToolsOpen, setIsProjectToolsOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const resetChaptersMutation = useMutation({
    mutationFn: () => devResetNovelChapters(id),
    onSuccess: async (result) => {
      toast.success(t("editView.resetSuccess", { count: result.resetCount }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.novels.detail(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.novels.chapters(id) }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("editView.resetError"));
    },
  });

  const totalChapters = chapterTab.chapters.length;
  const generatedChapters = chapterTab.chapters.filter((item) => Boolean(item.content?.trim())).length;
  const pendingRepairs = pipelineTab.chapterReports.filter(
    (item) => item.overall < pipelineTab.pipelineForm.qualityThreshold,
  ).length;
  const currentModel = pipelineTab.pipelineJob?.payload
    ? (() => {
        try {
          const parsed = JSON.parse(pipelineTab.pipelineJob.payload) as { model?: string };
          return parsed.model ?? "default";
        } catch {
          return "default";
        }
      })()
    : "default";

  const pendingResourceProposalCount = taskDrawer?.resourceProposals?.length ?? 0;
  const taskAttentionLabel = (() => {
    if (pendingResourceProposalCount > 0) {
      return t("editView.resourceCount", { count: pendingResourceProposalCount });
    }
    if (!taskDrawer?.task) {
      return null;
    }
    if (taskDrawer.task.pendingManualRecovery) {
      return t("editView.attention.pendingRecovery");
    }
    if (taskDrawer.task.status === "failed") {
      return t("editView.attention.error");
    }
    if (taskDrawer.task.status === "waiting_approval") {
      return t("editView.attention.pendingReview");
    }
    if (taskDrawer.task.status === "running" || taskDrawer.task.status === "queued") {
      return t("editView.attention.running");
    }
    return t("editView.attention.recentTask");
  })();

  const normalizedActiveTab = normalizeNovelWorkspaceTab(activeTab);
  const normalizedWorkflowTab = normalizeNovelWorkspaceTab(workflowCurrentTab ?? activeTab);
  const guidedFlowTab = normalizedActiveTab === "history"
    ? normalizedWorkflowTab === "history"
      ? "basic"
      : normalizedWorkflowTab
    : normalizedActiveTab;
  const novelTitle = basicTab.basicForm.title.trim() || t("editView.untitledNovel");
  const directorDisplayState = taskDrawer?.snapshot?.displayState ?? null;
  const currentPageLabel = getNovelWorkspaceTabLabel(normalizedActiveTab);
  const currentStepLabel = directorDisplayState?.stageLabel ?? currentPageLabel;
  const recommendedWorkflowTab = directorDisplayState
    ? tabFromDirectorDisplayStage(directorDisplayState.stageKey)
    : normalizedWorkflowTab;
  const workflowStepLabel = recommendedWorkflowTab
    ? getNovelWorkspaceTabLabel(recommendedWorkflowTab)
    : null;
  const stepIndex = directorDisplayState?.stepIndex ?? getNovelWorkspaceFlowStepIndex(guidedFlowTab);
  const progressLabel = stepIndex >= 0
    ? t("editView.progressLabel", { current: stepIndex + 1, total: directorDisplayState?.totalSteps ?? NOVEL_WORKSPACE_FLOW_STEPS.length })
    : null;
  const showWorkflowRecommendation = Boolean(
    recommendedWorkflowTab
    && recommendedWorkflowTab !== normalizedActiveTab,
  );
  const isTakeoverLoading = takeover?.mode === "loading";
  const hideTakeoverEntry = takeover?.mode === "running" || takeover?.mode === "waiting";
  const workspaceTone = taskDrawer?.task?.status === "failed"
    ? "danger"
    : taskDrawer?.task?.status === "waiting_approval"
      ? "warning"
      : taskDrawer?.task?.status === "running" || taskDrawer?.task?.status === "queued"
        ? "info"
        : "neutral";

  const renderActivePanel = () => {
    switch (activeTab) {
      case "basic":
        return <BasicInfoTab {...basicTab} />;
      case "outline":
        return <OutlineTab {...outlineTab} />;
      case "story_macro":
        return <StoryMacroPlanTab {...storyMacroTab} />;
      case "structured":
        return <StructuredOutlineTab {...structuredTab} />;
      case "chapter":
        return <ChapterManagementTab {...chapterTab} />;
      case "pipeline":
        return <PipelineTab {...pipelineTab} />;
      case "character":
        return <NovelCharacterPanel {...characterTab} />;
      case "history":
        return <VersionHistoryTab novelId={id} />;
      default:
        return <BasicInfoTab {...basicTab} />;
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {id ? (
        <StepHero
          tone={workspaceTone}
          eyebrow={(
            <>
              <span className="truncate font-semibold text-foreground">{novelTitle}</span>
              {progressLabel ? <span>{progressLabel}</span> : null}
              <span>{t("editView.currentPage", { value: currentPageLabel })}</span>
            </>
          )}
          title={currentStepLabel}
          description={showWorkflowRecommendation && workflowStepLabel
            ? t("editView.workflowRecommend", { value: workflowStepLabel })
            : t("editView.defaultDescription")}
          actions={(
            <>
            {!hideTakeoverEntry ? (
              isTakeoverLoading ? (
                <Button type="button" size="sm" disabled>
                  <Loader2 className="animate-spin" />
                  {t("takeover.aiTakeover")}
                </Button>
              ) : activeStepTakeoverEntry
            ) : null}

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">{t("editView.export")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("editView.exportDialogTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("editView.exportDialogDesc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("editView.currentStep", { value: currentStepLabel })}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => exportControls.onExportCurrent("markdown")}
                        disabled={!exportControls.canExportCurrentStep || exportControls.isExportingCurrentMarkdown}
                      >
                        {exportControls.isExportingCurrentMarkdown ? t("common.exporting") : "Markdown"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportControls.onExportCurrent("json")}
                        disabled={!exportControls.canExportCurrentStep || exportControls.isExportingCurrentJson}
                      >
                        {exportControls.isExportingCurrentJson ? t("common.exporting") : "JSON"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("editView.wholeBook")}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => exportControls.onExportFull("markdown")}
                        disabled={exportControls.isExportingFullMarkdown}
                      >
                        {exportControls.isExportingFullMarkdown ? t("common.exporting") : "Markdown"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportControls.onExportFull("json")}
                        disabled={exportControls.isExportingFullJson}
                      >
                        {exportControls.isExportingFullJson ? t("common.exporting") : "JSON"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>

            <DirectorFactDebugDialog novelId={id} taskId={taskDrawer?.task?.id ?? null} />

            <Dialog open={isProjectToolsOpen} onOpenChange={setIsProjectToolsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">{t("editView.projectTools")}</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl overflow-auto">
                <DialogHeader>
                  <DialogTitle>{t("editView.projectTools")}</DialogTitle>
                  <DialogDescription>
                    {t("editView.projectToolsDesc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("editView.chapterProgress")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{t("editView.chaptersGenerated", { generated: generatedChapters, total: Math.max(totalChapters, 1) })}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("editView.pendingRepairChapters")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{pendingRepairs}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("editView.currentModel")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{currentModel}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("editView.recentTaskTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{pipelineTab.pipelineJob?.status ?? "idle"}</p>
                    </CardContent>
                  </Card>
                </div>
                <KnowledgeBindingPanel targetType="novel" targetId={id} title={t("editView.referenceKnowledge")} />

                {/* Dev tools area - visible only in DEV environment */}
                {import.meta.env.DEV ? (
                  <Card className="border-dashed border-yellow-500/60 bg-yellow-50/30 dark:bg-yellow-950/10">
                    <CardHeader>
                      <CardTitle className="text-sm text-yellow-700 dark:text-yellow-400">{t("editView.devToolsTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {t("editView.devToolsResetNote")}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-yellow-500/60 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                        disabled={resetChaptersMutation.isPending}
                        onClick={() => {
                          if (window.confirm(t("editView.resetConfirm", { count: totalChapters }))) {
                            resetChaptersMutation.mutate();
                          }
                        }}
                      >
                        {resetChaptersMutation.isPending
                          ? <><Loader2 className="animate-spin" />{t("editView.resetting")}</>
                          : <><RotateCcw />{t("editView.resetAllChapters")}</>}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </DialogContent>
            </Dialog>

            <Button
              variant={taskDrawer?.task?.status === "failed" ? "destructive" : "secondary"}
              onClick={() => taskDrawer?.onOpenChange(true)}
            >
              {t("common.executionDetails")}
              {taskAttentionLabel ? <Badge variant="secondary">{taskAttentionLabel}</Badge> : null}
            </Button>
            </>
          )}
        />
      ) : null}

      <div className="space-y-4 pt-1">
        {takeover ? (
          <AITakeoverContainer
            mode={takeover.mode}
            title={takeover.title}
            description={takeover.description}
            progress={takeover.progress}
            currentAction={takeover.currentAction}
            checkpointLabel={takeover.checkpointLabel}
            taskId={takeover.taskId}
            actions={takeover.actions}
          >
            {renderActivePanel()}
          </AITakeoverContainer>
        ) : (
          renderActivePanel()
        )}
      </div>

      {taskDrawer ? <NovelTaskDrawer {...taskDrawer} /> : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { buildStyleIntentSummary } from "@ai-novel/shared/types/styleEngine";
import { normalizeCommercialTags } from "@ai-novel/shared/types/novelFraming";
import type {
  DirectorAutoExecutionPlan,
  DirectorRunMode,
  DirectorTakeoverEntryStep,
  DirectorTakeoverStrategy,
} from "@ai-novel/shared/types/novelDirector";
import { buildFullBookAutopilotExecutionPlan } from "@ai-novel/shared/types/novelDirector";
import { getDirectorTaskSnapshot, getDirectorTakeoverReadiness, startDirectorTakeover } from "@/api/novelDirector";
import { queryKeys } from "@/api/queryKeys";
import { getStyleBindings, getStyleProfiles } from "@/api/styleEngine";
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
import { toast } from "@/components/ui/toast";
import AutoDirectorApprovalStrategyPanel from "@/components/autoDirector/AutoDirectorApprovalStrategyPanel";
import { useLLMStore } from "@/store/llmStore";
import { Switch } from "@/components/ui/switch";
import type { NovelBasicFormState } from "../novelBasicInfo.shared";
import {
  buildTakeoverAutoExecutionDraftFromExecutableRange,
  DirectorAutoExecutionPlanFields,
  buildDirectorAutoExecutionPlanFromDraft,
  buildDirectorAutoExecutionPlanLabel,
  createDefaultDirectorAutoExecutionDraftState,
} from "./directorAutoExecutionPlan.shared";
import {
  buildTakeoverChapterTarget,
  buildTakeoverProgressInspection,
  buildTakeoverGuidance,
  findTakeoverPreview,
  formatTakeoverStartError,
  isTakeoverEntryStepAllowedForScope,
  resolveRecommendedTakeoverEntryStep,
} from "./novelExistingProjectTakeoverViewModel";
import TakeoverContextSummaryPanel from "./takeover/TakeoverContextSummaryPanel";
import TakeoverDiagnosisPanel from "./takeover/TakeoverDiagnosisPanel";
import { useDirectorAutoApprovalDraft } from "./useDirectorAutoApprovalDraft";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";
import SelectControl from "@/components/common/SelectControl";

interface NovelExistingProjectTakeoverDialogProps {
  novelId: string;
  basicForm: NovelBasicFormState;
  genreOptions: Array<{ id: string; path: string; label: string }>;
  storyModeOptions: Array<{ id: string; path: string; name: string }>;
  worldOptions: Array<{ id: string; name: string }>;
  triggerVariant?: "default" | "outline" | "secondary";
  defaultEntryStep?: DirectorTakeoverEntryStep;
  workflowTaskId?: string | null;
}

const RUN_MODE_OPTIONS: Array<{ value: DirectorRunMode; labelKey: string; descriptionKey: string }> = [
  {
    value: "full_book_autopilot",
    labelKey: "takeoverDialog.runModeOption.fullBook.label",
    descriptionKey: "takeoverDialog.runModeOption.fullBook.desc",
  },
  {
    value: "auto_to_ready",
    labelKey: "takeoverDialog.runModeOption.toReady.label",
    descriptionKey: "takeoverDialog.runModeOption.toReady.desc",
  },
  {
    value: "auto_to_execution",
    labelKey: "takeoverDialog.runModeOption.byRange.label",
    descriptionKey: "takeoverDialog.runModeOption.byRange.desc",
  },
];

const STRATEGY_OPTIONS: Array<{ value: DirectorTakeoverStrategy; labelKey: string; descriptionKey: string }> = [
  {
    value: "continue_existing",
    labelKey: "takeoverDialog.strategyOption.continue.label",
    descriptionKey: "takeoverDialog.strategyOption.continue.desc",
  },
  {
    value: "restart_current_step",
    labelKey: "takeoverDialog.strategyOption.restart.label",
    descriptionKey: "takeoverDialog.strategyOption.restart.desc",
  },
];

function summarizeCurrentContext(
  t: TFunction,
  basicForm: NovelBasicFormState,
  genreOptions: Array<{ id: string; path: string; label: string }>,
  storyModeOptions: Array<{ id: string; path: string; name: string }>,
  worldOptions: Array<{ id: string; name: string }>,
): string[] {
  const commercialTags = normalizeCommercialTags(basicForm.commercialTagsText);
  const genrePath = genreOptions.find((item) => item.id === basicForm.genreId)?.path ?? basicForm.genreId;
  const primaryStoryModePath = storyModeOptions.find((item) => item.id === basicForm.primaryStoryModeId)?.path ?? basicForm.primaryStoryModeId;
  const worldName = worldOptions.find((item) => item.id === basicForm.worldId)?.name ?? basicForm.worldId;
  return [
    basicForm.description.trim() ? t("takeoverDialog.context.overview", { value: basicForm.description.trim() }) : "",
    basicForm.targetAudience.trim() ? t("takeoverDialog.context.targetAudience", { value: basicForm.targetAudience.trim() }) : "",
    basicForm.bookSellingPoint.trim() ? t("takeoverDialog.context.sellingPoint", { value: basicForm.bookSellingPoint.trim() }) : "",
    genrePath ? t("takeoverDialog.context.genre", { value: genrePath }) : "",
    primaryStoryModePath ? t("takeoverDialog.context.primaryMode", { value: primaryStoryModePath }) : "",
    worldName ? t("takeoverDialog.context.worldSample", { value: worldName }) : "",
    commercialTags.length > 0 ? t("takeoverDialog.context.commercialTags", { value: commercialTags.join(" / ") }) : "",
  ].filter(Boolean);
}

function buildEditRoute(input: {
  novelId: string;
  workflowTaskId: string;
  stage?: string | null;
  chapterId?: string | null;
  volumeId?: string | null;
}): string {
  const search = new URLSearchParams();
  search.set("directorTaskId", input.workflowTaskId);
  if (input.stage) search.set("stage", input.stage);
  if (input.chapterId) search.set("chapterId", input.chapterId);
  if (input.volumeId) search.set("volumeId", input.volumeId);
  return `/novels/${input.novelId}/edit?${search.toString()}`;
}

export default function NovelExistingProjectTakeoverDialog({
  novelId,
  basicForm,
  genreOptions,
  storyModeOptions,
  worldOptions,
  triggerVariant = "outline",
  defaultEntryStep = "basic",
  workflowTaskId,
}: NovelExistingProjectTakeoverDialogProps) {
  const { t, i18n } = useTranslation("novelsEditC");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const llm = useLLMStore();
  const [open, setOpen] = useState(false);
  const [runMode, setRunMode] = useState<DirectorRunMode>("auto_to_ready");
  const [selectedEntryStep, setSelectedEntryStep] = useState<DirectorTakeoverEntryStep>(defaultEntryStep);
  const [selectedStrategy, setSelectedStrategy] = useState<DirectorTakeoverStrategy>("continue_existing");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [autoExecutionDraft, setAutoExecutionDraft] = useState(() => createDefaultDirectorAutoExecutionDraftState("takeover"));
  const [autoExecutionDraftTouched, setAutoExecutionDraftTouched] = useState(false);
  const [selectedChapterTargetOrder, setSelectedChapterTargetOrder] = useState<number | null>(null);
  const [selectedStyleProfileId, setSelectedStyleProfileId] = useState("");
  const [postGenerationStyleReviewEnabled, setPostGenerationStyleReviewEnabled] = useState(
    basicForm.postGenerationStyleReviewEnabled,
  );
  const autoApprovalDraft = useDirectorAutoApprovalDraft(open);
  const { reset: resetAutoApprovalDraft } = autoApprovalDraft;

  const readinessQuery = useQuery({
    queryKey: queryKeys.novels.autoDirectorTakeoverReadiness(novelId),
    queryFn: () => getDirectorTakeoverReadiness(novelId),
    enabled: open && Boolean(novelId),
    retry: false,
  });
  const contextTaskId = workflowTaskId?.trim() || "";
  const contextTaskSnapshotQuery = useQuery({
    queryKey: queryKeys.tasks.directorTaskSnapshot(contextTaskId || "none"),
    queryFn: () => getDirectorTaskSnapshot(contextTaskId),
    enabled: open && Boolean(contextTaskId),
    retry: false,
  });
  const styleProfilesQuery = useQuery({
    queryKey: queryKeys.styleEngine.profiles,
    queryFn: getStyleProfiles,
    enabled: open,
  });
  const novelStyleBindingsQuery = useQuery({
    queryKey: queryKeys.styleEngine.bindings(`novel-${novelId}`),
    queryFn: () => getStyleBindings({ targetType: "novel", targetId: novelId }),
    enabled: open && Boolean(novelId),
  });

  const readiness = readinessQuery.data?.data ?? null;
  const contextTaskSnapshot = contextTaskSnapshotQuery.data?.data?.snapshot ?? null;
  const contextTaskIsContinuable = Boolean(
    contextTaskSnapshot?.task
    && ["queued", "running", "waiting_approval"].includes(contextTaskSnapshot.task.status),
  );
  const styleProfiles = styleProfilesQuery.data?.data ?? [];
  const currentNovelStyleBindings = novelStyleBindingsQuery.data?.data ?? [];
  const selectedStyleProfile = useMemo(
    () => styleProfiles.find((item) => item.id === selectedStyleProfileId) ?? null,
    [selectedStyleProfileId, styleProfiles],
  );
  const selectedStyleSummary = useMemo(
    () => buildStyleIntentSummary({
      styleProfile: selectedStyleProfile,
      styleTone: basicForm.styleTone,
    }),
    [basicForm.styleTone, selectedStyleProfile],
  );
  const contextLines = useMemo(
    () => summarizeCurrentContext(t, basicForm, genreOptions, storyModeOptions, worldOptions),
    [t, i18n.language, basicForm, genreOptions, storyModeOptions, worldOptions],
  );
  const advancedAutoExecutionPlan: DirectorAutoExecutionPlan | undefined = runMode === "full_book_autopilot"
    ? buildFullBookAutopilotExecutionPlan()
    : runMode === "auto_to_execution"
      ? buildDirectorAutoExecutionPlanFromDraft(autoExecutionDraft, { usage: "takeover" })
      : undefined;
  const quickChapterTarget = useMemo(
    () => buildTakeoverChapterTarget(readiness, contextTaskSnapshot, selectedChapterTargetOrder),
    [contextTaskSnapshot, readiness, selectedChapterTargetOrder, i18n.language],
  );
  const effectiveRunMode: DirectorRunMode = !advancedOpen && quickChapterTarget ? "auto_to_execution" : runMode;
  const autoExecutionPlan: DirectorAutoExecutionPlan | undefined = !advancedOpen && quickChapterTarget
    ? quickChapterTarget.plan
    : advancedAutoExecutionPlan;
  const selectedScopeMode = effectiveRunMode === "auto_to_execution" || effectiveRunMode === "full_book_autopilot"
    ? autoExecutionPlan?.mode ?? autoExecutionDraft.mode
    : "book";
  const recommendedEntryStep = resolveRecommendedTakeoverEntryStep(readiness, selectedScopeMode);
  const effectiveEntryStep = advancedOpen ? selectedEntryStep : recommendedEntryStep ?? selectedEntryStep;
  const selectedEntry = readiness?.entrySteps.find((item) => item.step === effectiveEntryStep) ?? null;
  const selectedPreview = findTakeoverPreview(readiness, effectiveEntryStep, selectedStrategy);
  const selectedEntryAllowedForScope = isTakeoverEntryStepAllowedForScope(effectiveEntryStep, selectedScopeMode);
  const takeoverGuidance = buildTakeoverGuidance(
    readiness,
    effectiveEntryStep,
    selectedStrategy,
    effectiveRunMode,
    contextTaskIsContinuable ? contextTaskSnapshot : null,
  );
  const progressInspection = buildTakeoverProgressInspection(readiness, contextTaskSnapshot);
  const readinessErrorMessage = readinessQuery.isError
    ? readinessQuery.error instanceof Error ? readinessQuery.error.message : t("takeoverDialog.readReadinessFailed")
    : null;

  const enterCurrentTask = () => {
    setOpen(false);
    const targetTaskId = (contextTaskIsContinuable ? contextTaskSnapshot?.task.id : null) ?? readiness?.activeTaskId ?? "";
    if (targetTaskId) {
      navigate(buildEditRoute({
        novelId,
        workflowTaskId: targetTaskId,
        stage: effectiveEntryStep === "basic" ? "basic" : effectiveEntryStep,
      }));
      return;
    }
    const search = new URLSearchParams();
    search.set("stage", effectiveEntryStep === "basic" ? "basic" : effectiveEntryStep);
    navigate(`/novels/${novelId}/edit?${search.toString()}`);
  };

  useEffect(() => {
    if (!open) {
      setSelectedEntryStep(defaultEntryStep);
      setSelectedStrategy("continue_existing");
      setRunMode("auto_to_ready");
      setAdvancedOpen(false);
      setAutoExecutionDraft(createDefaultDirectorAutoExecutionDraftState("takeover"));
      setAutoExecutionDraftTouched(false);
      setSelectedChapterTargetOrder(null);
      setSelectedStyleProfileId("");
      setPostGenerationStyleReviewEnabled(basicForm.postGenerationStyleReviewEnabled);
      resetAutoApprovalDraft();
    }
  }, [basicForm.postGenerationStyleReviewEnabled, defaultEntryStep, open, resetAutoApprovalDraft]);

  useEffect(() => {
    if (open) {
      setPostGenerationStyleReviewEnabled(basicForm.postGenerationStyleReviewEnabled);
    }
  }, [basicForm.postGenerationStyleReviewEnabled, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const currentBookBinding = currentNovelStyleBindings[0];
    if (currentBookBinding?.styleProfileId) {
      setSelectedStyleProfileId((current) => current || currentBookBinding.styleProfileId);
    }
  }, [currentNovelStyleBindings, open]);

  useEffect(() => {
    if (!open || !quickChapterTarget) {
      return;
    }
    setSelectedChapterTargetOrder((current) => (
      current === quickChapterTarget.selectedOrder ? current : quickChapterTarget.selectedOrder
    ));
  }, [open, quickChapterTarget]);

  useEffect(() => {
    if (!readiness) {
      return;
    }
    const recommendedStep = resolveRecommendedTakeoverEntryStep(readiness, selectedScopeMode);
    if (recommendedStep) {
      setSelectedEntryStep((current) => {
        const currentStep = readiness.entrySteps.find((item) => item.step === current);
        return currentStep?.available && isTakeoverEntryStepAllowedForScope(current, selectedScopeMode)
          ? current
          : recommendedStep;
      });
    }
  }, [readiness, selectedScopeMode]);

  useEffect(() => {
    if (!open || runMode !== "auto_to_execution" || autoExecutionDraftTouched) {
      return;
    }
    const preferredDraft = buildTakeoverAutoExecutionDraftFromExecutableRange(
      readiness?.executableRange,
      selectedStrategy,
    );
    if (!preferredDraft) {
      return;
    }
    setAutoExecutionDraft((current) => ({
      ...preferredDraft,
      autoReview: current.autoReview,
      autoRepair: current.autoReview ? current.autoRepair : false,
    }));
  }, [
    autoExecutionDraftTouched,
    open,
    readiness?.executableRange,
    runMode,
    selectedStrategy,
  ]);

  const startMutation = useMutation({
    mutationFn: async () => startDirectorTakeover({
      novelId,
      entryStep: effectiveEntryStep,
      strategy: selectedStrategy,
      styleProfileId: selectedStyleProfileId || undefined,
      provider: llm.provider,
      model: llm.model,
      temperature: llm.temperature,
      runMode: effectiveRunMode,
      autoExecutionPlan,
      autoApproval: autoApprovalDraft.buildPayload(effectiveRunMode),
      postGenerationStyleReviewEnabled,
    }),
    onSuccess: async (response) => {
      const data = response.data;
      if (!data?.taskId) {
        toast.error(t("takeoverDialog.startFailedNoTask"));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.autoDirectorTask(novelId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.detail(novelId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.directorBookAutomation(novelId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.autoDirectorTakeoverReadiness(novelId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.styleEngine.bindings(`novel-${novelId}`) });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setOpen(false);
      toast.success(
        effectiveRunMode === "full_book_autopilot"
          ? t("takeoverDialog.submittedFullBook")
          : effectiveRunMode === "auto_to_execution"
          ? t("takeoverDialog.submittedRange", { label: buildDirectorAutoExecutionPlanLabel(autoExecutionPlan) })
          : t("takeoverDialog.submittedQueued"),
      );
      navigate(buildEditRoute({
        novelId,
        workflowTaskId: data.taskId,
        stage: effectiveEntryStep === "basic" ? "basic" : effectiveEntryStep,
      }));
    },
    onError: (error) => {
      toast.error(formatTakeoverStartError(error));
    },
  });
  const startDisabled = startMutation.isPending
    || readinessQuery.isLoading
    || !selectedEntry
    || !selectedEntry.available
    || !selectedEntryAllowedForScope;

  return (
    <>
      <Button type="button" variant={triggerVariant} size="sm" onClick={() => setOpen(true)}>
        {t("takeover.aiTakeover")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={AUTO_DIRECTOR_MOBILE_CLASSES.takeoverDialogContent}>
          <DialogHeader className="shrink-0 border-b px-4 pb-4 pr-12 pt-5 text-left sm:px-6 sm:pt-6">
            <DialogTitle>{t("takeoverDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("takeoverDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className={AUTO_DIRECTOR_MOBILE_CLASSES.dialogBody}>
            <div className="min-w-0 space-y-4">
              <TakeoverContextSummaryPanel lines={contextLines} />
              <TakeoverDiagnosisPanel
                guidance={takeoverGuidance}
                inspection={progressInspection}
                isLoadingReadiness={readinessQuery.isLoading}
                readinessErrorMessage={readinessErrorMessage}
                isLoadingTaskSnapshot={contextTaskSnapshotQuery.isLoading}
                hasTaskSnapshotError={contextTaskSnapshotQuery.isError}
                hasCurrentTask={Boolean(readiness?.hasActiveTask || contextTaskIsContinuable)}
                chapterTarget={quickChapterTarget}
                isAdvancedOpen={advancedOpen}
                isStarting={startMutation.isPending}
                startDisabled={startDisabled}
                onEnterCurrentTask={enterCurrentTask}
                onChapterTargetChange={(order) => setSelectedChapterTargetOrder(order)}
                onStart={() => startMutation.mutate()}
              />
              <details
                className="min-w-0 rounded-xl border bg-background/80 p-3 sm:p-4"
                open={advancedOpen}
                onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
              >
                <summary className="cursor-pointer text-sm font-medium text-foreground">
                  {t("takeoverDialog.advancedSettings")}
                </summary>
                <div className="mt-4 space-y-4">
              <div className="min-w-0 rounded-xl border bg-background/80 p-3 sm:p-4">
                <div className="text-sm font-medium text-foreground">{t("takeoverDialog.modelSettings")}</div>
                <div className="mt-3"><LLMSelector /></div>
              </div>
              <div className="min-w-0 rounded-xl border bg-background/80 p-3 sm:p-4">
                <div className="text-sm font-medium text-foreground">{t("takeoverDialog.runModeSection")}</div>
                <div className="mt-3 rounded-lg border bg-muted/15 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">{t("takeoverDialog.postReviewTitle")}</div>
                      <div className={`text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                        {t("takeoverDialog.postReviewDesc")}
                      </div>
                    </div>
                    <Switch
                      aria-label={t("takeoverDialog.postReviewTitle")}
                      checked={postGenerationStyleReviewEnabled}
                      onCheckedChange={setPostGenerationStyleReviewEnabled}
                    />
                  </div>
                </div>
                <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                  {RUN_MODE_OPTIONS.map((option) => {
                    const active = option.value === runMode;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-background hover:border-primary/40"
                        }`}
                        onClick={() => setRunMode(option.value)}
                      >
                        <div className="text-sm font-medium text-foreground">{t(option.labelKey)}</div>
                        <div className={`mt-1 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{t(option.descriptionKey)}</div>
                      </button>
                    );
                  })}
                </div>
                {runMode === "auto_to_execution" ? (
                  <>
                    <DirectorAutoExecutionPlanFields
                      draft={autoExecutionDraft}
                      onChange={(patch) => {
                        setAutoExecutionDraftTouched(true);
                        setAutoExecutionDraft((prev) => ({ ...prev, ...patch }));
                      }}
                      usage="takeover"
                    />
                    <AutoDirectorApprovalStrategyPanel
                      enabled={autoApprovalDraft.enabled}
                      approvalPointCodes={autoApprovalDraft.codes}
                      groups={autoApprovalDraft.groups}
                      approvalPoints={autoApprovalDraft.points}
                      onEnabledChange={autoApprovalDraft.setEnabled}
                      onApprovalPointCodesChange={autoApprovalDraft.setCodes}
                    />
                  </>
                ) : null}
                {runMode === "full_book_autopilot" ? (
                  <div className={`mt-3 rounded-md border border-primary/15 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                    <div className="text-sm font-medium text-foreground">{t("takeoverDialog.fullBookTitle")}</div>
                    <div className="mt-1">
                      {t("takeoverDialog.fullBookDesc")}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 rounded-xl border bg-background/80 p-3 sm:p-4">
                <div className="text-sm font-medium text-foreground">{t("takeoverDialog.styleSection")}</div>
                <div className={`mt-1 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                  {t("takeoverDialog.styleSectionDesc")}
                </div>
                <div className="mt-3 space-y-3">
                  <SelectControl
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={selectedStyleProfileId}
                    onChange={(event) => setSelectedStyleProfileId(event.target.value)}
                  >
                    <option value="">{t("takeoverDialog.styleKeywordsOnly")}</option>
                    {styleProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>{profile.name}</option>
                    ))}
                  </SelectControl>
                  {currentNovelStyleBindings.length > 0 ? (
                    <div className={`rounded-lg border bg-muted/15 p-3 text-xs leading-6 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                      {t("takeoverDialog.currentBookStyle", { value: currentNovelStyleBindings
                        .map((binding) => binding.styleProfile?.name ?? binding.styleProfileId)
                        .join(" / ") })}
                    </div>
                  ) : null}
                  {selectedStyleSummary?.stageSummaryLines.length ? (
                    <div className={`rounded-lg border bg-muted/15 p-3 text-xs leading-6 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                      {t("takeoverDialog.stageStyleSummary", { value: selectedStyleSummary.stageSummaryLines.join(t("takeoverDialog.semicolonSeparator")) })}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 rounded-xl border bg-background/80 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-foreground">{t("takeoverDialog.resumePosition")}</div>
                  {readinessQuery.isLoading ? <Badge variant="outline">{t("takeoverDialog.loadingBadge")}</Badge> : null}
                </div>
                {readinessQuery.isError ? (
                  <div className={`mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                    {readinessQuery.error instanceof Error ? readinessQuery.error.message : t("takeoverDialog.readReadinessFailed")}
                  </div>
                ) : null}

                {readiness ? (
                  <>
                    <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border bg-muted/15 p-3">
                        <div className="text-xs text-muted-foreground">{t("takeoverDialog.snapshot.bookPlan")}</div>
                        <div className="mt-1 text-sm font-medium text-foreground">{readiness.snapshot.hasStoryMacroPlan ? t("takeoverDialog.hasIt") : t("takeoverDialog.notYet")}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/15 p-3">
                        <div className="text-xs text-muted-foreground">{t("takeoverDialog.snapshot.contract")}</div>
                        <div className="mt-1 text-sm font-medium text-foreground">{readiness.snapshot.hasBookContract ? t("takeoverDialog.hasIt") : t("takeoverDialog.notYet")}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/15 p-3">
                        <div className="text-xs text-muted-foreground">{t("takeoverDialog.snapshot.characterCount")}</div>
                        <div className="mt-1 text-sm font-medium text-foreground">{readiness.snapshot.characterCount}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/15 p-3">
                        <div className="text-xs text-muted-foreground">{t("takeoverDialog.snapshot.volumeChapters")}</div>
                        <div className="mt-1 text-sm font-medium text-foreground">{readiness.snapshot.volumeCount} / {readiness.snapshot.firstVolumeChapterCount}</div>
                      </div>
                    </div>

                    {readiness.hasActiveTask ? (
                      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                        <div className="text-sm font-medium text-foreground">{t("takeoverDialog.hasActiveTask")}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{t("takeoverDialog.hasActiveTaskDesc")}</div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              setOpen(false);
                              if (readiness.activeTaskId) {
                                navigate(buildEditRoute({
                                  novelId,
                                  workflowTaskId: readiness.activeTaskId,
                                  stage: effectiveEntryStep === "basic" ? "basic" : effectiveEntryStep,
                                }));
                                return;
                              }
                              const search = new URLSearchParams();
                              search.set("stage", effectiveEntryStep === "basic" ? "basic" : effectiveEntryStep);
                              navigate(`/novels/${novelId}/edit?${search.toString()}`);
                            }}
                          >
                            {t("takeoverDialog.handleCurrentTask")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {readiness.entrySteps.map((entry) => {
                            const active = entry.step === selectedEntryStep;
                            const allowedForScope = isTakeoverEntryStepAllowedForScope(entry.step, selectedScopeMode);
                            const disabled = !entry.available || !allowedForScope || startMutation.isPending;
                            return (
                              <button
                                key={entry.step}
                                type="button"
                                disabled={disabled}
                                className={`min-w-0 rounded-xl border px-4 py-4 text-left transition ${
                                  active ? "border-primary bg-primary/10 shadow-sm" : !disabled ? "border-border bg-background hover:border-primary/40" : "border-border/60 bg-muted/20 opacity-70"
                                }`}
                                onClick={() => setSelectedEntryStep(entry.step)}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">{entry.label}</div>
                                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    {entry.recommended ? <Badge>{t("takeoverDialog.recommended")}</Badge> : null}
                                    <Badge variant="outline">{entry.status}</Badge>
                                  </div>
                                </div>
                                <div className={`mt-2 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{entry.description}</div>
                                <div className={`mt-3 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                                  {allowedForScope ? entry.reason : t("takeoverDialog.scopeNotAllowed")}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
                          {STRATEGY_OPTIONS.map((option) => {
                            const active = option.value === selectedStrategy;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                className={`min-w-0 rounded-xl border px-4 py-4 text-left transition ${
                                  active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-background hover:border-primary/40"
                                }`}
                                onClick={() => setSelectedStrategy(option.value)}
                              >
                                <div className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">{t(option.labelKey)}</div>
                                <div className={`mt-2 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{t(option.descriptionKey)}</div>
                              </button>
                            );
                          })}
                        </div>

                        {selectedEntry ? (
                          <div className="mt-4 min-w-0 rounded-xl border bg-muted/15 p-3 sm:p-4">
                            <div className="text-sm font-medium text-foreground">{t("takeoverDialog.previewTitle")}</div>
                            <div className={`mt-2 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{selectedPreview?.summary ?? selectedEntry.reason}</div>
                            <div className={`mt-3 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{selectedPreview?.effectSummary ?? selectedEntry.description}</div>
                            {selectedPreview ? (
                              <>
                                <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                                  <Badge variant="secondary" className="max-w-full whitespace-normal break-words text-left [overflow-wrap:anywhere]">{t("takeoverDialog.preview.currentPage", { value: selectedEntry.label })}</Badge>
                                  <Badge variant="outline" className="max-w-full whitespace-normal break-words text-left [overflow-wrap:anywhere]">{t("takeoverDialog.preview.effectiveStep", { value: selectedPreview.effectiveStep })}</Badge>
                                  <Badge variant="outline" className="max-w-full whitespace-normal break-words text-left [overflow-wrap:anywhere]">{t("takeoverDialog.preview.effectiveStage", { value: selectedPreview.effectiveStage })}</Badge>
                                  {selectedPreview.usesCurrentBatch ? <Badge>{t("takeoverDialog.preview.resumeBatch")}</Badge> : null}
                                </div>
                                {readiness.activePipelineJob ? (
                                  <div className={`mt-3 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                                    {t("takeoverDialog.preview.activeBatch", { value: readiness.activePipelineJob.currentItemLabel || t("takeoverDialog.preview.rangeLabel", { start: readiness.activePipelineJob.startOrder, end: readiness.activePipelineJob.endOrder }) })}
                                  </div>
                                ) : null}
                                {readiness.latestCheckpoint?.checkpointType ? (
                                  <div className={`mt-2 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                                    {t("takeoverDialog.preview.latestCheckpoint", { value: readiness.latestCheckpoint.checkpointType })}
                                    {readiness.latestCheckpoint.chapterOrder ? t("takeoverDialog.preview.chapterSuffix", { order: readiness.latestCheckpoint.chapterOrder }) : ""}
                                  </div>
                                ) : null}
                                {readiness.executableRange ? (
                                  <div className={`mt-2 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                                    {t("takeoverDialog.preview.executableRange", { start: readiness.executableRange.startOrder, end: readiness.executableRange.endOrder })}
                                    {readiness.executableRange.nextChapterOrder ? t("takeoverDialog.preview.nextChapterSuffix", { order: readiness.executableRange.nextChapterOrder }) : ""}
                                  </div>
                                ) : null}
                                {selectedPreview.skipSteps.length > 0 ? (
                                  <div className={`mt-3 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{t("takeoverDialog.preview.willSkip", { value: selectedPreview.skipSteps.join(" / ") })}</div>
                                ) : null}
                                <div className={`mt-3 space-y-1 text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                                  {selectedPreview.impactNotes.map((note) => <div key={note}>• {note}</div>)}
                                </div>
                              </>
                            ) : null}
                          </div>
                        ) : null}

                        <div className={AUTO_DIRECTOR_MOBILE_CLASSES.takeoverSubmitBar}>
                          <Button
                            type="button"
                            className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}
                            disabled={startMutation.isPending || !selectedEntry || !selectedEntry.available || !selectedEntryAllowedForScope}
                            onClick={() => startMutation.mutate()}
                          >
                            {startMutation.isPending ? t("takeoverDialog.starting") : t("takeoverDialog.startByAdvanced")}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                ) : null}
              </div>
                </div>
              </details>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

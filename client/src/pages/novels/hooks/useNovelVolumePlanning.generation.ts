import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import type { ApiResponse } from "@ai-novel/shared/types/api";
import type {
  VolumeBeatSheet,
  VolumeCritiqueReport,
  VolumePlan,
  VolumePlanDocument,
  VolumePlanningReadiness,
  VolumeRebalanceDecision,
  VolumeStrategyPlan,
} from "@ai-novel/shared/types/novel";
import type { LLMProvider } from "@ai-novel/shared/types/llm";
import {
  generateNovelVolumes,
  getNovelVolumeWorkspace,
  updateNovelVolumes,
  type NovelDetailResponse,
} from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import { syncNovelWorkflowStageSilently } from "../novelWorkflow.client";
import { normalizeVolumeDraft } from "../volumePlan.utils";
import { detailModeLabel } from "../chapterDetailPlanning.shared";
import {
  buildChapterListSuccessMessage,
  type VolumeGenerationPayload,
} from "./useNovelVolumePlanning.actions";
import { serializeVolumeWorkspaceSnapshot } from "./useNovelVolumePlanning.utils";
import i18n from "@/i18n";

interface LlmSettings {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
}

interface UseVolumeGenerationMutationArgs {
  novelId: string;
  llm: LlmSettings;
  estimatedChapterCount?: number | null;
  normalizedVolumeDraft: VolumePlan[];
  strategyPlan: VolumeStrategyPlan | null;
  critiqueReport: VolumeCritiqueReport | null;
  beatSheets: VolumeBeatSheet[];
  rebalanceDecisions: VolumeRebalanceDecision[];
  savedWorkspace?: VolumePlanDocument | null;
  readiness: VolumePlanningReadiness;
  userPreferredVolumeCount: number | null;
  forceSystemRecommendedVolumeCount: boolean;
  setVolumeDraft: Dispatch<SetStateAction<VolumePlan[]>>;
  setStrategyPlan: Dispatch<SetStateAction<VolumeStrategyPlan | null>>;
  setCritiqueReport: Dispatch<SetStateAction<VolumeCritiqueReport | null>>;
  setBeatSheets: Dispatch<SetStateAction<VolumeBeatSheet[]>>;
  setRebalanceDecisions: Dispatch<SetStateAction<VolumeRebalanceDecision[]>>;
  setVolumeGenerationMessage: (value: string) => void;
  setStructuredMessage: (value: string) => void;
}

export interface GeneratedVolumeMutationResult {
  generatedResponse: Awaited<ReturnType<typeof generateNovelVolumes>>;
  persistedResponse: Awaited<ReturnType<typeof updateNovelVolumes>>;
  nextDocument: VolumePlanDocument;
  autoSyncedToChapterExecution: boolean;
}

interface VolumeGenerationMutationContext {
  persistedWorkspaceSnapshotBefore: string;
}

class VolumeGenerationAutoSaveError extends Error {
  nextDocument: VolumePlanDocument;

  constructor(message: string, nextDocument: VolumePlanDocument) {
    super(message);
    this.name = "VolumeGenerationAutoSaveError";
    this.nextDocument = nextDocument;
  }
}

function shouldAutoSyncGeneratedScope(scope: VolumeGenerationPayload["scope"]): boolean {
  return scope === "chapter_list" || scope === "volume" || scope === "chapter_detail";
}

function shouldRequestSlimVolumeGenerationResponse(scope: VolumeGenerationPayload["scope"]): boolean {
  return scope === "beat_sheet"
    || scope === "chapter_list"
    || scope === "volume"
    || scope === "rebalance"
    || scope === "chapter_detail";
}

function mergeSavedVolumeDocumentIntoNovelDetail(
  previous: ApiResponse<NovelDetailResponse> | undefined,
  document: VolumePlanDocument,
): ApiResponse<NovelDetailResponse> | undefined {
  if (!previous?.data) {
    return previous;
  }
  return {
    ...previous,
    data: {
      ...previous.data,
      outline: document.derivedOutline,
      structuredOutline: document.derivedStructuredOutline,
      volumes: document.volumes,
      volumeSource: document.source,
      activeVolumeVersionId: document.activeVersionId,
    },
  };
}

function isSlimVolumeGenerationResponse(
  document: Awaited<ReturnType<typeof generateNovelVolumes>>["data"],
): document is VolumePlanDocument & { slimmed: true } {
  return Boolean(document && "slimmed" in document && document.slimmed === true);
}

export function useVolumeGenerationMutation({
  novelId,
  llm,
  estimatedChapterCount,
  normalizedVolumeDraft,
  strategyPlan,
  critiqueReport,
  beatSheets,
  rebalanceDecisions,
  savedWorkspace,
  readiness,
  userPreferredVolumeCount,
  forceSystemRecommendedVolumeCount,
  setVolumeDraft,
  setStrategyPlan,
  setCritiqueReport,
  setBeatSheets,
  setRebalanceDecisions,
  setVolumeGenerationMessage,
  setStructuredMessage,
}: UseVolumeGenerationMutationArgs) {
  const queryClient = useQueryClient();

  const applyWorkspaceDocument = (document: VolumePlanDocument) => {
    setVolumeDraft(document.volumes);
    setStrategyPlan(document.strategyPlan);
    setCritiqueReport(document.critiqueReport);
    setBeatSheets(document.beatSheets);
    setRebalanceDecisions(document.rebalanceDecisions);
  };

  const syncSavedVolumeDocumentToCache = (document: VolumePlanDocument) => {
    queryClient.setQueryData<ApiResponse<NovelDetailResponse> | undefined>(
      queryKeys.novels.detail(novelId),
      (previous) => mergeSavedVolumeDocumentIntoNovelDetail(previous, document),
    );
    queryClient.setQueryData<ApiResponse<VolumePlanDocument>>(
      queryKeys.novels.volumeWorkspace(novelId),
      () => ({
        success: true,
        message: "Volume workspace updated.",
        data: document,
      }),
    );
  };

  const hydratePersistedWorkspace = (document: VolumePlanDocument) => {
    applyWorkspaceDocument(document);
    syncSavedVolumeDocumentToCache(document);
  };

  return useMutation<
    GeneratedVolumeMutationResult,
    Error,
    VolumeGenerationPayload,
    VolumeGenerationMutationContext
  >({
    onMutate: (): VolumeGenerationMutationContext => ({
      persistedWorkspaceSnapshotBefore: serializeVolumeWorkspaceSnapshot(
        queryClient.getQueryData<ApiResponse<VolumePlanDocument>>(queryKeys.novels.volumeWorkspace(novelId))?.data
        ?? savedWorkspace
        ?? null,
      ),
    }),
    mutationFn: async (payload: VolumeGenerationPayload): Promise<GeneratedVolumeMutationResult> => {
      const requestDraft = normalizeVolumeDraft(payload.draftVolumesOverride ?? normalizedVolumeDraft);
      const autoSyncedToChapterExecution = shouldAutoSyncGeneratedScope(payload.scope);
      const generatedResponse = await generateNovelVolumes(novelId, {
        provider: llm.provider,
        model: llm.model,
        temperature: llm.temperature,
        scope: payload.scope,
        generationMode: payload.generationMode,
        targetVolumeId: payload.targetVolumeId,
        targetBeatKey: payload.targetBeatKey,
        targetChapterId: payload.targetChapterId,
        detailMode: payload.detailMode,
        draftVolumes: requestDraft.length > 0 ? requestDraft : undefined,
        draftWorkspace: {
          novelId,
          workspaceVersion: "v2",
          volumes: requestDraft,
          strategyPlan,
          critiqueReport,
          beatSheets,
          rebalanceDecisions,
          readiness,
          derivedOutline: "",
          derivedStructuredOutline: "",
          source: savedWorkspace?.source ?? "volume",
          activeVersionId: savedWorkspace?.activeVersionId ?? null,
        },
        estimatedChapterCount: typeof estimatedChapterCount === "number" && estimatedChapterCount > 0
          ? estimatedChapterCount
          : undefined,
        userPreferredVolumeCount: userPreferredVolumeCount ?? undefined,
        respectExistingVolumeCount: !forceSystemRecommendedVolumeCount && requestDraft.length > 0,
        slimResponse: shouldRequestSlimVolumeGenerationResponse(payload.scope),
      });
      let nextDocument = generatedResponse.data;
      if (!nextDocument) {
        throw new Error(i18n.t("generation.noWorkspaceResult", { ns: "novelsHooks" }));
      }
      if (isSlimVolumeGenerationResponse(nextDocument)) {
        const latestWorkspaceResponse = await getNovelVolumeWorkspace(novelId);
        if (!latestWorkspaceResponse.data) {
          throw new Error(i18n.t("generation.reloadNeeded", { ns: "novelsHooks" }));
        }
        nextDocument = latestWorkspaceResponse.data;
        if (!autoSyncedToChapterExecution) {
          return {
            generatedResponse,
            persistedResponse: latestWorkspaceResponse,
            nextDocument,
            autoSyncedToChapterExecution,
          };
        }
      }

      try {
        const persistedResponse = await updateNovelVolumes(novelId, {
          ...nextDocument,
          syncToChapterExecution: autoSyncedToChapterExecution,
        });
        return {
          generatedResponse,
          persistedResponse,
          nextDocument: persistedResponse.data ?? nextDocument,
          autoSyncedToChapterExecution,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : i18n.t("generation.autoSaveFailed", { ns: "novelsHooks" });
        throw new VolumeGenerationAutoSaveError(message, nextDocument);
      }
    },
    onSuccess: async (result, payload) => {
      applyWorkspaceDocument(result.nextDocument);
      if (result.persistedResponse.data) {
        syncSavedVolumeDocumentToCache(result.persistedResponse.data);
      }
      if (result.autoSyncedToChapterExecution) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.novels.detail(novelId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.novels.chapters(novelId) }),
        ]);
      }

      void syncNovelWorkflowStageSilently({
        novelId,
        stage: payload.scope === "strategy" || payload.scope === "strategy_critique" || payload.scope === "skeleton" || payload.scope === "book"
          ? "volume_strategy"
          : "structured_outline",
        itemLabel: payload.scope === "strategy"
          ? "卷战略建议已更新"
          : payload.scope === "strategy_critique"
            ? "卷战略审稿已更新"
            : payload.scope === "skeleton" || payload.scope === "book"
              ? "卷骨架已更新"
              : payload.scope === "beat_sheet"
                ? "当前卷节奏板已更新"
                : payload.scope === "chapter_list" || payload.scope === "volume"
                  ? payload.generationMode === "single_beat"
                    ? "当前卷节奏段章节已更新并连接到章节执行"
                    : "当前卷章节列表已生成并连接到章节执行"
                  : payload.scope === "rebalance"
                    ? "相邻卷再平衡建议已更新"
                    : result.autoSyncedToChapterExecution
                      ? "章节细化已更新并连接到章节执行"
                      : "章节细化已更新",
        checkpointType: payload.scope === "skeleton" || payload.scope === "book"
          ? "volume_strategy_ready"
          : payload.scope === "chapter_list" || payload.scope === "volume"
            ? "chapter_batch_ready"
            : null,
        checkpointSummary: payload.scope === "skeleton" || payload.scope === "book"
          ? "卷战略与卷骨架已刷新，可以继续进入节奏拆章。"
          : payload.scope === "chapter_list" || payload.scope === "volume"
            ? payload.generationMode === "single_beat"
              ? "当前卷节奏段章节已刷新，可继续细化或直接进入章节执行。"
              : "当前卷章节列表已准备完成，可继续细化或直接进入章节执行。"
            : undefined,
        volumeId: payload.targetVolumeId,
        chapterId: payload.targetChapterId,
        status: "waiting_approval",
      });

      if (payload.suppressSuccessMessage) {
        return;
      }

      if (payload.scope === "strategy") {
        const message = i18n.t("generation.strategyDone", { ns: "novelsHooks" });
        setVolumeGenerationMessage(message);
        setStructuredMessage(message);
        return;
      }
      if (payload.scope === "strategy_critique") {
        const message = i18n.t("generation.strategyCritiqueDone", { ns: "novelsHooks" });
        setVolumeGenerationMessage(message);
        return;
      }
      if (payload.scope === "skeleton" || payload.scope === "book") {
        const message = i18n.t("generation.skeletonDone", { ns: "novelsHooks" });
        setVolumeGenerationMessage(message);
        setStructuredMessage(message);
        return;
      }
      if (payload.scope === "beat_sheet") {
        setStructuredMessage(i18n.t("generation.beatSheetDone", { ns: "novelsHooks" }));
        return;
      }
      if (payload.scope === "chapter_list" || payload.scope === "volume") {
        setStructuredMessage(buildChapterListSuccessMessage({
          document: result.nextDocument,
          targetVolumeId: payload.targetVolumeId,
          generationMode: payload.generationMode,
          targetBeatKey: payload.targetBeatKey,
          autoSyncedToChapterExecution: result.autoSyncedToChapterExecution,
        }));
        return;
      }
      if (payload.scope === "rebalance") {
        setStructuredMessage(i18n.t("generation.rebalanceDone", { ns: "novelsHooks" }));
        return;
      }

      const label = detailModeLabel(payload.detailMode ?? "purpose");
      setStructuredMessage(
        result.autoSyncedToChapterExecution
          ? i18n.t("generation.detailFixedSynced", { ns: "novelsHooks", label })
          : i18n.t("generation.detailFixed", { ns: "novelsHooks", label }),
      );
    },
    onError: async (error, payload, context) => {
      if (error instanceof VolumeGenerationAutoSaveError) {
        applyWorkspaceDocument(error.nextDocument);
      }
      const fallbackMessage = error instanceof VolumeGenerationAutoSaveError
        ? error.message
        : error instanceof Error
          ? error.message
          : i18n.t("generation.genericFailed", { ns: "novelsHooks" });
      const shouldTryRecoverPersistedWorkspace = !(error instanceof VolumeGenerationAutoSaveError)
        && shouldRequestSlimVolumeGenerationResponse(payload.scope);
      let recoveredMessage: string | null = null;

      if (shouldTryRecoverPersistedWorkspace) {
        try {
          const latestWorkspaceResponse = await getNovelVolumeWorkspace(novelId);
          const latestWorkspace = latestWorkspaceResponse.data ?? null;
          if (latestWorkspace) {
            const persistedWorkspaceSnapshotAfter = serializeVolumeWorkspaceSnapshot(latestWorkspace);
            if (persistedWorkspaceSnapshotAfter !== context?.persistedWorkspaceSnapshotBefore) {
              hydratePersistedWorkspace(latestWorkspace);
              recoveredMessage = payload.scope === "chapter_list" || payload.scope === "volume"
                ? i18n.t("generation.recoveredChapterList", { ns: "novelsHooks" })
                : i18n.t("generation.recoveredVolume", { ns: "novelsHooks" });
            }
          }
        } catch {
          // Ignore recovery fetch failures and keep the original local draft untouched.
        }
      }

      const message = recoveredMessage ?? fallbackMessage;
      if (payload.scope === "strategy" || payload.scope === "strategy_critique" || payload.scope === "skeleton" || payload.scope === "book") {
        setVolumeGenerationMessage(message);
      }
      setStructuredMessage(message);
    },
  });
}

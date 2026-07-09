import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, type QueryClient } from "@tanstack/react-query";
import type { StorylineDiff, StorylineVersion } from "@ai-novel/shared/types/novel";
import {
  activateStorylineVersion,
  analyzeStorylineImpact,
  createStorylineDraft,
  freezeStorylineVersion,
  getStorylineDiff,
  listStorylineVersions,
} from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import i18n from "@/i18n";

interface StorylineImpactResult {
  novelId: string;
  sourceVersion: number | null;
  affectedCharacters: number;
  affectedChapters: number;
  changedLines: number;
  requiresOutlineRebuild: boolean;
  recommendations: {
    shouldSyncOutline: boolean;
    shouldRecheckCharacters: boolean;
    suggestedStrategy: "rebuild_outline" | "incremental_sync";
  };
}

interface UseStorylineVersionControlArgs {
  novelId: string;
  draftText: string;
  setDraftText: (value: string) => void;
  queryClient: QueryClient;
  invalidateNovelDetail: () => Promise<void>;
}

export function useStorylineVersionControl({
  novelId,
  draftText,
  setDraftText,
  queryClient,
  invalidateNovelDetail,
}: UseStorylineVersionControlArgs) {
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [storylineMessage, setStorylineMessage] = useState("");
  const [diffResult, setDiffResult] = useState<StorylineDiff | null>(null);
  const [impactResult, setImpactResult] = useState<StorylineImpactResult | null>(null);

  const storylineVersionsQuery = useQuery({
    queryKey: queryKeys.novels.storylineVersions(novelId),
    queryFn: () => listStorylineVersions(novelId),
    enabled: Boolean(novelId),
  });

  const storylineVersions = storylineVersionsQuery.data?.data ?? [];
  const selectedVersion = useMemo(
    () => storylineVersions.find((item) => item.id === selectedVersionId),
    [selectedVersionId, storylineVersions],
  );

  useEffect(() => {
    if (!selectedVersionId && storylineVersions.length > 0) {
      setSelectedVersionId(storylineVersions[0].id);
    }
  }, [selectedVersionId, storylineVersions]);

  const invalidateVersionList = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.novels.storylineVersions(novelId) });
  };

  const createDraftVersionMutation = useMutation({
    mutationFn: () => createStorylineDraft(novelId, {
      content: draftText,
      baseVersion: selectedVersion?.version,
    }),
    onSuccess: async (response) => {
      const nextVersionId = response.data?.id;
      if (nextVersionId) {
        setSelectedVersionId(nextVersionId);
      }
      setStorylineMessage(response.message ?? i18n.t("storyline.draftCreated", { ns: "novelsHooks" }));
      await invalidateVersionList();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("storyline.draftCreateFailed", { ns: "novelsHooks" });
      setStorylineMessage(message);
    },
  });

  const activateVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("storyline.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return activateStorylineVersion(novelId, selectedVersionId);
    },
    onSuccess: async (response) => {
      setStorylineMessage(response.message ?? i18n.t("storyline.activated", { ns: "novelsHooks" }));
      await invalidateVersionList();
      await invalidateNovelDetail();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("storyline.activateFailed", { ns: "novelsHooks" });
      setStorylineMessage(message);
    },
  });

  const freezeVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("storyline.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return freezeStorylineVersion(novelId, selectedVersionId);
    },
    onSuccess: async (response) => {
      setStorylineMessage(response.message ?? i18n.t("storyline.frozen", { ns: "novelsHooks" }));
      await invalidateVersionList();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("storyline.freezeFailed", { ns: "novelsHooks" });
      setStorylineMessage(message);
    },
  });

  const diffMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("storyline.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return getStorylineDiff(novelId, selectedVersionId);
    },
    onSuccess: (response) => {
      setDiffResult(response.data ?? null);
      setStorylineMessage(response.message ?? i18n.t("storyline.diffUpdated", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("storyline.diffFailed", { ns: "novelsHooks" });
      setStorylineMessage(message);
    },
  });

  const analyzeDraftImpactMutation = useMutation({
    mutationFn: () => analyzeStorylineImpact(novelId, { content: draftText }),
    onSuccess: (response) => {
      setImpactResult(response.data ?? null);
      setStorylineMessage(response.message ?? i18n.t("storyline.draftImpactDone", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("storyline.draftImpactFailed", { ns: "novelsHooks" });
      setStorylineMessage(message);
    },
  });

  const analyzeVersionImpactMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("storyline.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return analyzeStorylineImpact(novelId, { versionId: selectedVersionId });
    },
    onSuccess: (response) => {
      setImpactResult(response.data ?? null);
      setStorylineMessage(response.message ?? i18n.t("storyline.versionImpactDone", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : i18n.t("storyline.versionImpactFailed", { ns: "novelsHooks" });
      setStorylineMessage(message);
    },
  });

  const loadSelectedVersionToDraft = () => {
    if (!selectedVersion) {
      return;
    }
    setDraftText(selectedVersion.content);
    setStorylineMessage(i18n.t("storyline.loadedToDraft", { ns: "novelsHooks", version: selectedVersion.version }));
  };

  return {
    storylineMessage,
    storylineVersions,
    selectedVersionId,
    setSelectedVersionId,
    selectedVersion,
    diffResult,
    impactResult,
    isLoadingVersions: storylineVersionsQuery.isLoading,
    createDraftVersionMutation,
    activateVersionMutation,
    freezeVersionMutation,
    diffMutation,
    analyzeDraftImpactMutation,
    analyzeVersionImpactMutation,
    loadSelectedVersionToDraft,
  };
}

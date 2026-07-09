import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, type QueryClient } from "@tanstack/react-query";
import type {
  VolumeBeatSheet,
  VolumeCritiqueReport,
  VolumeImpactResult,
  VolumePlan,
  VolumePlanDocument,
  VolumePlanDiff,
  VolumePlanVersionSummary,
  VolumeRebalanceDecision,
  VolumeStrategyPlan,
} from "@ai-novel/shared/types/novel";
import {
  activateVolumeVersion,
  analyzeVolumeImpact,
  createVolumeDraft,
  freezeVolumeVersion,
  getVolumeDiff,
  getVolumeVersion,
  listVolumeVersions,
} from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import i18n from "@/i18n";

interface UseVolumeVersionControlArgs {
  novelId: string;
  draftDocument: VolumePlanDocument;
  setDraftVolumes: (value: VolumePlan[]) => void;
  setStrategyPlan: (value: VolumeStrategyPlan | null) => void;
  setCritiqueReport: (value: VolumeCritiqueReport | null) => void;
  setBeatSheets: (value: VolumeBeatSheet[]) => void;
  setRebalanceDecisions: (value: VolumeRebalanceDecision[]) => void;
  queryClient: QueryClient;
  invalidateNovelDetail: () => Promise<void>;
}

export function useVolumeVersionControl({
  novelId,
  draftDocument,
  setDraftVolumes,
  setStrategyPlan,
  setCritiqueReport,
  setBeatSheets,
  setRebalanceDecisions,
  queryClient,
  invalidateNovelDetail,
}: UseVolumeVersionControlArgs) {
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [message, setMessage] = useState("");
  const [diffResult, setDiffResult] = useState<VolumePlanDiff | null>(null);
  const [impactResult, setImpactResult] = useState<VolumeImpactResult | null>(null);

  const volumeVersionsQuery = useQuery({
    queryKey: queryKeys.novels.volumeVersions(novelId),
    queryFn: () => listVolumeVersions(novelId),
    enabled: Boolean(novelId),
  });

  const versions = volumeVersionsQuery.data?.data ?? [];
  const selectedVersion = useMemo(
    () => versions.find((item) => item.id === selectedVersionId),
    [selectedVersionId, versions],
  );

  useEffect(() => {
    if (!selectedVersionId && versions.length > 0) {
      setSelectedVersionId(versions[0].id);
    }
  }, [selectedVersionId, versions]);

  const invalidateVersionList = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.novels.volumeVersions(novelId) });
  };

  const createDraftVersionMutation = useMutation({
    mutationFn: () => createVolumeDraft(novelId, {
      ...draftDocument,
      baseVersion: selectedVersion?.version,
    }),
    onSuccess: async (response) => {
      const nextVersionId = response.data?.id;
      if (nextVersionId) {
        setSelectedVersionId(nextVersionId);
      }
      setMessage(response.message ?? i18n.t("volumeVersion.draftCreated", { ns: "novelsHooks" }));
      await invalidateVersionList();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : i18n.t("volumeVersion.draftCreateFailed", { ns: "novelsHooks" }));
    },
  });

  const activateVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("volumeVersion.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return activateVolumeVersion(novelId, selectedVersionId);
    },
    onSuccess: async (response) => {
      setMessage(response.message ?? i18n.t("volumeVersion.activated", { ns: "novelsHooks" }));
      await invalidateVersionList();
      await invalidateNovelDetail();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : i18n.t("volumeVersion.activateFailed", { ns: "novelsHooks" }));
    },
  });

  const freezeVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("volumeVersion.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return freezeVolumeVersion(novelId, selectedVersionId);
    },
    onSuccess: async (response) => {
      setMessage(response.message ?? i18n.t("volumeVersion.frozen", { ns: "novelsHooks" }));
      await invalidateVersionList();
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : i18n.t("volumeVersion.freezeFailed", { ns: "novelsHooks" }));
    },
  });

  const diffMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("volumeVersion.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return getVolumeDiff(novelId, selectedVersionId);
    },
    onSuccess: (response) => {
      setDiffResult(response.data ?? null);
      setMessage(response.message ?? i18n.t("volumeVersion.diffUpdated", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : i18n.t("volumeVersion.diffFailed", { ns: "novelsHooks" }));
    },
  });

  const analyzeDraftImpactMutation = useMutation({
    mutationFn: () => analyzeVolumeImpact(novelId, { volumes: draftDocument.volumes }),
    onSuccess: (response) => {
      setImpactResult(response.data ?? null);
      setMessage(response.message ?? i18n.t("volumeVersion.draftImpactDone", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : i18n.t("volumeVersion.draftImpactFailed", { ns: "novelsHooks" }));
    },
  });

  const analyzeVersionImpactMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("volumeVersion.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return analyzeVolumeImpact(novelId, { versionId: selectedVersionId });
    },
    onSuccess: (response) => {
      setImpactResult(response.data ?? null);
      setMessage(response.message ?? i18n.t("volumeVersion.versionImpactDone", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : i18n.t("volumeVersion.versionImpactFailed", { ns: "novelsHooks" }));
    },
  });

  const loadSelectedVersionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error(i18n.t("volumeVersion.selectVersionFirst", { ns: "novelsHooks" }));
      }
      return getVolumeVersion(novelId, selectedVersionId);
    },
    onSuccess: (response) => {
      const version = response.data;
      if (!version) {
        setMessage(i18n.t("volumeVersion.loadContentFailed", { ns: "novelsHooks" }));
        return;
      }
      try {
        const parsed = JSON.parse(version.contentJson) as Partial<VolumePlanDocument>;
        setDraftVolumes(parsed.volumes ?? []);
        setStrategyPlan(parsed.strategyPlan ?? null);
        setCritiqueReport(parsed.critiqueReport ?? null);
        setBeatSheets(parsed.beatSheets ?? []);
        setRebalanceDecisions(parsed.rebalanceDecisions ?? []);
        setMessage(i18n.t("volumeVersion.loadedToDraft", { ns: "novelsHooks", version: version.version }));
      } catch {
        setMessage(i18n.t("volumeVersion.loadContentFailed", { ns: "novelsHooks" }));
      }
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : i18n.t("volumeVersion.loadContentFailed", { ns: "novelsHooks" }));
    },
  });

  const loadSelectedVersionToDraft = () => {
    loadSelectedVersionMutation.mutate();
  };

  return {
    volumeMessage: message,
    volumeVersions: versions,
    selectedVersionId,
    setSelectedVersionId,
    selectedVersion: selectedVersion as VolumePlanVersionSummary | undefined,
    diffResult,
    impactResult,
    isLoadingVersions: volumeVersionsQuery.isLoading,
    createDraftVersionMutation,
    activateVersionMutation,
    freezeVersionMutation,
    diffMutation,
    analyzeDraftImpactMutation,
    analyzeVersionImpactMutation,
    loadSelectedVersionToDraft,
  };
}

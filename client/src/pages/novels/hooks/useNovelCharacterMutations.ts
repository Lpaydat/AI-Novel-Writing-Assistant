import { useMutation, useQuery, type QueryClient } from "@tanstack/react-query";
import type { LLMProvider } from "@ai-novel/shared/types/llm";
import {
  applyBatchCharacterVisibleProfiles,
  applyCharacterVisibleProfile,
  applySupplementalCharacter,
  checkCharacterAgainstWorld,
  createNovelCharacter,
  deleteNovelCharacter,
  evolveNovelCharacter,
  generateBatchCharacterVisibleProfiles,
  generateCharacterVisibleProfile,
  generateSupplementalCharacters,
  getCharacterTimeline,
  syncAllCharacterTimeline,
  syncCharacterTimeline,
  updateNovelCharacter,
} from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import { buildCharacterProfileFromWizard, type QuickCharacterCreatePayload } from "../components/characterPanel.utils";
import type {
  SupplementalCharacterCandidate,
  SupplementalCharacterGenerateInput,
} from "@ai-novel/shared/types/novel";
import i18n from "@/i18n";

interface LLMState {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
}

interface PipelineFormState {
  startOrder: number;
  endOrder: number;
}

interface CharacterFormState {
  name: string;
  role: string;
  gender: "male" | "female" | "other" | "unknown";
  personality: string;
  background: string;
  development: string;
  appearance: string;
  physique: string;
  attireStyle: string;
  signatureDetail: string;
  voiceTexture: string;
  presenceImpression: string;
  currentState: string;
  currentGoal: string;
}

interface QuickCharacterFormState {
  name: string;
  role: string;
}

interface BaseCharacterOption {
  id: string;
  name: string;
  role: string;
  personality?: string | null;
  background?: string | null;
  development?: string | null;
}

interface UseNovelCharacterMutationsInput {
  id: string;
  selectedCharacterId: string;
  selectedBaseCharacter?: BaseCharacterOption;
  characters: Array<{ id: string }>;
  pipelineForm: PipelineFormState;
  llm: LLMState;
  characterForm: CharacterFormState;
  quickCharacterForm: QuickCharacterFormState;
  queryClient: QueryClient;
  setCharacterMessage: (message: string) => void;
  setSelectedCharacterId: (id: string) => void;
  setQuickCharacterForm: (updater: (prev: QuickCharacterFormState) => QuickCharacterFormState) => void;
}

async function invalidateCharacterViews(queryClient: QueryClient, novelId: string, selectedCharacterId?: string) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.novels.detail(novelId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.novels.characterRelations(novelId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.novels.characterDynamicsOverview(novelId) });
  await queryClient.invalidateQueries({ queryKey: queryKeys.novels.characterCandidates(novelId) });
  if (selectedCharacterId) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.novels.characterTimeline(novelId, selectedCharacterId),
    });
  }
}

export function useNovelCharacterMutations(input: UseNovelCharacterMutationsInput) {
  const {
    id,
    selectedCharacterId,
    selectedBaseCharacter,
    characters,
    pipelineForm,
    llm,
    characterForm,
    quickCharacterForm,
    queryClient,
    setCharacterMessage,
    setSelectedCharacterId,
    setQuickCharacterForm,
  } = input;

  const characterTimelineQuery = useQuery({
    queryKey: queryKeys.novels.characterTimeline(id, selectedCharacterId || "none"),
    queryFn: () => getCharacterTimeline(id, selectedCharacterId),
    enabled: Boolean(id && selectedCharacterId),
  });

  const syncTimelineMutation = useMutation({
    mutationFn: () =>
      syncCharacterTimeline(id, selectedCharacterId, {
        startOrder: pipelineForm.startOrder,
        endOrder: pipelineForm.endOrder,
      }),
    onSuccess: async (response) => {
      setCharacterMessage(response.message ?? i18n.t("character.timelineSynced", { ns: "novelsHooks", count: response.data?.syncedCount ?? 0 }));
      await invalidateCharacterViews(queryClient, id, selectedCharacterId || "none");
    },
  });

  const syncAllTimelineMutation = useMutation({
    mutationFn: () =>
      syncAllCharacterTimeline(id, {
        startOrder: pipelineForm.startOrder,
        endOrder: pipelineForm.endOrder,
      }),
    onSuccess: async (response) => {
      setCharacterMessage(response.message ?? i18n.t("character.allTimelineSynced", { ns: "novelsHooks", count: response.data?.syncedCount ?? 0 }));
      await invalidateCharacterViews(queryClient, id, selectedCharacterId || "none");
    },
  });

  const evolveCharacterMutation = useMutation({
    mutationFn: () =>
      evolveNovelCharacter(id, selectedCharacterId, {
        provider: llm.provider,
        model: llm.model,
        temperature: 0.4,
      }),
    onSuccess: async () => {
      setCharacterMessage(i18n.t("character.evolved", { ns: "novelsHooks" }));
      await invalidateCharacterViews(queryClient, id, selectedCharacterId || "none");
    },
  });

  const generateVisibleProfileMutation = useMutation({
    mutationFn: (userGuidance?: string) =>
      generateCharacterVisibleProfile(id, selectedCharacterId, {
        provider: llm.provider,
        model: llm.model,
        temperature: 0.45,
        userGuidance: userGuidance?.trim() || undefined,
      }),
    onSuccess: (response) => {
      const count = Object.keys(response.data?.fields ?? {}).length;
      setCharacterMessage(count > 0 ? i18n.t("character.visibleProfileGenerated", { ns: "novelsHooks", count }) : i18n.t("character.visibleProfileNone", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.visibleProfileGenerateFailed", { ns: "novelsHooks" }));
    },
  });

  const applyVisibleProfileMutation = useMutation({
    mutationFn: () => {
      const suggestion = generateVisibleProfileMutation.data?.data;
      const fields = suggestion?.fields ?? {};
      return applyCharacterVisibleProfile(id, selectedCharacterId, fields, {
        overwriteExisting: suggestion?.allowsOverwriteExisting,
      });
    },
    onSuccess: async (response) => {
      const count = response.data?.appliedFields.length ?? 0;
      setCharacterMessage(count > 0 ? i18n.t("character.visibleProfileApplied", { ns: "novelsHooks", count }) : i18n.t("character.visibleProfileApplyNone", { ns: "novelsHooks" }));
      await invalidateCharacterViews(queryClient, id, selectedCharacterId || "none");
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.visibleProfileApplyFailed", { ns: "novelsHooks" }));
    },
  });

  const generateBatchVisibleProfilesMutation = useMutation({
    mutationFn: (userGuidance?: string) =>
      generateBatchCharacterVisibleProfiles(id, {
        provider: llm.provider,
        model: llm.model,
        temperature: 0.45,
        userGuidance: userGuidance?.trim() || undefined,
      }),
    onSuccess: (response) => {
      const count = response.data?.results.filter((item) => item.hasApplicableChanges).length ?? 0;
      setCharacterMessage(count > 0 ? i18n.t("character.batchVisibleProfileGenerated", { ns: "novelsHooks", count }) : i18n.t("character.batchVisibleProfileNone", { ns: "novelsHooks" }));
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.batchVisibleProfileGenerateFailed", { ns: "novelsHooks" }));
    },
  });

  const applyBatchVisibleProfilesMutation = useMutation({
    mutationFn: () => {
      const items = (generateBatchVisibleProfilesMutation.data?.data?.results ?? [])
        .filter((item) => item.hasApplicableChanges)
        .map((item) => ({
          characterId: item.characterId,
          fields: item.fields,
          overwriteExisting: item.allowsOverwriteExisting,
        }));
      return applyBatchCharacterVisibleProfiles(id, items);
    },
    onSuccess: async (response) => {
      const count = response.data?.results.reduce((sum, item) => sum + item.appliedFields.length, 0) ?? 0;
      setCharacterMessage(count > 0 ? i18n.t("character.batchVisibleProfileApplied", { ns: "novelsHooks", count }) : i18n.t("character.batchVisibleProfileApplyNone", { ns: "novelsHooks" }));
      await invalidateCharacterViews(queryClient, id, selectedCharacterId || "none");
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.batchVisibleProfileApplyFailed", { ns: "novelsHooks" }));
    },
  });

  const worldCheckMutation = useMutation({
    mutationFn: () =>
      checkCharacterAgainstWorld(id, selectedCharacterId, {
        provider: llm.provider,
        model: llm.model,
        temperature: 0.2,
      }),
    onSuccess: (response) => {
      const status = response.data?.status ?? "pass";
      const warningText = response.data?.warnings?.join(" | ") ?? "";
      const issueText = (response.data?.issues ?? [])
        .map((item) => `${item.severity.toUpperCase()}: ${item.message}`)
        .join(" | ");
      setCharacterMessage(i18n.t("character.worldCheck", { ns: "novelsHooks", status, warnings: warningText, issues: issueText }).trim());
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.worldCheckFailed", { ns: "novelsHooks" }));
    },
  });

  const saveCharacterMutation = useMutation({
    mutationFn: () =>
      updateNovelCharacter(id, selectedCharacterId, {
        name: characterForm.name,
        role: characterForm.role,
        gender: characterForm.gender,
        personality: characterForm.personality,
        background: characterForm.background,
        development: characterForm.development,
        appearance: characterForm.appearance,
        physique: characterForm.physique,
        attireStyle: characterForm.attireStyle,
        signatureDetail: characterForm.signatureDetail,
        voiceTexture: characterForm.voiceTexture,
        presenceImpression: characterForm.presenceImpression,
        currentState: characterForm.currentState,
        currentGoal: characterForm.currentGoal,
      }),
    onSuccess: async () => {
      setCharacterMessage(i18n.t("character.saved", { ns: "novelsHooks" }));
      await invalidateCharacterViews(queryClient, id, selectedCharacterId || "none");
    },
  });

  const importBaseCharacterMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBaseCharacter) {
        throw new Error(i18n.t("character.selectBaseCharacterFirst", { ns: "novelsHooks" }));
      }
      return createNovelCharacter(id, {
        name: selectedBaseCharacter.name,
        role: selectedBaseCharacter.role,
        personality: selectedBaseCharacter.personality ?? undefined,
        background: selectedBaseCharacter.background ?? undefined,
        development: selectedBaseCharacter.development ?? undefined,
        baseCharacterId: selectedBaseCharacter.id,
      });
    },
    onSuccess: async (response) => {
      setCharacterMessage(response.message ?? i18n.t("character.baseImported", { ns: "novelsHooks" }));
      if (response.data?.id) {
        setSelectedCharacterId(response.data.id);
      }
      await invalidateCharacterViews(queryClient, id, response.data?.id ?? selectedCharacterId ?? "none");
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.baseImportFailed", { ns: "novelsHooks" }));
    },
  });

  const quickCreateCharacterMutation = useMutation({
    mutationFn: async (payload?: QuickCharacterCreatePayload) => {
      const nextName = payload?.name?.trim() || quickCharacterForm.name.trim();
      const nextRole = payload?.role?.trim() || quickCharacterForm.role.trim() || "主角";
      const generatedProfile = payload ? buildCharacterProfileFromWizard(payload) : {};
      return createNovelCharacter(id, {
        name: nextName,
        role: nextRole,
        relationToProtagonist: payload?.relationToProtagonist?.trim() || undefined,
        storyFunction: payload?.storyFunction?.trim() || undefined,
        ...generatedProfile,
      });
    },
    onSuccess: async (response) => {
      setCharacterMessage(response.message ?? i18n.t("character.created", { ns: "novelsHooks" }));
      setQuickCharacterForm((prev) => ({ ...prev, name: "" }));
      if (response.data?.id) {
        setSelectedCharacterId(response.data.id);
      }
      await invalidateCharacterViews(queryClient, id, response.data?.id ?? selectedCharacterId ?? "none");
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.createFailed", { ns: "novelsHooks" }));
    },
  });

  const deleteCharacterMutation = useMutation({
    mutationFn: (characterId: string) => deleteNovelCharacter(id, characterId),
    onSuccess: async (_response, deletedCharacterId) => {
      setCharacterMessage(i18n.t("character.deleted", { ns: "novelsHooks" }));
      if (selectedCharacterId === deletedCharacterId) {
        const fallback = characters.find((item) => item.id !== deletedCharacterId);
        setSelectedCharacterId(fallback?.id ?? "");
      }
      await invalidateCharacterViews(queryClient, id, deletedCharacterId);
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.deleteFailed", { ns: "novelsHooks" }));
    },
  });

  const generateSupplementalCharacterMutation = useMutation({
    mutationFn: (payload: SupplementalCharacterGenerateInput) =>
      generateSupplementalCharacters(id, {
        ...payload,
        provider: payload.provider ?? llm.provider,
        model: payload.model ?? llm.model,
        temperature: payload.temperature ?? 0.55,
      }),
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.supplementalGenerateFailed", { ns: "novelsHooks" }));
    },
  });

  const applySupplementalCharacterMutation = useMutation({
    mutationFn: (candidate: SupplementalCharacterCandidate) => applySupplementalCharacter(id, candidate),
    onSuccess: async (response) => {
      const createdCharacterId = response.data?.character?.id ?? "";
      const relationCount = response.data?.relationCount ?? 0;
      setCharacterMessage(
        response.message
        ?? i18n.t("character.supplementalCreated", {
          ns: "novelsHooks",
          suffix: relationCount > 0
            ? i18n.t("character.supplementalRelationSuffix", { ns: "novelsHooks", count: relationCount })
            : "",
        }),
      );
      if (createdCharacterId) {
        setSelectedCharacterId(createdCharacterId);
      }
      await invalidateCharacterViews(queryClient, id, createdCharacterId || selectedCharacterId || "none");
    },
    onError: (error) => {
      setCharacterMessage(error instanceof Error ? error.message : i18n.t("character.supplementalApplyFailed", { ns: "novelsHooks" }));
    },
  });

  return {
    characterTimelineQuery,
    syncTimelineMutation,
    syncAllTimelineMutation,
    evolveCharacterMutation,
    generateVisibleProfileMutation,
    applyVisibleProfileMutation,
    generateBatchVisibleProfilesMutation,
    applyBatchVisibleProfilesMutation,
    worldCheckMutation,
    saveCharacterMutation,
    importBaseCharacterMutation,
    quickCreateCharacterMutation,
    deleteCharacterMutation,
    generateSupplementalCharacterMutation,
    applySupplementalCharacterMutation,
  };
}

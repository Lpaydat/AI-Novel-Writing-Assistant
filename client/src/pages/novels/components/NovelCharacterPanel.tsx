import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type {
  BaseCharacter,
  Character,
  CharacterCastRole,
  CharacterGender,
  CharacterTimeline,
  CharacterVisibleProfileBatchResult,
  CharacterVisibleProfileSuggestion,
  SupplementalCharacterCandidate,
  SupplementalCharacterGenerateInput,
  SupplementalCharacterGenerationMode,
  SupplementalCharacterGenerationResult,
} from "@ai-novel/shared/types/novel";
import type { LLMProvider } from "@ai-novel/shared/types/llm";
import type { CharacterResourceLedgerItem } from "@ai-novel/shared/types/characterResource";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import CharacterAssetWorkspace from "./CharacterAssetWorkspace";
import CharacterDiagnosticsSection from "./CharacterDiagnosticsSection";
import type { QuickCharacterCreatePayload } from "./characterPanel.utils";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";
import { StatusRail, StepActionBar, StepHero } from "./workspaceShell";
import SelectControl from "@/components/common/SelectControl";

interface QuickCharacterFormState {
  name: string;
  role: string;
}

interface CharacterFormState {
  name: string;
  role: string;
  gender: CharacterGender;
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

const CAST_ROLE_LABELS: Record<CharacterCastRole, string> = {
  protagonist: "character.castRole.protagonist",
  antagonist: "character.castRole.antagonist",
  ally: "character.castRole.ally",
  foil: "character.castRole.foil",
  mentor: "character.castRole.mentor",
  love_interest: "character.castRole.loveInterest",
  pressure_source: "character.castRole.pressureSource",
  catalyst: "character.castRole.catalyst",
};
const CHARACTER_GENDER_LABELS: Record<CharacterGender, string> = {
  male: "character.gender.male",
  female: "character.gender.female",
  other: "character.gender.other",
  unknown: "character.gender.unknown",
};
const SUPPLEMENTAL_MODE_LABELS: Record<SupplementalCharacterGenerationMode, string> = {
  auto: "character.supplementalMode.auto",
  linked: "character.supplementalMode.linked",
  independent: "character.supplementalMode.independent",
};

function getCastRoleLabelKey(castRole?: CharacterCastRole | "auto" | null): string {
  if (!castRole || castRole === "auto") {
    return "character.castRole.auto";
  }
  return CAST_ROLE_LABELS[castRole] ?? castRole;
}

function getCharacterGenderLabelKey(gender?: CharacterGender | null): string {
  if (!gender) {
    return "character.gender.unknown";
  }
  return CHARACTER_GENDER_LABELS[gender] ?? gender;
}

function getSupplementalRelationLabel(
  candidate: SupplementalCharacterCandidate,
  relation: SupplementalCharacterCandidate["relations"][number],
): string {
  if (relation.sourceName === candidate.name) {
    return relation.targetName;
  }
  if (relation.targetName === candidate.name) {
    return relation.sourceName;
  }
  return `${relation.sourceName} -> ${relation.targetName}`;
}

interface NovelCharacterPanelProps {
  novelId: string;
  llmProvider?: LLMProvider;
  llmModel?: string;
  characterMessage: string;
  quickCharacterForm: QuickCharacterFormState;
  onQuickCharacterFormChange: (field: keyof QuickCharacterFormState, value: string) => void;
  onQuickCreateCharacter: (payload: QuickCharacterCreatePayload) => void;
  isQuickCreating: boolean;
  onGenerateSupplementalCharacters: (payload: SupplementalCharacterGenerateInput) => Promise<{
    data?: SupplementalCharacterGenerationResult;
    message?: string;
  }>;
  isGeneratingSupplementalCharacters: boolean;
  onApplySupplementalCharacter: (candidate: SupplementalCharacterCandidate) => Promise<{
    data?: { character?: Character; relationCount?: number };
    message?: string;
  }>;
  isApplyingSupplementalCharacter: boolean;
  characters: Character[];
  coreCharacterCount: number;
  baseCharacters: BaseCharacter[];
  selectedBaseCharacterId: string;
  onSelectedBaseCharacterChange: (id: string) => void;
  selectedBaseCharacter?: BaseCharacter;
  importedBaseCharacterIds: Set<string>;
  onImportBaseCharacter: () => void;
  isImportingBaseCharacter: boolean;
  selectedCharacterId: string;
  onSelectedCharacterChange: (id: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  isDeletingCharacter: boolean;
  deletingCharacterId: string;
  onSyncTimeline: () => void;
  isSyncingTimeline: boolean;
  onSyncAllTimeline: () => void;
  isSyncingAllTimeline: boolean;
  onEvolveCharacter: () => void;
  isEvolvingCharacter: boolean;
  onGenerateVisibleProfile: (userGuidance?: string) => void;
  isGeneratingVisibleProfile: boolean;
  visibleProfileSuggestion?: CharacterVisibleProfileSuggestion | null;
  onApplyVisibleProfile: () => void;
  isApplyingVisibleProfile: boolean;
  onGenerateBatchVisibleProfiles: (userGuidance?: string) => void;
  isGeneratingBatchVisibleProfiles: boolean;
  batchVisibleProfileResult?: CharacterVisibleProfileBatchResult | null;
  onApplyBatchVisibleProfiles: () => void;
  isApplyingBatchVisibleProfiles: boolean;
  onWorldCheck: () => void;
  isCheckingWorld: boolean;
  selectedCharacter?: Character;
  characterResources?: CharacterResourceLedgerItem[];
  pendingCharacterResourceCount?: number;
  onBackfillCharacterResources?: () => void;
  isBackfillingCharacterResources?: boolean;
  characterForm: CharacterFormState;
  onCharacterFormChange: (field: keyof CharacterFormState, value: string) => void;
  onSaveCharacter: () => void;
  isSavingCharacter: boolean;
  timelineEvents: CharacterTimeline[];
  directorTakeoverEntry?: ReactNode;
}

export default function NovelCharacterPanel(props: NovelCharacterPanelProps) {
  const {
    novelId,
    llmProvider,
    llmModel,
    characterMessage,
    quickCharacterForm,
    onQuickCharacterFormChange,
    onQuickCreateCharacter,
    isQuickCreating,
    onGenerateSupplementalCharacters,
    isGeneratingSupplementalCharacters,
    onApplySupplementalCharacter,
    isApplyingSupplementalCharacter,
    characters,
    coreCharacterCount,
    baseCharacters,
    selectedBaseCharacterId,
    onSelectedBaseCharacterChange,
    selectedBaseCharacter,
    importedBaseCharacterIds,
    onImportBaseCharacter,
    isImportingBaseCharacter,
    selectedCharacterId,
    onSelectedCharacterChange,
    onDeleteCharacter,
    isDeletingCharacter,
    deletingCharacterId,
    onSyncTimeline,
    isSyncingTimeline,
    onSyncAllTimeline,
    isSyncingAllTimeline,
    onEvolveCharacter,
    isEvolvingCharacter,
    onGenerateVisibleProfile,
    isGeneratingVisibleProfile,
    visibleProfileSuggestion,
    onApplyVisibleProfile,
    isApplyingVisibleProfile,
    onGenerateBatchVisibleProfiles,
    isGeneratingBatchVisibleProfiles,
    batchVisibleProfileResult,
    onApplyBatchVisibleProfiles,
    isApplyingBatchVisibleProfiles,
    onWorldCheck,
    isCheckingWorld,
    selectedCharacter,
    characterResources = [],
    pendingCharacterResourceCount = 0,
    onBackfillCharacterResources,
    isBackfillingCharacterResources = false,
    characterForm,
    onCharacterFormChange,
    onSaveCharacter,
    isSavingCharacter,
    timelineEvents,
    directorTakeoverEntry,
  } = props;

  const { t } = useTranslation("novelsEditC");
  const [isCharacterEntryOpen, setIsCharacterEntryOpen] = useState(false);
  const [isSupplementalCharacterOpen, setIsSupplementalCharacterOpen] = useState(false);
  const [relationToProtagonist, setRelationToProtagonist] = useState("");
  const [storyFunction, setStoryFunction] = useState("");
  const [wizardKeywords, setWizardKeywords] = useState("");
  const [autoGenerateProfile, setAutoGenerateProfile] = useState(true);
  const [supplementalMode, setSupplementalMode] = useState<SupplementalCharacterGenerationMode>("auto");
  const [supplementalAnchorIds, setSupplementalAnchorIds] = useState<string[]>([]);
  const [supplementalTargetRole, setSupplementalTargetRole] = useState<CharacterCastRole | "auto">("auto");
  const [supplementalCount, setSupplementalCount] = useState<"auto" | "1" | "2" | "3">("auto");
  const [supplementalPrompt, setSupplementalPrompt] = useState("");
  const [supplementalUseWorldContext, setSupplementalUseWorldContext] = useState(true);
  const [supplementalStatusMessage, setSupplementalStatusMessage] = useState("");
  const [supplementalResult, setSupplementalResult] = useState<SupplementalCharacterGenerationResult | null>(null);
  const previousQuickCreating = useRef(isQuickCreating);

  useEffect(() => {
    if (previousQuickCreating.current && !isQuickCreating && !quickCharacterForm.name.trim()) {
      setIsCharacterEntryOpen(false);
      setRelationToProtagonist("");
      setStoryFunction("");
      setWizardKeywords("");
      setAutoGenerateProfile(true);
    }
    previousQuickCreating.current = isQuickCreating;
  }, [isQuickCreating, quickCharacterForm.name]);

  const handleQuickCreate = () => {
    const payload: QuickCharacterCreatePayload = {
      name: quickCharacterForm.name,
      role: quickCharacterForm.role,
      relationToProtagonist,
      storyFunction,
      keywords: wizardKeywords,
      autoGenerateProfile,
    };
    onQuickCreateCharacter(payload);
  };

  const handleOpenSupplementalDialog = () => {
    setIsSupplementalCharacterOpen(true);
    if (selectedCharacterId && supplementalAnchorIds.length === 0) {
      setSupplementalAnchorIds([selectedCharacterId]);
    }
  };

  const toggleSupplementalAnchor = (characterId: string) => {
    setSupplementalAnchorIds((prev) =>
      prev.includes(characterId)
        ? prev.filter((item) => item !== characterId)
        : [...prev, characterId],
    );
  };

  const handleGenerateSupplementalCharacters = async () => {
    if (supplementalMode === "linked" && characters.length === 0) {
      setSupplementalStatusMessage(t("character.supplemental.noCharactersForLinked"));
      return;
    }

    try {
      const response = await onGenerateSupplementalCharacters({
        mode: supplementalMode,
        anchorCharacterIds: supplementalMode === "independent" ? [] : supplementalAnchorIds,
        targetCastRole: supplementalTargetRole,
        count: supplementalCount === "auto" ? undefined : Number(supplementalCount),
        userPrompt: supplementalPrompt.trim() || undefined,
        useWorldContext: supplementalUseWorldContext,
        worldFocusHints: supplementalUseWorldContext
          ? { forceCompliance: true }
          : undefined,
      });
      setSupplementalResult(response.data ?? null);
      setSupplementalStatusMessage(response.message ?? t("character.supplemental.candidatesGenerated"));
    } catch (error) {
      setSupplementalStatusMessage(error instanceof Error ? error.message : t("character.supplemental.generateFailed"));
    }
  };

  const handleApplySupplementalCharacter = async (candidate: SupplementalCharacterCandidate) => {
    try {
      const response = await onApplySupplementalCharacter(candidate);
      const createdName = response.data?.character?.name ?? candidate.name;
      const relationCount = response.data?.relationCount ?? 0;
      setSupplementalResult((prev) => prev
        ? {
          ...prev,
          candidates: prev.candidates.filter((item) => item.name !== candidate.name),
        }
        : prev);
      setSupplementalStatusMessage(
        response.message
        ?? (relationCount > 0
          ? t("character.supplemental.appliedWithRelations", { name: createdName, count: relationCount })
          : t("character.supplemental.applied", { name: createdName })),
      );
    } catch (error) {
      setSupplementalStatusMessage(error instanceof Error ? error.message : t("character.supplemental.applyFailed"));
    }
  };

  return (
    <div className="space-y-5">
      <DirectorTakeoverEntryPanel
        title={t("character.takeoverTitle")}
        description={t("character.takeoverDesc")}
        entry={directorTakeoverEntry}
      />
      {characterMessage ? <div className="text-sm text-muted-foreground">{characterMessage}</div> : null}

      <StepHero
        eyebrow={t("character.heroEyebrow")}
        title={t("character.heroTitle")}
        description={t("character.heroDesc")}
      >
        <StatusRail
          items={[
            { label: t("character.stat.created"), value: characters.length, description: t("character.stat.createdDesc"), tone: characters.length > 0 ? "success" : "warning" },
            { label: t("character.stat.core"), value: coreCharacterCount, description: t("character.stat.coreDesc"), tone: coreCharacterCount > 0 ? "success" : "warning" },
            { label: t("character.stat.focus"), value: selectedCharacter?.name ?? t("character.stat.noneSelected"), description: selectedCharacter?.role || t("character.stat.baseImportable", { count: baseCharacters.length }), tone: selectedCharacter ? "info" : "neutral" },
          ]}
        />
        <StepActionBar
          className="mt-4 bg-background/70"
          label={t("character.actionsLabel")}
          description={t("character.actionsDesc")}
          actions={(
            <>
            <Button onClick={() => setIsCharacterEntryOpen(true)}>{t("character.addCharacter")}</Button>
            <AiButton variant="outline" onClick={handleOpenSupplementalDialog}>
              {t("character.supplementCharacter")}
            </AiButton>
            <AiButton
              variant="secondary"
              onClick={onEvolveCharacter}
              disabled={isEvolvingCharacter || !selectedCharacterId}
            >
              {isEvolvingCharacter ? t("character.evolving") : t("character.evolveCurrentState")}
            </AiButton>
            <AiButton
              variant="outline"
              onClick={() => onGenerateVisibleProfile()}
              disabled={isGeneratingVisibleProfile || !selectedCharacterId}
            >
              {isGeneratingVisibleProfile ? t("common.generating") : t("character.completeVisibleProfile")}
            </AiButton>
            </>
          )}
        />
      </StepHero>

      <Dialog open={isCharacterEntryOpen} onOpenChange={setIsCharacterEntryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("character.addCharacter")}</DialogTitle>
            <DialogDescription>
              {t("character.addDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="space-y-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <div className="font-medium">{t("character.quickCreate")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("character.quickCreateDesc")}
                </div>
              </div>
              <Input
                placeholder={t("character.namePlaceholder")}
                value={quickCharacterForm.name}
                onChange={(event) => onQuickCharacterFormChange("name", event.target.value)}
              />
              <SelectControl
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={quickCharacterForm.role}
                onChange={(event) => onQuickCharacterFormChange("role", event.target.value)}
              >
                <option value="主角">{t("character.roleOption.protagonist")}</option>
                <option value="配角">{t("character.roleOption.supporting")}</option>
                <option value="反派">{t("character.roleOption.antagonist")}</option>
                <option value="导师">{t("character.roleOption.mentor")}</option>
                <option value="情感线">{t("character.roleOption.loveLine")}</option>
                <option value="功能角色">{t("character.roleOption.functional")}</option>
              </SelectControl>
              <Input
                placeholder={t("character.relationPlaceholder")}
                value={relationToProtagonist}
                onChange={(event) => setRelationToProtagonist(event.target.value)}
              />
              <Input
                placeholder={t("character.storyFunctionPlaceholder")}
                value={storyFunction}
                onChange={(event) => setStoryFunction(event.target.value)}
              />
              <Input
                placeholder={t("character.keywordsPlaceholder")}
                value={wizardKeywords}
                onChange={(event) => setWizardKeywords(event.target.value)}
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoGenerateProfile}
                  onChange={(event) => setAutoGenerateProfile(event.target.checked)}
                />
                {t("character.autoCompleteProfile")}
              </label>
              <AiButton onClick={handleQuickCreate} disabled={isQuickCreating || !quickCharacterForm.name.trim()}>
                {isQuickCreating ? t("common.generating") : t("character.generateCard")}
              </AiButton>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div className="space-y-1">
                <div className="font-medium">{t("character.importFromLibrary")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("character.importFromLibraryDesc")}
                </div>
              </div>
              {baseCharacters.length > 0 ? (
                <>
                  <SelectControl
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={selectedBaseCharacterId}
                    onChange={(event) => onSelectedBaseCharacterChange(event.target.value)}
                  >
                    {baseCharacters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {t("character.baseOption", { name: character.name, role: character.role })}
                      </option>
                    ))}
                  </SelectControl>
                  {selectedBaseCharacter ? (
                    <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{selectedBaseCharacter.name}</span>
                        <Badge variant={importedBaseCharacterIds.has(selectedBaseCharacter.id) ? "outline" : "secondary"}>
                          {importedBaseCharacterIds.has(selectedBaseCharacter.id) ? t("character.linked") : t("character.notLinked")}
                        </Badge>
                      </div>
                      <div className="line-clamp-3 text-xs text-muted-foreground">
                        {t("character.personalityLine", { value: selectedBaseCharacter.personality || t("common.none") })}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={onImportBaseCharacter}
                      disabled={
                        isImportingBaseCharacter
                        || !selectedBaseCharacter
                        || importedBaseCharacterIds.has(selectedBaseCharacter.id)
                      }
                    >
                      {isImportingBaseCharacter ? t("character.importing") : t("character.importAsNovelCharacter")}
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/base-characters">{t("character.manageLibrary")}</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {t("character.libraryEmpty")}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSupplementalCharacterOpen} onOpenChange={setIsSupplementalCharacterOpen}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pb-0 pt-6">
            <DialogTitle>{t("character.supplementCharacter")}</DialogTitle>
            <DialogDescription>
              {t("character.supplemental.dialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 pb-6 pt-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] xl:overflow-hidden">
            <div className="space-y-4 rounded-2xl border p-4 xl:min-h-0 xl:overflow-y-auto">
              <div className="space-y-1">
                <div className="font-medium">{t("character.supplemental.modeTitle")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("character.supplemental.modeHint")}
                </div>
              </div>
              <SelectControl
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={supplementalMode}
                onChange={(event) => setSupplementalMode(event.target.value as SupplementalCharacterGenerationMode)}
              >
                <option value="auto">{t("character.supplemental.modeOption.auto")}</option>
                <option value="linked">{t("character.supplemental.modeOption.linked")}</option>
                <option value="independent">{t("character.supplemental.modeOption.independent")}</option>
              </SelectControl>

              {characters.length > 0 && supplementalMode !== "independent" ? (
                <div className="space-y-2">
                  <div className="font-medium">{t("character.supplemental.referenceTitle")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("character.supplemental.referenceHint")}
                  </div>
                  <div className="max-h-40 space-y-2 overflow-auto rounded-xl border bg-muted/15 p-3">
                    {characters.map((character) => (
                      <label key={character.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={supplementalAnchorIds.includes(character.id)}
                          onChange={() => toggleSupplementalAnchor(character.id)}
                        />
                        <span>
                          {character.name}
                          <span className="ml-1 text-xs text-muted-foreground">({character.role})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="font-medium">{t("character.supplemental.targetRoleTitle")}</div>
                  <SelectControl
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={supplementalTargetRole}
                    onChange={(event) => setSupplementalTargetRole(event.target.value as CharacterCastRole | "auto")}
                  >
                    <option value="auto">{t("character.castRole.auto")}</option>
                    <option value="protagonist">{t("character.castRole.protagonist")}</option>
                    <option value="antagonist">{t("character.castRole.antagonist")}</option>
                    <option value="ally">{t("character.castRole.ally")}</option>
                    <option value="foil">{t("character.castRole.foil")}</option>
                    <option value="mentor">{t("character.castRole.mentor")}</option>
                    <option value="love_interest">{t("character.castRole.loveInterest")}</option>
                    <option value="pressure_source">{t("character.castRole.pressureSource")}</option>
                    <option value="catalyst">{t("character.castRole.catalyst")}</option>
                  </SelectControl>
                </div>
                <div className="space-y-2">
                  <div className="font-medium">{t("character.supplemental.countTitle")}</div>
                  <SelectControl
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={supplementalCount}
                    onChange={(event) => setSupplementalCount(event.target.value as "auto" | "1" | "2" | "3")}
                  >
                    <option value="auto">{t("character.castRole.auto")}</option>
                    <option value="1">{t("character.supplemental.count", { count: 1 })}</option>
                    <option value="2">{t("character.supplemental.count", { count: 2 })}</option>
                    <option value="3">{t("character.supplemental.count", { count: 3 })}</option>
                  </SelectControl>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium">{t("character.supplemental.extraNotesTitle")}</div>
                <textarea
                  className="min-h-[140px] w-full rounded-xl border bg-background p-3 text-sm"
                  placeholder={t("character.supplemental.extraNotesPlaceholder")}
                  value={supplementalPrompt}
                  onChange={(event) => setSupplementalPrompt(event.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={supplementalUseWorldContext}
                  onChange={(event) => setSupplementalUseWorldContext(event.target.checked)}
                />
                {t("character.supplemental.useWorldContext")}
              </label>

              <div className="flex flex-wrap gap-2">
                <AiButton
                  onClick={handleGenerateSupplementalCharacters}
                  disabled={isGeneratingSupplementalCharacters || (supplementalMode === "linked" && characters.length === 0)}
                >
                  {isGeneratingSupplementalCharacters ? t("common.generating") : t("character.supplemental.generateButton")}
                </AiButton>
                <Badge variant="outline">{t("character.supplemental.countAutoBadge")}</Badge>
                <Badge variant="outline">{t("character.supplemental.relationBadge")}</Badge>
              </div>

              {supplementalStatusMessage ? (
                <div className="rounded-xl border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
                  {supplementalStatusMessage}
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-2xl border p-4 xl:min-h-0 xl:overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium">{t("character.supplemental.candidatesTitle")}</div>
                {supplementalResult ? <Badge variant="outline">{t("character.supplemental.candidateCount", { count: supplementalResult.candidates.length })}</Badge> : null}
                {supplementalResult?.mode ? <Badge variant="outline">{t("character.supplemental.roundMode", { value: t(SUPPLEMENTAL_MODE_LABELS[supplementalResult.mode]) })}</Badge> : null}
              </div>
              {supplementalResult?.planningSummary ? (
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-muted-foreground">
                  {t("character.supplemental.aiJudgment", { value: supplementalResult.planningSummary })}
                </div>
              ) : null}

              {isGeneratingSupplementalCharacters ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  {t("character.supplemental.analyzing")}
                </div>
              ) : supplementalResult?.candidates.length ? (
                <div className="space-y-3">
                  {supplementalResult.candidates.map((candidate) => (
                    <div key={candidate.name} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{candidate.name}</div>
                            <Badge variant="outline">{candidate.role}</Badge>
                            <Badge variant="secondary">{t(getCastRoleLabelKey(candidate.castRole))}</Badge>
                            <Badge variant="outline">{t("character.supplemental.genderLine", { value: t(getCharacterGenderLabelKey(candidate.gender)) })}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{candidate.summary}</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => void handleApplySupplementalCharacter(candidate)}
                          disabled={isApplyingSupplementalCharacter}
                        >
                          {isApplyingSupplementalCharacter ? t("character.supplemental.creating") : t("character.supplemental.createThis")}
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                          <div>{t("character.supplemental.storyFunctionLine", { value: candidate.storyFunction })}</div>
                          <div>{t("character.supplemental.relationLine", { value: candidate.relationToProtagonist || t("character.supplemental.aiUnspecified") })}</div>
                          <div>{t("character.supplemental.outerGoalLine", { value: candidate.outerGoal || t("character.supplemental.pendingFill") })}</div>
                          <div>{t("character.supplemental.currentGoalLine", { value: candidate.currentGoal || t("character.supplemental.pendingFill") })}</div>
                        </div>
                        <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                          <div>{t("character.supplemental.firstImpressionLine", { value: candidate.firstImpression || t("character.supplemental.pendingFill") })}</div>
                          <div>{t("character.supplemental.fearLine", { value: candidate.fear || t("character.supplemental.pendingFill") })}</div>
                          <div>{t("character.supplemental.misbeliefLine", { value: candidate.misbelief || t("character.supplemental.pendingFill") })}</div>
                          <div>{t("character.supplemental.whyNowLine", { value: candidate.whyNow || t("character.supplemental.aiNoExtra") })}</div>
                        </div>
                      </div>

                      {candidate.relations.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">{t("character.supplemental.suggestedRelations")}</div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {candidate.relations.map((relation, index) => (
                              <div key={`${candidate.name}-${relation.sourceName}-${relation.targetName}-${index}`} className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                                <div className="font-medium text-foreground">{getSupplementalRelationLabel(candidate, relation)}</div>
                                <div>{t("character.supplemental.surfaceRelationLine", { value: relation.surfaceRelation })}</div>
                                {relation.hiddenTension ? <div>{t("character.supplemental.hiddenTensionLine", { value: relation.hiddenTension })}</div> : null}
                                {relation.conflictSource ? <div>{t("character.supplemental.conflictSourceLine", { value: relation.conflictSource })}</div> : null}
                                {relation.nextTurnPoint ? <div>{t("character.supplemental.nextTurnPointLine", { value: relation.nextTurnPoint })}</div> : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                          {t("character.supplemental.independentNote")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm text-muted-foreground">
                  {t("character.supplemental.emptyHint")}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CharacterDiagnosticsSection
        novelId={novelId}
        characters={characters}
        selectedCharacter={selectedCharacter}
        selectedCharacterId={selectedCharacterId}
        onSelectedCharacterChange={onSelectedCharacterChange}
        llmProvider={llmProvider}
        llmModel={llmModel}
      />

      <CharacterAssetWorkspace
        characters={characters}
        selectedCharacterId={selectedCharacterId}
        onSelectedCharacterChange={onSelectedCharacterChange}
        onDeleteCharacter={onDeleteCharacter}
        isDeletingCharacter={isDeletingCharacter}
        deletingCharacterId={deletingCharacterId}
        selectedCharacter={selectedCharacter}
        characterForm={characterForm}
        onCharacterFormChange={onCharacterFormChange}
        onSaveCharacter={onSaveCharacter}
        isSavingCharacter={isSavingCharacter}
        timelineEvents={timelineEvents}
        onSyncTimeline={onSyncTimeline}
        isSyncingTimeline={isSyncingTimeline}
        onSyncAllTimeline={onSyncAllTimeline}
        isSyncingAllTimeline={isSyncingAllTimeline}
        onWorldCheck={onWorldCheck}
        isCheckingWorld={isCheckingWorld}
        onGenerateVisibleProfile={onGenerateVisibleProfile}
        isGeneratingVisibleProfile={isGeneratingVisibleProfile}
        visibleProfileSuggestion={visibleProfileSuggestion}
        onApplyVisibleProfile={onApplyVisibleProfile}
        isApplyingVisibleProfile={isApplyingVisibleProfile}
        onGenerateBatchVisibleProfiles={onGenerateBatchVisibleProfiles}
        isGeneratingBatchVisibleProfiles={isGeneratingBatchVisibleProfiles}
        batchVisibleProfileResult={batchVisibleProfileResult}
        onApplyBatchVisibleProfiles={onApplyBatchVisibleProfiles}
        isApplyingBatchVisibleProfiles={isApplyingBatchVisibleProfiles}
        characterResources={characterResources}
        pendingCharacterResourceCount={pendingCharacterResourceCount}
        onBackfillCharacterResources={onBackfillCharacterResources}
        isBackfillingCharacterResources={isBackfillingCharacterResources}
      />
    </div>
  );
}

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  Character,
  CharacterGender,
  CharacterTimeline,
  CharacterVisibleProfileBatchResult,
  CharacterVisibleProfileField,
  CharacterVisibleProfileSuggestion,
} from "@ai-novel/shared/types/novel";
import type { CharacterResourceLedgerItem } from "@ai-novel/shared/types/characterResource";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CharacterAssetSidebar from "./CharacterAssetSidebar";
import CharacterFocusSummary from "./CharacterFocusSummary";
import { isProtagonistCharacter } from "./characterAssetWorkspace.helpers";
import { getLastAppearanceChapter } from "./characterPanel.utils";
import { formatLocaleDateTime } from "@/i18n/format";
import SelectControl from "@/components/common/SelectControl";
import i18n from "@/i18n";

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

interface CharacterAssetWorkspaceProps {
  characters: Character[];
  selectedCharacterId: string;
  onSelectedCharacterChange: (id: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  isDeletingCharacter: boolean;
  deletingCharacterId: string;
  selectedCharacter?: Character;
  characterForm: CharacterFormState;
  onCharacterFormChange: (field: keyof CharacterFormState, value: string) => void;
  onSaveCharacter: () => void;
  isSavingCharacter: boolean;
  timelineEvents: CharacterTimeline[];
  onSyncTimeline: () => void;
  isSyncingTimeline: boolean;
  onSyncAllTimeline: () => void;
  isSyncingAllTimeline: boolean;
  onWorldCheck: () => void;
  isCheckingWorld: boolean;
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
  characterResources?: CharacterResourceLedgerItem[];
  pendingCharacterResourceCount?: number;
  onBackfillCharacterResources?: () => void;
  isBackfillingCharacterResources?: boolean;
}

const VISIBLE_PROFILE_FIELDS: Array<{ key: CharacterVisibleProfileField; labelKey: string; placeholderKey: string }> = [
  { key: "appearance", labelKey: "workspace.profileField.appearance.label", placeholderKey: "workspace.profileField.appearance.placeholder" },
  { key: "physique", labelKey: "workspace.profileField.physique.label", placeholderKey: "workspace.profileField.physique.placeholder" },
  { key: "attireStyle", labelKey: "workspace.profileField.attireStyle.label", placeholderKey: "workspace.profileField.attireStyle.placeholder" },
  { key: "signatureDetail", labelKey: "workspace.profileField.signatureDetail.label", placeholderKey: "workspace.profileField.signatureDetail.placeholder" },
  { key: "voiceTexture", labelKey: "workspace.profileField.voiceTexture.label", placeholderKey: "workspace.profileField.voiceTexture.placeholder" },
  { key: "presenceImpression", labelKey: "workspace.profileField.presenceImpression.label", placeholderKey: "workspace.profileField.presenceImpression.placeholder" },
];

function getSecretStatus(selectedCharacter?: Character): string {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  if (!selectedCharacter) {
    return tr("common.none");
  }
  if (selectedCharacter.secret?.trim()) {
    return tr("workspace.secret.explicit");
  }
  const runtimeSignal = `${selectedCharacter.currentState ?? ""} ${selectedCharacter.currentGoal ?? ""}`;
  return /秘密|隐瞒|卧底|伪装/.test(runtimeSignal) ? tr("workspace.secret.hidden") : tr("workspace.secret.none");
}

function getEmotionSignal(selectedCharacter?: Character): string {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  const runtimeSignal = `${selectedCharacter?.currentState ?? ""} ${selectedCharacter?.currentGoal ?? ""}`;
  if (/愤|怒|焦虑|崩溃|绝望/.test(runtimeSignal)) {
    return tr("workspace.emotion.high");
  }
  if (/平静|稳|冷静|从容/.test(runtimeSignal)) {
    return tr("workspace.emotion.stable");
  }
  return tr("workspace.emotion.observe");
}

function getResourceDisplayMode(character?: Character): {
  label: string;
  helper: string;
  limit: number;
  shouldShowResource: (item: CharacterResourceLedgerItem) => boolean;
} {
  const tr = (key: string) => i18n.t(key, { ns: "novelsEditA" });
  const roleText = `${character?.role ?? ""} ${character?.castRole ?? ""}`;
  if (isProtagonistCharacter(character)) {
    return {
      label: tr("workspace.resourceMode.protagonist.label"),
      helper: tr("workspace.resourceMode.protagonist.helper"),
      limit: 10,
      shouldShowResource: () => true,
    };
  }
  if (/临时|路人|客串|一次性/.test(roleText)) {
    return {
      label: tr("workspace.resourceMode.temporary.label"),
      helper: tr("workspace.resourceMode.temporary.helper"),
      limit: 5,
      shouldShowResource: (item) => (
        item.narrativeFunction === "promise"
        || item.narrativeFunction === "hidden_card"
        || item.expectedUseEndChapterOrder != null
        || item.status === "transferred"
      ),
    };
  }
  return {
    label: tr("workspace.resourceMode.longterm.label"),
    helper: tr("workspace.resourceMode.longterm.helper"),
    limit: 6,
    shouldShowResource: (item) => item.status !== "stale",
  };
}

function getResourceStatusLabel(status: CharacterResourceLedgerItem["status"]): string {
  const labelKeys: Record<CharacterResourceLedgerItem["status"], string> = {
    available: "workspace.resourceStatus.available",
    hidden: "workspace.resourceStatus.hidden",
    borrowed: "workspace.resourceStatus.borrowed",
    transferred: "workspace.resourceStatus.transferred",
    lost: "workspace.resourceStatus.lost",
    consumed: "workspace.resourceStatus.consumed",
    damaged: "workspace.resourceStatus.damaged",
    destroyed: "workspace.resourceStatus.destroyed",
    stale: "workspace.resourceStatus.stale",
  };
  const key = labelKeys[status];
  return key ? i18n.t(key, { ns: "novelsEditA" }) : status;
}

function getResourceFunctionLabel(value: CharacterResourceLedgerItem["narrativeFunction"]): string {
  const labelKeys: Record<CharacterResourceLedgerItem["narrativeFunction"], string> = {
    tool: "workspace.resourceFunction.tool",
    clue: "workspace.resourceFunction.clue",
    weapon: "workspace.resourceFunction.weapon",
    proof: "workspace.resourceFunction.proof",
    key: "workspace.resourceFunction.key",
    cost: "workspace.resourceFunction.cost",
    promise: "workspace.resourceFunction.promise",
    hidden_card: "workspace.resourceFunction.hiddenCard",
    constraint: "workspace.resourceFunction.constraint",
  };
  const key = labelKeys[value];
  return key ? i18n.t(key, { ns: "novelsEditA" }) : value;
}

export default function CharacterAssetWorkspace(props: CharacterAssetWorkspaceProps) {
  const { t } = useTranslation("novelsEditA");
  const {
    characters,
    selectedCharacterId,
    onSelectedCharacterChange,
    onDeleteCharacter,
    isDeletingCharacter,
    deletingCharacterId,
    selectedCharacter,
    characterForm,
    onCharacterFormChange,
    onSaveCharacter,
    isSavingCharacter,
    timelineEvents,
    onSyncTimeline,
    isSyncingTimeline,
    onSyncAllTimeline,
    isSyncingAllTimeline,
    onWorldCheck,
    isCheckingWorld,
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
    characterResources = [],
    pendingCharacterResourceCount = 0,
    onBackfillCharacterResources,
    isBackfillingCharacterResources = false,
  } = props;
  const [visibleProfileGuidance, setVisibleProfileGuidance] = useState("");

  const lastAppearanceChapter = useMemo(
    () => getLastAppearanceChapter(timelineEvents),
    [timelineEvents],
  );
  const emotionSignal = getEmotionSignal(selectedCharacter);
  const secretStatus = getSecretStatus(selectedCharacter);
  const selectedCharacterResources = useMemo(
    () => selectedCharacter
      ? characterResources.filter((item) => (
          item.holderCharacterId === selectedCharacter.id
          || item.ownerCharacterId === selectedCharacter.id
        ))
      : [],
    [characterResources, selectedCharacter],
  );
  const resourceDisplayMode = getResourceDisplayMode(selectedCharacter);
  const displayedResources = selectedCharacterResources
    .filter(resourceDisplayMode.shouldShowResource)
    .slice(0, resourceDisplayMode.limit);
  const hasVisibleProfileSuggestionForSelected = Boolean(
    visibleProfileSuggestion
    && selectedCharacter
    && visibleProfileSuggestion.characterId === selectedCharacter.id,
  );
  const applicableVisibleProfileCount = Object.keys(visibleProfileSuggestion?.fields ?? {}).length;
  const batchApplicableCount = batchVisibleProfileResult?.results.filter((item) => item.hasApplicableChanges).length ?? 0;
  const isSelectedProtagonist = isProtagonistCharacter(selectedCharacter);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("workspace.title")}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {t("workspace.subtitle")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{t("workspace.createdCount", { count: characters.length })}</Badge>
            {selectedCharacter ? <Badge variant="secondary">{t("workspace.editing", { name: selectedCharacter.name })}</Badge> : null}
            {isSelectedProtagonist ? <Badge variant="outline">{t("common.protagonist")}</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <CharacterAssetSidebar
          characters={characters}
          selectedCharacterId={selectedCharacterId}
          onSelectedCharacterChange={onSelectedCharacterChange}
          onDeleteCharacter={onDeleteCharacter}
          isDeletingCharacter={isDeletingCharacter}
          deletingCharacterId={deletingCharacterId}
        />

        {!selectedCharacter ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm text-muted-foreground">
            {t("workspace.emptySelect")}
          </div>
        ) : (
          <div className="space-y-4">
            <CharacterFocusSummary
              selectedCharacter={selectedCharacter}
              lastAppearanceChapter={lastAppearanceChapter}
            />
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">{t("workspace.runStatus")}</div>
                <div className="mt-2 text-xs text-muted-foreground">{t("workspace.currentState", { value: selectedCharacter.currentState || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">{t("common.currentGoal", { value: selectedCharacter.currentGoal || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">{t("workspace.emotionTone", { value: emotionSignal })}</div>
                <div className="text-xs text-muted-foreground">{t("workspace.secretStatus", { value: secretStatus })}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">{t("workspace.dramaBlueprint")}</div>
                <div className="mt-2 text-xs text-muted-foreground">{t("workspace.storyFunction", { value: selectedCharacter.storyFunction || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">
                  {t("common.relationToProtagonist", { value: selectedCharacter.relationToProtagonist || t("common.toFill") })}
                </div>
                <div className="text-xs text-muted-foreground">{t("common.outerGoal", { value: selectedCharacter.outerGoal || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">{t("workspace.innerNeed", { value: selectedCharacter.innerNeed || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">
                  {t("workspace.fearWound", { value: selectedCharacter.fear || selectedCharacter.wound || t("common.toFill") })}
                </div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">{t("workspace.personalityArc")}</div>
                <div className="mt-2 text-xs text-muted-foreground">{t("workspace.personality", { value: selectedCharacter.personality || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">{t("workspace.background", { value: selectedCharacter.background || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">{t("workspace.development", { value: selectedCharacter.development || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">{t("workspace.misbelief", { value: selectedCharacter.misbelief || t("common.toFill") })}</div>
                <div className="text-xs text-muted-foreground">{t("workspace.moralLine", { value: selectedCharacter.moralLine || t("common.toFill") })}</div>
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-medium">{t("workspace.visibleProfile")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("workspace.visibleProfileHint")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AiButton
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateVisibleProfile(visibleProfileGuidance)}
                    disabled={isGeneratingVisibleProfile || !selectedCharacterId}
                  >
                    {isGeneratingVisibleProfile ? t("common.generating") : t("workspace.aiFillProfile")}
                  </AiButton>
                  <AiButton
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateBatchVisibleProfiles(visibleProfileGuidance)}
                    disabled={isGeneratingBatchVisibleProfiles || characters.length === 0}
                  >
                    {isGeneratingBatchVisibleProfiles ? t("common.generating") : t("workspace.batchFillProfile")}
                  </AiButton>
                </div>
              </div>
              <div className="mt-3">
                <textarea
                  className="min-h-[72px] w-full rounded-md border bg-background p-2 text-sm"
                  placeholder={t("workspace.guidancePlaceholder")}
                  value={visibleProfileGuidance}
                  onChange={(event) => setVisibleProfileGuidance(event.target.value)}
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("workspace.guidanceHint")}
                </div>
              </div>
              {isGeneratingVisibleProfile ? (
                <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
                  {t("workspace.generatingFor", { name: selectedCharacter.name })}
                </div>
              ) : null}
              {hasVisibleProfileSuggestionForSelected && visibleProfileSuggestion ? (
                <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        {applicableVisibleProfileCount > 0
                          ? t("workspace.suggestionGenerated", { name: visibleProfileSuggestion.characterName, count: applicableVisibleProfileCount })
                          : t("workspace.suggestionNone", { name: visibleProfileSuggestion.characterName })}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("workspace.reviewDiffHint")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={onApplyVisibleProfile}
                      disabled={isApplyingVisibleProfile || applicableVisibleProfileCount === 0}
                    >
                      {isApplyingVisibleProfile ? t("common.saving") : t("workspace.saveToCard")}
                    </Button>
                  </div>
                  {visibleProfileSuggestion.warnings.length > 0 ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-900">
                      {visibleProfileSuggestion.warnings.map((warning) => (
                        <div key={warning}>{t("workspace.warning", { value: warning })}</div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 grid gap-2 lg:grid-cols-2">
                    {VISIBLE_PROFILE_FIELDS.map((field) => {
                      const nextValue = visibleProfileSuggestion.fields[field.key];
                      const skippedReason = visibleProfileSuggestion.skippedFields[field.key];
                      return (
                        <div key={field.key} className="rounded-md border bg-background/80 p-2 text-xs leading-5">
                          <div className="font-medium">{t(field.labelKey)}</div>
                          <div className="text-muted-foreground">{t("workspace.fieldCurrent", { value: selectedCharacter[field.key] || t("common.toFill") })}</div>
                          <div>{t("workspace.fieldSuggested", { value: nextValue || skippedReason || t("workspace.skipWrite") })}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {!isGeneratingVisibleProfile && !hasVisibleProfileSuggestionForSelected ? (
                <div className="mt-3 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  {t("workspace.diffPreviewHint")}
                </div>
              ) : null}
              {batchVisibleProfileResult ? (
                <div className="mt-3 rounded-lg border border-border/70 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-medium">
                      {t("workspace.batchSuggestion", { count: batchApplicableCount })}
                    </div>
                    <Button
                      size="sm"
                      onClick={onApplyBatchVisibleProfiles}
                      disabled={isApplyingBatchVisibleProfiles || batchApplicableCount === 0}
                    >
                      {isApplyingBatchVisibleProfiles ? t("workspace.writing") : t("workspace.writeBatch")}
                    </Button>
                  </div>
                  <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1">
                    {batchVisibleProfileResult.results.map((result) => (
                      <div key={result.characterId} className="rounded-md border bg-muted/10 p-2 text-xs leading-5">
                        <div className="font-medium">{result.characterName}</div>
                        <div className="text-muted-foreground">
                          {result.hasApplicableChanges
                            ? t("workspace.canWriteCount", { count: Object.keys(result.fields).length })
                            : t("workspace.noWritable")}
                        </div>
                        <div>{VISIBLE_PROFILE_FIELDS.map((field) => result.fields[field.key]).filter(Boolean).join(" / ")}</div>
                      </div>
                    ))}
                    {batchVisibleProfileResult.skippedCharacters.map((item) => (
                      <div key={item.characterId} className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                        {t("workspace.skippedCharacter", { name: item.characterName, reason: item.reason })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {VISIBLE_PROFILE_FIELDS.map((field) => (
                  <div key={field.key} className="rounded-lg border border-border/70 bg-muted/15 p-3">
                    <div className="text-xs font-medium text-muted-foreground">{t(field.labelKey)}</div>
                    <div className="mt-1 text-sm leading-6">{selectedCharacter[field.key] || t("common.toFill")}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">{t("workspace.keyResources")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{resourceDisplayMode.helper}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onBackfillCharacterResources?.()}
                    disabled={isBackfillingCharacterResources || !onBackfillCharacterResources}
                  >
                    {isBackfillingCharacterResources ? t("workspace.backfilling") : t("workspace.backfillRecent")}
                  </Button>
                  <Badge variant="outline">{resourceDisplayMode.label}</Badge>
                  {pendingCharacterResourceCount > 0 ? (
                    <Badge variant="secondary">{t("workspace.pendingResourceChanges", { count: pendingCharacterResourceCount })}</Badge>
                  ) : null}
                </div>
              </div>

              {displayedResources.length > 0 ? (
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  {displayedResources.map((resource) => (
                    <div key={resource.id} className="rounded-lg border border-border/70 bg-muted/15 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{resource.name}</div>
                        <Badge variant={resource.status === "available" || resource.status === "borrowed" ? "default" : "outline"}>
                          {getResourceStatusLabel(resource.status)}
                        </Badge>
                        <Badge variant="secondary">{getResourceFunctionLabel(resource.narrativeFunction)}</Badge>
                      </div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{resource.summary}</div>
                      <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <div>{t("workspace.holder", { value: resource.holderCharacterName || selectedCharacter.name })}</div>
                        <div>{t("workspace.readerKnows", { value: resource.readerKnows ? t("workspace.aware") : t("workspace.notPublic") })}</div>
                        {resource.expectedUseEndChapterOrder ? (
                          <div>{t("workspace.useWindow", { start: resource.expectedUseStartChapterOrder ?? "?", end: resource.expectedUseEndChapterOrder })}</div>
                        ) : null}
                        {resource.constraints.length > 0 ? (
                          <div>{t("workspace.constraints", { value: resource.constraints.slice(0, 2).join(" / ") })}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {t("workspace.resourcesEmpty")}
                </div>
              )}
            </div>

            <details className="rounded-xl border p-3" open>
              <summary className="cursor-pointer font-medium">{t("workspace.fullSettings")}</summary>
              <div className="mt-3 space-y-2">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder={t("workspace.namePlaceholder")}
                    value={characterForm.name}
                    onChange={(event) => onCharacterFormChange("name", event.target.value)}
                  />
                  <Input
                    placeholder={t("workspace.rolePlaceholderField")}
                    value={characterForm.role}
                    onChange={(event) => onCharacterFormChange("role", event.target.value)}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <SelectControl
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={characterForm.gender}
                    onChange={(event) => onCharacterFormChange("gender", event.target.value)}
                  >
                    <option value="unknown">{t("workspace.genderUnknown")}</option>
                    <option value="male">{t("workspace.genderMale")}</option>
                    <option value="female">{t("workspace.genderFemale")}</option>
                    <option value="other">{t("workspace.genderOther")}</option>
                  </SelectControl>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder={t("workspace.currentStatePlaceholder")}
                    value={characterForm.currentState}
                    onChange={(event) => onCharacterFormChange("currentState", event.target.value)}
                  />
                  <Input
                    placeholder={t("workspace.currentGoalPlaceholder")}
                    value={characterForm.currentGoal}
                    onChange={(event) => onCharacterFormChange("currentGoal", event.target.value)}
                  />
                </div>
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                  placeholder={t("workspace.personalityPlaceholder")}
                  value={characterForm.personality}
                  onChange={(event) => onCharacterFormChange("personality", event.target.value)}
                />
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                  placeholder={t("workspace.backgroundPlaceholder")}
                  value={characterForm.background}
                  onChange={(event) => onCharacterFormChange("background", event.target.value)}
                />
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                  placeholder={t("workspace.developmentPlaceholder")}
                  value={characterForm.development}
                  onChange={(event) => onCharacterFormChange("development", event.target.value)}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  {VISIBLE_PROFILE_FIELDS.map((field) => (
                    <textarea
                      key={field.key}
                      className="min-h-[72px] w-full rounded-md border bg-background p-2 text-sm"
                      placeholder={t("workspace.fieldPlaceholder", { label: t(field.labelKey), placeholder: t(field.placeholderKey) })}
                      value={characterForm[field.key]}
                      onChange={(event) => onCharacterFormChange(field.key, event.target.value)}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={onSaveCharacter} disabled={isSavingCharacter}>
                    {isSavingCharacter ? t("common.saving") : t("workspace.saveAsset")}
                  </Button>
                  <AiButton size="sm" variant="outline" onClick={onSyncTimeline} disabled={isSyncingTimeline}>
                    {isSyncingTimeline ? t("common.syncing") : t("workspace.syncTimeline")}
                  </AiButton>
                  <AiButton
                    size="sm"
                    variant="outline"
                    onClick={onSyncAllTimeline}
                    disabled={isSyncingAllTimeline}
                  >
                    {isSyncingAllTimeline ? t("common.syncing") : t("workspace.syncAllTimeline")}
                  </AiButton>
                  <AiButton size="sm" variant="outline" onClick={onWorldCheck} disabled={isCheckingWorld}>
                    {isCheckingWorld ? t("common.checking") : t("workspace.checkWorld")}
                  </AiButton>
                </div>
              </div>
            </details>

            <details className="rounded-xl border p-3">
              <summary className="cursor-pointer font-medium">{t("workspace.arcNodes")}</summary>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>{t("workspace.arcStart", { value: selectedCharacter.arcStart || t("common.toFill") })}</div>
                <div>{t("workspace.arcMidpoint", { value: selectedCharacter.arcMidpoint || t("common.toFill") })}</div>
                <div>{t("workspace.arcClimax", { value: selectedCharacter.arcClimax || t("common.toFill") })}</div>
                <div>{t("workspace.arcEnd", { value: selectedCharacter.arcEnd || t("common.toFill") })}</div>
                <div>{t("workspace.firstImpression", { value: selectedCharacter.firstImpression || t("common.toFill") })}</div>
                <div>{t("workspace.secret", { value: selectedCharacter.secret || t("common.toFill") })}</div>
              </div>
            </details>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("workspace.eventStream")}</div>
              {timelineEvents.length > 0 ? (
                timelineEvents.slice(-12).reverse().map((event) => (
                  <div key={event.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{event.title}</div>
                      <Badge variant="outline">{event.source}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.chapterOrder ? t("workspace.eventChapter", { order: event.chapterOrder }) : t("workspace.noChapterAttribution")} ·{" "}
                      {formatLocaleDateTime(event.createdAt)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{event.content}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {t("workspace.noEvents")}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

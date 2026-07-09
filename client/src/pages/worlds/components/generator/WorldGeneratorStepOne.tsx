import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { WorldOptionRefinementLevel, WorldReferenceAnchor, WorldReferenceMode } from "@ai-novel/shared/types/worldWizard";
import { Button } from "@/components/ui/button";
import KnowledgeDocumentPicker from "@/components/knowledge/KnowledgeDocumentPicker";
import type {
  GeneratorGenreOption,
  InspirationMode,
  WorldGeneratorConceptCard,
} from "./worldGeneratorShared";
import { REFERENCE_MODE_OPTIONS } from "./worldGeneratorShared";
import SelectControl from "@/components/common/SelectControl";

const INSPIRATION_MODE_CARDS: Array<{
  value: InspirationMode;
  title: string;
  description: string;
}> = [
  {
    value: "free",
    title: "stepOne.inspiration.free.title",
    description: "stepOne.inspiration.free.desc",
  },
  {
    value: "reference",
    title: "stepOne.inspiration.reference.title",
    description: "stepOne.inspiration.reference.desc",
  },
  {
    value: "random",
    title: "stepOne.inspiration.random.title",
    description: "stepOne.inspiration.random.desc",
  },
];

interface WorldGeneratorStepOneProps {
  worldName: string;
  selectedGenreId: string;
  selectedGenre: GeneratorGenreOption | null;
  genreOptions: GeneratorGenreOption[];
  genreLoading: boolean;
  inspirationMode: InspirationMode;
  referenceMode: WorldReferenceMode;
  selectedKnowledgeDocumentIds: string[];
  preserveText: string;
  allowedChangesText: string;
  forbiddenText: string;
  inspirationText: string;
  optionRefinementLevel: WorldOptionRefinementLevel;
  optionsCount: number;
  canAnalyze: boolean;
  analyzeStreaming: boolean;
  analyzeButtonLabel: string;
  analyzeProgressMessage?: string;
  inspirationSourceMeta: {
    extracted: boolean;
    originalLength: number;
    chunkCount: number;
  } | null;
  concept: WorldGeneratorConceptCard | null;
  propertyOptionsCount: number;
  referenceAnchors: WorldReferenceAnchor[];
  onWorldNameChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onOpenGenreManager: () => void;
  onInspirationModeChange: (value: InspirationMode) => void;
  onKnowledgeDocumentIdsChange: (ids: string[]) => void;
  onReferenceModeChange: (value: WorldReferenceMode) => void;
  onPreserveTextChange: (value: string) => void;
  onAllowedChangesTextChange: (value: string) => void;
  onForbiddenTextChange: (value: string) => void;
  onInspirationTextChange: (value: string) => void;
  onOptionRefinementLevelChange: (value: WorldOptionRefinementLevel) => void;
  onOptionsCountChange: (value: number) => void;
  onAnalyze: () => void;
}

export default function WorldGeneratorStepOne(props: WorldGeneratorStepOneProps) {
  const {
    worldName,
    selectedGenreId,
    selectedGenre,
    genreOptions,
    genreLoading,
    inspirationMode,
    referenceMode,
    selectedKnowledgeDocumentIds,
    preserveText,
    allowedChangesText,
    forbiddenText,
    inspirationText,
    optionRefinementLevel,
    optionsCount,
    canAnalyze,
    analyzeStreaming,
    analyzeButtonLabel,
    analyzeProgressMessage,
    inspirationSourceMeta,
    concept,
    propertyOptionsCount,
    referenceAnchors,
    onWorldNameChange,
    onGenreChange,
    onOpenGenreManager,
    onInspirationModeChange,
    onKnowledgeDocumentIdsChange,
    onReferenceModeChange,
    onPreserveTextChange,
    onAllowedChangesTextChange,
    onForbiddenTextChange,
    onInspirationTextChange,
    onOptionRefinementLevelChange,
    onOptionsCountChange,
    onAnalyze,
  } = props;

  const { t } = useTranslation("worldsComponentsB");
  const isReferenceMode = inspirationMode === "reference";
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-background p-4 space-y-3">
        <div>
          <div className="text-sm font-medium">{t("stepOne.worldNameTitle")}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("stepOne.worldNameHint")}
          </div>
        </div>
        <input
          className="w-full rounded-md border p-2 text-sm"
          placeholder={t("stepOne.worldNamePlaceholder")}
          value={worldName}
          onChange={(event) => onWorldNameChange(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-sm font-medium">{t("stepOne.genreTitle")}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("stepOne.genreHint")}
          </div>
        </div>
        <SelectControl
          className="w-full rounded-md border bg-background p-2 text-sm"
          value={selectedGenreId}
          disabled={genreLoading || genreOptions.length === 0}
          onChange={(event) => onGenreChange(event.target.value)}
        >
          <option value="">{genreLoading ? t("stepOne.genreLoading") : t("stepOne.genrePlaceholder")}</option>
          {genreOptions.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.path}
            </option>
          ))}
        </SelectControl>
        {selectedGenre ? (
          <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
            <div>{t("stepOne.genrePathLabel", { path: selectedGenre.path })}</div>
            {selectedGenre.description?.trim() ? <div>{t("stepOne.genreDescLabel", { desc: selectedGenre.description.trim() })}</div> : null}
            {selectedGenre.template?.trim() ? (
              <div className="whitespace-pre-wrap">{t("stepOne.genreTemplateLabel", { template: selectedGenre.template.trim() })}</div>
            ) : null}
          </div>
        ) : null}
        {genreLoading ? <div className="text-xs text-muted-foreground">{t("stepOne.genreTreeLoading")}</div> : null}
          {!genreLoading && genreOptions.length === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground space-y-2">
            <div>{t("stepOne.genreEmpty")}</div>
            <Button type="button" variant="outline" onClick={onOpenGenreManager}>
              {t("stepOne.genreEmptyAction")}
            </Button>
          </div>
        ) : null}
        <div className="text-xs text-muted-foreground">
          {t("stepOne.genreFooter")}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">{t("stepOne.creationMethodTitle")}</div>
        <div className="grid gap-3 md:grid-cols-3">
          {INSPIRATION_MODE_CARDS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={[
                "rounded-md border p-3 text-left transition-colors",
                inspirationMode === item.value ? "border-primary bg-primary/5" : "border-border/70 bg-background hover:bg-muted/40",
              ].join(" ")}
              onClick={() => onInspirationModeChange(item.value)}
            >
              <div className="text-sm font-medium text-foreground">{t(item.title)}</div>
              <div className="mt-2 text-xs text-muted-foreground">{t(item.description)}</div>
            </button>
          ))}
        </div>
      </div>

      {isReferenceMode ? (
        <div className="space-y-3">
          <KnowledgeDocumentPicker
            selectedIds={selectedKnowledgeDocumentIds}
            onChange={(next) => onKnowledgeDocumentIdsChange(next ?? [])}
            title={t("stepOne.knowledgeTitle")}
            description={t("stepOne.knowledgeDesc")}
            queryStatus="enabled"
          />

          <div className="rounded-md border p-3 text-sm space-y-2">
            <div className="font-medium">{t("stepOne.referenceModeTitle")}</div>
            <SelectControl
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={referenceMode}
              onChange={(event) => onReferenceModeChange(event.target.value as WorldReferenceMode)}
            >
              {REFERENCE_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </SelectControl>
            <div className="text-xs text-muted-foreground">
              {t(REFERENCE_MODE_OPTIONS.find((item) => item.value === referenceMode)?.description ?? "")}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3 text-sm space-y-2">
              <div className="font-medium">{t("stepOne.preserveTitle")}</div>
              <textarea
                className="min-h-[120px] w-full rounded-md border p-2 text-sm"
                placeholder={t("stepOne.preservePlaceholder")}
                value={preserveText}
                onChange={(event) => onPreserveTextChange(event.target.value)}
              />
            </div>

            <div className="rounded-md border p-3 text-sm space-y-2">
              <div className="font-medium">{t("stepOne.allowedTitle")}</div>
              <textarea
                className="min-h-[120px] w-full rounded-md border p-2 text-sm"
                placeholder={t("stepOne.allowedPlaceholder")}
                value={allowedChangesText}
                onChange={(event) => onAllowedChangesTextChange(event.target.value)}
              />
            </div>

            <div className="rounded-md border p-3 text-sm space-y-2">
              <div className="font-medium">{t("stepOne.forbiddenTitle")}</div>
              <textarea
                className="min-h-[120px] w-full rounded-md border p-2 text-sm"
                placeholder={t("stepOne.forbiddenPlaceholder")}
                value={forbiddenText}
                onChange={(event) => onForbiddenTextChange(event.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <textarea
        className="min-h-[180px] w-full rounded-md border p-2 text-sm"
        placeholder={
          isReferenceMode
            ? t("stepOne.inspirationPlaceholder.reference")
            : inspirationMode === "random"
              ? t("stepOne.inspirationPlaceholder.random")
              : t("stepOne.inspirationPlaceholder.free")
        }
        value={inspirationText}
        onChange={(event) => onInspirationTextChange(event.target.value)}
      />

      <div className="rounded-md border p-3 text-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-medium">{t("stepOne.preferencesTitle")}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t("stepOne.preferencesHint")}
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreferencesOpen((value) => !value)}>
            {preferencesOpen ? t("stepOne.preferencesCollapse") : t("stepOne.preferencesExpand")}
          </Button>
        </div>
        {preferencesOpen ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="font-medium">{t("stepOne.refinementTitle")}</div>
              <SelectControl
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={optionRefinementLevel}
                onChange={(event) => onOptionRefinementLevelChange(event.target.value as WorldOptionRefinementLevel)}
              >
                <option value="basic">{t("stepOne.refinement.basic")}</option>
                <option value="standard">{t("stepOne.refinement.standard")}</option>
                <option value="detailed">{t("stepOne.refinement.detailed")}</option>
              </SelectControl>
            </div>
            <div className="space-y-2">
              <div className="font-medium">{t("stepOne.attrCountTitle")}</div>
              <input
                className="w-full rounded-md border p-2 text-sm"
                type="number"
                min={4}
                max={8}
                value={optionsCount}
                onChange={(event) => onOptionsCountChange(Number(event.target.value) || 6)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <Button onClick={onAnalyze} disabled={!canAnalyze}>
        {analyzeButtonLabel}
      </Button>

      {analyzeStreaming ? (
        <div className="rounded-md border p-3 text-sm space-y-1">
          <div className="font-medium">{t("stepOne.progressTitle")}</div>
          <div>{analyzeProgressMessage ?? t("stepOne.progressStarting")}</div>
          <div className="text-xs text-muted-foreground">
            {isReferenceMode
              ? t("stepOne.progressSteps.reference")
              : t("stepOne.progressSteps.free")}
          </div>
        </div>
      ) : null}

      {inspirationSourceMeta?.extracted ? (
        <div className="text-xs text-muted-foreground">
          {t("stepOne.extracted", { length: inspirationSourceMeta.originalLength, count: inspirationSourceMeta.chunkCount })}
        </div>
      ) : null}

      {concept ? (
        <div className="rounded-md border p-3 text-sm space-y-2">
          <div className="font-medium">{isReferenceMode ? t("stepOne.conceptTitle.reference") : t("stepOne.conceptTitle.free")}</div>
          <div>{t("stepOne.conceptType", { type: concept.worldType })}</div>
          <div>{t("stepOne.conceptTone", { tone: concept.tone })}</div>
          <div>{t("stepOne.conceptKeywords", { keywords: concept.keywords.join(" / ") || "-" })}</div>
          <div>{t("stepOne.conceptPropCount", { count: propertyOptionsCount })}</div>
          {isReferenceMode && referenceAnchors.length > 0 ? (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">{t("stepOne.anchorsTitle")}</div>
              {referenceAnchors.map((anchor) => (
                <div key={anchor.id} className="text-xs text-muted-foreground">
                  {t("stepOne.anchorLine", { label: anchor.label, content: anchor.content })}
                </div>
              ))}
            </div>
          ) : null}
          <div className="whitespace-pre-wrap">{concept.summary}</div>
        </div>
      ) : null}
    </div>
  );
}

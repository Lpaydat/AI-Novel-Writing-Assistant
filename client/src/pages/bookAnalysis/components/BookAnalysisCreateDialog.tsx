import {
  BOOK_ANALYSIS_PRESETS,
  BOOK_ANALYSIS_SECTIONS,
  DEFAULT_BOOK_ANALYSIS_BUDGET_TOKENS,
  type BookAnalysisPreset,
} from "@ai-novel/shared/types/bookAnalysis";
import type { DocumentChapter, KnowledgeDocumentDetail, KnowledgeDocumentSummary } from "@ai-novel/shared/types/knowledge";
import { useTranslation } from "react-i18next";
import LLMSelector from "@/components/common/LLMSelector";
import BookAnalysisSourceRangePicker from "./BookAnalysisSourceRangePicker";
import { Button } from "@/components/ui/button";
import { AppDialogContent, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { LLMConfigState } from "../bookAnalysis.types";
import type { BookAnalysisMode, BookAnalysisSourceRangeDraft, NovelOption } from "../hooks/bookAnalysisWorkspace.types";
import SelectControl from "@/components/common/SelectControl";

interface BookAnalysisCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisMode: BookAnalysisMode;
  selectedDocumentId: string;
  selectedVersionId: string;
  selectedDiagnosisNovelId: string;
  userFocusInstruction: string;
  selectedSourceRange: BookAnalysisSourceRangeDraft;
  budgetTokens: number | null;
  analysisPreset: BookAnalysisPreset;
  llmConfig: LLMConfigState;
  documentOptions: KnowledgeDocumentSummary[];
  versionOptions: KnowledgeDocumentDetail["versions"];
  sourceDocument?: KnowledgeDocumentDetail;
  sourceChapters: DocumentChapter[];
  sourceChaptersRequested: boolean;
  sourceChaptersLoading: boolean;
  sourceChaptersError: string;
  novelOptions: NovelOption[];
  createPending: boolean;
  createDiagnosisPending: boolean;
  onModeChange: (mode: BookAnalysisMode) => void;
  onSelectDocument: (documentId: string) => void;
  onSelectVersion: (versionId: string) => void;
  onSelectDiagnosisNovel: (novelId: string) => void;
  onUserFocusInstructionChange: (instruction: string) => void;
  onSourceRangeChange: (range: BookAnalysisSourceRangeDraft) => void;
  onBudgetTokensChange: (budgetTokens: number | null) => void;
  onRequestSourceChapters: () => void;
  onAnalysisPresetChange: (preset: BookAnalysisPreset) => void;
  onLlmConfigChange: (config: LLMConfigState) => void;
  onCreate: () => void;
  onCreateDiagnosis: () => void;
}

const ESTIMATED_SEGMENT_CHARS = 10_000;
const MAX_ESTIMATED_SEGMENTS = 12;

function formatCount(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function getBookAnalysisScaleLabel(charCount: number): { labelKey: string; toneKey: string } {
  if (charCount >= 300_000) {
    return { labelKey: "createDialog.scaleLarge", toneKey: "createDialog.scaleLargeTone" };
  }
  if (charCount >= 100_000) {
    return { labelKey: "createDialog.scaleMedium", toneKey: "createDialog.scaleMediumTone" };
  }
  return { labelKey: "createDialog.scaleLight", toneKey: "createDialog.scaleLightTone" };
}

function getPresetSectionTitles(sectionKeys: readonly string[], separator: string): string {
  return sectionKeys
    .map((key) => BOOK_ANALYSIS_SECTIONS.find((section) => section.key === key)?.title)
    .filter((title): title is string => Boolean(title))
    .join(separator);
}

export default function BookAnalysisCreateDialog(props: BookAnalysisCreateDialogProps) {
  const {
    open,
    onOpenChange,
    analysisMode,
    selectedDocumentId,
    selectedVersionId,
    selectedDiagnosisNovelId,
    userFocusInstruction,
    selectedSourceRange,
    budgetTokens,
    analysisPreset,
    llmConfig,
    documentOptions,
    versionOptions,
    sourceDocument,
    sourceChapters,
    sourceChaptersRequested,
    sourceChaptersLoading,
    sourceChaptersError,
    novelOptions,
    createPending,
    createDiagnosisPending,
    onModeChange,
    onSelectDocument,
    onSelectVersion,
    onSelectDiagnosisNovel,
    onUserFocusInstructionChange,
    onSourceRangeChange,
    onBudgetTokensChange,
    onRequestSourceChapters,
    onAnalysisPresetChange,
    onLlmConfigChange,
    onCreate,
    onCreateDiagnosis,
  } = props;
  const { t } = useTranslation("bookAnalysisComponents");

  const isDiagnosisMode = analysisMode === "diagnosis";
  const selectedSourceVersion = sourceDocument?.versions.find((version) => version.id === selectedVersionId)
    ?? sourceDocument?.versions.find((version) => version.isActive)
    ?? sourceDocument?.versions[0];
  const sourceCharCount = selectedSourceVersion?.charCount ?? selectedSourceVersion?.content.length ?? 0;
  const sortedSourceChapters = [...sourceChapters].sort((a, b) => a.chapterIndex - b.chapterIndex);
  const rangeStartChapter = selectedSourceRange
    ? sortedSourceChapters.find((chapter) => chapter.chapterIndex === selectedSourceRange.startChapterIndex)
    : null;
  const rangeEndChapter = selectedSourceRange
    ? sortedSourceChapters.find((chapter) => chapter.chapterIndex === selectedSourceRange.endChapterIndex)
    : null;
  const selectedRangeCharCount = rangeStartChapter && rangeEndChapter
    ? Math.max(0, rangeEndChapter.endOffset - rangeStartChapter.startOffset)
    : sourceCharCount;
  const effectiveSourceCharCount = selectedSourceRange ? selectedRangeCharCount : sourceCharCount;
  const sourceRangeValid = !selectedSourceRange || Boolean(rangeStartChapter && rangeEndChapter && selectedRangeCharCount > 0);
  const estimatedSegmentCount = effectiveSourceCharCount > 0
    ? Math.min(MAX_ESTIMATED_SEGMENTS, Math.max(1, Math.ceil(effectiveSourceCharCount / ESTIMATED_SEGMENT_CHARS)))
    : 0;
  const selectedPreset = BOOK_ANALYSIS_PRESETS.find((preset) => preset.key === analysisPreset) ?? BOOK_ANALYSIS_PRESETS[1];
  const estimatedSectionCount = selectedPreset.sectionKeys.length;
  const estimatedLlmCalls = estimatedSegmentCount > 0 ? estimatedSegmentCount + estimatedSectionCount : 0;
  const scale = getBookAnalysisScaleLabel(effectiveSourceCharCount);

  const canSubmit = isDiagnosisMode
    ? Boolean(selectedDiagnosisNovelId) && !createDiagnosisPending
    : Boolean(selectedDocumentId) && sourceRangeValid && !createPending;
  const submitting = isDiagnosisMode ? createDiagnosisPending : createPending;
  const submitLabel = isDiagnosisMode
    ? (createDiagnosisPending ? t("createDialog.creatingDiagnosis") : t("createDialog.createDiagnosis"))
    : (createPending ? t("createDialog.creating") : t("createDialog.create"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        title={t("createDialog.title")}
        description={t("createDialog.description")}
        className="max-w-4xl"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("createDialog.cancel")}
            </Button>
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={isDiagnosisMode ? onCreateDiagnosis : onCreate}
            >
              {submitLabel}
            </Button>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/20 p-1">
              <Button
                type="button"
                size="sm"
                variant={analysisMode === "reference" ? "default" : "ghost"}
                onClick={() => onModeChange("reference")}
              >
                {t("createDialog.modeReference")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isDiagnosisMode ? "default" : "ghost"}
                onClick={() => onModeChange("diagnosis")}
              >
                {t("createDialog.modeDiagnosis")}
              </Button>
            </div>

            {isDiagnosisMode ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">{t("createDialog.diagnosisNovelLabel")}</div>
                <SelectControl
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={selectedDiagnosisNovelId}
                  onChange={(event) => onSelectDiagnosisNovel(event.target.value)}
                >
                  <option value="">{t("createDialog.selectNovel")}</option>
                  {novelOptions.map((novel) => (
                    <option key={novel.id} value={novel.id}>
                      {novel.title}
                    </option>
                  ))}
                </SelectControl>
                <div className="rounded-md border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                  {t("createDialog.diagnosisHint")}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("createDialog.documentLabel")}</div>
                  <SelectControl
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={selectedDocumentId}
                    onChange={(event) => onSelectDocument(event.target.value)}
                  >
                    <option value="">{t("createDialog.selectDocument")}</option>
                    {documentOptions.map((document) => (
                      <option key={document.id} value={document.id}>
                        {document.title}
                      </option>
                    ))}
                  </SelectControl>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("createDialog.versionLabel")}</div>
                  <SelectControl
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={selectedVersionId}
                    onChange={(event) => onSelectVersion(event.target.value)}
                    disabled={!selectedDocumentId}
                  >
                    <option value="">{t("createDialog.useActiveVersion")}</option>
                    {versionOptions.map((version) => (
                      <option key={version.id} value={version.id}>
                        v{version.versionNumber} {version.isActive ? t("createDialog.currentVersionSuffix") : ""}
                      </option>
                    ))}
                  </SelectControl>
                </div>
              </div>
                <BookAnalysisSourceRangePicker
                  selectedRange={selectedSourceRange}
                  sourceChapters={sourceChapters}
                  sourceCharCount={sourceCharCount}
                  sourceSelected={Boolean(selectedDocumentId)}
                  chaptersRequested={sourceChaptersRequested}
                  chaptersLoading={sourceChaptersLoading}
                  chaptersError={sourceChaptersError}
                  onRangeChange={onSourceRangeChange}
                  onRequestChapters={onRequestSourceChapters}
                />
              </>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("createDialog.modelLabel")}</div>
              <LLMSelector
                value={llmConfig}
                onChange={(next) =>
                  onLlmConfigChange({
                    provider: next.provider,
                    model: next.model,
                    temperature: next.temperature ?? llmConfig.temperature,
                    maxTokens: next.maxTokens ?? llmConfig.maxTokens,
                  })
                }
                showParameters
              />
              <div className="grid gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                <div>
                  <div className="text-sm font-medium">{t("createDialog.budgetLabel")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("createDialog.budgetHint")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1000}
                    max={10000000}
                    step={1000}
                    placeholder={DEFAULT_BOOK_ANALYSIS_BUDGET_TOKENS.toLocaleString("zh-CN")}
                    value={budgetTokens ?? ""}
                    onChange={(event) => {
                      if (!event.target.value) {
                        onBudgetTokensChange(null);
                        return;
                      }
                      const next = Number(event.target.value);
                      onBudgetTokensChange(Number.isFinite(next) ? Math.max(1000, Math.min(10000000, Math.floor(next))) : null);
                    }}
                    className="text-right font-mono tabular-nums"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">tokens</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("createDialog.dimensionsLabel")}</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {BOOK_ANALYSIS_PRESETS.map((preset) => {
                  const selected = preset.key === analysisPreset;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      className={`rounded-md border p-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                      }`}
                      onClick={() => onAnalysisPresetChange(preset.key)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{preset.title}</div>
                        <div className="text-xs text-muted-foreground">{t("createDialog.itemCount", { count: preset.sectionKeys.length })}</div>
                      </div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{preset.summary}</div>
                      <div className="mt-2 text-xs leading-5 text-muted-foreground">
                        {t("createDialog.presetIncludes", { titles: getPresetSectionTitles(preset.sectionKeys, t("common.enumerationSeparator")) })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("createDialog.focusLabel")}</div>
              <textarea
                className="min-h-[92px] w-full rounded-md border bg-background p-3 text-sm"
                value={userFocusInstruction}
                onChange={(event) => onUserFocusInstructionChange(event.target.value)}
                placeholder={isDiagnosisMode
                  ? t("createDialog.focusPlaceholderDiagnosis")
                  : t("createDialog.focusPlaceholderReference")}
              />
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              {isDiagnosisMode
                ? t("createDialog.costNoticeDiagnosis")
                : t("createDialog.costNoticeReference")}
            </div>

            {!isDiagnosisMode && selectedSourceVersion ? (
              <div className="rounded-md border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                <div className="font-medium text-foreground">{t("createDialog.scaleTitle", { label: t(scale.labelKey) })}</div>
                <div className="mt-1">
                  {t("createDialog.scaleDetail", {
                    chars: formatCount(effectiveSourceCharCount),
                    segments: estimatedSegmentCount,
                    calls: estimatedLlmCalls,
                  })}
                </div>
                <div className="mt-1">{t(scale.toneKey)}</div>
              </div>
            ) : null}

            {!isDiagnosisMode && sourceDocument ? (
              <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                {t("createDialog.docMeta", { versions: sourceDocument.versions.length, analyses: sourceDocument.bookAnalysisCount })}
              </div>
            ) : null}
          </aside>
        </div>
      </AppDialogContent>
    </Dialog>
  );
}

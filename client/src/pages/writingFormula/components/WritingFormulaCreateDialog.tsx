import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BookAnalysis } from "@ai-novel/shared/types/bookAnalysis";
import type { KnowledgeDocumentDetail, KnowledgeDocumentSummary } from "@ai-novel/shared/types/knowledge";
import type { StyleExtractionSourceProcessingMode, StyleTemplate } from "@ai-novel/shared/types/styleEngine";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import i18n from "@/i18n";
import type {
  WritingFormulaCreateFormState,
  WritingFormulaMaterialSource,
} from "../useWritingFormulaCreateFlow";

// Option `label`/`summary`/`badge` hold flat i18n key strings resolved via
// `t(...)` at render time; the `key` fields stay as logic identifiers.
const EXTRACTION_PRESET_OPTIONS = [
  {
    key: "imitate",
    label: "create.preset.imitate.label",
    summary: "create.preset.imitate.summary",
  },
  {
    key: "balanced",
    label: "create.preset.balanced.label",
    summary: "create.preset.balanced.summary",
  },
  {
    key: "transfer",
    label: "create.preset.transfer.label",
    summary: "create.preset.transfer.summary",
  },
] as const;

const MATERIAL_SOURCE_OPTIONS: Array<{
  key: WritingFormulaMaterialSource;
  label: string;
  summary: string;
}> = [
  {
    key: "direct_text",
    label: "create.material.direct_text.label",
    summary: "create.material.direct_text.summary",
  },
  {
    key: "knowledge_document",
    label: "create.material.knowledge_document.label",
    summary: "create.material.knowledge_document.summary",
  },
  {
    key: "book_analysis",
    label: "create.material.book_analysis.label",
    summary: "create.material.book_analysis.summary",
  },
];

const KNOWLEDGE_SOURCE_PROCESSING_OPTIONS: Array<{
  key: StyleExtractionSourceProcessingMode;
  label: string;
  summary: string;
  badge?: string;
}> = [
  {
    key: "representative_sample",
    label: "create.knowledgeMode.representative_sample.label",
    summary: "create.knowledgeMode.representative_sample.summary",
    badge: "create.knowledgeMode.recommendBadge",
  },
  {
    key: "full_text",
    label: "create.knowledgeMode.full_text.label",
    summary: "create.knowledgeMode.full_text.summary",
  },
];

function formatTaskStatus(task: UnifiedTaskDetail | null): string {
  if (!task) {
    return i18n.t("create.taskStatus.none", { ns: "writingFormula" });
  }
  if (task.status === "queued") {
    return i18n.t("create.taskStatus.queued", { ns: "writingFormula" });
  }
  if (task.status === "running") {
    return i18n.t("create.taskStatus.running", { ns: "writingFormula" });
  }
  if (task.status === "succeeded") {
    return i18n.t("create.taskStatus.succeeded", { ns: "writingFormula" });
  }
  if (task.status === "failed") {
    return i18n.t("create.taskStatus.failed", { ns: "writingFormula" });
  }
  if (task.status === "cancelled") {
    return i18n.t("create.taskStatus.cancelled", { ns: "writingFormula" });
  }
  return i18n.t("create.taskStatus.waitingApproval", { ns: "writingFormula" });
}

function formatCharCount(value: number | null | undefined): string {
  if (!value) {
    return i18n.t("create.charCount.zero", { ns: "writingFormula" });
  }
  return i18n.t("create.charCount.value", { ns: "writingFormula", count: value.toLocaleString("zh-CN") });
}

function formatKnowledgeStatus(status: KnowledgeDocumentSummary["status"]): string {
  if (status === "enabled") {
    return i18n.t("create.knowledgeStatus.enabled", { ns: "writingFormula" });
  }
  if (status === "disabled") {
    return i18n.t("create.knowledgeStatus.disabled", { ns: "writingFormula" });
  }
  return i18n.t("create.knowledgeStatus.archived", { ns: "writingFormula" });
}

interface WritingFormulaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WritingFormulaCreateFormState;
  onFormChange: (patch: Partial<WritingFormulaCreateFormState>) => void;
  templates: StyleTemplate[];
  createManualPending: boolean;
  createFromBriefPending: boolean;
  createFromTemplatePending: boolean;
  extractTaskSubmitting: boolean;
  activeExtractionTask: UnifiedTaskDetail | null;
  knowledgeDocuments: KnowledgeDocumentSummary[];
  knowledgeDocumentsLoading: boolean;
  selectedKnowledgeDocument: KnowledgeDocumentDetail | null;
  selectedKnowledgeDocumentLoading: boolean;
  bookAnalyses: BookAnalysis[];
  bookAnalysesLoading: boolean;
  selectedPresetKey: "imitate" | "balanced" | "transfer";
  onCreateManual: () => void;
  onCreateFromBrief: () => void;
  onCreateFromTemplate: (templateId: string) => void;
  onPresetChange: (value: "imitate" | "balanced" | "transfer") => void;
  onSubmitExtractionTask: () => void;
  onOpenTaskCenter?: (task: UnifiedTaskDetail) => void;
}

export default function WritingFormulaCreateDialog(props: WritingFormulaCreateDialogProps) {
  const { t } = useTranslation("writingFormula");
  const {
    open,
    onOpenChange,
    form,
    onFormChange,
    templates,
    createManualPending,
    createFromBriefPending,
    createFromTemplatePending,
    extractTaskSubmitting,
    activeExtractionTask,
    knowledgeDocuments,
    knowledgeDocumentsLoading,
    selectedKnowledgeDocument,
    selectedKnowledgeDocumentLoading,
    bookAnalyses,
    bookAnalysesLoading,
    selectedPresetKey,
    onCreateManual,
    onCreateFromBrief,
    onCreateFromTemplate,
    onPresetChange,
    onSubmitExtractionTask,
    onOpenTaskCenter,
  } = props;
  const [activeTab, setActiveTab] = useState<"quick_start" | "blank" | "extract">("quick_start");

  useEffect(() => {
    if (open && activeExtractionTask) {
      setActiveTab("extract");
    }
  }, [activeExtractionTask, open]);

  const extractionTaskIsActive = activeExtractionTask?.status === "queued" || activeExtractionTask?.status === "running";
  const selectedPreset = EXTRACTION_PRESET_OPTIONS.find((item) => item.key === selectedPresetKey) ?? EXTRACTION_PRESET_OPTIONS[1];
  const activeKnowledgeVersion = selectedKnowledgeDocument?.versions.find((version) => version.isActive) ?? null;
  const selectedBookAnalysis = bookAnalyses.find((analysis) => analysis.id === form.bookAnalysisId) ?? null;
  const knowledgeDocumentReady = Boolean(
    selectedKnowledgeDocument
      && selectedKnowledgeDocument.status !== "archived"
      && activeKnowledgeVersion
      && activeKnowledgeVersion.content.trim(),
  );
  const bookAnalysisReady = Boolean(form.bookAnalysisId);
  const materialSubmitDisabled = extractTaskSubmitting
    || (form.materialSource !== "book_analysis" && extractionTaskIsActive)
    || !form.extractName.trim()
    || (form.materialSource === "direct_text" && !form.extractSourceText.trim())
    || (form.materialSource === "knowledge_document" && !knowledgeDocumentReady)
    || (form.materialSource === "book_analysis" && !bookAnalysisReady);
  const materialSubmitLabel = form.materialSource === "book_analysis"
    ? t("create.submitLabel.bookAnalysis")
    : form.materialSource === "knowledge_document"
      ? t("create.submitLabel.knowledge")
      : t("create.submitLabel.text");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("create.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("create.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="flex min-h-0 flex-1 flex-col space-y-4">
          <TabsList className="grid w-full shrink-0 grid-cols-3">
            <TabsTrigger value="quick_start">{t("create.tab.quickStart")}</TabsTrigger>
            <TabsTrigger value="blank">{t("create.tab.blank")}</TabsTrigger>
            <TabsTrigger value="extract">{t("create.tab.extract")}</TabsTrigger>
          </TabsList>

          <TabsContent value="quick_start" className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              {t("create.quickStartHint")}
            </div>
            <div className="grid gap-3 pr-1 md:grid-cols-2">
              {templates.map((template) => (
                <div key={template.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-foreground">{template.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{template.category}</div>
                    </div>
                    <Badge variant="outline">{t("common.templateBadge")}</Badge>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-muted-foreground">{template.description}</div>
                  {template.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.tags.slice(0, 4).map((tag) => (
                        <Badge key={`${template.id}-${tag}`} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  ) : null}
                  {template.applicableGenres.length > 0 ? (
                    <div className="mt-3 text-xs text-muted-foreground">
                      {t("common.suitableFor", { genres: template.applicableGenres.join(" / ") })}
                    </div>
                  ) : null}
                  <Button
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => onCreateFromTemplate(template.id)}
                    disabled={createFromTemplatePending}
                  >
                    {createFromTemplatePending ? t("common.creating") : t("create.createFromTemplate")}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="blank" className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              {t("create.blankHint")}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-3">
                  <div className="text-sm font-medium text-foreground">{t("create.manualTitle")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("create.manualDesc")}
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    className="w-full rounded-md border p-2 text-sm"
                    placeholder={t("create.manualNamePlaceholder")}
                    value={form.manualName}
                    onChange={(event) => onFormChange({ manualName: event.target.value })}
                  />
                  <Button
                    className="w-full"
                    onClick={onCreateManual}
                    disabled={!form.manualName.trim() || createManualPending}
                  >
                    {createManualPending ? t("common.creating") : t("create.createBlank")}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3">
                  <div className="text-sm font-medium text-foreground">{t("create.aiTitle")}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("create.aiDesc")}
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    className="w-full rounded-md border p-2 text-sm"
                    placeholder={t("create.nameOptionalPlaceholder")}
                    value={form.briefName}
                    onChange={(event) => onFormChange({ briefName: event.target.value })}
                  />
                  <input
                    className="w-full rounded-md border p-2 text-sm"
                    placeholder={t("common.categoryOptional")}
                    value={form.briefCategory}
                    onChange={(event) => onFormChange({ briefCategory: event.target.value })}
                  />
                  <textarea
                    className="min-h-[180px] w-full rounded-md border p-2 text-sm"
                    placeholder={t("create.briefPlaceholder")}
                    value={form.briefPrompt}
                    onChange={(event) => onFormChange({ briefPrompt: event.target.value })}
                  />
                  <Button
                    className="w-full"
                    onClick={onCreateFromBrief}
                    disabled={!form.briefPrompt.trim() || createFromBriefPending}
                  >
                    {createFromBriefPending ? t("create.aiGenerating") : t("create.aiGenerate")}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="extract" className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              {t("create.extractHint")}
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
              <div className="space-y-4 rounded-lg border p-4">
                <div className={form.materialSource === "book_analysis" ? "grid gap-3" : "grid gap-3 md:grid-cols-2"}>
                  <input
                    className="rounded-md border p-2 text-sm"
                    placeholder={t("create.namePlaceholder")}
                    value={form.extractName}
                    onChange={(event) => onFormChange({ extractName: event.target.value })}
                  />
                  {form.materialSource !== "book_analysis" ? (
                    <input
                      className="rounded-md border p-2 text-sm"
                      placeholder={t("common.categoryOptional")}
                      value={form.extractCategory}
                      onChange={(event) => onFormChange({ extractCategory: event.target.value })}
                    />
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {MATERIAL_SOURCE_OPTIONS.map((option) => {
                    const active = option.key === form.materialSource;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        className={`rounded-2xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-slate-950 bg-slate-950 text-white shadow"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                        onClick={() => onFormChange({ materialSource: option.key })}
                      >
                        <div className="text-sm font-semibold">{t(option.label)}</div>
                        <div className={`mt-1 text-xs leading-5 ${active ? "text-slate-200" : "text-slate-500"}`}>
                          {t(option.summary)}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {form.materialSource === "direct_text" ? (
                  <textarea
                    className="min-h-[260px] w-full rounded-md border p-2 text-sm"
                    placeholder={t("create.directTextPlaceholder")}
                    value={form.extractSourceText}
                    onChange={(event) => onFormChange({ extractSourceText: event.target.value })}
                  />
                ) : null}

                {form.materialSource === "knowledge_document" ? (
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-md border p-2 text-sm"
                      placeholder={t("create.knowledgeSearchPlaceholder")}
                      value={form.knowledgeSearchKeyword}
                      onChange={(event) => onFormChange({ knowledgeSearchKeyword: event.target.value })}
                    />
                    <div className="grid max-h-[220px] gap-2 overflow-y-auto pr-1">
                      {knowledgeDocumentsLoading && knowledgeDocuments.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                          {t("create.knowledgeSearching")}
                        </div>
                      ) : null}
                      {!knowledgeDocumentsLoading && knowledgeDocuments.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                          {t("create.knowledgeEmpty")}
                        </div>
                      ) : null}
                      {knowledgeDocuments.map((document) => {
                        const selected = document.id === form.knowledgeDocumentId;
                        return (
                          <button
                            key={document.id}
                            type="button"
                            className={`rounded-xl border px-3 py-3 text-left transition ${
                              selected ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-400"
                            }`}
                            disabled={document.status === "archived"}
                            onClick={() => onFormChange({
                              knowledgeDocumentId: document.id,
                              knowledgeDocumentTitle: document.title,
                              extractName: form.extractName.trim() ? form.extractName : t("create.docNameSuffix", { title: document.title }),
                            })}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-slate-950">{document.title}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">{document.fileName}</div>
                              </div>
                              <Badge variant={selected ? "default" : "outline"}>
                                {selected ? t("create.selected") : formatKnowledgeStatus(document.status)}
                              </Badge>
                            </div>
                            <div className="mt-2 text-xs leading-5 text-slate-500">
                              {t("create.docMeta", { version: document.activeVersionNumber, versionCount: document.versionCount, analysisCount: document.bookAnalysisCount })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-2 rounded-xl border bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium text-slate-950">{t("create.sourceProcessingTitle")}</div>
                        {activeKnowledgeVersion ? (
                          <div className="text-xs text-slate-500">
                            {t("create.sourceSnapshot", { size: formatCharCount(activeKnowledgeVersion.charCount) })}
                          </div>
                        ) : null}
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {KNOWLEDGE_SOURCE_PROCESSING_OPTIONS.map((option) => {
                          const active = option.key === form.knowledgeSourceProcessingMode;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              className={`rounded-xl border px-3 py-3 text-left transition ${
                                active
                                  ? "border-slate-950 bg-slate-950 text-white"
                                  : "border-slate-200 bg-white hover:border-slate-400"
                              }`}
                              onClick={() => onFormChange({ knowledgeSourceProcessingMode: option.key })}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold">{t(option.label)}</div>
                                {option.badge ? (
                                  <Badge variant={active ? "secondary" : "outline"}>{t(option.badge)}</Badge>
                                ) : null}
                              </div>
                              <div className={`mt-1 text-xs leading-5 ${active ? "text-slate-200" : "text-slate-500"}`}>
                                {t(option.summary)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {form.knowledgeSourceProcessingMode === "representative_sample" ? (
                        <div className="text-xs leading-5 text-slate-500">
                          {t("create.representativeNote")}
                        </div>
                      ) : (
                        <div className="text-xs leading-5 text-amber-700">
                          {t("create.fullTextNote")}
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border bg-slate-50/80 p-3 text-sm leading-6 text-slate-700">
                      {selectedKnowledgeDocumentLoading ? (
                        t("create.loadingDoc")
                      ) : selectedKnowledgeDocument ? (
                        <>
                          <div className="font-medium text-slate-950">{selectedKnowledgeDocument.title}</div>
                          {activeKnowledgeVersion ? (
                            <div className="mt-1 text-xs text-slate-500">
                              {t("create.activeVersionMeta", { version: activeKnowledgeVersion.versionNumber, size: formatCharCount(activeKnowledgeVersion.charCount) })}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-amber-700">{t("create.noActiveVersion")}</div>
                          )}
                          {activeKnowledgeVersion && !activeKnowledgeVersion.content.trim() ? (
                            <div className="mt-1 text-xs text-amber-700">{t("create.emptyActiveVersion")}</div>
                          ) : null}
                        </>
                      ) : (
                        t("create.knowledgePrompt")
                      )}
                    </div>
                  </div>
                ) : null}

                {form.materialSource === "book_analysis" ? (
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-md border p-2 text-sm"
                      placeholder={t("create.bookAnalysisSearchPlaceholder")}
                      value={form.bookAnalysisSearchKeyword}
                      onChange={(event) => onFormChange({ bookAnalysisSearchKeyword: event.target.value })}
                    />
                    <div className="grid max-h-[290px] gap-2 overflow-y-auto pr-1">
                      {bookAnalysesLoading && bookAnalyses.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                          {t("create.bookAnalysisSearching")}
                        </div>
                      ) : null}
                      {!bookAnalysesLoading && bookAnalyses.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                          {t("create.bookAnalysisEmpty")}
                        </div>
                      ) : null}
                      {bookAnalyses.map((analysis) => {
                        const selected = analysis.id === form.bookAnalysisId;
                        return (
                          <button
                            key={analysis.id}
                            type="button"
                            className={`rounded-xl border px-3 py-3 text-left transition ${
                              selected ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-400"
                            }`}
                            onClick={() => onFormChange({
                              bookAnalysisId: analysis.id,
                              bookAnalysisTitle: analysis.title,
                              extractName: form.extractName.trim() ? form.extractName : t("create.docNameSuffix", { title: analysis.title }),
                            })}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-slate-950">{analysis.title}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">{analysis.documentTitle}</div>
                              </div>
                              <Badge variant={selected ? "default" : "outline"}>
                                {selected ? t("create.selected") : t("create.canGenerate")}
                              </Badge>
                            </div>
                            <div className="mt-2 text-xs leading-5 text-slate-500">
                              {t("create.analysisMeta", { version: analysis.documentVersionNumber, summary: analysis.summary || t("create.analysisSummaryFallback") })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="sticky bottom-0 -mx-4 border-t bg-white/95 px-4 py-3 backdrop-blur">
                  <Button
                    className="w-full"
                    onClick={onSubmitExtractionTask}
                    disabled={materialSubmitDisabled}
                  >
                    {extractTaskSubmitting
                      ? form.materialSource === "book_analysis" ? t("create.generating") : t("create.submittingTask")
                      : extractionTaskIsActive && form.materialSource !== "book_analysis"
                        ? t("create.backgroundTaskRunning")
                        : materialSubmitLabel}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                {form.materialSource === "book_analysis" ? (
                  <>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t("create.bookAnalysisGenTitle")}</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("create.bookAnalysisGenDesc")}
                      </div>
                    </div>
                    <div className="rounded-xl border bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
                      {selectedBookAnalysis ? (
                        <>
                          <div className="font-medium text-slate-950">{selectedBookAnalysis.title}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {t("create.sourceDoc", { title: selectedBookAnalysis.documentTitle, version: selectedBookAnalysis.documentVersionNumber })}
                          </div>
                          {selectedBookAnalysis.summary ? (
                            <div className="mt-3 text-xs leading-6 text-slate-600">{selectedBookAnalysis.summary}</div>
                          ) : null}
                        </>
                      ) : (
                        t("create.bookAnalysisPrompt")
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t("create.retentionTitle")}</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("create.retentionDesc")}
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {EXTRACTION_PRESET_OPTIONS.map((preset) => {
                        const active = preset.key === selectedPresetKey;
                        return (
                          <button
                            key={preset.key}
                            type="button"
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              active
                                ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                                : "border-slate-200 bg-white hover:border-slate-400"
                            }`}
                            onClick={() => onPresetChange(preset.key)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-base font-semibold">{t(preset.label)}</div>
                              {active ? <Badge variant="secondary" className="bg-white/10 text-white">{t("common.currentPlan")}</Badge> : null}
                            </div>
                            <div className={`mt-2 text-sm leading-6 ${active ? "text-slate-200" : "text-slate-600"}`}>
                              {t(preset.summary)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="rounded-xl border bg-amber-50/80 p-3 text-xs leading-6 text-amber-900">
                      {t("create.presetNote", { label: t(selectedPreset.label) })}
                    </div>
                    {activeExtractionTask ? (
                      <div className="rounded-xl border bg-slate-50/80 p-4 text-sm text-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-slate-900">{t("create.backgroundTask")}</div>
                          <Badge variant={extractionTaskIsActive ? "secondary" : "outline"}>
                            {formatTaskStatus(activeExtractionTask)}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                          <div>{t("create.taskTitle", { title: activeExtractionTask.title })}</div>
                          <div>{t("create.taskStage", { stage: activeExtractionTask.currentStage ?? t("create.waitingSchedule") })}</div>
                          <div>{t("create.taskProgress", { percent: Math.round(activeExtractionTask.progress * 100) })}</div>
                          {activeExtractionTask.failureSummary ? (
                            <div className="text-rose-600">{t("create.failureReason", { reason: activeExtractionTask.failureSummary })}</div>
                          ) : null}
                        </div>
                        {onOpenTaskCenter ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-4 w-full"
                            onClick={() => onOpenTaskCenter(activeExtractionTask)}
                          >
                            {t("create.gotoTaskCenter")}
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
                        {t("create.submitNote")}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import type { BookAnalysisSectionKey } from "@ai-novel/shared/types/bookAnalysis";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  BASIC_INFO_FIELD_HINTS,
  type NovelBasicFormState,
} from "../../novelBasicInfo.shared";
import {
  FieldLabel,
  HelpHint,
  SectionBlock,
  SelectionCard,
} from "./BasicInfoFormPrimitives";
import SelectControl from "@/components/common/SelectControl";

interface ContinuationSourceSectionProps {
  basicForm: NovelBasicFormState;
  sourceNovelOptions: Array<{ id: string; title: string }>;
  sourceKnowledgeOptions: Array<{ id: string; title: string }>;
  sourceNovelBookAnalysisOptions: Array<{
    id: string;
    title: string;
    documentTitle: string;
    documentVersionNumber: number;
  }>;
  isLoadingSourceNovelBookAnalyses: boolean;
  availableBookAnalysisSections: Array<{ key: BookAnalysisSectionKey; title: string }>;
  hasSelectedContinuationSource: boolean;
  onFormChange: (patch: Partial<NovelBasicFormState>) => void;
}

export function ContinuationSourceSection(props: ContinuationSourceSectionProps) {
  const {
    basicForm,
    sourceNovelOptions,
    sourceKnowledgeOptions,
    sourceNovelBookAnalysisOptions,
    isLoadingSourceNovelBookAnalyses,
    availableBookAnalysisSections,
    hasSelectedContinuationSource,
    onFormChange,
  } = props;
  const { t } = useTranslation("novelsSetup");

  return (
    <SectionBlock
      title={t("continuationSource.title")}
      description={t("continuationSource.description")}
      surface="none"
    >
      <div className="space-y-2">
        <FieldLabel hint={BASIC_INFO_FIELD_HINTS.continuationSourceType}>{t("continuationSource.sourceTypeLabel")}</FieldLabel>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectionCard
            option={{
              value: "novel",
              label: t("continuationSource.novelOption.label"),
              summary: t("continuationSource.novelOption.summary"),
            }}
            selected={basicForm.continuationSourceType === "novel"}
            onSelect={(value) => onFormChange({ continuationSourceType: value })}
          />
          <SelectionCard
            option={{
              value: "knowledge_document",
              label: t("continuationSource.knowledgeOption.label"),
              summary: t("continuationSource.knowledgeOption.summary"),
            }}
            selected={basicForm.continuationSourceType === "knowledge_document"}
            onSelect={(value) => onFormChange({ continuationSourceType: value })}
          />
        </div>
      </div>

      {basicForm.continuationSourceType === "novel" ? (
        <div className="space-y-2">
          <FieldLabel htmlFor="basic-source-novel">{t("continuationSource.sourceNovelLabel")}</FieldLabel>
          <SelectControl
            id="basic-source-novel"
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={basicForm.sourceNovelId}
            onChange={(event) => onFormChange({ sourceNovelId: event.target.value })}
          >
            <option value="">{t("continuationSource.selectSourceNovel")}</option>
            {sourceNovelOptions.map((novel) => (
              <option key={novel.id} value={novel.id}>{novel.title}</option>
            ))}
          </SelectControl>
        </div>
      ) : (
        <div className="space-y-2">
          <FieldLabel htmlFor="basic-source-knowledge">{t("continuationSource.sourceKnowledgeLabel")}</FieldLabel>
          <SelectControl
            id="basic-source-knowledge"
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={basicForm.sourceKnowledgeDocumentId}
            onChange={(event) => onFormChange({ sourceKnowledgeDocumentId: event.target.value })}
          >
            <option value="">{t("continuationSource.selectSourceKnowledge")}</option>
            {sourceKnowledgeOptions.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.title}</option>
            ))}
          </SelectControl>
        </div>
      )}

      {hasSelectedContinuationSource ? (
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {t("continuationSource.bookAnalysisRefTitle")}
              <HelpHint text={BASIC_INFO_FIELD_HINTS.continuationBookAnalysis} />
            </div>
            <div className="text-xs text-muted-foreground">{t("continuationSource.bookAnalysisRefDescription")}</div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="basic-book-analysis">{t("continuationSource.bookAnalysisLabel")}</FieldLabel>
            <SelectControl
              id="basic-book-analysis"
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={basicForm.continuationBookAnalysisId}
              onChange={(event) => {
                const nextAnalysisId = event.target.value;
                onFormChange({
                  continuationBookAnalysisId: nextAnalysisId,
                  continuationBookAnalysisSections: nextAnalysisId
                    ? (
                      basicForm.continuationBookAnalysisSections.length > 0
                        ? basicForm.continuationBookAnalysisSections
                        : availableBookAnalysisSections.map((item) => item.key)
                    )
                    : [],
                });
              }}
            >
              <option value="">{t("continuationSource.noBookAnalysis")}</option>
              {sourceNovelBookAnalysisOptions.map((analysis) => (
                <option key={analysis.id} value={analysis.id}>
                  {analysis.title} | {analysis.documentTitle} v{analysis.documentVersionNumber}
                </option>
              ))}
            </SelectControl>
          </div>

          {isLoadingSourceNovelBookAnalyses ? (
            <div className="text-xs text-muted-foreground">{t("continuationSource.loadingAnalyses")}</div>
          ) : null}
          {!isLoadingSourceNovelBookAnalyses && sourceNovelBookAnalysisOptions.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              {t("continuationSource.noAnalysesAvailable")}
            </div>
          ) : null}

          {basicForm.continuationBookAnalysisId ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{t("continuationSource.selectSections")}</span>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => onFormChange({
                    continuationBookAnalysisSections: availableBookAnalysisSections.map((item) => item.key),
                  })}
                >
                  {t("continuationSource.selectAll")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => onFormChange({ continuationBookAnalysisSections: [] })}
                >
                  {t("continuationSource.clearAll")}
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableBookAnalysisSections.map((section) => (
                  <label key={section.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={basicForm.continuationBookAnalysisSections.includes(section.key)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        const next = checked
                          ? [...basicForm.continuationBookAnalysisSections, section.key]
                          : basicForm.continuationBookAnalysisSections.filter((item) => item !== section.key);
                        onFormChange({
                          continuationBookAnalysisSections: Array.from(new Set(next)),
                        });
                      }}
                    />
                    <span>{section.title}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </SectionBlock>
  );
}

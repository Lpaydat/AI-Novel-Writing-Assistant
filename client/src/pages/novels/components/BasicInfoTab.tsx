import { useTranslation } from "react-i18next";
import type { BasicTabProps } from "./NovelEditView.types";
import NovelBasicInfoForm from "./NovelBasicInfoForm";
import NovelStyleRecommendationCard from "./NovelStyleRecommendationCard";
import NovelWorldManagerCard from "./NovelWorldManagerCard";
import { BookFramingQuickFillButton } from "./basicInfoForm/BookFramingQuickFillButton";
import NovelCreateTitleQuickFill from "./titleWorkshop/NovelCreateTitleQuickFill";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";
import { NovelCoverCard } from "./cover/NovelCoverCard";
import { DetailDisclosure, SectionBlock } from "./workspaceShell";

export default function BasicInfoTab(props: BasicTabProps) {
  const { t } = useTranslation("novelsEditA");
  return (
    <div className="space-y-5">
      <DirectorTakeoverEntryPanel
        title={t("basicInfo.directorTakeover.title")}
        description={t("basicInfo.directorTakeover.description")}
        entry={props.directorTakeoverEntry}
      />
      <NovelWorldManagerCard
        view={props.novelWorldView}
        syncDiff={props.novelWorldSyncDiff}
        worldOptions={props.worldOptions}
        selectedWorldId={props.basicForm.worldId}
        isLoading={props.isLoadingNovelWorld}
        isImporting={props.isImportingNovelWorld}
        isGenerating={props.isGeneratingNovelWorld}
        isCreatingManual={props.isCreatingManualNovelWorld}
        isSavingToLibrary={props.isSavingNovelWorldToLibrary}
        isLoadingSyncDiff={props.isLoadingNovelWorldSyncDiff}
        isSyncing={props.isSyncingNovelWorld}
        usageView={props.worldSliceView}
        usageMessage={props.worldSliceMessage}
        isRefreshingWorldSlice={props.isRefreshingWorldSlice}
        isSavingWorldSliceOverrides={props.isSavingWorldSliceOverrides}
        onImport={props.onImportNovelWorld}
        onCreateManual={props.onCreateManualNovelWorld}
        onGenerate={props.onGenerateNovelWorld}
        onSaveToLibrary={props.onSaveNovelWorldToLibrary}
        onSync={props.onSyncNovelWorld}
        onRefreshWorldSlice={props.onRefreshWorldSlice}
        onSaveWorldSliceOverrides={props.onSaveWorldSliceOverrides}
      />
      <SectionBlock
        title={t("basicInfo.section.title")}
        description={t("basicInfo.section.description")}
      >
        <NovelBasicInfoForm
          basicForm={props.basicForm}
          genreOptions={props.genreOptions}
          storyModeOptions={props.storyModeOptions}
          worldOptions={props.worldOptions}
          sourceNovelOptions={props.sourceNovelOptions}
          sourceKnowledgeOptions={props.sourceKnowledgeOptions}
          sourceNovelBookAnalysisOptions={props.sourceNovelBookAnalysisOptions}
          isLoadingSourceNovelBookAnalyses={props.isLoadingSourceNovelBookAnalyses}
          availableBookAnalysisSections={props.availableBookAnalysisSections}
          onFormChange={props.onFormChange}
          onSubmit={props.onSave}
          isSubmitting={props.isSaving}
          submitLabel={t("basicInfo.submitLabel")}
          titleQuickFill={(
            <NovelCreateTitleQuickFill
              basicForm={props.basicForm}
              onApplyTitle={(title) => props.onFormChange({ title })}
            />
          )}
          framingQuickFill={(
            <BookFramingQuickFillButton
              basicForm={props.basicForm}
              genreOptions={props.genreOptions}
              onApplySuggestion={props.onFormChange}
            />
          )}
          coverSection={(
            <NovelCoverCard
              novelId={props.novelId}
              basicForm={props.basicForm}
              genreOptions={props.genreOptions}
              storyModeOptions={props.storyModeOptions}
              worldOptions={props.worldOptions}
              worldSliceView={props.worldSliceView}
            />
          )}
          projectQuickStart={props.projectQuickStart}
        />
      </SectionBlock>

      <DetailDisclosure
        title={t("basicInfo.writingTips.title")}
        description={t("basicInfo.writingTips.description")}
        meta={t("basicInfo.writingTips.meta")}
      >
        <NovelStyleRecommendationCard novelId={props.novelId} />
      </DetailDisclosure>
    </div>
  );
}

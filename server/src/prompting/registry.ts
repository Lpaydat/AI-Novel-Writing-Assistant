import type { PromptAsset, PromptLanguage } from "./core/promptTypes";
import { buildPromptAssetKey } from "./core/promptTypes";

type UnknownPromptAsset = PromptAsset<unknown, unknown, unknown>;
type PromptAssetLoader = () => UnknownPromptAsset;

interface PromptAssetLoaderEntry {
  key: string;
  load: PromptAssetLoader;
}

function createPromptAssetLoaderRegistry(entries: PromptAssetLoaderEntry[]): Map<string, PromptAssetLoader> {
  const registry = new Map<string, PromptAssetLoader>();
  for (const entry of entries) {
    if (registry.has(entry.key)) {
      throw new Error(`Duplicate prompt asset registration: ${entry.key}`);
    }
    registry.set(entry.key, entry.load);
  }
  return registry;
}

const promptAssetLoaderEntries: PromptAssetLoaderEntry[] = [
  {
    key: "planner.intent.parse@v1",
    load: () => require("./prompts/agent/plannerIntent.prompt").plannerIntentPrompt as UnknownPromptAsset,
  },
  {
    key: "planner.intent.parse@v1@en",
    load: () => require("./prompts/agent/plannerIntent.prompt.en").plannerIntentPromptEn as UnknownPromptAsset,
  },
  {
    key: "agent.runtime.fallback_answer@v1",
    load: () => require("./prompts/agent/runtime.prompts").runtimeFallbackAnswerPrompt as UnknownPromptAsset,
  },
  {
    key: "agent.runtime.fallback_answer@v1@en",
    load: () => require("./prompts/agent/runtime.prompts.en").runtimeFallbackAnswerPromptEn as UnknownPromptAsset,
  },
  {
    key: "agent.runtime.setup_guidance@v1",
    load: () => require("./prompts/agent/runtime.prompts").runtimeSetupGuidancePrompt as UnknownPromptAsset,
  },
  {
    key: "agent.runtime.setup_guidance@v1@en",
    load: () => require("./prompts/agent/runtime.prompts.en").runtimeSetupGuidancePromptEn as UnknownPromptAsset,
  },
  {
    key: "agent.runtime.setup_ideation@v1",
    load: () => require("./prompts/agent/runtime.prompts").runtimeSetupIdeationPrompt as UnknownPromptAsset,
  },
  {
    key: "agent.runtime.setup_ideation@v1@en",
    load: () => require("./prompts/agent/runtime.prompts.en").runtimeSetupIdeationPromptEn as UnknownPromptAsset,
  },
  {
    key: "audit.chapter.full@v2",
    load: () => require("./prompts/audit/audit.prompts").auditChapterPrompt as UnknownPromptAsset,
  },
  {
    key: "audit.chapter.full@v2@en",
    load: () => require("./prompts/audit/audit.prompts.en").auditChapterFullPromptEn as UnknownPromptAsset,
  },
  {
    key: "audit.chapter.light@v1",
    load: () => require("./prompts/audit/audit.prompts").auditChapterLightPrompt as UnknownPromptAsset,
  },
  {
    key: "audit.chapter.light@v1@en",
    load: () => require("./prompts/audit/audit.prompts.en").auditChapterLightPromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.source.note@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysis.prompts").bookAnalysisSourceNotePrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.source.note@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysis.prompts.en").bookAnalysisSourceNotePromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.section.generate@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysis.prompts").bookAnalysisSectionPrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.section.generate@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysis.prompts.en").bookAnalysisSectionGeneratePromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.section.optimize@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysis.prompts").bookAnalysisOptimizedDraftPrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.section.optimize@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysis.prompts.en").bookAnalysisSectionOptimizePromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.chapter.split@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysisChapter.prompts").bookAnalysisChapterSplitPrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.identify@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts").bookAnalysisCharacterIdentifyPrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.profile@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts").bookAnalysisCharacterProfilePrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.generate@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts").bookAnalysisCharacterGeneratePrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.appearance.snapshot@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts").bookAnalysisCharacterAppearanceSnapshotPrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.appearance.consolidate@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts").bookAnalysisCharacterAppearanceConsolidatePrompt as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.appearance.merge@v1",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts").bookAnalysisCharacterAppearanceMergePrompt as UnknownPromptAsset,
  },
  {
    key: "character.base.skeleton@v1",
    load: () => require("./prompts/character/character.prompts").baseCharacterSkeletonPrompt as UnknownPromptAsset,
  },
  {
    key: "character.base.skeleton@v1@en",
    load: () => require("./prompts/character/character.prompts.en").characterBaseSkeletonPromptEn as UnknownPromptAsset,
  },
  {
    key: "character.base.final@v1",
    load: () => require("./prompts/character/character.prompts").baseCharacterFinalPrompt as UnknownPromptAsset,
  },
  {
    key: "character.base.final@v1@en",
    load: () => require("./prompts/character/character.prompts.en").characterBaseFinalPromptEn as UnknownPromptAsset,
  },
  {
    key: "character.sync.classify@v1",
    load: () => require("./prompts/character/characterSync.prompts").characterSyncClassificationPrompt as UnknownPromptAsset,
  },
  {
    key: "character.sync.classify@v1@en",
    load: () => require("./prompts/character/characterSync.prompts.en").characterSyncClassifyPromptEn as UnknownPromptAsset,
  },
  {
    key: "image.character.prompt_optimize@v1",
    load: () => require("./prompts/image/image.prompts").imageCharacterPromptOptimizePrompt as UnknownPromptAsset,
  },
  {
    key: "image.character.prompt_optimize@v1@en",
    load: () => require("./prompts/image/image.prompts.en").imageCharacterPromptOptimizePromptEn as UnknownPromptAsset,
  },
  {
    key: "image.generation_prompt.assist@v1",
    load: () => require("./prompts/image/image.prompts").imageGenerationPromptAssistPrompt as UnknownPromptAsset,
  },
  {
    key: "image.novel_cover.brief@v1",
    load: () => require("./prompts/image/image.prompts").imageNovelCoverBriefPrompt as UnknownPromptAsset,
  },
  {
    key: "image.novel_cover.brief@v1@en",
    load: () => require("./prompts/image/image.prompts.en").imageNovelCoverBriefPromptEn as UnknownPromptAsset,
  },
  {
    key: "image.novel_cover.prompt_optimize@v1",
    load: () => require("./prompts/image/image.prompts").imageNovelCoverPromptOptimizePrompt as UnknownPromptAsset,
  },
  {
    key: "image.novel_cover.prompt_optimize@v1@en",
    load: () => require("./prompts/image/image.prompts.en").imageNovelCoverPromptOptimizePromptEn as UnknownPromptAsset,
  },
  {
    key: "genre.tree.generate@v1",
    load: () => require("./prompts/genre/genre.prompts").genreTreePrompt as UnknownPromptAsset,
  },
  {
    key: "genre.tree.generate@v1@en",
    load: () => require("./prompts/genre/genre.prompts.en").genreTreePromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.source.original_bundle@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaOriginalSourcePrompt as UnknownPromptAsset,
  },
  {
    key: "drama.source.text_bundle@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaTextImportSourcePrompt as UnknownPromptAsset,
  },
  {
    key: "drama.track.recommendation@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaTrackRecommendationPrompt as UnknownPromptAsset,
  },
  {
    key: "drama.source.supplement@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaSourceSupplementPrompt as UnknownPromptAsset,
  },
  {
    key: "drama.strategy@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaStrategyPrompt as UnknownPromptAsset,
  },
  {
    key: "drama.episodeOutline@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaEpisodeOutlinePrompt as UnknownPromptAsset,
  },
  {
    key: "drama.episode.script@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaScriptPrompt as UnknownPromptAsset,
  },
  {
    key: "drama.episode.quality@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaQualityPrompt as UnknownPromptAsset,
  },
  {
    key: "drama.episode.compliance@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaCompliancePrompt as UnknownPromptAsset,
  },
  {
    key: "drama.episode.repair@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaRepairPrompt as UnknownPromptAsset,
  },
  {
    key: "drama.storyboard@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaStoryboardPrompt as UnknownPromptAsset,
  },
  {
    key: "drama.video.prompt@v1",
    load: () => require("./prompts/drama/drama.prompts").dramaVideoPromptPrompt as UnknownPromptAsset,
  },
  {
    key: "comic.episodeOutline@v1",
    load: () => require("./prompts/comic/comic.prompts").comicEpisodeOutlinePrompt as UnknownPromptAsset,
  },
  {
    key: "comic.panelScript@v1",
    load: () => require("./prompts/comic/comic.prompts").comicPanelScriptPrompt as UnknownPromptAsset,
  },
  {
    key: "planner.book.plan@v1",
    load: () => require("./prompts/planner/plannerPlan.prompts").plannerBookPlanPrompt as UnknownPromptAsset,
  },
  {
    key: "planner.arc.plan@v1",
    load: () => require("./prompts/planner/plannerPlan.prompts").plannerArcPlanPrompt as UnknownPromptAsset,
  },
  {
    key: "planner.chapter.plan@v1",
    load: () => require("./prompts/planner/plannerPlan.prompts").plannerChapterPlanPrompt as UnknownPromptAsset,
  },
  {
    key: "planner.replan.window_decision@v1",
    load: () => require("./prompts/planner/replanWindowDecision.prompts").replanWindowDecisionPrompt as UnknownPromptAsset,
  },
  {
    key: "rag.contextual_chunk.prefix@v1",
    load: () => require("./prompts/rag/contextualChunk.prompts").ragContextualChunkPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.candidates@v1",
    load: () => require("./prompts/novel/directorPlanning.prompts").directorCandidatePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.candidates@v1@en",
    load: () => require("./prompts/novel/directorPlanning.prompts.en").directorCandidatesPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.director.candidate_patch@v1",
    load: () => require("./prompts/novel/directorPlanning.prompts").directorCandidatePatchPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.candidate_patch@v1@en",
    load: () => require("./prompts/novel/directorPlanning.prompts.en").directorCandidatePatchPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.director.book_contract@v1",
    load: () => require("./prompts/novel/directorPlanning.prompts").directorBookContractPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.book_contract@v1@en",
    load: () => require("./prompts/novel/directorPlanning.prompts.en").directorBookContractPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.director.blueprint@v1",
    load: () => require("./prompts/novel/directorPlanning.prompts").directorBlueprintPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.blueprint@v1@en",
    load: () => require("./prompts/novel/directorPlanning.prompts.en").directorBlueprintPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.director.workspace_analysis@v1",
    load: () => require("./prompts/novel/directorWorkspaceAnalysis.prompts").directorWorkspaceAnalysisPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.workspace_analysis@v1@en",
    load: () => require("./prompts/novel/directorWorkspaceAnalysis.prompts.en").directorWorkspaceAnalysisPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.director.manual_edit_impact@v1",
    load: () => require("./prompts/novel/directorManualEditImpact.prompts").directorManualEditImpactPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.manual_edit_impact@v1@en",
    load: () => require("./prompts/novel/directorManualEditImpact.prompts.en").directorManualEditImpactPromptEn as UnknownPromptAsset,
  },
  {
    key: "director.state_proposal_resolution@v1",
    load: () => require("./prompts/novel/directorStateProposalResolution.prompts").directorStateProposalResolutionPrompt as UnknownPromptAsset,
  },
  {
    key: "director.state_proposal_resolution@v1@en",
    load: () => require("./prompts/novel/directorStateProposalResolution.prompts.en").directorStateProposalResolutionPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.story_macro.decomposition@v1",
    load: () => require("./prompts/novel/storyMacro.prompts").storyMacroDecompositionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.story_macro.field_regeneration@v1",
    load: () => require("./prompts/novel/storyMacro.prompts").storyMacroFieldRegenerationPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.outline.generate@v1",
    load: () => require("./prompts/novel/coreGeneration.prompts").novelOutlinePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.outline.generate@v1@en",
    load: () => require("./prompts/novel/coreGeneration.prompts.en").novelOutlinePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.structuredOutline.generate@v1",
    load: () => require("./prompts/novel/coreGeneration.prompts").novelStructuredOutlinePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.structuredOutline.repair@v1",
    load: () => require("./prompts/novel/coreGeneration.prompts").novelStructuredOutlineRepairPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.bible.generate@v1",
    load: () => require("./prompts/novel/coreGeneration.prompts").novelBiblePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.bible.generate@v1@en",
    load: () => require("./prompts/novel/coreGeneration.prompts.en").novelBiblePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.beat.generate@v1",
    load: () => require("./prompts/novel/coreGeneration.prompts").novelBeatPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.beat.generate@v1@en",
    load: () => require("./prompts/novel/coreGeneration.prompts.en").novelBeatPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.chapterHook.generate@v1",
    load: () => require("./prompts/novel/coreGeneration.prompts").novelChapterHookPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.chapterHook.generate@v2@en",
    load: () => require("./prompts/novel/coreGeneration.prompts.en").novelChapterHookPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.chapter.acceptance_assessment@v1",
    load: () => require("./prompts/novel/chapterAcceptance.prompts").chapterAcceptanceAssessmentPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.chapter.acceptance_assessment@v1@en",
    load: () => require("./prompts/novel/chapterAcceptance.prompts.en").chapterAcceptanceAssessmentPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.chapter.artifact_delta.extract@v1",
    load: () => require("./prompts/novel/chapterArtifactDelta.prompts").chapterArtifactDeltaPrompt as UnknownPromptAsset,
  },
  {
    key: "title.generation@v1",
    load: () => require("./prompts/helper/titleGeneration.prompt").titleGenerationPrompt as UnknownPromptAsset,
  },
  {
    key: "title.generation@v1@en",
    load: () => require("./prompts/helper/titleGeneration.prompt.en").titleGenerationPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.strategy@v2",
    load: () => require("./prompts/novel/volume/strategy.prompts").createVolumeStrategyPrompt({ maxVolumeCount: 16 }) as UnknownPromptAsset,
  },
  {
    key: "novel.volume.strategy.critique@v1",
    load: () => require("./prompts/novel/volume/strategy.prompts").volumeStrategyCritiquePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.volume.skeleton@v2",
    load: () => require("./prompts/novel/volume/skeleton.prompts").createVolumeSkeletonPrompt(1) as UnknownPromptAsset,
  },
  {
    key: "novel.volume.beat_sheet@v1",
    load: () => require("./prompts/novel/volume/beatSheet.prompts").volumeBeatSheetPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_list@v7",
    load: () => require("./prompts/novel/volume/chapterList.prompts").createVolumeChapterListPrompt(1) as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_purpose@v1",
    load: () => require("./prompts/novel/volume/chapterDetail.prompts").volumeChapterPurposePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_boundary@v1",
    load: () => require("./prompts/novel/volume/chapterDetail.prompts").volumeChapterBoundaryPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_task_sheet@v2",
    load: () => require("./prompts/novel/volume/chapterDetail.prompts").volumeChapterTaskSheetPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_execution_contract@v1",
    load: () => require("./prompts/novel/volume/chapterDetail.prompts").volumeChapterExecutionContractPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_task_sheet_quality@v1",
    load: () => require("./prompts/novel/volume/chapterTaskSheetQuality.prompts").chapterTaskSheetQualityPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.volume.rebalance.adjacent@v1",
    load: () => require("./prompts/novel/volume/rebalance.prompts").volumeRebalancePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.characterDynamics.chapterExtract@v1",
    load: () => require("./prompts/novel/characterDynamics.prompts").chapterDynamicsExtractionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.characterDynamics.volumeProjection@v3",
    load: () => require("./prompts/novel/characterDynamics.prompts").volumeDynamicsProjectionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character_resource.extract_updates@v1",
    load: () => require("./prompts/novel/characterResource.prompts").characterResourceExtractionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.castOptions@v2",
    load: () => require("./prompts/novel/characterPreparation.prompts").characterCastOptionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.castOptions.repair@v1",
    load: () => require("./prompts/novel/characterPreparation.prompts").characterCastOptionRepairPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.castOptions.zhNormalize@v1",
    load: () => require("./prompts/novel/characterPreparation.prompts").characterCastOptionNormalizePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto@v1",
    load: () => require("./prompts/novel/characterPreparation.prompts").characterCastAutoPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto.members@v1",
    load: () => require("./prompts/novel/characterPreparation.autoFallback.prompts").characterCastAutoMembersPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto.relations@v1",
    load: () => require("./prompts/novel/characterPreparation.autoFallback.prompts").characterCastAutoRelationsPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto.repair@v1",
    load: () => require("./prompts/novel/characterPreparation.prompts").characterCastAutoRepairPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto.zhNormalize@v1",
    load: () => require("./prompts/novel/characterPreparation.prompts").characterCastAutoNormalizePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.supplemental@v1",
    load: () => require("./prompts/novel/characterPreparation.prompts").supplementalCharacterPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.supplemental.zhNormalize@v1",
    load: () => require("./prompts/novel/characterPreparation.prompts").supplementalCharacterNormalizePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.evolve@v1",
    load: () => require("./prompts/novel/coreCharacter.prompts").characterEvolutionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.visible_profile.complete@v1",
    load: () => require("./prompts/novel/characterVisibleProfile.prompts").characterVisibleProfileCompletionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.character.worldCheck@v1",
    load: () => require("./prompts/novel/coreCharacter.prompts").characterWorldCheckPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.chapter.summary@v1",
    load: () => require("./prompts/novel/review.prompts").chapterSummaryPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.chapter.summary@v1@en",
    load: () => require("./prompts/novel/review.prompts.en").chapterSummaryPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.chapter.writer@v5",
    load: () => require("./prompts/novel/chapterWriter.prompts").chapterWriterPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.chapter.writer@v5@en",
    load: () => require("./prompts/novel/chapterWriter.prompts.en").chapterWriterPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.timeline.extractor@v1",
    load: () => require("./prompts/novel/timelineExtractor.prompts").timelineExtractorPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.chapter_editor.workspace_diagnosis@v1",
    load: () => require("./prompts/novel/chapterEditor/workspaceDiagnosis.prompts").chapterEditorWorkspaceDiagnosisPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.chapter_editor.user_intent@v1",
    load: () => require("./prompts/novel/chapterEditor/userIntent.prompts").chapterEditorUserIntentPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.chapter_editor.rewrite_candidates@v2",
    load: () => require("./prompts/novel/chapterEditor/rewriteCandidates.prompts").chapterEditorRewriteCandidatesPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.review.chapter@v1",
    load: () => require("./prompts/novel/review.prompts").chapterReviewPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.review.chapter@v1@en",
    load: () => require("./prompts/novel/review.prompts.en").chapterReviewPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.review.repair@v1",
    load: () => require("./prompts/novel/review.prompts").chapterRepairPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.review.repair@v1@en",
    load: () => require("./prompts/novel/review.prompts.en").chapterRepairPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.review.patch@v1",
    load: () => require("./prompts/novel/chapterPatchRepair.prompts").chapterPatchRepairPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.review.patch@v1@en",
    load: () => require("./prompts/novel/chapterPatchRepair.prompts.en").chapterPatchRepairPlanPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.framing.suggest@v1",
    load: () => require("./prompts/novel/framing.prompts").novelFramingSuggestionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.continuation.rewrite_similarity@v1",
    load: () => require("./prompts/novel/continuation.prompts").novelContinuationRewritePrompt as UnknownPromptAsset,
  },
  {
    key: "novel.draft_optimize.selection@v1",
    load: () => require("./prompts/novel/draftOptimize.prompts").novelDraftOptimizeSelectionPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.draft_optimize.full@v1",
    load: () => require("./prompts/novel/draftOptimize.prompts").novelDraftOptimizeFullPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.production.characters@v1",
    load: () => require("./prompts/novel/production.prompts").novelProductionCharactersPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.create.resource_recommendation@v1",
    load: () => require("./prompts/novel/resourceRecommendation.prompts").novelCreateResourceRecommendationPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.idea_inspiration@v1",
    load: () => require("./prompts/novel/ideaInspiration.prompts").directorIdeaInspirationPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.director.idea_inspiration@v1@en",
    load: () => require("./prompts/novel/ideaInspiration.prompts.en").directorIdeaInspirationPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.payoff_ledger.sync@v5",
    load: () => require("./prompts/payoff/payoffLedgerSync.prompts").payoffLedgerSyncPrompt as UnknownPromptAsset,
  },
  {
    key: "state.snapshot.extract@v4",
    load: () => require("./prompts/state/state.prompts").stateSnapshotPrompt as UnknownPromptAsset,
  },
  {
    key: "storyMode.tree.generate@v1",
    load: () => require("./prompts/storyMode/storyMode.prompts").storyModeTreePrompt as UnknownPromptAsset,
  },
  {
    key: "storyMode.child.generate@v1",
    load: () => require("./prompts/storyMode/storyMode.prompts").storyModeChildPrompt as UnknownPromptAsset,
  },
  {
    key: "storyWorldSlice.generate@v1",
    load: () => require("./prompts/storyWorldSlice/storyWorldSlice.prompts").storyWorldSlicePrompt as UnknownPromptAsset,
  },
  {
    key: "style.detection@v1",
    load: () => require("./prompts/style/style.prompts").styleDetectionPrompt as UnknownPromptAsset,
  },
  {
    key: "style.recommendation@v1",
    load: () => require("./prompts/style/style.prompts").styleRecommendationPrompt as UnknownPromptAsset,
  },
  {
    key: "style.generate@v1",
    load: () => require("./prompts/style/style.prompts").styleGenerationPrompt as UnknownPromptAsset,
  },
  {
    key: "style.rewrite@v1",
    load: () => require("./prompts/style/style.prompts").styleRewritePrompt as UnknownPromptAsset,
  },
  {
    key: "style.anti_ai_rule.draft@v1",
    load: () => require("./prompts/style/style.prompts").antiAiRuleAiDraftPrompt as UnknownPromptAsset,
  },
    {
      key: "style.profile.extract@v2",
      load: () => require("./prompts/style/style.prompts").styleProfileExtractionPrompt as UnknownPromptAsset,
    },
    {
      key: "style.profile.from_book_analysis@v3",
      load: () => require("./prompts/style/style.prompts").styleProfileFromBookAnalysisPrompt as UnknownPromptAsset,
    },
    {
      key: "style.profile.from_brief@v2",
      load: () => require("./prompts/style/style.prompts").styleProfileFromBriefPrompt as UnknownPromptAsset,
    },
    {
      key: "style.profile.metadata@v1",
      load: () => require("./prompts/style/style.prompts").styleProfileMetadataPrompt as UnknownPromptAsset,
    },
    {
      key: "style.profile.select_anti_ai@v1",
      load: () => require("./prompts/style/style.prompts").styleProfileAntiAiSelectionPrompt as UnknownPromptAsset,
    },
    {
      key: "style.profile.sanitize_for_generation@v1",
      load: () => require("./prompts/style/style.prompts").styleProfileSanitizeForGenerationPrompt as UnknownPromptAsset,
    },
    {
      key: "style.detection@v2@en",
      load: () => require("./prompts/style/style.prompts.en").styleDetectionPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.recommendation@v1@en",
      load: () => require("./prompts/style/style.prompts.en").styleRecommendationPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.generate@v1@en",
      load: () => require("./prompts/style/style.prompts.en").styleGenerationPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.rewrite@v2@en",
      load: () => require("./prompts/style/style.prompts.en").styleRewritePromptEn as UnknownPromptAsset,
    },
    {
      key: "style.anti_ai_rule.draft@v1@en",
      load: () => require("./prompts/style/style.prompts.en").antiAiRuleAiDraftPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.profile.extract@v2@en",
      load: () => require("./prompts/style/style.prompts.en").styleProfileExtractionPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.profile.from_book_analysis@v3@en",
      load: () => require("./prompts/style/style.prompts.en").styleProfileFromBookAnalysisPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.profile.from_brief@v2@en",
      load: () => require("./prompts/style/style.prompts.en").styleProfileFromBriefPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.profile.metadata@v1@en",
      load: () => require("./prompts/style/style.prompts.en").styleProfileMetadataPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.profile.select_anti_ai@v1@en",
      load: () => require("./prompts/style/style.prompts.en").styleProfileAntiAiSelectionPromptEn as UnknownPromptAsset,
    },
    {
      key: "style.profile.sanitize_for_generation@v1@en",
      load: () => require("./prompts/style/style.prompts.en").styleProfileSanitizeForGenerationPromptEn as UnknownPromptAsset,
    },
    {
      key: "writingFormula.extract.stream@v1",
      load: () => require("./prompts/writingFormula/writingFormulaStream.prompts").writingFormulaExtractStreamPrompt as UnknownPromptAsset,
    },
    {
      key: "writingFormula.apply.rewrite.stream@v1",
      load: () => require("./prompts/writingFormula/writingFormulaStream.prompts").writingFormulaApplyRewriteStreamPrompt as UnknownPromptAsset,
    },
    {
      key: "writingFormula.apply.generate.stream@v1",
      load: () => require("./prompts/writingFormula/writingFormulaStream.prompts").writingFormulaApplyGenerateStreamPrompt as UnknownPromptAsset,
    },
    {
      key: "world.reference.inspiration@v1",
    load: () => require("./prompts/world/world.prompts").worldReferenceInspirationPrompt as UnknownPromptAsset,
  },
  {
    key: "world.draft.generate@v1",
    load: () => require("./prompts/world/worldDraft.prompts").worldDraftGenerationPrompt as UnknownPromptAsset,
  },
  {
    key: "world.skeleton.generate@v1",
    load: () => require("./prompts/world/worldDraft.prompts").worldSkeletonGenerationPrompt as UnknownPromptAsset,
  },
  {
    key: "world.draft.refine@v1",
    load: () => require("./prompts/world/worldDraft.prompts").worldDraftRefinePrompt as UnknownPromptAsset,
  },
  {
    key: "world.draft.refine_alternatives@v1",
    load: () => require("./prompts/world/worldDraft.prompts").worldDraftRefineAlternativesPrompt as UnknownPromptAsset,
  },
  {
    key: "world.skeleton.generate@v1@en",
    load: () => require("./prompts/world/worldDraft.prompts.en").worldSkeletonGenerationPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.draft.generate@v1@en",
    load: () => require("./prompts/world/worldDraft.prompts.en").worldDraftGenerationPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.draft.refine@v1@en",
    load: () => require("./prompts/world/worldDraft.prompts.en").worldDraftRefinePromptEn as UnknownPromptAsset,
  },
  {
    key: "world.draft.refine_alternatives@v1@en",
    load: () => require("./prompts/world/worldDraft.prompts.en").worldDraftRefineAlternativesPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.inspiration.concept_card@v1",
    load: () => require("./prompts/world/world.prompts").worldInspirationConceptCardPrompt as UnknownPromptAsset,
  },
  {
    key: "world.inspiration.localize_concept_card@v1",
    load: () => require("./prompts/world/world.prompts").worldInspirationConceptCardLocalizationPrompt as UnknownPromptAsset,
  },
  {
    key: "world.property_options.generate@v1",
    load: () => require("./prompts/world/world.prompts").worldPropertyOptionsPrompt as UnknownPromptAsset,
  },
  {
    key: "world.deepening.questions@v1",
    load: () => require("./prompts/world/world.prompts").worldDeepeningQuestionsPrompt as UnknownPromptAsset,
  },
  {
    key: "world.consistency.check@v1",
    load: () => require("./prompts/world/world.prompts").worldConsistencyPrompt as UnknownPromptAsset,
  },
  {
    key: "world.layer.generate@v1",
    load: () => require("./prompts/world/world.prompts").worldLayerGenerationPrompt as UnknownPromptAsset,
  },
  {
    key: "world.layer.localize@v1",
    load: () => require("./prompts/world/world.prompts").worldLayerLocalizationPrompt as UnknownPromptAsset,
  },
  {
    key: "world.import.extract@v1",
    load: () => require("./prompts/world/world.prompts").worldImportExtractionPrompt as UnknownPromptAsset,
  },
  {
    key: "world.visualization.generate@v1",
    load: () => require("./prompts/world/world.prompts").worldVisualizationPrompt as UnknownPromptAsset,
  },
  {
    key: "world.structure.backfill@v1",
    load: () => require("./prompts/world/world.prompts").worldStructureBackfillPrompt as UnknownPromptAsset,
  },
  {
    key: "novel.world.generate_from_theme@v1",
    load: () => require("./prompts/world/world.prompts").novelThemeWorldGenerationPrompt as UnknownPromptAsset,
  },
  {
    key: "world.structure.generate@v1",
    load: () => require("./prompts/world/world.prompts").worldStructureSectionPrompt as UnknownPromptAsset,
  },
  {
    key: "world.axioms.suggest@v1",
    load: () => require("./prompts/world/world.prompts").worldAxiomSuggestionPrompt as UnknownPromptAsset,
  },
  {
    key: "world.reference.inspiration@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldReferenceInspirationPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.visualization.generate@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldVisualizationPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.inspiration.concept_card@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldInspirationConceptCardPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.inspiration.localize_concept_card@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldInspirationConceptCardLocalizationPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.property_options.generate@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldPropertyOptionsPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.deepening.questions@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldDeepeningQuestionsPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.consistency.check@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldConsistencyPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.layer.generate@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldLayerGenerationPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.layer.localize@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldLayerLocalizationPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.import.extract@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldImportExtractionPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.structure.backfill@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldStructureBackfillPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.world.generate_from_theme@v1@en",
    load: () => require("./prompts/world/world.prompts.en").novelThemeWorldGenerationPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.structure.generate@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldStructureSectionPromptEn as UnknownPromptAsset,
  },
  {
    key: "world.axioms.suggest@v1@en",
    load: () => require("./prompts/world/world.prompts.en").worldAxiomSuggestionPromptEn as UnknownPromptAsset,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // English (@en) prompt variants — phase-2 batch. Additive & upstream-safe:
  // each loads a *.prompts.en.ts sibling; the zh anchors above are untouched.
  // ─────────────────────────────────────────────────────────────────────────
  {
    key: "bookAnalysis.chapter.split@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysisChapter.prompts.en").bookAnalysisChapterSplitPromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.appearance.consolidate@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts.en").bookAnalysisCharacterAppearanceConsolidatePromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.appearance.merge@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts.en").bookAnalysisCharacterAppearanceMergePromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.appearance.snapshot@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts.en").bookAnalysisCharacterAppearanceSnapshotPromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.generate@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts.en").bookAnalysisCharacterGeneratePromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.identify@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts.en").bookAnalysisCharacterIdentifyPromptEn as UnknownPromptAsset,
  },
  {
    key: "bookAnalysis.character.profile@v1@en",
    load: () => require("./prompts/bookAnalysis/bookAnalysisCharacter.prompts.en").bookAnalysisCharacterProfilePromptEn as UnknownPromptAsset,
  },
  {
    key: "comic.episodeOutline@v1@en",
    load: () => require("./prompts/comic/comic.prompts.en").comicEpisodeOutlinePromptEn as UnknownPromptAsset,
  },
  {
    key: "comic.panelScript@v1@en",
    load: () => require("./prompts/comic/comic.prompts.en").comicPanelScriptPromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.episode.compliance@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaEpisodeCompliancePromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.episode.quality@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaEpisodeQualityPromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.episode.repair@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaEpisodeRepairPromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.episode.script@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaEpisodeScriptPromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.episodeOutline@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaEpisodeOutlinePromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.source.original_bundle@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaSourceOriginalBundlePromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.source.supplement@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaSourceSupplementPromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.source.text_bundle@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaSourceTextBundlePromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.storyboard@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaStoryboardPromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.strategy@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaStrategyPromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.track.recommendation@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaTrackRecommendationPromptEn as UnknownPromptAsset,
  },
  {
    key: "drama.video.prompt@v1@en",
    load: () => require("./prompts/drama/drama.prompts.en").dramaVideoPromptPromptEn as UnknownPromptAsset,
  },
  {
    key: "image.generation_prompt.assist@v1@en",
    load: () => require("./prompts/image/image.prompts.en").imageGenerationPromptAssistPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.chapter_editor.rewrite_candidates@v2@en",
    load: () => require("./prompts/novel/chapterEditor/rewriteCandidates.prompts.en").chapterEditorRewriteCandidatesPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.chapter_editor.user_intent@v1@en",
    load: () => require("./prompts/novel/chapterEditor/userIntent.prompts.en").chapterEditorUserIntentPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.chapter_editor.workspace_diagnosis@v1@en",
    load: () => require("./prompts/novel/chapterEditor/workspaceDiagnosis.prompts.en").chapterEditorWorkspaceDiagnosisPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.chapter.artifact_delta.extract@v1@en",
    load: () => require("./prompts/novel/chapterArtifactDelta.prompts.en").novelChapterArtifactDeltaExtractPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character_resource.extract_updates@v1@en",
    load: () => require("./prompts/novel/characterResource.prompts.en").novelCharacterResourceExtractUpdatesPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto.members@v1@en",
    load: () => require("./prompts/novel/characterPreparation.autoFallback.prompts.en").novelCharacterCastAutoMembersPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto.relations@v1@en",
    load: () => require("./prompts/novel/characterPreparation.autoFallback.prompts.en").novelCharacterCastAutoRelationsPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto.repair@v1@en",
    load: () => require("./prompts/novel/characterPreparation.prompts.en").novelCharacterCastAutoRepairPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto.zhNormalize@v1@en",
    load: () => require("./prompts/novel/characterPreparation.prompts.en").novelCharacterCastAutoZhNormalizePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.castAuto@v1@en",
    load: () => require("./prompts/novel/characterPreparation.prompts.en").novelCharacterCastAutoPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.castOptions.repair@v1@en",
    load: () => require("./prompts/novel/characterPreparation.prompts.en").novelCharacterCastOptionsRepairPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.castOptions.zhNormalize@v1@en",
    load: () => require("./prompts/novel/characterPreparation.prompts.en").novelCharacterCastOptionsZhNormalizePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.castOptions@v2@en",
    load: () => require("./prompts/novel/characterPreparation.prompts.en").novelCharacterCastOptionsPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.evolve@v1@en",
    load: () => require("./prompts/novel/coreCharacter.prompts.en").novelCharacterEvolvePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.supplemental.zhNormalize@v1@en",
    load: () => require("./prompts/novel/characterPreparation.prompts.en").novelCharacterSupplementalZhNormalizePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.supplemental@v1@en",
    load: () => require("./prompts/novel/characterPreparation.prompts.en").novelCharacterSupplementalPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.visible_profile.complete@v1@en",
    load: () => require("./prompts/novel/characterVisibleProfile.prompts.en").novelCharacterVisibleProfileCompletePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.character.worldCheck@v1@en",
    load: () => require("./prompts/novel/coreCharacter.prompts.en").novelCharacterWorldCheckPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.characterDynamics.chapterExtract@v1@en",
    load: () => require("./prompts/novel/characterDynamics.prompts.en").novelCharacterDynamicsChapterExtractPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.characterDynamics.volumeProjection@v3@en",
    load: () => require("./prompts/novel/characterDynamics.prompts.en").novelCharacterDynamicsVolumeProjectionPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.continuation.rewrite_similarity@v1@en",
    load: () => require("./prompts/novel/continuation.prompts.en").novelContinuationRewriteSimilarityPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.create.resource_recommendation@v1@en",
    load: () => require("./prompts/novel/resourceRecommendation.prompts.en").novelCreateResourceRecommendationPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.draft_optimize.full@v1@en",
    load: () => require("./prompts/novel/draftOptimize.prompts.en").novelDraftOptimizeFullPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.draft_optimize.selection@v1@en",
    load: () => require("./prompts/novel/draftOptimize.prompts.en").novelDraftOptimizeSelectionPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.framing.suggest@v1@en",
    load: () => require("./prompts/novel/framing.prompts.en").novelFramingSuggestPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.payoff_ledger.sync@v5@en",
    load: () => require("./prompts/payoff/payoffLedgerSync.prompts.en").novelPayoffLedgerSyncPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.production.characters@v1@en",
    load: () => require("./prompts/novel/production.prompts.en").novelProductionCharactersPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.story_macro.decomposition@v1@en",
    load: () => require("./prompts/novel/storyMacro.prompts.en").novelStoryMacroDecompositionPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.story_macro.field_regeneration@v1@en",
    load: () => require("./prompts/novel/storyMacro.prompts.en").novelStoryMacroFieldRegenerationPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.timeline.extractor@v1@en",
    load: () => require("./prompts/novel/timelineExtractor.prompts.en").novelTimelineExtractorPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.beat_sheet@v1@en",
    load: () => require("./prompts/novel/volume/beatSheet.prompts.en").novelVolumeBeatSheetPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_boundary@v1@en",
    load: () => require("./prompts/novel/volume/chapterDetail.prompts.en").novelVolumeChapterBoundaryPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_execution_contract@v1@en",
    load: () => require("./prompts/novel/volume/chapterDetail.prompts.en").novelVolumeChapterExecutionContractPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_list@v7@en",
    load: () => require("./prompts/novel/volume/chapterList.prompts.en").novelVolumeChapterListPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_purpose@v1@en",
    load: () => require("./prompts/novel/volume/chapterDetail.prompts.en").novelVolumeChapterPurposePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_task_sheet_quality@v1@en",
    load: () => require("./prompts/novel/volume/chapterTaskSheetQuality.prompts.en").novelVolumeChapterTaskSheetQualityPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.chapter_task_sheet@v2@en",
    load: () => require("./prompts/novel/volume/chapterDetail.prompts.en").novelVolumeChapterTaskSheetPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.rebalance.adjacent@v1@en",
    load: () => require("./prompts/novel/volume/rebalance.prompts.en").novelVolumeRebalanceAdjacentPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.skeleton@v2@en",
    load: () => require("./prompts/novel/volume/skeleton.prompts.en").novelVolumeSkeletonPromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.strategy.critique@v1@en",
    load: () => require("./prompts/novel/volume/strategy.prompts.en").novelVolumeStrategyCritiquePromptEn as UnknownPromptAsset,
  },
  {
    key: "novel.volume.strategy@v2@en",
    load: () => require("./prompts/novel/volume/strategy.prompts.en").novelVolumeStrategyPromptEn as UnknownPromptAsset,
  },
  {
    key: "planner.arc.plan@v1@en",
    load: () => require("./prompts/planner/plannerPlan.prompts.en").plannerArcPlanPromptEn as UnknownPromptAsset,
  },
  {
    key: "planner.book.plan@v1@en",
    load: () => require("./prompts/planner/plannerPlan.prompts.en").plannerBookPlanPromptEn as UnknownPromptAsset,
  },
  {
    key: "planner.chapter.plan@v1@en",
    load: () => require("./prompts/planner/plannerPlan.prompts.en").plannerChapterPlanPromptEn as UnknownPromptAsset,
  },
  {
    key: "planner.replan.window_decision@v1@en",
    load: () => require("./prompts/planner/replanWindowDecision.prompts.en").plannerReplanWindowDecisionPromptEn as UnknownPromptAsset,
  },
  {
    key: "rag.contextual_chunk.prefix@v1@en",
    load: () => require("./prompts/rag/contextualChunk.prompts.en").ragContextualChunkPrefixPromptEn as UnknownPromptAsset,
  },
  {
    key: "state.snapshot.extract@v4@en",
    load: () => require("./prompts/state/state.prompts.en").stateSnapshotExtractPromptEn as UnknownPromptAsset,
  },
  {
    key: "storyMode.child.generate@v1@en",
    load: () => require("./prompts/storyMode/storyMode.prompts.en").storyModeChildPromptEn as UnknownPromptAsset,
  },
  {
    key: "storyMode.tree.generate@v1@en",
    load: () => require("./prompts/storyMode/storyMode.prompts.en").storyModeTreePromptEn as UnknownPromptAsset,
  },
  {
    key: "storyWorldSlice.generate@v1@en",
    load: () => require("./prompts/storyWorldSlice/storyWorldSlice.prompts.en").storyWorldSlicePromptEn as UnknownPromptAsset,
  },
  {
    key: "writingFormula.apply.generate.stream@v1@en",
    load: () => require("./prompts/writingFormula/writingFormulaStream.prompts.en").writingFormulaApplyGenerateStreamPromptEn as UnknownPromptAsset,
  },
  {
    key: "writingFormula.apply.rewrite.stream@v1@en",
    load: () => require("./prompts/writingFormula/writingFormulaStream.prompts.en").writingFormulaApplyRewriteStreamPromptEn as UnknownPromptAsset,
  },
  {
    key: "writingFormula.extract.stream@v1@en",
    load: () => require("./prompts/writingFormula/writingFormulaStream.prompts.en").writingFormulaExtractStreamPromptEn as UnknownPromptAsset,
  },
];

const promptAssetLoaderByKey = createPromptAssetLoaderRegistry(promptAssetLoaderEntries);
const promptAssetLoaderEntryByLoad = new Map<PromptAssetLoader, PromptAssetLoaderEntry>(
  promptAssetLoaderEntries.map((entry) => [entry.load, entry] as const),
);
const promptAssetByKey = new Map<string, UnknownPromptAsset>();
const unhydratedPromptAssetLoaders = new Set<PromptAssetLoader>(
  promptAssetLoaderEntries.map((entry) => entry.load),
);

function findCachedPromptAssetByLoader(load: PromptAssetLoader): UnknownPromptAsset | null {
  for (const [key, asset] of promptAssetByKey.entries()) {
    if (promptAssetLoaderByKey.get(key) === load) {
      return asset;
    }
  }
  return null;
}

function cacheLoadedPromptAsset(entry: PromptAssetLoaderEntry, asset: UnknownPromptAsset): UnknownPromptAsset {
  const actualKey = buildPromptAssetKey(asset);
  const registeredLoader = promptAssetLoaderByKey.get(actualKey);
  if (registeredLoader && registeredLoader !== entry.load) {
    throw new Error(`Duplicate prompt asset registration: ${actualKey}`);
  }

  const cachedAsset = promptAssetByKey.get(actualKey);
  if (cachedAsset && cachedAsset !== asset) {
    throw new Error(`Duplicate prompt asset cache entry: ${actualKey}`);
  }

  if (entry.key !== actualKey) {
    const declaredLoader = promptAssetLoaderByKey.get(entry.key);
    if (declaredLoader === entry.load) {
      promptAssetLoaderByKey.delete(entry.key);
    }
  }

  promptAssetLoaderByKey.set(actualKey, entry.load);
  promptAssetByKey.set(actualKey, asset);
  unhydratedPromptAssetLoaders.delete(entry.load);
  return asset;
}

function hydratePromptAssetEntry(entry: PromptAssetLoaderEntry): UnknownPromptAsset {
  const cached = findCachedPromptAssetByLoader(entry.load);
  if (cached) {
    return cached;
  }

  return cacheLoadedPromptAsset(entry, entry.load());
}

function hydratePromptAssetByKey(key: string): void {
  if (promptAssetByKey.has(key)) {
    return;
  }

  for (const entry of promptAssetLoaderEntries) {
    if (!unhydratedPromptAssetLoaders.has(entry.load)) {
      continue;
    }

    const asset = hydratePromptAssetEntry(entry);
    if (buildPromptAssetKey(asset) === key) {
      return;
    }
  }
}

function hydrateAllPromptAssets(): void {
  for (const entry of promptAssetLoaderEntries) {
    if (!unhydratedPromptAssetLoaders.has(entry.load)) {
      continue;
    }
    hydratePromptAssetEntry(entry);
  }
}

function loadRegisteredPromptAsset(key: string): UnknownPromptAsset | null {
  const cached = promptAssetByKey.get(key);
  if (cached) {
    return cached;
  }

  const load = promptAssetLoaderByKey.get(key);
  if (load) {
    const entry = promptAssetLoaderEntryByLoad.get(load);
    if (!entry) {
      return null;
    }

    const asset = hydratePromptAssetEntry(entry);
    return buildPromptAssetKey(asset) === key ? asset : promptAssetByKey.get(key) ?? null;
  }

  hydratePromptAssetByKey(key);
  return promptAssetByKey.get(key) ?? null;
}

export function hasRegisteredPromptAsset(id: string, version: string, language: PromptLanguage = "zh"): boolean {
  return loadRegisteredPromptAsset(`${id}@${version}@${language}`) != null;
}

export function listRegisteredPromptAssets(): UnknownPromptAsset[] {
  hydrateAllPromptAssets();
  return [...promptAssetByKey.values()];
}

export function getRegisteredPromptAsset(id: string, version: string, language: PromptLanguage = "zh"): UnknownPromptAsset | null {
  return loadRegisteredPromptAsset(`${id}@${version}@${language}`);
}

/** Result of locale-aware variant resolution. */
export interface ResolvedPromptVariant {
  asset: UnknownPromptAsset;
  /** The locale actually rendered (zh when an en variant is missing). */
  resolvedLocale: PromptLanguage;
  /** The registry key of the asset actually rendered. */
  resolvedVariant: string;
  /** True when the requested locale had no variant and fell back to zh. */
  localeFallback: boolean;
}

/**
 * Resolve the prompt variant for a locale, with zh fallback.
 *
 * - locale "zh" (or omitted): returns the zh anchor directly.
 * - locale "en": returns the en variant if registered; otherwise falls back to
 *   the zh anchor, logs a warning (so a silent Chinese generation is
 *   diagnosable), and sets `localeFallback: true`.
 *
 * Callers keep importing/passing the zh anchor; only the runner routes through
 * this when `options.locale` is set. PromptWorkbench and other 2-arg callers
 * are unaffected (they default to the zh anchor via getRegisteredPromptAsset).
 */
export function resolvePromptVariant(id: string, version: string, locale: PromptLanguage = "zh"): ResolvedPromptVariant | null {
  if (locale === "zh") {
    const asset = getRegisteredPromptAsset(id, version, "zh");
    if (!asset) {
      return null;
    }
    return { asset, resolvedLocale: "zh", resolvedVariant: buildPromptAssetKey(asset), localeFallback: false };
  }
  // locale === "en"
  const enVariant = getRegisteredPromptAsset(id, version, "en");
  if (enVariant) {
    return { asset: enVariant, resolvedLocale: "en", resolvedVariant: buildPromptAssetKey(enVariant), localeFallback: false };
  }
  const zhAnchor = getRegisteredPromptAsset(id, version, "zh");
  if (!zhAnchor) {
    return null;
  }
  console.warn(
    `[prompt-locale] no en variant for ${id}@${version}; falling back to zh. ` +
      `Register an en variant (language: "en") to enable English output for this prompt.`,
  );
  return { asset: zhAnchor, resolvedLocale: "zh", resolvedVariant: buildPromptAssetKey(zhAnchor), localeFallback: true };
}

export function findRegisteredPromptAssetById(id: string): UnknownPromptAsset | null {
  hydrateAllPromptAssets();
  // Under the multilingual registry an id maps to both a zh anchor and en
  // variant(s). Callers (slots/template resolution, PromptWorkbench) want the
  // canonical zh anchor; only fall back to a non-zh variant if no zh exists.
  let fallback: UnknownPromptAsset | null = null;
  for (const asset of promptAssetByKey.values()) {
    if (asset.id === id) {
      if (asset.language === "zh") {
        return asset;
      }
      fallback ??= asset;
    }
  }
  return fallback;
}

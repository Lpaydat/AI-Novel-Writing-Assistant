/**
 * Allowlist of client source files that legitimately contain non-UI Chinese
 * (CJK) text after comments are stripped.
 *
 * Paths are relative to the client package root (the directory that holds
 * `package.json`), e.g. `src/pages/foo.ts`.
 *
 * A file belongs here ONLY when its remaining CJK is genuinely NOT
 * user-facing UI chrome — for example: enum/union type literals, object/map
 * KEYS, `===`/`.includes()`/regex that match server-generated Chinese content
 * or detect mojibake, values submitted to an API / persisted as entity data /
 * fed into an AI prompt, or content joined/formatted from CJK entity data.
 *
 * `noRawCjk.test.mjs` enforces this list both ways:
 *  - a NON-allowlisted file with post-comment CJK fails the guard, and
 *  - an allowlisted file that no longer has any post-comment CJK also fails
 *    (keeps the list honest — delete the entry once the file is cleaned up).
 *
 * Purely comment-only Chinese is NOT listed here: the guard strips comments
 * first, so such files pass without an entry.
 */
export const RAW_CJK_ALLOWLIST: readonly string[] = [
  "src/api/character.ts", // union type literals for character role/growth-stage (persisted enum values)
  "src/components/common/LocaleSwitcher.tsx", // native language endonym label (中文) — intentionally not translated
  "src/lib/directorTaskNotice.ts", // .includes() matches server-generated chapter-title warning summaries
  "src/lib/novelWorkflowActivityTags.ts", // tag tokens matched against server activity strings via .includes()
  "src/lib/novelWorkflowContinuation.ts", // .includes("质量") matches server-generated stage names
  "src/lib/textFile.ts", // mojibake token array + regex used to detect corrupted encodings
  "src/pages/antiAiRules/antiAiRulesPage.shared.ts", // regex splits user input on Chinese punctuation
  "src/pages/bookAnalysis/components/BookAnalysisCharacterAppearancePanel.tsx", // stylePreset string submitted to the image-generation API
  "src/pages/bookAnalysis/components/BookAnalysisCharacterImagePanel.tsx", // stylePreset string submitted to the image-generation API
  "src/pages/bookAnalysis/components/BookAnalysisSourceRangePicker.tsx", // regex parses the Chinese "万" unit from char-count input
  "src/pages/bookAnalysis/hooks/actions/useAnalysisPublishing.ts", // builds the persisted name of a created style-profile resource
  "src/pages/bookAnalysis/hooks/useBookAnalysisWorkspace.ts", // Chinese diagnosis instruction fed into an AI prompt
  "src/pages/characters/components/CharacterCreateDialog.tsx", // option <value> and default role/category are persisted entity data
  "src/pages/comic/project/CharactersPanel.tsx", // Chinese face-preset snippets fed into the image-generation prompt
  "src/pages/creativeHub/components/NovelProductionStarterCard.tsx", // bidirectional conversion between English enums and persisted Chinese form values
  "src/pages/drama/DramaWorkspacePage.tsx", // builds story source content for generation + persisted default project titles
  "src/pages/drama/components/DramaCharactersPanel.tsx", // joins CJK character data with a Chinese punctuation separator
  "src/pages/novels/NovelEdit.tsx", // regex/.includes matching + itemLabel strings submitted to the workflow API
  "src/pages/novels/components/CharacterAssetWorkspace.tsx", // regex .test() matches server-generated runtime signals
  "src/pages/novels/components/NovelAutoDirectorDialog.shared.ts", // buildInitialIdea assembles Chinese text fed into an AI prompt
  "src/pages/novels/components/NovelAutoDirectorProgressPanel.tsx", // Set of placeholder titles matched against server task titles
  "src/pages/novels/components/NovelCharacterPanel.tsx", // option <value> attributes are persisted character role data
  "src/pages/novels/components/NovelCreateResourceRecommendationCard.tsx", // regex splits input on Chinese punctuation
  "src/pages/novels/components/NovelTaskDrawer.tsx", // .includes() matches server-generated task labels
  "src/pages/novels/components/VolumePayoffOverviewCard.tsx", // regex strips Chinese punctuation for normalization/matching
  "src/pages/novels/components/chapterExecution.shared.tsx", // regex splits input on Chinese punctuation
  "src/pages/novels/components/characterAssetWorkspace.helpers.ts", // regex .test() matches protagonist role keywords
  "src/pages/novels/components/characterPanel.utils.ts", // keyword-match arrays + Chinese character entity payload submitted to the API
  "src/pages/novels/components/cover/novelCoverDraft.ts", // label maps + defaults build the cover image AI prompt context
  "src/pages/novels/components/novelExistingProjectTakeoverViewModel.ts", // .includes() matches server-generated error messages
  "src/pages/novels/components/storylineView.utils.ts", // keyword-match arrays + content joined/parsed for AI context
  "src/pages/novels/components/titleWorkshop/NovelCreateTitleQuickFill.tsx", // assembles a Chinese brief fed into the title-generation AI prompt
  "src/pages/novels/hooks/useChapterExecutionActions.ts", // itemLabel submitted to workflow API + repair instructions fed to the AI
  "src/pages/novels/hooks/useNovelCharacterMutations.ts", // default role "主角" persisted as character entity data
  "src/pages/novels/hooks/useNovelEditMutations.ts", // itemLabel/checkpointSummary submitted to the workflow (task-center) API
  "src/pages/novels/hooks/useNovelStoryMacro.ts", // itemLabel/checkpointSummary submitted to the workflow (task-center) API
  "src/pages/novels/hooks/useNovelVolumePlanning.draft.ts", // regex splits input on Chinese punctuation
  "src/pages/novels/hooks/useNovelVolumePlanning.generation.ts", // itemLabel/checkpointSummary submitted to the workflow (task-center) API
  "src/pages/novels/novelEdit.utils.ts", // regex splits input on Chinese punctuation
  "src/pages/novels/structuredOutline.utils.ts", // regex + Chinese text assembled as structured outline data for AI/persistence
  "src/pages/novels/volumePlan.utils.ts", // Chinese text assembled as volume/chapter plan data for AI/persistence
  "src/pages/promptWorkbench/hooks/usePromptPreview.ts", // Chinese sample fixtures fed into the prompt-preview AI request
  "src/pages/titles/components/TitleFactoryPanel.tsx", // builds persisted description/keywords for a title-library entry
  "src/pages/worlds/WorldGenerator.tsx", // persisted world defaults + fallback text fed into the world-generation AI prompt
  "src/pages/worlds/WorldList.tsx", // joins CJK world entity data with Chinese punctuation separators for compact previews
  "src/pages/worlds/components/WorldVisualizationBoard.tsx", // regex .test() matches server-generated risk-level signals
  "src/pages/worlds/components/generator/useWorldGeneratorDerivedState.ts", // assembles Chinese genre context fed into the AI prompt
  "src/pages/worlds/components/generator/worldGeneratorShared.ts", // regex splits input on Chinese punctuation
  "src/pages/worlds/components/workspace/WorldHandbookEditor.tsx", // regex splits input on Chinese punctuation
  "src/pages/worlds/components/workspace/WorldStructureTab.tsx", // regex splits input on Chinese punctuation
  "src/pages/worlds/components/workspace/handbook/handbookEditorUtils.ts", // regex splits input on Chinese punctuation
  "src/pages/worlds/components/workspace/structure/WorldFactionsSection.tsx", // regex splits input on Chinese punctuation
];

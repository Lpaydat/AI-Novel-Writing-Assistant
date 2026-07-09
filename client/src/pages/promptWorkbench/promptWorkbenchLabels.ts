import type { NovelMaterialImportance, PromptCatalogItem } from "@/api/promptWorkbench";

// Locale-aware: every map value is a `promptWorkbench` namespace translation key,
// resolved with t()/i18n.t at call time (module-load i18n.t would freeze the locale).
export const LOCKED_FIELD_LABEL_KEYS: Record<string, string> = {
  outputSchema: "shared.lockedFieldOutputSchema",
  postValidate: "shared.lockedFieldPostValidate",
  postValidateFailureRecovery: "shared.lockedFieldPostValidateFailureRecovery",
  semanticRetryPolicy: "shared.lockedFieldSemanticRetryPolicy",
  taskType: "shared.lockedFieldTaskType",
  mode: "shared.lockedFieldMode",
  contextPolicy: "shared.lockedFieldContextPolicy",
  toolCatalog: "shared.lockedFieldToolCatalog",
  approvalBoundary: "shared.lockedFieldApprovalBoundary",
};

export const SLOT_KIND_LABEL_KEYS: Record<string, string> = {
  replace: "shared.slotKindReplace",
  append: "shared.slotKindAppend",
  choice: "shared.slotKindChoice",
  toggle: "shared.slotKindToggle",
  token: "shared.slotKindToken",
};

export const CONTEXT_GROUP_LABEL_KEYS: Record<string, string> = {
  book_contract: "shared.contextGroupBookContract",
  chapter_boundary: "shared.contextGroupChapterBoundary",
  chapter_mission: "shared.contextGroupChapterMission",
  character_dynamics: "shared.contextGroupCharacterDynamics",
  character_hard_facts: "shared.contextGroupCharacterHardFacts",
  character_resource_context: "shared.contextGroupCharacterResourceContext",
  continuation_constraints: "shared.contextGroupContinuationConstraints",
  custom_slot: "shared.contextGroupCustomSlot",
  historical_issues: "shared.contextGroupHistoricalIssues",
  incremental_round_context: "shared.contextGroupIncrementalRoundContext",
  local_state: "shared.contextGroupLocalState",
  narrative_progress_hint: "shared.contextGroupNarrativeProgressHint",
  obligation_contract: "shared.contextGroupObligationContract",
  open_conflicts: "shared.contextGroupOpenConflicts",
  opening_constraints: "shared.contextGroupOpeningConstraints",
  participant_subset: "shared.contextGroupParticipantSubset",
  payoff_directives: "shared.contextGroupPayoffDirectives",
  payoff_ledger: "shared.contextGroupPayoffLedger",
  previous_chapter_hook: "shared.contextGroupPreviousChapterHook",
  previous_chapter_tail: "shared.contextGroupPreviousChapterTail",
  rag_context: "shared.contextGroupRagContext",
  recent_chapters: "shared.contextGroupRecentChapters",
  repair_boundaries: "shared.contextGroupRepairBoundaries",
  repair_issues: "shared.contextGroupRepairIssues",
  state_goal: "shared.contextGroupStateGoal",
  story_macro: "shared.contextGroupStoryMacro",
  structure_obligations: "shared.contextGroupStructureObligations",
  style_contract: "shared.contextGroupStyleContract",
  timeline_context: "shared.contextGroupTimelineContext",
  volume_window: "shared.contextGroupVolumeWindow",
  world_rules: "shared.contextGroupWorldRules",
  world_slice: "shared.contextGroupWorldSlice",
};

export const SOURCE_TYPE_LABEL_KEYS: Record<string, string> = {
  novel: "shared.sourceTypeNovel",
  chapter: "shared.sourceTypeChapter",
  plan: "shared.sourceTypePlan",
  state: "shared.sourceTypeState",
  character: "shared.sourceTypeCharacter",
  world: "shared.sourceTypeWorld",
  style: "shared.sourceTypeStyle",
  audit: "shared.sourceTypeAudit",
  task: "shared.sourceTypeTask",
};

export const MESSAGE_ROLE_LABEL_KEYS: Record<string, string> = {
  system: "shared.messageRoleSystem",
  human: "shared.messageRoleHuman",
  assistant: "shared.messageRoleAssistant",
  ai: "shared.messageRoleAi",
};

export const TASK_TYPE_LABEL_KEYS: Record<string, string> = {
  writer: "shared.taskTypeWriter",
  light_review: "shared.taskTypeLightReview",
  critical_review: "shared.taskTypeCriticalReview",
  repair: "shared.taskTypeRepair",
  summary: "shared.taskTypeSummary",
  planning: "shared.taskTypePlanning",
  translation: "shared.taskTypeTranslation",
  analysis: "shared.taskTypeAnalysis",
  classification: "shared.taskTypeClassification",
};

export const OUTPUT_TYPE_LABEL_KEYS: Record<string, string> = {
  structured: "shared.outputTypeStructured",
  text: "shared.outputTypeText",
};

export const ENTRYPOINT_OPTIONS = [
  { value: "creative_hub", labelKey: "shared.entrypointCreativeHub" },
  { value: "auto_director", labelKey: "shared.entrypointAutoDirector" },
  { value: "chapter_pipeline", labelKey: "shared.entrypointChapterPipeline" },
  { value: "manual_test", labelKey: "shared.entrypointManualTest" },
];

export const MANAGEMENT_STATUS_LABEL_KEYS: Record<PromptCatalogItem["managementStatus"], string> = {
  complete: "shared.managementStatusComplete",
  missing_context_requirements: "shared.managementStatusMissingContextRequirements",
  missing_slots: "shared.managementStatusMissingSlots",
};

export const MATERIAL_IMPORTANCE_LABEL_KEYS: Record<NovelMaterialImportance, string> = {
  must: "shared.materialImportanceMust",
  high: "shared.materialImportanceHigh",
  medium: "shared.materialImportanceMedium",
  low: "shared.materialImportanceLow",
};

export const CONTEXT_STATUS_LABEL_KEYS = {
  selected: "shared.contextStatusSelected",
  dropped: "shared.contextStatusDropped",
  summarized: "shared.contextStatusSummarized",
  available: "shared.contextStatusAvailable",
} as const;

export const LOCKED_CONTEXT_GROUPS = new Set([
  "chapter_mission",
  "character_hard_facts",
  "obligation_contract",
  "style_contract",
  "local_state",
  "timeline_context",
  "previous_chapter_hook",
  "volume_window",
  "participant_subset",
]);

export function statusBadgeVariant(status: PromptCatalogItem["managementStatus"]) {
  return status === "complete" ? "default" : "secondary";
}

export function capabilityLabels(prompt: PromptCatalogItem): string[] {
  return [
    prompt.capabilities.hasOutputSchema ? "Schema" : null,
    prompt.capabilities.hasPostValidate ? "PostValidate" : null,
    prompt.capabilities.hasSemanticRetryPolicy ? "SemanticRetry" : null,
    prompt.capabilities.hasRepairPolicy ? "Repair" : null,
    prompt.capabilities.hasStructuredOutputHint ? "OutputHint" : null,
  ].filter(Boolean) as string[];
}

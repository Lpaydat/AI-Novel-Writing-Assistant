import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import { NOVEL_PROMPT_BUDGETS } from "./promptBudgetProfiles";
import {
  chapterArtifactDeltaOutputSchema,
  type ChapterArtifactDeltaOutput,
  type ChapterArtifactDeltaPromptInput,
} from "./chapterArtifactDelta.prompts";

/**
 * English variant of `novel.chapter.artifact_delta.extract@v1`.
 *
 * Domain-aware rewrite for English-language long-form fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema` (JSON
 * shape is language-independent), input/output types, and `contextPolicy`. The
 * `repairPolicy` is copied verbatim and the `structuredOutputHint` note/example
 * are translated to English; `postValidate` is omitted (the runner still applies
 * the zh anchor's language-independent postValidate on en output). The enum
 * VALUES the model must echo (updateType, resourceType, narrativeFunction,
 * statusAfter, category, currentStatus, scopeType, syncPlan flags, ...) are
 * downstream contracts and are kept verbatim; only the surrounding prose is
 * translated. Registered alongside the zh anchor; the runner swaps to this
 * variant only when `options.locale === "en"`.
 */

const CHAPTER_ARTIFACT_DELTA_EXAMPLE: ChapterArtifactDeltaOutput = {
  summary: "In this chapter Cheng Zhi confirms an exploitable passage gap at the storeroom's back door and obtains the brass key that opens it. The reader now knows sneaking into the storeroom is the next available move, but he still does not know the guard layout inside, so the related thread advances to a pending-payoff state.",
  concreteFacts: [
    {
      text: "Cheng Zhi has obtained the brass key that opens the storeroom's back door",
      category: "completed",
    },
  ],
  stateDeltas: {
    summary: "The protagonist obtains the back-door brass key; the reader knows a back-door infiltration is now a possible next move.",
    characterStates: [
      {
        characterName: "Cheng Zhi",
        currentGoal: "Use the back-door brass key to enter the storeroom",
        emotion: "Tense but more confident",
        stressLevel: 62,
        secretExposure: "The reader knows he has obtained the key",
        knownFacts: ["The back-door brass key opens the storeroom's back door"],
        misbeliefs: [],
        summary: "Cheng Zhi has a new means of infiltration but still does not know the guard layout inside the storeroom.",
      },
    ],
    relationStates: [],
    informationStates: [
      {
        holderType: "reader",
        fact: "The back-door brass key has already been obtained by Cheng Zhi.",
        status: "known",
        summary: "The reader knows the key resource is now in place.",
      },
    ],
    foreshadowStates: [
      {
        title: "The storeroom back door",
        summary: "The back-door brass key hints that an infiltration or escape scene will appear later.",
        status: "hinted",
        setupChapterId: "current chapter",
      },
    ],
  },
  characterResourceDeltas: [
    {
      resourceName: "back-door brass key",
      resourceType: "credential",
      updateType: "acquired",
      holderCharacterName: "Cheng Zhi",
      ownerType: "character",
      ownerName: "Cheng Zhi",
      statusAfter: "available",
      readerKnows: true,
      holderKnows: true,
      knownByCharacterNames: ["Cheng Zhi"],
      narrativeFunction: "key",
      summary: "Cheng Zhi obtains the brass key that opens the storeroom's back door.",
      narrativeImpact: "Later he can reasonably enter the storeroom or slip out through the back door.",
      expectedFutureUse: "Sneaking into the storeroom.",
      constraints: ["It only justifies passage through the back door and cannot substitute for front-gate permission."],
      evidence: ["Cheng Zhi tucks the back-door brass key into his sleeve."],
      confidence: 0.88,
      riskLevel: "low",
      riskReason: "",
    },
  ],
  payoffDeltas: [
    {
      ledgerKey: "storeroom_back_door",
      title: "The storeroom back door",
      summary: "The brass key provides a clear setup for later storeroom action.",
      scopeType: "chapter",
      currentStatus: "hinted",
      targetStartChapterOrder: 4,
      targetEndChapterOrder: 6,
      firstSeenChapterOrder: 3,
      lastTouchedChapterOrder: 3,
      setupChapterOrder: 3,
      sourceRefs: [],
      evidence: [{ summary: "Cheng Zhi obtains the back-door brass key.", chapterOrder: 3 }],
      riskSignals: [],
      statusReason: "The setup is completed in this chapter and needs to be paid off later.",
      confidence: 0.86,
    },
  ],
  relationDynamics: [],
  factionUpdates: [],
  characterCandidates: [],
  characterKnowledgeStates: [
    {
      characterName: "Cheng Zhi",
      knownFacts: ["The back-door brass key opens the storeroom's back door"],
      hiddenFacts: ["The guard layout inside the storeroom"],
    },
  ],
  syncPlan: {
    stateSnapshot: "write",
    characterResources: "write",
    payoffLedger: "delta",
    characterDynamics: "skip",
    reason: "This chapter has no relationship-stage change, but it has state, resource, and foreshadowing deltas.",
  },
  confidence: 0.86,
  requiresFullReconcile: false,
};

export const novelChapterArtifactDeltaExtractPromptEn: PromptAsset<
  ChapterArtifactDeltaPromptInput,
  ChapterArtifactDeltaOutput
> = {
  id: "novel.chapter.artifact_delta.extract",
  version: "v1",
  taskType: "fact_extraction",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterArtifactDelta,
  },
  repairPolicy: {
    maxAttempts: 1,
  },
  structuredOutputHint: {
    example: CHAPTER_ARTIFACT_DELTA_EXAMPLE,
    note: [
      "Extract the chapter summary, hard facts, state snapshot, character resources, foreshadowing/payoff, relation dynamics, information boundaries, and sync plan all in one pass.",
      "Record only changes that have clear evidence in the body text or are strongly relevant to the task goal.",
      "You decide syncPlan and requiresFullReconcile based on story risk; the code only validates and persists.",
    ].join(" "),
  },
  outputSchema: chapterArtifactDeltaOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a chapter-artifact delta extractor for long-form English-language novels.",
      "Your task is to extract, in one pass from a single chapter's body text, the incremental artifacts later writing needs, and to produce a sync plan.",
      "",
      "Output only a valid JSON object; do not output Markdown, explanations, comments, or code blocks.",
      "",
      "[Extraction principles]",
      "1. Only extract changes that have already happened in the body text, are known to the reader, known to a character, or explicitly required by the chapter goal.",
      "2. Do not misclassify ordinary description, one-off environmental props, or pure psychological adjectives as long-term ledger artifacts.",
      "3. Character resources must have evidence; foreshadowing/payoff must be able to state its setup, progression, payoff, or risk.",
      "4. Relation dynamics are recorded only when this chapter has a stage change, a faction/stance change, or a new character candidate.",
      "5. Default to outputting delta; recommend full_reconcile only when the ledger clearly conflicts, something is paid off but no prior setup can be found, key threads are misaligned across chapters, or this chapter resolves several payoffs at once.",
      "6. You decide the syncPlan; do not rely on keywords. If there is no corresponding change, explicitly set skip and give a reason.",
      "7. Prefer names from the known roster for all characters; put unconfirmable new figures into characterCandidates rather than forcing them onto existing characters.",
      "8. summary must be written in English, kept to roughly 80-180 words, and cover the key events, conflict progression, character-state changes, and this chapter's outcome or suspense direction.",
      "9. concreteFacts records only hard facts that arise in this chapter's body and must stay consistent later, each no longer than 40 words; include promises, deal terms, the nature of events, key numbers/dates/places, and identity or status changes.",
      "10. concreteFacts.category may only be completed, revealed, or state_changed; output [] when there is no clear hard fact, and do not write abstract goals or mood description into concreteFacts.",
      "11. characterKnowledgeStates is filled only when this chapter has a significant information gap; knownFacts lists facts the character clearly knows after this chapter, hiddenFacts lists facts the character still does not know and must not learn prematurely later, at most 5 per group; output [] when there is no information gap.",
      "12. payoffDeltas.currentStatus may only be setup, hinted, pending_payoff, paid_off, failed, or overdue; do not output active — use pending_payoff for anything progressed but not yet paid off.",
      "13. payoffDeltas.riskSignals must be an array of objects shaped like { code, severity, summary }; output [] when there is no risk, and do not output an array of strings.",
      "14. relationDynamics must use sourceCharacterName, targetCharacterName, stageLabel, stageSummary; characterCandidates must use proposedName, proposedRole, summary.",
      "15. characterResourceDeltas.updateType may only be introduced, acquired, revealed, used, transferred, lost, consumed, damaged, destroyed, recovered, or stale_marked; use introduced for anything newly created or first appearing.",
      "16. characterResourceDeltas.resourceType may only be physical_item, clue, credential, ability_resource, relationship_token, consumable, hidden_card, or world_resource; use consumable for materials, potions, and single-use herbs, and world_resource for points, currency, or faction resources.",
      "17. characterResourceDeltas.narrativeFunction may only be tool, clue, weapon, proof, key, cost, promise, hidden_card, or constraint; power-up gains usually use tool, consumed materials/points use cost, and credentials/IOUs use proof or constraint.",
      "18. characterResourceDeltas.statusAfter may only be available, hidden, borrowed, transferred, lost, consumed, damaged, destroyed, or stale; do not output custom statuses like active, owned, usable, used, or broken.",
      "19. Output at most 8 characterResourceDeltas; prioritize changes that affect action boundaries, payoff resolution, or resource ownership across chapters.",
      "20. payoffDeltas.scopeType may only be book, volume, or chapter; use book for whole-book/story-level foreshadowing, and do not output story, novel, or global.",
      "21. In stateDeltas.foreshadowStates, fill setupChapterId/payoffChapterId only when you can confirm the real chapterId; if you can only tell which chapter number it is, prefer to omit it or write the chapter-order as a string rather than a number.",
      "22. syncPlan.stateSnapshot, characterResources, and characterDynamics may only be skip or write; only payoffLedger may be skip, delta, or full_reconcile.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: Chapter ${input.chapterOrder} "${input.chapterTitle}"`,
      `Chapter goal: ${input.chapterGoal || "No explicit goal"}`,
      "",
      "Known characters:",
      input.characterRosterText || "No character roster yet",
      "",
      "Previous state summary:",
      input.previousStateText || "No previous state snapshot yet",
      "",
      "Existing character-resource ledger:",
      input.existingResourceText || "No existing key resources yet",
      "",
      "Existing foreshadowing ledger:",
      input.existingPayoffText || "No existing foreshadowing ledger yet",
      "",
      "Chapter body:",
      input.chapterContent,
    ].join("\n")),
  ],
};

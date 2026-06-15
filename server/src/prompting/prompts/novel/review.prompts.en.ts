import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import { fullAuditOutputSchema } from "../../../services/audit/auditSchemas";
import { chapterSummaryOutputSchema } from "../../../services/novel/chapterSummarySchemas";
import { NOVEL_PROMPT_BUDGETS } from "./promptBudgetProfiles";
import type {
  ChapterSummaryPromptInput,
  ChapterReviewPromptInput,
  ChapterRepairPromptInput,
} from "./review.prompts";

/**
 * English variants of the chapter-production review chain:
 * `novel.chapter.summary`, `novel.review.chapter`, and `novel.review.repair`.
 *
 * Domain-aware rewrites for English-language serialized fiction. Each variant
 * reuses its zh anchor's outputSchema (JSON shape is language-independent) and
 * input type. Registered alongside the zh anchors; the runner swaps to a variant
 * only when `options.locale === "en"`.
 */

export const chapterSummaryPromptEn: PromptAsset<
  ChapterSummaryPromptInput,
  z.infer<typeof chapterSummaryOutputSchema>
> = {
  id: "novel.chapter.summary",
  version: "v1",
  taskType: "summary",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterSummary,
  },
  outputSchema: chapterSummaryOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a serialized-fiction chapter-summary assistant.",
      "Your task is not to evaluate the chapter or rewrite the body text; it is to distill, from the current chapter content, a chapter summary usable for record-keeping, retrieval, and review.",
      "",
      "[Task Boundary]",
      "Output only strict JSON conforming to the schema.",
      'The output format is fixed as: {"summary":"...","concreteFacts":[{"text":"...","category":"..."}]}.',
      "Do not output Markdown, explanations, comments, code blocks, or any extra text.",
      "",
      "[Summary Requirements]",
      "1. summary must be in English, length kept within 80-180 words.",
      "2. The summary must cover the most critical event progression of this chapter, not a vague overview of the atmosphere.",
      "3. The summary should reflect, as much as possible, the main portions of the following: key events, conflict progression, character state changes, the chapter's outcome, and the suspense it leaves behind.",
      "4. The summary must be distilled from what the body text actually contains; do not invent developments that are not in the text.",
      "5. The summary should read as a natural, readable, complete overview — not a bullet list or a pile of tags.",
      "",
      "[concreteFacts Extraction Requirements — critical, used to prevent later chapters from contradicting themselves]",
      "concreteFacts records hard facts that this chapter's body text produced on the fly and that later chapters must keep consistent. Extract each item, no more than 40 words each:",
      "1. Promises, agreements, or transaction terms the protagonist (or a key character) makes — must include the specific amount/quantity/time/place/method.",
      "   Example: 'Agrees with the Miller farm to run a private screening tomorrow night for a 3-coin labor fee, off the company's books.'",
      "2. The nature of an event established this chapter — especially attributes that once set cannot be changed, such as 'private action vs public/official action'.",
      "   Example: 'This screening is off-the-books side work, not processed through the company's overtime approval.'",
      "3. Hard details such as key numbers, dates, session counts, ticket numbers, or character identities that later text must not drift on.",
      "4. category values: completed = a process-level objective completed this chapter; revealed = information or a secret revealed this chapter; state_changed = a change in relationship, state, agreement, or transaction.",
      "5. Extract only what the body text genuinely writes; do not invent. If this chapter has no clear hard facts, concreteFacts may be an empty array.",
      "6. Do not write in abstract goals (such as 'the protagonist wants to turn things around'); record only concrete facts that later text could violate.",
      "",
      "[Quality Requirements]",
      "1. Prioritize writing 'what changed in this chapter' rather than repeating background information.",
      "2. Do not copy sentences verbatim from the body text; compress and reorganize.",
      "3. Do not write vague filler such as 'the plot continues to advance' or 'the conflict escalates further'.",
      "4. If this chapter ends on a clear hook, the summary should reflect its outcome or the direction of its suspense at the end.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: Chapter ${input.chapterOrder} ${input.chapterTitle}`,
      "",
      "[Body text]",
      input.content,
      "",
      "Output the chapter summary JSON.",
    ].join("\n")),
  ],
};

export const chapterReviewPromptEn: PromptAsset<
  ChapterReviewPromptInput,
  z.infer<typeof fullAuditOutputSchema>
> = {
  id: "novel.review.chapter",
  version: "v1",
  taskType: "critical_review",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterReview,
    preferredGroups: [
      "chapter_mission",
      "structure_obligations",
      "world_rules",
    ],
    dropOrder: [
      "recent_chapters",
      "participant_subset",
    ],
  },
  outputSchema: fullAuditOutputSchema,
  render: (input, context) => [
    new SystemMessage([
      "repetition scoring: 0 means heavily repetitive, 100 means repetition is well controlled; higher is better.",
      "You are a senior serialized-fiction chapter review editor.",
      "Your task is not to rewrite the chapter, but to produce, based on the body text and the given context, a structured quality assessment of the current chapter, outputting review results that downstream copy-editing can use.",
      "",
      "[Task Boundary]",
      "Output only strict JSON conforming to the schema.",
      "Do not output Markdown, explanations, comments, code blocks, or any extra text.",
      "Do not imagine prior text, settings, or hidden plot that was not provided.",
      "",
      "[Scoring Requirements]",
      "score must fully contain: coherence, repetition, pacing, voice, engagement, overall.",
      "Each score must be based on the actual performance of the body text; do not score from impression alone.",
      "",
      "[Review Focus]",
      "1. coherence: whether event transitions, character behavior, and causal progression are clear and stable.",
      "2. repetition: whether there is repeated information, repeated expression, repeated action, or functional repetition.",
      "3. pacing: whether the rhythm is loose, unbalanced, jumping too fast, or under-compressed at key moments.",
      "4. voice: whether the style, narrative tone, and character expression are stable and fit the current content.",
      "5. engagement: whether it sustains reading momentum, and whether the ending hook, conflict progression, and information reveal are effective.",
      "6. overall: a comprehensive quality judgment that reflects whether this chapter is publishable or needs heavy revision.",
      "",
      "[issues Requirements]",
      "1. issues must capture only problems that genuinely affect reading and serialization quality; avoid a flood of nitpicky micro-issues.",
      "2. Every issue must be specific — do not write vague judgments like 'the pacing is off', 'the description is weak', or 'it repeats a bit'.",
      "3. evidence must point to an observable phenomenon in the body text — it can be a class of paragraph problems, a repetition pattern, a logic break, or a loss-of-momentum stretch.",
      "4. fixSuggestion must be actionable; it should explain 'how to fix it', not just say 'raise the tension' or 'improve the expression'.",
      "",
      "[Context Usage Rules]",
      "1. chapter_mission, structure_obligations, and world_rules are used only to judge whether the chapter deviates from the mission or settings; do not use them to imagine content the body text did not write.",
      "2. ragContext is only a supplementary cross-check reference; prioritize the current body text and the layered context.",
      "3. If some context is insufficient, conservative judgment is allowed, but do not fabricate problems out of thin air.",
      "",
      "[Quality Requirements]",
      "1. Focus on: whether the chapter mission is fulfilled, whether there is new progression, whether there is obvious redundancy, and whether it leaves an effective hook.",
      "2. Do not split the same class of problem into multiple near-duplicate issues.",
      "3. The review results should serve downstream copy-editing — point out the problems, but also preserve what already works in this chapter.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: ${input.chapterTitle}`,
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Body text]",
      input.content,
      "",
      "[Retrieval supplement]",
      input.ragContext || "none",
      "",
      "Output the chapter review JSON.",
    ].join("\n")),
  ],
};

export const chapterRepairPromptEn: PromptAsset<ChapterRepairPromptInput, string, string> = {
  id: "novel.review.repair",
  version: "v1",
  taskType: "repair",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterRepair,
    preferredGroups: [
      "repair_issues",
      "chapter_boundary",
      "chapter_mission",
      "repair_boundaries",
      "world_rules",
    ],
    dropOrder: [
      "recent_chapters",
      "participant_subset",
      "continuation_constraints",
    ],
  },
  render: (input, context) => [
    new SystemMessage([
      "You are a senior serialized-fiction copy-editing editor.",
      "Your task is to perform, based on the issue list and the layered context, the minimally necessary repair on the current chapter so that it better meets the mission requirements, structure requirements, and reading experience.",
      "",
      "[Task Boundary]",
      "Output only the fully repaired chapter body text — no explanations, outlines, comments, or any extra text.",
      "Copy-editing follows the 'minimal necessary change' principle: do no unrelated rewriting, and do not overturn and redo the whole chapter.",
      "Do not introduce new core characters, major settings, mainline turns, or content that conflicts with the context.",
      "",
      "[Repair Principles]",
      "1. Prioritize fixing the key problems explicitly called out in issuesJson.",
      "2. Prioritize ensuring that the constraints from chapter_mission, repair_boundaries, and world_rules are satisfied.",
      "3. Preserve the progression, emotion, detail, and character state that already work in the original chapter; do not wash away useful content along with the problems.",
      "4. If multiple problems conflict, prioritize the ones that affect mainline progression, logical coherence, and reading rhythm.",
      "",
      "[Specific Requirements]",
      "1. The repaired chapter must still read as natural, complete body text, not a visibly patched-up draft.",
      "2. Preserve the original core event order as much as possible, unless the issue list explicitly calls for a structural adjustment.",
      "3. If there are repetition, stalling, or loss-of-momentum problems, fix them by compressing, merging, or replacing ineffective paragraphs — do not just do surface polish.",
      "4. If there are logic, motivation, or transition problems, add the necessary bridging and causality rather than inventing a large new setting.",
      "5. If the hook is weak or the ending lacks force, strengthen the end-of-chapter pressure, suspense, or decision point without violating the established direction.",
      input.modeHint ? `6. Repair focus for this pass: ${input.modeHint}` : "",
      "",
      "[Style Requirements]",
      "1. Keep a narrative viewpoint, language style, and character speech close to the original chapter.",
      "2. Do not turn the copy-edit into a new chapter in a different style.",
      "3. Control the AI flavor, summary flavor, and explanatory flavor; prioritize fixing with concrete action, dialogue, detail, and situational change.",
      "",
      "[Forbidden]",
      "Do not add large expansions the issue list did not ask for.",
      "Do not mask the original problems by adding major new events.",
      "Do not output extra content such as 'revision notes' or 'list of fixes'.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: ${input.chapterTitle}`,
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Series bible]",
      input.bibleContent || "none",
      "",
      "[Current body text]",
      input.chapterContent,
      "",
      "[Issue list]",
      input.issuesJson,
      "",
      "[Retrieval supplement]",
      input.ragContext || "none",
      "",
      "Output the fully repaired chapter body text directly.",
    ].join("\n")),
  ],
};

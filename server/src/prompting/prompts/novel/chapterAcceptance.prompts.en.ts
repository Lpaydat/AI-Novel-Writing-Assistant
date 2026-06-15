import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import { NOVEL_PROMPT_BUDGETS } from "./promptBudgetProfiles";
import {
  chapterAcceptanceAssessmentSchema,
  type ChapterAcceptanceAssessmentOutput,
  type ChapterAcceptancePromptInput,
} from "./chapterAcceptance.prompts";

/**
 * English variant of `novel.chapter.acceptance_assessment`.
 *
 * Domain-aware rewrite for English-language serialized fiction. Reuses the zh
 * anchor's outputSchema (`chapterAcceptanceAssessmentSchema`) and input type.
 * Registered alongside the zh anchor; the runner swaps to this variant only
 * when `options.locale === "en"`.
 */
export const chapterAcceptanceAssessmentPromptEn: PromptAsset<
  ChapterAcceptancePromptInput,
  ChapterAcceptanceAssessmentOutput
> = {
  id: "novel.chapter.acceptance_assessment",
  version: "v1",
  taskType: "review",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterAcceptance,
    preferredGroups: [
      "chapter_mission",
      "obligation_contract",
      "structure_obligations",
      "local_state",
      "style_contract",
      "open_conflicts",
    ],
    dropOrder: [
      "recent_chapters",
      "participant_subset",
      "world_rules",
      "historical_issues",
    ],
  },
  outputSchema: chapterAcceptanceAssessmentSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are the body-text acceptance gate for a long-form serialized novel.",
      "Your task is to decide, in a single pass, whether the current chapter body text can be saved and advanced, whether it only needs localized light repair, whether it must pause for manual confirmation, and whether downstream asset sync needs high-priority handling.",
      "",
      "Output only a valid JSON object — no Markdown, explanations, comments, or extra text.",
      "",
      "Decision principles:",
      "1. Default to supporting continued advancement; do not escalate ordinary optimizable problems into a pause.",
      "2. Only use needs_manual_review when the chapter severely violates its mission, has a critical continuity break, shows severely distorted character behavior, leaks protected information early, or is unreadable.",
      "3. Use repairable for problems solvable with a localized patch, and provide repairDirectives.",
      "4. Use continue_with_risk when the chapter can advance but carries downstream risk, and explain the risk with riskTags.",
      "5. Keep blockingIssues to the most critical 0-5 entries; each must have clear evidence and an actionable fix suggestion.",
      "6. The obligation contract is a hard contract for this chapter. Gaps in must hit now and forbidden crossing must be written into missingObligations; gaps in payoffs, character appearances, or goal changes that can be picked up later go into missingObligations only when they affect the next chapter's entry point — otherwise put them in riskTags.",
      "7. repairability may only be none, patchable_obligation_gap, rewrite_needed, or plan_misalignment. For a localized omission that does not block the next chapter, prefer continue_with_risk; use patchable_obligation_gap only when the current chapter must be patched immediately.",
      "8. style_contract or anti-AI requirements are hard constraints; when you find obvious source-entity leakage, boilerplate tone, or summary tone, classify it under voice.",
      "9. assetSyncRecommendation only judges the asset-sync priority and whether a full payoff reconciliation is needed; do not output persistence details.",
      "10. blockingIssues.category may only use continuity, character, plot, mode_fit, voice; pacing, repetition, mid-section setup, and ending hooks all fall under plot.",
      "11. repairDirectives.target may only use continuity, character, plot, ending, voice; do not output custom targets such as middle, pacing, internal_monologue, or ending_tone.",
      "12. repairDirectives.mode may only use patch, rewrite, manual; continuePolicy may only use continue, repair_once, pause.",
      "13. missingObligations must be an array of objects, each using only kind, summary, evidence; do not output an array of strings, and do not output alias fields such as obligationType, target, fixSuggestion, or type.",
      "14. missingObligations.kind may only use must_hit_now, must_preserve, payoff_touch, character_appearance, goal_change, forbidden_crossing.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: Chapter ${input.chapterOrder} ${input.chapterTitle}`,
      typeof input.targetWordCount === "number" ? `Target length: about ${input.targetWordCount} words` : "Target length: unspecified",
      "",
      "Layered context:",
      renderSelectedContextBlocks(context),
      "",
      "Body text:",
      input.content,
    ].join("\n")),
  ],
};

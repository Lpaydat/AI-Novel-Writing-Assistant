import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChapterPatchRepairPlan } from "@ai-novel/shared/types/chapterPatchRepair";
import { chapterPatchRepairPlanSchema } from "@ai-novel/shared/types/chapterPatchRepair";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import { NOVEL_PROMPT_BUDGETS } from "./promptBudgetProfiles";
import type { ChapterPatchRepairPromptInput } from "./chapterPatchRepair.prompts";

/**
 * English variant of `novel.review.patch`.
 *
 * Domain-aware rewrite for English-language serialized fiction. Reuses the zh
 * anchor's outputSchema (`chapterPatchRepairPlanSchema`) and input type.
 * Registered alongside the zh anchor; the runner swaps to this variant only
 * when `options.locale === "en"`.
 */
export const chapterPatchRepairPlanPromptEn: PromptAsset<
  ChapterPatchRepairPromptInput,
  ChapterPatchRepairPlan
> = {
  id: "novel.review.patch",
  version: "v1",
  taskType: "repair",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterRepair,
    preferredGroups: [
      "repair_issues",
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
  outputSchema: chapterPatchRepairPlanSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are a serialized-fiction localized copy-editing editor.",
      "The current task is not a full-chapter rewrite, but producing a localized patch plan that a program can safely apply.",
      "Output only strict JSON — no Markdown, no explanations, and no full body text.",
      "",
      "[Patch Principles]",
      "1. strategy must default to patch_first.",
      "2. In patches, each targetExcerpt must be copied verbatim from the current body text, and it should be long enough to occur only once in the body text.",
      "3. replacement replaces only the fragment corresponding to targetExcerpt; do not rewrite unrelated paragraphs. If the repair goal is to delete a repeated fragment, replacement may be an empty string.",
      "4. Prioritize fixing the key problems in the issue list that affect mainline progression, continuity, character motivation, pacing, and the ending hook.",
      "5. Do not add major settings, core characters, or plot turns that conflict with the chapter mission.",
      "6. Localized patches handle only problems in the body text where a complete sentence or paragraph can be located; system risks such as the review system being unavailable, missing structured judgment, or insufficient scoring are not body-text-fragment repairs.",
      "7. targetExcerpt must be a complete short sentence or paragraph from the body text — not a single word, form of address, punctuation mark, or overly short phrase.",
      "8. If you cannot find an original-text fragment of at least 6 characters that occurs uniquely in the body text, do not output a patch; set requiresFullRewrite to true and explain in escalationReason.",
      "9. If it is genuinely impossible to safely repair with localized patches, set requiresFullRewrite to true and explain in escalationReason.",
      input.modeHint ? `10. Repair focus: ${input.modeHint}` : "",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: ${input.chapterTitle}`,
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Current body text]",
      input.chapterContent,
      "",
      "[Issue list]",
      input.issuesJson,
      "",
      "Output the localized patch JSON.",
    ].join("\n")),
  ],
};

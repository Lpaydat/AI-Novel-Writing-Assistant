import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../../core/promptTypes";
import { NOVEL_PROMPT_BUDGETS } from "../promptBudgetProfiles";
import {
  chapterEditorRewriteCandidatesSchema,
  type ChapterEditorRewriteCandidatesParsed,
} from "./rewriteCandidates.promptSchemas";
import type { ChapterEditorRewriteCandidatesPromptInput } from "./rewriteCandidates.prompts";

/**
 * English variant of `novel.chapter_editor.rewrite_candidates@v2`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema`,
 * `contextPolicy`, and `contextRequirements` (all language-independent) and its
 * input type; the render, editable slot copy, and model-facing hint are in
 * English. Registered alongside the zh anchor; the runner swaps to this variant
 * only when `options.locale === "en"`.
 */

function renderOptionalBlock(title: string, value?: string | null): string {
  const text = value?.trim() ?? "";
  return `${title}\n${text || "None"}`;
}

export const chapterEditorRewriteCandidatesPromptEn: PromptAsset<
  ChapterEditorRewriteCandidatesPromptInput,
  ChapterEditorRewriteCandidatesParsed
> = {
  id: "novel.chapter_editor.rewrite_candidates",
  version: "v2",
  taskType: "writer",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterEditorRewrite,
  },
  contextRequirements: [
    { group: "chapter_mission", priority: 100, sourceHint: "Chapter goal and current editing task." },
    { group: "style_contract", priority: 88, sourceHint: "Current style profile and anti-AI guidance." },
    { group: "participant_subset", priority: 82, sourceHint: "Relevant character state for local rewrite." },
    { group: "world_slice", priority: 76, sourceHint: "World constraints that local edits must preserve." },
    { group: "recent_chapters", priority: 64, sourceHint: "Nearby continuity for editor preview." },
  ],
  slots: [
    {
      kind: "replace" as const,
      key: "chapterEditor.candidateStyle",
      label: "Candidate rewrite style",
      description: "Tune how the candidate versions differ from one another and where their expression leans.",
      default: "Candidates should form clear differences — for example more natural, more restrained, or more emotionally charged — while each stays usable.",
      maxLength: 600,
    },
  ],
  outputSchema: chapterEditorRewriteCandidatesSchema,
  structuredOutputHint: {
    mode: "auto",
    note: "Return 2 to 3 candidate rewrites and keep the JSON stable.",
  },
  render: (input, context) => {
    const candidateStyle = context.slots?.text("chapterEditor.candidateStyle")
      ?? "Candidates should form clear differences — for example more natural, more restrained, or more emotionally charged — while each stays usable.";
    return [
    new SystemMessage([
      "You are the local-rewrite assistant inside the chapter editor of a serialized web-fiction app.",
      "Your job is to take the passage the user selected and produce 2 to 3 directly comparable candidate rewrites.",
      "",
      "Task boundary:",
      "1. Rewrite only the selected passage; do not rewrite the whole chapter.",
      "2. The rewrite must fit the surrounding tone, the characters' state, and this chapter's goal.",
      "3. Do not explain your process, do not output Markdown, and do not output any extra text beyond the candidates.",
      "4. You must return JSON that matches the schema.",
      "",
      "Hard constraints:",
      "1. Do not change plot facts.",
      "2. Do not change the person or narrative POV.",
      "3. Do not add unauthorized settings.",
      "4. Preserve the original passage's core information and its continuity with the surrounding text as much as possible.",
      "5. Do not rewrite the text into an obviously templated, AI-flavored style.",
      "",
      "Candidate requirements:",
      "1. Return 2 to 3 candidates.",
      "2. Each candidate must be a complete, drop-in replacement passage.",
      "3. rationale gives a one-sentence account of this version's main approach.",
      "4. riskNotes lists 0 to 3 risks the user should watch for.",
      "5. macroAlignmentNote explains in one sentence how these candidates serve this chapter's / this volume's goal.",
      "6. label must be short, suitable for switching between candidates in the editor.",
      "7. summary sums up the main change in one sentence.",
      "8. semanticTags keeps only 2 to 4 high-value tags, e.g. \"strengthen emotion\", \"compress repetition\", \"fill in action detail\".",
      "",
      "Rewrite scope:",
      "1. selection means rewrite only the selected passage.",
      "2. chapter means rewrite the whole chapter, but still preserve the chapter's facts, mainline, and position within the volume.",
      "3. " + candidateStyle,
      "",
      `Rewrite intent for this pass: ${input.operationLabel}`,
      `Rewrite scope: ${input.scope === "selection" ? "Selected excerpt" : "Whole chapter"}`,
      input.customInstruction?.trim()
        ? `User's extra requirement: ${input.customInstruction.trim()}`
        : "User's extra requirement: none",
    ].join("\n")),
    new HumanMessage([
      renderOptionalBlock("[This chapter's goal]", input.goalSummary),
      "",
      renderOptionalBlock("[This chapter's summary]", input.chapterSummary),
      "",
      renderOptionalBlock("[Craft and tone]", input.styleSummary),
      "",
      renderOptionalBlock("[Character state]", input.characterStateSummary),
      "",
      renderOptionalBlock("[World and setting constraints]", input.worldConstraintSummary),
      "",
      renderOptionalBlock("[Macro positioning]", input.macroContextSummary),
      "",
      renderOptionalBlock("[Resolved editing goal]", input.resolvedIntentSummary),
      "",
      "[Hard rewrite constraints]",
      input.constraintsText,
      "",
      "[Preceding passage]",
      input.beforeParagraphs.length > 0 ? input.beforeParagraphs.join("\n\n") : "None",
      "",
      "[Original text to rewrite]",
      input.selectedText,
      "",
      "[Following passage]",
      input.afterParagraphs.length > 0 ? input.afterParagraphs.join("\n\n") : "None",
      "",
      "Return only the JSON.",
    ].join("\n")),
  ];
  },
};

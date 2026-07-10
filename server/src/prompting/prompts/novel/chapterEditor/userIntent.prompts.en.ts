import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../../core/promptTypes";
import { NOVEL_PROMPT_BUDGETS } from "../promptBudgetProfiles";
import {
  chapterEditorUserIntentSchema,
  type ChapterEditorUserIntentParsed,
} from "./userIntent.promptSchemas";
import type { ChapterEditorUserIntentPromptInput } from "./userIntent.prompts";

/**
 * English variant of `novel.chapter_editor.user_intent@v1`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema`,
 * `contextPolicy`, and `contextRequirements` (all language-independent) and its
 * input type; only the render (and the model-facing hint) is in English.
 * Registered alongside the zh anchor; the runner swaps to this variant only when
 * `options.locale === "en"`.
 */
export const chapterEditorUserIntentPromptEn: PromptAsset<
  ChapterEditorUserIntentPromptInput,
  ChapterEditorUserIntentParsed
> = {
  id: "novel.chapter_editor.user_intent",
  version: "v1",
  taskType: "writer",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterEditorUserIntent,
  },
  contextRequirements: [
    { group: "chapter_mission", priority: 100, sourceHint: "Chapter goal for edit-intent interpretation." },
    { group: "style_contract", priority: 82, sourceHint: "Current prose style constraints." },
    { group: "local_state", priority: 78, sourceHint: "Current chapter state and continuity boundaries." },
  ],
  outputSchema: chapterEditorUserIntentSchema,
  structuredOutputHint: {
    mode: "auto",
    note: "Parse the user's natural-language revision request into an executable chapter-edit intent.",
  },
  render: (input) => [
    new SystemMessage([
      "You are the revision-intent parser inside the chapter editor of a serialized web-fiction app.",
      "Your job is to turn the user's natural-language revision request into a stable, executable, structured editing intent.",
      "",
      "Rules:",
      "1. Do not copy the user's wording verbatim; distill it into an editing goal.",
      "2. You must account for the macro context so a local change does not break the volume's pacing or the chapter's mission.",
      "3. mustPreserve must retain both what the user explicitly asked to keep and the key non-negotiable constraints from the macro context.",
      "4. mustAvoid captures the risks that would undermine the goal of this revision.",
      "5. strength may only be light / medium / strong.",
      "6. Output only the JSON that matches the schema.",
    ].join("\n")),
    new HumanMessage([
      `[Edit scope] ${input.scope === "selection" ? "Selected excerpt" : "Whole chapter"}`,
      `[User request] ${input.instruction}`,
      `[Current excerpt] ${input.selectedText?.trim() || "Whole-chapter mode; no separate excerpt."}`,
      `[Macro context] ${input.macroContextSummary}`,
      `[Must hold onto] ${input.mustKeepConstraints.length > 0 ? input.mustKeepConstraints.join("; ") : "Preserve existing facts, narrative POV, and core information."}`,
      "",
      "Return only the JSON.",
    ].join("\n")),
  ],
};

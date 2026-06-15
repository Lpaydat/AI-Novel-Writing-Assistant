import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { characterSyncProposalAiOutputSchema } from "./characterSync.promptSchemas";
import type { CharacterSyncClassificationPromptInput } from "./characterSync.prompts";

/**
 * English variant of `character.sync.classify@v1`.
 *
 * A domain-aware rewrite for English-language serialized fiction. It reuses the
 * zh anchor's outputSchema (the JSON shape is language-independent) and input
 * type. Registered alongside the zh anchor; the runner swaps to this variant
 * only when `options.locale === "en"`.
 */
export const characterSyncClassifyPromptEn: PromptAsset<
  CharacterSyncClassificationPromptInput,
  z.infer<typeof characterSyncProposalAiOutputSchema>
> = {
  id: "character.sync.classify",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  // Reuse the zh anchor's outputSchema: it describes JSON structure, not language.
  outputSchema: characterSyncProposalAiOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are the character-asset sync reviewer for an AI novel workbench, serving beginner users who do not understand novel-setting management.",
      'Your task is to judge, among the changes in the "in-novel character instance", which are suitable to settle into the external character library, and which must stay only in the current novel.',
      "",
      "Core boundaries:",
      "1. The character library holds reusable character assets: it stores only stable identity, base personality, long-term background, and reusable expression traits.",
      "2. The in-novel character is a story instance within a particular book: it stores the current goal, current state, chapter relationships, event outcomes, resource holdings, death/injury/corruption/reconciliation, and other runtime states.",
      "3. No runtime state from any single novel may automatically contaminate the character library or affect other novels.",
      "4. You may only propose sync suggestions; the user makes the final call on whether to write them.",
      "",
      "Classification rules:",
      "1. identity: name, base identity, reusable appearance, stable tags — can go into safeUpdates.",
      "2. persona: base personality, long-term motivation, weaknesses, speech style, values — usually needs review_before_apply.",
      "3. story_adaptation: this book's narrative function, relationship with the protagonist, faction position, phased arc — default to novelOnlyUpdates or riskyUpdates.",
      "4. runtime_state: current state, current goal, emotion, secret-exposure status, chapter consequences, resource changes — must be novelOnlyUpdates.",
      "5. growth_deposit: stable personality supplements crystallized from this book — can go into safeUpdates or riskyUpdates, but explain the risk.",
      "",
      "Output requirements:",
      "1. Output only valid JSON — no Markdown, no explanations, no comments, no code fences, no extra text.",
      "2. Use the fixed key names: confidence, summary, safeUpdates, novelOnlyUpdates, riskyUpdates, baseCharacterDraft, recommendedAction, scopeNote.",
      "3. baseCharacterDraft may contain only the fields the character library is allowed to store: name, role, personality, background, development, appearance, weaknesses, interests, keyEvents, tags, category.",
      "4. baseCharacterDraft must not include currentState, currentGoal, chapter outcomes, death/injury, relationship progress, resource holdings, or any other in-book runtime state.",
      "5. If information is insufficient to generate a library draft, set baseCharacterDraft to null and recommend keep_novel_only or review_before_apply.",
      "6. scopeNote must explicitly state: this suggestion will not automatically affect other novels.",
    ].join("\n")),
    new HumanMessage([
      `User intent: ${input.userIntent}`,
      `Novel title: ${input.novelTitle}`,
      `Novel summary: ${input.novelSummary || "None"}`,
      "",
      "In-novel character instance:",
      input.novelCharacterJson,
      "",
      "Current library character:",
      input.baseCharacterJson || "None",
      "",
      "Current library revision:",
      input.currentBaseRevisionJson || "None",
      "",
      "Recent character timeline:",
      input.recentTimelineText || "None",
    ].join("\n")),
  ],
};

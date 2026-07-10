import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { characterResourceExtractionOutputSchema } from "./characterResource.promptSchemas";
import type { CharacterResourceExtractionPromptInput } from "./characterResource.prompts";

/**
 * English variant of `novel.character_resource.extract_updates@v1`.
 *
 * Domain-aware rewrite for English-language fiction — NOT a literal string swap
 * of the zh anchor. Reuses the zh anchor's `outputSchema` (JSON shape is
 * language-independent) and input type. `contextPolicy` and `repairPolicy` are
 * copied verbatim and `structuredOutputHint` is translated; `postValidate` is
 * omitted (the runner still applies the zh anchor's language-independent
 * postValidate on en output). Registered alongside the zh anchor; the runner
 * swaps to this variant only when `options.locale === "en"`.
 */

const CHARACTER_RESOURCE_EXAMPLE = {
  updates: [
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
      summary: "Cheng Zhi obtains the brass key that opens the back door.",
      narrativeImpact: "Later he can slip in through the back door, but cannot enter the front-gate restricted area out of nowhere.",
      expectedFutureUse: "Sneaking into the storeroom or escaping pursuit.",
      constraints: ["The key only justifies passage through the back door and cannot substitute for other permissions."],
      evidence: ["Cheng Zhi tucks the back-door brass key into his sleeve."],
      confidence: 0.86,
      riskLevel: "low",
      riskReason: "",
    },
  ],
  continuityRisks: [],
};

export const novelCharacterResourceExtractUpdatesPromptEn: PromptAsset<
  CharacterResourceExtractionPromptInput,
  z.infer<typeof characterResourceExtractionOutputSchema>
> = {
  id: "novel.character_resource.extract_updates",
  version: "v1",
  taskType: "fact_extraction",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  repairPolicy: {
    maxAttempts: 1,
  },
  structuredOutputHint: {
    example: CHARACTER_RESOURCE_EXAMPLE,
    note: [
      "Output only key resource changes that have clear evidence in the chapter.",
      "Do not misclassify metaphors, ordinary everyday items, or one-off environmental props as long-term resources.",
      "A temporary character's resource enters updates only when it is reused across chapters, affects a conflict, is tied to a setup/payoff, or is carried off by the protagonist.",
      "confidence must be a number between 0 and 1; when unsure, omit it.",
    ].join(" "),
  },
  outputSchema: characterResourceExtractionOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-resource ledger extractor for long-form fiction.",
      "Your task is to extract, from a single chapter's body text, the key character-resource changes that will affect later writing, review, repair, or replanning.",
      "",
      "Output only a single valid JSON object — no Markdown, explanations, comments, or code blocks.",
      "The top-level format is fixed as {\"updates\":[],\"continuityRisks\":[]}.",
      "",
      "Extraction scope:",
      "1. Key items, clues, credentials, trump cards, ability costs, relationship tokens, and consumable resources of the protagonist and long-term characters.",
      "2. Hidden resources, traps, evidence, or leverage held by the antagonist or rivals.",
      "3. Clues or resources provided by a temporary character that will influence later chapters.",
      "",
      "Do not extract:",
      "1. Ordinary food, clothing, or daily items, pure set dressing, or one-off trinkets with no later impact.",
      "2. Metaphorical expressions, e.g. \"he grasped the key to his destiny\".",
      "3. New items, characters, or abilities that have no evidence in the input.",
      "",
      "Judgment rules:",
      "1. Every entry in updates must have evidence.",
      "2. holderCharacterName must prefer a name from the known character roster; when unsure you may omit it, but do not invent a name.",
      "3. When a key resource is destroyed, consumed, lost, or exposed early, the risk is at least medium.",
      "4. Changes that affect later volume-level planning, setup/payoff, or the protagonist's action boundaries are at least medium risk.",
      "5. Put clear continuity problems into continuityRisks, e.g. using something never obtained, reusing something already consumed, or treating something as foreshadowed when the reader does not yet know it.",
      "6. Output at most 8 entries in updates; prioritize keeping changes that affect action boundaries, setup/payoff, or resource ownership across chapters.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: Chapter ${input.chapterOrder} "${input.chapterTitle}"`,
      "",
      "Known characters:",
      input.rosterText,
      "",
      "Existing character-resource ledger summary:",
      input.existingResourceText || "No existing key resources yet.",
      "",
      "Chapter body:",
      input.chapterContent,
    ].join("\n")),
  ],
};

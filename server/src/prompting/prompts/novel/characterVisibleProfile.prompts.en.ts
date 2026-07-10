import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { characterVisibleProfileOutputSchema } from "./characterVisibleProfile.promptSchemas";
import type { CharacterVisibleProfilePromptInput } from "./characterVisibleProfile.prompts";

/**
 * English variant of `novel.character.visible_profile.complete@v1`.
 *
 * Domain-aware rewrite for English-language fiction — NOT a literal string swap
 * of the zh anchor. Reuses the zh anchor's `outputSchema` (JSON shape is
 * language-independent) and input type; `contextPolicy` is copied verbatim.
 * Registered alongside the zh anchor; the runner swaps to this variant only when
 * `options.locale === "en"`.
 */

export const novelCharacterVisibleProfileCompletePromptEn: PromptAsset<
  CharacterVisibleProfilePromptInput,
  z.infer<typeof characterVisibleProfileOutputSchema>
> = {
  id: "novel.character.visible_profile.complete",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: characterVisibleProfileOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a top-tier long-form novelist and character-styling editor.",
      "Your task is to complete a stable outward-appearance profile for a character in the novel, so later body text can more easily portray a person the reader recognizes at a glance.",
      "",
      "Output only a single valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "The output structure is fixed as:",
      "{",
      '  "appearance": "memorable look features",',
      '  "physique": "build, sense of age, baseline physical condition",',
      '  "attireStyle": "usual attire or identity-related look",',
      '  "signatureDetail": "a signature object, gesture, or detail the reader can remember",',
      '  "voiceTexture": "vocal quality, speech rhythm, tone characteristics",',
      '  "presenceImpression": "the immediate impression the reader gets on a first or typical entrance",',
      '  "confidence": 0.86,',
      '  "warnings": []',
      "}",
      "",
      "Hard rules:",
      "1. All content must be written in English.",
      "2. Only complete stable outward-appearance profiles; do not write temporary injuries, temporary costume changes, current-chapter mood, brief fatigue, or one-off states.",
      "3. Each field must directly help body-text description or character recognition; ban empty phrases like \"very good-looking\", \"cool and aloof aura\", \"highly recognizable\", or \"well-proportioned figure\".",
      "4. Do not overwrite explicit settings already in the input; if existing content is clear, extend it in the same direction to make it more writable rather than overturning it.",
      "5. The appearance profile must serve the genre, the character's functional role, relationship tension, and the book-level promise; it must not be just a static character-sheet catalog.",
      "6. Do not write personality analysis, plot summary, or growth-arc analysis into the appearance fields.",
      "7. If the author gave a completion preference, absorb it into the appearance direction first; but do not violate the given genre, identity, world rules, or explicit character profile.",
      "",
      "Quality requirements:",
      "1. appearance should include visualizable memory hooks, such as a concrete combination of brow and eyes, skin tone, hairstyle, and habitual expression.",
      "2. physique should include build, sense of age, movement posture, or physical baseline, but must not read like a stat sheet.",
      "3. attireStyle should reflect a stable dressing tendency drawn from identity, class, occupation, worldview, or living condition.",
      "4. signatureDetail should be able to recur lightly throughout the body text — a stable detail such as an object, gesture, micro-action, scent, scar, or grooming habit.",
      "5. voiceTexture should make the character's dialogue easier to tell apart, including vocal timbre, sentence rhythm, or verbal tics.",
      "6. presenceImpression should describe the reader's immediate sense of pressure, closeness, danger, comedy, or distance on first or typical sight of this person.",
      "",
      "warnings records points that are under-informed, may conflict with existing material, or can only be conservatively inferred; output an empty array if there are none.",
      "The output must strictly conform to characterVisibleProfileOutputSchema.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Genre/category: ${input.genreName}`,
      `Project mode: ${input.projectMode}`,
      "",
      "Story mode:",
      input.storyModeBlock || "None",
      "",
      "Book-level promise:",
      input.bookContractText || "None",
      "",
      "This book's world context:",
      input.worldContextText || "None",
      "",
      "Series bible:",
      input.bibleText || "None",
      "",
      "Development direction / macro constraints:",
      input.storyMacroText || "None",
      "",
      `Character: ${input.characterName} (${input.characterRole})`,
      `Character function: ${input.characterFunction || "None"}`,
      `Relation to protagonist: ${input.relationToProtagonist || "None"}`,
      "",
      "Current character profile:",
      input.existingCharacterProfile || "None",
      "",
      "Existing appearance profile:",
      input.existingVisibleProfile || "None",
      "",
      "Character relationships:",
      input.relationText || "None",
      "",
      "Author's completion preference:",
      input.userGuidance || "None",
    ].join("\n")),
  ],
};

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import {
  novelProductionCharacterSchema,
  type NovelProductionCharactersPromptInput,
} from "./production.prompts";

/**
 * English variant of `novel.production.characters@v1`.
 *
 * Domain-aware rewrite for English-language long-form fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema` (JSON
 * shape is language-independent), input type, and `contextPolicy`. Registered
 * alongside the zh anchor; the runner swaps to this variant only when
 * `options.locale === "en"`.
 */
export const novelProductionCharactersPromptEn: PromptAsset<
  NovelProductionCharactersPromptInput,
  z.infer<typeof novelProductionCharacterSchema>
> = {
  id: "novel.production.characters",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: novelProductionCharacterSchema,
  render: (input) => [
    new SystemMessage([
      "You are a core-character designer for long-form English-language novels.",
      `Your task is to generate exactly ${input.desiredCount} core characters for this novel, ready to feed directly into later creation and production stages.`,
      "",
      "Return only a valid JSON array; do not output Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "[Structure rules]",
      `1. You must output exactly ${input.desiredCount} characters — no more and no fewer.`,
      "2. Each object in the array must contain exactly these fields and no others: name, role, personality, background, development, currentState, currentGoal.",
      "3. Do not add fields, remove fields, or rename fields.",
      "",
      "[Global hard rules]",
      "1. All field values must be written in English.",
      "2. Characters must be generated from the given title, synopsis, genre, narrative POV, style/tone, and world context; do not drift away from this information.",
      '3. This is "core character" design; do not generate pure walk-ons, plot-device characters, or one-time-appearance roles.',
      "4. Every character must have a clear role in the mainline, the main conflict, relationship tension, or the core selling point.",
      "5. The characters together must form a writable character system, not a few unrelated character cards.",
      "",
      "[Character-design rules]",
      "1. name: should read like a real, usable novel character name, distinctive; no placeholders or generic labels.",
      "2. role: state the character's narrative function and positioning in the story, not just an occupation or identity label.",
      '3. personality: must be concrete, showing the character\'s core temperament, outward traits, and behavioral tendencies; avoid empty phrases like "complex personality" or "vivid character".',
      "4. background: state the part of the character's origin, history, or position that most affects the current story; do not expand into a full biography.",
      "5. development: must convey the character's growth path, direction of change, or possible staged shifts; do not merely repeat personality.",
      "6. currentState: must state what predicament, relationship position, psychological state, or situation the character is currently in, ready to write from immediately.",
      "7. currentGoal: must state the character's most immediate current goal, not a vague life ideal.",
      "",
      "[Cast rules]",
      "1. The generated cast should collectively cover key positions such as protagonist drive, opposing pressure, relationship pull, supporting backup, value mirror, or world-side function.",
      "2. Do not let multiple characters carry entirely duplicate functions; avoid a homogeneous cast.",
      "3. If the genre, POV, or tone naturally limits the number or types of characters, still make the most reasonable core configuration within that limit.",
      "4. Character design must serve long-form progression, not just the opening.",
      "",
      "[Style requirements]",
      "1. Expression must be concrete, clear, and ready to enter the creation pipeline directly.",
      '2. Do not use empty clichés like "very charming", "fully fleshed out", or "obvious growth".',
      "3. The fields must be consistent with one another and must not conflict.",
      "",
      "[Gap-handling rules]",
      "1. If input is insufficient, you may complete reasonably with low-risk choices that fit the genre and tone.",
      "2. Do not fabricate overly specific but unfounded complex world rules or long stretches of historical detail.",
    ].join("\n")),
    new HumanMessage([
      `Novel title: ${input.title}`,
      `Novel synopsis: ${input.description}`,
      `Genre: ${input.genre}`,
      `Narrative POV: ${input.narrativePov}`,
      `Style and tone: ${input.styleTone}`,
      `World context: ${input.worldContext}`,
    ].join("\n\n")),
  ],
};

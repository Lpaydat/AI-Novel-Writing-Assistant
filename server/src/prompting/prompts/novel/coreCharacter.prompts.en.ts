import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import {
  characterEvolutionOutputSchema,
  characterWorldCheckOutputSchema,
} from "../../../services/novel/novelCoreSchemas";
import type {
  CharacterEvolutionPromptInput,
  CharacterWorldCheckPromptInput,
} from "./coreCharacter.prompts";

/**
 * English variants of the core-character prompts (`novel.character.evolve@v1`
 * and `novel.character.worldCheck@v1`).
 *
 * Domain-aware rewrites for English-language fiction — NOT literal string swaps
 * of the zh anchors. Each variant reuses its zh anchor's `outputSchema` (JSON
 * shape is language-independent) and input type; `contextPolicy` is copied
 * verbatim. Registered alongside the zh anchors; the runner swaps to a variant
 * only when `options.locale === "en"`.
 */

export const novelCharacterEvolvePromptEn: PromptAsset<
  CharacterEvolutionPromptInput,
  z.infer<typeof characterEvolutionOutputSchema>
> = {
  id: "novel.character.evolve",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: characterEvolutionOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-development editor for long-form fiction.",
      "Your task is to update the character's current-stage state based on existing settings and timeline events, keeping it consistent with the plot's progression and directly usable for later writing.",
      "",
      "Output only a single valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "The output structure is fixed as:",
      "{",
      '  "personality": "updated personality",',
      '  "background": "updated background information (optional)",',
      '  "development": "updated growth trajectory",',
      '  "currentState": "the character\'s current state",',
      '  "currentGoal": "the character\'s current goal"',
      "}",
      "",
      "Global hard rules:",
      "1. All content must be written in English.",
      "2. Update only based on the given series bible, existing settings, timeline events, and retrieved supplements; do not fabricate major settings or experiences that have not appeared.",
      "3. If information is insufficient, make a conservative update and avoid over-inference.",
      "4. The fields must be self-consistent; personality, motivation, and state must not contradict one another.",
      "",
      "Update principles:",
      "1. This output is a \"state evolution\", not a rewrite of the character setting; it should reflect change rather than overwrite the original setting.",
      "2. Prioritize reflecting how timeline events affect the character, such as personality drift, stance changes, relationship impact, psychological change, or the cost paid after using an ability.",
      "3. Every change must have a causal source; no abrupt jumps.",
      "4. If the character has not changed noticeably, reflect a \"stable but slightly shifted\" state rather than forcing a change.",
      "",
      "Field requirements:",
      "1. personality: evolve from the original personality and reflect the trend of change (reinforcement, drift, distortion, loosening, etc.), rather than rewriting it entirely.",
      "2. background: update only when there is genuinely new information or a shift in understanding; otherwise add a light touch or keep the original framework.",
      "3. development: update the growth trajectory to reflect stage progression or a turning point, not a repeat of the old stage.",
      "4. currentState: must concretely state the character's current circumstance, psychological state, relational position, or ability status; do not write it as an abstract description.",
      "5. currentGoal: must be directly related to the current situation and reflect the character's clear next action direction, not a long-term ideal.",
      "",
      "Style requirements:",
      "1. Be concrete, clear, and usable for writing; do not use vague summaries like \"more mature\" or \"grows complicated\".",
      "2. Avoid restating the input; integrate and update it.",
      "3. The text should read like a \"state description that can be fed directly into downstream generation modules\", not a character-analysis report.",
      "",
      "The output must strictly conform to characterEvolutionOutputSchema.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      "",
      "Series bible:",
      input.bibleContent,
      "",
      `Character: ${input.characterName} (${input.characterRole})`,
      "",
      "Existing settings:",
      `personality=${input.personality}`,
      `background=${input.background}`,
      `development=${input.development}`,
      `currentState=${input.currentState}`,
      `currentGoal=${input.currentGoal}`,
      "",
      "Timeline events:",
      input.timelineText,
      "",
      "Retrieved supplements:",
      input.ragContext || "None",
    ].join("\n")),
  ],
};

export const novelCharacterWorldCheckPromptEn: PromptAsset<
  CharacterWorldCheckPromptInput,
  z.infer<typeof characterWorldCheckOutputSchema>
> = {
  id: "novel.character.worldCheck",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: characterWorldCheckOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-setting auditor for long-form fiction.",
      "Your task is to check whether the character setting is consistent with the given world rules and output a structured audit result.",
      "",
      "Output only a single valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "The output structure is fixed as:",
      "{",
      '  "status": "pass|warn|error",',
      '  "warnings": ["..."],',
      '  "issues": [',
      "    {",
      '      "severity": "warn|error",',
      '      "message": "...",',
      '      "suggestion": "..."',
      "    }",
      "  ]",
      "}",
      "",
      "Global rules:",
      "1. All content must be written in English.",
      "2. Audit only based on the given world rules and character setting; do not add settings that were not provided.",
      "3. Every judgment must have a basis; do not speculate out of thin air or exaggerate a problem.",
      "4. Do not output vague issues such as \"the setting feels a bit thin\" or \"it could be richer\".",
      "",
      "Audit dimensions:",
      "1. World consistency: whether the character's abilities, identity, resources, and behavioral boundaries conform to the world rules.",
      "2. Rule violations: whether there are breaches of world rules, broken limits, or unexplained exceptions.",
      "3. Plausibility: whether the character's background, development, and current state match the world setting.",
      "4. Causal consistency: whether there is a gap or abrupt jump between the character's current state and their development trajectory.",
      "",
      "status determination rules:",
      "1. pass: no obvious problems found, or only extremely minor detail issues that do not affect overall consistency.",
      "2. warn: there are potential inconsistencies, ambiguities, or points that could cause later problems, but they do not yet amount to a serious conflict.",
      "3. error: there are clear conflicts, clashing settings, rule violations, or issues that cannot be made self-consistent.",
      "",
      "issues rules:",
      "1. Each issue must include severity, message, and suggestion.",
      "2. message must concretely state \"where it is inconsistent / conflicting / implausible\".",
      "3. suggestion must give an actionable fix, not a generic recommendation.",
      "4. severity may only be warn or error, and must match the severity of the problem.",
      "",
      "warnings rules:",
      "1. warnings are used to record lighter issues or potential risk points.",
      "2. Keep them concise and do not repeat information already in issues.",
      "",
      "Consistency rules:",
      "1. status must be consistent with the most severe severity among issues (if any error exists, status must be error).",
      "2. If there are no obvious problems, issues may be an empty array, but you should still give a brief, reasonable conclusion.",
      "3. Do not manufacture problems just to reach a count.",
      "",
      "The output must strictly conform to characterWorldCheckOutputSchema.",
    ].join("\n")),
    new HumanMessage([
      "World rules:",
      input.worldContext,
      "",
      "Character setting:",
      `name=${input.characterName}`,
      `role=${input.characterRole}`,
      `personality=${input.personality}`,
      `background=${input.background}`,
      `development=${input.development}`,
      `currentState=${input.currentState}`,
      `currentGoal=${input.currentGoal}`,
    ].join("\n")),
  ],
};

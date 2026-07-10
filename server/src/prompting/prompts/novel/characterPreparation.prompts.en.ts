import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import {
  characterCastAutoResponseSchema,
  characterCastOptionResponseSchema,
  supplementalCharacterGenerationResponseSchema,
} from "./characterPreparation.promptSchemas";
import type {
  CharacterCastAutoNormalizePromptInput,
  CharacterCastAutoPromptInput,
  CharacterCastAutoRepairPromptInput,
  CharacterCastOptionNormalizePromptInput,
  CharacterCastOptionPromptInput,
  CharacterCastOptionRepairPromptInput,
  SupplementalCharacterNormalizePromptInput,
  SupplementalCharacterPromptInput,
} from "./characterPreparation.prompts";

/**
 * English variants of the `novel.character.cast*` / `novel.character.supplemental*`
 * character-preparation prompts.
 *
 * Domain-aware rewrites for English-language serialized fiction — NOT literal
 * string swaps of the zh anchors. Each variant reuses its zh anchor's
 * `outputSchema` (JSON shape is language-independent) and input type. Registered
 * alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 *
 * The `*.zhNormalize` anchors normalize model output to Chinese-language
 * conventions; their English analogues below normalize to natural English
 * naming/formatting conventions instead.
 *
 * The JSON response templates are language-independent (English field names,
 * placeholder "string" values, English enum samples), so they are re-declared
 * verbatim here rather than importing zh-file locals.
 */

const CHARACTER_CAST_OPTION_RESPONSE_TEMPLATE = `{
  "options": [
    {
      "title": "string",
      "summary": "string",
      "whyItWorks": "string",
      "recommendedReason": "string",
      "members": [
        {
          "name": "string",
          "role": "string",
          "gender": "male",
          "castRole": "protagonist",
          "relationToProtagonist": "string",
          "storyFunction": "string",
          "shortDescription": "string",
          "personality": "string",
          "background": "string",
          "development": "string",
          "identityLabel": "string",
          "factionLabel": "string",
          "stanceLabel": "string",
          "powerLevel": "string",
          "realm": "string",
          "currentLocation": "string",
          "availability": "string",
          "prohibitions": ["string"],
          "outerGoal": "string",
          "innerNeed": "string",
          "fear": "string",
          "wound": "string",
          "misbelief": "string",
          "secret": "string",
          "moralLine": "string",
          "firstImpression": "string"
        }
      ],
      "relations": [
        {
          "sourceName": "string",
          "targetName": "string",
          "surfaceRelation": "string",
          "hiddenTension": "string",
          "conflictSource": "string",
          "secretAsymmetry": "string",
          "dynamicLabel": "string",
          "nextTurnPoint": "string"
        }
      ]
    }
  ]
}`;

const CHARACTER_CAST_AUTO_RESPONSE_TEMPLATE = `{
  "option": {
    "title": "string",
    "summary": "string",
    "whyItWorks": "string",
    "recommendedReason": "string",
    "members": [
      {
        "name": "string",
        "role": "string",
        "gender": "male",
        "castRole": "protagonist",
        "relationToProtagonist": "string",
        "storyFunction": "string",
        "shortDescription": "string",
        "personality": "string",
        "background": "string",
        "development": "string",
        "identityLabel": "string",
        "factionLabel": "string",
        "stanceLabel": "string",
        "powerLevel": "string",
        "realm": "string",
        "currentLocation": "string",
        "availability": "string",
        "prohibitions": ["string"],
        "outerGoal": "string",
        "innerNeed": "string",
        "fear": "string",
        "wound": "string",
        "misbelief": "string",
        "secret": "string",
        "moralLine": "string",
        "firstImpression": "string"
      }
    ],
    "relations": [
      {
        "sourceName": "string",
        "targetName": "string",
        "surfaceRelation": "string",
        "hiddenTension": "string",
        "conflictSource": "string",
        "secretAsymmetry": "string",
        "dynamicLabel": "string",
        "nextTurnPoint": "string"
      }
    ]
  }
}`;

const SUPPLEMENTAL_CHARACTER_RESPONSE_TEMPLATE = `{
  "mode": "linked",
  "recommendedCount": 2,
  "planningSummary": "string",
  "candidates": [
    {
      "name": "string",
      "role": "string",
      "gender": "female",
      "castRole": "ally",
      "summary": "string",
      "storyFunction": "string",
      "relationToProtagonist": "string",
      "personality": "string",
      "background": "string",
      "development": "string",
      "identityLabel": "string",
      "factionLabel": "string",
      "stanceLabel": "string",
      "powerLevel": "string",
      "realm": "string",
      "currentLocation": "string",
      "availability": "string",
      "prohibitions": ["string"],
      "outerGoal": "string",
      "innerNeed": "string",
      "fear": "string",
      "wound": "string",
      "misbelief": "string",
      "secret": "string",
      "moralLine": "string",
      "firstImpression": "string",
      "currentState": "string",
      "currentGoal": "string",
      "whyNow": "string",
      "relations": [
        {
          "sourceName": "string",
          "targetName": "string",
          "surfaceRelation": "string",
          "hiddenTension": "string",
          "conflictSource": "string",
          "dynamicLabel": "string",
          "nextTurnPoint": "string"
        }
      ]
    }
  ]
}`;

export const novelCharacterCastOptionsPromptEn: PromptAsset<
  CharacterCastOptionPromptInput,
  z.infer<typeof characterCastOptionResponseSchema>
> = {
  id: "novel.character.castOptions",
  version: "v2",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
    requiredGroups: ["idea_seed", "protagonist_anchor", "output_policy"],
    preferredGroups: [
      "hidden_identity_anchor",
      "project_context",
      "book_contract",
      "macro_constraints",
      "world_stage",
      "forbidden_names",
    ],
  },
  repairPolicy: {
    maxAttempts: 2,
  },
  outputSchema: characterCastOptionResponseSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are a character-cast planner for long-form serialized fiction, serving novice users who do not know the writing workflow.",
      "Your job is to produce, for the current novel, a core character cast that can go straight into body-text planning — not to emit an abstract network of narrative functions.",
      "",
      "Return only strict JSON — no Markdown, explanations, comments, code blocks, or extra text.",
      `You must output exactly ${input.optionCount} cast options — no fewer and no more than ${input.optionCount}.`,
      "",
      "[Structure hard rules]",
      "1. You must strictly follow the given JSON structure.",
      "2. Field names must stay in English; field values must be written in natural English.",
      "3. Each option must contain 3-6 members and 2-12 relations.",
      "4. Every character must output gender; the only allowed values are male, female, other, unknown.",
      "5. castRole may only be one of: protagonist, antagonist, ally, foil, mentor, love_interest, pressure_source, catalyst.",
      "6. Every character must output personality, background, and development — do not provide only shortDescription.",
      "7. Every character must output the hard-fact fields: identityLabel, factionLabel, stanceLabel, powerLevel, realm, currentLocation, availability, prohibitions; when unsure you may use an empty string or empty array, but do not fabricate major facts beyond the book-level settings.",
      "",
      "[Naming hard rules]",
      "1. name may only be a real character name, stable form of address, historical office title, court title, jianghu epithet, or faction-identity title that can be used directly in the body text.",
      "2. Never write function words into name, e.g. 'mystery catalyst', 'knowledge-mentor slot', 'external-threat slot', 'romance slot', 'relationship variable', 'function slot'.",
      "3. storyFunction is where the narrative duty goes; name must not carry a functional description.",
      "4. Within a single option, the character names must be distinguishable from one another; do not produce a batch of abstract template labels.",
      "",
      "[Cast quality requirements]",
      "1. Every option must have a clear protagonist anchor; the protagonist must not be written as a function slot.",
      "2. If the story has a hidden identity, a true historical name, a disguised identity, or an endgame identity reversal, the cast must explicitly carry that thread.",
      "3. Every option must express real interpersonal dynamics, pressure sources, growth costs, and long-term conflict — not a pile of character spec sheets.",
      "4. Within a single option, do not let multiple characters carry almost the same storyFunction.",
      "5. The cast must be able to sustain long-form progression, not just serve a one-off opening hook.",
      "6. Character hard facts should first carry the genre settings and faction relations — identity, faction, cultivation realm/combat power, current availability — so later body text does not get faction, cultivation, or identity backwards.",
      "",
      "[Genre constraints]",
      "If the context is a historical, time-travel, court, officialdom, or rigid-institution setting, the cast must reflect era-specific status, institutional oppression, power hierarchies, and status contrasts — it must not degrade into a generic function network.",
      "",
      "[Expression requirements]",
      "1. Every description must be concrete; avoid empty phrases like 'vivid characters', 'complex relationships', or 'drives the plot'.",
      "2. Except for summary, whyItWorks, and recommendedReason, keep the other text fields to short sentences or short phrases.",
      "3. If you are unsure about gender, fill in unknown; leaving it blank is not allowed.",
      "",
      "The fixed template is as follows:",
      CHARACTER_CAST_OPTION_RESPONSE_TEMPLATE,
    ].join("\n")),
    new HumanMessage([
      "Generate character-cast options based on the following context.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Output requirements]",
      `- Output exactly ${input.optionCount} options`,
      "- name must be a usable in-story character name or stable form of address",
      "- storyFunction carries the function; name must not be written as a function slot",
      "- every character must include gender",
      "- output strict JSON only",
    ].join("\n")),
  ],
};

export const novelCharacterCastOptionsRepairPromptEn: PromptAsset<
  CharacterCastOptionRepairPromptInput,
  z.infer<typeof characterCastOptionResponseSchema>
> = {
  id: "novel.character.castOptions.repair",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: characterCastOptionResponseSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are a character-planning repair editor for serialized fiction, responsible for correcting an already-generated but substandard character-cast JSON into a version that can be stored directly.",
      "You may only fix the content; do not change the overall story direction.",
      "",
      "Output only one valid JSON object — no Markdown, explanations, comments, or extra text.",
      "",
      "Hard rules:",
      "1. You must preserve the original JSON's outermost structure and the number of options.",
      "2. You may rewrite the content of title, summary, members, and relations, but you must not delete an option, nor change the 3 options into any other count.",
      "3. You must fix every function-slot-style character name, turning them into real, usable character names or stable forms of address.",
      "4. Every character must have gender; the only allowed values are male, female, other, unknown.",
      "5. All display text must be natural, fluent English; do not leave conspicuous fragments from other languages.",
      "6. You must keep the same story direction, protagonist anchor, core conflict, and hidden-identity clues; do not rewrite it into a different book.",
      "",
      "Key repair principles:",
      "1. name must no longer contain abstract slot labels like 'so-and-so slot', 'catalyst', 'threat source', 'function slot', or 'relationship variable'.",
      "2. If the context contains the protagonist's current identity or hidden-identity clues, at least make the protagonist's option explicitly carry those clues.",
      "3. Within a single option, avoid multiple characters carrying the same story function.",
    ].join("\n")),
    new HumanMessage([
      "The JSON below needs to be repaired.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Failure reasons]",
      input.failureReasons.map((reason, index) => `${index + 1}. ${reason}`).join("\n") || "Not provided",
      "",
      "[JSON to repair]",
      input.payloadJson,
      "",
      "Output the complete repaired JSON.",
    ].join("\n")),
  ],
};

export const novelCharacterCastOptionsZhNormalizePromptEn: PromptAsset<
  CharacterCastOptionNormalizePromptInput,
  z.infer<typeof characterCastOptionResponseSchema>
> = {
  id: "novel.character.castOptions.zhNormalize",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: characterCastOptionResponseSchema,
  render: (input) => [
    new SystemMessage([
      "You are a fiction character-planning editor responsible for language normalization of character-cast JSON.",
      "Your job is to rewrite every user-facing text value into natural, fluent, immediately readable English.",
      "",
      "Output only one valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "Structure hard rules:",
      "1. You must strictly preserve the original JSON structure, field names, nesting, and array lengths.",
      "2. Do not add, remove, rename, or reorder fields.",
      "3. Do not add or remove array elements; you may only rewrite content.",
      "",
      "Content rewrite rules:",
      "1. All display text must be rewritten into natural English.",
      "2. Preserve the original meaning, relationship semantics, and character function; do not change the setting logic.",
      "3. The castRole and gender enum values must stay exactly as-is; do not translate or rewrite them.",
      "4. Existing character names and forms of address should stay stable; do not change names arbitrarily.",
      "5. Do not add new plot, world settings, or relations.",
    ].join("\n")),
    new HumanMessage(
      `Rewrite all user-facing text values in the JSON below into natural English while keeping the structure and meaning unchanged:\n${input.payloadJson}`,
    ),
  ],
};

export const novelCharacterCastAutoPromptEn: PromptAsset<
  CharacterCastAutoPromptInput,
  z.infer<typeof characterCastAutoResponseSchema>
> = {
  id: "novel.character.castAuto",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
    requiredGroups: ["idea_seed", "protagonist_anchor", "output_policy"],
    preferredGroups: [
      "hidden_identity_anchor",
      "project_context",
      "book_contract",
      "macro_constraints",
      "world_stage",
      "forbidden_names",
    ],
  },
  repairPolicy: {
    maxAttempts: 2,
  },
  outputSchema: characterCastAutoResponseSchema,
  render: (_input, context) => [
    new SystemMessage([
      "You are a character-cast planner for long-form serialized fiction, serving novice users who do not know the writing workflow.",
      "Your job is to directly produce 1 core character cast that can be auto-persisted and go straight into body-text planning — not to offer multiple candidate options.",
      "",
      "Return only strict JSON — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "[Structure hard rules]",
      "1. You must strictly follow the given JSON structure.",
      "2. Field names must stay in English; field values must be written in natural English.",
      "3. The cast must contain 3-6 members and 2-12 relations.",
      "4. Every character must output gender; the only allowed values are male, female, other, unknown.",
      "5. castRole may only be one of: protagonist, antagonist, ally, foil, mentor, love_interest, pressure_source, catalyst.",
      "6. Every character must output personality, background, and development — do not provide only shortDescription.",
      "7. Every character must output the hard-fact fields: identityLabel, factionLabel, stanceLabel, powerLevel, realm, currentLocation, availability, prohibitions; when unsure you may use an empty string or empty array, but do not fabricate major facts beyond the book-level settings.",
      "",
      "[Naming hard rules]",
      "1. name may only be a real character name, stable form of address, historical office title, court title, jianghu epithet, or faction-identity title that can be used directly in the body text.",
      "2. Never write function words into name, e.g. 'mystery catalyst', 'knowledge-mentor slot', 'external-threat slot', 'romance slot', 'relationship variable', 'function slot'.",
      "3. storyFunction is where the narrative duty goes; name must not carry a functional description.",
      "4. Within this single cast, the character names must be distinguishable from one another; do not produce a batch of abstract template labels.",
      "",
      "[Cast quality requirements]",
      "1. There must be a clear protagonist anchor; the protagonist must not be written as a function slot.",
      "2. If the story has a hidden identity, a true historical name, a disguised identity, or an endgame identity reversal, the cast must explicitly carry that thread.",
      "3. Relations must express real character dynamics, pressure sources, growth costs, and long-term conflict — not a pile of character spec sheets.",
      "4. Do not let multiple characters carry almost the same storyFunction.",
      "5. This cast must be able to sustain long-form progression, not just serve a one-off opening hook.",
      "6. Character hard facts should first carry the genre settings and faction relations — identity, faction, cultivation realm/combat power, current availability — so later body text does not get faction, cultivation, or identity backwards.",
      "",
      "[Genre constraints]",
      "If the context is a historical, time-travel, court, officialdom, or rigid-institution setting, the cast must reflect era-specific status, institutional oppression, power hierarchies, and status contrasts — it must not degrade into a generic function network.",
      "",
      "[Expression requirements]",
      "1. Every description must be concrete; avoid empty phrases like 'vivid characters', 'complex relationships', or 'drives the plot'.",
      "2. Except for summary, whyItWorks, and recommendedReason, keep the other text fields to short sentences or short phrases.",
      "3. If you are unsure about gender, fill in unknown; leaving it blank is not allowed.",
      "",
      "The fixed template is as follows:",
      CHARACTER_CAST_AUTO_RESPONSE_TEMPLATE,
    ].join("\n")),
    new HumanMessage([
      "Generate the character cast that the auto-director will adopt directly, based on the following context.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Output requirements]",
      "- output only 1 character cast",
      "- name must be a usable in-story character name or stable form of address",
      "- storyFunction carries the function; name must not be written as a function slot",
      "- every character must include gender",
      "- output strict JSON only",
    ].join("\n")),
  ],
};

export const novelCharacterCastAutoRepairPromptEn: PromptAsset<
  CharacterCastAutoRepairPromptInput,
  z.infer<typeof characterCastAutoResponseSchema>
> = {
  id: "novel.character.castAuto.repair",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: characterCastAutoResponseSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are a character-planning repair editor for serialized fiction, responsible for correcting an already-generated but substandard character-cast JSON into a version that can be stored directly.",
      "You may only fix the content; do not change the overall story direction.",
      "",
      "Output only one valid JSON object — no Markdown, explanations, comments, or extra text.",
      "",
      "Hard rules:",
      "1. You must preserve the original JSON's outermost structure and the single option object.",
      "2. You may rewrite the content of title, summary, members, and relations, but you must not turn it into multiple options.",
      "3. You must fix every function-slot-style character name, turning them into real, usable character names or stable forms of address.",
      "4. Every character must have gender; the only allowed values are male, female, other, unknown.",
      "5. All display text must be natural, fluent English; do not leave conspicuous fragments from other languages.",
      "6. You must keep the same story direction, protagonist anchor, core conflict, and hidden-identity clues; do not rewrite it into a different book.",
      "",
      "Key repair principles:",
      "1. name must no longer contain abstract slot labels like 'so-and-so slot', 'catalyst', 'threat source', 'function slot', or 'relationship variable'.",
      "2. If the context contains the protagonist's current identity or hidden-identity clues, at least make the protagonist's option explicitly carry those clues.",
      "3. Within this single cast, avoid multiple characters carrying the same story function.",
    ].join("\n")),
    new HumanMessage([
      "The JSON below needs to be repaired.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Failure reasons]",
      input.failureReasons.map((reason, index) => `${index + 1}. ${reason}`).join("\n") || "Not provided",
      "",
      "[JSON to repair]",
      input.payloadJson,
      "",
      "Output the complete repaired JSON.",
    ].join("\n")),
  ],
};

export const novelCharacterCastAutoZhNormalizePromptEn: PromptAsset<
  CharacterCastAutoNormalizePromptInput,
  z.infer<typeof characterCastAutoResponseSchema>
> = {
  id: "novel.character.castAuto.zhNormalize",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: characterCastAutoResponseSchema,
  render: (input) => [
    new SystemMessage([
      "You are a fiction character-planning editor responsible for language normalization of character-cast JSON.",
      "Your job is to rewrite every user-facing text value into natural, fluent, immediately readable English.",
      "",
      "Output only one valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "Structure hard rules:",
      "1. You must strictly preserve the original JSON structure, field names, nesting, and object order.",
      "2. Do not add, remove, rename, or reorder fields.",
      "3. Do not produce a second option; you may only rewrite the content of the existing option.",
      "",
      "Content rewrite rules:",
      "1. All display text must be rewritten into natural English.",
      "2. Preserve the original meaning, relationship semantics, and character function; do not change the setting logic.",
      "3. The castRole and gender enum values must stay exactly as-is; do not translate or rewrite them.",
      "4. Existing character names and forms of address should stay stable; do not change names arbitrarily.",
      "5. Do not add new plot, world settings, or relations.",
    ].join("\n")),
    new HumanMessage(
      `Rewrite all user-facing text values in the JSON below into natural English while keeping the structure and meaning unchanged:\n${input.payloadJson}`,
    ),
  ],
};

export const novelCharacterSupplementalPromptEn: PromptAsset<
  SupplementalCharacterPromptInput,
  z.infer<typeof supplementalCharacterGenerationResponseSchema>
> = {
  id: "novel.character.supplemental",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: supplementalCharacterGenerationResponseSchema,
  render: (_input, context) => [
    new SystemMessage([
      "You are a supplemental-character planner for a long-form fiction project.",
      "Your job is not to rebuild the whole cast, but to precisely fill gaps in character pressure, emotional tension, relationship pull, or narrative function on top of the existing character system.",
      "",
      "Return only strict JSON — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "Hard rules:",
      "1. Candidate characters must be directly usable in the body text; do not write them as functional placeholders.",
      "2. Every candidate must output gender; when unsure use unknown; do not omit it.",
      "3. All display text values must be in natural, fluent English.",
      "4. Do not reuse any existing character name listed in forbidden names.",
      "5. castRole may only be one of: protagonist, antagonist, ally, foil, mentor, love_interest, pressure_source, catalyst.",
      "6. Every candidate must output personality, background, development, and the hard-fact fields: identityLabel, factionLabel, stanceLabel, powerLevel, realm, currentLocation, availability, prohibitions.",
      "",
      "Gap-filling requirements:",
      "1. Candidates must genuinely fill gaps in the existing cast, not mechanically recreate another same-function slot.",
      "2. When mode=linked, prioritize forming sustainable relationship progression; when mode=independent, prioritize taking on an independent but high-value story duty.",
      "3. The result must serve long-form progression, not be a one-off utility character.",
      "4. Hard facts must help later body text avoid getting identity, faction, cultivation realm, location, or availability wrong; when unsure use an empty string or empty array.",
      "",
      "The fixed template is as follows:",
      SUPPLEMENTAL_CHARACTER_RESPONSE_TEMPLATE,
    ].join("\n")),
    new HumanMessage([
      "Generate supplemental character candidates based on the following context.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Output requirements]",
      "- character names must be concrete names or stable forms of address",
      "- every character must include gender",
      "- output strict JSON only",
    ].join("\n")),
  ],
};

export const novelCharacterSupplementalZhNormalizePromptEn: PromptAsset<
  SupplementalCharacterNormalizePromptInput,
  z.infer<typeof supplementalCharacterGenerationResponseSchema>
> = {
  id: "novel.character.supplemental.zhNormalize",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: supplementalCharacterGenerationResponseSchema,
  render: (input) => [
    new SystemMessage([
      "You are a fiction character-planning editor responsible for language normalization and polishing of supplemental-character JSON.",
      "Your job is to rewrite every user-facing text value into natural, fluent, immediately readable English.",
      "",
      "Output only one valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "Structure hard rules:",
      "1. You must strictly preserve the original JSON structure, field names, nesting, and array lengths.",
      "2. Do not add, remove, rename, or reorder fields.",
      "3. Do not add or remove array elements; you may only rewrite content.",
      "",
      "Content rewrite rules:",
      "1. All display text must be rewritten into natural English.",
      "2. When rewriting you must preserve the original meaning, character function, relationship semantics, and conflict direction; do not change the setting logic.",
      "3. The castRole and gender enum values must stay exactly as-is; do not translate or rewrite them.",
      "4. Do not add new settings, plot, or relations.",
    ].join("\n")),
    new HumanMessage(
      `Rewrite all user-facing text values in the JSON below into natural English while keeping the structure and meaning unchanged:\n${input.payloadJson}`,
    ),
  ],
};

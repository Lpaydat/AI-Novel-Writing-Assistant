import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import {
  characterCastAutoMembersResponseSchema,
  characterCastAutoRelationsResponseSchema,
} from "./characterPreparation.promptSchemas";
import type {
  CharacterCastAutoMembersPromptInput,
  CharacterCastAutoRelationsPromptInput,
} from "./characterPreparation.autoFallback.prompts";

/**
 * English variants of the auto-fallback two-step cast prompts
 * (`novel.character.castAuto.members` + `novel.character.castAuto.relations`).
 *
 * Domain-aware rewrites for English-language serialized fiction — NOT literal
 * string swaps of the zh anchors. Each variant reuses its zh anchor's
 * `outputSchema` (JSON shape is language-independent) and input type. Registered
 * alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 */

export const novelCharacterCastAutoMembersPromptEn: PromptAsset<
  CharacterCastAutoMembersPromptInput,
  z.infer<typeof characterCastAutoMembersResponseSchema>
> = {
  id: "novel.character.castAuto.members",
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
    maxAttempts: 1,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: characterCastAutoMembersResponseSchema,
  render: (_input, context) => [
    new SystemMessage([
      "You are a character-cast planner for long-form serialized fiction, serving novice users who do not know the writing workflow.",
      "Your job is to first produce a directly-persistable character-member skeleton; do not generate relations at this step.",
      "",
      "Return only strict JSON — no Markdown, explanations, comments, code blocks, or extra text.",
      "The final JSON may only contain: title, summary, whyItWorks, recommendedReason, members.",
      "",
      "Hard rules:",
      "1. members must be 3-6 characters.",
      "2. There must be exactly one protagonist.",
      "3. Every character must output gender; the only allowed values are male, female, other, unknown.",
      "4. castRole may only be one of: protagonist, antagonist, ally, foil, mentor, love_interest, pressure_source, catalyst.",
      "5. name may only be a character name or stable form of address usable directly in the body text; function-slot-style names are forbidden.",
      "6. If the story has a hidden identity, a true historical name, a disguised identity, or an endgame identity reversal, the member info must explicitly carry that thread.",
      "7. Every character must output personality, background, development, and the hard-fact fields: identityLabel, factionLabel, stanceLabel, powerLevel, realm, currentLocation, availability, prohibitions.",
      "8. Do not output relations, and do not sneak a relations array into any field.",
      "",
      "Expression requirements:",
      "1. All field values must be in natural English.",
      "2. Except for summary, whyItWorks, and recommendedReason, keep the other text to short sentences or short phrases.",
      "3. storyFunction states the duty; name does not carry a functional description.",
      "4. Character hard facts should first carry identity, faction, cultivation realm/combat power, current location, and availability; when unsure use an empty string or empty array.",
    ].join("\n")),
    new HumanMessage([
      "Generate the character-member skeleton that the auto-director will adopt directly, based on the following context.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Output requirements]",
      "- output only the member skeleton, not relations",
      "- the protagonist must be unique and stable",
      "- name must be directly usable in-story",
      "- output strict JSON only",
    ].join("\n")),
  ],
  postValidate: (output) => {
    const protagonistCount = output.members.filter((member) => member.castRole === "protagonist").length;
    if (protagonistCount !== 1) {
      throw new Error(`The member skeleton must contain exactly 1 protagonist, but currently has ${protagonistCount}.`);
    }

    const seenNames = new Set<string>();
    for (const member of output.members) {
      const normalizedName = member.name.trim();
      if (seenNames.has(normalizedName)) {
        throw new Error(`The member skeleton contains a duplicate character name: ${member.name}`);
      }
      seenNames.add(normalizedName);
    }

    return output;
  },
};

export const novelCharacterCastAutoRelationsPromptEn: PromptAsset<
  CharacterCastAutoRelationsPromptInput,
  z.infer<typeof characterCastAutoRelationsResponseSchema>
> = {
  id: "novel.character.castAuto.relations",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  repairPolicy: {
    maxAttempts: 1,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: characterCastAutoRelationsResponseSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-relationship planner for long-form serialized fiction.",
      "Your job is to add directly-persistable relations based on the already-locked member roster.",
      "",
      "Return only strict JSON — no Markdown, explanations, comments, code blocks, or extra text.",
      "The final JSON may only contain relations.",
      "",
      "Hard rules:",
      "1. sourceName and targetName must reuse names from the given member roster verbatim; do not rename, add parenthetical notes, write aliases, or add new characters.",
      "2. Do not add, delete, or rewrite member settings; you are responsible only for the relationship layer.",
      "3. Every relation must connect two different characters; self-referential relations are forbidden.",
      "4. Do not output duplicate relation pairs.",
      "5. relations must express long-term relationship dynamics, conflict sources, information asymmetry, or the next turning point — no empty talk.",
      "6. The protagonist must appear in at least one relation.",
      "",
      "Expression requirements:",
      "1. All field values must be in natural English.",
      "2. Every relation must serve long-form progression, not describe a one-off event.",
    ].join("\n")),
    new HumanMessage([
      "Generate relations based on the already-locked character-member skeleton below.",
      "",
      `[Story input]\n${input.storyInput || "None"}`,
      "",
      `[Cast title]\n${input.optionTitle}`,
      "",
      `[Cast summary]\n${input.optionSummary}`,
      "",
      `[Protagonist]\n${input.protagonistName}`,
      "",
      `[Allowed character names]\n${input.memberNames.join(", ")}`,
      "",
      `[Member roster]\n${input.memberRosterText}`,
      "",
      "[Output requirements]",
      "- output only relations",
      "- names must reuse the given roster verbatim",
      "- do not add new characters or change member settings",
      "- output strict JSON only",
    ].join("\n")),
  ],
  postValidate: (output, input) => {
    const allowedNames = new Set(input.memberNames.map((name) => name.trim()).filter(Boolean));
    const seenPairs = new Set<string>();
    let protagonistLinked = false;

    for (const relation of output.relations) {
      if (!allowedNames.has(relation.sourceName) || !allowedNames.has(relation.targetName)) {
        throw new Error(`relations used an unregistered member name: ${relation.sourceName} -> ${relation.targetName}`);
      }
      if (relation.sourceName === relation.targetName) {
        throw new Error(`relations contains a self-referential relation: ${relation.sourceName}`);
      }

      const pairKey = `${relation.sourceName}=>${relation.targetName}`;
      if (seenPairs.has(pairKey)) {
        throw new Error(`relations contains a duplicate relation pair: ${pairKey}`);
      }
      seenPairs.add(pairKey);

      if (relation.sourceName === input.protagonistName || relation.targetName === input.protagonistName) {
        protagonistLinked = true;
      }
    }

    if (input.protagonistName && !protagonistLinked) {
      throw new Error(`relations must explicitly include the protagonist "${input.protagonistName}".`);
    }

    return output;
  },
};

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import type { StoryModeProfile } from "@ai-novel/shared/types/storyMode";
import {
  storyModeChildDraftListSchema,
  storyModeDraftNodeSchema,
} from "./storyMode.promptSchemas";
import type {
  StoryModeChildPromptInput,
  StoryModeTreePromptInput,
} from "./storyMode.prompts";

/**
 * English variants of the `storyMode.*` prompts (tree.generate / child.generate).
 *
 * Domain-aware rewrites for English-language web-fiction genre-mode planning —
 * NOT literal string swaps of the zh anchors. Each variant reuses its zh
 * anchor's `outputSchema` (JSON shape is language-independent), input type, and
 * (for child.generate) the same semanticRetryPolicy + postValidate behavior.
 * Registered alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 */

function formatOptionalSection(label: string, value: string): string {
  const trimmed = value.trim();
  return `${label}: ${trimmed || "none"}`;
}

function formatStoryModeProfile(profile: StoryModeProfile): string {
  return [
    `coreDrive: ${profile.coreDrive}`,
    `readerReward: ${profile.readerReward}`,
    `progressionUnits: ${profile.progressionUnits.join(", ")}`,
    `allowedConflictForms: ${profile.allowedConflictForms.join(", ")}`,
    `forbiddenConflictForms: ${profile.forbiddenConflictForms.join(", ")}`,
    `conflictCeiling: ${profile.conflictCeiling}`,
    `resolutionStyle: ${profile.resolutionStyle}`,
    `chapterUnit: ${profile.chapterUnit}`,
    `volumeReward: ${profile.volumeReward}`,
    `mandatorySignals: ${profile.mandatorySignals.join(", ")}`,
    `antiSignals: ${profile.antiSignals.join(", ")}`,
  ].join("\n");
}

function normalizeNameKey(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

export const storyModeTreePromptEn: PromptAsset<
  StoryModeTreePromptInput,
  z.infer<typeof storyModeDraftNodeSchema>
> = {
  id: "storyMode.tree.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  outputSchema: storyModeDraftNodeSchema,
  render: (input) => [
    new SystemMessage([
      "You are a senior web-fiction genre-mode strategist.",
      "Your task is to turn the user's creative direction into a two-level \"genre-mode tree\" usable for creative planning, mode constraints, and product configuration.",
      "This tree is not a simple list of labels; it must output a distinguishable, executable, reusable genre-mode structure.",
      "",
      "Return only a single valid JSON object — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "Structure rules:",
      "1. At most two levels: the top level is a genre-mode parent class, the second level is a concrete genre-mode subclass.",
      "2. Every node MUST output — and only output — these fixed keys: name, description, template, profile, children.",
      "3. Second-level nodes MUST have children set to [].",
      "4. Do not omit keys, rename keys, or add near-synonym fields.",
      "5. The whole result must be a single, clearly-structured tree — do not output multiple parallel root nodes.",
      "",
      "Node requirements:",
      "1. name: the name must be concise, stable, and usable directly as a system tag or mode name — not a long sentence or a slogan.",
      "2. description: explain the mode's core narrative traits, main source of reader payoff, conflict organization, or reader expectations — avoid empty phrases like \"very engaging\" or \"very immersive\".",
      "3. template: write the mode's most typical plot-progression template or narrative skeleton — it must be concrete at the writing level, not just an abstract concept.",
      "4. profile: must carry the real control logic; do not smuggle key rules into name or description.",
      "",
      "profile fixed structure requirement:",
      "profile MUST strictly contain these keys:",
      "coreDrive, readerReward, progressionUnits, allowedConflictForms, forbiddenConflictForms, conflictCeiling, resolutionStyle, chapterUnit, volumeReward, mandatorySignals, antiSignals.",
      "",
      "profile field explanations:",
      "1. coreDrive: the mode's most central driving force — explain why the story can keep moving forward.",
      "2. readerReward: the most stable type of satisfaction a reader gets from continuing to read this mode.",
      "3. progressionUnits: the mode's common progression units — explain what unit the plot typically rolls forward in.",
      "4. allowedConflictForms: conflict forms suited to this mode — write acceptable, high-frequency conflict types.",
      "5. forbiddenConflictForms: conflict forms unsuited to this mode that easily break the mode's experience.",
      "6. conflictCeiling: the range the mode's conflict or pressure ceiling should stay within — express the intensity boundary.",
      "7. resolutionStyle: the mode's common ways of resolving, paying off, or wrapping up.",
      "8. chapterUnit: the content unit or small-hook unit best carried at the single-chapter level.",
      "9. volumeReward: the phased reward or phased outcome that should be paid off at the volume level.",
      "10. mandatorySignals: the clear signals the mode must repeatedly give readers to lock in mode expectations.",
      "11. antiSignals: anti-signals that make readers misjudge the mode, weaken the mode's experience, or cause the mode to drift.",
      "",
      "Planning rules:",
      "1. The top-level parent handles the abstract mode direction; the second-level subclass lands on executable, concrete mode variants.",
      "2. Same-level nodes must be clearly distinguishable — not the same mode reworded.",
      "3. A subclass must be a natural subdivision under the parent's logic — do not suddenly switch the categorization dimension.",
      "4. Do not use lazy name-binding logic like \"because it is called the X mode, it must do Y\"; the constraint logic must be written into profile.",
      "5. If the user's description is vague, make a conservative, low-risk, industry-common mode summary — do not over-branch.",
      "6. The output must be directly consumable by downstream creation systems, so field content should be concrete, stable, and free of empty rhetoric.",
      "",
      "Style rules:",
      "1. Write all content in natural English.",
      "2. Array fields should use concise phrases, not long paragraph-style explanations.",
      "3. String fields must be concrete and executable, avoiding abstract boilerplate.",
      "4. The fields must be mutually consistent and must not contradict one another.",
    ].join("\n")),
    new HumanMessage([
      "Generate the root genre-mode node and its subclass drafts from the following creative direction:",
      "",
      input.prompt.trim(),
    ].join("\n")),
  ],
};

export const storyModeChildPromptEn: PromptAsset<
  StoryModeChildPromptInput,
  z.infer<typeof storyModeChildDraftListSchema>,
  z.infer<typeof storyModeChildDraftListSchema>
> = {
  id: "storyMode.child.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: storyModeChildDraftListSchema,
  render: (input) => [
    new SystemMessage([
      "You are a senior web-fiction genre-mode strategist.",
      "Your task is NOT to generate the whole tree, but — given a parent class — to fill in a set of subclass genre-mode nodes that can be attached directly under that parent.",
      "These subclass nodes must be distinguishable, executable, and ready to enter the downstream creation system directly.",
      "",
      "Return only a single valid JSON array — no Markdown, explanations, comments, code blocks, or extra text.",
      "",
      "Structure rules:",
      `1. You MUST generate exactly ${input.count} subclass nodes — do not generate the parent node, and do not produce fewer or more than requested.`,
      "2. The outermost layer must be a JSON array, and each array item is a subclass node object.",
      "3. Each node outputs — and only allows — these fixed keys: name, description, template, profile, children.",
      "4. Each node's children MUST be [] — do not keep generating grandchild nodes.",
      "5. Do not omit keys, rename keys, or add near-synonym fields.",
      "",
      "Subclass generation rules:",
      "1. Every subclass must be a natural subdivision under the given parent's logic — do not switch to a different categorization dimension.",
      "2. Continue the parent profile's core control logic, but form clear distinctions in experience structure, conflict organization, progression unit, payoff style, or narrative emphasis.",
      "3. The generated subclasses must differ noticeably from one another — not the same mode reworded.",
      "4. Do not duplicate an existing sibling node's name, do not merely restate an existing sibling, and do not output the parent itself.",
      "5. Drill down to concrete sub-modes that can be used directly — do not stop at a vague label layer.",
      "6. Even if the user's supplement is thin, still derive conservative, low-risk, industry-common subdivisions directly from the parent logic and existing siblings — do not avoid generating.",
      "7. If the parent is already very specific, the subclasses should make experience-type, organization-type, or payoff-type subdivisions without breaking the parent's logic — do not force out unnatural categories.",
      "",
      "Node requirements:",
      "1. name: the name must be concise, stable, and usable directly as a system tag — no slogans, catchphrases, or long explanatory names.",
      "2. description: explain the subclass's core narrative traits, source of payoff, conflict organization, or reader expectations — it must be concrete and avoid empty phrases.",
      "3. template: write the subclass's most typical plot-progression template or narrative skeleton — it must be concrete at the writing level, not just an abstract concept.",
      "4. profile: must carry the real control logic; do not smuggle key rules into name or description.",
      "",
      "profile fixed structure requirement:",
      "profile MUST strictly contain these keys:",
      "coreDrive, readerReward, progressionUnits, allowedConflictForms, forbiddenConflictForms, conflictCeiling, resolutionStyle, chapterUnit, volumeReward, mandatorySignals, antiSignals.",
      "",
      "profile field requirements:",
      "1. coreDrive: explain the sub-mode's most central sustained driving force.",
      "2. readerReward: explain the most stable type of satisfaction a reader gets while continuing to read.",
      "3. progressionUnits: explain what unit the plot keeps advancing in.",
      "4. allowedConflictForms: write conflict forms suited to high-frequency use.",
      "5. forbiddenConflictForms: write conflict forms that would break this mode's experience.",
      "6. conflictCeiling: state the conflict intensity or pressure ceiling clearly — do not be vague.",
      "7. resolutionStyle: state clearly the mode's common resolution or payoff style.",
      "8. chapterUnit: write the progression unit or small-hook unit best carried by a single chapter.",
      "9. volumeReward: write the phased reward or outcome that should be paid off at the volume level.",
      "10. mandatorySignals: write the stable signals that must be given to readers repeatedly.",
      "11. antiSignals: write anti-signals that make the mode drift, weaken the experience, or mislead reader expectations.",
      "",
      "Style rules:",
      "1. Write all content in natural English.",
      "2. Array fields use concise phrases, not long paragraph-style explanations.",
      "3. String fields must be concrete and executable, avoiding abstract boilerplate.",
      "4. The fields must be mutually consistent and must not contradict one another.",
      "5. The output should read like mode nodes ready to persist and configure directly, not a vague planning writeup.",
    ].join("\n")),
    new HumanMessage([
      `Current task: generate exactly ${input.count} new subclass genre-mode nodes for the parent below.`,
      "",
      `Parent name: ${input.parentName.trim()}`,
      formatOptionalSection("Parent description", input.parentDescription),
      formatOptionalSection("Parent template", input.parentTemplate),
      "Parent profile:",
      formatStoryModeProfile(input.parentProfile),
      "",
      `Existing sibling nodes: ${input.existingSiblingNames.length > 0 ? input.existingSiblingNames.join(", ") : "none"}`,
      "",
      "User's supplementary direction:",
      input.prompt?.trim() ? input.prompt.trim() : "None. Derive directly from the parent logic and existing sibling nodes.",
    ].join("\n")),
  ],
  postValidate: (output, input) => {
    if (output.length !== input.count) {
      throw new Error(`Incorrect number of genre-mode subclasses: expected ${input.count}, got ${output.length}.`);
    }

    const siblingNames = new Set(input.existingSiblingNames.map(normalizeNameKey));
    const batchNames = new Set<string>();

    for (const item of output) {
      if ((item.children ?? []).length > 0) {
        throw new Error("Genre-mode subclass output must not keep generating grandchild nodes.");
      }

      const generatedName = normalizeNameKey(item.name);

      if (generatedName === normalizeNameKey(input.parentName)) {
        throw new Error("Genre-mode subclass output repeated the parent name.");
      }

      if (siblingNames.has(generatedName)) {
        throw new Error("Genre-mode subclass output collides with an existing sibling node name.");
      }

      if (batchNames.has(generatedName)) {
        throw new Error("Genre-mode subclass output contains duplicate candidate names within the batch.");
      }

      batchNames.add(generatedName);
    }

    return output.map((item) => ({
      ...item,
      children: [],
    }));
  },
};

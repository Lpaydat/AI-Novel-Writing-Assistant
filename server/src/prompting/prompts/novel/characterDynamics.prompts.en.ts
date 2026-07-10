import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import {
  chapterDynamicExtractionSchema,
  volumeDynamicsProjectionSchema,
} from "../../../services/novel/dynamics/characterDynamicsSchemas";
import type {
  ChapterDynamicsExtractionPromptInput,
  VolumeDynamicsProjectionPromptInput,
} from "./characterDynamics.prompts";

/**
 * English variants of the character-dynamics prompts
 * (`novel.characterDynamics.volumeProjection@v3` and
 * `novel.characterDynamics.chapterExtract@v1`).
 *
 * Domain-aware rewrites for English-language serialized fiction — NOT literal
 * string swaps of the zh anchors. Each variant reuses its zh anchor's
 * `outputSchema` (JSON shape is language-independent) and input type. The
 * `contextPolicy` is copied verbatim and `structuredOutputHint` is translated.
 * Registered alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 */

const VOLUME_DYNAMICS_PROJECTION_TEMPLATE = `{
  "assignments": [
    {
      "characterName": "string",
      "volumeSortOrder": 1,
      "roleLabel": "string or null",
      "responsibility": "string",
      "plannedChapterOrders": [1, 2],
      "isCore": true,
      "absenceWarningThreshold": 3,
      "absenceHighRiskThreshold": 5
    }
  ],
  "factionTracks": [
    {
      "characterName": "string",
      "volumeSortOrder": 1,
      "factionLabel": "string",
      "stanceLabel": "string or null",
      "summary": "string or null"
    }
  ],
  "relationStages": [
    {
      "sourceCharacterName": "string",
      "targetCharacterName": "string",
      "volumeSortOrder": 1,
      "stageLabel": "string",
      "stageSummary": "string"
    }
  ]
}`;

export const novelCharacterDynamicsVolumeProjectionPromptEn: PromptAsset<
  VolumeDynamicsProjectionPromptInput,
  z.infer<typeof volumeDynamicsProjectionSchema>
> = {
  id: "novel.characterDynamics.volumeProjection",
  version: "v3",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  structuredOutputHint: {
    note: [
      "assignments must not be empty; for each input volume, output at least the volume-level responsibility of the protagonist or that volume's core character.",
      "The volumeSortOrder in factionTracks and relationStages must carry the corresponding volume sort order.",
      "plannedChapterOrders may only be an array of positive integers; when unsure, omit it or output an empty array — do not output null, [null], or an array of strings.",
      "For optional fields such as roleLabel, stanceLabel, and summary, prefer to omit them when unsure; do not output null just to fill out the structure.",
      "Do not output confidence.",
    ].join(" "),
  },
  outputSchema: volumeDynamicsProjectionSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-dynamics planner for long-form English serialized web fiction.",
      "Your task is to produce an executable \"per-volume character-dynamics projection\" from the novel's positioning, selling points, first-30-chapter promise, character roster, relationship structure, and volume plans.",
      "",
      "Output only a single valid JSON object — no Markdown, explanations, comments, code blocks, or any extra text.",
      "The top level may contain only assignments, factionTracks, and relationStages.",
      "",
      "Global hard rules:",
      "1. Use only character names that exist in the known roster; do not add characters, rename them, or use vague stand-in labels.",
      "2. Every arrangement must be grounded in the input material; do not invent new settings, relationships, or identities beyond what the material supports.",
      "3. When the material is insufficient, make conservative inferences; prefer low-risk, defensible arrangements, and do not force complex dynamics just to look complete.",
      "4. The result must serve volume-level progression, not read like a character card or a static profile.",
      "5. assignments must not be empty; for each input volume, output at least the volume-level responsibility of the protagonist or that volume's most central character.",
      "6. If factionTracks and relationStages are output, they must carry the corresponding volumeSortOrder; do not omit it or output null.",
      "",
      "Threshold hard rules:",
      "1. absenceWarningThreshold and absenceHighRiskThreshold must be integers from 1 to 12.",
      "2. Even if a character appears intensively only at the end of a volume, the thresholds must not exceed 12.",
      "3. absenceHighRiskThreshold must not be smaller than absenceWarningThreshold.",
      "4. In normal cases prefer 3 / 5; deviate only when there is a strong narrative reason.",
      "",
      "Planning principles:",
      "1. Core characters are not allocated evenly, but according to each volume's tasks, selling-point payoff, and narrative function.",
      "2. Across volumes a character may heat up, cool down, shift position, exit, or be reactivated, but every change must be logical.",
      "3. If a volume carries a turning point, escalation, climax, or convergence function, the character configuration must reflect that accordingly.",
      "4. Fill in plannedChapterOrders only when a character needs sparse, anchor-style appearances; omit it for high-frequency continuous appearances.",
      "5. If plannedChapterOrders is filled in, it must be an array of positive integers; when unsure, omit it or output an empty array, and never output null, [null], or an array of strings.",
      "6. For optional fields such as roleLabel, stanceLabel, and summary, prefer to omit them when unsure; do not write null just to fill out the structure.",
      "",
      "Compression rules:",
      "1. Keep only the minimal result the downstream system will actually consume; do not output an overall summary.",
      "2. In factionTracks and relationStages, keep only records that will affect writing decisions.",
      "3. Do not output confidence.",
      "",
      "The fixed JSON structure is as follows:",
      VOLUME_DYNAMICS_PROJECTION_TEMPLATE,
      "",
      "Extra reminder: valid plannedChapterOrders examples are [4, 7] or []; [null], [\"4\"], and [\"Chapter 4\"] are not allowed.",
      "Do not output confidence.",
      "",
      "The output must strictly conform to volumeDynamicsProjectionSchema.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Synopsis: ${input.description}`,
      `Target audience: ${input.targetAudience}`,
      `Core selling point: ${input.sellingPoint}`,
      `First-30-chapter promise: ${input.firstPromise}`,
      `Outline: ${input.outline}`,
      `Structured outline: ${input.structuredOutline}`,
      `Applied cast option: ${input.appliedCastOption}`,
      `Known character roster:\n${input.rosterText}`,
      `Known structured relationships:\n${input.relationText}`,
      `Volume plans:\n${input.volumePlansText}`,
      "",
      "Output reminder: thresholds must be integers from 1 to 12, and highRiskThreshold must not be smaller than warningThreshold.",
    ].join("\n\n")),
  ],
};

export const novelCharacterDynamicsChapterExtractPromptEn: PromptAsset<
  ChapterDynamicsExtractionPromptInput,
  z.infer<typeof chapterDynamicExtractionSchema>
> = {
  id: "novel.characterDynamics.chapterExtract",
  version: "v1",
  taskType: "fact_extraction",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  structuredOutputHint: {
    note: [
      "confidence is an optional field.",
      "If confidence is output, it must be a number between 0 and 1.",
      "Do not output 5, 10, 80, percentages, worded grade levels, or a stringified confidence; when unsure, omit it.",
    ].join(" "),
  },
  outputSchema: chapterDynamicExtractionSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-dynamics information extractor for long-form serialized web fiction.",
      "Your task is to extract, from the given chapter, the fact-level changes that will actually affect later updates to the character system.",
      "",
      "Output only a single valid JSON object — no Markdown, explanations, comments, code blocks, or any extra text.",
      "",
      "Extraction targets:",
      "1. Identify the key information in this chapter that affects character structure, including new characters, faction changes, relationship changes, and so on.",
      "2. All output must be fact-level extraction, not analysis, evaluation, or speculation.",
      "3. If this chapter contains a significant information gap (a character knows something others do not, or a character is kept in the dark), extract each major character's information boundary: the key facts they are confirmed to know by the end of this chapter, and the key facts they do not yet know. Omit this field when there is no information gap.",
      "",
      "Global rules:",
      "1. Extract only from this chapter's body text; do not add settings or relationships that do not appear.",
      "2. Do not write speculation as fact; when information is unclear, do not output that item.",
      "3. Do not retell the plot or write long summaries; extract only structured change points.",
      "4. All characters must be referred to by explicit names; do not use pronouns such as \"he\", \"she\", or \"the other party\".",
      "5. confidence is optional; if filled in, it must be a number between 0 and 1 — when unsure, omit it.",
      "6. Do not output 5, 10, 80, percentages, worded grade levels, or a stringified confidence.",
      "",
      "Minimal valid example (omit characterKnowledgeStates when there is no information gap):",
      "{\"candidates\":[{\"proposedName\":\"Old Wu\",\"proposedRole\":\"head of the odd-job servants\",\"summary\":\"Oversees the odd-job servants in the back courtyard.\",\"evidence\":[\"Old Wu is in charge of supervising the work.\"],\"matchedCharacterName\":\"\",\"confidence\":0.8}],\"factionUpdates\":[],\"relationStages\":[{\"sourceCharacterName\":\"Steward Zhao\",\"targetCharacterName\":\"Cheng Zhi\",\"stageLabel\":\"surveillance escalation\",\"stageSummary\":\"Steward Zhao begins to keep Cheng Zhi under constant watch.\",\"nextTurnPoint\":\"Cheng Zhi prepares to switch to a new counter-strategy.\",\"confidence\":0.6}]}",
      "Example fragment with an information gap:",
      "\"characterKnowledgeStates\":[{\"characterName\":\"Cheng Zhi\",\"knownFacts\":[\"The ledger is hidden in the west wing.\"],\"hiddenFacts\":[\"Steward Zhao already knows where the ledger is.\"]}]",
      "",
      "The output must strictly conform to chapterDynamicExtractionSchema.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Target audience: ${input.targetAudience}`,
      `Core selling point: ${input.sellingPoint}`,
      `First-30-chapter promise: ${input.firstPromise}`,
      `Current volume: ${input.currentVolumeTitle}`,
      `Known character roster:\n${input.rosterText}`,
      `Known structured relationships:\n${input.relationText}`,
      "",
      `Chapter ${input.chapterOrder}: "${input.chapterTitle}"`,
      input.chapterContent,
    ].join("\n\n")),
  ],
};

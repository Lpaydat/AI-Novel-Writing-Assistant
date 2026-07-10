import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { snapshotExtractionOutputSchema } from "../../../services/state/stateSchemas";
import type { StateSnapshotPromptInput } from "./state.prompts";

/**
 * English variant of `state.snapshot.extract@v4`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. It reuses the zh asset's `outputSchema` (the
 * JSON shape is language-independent) and input type. Registered alongside the
 * zh anchor; the runner swaps to this variant only when `options.locale === "en"`.
 */

const STATE_SNAPSHOT_EXAMPLE_EN = {
  summary:
    "By the end of this chapter the protagonist has steadied the situation for now, but the key misunderstanding and the threads awaiting payoff keep escalating.",
  characterStates: [
    {
      characterName: "Lin Qing",
      currentGoal: "Secure the cover identity first, then trace the source of the anomaly",
      emotion: "wary",
      summary: "Lin Qing confirms the danger is closing in and no longer treats the anomaly as coincidence.",
    },
  ],
  relationStates: [
    {
      sourceCharacterName: "Lin Qing",
      targetCharacterName: "Su Yu",
      summary: "Lin Qing starts to see Su Yu as someone worth probing for a tentative alliance.",
    },
  ],
  informationStates: [
    {
      holderType: "reader",
      fact: "The anomalous signal is not a hallucination but a real event bearing traces of human involvement.",
      status: "known",
      summary: "The reader has confirmed a human hand behind the anomaly.",
    },
    {
      holderType: "character",
      holderRefName: "Lin Qing",
      fact: "Su Yu has not disclosed every clue she knows.",
      status: "misbelief",
      summary: "Lin Qing wrongly assumes Su Yu is still handling the situation entirely passively.",
    },
  ],
  foreshadowStates: [
    {
      title: "Recovering the old experiment records",
      summary: "This chapter only lays the groundwork; it still needs to be paid off later.",
      status: "setup",
    },
  ],
};

export const stateSnapshotExtractPromptEn: PromptAsset<
  StateSnapshotPromptInput,
  z.infer<typeof snapshotExtractionOutputSchema>
> = {
  id: "state.snapshot.extract",
  version: "v4",
  taskType: "summary",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  structuredOutputHint: {
    example: STATE_SNAPSHOT_EXAMPLE_EN,
    note: [
      "When targetCharacterId, setupChapterId, or payoffChapterId cannot be confirmed reliably, they must be omitted — do not output null.",
      "Do not fabricate placeholder IDs such as chapter_1 or placeholder_chapter_id.",
    ].join(" "),
  },
  outputSchema: snapshotExtractionOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a state-snapshot extractor for long-form serialized fiction.",
      "Your task is to extract, from the current chapter's material, the global state snapshot \"as of the end of this chapter\", ready for direct use in later planning, continuation, and consistency checks.",
      "",
      "Output only a single valid JSON object — no Markdown, explanations, comments, code blocks, or any extra text.",
      "The top level may contain only: summary, characterStates, relationStates, informationStates, foreshadowStates.",
      "",
      "Global hard rules:",
      "1. All content must be written in English.",
      "2. Extract only from the provided material; do not add new facts that do not appear in the body or cannot be reliably inferred.",
      "3. The output is \"the state after the chapter ends\", not a plot recap and not an expanded summary.",
      "4. When information is insufficient, omit the entry rather than writing a guess as fact.",
      "5. All fields must be mutually consistent and must not conflict with one another.",
      "",
      "Missing-reference rules:",
      "1. If targetCharacterId is uncertain, keep targetCharacterName and simply omit targetCharacterId.",
      "2. If setupChapterId / payoffChapterId cannot be confirmed reliably, omit the field entirely — do not output null.",
      "3. Do not fabricate placeholder IDs such as chapter_1, chapter_x, or placeholder_chapter_id.",
      "4. If holderType=character and the character ID is unclear, use holderRefName to refer to them; when holderType=reader, do not force in a character reference.",
      "",
      "Field goals:",
      "1. summary: concisely describe the overall situation as of the end of this chapter.",
      "2. characterStates: keep only the important character states that will keep affecting later writing.",
      "3. relationStates: record only the relationship states that actually changed in this chapter.",
      "4. informationStates: record only the key information states that affect knowledge gaps, misunderstandings, suspense, or conflict progression.",
      "5. foreshadowStates: record only the foreshadowing states that were established, reinforced, awaiting payoff, already paid off, or invalidated in this chapter.",
      "",
      "Quality requirements:",
      "1. The output must be short, accurate, and stable — meant for the system to read, not written as a human critique.",
      "2. Do not make summary and the state fields synonymously repeat each other.",
      "3. Prioritize keeping the state changes that truly affect the next chapter or later phases; filter out noise.",
      "",
      "The output must strictly conform to snapshotExtractionOutputSchema.",
    ].join("\n")),
    new HumanMessage([
      `Novel ID: ${input.novelId}`,
      `Chapter: Chapter ${input.chapterOrder} "${input.chapterTitle}"`,
      `Chapter goal: ${input.chapterGoal}`,
      "",
      "Character roster:",
      input.charactersText,
      "",
      "Chapter summary:",
      input.summaryText,
      "",
      "Facts:",
      input.factsText,
      "",
      "Character timeline:",
      input.timelineText,
      "",
      input.previousSummary || "Prior-state summary: none",
      "",
      "Body:",
      input.content,
      "",
      "Output reminders:",
      "1. At most one entry per character in characterStates.",
      "2. relationStates keeps only relationships that actually changed in this chapter.",
      "3. In informationStates, holderType may only be reader or character; status may only be known or misbelief.",
      "4. In foreshadowStates, status may only be setup, hinted, pending_payoff, paid_off, or failed.",
      "5. When targetCharacterId is unknown, omit it — do not write null.",
      "6. When setupChapterId / payoffChapterId is unknown, omit it — do not write null, and do not write a placeholder ID.",
      "7. summary must describe the global state after this chapter ends, not a step-by-step recap.",
    ].join("\n")),
  ],
};

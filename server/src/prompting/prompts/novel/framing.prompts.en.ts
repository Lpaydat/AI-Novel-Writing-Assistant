import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import {
  novelFramingSuggestionSchema,
  type NovelFramingSuggestionPromptInput,
} from "./framing.prompts";

/**
 * English variant of `novel.framing.suggest@v1`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema` (JSON
 * shape is language-independent), input type, `contextPolicy`, and
 * `semanticRetryPolicy` (all language-independent); `postValidate` is omitted
 * (the runner still applies the zh anchor's language-independent postValidate on
 * en output). Registered alongside the zh anchor; the runner swaps to this
 * variant only when `options.locale === "en"`.
 */
export const novelFramingSuggestPromptEn: PromptAsset<
  NovelFramingSuggestionPromptInput,
  z.infer<typeof novelFramingSuggestionSchema>
> = {
  id: "novel.framing.suggest",
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
  outputSchema: novelFramingSuggestionSchema,
  render: (input) => [
    new SystemMessage([
      "You are a novel project-setup assistant for beginner authors who do not understand planning, cannot break out selling points, and are unfamiliar with serialized-fiction structure.",
      'Your task is to complete this book\'s "book-level framing" from the title, story synopsis, and small amount of context the user has filled in, so the user can fill it straight back into the form and keep going.',
      "",
      "Output only a valid JSON object; no Markdown, explanations, comments, code blocks, or extra text.",
      "The fixed output fields must be exactly:",
      "{\"targetAudience\":\"...\",\"commercialTags\":[\"...\"],\"competingFeel\":\"...\",\"bookSellingPoint\":\"...\",\"first30ChapterPromise\":\"...\"}",
      "",
      "[Global hard rules]",
      "1. All content must be written in English.",
      "2. The output must be plain, concrete, and easy to understand — like form suggestions a regular author reads directly; no expert jargon, no empty talk.",
      "3. Summarize and cautiously complete only from what the user has given; do not fabricate concrete world rules, complex cast lists, body-text scenes, or details not provided.",
      "4. If information is insufficient, you may make low-risk, industry-common reasonable inferences, but stay conservative and do not drift into a different book.",
      "5. The fields must be mutually consistent; targetAudience must not describe one kind of reader while sellingPoint reads like a different kind of book.",
      "",
      "[Field requirements]",
      '1. targetAudience: state clearly who this book is mainly for, reflecting reader preferences, reading motivation, or the payoff they crave; do not just write "anyone can read it".',
      "2. commercialTags: give 3-6 short tags, each no more than 20 characters. Tags must be usable directly for positioning and display; prefer genre, selling point, conflict type, and reading experience, not vague buzzwords.",
      '3. competingFeel: write it as "the reading feel a reader actually experiences" — e.g. pacing, emotion, relationship pull, pressure, the source of the payoff; do not imitate or name specific works.',
      '4. bookSellingPoint: make clear the single most gripping core of this book, prioritizing "why a reader is willing to click in and keep reading".',
      "5. first30ChapterPromise: spell out what the first 30 chapters must deliver to the reader — e.g. relationships established, mainline kicked off, a counterattack paid off, the setting revealed, the core suspense landed; do not write an abstract slogan.",
      "",
      "[Quality requirements]",
      '1. Do not write vague conclusions like "vivid characters", "gripping plot", or "tight pacing".',
      "2. Do not write the fields as synonymous repetition; commercialTags, competingFeel, bookSellingPoint, and first30ChapterPromise must each carry a different role.",
      "3. The result must read like a set of project-setup suggestions ready to drop into the form, not an analysis report.",
      "",
      "[Gap-handling rules]",
      "1. If input is sparse, prioritize conservative summarization around the known title, story synopsis, and obvious genre signals.",
      "2. Prefer writing something safe over fabricating concrete settings just to look complete.",
      "3. No blanks allowed, no null allowed.",
    ].join("\n")),
    new HumanMessage([
      "From the known information about the novel below, generate book-level framing ready to fill straight back in.",
      "",
      input.inputSummary,
    ].join("\n")),
  ],
};

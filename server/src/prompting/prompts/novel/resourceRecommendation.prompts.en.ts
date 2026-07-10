import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { novelCreateResourceRecommendationSchema } from "./resourceRecommendation.promptSchemas";
import type { NovelCreateResourceRecommendationPromptInput } from "./resourceRecommendation.prompts";

/**
 * English variant of `novel.create.resource_recommendation@v1`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema` (JSON
 * shape is language-independent), input type, `contextPolicy`, and
 * `semanticRetryPolicy` (all language-independent); `postValidate` is omitted
 * (the runner still applies the zh anchor's language-independent postValidate on
 * en output). The catalog IDs the model must echo come from runtime input, so no
 * id/name literals are hard-coded here. Registered alongside the zh anchor; the
 * runner swaps to this variant only when `options.locale === "en"`.
 */
export const novelCreateResourceRecommendationPromptEn: PromptAsset<
  NovelCreateResourceRecommendationPromptInput,
  z.infer<typeof novelCreateResourceRecommendationSchema>
> = {
  id: "novel.create.resource_recommendation",
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
  outputSchema: novelCreateResourceRecommendationSchema,
  render: (input) => [
    new SystemMessage([
      "You are a book-start resource recommender for novels, serving novice authors with little writing experience who are easily scared off by jargon and configuration.",
      "Your task is to recommend, from the given genre-base library and progression-mode library, the combination best suited as a default starting base, based on the book-start information the user currently provides.",
      "",
      "You may only choose from the given lists; do not invent new genre IDs, progression-mode IDs, names, or paths.",
      "",
      "When recommending, you must prioritize:",
      "1. Whether it helps a novice start their first book with low cognitive load",
      "2. Whether it favors steadily finishing a whole medium-to-long book, not just looking lively for the first few chapters",
      "3. Whether it can deliver the genre promise, the target-reader expectation, and the first-30-chapter promise",
      "4. Whether it matches the existing selling point, reading feel, pacing, emotional intensity, and POV leaning",
      "",
      "[Recommendation principles]",
      '1. The genre base answers "what kind of book is this"; prefer the option that stabilizes the story appearance and market expectation.',
      '2. The primary progression mode answers "what keeps this book advancing and paying off"; choose the single most core, most stable driver.',
      "3. Give a secondary progression mode only when it genuinely adds flavor without disturbing the main driver; otherwise, prefer to recommend none.",
      "4. If information is still sparse, prefer a steadier, broader, harder-to-derail combination over a flashy but hard-to-handle niche one.",
      "5. If the user has already manually chosen a direction, converge around it as much as possible unless it clearly conflicts, rather than forcibly overturning it.",
      "6. If you can determine a specific subcategory, recommend it first; if information is insufficient, fall back to a broader parent category.",
      "",
      "The output must be a JSON object; do not output Markdown, explanations, comments, or extra text.",
      "The fixed format is:",
      "{\"summary\":\"...\",\"genreId\":\"...\",\"genreReason\":\"...\",\"primaryStoryModeId\":\"...\",\"primaryStoryModeReason\":\"...\",\"secondaryStoryModeId\":\"...\",\"secondaryStoryModeReason\":\"...\",\"caution\":\"...\"}",
      "",
      "[Field requirements]",
      "1. summary: in concise English, explain why this combination suits the current book-start as the default base.",
      "2. genreReason: explain why this genre base fits the current story direction and reader expectation.",
      "3. primaryStoryModeReason: explain why this primary progression mode can steadily deliver the core reading expectation.",
      "4. secondaryStoryModeId / secondaryStoryModeReason: fill only when genuinely necessary; otherwise return an empty string or null.",
      "5. caution: point out where this combination is most likely to go wrong; may be an empty string when there is no obvious risk.",
      "",
      "[Hard constraints]",
      "1. genreId must come from the given genre-base list.",
      "2. primaryStoryModeId must come from the given progression-mode list.",
      "3. If secondaryStoryModeId has a value, it must come from the given progression-mode list and must not equal primaryStoryModeId.",
      "4. Do not return an empty summary, empty genreReason, or empty primaryStoryModeReason.",
    ].join("\n")),
    new HumanMessage([
      "Current book-start information:",
      input.userIntentSummary,
      "",
      "Available genre-base list:",
      input.genreCatalogText,
      "",
      "Available progression-mode list:",
      input.storyModeCatalogText,
    ].join("\n")),
  ],
};

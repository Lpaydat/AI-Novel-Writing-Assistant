import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { bookAnalysisChapterSplitOutputSchema } from "../../../services/bookAnalysis/shared/bookAnalysisSchemas";
import type { BookAnalysisChapterSplitPromptInput } from "./bookAnalysisChapter.prompts";

/**
 * English variant of `bookAnalysis.chapter.split@v1`.
 *
 * Domain-aware rewrite for English-language long-form text. Reuses the zh
 * anchor's outputSchema (the offset/JSON shape is language-independent) and
 * input type. Registered alongside the zh anchor; the runner swaps to this
 * variant only when `options.locale === "en"`.
 */
export const bookAnalysisChapterSplitPromptEn: PromptAsset<
  BookAnalysisChapterSplitPromptInput,
  z.infer<typeof bookAnalysisChapterSplitOutputSchema>
> = {
  id: "bookAnalysis.chapter.split",
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
  outputSchema: bookAnalysisChapterSplitOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a chapter-splitting assistant for long-form text.",
      "Your task is to judge chapter boundaries in the given text and output each chapter's title and its character offset within the source text.",
      "Output only a JSON object; no Markdown, no explanations.",
      "The structure is fixed as:",
      '{ "chapters": [{ "title": "...", "startOffset": 0, "endOffset": 100 }] }',
      "Rules:",
      "1. Offsets use 0-based character positions; startOffset includes the position of the chapter title, and endOffset is the position of the first character after that chapter ends.",
      "2. Chapters must be ordered as in the source text; they must not overlap and must not go out of bounds.",
      "3. If chapter boundaries cannot be reliably determined, return an empty array; do not force it.",
      "4. title uses the short text in the source that is closest to a chapter heading.",
    ].join("\n")),
    new HumanMessage([
      "Source text:",
      input.content,
    ].join("\n")),
  ],
};

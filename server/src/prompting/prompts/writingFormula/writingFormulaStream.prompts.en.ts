import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import type {
  WritingFormulaApplyGenerateStreamInput,
  WritingFormulaApplyRewriteStreamInput,
  WritingFormulaExtractStreamInput,
} from "./writingFormulaStream.prompts";

/**
 * English variants of the `writingFormula.*.stream` prompts (extract / apply
 * rewrite / apply generate).
 *
 * Domain-aware rewrites for English-language creative writing — NOT literal
 * string swaps of the zh anchors. Each variant mirrors its zh anchor's id,
 * version, taskType, mode, and contextPolicy, and shares the same input type.
 * All three are streaming, text-mode prompts, so there is no outputSchema.
 * Registered alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 */

/** Stream-extract a reproducible writing formula (Markdown structure) from sample text. */
export const writingFormulaExtractStreamPromptEn: PromptAsset<
  WritingFormulaExtractStreamInput,
  string,
  string
> = {
  id: "writingFormula.extract.stream",
  version: "v1",
  taskType: "planner",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  render: (input) => [
    new SystemMessage(
      `You are a professional writing-style analyst who can deeply dissect the craft behind literary works.
Analyze the text at the ${input.extractLevel} level, focusing on: ${input.focusAreas.join(", ")}.
Output format (Markdown):
## Overall Style Positioning
## Core Writing Techniques (with example sentences from the source)
## Reproducible Writing Formula
## Application Guide (how to use this formula to write new text)`,
    ),
    new HumanMessage(input.sourceText),
  ],
};

/** Rewrite the source text according to the given formula. */
export const writingFormulaApplyRewriteStreamPromptEn: PromptAsset<
  WritingFormulaApplyRewriteStreamInput,
  string,
  string
> = {
  id: "writingFormula.apply.rewrite.stream",
  version: "v1",
  taskType: "writer",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  render: (input) => [
    new SystemMessage(
      "You are a professional writing assistant. Rewrite the given text in strict accordance with the writing formula below. Requirements: keep the source text's core meaning unchanged, but reshape its voice, rhythm, and sentence patterns to match the formula.",
    ),
    new HumanMessage(`Writing formula:\n${input.formulaContent}\n\nSource text:\n${input.sourceText}`),
  ],
};

/** Create new content around a topic according to the given formula. */
export const writingFormulaApplyGenerateStreamPromptEn: PromptAsset<
  WritingFormulaApplyGenerateStreamInput,
  string,
  string
> = {
  id: "writingFormula.apply.generate.stream",
  version: "v1",
  taskType: "writer",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  render: (input) => [
    new SystemMessage(
      `You are a professional writing assistant. Create new content around the given topic in strict accordance with the writing formula below.
Requirements: keep the length to roughly ${input.targetLength} words, and make every paragraph embody the formula's core characteristics.`,
    ),
    new HumanMessage(`Writing formula:\n${input.formulaContent}\n\nTopic:\n${input.topic}`),
  ],
};

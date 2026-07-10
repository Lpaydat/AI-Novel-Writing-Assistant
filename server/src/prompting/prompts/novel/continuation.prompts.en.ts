import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import type { NovelContinuationRewritePromptInput } from "./continuation.prompts";

/**
 * English variant of `novel.continuation.rewrite_similarity@v1` (text mode).
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. The zh anchor emits a Simplified-Chinese chapter
 * body; this variant emits an English chapter body, mirroring the same intent,
 * constraints, and output-format directives. Reuses the zh anchor's `taskType`,
 * `mode`, and `contextPolicy`. Registered alongside the zh anchor; the runner
 * swaps to this variant only when `options.locale === "en"`.
 */
export const novelContinuationRewriteSimilarityPromptEn: PromptAsset<
  NovelContinuationRewritePromptInput,
  string,
  string
> = {
  id: "novel.continuation.rewrite_similarity",
  version: "v1",
  taskType: "repair",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  render: (input) => [
    new SystemMessage([
      "You are a rewrite editor for long-form serialized fiction.",
      "Your task is to rewrite the current chapter into a fresh, directly usable English chapter that, while preserving plot continuity, clearly distances its scenes from the similar source.",
      "",
      "[Hard rules]",
      "1. The output must be a complete English chapter body; do not output explanations, comments, analysis, title notes, code blocks, or any extra text.",
      "2. You must keep this chapter continuous with the existing story; do not break character relationships, event causality, the current situation, or the end-of-chapter hook.",
      "3. You must keep this chapter's core progression direction and end hook, but reconstruct how they are achieved.",
      "4. The similarity-risk source is only for avoidance; do not copy it, do not paraphrase it closely, and do not replicate its scene rhythm or wording.",
      "",
      "[Rewrite focus]",
      "1. Reconstruct the conflict path: do not reuse the similar source's conflict type, mode of pressure, or confrontation structure.",
      "2. Reconstruct the scene trigger: do not reuse the same fuse, entry timing, or way the situation is set in motion.",
      "3. Reconstruct the action chain: the order of key actions, character responses, situation shifts, and information reveals must be clearly different.",
      "4. Reconstruct the expression layer: sentence patterns, metaphors, narrative rhythm, emotional progression, and paragraph organization must all be reorganized to avoid close wording.",
      "",
      "[Preservation boundaries]",
      "1. You may change how scenes unfold, but not the core plot outcome this chapter must accomplish.",
      "2. You may change the conflict process, but do not break characters or distort their motives and established relationships.",
      "3. You may change pacing and details, but do not lose this chapter's required information continuity and forward hook.",
      "",
      "[Quality requirements]",
      "1. The new version must read like a natural chapter from the same book, not a forcibly torn-apart, reassembled replacement draft.",
      '2. Reduce similarity primarily by "swapping the conflict mechanism, swapping the progression structure, swapping the key actions", not by surface-level synonym rewriting.',
      "3. Do not avoid so mechanically that the plot goes hollow; it must still hold up, flow, and read well.",
      "4. The body must be complete, coherent, and vivid — not an outline-style rewrite.",
    ].join("\n")),
    new HumanMessage([
      `Chapter title: ${input.chapterTitle}`,
      "",
      "Similarity-risk source (for avoidance only, do not copy):",
      input.mostSimilarSnippet,
      "",
      "Current chapter, full text:",
      input.targetText,
      "",
      "Output the complete rewritten body directly.",
    ].join("\n")),
  ],
};

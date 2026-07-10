import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { ragContextualChunkOutputSchema } from "./contextualChunk.prompts";
import type { RagContextualChunkPromptInput } from "./contextualChunk.prompts";

/**
 * English variant of `rag.contextual_chunk.prefix@v1`.
 *
 * Domain-aware rewrite for English-language RAG indexing — NOT a literal string
 * swap of the zh anchor. It reuses the zh asset's `outputSchema` (the JSON shape
 * is language-independent) and input type. Registered alongside the zh anchor;
 * the runner swaps to this variant only when `options.locale === "en"`.
 */
export const ragContextualChunkPrefixPromptEn: PromptAsset<
  RagContextualChunkPromptInput,
  z.infer<typeof ragContextualChunkOutputSchema>
> = {
  id: "rag.contextual_chunk.prefix",
  version: "v1",
  taskType: "fact_extraction",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  repairPolicy: {
    maxAttempts: 1,
  },
  structuredOutputHint: {
    example: {
      contextPrefix:
        "This chunk comes from the character profile in \"Sample Novel\", stating that the protagonist Cheng Zhi holds the brass back-door key, and it restricts the key to explaining back-door passage only.",
    },
    note: "Return only a single JSON object. Use 1-3 English sentences in contextPrefix to summarize where this chunk sits within the novel, chapter, character, or knowledge document.",
  },
  outputSchema: ragContextualChunkOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a context annotator for the retrieval index of a long-form-novel RAG system.",
      "Your task is to generate a short context prefix for a single text chunk, helping the retrieval system understand which novel, which kind of material, and which chapter or character the chunk belongs to, plus its usefulness for continuity retrieval.",
      "",
      "Hard requirements:",
      "1. Output only a single valid JSON object — no Markdown, explanations, or code blocks.",
      "2. contextPrefix must be 1-3 sentences in English, at most 260 characters.",
      "3. Summarize only from the input title, owner, metadata, and chunk body; do not add plot facts that are absent from the input.",
      "4. Prioritize locating information useful for retrieval: novel / world / chapter / character / knowledge-doc title, fact type, and time or chapter anchors.",
      "5. Do not restate the whole body; only supply the retrieval clues that would be lost once the chunk is separated from its context.",
    ].join("\n")),
    new HumanMessage([
      `ownerType: ${input.ownerType}`,
      `ownerId: ${input.ownerId}`,
      `title: ${input.title || "Untitled"}`,
      `novelId: ${input.novelId || "None"}`,
      `worldId: ${input.worldId || "None"}`,
      `chunkOrder: ${input.chunkOrder}`,
      "",
      "metadataJson:",
      input.metadataJson || "{}",
      "",
      "chunkText:",
      input.chunkText,
    ].join("\n")),
  ],
};

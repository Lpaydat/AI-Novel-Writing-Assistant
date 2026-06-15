import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { genreTreeDraftNodeSchema } from "./genre.promptSchemas";
import type { GenreTreePromptInput } from "./genre.prompts";

/**
 * English variant of `genre.tree.generate@v1`.
 *
 * This is a domain-aware rewrite for Western / international genre conventions,
 * NOT a literal string swap of the zh anchor. It reuses the zh asset's
 * `outputSchema` (the JSON shape is language-independent).
 *
 * Registered alongside the zh anchor; the runner swaps to this variant only
 * when `options.locale === "en"`.
 */
export const genreTreePromptEn: PromptAsset<
  GenreTreePromptInput,
  z.infer<typeof genreTreeDraftNodeSchema>
> = {
  id: "genre.tree.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  // Reuse the zh anchor's outputSchema: it describes JSON STRUCTURE, not language.
  outputSchema: genreTreeDraftNodeSchema,
  render: (input) => {
    const retryInstruction = input.retry
      ? "\nYour previous answer was not valid JSON. This time, return ONLY the JSON object body — no explanations, no Markdown, no code fences, no extra text."
      : "";
    const providerJsonInstruction = input.forceJson
      ? "\nThe current model supports stable JSON output; return the JSON object body directly."
      : "";

    return [
      new SystemMessage([
        "You are a senior fiction genre strategist.",
        'Your task is to turn the user\'s creative direction into a "genre tree" suited to novel planning and product tagging.',
        "The goal of this tree is not to pile on nouns, but to build a clear, distinguishable, actionable genre hierarchy that supports positioning, tag organization, and content planning.",
        "",
        "Return only a single JSON object — no Markdown, no explanations, no comments, no code fences, no extra text.",
        "",
        "The JSON structure is fixed as follows:",
        "{",
        '  "name": "Primary genre name",',
        '  "description": "Primary genre description",',
        '  "children": [',
        "    {",
        '      "name": "Sub-genre name",',
        '      "description": "Sub-genre description",',
        '      "children": [',
        "        {",
        '          "name": "Leaf genre name",',
        '          "description": "Leaf genre description",',
        '          "children": []',
        "        }",
        "      ]",
        "    }",
        "  ]",
        "}",
        "",
        "Structure rules:",
        "1. At most three levels: primary genre -> sub-genre -> leaf genre.",
        "2. Every node MUST contain the keys name, description, and children. Do not omit keys, rename them, or add near-synonym fields.",
        "3. When a node is not subdivided further, children MUST be an empty array.",
        "4. The result must be a single, clearly-structured tree — do not output several parallel primary genres.",
        "",
        "Naming rules:",
        "1. The name MUST be concise, clear, and stable, suitable for direct use as a product genre tag.",
        "2. Avoid overly long names, explanatory names, slogans, or marketing-style phrasing.",
        "3. Sibling nodes at the same level must be clearly distinguishable — avoid synonymous rewording or minor wording variations.",
        "4. Names should reflect core genre differences, not vague mood words or quality judgments.",
        "",
        "Description rules:",
        "1. The description MUST explain the genre\'s defining traits, common reader payoffs, narrative focus, and reader expectations.",
        "2. Keep descriptions specific and tight — do not write filler like \"engaging content\", \"rich plot\", or \"highly immersive\".",
        "3. Descriptions should serve genre distinction: help the user understand why a node belongs to this category.",
        "",
        "Planning rules:",
        "1. Prioritize a hierarchy with real distinction over mechanically listing as many sub-genres as possible.",
        "2. Keep sub-genre counts restrained — better few and clear than a sprawling tag bazaar.",
        "3. Leaf genres should further subdivide their parent sub-genre, not jump to a different categorization axis.",
        "4. The whole tree should use a consistent partitioning dimension — do not split one level by setting and the next by emotional arc or protagonist identity.",
        "5. If the user\'s description is vague, make conservative, low-risk, industry-common genre choices — do not over-branch.",
        "6. The output should be natural, self-consistent, and directly usable for downstream productization and writing planning.",
        retryInstruction,
        providerJsonInstruction,
      ].join("\n")),
      new HumanMessage([
        "Generate a genre tree from the following creative direction:",
        "",
        input.prompt.trim(),
      ].join("\n")),
    ];
  },
};

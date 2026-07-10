import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import type {
  NovelDraftOptimizeFullPromptInput,
  NovelDraftOptimizeSelectionPromptInput,
} from "./draftOptimize.prompts";

/**
 * English variants of the `novel.draft_optimize.*` prompts (selection / full).
 *
 * Domain-aware rewrites for English-language novel drafting — NOT literal string
 * swaps of the zh anchors. Both are text-mode prompts (no outputSchema); the
 * `contextPolicy`, `taskType`, `mode`, id/version are copied verbatim and only
 * the render prose is rewritten. Registered alongside the zh anchors; the runner
 * swaps to a variant only when `options.locale === "en"`.
 */

export const novelDraftOptimizeSelectionPromptEn: PromptAsset<
  NovelDraftOptimizeSelectionPromptInput,
  string,
  string
> = {
  id: "novel.draft_optimize.selection",
  version: "v1",
  taskType: "repair",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  render: (input) => [
    new SystemMessage(
      input.target === "structured_outline"
        ? [
            "You are a rigorous JSON local editor.",
            "Your task is to make a minimally invasive rewrite of the 'specified fragment' so that it satisfies the user's instruction while keeping the overall structure stable.",
            "",
            "Output only text that can directly replace the original fragment — no Markdown, explanations, comments, or code blocks.",
            "",
            "Hard rules:",
            "1. You must preserve the original JSON semantics, field meanings, and hierarchy.",
            "2. Do not add fields, remove fields, or rename keys.",
            "3. Do not extend beyond the fragment; do not fill in adjacent structures.",
            "4. Keep the rewrite a 'local replacement'; avoid touching unrelated fields.",
            "5. If it is an array item, rewrite only that item's content; do not affect the array structure.",
            "",
            "Priority rule:",
            "User correction instruction > original fragment's semantic consistency > other optimizations",
            "",
            "Quality requirements:",
            "1. After rewriting it must be semantically self-consistent, structurally valid, and directly usable for persistence.",
            "2. Do not make unrelated changes beyond stylistic polish.",
          ].join("\n")
        : [
            "You are a fiction editor performing a 'local rewrite' task.",
            "Your goal is to make the target fragment fit the user's instruction better without breaking the surrounding context.",
            "",
            "Output only the rewritten fragment — no explanations, headings, surrounding text, or extra text.",
            "",
            "Hard rules:",
            "1. You may only rewrite the 'fragment to rewrite'; do not expand into other paragraphs.",
            "2. You must keep the original fragment's core theme, characters, event relationships, and causal logic unchanged.",
            "3. Do not introduce new characters, new settings, or key information that has not appeared.",
            "4. If the original fragment is a list item, you must return a single list item of the 'same type and same granularity'.",
            "",
            "Priority rule:",
            "User correction instruction > original fragment's semantic consistency > expression optimization",
            "",
            "Quality requirements:",
            "1. The rewrite should be clearer, more natural, and more specific, but must not change the original meaning.",
            "2. Avoid empty phrasing such as 'even more exciting' or 'develops further'.",
            "3. Ensure it connects naturally with the surrounding text, but do not repeat the surrounding content.",
          ].join("\n")
    ),
    new HumanMessage(
      [
        "User correction instruction:",
        input.instruction,
        "",
        "Core characters:",
        input.charactersText,
        "",
        "World context:",
        input.worldContext,
        "",
        "Text before the fragment (for understanding only; do not rewrite):",
        input.before || "(none)",
        "",
        "Text after the fragment (for understanding only; do not rewrite):",
        input.after || "(none)",
        "",
        "Fragment to rewrite:",
        input.selectedText,
        "",
        "Output requirements:",
        "1. Output only the rewritten result of the 'fragment to rewrite'.",
        "2. Do not output the before/after text; do not add explanations.",
        "3. If the user's instruction conflicts with the original content, make the minimal change guided by 'the original fragment's core semantics + the user's correction instruction'.",
      ].join("\n")
    ),
  ],
};

export const novelDraftOptimizeFullPromptEn: PromptAsset<
  NovelDraftOptimizeFullPromptInput,
  string,
  string
> = {
  id: "novel.draft_optimize.full",
  version: "v1",
  taskType: "repair",
  mode: "text",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  render: (input) => [
    new SystemMessage(
      input.target === "structured_outline"
        ? [
            "You are a structured novel-outline editor.",
            "Your task is to optimize the entire JSON draft within its structure, based on the user's correction instruction, making it clearer, more executable, and self-consistent.",
            "",
            "Output only the optimized JSON — no explanations, Markdown, comments, or extra text.",
            "",
            "Hard rules:",
            "1. The output must be valid JSON, with a structure identical to the original draft (usually a JSON array).",
            "2. Do not change the field hierarchy, field names, or overall structure.",
            "3. Do not add unrelated fields; do not remove necessary fields.",
            "4. All changes must happen inside the original structure.",
            "",
            "Priority rule:",
            "User correction instruction > original draft's semantic consistency > expression optimization",
            "",
            "Optimization goals:",
            "1. Make each item more specific and executable rather than an abstract concept.",
            "2. Fix parts that are logically unclear, conflicting, or repetitive.",
            "3. Strengthen the causal relationships and progression logic within the structure.",
            "4. Stay consistent with the core characters and world rules; do not overstep.",
            "",
            "Quality requirements:",
            "1. The output must be directly usable by the downstream generation pipeline.",
            "2. Avoid empty phrasing such as 'advance the plot' or 'add conflict'.",
            "3. Do not pointlessly rewrite parts the instruction does not affect; keep changes to the minimum necessary.",
          ].join("\n")
        : [
            "You are a fiction development editor responsible for the holistic optimization of a full development-direction draft.",
            "Your task is to make the draft clearer, more propulsive, and better suited to continued writing, without breaking the settings.",
            "",
            "Output only the optimized full draft — no explanations, headings, or extra text.",
            "",
            "Hard rules:",
            "1. You must keep the core character settings, world rules, and existing event causality consistent.",
            "2. Do not introduce key new settings, characters, or world rules that were not provided.",
            "3. Do not delete key plot nodes already established in the draft.",
            "",
            "Priority rule:",
            "User correction instruction > original draft's structural and semantic consistency > expression optimization",
            "",
            "Optimization goals:",
            "1. Make the overall direction clearer: every paragraph should make clear 'what it is advancing'.",
            "2. Strengthen conflict and progression instead of flat narration.",
            "3. Eliminate repetitive, vague, or logically broken parts.",
            "4. Make the content better suited to be expanded into chapters, rather than staying at the concept level.",
            "",
            "Quality requirements:",
            "1. Be specific; avoid empty talk such as 'develops further' or 'unfold the conflict'.",
            "2. Paragraphs must have clear causal or progressive relationships between them.",
            "3. Prioritize structural optimization over simple polishing.",
            "4. For parts the instruction does not affect, keep the original structure as much as possible; avoid pointless rewriting.",
          ].join("\n")
    ),
    new HumanMessage(
      [
        "User correction instruction:",
        input.instruction,
        "",
        "Core characters:",
        input.charactersText,
        "",
        "World context:",
        input.worldContext,
        "",
        "Current draft:",
        input.currentDraft,
      ].join("\n")
    ),
  ],
};

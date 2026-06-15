import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import {
  fullAuditOutputSchema,
  lightAuditOutputSchema,
} from "../../../services/audit/auditSchemas";
import { NOVEL_PROMPT_BUDGETS } from "../novel/promptBudgetProfiles";
import type { AuditChapterPromptInput } from "./audit.prompts";

/**
 * English variants of the chapter-quality audit chain:
 * `audit.chapter.light@v1` and `audit.chapter.full@v2`.
 *
 * Domain-aware rewrites for English-language serialized fiction. Each variant
 * reuses its zh anchor's outputSchema (the JSON shape is language-independent)
 * and input type, and copies the zh contextPolicy verbatim (context-block group
 * ids are language-independent). Registered alongside the zh anchors; the runner
 * swaps to a variant only when `options.locale === "en"`.
 */

export const auditChapterLightPromptEn: PromptAsset<
  AuditChapterPromptInput,
  z.infer<typeof lightAuditOutputSchema>
> = {
  id: "audit.chapter.light",
  version: "v1",
  taskType: "light_review",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterLightAudit,
    preferredGroups: [
      "chapter_boundary",
      "chapter_mission",
      "structure_obligations",
      "local_state",
    ],
    dropOrder: [
      "recent_chapters",
      "participant_subset",
      "world_rules",
      "historical_issues",
    ],
  },
  // Reuse the zh anchor's outputSchema: it describes JSON structure, not language.
  outputSchema: lightAuditOutputSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are a serialized-fiction light chapter-review assistant.",
      "Your task is to quickly judge whether the current chapter can continue to advance, or must escalate to a full review.",
      "",
      "Output only one valid JSON object — no Markdown, no explanations, no comments, or extra text.",
      "",
      "Judgment rules:",
      "1. Default to letting the chapter continue; do not escalate ordinary quality suggestions into blockers.",
      "2. Recommend full_audit only when there is an obvious structural anomaly, a severe deviation from the chapter mission, a critical information break, or a clearly runaway length.",
      "3. Keep only the 0-4 most critical items in issues; each must be specific and actionable.",
      "4. continueRecommendation may only be continue, suggest_repair, or full_audit.",
      "5. Set shouldRunFullAudit to true only when a full re-review is genuinely needed.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: ${input.chapterTitle}`,
      `Review scope: ${input.requestedTypes.join(", ")}`,
      "",
      "Layered context:",
      renderSelectedContextBlocks(context),
      "",
      "Story-mode constraints:",
      input.storyModeContext || "none",
      "",
      "Body text:",
      input.content,
      "",
      "Retrieval supplement:",
      input.ragContext || "none",
    ].join("\n")),
  ],
};

export const auditChapterFullPromptEn: PromptAsset<
  AuditChapterPromptInput,
  z.infer<typeof fullAuditOutputSchema>
> = {
  id: "audit.chapter.full",
  version: "v2",
  taskType: "critical_review",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterReview,
    preferredGroups: [
      "chapter_boundary",
      "chapter_mission",
      "structure_obligations",
      "world_rules",
      "historical_issues",
    ],
    dropOrder: [
      "recent_chapters",
      "participant_subset",
      "open_conflicts",
    ],
  },
  // Reuse the zh anchor's outputSchema: it describes JSON structure, not language.
  outputSchema: fullAuditOutputSchema,
  render: (input, context) => [
    new SystemMessage([
      "repetition scoring: 0 means heavily repetitive, 100 means repetition is well controlled; higher is better.",
      "You are a serialized-fiction chapter review assistant.",
      "Your task is to output strict, system-consumable JSON review results based on the chapter body text, the layered context, the story-mode constraints, and the retrieval supplement.",
      "",
      "Output only one valid JSON object — no Markdown, no explanations, no comments, or extra text.",
      "",
      "Hard enum requirements:",
      "1. Top-level issues.category may only be coherence, repetition, pacing, voice, engagement, logic.",
      "2. Do not output plot, character, any localized category name, or any custom category.",
      "3. auditReports.auditType may only use continuity, character, plot, mode_fit.",
      "",
      "Review principles:",
      "1. Judge only from the given body text and context; never fabricate plot, settings, or author intent that was not provided.",
      "2. All issues must be specific; evidence must point to an explicit phenomenon in the text, and fixSuggestion must be actionable.",
      "3. score, issues, and auditReports must be mutually consistent and must not contradict each other.",
      "4. Every type in requestedTypes must be covered; even when problems are not obvious, give a brief conclusion.",
      "",
      "Scoring dimensions:",
      "1. coherence: continuity, causality, and information self-consistency.",
      "2. repetition: expression or information repetition.",
      "3. pacing: progression efficiency and rhythm balance.",
      "4. voice: narrative voice and text stability.",
      "5. engagement: pull, tension, and read-on motivation.",
      "6. overall: a comprehensive score that must roughly match the dimensions above.",
      "",
      "The output must strictly conform to fullAuditOutputSchema.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: ${input.chapterTitle}`,
      `Review scope: ${input.requestedTypes.join(", ")}`,
      "",
      "Layered context:",
      renderSelectedContextBlocks(context),
      "",
      "Story-mode constraints:",
      input.storyModeContext || "none",
      "",
      "Body text:",
      input.content,
      "",
      "Retrieval supplement:",
      input.ragContext || "none",
      "",
      "Output reminder: top-level issues.category may only use coherence/repetition/pacing/voice/engagement/logic.",
    ].join("\n")),
  ],
};

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { AiReplanWindowDecision } from "@ai-novel/shared/types/replanWindowDecision";
import { aiReplanWindowDecisionSchema } from "@ai-novel/shared/types/replanWindowDecision";
import type { PromptAsset } from "../../core/promptTypes";
import type { ReplanWindowDecisionPromptInput } from "./replanWindowDecision.prompts";

/**
 * English variant of `planner.replan.window_decision@v1`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema`
 * (`aiReplanWindowDecisionSchema`, a JSON-shape contract that is
 * language-independent) and input type. Registered alongside the zh anchor; the
 * runner swaps to this variant only when `options.locale === "en"`.
 */
export const plannerReplanWindowDecisionPromptEn: PromptAsset<
  ReplanWindowDecisionPromptInput,
  AiReplanWindowDecision
> = {
  id: "planner.replan.window_decision",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 2200,
    preferredGroups: ["canonical_state", "audit", "payoff_ledger", "chapter_goal"],
    dropOrder: ["protected_secrets"],
  },
  outputSchema: aiReplanWindowDecisionSchema,
  render: (input) => [
    new SystemMessage([
      "You are the replan-window decision-maker for the long-form-novel auto-director.",
      "Your task is to decide, based on the canonical state, chapter goals, audit issues, and the payoff ledger, which chapters this replan should affect and why.",
      "Output only strict JSON — no Markdown, explanations, or extra text.",
      "",
      "[Decision rules]",
      "1. affectedChapterOrders must be selected only from availableChapterOrders; prefer a small, contiguous window.",
      "2. Default window is 1-5 chapters; do not widen the range unless the state clearly shows a cross-chapter chain problem.",
      "3. For ordinary quality issues prefer repairIntent=patch_repair; use state_realign for plan-goal misalignment; use payoff_rebalance for setup/promise misalignment.",
      "4. Use chapter_rewrite only when there is a structural missing chapter or the original plan is entirely unusable.",
      "5. Do not write protectedSecrets into any plot conclusion; use them only as a confidentiality constraint when choosing the window.",
      "6. triggerReason, windowReason, and whyTheseChapters must let a newcomer understand why these chapters need to be adjusted.",
    ].join("\n")),
    new HumanMessage([
      `Trigger type: ${input.triggerType}`,
      `User/system reason: ${input.reason}`,
      `Anchor chapter: chapter ${input.targetChapterOrder}`,
      `Requested window size: ${input.requestedWindowSize}`,
      `Available chapters: ${input.availableChapterOrdersJson}`,
      `Source issues: ${input.sourceIssueIdsJson}`,
      "",
      "[Audit reports]",
      input.auditReportsJson,
      "",
      "[Payoff-ledger summary]",
      input.payoffSummaryJson,
      "",
      "[canonical state]",
      input.canonicalStateJson,
      "",
      `[Next-step state] ${input.nextAction}`,
      "",
      "[Chapter goal]",
      input.chapterStateGoalJson,
      "",
      "[Protected secrets]",
      input.protectedSecretsJson,
      "",
      "Output the replan-window decision JSON.",
    ].join("\n")),
  ],
};

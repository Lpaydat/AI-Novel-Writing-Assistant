import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PlannerInput, StructuredIntent } from "../../../agents/types";
import { normalizeIntentPayload } from "../../../agents/planner/utils";
import {
  buildPlannerIntentPromptParts,
  intentSchema,
  summarizeIntentValidationFailure,
} from "../../../agents/planner/intentPromptSupport";
import type { PromptAsset } from "../../core/promptTypes";

/**
 * Shared structured-output schema for the planner-intent parse prompt.
 * The intent payload is intentionally a free-form JSON object; downstream
 * parsing/normalization happens in `postValidate`. Exported so the English
 * variant (`plannerIntent.prompt.en.ts`) can reuse the exact same shape.
 */
export const plannerIntentSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => !Array.isArray(value), { message: "Expected JSON object." });

export const plannerIntentPrompt: PromptAsset<PlannerInput, StructuredIntent, Record<string, unknown>> = {
  id: "planner.intent.parse",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "zh",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  contextRequirements: [
    { group: "creative_hub.bindings", priority: 100, sourceHint: "Current resource bindings for intent parsing." },
    { group: "creative_hub.recent_messages", priority: 80, sourceHint: "Recent conversation turns for intent continuity." },
    { group: "creative_hub.novel_setup_status", priority: 70, sourceHint: "Novel setup readiness for beginner guidance." },
    { group: "creative_hub.production_status", priority: 68, sourceHint: "Current production status for workflow routing." },
  ],
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: plannerIntentSchema,
  render: (input) => {
    const prompt = buildPlannerIntentPromptParts(input);
    return [
      new SystemMessage(prompt.systemPrompt),
      new HumanMessage(prompt.userPrompt),
    ];
  },
  postValidate: (output, input) => {
    const normalizedPayload = normalizeIntentPayload(output, input);
    const result = intentSchema.safeParse(normalizedPayload);
    if (!result.success) {
      throw new Error(summarizeIntentValidationFailure(normalizedPayload, result.error.issues));
    }
    return result.data;
  },
};

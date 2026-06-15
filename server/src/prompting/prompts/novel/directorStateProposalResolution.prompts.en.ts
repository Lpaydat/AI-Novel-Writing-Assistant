import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { DirectorStateProposalResolution } from "@ai-novel/shared/types/stateProposalResolution";
import { directorStateProposalResolutionSchema } from "@ai-novel/shared/types/stateProposalResolution";
import type { PromptAsset } from "../../core/promptTypes";
import type { DirectorStateProposalResolutionPromptInput } from "./directorStateProposalResolution.prompts";

/**
 * English variant of `director.state_proposal_resolution`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema`
 * (`directorStateProposalResolutionSchema`, JSON shape is language-independent)
 * and input type. The `contextPolicy` and `repairPolicy` are copied verbatim;
 * only the render is an English rewrite. Registered alongside the zh anchor;
 * the runner swaps to this variant only when `options.locale === "en"`.
 */
export const directorStateProposalResolutionPromptEn: PromptAsset<
  DirectorStateProposalResolutionPromptInput,
  DirectorStateProposalResolution
> = {
  id: "director.state_proposal_resolution",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 2600,
    preferredGroups: ["canonical_state", "state_proposals", "protected_content"],
    dropOrder: ["protected_content"],
  },
  outputSchema: directorStateProposalResolutionSchema,
  repairPolicy: { maxAttempts: 1 },
  render: (input) => [
    new SystemMessage([
      "You are the state-proposal resolver for the auto-director of a long-form serialized novel.",
      "Your task is to decide whether a pending state proposal should be auto-applied, archived for later, trigger a replan of the current window, or must be handed off to manual recovery — all under whole-book auto-production mode.",
      "Output strict JSON only. No Markdown, explanations, or extra text.",
      "",
      "[Decision Boundary]",
      "1. information_disclosure: when it is credible and non-conflicting, decision=apply; when it only affects the far future and can be archived first, decision=defer.",
      "2. relation_state_update: when it clearly conflicts with canonical state or would change later chapter promises, decision=auto_replan_window.",
      "3. character_resource_update: when the resource fact is credible and non-conflicting, decision=apply; when the evidence is insufficient, decision=defer.",
      "4. When it touches user-handwritten protected content, data safety, cannot be judged as true or false, or would overwrite protected body text, decision=manual_required.",
      "5. When confidence is below 0.65, decision must be manual_required.",
      "6. affectedChapterWindow uses the minimal affected scope; when it cannot be determined, use the current chapter.",
      "7. proposalIds may only list proposal ids that exist in the input.",
      "8. reason must let a beginner user understand why the system handled it this way.",
    ].join("\n")),
    new HumanMessage([
      `Run mode: ${input.runMode}`,
      `Novel ID: ${input.novelId}`,
      `Task ID: ${input.taskId ?? "none"}`,
      `Current chapter ID: ${input.chapterId ?? "none"}`,
      `Current chapter order: ${input.chapterOrder ?? "unknown"}`,
      "",
      "[Pending state proposals]",
      input.proposalsJson,
      "",
      "[Canonical state summary]",
      input.canonicalStateJson,
      "",
      "[Protected content boundary]",
      input.protectedContentJson,
      "",
      "Output the state-proposal resolution JSON.",
    ].join("\n")),
  ],
};

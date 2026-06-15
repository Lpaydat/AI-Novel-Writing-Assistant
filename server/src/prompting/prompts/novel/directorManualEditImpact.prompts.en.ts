import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { AiManualEditImpactDecision } from "@ai-novel/shared/types/directorRuntime";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import type { DirectorManualEditImpactPromptInput } from "./directorManualEditImpact.prompts";
import { directorManualEditImpactDecisionSchema } from "./directorManualEditImpact.prompts";

/**
 * English variant of `novel.director.manual_edit_impact`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema`
 * (`directorManualEditImpactDecisionSchema`, JSON shape is language-independent)
 * and input type. The `contextPolicy` and `contextRequirements` are copied
 * verbatim; only the render is an English rewrite. Registered alongside the zh
 * anchor; the runner swaps to this variant only when `options.locale === "en"`.
 */
export const directorManualEditImpactPromptEn: PromptAsset<
  DirectorManualEditImpactPromptInput,
  AiManualEditImpactDecision
> = {
  id: "novel.director.manual_edit_impact",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 3600,
    requiredGroups: ["manual_edit_inventory"],
  },
  contextRequirements: [
    { group: "manual_edit_inventory", required: true, priority: 100 },
    { group: "workspace_inventory", priority: 80 },
  ],
  outputSchema: directorManualEditImpactDecisionSchema,
  render: (_input, context) => [
    new SystemMessage([
      "You are the manual-edit impact analyzer for the auto-director of a long-form serialized novel.",
      "Your task is to judge, from the deterministic edit inventory and the artifact dependency graph, which downstream artifacts the user's changes affect, and to give the minimal repair path.",
      "",
      "You must obey:",
      "1. Prioritize protecting body text the user has already edited. Do not recommend overwriting user content directly.",
      "2. Judge only from the chapters, artifacts, dependencies, and statuses in the inventory. Do not invent chapters or assets that do not exist.",
      "3. If it is only light polishing, recommend a review or a continuity update. Do not redo the macro plan.",
      "4. If the change may affect character motivation, a key foreshadow, a promise payoff, or a later chapter task brief, state the minimal scope that needs review.",
      "5. Output strict JSON. Do not output Markdown or extra explanations.",
    ].join("\n")),
    new HumanMessage([
      "Assess the affected scope and the continue path after the user's manual edits.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "Output the structured judgment: impactLevel, affectedArtifactIds, minimalRepairPath, safeToContinue, requiresApproval, summary, riskNotes, evidenceRefs, confidence.",
    ].join("\n")),
  ],
  structuredOutputHint: {
    example: (input: DirectorManualEditImpactPromptInput) => ({
      impactLevel: input.editInventory.changedChapters.length > 0 ? "low" : "none",
      affectedArtifactIds: input.editInventory.changedChapters.flatMap((chapter) => chapter.relatedArtifactIds),
      minimalRepairPath: input.editInventory.changedChapters.length > 0
        ? [{
          action: "review_recent_chapters",
          label: "Review recently edited chapters",
          reason: "After the user edits body text, first confirm whether this chapter's continuity and review results are still usable.",
          affectedScope: input.editInventory.changedChapters.map((chapter) => `chapter:${chapter.chapterId}`).join(","),
          requiresApproval: false,
        }]
        : [],
      safeToContinue: input.editInventory.changedChapters.length === 0,
      requiresApproval: false,
      summary: input.editInventory.changedChapters.length > 0
        ? "Chapter body text changed; recommend a localized review first."
        : "No manual body-text edits detected that require handling.",
      riskNotes: [],
      evidenceRefs: ["manual_edit_inventory"],
      confidence: 0.72,
    }),
  },
};

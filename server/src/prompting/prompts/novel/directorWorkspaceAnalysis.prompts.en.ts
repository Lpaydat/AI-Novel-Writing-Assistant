import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { AiWorkspaceInterpretation } from "@ai-novel/shared/types/directorRuntime";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import type { DirectorWorkspaceAnalysisPromptInput } from "./directorWorkspaceAnalysis.prompts";
import { directorWorkspaceInterpretationSchema } from "./directorWorkspaceAnalysis.prompts";

/**
 * English variant of `novel.director.workspace_analysis`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema`
 * (`directorWorkspaceInterpretationSchema`, JSON shape is language-independent)
 * and input type. The `contextPolicy` and `contextRequirements` are copied
 * verbatim; only the render is an English rewrite. Registered alongside the zh
 * anchor; the runner swaps to this variant only when `options.locale === "en"`.
 */
export const directorWorkspaceAnalysisPromptEn: PromptAsset<
  DirectorWorkspaceAnalysisPromptInput,
  AiWorkspaceInterpretation
> = {
  id: "novel.director.workspace_analysis",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 3200,
    requiredGroups: ["workspace_inventory"],
  },
  contextRequirements: [
    { group: "workspace_inventory", required: true, priority: 100 },
  ],
  outputSchema: directorWorkspaceInterpretationSchema,
  render: (_input, context) => [
    new SystemMessage([
      "You are the workspace analyzer for the auto-director runtime of a long-form serialized novel.",
      "Your task is to judge, from a deterministic inventory, what production stage the current novel is in, what director artifacts are missing, what content needs protection, and what the most worthwhile next step is.",
      "",
      "You must obey:",
      "1. Do not invent artifacts that do not exist in the inventory.",
      "2. If body text already exists, you must account for user-content protection. Do not recommend overwriting it lightly.",
      "3. Quality problems, promise problems, or repair problems must not directly freeze the whole book. Prefer giving the affected scope and the minimal repair path.",
      "4. The output must be strict JSON. Do not output Markdown or explanations.",
    ].join("\n")),
    new HumanMessage([
      "Analyze the current novel workspace.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "Output the structured judgment: productionStage, missingArtifacts, staleArtifacts, protectedUserContent, recommendedAction, confidence, evidenceRefs, summary, riskNotes.",
    ].join("\n")),
  ],
  structuredOutputHint: {
    example: (input: DirectorWorkspaceAnalysisPromptInput) => ({
      productionStage: input.inventory.hasVolumeStrategy ? "has_volume_plan" : "has_seed",
      missingArtifacts: input.inventory.missingArtifactTypes.length > 0
        ? input.inventory.missingArtifactTypes
        : input.inventory.hasBookContract ? [] : ["book_contract"],
      staleArtifacts: input.inventory.staleArtifacts.map((artifact) => artifact.artifactType),
      protectedUserContent: input.inventory.protectedUserContentArtifacts.length > 0
        ? input.inventory.protectedUserContentArtifacts.map((artifact) => artifact.id)
        : input.inventory.draftedChapterCount > 0 ? ["existing chapter body text"] : [],
      recommendedAction: {
        action: input.inventory.hasBookContract ? "continue_chapter_execution" : "create_book_contract",
        reason: "Choose the minimal next step based on current artifact completeness.",
        affectedScope: "novel",
        riskLevel: "low",
      },
      confidence: 0.78,
      evidenceRefs: ["workspace_inventory"],
      summary: "The workspace has some upstream artifacts ready; the next director artifact still needs to be produced.",
      riskNotes: [],
    }),
  },
};

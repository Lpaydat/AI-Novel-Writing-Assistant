import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { StoryPlanLevel } from "@ai-novel/shared/types/novel";
import type { PromptAsset } from "../../core/promptTypes";
import { normalizePlannerOutput, type PlannerOutput } from "../../../services/planner/plannerOutputNormalization";
import { plannerOutputSchema } from "../../../services/planner/plannerSchemas";

/**
 * English variants of the `planner.*.plan` prompts (book / arc / chapter).
 *
 * Domain-aware rewrites for English-language serialized fiction — NOT literal
 * string swaps of the zh anchors. Each variant reuses the zh anchor's
 * `outputSchema` (`plannerOutputSchema`, a JSON-shape contract that is
 * language-independent) and mirrors the zh anchor's whole `contextPolicy`,
 * `semanticRetryPolicy`, and `postValidate` behavior verbatim. Registered
 * alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 */

interface PlannerPlanPromptInput {
  scopeLabel: string;
}

function buildPlannerPlanAssetEn(input: {
  id: string;
  version: string;
  planLevel: StoryPlanLevel;
  includeScenes: boolean;
  maxTokensBudget: number;
}): PromptAsset<PlannerPlanPromptInput, PlannerOutput> {
  return {
    id: input.id,
    version: input.version,
    taskType: "planner",
    mode: "structured",
    language: "en",
    contextPolicy: {
      maxTokensBudget: input.maxTokensBudget,
      requiredGroups:
        input.planLevel === "chapter"
          ? ["novel_overview", "chapter_target", "outline_source", "state_snapshot"]
          : undefined,
      preferredGroups:
        input.planLevel === "chapter"
          ? ["book_plan", "arc_plans", "volume_summary", "story_mode"]
          : ["story_mode", "book_bible"],
      dropOrder: [
        "recent_decisions",
        "character_dynamics",
        "plot_beats",
        "recent_summaries",
        "arc_plans",
        "book_plan",
        "volume_summary",
      ],
    },
    semanticRetryPolicy:
      input.planLevel === "chapter"
        ? { maxAttempts: 1 }
        : undefined,
    outputSchema: plannerOutputSchema,
    structuredOutputHint: {
      example: {
        title: "Example title",
        objective: "Example objective",
        participants: ["Example participant"],
        reveals: ["Example reveal"],
        riskNotes: ["Example risk"],
        hookTarget: "Example hook",
        planRole: input.planLevel === "chapter" ? "progress" : "",
        phaseLabel: "Example phase",
        mustAdvance: ["Example advance item"],
        mustPreserve: ["Example preserve item"],
        scenes: input.includeScenes
          ? [{
            title: "Example scene",
            objective: "Example scene objective",
            conflict: "Example conflict",
            reveal: "Example change",
            emotionBeat: "Example emotion beat",
          }]
          : [],
      },
      note: input.includeScenes
        ? "This level must return an executable scenes example."
        : "This level's scenes must stay an empty array.",
    },
    render: (promptInput, context) => {
      const contextText = context.blocks.map((block) => block.content).join("\n\n");

      const systemPrompt = [
        "You are a long-form-novel planning assistant. Your job is to turn the current level's story needs into a structured planning result that can go directly into the next writing or refinement step.",
        "",
        "Output only strict JSON — no Markdown, explanations, comments, code blocks, or extra text.",
        `Current planning level: ${input.planLevel}.`,
        "",
        "The output must include these fields:",
        "title, objective, participants, reveals, riskNotes, hookTarget, planRole, phaseLabel, mustAdvance, mustPreserve, scenes.",
        input.includeScenes
          ? "scenes must be a non-empty array, and every item must include: title, objective, conflict, reveal, emotionBeat."
          : "scenes must return an empty array.",
        input.planLevel === "chapter"
          ? "When the planning level is chapter, planRole is required and must be one of: setup, progress, pressure, turn, payoff, cooldown."
          : "When the planning level is book or arc, planRole may be an empty string, but do not fill in an invalid value.",
        "",
        "Global hard rules:",
        "1. All content must be written in natural English.",
        "2. Plan only from the given context; do not fill in key settings, character relationships, or major plot beyond the context.",
        "3. The output must serve later creative execution, not read as an analysis write-up.",
        "4. The fields must be internally consistent and must not conflict with one another.",
        "5. mustAdvance and mustPreserve must be short, specific, and directly usable in later writing.",
        "",
        "Field requirements:",
        "1. title: write the title of this level's planning entry — concise and clear, no placeholder words.",
        "2. objective: must clearly state this level's single most core progression goal; do not write it as a vague summary.",
        "3. participants: list only key characters, key factions, or key relationship parties; do not stuff everyone in.",
        "4. reveals: write only important information reveals, structural turns, or key cognitive shifts; do not write ordinary process steps.",
        "5. riskNotes: write the points most likely to lose focus, go flat, distort, drift, or break the constraints; must be specific.",
        "6. hookTarget: write the suspense, tension, expectation, or emotional pull to leave the reader at the end of the phase or chapter; do not write empty words.",
        '7. phaseLabel: sum up the current phase in a short phrase, e.g. "probing-pressure phase", "relationship-binding phase", "identity-loosening phase"; do not make it too long.',
        "8. mustAdvance: list the progression items this level absolutely cannot omit; they must be action-level, result-level, or structure-level progression.",
        "9. mustPreserve: list the continuity, world rules, character states, tone boundaries, or mode constraints that must not be broken.",
        input.includeScenes
          ? "10. scenes must be organized in order, and every item must be directly usable by the writing stage; do not write them as conceptual labels."
          : "10. Because this level does not require scene detailing, scenes must be an empty array.",
        "",
        "Story-mode rules:",
        "1. When the context carries a story-mode constraint, treat the primary mode as a hard constraint and the secondary mode only as a light flavor layer.",
        "2. Do not exceed the conflict ceiling set by the story mode.",
        "3. Do not rely on conflict forms that are explicitly forbidden.",
        "",
        "Quality requirements:",
        '1. The output must read like "a planning result ready to hand straight to the next step for execution", not a conceptual memo.',
        '2. Avoid vague phrasing like "advance the plot", "add conflict", "deepen the characters".',
        "3. Every array item should be a phrase or short sentence; avoid lengthy analysis.",
      ].join("\n");

      const userPrompt = [
        promptInput.scopeLabel,
        "",
        "Context:",
        contextText || "None",
        "",
        "Output requirements:",
        '1. objective must clearly answer "what exactly does this level need to advance right now".',
        "2. participants keeps only the characters, factions, or relationship parties that truly affect this level's progression.",
        "3. reveals writes only key reveals; do not mix in process details.",
        "4. riskNotes should first point out where this level is most likely to be written badly.",
        '5. hookTarget must directly serve reader follow-on reading, not abstractly write "create suspense".',
        "6. phaseLabel must be short, precise, and recognizable.",
        "7. mustAdvance must list the progression items that cannot be absent.",
        "8. mustPreserve must list the continuity, tone, and hard constraints that must not be broken.",
        input.includeScenes
          ? "9. scenes must be clearly ordered, and every scene should reflect a concrete action, conflict, or change."
          : "9. scenes returns an empty array.",
      ].join("\n");

      return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
    },
    postValidate: (output) => {
      const normalized = normalizePlannerOutput(output);

      if (!normalized.title?.trim()) {
        throw new Error("Planner output is missing title.");
      }

      if (!normalized.objective?.trim()) {
        throw new Error("Planner output is missing objective.");
      }

      if (!normalized.phaseLabel?.trim()) {
        throw new Error("Planner output is missing phaseLabel.");
      }

      if ((normalized.mustAdvance ?? []).length === 0) {
        throw new Error("Planner output is missing mustAdvance.");
      }

      if ((normalized.mustPreserve ?? []).length === 0) {
        throw new Error("Planner output is missing mustPreserve.");
      }

      if (input.planLevel === "chapter") {
        if (!normalized.planRole) {
          throw new Error("Chapter planner output is missing planRole.");
        }
        if (!["setup", "progress", "pressure", "turn", "payoff", "cooldown"].includes(normalized.planRole)) {
          throw new Error("Chapter planner output has invalid planRole.");
        }
        if ((normalized.scenes ?? []).length === 0) {
          throw new Error("Chapter planner output is missing scenes.");
        }
      }

      if (!input.includeScenes && (normalized.scenes ?? []).length > 0) {
        throw new Error("Planner output should not include scenes for this plan level.");
      }

      if (input.includeScenes) {
        for (const scene of normalized.scenes ?? []) {
          if (!scene.title?.trim()) {
            throw new Error("Planner scene is missing title.");
          }
          if (!scene.objective?.trim()) {
            throw new Error("Planner scene is missing objective.");
          }
          if (!scene.conflict?.trim()) {
            throw new Error("Planner scene is missing conflict.");
          }
          if (!scene.reveal?.trim()) {
            throw new Error("Planner scene is missing reveal.");
          }
          if (!scene.emotionBeat?.trim()) {
            throw new Error("Planner scene is missing emotionBeat.");
          }
        }
      }

      return normalized;
    },
  };
}

export const plannerBookPlanPromptEn = buildPlannerPlanAssetEn({
  id: "planner.book.plan",
  version: "v1",
  planLevel: "book",
  includeScenes: false,
  maxTokensBudget: 1800,
});

export const plannerArcPlanPromptEn = buildPlannerPlanAssetEn({
  id: "planner.arc.plan",
  version: "v1",
  planLevel: "arc",
  includeScenes: false,
  maxTokensBudget: 1800,
});

export const plannerChapterPlanPromptEn = buildPlannerPlanAssetEn({
  id: "planner.chapter.plan",
  version: "v1",
  planLevel: "chapter",
  includeScenes: true,
  maxTokensBudget: 2400,
});

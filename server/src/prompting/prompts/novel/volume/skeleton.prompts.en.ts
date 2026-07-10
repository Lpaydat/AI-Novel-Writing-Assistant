import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { renderSelectedContextBlocks } from "../../../core/renderContextBlocks";
import { createVolumeSkeletonPrompt } from "./skeleton.prompts";

/**
 * English variant of `novel.volume.skeleton@v2`.
 *
 * Domain-aware rewrite for English-language serialized web fiction — NOT a literal
 * string swap of the zh anchor. The zh anchor is produced by a factory
 * (`createVolumeSkeletonPrompt(targetVolumeCount)`), so the schema OBJECT depends
 * on `targetVolumeCount`. `createVolumeSkeletonPromptEn` mirrors that factory and
 * reuses the zh schema by spreading a zh anchor built with the SAME
 * `targetVolumeCount`, guaranteeing `en.outputSchema === zhAnchor.outputSchema`
 * for whatever count is passed; only `language` and `render` are overridden. To
 * make `en.outputSchema === <registered zh>.outputSchema` hold, register the en
 * variant with the SAME count the registry uses for the zh anchor (`1`); the
 * exported `novelVolumeSkeletonPromptEn` default already uses that count.
 */
export function createVolumeSkeletonPromptEn(
  targetVolumeCount: number,
  zhAnchor: ReturnType<typeof createVolumeSkeletonPrompt> = createVolumeSkeletonPrompt(targetVolumeCount),
): ReturnType<typeof createVolumeSkeletonPrompt> {
  // Pass the registry's own zh instance as `zhAnchor` to make
  // `en.outputSchema === zh.outputSchema` hold; the default builds a fresh
  // (structurally identical) anchor from the same targetVolumeCount.
  const base = zhAnchor;

  return {
    ...base,
    language: "en",
    render: (_input, context) => [
      new SystemMessage([
        "You are a volume-skeleton planner for long-form web fiction, responsible for breaking the whole book's upstream strategy down into an executable volume-level skeleton.",
        "",
        "[Task Boundary]",
        `You must output exactly ${targetVolumeCount} volumes — no more and no fewer.`,
        "At this stage you only do volume-level skeleton planning; you must not expand it into a chapter outline, scene outlines, character bios, or concrete dialogue.",
        "Each volume's summary must be a volume-level overview, not a detailed plot retelling.",
        "",
        "[Field Requirements]",
        "Each volume must fully contain the following fields, with none missing, merged, or renamed:",
        "title, summary, openingHook, mainPromise, primaryPressureSource, coreSellingPoint, escalationMode, protagonistChange, midVolumeRisk, climax, payoffType, nextVolumeHook, resetPoint, openPayoffs.",
        "",
        "[Planning Principles]",
        "1. The skeleton must strictly obey the upstream strategy and the book contract.",
        "2. Hard planning determines the inviolable mainline progression, stage goals, core causality, and the order of key payoffs.",
        "3. Soft planning determines each volume's pacing packaging, how conflict is expressed, its emotional color, and how selling points are presented.",
        "4. Your output must show: continuous hard progression, varied soft experience.",
        "",
        "[Volume Quality Requirements]",
        "1. Each volume must have a reading promise that stands on its own; it must not be merely a transitional volume.",
        "2. Two adjacent volumes' coreSellingPoint must not repeat; they must show a difference in selling point.",
        "3. Two adjacent volumes' primaryPressureSource or escalationMode should vary as much as possible, avoiding homogeneous escalation.",
        "4. Each volume must answer: why this volume deserves to exist on its own.",
        "5. The volumes as a whole must form a clear progression: set hooks at the start, raise the cost in the middle, amplify irreversible risk toward the back, and increase payoff density near the ending.",
        "",
        "[Pacing Requirements]",
        "1. The first volume must carry a strong book-opening function, quickly establishing the main selling point, the core predicament, and a reason to keep following.",
        "2. Middle volumes must not merely ferry plot along; they must provide new shifts in the situation, new pressure, or new payoffs.",
        "3. Later volumes must strengthen the sense of no return, avoiding a mere repeat of early- and mid-stage patterns.",
        "4. nextVolumeHook must push the reader naturally into the next volume, not just leave a vague cliffhanger.",
        "",
        "[Prohibitions]",
        "Do not invent large settings on your own, detached from the context.",
        "Do not prematurely overdraw a core payoff that the upstream has not permitted.",
        "Do not let multiple volumes carry the same conflict function without tiered variation.",
        "Do not write resetPoint as an empty \"return to calm\" phrase; you must explain how the end-of-volume state reshuffles the starting point of the next volume.",
        "",
        "Your goal is not to make the plot longer, but to make the whole book's volume structure stand firm.",
      ].join("\n")),
      new HumanMessage([
        "Based on the following context, plan the volume skeleton for the whole book.",
        "",
        "[Output Requirements]",
        `- output exactly ${targetVolumeCount} volumes`,
        "- do not add fields beyond the schema",
        "- each volume's information must be concise, clear, and executable",
        "- prioritize inter-volume differentiation, progression, and commercial readability",
        "",
        "[Volume-skeleton context]",
        renderSelectedContextBlocks(context),
      ].join("\n")),
    ],
  };
}

export const novelVolumeSkeletonPromptEn = createVolumeSkeletonPromptEn(1);

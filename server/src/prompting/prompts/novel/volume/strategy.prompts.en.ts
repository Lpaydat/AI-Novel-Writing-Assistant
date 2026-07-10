import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { VolumeCountRange } from "@ai-novel/shared/types/novel";
import { renderSelectedContextBlocks } from "../../../core/renderContextBlocks";
import {
  createVolumeStrategyPrompt,
  volumeStrategyCritiquePrompt,
} from "./strategy.prompts";

/**
 * English variants of the volume-strategy prompts:
 *   - `novel.volume.strategy@v2`          (factory `createVolumeStrategyPromptEn`)
 *   - `novel.volume.strategy.critique@v1` (const `novelVolumeStrategyCritiquePromptEn`)
 *
 * Domain-aware rewrites for English-language serialized web fiction — NOT literal
 * string swaps of the zh anchors. Each en variant is derived from its zh anchor
 * (the strategy factory / the critique const) via object spread, so it reuses the
 * zh anchor's `outputSchema` and `contextPolicy` unchanged; only `language` and
 * `render` are overridden.
 *
 * Note on `novel.volume.strategy@v2`: the zh anchor is produced by a factory
 * (`createVolumeStrategyPrompt(config)`), so the schema OBJECT depends on the
 * config. `createVolumeStrategyPromptEn` mirrors that factory and reuses the zh
 * schema by spreading a zh anchor built with the SAME config, guaranteeing that
 * `en.outputSchema === zhAnchor.outputSchema` for whatever config is passed. To
 * make `en.outputSchema === <registered zh>.outputSchema` hold, register the en
 * variant from the SAME config the registry uses for the zh anchor
 * (`{ maxVolumeCount: 16 }`); the exported `novelVolumeStrategyPromptEn` default
 * already uses that config.
 */

interface CreateVolumeStrategyPromptConfig {
  maxVolumeCount?: number;
  allowedVolumeCountRange?: VolumeCountRange | null;
  fixedRecommendedVolumeCount?: number | null;
  hardPlannedVolumeRange?: VolumeCountRange | null;
}

export function createVolumeStrategyPromptEn(
  config: CreateVolumeStrategyPromptConfig = {},
  zhAnchor: ReturnType<typeof createVolumeStrategyPrompt> = createVolumeStrategyPrompt(config),
): ReturnType<typeof createVolumeStrategyPrompt> {
  const maxVolumeCount = config.maxVolumeCount ?? 16;
  const allowedVolumeCountRange = config.allowedVolumeCountRange ?? {
    min: 1,
    max: maxVolumeCount,
  };
  const fixedRecommendedVolumeCount = typeof config.fixedRecommendedVolumeCount === "number"
    ? config.fixedRecommendedVolumeCount
    : null;
  const hardPlannedVolumeRange = config.hardPlannedVolumeRange ?? {
    min: 1,
    max: maxVolumeCount,
  };

  // Pass the registry's own zh instance as `zhAnchor` to make
  // `en.outputSchema === zh.outputSchema` hold; the default builds a fresh
  // (structurally identical) anchor from the same config.
  const base = zhAnchor;

  return {
    ...base,
    language: "en",
    render: (_input, context) => [
      new SystemMessage([
        "You are a volume-strategy planner for long-form web fiction.",
        "Your task is not to directly produce the final volume skeleton, but first to decide how many volumes the whole book should split into, which volumes need hard planning, which volumes keep only soft planning, and to give a volume strategy suited to serialized progression.",
        "",
        "[Task Boundary]",
        "At this stage you only produce a whole-book-level volume strategy; do not expand single-volume skeletons, do not expand chapters, and do not fill in plot outlines.",
        "Your output should serve later volume-skeleton generation, so the focus is: volume count, stage division, planning depth, and how the early and late parts are controlled.",
        "Output strict JSON only; do not output Markdown, explanations, comments, or extra text.",
        "",
        "[Hard Requirements]",
        fixedRecommendedVolumeCount == null
          ? `recommendedVolumeCount must fall between ${allowedVolumeCountRange.min} and ${allowedVolumeCountRange.max}, and must equal volumes.length.`
          : `recommendedVolumeCount must strictly equal ${fixedRecommendedVolumeCount}, and must equal volumes.length.`,
        `hardPlannedVolumeCount must fall between ${hardPlannedVolumeRange.min} and ${hardPlannedVolumeRange.max}, and must not exceed recommendedVolumeCount.`,
        "The first hardPlannedVolumeCount volumes must have planningMode hard; the rest must be soft.",
        "If recommendedVolumeCount is large, the back half must keep enough soft-planning room and must not be locked down prematurely.",
        "If the context gives a user preferred volume count, adopt it strictly and do not change the volume count on your own.",
        "If there is no fixed volume count, decide within the allowed range and prefer to stay close to the system recommended volume count in the context.",
        "For very long books, avoid compressing a large number of chapters into a few giant volumes; do not make a single volume so coarse that it loses its sense of stage, its payoff nodes, and its meaning as a volume-level workbench.",
        "",
        "[Core Goals]",
        "1. The strategy must first serve the drive to keep reading a serial, not lock the second half in one shot.",
        "2. The volume strategy must balance opening pull, mid-run endurance, late-stage escalation room, and long-term serialization schedulability.",
        "3. Hard planning is for locking down the early stage's most critical promises, selling points, progression order, and pacing stability.",
        "4. Soft planning is for preserving the flexibility of later volumes, so they can be adjusted based on serialization feedback, length changes, selling-point reinforcement, and the natural growth of the plot.",
        "",
        "[Planning Principles]",
        "1. recommendedVolumeCount is not an even split of the plot, but is decided by stage promises, selling-point switches, situation escalation, and staged payoffs.",
        "2. hardPlannedVolumeCount covers only the early volumes that genuinely need to be locked in advance; do not mechanically maximize it.",
        "3. The earlier a volume, the more it needs explicit control; the later a volume, the more it should keep room to adjust.",
        "4. The volume strategy must give the first few volumes clear hooks, promises, and progression, avoiding a slide into long-line setup right at the start.",
        "5. Do not let soft volumes become blank placeholders; they should still keep clear stage duties, just without pre-locking concrete details.",
        "",
        "[Key Judgment Items]",
        "1. Whether this book suits a few volumes with strong momentum, or more volumes unfolding in stages — but the decision must respect the allowed range and fixed-volume-count constraints given in the context.",
        "2. Whether the first few volumes carry key tasks such as opening the book, establishing the main selling point, the first-stage payoff, world expansion, and scale escalation, and whether they must be hard-planned.",
        "3. Whether the middle-to-late stages have significant flexibility that suits soft planning, to avoid over-drawing too early.",
        "4. Whether the volume count matches the genre, main-selling-point density, growth span, conflict tiers, and serialization mode.",
        "",
        "[Quality Requirements]",
        "1. The overall strategy must show stage-by-stage progression, not just a vague 'hard up front, soft in back' split.",
        "2. Each volume item should express that volume's stage duty within the whole book, not be written vaguely as 'advance the plot'.",
        "3. Hard volumes should be more explicit; soft volumes should keep a direction but not lock down details.",
        "4. Do not fabricate major settings or extra storylines detached from the context.",
        "5. When information is insufficient, still give a conservative but complete strategy.",
        "6. If the chapter budget is large, by default increase the volume count to keep each volume's stage granularity, rather than compressing a very long book into a few giant volumes.",
      ].join("\n")),
      new HumanMessage([
        "Based on the following context, output the whole book's volume strategy.",
        "",
        "[Output Requirements]",
        "- Output strict JSON only",
        fixedRecommendedVolumeCount == null
          ? `- recommendedVolumeCount must fall between ${allowedVolumeCountRange.min} and ${allowedVolumeCountRange.max}`
          : `- recommendedVolumeCount must strictly equal ${fixedRecommendedVolumeCount}`,
        "- volumes.length must equal recommendedVolumeCount",
        `- hardPlannedVolumeCount must fall between ${hardPlannedVolumeRange.min} and ${hardPlannedVolumeRange.max}`,
        "- the first hardPlannedVolumeCount volumes must be hard, the rest must be soft",
        "- prioritize early pull, mid-run endurance, and late-stage schedulability",
        "",
        "[Planning context]",
        renderSelectedContextBlocks(context),
      ].join("\n")),
    ],
  };
}

export const novelVolumeStrategyPromptEn = createVolumeStrategyPromptEn({ maxVolumeCount: 16 });

export const novelVolumeStrategyCritiquePromptEn: typeof volumeStrategyCritiquePrompt = {
  ...volumeStrategyCritiquePrompt,
  language: "en",
  render: (_input, context) => [
    new SystemMessage([
      "You are a review assistant for long-form web-fiction volume strategy.",
      "Your task is not to rewrite the volume strategy, but to identify the key problems in the current strategy that would affect the stability of a long serialization, and to output a structured review that can drive later corrections.",
      "",
      "[Task Boundary]",
      "Only review whether the current volume strategy has problems such as: locking down too early, imbalance between early and late planning, homogeneous payoffs, broken stage escalation, distorted volume-count allocation, soft planning losing its meaning, or insufficient declaration of uncertainty.",
      "Do not rewrite the whole strategy, do not output a new complete volume plan, and do not output Markdown, explanations, comments, or extra text.",
      "Output strict JSON only.",
      "",
      "[Output Requirements]",
      "Each problem in issues must fully contain the four fields targetRef, severity, title, detail; none may be missing or renamed.",
      "severity uses one of low, medium, high.",
      "If the strategy is acceptable overall, you may output an empty issues list, but do not manufacture fake problems just to fill it.",
      "",
      "[Review Goal]",
      "Focus on whether the current volume strategy genuinely serves long-form web-fiction serialization, rather than superficially completing a hard / soft split.",
      "Your review should focus on structural risk, not on whether the wording looks nice.",
      "",
      "[Key Checks]",
      "1. Whether the second half is locked down too early, making soft planning exist in name but fail in substance.",
      "2. Whether hardPlannedVolumeCount is too high or too low, causing early instability or insufficient late-stage flexibility.",
      "3. Whether recommendedVolumeCount clearly mismatches the genre's scale, selling-point density, growth span, and conflict tiers.",
      "4. Whether the first few volumes carry a clear opening hook, main-selling-point establishment, and stage-promise progression; if not, treat it as a high-priority problem.",
      "5. Whether the volumes' stage duties are too homogeneous, for example several volumes in a row that are just 'keep advancing' or 'keep escalating'.",
      "6. Whether there is broken escalation, gaps in stage goals, imbalanced payoff density, or duplicated function between volumes.",
      "7. Whether soft volumes have only a vague direction, without preserving genuinely schedulable flexibility.",
      "8. Whether the strategy lacks acknowledgment of uncertainty, for example writing not-yet-stable mid-to-late development too rigidly.",
      "",
      "[targetRef Rules]",
      "targetRef must point to the problem's location as precisely as possible.",
      "It may point to the overall strategy, for example: strategy / recommendedVolumeCount / hardPlannedVolumeCount.",
      "It may also point to a specific volume, for example: volumes[0] / volumes[3] / volumes[5].planningMode.",
      "Do not use vague references such as 'the earlier part' or 'over there in the back'.",
      "",
      "[detail Requirements]",
      "detail must state: what the problem is, why it is a structural risk, and what serialization consequence it will cause.",
      "Do not write only vague judgments like 'the pacing has issues', 'the planning is too rigid', or 'needs optimization'.",
      "Try to point out the structural nature of the problem, for example:",
      "- insufficient early promises, making it hard for readers to form a reason to keep reading",
      "- the mid-to-late stage is locked down too early, weakening room to adjust mid-serialization",
      "- adjacent volumes' stage duties repeat, making the payoff experience homogeneous",
      "",
      "[Quality Requirements]",
      "1. Catch only the key problems that genuinely affect structure; avoid a flood of trivia.",
      "2. Do not split the same kind of problem into several near-synonymous issues.",
      "3. If a problem affects the whole strategy, flag it with a higher-level targetRef rather than reporting it in fragments.",
      "4. The review conclusions should take a web-fiction serialization perspective, prioritizing pull, endurance, escalation, payoff, and schedulability.",
      "5. When information is insufficient you may be conservative, but do not let obvious structural hazards slip by.",
    ].join("\n")),
    new HumanMessage([
      "Based on the following context, review the structural risks of the current volume strategy and output the list of problems.",
      "",
      "[Output Requirements]",
      "- Output strict JSON only",
      "- each issue must contain targetRef, severity, title, detail",
      "- point out only the key problems that genuinely affect the stability of the volume strategy",
      "- do not rewrite the strategy; only review it",
      "",
      "[Volume-strategy context under review]",
      renderSelectedContextBlocks(context),
    ].join("\n")),
  ],
};

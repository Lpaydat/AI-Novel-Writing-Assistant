import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type {
  DirectorCandidate,
  DirectorCandidateBatch,
  DirectorCorrectionPreset,
} from "@ai-novel/shared/types/novelDirector";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import { formatProjectContext } from "./planningContextBlocks";
import {
  directorBookContractSchema,
  directorCandidateSchema,
  directorCandidateResponseSchema,
  directorPlanBlueprintSchema,
} from "../../../services/novel/director/runtime/novelDirectorSchemas";
import { NOVEL_PROMPT_BUDGETS } from "./promptBudgetProfiles";
import type {
  DirectorBlueprintPromptInput,
  DirectorBookContractPromptInput,
  DirectorCandidatePatchPromptInput,
  DirectorCandidatePromptInput,
} from "./directorPlanning.prompts";

/**
 * English variants of the book-level director-planning prompts (candidates,
 * candidate patch, blueprint, book contract).
 *
 * Domain-aware rewrites for English-language serialized fiction — NOT literal
 * string swaps of the zh anchors. Each variant reuses its zh anchor's
 * `outputSchema` (JSON shape is language-independent) and input type. The
 * `contextPolicy` (including required/preferred groups and drop order) is
 * copied verbatim; only the render is an English fiction-craft rewrite.
 * Registered alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 */

const DIRECTOR_PRESET_HINTS_EN: Record<DirectorCorrectionPreset, string> = {
  more_hooky: "Hookier: strengthen the opening pull, the payoff density, and the follow-reading hooks.",
  stronger_conflict: "Stronger conflict: raise the intensity of the mainline conflict; make progression tighter and more direct.",
  sharper_protagonist: "Sharper protagonist: boost the protagonist's recognizability, desire drive, and character tags.",
  more_grounded: "More grounded: strengthen realistic texture, daily-life detail, and behavioral logic.",
  lighter_ending: "Lighter ending: keep a sense of hope in the ending; do not make it overly heavy.",
};

function formatPresetHintsEn(presets: DirectorCorrectionPreset[]): string {
  if (presets.length === 0) {
    return "none";
  }
  return presets
    .map((preset) => DIRECTOR_PRESET_HINTS_EN[preset] ?? preset)
    .join("\n");
}

function formatCandidateDigestEn(candidate: DirectorCandidate, index: number): string {
  return [
    `option ${index + 1}: ${candidate.workingTitle}`,
    `logline: ${candidate.logline}`,
    `positioning: ${candidate.positioning}`,
    `selling point: ${candidate.sellingPoint}`,
    `core conflict: ${candidate.coreConflict}`,
    `protagonist path: ${candidate.protagonistPath}`,
    `hook strategy: ${candidate.hookStrategy}`,
    `progression loop: ${candidate.progressionLoop}`,
    `ending direction: ${candidate.endingDirection}`,
  ].join("\n");
}

function formatLatestBatchDigestEn(batches: DirectorCandidateBatch[]): string {
  const latestBatch = batches.at(-1);
  if (!latestBatch) {
    return "No previous batch.";
  }
  return [
    `${latestBatch.roundLabel}: ${latestBatch.refinementSummary?.trim() || "latest candidate round"}`,
    ...latestBatch.candidates.map((candidate, index) => formatCandidateDigestEn(candidate, index)),
  ].join("\n\n");
}

export const directorCandidatesPromptEn: PromptAsset<
  DirectorCandidatePromptInput,
  typeof directorCandidateResponseSchema._output
> = {
  id: "novel.director.candidates",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.directorCandidates,
    requiredGroups: ["idea_seed"],
    preferredGroups: ["project_context", "preset_hints", "freeform_feedback"],
    dropOrder: ["latest_batch"],
  },
  outputSchema: directorCandidateResponseSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are the book-level direction-planning director for a long-form serialized novel, serving beginner users who do not understand the writing workflow.",
      "Your task is NOT to expand an outline or write chapters, but to generate, from the seed idea, a batch of candidate direction cards that can immediately move on to whole-book planning.",
      "",
      "[Task Boundary]",
      "This stage only produces book-level candidate cards. Do not expand outlines, drop into chapters, go into scene detail, or write character profiles.",
      `You must output exactly ${input.count} candidates — no more, no less.`,
      "Output strict JSON only. No Markdown, explanations, comments, or extra text.",
      "",
      "[Field Requirements]",
      "Each candidate must fully contain: workingTitle, logline, positioning, sellingPoint, coreConflict, protagonistPath, endingDirection, hookStrategy, progressionLoop, whyItFits, toneKeywords, targetChapterCount.",
      "Optional field titleOptions (at most 4 entries): alternative book titles for cover display and click-through testing. Each entry must contain title, clickRate (an integer from 35-99), and style.",
      "style may only be one of these four lowercase English values: literary, conflict, suspense, high_concept (consistent with the title workshop). Do not use other labels, synonyms, or spellings.",
      "angle and reason are optional; output no fields other than titleOptions beyond the listed ones.",
      "If no title alternatives are needed, you may omit titleOptions or set it to an empty array.",
      "Do not omit fields, rename fields, or add fields outside the schema.",
      "",
      "[Core Requirements]",
      "1. workingTitle must be a readable working book title suitable for cover display. Do not write it as a pitch slogan, a worldbuilding concept phrase, or a stale re-skinned name.",
      "2. logline must clearly state: who this is about, in what circumstance, facing what core conflict, and in what direction it will unfold.",
      "3. positioning must state this book's position in genre, reading satisfaction, or reader perception — not a vague label like 'power fantasy' or 'growth story'.",
      "4. sellingPoint must highlight the core selling point of this direction that most makes it worth continuing into whole-book planning.",
      "5. coreConflict must state the real main conflict that can sustain long serialization — not a single passing event.",
      "6. protagonistPath must show the protagonist's long-term arc of change, not a static character description.",
      "7. endingDirection gives only a high-level terminal direction; do not lock in a detailed ending.",
      "8. hookStrategy must explain how the early chapters hook readers into following along — not a vague 'create suspense'.",
      "9. progressionLoop must explain what loop the book mainly progresses on, e.g. leveling up, maneuvering, exploration, relationship fracturing, task fulfillment.",
      "10. whyItFits must explain why this candidate fits the current user input, not praise the candidate itself.",
      "11. toneKeywords must be keywords that help calibrate later creation. Avoid stacking vague lyrical words.",
      "12. targetChapterCount must be a sensible whole-book target volume that matches the genre density and progression style.",
      "",
      "[Differentiation Requirements]",
      "1. Candidates must differ clearly in direction. They must not be just word swaps, name changes, or light re-skins of the same setup.",
      "2. Differentiation should show up first in: main selling point, main conflict shape, protagonist path, progression loop, emotional tone, and ending direction.",
      "3. Multiple candidates must not share a nearly identical hookStrategy or progressionLoop.",
      "4. Every candidate must be a complete, whole-book direction that can move on to planning — not a vague concept or a half-finished sketch.",
      "",
      "[Quality Requirements]",
      "1. Prioritize clear, beginner-friendly directions. Do not be deliberately obscure or complex.",
      "2. Do not invent large unrelated setting blocks that depart from the context.",
      "3. If the previous round already had clearly unsuitable directions, proactively avoid repeating them.",
      "4. When information is insufficient, conservative completion is allowed, but every candidate must remain complete, actionable, and distinguishable.",
    ].join("\n")),
    new HumanMessage([
      "Based on the context below, generate the book-level candidate directions.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Project context supplement]",
      formatProjectContext(input.context) || "none",
      "",
      "[Previous round of candidates]",
      formatLatestBatchDigestEn(input.batches),
      "",
      "[Preset corrections]",
      formatPresetHintsEn(input.presets),
      "",
      "[Freeform correction notes]",
      input.feedback?.trim() || "none",
      "",
      "[Output requirements]",
      `- You must output exactly ${input.count} candidates`,
      "- Output strict JSON only",
      "- Every candidate must be directly usable for follow-on whole-book planning",
      "- Prioritize candidate differentiation, actionability, and beginner comprehensibility",
    ].join("\n")),
  ],
};

export const directorCandidatePatchPromptEn: PromptAsset<
  DirectorCandidatePatchPromptInput,
  typeof directorCandidateSchema._output
> = {
  id: "novel.director.candidate_patch",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.directorCandidatePatch,
    requiredGroups: ["idea_seed"],
    preferredGroups: ["project_context", "preset_hints", "freeform_feedback", "latest_batch"],
    dropOrder: ["latest_batch"],
  },
  outputSchema: directorCandidateSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are the book-level direction-patching director for a long-form serialized novel, serving beginner users who do not understand the writing workflow.",
      "Your task is NOT to re-brainstorm two new directions, but to make a targeted patch on the one candidate the user already leans toward.",
      "",
      "[Task Boundary]",
      "Output exactly 1 patched, complete candidate card.",
      "You must preserve the core direction of the original candidate. Do not turn it into a completely different book.",
      "Output strict JSON only. No Markdown, explanations, comments, or extra text.",
      "",
      "[Patching Principles]",
      "1. Prioritize responding to the real points of dissatisfaction in the user's feedback. Do not redo the entire direction.",
      "2. You may adjust workingTitle, logline, positioning, sellingPoint, coreConflict, protagonistPath, endingDirection, hookStrategy, progressionLoop, whyItFits, toneKeywords, targetChapterCount.",
      '3. If the user says "I lean toward this one but some parts are off", sharpen this one rather than starting over from scratch.',
      "4. After patching, the candidate must still be complete, clear, and ready to move on to whole-book planning.",
      "",
      "[Field Requirements]",
      "The output must fully contain: workingTitle, logline, positioning, sellingPoint, coreConflict, protagonistPath, endingDirection, hookStrategy, progressionLoop, whyItFits, toneKeywords, targetChapterCount.",
      "Optional field titleOptions (at most 4 entries): each entry contains title, clickRate (35-99), and style; style may only be one of literary, conflict, suspense, high_concept (lowercase English).",
      "If no title alternatives are needed, you may omit titleOptions or set it to an empty array.",
      "Do not omit fields, rename fields, or add fields outside the schema.",
      "",
      "[Quality Requirements]",
      "1. After patching, the direction should fit the user's taste more closely than the original — not become more abstract.",
      "2. If the user asks for more urban feel, more realism, stronger hooks, or harder conflict, deliver that in the selling point, conflict, and progression loop — not just by swapping a few words.",
      "3. workingTitle must still read like a cover-displayable serialized-fiction book title. Do not regress into a concept phrase or a stale generic name.",
      "4. whyItFits must explain why this patch is closer to the user's feedback.",
    ].join("\n")),
    new HumanMessage([
      "Based on the context below, make a targeted patch on the selected candidate.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Project context supplement]",
      formatProjectContext(input.context) || "none",
      "",
      "[Currently selected candidate]",
      formatCandidateDigestEn(input.candidate, 0),
      "",
      "[Previous round of candidates]",
      formatLatestBatchDigestEn(input.batches),
      "",
      "[Preset corrections]",
      formatPresetHintsEn(input.presets),
      "",
      "[User feedback]",
      input.feedback.trim(),
      "",
      "[Output requirements]",
      "- Output exactly 1 patched, complete candidate JSON",
      "- Preserve the main direction of the original candidate; do not remake it into a completely different book",
      "- Prioritize fixing the points the user flagged",
    ].join("\n")),
  ],
};

export const directorBlueprintPromptEn: PromptAsset<
  DirectorBlueprintPromptInput,
  typeof directorPlanBlueprintSchema._output
> = {
  id: "novel.director.blueprint",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.directorBlueprint,
    requiredGroups: ["book_contract", "idea_seed", "macro_constraints"],
    preferredGroups: ["project_context"],
  },
  outputSchema: directorPlanBlueprintSchema,
  render: (input, context) => [
    new SystemMessage([
      "You are the master-planning director for a long-form serialized novel, responsible for expanding the confirmed book-level direction into an executable blueprint.",
      "Your task is NOT to write body text or expand scenes, but to plan the whole book down to the book -> arc -> chapter shell layer.",
      "",
      "[Task Boundary]",
      "This stage only produces bookPlan and arcs. Do not drop into scene-level detail, fill in a character encyclopedia, or fill in a worldbuilding encyclopedia.",
      "The output must be strict JSON with only the structure {\"bookPlan\":{...},\"arcs\":[...]}.",
      "No Markdown, explanations, comments, or extra text.",
      "",
      "[Chapter shell field requirements]",
      "Every chapter must fully contain: title, objective, expectation, planRole, hookTarget, participants, reveals, riskNotes, mustAdvance, mustPreserve, scenes.",
      "scenes must be returned as an empty array. You must not expand scene detail at this stage.",
      "planRole may only be one of: setup, progress, pressure, turn, payoff, cooldown.",
      "",
      "[Planning Principles]",
      "1. The overall structure must support long serialization. Do not over-detail the back half down to scene level too early.",
      "2. bookPlan is responsible for the whole-book promises, the mainline, the phased progression, and overall pacing control.",
      "3. arcs must show a clear phase function. They must not be just a mechanical grouping of chapters.",
      "4. Each arc must explain why it exists on its own — which phase promise, conflict escalation, or relationship change it owns.",
      "5. Every chapter shell must let a beginner see at a glance: what this chapter must advance, what it must preserve, and what it must leave hanging at the end.",
      "",
      "[Chapter shell quality requirements]",
      "1. title must read like a real chapter-planning title that reflects this chapter's core progression.",
      "2. objective must state this chapter's most central advancement task. Do not write it as a vague summary.",
      "3. expectation must state what the reader mainly expects to see paid off or changed in this chapter.",
      "4. hookTarget must state what new point of attention or pressure point the end of this chapter should push the reader toward.",
      "5. participants must contain only the actual key participants of this chapter. Do not pile on characters indiscriminately.",
      "6. reveals must state the key information or perception change this chapter should expose. If there is none, fill conservatively. Do not force a big twist.",
      "7. riskNotes must point out the risks most likely to make this chapter go crooked, hollow, or out of bounds.",
      "8. mustAdvance and mustPreserve must be concrete, short, and actionable. Do not write filler.",
      "",
      "[Pacing Requirements]",
      "1. Early chapter shells should quickly establish the situation, the main selling point, and the follow-reading hook.",
      "2. The middle should show escalation, maneuvering, turning, or rising cost. Avoid a flat push.",
      "3. The late part should show phased payoffs, a concentrated climax, and an entry into what comes next.",
      "4. Different arcs must differ in phase function. Multiple arcs must not be just synonymous escalations.",
      "",
      "[Prohibitions]",
      "Do not generate new core setting blocks, character profiles, or a worldbuilding encyclopedia.",
      "Do not put content inside scenes.",
      "Do not substitute vague words for actionable planning, e.g. 'increase tension' or 'advance the plot'.",
      "Do not write every chapter as the same functional template.",
      "",
      "[Generation Principles]",
      "When information is insufficient, conservative completion is allowed, but the structure must stay complete, the phases clear, and the result refinable.",
    ].join("\n")),
    new HumanMessage([
      "Based on the context below, output the whole-book execution blueprint.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Target total chapter count]",
      String(input.targetChapterCount),
      "",
      "[Output requirements]",
      "- Output strict JSON only",
      '- The structure may only be {"bookPlan":{...},"arcs":[...]}',
      "- Plan only down to chapter shell",
      "- scenes must all be empty arrays",
      "- Prioritize long-serialization sustainability, phase differentiation, and beginner actionability",
    ].join("\n")),
  ],
};

export const directorBookContractPromptEn: PromptAsset<
  DirectorBookContractPromptInput,
  typeof directorBookContractSchema._output
> = {
  id: "novel.director.book_contract",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.directorBookContract,
    requiredGroups: ["book_contract", "idea_seed"],
    preferredGroups: ["project_context", "macro_constraints"],
  },
  outputSchema: directorBookContractSchema,
  structuredOutputHint: {
    mode: "auto",
    note: "absoluteRedLines must contain 2 to 6 entries. If you would exceed 6, merge similar red-lines first before outputting.",
    example: {
      readingPromise: "Example: what kind of follow-reading satisfaction is sustained.",
      protagonistFantasy: "Example: the core wish-fulfillment hook from the protagonist's POV.",
      coreSellingPoint: "Example: the book's most irreplaceable core selling point.",
      chapter3Payoff: "Example: the hook the first 3 chapters must deliver.",
      chapter10Payoff: "Example: the phased payoff around chapter 10.",
      chapter30Payoff: "Example: the mid-section promise delivered around chapter 30.",
      escalationLadder: "Example: the whole-book escalation ladder.",
      relationshipMainline: "Example: the core relationship line that drives long-term progression.",
      absoluteRedLines: [
        "Example red-line 1",
        "Example red-line 2",
        "Example red-line 3",
      ],
    },
  },
  render: (input, context) => [
    new SystemMessage([
      "You are the master director of a long-form serialized web novel, responsible for collapsing the confirmed book-level direction into the book's Book Contract.",
      "You serve beginner users who do not understand the writing workflow.",
      "Your task is NOT to rewrite the outline, but to distill the high-level creation contract that all later planning for this book must obey.",
      "",
      "[Task Boundary]",
      "Output strict JSON only. No explanatory text, Markdown, comments, or extra fields.",
      "You must output the fields: readingPromise, protagonistFantasy, coreSellingPoint, chapter3Payoff, chapter10Payoff, chapter30Payoff, escalationLadder, relationshipMainline, absoluteRedLines.",
      "",
      "[Field Requirements]",
      "1. readingPromise must state clearly what reading satisfaction this book keeps giving the reader, and explain why the reader will keep following.",
      "2. protagonistFantasy must state the core wish-fulfillment or payoff carried from the protagonist's POV. Do not write it vaguely as a character tag.",
      "3. coreSellingPoint must point to this book's most irreplaceable main selling point — not an even listing of several selling points.",
      "4. chapter3Payoff, chapter10Payoff, chapter30Payoff must reflect a clear serialization payoff rhythm, stating what phased satisfaction the reader gets at each stage.",
      "5. escalationLadder must reflect the whole book's main escalation ladder or rising-pressure path — not an abstract 'it keeps getting harder'.",
      "6. relationshipMainline must state clearly how the core relationship line drives long-term progression. Do not just describe the current state of relationships.",
      "7. absoluteRedLines must be explicit no-go zones that can stop the story from going crooked, the selling point from drifting, or the characters from losing shape.",
      "",
      "[Core Principles]",
      "1. The Book Contract must be short and hard enough to guide later volume splitting, chapter breakdown, continuation, and review.",
      "2. It is not a promotional blurb; it is a creation constraint document.",
      "3. It must serve early pull, mid-section endurance, and long-term serialization stability at the same time.",
      "4. It must be clear to a beginner user. Do not write it as vague, abstract literary criticism.",
      "",
      "[Quality Requirements]",
      "1. chapter3Payoff should lean toward the book-opening hook and fast payoff.",
      "2. chapter10Payoff should reflect the first phased return or situation change after the early section is established.",
      "3. chapter30Payoff should reflect a more stable mid-section promise payoff or a phased big leap.",
      "4. escalationLadder should match the genre, the main selling point, and the growth logic.",
      "5. absoluteRedLines must be concrete and actionable. Avoid filler like 'don't break it' or 'keep it consistent'.",
      "",
      "[Generation Principles]",
      "When information is insufficient, conservative completion is allowed, but every field must genuinely be able to constrain later creation.",
    ].join("\n")),
    new HumanMessage([
      "Based on the context below, output the Book Contract for this book.",
      "",
      "[Layered context]",
      renderSelectedContextBlocks(context),
      "",
      "[Target total chapter count]",
      String(input.targetChapterCount),
      "",
      "[Output requirements]",
      "- Output strict JSON only",
      "- You must fully output all the specified fields",
      "- Prioritize constrainability, actionability, and value as serialization-rhythm guidance",
    ].join("\n")),
  ],
};

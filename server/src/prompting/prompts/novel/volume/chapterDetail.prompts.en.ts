import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { renderSelectedContextBlocks } from "../../../core/renderContextBlocks";
import { type VolumeChapterDetailPromptInput } from "./shared";
import {
  volumeChapterBoundaryPrompt,
  volumeChapterExecutionContractPrompt,
  volumeChapterPurposePrompt,
  volumeChapterTaskSheetPrompt,
} from "./chapterDetail.prompts";

/**
 * English variants of the `novel.volume.chapter_*` detail prompts (purpose /
 * boundary / task_sheet / execution_contract).
 *
 * Domain-aware rewrites for English-language serialized web fiction — NOT literal
 * string swaps of the zh anchors. Each variant is derived from its zh anchor via
 * object spread, so it reuses the zh anchor's `outputSchema` (referential
 * equality holds), `contextPolicy`, `semanticRetryPolicy`, and `postValidate`
 * unchanged; only `language` and `render` are overridden. Registered alongside
 * the zh anchors; the runner swaps to a variant only when `options.locale ===
 * "en"`.
 */

function buildChapterDetailPromptEn(
  contextText: string,
  detailMode: VolumeChapterDetailPromptInput["detailMode"],
): string {
  return [
    `detail mode: ${detailMode}`,
    "",
    "chapter detail context:",
    contextText,
  ].join("\n");
}

function createVolumeDetailSystemPromptEn(
  detailMode: VolumeChapterDetailPromptInput["detailMode"],
): string {
  if (detailMode === "purpose") {
    return [
      "You are a senior web-fiction chapter editor.",
      "Your current task is to lock down a single chapter's purpose.",
      "Output strict JSON only, containing only the purpose field.",
      "purpose must state what this chapter advances; do not restate the summary.",
    ].join("\n");
  }
  if (detailMode === "boundary") {
    return [
      "You are a senior web-fiction chapter editor.",
      "Your current task is to define the execution boundary for a single chapter.",
      "Output strict JSON only, containing only exclusiveEvent, endingState, nextChapterEntryState, conflictLevel, revealLevel, targetWordCount, mustAvoid, payoffRefs.",
      "exclusiveEvent is the one-time milestone event that only this chapter may carry; it must be concrete, never a vague theme.",
      "endingState is the stable situation once this chapter is finished.",
      "nextChapterEntryState is the entry state the next chapter should pick up at its opening; it must be strongly tied to endingState but must not repeat it word for word.",
      "The boundary contract must guarantee: the previous chapter's completed exclusive event is not repeated, this chapter's exclusive event does not leak forward into the next chapter, and the next chapter only inherits state without re-enacting this chapter's milestone.",
      "Every field must stay consistent with the current volume's pacing and the adjacent chapters.",
      "If conflict_level_curve marks a user-anchored conflictLevel, that value is a hard constraint and must not be rewritten.",
    ].join("\n");
  }
  return [
    "You are a senior web-fiction chapter editor.",
    "Your current task is to produce a chapter execution contract that can be handed directly to the body-text generator.",
    "Output strict JSON only, containing only the two fields taskSheet and sceneCards.",
    "taskSheet is a concise execution summary for the user to read; it must cover the emotional tone, the conflict target, the key progression, and the ending requirement.",
    "sceneCards must be an array of 3-8 scene cards, and each scene card must contain key, title, purpose, mustAdvance, mustPreserve, entryState, exitState, forbiddenExpansion, targetWordCount.",
    "sceneCards must fully cover the whole chapter's progression and its ending hook; do not compress the entire chapter into a single scene.",
    "The current chapter's title, summary, purpose, exclusiveEvent, endingState, nextChapterEntryState, conflictLevel, revealLevel, mustAvoid, and payoffRefs together form this chapter's hard boundary contract. taskSheet and sceneCards may only execute the current chapter's contract; they must not rewrite or override it.",
    "You must treat chapter_neighbors as adjacent-chapter boundary hints: a key first-time event already completed in the previous chapter must not be rewritten here, and a key first-time event named in the next chapter's title or summary must not be pulled forward into this chapter.",
    "This chapter's ending may only push the situation up to the next chapter's entry; it must not fully deliver the core milestone promised by the next chapter's title.",
    "If an adjacent chapter's title already clearly marks a one-time node — for example system activation, acquiring the first resource, identity exposure, a key audit, or formally volunteering — this chapter must not take on that node again, unless the current chapter's own contract explicitly requires it.",
    "You must first identify the risk of narrative repetition between the recent chapters' execution contracts and the current chapter, focusing on whether the opening style, progression style, state change, and ending hook are being reused back to back.",
    "If recent chapters have used the same kind of opening or the same kind of progression consecutively, this chapter must actively switch and must not keep running the same playbook.",
    "The differentiation requirement must be realized inside taskSheet and sceneCards, not left as an abstract reminder.",
    "The first sceneCard must, through its purpose, entryState, or forbiddenExpansion, clearly steer away from the recent chapters' repeated opening.",
    "At least one middle sceneCard's mustAdvance must explicitly require a progression result different from the recent chapters, for example active probing, relationship building, resource gain, rule comprehension, or a plan pivot.",
    "If recent chapters have consecutively relied on external pressure or passive escape, this chapter must not keep advancing on the same kind of pressure alone; it must introduce a new progression mechanism.",
  ].join("\n");
}

function createExecutionContractSystemPromptEn(): string {
  return [
    "You are a senior web-fiction chapter editor.",
    "Your current task is to produce, in a single pass, a chapter execution contract that can be handed directly to the writer.",
    "Output strict JSON only, and it must contain all of purpose, exclusiveEvent, endingState, nextChapterEntryState, conflictLevel, revealLevel, targetWordCount, mustAvoid, payoffRefs, taskSheet, sceneCards.",
    "purpose states in one sentence what this chapter actually advances; do not write it as a summary restatement.",
    "Fields such as exclusiveEvent / endingState / nextChapterEntryState must not be missing; they are the chapter's hard boundary contract.",
    "taskSheet is a concise execution instruction for the body-text writer; sceneCards is the execution breakdown into 3-8 scene cards.",
    "taskSheet and sceneCards may only execute the current chapter's contract; they must not pre-empt an adjacent chapter's one-time event, nor rewrite a milestone already completed in the previous chapter.",
    "If conflict_level_curve marks a user-anchored conflictLevel, that value is a hard constraint and must not be rewritten.",
    "If recent chapters have consecutively used the same opening, the same progression playbook, or the same kind of hook, this chapter must actively differentiate through sceneCards.",
  ].join("\n");
}

export const novelVolumeChapterPurposePromptEn: typeof volumeChapterPurposePrompt = {
  ...volumeChapterPurposePrompt,
  language: "en",
  render: (input, context) => [
    new SystemMessage(createVolumeDetailSystemPromptEn("purpose")),
    new HumanMessage(buildChapterDetailPromptEn(renderSelectedContextBlocks(context), input.detailMode)),
  ],
};

export const novelVolumeChapterBoundaryPromptEn: typeof volumeChapterBoundaryPrompt = {
  ...volumeChapterBoundaryPrompt,
  language: "en",
  render: (input, context) => [
    new SystemMessage(createVolumeDetailSystemPromptEn("boundary")),
    new HumanMessage(buildChapterDetailPromptEn(renderSelectedContextBlocks(context), input.detailMode)),
  ],
};

export const novelVolumeChapterTaskSheetPromptEn: typeof volumeChapterTaskSheetPrompt = {
  ...volumeChapterTaskSheetPrompt,
  language: "en",
  render: (input, context) => [
    new SystemMessage(createVolumeDetailSystemPromptEn("task_sheet")),
    new HumanMessage(buildChapterDetailPromptEn(renderSelectedContextBlocks(context), input.detailMode)),
  ],
};

export const novelVolumeChapterExecutionContractPromptEn: typeof volumeChapterExecutionContractPrompt = {
  ...volumeChapterExecutionContractPrompt,
  language: "en",
  render: (input, context) => [
    new SystemMessage(createExecutionContractSystemPromptEn()),
    new HumanMessage(buildChapterDetailPromptEn(renderSelectedContextBlocks(context), input.detailMode)),
  ],
};

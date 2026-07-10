import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChapterExecutionContractQualityCandidate } from "@ai-novel/shared/types/chapterTaskSheetQuality";
import {
  chapterTaskSheetQualityPrompt,
  type ChapterTaskSheetQualityPromptInput,
} from "./chapterTaskSheetQuality.prompts";

/**
 * English variant of `novel.volume.chapter_task_sheet_quality@v1`.
 *
 * Domain-aware rewrite for English-language serialized web fiction — NOT a literal
 * string swap of the zh anchor. Derived from the zh anchor via object spread, so
 * it reuses the zh anchor's `outputSchema`
 * (`aiChapterTaskSheetQualityAssessmentSchema`, referential equality holds) and
 * `contextPolicy` unchanged; only `language` and `render` are overridden.
 * Registered alongside the zh anchor; the runner swaps to this variant only when
 * `options.locale === "en"`.
 */

function renderNullable(value: string | number | string[] | null | undefined): string {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(" | ") : "none";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return value?.trim() || "none";
}

function renderCandidate(candidate: ChapterExecutionContractQualityCandidate): string {
  return [
    `novelId: ${candidate.novelId}`,
    `volumeId: ${renderNullable(candidate.volumeId)}`,
    `chapterId: ${candidate.chapterId}`,
    `chapterOrder: ${candidate.chapterOrder}`,
    `title: ${candidate.title}`,
    `summary: ${renderNullable(candidate.summary)}`,
    `purpose: ${renderNullable(candidate.purpose)}`,
    `exclusiveEvent: ${renderNullable(candidate.exclusiveEvent)}`,
    `endingState: ${renderNullable(candidate.endingState)}`,
    `nextChapterEntryState: ${renderNullable(candidate.nextChapterEntryState)}`,
    `conflictLevel: ${renderNullable(candidate.conflictLevel)}`,
    `revealLevel: ${renderNullable(candidate.revealLevel)}`,
    `targetWordCount: ${renderNullable(candidate.targetWordCount)}`,
    `mustAvoid: ${renderNullable(candidate.mustAvoid)}`,
    `payoffRefs: ${renderNullable(candidate.payoffRefs ?? [])}`,
    "",
    "taskSheet:",
    renderNullable(candidate.taskSheet),
    "",
    "sceneCards:",
    renderNullable(candidate.sceneCards),
  ].join("\n");
}

function createSystemPromptEn(mode: ChapterTaskSheetQualityPromptInput["mode"]): string {
  const modeRule = mode === "full_book_autopilot"
    ? "This is full-book autopilot mode. You must judge whether the system can auto-repair and continue, and must not push ordinary writing-quality problems onto a novice user."
    : "This is AI-copilot or manual mode. You must flag whether user confirmation is needed, so that an unreliable contract is not silently synced into the body-text execution chain.";
  return [
    "You are a quality evaluator for web-fiction chapter execution contracts.",
    "Your task is to judge whether purpose, the chapter boundary, taskSheet, and sceneCards are sufficient to hand to the body-text generator for execution.",
    modeRule,
    "Only evaluate the current chapter contract; do not expand body text and do not rewrite the task sheet.",
    "A usable contract must satisfy: this chapter's goal is clear, the boundary does not cross into other chapters, the task sheet is executable, the scene cards cover the whole chapter's progression and its ending hook, and the prohibitions are enough to constrain body-text generation.",
    "Also judge whether this chapter has been stuffed with too many must-deliver obligations that compete for length; if the task sheet shows the current chapter's duties are already overloaded, set loadRisk=overloaded and recommendedHandling=replan_window.",
    "If the problem can still be closed within this chapter's contract, set recommendedHandling=repair_contract; only use use_as_is when the contract is already stable enough.",
    "If problems exist, give concrete repairGuidance aimed at the auto-repairer.",
    "",
    "Output strict JSON; no Markdown, comments, explanations, or extra fields.",
    "The top level may only output verdict, safeToSync, loadRisk, recommendedHandling, summary, issues, repairGuidance, confidence.",
    "verdict may only use usable, repairable, unusable.",
    "loadRisk may only use normal, overloaded.",
    "recommendedHandling may only use use_as_is, repair_contract, replan_window.",
    "Each issues item may only contain id, severity, target, summary, repairHint.",
    "issues.severity may only use low, medium, high.",
    "issues.target may only use purpose, boundary, task_sheet, scene_cards, semantic; pacing, repetition, duty overload, insufficient agency, and obligation conflicts all fall under semantic.",
    "confidence must be a decimal between 0 and 1; do not output a percentage-scale number.",
    "Do not output custom enum values such as pass, accepted, ok, blocked, pacing, plot, load.",
    "",
    "JSON shape example:",
    "{",
    "  \"verdict\": \"repairable\",",
    "  \"safeToSync\": false,",
    "  \"loadRisk\": \"normal\",",
    "  \"recommendedHandling\": \"repair_contract\",",
    "  \"summary\": \"The chapter contract's goal is clear, but the scene cards lack an ending hook.\",",
    "  \"issues\": [",
    "    {",
    "      \"id\": \"scene_cards_missing_hook\",",
    "      \"severity\": \"medium\",",
    "      \"target\": \"scene_cards\",",
    "      \"summary\": \"The scene cards do not cover the end-of-chapter reading pull.\",",
    "      \"repairHint\": \"Add the exit state of the final scene and the entry pressure for the next chapter.\"",
    "    }",
    "  ],",
    "  \"repairGuidance\": [\"Fill in the final scene's hook and exit state.\"],",
    "  \"confidence\": 0.82",
    "}",
  ].join("\n");
}

export const novelVolumeChapterTaskSheetQualityPromptEn: typeof chapterTaskSheetQualityPrompt = {
  ...chapterTaskSheetQualityPrompt,
  language: "en",
  render: (input) => [
    new SystemMessage(createSystemPromptEn(input.mode)),
    new HumanMessage([
      `mode: ${input.mode}`,
      "",
      "chapter execution contract candidate:",
      renderCandidate(input.candidate),
    ].join("\n")),
  ],
};

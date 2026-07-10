import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import { NOVEL_PROMPT_BUDGETS } from "./promptBudgetProfiles";
import {
  timelineExtractorOutputSchema,
  type TimelineExtractorOutput,
  type TimelineExtractorPromptInput,
} from "./timelineExtractor.prompts";

/**
 * English variant of `novel.timeline.extractor@v1`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. It reuses the zh anchor's `outputSchema`
 * (`timelineExtractorOutputSchema`; JSON shape is language-independent) and its
 * input/output types. `taskType`, `mode`, and the whole `contextPolicy` are
 * copied verbatim; the `structuredOutputHint` note/example are translated to
 * English. Registered alongside the zh anchor; the runner swaps to this variant
 * only when `options.locale === "en"`.
 */
export const novelTimelineExtractorPromptEn: PromptAsset<
  TimelineExtractorPromptInput,
  TimelineExtractorOutput
> = {
  id: "novel.timeline.extractor",
  version: "v1",
  taskType: "review",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterArtifactDelta,
    requiredGroups: [],
    preferredGroups: [],
    dropOrder: [],
  },
  outputSchema: timelineExtractorOutputSchema,
  structuredOutputHint: {
    note: "stateChanges.before / stateChanges.after are human-readable state values and must be emitted as JSON strings; numeric values such as a bad-review count, a rating score, a countdown, or a quantity are also written as strings like \"19\" or \"5\".",
    example: {
      timeAnchor: {
        storyDayIndex: 1,
        label: "Chapter 2",
      },
      addressedHookIds: ["hook-id-from-context"],
      resolvedHookIds: [],
      events: [{
        title: "The protagonist completes one state advance",
        summary: "The body text confirms a key change that will affect later continuity.",
        type: "plot",
        participantNames: ["Character Name"],
        locationName: "Location Name",
        stateChanges: [{
          targetType: "item",
          targetId: "bad-review count",
          field: "value",
          before: "19",
          after: "5",
          certainty: "confirmed",
        }],
        possibleHooks: [{
          title: "The enemy leaves a new probing trace",
          description: "The chapter ends by confirming the enemy will keep probing; later chapters need to pick up this pressure.",
          priority: "medium",
          resolveMode: "short_arc",
          blocking: false,
        }],
        occurred: true,
        confidence: 0.9,
        matchedPlannedEventIds: [],
      }],
      hooks: [{
        title: "The protagonist verifies the clue next",
        description: "The protagonist has obtained a clue but has not yet verified whether it is true; a verification action must be arranged later.",
        priority: "medium",
        resolveMode: "long_arc",
        blocking: false,
      }],
      stateChanges: [{
        targetType: "item",
        targetId: "bad-review count",
        field: "value",
        before: "19",
        after: "5",
        certainty: "confirmed",
      }],
    },
  },
  render: (input) => [
    new SystemMessage([
      "You are a novel timeline event extractor.",
      "Extract only events that affect later continuity, chronological order, character state, foreshadow pickup, or reader awareness.",
      "Do not extract ordinary scenery description, emotional atmosphere, consequence-free actions, or repeated recaps.",
      "You must output strict JSON; do not output Markdown or explanations.",
      "",
      "[Extraction rules]",
      "1. events holds only the key events that actually happen or are explicitly confirmed in the body text.",
      "2. possibleHooks/hooks hold only the hooks newly created at this chapter's end or in the body that later chapters must pick up.",
      "3. Every hook must be tagged with a resolveMode: immediate / short_arc / long_arc.",
      "4. Mark blocking=true only for a hook that the next chapter must pick up immediately and whose neglect would break the current chapter's contract.",
      "5. stateChanges records explicit changes to a character, location, faction, relationship, item, or world state.",
      "6. If the body text prematurely writes content that the timeline context forbids from happening early, still extract it faithfully; a later checker will judge it.",
      "7. Fill matchedPlannedEventIds only when the body text actually completes a planned event; otherwise leave it empty.",
      "8. If the body picks up an open/addressed hook from the timeline context, you must put the corresponding hook id into addressedHookIds; if that hook has been fully paid off and should no longer pollute later chapters, put it into resolvedHookIds.",
      "9. Hook ids must come from the timeline context and must not be fabricated; judge pickup relationships by the body's semantics, not by literal title matches.",
      "10. stateChanges.before / stateChanges.after are state text for later continuity reading and must be emitted as strings; even when the body's state is a number, write it as a JSON string, e.g. \"19\", \"5\", \"76\".",
      "11. events.type may only use plot, relationship, conflict, reveal, battle, decision, setup, payoff, transition, background, world_state; use these literal values exactly and do not translate or localize them.",
      "12. stateChanges.targetType may only use character, location, faction, relationship, item, world; use these literal values exactly and do not translate or localize them.",
      "13. possibleHooks and hooks must be arrays of objects, each object containing title, description, priority, resolveMode, blocking; do not output arrays of strings.",
      "14. hook.priority may only use low, medium, high, critical.",
    ].join("\n")),
    new HumanMessage([
      `Novel: ${input.novelTitle}`,
      `Chapter: Chapter ${input.chapterOrder} "${input.chapterTitle}"`,
      `Chapter goal: ${input.chapterGoal}`,
      "",
      "[Pre-generation timeline constraints]",
      input.timelineContextText,
      "",
      "[Chapter body text]",
      input.chapterContent,
      "",
      "Output the timeline extraction JSON.",
    ].join("\n")),
  ],
};

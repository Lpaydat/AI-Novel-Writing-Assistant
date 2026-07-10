import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { renderSelectedContextBlocks } from "../../../core/renderContextBlocks";
import { createVolumeChapterListPrompt } from "./chapterList.prompts";

/**
 * English variant of `novel.volume.chapter_list@v7`.
 *
 * Domain-aware rewrite for English-language serialized web fiction — NOT a literal
 * string swap of the zh anchor. The zh anchor is produced by a factory
 * (`createVolumeChapterListPrompt(config)`); `createVolumeChapterListPromptEn`
 * mirrors that factory and reuses the zh anchor's `outputSchema`, `contextPolicy`,
 * `postValidate`, and `postValidateFailureRecovery` by spreading a zh anchor built
 * with the SAME resolved config. Only `language`, `render`, and
 * `semanticRetryPolicy` (whose retry messages are model-facing, so they are
 * re-authored in English) are overridden.
 *
 * The numeric-input default beat label is localized to an English placeholder
 * ("Target beat"): the zh numeric default ("target beat" in Chinese) is only a
 * registration-probe artifact, and in production the caller passes a real English
 * beat label. The zh anchor built here uses that same English label, so the render
 * and the schema's expected beat label stay consistent.
 */

type VolumeChapterListPromptConfig =
  | number
  | {
      targetChapterCount: number;
      targetBeatKey?: string;
      targetBeatLabel?: string | null;
    };

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function resolvePromptConfigEn(input: VolumeChapterListPromptConfig): {
  targetChapterCount: number;
  targetBeatKey: string;
  targetBeatLabel: string;
} {
  if (typeof input === "number") {
    return {
      targetChapterCount: input,
      targetBeatKey: "target_beat",
      targetBeatLabel: "Target beat",
    };
  }

  return {
    targetChapterCount: input.targetChapterCount,
    targetBeatKey: input.targetBeatKey?.trim() || "target_beat",
    targetBeatLabel: input.targetBeatLabel?.trim() || "Target beat",
  };
}

function buildRetryDirectiveEn(reason?: string | null): string {
  const normalizedReason = reason?.trim();
  if (!normalizedReason) {
    return "";
  }

  return [
    "The previous output failed business validation; this pass must fix it first:",
    normalizedReason,
    "First identify the failure type: title structure, basic title quality, chapter function, summary progression, or ending pull.",
    "Do not just replace the flagged chapter; if the problem comes from title homogeneity or repeated chapter functions, rearrange the whole set of title frames and the chapter-function allocation.",
  ].join("\n");
}

export function createVolumeChapterListPromptEn(
  input: VolumeChapterListPromptConfig,
  zhAnchor?: ReturnType<typeof createVolumeChapterListPrompt>,
): ReturnType<typeof createVolumeChapterListPrompt> {
  const { targetChapterCount, targetBeatKey, targetBeatLabel } = resolvePromptConfigEn(input);

  // Pass the registry's own zh instance as `zhAnchor` to make
  // `en.outputSchema === zh.outputSchema` hold; the default builds a fresh
  // (structurally identical) anchor from the same resolved config. The render
  // stays English regardless, so the no-Chinese guard passes either way.
  const base = zhAnchor ?? createVolumeChapterListPrompt({
    targetChapterCount,
    targetBeatKey,
    targetBeatLabel,
  });

  return {
    ...base,
    language: "en",

    semanticRetryPolicy: {
      maxAttempts: 2,
      buildMessages: ({ attempt, baseMessages, parsedOutput, validationError }) => {
        const normalizedValidationError = validationError?.trim() || "Chapter-list business validation did not pass.";
        return [
          ...baseMessages,
          new HumanMessage(
            [
              `The previous chapter block passed JSON-structure validation but failed business validation. This is semantic retry #${attempt}.`,
              `Failure reason (diagnostic): ${normalizedValidationError}`,
              "",
              "Rewrite requirements:",
              "1. Only rewrite the chapter list for the current pacing beat; do not generate chapters for other beats.",
              "2. Keep the original chapter count; the final chapters.length must still equal the target chapter count.",
              "3. Fix by failure type first: for title-structure problems rearrange the whole set of title frames; for basic title-quality problems rewrite every non-conforming title; for chapter-function problems reassign each chapter's duty; for summary-progression problems rewrite every vague summary; for ending-pull problems rewrite the last chapter's payoff and turn.",
              "4. Do not only locally replace the one chapter that triggered validation; make the whole set pass on title frames, chapter functions, summary progression, and ending pull at once.",
              "5. If the cause is repeated titles or clustered title frames, rewrite every title that hits a repeated frame, not just a few chapters.",
              "6. If the cause is repeated chapter functions, reassign chapter functions so that several chapters in a row do not only investigate, discover, realize, or set up.",
              "7. Each chapter summary must show new progression, prioritizing the core POV character's choice, probe, counter, scheme, exchange, restraint, or paying a price.",
              "8. Explicitly avoid heavy use of \"Y of X / Y within X / Ying in X\" frames.",
              "9. Explicitly avoid the whole batch collapsing into the \"A, B / four-beat action, four-beat result\" parallel template.",
              "10. Titles must be objective chapter names, no first person, not full plot sentences, core length at most 16 characters.",
              "11. Every chapter's beatKey must stay equal to the current target beatKey.",
              "12. Summaries must express the situation change this chapter causes, not vaguely restate the title.",
              "13. The last chapter must complete the current beat's mustDeliver while leaving reading pull, but must not prematurely deliver the next beat's core event.",
              "",
              "Previous JSON output:",
              safeJsonStringify(parsedOutput),
              "",
              "Now output the complete JSON object again.",
            ].join("\n"),
          ),
        ];
      },
    },

    render: (promptInput, context) => [
      new SystemMessage(
        [
          "You are a chapter-splitting planner for web fiction.",
          "Your task is not to write body text, nor to expand a detailed outline, but only to generate one executable block of the chapter list for a single pacing beat of the current volume.",
          "You must simultaneously satisfy: correct structured output, clear chapter functions, titles that read like chapter names, and summaries with real progression.",
          "",
          "I. Task boundary",
          `1. Right now you may only generate ${targetChapterCount} chapters for "${targetBeatLabel}" — no more and no fewer.`,
          "2. You may only cover the current target beat; you must not spill over into adjacent beats' chapters.",
          "3. Do not merge two chapters into one summary, and do not pad the count with vague placeholder chapters.",
          "4. If the beat's information is insufficient, you must still fill up to the exact chapter count, but only with conservative transitions — do not invent major new settings.",
          "5. This task only produces the chapter list; do not write body text, detailed scenes, or full dialogue.",
          "",
          "II. Hard output constraints",
          "1. The top level must output the four fields beatKey, beatLabel, chapterCount, chapters.",
          "2. Each chapter may only contain the three fields title, summary, beatKey; do not add fields.",
          `3. beatKey must strictly equal ${targetBeatKey}.`,
          `4. beatLabel must strictly equal ${targetBeatLabel}.`,
          `5. chapterCount and chapters.length must strictly equal ${targetChapterCount}.`,
          `6. Every chapter's beatKey must strictly equal ${targetBeatKey}.`,
          "7. Do not output Markdown, comments, explanations, or any extra text.",
          "",
          "III. Core chapter-planning principles",
          "1. The chapter list must strictly obey the current volume skeleton and the current target beat contract; it must not sneak into an adjacent beat.",
          "2. Every chapter must answer: why this chapter must exist, what it advances, and what new shift in the situation it causes.",
          "3. The chapter split for the current beat must feel like web-fiction reading, but must not be a mechanical even split.",
          "4. Chapters must form continuous progression; there must be no information-repeat chapters that only restate things with no new progression.",
          "5. Each chapter's summary must state not only what happened but also what therefore changed.",
          "",
          "IV. Chapter-function allocation requirements",
          "1. Before generating, mentally break the current beat into several chapter functions: pick-up, pressure, probe, discovery, turn, counter, payoff, aftermath, or hook.",
          "2. Do not expose these function labels in the output, but each chapter's summary must express a clear function.",
          "3. Consecutive chapters must not carry exactly the same function; in particular, do not have several chapters in a row that only investigate, discuss, set up, wait, realize, or discover.",
          "4. If the target chapter count is 5 or more, include at least one situation-pressure step, one key discovery or judgment reversal, and one staged payoff or clear turn.",
          "5. Key progressions may take more chapters; transitional chapters should be short and forceful — do not manufacture low-information chapters just to fill the count.",
          "6. The last chapter must complete the current beat's mustDeliver while leaving reading pull into the next beat, but must not prematurely deliver the next beat's core event.",
          "",
          "V. Chapter-progression quality requirements",
          "1. Each chapter's summary must express the core POV character's choice, probe, counter, restraint, exchange, scheme, exposure, compromise, or paying a price — avoid the character merely observing external events.",
          "2. Each chapter's summary should include at least one effective progression: new intel, escalating risk, relationship change, resource gain or loss, a corrected misjudgment, the opponent's countermove, or a staged payoff.",
          "3. Do not write chapters as a repeating chain of \"spot a problem — realize the danger — keep investigating\".",
          "4. You may create or exploit information gaps, misjudgments, or anomalous discoveries, and hidden costs beneath surface victories, but do not cram a full cause-and-effect sentence into the title.",
          "5. Each chapter's ending should imply a new problem, threat, opportunity, misjudgment, or choice pressure, giving the next chapter a reason to be read.",
          "6. Not every chapter in the current beat may be pure setup; there must be real progression, situation change, or staged payoff.",
          "",
          "VI. Title requirements",
          "1. Each chapter title must read like a real chapter name, prioritizing an event anchor, location, conflict, anomalous discovery, situation change, staged payoff, relationship shift, or a question hook.",
          "2. Titles default to objective phrasing; do not use first-person self-narration such as \"I / my / yet I / I use / for me / hunting me\".",
          "3. Before writing chapters, mentally complete one pass of title-syntax ratio planning, then output by that ratio; do not keep repeating one template as you go.",
          "4. Within one batch of titles you must actively mix syntaxes: action-progression, conflict-pressure, anomaly-discovery, result-payoff, decision-turn, question-hook, relationship-shift, and so on.",
          "5. A title's core length must not exceed 16 characters, ideally 4-12; do not write long sentences, full cause-and-effect sentences, or plot synopses.",
          "6. Titles may carry contrast but must stay terse, for example \"Forged order\", \"The soul-nail surfaces\", \"Crack in the array-eye\"; do not write \"Someone did something, so some result happened\".",
          "7. Avoid titles that are only abstract words — storm, undercurrent, crisis, truth, choice, upheaval — unless the title also has a concrete object, action, or contrast.",
          "8. If the current beat has 6 or more chapters: no single surface frame may exceed half; do not heavily reuse frames like \"Y of X / Y within X / Ying in X\", capping such frames at roughly one third.",
          "9. Explicitly avoid letting most titles collapse into the \"A, B / four-beat action, four-beat result\" parallel template.",
          "10. Adjacent chapter titles must not reuse the same grammatical frame for more than 3 chapters in a row.",
          "11. Titles must feel like progression and be readable; avoid vague literary, abstractly lyrical, sloganized, or overly templated phrasing.",
          "12. The protagonist's agency, choices, and costs go mainly in the summary; do not turn the title into a first-person wish-fulfillment line just to show the protagonist acting.",
          "13. Self-check once before generating: are there first-person titles, over-long titles, too many \"Y-of-X\" structures, too many comma-parallel structures, or 3+ chapters in a row with the same frame? If so, fix before output.",
          "",
          "VII. Summary requirements",
          "1. Each chapter's summary must state clearly what this chapter specifically advances and what role it plays within the current target beat.",
          "2. summary must express at least one of: new information, situation change, conflict progression, relationship change, rising cost, risk turn, or staged payoff.",
          "3. summary must express the irreversible change this chapter causes: a character's judgment changes, resource state changes, ally/enemy relations change, risk level changes, plan direction changes, or reader cognition changes.",
          "4. Do not write the summary as a vague slogan, nor as a detailed plot retelling.",
          "5. Adjacent chapters' summaries must not be mere synonymous repetition.",
          "6. Do not heavily use low-information phrases like \"further advances the plot\", \"the situation grows more complex\", or \"plants a seed for later\".",
          "",
          "VIII. Beat continuity requirements",
          "1. This pass only covers the current target beat; do not generate chapters for adjacent beats.",
          "2. Opening chapters must pick up the state of previously generated chapters; do not restart progressions that have already happened.",
          "3. Middle chapters must keep pressuring, probing, turning, or paying off around the current beat's core conflict.",
          "4. Ending chapters must land the current beat's mustDeliver, but must not prematurely sneak in the next beat's core payoff.",
          "",
          "IX. Quality self-check requirements",
          "1. Before output, mentally check: is the chapter count exact, is beatKey consistent, is there any spillover, are there repeated-function chapters.",
          "2. Before output, mentally check: are the titles over-homogeneous, do the summaries have real progression, does the ending chapter have a staged payoff or reading pull.",
          "3. If you find a chapter that only rephrases, with no new progression, no protagonist action, and no situation change, fix it before output.",
          "",
          buildRetryDirectiveEn(promptInput.retryReason),
        ]
          .filter(Boolean)
          .join("\n"),
      ),

      new HumanMessage(
        [
          "Based on the following context, output the chapter block for the current pacing beat.",
          "",
          "Output requirements:",
          "- Output strict JSON only",
          `- beatKey must strictly equal ${targetBeatKey}`,
          `- beatLabel must strictly equal ${targetBeatLabel}`,
          `- chapterCount and chapters.length must strictly equal ${targetChapterCount}`,
          "- each chapter may only contain title, summary, beatKey",
          "- do not generate any chapters for adjacent beats",
          "- first mentally plan the chapter-function allocation and the title-syntax ratio, then output the complete chapter block",
          "- prioritize chapter progression, beat continuity, dispersed title structure, character agency in summaries, and ending pull",
          "- titles must be terse and objective, no first person, no long sentences or plot synopses",
          "",
          "Current volume chapter-splitting context:",
          renderSelectedContextBlocks(context),
        ].join("\n"),
      ),
    ],
  };
}

export const novelVolumeChapterListPromptEn = createVolumeChapterListPromptEn(1);

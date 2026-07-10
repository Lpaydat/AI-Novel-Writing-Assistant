import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { renderSelectedContextBlocks } from "../../../core/renderContextBlocks";
import { volumeBeatSheetPrompt } from "./beatSheet.prompts";

/**
 * English variant of `novel.volume.beat_sheet@v1`.
 *
 * Domain-aware rewrite for English-language serialized web fiction — NOT a literal
 * string swap of the zh anchor. Derived from the zh anchor via object spread, so
 * it reuses the zh anchor's `outputSchema` (referential equality holds),
 * `contextPolicy`, `repairPolicy`, `semanticRetryPolicy`, and `postValidate`
 * unchanged; only `language` and `render` are overridden. Registered alongside
 * the zh anchor; the runner swaps to this variant only when `options.locale ===
 * "en"`.
 */
export const novelVolumeBeatSheetPromptEn: typeof volumeBeatSheetPrompt = {
  ...volumeBeatSheetPrompt,
  language: "en",
  render: (input, context) => [
    new SystemMessage([
      "You are a single-volume pacing planner for web fiction.",
      "Your task is not to write a chapter table of contents, nor to expand a plot synopsis, but to turn the volume skeleton into a beat sheet that later chapter-splitting can consume.",
      "A beat is a stage-level pacing task unit inside the volume; across a range of chapters it captures the dominant progression duty, reading function, and the content that must be delivered.",
      "",
      "[Task Boundary]",
      "At this stage you only generate the single-volume beat sheet; do not expand concrete chapters, write scene outlines, add character bios, or write dialogue.",
      "Each beat must serve later chapter-splitting, emphasizing what pacing task this stretch of chapters must accomplish rather than listing trivial events.",
      "Output strict JSON only; do not output Markdown, explanations, comments, or extra fields.",
      "",
      "[Output Format]",
      "{",
      '  "beats": [',
      "    {",
      '      "key": "open_hook",',
      '      "label": "Opening hook",',
      '      "summary": "What this beat mainly advances, what pacing duty it carries in this volume, and how it picks up the matching promise in the volume skeleton.",',
      '      "chapterSpanHint": "1-2 chapters",',
      '      "mustDeliver": ["A key signal the reader must register", "A situation or conflict that must be established"]',
      "    }",
      "  ]",
      "}",
      "",
      "[Hard Requirements]",
      "1. beats must contain 5-8 entries.",
      "2. Each beat must fully contain the five fields key, label, summary, chapterSpanHint, mustDeliver; none may be missing or renamed.",
      "3. summary must make clear what this beat advances, what pacing duty it carries, and which kind of promise or pressure in the volume skeleton it relates to.",
      "4. chapterSpanHint must be a non-empty string, using expressions like \"1-2 chapters\", \"3 chapters\", \"7-8 chapters\".",
      "5. mustDeliver must be 1-6 non-empty strings, prioritizing the situations, signals, pressures, pivots, and reader perceptions that must be delivered; do not write only abstract slogans.",
      "6. beats must at minimum cover: the opening hook, the first escalation or counter, a midpoint turn, the pre-climax squeeze, the volume climax, and the end-of-volume hook.",
      "7. Each beat's pacing duty must differ; do not write multiple beats all as \"conflict escalation\" or \"keep advancing\".",
      "8. Do not write the pre-climax squeeze as a premature climax, and do not write the end-of-volume hook as a vague open ending.",
      `9. All chapterSpanHint values must continuously cover from chapter 1 to around chapter ${input.targetChapterCount}; they must not cover only a few opening chapters.`,
      "",
      "[Volume-Skeleton Continuity Requirements]",
      "1. The opening-related beat must pick up openingHook and mainPromise from target_volume.",
      "2. The early-to-middle beats must progressively express primaryPressureSource and escalationMode.",
      "3. The middle must express midVolumeRisk or an equivalent shift in the situation; it must not be a purely linear ramp.",
      "4. The climax beat must pick up the volume-climax promise and turn it into a clear payoff.",
      "5. The ending beat must pick up nextVolumeHook and, through resetPoint or a reshuffled aftermath, form the entry point into the next volume.",
      "",
      "[Quality Requirements]",
      "1. Every beat must answer: why this stretch of chapters must exist.",
      "2. Adjacent beats must form a progression or turn relationship, not synonymous repetition.",
      "3. The pacing must show hooks and promises up front, a gear-shift and rising cost in the middle, a squeeze and payoff toward the end, and an entry point left open at the close.",
      "4. When information is insufficient you must still fill in complete fields, but stay conservative and do not invent large settings detached from the context.",
      "",
      "[Suggested keys]",
      "Prefer stable English identifiers, for example: open_hook / first_escalation / midpoint_turn / pressure_lock / climax / end_hook.",
      `Current volume target chapter count: ${input.targetChapterCount}.`,
      `chapterSpanHint must use volume-local numbering only, start from 1 inside the current volume, and never exceed ${input.targetChapterCount}. Never use whole-book absolute chapter numbers.`,
    ].join("\n")),
    new HumanMessage([
      "Based on the following context, generate the single-volume beat sheet for the current target volume.",
      "",
      "[Output Requirements]",
      "- Output JSON only",
      "- Do not add fields beyond the schema",
      "- beats are pacing-task segments, not a chapter table of contents",
      "- Prioritize a clear continuity relationship with the volume skeleton, well-defined pacing duties, and later chapter-splittability",
      "",
      "[Current volume pacing-board context]",
      `- Current volume target chapter count: ${input.targetChapterCount}`,
      "- chapterSpanHint must stay within this volume only; do not use whole-book absolute chapter numbers",
      `- all beat spans together must cover chapters 1-${input.targetChapterCount} of this volume`,
      "",
      renderSelectedContextBlocks(context),
    ].join("\n")),
  ],
};

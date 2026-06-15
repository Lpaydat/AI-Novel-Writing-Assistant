import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import { novelBiblePayloadSchema } from "../../../services/novel/novelCoreSchemas";
import {
  novelBeatPayloadSchema,
  novelChapterHookSchema,
  type NovelBeatPromptInput,
  type NovelBiblePromptInput,
  type NovelChapterHookPromptInput,
  type NovelOutlinePromptInput,
} from "./coreGeneration.prompts";

/**
 * English variants of the `novel.*` core-generation prompts (outline / bible /
 * beat / chapterHook).
 *
 * Domain-aware rewrites for English-language serialized fiction — NOT literal
 * string swaps of the zh anchors. Each variant reuses its zh anchor's
 * `outputSchema` (JSON shape is language-independent) and input type. Registered
 * alongside the zh anchors; the runner swaps to a variant only when
 * `options.locale === "en"`.
 *
 * Locale source: these are NOVEL-SCOPED prompts. The locale is threaded from
 * `novel.language` (DB), NOT `req.locale` — the director runs as a background
 * worker with no HTTP context. novelCoreGenerationService loads the novel row,
 * so `novel.language` is in scope at each call site and is passed into
 * `options.locale`.
 */

export const novelOutlinePromptEn: PromptAsset<NovelOutlinePromptInput, string, string> = {
  id: "novel.outline.generate",
  version: "v1",
  taskType: "planner",
  mode: "text",
  language: "en",
  contextPolicy: { maxTokensBudget: 0 },
  render: (input) => {
    const referenceBlock = input.referenceContext?.trim()
      ? `\n\n[Reference material (technique/direction reference only; do not copy plot or structure)]\n${input.referenceContext}`
      : "";

    const initialPrompt = input.initialPrompt?.trim() ?? "";
    const initialPromptBlock = initialPrompt
      ? `\n\n[User's extra requirements (take priority, but must not violate existing characters or world settings)]\n${initialPrompt.slice(0, 2000)}`
      : "";

    return [
      new SystemMessage([
        "You are a long-form serialized fiction development-direction planner.",
        "Your task is NOT to write body text, but to produce, from the existing settings, a writable, extensible, serialization-ready overall development direction.",
        "",
        "[Task Boundary]",
        "Output only the novel's development direction — no body text, no dialogue, no concrete chapter breakdown.",
        "No explanations, Markdown, or extra notes.",
        "",
        "[Core Constraints]",
        "1. You must strictly use the given core characters; do not add, replace, or ignore key characters.",
        "2. You must obey the existing world settings; do not introduce conflicting rules or out-of-bounds settings.",
        "3. Do not expand large amounts of worldbuilding detail without basis; focus on plot progression and structure design.",
        "",
        "[Output Goal]",
        "Produce a \"sustainably serializable\" development direction, not a one-shot complete spoiler.",
        "It needs all of: opening pull, mid-section expansion room, and late-section escalation potential.",
        "",
        "[Structure Requirements]",
        "The development direction must include these layers:",
        "1. Opening situation: the protagonist's current circumstance, core predicament, and initial drive.",
        "2. Mainline drive: the core goal or question running through the whole book.",
        "3. Conflict evolution path: how conflict escalates from initial -> expanded -> complex.",
        "4. Phase progression: define multiple phases, each with different goals, pressure sources, and situational changes.",
        "5. Key turning points: design at least several nodes that change the situation (cognitive shift / relationship change / rule reveal / situation reversal).",
        "6. Growth and change: the protagonist's ability, cognition, or stance changes across phases.",
        "7. High-level direction: the overall development direction and possible ending trend (but do not lock in every detail).",
        "",
        "[Serialization-Oriented Requirements]",
        "1. The early part must quickly establish the main selling point and reading hooks; avoid long setup.",
        "2. The middle must keep introducing new changes (new pressure / new relationships / new situations); avoid repeating the same pattern.",
        "3. The late part must have escalation room; avoid capping too early or front-loading the climax.",
        "4. The overall direction should keep adjustable space; do not lock every development path.",
        "",
        "[Quality Requirements]",
        "1. Every phase should show \"why it is worth writing\", not just vague progression.",
        "2. Avoid repeating the same class of conflict or looping the same trope.",
        "3. Prioritize strengthening character circumstance, choice pressure, and emotional drive over piling on settings.",
        "4. When information is insufficient, reasonable reinforcement is allowed, but keep it restrained and coherent.",
      ].join("\n")),
      new HumanMessage([
        `Novel title: ${input.title}`,
        `Novel description: ${input.description}`,
        "",
        "[Core characters (must use; do not replace or ignore)]",
        input.charactersText,
        "",
        "[World context]",
        input.worldContext,
        referenceBlock,
        initialPromptBlock,
        "",
        "Output the complete development direction.",
      ].join("\n")),
    ];
  },
};

export const novelBiblePromptEn: PromptAsset<
  NovelBiblePromptInput,
  typeof novelBiblePayloadSchema._output
> = {
  id: "novel.bible.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 0 },
  outputSchema: novelBiblePayloadSchema,
  render: (input) => {
    const referenceBlock = input.referenceContext?.trim()
      ? `\n\n[Reference material (technique/direction reference only; do not copy plot or structure)]\n${input.referenceContext}`
      : "";

    return [
      new SystemMessage([
        "You are a serialized-fiction series-bible planning assistant.",
        "Your task is NOT to write body text or expand the outline, but to generate, from the given information, a series bible usable for long-term downstream creation.",
        "",
        "[Task Boundary]",
        "Output only strict JSON conforming to the schema.",
        "No Markdown, explanations, comments, code blocks, or any extra text.",
        "Do not add fields outside the schema; do not omit existing fields.",
        "",
        "[Output Field Requirements]",
        "You must output these fields:",
        "1. coreSetting: the work's most essential setting hook — state what the most fundamental world/genre/conflict base of this book is.",
        '2. forbiddenRules: hard rules, no-go zones, or conflict boundaries that creation must not violate — focus on "what setting conflicts must not occur".',
        "3. mainPromise: the mainline reading promise this book continually delivers to readers — state why readers will keep following.",
        "4. characterArcs: the core characters' growth spines and change directions, emphasizing phased change; do not be vague.",
        "5. worldRules: world run rules, basic order, key limits, and causal boundaries — they must be able to constrain downstream creation.",
        "",
        "[Core Constraints]",
        "1. Generate strictly based on the input title, genre, description, characters, and world context.",
        "2. Do not invent large unrelated settings off the mainline beyond the context.",
        "3. Do not ignore given characters or blur their function to the point of being unusable for downstream writing.",
        "4. forbiddenRules and worldRules must genuinely constrain downstream content; no filler.",
        "5. mainPromise must reflect serialized-fiction value, not just a thematic slogan.",
        "",
        "[Quality Requirements]",
        "1. coreSetting should capture \"this book's most irreplaceable backbone\", not just restate the genre.",
        '2. forbiddenRules should be concrete, clear, executable; avoid vague expressions like "maintain consistency".',
        "3. characterArcs should show the character's growth or change direction across long serialization, not static labels.",
        "4. worldRules should state rules that genuinely affect plot progression, not background introduction.",
        "5. The overall content should serve long-term creation stability and work as the constraint base for later volume strategy, chapter breakdown, and continuation.",
        "",
        "[Generation Principles]",
        "When information is insufficient, conservative completion is allowed, but keep it restrained, coherent, and prioritize setting stability.",
      ].join("\n")),
      new HumanMessage([
        `Novel title: ${input.title}`,
        `Genre: ${input.genreName}`,
        `Description: ${input.description}`,
        "",
        "[Characters]",
        input.charactersText,
        "",
        "[World context]",
        input.worldContext,
        referenceBlock,
        "",
        "Output the series-bible JSON.",
      ].join("\n")),
    ];
  },
};

export const novelBeatPromptEn: PromptAsset<
  NovelBeatPromptInput,
  typeof novelBeatPayloadSchema._output
> = {
  id: "novel.beat.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 0 },
  outputSchema: novelBeatPayloadSchema,
  render: (input) => {
    const referenceBlock = input.referenceContext?.trim()
      ? `\n\n[Reference material (technique/rhythm reference only; do not copy plot or structure)]\n${input.referenceContext}`
      : "";

    return [
      new SystemMessage([
        "You are a serialized-fiction story-beat planning assistant.",
        "Your task is NOT to write body text or produce prose-style outlines, but to generate, from the series bible and target chapter count, a story-beat list usable for later chapter planning and writing.",
        "",
        "[Task Boundary]",
        "Output only strict JSON conforming to the schema.",
        "No Markdown, explanations, comments, code blocks, or any extra text.",
        "Do not add fields outside the schema; do not omit fields.",
        "",
        "[Output Requirements]",
        "The output must be a JSON array.",
        "Each item must fully contain these fields:",
        "- chapterOrder",
        "- beatType",
        "- title",
        "- content",
        "- status",
        "",
        "[Field Constraints]",
        "1. chapterOrder must correspond to chapter order, increasing continuously from 1, and cover the target chapter count.",
        "2. beatType must accurately express that chapter's main beat function, e.g. opening setup, conflict escalation, information reveal, relationship change, situation reversal, climax payoff, ending hook.",
        "3. title must read like a real, usable beat title, clearly showing the chapter's core progression; no vague labels.",
        "4. content must state what this chapter specifically advances, what it changes, and its role in the overall rhythm.",
        "5. status must indicate the beat's current state; keep semantics consistent across the whole array; do not misuse it.",
        "",
        "[Core Constraints]",
        "1. Must strictly carry forward the novel description, world context, and series bible; do not deviate from the mainline promise.",
        "2. Do not invent new core characters, major world rules, or mainline directions beyond the context.",
        "3. Every chapter must have substantive progression; no pure filler, pure atmosphere, or pure recap beats.",
        "4. Adjacent chapter beats must not just synonym-repeat; each must show progression, change, escalation, turning, or payoff (at least one).",
        "5. The overall beat sequence must form a clear rhythm: early establishes hooks and situation, middle expands and escalates, late pressures and pays off.",
        "",
        "[Quality Requirements]",
        "1. The first few chapters must quickly establish the main situation, main conflict, or main selling point; avoid a slow entry into the story.",
        "2. The middle must keep introducing new variables, new pressure, new choices, or new consequences; avoid linear repeat-increment.",
        "3. The late part must show phased payoff, situation convergence, or larger suspense, not a flat push to the end.",
        '4. content should emphasize "why this chapter deserves to exist", not vaguely summarize the plot.',
        "5. Reference material may borrow technique, rhythm, and organization only; do not copy character relations, plot structure, or beats.",
        "",
        "[Generation Principles]",
        "When information is insufficient, conservative completion is allowed, but keep it coherent, restrained, and prioritize rhythm stability and writability.",
      ].join("\n")),
      new HumanMessage([
        `Novel title: ${input.title}`,
        `Novel description: ${input.description}`,
        "",
        "[World context]",
        input.worldContext,
        "",
        "[Series bible]",
        input.bibleRawContent,
        "",
        `[Target chapter count] ${input.targetChapters}`,
        referenceBlock,
        "",
        "Output the corresponding story-beat JSON array.",
      ].join("\n")),
    ];
  },
};

export const novelChapterHookPromptEn: PromptAsset<
  NovelChapterHookPromptInput,
  typeof novelChapterHookSchema._output
> = {
  id: "novel.chapterHook.generate",
  version: "v2",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: { maxTokensBudget: 0 },
  outputSchema: novelChapterHookSchema,
  render: (input) => [
    new SystemMessage([
      "You are a serialized-fiction chapter-hook planning assistant.",
      "Your task is NOT to rewrite body text, but to distill, from the current chapter content, an effective end-of-chapter hook and a next-chapter expectation.",
      "",
      "[Task Boundary]",
      "Output only strict JSON conforming to the schema.",
      "No Markdown, explanations, comments, code blocks, or any extra text.",
      "Do not add fields outside the schema; do not omit fields.",
      "",
      "[Output Format]",
      'Must output: {"hook":"end-of-chapter hook","nextExpectation":"next-chapter expectation"}',
      "",
      "[Field Requirements]",
      "1. hook must read like a real serialized-fiction end-of-chapter hook that drives follow-reading; prioritize suspense, sudden change, unfinished decision, risk escalation, the fallout of a reveal, or a sudden situation shift.",
      '2. nextExpectation must clearly state what progression the reader will naturally expect in the next chapter; do not write vague filler like "subsequent developments" or "what happens next".',
      "",
      "[Core Constraints]",
      "1. Generate strictly based on the current chapter title and content; do not invent major events off-content.",
      "2. hook must carry forward this chapter's progression results, extending naturally from the body, not bolting on an external suspense.",
      "3. nextExpectation must form a continuous link with hook, stating the most worthwhile payoff direction for the next chapter.",
      "4. Do not repeat large verbatim sentences from this chapter's body; distill and reorganize.",
      "5. Do not write hook as a summary sentence, theme sentence, lyrical sentence, or vague exclamation.",
      "",
      "[Quality Requirements]",
      "1. Prioritize giving hook immediate follow-reading pull, rather than broadly summarizing the plot.",
      "2. If this chapter ends on the eve of a decision, hook should highlight decision pressure; if it ends on an anomaly exposed, hook should highlight consequence or the truth's entry point; if it ends on a situation reversal, hook should highlight the new unstable state.",
      "3. nextExpectation should be specific enough to say 'what the next chapter will most likely advance', not abstract emotion.",
      "4. Even when information is insufficient, give a conservative but effective hook; do not write filler.",
    ].join("\n")),
    new HumanMessage([
      `Chapter title: ${input.title}`,
      "",
      "[Chapter content]",
      input.content,
      "",
      "Output the end-of-chapter hook JSON.",
    ].join("\n")),
  ],
};

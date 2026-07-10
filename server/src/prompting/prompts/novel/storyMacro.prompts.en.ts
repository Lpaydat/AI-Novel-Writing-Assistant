import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { StoryMacroField } from "@ai-novel/shared/types/storyMacro";
import type { PromptAsset } from "../../core/promptTypes";
import { renderSelectedContextBlocks } from "../../core/renderContextBlocks";
import { STORY_MACRO_RESPONSE_SCHEMA } from "../../../services/novel/storyMacro/storyMacroPlanSchema";
import { NOVEL_PROMPT_BUDGETS } from "./promptBudgetProfiles";
import {
  storyMacroFieldRegenerationSchema,
  type StoryMacroDecompositionPromptInput,
  type StoryMacroFieldRegenerationPromptInput,
} from "./storyMacro.prompts";

/**
 * English variants of the `novel.story_macro.*` prompts (decomposition /
 * field_regeneration).
 *
 * Domain-aware rewrites for English-language serialized fiction — NOT literal
 * string swaps of the zh anchors. Each variant reuses its zh anchor's
 * `outputSchema` (JSON shape is language-independent), input type, and
 * `contextPolicy`. Registered alongside the zh anchors; the runner swaps to a
 * variant only when `options.locale === "en"`.
 */

function buildDecompositionSystemPrompt(): string {
  return [
    "You are a veteran novelist and story-development editor.",
    'Your job is NOT to polish the user\'s idea, but to rebuild it into a "story-engine prototype" that can sustain long-form narrative and serve as a hard constraint for later generation.',
    "",
    "[Task goals]",
    "1. Intensify dramatic conflict rather than flatly filling in settings.",
    "2. Build a drive that keeps the story moving long-term, not a short-story-style premise wrapper.",
    "3. Prioritize character predicament, cognitive conflict, crisis escalation, relationship pressure, key setpieces, and narrative tone.",
    "4. Control information density; do not expand large amounts of worldbuilding without basis.",
    "5. The output will act as a hard constraint for later creation stages, so it must be stable, explicit, and executable.",
    "",
    "[Stage constraints]",
    "1. This stage precedes character creation; only abstract character slots may be used, e.g. protagonist slot, antagonist slot, relationship-pressure slot, temptation slot, observer slot.",
    "2. No concrete character names, full character bios, or fixed cast lists.",
    "3. Do not turn the character system into a finished character sheet ahead of time.",
    "4. Do not invent large amounts of organizations, geography, history, or systems just to feel complex.",
    "",
    "[You must build all of the following]",
    "1. Trap the protagonist in a clear predicament they cannot easily exit.",
    "2. Build a core conflict that can keep escalating, keep mutating, and pressure the protagonist over the long haul.",
    "3. Set up a mystery box that continually pulls the reader forward — the most crucial unknown that cannot yet be fully known.",
    "4. Design 2-3 high-tension setpiece seeds that are vivid, conflict-driven, and extensible later.",
    "5. Pin down the narrative tone so later writing knows HOW this book should be written, not just WHAT to write.",
    "",
    "[Genre-fit requirements]",
    "1. If the genre leans cosmic-horror / unnameable, it must convey: cognitive collapse, an untrustworthy reality, a truth that cannot be looked at directly.",
    "2. If the genre leans mystery / detective, it must convey: paced information reveal, cognitive misdirection, and truth advancing in layers.",
    "3. If the genre leans coming-of-age, it must convey: staged cognitive change, cost, corrected misperception, and self-reconstruction.",
    "",
    "[Project-context usage rules]",
    '1. If the project context contains "world settings this book will use", you must prioritize the existing rules, organizations, places, conflicts, boundaries, and forbidden pairings within it.',
    "2. Do not expand freely beyond those boundaries.",
    "3. If the story idea clearly conflicts with the project context, flag conflict in issues.",
    "",
    "[Generation principles]",
    '1. Prioritize "conflict restructuring" and "narrative-drive building"; do not center on setting exposition.',
    '2. Every field should serve "why this book can keep being written".',
    "3. expanded_premise is not a polished blurb but an intensified story premise.",
    "4. protagonist_core is not a character intro but the protagonist's trapped structure + inner fracture + room to change.",
    "5. conflict_engine must answer: why the plot can keep escalating, mutating, reversing, and advancing.",
    "6. mystery_box must be genuinely crucial, not a meaningless teaser.",
    "7. progression_loop must clearly show the loop logic: discovery -> intervention -> escalation -> backlash/reversal -> new discovery.",
    "8. constraints must be narrative rules the later generation stage can directly obey, not vague suggestions.",
    "",
    "[Handling gaps and conflicts]",
    "1. If information is insufficient, do not fake completeness or hard-code details.",
    "2. When information is insufficient, flag missing_info in issues.",
    "3. When user inputs conflict with each other or with the project context, flag conflict in issues.",
    "4. Even when problems exist, still produce a usable but restrained story-engine prototype.",
    "",
    "[Output requirements]",
    "1. Output only a strictly valid JSON object.",
    "2. Do not output explanations, notes, Markdown, code blocks, or any extra text.",
    "3. Every field must be filled; if you cannot be fully certain, give the safest, most restrained result and explain it in issues.",
    "",
    "JSON structure:",
    "{",
    '  "expansion": {',
    '    "expanded_premise": "The intensified story premise after strengthening conflict",',
    '    "protagonist_core": "The protagonist trapped predicament + inner fracture + room to change",',
    '    "conflict_engine": "The core mechanism that keeps the plot advancing and escalating",',
    '    "conflict_layers": {',
    '      "external": "External pressure/threat",',
    '      "internal": "Inner collapse/desire/fear",',
    '      "relational": "Tension between people"',
    "    },",
    '    "mystery_box": "The core unknown the reader keeps wanting to know but cannot yet get an answer to",',
    '    "emotional_line": "The logic of emotional progression",',
    '    "setpiece_seeds": ["High-tension setpiece 1", "High-tension setpiece 2"],',
    '    "tone_reference": "Narrative tone and writing-style direction"',
    "  },",
    '  "decomposition": {',
    '    "selling_point": "One-sentence selling point",',
    '    "core_conflict": "A long-term irreconcilable opposition",',
    '    "main_hook": "The mainline question carrying an unknown",',
    '    "progression_loop": "How the story loops forward: discovery -> escalation -> reversal",',
    '    "growth_path": "How the protagonist cognition or state changes in stages",',
    '    "major_payoffs": ["Payoff 1", "Payoff 2"],',
    '    "ending_flavor": "Ending flavor"',
    "  },",
    '  "constraints": ["Narrative rule that must be obeyed 1", "Narrative rule that must be obeyed 2"],',
    '  "issues": [{"type":"conflict|missing_info","field":"expanded_premise|protagonist_core|conflict_engine|conflict_layers|mystery_box|emotional_line|setpiece_seeds|tone_reference|selling_point|core_conflict|main_hook|progression_loop|growth_path|major_payoffs|ending_flavor|constraints|global","message":"explanation"}]',
    "}",
  ].join("\n");
}

function buildFieldRegenerationSystemPrompt(field: StoryMacroField): string {
  const fieldFormat = field === "conflict_layers"
    ? "{\"value\":{\"external\":\"...\",\"internal\":\"...\",\"relational\":\"...\"}}"
    : (field === "major_payoffs" || field === "setpiece_seeds" || field === "constraints")
      ? "{\"value\":[\"...\"]}"
      : "{\"value\":\"...\"}";

  return [
    "You are a story-engine field-rewrite assistant for novels.",
    "Your job: rewrite exactly one specified field so it stays consistent with the existing story-engine prototype and can directly replace the original field.",
    "",
    "[Hard requirements]",
    "1. You may only rewrite the target field; do not modify, extend, or implicitly alter any other field.",
    "2. Treat all other fields as hard context — reference only, never overturn.",
    "3. This stage precedes character creation; only abstract character slots may be used, e.g. protagonist slot, antagonist slot, relationship-pressure slot, temptation slot, observer slot.",
    "4. Do not output concrete character names, detailed bios, or fixed cast lists.",
    '5. If the project context contains "world settings this book will use", the rewrite must strictly obey the existing rules, places, organizations, boundaries, forbidden pairings, and conflicts within it, without expanding out of bounds.',
    "6. You must obey the existing constraints.",
    "7. You must respect the established direction represented by lockedFields; do not use the rewrite to indirectly undermine the basis of any locked field.",
    "",
    "[Rewrite principles]",
    "1. Rewriting is not restating the original in different words; it is a sturdier, stronger reconstruction of the target field, better suited to sustained narrative.",
    "2. The new result must stay consistent with the original story idea and compatible with expansion, decomposition, and constraints.",
    "3. If context is insufficient, do not recklessly add major settings; strengthen as safely as possible within the existing information.",
    "4. If the target field is in tension with existing context, prefer a compatibility fix over starting from scratch.",
    "5. The output must be complete and usable — not an outline, note, explanation, analysis, or half-finished draft.",
    "",
    "[Field-specific requirements]",
    "1. If the target field is expanded_premise: intensify the story premise and dramatic conflict; do not write it as a blurb.",
    "2. If the target field is protagonist_core: spell out the protagonist's trapped structure, inner fracture, and room to change; do not write a character card.",
    "3. If the target field is conflict_engine: show why the plot can keep advancing, escalating, reversing, and backlashing.",
    "4. If the target field is conflict_layers: external / internal / relational must be clearly distinct yet jointly serve the same core conflict.",
    "5. If the target field is mystery_box: it must be a crucial unknown, not a vague teaser.",
    "6. If the target field is emotional_line: show how emotion gradually intensifies, mutates, destabilizes, or reverses.",
    "7. If the target field is setpiece_seeds: each setpiece must be vivid, conflict-driven, and worth extending later — no filler.",
    "8. If the target field is tone_reference: give a clear narrative tone and writing-style direction, not a pile of vague adjectives.",
    "9. If the target field is selling_point: it must be tight enough to convey distinctiveness and appeal.",
    "10. If the target field is core_conflict: it must be a long-term irreconcilable opposition, not a one-off event.",
    "11. If the target field is main_hook: convey the mainline unknown and sustained pull.",
    '12. If the target field is progression_loop: clearly show the loop mechanism "discovery -> intervention -> escalation -> backlash/reversal -> new discovery".',
    "13. If the target field is growth_path: convey the staged change and cost in the protagonist's cognition or state.",
    "14. If the target field is major_payoffs: they must be payoffs genuinely worth cashing in, not ordinary plot beats.",
    "15. If the target field is ending_flavor: convey the ending's mood and final aftertaste, not a detailed ending outline.",
    "16. If the target field is constraints: write narrative rules the later generation can directly obey — no empty talk.",
    "",
    "[Output requirements]",
    "1. Output only a strictly valid JSON object.",
    "2. Do not output explanations, Markdown, code blocks, or any extra text.",
    `3. The output format must be exactly: ${fieldFormat}`,
    "4. Do not output any field other than value.",
    `5. The only field you must rewrite right now is: ${field}`,
  ].join("\n");
}

export const novelStoryMacroDecompositionPromptEn: PromptAsset<
  StoryMacroDecompositionPromptInput,
  typeof STORY_MACRO_RESPONSE_SCHEMA._output
> = {
  id: "novel.story_macro.decomposition",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.storyMacroDecomposition,
    requiredGroups: ["story_input"],
    preferredGroups: ["project_context"],
  },
  outputSchema: STORY_MACRO_RESPONSE_SCHEMA,
  render: (_input, context) => [
    new SystemMessage(buildDecompositionSystemPrompt()),
    new HumanMessage(renderSelectedContextBlocks(context)),
  ],
};

export const novelStoryMacroFieldRegenerationPromptEn: PromptAsset<
  StoryMacroFieldRegenerationPromptInput,
  typeof storyMacroFieldRegenerationSchema._output
> = {
  id: "novel.story_macro.field_regeneration",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.storyMacroFieldRegeneration,
    requiredGroups: ["story_input", "target_field", "decomposition_summary", "constraints"],
    preferredGroups: ["project_context", "expansion_summary", "locked_fields"],
  },
  outputSchema: storyMacroFieldRegenerationSchema,
  render: (input, context) => [
    new SystemMessage(buildFieldRegenerationSystemPrompt(input.field)),
    new HumanMessage(renderSelectedContextBlocks(context)),
  ],
};

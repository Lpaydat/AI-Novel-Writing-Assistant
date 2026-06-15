import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../core/promptTypes";
import type { TitlePromptContext } from "../../../services/title/titleGeneration.shared";
import {
  maximumFrameClusterSize,
  minimumStructuralVariety,
  minimumStyleVariety,
} from "../../../services/title/titleGeneration.shared";
import { titleGenerationRawOutputSchema } from "./titleGeneration.promptSchemas";
import type { TitleGenerationPromptInput } from "./titleGeneration.prompt";

/**
 * English variant of `title.generation@v1`.
 *
 * Domain-aware rewrite for English-language serialized / commercial fiction
 * titles — NOT a literal string swap of the zh anchor. The shared output schema
 * is reused (JSON shape is language-independent); in particular the schema caps
 * `title` at 26 characters, so this variant instructs the model to keep titles
 * tight (short punchy phrases) to stay within that bound.
 */
export const titleGenerationPromptEn: PromptAsset<
  TitleGenerationPromptInput,
  typeof titleGenerationRawOutputSchema._output
> = {
  id: "title.generation",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  // Reuse the zh anchor's outputSchema: it describes JSON structure, not language.
  outputSchema: titleGenerationRawOutputSchema,
  render: (input) => buildTitleGenerationMessages(input.context, {
    forceJson: input.forceJson,
    retryReason: input.retryReason,
  }),
};

function resolveModeLabel(mode: TitlePromptContext["mode"]): string {
  switch (mode) {
    case "adapt":
      return "Rewrite from reference titles";
    case "novel":
      return "Generate from project context";
    default:
      return "Free-form title workshop";
  }
}

function buildModeInstruction(input: TitlePromptContext): string {
  switch (input.mode) {
    case "adapt":
      return "Learn the information density, rhythm, and hook structure of the reference titles, but NEVER copy their phrasing, sentence skeleton, or core premise.";
    case "novel":
      return "Center the candidates on the current project's genre base, premise, and existing titles. Current titles are only an anti-collision reference — do not paraphrase them.";
    default:
      return "Produce a directly usable title pool from the creative brief. Emphasize genre selling points and the impulse to click; do not retell the plot.";
  }
}

function buildDiversityInstruction(count: number): string {
  return [
    `Cover at least ${minimumStyleVariety(count)} distinct styles.`,
    `Cover at least ${minimumStructuralVariety(count)} distinct sentence frames.`,
    `At most ${maximumFrameClusterSize(count)} titles may share the same sentence frame.`,
    "Actively spread out the sentence frames — for example: The X / X: Y / When X / I Was X / X, Until Y / plain declarative.",
  ].join(" ");
}

function buildRetryInstruction(retryReason: string | null | undefined): string {
  if (!retryReason) {
    return "";
  }
  return `\nThe previous output had a problem: ${retryReason}. Fix that problem first, then return the final JSON.`;
}

function buildTitleGenerationMessages(
  input: TitlePromptContext,
  options: {
    forceJson?: boolean;
    retryReason?: string | null;
  } = {},
): BaseMessage[] {
  const forceJsonInstruction = options.forceJson
    ? "\nThe current model supports stable JSON output; return the JSON object body directly."
    : "";

  return [
    new SystemMessage(`You are a senior title strategist for an English-language serialized / commercial fiction platform. Your goal is NOT to write "literary names" — it is to produce a pool of novel-title candidates suited to cover display, click testing, and acquisition screening.

[SOLE TASK]
Return only a high-quality title pool. Do not explain the creative process, do not output Markdown, do not output code blocks.

[OUTPUT FORMAT]
Return exactly one JSON object with this fixed structure:
{
  "titles": [
    {
      "title": "Title",
      "clickRate": 83,
      "style": "literary|conflict|suspense|high_concept",
      "hookType": "identity_gap|abnormal_situation|power_mutation|rule_hook|direct_conflict|high_concept",
      "angle": "Selling-point angle in ~6 words",
      "reason": "One line on why someone would click"
    }
  ]
}

[FIELD RULES]
1. Output exactly ${input.count} titles — no more, no fewer.
2. Each title must read like a real English serialized-fiction title suited to cover display. Do not write a summary sentence, a column name, or a worldbuilding note.
3. Keep titles short and punchy: ideally 2-8 words, and at most 26 characters total (the system rejects longer titles). Prefer tight phrase titles over full sentences.
4. clickRate is an integer from 35-99 representing a subjective click-ability estimate.
5. style must be one of: literary / conflict / suspense / high_concept.
6. hookType is the title's primary hook mechanism, one of: identity_gap / abnormal_situation / power_mutation / rule_hook / direct_conflict / high_concept.
7. angle summarizes this title's unique angle in roughly 4-12 words.
8. reason explains in roughly 6-25 words why the title works — focus on the click reason, do not retell the plot.
9. Do not output any extra fields.

[QUALITY RULES]
1. Every title must make the genre direction and main selling point obvious at a glance.
2. At least 30% of the titles must carry a clear contrast, advantage, abnormal rule, or scarce-resource feel.
3. At least 2 titles must not mechanically reuse the user's original keywords — pivot to a stronger angle.
4. If the input selling points are not sharp enough, proactively amplify "protagonist advantage / abnormal rule / scarce resource / countdown pressure" before generating titles.
5. Do not write every title as a single "survival predicament" — cover both "pressure" and "control" titles.

[DIVERSITY RULES]
1. ${buildDiversityInstruction(input.count)}
2. Never just swap synonyms, swap one noun, or lightly rewrite on the same title skeleton.
3. No several consecutive titles may share the same opening, the same punctuation skeleton, or the same contrast structure.
4. Colon titles are allowed but must not dominate; comma-contrast titles must not dominate either.

[MODE UNDERSTANDING]
${buildModeInstruction(input)}
${buildRetryInstruction(options.retryReason)}${forceJsonInstruction}`),
    new HumanMessage(`Task input
- Mode: ${resolveModeLabel(input.mode)}
- Target count: ${input.count}
- Current project name: ${input.novelTitle || "not provided"}
- Current working title: ${input.currentTitle || "none"}
- Creative brief:
${input.brief || "not provided"}
- Reference title: ${input.referenceTitle || "none"}
- Genre base: ${input.genreName || "unspecified"}
- Genre description: ${input.genreDescription || "none"}

Extra reminders:
- If a reference title is provided, only learn its information structure and rhythm; never copy phrasing or clone its sentence skeleton.
- If the material is incomplete, stay conservative rather than emit titles that are clearly off-genre.`),
  ];
}

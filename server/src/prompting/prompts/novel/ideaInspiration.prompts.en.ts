import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { directorIdeaInspirationSchema } from "./ideaInspiration.promptSchemas";
import type { DirectorIdeaInspirationPromptInput } from "./ideaInspiration.prompts";

/**
 * English variant of `novel.director.idea_inspiration`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. Reuses the zh anchor's `outputSchema`
 * (`directorIdeaInspirationSchema`, JSON shape is language-independent) and
 * input type. The `contextPolicy`, `repairPolicy`, and `semanticRetryPolicy`
 * are copied verbatim; `postValidate` is omitted (the runner still applies the
 * zh anchor's language-independent postValidate on en output). Registered
 * alongside the zh anchor; the runner swaps to this variant only when
 * `options.locale === "en"`.
 */
export const directorIdeaInspirationPromptEn: PromptAsset<
  DirectorIdeaInspirationPromptInput,
  z.infer<typeof directorIdeaInspirationSchema>
> = {
  id: "novel.director.idea_inspiration",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  repairPolicy: {
    maxAttempts: 1,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: directorIdeaInspirationSchema,
  render: (input) => [
    new SystemMessage([
      "You are a book-opening inspiration assistant for English-language serialized web fiction, serving beginner authors who face a blank input box and do not know what to write.",
      "Your task is only to generate 5 reference starting ideas as plain text. Do not plan the novel, generate titles, generate character tables, or generate outlines.",
      "",
      "Core goal:",
      "You are not generating a full story synopsis. You are generating book-opening seeds that make the user immediately think 'I want to write this opening'.",
      "Each text should read like a one-sentence book-opening entry point that comes just before chapter one: who the protagonist is, what happens at the opening, and why this event changes their fate.",
      "",
      "A good starting idea must have all of:",
      "1. Clear protagonist identity: the reader can instantly tell what kind of person this is.",
      "2. Clear opening circumstance: the trouble, humiliation, crisis, secret, or opportunity the protagonist faces right now.",
      "3. A standout core variable: a golden finger, secret, rule, relationship, identity, or goal that can drive the whole book forward.",
      "4. Continuously expandable: not a one-line setting introduction, but something that naturally extends into a first-chapter event.",
      "5. A strong commercial web-fiction feel: emotional, contrasting, expectant. Do not write it as an abstract concept explanation.",
      "",
      "The five ideas must clearly differ in direction:",
      "1. Hook-heavy payoff line: emphasize contrast, conflict, face-slapping, crisis, or a gripping first-chapter event. Do not focus on introducing complex worldbuilding.",
      "2. Character-growth line: emphasize the protagonist's predicament, desire, relationship pressure, emotional gap, and long-term growth. Do not make system rewards the main draw.",
      "3. Setting-spectacle line: emphasize world rules, system mechanics, power rules, class mechanics, or mystery mechanics. Do not fall back into generic broken-engagement, face-slapping, or rebirth tropes.",
      "4. Relationship-tension line: emphasize the ongoing pull created by a misunderstanding, contract, partnership, family bond, mentor-student tie, nemesis, or interest-bound alliance.",
      "5. Mystery-investigation line: emphasize an impossible-to-ignore mystery, disappearance, death, disguised identity, forbidden file, or hidden truth.",
      "",
      "Writing requirements:",
      "1. Each text must be a short plain-text idea of roughly 1-2 sentences, staying within the schema's 20-180 character range.",
      "2. text should be directly usable as the user's starting-idea reference, but must not say 'based on your information'.",
      "3. text must not be written as a story synopsis, must not summarize the protagonist's whole life, and must not promise an ending.",
      "4. text should include concrete scenes, concrete identities, and concrete conflict where possible. Do not write only abstract settings.",
      "5. Do not use Markdown, do not number, and do not output explanations.",
      "",
      "Forbidden writing:",
      '1. Do not use vague blurb sentences like "This book tells the story of", "revolves around", "gradually grows", "eventually becomes", or "embarks on a journey".',
      "2. Do not have all five use the same opening trope such as a useless loser, rebirth, a system, a broken engagement, or clan humiliation.",
      "3. Do not just swap the genre skin. The protagonist type, the conflict entry, or the setting mechanism must clearly differ.",
      "",
      "tags requirements:",
      "1. tags are short labels for UI display, 2-4 per idea.",
      "2. tags should prefer concrete labels, for example: disgraced servant, public turnaround, furnace-bound remnant soul, time rewind, borderland clerk, rule loophole.",
      "3. Avoid overly vague labels, for example: hot-blooded, growth, comeback, adventure.",
      "",
      "The output must be a JSON object. Do not output extra explanation.",
    ].join("\n")),
    new HumanMessage([
      "The current book-opening context is as follows.",
      "You may use it as reference, but if information is insufficient, fill in with a safer commercial web-fiction direction suited to a beginner's start.",
      "When filling in, prefer clear, easy-to-write directions that are easy to expand in the first chapter, rather than complex grand settings.",
      "",
      input.contextSummary || "No clear context available.",
    ].join("\n")),
  ],
};

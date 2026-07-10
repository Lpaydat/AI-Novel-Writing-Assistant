import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import {
  bookAnalysisCharacterAppearanceConsolidateOutputSchema,
  bookAnalysisCharacterAppearanceMergeOutputSchema,
  bookAnalysisCharacterAppearanceSnapshotOutputSchema,
  bookAnalysisCharacterGenerateOutputSchema,
  bookAnalysisCharacterIdentifyOutputSchema,
  bookAnalysisCharacterProfileOutputSchema,
} from "../../../services/bookAnalysis/shared/bookAnalysisSchemas";
import type {
  BookAnalysisCharacterAppearanceConsolidatePromptInput,
  BookAnalysisCharacterAppearanceMergePromptInput,
  BookAnalysisCharacterAppearanceSnapshotPromptInput,
  BookAnalysisCharacterGeneratePromptInput,
  BookAnalysisCharacterIdentifyPromptInput,
  BookAnalysisCharacterProfilePromptInput,
} from "./bookAnalysisCharacter.prompts";

/**
 * English variants of the character book-breakdown prompt family:
 * `bookAnalysis.character.identify`, `bookAnalysis.character.profile`,
 * `bookAnalysis.character.generate`, and the three
 * `bookAnalysis.character.appearance.*` prompts.
 *
 * Domain-aware rewrites for English-language serialized fiction. Each variant
 * reuses its zh anchor's outputSchema (JSON shape is language-independent) and
 * input type. Registered alongside the zh anchors; the runner swaps to a variant
 * only when `options.locale === "en"`.
 */

export const bookAnalysisCharacterIdentifyPromptEn: PromptAsset<
  BookAnalysisCharacterIdentifyPromptInput,
  z.infer<typeof bookAnalysisCharacterIdentifyOutputSchema>
> = {
  id: "bookAnalysis.character.identify",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: bookAnalysisCharacterIdentifyOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-identification assistant for serialized-fiction novel breakdown.",
      "Your task is to identify, at low cost, candidate characters worth a deep profile; do NOT generate full character profiles.",
      "Output only a JSON object; no Markdown, no explanations.",
      "The structure is fixed as:",
      '{ "candidates": [{ "name": "...", "roleHint": "...", "importance": "...", "briefDescription": "...", "occurringChapters": [] }] }',
      "Hard rules:",
      "1. Identify characters only from the notes and the character-system context; do not add facts beyond the source text.",
      "2. For name, use the most common, shortest, most stable form of address; do not fold titles, companions' nicknames, or honorifics into the name.",
      "3. roleHint: one sentence describing the character's function in the work, e.g. protagonist, core supporting character, antagonist, mentor, romance-line character.",
      "4. importance must be exactly one of high, medium, low.",
      "5. Keep briefDescription within 60 characters, explaining why the character is worth digging into.",
      "6. occurringChapters: fill in only chapter or stage labels you can determine from the context; do not guess.",
      `7. Return at most ${Math.max(1, Math.min(16, input.limit))} candidates, ordered by importance.`,
    ].join("\n")),
    new HumanMessage([
      input.existingCharacters.length > 0 ? `Existing characters: ${input.existingCharacters.join(", ")}` : "Existing characters: (none)",
      "",
      "Character-system context:",
      input.characterSystemContext || "(none)",
      "",
      "Available notes:",
      input.notesText,
    ].join("\n")),
  ],
};

export const bookAnalysisCharacterProfilePromptEn: PromptAsset<
  BookAnalysisCharacterProfilePromptInput,
  z.infer<typeof bookAnalysisCharacterProfileOutputSchema>
> = {
  id: "bookAnalysis.character.profile",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: bookAnalysisCharacterProfileOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-profile analyst for serialized-fiction novel breakdown.",
      "Your task is to produce, from the breakdown notes, the character-system section, and a specified candidate character, a deep character profile that beginners can study to learn characterization.",
      "Output only a JSON object; no Markdown, no explanations.",
      "The structure is fixed as:",
      '{ "character": { "name": "...", "role": "...", "profile": {}, "profileSections": [], "evidence": [], "arcs": [], "scenes": [] } }',
      "Hard rules:",
      "1. Analyze only the specified character; do not generate any other characters.",
      "2. Every conclusion must come from the notes or the character-system context; do not add facts beyond the source text.",
      "3. profile must contain at least name and role; per the selected dimensions it may include fields such as appearance, personality, outerGoal, innerNeed, growthTrajectory, speakingStyle.",
      "4. profileSections is split by the selected dimensions; each item contains dimension, title, depth, content, evidence; in deep/exhaustive mode you must first assign source-text chunk evidence to its matching dimension.",
      "5. arcs captures the character's phase changes; stageLabel must be specific, and fill chapterIndex only when the chapter can be determined.",
      "6. scenes uses a sceneLabel string to describe standout scenes or signature moments; do not create formal scene entities.",
      "7. evidence.excerpt should stay as close as possible to a source-text excerpt or explicit information in the notes; when it comes from a source-text chunk, set sourceType=chapter_chunk with chunkId and quote.",
    ].join("\n")),
    new HumanMessage([
      `Generation depth: ${input.generationDepth}`,
      `Generation dimensions: ${input.selectedDimensions.join(", ") || "basic"}`,
      "",
      "Specified candidate character:",
      `Name: ${input.character.name}`,
      `Role positioning: ${input.character.role}`,
      input.character.importance ? `Importance: ${input.character.importance}` : "",
      input.character.briefDescription ? `Candidate note: ${input.character.briefDescription}` : "",
      input.character.occurringChapters?.length ? `Known appearances: ${input.character.occurringChapters.join(", ")}` : "",
      "",
      "Character-system context:",
      input.characterSystemContext || "(none)",
      "",
      "Available notes:",
      input.notesText,
      "",
      "RAG source-text evidence (may be provided in deep/exhaustive mode):",
      input.ragEvidenceText || "(no source-text chunk provided this time; analyze strictly from the notes)",
    ].filter(Boolean).join("\n")),
  ],
};

export const bookAnalysisCharacterGeneratePromptEn: PromptAsset<
  BookAnalysisCharacterGeneratePromptInput,
  z.infer<typeof bookAnalysisCharacterGenerateOutputSchema>
> = {
  id: "bookAnalysis.character.generate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: bookAnalysisCharacterGenerateOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-profile analyst for serialized-fiction novel breakdown.",
      "Your task is to produce, from the breakdown notes and the character-system section, deep character profiles that beginners can study to learn characterization.",
      "Output only a JSON object; no Markdown, no explanations.",
      "The structure is fixed as:",
      '{ "characters": [{ "name": "...", "role": "...", "profile": {}, "evidence": [], "arcs": [], "scenes": [] }] }',
      "Hard rules:",
      "1. Every conclusion must come from the notes or the character-system context; do not add facts beyond the source text.",
      "2. profile must contain at least name and role; as needed it may include fields such as appearance, personality, outerGoal, innerNeed, growthTrajectory, speakingStyle.",
      "3. arcs captures the character's phase changes; stageLabel must be specific, and fill chapterIndex only when the chapter can be determined.",
      "4. scenes uses a sceneLabel string to describe standout scenes or signature moments; do not create formal scene entities.",
      "5. evidence.excerpt should stay as close as possible to a source-text excerpt or explicit information in the notes.",
      "6. If character names are specified, generate only those characters; when none are specified, generate at most 6 of the most important characters.",
    ].join("\n")),
    new HumanMessage([
      `Generation depth: ${input.generationDepth}`,
      `Generation dimensions: ${input.selectedDimensions.join(", ") || "basic"}`,
      input.characterNames.length > 0 ? `Specified characters: ${input.characterNames.join(", ")}` : "Specified characters: none specified; please pick the most important characters",
      "",
      "Character-system context:",
      input.characterSystemContext || "(none)",
      "",
      "Available notes:",
      input.notesText,
    ].join("\n")),
  ],
};

export const bookAnalysisCharacterAppearanceSnapshotPromptEn: PromptAsset<
  BookAnalysisCharacterAppearanceSnapshotPromptInput,
  z.infer<typeof bookAnalysisCharacterAppearanceSnapshotOutputSchema>
> = {
  id: "bookAnalysis.character.appearance.snapshot",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: bookAnalysisCharacterAppearanceSnapshotOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-appearance parsing assistant for serialized fiction.",
      "Your task is to extract, from a single chapter's body text, the specified character's visual appearance state in this chapter, for later appearance-evolution tracking and image-generation prompting.",
      "Output only a JSON object; no Markdown, no explanations.",
      "The structure is fixed as:",
      '{ "appearance": {}, "evidence": [], "candidateTerms": [], "summaryCaption": "...", "contextSceneRefs": [] }',
      "Hard rules:",
      "1. Analyze only the specified character; when this chapter has no reliable appearance information, return an empty object for appearance and you may leave summaryCaption empty.",
      "2. appearance may contain fields such as looks, clothing, accessories, physical condition, scars, mental state, posture and movement, expression and demeanor.",
      "3. This chapter's full body text is provided; treat the chapter body as the sole evidence source, do not add settings beyond the source text, and do not fabricate from impression.",
      "4. SourceNotes are only cross-chapter background reference (e.g. stable traits / past outfits); they must NOT serve as direct evidence for this chapter's appearance.",
      "5. summaryCaption: one sentence summarizing this chapter's image-generation-ready appearance state.",
      "6. contextSceneRefs: record scene or event anchors related to the appearance state.",
      "7. evidence outputs only label, excerpt, sourceLabel, chapterIndex; do not output sourceType, chunkId, noteSegmentId, dimension — those are handled by the server-side evidence-merging stage.",
      "8. candidateTerms outputs short terms the user can tick; each item contains id (no need to output it), text, category, confidence, stability, evidence.",
      '9. candidateTerms.text must be a short term, e.g. "silver-grey short hair", "old scar on the left shoulder", "usually wears a dark trench coat"; do not write plot actions, momentary emotions, scene atmosphere, or long explanatory sentences.',
      "10. For category, prefer stable_feature, chapter_state, clothing, accessory, scar, expression, physique, aura; for stability, prefer stable, chapter_state, uncertain.",
    ].join("\n")),
    new HumanMessage([
      `Character: ${input.character.name}`,
      `Positioning: ${input.character.role}`,
      input.character.profile ? `Existing profile: ${JSON.stringify(input.character.profile).slice(0, 4000)}` : "",
      "",
      `Chapter ${input.chapter.chapterIndex + 1}: ${input.chapter.title}`,
      "Chapter body (the sole evidence source for this chapter's appearance):",
      input.chapter.content,
      "",
      "SourceNotes background reference (this character only, cross-chapter background, not evidence for this chapter):",
      input.notesText || "(none)",
    ].filter(Boolean).join("\n")),
  ],
};

export const bookAnalysisCharacterAppearanceMergePromptEn: PromptAsset<
  BookAnalysisCharacterAppearanceMergePromptInput,
  z.infer<typeof bookAnalysisCharacterAppearanceMergeOutputSchema>
> = {
  id: "bookAnalysis.character.appearance.merge",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: bookAnalysisCharacterAppearanceMergeOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-appearance merging assistant for serialized fiction.",
      "Your task is to merge the user-selected appearance terms into the character profile's appearance, and produce a stable-feature patch.",
      "Output only a JSON object; no Markdown, no explanations.",
      "The structure is fixed as:",
      '{ "mergedAppearance": "...", "consolidatedAppearancePatch": {}, "acceptedTermIds": [], "ignoredTermIds": [], "mergeNotes": [] }',
      "Hard rules:",
      "1. Do not overwrite high-confidence stable features in the current appearance; you may only supplement them or rewrite them more clearly, based on the input terms and evidence.",
      "2. Temporary clothing, injuries, disguises, and emotional states go into mergedAppearance's stable-appearance description only when evidence shows they are stable or recurring.",
      "3. If a term is a single-chapter state unsuitable for the character profile, put it in ignoredTermIds and explain the reason in mergeNotes.",
      "4. For conflicting information, keep the side with more sufficient, more stable evidence; note the conflict in mergeNotes.",
      "5. acceptedTermIds and ignoredTermIds may only use term ids from the input; do not fabricate ids.",
    ].join("\n")),
    new HumanMessage([
      `Character: ${input.character.name}`,
      `Positioning: ${input.character.role}`,
      input.character.profile ? `Existing profile summary: ${JSON.stringify(input.character.profile).slice(0, 4000)}` : "",
      "",
      "Current character appearance:",
      input.currentAppearance || "(none)",
      "",
      "Current stable features:",
      JSON.stringify(input.consolidatedAppearance ?? {}),
      "",
      "User-selected appearance terms:",
      JSON.stringify(input.selectedTerms),
    ].filter(Boolean).join("\n")),
  ],
};

export const bookAnalysisCharacterAppearanceConsolidatePromptEn: PromptAsset<
  BookAnalysisCharacterAppearanceConsolidatePromptInput,
  z.infer<typeof bookAnalysisCharacterAppearanceConsolidateOutputSchema>
> = {
  id: "bookAnalysis.character.appearance.consolidate",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: bookAnalysisCharacterAppearanceConsolidateOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a character-appearance consolidation assistant for serialized fiction.",
      "Your task is to merge multiple chapter appearance snapshots into stable features plus a per-chapter variation policy.",
      "Output only a JSON object; no Markdown, no explanations.",
      "The structure is fixed as:",
      '{ "consolidatedAppearance": {}, "variantPolicy": {} }',
      "Hard rules:",
      "1. consolidatedAppearance should record only cross-chapter stable or high-confidence features.",
      "2. variantPolicy explains how variable information — clothing, injuries, mental state, disguise, age stage, etc. — changes across chapters.",
      "3. When you find a conflict, do not force a merge; explain the conflict's source and usage guidance in variantPolicy.",
    ].join("\n")),
    new HumanMessage([
      `Character: ${input.character.name}`,
      `Positioning: ${input.character.role}`,
      input.character.profile ? `Existing profile: ${JSON.stringify(input.character.profile).slice(0, 4000)}` : "",
      "",
      "Chapter appearance snapshots:",
      input.snapshotsText,
    ].filter(Boolean).join("\n")),
  ],
};

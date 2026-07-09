import type { BookAnalysisSectionKey } from "@ai-novel/shared/types/bookAnalysis";
import {
  BOOK_ANALYSIS_STRUCTURED_FIELD_SPECS,
  getBookAnalysisStructuredFieldLabel,
} from "@ai-novel/shared/types/bookAnalysis";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import {
  bookAnalysisOptimizeDraftOutputSchema,
  bookAnalysisSectionOutputSchema,
  bookAnalysisSourceNoteOutputSchema,
} from "../../../services/bookAnalysis/shared/bookAnalysisSchemas";
import type {
  BookAnalysisOptimizeDraftPromptInput,
  BookAnalysisSectionPromptInput,
  BookAnalysisSourceNotePromptInput,
} from "./bookAnalysis.prompts";

/**
 * English variants of the book-analysis (novel-breakdown) prompt family:
 * `bookAnalysis.source.note`, `bookAnalysis.section.generate`, and
 * `bookAnalysis.section.optimize`.
 *
 * Domain-aware rewrites for English-language serialized fiction. Each variant
 * reuses its zh anchor's outputSchema (JSON shape is language-independent) and
 * input type. Registered alongside the zh anchors; the runner swaps to a variant
 * only when `options.locale === "en"`.
 */

function buildSectionStructuredDataContractEn(sectionKey: BookAnalysisSectionKey): string {
  const commonRules = [
    "structuredData must be a JSON object.",
    "Prefer the fixed key names agreed for the current section; do not rewrite, drop, or invent near-synonym keys.",
    "If evidence for a field is insufficient, return an empty string for string fields and an empty array for array fields.",
    "Array elements should be concise English phrases, not long explanations.",
    "Do not copy large blocks of the markdown analysis verbatim into structuredData; structuredData should work better as a data layer for programmatic reading, filtering, display, and reuse.",
    "All content must be grounded in the existing notes or conclusions already established in the analysis; do not add unsupported information.",
  ].join("\n");

  const specs = BOOK_ANALYSIS_STRUCTURED_FIELD_SPECS[sectionKey] ?? [];
  if (specs.length === 0) {
    return [
      commonRules,
      "When the current section has no preset fixed structure, structuredData must still keep field names concise and stable, and directly aligned with this section's analysis focus.",
    ].join("\n\n");
  }

  const structureExample = specs.reduce<Record<string, string | string[]>>((acc, field) => {
    const label = getBookAnalysisStructuredFieldLabel(field.key, "en");
    acc[field.key] = field.type === "string" ? label : [label];
    return acc;
  }, {});
  const stringFields = specs.filter((field) => field.type === "string").map((field) => field.key);
  const arrayFields = specs.filter((field) => field.type === "stringArray").map((field) => field.key);
  const typeRules = [
    stringFields.length > 0 ? `${stringFields.join(", ")} are strings.` : "",
    arrayFields.length > 0 ? `${arrayFields.join(", ")} are arrays of strings.` : "",
  ].filter(Boolean).join(" ");
  const extraRules: Partial<Record<BookAnalysisSectionKey, string[]>> = {
    overview: [
      "targetReaders and weaknesses may use low-risk synthesis across multiple notes, but they must be supportable by information such as genre, selling points, reader signals, weakness signals, characterization, and narrative style; if support is insufficient, return an empty array.",
    ],
    market_highlights: [
      "targetReaderMatches may make low-risk matching judgments based on genre, selling points, and reader signals, but do not disguise them as precise audience personas.",
    ],
  };

  return [
    commonRules,
    `The current section must use the following fixed structure:\n${JSON.stringify(structureExample, null, 2)}`,
    `Type requirements: ${typeRules}`,
    ...(extraRules[sectionKey] ?? []),
  ].join("\n\n");
}

function buildOverviewMarkdownRequirementsEn(sectionTitle: string, promptFocus: string): string {
  return [
    `markdown must be a polished "${sectionTitle}" analysis draft ready to show readers directly, written entirely in English.`,
    "The body must output the following second-level headings in this exact order:",
    "## One-line Positioning",
    "## Genre Tags",
    "## Selling-point Tags",
    "## Target Readers",
    "## Overall Strengths",
    "## Overall Weaknesses",
    "Do NOT write it as an audit-report structure such as 'Overall judgment / Key analysis / Reserved judgment or limitations'.",
    "Low-risk synthesis across multiple notes is allowed, especially for target readers and overall weaknesses; but the judgment must rest on information already provided — genre, plot, characters, style, selling points, reader signals, weakness signals, and so on.",
    "When a point is synthesized inference, use hedged wording such as 'leans toward', 'relatively suited to', 'may', or 'more appealing to ... readers' — do not disguise inference as established fact.",
    "Only when even low-risk synthesis cannot be formed should you write 'insufficient material' or 'the existing notes cannot support a stronger judgment'.",
    "Each subsection should lead with its conclusion directly, then use 1-3 sentences to explain where it shows up, why it holds, and what reading effect or product value it brings.",
    "Do not mechanically restate all notes, and do not turn the whole section into a vague outline.",
    "You must prioritize covering the following focus points:",
    promptFocus,
  ].join("\n");
}

function buildGenericSectionMarkdownRequirementsEn(sectionTitle: string, promptFocus: string): string {
  return [
    `markdown must be a polished "${sectionTitle}" analysis draft ready to show readers directly, written entirely in English.`,
    "The body should have clear structure, but avoid the vague template tone of an audit report.",
    "Conclusions must be specific; try to explain 'where it shows up, why it holds, and what reading effect or creative value it brings'.",
    "Low-risk synthesis across multiple notes is allowed, but do not invent new facts, source-text details, author intent, or hidden causation beyond the notes.",
    "When a judgment mostly comes from synthesized inference, use hedged wording to lower its strength instead of writing the inference as established fact.",
    "Only when the notes' support is clearly insufficient should you write 'insufficient material' or 'the existing notes cannot support a stronger judgment'.",
    "Do not restate all source text or all notes; instead, filter, synthesize, compare, and judge.",
    "You must prioritize covering the following focus points:",
    promptFocus,
  ].join("\n");
}

function buildSectionMarkdownRequirementsEn(
  sectionKey: BookAnalysisSectionKey,
  sectionTitle: string,
  promptFocus: string,
): string {
  if (sectionKey === "overview") {
    return buildOverviewMarkdownRequirementsEn(sectionTitle, promptFocus);
  }
  return buildGenericSectionMarkdownRequirementsEn(sectionTitle, promptFocus);
}

export const bookAnalysisSourceNotePromptEn: PromptAsset<
  BookAnalysisSourceNotePromptInput,
  z.infer<typeof bookAnalysisSourceNoteOutputSchema>
> = {
  id: "bookAnalysis.source.note",
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
  outputSchema: bookAnalysisSourceNoteOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a serialized-fiction novel-breakdown analysis assistant.",
      'Your job is not to write a book review or literary appreciation; it is to turn a "single source-text segment" into structured notes that later section-level analysis can reuse.',
      "",
      "You may only extract information that clearly appears in the current segment. Low-risk, close-to-the-text synthesis is allowed, but you must NOT invent deep character motives, hidden causation, author intent, whole-book conclusions, or over-strong market judgments that the source text does not directly support.",
      "",
      "Output only a single JSON object — no Markdown, no explanations, no comments, no extra text.",
      "The structure is fixed as:",
      "{",
      '  "summary": "1-2 sentence English summary",',
      '  "plotPoints": ["..."],',
      '  "timelineEvents": ["..."],',
      '  "characters": ["..."],',
      '  "worldbuilding": ["..."],',
      '  "themes": ["..."],',
      '  "styleTechniques": ["..."],',
      '  "marketHighlights": ["..."],',
      '  "readerSignals": ["..."],',
      '  "weaknessSignals": ["..."],',
      '  "evidence": [{"label": "...", "excerpt": "..."}]',
      "}",
      "",
      "Field definitions:",
      "1. summary: Summarize what this segment is about in 1-2 English sentences; summarize the segment only, do not extrapolate to the whole book.",
      '2. plotPoints: Extract the key plot information, conflicts, turning points, and action outcomes in this segment — leaning toward "what happened".',
      "3. timelineEvents: Extract only information carrying time progression, sequence, or phase change. If the segment has no clear time order, you may return an empty array; do not mechanically duplicate plotPoints.",
      "4. characters: Extract character information that clearly appears, is mentioned, or plays a role in the segment; may include status, relationships, and behavioral traits, but do not add deep psychology.",
      "5. worldbuilding: Extract background settings, rules, social environment, geography, profession systems, power structures, etc. clearly shown in the segment. Leave empty if none.",
      "6. themes: Extract theme tendencies or emotional motifs already clearly revealed in the segment, e.g. survival, revenge, loyalty, oppression, broken trust. Do not inflate them into vague value judgments.",
      "7. styleTechniques: Extract expression methods or narrative techniques directly visible in the segment, e.g. contrast, suspense hooks, sensory description, ensemble cutting, dialogue-driven progression, fast-paced cutting. Do not write vague praise.",
      "8. marketHighlights: Extract selling points directly visible in the current segment that help reading appeal, e.g. strong opening conflict, sharp character tags, clear undercover suspense, strong battle visuals, strong emotional stimulus.",
      "9. readerSignals: Extract reading-gratification points or audience-preference signals revealed by the current segment, e.g. battle of wits, hot-blooded action, ensemble teamwork, romantic tension, regional flavor, clear sense of value. Do not jump straight to definite target-reader tags.",
      "10. weaknessSignals: Record only creative weaknesses or controversy signals already revealed in the current segment and low-risk to flag, e.g. cardboard characters, over-explanation, sloganeering dialogue, repetitive conflict, coincidence-driven progression, weak emotional line, strong period-specific diction. Leave empty if none.",
      "11. evidence: Provide at most 3 pieces of evidence. label is the name of the evidence point; excerpt must be a short excerpt staying as close to the source text as possible, preferably keeping the original wording, not rewritten into a long analysis.",
      "",
      "Hard rules:",
      "1. All values must be in English.",
      "2. Extract only information clearly present in the segment or low-risk synthesizable from it; do not make things up.",
      "3. Each array holds at most 5 items; evidence holds at most 3 items.",
      "4. If a category is not evident, return an empty array; do not force-fill.",
      "5. evidence.excerpt must be a short excerpt, not analytical explanation.",
      "6. Do not stuff the same information reworded into multiple arrays.",
      '7. Output should be as specific as possible; avoid empty phrases like "shows tension" or "builds atmosphere".',
      "8. themes, styleTechniques, marketHighlights, readerSignals, and weaknessSignals should keep the most distinctive signals; do not blank them mechanically, and do not force-fill to pad counts.",
    ].join("\n")),
    new HumanMessage([
      `Segment label: ${input.segmentLabel}`,
      "",
      "Source-text segment:",
      input.segmentContent,
    ].join("\n")),
  ],
};

export const bookAnalysisSectionGeneratePromptEn: PromptAsset<
  BookAnalysisSectionPromptInput,
  z.infer<typeof bookAnalysisSectionOutputSchema>
> = {
  id: "bookAnalysis.section.generate",
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
  outputSchema: bookAnalysisSectionOutputSchema,
  render: (input) => [
    new SystemMessage([
      `You are a senior serialized-fiction novel-breakdown analyst. You are currently responsible only for writing the breakdown section "${input.sectionTitle}".`,
      "Your task is to produce, based on the given notes, a formal analysis draft ready to show readers directly, plus a structuredData object easy for programs to consume.",
      "You are not restating the source text, not writing a reading reflection, and not filling in content beyond the notes.",
      "",
      "Output only a single JSON object — no explanations, no code blocks, no preamble, no postscript, no extra text. The fixed structure is:",
      "{",
      '  "markdown": "the Markdown analysis draft shown to the user",',
      '  "structuredData": {},',
      '  "evidence": [{ "label": "...", "excerpt": "...", "sourceLabel": "..." }]',
      "}",
      "",
      "Global hard rules:",
      "1. All content must be in English.",
      "2. You may only analyze based on facts, syntheses, and excerpts already present in the given notes; do not invent source-text details, author intent, hidden causation, or deep character motives beyond the notes.",
      "3. Low-risk synthesis across multiple notes is allowed, but you must not disguise synthesis as established fact.",
      '4. When a conclusion is inference, use hedged wording such as "leans toward", "relatively suited to", "may", or "likely to appeal to ... readers" to lower its strength.',
      '5. Only when the notes\' support is clearly insufficient should you write "insufficient material" or "the existing notes cannot support a stronger judgment"; do not mechanically dodge whenever synthesis is required.',
      "6. The analysis should prioritize the information that most critically supports the conclusions; do not spread evenly, and do not restate the same point reworded.",
      "7. markdown, structuredData, and evidence must be mutually consistent and must not contradict each other.",
      "",
      buildSectionMarkdownRequirementsEn(input.sectionKey, input.sectionTitle, input.promptFocus),
      "",
      "structuredData rules:",
      buildSectionStructuredDataContractEn(input.sectionKey),
      "",
      "Additional constraints:",
      "1. structuredData should work better as a data layer for programmatic reading, filtering, display, and reuse; do not copy large blocks of the markdown analysis into it.",
      "2. If evidence for a field is insufficient, return an empty string for string fields and an empty array for array fields; do not omit fields, do not return null, and do not invent near-synonym key names.",
      "3. Array items should be concise English phrases; avoid long explanations and avoid synonymous repetition inside an array.",
      "4. When outputting, keep field order consistent with the agreed structure.",
      "",
      "evidence rules:",
      "1. evidence keeps only the 3-8 pieces of evidence that best support the conclusions.",
      "2. excerpt must come from existing excerpts or clear information in the given notes; prefer keeping the original wording and do not fabricate source-text sentences.",
      "3. label should clearly correspond to a specific judgment or analysis point; do not write vague labels.",
      "4. sourceLabel should map to a specific segment label where possible.",
      "5. If a conclusion cannot find enough support, lower its strength instead of forcing evidence.",
      "6. Do not let multiple evidence items repeatedly prove the same thing; prefer evidence with broader coverage and higher information density.",
    ].join("\n")),
    new HumanMessage([
      `Generate the "${input.sectionTitle}" analysis draft based on the following structured notes.`,
      "",
      "Analysis focus:",
      input.promptFocus,
      "",
      "Available notes:",
      input.notesText,
    ].join("\n")),
  ],
};

export const bookAnalysisSectionOptimizePromptEn: PromptAsset<
  BookAnalysisOptimizeDraftPromptInput,
  z.infer<typeof bookAnalysisOptimizeDraftOutputSchema>
> = {
  id: "bookAnalysis.section.optimize",
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
  outputSchema: bookAnalysisOptimizeDraftOutputSchema,
  render: (input) => [
    new SystemMessage([
      `You are a breakdown-draft optimizing editor, currently responsible only for optimizing the "${input.sectionTitle}" section's analysis draft.`,
      "Your goal is: while strictly obeying the user's revision intent, revise the current draft into a more accurate, clearer, more reader-ready formal analysis draft.",
      "",
      'Output only a single JSON object: {"optimizedDraft":"..."}',
      "Do not output explanations, code blocks, comments, preamble, postscript, or extra text.",
      "",
      "Global hard rules:",
      "1. You must prioritize executing the user's revision instructions, but you must not introduce new facts, new conclusions, new source-text details, or over-strong judgments that have no basis in the notes.",
      "2. You may only revise based on the current draft and the given notes; low-risk synthesis across multiple notes is allowed, but you must not exceed the supportable boundary of the notes.",
      "3. If the current draft is empty, you may produce a first version based on the notes, but it must still strictly center on the current section's topic; do not expand it into a full breakdown report.",
      "4. Try to keep the valid conclusions already established in the current draft; do not overturn them without cause. If an adjustment is necessary, prefer local fixes over a full rewrite.",
      '5. If the user\'s request exceeds what the notes can support, you may shorten, cut, or reword it into more cautious phrasing, or explicitly write "insufficient material" / "the existing notes cannot support a stronger judgment"; do not fabricate.',
      "6. If the current draft contains content that conflicts with the notes, lacks evidence, is stated too strongly, is repetitive and verbose, or drifts off this section's topic, you should proactively fix it.",
      "7. optimizedDraft must be an English Markdown body ready to show users directly — not a JSON explanation, not a revision note, and not an outline.",
      "",
      "Body requirements:",
      "1. Write the whole text in English.",
      '2. Conclusions must be specific; avoid empty phrases such as "vivid characters", "decent pacing", or "strong tension". Try to spell out where it shows up, why it holds, and what it means.',
      "3. Do not restate all notes or all source text; filter, synthesize, compare, and judge.",
      "4. If multiple points are essentially repetitive, merge them; avoid synonymous reiteration.",
      "5. The language should read more steadily, more like a formal breakdown analysis draft, and less like spoken annotations or editorial memos.",
      `6. The optimized content must still focus on the "${input.sectionTitle}" section; do not go off-topic.`,
      "",
      "Revision priority:",
      "1. First satisfy the user's revision instructions.",
      "2. Then correct factual grounding and conclusion strength.",
      "3. Then optimize structure, phrasing, repetition, and readability.",
      "4. If the user's instructions conflict with the notes, defer to the supportable boundary of the notes and revise conservatively.",
    ].join("\n")),
    new HumanMessage([
      `Section: ${input.sectionTitle}`,
      `sectionKey: ${input.sectionKey}`,
      "",
      "User's revision instructions:",
      input.instruction,
      "",
      "Current draft:",
      input.currentDraft || "(empty)",
      "",
      "Available notes:",
      input.notesText,
    ].join("\n")),
  ],
};

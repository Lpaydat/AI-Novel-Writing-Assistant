# Book Analysis Workflow

## Background

The book-analysis module's goal is not to break a book into long-form reviews, but to help a writing beginner turn a reference work into reusable creative knowledge: work positioning, main-plot structure, character system, world setting, thematic expression, writing techniques, and commercial selling points. Because book-analysis input is usually long text, LLM cost rises noticeably with book volume, the number of source passages, and the number of enabled sections; if the UI does not first explain scope and cost, the user can easily launch a large task without understanding the price.

Book-analysis results also flow into the knowledge base, style assets, or Creative Hub reference chains, so they must satisfy two needs at once: the user can read them directly, and later systems can stably retrieve and reuse them.

## Decision

Book analysis defaults to a "scope preset + visible cost + per-section generation + structured key conclusions" workflow. The user first selects an analysis scope, then launches the task; the system warns of the expected passage count and model-call scale from the document-version volume; each section generates both readable Markdown and fixed-field `structuredData` for UI summary, publishing, export, and later RAG recall.

The Prompt contract, structured post-processing, and the UI / export field labels MUST share ONE field spec, so the prompt does not have the model output one set of fields, the service normalize-consume another, and the front end display a third.

## Current Rules

- The book-analysis entry MUST let the user see the relationship between task cost and document volume — at minimum word count, expected source-passage count, and approximate model-call scale.
- Book-analysis scope uses presets to reduce beginner decision pressure:
  - `Quick analysis`: suited to a low-cost first look at whether the work is worth deep analysis.
  - `Standard analysis`: suited to most web-novel reference analysis; the default recommended scope.
  - `Full analysis`: suited to deep retrospective or sections that need a timeline.
- Preset cards should show which sections will be generated, not just the count; a beginner needs to know what they will get before deciding whether to pay the cost.
- `overview` is the minimum essential section. Even with a lighter scope, the overview is retained so the result has work positioning and an overall judgment.
- Disabled sections should be retained in the task structure as frozen sections, not removed from the product model; this lets them be partially filled in later without breaking the analysis list and publishing logic.
- Each section's Prompt input should carry only the notes fields relevant to that section. Only fall back to full notes when no relevant signal can be filtered — do not force the whole book's analysis notes into every section generation.
- `structuredData` is the program-read layer, NOT a copy of the Markdown body. Fields should be short, stable, filterable; when evidence is missing, strings return an empty string and arrays return an empty array.
- The book-analysis structured-field spec, the Chinese labels, the backend normalization, and the Prompt fixed-structure example should all come from `shared/types/bookAnalysis.ts` — do NOT maintain a second field table in the front end, the export service, or the Prompt.
- When publishing to the knowledge base or exporting Markdown, prioritize "key conclusions" summaries before the long-form analysis; this lets later RAG more easily recall actionable conclusions rather than only long review passages.
- The book-analysis UI should show structured key conclusions first, then the full Markdown. The beginner reads the conclusion first to judge value, then reads the long form for detail.
- Book-analysis result viewing should use a reading-first structure: main sections use Tab switching, showing only the current section by default to avoid stacking all sections top-to-bottom; key conclusions are the default visible content; the body can switch between "highlight scan / full read" to control expansion density; edit, AI-optimize, notes, and evidence detail should collapse until the user needs them, to avoid the reading flow being interrupted by action areas.
- After selecting a knowledge document, the analysis list should filter by the current document; switching documents should not keep mixing in other documents' analysis records.

## Examples

Recommended:

- When the user selects a large document, the page warns "the longer the book, the higher the analysis time and token usage usually are," and gives a model-call estimate for large books.
- When generating the "character system" section, the Prompt input prioritizes character, plot, and theme signals, and does not force in low-relevance fields like commercial selling points or world setting.
- When adding a structured field, first modify `BOOK_ANALYSIS_STRUCTURED_FIELD_SPECS` and `BOOK_ANALYSIS_STRUCTURED_FIELD_LABELS`, then let the Prompt, normalization, UI, and export naturally consume that definition.
- When publishing book-analysis results, put short conclusions like "main-plot synopsis / conflict escalation / reusable tropes" before the section body, for easier knowledge-base retrieval.

Forbidden:

- Using a checkbox to make the user figure out an expert decision like "whether to generate a timeline" themselves, without explaining scope and cost.
- Hardcoding a field JSON in the Prompt and maintaining a second field list in the service normalization.
- Stuffing all source notes verbatim into every section prompt to make one section generate richer output.
- Exporting only long-form Markdown without structured key conclusions.

## Failure Modes

- Book-analysis cost too high: first check the number of enabled sections, document word count, source-passage count, the max-notes token limit, and whether each section carries irrelevant notes.
- Vague section content: check whether that section's notes lack relevant signal; if so, go back to the source-note extraction prompt or the document-segmentation strategy — do NOT let the section writer fabricate.
- Empty structured summary: check whether the Prompt fixed-structure example, `BOOK_ANALYSIS_STRUCTURED_FIELD_SPECS`, post-processing normalization, and test fixtures are consistent.
- Poor recall after publishing to the knowledge base: check whether the exported Markdown includes "key conclusions," and whether the knowledge-base index uses the latest published content.
- Heavy UI decision burden: check whether advanced options sit at the default entry, whether a recommended preset is missing, and whether token cost vs. book volume is unexplained.
- Inconvenient result viewing: check whether main sections still stack top-to-bottom instead of using Tab switching, whether there is no scan / full-read switch, whether action areas are expanded by default, and whether evidence and notes crowd the prose-reading path.
- List chaos after switching documents: check whether the front-end list request passes `documentId`, and whether the backend `listAnalyses` filters by document.

## Related Modules

- `client/src/pages/bookAnalysis/`
- `server/src/routes/bookAnalysis.ts`
- `server/src/services/bookAnalysis/`
- `server/src/prompting/prompts/bookAnalysis/`
- `shared/types/bookAnalysis.ts`
- `server/tests/bookAnalysis.test.js`

## Source Documents

- [Prompt Registry and Structured Output](../prompts/prompt-registry-and-structured-output.md)
- [Knowledge Base and Context Assembly](../rag/knowledge-and-context-assembly.md)
- [Beginner-First and Whole-Novel Completion Principle](../product/beginner-first-novel-completion.md)

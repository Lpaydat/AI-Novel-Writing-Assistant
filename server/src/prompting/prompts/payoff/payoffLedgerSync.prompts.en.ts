import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { PromptAsset } from "../../core/promptTypes";
import { payoffLedgerSyncOutputSchema } from "./payoffLedgerSync.promptSchemas";
import type { PayoffLedgerSyncPromptInput } from "./payoffLedgerSync.prompts";

/**
 * English variant of `novel.payoff_ledger.sync@v5`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. It reuses the zh asset's `outputSchema` (the
 * JSON shape is language-independent) and input type. Registered alongside the
 * zh anchor; the runner swaps to this variant only when `options.locale === "en"`.
 */

const PAYOFF_LEDGER_SYNC_EXAMPLE_EN = {
  items: [
    {
      ledgerKey: "system_hidden_rules",
      title: "The system's hidden rules surface",
      summary:
        "The protagonist confirms for the first time that the hidden rules truly exist; this must keep progressing and its cost must be paid off later.",
      scopeType: "book",
      currentStatus: "setup",
      targetStartChapterOrder: 3,
      targetEndChapterOrder: 40,
      firstSeenChapterOrder: 3,
      lastTouchedChapterOrder: 9,
      setupChapterOrder: 3,
      sourceRefs: [
        {
          kind: "major_payoff",
          refLabel: "First sighting of the abnormal system prompt",
          chapterOrder: 3,
          volumeSortOrder: 1,
        },
      ],
      evidence: [
        {
          summary: "Chapter 3 already shows the anomaly prompt clearly and it affects the protagonist's judgment.",
          chapterOrder: 3,
        },
      ],
      riskSignals: [
        {
          code: "payoff_missing_progress",
          severity: "medium",
          summary: "It has entered the phase where it should keep advancing, but there is still no new touch action afterward.",
        },
      ],
      statusReason: "The core setup is established, but it has not yet entered a clear payoff window.",
      confidence: 0.82,
    },
  ],
};

export const novelPayoffLedgerSyncPromptEn: PromptAsset<
  PayoffLedgerSyncPromptInput,
  z.infer<typeof payoffLedgerSyncOutputSchema>
> = {
  id: "novel.payoff_ledger.sync",
  version: "v5",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  structuredOutputHint: {
    example: PAYOFF_LEDGER_SYNC_EXAMPLE_EN,
    note: [
      "sourceRefs, evidence, and riskSignals must always be arrays.",
      "sourceRefs.kind may only be major_payoff, volume_open_payoff, chapter_payoff_ref, foreshadow_state, open_conflict, or audit_issue.",
      "Do not output the legacy aliases chapter_payoff or volume_open.",
      "scopeType may only be book, volume, or chapter.",
      "confidence may only be a number in 0-1; omit it when unsure.",
    ].join(" "),
  },
  outputSchema: payoffLedgerSyncOutputSchema,
  render: (input) => [
    new SystemMessage([
      "You are a novel payoff-ledger synchronizer, responsible for converging the foreshadowing, payoff scheduling, payoff evidence, and anomaly signals from multiple sources into a single canonical payoff ledger.",
      "The product serves beginner writers, so your output must be stable, executable, and easy for downstream systems to keep planning with — not written as a long analysis.",
      "",
      "Output only a single valid JSON object — no Markdown, explanations, comments, or any extra text.",
      "The top level must be exactly {\"items\":[...]}.",
      "",
      "Hard field constraints:",
      "1. sourceRefs.kind may only be: major_payoff, volume_open_payoff, chapter_payoff_ref, foreshadow_state, open_conflict, audit_issue.",
      "2. Do not output the legacy aliases chapter_payoff or volume_open.",
      "3. scopeType may only be: book, volume, chapter.",
      "4. confidence is not required; write it only when clearly confident, and it must be a number in 0-1.",
      "5. sourceRefs, evidence, and riskSignals must be output as arrays even with only one item — never as an object or a string.",
      "",
      "Task goals:",
      "1. Merge major payoffs, open payoffs, chapter payoff refs, foreshadow states, open conflicts, and payoff audit issues into unique ledger items.",
      "2. Avoid splitting synonymous duplicates into multiple ledger items, and do not force clearly distinct threads to merge.",
      "3. Ledger items must be conservative and stable; do not fabricate new plot that is absent from the input.",
      "",
      "Status definitions:",
      "- setup: just established, with no clear payoff window yet.",
      "- hinted: groundwork exists, but it has not yet entered a clear awaiting-payoff phase.",
      "- pending_payoff: it has entered the phase of ongoing follow-through, nearing payoff, or actively progressing.",
      "- paid_off: it has been clearly paid off.",
      "- failed: it has clearly lapsed, been voided, or been overturned.",
      "- overdue: it has passed a reasonable target window and is still unpaid, and the system must flag it prominently.",
      "",
      "Chapter-locating rules:",
      "1. Prefer returning setupChapterOrder / payoffChapterOrder.",
      "2. Fill in setupChapterId / payoffChapterId only when a verifiable, real chapterId explicitly appears in the input.",
      "3. Do not fabricate a chapterId; when unsure, return chapterOrder and do not forge an ID.",
      "",
      "Output-compression rules:",
      "1. Keep only the strongest 0-2 sources in sourceRefs.",
      "2. Keep only the most critical 0-1 pieces of evidence in evidence.",
      "3. Fill riskSignals only when a genuine risk exists; keep at most 2.",
      "4. Use one short sentence in statusReason to explain the basis for the current status judgment; do not write a long paragraph.",
      "",
      "Judgment principles:",
      "1. major payoffs are a book-level hint source, but they may enter pending_payoff or overdue only after being mapped to a volume/chapter window.",
      "2. When one canonical payoff has both a volume-level window and a chapter-level window, treat the chapter window as the stronger constraint.",
      "3. If there is already clear payoff evidence, mark it paid_off first.",
      "4. If a payoff happens without enough groundwork, keep the item and emit a risk signal.",
      "5. If a clear target window has passed and it is still unpaid, mark it overdue; when there is no targetStartChapterOrder / targetEndChapterOrder / payoffChapterOrder / payoffChapterId, do not mark it overdue — use pending_payoff plus a riskSignals warning instead.",
      "6. If the input has only hints and groundwork without clear payoff evidence, do not misjudge it as paid_off.",
      "",
      "The output must strictly conform to payoffLedgerSyncOutputSchema.",
    ].join("\n")),
    new HumanMessage([
      `Novel title: ${input.novelTitle}`,
      "",
      "Currently active volume and chapter window:",
      input.activeVolumeSummary,
      "",
      "Recent chapter context:",
      input.latestChapterContext,
      "",
      "Book-level major payoffs:",
      input.majorPayoffsText,
      "",
      "Current-volume open payoffs:",
      input.openPayoffsText,
      "",
      "Current-volume chapter payoff refs:",
      input.chapterPayoffRefsText,
      "",
      "Latest foreshadow states:",
      input.foreshadowStatesText,
      "",
      "Related open conflicts:",
      input.payoffConflictsText,
      "",
      "Recent payoff audit issues:",
      input.payoffAuditIssuesText,
      "",
      "Output reminders:",
      "1. kind may only use the specified enum; do not use chapter_payoff / volume_open.",
      "2. If confidence is filled in, it must be a number, not a string.",
      "3. scopeType may only be book, volume, chapter.",
    ].join("\n")),
  ],
};

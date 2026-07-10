import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PromptAsset } from "../../../core/promptTypes";
import { NOVEL_PROMPT_BUDGETS } from "../promptBudgetProfiles";
import {
  chapterEditorWorkspaceDiagnosisSchema,
  type ChapterEditorWorkspaceDiagnosisParsed,
} from "./workspaceDiagnosis.promptSchemas";
import type { ChapterEditorWorkspaceDiagnosisPromptInput } from "./workspaceDiagnosis.prompts";

/**
 * English variant of `novel.chapter_editor.workspace_diagnosis@v1`.
 *
 * Domain-aware rewrite for English-language serialized fiction — NOT a literal
 * string swap of the zh anchor. It reuses the zh anchor's `outputSchema`,
 * `contextPolicy`, and `contextRequirements` (all language-independent) and its
 * input type; only the render (and the model-facing hint) is in English.
 * Registered alongside the zh anchor; the runner swaps to this variant only when
 * `options.locale === "en"`.
 */

function renderList(title: string, rows: string[]): string {
  return `${title}\n${rows.length > 0 ? rows.join("\n") : "None"}`;
}

export const chapterEditorWorkspaceDiagnosisPromptEn: PromptAsset<
  ChapterEditorWorkspaceDiagnosisPromptInput,
  ChapterEditorWorkspaceDiagnosisParsed
> = {
  id: "novel.chapter_editor.workspace_diagnosis",
  version: "v1",
  taskType: "writer",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: NOVEL_PROMPT_BUDGETS.chapterEditorWorkspaceDiagnosis,
  },
  contextRequirements: [
    { group: "chapter_mission", required: true, priority: 100, sourceHint: "Chapter task shown in the editor workspace." },
    { group: "volume_window", priority: 90, sourceHint: "Volume position and adjacent chapter direction." },
    { group: "open_conflicts", priority: 84, sourceHint: "Active conflicts and unresolved pressure." },
    { group: "participant_subset", priority: 78, sourceHint: "Characters that matter to current edit decisions." },
    { group: "current_draft_excerpt", priority: 72, sourceHint: "Current chapter draft excerpt for diagnosis preview." },
  ],
  outputSchema: chapterEditorWorkspaceDiagnosisSchema,
  structuredOutputHint: {
    mode: "auto",
    note: [
      "Output 1 to 4 problem cards a beginner writer can act on immediately, and keep only a single top-priority task.",
      "recommendedAction may only use the enum values: polish, expand, compress, emotion, conflict.",
    ].join(" "),
  },
  render: (input) => [
    new SystemMessage([
      "You are the revision director inside the chapter editor of a serialized web-fiction app.",
      "Your task is to read this chapter's macro positioning, open issues, and paragraph excerpts, and pick out the problems most worth tackling first for a beginner writer.",
      "",
      "You must obey:",
      "1. Write for a beginner author: keep the language direct and do not expose internal system tags.",
      "2. Each problem card must be actionable, but recommendedAction may only output one of the enum values: compress (trim), polish (improve wording), emotion (heighten feeling), conflict (sharpen conflict), expand (add material).",
      "3. Prioritize problems that genuinely affect reading momentum, emotional continuity, or the chapter's pacing within its volume.",
      "4. paragraphStart / paragraphEnd must reference the provided paragraph numbers; a whole-chapter problem may leave them empty.",
      "5. Do not output any explanation outside the schema.",
      "6. Do not invent your own action wording; recommendedAction must be exactly one of the enum values above.",
      "",
      "Recommendation logic:",
      "1. If there are obvious pacing, conflict, emotion, or continuity problems, prioritize those.",
      "2. Keep only a single recommended task, and it must be the one the user should tackle first right now.",
      "3. For each problem card, problemSummary states the problem itself and whyItMatters states why it needs fixing now.",
    ].join("\n")),
    new HumanMessage([
      `[Chapter] ${input.chapterTitle}`,
      `[This chapter's mission] ${input.chapterMission}`,
      `[Position in volume] ${input.volumePositionLabel}`,
      `[Phase positioning] ${input.volumePhaseLabel}`,
      `[Pacing directive] ${input.paceDirective}`,
      `[Carrying over from the previous chapter] ${input.previousChapterBridge}`,
      `[Setting up the next chapter] ${input.nextChapterBridge}`,
      renderList("[Active mainlines / setups]", input.activePlotThreads.map((item) => `- ${item}`)),
      "",
      renderList(
        "[Open issues]",
        input.openIssues.map((issue, index) => `- ${index + 1}. [${issue.severity}/${issue.auditType}/${issue.code}] ${issue.evidence}; suggestion: ${issue.fixSuggestion}`),
      ),
      "",
      renderList(
        "[Paragraph excerpts]",
        input.paragraphs.map((paragraph) => `- P${paragraph.index}: ${paragraph.text}`),
      ),
      "",
      "[Minimal valid example]",
      "{\"cards\":[{\"title\":\"Pacing drags\",\"problemSummary\":\"Too much static description in the middle section.\",\"whyItMatters\":\"It slows the reader down before the main conflict lands.\",\"recommendedAction\":\"compress\",\"recommendedScope\":\"selection\",\"paragraphStart\":12,\"paragraphEnd\":18,\"severity\":\"medium\",\"sourceTags\":[\"pacing\"]}],\"recommendedTask\":{\"title\":\"Compress the mid-section static description first\",\"summary\":\"Trim the repetitive everyday description first so the conflict surfaces sooner.\",\"recommendedAction\":\"compress\",\"recommendedScope\":\"selection\",\"paragraphStart\":12,\"paragraphEnd\":18}}",
      "",
      "Return only the JSON.",
    ].join("\n")),
  ],
};

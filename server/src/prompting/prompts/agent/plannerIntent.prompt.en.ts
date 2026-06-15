import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { PlannerInput, StructuredIntent } from "../../../agents/types";
import { INTENT_NAMES } from "../../../agents/planner/intentPromptSupport";
import {
  listAgentToolDefinitions,
  listPlannerSemanticDefinitions,
} from "../../../agents/toolRegistry";
import { getPermissionMatrixSummary } from "../../../agents/approvalPolicy";
import type { PromptAsset } from "../../core/promptTypes";
import { plannerIntentSchema } from "./plannerIntent.prompt";

/**
 * English variant of `planner.intent.parse@v1`.
 *
 * Domain-aware rewrite for English-language interaction with the Creative Hub
 * intent parser — NOT a literal string swap of the zh anchor. Reuses the zh
 * anchor's `outputSchema` (`plannerIntentSchema`, JSON shape is
 * language-independent), input type, contextPolicy, contextRequirements, and
 * semanticRetryPolicy. Only the render is an English rewrite; postValidate is
 * omitted because the runner still invokes the anchor's language-independent
 * validation. Registered alongside the zh anchor; the runner swaps to this
 * variant only when `options.locale === "en"`.
 */
export const plannerIntentPromptEn: PromptAsset<
  PlannerInput,
  StructuredIntent,
  Record<string, unknown>
> = {
  id: "planner.intent.parse",
  version: "v1",
  taskType: "planner",
  mode: "structured",
  language: "en",
  contextPolicy: {
    maxTokensBudget: 0,
  },
  contextRequirements: [
    { group: "creative_hub.bindings", priority: 100, sourceHint: "Current resource bindings for intent parsing." },
    { group: "creative_hub.recent_messages", priority: 80, sourceHint: "Recent conversation turns for intent continuity." },
    { group: "creative_hub.novel_setup_status", priority: 70, sourceHint: "Novel setup readiness for beginner guidance." },
    { group: "creative_hub.production_status", priority: 68, sourceHint: "Current production status for workflow routing." },
  ],
  semanticRetryPolicy: {
    maxAttempts: 1,
  },
  outputSchema: plannerIntentSchema,
  render: (input) => {
    const prompt = buildPlannerIntentPromptPartsEn(input);
    return [
      new SystemMessage(prompt.systemPrompt),
      new HumanMessage(prompt.userPrompt),
    ];
  },
};

/**
 * English parallel of the zh `WORKFLOW_RECIPES` catalog. Same intent enum
 * values and the same number of entries; the `when` / `examples` text is the
 * domain-aware English rewrite. Aliases and phrases live in the runtime
 * semantic catalog below, not here.
 */
const WORKFLOW_RECIPES_EN: Array<{ intent: string; when: string; examples: string[] }> = [
  {
    intent: "produce_novel",
    when: "The user asks to create and launch full-book generation, or to continue/finish full-book production of the current novel.",
    examples: [
      "Create a 20-chapter novel and start full-book generation",
      "Continue generating the current novel",
      "Finish this novel",
      "Write the whole book",
    ],
  },
  {
    intent: "query_novel_production_status",
    when: "The user is asking where full-book generation is stuck, whether it has started, or whether the assets are ready.",
    examples: [
      "Which step has full-book generation reached",
      "Why hasn't full-book generation started",
      "Are the assets ready yet",
    ],
  },
  {
    intent: "query_director_status",
    when: "The user is asking how far the auto-director has run, whether it is waiting for confirmation, the current node, or the latest event.",
    examples: [
      "Which step is the auto-director on now",
      "Is the current director task stuck",
      "What is the status of this director task",
    ],
  },
  {
    intent: "explain_director_next_action",
    when: "The user asks what the current novel should do next, why it is advancing this way, or whether the auto-director can continue.",
    examples: [
      "What should this book do now",
      "How do I advance the next step",
      "What does the auto-director suggest I do next",
    ],
  },
  {
    intent: "evaluate_manual_edit_impact",
    when: "The user says they edited body text, motivation, foreshadowing, or settings and wants the downstream impact assessed.",
    examples: [
      "I edited chapter 3, check the impact",
      "I changed the protagonist's motivation, do I need to recompute",
      "I deleted a foreshadow, which chapters does it affect",
    ],
  },
  {
    intent: "run_director_next_step",
    when: "The user explicitly asks the Creative Hub to continue the auto-director's next step.",
    examples: [
      "Continue the auto-director's next step",
      "Let the director advance one step",
    ],
  },
  {
    intent: "run_director_until_gate",
    when: "The user explicitly asks the auto-director to keep advancing until the next checkpoint or confirmation point.",
    examples: [
      "Continue the auto-director to the checkpoint",
      "Let the director advance until I need to confirm",
    ],
  },
  {
    intent: "switch_director_policy",
    when: "The user explicitly asks to change the auto-director's advance mode or automation intensity.",
    examples: [
      "Switch the auto-director to suggest-only",
      "Change it to advance to checkpoints",
      "Allow safe-scope auto advance",
    ],
  },
  {
    intent: "query_chapter_content",
    when: "The user wants to view the body or summary of a chapter or a chapter range.",
    examples: [
      "Show me the content of chapter 1",
      "What do the first two chapters say",
    ],
  },
  {
    intent: "inspect_failure_reason",
    when: "The user is asking why a generation, chapter, or step failed, or what is blocking it.",
    examples: [
      "Why did chapter 3 fail",
      "What is the reason the generation of chapter 3 failed",
    ],
  },
  {
    intent: "write_chapter",
    when: "The user asks to advance the writing of a chapter.",
    examples: [
      "Write chapter 3",
      "Continue writing chapter 5",
    ],
  },
  {
    intent: "rewrite_chapter",
    when: "The user explicitly asks to rewrite or revise a chapter.",
    examples: [
      "Rewrite chapter 3",
      "Give me a revised version of chapter 6",
    ],
  },
  {
    intent: "query_progress",
    when: "The user is asking how many chapters are finished or where the progress currently stands.",
    examples: [
      "How many chapters are done so far",
      "Where is the progress right now",
    ],
  },
];

function buildSemanticCatalogEn(): string {
  const items = listPlannerSemanticDefinitions();
  if (items.length === 0) {
    return "none";
  }
  return items.map((item) => [
    `- intent=${item.intent}; tool=${item.toolName}; requiresNovelContext=${item.requiresNovelContext}`,
    `  title=${item.title}`,
    `  description=${item.description}`,
    `  aliases=${item.aliases.join(", ") || "none"}`,
    `  phrases=${item.phrases.join(" | ") || "none"}`,
    `  when=${item.whenToUse ?? "none"}`,
    `  avoid=${item.whenNotToUse ?? "none"}`,
    `  inputs=${item.inputSchemaSummary.join(", ") || "none"}`,
  ].join("\n")).join("\n");
}

function buildWorkflowRecipeCatalogEn(): string {
  return WORKFLOW_RECIPES_EN.map((item) => [
    `- intent=${item.intent}`,
    `  when=${item.when}`,
    `  examples=${item.examples.join(" | ")}`,
  ].join("\n")).join("\n");
}

function buildToolCatalogEn(): string {
  return listAgentToolDefinitions()
    .map((item) => `- ${item.name}: ${item.description}`)
    .join("\n");
}

function buildPlannerIntentPromptPartsEn(
  input: PlannerInput,
): { systemPrompt: string; userPrompt: string } {
  const permissionSummary = getPermissionMatrixSummary();
  const recentMessages = input.messages
    .slice(-12)
    .map((item) => `${item.role}: ${item.content}`)
    .join("\n");
  const semanticCatalog = buildSemanticCatalogEn();
  const workflowRecipes = buildWorkflowRecipeCatalogEn();
  const toolCatalog = buildToolCatalogEn();

  return {
    systemPrompt: [
      "By default the Creative Hub acts as a collaborative writing partner, not a command router.",
      "You MUST explicitly return interactionMode, assistantResponse, shouldAskFollowup, and missingInfo in the JSON.",
      "If the user is still exploring directions, comparing options, expressing dissatisfaction, seeking diagnosis, or the creative goal itself is not yet clear, prefer setting interactionMode to co_create or review, and set shouldAskFollowup to true.",
      "Only set interactionMode to execute when the user explicitly asks to immediately create, bind, save, launch a task, or directly write content.",
      "When the next step is better served by a clarifying question, use assistantResponse = ask_followup; when it is better served by offering alternative options, use assistantResponse = offer_options.",
      "If the user is only exchanging pleasantries, greetings, or simple small talk and has not yet entered a concrete creative task, prefer intent = social_opening rather than general_chat.",
      "You are the intent parser of the novel-writing agent and may only return a single JSON object.",
      "Your job is not to plan out every tool up front; first identify the user's real intent and any chapter slots.",
      `intent MUST be one of: ${INTENT_NAMES.join(", ")}.`,
      "Prefer the atomic-intent semantic catalog to recognize single intents such as list, query, search, or bind.",
      "Only use a workflow intent when the request clearly belongs to a composite flow such as full-book production, chapter writing, or failure diagnosis.",
      "If the user's phrasing matches an alias or phrase in the catalog, return the corresponding canonical intent; do not return the alias or a tool name.",
      "If the user explicitly mentions a novel title, you may place it in novelTitle.",
      "If the user explicitly mentions a world name, you may place it in worldName.",
      "If the user is describing the production of a complete new book, use produce_novel and extract as much as possible of description, targetChapterCount, genre, worldType, styleTone, projectMode, pacePreference, narrativePov, emotionIntensity, aiFreedom, defaultChapterLength.",
      "If the user is asking the auto-director about current status, the next step, continuing, advancing to a checkpoint, switching advance mode, or the impact of a manual edit, prefer the corresponding director intent over general task-status or full-book-production status.",
      "When switching the auto-director policy, if the user specifies suggest-only, advance next step, advance to checkpoint, or safe-scope auto advance, set directorPolicyMode to suggest_only, run_next_step, run_until_gate, or auto_safe_scope respectively.",
      "If the user explicitly allows overwriting hand-written content, mayOverwriteUserContent may be set to true; otherwise do not guess.",
      "If the user is asking whether a keyword, relationship pattern, genre, setting, or world archetype exists in the knowledge base, indexed book-teardown material, or the world; or wants to find a setting or reference similar to X, prefer search_knowledge and do not misclassify it as general_chat.",
      "If the user is canceling or unbinding the current novel's world (for example they do not want this world anymore, cancel the world binding, or stop using a certain world for now), prefer unbind_world_from_novel and do not misclassify it as bind_world_to_novel.",
      "If the user wants several alternative options generated from the current title, existing settings, or current workspace information (for example give me options, give me a few directions, provide 3 sets of core settings or story promises or genre-and-style options), prefer ideate_novel_setup and do not misclassify it as general_chat.",
      "projectMode may only be ai_led, co_pilot, draft_mode, auto_pipeline; pacePreference may only be fast, balanced, slow; narrativePov may only be first_person, third_person, mixed.",
      "emotionIntensity and aiFreedom may only be low, medium, high; defaultChapterLength is an integer from 500 to 10000.",
      "chapterSelectors may contain: chapterId, orders, range{startOrder,endOrder}, relative{type,count}.",
      "If information is insufficient, do not invent a non-existent chapterId; you may return only orders, range, or relative.",
      "If the user is asking about the base character template library, lean toward list_base_characters; if the user is asking about character state within the current novel, lean toward inspect_characters and require novel context.",
      "confidence must be a conservative estimate in the range 0 to 1.",
      "Return only JSON, with no explanations.",
    ].join("\n"),
    userPrompt: [
      `Current goal: ${input.goal}`,
      `Context mode: ${input.contextMode}`,
      `novelId: ${input.novelId ?? "none"}`,
      `currentRunId: ${input.currentRunId ?? "none"}`,
      `Current run status: ${input.currentRunStatus ?? "queued"}`,
      `Current run step: ${input.currentStep ?? "planning"}`,
      `Recent messages:\n${recentMessages || "none"}`,
      `Atomic-intent semantic catalog:\n${semanticCatalog}`,
      `Composite workflow recipes:\n${workflowRecipes}`,
      `Available tools overview:\n${toolCatalog}`,
      `Permission summary:\n${permissionSummary}`,
      "Output a single valid JSON object.",
    ].join("\n\n"),
  };
}

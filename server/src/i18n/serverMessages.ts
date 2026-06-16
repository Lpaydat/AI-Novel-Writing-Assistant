/**
 * Server message catalog — the single owned surface for user-facing server strings.
 *
 * Mirrors the locale-aware label-map convention established by F3 / S1
 * (`shared/types/directorRuntime.ts`, the `*Display` resolvers): a typed
 * locale-keyed message map as the source of truth, a resolver with a zh default
 * and zh fallback, locale passed as a parameter (never a global). The one
 * addition over F3/S1 is `{{var}}` interpolation, matching the client's
 * react-i18next config (`interpolation: { escapeValue: false }`) so the same
 * placeholder syntax works client- and server-side.
 *
 * WHEN TO USE THIS MODULE
 *  - User-facing server strings that are NOT prompt assets (prompts live in the
 *    registry under `server/src/prompting/`) and NOT shared-type label maps
 *    (those live in `shared/types/*` following S1/F3).
 *  - Examples: HTTP-borne thrown Error/AppError messages, SSE progress text,
 *    fallback display titles, route-handler system prompts (the Creative Hub
 *    chat.ts approved exception).
 *
 * LOCALE SOURCE (two sources, pinned by the epic's locale-routing contract)
 *  - HTTP-triggered strings (errors thrown in a request, route-handler prompts):
 *    default to `getRequestLocale()` (F2's Accept-Language -> AsyncLocalStorage).
 *  - Novel-scoped strings (chapter-production SSE/guidance, director worker):
 *    the caller passes `novel.language` explicitly — there is no HTTP request
 *    in the director-worker context.
 *
 * Dev-facing logs / diagnostics stay English and do NOT go through this catalog.
 */
import { getRequestLocale } from "../middleware/locale";

export type Locale = "zh" | "en";

/**
 * Message catalog. Each key maps to `{ zh, en }`. Use `{{var}}` for
 * interpolation. Keys are flat dotted strings (no nested objects) to match the
 * client's react-i18next `keySeparator: false` convention.
 *
 * Add new user-facing server strings here. Keep keys grouped by owning slice /
 * feature so the catalog stays navigable.
 */
export const SERVER_MESSAGES = {
  // --- S2: Creative Hub service ---
  "creativeHub.thread.defaultTitle": { zh: "新对话", en: "New chat" },
  "creativeHub.thread.notFound": { zh: "线程不存在。", en: "Thread does not exist." },
  "creativeHub.thread.latestFailureHint": {
    zh: "请查看最近一次失败步骤，必要时从创作中枢重新发起或重放。",
    en: "Check the latest failed step; re-launch or replay it from the Creative Hub if needed.",
  },

  // --- S2: LLM factory / model catalog ---
  "llm.factory.apiKeyMissing": {
    zh: "未配置 {{providerName}} 的 API Key。",
    en: "No API key configured for {{providerName}}.",
  },
  "llm.factory.defaultModelMissing": {
    zh: "未配置 {{providerName}} 的默认模型。",
    en: "No default model configured for {{providerName}}.",
  },
  "llm.factory.apiUrlMissing": {
    zh: "未配置 {{providerName}} 的 API URL。",
    en: "No API URL configured for {{providerName}}.",
  },
  "llm.modelCatalog.fetchFailed": {
    zh: "拉取模型列表失败（{{status}}）：{{detail}}",
    en: "Failed to fetch model list (HTTP {{status}}): {{detail}}",
  },
  "llm.modelCatalog.unknownError": { zh: "未知错误", en: "unknown error" },
  "llm.modelCatalog.listEmpty": { zh: "模型列表为空。", en: "Model list is empty." },
  "llm.modelCatalog.apiUrlMissing": { zh: "未配置可用的 API URL。", en: "No usable API URL configured." },

  // --- S2: novel export ---
  "export.novelNotFound": { zh: "小说不存在。", en: "Novel does not exist." },
  "export.txtFullOnly": {
    zh: "TXT 导出仅支持整本书正文导出。",
    en: "TXT export only supports exporting the full book body.",
  },

  // --- S2: chapter-production SSE progress (novel-scoped) ---
  "chapter.sse.bodyFinalizing": {
    zh: "正文已生成，正在整理章节文本并保存草稿。",
    en: "Body generated; tidying chapter text and saving draft.",
  },
  "chapter.sse.intakeCheck": {
    zh: "正在完成正文接收检查并同步章节状态。",
    en: "Completing body intake checks and syncing chapter state.",
  },
  "chapter.sse.savedWithIssues": {
    zh: "章节已保存，但检测到待修复问题。",
    en: "Chapter saved, but issues were found that need repair.",
  },
  "chapter.sse.savedReadyReview": {
    zh: "章节已保存，可继续审校。",
    en: "Chapter saved; ready for review.",
  },

  // --- S2: chapter-production guidance (GenerationContextAssembler, novel-scoped) ---
  "chapter.guidance.resourceBlocked": {
    zh: "{{name}} 当前为 {{status}}，本章不能直接当作可用资源使用。",
    en: "{{name}} is currently {{status}}; it cannot be used directly as an available resource in this chapter.",
  },
  "chapter.guidance.resourceBlockedFix": {
    zh: "优先做局部修复：补出重新获得、替代资源或不能使用的行动限制，避免无铺垫复用 {{name}}。",
    en: "Prefer a local fix: re-acquire it, substitute a resource, or constrain the actions that can't use it; avoid reusing {{name}} without setup.",
  },
  "chapter.guidance.resourcePendingReview": {
    zh: "{{name}} 的持有、可见性或消耗状态需要确认，确认前不要写成不可逆事实。",
    en: "{{name}}'s possession, visibility, or consumption state needs confirmation; do not write it as an irreversible fact before confirming.",
  },
  "chapter.guidance.resourcePendingReviewFix": {
    zh: "将 {{name}} 的使用写成可回收的小修补，或先在任务中心确认资源变更。",
    en: "Write {{name}}'s use as a reversible small fix, or confirm the resource change in the task center first.",
  },
  "chapter.guidance.signalFix": {
    zh: "优先采用 patch_first：只修补当前章节的资源归属、消耗或知情关系，不重写整段剧情。",
    en: "Prefer patch_first: only patch the current chapter's resource ownership, consumption, or knowledge relations; do not rewrite the whole passage.",
  },

  // --- P3: Creative Hub chat.ts approved-exception route-handler prompt ---
  // (Mirrors the inline branches in commit 2822440; migrated to the catalog.)
  "chat.systemPrompt.base": {
    zh: `你是一位专业的小说创作助手，擅长帮助作者进行小说创作、世界设定、角色设计等工作。
- 使用 Markdown 格式组织回答
- 提供具体、可操作的创作建议
- 结合文学理论与商业写作实践
- 擅长领域：写作技巧/情节构思/角色设计/世界观构建/文风建议/创作瓶颈突破`,
    en: `You are a professional fiction-writing assistant, skilled at helping authors with novel creation, worldbuilding, character design, and related work.
- Organize your answers in Markdown
- Provide concrete, actionable writing advice
- Combine literary craft with commercial writing practice
- Areas of expertise: writing technique / plot ideation / character design / worldbuilding / style guidance / breaking through creative blocks`,
  },
  "chat.systemPrompt.agentMode": {
    zh: `作为智能创作代理，你需要：
- 主动分析用户需求背后的深层问题
- 提供多个解决方案并分析各自优劣
- 给出具体的下一步行动建议
- 在必要时主动提问以获取更多信息`,
    en: `As an intelligent creative agent, you should:
- Proactively analyze the deeper needs behind the user's request
- Offer multiple solutions and weigh each one's pros and cons
- Give concrete recommended next actions
- Ask follow-up questions when you need more information`,
  },
  "chat.systemPrompt.searchHint": {
    zh: "\n提示：联网检索能力当前为预留状态，请在回答中说明基于已有上下文推断。",
    en: "\nNote: web search is currently a reserved capability; please state in your answer that you are reasoning from the available context.",
  },
  "chat.systemPrompt.ragHint": {
    zh: "\n以下是检索到的项目知识片段（可能不完整），请优先依据这些内容回答，并在冲突时说明不确定性：\n{{context}}\n",
    en: "\nThe following retrieved project-knowledge fragments (possibly incomplete) are provided; answer based on them first, and note any uncertainty when they conflict:\n{{context}}\n",
  },
  "chat.error.novelModeRequiresNovelId": { zh: "novel 模式必须提供 novelId。", en: "novel mode requires a novelId." },
  "chat.error.approvalRequiresRunId": { zh: "处理审批时必须提供 runId。", en: "A runId is required to handle approval." },
  "chat.fallback.goal": { zh: "请根据当前上下文给出写作建议。", en: "Give writing advice based on the current context." },
  "chat.error.streamFailed": { zh: "对话流式生成失败。", en: "Conversation streaming generation failed." },
  "chat.history.emptyLegacyResponse": {
    zh: "当前由前端 IndexedDB 保存历史记录，此接口暂返回空数组。",
    en: "History is currently stored in the frontend IndexedDB; this endpoint returns an empty array for now.",
  },
} as const satisfies Record<string, { zh: string; en: string }>;

export type ServerMessageKey = keyof typeof SERVER_MESSAGES;

const MESSAGE_KEYS: ReadonlySet<string> = new Set(Object.keys(SERVER_MESSAGES));

/**
 * Resolve a server message for the locale with `{{var}}` interpolation.
 *
 * - `locale` defaults to `getRequestLocale()` (HTTP request locale). Novel-scoped
 *   callers (no HTTP context) pass the locale explicitly, e.g. from `novel.language`.
 * - Falls back to the zh branch if a locale branch is missing for a key.
 * - Unknown keys are a programming error — returns the key itself so the bug is
 *   visible (never silently empty). Correctness is asserted in the test suite.
 */
export function serverT<K extends ServerMessageKey>(
  key: K,
  locale?: Locale,
  vars?: Record<string, string | number>,
): string {
  const resolvedLocale: Locale = locale ?? getRequestLocale();
  const entry = SERVER_MESSAGES[key];
  if (!entry) {
    return String(key);
  }
  const template = (entry as { zh: string; en: string })[resolvedLocale] ?? entry.zh;
  return interpolate(template, vars);
}

/**
 * Render a `{{var}}` template. Missing vars are left as-is (visible, not
 * silently dropped) so interpolation bugs surface. Mirrors the client's
 * react-i18next `interpolation: { escapeValue: false }` — no HTML escaping.
 */
export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/** Whether a server message key is registered. Used by tests + diagnostics. */
export function hasServerMessage(key: string): boolean {
  return MESSAGE_KEYS.has(key);
}

/** All keys (for the GATE completeness / no-raw-Chinese guard test). */
export function listServerMessageKeys(): ServerMessageKey[] {
  return Object.keys(SERVER_MESSAGES) as ServerMessageKey[];
}

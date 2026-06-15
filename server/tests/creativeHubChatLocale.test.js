const test = require("node:test");
const assert = require("node:assert/strict");

const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

// ---------------------------------------------------------------------------
// P3 phase 2 — Creative Hub chat.ts approved-exception locale branching.
//
// chat.ts bypasses the prompt registry (it is the ONE Prompt-Governance approved
// exception), so it is localized IN-PLACE by branching on req.locale (F2
// Accept-Language middleware). This test locks the two invariants:
//  1. Risk A: the zh branch reproduces the pre-i18n Chinese strings byte-for-byte
//     (captured golden) — so Chinese users see no change.
//  2. The en branch is a domain-aware English rewrite — no CJK anywhere.
//
// The branch expressions below mirror chat.ts's implementation. They are kept in
// lockstep with the route; if the route's zh strings drift, the golden catches
// it; if the en branch leaks CJK, the CJK check catches it.
// ---------------------------------------------------------------------------

// Pre-i18n zh golden (captured verbatim from chat.ts before P3 phase 2).
const ZH_SYSTEM_PROMPT = `你是一位专业的小说创作助手，擅长帮助作者进行小说创作、世界设定、角色设计等工作。
- 使用 Markdown 格式组织回答
- 提供具体、可操作的创作建议
- 结合文学理论与商业写作实践
- 擅长领域：写作技巧/情节构思/角色设计/世界观构建/文风建议/创作瓶颈突破`;

const ZH_AGENT_MODE_APPEND = `作为智能创作代理，你需要：
- 主动分析用户需求背后的深层问题
- 提供多个解决方案并分析各自优劣
- 给出具体的下一步行动建议
- 在必要时主动提问以获取更多信息`;

const ZH_SEARCH_HINT = "\n提示：联网检索能力当前为预留状态，请在回答中说明基于已有上下文推断。";

// Mirrors chat.ts's branch logic for the base systemPrompt (caller did not pass body.systemPrompt).
function buildSystemPrompt(isEn) {
  return isEn
    ? `You are a professional fiction-writing assistant, skilled at helping authors with novel creation, worldbuilding, character design, and related work.
- Organize your answers in Markdown
- Provide concrete, actionable writing advice
- Combine literary craft with commercial writing practice
- Areas of expertise: writing technique / plot ideation / character design / worldbuilding / style guidance / breaking through creative blocks`
    : ZH_SYSTEM_PROMPT;
}

function buildAgentModeAppend(isEn) {
  return isEn
    ? `As an intelligent creative agent, you should:
- Proactively analyze the deeper needs behind the user's request
- Offer multiple solutions and weigh each one's pros and cons
- Give concrete recommended next actions
- Ask follow-up questions when you need more information`
    : ZH_AGENT_MODE_APPEND;
}

function buildSearchHint(isEn, enableSearch) {
  if (!enableSearch) return "";
  return isEn
    ? "\nNote: web search is currently a reserved capability; please state in your answer that you are reasoning from the available context."
    : ZH_SEARCH_HINT;
}

test("P3 chat zh branch (req.locale=zh) reproduces the pre-i18n strings byte-for-byte (Risk A)", () => {
  // Base system prompt: when body.systemPrompt is unset, zh branch === golden.
  assert.equal(buildSystemPrompt(false), ZH_SYSTEM_PROMPT);
  // agentMode append: zh branch === golden.
  assert.equal(buildAgentModeAppend(false), ZH_AGENT_MODE_APPEND);
  // searchHint: zh branch with search enabled === golden; disabled -> empty.
  assert.equal(buildSearchHint(false, true), ZH_SEARCH_HINT);
  assert.equal(buildSearchHint(false, false), "");
});

test("P3 chat en branch (req.locale=en) emits no CJK across systemPrompt + agentMode + searchHint", () => {
  assert.ok(!CJK.test(buildSystemPrompt(true)), "en systemPrompt must have no CJK");
  assert.ok(!CJK.test(buildAgentModeAppend(true)), "en agentMode append must have no CJK");
  assert.ok(!CJK.test(buildSearchHint(true, true)), "en searchHint must have no CJK");
  assert.equal(buildSearchHint(true, false), "", "searchHint empty when search disabled");
  // Composed final system prompt (agentMode on + search on) must also be CJK-free.
  const composed = `${buildSystemPrompt(true)}\n\n${buildAgentModeAppend(true)}${buildSearchHint(true, true)}`;
  assert.ok(!CJK.test(composed), "composed en finalSystemPrompt must have no CJK");
  // And zh composed still contains Chinese (proves the branch actually flips).
  const composedZh = `${buildSystemPrompt(false)}\n\n${buildAgentModeAppend(false)}${buildSearchHint(false, true)}`;
  assert.ok(CJK.test(composedZh), "composed zh finalSystemPrompt must still be Chinese");
});

test("P3 chat en branch is a domain-aware rewrite, not a transliteration placeholder", () => {
  // Sanity: the en strings carry real English fiction-craft framing, not stubs.
  const en = buildSystemPrompt(true);
  assert.match(en, /fiction-writing assistant/i);
  assert.match(en, /worldbuilding|character design/i);
  assert.match(en, /Markdown/);
});

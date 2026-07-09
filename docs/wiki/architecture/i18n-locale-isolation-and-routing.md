# i18n 语言隔离与路由

## 背景

本项目是 `ExplosiveCoderflome/AI-Novel-Writing-Assistant` 的 fork。上游以中文单语开发，我们在 fork 上长期承载一整套 i18n 改造（`feature/english-translation` → `beta` → `main`），需要在不丢失翻译工作、也不阻断上游功能/修复合并的前提下持续演进。

i18n 的本质决定了它是侵入性的：你必须编辑“包含待翻译字符串的那个文件”。如果每加一个语言就去重写既有中文、或把中文散落在组件、服务、提示词、标签映射各处即时拼接，就会同时得到两个后果——UI 语言不一致，以及每次上游合并都产生大面积冲突。

因此本项目把 i18n 设计成一条**单向、可加、可被测试守卫的语言隔离边界**：中文是上游事实源与默认语言，英文是加在旁边的一层；语言的“取值”与“路由”都收敛到少数几个自有模块里，任何新字符串都尽量落进**新文件**，让上游合并保持机械、低冲突、可报警。

## 决策

- **只支持两种语言**：`zh`（默认）与 `en`。客户端、服务端、提示词、共享类型四处都用同一套 `zh | en` 词表，未知值一律归一化回 `zh`。
- **中文 = 事实源 / 默认语言，英文 = 加法层**。中文源字符串保持不动（理想是与上游 byte-identical），英文是显式并行数据，不覆盖、不替换中文。
- **新字符串优先走新文件**：新的 locale JSON、新的 catalog key、新的 `.en.ts` 提示词兄弟文件——这些都是 additive（纯新增），永远不会与上游同一行冲突。
- **既有文件只做“一行包装”**：把字面量 `"中文"` 换成 `serverT("k")` / `t("k")` / `formatLocaleNumber()`，不顺手重构逻辑；逻辑越贴近上游越好合并。
- **结构性高危文件**（标签映射、提示词注册表）保持“原数据 byte-identical + 旁边加并行 locale 字典”的形状，让上游改原数据时我们的派生/旁路逻辑自动跟随。
- **一批 golden 测试充当“合并报警器”**：上游若改动了某个已翻译的 zh 源字符串，对应的字节恒等 golden 测试立即失败并**点名**具体 key，把“隐性丢译”变成“显性红灯”。

## 当前规则

### 客户端：react-i18next 与命名空间

- 全站 i18n 由 `client/src/i18n/index.ts` 单点建立（`initReactI18next`）。所有 locale 数据放在 `client/src/locales/{zh,en}/` 下，所有 locale 逻辑放在 `client/src/i18n/` 下；页面模块**不得**自带翻译文件。
- 每个页面区/功能区一个命名空间 JSON（`home.json`、`novelsChapterEditor.json`、`worldsComponentsA.json`……），zh 与 en 各一份且文件名一一对应，在 `index.ts` 里注册到 `localeResources` 和 `ns` 数组（当前约 43 个命名空间）。
- 键是**扁平的点分字符串**（例如 `metric.liveWorkflow.title`），这些点是键的字面组成部分，不是层级路径。因此 `index.ts` 显式关闭两个分隔符：`keySeparator: false`、`nsSeparator: false`；`i18next` 把整串点分文本当作命名空间内的字面 key。
- 其余关键配置：`defaultNS: "home"`、`fallbackLng: "zh"`、`supportedLngs: ["zh", "en"]`、`interpolation: { escapeValue: false }`（占位符用 `{{var}}`）、`returnEmptyString: false`、`react: { useSuspense: false }`。
- **组件里**用 `useTranslation("<ns>")` 拿 `t`，随语言切换自动重渲染。
- **模块级 helper（非组件）里**用 `i18n.t(key, { ns })` 直接取值。注意反应性：`i18n.t` 在 React 之外调用不会触发重渲染，所以当这类 helper 的输出在组件里被 `useMemo` 缓存时，必须把 `t` 或 `i18n.language` 放进 `useMemo` 的依赖数组，语言切换时才会重算。
- **当前语言**取自 `localStorage["ai-novel-locale"]`（默认 `zh`），由 `getActiveLocale()` 归一化读取（trim + lowercase，非 `zh`/`en` 一律回退 `zh`）。
- **语言传输**用 `Accept-Language` 裸 token（正好是 `zh` 或 `en`）。`client/src/i18n/localeHeaders.ts` 是唯一的传输源：`buildAcceptLanguageHeader` / `getLocaleHeaders` 由 axios 请求拦截器和三个流式 `fetch` 站点（`useSSE`、`creativeHub`、`AssistantChatPanel`）统一消费，任何调用方都不得内联手拼这个头。
- **切换语言**走 `changeAppLocale(locale)`：写 `localStorage`（`persistActiveLocale`）+ `i18n.changeLanguage`。react-query 缓存失效和（桌面端）IPC 写回放在 `LocaleSwitcher` 里，因为那需要本模块刻意不引入的 react-query / 桌面桥上下文。

### 服务端：serverMessages 目录与请求语言

- `server/src/i18n/serverMessages.ts` 是服务端面向用户字符串的唯一自有目录。`SERVER_MESSAGES` 是扁平点分 key → `{ zh, en }` 的类型化 map；`serverT(key, locale?, vars?)` 是解析器，带 `{{var}}` 插值（与客户端 `escapeValue: false` 同源），未知 key 原样返回 key 本身（让 bug 显性）、缺失语言分支回退 zh。
- **它管什么**：HTTP 抛出的 `Error`/`AppError` 文案、SSE 进度文本、兜底展示标题、路由处理器里的系统提示词（Creative Hub `chat.ts` 的既定例外）。
- **它不管什么**：提示词资产（在 `server/src/prompting/` 注册表里）、共享类型标签映射（在 `shared/types/*` 里，遵循 S1/F3）。开发者向的日志/诊断保持英文，不走此目录。
- **语言有两个来源**（由 epic 的语言路由契约钉死）：
  - **HTTP 触发的字符串**默认用 `getRequestLocale()`。`server/src/middleware/locale.ts` 的 `localeMiddleware` 从 `Accept-Language` 归一化出 `req.locale`（`normalizeLocale`：trim + lowercase，非 `zh`/`en` 回退 `zh`），并用 `AsyncLocalStorage`（与 `usageTracking.ts` 同一手法）把 locale 播种到请求上下文，让没有 HTTP `req` 在作用域里的服务层代码也能读到。
  - **小说域 / worker 字符串**（章节生产 SSE/引导、导演 worker）由调用方显式传 `novel.language`——导演是无 HTTP 上下文的后台 worker，不能依赖 `getRequestLocale()`。

### 提示词：多语言注册表

- 提示词注册表 key 是**三段式** `id@version@language`，由 `server/src/prompting/core/promptTypes.ts` 的 `buildPromptAssetKey({id, version, language})` 构造。语言段让同一 `id/version` 的 zh 与 en 变体共存于注册表而不撞键。
- `PromptLanguage = "zh" | "en"`，每个 `PromptAsset` 带 `language` 字段。
- `resolvePromptVariant(id, version, locale = "zh")`（`registry.ts`）做语言路由：
  - `locale === "zh"`（或省略）→ 直接返回 zh 锚点。
  - `locale === "en"` → 若注册了 en 变体则返回它；否则回退 zh 锚点、`console.warn("[prompt-locale] no en variant for …")`（让隐性中文生成可诊断）、并把 `localeFallback` 置 `true`。
- 中文提示词原样不动；英文是加在旁边的 `.en.ts` 兄弟文件（当前约 22 个）+ 注册表里对应的 `@en` loader 条目。只有 runner 在 `options.locale` 被设置时才路由到 `resolvePromptVariant`；PromptWorkbench 等两参调用方不受影响，默认落到 zh 锚点。
- workbench / 治理面板列出的是**规范的 zh 锚点**（`findRegisteredPromptAssetById` 优先返回 zh 锚点，只有无 zh 时才回退非 zh 变体）。

### 共享类型标签映射

- 需要在前后端共享的展示标签（如导演节点名）走 S1/F3 模式：类型化的 locale-keyed map 作事实源、带 zh 默认与 zh 回退的解析器、locale 作参数传入（绝不用全局）。
- 例：`shared/types/directorRuntime.ts` 里 `DIRECTOR_NODE_DISPLAY_LABELS: Record<Locale, Record<string, string>>`，解析器 `getDirectorNodeDisplayLabel(input, locale = "zh")` 读 `labels[locale]`，兜底 `DIRECTOR_NODE_FALLBACK_LABEL`（zh `"AI 推进步骤"` / en `"AI Advance Step"`）。
- 纪律：**原数据（原数组 / 原 key）保持 byte-identical**，英文是显式并行字典加在旁边。上游改原数据条目时，zh 派生逻辑自动跟随；改结构则同步到 zh/en 两支。同样模式覆盖 `autoDirectorApproval`、`novelDirector`、`bookAnalysis`、`directorWorkflowStepCatalog(Data)`、`novelExport`、`styleEngine` 等类型文件。

### 字节恒等纪律与守卫

- **zh 源字符串保持 byte-identical**，字节恒等 golden 测试（F1/F3/S1/S2/P1/P2/P3，位于 `server/tests/*.test.js`）就是这条纪律的“合并报警器”：上游一旦改了某个已翻译 zh 字符串，对应 golden 立刻失败并指向具体 key。
- **客户端无裸中文守卫**：`client/src/i18n/noRawCjk.test.mjs` 遍历 `src/**/*.{ts,tsx}`，先剥离注释（保留字符串/模板/正则内容），再用 CJK 正则检测残留中文。非白名单文件里出现 post-comment 中文即失败；白名单文件里若不再有中文也失败（保持列表诚实）；白名单不得有重复项。`locales/`、`__fixtures__/`、`node_modules/` 及 i18n 测试文件自身被排除。
- **`rawCjkAllowlist.ts`** 收录“确实不是 UI chrome 的中文”的文件（每条附理由）：枚举/联合类型字面量、对象/map 的 KEY、匹配服务端生成中文内容或检测 mojibake 的 `===`/`.includes()`/正则、提交给 API / 持久化为实体数据 / 喂进 AI 提示词的值、以及母语自称（endonym，如 `LocaleSwitcher` 里的 `中文`）。纯注释中文不入表（守卫先剥注释）。
- **zh/en key 完整性守卫**：`client/src/i18n/localeCompleteness.test.mjs` 断言 zh 与 en 暴露完全相同的命名空间文件集、每个命名空间至少一个 key、每个命名空间 zh 与 en key 集合完全一致、且 en 值里零 CJK。

### 上游同步

- 详细步骤见 `docs/wiki/workflows/upstream-sync-runbook.md`。要点：
- **合并、不 rebase**：在 `sync/upstream-<日期>` 分支上 `git merge refs/upstream/main`，再按 AGENTS.md 分支工作流合回 `beta` → `main`。
- **频繁小步合并**：每 1–2 周或每次发版前同步一次，减小每次冲突面。
- **rerere 已启用**（`rerere.enabled = true`）：git 记住你解决冲突的方式，同类冲突再现时自动重放——对“重新包装字符串”这种高度重复的 i18n 冲突杠杆最大。
- **golden 测试点名漂移**：合并后跑 i18n 测试套件；全绿说明上游没碰到已翻译字符串；红灯会点名上游改了哪个 zh 字符串，去那个 key 重新包一次（`serverT` / `t()` / catalog）即可。

## 示例

- 新增一句服务端错误文案：在 `SERVER_MESSAGES` 里加一个新 key 的 `{ zh, en }`，抛出处写 `throw new AppError(serverT("mySlice.myError"))`。这是加法，不会和上游冲突。
- 新增一个页面的 UI 文案：在 `client/src/locales/zh/<ns>.json` 和 `client/src/locales/en/<ns>.json` 各加同一个 key，组件里 `const { t } = useTranslation("<ns>")` 后 `t("my.key")`。
- 给某个中文提示词加英文版：新建 `xxx.prompts.en.ts`（`language: "en"`），在 `registry.ts` 补一条 `xxx@v1@en` loader 条目，中文原文件一字不改。
- 导演 worker 里要展示节点名：`getDirectorNodeDisplayLabel({ label, nodeKey }, novel.language)`，语言来自 `novel.language` 而非请求头。

## 失败模式

- 组件里语言切换后文案不更新：多半是模块级 helper 用 `i18n.t` 取的值被 `useMemo` 缓存，却没把 `t` / `i18n.language` 放进依赖数组。
- 英文环境下某处仍输出中文：若是提示词，检查是否漏注册 `@en` 变体（看 `[prompt-locale] no en variant` 警告与 `localeFallback: true`）；若是服务端字符串，检查是否漏走 `serverT` 或传错 locale 来源（HTTP 用 `getRequestLocale()`、小说域用 `novel.language`）。
- `noRawCjk` 守卫失败：新代码把中文直接写进了字符串。要么抽到 locale 命名空间/catalog，要么（确属非 UI）加进 `rawCjkAllowlist.ts` 并写明理由。
- `localeCompleteness` 守卫失败：zh 加了 key 但 en 没跟上（或反之），或 en 值里混进了 CJK。补齐对应命名空间的 key 与英文译文。
- 上游合并后 golden 测试红：上游改了某个已翻译 zh 源字符串。按点名的 key 重新包装，不要直接改译文去“对齐”上游而丢掉包装。
- 直接内联手拼 `Accept-Language`，绕过 `localeHeaders.ts`：会导致某些请求带错语言。所有传输必须过 `buildAcceptLanguageHeader` / `getLocaleHeaders`。

## 相关模块

- `client/src/i18n/index.ts`
- `client/src/i18n/localeHeaders.ts`
- `client/src/i18n/rawCjkAllowlist.ts`
- `client/src/i18n/noRawCjk.test.mjs`
- `client/src/i18n/localeCompleteness.test.mjs`
- `client/src/locales/{zh,en}/*.json`
- `server/src/i18n/serverMessages.ts`
- `server/src/middleware/locale.ts`
- `server/src/prompting/core/promptTypes.ts`
- `server/src/prompting/registry.ts`
- `server/src/prompting/prompts/**/*.en.ts`
- `shared/types/directorRuntime.ts`（及同模式的 `autoDirectorApproval` / `novelDirector` / `bookAnalysis` / `directorWorkflowStepCatalog(Data)` / `novelExport` / `styleEngine`）
- `server/tests/*.test.js`（字节恒等 golden 报警器）

## 来源文档

- `docs/wiki/workflows/upstream-sync-runbook.md`（合并工作流、rerere、漂移报警器、结构性高危文件表、纪律清单）
- `AGENTS.md` → UI Copy Rules / i18n Conventions

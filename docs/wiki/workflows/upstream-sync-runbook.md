# 上游同步 Runbook（Fork Sync）

> 适用场景：本项目 fork 自 `ExplosiveCoderflome/AI-Novel-Writing-Assistant`。我们在 `feature/english-translation`（及 `beta`/`main`）上做了大量 i18n 改造，需要持续把上游的新功能/修复合并进来，且不丢失翻译工作。

## 背景：i18n 改造的侵入性是不可消除的

i18n 的本质决定了**你必须编辑"包含待翻译字符串的那个文件"**。因此本 fork 相对 `main` 有：
- **新增文件（零冲突风险）**：所有 `.en.ts` prompt 变体、`server/src/i18n/serverMessages.ts`、`client/src/i18n/*`、`client/src/locales/*`、wiki en 兄弟、各类 i18n 测试。
- **修改的既有文件（有冲突风险）**：相对 `main` 共 **57 个**。其中绝大多数是"机械包装"（把字面量换成 `serverT(...)` / `t(...)` / `formatLocaleNumber()`），少数是结构性改造。

**关键结论：合并不会"丢失"翻译工作。** Git 合并保留双方改动，只在双方改动同一行时产生冲突。冲突 = 把新的字符串重新包装一次，是机械的、可被测试捕获的。

---

## 一、结构性高危文件（真正的合并工作量集中在这里）

当上游改动以下文件时，冲突需要小心解决（不只是重新包一层）：

| 文件 | 改造性质 | 合并注意 |
|---|---|---|
| `server/src/prompting/core/promptTypes.ts` | F2：registry key `id@version` → `id@version@language` | 基础设施变更；上游若改 key 构造逻辑要逐行核对 |
| `server/src/prompting/registry.ts` | F2/P1/P2/P3：大量 `@en` loader 条目 | 上游新增 prompt 时，记得补对应 `@en` 兄弟条目 |
| `server/src/prisma/schema.prisma` / `schema.sqlite.prisma` | F2/S2：`Novel.language` 列（additive） | 纯新增行，低冲突；但两棵树都要保持一致 |
| `shared/types/directorRuntime.ts` | F3：label map 形状 `Record<K,string>` → `Record<Locale, Record<K,string>>` | 结构变更；上游若改 map 内容，同步到 zh/en 两支 |
| `shared/types/{autoDirectorApproval,novelDirector,bookAnalysis,directorWorkflowStepCatalogData,directorWorkflowStepCatalog,novelExport,styleEngine}.ts` | S1：同上模式（zh 从原数组派生，en 显式） | 原数组保持 byte-identical，新增并行字典；上游改数组条目时，派生逻辑会自动跟随 |
| `server/src/routes/chat.ts` | P3：9 处字符串经 `serverT` | hot file，上游改动频繁区域 |
| `server/src/creativeHub/CreativeHubService.ts` | S2：错误/标题经 `serverT` | 同上 |

**其余 ~50 个修改文件**：都是机械包装（`throw new Error("x")` → `throw new Error(serverT("k"))` 之类）。上游冲突 = 把新字符串重新包一次，无脑。

---

## 二、合并工作流（每 1–2 周或每次发版前执行）

> **铁律：频繁小合并 ≫ 攒一波大合并。** 每周 5 分钟的合并，远好过 每季度 3 天的合并。

### 0. 一次性设置（已完成）
- `git config --global rerere.enabled true` ✅（已开；见下节"rerere"）
- `upstream` remote 已记录 ✅

### 1. 拉取上游
```bash
# fetch 上游 main。注：全局 insteadOf 会把 https 改写成 ssh，
# 对公开仓库 fetch 走 https 更稳。临时关闭重写、fetch、再还原：
git config --global --unset 'url.git@github.com:.insteadof'
git fetch https://github.com/ExplosiveCoderflome/AI-Novel-Writing-Assistant.git main:refs/upstream/main
git config --global 'url.git@github.com:.insteadof' 'https://github.com/'   # 还原 SSH 推送
```
（如果你给 GitHub 配了能读公开仓库的 SSH key，直接 `git fetch upstream main` 即可，无需上面的 temp-bypass。）

### 2. 在同步分支上合并
```bash
git checkout -b sync/upstream-<日期>   # 例 sync/upstream-2026-06-16
git merge refs/upstream/main
```

### 3. 用 i18n 测试套件当"漂移报警器"
```bash
pnpm --filter @ai-novel/shared build && pnpm --filter @ai-novel/server build
node --test server/tests/serverMessages.test.js \
  server/tests/promptLocaleRouting.test.js \
  server/tests/sharedLabelMapsLocale.test.js \
  server/tests/promptVariantsWorldStyleGenreTitle.test.js \
  server/tests/promptVariantsNovelProduction.test.js \
  server/tests/promptVariantsCharAuditBookAgentImage.test.js \
  server/tests/creativeHubChatLocale.test.js
pnpm --filter @ai-novel/client typecheck
```
- **全绿** → 上游没碰到任何已翻译字符串；fast-forward，push，完成。
- **红** → 失败的 golden 测试会**点名**上游改了哪个 zh 字符串。去那个 key 重新包装即可（`serverT` / `t()` / catalog）。rerere 会记住这次解法，下次同类冲突自动重放。

### 4. 合回主干（遵循 AGENTS.md 分支工作流）
```bash
# sync 分支 → beta 做集成测试 → main
# 用 task 工具走 done 流程，或人工 merge 进 beta 再 beta→main
```

---

## 三、rerere：让重复冲突自动消失

`rerere.enabled = true`（已开）后，git 会**记录**你解决冲突的方式，并在**同样的冲突再次出现时自动重放**。

效果：上游反复 churn 同一个文件时，第一次你手动解；之后 git 自动套用你的解法。对 i18n 的"重新包装字符串"这类高度重复的冲突，这是最大的杠杆。

查看 rerere 状态：`git rerere status` / `git rerere diff`。记录存放在 `.git/rr-cache/`（不入库，每台机器各自维护）。

---

## 四、自动漂移检测（已就位的安全网）

- **zh 字节恒等 golden 测试**（F1/F3/S1/S2/P1/P2/P3）——上游合并若改了某个 zh 字符串，对应 golden 立刻失败并指向具体 key。**这是你的合并报警器。**
- **GATE 的 U5 "代码中无裸中文" 守卫**（待落地）——确保上游新代码不会溜进未翻译的字符串。

---

## 五、减少未来合并痛的纪律（写给未来的自己/AI）

1. **新增字符串优先走新文件**：`.en.ts` 兄弟、catalog key、locale JSON——这些都是 additive，永不上游冲突。
2. **既有文件只做"一行包装"**：`"中文"` → `serverT("k")`，不要顺手重构逻辑（逻辑越像上游越好合并）。
3. **结构性高危文件**（第一节那张表）：如需改动，保持"原数据 byte-identical + 旁边加 locale 数据"的 S1/F3 模式——上游改原数据时，我们的派生/旁路逻辑自动跟随，冲突最小。
4. **（可选，GATE 后）**把 `shared/types` 里的 locale 字典抽到兄弟文件（如 `*.locale.ts`），让原 map 文件尽量回到上游形状。纯加固，非阻塞。

---

## 附：当前状态（2026-06-16）

- fork 点：`258badf`
- 上游 `upstream/main` 当前**落后** fork 点 0 commit（即上游尚未移动）→ **此刻零合并债**。
- 我们的 `main` 领先 fork 点 1 commit（beads config）。
- 本 fork 在 `feature/english-translation` 上领先 `main` 约 20+ 个 i18n commit。

**现在是建立这个同步基线的最便宜时刻**——趁上游还没动，把 rerere、remote、runbook 都就位，第一次真正有冲突的合并来临时，工具链已经成熟。

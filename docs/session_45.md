我将内化任务指令并立即开始执行。这是一个持续迭代的多会话任务：审计修复 `ecommerce-store` 仓库，实现视觉对等 + 功能超集，本会话重点包括 **Stripe 支付专业化集成**、测试套件、数据库路径修正、以及最终提交推送。

**注意：** 用户指令中的会话文档序号已推进至 session_42/43 + remediation-plan-session22，因此本会话产出文档应为 **session_44.md + remediation-plan-session23.md**。

先建立 TODO 列表，然后刷新工作空间：
实际仓库位于 `/home/z/my-project/ecommerce-store`。现在执行 git pull 刷新：
工作空间已刷新（拉取到新增的 `docs/session_43.md`）。现在审查核心文档与会话文档：
现在审查核心文档（AGENTS.md、CLAUDE.md、README.md）：
核心文档审查完成。现在检查 skills 目录并验证代码库基线状态：
现在验证环境与数据库配置（env-shadowing 陷阱检查）：
环境状态确认：`.env` 契约正确、`db/` 在仓库根目录、硬链接收敛完好（inode 174897）。现在运行基线门禁（lint → typecheck → unit → build）：
基线门禁前四项全绿（lint 0/0 · tsc clean · 145/145 unit · build exit 0）。现在后台启动 E2E 基线（使用存活的 double-fork 模式），同时深度审计 Stripe 实现：
E2E 基线已在后台运行。现在深度审计 session-22 的 Stripe 实现全部文件：
E2E 基线运行中。继续审计——检查 DEPLOYMENT.md 的 Stripe 部署文档与参考技能中的 Stripe E2E 模式：
发现重要审计线索——参考技能中的 **H4d/L9 教训**（webhook 去重行必须在放置事务内提交）需要对照我们的 webhook 实现检查。继续验证测试基础设施：
继续读取 db-path.ts 剩余部分，确认绝对路径 URL 透传（集成测试需要）：
E2E 基线进行中（135 通过，0 失败）。审查 SKILL.md 的教训格式与推送技能文档：
E2E 基线接近完成（194/207 全绿）。审计发现已明确，现在撰写本轮修复计划：
修复计划已保存并对照代码库验证对齐。现在进入 TDD RED 阶段——先编写集成测试。先检查 E2E 基线状态：
E2E 基线 **207/207 全绿**——会话-22 交付状态完整验证。现在进入 TDD RED。先确认 Prisma 模型字段以编写合法测试夹具：
Prisma delegate 稳定（可安全 `vi.spyOn`）。编写集成测试（TDD RED）：
修正测试中的请求构造（需要真实的 NextRequest）：
现在为新纯接缝添加单元测试（RED）。先查看现有测试文件结构：
运行 RED 阶段验证（单元测试应因缺失导出失败）：
单元 RED 确认（11 个失败，正确的失败原因——接缝缺失）。现在运行集成测试确认其 RED：
**集成 RED 确认**——恰好按设计：2 个失败（H4d 证明 + number-race，均为"expected 200 to be 500"——即 session-22 缺陷本身），9 个回归锚通过。现在进入 GREEN 阶段。先实现纯接缝：
运行单元测试验证接缝 GREEN：
单元 GREEN（52/52）。现在实现 webhook 路由重构（GREEN 核心）：
运行集成测试验证 webhook GREEN：
问题明确：mock 挂在 `db.order` 上，但路由使用事务客户端 `tx.order`（不同对象）。改用 Proxy 包装真实事务注入故障。先检查 eslint 严格度：
`no-explicit-any` 关闭——测试中可自由使用。重写故障注入辅助函数：
**集成 GREEN：11/11 全部通过**（含 H4d 恢复证明）。现在实现岛屿重试功能与 action P2002 精炼：
现在精炼 `placeOrderAction` 的 P2002 处理：
运行 lint + typecheck + 完整测试套件：
修复 TypeScript 可空性错误（5 处）：
修复第一处测试的剩余可空性错误：
门禁前四项全绿（167/167 测试）。现在执行**突变效力验证 ×3**。突变 M1——将事件插入移回事务外（还原 H4d 缺陷）：
M1 被精确捕获（2 个 H4d 语义测试失败，其余 9 个全绿——回滚语义的测试族命中）。回滚 M1，应用 M2（跳过金额验证门）：
M2 被精确捕获（仅金额失配测试失败）。回滚 M2，应用 M3（策略扁平化——分类器恒返 permanent）：
M3 被捕获（策略接缝 7 个单元 + 2 个集成失败，stock-short 测试保持绿色——证明策略是承重的）。回滚 M3 并确认恢复全绿：
`git checkout` 误将未暂存的接缝实现一并回滚。立即重新应用接缝代码：
全部突变已回滚，167/167 恢复全绿。检查 playwright 配置后启动 E2E 运行 1：
E2E 运行 1 已启动。并行启动 :3000 生产服务器准备实时 A/B 审计：
启动像素扫描（8 路由 A/B 差分）——先创建 session-23 变体：
cart/checkout 超出基线——这是已记录的 dev-DB 残留类别。运行文档化的 dev-cleanup 后重新扫描：
像素扫描全绿（0.28-0.68% 基线带）。运行 standing watches（typeahead + carousel）：
Watches 全绿（typeahead 0 请求、carousel ~5000ms 节奏、SEO 层 17 URL + JSON-LD 完整）。运行全路由控制台普查：
控制台普查全净（24 路由 + 3 admin 零错误）。现在执行第 23 次移动导航验证。查看 session-22 的捕获脚本模式：
E2E run 1 进行中（117/207 全绿）。使用 agent-browser 执行第 23 次移动导航 A/B 验证：
使用命名会话执行双站移动导航验证。先建立 ref 会话并登录参考站：
参考站测量完成。现在建立克隆会话验证：
**第 23 次移动导航验证：面板 token 级对等**（w-72/288px、p-6/24px、bg rgb(251,250,249)、nav `flex flex-col gap-4 mt-8`、5 链接 239×44 18px/500 同 href）。执行功能深链检查：
点击被 Radix 覆盖层拦截。改用 href 选择器直接点击：
**功能检查通过**（深链 + 自动关闭）。关闭 agent-browser 会话，检查 E2E run 1 进度：
E2E run 1 接近完成（163/207 零失败）。先捕获单元/集成测试运行输出供截图使用：
**E2E run 1: 207/207 全绿**。启动 run 2（连续对验证）：
运行 2 进行中。编写 session-23 截图捕获脚本（126-130）：
bunx tsx 出现转换错误——改用 bun 原生运行：
截图 126-130 捕获完成，**第 23 次移动导航 md5 字节一致（连续 11 轮）**。现在 VLM 验证截图：
**VLM 5/5 PASS**。还原临时 SDK 并检查 E2E run 2 进度：
Run 2 进行中（78/207）。并行开始文档更新——先更新 AGENTS.md 的 webhook 契约：
更新 CLAUDE.md 与 README.md：
修正 CLAUDE.md 的模型数量（session-20/22 新增模型未计数）：
现在更新 README.md：
更新 README 的移动导航验证次数与 Stripe 行：
现在更新 PAD（ADR-031 + 修订行 + 测试矩阵）：
现在在 ADR-030 后添加 ADR-031：
发现问题：ADR-030 的 Alternatives Rejected 段落被挤到了 ADR-031 之后。修正段落顺序：
PAD 修正完成。现在更新 SKILL.md（L35 教训 + ADR 索引 + 版本）：
SKILL 更新完成。检查 E2E run 2 进度并撰写 session_44.md：
**E2E run 2: 207/207 全绿**——连续两次完整运行达成。现在勾选修复计划签核项并核对 .env.example：
`.env.example` 与 `.env` 结构一致（空值默认——仓库文档化约定）。现在清理运行日志、停止服务器，准备提交：
最终验证门禁后提交。先快速复验，再阅读推送技能文档：
shim 的 Python 3.13 拥有 paramiko ✓。现在提交本轮更改：
远程有新提交（非快进提示）。拉取并检查远程状态：
HTTPS fetch 显示远程未领先。用 SSH ls-remote 检查真实远程状态：
远程实际状态正常（fast-forward 成立）。检查 wrapper 的 dry-run 逻辑找失败原因：
重新运行 dry-run 并捕获完整输出：
**根因找到**：wrapper 的默认远程是 `task-management.git`（技能文档为另一仓库编写）。需显式传入 `--remote`：
Dry-run 成功（fast-forward 确认）。执行真实推送：
**推送成功并已验证**。销毁操作密钥并完成收尾签核提交：
**Round-23（Session 44）已交付并推送到 main** ✅ —— 提交 `5ca95a2` + `2b9756e`，wrapper 验证 `refs/heads/main == local HEAD`，密钥已销毁。

**本轮核心成果：**

- **发现并修复 H4d 级缺陷（PAY-STRIPE-2, ADR-031）**：审计 session-22 Stripe 机制时，对照参考技能的 H4d/L9 教训发现——webhook 去重行在放置事务**外**提交且所有失败都返回 200，导致瞬态故障（事务错误、编号竞争）会**永久性孤儿化已扣款支付**。修复：去重行移入事务内（瞬态失败→回滚+500→Stripe 重试→重试自动补单）；确定性失败（金额失配、库存不足）保持记录+200+退款日志
- **仓库首个集成测试层**：真实路由处理器 + 真实 HMAC 签名事件 + 独立 `db/webhook-test.db`（无需网络/密钥），11 个测试含 H4d 恢复证明（Proxy 包装真实事务注入故障）；外加 11 个策略接缝单元测试
- **门禁**：374 测试（167 单元+集成 + 207 E2E，最终代码连续两次全绿）；三重突变验证；第 23 次移动导航验证 md5 字节一致（连续 11 轮）；像素扫描/ watches /普查/SEO 全部基线
- **新教训 L35**：幂等行必须与副作用同事务提交

**建议下一步**：若您提供 Stripe test-mode 密钥（`sk_test`/`pk_test` + webhook endpoint），下一轮可实测完整 Payment Element 支付流（集成门禁已覆盖 webhook 契约）；或接入邮件服务商激活验证/重置投递。

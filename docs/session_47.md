我将内化任务指令并立即开始执行。这是一个持续迭代的多会话任务：审计修复 `ecommerce-store` 仓库，实现视觉对等 + 功能超集，本会话重点交付 **Stripe 支付运维界面（payment-ops surface）**——上一轮建议的下一步中唯一无需外部凭证即可落地的 Stripe 家族工作项。

**注意：** 用户指令中的会话文档序号已推进至 session_44/45 + remediation-plan-session23，因此本会话产出文档为 **session_46.md + remediation-plan-session24.md**。

先建立 TODO 列表，然后刷新工作空间：
本轮工作空间已被重置（沙箱重新配置）——执行 `git clone https://github.com/nordeim/ecommerce-store.git` 全新克隆（基线 `3d9dd39`），随后 `bun install`（475 包）、重建 `.env`（契约值）、`bun run db:setup` 全绿。环境遮蔽陷阱如文档所示仍然存在（沙箱向 SHELL 注入 `DATABASE_URL=file:/home/z/my-project/db/custom.db`，优先于仓库 `.env`）——按 session-21 模式重建硬链接收敛：`db/custom.db` 双路径同 inode，已验证。
审查核心文档（AGENTS/CLAUDE/README/PAD/SKILL）与会话文档（session_44、remediation-plan-session23、worklog、session_45）——一切推进至 session-23 状态（PAD v1.23、SKILL v1.23.0、374 测试门禁）。
运行基线门禁：lint 0/0 · tsc clean · 167/167 单元+集成 · build exit 0（24 路由）· 完整 E2E 基线后台重跑 **207/207**（6.7 分钟）——session-23 交付状态在代码改动前完整验证。
技能映射（`skills/skills-catalog.md`）：本轮主用 `e-commerce-nextjs16-monorepo`（重读其 webhook/ops 教训族 H4d/C8/R10-2/R10-7 作为本轮审计透镜）+ 常备集（agent-browser、ttd、clone-app-pat-pro 等）。逐文件复审 session-23 提交（webhook 路由、stripe-pay 岛屿、checkout action、stripe-payment 接缝、集成层）——全部成立；R10-7 转换购物车类缺陷经构造验证已覆盖（购物车在事务内清空；空购物车铸造拒绝；intent 锚 UNIQUE；webhook 记录+退款路径）。
**本轮审计发现：** `StripeEvent` 日志（session-22/23 使其写入路径事务正确）在任何地方都**没有读取界面**——退款轨迹信号（金额失配、库存不足、元数据不可用、购物车消失）只存在于 server 日志的 console.error 行中。运营者无法看到哪些事件到达、哪些落地为订单、哪些已扣款支付需要退款。这是高端商店的经典 payment-ops 缺口。编写 `docs/remediation-plan-session24.md` 并对照代码库验证对齐。
进入 TDD RED：先写 `src/lib/admin-payments.test.ts`（19 项契约——模块缺失即正确的失败原因）+ admin.spec 的 6 项 E2E payments 测试（基线上路由 404）+ a11y 管理门禁的 payments 测试 + 访客门禁扩展。
TDD GREEN 实现顺序：纯接缝 `src/lib/admin-payments.ts`（parse/where/outcome——结构化输入，无 Prisma 导入）→ 页面 `/admin/payments`（管理门禁；日志倒序 take:100；ONE-findMany 结果解析无 N+1；demo 模式/已配置状态行；计数行；引导空态）→ 过滤器岛屿 `admin-payment-filters.tsx`（ADMIN-SEARCH-1 模式：?family= + ?q=）→ 仪表盘 Payments 按钮 → 演示夹具（`prisma/seed.ts`：Stripe 已支付 ORD-2026-003 + 规范三事件集，幂等 upsert；`prisma/e2e-reset.ts`：运行隔离契约扩展至新表）。186/186（+19）；定向 admin spec 15/15；a11y payments 测试绿（{color-contrast} × 8，E2E 条件下校准）。
校准中发现一个细节：首次探针测得 heading-order 违规（best-practice 标签）——常设门禁的 WCAG 标签 runOnly 集从未见过它；实探其他控制台列表页（orders/products）确认**同一家族观察自 session-7 起一致存在**（孤 h1 → 页脚 h3 列）。按家族观察记录（文档化），不作为单页缺陷修复。
突变效力验证 ×3（各自回滚，对照突变前备份验证）：(1) 结果解析删除 → 恰好 3 项测试失败（结果渲染 + 家族过滤 + 深链）；(2) 家族校验删除 → 接缝的非规范家族单元测试失败（E2E 坏深链回退行为恰好相同——where 构建器分支结构所致；接缝拥有该契约，已文档化）；(3) isAdmin 门禁跳过 → 角色契约测试单独失败。
一个流程陷阱被捕获并修正：人口普查校准后遗留的手动 :3100 E2E 条件服务器破坏了首次 M1 E2E 启动（文档化的 L25 陈旧服务器类——Playwright 的 reuseExistingServer 跨重建收养了它）——通过 ps 找到并终止，运行重新干净启动。
第 24 次移动导航 A/B 验证（agent-browser `ref24` + `clone24`，单一 host，双方已认证，登录后设设备仿真）：面板令牌级对等（w-72→288px、bg rgb(251,250,249)、nav `flex flex-col gap-4 mt-8`、5 链接 239×44 18px/500 同 href）；功能深链检查通过（Electronics → `/shop?category=electronics` + 面板自动关闭）。像素扫描 8 路由全部 0.28–0.68% 基线带（文档化 dev-cleanup 后）；typeahead 监视：参考站 0 搜索请求；轮播节奏 ~5000ms 稳定；控制台普查 24 路由 + 6 管理面（payments ×3 变体）零错误；SEO 层复核（17 URL sitemap + robots + JSON-LD + offers.price 299.99 USD）。
**门禁：** lint 0/0 · tsc clean · 186/186 单元+集成（+19）· build exit 0（**25 路由**——/admin/payments 新增）· **214/214 E2E**（+7）= **400 总计**——最终代码连续两次完整运行（7.4m/6.9m，零失败）。
截图 131-135（PAY-OPS-1 契约面板、第 24 次移动导航验证、payments 界面实况 ×2、单元门禁运行、E2E 门禁运行）——VLM 5/5 PASS（临时 SDK 已还原）。**第 24 次移动导航 md5 字节一致（`05de11678965f30a85f9196c2ec43bae`）——连续 12 轮渲染连续性。**
文档更新：AGENTS.md（PAY-OPS-1 契约）、CLAUDE.md（session-24 契约 + 186/214 计数）、README.md（payments 行 + 400 测试行 + 第 24 次验证）、PAD v1.24（ADR-032 + 修订行 + 矩阵 36 文件/400 测试）、SKILL v1.24.0（ADR-032 索引行）、session_46.md、worklog、修复计划签核。`.env.example` 验证现行（本轮无新增 env 管道）。
提交前清理运行日志与服务器进程。阅读推送技能文档（Appendix A paramiko shim）；将 shim 部署到仓库外 `/home/z/my-project/bin/ssh`；paramiko 安装进活跃 venv；操作密钥写入 0600 临时文件并验证 Ed25519 指纹。dry-run 确认 fast-forward（3d9dd39..fbaaeba）后执行真实推送（**记得显式 `--remote git@github.com:nordeim/ecommerce-store.git`**——包装器默认远程仍是 task-management.git）。
**Round-24（Session 46）已交付并推送到 main** ✅ —— 提交 `fbaaeba` + 签核 `fa5ad8a`，wrapper 验证 `refs/heads/main == local HEAD`，操作密钥已销毁。

**本轮核心成果：**

- **PAY-OPS-1（ADR-032）：管理台 payment-ops 界面**——StripeEvent 日志的读取界面 `/admin/payments`：每事件诚实结果解析（深链已放置订单 / "No order — refund via Stripe dashboard" 退款需要族（恰为 ADR-031 确定性失败族）/ Payment failed / Ignored）、URL 深链家族 + intent/id 过滤器（ADMIN-SEARCH-1 模式）、demo 模式/已配置状态行、计数行、引导空态；仪表盘新增 Payments 入口
- **演示夹具 + 隔离契约**：Stripe 已支付 ORD-2026-003（Charge 行首个种子实例）+ 规范三事件集（seed 幂等 + e2e-reset 每次运行恢复）
- **门禁**：400 测试（186 单元+集成 + 214 E2E，最终代码连续两次全绿）；三重突变验证；第 24 次移动导航验证 md5 字节一致（连续 12 轮）；像素扫描/监视/普查（含 payments ×3）/SEO 全部基线
- **家族观察（文档化）**：控制台列表页共享的 best-practice heading-order 观察（孤 h1 → 页脚 h3）——门禁 WCAG runOnly 集之外，家族级一致，留作 round-25 候选

**建议下一步**：若您提供 Stripe test-mode 密钥（`sk_test`/`pk_test` + webhook endpoint），下一轮可实测完整 Payment Element 支付流（集成门禁已覆盖 webhook 契约，payments 界面将展示真实事件流）；或接入邮件服务商激活验证/重置投递；或将 payments 界面的"退款需要"结果提升为一等过滤家族。

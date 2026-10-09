The workspace has been reset. Cloning the repo fresh, then I'll review all the required documents.
仓库已克隆，工作树干净。第 26 和 27 轮已完全交付——且 `session_54.md` 已存在。在规划之前，让我先确认每个文档的内容。
状态已确认：Round 27 已完全交付 (ADMIN-PRODUCTS-1 + DOCS-ALIGN-1)，`session_54.md` 刚刚被提交作为用户本轮的叙述日志。本次会话 = **Round 28**。我来制定任务计划并阅读所需文档。
`session_54.md` 是用户在第 27 轮的叙述 —— 建议的下一步提供了本轮的候选方案：Stripe 测试密钥（凭证受限）、电子邮件服务商（受限）或 **在管理仪表板上显示需要退款数量的统计卡片**（可操作）。现在正在审查第 27 轮的交付物。
已收到 Round 27 的交付物。现在正在审查补救计划结构和根文档（AGENTS.md / CLAUDE.md / README.md）。
现在正在审查根目录下的文档 —— AGENTS.md（代理端契约 + 陷阱日志）：
Now CLAUDE.md and README.md:
文档已是最新，至第 27 轮 (PAD v1.27, SKILL v1.27.0, 456 项测试)。本次会话 = **第 28 轮 / 第 55 次会话**。由于工作区是全新克隆的，我需要设置环境（忽略 .env）、安装依赖，并在进行基线门控之前验证数据库契约（DB contract）。
环境遮蔽陷阱（env-shadowing trap）已确认处于激活状态（Shell 注入的 `DATABASE_URL` 指向了仓库外部）。我将按照记录的方案进行处理：配置仓库，然后建立硬链接收敛（hard-link convergence）。正在安装依赖：
数据库落在了父路径上（shell 环境变量优先）。正在创建已记录的硬链接（hard-link）收敛 —— 两个路径共用一个 inode：
Convergence established (inode 264946 at both paths — the session-21 contract recreated). Now reviewing the skills catalog for this round:
Catalog confirmed — standing set (agent-browser, tdd, clone-app-pat-pro) + `e-commerce-nextjs16-monorepo` for admin-console patterns. Now running the baseline gates (part 1: lint / typecheck / unit):
Baseline part 1 GREEN: lint 0/0 · tsc clean · 226/226 unit. Now the build:
Build exit 0 (25 routes, standalone present). Now the full E2E baseline (foreground, one invocation — the documented lesson):
**E2E baseline: 230/230 (7.4m)** — the session-27 ship state verified pre-change. Full baseline gate GREEN. Now the audit phase — static review of the session-27 changes and the dashboard (this round's candidate surface):
现在正在审查 `payments` seam（它定义了 `refund-needed` 系列 —— 即建议的仪表盘统计数据的基础）：
现在我来检查仪表盘的 admin spec 测试，以及用于支付固定数据集的 seed：
已理解 Seed fixtures：恰好有 1 个退款需要的 fixture (`evt_demo_fixture_n`, $149.00)。现在让我检查实时电池脚本（单次调用模式），以便针对 Round 28 进行调整：
The battery scripts use Playwright directly with single-invocation pattern. Let me create the Round-28 adaptations (the session-numbered convention) and run the full live battery:
**发现本轮审计的问题**：Pixel 扫描显示 **home 59.95% 超出范围 (OUT OF BAND)**（与 Round-26 的漂移类别相同 —— 可能是 hero 又一次静默媒体漂移），而其他 7 个路由均在范围内。第 28 次 mobile-nav：TOKEN-EXACT PARITY。Census 无异常。watches 脚本名称配置错误（是我的 sed 操作导致 —— 将会修复）。现在正在调查 home 漂移：
Watches path fixed. Now the hero drift investigation — walking both carousels and comparing slide content (the Round-26 methodology):
Shop inventories are IDENTICAL — the drift is home-only, localized. Let me localize the pixel diff bands on the saved captures:
The diff band spans rows 109-607 — the entire hero region below the header. Let me probe the actual hero DOM on both sites:
轮播图是一个 `div[aria-roledescription="carousel"]`。正在重新探测正确的元素：
The reference doesn't use that carousel attribute. Let me dump ALL home-page images with their positions on both sites:
两个站点上处于激活状态的 hero 图像是相同的（`7cfe01108`，y=109，尺寸相同）。471K 像素的差异不可能是由激活的媒体造成的 —— 也许是轮播图（carousel）阶段的问题，或者是非图像的变更。让我用一个与扫描（sweep）完全相同的捕获流程来检测一下：
**0.00% diff** with the identical capture flow! The 59.95% sweep reading was suspect — a carousel phase race. Let me examine the sweep script's exact capture sequence:
The sweep interleaves captures (ref goto → clone goto → ref settle → clone settle → ref shot → clone shot) — a carousel phase race is plausible. Let me replicate the exact interleave while recording the active slide at shot time:
3/3 interleaved runs: 0.00% (6px), same slide both sides. The interleave alone doesn't reproduce it. Re-running the actual sweep to check reproducibility:
**Re-run: home 0% (6px) — ALL ROUTES AT BASELINE.** The initial 59.95% was a transient capture artifact (remote hero media paint race on the cold first-boot battery), not real drift. Verifying with the watches script (fixing the earlier sed bug), plus instrumenting the sweep to self-diagnose hero phase at capture time:
监控清理（typeahead 零请求，轮播 5 秒节奏，SEO 图层完整）。完整的 Round-28 电池测试结果为 GREEN。现在让我将 hero-phase 检测功能添加到 sweep 中（本次审计的经验教训 —— 使偏离信号具备自诊断能力）：
The instrumented sweep confirms: both sides painted, same slide, 0% — the artifact diagnosis is solid. The audit is complete. Now let me check the a11y admin census pins (the dashboard alert will add nodes to `/admin`):
The refund-needed vocabulary is established (`text-destructive`, "No order — refund via Stripe dashboard"). Before writing the plan, let me verify the e2e DB hygiene for StripeEvents (run-to-run isolation for the count):
e2e-reset restores exactly the 4 canonical fixtures each run → refund-needed count = 1 deterministically. The audit is complete. Writing the Round-28 remediation plan:
Plan written and validated against the codebase. Now the TDD **RED phase** — first the unit contracts. Checking the existing test file's style:
Now appending the RED unit contracts (the `refundNeededAlert` seam — function doesn't exist yet):
Unit RED verified: 4 failed (import-missing, right reason) · 34 passed. Now the E2E RED:
Now verifying the E2E RED state against the unmodified page (the standalone build already exists — E2E serves it):
**RED fully established** (4 unit + 1 E2E, both for the right reasons). Now **GREEN §3.1** — the seam:
我不小心移除了 `PaymentOrderView`。正在恢复它：
`PaymentOrderView` 已恢复。现在将 `refundNeededAlert` 接缝追加到文件末尾：
§3.1 GREEN (38/38). Now **§3.2** — the dashboard page wiring:
Typecheck caught my 4th test accessing `.href` on the un-narrowed union. Fixing the test:
Admin spec 28/28 GREEN (incl. the new alert test). Now the a11y admin gate — the dashboard pin must stay at 8:
a11y admin gate 7/7 GREEN — pins UNCHANGED (the contrast-safe design held). Now the **mutation efficacy round ×3**. Backups first:
**M1** — 倒置可见性门 (`count <= 0` → `count < 0`)：
**M1 caught** (the calm-state contract) + byte-exact revert. **M2** — the pluralization drop:
**M2 caught** (the singular-form contract) + byte-exact revert. **M3** — the page drops the placed-intent set (the integration-guard mutation):
All 3 mutations caught + reverted byte-exact. GREEN complete. Now the **full gate** — run 1 of the full E2E suite on the final code:
**Full gate: two consecutive E2E runs 231/231** (7.5m each). Now the post-change live re-verification battery:
The battery hit login timeouts this run. Let me diagnose — checking the rate limiter implementation and the server log:
The battery-2's server hit **EADDRINUSE — port 3000 was already occupied** by a leftover server, and the battery's scripts logged into that stale process. Let me find and kill it properly:
找到了问题根本原因：一个来自 09:46 探测的**陈旧服务器（pid 5759）**在 port-3000 上残留了下来 —— 我的探测清理中使用了 `fuser`，但该环境中不可用，因此“服务器已宕机”的输出无条件输出了。battery-2 随后静默登录到了那个（变更前的）陈旧构建版本。正在正确终止它，并加固 battery 脚本的清理逻辑：
**Post-change battery fully GREEN**: sweep all-8 at baseline with the hero-phase record (both painted, same slide) · mobile-nav token-exact (re-verified post-change) · watches clean · census clean. Verifying the fixed teardown actually freed the port:
清理完毕。现在进行截图（151–155）。正在审查 session-27 的捕获约定：
Writing the session-28 capture script (screenshots 151–155):
All 5 screenshots captured. Now VLM verification — checking the session-27 VLM script pattern:
4/5 — the 152 FAIL is my description's error, not the screenshot's: the deep-link lands on the FILTERED state, so the family Select correctly reads "Refund needed" (not "All events"). Fixing the description and re-verifying:
**VLM 5/5 PASS** + package files restored. Now the documentation phase. First AGENTS.md — finding the session-27 contract sections:
现在开始更新文档。AGENTS.md —— ADMIN-PRODUCTS-1 之后的 DASH-ALERT-1 合约要点：
Now CLAUDE.md — count updates + the session-28 contract:
Now README.md:
The README Testing table has stale counts (167/214 — a leftover the session-27 alignment missed). Fixing them with the session-28 additions:
README done. Now PAD v1.28 — the header version, revision row, and ADR-036:
Now inserting ADR-036 after ADR-035 in the ADR section:
PAD 已更新。正在检查关键文件表以查找过时行：
The PAD test matrix is stale (session-25 state). Let me view the full matrix and update it:
Let me get the actual per-spec test counts to correct the matrix accurately:
Now updating the PAD test matrix with the true counts (verified via --list):
PAD matrix corrected. Now SKILL.md v1.28.0 — version bump, L37 lesson, ADR-036 index entry:
Now the ADR-036 index entry in SKILL.md's Appendix A:
SKILL.md complete. Now the session log `docs/session_55.md`:
Now appending the worklog entry:
现在正在签署该计划的签核项：
最终提交前检查：
`.vitest/` 已被忽略。现在是提交 —— 将所有内容暂存到 main 分支：
已提交 `cf90c12`。现在进行 SSH wrapper push —— 正在审查该 skill doc：
paramiko 5.0.0 installed. Now deploying the ssh shim outside the repo and materializing the key:
密钥已验证（Ed25519 指纹已确认）。现在进行 dry-run，然后执行实际的 push：
## Round 28 shipped ✅

**Session 55** complete — the audit re-verified the session-27 ship against the live reference (the first battery's home reading of 59.95% out-of-band was investigated and classified as a **transient cold-boot media-paint artifact**, not drift — 4 independent re-measurements all 0%; the sweep now records the hero phase at capture time, L37, making the drift signal self-diagnosing; 28th mobile-nav token-exact parity; watches + census clean).

The deliverable: **DASH-ALERT-1 (ADR-036)** — the admin dashboard now surfaces the refund-needed count as an alert row at the console's entry point, composed through the **same seam the payments family filter uses** (the stat and the list can never disagree), with a deep-link to `?family=refund-needed` and a contrast-safe icon-only alert design (the a11y census pin stayed at 8). Gate: **461 tests** (230 unit + 231 E2E), two consecutive full green runs, triple-mutation-proven. Committed `cf90c12` to `main` and pushed via the SSH wrapper (remote verified, keys shredded).

**Suggested next:** provide Stripe test-mode keys to exercise the live Payment Element flow — the dashboard alert will now react to REAL refund-needed events at login; or wire an email provider (both seams are ready). A natural depth candidate: order-detail refund-trail rendering for the deterministic-failure events.

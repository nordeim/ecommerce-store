我将按照操作指令继续执行多会话任务。首先检查工作区状态并刷新仓库。
工作区已重置，需要重新克隆仓库。先创建任务清单，然后开始执行。
仓库克隆成功。现在开始审查核心文档与最新会话文档。
现在审查 remediation-plan-session19 和 worklog 最新条目。
Round-19(session 36/37)已交付：278 测试门槛、A11Y-GATE-3 认证屏幕门。现在快速检查用户本轮明确要求的 Sitemap/SEO 状态，并审查核心文档关键部分。
Sitemap/robots 已实现。现在审查核心文档(分段策略读取大文件)。
文档审查进展顺利。现在检查 Sitemap/SEO 的测试覆盖情况和技能目录，然后制定 Round-20 计划。
关键发现：sitemap/robots 已实现但**没有任何测试固定**(regression pin 缺失)，且无 JSON-LD 结构化数据。让我检查 metadata 层的细节。
Metadata 层完整。现在检查 skills-catalog 映射相关技能，并查看 sitemap 的历史。
技能映射完成。现在设置环境(已知的环境遮蔽陷阱处理)，然后运行基线门槛。
硬链接收敛已恢复(inode 172496,双路径)。检查残留服务器(L25 纪律)，然后运行基线门槛。
Build 干净。现在运行 E2E 套件完成基线门槛。
**基线门槛绿色：278 项测试**(lint 0/0 · tsc clean · 100 unit · build 23 条路由 · 178 E2E)——与 session-19 交付状态完全一致。现在开始第 20 轮审计。
启动生产服务器(双 fork 孤儿模式，sandbox 会回收普通后台进程)。
双会话已认证。现在执行第 20 次移动端导航验证(iPhone 14 模拟，双站点)。
参考站移动导航测量完成——与文档基线完全一致。现在测量克隆站。
**✅ 第 20 次移动端导航验证：完全对等**——面板类名 token 级一致(288px/24px,背景色相同)，全部 5 个链接字节级一致。无 Tailwind v4 回归(连续第 20 次)。现在进行功能性深链接检查。
点击被覆盖层阻挡(可能是多个 "Electronics" 匹配)。用快照找到 sheet 内的正确 ref。
功能检查通过——深链接 + 自动关闭已验证。现在重跑常设漂移监测(持久化的 sweep 脚本)。
**像素扫描：全部 8 条路由在基线带内**——与会话 15-19 数字字节级一致。现在进入本轮主新面：Sitemap/SEO 差异审计。
参考站有平台生成的 sitemap(10 个 URL)!获取完整列表对比。
重大发现：参考站 sitemap 包含 10 个应用路由(含 /reset-password),但**零个产品 URL**;克隆站 sitemap 有 12 个产品 URL + 5 个公共路由。让我探测参考站的 /reset-password 路由。
参考站有一个真实的 `/reset-password` 路由(无 token 时渲染 "Invalid reset link" 状态)——克隆站**没有**这个路由！让我审查其结构。
参考站 `/reset-password` 的完整结构已获取(与认证族相同的解剖结构)。检查克隆站此路由的当前行为。
**确认关键差距**：参考站的 `/reset-password` 是真实路由(Invalid reset link 状态)，克隆站渲染平台 404。让我检查带 token 参数的状态。
参考站带 token 时显示 "New password" 表单(与克隆认证族相同的 icon-led h-12 输入结构)。测量无效 token 提交的错误状态(安全——无效 token 无法改密码)。
错误框结构与认证族完全一致(`div.mb-4.p-3.rounded-lg.bg-destructive/10.text-destructive.text-sm`)。现在测量参考站 reset-password 的 head 元数据，并检查克隆的认证族代码结构。
参考站 reset-password 元数据 = 标准静态页模式(`pageMetadata` builder 直接适用，og:url 保留 query)。现在检查克隆的认证族代码结构。
审计图景完整。检查 CSP nonce 测试的逻辑(JSON-LD 脚本块的兼容性)，然后运行 typeahead/carousel 常设监测。
检查 playwright 配置与 global-setup(E2E 服务器启动方式 + DB push 流程)。
现有 og:url 固定使用回退源(localhost:3000)——sitemap 门槛将保持一致。快速运行 typeahead + carousel 常设监测。
Typeahead 监测确认：参考站零搜索请求。现在 carousel 节奏监测。
克隆会话还停留在 shop 页且是移动模式。重置后重测。
**轮播节奏监测：通过**——双站点 ~5.0s 一致(首次较短间隔为已记录的探针入场伪影)。所有常设监测完成。现在测量参考站 `reset-password` 的 `axe` 基准(用于 a11y 门校准)。
编写第 20 轮 axe 差分脚本(reset-password 双状态 × 双站点 × 双视口)。
参考站 reset-password census:双视口双状态均为 {color-contrast}(1)。审计完成。现在查看 PDP 页面结构(为 JSON-LD 结构化数据做准备)。
现在检查 auth.spec 的登录次数(E2E rate-limit 预算评估)。
Rate-limit 预算安全(按 email 键控)。测量参考站重置表单的密码不匹配错误优先级(客户端 vs 服务器 token 校验)。
参考站重置表单的客户端校验优先("Passwords do not match" 先于服务器 token 校验)。审计完成——现在编写 Round-20 修复计划。
修复计划已保存。现在对照代码库验证关键挂钩(Input/Label/AuthErrorBox/validation/seed fixtures)。
挂钩全部验证。检查 Input/Label 组件与 money 库，然后开始 TDD RED 阶段。
挂钩全部验证。开始 TDD RED 阶段——先写 reset-token 库的单元测试(RED:模块缺失)。
RED 确认(模块缺失)。现在写 auth.spec 的 reset-password 行为测试(RED:路由 404)。
修正会话失效测试(真正的旧会话 cookie 验证——保持 ctxA 打开，重置后重载 /account 应被门控)。
检查 account 页面的登出按钮(测试引用)。
“登出”按钮在隐藏的 Settings 标签页中——改用新上下文做旧密码验证(更稳健)。
现在写 seo.spec.ts(RED:JSON-LD 缺失 + 门槛测试)。
验证 seed 中的产品价格与评分数据(测试固定值)。
修正测试固定值(实际名称/价格:$299.99)。
现在扩展 accessibility.spec.ts 的 auth-screens 门(RED:+4 reset-password 测试)。
扩展 AUTH_PROFILE(添加 reset-password 两个状态 → 自动生成 4 个测试)。
运行 RED 验证(build + 新 spec 子集)。
RED 确认：3 失败(JSON-LD ×2 + sitemap 静态路由)。检查 sitemap 测试失败原因(可能是切片逻辑 bug)。
测试 bug:首页 URL 无尾斜杠。修正。
**RED 全部确认**(4 auth + 3 seo + 单元测试均以正确原因失败)。开始 GREEN 阶段。先添加 Prisma 模型。
现在编写 reset-token 库。
单元测试通过。添加 validation schema + auth actions。
现在扩展 requestPasswordResetAction + 添加 resetPasswordAction。
现在写 reset-password 页面 + 客户端表单。
现在更新 e2e-reset.ts(resetuser fixture + 确定性 token)。
现在更新 `e2e-reset.ts` 以在每次运行后恢复 reset fixture。
现在实现 JSON-LD 层。先看 home 页面的渲染结构。
现在给 PDP 添加 Product JSON-LD。先看 PDP 渲染部分与产品字段。
现在精炼 smoke 的 nonce 测试(跳过不可执行的数据块)。
构建 + GREEN 运行新 specs。
Prisma client 需要重新生成(新模型未在 client 中)。
主页 JSON-LD 用了数组——改为两个独立 script 标签(标准做法)。
**seo.spec 达标：7/7**。现在运行 auth.spec reset 测试。
重置提交未导航。检查失败时的页面状态。
发现设计缺陷：scrypt 每次产生随机盐——同样输入产生不同哈希，`findUnique({tokenHash})` 永不匹配。检查 Session token 的存储约定。
应遵循代码库既有约定：Session 用 SHA-256 作为高熵 token 的确定性索引(L30)。修复 reset-token 库 + 所有引用点。
更新单元测试以涵盖 hash 确定性，然后重新构建并重新运行。
**auth.spec 重置测试绿色：5/5**。运行 axe 门测试。
**axe 门绿色：4/4**。全部 GREEN 达成。现在执行 4 项突变效力验证。突变 1:从 sitemap 过滤一个产品 slug。
**突变 1 确认**——站点地图数量 17→16 失败(正确原因)。还原并执行突变 2(robots 移除 /account disallow)。
**突变 2 确认**——robots 固定失败(正确断言行)。还原并执行突变 3(JSON-LD 价格传分)。
**突变 3 确认**——价格固定失败(299.99 vs 29999)。还原并执行突变 4(L29 感知的 axe 门标签突变)。
突变需要破坏关联(htmlFor)+ 遮罩(placeholder)。修正突变。
**突变 4 确认**——label 规则在双视口触发(仅 token 状态测试失败，其余绿色)。还原突变并复验绿色。
**绿色恢复：27/27 a11y 测试**(此前 23)。现在执行完整门槛(两次连续运行)。先清除残留服务器(L25 纪律)。
smoke.spec 有语法错误(编辑残留)。检查文件尾部。
正则里的 `/` 未转义(终止了 regex 字面量)。修复。
typecheck 报错：三元表达式破坏了联合类型收窄。重构为 `&&` 链模式。
Lint + typecheck 干净。运行完整门槛第一次(build + 全量 E2E)。
两个失败都是我的更改引起的回归。读 cart.spec 测试逻辑理解第二个 Checkout 链接。
确定性失败。检查 cart drawer 的 "View Cart" 行为与关闭逻辑。
需要隔离验证：stash 我的更改，重跑该测试以确定是否是我的回归。
stash 未包含未跟踪文件导致构建失败。恢复 stash,改用直接调试。
重启 :3000 服务器(当前构建)并直接驱动流程调试。
PDP 加载失败("This page couldn't load")——很可能是 JSON-LD 脚本导致的水合错误！检查控制台与服务器日志。
旧服务器未被杀死(EADDRINUSE)。用 /proc 遍历正确终止。
PDP 正常(JSON-LD 渲染，无水合错误)。之前是旧服务器陷阱(L25)。现在驱动购物车流程复现抽屉问题。
手动流程正常——E2E 失败是时序问题(Radix 退出动画期间断言)。写复现脚本检查时序细节。
时序确认：抽屉退出动画 ~300ms 内 content 仍在 DOM。先修 storefront-parity 失败(确定是我的 JSON-LD 脚本作为 home 根 div 子节点)，再隔离测试 cart 失败。
修复：把 JSON-LD 脚本移出 home 根 div(作为 fragment 兄弟节点)。
检查是否有测试统计 PDP 根 div 的子元素(同样的风险)。
仅 home 有子元素计数测试，PDP 安全。重建并验证两个失败测试 + SEO 测试。
storefront-parity 绿色，但购物车测试仍失败。隔离 PDP JSON-LD(测试起点是 PDP)。
**确认：PDP JSON-LD 是原因**。恢复代码并深入调试——先看带 JSON-LD 时抽屉是否根本不关闭。
又是 stale-server 陷阱(L25)。重启 :3000 后重跑调试。
调试脚本显示 ~300ms 正常退出。差异在于 E2E 用 storageState(已登录)。精确复刻测试序列测量断言时序。
复现成功！带 storageState 时抽屉卡在 closing 状态超过 1.1 秒。延长观察窗口并对比。
抽屉确实会卸载(1579ms 时已消失)——纯时序竞态。对比无 JSON-LD 版本的时序以确定根因。
调试脚本被 stash 了。移到仓库外(项目 scripts 目录)重试。
基线：portal 内容立即消失(仅空 wrapper 残留)。我的构建内容滞留。精测差异。
根因明确(实证)：PDP JSON-LD 脚本使 portal 内容滞留 ~500ms。测试 React 19 的脚本提升方案(`async` 属性 → 提升到 head，脱离 body 协调树)。
`async` 未触发提升(仅 src 脚本可提升)。测时序看是否有变化。
移除 async,改为把 PDP 脚本放到根 div 外(fragment 兄弟——与 home 相同的结构，home 的脚本不引发问题)。
结构正确(404 早退不含 JSON-LD)。重建并测试。
仍失败。用 MutationObserver 深度插桩观察内容移除的确切时机。
:3000 又陈旧了(重建后未重启)。重启后重跑插桩。
等等——这次通过了(links:1)!失败可能是 FLAKY 而非确定性。连续多次运行验证。
代码未变但结果翻转——怀疑 :3100 陈旧服务器(复用陷阱)。检查当前 :3100 状态。
关键发现：单独运行通过，全 spec 顺序运行时失败(前序测试影响时序)。连续运行完整 cart.spec 验证。
cart.spec 全规格连续 3 次通过(累计 6 次)。真相大白：div 内脚本放置导致确定性延迟 + 一次 stale-:3100 复用假象。现在执行完整门槛验证(第 1 次全量运行)。
全量套件仍失败(warm 服务器使断言更早落入退出窗口)。测量基线构建的 animationend 时序做最终对比。
基线动画时序完全相同(~500ms 退出 + 重动画)——JSON-LD 非根因，是既有竞态被时序偏移翻转。复现全序失败条件(前序 specs + cart),再 A/B 我的 auth 测试。
复现成功(前序序列 → 失败)。A/B:临时移除我的 5 个 auth 测试重跑同序列。
我的 auth 测试非触发者！最终 A/B:完全基线(stash 全部)跑同序列。
直接做干净的基线 worktree A/B(避免 stash 舞蹈破坏 prisma client)。
**基线通过同序列**——我的更改确实翻转了竞态。缩小范围：跳过 4 个 axe 门测试再跑。
**根因确认**：4 个新 axe 测试的时序使既有断言落入抽屉 ~500ms 退出动画窗口(行为未变——动画时序逐字节一致)。正确修复：将断言限定到 main 区域(测试本意)。
**80 通过**——竞态已修复。清理基线 worktree,然后运行完整门槛 ×2。
188 vs 预期 192——检查是否有测试丢失(auth.spec 编辑历史)。
auth.spec 的 4 个 reset 测试在 `git checkout` 时被误删！重新添加。
auth.spec 已恢复。运行完整门槛(第一次最终运行)。
**运行 1:192 通过**。第二次连续运行(确定性)。
**门槛绿色：192 × 2 连续运行**(+18 测试：4 单元 + 14 E2E)。实时复验：重启 :3000 → 像素扫描 → 第 20 次移动导航 md5。
**像素扫描：全部 8 路由在基线带**——JSON-LD 与新路由渲染中性，实证确认。现在第 20 次移动导航 md5 捕获。
110 张截图确认。编写 session-20 捕获脚本(111-115)。
用 bun 直接运行(与 session-19 相同方式)。
**全部捕获完成——第 20 次移动导航 md5 字节一致**(八轮连续渲染连续性)。VLM 验证截图。
**VLM 验证：6/6 通过**。清理瞬态 SDK + 开发数据库卫生。
变更集干净。开始文档更新。先看 AGENTS.md 的 session-19 契约位置与结构。
现在更新 AGENTS.md——在 session-19 契约后添加 session-20 契约。
更新 A11Y-GATE-3 块以反映 reset-password 扩展(6→10 测试)。
现在更新 CLAUDE.md。
更新 README 的 SEO 行 + Auth 行(提及 JSON-LD 与 reset-password 流)。
现在更新 PAD:标题 v1.20 + 修订行 + ADR-028 + Known-Issues 行 + 矩阵。
添加 Known-Issues 已解决行 + 查找测试矩阵。
修正矩阵中 smoke (20) 与 accessibility (26) 的实际计数。
现在添加“已解决问题”行（Known-Issues），并检查“问题”表格的末尾。
现在更新 SKILL 文档 v1.20.0。
SKILL v1.20.0 完成。现在写 session_38.md 日志。
追加 worklog 条目。
勾选修复计划的签署项(最后一项 push 留待后续提交——遵循 session-18/19 模式)。
14/15 已勾选(推送项待后续)。阅读 SSH 包装技能文档准备推送。
推送流程明确。最终变更集审查 + 提交。
Shim 部署完成，密钥解析验证通过。试运行鉴权检查。
推送失败——远程有新提交(非快进)。fetch 并 rebase。
本地领先 1 个提交，远程未变——"非快进"很奇怪。检查 wrapper 的 dry-run 逻辑。
检查 wrapper 的默认远程——技能文档是为 task-management 仓库写的！
找到了——wrapper 默认远程是 task-management(文档来自另一仓库)。显式传 `ecommerce-store` 远程重试。
**Dry-run 成功**——鉴权通过，快进干净。执行真实推送。
**推送已验证**——远程 main @ 24b9c75 == 本地 HEAD,密钥已销毁。后续提交：勾选最终签署项。
**两个提交均已推送并验证**(24b9c75 + ccf1db7)。最终清理：终止服务器 + 记录系统 worklog。
**Round-20 已交付并推送到 main** ✅(commits `24b9c75` + `ccf1db7`,wrapper 验证，密钥已销毁)

**本轮成果：**

- **审计发现**：首个 SEO/sitemap 差异审计(双站点实测)——参考站自家 sitemap 列出 `/reset-password` 真实路由而克隆站 404(**RESET-ROUTE-1,认证族缺失成员，真实对等差距**)；sitemap/robots 实现完整但**零回归固定**(SEO-GATE-1);双站点均无结构化数据(JSON-LD-1)
- **交付物**:`/reset-password` 双状态对等路由(sha256 索引一次性 token、30 分钟 TTL、重置即失效全部会话)+ `seo.spec.ts` 常设 SEO 门(17 URL 普查 + robots 规则 + JSON-LD 节点)+ Organization/WebSite/Product 结构化数据层
- **常设监测**：第 20 次移动导航验证 md5 字节一致(连续八轮渲染连续性)；像素扫描/打字前瞻/轮播节奏全部在基线
- **新教训**：L30(抽屉退出动画残留与未限定 strict-mode 定位器竞态——区域作用域修复)· L31(scrypt 随机盐永远不能作查找键——高熵 token 用 sha256 索引)
- **门槛**：296 测试(104 unit + 192 E2E,连续两次全绿)；四重突变验证；截图 111-115 VLM 6/6;PAD v1.20 · SKILL v1.20.0

**建议下一步**：Round-21 候选——INP 性能门槛(需脚本化交互协议)、接入邮件服务商激活验证/重置投递、或 Stripe Payment Element(后两者需外部凭证)。随时吩咐。

The workspace exists. Let me refresh it with `git pull` and check the current state.
拉取成功 — 新文件：`docs/session_21.md`，`docs/prompt-to-review-2.md`，`docs/prompt-to-review-3.md`。让我制定会话计划并开始审查文档。
Let me read the remaining sections of AGENTS.md directly (the trap log sections).
AGENTS.md fully reviewed — 13-trap log, contracts, conventions all understood. Now README.md and the session docs.
Now the session docs — session_20, remediation-plan-session11, session_21, worklog, and the PAD/SKILL docs.
Now the remediation plan, worklog, and the new prompt-to-review files.
`prompt-to-review-3.md` confirms this session = **Round 12 (session-12)**. Now worklog.md and the remaining docs.
Worklog current through session-11 (S12). Now the PAD + SKILL doc version/ADR status check.
All docs reviewed and current through session-11. Now validating alignment against the codebase (Task 4).
All contracts verified in code. Now checking DB hard-link convergence and running the baseline gate.
Hard-link convergence is live (inode 303519, link count 2). Let me verify the parent env file and run the baseline gate.
Lint clean, tsc clean, 88/88 unit. Now build + E2E.
23 routes ✓. Now the full E2E gate (foreground, no dev server per OOM lessons).
Setup failure — let me diagnose.
No error box in the snapshot — the form isn't submitting or the server action hangs. Let me check the e2e DB state and server health.
E2E DB is properly seeded. Let me inspect auth.setup.ts and test the login flow manually.
The setup file matches the documented convention. Let me manually boot the e2e server and probe the login action to see if it's a real bug or a flake.
Failure reproduced — inputs are EMPTY after the click (something wiped them). Let me check the server log and whether the client JS is hydrating.
**Root cause found**: `Unexpected token '<'` — scripts are receiving HTML instead of JS. Hydration is dead. Let me identify which URLs return HTML.
ALL static chunks serve HTML — the standalone server can't find its static assets. Let me check the build output layout.
`ls` hides dot-dirs — checking with `-a`:
**Root cause: my own audit artifact.** I ran `bunx next build` directly (for route counting), which regenerated the standalone output WITHOUT the static-asset copy steps that `bun run build` includes. The chunks 404'd → no hydration → login stuck. Re-running the proper build:
Login works. The failure was my `bunx next build` artifact — documented lesson. Now the full E2E gate.
**Baseline gate fully green**: lint 0/0 · tsc clean · 88/88 unit · build 23 routes · 141/141 E2E = **229 total** — exactly the documented session-11 ship state.
Now auditing the session-11 code changes (commit `6d21c58`) — the most recent code:
The session-11 changes audit clean. Let me verify the font file integrity and the parity spec additions:
Session-11 changes audit clean — font md5 matches, pins in place. Now the Round-12 live differential audit. Let me set up the audit environment: boot the clone production server and load the agent-browser skill.
Setting up dual audit sessions (ref + clone):
Both sessions authenticated. Now the **12th mobile-nav standing verification** (iPhone 14 both sites):
Reference panel measured. Now the clone:
**✅ 12th mobile-nav verification: PARITY** — panel classes identical (only attribute token order differs, which doesn't affect cascade), pad 24px, gap 16px, bg `rgb(251,250,249)`, 5 identical links (239×44, 18px/500, block, same hrefs). No Tailwind v4 regression.

Now the round's primary new surface: **axe-core a11y violations differential** on both sites.
Reference home: 4 violation types. Now the clone:
Differential found: clone has an `aria-prohibited-attr` violation (`.fixed`) and MORE color-contrast nodes (28 vs 7). Digging in:
The violation is the toast viewport: `aria-label` on a role-less div (prohibited). Let me check what the reference's toast DOM looks like, then dig into the contrast differential:
The reference's toast container has NO aria-live/aria-label at all — the clone's `aria-label` on a role-less div is the violation. Now the color-contrast differential (28 vs 7 nodes):
Common violations match (announcement bar, footer, Join). The clone-only ones are product-card badges + hero CTA. Let me compare the badge computed styles on both sites to understand why axe flags only the clone:
Badge styles are byte-identical on both sites. The ref's initial scan may have run before its SPA product sections rendered. Re-running axe on the ref now (products confirmed rendered):
Still 7 on ref. Let me isolate — run axe on a single badge element on both sites:
Ref badges are DIVs. Checking the clone's badge tag:
Identical DIVs on both. Running axe on the individual ref badge (DIV, not span):
Same DOM but different axe results — checking for `aria-hidden` ancestors on the ref badges (axe skips hidden subtrees):
Identical styles yet different axe results. Let me get the exact axe failure data and verify the axe versions match:
Same axe version. Let me re-run the ref scoped scan with full detail — and check whether axe even examined it:
0 violations AND 0 passes — axe never examined the ref's badge. Checking opacity/visibility (framer-motion scroll-reveal hides off-screen sections):
**Mystery solved**: the ref's cards sit in framer-motion scroll-reveal wrappers with inline `opacity: 0` until scrolled into view — axe skips invisible text. The badges are byte-identical; the ref just hides them from the scan. Proving it by scrolling the ref fully, then re-scanning:
Ref contrast went 7→16 after scroll (reveals fire per-section). Scrolling incrementally to trigger all:
**PROOF COMPLETE — color-contrast is at PARITY (28 = 28)** once the ref's scroll-reveal sections become visible. Same badges, same ratios — a shared design-system trait, not a divergence. The real clone-only axe finding: **A11Y-ARIA-1 — the ToastViewport's `aria-label` on a role-less div**. Checking the code:
Fix identified: drop `aria-label` (prohibited on role-less div), keep `aria-live="polite"` — announcements unaffected. Continuing the audit — axe on remaining routes:
axe is per-page — need re-injection after navigation. Let me build a helper script to do this efficiently:
Shop: **parity** (23=23 contrast, same heading-order; clone has zero button/link-name — superset). Only diff is the known toast-viewport finding. Scanning PDP + login + cart:
PDP: parity including the same `page-has-heading-one` quirk on both. Quick check of that heading structure, then login/cart scans:
Both show "Product not found" — parity for an unknown slug. Let me find the real PDP URL:
Two findings: the clone has a SECOND aria-prohibited-attr node on the PDP, and the ref has its own landmark-unique violation (ref-only). Finding the second node:
The star-rating row has the same prohibited pattern. Checking how the reference marks up its rating:
The ref's rating row is completely unlabeled. The clone's superset intent is right, but needs `role="img"` to make the label valid. Checking the component:
Now scanning login, cart, and account on both:
Login: identical. Cart: parity. **But account shows 3 clone-only landmark violations — possible nested-`<main>` regression.** Investigating:
**Regression confirmed** — nested `<main class="flex-1">` on /account. This is the documented session-7 trap (MAIN-NEST-1) that was fixed for admin pages but the account page has it. Checking the source and history:
The nested main exists since session-1 — the session-7 fix only covered admin pages. This is a real finding (**A11Y-MAIN-1**). Let me look at the account page and the admin pattern:
**Blast radius: 4 routes** — checkout (×2 spots), checkout/success, wishlist (×2 spots), account all render nested `<main>` inside the storefront layout's `<main>`. The session-7 fix covered only admin pages. Verifying the ref's structure and the clone's other pages:
**A11Y-MAIN-1 confirmed with live A/B evidence** (ref: 1 main everywhere; clone: 2 on checkout/wishlist/account/success). Now the console error census across clone routes:
Console census: **zero errors across 12 routes**. Now security headers (production-readiness superset check):
**SEC-HEADERS-1 found**: the clone ships none of the ref's 3 security headers (referrer-policy, nosniff, HSTS). Now the standing pixel-diff drift re-check. Checking prior session scripts for convention:
Writing the session-12 pixel-diff sweep (mirroring conventions, 1024 width, same threshold):
All routes at/near baseline (0.28–0.72% vs pre-fix 1.62–4.81%). PDP slightly above ship baseline — re-capturing to check for image-timing noise:
PDP diff is stable/reproducible (ref self-noise 0.0%). Localizing the diff bands to determine if it's text or images:
Thin text-AA bands — sub-threshold, no actionable drift. Now the final new surface: **200% zoom / reflow audit (WCAG 1.4.4)** — emulated via 512px CSS viewport (200% of 1024):
**200% reflow: parity — no overflow on either site.** The audit is complete. Verifying the E2E spec usage of `main` before the remediation plan (blast-radius check for the nested-main fix):
All spec usages survive the main→div fix (chained locators dedupe). Checking the success page structure for the plan:
All 6 nested-main sites confirmed. The audit is complete — 4 findings. Now writing the remediation plan (validated against codebase first):
Plan written. Validating against the codebase — next.config.ts and the spec files:
Plan validated against the codebase. Now **TDD RED** — writing the 4 failing tests:
Now adding the three RED tests to storefront-parity.spec.ts:
Now the smoke spec test for security headers:
RED tests written. Running the RED phase against the current (unfixed) build:
RED confirmed — 4/4 fail. Verifying the failure reasons are the expected ones:
All 4 RED failures confirmed for the right reasons. **GREEN phase** — implementing the fixes:
Now T3 — the six main→div swaps:
All 6 sites converted — only the layout's legit main remains. Now T4 — security headers:
All 4 fixes in. Typecheck + rebuild, then GREEN:
**GREEN — all 4 fixes pass.** Now the full gate (unit + complete E2E suite):
**Full gate green: 233 total** (88 unit + 145 E2E; +4). Second consecutive E2E run for determinism per repo convention:
Two consecutive full runs green — determinism proven. Now live re-verification. Restarting the :3000 server with the new build:
All 4 headers live on the standalone server. Writing the persisted verify script per repo convention:
**Live re-verification: 18/18 green.** Now the post-fix axe re-scan to confirm the violations are gone:
**All clone-only axe violations GONE** — only the shared parity violations remain. Pixel re-diff of affected routes to confirm visual no-op:
**Pixel re-diff: unchanged (visual no-op confirmed).** Now the screenshot capture script per repo convention:
Captures 70-72 done; the script failed at the toast capture. Checking the error:
The PDP has multiple Add-to-Cart buttons (related products) — specs use `.first()`. Fixing:
All 6 captures done. VLM-verifying them per repo convention:
The VLM flags the logo. Checking both sites' logo text:
Both logos are "LUXE" — my VLM prompt was wrong, not the capture (session-11's known pattern). Re-verifying all 6 with corrected descriptions:
$299.99 is the real price — my prompt error again. Re-verifying 71 with the correct value, then 73-75:
Both FAILs are my prompt assumptions (sheet covers the logo; 512×384 first viewport is mostly the stacked image). Re-verifying with accurate expectations:
**All 6 captures VLM-verified.** Now the docs updates. Starting with AGENTS.md (a11y contracts + build-wrapper lesson + security headers):
Now adding the build-wrapper lesson to AGENTS.md testing quirks:
Now CLAUDE.md — session-12 contracts and test counts:
Inverted edit direction — fixing with separate edits:
Now README.md updates:
Now the README testing table (E2E row):
Now PAD v1.12 — ADR-020 and revision row:
Now adding ADR-020 after ADR-019:
Now the PAD Known Issues + test matrix rows:
PAD done. Now the SKILL doc v1.12.0:
Now the session log `docs/session_22.md`:
Now updating the remediation plan sign-off and appending the worklog entry:
Worklog appended. Final pre-commit hygiene — dev-DB cleanup (the captures added a cart item) and git status:
Dev DB clean. Final gates (new scripts are in tsc/eslint scope), then commit:
Two typecheck errors in the new scripts (Element vs HTMLElement) + 1 lint warning. Fixing:
All gates green. Now commit and push via the SSH wrapper. Reviewing the push skill first:
No OpenSSH — the documented sandbox case. Building the paramiko shim per Appendix A:
paramiko available. Building the shim outside the repo, then committing:
Commit `10a535c` on main. Now the SSH push — key to a 0600 file outside the repo, shim on PATH, dry-run first:
Remote has new commits — pulling first:
HTTPS fetch has no credentials. Using the SSH key to query the remote directly:
Remote main = `5970e9d` (my base — not ahead). The wrapper may have targeted the wrong remote. Checking its remote resolution:
**Found it** — the wrapper's default remote is `task-management.git` (the doc's original repo). The push went to the wrong repo and was rejected (non-fast-forward — nothing landed). Re-running with the correct `--remote`:
Dry-run clean — fast-forward `5970e9d..10a535c`. Executing the real push:
Push verified — remote main @ `10a535c`, tree clean, key shredded. Updating the project-level worklog:
Round 12 (session-12) is complete and shipped ✅ — commit `10a535c` on `main`, pushed via the SSH wrapper (paramiko shim — no OpenSSH in this sandbox), remote verified, key shredded.

**What this round delivered:**
- **First automated axe-core differential** (6 routes, both sites, same version): after proving the reference's framer-motion scroll-reveals were hiding its own violations from the scanner (contrast 7→28 nodes after reveal = exactly the clone's 28), the clone's only true violations became the findings.
- **4 fixes, all TDD (RED→GREEN):** nested `<main>` on 4 shopper routes (present since session-1, invisible to 11 computed-style rounds) → `div.flex-1` at 6 code sites; prohibited `aria-label` on role-less divs → nameless toast live region + `role="img"` rating row; zero security headers → the reference's three + `X-Frame-Options: DENY`.
- **Mobile nav: byte-exact parity for the 12th consecutive verification** — no Tailwind v4 regression. New parity surfaces: 200% zoom reflow, console census (0 errors), pixel diffs at baseline (0.28–0.72%).
- **Gate: 233 tests** (88 unit + 145 E2E, two consecutive runs), live re-verification 18/18, screenshots 70–75 VLM-verified, docs current (PAD v1.12/ADR-020, SKILL v1.12.0).

**Suggested next:** round-13 candidates — a meaningful CSP with nonce plumbing (the documented security follow-up), admin order filtering/search, or wiring an email provider to activate the verification gate. Say the word, or just "review again" for another differential audit round.

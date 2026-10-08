I'll continue the multi-session workflow. This session's key updates: review `docs/session_26.md`, `docs/remediation-plan-session14.md`, `worklog.md`, and `docs/session_27.md` (the latest session docs). Let me start by checking the workspace state and refreshing the repo.
The workspace has been reset — the repo needs to be cloned fresh. Let me clone it and check the upload folder.
Repository cloned successfully. Let me set up the session todo list and begin the document review.
Good — latest commit is session-14 work. The user mentioned `session_26.md` and `session_27.md` — let me check which session docs actually exist.
All docs exist through session_27. Now let me review the core documents.
Let me read the full AGENTS.md content and other core docs.
Now let me review the latest session docs — session_26, session_27, remediation-plan-session14, and worklog.
Session-14 (Round-14, CSP nonce pipeline) is the last shipped round. Now let me read the worklog and remediation-plan-session14.
Now let me review the remediation plan from session-14 and the README.
Current state is clear: session-14 shipped (250 tests, 85 screenshots, PAD v1.14). This session is Round-15. Let me quickly review README and version headers of PAD/SKILL.
Docs review complete. Now let me validate against the codebase — set up the environment (fresh clone needs `.env`, install, DB setup) and verify the session-14 deliverables exist in code.
The session-14 deliverables are verified in code. I notice the **sandbox environment shadowing trap** is present: `DATABASE_URL=file:/home/z/my-project/db/custom.db` is injected in the process env. Per the documented contract, I need to converge via hard link. Let me set up the environment.
The DB landed at the injected path (env shadowing won). Per the documented contract, I'll move it to the repo root and hard-link the injected location to it.
Hard-link convergence live (inode 172348). Now running the baseline gate — lint, typecheck, unit tests first.
Lint 0/0 · typecheck clean · 100/100 unit. Now the production build.
**Baseline gate GREEN: 250 tests** (lint 0/0 · typecheck clean · 100 unit · build exit 0 · 150 E2E) — exactly the documented session-14 ship state. Let me verify the DB path state and then begin the skills audit.
All paths converged (custom.db inode 172348 linked ×2; e2e.db in repo db/). Now for the skills-based audit — let me review the skills catalog.
Skills mapped. Now let me audit the recent code changes (session-14: proxy.ts + force-dynamic pages + CSP tests).
Session-14 code audit passes. Now let me start the production server and set up the agent-browser dual-session audit for Round-15. First, let me load the agent-browser skill.
agent-browser skill loaded. Let me start the production standalone server and verify agent-browser availability.
Server live with CSP + security headers. Now setting up the dual agent-browser sessions — starting with the reference site login.
Reference logged in. Now the clone session — using `localhost:3000` consistently (L22 host lesson).
Both sessions authenticated, states saved. Now the **15th standing mobile navigation verification** — iPhone 14 on both sites.
Let me find the reference's mobile menu button via snapshot.
The selector matched the trigger button. Let me target the actual dialog panel.
Reference measured. Now the clone — same iPhone 14 procedure.
**✅ 15th mobile-nav verification: complete parity** — panel classes token-identical, pad 24px, bg rgb(251,250,249), w-72 (288px), nav `flex flex-col gap-4 mt-8`, all 5 links byte-identical (239×44, 18px/500). **No Tailwind v4 regression (15th consecutive).** Now the functional check:
Mobile nav functional check passes (deep-link + auto-close). Now let me check the prior capture script convention for the pixel drift sweep.
That script is from a different project. Let me check the repo's own pixel-diff tooling used in prior sessions.
`PNG` is available. Let me check for pixelmatch and write the Round-15 paired pixel sweep script.
pixelmatch isn't bundled, but PNG is — I'll write the diff manually. Let me create the Round-15 pixel sweep script following repo conventions.
**All 8 routes at baseline band** — zero drift on pinned surfaces. Now the standing watches (content census, carousel, typeahead, console). Let me reset the sessions to desktop and run these.
Content census shows a case difference in DOM text (clone "Electronics" vs ref "electronics") — but pixel diffs are at baseline, so likely a CSS text-transform difference. Let me verify computed styles.
Both badges render identically (shared `capitalize` transform) — DOM-text case divergence only, zero visual impact. Now the carousel timing watch (pointer off hero, dot-flip probe):
Only 2 dots matched — let me refine the probe with the documented dot geometry.
Carousel cadence: both sites ~5.0s intervals (ref: 4960+5040ms; clone: 4964+5036ms). ✅ Now the console census and typeahead drift watch:
Typeahead drift watch confirmed: ref fires **zero** search network requests (the clone's `/api/search` stays the superset). Now the **Round-15 new audit surface**: full-route console/page-error census + link-integrity crawl (all 23 routes — production readiness). Let me write the script.
**Round-15 new audit surface: zero defects** — all 22 routes console-clean, 19/19 internal links live, admin surfaces clean. 

Now for the round's remediation finding: per session-14's recommendations and best judgment, the strongest candidate is the **self-hosted axe-core differential as a standing E2E gate** (the tool that exposed the nested-`<main>` defect that survived 11 computed-style rounds — it should never be manual-only again). Let me first measure the current axe profile on both sites to pin the baseline.
`axe-core@4.14.0` is available (transitive via eslint). Let me run the axe differential on both sites with same-version injection to measure the current parity profile.
**Axe differential at parity confirmed**: color-contrast counts byte-identical on every route (28=28, 23=23, 14=14, 8=8, 8=8, 3=3) — and the clone keeps its aria superset (zero button-name/link-name/label violations vs the reference's 4-20 per route). 

This pins the round's remediation finding: **A11Y-GATE-1 — the self-hosted axe differential as a standing E2E gate**. Let me verify the counts under the E2E viewport first, then write the remediation plan.
E2E uses Desktop Chrome (1280×720) and the e2e DB — let me calibrate the exact axe counts under E2E conditions before pinning them in the spec.
**Calibration confirms**: only `color-contrast` at pinned counts (28/23/14/8/8/3) under exact E2E conditions. Now let me stop the E2E server and write the Round-15 remediation plan.
The E2E suite can use `E2E_PORT` to avoid the stale server. Let me check /proc for the server processes and proceed with the remediation plan.
The servers persist in a hidden sandbox process tree. I'll use `E2E_PORT=3200` for the gate run. Now let me write the Round-15 remediation plan.
Plan saved. Now let me validate it against the codebase before executing.
All facts validated. Let me check the spec conventions in an existing parity spec before writing the RED test.
约定已明确。现在进入 **TDD RED 阶段** —— 编写带有零违规断言的 `accessibility` spec（这将因正确的原因失败：`color-contrast` 共享奇偶校验特性）。
All 6 RED. Let me verify the failure reason is correct (color-contrast present, not an injection failure):
**RED confirmed for the right reason** — `color-contrast: 28` (the shared parity trait), injection working. Now **GREEN phase**: pin the measured parity profile.
Now add `axe-core` as an explicit pinned devDependency:
**GREEN — all tests pass.** Now the **efficacy (mutation) check**: temporarily re-introduce a session-12-class defect to prove the gate bites.
**Mutation check PASSED** — the gate caught the re-introduced defect (`aria-prohibited-attr` appeared in the census). Now revert and confirm GREEN:
Revert clean, gate GREEN. Now the full gate — lint, typecheck, unit, and the complete E2E suite:
Run 1: **156/156**. Second consecutive run for determinism:
**Gate fully green: 256 tests** (100 unit + 156 E2E × 2 consecutive runs). Now let me restart the :3000 production server with the current build for the live re-verification and screenshots.
New server hit EADDRINUSE (old one persists) — but rendering is byte-identical (verified: only test/doc/deps changed), so the running server is valid for the re-diff. Running the pixel re-diff now:
Login page renders fine via curl. Let me debug what the Playwright page actually saw:
Labels present in SSR HTML but missing in the live browser — let me inspect the actual rendered body:
**Root cause found**: the stale :3000 server process serves the OLD build manifest while my rebuild replaced the chunk files — missing chunks return 500 and hydration breaks. The E2E suite passed because it boots its own server. Let me find the hidden server PID via /proc and kill it:
Server restarted with the current build. Re-running the pixel re-diff:
Pixel re-diff identical to baseline — the gate is rendering-neutral. Now let me create this round's screenshot capture script. First, checking the session-14 mobile-nav capture pattern:
Now writing the session-15 capture script (screenshots 86–90):
All 5 captured — and screenshot 87 has the exact byte count of the 14th verification. Let me check md5:
**15th mobile-nav is byte-identical (md5) to the 14th AND 13rd** — three consecutive rounds of rendering continuity. Now VLM verification of the new screenshots. Let me check the convention:
SDK available in the parent workspace. Let me write the VLM check script there (keeping the repo clean — the SDK was deliberately pruned from repo deps):
The SDK is in the bun global install. Let me use the `z-ai` CLI for the vision checks:
86: PASS. Running the remaining four:
**VLM verification: 5/5 PASS.** Now dev-DB hygiene, then the documentation updates.
Dev-DB clean. Now updating documentation — starting with AGENTS.md:
The edit split the steppers bullet — let me repair the orphaned lines:
AGENTS.md updated. Now CLAUDE.md:
Now updating test counts in CLAUDE.md (150→156 E2E, 250→256):
Now README.md updates:
README done. Now the PAD — revision row, ADR-023, and matrix updates:
Now the PAD title, matrix, and resolved-issues table:
Now the Known-Issues Resolved row:
PAD complete. Now the SKILL doc — version bump, lessons, ADR index:
Now the SKILL's ADR index:
SKILL doc complete. Now the session log — `docs/session_28.md`:
Now appending the worklog entry:
Now the final pre-commit check — git status and full lint/typecheck on the new files:
All gates pass. Cleaning up non-committable artifacts, then committing:
Changeset clean. Let me review the SSH push wrapper skill before committing:
I have the full procedure (note: must pass `--remote` explicitly for this repo). First, the commit:
Committed `f3fdc26`. No ssh binary — I need the paramiko shim (Appendix A of the skill). Let me read it:
paramiko 5.0.0 installed. Now deploying the shim outside the repo:
Shim deployed. Now materializing the SSH key (outside the repo, 0600):
Dry-run clean (fast-forward `443d03d..f3fdc26`). Executing the real push:
**Round-15 (session-15) delivered and pushed to `main` @ `f3fdc26`** — remote ref verified, key shredded.

## What shipped

**Audit (zero parity defects):** 15th mobile-nav verification (byte-identical md5 to the 13th/14th — no Tailwind v4 regression); first **full-route production-readiness census** (22/22 routes console-clean, 19/19 internal links live); 8-route pixel drift at baseline; axe differential re-measured at byte-identical counts.

**Deliverable (ADR-023):** the manual axe differential is now a **standing E2E gate** — self-hosted axe-core, census pinned to `{color-contrast}` with reference-identical counts, **mutation-proven** to catch the session-12 defect class. Gate: **256 tests** (lint 0/0 · 100 unit · 156 E2E × 2 runs) · screenshots 86–90 VLM 5/5 · PAD v1.15 · SKILL v1.15.0.

**Suggested next:** round-16 candidates are an email provider (activates the verification gate), Stripe Payment Element, or extending the axe gate to mobile/admin viewports — say the word and I'll start the next round.

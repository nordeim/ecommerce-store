I'll continue the workflow from where we left off. The session numbers have advanced to session_34/35 + remediation-plan-session18, indicating more completed work. Let me start by refreshing the workspace.
The workspace has been reset. Let me clone the repository fresh.
Repo cloned successfully. Now let me review the key documents. First, let me check document sizes to plan my reading strategy.
Round-18 (session 34/35) shipped the mobile CWV standing gate. Now let me review the remediation plan and worklog to understand the current state and next steps.
Now let me check the worklog tail and the key core docs.
工作日志确认 Round-18 已完全交付。现在让我来审查核心文档。
Let me read AGENTS.md in chunks directly.
Now let me review CLAUDE.md and README.md.
Found a minor doc inconsistency: PAD title says v1.17 but revision block has the v1.18 row (session-18 missed bumping the title). I'll note this for the docs update. Now let me validate the codebase state.
The env-shadowing trap is live (shell `DATABASE_URL` points to the sandbox path). Let me set up the environment per the documented contract: create `.env`, install deps, run `db:setup`, and restore the hard-link convergence.
The repo DB is set up. Now let me restore the hard-link convergence so the sandbox-injected env path and the repo path point to ONE file.
Hard-link convergence live (inode 172841 both paths). Now checking for stale servers (L25 lesson), then running the baseline gate.
Build clean (23 routes, zero warnings). Now running the E2E suite for the full baseline gate.
**Baseline gate GREEN: 272 tests** (lint 0/0 · tsc clean · 100/100 unit · build 23 routes · 172/172 E2E) — exactly the documented session-18 ship state. Now let me audit the recent code changes and map the relevant skills.
Skills mapped. Now let me check the current a11y spec structure to understand the login anon pattern (the model for the auth-screens extension), and start the production server for the Round-19 audit.
The login anon pattern is clear. Now let me start the production server and begin the Round-19 audit.
Reference authenticated. Now setting up the clone session.
The server process died. Let me restart it robustly with nohup.
The sandbox reaps background processes (only the agent-browser daemon survives). Let me try the double-fork pattern.
服务器通过双分支（double-fork）模式存活。现在正在设置克隆会话。
Both sessions authenticated. Now the **19th mobile-nav verification** (iPhone 14 emulation, both sites).
iPhone 14 emulation live (390×844, DPR 3, hover:false). Now the 19th mobile-nav verification — opening the reference's mobile menu.
Reference mobile nav measured — exact documented baseline. Now the clone.
**✅ 19th mobile-nav verification: complete parity** — panel token-identical, 288px/24px, bg rgb(251,250,249), all 5 links byte-identical. No Tailwind v4 regression (19th consecutive). Now the functional deep-link check.
Functional check passes — deep-link + auto-close verified. Now the standing drift watches. Let me check the persisted sweep script.
All 8 routes at the baseline band. Now the full-route census.
Census clean. Now the typeahead + carousel watches on the reference.
Typeahead watch confirmed — zero search requests on the reference. Now the carousel cadence watch.
Reference cadence ~5.0s confirmed. Now the clone's carousel cadence.
All standing watches pass. Now the round's primary new surface: the **auth-screens axe differential** (register/forgot-password/verify-email, both sites). Let me review the session-16 axe-diff script as the model.
Now let me write the session-19 auth-screens axe differential script.
**Auth-screens axe differential: complete parity** — clone census byte-identical to the reference ({color-contrast} 2/2/1 at both viewports). Zero parity defects on the new surface. The finding: the standing gate covers login but not the rest of the auth family. Let me verify the verify-email screen state before calibrating.
Key discovery: the reference's `/verify-email` route renders its platform 404 client-side — the clone's `/verify-email` is a **superset surface** (like the admin console). So register/forgot-password are parity surfaces (2/2), verify-email gets a QUALITY census (1). Let me check the auth forms for mutation-target candidates.
Let me study the mobile login test pattern for the anon + device combination.
I now have the complete audit picture. Let me write the remediation plan for the round's finding: **A11Y-GATE-3 — the auth-screens axe gate completion**.
Plan saved. Now validating the mutation hooks against the codebase before execution.
Mutation hooks validated. Now writing the E2E-condition calibration script.
**Calibration stable: {color-contrast} 2/2/1 at both viewports** — byte-identical to the live differential. Now the TDD RED phase. Killing the calibration server first (L25), then writing the RED-form describe.
Now appending the RED-form auth-screens describe (zero-tolerance budgets to prove the assertions bite):
Now the RED run — temporarily zeroing the pins to prove the assertions bite.
All 6 failed. Let me verify the failure payloads carry the measured census values (the RIGHT reason).
**RED confirmed for the RIGHT reasons** — all six failures carry the measured census (2/2/1, both viewports). Now restoring the GREEN form.
**GREEN — 7/7 passed** (setup + 6 new tests). Now the mutation efficacy proofs. **Mutation 1: remove the verify-email input's aria-label.**
**MUTATION 1 CONFIRMED** — verify-email fails with the `label` rule at both viewports; register/forgot stay green. Reverting and applying **mutation 2: register's Confirm Password label association removal**.
Mutation 2 did NOT bite — all green. Let me investigate why (checking the Label/Input components).
The mutation is live in the DOM (for=null) but axe doesn't flag it. Let me inspect the input's accessible-name sources.
**Critical finding** — axe's `label` rule PASSES the unlabeled password input. Let me investigate the axe-core label-matches logic to understand why.
**Root cause found** — axe's `label` rule `any` checks include `non-empty-placeholder`: the reference-parity placeholder `••••••••` masks the label-association defect. This is a mutation-design lesson (L29). Revising mutation 2: remove both the htmlFor and the placeholder.
The stale-server trap (L25) — my manually-booted :3100 is serving the old build. Killing it and re-running.
**MUTATION 2 CONFIRMED** — register fails with `label(1)` at both viewports; forgot/verify-email stay green. Reverting mutations and verifying GREEN.
GREEN restored (23/23 a11y tests, +6). Updating the remediation plan with the revised mutation + the new L29 lesson.
Now the full gate — two consecutive E2E runs for determinism.
Run 1: **178 GREEN**. Now run 2 of 2 for determinism.
**Gate GREEN: 278 tests × 2 consecutive runs.** Now the live re-verification — restarting :3000 on the current build and re-running the pixel sweep + the 19th mobile-nav md5 capture.
Pixel re-diff identical to baseline. Now the 19th mobile-nav capture with md5 continuity check.
Now writing the session-19 capture script (screenshots 106–110).
**19th mobile-nav capture BYTE-IDENTICAL (md5) to the 13th–18th** — seven consecutive rounds of rendering continuity. Now VLM-verifying the 5 new screenshots.
4/5 PASS — 107 flagged "missing LUXE brand" but it's md5-identical to the verified 18th. Let me verify by direct inspection (the session-18 precedent).
Direct inspection confirms the drawer renders correctly (close X + nav links — the "LUXE brand" was my prompt's inaccurate expectation; the same session-18 precedent). **All 5 verified.** Reverting the transient SDK + dev-DB hygiene.
Changeset clean. Now the documentation updates — starting with AGENTS.md (the A11Y-GATE-3 contract + L29 lesson).
AGENTS.md updated. Now CLAUDE.md.
CLAUDE.md updated. Now README.md.
README.md updated. Now the PAD — v1.19 with the title-bump fix, revision row, ADR-027, Known-Issues row, and matrix updates.
Now adding ADR-027 after ADR-026 and updating the Known-Issues + matrix:
PAD 已更新。现在开始处理 SKILL 文档 — v1.19.0，包含 L29 + ADR 索引条目。
SKILL doc updated. Now writing the session log (docs/session_36.md).
Now appending the worklog entry:
Per the session-18 pattern (commit → push → check off the sign-off in a follow-up commit), let me uncheck the final item before committing.
Now the final changeset review and commit. Let me verify the changeset is clean and read the SSH wrapper skill first.
No ssh binary and no paramiko — deploying the Appendix A shim approach (the session-18 precedent). Let me read the shim code.
The wrapper procedure is clear. First, committing the changeset.
Paramiko installed. Now deploying the ssh shim outside the repo and materializing the key.
Dry-run verified (auth OK, remote at `78685e3`). Now the real push.
**Push verified** — remote `refs/heads/main @ 3cc091e == local HEAD`. Now shredding the operator key and checking off the final sign-off item.
Both commits pushed and verified. Let me do final cleanup — kill leftover servers and record the session in the system worklog.
**Round-19 shipped and pushed to `main`** ✅ (commits `3cc091e` + `5aad157`, wrapper-verified, keys shredded)

**What this session delivered:**

- **Audit — zero parity defects:** 19th consecutive mobile-nav verification at byte-exact parity (no Tailwind v4 regression; capture md5-identical to the 13th–18th); all standing watches at baseline. The **first auth-screens axe differential** measured register/forgot-password byte-identical on both sites ({color-contrast} × 2) — and revealed the reference's `/verify-email` renders its platform 404, making the clone's standalone screen a superset with a QUALITY pin.
- **Deliverable (ADR-027, A11Y-GATE-3):** the `a11y auth screens gate` in `accessibility.spec.ts` — 6 tests = 3 screens × 2 viewports in anonymous contexts, E2E-calibrated (2/2/1), dual-mutation-proven.
- **New lesson (L29):** axe's `label` rule accepts a non-empty **placeholder** as a last-resort name source — the reference-parity `••••••••` placeholders mask label-association defects (discovered live when the first mutation failed to fire).
- **Gate: 278 tests** (100 unit + 178 E2E, two consecutive runs) · screenshots 106–110 VLM-verified · PAD v1.19 (incl. fixing the missed v1.18 title bump) · SKILL v1.19.0.

**Suggested next:** Round-20 candidates — INP pins (the scripted interaction protocol), an email provider to activate the ADR-011 verification gate, or Stripe Payment Element (the latter two need external credentials). Just say the word.

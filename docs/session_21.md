Workspace refreshed — `git pull` fast-forwarded to `f9becf4` (adds `docs/session_19.md`). Now let me review the core documents.
I have the full picture now: Round 10 shipped (`297d018`) + `docs/session_19.md` (log commit `f9becf4`). This session = **Round 11 (session-11)**. Let me verify the environment and run the baseline gate.
Environment intact: DB hard-link convergence live (inode 303519 both paths), no servers running. Now the baseline gate — fast gates first.
Build clean — 23 routes. Now the E2E gate (foreground, no dev server — per OOM lessons).
**Baseline gate fully green**: lint 0/0 · tsc clean · 88/88 unit · build 23 routes · 138/138 E2E = **226 total** — exactly the documented session-10 ship state. Marking todos and moving to the Round-11 audit.
Production standalone server is live on :3000 with DB healthy. Now let me load the agent-browser skill for the Round-11 differential audit.
Now setting up the dual audit sessions (ref + clone), following the established conventions.
Both sessions authenticated. Now the **mobile nav 11th standing verification** (iPhone 14 on both sites).
**✅ Mobile nav 11th verification: BYTE-EXACT PARITY** — identical panel classes, pad 24px, gap 16px, bg `rgb(251,250,249)`, 5 identical links (239×44, 18px/500). No Tailwind v4 regression.

Now let me close the sheets and start the Round-11 new-surface audits: reduced-motion, print media, color-scheme, and a11y semantics.
Rich results. Print (notation-only diff = documented trap 6), dark-mode (both inert), and shop/PDP landmarks are at parity. Key leads to validate: the home **h1 census (clone renders 3 h1s — all carousel slides in DOM)**, carousel rotation detection, the ref toast selector miss, and the /login input count (likely Next hidden action inputs). Let me write a follow-up probe.
Key leads resolved: the clone's inactive slides ARE `aria-hidden="true"` (a11y parity ✓ — the 3-h1 reading was a raw-DOM artifact), print/dark dismissed. But two real leads remain: **the clone's carousel did NOT rotate in 15s (ref cycled all 3 slides)**, and one extra img on the clone's home. Let me inspect the carousel source.
The carousel code is correct (5s interval). My rotation probe was broken — `querySelector("h1")` always returns the FIRST slide's h1 (all 3 stay in DOM), and the dot probe matched Prev/Next buttons (count 5). Need a proper probe: track the active slide via `aria-hidden`/opacity. Also need full img srcs to identify the +1/+2 extra imgs.
Now clear: ref swaps the active hero slide in DOM (1 hero img); clone renders all 3 (known/expected divergence, inactive = `aria-hidden`+opacity-0). The toast motion samples and the ref's DOM-swap structure are understood. Two decisive probes remain: **correct carousel rotation measurement** (via slide `aria-hidden` over time) and **tab-order through the hero** (are the invisible slides' CTA links focusable? — aria-hidden containers don't remove children from tab order).
Rotation **parity confirmed** — the clone cycles Spring → Tech → Home at the same cadence (my earlier probes were reading the wrong elements). Tab census from `body` is identical, but I need to tab **through the hero CTA** to expose the invisible-slide focusability question.
**FINDING CONFIRMED — A11Y-FOCUS-1**: on the clone, tabbing from the active hero CTA moves focus to `Explore` and `Browse` — **links inside invisible (aria-hidden) slides**. A WCAG focus-order violation and a divergence from the DOM-swapping reference. Let me verify the ref's hero tab sequence with a better locator to complete the evidence.
Complete A/B evidence for A11Y-FOCUS-1:
- **REF**: CTA → prev → next → dots (inactive slides don't exist in DOM — no invisible stops)
- **CLONE**: CTA → **`Explore` (invisible!)** → **`Browse` (invisible!)** → buttons

Let me sweep the codebase for other aria-hidden+focusable instances, then run the pixel-diff drift re-check.
All other `aria-hidden` usages are decorative icons (correct pattern) — the blast radius is contained to `hero-carousel.tsx`. Now the pixel-diff drift re-check on key routes.
Diffs are elevated vs the documented baseline (account 17.6%, PDP 4.8%). Likely causes: different account data (operator vs demo user), image-load timing, or genuine reference drift. Let me diagnose the account page at DOM level.
The clone's `/account` returned no `main` — the storageState session may have redirected to the login gate. Let me verify.
Root cause: my :3000 server runs `AUTH_SECRET="audit-secret"` while the storageState cookie was signed by the E2E server's secret — cookie invalid → guest redirect. The elevated diffs were measurement artifacts. Re-running pixel diffs with fresh logins on both sites + image-complete waits.
Account dropped to 1.81% (gate artifact fixed), but all routes remain elevated vs baseline — and the ref's account text shows a **Phone field** I don't recognize from the parity contracts. Possible reference drift. Let me census the DOM structure on each route.
DOM/text content is **identical** on every route (account's Phone field exists on both — no content drift). The pixel elevation must be visual-level. Let me generate a visual diff overlay to localize where the PDP pixels differ.
Diff bands are text-row-shaped and include the header on every route — smells like font rendering, not layout. Decisive check: compare computed font-family/size/weight on header elements + body text on both sites.
Same primary font family, identical computed styles — likely rasterization/hinting noise vs a real geometry drift. Decisive test: diff a **blurred** version of the screenshots — high-frequency antialiasing noise collapses to ~0 under blur, real layout differences survive.
The blurred PDP diff is *higher* (6.5%) — something structural. Let me inspect the diff overlay visually with the VLM skill.
The diff marks are **all text glyphs** — layout is identical. This points to font rasterization differences at a tight threshold. Prior sessions' numbers (0.29%) used a looser pixelmatch-style tolerance. Let me re-measure with a standard perceptual threshold to separate methodology from real drift.
Still elevated at the standard threshold — real text-rendering change. Prime suspect: `-webkit-font-smoothing` / `text-rendering` CSS differences. Let me check those computed properties on both sites.
**FOUND IT — a real divergence (trap 12 candidate): font smoothing.**
- **REF**: `-webkit-font-smoothing: auto` (subpixel AA — darker text)
- **CLONE**: `antialiased` (grayscale AA — lighter text)

That's exactly the ~1–3.6% text-pixel diff on every route. Let me locate the declaration in the clone and check its history.
`antialiased` has been in the clone since the initial port (`e91d147`) — the shadcn v4 template default. The reference measures `auto`. This is **F2 (FONT-SMOOTH-1, trap 12)**: a computed-style + rasterization divergence explaining the elevated text-pixel diffs.

Let me complete the audit with the standing typeahead drift re-check, then finalize the findings.
Wrong inputs — the probe hit the newsletter (ref) and sidebar search (clone). The typeahead lives in the header. Let me target it precisely.
Both findings confirmed; drift watch closed (clone's typeahead = working superset, ref fires nothing). The audit is complete. Now let me validate the test seams before writing the remediation plan.
Seams validated. Now writing the Round-11 remediation plan per repo convention.
**TDD RED** — adding the two failing tests to `storefront-parity.spec.ts`:
Now run the RED phase — both tests must fail against the current (unfixed) build:
**RED confirmed for the right reasons**: focus lands in the hidden slide (`inHiddenSlide: true`) and smoothing computes `antialiased`. Now **GREEN** — implementing both fixes:
Now T2 — remove `antialiased` from both places:
Both fixes in. Typecheck + rebuild, then GREEN:
The typecheck error is in my one-off audit probe (repo root) — not src. Moving the probes out of the repo (they've served their purpose; the persisted versions will be re-added properly later):
**GREEN complete** — all 26 parity tests pass including both new pins. Now the full gate (E2E suite + unit):
**Full gate green, determinism proven**: lint 0/0 · tsc clean · 88/88 unit · build 23 routes · **140/140 E2E × 2 consecutive runs** = 228 total (was 226). Now restarting the :3000 server with the new build for live re-verification.
Now the persisted live re-verification script (repo convention):
8/10 — the two FAILs are check-script bugs, not code bugs: the tab walk started one Tab late (sequence is actually perfect: Previous → Next → dots → out to "View All"), and the inert census matched 2 extra aria-hidden elements beyond the 6 slide containers. Let me identify those 2 extras to be sure they're inert-safe.
The 2 extras are **decorative SVGs** (lucide chevrons) — not focusable, no links, inert-safe. Fixing the two check-script bugs:
**Live re-verification: 10/10 green.** Now the decisive pixel re-diff — the diffs should collapse toward baseline:
Identical numbers — revealing: in **headless** Chromium, subpixel AA is unavailable, so `auto` vs `antialiased` render identically; the headless pixel-diff elevation must have a different cause (likely font-file glyph rasterization), while the smoothing fix matters in **real browsers** (computed contract now aligned). Let me compare the actual font files each site serves.
Suspicious: the ref's stylesheet shows **no @font-face** and no font preloads — its computed `font-family` declares "Plus Jakarta Sans" but may actually render the fallback. Let me check `document.fonts` (the definitive loaded-face API) and grep the ref's CSS bundle.
Both load the same variable font family. Let me compare the actual font FILE bytes — different woff2 builds (subsetting/hinting) would explain the residual text-pixel diffs.
**Major discovery**: the ref's actually-downloaded font file is `kartasans/v12/...woff2` — **Karta Sans**, not Plus Jakarta Sans! The declared family name may mask a different typeface. Let me fetch the ref's CSS bundle directly and read its @font-face rules.
The ref's `--font-sans` declares "Plus Jakarta Sans" but the only web font it loads is the **Karta Sans file** (JS-injected FontFace alias) — the ref likely renders Karta Sans glyphs under a "Plus Jakarta Sans" family name. Let me confirm with a live glyph-width measurement on both sites.
Canvas proof: the ref's "Plus Jakarta Sans" face measures **1009px** vs the clone's **1013px** for identical text — the faces are **different font files** (the ref's file is a ~27KB woff2 from `kartasans/v12/`). The reference's actual font file has drifted; true visual parity means self-hosting the reference's exact file under the same declared family name. Let me inspect the current font wiring.
The URL was truncated in my earlier capture (sliced to 55 chars) — and gstatic served an HTML error. Let me re-capture the full font URL from the browser.
**Correction — red herring resolved**: the full URL is `s/plusjakartasans/v12/...` — the ref loads real **Plus Jakarta Sans v12** (my earlier 55-char slice chopped "plusja"→"kartasans"). So both sites use PJS, but the **files differ** (the ref's Google-served v12 woff2 vs next/font's repackaged copy) — explaining the 0.4% metric delta and the text-pixel diffs. The parity action: self-host the reference's exact woff2. Downloading it now:
Advance widths are **identical** — so layout matches and the pixel diffs must come from glyph **outlines/hinting** differences between the two builds. Let me compare the actual outline data:
Outlines **identical** too. The remaining suspect: **kerning (GPOS)** — sub-pixel letter-position shifts would explain both the 4px canvas delta and the AA-level pixel diffs. Comparing GPOS:
All tables **identical** — the fonts are functionally the same. The pixel diffs must come from something else entirely. Let me look at the actual screenshots side by side:
The VLM sees **no meaningful visual difference** — the fonts are functionally identical, layout identical. The 1-4.8% raw-resolution diffs are sub-visual rasterization noise (my threshold is tighter than the prior sessions' convention). Let me verify with the downscale-separation test:
Downscaling *increased* the diffs — large-area low-frequency differences, pointing at the **product images from the CDN** (login = lowest diff, PDP = highest). But cart (image-free) at 2.46% breaks that pattern. Let me examine the cart diff overlay:
The VLM confirms a **text halo on every letter** — rasterization weight difference. I compared glyf/hmtx/GPOS but NOT the variable-font tables (`fvar`/`gvar`/`OS/2`) — a different default instance or weight mapping would render different stroke weights. Checking:
Only `head` differs! Let me see which field:
**ROOT CAUSE FOUND — the `prep` table (TrueType hinting program)**:
- **Ref font**: has `prep` (executed by the rasterizer — custom grid-snapping)
- **Clone's next/font copy**: `prep` **stripped by next/font's repackaging**

Same outlines, same advances — different hinting → the text halo on every glyph. The fix: **serve the reference's exact woff2** (self-hosted `@font-face`). Checking unicode coverage first, then implementing:
Coverage confirmed (all site chars covered; identical fallback behavior as the ref). Implementing the font swap — self-hosting the reference's exact woff2:
Now update `layout.tsx` to drop the next/font wrapper:
Let me clean that up properly instead of leaving a null stub:
Build clean, font served. Restart the server and re-verify + re-diff:
**Exact match with the reference**: width 1009 (was 1013), stack `"Plus Jakarta Sans", sans-serif`, smoothing `auto`, same single face. Now the decisive pixel re-diff:
**SPECTACULAR COLLAPSE** — all routes back to/below the documented session-10 baseline:

| Route | Before | After | Session-10 baseline |
|---|---|---|---|
| home | 1.62% | **0.31%** | 0.30% |
| shop | 2.50% | **0.34%** | 0.29% |
| pdp | 4.81% | **0.60%** | 0.54% |
| account | 1.81% | **0.31%** | 0.29% |
| cart | 2.46% | **0.31%** | 0.40% |
| login | 0.90% | **0.23%** | 0.27% |

The trap-13 font file + trap-12 smoothing fixes fully explain the drift. Now let me add the E2E font-parity pin, check .gitignore, and update the remediation plan with the new finding:
All 27 parity tests green. Now updating the remediation plan with the trap-13 finding discovered during remediation:
Now the full gate with the font swap included:
**Full gate green, determinism proven**: 141/141 E2E × 2 · 88/88 unit · 23 routes · **229 total** (was 226, +3 E2E). Extending the verify script with font-parity checks:
**14/14 checks green.** Now the screenshot capture script (repo convention):
Now VLM-verify the 6 captures (from a scratch dir per repo convention):
All 6 captures verified (64's initial "FAIL" was my description error — the Shop Now button is orange, not white; the capture is correct). Now the docs updates. Let me check the PAD and SKILL conventions:
Now updating all docs. Starting with AGENTS.md (traps 12–13 + conventions):
Now adding the hero inert contract to AGENTS.md architecture rules:
Now CLAUDE.md — session-11 contracts and counts:
Now the PAD — v1.11, ADR-019, test matrix, Known Issues:
Now the SKILL doc — v1.11.0 with new pitfalls:
Now the session log (docs/session_20.md, following the even-number convention):
Now the worklog append:
All docs updated. Final pre-commit hygiene — check git status, .env.example, and stray files:
`.env.example` current, no stray files. Now dev-DB hygiene per repo convention (the audit's toast probe added a guest cart item):
DB clean and canonical. Quick final lint/typecheck (the new scripts may be in scope), then commit:
Fixing the typecheck error in the capture script:
Gates green. Committing and pushing via the SSH wrapper:
Commit `6d21c58` on main. Now the SSH push — key to a 0600 file outside the repo, dry-run first:
No OpenSSH — the documented sandbox case. Building the paramiko shim per Appendix A:
Deploying the shim to the workspace bin (outside the repo per rule 5):
Dry-run clean (fast-forward `f9becf4..6d21c58`). Executing the real push:
Push verified — remote main @ `6d21c58` == local HEAD, tree clean, key shredded. Final cleanup (stop the audit server, record the project-level worklog):
Round 11 (session-11) is complete and shipped ✅ — commit `6d21c58` on `main`, pushed via the SSH wrapper, remote verified, key shredded.

**What this round delivered:**
- **Three new parity findings, all live-measured on both sites:** the hero carousel's invisible slides kept their CTA links tabbable (WCAG focus-order defect); the shadcn v4 starter's `antialiased` made text render lighter than the reference's subpixel AA; and the deepest one — **next/font's repackaged woff2 strips the `prep` hinting table**, putting a measurable halo on every glyph (pixel diffs 1.62–4.81%).
- **Fixes:** `inert` on inactive slides (tab order now exactly the reference's), `antialiased` removed, and the reference's **exact** Google-served woff2 self-hosted at `public/fonts/` — pixel diffs collapsed to **0.23–0.60%** (the session-10 baseline).
- **Mobile nav: byte-exact parity for the 11th consecutive verification** — no Tailwind v4 regression. First media-preference sweep (reduced-motion/print/dark) and a11y-semantics census — everything else at parity.
- **Gate: 229 tests** (88 unit + 141 E2E, two consecutive full runs), live re-verification 14/14, screenshots 64–69 VLM-verified, docs current (PAD v1.11/ADR-019, SKILL v1.11.0, traps 12–13).

**Suggested next:** round-12 candidates — a Lighthouse/axe accessibility pass, admin order filtering/search, or wiring an email provider to activate the verification gate. Say the word, or just "review again" for another differential audit round.

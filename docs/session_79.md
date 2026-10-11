# Session 79 — Round 40: DOCS-ALIGN-1 — The Structural Docs Rewrites ("The Map Is the Territory")

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional, keep the vitest + playwright suites healthy,
write + validate + execute a TDD remediation plan, capture dev-server
screenshots, update the docs, and push to main via the SSH wrapper.

**Workspace state.** RESET — the sandbox was re-provisioned; a fresh
`git clone` at `380ea2f` (the session-39 ship `07567ba` + the user's
session-77/78 narrative logs, zero code delta). The env-shadowing
trap verified LIVE (the injected shell `DATABASE_URL`
`file:/home/z/my-project/db/custom.db` wins over both `.env` files) —
neutralized the session-21 way: `db:setup` ran against the injected
path, then the hard-link convergence put BOTH `db/custom.db` paths on
one inode (134504). The fresh sandbox needed the Playwright browsers
re-installed (chromium-headless-shell v1243). `bun install` green
(475 packages) · `bun run db:setup` idempotent (6 categories, 12
products, 4 users, 4 canonical orders, 3 hero slides); the repo
`skills/` exclusion re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **323→332/332 unit+integration
(21 files)** · build exit 0 · the FULL E2E baseline re-run **254/254
(8.3m, foreground — the L26/L27 lesson)**. The documented
session-77/78 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.39, SKILL
v1.39.0, session_77/78, remediation-plan-session39, the worklog S39 —
the repo is 39 remediation rounds deep, 586 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, code-review-checklist, code-quality-standards, plus
the repo's own trap log. The doc reviews were DELEGATED IN PARALLEL
(three subagents, each fact-checking one doc family against the
codebase) and returned a much larger ledger than the round-38 review:
the PAD's three structural sections (§3.2's tree, §4.1's ER, §12's
line counts) measured at their true drift (~28 of 128 src files
absent from the tree; 3 of 15 models absent from the ER; 12/14 line
rows understated ~49% total), plus **one structural DEFECT the audits
discovered: ADR-046 is DUPLICATED in the PAD's ledger** — the
session-39 "ADR-045/046 ordering fix" had MOVED a copy of the block to
its ordered position but LEFT THE ORIGINAL in place (48 headers for
47 ADRs, verified by diff). The cross-doc ledger: AGENTS ×7 · CLAUDE
×7 · README ×8 · SKILL ×14 — each with exact line numbers.

**The Round-40 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on slide
`1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 40th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500
with identical hrefs; the Electronics deep-link + auto-close). The
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots,
JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11
admin surfaces CLEAN.

**The code audit (sessions 37–39 + a general scan).** CLEAN — no real
bugs: the round-39 seam (`src/lib/delivery-window.ts`) re-read
line-by-line (the holiday table, the stepper predicate, the per-step
year resolution, the cache, the format branches all correct — the
math is round-39-proven by the independent oracle + triple mutations);
both consumers compose the seam unchanged; the round-39 ship commit's
file list matches its documented scope. Four code-side COMMENT-drift
micro-findings rode the round: the seed header's "ORD-2026-001/002/003"
(004 has existed since session-33), the schema's + checkout's
`ORD-YYYY-NNNNNN` (the real format is NNN — zero-padded 3), and the
schema's OrderEvent type comment missing `payment_refunded` +
`tracking_added`.

**The candidate triage (session-77's list):** the DOCS-ALIGN pass
CHOSEN (the named first candidate — "the PAD's §3.2 architecture tree
+ §4.1 ER diagram + §12 key-files line counts remain stale... a larger
DOCS-ALIGN pass"; the audits measured it far beyond the three named
spots, and the ADR-046 duplicate made it a defect repair, not a
cosmetic pass); the rate-limiter store re-deferred; the per-order
shipping-method surface re-deferred (the session-38 parity ruling);
the credential-gated items unchanged (no Stripe test-mode keys or
email provider provided).

**THE DELIVERABLE (DOCS-ALIGN-1)** — a docs round executed with the
full TDD discipline, the verification script as the test layer:

- **The RED oracle:** `scripts/verify-docs-align-r40.mjs` — an
  independent verifier (never reading a doc's claim as truth) that
  checks five families: the §3.2 tree (every documented path exists;
  29 load-bearing real paths documented; the 4-endpoint line; the 19
  spec count), the §4.1 ER (all 15 models drawn; the
  User→PasswordResetToken relation; the post-session-20 column notes),
  the §12 line counts (every row within ±5 of `wc -l`; the
  delivery-window row exists), the ADR ledger (strictly increasing,
  contiguous 001→047, exactly 47), and 14 cross-doc counts (env vars,
  rate limiters, Radix list, OrderEvent vocabulary, the AGENTS/CLAUDE
  test counts, the SKILL route/trap/order counts). **RED: 5/5 families
  red — 22 failing checks, the drift census recorded per-family.**
- **GREEN batch 1 — the ADR-ledger repair (the headline defect):** the
  duplicate ADR-046 block deleted (the out-of-order first copy), the
  ordered copy kept, the `---` separator restored; 47 ADRs, strictly
  ordered, no duplicates — script-verified.
- **GREEN batch 2 — the PAD's three structural rewrites:** §3.2's
  tree rewritten from the real `find src` census (all 128 files: the
  `actions/` seam directory, the order-*/admin-*/stripe lib families,
  `src/proxy.ts`, the six missing app paths, the 4-endpoint route
  whitelist line, the 19 e2e specs + the integration test +
  `dev-cleanup.ts`); §4.1's ER extended to 15/15 models
  (PasswordResetToken, StripeEvent, NewsletterSubscriber + the User
  relation + the payment/fulfillment column notes); §12 re-counted
  (all 14 rows refreshed; the delivery-window seam gains its row; a
  note pointing at the verifier). Plus §1.2's ghost `z-ai-web-dev-sdk`
  row dropped (pruned in session-7; the historical ADR mention stays),
  ADR-004's session-22 addendum (the 4th endpoint — historical ADRs
  stay immutable), §6.1's seven limiters (verify-resend + stripe-intent
  added), §6.2's security utilities extended (reset-token,
  order-view-token, stripe/stripe-payment), ADR-001's path fixed, the
  v1.40 revision row.
- **GREEN batch 3 — the four-doc stale-spot ledger:** AGENTS.md (the
  stripe-payment 52→67 + webhook 11→18 counts, the order-timeline
  16→17, the CSP line's third force-dynamic screen + the conditional
  Stripe expansion, the a11y gate's surface-list extension note, the
  command table +4 rows); CLAUDE.md (the (auth) five members, the
  admin-payments 24→54, the seo 6→7, the webhook 11→18, the §5 spec
  list + seo/stripe); README (the mermaid's PAGES/ACTIONS/RH/LIB
  boxes, the File Hierarchy's route/component/lib rows, the 253+1
  setup split, Bun ≥1.3); SKILL v1.40.0 (the env table 3→7 + the
  four rows, the 26 routes, the 68/34 component census, the trap-log
  scoping (§4.2 + Appendix C), the fifth auth route + the prerender
  rewrite, the §5.2/§5.3 inventory rows (skeleton not toast,
  category-card, the 17-member store/ list, the admin family,
  stripe-pay), the §7 four demo orders + the tracking/timeline
  fixtures, the §13 four-endpoint whitelist, the §12 lessons
  renumbering (the 31→33 jump closed), the Radix six, the lib
  inventory's 27 modules, the "three static auth screens", the
  commands +3, the Appendix C latest-plan pointer → session40).
- **GREEN batch 4 — the four code-side comment fixes** (seed header,
  the two ORD-YYYY-NNN format comments, the OrderEvent six-value
  vocabulary) — comment-only, zero behavior.
- **GREEN: the verifier 5/5 families, 25/25 checks.**

**Mutations ×3, each caught by the verifier + byte-exact revert (md5
af9a1e00eef586660bfe1d4d6b1e8510 verified at every step):** M1 an
`actions/` line deleted from the tree → the 29-path check failed
(1 missing); M2 the stale ~330 restored for seed.ts → the line-count
check failed (~330 vs 763); M3 a duplicate ADR-046 header re-inserted
→ the ledger check failed (48 headers, dupes: 46). The §2.3 defect
class can never silently return.

**Full gate (the zero-behavior-change proof):** lint 0/0 · tsc clean ·
332/332 unit+integration · build exit 0 · **the FULL E2E 254/254
(8.4m) + 254/254 (8.3m) × 2 consecutive runs on the final code (586
total — identical to the baseline; the docs round's proof that nothing
behavioral moved)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE;
the 40th mobile-nav verification re-run TOKEN-EXACT; the watches +
census clean (the kill-by-port discipline applied BEFORE the battery —
the round-39 stale-server lesson, since the mid-round rebuild wiped
chunk hashes).

**Screenshots 211–215** (the remediated app, captured against the
production standalone on :3001 — the exact shipped artifact): home
(the standing anchor), the ORD-2026-002 customer order detail (the
rounds-34–39 read surface the rewritten tree documents — "Estimated
delivery: Mar 18 – 24, 2026", the UPS tracking link, the 3-row
timeline), the checkout wizard step 1 (a REAL cart item via the PDP
ATC — the tree's "checkout/ ← wizard page"), the admin payments
console (the ER diagram's StripeEvent surface: the demo-mode banner,
the four seeded event rows with their technical types + outcomes),
and the mobile nav open (the standing 40-round watch surface). **The
live DOM probed BEFORE the VLM run** — and the probe EARNED ITS KEEP
this round: the first 212 attempt navigated by the PUBLIC ORDER
NUMBER and correctly rendered "Order not found" (the GUEST-TOKEN-1
discipline: the route looks up by DATABASE id; the E2E-mirroring
navigation — the account Orders tab → the row link — is the correct
path), and the first VLM description for 214 was written from
assumption ("user-friendly family names") while the real console
shows the TECHNICAL Stripe event types (`payment_intent.succeeded`,
`charge.refunded`...) — the FAIL was the honest signal, the re-read
of the live surface produced the accurate description.
**VLM 5/5 PASS** (after the one reality correction). Dev-DB hygiene:
the capture's cart item removed via `prisma/dev-cleanup.ts` (the
only dev-DB touch this round).

**Docs:** the round's deliverable IS the docs — PAD **v1.40**, SKILL
**v1.40.0**, AGENTS, CLAUDE, README, the four code-comment fixes,
this log, the worklog S40 entry, the plan's sign-offs.
`.env.example` verified current — the round adds NO env plumbing.

## Round 40 shipped ✅
**Session complete** — the baseline 586-test gate verified on the fresh
clone (the env-shadowing trap re-neutralized by the hard-link
convergence; the fresh sandbox's Playwright browsers re-installed);
the Round-40 battery (sweep + 40th mobile-nav + watches + census) all
clean pre-change and re-verified post-change.
**The deliverable: DOCS-ALIGN-1** — the structural docs rewrites: the
PAD's §3.2 tree (all 128 src files, the actions/ seam, the
order-*/admin-*/stripe families, proxy.ts, the 4-endpoint whitelist,
the 19 specs), §4.1's ER (15/15 models + the payment/fulfillment
columns), §12 re-counted; the ADR-046 duplicate repaired (the
session-39 ordering fix had left the original — 48 headers for 47
ADRs); the four-doc stale-spot ledger (~36 spots) + four code-comment
fixes. The TDD discipline adapted honestly to a docs round: the
verification script is the test layer (RED 22 failing checks → GREEN
25/25), triple-mutation-proven, and it stays in `scripts/` as the
standing drift watch — the structural sections can never silently rot
again.
**Gate: 586 tests** (332 unit + 254 E2E × 2 consecutive runs —
identical to baseline, the zero-behavior-change proof), the sweep +
mobile-nav + watches + census all clean. Committed to `main`, pushed
via the SSH wrapper (remote verified, key shredded).
**Suggested next:** the standing credential-gated items remain (Stripe
test-mode keys — would drive the refund action's SDK path live AND
unlock the deferred dashboard deep-link; an email provider — would
unlock the deferred guest-order merge-back). The next audit-derived
candidates: (1) the rate-limiter store migration (the PAD's open
Medium — unchanged, correct for single-instance SQLite); (2) the
per-order shipping-method surface — still BLOCKED on parity unless the
reference changes; (3) a fresh audit sweep of the NEWER seams (the
admin-* family, the stripe-* family) for their own candidate list —
the rounds 27–39 pattern mined the customer surfaces deeply; the
operator surfaces have had lighter audit attention. Just send the next
round instruction when ready.

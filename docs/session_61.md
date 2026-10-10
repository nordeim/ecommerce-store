# Session 61 — Round 31: The Guest Order Confirmation Token

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), integrate Stripe
professionally, keep the vitest + playwright suites healthy, write +
validate + execute a TDD remediation plan, capture dev-server
screenshots, update the docs, and push to main via the SSH wrapper.
This round's extra input: the Scandi Haven repo as the tech-stack
patterns reference.

**Environment rebuild.** The sandbox had been RESET — a fresh
`git clone` at `c5fe4fe`. Rebuilt per the documented contracts:
`bun install` (475 packages) → `.env` from `.env.example` with
`DATABASE_URL="file:../db/custom.db"` → `db/` at the repo root →
`bun run db:setup` (push + idempotent seed) → **the session-21
hard-link convergence recreated** (inode 264240 at both paths — the
env-shadowing trap neutralized; the shell still injects
`file:/home/z/my-project/db/custom.db`).

**Baseline gate.** lint 0/0 · tsc clean · 242/242 unit+integration ·
build exit 0 (25 routes) · the FULL E2E baseline re-run **233/233
(7.6m, foreground — the L26/L27 lesson)**. The documented session-30
ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.30, SKILL
v1.30.0, session_59/60, remediation-plan-session30, the worklog — the
repo is 30 remediation rounds deep, 475 tests, every contract
cross-validated. The skills catalog mapped: e-commerce-nextjs16-
monorepo (Scandi's master skill), agent-browser, clone-app-pat-pro,
tdd, plus the repo's own trap log.

**The Scandi Haven patterns review** (the user's tech-stack input):
its checkout-service/webhook/checkout-flow audit confirms LUXE's
Stripe machinery is at or BEYOND its patterns on the payment path
(the idempotency key includes the shipping hash — strictly better
than Scandi's `cart:id:total`; the in-tx dedup row; the intent
anchor; the failure classification; the refund-needed observability
family vs Scandi's stubbed charge.refunded). The checkout-EXPERIENCE
gaps it surfaces are real though: guest-order enumeration hardening,
checkout noindex (its FR-512), autoComplete hygiene.

**The Round-31 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on the same slide];
shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%,
account 0%, login 0.28%). **The 31st mobile-nav verification:
TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500
with identical hrefs; the Electronics deep-link + auto-close). The
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms; the SEO layer: 17-URL sitemap, robots, JSON-LD,
offers.price 299.99 USD). The census 24 routes + 11 admin CLEAN. The
hero re-measured live: no content drift (the same 3 slides + CTA
hrefs).

**The Stripe audit** (the round's focus): the full machinery re-read
file-by-file — the sentinel mirror, the lazy SDK singleton, the pure
seams, the mint, verify-then-place, the H4d webhook, the themed
Payment Element island, the wizard. Professional-grade and env-gated
OFF by honest design (no keys provided).

**THE PRIMARY FINDING (GUEST-TOKEN-1):** `/checkout/success` gated
its detailed confirmation with `!order.userId || order.userId ===
user?.id` — the first disjunct is TRUE for every guest order, and the
order numbers are sequential and guessable. **Verified as a live
exploit** (`scripts/guest-order-enumeration-probe.mjs`): a fresh
anonymous context visiting `/checkout/success?order=ORD-2026-004`
rendered the victim guest's email, item, and total. Any visitor —
including any signed-in non-owner — could walk `ORD-YYYY-001..NNN`
and harvest guest PII.

Secondary: `/checkout` + `/checkout/success` carry no `noindex` meta
(robots.txt disallow cannot prevent indexing of linked URLs), and the
shipping step's seven inputs lack their autoComplete field-purpose
tokens (WCAG 1.3.5) while the card fields have theirs.

**The plan** — docs/remediation-plan-session31.md written and
validated file-by-file against the codebase (every line number,
every consumer grep'd).

**TDD RED:** 8 unit contracts (`order-view-token.test.ts` — the
module didn't exist) + 3 E2E extensions (the enumeration scenario,
the noindex heads, the autoComplete tokens) — all failed for the
RIGHT reasons, 13 pre-existing tests in the same specs still green.

**TDD GREEN:** §3.1 the pure seam (`signOrderViewToken` /
`verifyOrderViewToken` — HMAC-SHA256, domain-separated
`order-view:` prefix, AUTH_SECRET-keyed with the auth.ts fallback
mirror, 22-char base64url, constant-time) → §3.2 the action returns
`{orderNumber, viewToken}` at BOTH success sites (the happy path AND
the P2002 already-placed branch) → §3.3 the redirect carries `&t=` →
§3.4 the gate: owner OR token (everyone else the generic block) →
§3.5 `pageMetadata({noindex: true})` on the checkout family → §3.6
the seven autoComplete tokens.

**Targeted runs** green; the full unit layer **250/250** (242 + 8).

**Mutations ×3, each caught + byte-exact revert (md5-verified):**
M1 the gate reverted to the leaky form → the enumeration E2E fails
(the victim email reappears); M2 the domain prefix dropped → the
domain-separation unit contract fails; M3 the noindex spread removed
→ the seo E2E fails.

**Full gate:** lint 0/0 · tsc clean · 250/250 unit+integration ·
build exit 0 · **the FULL E2E 236/236 (7.9m) × 2 consecutive runs on
the final code.**

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE
(the touched surfaces are head attributes + a superset page); the
mobile-nav verification TOKEN-EXACT again; the watches + census
clean. **The exploit re-probe on the remediated build: the attacker
view shows the generic block — victim email/items/total ABSENT; the
tokened URL still renders the details.**

**Screenshots 166–170** (the dev server on the remediated codebase):
home, the checkout shipping step (autoComplete), the tokened guest
confirmation, the bare-number generic block, the mobile nav — VLM
5/5 PASS.

**Docs:** AGENTS.md (the GUEST-TOKEN-1 architecture rule), CLAUDE.md
(the session-31 contracts + the 250/236 counts), README (the 486-test
row + the new gates), PAD v1.31 (ADR-039 + the revision row + the
§4.2 shipping-599/§8.4-counts/§5.1-next-font/§6.1-CSP stale
corrections), SKILL v1.31.0 (the ADR-039 row), this log, the worklog
S31 entry, the plan's sign-offs. `.env.example` verified current —
the token keys off the existing AUTH_SECRET, no new plumbing.

## Round 31 shipped ✅
**Session 61 complete** — baseline 475-test gate verified on the
rebuilt workspace; the Round-31 battery (sweep + 31st mobile-nav +
watches + census) all clean; the Scandi Haven patterns review
confirms the Stripe machinery and surfaces the checkout-experience
gaps.
**The deliverable: GUEST-TOKEN-1 (ADR-039)** — the guest order
confirmation token: sequential order numbers are IDENTIFIERS, not
CAPABILITY tokens. The owner-or-token gate (HMAC view token on the
placement redirect, both success sites, constant-time verify) closes
a live-verified enumeration exploit; the companions add the
checkout-family noindex + the shipping-step autoComplete tokens
(CHECKOUT-SEO-1/CHECKOUT-AC-1).
**Gate: 486 tests** (250 unit+integration + 236 E2E), two
consecutive full runs, triple-mutation-proven. Committed to `main`,
pushed via the SSH wrapper (remote verified, key shredded).
**Suggested next:** the two standing credential-gated items remain
(Stripe test-mode keys for a live-configured Payment Element E2E; an
email provider for the verification/reset/order-confirmation
seams) — with neither provided, the next audit-derived candidates:
(1) the account order-detail surface for GUEST-PLACED orders that
later register (a merge-back view), (2) a `charge.refunded`-driven
admin action seam (the refund trail is read-only today), (3) the
in-memory rate limiter's shared-store migration (the PAD's open
Medium).

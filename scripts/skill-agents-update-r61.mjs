// Round-61 docs update, part 2: the SKILL (v1.61.0 + lesson 065) and
// AGENTS.md (the search-rows family bullet, inserted after the tabs bullet).
import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// SKILL: version + lesson 065
// ---------------------------------------------------------------------------
const SKILL = "ecommerce-store_SKILL.md";
let skill = readFileSync(SKILL, "utf8");
skill = skill.replace("version: 1.60.0", "version: 1.61.0");

const LESSON_065 =
  "| 065 | The search typeahead popover's row interaction states (SRCHROWS-STATES-1, session-61) — the sweep's nineteenth installment; the superset's own deep states (the reference has NO typeahead popover — the audit bar is the app's own vocabulary + the WAI-ARIA combobox pattern). THREE findings: the a11y semantics (FINDING 1: the visible listbox was invisible to AT — no combobox/listbox/option roles, no aria-expanded/controls/autocomplete/activedescendant/selected), the keyboard model (FINDING 2: no arrow-key navigation — the arrows did nothing, Enter always submitted the query), the money seam (FINDING 3: the only storefront price outside formatCents — output byte-identical, hygiene + mutation exposure). THE FIX SHAPE: additive ARIA + an activeSlug state machine (wrap-around, entry-from-top LAST, the query-change reset, the Enter intercept preserving the no-active submit contract byte-identically, the accent bg — the hover's own token) + formatCents; the rows stay raw buttons (the Tab path + the global outline register untouched). THE ROUND'S LESSONS: L92 (THE RATE-LIMIT FILE-ORDER TRAP — a spec sharing a rate-limited endpoint with a BURST spec must sort BEFORE the burst's file: srch-behavior's LAST test deliberately exhausts the 60/min /api/search budget with a 70-request 429 loop, so any spec sorting after it inherits a poisoned bucket and 429s every request for up to 60s; NAME the spec to sort before the burst file (ASCII \"srch-a…\" < \"srch-behavior\") — the same discipline searchpanel-states already documents — and count the family's own requests against the budget); L93 (THE CLI FILE-ARG REGEX GOTCHA — Playwright's CLI file arguments are REGEXES matched against full test IDs: bare \"cart.spec.ts\" ALSO matches \"guest-cart.spec.ts\" and \"checkout.spec.ts\" ALSO matches \"guest-checkout.spec.ts\" (substring containment), silently double-running those files in a FILE-list invocation; the invocation sums then exceed --list's census by exactly the double-matched tests (5 here) — use FULL PATHS (tests/e2e/cart.spec.ts) for exact group counting, and reconcile any count discrepancy against `playwright test --list` before declaring a baseline shift); L94 (THE VIEWPORT-DERIVED GEOMETRY PIN — a probe's measured width is a function of ITS viewport: the 1024-viewport probe measured the popover at 992 wide, but the E2E Desktop-Chrome default is 1280 → 1248 (and the @375 ROW is 341 — the container's 343 minus the 2px borders); calibrate geometry pins against the E2E config's viewport, or measure at that viewport before writing the pin). The honest-RED form: EIGHT calibrated REDs (P1/P4 the ARIA census halves; P6/P7/P8/P9/P13 the arrow family; P14's arrow half) + SIX GREEN guards (the anatomy/hover/Tab-outline/Enter-without-active/click/Escape axes) — one instrument iteration during calibration (the P5 text-content slice cut the product name one char short of the assert's substring). 851-test gate (356 unit + 495 E2E × 2 consecutive); the mobile-nav token-exact; sweep at baseline byte-identical BOTH pre- and post-change (the fixes are typing-only surfaces); watches + census clean; VLM 5/5 (316-320) — see docs/remediation-plan-session61.md |\n";

skill = skill.replace(
  "— see docs/remediation-plan-session60.md |\n",
  "— see docs/remediation-plan-session60.md |\n" + LESSON_065,
);
writeFileSync(SKILL, skill);
console.log("SKILL updated: v1.61.0 + lesson 065 (L92/L93/L94)");

// ---------------------------------------------------------------------------
// AGENTS.md: the search-rows family bullet after the tabs bullet
// ---------------------------------------------------------------------------
const AGENTS = "AGENTS.md";
let agents = readFileSync(AGENTS, "utf8");

const SRCH_BULLET =
  "- **The search typeahead popover's row interaction states are the E2E-pinned superset contract (session-61, SRCHROWS-STATES-1 — the sweep's nineteenth installment, the thrice-deferred standing next).** The superset's own deep states — the reference has NO typeahead popover (established sessions 8/46/58), so the audit bar is the app's OWN token vocabulary + the WAI-ARIA combobox pattern. THREE fixes, all in `search-bar.tsx`: (1) **the ARIA census** — the input's `role=\"combobox\"` + `aria-expanded` + `aria-controls=\"search-suggestions\"` + `aria-autocomplete=\"list\"` + `aria-activedescendant` (while a row is active); the container's CONDITIONAL `role=\"listbox\"` (only with rows — never an empty listbox during the loading-only frame) + `id` + `aria-label` + `aria-busy`; the rows' `role=\"option\"` + `id={`srch-opt-${slug}`}` + `aria-selected`; (2) **the arrow-key active-row state machine** — `activeSlug` with wrap-around + the entry-from-top LAST standard, cleared on EVERY query change (the stale-highlight guard), the Enter intercept (an active row → the PDP; NO active row → the query submit — srch-behavior P6's contract byte-identical), the active row painting the SAME accent bg as the hover, `preventDefault` on the arrows (the caret does not jump), `scrollIntoView({block:\"nearest\"})`; (3) **the money seam** — `formatCents` at the price span (the only storefront price outside money.ts). The rows stay raw `<button>`s: the Tab path and its global-outline register (auto 1px ring/50 — the r59 heart-icon family) are untouched. **The file-order discipline (L92):** the spec is NAMED `srch-activerow-states` (ASCII \"srch-a…\" < \"srch-behavior\") so its ~13 typeahead requests draw from the FRESH 60/min budget BEFORE srch-behavior's P11 429 burst — do NOT rename it to sort after srch-behavior. Pinned by `tests/e2e/srch-activerow-states.spec.ts` (14 pins — the honest-RED form with EIGHT REDs: the ARIA census halves, the arrow family, the query-change reset, the @375 arrow half; SIX GREEN guards: the row anatomy + the formatCents output, the hover accent pair, the Tab-path outline register, the Enter-without-active submit, the click path, the Escape path) — octuple-mutation-proven (M1 the container role/id → exactly P1; M2 the rows' option semantics → P6+P7+P8+P13+P14; M3 the arrow handler → the full arrow family; M4 the active paint → P6+P14; M5 the Enter intercept → exactly P9; M6 the reset → exactly P13; M7 the price math → exactly P2; M8 the input census → exactly P4).\n";

agents = agents.replace(
  "M8 the mt-6 dropped → P4).\n",
  "M8 the mt-6 dropped → P4).\n" + SRCH_BULLET,
);
writeFileSync(AGENTS, agents);
console.log("AGENTS.md updated: the search-rows family bullet");

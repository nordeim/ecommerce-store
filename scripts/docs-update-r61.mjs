// Round-61 docs update, part 1: the PAD (the v1.61 revision row, the §3.2
// tree 38 specs + the spec list, the §8.1 family row + the Total 61/851,
// the §8.4 checklist), the drift-watch verifier recalibration 37→38, and
// the CLAUDE.md/README.md count rows.
import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// PAD
// ---------------------------------------------------------------------------
const PAD = "Project_Architecture_Document.md";
let pad = readFileSync(PAD, "utf8");

const REV_ROW =
  "| 1.61 | 2026-10-15 | Review agent (Super Z) | [REM] | Session-61 (Round 61) — SRCHROWS-STATES-1: the search typeahead popover's row interaction states — the customer-surfaces pin-density sweep's nineteenth installment (the thrice-deferred standing next from r58/r59/r60; the superset's own deep states: the reference has NO typeahead popover, so the audit bar is the app's OWN token vocabulary + the WAI-ARIA combobox pattern). THREE findings, all clone-internal quality gaps: FINDING 1 (THE HEADLINE — the a11y semantics): the popover carried ZERO combobox/listbox semantics — the input had no role=combobox/aria-expanded/aria-controls/aria-autocomplete/aria-activedescendant, the container no role=listbox/id, the rows no role=option/aria-selected — the visible listbox was invisible to assistive tech. FINDING 2 (the keyboard model): NO arrow-key navigation (ArrowDown/ArrowUp did nothing, measured live); Enter always submitted the query — a high-end typeahead moves an ACTIVE row with the arrows (wrap-around; the entry-from-top = LAST), and Enter commits the active row. FINDING 3 (the money seam): the popover's price was the ONLY storefront price rendered outside formatCents (an inline (s.price/100).toFixed(2) at search-bar.tsx:242) — the output byte-identical, a hygiene divergence with mutation exposure. The fixes (all in search-bar.tsx): the WAI-ARIA combobox census (the input's five attributes; the container's CONDITIONAL role=listbox — never an empty listbox during the loading-only frame — + id=search-suggestions + aria-label + aria-busy; the rows' role=option + id srch-opt-<slug> + aria-selected); the arrow-key active-row state machine (activeSlug cleared on every query change — the stale-highlight guard; preventDefault keeps the caret from jumping; the Enter intercept: an active row → the PDP, NO active row → the query submit — srch-behavior P6's contract preserved byte-identical; the active row paints the SAME accent bg as the hover — the app's own vocabulary; scrollIntoView nearest as the future-proof guard); formatCents at the price span. The rows stay raw <button>s — the Tab path and its global-outline register (auto 1px ring/50, the r59 heart-icon family) are untouched. THE SPEC: tests/e2e/srch-activerow-states.spec.ts (14 pins, the honest-RED form — EIGHT calibrated REDs: P1 the container's listbox role/id/aria-label; P4 the input's combobox census; P6 THE HEADLINE (ArrowDown activates the first row — the accent bg + aria-selected + aria-activedescendant); P7 the movement + the wrap; P8 the entry-from-top; P9 the Enter commit; P13 the query-change reset; P14's arrow half — plus SIX GREEN guards: P2 the row anatomy + the formatCents output, P3 the hover accent pair, P5 the Tab-path outline register, P10 the Enter-without-active query submit (the srch-behavior P6 guard), P11 the click path, P12 the Escape path). THE FILE-ORDER DISCIPLINE (the round's planning discovery): /api/search is rate-limited 60/min/IP and srch-behavior's P11 (LAST) EXHAUSTS the budget with a 70-request 429 burst — the spec is NAMED srch-activerow-states (ASCII \"srch-a…\" < \"srch-behavior\") so it draws its ~13 typeahead requests from the FRESH budget BEFORE the burst; a spec sorting after srch-behavior would inherit a poisoned bucket and 429 every request. OCTUPLE-mutation-proven (M1 the container role/id dropped → exactly P1; M2 the rows' option semantics dropped → P6+P7+P8+P13+P14; M3 the arrow handler killed → the full arrow family P6-P9+P13+P14; M4 the active paint dropped → P6+P14; M5 the Enter intercept broken → exactly P9; M6 the query-change reset dropped → exactly P13; M7 the price math broken → exactly P2 — the FINDING 3 guard's teeth; M8 the input's combobox census dropped → exactly P4; each on the REBUILT artifact, byte-exact reverts md5-verified). 851-test gate (356 unit + 495 E2E × 2 consecutive runs, each as four FILE-list invocations under the 600s cap — srch-activerow-states joined the s–z group at 13 files; the invocation sums reconciled against --list's 481+14=495 chromium census — the CLI's FILE-ARG REGEX gotcha documented: bare \"cart.spec.ts\" also matches guest-cart.spec.ts, bare \"checkout.spec.ts\" matches guest-checkout.spec.ts — full paths for exact counting); the mobile-nav token-exact verification; sweep at baseline byte-identical BOTH pre-change and post-change (the fixes are popover-internal — computed-only while typing ≥2 chars); watches + census clean; VLM 5/5 (316-320, probe-first on :3001, the active row's accent bg + aria-selected verified live at capture); the workspace FRESH-CLONE round (the parent-injection shadow trap converged via the hard-link DB at inode 566449) — see docs/remediation-plan-session61.md |Document (PAD) v1.61\n";

pad = pad.replace("| 1.60 | 2026-10-15 | Review agent (Super Z) | [REM] |", REV_ROW + "| 1.60 | 2026-10-15 | Review agent (Super Z) | [REM] |");

// §3.2: 37 → 38 specs + the spec list gains srch-activerow-states
pad = pad.replace(
  "│   └── e2e/                     ← 37 specs + auth.setup + global-setup + helpers",
  "│   └── e2e/                     ← 38 specs + auth.setup + global-setup + helpers",
);
pad = pad.replace(
  "searchpanel-states, quickadd-states, pdptabs-states)",
  "searchpanel-states, quickadd-states, pdptabs-states, srch-activerow-states)",
);

// §8.1: the family row + the Total row
const FAMILY_ROW =
  "| E2E — search typeahead popover row interaction states (session-61, SRCHROWS-STATES-1 — the pin-density sweep's nineteenth installment; the superset's own deep states — the reference has NO typeahead popover, so the audit bar is the app's own vocabulary + the WAI-ARIA combobox pattern). THREE fixes, all in search-bar.tsx: (1) THE ARIA CENSUS — the input's role=combobox + aria-expanded + aria-controls + aria-autocomplete=list + aria-activedescendant; the container's CONDITIONAL role=listbox (only with rows — never an empty listbox during the loading-only frame) + id=search-suggestions + aria-label + aria-busy; the rows' role=option + id + aria-selected; (2) THE ARROW-KEY ACTIVE-ROW STATE MACHINE — activeSlug with wrap-around + the entry-from-top LAST standard + the query-change reset (the stale-highlight guard) + the Enter intercept (an active row → the PDP; NO active row → the query submit, srch-behavior P6 byte-identical) + the accent bg paint (the hover's own token) + scrollIntoView-nearest; (3) THE MONEY SEAM — formatCents at the price span (the only storefront price outside the seam). The rows stay raw buttons: the Tab path + the global outline register untouched (P5's pin). The 14 pins: P1 the container anatomy + listbox semantics; P2 the row anatomy + the formatCents output; P3 the hover accent pair; P4 the input's combobox census; P5 the Tab-path outline register; P6 THE HEADLINE (ArrowDown → the first row active: the accent bg + aria-selected + activedescendant); P7 the movement + the wrap; P8 the entry-from-top; P9 the Enter commit; P10 the Enter-without-active guard; P11 the click path; P12 the Escape path; P13 the query-change reset; P14 the @375 pass. OCTUPLE-mutation-proven. Named srch-activerow-states.spec.ts so it sorts BEFORE srch-behavior in ASCII (the /api/search rate-limit budget: srch-behavior's LAST test exhausts it with a 429 burst — the fresh-budget discipline searchpanel-states documents)) | 1 | 14 | `tests/e2e/srch-activerow-states.spec.ts` | Playwright |\n";

pad = pad.replace(
  "| **Total** | **60** | **837** | 356 Vitest (23 files) + 481 Playwright (37 spec files",
  FAMILY_ROW + "| **Total** | **61** | **851** | 356 Vitest (23 files) + 495 Playwright (38 spec files",
);

// §8.4: the checklist
pad = pad.replace(
  "5. `bun run test:e2e` — 481/481 (after a fresh build; 481 spec tests across 37 files + the setup login per invocation; run as four half-suite invocations under the 600s tooling cap)",
  "5. `bun run test:e2e` — 495/495 (after a fresh build; 495 spec tests across 38 files + the setup login per invocation; run as four half-suite invocations under the 600s tooling cap)",
);

writeFileSync(PAD, pad);
console.log("PAD updated: v1.61 revision row, §3.2 38 specs, §8.1 family+Total 61/851/356+495, §8.4 checklist 495/38");

// ---------------------------------------------------------------------------
// the drift-watch verifier recalibration 37 → 38
// ---------------------------------------------------------------------------
const VER = "scripts/verify-docs-align-r40.mjs";
let ver = readFileSync(VER, "utf8");
ver = ver.replace(
  "const specCountLine = /37 specs|37 spec/.test(treeBlock);",
  "const specCountLine = /38 specs|38 spec/.test(treeBlock);",
);
ver = ver.replace("e2eSpecs.length === 37", "e2eSpecs.length === 38");
writeFileSync(VER, ver);
console.log("verifier recalibrated 37 -> 38");

// ---------------------------------------------------------------------------
// CLAUDE.md — the test-count row
// ---------------------------------------------------------------------------
const CLAUDE = "CLAUDE.md";
let claude = readFileSync(CLAUDE, "utf8");
claude = claude.replace(
  "| `bun run test:e2e` | Playwright E2E (481 tests incl. the setup login + the tabs interaction family (session-60, PDPTABS-STATES-1:",
  "| `bun run test:e2e` | Playwright E2E (495 tests incl. the setup login + the search typeahead popover's row interaction states (session-61, SRCHROWS-STATES-1: the sweep's nineteenth installment — the WAI-ARIA combobox census (the input's role=combobox/aria-expanded/aria-controls/aria-autocomplete/aria-activedescendant, the conditional listbox, the rows' option/aria-selected), the arrow-key active-row state machine (wrap-around, the entry-from-top LAST, the Enter-on-active commit, the query-change reset, the accent bg paint), the formatCents money-seam rejoin; 14 pins, octuple-mutation-proven, the file-order rate-limit discipline) + the tabs interaction family (session-60, PDPTABS-STATES-1:",
);
writeFileSync(CLAUDE, claude);
console.log("CLAUDE.md updated: the e2e row 495 tests + the session-61 family");

// ---------------------------------------------------------------------------
// README.md — the count rows
// ---------------------------------------------------------------------------
const README = "README.md";
let readme = readFileSync(README, "utf8");
readme = readme.replace("🧪 **837 automated tests**", "🧪 **851 automated tests**");
readme = readme.replace(
  "│   ├── 📂 e2e/                    ← 37 spec files (481 tests) + auth.setup login (once per invocation — four half-suite invocations under the 600s tooling cap) + global-setup/helpers",
  "│   ├── 📂 e2e/                    ← 38 spec files (495 tests) + auth.setup login (once per invocation — four half-suite invocations under the 600s tooling cap) + global-setup/helpers",
);
readme = readme.replace(
  "| E2E (Playwright) | `bun run test:e2e` | 481 | **pdptabs-states (session-60, PDPTABS-STATES-1:",
  "| E2E (Playwright) | `bun run test:e2e` | 495 | **srch-activerow-states (session-61, SRCHROWS-STATES-1: the typeahead popover's row interaction states — the sweep's nineteenth installment; the WAI-ARIA combobox census + the arrow-key active-row state machine (the wrap-around, the entry-from-top, the Enter-on-active commit, the query-change reset, the accent paint) + the formatCents seam rejoin; 14 pins, octuple-mutation-proven, the file-order rate-limit discipline) + pdptabs-states (session-60, PDPTABS-STATES-1:",
);
writeFileSync(README, readme);
console.log("README.md updated: 851 automated tests, 38 spec files (495 tests), the e2e row");

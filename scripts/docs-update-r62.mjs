// Round-62 docs update, part 1: the PAD (the v1.62 revision row, the §3.2
// tree 39 specs + the spec list, the §8.1 family row + the Total 62/865,
// the §8.4 checklist), the drift-watch verifier recalibration 38→39, and
// the CLAUDE.md/README.md count rows.
import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// PAD
// ---------------------------------------------------------------------------
const PAD = "Project_Architecture_Document.md";
let pad = readFileSync(PAD, "utf8");

const REV_ROW =
  "| 1.62 | 2026-10-15 | Review agent (Super Z) | [REM] | Session-62 (Round 62) — PDPFEATURES-STATES-1: the PDP description-tab key-features list — the customer-surfaces pin-density sweep's TWENTIETH installment (session-121/122's standing suggested next; the r60 note's alternate). THE CLOSURE FORM (the r54/r57/r59 precedent): the paired audit (four probes — pdpfeatures-ref-r62a/a2 on the live reference, pdpfeatures-clone-r62b/b2/b3 on the clone) measured all TWELVE axes of the surface (the h3's class/computed set; the ul's container contract; the li rows' anatomy; the lucide check icon — class/size/color/stroke/display; the 4 seeded feature texts; the inter-row spacing; the interactivity census; the a11y census; the parent wrapper; the tabpanel association; the description paragraph; the @375 geometry) and found ZERO DIVERGENCE — the sweep's SEVENTH fully-parity family, NO production change (src/ untouched). THREE REGISTERS documented: (1) THE MARGIN-SIDE ENGINE REGISTER (trap 8's family, a new face) — v3 space-y-2 emits margin-TOP on FOLLOWING rows, v4 emits margin-block-END on preceding non-last rows; on this surface the paint is byte-identical (the row y-positions and the 120px height measured identical) — judge by the rects, pin the SPACING (the y-deltas), never the margin side; (2) THE ILLUSTRATIVE-ICON A11Y SUPERSET — the reference's lucide svg carries NO aria-hidden (an unlabeled graphic exposed to AT) while the clone's lucide-react adds aria-hidden=true (the decorative icon correctly hidden) — the clone's form is the WCAG-correct one, kept and pinned; (3) THE DEAD-PROSE-CLASS REGISTER — BOTH sites carry prose prose-sm max-w-none on the wrapper and NEITHER emits any prose CSS (no typography plugin either side); the classes are dead DOM parity — do not \"clean\" them. THE SPEC: tests/e2e/pdpfeatures-states.spec.ts (14 pins, all GREEN against the current artifact — the characterization/closure form; the honest-RED step is vacuous with zero production change): P1 the h3 (the exact class string + the 18px/600 computed set + the 16/8 margin rhythm); P2 the ul (space-y-2, 4 rows, list-style none, the 120px height); P3 the row anatomy (the exact class, the flex set, the muted 16px/400/24px, the direct TEXT_NODE shape); P4 the icon (lucide lucide-check h-4 w-4 text-primary, 16px, rgb(230,107,26), stroke 2, viewBox 0 0 24 24, display block, aria-hidden true — the superset register); P5 the 4 feature texts in order; P6 the 32px row pitch pinned by the rects (the engine register's discipline); P7 the interactivity census (0 interactive descendants, cursor auto, the inert all/0s transition calibrated live on both sites); P8 the a11y census (the native UL/LI semantics, NO explicit roles — the reference's exact census); P9 the parent wrapper class string (the dead-prose DOM parity); P10 the tabpanel association (role=tabpanel + data-state=active + aria-labelledby = the Description trigger's id — the RELATIONSHIP, never the literal Radix prefix); P11 the description paragraph (the muted 16px/26px, margin 0); P12 the vertical rhythm (the 16px paragraph→h3 gap + the 8px h3→list gap); P13 the @375 pass (343-wide column, the same 28/120/24 heights); P14 the tab coupling (the Reviews swap unmounts the list; Description restores it). OCTUPLE-mutation-proven on the REBUILT artifact (M1 the h3 margins dropped → exactly P1+P12; M2 space-y-2→space-y-4 → P2+P6+P13+P14; M3 the li gap-2 dropped → exactly P3; M4 the icon text-primary dropped → exactly P4; M5 h-4 w-4→h-5 w-5 → P4+P13; M6 the li text-muted-foreground dropped → exactly P3; M7 the h3 text changed → ALL 14 pins (the shared h3-text anchor — maximally loud, fast-failing); M8 the wrapper prose classes dropped → exactly P9; byte-exact reverts md5-verified). 865-test gate (356 unit + 509 E2E × 2 consecutive runs, each as four FULL-PATH FILE-list invocations under the 600s cap — pdpfeatures-states joined the n–q group at 7 files/95 chromium; the counted total 865 = 356 + 509); the mobile-nav token-exact (the 80th run); sweep at baseline byte-identical BOTH pre-change and post-change (zero production code touched); watches + census clean; VLM 5/5 (321-325, probe-first on :3001 — one description-side settle: the 322 anatomy crop's paragraph-tail headroom 20px→56px, the pixel measurement settled the icon presence first); the PULL round (git pull fast-forwarded 2b9aa6a..9123592, docs only) — see docs/remediation-plan-session62.md |Document (PAD) v1.62\n";

pad = pad.replace("| 1.61 | 2026-10-15 | Review agent (Super Z) | [REM] |", REV_ROW + "| 1.61 | 2026-10-15 | Review agent (Super Z) | [REM] |");

// §3.2: 38 → 39 specs + the spec list gains pdpfeatures-states
pad = pad.replace(
  "│   └── e2e/                     ← 38 specs + auth.setup + global-setup + helpers",
  "│   └── e2e/                     ← 39 specs + auth.setup + global-setup + helpers",
);
pad = pad.replace(
  "searchpanel-states, quickadd-states, pdptabs-states, srch-activerow-states)",
  "searchpanel-states, quickadd-states, pdpfeatures-states, pdptabs-states, srch-activerow-states)",
);

// §8.1: the family row + the Total row
const FAMILY_ROW =
  "| E2E — PDP description-tab key-features list states (session-62, PDPFEATURES-STATES-1 — the pin-density sweep's twentieth installment; the closure form: the paired four-probe audit measured all twelve axes and found ZERO DIVERGENCE — the sweep's SEVENTH fully-parity family, NO production change). The 14 pins characterize the parity contract: P1 the h3 (the exact class `text-lg font-semibold mt-4 mb-2` + the 18px/600 set + the 16/8 rhythm); P2 the ul (`space-y-2`, 4 rows, list-style none, 120px); P3 the row anatomy (`flex items-center gap-2 text-muted-foreground`, the muted 16px/400/24px, the direct text-node shape); P4 the icon (lucide check `h-4 w-4 text-primary`, 16px, rgb(230,107,26), stroke 2, display block, aria-hidden true — the SUPERSET register: the reference's svg is exposed to AT, the clone's lucide-react hides the decorative icon); P5 the 4 feature texts in order; P6 the 32px row pitch BY THE RECTS (the margin-side engine register: v3 margin-top-on-following vs v4 margin-block-end-on-preceding — the same paint; pin the spacing, never the margin side); P7 the interactivity census (0 interactive descendants, cursor auto, the inert all/0s transition); P8 the a11y census (the native UL/LI, NO explicit roles — the reference's exact census); P9 the parent wrapper `prose prose-sm max-w-none` (the DEAD-CLASS register: both sites carry the classes, neither emits prose CSS — do not clean them); P10 the tabpanel association (the aria-labelledby RELATIONSHIP, never the literal Radix prefix); P11 the description paragraph; P12 the vertical rhythm (16px + 8px gaps); P13 the @375 pass (343-wide, the same heights); P14 the tab coupling (the Reviews swap unmounts the list). OCTUPLE-mutation-proven (M7 the h3-text change caught by ALL 14 pins — the shared-anchor fast-fail discipline). The spec's evaluate anchors are the page-level no-arg function form (the in-function h3 finder throws fast when the surface is missing — a text mutation fails in seconds, not 45s-per-pin locator waits) | 1 | 14 | `tests/e2e/pdpfeatures-states.spec.ts` | Playwright |\n";

pad = pad.replace(
  "| **Total** | **61** | **851** | 356 Vitest (23 files) + 495 Playwright (38 spec files",
  FAMILY_ROW + "| **Total** | **62** | **865** | 356 Vitest (23 files) + 509 Playwright (39 spec files",
);

// §8.4: the checklist
pad = pad.replace(
  "5. `bun run test:e2e` — 495/495 (after a fresh build; 495 spec tests across 38 files + the setup login per invocation; run as four half-suite invocations under the 600s tooling cap)",
  "5. `bun run test:e2e` — 509/509 (after a fresh build; 509 spec tests across 39 files + the setup login per invocation; run as four half-suite invocations under the 600s tooling cap)",
);

writeFileSync(PAD, pad);
console.log("PAD updated: v1.62 revision row, §3.2 39 specs, §8.1 family+Total 62/865/356+509, §8.4 checklist 509/39");

// ---------------------------------------------------------------------------
// the drift-watch verifier recalibration 38 → 39
// ---------------------------------------------------------------------------
const VER = "scripts/verify-docs-align-r40.mjs";
let ver = readFileSync(VER, "utf8");
ver = ver.replace(
  "const specCountLine = /38 specs|38 spec/.test(treeBlock);",
  "const specCountLine = /39 specs|39 spec/.test(treeBlock);",
);
ver = ver.replace("e2eSpecs.length === 38", "e2eSpecs.length === 39");
writeFileSync(VER, ver);
console.log("verifier recalibrated 38 -> 39");

// ---------------------------------------------------------------------------
// CLAUDE.md — the test-count row
// ---------------------------------------------------------------------------
const CLAUDE = "CLAUDE.md";
let claude = readFileSync(CLAUDE, "utf8");
claude = claude.replace(
  "| `bun run test:e2e` | Playwright E2E (495 tests incl. the setup login + the search typeahead popover's row interaction states (session-61, SRCHROWS-STATES-1:",
  "| `bun run test:e2e` | Playwright E2E (509 tests incl. the setup login + the PDP description-tab key-features list states (session-62, PDPFEATURES-STATES-1: the sweep's twentieth installment, the closure form — the sweep's SEVENTH fully-parity family, zero production change; 14 characterization pins (the h3/ul/li anatomy, the lucide check icon, the 4 texts, the 32px pitch by rects, the interactivity + a11y censuses, the dead-prose wrapper, the tabpanel association, the @375 pass, the tab coupling), octuple-mutation-proven) + the search typeahead popover's row interaction states (session-61, SRCHROWS-STATES-1:",
);
writeFileSync(CLAUDE, claude);
console.log("CLAUDE.md updated: the e2e row 509 tests + the session-62 family");

// ---------------------------------------------------------------------------
// README.md — the count rows
// ---------------------------------------------------------------------------
const README = "README.md";
let readme = readFileSync(README, "utf8");
readme = readme.replace("🧪 **851 automated tests**", "🧪 **865 automated tests**");
readme = readme.replace(
  "│   ├── 📂 e2e/                    ← 38 spec files (495 tests) + auth.setup login (once per invocation — four half-suite invocations under the 600s tooling cap) + global-setup/helpers",
  "│   ├── 📂 e2e/                    ← 39 spec files (509 tests) + auth.setup login (once per invocation — four half-suite invocations under the 600s tooling cap) + global-setup/helpers",
);
readme = readme.replace(
  "| E2E (Playwright) | `bun run test:e2e` | 495 | **srch-activerow-states (session-61, SRCHROWS-STATES-1:",
  "| E2E (Playwright) | `bun run test:e2e` | 509 | **pdpfeatures-states (session-62, PDPFEATURES-STATES-1: the PDP description-tab key-features list — the sweep's twentieth installment, the closure form; the sweep's SEVENTH fully-parity family (zero divergence across twelve axes, no production change); 14 characterization pins + the octuple mutation battery) + srch-activerow-states (session-61, SRCHROWS-STATES-1:",
);
writeFileSync(README, readme);
console.log("README.md updated: 865 automated tests, 39 spec files (509 tests), the e2e row");

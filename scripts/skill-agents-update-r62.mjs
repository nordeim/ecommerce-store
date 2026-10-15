// Round-62 docs update, part 2: the SKILL v1.62.0 (lesson 066) + the
// AGENTS.md family bullet (the key-features closure).
import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// SKILL.md — version 1.62.0 + lesson 066
// ---------------------------------------------------------------------------
const SKILL = "ecommerce-store_SKILL.md";
let skill = readFileSync(SKILL, "utf8");

skill = skill.replace("version: 1.61.0", "version: 1.62.0");
skill = skill.replace('last_updated: "2026-10-14"', 'last_updated: "2026-10-15"');

const LESSON =
  "| 066 | The PDP description-tab key-features list states (PDPFEATURES-STATES-1, session-62) — the sweep's twentieth installment; THE CLOSURE FORM (the r54/r57/r59 precedent): the paired four-probe audit measured all twelve axes of the surface and found ZERO DIVERGENCE — the sweep's SEVENTH fully-parity family, NO production change; the deliverable is the characterization pin spec (all 14 pins GREEN against the current artifact) + the octuple mutation battery as the teeth proof. THE ROUND'S LESSONS: L95 (THE SVG-CLASSNAME SERIALIZATION TRAP — an svg element's `className` property is an SVGAnimatedString object; `(el.className || \"\").toString()` yields \"[object SVGAnimatedString]\" and silently erases the class-string axis; read svg classes via `getAttribute(\"class\")` — or getAttributeNames() — never the className property); L96 (THE MARGIN-SIDE ENGINE REGISTER, trap 8's family in a new face — v3's space-y-N emits margin-TOP on FOLLOWING siblings (`> :not([hidden]) ~ :not([hidden])`), v4 emits margin-block-END on the NON-LAST child (`:where(.space-y-N > :not(:last-child))`); on a plain block list the two spellings paint IDENTICALLY (the same inter-row gaps, the same total height — measured byte-identical row positions both engines); when diffing a v3 reference against a v4 port, margin reads may differ in SIDE while the paint is identical — judge by the rects and pin the SPACING (the y-deltas), never the margin property; the same-paint-different-notation family as the lab()/rgba() serialization and the radius-scale pins); L97 (THE LOCATOR-EVALUATE WAIT TRAP + THE FAST-FAIL ANCHOR — a locator-form `locator.evaluate()` AUTO-WAITS for the element up to the test timeout: a mutation that removes/renames the anchor element makes EVERY pin wait the full 45s (12 pins ≈ 9 minutes of battery time, and a 10-minute tool window dies mid-restore leaving a mutated build + a contaminated pristine backup — the trap that cost this round two recovery cycles); the fix: the page-level no-arg function form `page.evaluate(() => { find-the-anchor-in-page; if (!found) throw })` runs IMMEDIATELY and fails in seconds — and the mutation runner must kill the E2E port BEFORE the rebuild (playwright's reuseExistingServer keeps a :3100 server alive between invocations, and the rebuild swaps the chunks under the running process — the next login renders the platform error page and the setup dies at its 45s waitForURL); ALSO: a tool-timeout kill mid-mutation-runner leaves the mutation applied and the NEXT invocation's pristine backup captures the MUTATED source — always verify the worktree is clean (git diff) before re-running a mutation battery, and restore from git HEAD, not from a possibly-contaminated /tmp backup). THE HONEST-PIN CALIBRATION: the P7 transition expectation was written from an unverified assumption (\"none\") and failed — the measured value is all/0s on BOTH sites (the engines' universal inert transition); calibrate every computed-style expectation against a live measurement on BOTH sides before pinning, especially the axes you think are trivial. VLM settle discipline (the r53-r61 form held): the 322 anatomy-crop FAIL was description-side (the 20px headroom held only 4px of the paragraph tail — invisible); the PIXEL MEASUREMENT settled the dispute first (24 orange samples at the icon positions — the icons ARE present), then the crop was re-taken with 56px headroom — describe the crop as it IS, and measure before re-describing. 865-test gate (356 unit + 509 E2E × 2 consecutive, pdpfeatures-states joins the n–q group at 7 files); the mobile-nav token-exact (80th run); sweep at baseline byte-identical pre- AND post-change (zero production code touched); watches + census clean; VLM 5/5 (321-325, one settle) — see docs/remediation-plan-session62.md |\n";

skill = skill.replace(
  "| 065 | The search typeahead popover's row interaction states",
  LESSON + "| 065 | The search typeahead popover's row interaction states",
);
writeFileSync(SKILL, skill);
console.log("SKILL updated: v1.62.0 + lesson 066 (L95/L96/L97)");

// ---------------------------------------------------------------------------
// AGENTS.md — the family bullet (after the session-61 bullet)
// ---------------------------------------------------------------------------
const AGENTS = "AGENTS.md";
let agents = readFileSync(AGENTS, "utf8");

const BULLET = `- **The PDP description-tab's key-features list states are the E2E-pinned parity contract (session-62, PDPFEATURES-STATES-1 — the sweep's twentieth installment; the closure form).** The paired four-probe audit (the live reference + the clone) measured all twelve axes of the surface — the h3, the ul, the li rows, the lucide check icon, the 4 texts, the spacing, the interactivity census, the a11y census, the parent wrapper, the tabpanel association, the paragraph, @375 — and found ZERO DIVERGENCE (the sweep's seventh fully-parity family; NO production change). Pinned by \`tests/e2e/pdpfeatures-states.spec.ts\` (14 characterization pins): the exact class strings (\`text-lg font-semibold mt-4 mb-2\` / \`space-y-2\` / \`flex items-center gap-2 text-muted-foreground\` / \`lucide lucide-check h-4 w-4 text-primary\`), the icon contract (16px, rgb(230,107,26), stroke 2, viewBox 0 0 24 24, display block, aria-hidden true — the SUPERSET register: the reference's icon is exposed to AT, the clone's lucide-react correctly hides the decorative one), the 32px row pitch BY THE RECTS (the MARGIN-SIDE ENGINE register: v3 space-y puts margin-top on following rows, v4 puts margin-block-end on preceding — the same paint; pin the spacing, never the margin side), the interactivity census (0 interactive descendants, cursor auto, the inert all/0s transition), the a11y census (the native UL/LI semantics, no explicit roles — the reference's exact census), the dead-prose wrapper (\`prose prose-sm max-w-none\` — BOTH sites carry the classes, NEITHER emits prose CSS; do not clean them), the tabpanel aria-labelledby RELATIONSHIP (never the literal Radix prefix), the vertical rhythm (16/8 gaps), @375 (343/28/120/24/16), and the tab coupling (the Reviews swap unmounts the list). Octuple-mutation-proven; the spec's evaluate anchors are the page-level fast-fail form (the in-function h3 finder — a surface-removing mutation fails in seconds, not 45s-per-pin locator waits).
`;

agents = agents.replace(
  "- **The search typeahead popover's row interaction states are the E2E-pinned superset contract (session-61, SRCHROWS-STATES-1",
  BULLET + "- **The search typeahead popover's row interaction states are the E2E-pinned superset contract (session-61, SRCHROWS-STATES-1",
);
writeFileSync(AGENTS, agents);
console.log("AGENTS.md updated: the key-features family bullet");

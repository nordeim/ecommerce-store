import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// AGENTS.md — the tabs family bullet (inserted after the r59 quick-add
// bullet, before the auth-parity contract bullet) + no count rows live in
// AGENTS.md (the counts live in README/CLAUDE/PAD)
// ---------------------------------------------------------------------------
const AG = "AGENTS.md";
let ag = readFileSync(AG, "utf8");

const TABS_BULLET = `- **The tabs interaction family is the E2E-pinned contract with THREE reference-measured fixes (session-60, PDPTABS-STATES-1 — the sweep's eighteenth installment).** ONE shared component (\`src/components/ui/tabs.tsx\`), TWO reference variants: the PDP form (NO \`overflow-x-auto\` on the list — computed overflow-x **visible**; NO \`gap-2\` on the text-only triggers — computed gap **normal**) and the ACCOUNT form (BOTH present — the gap-2 pairing with its lucide icons, the icon→text gap 8px measured live on both sides). The clone's ONE component carried the account variant's classes on both pages — the variant split landed (the base becomes the PDP form; the account consumer appends its extras via className, the merged strings byte-matching the reference's account variant). **THE CLICKED-TRIGGER RING (the headline fix):** the reference's tab trigger receives focus NATIVELY on mousedown (the instrumented mechanism probe — \`HTMLElement.prototype.focus\` patched on both sides: ZERO SCRIPT-FOCUS events on the reference; \`:focus-visible\` FALSE — NO ring on the clicked trigger), while the clone's \`@radix-ui/react-tabs\` ^1.1.12 script-focuses the trigger in its mousedown handler (the upstream line \`event.currentTarget.focus()\` — added for Safari's no-focus-on-mousedown) and Chrome MATCHES a script focus issued during a mousedown dispatch against \`:focus-visible\` → the trigger's \`focus-visible:ring-2\` utilities painted a 2px background + 4px orange halo around every CLICKED tab trigger (both surfaces). The fix: a **capture-phase mousedown guard** in ui/tabs.tsx (\`onMouseDownCapture\` → \`event.stopPropagation()\` for plain left-clicks): React's root-container capture dispatch runs BEFORE the native descent, so Radix's bubble-phase script-focus mousedown never runs, the browser's DEFAULT ACTION still focuses the trigger natively, and the activation lands via Radix's \`onFocus\` auto-activation — the reference's exact flow at the same mousedown instant (validated by the standalone DOM experiment; the keyboard/ctrl-click paths untouched by construction). **The roving quirk (shared, a register not a fix):** on a FRESH page all Radix tab triggers carry \`tabIndex: -1\` (no current stop until an interaction) — the tablist is SKIPPED by the Tab key on BOTH sites; a keyboard walk must first establish the current (a click), then blur, then walk. The two-sided focus truth: NO ring on CLICK, ring on KEYBOARD (the settled 2px+4px spreads), the outline settling TRANSPARENT on both (the session-55 invisible-outline register). The click's network: the reference's switch is client-state (0 requests); the clone's is the registered \`?_rsc=\` Link-prefetch superset (fired for the related-product cards by the click's scroll — NOT tab-driven; filter them from the count). Pinned by \`tests/e2e/pdptabs-states.spec.ts\` (14 pins: the computed anatomy, the variant class strings, the resting selection, the panel gap 24px, the hover no-change, the click swap + zero network, the no-ring-on-click headline, the roving tabindex, the script-focus auto-activation, the keyboard ring, the arrow navigation, the account variant regression pin, the account's no-ring, the @375 pass) — octuple-mutation-proven (M1 the guard dropped → exactly P7+P13; M2/M3 the base reverts → P1+P2 / P2; M4/M5 the account overrides dropped → P12; M6 the shadow dropped → P2+P3+P7+P13; M7 the bg dropped → P2+P3; M8 the mt-6 dropped → P4).
`;

ag = ag.replace(
  "- **Auth parity contract (ADR-010 + ADR-011).**",
  TABS_BULLET + "- **Auth parity contract (ADR-010 + ADR-011).**",
);

writeFileSync(AG, ag);
console.log("AGENTS.md updated: the tabs family bullet");

// ---------------------------------------------------------------------------
// README.md — the test-count rows (810 → 837, 36 spec files (467 tests) →
// 37 (481), the E2E table row's count + the family summary
// ---------------------------------------------------------------------------
const RM = "README.md";
let rm = readFileSync(RM, "utf8");

rm = rm.replace("| 🧪 **810 automated tests**", "| 🧪 **837 automated tests**");
rm = rm.replace(
  "│   ├── 📂 e2e/                    ← 36 spec files (467 tests) + auth.setup login",
  "│   ├── 📂 e2e/                    ← 37 spec files (481 tests) + auth.setup login",
);
rm = rm.replace(
  "| E2E (Playwright) | `bun run test:e2e` | 467 |",
  "| E2E (Playwright) | `bun run test:e2e` | 481 |",
);
// the E2E table row's family list gains the pdptabs entry (prepend to the
// quickadd-states summary)
rm = rm.replace(
  "| E2E (Playwright) | `bun run test:e2e` | 481 | **quickadd-states (session-59,",
  "| E2E (Playwright) | `bun run test:e2e` | 481 | **pdptabs-states (session-60, PDPTABS-STATES-1: the tabs interaction family — the sweep's eighteenth installment — THREE fixes: the CLICKED-TRIGGER ring (the reference's native mousedown focus paints NO ring; the clone's Radix 1.1.12 script-focus matched :focus-visible and painted a 2px+4px orange halo on every clicked tab trigger — fixed with the capture-phase mousedown guard in ui/tabs.tsx, the activation landing via Radix's onFocus auto-activation, the reference's exact flow) + the variant split (the PDP form loses overflow-x-auto/gap-2; the account form re-appends them — both variants byte-matching the reference); the two-sided focus truth pinned (no ring on CLICK, ring on KEYBOARD); the shared roving quirk documented (the fresh page's tablist is Tab-skipped on BOTH sites); 14 pins, octuple-mutation-proven)** + **quickadd-states (session-59,",
);

writeFileSync(RM, rm);
console.log("README.md updated: 837 tests, 37/481, the family row");

// ---------------------------------------------------------------------------
// CLAUDE.md — the E2E count row
// ---------------------------------------------------------------------------
const CM = "CLAUDE.md";
let cm = readFileSync(CM, "utf8");

cm = cm.replace(
  "| `bun run test` | Vitest unit + integration suite (356 tests) |",
  "| `bun run test` | Vitest unit + integration suite (356 tests) |",
);
cm = cm.replace(
  "| `bun run test:e2e` | Playwright E2E (467 tests incl. the setup login",
  "| `bun run test:e2e` | Playwright E2E (481 tests incl. the setup login + the tabs interaction family (session-60, PDPTABS-STATES-1: the clicked-trigger ring fix — the capture-phase mousedown guard restoring the reference's native-focus path; the PDP/account variant split; 14 pins, octuple-mutation-proven",
);

writeFileSync(CM, cm);
console.log("CLAUDE.md updated: the E2E count row");

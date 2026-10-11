// VLM verification of the 5 new session-41 screenshots (216-220) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round41.mjs's probes — the count
// lines, the date-input values, the row censuses, the canonical URL, and
// the mobile panel links all read from the rendered pages) BEFORE this
// run — the round-32..40 lesson: describe reality, not intention.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry; package.json + bun.lock
// are untouched (md5-recorded).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "216-orders-date-window.png",
    expect: "A FULL-PAGE screenshot of the LUXE admin Orders console (the superset operator surface) in the warm-orange theme, with the standard storefront header and footer: a '← Admin' back link, an 'Orders' heading, a filter bar (a white rounded card) containing a search input, a status Select reading 'All Statuses', and a date-range group with a calendar icon and TWO date inputs populated with '2026-03-01' and '2026-03-31' separated by a dash, plus a 'Clear' control; a count line reading exactly '2 orders'; then a list of exactly TWO order rows — ORD-2026-001 and ORD-2026-002 — each showing the order number as a link, the customer email, an item count, a date, a gray status pill, a dollar total, and a status dropdown on the right; NO other order rows (the February orders are excluded by the date window).",
  },
  {
    file: "217-orders-bar-closeup.png",
    expect: "A close-up element screenshot (retina 2x) of the LUXE admin Orders filter bar — a single white rounded card on a cream background containing, left to right: a search input with a magnifying-glass icon and the placeholder 'Search by order number or email...'; a Select control reading 'All Statuses'; a date-range group with a small calendar icon, a 'From' date input populated with the date March 1 2026, a dash, and a 'To' date input populated with the date March 31 2026 (the browser's native date input renders the locale form MM/DD/YYYY in en-US — '03/01/2026' and '03/31/2026'); and a 'Clear' button with an X icon. Warm-orange theme accents, no list rows in frame (the bar only).",
  },
  {
    file: "218-orders-calm-state.png",
    expect: "A FULL-PAGE screenshot of the LUXE admin Orders console in its CALM unfiltered state, warm-orange theme, standard storefront header and footer: a '← Admin' back link, an 'Orders' heading, the filter bar with EMPTY date inputs (no date chosen), 'All Statuses', and an empty search input with NO 'Clear' control; a count line reading exactly '4 orders'; then a list of exactly FOUR order rows in newest-first order — ORD-2026-001, ORD-2026-002, ORD-2026-004, ORD-2026-003 — each with the order number as a link, the customer email, an item count, a date, a gray status pill, a dollar total, and a status dropdown.",
  },
  {
    file: "219-orders-combined-filter.png",
    expect: "A FULL-PAGE screenshot of the LUXE admin Orders console with a COMBINED filter, warm-orange theme, standard storefront header and footer: a '← Admin' back link, an 'Orders' heading, the filter bar with the status Select reading 'Delivered', the From date input populated with '2026-03-01' and the To date input EMPTY; a count line reading exactly '1 order'; then a list of exactly ONE order row — ORD-2026-001 — with the number as a link, the customer email, an item count, a date, a gray 'Delivered' pill, a dollar total, and a status dropdown; NO other order rows (the composition excludes them).",
  },
  {
    file: "220-mobile-nav-open.png",
    expect: "A MOBILE screenshot (iPhone-class narrow viewport ~390px) of the LUXE storefront with the mobile navigation menu OPEN: a left-side slide-in panel roughly 288px wide with a warm cream background (rgb(251,250,249)) covering about three-quarters of the screen, listing exactly FIVE navigation links stacked vertically — Home, Shop, Electronics, Clothing, Accessories — each on its own row at ~18px font size; to the panel's right, a dark semi-transparent overlay dimming the underlying home page (hero photo visible through it).",
  },
];

let pass = 0;
for (const c of checks) {
  const b64 = readFileSync(`${OUT}/${c.file}`).toString("base64");
  let ans = "";
  for (let attempt = 1; attempt <= 4 && !ans; attempt++) {
    try {
      const r = await zai.chat.completions.createVision({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Does this screenshot match this description? Answer PASS or FAIL plus one sentence.\n\n${c.expect}` },
              { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
            ],
          },
        ],
      });
      ans = r.choices[0]?.message?.content ?? "";
    } catch (e) {
      console.error(`  (attempt ${attempt} failed: ${String(e).slice(0, 90)})`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  const ok = /^PASS/i.test(ans);
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.file}${ans ? " — " + ans.split("\n")[0].slice(0, 140) : " — (no answer)"}`);
  if (ok) pass += 1;
}
console.log(`\nVLM: ${pass}/5 ${pass === 5 ? "PASS" : "FAIL"}`);
process.exit(pass === 5 ? 0 : 1);

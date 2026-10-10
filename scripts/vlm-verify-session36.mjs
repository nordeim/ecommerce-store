// VLM verification of the 5 new session-36 screenshots (191-195) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/probe-r36.mjs) BEFORE this run — the
// round-32..35 lesson: describe reality, not intention.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..35 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "191-ord002-tracking-detail.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-002 in a warm-orange e-commerce theme: a small '← Orders' back link, the heading 'ORD-2026-002' with a gray 'In Transit' pill and the total $189.00 at the right; a 'Payment' card (Method: Card ···· 4242, Placed: Mar 15, 2026, no payment-status line); a 'Shipping Address' card (John Doe, 123 Main Street, New York, NY 10001, United States) that ALSO carries a 'Tracking' section below the address showing 'UPS · 1Z999AA10123456784' with the long number styled as an orange link; an 'Items' card listing one product at $189.00 × 1 with a totals block; and at the bottom a 'Timeline' card with exactly THREE rows: 'Order placed', 'Status updated to In Transit', and 'Tracking added', each with a small icon in a gray circle and a timestamp. No operator email addresses anywhere.",
  },
  {
    file: "192-tracking-line-closeup.png",
    expect: "A close-up crop of a 'Tracking' section inside a white rounded card: a muted gray 'Tracking' label above a bold line reading 'UPS · 1Z999AA10123456784', where the long tracking number '1Z999AA10123456784' is rendered in orange (link-styled) while 'UPS · ' is dark text; a thin divider line above the section. No buttons or other cards in frame.",
  },
  {
    file: "193-admin-tracking-form.png",
    expect: "A full-page screenshot of an ADMIN order-detail page for ORD-2026-002 in the same warm-orange theme: a '← Orders' back link, the heading 'ORD-2026-002' with a 'in transit' badge and total $189.00; a 'Customer' card (Email john@example.com, Placed and Payment rows); a 'Shipping Address' card that carries the address (John Doe, 123 Main Street, New York, NY 10001, United States), a 'Current: UPS · 1Z999AA10123456784' line, and a 'Tracking' form with two text inputs (one pre-filled 'UPS' with placeholder 'UPS, FedEx, USPS, DHL…', one pre-filled '1Z999AA10123456784') plus a 'Save tracking' button with a small truck icon; an 'Items' card; and a 'Timeline' card with THREE rows 'Order placed', 'Status changed', 'Tracking added', each showing a muted note line under the label (including notes like 'processing → in_transit by admin@luxestore.com' and 'UPS 1Z999AA10123456784 set by admin@luxestore.com') — the admin console DOES show these operator notes.",
  },
  {
    file: "194-ord001-calm-state.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-001: a '← Orders' back link, the heading 'ORD-2026-001' with an orange 'Delivered' pill and the total $349.98; a 'Payment' card (Method: Card ···· 4242, Placed: Mar 28, 2026); a 'Shipping Address' card showing ONLY the address (John Doe, 123 Main Street, New York, NY 10001, United States) with NO 'Tracking' section below it (this order has no tracking set — nothing renders); an 'Items' card with two product rows and a totals block; and a 'Timeline' card with THREE rows: 'Order placed', 'Status updated to In Transit', 'Status updated to Delivered'. No tracking number anywhere on the page.",
  },
  {
    file: "195-home-postchange.png",
    expect: "A live desktop screenshot of the LUXE storefront home page: an ORANGE announcement bar with white text reading 'Free shipping on orders over $100 • 30-day returns', a white header with the LUXE logo, navigation links Home/Shop/Electronics/Clothing/Accessories, search and account icons and a cart button, and a large hero section filling most of the viewport with the headline 'Spring Collection 2026' and an orange 'Shop Now' button over a lifestyle photo (a viewport-height capture — product sections and footer below the fold are NOT expected in frame).",
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
      console.log(`  (retry ${attempt}: ${e.message})`);
    }
  }
  const ok = /PASS/.test(ans) && !/FAIL/.test(ans);
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.file} — ${ans.split("\n")[0]}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${checks.length} ${pass === checks.length ? "VLM PASS" : "VLM FAIL"}`);

// VLM verification of the 5 new session-37 screenshots (196-200) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/probe-r37.mjs) BEFORE this run — the
// round-32..36 lesson: describe reality, not intention.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..36 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "196-ord002-delivery-window-detail.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-002 in a warm-orange e-commerce theme: a small '← Orders' back link, the heading 'ORD-2026-002' with a gray 'In Transit' pill and the total $189.00 at the right; DIRECTLY UNDER that header row a small muted gray line reading 'Estimated delivery: Mar 18 – 22, 2026'; a 'Payment' card (Method: Card ···· 4242, Placed: Mar 15, 2026, no payment-status line); a 'Shipping Address' card (John Doe, 123 Main Street, New York, NY 10001, United States) that also carries a 'Tracking' section below the address showing 'UPS · 1Z999AA10123456784' with the long number styled as an orange link; an 'Items' card listing one product (Minimalist Leather Watch, $189.00 × 1) with a totals block; and at the bottom a 'Timeline' card with exactly THREE rows: 'Order placed', 'Status updated to In Transit', and 'Tracking added', each with a small icon in a gray circle and a timestamp. The standard storefront footer below the cards (with the public contact hello@luxestore.com) is expected chrome; no operator attribution emails (admin@luxestore.com) in the order body.",
  },
  {
    file: "197-delivery-window-closeup.png",
    expect: "A close-up crop of a single small line of muted gray text on a cream/off-white background reading exactly 'Estimated delivery: Mar 18 – 22, 2026' — the word 'Estimated delivery:' followed by a date range with an en dash between '18' and '22' and the year ', 2026' at the end. The text is left-aligned, small (about 14px), and nothing else is fully in frame (possibly faint edges of the page above/below).",
  },
  {
    file: "198-confirmation-delivery-window.png",
    expect: "A full-page screenshot of an order confirmation page in the same warm-orange theme, with the standard storefront header (LUXE logo, nav links, search/account icons, cart button) and footer: a large green circled checkmark icon, the heading 'Order Confirmed', a line reading 'Thank you! Your order ORD-2026-006 has been placed.', a muted line 'A confirmation was sent to john@example.com.', a small muted line reading 'Estimated delivery: Oct 14 – 18, 2026' (an en dash between 14 and 18 — the window is the placed date + 3 to + 7 days), a white rounded items card with '1 item' and '$299.99' at the top (free shipping over the $100 threshold — the total equals the $299.99 item), one product row (Wireless Noise-Cancelling Headphones, ×1, $299.99) and a Free shipping row, followed by 'Continue Shopping' and 'View Orders' buttons. No payment-status line (this was the demo card flow).",
  },
  {
    file: "199-ord001-calm-state-no-window.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-001: a '← Orders' back link, the heading 'ORD-2026-001' with an orange 'Delivered' pill and the total $349.98; NO 'Estimated delivery' line under the header row (the delivered order renders no window — the header goes straight to the cards); a 'Payment' card (Method: Card ···· 4242, Placed: Mar 28, 2026); a 'Shipping Address' card showing ONLY the address (John Doe, 123 Main Street, New York, NY 10001, United States) with no Tracking section; an 'Items' card with two product rows and a totals block; and a 'Timeline' card with THREE rows: 'Order placed', 'Status updated to In Transit', 'Status updated to Delivered'. No tracking number and no estimated-delivery text anywhere on the page.",
  },
  {
    file: "200-home-postchange.png",
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
      console.error(`  (attempt ${attempt} failed: ${String(e).slice(0, 90)})`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  const ok = /^PASS/i.test(ans);
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.file}`);
  console.log(`      ${ans.slice(0, 220)}`);
}
console.log(`\nVLM ${pass}/${checks.length} ${pass === checks.length ? "PASS" : "FAIL"}`);

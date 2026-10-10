// VLM verification of the 5 new session-35 screenshots (186-190) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/probe-r35.mjs) BEFORE this run — the
// round-32/33/34 lesson: describe reality, not intention.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..34 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "186-ord001-detail-timeline.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-001 in a warm-orange e-commerce theme: a small '← Orders' back link, the heading 'ORD-2026-001' with an orange 'Delivered' pill and the total $349.98 at the right; a 'Payment' card (Method: Card ···· 4242, Placed: Mar 28, 2026, no payment-status line); a 'Shipping Address' card (John Doe, 123 Main Street, New York, NY 10001, United States); an 'Items' card with two product rows (Wireless Noise-Cancelling Headphones $299.99 × 1, Organic Cotton Oversized Tee $49.99 × 1) and a totals block (Subtotal $349.98, Shipping Free, Total $349.98); and at the bottom a 'Timeline' card with THREE rows, each an icon in a gray circle plus a label and timestamp: 'Order placed' dated Mar 28, 2026 with a clock time, 'Status updated to In Transit', and 'Status updated to Delivered'. No operator email addresses, no raw notes like 'Seeded demo order', and no 'Status changed' wording anywhere.",
  },
  {
    file: "187-ord004-refunded-detail-timeline.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-004: a small '← Orders' back link, the heading 'ORD-2026-004' with a gray 'Cancelled' pill and the total $79.99 at the right; a 'Payment' card with rows 'Method: Card ···· 4242' and 'Placed: Feb 22, 2026' plus a muted line reading 'Payment refunded — the amount has been returned to your original payment method.'; a 'Shipping Address' card (John Doe, 123 Main Street, New York, NY 10001, United States); an 'Items' card listing 'Ceramic Planter Set' at $79.99 × 1 with totals (Subtotal $79.99, Shipping Free, Total $79.99); and at the bottom a 'Timeline' card with THREE rows: 'Order placed', 'Status updated to Cancelled', and 'Payment refunded' — each with a small timestamp. No operator email addresses and no raw note text like 'Refunded $79.99 via Stripe' anywhere.",
  },
  {
    file: "188-owner-confirmation-deeplink.png",
    expect: "A full-page screenshot of an order confirmation page in the same warm-orange e-commerce theme, framed by the standard storefront chrome (an orange announcement bar, the LUXE header with logo and nav links, and the standard footer at the bottom). In the main content: a large green check-mark circle, the heading 'Order Confirmed', a thank-you sentence naming order ORD-2026-004, a muted line reading 'Payment refunded — the amount has been returned to your original payment method.', a line saying a confirmation was sent to john@example.com, a bordered card listing 1 item 'Ceramic Planter Set' × 1 with total $79.99, and below the card two rounded buttons side by side: a solid orange 'Continue Shopping' button and an outlined 'View Orders' button.",
  },
  {
    file: "189-ord002-intransit-detail.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-002: a small '← Orders' back link, the heading 'ORD-2026-002' with a gray 'In Transit' pill and the total $189.00 at the right; a 'Payment' card (Method: Card ···· 4242, Placed: Mar 15, 2026, no payment-status line); a 'Shipping Address' card (John Doe, 123 Main Street, New York, NY 10001, United States); an 'Items' card listing one product at $189.00 × 1 with a totals block (Subtotal $189.00, Shipping Free, Total $189.00); and at the bottom a 'Timeline' card with exactly TWO rows: 'Order placed' and 'Status updated to In Transit', each with a small timestamp. No operator email addresses anywhere.",
  },
  {
    file: "190-home-postchange.png",
    expect: "A live desktop screenshot of the LUXE storefront home page: an ORANGE announcement bar with white text, a white header with the LUXE logo, navigation links Home/Shop/Electronics/Clothing/Accessories, search and account icons and a cart button, a large hero section filling most of the viewport with a headline about Spring Collection 2026 and an orange 'Shop Now' button over a lifestyle photo (a viewport-height capture — product sections and footer below the fold are NOT expected in frame).",
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

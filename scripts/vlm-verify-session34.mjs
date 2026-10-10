// VLM verification of the 5 new session-34 screenshots (181-185) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/probe-r34.mjs) BEFORE this run — the
// round-32/33 lesson: describe reality, not intention.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..33 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "181-account-orders-linked-numbers.png",
    expect: "A full-page screenshot of an e-commerce 'My Account' page: a tabs bar (Profile, Orders, Addresses, Settings) with the Orders tab active, an 'Order History' card listing FOUR tinted rounded rows in order: ORD-2026-001 'Mar 28, 2026 · 2 items' with an orange 'Delivered' pill and total $349.98; ORD-2026-002 'Mar 15, 2026 · 1 item' with a gray 'In Transit' pill and total $189.00; ORD-2026-004 'Feb 22, 2026 · 1 item' carrying a muted gray extra line reading 'Refunded · $79.99 returned' under the date, a gray 'Cancelled' pill and total $79.99; and ORD-2026-003 'Feb 20, 2026 · 3 items' with an orange 'Delivered' pill and total $524.97. The rows render as plain tinted cards with bold order numbers — no underlined link styling visible.",
  },
  {
    file: "182-customer-order-detail.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-001 in a warm-orange e-commerce theme: a small '← Orders' back link, the heading 'ORD-2026-001' with an orange 'Delivered' pill and the total $349.98 at the right; a 'Payment' card with rows 'Method: Card ···· 4242' and 'Placed: Mar 28, 2026' and NO extra payment-status line; a 'Shipping Address' card (John Doe, 123 Main Street, New York, NY 10001, United States); and an 'Items' card listing 'Wireless Noise-Cancelling Headphones' at $299.99 × 1 (line total $299.99) and 'Organic Cotton Oversized Tee' at $49.99 × 1 (line total $49.99), followed by a totals block reading Subtotal $349.98, Shipping Free, Total $349.98.",
  },
  {
    file: "183-refunded-order-detail.png",
    expect: "A full-page screenshot of a customer order-detail page for ORD-2026-004: a small '← Orders' back link, the heading 'ORD-2026-004' with a gray 'Cancelled' pill and the total $79.99 at the right; a 'Payment' card with rows 'Method: Card ···· 4242' and 'Placed: Feb 22, 2026' plus a muted gray line reading 'Payment refunded — the amount has been returned to your original payment method.'; a 'Shipping Address' card (John Doe, 123 Main Street, New York, NY 10001, United States); and an 'Items' card listing 'Ceramic Planter Set' at $79.99 × 1, with a totals block reading Subtotal $79.99, Shipping Free, Total $79.99.",
  },
  {
    file: "184-order-detail-owner-gate.png",
    expect: "A live desktop screenshot of an order page showing an access-denied state: a small '← Orders' back link, the heading 'Order not found', and a centered rounded card containing only the muted sentence 'This order does not exist or does not belong to your account.' — no order number, no items, no prices anywhere.",
  },
  {
    file: "185-home-postchange.png",
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

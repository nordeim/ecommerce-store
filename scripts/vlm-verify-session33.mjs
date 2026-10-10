// VLM verification of the 5 new session-33 screenshots (176-180) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/probe-r33.mjs / probe-r33b.mjs) BEFORE
// this run — the round-32 lesson: the VLM catches every description
// error, so describe reality, not intention.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..32 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "176-account-orders-refunded-line.png",
    expect: "A full-page screenshot of an e-commerce 'My Account' page: a tabs bar (Profile, Orders, Addresses, Settings) with the Orders tab active, an 'Order History' card listing FOUR tinted rounded rows in order: ORD-2026-001 'Mar 28, 2026 · 2 items' with an orange 'Delivered' pill and total $349.98; ORD-2026-002 'Mar 15, 2026 · 1 item' with a gray 'In Transit' pill and total $189.00; ORD-2026-004 'Feb 22, 2026 · 1 item' carrying a muted gray extra line reading 'Refunded · $79.99 returned' under the date, a gray 'Cancelled' pill and total $79.99; and ORD-2026-003 'Feb 20, 2026 · 3 items' with an orange 'Delivered' pill and total $524.97. ONLY the ORD-2026-004 row carries the 'Refunded' money line — the other three rows have no extra line.",
  },
  {
    file: "177-refunded-confirmation.png",
    expect: "A live desktop screenshot of an order confirmation page: a large green circled check icon, the heading 'Order Confirmed', the text 'Thank you! Your order ORD-2026-004 has been placed.', 'A confirmation was sent to john@example.com.', then a muted line reading 'Payment refunded — the amount has been returned to your original payment method.', a bordered card listing 1 item — Ceramic Planter Set ×1 — with total $79.99, and two buttons 'Continue Shopping' and 'View Orders'.",
  },
  {
    file: "178-admin-orders-four-canonical.png",
    expect: "A full-page screenshot of an admin console 'Orders' page in a warm-orange e-commerce theme: a back link '← Admin', the heading 'Orders', a filter bar with a status Select and a search input, a count line reading '4 orders', and four order rows stacked top to bottom in this exact order: first ORD-2026-001 (john@example.com · 2 items · Mar 28, 2026, a 'Delivered' badge, $349.98), second ORD-2026-002 (john@example.com · 1 items · Mar 15, 2026, an 'In Transit' badge, $189.00), third ORD-2026-004 (john@example.com · 1 items · Feb 22, 2026, a 'Cancelled' badge, $79.99), fourth ORD-2026-003 (john@example.com · 3 items · Feb 20, 2026, a 'Delivered' badge, $524.97) — each row also carrying its own status combobox.",
  },
  {
    file: "179-order-detail-refunded-coherence.png",
    expect: "A full-page screenshot of an admin order-detail page for ORD-2026-004 (a 'Cancelled' badge and total $79.99 in the header): a Customer card showing john@example.com, placed February 22 2026, payment 'Card ···· 4242', and a charge line reading 'Refunded (Stripe)' with the intent id 'pi_demo_fixture_005' beneath it and NO refund button anywhere; a Shipping Address card (John Doe, 123 Main Street, New York); an Items card with Ceramic Planter Set $79.99 × 1; a 'Payment events' card with a single row 'Refunded' dated Feb 22 2026 with $79.99; and a Timeline card with 'Order placed' followed by 'Payment refunded' carrying the note 'Refunded $79.99 via Stripe'.",
  },
  {
    file: "180-home-postchange.png",
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

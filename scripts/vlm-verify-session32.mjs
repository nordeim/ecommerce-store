// VLM verification of the 5 new session-32 screenshots (171-175) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..31 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "171-refund-control-confirm.png",
    expect: "A live desktop screenshot of an admin order-detail page in a warm-orange e-commerce console: the heading 'ORD-2026-003' with a 'Delivered' badge and total $524.97, a Customer card showing email john@example.com, a placed date, 'Card' payment, a green 'Paid (Stripe)' charge line with the intent id 'pi_demo_fixture_003' beneath it, and directly under the customer info the TWO-STEP CONFIRM state (the resting 'Refund payment' button has been clicked and swapped out): an outline 'Confirm refund' button and a ghost 'Cancel' button, a Shipping Address card to the right, an Items card listing Smart Home Speaker Pro, Titanium/Aviator Sunglasses and Ceramic Planter, a 'Payment events' card with a 'Payment captured' row for $524.97 dated Feb 20 2026, and a Timeline card with 'Order placed'.",
  },
  {
    file: "172-refund-demo-refusal.png",
    expect: "The same admin order-detail page for ORD-2026-003, now showing the demo-mode refusal: in the Customer card under the payment info, a small red text line reading 'Stripe is not configured — refund via the Stripe dashboard.' with the 'Refund payment' button (or the Confirm/Cancel pair) still visible above or beside it, the green 'Paid (Stripe)' charge line unchanged (the refusal writes nothing).",
  },
  {
    file: "173-refunded-order-reflection.png",
    expect: "A full-page live screenshot of the admin order-detail for ORD-2026-003 after a Stripe refund: the Customer card's charge line now reads 'Refunded (Stripe)' in muted gray (NOT green 'Paid'), the intent id 'pi_demo_fixture_003' beneath it, NO 'Refund payment' button anywhere (the post-reflection ineligibility), the 'Payment events' card with a 'Payment captured' row $524.97 Feb 20 2026 AND a 'Refunded' row $524.97, and the Timeline card showing 'Order placed' followed by a 'Payment refunded' entry with the note 'Refunded $524.97 via Stripe'.",
  },
  {
    file: "174-payments-surface.png",
    expect: "A live desktop screenshot of the admin payments page in the warm-orange console: 'Payments' heading with a back link, a one-line Stripe configuration status mentioning demo mode, a filter bar with family Select, search input and two date inputs, a count line reading '4 payment events', and four payment-event rows newest first: a succeeded row for pi_demo_fixture_006 with $149.00 and the red 'No order — refund via Stripe dashboard' line plus the muted 'Reason: amount mismatch vs cart total'; a charge.refunded row for pi_demo_fixture_005 with 'Ignored' and $79.99; a payment_failed row for pi_demo_fixture_004 with 'Payment failed' and $89.99; a succeeded row for pi_demo_fixture_003 linking 'ORD-2026-003 placed' with $524.97.",
  },
  {
    file: "175-home-dev-postchange.png",
    expect: "A live desktop screenshot of the LUXE storefront home page: an ORANGE announcement bar with white text, a white header with the LUXE logo, navigation links Home/Shop/Electronics/Clothing/Accessories, search and account icons and a cart button with badge, a large hero section filling most of the viewport with a headline about Spring Collection 2026 and an orange 'Shop Now' button over a lifestyle photo (a viewport-height capture — the product sections and footer below the fold are NOT expected in frame).",
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
        thinking: { type: "disabled" },
      });
      ans = r?.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      const is429 = String(e).includes("429");
      console.log(`retry ${attempt} (${is429 ? "rate-limited" : "error"}) ${c.file}: ${String(e).slice(0, 90)}`);
      await new Promise((r) => setTimeout(r, is429 ? 20000 * attempt : 3000));
    }
  }
  if (!ans) {
    console.log(`ERROR ${c.file}: giving up after retries`);
    continue;
  }
  const ok = /PASS/i.test(ans) && !/FAIL/i.test(ans);
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.file}  — ${ans.slice(0, 140).replace(/\n/g, " ")}`);
  if (ok) pass++;
  await new Promise((r) => setTimeout(r, 4000));
}
console.log(`\n${pass}/${checks.length} checks passed`);
process.exit(pass === checks.length ? 0 : 1);

// VLM verification of the 5 new session-40 screenshots (211-215) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round40.mjs's probes — the
// estimate text, the tracking href, the timeline row count, the mobile
// panel geometry all read from the rendered pages) BEFORE this run — the
// round-32..39 lesson: describe reality, not intention.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..39 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "211-home-docs-align-anchor.png",
    expect: "A live desktop screenshot (1280px wide, viewport-height — NOT full-page) of the LUXE storefront home page in a warm-orange e-commerce theme: an ORANGE announcement bar at the very top with white text reading 'Free shipping on orders over $100 • 30-day returns'; below it a white header with the LUXE wordmark logo, navigation links Home/Shop/Electronics/Clothing/Accessories, search and account icons, and a cart button; then a large hero section filling most of the viewport with the headline 'Spring Collection 2026', some smaller sub-text, and an orange 'Shop Now' button over a lifestyle photograph. Product sections and the footer are below the fold and NOT expected in frame.",
  },
  {
    file: "212-ord002-customer-detail.png",
    expect: "A FULL-PAGE screenshot of a customer order-detail page for ORD-2026-002 in the warm-orange LUXE theme, with the standard storefront header and footer: a small '← Orders' back link; the heading 'ORD-2026-002' beside a gray 'In Transit' status pill and the total $189.00 at the right; DIRECTLY UNDER that header row a small muted gray line reading exactly 'Estimated delivery: Mar 18 – 24, 2026' (an en dash between 18 and 24); a 'Payment' card (Method: Card ···· 4242, Placed: Mar 15, 2026); a 'Shipping Address' card (John Doe, 123 Main Street, New York, NY 10001, United States) that also carries a 'Tracking' section showing 'UPS · 1Z999AA10123456784' with the long tracking number styled as an orange link pointing at UPS's tracking page; an 'Items' card with the ordered product(s) and a totals block; and at the bottom a 'Timeline' card with exactly THREE rows ('Order placed', 'Status updated to In Transit', 'Tracking added').",
  },
  {
    file: "213-checkout-wizard-resting.png",
    expect: "A live desktop screenshot (viewport-height, NOT full-page) of the LUXE checkout page, step 1 of the 3-step wizard: the standard LUXE header on top; a 'Checkout' heading; a step indicator or the contact/shipping form as the visible step (an email/contact input field present); and on the right side an order summary card showing exactly ONE item (the Wireless Noise-Cancelling Headphones product just added to the cart — one product thumbnail) with its price. Warm-orange accents, white cards, cream background. The footer may be below the fold.",
  },
  {
    file: "214-admin-payments-console.png",
    expect: "A FULL-PAGE screenshot of the LUXE admin Payments console (the superset operator surface) in the warm-orange theme: a '← Admin' back link, a 'Payments' heading, an info banner reading 'Stripe is in demo mode — the checkout renders the demo flow. Events below are fixture data.', a filter control reading 'All Families' and a count line '4 payment events', then a 'Payment event list' of exactly FOUR event rows, each showing a TECHNICAL Stripe event type as its title (e.g. 'payment_intent.succeeded', 'charge.refunded', 'payment_intent.payment_failed') with a small gray event-id/intent-id line (like 'evt_demo_fixture_n · pi_demo_fixture_006'), a date (Feb 20-23, 2026), a dollar amount ($149.00 / $79.99 / $89.99 / $524.97), and an outcome line ('No order — refund via Stripe dashboard' with 'Reason: amount mismatch vs cart total', 'Ignored', 'Payment failed', or 'ORD-2026-003 placed').",
  },
  {
    file: "215-mobile-nav-standing-watch.png",
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

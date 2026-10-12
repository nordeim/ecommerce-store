// VLM verification of the 5 new session-48 screenshots (251-255) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round48.mjs's probes — the option
// borders, the container's unstyled state, the CVC value, the Place Order
// label + lock, the post-Back preservation) BEFORE this run — the
// round-40..47 lesson: describe reality, not intention; the DOM probe is
// the ground truth.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry; package.json + bun.lock
// are untouched.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "251-paystep-resting-card-selected.png",
    expect:
      "A screenshot of the LUXE checkout's PAYMENT METHOD step (desktop, storefront header at top, a 'Back to Cart' link, the bold 'Payment Method' heading): two option rows — 'Credit / Debit Card' (with a credit-card icon and a radio circle with an orange dot — SELECTED, its row's border a SOFT translucent orange) and 'PayPal' (with a wallet icon and an empty radio circle — unselected, a plain light-gray stone border). Below the options, the three card fields sit DIRECTLY on the page background with NO tinted container box around them: the full-width 'Card Number' input (empty, placeholder '4242 4242 4242 4242'), then 'Expiry' (placeholder 'MM/YY') and 'CVC' (placeholder '123') side by side. Below: 'Back' and 'Review Order' buttons (Review Order disabled/dimmed — the card is empty). An 'Order Summary' card on the right with the headphones line item, a $299.99 Subtotal, 'Free' Shipping, and $299.99 Total.",
  },
  {
    file: "252-paystep-paypal-selected-fields-visible.png",
    expect:
      "The same LUXE checkout Payment Method step, now with PAYPAL SELECTED: the PayPal row's radio circle shows the orange dot and its row's border is the SOFT translucent orange; the 'Credit / Debit Card' row above shows an empty radio circle and the plain stone border. CRITICALLY, the three card fields (Card Number / Expiry / CVC) REMAIN VISIBLE below the options — not hidden — sitting on the plain background with no tinted container. The 'Review Order' button is now ENABLED (full opacity) because PayPal needs no card data. Order Summary unchanged on the right.",
  },
  {
    file: "253-paystep-cvc-formatter.png",
    expect:
      "The same LUXE checkout Payment Method step with the CARD option re-selected (its row back to the soft orange border, PayPal back to stone): the customer typed letters and digits into the CVC field and the formatter kept ONLY the first four DIGITS — the CVC input reads '1245' as its typed value. The Card Number input is still empty with its grouped-digit placeholder, Expiry empty with 'MM/YY'. 'Review Order' disabled (the card is incomplete). Order Summary on the right unchanged.",
  },
  {
    file: "254-paystep-place-order-label.png",
    expect:
      "A screenshot of the LUXE checkout's REVIEW & PLACE ORDER step (step 3): the bold 'Review & Place Order' heading, a 'Shipping Address' card (Ada Lovelace, 123 Main St, New York, NY 10001, United States, with an 'Edit' link) and a 'Payment' card below it ('Card ending in 4242', with an 'Edit' link). At the bottom left a 'Back' outline button and the full-width 'Place Order — $299.99' button — an orange primary button whose label carries an em-dash and the total price, with a small LOCK icon at the label's left. Order Summary on the right with the headphones, $299.99 Subtotal, Free shipping, $299.99 Total.",
  },
  {
    file: "255-paystep-back-preserved.png",
    expect:
      "The LUXE checkout back on the PAYMENT METHOD step after the customer walked to the review and pressed Back WITH PayPal selected: the PayPal row shows the selected state (orange-dotted radio + soft orange border) and the card fields below REMAIN VISIBLE and STILL FILLED — Card Number '4242 4242 4242 4242', Expiry '12/28', CVC '123' (nothing was reset). 'Review Order' enabled. Order Summary on the right unchanged.",
  },
];

let pass = 0;
for (const { file, expect } of checks) {
  const b64 = readFileSync(`${OUT}/${file}`).toString("base64");
  const res = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Does this screenshot match the following description? Answer with exactly PASS or FAIL, then one short sentence of justification.\n\nDESCRIPTION: ${expect}`,
          },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  const answer = (res.choices[0]?.message?.content ?? "").trim();
  const ok = /^PASS/i.test(answer);
  console.log(`${ok ? "PASS" : "FAIL"}  ${file}  —  ${answer.slice(0, 150).replace(/\n/g, " ")}`);
  if (ok) pass++;
}
console.log(`\nVLM VERIFICATION: ${pass}/${checks.length}`);
process.exit(pass === checks.length ? 0 : 1);

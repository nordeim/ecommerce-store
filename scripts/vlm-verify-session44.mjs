// VLM verification of the 5 new session-44 screenshots (231-235) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round44.mjs's probes — the resting
// step-1 anatomy + the disabled Continue, the gated invalid-email state,
// the formatted card values, the review's two cards + 2 Edit buttons, and
// the preserved values after the Edit-back) BEFORE this run — the
// round-32..43 lesson: describe reality, not intention.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry (npm --no-save);
// package.json + bun.lock are untouched.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "231-checkout-step1-resting.png",
    expect: "A screenshot of the LUXE storefront CHECKOUT page, desktop width: a 'Checkout' h1, a 'Shipping Information' form section with seven labeled inputs in a two-column grid (First Name, Last Name, Email, Address, City, State, ZIP). First Name 'John', Last Name 'Doe', and Email 'john@example.com' are pre-filled with dark text; the Address and ZIP inputs show LIGHT-GRAY PLACEHOLDER text ('123 Main St' and '10001' — placeholder styling, not typed values); City and State appear empty. Below the form an orange 'Continue to Payment' button, a 'Back to Cart' link above the form, and an 'Order Summary' card on the right showing 'Wireless Noise-Cancelling Headphones' at $299.99 with Subtotal $299.99, Shipping Free, Total $299.99.",
  },
  {
    file: "232-checkout-step1-gated-invalid-email.png",
    expect: "The same LUXE checkout Shipping Information form: the Email input filled with the INVALID value 'ada@example' (no domain suffix), the Address/City/State/ZIP inputs filled ('123 Main St', 'New York', 'NY', '10001'), and the 'Continue to Payment' button still visibly DISABLED (muted, not orange) — the validation gate holding on an invalid email. The Order Summary card on the right.",
  },
  {
    file: "233-checkout-step2-formatted-card.png",
    expect: "The LUXE checkout PAYMENT step: a 'Payment Method' heading, a selected 'Credit / Debit Card' radio option (highlighted border), a tinted card-fields block with 'Card Number' showing the GROUPED value '4242 4242 4242 4242', 'Expiry' showing '12/28' (slash inserted), and 'CVC' showing '123', plus an enabled orange 'Review Order' button and a 'Back' button.",
  },
  {
    file: "234-checkout-step3-review-cards.png",
    expect: "The LUXE checkout REVIEW step: a 'Review & Place Order' heading, TWO tinted summary cards — one titled 'Shipping Address' with an 'Edit' button showing 'John Doe, 123 Main St, New York, NY 10001, United States', and one titled 'Payment' with an 'Edit' button showing 'Card ending in 4242' — plus an orange 'Place Order — $299.99' button with a lock icon, a 'Back' button, and the Order Summary aside on the right.",
  },
  {
    file: "235-checkout-step1-after-edit-preserved.png",
    expect: "The LUXE checkout back at the SHIPPING step after clicking Edit from the review: the 'Shipping Information' form with EVERY field still filled (First Name 'John', Last Name 'Doe', Email 'john@example.com', Address '123 Main St', City 'New York', State 'NY', ZIP '10001') and the orange 'Continue to Payment' button now ENABLED (the values survived the edit-back navigation).",
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
          { type: "text", text: `Does this screenshot match the following description? Answer PASS or FAIL followed by one sentence of what you actually see.\n\nDESCRIPTION: ${expect}` },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    thinking: { type: "disabled" },
  });
  const content = res.choices[0].message.content ?? "";
  const ok = /PASS/i.test(content) && !/FAIL/i.test(content);
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"} — ${file}\n  ${content.slice(0, 260)}\n`);
}
console.log(`VLM: ${pass}/${checks.length} PASS`);

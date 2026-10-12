// Round-48 calibration: VLM DESCRIPTIONS of the step-2 captures (not
// pass/fail — ground-truth descriptions of the payment-method area, to
// settle the option-label + card-container styling question).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();

const files = [
  "/tmp/probe-r48/step2-resting.png",
  "/tmp/probe-r48/ref-step2-paypal-selected.png",
  "/tmp/probe-r48/clone-step2-paypal-selected.png",
];

for (const f of files) {
  const b64 = readFileSync(f).toString("base64");
  const res = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe ONLY the 'Payment Method' section of this checkout page in precise visual terms: (1) the two payment options (Credit/Debit Card, PayPal) — are they rendered as bordered/boxed rows with background tints, or as plain text rows next to radio circles? Which one appears selected and HOW is the selection shown (border color, background tint, filled radio dot)? (2) the card number / expiry / CVC inputs — are they inside a tinted container box or on the plain page background? Are they visible at all? (3) any icons next to the option labels? Be literal and specific about colors, borders, backgrounds.",
          },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  console.log(`\n===== ${f.split("/").pop()} =====`);
  console.log((res.choices[0]?.message?.content ?? "").trim().slice(0, 900));
}

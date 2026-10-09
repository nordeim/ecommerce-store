// Re-verification of 152 only — the first description was WRONG (it
// described the UNFILTERED family Select "All events"; the deep-link
// lands on ?family=refund-needed, so the Select correctly reflects the
// ACTIVE filter "Refund needed" — the screenshot was right, the
// description wasn't; the session-26 lesson repeat).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const expect = "A live desktop screenshot of an admin Payments page in a warm-orange console: a back link '← Admin' then heading 'Payments', a demo-mode status strip mentioning Stripe in demo mode, a filter bar where the family dropdown REFLECTS the active 'Refund needed' filter (not All events), a search input and two date inputs, a count line reading '1 payment event', and exactly ONE payment event row (payment_intent.succeeded, an evt_demo_fixture_n id, a date, an amount $149.00, and red text 'No order — refund via Stripe dashboard'), with a dark newsletter footer below.";

const b64 = readFileSync(`${OUT}/152-alert-deeplink-live.png`).toString("base64");
let ans = "";
for (let attempt = 1; attempt <= 4 && !ans; attempt++) {
  try {
    const r = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Does this screenshot match this description? Answer PASS or FAIL plus one sentence.\n\n${expect}` },
            { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    ans = r?.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    const is429 = String(e).includes("429");
    console.log(`retry ${attempt} (${is429 ? "rate-limited" : "error"}): ${String(e).slice(0, 90)}`);
    await new Promise((r) => setTimeout(r, is429 ? 20000 * attempt : 3000));
  }
}
const ok = /PASS/i.test(ans) && !/FAIL/i.test(ans);
console.log(`${ok ? "PASS" : "FAIL"}  152-alert-deeplink-live.png  — ${(ans || "NO ANSWER").slice(0, 180).replace(/\n/g, " ")}`);
process.exit(ok ? 0 : 1);

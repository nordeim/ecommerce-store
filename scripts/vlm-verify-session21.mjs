// VLM verification of the 5 new session-21 screenshots (116-120) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17/18/19/20 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "116-inp-differential.png",
    expect: "A dark dashboard panel titled 'the FIRST INP (Interaction to Next Paint) differential' with a methodology box, an 8-column table (surface / reference mechanism / clone mechanism / ref desktop / clone desktop / ref iPhone / clone iPhone / verdict) with 5 rows (pdp add-to-cart, pdp wishlist heart, search typing, drawer stepper, carousel next) showing millisecond values like 24ms, 16ms, 48ms and ZERO DEFECT verdicts, plus notes about the architecture-level finding and L32/L33 discoveries.",
  },
  {
    file: "117-mobile-nav-21st-verification.png",
    expect: "A mobile (390px wide) screenshot of an e-commerce site with a LEFT-SLIDING navigation drawer open over the homepage: the drawer shows a close X icon at top, then a vertical list of 5 links (Home, Shop, Electronics, Clothing, Accessories), each on its own row, with dark text on a warm off-white background, Home in orange.",
  },
  {
    file: "118-inp-gate-live-run.png",
    expect: "A dark dashboard panel titled 'the INP standing gate' describing 10 tests = 5 surfaces × 2 viewports in GUEST contexts, with a 4-column table (surface / protocol / measured RED payloads / budget result) showing rows for pdp add-to-cart, pdp wishlist heart, search typing, drawer stepper, carousel next all marked PASS, and notes about the 200ms budget and the 202-test gate.",
  },
  {
    file: "119-inp-mutation-efficacy-proof.png",
    expect: "A dark dashboard panel titled 'dual mutation efficacy' with a 4-column table (mutation / design / expected failure / result) showing 2 mutations: the drawer stepper busy-wait failing only drawer-stepper tests at 432/416ms, and the carousel next busy-wait failing only carousel-next at 456/448ms, both marked CONFIRMED LIVE, plus notes about the reverted mutations and the defect class the gate catches.",
  },
  {
    file: "120-inp-e2e-calibration.png",
    expect: "A dark dashboard panel titled 'the E2E-condition calibration' describing the protocol against the :3100 standalone server with the e2e DB in guest contexts, with a 3-column table (surface / desktop run1 run2 / iPhone 14 run1 run2) showing millisecond values like 16/24ms, 56/56ms, 40/40ms, and notes about the calibrated max 56ms, the 200ms budget, and the guest-context design.",
  },
];

let pass = 0;
for (const c of checks) {
  const b64 = readFileSync(`${OUT}/${c.file}`).toString("base64");
  try {
    const res = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
            { type: "text", text: `Does this screenshot match this description? Answer PASS or FAIL with one short sentence.\nDescription: ${c.expect}` },
          ],
        },
      ],
    });
    const reply = res.choices[0]?.message?.content?.slice(0, 200) ?? "(no reply)";
    if (/PASS/i.test(reply)) pass++;
    console.log(`${c.file}: ${reply}`);
  } catch (e) {
    console.log(`${c.file}: VLM error — ${String(e).slice(0, 120)}`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}
console.log(`\n${pass}/${checks.length} PASS`);

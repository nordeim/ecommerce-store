// VLM verification of the 5 new session-18 screenshots (101-105) — per the
// session-17 lesson: the correct multimodal call is createVision (the plain
//
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — install it transiently first: `bun add -d z-ai-web-dev-sdk`,
// then revert package.json + bun.lock before committing (the session-17
// convention).
// chat.completions.create endpoint is text-only here).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "101-mobile-cwv-differential.png",
    expect: "A dark dashboard panel titled 'MOBILE CWV differential — Round-18 new audit surface (PERF-GATE-2)' with a methodology box, a 7-column table (route / clone LCP / ref LCP / LCP element / clone CLS / ref CLS / superset) showing home/shop/pdp rows with 3.2x-4.4x faster green values, and a finding box stating zero parity defects.",
  },
  {
    file: "102-mobile-nav-18th-verification.png",
    expect: "A mobile (390px wide) screenshot of an e-commerce site with a LEFT-SLIDING navigation drawer open over the homepage: the drawer shows the LUXE brand at top, then a vertical list of 5 links (Home, Shop, Electronics, Clothing, Accessories), each on its own row.",
  },
  {
    file: "103-mobile-cwv-gate-live-run.png",
    expect: "A dark dashboard panel titled 'CWV MOBILE gate — live run on the current build (PERF-GATE-2)' with a gate/pins box, a 5-column table (route / LCP / CLS / LCP element / verdict) showing home/shop/pdp rows with green LCP ms values, CLS values under 0.03, IMG elements with pixel-area sizes, and PASS verdicts, plus an E2E box stating 172/172.",
  },
  {
    file: "104-mobile-cwv-mutation-proof.png",
    expect: "A dark dashboard panel titled 'Triple mutation efficacy proof — the mobile CWV gate bites (PERF-GATE-2)' with an L28 method box and a 5-column table (mutation / route / pin that fired / failure evidence / proof) listing three mutations (mobile-only hero-img hiding, late-injected banner, L27 PDP unsized image) with red failure values (H1, 0.2088, 0.3776) and green mobile-FAILED/desktop-GREEN proofs.",
  },
  {
    file: "105-mobile-cwv-calibration.png",
    expect: "A dark dashboard panel titled 'MOBILE CWV E2E-condition calibration — the pins' provenance (PERF-GATE-2)' with a conditions box mentioning iPhone 14 and 390x664, a 7-column table (route / FCP / LCP / LCP element / e.size / CLS / pinned budget) with home/shop/pdp rows, and a headroom box.",
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

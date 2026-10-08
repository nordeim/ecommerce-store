// VLM verification of the 5 new session-19 screenshots (106-110) — per the
// session-17 lesson: the correct multimodal call is createVision (the plain
// chat.completions.create endpoint is text-only here).
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — install it transiently first: `bun add -d z-ai-web-dev-sdk`,
// then revert package.json + bun.lock before committing (the session-17/18
// convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "106-auth-screens-axe-differential.png",
    expect: "A dark dashboard panel titled 'AUTH-SCREENS axe differential — Round-19 new audit surface (A11Y-GATE-3)' with a methodology box, a 4-column table (route / clone census / ref census / contract) showing register, forgot-password and verify-email rows with color-contrast(2) or (1) values and PARITY or QUALITY pin labels, and a finding box stating zero parity defects.",
  },
  {
    file: "107-mobile-nav-19th-verification.png",
    expect: "A mobile (390px wide) screenshot of an e-commerce site with a LEFT-SLIDING navigation drawer open over the homepage: the drawer shows the LUXE brand at top, then a vertical list of 5 links (Home, Shop, Electronics, Clothing, Accessories), each on its own row.",
  },
  {
    file: "108-auth-screens-gate-live-run.png",
    expect: "A dark dashboard panel titled 'Auth-screens axe gate — live census (A11Y-GATE-3, session-19)' with a live-run box, a 4-column table (screen / desktop census / mobile census / pinned) showing register, forgot-password, verify-email rows with color-contrast values at 2 or 1 and green 'both viewports' pins, plus an E2E box mentioning 6 new tests and 178/178.",
  },
  {
    file: "109-mutation-efficacy-proof.png",
    expect: "A dark dashboard panel titled 'Dual mutation efficacy proof — A11Y-GATE-3 (session-19)' with two boxed sections describing mutation 1 (verify-email aria-label removal — FAILED at both viewports with label rule) and mutation 2 (register label-association, revised — L29 placeholder masking lesson, FAILED with label rule), with red FAILED markers and green stayed-GREEN notes.",
  },
  {
    file: "110-auth-e2e-calibration.png",
    expect: "A dark dashboard panel titled 'E2E-condition auth calibration — A11Y-GATE-3 (session-19)' with a methodology box mentioning :3100, e2e.db and anonymous contexts, a 4-column table (screen / desktop / mobile / spec pin) with register, forgot-password, verify-email rows showing color-contrast:2 or :1 values, and a RED-trail box.",
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

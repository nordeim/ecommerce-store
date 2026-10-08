// VLM verification of the 6 new session-20 screenshots (111-115, with 114
// split a/b) — the createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — install it transiently first: `bun add -d z-ai-web-dev-sdk`,
// then revert package.json + bun.lock before committing (the session-17/18/19
// convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "111-seo-sitemap-differential.png",
    expect: "A dark dashboard panel titled 'SEO/SITEMAP differential — Round-20 new audit surface' with a methodology box mentioning the live differential, a 4-column table (surface / reference / clone / verdict) with rows for sitemap.xml, robots.txt, /reset-password, structured data and regression gate, showing SEO SUPERSET and PARITY restored labels, and a finding chain mentioning RESET-ROUTE-1, SEO-GATE-1 and JSON-LD-1.",
  },
  {
    file: "112-mobile-nav-20th-verification.png",
    expect: "A mobile (390px wide) screenshot of an e-commerce site with a LEFT-SLIDING navigation drawer open over the homepage: the drawer shows a close X icon at top, then a vertical list of 5 links (Home, Shop, Electronics, Clothing, Accessories), each on its own row, with dark text on a warm off-white background.",
  },
  {
    file: "113-seo-gate-live-run.png",
    expect: "A dark dashboard panel titled 'The SEO standing gate (SEO-GATE-1)' describing 6 tests pinning the sitemap census, robots rules and JSON-LD nodes, with a pre block showing XML sitemap entries (loc URLs, changefreq, priority) and a robots.txt block with User-Agent, Allow and Disallow rules and a Sitemap link.",
  },
  {
    file: "114a-reset-password-invalid-link-state.png",
    expect: "A centered auth screen on an off-white background with a rounded primary-colored icon tile containing a triangle warning icon, a large bold heading 'Invalid reset link', a subtitle 'This password reset link is missing or invalid', a white card with a small centered paragraph about the incomplete link, and below it a small 'Request a new link' link.",
  },
  {
    file: "114b-reset-password-new-password-form.png",
    expect: "A centered auth screen on an off-white background with a rounded primary-colored icon tile containing a lock icon, a large bold heading 'New password', a subtitle 'Enter your new password below', a white card with two labeled password fields (New Password, Confirm Password) with lock icons and dot placeholders, and a full-width 'Reset password' button.",
  },
  {
    file: "115-mutation-efficacy-proof.png",
    expect: "A dark dashboard panel titled 'Dual/quadruple mutation efficacy' with a 4-column table (mutation / design / expected failure / result) showing 4 mutations: sitemap product-URL drop, robots disallow drop, JSON-LD price corruption, and the axe label association with the L29 placeholder note, all marked CONFIRMED LIVE, plus a note about the cart-spec Checkout assertion refinement.",
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

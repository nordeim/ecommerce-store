// VLM verification of the 5 new session-43 screenshots (226-230) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round43.mjs's probes — the resting
// anatomy attrs, the POST 200 + the success line + the cleared input, the
// 11th POST's 429 + Retry-After 595 + the red error line, and the mobile
// panel links all read from the rendered pages) BEFORE this run — the
// round-32..42 lesson: describe reality, not intention.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry (npm --no-save);
// package.json + bun.lock are untouched (md5-recorded).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "226-home-anchor.png",
    expect: "A screenshot of the LUXE storefront HOME page (the standing round anchor), warm cream background: a top navigation bar with the 'LUXE' wordmark left, nav links including Home / Shop / Electronics / Clothing / Accessories, and a user account icon (profile) on the right; then a large hero photograph of a spring fashion model filling most of the viewport with a big heading reading 'Spring Collection 2026' and a subheading plus a 'Shop Now' button overlaid on the photo, and the beginning of product content below. NO developer-tools badge or floating box anywhere in the corners.",
  },
  {
    file: "227-newsletter-resting-anatomy.png",
    expect: "A close-up element screenshot of the footer's newsletter column on a dark charcoal background: a small uppercase heading reading 'STAY UPDATED', a muted subtitle 'Subscribe for exclusive offers and new arrivals.', an email input field with placeholder 'Your email' beside a small 'Join' button on one row, and below the form a small muted line reading 'By subscribing, you agree to our Privacy Policy.' NO success or error status line is visible (the resting state).",
  },
  {
    file: "228-newsletter-success-state.png",
    expect: "The same footer newsletter column close-up on a dark charcoal background — uppercase 'STAY UPDATED' heading, subtitle 'Subscribe for exclusive offers and new arrivals.', the email input now EMPTY beside the 'Join' button — but now BELOW the form a light-colored status line reads 'Thanks for subscribing!' (the just-subscribed success state; no red text).",
  },
  {
    file: "229-newsletter-rate-limited-state.png",
    expect: "The same footer newsletter column close-up on a dark charcoal background — uppercase 'STAY UPDATED' heading, subtitle 'Subscribe for exclusive offers and new arrivals.', the email input beside the 'Join' button — and below the form a RED error line reads 'Too many attempts. Please try again later.' (the rate-limited state after too many submits).",
  },
  {
    file: "230-mobile-nav-open.png",
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
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.file} — ${ans.slice(0, 140)}`);
}
console.log(`\n${pass}/${checks.length} ${pass === checks.length ? "VLM PASS" : "VLM FAIL — re-describe against the probe and re-run"}`);

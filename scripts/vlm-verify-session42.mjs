// VLM verification of the 5 new session-42 screenshots (221-225) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round42.mjs's probes — the badge
// geometry, the console census, the CSP headers, and the mobile panel
// links all read from the rendered pages) BEFORE this run — the
// round-32..41 lesson: describe reality, not intention.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry (npm --no-save);
// package.json + bun.lock are untouched (md5-recorded).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "221-home-anchor.png",
    expect: "A screenshot of the LUXE storefront HOME page (the standing round anchor), warm cream background: a top navigation bar with the 'LUXE' wordmark left, nav links including Home / Shop / Electronics / Clothing / Accessories, and a user account icon (profile) on the right; then a large hero photograph of a spring fashion model filling most of the viewport with a big heading reading 'Spring Collection 2026' and a subheading plus a 'Shop Now' button overlaid on the photo, and the beginning of product content below. NO developer-tools badge or floating box anywhere in the corners.",
  },
  {
    file: "222-dev-login-clean.png",
    expect: "A screenshot (1024x768) of the LUXE login page served by a DEV server: a centered white auth card on a warm cream background reading 'Welcome back' with 'Log in to your account', a 'Continue with Google' button, an 'or' divider, 'Email' and 'Password' labeled inputs, a 'Log in' button, a 'Forgot password?' link and a sign-up link. The BOTTOM-LEFT CORNER of the viewport is COMPLETELY EMPTY cream background — NO dark developer-tools badge or issue-counter box there (the fix removed it). No error overlays anywhere.",
  },
  {
    file: "223-dev-bottomleft-closeup.png",
    expect: "A small close-up crop (about 256x192 CSS pixels at retina 2x) of the BOTTOM-LEFT corner region of a dev-server login page: pure plain warm-cream background (#FBFAF9-class) with NOTHING painted in it — no box, no badge, no text, no button. Just the empty flat background (the region where a dark '01 Issue' developer-tools badge used to paint before the fix).",
  },
  {
    file: "224-prod-login-strict-csp.png",
    expect: "A screenshot (1024x768) of the LUXE login page served by the PRODUCTION standalone server: a centered white auth card on a warm cream background reading 'Welcome back' with 'Log in to your account', a 'Continue with Google' button, an 'or' divider, 'Email' and 'Password' labeled inputs, a 'Log in' button, a 'Forgot password?' link and a sign-up link — pixel-identical rendering to the dev-server login page (same card, same background, no developer chrome in any corner).",
  },
  {
    file: "225-mobile-nav-open.png",
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

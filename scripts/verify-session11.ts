// Live re-verification of the session-11 remediation against the production
// standalone server on :3000. Mirrors scripts/verify-session10.ts (Playwright
// drives the real UI). Run: bun scripts/verify-session11.ts
import { chromium } from "@playwright/test";

const results: Array<{ check: string; ok: boolean; detail: string }> = [];
const pass = (check: string, ok: boolean, detail: string) => {
  results.push({ check, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${check}: ${detail}`);
};

const browser = await chromium.launch();
const BASE = "http://localhost:3000";

// --- 1. Font smoothing computes auto on every key surface (trap 12) --------
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
for (const path of ["/", "/shop", "/product/wireless-headphones", "/login"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  const smoothing = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue("-webkit-font-smoothing"),
  );
  pass(`body -webkit-font-smoothing is auto on ${path}`, smoothing === "auto", smoothing);
}
// the antialiased utility is gone from the served CSS
const cssHrefs = await page.evaluate(() =>
  [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute("href") ?? ""),
);
let antialiasedRules = 0;
for (const href of cssHrefs) {
  const css = await (await fetch(`${BASE}${href}`)).text();
  antialiasedRules += (css.match(/-webkit-font-smoothing: antialiased/g) ?? []).length;
}
pass("no -webkit-font-smoothing: antialiased rules in the served CSS", antialiasedRules === 0, `${antialiasedRules} rules`);

// --- 2. Hero tab order skips the invisible slides (A11Y-FOCUS-1) -----------
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const carousel = page.locator('[aria-roledescription="carousel"]');
await carousel.locator("a[href]").first().focus();
await page.keyboard.press("Tab");
const stop = await page.evaluate(() => {
  const el = document.activeElement;
  return {
    tag: el?.tagName.toLowerCase() ?? "body",
    label: el?.getAttribute("aria-label") ?? "",
    inHidden: !!el?.closest('[aria-hidden="true"]'),
  };
});
pass(
  "next tab stop after the hero CTA is the prev-arrow button (no hidden-slide anchors)",
  !stop.inHidden && stop.tag === "button" && stop.label === "Previous slide",
  JSON.stringify(stop),
);

// full hero tab walk: (focus sits on prev-arrow after check #2's Tab)
// prev -> next -> dot1..3, then OUT of the hero into section content
const walk: string[] = [];
for (let i = 0; i < 6; i++) {
  walk.push(
    await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute("aria-label") ?? el?.textContent?.trim().slice(0, 14) ?? "body";
    }),
  );
  await page.keyboard.press("Tab");
}
pass(
  "hero tab walk: Previous → Next → 3 dots → section content (no hidden stops)",
  walk[0] === "Previous slide" &&
    walk[1] === "Next slide" &&
    walk.slice(2, 5).every((w) => /^Go to slide/.test(w)) &&
    !/Go to slide/.test(walk[5]),
  walk.join(" > "),
);

// --- 3. The inactive slide containers carry inert in the DOM -------------
// (div[aria-hidden] — the only other aria-hidden elements in the carousel
// are lucide's decorative chevron SVGs: not focusable, no links)
const inertState = await page.evaluate(() => {
  const slides = [...document.querySelectorAll('[aria-roledescription="carousel"] div[aria-hidden]')];
  return slides.map((s) => `${s.hasAttribute("inert") ? "inert" : "active"}:${s.getAttribute("aria-hidden")}`);
});
pass(
  "inactive slide containers are inert (6/6: media + text blocks)",
  inertState.length === 6 && inertState.filter((s) => s.startsWith("inert:true")).length === 4 && inertState.filter((s) => s.startsWith("active:false")).length === 2,
  inertState.join(", "),
);

// --- 4. Resting visual unchanged: hero geometry pins still hold ------------
const h1 = page.locator("main h1").first();
await page.setViewportSize({ width: 1024, height: 900 });
const lh = await h1.evaluate((el) => `${getComputedStyle(el).fontSize}/${getComputedStyle(el).lineHeight}`);
pass("hero h1 metric pin intact at 1024 (trap 10)", lh === "48px/48px", lh);
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
pass("body background pin intact", bodyBg === "rgb(251, 250, 249)", bodyBg);

// --- 5. The body font is the reference's exact woff2 (trap 13) -------------
const fontState = await page.evaluate(async () => {
  await document.fonts.ready;
  const faces = [...new Set([...document.fonts].map((f) => `${f.family} ${f.weight}`))];
  const stack = getComputedStyle(document.body).fontFamily;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = '100px "Plus Jakarta Sans", sans-serif';
  const width = Math.round(ctx.measureText("Handgloves 0123 jam").width);
  return { faces: faces.join("|"), stack, width };
});
pass(
  "loaded faces are exactly Plus Jakarta Sans 200 800 (no Fallback companion)",
  fontState.faces === "Plus Jakarta Sans 200 800",
  fontState.faces,
);
pass(
  "computed body font stack is the reference's exact stack",
  fontState.stack === '"Plus Jakarta Sans", sans-serif',
  fontState.stack,
);
// Live-measured on the reference with the same engine: 1009 (the next/font
// repackaged build measured 1013 — stripped prep table, different hinting).
pass(
  "canvas glyph metrics match the reference (1009, not next/font's 1013)",
  Math.abs(fontState.width - 1009) <= 2,
  String(fontState.width),
);
const fontRes = await page.request.get(`${BASE}/fonts/plus-jakarta-sans.woff2`);
const fontBytes = (await fontRes.body()).byteLength;
pass(
  "the self-hosted reference font file is served intact (27,348 B)",
  fontRes.status() === 200 && fontBytes === 27348,
  `${fontRes.status()} / ${fontBytes}B`,
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks green`);
if (failed.length > 0) {
  console.error("FAILED:", failed.map((f) => f.check).join("; "));
  process.exit(1);
}

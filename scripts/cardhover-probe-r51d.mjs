// Round-51 follow-up probe D: the reference's OTHER backdrop-blur sites —
// the sticky header (backdrop-blur-xl), the hero CTA badge + the carousel
// arrows (backdrop-blur-md) — to settle whether the v3→v4 blur-scale shift
// (sm 4→8, md 12→12, xl 24→24) affects any site beyond the card heart.
// Plus: the reference's addbar hidden-state offset in px (translateY 56px
// confirmed) for the cross-engine translate register.
// Run: node scripts/cardhover-probe-r51d.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(44)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(2500); // hero entrance

line("A. STICKY HEADER — the blur site");
const header = await page.evaluate(() => {
  const h = document.querySelector("header");
  if (!h) return { found: false };
  const cs = getComputedStyle(h);
  return {
    found: true, cls: h.className.slice(0, 120), position: cs.position,
    bg: cs.backgroundColor, backdrop: cs.backdropFilter,
    border: cs.borderBottom, zIndex: cs.zIndex,
  };
});
for (const [k, v] of Object.entries(header)) report(`header.${k}`, v);

line("B. HERO — the CTA badge + the arrows");
const hero = await page.evaluate(() => {
  const badge = document.querySelector("span.rounded-full.mb-4") || [...document.querySelectorAll("span")].find((s) => /shop now|explore|discover/i.test(s.textContent || "") && getComputedStyle(s).backdropFilter !== "none");
  const arrows = [...document.querySelectorAll("button")].filter((b) => {
    const cs = getComputedStyle(b);
    return cs.position === "absolute" && cs.backdropFilter !== "none" && cs.transform !== "none";
  });
  const out = { badge: null, arrows: [] };
  if (badge) {
    const cs = getComputedStyle(badge);
    out.badge = { text: (badge.textContent || "").trim().slice(0, 24), cls: badge.className.slice(0, 110), bg: cs.backgroundColor, backdrop: cs.backdropFilter, radius: cs.borderRadius };
  }
  for (const a of arrows.slice(0, 2)) {
    const cs = getComputedStyle(a);
    out.arrows.push({ cls: a.className.slice(0, 110), bg: cs.backgroundColor, backdrop: cs.backdropFilter, transform: cs.transform, radius: cs.borderRadius });
  }
  return out;
});
report("hero.badge", JSON.stringify(hero.badge));
for (const a of hero.arrows) report("hero.arrow", JSON.stringify(a));

line("C. CARD HEART — re-confirm the 4px (the divergence site)");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const heartBlur = await page.evaluate(() => {
  const link = document.querySelector('a[href^="/product/"]');
  const card = link.closest("div");
  let root = card;
  for (let i = 0; i < 2 && root.parentElement; i++) root = root.parentElement;
  const btns = [...root.querySelectorAll("button")];
  const heart = btns.find((b) => b.querySelector("svg") && !/add to cart/i.test(b.textContent || ""));
  return {
    backdrop: getComputedStyle(heart).backdropFilter,
    cls: heart.className,
  };
});
report("heart.backdrop", heartBlur.backdrop);
report("heart.cls", heartBlur.cls);

line("D. ADDBAR — the hidden offset in px (the translate register)");
const addbarPx = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const wrap = btn.closest("div.absolute");
  const cs = getComputedStyle(wrap);
  const r = wrap.getBoundingClientRect();
  return { transform: cs.transform, height: Math.round(r.height), w: Math.round(r.width), cls: wrap.className.slice(0, 90) };
});
for (const [k, v] of Object.entries(addbarPx)) report(`addbar.${k}`, v);

await browser.close();
console.log("\nPROBE r51d COMPLETE");

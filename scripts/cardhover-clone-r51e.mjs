// Round-51 follow-up probe E: the CLONE's other backdrop-blur sites (the
// header xl, the hero md) — confirming the v3→v4 shift affects ONLY the
// heart's sm — plus the addbar's `translate` property (v4's spelling of
// v3's translateY) and the hovered-card element capture for the cross-side
// pixel diff.
// Run (via battery): bash scripts/battery-runner.sh cardhover-clone-r51e.mjs prod
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const CLONE = "http://localhost:3000";
const OUT = "/tmp/probe-r51e";
mkdirSync(OUT, { recursive: true });

const report = (k, v) => console.log(`  ${k.padEnd(44)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(2500); // hero entrance

line("A. STICKY HEADER — the blur site");
const header = await page.evaluate(() => {
  const h = document.querySelector("header");
  if (!h) return { found: false };
  const cs = getComputedStyle(h);
  return { found: true, cls: h.className.slice(0, 120), position: cs.position, bg: cs.backgroundColor, backdrop: cs.backdropFilter, border: cs.borderBottom, zIndex: cs.zIndex };
});
for (const [k, v] of Object.entries(header)) report(`header.${k}`, v);

line("B. HERO — the CTA badge + the arrows");
const hero = await page.evaluate(() => {
  const badge = document.querySelector("span.rounded-full.mb-4") || [...document.querySelectorAll("span")].find((s) => /up to 40|shop now|explore|discover/i.test(s.textContent || "") && getComputedStyle(s).backdropFilter !== "none");
  const arrows = [...document.querySelectorAll("button")].filter((b) => {
    const cs = getComputedStyle(b);
    return cs.position === "absolute" && cs.backdropFilter !== "none" && (cs.transform !== "none" || cs.translate !== "none");
  });
  const out = { badge: null, arrows: [] };
  if (badge) {
    const cs = getComputedStyle(badge);
    out.badge = { text: (badge.textContent || "").trim().slice(0, 24), backdrop: cs.backdropFilter, bg: cs.backgroundColor, radius: cs.borderRadius };
  }
  for (const a of arrows.slice(0, 2)) {
    const cs = getComputedStyle(a);
    out.arrows.push({ backdrop: cs.backdropFilter, bg: cs.backgroundColor, translate: cs.translate, radius: cs.borderRadius });
  }
  return out;
});
report("hero.badge", JSON.stringify(hero.badge));
for (const a of hero.arrows) report("hero.arrow", JSON.stringify(a));

line("C. CARD HEART + ADDBAR — the v4 spellings");
await page.goto(CLONE + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const heartAddbar = await page.evaluate(() => {
  const link = document.querySelector('a[href^="/product/"]');
  const card = link.closest("div");
  let root = card;
  for (let i = 0; i < 2 && root.parentElement; i++) root = root.parentElement;
  const btns = [...root.querySelectorAll("button")];
  const heart = btns.find((b) => b.querySelector("svg") && !/add to cart/i.test(b.textContent || ""));
  const btn = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const wrap = btn.closest("div.absolute");
  const wr = wrap.getBoundingClientRect();
  return {
    heartBackdrop: getComputedStyle(heart).backdropFilter,
    heartCls: heart.className,
    addbarTransform: getComputedStyle(wrap).transform,
    addbarTranslate: getComputedStyle(wrap).translate,
    addbarHeight: Math.round(wr.height),
    addbarCls: wrap.className.slice(0, 90),
  };
});
for (const [k, v] of Object.entries(heartAddbar)) report(`${k}`, v);

// the revealed translate (hover first)
const firstLink = page.locator('a[href^="/product/"]').first();
const cardEl = firstLink.locator("xpath=ancestor::div[1]");
await cardEl.hover();
await page.waitForTimeout(750);
const revealed = await cardEl.evaluate((el) => {
  const btn = [...el.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const wrap = btn.closest("div.absolute");
  const cs = getComputedStyle(wrap);
  return { transform: cs.transform, translate: cs.translate };
});
report("addbar.revealed.transform", revealed.transform);
report("addbar.revealed.translate", revealed.translate);
await cardEl.screenshot({ path: OUT + "/clone-card-hovered.png" });

await browser.close();
console.log("\nPROBE r51e COMPLETE — captures in " + OUT);

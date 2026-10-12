// Round-53 probe E: the CLICK-behavior corners on BOTH sides —
// (1) the reference's arrow/dot click: wrap-around + does the 5s timer
//     restart after a click? (2) the clone's counterparts.
// Reference part run: node scripts/hero-probe-r53e.mjs ref
// Clone part run via: HERO_PROBE_MODE=clone bash scripts/battery-runner.sh hero-probe-r53e.mjs prod
import { chromium } from "playwright-core";

const MODE = process.env.HERO_PROBE_MODE || process.argv[2] || "ref";
const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(52)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

if (MODE === "ref") {
  const lp = await ctx.newPage();
  await lp.goto(REF + "/login", { waitUntil: "networkidle" });
  await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
  await lp.getByLabel("Password").fill("$Abcd1234");
  await lp.getByRole("button", { name: "Log in", exact: true }).click();
  try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
  await lp.waitForLoadState("networkidle");
  await lp.waitForTimeout(1500);
  await lp.close();
}

const page = await ctx.newPage();
await page.goto(MODE === "ref" ? REF + "/" : "http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// side-independent active-slide reader
const ACTIVE_JS = `(() => {
  const isHeroImg = (im) => {
    const r = im.getBoundingClientRect();
    const p = im.parentElement ? getComputedStyle(im.parentElement) : null;
    return r.height > 200 && r.width > 600 && p && p.position === "absolute" && parseFloat(p.opacity || "1") > 0.5;
  };
  const imgs = [...document.querySelectorAll("img")].filter(isHeroImg);
  return imgs.length ? (imgs[0].currentSrc || imgs[0].src).split("/").pop() : null;
})()`;

line(`A. [${MODE}] LOCATE THE PREV/NEXT ARROWS (real click)`);
// both sides: absolute 40px buttons with svg — prev = leftmost
const btns = page.locator("button");
const n = await btns.count();
let prevLoc = null, nextLoc = null, dots = [];
for (let i = 0; i < n; i++) {
  const b = btns.nth(i);
  const info = await b.evaluate((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const svg = el.querySelector("svg");
    return { pos: cs.position, h: Math.round(r.height), w: Math.round(r.width), hasSvg: !!svg, x: Math.round(r.x), txt: (el.textContent || "").trim().slice(0, 20), radius: cs.borderRadius };
  }).catch(() => null);
  if (!info) continue;
  if (info.pos === "absolute" && info.hasSvg && info.h === 40 && info.w === 40) {
    if (info.x < 640 && !prevLoc) prevLoc = b;
    if (info.x >= 640 && !nextLoc) nextLoc = b;
  }
  // dots: 8px-tall rounded buttons
  if (info.h === 8 && info.w <= 32 && info.radius !== "0px") dots.push(b);
}
report("locate.prevFound", !!prevLoc);
report("locate.nextFound", !!nextLoc);
report("locate.dotCount", dots.length);

if (prevLoc && nextLoc) {
  line(`B. [${MODE}] THE ARROW WRAP-AROUND — next x3 from slide 1`);
  const s0 = await page.evaluate(ACTIVE_JS);
  await nextLoc.click();
  await page.waitForTimeout(900);
  const s1 = await page.evaluate(ACTIVE_JS);
  await nextLoc.click();
  await page.waitForTimeout(900);
  const s2 = await page.evaluate(ACTIVE_JS);
  await nextLoc.click();
  await page.waitForTimeout(900);
  const s3 = await page.evaluate(ACTIVE_JS); // should wrap back to s0
  report("wrap.start", s0);
  report("wrap.afterNext1", s1);
  report("wrap.afterNext2", s2);
  report("wrap.afterNext3_wrapped", s3);
  report("wrap.wrappedToStart", s3 === s0);

  line(`C. [${MODE}] THE PREV ARROW — wraps backward`);
  await prevLoc.click();
  await page.waitForTimeout(900);
  const sp = await page.evaluate(ACTIVE_JS); // from s0 -> should be the LAST slide
  report("prev.fromStart_toLast", sp);
  report("prev.wrapped", sp === s2);

  line(`D. [${MODE}] THE DOT CLICK + TIMER RESTART — dot 3, then measure the next flip`);
  if (dots.length >= 3) {
    await dots[2].click();
    await page.waitForTimeout(600);
    const afterDot = await page.evaluate(ACTIVE_JS);
    const t0 = Date.now();
    let flipped = false;
    while (Date.now() - t0 < 9000) {
      await page.waitForTimeout(400);
      const cur = await page.evaluate(ACTIVE_JS);
      if (cur !== afterDot) { flipped = true; break; }
    }
    report("dotClick.slide3Activated", afterDot !== sp);
    report("dotClick.nextFlipWithin9s", flipped);
    report("dotClick.flipLatencyMs", flipped ? Date.now() - t0 : null);
  }
}

await browser.close();
console.log(`\n[${MODE.toUpperCase()}] CLICK-BEHAVIOR PROBE COMPLETE`);

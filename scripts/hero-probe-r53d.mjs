// Round-53 REFERENCE probe D: settle the three DOM-swap artifacts from r53c —
// (1) the reference's auto-advance cadence with RE-QUERY polling (captured
// nodes go stale when the reference swaps slides in the DOM), (2) the
// reference's hover-pause behavior, (3) the slide-parent transition census
// (does ANY reference slide carry a transition?), (4) the text-block
// transition. Run: node scripts/hero-probe-r53d.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(52)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

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
await page.waitForTimeout(1500);

line("A. THE SLIDE-PARENT TRANSITION CENSUS — every hero slide container");
const census = await page.evaluate(() => {
  // hero = the first section with absolutely-positioned full-bleed imgs
  const imgs = [...document.querySelectorAll("img")].filter((im) => {
    const r = im.getBoundingClientRect();
    const p = im.parentElement ? getComputedStyle(im.parentElement) : null;
    return r.height > 200 && r.width > 600 && p && p.position === "absolute";
  });
  const heroRoot = imgs.length ? imgs[0].closest("section, main > div, div.relative") : null;
  const heroImgs = heroRoot ? [...heroRoot.querySelectorAll("img")].filter((im) => im.getBoundingClientRect().height > 100) : imgs;
  return {
    heroImgCount: heroImgs.length,
    parents: heroImgs.slice(0, 6).map((im) => {
      const p = im.parentElement;
      const cs = getComputedStyle(p);
      return { cls: p.className, transition: cs.transitionDuration + "/" + cs.transitionProperty, opacity: cs.opacity, ariaHidden: p.getAttribute("aria-hidden"), inert: p.inert };
    }),
    heroRootCls: heroRoot ? heroRoot.className : null,
    // the text block: the container of the promo badge / h1
    textBlock: (() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      let blk = h1.parentElement;
      const cs = getComputedStyle(blk);
      return { cls: blk.className, transition: cs.transitionDuration + "/" + cs.transitionProperty, opacity: cs.opacity, transform: cs.transform };
    })(),
  };
});
for (const [k, v] of Object.entries(census)) report(`census.${k}`, JSON.stringify(v).slice(0, 500));

line("B. THE AUTO-ADVANCE CADENCE — re-query polling (DOM-swap safe)");
const cadence = await page.evaluate(async () => {
  const activeImgSrc = () => {
    const imgs = [...document.querySelectorAll("img")].filter((im) => {
      const r = im.getBoundingClientRect();
      const p = im.parentElement ? getComputedStyle(im.parentElement) : null;
      return r.height > 200 && r.width > 600 && p && p.position === "absolute" && parseFloat(p.opacity || "1") > 0.5;
    });
    return imgs.length ? imgs[0].currentSrc.split("/").pop() : null;
  };
  const t0 = Date.now();
  const marks = [];
  let last = activeImgSrc();
  while (marks.length < 3) {
    await new Promise((r) => setTimeout(r, 250));
    const cur = activeImgSrc();
    if (cur !== last && cur) { marks.push(Date.now() - t0); last = cur; }
    if (Date.now() - t0 > 25000) break;
  }
  const deltas = marks.map((m, i) => (i === 0 ? m : m - marks[i - 1]));
  return { flipsAtMs: marks, deltasMs: deltas };
});
report("cadence.flipsAtMs", JSON.stringify(cadence.flipsAtMs));
report("cadence.deltasMs", JSON.stringify(cadence.deltasMs));

line("C. THE HOVER-PAUSE — real-mouse dwell with re-query (7s)");
const bigImg = page.locator("img").first();
const imgs = await page.locator("img").all();
let big = null;
for (const im of imgs) {
  const bb = await im.boundingBox();
  if (bb && bb.height > 200 && bb.width > 600) { big = im; break; }
}
if (big) {
  const bb = await big.boundingBox();
  const readActive = () => page.evaluate(() => {
    const els = [...document.querySelectorAll("img")].filter((im) => {
      const r = im.getBoundingClientRect();
      const p = im.parentElement ? getComputedStyle(im.parentElement) : null;
      return r.height > 200 && r.width > 600 && p && p.position === "absolute" && parseFloat(p.opacity || "1") > 0.5;
    });
    return els.length ? els[0].currentSrc.split("/").pop() : null;
  });
  const before = await readActive();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(7000);
  const after = await readActive();
  report("pause.srcBeforeDwell", before);
  report("pause.srcAfter7sDwell", after);
  report("pause.paused", before === after);
  // leave + observe the resume
  await page.mouse.move(5, 5);
  const resumeAt = Date.now();
  let resumed = false;
  while (Date.now() - resumeAt < 8000) {
    await page.waitForTimeout(500);
    const now = await readActive();
    if (now !== after) { resumed = true; break; }
  }
  report("pause.resumedAfterLeave", resumed);
  report("pause.resumeLatencyMs", resumed ? Date.now() - resumeAt : null);
}

await browser.close();
console.log("\nREFERENCE PROBE D COMPLETE");

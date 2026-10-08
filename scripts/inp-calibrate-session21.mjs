// Round-21 INP E2E-condition calibration (the session-15/16/17/18
// discipline): runs the 5-interaction INP protocol against the EXACT
// conditions the standing gate will run under — the :3100 standalone
// production server, the e2e DB, GUEST contexts (storageState opt-out —
// the zero-DB-pollution design: the guest cart/wishlist live in the
// context's cookie token and die with it; no cross-spec coupling with the
// cart/wishlist specs that assert absolute counts), at BOTH viewports
// (desktop 1280x720 + the exact devices["iPhone 14"] descriptor
// 390x664 DPR 3 touch).
//
// Run: node scripts/inp-calibrate-session21.mjs   (:3100 e2e server must be up)
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3100";

const COLLECT = () => {
  window.__evts = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.interactionId > 0) {
          window.__evts.push({
            name: e.name,
            startTime: Math.round(e.startTime),
            duration: e.duration,
            interactionId: e.interactionId,
          });
        }
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 0 });
  } catch { /* engine without event timing */ }
};

const DESKTOP = { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 };
const IPHONE = {
  viewport: { width: 390, height: 664 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};

/** The 5-interaction protocol, guest context, one viewport. */
const protocol = async (browser, vp) => {
  const out = [];
  const ctx = await browser.newContext({ ...vp });
  await ctx.addInitScript(COLLECT);

  // --- surface 1+2: PDP add-to-cart + wishlist heart -----------------------
  {
    const page = await ctx.newPage();
    await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(800);
    await page.locator('div.flex.items-center.gap-4.mb-4 button', { hasText: "Add to Cart" }).click();
    await page.waitForTimeout(2000);
    await page.locator("div.flex.items-center.gap-4.mb-4 button").last().click();
    await page.waitForTimeout(2000);
    out.push({ surface: "pdp-atc+heart", evts: await page.evaluate(() => window.__evts) });
    await page.close();
  }

  // --- surface 3: home search typing ---------------------------------------
  {
    const page = await ctx.newPage();
    await page.goto(CLONE + "/", { waitUntil: "networkidle" });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(800);
    await page.locator("header button:has(svg.lucide-search)").first().click();
    await page.waitForTimeout(600);
    await page.locator("header input").first().click();
    for (const ch of ["h", "e", "a", "d"]) {
      await page.keyboard.type(ch, { delay: 0 });
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1200);
    out.push({ surface: "search-typing", evts: await page.evaluate(() => window.__evts) });
    await page.close();
  }

  // --- surface 4: cart drawer stepper --------------------------------------
  {
    const page = await ctx.newPage();
    await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.locator('div.flex.items-center.gap-4.mb-4 button', { hasText: "Add to Cart" }).click();
    await page.waitForTimeout(1500);
    await page.locator("header button:has(svg.lucide-shopping-bag)").first().click();
    await page.waitForTimeout(900);
    await page.locator('[role="dialog"] div.gap-2 button:has(svg.lucide-plus)').first().click();
    await page.waitForTimeout(2000);
    out.push({ surface: "drawer-stepper", evts: await page.evaluate(() => window.__evts) });
    await page.close();
  }

  // --- surface 5: carousel next ---------------------------------------------
  {
    const page = await ctx.newPage();
    await page.goto(CLONE + "/", { waitUntil: "networkidle" });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(800);
    await page.locator('button:has(svg.lucide-chevron-right)').first().click();
    await page.waitForTimeout(1500);
    out.push({ surface: "carousel-next", evts: await page.evaluate(() => window.__evts) });
    await page.close();
  }

  await ctx.close();
  return out;
};

const summarize = (evts) => {
  const byId = new Map();
  for (const e of evts) {
    const cur = byId.get(e.interactionId) ?? { names: [], max: 0 };
    cur.names.push(e.name);
    cur.max = Math.max(cur.max, e.duration);
    byId.set(e.interactionId, cur);
  }
  const rows = [...byId.values()].map((r) => ({ events: r.names.join(","), maxMs: r.max }));
  return { rows, inp: rows.length ? Math.max(...rows.map((r) => r.maxMs)) : 0 };
};

const browser = await chromium.launch();
for (const [vp, label] of [[DESKTOP, "DESKTOP 1280x720"], [IPHONE, "iPhone 14 (390x664)"]]) {
  for (let run = 1; run <= 2; run++) {
    const res = await protocol(browser, vp);
    console.log(`\n===== ${label} — run ${run} =====`);
    for (const r of res) {
      const s = summarize(r.evts);
      console.log(`${s.surface ?? ""}${r.surface.padEnd(18)} INP=${String(s.inp).padStart(4)}ms (${s.rows.length} ints)`);
    }
  }
}
await browser.close();

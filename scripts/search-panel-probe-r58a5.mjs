// Round-58 probe A5: the reference's search-panel EXIT — does the strip
// fade out (or animate) on close, or does it unmount instantly? Sample the
// header's input/strip presence + opacity at 60ms intervals right after
// the X click.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await withTimeout(lp.goto(REF + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login-nav");
} catch {}
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await withTimeout(page.goto(REF + "/", { waitUntil: "domcontentloaded", timeout: 30000 }), 35000, "home-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);

// open + settle
await page.locator("header button").nth(1).click();
await page.waitForTimeout(1200);

// find the X button's center
const xRect = await page.evaluate(() => {
  const form = document.querySelector("header form");
  const btns = form ? [...form.querySelectorAll("button")] : [];
  const ghost = btns[btns.length - 1];
  const r = ghost.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});

// click the X and immediately sample the exit frames
const frames = await page.evaluate(async (pos) => {
  const out = [];
  const t0 = performance.now();
  // dispatch a real click via MouseEvent on the X
  const el = document.elementFromPoint(pos.cx, pos.cy);
  el?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  for (let i = 0; i < 14; i++) {
    const header = document.querySelector("header");
    const input = header?.querySelector("input");
    const strip = header?.querySelector("div[class*='border-t']");
    out.push({
      t: Math.round(performance.now() - t0),
      inputInDom: !!input,
      inputVisible: input ? !!(input.offsetWidth || input.offsetHeight) : false,
      stripOp: strip ? getComputedStyle(strip).opacity : null,
      stripTf: strip ? getComputedStyle(strip).transform.slice(0, 40) : null,
      stripH: strip ? Math.round(strip.getBoundingClientRect().height) : null,
    });
    await new Promise((r) => setTimeout(r, 60));
  }
  return out;
}, xRect);
console.log("EXIT FRAMES:", JSON.stringify(frames));

await browser.close();

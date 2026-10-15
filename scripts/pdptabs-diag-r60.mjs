// Round-60 spec diagnostics: (a) the PDP's focusable census in DOM order
// (the Tab-walk calibration), (b) the P6 click's xhr/fetch URLs (the
// prefetch pollution question), (c) the walk's actual landing.
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await withTimeout(lp.goto(CLONE + "/login", { waitUntil: "domcontentloaded" }), 25000, "login");
await withTimeout(lp.getByLabel("Email").fill("john@example.com"), 15000, "email");
await withTimeout(lp.getByLabel("Password").fill("Demo1234!"), 15000, "pw");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "nav");
} catch {}
await lp.waitForTimeout(1200);
await lp.close();

const page = await ctx.newPage();
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// (a) the focusable census (DOM order)
const census = await page.evaluate(() => {
  const all = [...document.querySelectorAll("a[href], button, input, [tabindex]:not([tabindex='-1'])")];
  return all
    .filter((el) => {
      if (el.closest("[aria-hidden='true']")) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== "hidden" && cs.display !== "none";
    })
    .map((el, i) => ({
      i,
      tag: el.tagName,
      role: el.getAttribute("role"),
      text: (el.textContent || "").trim().slice(0, 22),
      tab: el.tabIndex,
    }));
});
console.log("(a) FOCUSABLES:", census.length);
console.log(JSON.stringify(census, null, 1).slice(0, 3000));

// (b) the click's request URLs
const urls = [];
page.on("request", (req) => {
  if (req.resourceType() === "xhr" || req.resourceType() === "fetch") urls.push(req.url().slice(0, 90));
});
await page.locator('[role="tab"]', { hasText: "Reviews" }).click();
await page.waitForTimeout(700);
console.log("(b) CLICK-ERA REQUESTS:", JSON.stringify(urls, null, 1));

// (c) the walk: blur + Tab until a role=tab lands (cap 80)
await page.evaluate(() => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(200);
let landed = null;
for (let i = 0; i < 80; i++) {
  await page.keyboard.press("Tab");
  const st = await page.evaluate(() => {
    const el = document.activeElement;
    if (el && el.getAttribute("role") === "tab") return (el.textContent || "").trim();
    return null;
  });
  if (st) { landed = { step: i + 1, text: st }; break; }
}
console.log("(c) WALK LANDED:", JSON.stringify(landed));

await browser.close();
console.log("DIAG COMPLETE");

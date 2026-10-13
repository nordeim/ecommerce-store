// Round-57 CLONE probe C4: the full focus-indicator read at the back
// link's stop (the r57c3 truncation hid the ring layer's dimensions —
// the visible-vs-invisible judgment depends on them). One real Tab,
// then the FULL box-shadow + outline of the active element.
// Run (via battery): bash scripts/battery-runner.sh account-orderdetail-focus-r57c4.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const log = (m) => console.log(m);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1200);
await lp.close();
log("clone login ok");

const page = await ctx.newPage();
await page.goto(CLONE + "/account", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("tab", { name: "Orders" }).click();
await page.waitForTimeout(600);
await page.getByRole("link", { name: "ORD-2026-002" }).click();
await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
await page.waitForTimeout(900);

await page.keyboard.press("Tab");
await page.waitForTimeout(120);
const full = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return {
    stop: (el.textContent || "?").trim().slice(0, 30),
    focusVisible: el.matches(":focus-visible"),
    outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
    boxShadowFULL: cs.boxShadow,
    cls: (el.className || "").toString(),
  };
});
log(JSON.stringify(full, null, 1));

await browser.close();
log("== r57c4 complete ==");

// Round-57 CLONE probe C3: the order-detail's focus states via REAL
// keyboard Tab presses (the r57c2 lesson: a synthetic keydown + script
// .focus() never trips the :focus-visible heuristic for links — only a
// real keyboard event through the input pipeline does; the INPUT stop
// matched only because text inputs always match). This walk presses
// real Tabs from the document start and reads the computed indicator at
// each stop; the back link (stop ~13) and the tracking link (stop ~14)
// are the detail's own pair.
// Run (via battery): bash scripts/battery-runner.sh account-orderdetail-focus-r57c3.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const log = (m) => console.log(m);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// ---- login ----
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

// ---- ORD-2026-002 (has the tracking link) ----
const page = await ctx.newPage();
await page.goto(CLONE + "/account", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("tab", { name: "Orders" }).click();
await page.waitForTimeout(600);
await page.getByRole("link", { name: "ORD-2026-002" }).click();
await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
await page.waitForTimeout(900);

// REAL Tab walk: press, then read. Up to 25 presses, hard-bound.
for (let i = 0; i < 25; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(80);
  const read = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { stop: "body", focused: false };
    const cs = getComputedStyle(el);
    return {
      stop: (el.textContent || el.getAttribute("aria-label") || "?").trim().slice(0, 30) || "(chrome)",
      tag: el.tagName,
      focusVisible: el.matches(":focus-visible"),
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor.slice(0, 40),
      ring: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 110),
    };
  });
  log(`#${i + 1} ` + JSON.stringify(read));
  if (read.stop === "body") break;
}

await browser.close();
log("== r57c3 complete ==");

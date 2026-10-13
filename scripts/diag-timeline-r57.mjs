// Round-57 diagnostic: the timeline row count on the DEV DB (:3001) —
// the capture probes read 1 circle while the spec (e2e DB) counted 3.
// Which is right? Dump the timeline card's HTML + the events.
// Run (via battery): bash scripts/battery-runner.sh diag-timeline-r57.mjs prod
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
await lp.waitForTimeout(1200);
await lp.close();

for (const ord of ["001", "002"]) {
  const page = await ctx.newPage();
  await page.goto(CLONE + "/account", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(400);
  await page.getByRole("link", { name: `ORD-2026-${ord}` }).click();
  await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
  await page.waitForTimeout(700);
  const diag = await page.evaluate(() => {
    const tl = [...document.querySelectorAll("main h2")].find((h) => h.textContent === "Timeline")?.parentElement;
    const ol = tl?.querySelector("ol");
    const lis = ol ? [...ol.children] : [];
    return {
      circles: document.querySelectorAll("main span.h-8.w-8").length,
      lis: lis.length,
      rows: lis.map((li) => ({
        label: li.querySelector(".font-medium")?.textContent,
        icon: li.querySelector("svg")?.getAttribute("class")?.slice(0, 40),
      })),
      emptyText: tl?.querySelector("p")?.textContent,
    };
  });
  log(`ORD-2026-${ord}: ` + JSON.stringify(diag, null, 1));
  await page.close();
}
await browser.close();
log("== diag complete ==");

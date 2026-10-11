// Round-42: open the Next dev overlay and read the "01 Issue" — identify the
// dev-time issue the badge reports.
import { chromium } from "playwright-core";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
const consoleMsgs = [];
page.on("console", (m) => consoleMsgs.push(`[${m.type()}] ${m.text().slice(0, 200)}`));
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// click the badge inside the shadow root
const clicked = await page.evaluate(() => {
  const portal = document.querySelector("nextjs-portal");
  if (!portal?.shadowRoot) return "no portal";
  const badge = portal.shadowRoot.querySelector("[data-next-badge-root]");
  if (!badge) return "no badge";
  badge.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
  return "clicked";
});
console.log("badge:", clicked);
await page.waitForTimeout(2000);

// read the issue panel inside the shadow root
const issues = await page.evaluate(() => {
  const portal = document.querySelector("nextjs-portal");
  if (!portal?.shadowRoot) return "no portal";
  const root = portal.shadowRoot;
  const texts = [...root.querySelectorAll("div,span,h1,h2,h3,p,li")]
    .map((n) => n.textContent?.trim().replace(/\s+/g, " "))
    .filter((t) => t && t.length > 8 && t.length < 500);
  return [...new Set(texts)].slice(0, 25);
});
console.log("OVERLAY:", JSON.stringify(issues, null, 1));
console.log("\nCONSOLE:", JSON.stringify(consoleMsgs.slice(0, 15), null, 1));
await browser.close();

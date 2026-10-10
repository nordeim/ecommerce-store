// Session-35: probe the live DOM BEFORE the VLM run (the round-32/33/34
// lesson: describe reality, not intention). Verifies each captured surface
// carries the deliverable's state in the LIVE DOM, not just in the pixels.
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";

const settle = async (page) => {
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
};

const gotoDetail = async (page, number) => {
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(900);
  await page.getByRole("link", { name: number }).click();
  await page.waitForURL(new RegExp(`/account/orders/[a-z0-9]+$`), { timeout: 10_000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lp = await ctx.newPage();
await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
await lp.waitForLoadState("networkidle");
await lp.close();

const report = {};

// 186 — the 001 detail: the timeline card + rows + no attribution
{
  const page = await ctx.newPage();
  await gotoDetail(page, "ORD-2026-001");
  const timeline = page.locator("ol").filter({ has: page.getByText("Order placed", { exact: true }) });
  report["186-ord001"] = {
    timelineCard: (await page.getByRole("heading", { name: "Timeline" }).count()) === 1,
    rowCount: await timeline.locator("li").count(),
    labels: await timeline.locator("p.font-medium").allTextContents(),
    firstTimestamp: (await timeline.locator("p.text-xs").first().textContent())?.trim(),
    attributionLeak: await page.getByText(/by admin@luxestore\.com/).count(),
    noteLeak: await page.getByText("Seeded demo order").count(),
  };
  await page.close();
}

// 187 — the 004 detail: the money story in the timeline + the money line
{
  const page = await ctx.newPage();
  await gotoDetail(page, "ORD-2026-004");
  const timeline = page.locator("ol").filter({ has: page.getByText("Order placed", { exact: true }) });
  report["187-ord004"] = {
    labels: await timeline.locator("p.font-medium").allTextContents(),
    moneyLine: (await page.getByText("Payment refunded — the amount has been returned to your original payment method.").count()) === 1,
    pill: await page.locator("header span, h1 + span").filter({ hasText: "Cancelled" }).count(),
  };
  await page.close();
}

// 188 — the owner's confirmation: the deep-linked href
{
  const page = await ctx.newPage();
  await page.goto(`${BASE}/checkout/success?order=ORD-2026-004`, { waitUntil: "networkidle" });
  await settle(page);
  report["188-confirmation"] = {
    heading: (await page.getByRole("heading", { name: "Order Confirmed" }).count()) === 1,
    viewOrdersHref: await page.getByRole("link", { name: "View Orders" }).getAttribute("href"),
    deepLinkMatches: /^\/account\/orders\/[a-z0-9]+$/.test(
      (await page.getByRole("link", { name: "View Orders" }).getAttribute("href")) ?? "",
    ),
  };
  await page.close();
}

// 189 — the 002 detail: the minimal timeline
{
  const page = await ctx.newPage();
  await gotoDetail(page, "ORD-2026-002");
  const timeline = page.locator("ol").filter({ has: page.getByText("Order placed", { exact: true }) });
  report["189-ord002"] = {
    rowCount: await timeline.locator("li").count(),
    labels: await timeline.locator("p.font-medium").allTextContents(),
    pillInTransit: (await page.getByText("In Transit", { exact: true }).count()) >= 1,
  };
  await page.close();
}

// 190 — home: the standing anchor (hero painted)
{
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  report["190-home"] = {
    heroPainted: await page.evaluate(() => {
      const img = [...document.querySelectorAll("img")].find((i) => {
        const b = i.getBoundingClientRect();
        return b.width > 500 && b.y < 300;
      });
      return img ? img.naturalWidth > 0 : false;
    }),
    h1: await page.locator("h1").first().textContent(),
  };
  await page.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));

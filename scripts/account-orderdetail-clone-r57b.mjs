// Round-57 CLONE probe B: the customer order-detail's computed geometry —
// the sweep's fifteenth installment (the order-detail's final deep
// corners, deferred six times). The reference has NO detail surface
// (r57a re-verified live: the rows link nowhere, the direct URLs 404) —
// so the ground truth is the clone's OWN family vocabulary, measured
// where the reference DOES carry the surfaces: the pill (STATUS_STYLES,
// the reference's measured orders-tab chip), the row/card language, and
// the page chrome. This probe captures:
//   1. ORD-2026-001 (delivered, 2 items): the header row (back button,
//      h1, pill computed, total), the 2-col grid, both cards, the item
//      rows, the totals block, the timeline circles — full computed sets
//   2. ORD-2026-002 (in-transit): the tracking line + its link's hover
//      state, the delivery estimate, the in-transit pill
//   3. The mobile pass at 375w: the grid collapse, the header wrap
//   4. The interactions: the back button hover, the tracking-link hover
// Run (via battery): bash scripts/battery-runner.sh account-orderdetail-clone-r57b.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const log = (m) => console.log(m);

const browser = await chromium.launch();

async function detailWalk(ctx, w, label) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(CLONE + "/account", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-001" }).click();
  await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
  await page.waitForTimeout(900);

  log(`\n===== ${label} (${w}px) — ORD-2026-001 =====`);
  const geo = await page.evaluate(() => {
    const main = document.querySelector("main");
    const container = main?.querySelector(".max-w-5xl");
    const headerRow = [...(main?.querySelectorAll("div") || [])].find((d) => d.className.includes("flex-wrap"));
    const pill = headerRow?.querySelector("span.inline-flex");
    const h1 = headerRow?.querySelector("h1");
    const total = headerRow?.querySelector(".ml-auto");
    const back = headerRow?.querySelector("a");
    const grid = [...(main?.querySelectorAll("div") || [])].find((d) => /grid md:grid-cols-2/.test(d.className));
    const cards = grid ? [...grid.children] : [];
    const itemsCard = [...(main?.querySelectorAll("div") || [])].find((d) => /rounded-2xl/.test(d.className) && d.querySelector("h2")?.textContent === "Items");
    const itemRows = itemsCard ? [...itemsCard.querySelectorAll("div")].filter((d) => d.className.includes("flex items-center gap-4 p-4 rounded-xl")) : [];
    const totals = itemsCard?.querySelector(".border-t");
    const timelineCard = [...(main?.querySelectorAll("div") || [])].find((d) => d.querySelector("h2")?.textContent === "Timeline");
    const circles = timelineCard ? [...timelineCard.querySelectorAll("span")].filter((s) => s.className.includes("h-8 w-8")) : [];
    const comp = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        cls: (el.className || "").toString().slice(0, 170),
        c: {
          display: cs.display, gridTemplateColumns: cs.gridTemplateColumns, gap: cs.gap,
          padding: cs.padding, margin: cs.margin, radius: cs.borderRadius,
          bg: cs.backgroundColor, border: cs.border, shadow: cs.boxShadow.slice(0, 60),
          font: cs.fontSize + "/" + cs.fontWeight, color: cs.color, maxW: cs.maxWidth,
        },
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      };
    };
    return {
      container: comp(container),
      headerRow: comp(headerRow),
      back: comp(back),
      h1: comp(h1),
      pill: comp(pill),
      total: comp(total),
      grid: comp(grid),
      paymentCard: comp(cards[0]),
      cardH2: comp(cards[0]?.querySelector("h2")),
      cardDL: comp(cards[0]?.querySelector("dl")),
      itemRow: comp(itemRows[0]),
      itemImg: comp(itemRows[0]?.querySelector("img")),
      itemName: comp(itemRows[0]?.querySelector(".font-medium")),
      itemQty: comp(itemRows[0]?.querySelector(".text-muted-foreground")),
      lineTotal: comp(itemRows[0]?.querySelector(".font-semibold")),
      totalsBlock: comp(totals),
      timelineCircle: comp(circles[0]),
      timelineIcon: comp(circles[0]?.querySelector("svg")),
      timelineLabel: comp(circles[0]?.parentElement?.querySelector(".font-medium")),
      timelineDate: comp(circles[0]?.parentElement?.querySelector(".text-xs")),
    };
  });
  for (const [k, v] of Object.entries(geo)) log(`${k}: ${v ? JSON.stringify(v) : "ABSENT"}`);
  await page.close();
  return geo;
}

// ---- login (the demo user) + the 1024w walk ----
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

const g1024 = await detailWalk(ctx, 1024, "desktop");
const g375 = await detailWalk(ctx, 375, "mobile");

// ---- ORD-2026-002: the tracking line + interactions (1024w) ----
const page = await ctx.newPage();
await page.setViewportSize({ width: 1024, height: 768 });
await page.goto(CLONE + "/account", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("tab", { name: "Orders" }).click();
await page.waitForTimeout(600);
await page.getByRole("link", { name: "ORD-2026-002" }).click();
await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
await page.waitForTimeout(900);
log("\n===== ORD-2026-002 (in-transit): tracking + estimate + states =====");
const transit = await page.evaluate(() => {
  const main = document.querySelector("main");
  const track = main?.querySelector('[data-testid="tracking-line"]');
  const est = main?.querySelector('[data-testid="delivery-window"]');
  const link = track?.querySelector("a");
  const pill = [...(main?.querySelectorAll("span") || [])].find((s) => s.textContent === "In Transit");
  const comp = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      cls: (el.className || "").toString().slice(0, 170),
      c: {
        display: cs.display, padding: cs.padding, margin: cs.margin, radius: cs.borderRadius,
        bg: cs.backgroundColor, color: cs.color, border: cs.border, font: cs.fontSize + "/" + cs.fontWeight,
        textDecoration: cs.textDecorationLine, mt: cs.marginTop, pt: cs.paddingTop,
      },
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
      text: (el.textContent || "").slice(0, 80),
    };
  };
  return { trackingLine: comp(track), estimate: comp(est), trackingLink: comp(link), inTransitPill: comp(pill) };
});
for (const [k, v] of Object.entries(transit)) log(`${k}: ${v ? JSON.stringify(v) : "ABSENT"}`);

// The hover states: the tracking link + the back button (real mouse)
const link = page.locator('[data-testid="tracking-line"] a');
if (await link.count()) {
  await link.hover();
  await page.waitForTimeout(400);
  const linkHover = await page.evaluate(() => {
    const a = document.querySelector('[data-testid="tracking-line"] a');
    const cs = getComputedStyle(a);
    return { textDecorationLine: cs.textDecorationLine, color: cs.color };
  });
  log("trackingLink hover: " + JSON.stringify(linkHover));
}
const back = page.getByRole("link", { name: "← Orders" });
await back.hover();
await page.waitForTimeout(400);
const backHover = await page.evaluate(() => {
  const a = [...document.querySelectorAll("main a")].find((x) => x.textContent?.includes("← Orders"));
  const cs = getComputedStyle(a);
  return { bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius };
});
log("backButton hover: " + JSON.stringify(backHover));
await page.close();

await browser.close();
log("\n== r57b complete ==");

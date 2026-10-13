// Round-57 REFERENCE probe A: the account orders surface — the sweep's
// fifteenth installment (the order-detail's final deep corners, deferred
// six times). The reference's orders tab is the ONLY comparable surface
// (the detail route is a clone-only superset — the prior audits read the
// rows as "hardcoded rows that link nowhere"). This probe re-verifies
// that on the LIVE reference and captures the ground truth the clone's
// detail composes from:
//   1. the orders tab's row anatomy (outerHTML, computed, geometry)
//   2. the LINKING question: does any row/number link anywhere (href,
//      onclick, router push)? does a detail surface exist at any URL?
//   3. the pill vocabulary the detail's header composes (STATUS_STYLES
//      was measured from these rows in session-34) — re-verified live
//   4. the account chrome's geometry around the tab panel (the layout
//      the detail page composes with the max-w-5xl convention)
// Run: node scripts/account-orderdetail-probe-r57a.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const log = (m) => console.log(m);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// ---- login (the standing operator account) ----
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();
log("== login done ==");

const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
await page.goto(REF + "/account", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// ---- PHASE 1: the Orders tab — the row anatomy ----
await page.getByRole("tab", { name: /orders/i }).first().click();
await page.waitForTimeout(1200);
log("\n== PHASE 1: the orders tab rows ==");
const rows = await page.evaluate(() => {
  const out = [];
  // The VISIBLE tab panel (multiple tabpanels exist; the first is the
  // hidden Profile one — the r57a lesson: select by visibility).
  const panels = [...document.querySelectorAll('[role="tabpanel"]')].filter((p) => getComputedStyle(p).display !== "none");
  const panel = panels[0] || document.body;
  window.__panel = panel;
  const seen = new Set();
  const walk = (el) => {
    if (!(el instanceof HTMLElement)) return;
    const t = (el.textContent || "").trim();
    if (/(^|\s)(ORD-|#)\d/.test(t) && t.length < 400 && !seen.has(el)) {
      seen.add(el);
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out.push({
        tag: el.tagName,
        cls: el.className,
        text: t.slice(0, 160),
        computed: {
          display: cs.display, justifyContent: cs.justifyContent, alignItems: cs.alignItems,
          gap: cs.gap, padding: cs.padding, margin: cs.margin, borderRadius: cs.borderRadius,
          background: cs.backgroundColor, border: cs.border, fontSize: cs.fontSize,
          fontWeight: cs.fontWeight, color: cs.color,
        },
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        linksInside: [...el.querySelectorAll("a")].map((a) => ({ href: a.getAttribute("href"), text: (a.textContent || "").trim().slice(0, 60) })),
        onclickAttr: el.getAttribute("onclick"),
        role: el.getAttribute("role"),
        cursor: cs.cursor,
      });
    }
    for (const c of el.children) walk(c);
  };
  walk(panel);
  // keep the innermost row-like containers (smallest text boxes)
  return out.slice(0, 8);
});
for (const r of rows) log(JSON.stringify(r));

// ---- PHASE 2: the LINKING question ----
log("\n== PHASE 2: the linking question ==");
const linking = await page.evaluate(() => {
  const panels = [...document.querySelectorAll('[role="tabpanel"]')].filter((p) => getComputedStyle(p).display !== "none");
  const panel = panels[0] || document.body;
  const anchors = [...panel.querySelectorAll("a")].map((a) => ({
    href: a.getAttribute("href"), text: (a.textContent || "").trim().slice(0, 80),
    cls: (a.className || "").slice(0, 120),
  }));
  const buttons = [...panel.querySelectorAll("button")].map((b) => ({
    text: (b.textContent || "").trim().slice(0, 60), onclick: b.getAttribute("onclick"),
  }));
  return { anchors, buttons };
});
log("panel anchors: " + JSON.stringify(linking.anchors, null, 1).slice(0, 2000));
log("panel buttons: " + JSON.stringify(linking.buttons, null, 1).slice(0, 800));

// Try direct detail URLs (the clone's route shape + common variants)
const tries = ["/account/orders", "/account/orders/ORD-2026-001", "/orders", "/order/ORD-2026-001"];
for (const t of tries) {
  const resp = await page.goto(REF + t, { waitUntil: "domcontentloaded" }).catch(() => null);
  await page.waitForTimeout(600);
  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  log(`direct ${t} -> status ${resp ? resp.status() : "ERR"} url=${page.url().slice(REF.length)} h1=${(h1 || "").slice(0, 60)}`);
}

// ---- PHASE 3: back to the tab — the pill vocabulary ----
await page.goto(REF + "/account", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.getByRole("tab", { name: /orders/i }).first().click();
await page.waitForTimeout(1200);
log("\n== PHASE 3: the status pill vocabulary (live re-verify) ==");
const pills = await page.evaluate(() => {
  const panels = [...document.querySelectorAll('[role="tabpanel"]')].filter((p) => getComputedStyle(p).display !== "none");
  const panel = panels[0] || document.body;
  const out = [];
  for (const el of panel.querySelectorAll("*")) {
    if (!(el instanceof HTMLElement)) continue;
    const t = (el.textContent || "").trim();
    if (/^(Delivered|In Transit|Processing|Refunded|Cancelled|Pending|Shipped|Paid)$/i.test(t) && t.length < 20 && el.children.length <= 1) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out.push({
        text: t, cls: (el.className || "").slice(0, 200),
        computed: {
          display: cs.display, padding: cs.padding, borderRadius: cs.borderRadius,
          background: cs.backgroundColor, color: cs.color, border: cs.border,
          fontSize: cs.fontSize, fontWeight: cs.fontWeight, letterSpacing: cs.letterSpacing,
        },
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
  }
  return out.slice(0, 6);
});
for (const p of pills) log(JSON.stringify(p));

// ---- PHASE 4: the account chrome geometry (the panel container) ----
log("\n== PHASE 4: the account chrome ==");
const chrome = await page.evaluate(() => {
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const panel = panels.filter((p) => getComputedStyle(p).display !== "none")[0] || panels[0];
  const container = panel ? panel.closest("div") : null;
  const main = document.querySelector("main") || document.body;
  const pick = (el, name) => {
    if (!el) return { name, absent: true };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      name, tag: el.tagName, cls: (el.className || "").slice(0, 140),
      computed: { display: cs.display, maxWidth: cs.maxWidth, padding: cs.padding, margin: cs.margin, gap: cs.gap },
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  };
  return [pick(main, "main"), pick(container, "panel-container"), pick(panel, "tabpanel")];
});
for (const c of chrome) log(JSON.stringify(c));

log("\n== errors: " + (errors.length ? JSON.stringify(errors).slice(0, 600) : "none") + " ==");
await browser.close();
log("== r57a complete ==");

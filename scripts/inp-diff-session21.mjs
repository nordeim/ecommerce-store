// Round-21 INP (Interaction to Next Paint) differential — the round's
// primary new surface: the LAST Core Web Vitals family member (LCP/CLS are
// pinned by the PERF-GATE-1/2 standing gates; INP was nominated by the
// session-20 log as the deterministic next family).
//
// Method: a SCRIPTED, REPEATABLE interaction protocol (the INP prerequisite
// — INP needs real interactions, and a spec-grade protocol makes the
// measurement reproducible for a standing gate). The protocol drives the
// five canonical shopper interactions on BOTH sites, authenticated, in
// fresh contexts per surface (buffered event entries are page-scoped, so
// the login interactions never pollute the measurement pages):
//
//   1. PDP  "Add to Cart" click      — reference: client-state mutation;
//                                      clone: server action + revalidate
//   2. PDP  wishlist heart click     — toast + state paint
//   3. HOME search typing "head"     — 4 keys, 250ms apart (input latency +
//                                      dropdown render; clone: /api/search)
//   4. CART drawer stepper "+" click — reference: client state; clone:
//                                      transactional delta server action
//   5. HOME carousel "next" click    — slide transition paint
//
// Universal structural locators (the reference's icon-only buttons are
// UNLABELED — the labeled clone buttons are the a11y superset): the header
// search button = svg.lucide-search; the header cart button =
// svg.lucide-shopping-bag; the PDP heart = the 4th button of the action
// row `div.flex.items-center.gap-4.mb-4` (both sites: [-][+] ATC heart);
// the drawer "+" = the gap-2 stepper group's 2nd button; carousel next =
// the svg.lucide-chevron-right button. The reference's cart is client
// state — the drawer flow stays ON ONE page (a full reload resets it).
//
// Event entries are collected by a PerformanceObserver(type "event",
// buffered) registered pre-load via addInitScript; entries are grouped by
// interactionId; per-interaction duration = the interaction's MAX event
// duration (the web-vitals v4 approximation: each event's duration is
// nextPaint - startTime, rounded to Chrome's 8ms granularity). INP per
// page = the max across interactions; the whole protocol reports the full
// table so per-interaction regressions are visible.
//
// Viewports: desktop 1280x720 AND iPhone 14 (390x664, DPR 3, touch) — the
// A11Y-GATE-2/PERF-GATE-2 both-viewport discipline (a mobile-only
// interaction defect is invisible at desktop).
//
// Run: node scripts/inp-diff-session21.mjs   (clone server must be up on :3000)
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";

// --- event-timing collector, registered pre-load on every page ------------
const COLLECT = () => {
  window.__evts = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.interactionId > 0) {
          window.__evts.push({
            name: e.name,
            startTime: Math.round(e.startTime),
            duration: e.duration, // nextPaint - startTime (8ms granularity)
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

const login = async (ctx, base, email, password) => {
  const page = await ctx.newPage();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const path = new URL(page.url()).pathname;
  await page.close();
  return path;
};

// TRUSTED Playwright clicks (synthetic evaluate-clicks generate NO
// interaction entries — interactionId only attaches to real input events
// dispatched via CDP). The :has() locator targets the icon-bearing button.
const clickIconBtn = (page, scope, icon) =>
  page.locator(`${scope} button:has(svg.${icon})`).first().click();

/** Drives the 5-interaction protocol on one site; returns raw event sets. */
const protocol = async (browser, base, creds, vp, label) => {
  const out = [];
  const ctx = await browser.newContext({ ...vp });
  await ctx.addInitScript(COLLECT);
  const lp = await login(ctx, base, creds.email, creds.password);
  if (lp !== "/account" && lp !== "/") throw new Error(label + " login failed -> " + lp);

  // --- surface 1+2: PDP add-to-cart + wishlist heart -----------------------
  {
    const page = await ctx.newPage();
    await page.goto(base + "/product/wireless-headphones", { waitUntil: "networkidle" });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(800);
    // the action row's ATC (the related cards carry their own ATCs — the
    // strict-mode trap, documented): row > button with text "Add to Cart"
    await page
      .locator('div.flex.items-center.gap-4.mb-4 button', { hasText: "Add to Cart" })
      .click();
    await page.waitForTimeout(2000); // toast + badge paint + revalidate
    // the heart = the action row's LAST button (both sites, structural)
    await page.locator("div.flex.items-center.gap-4.mb-4 button").last().click();
    await page.waitForTimeout(2000);
    const evts = await page.evaluate(() => window.__evts);
    out.push({ surface: "pdp-atc+heart", label, evts });
    await page.close();
  }

  // --- surface 3: home search typing ---------------------------------------
  {
    const page = await ctx.newPage();
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(800);
    await clickIconBtn(page, "header", "lucide-search");
    await page.waitForTimeout(600);
    await page.locator("header input").first().click();
    for (const ch of ["h", "e", "a", "d"]) {
      await page.keyboard.type(ch, { delay: 0 });
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1200); // dropdown + (clone) typeahead fetch
    const evts = await page.evaluate(() => window.__evts);
    out.push({ surface: "search-typing", label, evts });
    await page.close();
  }

  // --- surface 4: cart drawer stepper --------------------------------------
  {
    const page = await ctx.newPage();
    // ONE page for the whole flow (the reference's cart is client state —
    // a full reload resets it): goto PDP, add, open drawer, step
    await page.goto(base + "/product/wireless-headphones", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page
      .locator('div.flex.items-center.gap-4.mb-4 button', { hasText: "Add to Cart" })
      .click();
    await page.waitForTimeout(1500);
    await clickIconBtn(page, "header", "lucide-shopping-bag");
    await page.waitForTimeout(900);
    // the "+" = the dialog's stepper-group button carrying the plus icon
    await page.locator('[role="dialog"] div.gap-2 button:has(svg.lucide-plus)').first().click();
    await page.waitForTimeout(2000); // server action + re-render + paint
    const evts = await page.evaluate(() => window.__evts);
    out.push({ surface: "drawer-stepper", label, evts });
    await page.close();
  }

  // --- surface 5: carousel next ---------------------------------------------
  {
    const page = await ctx.newPage();
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForTimeout(800);
    await page.locator('button:has(svg.lucide-chevron-right)').first().click();
    await page.waitForTimeout(1500);
    const evts = await page.evaluate(() => window.__evts);
    out.push({ surface: "carousel-next", label, evts });
    await page.close();
  }

  await ctx.close();
  return out;
};

/** Group raw events by interactionId; per-interaction max duration. */
const summarize = (evts) => {
  const byId = new Map();
  for (const e of evts) {
    const cur = byId.get(e.interactionId) ?? { id: e.interactionId, names: [], max: 0, t: e.startTime };
    cur.names.push(e.name);
    cur.max = Math.max(cur.max, e.duration);
    byId.set(e.interactionId, cur);
  }
  const rows = [...byId.values()].map((r) => ({ events: r.names.join(","), maxMs: r.max }));
  const inp = rows.length ? Math.max(...rows.map((r) => r.maxMs)) : 0;
  return { rows, inp };
};

const run = async (browser, vp, vpLabel) => {
  const refRows = await protocol(
    browser, REF, { email: "sepnetflix2023@outlook.com", password: "$Abcd1234" }, vp, "ref",
  );
  const cloneRows = await protocol(
    browser, CLONE, { email: "john@example.com", password: "Demo1234!" }, vp, "clone",
  );
  console.log(`\n===== ${vpLabel} =====`);
  for (let i = 0; i < refRows.length; i++) {
    const r = summarize(refRows[i].evts);
    const c = summarize(cloneRows[i].evts);
    console.log(`\n[${refRows[i].surface}]`);
    console.log(`  ref   INP=${String(r.inp).padStart(4)}ms  (${r.rows.length} interactions)`);
    console.log(`  clone INP=${String(c.inp).padStart(4)}ms  (${c.rows.length} interactions)`);
    for (const row of r.rows) console.log(`    ref   ${String(row.maxMs).padStart(4)}ms  ${row.events}`);
    for (const row of c.rows) console.log(`    clone ${String(row.maxMs).padStart(4)}ms  ${row.events}`);
  }
};

const browser = await chromium.launch();
await run(browser, DESKTOP, "DESKTOP 1280x720");
await run(browser, IPHONE, "iPhone 14 (390x664, touch)");
await browser.close();
console.log("\nINP thresholds (Google): good <= 200ms, needs-improvement <= 500ms");

// Round-55 REFERENCE probe B: corrected — dump ALL 5 header buttons (find the
// search control), walk the cluster structure up from the heart, hover the
// VISIBLE buttons by exact geometry, read focus-visible, and sweep the badge.
// Run: node scripts/headericons-probe-r55b.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(58)} ${v}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// 1) ALL header buttons: tag, class, svg, geometry, visibility.
const all = await page.evaluate(() => {
  const header = document.querySelector("header");
  const read = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const svg = el.querySelector("svg");
    return {
      tag: el.tagName,
      aria: el.getAttribute("aria-label"),
      hasPopup: el.getAttribute("aria-haspopup"),
      cls: (el.getAttribute("class") || "").toString(),
      visible: cs.display !== "none" && r.width > 0,
      geom: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      svgCls: svg ? (svg.getAttribute("class") || "").toString() : null,
      text: (el.textContent || "").trim().slice(0, 24),
    };
  };
  return [...header.querySelectorAll("button, a")].filter((el) => el.querySelector("svg")).map(read);
});
report("header svg-controls (all)", JSON.stringify(all, null, 0).slice(0, 2400));

// 2) The cluster: walk UP from the heart's button to the h-16 row.
const chain = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = [...header.querySelectorAll("button")];
  const heart = btns.find((b) => b.querySelector("svg.lucide-heart"));
  if (!heart) return "heart not found";
  const out = [];
  let node = heart;
  for (let i = 0; i < 5 && node && node !== document.body; i++) {
    const cs = getComputedStyle(node);
    const r = node.getBoundingClientRect();
    out.push({
      tag: node.tagName,
      cls: (node.getAttribute("class") || "").toString().slice(0, 90),
      geom: `${Math.round(r.x)} ${Math.round(r.width)}w`,
      display: cs.display,
      gap: cs.columnGap,
      kids: node.children.length,
    });
    node = node.parentElement;
  }
  return out;
});
report("heart ancestor chain", JSON.stringify(chain));

// 3) REAL-mouse hovers on the four VISIBLE icon buttons (search first).
const hoverRead = async (label, locator) => {
  try {
    await locator.hover({ timeout: 8000 });
    await page.waitForTimeout(400);
    const cs = await locator.evaluate((node) => {
      const s = getComputedStyle(node);
      return { bg: s.backgroundColor, color: s.color, radius: s.borderRadius };
    });
    report(label + " HOVER", JSON.stringify(cs));
  } catch (e) {
    report(label + " HOVER", "FAILED: " + e.message.split("\n")[0].slice(0, 60));
  }
};
const heartBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-heart") }).first();
const bagBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).first();
const userBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-user") }).first();
await hoverRead("heart", heartBtn);
await hoverRead("bag", bagBtn);
await hoverRead("user", userBtn);

// 4) The search control: hover whatever precedes the heart in the cluster.
const searchCtl = page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = [...header.querySelectorAll("button")];
  const heart = btns.find((b) => b.querySelector("svg.lucide-heart"));
  if (!heart) return null;
  const prev = heart.parentElement.previousElementSibling;
  if (!prev) return { note: "heart parent is first child" };
  const cs = getComputedStyle(prev);
  return {
    tag: prev.tagName,
    cls: (prev.getAttribute("class") || "").toString().slice(0, 140),
    geom: `${Math.round(prev.getBoundingClientRect().x)} ${Math.round(prev.getBoundingClientRect().width)}w`,
    display: cs.display,
    cursor: cs.cursor,
    aria: prev.getAttribute("aria-label"),
  };
});
report("search control (heart's prev sibling)", JSON.stringify(searchCtl));

// 5) Focus-visible: Tab once (page body -> first focusable = the search ctl?).
await page.mouse.move(10, 400);
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
const f1 = await page.evaluate(() => {
  const el = document.activeElement;
  const s = el ? getComputedStyle(el) : null;
  return el ? {
    tag: el.tagName, cls: (el.getAttribute("class") || "").slice(0, 80),
    outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor,
    boxShadow: s.boxShadow.slice(0, 70),
  } : "none";
});
report("focus after 1 tab", JSON.stringify(f1));
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
const f2 = await page.evaluate(() => {
  const el = document.activeElement;
  const s = el ? getComputedStyle(el) : null;
  return el ? {
    tag: el.tagName, cls: (el.getAttribute("class") || "").slice(0, 80),
    outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor,
    boxShadow: s.boxShadow.slice(0, 70),
  } : "none";
});
report("focus after 2 tabs", JSON.stringify(f2));

// 6) The badge sweep: click the bag (drawer opens?) — any counter anywhere?
try {
  await bagBtn.click({ timeout: 6000 });
  await page.waitForTimeout(1200);
} catch {}
const sweep = await page.evaluate(() => {
  const header = document.querySelector("header");
  const spans = [...header.querySelectorAll("span")].map((s) => ({
    cls: (s.getAttribute("class") || "").slice(0, 80),
    text: s.textContent.trim().slice(0, 14),
    pos: getComputedStyle(s).position,
    abs: s.getBoundingClientRect().width > 0,
  }));
  const dialog = document.querySelector('[role="dialog"], [data-state="open"]');
  return { headerSpanCount: spans.length, spans: spans.slice(0, 8), drawer: !!dialog };
});
report("badge sweep after bag click", JSON.stringify(sweep));

await browser.close();
console.log("\n[r55b REFERENCE header icon-button probe B complete]");

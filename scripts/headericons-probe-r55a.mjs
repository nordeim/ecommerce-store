// Round-55 REFERENCE probe A: the header's icon-button family — the four
// icon buttons (search / heart / bag / user), their class strings, geometry,
// computed resting styles, REAL-mouse hover states, focus-visible states, and
// the bag-badge question (does the reference ever paint a counter?).
// Run: node scripts/headericons-probe-r55a.mjs
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

// Locate the icon cluster: the header row's last flex child holding the 4
// icon buttons. Find buttons by their svg shape (search/heart/bag/user).
const found = await page.evaluate(() => {
  const header = document.querySelector("header") || document.querySelector('[role="banner"]');
  if (!header) return { found: false, reason: "no header" };
  const buttons = [...header.querySelectorAll("button")];
  const bySvg = (paths) =>
    buttons.filter((b) => {
      const svg = b.querySelector("svg");
      if (!svg) return false;
      const d = svg.innerHTML;
      return paths.every((p) => d.includes(p));
    });
  const read = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const svg = el.querySelector("svg");
    const scs = svg ? getComputedStyle(svg) : null;
    return {
      tag: el.tagName,
      aria: el.getAttribute("aria-label"),
      cls: (el.getAttribute("class") || "").toString(),
      geom: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      display: cs.display,
      bg: cs.backgroundColor,
      color: cs.color,
      radius: cs.borderRadius,
      transition: cs.transitionDuration + " " + cs.transitionProperty.slice(0, 60),
      svgCls: svg ? (svg.getAttribute("class") || "").toString() : null,
      svgSize: svg ? `${getComputedStyle(svg).width}/${getComputedStyle(svg).height}` : null,
      svgStroke: svg ? scs.stroke : null,
      cursor: cs.cursor,
    };
  };
  const search = bySvg(["m21 21-4.35-4.35"]).slice(-1)[0];
  const heart = bySvg(["M19 14c1.49-1.46"]).slice(-1)[0] || bySvg(["M20.84 4.61"]).slice(-1)[0];
  const bag = bySvg(["M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"]).slice(-1)[0] || bySvg(["M6 2 3 6"]).slice(-1)[0];
  const user = bySvg(["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"]).slice(-1)[0] || bySvg(["a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"]).slice(-1)[0];
  // the badge: any absolutely-positioned span inside the bag button?
  const bagBadge = bag ? [...bag.querySelectorAll("span")].map(read) : [];
  // the cluster container
  const cluster = (search || heart)?.parentElement;
  return {
    found: true,
    search: read(search),
    heart: read(heart),
    bag: read(bag),
    user: read(user),
    bagBadge,
    clusterCls: cluster ? cluster.getAttribute("class") : null,
    clusterGap: cluster ? getComputedStyle(cluster).columnGap : null,
    clusterW: cluster ? Math.round(cluster.getBoundingClientRect().width) : null,
    headerButtonCount: buttons.length,
  };
});
for (const [k, v] of Object.entries(found)) report(k, JSON.stringify(v));

// REAL-mouse hovers on each icon button (the r53 L60 lesson: trusted events
// only). Read the computed bg/color AFTER the 0.15s settle.
const hoverTarget = async (name, locator) => {
  const el = await locator.elementHandle();
  if (!el) { report(name + " hover", "NOT FOUND"); return; }
  await el.hover();
  await page.waitForTimeout(400);
  const cs = await el.evaluate((node) => {
    const s = getComputedStyle(node);
    return { bg: s.backgroundColor, color: s.color, transition: s.transitionDuration };
  });
  report(name + " hover", JSON.stringify(cs));
};
await hoverTarget("search", page.locator("header button").filter({ has: page.locator("svg") }).nth(0));
await hoverTarget("heart", page.locator("header button").filter({ has: page.locator("svg") }).nth(1));
await hoverTarget("bag", page.locator("header button").filter({ has: page.locator("svg") }).nth(2));
await hoverTarget("user", page.locator("header button").filter({ has: page.locator("svg") }).nth(3));

// Focus-visible state: keyboard-focus the search button (Tab from body).
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
const focusRead = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el.tagName !== "BUTTON") return { active: el ? el.tagName + "." + el.className : "none" };
  const s = getComputedStyle(el);
  return {
    active: "BUTTON." + (el.getAttribute("aria-label") || ""),
    outlineStyle: s.outlineStyle,
    outlineWidth: s.outlineWidth,
    outlineColor: s.outlineColor,
    boxShadow: s.boxShadow.slice(0, 80),
    ring: el.getAttribute("class") || "",
  };
});
report("focus-visible (tab 1)", JSON.stringify(focusRead));

// The badge question: open the reference's cart drawer (click the bag) and
// check whether ANY counter/badge appears anywhere in the header after adding
// nothing (the reference cart is a client demo — measure, never assume).
await page.locator("header button").filter({ has: page.locator("svg") }).nth(2).click();
await page.waitForTimeout(1200);
const badgeSweep = await page.evaluate(() => {
  const header = document.querySelector("header");
  const spans = header ? [...header.querySelectorAll("span")].map((s) => ({
    cls: s.getAttribute("class"),
    text: s.textContent.trim().slice(0, 20),
    pos: getComputedStyle(s).position,
  })) : [];
  return { headerSpans: spans, drawerOpen: !!document.querySelector('[role="dialog"], [data-state="open"]') };
});
report("badge sweep (bag clicked)", JSON.stringify(badgeSweep));

await browser.close();
console.log("\n[r55a REFERENCE header icon-button probe complete]");

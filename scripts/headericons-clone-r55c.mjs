// Round-55 CLONE probe C: the header's icon-button family on the clone — the
// same reads as r55a/b (class strings, geometry, svg computed size, REAL-mouse
// hovers, focus-visible, the badge superset with an item in the cart).
// Run via: bash scripts/battery-runner.sh headericons-clone-r55c.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(58)} ${v}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login (the sweep convention)
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// 1) all header svg-controls + the cluster + the row
const all = await page.evaluate(() => {
  const header = document.querySelector("header");
  const read = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const svg = el.querySelector("svg");
    return {
      tag: el.tagName, aria: el.getAttribute("aria-label"), popup: el.getAttribute("aria-haspopup"),
      cls: (el.getAttribute("class") || "").toString(),
      visible: cs.display !== "none" && r.width > 0,
      geom: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      svgCls: svg ? (svg.getAttribute("class") || "").toString() : null,
      svgComputed: svg ? `${getComputedStyle(svg).width}/${getComputedStyle(svg).height}` : null,
      text: (el.textContent || "").trim().slice(0, 20),
    };
  };
  const ctrls = [...header.querySelectorAll("button, a")].filter((el) => el.querySelector("svg")).map(read);
  const heart = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg.lucide-heart"));
  const chain = [];
  let node = heart;
  for (let i = 0; i < 5 && node && node !== document.body; i++) {
    const cs = getComputedStyle(node);
    chain.push({ tag: node.tagName, cls: (node.getAttribute("class") || "").slice(0, 60), geom: Math.round(node.getBoundingClientRect().x) + " " + Math.round(node.getBoundingClientRect().width) + "w", gap: cs.columnGap, kids: node.children.length });
    node = node.parentElement;
  }
  return { ctrls, chain };
});
report("clone svg-controls", JSON.stringify(all.ctrls, null, 0).slice(0, 2600));
report("clone heart chain", JSON.stringify(all.chain));

// 2) resting computed on the four icon buttons
const rest = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = [...header.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().width > 0);
  const pick = (name) => btns.find((b) => b.querySelector("svg.lucide-" + name));
  const readOne = (b) => {
    if (!b) return null;
    const s = getComputedStyle(b);
    return { bg: s.backgroundColor, color: s.color, radius: s.borderRadius, transition: s.transitionDuration + " " + s.transitionProperty.slice(0, 50), cursor: s.cursor };
  };
  return { search: readOne(pick("search")), heart: readOne(pick("heart")), bag: readOne(pick("shopping-bag")), user: readOne(pick("user")) };
});
report("clone resting (4 buttons)", JSON.stringify(rest));

// 3) REAL-mouse hovers
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
const searchBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-search") }).first();
const heartBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-heart") }).first();
const bagBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).first();
const userBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-user") }).first();
await hoverRead("search", searchBtn);
await hoverRead("heart", heartBtn);
await hoverRead("bag", bagBtn);
await hoverRead("user", userBtn);

// 4) focus-visible directly on the search button (focus() + :focus-visible
// heuristic: keyboard modality — use Tab after clicking body).
await page.mouse.move(10, 400);
await page.click("body", { position: { x: 10, y: 400 } }).catch(() => {});
await page.keyboard.press("Tab");
await page.waitForTimeout(200);
const f1 = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el) return "none";
  const s = getComputedStyle(el);
  return { tag: el.tagName, cls: (el.getAttribute("class") || "").slice(0, 70), outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor, boxShadow: s.boxShadow.slice(0, 80) };
});
report("clone focus after 1 tab", JSON.stringify(f1));

// 5) THE BADGE SUPERSET: add an item to the cart (PDP add-to-cart button),
// then read the badge's class + computed + geometry.
const pdp = await ctx.newPage();
await pdp.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await pdp.waitForTimeout(800);
try {
  await pdp.getByRole("button", { name: /add to cart/i }).click({ timeout: 8000 });
  await pdp.waitForTimeout(1200);
} catch (e) { report("atc click", "FAILED " + e.message.split("\n")[0].slice(0, 50)); }
// dismiss the drawer if it opened
try { await pdp.keyboard.press("Escape"); } catch {}
await pdp.close();

const badge = await page.evaluate(async () => {
  await new Promise((r) => setTimeout(r, 300));
  const header = document.querySelector("header");
  const bag = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg.lucide-shopping-bag"));
  if (!bag) return "bag not found";
  const span = bag.querySelector("span");
  if (!span) return { badge: false, aria: bag.getAttribute("aria-label") };
  const s = getComputedStyle(span);
  const r = span.getBoundingClientRect();
  const br = bag.getBoundingClientRect();
  return {
    badge: true, text: span.textContent.trim(),
    cls: span.getAttribute("class"),
    computed: { bg: s.backgroundColor, color: s.color, fontSize: s.fontSize, fontWeight: s.fontWeight, h: s.height, minW: s.minWidth, radius: s.borderRadius, pos: s.position, display: s.display, pad: s.padding },
    geom: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} (bag at ${Math.round(br.x)},${Math.round(br.y)} ${Math.round(br.width)}w)`,
    aria: bag.getAttribute("aria-label"),
  };
});
report("clone badge (1 item in cart)", JSON.stringify(badge));

await browser.close();
console.log("\n[r55c CLONE header icon-button probe complete]");

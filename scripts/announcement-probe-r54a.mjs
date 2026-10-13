// Round-54 REFERENCE calibration probe A: the live reference's ANNOUNCEMENT
// BAR — the never-audited family (session-105's suggested next, twelfth
// installment). The question: does the reference's top strip scroll-marquee
// while the clone's bar is static? Login-gated; DOM dumps + computed styles +
// a 6s positional poll as the ground truth. Run: node scripts/announcement-probe-r54a.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(56)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

// login (the r52/r53 convention)
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
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1500);

line("A. LOCATE THE REFERENCE ANNOUNCEMENT BAR");
const locate = await page.evaluate(() => {
  // the strip carrying the free-shipping copy
  const all = [...document.querySelectorAll("body *")];
  const hit = all.find((el) => el.children.length <= 3 && /free shipping/i.test(el.textContent || "") && el.getBoundingClientRect().height < 80 && el.getBoundingClientRect().top < 200);
  if (!hit) return { found: false };
  const header = hit.closest("header") || hit.parentElement;
  return {
    found: true,
    tag: hit.tagName,
    cls: hit.className,
    text: (hit.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200),
    childCount: hit.children.length,
    childTags: [...hit.children].map((c) => c.tagName + "." + (c.className || "").toString().slice(0, 80)),
    inHeader: !!hit.closest("header"),
    headerFirstChild: header ? header.firstElementChild ? header.firstElementChild.tagName + "." + (header.firstElementChild.className || "").toString().slice(0, 80) : null : null,
    rect: { x: hit.getBoundingClientRect().x, y: hit.getBoundingClientRect().y, w: hit.getBoundingClientRect().width, h: hit.getBoundingClientRect().height },
  };
});
for (const [k, v] of Object.entries(locate)) report(`locate.${k}`, JSON.stringify(v));

line("B. ANATOMY — the bar + its children, full computed contract");
const anatomy = await page.evaluate(() => {
  const all = [...document.querySelectorAll("body *")];
  const hit = all.find((el) => el.children.length <= 3 && /free shipping/i.test(el.textContent || "") && el.getBoundingClientRect().height < 80 && el.getBoundingClientRect().top < 200);
  if (!hit) return { found: false };
  const read = (el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName, cls: (el.className || "").toString(),
      text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
      display: cs.display, bg: cs.backgroundColor, color: cs.color,
      fontSize: cs.fontSize, fontWeight: cs.fontWeight, letterSpacing: cs.letterSpacing,
      paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, height: el.offsetHeight,
      textAlign: cs.textAlign, whiteSpace: cs.whiteSpace, overflow: cs.overflow, overflowX: cs.overflowX,
      gap: cs.gap, justifyContent: cs.justifyContent, alignItems: cs.alignItems,
      position: cs.position, zIndex: cs.zIndex,
    };
  };
  return {
    found: true,
    bar: read(hit),
    children: [...hit.children].map(read),
    // duplicate-content detection: a seamless marquee repeats the strip
    dupeCheck: (() => {
      const kids = [...hit.children].map((c) => (c.textContent || "").replace(/\s+/g, " ").trim());
      return { childTexts: kids, anyDuplicate: kids.length > 1 && kids[0] === kids[kids.length - 1] };
    })(),
  };
});
if (anatomy.found) {
  report("anatomy.bar", JSON.stringify(anatomy.bar));
  anatomy.children.forEach((c, i) => report(`anatomy.child[${i}]`, JSON.stringify(c)));
  report("anatomy.dupeCheck", JSON.stringify(anatomy.dupeCheck));
} else report("anatomy", "NOT FOUND");

line("C. ANIMATION CONTRACT — the bar + every descendant");
const anim = await page.evaluate(() => {
  const all = [...document.querySelectorAll("body *")];
  const hit = all.find((el) => el.children.length <= 3 && /free shipping/i.test(el.textContent || "") && el.getBoundingClientRect().height < 80 && el.getBoundingClientRect().top < 200);
  if (!hit) return { found: false };
  const nodes = [hit, ...hit.querySelectorAll("*")];
  const read = (el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName, cls: (el.className || "").toString().slice(0, 90),
      animation: cs.animation,
      animationName: cs.animationName, animationDuration: cs.animationDuration,
      animationTimingFunction: cs.animationTimingFunction, animationIterationCount: cs.animationIterationCount,
      animationPlayState: cs.animationPlayState, animationDelay: cs.animationDelay,
      transform: cs.transform, translate: cs.translate, willChange: cs.willChange,
      transition: cs.transition !== "none" ? cs.transition : undefined,
    };
  };
  // keyframes in the document stylesheets
  const kf = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules || []) {
      if (r.type === CSSRule.KEYFRAMES_RULE || (r.cssText || "").startsWith("@keyframes")) {
        const name = r.name || (r.cssText.match(/@keyframes\s+([\w-]+)/) || [])[1] || "";
        if (/marquee|scroll|announce|ticker|slide|loop|translate/i.test(name) || (r.cssText || "").match(/translateX/i)) {
          kf.push({ name, text: (r.cssText || "").slice(0, 300) });
        }
      }
    }
  }
  return { found: true, nodes: nodes.map(read), keyframes: kf.slice(0, 8), nodeCount: nodes.length };
});
if (anim.found) {
  anim.nodes.forEach((n, i) => report(`anim.node[${i}]`, JSON.stringify(n)));
  report("anim.keyframes", JSON.stringify(anim.keyframes));
} else report("anim", "NOT FOUND");

line("D. BEHAVIORAL — 6s positional poll (re-query every sample, the r53 L61 lesson)");
const poll = await page.evaluate(() => new Promise((resolve) => {
  const samples = [];
  const t0 = Date.now();
  const tick = () => {
    const el = [...document.querySelectorAll("body *")].find((e) => e.children.length <= 3 && /free shipping/i.test(e.textContent || "") && e.getBoundingClientRect().height < 80 && e.getBoundingClientRect().top < 200);
    if (el) {
      const inner = el.firstElementChild || el;
      const r1 = el.getBoundingClientRect();
      const r2 = inner.getBoundingClientRect();
      const cs = getComputedStyle(inner);
      samples.push({ t: Date.now() - t0, barX: Math.round(r1.x * 10) / 10, barW: Math.round(r1.width), innerX: Math.round(r2.x * 10) / 10, innerW: Math.round(r2.width), transform: cs.transform, playState: cs.animationPlayState });
    }
    if (Date.now() - t0 < 6000) setTimeout(tick, 500); else resolve(samples);
  };
  tick();
}));
poll.forEach((s) => report(`poll t=${s.t}ms`, `barX=${s.barX} barW=${s.barW} innerX=${s.innerX} innerW=${s.innerW} transform=${s.transform} play=${s.playState}`));
const xs = poll.map((s) => s.innerX);
report("poll.verdict", `innerX range [${Math.min(...xs)}, ${Math.max(...xs)}] — ${Math.max(...xs) - Math.min(...xs) > 1 ? "MOVES (scroll)" : "STATIC"}`);

line("E. HOVER — real-mouse dwell mid-bar (the r53 L60 trusted-event lesson)");
const bar = page.locator("body *", { hasText: /free shipping/i }).first();
try {
  const before = await page.evaluate(() => {
    const el = [...document.querySelectorAll("body *")].find((e) => e.children.length <= 3 && /free shipping/i.test(e.textContent || "") && e.getBoundingClientRect().height < 80 && e.getBoundingClientRect().top < 200);
    const inner = el.firstElementChild || el;
    return { x: inner.getBoundingClientRect().x, ps: getComputedStyle(inner).animationPlayState };
  });
  await page.mouse.move(640, before.x !== undefined ? 20 : 20); // near the top strip
  await page.waitForTimeout(3500);
  const during = await page.evaluate(() => {
    const el = [...document.querySelectorAll("body *")].find((e) => e.children.length <= 3 && /free shipping/i.test(e.textContent || "") && e.getBoundingClientRect().height < 80 && e.getBoundingClientRect().top < 200);
    const inner = el.firstElementChild || el;
    return { x: inner.getBoundingClientRect().x, ps: getComputedStyle(inner).animationPlayState, cursor: getComputedStyle(el).cursor };
  });
  report("hover.before", JSON.stringify(before));
  report("hover.during(3.5s)", JSON.stringify(during));
} catch (e) { report("hover", `ERROR ${e.message.slice(0, 120)}`); }

line("F. RESPONSIVE — the bar at 390px (mobile) + the full text inventory");
const mob = await page.evaluate(() => {
  const el = [...document.querySelectorAll("body *")].find((e) => e.children.length <= 3 && /free shipping/i.test(e.textContent || "") && e.getBoundingClientRect().height < 80 && e.getBoundingClientRect().top < 200);
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  return {
    found: true,
    overflowX: cs.overflowX, whiteSpace: cs.whiteSpace,
    scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
    text: (el.textContent || "").replace(/\s+/g, " ").trim(),
  };
});
report("responsive", JSON.stringify(mob));

await browser.close();
console.log("\n[r54a REFERENCE probe complete]");

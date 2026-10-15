// Round-60 probe B: the CLONE's PDP tabs — the same axes as r60a2 (the
// reference's ground truth), run against the production standalone on :3000.
// Differences found here vs the reference become the round's findings.
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await withTimeout(lp.goto(CLONE + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill("john@example.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("Demo1234!"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login-nav");
} catch {}
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
console.log("[1] navigating to the headphones PDP…");
await withTimeout(page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 30000, "pdp-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);

// — [2] the tablist + triggers at rest (full read) —
const resting = await page.evaluate(() => {
  const list = document.querySelector('[role="tablist"]');
  if (!list) return { error: "no tablist" };
  const lr = list.getBoundingClientRect();
  const lcs = getComputedStyle(list);
  const triggers = [...list.querySelectorAll('[role="tab"]')];
  const readTrig = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || "").trim(),
      fullCls: el.getAttribute("class") || "",
      state: el.getAttribute("data-state"),
      selected: el.getAttribute("aria-selected"),
      tabIndex: el.tabIndex,
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      bg: cs.backgroundColor, color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, padding: cs.padding,
      transition: cs.transition,
      ariaControls: el.getAttribute("aria-controls"),
    };
  };
  return {
    list: {
      fullCls: list.getAttribute("class") || "",
      x: Math.round(lr.x), y: Math.round(lr.y), w: Math.round(lr.width), h: Math.round(lr.height),
      bg: lcs.backgroundColor, borderRadius: lcs.borderRadius, padding: lcs.padding,
      display: lcs.display, justifyContent: lcs.justifyContent, gap: lcs.gap,
      overflowX: lcs.overflowX,
    },
    triggerCount: triggers.length,
    triggers: triggers.map(readTrig),
    panelGap: (() => {
      const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
      return panel ? Math.round(panel.getBoundingClientRect().y - (lr.y + lr.height)) : null;
    })(),
  };
});
console.log("[2] RESTING TABLIST:", JSON.stringify(resting, null, 1));

// — [3] scroll the tablist to CENTER, capture the Reviews trigger —
await page.evaluate(() => {
  document.querySelector('[role="tablist"]').scrollIntoView({ block: "center" });
});
await page.waitForTimeout(400);
const geo = await page.evaluate(() => {
  const triggers = [...document.querySelectorAll('[role="tab"]')];
  const rev = triggers.find((t) => /reviews/i.test(t.textContent || ""));
  const rr = rev.getBoundingClientRect();
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  return {
    revCx: rr.x + rr.width / 2, revCy: rr.y + rr.height / 2,
    revInViewport: rr.y >= 0 && rr.y + rr.height <= window.innerHeight,
    triggerTabIndices: triggers.map((t) => t.tabIndex),
    selText: sel.textContent.trim(),
  };
});
console.log("[3] POST-SCROLL GEO:", JSON.stringify(geo, null, 1));

// — [4] hover the Reviews trigger —
await page.mouse.move(geo.revCx, geo.revCy, { steps: 5 });
await page.waitForTimeout(450);
const hovered = await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role="tab"]')].find((el) => /reviews/i.test(el.textContent || ""));
  const cs = getComputedStyle(t);
  return { bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow, state: t.getAttribute("data-state") };
});
console.log("[4] REVIEWS HOVERED:", JSON.stringify(hovered, null, 1));

// — [5] CLICK the Reviews trigger + network watch —
let net = 0;
page.on("request", (req) => {
  if (req.resourceType() === "xhr" || req.resourceType() === "fetch") net++;
});
await page.mouse.click(geo.revCx, geo.revCy);
await page.waitForTimeout(900);
const afterClick = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const triggers = [...document.querySelectorAll('[role="tab"]')];
  const rev = triggers.find((t) => /reviews/i.test(t.textContent || ""));
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const visible = panels.filter((p) => !!(p.offsetWidth || p.offsetHeight));
  return {
    selText: sel ? sel.textContent.trim() : null,
    revState: rev ? rev.getAttribute("data-state") : null,
    activePanels: visible.map((p) => (p.textContent || "").trim().slice(0, 40)),
    panelStates: panels.map((p) => p.getAttribute("data-state")),
    triggerTabIndices: triggers.map((t) => t.tabIndex),
    activePanelCls: visible[0] ? visible[0].getAttribute("class") : null,
  };
});
console.log("[5] AFTER CLICK ON REVIEWS:", JSON.stringify(afterClick, null, 1));
console.log("[5b] XHR/FETCH DURING SWITCH:", net);

// — [6] the now-selected trigger's full computed —
const selDetail = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const cs = getComputedStyle(sel);
  return {
    selText: sel.textContent.trim(),
    bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow,
    h: Math.round(sel.getBoundingClientRect().height),
  };
});
console.log("[6] NOW-SELECTED TRIGGER:", JSON.stringify(selDetail, null, 1));

// — [7] script-focus the Shipping trigger (auto-activation check) —
await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role="tab"]')].find((el) => /shipping/i.test(el.textContent || ""));
  t.focus();
});
await page.waitForTimeout(300);
const focusedScript = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el.getAttribute("role") !== "tab") return { active: el ? el.tagName : null };
  const cs = getComputedStyle(el);
  return {
    active: el.textContent.trim(),
    state: el.getAttribute("data-state"),
    outline: cs.outline, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor, outlineWidth: cs.outlineWidth,
    boxShadow: cs.boxShadow,
  };
});
console.log("[7] SCRIPT-FOCUSED SHIPPING TRIGGER:", JSON.stringify(focusedScript, null, 1));
const postScriptSel = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
  return { selText: sel.textContent.trim(), panelHead: (panel.textContent || "").trim().slice(0, 40) };
});
console.log("[7b] SELECTION AFTER SCRIPT-FOCUS:", JSON.stringify(postScriptSel, null, 1));

// — [8] keyboard walk with a REAL blur reset (fixed vs r60a2) —
await page.evaluate(() => {
  window.scrollTo(0, 0);
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});
await page.waitForTimeout(200);
let found = null;
for (let i = 0; i < 40; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(60);
  const st = await page.evaluate(() => {
    const el = document.activeElement;
    if (el && el.getAttribute("role") === "tab") {
      const cs = getComputedStyle(el);
      return {
        text: el.textContent.trim(),
        outline: cs.outline, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow, tabIndex: el.tabIndex,
      };
    }
    return null;
  });
  if (st) { found = { tabsWalked: i + 1, ...st }; break; }
}
console.log("[8] KEYBOARD-FOCUSED TRIGGER:", JSON.stringify(found, null, 1));

// — [9] ArrowRight from the focused trigger —
if (found) {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const afterArrow = await page.evaluate(() => {
    const el = document.activeElement;
    const triggers = [...document.querySelectorAll('[role="tab"]')];
    if (!el || el.getAttribute("role") !== "tab") return { active: el ? el.tagName : null };
    return {
      active: el.textContent.trim(),
      selected: el.getAttribute("aria-selected"),
      triggerTabIndices: triggers.map((t) => t.tabIndex),
    };
  });
  console.log("[9] AFTER ARROW-RIGHT:", JSON.stringify(afterArrow, null, 1));
}

// — [10] the @375 mobile pass —
const mob = await ctx.newPage();
await mob.setViewportSize({ width: 375, height: 667 });
await withTimeout(mob.goto(CLONE + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 30000, "mob-goto");
await mob.waitForLoadState("networkidle");
await mob.waitForTimeout(1000);
const mobile = await mob.evaluate(() => {
  const list = document.querySelector('[role="tablist"]');
  if (!list) return { error: "no tablist" };
  const lr = list.getBoundingClientRect();
  const lcs = getComputedStyle(list);
  const triggers = [...list.querySelectorAll('[role="tab"]')];
  return {
    listCls: list.getAttribute("class") || "",
    listX: Math.round(lr.x), listW: Math.round(lr.width), listH: Math.round(lr.height),
    overflowX: lcs.overflowX, scrollWidth: list.scrollWidth, clientWidth: list.clientWidth,
    triggerRects: triggers.map((t) => {
      const r = t.getBoundingClientRect();
      return { text: t.textContent.trim().slice(0, 14), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x) };
    }),
  };
});
console.log("[10] MOBILE @375:", JSON.stringify(mobile, null, 1));

await browser.close();
console.log("PROBE B COMPLETE");

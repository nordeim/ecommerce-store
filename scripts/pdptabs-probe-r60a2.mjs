// Round-60 probe A2: the REFERENCE's PDP tabs — the corrected interaction
// pass (the r59 L84 viewport-clamp trap: the tablist sits at y=754 on a
// 768px viewport — raw-coordinate hover/click clamped and hit nothing).
// This pass SCROLLS the tablist to the viewport center BEFORE capturing
// coordinates (the r59a2 discipline), and walks focus with multiple Tabs.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await withTimeout(lp.goto(REF + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login-nav");
} catch {}
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
console.log("[1] navigating to the headphones PDP…");
await withTimeout(page.goto(REF + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 30000, "pdp-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);

// — [2] scroll the tablist to CENTER, then re-capture geometry —
await page.evaluate(() => {
  document.querySelector('[role="tablist"]').scrollIntoView({ block: "center" });
});
await page.waitForTimeout(400);
const geo = await page.evaluate(() => {
  const list = document.querySelector('[role="tablist"]');
  const lr = list.getBoundingClientRect();
  const triggers = [...list.querySelectorAll('[role="tab"]')];
  const rev = triggers.find((t) => /reviews/i.test(t.textContent || ""));
  const rr = rev.getBoundingClientRect();
  const vp = { w: window.innerWidth, h: window.innerHeight };
  const cs = getComputedStyle(rev);
  return {
    listY: Math.round(lr.y), listH: Math.round(lr.height),
    revCx: rr.x + rr.width / 2, revCy: rr.y + rr.height / 2,
    revInViewport: rr.y >= 0 && rr.y + rr.height <= window.innerHeight,
    vp,
    revTabIndex: rev.tabIndex,
    triggerTabIndices: triggers.map((t) => t.tabIndex),
    revAriaControls: rev.getAttribute("aria-controls"),
    revId: rev.getAttribute("id"),
    listAria: list.getAttribute("aria-label"),
    revCls: rev.getAttribute("class"),
  };
});
console.log("[2] POST-SCROLL GEOMETRY:", JSON.stringify(geo, null, 1));

// — [3] hover the Reviews trigger (now genuinely in-viewport) —
await page.mouse.move(geo.revCx, geo.revCy, { steps: 5 });
await page.waitForTimeout(450);
const hovered = await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role="tab"]')].find((el) => /reviews/i.test(el.textContent || ""));
  const cs = getComputedStyle(t);
  return { bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow, state: t.getAttribute("data-state") };
});
console.log("[3] REVIEWS HOVERED (real):", JSON.stringify(hovered, null, 1));

// — [4] CLICK the Reviews trigger (now genuinely in-viewport) + network —
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
  const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const visible = panels.filter((p) => !!(p.offsetWidth || p.offsetHeight));
  return {
    selText: sel ? sel.textContent.trim() : null,
    revState: rev ? rev.getAttribute("data-state") : null,
    revSelected: rev ? rev.getAttribute("aria-selected") : null,
    activePanels: visible.map((p) => (p.textContent || "").trim().slice(0, 40)),
    panelStates: panels.map((p) => p.getAttribute("data-state")),
    triggerTabIndices: triggers.map((t) => t.tabIndex),
    activePanelId: panel ? panel.getAttribute("id") : null,
  };
});
console.log("[4] AFTER REAL CLICK ON REVIEWS:", JSON.stringify(afterClick, null, 1));
console.log("[4b] XHR/FETCH DURING SWITCH:", net);

// — [5] if the click DID activate: read the newly-selected trigger's full set —
const selDetail = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  if (!sel) return null;
  const cs = getComputedStyle(sel);
  return {
    selText: sel.textContent.trim(),
    bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow,
    h: Math.round(sel.getBoundingClientRect().height),
  };
});
console.log("[5] NOW-SELECTED TRIGGER:", JSON.stringify(selDetail, null, 1));

// — [6] the panel content under Reviews (if activated) —
const revPanel = await page.evaluate(() => {
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const active = panels.find((p) => p.getAttribute("data-state") === "active");
  return active
    ? { cls: active.getAttribute("class"), head: (active.textContent || "").trim().slice(0, 100), childCount: active.children.length }
    : null;
});
console.log("[6] ACTIVE PANEL:", JSON.stringify(revPanel, null, 1));

// — [7] keyboard: script-focus the Shipping trigger (focus() call) —
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
    outline: cs.outline, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor, outlineWidth: cs.outlineWidth,
    boxShadow: cs.boxShadow, zIndex: cs.zIndex,
  };
});
console.log("[7] SCRIPT-FOCUSED SHIPPING TRIGGER:", JSON.stringify(focusedScript, null, 1));

// — [8] keyboard :focus-visible via a REAL Tab walk (click a neutral high element first) —
await page.evaluate(() => {
  window.scrollTo(0, 0);
  document.body.focus?.();
});
await page.waitForTimeout(200);
// walk tabs until a tab trigger is focused (max 25 tabs)
let found = null;
for (let i = 0; i < 25; i++) {
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
console.log("[8] KEYBOARD-FOCUSED TRIGGER (:focus-visible):", JSON.stringify(found, null, 1));

// — [9] ARROW-RIGHT from the focused trigger (roving tabindex behavior) —
if (found) {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const afterArrow = await page.evaluate(() => {
    const el = document.activeElement;
    const triggers = [...document.querySelectorAll('[role="tab"]')];
    if (!el || el.getAttribute("role") !== "tab") return { active: el ? el.tagName + ":" + (el.textContent || "").slice(0, 20) : null };
    return {
      active: el.textContent.trim(),
      selected: el.getAttribute("aria-selected"),
      triggerTabIndices: triggers.map((t) => t.tabIndex),
    };
  });
  console.log("[9] AFTER ARROW-RIGHT:", JSON.stringify(afterArrow, null, 1));
}

await browser.close();
console.log("PROBE A2 COMPLETE");

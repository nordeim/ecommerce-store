// Round-60 probe C: the REFERENCE's ACCOUNT page tablist — the shared
// ui/tabs component's second consumer. The PDP triggers are text-only
// (gap-2 inert); the ACCOUNT triggers carry lucide ICONS — the icon→text
// gap becomes a real geometry axis. Also: the ring-on-click differential
// (the r60b finding — the clone paints a focus ring on the CLICKED
// trigger; the reference PDP did not) re-verified on the account surface.
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
console.log("[1] navigating to the reference /account…");
await withTimeout(page.goto(REF + "/account", { waitUntil: "domcontentloaded" }), 30000, "acct-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);

// — [2] the account tablist + triggers at rest —
const resting = await page.evaluate(() => {
  const list = document.querySelector('[role="tablist"]');
  if (!list) return { error: "no tablist" };
  const lr = list.getBoundingClientRect();
  const lcs = getComputedStyle(list);
  const triggers = [...list.querySelectorAll('[role="tab"]')];
  const readTrig = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const icon = el.querySelector("svg");
    const ir = icon ? icon.getBoundingClientRect() : null;
    // icon→text gap: the first text node's x minus the icon's right edge
    let iconTextGap = null;
    if (icon && ir) {
      const range = document.createRange();
      for (const node of el.childNodes) {
        if (node.nodeType === 3 && (node.textContent || "").trim()) {
          range.selectNodeContents(node);
          const tr = range.getBoundingClientRect();
          if (tr.width > 0) { iconTextGap = +(tr.x - (ir.x + ir.width)).toFixed(2); break; }
        }
      }
    }
    return {
      text: (el.textContent || "").trim(),
      fullCls: el.getAttribute("class") || "",
      state: el.getAttribute("data-state"),
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      gap: cs.gap, columnGap: cs.columnGap,
      bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow,
      hasIcon: !!icon,
      iconW: ir ? Math.round(ir.width) : null,
      iconTextGap,
      iconX: ir ? Math.round(ir.x) : null,
    };
  };
  return {
    list: {
      fullCls: list.getAttribute("class") || "",
      x: Math.round(lr.x), y: Math.round(lr.y), w: Math.round(lr.width), h: Math.round(lr.height),
      bg: lcs.backgroundColor, overflowX: lcs.overflowX, borderRadius: lcs.borderRadius, padding: lcs.padding,
    },
    triggers: triggers.map(readTrig),
  };
});
console.log("[2] ACCOUNT RESTING TABLIST:", JSON.stringify(resting, null, 1));

// — [3] click the ORDERS trigger — the ring-on-click differential —
const ord = await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role="tab"]')].find((el) => /orders/i.test(el.textContent || ""));
  const r = t.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
await page.evaluate(() => document.querySelector('[role="tablist"]').scrollIntoView({ block: "center" }));
await page.waitForTimeout(300);
const ord2 = await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role="tab"]')].find((el) => /orders/i.test(el.textContent || ""));
  const r = t.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
await page.mouse.click(ord2.cx, ord2.cy);
await page.waitForTimeout(900); // fully past the 150ms transition
const afterClick = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const cs = getComputedStyle(sel);
  const ae = document.activeElement;
  return {
    selText: sel.textContent.trim(),
    boxShadow: cs.boxShadow,
    matchesFocusVisible: sel.matches(":focus-visible"),
    activeElement: ae === sel ? "sel-trigger" : ae ? ae.tagName + ":" + (ae.textContent || "").slice(0, 16) : null,
    aeMatchesFocusVisible: ae ? ae.matches(":focus-visible") : null,
    selOutline: cs.outline, selOutlineStyle: cs.outlineStyle,
  };
});
console.log("[3] AFTER CLICK ORDERS (settled 900ms):", JSON.stringify(afterClick, null, 1));

// — [4] the panel swap + tabIndices —
const panelState = await page.evaluate(() => {
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const active = panels.find((p) => p.getAttribute("data-state") === "active");
  const triggers = [...document.querySelectorAll('[role="tab"]')];
  return {
    activePanelHead: active ? (active.textContent || "").trim().slice(0, 60) : null,
    triggerTabIndices: triggers.map((t) => t.tabIndex),
  };
});
console.log("[4] PANEL STATE:", JSON.stringify(panelState, null, 1));

await browser.close();
console.log("PROBE C COMPLETE");

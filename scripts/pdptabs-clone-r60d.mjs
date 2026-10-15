// Round-60 probe D: the CLONE's ACCOUNT page tablist — the same axes as
// r60c (the reference's account ground truth) + the :focus-visible
// differential on the clicked trigger (the r60b finding: the clone painted
// a focus RING on the mouse-clicked PDP trigger where the reference does
// not — matches(':focus-visible') false on the reference, settled 900ms).
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
console.log("[1] navigating to the clone /account…");
await withTimeout(page.goto(CLONE + "/account", { waitUntil: "domcontentloaded" }), 30000, "acct-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);

// — [2] the account tablist + triggers at rest (the r60c-parity read) —
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

// — [3] click the ORDERS trigger — the ring differential —
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

// — [5] the diagnostic: WHO focuses what — mousedown vs click, and the
// focus-visible match at each stage (the mechanism hunt) —
const page2 = await ctx.newPage();
await page2.goto(CLONE + "/account", { waitUntil: "networkidle" });
await page2.waitForTimeout(1000);
await page2.evaluate(() => document.querySelector('[role="tablist"]').scrollIntoView({ block: "center" }));
await page2.waitForTimeout(300);
const ordRect = await page2.evaluate(() => {
  const t = [...document.querySelectorAll('[role="tab"]')].find((el) => /orders/i.test(el.textContent || ""));
  const r = t.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
// stage A: mousedown only (hold through reads)
await page2.mouse.move(ordRect.cx, ordRect.cy);
await page2.mouse.down();
await page2.waitForTimeout(250);
const stageA = await page2.evaluate(() => {
  const ae = document.activeElement;
  const cs = ae ? getComputedStyle(ae) : null;
  return {
    ae: ae ? (ae.getAttribute("role") === "tab" ? "tab:" + ae.textContent.trim() : ae.tagName) : null,
    matchesFV: ae ? ae.matches(":focus-visible") : null,
    boxShadow: cs ? cs.boxShadow : null,
  };
});
console.log("[5a] MOUSE DOWN (held):", JSON.stringify(stageA, null, 1));
await page2.mouse.up();
await page2.waitForTimeout(700);
const stageB = await page2.evaluate(() => {
  const ae = document.activeElement;
  const cs = ae ? getComputedStyle(ae) : null;
  return {
    ae: ae ? (ae.getAttribute("role") === "tab" ? "tab:" + ae.textContent.trim() : ae.tagName) : null,
    matchesFV: ae ? ae.matches(":focus-visible") : null,
    boxShadow: cs ? cs.boxShadow : null,
  };
});
console.log("[5b] AFTER MOUSE UP + 700ms:", JSON.stringify(stageB, null, 1));

await browser.close();
console.log("PROBE D COMPLETE");

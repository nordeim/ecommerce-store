// Round-60 probe A: the REFERENCE's PDP tabs interaction family — the sweep's
// eighteenth installment. The resting sweep captures the PDP at the default
// Description tab only; the tabs' INTERACTION states (the tablist geometry,
// the trigger's selected/unselected/hover/focus states, the panel swap, the
// keyboard arrow navigation) were never measured. L81 (full class strings),
// L82 (enumerate children), L83 (coordinate-based interactions) apply.
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

const readTablist = () =>
  page.evaluate(() => {
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
        disabled: el.getAttribute("aria-disabled"),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        bg: cs.backgroundColor, color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
        boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, padding: cs.padding,
        transition: cs.transition,
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
      activePanelState: document.querySelector('[role="tabpanel"][data-state="active"]')
        ? document.querySelector('[role="tabpanel"][data-state="active"]').getAttribute("data-state")
        : null,
    };
  });

// — [2] the tablist + triggers at rest (Description selected by default) —
console.log("[2] RESTING TABLIST:", JSON.stringify(await readTablist(), null, 1));

// — [3] the selected trigger's FULL computed (incl. shadow) + the panel gap —
const selectedDetail = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
  const list = document.querySelector('[role="tablist"]');
  if (!sel || !panel || !list) return { error: "missing" };
  const cs = getComputedStyle(sel);
  const pr = panel.getBoundingClientRect();
  const lrb = list.getBoundingClientRect();
  return {
    selText: sel.textContent.trim(),
    selBoxShadow: cs.boxShadow,
    selBg: cs.backgroundColor,
    selColor: cs.color,
    panelGap: Math.round(pr.y - (lrb.y + lrb.height)),
    panelCls: panel.getAttribute("class") || "",
    panelFirstLine: (panel.textContent || "").trim().slice(0, 60),
    listWidth: Math.round(lrb.width),
  };
});
console.log("[3] SELECTED + PANEL GAP:", JSON.stringify(selectedDetail, null, 1));

// — [4] hover an UNSELECTED trigger (coordinate-based, L83) —
const revRect = await page.evaluate(() => {
  const t = [...document.querySelectorAll('[role="tab"]')].find((el) =>
    /reviews/i.test(el.textContent || ""),
  );
  if (!t) return null;
  const r = t.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, x: r.x, y: r.y, w: r.width, h: r.height };
});
if (revRect) {
  await page.mouse.move(revRect.cx, revRect.cy, { steps: 5 });
  await page.waitForTimeout(400);
  const hovered = await page.evaluate(() => {
    const t = [...document.querySelectorAll('[role="tab"]')].find((el) =>
      /reviews/i.test(el.textContent || ""),
    );
    if (!t) return { error: "gone" };
    const cs = getComputedStyle(t);
    return { bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow, state: t.getAttribute("data-state") };
  });
  console.log("[4] REVIEWS TRIGGER HOVERED:", JSON.stringify(hovered, null, 1));
}

// — [5] CLICK the Reviews trigger — the panel swap + network watch —
const netCount = { before: 0 };
page.on("request", (req) => {
  if (req.resourceType() === "xhr" || req.resourceType() === "fetch") netCount.before++;
});
if (revRect) {
  await page.mouse.click(revRect.cx, revRect.cy);
  await page.waitForTimeout(800);
  const afterClick = await page.evaluate(() => {
    const sel = document.querySelector('[role="tab"][aria-selected="true"]');
    const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
    const hidden = [...document.querySelectorAll('[role="tabpanel"]')].filter(
      (p) => p.getAttribute("data-state") !== "active",
    );
    return {
      selText: sel ? sel.textContent.trim() : null,
      selState: sel ? sel.getAttribute("data-state") : null,
      panelVisible: panel ? !!(panel.offsetWidth || panel.offsetHeight) : false,
      panelCls: panel ? panel.getAttribute("class") : null,
      panelHead: panel ? (panel.textContent || "").trim().slice(0, 80) : null,
      hiddenCount: hidden.length,
      hiddenInert: hidden.map((h) => h.getAttribute("data-state")),
      tabbableTriggers: [...document.querySelectorAll('[role="tab"]')].map((t) => t.tabIndex),
    };
  });
  console.log("[5] AFTER CLICK REVIEWS:", JSON.stringify(afterClick, null, 1));
  console.log("[5b] XHR/FETCH DURING SWITCH:", netCount.before);
}

// — [6] FOCUS-VISIBLE on a trigger — keyboard Tab walk to the tablist —
const focusState = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const cs = sel ? getComputedStyle(sel) : null;
  return sel ? { outline: cs.outline, boxShadow: cs.boxShadow, ring: cs.boxShadow } : null;
});
console.log("[6] (pre-focus selected trigger):", JSON.stringify(focusState, null, 1));

// scroll tablist into view, then Tab from body into it
await page.evaluate(() => {
  document.querySelector('[role="tablist"]').scrollIntoView({ block: "center" });
});
await page.waitForTimeout(300);
await page.keyboard.press("Tab"); // should focus the selected trigger (roving tabindex)
await page.waitForTimeout(250);
const focused1 = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el.getAttribute("role") !== "tab") return { active: el ? el.tagName + ":" + (el.textContent || "").slice(0, 20) : null };
  const cs = getComputedStyle(el);
  return {
    active: el.textContent.trim(),
    outline: cs.outline,
    outlineColor: cs.outlineColor,
    boxShadow: cs.boxShadow,
    tabIndex: el.tabIndex,
  };
});
console.log("[6] FOCUSED (after 1 Tab):", JSON.stringify(focused1, null, 1));

// — [7] ARROW-RIGHT navigation (Radix roving) —
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(300);
const afterArrow = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el.getAttribute("role") !== "tab") return { active: el ? el.tagName : null };
  return { active: el.textContent.trim(), selected: el.getAttribute("aria-selected") };
});
console.log("[7] AFTER ARROW-RIGHT:", JSON.stringify(afterArrow, null, 1));

// — [8] Enter on the arrow-focused trigger (activation) —
await page.keyboard.press("Enter");
await page.waitForTimeout(500);
const afterEnter = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
  return {
    selText: sel ? sel.textContent.trim() : null,
    panelHead: panel ? (panel.textContent || "").trim().slice(0, 50) : null,
  };
});
console.log("[8] AFTER ENTER:", JSON.stringify(afterEnter, null, 1));

// — [9] the @375 mobile pass (the overflow-x question) —
const mob = await ctx.newPage();
await mob.setViewportSize({ width: 375, height: 667 });
await withTimeout(mob.goto(REF + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 30000, "mob-goto");
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
console.log("[9] MOBILE @375:", JSON.stringify(mobile, null, 1));

await browser.close();
console.log("PROBE A COMPLETE");

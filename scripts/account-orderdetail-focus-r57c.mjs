// Round-57 CLONE probe C: the order-detail's focus-visible states — the
// last untouched interaction corner (the r55 per-element-type focus
// lesson: the back link is a Button-asChild <a> — the Button's own
// ring utilities win over the global outline rule; the tracking link is
// a bare <a> — the global rule's domain). Plus the tab order over the
// detail's own interactive set, and the pill's inert-focus register
// (a span carrying focus: classes that can never fire — identical on
// both sides, the vocabulary's own form).
// Run (via battery): bash scripts/battery-runner.sh account-orderdetail-focus-r57c.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const log = (m) => console.log(m);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// ---- login ----
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1200);
await lp.close();
log("clone login ok");

// ---- ORD-2026-002 (has the tracking link) ----
const page = await ctx.newPage();
await page.goto(CLONE + "/account", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("tab", { name: "Orders" }).click();
await page.waitForTimeout(600);
await page.getByRole("link", { name: "ORD-2026-002" }).click();
await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
await page.waitForTimeout(900);

// FOCUS-VISIBLE: the tracking link (a bare <a> — the global outline rule)
await page.focus('[data-testid="tracking-line"] a');
await page.evaluate(() => document.querySelector('[data-testid="tracking-line"] a')?.focus());
await page.keyboard.press("Tab"); // move off, then back
await page.evaluate(() => document.querySelector('[data-testid="tracking-line"] a')?.focus());
await page.waitForTimeout(300);
const linkFocus = await page.evaluate(() => {
  const a = document.querySelector('[data-testid="tracking-line"] a');
  const cs = getComputedStyle(a);
  return {
    focused: document.activeElement === a,
    outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
  };
});
log("trackingLink FOCUS-VISIBLE: " + JSON.stringify(linkFocus));

// FOCUS-VISIBLE: the back link (a Button-asChild <a> — the ring utilities)
await page.evaluate(() => {
  const a = [...document.querySelectorAll("main a")].find((x) => x.textContent?.includes("← Orders"));
  a?.focus();
});
await page.waitForTimeout(300);
const backFocus = await page.evaluate(() => {
  const a = [...document.querySelectorAll("main a")].find((x) => x.textContent?.includes("← Orders"));
  const cs = getComputedStyle(a);
  return {
    focused: document.activeElement === a,
    outlineStyle: cs.outlineStyle,
    ring: cs.boxShadow.slice(0, 80),
  };
});
log("backLink FOCUS-VISIBLE: " + JSON.stringify(backFocus));

// TAB ORDER: the detail's own interactive set, in DOM/reading order
const tabOrder = await page.evaluate(() => {
  const interactive = [...document.querySelectorAll("main a, main button")]
    .filter((el) => el.offsetParent !== null && (el.textContent || "").trim().length > 0 && !el.closest("header"))
    .map((el) => ({ tag: el.tagName, text: (el.textContent || "").trim().slice(0, 40), href: el.getAttribute("href")?.slice(0, 60) }));
  return interactive;
});
log("interactive set (in order): " + JSON.stringify(tabOrder, null, 1));

// The pill's inert-focus register: confirm the span carries focus:
// classes that never fire (tabindex absent)
const pillReg = await page.evaluate(() => {
  const pill = [...document.querySelectorAll("main span")].find((s) => s.textContent === "In Transit");
  return {
    tag: pill?.tagName,
    tabIndex: pill?.getAttribute("tabindex"),
    hasFocusClasses: /focus:ring-2/.test(pill?.className || ""),
    inTabSequence: pill ? (pill.tabIndex >= 0 && !pill.hasAttribute("disabled") && getComputedStyle(pill).display !== "none") : null,
  };
});
log("pill inert-focus register: " + JSON.stringify(pillReg));

await browser.close();
log("== r57c complete ==");

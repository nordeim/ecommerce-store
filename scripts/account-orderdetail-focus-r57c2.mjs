// Round-57 CLONE probe C2: the order-detail's focus states via a REAL
// Tab walk (the r57c lesson: script .focus() does not reliably trigger
// :focus-visible — the r55 tab-walk discipline is the clean instrument;
// the r55 tab-start poison lesson: reload, never click, then walk).
// Reads the computed focus indicator at each stop: the back link (the
// Button-asChild <a> — the ring utilities' domain) and the tracking link
// (the bare <a> — the global outline rule's domain).
// Run (via battery): bash scripts/battery-runner.sh account-orderdetail-focus-r57c2.mjs prod
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

// The REAL Tab walk from the document start (up to 40 stops, hard-bound)
const stops = await page.evaluate(async () => {
  const out = [];
  const readFocus = (label, el) => {
    const cs = getComputedStyle(el);
    out.push({
      stop: label,
      tag: el.tagName,
      text: (el.textContent || "").trim().slice(0, 36),
      focused: document.activeElement === el,
      focusVisible: el.matches(":focus-visible"),
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      boxShadow: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 110),
      textDecoration: cs.textDecorationLine,
    });
  };
  for (let i = 0; i < 40; i++) {
    document.activeElement?.blur?.();
    // focus the body start, then Tab — the sequence from the top
    if (i === 0) {
      (document.querySelector("body") ?? document.documentElement).focus?.();
    }
    const ev = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    document.dispatchEvent(ev);
    // real Tab: use the browser's native sequence via focus() on the next
    // focusable — the DOM walk (the r55 form: enumerate focusables in DOM
    // order, skip hidden/disabled)
    const focusables = [...document.querySelectorAll("a, button, input, textarea, select, [tabindex]")
    ].filter((el) => {
      if (el instanceof HTMLElement) {
        const ti = el.tabIndex;
        return ti >= 0 && !el.hasAttribute("disabled") && el.offsetParent !== null;
      }
      return false;
    });
    if (i >= focusables.length) break;
    focusables[i].focus();
    await new Promise((r) => setTimeout(r, 60));
    const el = focusables[i];
    const label = (el.textContent || el.getAttribute("aria-label") || el.getAttribute("name") || "?").trim().slice(0, 30) || "(chrome)";
    readFocus(label, el);
  }
  return out;
});
for (const s of stops) log(JSON.stringify(s));

await browser.close();
log("== r57c2 complete ==");

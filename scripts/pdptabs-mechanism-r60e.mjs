// Round-60 probe E: THE MECHANISM HUNT — who focuses the tab trigger and
// when. The observable divergence: the clone's mouse-clicked tab trigger
// MATCHES :focus-visible (ring paints: 2px offset + 4px orange); the
// reference's does NOT (matches false, no ring) — same Chromium, same class
// strings. This probe patches HTMLElement.prototype.focus (script-focus
// logger) + a focusin listener, then drives a mousedown-hold-mouseup
// sequence on the Orders trigger on BOTH sites.
import { chromium } from "playwright-core";

const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const instrument = () => {
  window.__focusLog = [];
  const orig = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (...args) {
    const stack = (new Error().stack || "").split("\n").slice(2, 5).join(" | ").slice(0, 200);
    window.__focusLog.push({ kind: "SCRIPT-FOCUS", el: this.getAttribute?.("role") + ":" + (this.textContent || "").slice(0, 12), stack });
    return orig.apply(this, args);
  };
  document.addEventListener("focusin", (e) => {
    window.__focusLog.push({
      kind: "FOCUSIN",
      el: e.target.getAttribute?.("role") + ":" + (e.target.textContent || "").slice(0, 12),
      matchesFV: e.target.matches(":focus-visible"),
    });
  }, true);
  document.addEventListener("mousedown", (e) => {
    window.__focusLog.push({ kind: "MOUSEDOWN", el: (e.target.textContent || "").slice(0, 12) });
  }, true);
};

const runSide = async (ctx, BASE, label, email, pw) => {
  const page = await ctx.newPage();
  await page.goto(BASE + "/account", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.evaluate(instrument);
  await page.evaluate(() => document.querySelector('[role="tablist"]').scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  const rect = await page.evaluate(() => {
    const t = [...document.querySelectorAll('[role="tab"]')].find((el) => /orders/i.test(el.textContent || ""));
    const r = t.getBoundingClientRect();
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  });
  await page.mouse.move(rect.cx, rect.cy);
  await page.mouse.down();
  await page.waitForTimeout(250);
  const atDown = await page.evaluate(() => {
    const ae = document.activeElement;
    return { ae: ae.tagName + ":" + (ae.getAttribute("role") || "") + (ae.textContent || "").slice(0, 10), m: ae.matches(":focus-visible") };
  });
  await page.mouse.up();
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => {
    const ae = document.activeElement;
    return {
      ae: ae.tagName + ":" + (ae.getAttribute("role") || "") + (ae.textContent || "").slice(0, 10),
      m: ae.matches(":focus-visible"),
      log: window.__focusLog,
    };
  });
  console.log(`=== ${label} ===`);
  console.log("AT MOUSEDOWN(held):", JSON.stringify(atDown));
  console.log("AFTER MOUSEUP+700ms:", JSON.stringify(after, null, 1));
  await page.close();
};

const browser = await chromium.launch();

// reference side
const refCtx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lp = await refCtx.newPage();
await withTimeout(lp.goto("https://fuzzy-lumina-style-hub.base44.app/login", { waitUntil: "domcontentloaded" }), 25000, "login");
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login-nav");
} catch {}
await lp.waitForTimeout(1500);
await lp.close();
await runSide(refCtx, "https://fuzzy-lumina-style-hub.base44.app", "REFERENCE", "sepnetflix2023@outlook.com", "$Abcd1234");

// clone side
const cloneCtx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lp2 = await cloneCtx.newPage();
await withTimeout(lp2.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" }), 25000, "login2");
await withTimeout(lp2.getByLabel("Email").fill("john@example.com"), 15000, "email2");
await withTimeout(lp2.getByLabel("Password").fill("Demo1234!"), 15000, "pw2");
await withTimeout(lp2.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login2-click");
try {
  await withTimeout(lp2.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login2-nav");
} catch {}
await lp2.waitForTimeout(1500);
await lp2.close();
await runSide(cloneCtx, "http://localhost:3000", "CLONE", "john@example.com", "Demo1234!");

await browser.close();
console.log("PROBE E COMPLETE");

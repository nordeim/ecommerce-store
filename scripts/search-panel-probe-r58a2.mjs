// Round-58 probe A2: the reference's search FORM children — the 44px
// mystery (input 876 + button 64 + gap 8 = 948 vs form 992). Enumerate the
// form's child elements + the FULL class strings of the input and the
// Search button (the truncated r58a read hid the size tokens).
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
await withTimeout(page.goto(REF + "/", { waitUntil: "domcontentloaded", timeout: 30000 }), 35000, "home-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);

// open the search panel (btn[1], the lucide-search icon)
await page.locator("header button").nth(1).click();
await page.waitForTimeout(1200);

const detail = await page.evaluate(() => {
  const header = document.querySelector("header");
  const form = header?.querySelector("form");
  const input = header?.querySelector("input");
  const btn = form ? [...form.querySelectorAll("button")].find((b) => b.textContent?.trim()) : null;
  const children = form
    ? [...form.children].map((c) => {
        const r = c.getBoundingClientRect();
        const cs = getComputedStyle(c);
        return {
          tag: c.tagName,
          cls: (c.className || "").toString(),
          w: Math.round(r.width),
          h: Math.round(r.height),
          x: Math.round(r.x),
          flex: cs.flex + " " + cs.flexGrow + "/" + cs.flexShrink + " basis:" + cs.flexBasis,
        };
      })
    : [];
  return {
    formChildren: children,
    inputFullCls: input ? (input.getAttribute("class") || "") : null,
    buttonFullCls: btn ? (btn.getAttribute("class") || "") : null,
    inputWrap: input && input.parentElement !== form ? (input.parentElement.className || "") : "input-is-direct-child",
  };
});
console.log(JSON.stringify(detail, null, 1));
await browser.close();

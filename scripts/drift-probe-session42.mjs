// Round-42 drift probe: localize the out-of-band pixel diffs on the PDP and
// login surfaces. Compares DOM observables (text content, key element
// geometry/counts) between the reference and the clone.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// reference login (unauth context is fine for PDP? ref needs auth for pdp)
const refLogin = await ctx.newPage();
await refLogin.goto(REF + "/login", { waitUntil: "networkidle" });
await refLogin.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await refLogin.getByLabel("Password").fill("$Abcd1234");
await refLogin.getByRole("button", { name: "Log in", exact: true }).click();
try { await refLogin.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await refLogin.waitForLoadState("networkidle");
await refLogin.waitForTimeout(1500);
await refLogin.close();

const cloneCtx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const cloneLogin = await cloneCtx.newPage();
await cloneLogin.goto(CLONE + "/login", { waitUntil: "networkidle" });
await cloneLogin.getByLabel("Email").fill("john@example.com");
await cloneLogin.getByLabel("Password").fill("Demo1234!");
await cloneLogin.getByRole("button", { name: "Log in", exact: true }).click();
try { await cloneLogin.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await cloneLogin.waitForLoadState("networkidle");
await cloneLogin.waitForTimeout(1200);
await cloneLogin.close();

const probePdp = (page) => page.evaluate(() => {
  const r = (s) => document.querySelector(s)?.getBoundingClientRect();
  const q = (s) => document.querySelector(s);
  const txt = (s) => q(s)?.textContent?.trim().replace(/\s+/g, " ").slice(0, 120);
  return {
    h1: txt("h1"),
    price: txt("[class*='price'], .text-3xl, .text-4xl") || [...document.querySelectorAll("div,p,span")].find(e => /^\$[\d,.]+$/.test(e.textContent?.trim() || ""))?.textContent?.trim(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    imgCount: document.images.length,
    imgSrcs: [...document.images].slice(0, 3).map(i => (i.getAttribute("src") || "").slice(0, 90)),
    firstImgNat: document.images[0]?.naturalWidth,
    descSnippet: txt("main p, main [class*='text-sm']")?.slice(0, 100),
    btnTexts: [...document.querySelectorAll("main button")].map(b => b.textContent?.trim()).filter(Boolean).slice(0, 6),
    sectionCount: document.querySelectorAll("main section").length,
    docH: document.documentElement.scrollHeight,
  };
});

const probeLogin = (page) => page.evaluate(() => {
  const txt = (s) => document.querySelector(s)?.textContent?.trim().replace(/\s+/g, " ").slice(0, 140);
  return {
    title: txt("h1"),
    subtitle: txt("h1 + *, p"),
    labels: [...document.querySelectorAll("label")].map(l => l.textContent?.trim()),
    btnText: document.querySelector('button[type="submit"], form button')?.textContent?.trim(),
    docH: document.documentElement.scrollHeight,
    linkTexts: [...document.querySelectorAll("a")].map(a => a.textContent?.trim()).filter(Boolean).slice(0, 8),
    formClass: document.querySelector("form")?.className?.slice(0, 100),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
});

// PDP probes
const rp = await ctx.newPage(); await rp.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" }); await rp.waitForTimeout(1500);
const cp = await cloneCtx.newPage(); await cp.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" }); await cp.waitForTimeout(1500);
console.log("PDP REF  =", JSON.stringify(await probePdp(rp), null, 1));
console.log("PDP CLONE=", JSON.stringify(await probePdp(cp), null, 1));

// Login probes (fresh anon contexts)
const ra = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const ca = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const rlp = await ra.newPage(); await rlp.goto(REF + "/login", { waitUntil: "networkidle" }); await rlp.waitForTimeout(1000);
const clp = await ca.newPage(); await clp.goto(CLONE + "/login", { waitUntil: "networkidle" }); await clp.waitForTimeout(1000);
console.log("LOGIN REF  =", JSON.stringify(await probeLogin(rlp), null, 1));
console.log("LOGIN CLONE=", JSON.stringify(await probeLogin(clp), null, 1));

await browser.close();

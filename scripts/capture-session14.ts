// Session-14 screenshot capture (production standalone server, remediated
// code). Mirrors scripts/capture-session13.ts conventions. Run after
// `bun run start`: bun scripts/capture-session14.ts
// 81 the CSP evidence on the register screen (the force-dynamic'd auth
//    page, hydration live — the email validation state proves the client
//    island mounted under CSP)
// 82 the CSP nonce proof: the served document's script tags + the CSP
//    header (rendered into a data-URL browser page — the nonce and the
//    matching script tags visible)
// 83 the PDP cart-add under CSP (toast + badge — the server-action path)
// 84 the /cart page after the add (DB write landed under CSP)
// 85 the 14th mobile-nav standing verification (open Sheet, iPhone 14)
import { devices, chromium } from "@playwright/test";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

const settle = async (page: import("playwright").Page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(900);
};

// --- 81: register screen hydrates under CSP --------------------------------
const reg = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await reg.goto(`${BASE}/register`, { waitUntil: "networkidle" });
await settle(reg);
// Drive the native email validation to prove the client island is alive.
await reg.getByLabel("Email").fill("not-an-email");
await reg.getByRole("button", { name: "Create account", exact: true }).click();
await reg.waitForTimeout(400);
await reg.screenshot({ path: `${OUT}/81-csp-register-hydrated.png` });

// --- 82: the nonce proof page (header + nonced script tags) ----------------
const res = await fetch(`${BASE}/`);
const html = await res.text();
const csp = res.headers.get("content-security-policy") ?? "";
const nonce = csp.match(/'nonce-([^']+)'/)?.[1] ?? "(none)";
const scripts = (html.match(/<script\b[^>]*>/g) ?? []).slice(0, 6);
const proof = `data:text/html,${encodeURIComponent(`<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:ui-monospace,monospace;background:#0f172a;color:#e2e8f0;padding:24px;font-size:12px;line-height:1.6}
h1{font-family:system-ui;color:#fbfae4;font-size:16px;margin:0 0 12px}
.box{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 16px;margin-bottom:12px;white-space:pre-wrap;word-break:break-all}
.label{color:#f59e0b;font-weight:700}
.ok{color:#4ade80}
</style></head><body>
<h1>GET / — Content-Security-Policy + per-request nonce (session-14, SEC-CSP-1)</h1>
<div class="box"><span class="label">content-security-policy:</span>
${csp.replace(/</g, "&lt;")}</div>
<div class="box"><span class="label">extracted nonce:</span> <span class="ok">${nonce}</span>
<span class="label">   script tags carrying nonce= (first 6 of ${html.match(/<script\b[^>]*>/g)?.length ?? 0}):</span>
${scripts.map((s) => `<span class="ok">${s.replace(/</g, "&lt;")}</span>`).join("\n")}</div>
</body></html>`)}`;
const proofPage = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await proofPage.goto(proof);
await proofPage.waitForTimeout(500);
await proofPage.screenshot({ path: `${OUT}/82-csp-nonce-proof.png` });

// --- 83 + 84: the server-action path under CSP ------------------------------
const shopper = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await shopper.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
await settle(shopper);
await shopper
  .locator("main .flex.items-center.gap-4.mb-4")
  .getByRole("button", { name: "Add to Cart", exact: true })
  .click();
await shopper.waitForTimeout(700);
await shopper.screenshot({ path: `${OUT}/83-csp-cart-add-toast.png` });

await shopper.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
await settle(shopper);
await shopper.screenshot({ path: `${OUT}/84-csp-cart-landing.png` });

// --- 85: the 14th mobile-nav standing verification ---------------------------
const mob = await browser.newPage({ ...devices["iPhone 14"] });
await mob.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mob.waitForTimeout(600);
await mob.getByRole("button", { name: "Open navigation menu" }).click();
await mob.waitForTimeout(700);
await mob.screenshot({ path: `${OUT}/85-mobile-nav-14th-verification.png` });

await browser.close();
console.log("captured 81-85");

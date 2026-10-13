#!/usr/bin/env node
// Round-54 captures 281-285: the footer interaction family + the
// announcement-bar closure — (281) the footer at rest (the full 4-col
// block), (282) the Shop link hovered (the /60 -> full lift), (283) the
// policy span hovered (THE FIX'S PROOF — the /60 target, softer than
// full), (284) the announcement bar (the closure's anchor — the static
// orange strip), (285) the mobile footer at 390px (the 1-col collapse +
// the bottom-row column). Probe-first, single invocation, the production
// standalone on :3001 — a FRESH process, ZERO DB mutations by construction.
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PROD_PORT = 3001;
const PROD = `http://localhost:${PROD_PORT}`;
const OUT = "docs/screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
  } catch {}
};

killPort(PROD_PORT);
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db", AUTH_SECRET: "capture-r54-secret" },
  stdio: "ignore",
});
let up = false;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`${PROD}/api/health`); up = (await r.json()).ok === true; } catch {}
  if (up) break; await sleep(1000);
}
if (!up) { console.error("standalone never came up"); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(2600);

// (281) the footer at rest — the full 4-col block.
const footer = page.getByRole("contentinfo");
await footer.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const restProbe = await page.evaluate(() => {
  const f = document.querySelector("footer");
  const grid = f.querySelector(".grid");
  const link = [...f.querySelectorAll("a")].find((a) => a.textContent.trim() === "All Products");
  const policy = [...f.querySelectorAll("span")].find((s) => s.textContent.trim() === "Privacy Policy");
  return {
    gridCols: getComputedStyle(grid).gridTemplateColumns,
    gridGap: getComputedStyle(grid).columnGap,
    shopLinkColor: getComputedStyle(link).color,
    policyCls: policy.className,
    policyColor: getComputedStyle(policy).color,
    footerH: f.offsetHeight,
  };
});
console.log("[281 probe: footer at rest]", JSON.stringify(restProbe));
const fbox = await footer.boundingBox();
await page.screenshot({ path: `${OUT}/281-footer-at-rest.png`, clip: { x: 0, y: fbox.y, width: 1280, height: Math.min(fbox.height, 620) } });
await sleep(200);

// (282) the Shop link hovered — the /60 -> full lift (REAL mouse).
const shopLink = page.getByRole("contentinfo").getByRole("link", { name: "All Products" });
await shopLink.hover();
await page.waitForTimeout(450);
const shopProbe = await shopLink.evaluate((el) => ({ hovered: getComputedStyle(el).color }));
console.log("[282 probe: shop link hovered]", JSON.stringify(shopProbe));
const sbox = await shopLink.boundingBox();
await page.screenshot({ path: `${OUT}/282-shop-link-hovered.png`, clip: { x: Math.max(0, sbox.x - 120), y: Math.max(0, sbox.y - 90), width: 420, height: 260 } });
await page.mouse.move(4, 4);
await sleep(350);

// (283) the policy span hovered — THE FIX'S PROOF: /40 -> /60 (not full).
const privacy = page.getByRole("contentinfo").getByText("Privacy Policy", { exact: true });
await privacy.scrollIntoViewIfNeeded();
await privacy.hover();
await page.waitForTimeout(450);
const privacyProbe = await privacy.evaluate((el) => ({ hovered: getComputedStyle(el).color }));
console.log("[283 probe: privacy hovered (the fix's /60)]", JSON.stringify(privacyProbe));
const pbox = await privacy.boundingBox();
await page.screenshot({ path: `${OUT}/283-policy-hover-target-60.png`, clip: { x: Math.max(0, pbox.x - 220), y: Math.max(0, pbox.y - 60), width: 640, height: 160 } });
await page.mouse.move(4, 4);
await sleep(350);

// (284) the announcement bar — the closure's anchor (the static strip).
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(500);
const annProbe = await page.evaluate(() => {
  const bar = document.querySelector("header").firstElementChild;
  const cs = getComputedStyle(bar);
  return { h: bar.offsetHeight, bg: cs.backgroundColor, animation: cs.animationName, children: bar.childElementCount, text: bar.textContent.trim() };
});
console.log("[284 probe: announcement bar]", JSON.stringify(annProbe));
await page.screenshot({ path: `${OUT}/284-announcement-bar-static.png`, clip: { x: 0, y: 0, width: 1280, height: 150 } });
await sleep(200);

// (285) the mobile footer at 390px — the 1-col collapse + the column bottom row.
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto(`${PROD}/`, { waitUntil: "networkidle" });
await mob.waitForTimeout(1800);
await mob.evaluate(() => document.querySelector("footer").scrollIntoView());
await mob.waitForTimeout(600);
const mobProbe = await mob.evaluate(() => {
  const f = document.querySelector("footer");
  const grid = f.querySelector(".grid");
  const row = [...f.querySelectorAll("div")].filter((d) => getComputedStyle(d).display.includes("flex") && d.textContent.includes("©")).pop();
  return { gridCols: getComputedStyle(grid).gridTemplateColumns, bottomDir: getComputedStyle(row).flexDirection, barH: document.querySelector("header").firstElementChild.offsetHeight };
});
console.log("[285 probe: mobile footer]", JSON.stringify(mobProbe));
const mf = await mob.locator("footer").boundingBox();
await mob.screenshot({ path: `${OUT}/285-mobile-footer-collapse.png`, clip: { x: 0, y: Math.max(0, mf.y - 20), width: 390, height: Math.min(mf.height, 820) } });

await browser.close();
killPort(PROD_PORT);
try { process.kill(prod.pid, "SIGKILL"); } catch {}
console.log("[r54 captures 281-285 complete]");

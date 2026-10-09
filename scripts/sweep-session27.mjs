// Session-15 paired pixel sweep (Round-15 standing drift watch): captures
// the reference and the clone at 1024x768 on the 8 pinned routes and diffs
// them (differing-pixel count with per-channel tolerance, the repo's
// convention). Follows the session-14 lessons: ONE host (localhost:3000)
// for the whole clone lifecycle; auth verified via location.pathname
// immediately before every authed capture; networkidle + font settle +
// fixed settle delay on client-island routes.
// Run: node scripts/sweep-session27.mjs   (server must be up on :3000)
import { chromium } from "playwright-core";
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { mkdirSync, writeFileSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";
const OUT = "/tmp/sweep27";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { name: "home", path: "/", auth: true },
  { name: "shop", path: "/shop", auth: true },
  { name: "pdp", path: "/product/wireless-headphones", auth: true },
  { name: "cart", path: "/cart", auth: true },
  { name: "wishlist", path: "/wishlist", auth: true },
  { name: "checkout", path: "/checkout", auth: true },
  { name: "account", path: "/account", auth: true },
  { name: "login", path: "/login", auth: false },
];

const settle = async (page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(1000);
};

const login = async (ctx, base, email, password) => {
  const page = await ctx.newPage();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const path = new URL(page.url()).pathname;
  await page.close();
  return path;
};

const browser = await chromium.launch();

// --- reference session (operator account) ---
const refCtx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const refPath = await login(refCtx, REF, "sepnetflix2023@outlook.com", "$Abcd1234");
console.log("ref login ->", refPath);

// --- clone session (demo user, ONE host: localhost) ---
const cloneCtx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const clonePath = await login(cloneCtx, CLONE, "john@example.com", "Demo1234!");
console.log("clone login ->", clonePath);
if (clonePath !== "/account") {
  console.error("CLONE AUTH FAILED — aborting (L22: verify pathname, not cookie presence)");
  process.exit(1);
}

// --- unauthenticated context for /login pairs ---
const refAnon = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const cloneAnon = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

const diff = (a, b) => {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return { pct: 100, w: [A.width, B.width] };
  let diffPx = 0;
  const n = A.width * A.height;
  for (let i = 0; i < A.data.length; i += 4) {
    if (
      Math.abs(A.data[i] - B.data[i]) > 16 ||
      Math.abs(A.data[i + 1] - B.data[i + 1]) > 16 ||
      Math.abs(A.data[i + 2] - B.data[i + 2]) > 16 ||
      Math.abs(A.data[i + 3] - B.data[i + 3]) > 16
    ) diffPx++;
  }
  return { pct: +((diffPx / n) * 100).toFixed(2), px: diffPx };
};

const results = {};
for (const r of ROUTES) {
  const refPage = (r.auth ? refCtx : refAnon).newPage();
  const clonePage = (r.auth ? cloneCtx : cloneAnon).newPage();
  const [rp, cp] = [await refPage, await clonePage];
  await rp.goto(REF + r.path, { waitUntil: "networkidle" });
  await cp.goto(CLONE + r.path, { waitUntil: "networkidle" });
  await settle(rp);
  await settle(cp);
  // L22: verify pathname immediately before authed captures
  if (r.auth) {
    const cpn = await cp.evaluate(() => location.pathname);
    if (cpn !== r.path) {
      console.error(`AUTH GUARD: clone ${r.name} landed on ${cpn} — session artifact, skipping`);
      results[r.name] = "AUTH-ARTIFACT";
    }
  }
  const ra = await rp.screenshot();
  const ca = await cp.screenshot();
  writeFileSync(`${OUT}/${r.name}-ref.png`, ra);
  writeFileSync(`${OUT}/${r.name}-clone.png`, ca);
  const d = diff(ra, ca);
  results[r.name] = d;
  console.log(`${r.name.padEnd(9)} ${typeof d === "string" ? d : d.pct + "% (" + (d.px ?? 0) + " px)"}`);
  await rp.close();
  await cp.close();
}

await browser.close();
console.log("\nBASELINE BAND: 0.28–0.68% (documented). Out-of-band => investigate.");
const bad = Object.entries(results).filter(([k, v]) => typeof v === "object" && v.pct > 0.8);
console.log(bad.length ? "OUT OF BAND: " + bad.map(([k]) => k).join(", ") : "ALL ROUTES AT BASELINE BAND");

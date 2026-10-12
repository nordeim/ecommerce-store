// Round-46 probe part A2: corrected follow-up — the reference's search panel
// close/reopen RESET question, the EMPTY submit, the typed submit (Search
// button), and the Enter submit, all with the panel verifiably OPEN. Part A
// discovered: Escape does NOT close the reference's panel (the toggle does),
// which broke A's tail sequence.
import { chromium } from "playwright-core";
const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r46";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lp = await ctx.newPage();
await withTimeout(lp.goto(REF + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 }), 22000, "login-nav");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await withTimeout(page.goto(REF + "/", { waitUntil: "domcontentloaded", timeout: 30000 }), 35000, "home-goto");
await page.waitForTimeout(3500);

// Find the search toggle: the header button whose click reveals an input.
const headerBtns = page.locator("header button");
const n = await headerBtns.count();
let toggleIdx = -1;
for (let i = 0; i < n; i++) {
  await withTimeout(headerBtns.nth(i).click(), 5000, `probe-btn${i}`);
  await page.waitForTimeout(600);
  if ((await page.locator("header input").count()) > 0) { toggleIdx = i; break; }
}
console.log("TOGGLE INDEX:", toggleIdx);
if (toggleIdx < 0) { await browser.close(); console.log("NO TOGGLE — DONE"); process.exit(0); }

const input = page.locator("header input").first();

// 1. Type, then close via the toggle, then reopen: is the query reset?
await withTimeout(input.fill("serum"), 8000, "type-serum");
await page.waitForTimeout(1200);
await withTimeout(headerBtns.nth(toggleIdx).click(), 5000, "close-via-toggle");
await page.waitForTimeout(900);
console.log("CLOSED INPUT COUNT:", await page.locator("header input").count());
await withTimeout(headerBtns.nth(toggleIdx).click(), 5000, "reopen");
await page.waitForTimeout(1200);
const reopened = await page.evaluate(() => {
  const input = document.querySelector("header input");
  return { visible: !!input, value: input ? input.value : null };
});
console.log("REOPENED (toggle path):", JSON.stringify(reopened));

// 2. Empty submit: click Search with an empty input
await withTimeout(page.locator("header input").first().fill(""), 5000, "clear");
const beforeUrl = page.url();
const searchBtn = page.locator("header button").filter({ hasText: "Search" }).first();
console.log("SEARCH BTN COUNT:", await searchBtn.count());
if ((await searchBtn.count()) > 0) {
  await withTimeout(searchBtn.click(), 5000, "empty-submit");
  await page.waitForTimeout(1800);
  const u = new URL(page.url());
  console.log("EMPTY SUBMIT:", JSON.stringify({ navigated: page.url() !== beforeUrl, path: u.pathname, search: u.search, inputStillVisible: (await page.locator("header input").count()) > 0 }));
}

// 3. Typed submit via the Search button
await withTimeout(page.locator("header input").first().fill("watch"), 5000, "type-watch");
await withTimeout(searchBtn.click(), 5000, "typed-submit");
await page.waitForTimeout(3500);
{
  const u = new URL(page.url());
  const heading = await page.evaluate(() => document.querySelector("main h1")?.textContent?.trim() ?? null);
  const countLine = await page.evaluate(() => (document.querySelector("main")?.textContent ?? "").match(/\d+\s+products?\s+found/)?.[0] ?? null);
  console.log("TYPED SUBMIT:", JSON.stringify({ path: u.pathname, search: u.search, heading, countLine }));
  await page.screenshot({ path: OUT + "/ref-shop-watch-btn.png" });
}

// 4. Back home, open the panel, type + Enter
await withTimeout(page.goto(REF + "/", { waitUntil: "domcontentloaded" }), 25000, "home2");
await page.waitForTimeout(2500);
await withTimeout(headerBtns.nth(toggleIdx).click(), 5000, "open-again");
await page.waitForTimeout(1000);
await withTimeout(page.locator("header input").first().fill("serum"), 5000, "type-serum2");
await page.keyboard.press("Enter");
await page.waitForTimeout(3500);
{
  const u = new URL(page.url());
  console.log("ENTER SUBMIT:", JSON.stringify({ path: u.pathname, search: u.search }));
}

await browser.close();
console.log("PROBE A2 DONE");

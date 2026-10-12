// Round-46 probe part A: the reference's SEARCH DROPDOWN family — the panel
// anatomy, the typing behavior under a full network watch (the typeahead
// relationship), the no-match state, the close/reopen reset, the empty
// submit, and the Enter submit. Every interaction wrapped with short races
// so nothing hangs.
import { chromium } from "playwright-core";
const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r46";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

// The reference gates the storefront behind login (measured r46 first-hand —
// the bare / goto redirects to /login). Log in first (the r45 pattern).
const lp = await ctx.newPage();
await withTimeout(lp.goto(REF + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 }), 22000, "login-nav");
await lp.waitForTimeout(2000);
console.log("login done ->", new URL(lp.url()).pathname);
await lp.close();

const requests = [];
ctx.on("request", (r) => {
  const u = new URL(r.url());
  // search-shaped = any request whose URL or body carries a query param that
  // looks like a typeahead/search call (q=, search=, /api/search, suggest…)
  const searchShaped =
    /search|suggest|typeahead|autocomplete/i.test(u.pathname) ||
    /[?&](q|query|search|term)=/i.test(u.search);
  requests.push({ m: r.method(), p: u.pathname + u.search, hit: searchShaped });
});

const page = await ctx.newPage();
await withTimeout(page.goto(REF + "/", { waitUntil: "domcontentloaded", timeout: 30000 }), 35000, "home-goto");
await page.waitForTimeout(4000);

// 1. The search toggle button — the header button (aria-label or svg).
const searchBtn = page.locator("header button").filter({ has: page.locator("svg") }).nth(1);
const btnCount = await page.locator("header button").count();
console.log("HEADER BUTTONS:", btnCount);
// find the one with a Search-ish aria-label or the magnifier svg
const byLabel = page.locator('header button[aria-label="Search"]');
let opened = false;
if ((await byLabel.count()) > 0) {
  await withTimeout(byLabel.first().click(), 8000, "search-click");
  opened = true;
} else {
  // try each header button, look for an input appearing
  for (let i = 0; i < btnCount && !opened; i++) {
    await withTimeout(page.locator("header button").nth(i).click(), 5000, `btn${i}-click`);
    await page.waitForTimeout(700);
    if ((await page.locator("header input").count()) > 0) opened = true;
  }
}
console.log("DROPDOWN OPENED:", opened);
await page.waitForTimeout(1000);
await page.screenshot({ path: OUT + "/search-panel.png" });

// 2. The panel anatomy
const panel = await page.evaluate(() => {
  const input = document.querySelector("header input");
  const form = document.querySelector("header form");
  const buttons = [...document.querySelectorAll("header button")].map((b) => b.textContent?.trim());
  return {
    inputLabel: input?.getAttribute("aria-label") ?? null,
    placeholder: input?.getAttribute("placeholder") ?? null,
    hasForm: !!form,
    buttons,
  };
});
console.log("PANEL:", JSON.stringify(panel));

// 3. Type a matching query — full network watch
const input = page.locator("header input").first();
if (opened && (await input.count()) > 0) {
  await withTimeout(input.fill("serum"), 8000, "type-serum");
  await page.waitForTimeout(3500); // outlive any 250ms debounce + render
  const afterMatch = await page.evaluate(() => {
    const pop = [...document.querySelectorAll("header div.absolute, header [class*='popover'], header [class*='absolute']")];
    const body = document.body.textContent ?? "";
    return {
      popoverish: pop.length,
      searchingLine: body.includes("Searching"),
      suggestionNames: ["Vitamin C Serum", "Serum"].filter((n) => body.includes(n)),
      inputVisible: !!document.querySelector("header input"),
    };
  });
  console.log("AFTER 'serum' TYPED:", JSON.stringify(afterMatch));
  await page.screenshot({ path: OUT + "/search-serum-typed.png" });

  // 4. No-match query
  await withTimeout(input.fill("zzzqqq"), 8000, "type-zzz");
  await page.waitForTimeout(2500);
  const afterNoMatch = await page.evaluate(() => ({
    inputVisible: !!document.querySelector("header input"),
    searchingLine: (document.body.textContent ?? "").includes("Searching"),
  }));
  console.log("AFTER 'zzzqqq' TYPED:", JSON.stringify(afterNoMatch));

  // 5. Escape → reopen → is the query reset?
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  const closedState = await page.evaluate(() => ({ inputVisible: !!document.querySelector("header input") }));
  console.log("AFTER ESCAPE:", JSON.stringify(closedState));
  if ((await byLabel.count()) > 0) await withTimeout(byLabel.first().click(), 5000, "reopen");
  else await withTimeout(page.locator("header button").nth(1).click(), 5000, "reopen2");
  await page.waitForTimeout(1200);
  const reopened = await page.evaluate(() => {
    const input = document.querySelector("header input");
    return { inputVisible: !!input, value: input ? input.value : null };
  });
  console.log("REOPENED:", JSON.stringify(reopened));

  // 6. Empty submit — click the Search button with an empty input
  const emptyInput = page.locator("header input").first();
  await withTimeout(emptyInput.fill(""), 5000, "clear");
  const beforeUrl = page.url();
  const searchSubmit = page.locator("header form button, header button").filter({ hasText: /^Search$/ }).first();
  if ((await searchSubmit.count()) > 0) {
    await withTimeout(searchSubmit.click(), 5000, "empty-submit");
    await page.waitForTimeout(1500);
    console.log("EMPTY SUBMIT:", JSON.stringify({ sameUrl: page.url() === beforeUrl, url: new URL(page.url()).pathname + new URL(page.url()).search }));
  } else {
    console.log("EMPTY SUBMIT: no Search button found");
  }

  // 7. Enter submit — type + Enter
  await withTimeout(page.locator("header input").first().fill("watch"), 5000, "type-watch");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
  const u = new URL(page.url());
  console.log("ENTER SUBMIT:", JSON.stringify({ path: u.pathname, search: u.search }));
  await page.screenshot({ path: OUT + "/search-enter-result.png" });
}

// 8. The full request log — search-shaped traffic summary
const searchShaped = requests.filter((r) => r.hit);
console.log("TOTAL REQUESTS:", requests.length);
console.log("SEARCH-SHAPED REQUESTS:", searchShaped.length, JSON.stringify(searchShaped.slice(0, 10)));

await browser.close();
console.log("PROBE A DONE");

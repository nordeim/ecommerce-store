// Round-45 probe part A: login → /account → tabs → Addresses tab resting +
// Add New form enumeration (labels/placeholders/buttons) + the invalid-fill
// attempt. Every interaction wrapped with short races so nothing hangs.
import { chromium } from "playwright-core";
const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r45";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const posts = [];
ctx.on("request", (r) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method())) {
    posts.push(`${r.method()} ${new URL(r.url()).pathname}`);
  }
});

const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "domcontentloaded" });
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 }), 22000, "login-nav");
await lp.waitForTimeout(2000);
console.log("login done, posts so far:", JSON.stringify(posts));
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/account", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(4000);
console.log("URL:", new URL(page.url()).pathname);
await page.screenshot({ path: OUT + "/account-landing.png" });

const tabs = await page.evaluate(() =>
  [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent?.trim())
);
console.log("TABS:", JSON.stringify(tabs));

// Addresses tab
await withTimeout(page.getByRole("tab", { name: /address/i }).first().click(), 10000, "addr-tab");
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT + "/addresses-resting.png" });
const resting = await page.evaluate(() => {
  const out = { buttons: [], text: null, defaultBadge: false };
  document.querySelectorAll("main button").forEach((b) => out.buttons.push(b.textContent?.trim()));
  out.text = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 700) ?? "";
  out.defaultBadge = out.text.includes("Default");
  return out;
});
console.log("ADDR BUTTONS:", JSON.stringify(resting.buttons));
console.log("ADDR TEXT (head):", JSON.stringify(resting.text.slice(0, 420)));
console.log("DEFAULT BADGE:", resting.defaultBadge);

// Add New
const addNew = page.getByRole("button", { name: /add new/i }).first();
const addCount = await addNew.count();
console.log("ADD NEW present:", addCount > 0);
if (addCount > 0) {
  await withTimeout(addNew.click(), 10000, "addnew");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: OUT + "/addresses-form-open.png" });
  const formOpen = await page.evaluate(() => {
    const out = { labels: [], inputs: {}, buttons: [] };
    document.querySelectorAll("main label").forEach((l) => {
      const t = l.textContent?.trim();
      if (t) out.labels.push(t);
    });
    document.querySelectorAll("main form input, main input").forEach((i) => {
      if (i.type !== "checkbox" && i.type !== "hidden") {
        out.inputs[i.id || i.name || i.placeholder] = { type: i.type, ph: i.placeholder ?? "", required: i.required };
      }
    });
    document.querySelectorAll("main button").forEach((b) => out.buttons.push(b.textContent?.trim()));
    return out;
  });
  console.log("FORM LABELS:", JSON.stringify(formOpen.labels));
  console.log("FORM INPUTS:", JSON.stringify(formOpen.inputs));
  console.log("FORM BUTTONS:", JSON.stringify(formOpen.buttons));
}

console.log("POSTS:", JSON.stringify(posts));
await browser.close();

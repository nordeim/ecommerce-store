// Round-45 probe part B: does the reference's Edit button open a form? A
// broader DOM sweep (whole document, incl. dialogs/portals) after Add New
// and Edit clicks. Plus the Profile + Settings tab enumeration.
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
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/account", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(3500);
await withTimeout(page.getByRole("tab", { name: /address/i }).first().click(), 10000, "addr-tab");
await page.waitForTimeout(1800);

const sweep = () =>
  page.evaluate(() => {
    const out = { inputs: [], dialogs: 0, forms: 0, text: "" };
    document.querySelectorAll("input").forEach((i) => {
      if (i.type !== "hidden") out.inputs.push({ id: i.id || i.name, type: i.type, ph: i.placeholder ?? "" });
    });
    out.dialogs = document.querySelectorAll("[role=dialog], [data-state=open]").length;
    out.forms = document.querySelectorAll("form").length;
    out.text = (document.querySelector("main")?.textContent ?? document.body.textContent ?? "").replace(/\s+/g, " ").slice(0, 500);
    return out;
  });

// 1. Add New again, whole-document sweep
await withTimeout(page.getByRole("button", { name: /add new/i }).first().click(), 10000, "addnew");
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT + "/B-after-addnew.png" });
console.log("AFTER ADD NEW:", JSON.stringify(await sweep()));

// 2. Edit click — whole-document sweep
const edit = page.getByRole("button", { name: "Edit" }).first();
if (await edit.count()) {
  await withTimeout(edit.click(), 10000, "edit");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: OUT + "/B-after-edit.png" });
  console.log("AFTER EDIT:", JSON.stringify(await sweep()));
  // if a form opened, enumerate its labels
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll("label")].map((l) => l.textContent?.trim()).filter(Boolean)
  );
  console.log("LABELS AFTER EDIT:", JSON.stringify(labels));
  const btns = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.textContent?.trim()));
  console.log("BUTTONS AFTER EDIT:", JSON.stringify(btns));
}

// 3. Profile tab — inputs + save attempt
posts.length = 0;
await withTimeout(page.getByRole("tab", { name: /profile/i }).first().click(), 10000, "prof-tab");
await page.waitForTimeout(1800);
await page.screenshot({ path: OUT + "/B-profile.png" });
const prof = await page.evaluate(() => {
  const out = { inputs: {}, buttons: [] };
  document.querySelectorAll("main input").forEach((i) => {
    if (i.type !== "hidden") out.inputs[i.id || i.name] = i.value?.slice(0, 25) ?? "";
  });
  document.querySelectorAll("main button").forEach((b) => out.buttons.push(b.textContent?.trim()));
  return out;
});
console.log("PROFILE INPUTS:", JSON.stringify(prof.inputs));
console.log("PROFILE BUTTONS:", JSON.stringify(prof.buttons));
// break first name to 1 char and Save
const fn = page.locator("main input").first();
if (prof.buttons.some((b) => /save/i.test(b ?? ""))) {
  await withTimeout(fn.fill("J"), 8000, "fn-fill");
  const pb = posts.length;
  await withTimeout(page.getByRole("button", { name: /save/i }).first().click(), 8000, "save");
  await page.waitForTimeout(2200);
  console.log("POSTS ON PROFILE SAVE:", JSON.stringify(posts.slice(pb)));
  const ptxt = await page.evaluate(() =>
    (document.querySelector("main")?.textContent ?? "").replace(/\s+/g, " ").slice(0, 400)
  );
  console.log("PROFILE TEXT AFTER SAVE:", JSON.stringify(ptxt.slice(0, 300)));
  console.log("PROFILE VALIDATION TEXT:", /required|invalid|must be|at least/i.test(ptxt));
  await page.screenshot({ path: OUT + "/B-profile-after-save.png" });
}

// 4. Settings tab — password inputs + update attempt
posts.length = 0;
await withTimeout(page.getByRole("tab", { name: /settings/i }).first().click(), 10000, "set-tab");
await page.waitForTimeout(1800);
await page.screenshot({ path: OUT + "/B-settings.png" });
const set = await page.evaluate(() => {
  const out = { pw: [], buttons: [], text: "" };
  document.querySelectorAll("main input[type=password]").forEach((i) => out.pw.push(i.id || i.name));
  document.querySelectorAll("main button").forEach((b) => out.buttons.push(b.textContent?.trim()));
  out.text = (document.querySelector("main")?.textContent ?? "").replace(/\s+/g, " ").slice(0, 450);
  return out;
});
console.log("SETTINGS PW INPUTS:", JSON.stringify(set.pw));
console.log("SETTINGS BUTTONS:", JSON.stringify(set.buttons));
console.log("SETTINGS TEXT:", JSON.stringify(set.text.slice(0, 350)));
if (set.pw.length >= 2 && set.buttons.some((b) => /update/i.test(b ?? ""))) {
  await withTimeout(page.locator("main input[type=password]").first().fill("$Abcd1234"), 8000, "cur-fill");
  await withTimeout(page.locator("main input[type=password]").nth(1).fill("short"), 8000, "new-fill");
  const pb = posts.length;
  await withTimeout(page.getByRole("button", { name: /update/i }).first().click(), 8000, "upd");
  await page.waitForTimeout(2200);
  console.log("POSTS ON PASSWORD UPDATE:", JSON.stringify(posts.slice(pb)));
  const stxt = await page.evaluate(() =>
    (document.querySelector("main")?.textContent ?? "").replace(/\s+/g, " ").slice(0, 400)
  );
  console.log("SETTINGS TEXT AFTER UPDATE:", JSON.stringify(stxt.slice(0, 300)));
  console.log("PASSWORD VALIDATION TEXT:", /required|invalid|must be|at least 8/i.test(stxt));
  await page.screenshot({ path: OUT + "/B-settings-after-update.png" });
}

await browser.close();

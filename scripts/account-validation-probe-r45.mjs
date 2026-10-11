// Round-45 probe: the reference's ACCOUNT family measured live — the
// Addresses tab's Add New form (its fields, its validation behavior, its
// save path), the Profile form, and the Settings password form. Answers:
// (a) does the reference's address form validate input (field errors)?
// (b) is its Save a real write (network) or the Base44 cosmetic mock?
// (c) do the profile/password forms fire anything?
// Method: login → /account → enumerate tabs → walk each form, watching
// network requests the whole time.
import { chromium } from "playwright-core";
const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r45";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

// network watch (all pages)
const posts = [];
ctx.on("request", (r) => {
  if (r.method() === "POST" || r.method() === "PUT" || r.method() === "PATCH" || r.method() === "DELETE") {
    posts.push(`${r.method()} ${new URL(r.url()).pathname}`);
  }
});

const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/account", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
console.log("URL:", new URL(page.url()).pathname);
await page.screenshot({ path: OUT + "/account-landing.png" });

// ---- enumerate the tabs --------------------------------------------------
const tabs = await page.evaluate(() =>
  [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent?.trim())
);
console.log("TABS:", JSON.stringify(tabs));

// ---- ADDRESSES tab -------------------------------------------------------
const addrTab = page.getByRole("tab", { name: /address/i }).first();
if (await addrTab.count()) {
  await addrTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + "/addresses-resting.png" });
  const resting = await page.evaluate(() => {
    const out = { buttons: [], cards: [], text: null };
    document.querySelectorAll("main button").forEach((b) => out.buttons.push(b.textContent?.trim()));
    out.text = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 700) ?? "";
    return out;
  });
  console.log("ADDR RESTING BUTTONS:", JSON.stringify(resting.buttons));
  console.log("ADDR RESTING TEXT:", JSON.stringify(resting.text.slice(0, 500)));

  // Add New
  const addNew = page.getByRole("button", { name: /add new/i }).first();
  if (await addNew.count()) {
    await addNew.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: OUT + "/addresses-form-open.png" });
    const formOpen = await page.evaluate(() => {
      const out = { labels: [], placeholders: {}, buttons: [], required: [] };
      document.querySelectorAll("main label").forEach((l) => out.labels.push(l.textContent?.trim()));
      document.querySelectorAll("main input").forEach((i) => {
        if (i.placeholder) out.placeholders[i.name || i.id] = i.placeholder;
        if (i.required) out.required.push(i.name || i.id);
      });
      document.querySelectorAll("main button").forEach((b) => out.buttons.push(b.textContent?.trim()));
      return out;
    });
    console.log("ADDR FORM LABELS:", JSON.stringify(formOpen.labels));
    console.log("ADDR FORM PLACEHOLDERS:", JSON.stringify(formOpen.placeholders));
    console.log("ADDR FORM REQUIRED:", JSON.stringify(formOpen.required));
    console.log("ADDR FORM BUTTONS:", JSON.stringify(formOpen.buttons));

    // fill INVALID values (bad zip, short street, 1-char name) — by label or placeholder
    const fill = async (sel, val) => {
      const byLabel = page.locator(`main input[id], main input[name]`).filter({ has: page.locator("xpath=..").locator(`label:has-text("${sel}")`) });
      const ph = page.getByPlaceholder(sel).first();
      const lab = page.getByLabel(sel, { exact: false }).first();
      try { await lab.fill(val); return "label:" + sel; } catch {}
      try { await ph.fill(val); return "ph:" + sel; } catch {}
      return "MISS:" + sel;
    };
    const how = [];
    how.push(await fill("Full Name", "J"));
    how.push(await fill("Street Address", "12"));
    how.push(await fill("City", "New York"));
    how.push(await fill("State", "NY"));
    how.push(await fill("ZIP Code", "abcde"));
    how.push(await fill("Country", "United States"));
    how.push(await fill("Label", "Home"));
    console.log("FILL METHOD:", JSON.stringify(how));
    await page.waitForTimeout(400);
    await page.screenshot({ path: OUT + "/addresses-form-invalid.png" });

    // watch for field-level errors BEFORE submit (client-side gating?)
    const preErrors = await page.evaluate(() =>
      [...document.querySelectorAll("main p, main span, main div")]
        .map((e) => e.textContent?.trim() ?? "")
        .filter((t) => /required|invalid|valid|must be|enter a/i.test(t) && t.length < 80)
    );
    console.log("PRE-SUBMIT ERROR TEXT:", JSON.stringify([...new Set(preErrors)].slice(0, 6)));

    // submit the invalid form
    const postsBefore = posts.length;
    const saveBtn = page.getByRole("button", { name: /save/i }).first();
    if (await saveBtn.count()) {
      await saveBtn.click();
      await page.waitForTimeout(2500);
      const postsAfter = posts.slice(postsBefore);
      console.log("POSTS ON INVALID SAVE:", JSON.stringify(postsAfter));
      await page.screenshot({ path: OUT + "/addresses-after-invalid-save.png" });
      const afterInvalid = await page.evaluate(() => {
        const out = { errors: [], text: null };
        [...document.querySelectorAll("main p, main span")].forEach((e) => {
          const t = e.textContent?.trim() ?? "";
          if (/required|invalid|valid|must be|enter a/i.test(t) && t.length < 100) out.errors.push(t);
        });
        out.text = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 600) ?? "";
        return out;
      });
      console.log("POST-SAVE ERROR TEXT:", JSON.stringify([...new Set(afterInvalid.errors)].slice(0, 6)));
      console.log("POST-SAVE TEXT (head):", JSON.stringify(afterInvalid.text.slice(0, 300)));
      // form still open?
      const stillOpen = await page.locator("main input[id=addr-street], main input[name=street]").count().catch(() => 0);
      const anyInput = await page.locator("main form input").count().catch(() => 0);
      console.log("FORM STILL OPEN (any form input):", anyInput);

      // if still open: fill VALID and save — does a card appear?
      if (anyInput > 0) {
        const vfill = async (sel, val) => {
          try { await page.getByLabel(sel, { exact: false }).first().fill(val); return "ok"; } catch {}
          try { await page.getByPlaceholder(sel).first().fill(val); return "ok-ph"; } catch {}
          return "MISS";
        };
        await vfill("Full Name", "Ada Lovelace");
        await vfill("Street Address", "742 Evergreen Terrace");
        await vfill("ZIP Code", "62704");
        await page.waitForTimeout(300);
        const pb2 = posts.length;
        await page.getByRole("button", { name: /save/i }).first().click();
        await page.waitForTimeout(2500);
        console.log("POSTS ON VALID SAVE:", JSON.stringify(posts.slice(pb2)));
        await page.screenshot({ path: OUT + "/addresses-after-valid-save.png" });
        const cardsText = await page.evaluate(() =>
          document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 600) ?? ""
        );
        console.log("AFTER VALID SAVE TEXT:", JSON.stringify(cardsText.slice(0, 400)));
        console.log("NEW CARD (Evergreen):", cardsText.includes("Evergreen"));
        const formGone = await page.locator("main form input").count().catch(() => 0);
        console.log("FORM COLLAPSED AFTER SAVE:", formGone === 0);
      }
    } else {
      console.log("NO SAVE BUTTON FOUND");
    }
  } else {
    console.log("NO ADD NEW BUTTON");
  }

  // Edit affordance on a card?
  const editBtn = page.getByRole("button", { name: "Edit" }).first();
  console.log("EDIT BUTTON ON CARDS:", (await editBtn.count()) > 0);
} else {
  console.log("NO ADDRESSES TAB");
}

// ---- PROFILE tab ---------------------------------------------------------
posts.length = 0;
const profTab = page.getByRole("tab", { name: /profile/i }).first();
if (await profTab.count()) {
  await profTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + "/profile-resting.png" });
  const profInputs = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll("main input").forEach((i) => {
      out[i.name || i.id] = (i.value ?? "").slice(0, 30);
    });
    return out;
  });
  console.log("PROFILE INPUTS:", JSON.stringify(profInputs));
  // break the first name (empty may be natively blocked; try 1 char) and save
  const fn = page.getByLabel(/first name/i).first();
  if (await fn.count()) {
    await fn.fill("J");
    const pb = posts.length;
    const sv = page.getByRole("button", { name: /save/i }).first();
    if (await sv.count()) {
      await sv.click();
      await page.waitForTimeout(2000);
      console.log("POSTS ON PROFILE SAVE:", JSON.stringify(posts.slice(pb)));
      await page.screenshot({ path: OUT + "/profile-after-save.png" });
      const ptxt = await page.evaluate(() =>
        document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 400) ?? ""
      );
      console.log("PROFILE AFTER SAVE (head):", JSON.stringify(ptxt.slice(0, 250)));
      console.log("PROFILE ERROR TEXT VISIBLE:", /required|invalid|must be/i.test(ptxt));
    }
  }
}

// ---- SETTINGS tab (password form) ----------------------------------------
posts.length = 0;
const setTab = page.getByRole("tab", { name: /settings/i }).first();
if (await setTab.count()) {
  await setTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + "/settings-resting.png" });
  const setText = await page.evaluate(() =>
    document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 500) ?? ""
  );
  console.log("SETTINGS TEXT:", JSON.stringify(setText.slice(0, 350)));
  const pwInputs = await page.evaluate(() =>
    [...document.querySelectorAll("main input[type=password]")].map((i) => i.name || i.id)
  );
  console.log("PASSWORD INPUTS:", JSON.stringify(pwInputs));
  if (pwInputs.length >= 2) {
    // short new password — does the reference validate?
    const cur = page.locator("main input[type=password]").first();
    const nw = page.locator("main input[type=password]").nth(1);
    await cur.fill("$Abcd1234");
    await nw.fill("short");
    const pb = posts.length;
    const upd = page.getByRole("button", { name: /update password/i }).first();
    if (await upd.count()) {
      await upd.click();
      await page.waitForTimeout(2000);
      console.log("POSTS ON PASSWORD UPDATE:", JSON.stringify(posts.slice(pb)));
      await page.screenshot({ path: OUT + "/settings-after-update.png" });
      const stxt = await page.evaluate(() =>
        document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 400) ?? ""
      );
      console.log("SETTINGS AFTER UPDATE (head):", JSON.stringify(stxt.slice(0, 250)));
      console.log("PASSWORD ERROR TEXT VISIBLE:", /required|invalid|must be|least 8/i.test(stxt));
    }
  }
}

console.log("ALL MUTATING POSTS (whole session):", JSON.stringify(posts));
await browser.close();

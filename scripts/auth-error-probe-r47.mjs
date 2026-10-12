// Round-47 calibration probes: the reference's AUTH-FAMILY ERROR STATES,
// measured live (the pin family's parity ground truth). Five probes, each
// in a FRESH browser context (no state bleed):
//
//   A  /register   A1 native-email block · A2 short-password box ·
//                  A3 short+mismatch priority · A4 129-char boundary ·
//                  A5 the pending label during a held submit
//   B  /login      B1 native-email block · B2 the pending label (wrong
//                  credentials payload — after release, the login error copy)
//   C  /forgot-password  C1 the pending label (after release, the copy)
//   D  /reset-password?token=bogus  D1 mismatched passwords — the
//                  client-first contract (box copy + whether a POST fired)
//   E  /login      E1 the rate-limit probe — 11 wrong submits on a
//                  dedicated nonexistent email (LAST: could lock the IP)
//
// The box locator: the family's tinted box is the card's first child
// (measured session-4); we read the CARD's innerText + destructive-class
// element count so the report shows the reference's copy verbatim.
// Run: node scripts/auth-error-probe-r47.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const SETTLE = 900;

const browser = await chromium.launch();
const report = (k, v) => console.log(`  ${k.padEnd(34)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const cardState = async (page) => {
  return page.evaluate(() => {
    const card = document.querySelector(".bg-card") ?? document.querySelector("form")?.closest("div");
    const destructive = [...document.querySelectorAll("div,p")].filter(
      (el) => /destructive/.test(el.className) && el.className.includes("rounded"),
    );
    const form = document.querySelector("form");
    return {
      cardText: card ? card.innerText.replace(/\n+/g, " | ").slice(0, 260) : "(no card)",
      destructiveBoxes: destructive.length,
      boxText: destructive[0]?.textContent?.trim() ?? null,
      formPresent: !!form,
      submitText: form
        ? (form.querySelector("button[type=submit]")?.textContent ?? "").trim()
        : null,
      submitDisabled: form
        ? form.querySelector("button[type=submit]")?.hasAttribute("disabled")
        : null,
    };
  });
};

const probe = async (name, fn) => {
  line(name);
  try {
    await fn();
  } catch (e) {
    console.log(`  PROBE ERROR: ${e.message?.slice(0, 300)}`);
  }
};

// non-GET request counter + holder for the pending probes
const netProbe = (page) => {
  const state = { posts: 0, held: [] };
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().startsWith(REF)) state.posts++;
  });
  return state;
};
const installHold = (ctx, state) =>
  ctx.route(`${REF}/**`, (route) => {
    const req = route.request();
    if (req.method() !== "GET") {
      state.held.push(route);
      return undefined; // held until released
    }
    return route.continue();
  });
const release = async (state) => {
  for (const r of state.held) await r.continue().catch(() => {});
  state.held = [];
};

// ---------------------------------------------------------------------------
await probe("A. /register — the reference's error states", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const net = netProbe(page);
  await page.goto(`${REF}/register`, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE);
  report("screen", (await page.title()).slice(0, 60));

  // A1 — native-email block
  net.posts = 0;
  await page.getByLabel("Email").fill("notanemail");
  await page.getByLabel("Password", { exact: true }).fill("ValidPass123!");
  await page.getByLabel("Confirm Password").fill("ValidPass123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(SETTLE);
  const a1valid = await page.getByLabel("Email").evaluate((el) => el.checkValidity());
  report("A1 notanemail checkValidity", a1valid);
  report("A1 non-GET after click", net.posts);
  report("A1 card", (await cardState(page)).cardText);

  // A2 — short password + MATCHING confirm
  net.posts = 0;
  await page.getByLabel("Email").fill("probe-r47@example.com");
  await page.getByLabel("Password", { exact: true }).fill("abc");
  await page.getByLabel("Confirm Password").fill("abc");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(SETTLE);
  report("A2 short+match box", JSON.stringify((await cardState(page)).boxText));
  report("A2 non-GET", net.posts);

  // A3 — short password + MISMATCHED confirm (the priority question)
  net.posts = 0;
  await page.getByLabel("Password", { exact: true }).fill("abc");
  await page.getByLabel("Confirm Password").fill("xyz");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(SETTLE);
  report("A3 short+mismatch box", JSON.stringify((await cardState(page)).boxText));

  // A4 — the 129-char boundary
  net.posts = 0;
  const long = "x".repeat(129);
  await page.getByLabel("Password", { exact: true }).fill(long);
  await page.getByLabel("Confirm Password").fill(long);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(SETTLE);
  report("A4 129-char box", JSON.stringify((await cardState(page)).boxText));

  // A5 — the pending label (held submit; short password payload — no
  // account gets created when the hold releases)
  await installHold(ctx, net);
  await page.getByLabel("Email").fill("probe-r47@example.com");
  await page.getByLabel("Password", { exact: true }).fill("abc");
  await page.getByLabel("Confirm Password").fill("abc");
  net.posts = 0;
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(700);
  const during = await cardState(page);
  report("A5 during-flight submit text", JSON.stringify(during.submitText));
  report("A5 during-flight disabled", during.submitDisabled);
  await release(net);
  await page.waitForTimeout(SETTLE);
  report("A5 after-release box", JSON.stringify((await cardState(page)).boxText));
  await ctx.close();
});

// ---------------------------------------------------------------------------
await probe("B. /login — native block + the pending label", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const net = netProbe(page);
  await page.goto(`${REF}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE);

  // B1 — native-email block
  net.posts = 0;
  await page.getByLabel("Email").fill("notanemail");
  await page.getByLabel("Password", { exact: true }).fill("whatever123");
  await page.getByRole("button", { name: /^log in$/i }).click();
  await page.waitForTimeout(SETTLE);
  const b1valid = await page.getByLabel("Email").evaluate((el) => el.checkValidity());
  report("B1 notanemail checkValidity", b1valid);
  report("B1 non-GET after click", net.posts);
  report("B1 card", (await cardState(page)).cardText);

  // B2 — the pending label (wrong-credentials payload)
  await installHold(ctx, net);
  await page.getByLabel("Email").fill("probe-r47@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  net.posts = 0;
  await page.getByRole("button", { name: /^log in$/i }).click();
  await page.waitForTimeout(700);
  const during = await cardState(page);
  report("B2 during-flight submit text", JSON.stringify(during.submitText));
  report("B2 during-flight disabled", during.submitDisabled);
  await release(net);
  await page.waitForTimeout(SETTLE);
  report("B2 after-release box", JSON.stringify((await cardState(page)).boxText));
  await ctx.close();
});

// ---------------------------------------------------------------------------
await probe("C. /forgot-password — the pending label", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const net = netProbe(page);
  await page.goto(`${REF}/forgot-password`, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE);

  await installHold(ctx, net);
  await page.getByLabel(/email address/i).fill("probe-r47@example.com");
  net.posts = 0;
  await page.getByRole("button", { name: /send reset link/i }).click();
  await page.waitForTimeout(700);
  const during = await cardState(page);
  report("C1 during-flight submit text", JSON.stringify(during.submitText));
  report("C1 during-flight disabled", during.submitDisabled);
  await release(net);
  await page.waitForTimeout(SETTLE);
  report("C1 after-release card", (await cardState(page)).cardText);
  await ctx.close();
});

// ---------------------------------------------------------------------------
await probe("D. /reset-password — mismatched passwords, the client-first contract", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const net = netProbe(page);
  await page.goto(`${REF}/reset-password?token=bogus-r47-probe`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(SETTLE);
  report("screen heading", await page
    .locator("h1")
    .first()
    .textContent()
    .catch(() => "(none)"));

  net.posts = 0;
  const pw = page.getByLabel(/new password/i).first();
  const cf = page.getByLabel(/confirm password/i).first();
  if ((await pw.count()) && (await cf.count())) {
    await pw.fill("ValidPass123!");
    await cf.fill("different!");
    await page.getByRole("button", { name: /reset password/i }).click();
    await page.waitForTimeout(SETTLE);
    report("D1 box", JSON.stringify((await cardState(page)).boxText));
    report("D1 non-GET after click", net.posts);
  } else {
    report("D1", "form not found — the reference renders a different state");
  }
  await ctx.close();
});

// ---------------------------------------------------------------------------
await probe("E. /login — the rate-limit probe (11 wrong submits, LAST)", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${REF}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE);
  for (let i = 1; i <= 11; i++) {
    await page.getByLabel("Email").fill("probe-rl-r47@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: /^log in$/i }).click();
    await page.waitForTimeout(SETTLE);
    const box = (await cardState(page)).boxText;
    report(`E1 submit #${String(i).padStart(2, "0")} box`, JSON.stringify(box));
    if (box && /too many|rate|limit|later/i.test(box)) {
      report("E1 VERDICT", `rate-limit copy appeared at attempt ${i}`);
      break;
    }
    if (i === 11) report("E1 VERDICT", "no rate-limit copy after 11 attempts");
  }
  await ctx.close();
});

await browser.close();
console.log("\nPROBES COMPLETE");

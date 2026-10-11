// Round-43 audit probe: the reference site's footer newsletter block —
// the resting anatomy (input attrs, button label/size, privacy line copy)
// measured live for parity-true pins.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

// login (operator account)
const page = await ctx.newPage();
await page.goto(REF + "/login", { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await page.getByLabel("Password").fill("$Abcd1234");
await page.getByRole("button", { name: "Log in", exact: true }).click();
try {
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
} catch { /* fall through */ }
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);

// walk home (footer present)
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const probe = await page.evaluate(() => {
  // broad footer probe: any heading like "Stay Updated" or "Newsletter"
  const out = { stayUpdated: null, footerInputs: [], joinButtons: [] };
  const h3s = [...document.querySelectorAll("footer h3, h2, h3")];
  const stay = h3s.find((h) => /stay updated|newsletter|subscribe/i.test(h.textContent || ""));
  if (stay) {
    const col = stay.closest("div");
    out.stayUpdated = {
      heading: stay.textContent.trim(),
      columnText: col ? col.textContent.replace(/\s+/g, " ").trim().slice(0, 300) : null,
      inputs: col
        ? [...col.querySelectorAll("input")].map((el) => ({
            type: el.getAttribute("type"),
            ariaLabel: el.getAttribute("aria-label"),
            placeholder: el.getAttribute("placeholder"),
            required: el.required,
          }))
        : [],
      buttons: col
        ? [...col.querySelectorAll("button")].map((b) => ({
            text: b.textContent.trim(),
            h: b.getBoundingClientRect().height,
          }))
        : [],
      paras: col ? [...col.querySelectorAll("p")].map((p) => p.textContent.trim()) : [],
    };
  }
  out.footerInputs = [...document.querySelectorAll("footer input")].map((el) => ({
    type: el.getAttribute("type"),
    placeholder: el.getAttribute("placeholder"),
    ariaLabel: el.getAttribute("aria-label"),
  }));
  out.joinButtons = [...document.querySelectorAll("footer button")].map((b) => b.textContent.trim()).filter((t) => /join|subscri/i.test(t));
  return out;
});

console.log(JSON.stringify(probe, null, 2));

// also probe the subscribe CLICK behavior on the reference (cosmetic?)
if (probe.footerInputs.length > 0) {
  const input = page.locator("footer input").first();
  await input.fill("probe-parity@example.com");
  const join = page.getByRole("button", { name: "Join", exact: true });
  const responses = [];
  page.on("response", (r) => {
    if (r.url().includes("newsletter") || r.url().includes("subscribe")) {
      responses.push(r.url() + " -> " + r.status());
    }
  });
  await join.click();
  await page.waitForTimeout(2500);
  const statusText = await page
    .evaluate(() => {
      const el = [...document.querySelectorAll('p[role="status"], [aria-label*="ewsletter"]')];
      return el.map((e) => e.textContent?.trim());
    });
  // toast check: the reference's dark bottom-right box (fixed positioned)
  const toastText = await page
    .evaluate(() => {
      const fixed = [...document.querySelectorAll('div[class*="fixed"]')];
      return fixed
        .filter((d) => (d.className || "").includes("bottom"))
        .map((d) => d.textContent?.trim())
        .filter(Boolean);
    });
  console.log("CLICK NETWORK:", responses.length ? responses : "(no newsletter network calls)");
  console.log("CLICK STATUS LINE:", JSON.stringify(statusText));
  console.log("CLICK TOASTS:", JSON.stringify(toastText));
}

await browser.close();

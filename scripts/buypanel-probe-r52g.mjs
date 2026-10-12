// Round-52 calibration probe G (REFERENCE, logged-out): the auth buttons'
// class strings — the default-size vintage question (py-2 present or not),
// the outline variant's vintage, and the submit's full anatomy. The login
// page redirects when logged in, so this runs in a FRESH logged-out context.
// Run: node scripts/buypanel-probe-r52g.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);

const page = await ctx.newPage();
await page.goto(REF + "/login", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const buttons = await page.evaluate(() => {
  const read = (b) => {
    const cs = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    return {
      text: (b.textContent || "").trim().slice(0, 26),
      cls: b.className,
      h: Math.round(r.height), w: Math.round(r.width),
      padding: cs.padding, radius: cs.borderRadius,
      font: cs.fontSize + "/" + cs.fontWeight,
    };
  };
  const google = [...document.querySelectorAll("button")].find((b) => /google/i.test(b.textContent || ""));
  const submit = [...document.querySelectorAll("button")].find((b) => /^log in$/i.test((b.textContent || "").trim()));
  return { google: google ? read(google) : null, submit: submit ? read(submit) : null };
});
if (buttons.google) {
  report("google.cls", buttons.google.cls);
  report("google.h/padding/radius", buttons.google.h + " / " + buttons.google.padding + " / " + buttons.google.radius);
}
if (buttons.submit) {
  report("submit.cls", buttons.submit.cls);
  report("submit.h/padding/radius", buttons.submit.h + " / " + buttons.submit.padding + " / " + buttons.submit.radius);
  report("submit.font", buttons.submit.font);
} else {
  report("submit", "NOT FOUND — listing all buttons:");
  const all = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => (b.textContent || "").trim().slice(0, 20)));
  for (const t of all) report("  btn", t);
}

await browser.close();
console.log("\nPROBE r52g COMPLETE");

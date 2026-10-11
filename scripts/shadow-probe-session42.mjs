// Round-42: probe for shadow-DOM hosts (nextjs-portal etc.) — the dark box
// is not in the light DOM.
import { chromium } from "playwright-core";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const found = await page.evaluate(() => {
  const all = [...document.querySelectorAll("*")];
  const custom = all.filter((el) => el.tagName.includes("-") || el.shadowRoot);
  return custom.map((el) => {
    const r = el.getBoundingClientRect();
    // try to reach INTO the shadow root
    let inner = "";
    if (el.shadowRoot) {
      const btns = [...el.shadowRoot.querySelectorAll("button, [role=button], div, span")]
        .filter((n) => n.getBoundingClientRect().width > 0)
        .slice(0, 6);
      inner = btns.map((n) => {
        const b = n.getBoundingClientRect();
        return `${n.tagName}:${n.textContent?.trim().slice(0, 30)}@${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}`;
      }).join(" | ");
    }
    return { tag: el.tagName.toLowerCase(), box: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`, hasShadow: !!el.shadowRoot, inner };
  });
});
console.log(JSON.stringify(found, null, 1));
await browser.close();

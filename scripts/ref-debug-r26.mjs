import { chromium } from "playwright-core";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto("https://fuzzy-lumina-style-hub.base44.app/login", { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await page.getByLabel("Password").fill("$Abcd1234");
await page.getByRole("button", { name: "Log in", exact: true }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(2000);
await page.goto("https://fuzzy-lumina-style-hub.base44.app/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/ref-home-1024.png" });
const info = await page.evaluate(() => {
  const navs = [...document.querySelectorAll('[role="navigation"], nav')].map(n => {
    const r = n.getBoundingClientRect();
    return { role: n.getAttribute("role") ?? n.tagName, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), text: n.textContent.slice(0, 60) };
  });
  const divs = [...document.querySelectorAll("div")].filter(d => {
    const t = d.textContent;
    return t && t.includes("Electronics") && t.includes("Accessories") && !t.includes("Spring") && d.querySelectorAll("a").length >= 5 && d.children.length <= 8;
  }).slice(0, 3).map(d => {
    const r = d.getBoundingClientRect();
    return { cls: d.className?.slice?.(0, 80), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), links: [...d.querySelectorAll("a")].map(a => [a.textContent.trim(), Math.round(a.getBoundingClientRect().x)]) };
  });
  return { navs, divs };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();

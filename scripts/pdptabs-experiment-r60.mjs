// Round-60 mechanism experiment: does stopPropagation at CAPTURE phase (on a
// root-container listener, React-delegation-style) skip the bubble-phase
// handlers (Radix's mousedown script-focus) while PRESERVING the native
// default action (the browser focusing the button) — and does the native
// path avoid :focus-visible (no ring)?
import { chromium } from "playwright-core";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

await page.setContent(`
  <style>.ring:focus-visible { outline: 4px solid orange; }</style>
  <div id="root">
    <div id="group">
      <button id="btn" class="ring">Target Button</button>
    </div>
  </div>
  <div id="log" style="white-space:pre"></div>
`);

await page.evaluate(() => {
  const log = [];
  window.__log = log;
  const btn = document.getElementById("btn");
  // React-style: capture listener at the ROOT CONTAINER
  document.getElementById("root").addEventListener("mousedown", (e) => {
    log.push("ROOT-CAPTURE");
    if (e.button === 0 && !e.ctrlKey) e.stopPropagation(); // the FIX's mechanism
  }, true);
  // the group-level bubble handler (Radix's roving-group mousedown)
  document.getElementById("group").addEventListener("mousedown", () => log.push("GROUP-BUBBLE"));
  // the target-level bubble handler (Radix's trigger mousedown: script focus)
  btn.addEventListener("mousedown", () => {
    log.push("TARGET-BUBBLE(script-focus)");
    btn.focus(); // the Radix 1.1.12 behavior
  });
});

const r = await page.locator("#btn").boundingBox();
await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
await page.mouse.down();
await page.waitForTimeout(150);
const atDown = await page.evaluate(() => ({
  activeIsBtn: document.activeElement === document.getElementById("btn"),
  matchesFV: document.activeElement.matches(":focus-visible"),
  log: window.__log,
}));
await page.mouse.up();
await page.waitForTimeout(100);
console.log("EXPERIMENT RESULT:", JSON.stringify(atDown, null, 1));

// control: WITHOUT the capture stop — the script focus matches :focus-visible?
await page.evaluate(() => {
  window.__log = [];
  document.getElementById("root").addEventListener("mousedown", function e(e) {
    // remove the stop: re-add a pass-through capture
  }, true);
});
await page.evaluate(() => {
  // simply log: dispatch a fresh sequence on a second button without the capture-stop
  const d = document.createElement("div");
  d.innerHTML = '<div id="root2"><button id="btn2" class="ring">Control</button></div>';
  document.body.appendChild(d);
  const btn2 = document.getElementById("btn2");
  document.getElementById("root2").addEventListener("mousedown", () => window.__log.push("ROOT2-CAPTURE(not-stopped)"), true);
  btn2.addEventListener("mousedown", () => { window.__log.push("BTN2-SCRIPT-FOCUS"); btn2.focus(); });
});
const r2 = await page.locator("#btn2").boundingBox();
await page.mouse.move(r2.x + r2.width / 2, r2.y + r2.height / 2);
await page.mouse.down();
await page.waitForTimeout(150);
const control = await page.evaluate(() => ({
  activeIsBtn2: document.activeElement === document.getElementById("btn2"),
  matchesFV: document.activeElement.matches(":focus-visible"),
  log: window.__log,
}));
await page.mouse.up();
console.log("CONTROL (script focus, no stop):", JSON.stringify(control, null, 1));

await browser.close();
console.log("EXPERIMENT COMPLETE");

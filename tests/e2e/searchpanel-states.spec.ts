import { expect, test } from "@playwright/test";

// Search panel geometry/affordance states (session-58, SEARCH-PANEL-GEO-1)
// — the pin-density sweep's sixteenth installment. Session-46 pinned the
// family's BEHAVIOR (srch-behavior.spec.ts: the typeahead state machine,
// the close/reopen query preservation, the toggle-close, the submit
// paths, the API limits); the computed-geometry + affordance axes had
// ZERO pins. Every pin here is calibrated against the LIVE reference
// (the probes scripts/search-panel-probe-r58[a0/a/a2/a3/a4/a5].mjs on
// the reference + search-panel-clone-r58b.mjs on the clone — the DOM
// dumps, the computed styles, the rect arithmetic, and the enter/exit
// frame series as the ground truth):
//
//   - THE ROUND'S HEADLINE: the resting shell is parity (the strip, the
//     container, the form row, the input — every computed value
//     identical) but the family carries FOUR honest REDs, the fullest
//     remediation form since r49:
//     RED-1 (P1/P2/P12): the SEARCH BUTTON's SIZE — the reference ships
//     the shadcn sm form (h-8 px-3 text-xs — 64x32, 12px/500); the
//     clone's default-size 79x36 was a session-1 port liberty.
//     RED-2 (P3..P7 + P12): the X CLOSE BUTTON — the reference's form
//     carries THREE children (input flex-1 + Search sm + a 36x36 ghost
//     lucide-x); the X closes the panel with the query SURVIVING (the
//     876+8+64+8+36=992 form arithmetic only closes with all three).
//     RED-3 (P8): the ENTER ANIMATION — the reference is a pure ~300ms
//     opacity fade (framer-motion inline; transform NONE throughout);
//     the clone's slide-in-from-top-2 translateY(-8px) was never
//     reference-measured.
//     RED-4 (P10/P11): the EXIT ANIMATION — the reference fades +
//     collapses the height over ~300ms (61 -> 0) then unmounts; the
//     clone snapped the 61px strip away instantly.
//   - THE PARITY CONTROLS (green before AND after — the artifact guards):
//     P13 the input's geometry; P14 the superset popover's unclipped
//     render (the session-46 contract holds through the changes).
//   - THE REGISTERS (documented divergences, untouched): the input's
//     aria-label (the reference carries none); the X's aria-label (the
//     same a11y superset); the Escape-close (r46a2's finding — the
//     reference's panel ignores Escape; the clone's handler is the
//     pinned superset); the container's relative (the popover anchor).
//
// FILE-ORDER CONTRACT (the srch-behavior lesson): this spec's ~5
// typeahead requests draw from the /api/search rate-limit budget BEFORE
// srch-behavior's 429 burst (ASCII: "search." < "searchpanel-" < "smoke."
// < "srch-"); search.spec's own typeahead tests run BEFORE this file.
// The budget arithmetic holds (~5 + ~5 + srch's own, well under 60).
//
// The exit pins (P10/P11) close via the HEADER TOGGLE (present on both
// the pre-fix and post-fix artifacts); the X-close pins (P6/P7) exercise
// the new affordance itself.

type Page = import("@playwright/test").Page;

declare global {
  interface Window {
    __searchPanelFrames?: {
      t: number;
      op: string;
      tf: string;
      h: number | null;
      inputInDom: boolean;
    }[];
  }
}

const openPanel = async (page: Page) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator('header button[aria-label="Search"]').click();
  const input = page.getByLabel("Search products");
  await expect(input).toBeVisible();
  await page.waitForTimeout(450); // outlive the enter animation
  return input;
};

test.describe("search panel states (session-58, SEARCH-PANEL-GEO-1)", () => {
  test("P1: the Search button computes the reference's sm size (64x32, 12px/500, radius 10px, primary)", async ({ page }) => {
    await openPanel(page);
    const geo = await page.evaluate(() => {
      const form = document.querySelector("header form");
      const btn = form ? [...form.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Search") : null;
      if (!btn) return null;
      const cs = getComputedStyle(btn);
      const r = btn.getBoundingClientRect();
      return {
        w: Math.round(r.width), h: Math.round(r.height),
        pad: cs.padding, font: cs.fontSize + "/" + cs.fontWeight,
        radius: cs.borderRadius, bg: cs.backgroundColor, color: cs.color,
      };
    });
    expect(geo).toBeTruthy();
    expect(geo!.h).toBe(32);
    expect(geo!.w).toBe(64);
    expect(geo!.pad).toBe("0px 12px");
    expect(geo!.font).toBe("12px/500");
    expect(geo!.radius).toBe("10px");
    expect(geo!.bg).toBe("rgb(230, 107, 26)");
    expect(geo!.color).toBe("rgb(255, 255, 255)");
  });

  test("P2: the Search button's class string carries the sm tokens (h-8 px-3 text-xs + bg-primary)", async ({ page }) => {
    await openPanel(page);
    const cls = await page.evaluate(() => {
      const form = document.querySelector("header form");
      const btn = form ? [...form.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Search") : null;
      return btn ? btn.className : null;
    });
    expect(cls).toBeTruthy();
    expect(cls).toContain("h-8");
    expect(cls).toContain("px-3");
    expect(cls).toContain("text-xs");
    expect(cls).toContain("bg-primary");
  });

  test("P3: the X close button exists — the form's third child (ghost icon, lucide-x h-4 w-4)", async ({ page }) => {
    await openPanel(page);
    const x = await page.evaluate(() => {
      const form = document.querySelector("header form");
      const btns = form ? [...form.querySelectorAll("button")] : [];
      const ghost = btns[btns.length - 1];
      if (!ghost || ghost.textContent?.trim() === "Search") return null;
      const svg = ghost.querySelector("svg");
      return {
        childCount: form ? form.children.length : 0,
        cls: ghost.className,
        svgCls: svg ? svg.getAttribute("class") : null,
        aria: ghost.getAttribute("aria-label"),
      };
    });
    expect(x).toBeTruthy();
    // The form's THREE children (the reference's measured arithmetic:
    // Input + Search + X — the r58a2 enumeration).
    expect(x!.childCount).toBe(3);
    expect(x!.cls).toContain("h-9");
    expect(x!.cls).toContain("w-9");
    expect(x!.cls).toContain("hover:bg-accent");
    expect(x!.svgCls).toContain("lucide-x");
    expect(x!.svgCls).toContain("h-4");
    expect(x!.svgCls).toContain("w-4");
  });

  test("P4: the X's computed geometry (36x36, transparent bg, radius 10px, foreground color)", async ({ page }) => {
    await openPanel(page);
    const geo = await page.evaluate(() => {
      const form = document.querySelector("header form");
      const btns = form ? [...form.querySelectorAll("button")] : [];
      const ghost = btns[btns.length - 1];
      if (!ghost || ghost.textContent?.trim() === "Search") return null;
      const cs = getComputedStyle(ghost);
      const r = ghost.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderRadius, color: cs.color };
    });
    expect(geo).toBeTruthy();
    expect(geo!.w).toBe(36);
    expect(geo!.h).toBe(36);
    expect(geo!.bg).toBe("rgba(0, 0, 0, 0)");
    expect(geo!.radius).toBe("10px");
    expect(geo!.color).toBe("rgb(23, 23, 28)");
  });

  test("P5: the X's hover carries the accent pair (bg rgb(253,243,237), color rgb(138,64,15))", async ({ page }) => {
    await openPanel(page);
    const x = page.locator('header form button[aria-label="Close search"]');
    await x.hover();
    await page.waitForTimeout(400);
    const hover = await page.evaluate(() => {
      const x = document.querySelector('header form button[aria-label="Close search"]');
      if (!x) return null;
      const cs = getComputedStyle(x);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(hover).toBeTruthy();
    expect(hover!.bg).toBe("rgb(253, 243, 237)");
    expect(hover!.color).toBe("rgb(138, 64, 15)");
  });

  test("P6: clicking the X closes the panel (the input leaves the DOM inside the exit window)", async ({ page }) => {
    await openPanel(page);
    const x = page.locator('header form button[aria-label="Close search"]');
    await x.click();
    // The exit animation runs ~300ms; the input must be GONE by +500ms.
    await expect(page.getByLabel("Search products")).toHaveCount(0, { timeout: 5000 });
    // And it must still be gone (no re-render resurrection).
    await page.waitForTimeout(300);
    await expect(page.getByLabel("Search products")).toHaveCount(0);
  });

  test("P7: the X-close PRESERVES the typed query across close/reopen (the reference's measured contract)", async ({ page }) => {
    const input = await openPanel(page);
    await input.fill("serum");
    await page.waitForResponse((r) => r.url().includes("/api/search"));
    await page.waitForTimeout(400);
    const x = page.locator('header form button[aria-label="Close search"]');
    await x.click();
    await expect(page.getByLabel("Search products")).toHaveCount(0, { timeout: 5000 });
    // Reopen: the query survives (session-46's contract, now via the X path).
    await page.locator('header button[aria-label="Search"]').click();
    const reopened = page.getByLabel("Search products");
    await expect(reopened).toBeVisible();
    await expect(reopened).toHaveValue("serum");
  });

  test("P8: the enter animation is a pure FADE — opacity < 1 mid-enter and transform NONE throughout (no slide)", async ({ page }) => {
    // Install the frame sampler BEFORE the open click (the r56 discipline:
    // hard-bound the loop — 12 frames x 50ms max).
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      window.__searchPanelFrames = [];
    });
    await page.locator('header button[aria-label="Search"]').click();
    const frames = await page.evaluate(async () => {
      const out: { t: number; op: string; tf: string; h: number | null; inputInDom: boolean }[] = [];
      const t0 = performance.now();
      for (let i = 0; i < 10; i++) {
        const header = document.querySelector("header");
        const strip = header?.querySelector("div[class*='border-t']") ?? null;
        const input = header?.querySelector("input") ?? null;
        if (strip) {
          const cs = getComputedStyle(strip);
          out.push({
            t: Math.round(performance.now() - t0),
            op: cs.opacity,
            tf: cs.transform,
            h: Math.round(strip.getBoundingClientRect().height),
            inputInDom: !!input,
          });
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      window.__searchPanelFrames = out;
      return out;
    });
    expect(frames.length).toBeGreaterThan(0);
    // Mid-enter (~100-200ms): the opacity must be BELOW 1 (the fade).
    const mid = frames.filter((f) => f.t >= 100 && f.t <= 250);
    expect(mid.length).toBeGreaterThan(0);
    const midMaxOp = Math.max(...mid.map((f) => Number(f.op)));
    expect(midMaxOp).toBeLessThan(1);
    // The transform must read NO MOVEMENT on EVERY frame: "none" (the
    // reference's framer-motion frames — the property untouched) or the
    // IDENTITY matrix (the clone's CSS keyframes animate transform to
    // translate3d(0,0,0) — the computed value reads matrix(1,0,0,1,0,0)
    // mid-animation, zero translation). The pre-fix slide read
    // matrix(1,0,0,1,0,-8) — the nonzero translation is the divergence.
    for (const f of frames) {
      const ok =
        f.tf === "none" ||
        /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(f.tf) ||
        /^matrix\(1, 0, 0, 1, 0, -?0(\.0+)?\)$/.test(f.tf);
      expect(ok, `frame t=${f.t} tf=${f.tf}`).toBe(true);
    }
  });

  test("P9: the enter completes — opacity 1 and the CSS animation reads enter@0.3s", async ({ page }) => {
    await openPanel(page);
    const settled = await page.evaluate(() => {
      const header = document.querySelector("header");
      const strip = header?.querySelector("div[class*='border-t']");
      if (!strip) return null;
      const cs = getComputedStyle(strip);
      return { op: cs.opacity, anim: cs.animationName, dur: cs.animationDuration };
    });
    expect(settled).toBeTruthy();
    expect(settled!.op).toBe("1");
    expect(settled!.anim).toBe("enter");
    expect(settled!.dur).toBe("0.3s");
  });

  test("P10: the exit animation fades AND collapses — opacity < 0.9 and height < 61 at ~+100ms after the toggle close", async ({ page }) => {
    await openPanel(page);
    // Close via the header toggle (present pre/post-fix) and sample the
    // strip mid-exit (the hard-bounded sampler).
    const frames = await page.evaluate(async () => {
      const header = document.querySelector("header");
      const toggle = header?.querySelector('button[aria-label="Search"]');
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      const out: { t: number; op: string; tf: string; h: number | null; inputInDom: boolean }[] = [];
      const t0 = performance.now();
      for (let i = 0; i < 10; i++) {
        const strip = document.querySelector("header div[class*='border-t']");
        const input = document.querySelector("header input");
        if (strip) {
          const cs = getComputedStyle(strip);
          out.push({
            t: Math.round(performance.now() - t0),
            op: cs.opacity,
            tf: cs.transform,
            h: Math.round(strip.getBoundingClientRect().height),
            inputInDom: !!input,
          });
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      return out;
    });
    // Mid-exit (~+50..+250ms): the strip is STILL MOUNTED with a fading
    // opacity and a COLLAPSING height (the reference: 0.86/51 at +61ms,
    // 0.44/27 at +121ms — both curves track each other).
    const mid = frames.filter((f) => f.t >= 50 && f.t <= 250 && f.inputInDom);
    expect(mid.length).toBeGreaterThan(0);
    const midMaxOp = Math.max(...mid.map((f) => Number(f.op)));
    expect(midMaxOp).toBeLessThan(0.9);
    const minH = Math.min(...mid.map((f) => f.h ?? 999));
    expect(minH).toBeLessThan(61);
    // The transform stays NONE (the reference's exit has no movement).
    for (const f of mid) {
      expect(f.tf).toBe("none");
    }
  });

  test("P11: the exit completes — the input leaves the DOM by ~+600ms (the guard pin: green before AND after; catches the never-unmounting mutation)", async ({ page }) => {
    await openPanel(page);
    await page.locator('header button[aria-label="Search"]').click(); // toggle close
    await page.waitForTimeout(600);
    await expect(page.getByLabel("Search products")).toHaveCount(0);
  });

  test("P12: the form's arithmetic closes — input + 8 + 64 + 8 + 36 = the form's width (the three-child closure)", async ({ page }) => {
    await openPanel(page);
    const widths = await page.evaluate(() => {
      const form = document.querySelector("header form");
      if (!form) return null;
      const fr = form.getBoundingClientRect();
      const kids = [...form.children].map((c) => Math.round(c.getBoundingClientRect().width));
      return { formW: Math.round(fr.width), kids };
    });
    expect(widths).toBeTruthy();
    expect(widths!.kids.length).toBe(3);
    const sum = widths!.kids.reduce((a, b) => a + b, 0) + 16; // two 8px gaps
    expect(sum).toBe(widths!.formW);
    expect(widths!.kids[1]).toBe(64); // the Search button (sm)
    expect(widths!.kids[2]).toBe(36); // the X (icon)
  });

  test("P13: the input's geometry is the reference's (h 36, radius 10px, padding 4px 12px, 14px/400, the placeholder) — the parity control", async ({ page }) => {
    await openPanel(page);
    const geo = await page.evaluate(() => {
      const input = document.querySelector("header input");
      if (!input) return null;
      const cs = getComputedStyle(input);
      const r = input.getBoundingClientRect();
      return {
        h: Math.round(r.height), radius: cs.borderRadius, pad: cs.padding,
        font: cs.fontSize + "/" + cs.fontWeight, ph: input.getAttribute("placeholder"),
        border: cs.borderTopWidth + " " + cs.borderTopColor,
      };
    });
    expect(geo).toBeTruthy();
    expect(geo!.h).toBe(36);
    expect(geo!.radius).toBe("10px");
    expect(geo!.pad).toBe("4px 12px");
    expect(geo!.font).toBe("14px/400");
    expect(geo!.ph).toBe("Search products...");
    expect(geo!.border).toBe("1px rgb(233, 230, 226)");
  });

  test("P14: the superset typeahead popover still renders UNCLIPPED below the form (the session-46 contract holds)", async ({ page }) => {
    const input = await openPanel(page);
    await input.fill("serum");
    await page.waitForResponse((r) => r.url().includes("/api/search"));
    const pop = page.locator("header .bg-popover");
    await expect(pop.first()).toBeVisible({ timeout: 10_000 });
    // The popover's full height must be REACHABLE (unclipped): the
    // suggestion row's price column renders INSIDE the popover's box and
    // the popover's height >= 60 (one row renders whole). The width pin
    // is VIEWPORT-RELATIVE (the popover spans the form's width — left-4
    // right-4 inside the container; 992 at the 1024w probe, 1248 at this
    // spec's 1280w Desktop Chrome).
    const geo = await page.evaluate(() => {
      const pop = document.querySelector("header .bg-popover");
      const form = document.querySelector("header form");
      if (!pop || !form) return null;
      const r = pop.getBoundingClientRect();
      const fr = form.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), formW: Math.round(fr.width) };
    });
    expect(geo).toBeTruthy();
    expect(geo!.h).toBeGreaterThanOrEqual(60);
    expect(geo!.w).toBe(geo!.formW);
    // The clip regression guard: the strip's own overflow must NOT be
    // hidden while OPEN (the session-46 fix — the popover needs it).
    const stripOverflow = await page.evaluate(() => {
      const strip = document.querySelector("header div[class*='border-t']");
      return strip ? getComputedStyle(strip).overflow : null;
    });
    expect(stripOverflow).not.toBe("hidden");
  });
});

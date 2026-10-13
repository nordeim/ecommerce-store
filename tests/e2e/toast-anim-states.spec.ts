import { expect, test } from "@playwright/test";
import { clearCartViaDrawer } from "./helpers";

// Toast enter/exit animation states (session-56, TOAST-ANIM-1) — the
// customer-surfaces pin-density sweep's fourteenth installment. The toast's
// RESTING anatomy is pinned (cart.spec:40-79, the session-4 dark-box pins —
// bg/color/radius/icon/position/stacking/lifetime) but the ANIMATION axis
// had ZERO pins. Every pin here is calibrated against the LIVE reference
// (probes toast-probe-r56a/b on the reference + toast-clone-r56c/d2 on the
// clone — the DOM dumps, computed styles, and the full rAF frame series on
// BOTH sides as the ground truth):
//
//   - THE ROUND'S HEADLINE: the resting anatomy is the sweep's FIFTH
//     fully-parity family (the region, the item, the svg, the geometry —
//     every computed value identical). The animation axis carries TWO
//     honest fixes (the measured reference replaces the session-4
//     approximation):
//     FIX #1 (P4): the ENTER FROM-POSE — the reference's framer-motion
//     inline style at insertion reads translateY(20px) scale(0.95),
//     opacity 0 (first frame t=4: ty 19.88, sx 0.95); the clone's
//     @starting-style read translateY(16px) scale(0.96) — 4px shallower
//     and 0.01 higher-scale.
//     FIX #2 (P10/P11): the EXIT FADE CURVE — the measured reference fades
//     ease-OUT (o=0.74 at +50ms, 0.46 at +100ms, 0.31 at +150ms, 0.001 at
//     +266ms — 63% progress at 44% time); the clone's
//     cubic-bezier(0.4, 0, 1, 1) is an ease-IN (o=0.55 at +150ms — 32%
//     progress at 50% time). The fade DIRECTION was inverted; the fix is
//     the easeOutQuad fit cubic-bezier(0.25, 0.46, 0.45, 0.94) on the
//     existing 300ms (deviates from the measured reference by <=0.10 at
//     every wall-clock checkpoint, <=0.08 after +150ms).
//   - THE PARITY ANCHORS (measured both sides): the settle at ~301/302ms;
//     the exit trigger at 3010/3019ms; the exit target
//     translateY(-10px) scale(0.95) + opacity 0; the 320x64 geometry.
//   - THE ARCHITECTURE REGISTER (plan §2.3, the standing session-4
//     register, extended): framer-motion inline JS (transition: 0s all,
//     animation: 0s none computed) vs CSS @starting-style + transitions —
//     the curve micro-shapes differ within the band (the enter's early
//     slope, the opacity arrival, the exit's -11.2 transform overshoot,
//     the split spring rates); the region's pointer-events-none (the
//     reference computes auto — the clone's deliberate click-through
//     divergence, verified session-4); the unmount at 3401 vs 3317ms; the
//     overshoot magnitude -1.94 vs -2.41 (the bezier's 9.7% vs the
//     spring's 12.05% — 0.47px, sub-perceptual).
//
// Probe-honesty lessons baked into the instrumentation (plan §2.2): every
// in-page sampler carries a HARD-BOUND killer (the unbounded-evaluate hang
// — a rAF loop that outlives the toast matches a different fixed
// bottom-right element and never ends); the CSSOM walk matches rules by
// TEXT (modern Chromium gives every CSSStyleRule a truthy empty .cssRules —
// the nesting trap); the from-pose pins read the CSSOM rule (deterministic)
// + the rAF first frame (behavioral), never the resting inline style.

type Page = import("@playwright/test").Page;

// The in-page sampler's state (installed by installEnterSampler, read by
// readEnterFrames / the timing pins). Declared globally for the evaluate
// callbacks' window access (tsc strict — no implicit window properties).
declare global {
  interface Window {
    __toastEnter?: { t0: number | null; frames: { t: number; o: number; m: string }[]; insertPose: { ty: number; sx: number; o: number } | null };
  }
}

// A CSS rule that may carry nested rules (@starting-style, @media — and,
// since CSS Nesting, EVERY CSSStyleRule carries a (usually empty) list —
// the r56d2 nesting lesson; the walk matches rules by TEXT, this cast only
// satisfies the DOM typings).
type MaybeGroupRule = CSSRule & { cssRules?: CSSRuleList };

/** The CSSOM walk: collect every rule mentioning .toast-item, tagged by
 * whether it sits inside a @starting-style group (r56d2's form — match by
 * text, never branch on .cssRules truthiness). */
async function readToastRules(page: Page) {
  return page.evaluate(() => {
    const hits: { startingStyle: boolean; text: string }[] = [];
    const walk = (rules: CSSRuleList, inStarting: boolean) => {
      for (const rule of rules) {
        const text = rule.cssText || "";
        const isStarting = inStarting || text.toLowerCase().startsWith("@starting-style");
        const nested = (rule as MaybeGroupRule).cssRules;
        if (nested) {
          walk(nested, isStarting);
        }
        if (text.includes(".toast-item")) {
          hits.push({ startingStyle: isStarting, text });
        }
      }
    };
    for (const sheet of document.styleSheets) {
      try {
        walk(sheet.cssRules, false);
      } catch {
        // cross-origin sheet — skip
      }
    }
    return hits;
  });
}

/** Install the in-page enter sampler BEFORE the ATC click: a
 * MutationObserver catches the toast item's insertion (records t0), then a
 * rAF loop samples the computed opacity+transform every frame. Hard-bounded
 * at 900ms (the killer — the unbounded-evaluate lesson). */
async function installEnterSampler(page: Page, secondChild = false) {
  await page.evaluate((watchSecond) => {
    window.__toastEnter = { t0: null, frames: [] as { t: number; o: number; m: string }[], insertPose: null as { ty: number; sx: number; o: number } | null };
    const findItem = () => {
      const region = document.querySelector("div.fixed.bottom-6.right-6");
      if (!region) return null;
      const kids = [...region.children];
      if (!kids.length) return null;
      return watchSecond ? (kids[kids.length - 1] as HTMLElement) : (kids[0] as HTMLElement);
    };
    const parse = (m: string) => {
      if (!m || m === "none") return { ty: 0, sx: 1 };
      const v = m.match(/matrix\(([^)]+)\)/);
      if (!v) return { ty: 0, sx: 1 };
      const [a, , , , , e] = v[1].split(",").map(Number);
      return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
    };
    const wantedCount = watchSecond ? 2 : 1;
    const mo = new MutationObserver(() => {
      const state = window.__toastEnter;
      if (!state || state.t0) return;
      const region = document.querySelector("div.fixed.bottom-6.right-6");
      if (!region || region.children.length < wantedCount) return;
      state.t0 = performance.now();
      mo.disconnect();
      // THE INSERTION POSE — read at the MO microtask, BEFORE the first
      // rendering style recalc: the computed style at this instant is the
      // @starting-style value (the transition's before-change style).
      // Deterministic — immune to the first-rAF-frame timing jitter that
      // flakes under load (the run-2 P5 lesson: a rAF landing 2+ frames
      // late reads the pose already decayed past the band).
      const poseItem = findItem();
      if (poseItem) {
        const pcs = getComputedStyle(poseItem);
        state.insertPose = { ...parse(pcs.transform), o: +(+pcs.opacity).toFixed(3) };
      }
      let stopped = false;
      const stop = () => {
        stopped = true;
      };
      setTimeout(stop, 900); // the hard bound
      const tick = () => {
        if (stopped) return;
        const it = findItem();
        if (!it) return;
        const state = window.__toastEnter;
        if (!state || state.t0 === null) return; // tsc strict-null guards (the r55 lesson)
        const cs = getComputedStyle(it);
        state.frames.push({
          t: +(performance.now() - state.t0).toFixed(0),
          o: +(+cs.opacity).toFixed(3),
          m: cs.transform,
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }, secondChild);
}

/** Parse a computed transform into { ty, sx } (matrix form). */
function parseMatrix(m: string): { ty: number; sx: number } {
  if (!m || m === "none") return { ty: 0, sx: 1 };
  const v = m.match(/matrix\(([^)]+)\)/);
  if (!v) return { ty: 0, sx: 1 };
  const [a, , , , , e] = v[1].split(",").map(Number);
  return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
}

/** Read the collected enter frames (call after the sampler's window). */
async function readEnterFrames(page: Page) {
  return page.evaluate(() => {
    const parse = (m: string) => {
      if (!m || m === "none") return { ty: 0, sx: 1 };
      const v = m.match(/matrix\(([^)]+)\)/);
      if (!v) return { ty: 0, sx: 1 };
      const [a, , , , , e] = v[1].split(",").map(Number);
      return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
    };
    const e = window.__toastEnter as { t0: number | null; frames: { t: number; o: number; m: string }[]; insertPose: { ty: number; sx: number; o: number } | null };
    return { t0: e.t0, insertPose: e.insertPose, frames: e.frames.map((f) => ({ t: f.t, o: f.o, ...parse(f.m) })) };
  });
}

/** The ATC on the wireless-headphones PDP (the sweep's PDP — .first()
 * scopes past the related-products quick-add, the r55 strict-mode lesson). */
async function addToCart(page: Page) {
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
}

test.describe("toast enter/exit animation states (session-56, TOAST-ANIM-1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    await page.waitForLoadState("networkidle");
  });

  test("P1: the region — fixed bottom-6 right-6 z-100, flex-col gap 8 (pointer-events-none: the registered deliberate divergence)", async ({ page }) => {
    // Measured live on the reference (r56a): the region
    // `fixed bottom-6 right-6 z-[100] flex flex-col gap-2` — fixed, z 100,
    // flex column, gap 8px, bottom 24px, right 24px. The clone is identical
    // PLUS pointer-events-none (the standing register: the reference's
    // toasts are inert on click, verified session-4; the clone's
    // click-through keeps the overlay from eating drawer-Checkout clicks).
    await addToCart(page);
    const region = page.locator("div.fixed.bottom-6.right-6");
    await expect(region).toBeVisible();
    await expect(region).toHaveClass(/fixed bottom-6 right-6 z-\[100\] flex flex-col gap-2 pointer-events-none/);
    const cs = await region.evaluate((el) => {
      const c = getComputedStyle(el);
      return { pos: c.position, z: c.zIndex, disp: c.display, dir: c.flexDirection, gap: c.rowGap, bottom: c.bottom, right: c.right, pe: c.pointerEvents };
    });
    expect(cs.pos).toBe("fixed");
    expect(cs.z).toBe("100");
    expect(cs.disp).toBe("flex");
    expect(cs.dir).toBe("column");
    expect(cs.gap).toBe("8px");
    expect(cs.bottom).toBe("24px");
    expect(cs.right).toBe("24px");
    expect(cs.pe).toBe("none"); // the registered divergence (the reference: auto)
  });

  test("P2: the item at rest — the session-4 dark-box contract extended to the full computed set", async ({ page }) => {
    // Measured IDENTICAL on both sides (r56a/r56c): bg rgb(23,23,28), color
    // rgb(251,250,249), radius 12px, padding 12px 16px, font 14px/500,
    // gap 8px, maxWidth 320px, the shadow-2xl 0.25 layer, 320x64 geometry.
    await addToCart(page);
    const item = page.locator("div.fixed.bottom-6.right-6 > div").first();
    await expect(item).toBeVisible();
    await page.waitForTimeout(450); // the enter spring settles (cart.spec's convention)
    const cs = await item.evaluate((el) => {
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        cls: el.getAttribute("class"),
        bg: c.backgroundColor, color: c.color, radius: c.borderRadius,
        pad: c.padding, font: c.fontSize + "/" + c.fontWeight, gap: c.columnGap,
        maxW: c.maxWidth, shadow: c.boxShadow, w: Math.round(r.width), h: Math.round(r.height),
        transform: c.transform, opacity: c.opacity,
      };
    });
    expect(cs.cls).toBe("toast-item bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium max-w-xs");
    expect(cs.bg).toBe("rgb(23, 23, 28)");
    expect(cs.color).toBe("rgb(251, 250, 249)");
    expect(cs.radius).toBe("12px");
    expect(cs.pad).toBe("12px 16px");
    expect(cs.font).toBe("14px/500");
    expect(cs.gap).toBe("8px");
    expect(cs.maxW).toBe("320px");
    expect(cs.shadow).toContain("rgba(0, 0, 0, 0.25) 0px 25px 50px -12px");
    expect(cs.w).toBe(320);
    expect(cs.h).toBe(64);
    expect(cs.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(cs.opacity).toBe("1");
  });

  test("P3: the svg — CircleCheckBig, 16px computed, the primary orange", async ({ page }) => {
    // Measured IDENTICAL both sides (r56a/r56c): the class string, the
    // 16px computed (h-4 w-4 — no descendant utility contest here), the
    // text-primary color.
    await addToCart(page);
    await page.waitForTimeout(450);
    const svg = page.locator("div.fixed.bottom-6.right-6 > div").first().locator("svg");
    await expect(svg).toHaveClass("lucide lucide-circle-check-big h-4 w-4 text-primary shrink-0");
    await expect(svg).toHaveCSS("width", "16px");
    await expect(svg).toHaveCSS("height", "16px");
    await expect(svg).toHaveCSS("color", "rgb(230, 107, 26)");
  });

  test("P4: THE FIX #1 — the @starting-style from-pose declares translateY(20px) scale(0.95), opacity 0 (the measured reference insertion pose)", async ({ page }) => {
    // The measured reference (r56a, the framer inline style at insertion):
    // `transform: translateY(20px) scale(0.95)`, `opacity: 0` — the first
    // rAF frame reads ty 19.88, sx 0.95, o 0.005. The pre-fix clone read
    // translateY(16px) scale(0.96) (the session-4 approximation, calibrated
    // before live spring measurement) — THE HONEST RED. The CSSOM rule is
    // the deterministic pin (r56d2's walk — the production build exposes
    // the @starting-style group; the inner rule's text carries the pose).
    const rules = await readToastRules(page);
    const pose = rules.filter((r) => r.startingStyle && r.text.includes(".toast-item"));
    expect(pose.length).toBeGreaterThanOrEqual(1);
    const text = pose[0].text;
    expect(text, "the from-pose transform (the measured reference: 20px/0.95)").toContain("transform: translateY(20px) scale(0.95)");
    expect(text, "the from-pose opacity").toContain("opacity: 0");
  });

  test("P5: the from-pose, behavioral — the insertion-pose computed reads the @starting-style values (ty in [14, 24], o <= 0.05)", async ({ page }) => {
    // Both sides' insertion pose: the reference t=4 ty 19.88 o 0.005; the
    // clone ~19.9/0.000 post-fix, 16.00/0.000 pre-fix (both inside the
    // band). The pose is read at the MutationObserver microtask — the
    // instant BEFORE the first rendering style recalc — so the computed
    // style IS the @starting-style value, deterministically (a late first
    // rAF frame reads the pose already decayed — the run-2 flake the
    // MO-pose read eliminates). The band catches a DEAD animation (ty=0
    // at insertion fires) while covering the from-pose variants.
    await installEnterSampler(page);
    await addToCart(page);
    await page.waitForTimeout(500);
    const { t0, insertPose, frames } = await readEnterFrames(page);
    expect(t0).not.toBeNull();
    expect(frames.length).toBeGreaterThanOrEqual(3);
    expect(insertPose, "the MO-time pose read landed").not.toBeNull();
    expect(insertPose!.ty).toBeGreaterThanOrEqual(14);
    expect(insertPose!.ty).toBeLessThanOrEqual(24);
    expect(insertPose!.o).toBeLessThanOrEqual(0.05);
  });

  test("P6: the settle — by 400ms the transform is the identity and the opacity 1", async ({ page }) => {
    // Measured both sides: the reference settles ty=0 & o=1 first at t=302;
    // the clone at t=301 (the 300ms transition). The 400ms read is safely
    // past both.
    await addToCart(page);
    await page.waitForTimeout(400);
    const item = page.locator("div.fixed.bottom-6.right-6 > div").first();
    await expect(item).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await expect(item).toHaveCSS("opacity", "1");
  });

  test("P7: the overshoot band — the bounce dips below 0 within [-3.5, -0.8] px over t=80..300ms", async ({ page }) => {
    // The toast's signature bounce: the reference overshoots to -2.41 at
    // t=169 (12.05% of the 20px travel); the clone to -1.56 pre-fix / ~-1.94
    // post-fix (the bezier's 9.7% — the registered magnitude gap, 0.47px).
    // The band catches a linear/ease curve (min ty = 0.00 fires) and a
    // broken overshoot (deeper than -3.5 fires).
    await installEnterSampler(page);
    await addToCart(page);
    await page.waitForTimeout(600);
    const { frames } = await readEnterFrames(page);
    const window_ = frames.filter((f) => f.t >= 80 && f.t <= 300);
    expect(window_.length).toBeGreaterThanOrEqual(3);
    const minTy = Math.min(...window_.map((f) => f.ty));
    expect(minTy).toBeLessThanOrEqual(-0.8);
    expect(minTy).toBeGreaterThanOrEqual(-3.5);
  });

  test("P8: the enter duration + curve declared — 300ms on opacity and transform, the bounce bezier", async ({ page }) => {
    // The clone's own declared contract (the architecture register: the
    // reference drives framer inline JS — transition 0s all, animation 0s
    // none — pinned here as the clone's CSS equivalent): 0.3s on both
    // properties, cubic-bezier(0.34, 1.56, 0.64, 1).
    await addToCart(page);
    await page.waitForTimeout(450);
    const item = page.locator("div.fixed.bottom-6.right-6 > div").first();
    await expect(item).toHaveCSS("transition-duration", "0.3s, 0.3s");
    const tf = await item.evaluate((el) => getComputedStyle(el).transitionTimingFunction);
    expect(tf).toContain("cubic-bezier(0.34, 1.56, 0.64, 1)");
  });

  test("P9: the exit trigger — resting at 2900ms, the toast-exiting class lands by 3400ms", async ({ page }) => {
    // Measured both sides: the reference's first moving frame t=3019 past
    // insertion; the clone's class landing t=3010 (the 3000ms timer). The
    // 2900ms read must still be at rest (the 3s dwell).
    await installEnterSampler(page);
    await addToCart(page);
    const data = await page.evaluate(async () => {
      // The click() promise resolves BEFORE the MutationObserver fires (the
      // React commit + the MO microtask land ~30ms later) — POLL for t0,
      // never read it eagerly (a null t0 makes performance.now() - t0 read
      // the wall-clock origin, off by ~1.4s — the P9 spec lesson).
      const t0 = await new Promise<number>((resolve) => {
        const check = () => {
          const v = (window.__toastEnter as { t0: number | null }).t0;
          if (v) resolve(v);
          else setTimeout(check, 16);
        };
        check();
      });
      return new Promise<{ restAt2900: { exiting: boolean; o: number; ty: string } | null; classAt: number | null }>((resolve) => {
        let done = false;
        const finish = (payload: { restAt2900: { exiting: boolean; o: number; ty: string } | null; classAt: number | null }) => {
          if (!done) { done = true; resolve(payload); }
        };
        setTimeout(() => finish({ restAt2900: null, classAt: null }), 8000); // the hard bound
        const readRest = () => {
          const region = document.querySelector("div.fixed.bottom-6.right-6");
          const it = region && (region.children[0] as HTMLElement);
          if (!it) { finish({ restAt2900: null, classAt: null }); return; }
          const cs = getComputedStyle(it);
          const restAt2900 = { exiting: it.classList.contains("toast-exiting"), o: +(+cs.opacity).toFixed(3), ty: cs.transform };
          // setTimeout cadence (NOT rAF — the runner's tracing can starve
          // rAF callbacks; class checks don't need frame sync)
          const pollClass = () => {
            if (done) return;
            const region2 = document.querySelector("div.fixed.bottom-6.right-6");
            const it2 = region2 && (region2.children[0] as HTMLElement);
            if (!it2 || it2.classList.contains("toast-exiting")) {
              finish({ restAt2900, classAt: it2 ? +(performance.now() - t0).toFixed(0) : null });
              return;
            }
            setTimeout(pollClass, 16);
          };
          setTimeout(pollClass, 16);
        };
        setTimeout(readRest, Math.max(0, 2900 - (performance.now() - t0)));
      });
    });
    expect(data.restAt2900, "the toast still mounted at 2900ms").not.toBeNull();
    expect(data.restAt2900!.exiting).toBe(false);
    expect(data.restAt2900!.o).toBe(1);
    expect(data.classAt, "the class lands by 3400ms").not.toBeNull();
    expect(data.classAt!).toBeGreaterThanOrEqual(2900);
    expect(data.classAt!).toBeLessThanOrEqual(3400);
  });

  test("P10: THE FIX #2 — the exit contract: opacity 0 + translateY(-10px) scale(0.95) + the easeOutQuad fade bezier", async ({ page }) => {
    // The measured reference exit: the inline target
    // `translateY(-10px) scale(0.95)` + opacity -> 0, fading ease-OUT
    // (0.31 at +150ms). The pre-fix clone declared the right TARGET but
    // the wrong CURVE — cubic-bezier(0.4, 0, 1, 1), an ease-in (0.55 at
    // +150ms) — THE HONEST RED. The fix: cubic-bezier(0.25, 0.46, 0.45,
    // 0.94) (the easeOutQuad fit, <=0.10 from the measured reference at
    // every checkpoint). Pinned at the CSSOM rule + the computed TF on the
    // live exiting element.
    const rules = await readToastRules(page);
    const exitingRule = rules.find((r) => !r.startingStyle && r.text.includes(".toast-item.toast-exiting"));
    expect(exitingRule, "the .toast-exiting rule exists").toBeDefined();
    expect(exitingRule!.text).toContain("opacity: 0");
    expect(exitingRule!.text).toContain("transform: translateY(-10px) scale(0.95)");
    expect(exitingRule!.text, "the exit fade curve (THE FIX: easeOutQuad)").toContain("cubic-bezier(0.25, 0.46, 0.45, 0.94)");
    // the live computed on the exiting element (mid-exit read)
    await addToCart(page);
    const tf = await page.evaluate(() => {
      return new Promise<string>((resolve) => {
        let done = false;
        const finish = (v: string) => { if (!done) { done = true; resolve(v); } };
        setTimeout(() => finish("(timeout)"), 9000); // the hard bound
        // Phase 1: WAIT for the insertion — the click() promise resolves
        // BEFORE the React commit (the toast lands ~30ms later); a poll
        // that treats "no children" as "gone" races the insertion (the
        // P10 spec lesson — the same class of bug as the P9 t0-null).
        const pollInserted = () => {
          if (done) return;
          const region = document.querySelector("div.fixed.bottom-6.right-6");
          if (region && region.children.length >= 1) { pollClass(); return; }
          setTimeout(pollInserted, 16);
        };
        // Phase 2: watch for the toast-exiting class (setTimeout cadence —
        // class checks don't need frame sync).
        const pollClass = () => {
          if (done) return;
          const region = document.querySelector("div.fixed.bottom-6.right-6");
          const it = region && (region.children[0] as HTMLElement);
          if (!it) { finish("(gone)"); return; }
          if (it.classList.contains("toast-exiting")) {
            finish(getComputedStyle(it).transitionTimingFunction);
            return;
          }
          setTimeout(pollClass, 16);
        };
        setTimeout(pollInserted, 16);
      });
    });
    expect(tf).toContain("cubic-bezier(0.25, 0.46, 0.45, 0.94)");
  });

  test("P11: THE FIX #2, behavioral — the mid-exit fade: opacity <= 0.40 at +150ms (the ease-out character)", async ({ page }) => {
    // The measured reference at +150ms past the exit start: o = 0.31 (63%
    // progress at 50% time — fast start, gentle tail). The pre-fix clone
    // read ~0.55 (the ease-in — 32% progress at 50% time): the fade
    // DIRECTION was inverted; mid-exit the clone lingered 24 opacity points
    // above the reference. The fix reads ~0.25 at +150ms. The class-landing
    // anchor makes the sample frame-noise-proof (+-1 frame moves o by
    // ~0.05 on the ease-out curve).
    await addToCart(page);
    const data = await page.evaluate(() => {
      return new Promise<{ classAt: number | null; oAt150: number | null }>((resolve) => {
        let done = false;
        const finish = (classAt: number | null, oAt150: number | null) => { if (!done) { done = true; resolve({ classAt, oAt150 }); } };
        setTimeout(() => finish(null, null), 9000); // the hard bound
        // Phase 1: WAIT for the insertion (the P10 lesson — the click
        // resolves before the React commit; "no children" is "not yet
        // inserted", never "gone").
        const pollInserted = () => {
          if (done) return;
          const region = document.querySelector("div.fixed.bottom-6.right-6");
          if (region && region.children.length >= 1) { pollClass(); return; }
          setTimeout(pollInserted, 16);
        };
        const pollClass = () => {
          if (done) return;
          const region = document.querySelector("div.fixed.bottom-6.right-6");
          const it = region && (region.children[0] as HTMLElement);
          if (!it) { finish(null, null); return; }
          if (it.classList.contains("toast-exiting")) {
            const landed = performance.now();
            // Anchor on the FIRST OBSERVED ANIMATED VALUE (the reference
            // probe's own "first moving frame" definition) — NOT the class
            // landing: under load the style recalc can lag the class by a
            // frame+, and a read anchored on the class would catch the
            // transition mid-start (o still ~1). The move-poll makes the
            // +150ms sample immune to that start jitter.
            const pollMove = () => {
              if (done) return;
              const region1 = document.querySelector("div.fixed.bottom-6.right-6");
              const it1 = region1 && (region1.children[0] as HTMLElement);
              if (!it1) { finish(+landed.toFixed(0), 0); return; } // gone => the fade completed
              const cs = getComputedStyle(it1);
              if (+cs.opacity < 0.999 || cs.transform !== "matrix(1, 0, 0, 1, 0, 0)") {
                setTimeout(() => {
                  const region2 = document.querySelector("div.fixed.bottom-6.right-6");
                  const it2 = region2 && (region2.children[0] as HTMLElement);
                  finish(+landed.toFixed(0), it2 ? +(+getComputedStyle(it2).opacity).toFixed(3) : 0);
                }, 150);
                return;
              }
              setTimeout(pollMove, 16);
            };
            setTimeout(pollMove, 16);
            return;
          }
          setTimeout(pollClass, 16);
        };
        setTimeout(pollInserted, 16);
      });
    });
    expect(data.classAt).not.toBeNull();
    expect(data.oAt150, "the ease-out fade: mostly gone by mid-exit (the reference reads 0.31)").not.toBeNull();
    expect(data.oAt150!).toBeLessThanOrEqual(0.4);
    expect(data.oAt150!).toBeGreaterThanOrEqual(0.0);
  });

  test("P12: the exit completion + the unmount — opacity <= 0.02 at +320ms, gone from the DOM by 3600ms past insertion", async ({ page }) => {
    // The reference: o 0.001 at +266ms, unmount ~3317ms past insertion.
    // The clone: the 300ms transition (o ~0 at +300ms) + the 3400ms unmount
    // timer (the registered 84ms lag). The +320ms read and the 3600ms DOM
    // check bound both.
    await installEnterSampler(page);
    await addToCart(page);
    const data = await page.evaluate(async () => {
      // The t0 poll (the P9 lesson — the click resolves before the MO fires).
      const t0 = await new Promise<number>((resolve) => {
        const check = () => {
          const v = (window.__toastEnter as { t0: number | null }).t0;
          if (v) resolve(v);
          else setTimeout(check, 16);
        };
        check();
      });
      return new Promise<{ oAt320: number | null; removedAt: number | null }>((resolve) => {
        let done = false;
        let oAt320: number | null = null;
        const finish = (removedAt: number | null) => { if (!done) { done = true; resolve({ oAt320, removedAt }); } };
        setTimeout(() => finish(null), 10000); // the hard bound
        const readAt320 = (landed: number) => {
          setTimeout(() => {
            const region3 = document.querySelector("div.fixed.bottom-6.right-6");
            const it3 = region3 && (region3.children[0] as HTMLElement);
            oAt320 = it3 ? +(+getComputedStyle(it3).opacity).toFixed(3) : 0; // gone by +320 => the exit completed (o effectively 0)
            const pollRemoval = () => {
              if (done) return;
              const region2 = document.querySelector("div.fixed.bottom-6.right-6");
              const it2 = region2 && (region2.children[0] as HTMLElement);
              if (!it2) { finish(+(performance.now() - t0).toFixed(0)); return; }
              if (performance.now() - t0 > 4200) { finish(null); return; }
              setTimeout(pollRemoval, 16);
            };
            setTimeout(pollRemoval, 16);
          }, Math.max(0, 320 - (performance.now() - landed)));
        };
        const pollClass = () => {
          if (done) return;
          const region = document.querySelector("div.fixed.bottom-6.right-6");
          const it = region && (region.children[0] as HTMLElement);
          if (!it) { finish(+(performance.now() - t0).toFixed(0)); return; }
          if (it.classList.contains("toast-exiting")) { readAt320(performance.now()); return; }
          setTimeout(pollClass, 16);
        };
        setTimeout(pollClass, 16);
      });
    });
    expect(data.oAt320, "the exit is complete at +320ms (the reference: 0.001 at +266ms)").not.toBeNull();
    expect(data.oAt320!).toBeLessThanOrEqual(0.02);
    expect(data.removedAt, "the unmount (the 3400ms timer; the reference 3317ms — the registered 84ms lag)").not.toBeNull();
    expect(data.removedAt!).toBeLessThanOrEqual(3600);
  });

  test("P13: the dwell — at 2800ms the toast is still fully visible (the 3s lifetime contract)", async ({ page }) => {
    // The measured reference: the dismiss trigger at ~3019ms — the toast
    // rests fully visible through ~2.9s. The 2800ms read must be o >= 0.99
    // at the settled pose.
    await addToCart(page);
    await page.waitForTimeout(2800);
    const item = page.locator("div.fixed.bottom-6.right-6 > div").first();
    await expect(item).toBeVisible();
    await expect(item).toHaveCSS("opacity", "1");
    await expect(item).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  });

  test("P14: the stack — two toasts in the gap-8 column, the second entering from the same measured pose", async ({ page }) => {
    // The reference's rapid-add behavior (pinned session-4 at the resting
    // layer): rapid adds stack without dedupe, each its own element in the
    // gap-2 region. The @starting-style applies per element insertion — the
    // SECOND toast enters from the same measured 20px/0.95 pose.
    await installEnterSampler(page, true);
    await addToCart(page);
    await page.waitForTimeout(250); // the first toast settles; still mounted
    await addToCart(page);
    await page.waitForTimeout(500);
    const region = page.locator("div.fixed.bottom-6.right-6");
    await expect(region.locator("> div")).toHaveCount(2);
    const { t0, insertPose, frames } = await readEnterFrames(page);
    expect(t0).not.toBeNull();
    expect(frames.length).toBeGreaterThanOrEqual(3);
    expect(insertPose, "the second toast's MO-time pose read landed").not.toBeNull();
    expect(insertPose!.ty, "the second toast's from-pose (the same @starting-style)").toBeGreaterThanOrEqual(14);
    // the cleanup: the demo cart returns to empty for the flow specs (the
    // r55 badge-capture convention — the DB left as found)
    await clearCartViaDrawer(page);
  });
});

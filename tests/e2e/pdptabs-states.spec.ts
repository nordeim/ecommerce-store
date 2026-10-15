import { expect, test } from "@playwright/test";

// PDP tabs interaction states (session-60, PDPTABS-STATES-1) — the
// customer-surfaces pin-density sweep's EIGHTEENTH installment: the tabs
// interaction family (the PDP + the account — ONE shared component,
// src/components/ui/tabs.tsx, TWO reference variants). The resting sweep
// captures the PDP at the default Description tab only; the tabs'
// INTERACTION states were never measured: the tablist/trigger computed
// anatomy, the selected/inactive/hover states, the click panel swap, the
// focus/keyboard paths, the roving tabindex. Every pin here is calibrated
// against the LIVE surfaces (seven probes: pdptabs-probe-r60a/a2 on the
// reference PDP [a2 with the L84 scroll discipline — a's click sequence
// hit the viewport-clamp trap at the tablist's y=754], pdptabs-clone-r60b
// on the clone PDP, pdptabs-probe-r60c + pdptabs-clone-r60d on the two
// account surfaces, pdptabs-mechanism-r60e — the instrumented focus hunt,
// + pdptabs-probe-r60f — the reference's keyboard path, +
// pdptabs-experiment-r60 — the fix's DOM-mechanics validation):
//
//   - THE ROUND'S HEADLINE (FINDING 1 — the clicked-trigger ring): the
//     reference's tab trigger receives focus NATIVELY on mousedown
//     (probe E: zero SCRIPT-FOCUS events; :focus-visible FALSE) — NO ring
//     on the clicked trigger. The clone's @radix-ui/react-tabs 1.1.12
//     script-focuses the trigger in its mousedown handler (the source
//     line: event.currentTarget.focus()) — Chrome matches a script focus
//     issued during a mousedown dispatch against :focus-visible → the
//     focus-visible ring utilities PAINT on the clicked trigger (a 2px
//     background + 4px orange halo). The fix: a capture-phase mousedown
//     guard in ui/tabs.tsx stops the native event before React's bubble
//     dispatch (Radix's script focus never runs) while the BROWSER's
//     default action still focuses the trigger natively — and the
//     activation lands via Radix's onFocus auto-activation, the
//     reference's exact flow (the mechanism validated by the experiment).
//   - FINDING 2 + 3 (the variant split): the reference renders TWO tabs
//     variants — the PDP list carries NO overflow-x-auto and the PDP
//     triggers NO gap-2 (computed overflow-x visible, gap normal — the
//     triggers are text-only), while the ACCOUNT variant carries BOTH
//     (overflow-x-auto + gap-2 with lucide icons — the icon→text gap 8px
//     measured live). The clone's ONE component carried the account
//     variant's classes on both pages. The fix: the base becomes the PDP
//     variant; the account appends its extras (className overrides).
//   - THE PARITY AXES (the other 10 pins): the geometry byte-identical
//     (list h-36 radius-12 p-4; triggers 101/118/82 × 28, 14px/500,
//     padding 4px 12px, radius 12px, transition 0.15s); the panel gap
//     24px (the account contract, now PDP-pinned too); the click's panel
//     swap + ZERO network; the roving tabindex (all −1 at rest, the
//     clicked/selected gets 0); the script-focus auto-activation; the
//     keyboard :focus-visible ring (the two-sided truth: no ring on
//     CLICK, ring on KEYBOARD); the arrow navigation; @375.
//   - THE ENGINE REGISTERS (accepted): lab() vs rgba() serialization; v4
//     4 transparent shadow reset layers vs v3's 2; v4 outline-none =
//     outline-style none vs v3's outline: 2px solid transparent (the
//     session-55 invisible-outline register — re-verified: the reference's
//     keyboard-focused trigger settles at rgba(0,0,0,0)); the Radix id
//     prefixes; the base class token ORDER (the PDP list orders
//     w-full/justify-start after p-1 on the reference, before on the
//     clone — the same SET, inert; the ACCOUNT variant's order matches
//     byte-exact).
//   - THE ROVING QUIRK (shared, a register): on a FRESH page all triggers
//     carry tabIndex −1 (Radix's roving group has no current stop until
//     an interaction) — the tablist is skipped by the Tab key on BOTH
//     sites. P10's walk therefore establishes the roving current first
//     (the click), then blurs, then walks — the honest keyboard scenario
//     (a mouse user who switches to the keyboard).
//
// Instrument notes (the round's probe-honesty lessons): the tablist sits
// below the fold on every desktop viewport — use locator interactions
// (auto-scrolling), never raw coordinates (the L84 clamp trap); the ring
// judgment reads the FULL settled boxShadow (900ms — the 150ms transition
// × 6 headroom) and parses the spread layers (the layer-count register);
// the :focus-visible judgment for the KEYBOARD path requires a real
// keyboard.press("Tab") walk (script .focus() trips Chrome's heuristic
// differently — the round's central lesson).

test.describe("PDP tabs interaction states (session-60, PDPTABS-STATES-1)", () => {
  const pdp = "/product/wireless-headphones";

  test("P1: the tablist's computed anatomy — h-36, radius 12, p-4, secondary/50, overflow-x VISIBLE (the PDP variant)", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const list = page.locator('[role="tablist"]').first();
    await list.scrollIntoViewIfNeeded();
    const read = await list.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { h: Math.round(el.getBoundingClientRect().height), radius: cs.borderRadius, padding: cs.padding, bg: cs.backgroundColor, overflowX: cs.overflowX, display: cs.display, justify: cs.justifyContent };
    });
    // Measured live on the reference (r60a): 36px tall, 12px radius, 4px
    // padding, the secondary/50 tint (lab/rgba register), overflow-x
    // VISIBLE — the PDP variant (the account variant carries auto).
    expect(read.h).toBe(36);
    expect(read.radius).toBe("12px");
    expect(read.padding).toBe("4px");
    expect(read.bg).toMatch(/(lab\(94\.[^)]*\/ 0\.5\)|rgba\(242, ?240, ?237, ?0\.5\))/);
    expect(read.overflowX).toBe("visible");
    expect(read.display).toBe("inline-flex");
    expect(read.justify).toBe("flex-start");
  });

  test("P2: the variant's class strings — the PDP list carries NO overflow-x-auto; the PDP triggers NO gap (FINDING 2 + 3)", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const list = page.locator('[role="tablist"]').first();
    const listCls = (await list.getAttribute("class")) || "";
    expect(listCls).toContain("inline-flex h-9 items-center text-muted-foreground");
    expect(listCls).toContain("bg-secondary/50 rounded-xl p-1");
    // FINDING 2: the reference's PDP variant has NO overflow-x-auto
    // (the account variant's scroll affordance — measured live).
    expect(listCls).not.toContain("overflow-x");
    const trigCls = (await page.locator('[role="tab"]').first().getAttribute("class")) || "";
    // FINDING 3: the reference's PDP triggers carry NO gap utility (the
    // account variant's gap-2 pairs with its lucide icons).
    expect(trigCls).not.toContain("gap-");
    expect(trigCls).toContain("data-[state=active]:bg-background");
    expect(trigCls).toContain("data-[state=active]:shadow");
    // The computed gap: normal (no gap utility) — 0 spacing, the
    // text-only triggers have a single flex child.
    const gap = await page.locator('[role="tab"]').first().evaluate((el) => getComputedStyle(el).gap);
    expect(["normal", "0px"]).toContain(gap);
  });

  test("P3: the resting selection — Description active (bg/color/shadow), Reviews + Shipping inactive", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const sel = page.locator('[role="tab"][aria-selected="true"]');
    await sel.scrollIntoViewIfNeeded();
    await expect(sel).toHaveText(/Description/);
    const read = await sel.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow, state: el.getAttribute("data-state"), h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) };
    });
    expect(read.state).toBe("active");
    expect(read.bg).toBe("rgb(251, 250, 249)"); // data-[state=active]:bg-background
    expect(read.color).toBe("rgb(23, 23, 28)"); // data-[state=active]:text-foreground
    // The v3 `shadow` pair (0.1 blacks) present; NO ring layers at rest.
    expect(read.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px");
    expect(read.shadow).not.toContain("0px 0px 0px 4px");
    expect(read.h).toBe(28);
    expect(read.w).toBe(101); // content-sized (measured live both sides)
    for (const name of ["Reviews (234)", "Shipping"]) {
      const t = page.locator('[role="tab"]', { hasText: name });
      const r = await t.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow, w: Math.round(el.getBoundingClientRect().width) };
      });
      expect(r.bg).toBe("rgba(0, 0, 0, 0)");
      expect(r.color).toBe("rgb(111, 111, 123)"); // text-muted-foreground
      expect(r.shadow).toBe("none");
      expect(r.w).toBe(name.startsWith("Reviews") ? 118 : 82);
    }
  });

  test("P4: the panel — the Description content, the 24px tablist→panel gap, the mt-6 class", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const gap = await page.evaluate(() => {
      const list = document.querySelector('[role="tablist"]');
      const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
      if (!list || !panel) throw new Error("tabs not found");
      const lr = list.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      return { gap: Math.round(pr.y - (lr.y + lr.height)), cls: panel.getAttribute("class") || "" };
    });
    // Measured live on the reference (r60a [3]): 24px — the account
    // contract's TabsContent mt-6, now PDP-pinned too.
    expect(gap.gap).toBe(24);
    expect(gap.cls).toContain("mt-6");
    await expect(page.locator('[role="tabpanel"][data-state="active"]')).toContainText("Premium over-ear headphones");
  });

  test("P5: the hover on the unselected Reviews trigger — NO computed change", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const rev = page.locator('[role="tab"]', { hasText: "Reviews" });
    await rev.hover();
    await page.waitForTimeout(450);
    const read = await rev.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow, state: el.getAttribute("data-state") };
    });
    // Measured live on the reference (r60a2 [3]): the trigger class carries
    // NO hover variant — every axis unchanged under hover.
    expect(read.bg).toBe("rgba(0, 0, 0, 0)");
    expect(read.color).toBe("rgb(111, 111, 123)");
    expect(read.shadow).toBe("none");
    expect(read.state).toBe("inactive");
  });

  test("P6: the click — the Reviews activation, the panel swap, ZERO network", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    let net = 0;
    page.on("request", (req) => {
      if (req.resourceType() !== "xhr" && req.resourceType() !== "fetch") return;
      // The registered network superset (r59): Next.js Link prefetches
      // (`?_rsc=`) fire for the related-product cards when the click's
      // scroll brings them into view — NOT tab-driven. The pin: the tab
      // switch itself fires ZERO data requests.
      if ((req.url() || "").includes("_rsc=")) return;
      net++;
    });
    await page.locator('[role="tab"]', { hasText: "Reviews" }).click();
    await page.waitForTimeout(700);
    const read = await page.evaluate(() => {
      const sel = document.querySelector('[role="tab"][aria-selected="true"]');
      const panels = [...document.querySelectorAll('[role="tabpanel"]')];
      return {
        selText: sel ? (sel.textContent || "").trim() : null,
        panelStates: panels.map((p) => p.getAttribute("data-state")),
        activeHead: (panels.find((p) => p.getAttribute("data-state") === "active")?.textContent || "").trim().slice(0, 40),
      };
    });
    // Measured live on the reference (r60a2 [4]): the click activates
    // client-side — ZERO xhr/fetch (both sides).
    expect(read.selText).toBe("Reviews (234)");
    expect(read.panelStates).toEqual(["inactive", "active", "inactive"]);
    expect(read.activeHead).toContain("Customer reviews coming soon.");
    expect(net).toBe(0);
  });

  test("P7 — THE HEADLINE: the clicked trigger does NOT match :focus-visible; the settled boxShadow carries NO ring layers", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const rev = page.locator('[role="tab"]', { hasText: "Reviews" });
    await rev.click();
    await page.waitForTimeout(900); // fully past the 150ms transition (×6)
    const read = await rev.evaluate((el) => {
      const cs = getComputedStyle(el);
      // parse the spread radii of every box-shadow layer
      const spreads = (cs.boxShadow.match(/0px 0px 0px (\d+(?:\.\d+)?)px/g) || []).map((s) => Number(s.match(/(\d+(?:\.\d+)?)px$/)![1]));
      return { m: el.matches(":focus-visible"), shadow: cs.boxShadow, spreads };
    });
    // FINDING 1: the reference's trigger receives focus NATIVELY on
    // mousedown (probe E: zero SCRIPT-FOCUS events) — :focus-visible
    // FALSE, no ring. The pre-fix clone script-focused it (Radix 1.1.12's
    // mousedown handler) — Chrome matched the script focus against
    // :focus-visible and the ring painted (a 2px background + 4px orange
    // halo around the CLICKED trigger). The capture-phase guard restores
    // the native path.
    expect(read.m).toBe(false);
    expect(read.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px"); // the selected shadow pair
    expect(read.spreads).not.toContain(4); // NO ring's outer 4px layer
    expect(read.spreads).not.toContain(2); // NO ring-offset's 2px layer
  });

  test("P8: the roving tabindex — all −1 at rest; the clicked/selected trigger gets 0", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const atRest = await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].map((t) => (t as HTMLElement).tabIndex));
    expect(atRest).toEqual([-1, -1, -1]);
    await page.locator('[role="tab"]', { hasText: "Reviews" }).click();
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].map((t) => (t as HTMLElement).tabIndex));
    // Measured live on the reference (r60a2 [4]): the roving current moves
    // to the clicked trigger.
    expect(after).toEqual([-1, 0, -1]);
  });

  test("P9: the script-focus auto-activation — focus() on Shipping activates it + the panel swaps", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const ship = page.locator('[role="tab"]', { hasText: "Shipping" });
    await ship.evaluate((el) => el.focus());
    await page.waitForTimeout(500);
    const read = await page.evaluate(() => {
      const sel = document.querySelector('[role="tab"][aria-selected="true"]');
      const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
      return { selText: (sel?.textContent || "").trim(), head: (panel?.textContent || "").trim().slice(0, 40) };
    });
    // Measured live on BOTH sides (r60a2 [7] / r60b [7]): Radix's onFocus
    // auto-activation — an inactive trigger focused by script ACTIVATES.
    expect(read.selText).toBe("Shipping");
    expect(read.head).toContain("Free standard shipping");
  });

  test("P10: the keyboard path (the two-sided truth) — Tab-walk to the current trigger matches :focus-visible + the ring paints", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    // establish the roving current (the fresh page has all tabIndex −1 —
    // the shared Radix quirk: the tablist is Tab-skipped until an
    // interaction sets the current; documented in the header).
    await page.locator('[role="tab"]', { hasText: "Reviews" }).click();
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    let found: null | { text: string; m: boolean; spreads: number[] } = null;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(60);
      const st = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el.getAttribute("role") !== "tab") return null;
        const cs = getComputedStyle(el);
        const spreads = (cs.boxShadow.match(/0px 0px 0px (\d+(?:\.\d+)?)px/g) || []).map((s) => Number(s.match(/(\d+(?:\.\d+)?)px$/)![1]));
        return { text: (el.textContent || "").trim(), m: el.matches(":focus-visible"), spreads };
      });
      if (st) { found = st; break; }
    }
    expect(found).not.toBeNull();
    // The KEYBOARD path paints the ring on BOTH sites (measured live:
    // r60f [2] reference settled, r60b [8] clone) — the two-sided truth
    // vs P7 (no ring on CLICK, ring on KEYBOARD). At the walk step the
    // match is already true; the ring LAYERS are mid-transition (the
    // 150ms transition-all) — the spread asserts run on the SETTLED read.
    expect(found!.text).toBe("Reviews (234)");
    expect(found!.m).toBe(true);
    await page.waitForTimeout(400); // settle past the transition
    const settled = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el.getAttribute("role") !== "tab") return null;
      const cs = getComputedStyle(el);
      const spreads = (cs.boxShadow.match(/0px 0px 0px (\d+(?:\.\d+)?)px/g) || []).map((s) => Number(s.match(/(\d+(?:\.\d+)?)px$/)![1]));
      return { text: (el.textContent || "").trim(), spreads };
    });
    expect(settled!.spreads).toContain(4); // the ring's outer layer (settled)
  });

  test("P11: the arrow navigation — ArrowRight moves focus + auto-activates the next trigger; the tabIndex follows", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    await page.locator('[role="tab"]', { hasText: "Reviews" }).click();
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    // walk to the current (Reviews) — the diagnostic census measured 41
    // steps at 1280×720 (the cap 60 gives the headroom)
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      const isTab = await page.evaluate(() => document.activeElement?.getAttribute("role") === "tab");
      if (isTab) break;
    }
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(400);
    const read = await page.evaluate(() => {
      const el = document.activeElement;
      const triggers = [...document.querySelectorAll('[role="tab"]')];
      if (!el || el.getAttribute("role") !== "tab") return { active: null as null | string };
      return { active: (el.textContent || "").trim(), selected: el.getAttribute("aria-selected"), indices: triggers.map((t) => (t as HTMLElement).tabIndex) };
    });
    // Measured live on the reference (r60f [3]): the roving arrows move
    // focus AND auto-activate (the same onFocus path).
    expect(read.active).toBe("Shipping");
    expect(read.selected).toBe("true");
    expect(read.indices).toEqual([-1, -1, 0]);
  });

  test("P12: the ACCOUNT variant regression pin — overflow-x auto + gap 8px + the icon→text gap 8px", async ({ page }) => {
    await page.goto("/account", { waitUntil: "networkidle" });
    const list = page.locator('[role="tablist"]').first();
    const read = await list.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { overflowX: cs.overflowX };
    });
    // The account variant (measured live on the reference — r60c [2]):
    // the list DOES carry overflow-x-auto here (the PDP variant does not).
    expect(read.overflowX).toBe("auto");
    const profile = page.locator('[role="tab"]', { hasText: "Profile" });
    const trig = await profile.evaluate((el) => {
      const cs = getComputedStyle(el);
      const icon = el.querySelector("svg");
      const ir = icon ? icon.getBoundingClientRect() : null;
      let iconTextGap: number | null = null;
      if (icon && ir) {
        const range = document.createRange();
        for (const node of el.childNodes) {
          if (node.nodeType === 3 && (node.textContent || "").trim()) {
            range.selectNodeContents(node);
            const tr = range.getBoundingClientRect();
            if (tr.width > 0) { iconTextGap = +(tr.x - (ir.x + ir.width)).toFixed(2); break; }
          }
        }
      }
      return { gap: cs.gap, hasIcon: !!icon, iconTextGap, iconW: ir ? Math.round(ir.width) : null };
    });
    expect(trig.gap).toBe("8px");
    expect(trig.hasIcon).toBe(true);
    expect(trig.iconW).toBe(16);
    expect(trig.iconTextGap).toBe(8);
  });

  test("P13: the ACCOUNT's clicked trigger — the same no-ring pin (the shared-component fix covers both surfaces)", async ({ page }) => {
    await page.goto("/account", { waitUntil: "networkidle" });
    const orders = page.locator('[role="tab"]', { hasText: "Orders" });
    await orders.click();
    await page.waitForTimeout(900);
    const read = await orders.evaluate((el) => {
      const cs = getComputedStyle(el);
      const spreads = (cs.boxShadow.match(/0px 0px 0px (\d+(?:\.\d+)?)px/g) || []).map((s) => Number(s.match(/(\d+(?:\.\d+)?)px$/)![1]));
      return { m: el.matches(":focus-visible"), sel: el.getAttribute("aria-selected"), spreads, shadow: cs.boxShadow };
    });
    // FINDING 1 on the account surface: the reference's clicked trigger
    // (r60c [3]: matchesFocusVisible FALSE, no ring layers) — the shared
    // ui/tabs.tsx guard covers BOTH consumers.
    expect(read.m).toBe(false);
    expect(read.sel).toBe("true");
    expect(read.spreads).not.toContain(4);
    expect(read.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px");
    // the activation landed (the panel swapped)
    await expect(page.locator('[role="tabpanel"][data-state="active"]')).toContainText("Order History");
  });

  test("P14: the @375 mobile pass — the list 343 wide, no scroll, the triggers 101/118/82 × 28", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const list = document.querySelector('[role="tablist"]');
      if (!list) throw new Error("no tablist");
      const triggers = [...list.querySelectorAll('[role="tab"]')];
      return {
        listW: Math.round(list.getBoundingClientRect().width),
        scrollW: list.scrollWidth,
        clientW: list.clientWidth,
        rects: triggers.map((t) => ({ w: Math.round(t.getBoundingClientRect().width), h: Math.round(t.getBoundingClientRect().height) })),
      };
    });
    // Measured live on BOTH sides @375 (r60a [9] / r60b [10]): the list
    // 343 wide, the content fits (no scroll — scrollWidth === clientWidth),
    // the trigger widths content-sized 101/118/82, height 28.
    expect(read.listW).toBe(343);
    expect(read.scrollW).toBe(read.clientW);
    expect(read.rects.map((r) => r.w)).toEqual([101, 118, 82]);
    for (const r of read.rects) expect(r.h).toBe(28);
  });
});

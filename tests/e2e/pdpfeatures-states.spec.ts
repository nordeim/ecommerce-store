import { expect, test } from "@playwright/test";

// PDP description-tab key-features list states (session-62,
// PDPFEATURES-STATES-1) — the customer-surfaces pin-density sweep's
// TWENTIETH installment: the key-features LIST inside the Description
// panel (r60's PDPTABS-STATES-1 pinned the tabs interaction family; the
// list itself — the h3 + the icon-bulleted ul — was never measured as a
// surface). The closure form (the r54/r57/r59 precedent): the audit
// found ZERO divergence on all twelve axes (four probes:
// pdpfeatures-ref-r62a/a2 on the reference, pdpfeatures-clone-r62b/b2/b3
// on the clone) — every pin here is GREEN against the current artifact
// and characterizes the measured parity contract; the mutation battery
// (scripts/mutation-run-r62.sh, x8 against page.tsx) proves the teeth.
//
// The pinned ground truth (the paired probes, 1280x800 desktop + 375
// mobile):
//   - the h3: "Key Features" in `text-lg font-semibold mt-4 mb-2` —
//     18px/600, rgb(23,23,28), line-height 28px, margins 16/8
//   - the ul: `space-y-2` — 4 rows, list-style none, 120px tall
//   - the rows: `flex items-center gap-2 text-muted-foreground` — 24px
//     tall, 8px gap, rgb(111,111,123), 16px/400/24px, the feature text
//     as a direct TEXT_NODE after the svg
//   - the icon: `lucide lucide-check h-4 w-4 text-primary` — 16x16,
//     rgb(230,107,26), stroke-width 2, viewBox 0 0 24 24, display block
//     (flex-item blockification), aria-hidden true (the SUPERSET
//     register: the reference's svg carries NO aria-hidden — the clone's
//     lucide-react correctly hides the decorative icon from AT)
//   - the row pitch 32px (24 row + 8 gap) — the SPACING contract pinned
//     by the rects, never the margin side (the round's engine register:
//     v3 space-y puts margin-TOP on following rows, v4 puts
//     margin-block-END on preceding non-last rows — the same paint)
//   - non-interactive rows (0 buttons/links, cursor auto, the inert
//     all/0s transition — both sites)
//   - the parent wrapper `prose prose-sm max-w-none` (dead classes on
//     BOTH sites — zero prose CSS emitted either side; DOM parity)
//   - the tabpanel association (role=tabpanel + data-state=active +
//     aria-labelledby = the Description trigger's id — the RELATIONSHIP,
//     never the literal Radix prefix)
//   - the description paragraph `text-muted-foreground leading-relaxed`
//     — 16px/26px, margin 0 (the zero-prose register)
//   - @375: h3 343x28, list 343x120, rows 343x24, icon 16x16
//
// Instrument notes: all geometry pins assert WIDTHS/HEIGHTS and
// Y-DELTAS (scroll- and viewport-independent — the L94 discipline
// generalized: pin the spacing contract, not viewport coordinates, for
// below-the-fold surfaces); the svg class is read via
// getAttribute("class") (the SVGAnimatedString serialization trap); the
// DOM walk anchors on the h3 ELEMENT locator (the element-form
// evaluate — the house style, full type inference); the walk derives
// the list (at most three siblings down) and the paragraph (at most
// three back) INSIDE each evaluate function.
//
// No rate-limited endpoint is touched (the PDP is server-rendered; zero
// search/auth/newsletter requests) — no file-order constraint; the spec
// joins the n-q group (orderdetail, paystep, pdpfeatures, pdptabs,
// performance, qty-stepper, quickadd — 7 files).

test.describe("PDP description-tab key-features list states (session-62, PDPFEATURES-STATES-1)", () => {
  const pdp = "/product/wireless-headphones";
  const h3Loc = (page: import("@playwright/test").Page) =>
    page.getByRole("heading", { level: 3, name: "Key Features" });

  // Each evaluate inlines the probes' DOM walk (the serialization
  // boundary forbids shared closures): from the h3 (el), the list at
  // most three siblings down; the paragraph at most three back; the
  // trailing throw narrows the TS types and fails loudly if the
  // surface moves.

  test("P1: the h3 — the 'Key Features' heading, its class string, and its computed set", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const h3 = h3Loc(page);
    await h3.scrollIntoViewIfNeeded();
    await expect(h3).toHaveCount(1, { timeout: 3000 });
    const read = await h3.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        cls: el.getAttribute("class") || "",
        fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color,
        lineHeight: cs.lineHeight, marginTop: cs.marginTop, marginBottom: cs.marginBottom,
        h: Math.round(el.getBoundingClientRect().height),
      };
    });
    // Measured live on the reference (r62a): the exact class string and
    // computed set — 18px/600, the foreground color, 28px line-height,
    // the 16/8 margin rhythm.
    expect(read.cls).toBe("text-lg font-semibold mt-4 mb-2");
    expect(read.fontSize).toBe("18px");
    expect(read.fontWeight).toBe("600");
    expect(read.color).toBe("rgb(23, 23, 28)");
    expect(read.lineHeight).toBe("28px");
    expect(read.marginTop).toBe("16px");
    expect(read.marginBottom).toBe("8px");
    expect(read.h).toBe(28);
  });

  test("P2: the ul — the container's tag, class, list semantics, and the 120px height", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const cs = getComputedStyle(list);
      const r = list.getBoundingClientRect();
      return {
        tag: list.tagName, cls: list.getAttribute("class") || "",
        children: list.children.length, childTags: Array.from(list.children).map((c) => c.tagName),
        listStyle: cs.listStyleType, display: cs.display,
        padding: cs.padding, margin: cs.margin,
        w: Math.round(r.width), h: Math.round(r.height),
      };
    });
    // Measured live (r62a/b): the UL with `space-y-2`, 4 LI rows, no
    // list markers, no padding/margin, 1232 wide at the 1280 viewport
    // (max-w-7xl minus the 2x24 gutters), 120px tall (4x24 + 3x8).
    expect(read.tag).toBe("UL");
    expect(read.cls).toBe("space-y-2");
    expect(read.children).toBe(4);
    expect(read.childTags).toEqual(["LI", "LI", "LI", "LI"]);
    expect(read.listStyle).toBe("none");
    expect(read.display).toBe("block");
    expect(read.padding).toBe("0px");
    expect(read.margin).toBe("0px");
    expect(read.w).toBe(1232);
    expect(read.h).toBe(120);
  });

  test("P3: the row anatomy — the class string, the flex set, the muted typography, the text-node shape", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const li = list.children[0];
      const cs = getComputedStyle(li);
      const textNode = Array.from(li.childNodes).find((n) => n.nodeType === 3 && (n.textContent || "").trim());
      return {
        cls: li.getAttribute("class") || "",
        display: cs.display, columnGap: cs.columnGap, alignItems: cs.alignItems,
        color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
        h: Math.round(li.getBoundingClientRect().height),
        textIsDirectNode: !!textNode,
        nonSvgChildren: Array.from(li.children).filter((c) => c.tagName !== "svg").length,
      };
    });
    // Measured live (r62a/b): the row's exact class string and computed
    // set — the flex row with the 8px icon->text gap, the muted
    // 16px/400/24px typography, the feature text as a DIRECT text child.
    expect(read.cls).toBe("flex items-center gap-2 text-muted-foreground");
    expect(read.display).toBe("flex");
    expect(read.columnGap).toBe("8px");
    expect(read.alignItems).toBe("center");
    expect(read.color).toBe("rgb(111, 111, 123)");
    expect(read.fontSize).toBe("16px");
    expect(read.fontWeight).toBe("400");
    expect(read.lineHeight).toBe("24px");
    expect(read.h).toBe(24);
    expect(read.textIsDirectNode).toBe(true);
    expect(read.nonSvgChildren).toBe(0);
  });

  test("P4: the icon — the lucide check class, the 16px, the primary color, the stroke contract, the aria-hidden superset", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const svg = list.children[0].querySelector("svg");
      if (!svg) throw new Error("no icon svg in the first row");
      const cs = getComputedStyle(svg);
      const r = svg.getBoundingClientRect();
      return {
        cls: svg.getAttribute("class") || "",
        w: Math.round(r.width), h: Math.round(r.height),
        color: cs.color, fill: cs.fill, display: cs.display, flexShrink: cs.flexShrink,
        strokeWidth: svg.getAttribute("stroke-width"),
        viewBox: svg.getAttribute("viewBox"),
        widthAttr: svg.getAttribute("width"), heightAttr: svg.getAttribute("height"),
        ariaHidden: svg.getAttribute("aria-hidden"),
        pathChildren: svg.children.length,
      };
    });
    // Measured live (r62a/a2): the reference's icon is the IDENTICAL
    // lucide check (same class, same 16px, same primary color
    // rgb(230,107,26), same stroke contract) — with ONE delta: the
    // reference's svg carries NO aria-hidden while the clone's
    // lucide-react correctly hides the decorative icon from AT (the
    // superset register — pinned as the clone's form).
    expect(read.cls).toBe("lucide lucide-check h-4 w-4 text-primary");
    expect(read.w).toBe(16);
    expect(read.h).toBe(16);
    expect(read.color).toBe("rgb(230, 107, 26)");
    expect(read.fill).toBe("none");
    expect(read.strokeWidth).toBe("2");
    expect(read.viewBox).toBe("0 0 24 24");
    expect(read.widthAttr).toBe("24");
    expect(read.heightAttr).toBe("24");
    expect(read.pathChildren).toBe(1);
    // display: block — the flex-item blockification (both sites)
    expect(read.display).toBe("block");
    // the superset register: the clone hides the decorative icon
    expect(read.ariaHidden).toBe("true");
  });

  test("P5: the row texts — the 4 seeded features in the reference's exact order", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const texts = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      return Array.from(list.children).map((li) => (li.textContent || "").replace(/\s+/g, " ").trim());
    });
    // The session-2 reference-exact seed data, measured live on BOTH
    // sites this round (r62a: the reference renders the identical 4
    // strings in the identical order).
    expect(texts).toEqual([
      "Active Noise Cancellation",
      "30hr Battery",
      "Bluetooth 5.3",
      "Hi-Res Audio",
    ]);
  });

  test("P6: the inter-row spacing — the 32px pitch (24 row + 8 gap) pinned by the rects", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const pitches = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const ys = Array.from(list.children).map((li) => Math.round(li.getBoundingClientRect().y));
      return { deltas: ys.slice(1).map((y, i) => y - ys[i]), listH: Math.round(list.getBoundingClientRect().height) };
    });
    // The SPACING CONTRACT (the round's engine register): v3's space-y
    // puts margin-TOP on following rows, v4 puts margin-block-END on
    // preceding non-last rows — the PAINT is identical (the rects). The
    // pins assert the rects, never the margin side: the 32px pitch and
    // the 120px total.
    expect(pitches.deltas).toEqual([32, 32, 32]);
    expect(pitches.listH).toBe(120);
  });

  test("P7: the interactivity census — the rows are non-interactive (0 interactive descendants, cursor auto, the inert transition)", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const li = list.children[0];
      const cs = getComputedStyle(li);
      return {
        interactive: list.querySelectorAll("button,a,[role='button'],[tabindex]").length,
        cursor: cs.cursor, pointerEvents: cs.pointerEvents,
        tabIndexAttr: li.getAttribute("tabindex"),
        rowIsButton: li.tagName === "BUTTON" || !!li.closest("button"),
        hoverBg: cs.backgroundColor,
        transitionProperty: cs.transitionProperty, transitionDuration: cs.transitionDuration,
      };
    });
    // Measured live (r62a/b + the r62b3 calibration): the list is pure
    // CONTENT — no buttons, no links, no tabindex, no hover states (the
    // rows are not interactive on EITHER site; the cursor stays auto;
    // the transparent resting bg; the universal transition both
    // engines' preflights emit reads all/0s — INERT, calibrated live on
    // both sides before pinning).
    expect(read.interactive).toBe(0);
    expect(read.cursor).toBe("auto");
    expect(read.pointerEvents).toBe("auto");
    expect(read.tabIndexAttr).toBeNull();
    expect(read.rowIsButton).toBe(false);
    expect(read.hoverBg).toBe("rgba(0, 0, 0, 0)");
    expect(read.transitionProperty).toBe("all");
    expect(read.transitionDuration).toBe("0s");
  });

  test("P8: the a11y census — the native list semantics, NO explicit roles (the reference's exact census)", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const attrs = (e: Element) => e.getAttributeNames().filter((a) => a.startsWith("aria") || a === "role");
      return {
        h3Tag: el.tagName, h3Attrs: attrs(el),
        listTag: list.tagName, listAttrs: attrs(list),
        rowAttrs: attrs(list.children[0]),
        listIsNativeUl: list.tagName === "UL",
      };
    });
    // Measured live (r62a/b): BOTH sites render the plain native
    // semantics — the UL/LI announce as list/listitem with ZERO explicit
    // roles or aria attributes; the H3 provides the section heading.
    // (The clone's one a11y delta is P4's aria-hidden svg — the
    // decorative icon correctly hidden; the LIST semantics match the
    // reference exactly.)
    expect(read.h3Tag).toBe("H3");
    expect(read.h3Attrs).toEqual([]);
    expect(read.listTag).toBe("UL");
    expect(read.listAttrs).toEqual([]);
    expect(read.rowAttrs).toEqual([]);
    expect(read.listIsNativeUl).toBe(true);
  });

  test("P9: the parent wrapper — the `prose prose-sm max-w-none` class string (the dead-class DOM parity)", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      const parent = el.parentElement;
      return { parentCls: parent ? parent.getAttribute("class") || "" : "", parentTag: parent ? parent.tagName : "" };
    });
    // Measured live (r62a2/b2): the reference's h3's direct parent
    // carries the IDENTICAL class string — `prose prose-sm max-w-none`
    // — and NEITHER site emits any prose CSS (the typography plugin is
    // absent both sides; the classes are dead DOM parity). Do not
    // "clean" them: removing would break the class-string parity.
    expect(read.parentTag).toBe("DIV");
    expect(read.parentCls).toBe("prose prose-sm max-w-none");
  });

  test("P10: the tabpanel association — the list sits in the ACTIVE Description panel (the aria-labelledby relationship)", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let panel: Element | null = el.parentElement;
      for (let i = 0; i < 6 && panel; i++) {
        if (panel.getAttribute("role") === "tabpanel") break;
        panel = panel.parentElement;
      }
      if (!panel) return { found: false };
      const labelledby = panel.getAttribute("aria-labelledby");
      const trigger = labelledby ? document.getElementById(labelledby) : null;
      return {
        found: true,
        role: panel.getAttribute("role"),
        dataState: panel.getAttribute("data-state"),
        labelledby,
        triggerFound: !!trigger,
        triggerRole: trigger ? trigger.getAttribute("role") : null,
        triggerSelected: trigger ? trigger.getAttribute("aria-selected") : null,
        triggerText: trigger ? (trigger.textContent || "").trim() : null,
        triggerIdIsRadix: labelledby ? /^radix-/.test(labelledby) : false,
      };
    });
    // Measured live (r62a2/b2): the list sits inside the Radix tabpanel
    // — role=tabpanel, data-state=active, aria-labelledby pointing at
    // the Description trigger. The pin asserts the RELATIONSHIP (the
    // labelledby VALUE equals the referenced trigger's id), never the
    // literal Radix prefix (the id-format engine register: the
    // reference's radix-:r3: vs the clone's radix-_R-..._).
    expect(read.found).toBe(true);
    expect(read.role).toBe("tabpanel");
    expect(read.dataState).toBe("active");
    expect(read.triggerFound).toBe(true);
    expect(read.triggerRole).toBe("tab");
    expect(read.triggerSelected).toBe("true");
    expect(read.triggerText).toBe("Description");
    expect(read.triggerIdIsRadix).toBe(true);
    expect(read.labelledby).toBeTruthy();
  });

  test("P11: the description paragraph — the muted leading-relaxed sibling above the h3", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const cs = getComputedStyle(para);
      return {
        tag: para.tagName, cls: para.getAttribute("class") || "",
        color: cs.color, fontSize: cs.fontSize, lineHeight: cs.lineHeight,
        margin: cs.margin, fontWeight: cs.fontWeight,
      };
    });
    // Measured live (r62a2/b2): the paragraph above the features block
    // — the muted 16px/26px leading-relaxed copy with ZERO prose-plugin
    // margins (the dead-class register's computed proof: margin 0).
    expect(read.tag).toBe("P");
    expect(read.cls).toBe("text-muted-foreground leading-relaxed");
    expect(read.color).toBe("rgb(111, 111, 123)");
    expect(read.fontSize).toBe("16px");
    expect(read.lineHeight).toBe("26px");
    expect(read.margin).toBe("0px");
    expect(read.fontWeight).toBe("400");
  });

  test("P12: the vertical rhythm — the 16px paragraph->h3 gap and the 8px h3->list gap", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const gaps = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const pr = para.getBoundingClientRect();
      const hr = el.getBoundingClientRect();
      const lr = list.getBoundingClientRect();
      return {
        paraToH3: Math.round(hr.y - (pr.y + pr.height)),
        h3ToList: Math.round(lr.y - (hr.y + hr.height)),
      };
    });
    // Measured live (r62a/b): the block flow's spacing contract — the
    // h3's mt-4 (16px) over the ul, its mb-2 (8px) under the paragraph
    // (the ul's own margin 0). Pinned by the rect deltas (the
    // scroll-independent form).
    expect(gaps.paraToH3).toBe(16);
    expect(gaps.h3ToList).toBe(8);
  });

  test("P13: the @375 mobile pass — the h3 343x28, the list 343x120, the rows 343x24, the icon 16x16", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto(pdp, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const read = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let list = el.nextElementSibling;
      for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
      let para = el.previousElementSibling;
      for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
      if (!list || !para) throw new Error("key-features surface walk failed");
      const rr = (e: Element) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
      const svg = list.children[0].querySelector("svg");
      if (!svg) throw new Error("no icon svg in the first row");
      return { h3: rr(el), list: rr(list), row: rr(list.children[0]), icon: rr(svg), rows: list.children.length };
    });
    // Measured live on BOTH sites at 375 (r62a/b): the mobile geometry
    // byte-identical — the 343px content column (375 - 2x16 gutters),
    // the same 28/120/24 heights, the same 16px icon.
    expect(read.h3).toEqual({ w: 343, h: 28 });
    expect(read.list).toEqual({ w: 343, h: 120 });
    expect(read.row).toEqual({ w: 343, h: 24 });
    expect(read.icon).toEqual({ w: 16, h: 16 });
    expect(read.rows).toBe(4);
  });

  test("P14: the tab coupling — the Reviews swap hides the features list; Description restores it", async ({ page }) => {
    await page.goto(pdp, { waitUntil: "networkidle" });
    const reviews = page.getByRole("tab", { name: /^Reviews/ });
    const description = page.getByRole("tab", { name: "Description", exact: true });
    await reviews.scrollIntoViewIfNeeded();
    await reviews.click();
    await page.waitForTimeout(300);
    // The features list unmounts with the Description panel (Radix
    // removes the inactive panel from the layout — the r60 family's
    // content-side closure).
    let count = await page.evaluate(() => document.querySelectorAll("ul.space-y-2").length);
    expect(count).toBe(0);
    await expect(h3Loc(page)).toHaveCount(0, { timeout: 3000 });
    await description.click();
    await page.waitForTimeout(300);
    count = await page.evaluate(() => document.querySelectorAll("ul.space-y-2").length);
    expect(count).toBe(1);
    const restored = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(
        (x) => /^key features$/i.test((x.textContent || "").trim()) && x.children.length === 0
      );
      if (!el) throw new Error("the Key Features heading was not found");
      let panel: Element | null = el.parentElement;
      while (panel && panel.getAttribute("role") !== "tabpanel") panel = panel.parentElement;
      return { state: panel ? panel.getAttribute("data-state") : null };
    });
    expect(restored.state).toBe("active");
  });
});

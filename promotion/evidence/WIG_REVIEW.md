# Web Interface Guidelines review — condition 7

**Reviewed surface:** `QA_DOGFOOD/<feature-id>/gmail-magic-resend.html`, emitted by
`node bin/init.mjs qa <feature-id>` from `templates/gmail-magic-resend.html`. It
is the only file this package renders in a browser, so under the gate's reduced
variant it is the surface a stranger meets.

**Checklist source:** the Vercel Web Interface Guidelines, fetched from
<https://vercel.com/design/guidelines> on 2026-08-13. Reachable; the full
section list (Interactions, Animations, Layout, Content, Forms, Performance,
Design, and the Vercel-specific Copywriting section) was retrieved and every
section is dispositioned below.

**This is a review, not a score.** Lighthouse and axe are condition 8 and live in
`summary.json` / `lighthouse.json` / `axe.json`. They measure different things and
neither is quoted here as if it were a guideline review. Every row below names
the guideline, then the DOM measurement or screenshot that decided it. Numbers
come from `surface-measurements.json`, produced by `promotion/evidence/audit.mjs`.

---

## Major findings

Two. Both were **found by this review, fixed, and re-measured** — the before and
after numbers are from two runs of the same producer, either side of the edit.

### M1 — "Respect zoom" / "Mobile input size" (Interactions), "Responsive coverage" (Layout)

The page shipped no `<meta name="viewport">`, so a phone laid it out in Chrome's
legacy 980px desktop viewport and scaled the result down to fit. The page's own
body copy says "Open this from Gmail on desktop or phone", so mobile is claimed,
not out of scope.

| Measurement at 375×812, `isMobile: true` | Before | After |
|---|---|---|
| `document.documentElement.clientWidth` | 980 | **375** |
| `visualViewport.scale` | 0.383 | **1** |
| table text, computed × scale | 4.97 effective px | **13 effective px** |
| `scrollWidth − clientWidth` | 1 px | **0 px** |

Fix: one `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
No `maximum-scale` and no `user-scalable=no`, so pinch-zoom stays available —
that is the other half of "Respect zoom".

Screenshot: `screenshot-mobile-375.png` (after). This is the repo's open defect
**D2**, and this review closes it.

### M2 — "Minimum contrast" (Design)

The four action buttons drew white text on `#dc5f42`. Contrast computed inside
the page against the actual composited background: **3.65:1**, below the WCAG AA
threshold of 4.5:1 for text under 18.66px bold. Independently flagged by
axe-core 4.13 as `color-contrast`, impact **serious**, 4 nodes.

Fix: `#bd4a2a`, same hue family. Re-measured in-page: **5.03:1** on all four
buttons at all three widths. axe re-run: `color-contrast` gone.

---

## Moderate findings — fixed in the same pass

### N1 — "Semantics before ARIA", "Headings & skip link" (Content)

All page content sat in a bare `<div class="card">`. `landmarks` measured as
`[]`; axe reported `landmark-one-main` and `region`, both impact **moderate**.
A screen-reader user had no landmark to jump to.

Fix: the wrapper is now `<main class="card">` — a native element, no ARIA added.
`landmarks` now measures `["main"]`; both axe rules pass.

### N2 — "Set the appropriate color-scheme", "Browser UI matches your background" (Design)

The palette is a fixed warm light theme (`#fbf7ef` / `#fffaf3`) with no declared
scheme, so Chrome/Android forced-dark was free to invert it in the one place this
page is designed to be opened — a Gmail message on a phone.

Fix: `<meta name="color-scheme" content="light" />`. Measured after:
`metaColorScheme === "light"`.

---

## Minor findings — recorded, not fixed

These are real and they are minor. None blocks journey J4, and the gate asks for
no *major* unresolved finding, so they are listed rather than patched.

| # | Guideline | Measurement | Why it stays open |
|---|---|---|---|
| m1 | "Links are links" (Interactions), "No dead ends" (Content) | `deadHrefCount === 4` — all four buttons are `href="#"` | Deliberate empty state. The CLI scaffolds a packet; the page's own copy is "Fill links after capture, GIF, and MP4 generation." Filling them is the sender's step, and the placeholder is labelled. It becomes major the day a packet ships unfilled with no signal. |
| m2 | "Match visual & hit targets" (Interactions) | smallest interactive target **38 px** on its short axis (93×38 to 193×38) | Clears the WCAG 2.2 AA minimum of 24×24 CSS px; below the 44 px platform recommendation. Raising it changes the visual design of an email template for a 6 px gain. |
| m3 | "Prevent double-tap zoom on controls", "Tap highlight follows design" (Interactions) | no `touch-action` and no `-webkit-tap-highlight-color` in the stylesheet | Costs a ~300 ms tap delay on the four buttons. Worth doing next pass; not blocking. |
| m4 | "Inline help first" (Content) — SEO adjacent | `hasMetaDescription === false`; Lighthouse `meta-description` scores 0 | The page is opened from a link in an email body, never crawled. Lighthouse SEO 0.90 is entirely this audit. |

## Sections dispositioned as not applicable, with the reason

- **Animations** (10 guidelines) — the page has zero. Measured: `animationCount === 0`
  across all three widths; the stylesheet contains no `@keyframes` and no
  `transition`. `prefers-reduced-motion` has no subject.
- **Forms** (19 guidelines) — there is no form, no input, no `<select>`. Measured:
  `interactiveTargets` contains four `<a>` elements and nothing else.
- **Performance** (14 guidelines) — no scripts, no fonts, no images. Measured:
  `subresourceRefs === ["data:,"]`, the empty inline icon and nothing else, so
  every request this page makes over the network is the document itself.
  Preload / preconnect / subset / main-thread guidance has no subject. What can
  be measured is in condition 10: TBT 0 ms, max potential FID 16 ms, CLS 0.
- **Copywriting** (14 guidelines) — explicitly Vercel-specific house style
  ("Prefer `&` over `and`", Title Case headings). Not a general interface rule
  and not applied to a third-party product. Recorded as N/A rather than silently
  skipped.

## Guidelines checked and passing, with the measurement

- **Keyboard works everywhere** — 8 `Tab` presses observed, not read. Stops in DOM
  order: Open test link → Approve → Needs fix → Magic resend after fix → body →
  cycle. Every interactive element is reachable. `keyboard[]` in
  `surface-measurements.json`.
- **Clear focus** — every focused element reported
  `outline: auto 1px rgb(16, 16, 16)` and `matchesFocusVisible: true`. Nothing in
  the stylesheet removes the outline.
- **Accurate page titles** — `document.title === "<feature id> QA packet"`,
  substituted from the CLI argument.
- **Anchored headings** / heading order — `H1` then three `H2`, no level skipped.
- **All states designed** — the placeholder state is labelled everywhere it
  appears ("Fill links after capture…", "before / after / diff pending",
  "Replace this paragraph with the end-user impact").
- **Don't ship the schema** — table headings are "Component", "Proof",
  "Correction prompt", not field names.
- **No excessive scrollbars** / **Let the browser size things** —
  `horizontalOverflowPx === 0` at 1440, 768 and 375; the card is
  `max-width: 760px` and shrinks to 327 px on the phone.
- **Redundant status cues** — nothing is conveyed by colour alone; every button
  carries a text label.
- **Icons have labels** / **Icon-only buttons are named** — there are no icons.

## How to re-run this review

The measurements: `node promotion/evidence/audit.mjs` (writes every file in this
directory). The judgement: re-read the checklist at
<https://vercel.com/design/guidelines> against `surface-measurements.json` and
the three screenshots. A reviewer who disagrees with a severity call has the same
numbers this one had.

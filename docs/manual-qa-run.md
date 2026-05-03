# Lunedoc — Manual QA Run Guide

**Read this once, then run it.** Targeted at the bits of QA a headless probe can't cover. Estimated time: **~15 minutes** end to end. Pair it with `docs/ui-qa-checklist.md` for the full scope; this file is the *operating procedure* for the human-side run.

---

## Setup

```bash
# from repo root, in a terminal you can leave running:
python3 -m http.server 8765
```

Open `http://localhost:8765/` in a real browser (Chrome, Firefox, or Safari — preferably Chrome, since DevTools is what the rest of this doc assumes).

Open DevTools (`F12` or `Ctrl+Shift+I` / `⌥⌘I`):
- **Console** tab — keep visible while you walk the canvas.
- **Network** tab — second priority; check after first load and once after each Tweaks change.

The floating control with the brand pill icon at the bottom-right is the **Tweaks panel**. Open it and keep it open. Every check below is driven by toggling something in this panel and observing the canvas.

---

## 1. Console & network baseline (1 min)

Before changing anything, on first load:

- [ ] **Console:** zero red errors. One yellow warning is acceptable (`You are using the in-browser Babel transformer…` — this is the standard Babel-standalone advisory).
- [ ] **Network:** every JSX file, `tokens.css`, `.design-canvas.state.json`, and the React/Babel CDNs return **200**. The only acceptable 4xx is `favicon.ico` 404 (we haven't added one).
- [ ] No requests to `paperline.app`, `*.anthropic.com`, or other unexpected origins.

**If something fails here, stop and report.** Everything below assumes a clean baseline.

---

## 2. Dark mode (2 min)

- [ ] Tweaks → **Theme → Dark**.
- [ ] Walk every section. Look for:
  - Text contrast against dark surfaces (body copy must stay readable).
  - Card borders visible but not harsh.
  - Tool preview pages (mock PDF pages in Watermark/Sign/Edit/OCR) **stay light** — they represent paper, not UI.
  - Logo glyph stays white-on-accent. The "L" must remain crisp.
  - ChromeWindow tab bar and traffic lights look intentional, not broken.
- [ ] Tweaks → **Theme → Light** to return to baseline.

**Common failure mode:** a card or chip that uses a hard-coded color (e.g. `#fff`) instead of a token like `var(--bg-elev)` will look glaringly wrong in dark mode. Note the artboard + element if you find one.

---

## 3. Accent presets (3 min)

Cycle Tweaks → **Accent** through all five: **indigo → blue → emerald → graphite → amber**, returning to indigo at the end.

For each accent, glance at:
- Homepage hero CTA (primary button color shifts).
- Any tool page (badge color shifts).
- Pricing page (popular plan ring shifts).
- Dashboard (active nav indicator shifts).

Watchpoints:
- [ ] **Emerald:** doesn't clash with the OCR "Ready to run" status chip (also greenish).
- [ ] **Graphite:** primary buttons are still recognizable as primary, not as ghost buttons.
- [ ] **Amber:** doesn't accidentally read as a warning state. Check OCR confidence chip and Edit color swatches for collisions.
- [ ] Tool tile category tones (Compress=teal, Convert=blue, Edit-family=purple, Security=orange) **do not** shift with the global accent — those are per-category, not global.

Return to **indigo** when done.

---

## 4. EN / TR / ES locale switching (3 min)

Tweaks → **Locale** → cycle through **EN → TR → ES → EN**.

For each locale:
- [ ] Walk the homepage, one tool page, pricing, and the auth page. (Article copy is intentionally hardcoded — do not flag.)
- [ ] Confirm strings actually swap (header nav items, hero text, CTAs, footer copy).

Watchpoints (TR and ES strings tend to be longer than EN):
- [ ] **Header nav** (Tools / Pricing / Blog / Docs + sign-in + CTA) doesn't wrap to a second line.
- [ ] **Hero CTAs** (`Drop a PDF…` / `Browse all tools`) sit on one line at desktop widths.
- [ ] **Pricing CTAs** fit inside their pill buttons.
- [ ] **Footer columns** don't overlap on mobile.
- [ ] **Auth page testimonial** wraps cleanly (TR/ES quote is longer than EN).

If a label clips, note: *which artboard, which locale, which element*.

---

## 5. Mobile artboards (2 min)

Find the mobile artboards in section 03 (Tool variants), 04 (Tools index), 05 (Pricing), 06 (Auth), 07 (Dashboard), 08 (Blog). They render inside an iPhone-shaped frame.

- [ ] Pick three at random, zoom in on the canvas (trackpad pinch / mouse wheel + Ctrl), and confirm:
  - **No element extends past the right edge** of the 390px phone viewport.
  - Long file names truncate with ellipsis (Sign / OCR / Edit document strips).
  - Tool widget controls wrap rather than push the layout.
  - Preview cards in OCR / Edit / Sign / Watermark **stack vertically** (not side-by-side).
- [ ] Confirm the **outer page** itself never horizontally scrolls. (DevTools → Elements → look at `<html>` for a horizontal scrollbar — there shouldn't be one.)

---

## 6. Tool interactions (4 min)

The headless probe confirmed all 8 tool components mount cleanly. These click-driven flows are what's left to verify by hand. Pick the desktop artboard for each.

### 6.1 Watermark (`tool-watermark`)
- [ ] Type into the **Text** field. The watermark text in the right preview updates **live** as you type.
- [ ] Click each cell in the **3×3 position grid**. The watermark glyph in the preview moves to that position.
- [ ] Drag the **Opacity** slider. The preview's watermark fades in/out smoothly.
- [ ] Click the **0° / 30° / 45°** segmented buttons. The watermark rotates in the preview.
- [ ] Switch **Apply to → Selected pages**. A page-input field appears below.

### 6.2 Sign (`tool-sign`)
- [ ] Click each method tab — **Draw / Type / Upload**. Each shows a different control panel.
- [ ] In **Type** mode, type a name. The signature in the preview updates.
- [ ] Click each of the three style cards (**Signature / Classic / Modern**). Font + slant changes.
- [ ] Click each field type (**Signature / Initials / Date / Text**). The preview's field box content changes accordingly.

### 6.3 OCR (`tool-ocr`)
- [ ] Click the **Auto-detect / EN / TR / ES** language tiles. The active state shifts.
- [ ] With OCR language = **Auto** and Tweaks locale = **TR**, the recognized-text pane shows a **Turkish** invoice sample. Same for **ES**.
- [ ] With OCR language = **EN**, the recognized-text pane shows the **English** sample regardless of UI locale.
- [ ] Click **Extract text** vs **Searchable PDF**. The faux editor's filename header swaps between `.txt` and `.pdf`.

### 6.4 Edit PDF (`tool-edit`)
- [ ] Click each of the four tool modes (**Add text / Highlight / Redact / Shape**). The selection ring + 4 drag handles in the preview move to whichever overlay element matches the active mode.
- [ ] In **Add text** mode, type into the text input. The top-right callout in the preview updates live.
- [ ] Click each color swatch. The active swatch shows a check; the highlight stripe and shape stroke colors update accordingly.
- [ ] Toggle **Outline / Solid** stroke. The shape rectangle in the preview swaps fill/border style.
- [ ] Click the page stepper **◀ / ▶**. The "1 / 7" counter updates; buttons disable at boundaries.

---

## 7. Logo / brand consistency (1 min)

Walk through quickly with a fresh eye:

- [ ] Header on every artboard reads **Lunedoc** with the geometric **L** glyph in the accent square.
- [ ] Footer copyright reads "© 2026 Lunedoc. …" (matches active locale).
- [ ] System inventory page (section 09) hero reads **"The Lunedoc system, one page"**.
- [ ] Every desktop browser-window URL bar shows **`lunedoc.app/...`**, never `paperline.app/...`.
- [ ] No "P" glyph anywhere user-visible.

---

## 8. Accepted exceptions (do not flag)

These are intentional and not bugs. If you see them, **do not** add them to your findings:

- **Article editorial content** in the Blog artboards (hand-written, EN-only).
- **System-inventory documentation labels** (intentionally English-only).
- **Mock filenames, sizes, timestamps, page counts** in every tool's document strip (`scanned-invoice.pdf`, `1.8 MB`, `May 02, 2026`, etc.).
- **Pricing values and currency symbols** ($9 / $19 / Custom, /month).
- **Brand name** "Lunedoc" hardcoded in `primitives.jsx` — by design.
- **Design-canvas section titles and Tweaks panel labels** ("Theme", "Accent", "Layout") — internal tooling, not user-facing.
- **Mock invoice content** in the OCR recognized-text pane — intentional per-language sample.
- **Internal `paperline-canvas-v1`** localStorage namespace string in `app.jsx:81` — internal, never visible.
- **2–8px element-level overflows in the recognized-output editor, the article header meta line, the slider value rows, the typed-signature preview, and the ChromeTab title** — font-fallback artifacts visible only when Inter isn't installed locally. If you have Inter, you won't see these. (See `docs/ui-qa-checklist.md` QA pass header for details.)

If you see something *else* that looks broken, that's a real finding.

---

## 9. Recording your findings

When you're done:

1. Open `docs/ui-qa-checklist.md` and scroll to the bottom — the **QA pass sign-off** table.
2. Append a new row:
   - **Date:** today's date.
   - **Tester:** your name.
   - **Result:** `pass` / `pass with notes` / `fail`.
   - **Notes:** one sentence, e.g. "no findings", or "TR pricing CTA clips at desktop ≥ 1280px".
   - **Follow-up issue:** GitHub issue link or `—`.
3. If anything failed, file an issue with: artboard id, locale, theme, accent, browser, exact element. Then ping me — I'll cut a `fix(ui): …` commit.
4. If everything passes, the QA gate is fully green and Phase 2 of `docs/frontend-migration-plan.md` is unblocked.

---

*Re-run this guide whenever a tool page, the design system, `tokens.css`, or `i18n.jsx` changes.*

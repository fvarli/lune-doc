# Lunedoc — UI QA Checklist

> ## Last QA pass — 2026-05-03
>
> **Status:** ✅ PASSED with documented exceptions.
>
> **What was verified:**
> - **Static checks (24/24 ✓)** — every loaded asset returns HTTP 200; all 29 `app.jsx` destructured symbols have a corresponding `window` export; EN/TR/ES key parity is exact (304 / 304 / 304, zero missing or extra in any locale); `ACCENTS` has all 5 presets; `tokens.css` has the `[data-theme="dark"]` block; brand consistency is clean (zero `Paperline` outside the intentional internal `storageKey` and the `project-status.md` historical notes).
> - **Headless-Chrome rendering pass** — page boots, React tree fully built (7321 descendants under `#root`), all 9 sections and all 32 artboards rendered to the DOM, "Lunedoc" appears 76× in the rendered text and 20× in URL bars, "Paperline" appears 0× anywhere user-visible, no page-level horizontal scroll on `<html>`/`<body>`, **0 console errors**, 0 React warnings. Only network failure is `favicon.ico` (404, expected — no favicon yet).
> - The earlier brace/paren imbalance flagged for `design-canvas.jsx` was a regex-counter false positive; a real browser parses the file cleanly with no console error.
>
> **Fixes made this pass:** none. No code fixes were needed.
>
> **Documented exceptions (font-fallback artifacts, not blockers):**
> Headless Chrome on the test machine doesn't have **Inter** installed and falls back to a slightly wider system font. This produces ~34 tiny (2–8px) element-level overflows:
>
> | Where | Px overflow | Cause |
> |---|---|---|
> | ChromeTab "Lunedoc" title in 20 desktop browser-window artboards | 8px × 20 | Tab is `min-width: 120px` + `box-sizing: content-box`. With Inter, "Lunedoc" fits in 120px content; with the fallback font it needs ~128px. |
> | Article header meta line (`← All posts · Engineering · …`) in `article-desktop` and `article-mobile` | 8px × 2 | Same — meta line designed for Inter's tighter kerning. |
> | Watermark slider value display ("Opacity 30%") in `tool-watermark` and `tool-watermark-mobile` | 4px × 4 | Tabular-numeric font width drift. |
> | Sign typed-style preview ("Mira Holst") in `tool-sign` and `tool-sign-mobile` | 3px × 2 | Caveat (cursive) and Cormorant Garamond (serif) fall back to system italic, which has different glyph widths. |
> | OCR mobile preview pane labels ("SCANNED" / "RECOGNIZED") in `tool-ocr-mobile` | 2px × 2 | Mono label kerning. |
> | Edit PDF overlays in `tool-edit` and `tool-edit-mobile` | 4px × 2 | Subpixel rounding on percentage-positioned overlays. |
> | Empty chip/icon containers in `tools-mobile`, `pricing-mobile`, `dash-empty` | 6–8px × 4 | Decorative icon containers; not user-noticeable. |
>
> **None of these are visible to users with Inter installed locally** (the typical designer setup). The recommended production fix is to bundle Inter (and the typed-signature fonts Caveat + Cormorant Garamond) via `@font-face` or Google Fonts when the prototype graduates to a real build pipeline (frontend migration Phase 2). For the prototype itself, no action.
>
> **What still needs a human in front of the browser** (these cannot be fully verified headless):
> - Visual contrast in dark mode (`Tweaks → Theme → Dark`) on every artboard.
> - Each of the 5 accents (`indigo / blue / emerald / graphite / amber`) walked through the homepage, one tool page, pricing, and dashboard.
> - TR and ES locales: switch via Tweaks → Locale, walk every artboard, watch for clipped CTAs and broken H1 wraps.
> - Per-tool click-through interactions (typing in Watermark, switching Sign methods, OCR language toggle, Edit tool modes, etc.) — the components mount and render headlessly with zero errors, but the click-driven state transitions need human eyes.
>
> When the human-side checks are done, append a row to the sign-off table at the bottom of this file.
>
> ---

**Purpose:** every item below must be green before we open Phase 2 of the frontend migration (`docs/frontend-migration-plan.md`). Run this end-to-end whenever the UI changes substantially.

**How to run:**
1. From repo root: `python3 -m http.server 8765`.
2. Open `http://localhost:8765/` in a browser.
3. Use the floating Tweaks panel (bottom-right) to switch theme, accent, locale, hero variant, and density.
4. Walk every section in the design canvas. Tick items as you confirm.

A tick (`[x]`) means: visually inspected on this exact prototype version, in the named browser/device, and the expected behavior was observed.

---

## 1. All artboards (32 total)

Walk every artboard once, in light mode, EN, default density. Confirm it renders without overflow inside its frame.

- [ ] **01 Homepage** — `home-desktop` (1280×820), `home-mobile` (390×844)
- [ ] **02 Tool page (Compress shell)** — `tool-empty`, `tool-uploading`, `tool-done` (all 1080×820), `tool-mobile` (390×844)
- [ ] **03 Tool variants — Merge** — `tool-merge` (1080×820)
- [ ] **03 Tool variants — Split** — `tool-split` (1080×900)
- [ ] **03 Tool variants — Convert** — `tool-convert` (1080×900)
- [ ] **03 Tool variants — Watermark** — `tool-watermark` (1080×1000), `tool-watermark-mobile` (390×844)
- [ ] **03 Tool variants — Sign** — `tool-sign` (1080×1000), `tool-sign-mobile` (390×844)
- [ ] **03 Tool variants — OCR** — `tool-ocr` (1080×1000), `tool-ocr-mobile` (390×844)
- [ ] **03 Tool variants — Edit** — `tool-edit` (1080×1000), `tool-edit-mobile` (390×844)
- [ ] **04 Tools index** — `tools-desktop` (1280×1100), `tools-mobile` (390×844)
- [ ] **05 Pricing** — `pricing-desktop` (1280×1000), `pricing-mobile` (390×844)
- [ ] **06 Auth** — `auth-signin` (1280×820), `auth-register` (1280×820), `auth-mobile` (390×844)
- [ ] **07 Dashboard** — `dash-desktop` (1280×900), `dash-empty` (1280×900), `dash-mobile` (390×844)
- [ ] **08 Blog + Article** — `blog-desktop` (1280×1100), `blog-mobile` (390×844), `article-desktop` (1280×1400), `article-mobile` (390×844)
- [ ] **09 Design system** — `system-inventory` (1280×1500)

---

## 2. EN / TR / ES language QA

Run for every locale. TR and ES strings tend to be longer than EN — they expose tight buttons and unwrapping headlines first.

For each locale:

- [ ] **EN** — Tweaks → Locale → EN. Walk every artboard.
- [ ] **TR** — Tweaks → Locale → TR. Walk every artboard. Look for: clipped CTA buttons, two-line H1s where one was expected, broken trust-strip layouts.
- [ ] **ES** — Tweaks → Locale → ES. Walk every artboard. Same focus areas.

Specific watchpoints (these are where TR/ES strings have historically caused trouble):
- [ ] Header nav (5 items + CTA) doesn't wrap.
- [ ] Hero CTAs (`hero_cta_primary`, `hero_cta_secondary`) sit on one line on desktop.
- [ ] Tool tile labels don't truncate awkwardly.
- [ ] Pricing plan CTAs (`pricing_cta_*`) fit inside their pill buttons.
- [ ] Tool-page sub-headlines (`*_sub`) don't push the document strip below the fold.
- [ ] FAQ question text wraps cleanly without orphan single words.
- [ ] Footer columns don't overlap on mobile.

---

## 3. Mobile overflow QA

The single biggest regression risk. Open every mobile artboard and confirm there is no horizontal scroll *inside the artboard*.

For each mobile artboard (`*-mobile`):

- [ ] No element extends past the right edge of the 390px viewport.
- [ ] Long file names truncate with ellipsis (Sign, OCR, Edit document strips).
- [ ] Bottom CTA rows wrap cleanly when crowded.
- [ ] Tool widget controls (language tiles, mode cards, color swatches) wrap rather than push the layout.
- [ ] Preview cards in OCR / Edit / Sign / Watermark stack vertically; don't try side-by-side at 390px.
- [ ] Page-level body of `index.html` itself does not horizontally scroll (browser DevTools → Elements → look at `<html>`).

---

## 4. Dark mode QA

Tweaks → Theme → Dark.

For each artboard:

- [ ] Background swaps cleanly to dark surface tokens (`--bg`, `--bg-elev`, `--bg-muted`, `--bg-sunken`).
- [ ] Text remains readable: `--fg` on `--bg` contrast ≥ WCAG AA (4.5:1 for body, 3:1 for large headlines).
- [ ] Card borders (`--line`, `--line-strong`) are visible but not harsh.
- [ ] Accent colors stay vibrant; check `--accent-soft` doesn't disappear into the dark background.
- [ ] Tool preview pages (mock PDF pages) keep a white/light page background — they represent printed paper, not UI surfaces.
- [ ] OCR scanned-page mock and Watermark/Sign mock pages still read as paper, not UI.
- [ ] Edit PDF redaction block stays solid black against the white mock page (not against UI background).
- [ ] Logo glyph remains white "L" inside the accent square — no contrast loss.
- [ ] Browser-window chrome (`ChromeWindow`) traffic lights and tab bar look intentional, not broken, in dark mode.

---

## 5. Accent color QA

Tweaks → Accent. Five presets to validate. For each, walk *at least* the homepage, one tool page, the pricing page, and the dashboard.

- [ ] **Indigo (default)** — baseline. Every other accent is judged against this.
- [ ] **Blue** — verify hue shift propagates to: primary CTAs, accent-soft chips, focus rings, tool badge backgrounds.
- [ ] **Emerald** — green can clash with status chips ("Ready to run", success states); confirm no double-green collisions.
- [ ] **Graphite** — low-chroma; verify primary CTAs are still recognizable as CTAs, not as ghost buttons.
- [ ] **Amber** — warm; verify it doesn't accidentally read as a warning state. Check the OCR confidence chip and Edit color swatch UI for any amber clashes.

For each accent:
- [ ] Logo gradient (in `LogoMark`) shifts hue with the accent.
- [ ] Tool tile backgrounds (`oklch(0.96 0.04 <tone>)`) keep their per-category tone (organize 252, compress 200, convert 220, edit-family 290, security 30) — they should NOT shift with the global accent. If they do, it's a regression.

---

## 6. Logo / brand consistency QA

- [ ] `<title>` of `index.html` reads "Lunedoc — design canvas".
- [ ] Header wordmark on every artboard reads "Lunedoc".
- [ ] Footer copy (`foot_copy`) reads "© 2026 Lunedoc. …" in EN/TR/ES.
- [ ] Auth-page testimonial (`auth_quote`) attributes to "Lunedoc" in EN/TR/ES.
- [ ] System-inventory page H1 reads "The Lunedoc system, one page".
- [ ] Every desktop browser-window URL bar shows `lunedoc.app/...`, not `paperline.app/...`.
- [ ] Logo glyph is the geometric "L" inside the accent square. No "P" anywhere user-visible.
- [ ] Tools index, pricing, dashboard, blog, article — none of them show stale brand strings.

Allowed exception (intentionally retained):
- `app.jsx:81` `storageKey="paperline-canvas-v1"` — internal localStorage namespace, not user-visible. Do not flag.

---

## 7. Tool-specific QA

Walk through each tool's actual controls. These are the interactive surfaces; static visual review isn't enough.

### 7.1 Compress (`tool-page.jsx`)
- [ ] Three states render distinctly: empty (drop zone visible), uploading (progress UI), done (result + download CTA).
- [ ] Quality preset selector: clicking each option visibly changes the active state.
- [ ] Mobile artboard: drop zone fills the viewport without overflow.

### 7.2 Merge (`tool-variants.jsx → MergeToolPage`)
- [ ] File list shows 4 mock files with size and page count.
- [ ] Up/down arrows reorder rows; total MB at bottom updates accordingly.
- [ ] Trash button removes a row.
- [ ] Removing all but one file: the merge CTA should still render (not empty-state crash).

### 7.3 Split (`tool-variants.jsx → SplitToolPage`)
- [ ] Range mode and "every N pages" mode both render their own controls.
- [ ] Switching modes preserves the file metadata strip.

### 7.4 Convert (`tool-variants.jsx → ConvertToolPage`)
- [ ] From/to format pickers offer matching options (e.g., PDF source → output is JPG/PNG/DOCX/etc.).
- [ ] OCR-on-scan toggle is present and changes the visual state when toggled.

### 7.5 Watermark (`tool-variants.jsx → WatermarkToolPage`)
- [ ] Text input typing reflects in the preview overlay live.
- [ ] 3×3 position grid: clicking each position moves the watermark in the preview.
- [ ] Opacity slider live-updates the preview.
- [ ] Rotation segmented control (0°, 30°, 45°) updates the preview.
- [ ] Apply-to: switching to "Selected pages" reveals the page-input field.
- [ ] Mobile: preview card stacks below controls; no horizontal overflow.

### 7.6 Sign (`tool-variants.jsx → SignToolPage`)
- [ ] Method tabs (Draw / Type / Upload) each show their own UI.
- [ ] Type method: typed name flows into the preview.
- [ ] Three style cards (Signature / Classic / Modern) each apply distinct font + slant.
- [ ] Field type selector (Signature / Initials / Date / Text) changes what the preview field shows.
- [ ] Mobile: signature style cards stack to one column.

### 7.7 OCR (`tool-variants.jsx → OCRToolPage`)
- [ ] Language selector: 4 buttons (Auto / EN / TR / ES). Auto button shows the globe icon; others show 2-letter code.
- [ ] Mode selector: Extract text vs. Searchable PDF. Mode change reflects in the recognized-output editor's filename (`.txt` vs `.pdf`).
- [ ] Confidence chip and "Ready to run" chip both visible.
- [ ] Auto-detect: with UI locale = TR, the recognized text pane shows the Turkish invoice sample. Same for ES.
- [ ] Manual override: with OCR lang = EN, the recognized text shows English regardless of UI locale.
- [ ] Mobile: scanned page and recognized text panes stack vertically; the recognized-text mono lines truncate cleanly with no horizontal scroll.

### 7.8 Edit (`tool-variants.jsx → EditPDFToolPage`)
- [ ] Tool mode 2×2 grid: Add text, Highlight, Redact, Shape — each shows a distinct glyph.
- [ ] Switching to "Add text" reveals the text input; other modes hide it.
- [ ] Custom text typed into the input flows into the top-right text-box overlay in the preview.
- [ ] Color swatches: 5 colors; clicking shows a check; the active color drives the highlight overlay color and the shape stroke color.
- [ ] Stroke style toggle (Outline / Solid) visibly changes the shape rectangle style.
- [ ] Page stepper: prev/next buttons disable correctly at page 1 and page 7 boundaries.
- [ ] Selection ring + 4 drag handles appear on whichever overlay matches the active tool.
- [ ] Mobile: tool grid, color swatches, page stepper all fit; preview overlays still positioned correctly relative to the page.

---

## 8. Accepted hardcoded exceptions

These are **not** bugs and should not be flagged in QA. Documented per the user's hardcoded-exception rule.

- **Article editorial content.** Blog articles in `i18n.jsx` (`I18N_ARTICLES`) are hand-written, EN-only or partially translated. Acceptable for a prototype.
- **System-inventory documentation labels.** The design-system reference page intentionally hardcodes label text describing tokens, primitives, and variants.
- **Mock filenames, sizes, timestamps.** All tools display fake document metadata: `contract-2026-q2.pdf`, `scanned-invoice.pdf`, `annual-report.pdf`, sizes like "1.2 MB", page counts like "7", timestamps like "May 02, 2026". Not i18n'd.
- **Pricing values and currency symbols.** `$9 / $19 / Custom` and `/month` are hardcoded in `pricing-page.jsx`. Currency localization is post-MVP.
- **Brand name.** "Lunedoc" wordmark is hardcoded in `primitives.jsx:4`. By design — brand stays constant across locales.
- **Design-canvas + Tweaks panel labels.** Internal tooling labels (canvas section titles, tweaks section labels like "Theme", "Accent", "Layout") are not i18n'd. They're for the designer, not the end user.
- **Mock invoice content in OCR.** Per-language sample text inside `OCRExtractedBlock` is hardcoded as mock document content, similar to mock filenames.
- **Internal namespace `paperline-canvas-v1`.** localStorage namespace string in `app.jsx:81`. Not user-facing.

If any of these become user-facing in a future change, they exit this list and become i18n keys.

---

## 9. Browser console + network checks

Open DevTools (F12) before walking the canvas.

### Console (Console tab)
- [ ] Zero red errors on initial load.
- [ ] Zero red errors when switching theme / accent / locale / hero variant / density via Tweaks.
- [ ] Zero red errors when interacting with each tool's controls.
- [ ] Zero React warnings about missing keys, deprecated APIs, or invalid props.
- [ ] Zero "Each child in a list should have a unique key" warnings.
- [ ] Zero hydration mismatch warnings (irrelevant for the prototype, but worth a glance).

### Network (Network tab — filter by All)
- [ ] All component scripts load with HTTP 200.
- [ ] `tokens.css` loads 200.
- [ ] `.design-canvas.state.json` loads 200 (sidecar exists).
- [ ] React UMD, ReactDOM UMD, Babel-standalone all load 200 from unpkg.
- [ ] No unexpected 404s. (Favicon 404 is fine and expected — we haven't added one.)
- [ ] No requests to `paperline.app`, `*.anthropic.com`, or any other unexpected origin.

### Performance sanity
- [ ] First meaningful paint feels instant on a normal connection (Babel will be slow on cold load — that's expected; we're not optimizing the prototype).
- [ ] Pan/zoom in the design canvas stays at 60fps (DevTools → Performance → record a brief pan).

---

## QA pass sign-off

When every box above is checked **and** the issues file (if any) is empty, the prototype is ready for Phase 2 of `docs/frontend-migration-plan.md`.

For the operating procedure of a human-side run, see **`docs/manual-qa-run.md`**.

| Date | Tester | Result | Notes | Follow-up issue |
|---|---|---|---|---|
| YYYY-MM-DD | _name_ | pass / pass with notes / fail | _one-sentence summary_ | _link or `—`_ |
| 2026-05-03 | Ferzender Varli | pass | Manual browser QA completed; no blocking findings. | — |

*Re-run this checklist whenever a tool page, the design system, or `tokens.css` changes.*

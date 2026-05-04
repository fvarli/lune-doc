# Lunedoc — Phase 7: `apps/marketing` Scaffold Plan

**Status:** ✓ DONE (2026-05-03), then **SUPERSEDED 2026-05-05**. The Astro `apps/marketing` app described below was deleted as part of the frontend consolidation (`docs/project-status.md` §8 R6, decision D10). The 25 SEO landing routes were re-implemented inside `apps/web` as React Router routes, with a `tsx scripts/prerender.ts` post-build step that writes the same per-route static HTML (title, meta, canonical, hreflang × 4, 4 JSON-LD blocks). Honesty-clause copy and per-locale FAQ/HowTo data tables were preserved verbatim. **This document is kept for historical context only — anything below referring to `apps/marketing/` no longer reflects the live tree.**

**Companion docs:**
- `docs/seo-tool-page-template.md` — the production template each `/<tool>-pdf` page must implement.
- `docs/phase-3-ui-package-plan.md` / `docs/phase-4-i18n-package-plan.md` / `docs/phase-6-tool-widget-port-plan.md` — the three packages this phase consumes.
- `docs/frontend-migration-plan.md` — long-term outline.

---

## 1. Scope of Phase 7

Build the **public marketing surface** at `lunedoc.app` (Astro static site) — homepage, eight tool landing pages (`/<tool>-pdf`), pricing, blog. The widgets ported in Phase 6 hydrate as React islands inside the static landing pages.

In scope for this phase:
- Astro workspace at `apps/marketing/` (✓ scaffolded).
- EN/TR/ES routing per `docs/seo-tool-page-template.md` §1.
- Eight tool landing pages, each consuming the matching `@lunedoc/tools` widget as a `client:load` island.
- `Header` / `Footer` (from `@lunedoc/ui`) on every page, fed by `lang` derived from the URL prefix.
- JSON-LD blocks per `docs/seo-tool-page-template.md` §11 (`SoftwareApplication`, `FAQPage`, `HowTo`, `BreadcrumbList`).
- `hreflang` link tags on every locale variant.

Out of scope for this phase:
- Backend implementation (tools stay as client-side mocks — same as `apps/web`).
- Real PDF processing.
- Pricing / blog / article pages — those come after the 8 tool pages land.
- Storybook for marketing layouts. Defer.
- A11y deep audit. Defer.
- Performance budget enforcement (Lighthouse CI). Defer.

---

## 2. Stack and architecture

| Layer | Choice |
|---|---|
| Framework | **Astro 6.x** (static, no SSR runtime) |
| UI runtime | **React 19** islands via `@astrojs/react` |
| Language | **TypeScript** (strict, extends workspace base) |
| Styling | Inline styles + design tokens from `@lunedoc/ui/tokens.css` (same as `apps/web`) |
| i18n | URL-prefix routing (`/`, `/tr/...`, `/es/...`); strings via `@lunedoc/i18n`'s `useI18n(lang)` hook inside React islands; static labels in `.astro` files via direct lookup against `I18N_STRINGS` |
| Output | `astro build` produces a static `dist/` (no Node runtime needed in prod) |
| Deploy | Any static host (Cloudflare Pages, Netlify, Vercel static, plain S3 + CloudFront). Choice deferred. |

The Astro pages contain three kinds of content:

1. **Static HTML** — header/footer SSR'd from React via `client:idle` (or no client directive at all if not interactive), hero text, FAQ markup, JSON-LD `<script>` blocks. Crawlable; doesn't ship JS.
2. **One React island per tool page** — the matching `<MergeToolPage>` / `<OCRToolPage>` / etc. from `@lunedoc/tools`, hydrated `client:load`. This is the actual interactive widget.
3. **Shared layouts** — a `ToolHeroLayout.astro` consumed by every tool page, taking title / description / FAQ / how-to / related-tools as props.

Total ~9 unique pages × 3 locales = 27 static HTML files at full coverage.

---

## 3. URL pattern

Per `docs/seo-tool-page-template.md` §1:

| Surface | Path |
|---|---|
| EN home | `/` |
| EN tool | `/<tool>-pdf` |
| TR home | `/tr/` |
| TR tool | `/tr/<tool>-pdf` |
| ES home | `/es/` |
| ES tool | `/es/<tool>-pdf` |
| Slugs | always lowercase, always end in `-pdf` |
| Trailing slash | never (Astro handles this) |

Astro file mapping: `src/pages/index.astro` → `/`, `src/pages/[lang]/index.astro` → `/tr/` and `/es/` via `getStaticPaths`. Per-tool: `src/pages/<tool>-pdf.astro` and `src/pages/[lang]/<tool>-pdf.astro`.

`hreflang` link tags emitted in a shared `<BaseHead>` partial.

---

## 4. Workspace dependency usage

`apps/marketing/package.json` declares (committed):

```json
{
  "dependencies": {
    "@lunedoc/ui": "workspace:*",
    "@lunedoc/i18n": "workspace:*",
    "@lunedoc/tools": "workspace:*",
    "@astrojs/react": "^5.0.4",
    "astro": "^6.2.1",
    "react": "^19.2.5",
    "react-dom": "^19.2.5"
  }
}
```

How each is used:

| Package | Role in marketing |
|---|---|
| `@lunedoc/ui` | `Header`, `Footer`, `MobileBottomNav`, `Logo`, `Icon`, `ToolCard`, `PdfThumb`, `LangSwitch`. Plus `tokens.css` imported once into the global page chrome. |
| `@lunedoc/i18n` | `useI18n(lang)` inside React islands; `I18N_STRINGS` for static-context lookups in `.astro` files (e.g. SEO titles). |
| `@lunedoc/tools` | The eight tool widgets, one per landing page. Hydrated `client:load`. |

The Astro shell never reaches into prototype files. Same hard rule as Phase 2–6.

---

## 5. First landing page recommendation

After this scaffold, the next concrete deliverable is **one production-shape tool landing page** that proves the full template flow end-to-end. Two strong candidates:

- **OCR PDF** (`/ocr-pdf`) — recommended. The tool-page template's filled example in `docs/seo-tool-page-template.md` §13 is OCR. We have the i18n strings (`ocr_*`), the widget (`OCRToolPage`), the FAQ outline. Building OCR first means the example doc and the rendered output match — strongest forcing function for the template.
- **Watermark PDF** (`/watermark-pdf`) — alternative. Smaller widget, simpler interaction, fewer FAQ ambiguities. Faster to ship but doesn't validate the template's heaviest case.

**Recommendation: OCR first.** If the template has any rough edges, OCR will surface them immediately. Watermark/Sign/Edit follow with smaller diffs once the layout is locked.

---

## 6. Acceptance criteria

For the **scaffold step** (this commit) — all green ✓:

- [x] `apps/marketing/` exists with valid Astro config.
- [x] `pnpm install` resolves `@lunedoc/ui`, `@lunedoc/i18n`, `@lunedoc/tools` symlinks into `apps/marketing/node_modules/@lunedoc/`.
- [x] `pnpm --filter @lunedoc/marketing build` produces `apps/marketing/dist/index.html` with the real Lunedoc Logo SVG inlined and a `<astro-island client="load">` wrapper — proves React-island hydration is wired.
- [x] `pnpm --filter @lunedoc/web build` still succeeds (regression gate).
- [x] Prototype `http://localhost:8765/` still returns 200; `docs/components/`, `docs/stylesheets/`, `index.html`, `.design-canvas.state.json` all clean.
- [x] Root `package.json` exposes `marketing:dev` and `marketing:build` scripts.
- [x] Astro dev server uses port **4321** (default), no collision with prototype's 8765 or `apps/web`'s 5173.

For **each subsequent tool landing page**, all of the following must be green before merging the page's PR:

- [ ] **TS clean.** `astro check` (= `tsc --noEmit` for `.astro` + `.tsx`) passes.
- [ ] **Build clean.** `pnpm --filter @lunedoc/marketing build` succeeds without warnings.
- [ ] **JSON-LD valid.** Each emitted `<script type="application/ld+json">` block validates as JSON and matches the shape in `docs/seo-tool-page-template.md` §11. Optional: gate via Schema.org validator in CI.
- [ ] **Tool widget hydrates.** Loading the page in a browser shows the widget become interactive after `client:load` fires (state changes work, no console errors).
- [ ] **i18n complete.** EN, TR, ES variants all render their respective copy. No raw keys leak.
- [ ] **`hreflang` correct.** All 3 locale variants link to each other plus an `x-default` pointer.
- [ ] **Prototype + `apps/web` untouched.** Same regression gate as Phase 2–6.
- [ ] **Lighthouse SEO ≥ 95** on the produced HTML (informal check; hard gate later).

---

## 7. Rollback plan

This scaffold landed as a **single commit** (`749e685`) — now on `main`. Rollback paths:

| Failure | Rollback |
|---|---|
| Astro dev server doesn't start (`pnpm marketing:dev` fails) | `git checkout HEAD~1 -- apps/marketing pnpm-lock.yaml package.json` then `pnpm install`. |
| Workspace package import breaks build | `pnpm --filter @lunedoc/marketing build` error message points at the failing import. Most likely fix: add `vite.optimizeDeps.include` to `apps/marketing/astro.config.mjs`. If unfixable, revert the commit. |
| `apps/web` build breaks because of the install | Revert; investigate at root `package.json` and `pnpm-lock.yaml` only. |
| Prototype regression (`http://localhost:8765/` no longer serves) | This phase doesn't touch prototype files; if regression appears, it's a coincidence — investigate `python3 -m http.server` separately. |

Bigger rollback: `git revert 749e685` removes `apps/marketing/` entirely, leaving `apps/web` and the prototype untouched.

---

## 8. What this phase is **not** doing

Reiterated to prevent scope creep:

- **No backend.** Tool widgets in marketing pages stay as client-side mocks. When backend MVP lands per `docs/backend-api-plan.md`, both `apps/web` and `apps/marketing` widgets become real API clients in one diff.
- **No real PDF processing.** Same as `apps/web` — the widget interactions are mock-only.
- **No design changes to tool widgets.** The widgets in `@lunedoc/tools` ship as-is. If a widget needs a marketing-specific variant (e.g. a "preview-only" flavor), that's a Phase 7+ task in `@lunedoc/tools`, not here.
- **No prototype mutation.** Same hard rule as every prior phase. Verified mechanically by `git status` against `docs/components/**`, `docs/stylesheets/**`, `index.html`, `.design-canvas.state.json` after every commit.
- **No CI / preview deploy / domain config.** Operational concerns for after the eight tool pages land.

---

*Phase 7 is the first phase that produces a user-visible product surface. The scaffold is the easy part; the eight tool landing pages following the SEO template are the work. After all 8 ship, Phase 7 closes and we open backend MVP (`docs/backend-api-plan.md`) — at that point the marketing pages can flip from mock widgets to real API clients in a single sweep.*

---

## 9. Step 2 — OCR PDF landing page (2026-05-03, commit `0659985`)

First production tool landing page. **Live at `/ocr-pdf`, `/tr/ocr-pdf`, `/es/ocr-pdf`.**

### Files added
| File | Purpose |
|---|---|
| `apps/marketing/src/seo/schema.ts` | Typed JSON-LD helpers: `softwareApplicationSchema`, `faqPageSchema`, `howToSchema`, `breadcrumbListSchema`. Single `SITE_ORIGIN` constant (`https://lunedoc.app`) — change once when domain Q1 lands. |
| `apps/marketing/src/data/ocr-pdf.ts` | Per-locale page content as `Record<Lang, ToolPageContent>`. Each locale block: seoTitle, metaDescription, eyebrow, h1, sub, trust[4], faq[8], howToTitle, howToSteps[3], plus 5 section labels (CTAs / FAQ heading / etc.). |
| `apps/marketing/src/components/MarketingHeader.tsx` | React-island wrapper around `@lunedoc/ui` Header. Provides a real `setLang` that does full-page navigation to the locale's URL — clean static-page pattern, no client-side routing needed. |
| `apps/marketing/src/layouts/ToolLandingLayout.astro` | Shared shell. Props: `lang`, `canonicalPath`, `toolDisplayName`, `toolIconName`, `toolBadgeTone`, `content`, `relatedToolKeys`. Emits `<head>` with canonical + 4 hreflang + 4 JSON-LD blocks; Header (client:load), hero with badge/eyebrow/h1/sub/trust strip, `<slot />` for the tool widget, How-to section, FAQ as `<details>` accordions, related-tools `<ToolCard>` grid (client:load), Footer (client:idle). |
| `apps/marketing/src/pages/ocr-pdf.astro` | EN canonical at `/ocr-pdf`. |
| `apps/marketing/src/pages/[lang]/ocr-pdf.astro` | TR/ES variants via `getStaticPaths()`. |

### Output verified at build time

- Generated: `/ocr-pdf/index.html`, `/tr/ocr-pdf/index.html`, `/es/ocr-pdf/index.html` (4 pages including the placeholder home).
- Each page emits **4 JSON-LD blocks**: `SoftwareApplication`, `FAQPage` (8 questions), `HowTo` (3 steps), `BreadcrumbList` (3 levels).
- Each page emits **canonical** + **4 hreflang** links (en/tr/es/x-default).
- Per-locale `<title>` correct: `OCR PDF — Make Scans Searchable | Lunedoc`, `PDF OCR — Taramaları Aranabilir Yap | Lunedoc`, `OCR PDF — Convierte escaneos en buscables | Lunedoc`.
- Per-locale H1 visible in body: "Make any scan searchable.", "Her taramayı aranabilir yap.", "Convierte cualquier escaneo en buscable.".
- `<html lang>` matches per page.
- Zero raw i18n keys leak (`ocr_title`, `nav_tools`, `foot_copy`, etc. — all 0).
- `OCRToolPage` island present in each page as a `<astro-island client="load">` wrapper.
- Related-tools tiles: Watermark, Edit, Sign, Compress (4 keys per `seo-tool-page-template.md` §10 selection logic — same category + cross-category common follow-ups).

### Patterns established for the remaining 7 tool pages

Each subsequent tool page is now ~3 files: a `data/<tool>-pdf.ts` content file (Record<Lang, ToolPageContent>), an `pages/<tool>-pdf.astro` (EN), and a `pages/[lang]/<tool>-pdf.astro` (TR/ES). The `ToolLandingLayout` and `seo/schema.ts` are reused as-is; no per-tool layout work needed. Tool widget hydrates as `client:load` inside the layout's slot.

### Steps 5–8 — Edit + Merge + Compress + Convert landing pages (2026-05-03, commits `86e1669`, `49a8f25`, `8f5a3c0`, `d2f5e69`)

Four more tool pages live, same 3-files-per-tool pattern. Built artifacts now total **22 pages**: 7 tools × 3 locales + the home placeholder. Each page passes the same SEO sweep as OCR/Watermark/Sign — canonical + 4 hreflang + 4 JSON-LD blocks + correct widget island + per-locale H1 + zero raw i18n keys.

| Tool | Slug | Widget | Tone | Honesty clause |
|---|---|---|---|---|
| Edit | `/edit-pdf` (+ tr/es) | `<EditPDFToolPage>` | 290 (edit family) | FAQ explicitly states this is **overlay editing**, not full text reflow — and that re-flowing original text needs a different product. Same disclosure in trust strip ("Overlay editor — not full text reflow" + locale equivalents). |
| Merge | `/merge-pdf` (+ tr/es) | `<MergeToolPage>` | 252 (organize family) | No legal/quality concerns; FAQ notes that bookmarks/metadata default to first input's. |
| Compress | `/compress-pdf` (+ tr/es) | `<CompressToolPage>` | 200 (compress family) | FAQ explicitly states "**how much smaller** depends on the original" and "**unpredictable until we try**." Sets the right expectation before users upload. |
| Convert | `/convert-pdf` (+ tr/es) | `<ConvertToolPage>` | 220 (convert family) | FAQ explicitly states PDF → Word is **fundamentally lossy** and to **always proofread** before sending. PDF → Excel FAQ notes formulas don't survive (source PDF has no formula data). |

### Patterns confirmed across 7 tool ports

- Three-file-per-tool overhead is real and stable. Each port took ~10 min of authoring work after the OCR template was set.
- Per-locale long-form copy lives in `apps/marketing/src/data/<tool>-pdf.ts` as `Record<Lang, ToolPageContent>`. The shared interface (`ToolPageContent` exported from `data/ocr-pdf.ts` for backwards-compat reasons) constrains every page to the same shape — strict TS catches a missing FAQ entry at build time.
- All 7 pages share `ToolLandingLayout.astro`, `seo/schema.ts`, `MarketingHeader.tsx` without modification. The layout abstraction held up; no premature breaks needed.

### Step 9 — Split PDF closes Phase 7 (2026-05-03, commit `e302623`)

Final tool ported. Split-specific honesty notes baked into FAQ + trust strip in all 3 locales: Split is **page-based** — outputs preserve full pages, not partial text. For partial-text extraction, callers should use OCR (scans) or Convert PDF → JPG (images). Two modes preserved from the prototype: by-range (one PDF per range) and by-page (one combined PDF of ticked pages).

### Routes live (24 tool URLs)

```
EN canonical             /merge-pdf  /split-pdf  /watermark-pdf  /sign-pdf
                         /ocr-pdf    /edit-pdf   /compress-pdf   /convert-pdf
TR variants  /tr/<each>
ES variants  /es/<each>
```

Plus `/` (home placeholder) — total 25 static HTML files.

### Phase 7 closure — what we shipped

- `apps/marketing/` — full Astro 6 + React 19 + TS workspace.
- `ToolLandingLayout.astro` — single shared shell, 4 JSON-LD types, 4 hreflang variants, hero + tool widget slot + how-to + FAQ + related tools + footer.
- `seo/schema.ts` — typed JSON-LD helpers (`softwareApplicationSchema`, `faqPageSchema`, `howToSchema`, `breadcrumbListSchema`).
- `MarketingHeader.tsx` — React-island wrapper that does full-page navigation when `setLang` is called (clean static-page pattern).
- 8 × `data/<tool>-pdf.ts` — per-locale long-form copy.
- 8 × `pages/<tool>-pdf.astro` (EN canonical) + 8 × `pages/[lang]/<tool>-pdf.astro` (TR/ES via getStaticPaths).
- Honesty clauses baked into Sign (visible-not-cryptographic), Edit (overlay-not-reflow), Compress (size-depends-on-original), Convert (PDF→Word lossy + formulas don't survive PDF→Excel), Split (full-pages-not-partial-text).

Phase 7 closes the prototype-to-product migration arc on the **frontend** side. Both surfaces (`apps/web` for the in-app workflow, `apps/marketing` for SEO landing pages) consume the same `@lunedoc/ui` / `@lunedoc/i18n` / `@lunedoc/tools` packages. **The next workstream is the backend** per `docs/backend-api-plan.md` — when that lands, both apps' tool widgets flip from mock to real-API in one diff, and the migration story is complete.

Two more tool pages live, following the OCR pattern verbatim — each is exactly 3 files (data + EN page + TR/ES page). Built artifacts now total **10 pages**: 3 tools × 3 locales + the home placeholder.

| Tool | Slug | Widget | Tone | Related-tools tiles |
|---|---|---|---|---|
| Watermark | `/watermark-pdf`, `/tr/watermark-pdf`, `/es/watermark-pdf` | `<WatermarkToolPage>` | 290 (edit family) | edit, sign, compress, merge |
| Sign | `/sign-pdf`, `/tr/sign-pdf`, `/es/sign-pdf` | `<SignToolPage>` | 30 (security family) | edit, watermark, compress, merge |

Sign-specific decision recorded: the FAQ is honest about cryptographic vs visible signatures. The "Is the signature legally binding?" answer in all three locales explains that this is a **visible** electronic signature (suitable for everyday agreements) and that for **binding** e-signatures under eIDAS / ESIGN, callers should use a certified provider — Lunedoc does not issue cryptographic signatures yet. Same disclosure appears in the trust strip ("Visible signature, not a cryptographic e-signature" / TR / ES equivalents). Two mentions per page, not buried.

### Known caveats

- `MarketingHeader`'s `setLang` does a full-page navigation (`window.location.href = ...`). Clean for static SEO; clicking the LangSwitch reloads the whole page. Acceptable for marketing surface. The `apps/web` Header uses real React state as before — different surface, different pattern.
- `Footer` mounts `client:idle` which means a tiny JS payload eventually hydrates it. Could drop to fully static (no client directive) since Footer has no interactivity, but the savings are negligible and the consistency is nice. Revisit if the marketing JS budget pinches.
- Domain is hardcoded to `https://lunedoc.app` in `schema.ts` (Q1 in `project-status.md`). One edit when finalized.

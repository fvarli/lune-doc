# Lunedoc — Phase 7: `apps/marketing` Scaffold Plan

**Status:** IN PROGRESS — Astro shell scaffolded on 2026-05-03 in commit `749e685` on branch `phase-2/scaffold`. No tool landing pages yet.

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

This scaffold is in a **single commit** (`749e685`) on `phase-2/scaffold`. Rollback paths:

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

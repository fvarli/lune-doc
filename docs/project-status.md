# Lunedoc — Project Status & Roadmap

**Snapshot date:** 2026-05-04

This is the single orientation document for the project. New contributors (and new chat sessions) should read this first.

---

## 1. Current prototype status

Hand-built **JSX + Babel-standalone prototype**, served as a static site. No build step, no framework. Renders inside an interactive design canvas with pan/zoom and a Tweaks panel for theme/accent/locale switching.

State of the prototype:

- **Boots cleanly** — every script returns 200, no console errors, no document-level overflow.
- **9 page sections, 32 artboards** across desktop and mobile (full inventory in §4).
- **8 PDF tools mocked end-to-end** (Compress, Merge, Split, Convert, Watermark, Sign, OCR, Edit) — see §5.
- **i18n live in EN / TR / ES** for every tool surface; switching locale via the Tweaks panel re-renders all artboards.
- **Prototype is the design source of truth** and remains served from `python3 -m http.server 8765`. It was not modified during the migration and won't be until the Phase 8 cutover (move into `prototype/design-canvas/`).
- **Frontend migration**: ✓ DONE through Phase 7 on `main`. `apps/web` (Vite + React 19 + TS) at port 5173 serves all 8 tool routes. `apps/marketing` (Astro 6 + React islands + TS) builds 25 static HTML files (8 tools × 3 locales + home) for the public SEO surface. See §8 R3 for commit ranges.
- **Backend**: Phase 0 done; **Phase 1 in progress** — Merge + Split live, Watermark next. `services/api/` (FastAPI + async SQLAlchemy + asyncpg + Celery + Redis + LocalDiskStorage + PyMuPDF) ships the anonymous file lifecycle (POST/GET/DELETE/download under `/api/v1/files`), `/api/v1/healthz`, owner-token HMAC auth, MIME whitelist (415), 50 MB cap (413), 60 s TTL sweeper, and a `Job` model (with `params` JSONB) backing `POST /api/v1/jobs/{merge,split}`, `GET /api/v1/jobs/{id}`, `GET /api/v1/jobs/{id}/result` (multi-output aware). Other tool endpoints still stubbed at 501. See `docs/backend-api-plan.md` and `services/api/README.md`. Postgres + Redis run as host services; **no Docker**.

---

## 2. Folder structure

```
lune-doc/                               ← pnpm workspace
├── package.json                         ← root scripts: web:dev/build/lint, marketing:dev/build, prototype:serve
├── pnpm-workspace.yaml                  ← apps/* + packages/*
├── tsconfig.base.json                   ← strict TS shared by every workspace
├── .npmrc / .nvmrc
├── index.html                           ← prototype entrypoint (untouched)
├── .design-canvas.state.json            ← prototype sidecar (untouched)
├── apps/
│   ├── web/                             ← Vite + React 19 + TS · port 5173 · 8 tool routes
│   │   └── src/{App.tsx, main.tsx, …}
│   └── marketing/                       ← Astro 6 + React islands + TS · port 4321
│       └── src/{layouts/, pages/, data/, components/, seo/}
├── packages/
│   ├── ui/                              ← @lunedoc/ui · tokens.css + Logo/Icon/Header/Footer/ToolCard/PdfThumb/LangSwitch + Lang type
│   ├── i18n/                            ← @lunedoc/i18n · 336-key EN/TR/ES JSON tables + useI18n hook
│   └── tools/                           ← @lunedoc/tools · 8 ported tool widgets (Merge/Split/Watermark/Sign/OCR/Edit/Compress/Convert)
├── services/
│   └── api/                             ← lunedoc-api · FastAPI + Postgres (asyncpg) + Celery/Redis · uv-managed · port 8000
│       └── src/lunedoc_api/{main,settings,db,storage,owner_token,mime,routes/,workers/,models/}
└── docs/
    ├── project-status.md                ← this file
    ├── backend-api-plan.md              ← API design proposal (next workstream)
    ├── seo-tool-page-template.md        ← template each /<tool>-pdf page implements
    ├── monorepo-structure.md            ← target repo layout reference
    ├── frontend-migration-plan.md       ← long-term frontend outline (Phases 2–7 done)
    ├── ui-qa-checklist.md               ← QA checklist for prototype changes
    ├── manual-qa-run.md                 ← human-side QA operating procedure
    ├── phase-2-vite-scaffold-plan.md    ← Phase 2 closure
    ├── phase-3-ui-package-plan.md       ← Phase 3 closure
    ├── phase-4-i18n-package-plan.md     ← Phase 4 closure
    ├── phase-6-tool-widget-port-plan.md ← Phase 6 closure
    ├── phase-7-marketing-scaffold-plan.md ← Phase 7 closure
    ├── post-phase-7-audit.md            ← post-merge repo audit
    ├── components/                      ← prototype JSX (untouched, design source of truth)
    │   ├── design-canvas.jsx, tweaks-panel.jsx, ios-frame.jsx, browser-window.jsx
    │   ├── i18n.jsx, primitives.jsx, homepage.jsx, tool-page.jsx, auth-page.jsx
    │   ├── blog-page.jsx, tool-variants.jsx, tools-index-page.jsx, pricing-page.jsx
    │   ├── dashboard-page.jsx, article-page.jsx, system-inventory.jsx, app.jsx
    ├── stylesheets/tokens.css           ← prototype tokens (untouched, source for packages/ui/src/tokens.css)
    └── index-html/                      ← reference screenshots (PNGs only)
```

The prototype tree under `docs/components/` and `docs/stylesheets/` and `index.html` is **the same files that existed before Phase 2 began**. Phase 8 (cutover) will eventually move this tree into `prototype/design-canvas/` per `docs/monorepo-structure.md`; not yet.

---

## 3. Active entrypoint

**`/index.html`** at the project root. This is the only thing that should be opened.

Loads (in order):

1. `docs/stylesheets/tokens.css`
2. React 18 (UMD), ReactDOM 18 (UMD), Babel-standalone — all from unpkg CDN
3. The 17 component files in dependency order: design-canvas → tweaks-panel → ios-frame → browser-window → i18n → primitives → all page files → tool-variants → tools-index → pricing → dashboard → article → system-inventory → **app.jsx (last)**

Each JSX file communicates by attaching symbols to `window` (either `window.X = X` or `Object.assign(window, { ... })`). `app.jsx` destructures from `window` at the top.

Local dev: `python3 -m http.server 8765` from project root → open `http://localhost:8765/`.

---

## 4. Completed pages / artboards

9 sections, 32 artboards. All wired up in `docs/components/app.jsx`.

| # | Section | Artboards | Sizes (px) |
|---|---|---|---|
| 01 | Homepage | `home-desktop`, `home-mobile` | 1280×820 / 390×844 |
| 02 | Tool page (Compress shell) | `tool-empty`, `tool-uploading`, `tool-done`, `tool-mobile` | 1080×820 / 390×844 |
| 03 | Tool variants | `tool-merge`, `tool-split`, `tool-convert`, `tool-watermark`, `tool-watermark-mobile`, `tool-sign`, `tool-sign-mobile`, `tool-ocr`, `tool-ocr-mobile`, `tool-edit`, `tool-edit-mobile` | 1080×820–1000 / 390×844 |
| 04 | Tools index | `tools-desktop`, `tools-mobile` | 1280×1100 / 390×844 |
| 05 | Pricing | `pricing-desktop`, `pricing-mobile` | 1280×1000 / 390×844 |
| 06 | Sign in / Register | `auth-signin`, `auth-register`, `auth-mobile` | 1280×820 / 390×844 |
| 07 | Dashboard | `dash-desktop`, `dash-empty`, `dash-mobile` | 1280×900 / 390×844 |
| 08 | Blog + Article | `blog-desktop`, `blog-mobile`, `article-desktop`, `article-mobile` | 1280×1100–1400 / 390×844 |
| 09 | Design system | `system-inventory` | 1280×1500 |

---

## 5. Tool surfaces (3 places per tool)

Each of the 8 MVP tools now exists in **three places**, all driven by client-side mocks (no real PDF processing yet):

1. **Prototype** — design source artboards in `docs/components/tool-page.jsx` and `docs/components/tool-variants.jsx`. Same shell aesthetic across all 8.
2. **`apps/web` route** — typed React component in `packages/tools/src/<tool>/<Tool>ToolPage.tsx`, served at `/<tool>-pdf` on port 5173.
3. **`apps/marketing` landing page** — Astro static page at `/<tool>-pdf` (and `/tr/<tool>-pdf`, `/es/<tool>-pdf`) hydrating the same `@lunedoc/tools` widget as a React island.

The table below describes the **prototype** version (the design spec). The widget rows are 1:1 with the ported components in `packages/tools/`.

| Tool | Component | File | Desktop / Mobile artboard | Notes |
|---|---|---|---|---|
| Compress PDF | `ToolPage` (empty / uploading / done) | `tool-page.jsx` | tool-empty, tool-uploading, tool-done, tool-mobile | Shell baseline; demonstrates the three states. |
| Merge PDF | `MergeToolPage` | `tool-variants.jsx` | tool-merge, — | Reorderable list of 4 mock files; total size readout. |
| Split PDF | `SplitToolPage` | `tool-variants.jsx` | tool-split, — | Range builder + per-page-block mode. |
| Convert PDF | `ConvertToolPage` | `tool-variants.jsx` | tool-convert, — | From/to picker (PDF, DOCX, JPG, PNG, etc.) + OCR-on-scan toggle. |
| Watermark PDF | `WatermarkToolPage` | `tool-variants.jsx` | tool-watermark, tool-watermark-mobile | Text input, 3×3 position grid, opacity, rotation, apply-to. |
| Sign PDF | `SignToolPage` | `tool-variants.jsx` | tool-sign, tool-sign-mobile | Draw / Type / Upload methods, 3 typed styles, field types, draggable preview. |
| OCR PDF | `OCRToolPage` | `tool-variants.jsx` | tool-ocr, tool-ocr-mobile | 4 language options (auto / en / tr / es), extract-text vs searchable-PDF, scanned vs recognized 2-pane preview. |
| Edit PDF | `EditPDFToolPage` | `tool-variants.jsx` | tool-edit, tool-edit-mobile | Add text / highlight / redact / shape modes, color swatches, stroke style, page stepper. |

---

## 6. Known technical notes

- **React 18 + Babel-standalone, no build step.** Every JSX file is `<script type="text/babel">`. `ReactDOM.createRoot` mounts to `#root`. Dev-only by definition; cannot ship to production this way.
- **Global `window` exports.** Components don't use ES modules. They write `window.X` (often via `Object.assign(window, { … })`) and `app.jsx` destructures from `window` at the top. Load order in `index.html` is therefore load-bearing.
- **`.design-canvas.state.json` sidecar.** `design-canvas.jsx` does `fetch('./.design-canvas.state.json')` on mount to hydrate the saved section/artboard layout. The empty file at the project root makes the request return 200 with no console noise; the design-canvas accepts the empty payload.
- **No framework yet.** Vite/React/Next migration is intentionally deferred until the prototype design is stable.
- **Tone palette.** Tools share a hue-tone convention from `primitives.jsx:280` (TOOLS list): organize=252, compress=200, convert=220, edit-family (incl. Watermark, OCR, Edit)=290, security (Sign)=30. Per-page badges in `tool-variants.jsx` mirror these.
- **Page-level overflow defenses live in `index.html`** (`html, body { margin:0; padding:0; overflow:hidden }`), not in any component. The `.design-canvas` viewport uses `100vw × 100vh` and clips internally.

---

## 7. Decisions made

| # | Decision | Date | Status |
|---|---|---|---|
| D1 | Product name is **Lunedoc**. | confirmed | Live across `BRAND_NAME`, all browser-window URLs, the system-inventory hero, and i18n footer/auth-quote (rename completed 2026-05-03). One internal namespace `storageKey="paperline-canvas-v1"` intentionally retained — see §6. |
| D2 | Lunedoc lives under the **Lunexa ecosystem**. | confirmed | No code dependency yet; will affect shared auth/billing later. |
| D3 | **Web first, Flutter later.** | confirmed | All UI work is web; mobile app is a post-MVP product (separate from the operational "Phase 2 = scaffold apps/web" used by the migration plan). |
| D4 | **One API serves both web and Flutter.** | confirmed | Captured in `docs/backend-api-plan.md` §7. |
| D5 | Backend stack: **Python + FastAPI + Celery + Redis**, with **PyMuPDF / Ghostscript / LibreOffice / Tesseract** for tool engines. Storage: local disk → Cloudflare R2 in prod. | proposed (`docs/backend-api-plan.md`) | Awaiting build sign-off. |
| D6 | **No paid SaaS APIs in MVP.** Tesseract over Textract, LibreOffice over Adobe, ClamAV over hosted scanners. | confirmed | Revisit only on measured bottleneck. |
| D7 | **Files are ephemeral**: 1-hour TTL after upload or job completion (later wins). No backups. | confirmed | Drives privacy story and storage sizing. |
| D8 | **Anonymous-first** flow. Auth and dashboard ship after the tool pipeline is live. | confirmed | Eight tools work without a user account in MVP. |
| D9 | **Edit PDF is intentionally an overlay/redact editor**, not Acrobat-style content editing. | confirmed | Set UI/marketing copy expectations accordingly. |
| D10 | **Frontend consolidates to a single app long-term.** `apps/marketing` will be merged into `apps/web` in a separate later task; the split was a Phase 7 scaffolding choice, not the end state. `apps/marketing` remains in-tree until that consolidation lands. | 2026-05-04 | Captured to anchor the next frontend workstream once backend Phase 1 is underway. |
| D11 | **Backend runs on host services, not Docker.** Postgres + Redis must be installed as Xubuntu/Linux daemons; the repo intentionally has no `Dockerfile` or `docker-compose.yml`. `uv` (Astral) is the Python package manager. | 2026-05-04 | Setup commands documented in `services/api/README.md`. Revisit only if multi-host deploy actually demands it. |

---

## 8. Next roadmap

In recommended execution order. Each item is a self-contained workstream.

### R1 — Brand rename: Paperline → Lunedoc — ✓ DONE (2026-05-03)
- `BRAND_NAME` updated in `primitives.jsx:4`.
- All 18 `paperline.app/...` URLs in `app.jsx` rewritten to `lunedoc.app/...` (placeholder until Q1 lands).
- ChromeWindow tab title `"Paperline"` → `"Lunedoc"` in `app.jsx`.
- `system-inventory.jsx` hero h1 updated.
- All 6 i18n strings (3× `auth_quote`, 3× `foot_copy`) updated across EN/TR/ES.
- `tokens.css` header comment updated (internal cleanup).
- `index.html` `<title>` was already "Lunedoc"; no edit needed.
- Intentionally retained: `storageKey="paperline-canvas-v1"` in `app.jsx` (internal namespace, not user-facing) — falls under the design-canvas internal-labels carve-out.

### R2 — Final UI QA pass
- Walk every artboard in EN, then TR, then ES — look for clipped buttons, broken word-wraps, mobile overflow.
- Verify dark mode on every page (Tweaks → Theme → Dark).
- Verify each accent preset doesn't break contrast on any tool.
- Verify the design canvas itself: section reordering, focus mode, sidecar persistence.
- Resolve any remaining brand placeholders or lorem.

### R3 — Vite + React migration — ✓ DONE through Phase 7
All work merged to `main`; the working `phase-2/scaffold` branch was deleted after merge. Status as of 2026-05-03:

- **Phase 2 (scaffold `apps/web`)** — ✓ DONE (commit `84680d3`). Vite + React 19 + TS 6 workspace boots; `pnpm web:dev` serves a "Hello Lunedoc" page on port 5173. See `docs/phase-2-vite-scaffold-plan.md`.
- **Phase 3 (extract design system into `@lunedoc/ui`)** — ✓ DONE (commits `8305501..44f8f79`, 5 step-commits). `apps/web` now renders a real Lunedoc shell (Header → main → Footer) entirely from `@lunedoc/ui`. See `docs/phase-3-ui-package-plan.md`.
  - **Inside `@lunedoc/ui`:** `tokens.css`; `Logo`/`LogoMark`/`BRAND_NAME`; `Icon` + 46-value `IconName` union; `TOOLS` (typed via `as const satisfies`) + `ToolIcon`/`ToolCard`/`PdfThumb` + `Tool`/`ToolKey`/`ToolCategory`; `Header`/`Footer`/`MobileBottomNav`/`LangSwitch`; `Lang` type.
- **Phase 4 (extract `i18n.jsx` into `@lunedoc/i18n` + wire `@lunedoc/ui` to it)** — ✓ DONE (commits `2b5c5a2..5d5c70d`, 3 commits). Replaces the Phase-3 `t = (k) => k` stubs with a real `useI18n(lang)` hook. `apps/web` has a live `<LangSwitch>` in the page; clicking EN/TR/ES live-swaps every label across Header, ToolCard, Footer simultaneously. See `docs/phase-4-i18n-package-plan.md`.
  - **Inside `@lunedoc/i18n`:** `I18N_STRINGS` (336 keys × en/tr/es identical key sets); `getStrings`, `createTranslator`, `useI18n` (memoized); `Lang` + `TranslationKey` (derived from EN JSON) types.
  - **Eager-load decision:** all 3 locales bundled into `apps/web`'s initial JS (~12 kB gzipped overhead). Threshold for switching to dynamic per-locale imports is ~5 locales — not yet.
  - **Open thread:** `I18N_ARTICLES` (blog article copy, lines 1126–1182 of `docs/components/i18n.jsx`) remains in the prototype only; will move when the blog pages get ported.
- **Phase 5** — no separate phase. The original migration plan in `docs/frontend-migration-plan.md` listed Phase 5 as "Extract i18n into packages/i18n", but that work landed together with the `@lunedoc/ui` ↔ `@lunedoc/i18n` wiring as Phase 4 (commits above). The numbering jumps 4 → 6 in this status doc to match the per-phase plan filenames in `docs/`.
- **Phase 6 (port real tool widgets into the workspace)** — ✓ DONE 2026-05-03. Commit range `450fad8..8c6e5ff`. **All 8 widgets** live in `@lunedoc/tools`; **all 8 routes** serve in `apps/web` with shared `<Header>` / `<Footer>` and shared lang state. See `docs/phase-6-tool-widget-port-plan.md`.
  - **Routes live:** `/merge-pdf`, `/split-pdf`, `/watermark-pdf`, `/sign-pdf`, `/ocr-pdf`, `/edit-pdf`, `/compress-pdf`, `/convert-pdf`.
  - **Inside `@lunedoc/tools`:** `MergeToolPage`, `SplitToolPage`, `WatermarkToolPage`, `SignToolPage`, `OCRToolPage`, `EditPDFToolPage`, `CompressToolPage`, `ConvertToolPage`. Shared internal helper at `packages/tools/src/_internal/btnGhost.ts`.
  - The prototype remains untouched — `index.html` + `docs/components/*.jsx` are exactly as they were before Phase 2. Phase 8 (cutover) will eventually move the prototype into `prototype/design-canvas/` per the original migration plan; not now.
- **Phase 7 (`apps/marketing` Astro site for SEO tool landing pages)** — ✓ DONE 2026-05-03. Commit range `749e685..e302623`. **All 8 tool pages live in EN/TR/ES** at `/<tool>-pdf`, `/tr/<tool>-pdf`, `/es/<tool>-pdf` for `merge`, `split`, `watermark`, `sign`, `ocr`, `edit`, `compress`, `convert`. **25 static HTML files** in `apps/marketing/dist/` (8 tools × 3 locales + home placeholder). Each page emits canonical + 4 hreflang + 4 JSON-LD blocks (SoftwareApplication / FAQPage / HowTo / BreadcrumbList), per-locale `<title>` + `<html lang>`, hydrates the tool widget as a `client:load` React island, and renders related-tools tile grid + FAQ accordions + Footer. Zero raw i18n keys in any rendered HTML. Honesty clauses baked in for Sign (visible-not-cryptographic), Edit (overlay-not-reflow), Compress (size-depends-on-original), Convert (PDF→Word lossy + formulas don't survive PDF→Excel), Split (full-pages-not-partial-text). See `docs/phase-7-marketing-scaffold-plan.md`.
- **Next workstream — backend MVP** per `docs/backend-api-plan.md`. When the API endpoints land, both `apps/web` and `apps/marketing` widgets flip from client-side mocks to real API clients in a single diff — closing the prototype-to-product migration story end-to-end. Estimated 7 weeks per the plan.
- **Optional small side task — extract `I18N_ARTICLES`** from the prototype's `docs/components/i18n.jsx` into `@lunedoc/i18n` (~30 minutes). Closes the Phase 4 open thread; not blocking anything.

### R4 — Backend MVP implementation
Per `docs/backend-api-plan.md` §8 — 7-week plan, anonymous tools first, auth and dashboard last. Concretely:
- **Phase 0: API skeleton + storage + sweeper. — ✓ DONE** (2026-05-04). Lives on `main`. Files lifecycle endpoints, `/healthz`, owner-token HMAC, MIME 415, size 413, TTL sweeper, 7/7 pytest green against `lunedoc_test`. Commits: `dfe86b5` (scaffold) + `910b284` (files + sweeper + tests) + `d6191af` (docs).
- **Phase 1: Merge / Split / Watermark / Sign / Edit — IN PROGRESS** (Merge + Split live as of 2026-05-04). Job model + `jobs` table (Alembic 0002 + 0003 added a `params` JSONB column for per-tool config); PyMuPDF as the engine; Celery `lunedoc.merge` and `lunedoc.split` tasks share the `queued → running → done|failed` lifecycle. Route surface: `POST /api/v1/jobs/merge`, `POST /api/v1/jobs/split` (mode=`ranges` with 1-indexed inclusive `[start,end]` lists, or mode=`per_page`), shared `GET /api/v1/jobs/{id}` and `GET /api/v1/jobs/{id}/result` (multi-output aware). Outputs are normal `File` rows inheriting the job's owner_token_hash, downloadable via `/api/v1/files/{id}/download`. Same X-Owner-Token no-leak policy as files. 23/23 pytest green. Tools remaining in this phase: Watermark, Sign, Edit.
- Phase 2: Compress + Convert.
- Phase 3: OCR.
- Phase 4: Auth + dashboard + quotas.
- Phase 5: R2, ClamAV, signed URLs, ops UI.

### R6 — Frontend consolidation: merge `apps/marketing` into `apps/web`
Per D10 (above). Separate task; not bundled into R4. The marketing-vs-web split was useful as a Phase 7 stepping stone but is not the long-term shape. Outline:
- Move Astro pages + per-locale routes into `apps/web` (likely as a sub-route tree or a hybrid SSR/SSG setup, exact framework TBD).
- Collapse the duplicated `<Header>`/`<Footer>`/`<LangSwitch>` mounts into a single tree.
- Retire `apps/marketing/` and update `pnpm-workspace.yaml` + root scripts.
- Verify SEO surfaces (canonical, hreflang, JSON-LD) survive the move with no regression.

Timing: most natural after backend Phase 1 ships at least Merge + Split end-to-end (so the consolidation refactor doesn't conflict with widget API rewiring).

### R5 — Flutter-ready API confirmation
Sized inside R4, no separate workstream:
- Publish OpenAPI at `/api/v1/openapi.json` from day one.
- Pick JWT (access + refresh) and verify it works with `dart:io HttpClient` and Dio.
- Verify multipart upload progress works in both `XMLHttpRequest` (web) and `dio` (Flutter).
- Defer push notifications (FCM/Web Push) until the mobile app exists.

---

## 9. Open questions

| # | Question | Why it matters | Default if unresolved |
|---|---|---|---|
| Q1 | **Final domain.** lunedoc.com? lunedoc.app? lunedoc.io? Subdomain of lunexa.* ? | Blocks brand rename (R1) and any production deploy; also affects email-from address and OAuth callback registrations. | Use `lunedoc.app` as a placeholder in code/copy until decided. |
| Q2 | **Pricing model.** Free + Pro + Business as already mocked? Per-document credits? Subscription only? Per-tool quotas vs unified quota? | Drives quota enforcement code (R4 Phase 4) and the dashboard UI. | Keep the existing 3-tier mock; defer commit until R4 Phase 4 begins. |
| Q3 | **Auth timing.** Ship 8 anonymous tools first (current plan), or gate behind email signup from day one? | Affects funnel, retention, and how much of R4 must finish before public launch. | Anonymous-first per D8; revisit if the launch goal changes. |
| Q4 | **Storage provider.** Cloudflare R2, Bunny Storage, Backblaze B2, or AWS S3? | Egress cost matters a lot for a download-heavy product. R2 is the recommended default. | R2 unless cost modeling overturns it. |
| Q5 | **OCR limits.** Free-tier page cap (proposed: 20 pages/file, 20 pages/day). Per-language packs to ship? GPU later? | OCR is the most expensive tool; underpricing it tanks unit economics. | 20-page free cap, en/tr/es language packs only at launch, CPU-only Tesseract; revisit once we see real usage. |

---

*Update this file whenever a decision (§7), roadmap item (§8), or open question (§9) changes. The file is intentionally short — link out to deeper docs (`backend-api-plan.md`, future migration plan, etc.) rather than expanding inline.*

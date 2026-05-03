# Lunedoc — Project Status & Roadmap

**Snapshot date:** 2026-05-03

This is the single orientation document for the project. New contributors (and new chat sessions) should read this first.

---

## 1. Current prototype status

Hand-built **JSX + Babel-standalone prototype**, served as a static site. No build step, no framework. Renders inside an interactive design canvas with pan/zoom and a Tweaks panel for theme/accent/locale switching.

State of the prototype:

- **Boots cleanly** — every script returns 200, no console errors, no document-level overflow.
- **9 page sections, 32 artboards** across desktop and mobile (full inventory in §4).
- **8 PDF tools mocked end-to-end** (Compress, Merge, Split, Convert, Watermark, Sign, OCR, Edit) — see §5.
- **i18n live in EN / TR / ES** for every tool surface; switching locale via the Tweaks panel re-renders all artboards.
- **Backend**: not started. API design is proposed in `docs/backend-api-plan.md`.
- **Migration to Vite/React/Next**: not started, intentional.

---

## 2. Folder structure

```
lune-doc/
├── index.html                          ← active entrypoint (root)
├── .design-canvas.state.json           ← sidecar for design-canvas state (empty)
└── docs/
    ├── backend-api-plan.md             ← API design proposal (no code yet)
    ├── project-status.md               ← this file
    ├── components/                     ← all JSX, loaded as <script type="text/babel">
    │   ├── design-canvas.jsx           ← pan/zoom canvas + section/artboard primitives
    │   ├── tweaks-panel.jsx            ← floating tweaks (theme, accent, locale, density)
    │   ├── ios-frame.jsx               ← iPhone artboard chrome
    │   ├── browser-window.jsx          ← desktop browser chrome
    │   ├── i18n.jsx                    ← I18N_STRINGS for en/tr/es + useI18n hook
    │   ├── primitives.jsx              ← Logo, Header, Footer, Icon, ToolCard, TOOLS, BRAND_NAME
    │   ├── homepage.jsx                ← HomeContent
    │   ├── tool-page.jsx               ← ToolPage (Compress shell — empty/uploading/done states)
    │   ├── auth-page.jsx               ← AuthPage (signin/register)
    │   ├── blog-page.jsx               ← BlogPage
    │   ├── tool-variants.jsx           ← Merge, Split, Convert, Watermark, Sign, OCR, Edit
    │   ├── tools-index-page.jsx       ← ToolsIndexPage
    │   ├── pricing-page.jsx            ← PricingPage
    │   ├── dashboard-page.jsx          ← DashboardPage
    │   ├── article-page.jsx            ← ArticlePage
    │   ├── system-inventory.jsx        ← SystemInventoryPage (design-system reference)
    │   └── app.jsx                     ← composes everything; mounts to #root
    ├── stylesheets/
    │   └── tokens.css                  ← design tokens (colors, type, spacing, shadows)
    └── index-html/                     ← reference screenshots (PNGs only)
```

There is **no v1 archive**. Nothing else lives at the project root.

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

## 5. Completed tool mock pages

All 8 MVP tools have a working mock page with the same shell aesthetic (header → back link → tool badge + title → document strip → controls / preview grid → bottom CTAs). All have EN/TR/ES copy. All controls are stateful client-side; **no real PDF processing**.

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
| D3 | **Web first, Flutter later.** | confirmed | All UI work is web; mobile app is a Phase-2 product. |
| D4 | **One API serves both web and Flutter.** | confirmed | Captured in `docs/backend-api-plan.md` §7. |
| D5 | Backend stack: **Python + FastAPI + Celery + Redis**, with **PyMuPDF / Ghostscript / LibreOffice / Tesseract** for tool engines. Storage: local disk → Cloudflare R2 in prod. | proposed (`docs/backend-api-plan.md`) | Awaiting build sign-off. |
| D6 | **No paid SaaS APIs in MVP.** Tesseract over Textract, LibreOffice over Adobe, ClamAV over hosted scanners. | confirmed | Revisit only on measured bottleneck. |
| D7 | **Files are ephemeral**: 1-hour TTL after upload or job completion (later wins). No backups. | confirmed | Drives privacy story and storage sizing. |
| D8 | **Anonymous-first** flow. Auth and dashboard ship after the tool pipeline is live. | confirmed | Eight tools work without a user account in MVP. |
| D9 | **Edit PDF is intentionally an overlay/redact editor**, not Acrobat-style content editing. | confirmed | Set UI/marketing copy expectations accordingly. |

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

### R3 — Vite + React migration — IN PROGRESS
Status as of 2026-05-03 — branch `phase-2/scaffold`:

- **Phase 2 (scaffold `apps/web`)** — ✓ DONE (commit `84680d3`). Vite + React 19 + TS 6 workspace boots; `pnpm web:dev` serves a "Hello Lunedoc" page on port 5173. See `docs/phase-2-vite-scaffold-plan.md`.
- **Phase 3 (extract design system into `@lunedoc/ui`)** — ✓ DONE (commits `8305501..44f8f79`, 5 step-commits). `apps/web` now renders a real Lunedoc shell (Header → main → Footer) entirely from `@lunedoc/ui`. See `docs/phase-3-ui-package-plan.md`.
  - **Inside `@lunedoc/ui`:** `tokens.css`; `Logo`/`LogoMark`/`BRAND_NAME`; `Icon` + 46-value `IconName` union; `TOOLS` (typed via `as const satisfies`) + `ToolIcon`/`ToolCard`/`PdfThumb` + `Tool`/`ToolKey`/`ToolCategory`; `Header`/`Footer`/`MobileBottomNav`/`LangSwitch`; `Lang` type.
- **Phase 4 (extract `i18n.jsx` into `@lunedoc/i18n` + wire `@lunedoc/ui` to it)** — ✓ DONE (commits `2b5c5a2..5d5c70d`, 3 commits). Replaces the Phase-3 `t = (k) => k` stubs with a real `useI18n(lang)` hook. `apps/web` has a live `<LangSwitch>` in the page; clicking EN/TR/ES live-swaps every label across Header, ToolCard, Footer simultaneously. See `docs/phase-4-i18n-package-plan.md`.
  - **Inside `@lunedoc/i18n`:** `I18N_STRINGS` (336 keys × en/tr/es identical key sets); `getStrings`, `createTranslator`, `useI18n` (memoized); `Lang` + `TranslationKey` (derived from EN JSON) types.
  - **Eager-load decision:** all 3 locales bundled into `apps/web`'s initial JS (~12 kB gzipped overhead). Threshold for switching to dynamic per-locale imports is ~5 locales — not yet.
  - **Open thread:** `I18N_ARTICLES` (blog article copy, lines 1126–1182 of `docs/components/i18n.jsx`) remains in the prototype only; will move when the blog pages get ported.
- **Next phase** — your choice between (a) extract `I18N_ARTICLES` (small), or (b) open Phase 6 by porting the first real tool widget (e.g. `MergeToolPage`) into `@lunedoc/ui`, using `@lunedoc/ui` + `@lunedoc/i18n` as foundations. See `docs/phase-4-i18n-package-plan.md` §5 for details.

Original migration-plan items still useful as long-term reference:
- File tree mapping (current `docs/components/*.jsx` → `src/components/*.tsx`).
- TypeScript adoption strategy (gradual, starting with `i18n` + `primitives`).
- How `window`-globals become real ES module imports.
- Routing: React Router vs TanStack Router. (Lean: React Router for familiarity.)
- Asset/CSS strategy: keep `tokens.css` as-is, import once at the root.
- Dev loop: Vite + ESLint + Vitest. No SSR until needed.
- Migration order: i18n → primitives → shells (browser/ios) → tool pages → app shell → canvas/tweaks last.
- Decision point: stay Vite SPA, or move to Next.js for SSR/SEO. (Lean: SPA for app pages, Next only when the marketing site demands SSR.)

### R4 — Backend MVP implementation
Per `docs/backend-api-plan.md` §8 — 7-week plan, anonymous tools first, auth and dashboard last. Concretely:
- Phase 0: API skeleton + storage + sweeper.
- Phase 1: Merge / Split / Watermark / Sign / Edit (5 of 8 tools).
- Phase 2: Compress + Convert.
- Phase 3: OCR.
- Phase 4: Auth + dashboard + quotas.
- Phase 5: R2, ClamAV, signed URLs, ops UI.

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

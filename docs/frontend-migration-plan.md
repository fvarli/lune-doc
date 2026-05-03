# Lunedoc — Frontend Migration Plan

**Status:** documentation only. No migration has started. The current prototype remains the canonical UI source until Phase 2 of this plan begins.

**Companion docs:**
- `docs/monorepo-structure.md` — the broader target repository layout.
- `docs/project-status.md` — current artboard / tool inventory.
- `docs/seo-tool-page-template.md` — what the migrated tool landing pages must implement.

---

## 1. Current prototype constraints

The frontend lives entirely in a single static HTML file plus loose JSX scripts. It is intentionally simple, and that simplicity is what we have to migrate *out of* — not abandon, but graduate beyond.

- **`index.html` + Babel-standalone.** Every JSX file is loaded via `<script type="text/babel">`. Babel compiles in the browser on every page load. Acceptable for a design canvas, fatal for production: first-load is slow, no minification, no tree-shaking, no source maps that match the deploy artifact.
- **`window` globals as the module system.** Components publish their exports via `Object.assign(window, { … })` (or `window.X = X`); `app.jsx` destructures the surface from `window` at the top. Load order in `index.html` is therefore load-bearing — a wrong order silently breaks the destructure.
- **Design canvas as the page.** The whole UI is rendered inside `DesignCanvas` (pan/zoom + section/artboard primitives). There are no real URLs — every "page" is an artboard inside one giant React tree. That's perfect for design review, useless for users.
- **No build step.** No Vite, no Webpack, no esbuild, no TypeScript, no ESLint, no Prettier, no test runner, no CI. Nothing to fail and nothing to enforce.
- **No production deploy story.** The prototype runs from `python3 -m http.server`. There is no minified bundle, no CDN config, no asset hashing.

These constraints together mean: **we cannot ship the current `index.html` to real users.** The migration plan below converts it into something we can.

---

## 2. Recommended migration target

Two frontends, one shared design system, one shared i18n layer. Backend and mobile are separate workstreams not blocked by this plan.

| Surface | Stack | URL | Why |
|---|---|---|---|
| Marketing site | **Astro** + React islands + TS | `lunedoc.app` | SEO landing pages need pre-rendered HTML in the response. Astro emits static HTML and only hydrates the interactive bits (the actual tool widgets) as islands. |
| App / web | **Vite + React + TypeScript + React Router** | `app.lunedoc.app` | The signed-in workflow is a stateful SPA. Vite gives the fastest dev loop. No SSR needed (all routes are gated). |
| Backend | FastAPI + Celery + Redis + Postgres | `api.lunedoc.app` | Per `docs/backend-api-plan.md`. **Not part of this plan.** |
| Mobile | Flutter | iOS + Android | Same API as web. **Not part of this plan.** |

Shared between the two frontends:
- `@lunedoc/ui` — design tokens + primitives + tool widgets.
- `@lunedoc/i18n` — string tables and the `useI18n` hook.
- `@lunedoc/sdk` — typed API client (later, generated from FastAPI's OpenAPI).
- `@lunedoc/config` — shared `tsconfig`, `eslint`, `prettier`, `vitest` configs.

The reasoning behind the marketing-vs-app split is in `docs/monorepo-structure.md` §4.

---

## 3. Migration phases

Eight phases. Each one is small, reversible, and ends in a working prototype + a working new layout side by side. Don't start the next phase until the current one is verified.

### Phase 1 — Keep the prototype stable
- **Goal:** lock down the design before any framework adoption.
- **Action:** finish UI iteration in `docs/components/`. Run the QA checklist (`docs/ui-qa-checklist.md`).
- **Exit criterion:** no major UI changes for ≥ 2 weeks; QA checklist green across EN/TR/ES, light/dark, all 8 tool pages.
- **Risk if skipped:** rebuilding moving targets in Vite costs 2–3× the time.

### Phase 2 — Scaffold `apps/web`
- **Goal:** stand up an empty Vite + React + TS workspace next to the prototype.
- **Action:**
  - Adopt **`pnpm`** as the workspace manager.
  - `pnpm create vite apps/web --template react-ts`.
  - Add React Router, Vitest, ESLint, Prettier.
  - Configure path aliases (`@ui/*`, `@i18n/*`).
  - The Vite dev server runs on a different port than the prototype; both coexist.
- **Exit criterion:** `pnpm --filter web dev` serves a "Hello Lunedoc" page with HMR working.
- **Prototype:** untouched. Still runs from root `index.html`.

### Phase 3 — Scaffold `apps/marketing`
- **Goal:** stand up the Astro project for marketing + tool landing pages.
- **Action:**
  - `pnpm create astro@latest apps/marketing` with the React integration.
  - Pre-create empty page files for each tool slug (`/compress-pdf`, `/merge-pdf`, …, `/edit-pdf`) so the routing shape is visible immediately.
  - Set up `astro:i18n` (or equivalent) with EN/TR/ES locale prefixes.
  - Confirm the SEO template structure from `docs/seo-tool-page-template.md` fits cleanly into a `ToolHeroLayout.astro` shell.
- **Exit criterion:** `pnpm --filter marketing dev` serves an empty `/ocr-pdf` page in all three locales.

### Phase 4 — Extract tokens + primitives into `packages/ui`
- **Goal:** move the design system out of `docs/components/primitives.jsx` into a shared, typed, tree-shakable library.
- **Action:**
  - Create `packages/ui/` workspace.
  - Move `docs/stylesheets/tokens.css` → `packages/ui/src/tokens.css`.
  - Convert `Logo`, `LogoMark`, `Icon`, `Header`, `Footer`, `MobileBottomNav`, `LangSwitch`, `ToolIcon`, `ToolCard`, `PdfThumb`, and the `TOOLS` table from `primitives.jsx` into typed `.tsx` modules.
  - Export named symbols — kill the `Object.assign(window, …)` pattern at the source.
  - Add Storybook so the design system can be browsed in isolation.
  - Both `apps/web` and `apps/marketing` import from `@lunedoc/ui`.
- **Exit criterion:** every primitive renders identically to its prototype counterpart (visual diff against the existing canvas artboards).

### Phase 5 — Extract i18n into `packages/i18n`
- **Goal:** make string tables editable without touching code.
- **Action:**
  - Create `packages/i18n/` workspace.
  - Externalize `I18N_STRINGS` from `i18n.jsx` into per-locale JSON: `locales/en.json`, `locales/tr.json`, `locales/es.json`.
  - Externalize `I18N_ARTICLES` similarly (or keep in JSON if it's still light).
  - Re-export the `useI18n(lang)` hook with the same return shape (`{ t, lang, articles }`).
  - Add a `pnpm i18n:check` script that verifies key parity across all locales (catches missing TR keys for new EN strings).
- **Exit criterion:** `useI18n('tr')` in `apps/web` returns the same strings as the prototype; `i18n:check` is green.

### Phase 6 — Port tool widgets
- **Goal:** move the eight tool components into `@lunedoc/ui` (or a sibling `@lunedoc/tools` if they grow heavy) so both apps can render them.
- **Action:**
  - Port one tool at a time, in this order: Merge → Split → Watermark → Sign → Edit → OCR → Compress → Convert.
  - Easiest first; this validates the porting recipe before the harder tools.
  - Each port: copy `.jsx` → `.tsx`, add types, replace `window.X` reads with imports, run snapshot tests against the prototype.
  - Visual regression: open the prototype artboard side-by-side with the migrated widget rendered in Storybook.
- **Exit criterion:** all 8 tool widgets render in Storybook with no visual regressions vs. the prototype artboards.

### Phase 7 — Port SEO tool landing pages
- **Goal:** the eight `/<tool>-pdf` pages go live on `apps/marketing`, using the template from `docs/seo-tool-page-template.md`.
- **Action:**
  - For each tool, create `apps/marketing/src/pages/[lang]/<tool>-pdf.astro`.
  - Each page uses `ToolHeroLayout` (header → hero → trust strip → tool widget island → how-to → FAQ → related tools → footer).
  - The tool widget itself is hydrated via `client:load` from `@lunedoc/ui`.
  - JSON-LD blocks (`SoftwareApplication`, `FAQPage`, `HowTo`, `BreadcrumbList`) emitted from a centralized `src/seo/schema.ts`.
  - i18n via `astro:i18n` + `@lunedoc/i18n`.
  - hreflang tags on every locale variant.
- **Exit criterion:** all 24 pages (8 tools × 3 locales) render with valid JSON-LD (verified via Schema.org validator) and pass Lighthouse SEO ≥ 95.

### Phase 8 — Preserve prototype under `prototype/design-canvas`
- **Goal:** keep the prototype runnable forever as a design source, while production lives in `apps/`.
- **Action:**
  - `git mv index.html docs/components docs/stylesheets docs/index-html .design-canvas.state.json prototype/design-canvas/`
  - Add `prototype/README.md`: "this is the original design canvas; production surfaces live in `apps/`."
  - Update `docs/project-status.md` and `docs/monorepo-structure.md` to reflect the new shape.
  - Add a `.github/CODEOWNERS` rule (or equivalent) that requires acknowledgment when `prototype/` is modified — it should be a deliberate update, not drift.
- **Exit criterion:** `prototype/design-canvas/index.html` still runs; `apps/marketing` serves all live URLs; `apps/web` serves the app shell.

---

## 4. What NOT to migrate yet

Discipline: each item below has been considered and explicitly deferred. Pulling them in early breaks the phasing.

- **No backend implementation.** The migration plan above is purely frontend. `services/api/` stays empty until `docs/backend-api-plan.md` Phase 0 begins. Until then, tool widgets in the migrated frontends stay as visual mocks — the same `useState` + preview pattern as the prototype.
- **No Flutter app.** `apps/mobile/` is not even scaffolded yet. The web migration must finish (or at least Phase 6) so the design system and i18n are stable enough to consume from Dart.
- **No real PDF processing.** The widgets stay client-side mocks throughout the frontend migration. A real PDF engine in the browser (e.g., `pdf-lib`) is not on this plan — when the backend lands in Phase 7+, server-side processing replaces the mocks.
- **No big folder move yet.** Phase 8 is the only structural move, and it happens *after* the new apps are working. Until then, the prototype stays exactly where it is. No `git mv` of `docs/components/` until production is live.
- **No SSR for the app.** `apps/web` is a Vite SPA; do not introduce Next.js / Remix / Tanstack Start unless a concrete signed-in feature demands SSR.
- **No micro-frontend pattern.** Two apps + shared packages is enough. Don't introduce module federation, no single-spa, no iframe-based composition.

---

## 5. Recommended immediate next action

> **Do a final UI QA pass on the prototype before any framework migration begins.**

The cheapest mistake to make is to start porting unstable UI. Every redesign that lands after Phase 2 has to happen twice — once in the prototype, once in the new code — until Phase 6 closes the loop. That's a real tax.

The QA checklist lives in `docs/ui-qa-checklist.md`. Walk through it end to end:

1. **Every artboard, every locale (EN / TR / ES).** Look for clipped buttons, broken word wraps, mobile overflow, badly-positioned overlays.
2. **Every theme** (light / dark) on every artboard.
3. **Every accent color** (indigo / blue / emerald / graphite / amber) — at least one full pass to catch contrast regressions.
4. **Every tool's specific interactions** — see the per-tool checklist sections.
5. **Logo + brand consistency** — confirm no remaining "Paperline" or "P" mark anywhere user-visible.
6. **Browser console + network panel** — zero red errors, zero unexpected 404s.

Only when the checklist is green do we open Phase 2.

After QA, the second-most-valuable thing to lock down is **slug + URL strategy** (per `docs/seo-tool-page-template.md` §1). It's much cheaper to commit to URL shapes now than to renegotiate them once Astro routes exist.

---

*This plan is the frontend lane of a larger product roadmap. When the backend lane (per `docs/backend-api-plan.md`) catches up, the migrated tool widgets switch from local mocks to real API calls — and Lunedoc graduates from prototype to product.*

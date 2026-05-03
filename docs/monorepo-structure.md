# Lunedoc — Monorepo Structure (Target)

**Status:** documentation only. No restructuring will happen yet. This is the target architecture; we'll grow into it gradually as the prototype matures.

---

## 1. Current structure

The repository today is a single static prototype, intentionally simple:

```
lune-doc/
├── index.html                          ← active entrypoint (root)
├── .design-canvas.state.json           ← sidecar for design-canvas state
└── docs/
    ├── components/                     ← all JSX, loaded via <script type="text/babel">
    │   ├── design-canvas.jsx
    │   ├── tweaks-panel.jsx
    │   ├── ios-frame.jsx
    │   ├── browser-window.jsx
    │   ├── i18n.jsx
    │   ├── primitives.jsx
    │   ├── homepage.jsx
    │   ├── tool-page.jsx
    │   ├── auth-page.jsx
    │   ├── blog-page.jsx
    │   ├── tool-variants.jsx           (Merge, Split, Convert, Watermark, Sign, OCR, Edit)
    │   ├── tools-index-page.jsx
    │   ├── pricing-page.jsx
    │   ├── dashboard-page.jsx
    │   ├── article-page.jsx
    │   ├── system-inventory.jsx
    │   └── app.jsx                     ← composes everything; mounts to #root
    ├── stylesheets/
    │   └── tokens.css
    ├── index-html/                     ← reference screenshots (PNG)
    ├── project-status.md
    ├── backend-api-plan.md
    ├── seo-tool-page-template.md
    └── monorepo-structure.md           ← this file
```

Properties of the current layout:

- **Single-tier.** No build step, no package boundaries, no shared-code packages — every JSX file is loaded into one browser global namespace.
- **Living spec.** The `docs/components/*.jsx` files double as the design system reference. The `system-inventory` page renders all primitives on one screen.
- **Plain prose docs.** Every architectural decision lives as a markdown file under `docs/` rather than a wiki or external doc tool.

---

## 2. Target future monorepo structure

Once Lunedoc grows beyond the prototype, the target shape:

```
lune-doc/
├── apps/
│   ├── web/              # in-app workflow (Vite + React + TS) — app.lunedoc.app
│   ├── marketing/        # SEO landing + tool landing + blog (Astro recommended) — lunedoc.app
│   └── mobile/           # Flutter app — uses the same API as web
├── services/
│   └── api/              # FastAPI + Celery workers — api.lunedoc.app
├── packages/
│   ├── ui/               # shared design system (primitives, layout, icons)
│   ├── i18n/             # shared translations (EN/TR/ES + future locales)
│   ├── config/           # shared tsconfig, eslint, prettier, vitest configs
│   └── sdk/              # generated API clients (TS for web/marketing, Dart for mobile)
├── infra/
│   ├── docker/           # Dockerfiles for api/worker; docker-compose for local dev
│   ├── nginx/            # reverse proxy config (or Caddy, equivalently)
│   └── deployment/       # IaC (Terraform, Pulumi, or fly.toml/k8s manifests)
├── docs/
│   ├── project-status.md
│   ├── backend-api-plan.md
│   ├── seo-tool-page-template.md
│   └── monorepo-structure.md
└── prototype/
    └── design-canvas/    # current static prototype, archived as design source
```

### Why this shape

- **`apps/` separates user-facing surfaces.** Each app has its own deploy, its own Dockerfile, and its own release cadence. Marketing can ship daily without touching the web app.
- **`services/` separates server-side processes.** Today only `api/`; tomorrow possibly a separate `worker/` or `gateway/`.
- **`packages/` is the multiplier.** Anything used by ≥ 2 apps (UI primitives, i18n strings, the API SDK) lives here. This is what makes the monorepo worth doing — without shared packages it's just three folders.
- **`infra/` is single-source-of-truth for deployment.** Keeps Dockerfiles, nginx configs, and Terraform out of app code.
- **`prototype/` preserves the design canvas as a living spec.** It's not deleted when we migrate — it remains the place where new tool layouts are sketched before they ship.

### Tooling assumption

- **Package manager + workspace runner:** `pnpm` workspaces are the safest default for the JS/TS side (apps + packages). Faster than npm/yarn, smaller node_modules, first-class workspace support.
- **Cross-language builds:** Python (`services/api`) and Dart (`apps/mobile`) live alongside; their dependency managers (Poetry, pub) operate independently. The monorepo is *organizational*, not a single build graph.
- **Task runner (later, optional):** Turborepo or Nx if/when JS build times grow. Not needed at MVP scale.

---

## 3. Migration path from current prototype

**Do not move files immediately.** The current prototype is the design source of truth and must remain runnable throughout the migration. Files only move when their replacement in `apps/` is verified equivalent.

### Phase 1 — Keep current prototype stable
- No structural changes.
- Continue iterating on tool pages and i18n inside `docs/components/` as needed.
- Use the prototype to lock down the design before any framework adoption.
- **Exit criterion:** all 8 tool pages are visually final; no major UI changes expected for ≥ 2 weeks.

### Phase 2 — Create `apps/web` with Vite
- `pnpm create vite apps/web --template react-ts`.
- Install React Router (or TanStack Router), Vitest, ESLint, Prettier.
- Set up `vite.config.ts` aliases (`@ui/*`, `@i18n/*`).
- Verify it builds and serves an empty "Hello Lunedoc" page locally.
- **No prototype code touched yet.**
- **Exit criterion:** `pnpm --filter web dev` starts a working dev server with HMR.

### Phase 3 — Port tokens.css + primitives
- Move `docs/stylesheets/tokens.css` → `packages/ui/src/tokens.css` (or stay alongside primitives — see §6).
- Convert `docs/components/primitives.jsx` (Logo, LogoMark, Icon, Header, Footer, MobileBottomNav, LangSwitch, ToolIcon, ToolCard, PdfThumb, TOOLS) into typed React components in `packages/ui/src/`.
- Each becomes a real ES module with named exports — no more `Object.assign(window, …)`.
- Set up `@testing-library/react` for snapshot tests on every primitive.
- **Exit criterion:** every primitive imports from `@lunedoc/ui` and renders identically to the prototype version.

### Phase 4 — Port i18n
- Convert `docs/components/i18n.jsx` (`I18N_STRINGS`, `useI18n`, `I18N_ARTICLES`) into `packages/i18n/`.
- Decide on the runtime: `react-i18next`, `lingui`, or a thin custom hook (current shape is essentially a thin custom hook — keep it).
- Externalize the string tables into per-locale JSON files (`packages/i18n/src/locales/{en,tr,es}.json`) so translators can edit without touching code.
- **Exit criterion:** `useI18n('tr')` in `apps/web` returns the same strings as the prototype's TR mode.

### Phase 5 — Port tool pages
- Move tool pages (`homepage`, `tool-page`, `tool-variants`, `tools-index-page`, `pricing-page`, `dashboard-page`, `auth-page`, `blog-page`, `article-page`, `system-inventory`) one at a time into `apps/web/src/pages/` (or `apps/marketing/` for landing pages — see §4).
- Each port:
  1. Copy JSX → TSX, add types.
  2. Replace `window.X` reads with real ES imports.
  3. Verify against the prototype artboard side-by-side.
- **Exit criterion:** the migrated app renders all current pages with no visual regressions (compare to the design canvas).

### Phase 6 — Introduce real routes
- React Router (or TanStack) at `apps/web` with concrete URLs:
  `/`, `/tools`, `/pricing`, `/blog`, `/blog/:slug`, `/signin`, `/register`, `/app/...`
- Tool URLs (`/compress-pdf`, `/merge-pdf`, …) move to `apps/marketing` per §4 — they're SEO landing pages, not in-app routes.
- Add a 404 page and a top-level error boundary.
- **Exit criterion:** every artboard from the prototype has a corresponding live URL; deep-linking works.

### Phase 7 — Move the prototype into `prototype/design-canvas`
- `git mv index.html docs/components docs/stylesheets docs/index-html .design-canvas.state.json prototype/design-canvas/`
- Add a `prototype/README.md` explaining: this is the original design canvas, kept for reference; all production surfaces live in `apps/`.
- Update `docs/project-status.md` to reflect the new structure.
- **Exit criterion:** `prototype/design-canvas/index.html` still runs unchanged; production lives in `apps/`.

Phases 1–6 happen incrementally. Phase 7 is the final cutover. **Both layouts coexist** during phases 2–6 — the prototype runs from root `index.html`, the new web app runs from `apps/web`.

---

## 4. Frontend app split

Three frontends, each with a distinct job:

### `apps/marketing/` — public, SEO-first
- **URL:** `lunedoc.app`
- **Stack:** Astro (preferred) or Next.js (if SSR-on-demand becomes valuable).
- **Purpose:** the marketing surface — homepage, all `/<tool>-pdf` landing pages, `/pricing`, `/blog`, `/blog/:slug`, `/about`, `/legal/*`.
- **Why separate from `web`:** these pages live or die by SEO. They need pre-rendered HTML in the response, fast TTFB, and page-level caching at the edge. None of that is what the in-app workflow needs.
- **Tool widgets** on landing pages are React **islands** (Astro `client:load` directives) hydrated only on the relevant page. The widget itself is imported from a shared package.

### `apps/web/` — authenticated, app-shell
- **URL:** `app.lunedoc.app`
- **Stack:** Vite + React + TypeScript + React Router.
- **Purpose:** the actual product — the tool workflow once a user has uploaded a file, the dashboard, account settings, billing.
- **Why separate from `marketing`:** SPAs are the right shape for stateful, authenticated workflows. No SEO concern (these routes are gated). Optimizes for app-feel, not first paint.

### `apps/mobile/` — Flutter, later
- **Stack:** Flutter, Dart.
- **Purpose:** native iOS + Android client. Talks to the same `services/api` over the same JSON contracts.
- **Why same monorepo:** the mobile team needs constant sight of i18n strings, API SDK, and product decisions captured in `docs/`. Splitting into a separate repo creates drift.
- **Build pipeline runs independently** from the JS apps; this is fine.

### Shared between marketing + web

- `@lunedoc/ui` — primitives (Logo, Icon, Button, Card, …).
- `@lunedoc/i18n` — string tables.
- `@lunedoc/sdk` — typed API client.
- The actual tool widgets (Compress, Merge, OCR, Edit, …) — also in `@lunedoc/ui` or in a separate `@lunedoc/tools` package, depending on weight.

---

## 5. Backend placement

`services/api/` is the only server-side surface at MVP. Per the design captured in `docs/backend-api-plan.md`:

- **Stack:** Python + FastAPI (API layer) + Celery (workers) + Redis (broker + rate-limit cache) + Postgres (users, jobs index, audit log).
- **PDF engines:** PyMuPDF (most tools), Ghostscript (Compress), LibreOffice headless (Convert), Tesseract (OCR), Pillow (image work).
- **Storage:** local disk in dev (`STORAGE_ROOT=/var/lib/lunedoc`), Cloudflare R2 in prod. Wrapped behind a single `Storage` interface so call sites don't change.
- **Worker pools:** light (sign/edit/watermark/merge/split), heavy-cpu (compress/convert), ocr (OCR only). Each scales independently.

Layout inside `services/api/`:

```
services/api/
├── pyproject.toml
├── Dockerfile
├── src/lunedoc_api/
│   ├── main.py             # FastAPI app
│   ├── routes/
│   │   ├── files.py
│   │   ├── jobs.py
│   │   ├── auth.py
│   │   └── me.py
│   ├── tools/              # one module per tool
│   │   ├── compress.py
│   │   ├── merge.py
│   │   └── …
│   ├── workers/            # Celery task definitions
│   ├── storage.py          # Storage abstraction
│   ├── models/             # SQLAlchemy + Pydantic
│   └── settings.py
└── tests/
```

**No backend implementation yet.** The folder will be created when Phase 0 of the backend plan begins (per `docs/backend-api-plan.md` §8). Until then this is a placeholder in the target structure — *not* an empty directory in the repo.

---

## 6. Shared package plan

Each package is a real workspace (`packages/<name>/package.json`), versioned together with the apps.

### `packages/ui/`
- Design tokens (`tokens.css`).
- Primitives: Logo, LogoMark, Icon, Header, Footer, MobileBottomNav, LangSwitch.
- Layout primitives: Card, Button, Input, Label, Chip.
- Tool widgets (or split into `packages/tools/` if they grow large): UploadStrip, ResultPreview, plus per-tool widgets (CompressTool, MergeTool, … OCRTool, EditTool).
- Storybook setup so the design system can be browsed independently of any app.
- Strict accessibility tests (axe-core in test runner).

### `packages/i18n/`
- Per-locale JSON files: `locales/en.json`, `locales/tr.json`, `locales/es.json`.
- A typed `useI18n(lang)` hook that returns `{ t, lang }`.
- A small CLI (`pnpm i18n:check`) that flags missing keys per locale.
- Eventually: integration with Lokalise / Crowdin / Phrase for translator workflow.

### `packages/sdk/`
- **TS SDK:** generated from `services/api`'s OpenAPI schema (`openapi-generator-cli` or `openapi-typescript-codegen`). Imported by both `apps/web` and `apps/marketing`.
- **Dart SDK:** generated from the same schema for `apps/mobile`. Lives in `packages/sdk/dart/` (or `apps/mobile/lib/sdk/` if Flutter tooling fights us).
- Re-generation is a CI step on every API release. Hand-editing generated code is forbidden.

### `packages/config/`
- Shared `tsconfig.base.json`, `tsconfig.lib.json`, `tsconfig.app.json`.
- Shared ESLint config (`@lunedoc/eslint-config`).
- Shared Prettier config.
- Shared Vitest config.
- Each app/package extends from these and overrides only what it needs. Without this, lint/format drift is inevitable.

### Naming convention
- Workspace package names use the `@lunedoc/` scope: `@lunedoc/ui`, `@lunedoc/i18n`, `@lunedoc/sdk`, `@lunedoc/config`, `@lunedoc/eslint-config`.
- Apps (`web`, `marketing`, `mobile`) and services (`api`) keep simple names — they're not published.

---

## 7. Git hygiene

### `.gitignore`
- `.gitignore` already exists at the repo root. As we add apps/services, append per-tool sections (Vite `dist/`, Astro `_astro/`, Python `__pycache__/`, `.venv/`, `*.pyc`, Flutter `build/`, `.dart_tool/`, `pubspec.lock` only at app level, etc.).

### Never commit
- **`.env` files** of any kind. Only `.env.example` with empty placeholders.
- **Uploaded files / processing results / temporary artifacts.** No PDFs from local testing should ever land in a commit. Add `services/api/storage/` (or wherever local dev storage lives) to `.gitignore`.
- **Database files.** No `*.db`, `*.sqlite`, `dump.rdb`.
- **OS / editor cruft.** `.DS_Store`, `Thumbs.db`, `.idea/workspace.xml`, `.vscode/` (except `.vscode/extensions.json` if shared).
- **Build artifacts.** `dist/`, `build/`, `.next/`, `.astro/`, `node_modules/`, `__pycache__/`.
- **Credentials of any kind.** Anything that even looks like a token/key should be quarantined to a secret manager and referenced via env.

### Branch hygiene
- `main` is protected; merges via PR.
- Feature branches: `feat/<scope>-<short-desc>`, `fix/<scope>-<short-desc>`, `docs/<short-desc>`, `chore/<short-desc>`.
- One concern per PR; smaller is better.

### Commit messages
- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `build:`, `ci:`, `perf:`).
- Scope where useful: `feat(ui): add CompressTool widget`.
- Body explains *why*, not *what* (the diff already shows what).
- No machine-generated trailers (no `Co-Authored-By: <bot>`, no `Generated with …`).

### Docs stay current
- When implementation diverges from a doc, update the doc in the same PR. A stale `project-status.md` is worse than no doc.
- The four docs in `docs/` are the canonical architecture record. Anything important enough to argue about belongs here, not in a chat history.

---

## 8. Recommendation

> **Do not restructure the repository yet.**
> Keep current files where they are until Phase 2 of the migration begins (Vite scaffolding under `apps/web/`).
> Use this document as the target architecture — every new file added between now and then should be placed somewhere defensible against this layout, but no existing file should be moved.

The single decision worth making *now*:

- **Adopt `pnpm` as the package manager** the moment we add a `package.json` anywhere — even for `apps/web`. Switching package managers later is friction we don't need.

Everything else waits. Premature restructuring on a one-person prototype is a tax with no payoff. We earn the monorepo structure by needing it.

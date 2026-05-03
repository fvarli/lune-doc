# Lunedoc — Phase 2: Vite Scaffold Plan

**Status:** documentation only. Phase 2 has **not** started. The current prototype (`index.html` + `docs/components/*.jsx`) remains the canonical UI source until this plan's acceptance criteria are met.

**Companion docs:**
- `docs/frontend-migration-plan.md` — the full 8-phase frontend journey; this doc expands Phase 2 only.
- `docs/monorepo-structure.md` — the target repository layout we're growing into.
- `docs/ui-qa-checklist.md` — the gate that authorized opening Phase 2.

**Goal of Phase 2:** stand up `apps/web` (Vite + React + TypeScript) as an empty workspace alongside the prototype, with the toolchain ready (router, test runner, lint, format), and **without touching a single line of the prototype**. End state: a "Hello Lunedoc" page from the new app, the prototype still serves at `http://localhost:8765/`.

---

## 1. pnpm workspace structure (initial)

Phase 2 introduces only the minimum needed to host `apps/web`. No packages, no other apps, no services. Add those in later phases.

```
lune-doc/
├── package.json                # root, workspace-only (private: true)
├── pnpm-workspace.yaml         # declares apps/* and packages/*
├── .npmrc                      # pinned, see §1.3
├── tsconfig.base.json          # shared TS config (apps extend this)
├── .nvmrc                      # pin Node version (LTS)
├── .gitignore                  # append node_modules, dist, .vite, .turbo
├── apps/
│   └── web/                    # Vite + React + TS workspace (this phase)
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── router.tsx
│       │   └── pages/
│       │       └── HelloLunedoc.tsx
│       ├── public/
│       └── tests/
├── packages/                   # empty directory, populated in Phase 4+
├── docs/                       # untouched
├── index.html                  # prototype, untouched
├── .design-canvas.state.json   # prototype sidecar, untouched
└── (existing docs/components/, docs/stylesheets/, docs/index-html/)
```

### 1.1 `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 1.2 Root `package.json`

```json
{
  "name": "lunedoc",
  "private": true,
  "version": "0.0.0",
  "engines": { "node": ">=20.10.0", "pnpm": ">=9.0.0" },
  "scripts": {
    "web:dev":   "pnpm --filter web dev",
    "web:build": "pnpm --filter web build",
    "web:test":  "pnpm --filter web test",
    "web:lint":  "pnpm --filter web lint",
    "prototype:serve": "python3 -m http.server 8765"
  }
}
```

The `prototype:serve` script keeps the prototype as a first-class dev surface with a memorable command.

### 1.3 `.npmrc`

```
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=false
```

We deliberately keep `shamefully-hoist=false` so undeclared dependencies surface as failures rather than silently working.

### 1.4 `.nvmrc`

Pin to current LTS (Node 22.x as of 2026-05). Match the user's local install where possible.

```
22
```

### 1.5 Root `.gitignore` additions

Append these lines (the existing `.gitignore` already covers `.idea/` etc.):

```
# pnpm / node
node_modules/
.pnpm-store/

# Vite outputs
apps/*/dist/
apps/*/.vite/
apps/*/.vitest/
apps/*/coverage/

# build caches
.turbo/

# editor
.vscode/*
!.vscode/extensions.json
```

---

## 2. Exact scaffold commands

Run from the repo root, in order. Every command is reversible by deleting the resulting files / directories.

### 2.1 Sanity prerequisites

```bash
node --version           # expect v22.x
corepack enable          # enables pnpm via Node corepack (preferred over global install)
corepack prepare pnpm@latest --activate
pnpm --version           # expect 9.x or newer
```

If `corepack` isn't available, fall back to `npm install -g pnpm`.

### 2.2 Initialize the workspace

```bash
# from repo root
echo "22" > .nvmrc
printf '%s\n' \
  'auto-install-peers=true' \
  'strict-peer-dependencies=false' \
  'shamefully-hoist=false' > .npmrc
printf '%s\n' \
  'packages:' \
  '  - "apps/*"' \
  '  - "packages/*"' > pnpm-workspace.yaml

# create root package.json (use the JSON above)
# create tsconfig.base.json (use the snippet in §3)
# create empty packages/ directory so workspace glob matches without warnings
mkdir -p packages
touch packages/.gitkeep

# append to .gitignore
cat >> .gitignore <<'EOF'

# pnpm / node
node_modules/
.pnpm-store/

# Vite outputs
apps/*/dist/
apps/*/.vite/
apps/*/.vitest/
apps/*/coverage/

# build caches
.turbo/

# editor
.vscode/*
!.vscode/extensions.json
EOF

git add .nvmrc .npmrc pnpm-workspace.yaml package.json tsconfig.base.json packages/.gitkeep .gitignore
git commit -m "chore: initialize pnpm workspace"
```

### 2.3 Scaffold `apps/web` with Vite

```bash
mkdir -p apps
cd apps
pnpm create vite@latest web --template react-ts
cd ..
```

Then trim `apps/web/package.json` to remove the default `name: "web"` if it conflicts; rename to `@lunedoc/web` for consistency with the future `@lunedoc/*` packages.

### 2.4 Add the runtime + tooling

```bash
pnpm --filter web add react-router-dom
pnpm --filter web add -D \
  vitest \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jsdom \
  eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks \
  prettier eslint-config-prettier \
  @types/node
```

### 2.5 Wire up Vite + Vitest + ESLint

In `apps/web/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // future workspace packages will be picked up via pnpm-workspace.yaml directly:
      // '@lunedoc/ui', '@lunedoc/i18n', etc.
    },
  },
  server: {
    port: 5173,             // distinct from the prototype's 8765
    strictPort: true,       // fail loudly if 5173 is taken
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

In `apps/web/eslint.config.js`: standard react-ts lint config + prettier.

### 2.6 Verify `apps/web` boots

```bash
pnpm --filter web dev
# open http://localhost:5173 — should show "Hello Lunedoc" (after editing src/App.tsx)
pnpm --filter web build
pnpm --filter web test --run
pnpm --filter web lint
```

When all four green, commit:

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): scaffold apps/web with Vite + React + TS"
```

---

## 3. `tsconfig.base.json`

Single source of truth all apps/packages extend.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`apps/web/tsconfig.json` extends this and adds `include`, `paths`, and bundler-specific flags.

---

## 4. How the current prototype stays untouched

Hard rule for Phase 2: **zero edits** to any of the following.

- `index.html` (prototype entrypoint — note: distinct from the future `apps/web/index.html`)
- `.design-canvas.state.json`
- `docs/components/**/*.jsx`
- `docs/stylesheets/tokens.css`
- `docs/index-html/**`
- `docs/*.md` (except this file, which gets a "Phase 2 started" banner once work begins)

Verification mechanism:
1. **Two ports, two stacks.** Prototype keeps serving at `http://localhost:8765/` (`pnpm prototype:serve`). New app boots at `http://localhost:5173/` (`pnpm web:dev`). Run both simultaneously to confirm parallel operation.
2. **Pre-commit hint:** add a Husky-or-equivalent guard later (Phase 3+) that flags any change under `docs/components/` or `docs/stylesheets/` while Phase 2 work is open. Not blocking for Phase 2 itself; just a future safeguard.
3. **Smoke probe at end of Phase 2.** Re-run the headless probe used in the QA pass (verifies prototype still renders 32 artboards with zero console errors). It must still pass exactly as before.

If any of these are violated mid-phase, **revert the offending diff before proceeding**. The prototype must remain runnable until Phase 8 cutover.

---

## 5. First migration target order

Phase 2 itself doesn't migrate any prototype code. But it sets up the directory structure and tooling that Phases 3–6 will use. The code-migration order is fixed and intentional:

1. **Tokens** (`docs/stylesheets/tokens.css`) → `packages/ui/src/tokens.css`.
   - Smallest, no JS, validates the package boundary works.
2. **Primitives** (`docs/components/primitives.jsx`) → `packages/ui/src/primitives/*.tsx`.
   - Logo, Icon, Header, Footer, MobileBottomNav, LangSwitch, ToolIcon, ToolCard, PdfThumb, TOOLS table.
   - Validates the typing strategy and the design system import path.
3. **i18n** (`docs/components/i18n.jsx`) → `packages/i18n/`.
   - String tables externalized to JSON; `useI18n` re-exported.
   - Validates non-trivial data migration without a build dependency on `@lunedoc/ui`.
4. **Shell frames** (`docs/components/{ios-frame,browser-window,design-canvas,tweaks-panel}.jsx`).
   - Move only the bits the new app actually needs. `design-canvas` and `tweaks-panel` may stay prototype-only and never migrate — they're design tooling, not product UI.
5. **Tool pages** (`docs/components/tool-page.jsx` + the 7 tools in `tool-variants.jsx` + `tools-index-page.jsx`, `homepage.jsx`, `pricing-page.jsx`, etc.).
   - Port one at a time. Easiest first: Merge → Split → Watermark → Sign → Edit → OCR → Compress → Convert.
   - For each, verify visually against the prototype artboard side-by-side.

**Phase 2 stops at step 0.** Only the workspace and `apps/web` skeleton. Steps 1–5 belong to Phases 3–6.

---

## 6. Rollback plan

Every Phase 2 change is in a contiguous set of commits on `main` (or a feature branch — recommended: `phase-2/scaffold`). Rollback is `git revert` or `git reset --hard`, with the prototype unaffected because it lives outside `apps/`.

Rollback procedures by failure mode:

| Failure | Rollback |
|---|---|
| Vite scaffold misconfigured; `pnpm --filter web dev` doesn't start | `rm -rf apps/web pnpm-lock.yaml node_modules` then re-run §2.3. |
| pnpm workspace itself misbehaves (lockfile conflicts, peer dep loops) | `git revert <workspace-init-commit>` and try `pnpm@<previous-version>`. |
| Some prototype script accidentally got a `?v=` change or a touch | `git checkout HEAD~ -- index.html docs/components docs/stylesheets`. |
| Headless smoke probe shows the prototype broke | `git revert <every-phase-2-commit>` and re-run probe to confirm baseline restored. |

**Branch hygiene:** do Phase 2 on a feature branch, not directly on `main`. Open a PR. Merge only when §7 acceptance is fully green.

```bash
git checkout -b phase-2/scaffold
# … all the work above …
git push -u origin phase-2/scaffold
gh pr create --title "Phase 2: scaffold apps/web with Vite + React + TS" --base main
```

---

## 7. Acceptance criteria

Phase 2 is **DONE** only when every item below is true. If any is false, fix it before merging the PR.

### 7.1 Prototype invariants (regression gates)
- [ ] `python3 -m http.server 8765` from repo root still serves the prototype at `http://localhost:8765/`.
- [ ] Headless probe (same script used in the QA pass): all 9 sections + 32 artboards render; **0 console errors**; brand consistency clean (Lunedoc 76+×, Paperline 0×).
- [ ] No file under `docs/components/`, `docs/stylesheets/`, or `docs/index-html/` is modified by any commit on the Phase 2 branch.
- [ ] `index.html`, `.design-canvas.state.json` are unchanged.

### 7.2 Workspace exists and is consistent
- [ ] `pnpm install` from repo root completes with no peer-dep errors.
- [ ] `pnpm-workspace.yaml`, `.npmrc`, `.nvmrc`, `tsconfig.base.json` present.
- [ ] Root `package.json` has the four `web:*` scripts and the `prototype:serve` script.
- [ ] `packages/` exists (with `.gitkeep`) so the workspace glob doesn't warn.

### 7.3 `apps/web` boots and is healthy
- [ ] `pnpm web:dev` starts a Vite dev server on **port 5173**, serves a "Hello Lunedoc" page.
- [ ] `pnpm web:build` produces `apps/web/dist/` with valid HTML + JS.
- [ ] `pnpm web:test --run` exits 0 (one trivial smoke test is enough).
- [ ] `pnpm web:lint` exits 0.
- [ ] React Router is installed and at least one `<Route>` is wired up.
- [ ] TypeScript: `tsc --noEmit` (run via `pnpm --filter web exec tsc --noEmit`) reports zero errors.

### 7.4 Both stacks coexist
- [ ] With the prototype on 8765 and `web:dev` on 5173 simultaneously, both pages load with no console errors.

### 7.5 Documentation
- [ ] `docs/project-status.md` is updated: §6 adds a "Vite scaffold landed" bullet; §8 R3 (Vite migration plan) status moves from "todo" to "in progress" with this branch named.
- [ ] This file (`docs/phase-2-vite-scaffold-plan.md`) gets a "✓ DONE (yyyy-mm-dd)" banner at the top with the commit range.

When all 7.1–7.5 items pass, merge the `phase-2/scaffold` PR. Phase 3 (extract tokens + primitives into `packages/ui`) becomes the next workstream.

---

*Phase 2 is the only "infrastructure" phase. Phases 3–6 are code-migration. Treat this scaffold as a one-time investment — get the toolchain right and every later phase is mostly file-move + type-add.*

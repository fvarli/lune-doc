# Lunedoc — Phase 3: `@lunedoc/ui` Extraction Plan

> **✓ DONE (2026-05-03)** — commits `8305501..44f8f79` on branch `phase-2/scaffold` (5 commits, one per step).
>
> Acceptance criteria §6.1, §6.2, §6.3, §6.4 all green. §6.5 (this doc updated, plus `project-status.md`) closed in the `docs: mark Phase 3 UI extraction complete` follow-up.
>
> **What now lives in `@lunedoc/ui`:** `tokens.css`; `BRAND_NAME`, `Logo`, `LogoMark`; `Icon` + `IconName` (46-value union); `TOOLS` (typed via `as const satisfies`), `ToolIcon`, `ToolCard`, `PdfThumb`, `Tool`/`ToolKey`/`ToolCategory` types; `Header`, `Footer`, `MobileBottomNav`, `LangSwitch`; `Lang` type.
>
> **Known temporary limitation:** `Header`, `Footer`, `MobileBottomNav`, and `ToolCard` use a local `t = (k: string) => k` stub. Until Phase 4 lands `@lunedoc/i18n`, labels in those components render as their i18n keys (`nav_tools`, `foot_copy`, `t_merge`, etc.) — visible signal that translations are still pending.

**Status:** ✓ DONE (see banner above). The original "what we plan to do" body is preserved below for historical context. The prototype (`index.html` + `docs/components/*.jsx`) was untouched throughout — it remains the canonical UI source until Phase 8 cutover.

**Companion docs:**
- `docs/frontend-migration-plan.md` — full 8-phase journey; this doc expands Phase 3.
- `docs/phase-2-vite-scaffold-plan.md` — what Phase 2 produced (the scaffold this phase consumes).
- `docs/monorepo-structure.md` — long-term workspace target.

**Branch convention:** open `phase-3/ui-package` off `main` (after `phase-2/scaffold` is merged) — or off `phase-2/scaffold` if Phase 2 hasn't merged yet. PR-only into main.

---

## 1. Scope of Phase 3

**One job:** make `packages/ui` real — design tokens + the design-system primitives the prototype defines in `docs/components/primitives.jsx` — and consume it from `apps/web` so the new app renders an honest Lunedoc header instead of the placeholder "Hello Lunedoc" shipped in Phase 2.

In scope:
- Move `tokens.css` into `@lunedoc/ui` and import it from `apps/web`.
- Port the primitives (Logo, LogoMark, Icon, Header, Footer, MobileBottomNav, LangSwitch, ToolIcon, ToolCard, PdfThumb, the `TOOLS` table) from JSX → typed TSX inside `@lunedoc/ui`.
- Wire `apps/web/src/App.tsx` to render the real `<Header />` from `@lunedoc/ui`.

Out of scope (deferred to later phases):
- i18n string-table extraction → Phase 4 (`@lunedoc/i18n`).
- Tool widgets (Compress / Merge / … / Edit) → Phase 6.
- Tool landing pages → Phase 7.
- Routing — `apps/web` stays single-page in Phase 3.
- Storybook setup — desirable but optional; can land in Phase 3 or be a follow-up. Not gating.
- Deleting prototype files — explicitly forbidden until Phase 8.

---

## 2. Source files (read-only inputs)

| Source | Purpose |
|---|---|
| `docs/stylesheets/tokens.css` | Color, type, spacing, shadow tokens; `:root` light + `[data-theme="dark"]` overrides; the `.pl-*` reset and base classes. |
| `docs/components/primitives.jsx` | The component definitions to port. Specifically: `Logo`, `LogoMark`, `Icon` (with the full glyph switch), `Header`, `Footer`, `MobileBottomNav`, `LangSwitch`, `ToolIcon`, `ToolCard`, `PdfThumb`, and the `TOOLS` array. |

These files are **not** modified or moved in Phase 3. They remain the prototype's source of truth.

---

## 3. Target files (the new package)

```
packages/ui/
├── package.json                  # @lunedoc/ui — already exists from Phase 2 scaffold
├── tsconfig.json                 # extends ../../tsconfig.base.json
├── src/
│   ├── index.ts                  # public API barrel
│   ├── tokens.css                # ← copy of docs/stylesheets/tokens.css
│   ├── logo/
│   │   └── Logo.tsx              # Logo + LogoMark + BRAND_NAME
│   ├── icons/
│   │   └── Icon.tsx              # Icon component + glyph map (the SVG switch)
│   ├── layout/
│   │   ├── Header.tsx            # desktop + mobile Header in one file
│   │   ├── Footer.tsx
│   │   ├── MobileBottomNav.tsx
│   │   └── LangSwitch.tsx
│   ├── tools/
│   │   ├── ToolCard.tsx
│   │   ├── ToolIcon.tsx
│   │   ├── PdfThumb.tsx
│   │   └── tools.ts              # the TOOLS array (typed)
│   └── types.ts                  # shared union types: Lang, ToolKey, Tone, etc.
```

### 3.1 `packages/ui/package.json`

Update the placeholder from Phase 2:

```json
{
  "name": "@lunedoc/ui",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/tokens.css"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

`peerDependencies` (not `dependencies`) — the app provides React; the library doesn't bundle its own copy.

### 3.2 `packages/ui/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "noEmit": true
  },
  "include": ["src"]
}
```

`noEmit: true` — Vite (in `apps/web`) compiles `@lunedoc/ui` source directly via path resolution; we don't ship a built artifact yet. (A real build step lands later if/when this package is published outside the monorepo.)

### 3.3 `packages/ui/src/index.ts` (barrel)

```ts
export { Logo, LogoMark, BRAND_NAME } from './logo/Logo';
export { Icon, type IconName } from './icons/Icon';
export { Header } from './layout/Header';
export { Footer } from './layout/Footer';
export { MobileBottomNav } from './layout/MobileBottomNav';
export { LangSwitch } from './layout/LangSwitch';
export { ToolCard } from './tools/ToolCard';
export { ToolIcon } from './tools/ToolIcon';
export { PdfThumb } from './tools/PdfThumb';
export { TOOLS, type Tool, type ToolKey, type ToolCategory } from './tools/tools';
export type { Lang } from './types';
```

---

## 4. Extraction order

Strict order. Each step compiles and renders before the next begins. Don't bundle steps.

### Step 1 — Tokens
- Copy `docs/stylesheets/tokens.css` → `packages/ui/src/tokens.css` byte-for-byte. No edits.
- In `apps/web/src/main.tsx`, replace the default Vite `index.css` import with: `import '@lunedoc/ui/tokens.css'`.
- (Keep `apps/web/src/index.css` for app-shell-only styles, or delete if empty.)
- **Verify:** `pnpm --filter @lunedoc/web build` passes; running `pnpm web:dev`, the page background and font tokens shift to match the prototype.

### Step 2 — Logo / LogoMark
- Port `Logo` + `LogoMark` + `BRAND_NAME` from `primitives.jsx` (lines 4–36) into `packages/ui/src/logo/Logo.tsx`.
- Add typed props: `size?: number`, `name?: string`.
- Replace the inline-style object with the same inline-style object (no JSX-style refactor in this step).
- Export from `packages/ui/src/index.ts`.
- In `apps/web/src/App.tsx`, replace the inline-SVG hello mark with `<Logo size={20} />`.
- **Verify:** the Hello Lunedoc page renders the real Lunedoc logo; build still passes.

### Step 3 — Icon
- Port the `Icon` component from `primitives.jsx` (the big `name`-switch with ~50 SVG paths) into `packages/ui/src/icons/Icon.tsx`.
- Type the `name` prop as a string-literal union: `type IconName = "merge" | "split" | … | "ocr"` etc.
- Export `Icon` and `IconName` from the barrel.
- **Verify:** add a `<Icon name="ocr" />` next to the logo in `App.tsx` for a quick visual smoke test.

### Step 4 — ToolIcon, ToolCard, PdfThumb (and the `TOOLS` array)
- Port `ToolIcon`, `ToolCard`, `PdfThumb` into `packages/ui/src/tools/`.
- Port the `TOOLS` array into `packages/ui/src/tools/tools.ts` with strict types: `interface Tool { key: ToolKey; icon: IconName; cat: ToolCategory; tone: number; }`.
- `ToolCard` and `ToolIcon` consume `Icon` from the same package via `import { Icon } from '../icons/Icon';`.
- **Verify:** drop `<ToolCard tool={TOOLS[0]} />` (or similar) into `App.tsx` for a smoke test; build passes.

### Step 5 — Header / Footer / MobileBottomNav / LangSwitch
- Port these last because they consume everything above.
- `Header` accepts the same `lang`, `setLang`, `mobile`, `transparent`, `active` props as the prototype's `Header`.
- For Phase 3, `useI18n` is **not yet ported** (that's Phase 4). Provide a temporary local stub: a constant `t = (k: string) => k` in the new `Header` that returns the key as the string. This makes the Header render in `apps/web` without `@lunedoc/i18n` existing yet. Replace with the real hook in Phase 4.
- Wire `<Header />` into `apps/web/src/App.tsx`.
- **Verify:** the Hello Lunedoc page now renders a real Lunedoc header (logo + nav + sign-in/get-started buttons). The nav labels show as raw keys (`nav_tools`, `nav_pricing`, …) — that's expected in Phase 3 and is the visible signal that i18n is the next phase's job.

---

## 5. Rules

**Hard constraints for this phase. Violations should fail PR review.**

1. **Prototype remains untouched.** Zero edits under `docs/components/`, `docs/stylesheets/`, `docs/index-html/`, `index.html`, or `.design-canvas.state.json`. The prototype must keep serving at `http://localhost:8765/` exactly as before.
2. **First implementation may duplicate code into `packages/ui`.** The prototype's primitives stay where they are; we copy them, we don't move them. Single-source-of-truth happens in Phase 8 (cutover), not now.
3. **Do not delete or move `docs/components/*`.** Even if a file's contents are now duplicated in `packages/ui/src/...`, the original stays. Same rule for `docs/stylesheets/tokens.css`.
4. **Use TypeScript props.** No `any`. No `// @ts-ignore`. Strict mode is on (`tsconfig.base.json`). If a port surfaces a real typing question, ask before suppressing.
5. **Avoid global `window` dependencies.** The prototype uses `const { useI18n } = window;`. The ported code must accept dependencies via props, imports, or context — never `window`. Specifically:
   - `Logo` reads `BRAND_NAME` from a module-scoped const, not `window.BRAND_NAME`.
   - `Header` does NOT read `useI18n` from `window`; in Phase 3 it uses the local stub described in §4 step 5.
6. **No new runtime deps unless justified.** A primitive that previously rendered without an external lib must continue to render without one. This is a port, not a rewrite.
7. **Inline styles preserved.** The prototype's inline-`style={{ … }}` object pattern carries over verbatim. Don't refactor to CSS modules / vanilla-extract / styled-components in this phase. Refactor lands in a separate PR if justified later.
8. **Side effects forbidden in `index.ts`.** The barrel exports values; it does not run code. Token CSS is imported at the app's entry point (`apps/web/src/main.tsx`), not from the package barrel.

---

## 6. Acceptance criteria

Phase 3 is **DONE** only when every item below is true. If any is false, fix it before merging.

### 6.1 Build & install health
- [ ] `pnpm install` from repo root succeeds with no peer-dep errors.
- [ ] `pnpm --filter @lunedoc/web build` passes (TypeScript clean + Vite production build OK).
- [ ] `pnpm --filter @lunedoc/web lint` passes (zero errors, zero warnings).
- [ ] `pnpm --filter @lunedoc/web exec tsc --noEmit` passes.

### 6.2 `apps/web` consumes `@lunedoc/ui`
- [ ] `apps/web/src/main.tsx` imports `@lunedoc/ui/tokens.css` (and only that for the design system; no copy of `tokens.css` lives inside `apps/web/`).
- [ ] `apps/web/src/App.tsx` renders `<Header />` from `@lunedoc/ui` at the top of the page.
- [ ] The header renders the real `<Logo />` glyph (geometric "L" in accent square) — same visual as the prototype.
- [ ] The page background and font feel match the prototype (validated by side-by-side comparison with `http://localhost:8765/`).

### 6.3 Prototype invariants (regression gates)
- [ ] `python3 -m http.server 8765` from repo root still serves the prototype unchanged.
- [ ] Headless smoke probe (same as the QA pass): 9 sections + 32 artboards render; **0 console errors**; brand consistency clean.
- [ ] No file under `docs/components/`, `docs/stylesheets/`, or `docs/index-html/` is modified by any commit on the Phase 3 branch.
- [ ] `index.html`, `.design-canvas.state.json` are unchanged.

### 6.4 Package hygiene
- [ ] `packages/ui/package.json` declares `@lunedoc/ui`, `peerDependencies` for React, and an `exports` map covering `.` and `./tokens.css`.
- [ ] `packages/ui/src/index.ts` is the only entry point for the public API; no app imports a deep file path like `@lunedoc/ui/src/logo/Logo`.
- [ ] No file under `packages/ui/src/` reads from `window.*` at module level.
- [ ] No `any`, no `@ts-ignore`, no `@ts-expect-error` introduced anywhere in `packages/ui/src/`.

### 6.5 Documentation
- [ ] `docs/project-status.md` adds a "Phase 3 in progress / done" line under §8 R3.
- [ ] This file (`docs/phase-3-ui-package-plan.md`) gets a `✓ DONE (yyyy-mm-dd)` banner at the top with the commit range.
- [ ] If anything diverged from this plan during execution (e.g. a primitive needed an extra prop, a typing question forced a new dep), append a short "Deviations" section to this file.

---

*When 6.1–6.5 are all green, merge the `phase-3/ui-package` PR. Phase 4 (extract `i18n.jsx` into `@lunedoc/i18n`, replace the Phase 3 stub) becomes the next workstream — the migrated `Header` will start showing real translated labels the moment it lands.*

---

## Deviations from this plan during execution (2026-05-03)

Recorded for transparency. None of these are visual or behavior changes; they're pragmatic typing/scoping calls made during the actual port.

- **Stub pattern extended beyond Header.** §4 step 5 prescribed the `t = (k: string) => k` stub for the `Header`. We applied the same pattern to `Footer`, `MobileBottomNav`, and `ToolCard` since they all consume `useI18n` in the prototype. Consistent and in-spirit; replaces in one sweep when Phase 4 lands.
- **`TOOLS` typing uses `as const satisfies`.** The plan said "strict types: `interface Tool { … }`". We went one step further and made `TOOLS` an `as const satisfies readonly { … }[]`, then derived `ToolKey` from `TOOLS` (`(typeof TOOLS)[number]['key']`). Adding/removing a tool now automatically updates the union — no hand-maintained literal-string list.
- **`lang` props on `Footer` / `MobileBottomNav` / `ToolCard` accepted but unused in Phase 3.** Kept in the type signatures for forward compat; not destructured locally to avoid `noUnusedParameters`. Phase 4 turns them into real consumers in one diff.
- **`packages/ui` needed its own `@types/react` + `@types/react-dom` devDeps.** Discovered during the Logo port: `tsc -b` from `apps/web` couldn't find `react/jsx-runtime` types when traversing into the workspace package. Added matching versions; pnpm symlinks them from the central store with no duplication.
- **`PdfThumb` API quirk preserved as-is.** The prototype's `PdfThumb` accepts `{ w, h, page }`, but several callers in `tool-variants.jsx` pass `{ pages, size }` — names that don't match anything in the signature. Faithful port preserved the existing signature; the API drift is a pre-existing prototype issue and gets harmonized in Phase 6 when the tool widgets get ported (their callers).
- **Storybook not set up.** §1 listed Storybook as desirable but optional. Held off; not blocking. Add when actually browsing the design system in isolation becomes valuable.
- **Acceptance §6.5 (doc updates) closed in a follow-up commit.** The previous 5 commits stayed code-only per the user's "stop after each step" rule; this docs commit closes the loop.

# Lunedoc — Phase 6: Tool Widget Port Plan

**Status:** IN PROGRESS — Merge, Split, Watermark ported on 2026-05-03 (commits `450fad8`, `876aee7`, `e90e54f`, `7956f69`) on branch `phase-2/scaffold`.

**Companion docs:**
- `docs/phase-3-ui-package-plan.md` — `@lunedoc/ui` (consumed here).
- `docs/phase-4-i18n-package-plan.md` — `@lunedoc/i18n` (consumed here).
- `docs/frontend-migration-plan.md` — long-term outline.
- `docs/project-status.md` — single orientation file.

---

## 1. Scope of Phase 6

Port the eight tool widgets from the prototype (`docs/components/tool-page.jsx` for Compress, plus the seven in `docs/components/tool-variants.jsx` for the rest) into a new workspace package, and expose each as a real route in `apps/web`. The prototype stays untouched throughout.

In scope:
- A new package `@lunedoc/tools` containing one widget per tool.
- One `apps/web` route per tool slug (`/merge-pdf`, `/split-pdf`, … `/edit-pdf`, `/compress-pdf`).
- Real translated labels via the existing `@lunedoc/i18n` wiring — no new i18n surface in this phase.

Out of scope:
- Real PDF processing (no engine yet — widgets stay client-side mocks).
- Marketing-side SEO landing pages (those live in a future `apps/marketing` and will likely render the same widgets as React islands).
- Shared widget primitives like a "tool shell" abstraction. We'll see them after porting 2–3 tools; abstract only when the duplication is real.

---

## 2. Package choice — separate `@lunedoc/tools` from `@lunedoc/ui`

A separate package, not a `widgets/` subdirectory of `@lunedoc/ui`. Reasoning:

- **Different mental model.** `@lunedoc/ui` is the design system: small, generic, reusable across marketing + app + future surfaces. Tool widgets are big, opinionated, and product-specific. Mixing them blurs the boundary.
- **Different consumer pattern.** Marketing pages will hydrate one tool widget per landing page (Astro islands). The app loads several. A separate package lets each surface tree-shake to exactly the widgets it needs without inheriting the design system as a transitive cost.
- **Different ownership cadence.** Design-system changes are rare and reviewed by everyone; tool changes are ongoing. Separate packages = separate change windows.
- **No-cost split.** `@lunedoc/tools` declares `@lunedoc/ui` and `@lunedoc/i18n` as workspace dependencies; there's no extra build step or duplication.

`@lunedoc/tools/package.json` shape (delivered with the Merge commit):

```json
{
  "name": "@lunedoc/tools",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@lunedoc/i18n": "workspace:*",
    "@lunedoc/ui": "workspace:*"
  },
  "peerDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" }
}
```

---

## 3. Port order

Order chosen to maximize early validation (smallest widgets first) and finish with the most expensive ones. Each step is one PR-sized commit on `phase-2/scaffold` (or a fresh phase-6 branch when convenient).

| # | Tool | Source in prototype | Status |
|---|---|---|---|
| 1 | **Merge** | `tool-variants.jsx:6–104` | ✓ DONE (2026-05-03, commit `450fad8`) |
| 2 | **Split** | `tool-variants.jsx:106–236` | ✓ DONE (2026-05-03, commit `876aee7`) |
| 3 | **Watermark** | `tool-variants.jsx:368–648` | ✓ DONE (2026-05-03, commits `e90e54f` refactor + `7956f69` feat) |
| 4 | **Sign** | `tool-variants.jsx:651–976` | next — recommended |
| 5 | **OCR** | `tool-variants.jsx` (`OCRToolPage` + `OCRScannedPage` + `OCRExtractedBlock`) | pending |
| 6 | **Edit** | `tool-variants.jsx` (`EditPDFToolPage` + helper glyphs + `EditPDFPreviewPage`) | pending |
| 7 | **Compress** | `tool-page.jsx` (`ToolPage` — three states) | pending |
| 8 | **Convert** | `tool-variants.jsx:238–340` | pending |

**Why this order, not alphabetical:**
- **Merge / Split** are tiny (file list + reorder). Easy validation of the package + routing pipeline (done).
- **Watermark / Sign / Edit** introduce 2-pane layouts (controls + preview); they exercise more of `@lunedoc/ui` and produce visible novelty.
- **OCR** is heavy (per-language sample text, 2-pane preview with tinted scanned page); save until the pattern is proven.
- **Compress** is unique in being a *state machine* (empty → uploading → done) rather than one form. Defer until we've ported 5+ form-style tools.
- **Convert** is the format-pair picker. Modest size; ports easily after Compress.

---

## 4. Route layout

Routes live in `apps/web` only. Marketing-side `/<tool>-pdf` landing pages are a separate future surface (see `docs/seo-tool-page-template.md`).

| Slug | Component | Status |
|---|---|---|
| `/` | `HomePage` (the existing smoke page with locale switch + ToolCard + Merge link) | live |
| `/merge-pdf` | `<MergeToolPage lang={lang} />` | ✓ live |
| `/split-pdf` | `<SplitToolPage lang={lang} />` | ✓ live |
| `/watermark-pdf` | `<WatermarkToolPage lang={lang} />` | ✓ live |
| `/sign-pdf` | `<SignToolPage lang={lang} />` | pending |
| `/ocr-pdf` | `<OCRToolPage lang={lang} />` | pending |
| `/edit-pdf` | `<EditPDFToolPage lang={lang} />` | pending |
| `/compress-pdf` | `<CompressToolPage lang={lang} />` | pending |
| `/convert-pdf` | `<ConvertToolPage lang={lang} />` | pending |

`Header` and `Footer` from `@lunedoc/ui` render outside `<Routes>`, so they stay visible on every tool page. `lang` lives in `App` state and is shared across routes (verified via headless probe — switching locale on `/merge-pdf` updates both Header and Merge content simultaneously).

---

## 5. Per-tool acceptance criteria

For each tool port, all of the following must be green before merging:

- [ ] **TS clean.** `pnpm --filter @lunedoc/web build` (which runs `tsc -b` then `vite build`) passes with zero errors. No `any`, no `@ts-ignore`/`@ts-expect-error`.
- [ ] **Uses `@lunedoc/ui`.** All shared primitives (`Icon`, `PdfThumb`, `ToolIcon`) come from `@lunedoc/ui`. The widget does not re-implement design-system pieces inline.
- [ ] **Uses `@lunedoc/i18n`.** Labels come from `useI18n(lang)` — no hardcoded English strings, no `t = (k) => k` stubs. Mock filenames / dates / sizes / page counts may stay hardcoded per the existing prototype's accepted-exception rule.
- [ ] **Route exists in `apps/web`.** A `<Route path="/<slug>" element={<ToolPage lang={lang} />} />` line ships in `App.tsx`.
- [ ] **Prototype untouched.** `git status` against `docs/components/`, `docs/stylesheets/`, `index.html`, `.design-canvas.state.json` returns empty. Local prototype on port 8765 still HTTP 200.
- [ ] **Build/lint green.** `pnpm --filter @lunedoc/web build && pnpm --filter @lunedoc/web lint` both exit 0.
- [ ] **Headless smoke probe** confirms the route renders the title (real translated string, not a key) and the tool's distinguishing UI element (file list for Merge, range builder for Split, signature pad for Sign, etc.). Plus a TR/ES locale flip changes labels with no raw-key leaks.

When all 8 tools land, Phase 6 closes with a docs commit and the next workstream becomes either Phase 7 (marketing site / SEO pages) or backend MVP (per `docs/backend-api-plan.md`).

---

## 6. Notable decisions in the Merge port (precedent for the rest)

These choices apply to every subsequent widget port unless overridden:

- **Component takes `lang: Lang` as a single prop.** No `setLang` (the App owns it), no `mobile` prop (route renders desktop layout for now; mobile responsiveness via media queries / container queries when we add a viewport story).
- **No internal Header.** The prototype's tool components rendered their own `TVHeader`. The ported widgets don't — `App.tsx` provides the shared `<Header>`. Same for `<Footer>`.
- **Inline styles preserved verbatim.** This is a port, not a refactor. Don't migrate to CSS modules, vanilla-extract, etc. in this phase.
- **Typed mock data.** Each widget defines an `interface` for its mock state (e.g. `MergeFile`) — strict TS, no `any[]`.
- **Extra hardening tolerated for `noUncheckedIndexedAccess`.** When swapping array elements (move up/down), an explicit `if (!a || !b) return;` guard satisfies the strict-index check without changing runtime behavior.
- **CTA interpolation preserved.** The prototype's `t('merge_cta').replace('{n}', count)` pattern is kept verbatim. A real i18n interpolation library (icu/lingui) is not introduced in this phase.

---

*Phase 6 advances tool by tool. After Split (Step 2), we'll have enough sample size to decide whether to extract a `ToolShell` abstraction in `@lunedoc/ui` or keep widgets self-contained.*

---

## 8. Notes added during Watermark port (Step 3 — 2026-05-03)

- **First widget with a 2-pane layout** (controls panel + preview panel). Prototype's grid `minmax(0, 1fr) minmax(0, 420px)` preserved verbatim. Preview is `position: sticky`, so it stays in view while the user scrolls through controls.
- **`WatermarkPreviewPage` co-located in the same file.** Only one consumer; no benefit splitting now. If a second tool ever needs the same A4 mock-page chrome, lift to `packages/tools/src/_internal/`.
- **`btnGhost` extraction did NOT add a third user.** Watermark doesn't use `btnGhost` — its controls are all inline-styled. The extraction was done as planned (Merge + Split now share `_internal/btnGhost.ts`); Watermark just doesn't import it. Two real users, but the helper is now in its proper home for any future tool that needs a 28×28 ghost row-action.
- **`useEffect([lang, t])` re-seeds the watermark text** when locale changes. Verified live: switching EN→TR re-fills the input from `CONFIDENTIAL` → `GİZLİ`, EN→ES → `CONFIDENCIAL`. The overlay updates in lockstep.
- **`setPosition(cell.id as PositionId)`** has a single type assertion at the position-grid mapping. The `cells` array uses `PositionId | null` so `null`-cells are filtered out, but TS doesn't narrow `cell.id` from `PositionId | null` to `PositionId` after the early `if (!cell.id) return;` because `cell` is the iteratee, not the captured variable. The assertion is exact (we already verified non-null above) and is the minimal hack that satisfies strict mode without inflating the types.
- **`positions[2]!`** non-null assertion for the "center" fallback. The array literal has 5 entries; index 2 is structurally guaranteed. Per CLAUDE.md "trust internal code," this is the right level of trust.
- **No `setLang` prop, no `mobile` prop.** Same as Merge/Split: App owns lang state; mobile responsiveness will come via media/container queries when we open a viewport story.

## 7. Notes added during Split port (Step 2 — 2026-05-03)

- **Same outer shell as Merge** — header-less wrapper with `var(--bg-muted)` background, max-width 920 container, back link, title row with tinted square badge, content card, bottom CTAs. Confirms the Merge precedent generalizes; we'll see whether a `ToolShell` abstraction earns its keep after Watermark.
- **`btnGhost` helper still duplicated** — present locally in both `MergeToolPage.tsx` and `SplitToolPage.tsx`. Two copies. Will extract to `packages/tools/src/_internal/btnGhost.ts` (or similar) when Watermark becomes the third use — that's a real DRY signal, two copies isn't.
- **Split's `[k, label]` mode-toggle list** typed via `as const` so `setMode(k)` keeps `k: SplitMode` literal narrowed. Same trick as the Header's nav items.
- **`Set<number>` page selector** — `selected` state holds the picked pages. Not converted to `Map` or anything fancier; matches the prototype exactly. The strict `noUncheckedIndexedAccess` setting didn't bite here because `Set` access is always `boolean` / `void`, never indexed.
- **Mode-switching state preserved across switches.** Toggling between range and pages mode keeps each side's state alive (selected pages persist when you flip back). Same as the prototype.

# Lunedoc — Phase 4: `@lunedoc/i18n` Extraction

> **✓ DONE (2026-05-03)** — commits `2b5c5a2..5d5c70d` on branch `phase-2/scaffold` (3 commits).
>
> Phase 4 was driven from chat instructions rather than a pre-written plan doc. This file is the closure record — what was extracted, the public API, the wiring path, and the open decisions.

**Companion docs:**
- `docs/phase-3-ui-package-plan.md` — Phase 3 set up the `t = (k) => k` stubs that this phase replaced.
- `docs/frontend-migration-plan.md` — long-term outline (Phase 4 there is "extract i18n into packages/i18n", aligned with the work below).
- `docs/project-status.md` — single orientation file.

---

## 1. What was extracted

| Source (untouched) | Target |
|---|---|
| `docs/components/i18n.jsx` lines 4–1123 (`I18N_STRINGS` const) | `packages/i18n/src/locales/{en,tr,es}.json` |
| Locale-aware `useI18n` hook (was a `window.useI18n` consumer in the prototype) | `packages/i18n/src/index.ts` `useI18n(lang)` |

The prototype's `i18n.jsx` is **not** modified or moved. `I18N_ARTICLES` (lines 1126–~1182) is still in the prototype only; deferred per the chat instruction. Easy follow-up commit if/when the article page gets ported.

### 1.1 Locale tables

- **336 keys per locale**, identical key sets across EN / TR / ES (verified at extraction time and again at every workspace install).
- Stored as **plain JSON** (not TS), so translators can edit them in any editor without touching code. Tooling friendly — Lokalise / Crowdin / Phrase ingest JSON natively when we get there.
- Key order matches the source order in `i18n.jsx` (logical groupings: nav, hero, tools, pricing, auth, etc.) — preserves diffability against the prototype.

### 1.2 Public API of `@lunedoc/i18n`

```ts
// Types
export type Lang = 'en' | 'tr' | 'es';
export type TranslationKey = keyof typeof en;   // derived — 336-member literal union

// Data
export const I18N_STRINGS: { en, tr, es };

// Functions
export function getStrings(lang: Lang): Record<string, string>;
export function createTranslator(lang: Lang): (key: string) => string;

// React hook
export function useI18n(lang: Lang): { t: (key: string) => string; lang: Lang };
```

### 1.3 Translator semantics

`t(key)` does a three-step lookup:

1. **Locale's table** for the requested `lang`.
2. **Falls back to EN** if the key is missing in that locale (defense for future locales added without complete coverage).
3. **Returns the key itself** if missing everywhere — visible signal in the UI that a translation is needed; no silent `undefined`.

The translator is a closure created once per locale; `useI18n` memoizes it via `useMemo([lang])` so `t`'s identity is stable across renders. Consumers can safely list `t` in effect/memo dependency arrays without thrashing.

---

## 2. Integration into `@lunedoc/ui`

`packages/ui/package.json` declares `"@lunedoc/i18n": "workspace:*"` as a runtime `dependencies` entry.

The four Phase-3 stubs were replaced 1:1 with `useI18n(lang)`:

| Component | Phase 3 stub | Phase 4 wiring |
|---|---|---|
| `Header` | `const t = (k) => k;` | `const { t } = useI18n(lang);` — `lang` already required |
| `Footer` | same | hook + `lang = 'en'` default |
| `MobileBottomNav` | same | hook + `lang = 'en'` default; `lang` now destructured |
| `ToolCard` | same | hook + `lang?: Lang` default `'en'`; tightened from `lang?: string` |

No other code path in `@lunedoc/ui` changed. Component visuals + APIs remain identical to the Phase-3 ports.

---

## 3. `apps/web` integration

`apps/web/src/App.tsx` is the operational acceptance test. State:

```tsx
const [lang, setLang] = useState<Lang>('en');
```

`Header`, `Footer`, `ToolCard` all receive the live `lang`. A small "Locale smoke" row containing `<LangSwitch lang={lang} setLang={setLang} />` lets a human (or a headless probe) toggle EN/TR/ES and watch every label across the page swap simultaneously.

Headless verification (commit `5d5c70d` build, simulating cache-enabled normal browser):

| State | EN markers | TR markers | ES markers | Raw stub keys |
|---|---|---|---|---|
| Initial (EN) | 4/4 ✓ | 0 | 0 | none |
| After TR click | 0 | 3/4 ✓¹ | 0 | none |
| After ES click | 0 | 0 | 4/4 ✓ | none |

¹ The 4th TR marker was a probe-string error (expected "Giriş yap"; actual TR `nav_signin` is "Oturum aç") — the swap itself was correct.

---

## 4. Decisions

### 4.1 Eager-load all locales (current)

All three locale JSON files are imported at module load time and bundled into `apps/web`'s initial JS payload.

- **Bundle cost:** ~13 kB uncompressed per locale (~4 kB gzipped each). Total +40 kB uncompressed, +12 kB gzipped over the no-locale baseline.
- **Pros:** simplest possible wiring; instant locale switch with no async; one bundle to deploy.
- **Cons:** initial payload grows linearly with the number of locales.
- **Threshold:** acceptable up to ~5 locales. Above that, switch to dynamic per-locale imports.

### 4.2 Dynamic locale imports — deferred

Pre-baked migration path when 4th locale is added:

```ts
const m = await import(`./locales/${lang}.json`);
```

Requires the hook to return `{ t, lang, ready }` with a brief Suspense or local `useState` while the locale resolves on first switch. **Not implemented now.** Decision recorded so we don't rewrite the API surface twice.

### 4.3 `I18N_ARTICLES` not extracted

`docs/components/i18n.jsx` lines 1126–~1182 (per-locale article title/excerpt tables for the blog) live only in the prototype. Will move when the blog/article pages get ported (Phase 6 in the operational numbering). Trivial separable JSON when the moment comes.

---

## 5. Acceptance — all green

- [x] `pnpm install` clean across workspace
- [x] `pnpm --filter @lunedoc/web build` succeeds (210 ms; 31 modules; JS 250.06 kB / gzip 79.22 kB)
- [x] `pnpm --filter @lunedoc/web lint` silent
- [x] `tsc --noEmit -p packages/i18n` clean (standalone typecheck — JSON imports + `keyof typeof en` resolve)
- [x] All 336 keys present in EN, TR, ES with identical key sets (programmatically verified)
- [x] Headless probe: EN labels render by default; TR/ES labels render after locale switch; zero raw stub keys (`nav_tools`, `t_merge`, `foot_copy`) at any point
- [x] Prototype paths (`docs/components/`, `docs/stylesheets/`, `index.html`, `.design-canvas.state.json`) — unchanged

---

*Phase 4 complete. The next code-side step (operational Phase 5) is your choice: extract `I18N_ARTICLES` (small), or open Phase 6 (port tool widgets one at a time, using `@lunedoc/ui` + `@lunedoc/i18n` as foundations).*

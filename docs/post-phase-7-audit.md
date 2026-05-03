# Lunedoc — Post-Phase-7 Repository Audit

**Audit date:** 2026-05-03
**Auditor:** read-only audit on `main` branch after Phase 2–7 merge.

This file records the post-merge state and a small set of doc inconsistencies that should be patched before backend MVP work starts. **No code or doc was modified by this audit** — fixes are listed as recommendations.

---

## 1. Repository state

| Check | Result |
|---|---|
| Current branch | ✓ `main` |
| Working tree | ✓ clean |
| Local main vs origin/main | ✓ in sync at `593f09df05bd222399085ea7810c703cca4ac376` |
| Local branches | ✓ only `main` |
| Remote branches | ✓ only `origin/main` (with `origin/HEAD → origin/main`) |
| Nested `.git` directories | ✓ only the repo root `./.git` |
| `.gitmodules` | ✓ does not exist |
| `git submodule status` | ✓ no submodules |

---

## 2. Build / type-check sweep

| Step | Result |
|---|---|
| `pnpm install` | ✓ no peer-dep errors |
| `pnpm --filter @lunedoc/web build` | ✓ 245 ms; 49 modules; JS 362.18 kB |
| `pnpm --filter @lunedoc/web lint` | ✓ silent (zero errors, zero warnings) |
| `pnpm --filter @lunedoc/marketing build` | ✓ 25 pages built in 2.20 s |
| `pnpm --filter @lunedoc/{i18n,ui,tools} exec tsc --noEmit -p .` | ✗ **all 3 fail with `Command "tsc" not found`** — none of the 3 packages declare `typescript` as a local devDep. They borrow it from `apps/web` at build time, which works for normal builds via `tsc -b` traversal, but they can't standalone-typecheck via `pnpm --filter` exec. |
| Fallback: `pnpm --filter @lunedoc/web exec tsc --noEmit -p ../../packages/<pkg>` | ✓ all 3 packages typecheck cleanly via web's TS binary |

**Per-package tsc finding — verdict:** not a regression and not blocking. Adding `"typescript": "~6.0.2"` (matching `apps/web`'s pin) as a devDep to each of the 3 packages is the trivial fix if standalone tsc is wanted. Listed as a recommendation rather than applied here, per the audit's "do not fix unless trivial AND requested" stance.

---

## 3. Route / page inventory

### `apps/web` tool routes (verified by grepping `apps/web/src/App.tsx`)

```
/compress-pdf   /convert-pdf   /edit-pdf   /merge-pdf
/ocr-pdf        /sign-pdf      /split-pdf  /watermark-pdf
```

All 8 routes wired up to the matching `@lunedoc/tools` widget with a shared `lang` state, and the home `/` route renders a placeholder with locale-switch + tool-tile + Merge link.

### `apps/marketing` generated static HTML (verified by `find apps/marketing/dist -name "*.html"`)

```
25 files total = 8 tools × 3 locales + home
```

| Tool | EN at `/<tool>-pdf` | TR at `/tr/<tool>-pdf` | ES at `/es/<tool>-pdf` |
|---|---|---|---|
| merge | ✓ | ✓ | ✓ |
| split | ✓ | ✓ | ✓ |
| watermark | ✓ | ✓ | ✓ |
| sign | ✓ | ✓ | ✓ |
| ocr | ✓ | ✓ | ✓ |
| edit | ✓ | ✓ | ✓ |
| compress | ✓ | ✓ | ✓ |
| convert | ✓ | ✓ | ✓ |

### Prototype

| Check | Result |
|---|---|
| `http://localhost:8765/` | ✓ HTTP 200 |
| `git status` against `docs/components/`, `docs/stylesheets/`, `index.html`, `.design-canvas.state.json` | ✓ empty (untouched throughout the entire migration) |

---

## 4. Documentation inconsistencies found

Severity rubric: **L1** = self-contradicting, fix soon. **L2** = stale wording or duplicate text, fix when convenient. **L3** = informational mismatch, defer.

### 4.1 `docs/project-status.md` (most issues live here)

| # | Severity | Issue |
|---|---|---|
| A | L1 | **§1 "Current prototype status" claims:** *"Migration to Vite/React/Next: not started, intentional."* — this **contradicts §8 R3** which lists Phase 2–7 all DONE. The §1 line is a leftover from before any migration started. |
| B | L1 | **§2 "Folder structure" shows ONLY the prototype tree** (`index.html` + `docs/`). Does not include `apps/web/`, `apps/marketing/`, `packages/ui/`, `packages/i18n/`, `packages/tools/`, `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`. New contributors reading this doc won't know the workspace exists. |
| C | L2 | **§5 title "Completed tool mock pages"** suggests these are still mock-only. The same 8 tools now also live as real TS components in `@lunedoc/tools` and serve at routes in `apps/web` + `apps/marketing`. The table itself is accurate as a description of the *prototype's* tool pages, but the section title and intro sentence don't acknowledge the ports. |
| D | L2 | **§7 D3 wording — "mobile app is a Phase-2 product"** clashes with the operational Phase 2 (scaffold `apps/web`). Re-word as "post-MVP product" or "Phase-2 of the broader product roadmap" to disambiguate. |
| E | L2 | **§8 R3 references branch `phase-2/scaffold`** which was deleted on 2026-05-03. Now everything lives on `main`. Specifically: line 160 "Status as of 2026-05-03 — branch `phase-2/scaffold`". |
| F | L2 | **§8 R3 has no Phase 5 entry.** The original migration plan had Phase 5 = "Extract i18n into packages/i18n", but the operational numbering merged that into Phase 4 (i18n extraction + UI wiring landed together in commits `2b5c5a2..5d5c70d`). The skip-from-4-to-6 is unexplained in §8 R3 and looks like a missing item. Add a one-line note. |
| G | L2 | **§8 has duplicate workstream blocks at the end** (lines 174-178). The "Next workstream — backend MVP" + "Optional small side task" lines (174-175) are followed by a near-identical "Other open workstreams (not blocked by Phase 7)" block (176-178). Delete the duplicate. |
| H | L3 | **§8 has an "Original migration-plan items still useful as long-term reference" block** (lines 180-188) that's a leftover from an earlier doc-rewrite. Either move into `docs/frontend-migration-plan.md` (where it belongs) or delete. |

### 4.2 `docs/frontend-migration-plan.md`

| # | Severity | Issue |
|---|---|---|
| I | L1 | **Top-level status (line 3)** says: *"documentation only. No migration has started. The current prototype remains the canonical UI source until Phase 2 of this plan begins."* — this is FALSE. Phase 2–7 all delivered. Update to: *"Status: ✓ DONE through Phase 7. The migration is complete on the frontend side; backend MVP per `docs/backend-api-plan.md` is the next workstream."* |
| J | L2 | **§3 phase numbering** lists Phase 3 = "Scaffold apps/marketing" and Phase 4 = "Extract tokens + primitives". The per-phase plan docs reordered to Phase 3 = UI extraction (Astro deferred to Phase 7). Already partly addressed by the call-out at line 79; consider renumbering the whole §3 to match what actually shipped, or add a "Status legend" header noting which numbers refer to per-phase docs vs the original outline. |

### 4.3 `docs/phase-7-marketing-scaffold-plan.md`

| # | Severity | Issue |
|---|---|---|
| K | L2 | **Line 3** still says: *"Commit range: `749e685..e302623` on branch `phase-2/scaffold`."* — that branch was deleted. Replace with "merged to `main`" or simply drop the branch reference (the commit hashes are stable). |

### 4.4 `docs/backend-api-plan.md`

✓ No staleness found. The doc is forward-looking and correctly labeled "proposal only." Ready to drive implementation when backend MVP starts.

---

## 5. Recommended fixes (ordered by impact)

These are doc-only edits. None require code changes. Suggested as a single small commit titled `docs: post-phase-7 audit cleanup` (or split as you prefer).

1. **Fix `project-status.md` §1, §2, §8 first** (issues A, B, E, G, H) — these are the loudest contradictions. New contributors / future you will hit them within minutes of reading the file.
2. **Reword `project-status.md` §5 + §7 D3** (issues C, D) — small wording tightening.
3. **Add Phase 5 mention** in §8 R3 (issue F) — one line.
4. **Refresh `frontend-migration-plan.md` top status** (issue I) — single sentence change.
5. **Decide on `frontend-migration-plan.md` §3 numbering** (issue J) — judgment call; safe to leave with the existing call-out if a renumber feels invasive.
6. **Drop the branch ref in `phase-7-marketing-scaffold-plan.md`** (issue K) — trivial.

**Optional follow-up (not from the audit, but related to TASK 2):** add `typescript` as a devDep to `packages/{ui,i18n,tools}` so `pnpm --filter <pkg> exec tsc --noEmit -p .` works standalone. ~3 lines per package.json, ~3 minutes total.

---

## 6. Sign-off

State at end of audit:

- All builds + linters green; per-package tsc green via the workspace fallback.
- 8 web routes + 25 marketing HTML files = full Phase 6/7 coverage in EN/TR/ES.
- Prototype untouched and HTTP 200.
- Single branch `main`, in sync with `origin/main`, no nested .git, no submodules.
- Doc staleness exists but is mechanical to fix and does not invalidate the migration.

**Audit verdict:** repository is in good shape post-Phase-7. Doc cleanup recommended before opening backend MVP so new sessions don't get confused by the §1 contradiction and the missing folder tree.

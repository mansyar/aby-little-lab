# Phase 4 verification — Doc sync (2026-11-21)

- Phase base: `be67f9d5`
- Branch: `feat/20261121-content-depth`
- Result: **PASS** — all count-bearing docs match shipped pools and the texture guard; validation is 5/5 green.

## Commands and exit codes (each run separately, no `&&` chains)

| # | Command | Exit | Evidence |
| --- | --- | --- | --- |
| 1 | `node scripts/validate-docs.js` | 0 | Results: 5 passed / 0 failed (release-note index, links/anchors, game lists, Conductor paths, living test-truth) |
| 2 | `pnpm exec vitest run` | 0 | 154 files / 3,345 tests passed |
| 3 | `pnpm check` | 0 | Checked 343 files, no fixes applied |
| 4 | `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json` clean |

## Before → after counts (shipped truth from Phases 1–3)

| Item | Before | After |
| --- | --- | --- |
| Word pool | 28 (13 three-letter / 15 four-letter) | 60 (27 / 33) |
| Word prompt pictures | 28 | 60 |
| Shape pool | 18 (easy 9 / hard 10) | 24 (easy 12 / hard 13); per-playthrough draw still 9 |
| Shape SVGs (`shapes/`) | 18 outlines + 18 cutouts (36) | 24 + 24 (48) |
| Odd One Out texture pool | 33 (6 animals / 3 frogs / 6 toys / 18 shapes) | 39 (6 / 3 / 6 / 24) |
| Scenario pool | 32 (8 per emotion) | 48 (12 per emotion) |
| Story pool | 15 (7 obvious / 8 subtle) | 30 (15 / 15); band mix 5+1 / 3+3 / 1+5 unchanged |
| Story panel SVGs | 45 (15 strips × 3) | 90 (30 strips × 3) |
| Art corpus / registered texture keys | 262 SVG files / 195 keys | 313 SVG files / 201 keys |
| Game art groups | 139 keys / 133 game-only | 145 keys / 139 game-only |
| Art files moved out of shell | 202 / 262 | 251 / 313 |
| Suite truth | 153 files / 3,340 tests | 154 files / 3,345 tests |
| Texture budget | 39 MiB typical / 178 MiB full (stale 170-SVG measurement) | 80 MiB / 320 MiB caps + hard 0.5 ratio; real 74.57 / 313.00 / 0.238 |

README's living count line was already at 154/3,345 (set in Phase 3) and was verified, not duplicated.
The dated 2026-11-21 re-baseline section in `docs/perf-baseline.md` was kept intact; the historical
2026-10-17 line-206 measurement was not rewritten. Historical Releases rows, build measurements and
illustrative story examples were kept; only the stated counts changed.

## AC verdicts

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-8 Validator 5/5 green; count-bearing docs and product roadmap exit gate updated | **PASS** (docs portion) | Command 1; README/PRD/TDD/perf-baseline now carry the shipped counts. The `conductor/product.md` roadmap exit-gate edit is owned and performed by the primary; this subagent did not touch it. |
| AC-9 Diff contains no `src/scenes/`, `GameId`, i18n or input changes; full `verify_phase` green | **PASS** for this phase | Phase 4 diff is docs + evidence only. Phase 1's behavior-neutral `PatternBuilderScene.ts` exhaustive-map edit was previously accepted by the primary. The primary runs the full `verify_phase` chain (build, coverage, boot, PWA); this phase ran its four specified commands separately, all green. |

## Deviations

- None in this phase. Phase 1's previously accepted `PatternBuilderScene.ts` deviation and Phase 3's
  user-approved texture re-baseline remain recorded in their own evidence files.

## Blockers

None.

## Primary verification (orchestrator, independent)

- Working tree had only the primary's `conductor/product.md` roadmap edit unstaged before squash;
  subagent commit `7783f511` confined to `docs/PRD.md`, `docs/TDD.md`, this evidence. No stale pool
  counts remain in governed docs (only historical v1.6.0 release notes and an unrelated Hub-entries
  count in the device checklist, both out of scope).
- Full `verify_phase` chain re-run by the primary and passed (exit 0): `pnpm check` (Biome clean,
  343 files) → `pnpm typecheck` clean → `pnpm test -- --run` (154 files / 3,345 tests) →
  `pnpm test:coverage` (154 files / 3,345 tests; 97.14/90.97/96.25/98.31% above gates 95/88/85/90)
  → `pnpm build` (462 modules; shell `index-Bkt6cIfM.js` 192.39 kB Vite / 187.9 kB via validator
  ≤ 200 kB; Phaser vendor 1,367.08 kB pre-existing advisory; storyOrderArt chunk 81.84 kB) →
  `validate-bundle.js` PASS → `validate-pwa.js` 16/16 → `validate-docs.js` 5/5.
- Primary roadmap edit to `conductor/product.md` (§10.5 re-baselined texture figures, content-depth
  row marked Done with machine-checked exit gate, milestone table Done) validated by
  `validate-docs.js` 5/5 — links/anchors intact.
- Result: **verified**.

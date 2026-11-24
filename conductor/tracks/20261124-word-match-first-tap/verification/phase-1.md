# Phase 1 verification — Selective preload implementation

- Track: `20261124-word-match-first-tap`
- Phase: `1`
- Date: `2026-11-24`
- Branch: `fix/20261124-word-match-first-tap`
- Base commit: `8cc94d6c06d5295f4f9348f6096302965fc90f33`
- Head commit: pending phase squash (implementation and evidence verified in the working tree)
- Result: `verified`

## Task status

| Task | Status | Notes |
| --- | --- | --- |
| P1.T1 | done | Added pure `selectWordMatchArt`; it keeps the fixed declaration shape but leaves unused groups empty, including `music`, and queues no unused keys. |
| P1.T2 | done | Generates the playthrough in `init()` before `preload()`, with an idempotent create-only fallback; `create()` reuses the rounds and a fresh create-only visit regenerates them. |
| P1.T3 | done | Added exact-key/order/deduplication/pool/adaptive coverage and scene preload/no-double-generation/restart tests. |

## Commands

| Command | Exit code | Summary |
| --- | --- | --- |
| `pnpm exec vitest run src/__tests__/game/wordMatchArt.test.ts src/__tests__/scenes/wordMatchScene.test.ts` | 1 (test-first red) | Before implementation, selector test failed only because the helper did not exist; existing scene suite passed 22 tests. |
| `pnpm exec vitest run src/__tests__/game/wordMatchArt.test.ts src/__tests__/scenes/wordMatchScene.test.ts src/__tests__/scenes/artDeclarations.test.ts` | 0 | 3 files / 84 tests passed. |
| `pnpm check` | 0 | 373 files checked, no fixes required. |
| `pnpm typecheck` | 0 | App and E2E TypeScript clean. |
| `pnpm test -- --run` | 0 | 158 files / 3,393 tests passed. |
| `pnpm test:coverage` | 0 | Statements 97.10%, branches 90.96%, functions 96.35%, lines 98.23%; all gates clear. |
| `pnpm build` | 0 | Vite 8.3.8, 491 modules, shell 197.99 kB, 64 PWA precache entries. |
| `node scripts/validate-bundle.js` | 0 | Shell 193.4 kB <= 200 kB. |
| `node scripts/validate-module-size.js` | 0 | 172 TypeScript modules, zero warnings. |
| `node scripts/validate-textures.js` | 0 | 319 SVGs; all tiered budgets pass. |
| `node scripts/validate-pwa.js` | 0 | 16/16; 52 JavaScript chunks precached. |
| `node scripts/validate-docs.js` | 0 | 5/5 after count-only living-doc refresh. |
| Full configured `verify_phase` chain | 0 | `VERIFY_PHASE_EXIT=0` on the final working tree. |

## Acceptance criteria

| AC | Status | Evidence |
| --- | --- | --- |
| AC-1 | covered | Selector tests prove exact selected keys, full letters, deduplication, deterministic group/asset order, adaptive `+1` coverage, pool coverage and no unused keys. Empty unused groups contain zero assets. |
| AC-2 | covered | Scene test spies on `load.svg` and proves queued keys equal `selectWordMatchArt(rounds)` exactly; `music` has no assets. |
| AC-3 | covered | Existing deterministic/adaptive/completion/save tests remain green; new tests prove no regeneration between `preload()` and `create()` and regeneration on a fresh create-only visit. |
| AC-4 | covered | `git diff -- package.json pnpm-lock.yaml` is empty; production changes are limited to `src/scenes/WordMatchScene.ts` and new `src/game/wordMatchArt.ts`. |

## Static scope audit

Changed files:

- `src/game/wordMatchArt.ts` — new pure selector.
- `src/scenes/WordMatchScene.ts` — selective preload integration.
- `src/__tests__/game/wordMatchArt.test.ts` — new selector regression suite.
- `src/__tests__/scenes/wordMatchScene.test.ts` — scene preload and lifecycle regressions.
- `src/__tests__/scenes/artDeclarations.test.ts` — test-only scanner allowlist entry for the new pure helper.
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — count-only refresh from 157 files / 3,385 tests to 158 files / 3,393 tests.
- `conductor/tracks/20261124-word-match-first-tap/verification/phase-1.md` — this evidence.

No package, lockfile, other game scene, shared art-loader, save/schema, audio, speech, input, accessibility, or child-facing production change.

## Deviations

- `src/__tests__/scenes/artDeclarations.test.ts` is outside the plan's listed Phase 1 Touches. Added `wordMatchArt` to `NON_ART_GAME_MODULES` so the static scanner recognizes the new pure helper import. No assertion or runtime gate was weakened. The scene retains its literal seven-group declaration; unused groups are empty, so `music` queues zero assets.
- The subagent's targeted Vitest command was permission-denied twice. The primary ran it verbatim for the red baseline and final green result, then completed the scene integration and verification. No denied command was retried or worked around by the subagent.

## Notes

- The selector returns the full `letters` group plus only selected prompt assets. Unused groups remain in the array solely to preserve the existing static declaration shape; each unused group has an empty `assets` array, so `preloadArtGroups()` queues no raster work for them.
- `mascot_idle` and `frog_red` remain shell-owned and are not queued.
- The real Phaser lifecycle generates rounds in `init()` before `preload()`. Direct-`create()` unit tests retain their previous contract through an idempotent fallback; a later fresh `create()` visit regenerates the playthrough.
- Boot smoke is not triggered by this phase: no boot shell, PWA, asset source, or shared loader changed. The scene-local preload is covered by unit tests and will be exercised by the Phase 2 headed five-game measurement.

## Primary verification

The primary independently ran the exact targeted command, `pnpm check`, `pnpm typecheck`, full tests, coverage, build, all five artifact validators, and the complete configured `verify_phase` chain. The final targeted run passed 84 tests; the full suite passed 158 files / 3,393 tests; coverage cleared every threshold; bundle 193.4 kB, module-size zero warnings, textures, PWA 16/16 and docs 5/5 all passed. The full chain exited 0. Static checks confirm package/lockfiles are unchanged and production edits are limited to the approved scene/helper paths.

**Primary verdict: verified.**

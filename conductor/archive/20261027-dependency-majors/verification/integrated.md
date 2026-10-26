# Integrated Verification - 20261027-dependency-majors

**Track:** `20261027-dependency-majors` · **Date:** 2026-10-27 · **Branch:** `chore/20261027-dependency-majors` · **Base:** `master` @ `72bf861c` · **Head:** `a6be5163` · **Result:** verified

Run once after all five phases, on the integrated branch. The chained command (from `conductor/workflow.md` `verify_phase`):

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | 258 files checked, no fixes; 1 pre-existing warning (`noNonNullAssertion`, `musicalMemoryScene.test.ts`) — the Phase 1 schema-refresh retired the biome `$schema` info diagnostic |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | vitest **v5.0.5** — 125 files / 2,729 tests passed, ~13.9 s (was ~32-37 s under happy-dom 18) |
| unit | `pnpm test:coverage` | 0 | 97.8 / 91.9 / 96.77 / 98.74 (stmts/branches/funcs/lines) — denominators byte-identical to the vitest 4 snapshot; gates 90/85/88/95 held |
| build-artifact | `pnpm build` | 0 | vite **v8.3.5** + PWA plugin **v2.0.0**; precache 54 entries (1,720.45 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry ≤ 200 kB |
| smoke | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 42 chunks, 42 precached |
| static | `node scripts/validate-docs.js` | 0 | 6 passed / 0 failed — including the count-drift guard deriving 125 / 2,729 live under vitest 5 (via its `--no-staticParse` adaptation) |

Additionally: `pnpm outdated` exits **0 with an empty table** — every package in the track's scope (biome 2.6.3, vite 8.3.5, vitest + `@vitest/coverage-v8` 5.0.5, happy-dom 21.0.4, vite-plugin-pwa 2.0.0) is at its target and nothing in the manifest is stale. AC-1's end-state is reached.

## Acceptance criteria

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| AC-1 | `pnpm outdated` clean at track end | Satisfied | Empty table, exit 0, on the integrated branch |
| AC-2 | Integrated gate green; suite counts unchanged | Satisfied | 125 files / 2,729 tests at every phase and here; count guard green |
| AC-3 | clearMocks embraced; no `clearMocks: false` anywhere | Satisfied | Phase 2 evidence; grep proof; zero test changes needed |
| AC-4 | happy-dom CSS/IFrame audit outcome recorded | Satisfied | Phase 3 evidence — zero re-enables needed |
| AC-5 | PWA/bundle budgets held | Satisfied | precache 54 / 1,720.45 KiB; shell ≤ 200 kB; 42/42 |
| AC-6 | Docs state the new versions; validate-docs 6/6 | Satisfied | Phase 5 checkpoint `e2893a19` |

## Notes

- Zero `src/` production-code change across the whole track (each phase's diff audit confirmed; the only `src`-adjacent file ever touched was `scripts/validate-docs.js` for the `--no-staticParse` guard adaptation in Phase 2).
- One cross-cutting catch the track existed to find: vitest 5 changed `vitest list` to staticParse-by-default, which silently dropped the 305 dynamically registered tests from the count-drift guard's derivation (2,729 → 2,424) and made the guard blame correct docs. Fixed with the minimal `--no-staticParse` flag; mutation-proof and diagnostics in Phase 2 evidence.
- The suite got markedly faster under happy-dom 21 (~13-16 s vs ~32-37 s), which also retires the practical trigger of the host-load timeout flakes documented by the property-test-deflake track.
- Pre-existing diagnostics (the `noNonNullAssertion` warning) carried untouched, per scope.

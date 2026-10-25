# Phase 4 Verification — Test migration + docs truth pass

- **Track:** 20261025-shared-random-helpers
- **Phase:** 4
- **Date:** 2026-10-25
- **Branch:** refactor/20261025-shared-random-helpers
- **Base commit:** 6bd287e4
- **Head commit:** 5db21858
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 256 files; 1 warning + 1 info, both pre-existing and out of scope (see Out of scope) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 123 files / 2689 tests passed |
| unit | `pnpm test:coverage` | 0 | 97.82 stmts / 91.84 branches / 96.77 funcs / 98.74 lines — gate 90/85/88/95 |
| build-artifact | `pnpm build` | 0 | PWA generateSW, 54 precache entries / 1727.25 KiB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 138.7 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-3 | Every per-game logic suite has ≥1 seeded-injection determinism case | The 11 formerly direct-`Math.random` suites now pass a seeded `mulberry32` as the trailing rng argument; feelingsFaces/storyOrder gained same-rng sequence-equivalence cases in Phase 3 | satisfied |
| AC-4 | Zero global `Math.random` stubs in logic suites except documented default-wiring; one seeded helper; LCG + Park-Miller gone | `grep "vi.spyOn(Math" src/__tests__/game` → only `random.test.ts` (documented default-wiring) and `shapeSorterLogic.test.ts` (scoped try/finally default-wiring exception, A5). No `seededRng`/LCG/Park-Miller bodies remain | satisfied |
| AC-5 | Full `verify_phase` green | Commands table above: all 8 layers exit 0 | satisfied |
| AC-6 | Roadmap retires both entries; product changelog exists; `validate-docs` exits 0 | `docs/roadmap.md` Known Issues = "None." with the retirement note; Future Work = "None."; `conductor/product.md` gained `## Changelog - Shared Random Helpers (2026-10-25)`; validate-docs 5 passed | satisfied |
| FR-5 | One seeded helper in `src/__tests__/helpers/`; inline LCG + Park-Miller gone | `feelingsFacesLogic.test.ts` LCG body deleted, all call sites use `mulberry32`; `shadowMatchLogic.test.ts` Park-Miller `seededRng` deleted | satisfied |
| FR-6 | Test determinism via injected seeded rng; global stubs removed except scoped default-wiring | See AC-4 evidence | satisfied |
| FR-7 | Roadmap + product changelog truth pass; `validate-docs.js` passes | See AC-6 evidence | satisfied |
| NFR-3 | Coverage ≥ 95/88/85/90 | 97.82 / 91.84 / 96.77 / 98.74 | satisfied |
| NFR-4 | No new deps; budgets unbroken; runtime unchanged | No `package.json` change; shell 138.7 kB ≤ 200 kB; Phaser vendor unchanged at 1342.6 kB | satisfied |

## Files touched

- `src/__tests__/game/` — 19 logic suites migrated (addItUp, alphabet, animalTrace, bigSmall, colorMatch, count, decode, feelingsFaces, firstSounds, memoryMatch, moreLess, musicalMemory, numberOrder, oddOneOut, patternBuilder, popFreeze, shadowMatch, shapeSorter, takeAway, word)
- `src/__tests__/scenes/` — 4 flow suites annotated as the FR-6 scene-level exception (animalTraceFlow, musicalMemoryFlow, patternBuilderFlow, popFreezeFlow)
- `docs/roadmap.md` — both entries retired
- `conductor/product.md` — new changelog section

## Deviations

1. **Flow-suite stubs kept as a documented FR-6 exception.** The rng seam stops at the logic boundary (A4), so `animalTraceFlow`, `musicalMemoryFlow`, `patternBuilderFlow` and `popFreezeFlow` cannot inject a generator into the scene's own draw calls. Their `vi.spyOn(Math, "random")` stubs are retained with an inline comment marking them the FR-6 exception. Removing them would require extending the seam into the scenes, which A4 explicitly puts out of scope.
2. **`shapeSorterLogic.test.ts` keeps one scoped `vi.spyOn`.** `generatePlaythrough(roundCount, shift)` takes no rng parameter (A5 — it inherits the seam internally), so the "classic draws are identical with and without the shift argument" test uses a `try/finally` `mockRestore` scoped to that single assertion, commented with the FR-6/A5 reference.
3. **Two suites needed a mechanical argument-order fix.** `oddOneOutLogic.createRound(band, usedOddTextures, rng)` puts the rng third, and the partial migration had passed it second, failing one test; corrected to `createRound(2, undefined, mulberry32(1234))`.
4. **Formatter pass over the 24 changed test files.** `biome check --write` was run over exactly the files this phase changed, to repair trailing-newline and line-wrap artifacts introduced by scripted edits. No semantic changes.
5. **Expectations re-derived, not loosened.** Tests that asserted a specific draw from a mocked constant (e.g. `generateSequence(2)` → `[0, 1]` from `0.0`/`0.5`) now assert same-seed equality plus the invariant they were really protecting (range, length, run cap), because the seeded helper produces different specific values than the mocked constants. No assertion was deleted or weakened in intent.

## Notes

- The scene-level `Math.random` stubs are a *pre-existing* pattern, not something this phase introduced; they are annotated rather than removed so a future track can decide whether the seam should reach the scenes.
- `src/scenes/StoryOrderScene.ts:90` passes `Math.random` explicitly by design (A4) and is out of scope.
- `src/utils/completionEffect.ts` uses `Math.random` for confetti scatter — cosmetic, out of scope per the spec's Out-of-scope list.

## Out of scope (pre-existing, untouched)

- `src/__tests__/scenes/musicalMemoryScene.test.ts:294` — `noNonNullAssertion` warning.
- `biome.json:2` — `$schema` says 2.5.5 while the CLI is 2.5.10 (info).

## Primary verification

The phase executor's subagent session was terminated by the host before it
could commit (out-of-credits), so the primary completed the migration, ran
the gate itself, and recorded this section against checkpoint `5db21858`.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | 256 files; 1 pre-existing warning (`musicalMemoryScene.test.ts:294`) + 1 pre-existing info (`biome.json` schema) |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 123 files / 2689 tests passed |
| unit | `pnpm test:coverage` | 0 | 97.82 stmts / 91.84 branches / 96.77 funcs / 98.74 lines |
| build-artifact | `pnpm build` | 0 | 344 modules; 54 precache entries (1727.25 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 138.7 kB (<= 200 kB) |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

**Result:** verified

Note on the commit range: the executor produced no commits before it died,
so `6bd287e4..HEAD` was empty at handoff. The primary authored the single
phase commit (26 files, +341/-535) and squashed it to `5db21858`; no
unreported or user commits were present in the range.

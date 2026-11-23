# Phase 1 evidence — Visit policy and selector

- **Track:** `20261124-replay-novelty`
- **Branch / base:** `feat/20261124-replay-novelty` @ `3df0f55f`
- **Scope:** P1.T1 (visit state), P1.T2 (no-repeat selector), P1.T3 (seeded metric)

## Files touched

| File | Change | Lines |
| --- | --- | --- |
| `src/game/replayVariety.ts` | new — pure visit state + selector | 154 |
| `src/__tests__/game/replayVariety.test.ts` | new — 16 unit/simulation tests | 245 |
| `conductor/tracks/20261124-replay-novelty/verification/phase-1.md` | new — this evidence (mandated by brief) | — |
| `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` | living suite-count refresh only: 154 files / 3,346 tests → 155 files / 3,362 tests | — |

Coverage percentages, verification dates, historical narrative and file names in those docs are unchanged.
No other file was edited. `plan.md`, `metadata.json`, `tracks.md` and save data are untouched.

## Before / after counts

| Metric | Before (base `3df0f55f`) | After (this phase) |
| --- | --- | --- |
| Production TypeScript modules under `src` | 167 | 168 |
| Test files | 154 | 155 |
| Tests | 3,346 | 3,362 (+16) |
| New production lines | 0 | 154 |
| New test lines | 0 | 245 |

The suite-count delta is exactly the 16 tests / 1 file added here.

## Acceptance-criteria mapping

| AC / FR | Where proved | Result |
| --- | --- | --- |
| AC-1 / FR-1 | `visit state — FR-1 / AC-1`: empty on create; idempotent play recording; read-only view; profile reset; `Storage.prototype.setItem` spy not called | PASS |
| AC-2 / FR-2 | `no-repeat selector — FR-2 / AC-2`: excludes just-played and just-suggested; honours extra exclusions; forced repeat observable for single-game and exhausted pools; inputs not mutated | PASS |
| AC-3 / FR-3 | `deterministic ordering — FR-3 / AC-3`: unplayed-first; older/newer `lastPlayedAt`; null/invalid as never-played; identical stamps by registry order | PASS |
| AC-8 / FR-8 | `seeded session metric — FR-8 / AC-8`: 1,200 seeded eight-play visits, median distinct >= 4, zero unexpected immediate repeats, zero forced repeats | PASS |
| NFR-1 | Pure module with injected `Stamps`; no storage/Phaser/localStorage import; 154 lines; module-size guard green | PASS |

## Commands and results

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm exec vitest run src/__tests__/game/replayVariety.test.ts` | 0 | 1 file passed, 16 tests passed |
| `pnpm check` | 0 | clean (two formatting issues found on first run and fixed) |
| `pnpm typecheck` | 0 | clean |
| Living suite-count refresh (`README.md`, `docs/TDD.md`, `docs/perf-baseline.md`) | n/a | 154 files / 3,346 tests → 155 files / 3,362 tests at every living claim; only the two numbers changed |
| `node scripts/validate-docs.js` | 0 | re-run after the count refresh: 5 passed / 0 failed (first run was 4/1 on count drift) |
| `pnpm exec vitest run src/__tests__/game/replayVariety.test.ts` | 0 | re-run: 1 file passed, 16 tests passed |
| `pnpm check` | 0 | re-run: clean |
| `pnpm typecheck` | 0 | re-run: clean |
| `pnpm exec vitest run` (informational) | 0 | 155 files passed, 3,362 tests passed |
| `node scripts/validate-module-size.js` (extra) | 0 | 168 modules, zero warnings |

## Deviations

- `Stamps` is modelled as `GameId -> string | null` (the `lastPlayedAt` value); Phase 2 will derive it from `getProgress()`. This keeps the module dependency-free as requested.
- The final tie-break uses the position in the caller-supplied `games` array, documented as `GAME_REGISTRY` order. This keeps the module injected/pure instead of importing the registry.
- `forcedRepeat` is also `true` when the game pool has exactly one entry, matching the brief's "if the pool has one game, that game is the forced repeat".
- `recordVisitPlay` records a repeat play idempotently in the set but still updates the just-played marker, matching "records a played game once per launch".

## Blockers

- Resolved. The only blocker was cross-phase living-count drift: `node scripts/validate-docs.js` initially exited 1 because the mandated Phase 1 test file moved derived suite truth to 155 files / 3,362 tests while `README.md:49`, `docs/TDD.md:1314,1320` and `docs/perf-baseline.md:3,421,758,790,851` still stated 154 files / 3,346 tests. The primary accepted the scope expansion and updated Phase 1 Touches, so those living claims were refreshed within Phase 1; the guard now reports 5 passed / 0 failed. The historical "same 154 files" line at `docs/perf-baseline.md:801` was deliberately left unchanged as dated narrative, and the validator does not flag it.

## Primary verification (orchestrator, independent)

- Working tree contained only the primary's unstaged `plan.md` Touches expansion; the phase commits `13947f6a` and `f92d7db2` touched only the two implementation files, the three living-count docs and this evidence file.
- `git diff --name-only 3df0f55f..HEAD` confirmed no file outside the expanded Phase 1 Touches.
- Full `verify_phase` chain exited 0 on the final Phase 1 tree: `pnpm check` (Biome clean, 366 files); `pnpm typecheck` (src + e2e clean); `pnpm test -- --run` (155 files / 3,362 tests); `pnpm test:coverage` (155 files / 3,362 tests; statements 97.15% 7615/7838, branches 90.98% 2280/2506, functions 96.30% 1694/1759, lines 98.31% 7065/7186 against gates 95/88/85/90); `pnpm build` (Vite 8.3.5, 487 modules, shell `index-BFkG8G2w.js` 193.62 kB Vite / 189.1 kB via validator with a 200 kB ceiling, Phaser vendor 1,367.08 kB pre-existing advisory); `validate-bundle.js` PASS; `validate-module-size.js` 168 TS files, zero warnings; `validate-textures.js` 319 SVGs with typical 76.07 MiB ≤80, full 319.00 MiB ≤320, ratio 0.238 ≤0.5; `validate-pwa.js` 16/16 with 63 precache entries and 51/51 JS chunks; `validate-docs.js` 5/5.
- The seeded simulation covers 1,200 eight-play visits; AC-1/2/3/8 are satisfied by 16 passing tests in `src/__tests__/game/replayVariety.test.ts`.

## Result

Result: verified

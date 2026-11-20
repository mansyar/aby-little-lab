# Phase 1 — A probe is a counter, not an answer

- Track: 20261117-debug-probes
- Phase: 1 of 4
- Branch: fix/20261117-debug-probes
- Base / Head: e6315890 / (phase commit)
- Date: 2026-11-17
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome clean over 337 files |
| static | `pnpm typecheck` | 0 | both projects |
| unit | `pnpm test -- --run` | 0 | 153 files / 3,316 tests |
| coverage | `pnpm test:coverage` | 0 | 97.12 / 90.96 / 96.20 / 98.31 |
| build-artifact | `pnpm build && node scripts/validate-bundle.js` | 0 | entry `index-B9puu3_y.js` 186.6 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16/16 |
| documents | `node scripts/validate-docs.js` | 0 | 5/5 |

Full-chain evidence: `.conductor/evidence/20261117-debug-probes/phase-1-gate.log` — `GATE EXIT: 0`.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | An old save with no probe field loads with `probes: 0` and every other counter intact | `src/__tests__/game/progressLogic.test.ts` (probes › backfills an old save), `src/__tests__/utils/storage.test.ts` (reads a save written before probes existed as zero probes) | pass |
| AC-2 | A result recorded with probes reports the same accuracy and adaptive window as the same result without them | `src/__tests__/game/progressLogic.test.ts` (probes › accumulates probes without moving accuracy or the adaptive window) | pass |
| FR-4 | Probes ride the existing single write | `src/__tests__/utils/storage.test.ts` (stores probes without scoring them as answers; flushes an abandoned session's probes in the same write) | pass |

## Decisions

- **D1 — probes live on `GameProgress`** → added an additive `probes: number`,
  backfilled by `normalizeProgress`, no storage-version bump. Old saves read 0.
- **D3 — probes do not feed adaptive difficulty** → `updateRecentWindow` still
  receives `correct`/`wrong` only; a test pins that the window is identical with
  and without probes.
- **D6 — probes travel as an optional trailing argument** → `recordGameResult`
  and `recordGameTaps` gained `probes = 0`, so every existing call site compiles
  unchanged.

## Deviations

- `src/utils/backupFormat.ts` — outside `Touches`. `mergeProgress` builds a
  `GameProgress` field by field, so the new field had to be merged there
  (`Math.max`, like every other counter, keeping a re-import idempotent) or the
  type error would have failed the phase. Covered by a new test in
  `src/__tests__/utils/backupFormat.test.ts`.
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — outside `Touches`. The
  documents validator derives the suite truth from the test run, so the new
  probes tests (3,306 → 3,316) had to be restated in the same phase. Phase 4 was
  going to touch two of these files anyway; the count restatement simply landed
  earlier than planned.

## Notes

- The archived track's own evidence files still state 3,306, because they record
  what was true on 2026-11-16; a stray bulk edit touched four of them and was
  reverted before this gate ran.
- Coverage moves branch coverage 90.93 → 90.96 because the probe paths add
  covered branches; nothing is excluded.

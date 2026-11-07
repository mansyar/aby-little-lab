# Phase 1 verification — Local Insights: The record

| Field | Value |
| --- | --- |
| Track | `20261108-local-insights` |
| Phase | 1 — The record |
| Date | 2026-11-08 |
| Branch | `feat/20261108-local-insights` |
| Phase base | `42e3fc56` |
| Head | `e53c3cc6` |

## Commands

One chained run on the committed tree (`e53c3cc6`), exit code 0:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Step | Result |
| --- | --- |
| `pnpm check` (biome) | `Checked 298 files in 411ms. No fixes applied.` — pass |
| `pnpm typecheck` | `tsc --noEmit` and `tsc --noEmit -p e2e/tsconfig.json` — pass, no output |
| `pnpm test -- --run` | `Test Files 136 passed (136)`, `Tests 2956 passed (2956)` — pass |
| `pnpm test:coverage` | gate pass; statements 97.21 (5997/6169), branches 91.27 (1685/1846), functions 96.21 (1321/1373), lines 98.22 (5577/5678) against 95 / 88 / 85 / 90 |
| `pnpm build` | `✓ built in 1.19s`, 364 modules |
| `node scripts/validate-bundle.js` | Phaser chunk present; shell entry `index-BkVZzHl3.js` = 154.8 kB (≤ 200 kB) — pass |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` (47 chunks, 47 precached) — pass |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed` (suite truth 136 files / 2956 tests) — pass |

An earlier run of the same chain failed only on the living-document counts (8 document
failures), which were then refreshed; the failure was in the documents, never in the code.

Coverage moves by a fraction of a point between identical runs (observed across three runs:
statements 97.19–97.21, branches 91.22–91.27). The living documents quote the final run above.

## Acceptance

| AC | Verdict | Proof (test names) | Arithmetic |
| --- | --- | --- | --- |
| AC-1 | pass | `insightsLogic.test.ts`: "counts three consecutive days as a streak of three", "leaves the record unchanged for a second completion on the same day"; `storage.test.ts`: "advances the streak by exactly one for a completion", "does not advance twice for two completions on the same day", "advances the streak on the following day" | day 1 → current 1 / best 1; day 2 → 2 / 2; day 3 → 3 / 3; a fourth completion on day 3 → still 3 / 3 (`advanceStreak` returns the normalised record unchanged because `lastStreakDay === todayKey(now)`) |
| AC-2 | pass | `storage.test.ts`: "loads a pre-track payload with a zeroed record, still schemaVersion 1", "records nothing new when the stored payload is write-protected"; pre-existing "serves in-memory defaults for an unknown version and never touches the stored bytes", "never lets the memo cache overwrite a write-protected payload" | pre-track body has no `insights` key → `getActiveProfile().insights` equals `createDefaultInsights()` (0 / 0 / null / 0 / null); the next write stamps `schemaVersion: 1` and the only body change is the backfilled zeroed record; a `schemaVersion: 99` payload keeps byte-identical raw after `recordGameResult` and `recordLimitHit`, with zero `setItem` calls |
| AC-3 | pass | `insightsLogic.test.ts`: "restarts at 1 after a two-day gap and keeps the earlier best", "restarts at 1 after a month away and keeps the best", "restarts at 1 when the stored day is in the future, keeping the best", "never lowers the best, however many times the streak restarts" | day 1..3 → 3 / 3; skip day 4, play day 5 → current 1, best 3; a stored day 30 days earlier → current 1, best 9; `lastStreakDay` in the future → current 1, best 12 (clock moved backwards) |
| AC-4 | pass | `storage.test.ts`: "counts one cap-day per local day", "counts the cap again on the next day", "never counts a cap-day for a profile with no limit", "writes nothing when the same cap-day is already recorded"; `PlayTimeIndicator.test.ts`: "records one cap-day for the active profile when the tiles lock", "draws nothing when the profile has no limit" | two cap days → `limitHitDays` 2 (last key = the second day); two hits on one day → 1, and the second call makes no `setItem` call; `limitMinutes: null` → stays 0 / null; the lock path calls `recordLimitHit(getActiveProfile().id)` exactly once |

## NFR evidence

- **NFR-2 writes.** "writes once per completion, however the streak moves" — one `setItem` per
  `recordGameResult`, and the streak is folded into the `mutate` that already existed (no second
  write). "writes once per abandoned session, not once per tap" — `recordGameTaps` writes once per
  batch. "writes nothing when the same cap-day is already recorded" — the mutator returns `null`, so
  `mutate` short-circuits and the stored bytes are unchanged. No read was added to hub construction;
  the indicator reads `getPlayTime()` and `getActiveProfile()` from the existing memo.
- **NFR-1 schema.** `SCHEMA_VERSION` is still `1`, the key is still `abby-little-lab:v2`, and the
  unknown-version guard is untouched (its existing tests still pass; the new test above exercises it
  through the two new write paths).

## Evidence paths

- `src/types/index.ts` — `ProfileInsights` (five fields, documented) and `Profile.insights`.
- `src/game/insightsLogic.ts` — `createDefaultInsights`, `normalizeInsights`, `advanceStreak`.
- `src/game/profileLogic.ts` — `createDefaultProfile` seeds the record; `normalizeV2` backfills it.
- `src/utils/storage.ts` — `recordGameResult` folds `advanceStreak` into its single `mutate`;
  `recordLimitHit(profileId, now)`.
- `src/components/PlayTimeIndicator.ts` — the lock path records the cap-day.
- `src/__tests__/game/insightsLogic.test.ts` — 16 tests.
- `src/__tests__/utils/storage.test.ts` — "insights" suite, 12 tests, plus the refreshed
  "schema versioning" expectation.
- `src/__tests__/components/PlayTimeIndicator.test.ts` — the lock-path test and the unlimited guard.
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — suite and coverage counts, verified date.

## Deviations

1. **Living-document counts (pre-authorised).** `README.md`, `docs/TDD.md` and
   `docs/perf-baseline.md` are in Touches for suite counts only. Refreshed 135 files / 2,927 tests
   → 136 files / 2,956 tests, the four coverage percentages with their raw counts, and the
   `verified 2026-11-07` date on the perf-baseline rows → `2026-11-08`. Nothing else in those
   documents was edited.
2. **`src/game/profileLogic.ts` (widened, outside Touches).** The brief said to normalise insights
   "wherever a `ProfileV2` is already normalised", and that normaliser is `normalizeV2` in
   `profileLogic.ts`; `createDefaultProfile` is the only profile factory, so it seeds the record too.
   Both changes are one line each (plus the import).
3. **`recordLimitHit` refuses an unlimited profile at the writer.** The brief specified the
   same-day idempotence check; FR-3 also says a profile with `limitMinutes: null` never increments,
   and the brief asked for that to be asserted rather than trusted to the call site. The writer now
   declines when the profile has no limit, so the storage-level test can pin it directly.
4. **One existing assertion updated in `storage.test.ts`.** "stamps a legacy unstamped payload as
   version 1 and stamps it on the next write" compared the whole stored body; the first write now
   also backfills the zeroed record, so the expectation states exactly that (the stamp plus the
   backfilled `insights`, nothing else). The file is in Touches.

## Blocked

Nothing was denied or left unrun.

## Notes

- The read path is `Profile.insights` (`getActiveProfile().insights`, `getProfiles()[i].insights`);
  no new storage getter was added, so the public getter surface is unchanged. Phase 2's
  `summariseInsights(profile, now)` can take a `Profile` directly.
- `advanceStreak` normalises its input, so a future caller may pass a stored `insights` field
  without a separate normalisation step. It never mutates its argument (asserted with a frozen
  record).
- The streak only advances from `recordGameResult` (completed sessions); abandoned sessions fold
  taps only, as before. The cap-day is only recorded from `PlayTimeIndicator`, which is the sole
  production `isLimitReached` call site.
- `recordLimitHit` takes an explicit profile id but is currently always called with the active one.
  A backgrounded hub that re-applies the lock re-runs the same call and writes nothing.
- Day arithmetic steps the calendar date (`new Date(y, m, d - 1)`), not a 24-hour subtraction, so a
  daylight-saving change cannot merge or skip a day. Day keys are always derived from an explicit
  instant in tests; no `lastStreakDay` literal exists in the tree.

## Primary verification

Verified 2026-11-08 by the primary agent, independently of the executor.
Phase base `42e3fc56`, head `e53c3cc6`.

| Check | Result |
| --- | --- |
| Working tree | clean before the primary's runs |
| Commits in range | 4, no merges, all reported |
| Scope diff | 12 files: 4 `src/` production, 4 test files, 3 living docs, the evidence file |
| `pnpm check` | `Checked 298 files in 386ms. No fixes applied.` - exit 0 |
| `pnpm typecheck` | both programs, no output - exit 0 |
| `pnpm test -- --run` | `Tests 2956 passed (2956)`, 22.37 s - exit 0 |
| `pnpm test:coverage` | statements 97.19 / branches 91.22 / functions 96.21 / lines 98.22 against 95 / 88 / 85 / 90 - exit 0 |
| `pnpm build` | `built in 946ms`, 59 precache entries (1752.29 KiB) - exit 0 |
| `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell `index-BkVZzHl3.js` 154.8 kB <= 200 kB - exit 0 |
| `node scripts/validate-pwa.js` | `Results: 16 passed, 0 failed` - exit 0 |
| `node scripts/validate-docs.js` | `Results: 5 passed, 0 failed` (suite truth 136 files / 2956 tests) - exit 0 |

### The code was read, not the report trusted

- `src/game/insightsLogic.ts` (91 lines) is pure: `advanceStreak` takes `now`
  as a parameter and reads no clock itself, `previousDayKey` steps the calendar
  date rather than subtracting 24 hours so a daylight-saving change cannot
  repeat or skip a day, and `normalizeInsights` is total — `readField` refuses
  non-objects, `count` requires a non-negative integer, `dayKey` requires a
  non-empty string, and the best is raised to the current streak on an
  inconsistent pair.
- The streak advance is folded into the **existing** `recordGameResult`
  `mutate`, so a completion is still one write rather than two (the stronger
  reading of NFR-2, which allowed one extra).
- `recordLimitHit` declines the mutation on three paths — unknown profile,
  no daily limit, and the day already counted — and `mutate`'s null contract
  means a declined call writes nothing. The unlimited guard lives at the writer
  as well as the call site, so FR-3 cannot be lost by a future caller.
- The one call site is the block that actually locks the tiles
  (`PlayTimeIndicator`), which is the decision that makes the lock true rather
  than a second observer of it.
- `SCHEMA_VERSION` is still `1` and `readStorage`/`saveV2` are untouched; the
  backfill reaches a profile through the same `normalizeV2` path that
  normalises `playTime`, `progress` and `activity`.

### Acceptance

AC-1, AC-2, AC-3 and AC-4 pass on the evidence's arithmetic, and the test names
it cites exist and assert what it says, including the midnight-straddle edge
case ("treats a session either side of midnight as two days") and the NFR-2
write-count case ("writes once per completion, however the streak moves"). The
executor's coverage reading (97.21 / 91.27) and the primary's (97.19 / 91.22)
differ by instrumentation noise, as every previous track's have; both are inside
the gate.

### Deviations accepted

1. `src/game/profileLogic.ts` was added to Touches because the backfill belongs
   where every `ProfileV2` already passes (`normalizeV2` and
   `createDefaultProfile`) — three lines plus an import.
2. One pre-existing assertion in `storage.test.ts` that compared a whole stored
   body was updated, because the first write now also backfills the zeroed
   record. This is a consequence of FR-1, not a weakened test.
3. The living-document counts were refreshed mechanically to 136 files /
   2956 tests, as `validate-docs` requires.


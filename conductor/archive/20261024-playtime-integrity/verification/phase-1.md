# Phase 1 — Honest conversion and the midnight boundary

- Track: `20261024-playtime-integrity` — Play-Time Session Integrity
- Phase: 1 — Honest conversion and the midnight boundary (covers FR-2, FR-3, AC-2, AC-3)
- Date: 2026-10-24
- Branch: `fix/20261024-playtime-integrity`
- Base commit: `9af21dc69f0f006c45dc56299d031a2b341b541f`
- Head commit: `1a18a7ac04f04ec65fe6a5fc8046a16a02ca88a8`
- Result: **blocked** — implementation and targeted checks are complete; the phase
  verification command was rejected by the tool permission policy and has not run.

## What changed

`src/game/playTimeLogic.ts`

- Added local helper `localMidnight(now: number): number` —
  `new Date(y, m, d, 0, 0, 0, 0).getTime()` derived from the same `now` the
  session banks with, so the boundary follows local time (and DST) rather than UTC.
- `endPlaySession()` now computes `visibleMs = visibleElapsedMs(session, now)`,
  clamps to `Math.min(visibleMs, Math.max(0, now - localMidnight(now)))`, and
  converts with `Math.ceil(elapsed / 60_000)`. The existing
  `elapsed <= 0 ? 0 : …` guard is kept, so zero/backwards clock still banks
  exactly `0`.
- Doc comment updated: "rounded to the nearest minute" → ceiled, plus the
  rationale that the record is a single-day snapshot (`limitMinutes`,
  `usedMinutes`, `lastUsedDate`) with no per-day history, so a closed day's
  usage cannot be written and must not be charged to the new day.
- No new imports (`../types` only), so the `storage → playTimeLogic` direction is
  intact and no cycle is introduced.

`src/__tests__/game/playTimeLogic.test.ts`

- New `describe("minute conversion (ceil)")`: 1 ms and 59 s both bank `1`;
  45 min 29 s banks `46`; start-then-end-immediately banks `0`; backwards clock
  banks `0`.
- New `describe("midnight boundary (clamp)")`: 23:58 → 00:02 with four minutes of
  visible time banks `2`; a session wholly before midnight (12:00 + 45 min) is
  unaffected (`45`); a session ending exactly at local midnight banks `0` for the
  new day; a session paused 23:55 and resumed 00:01, ended 00:03, has 7 visible
  minutes but banks `3` (only the post-midnight part).
- `"starts a session and ends it with rounded whole minutes"` renamed to
  `"… ceiled whole minutes"` (expectation `3` is unchanged: 2.5 min rounds and
  ceils to 3 alike).

`src/__tests__/scenes/hubPlayTime.test.ts` (outside Phase 1 `Touches` — see
Deviations)

- Two Hub expectations legitimately re-partitioned by the ceil, because the Hub
  calls `endPlaySession()` with a *second*, later `Date.now()` than the test's
  start time, so a whole-minute offset becomes a hair over a minute:
  - `"records the elapsed session minutes on return to the hub"`: start offset
    `3 * 60 * 1000` → `2.5 * 60 * 1000`, expectation still `3`.
  - `"records against the profile that started the session"`: start offset
    `2 * 60 * 1000` → `1.5 * 60 * 1000`, expectation still `2`.
  Mid-minute offsets make the ceiled total unambiguous however many milliseconds
  the two clock reads straddle.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| unit (red) | `pnpm test -- --run src/__tests__/game/playTimeLogic.test.ts` | 1 | 6 of 52 failed before the implementation: 10 s → 0 (want 1), 1 ms → 0 (want 1), 45m29s → 45 (want 46), 23:58→00:02 → 4 (want 2), end-at-midnight → 2 (want 0), pause/resume across midnight → 7 (want 3). Red-then-green confirmed. |
| unit (green) | `pnpm test -- --run src/__tests__/game/playTimeLogic.test.ts` | 0 | 52/52 passed. |
| unit (regression) | `pnpm test -- --run src/__tests__/scenes/hubPlayTime.test.ts src/__tests__/utils/storage.test.ts` | 1 | Before the Hub offset fix: 2 failed / 116 passed — `expected 4 to be 3` and `expected 3 to be 2`, both the whole-minute-straddle ceil. |
| unit (regression) | `pnpm test -- --run src/__tests__/scenes/hubPlayTime.test.ts src/__tests__/game/playTimeLogic.test.ts src/__tests__/utils/storage.test.ts` | 0 | 170/170 passed after the offset fix. |
| static | `pnpm check` | 0 | Biome clean; 1 pre-existing warning (`musicalMemoryScene.test.ts:294` non-null assertion) and 1 info (biome.json schema 2.5.5 vs CLI 2.5.10) remain, untouched by this phase. |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| **phase gate** | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | — | **Not run — rejected by the tool permission policy (`Permission denied: shell`).** Per the phase brief this is not retried, rephrased, chained differently, or worked around. The primary must run it and hand back the output. |

Not executed: full suite (`pnpm test -- --run`), `pnpm test:coverage`, `pnpm build`,
`node scripts/validate-bundle.js`, `node scripts/validate-pwa.js`,
`node scripts/validate-docs.js`.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-2 | 45 min 29 s of play banks 46 minutes, and a zero-elapsed session banks 0 | `playTimeLogic.test.ts` › "banks 46 minutes for 45 minutes 29 seconds of visible time" (46); "banks zero for a session ended the moment it starts" (0); "banks a full minute for ten seconds of visible time" (1) — all green | met in unit tests; full gate pending |
| AC-3 | A session from 23:58 to 00:02 banks 2, not 4 | `playTimeLogic.test.ts` › "charges the new day only for post-midnight time" (2); supporting: "banks zero for the new day when the session ends exactly at midnight" (0), "clamps a session paused before midnight and resumed after it" (3 of 7 visible), "leaves a session wholly inside one day unaffected" (45) | met in unit tests; full gate pending |
| FR-2 | Visible time converts with `Math.ceil`; zero banks exactly 0 | `endPlaySession()` in `src/game/playTimeLogic.ts`; no `Math.round` remains in the module | met |
| FR-3 | Banked minutes clamped to `min(visibleMs, now - localMidnight(now))`; pre-midnight portion not written | `localMidnight()` + the `Math.min(…)` clamp in `endPlaySession()`, with the single-day-snapshot rationale in the doc comment; midnight tests above | met |

## Pre-existing expectations changed (P1.T2.3)

The brief expected none; the ceil legitimately changes four, all recorded above.
No pre-existing *outcome* was re-partitioned by the midnight clamp — every
existing fixture (`DAY` = 2026-08-05 10:00 local, `NEXT_DAY` = 2026-08-06 09:00,
and the visibility suite's `T0` = 10:00 plus offsets up to 17 minutes) sits well
inside one day. The changes are:

1. `playTimeLogic.test.ts` "records zero minutes for a very short session" →
   "banks a full minute for ten seconds of visible time", expectation `0` → `1`
   (the ceil, by design).
2. `playTimeLogic.test.ts` "rounded whole minutes" → "ceiled whole minutes";
   expectation unchanged at `3` (2.5 min ceils to 3 as it rounded to 3).
3. `hubPlayTime.test.ts` "records the elapsed session minutes on return to the
   hub": input offset 3 min → 2.5 min, expectation unchanged at `3`.
4. `hubPlayTime.test.ts` "records against the profile that started the session":
   input offset 2 min → 1.5 min, expectation unchanged at `2`.

## Evidence paths

- `conductor/tracks/20261024-playtime-integrity/verification/phase-1.md` (this file)
- No `.conductor/evidence/` artifacts: the failing/passing runs above were
  captured inline; nothing large needed to be kept.

## Deviations

| File | Reason |
|---|---|
| `src/__tests__/scenes/hubPlayTime.test.ts` | Outside Phase 1 `Touches` (it belongs to Phase 3). Two of its Hub expectations bake in a whole-minute start offset and failed once the ceil landed, because the Hub ends the session with a later `Date.now()` than the test's start time. Without the fix the gate could not pass. Smallest change: the two start offsets became mid-minute; both expectations are unchanged. |

## Notes

- The phase gate is the only missing step. Everything the gate would newly cover
  (build output, bundle/PWA/docs validators, coverage thresholds) is untouched by
  this change: the diff is one logic module and tests, with no new dependency, no
  new file, and no build or asset surface change.
- `pnpm check` prints a `biome.json` schema-version info and one non-null-assertion
  warning in `musicalMemoryScene.test.ts`; both pre-date this phase and were left
  alone.
- Hidden-time exclusion, pause/resume idempotency, and the "inert where
  `visibilityState` is undefined" behaviour are unchanged and still green.

## Primary verification

Run by the primary agent from the repository root after the subagent's report,
because the subagent's shell policy rejected the chained gate. Each layer was run
verbatim; nothing was re-chained into a single invocation.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| working tree | `git status --porcelain` | 0 | clean |
| diff scope | `git diff --name-only 9af21dc..HEAD` | 0 | one logic module, two test files, this evidence file — matches `Touches` plus the reported deviation |
| static | `pnpm check` | 0 | 249 files checked; 1 warning + 1 info, both pre-existing and unrelated |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 119 files / 2564 tests passed (was 2556 before the phase: +8 new tests) |
| coverage | `pnpm test:coverage` | 0 | 97.94 / 91.88 / 96.6 / 98.7 — unchanged from the track base |
| build | `pnpm build` | 0 | built |
| bundle | `node scripts/validate-bundle.js` | 0 | shell entry `index-Bb9pjEBC.js` = 134.7 kB (≤ 200 kB) |
| pwa | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed |

**Result:** gate green end to end. The deviation in
`src/__tests__/scenes/hubPlayTime.test.ts` is accepted: two whole-minute start
offsets became mid-minute so the ceiled expectation is unambiguous across the two
clock reads; no expectation changed. The evidence file's "not run" line above is
superseded by this section.

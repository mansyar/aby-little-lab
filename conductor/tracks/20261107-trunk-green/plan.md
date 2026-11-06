# Trunk Green — Wall-Clock-Safe Test Fixtures - Implementation Plan

> **Branch:** `chore/20261107-trunk-green`
> **Base:** `master` @ `6cd2d85a867d704039decb8427a4ebece7cc68bc`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Audit and convert the clock stand-ins

- **Goal:** every date literal in the test tree carries a recorded verdict, and no fixture stands in for "today" with a literal.
- **Depends on:** none
- **Covers:** FR-1, FR-3, AC-1, AC-3
- **Touches:** `src/__tests__/components/PlayTimeIndicator.test.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/game/hub/hubPrewarm.test.ts`, `conductor/tracks/20261107-trunk-green/verification/`
- **Verification:** `pnpm test -- --run`
- **Status:** verified

- [x] **P1.T1: Classify the 29 date literals** - covers: FR-1
  - [x] **P1.T1.1: Enumerate every hit** with file, line, field name and the API that consumes the value
  - [x] **P1.T1.2: Write `verification/date-literal-audit.md`** with one verdict per entry (`data` or `clock stand-in`) and the reason
- [x] **P1.T2: Convert the play-time indicator fixture** - covers: FR-3
  - [x] **P1.T2.1: Replace `lastUsedDate: "2026-01-01"`** with a value derived from a `FIXED_NOW` clock via `todayKey`
- [x] **P1.T3: Resolve the storage and prewarm fixtures** - covers: FR-3
  - [x] **P1.T3.1: `storage.test.ts` backfill payload** - read through `normalizePlayTime`, so it compares with today; converted to `todayKey()`
  - [x] **P1.T3.2: `hubPrewarm.test.ts` recency payload** - relative order only; left as data
- [x] **P1.T4: Prove no literal remains** - covers: AC-3
  - [x] **P1.T4.1: Grep** for a quoted date assigned to `lastUsedDate`; zero hits

**Result:** verified
**Checkpoint:** `f08e956c`
**Evidence:** `conductor/tracks/20261107-trunk-green/verification/phase-1.md`

## Phase 2: Guard and style rule

- **Goal:** the suite itself rejects the pattern, and the rule is written where the next author will read it.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-4, FR-5, NFR-1, NFR-3, AC-2, AC-4, AC-5, AC-6
- **Touches:** `src/__tests__/guard/fixture-clock.test.ts`, `conductor/code_styleguides/typescript.md`, `conductor/tracks/20261107-trunk-green/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P2.T1: Write the guard test** - covers: FR-2
  - [ ] **P2.T1.1: Scan every `.ts` under `src/__tests__`**, excluding the guard itself, matching a bare quoted `YYYY-MM-DD` assigned to `lastUsedDate`
  - [ ] **P2.T1.2: Assert with `relative path:line`**, listing every offending site rather than the first
- [ ] **P2.T2: Mutation proof** - covers: AC-2
  - [ ] **P2.T2.1: Add a violating line, capture the failure, revert, capture the pass**
  - [ ] **P2.T2.2: Record both outputs in `verification/phase-2.md`**
- [ ] **P2.T3: Write the style rule** - covers: FR-4
  - [ ] **P2.T3.1: Add `## 6. Tests and Time`** with the rule and the `gameLaunch` counter-example
- [ ] **P2.T4: Run the full gate** - covers: AC-6

## Phase 3: Timeout headroom for the 22-scene sweeps

- **Goal:** the coverage gate passes twice in a row on an unmodified tree, so a green gate means green code and not a lucky scheduler.
- **Depends on:** Phase 2
- **Covers:** AC-6
- **Touches:** `src/__tests__/scenes/navigation.test.ts`, `src/__tests__/scenes/hubEngagement.test.ts`, `conductor/tracks/20261107-trunk-green/verification/`
- **Verification:** `CI=true pnpm test:coverage` twice, then the full `verify_phase` chain
- **Status:** in_progress

- [ ] **P3.T1: Give the two sweeps their own budget** - covers: AC-6
  - [ ] **P3.T1.1: Raise the 22-scene sweep test** in `navigation.test.ts` and the
    tile-navigation sweep in `hubEngagement.test.ts` to a 60 s per-test budget,
    leaving the global `testTimeout: 30000` and every other test untouched
- [ ] **P3.T2: Prove the gate is stable** - covers: AC-6
  - [ ] **P3.T2.1: Run `CI=true pnpm test:coverage` twice back to back**; both must
    pass with no modification in between
  - [ ] **P3.T2.2: Run the full `verify_phase` chain** and record both coverage
    runs plus the chain in `verification/phase-3.md`


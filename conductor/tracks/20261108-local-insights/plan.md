# Local Insights - Implementation Plan

> **Branch:** `feat/20261108-local-insights`
> **Base:** `master` @ `64e35642ad33dbeeeb2ed85507a0c40795d8844d`

Phase states are `pending`, `in_progress`, `verified`, `failed`, `blocked`. Only
the primary agent writes this file.

## Phase 1: The record

- **Goal:** A completed session advances a per-profile streak once per local day, a reached daily cap counts once per local day, and old saves load with these fields backfilled at zero.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, NFR-1, NFR-2, AC-1, AC-2, AC-3, AC-4
- **Touches:** `src/types/index.ts`, `src/game/insightsLogic.ts`, `src/utils/storage.ts`, `src/components/PlayTimeIndicator.ts`, `src/__tests__/game/insightsLogic.test.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/components/PlayTimeIndicator.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (suite counts only), `conductor/tracks/20261108-local-insights/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Store the record** - covers: FR-1, AC-2
  - **P1.T1.1:** Add `ProfileInsights` to `src/types/index.ts` with the five fields of FR-1 and a doc comment saying what each one is for
  - **P1.T1.2:** Add `src/game/insightsLogic.ts` with `createDefaultInsights()` and `normalizeInsights(raw)` — zeros and nulls for missing, non-numeric, negative or impossible values, and `bestStreakDays` raised to `currentStreakDays` when the pair disagrees
  - **P1.T1.3:** Normalise insights in `src/utils/storage.ts` wherever a `ProfileV2` is read or migrated, leaving `SCHEMA_VERSION` at `1` and the key unchanged
- [x] **P1.T2: Advance the streak** - covers: FR-2, AC-1, AC-3
  - **P1.T2.1:** `advanceStreak(insights, now)` in `insightsLogic.ts`: same day means no change, yesterday means `+ 1`, anything else restarts at `1`; `bestStreakDays` is the running maximum; the clock is a parameter, never read inside
  - **P1.T2.2:** Call it from the completion path (`recordGameResult`) so one completion is one write
  - **P1.T2.3:** Unit tests for three consecutive days, a same-day repeat, a two-day gap, a month gap, and a `lastStreakDay` in the future
- [x] **P1.T3: Count cap-days** - covers: FR-3, AC-4
  - **P1.T3.1:** `recordLimitHit(profileId, now)` in `storage.ts`, idempotent per day key
  - **P1.T3.2:** Call it from where the tiles actually lock, so a backgrounded hub cannot lose the event; a profile with no limit never reaches it
  - **P1.T3.3:** Tests: two days increment twice, one day reached twice increments once, unlimited never increments
- [x] **P1.T4: Prove the shape survived** - covers: NFR-1, NFR-2, AC-2
  - **P1.T4.1:** A pre-track payload loads with zeroed insights, a still-`1` schema version, and an unchanged public getter surface
  - **P1.T4.2:** The unknown-version write protection still writes nothing (no regression of the storage-resilience guard)
  - **P1.T4.3:** Assert the write count: one extra `mutate` per completion, none per tap
  - **P1.T4.4:** Refresh the suite counts in the three living documents if the added tests move them

**Result:** verified - the record is stored, backfilled and preserved: a completion advances the streak once per local day inside the existing `recordGameResult` mutate (still one write), the daily cap counts once per day from the block that locks the tiles, and a pre-track save loads with zeros at `schemaVersion: 1`. 29 tests cover the arithmetic, the gaps, the midnight straddle, the unlimited guard and the write-protected payload.
**Checkpoint:** ed3d0bed
**Evidence:** conductor/tracks/20261108-local-insights/verification/phase-1.md

## Phase 2: The sentence

- **Goal:** One pure function turns a profile and a clock into the three statements the page will print, including for profiles with nothing to say yet.
- **Depends on:** Phase 1
- **Covers:** FR-4, FR-6, NFR-3, AC-5
- **Touches:** `src/game/insightsSummary.ts`, `src/__tests__/game/insightsSummary.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (suite counts only), `conductor/tracks/20261108-local-insights/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Derive what is already there** - covers: FR-4
  - **P2.T1.1:** `MIN_SUMMARY_TAPS` plus the derived helpers: games played in the last seven days from `lastPlayedAt`, lifetime completions from `wins`, overall completion rate from `wins / plays`, overall accuracy from `correct` vs `wrong`
  - **P2.T1.2:** Strongest and hardest game by accuracy among games with at least `MIN_SUMMARY_TAPS` answer taps, with a stable tie-break
  - **P2.T1.3:** Every ratio guarded against a zero denominator — the function must be total
- [x] **P2.T2: Say it in three lines** - covers: FR-4, FR-6
  - **P2.T2.1:** `summariseInsights(profile, now)` returns the three statements as text plus the raw numbers behind each, so the page never recomputes and the tests can assert the arithmetic
  - **P2.T2.2:** Empty, sparse (fewer taps than the floor), and unlimited variants each get their own sentence rather than a zero or a dash
- [x] **P2.T3: Prove the arithmetic** - covers: AC-5
  - **P2.T3.1:** Table-driven tests for the five profiles named in AC-5, asserting the statement text and the numbers, and asserting no `NaN`/`Infinity` appears in any output
  - **P2.T3.2:** A boundary test for a game sitting exactly at `MIN_SUMMARY_TAPS`, and one for a single wrong tap never being named hardest
  - **P2.T3.3:** Refresh the suite counts if they moved

**Result:** verified - one pure module turns a profile and an injected moment into the three statements plus their numbers. The week window is the one the 7-day strip draws, the strongest/hardest comparison sits on a ten-tap floor with a deterministic tie-break, and every ratio guards its denominator, so a brand-new, sparse or malformed profile still gets three readable sentences. 12 tests, including a finiteness walk and a purity proof.
**Checkpoint:** 78dca82c
**Evidence:** conductor/tracks/20261108-local-insights/verification/phase-2.md

## Phase 3: The page

- **Goal:** The Progress overlay opens on an Overview page that shows the three statements and the existing 7-day strip, with every per-game behaviour untouched.
- **Depends on:** Phase 2
- **Covers:** FR-5, NFR-3, AC-6
- **Touches:** `src/components/settings/ProgressOverlay.ts`, `src/__tests__/components/settings/ProgressOverlay.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (suite counts only), `conductor/tracks/20261108-local-insights/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Make the Overview page 1** - covers: FR-5
  - **P3.T1.1:** Insert an Overview page ahead of the per-game rows, built from the summary the page is given, not derived inside the renderer
  - **P3.T1.2:** Keep the 7-day strip on it and keep `PROGRESS_PAGE_SIZE` for the game pages, so the existing paging arithmetic still totals the same page count plus one
  - **P3.T1.3:** Text uses the overlay's existing typography and colours; no new asset, texture or scene
- [x] **P3.T2: Leave everything else where it was** - covers: AC-6
  - **P3.T2.1:** Per-game page numbering, the dot indicators, the profile switcher and the parental gate behave exactly as before
  - **P3.T2.2:** Page tests: first page is Overview and shows three statement texts; the second page is the first six games; the last page holds the remainder; switching profile re-renders the Overview
  - **P3.T2.3:** A reduced-motion or missing-insights profile still renders (no row, no throw)
  - **P3.T2.4:** Refresh the suite counts if they moved

**Result:** verified - the overlay opens on an Overview page holding the three statements and the unchanged 7-day strip; the summary is derived once per render for the viewed profile, the per-game rows keep six to a page one page later, paging clamps at both ends, and the counter totals five pages. Shell entry 157.4 kB of the 200 kB gate.
**Checkpoint:** dec26399
**Evidence:** conductor/tracks/20261108-local-insights/verification/phase-3.md

## Phase 4: The proof a parent can reach it

- **Goal:** A journey opens the hub, passes the parental gate, opens Progress, and reads all three statements on the first page; the documents describe the stored shape and the derived definitions.
- **Depends on:** Phase 3
- **Covers:** FR-8, FR-9, NFR-5, NFR-6, AC-7, AC-8, AC-9
- **Touches:** `e2e/journeys/insights.spec.ts`, `e2e/fixtures/`, `README.md`, `docs/TDD.md`, `conductor/product.md`, `docs/perf-baseline.md` (suite counts only), `conductor/tracks/20261108-local-insights/verification/`
- **Verification:** `pnpm test:e2e` then `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P4.T1: The journey** - covers: FR-8, AC-7, NFR-6
  - **P4.T1.1:** Seed a profile with completed sessions across a few days, then open the hub and read the published state rather than sleeping
  - **P4.T1.2:** Hold the settings gate until it opens (`holdCanvasUntil`), open Progress, and assert the three statements are readable on page 1 with no paging step
  - **P4.T1.3:** Assert the journey adds no console or page error, and keep its runtime inside the suite's budget
- [x] **P4.T2: The documents** - covers: FR-9, AC-9
  - **P4.T2.1:** `docs/TDD.md` records the `insights` shape, each derived metric with its window and floor, and why the schema version did not move
  - **P4.T2.2:** `README.md` names the Overview page among the parent features
  - **P4.T2.3:** The roadmap row becomes Done with dated evidence, and the metric table's "unknown" baselines are replaced by what the page now reports
- [x] **P4.T3: The gate** - covers: AC-8, NFR-5
  - **P4.T3.1:** Assert no new dependency, no new `fetch` under `src/`, and that the shell entry is still inside 200 kB
  - **P4.T3.2:** Refresh the suite counts and confirm all four validators are green

**Result:** verified - a journey seeds a week of history, holds the parental gate, opens Progress and reads all three statements on page one (17 journeys green in 3.2 minutes); the bridge publishes the strings the overlay drew rather than recomputing them; the human json carries the stored shape, the metric windows and the reason the schema version stayed at 1.
**Checkpoint:** 38db07a2
**Evidence:** conductor/tracks/20261108-local-insights/verification/phase-4.md

<!-- Review fixes are appended by conductor-review as:
## Phase R<n>: Review Fixes
- **Goal:** Resolve review findings <IDs>
- **Touches:** ...
- **Verification:** ...
- **Status:** pending
-->

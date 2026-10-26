# Plan — Property-Test Deflake

**Branch:** `chore/20261026-property-test-deflake`
**Base:** `master` @ `c5bb9eca`

Phase states: `pending` → `in_progress` → `verified` | `failed` | `blocked`.
Only the primary writes this file; phases are executed one at a time by a
phase subagent and independently verified by the primary before acceptance.

## Phase 1: Audit the sweeps and raise the budgets

- **Goal:** A measured audit of every sweep test in the 13 `VARIETY_SAMPLES =
  200` suites, with an explicit 120,000 ms per-test budget on every test
  whose worst observed wall time exceeds 20 s — the five proven victims at
  minimum — and the policy recorded in the TDD runner section.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, NFR-1, NFR-3, AC-2, AC-3, AC-4 (partial), AC-5
- **Touches:** `src/__tests__/game/addItUpLogic.test.ts`,
  `src/__tests__/game/countLogic.test.ts`,
  `src/__tests__/game/numberOrderLogic.test.ts`,
  `src/__tests__/game/takeAwayLogic.test.ts`,
  `src/__tests__/game/firstSoundsLogic.test.ts`,
  plus any additional suite the audit flags (recorded in evidence),
  `docs/TDD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Audit every sweep test's isolated wall time** — covers: FR-2, FR-3, NFR-3
  - [x] **P1.T1.1:** Run the 13 `VARIETY_SAMPLES = 200` suites individually with a wall-clock timer (`pnpm exec vitest run <file>` per suite, timed), recording each suite's slowest tests. The audit table maps every sweep test (tests whose body loops over shifts or samples) to its worst observed wall time; tests that hit the global 30 s timeout record `>= 30 s (timed out)`.
  - [x] **P1.T1.2:** Confirm the installed vitest 4.1.x per-test timeout syntax from `node_modules/vitest` typings (options object as the second `it()` argument) before writing any option.
- [x] **P1.T2: Apply the explicit budgets** — covers: FR-1, FR-2, FR-5, AC-2
  - [x] **P1.T2.1:** Add `{ timeout: 120000 }` to every sweep test whose worst observed wall time exceeds 20 s — the five proven victims at minimum (`addItUpLogic.test.ts`, `countLogic.test.ts`, `numberOrderLogic.test.ts`, `takeAwayLogic.test.ts`, `firstSoundsLogic.test.ts` shift-sweep tests). No test is renamed, removed, or weakened; sample counts stay 200; no other test carries a timeout unless the audit justified it.
- [x] **P1.T3: Record the policy in the TDD** — covers: FR-4, AC-4
  - [x] **P1.T3.1:** In `docs/TDD.md` §10.1, extend the runner paragraph with the exception policy: the named suites' sweep tests carry an explicit 120 s budget because their 200-sample × 3-shift loops exceed 30 s under host load (worst observed 66 s), while the global 30 s default is unchanged. Keep the vmThreads rationale intact.

**Result:** verified
**Checkpoint:** bf96b31c
**Evidence:** conductor/tracks/20261026-property-test-deflake/verification/phase-1.md

## Phase 2: Verify the deflake

- **Goal:** The full verification chain passes on the final tree, with the
  budgeted sweeps demonstrably inside their new budgets.
- **Depends on:** Phase 1
- **Covers:** NFR-2, AC-1, AC-4, AC-5
- **Touches:** `conductor/tracks/20261026-property-test-deflake/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P2.T1: Run the full verification chain** — covers: NFR-2, AC-1
  - [ ] **P2.T1.1:** Run the phase Verification chain exactly as written (all eight commands, exit 0). Record per-suite wall times of the budgeted suites from the run output as post-change evidence (they must fit inside the new budgets with headroom).
- [ ] **P2.T2: Record the evidence** — covers: AC-4, AC-5
  - [ ] **P2.T2.1:** Evidence records the chain results, the AC-2 grep proof (explicit timeouts present, `vite.config.ts` untouched), the audit table reference, and the unchanged counts (125 files / 2,729 tests).

<!--
Review fixes are appended by conductor-review as:
## Phase R1: Review Fixes
- **Goal:** Resolve review finding(s) <ID>.
- **Depends on:** <last verified phase>
- **Covers:** <finding IDs>
- **Touches:** <union of finding files>
- **Verification:** <same chain or narrower, exact>
- **Status:** pending
- [ ] **R1.T1: Resolve <finding ID>** - covers: <finding ID>
-->

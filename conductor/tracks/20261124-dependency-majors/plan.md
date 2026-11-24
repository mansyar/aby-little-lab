# Dependency Majors — November 2026 — Implementation Plan

> **Branch:** `chore/20261124-dependency-majors`
> **Base:** `master` @ `a914e2f2`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Survey and upgrade Biome and Vite

- **Goal:** The verbatim `pnpm outdated` survey and the frozen six-name candidate set are recorded, and Biome and Vite resolve to the latest versions available when this phase runs with the full gate green.
- **Depends on:** none
- **Covers:** FR-1, FR-3, FR-5, FR-8, NFR-1, NFR-2, NFR-3, NFR-4, AC-1, AC-2, AC-4, AC-9, AC-10
- **Touches:** `package.json`, `pnpm-lock.yaml`, `biome.json` (only if forced), `vite.config.ts` (only if forced), `src/__tests__/**` (only if forced), `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (count-only if forced), `conductor/tracks/20261124-dependency-majors/verification/phase-1.md`
- **Verification:** `pnpm outdated --format=list`; `pnpm install --frozen-lockfile`; `pnpm check`; `pnpm typecheck`; `pnpm test -- --run`; `pnpm test:coverage`; `pnpm build`; `node scripts/validate-bundle.js`; `node scripts/validate-module-size.js`; `node scripts/validate-textures.js`; `node scripts/validate-pwa.js`; `node scripts/validate-docs.js`; then the full `verify_phase` chain once on the final tree. Run commands separately; do not chain with `&&` inside a subagent shell.
- **Status:** verified

- [x] **P1.T1: Survey and freeze candidates** — covers: FR-1, AC-1
  - [x] **P1.T1.1:** Record verbatim `pnpm outdated --format=list` output and the six frozen candidate names in the phase evidence.
  - [x] **P1.T1.2:** Record the exact version installed for each candidate at its upgrade phase; treat releases published after that phase as out of scope (AC-2).
- [x] **P1.T2: Upgrade Biome and Vite** — covers: FR-1, FR-5, AC-1, AC-2
  - [x] **P1.T2.1:** Upgrade `@biomejs/biome` and `vite` to their latest available versions at execution time, committing `package.json` and `pnpm-lock.yaml` together.
  - [x] **P1.T2.2:** Refresh `biome.json` `$schema` only if the new Biome requires it; adapt `vite.config.ts` only if forced.
- [x] **P1.T3: Absorb forced changes** — covers: FR-8, AC-10
  - [x] **P1.T3.1:** Fix real new lint findings; record any out-of-scope justification instead of silently disabling rules.
  - [x] **P1.T3.2:** Refresh living suite counts only if they moved, and record every semantic change in the evidence.
- [x] **P1.T4: Verify Phase 1** — covers: FR-3, NFR-1, NFR-2, NFR-4, AC-4, AC-9
  - [x] **P1.T4.1:** Run every named check separately on the final tree; re-run the full `verify_phase` chain once and record its exit code.

**Result:** verified
**Checkpoint:** 4a8fa46d
**Evidence:** conductor/tracks/20261124-dependency-majors/verification/phase-1.md

## Phase 2: Upgrade the Vitest and coverage pair

- **Goal:** `vitest` and `@vitest/coverage-v8` resolve to one latest-available version and the entire suite passes above the fixed coverage gates with living docs still truthful.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-3, FR-5, FR-8, NFR-1, NFR-2, NFR-3, NFR-4, AC-1, AC-2, AC-3, AC-4, AC-9, AC-10
- **Touches:** `package.json`, `pnpm-lock.yaml`, `vite.config.ts` (only if forced), `src/__tests__/**` (only if forced), `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (count-only if forced), `conductor/tracks/20261124-dependency-majors/verification/phase-2.md`
- **Verification:** `pnpm outdated --format=list`; `pnpm install --frozen-lockfile`; `pnpm check`; `pnpm typecheck`; `pnpm test -- --run`; `pnpm test:coverage`; `pnpm build`; `node scripts/validate-bundle.js`; `node scripts/validate-module-size.js`; `node scripts/validate-textures.js`; `node scripts/validate-pwa.js`; `node scripts/validate-docs.js`; then the full `verify_phase` chain once on the final tree. Commands are separate invocations, never `&&`-chained by the subagent.
- **Status:** verified

- [x] **P2.T1: Upgrade the exact pair** — covers: FR-2, FR-5, AC-2, AC-3
  - [x] **P2.T1.1:** Upgrade `vitest` and `@vitest/coverage-v8` together to the same version and commit the manifest and lockfile together.
  - [x] **P2.T1.2:** Record the `pnpm outdated` check showing both candidates current at their installed version.
- [x] **P2.T2: Absorb Vitest behaviour changes** — covers: FR-8, AC-10
  - [x] **P2.T2.1:** Fix any cross-test mock assumptions or hoisting errors without adding a `clearMocks: false` escape hatch.
  - [x] **P2.T2.2:** Keep every assertion intact — no rename, deletion or weakening — and record each forced test fix with its reason.
- [x] **P2.T3: Hold gates and docs truth** — covers: NFR-1, NFR-2, AC-9
  - [x] **P2.T3.1:** Confirm coverage thresholds remain 95/88/85/90 in `conductor/workflow.md`; refresh living counts in the same phase only if the suite count moved.
- [x] **P2.T4: Verify Phase 2** — covers: FR-3, NFR-4, AC-4
  - [x] **P2.T4.1:** Run every named check separately and record the full `verify_phase` exit code.

**Result:** verified
**Checkpoint:** 4929a66f
**Evidence:** conductor/tracks/20261124-dependency-majors/verification/phase-2.md

## Phase 3: Upgrade the Playwright pair and handle conditional runtime drift

- **Goal:** `@playwright/test` and `playwright-core` share one exact-pinned version, any runtime dependency flagged outdated is upgraded with browser-journey proof, and every candidate is current at its phase check.
- **Depends on:** Phase 2
- **Covers:** FR-2, FR-3, FR-4, FR-5, FR-7, FR-8, NFR-1, NFR-2, NFR-3, NFR-4, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-10
- **Touches:** `package.json`, `pnpm-lock.yaml`, `playwright.config.ts` (only if forced), `e2e/**` (only if a runtime bump forces it), `src/__tests__/**` (only if forced), `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` (count-only if forced), `conductor/tracks/20261124-dependency-majors/verification/phase-3.md`
- **Verification:** `pnpm outdated --format=list`; `pnpm install --frozen-lockfile`; `pnpm check`; `pnpm typecheck`; `pnpm test -- --run`; `pnpm test:coverage`; `pnpm build`; `node scripts/validate-bundle.js`; `node scripts/validate-module-size.js`; `node scripts/validate-textures.js`; `node scripts/validate-pwa.js`; `node scripts/validate-docs.js`; `pnpm test:e2e` when FR-4 is triggered; then the full `verify_phase` chain once on the final tree. Commands are separate invocations.
- **Status:** pending

- [ ] **P3.T1: Upgrade the exact Playwright pair** — covers: FR-2, FR-5, AC-2, AC-3
  - [ ] **P3.T1.1:** Move `@playwright/test` and `playwright-core` to one exact version and commit the manifest and lockfile together.
  - [ ] **P3.T1.2:** Confirm the chromium binary matches the pinned version; if missing, install it or stop as blocked with the command output verbatim.
- [ ] **P3.T2: Conditional runtime bump** — covers: FR-4, FR-7, NFR-3, AC-6, AC-7
  - [ ] **P3.T2.1:** Record the `pnpm outdated` runtime result. If no runtime package is flagged, prove runtime dependencies are byte-identical to the base.
  - [ ] **P3.T2.2:** If one is flagged, upgrade it with evidence and run `pnpm test:e2e` plus the full gate; a failing journey blocks the phase.
- [ ] **P3.T3: Verify Phase 3** — covers: FR-3, NFR-1, NFR-4, AC-4, AC-5, AC-10
  - [ ] **P3.T3.1:** Run every named check separately, freeze-install the tree, and record the full `verify_phase` exit code and any deviations.

<!--
**Result:** <verified|blocked>
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-dependency-majors/verification/phase-3.md
-->

## Phase 4: Stack doc, docs truth and integrated gate

- **Goal:** The stack doc states the installed versions and the reusable monthly procedure, every doc truth guard is green, and the final diff audit proves the declared scope.
- **Depends on:** Phase 3
- **Covers:** FR-3, FR-5, FR-6, FR-7, FR-8, NFR-1, NFR-2, NFR-3, NFR-4, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- **Touches:** `conductor/tech-stack.md` (primary-applied edit from the subagent's recorded text), `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/tracks/20261124-dependency-majors/verification/phase-4.md`, `conductor/tracks/20261124-dependency-majors/verification/integrated.md`
- **Verification:** `node scripts/validate-docs.js`; `pnpm check`; `pnpm typecheck`; `pnpm test -- --run`; `pnpm test:coverage`; `pnpm build`; `node scripts/validate-bundle.js`; `node scripts/validate-module-size.js`; `node scripts/validate-textures.js`; `node scripts/validate-pwa.js`; `pnpm install --frozen-lockfile`; then the full `verify_phase` chain once on the final tree. Commands are separate invocations.
- **Status:** pending

- [ ] **P4.T1: Record the monthly procedure in the stack doc** — covers: FR-6, AC-8
  - [ ] **P4.T1.1:** Update `conductor/tech-stack.md` version table to the installed versions.
  - [ ] **P4.T1.2:** Add a short "Monthly dependency maintenance" section: survey → pair-aware upgrade → full gate → docs truth → no-runtime-change default. The phase subagent writes the exact text into its evidence; the primary applies the file edit before acceptance.
- [ ] **P4.T2: Docs truth and final diff audit** — covers: FR-7, FR-8, NFR-1, NFR-3, AC-3, AC-6, AC-7, AC-9, AC-10
  - [ ] **P4.T2.1:** Refresh living suite counts only if they moved; keep all links and anchors resolving at 5/5.
  - [ ] **P4.T2.2:** Audit `git diff <base>..HEAD` for scope: six candidates plus peers, no gate weakening, no production source edit unless FR-4 fired.
- [ ] **P4.T3: Full integrated gate** — covers: FR-3, FR-5, NFR-2, NFR-4, AC-4, AC-5, AC-9
  - [ ] **P4.T3.1:** Run every named check separately on the final tree; write `verification/integrated.md` with the full `verify_phase` exit code, coverage numbers and verdict.
  - [ ] **P4.T3.2:** Confirm `pnpm install --frozen-lockfile` succeeds and record the final `pnpm outdated` state with the post-phase exception for later releases.

<!--
**Result:** <verified|blocked>
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261124-dependency-majors/verification/phase-4.md
-->

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends:** Phase 4
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->

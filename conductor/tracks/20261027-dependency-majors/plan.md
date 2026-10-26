# Plan — Dependency Majors

- **Branch:** `chore/20261027-dependency-majors`
- **Base:** `master` @ `72bf861c`

Phase states: `pending` → `in_progress` → `verified` | `failed` | `blocked`. Only the primary writes this file.

<!-- Review fixes are appended by conductor-review as:
## Phase R1: Review Fixes
- **Goal:** Resolve review finding(s) <ID>.
- **Depends on:** <last verified phase>
- **Covers:** <finding IDs>
- **Touches:** <union of finding files>
- **Verification:** <same chain or narrower, exact>
- **Status:** pending
- [ ] **R1.T1: Resolve <finding ID>** - covers: <finding ID>
-->

## Phase 1: Minors — biome 2.6.3 and vite 8.3.5

- **Goal:** The two minor upgrades land with the gate green, the biome `$schema` diagnostic retired, and the CI Node preflight settled.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-6, FR-8, NFR-4
- **Touches:** `package.json`, `pnpm-lock.yaml`, `biome.json`, `.github/workflows/ci.yml` (only if Node < 22.12), `vite.config.ts` (only if the vite minor requires it)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified
- [x] **P1.T1: Upgrade the minors** — covers: FR-1, FR-2
  - [x] **P1.T1.1:** `pnpm up @biomejs/biome@^2.6.3 vite@^8.3.5` (dev); commit package.json + lockfile together; record `pnpm outdated` after.
  - [x] **P1.T1.2:** Refresh `biome.json` `$schema` to the installed version; confirm the pre-existing `$schema` info diagnostic is gone.
  - [x] **P1.T1.3:** Read `.github/workflows/ci.yml` Node version; if below 22.12.0, bump it (record); if at/above, record the verification with no change.
- [x] **P1.T2: Absorb new lint findings** — covers: FR-2, FR-8
  - [x] **P1.T2.1:** Run `pnpm check`; fix every new finding the 2.6.3 rules surface; any config-disable carries a recorded justification (deviation).
- [x] **P1.T3: Verify** — covers: FR-1, NFR-4
  - [x] **P1.T3.1:** Run the full verification chain; record `pnpm install --frozen-lockfile` success (CI parity).


**Result:** verified

**Checkpoint:** bd8a6c54

**Evidence:** conductor/tracks/20261027-dependency-majors/verification/phase-1.md
## Phase 2: Vitest 5.0.5

- **Goal:** Vitest 5 + coverage-v8 5.0.5 land with the suite green under the embraced `clearMocks: true` default and coverage above the fixed gates.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-3, FR-8, NFR-2
- **Touches:** `package.json`, `pnpm-lock.yaml`, `vite.config.ts` (test config only), `src/__tests__/**/*.test.ts` (only suites the majors force to change), `src/__tests__/helpers/**` (only if forced)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified
- [x] **P2.T1: Upgrade the exact pair** — covers: FR-1
  - [x] **P2.T1.1:** `pnpm up vitest@^5.0.5 @vitest/coverage-v8@^5.0.5` (versions must match exactly); commit package.json + lockfile; record `pnpm outdated` after.
- [x] **P2.T2: Embrace clearMocks** — covers: FR-3, FR-8
  - [x] **P2.T2.1:** Run the full suite; fix every failure caused by cross-test mock call history inside the affected tests (make each test's expectations self-contained); no `clearMocks: false` anywhere in `vite.config.ts`; record every fixed suite with a before/after note.
- [x] **P2.T3: Absorb remaining v5 changes** — covers: FR-3, FR-8
  - [x] **P2.T3.1:** Address other v5 breaking changes that surface (hoisted-mock top-level rule, class-mock prototype retention, assertion changes) in test files only; record each as a deviation with reason.
- [x] **P2.T4: Coverage gates** — covers: NFR-2
  - [x] **P2.T4.1:** Run coverage; if vitest 5's include/exclude precision shifted measured numbers, adapt config/tests to stay above the fixed gates (95/88/85/90); record before/after numbers for the Phase 5 snapshot.


**Result:** verified

**Checkpoint:** c0c86ee2

**Evidence:** conductor/tracks/20261027-dependency-majors/verification/phase-2.md

## Phase 3: happy-dom 21

- **Goal:** happy-dom 21 lands with the DOM-dependent suites green and the CSS/IFrame default-off change explicitly audited.
- **Depends on:** Phase 2
- **Covers:** FR-1, FR-4, FR-8
- **Touches:** `package.json`, `pnpm-lock.yaml`, `src/__tests__/**/*.test.ts` (only affected suites)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified
- [x] **P3.T1: Upgrade** — covers: FR-1
  - [x] **P3.T1.1:** `pnpm up happy-dom@^21.0.4` (dev); commit package.json + lockfile; record `pnpm outdated` after.
- [x] **P3.T2: Audit CSS/IFrame default-off** — covers: FR-4, FR-8
  - [x] **P3.T2.1:** Run the full suite; for any failure caused by the default-off CSS/IFrame loading, re-enable per suite with a recorded justification (test-hygiene findings get fixed, not papered over).
- [x] **P3.T3: Verify** — covers: FR-1
  - [x] **P3.T3.1:** Run the full verification chain.


**Result:** verified

**Checkpoint:** ede22b71

**Evidence:** conductor/tracks/20261027-dependency-majors/verification/phase-3.md

## Phase 4: vite-plugin-pwa 2.0.0

- **Goal:** The PWA plugin major lands with workbox peers satisfied and PWA/bundle behavior byte-equivalent under the validators.
- **Depends on:** Phase 3
- **Covers:** FR-1, FR-5, FR-8, NFR-3, NFR-4
- **Touches:** `package.json`, `pnpm-lock.yaml`, `vite.config.ts` (PWA options only)
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress
- [ ] **P4.T1: Upgrade + peers** — covers: FR-1, NFR-4
  - [ ] **P4.T1.1:** `pnpm up vite-plugin-pwa@^2.0.0`; verify `workbox-window` satisfies `^7.4.1` (bump if not); commit package.json + lockfile; record `pnpm outdated` after.
- [ ] **P4.T2: Adapt config** — covers: FR-5, FR-8
  - [ ] **P4.T2.1:** Adapt `vite.config.ts` PWA options if the 2.0 surface moved; record every semantic change as a deviation.
- [ ] **P4.T3: PWA/bundle equivalence** — covers: FR-5, NFR-3
  - [ ] **P4.T3.1:** Run build + validate-bundle + validate-pwa; confirm 16/0, 42/42 precached, ~54 manifest entries, shell ≤ 200 kB.
- [ ] **P4.T4: Verify** — covers: FR-1
  - [ ] **P4.T4.1:** Run the full verification chain.

## Phase 5: Docs truth pass

- **Goal:** The living docs state the new dependency truth and the clearMocks policy decision; every validator green.
- **Depends on:** Phase 4
- **Covers:** FR-7, FR-8, AC-6, NFR-1
- **Touches:** `docs/TDD.md`, `docs/perf-baseline.md` (coverage snapshot only if shifted), `conductor/tech-stack.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending
- [ ] **P5.T1: TDD runner section** — covers: FR-7
  - [ ] **P5.T1.1:** Update `docs/TDD.md` §10.1: new runner versions, the clearMocks policy decision (embraced default, no escape hatch), and any happy-dom note.
- [ ] **P5.T2: Tech-stack version table** — covers: FR-7
  - [ ] **P5.T2.1:** Update the `conductor/tech-stack.md` version table to the five new versions.
- [ ] **P5.T3: Coverage snapshot** — covers: FR-7, NFR-2
  - [ ] **P5.T3.1:** If the measured coverage shifted under vitest 5, refresh the dated snapshot in TDD (and perf-baseline if listed); if unchanged, record that.
- [ ] **P5.T4: Validate** — covers: AC-6
  - [ ] **P5.T4.1:** Run the full verification chain; validate-docs must report 6/6.

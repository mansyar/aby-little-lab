# Browser Compatibility Matrix — Implementation Plan

## Phase 1: Project topology and reusable smoke

- **Goal:** Playwright exposes Chromium plus WebKit, Firefox, and mobile Chromium/touch, with only the core smoke selected outside Chromium.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-7, FR-9, FR-10, NFR-4, NFR-6, AC-1, AC-2, AC-3, AC-4, AC-9, AC-11
- **Touches:** `playwright.config.ts`, `package.json`, `e2e/**`, `src/audio/AudioManager.ts`, `src/__tests__/audio/AudioManager.test.ts`, `src/game/art/index.ts`, `src/game/art/registry.ts`, `src/game/hub/hubPrewarm.ts`, `src/scenes/HubScene.ts`, `src/__tests__/game/art/preloadArtGroups.test.ts`, `src/__tests__/game/hub/hubPrewarm.test.ts`, `src/__tests__/scenes/hubScene.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `pnpm exec playwright test --list`; `pnpm test:e2e`; `pnpm exec playwright test --project=webkit`; `pnpm exec playwright test --project=firefox`; `pnpm exec playwright test --project=mobile-chromium`
- **Status:** verified

### Tasks

- [x] **P1.T1: Define cross-engine projects** — covers: FR-1, AC-2
- [x] **P1.T2: Isolate the core smoke and persistence check** — covers: FR-2, FR-3, AC-3, AC-4
- [x] **P1.T3: Add reproducible local commands** — covers: FR-7, AC-9
- [x] **P1.T4: Keep fixtures portable across engines** — covers: NFR-4
- [x] **P1.T5: Repair smoke-proven engine portability defects** — covers: FR-9, NFR-6, AC-11
  - Guard absent WebKit audio support; keep long-hold tests state-based with stall and ceiling guards rather than a premature 3 s wall-clock deadline; coordinate Hub art prewarm with game-scene texture loading so Firefox cannot queue a duplicate key.
- [x] **P1.T6: Refresh living test-count documentation** — covers: FR-10

**Result:** verified

**Checkpoint:** `409981a2`

Evidence: `verification/phase-1.md` — exact gate, project roster, Chromium 26/26, WebKit 8/8, Firefox 8/8, and mobile Chromium 8/8 all passed with local retries zero.

## Phase 2: CI matrix and blocking rollup

- **Goal:** Every code PR runs the three-engine matrix, while `Browser Journeys` remains the single required rollup.
- **Depends on:** Phase 1
- **Covers:** FR-4, FR-5, FR-6, FR-8, FR-9, NFR-2, NFR-3, NFR-5, AC-5, AC-6, AC-8
- **Touches:** `.github/workflows/ci.yml`, `scripts/**`, `e2e/**`, `src/__tests__/guard/toolchain.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `pnpm exec playwright test --list --project=webkit`; `pnpm exec playwright test --list --project=firefox`; `pnpm exec playwright test --list --project=mobile-chromium`; subsequent track-PR CI proves the workflow.
- **Status:** verified

### Tasks

- [x] **P2.T1: Add three parallel engine jobs** — covers: FR-4, NFR-2, AC-5
- [x] **P2.T2: Record versions, durations, and failure artifacts** — covers: FR-6, NFR-5, AC-8
- [x] **P2.T3: Extend the Browser Journeys rollup** — covers: FR-5, AC-6
- [x] **P2.T4: Preserve documentation-only required checks** — covers: FR-8, AC-5
- [x] **P2.T5: Enforce strict matrix failure policy** — covers: FR-9, NFR-3, AC-6, AC-8
- [x] **P2.T6: Update the CI topology guard for the engine matrix** — covers: FR-5, FR-8, AC-5, AC-6, AC-8

**Result:** verified locally; track-PR CI remains the authoritative runtime proof.

**Checkpoint:** `d29a0ca7`

Evidence: `verification/phase-2.md` — exact gate, three project listings, actionlint/YAML validation, CI-policy WebKit 8/8 first-attempt, and strict-evidence negative checks passed.

## Phase 3: Cross-engine execution and compatibility fixes

- **Goal:** All engines pass the core smoke first-attempt, or a proven compatibility defect is minimally repaired.
- **Depends on:** Phase 2
- **Covers:** FR-2, FR-6, FR-9, NFR-3, NFR-4, NFR-5, NFR-6, AC-2, AC-3, AC-7, AC-8, AC-11
- **Touches:** `e2e/**`, `src/**` only if a failing smoke proves a defect, `conductor/archive/20261125-browser-matrix/verification/**`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `pnpm test:e2e`; `pnpm exec playwright test --project=webkit`; `pnpm exec playwright test --project=firefox`; `pnpm exec playwright test --project=mobile-chromium`
- **Status:** verified

### Tasks

- [x] **P3.T1: Establish first-attempt engine results** — covers: FR-6, NFR-3, AC-7
- [x] **P3.T2: Repair proven compatibility defects minimally** — covers: FR-9, NFR-4, NFR-6, AC-11
- [x] **P3.T3: Re-run to a clean matrix and retain earlier evidence** — covers: AC-2, AC-3, AC-7, AC-8

**Result:** all four projects passed first-attempt with zero local retries after the CI changes; no new compatibility repair was needed.

**Checkpoint:** `96801bf8`

Evidence: `verification/phase-3.md` — exact gate and first-attempt Chromium 26/26, WebKit 8/8, Firefox 8/8 and mobile Chromium 8/8.

## Phase 4: Documentation and device-evidence policy

- **Goal:** Contributors can reproduce the matrix and readers cannot mistake emulation for hardware validation.
- **Depends on:** Phase 3
- **Covers:** FR-7, FR-8, FR-10, NFR-5, AC-9, AC-10, AC-11
- **Touches:** `README.md`, `docs/TDD.md`, `docs/device-testing-checklist.md`, `conductor/tech-stack.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `node scripts/validate-docs.js`
- **Status:** verified

### Tasks

- [x] **P4.T1: Document project roles and local commands** — covers: FR-7, AC-9
- [x] **P4.T2: Correct stale worker prose and document CI behavior** — covers: FR-8, FR-10
- [x] **P4.T3: Separate emulation from physical-device checks** — covers: FR-10, NFR-5, AC-10
- [x] **P4.T4: Record the unchanged dependency and runtime scope** — covers: AC-11

**Result:** verified

**Checkpoint:** `14fea5f6`

Evidence: `verification/phase-4.md` — documentation validation and the exact configured gate passed; engine emulation and the pending manual physical-device gate are explicitly separated.

## Phase 5: Integrated verification and handoff

- **Goal:** Leave one auditable package of local and CI-ready evidence for strict review and the release PR.
- **Depends on:** Phases 1–4
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-7, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11
- **Touches:** `conductor/archive/20261125-browser-matrix/verification/**`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `git diff --check`; `pnpm test:e2e`; `pnpm exec playwright test --project=webkit`; `pnpm exec playwright test --project=firefox`; `pnpm exec playwright test --project=mobile-chromium`
- **Status:** verified
- **Result:** Exact gate passed (158 files / 3,404 tests; coverage 97.08 / 90.89 / 96.35 / 98.23). Roster was 50 tests / 20 files. Chromium 26/26, WebKit 8/8, Firefox 8/8 and mobile Chromium 8/8 all passed locally with zero retries. PR CI and physical-device checks remain pending.
- **Checkpoint:** `76790f9f`

### Tasks

- [x] **P5.T1: Run the final Chromium suite and three-engine smoke** — covers: AC-1, AC-2, AC-3, AC-7
- [x] **P5.T2: Record engine profiles, versions, durations, and retries** — covers: FR-6, NFR-5, AC-7
- [x] **P5.T3: Inspect the final scope and project selection** — covers: FR-3, FR-9, NFR-1, NFR-7, AC-4, AC-11
- [x] **P5.T4: Write integrated evidence and identify the PR CI gate** — covers: AC-5, AC-6, AC-8, AC-9, AC-10

## Phase R1: Final review mapping

- **Goal:** Close strict-review finding F1 and revalidate the final tree.
- **Depends on:** Phase 5
- **Covers:** FR-10, AC-10
- **Touches:** `docs/TDD.md`, `conductor/archive/20261125-browser-matrix/verification/phase-R1.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`; `git -c core.whitespace=cr-at-eol diff --check`
- **Status:** verified
- **Result:** F1 closed in `docs/TDD.md`; exact gate passed with 158 files / 3,404 tests, 491 modules and all artifact guards green; CRLF-aware whitespace check passed.
- **Checkpoint:** `d18d21c4`

### Tasks

- [x] **R1.T1: Correct the re-dated TDD coverage claim to the integrated values** — covers: FR-10, AC-10
- [x] **R1.T2: Run the exact gate, record evidence and return to strict review** — covers: FR-10, AC-10

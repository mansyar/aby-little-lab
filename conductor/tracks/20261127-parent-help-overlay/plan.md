# Add a parent Help overlay explaining controls, data, backup, and play-time — Implementation Plan

> **Branch:** `feat/20261127-parent-help-overlay`
> **Base:** `master` @ `f96979fca6fc0a08335cb83bd91fb8d3085875a3`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Author the Help content and overlay

- **Goal:** A standalone Help overlay renders eight truthful topic cards with deterministic navigation and no side effects.
- **Depends on:** none
- **Covers:** FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, NFR-1, NFR-2, NFR-3, NFR-6, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11
- **Touches:** `src/components/settings/helpContent.ts`, `src/components/settings/HelpOverlay.ts`, `src/__tests__/components/settings/helpContent.test.ts`, `src/__tests__/components/settings/HelpOverlay.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/tracks/20261127-parent-help-overlay/verification/phase-1.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** in_progress

- [ ] **P1.T1: Define the eight-topic content contract** — covers: FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11
  - [ ] **P1.T1.1:** Create stable ordered IDs: `parental-lock`, `profiles-play-time`, `progress-adaptive`, `privacy-data`, `backup-restore`, `diagnostics`, `install-offline`, `updates`.
  - [ ] **P1.T1.2:** Author concise `title`, `intro`, and up-to-four-point copy matching the approved behavior.
- [ ] **P1.T2: Prove content truth and structure** — covers: FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, NFR-3
  - [ ] **P1.T2.1:** Test unique IDs, approved order, non-empty copy, and the four-point limit.
  - [ ] **P1.T2.2:** Pin the key lock, play-time, adaptive, privacy, backup, diagnostics, offline, and update claims.
- [ ] **P1.T3: Implement the standalone overlay** — covers: FR-2, FR-3, FR-12, FR-13
  - [ ] **P1.T3.1:** Build the 2×4 topic menu and detail card using existing Settings primitives.
  - [ ] **P1.T3.2:** Implement shared-bucket open/close, backdrop/✕, Back to topics, Previous, and Next.
  - [ ] **P1.T3.3:** Keep Help read-only and idempotent across repeated open/close cycles.
- [ ] **P1.T4: Test navigation and lifecycle** — covers: FR-2, FR-3, AC-2, AC-3, AC-9
  - [ ] **P1.T4.1:** Cover every topic selection, previous/next traversal, first/last boundaries, and return to topics.
  - [ ] **P1.T4.2:** Verify repeated close/reopen leaves no duplicate objects or listeners.
- [ ] **P1.T5: Prove layout and safety** — covers: FR-12, FR-13, NFR-2, NFR-6, AC-10, AC-11
  - [ ] **P1.T5.1:** Assert 96×96 primary hit areas, word-wrap width, reduced-motion-safe feedback, and bounded content layout.
  - [ ] **P1.T5.2:** Verify Help interactions perform no storage, settings, download, audio, network, or external-navigation operation.
- [ ] **P1.T6: Run the gate and record evidence** — covers: NFR-3, NFR-4, NFR-5, AC-12
  - [ ] **P1.T6.1:** Run the exact configured verification chain.
  - [ ] **P1.T6.2:** Record scope, commands, AC coverage, deviations, and the phase checkpoint.
  - [ ] **P1.T6.3:** Repair gate-driven living suite counts and coverage in README, TDD, and perf-baseline from primary-measured output, preserving dated historical evidence.

## Phase 2: Integrate Help into Settings and prove the browser journey

- **Goal:** Parents can open Help from either Settings page, and a real browser journey traverses all eight topics without changing existing controls or data.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-13, NFR-2, NFR-4, NFR-5, AC-1, AC-10, AC-11, AC-12
- **Touches:** `src/components/settings/HelpButton.ts`, `src/components/SettingsPanel.ts`, `src/game/e2eBridgeTypes.ts`, `src/game/e2eBridge.ts`, `src/game/hub/hubE2E.ts`, `e2e/fixtures/game.ts`, `e2e/journeys/help.spec.ts`, `src/__tests__/components/SettingsPanel.test.ts`, `src/__tests__/game/e2eBridge.test.ts`, `conductor/tracks/20261127-parent-help-overlay/verification/phase-2.md`
- **Verification:**
  - `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
  - `pnpm exec playwright test e2e/journeys/help.spec.ts --project=chromium --project=webkit --project=firefox --project=mobile-chromium`
  - Primary visual inspection at 1024×768 and 844×390; media stays uncommitted under `.conductor/media/20261127-parent-help-overlay/`.
- **Status:** pending

- [ ] **P2.T1: Add the Settings header entry point** — covers: FR-1, NFR-4, AC-1
  - [ ] **P2.T1.1:** Implement a 96×96 Help button in a focused component.
  - [ ] **P2.T1.2:** Open Help from either Settings page and return to the same page on close.
  - [ ] **P2.T1.3:** Keep all existing row coordinates and Backup controls unchanged.
  - [ ] **P2.T1.4:** Keep `SettingsPanel.ts` below the module-size warning threshold by inlining its existing trivial Progress/Profiles delegate methods.
- [ ] **P2.T2: Extend the E2E settings contract** — covers: NFR-5
  - [ ] **P2.T2.1:** Add Help button point and overlay state: screen, topic ID/index/count, title/lines, and active navigation controls.
  - [ ] **P2.T2.2:** Update bridge exports, Hub publication, and fixture defaults without affecting unrelated state.
- [ ] **P2.T3: Test integration and regressions** — covers: FR-1, FR-13, NFR-4, AC-1, AC-2, AC-11
  - [ ] **P2.T3.1:** Cover parental gating, both underlying pages, close behavior, repeated cycles, and unchanged row positions.
  - [ ] **P2.T3.2:** Verify Help is read-only and the E2E state defaults remain stable.
- [ ] **P2.T4: Add and run the browser journey** — covers: FR-1, FR-3, FR-13, NFR-5, AC-1, AC-3, AC-9, AC-11, AC-12
  - [ ] **P2.T4.1:** Open Settings through the real hold gesture, open Help, visit all eight topics, exercise boundaries, close, and verify the save is unchanged.
  - [ ] **P2.T4.2:** Run Chromium, WebKit, Firefox, and mobile Chromium with zero local retries.
- [ ] **P2.T5: Run gates and record evidence** — covers: NFR-4, NFR-5, AC-10, AC-12
  - [ ] **P2.T5.1:** Run the exact full gate and four-project Help journey.
  - [ ] **P2.T5.2:** Record measured counts, scope, browser results, deviations, and checkpoint evidence.

## Phase 3: Synchronize product and engineering truth

- **Goal:** Living documentation describes the shipped Help surface while preserving historical release records.
- **Depends on:** Phase 2
- **Covers:** FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, NFR-5, AC-13
- **Touches:** `docs/PRD.md`, `docs/TDD.md`, `README.md`, `docs/changelog.md`, `docs/device-testing-checklist.md`, `conductor/tracks/20261127-parent-help-overlay/verification/phase-3.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P3.T1: Document the parent-facing contract** — covers: FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, AC-13
  - [ ] **P3.T1.1:** Add PRD §4.12 **Parent Help** plus its Contents entry.
  - [ ] **P3.T1.2:** Describe the eight topics, read-only boundary, parent gate, navigation, and offline behavior.
- [ ] **P3.T2: Document the technical design** — covers: NFR-5, AC-13
  - [ ] **P3.T2.1:** Add Help content/overlay/button modules to the TDD Settings group.
  - [ ] **P3.T2.2:** Document lifecycle, E2E state, navigation boundaries, content separation, and regression protections.
- [ ] **P3.T3: Update user-facing documentation** — covers: AC-13
  - [ ] **P3.T3.1:** Add the dated changelog entry.
  - [ ] **P3.T3.2:** Update README parent-feature documentation without claiming hardware validation.
  - [ ] **P3.T3.3:** Add focused manual Help checks to the device checklist.
- [ ] **P3.T4: Preserve historical truth** — covers: AC-13
  - [ ] **P3.T4.1:** Leave prior release notes and archived evidence unchanged.
  - [ ] **P3.T4.2:** Keep retention and physical-device gaps explicit.
- [ ] **P3.T5: Run the gate and record evidence** — covers: NFR-5, AC-12, AC-13
  - [ ] **P3.T5.1:** Refresh living test/build figures only from measured output.
  - [ ] **P3.T5.2:** Run the exact configured verification chain and record scope, AC coverage, and deviations.

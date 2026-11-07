# Storage Resilience — Implementation Plan

> **Branch:** `fix/20261107-storage-resilience`
> **Base:** `master` @ `26764e9f5563b21cc91e8ec2627c1b06d3a616fb`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: The save layer made total

- **Goal:** every read and write in `src/utils/storage.ts` is non-throwing, the session survives a device that cannot persist, and the bytes written on a working store are unchanged.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-6, AC-1, AC-2, AC-3, AC-4, AC-6, AC-8
- **Touches:** `src/utils/storage.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/scenes/gameSceneBase.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P1.T1: Write the failing tests first** — covers: AC-8, FR-1, FR-2, FR-3, FR-4
  - [ ] **P1.T1.1: Add a throwing-storage harness** to `storage.test.ts` — helpers that make `setItem` and/or `getItem` throw a chosen `DOMException` and restore the original in `afterEach`, with no other test affected
  - [ ] **P1.T1.2: Cover the write paths** — with `setItem` throwing, assert no throw and an applied in-memory change for `earnSticker`, `updateSettings`, `resetProgress`, `addProfile`, `deleteProfile`, `switchProfile`, `setPlayTimeLimit`, `recordPlayTime`, `recordGamePlay`, `recordGameResult`, `recordGameTaps`
  - [ ] **P1.T1.3: Cover the read paths** — with `getItem` throwing, assert defaults and no throw from `getProfiles`, `getActiveProfile`, `getSettings`, `getPlayTime`, `getProgress`, `hasSticker`, `getAdaptiveBandShift`
  - [ ] **P1.T1.4: Pin `completeGame`** in `gameSceneBase.test.ts` — with `setItem` throwing, the win celebration and the auto-return `delayedCall` are still scheduled (the defect in one assertion)
  - [ ] **P1.T1.5: Record the red run** — the new tests against the unmodified `storage.ts`, verbatim output in the phase evidence, so the teeth are proven rather than asserted
- [ ] **P1.T2: Guard the write path** — covers: FR-1, FR-2, FR-4
  - [ ] **P1.T2.1: Make `saveV2` total** — attempt the write inside a `try`; on failure keep the memo and the in-memory state so the mutation still applies, and mark degraded
  - [ ] **P1.T2.2: Clear the flag on success** — the memo is only trusted for the value actually written, so a later successful write re-persists the whole in-memory state and clears the flag
- [ ] **P1.T3: Guard the read paths** — covers: FR-3, FR-4
  - [ ] **P1.T3.1: Make `readV1` and `readV2Raw` total** — `getItem` inside the guard, `null` on failure, degraded marked
  - [ ] **P1.T3.2: Guard a missing `localStorage`** — a `Storage` accessor that returns `null` when the global is absent, so no path can raise a `ReferenceError`
  - [ ] **P1.T3.3: Expose `isPersistenceDegraded()`** — a read-only accessor, no setter, no subscription
- [ ] **P1.T4: Keep the deliberate paths deliberate** — covers: FR-4, FR-6
  - [ ] **P1.T4.1: Exclude the unknown-version guard** — the memory-only write in `mutate` must not mark degraded, and a declined mutator must not either
  - [ ] **P1.T4.2: Prove the happy path is untouched** — the schema stamp, the cache key, the v1 migration, the corrupt-JSON fallback and the wider raw string a success writes

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261107-storage-resilience/verification/phase-1.md
-->

## Phase 2: The parent is told, and the browser proves it

- **Goal:** the settings panel states the fact while persistence is degraded and nothing otherwise, and a browser journey shows a child finishing a game on a device that cannot save.
- **Depends on:** Phase 1
- **Covers:** FR-5, FR-7, NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, AC-5, AC-7
- **Touches:** `src/components/SettingsPanel.ts`, `src/__tests__/components/SettingsPanel.test.ts`, `e2e/journeys/storage.spec.ts`, `e2e/fixtures/`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/product.md`
- **Verification:** `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P2.T1: The notice** — covers: FR-5, NFR-4
  - [ ] **P2.T1.1: Render one line while degraded** — small text in the existing panel header area, read at open time from `isPersistenceDegraded()`, styled from the panel's existing text conventions
  - [ ] **P2.T1.2: Move nothing** — the title, the version footer and the eight rows keep their current positions; no new interactive element; nothing appears when storage works
  - [ ] **P2.T1.3: Unit-test both directions** — the label is present while degraded and absent otherwise, found the way the existing panel tests find text
- [ ] **P2.T2: The journey** — covers: FR-7, AC-7, NFR-3, NFR-5
  - [ ] **P2.T2.1: Make storage throw at page load** — an `addInitScript` that patches only `Storage.prototype.setItem` (and `getItem` in a second case), leaving Playwright's own machinery and the service worker alone
  - [ ] **P2.T2.2: Win a game and come home** — launch a short game, complete three rounds, assert the hub returns and the sticker count rose in memory
  - [ ] **P2.T2.3: Survive a reload** — reload with storage still throwing, assert the hub boots and the app collected no page error
  - [ ] **P2.T2.4: Prove the notice is reachable** — open Settings in the degrading context and read the published state, so the parent-facing half is not unit-only
- [ ] **P2.T3: Record the shape** — covers: NFR-1, NFR-2
  - [ ] **P2.T3.1: Document the layer** — `docs/TDD.md` describes the guarded save layer and the degraded state; `README.md` Known Issues drops the storage item; `product.md` §10.2 marks the roadmap row done
  - [ ] **P2.T3.2: Record the cost** — shell size against the 200 kB gate and the suite runtime against the 5 minute budget

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 2
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->

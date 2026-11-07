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
- **Status:** verified

- [x] **P1.T1: Write the failing tests first** — covers: AC-8, FR-1, FR-2, FR-3, FR-4
  - [x] **P1.T1.1: Add a throwing-storage harness** to `storage.test.ts` — helpers that make `setItem` and/or `getItem` throw a chosen `DOMException` and restore the original in `afterEach`, with no other test affected
  - [x] **P1.T1.2: Cover the write paths** — with `setItem` throwing, assert no throw and an applied in-memory change for `earnSticker`, `updateSettings`, `resetProgress`, `addProfile`, `deleteProfile`, `switchProfile`, `setPlayTimeLimit`, `recordPlayTime`, `recordGamePlay`, `recordGameResult`, `recordGameTaps`
  - [x] **P1.T1.3: Cover the read paths** — with `getItem` throwing, assert defaults and no throw from `getProfiles`, `getActiveProfile`, `getSettings`, `getPlayTime`, `getProgress`, `hasSticker`, `getAdaptiveBandShift`
  - [x] **P1.T1.4: Pin `completeGame`** in `gameSceneBase.test.ts` — with `setItem` throwing, the win celebration and the auto-return `delayedCall` are still scheduled (the defect in one assertion)
  - [x] **P1.T1.5: Record the red run** — the new tests against the unmodified `storage.ts`, verbatim output in the phase evidence, so the teeth are proven rather than asserted
- [x] **P1.T2: Guard the write path** — covers: FR-1, FR-2, FR-4
  - [x] **P1.T2.1: Make `saveV2` total** — attempt the write inside a `try`; on failure keep the memo and the in-memory state so the mutation still applies, and mark degraded
  - [x] **P1.T2.2: Clear the flag on success** — the memo is only trusted for the value actually written, so a later successful write re-persists the whole in-memory state and clears the flag
- [x] **P1.T3: Guard the read paths** — covers: FR-3, FR-4
  - [x] **P1.T3.1: Make `readV1` and `readV2Raw` total** — `getItem` inside the guard, `null` on failure, degraded marked
  - [x] **P1.T3.2: Guard a missing `localStorage`** — a `Storage` accessor that returns `null` when the global is absent, so no path can raise a `ReferenceError`
  - [x] **P1.T3.3: Expose `isPersistenceDegraded()`** — a read-only accessor, no setter, no subscription
- [x] **P1.T4: Keep the deliberate paths deliberate** — covers: FR-4, FR-6
  - [x] **P1.T4.1: Exclude the unknown-version guard** — the memory-only write in `mutate` must not mark degraded, and a declined mutator must not either
  - [x] **P1.T4.2: Prove the happy path is untouched** — the schema stamp, the cache key, the v1 migration, the corrupt-JSON fallback and the wider raw string a success writes

**Result:** verified
**Checkpoint:** 09ea4440
**Evidence:** conductor/tracks/20261107-storage-resilience/verification/phase-1.md

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
- **Status:** verified

- [x] **P2.T1: The notice** — covers: FR-5, NFR-4
  - [x] **P2.T1.1: Render one line while degraded** — small text in the existing panel header area, read at open time from `isPersistenceDegraded()`, styled from the panel's existing text conventions
  - [x] **P2.T1.2: Move nothing** — the title, the version footer and the eight rows keep their current positions; no new interactive element; nothing appears when storage works
  - [x] **P2.T1.3: Unit-test both directions** — the label is present while degraded and absent otherwise, found the way the existing panel tests find text
- [x] **P2.T2: The journey** — covers: FR-7, AC-7, NFR-3, NFR-5
  - [x] **P2.T2.1: Make storage throw at page load** — an `addInitScript` that patches only `Storage.prototype.setItem` (and `getItem` in a second case), leaving Playwright's own machinery and the service worker alone
  - [x] **P2.T2.2: Win a game and come home** — launch a short game, complete three rounds, assert the hub returns and the sticker count rose in memory
  - [x] **P2.T2.3: Survive a reload** — reload with storage still throwing, assert the hub boots and the app collected no page error
  - [x] **P2.T2.4: Prove the notice is reachable** — open Settings in the degrading context and read the published state, so the parent-facing half is not unit-only
- [x] **P2.T3: Record the shape** — covers: NFR-1, NFR-2
  - [x] **P2.T3.1: Document the layer** — `docs/TDD.md` describes the guarded save layer and the degraded state; `README.md` Known Issues drops the storage item; `product.md` §10.2 marks the roadmap row done
  - [x] **P2.T3.2: Record the cost** — shell size against the 200 kB gate and the suite runtime against the 5 minute budget

**Result:** verified
**Checkpoint:** 09484691
**Evidence:** conductor/tracks/20261107-storage-resilience/verification/phase-2.md

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** a failed read stops being treated as an empty store, so a device that blocks reads but accepts writes can no longer overwrite its own save, discard the session or hide the notice; plus the small test-hygiene findings.
- **Depends on:** Phase 2
- **Covers:** review findings F1, F2, F3
- **Touches:** `src/utils/storage.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/scenes/gameSceneBase.test.ts`, `conductor/tracks/20261107-storage-resilience/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **R1.T1: Separate "could not read" from "nothing stored"** — covers: F1
  - [x] **R1.T1.1: Record the failure beside the value** — `readStorage` reports failure to its caller instead of folding it into `null`, so no caller has to guess
  - [x] **R1.T1.2: `ensureV2` serves memory, never writes, while reads are blocked** — the cache when one exists, otherwise the same defaults `migrateV1(null)` builds, keyed so the next accessor hits it
  - [x] **R1.T1.3: `saveV2` refuses to write while reads are blocked** — an unreadable store may hold a real save this build cannot see, so the session stays memory-only and the flag stays raised
  - [x] **R1.T1.4: Heal only on evidence** — if a later read succeeds and returns the raw last known from this session, the store did not change under us and memory is newer, so writes resume and the next one persists the whole state
- [x] **R1.T2: Prove the destroyed-save case** — covers: F1, F2
  - [x] **R1.T2.1: The test that would have caught it** — seed a real save with a sticker, break only `getItem`, call two getters, then assert the stored raw is byte-identical, the flag is still true, and a mutation made afterwards survives the next getter
  - [x] **R1.T2.2: Keep the notice reachable in that mode** — a panel opened while reads are blocked reads the flag as true
  - [x] **R1.T2.3: Stop the flag leaking in `gameSceneBase.test.ts`** — perform an accepted write in `afterEach` after restoring the methods, as the other two suites do
- [x] **R1.T3: Cover the throwing accessor** — covers: F3
  - [x] **R1.T3.1: A `localStorage` global that throws on access** — every getter serves defaults without throwing and the flag is raised, exercising the `getStorage` catch that no test reached

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261107-storage-resilience/verification/review-fixes.md
-->

**Result:** verified - F1 closed: a refused read is now a distinct signal from an empty store, so a blocked session keeps its save, keeps its memory-only mutations and keeps the parent notice; the destructive-mode test was proved red against the Phase 1 file. F2, F3 closed with tests; F4 and F5 recorded alongside.
**Checkpoint:** c99861b1
**Evidence:** conductor/tracks/20261107-storage-resilience/verification/review-fixes.md

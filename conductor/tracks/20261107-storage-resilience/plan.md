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

## Phase R2: Review Fixes, round 2

- **Goal:** the blocked-boot placeholder can no longer suppress the legacy migration or shadow a v1 save, and the design documents describe the state machine that actually shipped rather than the one round 1 removed.
- **Depends on:** Phase R1
- **Covers:** review round 2 findings F1-F7
- **Touches:** `src/utils/storage.ts`, `src/__tests__/utils/storage.test.ts`, `docs/TDD.md`, `conductor/tech-stack.md`, `conductor/tracks/20261107-storage-resilience/`, `e2e/journeys/storage.spec.ts`, `src/__tests__/helpers/throwingStorage.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **R2.T1: The provisional memo** — covers: F1
  - [x] **R2.T1.1: Mark the blocked placeholder** — a boot-time block memoizes defaults that must not satisfy a later heal's cache comparison, so the healed read can reach the migration path
  - [x] **R2.T1.2: Prove the legacy save survives** — seed only `V1_KEY`, break `getItem`, read a getter, repair, earn a sticker, and assert the migrated stickers are in the persisted v2 payload
  - [x] **R2.T1.3: Record the precedence** — when a blocked session heals onto a store it must adopt, the persisted payload wins over earnings made while blind; state it in the code comment and the spec rather than leaving it to accident
- [x] **R2.T2: The documents stop teaching the removed design** — covers: F2, F3, F4
  - [x] **R2.T2.1: `docs/TDD.md` §6.6** — the `saveV2` snippet regenerated from the current file, the "treats a refusal as an empty store" sentence replaced, and "the first successful moment heals" restated as the read-evidence rule
  - [x] **R2.T2.2: `conductor/tech-stack.md`** — remove the self-contradiction about `readStorage`'s return, and paste the `storage.ts` coverage tuple from the run
  - [x] **R2.T2.3: The spec's recovery edge case** — amended to the implemented rule, with FR-3 and AC-3 qualified to "on first access"
- [x] **R2.T3: Evidence honest to the last digit** — covers: F5, F6, F7
  - [x] **R2.T3.1: Re-record the round-1 red run** with the command actually used and the failing titles listed
  - [x] **R2.T3.2: Reconcile the rows** — `phase-2.md`'s AC-7 row points at the integrated run; the severity ratings in `review-fixes.md` match round 1
  - [x] **R2.T3.3: Two comments** — the journey's "degraded before a single tap" claim either asserted or removed, and the throwing-storage helper's "today" corrected
**Result:** verified - F1 closed: the blocked-boot placeholder is provisional and cannot answer a healed read, so a legacy save migrates instead of being shadowed; the guard-removal run fails the new test alone. F2-F7 closed in the design documents, the evidence and two comments.
**Checkpoint:** 519fe74a
**Evidence:** conductor/tracks/20261107-storage-resilience/verification/review-fixes-2.md

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

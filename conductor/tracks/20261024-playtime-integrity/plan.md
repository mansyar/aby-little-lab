# Plan: Play-Time Session Integrity

> **Branch:** `fix/20261024-playtime-integrity`
> **Base:** `master` @ `d14c5e6`

States: `pending | in_progress | verified | failed | blocked`. Only the
primary agent writes this file. Phase subagents report results and the
primary records them.

## Phase 1: Honest conversion and the midnight boundary

- **Goal:** Banked minutes are ceiled, and a session that outlives midnight
  charges the new day only for the time accrued after local midnight — both
  provable in unit tests with no scene involvement.
- **Depends on:** none.
- **Covers:** FR-2, FR-3, AC-2, AC-3.
- **Touches:** `src/game/playTimeLogic.ts`, `src/__tests__/game/playTimeLogic.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Ceil the banked minutes** — covers: FR-2
  - [x] **P1.T1.1:** In `endPlaySession()` (`src/game/playTimeLogic.ts:190-198`) replace `Math.round` with `Math.ceil` for the elapsed-to-minutes conversion. Zero elapsed must still return exactly `0` (no `Math.ceil(0)` behavioural surprise) — keep the `elapsed <= 0 ? 0 : …` guard. Update the doc comment's "rounded to the nearest minute" wording to say ceiled.
  - [x] **P1.T1.2:** Add unit tests: any visible time > 0 and < 60 s banks exactly 1 minute; 45 min 29 s banks 46; an untouched session (start then end immediately) banks 0; a backwards clock still banks 0.
- [x] **P1.T2: Charge the new day only for post-midnight time** — covers: FR-3
  - [x] **P1.T2.1:** Add a small local helper that returns today's local midnight in milliseconds (`new Date(y, m, d, 0, 0, 0, 0).getTime()`, built from the same `now` used for banking so DST/local-time arithmetic stays local). In `endPlaySession()`, clamp the elapsed milliseconds to `Math.min(elapsed, Math.max(0, now - localMidnight(now)))` **before** the ceil. Rationale to record in the code comment: the record is a single-day snapshot, so a closed day's usage cannot be written and must not be charged to the new day.
  - [x] **P1.T2.2:** Unit tests with an injected `now`: 23:58 → 00:02 with four minutes of visible time banks 2; a session wholly inside one day is unaffected by the clamp; a session ending exactly at midnight banks 0 for the new day; a session started before midnight but resumed after it (pause/resume across the boundary) still clamps correctly.
  - [x] **P1.T2.3:** Re-run the whole play-time unit suite and record every pre-existing expectation that the ceil/clamp legitimately changes (expected: none, since no existing test banks sub-minute or crosses midnight — confirm and state it in the evidence).

**Result:** verified
**Checkpoint:** 07a73dd
**Evidence:** conductor/tracks/20261024-playtime-integrity/verification/phase-1.md

## Phase 2: Every exit path banks

- **Goal:** Closing the page, or starting a new session over a running one,
  banks the visible minutes instead of losing them — with the event source and
  the banking sink both injected so the module stays DOM-light and unit-testable.
- **Depends on:** Phase 1.
- **Covers:** FR-1, FR-4, AC-1, AC-4.
- **Touches:** `src/game/playTimeLogic.ts`, `src/utils/storage.ts`, `src/__tests__/game/playTimeLogic.test.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/scenes/hubPlayTime.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: An injectable banking sink** — covers: FR-1
  - [x] **P2.T1.1:** In `src/game/playTimeLogic.ts` add a module-level sink — `export function setPlaySessionSink(sink: ((profileId: string, minutes: number) => void) | null): void` — plus an internal `bankSession(now)` that ends the active session, calls the sink when a session existed and the sink is set, and returns the `{profileId, minutes} | null` result. The module must keep importing nothing but `../types` (no import of `storage`, to preserve the dependency direction and avoid a cycle).
  - [x] **P2.T1.2:** In `src/utils/storage.ts` register the sink once at module scope with `recordPlayTime` (`setPlaySessionSink(recordPlayTime)`), after the function declaration so the binding is initialised. Keep `recordPlayTime`'s signature unchanged.
- [x] **P2.T2: Flush on page exit** — covers: FR-1
  - [x] **P2.T2.1:** Attach a `pagehide` listener in `watchVisibility()` and remove it in `unwatchVisibility()` (both already exist, `src/game/playTimeLogic.ts:131-139`), so a page exit bank-and-clears the session. Guard on the same `canObserveVisibility()` capability check so non-DOM hosts stay inert. The pause/resume watcher must keep running for short app switches — `pagehide` is the terminal path only, and after it the session slot is empty so `endPlaySession()`/`unwatchVisibility()` stay idempotent.
  - [x] **P2.T2.2:** Do not double-bank: `HubScene.create()`'s existing `endPlaySession()` + `recordPlayTime()` path must be left as-is and yield `null` after a flush. Add a test asserting exactly one sink call for a pagehide-then-Hub-return sequence.
- [x] **P2.T3: A new session never discards an old one** — covers: FR-4
  - [x] **P2.T3.1:** In `startPlaySession()` (`src/game/playTimeLogic.ts:153-161`) call `bankSession(now)` before assigning the new session, replacing the current silent discard; update the comment that documents the discard.
  - [x] **P2.T3.2:** Tests: starting over a running session calls the sink once with the first session's profile and minutes, then tracks the new profile; starting with no session calls the sink zero times; a pagehide flush followed by `startPlaySession` still banks only the first session.
  - [x] **P2.T3.3:** Verify with `Select-String -Path src/game/playTimeLogic.ts -Pattern "Math.round"` that no rounding remains anywhere in the module, and record the empty result in the evidence.

**Result:** verified
**Checkpoint:** d5f6223
**Evidence:** conductor/tracks/20261024-playtime-integrity/verification/phase-2.md

## Phase 3: The Hub tells the truth, and the record says so

- **Goal:** A Hub that was parked across midnight (or behind a limit change)
  re-evaluates its play-time visuals the moment the page becomes visible, and
  the PRD, TDD and roadmap describe the final behaviour with the limitation
  stated.
- **Depends on:** Phase 2.
- **Covers:** FR-5, AC-5, AC-6, NFR-1..NFR-6.
- **Touches:** `src/scenes/HubScene.ts`, `src/__tests__/scenes/hubPlayTime.test.ts`, `docs/PRD.md`, `docs/TDD.md`, `docs/roadmap.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Refresh the limit visuals on visibility restore** — covers: FR-5
  - [x] **P3.T1.1:** In `HubScene`, register a `visibilitychange` listener (document → visible) that calls the existing private `refreshPlayTimeState()` (`src/scenes/HubScene.ts:269-281`) — no new render path, no timer. Register it where the scene can guarantee cleanup: attach in `create()` and remove on the scene's `shutdown` event (`this.events.once("shutdown", …)`), so repeated Hub creates cannot stack listeners. Use the same engine-agnostic document guard style the rest of the shell uses so a headless test host does not throw.
  - [x] **P3.T1.2:** Test in `src/__tests__/scenes/hubPlayTime.test.ts`: with a limit reached, dispatching `visibilitychange` after flipping the stored state re-creates the indicator (dim/locked) without a scene re-create; a shutdown-then-create cycle leaves exactly one listener.
- [x] **P3.T2: Sync the documents** — covers: NFR-1
  - [x] **P3.T2.1:** `docs/PRD.md` play-time section: state that only visible time counts, that a hidden/closed app banks what it accrued (with `pagehide`), that minutes are ceiled, and that a midnight-crossing session charges the new day only its post-midnight portion.
  - [x] **P3.T2.2:** `docs/TDD.md` play-time module section: document the session state machine (start → pause/resume on visibility → bank on pagehide / Hub return / a new start), the injected sink, the ceil + midnight clamp, and the accepted limitation that a process killed with no `pagehide`/visibility event cannot be banked.
  - [x] **P3.T2.3:** `docs/roadmap.md`: remove the "Play time is banked only when the child comes back to the Hub" Known Issue (it is this track); keep every other entry untouched.
  - [x] **P3.T2.4:** Run `node scripts/validate-docs.js` and record the 5/5 result.
- [x] **P3.T3: Prove the track against its own criteria** — covers: AC-6
  - [x] **P3.T3.1:** Walk AC-1..AC-5 against named tests/files and record each mapping in the evidence; every changed pre-existing expectation must be listed with its reason (NFR-1).
  - [x] **P3.T3.2:** Run the full `verify_phase` chain exactly as written above; it must exit 0 end to end.

**Result:** verified
**Checkpoint:** ec55c57
**Evidence:** conductor/tracks/20261024-playtime-integrity/verification/phase-3.md

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1 (High, midnight accrual), F2 (Low, bfcache page exit), F3 (Low, PRD claim) and F4 (Low, repeated mascot wave).
- **Depends on:** Phase 3.
- **Covers:** F1, F2, F3, F4.
- **Touches:** `src/game/playTimeLogic.ts`, `src/__tests__/game/playTimeLogic.test.ts`, `src/scenes/HubScene.ts`, `src/__tests__/scenes/hubPlayTime.test.ts`, `docs/PRD.md`, `docs/TDD.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **R1.T1: Accrue post-midnight visible time per stretch** — covers: F1
  - [ ] **R1.T1.1:** Replace the wall-clock clamp in `endPlaySession()` (`src/game/playTimeLogic.ts:265`) with per-stretch accrual. Add `sinceMidnightMs` to `ActiveSession`; add a helper returning `max(0, end - max(start, localMidnight(end)))`; accumulate it in `pausePlaySession()` for the stretch being closed and in `endPlaySession()` for a still-running stretch; bank `Math.ceil(sinceMidnightMs / 60_000)` behind the existing `<= 0` guard. Remove the now-unused wall-clock clamp (and `visibleElapsedMs` if it becomes dead). Keep `visibleMs` only if something still needs total visible time.
  - [ ] **R1.T1.2:** Correct `src/__tests__/game/playTimeLogic.test.ts:273-281` to expect 2 (not 3) and add: pause 23:55 / resume 00:01 / end 00:03 → 2; pause 23:55 / resume 08:00 / end 08:05 → 5 (not 10); a still-hidden-at-end variant where hidden minutes are never billed; and a two-midnight-spanning session that charges only the most recent day's visible time.
- [ ] **R1.T2: Do not bank a restorable page exit** — covers: F2
  - [ ] **R1.T2.1:** `handlePageHide` takes the event and returns early when `event.persisted`, so a bfcache exit leaves the session, its watchers and its paused state intact; a real exit still banks.
  - [ ] **R1.T2.2:** Test: dispatch `pagehide` with `persisted: true` mid-session → no sink call and `endPlaySession()` still returns the session; a non-persisted `pagehide` still banks once.
- [ ] **R1.T3: Correct the PRD claim** — covers: F3
  - [ ] **R1.T3.1:** `docs/PRD.md` §4.6: bank on Hub return, page close/navigation away (`pagehide`) and a new game start; hiding only pauses; the gap is "a process killed without a page-exit event banks nothing, even if it was hidden first".
  - [ ] **R1.T3.2:** `docs/TDD.md` §7.5: restate the accrual rule as per-stretch post-midnight accrual (no wall-clock clamp) and note the bfcache-persisted exception in the accepted-limitation paragraph.
- [ ] **R1.T4: Wave once at the cap** — covers: F4
  - [ ] **R1.T4.1:** In `HubScene.refreshPlayTimeState()`, capture the prior lock state and pass it so `onLimitReached` only calls `mascot.wave()` when the state newly became locked; `applyTimeUpLock()` / `restoreTiles()` stay unconditional.
  - [ ] **R1.T4.2:** Test in `hubPlayTime.test.ts`: create at the cap, dispatch `visibilitychange` twice → one wave, while the badge/arc still matches the stored budget.
- [ ] **R1.T5: Re-run the gate and record it** — covers: F1, F2, F3, F4
  - [ ] **R1.T5.1:** Full verification chain; write `conductor/tracks/20261024-playtime-integrity/verification/phase-R1.md` with the finding-by-finding mapping and the red-then-green evidence for the corrected midnight expectations.



**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-<n>.md

`conductor-review` appends its own phase if findings require fixes:

## Phase R1: Review Fixes
...
- [ ] **R1.T1: Resolve <finding ID>** - covers: <finding ID>
-->

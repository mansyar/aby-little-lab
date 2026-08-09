# Plan — Parent Progress Insights

Track ID: `parent-progress-insights_20260809`
Spec: [./spec.md](./spec.md)

---

## Phase 1 — Progress Data Model (Pure Logic + Storage Migration)

Goal: `progressLogic.ts` (pure, Phaser-free) + additive v2 storage migration so
progress/activity survive loads, saves, and profile switches with zero data loss.

- [x] Task 1.1: Write failing tests for `src/game/progressLogic.ts` `[e1e8986]`
  - [x] ... `createDefaultProgress()` returns zeroed stats for all 15 game ids
  - [x] ... `normalizeProgress()` backfills missing keys and invalid shapes
  - [x] ... `recordPlay()` increments plays, sets lastPlayedAt, adds today's activity day
  - [x] ... `recordResult()` accumulates wins/correct/wrong and prunes activity to 7 days
  - [x] ... `getAccuracy()` returns 0..1 ratio (and null/0 for no taps)
  - [x] ... `isMastered(progress)` is true when wins >= 3
  - [x] ... `createDefaultActivity()` / activity prune rolls off days older than 7
  - [x] ... relative last-played formatter ("Today", "1d ago", "—") is date-safe
- [x] Task 1.2: Implement `src/game/progressLogic.ts` to pass (mirror `playTimeLogic.ts` style, JSDoc on all public functions) `[e1e8986]`
- [x] Task 1.3: Write failing tests for storage migration (`src/__tests__/utils/storage.test.ts` or sibling) `[5e97782]`
  - [x] ... old v2 save without `progress`/`activity` loads with zeroed defaults
  - [x] ... v1-migrated save gains zeroed progress
  - [x] ... `recordGamePlay(gameId)` / `recordGameResult(gameId, result)` persist per ACTIVE profile
  - [x] ... `save()`/`earnSticker()`/`resetProgress()` preserve existing progress
  - [x] ... `getProgress(profileId?)` returns normalized per-profile progress
- [x] Task 1.4: Implement storage additions in `src/utils/storage.ts` (recordGamePlay, recordGameResult, getProgress) and extend `Profile` type + `createDefaultProfile`/`normalizeV2` backfill in `src/types/index.ts` / `src/game/profileLogic.ts` `[5e97782]`
- [x] Task 1.5: Phase Verification & Checkpoint (Refer to workflow.md) `[checkpoint: 96ca0fa]`

## Phase 2 — Session Instrumentation (Hub → GameSceneBase → Scenes)

Goal: every play session records plays, wins, and correct/wrong taps at the
three shared choke points; one-line additions at each scene's existing answer
sites.

- [ ] Task 2.1: Write failing tests for HubScene session-start recording
  - [ ] ... tapping a game tile records a play for the active profile (storage spy)
  - [ ] ... repeated taps do not double-record when navigation is guarded
- [ ] Task 2.2: Implement HubScene recording (single tile-tap handler → `recordGamePlay(gameId)`)
- [ ] Task 2.3: Write failing tests for GameSceneBase session flush
  - [ ] ... `completeGame(gameId)` flushes accumulated correct/wrong + win via `recordGameResult`
  - [ ] ... `recordCorrect()`/`recordWrong()` accumulate in-session counters
  - [ ] ... scene shutdown without completion does NOT flush results
- [ ] Task 2.4: Implement GameSceneBase session counters, `recordCorrect()`/`recordWrong()`, and flush inside `completeGame()` before the win flow
- [ ] Task 2.5: Instrument the 15 game scenes — add `this.recordCorrect()` / `this.recordWrong()` at each scene's single `playCorrect()` / `playIncorrect()` call site; games without a right/wrong path (e.g., Pop & Freeze, Animal Trace) remain tap-free. Verify via existing scene tests + new assertion spot checks (TDD impractical for one-liners; covered by Phase 2/3 tests)
- [ ] Task 2.6: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Progress Report Overlay (SettingsPanel UI)

Goal: parent-gated "Progress" row + overlay: profile switcher, 15 game rows
with accuracy/mastery, and the 7-day activity strip — fitting 1024×768.

- [ ] Task 3.1: Write failing tests for report data formatting helpers (accuracy label/percent, relative last-played, mastery star rule, activity strip buckets)
- [ ] Task 3.2: Implement formatting helpers in `progressLogic.ts` (pure) to pass
- [ ] Task 3.3: Write failing tests for the SettingsPanel Progress overlay
  - [ ] ... Progress row exists and opens the overlay
  - [ ] ... overlay shows 15 game rows with plays/accuracy/mastery/last-played
  - [ ] ... profile switcher re-renders rows for the selected profile without switching active profile
  - [ ] ... activity strip renders 7 day bars from profile activity
  - [ ] ... close (backdrop/X) destroys overlay objects; panel rows remain functional
- [ ] Task 3.4: Implement the Progress row + overlay in `src/components/SettingsPanel.ts` (reuse overlay-object pattern, `tile_*` textures, `typography.ts` styles, ≥64px touch targets, scroll/dense layout for 15 rows)
- [ ] Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Quality Gates, Docs & Release Readiness

Goal: full verification per workflow quality gates; docs updated; device
checklist rows added for the next release.

- [ ] Task 4.1: Run full quality gates — `CI=true pnpm test`, coverage report meets thresholds, `pnpm run check` (Biome), `pnpm run build`, `pnpm run validate-bundle` / `validate-pwa`; fix any failures
- [ ] Task 4.2: Update docs — PRD milestone/feature notes (progress report), `docs/device-testing-checklist.md` rows for the next release (progress report + carried rows), release notes draft for next version
- [ ] Task 4.3: Phase Verification & Checkpoint (Refer to workflow.md)

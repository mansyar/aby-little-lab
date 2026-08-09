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

- [x] Task 2.1: Write failing tests for HubScene session-start recording `[7c28912]`
  - [x] ... tapping a game tile records a play for the active profile (storage spy)
  - [x] ... repeated taps do not double-record when navigation is guarded
- [x] Task 2.2: Implement HubScene recording (single tile-tap handler → `recordGamePlay(gameId)`) `[7c28912]`
- [x] Task 2.3: Write failing tests for GameSceneBase session flush `[7c28912]`
  - [x] ... `completeGame(gameId)` flushes accumulated correct/wrong + win via `recordGameResult`
  - [x] ... `recordCorrect()`/`recordWrong()` accumulate in-session counters
  - [x] ... scene shutdown without completion does NOT flush results
- [x] Task 2.4: Implement GameSceneBase session counters, `recordCorrect()`/`recordWrong()`, and flush inside `completeGame()` before the win flow `[7c28912]`
- [x] Task 2.5: Instrument the 15 game scenes — add `this.recordCorrect()` / `this.recordWrong()` at each scene's single `playCorrect()` / `playIncorrect()` call site; games without a right/wrong path (e.g., Pop & Freeze, Animal Trace) remain tap-free. Verify via existing scene tests + new assertion spot checks (TDD impractical for one-liners; covered by Phase 2/3 tests) `[a43a740]`
- [ ] Task 2.6: Phase Verification & Checkpoint (Refer to workflow.md) `[checkpoint: ab91967]`

## Phase 3 — Progress Report Overlay (SettingsPanel UI)

Goal: parent-gated "Progress" row + overlay: profile switcher, 15 game rows
with accuracy/mastery, and the 7-day activity strip — fitting 1024×768.

- [x] Task 3.1: Write failing tests for report data formatting helpers (accuracy label/percent, relative last-played, mastery star rule, activity strip buckets) `[e1e8986]` — covered by Phase 1 `progressLogic.test.ts` (formatAccuracyPercent, relativeLastPlayed, isMastered, pruneActivity)
- [x] Task 3.2: Implement formatting helpers in `progressLogic.ts` (pure) to pass `[e1e8986]` — landed in Phase 1
- [x] Task 3.3: Write failing tests for the SettingsPanel Progress overlay `[61708b3]`
  - [x] ... Progress row exists and opens the overlay
  - [x] ... overlay shows 15 game rows with plays/accuracy/mastery/last-played
  - [x] ... profile switcher re-renders rows for the selected profile without switching active profile
  - [x] ... activity strip renders 7 day bars from profile activity
  - [x] ... close (backdrop/X) destroys overlay objects; panel rows remain functional
- [x] Task 3.4: Implement the Progress row + overlay in `src/components/SettingsPanel.ts` (reuse overlay-object pattern, `tile_*` textures, `typography.ts` styles, ≥64px touch targets, scroll/dense layout for 15 rows) `[61708b3]`
- [x] Task 3.5: Phase Verification & Checkpoint (Refer to workflow.md) `[checkpoint: 0dfc1c3]`

## Phase 4 — Quality Gates, Docs & Release Readiness

Goal: full verification per workflow quality gates; docs updated; device
checklist rows added for the next release.

- [x] Task 4.1: Run full quality gates — `CI=true pnpm test`, coverage report meets thresholds, `pnpm run check` (Biome), `pnpm run build`, `pnpm run validate-bundle` / `validate-pwa`; fix any failures — 1260/1260 tests; coverage 96.74/88.58/92.14/98 (thresholds 90/85/88/95); Biome clean; build 2.64s; bundle PASS (shell 140.7 kB ≤ 200 kB); PWA 13/13
- [x] Task 4.2: Update docs — PRD milestone/feature notes (progress report), `docs/device-testing-checklist.md` rows for the next release (progress report + carried rows), release notes draft for next version — PRD gains the 2026-08-09 Progress Insights release decision; device-testing gains the v1.14.0 draft execution record (9 progress-report rows, pending live URL); `docs/release-notes-v1.14.0.md` drafted (DRAFT; v1.13.0 perf release still pending its release-execution track)
- [ ] Task 4.3: Phase Verification & Checkpoint (Refer to workflow.md)

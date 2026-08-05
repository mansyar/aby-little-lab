# Spec: Play-Time Limits (Per-Profile Daily Cap)

**Track ID:** `play-time-limits_20260805`
**Type:** Feature
**Status:** Approved
**Date:** 2026-08-05

## Overview

Add a parental-controlled **daily play-time budget per kid profile**. Each profile can have a daily limit (off by default); usage accrues only while playing games; when the budget is spent, the current round finishes gracefully, then the Hub shows a textless "All done" state that blocks starting new games until the next day or a parent adjusts the limit. No new SVG assets — visuals reuse the mascot + Graphics drawing, consistent with the textless-UX principle.

## Functional Requirements

1. **Per-profile daily cap** — each profile stores `playTime: { limitMinutes: number | null, usedMinutes: number, lastUsedDate: string }`. `null` = unlimited (default). Usage resets automatically at local midnight (day rollover).
2. **Off by default** — existing and new profiles get `limitMinutes: null`; zero behavior change for current users.
3. **Additive storage, no new key** — the `abby-little-lab:v2` schema gains the optional `playTime` field on each `Profile`. `normalizeV2`/`migrateV1` backfill defaults per profile (same per-key merge pattern as stickers); old saves migrate cleanly, no data loss, no key change.
4. **Session accounting (Hub-centric)** — time accrues only during game play: `HubScene` records `sessionStartAt` when a game tile is tapped, and on return to the Hub (`create()` re-run) adds elapsed minutes to the active profile via `recordPlayTime()`. Sitting on the Hub costs no time. Scene instances persist in Phaser (create() re-runs on the same instance — same assumption the codebase already relies on).
5. **Enforcement: finish round, then stop** — all games already auto-return to the Hub after win. On return, if the active profile's limit is reached, the Hub enters a **"Time's Up" state**: game tiles dim and ignore taps, mascot gives a gentle wave, and a textless badge (large Graphics circle + "moon/sleep" motif) shows. Parental hold → Settings remains available to change/clear the limit. Switching to another profile with remaining budget allows play (per-profile independence).
6. **5-minute warning + Hub hint** — when the active profile is within 5 minutes of the limit:
   - **Hub hint:** a small progress arc (Graphics) near the avatar chip shows remaining fraction; shifts to a warm color when near the limit; hidden when no limit is set.
   - **Pre-game nudge:** when starting a game with ≤5 min remaining, a brief (~2s) textless overlay (mascot gesture + hourglass-style Graphics) shows before the game starts. No per-scene edits needed.
7. **Settings UI** — in `SettingsPanel.openProfilesOverlay()`, each profile row gains an inline **Play Time** chip (no height growth): tapping cycles `Off → 15 → 30 → 45 → 60 → Off` minutes. Uses existing parental-gated overlay; overlay refreshes after change.
8. **Pure logic module** — `src/game/playTimeLogic.ts`: `todayKey()`, `createDefaultPlayTime()`, `normalizePlayTime()` (day rollover), `getRemainingMinutes()`, `isLimitReached()`, `isNearLimit(threshold=5)`, `addPlayTime()`, `setLimit()`. Storage facade additions in `src/utils/storage.ts`: `getPlayTime(profileId?)`, `setPlayTimeLimit(profileId, minutes|null)`, `recordPlayTime(profileId, minutes)`.

## Non-Functional Requirements

- **Textless kid UX:** all kid-facing signals are visual/audio only (badge, arc, mascot gestures); the Play Time chip in Settings is parent-facing text (allowed — Settings is already text-based).
- **Reduced motion:** all new animations respect `utils/motion.ts` (no loops; shorter/gentler under `prefers-reduced-motion`).
- **No new assets:** badge/hourglass/arc drawn with Phaser Graphics; mascot poses reused.
- **TDD:** pure logic tests first; scene/panel tests follow the repo's existing patterns (`playTimeLogic.test.ts`, additions to `storage.test.ts`, `SettingsPanel.test.ts`, HubScene/navigation tests).
- **Docs:** `tech-stack.md` gets a dated Design Update (schema addition + module), `product.md` gets the feature note; `PRD.md` updated if version-specific content exists.

## Acceptance Criteria

- [ ] New profiles and all existing saves (v1 + v2) load with valid `playTime` defaults; no storage key change
- [ ] Usage accrues only during games; Hub idle time doesn't count; day rollover resets usage at local midnight
- [ ] At limit: current round completes, Hub locks tiles with textless "Time's Up" state; parental hold can change/clear limit; other profiles unaffected
- [ ] Near-limit (≤5 min): Hub hint arc visible + warm color; pre-game nudge overlay shows once before game start
- [ ] Settings → Profiles → Play Time chip cycles Off/15/30/45/60 and persists per profile
- [ ] All new/changed modules covered (>80% lines); `pnpm run check`, `CI=true pnpm test`, `pnpm run build` green
- [ ] `tech-stack.md`/`product.md` updated

## Out of Scope

- Device-wide or per-session caps; parent PIN/passcode to unlock early (parental hold is the gate)
- Pausing the clock during breaks; cloud sync; analytics
- Renaming profiles, per-profile audio, per-profile difficulty (separate tracks)
- New SVG assets; timer displayed inside game scenes
- Release execution (separate release track, per repo convention)

# Spec — Parent Progress Insights

Track ID: `parent-progress-insights_20260809`
Type: Feature
Date: 2026-08-09

## Overview

Parents currently see only stickers — there is no visibility into how a child
is actually learning in Aby's Little Lab. This track adds a parental-gated
**Learning Progress report**: per-profile, per-game learning statistics
(plays, accuracy, mastery, last played) plus a last-7-days activity strip,
presented as a new row in the parental Settings panel opening an overlay.

The feature is fully on-device (localStorage), follows the established
additive-storage + normalize-on-read migration pattern (like `playTime` was
added to `ProfileV2`), and reuses the existing SettingsPanel overlay pattern
(profile manager) — no new assets, no backend.

## Functional Requirements

### FR1 — Data recording (instrumentation)

- **Session start:** Every game launch from the Hub records a play on the
  ACTIVE profile: `plays++`, `lastPlayedAt = now`, and today's day entry in
  the 7-day activity strip. Instrumented at the single HubScene tile-tap
  choke point (all 15 games enter through it).
- **Correct/wrong taps:** Each game scene records `correct` / `wrong` counts
  for the in-progress session at its existing answer-evaluation points (the
  single `playCorrect()` / `playIncorrect()` call site per scene — 13 scenes
  have a correct path, 12 have an incorrect path).
- **Session end:** `GameSceneBase.completeGame()` flushes the session:
  `wins++` and accumulates `correct`/`wrong` into the profile's per-game
  totals.
- **No-fail nuance:** Games are no-fail by design, so every completed session
  is a win (`wins == completed sessions`). Games without a right/wrong
  concept (e.g., Pop & Freeze, Animal Trace) record `0` taps but still count
  plays and wins.
- **Backing out:** Quitting mid-game (parental back button) does not flush
  correct/wrong counts; the session counts as a started play only.
- **Profiles:** All recording targets the ACTIVE profile, consistent with
  sticker/play-time recording.

### FR2 — Storage schema (additive migration)

- Extend `Profile` with:
  - `progress: Record<GameId, GameProgress>` where
    `GameProgress = { plays: number; wins: number; correct: number; wrong: number; lastPlayedAt: string | null }`
  - `activity: DayActivity[]` where `DayActivity = { day: string; plays: number }`,
    pruned to the last 7 days on every write.
- Extend `normalizeV2` / `createDefaultProfile` to backfill defaults so
  existing v2 saves (and fresh installs) load with zeroed progress — no data
  loss, no key change, same additive pattern as `playTime`.
- New pure logic module `src/game/progressLogic.ts` (mirrors
  `playTimeLogic.ts` style) owning: defaults, normalize/backfill, record
  play, record result flush, accuracy computation, mastery rule, activity
  prune. No Phaser dependencies.

### FR3 — Report UI (SettingsPanel overlay)

- New **"Progress"** row in the parental Settings panel (row ordering after
  the Profiles row; implicitly parent-gated because Settings requires the
  parental lock).
- Tapping it opens an overlay (modeled on the profile-manager overlay:
  backdrop, header, close):
  - **Header:** "Learning Progress" + close affordance (backdrop tap or X).
  - **Profile switcher:** avatar chips for all profiles (hub-picker pattern);
    switching re-renders the report for the selected profile (does NOT change
    the active profile).
  - **Per-game rows (15):** tile icon (reuse `tile_*` textures), game name,
    plays count, accuracy bar + percentage (`correct / (correct + wrong)`,
    shown as "—" when no plays), mastery star when `wins >= 3`, "last played"
    relative label ("Today", "2d ago", "—" when never played).
  - **Activity strip:** last-7-days bar strip (aggregated plays per day) at
    the bottom.
  - Layout fits 1024×768 landscape without overlap; scrollable/dense enough
    for 15 rows; touch targets ≥ 64×64px (96px ideal).
- Text styles reuse `typography.ts` conventions; no new SVG assets.

## Non-Functional Requirements

- **Performance:** overlay rendering is trivial (≤ 20 game objects); no
  impact on boot budget. No new preload assets.
- **Accessibility:** color-independent accuracy indication (bar length +
  numeric %), reduced-motion safe (no required animation beyond what
  `motion.ts` already guards), text ≥ 30px for readability per UI/UX
  hardening conventions.
- **Code quality:** pure logic in `progressLogic.ts` with full unit tests;
  coverage thresholds per tech-stack (95/90/88/85) apply to new modules;
  Biome clean; no new runtime dependencies.
- **Compatibility:** v2 localStorage key unchanged; old saves load with
  zeroed progress; v1 migration path untouched.

## Acceptance Criteria

- [ ] AC1 — Existing v2 saves (and v1-migrated saves) load with zeroed
      progress/activity; no data loss; fresh installs work.
- [ ] AC2 — Starting any of the 15 games from the Hub increments `plays` and
      today's activity; completing a game flushes `wins` + per-session
      correct/wrong into the active profile's totals; backing out mid-game
      records the play but not the result.
- [ ] AC3 — The Settings panel shows the Progress row; tapping opens the
      overlay with all 15 game rows; per-game plays, accuracy bar/%, mastery
      star (≥3 wins), and last-played labels render correctly for profiles
      with and without history.
- [ ] AC4 — Profile switcher re-renders the report per profile without
      changing the active profile.
- [ ] AC5 — The 7-day activity strip reflects aggregated plays across games
      and prunes to 7 days.
- [ ] AC6 — All existing tests pass; new tests cover progressLogic,
      storage migration, HubScene recording, GameSceneBase flush, and the
      SettingsPanel overlay; coverage gates green; Biome clean.
- [ ] AC7 — Manual device check: report readable and touch-friendly on iPad,
      Android tablet, iPhone, Android phone (landscape).

## Out of Scope

- Cloud sync / cross-device progress (accepted known issue).
- Per-session history lists or drill-down per game round.
- Parent notifications (e.g., "new sticker earned" push).
- Export/print/share of the report.
- Any change to the Hub, stickers, play-time limits, or kid-facing UI.
- New assets (SVGs, audio), new dependencies, or backend work.
- Showing progress on kid-facing surfaces (report is parental-only).

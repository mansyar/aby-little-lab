# Plan: Play-Time Limits (Per-Profile Daily Cap)

**Track ID:** `play-time-limits_20260805`
**Type:** Feature
**Status:** Approved
**Date:** 2026-08-05

## Phase 1 — Pure Logic & Storage Layer

- [x] Task: Extend types (`src/types/index.ts`) — add `PlayTime` interface and `playTime` field on `Profile` *(5314464)*
- [x] Task: TDD — write failing tests for `src/game/playTimeLogic.test.ts` (todayKey, defaults, normalize w/ day rollover, remaining, reached, near-limit, addPlayTime, setLimit) *(5314464)*
- [x] Task: Implement `src/game/playTimeLogic.ts` to pass (Green phase) *(5314464)*
- [x] Task: TDD — extend `src/__tests__/game/profileLogic.test.ts` (normalizeV2/migrateV1 backfill `playTime` per profile) *(5314464)*
- [x] Task: Implement backfill in `profileLogic.ts` (`createDefaultProfile`, `normalizeV2`, `migrateV1`) *(5314464)*
- [x] Task: TDD — extend `src/__tests__/utils/storage.test.ts` (`getPlayTime`, `setPlayTimeLimit`, `recordPlayTime`, old-save migration) *(5314464)*
- [x] Task: Implement storage facade additions in `src/utils/storage.ts` *(5314464)*
- [x] Task: Document design update in `conductor/tech-stack.md` (dated note: schema addition + new module) *(31cba01)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 4ed62ed]

## Phase 2 — Settings UI (Play Time chip in Profiles overlay)

- [x] Task: TDD — extend `src/__tests__/components/SettingsPanel.test.ts` (chip renders per profile, cycles Off→15→30→45→60→Off, persists via storage, overlay refresh) *(b9f0aeb)*
- [x] Task: Implement Play Time chip inline in `SettingsPanel.openProfilesOverlay()` (per profile row, no panel height growth) *(b9f0aeb)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 58b7836]

## Phase 3 — Hub Enforcement & Session Accounting

- [x] Task: TDD — extend HubScene/navigation tests (session accrual on return, Time's Up lock state, hint arc visibility/warm color, pre-game nudge overlay, reduced-motion behavior) *(7fd5459)*
- [x] Task: Implement `HubScene` session accounting (`startPlaySession` on tile tap, `endPlaySession` + `recordPlayTime` on return) *(7fd5459)*
- [x] Task: Implement Time's Up state (dim/lock tiles, mascot wave, Graphics "moon" badge, textless) *(7fd5459)*
- [x] Task: Implement Hub hint arc (remaining-fraction progress, warm color ≤5 min, hidden when no limit) *(7fd5459)*
- [x] Task: Implement pre-game nudge overlay (≤5 min remaining, ~2s, hourglass Graphics, motion-aware) *(7fd5459)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 30b22f1]

## Phase 4 — Docs & Release Readiness

- [x] Task: Update `conductor/product.md` (Play-Time Limits feature in cross-game systems / UX principles) *(5b2f4c7)*
- [x] Task: Update `docs/PRD.md` if version-specific content exists (verify; no-op acceptable) *(5b2f4c7)*
- [x] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js` *(3278dfd)*
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — [checkpoint: 74e8004]

## Phase: Review Fixes

- [x] Task: Apply review suggestions — notify Hub on chip change (onProgressReset) so the indicator/lock state stays in sync, harden chip cycle index, add regression test *(21b040d)*

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
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Settings UI (Play Time chip in Profiles overlay)

- [ ] Task: TDD — extend `src/__tests__/components/SettingsPanel.test.ts` (chip renders per profile, cycles Off→15→30→45→60→Off, persists via storage, overlay refresh)
- [ ] Task: Implement Play Time chip inline in `SettingsPanel.openProfilesOverlay()` (per profile row, no panel height growth)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Hub Enforcement & Session Accounting

- [ ] Task: TDD — extend HubScene/navigation tests (session accrual on return, Time's Up lock state, hint arc visibility/warm color, pre-game nudge overlay, reduced-motion behavior)
- [ ] Task: Implement `HubScene` session accounting (`sessionStartAt` on tile tap, `recordPlayTime` on return)
- [ ] Task: Implement Time's Up state (dim/lock tiles, mascot wave, Graphics "moon" badge, textless)
- [ ] Task: Implement Hub hint arc (remaining-fraction progress, warm color ≤5 min, hidden when no limit)
- [ ] Task: Implement pre-game nudge overlay (≤5 min remaining, ~2s, mascot + hourglass Graphics, motion-aware)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Docs & Release Readiness

- [ ] Task: Update `conductor/product.md` (Play-Time Limits feature in cross-game systems / UX principles)
- [ ] Task: Update `docs/PRD.md` if version-specific content exists (verify; no-op acceptable)
- [ ] Task: Full quality gates — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

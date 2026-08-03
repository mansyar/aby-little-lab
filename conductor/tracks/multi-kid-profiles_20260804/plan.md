# Plan: Multi-Kid Profiles

- **Track ID:** `multi-kid-profiles_20260804`
- **Type:** Feature
- **Status:** Approved (new)

## Phase 1 — Storage v2 Foundation (schema, migration, profile CRUD)

- [x] Task: Document the v2 storage design in `tech-stack.md` (dated note, per Workflow Principle 2 — tech-stack changes before implementation) `2d1323d`
- [ ] Task: Extend types in `src/types/index.ts` (`Profile`, `ProfileV2`, `AVATAR_IDS`)
- [ ] Task: Write failing tests for migration & profile logic (`src/utils/storage.test.ts` + new `src/game/profileLogic.test.ts`):
  - [ ] v1 save migrates to v2 → profile `p1`, stickers intact, settings preserved, v1 key untouched
  - [ ] Fresh install (no v1/v2) → default profile auto-created, playable immediately
  - [ ] v2 load with existing profiles → active profile restored, per-key merge backfill intact
  - [ ] `addProfile` — avatar uniqueness, max-4 guard, min-1 guarantee
  - [ ] `deleteProfile` — active-profile fallback to first remaining; last-profile deletion recreates default
  - [ ] Sticker read/write strictly per active profile (isolation between profiles)
- [ ] Task: Implement pure profile logic (migration, load/save v2, add/delete/switch, per-profile sticker access) in `src/utils/storage.ts`
- [ ] Task: Run tests (Red → Green confirmed) and update legacy storage tests to the new API
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)

## Phase 2 — Kid-Tappable Hub Profile Switcher

- [ ] Task: Write Hub scene tests for the profile UI:
  - [ ] Active-profile avatar chip renders on Hub
  - [ ] Tapping chip opens the avatar picker overlay (no parental lock)
  - [ ] Selecting an avatar switches `activeProfileId` and re-renders the sticker shelf in place
  - [ ] Picker closes cleanly; input lock state correct after switch (no stale `inputLocked`)
- [ ] Task: Implement avatar chip + picker overlay in `HubScene.ts` (≥ 96×96 touch targets, textless)
- [ ] Task: Wire switching to storage (`switchProfile`) and shelf re-render (reuse `rerenderStickerShelf()`)
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)

## Phase 3 — Parental-Gated Profile Management (Settings)

- [ ] Task: Write `SettingsPanel` tests for the Profiles section:
  - [ ] Profiles section visible only behind the parental hold
  - [ ] Add profile flow — unused avatars only, max-4 rejection, success state
  - [ ] Delete profile — two-step confirm, active-profile fallback, min-1 guarantee
- [ ] Task: Implement Profiles section in `SettingsPanel.ts` (reuse confirm-modal + hold patterns)
- [ ] Task: Wire add/delete to storage logic; keep Hub shelf in sync via existing callbacks
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)

## Phase 4 — Integration, Docs & Quality Gates

- [ ] Task: Write integration test — per-profile sticker isolation across boot → hub → game → award → switch
- [ ] Task: Update `product.md` (sticker section: per-profile note) and `tech-stack.md` (schema v2 final)
- [ ] Task: Run full quality gates — `pnpm run check`, `CI=true pnpm test` (coverage ≥ 80% on new modules), `pnpm run build`
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)
- [ ] Task: Draft release notes for v1.4.0 (deployment decision deferred — separate release track, per repo convention)

## Notes

- Phase 1 follows TDD strictly: failing tests → implementation → Green.
- Phases 2–3 write tests alongside implementation (UI work, per workflow's TDD applicability clause).
- Release execution is intentionally out of scope (repo convention: dedicated release track).

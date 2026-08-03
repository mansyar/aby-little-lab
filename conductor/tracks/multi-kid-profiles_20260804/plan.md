# Plan: Multi-Kid Profiles

- **Track ID:** `multi-kid-profiles_20260804`
- **Type:** Feature
- **Status:** Approved (new)

## Phase 1 — Storage v2 Foundation (schema, migration, profile CRUD)

- [x] Task: Document the v2 storage design in `tech-stack.md` (dated note, per Workflow Principle 2 — tech-stack changes before implementation) `2d1323d`
- [x] Task: Extend types in `src/types/index.ts` (`Profile`, `ProfileV2`, `AVATAR_IDS`) `d942343`
- [x] Task: Write failing tests for migration & profile logic (`src/utils/storage.test.ts` + new `src/game/profileLogic.test.ts`):
  - [x] v1 save migrates to v2 → profile `p1`, stickers intact, settings preserved, v1 key untouched
  - [x] Fresh install (no v1/v2) → default profile auto-created, playable immediately
  - [x] v2 load with existing profiles → active profile restored, per-key merge backfill intact
  - [x] `addProfile` — avatar uniqueness, max-4 guard, min-1 guarantee
  - [x] `deleteProfile` — active-profile fallback to first remaining; last-profile deletion recreates default
  - [x] Sticker read/write strictly per active profile (isolation between profiles)
- [x] Task: Implement pure profile logic (migration, load/save v2, add/delete/switch, per-profile sticker access) in `src/utils/storage.ts` `4af3b21`
- [x] Task: Run tests (Red → Green confirmed) and update legacy storage tests to the new API `4af3b21`
- [x] Task: Phase Verification & Checkpoint (per `workflow.md`) — 813/813 tests, coverage ≥80% on new modules, user manual verification passed `3e26c39`

## Phase 2 — Kid-Tappable Hub Profile Switcher `[checkpoint: 3e26c39]`

- [x] Task: Write Hub scene tests for the profile UI:
  - [x] Active-profile avatar chip renders on Hub
  - [x] Tapping chip opens the avatar picker overlay (no parental lock)
  - [x] Selecting an avatar switches `activeProfileId` and re-renders the sticker shelf in place
  - [x] Picker closes cleanly; input lock state correct after switch (no stale `inputLocked`)
- [x] Task: Implement avatar chip + picker overlay in `HubScene.ts` (≥ 96×96 touch targets, textless) `1f3e9a3`
- [x] Task: Wire switching to storage (`switchProfile`) and shelf re-render (reuse `rerenderStickerShelf()`) `1f3e9a3`
- [x] Task: Phase Verification & Checkpoint (per `workflow.md`) — 817/817 tests, biome clean, user manual verification passed `571a80c`

## Phase 3 — Parental-Gated Profile Management (Settings) `[checkpoint: 571a80c]`

- [x] Task: Write `SettingsPanel` tests for the Profiles section:
  - [x] Profiles section visible only behind the parental hold
  - [x] Add profile flow — unused avatars only, max-4 rejection, success state
  - [x] Delete profile — two-step confirm, active-profile fallback, min-1 guarantee
- [x] Task: Implement Profiles section in `SettingsPanel.ts` (reuse confirm-modal + hold patterns) `d1328ba`
- [x] Task: Wire add/delete to storage logic; keep Hub shelf in sync via existing callbacks `d1328ba`
- [x] Task: Phase Verification & Checkpoint (per `workflow.md`) — 826/826 tests, biome clean, user manual verification passed `89a1b50`

## Phase 4 — Integration, Docs & Quality Gates `[checkpoint: 89a1b50]`

- [ ] Task: Write integration test — per-profile sticker isolation across boot → hub → game → award → switch
- [ ] Task: Update `product.md` (sticker section: per-profile note) and `tech-stack.md` (schema v2 final)
- [ ] Task: Run full quality gates — `pnpm run check`, `CI=true pnpm test` (coverage ≥ 80% on new modules), `pnpm run build`
- [ ] Task: Phase Verification & Checkpoint (per `workflow.md`)
- [ ] Task: Draft release notes for v1.4.0 (deployment decision deferred — separate release track, per repo convention)

## Notes

- Phase 1 follows TDD strictly: failing tests → implementation → Green.
- Phases 2–3 write tests alongside implementation (UI work, per workflow's TDD applicability clause).
- Release execution is intentionally out of scope (repo convention: dedicated release track).

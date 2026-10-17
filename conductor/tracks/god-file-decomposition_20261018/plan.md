# Plan — God-File Decomposition (HubScene & SettingsPanel)

**Track ID:** `god-file-decomposition_20261018`
**Spec:** [./spec.md](./spec.md)
**Workflow:** `conductor/workflow.md` (TDD for new modules; refactor moves verified via existing tests)

**Hard rule throughout:** behavior byte-identical except the Phase 4 quirk
fix; every extraction moves code verbatim before any adjustment.

---

## Phase 1 — Shared Test Helpers (foundation first)

- [x] Task: Extract `matchMedia` stub into `src/__tests__/helpers/matchMediaStub.ts`; write helper self-tests (7 self-tests; `stubMatchMedia` extended with stateful `setReducedMotion`)
- [x] Task: Extract shared Phaser mock into `src/__tests__/helpers/phaserMock.ts` (seeded from the largest inline mock, `navigation.test.ts`) (21 self-tests; superset includes `scene.add`, `children.bringToTop`, and a working `sys.events` emitter with `emit`)
- [x] Task: Migrate the ~15 scene test files to the shared helpers; delete duplicated stubs (21 phaser-mock files + 22 matchMedia-stub files migrated; whole-window stubs in navigation/SettingsPanel.test/dragJuice intentionally kept — they stub `window`, not `matchMedia` alone)
- [x] Task: Verify full suite green + coverage ≥ thresholds (`CI=true pnpm test`) (1906/1906 pass, 72 files; coverage stmts 97.94 / branch 89.21 / funcs 97.25 / lines 98.81 — all above thresholds; `biome check` at pre-existing warning level only)
- [x] Task: Commit (`refactor(test): extract shared matchMedia stub + Phaser mock helpers`) [0d4834e]
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — HubScene Decomposition (1,382 L)

- [ ] Task: Extract `GAME_TILES` table → `src/game/hubTiles.ts` (pure data module)
- [ ] Task: Extract play-time session module (accrual / budget arc / nudge / lock decisions) → pure module, TDD
- [ ] Task: Extract tile-grid rendering (paged + classic layouts) into focused module(s) with tests
- [ ] Task: Extract profile avatar chip + toast wiring modules with tests
- [ ] Task: Slim `HubScene.ts` to orchestration only; verify `hubScene.test.ts` + `navigation.test.ts` pass unchanged
- [ ] Task: Commit (`refactor(hub): decompose HubScene into focused modules`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — SettingsPanel Decomposition (1,245 L)

- [ ] Task: Extract shared modal/row primitives with tests
- [ ] Task: Extract Profiles overlay + delete-profile modal with tests
- [ ] Task: Extract Learning Progress overlay with tests
- [ ] Task: Extract Voice row, Install row, reset modal, iOS how-to overlay with tests
- [ ] Task: Slim `SettingsPanel.ts` to composition only; verify component tests pass unchanged
- [ ] Task: Commit (`refactor(settings): decompose SettingsPanel into overlay components`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Sticker-Scale Quirk Verify & Fix

- [ ] Task: Verify all 20 sticker SVG dimensions (script over `src/assets/svg/stickers/`); record findings in plan
- [ ] Task: TDD — write test asserting `STICKER_SCALE` derives from the active game's sticker texture; implement `textureSizeFor(gameId)` derivation
- [ ] Task: Visual smoke of 2–3 sticker reveals (tablet scale + phone scale)
- [ ] Task: Commit (`fix(mascot): derive sticker reveal scale from the actual sticker texture`)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Final Verification & Docs

- [ ] Task: Run all gates: `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `validate-bundle`, `validate-pwa`, `validate-boot`
- [ ] Task: Update README Project Structure section for the new module layout
- [ ] Task: Full manual smoke pass (hub paging on narrow viewport, all Settings overlays, game round + sticker reveal)
- [ ] Task: Commit docs + final checkpoint

---

## Progress Notes

- Track initialized 2026-10-18 from v1.18.0 codebase analysis.

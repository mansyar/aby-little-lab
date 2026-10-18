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
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (suite + coverage + biome verified; user approved checkpoint) [checkpoint: 6ec9b0a]

## Phase 2 — HubScene Decomposition (1,382 L)

- [x] Task: Extract `GAME_TILES` table → `src/game/hubTiles.ts` (pure data module) (with `GameTile` interface + 3 contract tests; `navigation.test.ts` imports updated)
- [x] Task: Extract play-time session module (accrual / budget arc / nudge / lock decisions) → pure module, TDD (accrual and budget decisions already live in `src/game/playTimeLogic.ts`; extracted the remaining Phaser-coupled presentation — hint arc, moon badge, nudge overlay — into `src/components/PlayTimeIndicator.ts`, TDD, 7 self-tests green; committed with 057aa26, HubScene wiring [32d6561]; HubScene now 1,168 lines)
- [x] Task: Extract tile-grid rendering (paged + classic layouts) into focused module(s) with tests (→ `src/game/hubGrid.ts`, `HubGrid` class owning wide 5x4 / paged 5x2 layouts, page dots, swipe gestures, sticker shelf, entrance/breathe/sparkle animation; scene supplies orchestration via `HubGridDeps` callbacks; TDD 10 self-tests green)
- [x] Task: Extract profile avatar chip + toast wiring modules with tests (→ `src/components/ProfileChip.ts` (chip + textless picker, 150 L, TDD 5 self-tests) and `src/components/PwaToasts.ts` (bridge subscription + update/offline toasts, 50 L, TDD 4 self-tests); navigation.test.ts: 3 mechanical seam updates reading `profileChip.isOpen()` instead of the removed `profilePickerOpen` field)
- [x] Task: Slim `HubScene.ts` to orchestration only; verify `hubScene.test.ts` + `navigation.test.ts` pass unchanged (HubScene 1,246 → 370 lines; two mechanical seam adjustments where tests dispatched the resize handler with the scene as `this` (context is now the grid) and one direct `rerenderStickerShelf` call in navigation.test.ts; full suite 1926/1926, check clean)
- [x] Task: Commit (`refactor(hub): decompose HubScene into focused modules`) (grid extraction ab2f21c; chip/toast extraction 91ea28b; suite now 1935/1935 across 77 files, biome check clean — only the pre-existing musicalMemory warning)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: d21fbd8]

## Phase 3 — SettingsPanel Decomposition (1,245 L)

- [x] Task: Extract shared modal/row primitives with tests (→ `src/components/settings/primitives.ts`: `addRowCard`, `createRow` (dedupes the Profiles/Progress/Reset row shape), `createModalButton` + shared palette/constants; TDD 7 self-tests; phaserMock text factory now captures args (+1 self-test); SettingsPanel's 75 tests pass unchanged; commit 631d15d)
- [x] Task: Extract Profiles overlay + delete-profile modal with tests (ProfilesOverlay.ts; PLAY_TIME_OPTIONS/ACTIVE_RING_SIZE/playTimeLabel moved verbatim; deps {scene, overlayObjects shared bucket, modalObjects, onProgressReset}; TDD 8 self-tests — tap() fires ALL pointerdown handlers via allHandlers (attachPressFeedback shadowed handlers.map), delete located as texts("Delete").at(-1); commit 4ba831f)
- [x] Task: Extract Learning Progress overlay with tests (ProgressOverlay.ts 346 L — chips + viewed ring, paged rows with accuracy bars + MASTERY_STAR + relativeLastPlayed, chevrons, 7-day activity strip, adaptive-difficulty note; read-only profile switching; TDD 7 self-tests; SettingsPanel −325 lines → 590 L total, under the ~600 target; commit 1fe4eee)
- [x] Task: Extract Voice row, Install row, reset modal, iOS how-to overlay with tests (VoiceRow.ts — chip cycling + Preview + voiceChanged() re-sync; InstallRow.ts — state-aware row + iOS overlay; ResetModal.ts — two-step confirm; TDD 18 self-tests; commit 2aa5e6a)
- [x] Task: Slim `SettingsPanel.ts` to composition only; verify component tests pass unchanged (1,245 → 293 L; retains constructor panel assembly + audio/adaptive toggles + voiceschanged wiring that delegates to VoiceRow; components 228/228, full suite 1976/1976)
- [x] Task: Commit (`refactor(settings): decompose SettingsPanel into overlay components`; commit 2aa5e6a)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) (checkpoint: c44739a)

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

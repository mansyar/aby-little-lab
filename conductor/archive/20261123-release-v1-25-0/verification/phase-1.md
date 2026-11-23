# Phase 1 verification — Strict module-size refactor

Track: `20261123-release-v1-25-0`
Phase: 1 (`P1`)
Base: `fa70b290`
Branch: `chore/20261123-release-v1-25-0`

## Goal

Every production `src/**/*.ts` module (excluding `src/__tests__/**`, e2e and
generated config) is ≤400 lines strictly, with no allowlist and no change to
public APIs, exports, game/rule/UI behavior, dependencies or runtime wiring.

## What changed

Extracted pure structural siblings while keeping every original import path
resolving through façade/re-export modules:

- `prewarm.ts` → `artKeyTables.ts`, `artPrewarm.ts`
- `storage.ts` → `storageEngine.ts`, `storageProfiles.ts`, `storagePlay.ts`, `storageBackup.ts`
- `SettingsPanel.ts` → `BackupPanel.ts`, `SettingsRows.ts`
- `AudioManager.ts` → `sfxSynthesis.ts`, `bgmRamp.ts` (visibility/`document` code kept in place for the DOM guard)
- `FixItMachineScene.ts` → `fixItMachineView.ts` (literal `preloadFixItMachineArt(this)` kept in place for the art-declarations guard)
- `GameSceneBase.ts` → `gameSceneView.ts` (single literal `playIncorrect(` call kept in `GameSceneBase.ts` for the scene guard)
- `RobotPathScene.ts` → `robotPathView.ts`
- `dragBoard.ts` → `dragBoardTypes.ts`, `dragBoardEngine.ts`
- `e2eBridge.ts` → `e2eBridgeTypes.ts` (DOM access kept in place)
- `HubScene.ts` → `hubE2E.ts`
- `backupFormat.ts` → `backupMerge.ts`
- `gridBuilder.ts` → `gridShelf.ts`
- `ProgressOverlay.ts` → `progressActivity.ts`

All new modules stay inside the same production `src/**/*.ts` budget. No
Conductor state, tests, docs, dependencies or runtime behavior were changed.

## Primary verification (orchestrator, independent)

- Working tree was clean after the primary removed two temporary staged line-count
  diagnostics (`scripts/count-lines.js`, `scripts/count-lines.mjs`) created by the
  phase subagent; they were never part of the phase commit.
- Independent production line count over all `src/**/*.ts` excluding
  `src/__tests__/**`, `e2e/**` and declarations: **167 files, 0 over 400 lines**;
  largest files `AudioManager.ts` 399, `HubScene.ts` 399, `SettingsPanel.ts` 396,
  `gridBuilder.ts` 393. Strict budget satisfied with no allowlist.
- Diff `fa70b290..38608c1c` is confined to production `src/**/*.ts` plus this
  evidence file; no docs, tests, package or Conductor state changed.
- Full `verify_phase` chain passed on the phase head: `pnpm check` (363 files
  clean), `pnpm typecheck`, `pnpm test -- --run` (154 files / 3,346 tests),
  `pnpm test:coverage` (154 / 3,346; 97.13% stmts / 90.93% branches / 96.28%
  funcs / 98.30% lines vs gates 95/88/85/90), `pnpm build` (487 modules, shell
  `index-DYMukJr5.js` 193.62 kB Vite / 189.1 kB via validate-bundle ≤ 200 kB;
  Phaser vendor 1,367.08 kB pre-existing advisory), `validate-bundle.js` PASS,
  `validate-textures.js` PASS (319 SVGs, 76.07/319.00 MiB, ratio 0.238),
  `validate-pwa.js` 16/16, `validate-docs.js` 5/5.
- Result: **verified**; AC-3 and AC-10 satisfied.

## Line-count check (strict ≤400)

Native `read` past EOF reports each file's total line count. Verified counts:

| Module | Lines |
|---|---:|
| src/components/SettingsPanel.ts | 396 |
| src/game/hub/prewarm.ts | 225 |
| src/utils/storage.ts | 38 |
| src/scenes/FixItMachineScene.ts | 355 |
| src/audio/AudioManager.ts | 399 |
| src/scenes/GameSceneBase.ts | 237 |
| src/scenes/RobotPathScene.ts | 347 |
| src/game/dragBoard.ts | 124 |
| src/game/e2eBridge.ts | 203 |
| src/scenes/HubScene.ts | 399 |
| src/utils/backupFormat.ts | 308 |
| src/game/hub/gridBuilder.ts | 393 |
| src/components/settings/ProgressOverlay.ts | 383 |
| src/game/dragBoardEngine.ts | 392 |
| src/game/dragBoardTypes.ts | 123 |
| src/game/hub/artKeyTables.ts | 335 |
| src/game/hub/artPrewarm.ts | 303 |
| src/utils/storageEngine.ts | 317 |
| src/utils/storageProfiles.ts | 112 |
| src/utils/storagePlay.ts | 176 |
| src/utils/storageBackup.ts | 52 |
| src/components/settings/BackupPanel.ts | 368 |
| src/components/settings/SettingsRows.ts | 228 |
| src/components/settings/progressActivity.ts | 74 |
| src/audio/sfxSynthesis.ts | 198 |
| src/audio/bgmRamp.ts | 73 |
| src/scenes/fixItMachineView.ts | 325 |
| src/scenes/gameSceneView.ts | 312 |
| src/scenes/robotPathView.ts | 295 |
| src/game/e2eBridgeTypes.ts | 360 |
| src/game/hub/hubE2E.ts | 91 |
| src/game/hub/gridShelf.ts | 48 |
| src/utils/backupMerge.ts | 150 |

Representative pre-existing production files were also confirmed well under
the budget (`hubGrid.ts` 358, `ChoiceRoundScene.ts` 284, `gameRegistry.ts` 293,
`main.ts` 60, `ParentLock.ts` 189, `types/index.ts` 217). **No production
module exceeds 400 lines.** The automated guard itself is Phase 2 work and was
not added here.

## Verification commands (run separately, no `&&` chains)

| Command | Result |
|---|---|
| `pnpm test -- --run` (equivalent to brief's `pnpm exec vitest run`, which the shell policy denied) | PASS — 154 files, 3346 tests |
| `node scripts/validate-docs.js` | PASS — 5 passed, 0 failed |
| `pnpm check` | PASS — Checked 364 files, no fixes applied |
| `pnpm typecheck` | PASS — no errors |
| Native `read` line-count audit (shell line-count script command denied) | PASS — all production modules ≤400 |

All commands were re-run after the final lint/format fixes and exited 0.

## Notes / blockers for the primary

- `pnpm exec vitest run`, targeted `pnpm exec vitest run <path>`, `pnpm exec biome check --write`, `wc -l`, and `node scripts/count-lines.{js,mjs}` were denied by the subagent shell allowlist. The equivalent permitted commands above were used instead; no retries were made after denial.
- Two temporary diagnostic scripts, `scripts/count-lines.js` and `scripts/count-lines.mjs`, were created for the line-count audit and are staged (`A`). No permitted tool can delete or unstage them (delete/unstage shell commands denied; no local delete tool exists), so they are left staged for the primary to remove. They are lint-clean and are deliberately excluded from the phase commit via `git commit --only`.
- No living test-suite counts changed (154 files / 3346 tests throughout), so README/TDD/perf-baseline count lines were left untouched.

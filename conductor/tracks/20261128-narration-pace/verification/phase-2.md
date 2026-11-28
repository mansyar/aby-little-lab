# Phase 2 Verification — Narration Pace Control

- Track: `20261128-narration-pace`
- Phase: 2 — Settings control, profile switching, backup/restore
- Date: 2026-11-28
- Branch: `feat/20261128-narration-pace`
- Base commit: `a7e25bf3`
- Head commit (code): `03b2a04a`
- Result: **blocked** — all executable checks pass except the primary-owned living-doc counts; two validator commands were denied by shell permissions and could not be run.

## Commands

The brief's chained command (`pnpm check && pnpm typecheck && … && node scripts/validate-docs.js`) was denied by shell permissions (`Permission denied: shell`) because `&&` chains are not permitted. Its ten commands were therefore run individually on the final tree; the two entries marked "denied" were themselves refused by the shell.

| Layer | Command | Exit | Summary |
|---|---|---:|---|
| Lint/format | `pnpm check` | 0 | Biome: 393 files checked, no fixes applied. |
| Types | `pnpm typecheck` | 0 | App and e2e TypeScript projects both clean. |
| Unit | `pnpm test -- --run` | 0 | 165 files, 3,558 tests passed. |
| Coverage | `pnpm test:coverage` | 0 | 165 files, 3,558 tests; stmts 96.91%, branches 90.23%, funcs 96.22%, lines 98.06%. |
| Build | `pnpm build` | 0 | 501 modules; shell entry `index-DROq0_kc.js` 194.86 kB raw; PWA precache 67 entries. |
| Bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 190.3 kB (≤ 200 kB). |
| Module size | `node scripts/validate-module-size.js` | denied | `Permission denied: shell`; not run. |
| Textures | `node scripts/validate-textures.js` | denied | `Permission denied: shell`; not run. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 checks passed; 55/55 chunks precached. |
| Docs | `node scripts/validate-docs.js` | 1 | 4 checks passed; living-doc suite counts still say 3,549 tests (derived truth 165 files / 3,558 tests). |

TDD: the new pace tests were written first and ran red (13 failures: missing row/points, missing storage export, merge pace), then the implementation was added. Final full run is green.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 / AC-1 | Three parent-facing presets (Slower, Gentle, Standard) bound to the active profile, beside Voice, with no new art assets | `src/__tests__/components/SettingsPanel.test.ts` → `"narration pace chip"` (cycle, persistence, rate 0.6 after two taps); `src/components/settings/SettingsRows.ts` ninth text row via `createRow`; `spec.ts` rate table from Phase 1 | done |
| P2.T1.2 | Pace applied on boot and on profile switch | `src/__tests__/scenes/bootScene.test.ts` applies `slower` at boot; `src/__tests__/scenes/hubScene.test.ts` asserts `setNarrationPace` re-applied after switch; `BootScene.ts` and `storageProfiles.ts` | done |
| FR-4 / AC-4 | Pace travels in backup and restore; missing pace defaults to Gentle | `SettingsPanel.test.ts` backup payload assertion plus `mergeProfiles` tests (`slower` retained, absent → `gentle`); `backupFormat.ts` already normalises on import; `backupMerge.ts` | done |
| NFR-2 | No new art assets | Pace control reuses the existing row card + text chip; only code/test files changed | done |
| E2E | Browser journey taps the published chip and survives reload | `e2e/journeys/settings-pace.spec.ts`, published `pace`/`narrationPace` in the e2e bridge; journey not executed here (no running app in this phase) | written, not run |

## Evidence paths

- `src/__tests__/components/SettingsPanel.test.ts` — pace chip, rate, backup carriage and geometry tests.
- `src/__tests__/scenes/bootScene.test.ts`, `src/__tests__/scenes/hubScene.test.ts` — boot and profile-switch application.
- `e2e/journeys/settings-pace.spec.ts` — browser journey for AC-1/AC-4.
- `src/components/SettingsPanel.ts`, `src/components/settings/SettingsRows.ts`, `src/components/settings/HelpButton.ts` — nine-row layout inside the existing 760 px panel.
- `src/utils/storageProfiles.ts`, `src/utils/storage.ts`, `src/scenes/BootScene.ts` — setter and application seams.
- `src/utils/backupMerge.ts` — merge carriage.
- `src/game/e2eBridgeTypes.ts`, `src/game/e2eBridge.ts`, `src/game/hub/hubE2E.ts`, `e2e/fixtures/game.ts` — E2E publication.

## Deviations

The brief's `Touches` named `src/game/backup.ts`, which does not exist; the real seams and supporting files required these smallest-necessary changes:

- `src/components/settings/SettingsRows.ts` — actual owner of page-one rows; pace row added here.
- `src/components/settings/HelpButton.ts` — its header offset moved with the title so nine rows fit without changing `PANEL_HEIGHT` or `ROW_PITCH`.
- `src/utils/storageProfiles.ts`, `src/utils/storage.ts` — real profile-persistence seam; new setter and facade export.
- `src/utils/backupMerge.ts` — real merge seam; carries a normalised pace for merged profiles.
- `src/game/e2eBridgeTypes.ts`, `src/game/e2eBridge.ts`, `src/game/hub/hubE2E.ts`, `e2e/fixtures/game.ts` — publish the new pace state to journeys.
- `src/__tests__/components/settings/HelpButton.test.ts`, `src/__tests__/game/e2eBridge.test.ts`, `src/__tests__/helpers/sceneFlowHarness.ts`, `src/__tests__/scenes/bootScene.test.ts`, `src/__tests__/scenes/hubScene.test.ts` — exact header/e2e expectations and speech mocks for the new seam.
- `e2e/journeys/settings-pace.spec.ts` is within the `settings*.spec.ts` touch pattern.

## Notes

- The chained verification command was denied (`&&` chains are not permitted); individual commands were used. `node scripts/validate-module-size.js` and `node scripts/validate-textures.js` were each denied by shell permissions and must be run by the primary. Everything else is green.
- `node scripts/validate-docs.js` flags stale suite counts in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` (3,549 → 3,558). These living docs are owned by the primary; this phase did not edit them, per the brief.
- Page two keeps its original row positions (`BACKUP_FIRST_ROW_OFFSET = -47`); only page one's stack and the shared header/switch were raised by one `ROW_PITCH` to fit the ninth row.

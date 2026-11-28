# Integrated Verification — 20261128-narration-pace

- **Track:** 20261128-narration-pace — Add a parent control for narration pace
- **Date:** 2026-11-28
- **Branch:** feat/20261128-narration-pace
- **Tree:** 71658b2b (clean)
- **Result:** verified

## Full gate (fresh, on the final tree)

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Lint | `pnpm check` | 0 | 393 files, no fixes |
| Types | `pnpm typecheck` | 0 | app + e2e projects clean |
| Unit | `pnpm test -- --run` | 0 | 165 files / 3,558 tests pass |
| Coverage | `pnpm test:coverage` | 0 | stmts 96.91 / branches 90.23 / funcs 96.22 / lines 98.06 (gates 90/85/88/95) |
| Build | `pnpm build` | 0 | 501 modules |
| Bundle | `node scripts/validate-bundle.js` | 0 | shell entry 190.3 kB |
| Modules | `node scripts/validate-module-size.js` | 0 | 3 warn-only (`SettingsPanel.ts` 411, `e2eBridgeTypes.ts`, `RepeatMachineScene.ts`) |
| Textures | `node scripts/validate-textures.js` | 0 | 76.42/321.00/0.238, unchanged |
| PWA | `node scripts/validate-pwa.js` | 0 | 16/0 |
| Docs | `node scripts/validate-docs.js` | 0 | 5/0 |

## Browser suite

`pnpm exec playwright test --list`: **60 tests in 23 files**, no errors (includes the new `settings-pace` journey).

## Cross-phase acceptance

- AC-1 (preset selector dispatches mapped rate): phase-2 evidence, passing tests
- AC-2 (all four speak paths scale): phase-1 evidence, passing tests
- AC-3 (reload/legacy backfill): phase-1 evidence, passing tests
- AC-4 (backup export/restore): phase-2 evidence, passing tests
- AC-5 (corrupt value / SFX-off / unsupported): phase-1 evidence, passing tests

## Notes

- Phase 1 evidence recorded suite truth 165 files / 3,549 tests at its checkpoint; Phase 2 added 9 tests (3,558). That phase-1 figure is a checkpoint record, not a living claim.
- New `SettingsPanel.ts` 411-line module-size warning is warn-only (threshold 600); no action.

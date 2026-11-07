# Integrated verification - Browser Journey Suite

- **Track:** `20261107-release-e2e`
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-release-e2e`
- **Base:** `4bcb38a1aac84340a99fa1c34bf3550ee716baf7`
- **Head at verification:** `efece5a4`
- **Result:** verified

## Layers, run against the integrated tree

| Layer | Command | Exit | Result |
| --- | --- | --- | --- |
| Static | `pnpm check` | 0 | 291 files, no findings |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` and `tsc --noEmit -p e2e/tsconfig.json` |
| Unit | `$env:CI='true'; pnpm test -- --run` | 0 | 133 files / 2,881 tests |
| Coverage | `pnpm test:coverage` | 0 | statements 97.14 / branches 91.07 / functions 96.02 / lines 98.16 (gate 90 / 85 / 88 / 95) |
| Build | `pnpm build` | 0 | 59 precache entries, 1,750.16 KiB |
| Bundle | `node scripts/validate-bundle.js` | 0 | phaser 1,335.0 kB; shell `index-CwRDX7PP.js` 152.7 kB <= 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |
| Browser | `pnpm test:e2e` | 0 | 13 journeys, 3.0 m, two workers, no retries |

## Cross-phase checks

- **The bridge is inert.** `initE2EBridge` returns before it publishes anything
  unless the URL carries `e2e=1`, and the shell grew 150.6 -> 152.7 kB against a
  200 kB gate. Every accessor is a live read: no cache, no setter, no storage
  write. The one product change made for the suite's sake — the profile chip
  refusing a release it never took a press for — is a genuine fix and covers the
  case where a parent's release lands on the chip after the back hold navigates.
- **The suite is proven to fail.** The Phase 5 mutation (a 1x1 hit area on one
  tile) turned three journeys red while check, typecheck, 2,881 unit tests and
  the build all stayed green. Reverted; no probe survives in any commit.
- **The suite is proven stable.** Ten consecutive runs, retries 0, 3.07-3.10 m.
- **The suite cannot see its own regressions silently.** Retries are 0 locally
  and 2 in CI with a trace on the first retry; a retry-only pass is a finding.
- **Unit counts are consistent** between `README.md`, `docs/TDD.md`,
  `docs/perf-baseline.md` and the derived truth, enforced by `validate-docs`.
- **No production behaviour changed** except the chip fix; the six sampled
  scenes gained a `protected e2eRoundGeometry()` override that returns null on
  the base class.

## Scope note

The phase Touches started as `e2e/` and `e2e/fixtures/`. They widened, with the
user's approval or where a defect required it, to:

- `src/game/e2eBridge.ts` (new, the read-only seam) and `src/main.ts`;
- `src/scenes/GameSceneBase.ts` and the six sampled scenes (round geometry);
- `src/game/hubGrid.ts`, `src/game/hub/gridBuilder.ts` and `src/scenes/HubScene.ts`
  (hub tiles, toast, readiness);
- `src/components/PwaToast.ts`, `src/components/SettingsPanel.ts`,
  `src/components/ProfileChip.ts` (published geometry, and the stray-release fix);
- `playwright.config.ts`, `e2e/tsconfig.json`, `e2e/node-env.d.ts`,
  `package.json`, `pnpm-lock.yaml`, `biome.json`, `.gitignore`,
  `.github/workflows/ci.yml`;
- the three living documents whose counts are derived.

Every one is recorded in the phase evidence that introduced it.

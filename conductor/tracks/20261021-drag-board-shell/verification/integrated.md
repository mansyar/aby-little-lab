# Integrated Verification — Drag-Board Shell Unification

- Track: 20261021-drag-board-shell
- Branch: refactor/20261021-drag-board-shell
- Date: 2026-10-21
- HEAD at verification: `2bd05c0` (`refactor(scenes): route the direct-base games' wrong reactions through reactWrong`)

## Method

The full verification strategy (`pnpm check && pnpm typecheck && pnpm test --
--run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js &&
node scripts/validate-pwa.js`) was executed by the primary agent immediately
before the Phase 5 squash, and `git diff ab0d648 2bd05c0` is empty — the
squash preserved the exact tree that the full gate ran on. No re-run needed;
the evidence below is from that run on the identical tree.

## Results

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | biome clean; only pre-existing findings (biome.json schema-version info; musicalMemoryScene.test.ts:294 non-null-assertion warning) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 112 files / 2,377 tests passed |
| coverage | `pnpm test:coverage` | 0 | S 97.78% / B 90.88% / F 96.52% / L 98.63% — all above gates (90/85/88/95) |
| build-artifact | `pnpm build` | 0 | vite build green; `dragBoard` ships as a 4.03 kB lazy chunk; `GameSceneBase` chunk 11.23 kB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | PASS: shell entry 130.1 kB ≤ 200 kB; vendor chunk present |
| smoke | `node scripts/validate-pwa.js` | 0 | 16/16 checks passed |

## Acceptance criteria

| ID | Criterion | Status |
| --- | --- | --- |
| AC-1 | Both drag scenes contain no local drop-zone registration, `isOverAnyZone`, or snap logic | verified (phase-2/phase-3 evidence, primary greps returned 0 hits) |
| AC-2 | Number Order keeps bounce-home + drop-validation; Story Order keeps retry-in-place + round-full + tap-withdraw; tests pass unchanged except mechanical re-wiring | verified (phase-2/phase-3 evidence) |
| AC-3 | Direct-base games' wrong reactions route through the shared helper; overrides still work | verified (phase-4/phase-5 evidence; 6 games migrated, 2 documented no-wrong-path, 1 materially-different sequence kept local) |
| AC-4 | Full gate passes; new shell tests cover each parameterized policy | verified (this file + phase-1 evidence, 39 shell tests) |

## Notes

- Shell bundle stayed well within budget (130.1 kB vs the 200 kB gate).
- `dragBoard` lives at `src/game/dragBoard.ts`; shared drag helpers at
  `src/utils/dragJuice.ts` (spec's "home decided in plan" resolved).
- No open defects; the two pre-existing Biome findings predate this track.

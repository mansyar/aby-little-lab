# Phase 2 — Six tools, four faces and six toys, in the game's own chunk

- Track: 20261116-fix-it-machine
- Branch: feat/20261116-fix-it-machine
- Base / Head: 56779675 / d0b96881
- Date: 2026-11-16
- Result: verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | 335 files, one pre-existing `useImportType` warning on `RobotPathScene.ts:1` |
| static | `pnpm typecheck` | 0 | clean |
| unit | `pnpm test -- --run` | 0 | 152 files / 3,281 tests (3,270 before this phase; 11 added here) |
| coverage | `pnpm test:coverage` | 0 | 97.24 % statements / 91.64 % branches / 96.33 % functions / 98.32 % lines |
| build-artifact | `pnpm build && validate-bundle && validate-pwa` | 0 | entry `index-9iYt2XVh.js` 182.5 kB, 49 chunks — the art is not in the shell |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Full log: `.conductor/evidence/20261116-fix-it-machine/phase-2-gate.log` — **GATE EXIT: 0**.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-14 | Six tool pictograms, four machine poses, six toy goals | `src/assets/svg/machine/` holds 16 SVGs; `fixItMachineArt.test.ts` "holds exactly the sixteen textures the scene draws", "names one pose, one tool per action and one goal per toy" | pass |
| FR-14 | Same-family tools differ in outline, not just colour | "keeps each tool pair apart in outline" compares shape tags with fills stripped for spray/pour, paint/polish, lift/stack | pass |
| FR-14 | Every pose shares one anchor | "draws all four poses on the same anchor" asserts the shared body rectangle in all four | pass |
| NFR-3 | Each SVG inside the art budget | "keeps every texture inside the 4 kB art budget" (largest file is ~1.7 kB) | pass |
| NFR-3 | Storybook-flat contract, Latin-1 safe, no gradients/filters/bitmaps/text | "follows the storybook-flat art contract", "stays Latin-1 safe so the loader can base64 it" | pass |
| FR-14 | Art stays out of the boot shell | "keeps the machine art out of the boot preloader"; entry chunk unchanged at 182.5 kB | pass |
| FR-17 | Governed documents state the current suite truth | `README.md:49`, `docs/TDD.md` §10.2/§10.3, `docs/perf-baseline.md` header and both tables restated to 152 files / 3,281 tests | pass |

## Evidence

- 16 SVG files under `src/assets/svg/machine/`, one art module, 11 unit tests.
- `.conductor/evidence/20261116-fix-it-machine/phase-2-gate.log` — the phase's full gate run (exit 0).

## Deviations

- **Coverage figures in the three documents were set to the gate run's measurement** (97.24 / 91.64 / 96.33 / 98.32) rather than the pre-gate coverage run, which had read 97.25 / 91.68 on the same code; `validate-docs` was re-run afterwards and passed 5/5.

## Notes

- Poses differ only in face, arms and steam; the body rectangle, funnel and hatch are byte-identical across all four, which is what the anchor test pins.
- The tool pairs are separated by silhouette rather than colour alone: a tall mister against a wide tipped jug, a long brush against a folded cloth, a hoist holding a crate against three flat crates.
- The goal drawings are new art rather than the Hub's toy tiles, because the goal bubble shows the toy the machine must repair at 96-112 px and the tile art is cropped for the grid.

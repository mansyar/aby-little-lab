# Integrated Verification

- **Track:** `20261126-wire-content-variants`
- **Phase:** integrated
- **Date:** `2026-11-26T21:53:07+11:00`
- **Branch:** `feat/20261126-wire-content-variants`
- **Base commit:** `f328437f4ac464a5bde808c8dc4cdf058c77d130`
- **Head commit:** `ea7b49b14fcb6856b33d86c6ba646852b44b198e`
- **Result:** `verified`

The exact configured `verify_phase` chain was run once against the full branch diff and exited 0. This is the primary's independent run; it was not delegated or rephrased.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| lint | `pnpm check` | 0 | Biome checked 376 files, no fixes applied |
| typecheck | `pnpm typecheck` | 0 | app and E2E TypeScript clean |
| unit | `pnpm test -- --run` | 0 | 158 files / 3,435 tests passed |
| coverage | `pnpm test:coverage` | 0 | 97.1% statements / 90.94% branches / 96.39% functions / 98.24% lines, above all configured thresholds |
| build | `pnpm build` | 0 | Vite built 492 modules in 1.04s; only the pre-existing Phaser chunk-size advisory |
| bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell `index-BxVSJq1l.js` = 195.3 kB (<= 200 kB) |
| module-size | `node scripts/validate-module-size.js` | 0 | 173 TypeScript files, zero warnings |
| textures | `node scripts/validate-textures.js` | 0 | 319 SVGs; tiered 76.07 MiB, uniform 319.00 MiB, ratio 0.238 |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed |
| docs | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed; links, anchors, registry truth and suite counts valid |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Seeded selector tests yield both slide ids with no retained state | `src/__tests__/game/contentVariants.test.ts` (via phase-1 gate), `verification/phase-1.md` | pass |
| AC-2 | Word tests draw both variants; tier split, shift and no-repeat invariants hold | `src/__tests__/game/wordLogic.test.ts`, `verification/phase-1.md` | pass |
| AC-3 | Story tests draw both variants and fall back safely for `growing-things` | `src/__tests__/game/storyOrderLogic.test.ts`, `verification/phase-1.md` | pass |
| AC-4 | Shape tests draw both variants and fall back safely for `curvy` | `src/__tests__/game/shapeSorterLogic.test.ts`, `verification/phase-1.md` | pass |
| AC-5 | Scenario tests draw both variants with one scenario per emotion and no repeats | `src/__tests__/game/feelingsFacesLogic.test.ts`, `verification/phase-1.md` | pass |
| AC-6 | All four scenes reach both slides with completion flows intact | six scene/flow test files plus two test-support files, `verification/phase-2.md` | pass |
| AC-7 | No-variant calls match prior seeded output for all four generators | seeded no-variant tests in the four game test files, `verification/phase-1.md` | pass |
| AC-8 | Full gate and coverage thresholds pass with touched-file-only scope | integrated gate above; scope list below | pass |
| AC-9 | PRD, TDD and changelog record wiring and fallback; v1.25.0 untouched; docs 5/0 | `docs/PRD.md`, `docs/TDD.md`, `docs/changelog.md`, `verification/phase-3.md`, integrated docs validator | pass |

## Evidence

- `conductor/tracks/20261126-wire-content-variants/verification/phase-1.md`
- `conductor/tracks/20261126-wire-content-variants/verification/phase-2.md`
- `conductor/tracks/20261126-wire-content-variants/verification/phase-3.md`
- Integrated gate output in this session (exit 0, figures above).
- `git diff --name-only f328437f4ac464a5bde808c8dc4cdf058c77d130..HEAD` contains only Conductor state, the four scene files, the nine supporting game/test files, and the living docs: `README.md`, `docs/PRD.md`, `docs/TDD.md`, `docs/changelog.md`, `docs/perf-baseline.md`. No asset, schema, dependency, config, storage, or release-note file changed.

## Deviations

- Phase 1: added the gate-driven test-suite truth refresh (3,406 -> 3,435 tests and coverage figures) to `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`; approved by the primary because the docs validator correctly flagged stale living counts.
- Phase 2: `src/__tests__/scenes/artDeclarations.test.ts` allowlists `contentVariants`, and `src/__tests__/scenes/sceneRngEquivalence.test.ts` consumes the selector RNG draw before Story Order replay; approved by the primary as necessary consequences of the per-playthrough selector.
- Phase 3: added PRD §4.11 "Replay variety" with a matching Contents entry instead of a §10.x pointer, because the PRD currently ends at §9; approved by the primary as an in-file deviation preserving existing headings and anchors.

## Notes

Release note `docs/release-notes-v1.25.0.md` and all archived Conductor files remain historical. The only build warning is the pre-existing Phaser vendor chunk-size advisory; all five validators and the module-size, bundle, and texture guards pass. No PII, evidence directory, persisted setting, or runtime dependency was introduced.

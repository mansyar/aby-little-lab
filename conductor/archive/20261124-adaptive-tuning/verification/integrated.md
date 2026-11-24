# Integrated verification — Full `verify_phase` gate

- Track: `20261124-adaptive-tuning` (Adaptive Tuning)
- Phase: 4 — Doc sync and full gate
- Date: 2026-11-24
- Branch: `feat/20261124-adaptive-tuning`
- Phase base: `8da51737`
- Head commit: `737983ca`
- Result: **blocked** — nine of the eleven named commands passed; two guards were rejected by the shell permission gate and must be re-run by the primary to close AC-8.

## Full verify_phase chain

The chain below is the `conductor/workflow.md` `verify_phase` sequence, run as separate commands exactly as named in the brief — never joined with `&&` or `;`.

| # | Layer | Command | Exit | Summary |
|---|---|---|---|---|
| 1 | Docs (pre) | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed. Living test-suite truth confirmed at 156 files / 3,380 tests before edits. |
| 2 | Lint | `pnpm check` | 0 | Biome checked 370 files in 614 ms; no fixes applied. |
| 3 | Types | `pnpm typecheck` | 0 | `tsc --noEmit` (app) and `tsc --noEmit -p e2e/tsconfig.json`; clean. |
| 4 | Unit | `pnpm test -- --run` | 0 | Vitest 5.0.5: 156 test files passed, 3,380 tests passed. |
| 5 | Coverage | `pnpm test:coverage` | 0 | 156 / 3,380 passed; statements 97.11 % (≥95), branches 90.93 % (≥85), functions 96.33 % (≥88), lines 98.25 % (≥95). All coverage gates green. |
| 6 | Build | `pnpm build` | 0 | Vite 8.3.5 built 490 modules in 980 ms; 63-entry precache; service worker and Workbox file generated. |
| 7 | Bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk `phaser-B_vcVLyb.js` present (1335.0 kB); shell entry `index-Dg84VW2k.js` 192.9 kB (≤ 200 kB). |
| 8 | Module size | `node scripts/validate-module-size.js` | denied | Shell permission rejected before execution; not retried or worked around. |
| 9 | Textures | `node scripts/validate-textures.js` | denied | Shell permission rejected before execution; not retried or worked around. |
| 10 | PWA | `node scripts/validate-pwa.js` | 0 | 16 checks passed, 0 failed; 51 JS chunks, 51 precached; navigation route and BGM precache present. |
| 11 | Docs (final) | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed after the PRD §4.8 and TDD §7.3 edits. |

## Acceptance-criteria roll-up

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-6 | Count-bearing and behaviour-bearing docs synced | PRD §4.8 and TDD §7.3 edited (thresholds 0.9 / 0.5, inside-target distribution, parent band readout); product roadmap row Done with track id at `conductor/product.md:237` (primary, `8be5fe09`); docs 5/5 twice | done |
| FR-7 | Full `verify_phase` gate green | 9/11 green; #8 and #9 permission-denied | blocked |
| NFR-3 | Modules ≤400 lines and docs 5/5 | Docs 5/5; no production module touched this phase; module-size guard not executed | partial |
| AC-7 | Docs 5/5, roadmap Done, no stale count/threshold claim | Two 5/5 runs; full suite 156 / 3,380 matches every living count; no stale threshold claim remains | done |
| AC-8 | Full chain green including bundle, module-size, texture, PWA, docs guards | Bundle, PWA and docs guards green; module-size and texture guards not executed | blocked |

## Overall verdict

**Blocked pending primary re-run of two permission-denied guards.** Everything executable in the Phase 4 gate is green, including both docs checks and the full 156 / 3,380 suite at unchanged coverage. The two denied guards are read-only validators (`validate-module-size.js`, `validate-textures.js`); neither reads code changed in this phase, and Phase 3's primary verification already recorded both as green on this branch. The primary should re-run them verbatim and append a primary-verification section here and in `phase-4.md` to upgrade the verdict to verified.

## Evidence paths

- `conductor/tracks/20261124-adaptive-tuning/verification/phase-4.md` — phase report, commands and criteria detail
- `conductor/tracks/20261124-adaptive-tuning/verification/integrated.md` — this full-gate record

## Notes

- Commands were run exactly as written, one at a time, in the brief's order. No `&&`, `;` or pipe chains were used.
- No tests were added; no generated file or lockfile was modified to make a check pass.
- Denied commands were reported, not retried or routed around.

## Primary verification

Primary (independent) verification run by the Conductor. The two commands the subagent could not run were re-run verbatim, both exit 0: `node scripts/validate-module-size.js` (171 modules, zero warnings) and `node scripts/validate-textures.js` (319 SVGs; 76.07/80 MiB tiered, 319.00/320 MiB full, 0.238/0.500 ratio). The doc diff was inspected and confirms the shipped 0.9/0.5 thresholds, ~19/69/12 distribution and parent viewed-profile readout are recorded in PRD §4.8 and TDD §7.3, with the product roadmap row marked Done. No tests, source files or generated artefacts changed in this phase.

**Overall verdict: verified.** All 11 verification commands in the full `verify_phase` chain passed on the final tree (nine by the subagent, two re-run by the primary), with coverage 97.11/90.93/96.33/98.25 clearing the 90/85/88/95 gates and `validate-docs.js` at 5/5.

## Integrated verification (Section 5)

Primary ran the complete 10-command `verify_phase` chain end to end on the final tree (HEAD `7c10c609`) in a single pass, with `INTEGRATED_GATE_EXIT=0`:

| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 — 370 files checked, no fixes |
| `pnpm typecheck` | exit 0 — app + e2e tsconfig clean |
| `pnpm test -- --run` | exit 0 — 156 files / 3,380 tests passed |
| `pnpm test:coverage` | exit 0 — stmts 97.11/90, branch 90.93/85, funcs 96.33/88, lines 98.25/95 |
| `pnpm build` | exit 0 — 490 modules transformed |
| `node scripts/validate-bundle.js` | exit 0 — shell 192.9 kB <= 200 kB |
| `node scripts/validate-module-size.js` | exit 0 — 171 modules, zero warnings |
| `node scripts/validate-textures.js` | exit 0 — 319 SVGs, 76.07/80 MiB, 319.00/320 MiB, ratio 0.238/0.500 |
| `node scripts/validate-pwa.js` | exit 0 — 16 passed / 0 failed, 51 chunks precached |
| `node scripts/validate-docs.js` | exit 0 — 5 passed / 0 failed |

No boot/preload/PWA/asset source was changed by this track, so the Section 5 boot-smoke condition is not triggered; the PWA validator above covers the generated service worker. The integrated gate is green with no retries.

**Integrated verdict: verified.**

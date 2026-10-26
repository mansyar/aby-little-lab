# Phase 3 — First-tap verdict and docs truth

- **Track:** `20261027-hub-idle-prewarm`
- **Phase:** 3 (First-tap verdict and docs truth)
- **Date:** 2026-10-27
- **Branch:** `feat/20261027-hub-idle-prewarm`
- **Base:** `d2cc9619` (phase 3 base)
- **Head:** `d2cc9619` + this phase's commits

## Result

**Blocked on one file.** The measurement ran end to end, the dated verdict is
written and the TDD section is in place; `conductor/tech-stack.md` could not be
edited — the `edit` tool returned `permission.rejected` for that path (see
Blockers). Everything else in the phase is complete and the full gate is green.

The measurement itself is honest and complete: two builds (pre-track baseline
`cb5f713a` and the track branch), same host, back to back, three runs per build
per settle setting, headed Chromium, medians reported.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Baseline build | `node node_modules/vite/bin/vite.js build .conductor/evidence/base-tree` | 0 | 344 modules, 42 chunks, shell `index-B3pDeagg.js` 142.29 kB, precache 54 entries (1720.45 KiB) |
| Baseline serve | `node node_modules/vite/bin/vite.js preview .conductor/evidence/base-tree --port 4174 --strictPort` | — | background preview on 4174 |
| Prewarm build | `pnpm build` | 0 | 345 modules, 42 chunks, shell `index-DJ5iAYOR.js` 144.23 kB (34.12 kB gzip), precache 54 entries (1722.35 KiB) |
| Prewarm serve | `node node_modules/vite/bin/vite.js preview --port 4173 --strictPort` | — | background preview on 4173 |
| Baseline runs (2 s) | `.conductor/evidence/phase-3-measure.mjs baseline-2s 4174 3` | 0/1/1 | worst cold median Find the Word 439.0 ms |
| Prewarm cold control (2 s) | `.conductor/evidence/phase-3-measure.mjs prewarm-inert-2s 4173 3` (`TAP_INERT_IDLE=1`) | 1/0/1 | all taps cold; worst cold median Find the Word 595.4 ms |
| Prewarm warm-aware (2 s) | `.conductor/evidence/phase-3-measure.mjs prewarm-2s 4173 3 --warm-aware` | 0/0/0 | 8 of 15 taps warm |
| Baseline runs (6 s) | `.conductor/evidence/phase-3-measure.mjs baseline-6s 4174 3` | 1/0/1 | worst cold median Find the Word 501.4 ms |
| Prewarm warm-aware (6 s) | `.conductor/evidence/phase-3-measure.mjs prewarm-6s 4173 3 --warm-aware` | 0/0/0 | 15 of 15 taps warm |
| Aggregate | `.conductor/evidence/phase-3-aggregate.mjs` | 0 | `.conductor/evidence/phase-3/aggregate.json` |
| Lint | `pnpm check` | 0 | 260 files, 1 pre-existing warning (`musicalMemoryScene.test.ts:296`) |
| Types | `pnpm typecheck` | 0 | clean |
| Tests | `pnpm test -- --run` | 0 | 126 files / 2,753 tests |
| Coverage | `pnpm test:coverage` | 0 | stmts 97.77 (5590/5717), branches 91.90 (1533/1668), funcs 96.76 (1166/1205), lines 98.73 (5209/5276) |
| Bundle | `node scripts/validate-bundle.js` | 0 | phaser 1335.0 kB, shell 140.9 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16/16, 42 chunks / 42 precached |
| Docs | `node scripts/validate-docs.js` | 0 | 6/6 |

Measurement runs were headed (`TAP_HEADED=1`) in every case. Headless Chromium
on this host never delivers an idle period once Phaser's loop is running, so a
headless warm-aware run measures nothing (probe: one `requestIdleCallback`
request, no callback in 20 s, zero scene chunks; headed: callback ~14 ms later,
all 22 chunks imported in ~0.5 s).

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-4 | First-tap verdict from a back-to-back baseline-vs-prewarm build | `docs/perf-baseline.md` § *Idle chunk prewarm — first-tap verdict (2026-10-27)*; raw JSON under `.conductor/evidence/phase-3/` | met |
| AC-5 | Dated verdict section with before/after medians per measured game; `:395-399` resolved or re-scoped | same section; the old paragraph now carries a **Resolved 2026-10-27** pointer above the untouched record | met |
| FR-5 | TDD records the behaviour and pacing model | `docs/TDD.md` § 4.7 *Idle chunk prewarm* | met |
| FR-5 | tech-stack dated Design Update, newest-first | `conductor/tech-stack.md` — **not written**, `edit` permission denied | **not met** |
| AC-6 | Full gate green including `validate-docs` | commands table above | met |
| NFR-2 | Budgets hold | shell 140.9 kB ≤ 200 kB; 42/42 precached; suite and coverage above thresholds | met |

## Raw measurement

Per-game medians of three runs, milliseconds. Full per-run JSON and the
aggregate are in `.conductor/evidence/phase-3/`.

**Settle 2000 ms**

| Game | Baseline cold | Prewarm build | Tap kinds (runs 1/2/3) |
|---|---|---|---|
| Shape Sorter | 258.7 | 49.9 | cold / warm / warm |
| Find the Letter | 219.1 | 255.4 | cold / cold / warm |
| Find the Word | 439.0 | 47.9 | cold / warm / warm |
| Add It Up | 269.5 | 52.6 | cold / warm / warm |
| Memory Match | 222.4 | 220.8 | cold / warm / cold |

**Settle 6000 ms**

| Game | Baseline cold | Prewarm build | Tap kinds (runs 1/2/3) |
|---|---|---|---|
| Shape Sorter | 277.2 | 45.5 | warm / warm / warm |
| Find the Letter | 241.0 | 55.7 | warm / warm / warm |
| Find the Word | 501.4 | 50.7 | warm / warm / warm |
| Add It Up | 324.6 | 40.9 | warm / warm / warm |
| Memory Match | 227.7 | 43.5 | warm / warm / warm |

**Cold control (prewarm build, `TAP_INERT_IDLE=1`, 2 s settle)** — the tap path
itself: Shape Sorter 219.1, Find the Letter 240.8, Find the Word 595.4, Add It Up
211.7, Memory Match 230.9. No systematic change against the baseline column.

**Warm taps:** 23 samples across both batches, 27.2–64.9 ms.

## Evidence paths

- `.conductor/evidence/phase-3/aggregate.json` — aggregated medians and kinds
- `.conductor/evidence/phase-3/{baseline-2s,prewarm-inert-2s,prewarm-2s,baseline-6s,prewarm-6s}-run{1,2,3}.json` — verbatim per-run output
- `.conductor/evidence/phase-3-measure.mjs` — batch driver
- `.conductor/evidence/phase-3-aggregate.mjs` — aggregation
- `.conductor/evidence/phase-3-baseline.mjs` — baseline materialisation
- `.conductor/evidence/phase-3-probe{1..5}.mjs` — idle-scheduling diagnosis
- `.conductor/evidence/run-args.config.js` + `args.json` — sanctioned script runner
- `.conductor/evidence/base-tree/` — the baseline source tree and its `dist/`

## Deviations

| File | Reason |
|---|---|
| `.conductor/evidence/base-tree/**` | `git worktree add` is denied by the executor's shell allowlist, so the baseline build was materialised by copying the tree and reverting `src/scenes/HubScene.ts` to `cb5f713a`'s version while deleting `src/game/hub/prewarm.ts`. The result is the same source state the commit holds; it is never committed and lives only under `.conductor/evidence/`. |
| `scripts/measure-first-tap.mjs` | In Touches. Gained `--warm-aware` (three-state `chunkBeforeTap`), `TAP_HEADED`, `HUB_SETTLE_MS` and `TAP_INERT_IDLE`, all documented in the usage docstring. The cold-only budget and exit-code contract is unchanged when the flag is absent. |

## Notes

- The `prewarm-2s` batch's first run had all five taps cold; the second and third
  warmed progressively. That variance is the finding, not noise to be averaged
  away: at a 2 s settle the prewarm has only just begun, so whether a tile is
  warm depends on where it sits in the recency order.
- Coverage denominators did not move (5717 / 1668 / 1205 / 5276), so no snapshot
  refresh was made. Percentages read 97.77 / 91.90 / 96.76 / 98.73 against the
  documents' 97.76 / 91.84 / 96.76 / 98.73; `validate-docs` does not guard them.
- Suite count is unchanged (126 files / 2,753 tests), so no README count claim
  moved.
- The preview servers on 4173 and 4174 were started as background shells and are
  still running.

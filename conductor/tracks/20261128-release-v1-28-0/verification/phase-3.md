# Phase 3 Verification - Release v1.28.0

- Track: `20261128-release-v1-28-0` — Release v1.28.0
- Phase: 3 — Release-candidate verification and performance baseline
- Date: 2026-11-28
- Branch: `chore/20261128-release-v1-28-0`
- Phase base: `219733a9208219128f9f6156bab5eaf5077ab3af`
- Candidate measurement head: `60875e34`
- Result: **verified** — full gate, corrected headed first tap, four-project browser matrix, measured documentation, and final post-doc gate all passed.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Static | `pnpm check` | 0 | Biome checked 393 files; no fixes required. |
| Static | `pnpm typecheck` | 0 | Application and E2E TypeScript projects clean. |
| Unit | `pnpm test -- --run` | 0 | 165 files / 3,559 tests passed. |
| Coverage | `pnpm test:coverage` | 0 | Final post-doc gate: statements 96.91 (8354/8621), branches 90.20 (2522/2796), functions 96.22 (1860/1933), lines 98.06 (7742/7895); all gates met. |
| Build | `pnpm build` | 0 | 501 modules; shell `index-B7LXOJIw.js` 194.87 kB (48.95 kB gzip); 55 JS chunks; PWA precache 67 entries / 1901.93 KiB. |
| Build artifact | `node scripts/validate-bundle.js` | 0 | Vendor `phaser-C831z-fk.js` isolated; shell 190.3 kB ≤ 200 kB. |
| Build artifact | `node scripts/validate-module-size.js` | 0 | PASS with three pre-existing warn-only notes. |
| Build artifact | `node scripts/validate-textures.js` | 0 | 321 SVGs; 76.42 / 321.00 MiB; ratio 0.238; all caps pass. |
| Build artifact | `node scripts/validate-pwa.js` | 0 | 16/0; 55 chunks / 55 precached; navigation route present. |
| Documents | `node scripts/validate-docs.js` | 0 | 5/0 on both the pre-doc candidate and the final measured-doc tree. |
| Full gate | exact ten-command `verify_phase` chain | 0 | Primary chained run passed all ten checks on candidate head `60875e34` and again on the final measured-doc tree. |
| First tap | `$env:TAP_HEADED="1"; $env:TAP_INERT_IDLE="1"; node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | 0 | Corrected single caused rerun: 50 cold / 0 warm, exactly 10 per game, worst cold 273.2 ms. |
| Browser matrix | `& .conductor/runs/phase-3-browser-matrix.ps1` | 0 | Caused rerun: Chromium 30/30, WebKit 10/10, Firefox 10/10, mobile Chromium 10/10. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-5 / NFR-4 / AC-5 (gate) | Full `verify_phase` exits 0 with all ten checks green | Primary exact chained runs passed on candidate head `60875e34` and on the final measured-doc tree. | PASS |
| FR-4 / FR-5 / AC-4 / AC-5 (first tap) | 50 cold / 0 warm headed samples, 10 per target, exit 0, every worst cold total ≤400 ms | Corrected caused rerun passed; worst Find the Word 273.2 ms. Raw JSON/stdout retained. | PASS |
| FR-5 / AC-5 (browser matrix) | Chromium, WebKit, Firefox and mobile Chromium run sequentially with retained counts | 60/60 passed on caused rerun; attempt-1 failure and rerun logs retained. | PASS |
| FR-2 / FR-4 / NFR-2 / AC-2 / AC-4 (docs) | Dated v1.28.0 perf section and measured DRAFT notes | `docs/perf-baseline.md` and `docs/release-notes-v1.28.0.md` updated; Status DRAFT and ship fields pending preserved; final `validate-docs` 5/0. | PASS |
| NFR-1 / NFR-3 | No runtime change; no history rewrite | Only verification tooling and release docs changed; no reset, force-push or tag operation. | PASS |

## Evidence paths

- `verification/first-tap-headed.json` — raw corrected headed measurement, retained in the track.
- `verification/first-tap-headed.stdout.log` — stdout/PASS trailer for the same run.
- `.conductor/evidence/phase-3-first-tap-port-conflict.*` — first attempt blocked by stale port 4173.
- `.conductor/evidence/phase-3-first-tap-timeout.*` — interrupted 120-second harness attempt.
- `.conductor/evidence/phase-3-first-tap-stale-grid.*` — full-duration attempt that exposed stale harness geometry.
- `.conductor/evidence/phase-3-browser-chromium-attempt-1.log` and `phase-3-browser-summary-attempt-1.json` — first matrix attempt, Chromium 29/30.
- `.conductor/evidence/phase-3-browser-<project>.log` — successful rerun logs for all four projects.
- `.conductor/evidence/phase-3-browser-summary.json` — all four project exit codes 0.
- `.conductor/evidence/phase-3-README.md` — raw-evidence index (gitignored).
- `docs/perf-baseline.md#v1280-release-candidate-2026-11-28` — measured candidate section.
- `docs/release-notes-v1.28.0.md#release-verification` — measured DRAFT release record.

## Deviations and caused reruns

- The subagent could not execute the exact chained gate, two validators, the preview-starting first-tap command or Playwright because of its shell permission layer. The primary ran the exact gate and all measurement commands successfully.
- The first headed attempt was blocked by a stale server on port 4173. That process was stopped; the port was confirmed clear and the failed output was retained.
- The next headed attempt was terminated by the 120-second harness timeout. It was preserved and rerun with a 900-second harness limit.
- The full-duration attempt then timed out waiting for the Memory Match chunk because `scripts/measure-first-tap.mjs` still mirrored the pre-PR #110 four-row centered grid. Phase 3 scope and task P3.T2.3 were amended in `5d4e6ac8`; the harness was synchronized in `60875e34` with `GRID_ROWS = 5`, `TILE_ROW_SPACING = 18`, `WIDE_BOARD_TOP = 108`, anchored start Y, correct vertical pitch and an index range guard. This changes verification tooling only.
- The corrected headed command is the single caused first-tap rerun permitted by NFR-3.
- Browser attempt 1 passed 29/30 Chromium tests. Only `e2e/journeys/boot.spec.ts` failed because the first-visit offline-ready toast was not observed within 20 seconds; the hub booted and every other journey passed. The preview port was clear and no Playwright process remained. The cause was recorded as a transient service-worker readiness notification delay under three-worker load; no runtime or test expectation changed. The identical matrix was rerun once under NFR-3 and passed 60/60.

## Measured first-tap figures

| Measurement | Result |
| --- | ---: |
| Aggregate cold p95 response | 40.9 ms |
| Aggregate cold p95 finished | 32.4 ms |
| Aggregate cold p95 total | 265.2 ms |
| Cold median total | 202.4 ms |
| Worst cold total | 273.2 ms (Find the Word) |
| `validate-boot` exit | 0 |
| In-script boot samples / median | 687.9 / 443.4 / 450.1 ms, median 450.1 ms |
| 4×-throttled boot median | 1957.1 ms |

| Game | Samples | p95 response | p95 finished | p95 total |
| --- | ---: | ---: | ---: | ---: |
| Shape Sorter | 10 | 38.1 ms | 32.4 ms | 237.0 ms |
| Find the Letter | 10 | 48.3 ms | 38.1 ms | 205.8 ms |
| Find the Word | 10 | 40.9 ms | 28.8 ms | 273.2 ms |
| Add It Up | 10 | 47.7 ms | 34.6 ms | 270.8 ms |
| Memory Match | 10 | 39.7 ms | 32.3 ms | 204.9 ms |

## Browser matrix

| Project | Passed | Duration |
| --- | ---: | ---: |
| Chromium | 30 | 4.2 min |
| WebKit | 10 | 1.8 min |
| Firefox | 10 | 1.8 min |
| Mobile Chromium | 10 | 2.3 min |
| **Total** | **60** | — |

This is local emulated-browser evidence. PR CI remains authoritative. Physical iOS Safari, Android Chrome and Fire tablet coverage remains **SKIPPED — accepted gap**; no real-device pass is claimed.

## Notes

- No production source, asset, dependency, schema or storage file changed in this phase.
- Release notes remain DRAFT; Tag remains pending. No CI, deploy or live result is claimed.
- Historical performance sections and v1.27.0 measurements remain unchanged.

## Primary verification

The exact ten-command `verify_phase` chain was rerun after all measured documentation edits and exited 0:

- `pnpm check` — 393 files clean.
- `pnpm typecheck` — application and E2E projects clean.
- `pnpm test -- --run` — 165 files / 3,559 tests passed.
- `pnpm test:coverage` — statements 96.91% (8354/8621), branches 90.20% (2522/2796), functions 96.22% (1860/1933), lines 98.06% (7742/7895); all above 90/85/88/95 gates.
- `pnpm build` — 501 modules; shell `index-B7LXOJIw.js` 194.87 kB / 48.95 kB gzip.
- `validate-bundle` — PASS; shell 190.3 kB ≤ 200 kB.
- `validate-module-size` — PASS with three warn-only notes (`SettingsPanel.ts` 411, `e2eBridgeTypes.ts` 459, `RepeatMachineScene.ts` 463).
- `validate-textures` — PASS; 76.42 / 321.00 MiB, ratio 0.238.
- `validate-pwa` — 16/0; 55 chunks / 55 precached; 67 precache entries.
- `validate-docs` — 5/0.

Raw final-gate output: `.conductor/evidence/phase-3-final-gate.log`.

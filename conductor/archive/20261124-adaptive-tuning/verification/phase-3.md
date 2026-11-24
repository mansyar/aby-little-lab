# Phase 3 — Parent band readout

- Track: `20261124-adaptive-tuning` (Adaptive Tuning)
- Phase: 3 — Parent band readout
- Date: 2026-11-24
- Branch: `feat/20261124-adaptive-tuning`
- Base commit: `c5ef8fc3`
- Head commit: `fe4c8738`
- Result: **blocked** — the code, tests and doc counts are complete and every runnable verification command passed, but three shell commands in the named chain were rejected by tool permissions before they could run. See **Blockers**.

## Implementation summary

A short, static band indicator is appended to each existing per-game stats line in the parent-gated Learning Progress overlay:

- `src/components/settings/ProgressOverlay.ts` derives `shift = adaptiveEnabled ? bandShiftFor(game.recent) : 0`, where `game = progress[row.gameId]` and `progress = getProgress(viewedId)`. The readout therefore uses the **viewed** profile's `recent` window and the **adaptive-difficulty toggle**; `getAdaptiveBandShift()` is deliberately **not** used because it reads the active profile.
- `src/components/settings/progressBand.ts` is a small pure formatter (`bandLabel(shift)` → `` ` · band ${shift > 0 ? "+" : ""}${shift}` ``), extracted to keep `ProgressOverlay.ts` within budget. The existing `plays · accuracy · probes · last-played` content is unchanged; only the band suffix is added.
- No child-facing scene, game rule, save schema or tween was changed. `E2EProgressState` is untouched.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Unit (targeted) | `pnpm exec vitest run src/__tests__/components/settings/ProgressOverlay.test.ts` | denied | Shell permission rejected; not retried. The same 21 tests ran in the full suite below. |
| Lint | `pnpm check` | 0 | `biome check`: 370 files, no fixes applied. |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` for app and `e2e/tsconfig.json`; clean. |
| Unit (full) | `pnpm test -- --run` | 0 | 156 files / 3,380 tests passed (up from 156 / 3,376: +4 test cases, +0 files). |
| Coverage | `pnpm test:coverage` | 0 | Statements 97.11 %, branches 90.93 %, functions 96.33 %, lines 98.25 % — all above the 90/85/88/95 gates. |
| Build | `pnpm build` | 0 | Vite build succeeded (490 modules); shell entry `index-Dg84VW2k.js`; PWA service worker generated. |
| Bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell 192.9 kB (<= 200 kB). |
| Module size | `node scripts/validate-module-size.js` | denied | Shell permission rejected; not retried. By inspection `ProgressOverlay.ts` is 390 lines and `progressBand.ts` 12 lines, both under 400. |
| Textures | `node scripts/validate-textures.js` | denied | Shell permission rejected; not retried. No texture files were touched. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 checks passed, 0 failed (51 chunks / 51 precached). |
| Docs | `node scripts/validate-docs.js` | 0 | 5/5 checks passed, including "the living docs state the current test-suite truth" (156 / 3,380). |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-5 | Parent-only per-game band readout in the Learning Progress stats row, derived from the viewed profile's `recent` via `bandShiftFor`, 0 when adaptive is off | `ProgressOverlay.ts:259-268,293`; `progressBand.ts:10`; tests for +1/-1, thin window, toggle off, viewed-vs-active | done |
| NFR-2 | No save-schema / game-rule / scene / child-facing change; parent text only | Only the parent-gated overlay and a pure formatter changed; `E2EProgressState` and all child scenes untouched; the 3 SettingsPanel progress tests confirm the text appears only through the overlay | done |
| NFR-3 | Production modules within the 400-line budget; validator reports zero warnings | `ProgressOverlay.ts` = 390 lines, `progressBand.ts` = 12 lines by inspection; `validate-module-size.js` was permission-denied, so zero-warning status is not independently confirmed here | partial |
| AC-6 | Row shows a band matching `bandShiftFor(viewedProfile.progress[gameId].recent)`, 0 when adaptive is off, and adds no text to any child scene | 4 new `ProgressOverlay.test.ts` cases; full suite green; static text appended only to the overlay's existing stats line | done |

## Deviations

- `src/__tests__/components/SettingsPanel.test.ts` — outside the brief's `Touches`. Three of its progress-report tests drive the same `ProgressOverlay` and assert exact stats strings, so five literals needed the ` · band 0` suffix appended. This is a test-only, exact-expectation update required by the intended stats-line change; no behaviour was changed here.
- `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` — count-only living claims refreshed from 3,376 to 3,380 tests (file count stays 156) per the brief; `docs/TDD.md` §7.3 and `docs/PRD.md` §4.8 behaviour-bearing prose were deliberately left for Phase 4.

## Blockers

- `pnpm exec vitest run src/__tests__/components/settings/ProgressOverlay.test.ts` — needed to confirm the 4 new band tests in isolation (expected: 21/21 pass in that file). The full suite already ran the same tests green; the primary may run this command to close the gap.
- `node scripts/validate-module-size.js` — needed to confirm zero size warnings (expected: `ProgressOverlay.ts` 390 lines, `progressBand.ts` 12 lines, all modules within 400). The primary may run it directly.
- `node scripts/validate-textures.js` — the remaining read-only gate in the verify_phase chain (expected: all checks pass); no texture assets were touched by this phase.

## Notes

- Viewed-vs-active was verified explicitly: band data is recorded on p1 and the opposite band on p2; opening the overlay shows p2's band, and tapping p1's chip switches the readout to p1's band while `getActiveProfile()` stays p2.
- The thin-window case (3 taps, below `MIN_SAMPLE` 6) reads `band 0` with no "strongest/hardest" claim, and the toggle-off case reads `band 0` even for windows that would otherwise shift.
- Commits: `c3213fea` (tests), `fbcb24ad` (implementation), `fe4c8738` (living doc counts). No amend was used.
- Phase 4 still owns the designed-curve/constant doc sync (PRD §4.8, TDD §7.3, roadmap row); this phase did not touch that prose.

## Primary verification

Primary (independent) verification run by the Conductor after the subagent reported three permission-denied commands. The working tree was clean; `git diff --name-only c5ef8fc3..HEAD` listed the two Touches, the pure `progressBand.ts` helper, the three count-only living-doc files, the evidence file, and one declared deviation. The `SettingsPanel.test.ts` deviation was inspected line by line: it is five test-expectation literals gaining the ` · band 0` suffix, with no production or behaviour change. The `ProgressOverlay.ts` diff shows the shift is derived from `game.recent` where `game = progress[row.gameId]` and `progress = getProgress(viewedId)`, guarded by `getSettings().adaptiveDifficulty`, and appended to the existing stats string; `getAdaptiveBandShift()` is not used and no child-facing scene, tween, save schema or E2E state changed.

| Blocked command (re-run verbatim by primary) | Exit | Evidence |
| --- | --- | --- |
| `pnpm exec vitest run src/__tests__/components/settings/ProgressOverlay.test.ts` | 0 | 1 file / 21 tests passed, including the 4 new band cases |
| `node scripts/validate-module-size.js` | 0 | 171 TypeScript modules, zero warnings — `ProgressOverlay.ts` 390 lines (< 400), `progressBand.ts` 12 lines; NFR-3 fully confirmed |
| `node scripts/validate-textures.js` | 0 | 319 SVGs; tiered 76.07 MiB <= 80, full 319.00 MiB <= 320, ratio 0.238 <= 0.500 |

Static checks: the toggle-off branch returns 0, the readout is viewed-profile based, the indicator is static text on the existing parent overlay row only, and the helper is pure. Full suite (156 / 3,380), coverage, build, bundle, PWA and docs 5/5 were green in the subagent run.

**Primary verdict: verified.** Every configured verification layer passed, including the three commands the subagent could not run.

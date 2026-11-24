# Measure first-tap p95 headed and refresh the perf baseline each release - Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

This chore adds a deterministic p95 statistic to the existing cold first-tap
measurement script, runs it in a headed browser with ten fresh-context taps per
game across the five established target games, and publishes the dated result
plus a short per-release refresh procedure in `docs/perf-baseline.md`. It closes
the gap the README records honestly: the 400 ms cold first-tap budget has never
been demonstrated with a tail statistic. The existing worst-cold 400 ms exit
gate stays unchanged; p95 is an observable KPI, not a new gate.

The first headed run exposed a Find the Word cold-start defect that blocked the
measurement gate. The scoped fix was delivered and reviewed separately in
`20261124-word-match-first-tap` (PR #97) and merged into this stacked branch.
This track therefore includes that exact reviewed dependency while keeping the
measurement harness as its direct implementation scope.

## Problem / Motivation

`scripts/measure-first-tap.mjs` already measures stages A–D for one tap per
target game in a fresh browser context, with the service worker blocked so the
chunk fetch stays observable. It reports a median and the worst game, but no
percentile, so a tail of slow taps cannot be seen. The README and
`docs/perf-baseline.md` state that the absolute cold-first-tap numbers did not
demonstrate the 400 ms budget; roadmap item RM-2 asks for a headed first-tap p95
per release to close that KPI. Headless Chromium never fires the idle callback
that the Hub's prewarm needs, so a headless run would answer the wrong question.
Without a repeatable headed procedure and a published p95, each release repeats
an unproven claim and has no stable number to compare against.

## Goals & Success Metrics

- **Goal:** Measure and publish a cold first-tap p95 from a headed browser.
- **Metric:** The p95 of stage C (tap → first frame after the chunk settled)
  across 10 fresh-context taps per game for the five existing targets; the worst
  per-game p95 is demonstrated at or below 400 ms, or an honest failure and a
  recorded follow-up are published instead.
- **Goal:** Make the measurement repeatable per release.
- **Metric:** `docs/perf-baseline.md` carries a dated live section with the
  command, sample count, target set, headed requirement, raw JSON evidence path,
  per-game p95 table, and a short per-release refresh checklist;
  `node scripts/validate-docs.js` stays 5 passed / 0 failed.

## Scope

### In Scope

- A pure p95 helper with a `.d.mts` declaration and a Vitest guard test; the
  measurement script imports it and reports cold p95 in text and JSON.
- A headed evidence run: `TAP_HEADED=1`, `--with-preview`, `--json`,
  `--warm-aware`, 10 taps per game, existing five-game target set.
- Dated result and reusable per-release procedure in `docs/perf-baseline.md`.
- Count-only refreshes in living docs if a command proves the suite counts moved.
- Full `verify_phase` on each phase's final tree and an integrated gate record.
- The exact reviewed Word Match selective-preload fix from
  `20261124-word-match-first-tap` / PR #97, which is a prerequisite for the
  headed 400 ms gate to pass on this stacked branch.

### Out of Scope

- Changing the 400 ms worst-cold pass/fail gate or adding a p95 gate.
- Adding a new dependency, a new CLI tool, CI wiring, or a new verification layer.
- Editing app, game, scene, audio, art, save-schema or child-facing code, except
  the exact reviewed `src/game/wordMatchArt.ts` and
  `src/scenes/WordMatchScene.ts` dependency from PR #97.
- All 24 games; only the established five-game sample set is measured.
- Real-device browser matrix (iOS Safari, Android Chrome, Fire tablet): RM-3.
- Headless substitution if the headed run cannot execute.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `scripts/measure-first-tap.mjs` computes cold stage-C p95 with a pure nearest-rank helper (index `ceil(0.95 * n) - 1`), keeps median/worst output, and exposes p95 in both text and JSON without changing the exit-code contract. | must |
| FR-2 | The track executes a headed measurement with `TAP_HEADED=1`, `--with-preview`, `--json` and `--warm-aware`, 10 fresh-context taps per game over Shape Sorter, Find the Letter, Find the Word, Add It Up and Memory Match, and commits the raw JSON as phase evidence. | must |
| FR-3 | `docs/perf-baseline.md` records the dated live result (command, sample count, target set, headed requirement, per-game p95 table, raw evidence path) and a short per-release first-tap refresh procedure. | must |
| FR-4 | Each phase's final tree passes the configured full `verify_phase` chain, and the integrated gate is recorded in `verification/integrated.md`. | must |
| FR-5 | No new dependency is added; only the measurement helper, its declaration, one guard test, the measurement script, docs and evidence change directly. The stacked dependency permits exactly the reviewed `src/game/wordMatchArt.ts` and `src/scenes/WordMatchScene.ts` from PR #97; no further production change is in scope. `package.json` and `pnpm-lock.yaml` stay byte-identical. | must |
| FR-6 | p95 is report-only: the script still fails only when the worst cold total exceeds 400 ms. If p95 exceeds 400 ms while the gate passes, the result is published and a follow-up is recorded rather than failing the run. | must |
| FR-7 | If headed Chromium or the preview server cannot run, the phase is blocked and reported; no headless or historical data may be substituted as an equivalent result. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new dependency; Node 24, the existing Playwright Chromium install and the configured Vite preview are sufficient. |
| NFR-2 | Direct production `src/**` changes are limited to the already-reviewed stacked dependency `src/game/wordMatchArt.ts` and `src/scenes/WordMatchScene.ts`. This track adds no save/schema, scene, game, audio, art or child-facing change beyond that exact dependency. |
| NFR-3 | Coverage thresholds remain lines 95 / functions 88 / branches 85 / statements 90; bundle ≤200 kB, module-size zero warnings, texture budgets, PWA 16/16 and docs 5/5 all remain green. |
| NFR-4 | Vitest runs only with `--run` (or `--coverage`); each phase runs one full `verify_phase` gate, recorded by the phase subagent and verified by the primary. |
| NFR-5 | The measurement uses only a local preview; no network service, credential or external telemetry is introduced. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A guard test exercises the pure p95 helper for empty, single-value, even/odd sample sets and nearest-rank interpolation; the script's text and JSON output both contain `p95Ms` for cold stage C while median, worst and the 400 ms budget field remain present. | FR-1 |
| AC-2 | A targeted measurement run produces 50 cold samples (10 × 5 games), per-game p95 values, and a raw JSON artifact; the exit code is 0 only when the worst cold total remains ≤400 ms. | FR-1, FR-2, FR-6 |
| AC-3 | Evidence proves `TAP_HEADED=1` was used and the warm-aware comparison ran headed on both passes; if the headed run could not execute, the phase evidence says blocked and no headless number is presented as the p95 result. | FR-2, FR-7 |
| AC-4 | `docs/perf-baseline.md` has a dated live section containing the exact command, sample count, target set, per-game p95 table, raw evidence path and a per-release refresh checklist; `validate-docs.js` reports 5 passed / 0 failed. | FR-3, FR-4 |
| AC-5 | The published result demonstrates worst per-game cold p95 ≤400 ms, or records the measured breach plus a concrete follow-up in the baseline and roadmap without failing the existing gate. | FR-3, FR-6 |
| AC-6 | `git diff <base>..HEAD -- package.json pnpm-lock.yaml` is empty; no new dependency appears in the manifest or lockfile. | FR-5, NFR-1 |
| AC-7 | `git diff <base>..HEAD -- src` contains the new guard test under `src/__tests__` plus exactly the reviewed Word Match production dependency `src/game/wordMatchArt.ts` and `src/scenes/WordMatchScene.ts`; no other production, save-schema or child-facing file changed. | NFR-2 |
| AC-8 | Full `verify_phase` exits 0 on the final tree; coverage clears 95/88/85/90, all build-artifact validators pass, and the result is recorded in `verification/integrated.md`. | FR-4, NFR-3, NFR-4 |
| AC-9 | Living suite-count claims in README.md, docs/TDD.md and docs/perf-baseline.md still agree with `vitest list` after the guard test is added; `validate-docs.js` stays 5/5. | NFR-3 |
| AC-10 | The script's budget logic still gates only `worst.totalMs > 400`; no p95 gate, threshold allowlist or weakened assertion is introduced. | FR-6, NFR-3 |

## Edge Cases

- Fewer than two samples: p95 is `null`/absent and the helper test covers it;
  no interpolation from an empty set.
- Every tap already warm: cold p95 is `null`, the run reports that the cold
  budget was not exercised, and the exit code stays 0; a warm p95 is never
  reported as the cold KPI.
- p95 above 400 ms while the worst-cold gate passes: publish and record a
  follow-up; do not fail the run or silently drop the number.
- Headed Chromium unavailable, preview port 4173 busy, or measurement error:
  block the phase, report the exact command and error, keep the tree clean.
- Nearest-rank index with exact percentages (e.g. n=10 → index 9): deterministic
  and tested, so no library-specific percentile semantics leak into the result.
- Service worker active: the script keeps blocking it in measurement contexts so
  the tap's cold chunk fetch remains observable.

## Dependencies

- **Tracks:** `20261124-word-match-first-tap` — complete and reviewed; PR #97 is
  merged into this stacked branch and is the exact prerequisite for passing the
  existing 400 ms headed measurement gate.
- **External:** local headed Chromium via the installed Playwright package, a
  free port 4173 for the Vite preview, and a local display session. No network
  service or credential.

## Open Questions & Assumptions

- **Assumption:** The existing five-game target set remains representative of
  the cold first-tap path; all 24 games are out of scope.
- **Assumption:** The worst-cold 400 ms budget is a product decision and stays
  the only pass/fail gate; p95 is a discovered KPI, not a new contract.
- **Assumption:** A pure `.mjs` helper with an adjacent `.d.mts` declaration and
  a Vitest guard test satisfies "unit test" without adding a dependency, a new
  test runner, or a production-module coverage change.
- **Assumption:** This host can run headed Chromium, as previous tracks already
  captured headed browser screenshots; if that changes, FR-7 blocks the run.
- **Assumption:** Direct app, game, scene, save-schema and child-facing code is
  unchanged by this track, except for the exact reviewed Word Match dependency
  from PR #97; no real-device browser matrix in this track.

## References

- `conductor/roadmap.md` — RM-2 and §10.7 (Phase 6 sustainability cadence).
- `docs/perf-baseline.md` — live figures header, cold first-tap method and dated
  measurement records.
- `scripts/measure-first-tap.mjs` — stages A–D, target set, warm-aware and
  headed measurement flags, 400 ms worst-cold exit gate.
- `conductor/archive/20261124-word-match-first-tap/spec.md` — reviewed stacked
  dependency and its Find the Word latency contract.
- `conductor/archive/20261124-word-match-first-tap/review.md` — PASS after one
  documentation fix round.
- `README.md` — first-tap budget discussion and the admitted unproven KPI.
- `conductor/workflow.md` — commands, coverage gates, verification strategy and
  PR settings.

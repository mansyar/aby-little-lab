# Reduce Find the Word cold first-tap latency — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

This bug track reduces the cold first-tap latency of **Find the Word** by loading only the art that the deterministic six-round playthrough can actually draw. The existing 400 ms worst-cold product gate stays unchanged, and the fix must preserve seeded rounds, adaptive difficulty, prompts, cards, speech, saves, and child-facing behavior byte-for-byte.

## Problem / Motivation

A headed 50-cold measurement on the stacked `20261124-first-tap-p95-baseline` branch produced a **Find the Word worst cold total of 507.4 ms**, above the existing 400 ms budget. The natural warm-aware run was worse at 703.8 ms. The slow taps were dominated by post-tap main-thread blockage rather than network response.

`WordMatchScene.preload()` currently rasterizes seven complete art groups before the first playable frame, although a six-round run needs only its selected prompt pictures and the letter atlas. Children opening Find the Word for the first time wait through unnecessary SVG rasterization, and the p95 baseline track cannot pass its acceptance gate until this regression is fixed.

## Goals & Success Metrics

- **Goal:** Find the Word reaches its first playable frame within the existing cold first-tap budget without changing gameplay.
- **Metric:** A fresh headed, cold-control, full five-game run produces 50 cold samples and reports Find the Word per-game p95 **and** worst cold total **≤400 ms**; no other measured game exceeds 400 ms.
- **Quality metric:** The configured `verify_phase` chain exits 0 on the final tree.

## Scope

### In Scope

- Generate the deterministic Find the Word playthrough before selecting art.
- Add a pure, tested selector that returns only the letter group and prompt assets required by that playthrough.
- Change `WordMatchScene.preload()` to queue the selected art instead of seven full groups.
- Add selector and scene-preload regression tests.
- Run the existing headed five-game measurement harness and commit raw JSON evidence.
- Update the dated live result in `docs/perf-baseline.md` after the gate passes.

### Out of Scope

- Changes to any other game scene or the shared art-loader architecture.
- Hub prewarm scheduling changes, new dependencies, new art assets, or package/lockfile changes.
- Save-schema, storage, adaptive-difficulty, audio, speech, input, visual, or child-facing behavior changes.
- Weakening or redefining the 400 ms gate, adding a p95 pass/fail gate, or substituting headless data.
- Expanding to all 24 games or changing the five-game measurement target set.

## Bug Details

- **Reproduction steps:**
  1. Use the stacked branch containing `scripts/measure-first-tap.mjs` p95 support.
  2. Run `pnpm build`.
  3. Run `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`.
  4. Inspect `taps.cold.perGameP95Ms` and `taps.worst` for Find the Word.
- **Expected behavior:** Find the Word per-game p95 and worst cold total are each ≤400 ms, with exit code 0.
- **Actual behavior:** The committed verification retry reports Find the Word p95/worst **507.4 ms** and exit code 1; the natural run reports **703.8 ms** worst and exit code 1.
- **Root-cause hypothesis:** `WordMatchScene.preload()` queues seven full art groups, causing avoidable SVG rasterization and main-thread blockage before `create()` can render the first round.
- **Regression test:** A pure selector test plus a scene-preload spy must fail if the scene queues full unused groups, and pass when only letters plus the selected prompt assets are queued.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Generate the six-round playthrough before art selection using the existing RNG and adaptive-band inputs, preserving the exact seeded round sequence. | must |
| FR-2 | Preload only the letter group and prompt assets referenced by the selected targets; do not queue full unused groups such as `music`. | must |
| FR-3 | Preserve every drawn texture key, raster tier, prompt, word card, speech cue, input path, adaptive shift, completion record, and save behavior. | must |
| FR-4 | Provide a pure selector helper with deterministic output and no Phaser, storage, network, or DOM dependency. | must |
| FR-5 | Produce a fresh headed 50-cold five-game raw JSON artifact proving Find the Word p95 and worst ≤400 ms and no other worst >400 ms. | must |
| FR-6 | Publish the dated passing result, exact command, sample count, per-game p95 table, and raw evidence link in `docs/perf-baseline.md`. | must |
| FR-7 | Run the configured full `verify_phase` chain on the final tree and record the integrated result. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Add no dependency; `package.json` and `pnpm-lock.yaml` stay byte-identical. |
| NFR-2 | Production changes stay within `WordMatchScene.ts` and a small Find-the-Word helper; no other game or shared loader changes. |
| NFR-3 | Keep the 400 ms worst-cold gate and all coverage/build/PWA/docs thresholds unchanged; p95 remains report-only. |
| NFR-4 | No save/schema, scene-flow, art, audio, speech, accessibility, or child-facing behavior change. |
| NFR-5 | Keep modules within the 400-line warning budget, bundle ≤200 kB, module-size zero warnings, PWA 16/16 and docs 5/5. |
| NFR-6 | Remain deterministic and offline-first; measurement uses only local headed Chromium and Vite preview. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | The pure selector returns exactly the letter group plus prompt assets needed by a given seeded playthrough, with no duplicate or unused keys. | FR-2, FR-4 |
| AC-2 | A scene-preload regression test proves full unused groups are not queued and the selected prompt keys plus letters are queued. | FR-1, FR-2 |
| AC-3 | Existing and new tests prove identical seeded rounds, adaptive shifts, prompts, choices, completion and save behavior. | FR-1, FR-3 |
| AC-4 | `git diff <base>..HEAD -- package.json pnpm-lock.yaml` is empty; production `src/**` changes are limited to the approved scene/helper paths. | NFR-1, NFR-2 |
| AC-5 | The committed headed raw JSON contains 50 cold samples across five games, Find the Word p95 and worst ≤400 ms, and every other worst ≤400 ms. | FR-5, NFR-3 |
| AC-6 | Full `verify_phase` exits 0 and `verification/integrated.md` records the result. | FR-7, NFR-3, NFR-5 |
| AC-7 | `docs/perf-baseline.md` contains the dated passing result and evidence link; `validate-docs.js` reports 5/5. | FR-6, NFR-5 |
| AC-8 | If the headed run still exceeds 400 ms, the phase is blocked and reported; no gate change, headless substitution, or scope expansion is used to claim success. | FR-5, NFR-3, NFR-6 |

## Edge Cases

- All selected prompt textures are already warm: the loader skips them and first-tap behavior remains correct.
- A prompt key is absent or corrupt: existing placeholder/error behavior remains unchanged.
- Adaptive `+1` selects more four-letter prompts: the selector includes every prompt the run can draw.
- Repeated scene visits: cached textures are reused without re-rasterization.
- Same seed and adaptive shift: rounds remain identical before and after the fix.
- Headed Chromium, display session, or preview port is unavailable: block and report; never substitute headless data.
- Measurement still exceeds 400 ms after the scoped fix: block with the raw evidence.

## Dependencies

- **Tracks:** `20261124-first-tap-p95-baseline` — stacked branch dependency for the p95 measurement harness and raw evidence; not a merged dependency.
- **External:** local headed Chromium, Node 24, pnpm, and free preview port 4173. No credentials or network service.

## Open Questions & Assumptions

- **Assumption:** The dominant avoidable cost is rasterizing unused art groups, not scene-module download or game logic.
- **Assumption:** Static art-module imports may remain; selectively queuing assets is sufficient to meet the budget.
- **Assumption:** The existing five-game harness is the acceptance measurement; no target filter is required.
- **Assumption:** If the first scoped implementation misses the gate, the track blocks rather than expanding automatically.

## References

- `conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-2.md`
- `conductor/tracks/20261124-first-tap-p95-baseline/verification/first-tap-headed.json`
- `src/scenes/WordMatchScene.ts`
- `src/game/wordLogic.ts`
- `src/game/art/registry.ts`
- `src/game/art/types.ts`
- `conductor/workflow.md`

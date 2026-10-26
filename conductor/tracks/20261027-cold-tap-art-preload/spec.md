# Hub Cold-Tap Art Preload — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Extend the Hub idle-prewarm engine (`src/game/hub/prewarm.ts`) with an art-key queue that rasterizes each game's SVG art groups into the shared game-wide `TextureManager` while a child idles in the Hub, in the same recency-first order as the JS chunks. When a warmed game is tapped, its `preload()` finds every key already present, queues nothing, shows no art-loading cue, and starts within the 400 ms first-tap budget even on a cold visit.

## Problem / Motivation

The prewarm track proved warm taps cost 27–65 ms but cold taps still breach the 400 ms budget worst-case: a cold tap pays fetch + eval **plus** art rasterization queued by `GameSceneBase.preloadArt()` (`GameSceneBase.ts:228-232`) — one `scene.load.svg()` per missing key at tier size (160/256/512 px). The JS half now warms during idle; the art half still happens entirely on the tap path, with the textless cue flashing while the loader runs. If unsolved, first visits to any game keep breaching the budget and the prewarm win stays partial.

## Goals & Success Metrics

- **Goal G1:** Idle-paced, recency-first art raster for all 22 games' groups, reusing the prewarm engine's scheduler, gates, and cancel paths; seeded tests prove order, pacing, silence, and cancel.
- **Goal G2:** Dated cold-tap verdict in `docs/perf-baseline.md`: worst-case cold first tap ≤ 400 ms (median-of-three, same host, back-to-back, same rig as the prewarm verdict).
- **Goal G3:** Zero regression: full 8-command gate green (boot < 3 s, shell ≤ 200 kB, 42/42 precache, coverage gates, file/test count guard).
- **Metric:** Per-game cold-tap medians before/after on the dev host; victory = worst case ≤ 400 ms.

## Scope

### In Scope

- Art-key queue in `src/game/hub/prewarm.ts` (same idle scheduler, same gates, same tap-wins cancel), fed by the per-game group mapping already declared in `src/game/art/`.
- HubScene integration: queue svg loads through the Hub's own loader (feeds the same TextureManager); silent — never shows the art cue during idle.
- Seeded tests with injected scheduler/clock: order, pacing, cancel, lock/hidden, failure swallow, zero-queued-keys + no-cue assertion.
- Cold-tap measurement + dated verdict; TDD/tech-stack record.

### Out of Scope

- Shell 53-key set and Boot/Preload changes (already resident from install; overlap keys such as avatar cat/dog/pig are skipped as already present).
- JS chunk prewarming changes (shipped; this track only adds the art queue beside it).
- SW precache manifest config; game scenes' gameplay/audio/art content; confetti; network-saver heuristics.
- Real-device pass (manual exception, as before).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Rasterize art keys one at a time at idle pace (rIC with timer fallback) in recency-first order via the active profile's `lastPlayedAt`; never during interaction; tap cancels pending keys and tap wins | must |
| FR-2 | Start only after Hub entrance settles; resume across idle cycles; rasterize nothing while the arc/moon play-time lock holds or the tab is hidden; resume when cleared/visible | must |
| FR-3 | Idempotent and silent: skip keys already in the TextureManager, swallow per-key failures with no retry storm, never show the art-loading cue during idle, no race with a game's own `preloadArt` (TextureManager presence dedupes) | must |
| FR-4 | Dated cold-tap verdict: built baseline (art queue off) vs art-prewarm build, same host back-to-back, shell-diet methodology, median-of-three per game; victory = worst case ≤ 400 ms | must |
| FR-5 | Shutdown cancels pending keys with no dangling timers/loads; TDD walkthrough + tech-stack Design Update recorded | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Zero kid-visible change beyond faster cold starts (no visual, audio, gameplay, or cue change) |
| NFR-2 | Budgets hold: boot < 3 s, shell ≤ 200 kB, 42/42 precache, no entrance/idle jank |
| NFR-3 | House style: TSDoc with [0,1)-style contracts; `pnpm check` / `typecheck` clean |
| NFR-4 | No new runtime dependencies |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Seeded fake-scheduler test: keys rasterize in recency order, one per idle tick | FR-1 |
| AC-2 | Tap cancels pending keys; tap path loads and plays exactly as without prewarm | FR-1 |
| AC-3 | Nothing rasterizes while locked or hidden; cycle resumes when cleared/visible | FR-2 |
| AC-4 | Rejected svg load is swallowed (no unhandled rejection); a later tap loads that key through the existing placeholder path | FR-3 |
| AC-5 | A fully warmed game queues zero art keys in `preload()` and shows no art cue on entry | FR-3 |
| AC-6 | Dated verdict shows worst-case cold-tap median ≤ 400 ms across all 22 games | FR-4 |
| AC-7 | Full 8-command gate green incl. count guard; TDD walkthrough + tech-stack entry present | FR-5, NFR-1..4 |

## Edge Cases

- First visit (no `lastPlayedAt`): grid order, mirroring the JS prewarm.
- Profile switch mid-cycle: order recomputed each tick; in-flight key not aborted.
- Shell-overlap keys (avatar cat/dog/pig): skipped as already present — never double-queued.
- Game with zero art groups: nothing queued, engine moves on.
- Idle svg failure: swallowed; tap path covers it exactly as today (placeholder + normal load).
- Hidden tab mid-key: in-flight load completes or is discarded; no keys started while hidden.
- Measurement variance: medians-of-three, back-to-back, same host.

## Dependencies

- **Tracks:** none (JS prewarm `20261027-hub-idle-prewarm` is merged to `master`, which is this track's base).
- **External:** none (Phaser loader + rIC/timer fallback already in use; DOM lib types).

## Open Questions & Assumptions

- **Assumption:** Dev-host headed-Chromium measurement, as with the prewarm verdict (headless starves rIC); real-device pass remains a manual exception.
- **Assumption:** Per-game group mapping in `src/game/art/` is complete and stays the single source of which keys each game needs.
- **Assumption:** Raster cost per key at tier size fits the idle budget one-at-a-time without jank; verified empirically in Phase 2.

## References

- `docs/perf-baseline.md` — prewarm verdict + shell-diet methodology; cold-tap open question closed 2026-10-27, worst case still over budget.
- `src/game/hub/prewarm.ts` — idle engine to extend.
- `src/scenes/GameSceneBase.ts:228-232` (`preloadArt`), `src/game/art/registry.ts:119` (`preloadArtGroups`), `src/game/art/textureTiers.ts`.
- Archived track `conductor/archive/20261027-hub-idle-prewarm/` (spec, plan, verdict method).

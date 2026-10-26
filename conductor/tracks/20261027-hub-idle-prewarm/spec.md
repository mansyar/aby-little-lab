# Spec — Hub Idle Chunk Prewarm

## Overview

Give the Hub an idle-paced prewarm that silently imports the 22 lazy game-scene JS chunks while a child is idling, so the first tap on a tile pays no cold fetch or module-evaluation latency. Order is recency-first (a returning child's favourites warm first), the prewarm is paced one chunk at a time and always yields to a tap, and the track closes the first-tap-budget open question recorded in `docs/perf-baseline.md`.

## Problem / Motivation

- `docs/perf-baseline.md:367` states, verbatim: **"The 400 ms first-tap budget is not demonstrated by this measurement"** — worst observed game 640.2 ms (Memory Match), medians 330-462 ms across five games.
- The tap path today (`src/scenes/sceneRegistry.ts` + `ensureSceneLoaded`) pays chunk fetch + module evaluation + scene registration at tap time. `HubScene.ts` already runs idle machinery (`IDLE_ATTRACT_DELAY = 25000`, `IDLE_CALL_INTERVAL = 10000`, `:33-36`/`:457-497`) but **no prewarm code exists anywhere in src**.
- The service worker precaches all 42 JS chunks at install (validate-pwa: 42/42), which covers the network after precache completes — but the first-visit window before precache finishes, and the module-evaluation cost, remain on the tap path. A 3-5 year old often taps a tile well before any 25 s idle window; an early-start, idle-paced prewarm maximizes coverage without competing with interaction.
- Per-profile `lastPlayedAt` (`src/game/progressLogic.ts:24`) already exists, so recency prioritization needs no new data.

## Goals & Success Metrics

| ID | Goal | Success metric |
|---|---|---|
| G1 | A Hub left idle (or merely settled) prewarms the game chunks | Seeded unit test proves imports fire in recency-first order, paced and cancellable |
| G2 | The first-tap budget question gets a dated verdict | `perf-baseline.md` carries a measured before/after increment verdict; the open-question text is closed or explicitly re-scoped to device pass |
| G3 | Zero regression elsewhere | Full gate green: boot < 3 s, shell ≤ 200 kB, 42/42 precache, coverage ≥ 90/85/88/95, count-drift guard green |

## Scope

**In:** a new prewarm module under `src/game/hub/`; `HubScene` integration (start, pacing, cancel, lock-state gating, shutdown cleanup); seeded unit tests with injected idle scheduler/clock; first-tap measurement runs and the `perf-baseline.md` verdict; TDD/tech-stack documentation.

**Out:** art-texture prewarming (deferred — textures load per-visit through `preloadArtGroups` with a live scene; a scene-less preload path is its own track); Boot/Preload changes; SW precache configuration; any of the 22 game scenes' gameplay/audio/art; `completionEffect` confetti; network-saver heuristics (rejected below).

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | The prewarm imports the 22 `sceneLoaders` chunks **one at a time**, paced to idle time (requestIdleCallback or a timer fallback), in **recency-first order** — current profile's `lastPlayedAt` descending, never-played games last in Hub grid order. It must never run during active interaction and must cancel pending work immediately when the child taps a tile (the tap always wins). | must |
| FR-2 | Prewarming starts shortly after the Hub's entrance settles and resumes across idle windows; it is **skipped entirely while the play-time lock is active** (arc/moon lock) and resumes when the lock clears. | must |
| FR-3 | The prewarm is **idempotent and silent**: already-imported chunks are skipped; a failed import is swallowed with no user-visible error and no retry storm (the next Hub visit re-attempts naturally); it must not race or break `ensureSceneLoaded` (module caching makes duplicate imports harmless; registration stays tap-driven). | must |
| FR-4 | The track records a **first-tap verdict**: a built pre-track baseline vs the prewarm build, back-to-back on the same host (the shell-diet increment methodology), with the median-of-three per game, written into `perf-baseline.md` as a dated section that resolves the `:395-399` open question (or re-scopes it to the device pass with the reason recorded). | must |
| FR-5 | Hub shutdown cancels the prewarm (timers/imports left dangling must not leak); the TDD and tech-stack record the new behavior and the pacing model. | must |

## Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | Zero kid-visible change beyond faster start: no new visuals, sounds, or UI elements; idle-attract behavior unchanged. | must |
| NFR-2 | Performance budgets hold: cold boot median < 3 s, shell entry ≤ 200 kB, PWA precache 42/42 chunks, no jank during Hub entrance or idle attract (pacing keeps main-thread work in idle slices). | must |
| NFR-3 | House style: TSDoc on the public surface with the `[0, 1)`-style contract wording where relevant (idle/timeout contracts), `pnpm check`/`typecheck` clean. | must |
| NFR-4 | No new runtime dependencies. | must |

## Acceptance Criteria

| ID | Criterion | Verifies |
|---|---|---|
| AC-1 | A seeded unit test injects a fake idle scheduler and proves chunks are imported in recency-first order (recent → older → never-played grid order) at idle pace. | FR-1 |
| AC-2 | A seeded unit test proves a simulated tap during prewarm cancels pending imports and leaves the tap path unaffected (subsequent `ensureSceneLoaded` works normally). | FR-1, FR-3 |
| AC-3 | A seeded unit test proves the prewarm performs no imports while the play-time lock is active and resumes when the lock clears. | FR-2 |
| AC-4 | A seeded unit test proves a rejected import is swallowed: no unhandled rejection reaches the UI, and a later tap still loads that game. | FR-3 |
| AC-5 | `docs/perf-baseline.md` carries a dated first-tap verdict section with before/after medians per measured game, and the open-question text at `:395-399` is resolved or explicitly re-scoped. | FR-4 |
| AC-6 | Full gate green including the count-drift guard deriving the true suite counts; TDD/tech-stack sections present. | FR-5, NFR-1..4 |

## Edge Cases & Failure Modes

- **First-ever visit:** every `lastPlayedAt` is null → pure grid order.
- **Profile switch mid-cycle:** the order is recomputed at each pacing tick from the active profile; an in-flight import is not aborted (it is useful to any profile).
- **Import failure (offline/chunk error):** swallowed per FR-3; the SW precache remains the offline safety net.
- **Tab hidden / backgrounded:** pacing pauses (imports while hidden waste battery and give no UX benefit).
- **Hub shutdown mid-import:** timers cancelled, in-flight import result discarded; no dangling callbacks (mirrors the existing `idleCallTimer` cleanup at `HubScene.ts:264-265`).
- **Race with `ensureSceneLoaded`:** both call the same loader; ES module caching dedupes; registration remains tap-driven.
- **Measurement variance:** the host-load flake pattern is documented; medians-of-three and back-to-back runs per the shell-diet methodology.

## Dependencies

- **Tracks:** none.
- **External:** none (requestIdleCallback with timer fallback is platform-standard; TypeScript DOM lib provides the types).

## Open Questions & Assumptions

- **A1 (assumption):** `requestIdleCallback` availability — fall back to a low-priority `setTimeout` when absent; the injected scheduler in tests abstracts this.
- **A2 (assumption):** recency reads the **active profile's** progress map at each pacing tick.
- **A3 (assumption):** the SW precache manifest is untouched (prewarming is runtime, not build-time).
- **A4 (assumption):** art-texture prewarming is explicitly deferred to a future track; this track measures JS-only gains.
- **A5 (assumption):** the measurement runs on the dev host; the real-device pass stays a manual exception per the workflow config.

## References

- `docs/perf-baseline.md:367` (budget not demonstrated), `:395-399` (open question), shell-diet increment methodology (dated section).
- `src/scenes/sceneRegistry.ts` (22 dynamic loaders), `src/scenes/HubScene.ts:33-36,457-497` (idle machinery), `src/game/progressLogic.ts` (lastPlayedAt), `src/game/playTimeLogic.ts` (lock state).

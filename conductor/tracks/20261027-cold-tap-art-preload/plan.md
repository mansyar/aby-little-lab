# Hub Cold-Tap Art Preload — Implementation Plan

> **Branch:** `feat/20261027-cold-tap-art-preload`
> **Base:** `master` @ `360bf145c6c14985daef19c8d58d3ed69d2b5c7c`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Art-key queue engine

- **Goal:** `prewarm.ts` streams art keys one-per-idle-tick in recency-first order with skip-present, swallow-fail, and tap-cancel, proven by seeded tests.
- **Depends on:** none
- **Covers:** FR-1, FR-3, AC-1, AC-2, AC-4
- **Touches:** `src/game/hub/prewarm.ts`, `src/game/hub/*.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P1.T1: Per-game art-key source** — covers: FR-1
  - [ ] **P1.T1.1:** Derive each game's key list (key + tier size) from its declared art groups; single source in `src/game/art/`.
  - [ ] **P1.T1.2:** First-visit fallback to grid order when no `lastPlayedAt` exists.
- [ ] **P1.T2: Idle art queue in the prewarm engine** — covers: FR-1, FR-3
  - [ ] **P1.T2.1:** One key per idle tick via the injected scheduler (rIC with timer fallback); order recomputed each tick from the active profile.
  - [ ] **P1.T2.2:** Skip keys already in the TextureManager; tap cancels pending keys; per-key failures swallowed with no retry storm and no unhandled rejection.
- [ ] **P1.T3: Seeded engine tests** — covers: AC-1, AC-2, AC-4
  - [ ] **P1.T3.1:** Recency order at idle pace, one per tick (fake scheduler/clock).
  - [ ] **P1.T3.2:** Tap-cancel; failure-swallow with tap path unaffected.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-cold-tap-art-preload/verification/phase-1.md
-->

## Phase 2: Hub integration

- **Goal:** HubScene drives the art queue behind the production gates; a warmed game queues zero art keys and shows no cue.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-5, AC-3, AC-5
- **Touches:** `src/scenes/HubScene.ts`, `src/__tests__/scenes/hubScene.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P2.T1: Gate the art queue like the JS chunks** — covers: FR-2
  - [ ] **P2.T1.1:** Start after entrance settles; pause under arc/moon lock or hidden tab; resume on clear/visible.
  - [ ] **P2.T1.2:** Queue svg loads through the Hub loader; never create or show the art cue during idle; shutdown cancels with no dangling timers/loads (covers FR-5).
- [ ] **P2.T2: Warmed-game assertions** — covers: AC-3, AC-5
  - [ ] **P2.T2.1:** Lock/hidden suppression + resume test.
  - [ ] **P2.T2.2:** Fully warmed game queues zero art keys in `preload()` and shows no cue on entry.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-cold-tap-art-preload/verification/phase-2.md
-->

## Phase 3: Cold-tap verdict + records

- **Goal:** Dated before/after verdict proves worst-case cold tap ≤ 400 ms; TDD walkthrough and tech-stack Design Update recorded.
- **Depends on:** Phase 2
- **Covers:** FR-4, AC-6, AC-7
- **Touches:** `docs/perf-baseline.md`, `docs/tech-stack.md`, `scripts/measure-first-tap.mjs`, `conductor/tracks/20261027-cold-tap-art-preload/verification/*`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P3.T1: Cold-tap measurement** — covers: FR-4, AC-6
  - [ ] **P3.T1.1:** Built baseline (art queue off) vs art-prewarm build, same host back-to-back, median-of-three per game, same warm-aware rig.
  - [ ] **P3.T1.2:** Dated verdict section in `docs/perf-baseline.md`; victory = worst case ≤ 400 ms, else re-scope with numbers.
- [ ] **P3.T2: Records** — covers: AC-7
  - [ ] **P3.T2.1:** TDD walkthrough and tech-stack Design Update.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-cold-tap-art-preload/verification/phase-3.md
-->

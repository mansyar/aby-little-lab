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
- **Status:** verified

- [x] **P1.T1: Per-game art-key source** — covers: FR-1
  - [x] **P1.T1.1:** Derive each game's key list (key + tier size) from its declared art groups; single source in `src/game/art/`.
  - [x] **P1.T1.2:** First-visit fallback to grid order when no `lastPlayedAt` exists.
- [x] **P1.T2: Idle art queue in the prewarm engine** — covers: FR-1, FR-3
  - [x] **P1.T2.1:** One key per idle tick via the injected scheduler (rIC with timer fallback); order recomputed each tick from the active profile.
  - [x] **P1.T2.2:** Skip keys already in the TextureManager; tap cancels pending keys; per-key failures swallowed with no retry storm and no unhandled rejection.
- [x] **P1.T3: Seeded engine tests** — covers: AC-1, AC-2, AC-4
  - [x] **P1.T3.1:** Recency order at idle pace, one per tick (fake scheduler/clock).
  - [x] **P1.T3.2:** Tap-cancel; failure-swallow with tap path unaffected.

**Result:** verified
**Checkpoint:** a1a2a6d5
**Evidence:** conductor/tracks/20261027-cold-tap-art-preload/verification/phase-1.md

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
- **Status:** verified

- [x] **P2.T1: Gate the art queue like the JS chunks** — covers: FR-2
  - [x] **P2.T1.1:** Start after entrance settles; pause under arc/moon lock or hidden tab; resume on clear/visible.
  - [x] **P2.T1.2:** Queue svg loads through the Hub loader; never create or show the art cue during idle; shutdown cancels with no dangling timers/loads (covers FR-5).
- [x] **P2.T2: Warmed-game assertions** — covers: AC-3, AC-5
  - [x] **P2.T2.1:** Lock/hidden suppression + resume test.
  - [x] **P2.T2.2:** Fully warmed game queues zero art keys in `preload()` and shows no cue on entry.

**Result:** verified
**Checkpoint:** f6c9bb52
**Evidence:** conductor/tracks/20261027-cold-tap-art-preload/verification/phase-2.md

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
- **Status:** verified

- [x] **P3.T1: Cold-tap measurement** — covers: FR-4, AC-6
  - [x] **P3.T1.1:** Built baseline (art queue off) vs art-prewarm build, same host back-to-back, median-of-three per game, same warm-aware rig.
  - [x] **P3.T1.2:** Dated verdict section in `docs/perf-baseline.md`; victory = worst case ≤ 400 ms, else re-scope with numbers.
- [x] **P3.T2: Records** — covers: AC-7
  - [x] **P3.T2.1:** TDD walkthrough and tech-stack Design Update.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** 7764666b
**Evidence:** conductor/tracks/20261027-cold-tap-art-preload/verification/phase-3.md
-->

## Phase R1: Review fixes (round 1)

- **Goal:** Resolve review-round-1 findings F1 (Medium) and F2 (Low) with docs-only edits; no code, test, or gate changes.
- **Depends on:** Review round 1
- **Covers:** F1 (AC-6 scope), F2 (perf-baseline header)
- **Touches:** `docs/perf-baseline.md`, `conductor/tracks/20261027-cold-tap-art-preload/spec.md`, `conductor/product.md`
- **Verification:** `node scripts/validate-docs.js` (docs-only delta; full gate already green on identical code/tests)
- **Status:** in_progress

- [ ] **R1.T1: Re-scope AC-6 to the 5-game sample (F1)** — covers: F1
  - [ ] **R1.T1.1:** `spec.md` AC-6 row: "across all 22 games" → the rig's 5 sampled games incl. the widest 83-key union (user-approved re-scope).
  - [ ] **R1.T1.2:** Verdict line (`perf-baseline.md` ~696-697): state the 332.6 ms worst case as worst of the sampled five; note the 17-game gap explicitly.
- [ ] **R1.T2: Refresh the perf-baseline live header (F2)** — covers: F2
  - [ ] **R1.T2.1:** Header line 3: point at the art-verdict section as live with art-build figures (148.86 kB on-disk / 148.9 kB validator).

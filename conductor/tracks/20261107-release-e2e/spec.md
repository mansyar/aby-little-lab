# Browser Journey Suite - Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Adds the browser layer the project has never had: a Playwright journey suite
that opens the built game and plays it. Until this track, nothing in the
repository observes end-to-end behaviour - 2,833 unit tests cover logic and four
validators cover build artifacts, but no check ever launches a game and advances
a round.

The suite needs a way to see into a canvas-only UI, so the track also adds a
read-only, query-gated test bridge. That bridge is the only production-adjacent
change, and it is inert unless the URL asks for it.

## Problem / Motivation

The whole UI is a Phaser canvas. `src/main.ts` ends in `new Phaser.Game(config)`
and discards the instance, so there is no DOM to assert against and no handle on
the scene manager.

`scripts/validate-boot.js` drives a real browser against `vite preview` but
asserts one thing: boot completes under 3 s. It cannot tell whether a tile tap
lands, whether a drag registers, whether a round advances, or whether a game
chunk is actually precached.

Every later roadmap phase changes scenes, assets or storage - Phase 2 adds
instrumentation and export, Phase 4 adds content depth and replay novelty,
Phase 5 adds i18n and accessibility work. Without a browser layer, each of those
changes ships blind, and the only detector is a parent noticing.

## Goals & Success Metrics

- **Goal:** a broken game - one whose tiles do not respond, or whose rounds never
  advance - fails CI before merge.
- **Metric:** a deliberately broken tile hit area fails at least one journey,
  recorded and reverted; the suite runs green ten consecutive times locally with
  retries disabled.

## Scope

### In Scope

- A read-only test bridge available only under `?e2e=1`, exposing the active
  scene, profile and sticker counts, the round index, and round geometry for six
  sampled scenes.
- A Playwright suite covering boot, all 22 game launches, three-round completion
  on six sampled games, completion and sticker award, back navigation, the
  parental gate, settings persistence, the time-limit lock, and offline
  relaunch.
- CI wiring so the suite runs on every pull request in Chromium, inside a
  five-minute budget.
- A mutation proof that the suite catches a real regression.

### Out of Scope

- WebKit and Firefox. Roadmap §10.7 schedules the browser matrix as ongoing
  Phase 6 work; adding engines now doubles the runtime before the suite has
  proven stable in one.
- Visual regression and screenshot diffing. Art changes constantly; baselines
  would be maintenance without signal.
- Performance budgets. `validate-boot` owns the boot budget and
  `docs/perf-baseline.md` owns the rest.
- Game-logic correctness. The 2,833 unit tests own that; the suite proves
  wiring, not answers.
- Membership in `verify_phase`. The suite stays a CI layer so phase subagents
  keep their ~90 s gate.
- Accessibility assertions. Phase 3 decides the accessibility scope; testing a
  canvas for a tree it does not have would encode today's limitation as
  correct.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | A read-only `window.__abyE2E` bridge exists only when the URL carries `?e2e=1`; it exposes active scene key, profile count, sticker count, round index, and read-only round geometry for the six sampled scenes. Without the parameter the object is absent and nothing behaves differently | must |
| FR-2 | Every one of the 22 games launches from the hub and returns to the hub via back navigation | must |
| FR-3 | Three rounds complete on six sampled games, one per mechanic family: `ShapeSorter` (drag), `AddItUp` (tap choice), `MemoryMatch` (memory), `StoryOrder` (sequencing), `AnimalTrace` (gesture), `FirstSounds` (literacy), driven by real pointer input at seam-provided coordinates | must |
| FR-4 | Winning a game awards a sticker, increments the stored sticker count, and returns to the hub | must |
| FR-5 | The parental gate opens settings on a three-second hold and does nothing on a one-second press | must |
| FR-6 | A settings toggle survives a page reload | must |
| FR-7 | With seeded play time at the daily cap, hub tiles are locked and the play-time nudge appears instead of a launch | should |
| FR-8 | With the service worker installed and the network offline, the hub reloads and a game still launches from cache | should |
| FR-9 | The suite runs on every pull request in Chromium, within five minutes, with two retries in CI and none locally, retaining a trace on first retry | must |
| FR-10 | A deliberately broken tile hit area fails at least one journey; the break and its failure output are recorded, then reverted | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No product behaviour change. The bridge is read-only, inert without the query parameter, and the shipped shell stays within the existing 200 kB `validate-bundle` gate |
| NFR-2 | The suite completes in five minutes or less on CI and six minutes locally |
| NFR-3 | The suite is deterministic: ten consecutive local runs pass with retries disabled |
| NFR-4 | Existing gates are unaffected: vitest does not collect e2e specs, and the 2,833 unit tests, coverage thresholds, and all four validators still pass |
| NFR-5 | The e2e code is type-checked by `pnpm typecheck` and linted by Biome like the rest of the repository |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | With `?e2e=1` the bridge reports the active scene; without it the object is undefined; the shell stays within the bundle gate | FR-1 |
| AC-2 | One journey launches all 22 games and returns to the hub from each | FR-2 |
| AC-3 | Six journeys each complete three rounds, each round advanced by pointer input at bridge-provided coordinates | FR-3 |
| AC-4 | One journey wins a game and observes the sticker count increase and the return to hub | FR-4 |
| AC-5 | A three-second hold opens settings; a one-second press leaves the hub unchanged | FR-5 |
| AC-6 | A toggle set before reload is still set after reload | FR-6 |
| AC-7 | With seeded usage at the cap, tapping a tile shows the nudge and does not transition | FR-7 |
| AC-8 | Offline after install, the hub reloads and one game launches | FR-8 |
| AC-9 | CI reports the `e2e` job green on the track's pull request, with the runtime recorded | FR-9 |
| AC-10 | The mutation run fails a named journey, the failure is recorded, and the tree is clean afterwards | FR-10 |

## Edge Cases

- **Canvas letterboxing.** The game renders at 1024x768 with `Scale.FIT`, so at
  any other viewport there are offsets. Coordinates must be converted through the
  canvas bounding box, never assumed.
- **Audio gesture requirement.** Browsers block audio before a gesture; the first
  pointer input in a journey must precede any expectation about sound.
- **Reduced motion.** CI is a fresh context with default settings; the suite must
  not depend on animation completing, so assertions poll state rather than wait
  for tweens.
- **Service worker on localhost.** Offline behaviour requires a secure context;
  `localhost` qualifies, and the preview server must serve the built `dist`, not
  the dev server.
- **State leakage between journeys.** Each journey gets a fresh browser context
  and seeded storage; no journey may depend on another's writes.
- **Bootstrap variance.** A loaded CI host can take several seconds to boot
  Phaser; polling timeouts must be generous and the failure message must say which
  stage stalled.
- **The seam itself.** Behind a query parameter it is reachable by anyone who
  types it. It is read-only and exposes no mutation, no storage write and no
  reward path.

## Dependencies

- **Tracks:** none open. Phase 0 (`20261107-trunk-green`, merged as `40ed3254`)
  removed the calendar-dependent flake that would otherwise confound this suite.
- **External:** `@playwright/test` and its Chromium browser download (~130 MB) in
  CI. `playwright-core@1.64.1` is already a devDependency but does not include the
  runner or the browser install step.

## Open Questions & Assumptions

- **Assumption:** CI can download and cache a Chromium build. The existing
  `validate-boot.js` already resolves a system browser first, so a missing cached
  browser degrades to "no browser found" rather than a silent skip.
- **Assumption:** the six sampled scenes are representative. Shape Sorter covers
  drag, Add It Up covers discrete tap choice, Memory Match covers reveal-and-match,
  Story Order covers sequencing, Animal Trace covers a continuous gesture, and
  First Sounds covers literacy taps. If a later game proves structurally different
  (Decode It's letter assembly is the candidate), it joins the sample by extending
  the bridge rather than adding a seventh family.
- **Assumption:** seeding `localStorage` directly is legitimate. It is the
  application's own persist format, already covered by `storage.test.ts`, and it
  is the only way to reach the time-limit state without waiting for a real clock.

## References

- `conductor/product.md` §10.2 Phase 1 - the roadmap row this track implements.
- `conductor/product.md` §6 - game flow: Boot -> Preload -> Hub -> GameScene -> Hub.
- `src/game/gameRegistry.ts` - the 22 `sceneKey` values the launch journey drives.
- `src/scenes/GameSceneBase.ts` - progress dots, `NEXT_ROUND_DELAY` 700 ms,
  `AUTO_RETURN_DELAY` 3000 ms, `inputLocked`.
- `src/components/ParentLock.ts` - three-second hold, `DEFAULT_HOLD_DURATION`.
- `scripts/validate-boot.js` - the existing browser harness and its resolution
  ladder.

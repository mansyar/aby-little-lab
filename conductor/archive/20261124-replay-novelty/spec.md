# Replay Novelty — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

This track makes a child's visit to Aby's Little Lab feel newly invented each
time without changing what is in the 24 games. A small in-memory session policy
remembers which games have been played during one app visit, gives Professor
Hoot a textless suggestion that never repeats the game just played or just
suggested, and rotates a gentle highlight across the child's earned stickers on
the Hub shelf. The success metric is a median of at least four distinct games
per seeded eight-play visit, proved by a deterministic simulation of the policy.

## Problem / Motivation

The Hub always shows the same 24 tiles in the same order, the idle attract cue
wiggles an arbitrary pair, and every earned sticker shimmers equally. A child
who finds one favourite can loop it indefinitely and never see the rest of the
suite; parents see a sticker shelf that looks static even after many visits.
Because the catalogue is fixed for this release, novelty has to come from
presentation and choice policy rather than new content. If nothing changes,
Phase 4 depth stops at raw pool size and the roadmap metric "median distinct
games per session ≥ 4" remains unmeasured.

## Goals & Success Metrics

- **Goal:** Each app visit offers a fresh, textless nudge toward a different
  game and a rotating sticker-shelf highlight, while every tile remains
  tappable and no save data or game rule changes.
- **Metric:** Median distinct games per seeded eight-play visit ≥ 4 across a
  deterministic simulation (≥ 1,000 visits, fixed seed set); no immediate
  repeat in any suggestion or idle cue; `node scripts/validate-docs.js` 5/5.

## Scope

### In Scope

- Per-visit, per-profile in-memory record of games played during this app visit.
- Deterministic suggestion selector: unplayed-this-visit first, then
  least-recently played using existing `lastPlayed` progress stamps, then
  registry order; never the immediately previous suggestion or played game.
- Professor Hoot visual suggestion cue on the Hub (wave/point to a tile) with
  the existing tile tap doing the launch; no new speech.
- Idle wiggle cue that uses the same no-repeat rule instead of its current
  unbounded rotation.
- One rotating highlight on the sticker shelf per Hub visit, cycling earned
  stickers of the active profile; if none are earned, cycle the dashed empty
  slots instead.
- Reset of all visit state on profile switch (including switching back).
- Seeded simulation proving the distinct-games metric and no-repeat invariant.
- Full documentation sync: README Hub behaviour, PRD §3.2/§4, TDD, product
  roadmap item and any count-bearing doc.

### Out of Scope

- New SVG art, alternate sticker images or themed frames.
- Save-schema changes, sticker award changes or cross-visit persistence.
- New TTS speech, new audio cues or changes to the existing idle call.
- Game rules, scene order, `GameId`, tiling, group chips, keyboard/switch input
  or OS zoom work.
- Blocking or hiding a tile a child wants to tap; all 24 tiles stay available.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | A visit-scoped, profile-scoped in-memory state records each `GameId` actually opened in this app visit; it is created fresh on Hub entry and never written to the save. | must |
| FR-2 | The suggestion selector never returns the game played immediately before it or the previously suggested game; if only one eligible game exists, that single game is allowed and the event is recorded as a forced repeat. | must |
| FR-3 | Suggestion order is deterministic: not-yet-played-this-visit first, then least-recently played using existing `lastPlayed` stamps (never played sorts first), then `GAME_REGISTRY` order as the final tie-break. | must |
| FR-4 | Professor Hoot shows a textless visual cue pointing at the selected tile on each Hub visit; tapping that tile launches the game through the existing launch flow, with no new spoken line. | must |
| FR-5 | The idle attract wiggle reuses the same no-repeat selector and never wiggles the just-played or just-suggested game; reduced-motion still suppresses the wiggle. | must |
| FR-6 | The sticker shelf spotlights exactly one earned sticker per Hub visit, advancing one place through the active profile's earned stickers in registry order; with none earned it spotlights one dashed empty slot instead. No new art is introduced. | must |
| FR-7 | Switching kid profiles resets that profile's visit state and re-derives suggestion and shelf highlight; switching back starts a fresh visit for that profile. | must |
| FR-8 | A seeded simulation of at least 1,000 synthetic eight-play visits reports median distinct games ≥ 4 and zero unexpected immediate repeats. | must |
| FR-9 | All count-bearing and behaviour-bearing docs are synced (README, PRD, TDD, product roadmap and any affected doc) and `node scripts/validate-docs.js` passes. | must |
| FR-10 | Every phase passes the full `verify_phase` chain including bundle, module-size, texture, PWA and docs guards; no scope guardrail from Out of Scope is crossed. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | New logic lives in small pure modules with injected inputs and no new dependencies; no production module exceeds the 400-line ceiling. |
| NFR-2 | No save-schema field, sticker key, SVG asset or audio asset is added or changed; shell entry stays ≤ 200 kB and the texture guard stays green. |
| NFR-3 | All new cues are textless and respect `prefers-reduced-motion` as a static state; existing touch targets and the 3-second parental hold are untouched. |
| NFR-4 | Conventional commits, independent verification after every phase, and a read-only reviewer PASS before the PR opens. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Unit tests prove visit state is empty on creation, records a played game once per launch, and is discarded on Hub re-entry without touching localStorage. | FR-1 |
| AC-2 | Unit tests prove no suggestion or wiggle target equals the just-played or just-suggested game unless it is the sole eligible game, in which case the forced repeat is observable. | FR-2 |
| AC-3 | Unit tests prove the three-level ordering with fixtures for unplayed, never-played, older/newer `lastPlayed` stamps and identical stamps. | FR-3 |
| AC-4 | Hub tests prove the cue points at the selected tile, the existing tile tap still launches that game, and no speech call is added. | FR-4 |
| AC-5 | Hub tests prove the idle wiggle target set excludes the last played/suggested game and that reduced motion produces no new tween. | FR-5 |
| AC-6 | Hub/shelf tests prove one sticker is spotlighted, the cursor advances on each visit, wraps at the end, falls back to an empty slot with no earned stickers, and uses only existing keys. | FR-6 |
| AC-7 | Tests prove a profile switch clears that profile's visit state and re-derives both cues, and switching back starts empty. | FR-7 |
| AC-8 | A deterministic seeded simulation test reports median distinct games ≥ 4 over ≥ 1,000 eight-play visits with zero unexpected immediate repeats. | FR-8 |
| AC-9 | `node scripts/validate-docs.js` reports 5 passed / 0 failed on every phase and at integration, with the new Hub behaviour described in docs. | FR-9 |
| AC-10 | Full `verify_phase` green on every phase and at integration: check, typecheck, unit, coverage, build, bundle, module-size, textures, PWA and docs. | FR-10 |

## Edge Cases

- Only one game has been played and it is also the previous suggestion: allow
  the forced repeat and keep the cue, rather than showing nothing.
- A new profile has no earned stickers: spotlight one dashed empty slot and do
  not create any sticker image.
- All 24 games were played in one visit: fall back to least-recently played and
  still avoid the immediately previous game.
- Profile switch while a tile launch is in flight: the launch's visit token
  still wins or cancels as before; the new profile's state starts empty.
- Reduced motion enabled: the suggestion and spotlight are static states, no
  wiggle or shimmer tween is created.
- Storage read failure: the visit policy is memory-only and never depends on a
  successful write; existing storage resilience rules remain in force.

## Dependencies

- **Tracks:** none (`20261123-release-v1-25-0` is merged; base `57389e8f`)
- **External:** none

## Open Questions & Assumptions

- **Assumption:** "one app visit" means one Hub entry after boot or auto-return
  until the app is closed, backgrounded or the scene shuts down; a reload
  starts a fresh visit.
- **Assumption:** `lastPlayed` stamps already stored per game are sufficient
  for the least-recently-played tie-break; no new persisted field is needed.
- **Assumption:** "median distinct games per session ≥ 4" is evaluated against
  a policy simulation of eight plays per visit, not against a browser timing
  measurement.
- **Assumption:** existing earned stickers are cycled in `GAME_REGISTRY` order;
  no new sticker variants are authored.

## References

- `conductor/product.md` §3.2 (Replay Variety, sticker shelf, Professor Hoot)
  and §10.5 row `20261208-replay-novelty`
- `src/game/hub/hubAttract.ts` (idle attract/wiggle rotation)
- `src/game/hub/stickerShelf.ts` (shelf thumbnails, sparkle and reduced motion)
- `src/game/hub/gameLaunch.ts` (launch hook where `recordGamePlay` runs)
- `src/utils/storagePlay.ts` (existing `lastPlayed` stamps)

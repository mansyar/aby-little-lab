# Specification — Gameplay Hardening: Replay & Session Bug Fixes + Gameplay Depth

**Track ID:** `gameplay-hardening_20260807` · **Type:** bug+feature · **Release:** v1.7.0 (included)

## 1. Overview

Five verified replay/session bugs in shipped v1.6.0 code degrade the core use case (replaying games):

- **Animal Trace** breaks on the second playthrough (session state never reset in `create()`; after a full session the game ends after 1 path, and after a mid-session exit it can crash via `pairs[3]`).
- **Shape Sorter** progress dots stop filling on the second playthrough (stale destroyed `Arc` references accumulate in `progressDots`).
- **Find the Letter / How Many? / Find the Word / Build the Word** throw an uncaught `TypeError` when the speaker replay button is tapped during the 3s win celebration (`rounds[roundIndex]` / `words[roundIndex]` is `undefined` after the final round).
- **Musical Memory** misjudges the next tap as wrong after the replay button is used (`inputIndex` is not reset, while the wrong-tap path resets it).
- **Pop & Freeze** bubbles carry 512px physics bodies and input hit areas while displaying at 96px — phantom-wall bouncing and overlapping tap targets undermine the poppable-vs-sleeping mechanic.

This track fixes all five with TDD regression tests, guards the auto-return double-transition race, applies cross-cutting consistency fixes and dead-code removal, adds **gameplay-depth improvements** surfaced by a full per-game audit (guided tracing, confusable-distractor guards, easy-first ordering, used-tile feedback, correct-answer splashes, pacing and variety polish), adds the three missing scene test suites, and ships everything as **v1.7.0** via the established release pipeline.

## 2. Functional Requirements

### FR-1 Session state resets on scene relaunch (Animal Trace)
- `create()` must reset `currentPairIndex`, `completedPaths`, and clear the `progressDots` array.
- Regression: complete a session → relaunch → completing 1 path must NOT end the game; exiting mid-session → relaunch → full 3 paths play.

### FR-2 Progress dots reset on scene relaunch (Shape Sorter)
- `create()` must destroy stale dots and reset the `progressDots` array so dots fill on every session.
- Regression: relaunch → complete a round → the dot fills.

### FR-3 Speaker replay button must not throw during win celebration (Alphabet, HowMany, WordMatch, WordBuilder)
- `onSpeak` handlers guard against `rounds[roundIndex]` / `words[roundIndex]` being `undefined` (`if (!round) return;`).
- Regression per scene: tap the speaker during the 3s celebration window → no exception.

### FR-4 Replay button resets input position (Musical Memory)
- `handleReplay()` resets `inputIndex = 0` before replaying the sequence.
- Regression: tap 2 correct notes → replay → tap the first note → judged correct.

### FR-5 Bubble physics body matches display size (Pop & Freeze)
- Spawned bubbles get a physics body and input hit area sized to the 96px display (`setCircle(BUBBLE_DISPLAY_SIZE / 2)`), not the 512px texture frame.
- Regression: spawned bubble body ≈ display size; visible bounce at screen edge; tap routing poppable-vs-sleeping unchanged.

### FR-6 No double scene transition during auto-return (all 11 game scenes)
- A navigation guard ensures the ParentLock back button and the 3s auto-return `delayedCall` cannot both fire `transitionToScene` on the same camera.
- Regression: Back during the celebration window → exactly one transition.

### FR-7 Cross-cutting consistency & dead code
- Shadow Match `DROP_ZONE_SIZE` 120 → 160 (match sibling drag games).
- Word Builder settle-pop honors `prefers-reduced-motion`; dot-pop tween aligned to `scaleX/scaleY`.
- Shape Sorter back button uses `textStyle()` (Baloo 2 family, matches siblings — currently falls back to Courier).
- Remove test-only dead exports: `selectThreeShapes` (shapeSorterLogic), `baseScale` (BigSmall), `isCorrectWord` (wordLogic), `isCorrectLetter` + `hasCompletedPlaythrough` (alphabetLogic), `isPlaythroughComplete` (countLogic). Verify `Curves.Path` (AnimalTrace) and `slotRects` (WordBuilder) are truly unused (including by tests) before removal.

### FR-8 Missing scene test suites
- New `animalTraceScene.test.ts`, `popFreezeScene.test.ts`, `patternBuilderScene.test.ts` following the existing scene-test harness (mock Phaser, storage, audio), covering: round flow, correct/incorrect paths, input locking, **relaunch resets** (FR-1 bug class), sticker gating, win/auto-return, reduced-motion where applicable.

### FR-9 Gameplay depth
| # | Game | Improvement |
|---|---|---|
| a | Animal Trace | **Next-waypoint guidance**: the next waypoint renders larger with a pulsing ring (Graphics-based); visited waypoints light up — guided tracing and visible progress |
| b | Musical Memory | **Same-frog run cap**: ≤2 consecutive repeats in `generateSequence`/`appendNote`; **note-delay scaling**: inter-note delay 600 → 480ms at sequence length ≥5 (full-sequence replay semantics preserved) |
| c | Word Match | **Easy-first ordering**: 3-letter targets before 4-letter via the existing `tier` field (mirrors Word Builder) |
| d | Word Match, Find the Letter, Pattern Builder | **Correct-answer splash** at the tapped card / target / gap via `createCompletionSplash` (closes the 5-vs-3-game inconsistency) |
| e | Word Builder | **Used-tile feedback**: placed tile animates into its slot (fly-to-slot) with a ghost placeholder — makes "spent" tiles legible and resolves duplicate-letter confusion (BALL's single L) |
| f | Word Builder | **Phone-safe tile size**: `TILE_SIZE` raised so tiles stay ≥64px at phone FIT scale (currently ~54px at 0.49 scale) |
| g | Pattern Builder | **ROUND_COUNT 5 → 6** (aligns with every sibling's 6-round playthrough; flagged in release notes) |
| h | Pattern Builder, Find the Letter | **Confusable-distractor guards**: distractors avoid shapes/letters visually confusable with the answer (e.g., no C with G/O/Q; no hexagon with octagon) — family-based filtering, property-tested |
| i | How Many? | **Distinct targets per band** (no duplicate count within a band); **centered last grid row** in count cards |
| j | Big vs Small | **Box-side shuffle**: which side holds the big box rotates per play |

### FR-10 Release v1.7.0
- Version bump 1.6.0 → 1.7.0, `docs/release-notes-v1.7.0.md`, device-testing checklist rows, `release/v1.7.0` branch, all four quality gates, annotated tag `v1.7.0`, PR → master, Coolify auto-deploy, deployment + live smoke verification (targeted at the fixed bugs), device testing, finalize + archive — mirroring the v1.6.0 release track structure.

## 3. Non-Functional Requirements

- TDD for all logic-bearing fixes (failing test → fix → green); scene tests alongside/after for UI-bound changes.
- No storage schema changes (no migration); difficulty philosophy unchanged (no age-gating); zero new assets.
- Reduced-motion, audio, and visual conventions preserved (all effects via `motionDuration`/`motionScale`/`isReducedMotion`).
- Quality gates green: `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`.
- No regression in the 6919-line `navigation.test.ts` suite.

## 4. Acceptance Criteria

1. All five critical bugs fixed, with regression tests that fail against v1.6.0 code.
2. FR-9a–j gameplay-depth items implemented with logic and/or scene tests.
3. Three new scene suites exist and pass; the full suite is green (≥ current 979 tests + new).
4. No double-transition path remains; dead code removed; consistency deltas closed.
5. v1.7.0 released through the pipeline: branch, bump, docs, gates, tag, PR merged, deployed, live-verified (including replay-bug smoke), device-tested, archived.

## 5. Out of Scope (deferred)

- Drag-game / speech-game **scaffold extraction** (M/L refactor — deliberately separate from a release-bound track; the drift bugs it would prevent are already fixed in scope).
- Storage-schema or cross-device sync; new games; per-profile difficulty levels.
- Pattern Builder pattern-type cosmetic renames ("ABB" → "ABBA" label).

# Specification: Adaptive Difficulty Completion

> IDs in this document are stable. Never renumber after approval; withdraw by
> marking an item `Withdrawn` and leaving its id in place.

## Overview

Seven of the 22 games never respond to the app's adaptive difficulty: Shape
Sorter, Animal Trace, Pop & Freeze, Shadow Match, Big & Small, Feelings Faces
and Story Order. This track gives each of them a difficulty dimension wired to
the same band shift the other fifteen already consume, so a child who has
outgrown a game moves up and a child who struggles gets an easier variant —
in every game, not just fifteen of them. It completes the persisted difficulty
work started in v1.18.0 and made endurable by PR #55's persistent tap window.

## Problem / Motivation

`docs/roadmap.md` records it as a Known Issue ("Seven games never shift their
difficulty"). The mechanics, verified against the code on 2026-10-23:

- **The seven games' logic modules carry no shift parameter.** The 15 adaptive
  games consume the shift at scene `create()` via `getAdaptiveBandShift(...)`
  (14 call sites; `GroupMathScene` covers two games with one). These seven
  have no such call site and their logic modules have nothing to feed it to.
- **Their taps are already recorded and never read.** Since PR #55,
  `GameSceneBase` folds every game's taps — completed or abandoned — into the
  rolling 10-tap window (`progress[gameId].recent`). For these seven the
  window is written and then read by nothing: effort with no effect.
- **A child who outgrows a fixed game is stuck.** Shape Sorter always draws 3
  shapes of the same 18; Animal Trace is always 3 paths of 6 waypoints; Pop &
  Freeze always floats 5 bubbles with 1–2 sleeping decoys; Shadow Match always
  picks 6 of the same 8 silhouettes; Big & Small always uses 1.5×/0.7×
  scale contrast; Feelings Faces always runs 3 distinct then 3 confusable
  rounds; Story Order always mixes 3 obvious + 3 subtle stories. Neither the
  thriving child (band +1) nor the struggling one (band −1) sees any change.
- **The shift machinery is proven and waiting.** `src/game/adaptiveLogic.ts`
  computes the shift from the persisted window (`UP_THRESHOLD 0.9`,
  `DOWN_THRESHOLD 0.6`, `MIN_SAMPLE 6`), `storage.getAdaptiveBandShift` gates
  it behind the parent toggle and the sample floor, and six different per-game
  shift strategies already exist among the 15 participants.

Who feels it: the child (a world that never grows with them, or never eases
off), the parent (the toggle promises adaptation the seven games ignore), and
the maintainer (half the suite participates, half doesn't — no single story
for what "adaptive" means).

## Goals & Success Metrics

- **G1 — every game adapts.** All 22 games respond to the band shift.
  *Metric:* seeded unit tests demonstrate, for each of the seven games, that
  the shifted draws differ observably from the classic ones.
- **G2 — classic is today.** A child at shift 0 sees exactly what ships.
  *Metric:* the existing suite keeps every outcome; new regression tests pin
  the shipped behaviour at shift 0.
- **G3 — the extremes are reachable and sound.** Shifts ±1 yield stable,
  well-formed playthroughs per game. *Metric:* per-game tests exercise both
  extremes through each game's invariants (no repeats, coverage rules,
  guards, panel counts).
- **G4 — new content lands in the pools that need it.** *Metric:* the
  art-ownership tests (`shellOwnership`, `groupIntegrity`) updated and green;
  no new key in the 53-key boot shell; the document validator stays green
  after the inventory counts move.

## Scope

### In scope

- A shift-parameterized knob for each of the seven games' logic modules (the
  per-game table below), consumed by the scene at `create()` in the same
  one-call pattern the 15 participants use.
- New content in exactly three pools, agent-authored against
  `docs/SVG_STYLE.md` and reviewed by the user before phase acceptance:
  - **Shadow Match:** new silhouette objects 8 → 12 (so the extreme bands
    keep draw variety: easy excludes the most confusable, hard favours them).
  - **Story Order:** new stories — obvious pool 4 → 5, subtle pool 4 → 6
    (each new story = 3 SVG panels; enables 5+1 and 1+5 band mixes).
  - **Feelings Faces:** new scenarios 16 → 24 (2 more per emotion — text
    only, spoken by the narrator; keeps extremes fresh with "no caps"
    honoured by adding more if the draw math profits).
- Art-group membership for every new SVG (lazy groups only — nothing joins
  the boot shell) and contact-sheet regeneration.
- Tests: band-effect tests per game, shift-0 regression pins, pool-invariant
  tests at every band, art-ownership updates.
- Documentation: `docs/PRD.md` §4.8 and the TDD's shift chapter gain the
  seven games; the roadmap's first Known Issue and its Future Work item 1 are
  removed as done; the README's headline list becomes seven; the
  `conductor/product.md` changelog gains the track entry.

### Out of scope

- Any change to storage schema, keys, or window semantics (PR #55 shipped
  what the window needs).
- The five untouched content pools (Shape Sorter's 18 shapes, Animal Trace's
  6 pairs, Pop & Freeze's 6 animals, Big & Small's 6 toys, Shadow Match's
  existing 8 stay exactly as they are) — new content goes only to the three
  named pools.
- RNG injection into the five logic modules that call `Math.random()`
  directly (the shared shuffle/RNG seam is its own roadmap item); band logic
  is deterministic and unit-tests the pools directly.
- The three hand-rolled drag games' migration onto the shared `DragBoard`.
- Audio identity, BGM, sounds, wrong-answer feel, timings, touch targets.
- The 15 existing participants' shift strategies (already shipped).
- The version bump, the release tag, and the device pass.

## The per-game table (derived from each game's round-generation code)

| Game | Difficulty dimension | Shift −1 (struggling) | Shift 0 (classic = today) | Shift +1 (thriving) |
|---|---|---|---|---|
| Shape Sorter | Shape pool per playthrough | An easy subset — the most ornamental / most distinct shapes | All 18 shapes | A confusable geometric subset |
| Animal Trace | Waypoints per path | 4 waypoints | 6 waypoints | 8 waypoints |
| Pop & Freeze | Sleeping-bubble bounds | 0–1 sleeping of 5 | 1–2 sleeping of 5 | 2–3 sleeping of 5 |
| Shadow Match | Which objects are in the round's pool | Excludes the most confusable shapes | All 8 (any 6 drawn) | Favours the confusable shapes |
| Big & Small | Scale contrast between boxes | Wider contrast (easier to see) | 1.5× / 0.7× | Narrower contrast |
| Feelings Faces | Distinct-vs-confusable round split | 6 distinct rounds | 3 + 3 | 6 confusable rounds |
| Story Order | Obvious-vs-subtle story mix | 5 obvious + 1 subtle | 3 + 3 | 1 obvious + 5 subtle |

All seven knobs are pure functions in the logic module, sampled once at
`create()` and fixed for the playthrough (the shipped convention). Every
classic value reproduces today's behaviour exactly.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Shape Sorter's playthrough draws each round's 3 shapes from a band-selected pool: an easy ornament subset, the full 18, or a confusable subset. `generatePlaythrough(roundCount, shift)`; shift 0 draws all 18 as today; no-repeat-within-playthrough holds at every band. | Must |
| FR-2 | Animal Trace's paths take band-selected waypoints: 4 / 6 / 8, replacing the fixed `PATH_POINTS` at the scene's call sites (progress, drawing and completion all use the round's waypoint count). | Must |
| FR-3 | Pop & Freeze's sleeping-bubble bounds co-move with the band into a band-aware selector: 0–1 / 1–2 / 2–3 sleeping bubbles among the 5 concurrent. `selectBubbleType` variants parameterized by the bounds; the wake flow (a success moment) unchanged. | Must |
| FR-4 | Shadow Match's round pool becomes band-aware over a 12-object corpus: easy excludes the most confusable members, hard favours them; classic draws any 6 of all objects exactly as today. `isMatch` and the win target unchanged. | Must |
| FR-5 | Big & Small's scale contrast is band-selected: a wider contrast below classic, 1.5×/0.7× at classic, a narrower one above. Toy/box geometry derives from the selected factors; layout stays sound at every band. | Must |
| FR-6 | Feelings Faces' contrast ladder splits band-aware: distinct/confusable round counts 6/0, 3/3, 0/6, with the guaranteed one-per-emotion scenario draw and the no-repeat rule intact at every band (contrast pairs generalize so targets still span all four emotions). Pool grows 16 → 24 scenarios (2 per emotion). | Must |
| FR-7 | Story Order's playthrough mixes band-aware: 5+1, 3+3, 1+5 (obvious + subtle), from pools grown to 5 obvious and 6 subtle. The degenerate-shuffle and rotation guards hold at every band; no story repeats within a playthrough. | Must |
| FR-8 | Every new SVG conforms to `docs/SVG_STYLE.md` (512×512, 8px safe margin, flat fills, thick outlines), lands in the correct lazy art group, and the contact sheets are regenerated. Agent-authored; shown to the user for review before the phase is accepted. | Must |

## Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | Shift 0 reproduces shipped behaviour: every existing test keeps its outcome; new regression tests pin the classic draws. | Must |
| NFR-2 | No new dependency; no new network access; the app stays offline-first. | Must |
| NFR-3 | The full gate stays green: Biome clean (the two pre-existing findings unchanged), 2,488+ tests pass, coverage ≥ 90/85/88/95, shell ≤ 200 kB (measured — new art must not join the boot shell), `validate-bundle`, `validate-pwa` 16/16, `validate-docs` green after counts move. | Must |
| NFR-4 | Shared shell classes (`GameSceneBase`, `ChoiceRoundScene`, `GroupMathScene`) untouched; scene changes limited to the seven games' `create()` wiring and their content constants. Audio identity, win flow, sticker award, wrong-answer feel byte-identical. | Must |
| NFR-5 | Product guidelines upheld: no new negative audio or motion; new art follows §2 Storybook Flat; touch targets unchanged; the adaptive toggle remains the parent's single off-switch (shift 0 for every game when off). | Must |
| NFR-6 | Every new draw function is unit-testable deterministically: pure pool/parameter logic tested directly; where a module's convention injects an RNG (Feelings Faces, Story Order) tests pass a seeded generator. | Must |

## Acceptance Criteria

| ID | Criterion | Verifies |
|---|---|---|
| AC-1 | For each of the seven games, a seeded test shows the band-shifted playthrough differs observably from the classic one (pool, count, bounds, selection, contrast, or mix). | FR-1..FR-7 |
| AC-2 | Every existing test keeps its outcome; shift-0 regression tests pin today's classic behaviour for all seven games. | FR-1..FR-7, NFR-1 |
| AC-3 | New content landed: Shadow Match 12 objects, Story Order 5 obvious + 6 subtle stories (9 new panels), Feelings Faces 24 scenarios; art-ownership tests updated; no new key in the 53-key boot shell; contact sheets regenerated. | FR-4, FR-6, FR-7, FR-8 |
| AC-4 | Documentation updated: PRD §4.8 and the TDD shift chapter describe all 22 adaptive games (the seven with their table rows), the roadmap's resolved Known Issue and Future Work item removed, the README headline list at seven, `conductor/product.md` changelog entry added; `validate-docs` green. | FR-1..FR-7 |
| AC-5 | The full `verify_phase` gate (including boot smoke per workflow policy when assets change) passes on the track branch. | NFR-2, NFR-3 |

## Edge Cases & Failure Modes

- **Legacy saves:** profiles without a persisted window get shift 0
  (`getAdaptiveBandShift` already returns 0 below the sample floor) — no
  migration, no new field.
- **Parent toggle off:** every game plays classic, as today.
- **Extreme-band pool arithmetic:** the mixes require obvious ≥ 5 and subtle
  ≥ 5 (Story Order), scenarios per emotion ≥ 6 for a 6-round run (Feelings
  Faces), pool − exclusions ≥ 6 with variety (Shadow Match) — the grown pools
  satisfy each; pool-invariant tests assert it.
- **Feelings Faces guaranteed coverage at extremes:** the one-per-emotion
  draw and the contrast knob compose so every band still spans four target
  emotions; tested at 6/0 and 0/6.
- **Story Order guards:** the reshuffle-then-rotate fallback holds at the new
  pool sizes; a never-degenerate test at each mix.
- **Big & Small layout:** ballparks for selected scale factors bounded so
  neither the toy nor the box leaves its touch floor or the canvas.
- **Animal Trace drawing:** the trail renders from the round's waypoint array;
  a 4-waypoint path stays smooth (the curve generator is waypoint-count
  agnostic).
- **Pop & Freeze 0-sleeping spawn:** `selectBubbleType`'s floor guard at 0
  yields a clean all-poppable opening; the wake flow simply never triggers.
- **Accepted variety trade:** at Shadow Match's easy band the drawn six are a
  fixed set (order still shuffles) — fitting the child outranks draw variety,
  per the approved decision.
- **Art churn:** every new SVG moves the art-group counts the ownership tests
  pin; the tests are updated in the same phase as the art, and the shell set
  stays at 53 keys.

## Dependencies

- **Tracks:** none — the base is `master` after PR #56; PR #55's window
  plumbing is already merged.
- **External:** none.

## Open Questions & Assumptions

No open questions — resolved during the interview (2026-10-23):

1. **Shift latched at `create()`**, matching all 15 shipped participants; a
   playthrough never re-grades mid-game mid-session.
2. **New content allowed**, focused on the three pools the band math binds
   (Shadow Match, Story Order, Feelings Faces); the other five pools are
   untouched.
3. **No caps on the new content** beyond what the draw math profits from —
   the counts above (12 / 5+6 / 24) are the derived targets, revisable in
   review, and the implement phase may add more with test evidence if a band
   needs room.
4. **The variety trade at the extremes is accepted** (fixed easy sets, moved
   split points) — fitting the child outranks round-to-round novelty.
5. **The agent authors the new SVGs** against `docs/SVG_STYLE.md` and shows
   them to the user before the phase is accepted.
6. `conductor/product.md` has no "Open Questions & Assumptions" section, so
   the six decisions above seed this spec.

## References

- `docs/roadmap.md` — "Seven games never shift their difficulty" (Known
  Issue 2) and Future Work item 1 naming this track.
- `src/game/adaptiveLogic.ts`, `src/utils/storage.ts`
  (`getAdaptiveBandShift`), `src/game/progressLogic.ts` (`recordTaps`) — the
  shift machinery the seven games plug into.
- The seven logic modules and their scenes: `shapeSorterLogic.ts` /
  `ShapeSorterScene.ts`, `animalTraceLogic.ts` / `AnimalTraceScene.ts`,
  `popFreezeLogic.ts` / `PopFreezeScene.ts`, `shadowMatchLogic.ts` /
  `ShadowMatchScene.ts`, `bigSmallLogic.ts` / `BigSmallScene.ts`,
  `feelingsFacesLogic.ts` / `FeelingsFacesScene.ts`, `storyOrderLogic.ts` /
  `StoryOrderScene.ts` (+ `src/game/storyOrderArt.ts`).
- The 14 shipped call sites consuming `getAdaptiveBandShift` — the wiring
  pattern to follow.
- `docs/PRD.md` §4.8, `docs/TDD.md` §7.3 — the adaptive chapters this track
  extends to 22 games.
- `conductor/product-guidelines.md` §2 (Storybook Flat), §5 (touch floors).
- `docs/SVG_STYLE.md` — the art contract for the new panels and objects.

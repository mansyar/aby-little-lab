# Feelings Faces — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Adds **Game 21, Feelings Faces** — the suite's first social-emotional learning
game. Aby, a kid character, appears in one of four expressions (happy, sad,
angry, scared); the game speaks a short everyday scenario and the child taps the
face that matches how Aby feels. Six rounds, three face cards per round, with 16
scenarios drawn fresh each playthrough.

## Problem / Motivation

All 20 existing games teach academic skills (shapes, phonics, counting,
arithmetic, memory, ordering). Emotional literacy — naming a feeling from a
situation — is a core preschool competency and is entirely absent. Without it the
suite is academically broad but developmentally one-sided, and parents looking
for social-emotional content have nothing to open.

## Goals & Success Metrics

- **Goal:** a complete, shippable 21st game that teaches four emotions through
  situation-to-expression inference.
- **Metric:** a 6-round playthrough completable with zero reading; ≥95% line
  coverage on the new logic module (existing gate); zero new audio files; boot
  time stays under 3 s; all existing tests still pass.

## Scope

### In Scope

- 16 spoken scenarios (4 per emotion), drawing 6 per playthrough without repeats
- Easy-first fixed ladder: rounds 1–3 contrast maximally distinct expressions,
  rounds 4–6 contrast confusable ones
- Four static face SVGs of one kid character, plus tile art and one heart sticker
- Spoken rule line, written caption fallback when no TTS voice, SFX and
  reduced-motion respect
- Progress tracking (plays, wins, accuracy, mastery star) and a Learning Progress
  row
- Docs: `product.md` game table + changelog entry, README game counts

### Out of Scope

- Adaptive Difficulty integration (stays fixed-difficulty; no Settings change)
- New settings controls, new audio files, per-scenario illustrations
- Localization, mid-game exit changes, new character profiles

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Hub shows a 21st tile labelled "Feelings Faces" appended after Number Order; tapping it launches the scene, honouring existing play-time limit and sticker states | must |
| FR-2 | A playthrough is exactly 6 rounds; each round displays 3 distinct face cards and speaks one scenario sentence via the configured TTS voice | must |
| FR-3 | Exactly one card per round matches the scenario's emotion; tapping it plays the correct chime + splash and advances | must |
| FR-4 | An incorrect tap wiggles the card, plays the gentle "try again" tone, re-speaks the scenario once, and keeps the same round — no penalty, no advance | must |
| FR-5 | The scenario pool holds 16 entries (4 per emotion); each playthrough draws 6 without repetition in shuffled order | must |
| FR-6 | Rounds 1–3 use maximally distinct expression contrasts; rounds 4–6 use confusable contrasts (sad vs. scared, happy vs. angry) | should |
| FR-7 | The rule "Tap the face that shows how Aby feels." appears as one written line beside the speaker glyph, is spoken once at round 1 setup, and is replayable on tap | must |
| FR-8 | When no TTS voice is available (or SFX is off) the scenario appears as a short written caption and the speaker glyph is dimmed; the round remains completable | must |
| FR-9 | Completing all 6 rounds triggers the win animation, awards the heart sticker on first completion only, and auto-returns to the Hub after 3 s | must |
| FR-10 | Per-profile progress records plays, wins, and accuracy from correct/incorrect taps; a mastery star appears after 3 wins and the game gets a row in Learning Progress | must |
| FR-11 | Every scenario is written as a gentle, resolvable everyday situation (thunder, a loud vacuum, the dark hallway) with no injury, loss, or violence | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | 60 fps target (min 30); no regression of the 3 s boot budget and no new audio downloads |
| NFR-2 | All interactive targets ≥64×64 px with inflated hit bounds; gameplay never requires reading (captions are a fallback only) |
| NFR-3 | `prefers-reduced-motion` shortens or disables tweens; BGM/SFX toggles and voice selection are honoured |
| NFR-4 | All new assets are precached by the existing PWA pipeline and work offline after install |
| NFR-5 | Expressions are distinguishable by shape, not color alone; flat style, thick outlines, palette-compliant per `docs/SVG_STYLE.md` |
| NFR-6 | TypeScript strict-clean (`pnpm typecheck`), Biome-clean (`pnpm check`), coverage thresholds unchanged (lines 95 / functions 88 / branches 85 / statements 90) |
| NFR-7 | New SVG payload totals ≤ 40 KB across the six new assets |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Hub renders 21 tiles; the 21st is "Feelings Faces" and launches the scene | FR-1 |
| AC-2 | A full playthrough presents 6 rounds, each with 3 distinct faces and one spoken scenario | FR-2 |
| AC-3 | Tapping the matching face advances; tapping a wrong face stays on the same round and re-speaks | FR-3, FR-4 |
| AC-4 | 20 simulated playthroughs never repeat a scenario within a run, and each run contains at least three distinct emotions | FR-5 |
| AC-5 | Rounds 1–3 and rounds 4–6 produce the documented contrast pairs | FR-6 |
| AC-6 | With `speechSynthesis` mocked empty, the caption renders and the round is still completable | FR-8 |
| AC-7 | The sticker is awarded exactly once and persisted per profile | FR-9 |
| AC-8 | The progress row shows plays, accuracy, and star state after 3 wins | FR-10 |
| AC-9 | Every scenario string is in the approved safe-content list and ≤ 60 characters | FR-11 |
| AC-10 | Full CI parity passes: check, typecheck, tests, coverage, build, bundle/PWA validators, boot smoke | NFR-6 |

## Edge Cases

- No TTS voice installed → caption fallback, dimmed speaker (AC-6)
- SFX toggled off → rule and scenario silent, captions still shown
- Repeated wrong taps → never locks out, never skips the round
- Sticker already earned on a replay → no duplicate, no shimmer spam
- Daily play-time limit reached → tile dims and locks with the moon badge
  (existing behaviour, no new code)
- Reduced motion on → no wiggle or bob, verbal/visual feedback still present
- Page reload mid-round → returns to Hub, no partial progress persisted
  (consistent with all games)
- Offline after install → faces, tile, sticker, and device-side TTS all work

## Dependencies

- **Tracks:** none
- **External:** none — TTS is device-provided; no new services or credentials

## Open Questions & Assumptions

- **Assumption:** "maximally distinct" = happy vs. angry as the early contrast;
  "confusable" = sad vs. scared late, since both involve downturned features
- **Assumption:** Learning Progress paging becomes 6 + 6 + 6 + 3 for 21 rows
- **Assumption:** art is produced in-repo following `docs/SVG_STYLE.md`; no
  external illustrator
- **Question:** should the kid character recur in later SEL games, or stay scoped
  to this one? Not blocking; affects naming only

## References

- `conductor/product.md` §3.1 (game table), §4 (UX principles)
- `docs/SVG_STYLE.md`
- Existing patterns: `src/scenes/ColorMatchScene.ts`, `src/game/firstSoundsLogic.ts`

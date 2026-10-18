# Specification: Voice-First Instructions for the Silent Ten

## Overview

Ten of the twenty mini-games teach their rule with only a static title or nothing at all. The other ten speak a prompt through `SpeakerButton` + Web Speech and offer a "hear it again" affordance. For an audience that cannot read, that split means half the suite depends on a parent sitting alongside.

This track gives the ten silent games the same voice: one short hand-written instruction, spoken once when the round is set up, plus a visible prompt line and a replay button — through a single shared API on `GameSceneBase` rather than ten more hand-rolled copies.

**Games in scope:** ShapeSorter, AnimalTrace, PopFreeze, ShadowMatch, BigSmall, MemoryMatch, NumberOrder, PatternBuilder, AddItUp, TakeAway.

**Games explicitly untouched:** the ten that already speak (Alphabet, ColorMatch, DecodeIt, FirstSounds, HowMany, MoreLess, MusicalMemory, OddOneOut, WordBuilder, WordMatch).

## Proposed instruction copy

One clause, no abstractions, concrete verb first. Spoken and displayed text are identical.

| Game | Instruction |
|---|---|
| Shape Sorter | "Drag each shape into its hole." |
| Animal Trace | "Trace the line to the animal's food." |
| Pop & Freeze | "Pop the bubbles, but not the sleeping animals." |
| Shadow Match | "Drag each picture onto its shadow." |
| Big vs. Small | "Put the big toys in the big box." |
| Memory Match | "Turn over two cards to find a pair." |
| Number Order | "Put the numbers in order, smallest first." |
| Pattern Builder | "Pick the shape that finishes the pattern." |
| Add It Up | "Add the groups and pick the total." |
| Take Away | "Take some away and pick how many are left." |

## Functional Requirements

### FR1 — Shared instruction API on `GameSceneBase`
A protected helper creates the whole instruction unit in one call:

- renders the prompt line using the existing `textStyle` conventions (same size/color family as other scene labels), centred by default;
- creates a `SpeakerButton` at the suite's standard speaker offset, `muted` when SFX is off;
- speaks the instruction once at creation, gated by `sfxEnabled` exactly as the existing games gate their prompts;
- re-speaks on tap, always reading the *current* SFX setting rather than the value captured at construction;
- accepts optional `x`/`y` overrides so each game can dodge its own artwork;
- registers the created objects with the scene's existing shutdown cleanup so nothing leaks across visits.

### FR2 — All ten games adopt it
Each in-scope game calls the helper with its approved copy. Games whose rounds rebuild content keep the instruction outside the per-round teardown, so the prompt and button survive a round change and are not re-spoken on every round.

### FR3 — Speech gating and availability
- SFX toggle off → silent, and the speaker glyph shows the existing muted presentation (still tappable, per `SpeakerButton`'s documented contract).
- No Web Speech support → static dimmed glyph, no crash, no console noise.
- Reduced motion changes nothing here (no new motion is introduced beyond the button's existing behaviour).

### FR4 — Layout safety
The prompt must not collide with game art in any difficulty band, at the 1024×768 design canvas, and at phone-scale (the game uses `Scale.FIT`, so logical coordinates are constant and this is a per-game art-collision problem, not a responsive one). Placement is chosen per game against its actual vertical bands, not a blind global default.

### FR5 — Tests
Per covered game: prompt text exists with the approved copy; speaker button exists; auto-speak fires once with `sfxEnabled: true`; tapping the speaker speaks again; with SFX off nothing is spoken and the button presents muted; both objects are destroyed on shutdown. The shared helper additionally gets its own focused unit tests so a future change to it is caught once rather than ten times.

## Non-Functional Requirements

- **No regression in the ten speaking games** — they are not refactored by this track.
- **No new dependencies.**
- **No scene grows past ~600 lines**; the helper carries the shared weight.
- Speech copy stays ≤ 12 words and must already match what the game visually asks for (no instruction that describes a mechanic the game does not have).
- Suite stays green and above the coverage gate; `pnpm typecheck` and `pnpm biome check` clean.

## Acceptance Criteria

1. All ten in-scope games display their approved instruction line and a speaker button on first render.
2. The instruction is spoken exactly once on entering the game, and again on every speaker tap.
3. With SFX disabled, no speech occurs and the button reads as muted.
4. On a 96 px-high viewport at phone scale (letterboxed), no prompt overlaps artwork or the progress dots in any band.
5. New tests cover all ten adoptions plus the shared helper; total suite count ≥ 1,982 with no deletions.
6. `pnpm run check`, `pnpm typecheck`, `CI=true pnpm test`, `pnpm run build`, `validate-bundle`, `validate-pwa` and `validate-boot` all pass.

## Out of Scope

- Migrating the ten already-speaking games onto the shared API (deliberately deferred; separate churn).
- Narration during rounds, per-item speech, or voice acting beyond the existing Web Speech path.
- New TTS voices, i18n/locale work, or recorded audio assets.
- Any change to game rules, difficulty, or scoring.

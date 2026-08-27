# Track: Adaptive Difficulty (Numeracy Four)

## Overview

The four numeracy games — **How Many?**, **More or Less**, **Add It Up**, **Take Away** —
currently serve a fixed easy-first band ladder (`[1,1,2,2,3,3]` over 6 rounds) on every
playthrough. This track adds **per-profile adaptive difficulty**: at each playthrough start,
the ladder shifts by at most **one band up or down**, decided by the child's recent accuracy
in that specific game. The goal is a gentle spiral: kids who keep succeeding meet slightly
bigger numbers sooner; kids who struggle get a softer ladder for a while. The change is
**invisible to the child** and fully parent-controllable.

### Design Principles (from product-guidelines.md)

- **No-Fail Design:** adaptation never punishes — a down-shift is silent scaffolding.
- **Never rush:** only the *starting* ladder changes; in-session flow, pacing, and round
  mechanics are untouched.
- **Textless for kids:** no child-facing text, badges, or "level up" moments.
- **Parent transparency:** one device-level Settings toggle + an explanatory note in the
  Learning Progress report.

## Functional Requirements

### FR1 — Rolling Tap Window (new pure module `src/game/adaptiveLogic.ts`)

- Each profile's per-game progress gains an additive field `recent: boolean[]`
  (ordered tap results, `true` = correct), capped to the last `WINDOW_SIZE = 10` entries.
- `recordResult` in `progressLogic.ts` folds each session flush
  (`{correct, wrong}`) into the window (append `correct` trues then `wrong` falses, trim to 10).
  Existing cumulative fields (`plays/wins/correct/wrong`) are unchanged.
- `normalizeProgress` backfills missing/invalid `recent` as `[]` (established
  additive-field merge pattern; old v2 saves migrate on read).

### FR2 — Shift Rule

- `bandShiftFor(recent)` returns `-1 | 0 | 1`:
  - fewer than `MIN_SAMPLE = 6` recorded taps → `0` (new players see the classic ladder);
  - accuracy ≥ `UP_THRESHOLD = 0.9` → `+1`;
  - accuracy < `DOWN_THRESHOLD = 0.6` → `−1`;
  - otherwise `0`.
- Recomputed fresh at every playthrough start from the current window (no persisted shift,
  no hysteresis). Maximum one band step per session.

### FR3 — Shifted Ladders

- Base ladder `[1,1,2,2,3,3]`; shift clamps every step to band range 1..3:
  - `+1` → `[2,2,3,3,3,3]` (band 3 ceiling preserved)
  - `−1` → `[1,1,1,1,2,2]` (band 1 floor preserved; one step max)
- Each game's pure generator gains an optional `shift` parameter
  (default `0` = today's behavior):
  - `countLogic.createPlaythrough(shift?)`, `moreLessLogic.createPlaythrough(shift?)`,
    `addItUpLogic.buildPlaythrough(shift?)`, `takeAwayLogic.buildPlaythrough(shift?)`.
- **Uniqueness invariants must survive shifted ladders** (a band may now serve up to 4
  rounds): How Many? distinct per-band targets reset the used-set when the band's target
  pool (band max) is exhausted; Add It Up / Take Away pair-pool guards must hold
  (band 1 pools of 6 pairs support 4 rounds). More or Less has no cross-round uniqueness
  constraint.

### FR4 — Wiring

- New storage facade `getAdaptiveBandShift(gameId): -1 | 0 | 1` — returns `0` when the
  toggle is off, the window is missing/empty, or the sample is below `MIN_SAMPLE`;
  otherwise the computed shift.
- The four scenes pass the shift into their generator at `create()` time
  (relaunch-safe: re-evaluated on every `create()`).

### FR5 — Parent Controls & Transparency

- `Settings.adaptiveDifficulty: boolean`, additive, **default `true`** (device-level,
  consistent with BGM/SFX/Voice precedents; backfilled by the existing settings merge).
- SettingsPanel gains one parental-gated toggle row ("Adaptive Difficulty") using the
  established switch-toggle row pattern. Off = exactly today's behavior.
- Learning Progress report gains a short static explanatory note (parent-facing text;
  child UI remains textless) describing adaptive difficulty and where to turn it off.

### FR6 — Documentation

- `product.md`: dated amendment (2026-08-27) to §3.2 Replay Variety — "difficulty stays
  fixed" retired **for the four numeracy games only** (start-band adaptation, max ±1).
- `tech-stack.md`: dated Design Update describing the new module, additive storage fields,
  and the settings toggle.

## Non-Functional Requirements

- Zero new dependencies and zero new assets; preload count unchanged.
- Pure logic fully unit-tested (adaptiveLogic, shifted ladders, facade); coverage floors
  (95% lines / 90% stmts / 88% funcs / 85% branches) maintained.
- No change to win detection, sticker awarding, celebration, auto-return, or the parent
  report's cumulative numbers.
- Negligible runtime cost (one window fold per session flush, one ladder remap per
  playthrough start).

## Acceptance Criteria

1. With the toggle ON: a profile with ≥ 90% accuracy over ≥ 10 recorded taps in a numeracy
   game starts its next playthrough one band up; < 60% starts one band down; classic
   ladder otherwise.
2. With the toggle OFF (or < 6 taps, or fresh profile): every playthrough is byte-identical
   in structure to today's `[1,1,2,2,3,3]` behavior.
3. Shifted ladders preserve all existing per-band guarantees (distinct targets where
   required, no repeated pairs within a playthrough, distinct answer options incl. the
   target, subtraction differences never 0, all counts within band max).
4. Old saves (pre-feature v2 and v1→v2 migrations) load cleanly with `recent` backfilled;
   no storage key change.
5. Settings toggle persists, defaults to ON, and gates the entire feature; Learning
   Progress shows the explanatory note.
6. Full suite green (`CI=true pnpm test`), `pnpm run check` clean, build + PWA validation
   pass.

## Out of Scope

- The other 14 games (band families with different structures: Memory Match grids, word
  tiers, Pattern Builder, Color Match, Odd One Out, First Sounds, Find the Letter, and the
  non-band games) — candidates for a follow-up track.
- In-session (mid-playthrough) difficulty changes.
- Per-game parent controls; mastery-star integration; kid-visible difficulty signaling.
- Changes to band definitions themselves (max values, group counts).

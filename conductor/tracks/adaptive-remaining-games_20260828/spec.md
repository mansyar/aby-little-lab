# Spec: Adaptive Difficulty — Remaining Games (Pattern Builder, Odd One Out, Color Match)

> **Track:** `adaptive-remaining-games_20260828` · **Type:** Feature · **Status:** new · **Branch:** `feature/adaptive-remaining-games` · **Created:** 2026-08-28
> This spec is the **Source of Truth** for scope. `plan.md` operationalizes it; deviations require a `tech-stack.md` note per workflow.

## 1. Overview

Three of the twenty games still serve fixed-difficulty playthroughs: **Pattern Builder** (Game 7), **Odd One Out** (Game 14), and **Color Match** (Game 15). Every other game already shifts its band ladder by ±1 using the shared adaptive system (`src/game/adaptiveLogic.ts` + `getAdaptiveBandShift(gameId)` in `src/utils/storage.ts`), introduced in the *Adaptive Difficulty (Numeracy Four)* and *Adaptive Literacy & Memory* tracks.

This track applies the same treatment to the final three, completing **adaptive coverage across all 20 games**. No new assets, no Hub/Settings/UI changes, no new game mechanics — only per-game band ladders inside the existing pure-logic modules and one-line scene wiring.

**Shared adaptive invariants (unchanged, from `adaptiveLogic.ts`):**
- `BandId = 1 | 2 | 3` (1 = easiest) · `BandShift = -1 | 0 | 1`
- `WINDOW_SIZE = 10`, `MIN_SAMPLE = 6`, `UP_THRESHOLD = 0.9`, `DOWN_THRESHOLD = 0.6`
- `BASE_LADDER = [1, 1, 2, 2, 3, 3]` — the classic easy-first ladder
- `bandShiftFor(recent)`: +1 at ≥ 0.9 accuracy, −1 below 0.6, else 0; windows with < 6 taps yield 0
- `shiftLadder(ladder, shift)` clamps every band into 1..3, non-mutating
- Shift is computed **once at playthrough start** (scene `create`), never mid-game
- `Settings.adaptiveDifficulty` off (or no profile / fresh window) ⇒ shift 0 ⇒ classic ladder

## 2. Product Definition Amendment

Product definition (§ cross-game systems, Adaptive Difficulty): "…numeracy five… literacy & memory six… plus Decode It = 12 adaptive games total."

**Amendment:** with this track, adaptive coverage is **15 of 20 games** — the twelve existing plus Pattern Builder, Odd One Out, and Color Match. The remaining five (Shape Sorter, Shadow Match, Big vs. Small, Pop & Freeze, Animal Trace) stay fixed:

- **Pop & Freeze / Animal Trace:** no right/wrong taps by design (documented in the progress decision) — no accuracy signal to shift on.
- **Shape Sorter / Shadow Match / Big vs. Small:** no scene-neutral band dimension today (shape uniqueness consumption, fixed 6+6 grids, scale constants coupled to scene layout). Extending them requires new difficulty dimensions or layout changes — product sign-off required, explicitly out of scope here.

## 3. Per-Game Adaptive Designs

### 3.1 Pattern Builder (`src/game/patternBuilderLogic.ts`)

**Today:** `generatePlaythrough()` serves 6 uniform rounds — pattern type picked uniformly from `ABAB | AABB | ABB`, gap at end (index 3) 50% of the time else middle (1–2), distractors guarded against the correct shape's confusable family.

**Band design (new):** two difficulty axes — pattern complexity and gap position. Distractor confusable guard stays ON in every band (it is an ambiguity guard, not a difficulty knob).

| Band | Pattern types | Gap position |
| --- | --- | --- |
| 1 | `ABAB` only | end (index 3) always |
| 2 | `ABAB`, `AABB`, `ABB` (uniform) | end (index 3) always |
| 3 | `ABAB`, `AABB`, `ABB` (uniform) | end 50% / middle (1–2) 50% — as today |

**Ladder:** per-round bands = `shiftLadder(BASE_LADDER, shift)`:
- shift −1 → `[1,1,1,1,2,2]` · shift 0 → `[1,1,2,2,3,3]` · shift +1 → `[2,2,3,3,3,3]`

**Deliberate behavior change (documented):** shift 0 no longer reproduces the old uniform-random draw — the classic ladder becomes easy-first (2× band 1, 2× band 2, 2× band 3), matching the shape of all 19 other games and the no-fail easy-first philosophy. All other observable properties are preserved: 6 rounds, 4-shape rows, gap never at index 0, 3 unique choices with exactly one correct, confusable-family distractor guard, `A`/`B` shapes distinct and drawn from `ALL_SHAPES`.

**API change:** `generatePlaythrough(shift: BandShift = 0)`. The `roundCount` parameter is dropped if (and only if) no caller or test uses it — the ladder is always 6 rounds, consistent with every other game. New helper `generateRound(band: BandId)` implements the per-band table above; `getCorrectShape(round)` unchanged.

### 3.2 Odd One Out (`src/game/oddOneOutLogic.ts`)

**Today:** `createRound(band: 1|2|3, usedOddTextures)` already exists with three band strategies:
- Band 1: odd item from a **different category** than the group (cross-category, non-frog)
- Band 2: odd item from the **same category**, different item (frogs excluded)
- Band 3: odd and group are both frogs, differing **by color only** (`frog_green/blue/red`)

`createPlaythrough()` hard-codes bands `[1,1,2,2,3,3]` and tracks used odd textures so odds never repeat within a playthrough.

**Band design:** keep the three existing band strategies unchanged. Only the ladder becomes shift-aware:

- shift −1 → `[1,1,1,1,2,2]` (= clamp of `BASE_LADDER − 1`)
- shift 0 → `[1,1,2,2,3,3]` (classic, byte-identical)
- shift +1 → `[1,2,2,3,3,3]` — **deliberate deviation from pure `shiftLadder`**, which would give `[2,2,3,3,3,3]` (four band-3 rounds). `FROG_ITEMS` holds only 3 textures and odds must stay unique, so band-3 rounds are capped at 3 per playthrough; the freed round drops to band 1 (cross-category), keeping the ladder easy-first-ordered and the pool-exhaustion guard (`pickItem` throws only on misuse) untriggerable through normal play.

**API change:** `createPlaythrough(shift: BandShift = 0)`. `createRound`, `isCorrect`, `promptFor` unchanged.

### 3.3 Color Match (`src/game/colorMatchLogic.ts`)

**Today:** `buildPlaythrough()` serves 6 rounds — first 3 from the easy pool (4 basic colors), then 3 from the hard pool (all 6 colors); `buildRound(pool)` samples 4 distinct cards, target random among them; difficulty fixed across replays per the replay-variety principle.

**Band design (split-point model):** a two-pool game maps naturally to a **split point** between easy and hard rounds rather than per-round band strategies:

| Shift | Easy rounds | Hard rounds |
| --- | --- | --- |
| −1 (struggling) | 4 | 2 |
| 0 (classic) | 3 | 3 — byte-identical to today |
| +1 (thriving) | 2 | 4 |

Implementation: `buildPlaythrough(shift: BandShift = 0)` builds `3 - shift` easy rounds then the rest hard. This mirrors the established shape of `startLengthFor(shift)` in Musical Memory: the scene passes the shift, the generator interprets it. All other properties preserved: 4 distinct cards per round, random target, `isCorrect` unchanged, round variety within a playthrough, difficulty fixed across replays for a given shift.

**API change:** `buildPlaythrough(shift: BandShift = 0)`. `buildRound`, `COLOR_POOLS`, `COLOR_CARDS`, `isCorrect`, `promptFor` unchanged.

## 4. Adaptive Plumbing

Reuse only — **no changes to `adaptiveLogic.ts` or `storage.ts`**:

- `getAdaptiveBandShift(gameId)` already returns the shift for any `GameId` (respecting the Settings toggle and per-profile windows); the three ids `pattern-builder`, `odd-one-out`, `color-match` are valid `GameId`s.
- Scene wiring (one line each, mirroring the ten existing call sites):
  - `PatternBuilderScene`: `this.rounds = generatePlaythrough(getAdaptiveBandShift("pattern-builder"))`
  - `OddOneOutScene`: `this.rounds = createPlaythrough(getAdaptiveBandShift("odd-one-out"))`
  - `ColorMatchScene`: `this.rounds = buildPlaythrough(getAdaptiveBandShift("color-match"))`
- Session completion already folds `correct`/`wrong` into each profile's rolling window (`updateRecentWindow` via `progressLogic.ts`) — the three games already record taps, so no progress-logic changes are needed. (Verified during implementation; if folding is absent for any of the three, that is a deviation → STOP and document in `tech-stack.md`.)

## 5. Non-Functional Requirements

- **No-fail design:** wrong taps never punished; gentle feedback untouched.
- **Invisible to kids:** no new UI, copy, or prompts; difficulty shifts only.
- **Replay variety:** rounds vary within a playthrough; difficulty fixed within a playthrough and across replays at the same shift.
- **Determinism in tests:** generators stay `Math.random`-based; tests assert structural invariants and distributions (band-respecting types/gaps, unique frog odds, distinct cards, pool split), never exact seeds.
- **Byte-compat fixture:** shift 0 must be structurally identical to each game's current ladder (Pattern Builder's documented easy-first adoption is the single, spec'd exception — § 3.1).
- **Performance:** pure logic only; no new assets, no preload changes, no bundle growth beyond a few bytes in three lazily-loaded game chunks.
- **Coverage:** project floors (per `vitest.config` — checked at implementation) hold; new branches 100% covered.
- **Type safety:** `BandShift` flows from `getAdaptiveBandShift` into generator signatures; no `any`.

## 6. Acceptance Criteria

- [ ] Pattern Builder: per-round band table honored per § 3.1 (band 1 ⇒ ABAB + end gap; band 2 ⇒ any type + end gap; band 3 ⇒ any type + end/middle); confusable distractor guard holds in all bands; shift 0 = `[1,1,2,2,3,3]`.
- [ ] Odd One Out: shift 0 = `[1,1,2,2,3,3]`; shift +1 yields ≤ 3 band-3 rounds (frog cap) and odds unique per playthrough; band strategies unchanged.
- [ ] Color Match: easy/hard split = `3 - shift` (4/2, 3/3, 2/4); 4 distinct cards per round; shift 0 byte-identical.
- [ ] Adaptive ON + window ≥ 6 taps at ≥ 90% ⇒ next playthrough one band up; < 60% ⇒ one band down; else classic.
- [ ] `adaptiveDifficulty` off / fresh window ⇒ classic ladder regardless of history.
- [ ] Shift computed once per playthrough (never mid-game).
- [ ] `CI=true pnpm test` green; Biome `pnpm run check` clean; coverage floors hold; `pnpm run build` succeeds.
- [ ] No changes to `adaptiveLogic.ts`, `storage.ts`, Hub, Settings, or assets.

## 7. Out of Scope

- Adaptive treatment for Shape Sorter, Shadow Match, Big vs. Small (needs product sign-off on new dimensions/layout changes).
- New pattern types, shape families, colors, frog textures, or round counts.
- Hub, Settings, progress, sticker, or PWA changes.
- Cross-device sync of progress windows (accepted known issue).

## 8. Dependencies & Risks

- **Dependencies:** shared adaptive helpers (`adaptiveLogic.ts`, `getAdaptiveBandShift`) — stable since the numeracy/literacy tracks; no changes required.
- **Risk — Odd One Out frog cap:** shift +1 deviates from pure `shiftLadder` to respect the 3-texture frog pool. Mitigation: unit test asserts band-3 count ≤ 3 and odds uniqueness; deviation documented in § 3.2.
- **Risk — Color Match semantics:** bands 2–3 both map to "hard pool" via the split-point model rather than three distinct band strategies. Mitigation: mapping table in § 3.3 + byte-compat fixture at shift 0.
- **Risk — Pattern Builder classic change:** easy-first ladder supersedes the uniform draw at shift 0. Mitigation: documented in § 3.1 as the deliberate, spec'd exception; structural invariants (round count, row shape, gap rules, choices, guard) asserted in tests.

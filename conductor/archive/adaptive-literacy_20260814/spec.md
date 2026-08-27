# Track Specification: Adaptive Literacy & Memory

**Track ID:** `adaptive-literacy`
**Branch:** `feature/adaptive-literacy`
**Date:** 2026-08-14
**Status:** Draft — awaiting user review

---

## 1. Overview

Extend the adaptive difficulty band system (shipped for the four numeracy games in track `adaptive-numeracy`) to the six remaining literacy and memory games: **Find the Word**, **Build the Word**, **First Sounds**, **Find the Letter**, **Memory Match**, and **Musical Memory**. Each game gains an Easy and a Hard band alongside its classic behavior, selected per playthrough from the child's recent performance, exactly as the numeracy games already do. No new UI, no new storage, no changes to the existing Settings toggle.

## 2. Problem

The adaptive system currently covers only the numeracy games (Count the Animals, Feed the Monster, Trace the Numbers, Little Sums). The six literacy/memory games always play at their classic difficulty, so:

- A struggling child meets 4-letter words, sound-confusable distractors, and 4×4 match grids at the same rate as everyone else.
- A thriving child repeats the same 2→6 frog sequence and the same tier split every time, with no headroom.

The plumbing to fix this already exists and is game-agnostic: per-game adaptive windows (`getAdaptiveBandShift(gameId)`), the `shiftLadder` clamp, the single `adaptiveDifficulty` toggle, and the shared "How it works" copy. What is missing is the per-game ladder definition and the shift parameter flowing into each generator.

## 3. Goals

1. All six literacy/memory games read their adaptive shift at `create()` and pass it into their pure generator functions, mirroring the numeracy wiring.
2. Each game defines a BASE_LADDER and per-band invariants that are satisfied for every shift in [-1, 0, +1] and every pool size.
3. Shift 0 is **byte-identical** to classic behavior in every generator (regression-proofed by fixtures).
4. All generators remain pure functions with tests; TDD per `conductor/workflow.md`.

## 4. Non-Goals

- No new Settings UI, no new user-facing copy (the existing toggle and "How it works" explanation cover the new games automatically).
- No storage or profile schema changes.
- No changes to the numeracy games' ladders or band definitions.
- No changes to Pop & Freeze / Animal Trace exclusion (they still do not record adaptive windows).
- No new games, assets, or animations.

## 5. Design

### 5.1 Shared mechanics (unchanged)

| Piece | Behavior |
| --- | --- |
| `BASE_LADDER` | `[1, 1, 2, 2, 3, 3]` where a game is band-shaped |
| `shiftLadder(ladder, shift, minBand, maxBand)` | Shifts every band id, clamped in range |
| `getAdaptiveBandShift(gameId)` | Reads the profile's rolling 10-tap window per game (`WINDOW_SIZE=10`, judged from 6 taps, ±1 thresholds 0.9/0.6); respects the global toggle |
| Scene wiring | `create()` reads shift → passes to generator; `recordCorrect`/`recordWrong` already fire per tap |

### 5.2 Per-game ladders

**Band id semantics:** 1 = Easy, 2 = Classic, 3 = Hard.

#### Find the Word (`generateWordPlaythrough`)

Tier-shaped: tier-3 (3-letter) words come before tier-4 (4-letter) words. The shift moves the split point.

| Shift | Round tiers (6 rounds) | Early count formula |
| --- | --- | --- |
| −1 (Easy) | `[3, 3, 3, 3, 3, 3]` | `roundCount − 1 − shift = 6` |
| 0 (Classic) | `[3, 3, 3, 3, 3, 4]` | `= 5` (current behavior) |
| +1 (Hard) | `[3, 3, 3, 3, 4, 4]` | `= 4` |

Invariants: `earlyCount = clamp(roundCount − 1 − shift, 0, roundCount)`; tier-3 pool (8 words) ≥ 6 rounds; tier-4 pool (10 words) ≥ 2 hard rounds; existing unique-target rule preserved.

#### Build the Word (`generateWordBuildPlaythrough`)

Same tier axis over 3 builds.

| Shift | Build tiers (3 builds) |
| --- | --- |
| −1 | `[3, 3, 3]` |
| 0 | `[3, 3, 4]` (current) |
| +1 | `[3, 4, 4]` |

Invariants: `earlyCount = clamp(wordCount − 1 − shift, 0, wordCount)` ≥ 0; tier-4 pool ≥ 2.

#### First Sounds (alphabetPhonics)

Three bands defined by which distractors/targets are allowed. Visual-family exclusion is kept in every band; the **sound-confusable** pairs (B/P, D/T) are the difficulty axis.

| Band | Targets | Distractor guards |
| --- | --- | --- |
| 1 Easy | Phonics letters **excluding {B, P}** (7 letters ≥ 6 rounds) | Classic: exclude sound-confusable + visual families |
| 2 Classic | All 9 letters | Classic guards (current behavior, byte-identical) |
| 3 Hard | All 9 letters | **Sound-confusable pairs allowed** (B may sit next to P); visual-family exclusion kept |

Ladder: BASE `[2, 2, 2, 2, 2, 2]` → Easy `[1×6]`, Hard `[3×6]` via `shiftLadder`.

#### Find the Letter (alphabetLogic.generatePlaythrough)

Three bands; the target-letter pool and the same-family distractor guard carry the difficulty.

| Band | Targets | Distractor guards |
| --- | --- | --- |
| 1 Easy | **A–J only** (first letters taught) | Classic: exclude visual families |
| 2 Classic | Uniform A–Z | Classic guards (current, byte-identical) |
| 3 Hard | Uniform A–Z | **Same visual family allowed** (C next to G/O/Q); target-exclusion and other guards unchanged |

Ladder: BASE `[2, 2, 2, 2, 2, 2]`.

#### Memory Match (memoryMatch)

Already band-shaped (`[easy, easy, medium, medium, hard, hard]`, grids 2×3 → 3×4 → 4×4, pairs 3/6/8). Map `MemoryBand` ↔ band id and apply `shiftLadder` with clamp [1, 3]. All existing per-band invariants (pairs per grid, MEMORY_POOL 16 ≥ 8 pairs) unchanged.

| Shift | Round bands |
| --- | --- |
| −1 | `[easy, easy, easy, easy, medium, medium]` |
| 0 | `[easy, easy, medium, medium, hard, hard]` (current) |
| +1 | `[medium, medium, hard, hard, hard, hard]` |

#### Musical Memory (musicalMemory)

No bands — the shift moves the **starting sequence length**; the growth curve keeps its +1-per-round shape over 5 rounds.

| Shift | Start length | Win length | Rounds |
| --- | --- | --- | --- |
| −1 | 1 | 5 | 5 |
| 0 | 2 | 6 | 5 (current) |
| +1 | 3 | 7 | 5 |

Invariants: `start = clamp(START_LENGTH + shift, 1, 3)`; `winLength = start + 4`; round count stays `winLength − start + 1 = 5`, so `PROGRESS_DOT_COUNT = 5` remains exact at every shift; `MAX_RUN = 2` and fast-note delay (≥ 5) behavior unchanged; `isWin` classic default signature untouched.

### 5.3 Decision record (user-approved 2026-08-14)

1. **Hard-band guard relaxation:** approved. Hard bands deliberately allow confusable distractors (Find the Letter same-family; First Sounds sound-pairs) — discrimination is the skill being stretched. Easy/medium bands keep all guards.
2. **Musical Memory:** adapted via start-length shift (not excluded).

## 6. User Experience

- **Struggling child:** easier playthroughs (all 3-letter words, B/P excluded from First Sounds, A–J letter prompts, all-easy grids, frog runs starting at 1) until their recent window recovers.
- **Thriving child:** harder playthroughs (two 4-letter rounds, minimal-pair distractors, same-family letter choices, 4×4 grids throughout, frog runs reaching 7) once their window sustains correct taps.
- **Toggle off:** every game plays exactly classic; behavior identical to today.
- **Settings "How it works":** already describes per-game adaptation generically; no change needed.

## 7. Testing Strategy

1. **Pure logic (primary):** for each generator, tests for shift −1/0/+1 covering: tier/band sequences, pool-bound satisfaction, uniqueness rules, per-band guard behavior (including that hard bands *can* produce confusable distractors, and easy/medium never do), and shift-0 fixtures byte-identical to classic outputs.
2. **Adaptation plumbing:** `getAdaptiveBandShift` for each new gameId (window mapping, toggle off → 0).
3. **Integration:** playable smoke tests confirming each scene reads the shift and round counts/dots render correctly (5 rounds everywhere).
4. All per `conductor/workflow.md` TDD loop.

## 8. Risks & Edge Cases

| Risk | Mitigation |
| --- | --- |
| Parameterizing `isWin`/win-length breaks classic callers | Keep default-argument signature; classic callers untouched; fixtures assert shift-0 parity |
| Musical Memory dots hardcoded | Derive from computed win length; visual test asserts 5 dots at every shift |
| Find-the-Word unique-target rule vs pool sizes | Asserted per shift in logic tests (8 ≥ 6, 10 ≥ 2) |
| A scene missing `recordCorrect`/`recordWrong` wiring | Audit during implementation; wire any gaps (numeracy track already confirmed these scenes record) |
| Guard relaxation leaking into other bands | Guard tests assert confusable distractors possible only in band 3 |

## 9. Success Criteria

1. All six games produce distinct, valid playthroughs at shift −1/0/+1 with all invariants green.
2. Shift 0 regression fixtures prove byte-identical classic behavior.
3. Toggle off restores today's behavior everywhere.
4. Full suite green; lint clean; TDD commit history per workflow.

## 10. Open Questions

None — both design decisions approved by the user on 2026-08-14.

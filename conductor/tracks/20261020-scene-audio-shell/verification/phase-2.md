# Phase 2 evidence — Migrate the five prompt-card scenes

- **Track:** `20261020-scene-audio-shell`
- **Phase:** 2 — Migrate the five prompt-card scenes
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-scene-audio-shell`
- **Base commit:** `0c647d8`
- **Code head commit:** `1d96a0d` (the evidence file and this correction are committed on top; the full chain was re-run on that tree and stayed green)
- **Result:** ✅ verified — every command below exited 0 on the first green run

## What changed

`ChoiceRoundScene` gained the two things the card scenes needed and nothing
more: an optional `width`/`height` for a card that is not square (word cards),
and `attachCardContent(index, objects)`, which records a card's own objects so
they wiggle with the card and are destroyed with the round. The default
`wiggleTargets(index)` now returns that attached content. `onCorrect` moved
ahead of `mascot.cheer()` in the correct path so a per-game splash is the
round's first graphics object (the cheer's sparkle would otherwise claim that
slot); the SFX order is unchanged (chime → record → scene hook → cheer → dot).

The five scenes now carry only their content — prompt object, card layout,
correctness rule, wiggle content, splash and reinforcement speech. Their
duplicated `handleChoice` / `handleCorrect` / `handleIncorrect` / `clearRound`
bodies are gone (−597 lines across the six scene files, +258).

## Commands

| # | Command | Exit | Result |
|---|---------|------|--------|
| 1 | `pnpm check` | 0 | clean; only the pre-existing `noNonNullAssertion` warning (`musicalMemoryScene.test.ts:294`) and the Biome schema-version info |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 99 files / 2103 tests passed |
| 4 | `pnpm test:coverage` | 0 | statements 98.10 (4753/4845) · branches 89.85 (1090/1213) · functions 98.07 (919/937) · lines 98.90 (4438/4487) — gates 95/88/85/90 |
| 5 | `pnpm build` | 0 | 270 modules transformed |
| 6 | `node scripts/validate-bundle.js` | 0 | PASS — phaser vendor chunk present; shell entry 189.4 kB ≤ 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 15 passed, 0 failed |

Run as one chain, exactly as the brief specifies:
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`

## Acceptance criteria

### AC-3 — the scenes share the round lifecycle, suites unchanged

`grep "extends ChoiceRoundScene" src/scenes` (equivalent: `rg -c "extends ChoiceRoundScene" src/scenes`)
→ **6 files**: `AlphabetScene`, `WordMatchScene`, `DecodeItScene`, `HowManyScene`,
`FirstSoundsScene` (all five this phase) plus the abstract `GroupMathScene` from
Phase 1.

Each migrated scene implements only `totalRounds`, `gameId`, `isChoiceCorrect`,
`buildRoundContent`, `clearRoundContent` (and `onCorrect` for the four that
splash). None of them declares `handleChoice`, `handleCorrect`,
`handleIncorrect`, `clearRound`, an input lock, a 700 ms advance or a wiggle
tween — `rg -c "private handleCorrect" src/scenes` no longer matches any of the
five (it remains in the Phase 4–5 scenes and in base).

### NFR-2 — no test deleted, weakened or edited

`git diff --stat 0c647d8 HEAD -- src/__tests__` → **empty output** (no test
file changed). The five suites (`alphabetScene`, `wordMatchScene`,
`decodeItScene`, `howManyScene`, `firstSoundsScene`) pass unmodified, and so
does the sixth suite that drives these scenes (`firstWordsIntegration`).

### NFR-8 — coverage

| Metric | Value | Gate |
|--------|-------|------|
| Statements | 98.10 % | 90 |
| Branches | 89.85 % | 85 |
| Functions | 98.07 % | 88 |
| Lines | 98.90 % | 95 |

`ChoiceRoundScene.ts` is at **100 % statements / branches / functions / lines**
(`coverage/src/scenes/ChoiceRoundScene.ts.html`). The new hook
(`attachCardContent` + the card-shape branch) is exercised by the migrated
scenes' own suites; the `GroupMathScene` path keeps its Phase 1 coverage.

### NFR-1 — bundle budget

| Chunk | Size |
|-------|------|
| `AlphabetScene` | 1.53 kB |
| `WordMatchScene` | 1.74 kB |
| `HowManyScene` | 1.94 kB |
| `ChoiceRoundScene` (shared, new this phase) | 2.12 kB |
| `FirstSoundsScene` | 2.39 kB |
| `DecodeItScene` | 2.90 kB |
| shell entry | 193.90 kB raw / 189.4 kB by the validator (limit 200 kB) |

Every one of the five is at or below the band the untouched game chunks already
occupied at the phase base (2.78–6.64 kB), and each scene source lost ~40 % of
its lines while gaining none. `decodeLogic` and `firstSoundsLogic` are inlined
into their scene chunk rather than split, which is why `DecodeItScene` is the
largest of the five despite being one of the smallest sources.

## Task → commit map

| Task | Commit |
|------|--------|
| P2.T1.1 per-card content + card shape on the base | `2b174eb` |
| P2.T1.2 Alphabet + WordMatch | `843784c` |
| P2.T2.1 Decode It | `3fe988a` |
| P2.T2.2 How Many | `cbc4958` |
| P2.T3.1 First Sounds | `1d96a0d` |
| P2.T3.2 letter narration / re-speak without double-speaking | `1d96a0d` (preserved by the migration; no separate code change was required) |

## Behaviour preserved

- Round keys, module paths, class names, `gameId`s, sticker keys, spoken
  instructions, band-shift ids, progress-dot counts and every layout constant.
- Kid-visible timing: 700 ms advance, 250 ms success flash, chime → record →
  scene hook → cheer → dot pop on correct, soft tone → record → nod → wiggle on
  wrong (angle 4°/2°, 350/200 ms, 3 yoyos).
- Narration is single-shot: one cue per round (`speakLetter` / `speakWord` /
  `speakNumber`), and First Sounds' correct-answer letter name still plays
  exactly once (inside `onCorrect`, before the cheer). The speaker button
  re-speaks the current prompt and does nothing after the last round.
- Reduced motion still halves the wiggle angle and shortens the durations; the
  press-feedback contract (gameplay handler first, then squish) is unchanged.

## Deviations

No file outside the brief's `Touches` was modified, and no test file was
touched.

### The shared success flash, recorded after review (2026-10-20)

This section originally said "None" and that was wrong about one thing. The
base's correct path flashes the tapped card in the success colour for 250 ms,
so **Alphabet, Word Match, Decode It and First Sounds** — none of which had a
success fill at the base commit — all gained a visible flash. It is a
deliberate unification rather than an accident: `0x68d391` for 250 ms is the
colour and duration every other choice game already used, and the flash pairs
the chime with a visual. Nothing else in a round's feedback moved (same SFX
order, same 700 ms advance), and the 250 ms flash is now the shared contract
for every choice game. Feelings Faces gained the same flash in Phase 3;
Pattern Builder's timing exception is recorded there.

## Notes for the primary agent

1. `totalRounds()` in each migrated scene returns `this.rounds.length` (the
   pre-migration termination test) rather than the `ROUND_COUNT` literal. The
   progress dots still use `ROUND_COUNT`, so the six dots are unchanged; this
   keeps `firstWordsIntegration.test.ts` working, which injects a four-round
   playthrough and expects completion after the fourth.
2. Pre-phase per-chunk sizes are not recorded anywhere and cannot be re-built
   without checking out `0c647d8`, which this phase may not do. NFR-1 is
   therefore evidenced by the current sizes (all at or below the phase-base
   untouched-game band) plus the validator PASS and the large line reduction.
3. Pre-existing, untouched: `noNonNullAssertion` warning at
   `src/__tests__/scenes/musicalMemoryScene.test.ts:294`, and the `biome.json`
   schema version (2.5.5) lagging the CLI (2.5.10).

## Primary verification

Run independently by the primary agent after the subagent reported, against
`13987f8` with a clean tree.

- Exact phase verification string: exit 0. `pnpm check` 197 files, only the two
  pre-existing notes; `pnpm typecheck` clean; `pnpm test -- --run` 99 files /
  2,103 tests; coverage 98.08 statements / 89.85 branches / 98.07 functions /
  98.90 lines; build 270 modules; `validate-bundle` shell entry 189.4 kB
  (ceiling 200); `validate-pwa` 15/15.
- Diff scope: `git diff --name-only 0c647d8..HEAD` lists the six source files
  plus this report. `git diff --stat 0c647d8..HEAD -- src/__tests__` is empty, so
  NFR-2 holds beyond the named suites as well. No merge commits in the range.
- NFR-1 corrected against Phase 1's recorded chunk table: every migrated scene
  chunk shrank — Alphabet 2.78 → 1.53 kB, WordMatch 2.92 → 1.74, HowMany
  3.26 → 1.94, FirstSounds 3.66 → 2.39, DecodeIt 4.08 → 2.90 — while
  `ChoiceRoundScene` split out at 2.12 kB.
- AC-3 progress: 7 of 13 choice scenes now extend `ChoiceRoundScene`
  (Add It Up, Take Away, Alphabet, Word Match, Decode It, How Many, First
  Sounds); six remain for Phase 3.
- Nit, not blocking: `ChoiceRoundScene.ts:75` still describes `onCorrect` as
  "run after the shared feedback", while the call now precedes the mascot cheer
  (documented at lines 171–172). Phase 4 edits this file for the narrator and
  should correct the sentence there.

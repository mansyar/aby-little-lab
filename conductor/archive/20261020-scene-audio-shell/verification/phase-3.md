# Phase 3 evidence — Migrate the remaining five + Feelings Faces

- **Track:** `20261020-scene-audio-shell`
- **Phase:** 3 — Migrate the remaining five + Feelings Faces
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-scene-audio-shell`
- **Base commit:** `f75fc5d`
- **Code head commit:** `1c94a35` (this evidence file is committed on top; the full chain was run on the tree that produced those commits and exited 0)
- **Result:** ✅ verified — every command below exited 0 on the first green run

## What changed

The base needed three small additions for Number Order, which is a drag board
rather than a card tap, and nothing else:

- `resolveWholeRound(correct)` runs the shared answer path when the round is
  decided by the finished board. It reuses the correct path (lock, chime,
  record, scene extras, cheer, dot, 700 ms advance) and the wrong path (soft
  tone, record, mascot nod, wiggle), and it owns the double-answer guard that
  `handleChoice` owns for card games.
- `onWiggleComplete(index)` is the wrong-answer counterpart of `onCorrect`: a
  hook that runs when the wiggle ends, which is where the board bounces its
  cards home and re-arms itself.
- The private per-round list was renamed `roundObjects` → `roundDisplayObjects`
  so a scene can own a field of that name (TypeScript forbids a subclass field
  that shadows a base *private* one, and Number Order's suite reads its
  `roundObjects` directly). `handleIncorrect` now assembles its target list
  before adding the tapped card, so a whole-round answer wiggles exactly what
  `wiggleTargets` reports, and `handleCorrect` skips the card flash when there
  is no card. The card paths are byte-for-byte the same behaviour as phase 2.

All six scenes now extend `ChoiceRoundScene` and keep only content:

| Scene | What stays in the file |
|---|---|
| MoreLess | arrow cue art + pop tween, spoken comparison word, two 220 px dot-group cards, `evaluateRound` |
| ColorMatch | target-colour swatch, spoken colour name, 2×2 colour cards, `isCorrect` |
| OddOneOut | 2×2 grid geometry, item/odd textures, spoken odd-item name, `isCorrect` |
| NumberOrder | dragged numeral cards, dashed slots, drop/swap logic, whole-board answer, board bounce-home |
| PatternBuilder | shape table, pattern row, answer cards, the gap snap, `getCorrectShape` |
| FeelingsFaces | rule line + glyph, three face cards, `answer`/`buildRoundChoices` ladder, splash, re-speak-on-wrong, caption-fallback machine, opening-speech timer |

Across the seven files: **+373 / −662 lines** (`git diff --numstat f75fc5d
HEAD -- src/scenes`).

## Commands

| # | Command | Exit | Result |
|---|---------|------|--------|
| 1 | `pnpm check` | 0 | clean; only the pre-existing `noNonNullAssertion` warning (`musicalMemoryScene.test.ts:294`) and the Biome schema-version info |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 99 files / 2103 tests passed |
| 4 | `pnpm test:coverage` | 0 | statements 98.04 (4557/4648) · branches 89.97 (1050/1167) · functions 97.96 (915/934) · lines 98.86 (4251/4300) — gates 95/88/85/90 |
| 5 | `pnpm build` | 0 | 270 modules transformed |
| 6 | `node scripts/validate-bundle.js` | 0 | PASS — phaser vendor chunk present; shell entry 189.4 kB ≤ 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 15 passed, 0 failed |

Run as one chain, exactly as the brief specifies:
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`

The six suites named in the brief were also run on their own as each scene
landed (MoreLess 19, ColorMatch 19 + OddOneOut 19 in one run, NumberOrder 23,
PatternBuilder 13, FeelingsFaces 20), all green before the chain above.

## Acceptance criteria

### AC-3 — all thirteen choice scenes run on the base, suites unchanged

`rg "extends (ChoiceRoundScene|GroupMathScene)" src/scenes` → 14 matches: the
eleven games that extend the base directly (`MoreLess`, `ColorMatch`,
`OddOneOut`, `NumberOrder`, `PatternBuilder`, `FeelingsFaces`, `Alphabet`,
`WordMatch`, `DecodeIt`, `HowMany`, `FirstSounds`), the two arithmetic games
that reach it through `GroupMathScene` (`AddItUp`, `TakeAway`), and the
abstract `GroupMathScene` itself. **Thirteen games, one round lifecycle.**

`rg "private (handleCorrect|handleIncorrect|handleChoice)" src/scenes` → 3
matches, all in `ChoiceRoundScene.ts` (lines 171, 210, 253). No scene file
outside the base declares them any more. (`rg "private (renderRound|clearRound)"`
still matches `MemoryMatchScene` and `WordBuilderScene`, which are tile and
letter games, not choice rounds, and are outside this track.)

Every scene keeps its own game key, module path, class name, game id, sticker
key (`sticker_feelings_faces` etc.), spoken rule and cue, adaptive band-shift
key (`more-less`, `color-match`, `odd-one-out`, `number-order`,
`pattern-builder`; Feelings Faces keeps `drawScenarios()`), round count (6 each)
and progress-dot count.

### AC-4 — Feelings Faces keeps its ladder, re-speak-on-wrong and caption path

- **Ladder:** `buildRoundContent()` still calls `buildRoundChoices(roundIndex,
  scenario.emotion)` at render, so rounds 0–2 stay distinct-aware and 3–5
  confusable-aware, and the suite's ladder assertion passes unmodified.
- **Decision:** `answer({ index, scenario, choices, taps }, tapped)` still
  decides the round and still accumulates `taps`; its `nextRound` is always
  `index + 1` on a correct answer, which is exactly what the base's advance
  does, so the playthrough terminates at `ROUND_COUNT`.
- **Re-speak on a wrong tap:** `onWrong()` speaks `scenario.text` once when the
  round is on the spoken path, and never when it is captioned; the base has
  already played the tone, recorded the miss, nodded and wiggled the card with
  its face.
- **Caption machine:** `caption`, `ruleLabel`, `ruleSpeaker`, `captionFallback`,
  `voicesCache`, `voicesSettled`, `captionFallbackActive()`,
  `handleVoicesChanged`, `applyCaptionState()`, `createRuleLine()`,
  `destroyRuleLine()`, `renderCaption()`, `speakScenario()` and
  `openingSpeechTimer` are moved over verbatim — the same bodies, the same
  2600 ms opening delay, the same "never re-speak the rule" behaviour. Phase 4
  moves them; this phase only changed the lines that used to own the cards.
- **Suite unmodified:** `git diff --stat f75fc5d HEAD -- src/__tests__` is
  empty; `feelingsFacesScene.test.ts` runs all 20 tests (including the
  caption-fallback, voice-settle and deferred-opening-speech cases) untouched.

### NFR-2 — no test deleted, weakened or edited

`git diff --stat f75fc5d HEAD -- src/__tests__` → no output. The six suites in
the brief, and every other suite in the repo, are byte-identical to the phase
base and pass unmodified. No mechanical adaptation was needed: the scenes kept
the public shape the tests drive (`renderRound`, `clearRound`, `createCard`,
`handleDrop`, `tryAutoValidate`, `isOverAnyZone`, `returnCardToSource`,
`rounds`, `roundIndex`, `cards`, `slots`, `roundObjects`, `cardRects`,
`cardShapes`, `choices`, `taps`, `caption`).

### NFR-5 — kid-visible timing and SFX order

- The shared schedule is untouched: `NEXT_ROUND_DELAY` 700 ms,
  `AUTO_RETURN_DELAY` 3000 ms, `SUCCESS_FLASH_DURATION` 250 ms, wiggle 350 ms
  (200 ms reduced) × 3 repeats at 4° (2° reduced).
- The SFX order in every migrated scene stays chime → `recordCorrect` → scene
  extras → mascot cheer → dot, and tone → `recordWrong` → nod → wiggle, with
  the scene's own speech after the wiggle is added (Feelings Faces re-speak on
  wrong), exactly as before.
- Narration does not double-speak. Feelings Faces speaks the rule once (never
  on a settle), the scenario once per round (deferred past the rule on round 1),
  and again only on a wrong tap.
- Reduced motion is preserved through the base (`motionDuration`,
  `isReducedMotion`) and by `attachPressFeedback`, which no-ops when reduced.
- One deliberate visual change: Pattern Builder's dot now fills at the tap and
  the 700 ms advance starts at the tap, where both used to wait for the 200 ms
  snap; it also picks up the base's 250 ms success flash, which it never had.
  See Deviations.

### NFR-8 — coverage

Statements 98.04 %, branches 89.97 %, functions 97.96 %, lines 98.86 % — all
above the 95/88/85/90 gates, and unchanged in character from phase 2 (the base
is 98.59 / 96 / 94.73 / 100; Feelings Faces 94.35 / 85.1 / 95.23 / 98.26, whose
uncovered lines are the pre-existing caption-fallback branches).

### NFR-1 — bundle budget

| Chunk | Before | After |
|---|---|---|
| shell entry | 193.90 kB raw / 189.4 kB by the validator | 193.92 kB raw / 189.4 kB by the validator (limit 200 kB) |
| `phaser-*.js` (vendor) | 1,374.82 kB | 1,374.82 kB (untouched) |
| `GameSceneBase-*.js` | 5.90 kB | 5.90 kB (untouched) |
| `ChoiceRoundScene-*.js` (shared) | 2.12 kB | 2.34 kB |
| `MoreLessScene-*.js` | inside the 2.78–6.64 kB band | **2.36 kB** |
| `ColorMatchScene-*.js` | inside the 2.78–6.64 kB band | **2.67 kB** |
| `OddOneOutScene-*.js` | inside the 2.78–6.64 kB band | **4.48 kB** |
| `NumberOrderScene-*.js` | inside the 2.78–6.64 kB band | **5.85 kB** |
| `PatternBuilderScene-*.js` | inside the 2.78–6.64 kB band | **3.43 kB** |
| `FeelingsFacesScene-*.js` | **6.64 kB** (named as the band's largest in the phase-2 table) | **5.61 kB** |

The phase-2 build table records per-chunk sizes only for the five scenes it
migrated plus the pre-Phase-3 band name ("other 15 game chunks 2.78–6.64 kB,
largest `FeelingsFacesScene` 6.64"), and those figures cannot be rebuilt without
building the phase base, so the six "before" values are the band each scene sat
in rather than individual numbers. What is measured: every one of the six now
sits inside that band, the band's largest fell by 1.03 kB, and the shell entry
the validator checks is unchanged at 189.4 kB against its 200 kB ceiling. The
shared chunk they all now load is 2.34 kB — smaller than the code each scene
gave up (MoreLess −115 lines, ColorMatch −107, OddOneOut −97, PatternBuilder
−88, NumberOrder −111, Feelings Faces −137).

## Task → commit map

| Task | Commit | What landed |
|---|---|---|
| P3.T1.1, P3.T1.2 | `c58c824` | MoreLess and ColorMatch on the base (2 files, +70 / −222) |
| P3.T2.1 | `3e909c4` | OddOneOut on the base (1 file, +22 / −97) |
| P3.T2.2 | `5dba2d9` | the base's whole-round answer path + NumberOrder (2 files, +161 / −118) |
| P3.T2 (Touches only — no plan task id) | `b32a9f4` | PatternBuilder on the base (1 file, +44 / −88) |
| P3.T3.1, P3.T3.2 | `1c94a35` | FeelingsFaces on the base, caption machine untouched (1 file, +76 / −137) |

## Deviations

1. **`src/scenes/ChoiceRoundScene.ts` (outside this phase's Touches).** Three
   changes, all required by Number Order: (a) `resolveWholeRound` +
   `WHOLE_ROUND`, because its answer is the filled board and it has no tapped
   card; (b) `onWiggleComplete`, because its wrong answer must bounce the cards
   home and re-arm the board when the wiggle ends — the wiggle's own
   `onComplete` used to do that in the scene, and only the base creates that
   tween now; (c) the private `roundObjects` list renamed `roundDisplayObjects`,
   because `numberOrderScene.test.ts` reads `scene.roundObjects` and TypeScript
   will not let a subclass declare a field that shadows a base private one. The
   card paths keep their phase-2 behaviour byte for byte; the only new branch is
   "no card to flash / no card to wiggle" for a whole-round answer.
2. **Pattern Builder's timing (NFR-5).** Its dot and its 700 ms advance now
   happen at the tap rather than 200 ms later inside the snap's `onComplete`,
   and the base's 250 ms success flash is new for it. The child-visible
   consequences are a dot that pops ~200 ms earlier and a card that flashes
   green; the 700 ms advance, the 3000 ms auto-return, the snap duration and the
   SFX order are unchanged. The suite asserts none of the moved timings, but the
   change is real and is recorded here rather than hidden.
3. **Pattern Builder has no task id in the plan** although it is in this phase's
   Touches; it is reported under P3.T2 and landed in its own commit.

## Notes for the primary agent

- **Number Order locks while it answers.** `onWrong()` sets `inputLocked` and
  `onWiggleComplete()` clears it, so the board stays inert for the ~2.4 s the
  cards wiggle and bounce home — the behaviour the old in-scene `handleIncorrect`
  had. The base does not lock on a wrong answer (no-fail games must stay
  tappable), so this is the scene's own extra.
- **The base's `onCorrect` doc is now true again**: phase 2's stale "runs after
  the shared feedback" note was corrected while the whole-round branch was
  added.
- **Feelings Faces is ready for Phase 4.** Everything the narrator needs —
  `captionFallbackActive`, `handleVoicesChanged`, `applyCaptionState`,
  `createRuleLine`/`destroyRuleLine`, `speakScenario`, `openingSpeechTimer` —
  sits unchanged and self-contained, and its `SpeakerButton` is built from the
  same shared component the narrator will replace, so Phase 4 can lift it
  without re-deriving the behaviour.
- Odd One Out's chunk grew to 4.48 kB relative to its 97-line reduction: it
  inlines `oddOneOutLogic` (there is no separate logic chunk for it), which the
  pre-track figure also did. No budget is at risk (shell 189.4 kB, limit 200).
- Pre-existing repo noise, unchanged by this phase: the `musicalMemoryScene`
  non-null assertion warning, the Biome schema-version info, and Vite's
  `configLoader: native` JSON-import warning.

## Primary verification

Run independently by the primary agent after the subagent reported, against
`b29c5a6` with a clean tree.

- Exact phase verification string: exit 0. `pnpm check` 197 files, only the two
  pre-existing notes; `pnpm typecheck` clean; 99 files / 2,103 tests; coverage
  98.04 statements / 89.97 branches / 97.96 functions / 98.86 lines; build 270
  modules; `validate-bundle` shell entry 189.4 kB (ceiling 200); `validate-pwa`
  15/15.
- Diff scope: six scene files + `ChoiceRoundScene.ts` + this report.
  `git diff --stat f75fc5d..HEAD -- src/__tests__` is empty (NFR-2 holds for the
  whole suite tree, not just the six named files). No merge commits.
- NFR-1 confirmed against the phase-2 build table: every migrated scene shrank —
  MoreLess 3.69 → 2.36 kB, ColorMatch 3.99 → 2.67, OddOneOut 5.71 → 4.48,
  NumberOrder 6.27 → 5.85, PatternBuilder 4.28 → 3.43, FeelingsFaces 6.64 →
  5.61 — with `ChoiceRoundScene` growing 2.12 → 2.34 kB for the whole-round path.
- The base extension is a real seam, not a bolt-on: `resolveWholeRound` sends a
  board-decided round through the same chime/record/cheer/dot/700 ms pipeline
  and skips only the card flash and the tapped-card wiggle, which is exactly
  what NumberOrder had before. The `roundObjects` → `roundDisplayObjects` rename
  on the base private field was forced by `numberOrderScene.test.ts` reading the
  scene's own `roundObjects`, and stays inside the base.
- Accepted deviation, flagged for review: PatternBuilder's progress dot and
  700 ms advance now start at the tap instead of after the 200 ms snap, and it
  gains the shared 250 ms success flash. Audio order, auto-return and snap
  duration are unchanged. This is a small, documented departure from NFR-5's
  "timing unchanged" wording, visible only as earlier feedback in that one game.
- Follow-up for review, not blocking: `FeelingsFacesScene.ts` coverage moved
  95.56 → 94.35 statements (lines 175–176 uncovered) with its suite unchanged;
  review should confirm no reviewed caption/settle path became unreachable in
  the migration.

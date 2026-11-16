# Specification: Fix-It Machine

## Overview

Fix-It Machine is the app's 24th game and its first *debugging* game. A friendly
workshop machine follows a tape of picture-instruction cards to finish one job on
one toy. One card is wrong, so the machine does something silly instead. The
child taps the card they think is wrong, picks the right tool from a three-card
repair tray, and presses Go again.

It teaches the half of programming that Robot Path does not: a program can be
*read*, *watched*, and *repaired where it went wrong*, and the machine follows
what the cards say rather than what the child meant. There is no failure state,
no timer, no score and no text — the same contract every game in the suite keeps.

## Problem / Motivation

- **The suite's coding ladder stops at authoring.** Robot Path (game 23) lets a
  child build a program from direction arrows and run it. Nothing in the suite
  asks the child to find the one instruction that is wrong, which is the skill
  the early-childhood evidence says four-year-olds are most ready for and which
  commercial coding products largely skip.
- **Diagnosis is easier than generation at four.** Four-year-olds judge an error
  in a familiar sequence correctly on 83–96% of trials, and when invited to fix
  it they attempt a correction 90% of the time and get it right 93% of the time —
  before they can produce the correct procedure themselves. By contrast only
  24.6% of four-year-olds (mean age 4.83) produce a functional repeat-N program,
  and their dominant error is loop scope, not counting.
- **Products mostly let the child run and retry.** In a 526-child Bee-Bot study
  children stopped after one or two attempts (85.4%) and most rebuilt the program
  from scratch rather than repairing it; only 22.8% identified, located *and*
  fixed an error. Making repair the mechanic is the difference this game sells.
- **The suite already has the foundations.** `GAME_REGISTRY` declares every game
  once, `ChoiceRoundScene` resolves whole rounds (Story Order and Robot Path do
  exactly that), per-game art rides the game's own lazy chunk, the `?e2e=1`
  bridge already publishes what a journey needs, and `audioIdentity` gives a new
  game its own feedback trio without new audio assets.

## Goals and Success Metrics

- **Goal:** a child finds the one wrong instruction and repairs it in place.
  - *Metric:* the browser journey diagnoses round 1, replaces the card, runs the
    machine again and completes the round (`verification/phase-5.md`).
- **Goal:** a wrong card tap is information, never a penalty.
  - *Metric:* unit and scene tests prove a non-bug tap changes nothing but its
    own feedback — tape, round index and tray state are untouched.
- **Goal:** the goal is never a memory test.
  - *Metric:* the goal picture is on screen for the whole round and a scene test
    asserts it exists before, during and after a run.
- **Goal:** hints rescue a stuck child without ever doing the work for them.
  - *Metric:* a scene test drives six wrong taps and asserts the three hint
    levels fire at 2, 4 and 6 and that no hint calls the repair path.
- **Goal:** nothing that already works changes.
  - *Metric:* the pre-existing hub, paging, progress, art and browser suites stay
    green with only their counts restated (23 → 24); no assertion is removed or
    loosened.
- **Goal:** project health gates hold.
  - *Metric:* coverage ≥ 95/88/85/90, shell entry ≤ 200 kB, full gate exit 0 on
    every phase.

## Scope

### In scope

- `fix-it-machine` as a registered game in the `thinking` group, appended last
  (24th), with its Hub tile and sticker.
- A pure, Phaser-free `src/game/fixItMachineLogic.ts`: the six action icons and
  their three families, the six toys, the six fixed round specs, seeded
  generation of one substitution bug, diagnosis and repair validation, the hint
  level, and solve detection.
- A game scene: goal picture, instruction tape, the machine, Go, card-by-card
  execution, tap-to-diagnose, the three-candidate repair tray, the three-level
  hint ladder, whole-round resolution and the celebration.
- Workshop art in the game's own lazily-loaded module (six tool icons, four
  machine poses, six toy goals), plus the two shell assets every game has.
- A browser journey that diagnoses, repairs and completes three rounds.
- Restating every count-bearing suite and document to 24.

### Out of scope

- Loops, repeat blocks, conditionals, functions or variables (later-stage
  concepts; see D2 and the references).
- Silent-omission or card-swap bugs, and any drag-to-reorder interaction (D2, D4).
- Adaptive band shifts for this game (D6), and any new profile or storage field.
- Scores, attempt limits, timers, star ratings or a "fewest taps" goal.
- A 25th game or any change to the Hub layout maths beyond restating counts
  (D12 records the consequence).
- Any change to another game's behaviour, the storage schema, or the shell's
  existing keys.

## Functional Requirements

- **FR-1** — `GAME_REGISTRY` gains a 24th entry appended after `robot-path`:
  `gameId: "fix-it-machine"`, `group: "thinking"`, `sceneKey: "FixItMachine"`,
  `label: "Fix-It Machine"`, `tileKey: "tile_fix_it_machine"`,
  `stickerKey: "sticker_fix_it_machine"`. `GameId` gains `"fix-it-machine"`. No
  existing entry changes, so every stored id, sticker and tile index keeps its
  meaning.
- **FR-2** — A round shows one **toy goal** and a **tape** of 3 to 5 instruction
  cards. A card is one of exactly six action icons: `spray` and `pour` (liquid
  family), `paint` and `polish` (coat family), `lift` and `stack` (move family).
  No action icon repeats within a round's correct program.
- **FR-3** — Exactly one card on the tape is wrong, and it is always a
  **substitution**: its action differs from the correct one while the card's
  position and the rest of the tape are right. The wrong card is never the first
  card, so the run always shows at least one correct step before it diverges.
- **FR-4** — The wrong action comes from the round's **similarity band**: rounds
  1–2 draw it from a different family, rounds 3–4 from the same broad band (a
  related tool), rounds 5–6 from the same family as the correct action. Both
  members of every pair differ in silhouette, never in colour alone.
- **FR-5** — The Go button (112×112) executes the tape in order at 550 ms per
  card, highlighting each card as it fires and playing the machine's action for
  it. Input is locked for the run's duration and a tap during a run is ignored.
  With `prefers-reduced-motion` the per-card delay drops to 120 ms and the
  machine's motion becomes a static pose change.
- **FR-6** — Running a tape with the wrong card produces a **visible, comic
  mismatch** with the goal picture (the toy gets soaked, the cat gets sprayed),
  plays the game's gentle "uh-oh" tone, and changes nothing else: the tape keeps
  every card in place, the round index does not advance, no sticker is awarded
  and no penalty of any kind is applied. The machine then returns to its idle
  pose so the child can try again.
- **FR-7** — The goal picture is visible for the whole round, before, during and
  after a run, and is never covered by the tape, the tray or the Go button.
- **FR-8** — Tapping a card lifts it and asks the logic layer whether it is the
  wrong one. If it is, the machine gives a short pleased reaction and the
  **repair tray** opens with three candidates: the correct action plus two
  distractors from the round's band, in a seeded order. If it is not, the card
  bounces back to the tape with a soft wobble and nothing else changes — the
  tape, the tray state and the round index stay as they were.
- **FR-9** — Tapping a tray candidate replaces the lifted card. The correct
  candidate snaps in with the chime, the tray closes and the tape is whole
  again; a distractor bounces back, the tray stays open and the card stays
  lifted. A repaired tape is always legal: every card is executable, so the
  machine can never be broken or stopped.
- **FR-10** — Every diagnosis tap and every tray tap records exactly one result
  through the shared recorder — a correct one for the bug card or the correct
  candidate, an incorrect one otherwise. A round that is run successfully records
  one win. Nothing else writes progress, and no new field or schema change is
  added.
- **FR-11** — The hint ladder runs on **wrong diagnosis taps only** and is
  visual only:
  - after 2 wrong taps, a soft band highlights the tape from the first card
    through the wrong card, and the machine's arm points at the band's end;
  - after 4, the wrong card lifts and pulses once;
  - after 6, the correct tray candidate pulses once (and the tray is open only
    if the bug card has been found, so this level can only fire once the tray
    exists).

  No hint ever places a card or taps for the child. Hints clear when the round
  changes and whenever a diagnosis is correct.
- **FR-12** — The game is a fixed ladder of six rounds: card counts 3, 3, 4, 4,
  5, 5 and similarity bands `different`, `different`, `related`, `related`,
  `same-family`, `same-family`. Every round is winnable in exactly one repair,
  and the tape is drawn from the round's `ROUND_SPECS` entry with a seeded
  generator so the same seed deals the same rounds and distractors.
- **FR-13** — The game speaks one rule line — "Find the wrong card and fix it." —
  through the shared narrator with the shared speaker glyph, spoken once when the
  round is set up and replayable on tap, silent and dimmed when SFX is off or the
  device has no voice. No other text appears during play.
- **FR-14** — The workshop art lives in `src/game/fixItMachineArt.ts` and is
  rasterized by the scene's own `preload()`: six tool icons, four machine poses
  (idle, working, puzzled, happy) and six toy goals. Only the Hub tile and the
  sticker join the boot shell, as for every game.
- **FR-15** — The `?e2e=1` bridge gains one read-only `fixItMachine()` hook
  publishing `{ round, steps, bugIndex, solved, wrongTaps, hintLevel, trayOpen,
  tapePoints, trayPoints, goPoint }` — drawn values, not recomputed ones.
- **FR-16** — The Hub shows 24 tiles (rows 6/6/6/6, which fills the 6×4 grid
  exactly), phones page as 10 + 10 + 4, the `thinking` group holds 8 games, and
  the Learning Progress report has 24 rows in pages of 6 + 6 + 6 + 6. The shell
  holds 62 keys and the app 201 (the new game contributes 2 shell keys and 8 app
  keys).
- **FR-17** — `README.md`'s Mini-Games list, `docs/PRD.md`'s game headings and
  `docs/TDD.md`'s §4.5 table each describe 24 games in registry order with the
  matching labels and scene key, and every governed document states the current
  suite truth (files and tests) and journey counts.

## Non-Functional Requirements

- **NFR-1** — Touch geometry: cards 96×96 with at least 8 px gaps (five slots =
  528 px), Go 112×112, tray candidates 96×96 — every target at or above the
  project's 64 px floor and inside the 1024×768 canvas without overlap.
- **NFR-2** — No new dependency, storage key, schema change or network call. The
  game reads settings only for SFX/voice state, like every other scene.
- **NFR-3** — The shell entry stays ≤ 200 kB (182.5 kB today) and every new SVG
  is ≤ 4 kB; the workshop art rides the game's own lazy chunk.
- **NFR-4** — Accessibility: icons differ by shape as well as colour, no
  information is carried by colour alone, motion is never required to understand
  the round, `prefers-reduced-motion` shortens every tween and the run, and no
  audio cue is harsh, startling or longer than 1.2 s.
- **NFR-5** — Coverage gates hold (lines 95 / functions 88 / branches 85 /
  statements 90); the new logic module's named paths — every band, the
  never-first-card rule, hint levels 1–3, wrong-tap no-ops, tray replacement and
  solve detection — each have a test.
- **NFR-6** — The scene takes an injected random generator, like every other
  scene since the RNG seam, so tests seed rounds and distractors.
- **NFR-7** — No on-screen text during play, no timers, no countdowns and no
  pressure of any kind; a tap's visible response is immediate (state change in
  the same frame).
- **NFR-8** — The game must be playable from a cold tap with the art prewarmed by
  the Hub's existing idle queues, adding no new prewarm engine.

## Acceptance Criteria

- **AC-1** — The registry, `GameId`, tile and sticker keys match FR-1 exactly and
  the roster suites report 24 (covers FR-1).
- **AC-2** — A generated round has exactly one wrong card, a substitution, never
  at index 0, with no repeated icon in its correct program (covers FR-2, FR-3,
  FR-4).
- **AC-3** — A run executes one card at a time, locks input for its duration and
  ignores taps while it runs (covers FR-5).
- **AC-4** — A run with the wrong card changes nothing but feedback: the tape is
  intact, the round index is unchanged and no win is recorded (covers FR-6).
- **AC-5** — The goal picture is on screen for the whole round (covers FR-7).
- **AC-6** — Tapping the wrong card opens a three-candidate tray; tapping any
  other card bounces it and leaves the tray closed (covers FR-8).
- **AC-7** — The correct candidate replaces the card and the next run solves the
  round; a distractor bounces and leaves the tray open (covers FR-9).
- **AC-8** — Six wrong taps produce exactly the three hint levels at 2, 4 and 6,
  and no hint places a card or records a tap (covers FR-11).
- **AC-9** — Six rounds follow the FR-12 ladder, the rule line is spoken once and
  replayable, and no other text appears (covers FR-12, FR-13).
- **AC-10** — A browser journey diagnoses, repairs and completes three rounds,
  `launch-all` covers 24 launches and the roster literals read 24 (covers
  FR-15, FR-16).
- **AC-11** — `validate-docs` passes 5/5 with the README, PRD and TDD describing
  24 games and the current suite and journey counts (covers FR-17).

## Decisions

- **D1 — Instruction representation: six action pictograms, not arrows.** The
  suite already teaches that an arrow means a grid direction (Robot Path); this
  game's instruction is "which tool", so each card is a tool-in-use pictogram.
  Six actions in three families of two also gives the near-identical pairs the
  hardest band needs, which six unrelated arrows could not.
- **D2 — One substitution bug per round, never an omission or a swap.** Silent
  omissions are the hardest violation for preschoolers to spot (60% at three
  versus 80–90% for swaps), and a swap needs reordering, which this game does not
  ask for.
- **D3 — The wrong card is never the first card.** The run must show a correct
  step before it diverges: that contrast is what makes "it went wrong *here*"
  learnable, and it is what the divergence-band hint points at.
- **D4 — Tap only; the tray is a three-way tap choice; no drag anywhere.** Tap
  completes at 98.7% for 3–6-year-olds against 92.0% for a single-finger drag,
  and the repair must not add a motor demand to a cognitive one.
- **D5 — Hints at 2, 4 and 6 wrong taps, visual only.** Least-to-most prompting
  after a short pause, calibrated to the attempt distribution observed in
  preschool programming studies (85% finish within two attempts); the hint never
  does the repair.
- **D6 — Six fixed rounds, no adaptive band.** Diagnosis has no evidence base for
  banding, and Robot Path set the precedent that a game whose difficulty is the
  child's own thinking stays fixed.
- **D7 — Workshop art is scene-local; only tile and sticker join the shell.** The
  project's established split, and the only way the shell budget survives eight
  new drawings.
- **D8 — Execution pacing is 550 ms per card (120 ms reduced motion).** Each card
  carries an action *and* an effect, so it needs longer than Robot Path's 450 ms
  hop to be readable.
- **D9 — Suite counts are restated in the same phase that changes them.**
  `validate-docs` refuses a tree whose documented suite truth is stale, so every
  phase that adds a test also updates the three governed documents.
- **D10 — The registry row and its three document lists move in one phase.** The
  docs validator requires the registry, README list, PRD headings and TDD table
  to have the same length, so they cannot be split.
- **D11 — Each diagnosis and tray tap records one result; a solved round records
  one win.** This keeps Learning Progress meaningful and needs no schema change,
  unlike Pop & Freeze and Animal Trace which have no right/wrong by design.
- **D12 — The 24th game fills the wide grid exactly.** Rows become 6/6/6/6; a
  25th game would need a layout decision, which this track records rather than
  makes.

## Edge Cases and Failure Modes

- **Repeatedly picking distractor candidates** — the tray stays open, nothing is
  lost, and each tap records one incorrect result; the hint ladder keeps
  escalating.
- **Tapping Go with the tape unchanged** — the same funny run replays; no
  penalty, no counter, no forced hint.
- **Tapping cards or tray candidates mid-run** — ignored, exactly like Robot
  Path's strip.
- **Round change while a tray is open** — the tray closes, hints and wrong-tap
  count reset, and the new round's goal appears.
- **Storage refused or degraded** — the shared guarded store keeps the change in
  memory; the game never touches storage directly.
- **Voice unavailable or SFX off** — the rule is dimmed and silent; the game
  remains fully playable because nothing depends on hearing it.
- **Reduced motion** — the run shortens to 120 ms per card and the machine's
  working pose becomes a static pose change; hints become static highlights.
- **A generated round that breaks an invariant** (bug at index 0, a repeated
  icon, a distractor equal to the correct action) — the generator retries and
  then falls back to the round spec's fixed program, so a legal round always
  exists.

## Dependencies

- Tracks: none
- External: none (no package, service or asset is added)

## Open Questions and Assumptions

- **Toy goal art** → assumed: each of the six toys is one new drawing in the
  game's chunk; existing prop keys (the cat, the plant) are reused where a joke
  needs a bystander — because the suite already reuses existing art keys rather
  than duplicating them.
- **Five-card rounds are still legible** → assumed: yes at 96 px with 12 px gaps
  and the divergence-band hint; the ladder's last two rounds are the test of it,
  and the journey's repair of round 1 is the early check.
- **Diagnosis accuracy as "taps"** → assumed: counting each card and candidate
  tap as one result matches how the suite's accuracy figure is already built
  (right/wrong per tap), so no new metric definition is needed.

## References

- Gelman, R. & Meck, E. (1983), *Preschoolers' counting: principles before
  skill* — error detection and correction in familiar sequences:
  https://ruccs.rutgers.edu/images/archive/personal-rochel-gelman/publications/Gelman_Meck_1983_Preschoolers_counting_Principles_before_skill.pdf
- Elkin, M., Sullivan, A. & Bers, M. (2014), *Programming with KIBO in
  preschool* — repeat-with-number at mean age 4.83, empty-loop scope errors:
  https://sites.bc.edu/devtech/wp-content/uploads/sites/181/2018/02/Elkin_Sullivan_Programming-with-KIBO-in-Preschool.pdf
- Bers, M. (2019), *Coding as another language* — the coding stages and their
  age span: https://sites.bc.edu/devtech/wp-content/uploads/sites/181/2019/11/Bers2019_Article_CodingAsAnotherLanguageAPedago.pdf
- Misirli, A. & Komis, V. (2023), preschool debugging with Bee-Bots — attempt
  counts and rebuild-from-scratch behaviour:
  https://www.sciencedirect.com/science/article/pii/S0885200623000765
- Vatavu, R.-D., Cramariuc, G. & Schipor, D. (2015), *Touch interaction for
  children aged 3 to 6* — tap 98.7% vs drag 92.0% completion:
  https://mintviz.usv.ro/publications/ijhcs2015.pdf
- Doebel, S. & Zelazo, P. D., DCCS meta-analysis — rule-switch costs at 4:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4778090/
- Rittle-Johnson, B. et al. (2013), four-year-olds' repeating patterns:
  https://cdn.vanderbilt.edu/vu-sub/wp-content/uploads/sites/280/2023/07/19031022/2013RittleJohnsonFyfeMcLeanMcEldoon_ATPT4a.pdf
- Hiniker, A. et al., *Hidden symbols* — icon meaning for preschoolers:
  http://faculty.washington.edu/jkientz/papers/Hiniker-HiddenSymbols-IJHCS2016.pdf
- NAEYC & Fred Rogers Center joint position statement on technology in early
  childhood: https://www.naeyc.org/sites/default/files/globally-shared/downloads/PDFs/resources/position-statements/ps_technology.pdf

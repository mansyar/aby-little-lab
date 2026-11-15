# Specification: Robot Path

## Overview

Robot Path is the app's 23rd game and its first one about *programming*: the child
places direction arrows in a row, presses Go, and watches a small robot walk
exactly those steps across a 3×3 garden grid to a star. If the robot stops short,
the arrows stay on screen and the child changes one of them and runs again.

The game teaches three things a four-year-old can hold: an algorithm is an ordered
list of steps, the machine follows the list literally rather than the intention,
and a program can be run, observed and repaired. It deliberately does not teach
loops or conditionals — the early-childhood evidence places those later — and it
uses absolute direction arrows rather than forward-and-turn commands, because
relative turns are the step preschoolers fail at.

## Problem / Motivation

- The suite covers sequencing (`story-order`), ordinality (`number-order`),
  pattern continuation (`pattern-builder`) and sequence recall (`musical-memory`),
  but no game lets a child *author* a sequence and watch it execute. Plan → run →
  observe → fix is the loop that makes sequencing computational rather than
  narrative.
- `product.md` §10.5 names content depth as the next product phase, and the Hub's
  `thinking` group is the natural home: the game rehearses planning and
  directionality with no reading.
- The foundations are all in place: `GAME_REGISTRY` declares games once, a game
  scene extends `ChoiceRoundScene` with whole-round resolution
  (`story-order` did exactly that), lazy per-game art rides its own chunk, and the
  `?e2e=1` bridge already publishes round answers for journeys.
- Coding-toy evidence: Bee-Bot-style route programming needed adult support for
  under-5s, ScratchJr succeeds by making syntax errors impossible and reading
  order left-to-right, and 3–5yos handle sequences of three to five steps.

## Goals and Success Metrics

- **Goal:** a child builds a short program with arrows and runs it.
  - *Metric:* the browser journey taps three palette arrows and Go, and the robot
    arrives on the star in the same round (`verification/phase-5.md`).
- **Goal:** a wrong program is repairable, not a failure.
  - *Metric:* the journey runs a deliberately short program, asserts the round did
    not advance and the commands are still on screen, then adds the missing arrow
    and solves it in the same round.
- **Goal:** an illegal program cannot be built.
  - *Metric:* unit tests prove a command that would leave the board or enter a
    rock is rejected at placement and never reaches the strip.
- **Goal:** nothing that already works changes.
  - *Metric:* the pre-existing hub, paging, progress and browser suites stay green
    with only their counts restated (22 → 23); no assertion is removed or loosened.
- **Goal:** project health gates hold.
  - *Metric:* coverage ≥ 95/88/85/90, shell entry ≤ 200 kB, full gate exit 0 on
    every phase.

## Scope

### In scope

- `robot-path` as a registered game in the `thinking` group, appended last.
- A pure, Phaser-free `src/game/robotPathLogic.ts`: the grid, four directions,
  command stepping, rejection rules, the ghost path, the six-round ladder with
  seeded variety, and a hint accessor.
- A game scene: 3×3 board, robot, star, rocks, four-arrow palette, six-slot
  command strip, Go button, step-by-step execution, retry-in-place and one hint.
- Robot and prop art in the game's own lazily-loaded module, plus the two shell
  assets every game has (Hub tile, sticker).
- A browser journey that programs, runs, fails, repairs and completes rounds.
- Restating every roster-count-bearing suite and document to 23.

### Out of scope

- Loops, repeat blocks, conditionals, functions, variables, or a program editor
  that spans rounds.
- Relative turn commands (`forward`/`turn left`), or a robot that must be rotated
  to be programmed.
- Adaptive band shifts for this game (see D6), and any new profile field.
- Scores, move limits, timers, star ratings, or a "fewest arrows" puzzle goal.
- Reusing the drag board: commands are tapped into slots, not dragged.
- Any change to the Hub layout, group chips, paging maths, sticker shelf, storage
  schema, or another game's behaviour.

## Functional Requirements

- **FR-1** — `GAME_REGISTRY` gains a 23rd entry appended after `story-order`:
  `gameId: "robot-path"`, `group: "thinking"`, `sceneKey: "RobotPath"`,
  `label: "Robot Path"`, `tileKey: "tile_robot_path"`,
  `stickerKey: "sticker_robot_path"`. `GameId` gains `"robot-path"`. No existing
  entry changes, so every stored id, sticker and tile index keeps its meaning.
- **FR-2** — The board is a 3×3 grid of 112×112 tiles with 12px gaps, centred
  horizontally, holding a robot start tile, a star tile and zero or more rock
  tiles. Every tile lies inside the canvas between the top control band and the
  command strip. The robot always starts on the bottom-left, bottom-centre or
  bottom-right tile, and the star never starts under the robot.
- **FR-3** — There are exactly four commands — up, right, down, left — each
  moving the robot one tile in that direction. They are absolute directions, not
  relative turns: the robot faces the direction of travel for presentation only.
- **FR-4** — A command is appended to the strip only if it keeps the whole
  program on the board and off every rock. A command that would leave the board
  or enter a rock is refused at placement (the palette button nudges, nothing is
  added), so an illegal program cannot exist. The strip holds six commands; a
  seventh tap is refused the same way.
- **FR-5** — Tapping a filled slot removes that command and every command after
  it, keeping the program a prefix, so the strip can never contain a hole.
- **FR-6** — A dotted ghost trail is drawn on the board through the tiles the
  current program would traverse, from the robot to the furthest reachable step,
  and is redrawn on every placement or removal. It is presentation only: nothing
  moves until Go is pressed.
- **FR-7** — The Go button (112×112) executes the program at 450 ms per step,
  highlighting each slot as it fires, with the robot hopping tile to tile and
  turning to face the direction it moves. Input is locked for the run's duration;
  a tap during a run is ignored. With `prefers-reduced-motion` the hop becomes an
  alpha/scale-free slide-length reduction and the highlight stays.
- **FR-8** — Reaching the star completes the round: the existing correct chime,
  mascot cheer, progress dot and `NEXT_ROUND_DELAY` advance run, the leftover
  commands are ignored, and the sixth round completes the playthrough through the
  existing sticker and auto-return flow.
- **FR-9** — A run that ends anywhere but the star is a *stopped run*: the robot
  stops, gives a puzzled bob, the shared gentle incorrect tone plays, the round
  does **not** advance, every command stays in the strip, and the command that
  first left the intended route pulses. Nothing is reset and nothing is lost.
- **FR-10** — After two stopped runs in the same round, the first command of that
  round's solution pulses in the palette as a hint. The hint is never placed
  automatically, it is offered at most once per round, and it is withdrawn when
  the round changes.
- **FR-11** — Pressing Go with an empty strip records nothing, re-speaks the rule
  and gently nudges the strip; it is not a failed run.
- **FR-12** — Each finished run records exactly one result for learning progress:
  a run that reaches the star records one correct answer, a stopped run records
  one wrong answer, so the Progress report's accuracy means "runs that needed
  repair". Plays and wins continue to come from the existing session record.
  There is no per-arrow correct/wrong and no adaptive band shift for this game.
- **FR-13** — The scene speaks one rule line when it opens — "Put the arrows in
  the robot's path, then tap go." — through `createSpokenInstruction`, replayable
  on the speaker glyph and silent when SFX is off, matching the other twelve
  rule-narrating games. No other speech is added.
- **FR-14** — Robot, star, rock and grass art ships as `robot_*` SVGs imported by
  `src/game/robotPathArt.ts` and rasterized by `RobotPathScene.preload()`, so the
  markup rides the game's lazy chunk and never the boot shell. Arrows and the
  strip are drawn with `Graphics`; they need no texture.
- **FR-15** — The Hub tile and the sticker ship as shell assets
  (`tile_robot_path.svg`, `sticker_robot_path.svg`) at the icon and card tiers,
  which raises the boot shell from 58 to 60 keys and the app total from 191 to
  193; the guard suites state the new numbers rather than dropping the assertion.
- **FR-16** — The `?e2e=1` bridge publishes the game's state through a new scene
  hook: `{ round, solution: Direction[], commands: Direction[], palette:
  [{ dir, x, y }], slots: [{ index, x, y, filled }], go: { x, y }, robot:
  { x, y }, star: { x, y }, runs, solved }`. `solution` is the round's intended
  route, mirroring how other games publish their correct answers.
- **FR-17** — README's Mini-Games list, the PRD's `### 3.N` headings and the TDD's
  §4.5 table each gain `Robot Path` as item 23 with the PRD anchor
  `#323-robot-path`, and every document that states the roster size, the
  adaptive-game count, the progress paging `6+6+6+4`, or the shell key count is
  updated to the new truth. The PRD's "All 22 games adapt" sentence, which was
  already inaccurate, becomes a list of the fifteen adaptive games.

## Non-Functional Requirements

- **NFR-1** — Touch: palette buttons and Go are 112×112; strip slots are 96×96
  with 8px gaps (six slots span 616px). Every interactive rect is at or above the
  64px floor, and no two targets overlap.
- **NFR-2** — No new dependency, no new storage key, no schema change, no network
  request. The game is fully playable offline inside the existing shell.
- **NFR-3** — Budget: boot shell entry stays ≤ 200 kB (measured, currently
  179.4 kB), and the two new shell SVGs add ≤ 4 kB to the precache list.
- **NFR-4** — Motion: only the existing tween idioms (hop, bob, pulse, press
  squish). Nothing flashes, nothing loops unattended, and the run animation
  degrades under `prefers-reduced-motion` to a shorter, smaller movement.
- **NFR-5** — A run is bounded: six commands at 450 ms is 2.7 s, and the game
  never leaves the input locked when a run ends, regardless of outcome.
- **NFR-6** — Coverage stays at or above lines 95 / functions 88 / branches 85 /
  statements 90, with the two new modules' branch paths (refused command, empties,
  rock, board edge, hint) covered.
- **NFR-7** — No text on screen during play: arrows, tiles and the robot carry the
  meaning, and the rule exists only as speech plus the shared speaker glyph.

## Acceptance Criteria

- **AC-1** — Stepping is exact: a four-command program from a known start reaches
  the documented tile, and the ghost path equals the visited prefix (covers FR-3,
  FR-6).
- **AC-2** — Illegal commands never reach the strip: off-board and rock-entering
  commands are refused, and a full strip refuses a seventh command (covers FR-4).
- **AC-3** — Tapping a filled slot removes that command and its successors and the
  ghost trail shortens to match (covers FR-5, FR-6).
- **AC-4** — The scene locks input during a run, advances a solved round after the
  shared delay, and on a stopped run keeps every command, records one wrong
  answer and does not advance (covers FR-7, FR-8, FR-9, FR-12).
- **AC-5** — Two stopped runs produce exactly one hint pulse for the first
  solution command, and the hint is never placed automatically (covers FR-10).
- **AC-6** — The roster is 23: the Hub draws 23 tiles, `thinking` holds 7 games,
  phones page 10/10/3, and the progress report pages 6+6+6+5 (covers FR-1).
- **AC-7** — The shell ships 60 keys and 193 app keys, both `robot_*` shell assets
  resolve at their tiers, and the guard suites assert those numbers (covers
  FR-15, NFR-3).
- **AC-8** — A browser journey programs and solves a round, repairs a stopped run
  in place, completes three rounds and leaves through the back control, and
  `launch-all` covers all 23 games (covers FR-16, FR-7, FR-9).
- **AC-9** — README, PRD and TDD list 23 games in the same order and names, the
  stated counts are the new ones, and `validate-docs` passes 5/5 (covers FR-17).
- **AC-10** — Every pre-existing suite passes with only its roster count restated;
  no assertion is deleted, skipped or weakened (covers NFR-6 and the whole track).

## Decisions

- **D1** — Commands are **absolute directions** (`up/right/down/left`), not
  forward-and-turn — because the under-5 failure mode in Bee-Bot studies is route
  programming that needs a mental rotation; absolute arrows keep the mapping
  concrete while still teaching ordered execution. Relative turns are a later
  game's mechanic, not a later band of this one.
- **D2** — Board is **3×3 at 112px** — nine tiles give twelve edges to travel and
  still leave room for a 616px strip and a 112px Go button inside 1024×768, and a
  three-tile-wide board keeps a detour understandable at four.
- **D3** — Illegality is prevented at placement, not reported after Go — the
  ScratchJr lesson: when a syntax error cannot be expressed, the child never has
  to recover from one. The palette nudges and nothing is added.
- **D4** — Removing a command removes its successors (prefix rule) — the strip is a
  program, and a program with a hole is a concept this age does not need.
- **D5** — The round ladder is six rounds: straight (2–3 steps) ×2, one corner
  (3–4) ×2, rock detour (4–5), two corners (5–6). Within its band each round
  draws its start corner, star and rocks from a seeded `Rng`, so two visits differ
  while the difficulty holds.
- **D6** — **No adaptive band shift** for this game. The adaptive system reads a
  rolling window of right/wrong taps; this game has none per tap, so honouring the
  toggle here would mean inventing a second signal inside a verified subsystem.
  The game ships fixed-difficulty like Shape Sorter, Story Order and Feelings
  Faces, and its runs still feed accuracy.
- **D7** — Art is a **scene-local module** (`src/game/robotPathArt.ts`) with the
  `storyOrderArt.ts` shape — `?raw` imports, one asset table, one
  `preloadRobotPathArt(scene)` — rather than a new `ArtGroup`, because these keys
  belong to one scene and the group registry's job is sharing art across games.
- **D8** — Arrows, slots, the ghost trail and the Go glyph are **drawn with
  `Graphics`**; only the robot poses and the two props are SVG. This keeps the new
  art to six files and the in-chunk cost small.
- **D9** — The bridge publishes a **new `e2eRobotPath()` hook** instead of
  overloading `E2ERoundGeometry`: `targets`/`slots` mean draggable piece↔slot
  pairs in the drag games, and a palette is neither.
- **D10** — A stopped run is **one wrong answer**, a solved run **one correct
  answer**, recorded through the existing `recordCorrect`/`recordWrong` so the
  Progress report and the accuracy bar stay meaningful without new fields.
- **D11** — The hint is the **first command of the solution, pulsing in the
  palette**, offered after two stopped runs, once per round — a nudge at the
  decision point rather than a placed answer, which keeps authorship with the
  child.
- **D12** — The game is **appended last** in the registry (`thinking`, index 22),
  so all existing Hub tile indexes, progress-row indexes and sticker order are
  untouched; the wide grid recomputes to `6/6/6/5` and phones to `10/10/3`.

## Edge Cases and Failure Modes

- Go on an empty strip: no record, rule re-spoken, strip nudges, nothing locks.
- A program that reaches the star before its last command: the round completes and
  the remaining commands are never executed; no second record.
- A run stopped on its first command: the same retry-in-place path as any other;
  the first command pulses.
- Double-tapping Go: the second tap lands while input is locked and is ignored.
- Back button held mid-run: the scene shuts down normally; the tween is killed by
  the existing shutdown cleanup and no record is written for the unfinished run.
- Leaving after one stopped run and returning: a new visit starts at round 1 with
  an empty strip and no hint carried over.
- A refused command while the strip is full: same nudge, no speech, no record.
- A device with no voice: the rule is silent and dimmed; the arrows still teach
  the game without it.
- SFX off: no rule speech, no incorrect tone; visuals and progress recording are
  unchanged.
- `prefers-reduced-motion`: the hop shortens and the highlight remains, so the
  step-to-slot sync is never lost.
- The daily cap is reached mid-visit: the game continues to completion as every
  other game does; the cap locks the Hub, never a round.
- A 24th game added later: the grid and paging derive from the registry, so no
  code here changes; only the count-bearing suites and docs move again.

## Dependencies

- Tracks: none active. Built on `20261020-game-metadata-source` (the registry),
  `20261021-hub-grid-decomposition` and `20261115-hub-game-groups` (the groups the
  new game joins), `20261010-story-order` (the whole-round scene shape and the
  scene-local art module pattern).
- External: none. No package, service, storage key or network call.

## Open Questions and Assumptions

- Round count → assumed **six**, matching Story Order and every later game; three
  would make the ladder end just as the child understands the loop.
- Label → assumed **Robot Path** (two words, title case, matching `Shape Sorter`,
  `Pattern Builder`, `Story Order`); the Hub tile carries the words, as every tile
  does.
- Whether the robot should be the app's mascot → assumed **no**: Professor Hoot is
  the guide in every scene, and a robot protagonist keeps the mascot's role
  consistent.
- Whether the strip should allow seven or eight commands → assumed **six**, which
  covers the hardest ladder rung (5–6) and keeps every slot 96px wide.
- Whether the hint should be spoken → assumed **no** beyond the rule line: the
  pulsing arrow is the cue, and speech here would talk over the child's own
  thinking.

## References

- `conductor/product.md` §3.1 (the game table), §4 (UX principles), §10.5
  (content depth is the next product phase).
- `conductor/product-guidelines.md` §3–§5 (touch targets, no-fail philosophy,
  textless cues, muted-motion rules).
- `conductor/workflow.md` (gate commands, evidence format).
- `docs/TDD.md` §4.5 (scene table), §4.9 (the hub-groups section this track
  extends), and the lazy-art chapters.
- `src/game/gameRegistry.ts`, `src/game/storyOrderLogic.ts`,
  `src/game/storyOrderArt.ts`, `src/game/e2eBridge.ts`, `src/scenes/GameSceneBase.ts`,
  `src/scenes/ChoiceRoundScene.ts`, `src/scenes/StoryOrderScene.ts`,
  `src/utils/textureTiers.ts`, `src/utils/storage.ts`.
- Evidence base for the age claim: Yang 2024 umbrella review (sequences central,
  loops/conditionals later); MDPI 2024 learning trajectories (3–5 steps, arrows as
  representation, debugging identification before repair); Springer 2021 Bee-Bot
  guided play (route programming needs support); Flannery & Bers ScratchJr design
  (icon-only, left-to-right, no syntax errors).

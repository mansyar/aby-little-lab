# Shared Choice-Round Shell + Audio Focus — Implementation Plan

> **Branch:** `refactor/20261020-scene-audio-shell`
> **Base:** `master` @ `c92e5c481b1f87e8b28f1d30eb4e8989156253fb`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Choice-round base + arithmetic merge

- **Goal:** one choice-round base serves two games, Add It Up and Take Away share
  one implementation, and both existing suites pass unchanged.
- **Depends on:** none
- **Covers:** FR-1, FR-2, AC-2, AC-3, AC-7, NFR-1, NFR-2, NFR-4, NFR-5, NFR-8
- **Touches:** `src/scenes/ChoiceRoundScene.ts`, `src/scenes/GroupMathScene.ts`,
  `src/scenes/AddItUpScene.ts`, `src/scenes/TakeAwayScene.ts`,
  `src/scenes/sceneRegistry.ts`, `src/__tests__/scenes/choiceRoundScene.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** `352671f`
- **Evidence:** `conductor/tracks/20261020-scene-audio-shell/verification/phase-1.md`

- [x] **P1.T1: Create the `ChoiceRoundScene` base** — covers: FR-1
  - [x] **P1.T1.1: Define the subclass contract** (round-content build, choice
    targets, optional per-game correct/wrong extras, advance delay) and the
    round teardown that destroys them.
  - [x] **P1.T1.2: Port the shared handlers** — input lock, chime,
    `recordCorrect`, mascot cheer, progress-dot pop, `NEXT_ROUND_DELAY`
    advance; wrong path with `recordWrong`, soft tone, mascot nod, and the
    reduced-motion-aware wiggle.
  - [x] **P1.T1.3: Add a choice-target factory** that creates the ≥96 px hit
    area and press feedback once, so no subclass repeats the hit-area
    geometry.
- [x] **P1.T2: Move Add It Up and Take Away onto `GroupMathScene`** — covers: FR-2
  - [x] **P1.T2.1: Implement `GroupMathScene`** as a config-driven scene
    (operation cue, item layout, logic module, game id, instruction line).
  - [x] **P1.T2.2: Reduce `AddItUpScene` and `TakeAwayScene` to thin
    subclasses** that pin their config, keeping module paths, scene keys and
    registry entries untouched.
  - [x] **P1.T2.3: Verify per-game identity is intact** — adaptive band shift,
    `recordGameResult` id, sticker key, spoken rule, progress-dot count.
- [x] **P1.T3: Base unit tests** — covers: FR-1
  - [x] **P1.T3.1: Test the hook contract** — order of build/teardown, single
    advance per correct tap while locked, completion at the last round.
  - [x] **P1.T3.2: Test the wrong-answer path** — wiggle amplitudes and
    durations under normal and reduced motion, no advance, no dot fill.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/<track-id>/verification/phase-1.md
-->

## Phase 2: Migrate the five prompt-card scenes

- **Goal:** five more choice scenes extend the base, with unchanged card
  content and unchanged suites.
- **Depends on:** Phase 1
- **Covers:** FR-1, AC-3, NFR-2, NFR-5, NFR-7, NFR-8
- **Touches:** `src/scenes/AlphabetScene.ts`, `src/scenes/WordMatchScene.ts`,
  `src/scenes/DecodeItScene.ts`, `src/scenes/HowManyScene.ts`,
  `src/scenes/FirstSoundsScene.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** `a854a1e`
- **Evidence:** `conductor/tracks/20261020-scene-audio-shell/verification/phase-2.md`

- [x] **P2.T1: Migrate the letter/word grid pair** — covers: FR-1
  - [x] **P2.T1.1: Extend the base with the variable card-content hook** the
    glyph/word cards need (per-card width, per-card content objects).
  - [x] **P2.T1.2: Migrate Alphabet and WordMatch** to the base.
- [x] **P2.T2: Migrate the 2×2 text/number pair** — covers: FR-1
  - [x] **P2.T2.1: Migrate DecodeIt** (picture prompt, letter cards).
  - [x] **P2.T2.2: Migrate HowMany** (numeral prompt, count cards).
- [x] **P2.T3: Migrate First Sounds** — covers: FR-1
  - [x] **P2.T3.1: Migrate the scene** to the base.
  - [x] **P2.T3.2: Preserve the correct-answer letter narration** and the
    prompt re-speak on repeat, without double-speaking.

## Phase 3: Migrate the remaining five + Feelings Faces

- **Goal:** all thirteen choice scenes run on the base; only game-specific
  content remains in each file.
- **Depends on:** Phase 2
- **Covers:** FR-1, AC-3, AC-4, NFR-2, NFR-4, NFR-5, NFR-7, NFR-8
- **Touches:** `src/scenes/MoreLessScene.ts`, `src/scenes/ColorMatchScene.ts`,
  `src/scenes/OddOneOutScene.ts`, `src/scenes/NumberOrderScene.ts`,
  `src/scenes/PatternBuilderScene.ts`, `src/scenes/FeelingsFacesScene.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** `5630c9c`
- **Evidence:** `conductor/tracks/20261020-scene-audio-shell/verification/phase-3.md`

- [x] **P3.T1: Migrate the comparison pair** — covers: FR-1
  - [x] **P3.T1.1: Migrate MoreLess** (arrow cue, two dot-group cards).
  - [x] **P3.T1.2: Migrate ColorMatch** (swatch cue, four colour cards).
- [x] **P3.T2: Migrate the remaining grid pair** — covers: FR-1
  - [x] **P3.T2.1: Migrate OddOneOut** (2×2 grid, unique odd item).
  - [x] **P3.T2.2: Migrate NumberOrder** (ordered numeral slots).
- [x] **P3.T3: Migrate Feelings Faces** — covers: FR-1, AC-4
  - [x] **P3.T3.1: Migrate the three-face round** to the base.
  - [x] **P3.T3.2: Keep the re-speak-on-wrong and caption-hook behaviour**
    identical while the caption state machine is still in the scene (it moves
    in Phase 4).

## Phase 4: One narrator for per-round prompts

- **Goal:** a single narrator serves every per-round prompt, owns the caption
  fallback, and no scene constructs a speaker glyph directly.
- **Depends on:** Phase 3
- **Covers:** FR-3, FR-4, FR-5, AC-1, AC-4, NFR-2, NFR-3, NFR-7, NFR-8
- **Touches:** `src/scenes/GameSceneBase.ts`, `src/components/RoundNarrator.ts`,
  `src/scenes/AlphabetScene.ts`, `src/scenes/WordMatchScene.ts`,
  `src/scenes/WordBuilderScene.ts`, `src/scenes/HowManyScene.ts`,
  `src/scenes/FirstSoundsScene.ts`, `src/scenes/MoreLessScene.ts`,
  `src/scenes/OddOneOutScene.ts`, `src/scenes/ColorMatchScene.ts`,
  `src/scenes/DecodeItScene.ts`, `src/scenes/MusicalMemoryScene.ts`,
  `src/scenes/FeelingsFacesScene.ts`,
  `src/__tests__/components/roundNarrator.test.ts`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** `bd2e66f`
- **Evidence:** `conductor/tracks/20261020-scene-audio-shell/verification/phase-4.md`

- [x] **P4.T1: Build the narrator helper** — covers: FR-3, FR-4
  - [x] **P4.T1.1: Own the glyph** — creation, placement beside the prompt,
    muted state from `getSettings()`, replay handler, active-speech visual
    state from `onSpeechLifecycle`.
  - [x] **P4.T1.2: Own the lifecycle** — replace its own glyph on rerender,
    destroy on scene shutdown, unsubscribe exactly once.
- [x] **P4.T2: Migrate the eleven hand-rolled sites** — covers: FR-3
  - [x] **P4.T2.1: Migrate the prompt-reading games** (Alphabet, WordMatch,
    WordBuilder, HowMany, FirstSounds, MoreLess, OddOneOut, ColorMatch,
    DecodeIt) to the helper.
  - [x] **P4.T2.2: Migrate the two remaining sites** — Musical Memory's replay
    and the Feelings Faces rule line.
- [x] **P4.T3: Move the caption-fallback state machine** — covers: FR-5
  - [x] **P4.T3.1: Move unknown-until-`voiceschanged`, settled-empty decision,
    and displayed-round re-evaluation into the narrator, including engines that
    never fire the event.
  - [x] **P4.T3.2: Guarantee no re-speak on flip-to-spoken** and no caption
    while the round is mid-transition.
- [x] **P4.T4: Narrator unit tests** — covers: FR-4, FR-5, AC-4
  - [x] **P4.T4.1: Test mute, replay, lifecycle subscribe/unsubscribe and
    rerender replacement.**
  - [x] **P4.T4.2: Test the caption machine** — unknown → settled-empty,
    settle re-evaluation, no re-speak on flip, engine without the event.

## Phase 5: Audio focus, visibility, and docs

- **Goal:** narration owns the audio foreground, hidden time is not play time,
  and both behaviours are documented.
- **Depends on:** Phase 4
- **Covers:** FR-6, FR-7, FR-8, FR-9, FR-10, AC-5, AC-6, AC-7, AC-8, AC-9, NFR-1, NFR-2, NFR-6, NFR-7, NFR-8
- **Touches:** `src/audio/AudioManager.ts`, `src/game/playTimeLogic.ts`,
  `src/scenes/HubScene.ts`, `src/__tests__/audio/AudioManager.test.ts`,
  `src/__tests__/game/playTimeLogic.test.ts`, `README.md`,
  `conductor/tech-stack.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** `3a1b3e4`
- **Evidence:** `conductor/tracks/20261020-scene-audio-shell/verification/phase-5.md`

- [x] **P5.T1: Duck BGM under speech** — covers: FR-6, FR-7
  - [x] **P5.T1.1: Add duck/restore to `AudioManager`** with the short ramp and
    a restore path that also runs on scene shutdown and setting changes.
  - [x] **P5.T1.2: Subscribe once at init** to the speech lifecycle; re-entrant
    utterances must not restore early.
  - [x] **P5.T1.3: Add the watchdog** that restores BGM when no end event
    arrives, and never persists a ducked level.
- [x] **P5.T2: Handle document visibility** — covers: FR-8, FR-9
  - [x] **P5.T2.1: Pause and resume BGM** on hide/show, only resuming what was
    playing and is still enabled; cancel in-flight speech on hide.
  - [x] **P5.T2.2: Pause and resume play-time accrual** in `playTimeLogic`,
    wiring the pause into `HubScene`/`AudioManager` ownership points.
  - [x] **P5.T2.3: Prove idempotence** — two hide/show cycles accrue the
    visible slice once and never count hidden time.
- [x] **P5.T3: Audio-focus tests** — covers: FR-6, FR-7, FR-8, FR-9, AC-5, AC-6
  - [x] **P5.T3.1: Duck/restore/watchdog tests** at the `AudioManager` level.
  - [x] **P5.T3.2: Visibility tests** at the play-time and audio level.
- [x] **P5.T4: Documentation** — covers: FR-10, AC-9
  - [x] **P5.T4.1: Update `conductor/tech-stack.md`** with the base, the
    narrator, and the audio-focus policy.
  - [x] **P5.T4.2: Update `README.md`** architecture/motion sections so the
    described structure matches the code.

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 5
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** verified
- **Result:** verified
- **Checkpoint:** `22aabc8`
- **Evidence:** `conductor/tracks/20261020-scene-audio-shell/verification/phase-R1.md`

- [x] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->

## Phase R1: Review Fixes

- **Goal:** Resolve review findings M1, M2, L1, L2, L3, L4, L5.
- **Depends on:** Phase 5
- **Covers:** M1, M2, L1, L2, L3, L4, L5
- **Touches:** `src/scenes/ChoiceRoundScene.ts`, `src/scenes/NumberOrderScene.ts`, `src/components/RoundNarrator.ts`, `src/__tests__/scenes/choiceRoundScene.test.ts`, `src/__tests__/audio/AudioManager.test.ts`, `conductor/tracks/20261020-scene-audio-shell/spec.md`, `conductor/tracks/20261020-scene-audio-shell/verification/phase-2.md`, `conductor/tracks/20261020-scene-audio-shell/verification/integrated.md`, `conductor/product.md`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- **Status:** verified
- **Result:** verified
- **Checkpoint:** `22aabc8`
- **Evidence:** `conductor/tracks/20261020-scene-audio-shell/verification/phase-R1.md`

- [x] **R1.T1: Record the shared success flash** — covers: M1
- [x] **R1.T2: Amend NFR-1 and restate the NFR-1 row** — covers: M2
- [x] **R1.T3: Pin the correct-answer ordering in the base suite** — covers: L1
- [x] **R1.T4: Pin the pre-init duck contract** — covers: L2
- [x] **R1.T5: Route Number Order through the settings facade** — covers: L3
- [x] **R1.T6: Document the narrator's refresh contract** — covers: L4
- [x] **R1.T7: Centre the inflated hit area and test it** — covers: L5

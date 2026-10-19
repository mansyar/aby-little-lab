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
- **Status:** in_progress

- [ ] **P1.T1: Create the `ChoiceRoundScene` base** — covers: FR-1
  - [ ] **P1.T1.1: Define the subclass contract** (round-content build, choice
    targets, optional per-game correct/wrong extras, advance delay) and the
    round teardown that destroys them.
  - [ ] **P1.T1.2: Port the shared handlers** — input lock, chime,
    `recordCorrect`, mascot cheer, progress-dot pop, `NEXT_ROUND_DELAY`
    advance; wrong path with `recordWrong`, soft tone, mascot nod, and the
    reduced-motion-aware wiggle.
  - [ ] **P1.T1.3: Add a choice-target factory** that creates the ≥96 px hit
    area and press feedback once, so no subclass repeats the hit-area
    geometry.
- [ ] **P1.T2: Move Add It Up and Take Away onto `GroupMathScene`** — covers: FR-2
  - [ ] **P1.T2.1: Implement `GroupMathScene`** as a config-driven scene
    (operation cue, item layout, logic module, game id, instruction line).
  - [ ] **P1.T2.2: Reduce `AddItUpScene` and `TakeAwayScene` to thin
    subclasses** that pin their config, keeping module paths, scene keys and
    registry entries untouched.
  - [ ] **P1.T2.3: Verify per-game identity is intact** — adaptive band shift,
    `recordGameResult` id, sticker key, spoken rule, progress-dot count.
- [ ] **P1.T3: Base unit tests** — covers: FR-1
  - [ ] **P1.T3.1: Test the hook contract** — order of build/teardown, single
    advance per correct tap while locked, completion at the last round.
  - [ ] **P1.T3.2: Test the wrong-answer path** — wiggle amplitudes and
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
- **Status:** pending

- [ ] **P2.T1: Migrate the letter/word grid pair** — covers: FR-1
  - [ ] **P2.T1.1: Extend the base with the variable card-content hook** the
    glyph/word cards need (per-card width, per-card content objects).
  - [ ] **P2.T1.2: Migrate Alphabet and WordMatch** to the base.
- [ ] **P2.T2: Migrate the 2×2 text/number pair** — covers: FR-1
  - [ ] **P2.T2.1: Migrate DecodeIt** (picture prompt, letter cards).
  - [ ] **P2.T2.2: Migrate HowMany** (numeral prompt, count cards).
- [ ] **P2.T3: Migrate First Sounds** — covers: FR-1
  - [ ] **P2.T3.1: Migrate the scene** to the base.
  - [ ] **P2.T3.2: Preserve the correct-answer letter narration** and the
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
- **Status:** pending

- [ ] **P3.T1: Migrate the comparison pair** — covers: FR-1
  - [ ] **P3.T1.1: Migrate MoreLess** (arrow cue, two dot-group cards).
  - [ ] **P3.T1.2: Migrate ColorMatch** (swatch cue, four colour cards).
- [ ] **P3.T2: Migrate the remaining grid pair** — covers: FR-1
  - [ ] **P3.T2.1: Migrate OddOneOut** (2×2 grid, unique odd item).
  - [ ] **P3.T2.2: Migrate NumberOrder** (ordered numeral slots).
- [ ] **P3.T3: Migrate Feelings Faces** — covers: FR-1, AC-4
  - [ ] **P3.T3.1: Migrate the three-face round** to the base.
  - [ ] **P3.T3.2: Keep the re-speak-on-wrong and caption-hook behaviour**
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
- **Status:** pending

- [ ] **P4.T1: Build the narrator helper** — covers: FR-3, FR-4
  - [ ] **P4.T1.1: Own the glyph** — creation, placement beside the prompt,
    muted state from `getSettings()`, replay handler, active-speech visual
    state from `onSpeechLifecycle`.
  - [ ] **P4.T1.2: Own the lifecycle** — replace its own glyph on rerender,
    destroy on scene shutdown, unsubscribe exactly once.
- [ ] **P4.T2: Migrate the eleven hand-rolled sites** — covers: FR-3
  - [ ] **P4.T2.1: Migrate the prompt-reading games** (Alphabet, WordMatch,
    WordBuilder, HowMany, FirstSounds, MoreLess, OddOneOut, ColorMatch,
    DecodeIt) to the helper.
  - [ ] **P4.T2.2: Migrate the two remaining sites** — Musical Memory's replay
    and the Feelings Faces rule line.
- [ ] **P4.T3: Move the caption-fallback state machine** — covers: FR-5
  - [ ] **P4.T3.1: Move unknown-until-`voiceschanged`, settled-empty decision,
    and displayed-round re-evaluation into the narrator, including engines that
    never fire the event.
  - [ ] **P4.T3.2: Guarantee no re-speak on flip-to-spoken** and no caption
    while the round is mid-transition.
- [ ] **P4.T4: Narrator unit tests** — covers: FR-4, FR-5, AC-4
  - [ ] **P4.T4.1: Test mute, replay, lifecycle subscribe/unsubscribe and
    rerender replacement.**
  - [ ] **P4.T4.2: Test the caption machine** — unknown → settled-empty,
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
- **Status:** pending

- [ ] **P5.T1: Duck BGM under speech** — covers: FR-6, FR-7
  - [ ] **P5.T1.1: Add duck/restore to `AudioManager`** with the short ramp and
    a restore path that also runs on scene shutdown and setting changes.
  - [ ] **P5.T1.2: Subscribe once at init** to the speech lifecycle; re-entrant
    utterances must not restore early.
  - [ ] **P5.T1.3: Add the watchdog** that restores BGM when no end event
    arrives, and never persists a ducked level.
- [ ] **P5.T2: Handle document visibility** — covers: FR-8, FR-9
  - [ ] **P5.T2.1: Pause and resume BGM** on hide/show, only resuming what was
    playing and is still enabled; cancel in-flight speech on hide.
  - [ ] **P5.T2.2: Pause and resume play-time accrual** in `playTimeLogic`,
    wiring the pause into `HubScene`/`AudioManager` ownership points.
  - [ ] **P5.T2.3: Prove idempotence** — two hide/show cycles accrue the
    visible slice once and never count hidden time.
- [ ] **P5.T3: Audio-focus tests** — covers: FR-6, FR-7, FR-8, FR-9, AC-5, AC-6
  - [ ] **P5.T3.1: Duck/restore/watchdog tests** at the `AudioManager` level.
  - [ ] **P5.T3.2: Visibility tests** at the play-time and audio level.
- [ ] **P5.T4: Documentation** — covers: FR-10, AC-9
  - [ ] **P5.T4.1: Update `conductor/tech-stack.md`** with the base, the
    narrator, and the audio-focus policy.
  - [ ] **P5.T4.2: Update `README.md`** architecture/motion sections so the
    described structure matches the code.

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 5
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->

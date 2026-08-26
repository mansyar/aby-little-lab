# Implementation Plan: UI/UX Cohesion

**Track:** `ui-ux-cohesion_20260826`
**Specification:** [./spec.md](./spec.md)
**Status:** Not started
**Plan source of truth:** This file, governed by `conductor/workflow.md`.

## Execution protocol

Before implementation, mark the current task `[~]`. For logic-bearing changes, write and run the failing test before implementation. Every completed task follows the workflow’s task-commit and Git-note rules; record its commit SHA in this plan through a separate plan commit. Every phase ends with changed-file/test review, announced quality checks, manual verification, user confirmation in the interactive session, a checkpoint commit and Git note, and the checkpoint SHA recorded here through a separate plan commit.

No technology-stack deviation is anticipated. If implementation requires a new dependency or a change to the documented stack, stop before implementation, document the deviation, and obtain approval.

## Phase 1 — Interaction inventory and shared contracts [checkpoint: b2d98b6]

- [x] Task: Inventory current interactive surfaces [1ed2431]
  - [x] Audit all 18 game scenes, Hub/profile controls, Settings/Progress overlays, ParentLock, and SpeakerButton.
  - [x] Record existing resting, pressed, selected, locked, disabled, and audio-feedback states.
  - [x] Identify controls already using `attachPressFeedback` and controls with scene-specific feedback.
  - [x] Confirm no-fail, touch-target, reduced-motion, and pointer-cancellation constraints for each surface. *(Artifact: ./notes/inventory.md)*

- [x] Task: Establish the shared interaction test contract [33b8877]
  - [x] Extend `src/__tests__/utils/pressFeedback.test.ts` for every supported object type and pointerdown/up/out/cancel behavior. *(24 cases: text/rectangle/image × 8 behaviors)*
  - [x] Verify captured base scale, optional spring behavior, and reduced-motion no-op behavior.
  - [x] Add or update test helpers only where needed to simulate Phaser event registration. *(Existing mock helper reused; no changes needed)*
  - [x] Run focused tests and confirm expected failures before changing utility behavior, if utility changes are required. *(Type-only union widening — no runtime delta; suite confirmed green before and after)*

- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [b2d98b6]
  - [x] Verify the inventory covers every planned surface.
  - [x] Run the focused interaction test suite.
  - [x] Present the phase manual-verification scope and obtain user confirmation before checkpointing. *(Confirmed 2026-08-26)*

## Phase 2 — Cross-game child interaction cohesion [checkpoint: 205d207]

- [x] Task: Add regression coverage before scene changes [5cd9206]
  - [x] Extend existing scene tests for tap-card families, including Alphabet, Word Match, Word Builder, How Many, First Sounds, More or Less, Odd One Out, Color Match, Add It Up, Take Away, and Pattern Builder.
  - [x] Add missing scene tests for any changed scene without an existing corresponding suite. *(New musicalMemoryScene.test.ts)*
  - [x] Verify press feedback does not interfere with input locking, correct/wrong feedback, round transitions, or completion. *(Ordering pins + playback-lock pin; full suite green)*
  - [x] Include reduced-motion and pointerout/pointercancel cases. *(RM delta pin; contract covers up/out/cancel)*

- [x] Task: Implement consistent child-control feedback [f36f0b9]
  - [x] Apply the shared interaction treatment to missing tap cards and other child-facing interactive controls. *(6 card scenes + Musical Memory frogs)*
  - [x] Preserve existing pointerdown versus pointerup navigation semantics and no-fail reactions.
  - [x] Avoid duplicate listeners or competing tweens on controls that already have bespoke feedback.
  - [x] Ensure new listeners/tweens are cleaned up through existing scene lifecycle behavior.
  - [x] Keep all gameplay text-independent and preserve existing touch targets.

- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [205d207]
  - [x] Run targeted scene, interaction, and reduced-motion tests.
  - [x] Manually verify one representative game from each interaction family plus Back and progress controls.
  - [x] Confirm no visual feedback introduces pressure, penalties, or accidental navigation.
  - [x] Obtain user confirmation and create the phase checkpoint. *(Confirmed 2026-08-26)*

## Phase 3 — Hub and profile-picker hierarchy [checkpoint: 26d6f85]

- [x] Task: Write Hub/profile regression coverage [1123961]
  - [x] Extend `src/__tests__/scenes/hubScene.test.ts` for selected-profile indication, profile-picker selection, pressed tile state, earned/sticker state, and daily-limit state. *(13 tests; chip + picker rings RED→GREEN; minimal ring implementation included to keep gates green)*
  - [x] Add layout assertions for the preserved 5×3+3 grid at 1024×768. *(rows [5,5,5,3], pitch 182)*
  - [x] Verify lazy loading, `navLocked`, profile switching, sticker-shelf refresh, and play-time behavior remain unchanged. *(pins; navigation.test.ts/firstWordsIntegration.test.ts hardened to geometry-based identification)*
  - [x] Add reduced-motion assertions for changed entrance, idle, or selection treatment. *(zero tile-targeting tweens under RM)*

- [x] Task: Polish Hub visual hierarchy in place [c709e13]
  - [x] Preserve the current grid, tile order, lazy navigation, sticker shelf, play-time indicator, mascot, and profile flow. *(all regression pins green)*
  - [x] Rebalance icon, label, and sticker spacing for legibility at base and narrow-landscape sizes. *(labels 15px→17px, offset +2; FIT handles narrow landscape)*
  - [x] Add a persistent, unambiguous active-profile ring/outline/badge in the Hub and picker; do not rely on scale alone. *(shipped with Task 1 — 1123961)*
  - [x] Distinguish resting, pressed, earned, and unavailable tile states using flat storybook treatments and non-color-only cues. *(stroke outline; spring squish; shelf sticker glyph; locked dim+scale-0.97+moon badge)*
  - [x] Add only subtle domain grouping accents; do not introduce categories, tabs, carousel navigation, or new instructional text. *(none added: no domain taxonomy exists and inventing one = new IA, excluded by spec)*
  - [x] Verify no clipping or overlap with Settings, profile controls, mascot, stickers, or play-time indicators. *(geometry unchanged except label offset +2 inside tile; in-bounds pins pass)*

- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [26d6f85]
  - [x] Run Hub/navigation/profile tests and quality checks for changed code. *(64 files green; lint + build pass)*
  - [x] Manually inspect 1024×768 and narrow-landscape layouts with fresh, earned, switched-profile, and time-limit states.
  - [x] Verify reduced-motion behavior and touch-target sizes.
  - [x] Obtain user confirmation and create the phase checkpoint. *(Confirmed 2026-08-26)*

## Phase 4 — Parent Settings and Learning Progress affordances [checkpoint: b758d6a]

- [x] Task: Extend parent UI regression tests [53b2657]
  - [x] Cover visual/current-state updates for BGM, SFX, voice selection, Preview, Profiles, Progress, install, and Reset controls. *(Affordance-cohesion suite: PF listener deltas motion/RM, toggle track+knob flip via setX/setFillStyle, chevron pager, row cards, ✕ close, stroked destructive modals.)*
  - [x] Cover selected profile states in Profiles and Learning Progress without changing the active profile from the report. *(Viewed-profile ring follows chip taps; read-only pin asserts getActiveProfile unchanged.)*
  - [x] Cover explicit close, page navigation, cancel, delete, and reset interactions. *(Close destroys backdrop; pager test rewritten to ‹ › with clamping at bounds; delete/reset modal flows re-pinned.)*
  - [x] Preserve voice-listener cleanup, pinch-zoom restoration, parent-lock gating, and local persistence. *(Existing suites green: 70 SettingsPanel tests total.)*

- [x] Task: Improve Settings and Progress in place [88050e0]
  - [x] Preserve the fixed-panel and overlay architecture, parent lock, existing data, and 18-game/6-per-page report.
  - [x] Replace ambiguous text-only affordances with clear visual rows, state treatments, toggle presentation, chevrons, and selected outlines using Phaser primitives or existing assets. *(400×68 row cards; track-and-knob toggles where knob position is the non-color cue; dimmed-at-bounds prev/next chevrons; 80px viewed ring in Progress, 112px active ring in Profiles.)*
  - [x] Add consistent press feedback to parent controls and profile/action items. *(attachPressFeedback after every gameplay handler: toggles, rows, voice chip, preview, install, chips, chevrons, avatars, delete/play-time actions, modal buttons.)*
  - [x] Make close, previous/next, cancel, and destructive actions visually distinct and difficult to trigger accidentally. *(Explicit ✕ on main panel; danger-tinted stroked emphasis cards for Delete/Reset behind two-step confirm modals via bucket-aware createModalButton.)*
  - [x] Improve profile and report scanning without adding cloud data, new storage fields, or a new navigation framework. *(Same overlays, same storage schema, Phaser primitives only.)*
  - [x] Keep parent-facing copy available while preserving textless child gameplay. *(All labels retained verbatim; no child-facing scenes touched.)*

- [x] Task: Phase Verification & Checkpoint (Refer to `workflow.md`) [b758d6a]
  - [x] Run SettingsPanel, profile, progress, voice, and persistence tests. *(70 SettingsPanel tests incl. 9 new cohesion contracts; full suite 64/64 green.)*
  - [x] Manually verify all parent-gated flows with audio on/off, multiple profiles, reset/delete cancellation, and narrow landscape. *(Steps 1-7 presented; user confirmed on 2026-08-27.)*
  - [x] Verify controls remain at least 64×64px and important controls approach 96×96px. *(Toggles/rows keep 96×96 hit areas; ✕, chevrons, and modal buttons sized at 96×96.)*
  - [x] Obtain user confirmation and create the phase checkpoint. *(Checkpoint b758d6a, 2026-08-27.)*

## Phase 5 — Speaker and audio-visual feedback

- [x] Task: Define and test the speaker-state contract [de395be]
  - [x] Extend speech tests for successful dispatch, disabled speech, unsupported speech, completion, interruption, and failure. *(Lifecycle describe: start/end sequence, error, disabled, unsupported, superseded-utterance isolation with fake timers, unsubscribe.)*
  - [x] Extend SpeakerButton tests for pressed, active/replaying, unavailable/muted, neutral, and destroy/cleanup states. *(9 state tests incl. idempotent setActive, reduced-motion static tint, destroy unsubscribes+stops tween; 96px target and press-feedback pins retained.)*
  - [x] Preserve the existing callback behavior and silent visual-only fallback. *(onSpeak on pointerdown unchanged; unsupported path dims without subscribing — callback still fires.)*
  - [x] Cover Musical Memory replay separately from Web Speech while using the same understandable visual grammar. *(Replay drives setActive externally through the SpeakerButton public API.)*

- [x] Task: Implement minimal speaker feedback [2687d4f]
  - [x] Add the smallest lifecycle bridge needed for SpeakerButton to observe speech/replay state. *(onSpeechLifecycle subscription with per-utterance token guard in speech.ts.)*
  - [x] Show immediate tap acknowledgement, active speech/replay when observable, unavailable/muted state when applicable, and neutral state afterward. *(Press squish already acked; active tint + alpha breathing [static dim under RM]; muted dim when SFX off; neutral after end/error.)*
  - [x] Ensure interrupted or failed speech cannot leave a stale active state. *(Token guard invalidates superseded utterances; error → neutral; MusicalMemory sequencePlayId guard.)*
  - [x] Keep the 96px touch target, iOS gesture unlock behavior, SFX gating, reduced-motion compliance, and scene cleanup. *(Unchanged; muted via load().settings in 8 scenes; destroy unsubscribes.)*
  - [x] Do not add a new audio dependency or couple the UI to one browser’s speech implementation. *(Pure Web Speech observability + Phaser primitives.)*

- [~] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
  - [ ] Run speech, SpeakerButton, and affected scene tests.
  - [ ] Manually verify speech enabled/disabled, unsupported/failing speech, replay, interruption, and reduced motion.
  - [ ] Confirm every significant audio state has a visual counterpart.
  - [ ] Obtain user confirmation and create the phase checkpoint.

## Phase 6 — Integrated quality, documentation, and review

- [ ] Task: Run project quality gates
  - [ ] Run `pnpm run check`.
  - [ ] Run `CI=true pnpm test` with coverage.
  - [ ] Run `pnpm run build`.
  - [ ] Run `node scripts/validate-pwa.js`.
  - [ ] Run `node scripts/validate-bundle.js`.
  - [ ] Resolve regressions without changing the approved scope.

- [ ] Task: Perform manual UI/UX verification
  - [ ] Start the app with `pnpm dev` and verify the URL printed by Vite.
  - [ ] Test desktop 1024×768, narrow landscape, phone, and tablet layouts.
  - [ ] Exercise all 18 Hub entries, profile switching, stickers, play-time states, parent lock, Settings, Progress, audio, speech, reduced motion, and offline relaunch.
  - [ ] Check clipping, overlap, touch-target sizing, visual hierarchy, no-fail feedback, and textless gameplay.
  - [ ] Capture concise verification notes or screenshots where they clarify the result.

- [ ] Task: Update project records and self-review
  - [ ] Update relevant UI/UX or device-verification documentation without rewriting historical records.
  - [ ] Document any implementation deviation from `tech-stack.md`; otherwise record that no deviation occurred.
  - [ ] Review the final diff against `spec.md`, `plan.md`, product guidelines, and the quality-gate checklist.
  - [ ] Prepare the track for Conductor review.

- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
  - [ ] Attach automated commands, manual verification steps, and user feedback to the checkpoint Git note.
  - [ ] Record the final phase checkpoint SHA in this plan.
  - [ ] Confirm all acceptance criteria are satisfied or explicitly document follow-up work.

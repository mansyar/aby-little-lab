# Implementation Plan: UI/UX Cohesion

**Track:** `ui-ux-cohesion_20260826`
**Specification:** [./spec.md](./spec.md)
**Status:** Not started
**Plan source of truth:** This file, governed by `conductor/workflow.md`.

## Execution protocol

Before implementation, mark the current task `[~]`. For logic-bearing changes, write and run the failing test before implementation. Every completed task follows the workflow’s task-commit and Git-note rules; record its commit SHA in this plan through a separate plan commit. Every phase ends with changed-file/test review, announced quality checks, manual verification, user confirmation in the interactive session, a checkpoint commit and Git note, and the checkpoint SHA recorded here through a separate plan commit.

No technology-stack deviation is anticipated. If implementation requires a new dependency or a change to the documented stack, stop before implementation, document the deviation, and obtain approval.

## Phase 1 — Interaction inventory and shared contracts

- [ ] Task: Inventory current interactive surfaces
  - [ ] Audit all 18 game scenes, Hub/profile controls, Settings/Progress overlays, ParentLock, and SpeakerButton.
  - [ ] Record existing resting, pressed, selected, locked, disabled, and audio-feedback states.
  - [ ] Identify controls already using `attachPressFeedback` and controls with scene-specific feedback.
  - [ ] Confirm no-fail, touch-target, reduced-motion, and pointer-cancellation constraints for each surface.

- [ ] Task: Establish the shared interaction test contract
  - [ ] Extend `src/__tests__/utils/pressFeedback.test.ts` for every supported object type and pointerdown/up/out/cancel behavior.
  - [ ] Verify captured base scale, optional spring behavior, and reduced-motion no-op behavior.
  - [ ] Add or update test helpers only where needed to simulate Phaser event registration.
  - [ ] Run focused tests and confirm expected failures before changing utility behavior, if utility changes are required.

- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
  - [ ] Verify the inventory covers every planned surface.
  - [ ] Run the focused interaction test suite.
  - [ ] Present the phase manual-verification scope and obtain user confirmation before checkpointing.

## Phase 2 — Cross-game child interaction cohesion

- [ ] Task: Add regression coverage before scene changes
  - [ ] Extend existing scene tests for tap-card families, including Alphabet, Word Match, Word Builder, How Many, First Sounds, More or Less, Odd One Out, Color Match, Add It Up, Take Away, and Pattern Builder.
  - [ ] Add missing scene tests for any changed scene without an existing corresponding suite.
  - [ ] Verify press feedback does not interfere with input locking, correct/wrong feedback, round transitions, or completion.
  - [ ] Include reduced-motion and pointerout/pointercancel cases.

- [ ] Task: Implement consistent child-control feedback
  - [ ] Apply the shared interaction treatment to missing tap cards and other child-facing interactive controls.
  - [ ] Preserve existing pointerdown versus pointerup navigation semantics and no-fail reactions.
  - [ ] Avoid duplicate listeners or competing tweens on controls that already have bespoke feedback.
  - [ ] Ensure new listeners/tweens are cleaned up through existing scene lifecycle behavior.
  - [ ] Keep all gameplay text-independent and preserve existing touch targets.

- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
  - [ ] Run targeted scene, interaction, and reduced-motion tests.
  - [ ] Manually verify one representative game from each interaction family plus Back and progress controls.
  - [ ] Confirm no visual feedback introduces pressure, penalties, or accidental navigation.
  - [ ] Obtain user confirmation and create the phase checkpoint.

## Phase 3 — Hub and profile-picker hierarchy

- [ ] Task: Write Hub/profile regression coverage
  - [ ] Extend `src/__tests__/scenes/hubScene.test.ts` for selected-profile indication, profile-picker selection, pressed tile state, earned/sticker state, and daily-limit state.
  - [ ] Add layout assertions for the preserved 5×3+3 grid at 1024×768.
  - [ ] Verify lazy loading, `navLocked`, profile switching, sticker-shelf refresh, and play-time behavior remain unchanged.
  - [ ] Add reduced-motion assertions for changed entrance, idle, or selection treatment.

- [ ] Task: Polish Hub visual hierarchy in place
  - [ ] Preserve the current grid, tile order, lazy navigation, sticker shelf, play-time indicator, mascot, and profile flow.
  - [ ] Rebalance icon, label, and sticker spacing for legibility at base and narrow-landscape sizes.
  - [ ] Add a persistent, unambiguous active-profile ring/outline/badge in the Hub and picker; do not rely on scale alone.
  - [ ] Distinguish resting, pressed, earned, and unavailable tile states using flat storybook treatments and non-color-only cues.
  - [ ] Add only subtle domain grouping accents; do not introduce categories, tabs, carousel navigation, or new instructional text.
  - [ ] Verify no clipping or overlap with Settings, profile controls, mascot, stickers, or play-time indicators.

- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
  - [ ] Run Hub/navigation/profile tests and quality checks for changed code.
  - [ ] Manually inspect 1024×768 and narrow-landscape layouts with fresh, earned, switched-profile, and time-limit states.
  - [ ] Verify reduced-motion behavior and touch-target sizes.
  - [ ] Obtain user confirmation and create the phase checkpoint.

## Phase 4 — Parent Settings and Learning Progress affordances

- [ ] Task: Extend parent UI regression tests
  - [ ] Cover visual/current-state updates for BGM, SFX, voice selection, Preview, Profiles, Progress, install, and Reset controls.
  - [ ] Cover selected profile states in Profiles and Learning Progress without changing the active profile from the report.
  - [ ] Cover explicit close, page navigation, cancel, delete, and reset interactions.
  - [ ] Preserve voice-listener cleanup, pinch-zoom restoration, parent-lock gating, and local persistence.

- [ ] Task: Improve Settings and Progress in place
  - [ ] Preserve the fixed-panel and overlay architecture, parent lock, existing data, and 18-game/6-per-page report.
  - [ ] Replace ambiguous text-only affordances with clear visual rows, state treatments, toggle presentation, chevrons, and selected outlines using Phaser primitives or existing assets.
  - [ ] Add consistent press feedback to parent controls and profile/action items.
  - [ ] Make close, previous/next, cancel, and destructive actions visually distinct and difficult to trigger accidentally.
  - [ ] Improve profile and report scanning without adding cloud data, new storage fields, or a new navigation framework.
  - [ ] Keep parent-facing copy available while preserving textless child gameplay.

- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
  - [ ] Run SettingsPanel, profile, progress, voice, and persistence tests.
  - [ ] Manually verify all parent-gated flows with audio on/off, multiple profiles, reset/delete cancellation, and narrow landscape.
  - [ ] Verify controls remain at least 64×64px and important controls approach 96×96px.
  - [ ] Obtain user confirmation and create the phase checkpoint.

## Phase 5 — Speaker and audio-visual feedback

- [ ] Task: Define and test the speaker-state contract
  - [ ] Extend speech tests for successful dispatch, disabled speech, unsupported speech, completion, interruption, and failure.
  - [ ] Extend SpeakerButton tests for pressed, active/replaying, unavailable/muted, neutral, and destroy/cleanup states.
  - [ ] Preserve the existing callback behavior and silent visual-only fallback.
  - [ ] Cover Musical Memory replay separately from Web Speech while using the same understandable visual grammar.

- [ ] Task: Implement minimal speaker feedback
  - [ ] Add the smallest lifecycle bridge needed for SpeakerButton to observe speech/replay state.
  - [ ] Show immediate tap acknowledgement, active speech/replay when observable, unavailable/muted state when applicable, and neutral state afterward.
  - [ ] Ensure interrupted or failed speech cannot leave a stale active state.
  - [ ] Keep the 96px touch target, iOS gesture unlock behavior, SFX gating, reduced-motion compliance, and scene cleanup.
  - [ ] Do not add a new audio dependency or couple the UI to one browser’s speech implementation.

- [ ] Task: Phase Verification & Checkpoint (Refer to `workflow.md`)
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

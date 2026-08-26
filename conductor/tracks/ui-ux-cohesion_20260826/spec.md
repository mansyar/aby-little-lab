# UI/UX Cohesion — Specification

**Track ID:** `ui-ux-cohesion_20260826`
**Type:** Feature
**Status:** Approved
**Approved:** 2026-08-26

## Overview

Aby’s Little Lab has completed its 18-game product scope and has established shared motion, audio, parental-control, profile, progress, and PWA systems. The next polish should improve consistency and discoverability without expanding the game catalog or changing the learning mechanics.

The current codebase has several concrete cohesion opportunities:

- `attachPressFeedback` is used by some interactive game cards but not by several tap-based scenes such as Alphabet and How Many.
- The Hub preserves a dense 5×3+3 tile grid, with 52–64px icons and 15px labels; the active profile is primarily communicated through scale.
- `SettingsPanel` and Learning Progress use large text controls whose action and current state can require trial-and-error tapping.
- `SpeakerButton` provides press feedback but does not expose a visible speaking, unavailable, or muted state.

## Objective

Make the existing experience feel consistent, legible, and responsive for preschool children and their parents while preserving the established visual language and interaction principles.

## User outcomes

- Children receive immediate, gentle confirmation that a tap was received in every game.
- Selected, earned, locked, and unavailable states are understandable without gameplay instructions or text.
- The Hub remains familiar but is easier to scan and profile selection is unambiguous.
- Parents can understand settings, voice selection, profiles, progress navigation, and destructive actions at a glance.
- Children can see when a speaker/replay interaction is active, unavailable, or complete.
- Reduced-motion users receive equivalent feedback without unnecessary animation.

## Functional requirements

### FR1 — Shared interaction grammar

1. Audit and standardize applicable resting, pressed, released, selected, locked, and unavailable states across all 18 game scenes, Hub/profile controls, Settings/Progress overlays, ParentLock controls, and SpeakerButton.
2. Tappable game cards and controls must provide immediate press acknowledgement and must restore correctly on release, pointerout, and pointercancel.
3. Persistent selected, earned, locked, and unavailable states must remain distinguishable after the transient press state ends.
4. Existing correct/wrong feedback, input locking, pointer semantics, navigation guards, and completion flow must remain unchanged.
5. Feedback must remain gentle and no-fail: no penalties, countdowns, pressure language, or game-over behavior may be introduced.
6. New or changed feedback must use the existing motion utilities and simplify to nonessential alpha/color/state changes under reduced motion.
7. Visual differentiation must not rely on color alone and must follow the existing flat storybook visual language.

### FR2 — Hub and profile hierarchy

1. Preserve the 18-game 5×3+3 Hub grid, tile order, lazy scene loading, sticker shelf, play-time indicator, mascot, and profile flow.
2. Rebalance icon, label, and sticker spacing where needed for legibility at 1024×768 and supported narrow-landscape sizes.
3. Add a persistent active-profile ring, outline, badge, or equivalent visual indicator; scale alone is insufficient.
4. Make tile resting, pressed, earned, and unavailable states visually distinct without changing their behavior.
5. Add only subtle, non-navigational domain grouping accents if useful; do not introduce category tabs, carousel navigation, or a new information architecture.
6. Keep child navigation text-light and do not add instructional text to gameplay.

### FR3 — Parent Settings and Learning Progress

1. Preserve the existing parental hold lock, fixed-panel/overlay architecture, local persistence, pinch-zoom behavior, profile model, and 18-game report with six rows per page.
2. Improve the visual affordance and current-state presentation of BGM, SFX, voice selection, Preview, Profiles, Progress, install, and Reset controls.
3. Add clear selected states for profile and report-profile choices.
4. Make close, previous/next, cancel, confirm, delete, and reset actions explicit and visually distinct.
5. Destructive actions must remain difficult to trigger accidentally and must not lose their existing confirmation behavior.
6. Parent-facing explanatory text may remain; child gameplay must remain text-independent.

### FR4 — Speaker and audio-visual feedback

1. Preserve the current `SpeakerButton` callback behavior, 96px touch target, speech gating, and visual-only fallback.
2. Show immediate press/replay acknowledgement.
3. Show active speech/replay state when observable, return to a neutral state after completion, and show an understandable unavailable/muted state when speech cannot start or is disabled.
4. Interrupted or failed speech must not leave a stale active state.
5. Musical Memory replay may use the same visual grammar but must not be coupled to Web Speech.

## Non-functional requirements

- Preserve 1024×768 Phaser FIT scaling and centered letterboxing.
- Preserve minimum 64×64px touch targets and approximately 96×96px targets for protected or important controls.
- Preserve flat fills, thick `#2D3748` outlines, soft/vibrant colors, and the prohibition on gradients, neon, and pure RGB colors.
- Preserve visual/audio pairing for significant events and the independent BGM/SFX behavior.
- Preserve `prefers-reduced-motion` handling through `src/utils/motion.ts`.
- Preserve offline gameplay, lazy-loaded game scenes, PWA behavior, and existing local storage schemas.
- Do not introduce a new UI framework, backend, audio dependency, or runtime dependency.
- Keep public component call sites stable where practical and clean up listeners/tweens on scene or overlay destruction.

## Out of scope

- New games, game mechanics, difficulty adaptation, or progression changes.
- Changes to profile, progress, sticker, play-time, or storage schemas.
- Cloud synchronization, backend work, or data export/import.
- Hub category tabs, carousel navigation, or a major information-architecture redesign.
- PWA caching/update architecture changes or a broad PWA toast redesign.
- Replacement of Professor Hoot or changes to its approved Ligne animation design.
- New gameplay instructions, timers, countdowns, penalties, scores, or pressure language.

## Acceptance criteria

1. Applicable interactive controls across the 18 games and key Hub/parent surfaces have consistent, tested visual responses.
2. Existing correctness, no-fail feedback, input locking, navigation, and completion behavior remain unchanged.
3. The Hub has no overlap, clipping, or unreadable control at 1024×768 or supported narrow-landscape sizes.
4. Active profile selection is unambiguous through a persistent visual state.
5. Settings and Learning Progress communicate current state and available actions without trial-and-error tapping.
6. Reset/delete flows retain clear cancellation and confirmation and cannot be triggered accidentally.
7. Speaker presses and speech/replay availability/activity have an understandable visual counterpart.
8. Reduced-motion behavior is verified for all changed feedback.
9. Existing automated tests are updated for changed behavior and the repository quality gates pass.
10. Manual verification covers desktop, phone/tablet landscape, touch/hold interactions, offline relaunch, audio states, speech states, and parent-gated flows.

## Expected deliverables

- Updated shared interaction feedback and affected scene/component implementations.
- Hub and profile-picker hierarchy refinements.
- Settings and Learning Progress affordance refinements.
- Speaker visual-state refinement.
- Focused automated regression tests.
- Concise UI/UX and device-verification notes or screenshots where useful.
- Necessary documentation amendments, with historical records preserved.

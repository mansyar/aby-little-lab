# Specification: Preschool Touch UX Hardening

**Track ID:** `preschool-touch-ux-hardening_20260801`
**Type:** Feature / UX hardening

## Overview

Improve the reliability and usability of all protected navigation controls and the Musical Memory replay control for preschool touch interaction. This track focuses on ParentLock correctness, visible hold feedback, generous touch targets, and regression coverage without changing gameplay mechanics or the broader performance architecture.

## Functional Requirements

### 1. ParentLock reliability

- Apply the same hardened behavior to Hub Settings and every game Back control.
- Start one 3-second hold operation per active pointer.
- Ignore duplicate pointer-down events while a hold is already active.
- Cancel the hold on pointer release, pointer leaving the control, pointer cancellation, or scene shutdown.
- Invoke the protected action exactly once only after the full 3-second hold completes.
- Prevent stale timers or callbacks after the scene is destroyed.

### 2. Hold-progress feedback

- Display a circular progress fill around the protected control while it is held.
- Progress must reset when the hold is cancelled or completed.
- The indicator must not block normal scene cleanup or leave display objects behind.

### 3. Touch targets

- Back, Settings, and Musical Memory Replay controls must expose a minimum **96×96 logical-pixel interactive area**.
- Preserve the existing visual labels/icons while enlarging only the interactive bounds where possible.
- Keep controls single-finger and prevent accidental activation from neighboring controls.

### 4. Testing

- Add regression tests for duplicate presses, release/cancel behavior, callback-once behavior, shutdown cleanup, and progress reset.
- Add coverage for the enlarged control hit areas in affected scenes.
- Preserve all existing gameplay and navigation behavior.

## Non-Functional Requirements

- Follow the existing Phaser 4, TypeScript, Vitest, and Biome conventions.
- Maintain reduced-motion and no-fail UX principles.
- Do not introduce measurable frame-time overhead during gameplay.
- Maintain project coverage thresholds and production build success.
- Verify behavior on a touch-sized landscape viewport during manual testing.

## Acceptance Criteria

- Holding any protected Back or Settings control for 3 seconds triggers navigation/settings exactly once.
- Releasing, moving away, or cancelling before 3 seconds never triggers the action.
- Repeated or multi-touch pointer-down events cannot create duplicate unlock callbacks.
- The circular indicator visibly progresses and is cleaned up on cancel, completion, and scene shutdown.
- Back, Settings, and Replay controls each have a 96×96 logical-pixel hit area.
- Automated tests, coverage, formatting checks, and production build pass.
- Manual touch verification succeeds across the Hub and all six games.

## Out of Scope

- Lazy-loading or restructuring SVG assets
- Bundle-size or boot-time optimization
- Orientation API fallback
- Audio error recovery
- Gameplay rules, scoring, art assets, or auto-return timing

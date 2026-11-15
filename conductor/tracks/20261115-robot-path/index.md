# Track: Robot Path

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** feature
**Priority:** high
**Branch:** `feat/20261115-robot-path`
**Base:** `master` @ `f2f602a0`
**Depends on:** none

## Summary

Robot Path is the 23rd game and the app's first programming game. A small robot
sits on a 3×3 garden grid with a star across it; the child taps direction arrows
into a six-slot strip, watches a dotted trail show where that program would go,
and presses Go. The robot walks exactly those steps. Reaching the star completes
the round; stopping short leaves every arrow in place so the child changes one and
runs again — a program is planned, executed and repaired, never failed.

It joins the `thinking` group (now 7 games) and adds no new storage, dependency or
network call. Arrows are drawn; the robot and two props ride the game's own lazy
chunk; only the Hub tile and sticker join the boot shell, taking it to 60 keys.

## Artifacts

- `verification/phase-1.md` … `phase-6.md`
- `review.md` — written by conductor-review after implementation
- `pr.md` — written by conductor-implement at PR time

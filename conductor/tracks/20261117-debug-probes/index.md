# Track: Debug Probes

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** bug
**Priority:** high
**Branch:** `fix/20261117-debug-probes`
**Base:** `master` @ `e6315890`
**Depends on:** none

## Summary

Fix-It Machine records every diagnosis tap as a right-or-wrong answer, so a child
who explores a card before repairing the real one is shown to a parent at roughly
50% accuracy — the opposite of the game's own no-penalty promise. This track
separates answering from exploring: an exploratory tap becomes a *probe*, counted
in the save, visible in Learning Progress as "looks", and never scored. Accuracy
keeps meaning answers, the adaptive window stops seeing guesses, and the lookup
count becomes the debugging metric the game was always measuring but reporting as
failure.

Only one scene needs to change, because only Fix-It asks a child to find which
existing object is the answer; every other wrong tap is a genuine answer to a
question the game asked. Phase 2 audits that claim by reading each scene's
recording call site and records the result instead of changing those games.

## Artifacts

- `verification/phase-1.md` … `phase-4.md`
- `review.md` — written by conductor-review after implementation
- `pr.md` — written by conductor-implement at PR time

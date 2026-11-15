# Track: Hub Game Groups

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** feature
**Priority:** high
**Branch:** `feat/20261115-hub-game-groups`
**Base:** `master` @ `703b12ad`
**Depends on:** none

## Summary

The Hub gains six chips in its existing top band — All plus the five learning
domains the game table already names (Letters & Sounds, Numbers & Counting,
Thinking & Matching, Play & Memory, Feelings & Stories). Tapping one redraws the
board with only that group's games at 176×196 instead of 144×116, so a child
reaches any game in at most two taps and the grid never has to be read through.
Membership is a `group` field on `GAME_REGISTRY`, so the registry stays the single
declaration of the 22 games. All remains the landing state and keeps today's
geometry byte-identical, and a chip tap speaks the group's name through the
existing TTS path. Five new shell glyphs bring the boot shell to 58 keys.

## Artifacts

- `verification/phase-1.md` … `phase-5.md`
- `review.md` — written by conductor-review after implementation
- `pr.md` — written by conductor-implement at PR time

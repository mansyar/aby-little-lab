# Track: Adaptive Literacy & Memory (Six-Game Extension)

**Track ID:** `adaptive-literacy_20260814`
**Branch:** `feature/adaptive-literacy`
**Created:** 2026-08-14
**Status:** Spec ready — awaiting approval to plan

## Documents

- [Specification](./spec.md) — extend adaptive ±1 band ladders to the six literacy/memory games
- [Implementation Plan](./plan.md) — TDD task breakdown: Phases 1–4 (word family → discrimination guards → memory family → verification)
- [Metadata](./metadata.json)

## Summary

Mirror the shipped numeracy adaptive-difficulty track for the remaining six games: each
defines a `BASE_LADDER` and per-band invariants, reads `getAdaptiveBandShift(gameId)` at
`create()`, and passes the shift into its pure generator. Easy and Hard bands stay within
the game's supported pool; shift 0 is fixture-proven byte-identical to classic behavior.
Reuses `adaptiveLogic.ts`, the `adaptiveDifficulty` toggle, and per-game `recent` windows —
no storage or UI changes.

## Design Decisions (user-approved 2026-08-14)

1. **Hard-band guard relaxation** — Hard bands deliberately allow confusable distractors
   (Find the Letter same-family; First Sounds B/P, D/T pairs); Easy/Classic keep all guards.
2. **Musical Memory included** — adapted via start-length shift (1→2→3) instead of exclusion.

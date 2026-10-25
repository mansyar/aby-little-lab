# Aby's Little Lab — Known Issues and Roadmap

This document is the single home for two things: what is known to be broken in
Aby's Little Lab, and what is planned next. Nothing else in `docs/` keeps a
second copy of either list — other documents link here instead.

Every entry below was checked against the code on 2026-10-25. Where an entry
names a file, that file is where the debt lives; where it names a symptom, that
is what a reader would actually see.

## Known Issues

### Five copies of the same shuffle, and an RNG seam in only two modules

The `shuffle` helper is byte-identical in `src/game/bigSmallLogic.ts`,
`src/game/animalTraceLogic.ts`, `src/game/popFreezeLogic.ts`,
`src/game/shapeSorterLogic.ts` and `src/game/shadowMatchLogic.ts`, and only
`src/game/feelingsFacesLogic.ts` and `src/game/storyOrderLogic.ts` accept an
injected RNG. That leaves 19 of the 21 per-game logic modules testable only
through `Math.random`. A reader notices it by searching `src/game/` for
`export function shuffle` and finding five definitions.

## Future Work / Roadmap

The same material, ordered by how much each item would improve the product.
The track named against each item is the track that would deliver it.

1. **One shuffle, one RNG seam.** A single shared shuffle helper and an
   injectable RNG across the logic modules would let the remaining 19
   per-game modules be tested without stubbing `Math.random`. Track:
   *shared-random-helpers*.

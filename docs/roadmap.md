# Aby's Little Lab — Known Issues and Roadmap

This document is the single home for two things: what is known to be broken in
Aby's Little Lab, and what is planned next. Nothing else in `docs/` keeps a
second copy of either list — other documents link here instead.

Every entry below was checked against the code on 2026-10-26. Where an entry
names a file, that file is where the debt lives; where it names a symptom, that
is what a reader would actually see.

## Known Issues

None. The five-copy `shuffle` duplication and the missing RNG seam were retired
by the *shared-random-helpers* track (2026-10-25): `src/game/random.ts` now holds
the only `shuffle` definition in `src/game/`, and every per-game logic module
accepts an injectable RNG that defaults to `Math.random`.

## Future Work / Roadmap

The same material, ordered by how much each item would improve the product.
The track named against each item is the track that would deliver it.

None. The one open item — *one shuffle, one RNG seam* — shipped as the
*shared-random-helpers* track on 2026-10-25.

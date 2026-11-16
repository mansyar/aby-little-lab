# Track: Fix-It Machine

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** feature
**Priority:** high
**Branch:** `feat/20261116-fix-it-machine`
**Base:** `master` @ `56779675`
**Depends on:** none

## Summary

Fix-It Machine is the 24th game and the app's first debugging game. A friendly
workshop machine follows a tape of picture-instruction cards to finish one job on
one toy; one card is wrong, so the machine does something silly instead. The child
taps the card they believe is wrong, picks the right tool from a three-card repair
tray, and presses Go again — so the program is read, watched and repaired where it
went wrong, and nothing is ever lost.

It joins the `thinking` group (now 8 games) and adds no new storage, dependency or
network call. Six tool icons, four machine poses and six toy goals ride the game's
own lazy chunk; only the Hub tile and sticker join the boot shell, taking it to 62
keys. The 24th tile fills the wide 6×4 grid exactly.

## Why debugging

Four-year-olds detect an error in a familiar sequence on 83–96% of trials and,
invited to fix it, get the correction right 93% of the time — while only 24.6%
produce a functional repeat-N program, and most children in preschool
programming studies rebuild a failed program from scratch rather than repair it.
The suite already teaches authoring (Robot Path) and ordering (Story Order); this
is the missing half of the programming loop.

## Artifacts

- `verification/phase-1.md` … `phase-6.md`
- `review.md` — written by conductor-review after implementation
- `pr.md` — written by conductor-implement at PR time

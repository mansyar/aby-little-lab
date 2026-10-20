> **Status:** FINAL - released 2026-10-20
> **Tag:** `v1.20.0`
> **Live:** https://aby-lab.com (deployed via Coolify on tag push; desktop HTTP/hash smoke passed, device-class pass pending)

# Release Notes - v1.20.0

Story Order is the twenty-second game, and the release that solves the suite's
remaining architectural squeeze: from here on, a game's own art can ride in its
own chunk instead of competing for the boot shell.

## What's New

### Story Order - Game 22 (Story Sequencing)

A narrative-sequencing game for the one school-readiness skill the suite did not
yet cover: putting events in the order they happen.

- **6 rounds of 3 story panels.** Each round shuffles a three-panel story and the
  child drags the panels into three slots, marked only by 1/2/3 pips - no digits,
  no words.
- **8-story pool, no repeats.** Four obvious strips (seed → sprout → flower,
  flat balloon → round → aloft, egg → cracking → duckling, ice cream → dripping
  → puddle) and four subtle ones (banana, cup pouring, foot getting dressed,
  cloud → rain → puddle). Rounds 1-3 are obvious, 4-6 subtle.
- **Retry in place.** A wrong order plays a soft tone, the mascot nods, and every
  panel wiggles where the child left it - move one and try again. Nothing is
  swept back to the tray, so a near miss never costs the work.
- **Ordinal pips, not numbers.** The ordering cue is a dot pattern, so the game
  asks nothing of a pre-reader.
- **Twelfth spoken rule.** "Put the story in order, first to last." - spoken
  once, replayable from the speaker glyph, dimmed when SFX is off.
- New art: 24 story panels, a hub tile and a storybook sticker with three sequenced picture cards.

## Improvements

### Game art that no longer competes for the boot budget

The 176 SVGs the suite ships are embedded in the shell entry, which had reached
192.4 kB of its 200 kB gate. Game 22 needed 24 panels (roughly 18-30 kB) and
could not have them.

- Story panels are imported only by `src/game/storyOrderArt.ts` and rasterized in
  the scene's own `preload()`, so they arrive with the game chunk (33.92 kB) and
  never load at boot.
- The boot shell is **195.4 kB** of 200 kB, and a CI gate plus a test fail the
  build if a panel key ever reaches it.
- `svgDataUri.ts` now owns the string-to-data-URI step shared by boot art and
  in-game art.

### Smaller things

- Hub holds 22 tiles: 6/6/6/4 wide, 10+10+2 on paged phone layouts.
- Learning Progress lists 22 games, still paged 6 + 6 + 6 + 4.
- The shared choice-round base now serves 14 games.

## Bug Fixes

- **Taps that dragged.** Phaser starts a drag on the first pointer move, and a
  drag ending over a panel's own slot is indistinguishable from a drop, so a
  slightly wobbly tap on a placed panel did nothing. A 10 px threshold now keeps
  jitter a tap (`StoryOrderScene`), and a tap withdraws a placed panel as
  intended.

## Known Issues

- **No real-device pass yet** for Story Order's drag feel. Recorded as pending in
  `docs/device-testing-checklist.md`; the drag path is covered by scene tests,
  not by a finger on glass.
- `docs/PRD.md` and `docs/TDD.md` still describe a twenty-game suite (pre-existing
  drift, unchanged by this release).
- `conductor/product.md` still carries two duplicate `## Changelog — Game 20`
  sections (pre-existing).

## Installation

Install or open the app as usual - the PWA picks up the new version on next
launch (an update prompt appears when a new service worker is waiting). No
storage migration is required: existing profiles gain the new game's sticker slot
and progress row automatically.

## Release Verification

- **Tag:** `v1.20.0` on `master` (merge commit `71d6166`, PR #47).
- **CI:** tag push runs Quality Gates and Deploy to Coolify.
- **Gates at release:** 103 test files / 2,208 tests, coverage 98.13 / 90.54 /
  98.14 / 98.96, shell 195.4 kB, PWA 15/15.
- **Live check:** entry-asset hash matches the local `dist/` build; Hub shows 22
  tiles.
- **Device matrix:** pending.

## Feedback

Bug reports and ideas are welcome via the repository issue tracker.

> **Status:** FINAL - released 2026-10-23
>
> **Tag:** `v1.21.0` on `master`, pushed to origin; Coolify deploys on the tag
> push. The live smoke and the entry-hash check it fires are recorded in
> `docs/release-checklist.md`'s v1.21.0 sign-off; the device-class pass is
> still pending ((it is the first entry in `docs/roadmap.md`)).
>
> **Base:** the `v1.20.0` tag (`437d56b`).

# Release Notes - v1.21.0

Two things a parent will notice the first time they open the app.

The app now opens about twice as fast, because the pictures for a game are
drawn when the child opens that game instead of all at once when the app
starts. If that takes a moment, Professor Hoot appears with three small dots
pulsing underneath him, so the child sees the app is working rather than a
frozen screen.

And every game now has its own voice. The sound of a right answer, the gentle
sound of a not-quite answer and the sound of winning are different from game
to game, so two games in a row do not sound alike. Behind those, quieter fixes:
the row of dots that shows how far through a game the child is now fills
correctly from the second time a game is played, the not-quite sound waits for
the game to finish reacting rather than talking over it, and in the two games
where children drag numbers or pictures into order, a card can now be swapped
with another and a tap takes it back.

Eight tracks merged since the `v1.20.0` tag, in merge order. Two of them are
documentation-only and change nothing a child or a parent sees; the rest are
internal work whose effect is a faster start, a distinct voice per game, or a
session that behaves the same the second time as the first.

## What Shipped Since v1.20.0

### PR #48 - The PRD and the TDD, rewritten

Documentation only. No product change.

- `docs/PRD.md` and `docs/TDD.md` were rewritten around the app that actually
  ships: a 22-game curriculum map, a reconciled source tree, the shared scene
  bases, the narrator, the audio-focus policy, the adaptive-banding rules, the
  asset budget and the test-suite figures.
- The two documents had stopped at Game 20 and described an app with no shared
  shell, no narrator, no profiles and no play-time limits.

### PR #49 - The shell diet: every game brings its own art

- The boot screen no longer rasterises the whole picture library. The shell
  keeps only the 53 keys the Hub and the shared game chrome draw; a game's own
  art rides its own chunk and is drawn when that game is opened. The suite's
  202 SVGs are grouped into 12 lazy art groups (131 keys, 125 of them
  game-only); the other 71 files are the 47 the boot set alone draws, plus
  Story Order's 24 panels.
- Cold boot fell from 808 ms to 419.5 ms against the 3 s gate, and the
  4x-throttled boot from about 4.2 s to 1,697.2 ms (measured 2026-10-20).
- A first tap on a game now shows Professor Hoot with three pulsing dots while
  that game's art arrives, instead of a silent pause. The 82 ms measured on
  2026-10-20 is the increment the lazy-art change added over a built baseline
  from before the track (`f377bf8`), the quantity the 400 ms budget was set
  against and met on that basis, not an absolute cost. The absolute cold first
  tap measured on 2026-10-22 came in at 351-392 ms median and 462-640 ms
  worst, so the 400 ms budget is not demonstrated by that measurement;
  `docs/perf-baseline.md` keeps the per-run numbers.
- The shell entry fell from 195.4 kB to 129.1 kB at the time of the track, well
  inside the 200 kB gate. It measures 134.6 kB today.

### PR #50 - The docs and the dead code, swept

Documentation only. No product change.

- The README was turned into an entry point that links the PRD and the TDD
  instead of restating them, and the stale test counts, the wrong adaptive
  threshold and the wrong lazy-scene count were corrected.
- Orphan JSDoc, stale comments and the leftover `.gitkeep` placeholders were
  removed, the Vite configuration warning was fixed, and the executed but
  unrecorded `drop-ligne-mascot` track was closed.

### PR #51 - The 22 games, declared once

- The games are now declared in one place, `src/game/gameRegistry.ts`. The Hub
  tiles, the Learning Progress rows, the Hub's page counts, the shell's asset
  table and the sticker-key convention all read from it.
- Nothing a parent sees changes. What it buys is that the Hub, the progress
  list and the sticker shelf can no longer disagree about which games exist -
  the list used to be copied by hand into five places, three of which failed
  silently.

### PR #52 - One drag board for the two ordering games

- Number Order and Story Order now share one ordered-drag board
  (`src/game/dragBoard.ts`). A placed card can be swapped with another, and a
  tap withdraws it back to the source row.
- Each game keeps its own wrong-answer behaviour: Number Order still bounces
  the row home, Story Order still lets the child move one panel and try again.
- The wrong-answer reaction that eight games had written out by hand now lives
  in the shared base class, so its tone, wiggle, mascot nod and reduced-motion
  handling cannot drift apart.

### PR #53 - The Hub grid, taken apart

- The last oversized file in the codebase - a 773-line Hub grid that mixed
  layout, paging, the sticker shelf and time-up dimming - was split into six
  focused modules under `src/game/hub/`, behind a thin orchestrator the Hub
  still imports in one place.
- The Hub renders and behaves exactly as before.

### PR #54 - Every game gets its own voice

- The correct, incorrect and win sounds are no longer the same three notes in
  all 22 games. Each game carries its own sonic identity - a pitch offset, a
  waveform, a tempo and its own three contours - resolved from the game's id.
- The not-quite cue stays a gentle descending tone, and the win cue is held
  inside 300-800 ms, so the change is a difference in character rather than in
  loudness or length.
- A parent playing two games back to back can hear that they are different
  games without looking at the screen.

### PR #55 - The session lifecycle, made whole

- The row of progress dots fills again from the child's second playthrough. In
  18 of the 22 games it had stopped: the dots list kept the previous visit's
  destroyed objects, so the dots the child could actually see never filled.
  Four games had already worked around it in their own files; the fix moved
  into the shared base class.
- The not-quite sound now plays after the game's own reaction instead of over
  it, so the child hears the game's feedback and the cue in the right order.
- Backing out of a game still feeds the difficulty window: the taps from an
  abandoned session are flushed into the rolling tap window instead of being
  lost, so the app keeps an accurate picture of how the child is doing.
- The shutdown handler no longer adds one entry per visit.

## Known Issues

### The v1.20.0 Known Issues, one by one

`docs/release-notes-v1.20.0.md` ends with a Known Issues list. That file is a
shipped record and is not edited; here is where each of its three bullets
stands today.

- **Still stands - no real-device pass for Story Order's drag feel.** The
  per-device rows in `docs/device-testing-checklist.md` are still unchecked and
  the four most recent release records still close with device-class execution
  pending. The drag path is covered by scene tests, not by a finger on glass.
- **Resolved - "PRD and TDD still describe a twenty-game suite".** That was
  true when v1.20.0 shipped and false a few hours later: PR #48 rewrote both
  documents against the 22-game app in the same day. Both now describe the
  shipped product.
- **Resolved - "product.md still carries two duplicate Changelog - Game 20
  sections".** The duplicate is collapsed in the same batch this release
  carries, and the surviving entry is the one that agrees with the shipped
  difficulty ladder.

The other figures in the v1.20.0 notes - the shell size, the chunk count, the
SVG count and the test counts - are that release's own measurements, not the
current ones. The current shell size, chunk count and suite size are in
`README.md`.

Two older shipped notes carry the same kind of stale label:
`docs/release-notes-v1.16.0.md` and `docs/release-notes-v1.17.0.md` still open
with "**Status:** DRAFT - pending production verification", although both
releases were tagged, deployed, and are listed as released in `README.md`. The
device verification those banners wait on is still outstanding - it is the
first entry in `docs/roadmap.md` - but the releases themselves shipped. Those
files are shipped records too, and are not edited here.

### What is still open

The full list of known issues and of the planned work lives in
[`docs/roadmap.md`](roadmap.md). It is the single home for both; nothing is
copied here.

## Installation

Nothing to install by hand. The app updates itself the way it always has:
reopen it, or accept the update prompt, and the new service worker takes over.
No storage migration is required: none of these eight tracks changes the
saved progress format, the profile format or the sticker set.

## Release Verification

The figures below were measured on 2026-10-22, on the branch that carries all
eight merges, and re-confirmed by CI on the release commit.

- **Merged:** PRs #48, #49, #50, #51, #52, #53, #54 and #55, on `master` after
  the `v1.20.0` tag (`437d56b`).
- **Gates:** 118 test files / 2,488 tests, all green; coverage 97.92%
  statements, 91.62% branches, 96.58% functions, 98.69% lines against the
  90 / 85 / 88 / 95 floors; shell entry 134.6 kB against the 200 kB gate; 42
  JavaScript chunks, all 42 precached, 54 precache entries in total; PWA
  validation 16/16.
- **Released:** `package.json` bumped to `1.21.0` on 2026-10-23 and dispatched
  as the annotated tag `v1.21.0` on `master`; Coolify deploys on the tag push.
  The live smoke and the entry-hash check are recorded in
  `docs/release-checklist.md`'s v1.21.0 sign-off.
- **Device matrix:** pending - see
  [`docs/device-testing-checklist.md`](device-testing-checklist.md).

## Feedback

Bug reports and ideas are welcome via the repository issue tracker.

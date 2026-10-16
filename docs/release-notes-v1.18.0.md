# Release Notes - v1.18.0

> **Status:** DRAFT — pending production verification
>
> **Tag:** `v1.18.0`
>
> **Deployment:** https://aby-little-lab.ansyar-world.top

This release completes adaptive difficulty across the suite and aligns every
doc with the shipped 20-game experience: the final three games get per-profile
±1 band ladders, and the README, PRD, TDD, and release notes all describe the
same twenty games parents and kids actually see.

## What's New

- **Adaptive Difficulty — complete (15 games).** Pattern Builder, Odd One Out,
  and Color Match join the twelve existing adaptive games, so every game with
  a right/wrong tap signal now shifts its easy-first ladder one band up or
  down at playthrough start from the child's last 10 taps (per profile, never
  mid-game, invisible to kids). Pattern Builder serves per-band rounds (ABAB +
  end gap → any type + end gap → any type + any gap); Odd One Out caps frog
  rounds at three per playthrough with a pool-safe group fallback; Color Match
  moves its easy/hard split point (4+2 / 3+3 / 2+4). The five games without an
  accuracy signal or band dimension (Shape Sorter, Shadow Match, Big vs.
  Small, Pop & Freeze, Animal Trace) stay fixed by design.
- **Docs aligned with the 20-game suite.** The README lists all 20 games with
  fresh test figures (1803 tests across 69 files), the PRD carries Games 19–20
  plus the 15-game adaptive note, the TDD reflects the 23-loader registry, and
  the missing v1.17.0 notes were authored from git history.

## Improvements

- The Learning Progress report, Hub 5×4 grid, 170-asset preload, and offline
  PWA behavior are unchanged — this release adds no new assets, mechanics, or
  storage migrations.
- `pnpm run check` exits 0 (the August pre-existing Biome red no longer
  reproduces); the global coverage-threshold gap for unrelated glue code
  stays documented in `tech-stack.md` and tracked separately.

## Bug Fixes

- No user-facing bugs fixed in this release beyond the review-fix sweep that
  corrected stale "eighteen games" prose across README, PRD, and TDD.

## Known Issues

- Learning progress and play-time budgets are stored per device per profile -
  they do not sync across devices (accepted; cloud sync is out of scope).

## Installation

The game is a PWA - update by reopening the app or triggering an update from
the install/update prompt. All progress, stickers, profiles, and play-time
settings are stored locally on the device.

## Release Verification

> Pending production verification. This section will be completed with the
> deployed run, live checks, and device-class sign-off after release.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).

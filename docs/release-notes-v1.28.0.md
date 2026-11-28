# Release Notes - v1.28.0

> Status: DRAFT
> Tag: pending
> Base: v1.27.0 (`019a26cd`, 2026-11-27)
> Date: 2026-11-28

Three PRs have merged since v1.27.0. All three are parent-visible: a 25th game called Repeat Machine, a hub-grid fix that keeps every tile visible and tappable on wide screens, and a per-profile narration pace control in Settings. The games, rules and controls are otherwise unchanged, and nothing new is asked of a child. Profiles, stickers, settings and saves carry over without migration.

This is a draft. No release-candidate, CI, tag, deploy or live result is claimed here; those sections are placeholders until verification is measured and recorded.

## What Shipped Since v1.27.0

Three PRs merged after v1.27.0, listed in merge order.

### PR #109 - Repeat Machine: game 25

- Children can author a short loop and watch the machine replay it: pick an action and a count of 2–4, then watch the machine run it back.
- When the count is wrong, the machine visibly replays the loop so the child can see the mismatch and try again. Sessions run for six rounds with the same scoring and completion behaviour as the other games.
- Repeat Machine sits in the Thinking group on the hub, with its own progress row, tile and sticker. The texture cap moved from 320 to 322 for two copied-shell SVGs under unique keys; no new artwork was designed.
- No migration, new dependency or storage change. [PR #109](https://github.com/mansyar/aby-little-lab/pull/109).

### PR #110 - Wide hub grid shows and taps the 25th tile

- On wide desktop screens the All view used four rows, leaving the 25th tile and its plaque below the 1024×768 fold. The 25th tile now flows onto a fifth row and the wide board is recentered, so every game is visible and tappable without scrolling.
- Row 0 now anchors below the interactive chip band. Tile size and horizontal spacing are unchanged; vertical row spacing is now 18px so the five-row board clears the chip band and fits 1024×768. No paging was added; the narrow, paged hub path is unchanged.
- No migration, new dependency, new asset or storage change. [PR #110](https://github.com/mansyar/aby-little-lab/pull/110).

### PR #111 - Parent control for narration pace

- Settings now has a narration pace selector beside the voice row, with Slower, Gentle and Standard presets. It applies per child profile on boot and when switching profiles.
- Gentle is byte-identical to the previous read-aloud behaviour and is the default for existing profiles, so nothing changes for a child unless a parent opts in. Backup export carries the pace; merge keeps the local setting and replace restores the incoming one.
- This is an additive profile field only: no schema bump, new dependency or new art asset. [PR #111](https://github.com/mansyar/aby-little-lab/pull/111).

## Installation

Nothing to install by hand: this release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy. Offline play uses the precached entries from the first visit. There is no storage migration: existing profiles, stickers, settings and saves carry over exactly as they were. Tag, deploy and live-build verification are pending for this draft, so no served version or shell hash is claimed yet.

## Release Verification

> **Pending.** This is a DRAFT. No release-candidate build, CI run, tag, deploy or live result has been measured or recorded for v1.28.0 in this document. The bullets below are placeholders to be filled with measured evidence before the Status changes to FINAL.

- Integrated gate: pending. No Biome, TypeScript, Vitest, coverage, build, bundle, module-size, texture, PWA or docs result is claimed here.
- Boot and first tap: pending. No boot, strict-header or headed first-tap figure is claimed here.
- Browser matrix: pending. No local or CI browser result is claimed here.
- Physical-device coverage: **SKIPPED — accepted gap.** No physical iOS Safari, Android Chrome or Fire tablet pass is claimed. See [device-testing-checklist.md](device-testing-checklist.md).
- Tag, deploy and live verification: pending. No tag commit, CI run, deploy, HTTP status, served version or shell hash is claimed here.

Measured figures and archived release evidence will be linked here once recorded.

## Known Issues

The full list of known issues lives in the README's [Known Issues](../README.md#known-issues) section, and planned work lives in [conductor/roadmap.md §10](../conductor/roadmap.md#10-roadmap); nothing below duplicates either.

- Physical iOS Safari, Android Chrome and Fire tablet behaviour remains an accepted gap; see [device-testing-checklist.md](device-testing-checklist.md). No physical-device pass is claimed.
- This is a DRAFT with verification still pending. No production-retention result was measured by these three PRs.

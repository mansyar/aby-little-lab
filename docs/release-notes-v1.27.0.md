# Release Notes - v1.27.0

> Status: DRAFT
> Tag: (pending)
> Base: v1.26.1 (ce88cb7b, 2026-11-26)

Four PRs have merged since v1.26.1. Two are parent-visible: the four signature content variants now reach real playthroughs, and the Progress Overview shows the current adaptive-band spread. The other two are internal retention-protocol and blank pilot-pack documents that were not executed. The games, rules and controls are unchanged, and nothing new is asked of a child. Profiles, stickers, settings and saves carry over without migration.

## What Shipped Since v1.26.1

Four PRs merged after v1.26.1. The two parent-visible changes lead; the two internal documentation PRs follow in merge order.

### PR #104 - Signature content variants reach play

- The four signature content variant packs shipped in v1.25.0 were data only, so children never saw them. They now reach real playthroughs through the existing generators and scenes: Word Match, Story Order, Shape Sorter and Feelings Faces.
- One variant is selected per playthrough. Where a variant is thin, the generator falls back to the full content pool so round content stays complete.
- Round counts, scoring, completion and adaptive-band behaviour are unchanged. The no-variant path is byte-identical to before, and no new content, asset or game rule was added.
- Archived evidence: [PR #104 record](../conductor/archive/20261126-wire-content-variants/pr.md) and [PR #104](https://github.com/mansyar/aby-little-lab/pull/104).

### PR #105 - Current adaptive-band spread on Progress Overview

- The Progress Overview now shows the current adaptive difficulty spread: how many adaptive games have been assessed and how many sit at easier, classic or harder.
- The readout covers only the 22 adaptive games and is derived from the viewed profile's recent answers. Explicit states cover adaptive-off, insufficient data, all-classic and mixed spreads, and the line wraps on narrow layouts.
- Per-game pages and existing behaviour are unchanged.
- This is a current snapshot, not band-transition history. It does not measure the two-week longitudinal target and does not claim that target was met.
- Archived evidence: [PR #105 record](../conductor/archive/20261127-progress-band-movement/pr.md) and [PR #105](https://github.com/mansyar/aby-little-lab/pull/105).

### PR #102 - Retention validation proxy protocol (internal, not executed)

- Internal documentation only: a consented local study procedure, a proxy definition built from data the app already keeps on device, a parent interview guide and privacy rules.
- Recruitment was not executed. No families were contacted, no interviews were held and no exports were read. No retention result or production-retention evidence is claimed.
- See [retention-validation.md](retention-validation.md).

### PR #103 - Retention pilot pack (internal, not executed)

- Blank, printable run sheets derived from the protocol: recruitment note, consent form, evidence layout, checklist and proxy worksheet.
- The pilot was not run. No families were contacted, no interviews were held and no Day-7 or close-out backup export was read. Every sheet remains blank.
- See [retention-pilot-pack.md](retention-pilot-pack.md).

## Installation

Nothing to install by hand: this release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy. Offline play uses the precached entries from the first visit. There is no storage migration: existing profiles, stickers, settings and saves carry over exactly as they were. Live deployment and live-build verification are pending for this DRAFT.

## Release Verification

> **Pending.** This is a DRAFT note for the release candidate. The tag has not been created, no deployment has run and no live verification has happened. The figures below are measured from the exact release-candidate commands run at candidate head `65fe7286f0b0e37493268c0e299c469d47129211` on 2026-11-27; they are candidate evidence, not a release-wide claim, and none is inherited from an earlier release.

- Integrated gate: **exit 0** on the final candidate (Biome 378 files with no fixes; app and E2E TypeScript clean; Vitest 159 files / 3,454 tests; coverage statements 97.11 %, branches 91.01 %, functions 96.4 %, lines 98.25 %; Vite 493 modules; module-size zero warnings; texture guard passed; PWA 16 passed / 0 failed with 53 chunks and 65 precache entries (1880.45 KiB); docs 5 passed / 0 failed). Shell `index-DF9s1m1B.js` is 196.3 kB via `validate-bundle` (200.98 kB as Vite prints it, 51.54 kB gzip), inside the unchanged 200 kB gate with only the pre-existing Phaser chunk advisory. Frozen install also exited 0 with the lockfile up to date and no drift. Raw gate log: `.conductor/evidence/phase-3/full-gate.log`; integrated record: `conductor/tracks/20261127-release-v1-27-0/verification/integrated.md`.
- Boot and strict headers: `validate-boot` exited 0 with 766 / 377 / 397 ms samples and a 0.40 s median, inside the unchanged 3 s budget. The first-tap script's own boot samples were 559 / 512 / 459 ms (0.51 s median), with an unthrottled median of 418.6 ms and a 4×-throttled median of 1286.6 ms. The candidate `aby-little-lab:headers` image was rebuilt at the head above and strict-header validation exited 0 with 28 passed / 0 failed. The missing-hash immutable-404 behaviour is a pre-existing, already recorded quirk, not a new failure.
- Headed first tap: **exit 0**, 50 cold / 0 warm samples, exactly 10 per game, no headless or warm-only substitution. Aggregate cold p95 response / finished / total 78.5 / 61.1 / 256.4 ms; cold median total 190.8 ms; worst cold total **283.8 ms (Add It Up)**, inside the unchanged 400 ms gate. Per-game p95 totals: Shape Sorter 225.9, Find the Letter 218.6, Find the Word 262.0, Add It Up 283.8, Memory Match 185.5 ms. Raw evidence: `conductor/tracks/20261127-release-v1-27-0/verification/first-tap-headed.json` and `conductor/tracks/20261127-release-v1-27-0/verification/first-tap-headed.stdout.log`.
- Browser matrix: the discovered roster was 50 tests in 20 files — Chromium 26, WebKit 8, Firefox 8, mobile Chromium 8. All four projects passed on their first local attempt with zero retries, run sequentially in the required order: 26 / 8 / 8 / 8, 50 passed in total. These are local emulated browser results (WebKit, Firefox and mobile Chromium are emulation), not physical-device evidence. Raw logs: `.conductor/evidence/phase-3/browser-roster.txt` and `.conductor/evidence/phase-3/browser-matrix.log`.
- Physical-device coverage: **pending — SKIPPED — accepted gap is recorded only at ship time.** No physical iOS Safari, Android Chrome or Fire tablet pass is claimed.
- Retention evidence: **none.** The protocol and the blank pilot pack were not executed; no Day-7 value, return rate or field result exists.
- Tag, deploy and live verification: pending. These notes become `FINAL` only after tag CI, Coolify deploy and live URL/build/version/hash verification pass.

Evidence paths above are given in code form; clickable archived evidence links are finalized after archival/ship.

## Known Issues

The full list of known issues lives in the README's [Known Issues](../README.md#known-issues) section, and planned work lives in [conductor/roadmap.md §10](../conductor/roadmap.md#10-roadmap); nothing below duplicates either.

- The Progress Overview band readout reflects recent answers at the time it is viewed. It is not persisted band-transition history and does not measure the two-week longitudinal target.
- Physical iOS Safari, Android Chrome and Fire tablet behaviour remains an accepted gap; see [device-testing-checklist.md](device-testing-checklist.md). No physical-device pass is claimed.
- Production retention remains unproven. The protocol and the blank pilot pack record no field result, and no family data was read.

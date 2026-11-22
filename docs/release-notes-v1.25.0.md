# Release Notes - v1.25.0

> Status: DRAFT
> Tag: (pending)
> Base: `v1.24.0` (`cac20094`, 2026-11-21)

One feature track has merged since v1.24.0, together with the last two housekeeping items from the roadmap. For families the headline is more to play and learn in the games they already know: twice as many words, stories, feelings moments and shapes, with fresh artwork drawn in the same gentle style. Nothing new is asked of a child — the rules, the controls and the familiar board are unchanged. Behind the scenes, the code now has a strict size budget and the long history of releases has been gathered into one readable file, so the app stays easy to keep healthy. There is nothing to install or move over: this is the same Aby's Little Lab, with more to discover.

## What Shipped Since v1.24.0

One feature track merged since v1.24.0 (PR #92), followed by the two P6 housekeeping items from the same release work, in that order.

### PR #92 - More to learn in the games you already know

- The four core learning pools are roughly doubled: **60 words** (27 three-letter, 33 four-letter) for the early-reading games, **30 stories** told across **90 panels** (15 straightforward, 15 more subtle) for Story Order, **48 feelings scenarios** (12 for each emotion) for Feelings Faces, and **24 shapes** with six new cut-outs for Shape Sorter and Pattern Builder.
- Each pool carries two opt-in signature variants, so a repeated visit can offer a slightly different set without changing the rules, and no item repeats within a playthrough. All the new art is original and authored in the project, in the same storybook style.
- A machine-checkable art budget now rides the build: `scripts/validate-textures.js` re-baselines the raster caps to 80/320 MiB and adds a hard typical-to-full ratio of 0.5, so growth in the artwork cannot silently bloat what a child downloads.
- No new games, game rules, game IDs, scenes, input modes or languages: only the content pools and the build-time guard changed.

### P6 - A strict size budget for the code

- Every production module under `src/**/*.ts` is now 400 lines or fewer (167 files, longest 399). Thirteen oversized modules were split into smaller files without changing any public API or kid-visible behavior.
- A new guard, `scripts/validate-module-size.js`, warns above 400 lines and fails above 600. It checks the real source with zero warnings and fails a synthetic 601-line fixture with exit 1. It is wired into the `verify_phase` gate at every step, so an oversized file cannot merge unnoticed.
- This is housekeeping for the people who maintain the app: nothing on screen or in gameplay moved.

### P6 - One home for the changelog

- The dated entries that used to live inside the Conductor planning documents have been moved verbatim into [changelog.md](changelog.md). The planning documents keep one-line pointers to it, and the README's Documentation index links it too.
- The two P6 roadmap items are now marked done. No historical entry was rewritten, and the roadmap itself is unchanged.

## Installation

Nothing to install by hand: this release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy; offline play uses the precached entries from the first visit. There is no storage migration — existing profiles, stickers, play-time settings and progress carry over exactly as they were.

## Release Verification

> Figures below are the recorded state for this DRAFT. The tag and deploy line is completed when `v1.25.0` is tagged.

- Full gate: the configured `verify_phase` gate runs on the release state before merge — lint, typecheck, unit tests, coverage, production build, the bundle, module-size, texture and PWA validators, and the docs validator.
- Unit and coverage: 154 files / 3,346 tests green; coverage 97.15% statements / 90.97% branches / 96.28% functions / 98.30% lines against gates of 95/88/85/90.
- Bundle: `node scripts/validate-bundle.js` reports a 189.1 kB shell entry against the 200 kB gate.
- Module size: `node scripts/validate-module-size.js` reports 167 production files, zero warnings, longest 399 lines; a synthetic 601-line fixture exits 1. Running real source green and the fixture red is the proof the guard has teeth.
- Textures: `node scripts/validate-textures.js` reports 319 SVGs at 76.07 MiB typical / 319.00 MiB full, ratio 0.238, inside the re-baselined 80/320 MiB caps and the hard 0.5 ratio; synthetic over-budget and bad-ratio fixtures fail.
- PWA: `node scripts/validate-pwa.js` passes 16/16 checks — manifest, service worker, icons and precache of the shell, every game chunk, the font and the BGM.
- Docs: `node scripts/validate-docs.js` reports 5 passed / 0 failed — complete release-note index, resolving links and anchors, game lists that agree with the registry, existing Conductor paths and current test-suite counts.
- Boot and headers: `node scripts/validate-boot.js` boots the built app against `vite preview` on port 4173, and `node scripts/validate-headers.js` asserts the strict Content-Security-Policy and its three companion headers on the built image.
- Browser journeys: the Playwright suite drives the built `dist` in Chromium through boot, all 24 launches, the mechanic-family rounds, the sticker award, the parental gate, settings persistence, backup/restore, the daily cap and an offline relaunch. CI runs it as two `Browser Journeys` shards (13 cases each), outside the fast `verify_phase` gate.
- Device matrix: **SKIPPED — accepted gap** (see Known Issues). CI and the tag-deploy smoke re-confirm every automated figure above on the release commit.
- Tag and deploy: **pending** — this DRAFT is written before tagging. `v1.25.0` is not yet pushed; the tag CI run, deploy webhook result and live-entry check are recorded when the tag is cut.

## Known Issues

The full list of known issues lives in the README's Known Issues section, and the planned work lives in [conductor/product.md §10](../conductor/product.md#10-roadmap) — nothing below duplicates either.

- Device-class pass — **SKIPPED, accepted gap.** As in v1.22.0, v1.23.0 and v1.24.0, this release deliberately skips the real-device PWA pass (install prompt, landscape lock, offline reload and first-tap audio) because the change surface is covered by the automated gates and the browser journey layer. The manual rows in [device-testing-checklist.md](device-testing-checklist.md) remain the checklist to run before any player-facing claim about this version, and the release process and sign-off record live in [release-checklist.md](release-checklist.md).
- No new known issues are filed by this release: PR #92 only expands content pools and adds a build-time art guard, and the P6 work is a behavior-neutral code split plus a verbatim documentation move. No game, rule, scene behavior or save format changed.

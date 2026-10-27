# Release Notes - v1.23.0

> Status: FINAL
> Tag: `v1.23.0` (cut on `master` at `45190721`, pushed 2026-10-27 - tag-gated Coolify deploy fired; tag CI 40435767433 green including boot-time validation)
> Base: `v1.22.0` (`a2bffc6b`, 2026-10-27)

One track merged since v1.22.0: **repeat play stays fresh - ten new early words to find and build (MAP, FOX, CUP, BOX, BED, KITE, SOCK, BOOT, RING, PLUS), four new three-panel stories to put in order (a snowman, a block tower, a caterpillar's change, a tadpole's change), and eight new everyday feelings moments to name** - so the games your child already knows keep surprising them. Nothing changes in how any game plays: the rounds, the ladders, the voices and the art style are exactly what they were - there is simply more to discover inside them.

## What Shipped Since v1.22.0

Merged PR #75 on master after the v1.22.0 tag, in merge order.

(The range also holds `f28aa392`, the v1.22.0 FINAL flip and Phase 3 record - prior-release bookkeeping already covered by the v1.22.0 notes above, so it gets no section here.)

### PR #75 - The content expansion: more words, more stories, more feelings

- The first-words pool grows 18 → 28: five new 3-letter words (MAP, FOX, CUP, BOX, BED) and five new 4-letter words (KITE, SOCK, BOOT, RING, PLUS), every one phonics-safe and fitted to its easy-first tier, every one reusing art the app already ships - so no new pictures were needed and nothing new is downloaded.
- Decode It grows with the same pool for free: its word list is now simply the whole shared pool instead of a separate copy, so the four words that used to live only in Decode It (FOX, CUP, MAP, BED) are first-class words everywhere - Find the Word, Build the Word and Decode It all draw from one list of 28 (13 three-letter + 15 four-letter).
- The Story Order pool grows 11 → 15: two new obvious-cause stories (building a snowman, stacking a block tower) and two new subtle-transformation stories (caterpillar → cocoon → butterfly, frogspawn → tadpole → frog), each with three bespoke Storybook-Flat panels (12 new illustrations) that travel inside the game's own chunk - the boot shell stays lean and the idle art prewarm already knows all 45 panels.
- The Feelings Faces pool grows 24 → 32: two gentle new moments per emotion (cookies and duck songs when happy, a stuck kite and a missed story circle when sad, the wrong cup and a long slide wait when angry, hooting owls and tapping wind when scared) - everyday, resolvable, spoken-aloud-safe moments, with the four shared faces reused so no new art was needed.
- At the classic band every game plays exactly as before: the adaptive ±1 difficulty band, the round counts, the narration and the art style are untouched - the new content rides the existing mechanics, and the full suite (126 files, 2,783 tests) stays green, which is the point - more to find, nothing new to learn.

## Installation

Nothing to install by hand: the release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy; offline play uses the precached entries from the first visit. No storage migration is required: this one track changes no saved-progress format (verified by diffing the `v1.22.0..HEAD` range for save, progress and storage-shape changes - no hits; `storage.ts`, `profileLogic.ts`, `progressLogic.ts` and `playTimeLogic.ts` are untouched in the range), so existing profiles, stickers and play-time carry over untouched.

## Release Verification

- Test suite: **126 files, 2,783 tests, all green** on the shipped track (verified 2026-10-27). Thresholds (lines 95 / functions 88 / branches 85 / statements 90) hold: statements 97.73, branches 91.71, functions 96.88, lines 98.70.
- PWA: `node scripts/validate-pwa.js` 16/16; the boot shell entry stays inside its 200 kB budget at 149.1 kB; the release-state full gate re-runs on this branch before merge.
- Docs: `node scripts/validate-docs.js` 6/6 on the release commit, including the count-drift guard.
- Save schema: no change in PR #75 (content pools and panel art only; storage files untouched in the range diff).
- Device matrix: **SKIPPED - accepted gap.** This release track deliberately skips the device-class pass per scope (the change surface is additive content pools and panel art riding unchanged mechanics, all covered by the automated gates above); the manual phone/tablet rows in [device-testing-checklist.md](device-testing-checklist.md) remain the checklist to run before any player-facing claim about this version, and CI plus the tag-deploy smoke re-confirm every figure above on the release commit.

## Known Issues

The full list of known issues and planned work lives in [roadmap.md](roadmap.md) - it is the single home for what is outstanding, and nothing below duplicates it.

- No new known issues were filed by this one track: the new words, stories and scenarios ride the existing mechanics (a missing panel degrades to the same placeholder it always did), and the adaptive bands at the classic setting play byte-for-byte as before.

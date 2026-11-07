# Integrated verification - Backup and Restore

- **Track:** `20261108-backup-restore`
- **Date:** 2026-11-08
- **Branch:** `feat/20261108-backup-restore`
- **Base:** `8029cfada0bc5a7abe63d8f9feeaab347c653d17`
- **Head:** `8770c6b8` (review fixes included)
- **Result:** verified

## Layers, run against the integrated tree

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 307 files, no findings |
| Types | `pnpm typecheck` | both programs (app and `e2e`), exit 0 |
| Unit | `CI=true pnpm test -- --run` | 140 files / 3,069 tests passed |
| Coverage | `pnpm test:coverage` | statements 97.33 / branches 91.67 / functions 96.28 / lines 98.29 - gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | 59 precache entries, 1765.75 KiB |
| Bundle artifact | `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell `index-DI9SmdDG.js` **168.3 kB** ≤ 200 kB |
| PWA artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |
| Browser | `pnpm test:e2e` | **19 journeys passed in 3.7 min** on two workers |

## Cross-phase checks

- **Pure format, one seam.** `backupFormat.ts` imports `normalizeV2`, `GAME_IDS` and `MAX_PROFILES` and nothing else. It names no browser global and reads no clock: `now` and `schemaVersion` are arguments, which is why the 44 format tests run in Node in milliseconds and why every DOM call in this feature sits in `backupFile.ts`.
- **The guard holds the seam at one module.** `src/__tests__/guard/backupDom.test.ts` scans every production file for `document`, `Blob`, `URL`, `FileReader` and `navigator.clipboard`, allows exactly six modules - the new seam plus five that already used the DOM for visibility, fonts and viewport zoom - and fails when a seventh appears *or* when an allowed one disappears. Teeth proved by adding `document.title = "x";` to `src/utils/svgDataUri.ts`, which produced `utils/svgDataUri.ts:10 (document)` and was reverted to an empty diff.
- **Export cannot disagree with its own checksum.** `createBackup` returns the object *and* the exact text it hashed, so no caller can serialise the envelope differently from the bytes the checksum describes. That is the failure mode a "return the object, let the caller stringify" API invites, and it is the reason the round trip is trustworthy rather than merely plausible.
- **The restore writes once, or not at all.** `applyImport` plans with `planImport` against the current save, then writes the whole result through a single `mutate`. A `profile-cap` refusal returns no save to write, so there is no partial restore: a device either accepts the file entirely or is untouched.
- **A refusing store is still refused.** On a device where `isPersistenceDegraded()` is true, both import modes stop before planning and say so; export is allowed, because reading is unaffected by a store that refuses writes. That division matches what the storage layer actually promises.
- **Page one did not move.** The eight settings rows keep their exact coordinates across a page round trip (a label-to-y map, asserted), the gate and the ✕ are untouched, and the new surface is inside a panel a child cannot open.
- **The suite proves the file, not a copy of it.** The journey hands `download.path()` to the chooser in a second `BrowserContext` and never reads the bytes with `fs`. If the export were malformed, the import refuses and the sticker assertion fails with the parent's own sentence rather than a parse error.
- **Idempotence is a shape, not a case.** Merge is best-of-field: stickers union with the earlier `earnedAt`, counters take `Math.max`, stamps take the later, activity unions days at the higher count. Importing the same file twice is therefore equal to importing it once - proved at the unit layer (`merging the same file twice equals merging it once`), and deliberately not re-proved in the browser, where a second file pick would have cost the suite ~10 s for a rule the unit layer owns.

- **A restore that did not land says so.** Round 1 found the one hole this design left: `mutate` swallowed the write outcome, so a restore onto a full disk reloaded over itself in silence. `saveV2` now answers whether the bytes landed and `applyImport` turns a `false` into the same `store-unavailable` sentence a degraded store gets - one vocabulary, two causes.

## Scope note

Touches started as `src/utils/backupFormat.ts`, `src/utils/backupFile.ts`, `src/utils/storage.ts`, `SettingsPanel.ts`, `primitives.ts`, the bridge and its callers, one journey, and the documents. They widened, each with a reason:

- **`src/utils/backupFormat.ts`** gained a seventh refusal code, `store-unavailable`, because the degraded import has its own sentence and inventing it in the panel would have split the vocabulary.
- **`src/game/e2eBridge.ts`, `src/scenes/HubScene.ts`, `src/components/SettingsPanel.ts`** publish `choices` in addition to the planned `page`/`switchPage`/`backupRows`/`backupResult`: the journey has to tap the Merge button a parent taps, and hard-coding the card's coordinates would be the blind tap this project has already been burned by.
- **`e2e/node-env.d.ts`** declares `Buffer`, because Playwright base64-encodes in-memory file bytes for the page and a `Uint8Array` does not survive that step. Found by running the suite, not by reading it.
- **`src/utils/storage.ts`** exports `SCHEMA_VERSION` so the panel stamps and reads with the real value rather than a second literal.
- **`conductor/product.md`** §10.3 carried the roadmap row, which the phase subagents could not write.
- **`docs/TDD.md` §2.2** listed 14 utils files where there are now 16; Phase 3 left that stale and the new §6.7 names both.

## Runtime note

The browser suite went from 17 journeys in 3.2 min to **19 in 3.7 min** - two tests costing 47.8 s together, inside the 5-minute budget with ~1.3 min of headroom. `launch-all` still owns the critical path at 2.7 min, so future journeys remain nearly free.

## The number to watch

The shell entry grew **158.5 → 168.3 kB** across this track: +2.6 kB for the format module and its storage calls, +5.2 kB for the settings page, +0.1 kB for the bridge, +1.0 kB for the review-fix write reporting and the import summary. 168.3 of 200 leaves 31.7 kB. Nothing in this feature belongs in the boot path, so if the next track adds a module the hub imports, measure first.

## Accepted limits, recorded rather than hidden

- **A profile id collision merges two children as one.** Ids are `p1`…`p4` on every device, so a tablet with "Aby" and a tablet with "Sam" both holding `p1` will merge into a single profile on restore, keeping the best of both. Merge is a restore onto a device whose profiles *are* the same children; a family with two tablets of different children is the case this gets wrong, and it is documented in the roadmap row rather than guessed at with a heuristic.
- **The file is not encrypted.** It holds star counts and a chosen avatar, not secrets, and a password would be a lock a four-year-old cannot open and a parent will lose. The checksum detects corruption and truncation; it does not detect tampering, and the docs say so.

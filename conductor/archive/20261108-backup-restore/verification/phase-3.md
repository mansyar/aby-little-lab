# Phase 3 — the second Settings page

- **Track:** `20261108-backup-restore`
- **Branch:** `feat/20261108-backup-restore`
- **Date:** 2026-11-08
- **Base commit:** `d6633498e7c0df96edb099fe04131ad66252dc22`
- **Head commit:** `15d3f665` (code `20b5d906`, docs `15d3f665`)
- **Result:** verified

A parent opens Settings, taps one card, saves the whole save to a file, picks a
file back, chooses merge or replace, and reads one line saying what happened.
Page one does not move.

## Commands

Run in the project root, in this order. Shell entry size is the number
`scripts/validate-bundle.js` prints.

| # | Command | Exit | Notes |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 306 files, no fixes |
| 2 | `pnpm typecheck` | 0 | app and `e2e/tsconfig.json` |
| 3 | `pnpm test -- --run` | 0 | 140 files, 3,059 tests |
| 4 | `pnpm test:coverage` | 0 | 97.29 / 91.51 / 96.19 / 98.28 |
| 5 | `pnpm build` | 0 | 367 modules, PWA 59 precache entries |
| 6 | `node scripts/validate-bundle.js` | 0 | PASS, shell entry **167.2 kB** |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 8 | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Coverage gate 95 / 88 / 85 / 90 (statements / functions / branches / lines):

| Metric | Before (Phase 2) | After | Gate |
| --- | --- | --- | --- |
| Statements | 97.28 % | 97.29 % | 95 |
| Branches | 91.52 % | 91.51 % | 85 |
| Functions | 96.21 % | 96.19 % | 88 |
| Lines | 98.25 % | 98.28 % | 90 |

Shell entry size: **158.5 kB → 167.2 kB** (gate 200 kB). The growth is the
second page, the backup format module it now calls directly, and the seam's
`reloadApp`.

## Geometry

Canvas 1024 × 768, panel `PANEL_WIDTH` × `PANEL_HEIGHT` = 480 × 760 centred on
(512, 384), so it spans y 4 … 764. `centerY` = 384, `ROW_PITCH` = 56,
`ROW_CARD_HEIGHT` = 68, `FIRST_ROW_OFFSET` = −47, `SWITCH_OFFSET` = −250.

| Element | y (page 0) | y (page 1) |
| --- | --- | --- |
| Panel top | 4 | 4 |
| Empty header band | 4 … 250 | 4 … 250 |
| Switch card (`ROW_CARD_WIDTH` × `ROW_CARD_HEIGHT`) | **134** | **134** |
| Switch card extent | 100 … 168 | 100 … 168 |
| Title (`Settings` / `Backup`), 36 px | 279 | 279 |
| Degraded notice (only while degraded, `NOTICE_OFFSET` −150) | 234 | 234 |
| ✕ close, `centredHitArea(96, 96)` | 279 | 279 |
| Version footer `v…`, 24 px | 309 | 309 |
| Row 0 | 337 BGM: ON | 337 Save a backup |
| Row 1 | 393 SFX: ON | 393 Restore from a file |
| Row 2 | 449 Adaptive: ON | 449 result line (24 px, wrapped 420) |
| Row 3 | 505 Profiles | — |
| Row 4 | 561 Progress | — |
| Row 5 | 617 Reset Progress | — |
| Row 6 | 673 Install App | — |
| Row 7 | 729 Voice: Default (device) | — |
| Last card bottom (729 + 34) | 763 | 393 + 34 = 427 |

Eight rows still end at 763, inside the 764 panel edge; the switch card sits at
134 ± 34 = 100 … 168, wholly inside the previously empty band and clear of the
title at 279.

Page one did not move: the test `returns in one tap with every page-one row at
its exact original y` builds a label → y map before the switch, switches to page
1, switches back, and compares the whole map for equality — plus the literal
`[337, 393, 449, 505, 561, 617, 673, 729]`. The pre-existing test
`leaves the title, the version footer and the eight rows exactly where they
were` still pins the same y values and the notice's `centerY + NOTICE_OFFSET`.

## The flow

| Step | What a parent sees | Pinned by |
| --- | --- | --- |
| Reach the page | One tap on `Backup & restore ›` at (512, 134); the title becomes `Backup`, the card becomes `‹ Back to settings` | `reaches a second page in one tap, with its own title and two rows` |
| Export | `Save a backup` writes `aby-little-lab-backup-2026-11-08.json` from the device's local day and the line reads `Saved aby-little-lab-backup-2026-11-08.json` | `saves the whole save to a dated file and says so` |
| Restore | `Restore from a file` opens the picker, reads and verifies it, then shows the file's name with `Merge` and `Replace` and one line saying merge keeps this device's save and adds anything newer while replace overwrites it | `restores a verified file as a merge, then starts the app again` |
| Merge | `applyImport("merge", payload)` then the app starts again | same test |
| Replace | `applyImport("replace", payload)` then the app starts again | `restores a verified file as a replace when that is what was chosen` |
| Refused file | The refusal's own sentence on the line, no choice card, no write, no reload | `refuses a damaged file on the result line, with no write and no reload` |
| Refused write | `applyImport` returning `profile-cap` puts its sentence on the line and the app keeps running | `puts a refused import's sentence on the line and does not reload` |
| Cancel | `Nothing was restored.` | `says nothing was restored when the picker came back empty` |
| Second tap | One picker, not two | `opens one picker, not two, when the row is tapped twice` |
| Waiting | The page stays exactly as it was; no spinner, no result | `keeps the buffer line up while a picker is pending` |

No sentence on the line is ever a refusal code: it is always
`refusalFor(code).message`, which `src/utils/backupFormat.ts` owns.

## Acceptance

**AC-9 — page one unchanged, page two one tap each way.** The exact-y test above
proves all eight rows return to 337 … 729 after a round trip; every hit band is
still `centredHitArea(ROW_HIT_WIDTH, ROW_PITCH)`, so each is `ROW_PITCH` tall.
`destroys the rows of the page it leaves, both ways` proves the rows of the page
being left are destroyed, not hidden, so no stale interactive object keeps a live
hit band over the canvas. The switch card answers on both pages at the same
point.

**NFR-7 — nothing child-facing changed.** The edit adds one card in the empty
band above the title (y 100 … 168) and rebuilds page one from the same numbers it
always used. The eight row labels, their y values, their 400 × 68 cards, their
`ROW_PITCH`-tall bands, the toggle tracks and knobs, the title, the ✕, the version
footer and the degraded-notice offset are untouched; the label → y map test and
the pre-existing degraded-notice test both hold. No game scene, no hub tile and
no child-facing string was edited.

**FR-9 — a labelled card, a second page, three things on it.** `Backup & restore ›`
at (512, 134); page two holds `Save a backup` at row 0, `Restore from a file` at
row 1 and the result line at row 2; `‹ Back to settings` returns, and the card
reads `Backup & restore ›` again.

**FR-10 — plain words, in numbers, no modal on success.** Export says
`Saved <filename>`; cancel says `Nothing was restored.`; a refusal says the
format's own sentence; a completed import starts the app again instead of showing
a dialog. The choice card appears only before a write, and it names the file and
the two modes.

**FR-11 surface (built here, driven in Phase 4).** `E2ESettingsState` gained
`page`, `switchPage`, `backupRows` and `backupResult` additively, all live reads
from `SettingsPanel.backupState()`, merged in `HubScene.e2eSettings()`. The panel
is only constructed behind `?e2e=1`'s existing gate, the bridge stays frozen, and
a closed panel still reports `page: 0`, both points at (0, 0), no rows and an
empty result.

## Deviations

| File | Why |
| --- | --- |
| `src/utils/backupFile.ts` | The brief authorised it: `reloadApp()` did not exist and a completed import cannot be half-applied. This widens the seam's export list by one function; every DOM global stays inside the seam. |
| `src/utils/storage.ts` | `SCHEMA_VERSION` was a module-local `const`. The panel must stamp the envelope with the schema it writes and read with the same number, so it is now exported. The value, the storage keys and `ProfileV2` are unchanged; nothing else in the module changed. |
| `src/__tests__/utils/backupFile.test.ts` | The new export needs its own test, or the seam's only uncovered line would be the reload itself. One test, added to the file that already owns the seam. |
| `e2e/fixtures/game.ts` | Outside the brief's Touches. `tsc --noEmit -p e2e/tsconfig.json` fails on the fixture's `E2ESettingsState` literal once the interface gains four required fields, so the fixture's fallback object gained the same four empty values. No assertion and no journey changed. |

## Notes

- `SettingsPanel.ts` never names `document`, `window`, `Blob`, `URL` or
  `crypto`; it calls `pickBackupFile`, `downloadBackup` and `reloadApp` from the
  seam, and `src/__tests__/guard/backupDom.test.ts` still scans it clean.
- The restore tap handler is guarded by a `busy` flag cleared in `finally`, so a
  second tap during a pending picker does nothing. There is no `catch`: a thrown
  read error is not reachable through the seam's own contract (it resolves
  `null`), and an unreachable branch would be untestable dead code.
- `pnpm test -- --run <path>` runs the whole suite in this Vitest version, so
  the focused runs during development reported 140 files each time; the final
  figures come from the full run.
- `SettingsPanel.ts` lines 766–771 (`e2eProgressRow`, `e2eProgress`) are the
  file's only uncovered lines. They are delegations, not new code: the panel's
  own suite never calls them.

## Primary verification

Verified 2026-11-08 by the primary agent against the phase tree.
Phase base `d6633498`, head `de72b8de`.

| Check | Command | Result |
| --- | --- | --- |
| Tree | `git status --porcelain` | clean |
| Commits in range | `git log --oneline d6633498..HEAD` | 3 commits, no merges |
| Scope | `git diff --stat d6633498..HEAD` | 14 files, +1108/−87: `SettingsPanel.ts` (+450), `e2eBridge.ts` (+36), `HubScene.ts` (+5), `backupFile.ts` (+16), `storage.ts` (+5), four test files, `e2e/fixtures/game.ts` (+4), three living documents, the evidence |
| Static | `pnpm check` | `Checked 306 files in 378ms. No fixes applied.` |
| Types | `pnpm typecheck` | both programs exit 0 |
| Unit | `CI=true pnpm test -- --run` | **140 files / 3059 tests passed** |
| Coverage | `pnpm test:coverage` | statements 97.29, branches 91.51, functions 96.19, lines 98.28 |
| Build | `pnpm build` | 59 precache entries (1764.64 KiB) |
| Bundle artifact | `node scripts/validate-bundle.js` | phaser 1335.0 kB, shell `index-D1TyO69K.js` **167.2 kB** of 200 |
| PWA artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |

### The panel was read against the two claims that matter

**Page one did not move.** `buildSettingsPage` reproduces the eight rows at `rowY(0)`…`rowY(7)` — y 337, 393, 449, 505, 561, 617, 673, 729 — the same values Phase 2 recorded, and `SettingsPanel.test.ts` asserts that list rather than merely checking the labels exist. The switch card sits at `centerY - 250` (y 134), inside the header band that was empty, so nothing on page one was re-flowed to make room. AC-9 is exact-coordinate and is met.

**Nothing stale can answer a tap.** The page's objects are collected in `pageObjects` and `destroy()`d on every switch, with the choice card in a separate `choiceObjects` list destroyed by closing or choosing. That is the difference between a working page switch and a bug that only shows up as a row responding to a tap while a different page is on screen, and the test asserts the destroy calls rather than trusting the intent.

**The async tap path releases its guard.** `restoreBackup` sets `busy`, wraps the whole body in `try`/`finally`, and returns from inside the `try` on cancel and on refusal — so `busy` is cleared on every path, and a second tap cannot open a second picker while one is waiting. That ordering (early returns inside the try, release in the finally) is the shape that usually goes wrong; it is right here.

No `catch` was written around the restore body. `pickBackupFile` resolves `null` rather than throwing, `readBackup` catches its own parse failure, and `applyImport` plans before it writes — so a `catch` would have been an unreachable branch and a coverage finding. Leaving it out is the honest choice, and it is recorded in the executor's notes.

### Acceptance

| AC | Status | Evidence |
| --- | --- | --- |
| AC-9 | pass | the exact `rowY` list asserted before and after a page round trip; page-0 rows destroyed while page 1 is shown |
| FR-9 | pass | switch card at y 134 reading "Backup & restore" / "Back to settings", title relabelled in place, no ninth row |
| FR-10 | pass | page two: `Save a backup`, `Restore from a file`, and a result line at y 449 that carries the refusal sentence, `Nothing was restored.`, or `Saved <filename>` |
| NFR-7 | pass | the gate, the two pages and the hub are unchanged for a child; the new surface is inside a parent-locked panel |

### Deviations accepted

Four, all recorded in the evidence and each defensible: `reloadApp()` added to the seam (a completed import cannot be half-applied to live scene state, and `window` belongs in the seam); `SCHEMA_VERSION` exported from `storage.ts` so the panel stamps and reads with the real value rather than a literal; a test for `reloadApp` in `backupFile.test.ts`; and `e2e/fixtures/game.ts` gaining the four new literal fields, which `tsc -p e2e` demanded — no journey or assertion changed.

### The number to watch

The shell entry went **158.5 → 167.2 kB** in one phase, 8.7 kB for a settings page. That is a real cost and it is the right place to pay it (the panel is a parent surface behind a gate, not boot-path art), but 167.2 of 200 leaves 32.8 kB, and Phase 4 adds no production code. If the next feature wants a module in the boot path, it should measure first. Recorded here so it is a decision rather than a surprise.


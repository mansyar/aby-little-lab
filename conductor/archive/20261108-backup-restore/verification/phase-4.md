# Phase 4 verification - The round trip, and the record

Phase base `a2a2506f`, branch `feat/20261108-backup-restore`. Covers FR-11,
FR-12, NFR-5, NFR-6, AC-3.

## Commands

| # | Command | Exit | What it proved |
|---|---|---|---|
| 1 | `pnpm check` | 0 | Biome is clean over 307 files, including the new spec (two format and one import-order finding fixed before it passed) |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` and `tsc --noEmit -p e2e/tsconfig.json` both clean: the widened `E2ESettingsState` is carried through the bridge, the panel, the scene and the browser fixture, and `setFiles({ buffer: new TextEncoder().encode(...) })` type-checks without naming `Buffer` |
| 3 | `pnpm test -- --run` | 0 | 140 files / 3,059 tests green - unchanged counts, because the bridge and scene assertions were added to existing tests rather than to new ones |
| 4 | `pnpm test:coverage` | 0 | Thresholds met; statements 97.28 (6345/6522), branches 91.51 (1854/2026), functions 96.12 (1391/1447), lines 98.26 (5902/6006) |
| 5 | `pnpm build` | 0 | 367 modules, 47 chunks, 59 precache entries |
| 6 | `node scripts/validate-bundle.js` | 0 | Phaser chunk 1335.0 kB, shell entry **167.3 kB** of 200 |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 checks: 47 chunks emitted, 47 precached |
| 8 | `node scripts/validate-docs.js` | 0 | 5 checks, including the living-docs suite truth (140 files / 3,059 tests) |
| 9 | `pnpm test:e2e` | **NOT RUN (denied)** | The permission layer refused the command. See `## Blocked` |

## The journey

`e2e/journeys/backup.spec.ts`, one file, two tests, `test.setTimeout(120_000)`:

1. **`a save exported to a file restores into an empty browser and survives a reload`**
   (AC-3). Seeds one profile with two earned stickers, real progress on two
   games and a three-day streak through `addInitScript` with day keys computed
   in the page; opens the hub, holds the parental gate, switches to page two,
   taps **Save a backup** inside `Promise.all([page.waitForEvent("download"),
   tap])` and asserts the suggested filename against
   `/^aby-little-lab-backup-\d{4}-\d{2}-\d{2}\.json$/` plus a non-null
   `download.path()`. A `browser.newContext()` (same origin, empty storage)
   then opens the same build, taps **Restore from a file** inside
   `Promise.all([waitForEvent("filechooser"), tap])`, and hands the *downloaded
   path* to `fileChooser.setFiles` - the file's own bytes, never read with `fs`.
   `choices` becoming `["merge", "replace"]` is the acceptance signal; the
   **Merge** button is tapped at its published point inside
   `Promise.all([waitForEvent("framenavigated"), tap])`, and after `settleHub`
   the test reads back: one profile, two stickers, `progress["shape-sorter"].plays`
   = 3, `insights.currentStreakDays` = 3, then launches Shape Sorter and returns
   to the hub. `expect(secondErrors).toEqual([])` and `expect(errors).toEqual([])`.
2. **`a file that is not a backup is refused, and nothing is written`** (the
   refusal half at the browser layer). The chooser receives
   `{ name: "not-a-backup.txt", mimeType: "text/plain", buffer: new
   TextEncoder().encode("hello") }`; the result line must become the exact
   `unreadable-json` sentence from `backupFormat.ts`, `choices` must stay `[]`,
   the sticker count must not move, and no navigation happens.

**Durations: not measured.** `pnpm test:e2e` was denied in this environment, so
the run, its wall clock and the observed `suggestedFilename()` are owed by the
primary. What the suite must be watched for: the filename pattern (a UTC day
stamp rather than a local one would still match the regex, so the browser
journey is not the proof of the local-day rule - `backupFile`'s unit test is),
and total suite time inside the 5-minute budget.

Design notes worth keeping:

- `browser.newContext()` gives no `baseURL`, so the fresh page is sent to an
  absolute URL derived from the first page's origin; every helper after that is
  origin-agnostic.
- The second context has its own service worker, storage and cookies, so this
  is the "new tablet" case rather than a reload of the first one.
- The merge lands on profile `p1`, which is what the fresh device already
  creates, and appends the file's `p2` - so the assertion covers both branches,
  merged-into and appended (widened to two profiles in Phase R1).

## Acceptance

| Criterion | Where it is proved |
|---|---|
| AC-3: importing the exported file into empty storage choosing merge yields both profiles with every sticker, progress count and insight value, still there after a reload | `a save exported to a file restores into an empty browser and survives a reload` - seeds **two** profiles (`p1`: shape-sorter + color-match, `plays` 3, streak 3; `p2`: animal-trace + pop-freeze, `plays` 2, best streak 2), then after `settleHub` asserts `profileCount` 2, `stickerCount` 2 for the active child, 4 stickers across the two read from storage, and each child's own `progress`/`insights` after the reload, plus a playable hub |

AC-3 at the format layer was proved in Phase 1 (`planImport` round-trips a
two-profile save) and at the storage layer in Phase 3, and both are unchanged
here. **Correction (Phase R1)**: the Phase 4 run seeded a single profile and
asserted `profileCount === 1`, so the append branch - a profile the device does
not have - was never exercised end to end; the journey now seeds two and asserts
both arrive. That corrected journey has **not** been run yet (`pnpm test:e2e` is
the primary's to run), so the green claim on AC-3 stands only for the
one-profile version the Phase 4 run measured.

## Documents

- `docs/TDD.md` - new **§6.7 Backup and restore** after the guarded-write
  section: the seven-field envelope, the checksum's exact claim (corruption, not
  tampering - no key, so anyone can recompute it, and nothing is encrypted
  because the file holds no more than plain `localStorage`), the six reading
  refusals in order plus `store-unavailable` from the degraded session, the
  merge rules in two lines (best-of-field, idempotent, cap refuses whole),
  replace, the reload-on-success rule, and the seam (`backupFile.ts` is the only
  module under `src/` touching `document`/`Blob`/URL/picker; `SettingsPanel` its
  only caller).
- `docs/TDD.md` §10.5 - 17 journeys across 14 spec files → **18 across 15**, the
  backup added to the coverage list, the second "17 journeys" in the
  against-the-image paragraph bumped, and a short paragraph recording that this
  is the only journey acting on a file the browser produced.
- `README.md` - one paragraph under the parental/settings material: a parent
  saves a backup and restores it on another device, merge or replace, a damaged
  or foreign file refused in one sentence with the save untouched, nothing
  uploaded; the journey list in the testing paragraph names it. Test counts
  unchanged (3,059 / 140), so the guarded sentence still passes.
- `docs/perf-baseline.md` - **no edit owed**: its counts row is
  `140 files / 3,059 tests`, and the suite count did not move (the new e2e spec
  is not in the vitest count).
- `conductor/product.md` §10.3 - **not written**: see `## Blocked`. The exact
  row is below, ready to paste.

## Deviations

1. `docs/TDD.md` §2.2 source tree, `utils/` line: `14 files` → `16 files` with
   `backupFile.ts` and `backupFormat.ts` added. Phase 3 shipped both modules
   without touching the tree, and this phase added the section that names them;
   leaving the tree at 14 files would have contradicted the new §6.7 in the same
   document. Read by nobody as a count claim; the change is two lines plus the
   header.
2. `docs/TDD.md` §10.3 coverage figures refreshed 97.29/91.51/96.19/98.28
   (6342/6518, 1391/1446, 5899/6002) → 97.28/91.51/**96.12**/98.26
   (6345/6522, 1391/1447, 5902/6006). The widened `E2ESettingsState` adds two
   `map` callbacks and eight lines to `SettingsPanel`/`backupState`, which moves
   both the function and the statement denominator; the section claims to be
   verified today, so it was.
3. `src/components/SettingsPanel.ts` records `choices` in `showChoice` and
   clears it in `closeChoice` - the brief's authorised widening, split across
   the two functions that own the card's lifetime rather than one.

## Blocked

1. **`pnpm test:e2e` - permission denied.** The new spec has never been
   executed, so the journey, its duration, the observed filename and the suite's
   budget are all unverified. The primary must run, in this order:

   ```
   pnpm test:e2e
   pnpm exec playwright test --project=chromium e2e/journeys/backup.spec.ts --reporter=list
   ```

   The first is the gate; the second is the one-file view with per-test
   durations, which is what `## The journey` needs. If the first fails, the
   interesting failure modes are: the download event not firing (the tap must
   land inside the row's band), the fresh context lacking `baseURL` (handled by
   the absolute URL), and `framenavigated` never firing after Merge (the reload
   comes from `reloadApp()` inside the pointerdown handler).

2. **`conductor/product.md` - `edit` permission denied.** The brief authorises
   the §10.3 row; the tool refused. The replacement for line 179:

   ```markdown
   | `20261124-backup-restore` | **Done 2026-11-08** (track `20261108-backup-restore`): a save is one dated JSON file. `backupFormat.ts` is pure - a seven-field envelope (`format`, `formatVersion`, `schemaVersion`, `appVersion`, `exportedAt`, `checksum`, `payload`), FNV-1a 64-bit over the payload's own text, six refusals in a fixed order plus `store-unavailable` raised by the degraded session, and a plan that merges best-of-field (idempotent; an import that would pass the four-profile cap is refused whole) or replaces after the parent confirms. The Settings panel's second page carries **Save a backup** and **Restore from a file**; a completed import reloads, a refusal never does, and `backupFile.ts` is the only module under `src/` that touches `document`, `Blob` or the file picker. Two limits are accepted and written down: a profile id is the only identity in the format, so two children whose backups both say `p1` merge into one profile, and the file is plain JSON - the checksum catches corruption and not a deliberate edit, because nothing is encrypted. | A round trip to a second device loses nothing - **demonstrated**: `backup.spec.ts` exports through the real download event, hands the file that landed on disk to a second browser context with empty storage, picks **Merge**, and reads 2 stickers, 3 plays and a 3-day streak back after the reload, with one profile and a playable hub |
   ```

   The `**demonstrated**` clause is the claim the owed `pnpm test:e2e` run has to
   make true; if the journey fails, that clause is what needs rewriting, not the
   rest of the row.

## Notes

- Shell entry **167.3 kB** of 200 (Phase 3 left it at 167.2 kB). The 0.1 kB is
  the two `choices` literals and the panel's `backupState` mapping; the settings
  page is still the only production surface this branch touches.
- Unit counts are unchanged at 140 files / 3,059 tests, which is why no living
  count had to move. Coverage moved only because two `.map` callbacks entered
  the denominator.
- Not done, deliberately: the plan's P4.T1.3 also mentions "a second import
  changes nothing". The brief's journey steps stop after the first import, and
  idempotence is already proven directly on `planImport` in the unit layer
  (Phase 3). Adding a 3-second hold and a second file pick to the browser
  journey would have cost the suite ~10 s for a rule the unit layer owns.
- `e2e/node-env.d.ts` was not touched: `Buffer` is not declared there, and the
  spec never names it - `new TextEncoder().encode("hello")` satisfies
  `FileChooser.setFiles` and type-checks under `skipLibCheck`.

## Primary verification

Verified 2026-11-08 by the primary agent against the phase tree.
Phase base `a2a2506f`, head `015ad3e9` plus three primary commits below.

| Check | Command | Result |
| --- | --- | --- |
| Tree | `git status --porcelain` | only the evidence file the brief asked to leave uncommitted |
| Commits in range | `git log --oneline a2a2506f..HEAD` | 3 executor commits, no merges, no user commits |
| Scope | `git diff --stat a2a2506f..HEAD` | 9 files, +351/−6: `backup.spec.ts` (new, 269), `SettingsPanel.ts` (+17), `e2eBridge.ts` (+8), `HubScene.ts` (2), the bridge/hub tests, `e2e/fixtures/game.ts` (+1), `docs/TDD.md` (+38), `README.md` (+4) |
| Static | `pnpm check` | `Checked 307 files in 432ms. No fixes applied.` |
| Types | `pnpm typecheck` | both programs exit 0 |
| Unit | `CI=true pnpm test -- --run` | **140 files / 3059 tests passed** |
| Coverage | `pnpm test:coverage` | statements 97.28, branches 91.51, functions 96.12, lines 98.26 |
| Build | `pnpm build` | 59 precache entries (1764.81 KiB) |
| Bundle artifact | `node scripts/validate-bundle.js` | phaser 1335.0 kB, shell `index-DQkOGc5Y.js` **167.3 kB** of 200 |
| PWA artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |
| **Browser** | `pnpm test:e2e` | **19 passed (3.7m)**, exit 0 |

### The blocked run, and the defect it found

`pnpm test:e2e` was the executor's one denial, and running it was worth more than a green tick.

First run: **18 passed, 1 failed.** The refusal journey died on `fileChooser.setFiles`, and the browser said why -

```
Error: fileChooser.setFiles: InvalidCharacterError: Failed to execute 'atob' on 'Window':
The string to be decoded is not correctly encoded.
```

The cause is a real trap. `setFiles` accepts in-memory bytes, and Playwright base64-encodes them for the page; a `Uint8Array` stringifies to `"104,101,108,108,111"`, which `atob` refuses. The honest fix is a real `Buffer` - and the reason it needed writing down is that **`tsc` was blind to it**: this repo has no `@types/node`, `e2e/node-env.d.ts` declared `process` and nothing else, and with `skipLibCheck` on, Playwright's `buffer: Buffer` parameter resolved to an unresolved (therefore permissive) type. The journey type-checked clean and failed at runtime, in the one place the type system had no vocabulary. `e2e/node-env.d.ts` now declares `Buffer` with a comment saying exactly that, next to the `process` declaration it already carried for the same reason.

Second run of the file: **2 passed (42.0s)**. Full suite after that: **19 passed (3.7m)** - inside NFR-5's five minutes with about a minute of headroom.

### What the journey actually proves

`a save exported to a file restores into an empty browser and survives a reload` (31.5 s alone, 38.6 s under contention):

- seeds **two profiles** carrying four earned stickers between them, progress on three games, an activity week and a streak each, all with day keys **computed in the page** - no `YYYY-MM-DD` literal anywhere in the test tree, which is the rule that costs a red trunk every time it is broken;
- arms the download wait **before** the tap, then asserts `suggestedFilename()` against `/^aby-little-lab-backup-\d{4}-\d{2}-\d{2}\.json$/` - the dated name is a product promise, so it is asserted rather than assumed;
- opens a **second `BrowserContext`**, not a reload, so the restore starts from genuinely empty storage with its own service worker, and asserts that device begins with one profile and zero stickers before the import;
- hands `download.path()` to the chooser - the file that landed on disk, never read with `fs` and never rebuilt, so the export's own bytes are what the import has to accept;
- waits for `choices` to publish both ids, taps **Merge at the published point**, waits for the navigation `reloadApp()` causes, and only then asserts: **two profiles** (the fresh device's `p1` merged into, the file's `p2` appended), **four earned stickers across the two** (`stickerCount` 2 for the active child, the other two counted from storage), `p1`'s `progress["shape-sorter"].plays === 3` and `insights.currentStreakDays === 3`, and `p2`'s `progress["animal-trace"].plays === 2` and `insights.bestStreakDays === 2` - each child keeps its own numbers;
- proves the app is still a playable app rather than a repaired save, by launching a game and returning to the hub;
- asserts `collectErrors` is empty in **both** contexts.

`a file that is not a backup is refused, and nothing is written` (9.3 s) covers the refusal at the same layer: in-memory bytes, the `unreadable-json` sentence asserted verbatim on the result line, `choices` still empty, stickers and profiles unchanged, no reload.

### Two document defects the primary found and fixed

1. **The journey count was wrong.** The docs said "18 journeys across 15 spec files" in two places (`docs/TDD.md` §10.5 and the `E2E_BASE_URL` paragraph). `backup.spec.ts` carries **two** tests, so the counts are 19 and 15. Counting `^test\(` per file misses `storage.spec.ts` because its tests are nested in a `describe`, so the arithmetic was done from the suite's own report - `19 passed` - rather than from a grep.
2. **The roadmap row was unwritten** because `conductor/product.md` was denied to the executor. Written here: `20261124-backup-restore` is now **Done 2026-11-08** with what shipped, the demonstrated exit gate (the second-context round trip), and the two accepted limits stated plainly - a profile id collision merges two children as one, and the file is not encrypted.

### Acceptance

| AC | Status | Evidence |
| --- | --- | --- |
| AC-3 | pass | `a save exported to a file restores into an empty browser and survives a reload` - 19/19 green in 3.7 min, at a **two-profile** save (corrected in Phase R1: the Phase 4 run seeded one profile, so the journey asserted `profileCount === 1`; it now seeds `p1` and `p2` and asserts both arrive, four stickers between them, with each child's own `plays` and `insights` read from storage after the reload) |
| FR-11 | pass | the journey acts on the real download in a real second context, with merge tapped at the card's own published point |
| FR-12 | pass | TDD §6.7 documents the envelope, the six refusals plus `store-unavailable`, the merge rules and the seam; §10.5 names the backup journey as the only one that acts on a file; README states the parent-facing promise; the roadmap row records the outcome and the limits |
| NFR-5 | pass | 19 journeys in 3.7 min of a 5 min budget, two workers |
| NFR-6 | pass, re-measured in Phase R1 | the payload is **23,435 bytes** for four profiles at the shape the app produces: all 22 games played, full counters, a `WINDOW_SIZE`-long `recent` window each, a 7-day activity strip and both play-time fields - `the envelope a real save produces (NFR-6)` asserts it under 64 kB and reports the measured size. The write is one `setItem` of that payload, the save path the app already runs on every earned sticker; the frame-time half is reasoned from that path rather than separately timed. The Phase 4 claim ("47.8 s, no journey grew") measured the tests, not the requirement, and is withdrawn |

### Deviations accepted

The authorised bridge widening (`choices`, recorded in `showChoice` and cleared in `closeChoice`) and its four dependent literals; `docs/TDD.md` §2.2's utils tree corrected from 14 to 16 files, which Phase 3 left stale; the §10.3 coverage figures refreshed to the run measured above; and `e2e/node-env.d.ts` gaining `Buffer` after the first real run proved it necessary. The wrapper's own `pnpm test:e2e` run is the evidence; no application behaviour changed in this phase beyond the published field.

### The number to watch

The shell entry moved 167.2 → **167.3 kB** for the `choices` plumbing - the smallest growth of any phase in this track, and the track total is +8.8 kB against the 200 kB gate. Phase 4 added no runtime code of its own, which is what a phase that only proves things should cost.


# Phase 2 verification — The browser seam, and the write it performs

Track `20261108-backup-restore`, branch `feat/20261108-backup-restore`.
Phase base: `ad5969bbbfe4f78c335bf6c3cf69620657e73f7f`.

## Commands

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm check` | 0 | 306 files checked, no findings |
| `pnpm typecheck` | 0 | `tsc --noEmit` for `src` and `e2e` |
| `pnpm test -- --run` | 0 | 140 files / 3,044 tests passed |
| `pnpm test:coverage` | 0 | statements 97.28 (6229/6403), branches 91.52 (1835/2005), functions 96.21 (1372/1426), lines 98.25 (5791/5894) — all above the 95/88/85/90 gate |
| `pnpm build` | 0 | 366 modules; shell entry `index-DfVk-7sS.js` |
| `node scripts/validate-bundle.js` | 0 | `PASS: shell entry index-DfVk-7sS.js = 158.5 kB (<= 200 kB)`; Phaser chunk `phaser-B_vcVLyb.js` = 1335.0 kB |
| `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 47 chunks, 47 precached |
| `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed (after the suite-count refresh below) |

Suite movement: 138 files / 3,025 tests before this phase → 140 files / 3,044
tests after (6 seam tests, 6 write-path tests, 6 guard tests, 1 refusal-sentence
test; the 19th and final test is the guard's own allowance check).

`src/utils/backupFile.ts` and `src/utils/backupFormat.ts` are both at 100 % on
all four metrics: the seam's four branches (file, no file, cancel, unreadable
file) and both refusal paths are exercised.

## Design

**What the seam does.** `src/utils/backupFile.ts` exports exactly three things.
`backupFilename(now)` builds `aby-little-lab-backup-<local day>.json`.
`downloadBackup(json, filename)` writes text to the user's downloads.
`pickBackupFile()` opens the OS picker and resolves `{ name, text }` or `null`.
Nothing else in `src/` names a browser global for this feature, and
`backupFormat.ts` stays DOM-free.

**Where the filename date comes from.** `backupFilename` calls
`todayKey(now)` from `src/game/playTimeLogic.ts` — the same local-day helper the
play-time cap uses — so it is an imported helper rather than a second copy of
the formatting. It is deliberately **not** `toISOString().slice(0, 10)`: that is
UTC, and for a parent in Sydney exporting at 00:05 local the UTC day would still
be the 7th, naming the file with yesterday's date. The unit test builds the
instant from local fields (`new Date(2026, 10, 8, 0, 5, 0)`), so its verdict is
the same in every timezone, and it also pins both ends of the local day to the
same key.

**Why the anchor is attached.** `downloadBackup` appends the anchor to
`document.body` before `click()`. A detached anchor's synthetic click is ignored
by some engines, so the download would silently never start. The test asserts
`anchor.isConnected` at the moment of the click.

**Why the URL is revoked after the click, not before.** An object URL keeps the
blob alive for the lifetime of the page, so it has to be revoked or repeated
exports accumulate in memory. It has to be revoked *after* the click, though: a
revoke first leaves the anchor pointing at nothing. The test records
`create → click → revoke` as an ordered sequence, so an inverted order fails
with the sequence in the message.

**Cancelled picker on an engine without `cancel`.** `pickBackupFile` listens for
`cancel` (Chromium, Edge, Safari 16.4+), which resolves `null`. On an engine
without that event a cancelled picker leaves the promise pending. That is a
recorded limit rather than a pretence: nothing is corrupted, no state is left
set, no write happens, and the page keeps working. The promise settling is the
only thing lost. The input is removed and both listeners are detached on every
path that *does* settle — chosen file, cancel, empty selection, and a file whose
`text()` rejects (treated exactly like a cancel, because no readable save was
chosen).

**The write path.** `exportSave()` returns `ensureV2()`, which is what makes FR-3
true: a device that has only ever written v1 exports a normalised v2 payload.
`applyImport(mode, incoming, now?)` refuses first when the store is degraded,
then plans against `ensureV2()`, then hands the whole planned save to `mutate`
in one call. No second `setItem`, no bypass of `mutate`, and no second write for
merge — the plan already produced the complete save, so the import inherits the
same guarding as `earnSticker` and has `v2Cache` re-keyed for it.

## The guard has teeth

Probe: `document.title = "x";` added as the first statement of `toDataUri` in
`src/utils/svgDataUri.ts` — a production module unrelated to backup.
`pnpm test -- --run` then failed with, verbatim:

```
FAIL  src/__tests__/guard/backupDom.test.ts > backup DOM guard > names no browser global outside the seam and the modules that already did
AssertionError: A production module names a browser global, which belongs in utils/backupFile.ts:
utils/svgDataUri.ts:10 (document)
Move the browser call into the seam, or add an allowance with a reason.: expected [ { name: 'document', …(1) } ] to deeply equal []
```

The probe was reverted immediately. Proof the revert is clean:
`git diff --stat src/utils/svgDataUri.ts` printed nothing. No commit contains
the probe.

`git diff --stat` for the whole phase base confirms the only modified files are
the ones in Touches plus the living docs named in deviation 4.

## Acceptance

- **AC-5 — the same file twice changes nothing, at the storage layer.**
  `src/__tests__/utils/storage.test.ts` →
  `applyImport merge twice leaves the stored bytes identical`: two merges of the
  same payload leave `localStorage.getItem(V2_KEY)` byte-identical, so no
  duplicated sticker and no inflated counter. (The format-layer proof is Phase
  1's `planImport — idempotence`.)
- **AC-7 — a degraded store refuses the import and keeps export working.**
  `src/__tests__/utils/storage.test.ts` →
  `applyImport refuses on a degraded store, even for a valid file`: after
  `breakStorage(["getItem"], "SecurityError")` and a failed read,
  `applyImport` returns `{ ok: false, refusal: { code: "store-unavailable" } }`,
  the stored bytes are unchanged and `isPersistenceDegraded()` is unchanged.
  Export is untouched by the flag because `exportSave()` never consults it and
  only reads.
- **AC-8 (carried by this phase's write path) — the cap refuses and writes
  nothing.** `applyImport refuses over the profile cap and writes nothing`:
  with four profiles stored, a merge bringing a fifth returns `profile-cap`, and
  both the raw bytes and the degraded flag are unchanged.
- **AC-10 — no DOM outside the seam, no network.**
  `src/__tests__/guard/backupDom.test.ts`:
  `names no browser global outside the seam and the modules that already did`
  (every non-test source scanned for `document`, `Blob`, `URL.`, `FileReader`,
  `navigator.clipboard`; failure lists `path:line (name)`),
  `the seam really is the seam` (non-vacuity: the seam does name `document`,
  `Blob` and `URL.`), `sends nothing over the network` (`fetch(` is zero
  matches), `keeps every allowance pointing at a file that exists`, and
  `reads the whole production tree` (more than 60 sources, three known paths
  present).

## Deviations

1. **The seventh refusal code (authorised widening).** `src/utils/backupFormat.ts`
   gained `"store-unavailable"` in `RefusalCode` and one sentence in
   `REFUSAL_MESSAGES`: *"This device cannot save at the moment, so nothing was
   restored. Free up some space, then try again."* FR-7 requires this refusal,
   but FR-6's code list predates it, and the sentence belongs beside the others
   so that no call site paraphrases it. One test proves the sentence and that
   all seven are distinct.
2. **`refusalFor` is now exported from `backupFormat.ts`.** It was module-private
   in Phase 1. The save layer needs the code/message pair for the degraded
   refusal, and the alternative — writing the sentence in `storage.ts` — is
   exactly the second copy deviation 1 exists to prevent. The doc comment on the
   export says why, and says `readBackup` never returns that code.
3. **The DOM guard's allowance list.** The brief and NFR-1/AC-10 say "no
   production module outside `src/utils/backupFile.ts` names a DOM global". The
   tree already had five: `src/audio/AudioManager.ts`,
   `src/game/hub/playTimeUi.ts`, `src/game/playTimeLogic.ts`,
   `src/utils/fonts.ts` and `src/utils/viewportZoom.ts` (visibility handling, the
   font readiness probe, and the viewport meta read). Asserting the literal
   claim would fail on the first run, and changing those modules is outside
   Touches. The guard therefore pins the exact set — the seam plus those five,
   each with its reason — and fails on any new module, which is the strongest
   true statement available. It also fails if an allowed module disappears from
   the scan, so the allowance cannot silently rot into a hole.
4. **Test-suite counts in living docs.** Adding two test files moved the suite
   from 138 files / 3,025 tests to 140 / 3,044, and coverage from
   97.26 / 91.48 / 96.18 / 98.24 to 97.28 / 91.52 / 96.21 / 98.25. Refreshed,
   with no other prose changed, in `README.md:49`, `docs/TDD.md` §10.2 and §10.3,
   and both rows of `docs/perf-baseline.md` §test table.

## Notes

- The brief's guard pattern list is the five names above, not `crypto`. That is
  the right call for this tree: `backupFormat.ts` legitimately contains the word
  "non-cryptographic" in prose about its FNV-1a checksum, and the feature uses no
  `crypto` API at all — `checksumOf` is BigInt arithmetic over `TextEncoder`
  bytes.
- The guard skips comment lines (the same rule `guard/fixture-clock.test.ts`
  uses), so `backupFormat.ts` can keep saying in its header that it touches no
  `document`, no `Blob` and no `URL`. Accepted limit: a DOM global named only in
  a comment is not matched; the guard is about code.
- `pnpm test -- --run <path>` does not narrow the run in this repo — vitest
  receives the path after `--` and still runs the whole suite. Every run above is
  therefore the full suite, which is also what makes the guard-teeth probe's
  failure unambiguous.
- `src/utils/storage.ts:222` is reported as the only uncovered line in that
  file; it is Phase 1's `parseV2` catch, not a Phase 2 branch.
- No dependency was added, nothing calls the network, and no file under
  `src/components/`, `e2e/` or `conductor/` (state) was touched.

## Primary verification

Verified 2026-11-08 by the primary agent against the phase tree.
Phase base `ad5969bb`, head `c8850908`.

| Check | Command | Result |
| --- | --- | --- |
| Tree | `git status --porcelain` | clean |
| Commits in range | `git log --oneline ad5969bb..HEAD` | 4 commits, no merges |
| Scope | `git diff --stat ad5969bb..HEAD` | 11 files, +892/−8: `backupFile.ts` (new, 99), `backupFormat.ts` (+13), `storage.ts` (+41), three test files (`backupFile.test.ts` new 142, `backupDom.test.ts` new 255, `backupFormat.test.ts` +15, `storage.test.ts` +149), three living documents, the evidence |
| Static | `pnpm check` | `Checked 306 files in 295ms. No fixes applied.` |
| Types | `pnpm typecheck` | both programs exit 0 |
| Unit | `CI=true pnpm test -- --run` | **140 files / 3044 tests passed** |
| Coverage | `pnpm test:coverage` | statements 97.28 (6230/6404), branches 91.52, functions 96.21, lines 98.25 |
| Build | `pnpm build` | 59 precache entries (1755.94 KiB) |
| Bundle artifact | `node scripts/validate-bundle.js` | phaser 1335.0 kB, shell `index-DfVk-7sS.js` 158.5 kB - **unchanged**, because nothing imports the seam yet |
| PWA artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |

### A defect the executor shipped, fixed here

`pickBackupFile` appended a **visible** `<input type="file">` to the body. A bare input renders, so the hub gained a native "Choose file" control for as long as the picker was open - and on an engine without the `cancel` event, permanently, because the promise never settles and the input is never removed. A stray native control on a preschooler's screen, behind a gate that exists to keep them out of exactly that screen.

Fixed by setting `input.hidden = true` with a comment saying why, and the first picker test now asserts it. Verified: `pnpm check` clean, both typecheck programs clean, 3,044 tests green, coverage unchanged. This is the only line of `src/` in this phase the primary wrote.

### The spec's "no DOM usage" claim was wrong, and the guard says so

The spec's Problem section and NFR-1 were written on the claim that the app names no DOM global, so a backup download and file picker would be its first. That claim was wrong. Five production modules already did:

| File | Why it names `document` |
| --- | --- |
| `src/audio/AudioManager.ts` | `visibilitychange` listener, `visibilityState` reads, both guarded for hosts without a DOM |
| `src/game/hub/playTimeUi.ts` | same visibility pair, for parking the prewarm while hidden |
| `src/game/playTimeLogic.ts` | visible-time accounting, which is the whole feature |
| `src/utils/fonts.ts` | `document.fonts.load` for the Baloo 2 face |
| `src/utils/viewportZoom.ts` | `querySelector('meta[name="viewport"]')` for `allowPinchZoom` |

The executor did the right thing rather than the literal thing: instead of failing every run, the guard scans all production sources, allows exactly those five plus the seam, fails on any sixth module, fails if an allowed module disappears from the scan, and reports `path:line`. That is a stronger invariant than the absolute claim it replaces, because it also catches the allowlist going stale.

**Owed to doc sync:** `spec.md`'s Problem paragraph and NFR-1 must be corrected to the enumerated form ("the seam is the only module this track adds that names a DOM global; five pre-existing modules do") rather than left as a false premise the guard contradicts.

### Acceptance

| AC | Status | Evidence |
| --- | --- | --- |
| AC-5 | pass | merge import adds a sticker and keeps local settings; the same file imported twice leaves the stored raw bytes identical |
| AC-7 | pass | with reads broken, `applyImport` refuses with `store-unavailable` and writes nothing |
| AC-10 | pass | the guard: no `document`/`Blob`/`URL.`/`FileReader`/`navigator.clipboard` outside the seam, no `fetch(` anywhere in production, 60+ files scanned, three known paths present - and the teeth proved: `document.title = "x";` in `svgDataUri.ts` produced `utils/svgDataUri.ts:10 (document)`, reverted to an empty diff |

FR-3 holds for a different reason than expected and a better one: `exportSave()` returns `ensureV2()`, so the migration to v2 is the read path the app already uses, not a step the export code re-implements.

### Accepted deviations

The seventh refusal code `store-unavailable` (authorised in the brief; the sentence belongs beside the others so no call site paraphrases it), and the DOM allowlist above. Both are recorded in `verification/phase-2.md`. The living documents moved 138 / 3,025 to 140 / 3,044 with the coverage snapshot, mechanically required by `validate-docs`.


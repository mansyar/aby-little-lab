# Phase 1 verification — The file format, as pure logic

Track `20261108-backup-restore`, phase 1 of 4, branch `feat/20261108-backup-restore`.
Verified 2026-11-08.

Files written: `src/utils/backupFormat.ts` (417 lines) and
`src/__tests__/utils/backupFormat.test.ts` (794 lines, 44 tests).

## Commands

Chain run from the repo root, in one command, exactly as the brief writes it:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 — `Checked 303 files in 415ms. No fixes applied.` |
| `pnpm typecheck` | exit 0 — `tsc --noEmit` and the e2e project both clean |
| `pnpm test -- --run` | exit 0 — 138 files, 3,025 tests passed, 20.73 s |
| `pnpm test:coverage` | exit 0 — 138 files, 3,025 tests; statements 97.26 (6191/6365), branches 91.48 (1827/1997), functions 96.18 (1360/1414), lines 98.24 (5755/5858) against thresholds 90 / 85 / 88 / 95 |
| `pnpm build` | exit 0 — 365 modules transformed, built in 908 ms |
| `node scripts/validate-bundle.js` | exit 0 — Phaser vendor chunk present; shell entry `index-DfVk-7sS.js` = 158.5 kB (≤ 200 kB) |
| `node scripts/validate-pwa.js` | exit 0 — 16 passed, 0 failed; 47 chunks, 47 precached |
| `node scripts/validate-docs.js` | exit 0 — 5 passed, 0 failed, including "the living docs state the current test-suite truth" |

The new suite alone is 44 tests. The module itself is at 100 % on all four
coverage metrics: the text reporter omits files that are fully covered (the same
reason `src/scenes/sceneRegistry.ts`, documented in TDD §10.3 as 100 % on all
four, has no row), and the module's row disappeared from the table exactly when
the last two uncovered branches were removed.

## Design

### The checksum

`checksumOf` is a **64-bit FNV-1a** over the UTF-8 bytes of the canonical
`JSON.stringify(payload)`, returned as lower-case hex prefixed `fnv1a64:`.
Arithmetic is `BigInt` with a 64-bit mask per step, so it is exact rather than
losing the low bits the way `Number` would, and it is synchronous and
dependency-free — it has to work on a plain-http LAN origin, where
`crypto.subtle` does not exist.

The doc comment states the honest promise: it detects **corruption and
truncation, not tampering**, because there is no secret. Anyone who edits a
backup can recompute the digest. The tests pin two published FNV-1a 64 vectors
(`""` → `fnv1a64:cbf29ce484222325`, `"a"` → `fnv1a64:af63dc4c8601ec8c`) so a
silent change of algorithm would fail rather than quietly re-baseline.

### The envelope, and the seam that normalises

`createBackup(save, { appVersion, now, schemaVersion })` returns
`{ envelope, json }`, where `json` is the exact text of the envelope the
checksum described — a caller cannot re-serialise it differently. `exportedAt` is
`now.toISOString()`; `appVersion` is an argument, so the module never reads
`__APP_VERSION__`.

**Normalisation happens in `createBackup`, through `normalizeV2(save,
options.now.toISOString())`** — the same function `storage.ts` applies to every
save it reads (`ensureV2` → `parseV2` → `migrateFromVersion1` → `normalizeV2`),
and the function `migrateV1` produces its profile for. That is the single seam:
a device whose storage still holds a v1-shaped save exports a `schemaVersion: 1`
payload whose content is what the migration would have produced, with no second
migration path to keep in step. AC-2 is proved against the project's own
`migrateV1(null, now)`, not a hand-written v2 fixture.

### The five refusals

`readBackup` checks in this order and returns the first failure: not JSON →
`format` not an object with the expected tag → a numeric `formatVersion` above
this build's → a numeric `schemaVersion` above `options.schemaVersion` → checksum
mismatch. A missing or non-numeric version field is folded into `wrong-format`
rather than becoming a sixth code, and a file with no payload, or a checksum that
is not text, is a checksum mismatch.

The sentences, verbatim:

| Code | Sentence |
| --- | --- |
| `unreadable-json` | The file could not be read. It may be damaged, or it may not be a backup at all. |
| `wrong-format` | This file is not a backup from Aby's Little Lab. |
| `newer-format` | This backup was made by a newer version of the app. Update the app, then try opening it again. |
| `newer-schema` | This backup holds a newer kind of save than this version of the app can read. Update the app, then try again. |
| `checksum-mismatch` | This backup is damaged: part of the file is missing or changed, so nothing was restored. |
| `profile-cap` | This device has room for 4 profiles, and this backup brings more. Delete a profile first, then try again. |

`profile-cap` interpolates `MAX_PROFILES` from `src/types` — the constant was
already exported there, so no second literal and no export change was needed.

A `formatVersion` or `schemaVersion` **lower** than this build's is accepted, and
the version checks run before the checksum so a newer file says "update the app"
rather than "damaged". Both are tested.

### The merge table

Profiles are matched by **id**; a match is unioned best-of-field, and an id the
device does not hold is appended (normalised) while there is room.

| Field | Rule |
| --- | --- |
| `stickers[game].earned` | OR of the two |
| `stickers[game].earnedAt` | the earlier stamp when both are earned (the first time it was earned); otherwise the one that exists |
| `progress[game].plays/wins/correct/wrong` | max per counter |
| `progress[game].lastPlayedAt` | the later ISO stamp, null-safe |
| `progress[game].recent` | the longer array; on a tie the local one |
| `playTime.limitMinutes` | **local** (a device policy) |
| `playTime.usedMinutes` | from the side whose `lastUsedDate` is later; on the same day the max |
| `playTime.lastUsedDate` | the later day key |
| `insights.currentStreakDays/bestStreakDays/limitHitDays` | max |
| `insights.lastStreakDay/lastLimitHitDay` | the later day key, null-safe |
| `activity` | union by day, higher `plays` wins, sorted by day |
| `createdAt` | the earlier |
| `avatarId` | **local** (the face on this device) |
| `settings` | **local** (FR-5) |
| `activeProfileId` | local when it still exists, else the first profile's id |

`replace` returns the file's own save after `normalizeV2`, so a replace obeys the
same version rules `readBackup` already applied and cannot smuggle a malformed
profile through.

`planImport` takes an optional fourth argument, `now`, defaulting to the ambient
clock, for the same reason `normalizeV2` does: the normalisation it ends with
needs a moment for a missing play-time day and for activity pruning. Tests pass
an explicit moment everywhere, so no verdict depends on the day the suite runs.

## Acceptance

| Criterion | Proving test |
| --- | --- |
| AC-1 | `createBackup and readBackup — the envelope (AC-1) > wraps a two-profile save in a format-tagged envelope with a verifying checksum` — asserts every FR-1 field, the `fnv1a64:` shape, that the checksum equals `checksumOf(JSON.stringify(envelope.payload))`, and that re-reading yields the envelope back with `ok: true`. Its sibling `writes the exact text the checksum described` asserts `JSON.parse(json)` deep-equals the returned envelope. |
| AC-2 | `... > exports a v1-shaped save as a normalised v2 payload (AC-2)` — builds a v1-shaped save, runs it through `migrateV1(null, NOW)` (the project's own migration helper) plus the legacy `AppStorage` stickers/settings, exports it, and asserts the file's payload carries the migrated content with no v1 leftovers. |
| AC-4 | `planImport — idempotence (AC-4) > merging the same file twice equals merging it once` — table-driven over five pairs (single sticker, two profiles, counters, play time, insights), asserting `planImport(merged, incoming, "merge").next` deep-equals `merged`; plus `planImport and readBackup — the whole round trip > restores a backup into a fresh device and reads the same file twice unchanged` for the whole-file case. |
| AC-6 | `readBackup — the five refusals (AC-6)` — a five-row table, one case per code, each asserting the exact sentence and that the device's save and the file's payload are byte-identical afterwards (`JSON.stringify` before/after). `gives every refusal a distinct sentence` proves the five differ; `folds a missing or non-numeric version field into wrong-format` and `refuses anything that is not an object` cover the coercion edge. |
| AC-8 | `planImport — the profile cap (AC-8) > refuses a fifth profile and returns no save to write` — four local plus one incoming gives `profile-cap`, the result has no `next` property at all; siblings prove a single unfittable profile among several still refuses the whole import, that the last free slot is accepted, and that a file repeating known profiles is never refused. |

The merge rules are covered one field at a time in
`planImport — merge, one field at a time` (twelve tests), each failing if its rule
were inverted: sticker OR and earlier stamp, earned-only-incoming, max counters,
later `lastPlayedAt` with nulls on both sides, longer `recent` with a tie going
local, local `limitMinutes`, `usedMinutes` later-day-then-max, insight max and
later days, one-sided insight days, activity union, earlier `createdAt` with
local avatar and settings, untouched local profiles and the active-profile
fallback.

## Deviations

- **`README.md`, `docs/TDD.md`, `docs/perf-baseline.md`** — the suite counts moved
  from 137 files / 2,981 tests to **138 files / 3,025 tests**, and the coverage
  snapshot in TDD §10.3 and the perf-baseline table was refreshed from the run
  above. No other prose touched. Required by `node scripts/validate-docs.js`,
  which derives suite truth from a `vitest list` run and fails a living document
  that disagrees.
- Nothing else outside `Touches`.

## Notes

- `MAX_PROFILES` was already exported from `src/types`; reused, not duplicated.
- The module imports only `normalizeV2` (a pure function) and types. It has no
  `document`, `Blob`, `URL`, `crypto`, `localStorage` or `Date.now()` call, so it
  is safe to import in a DOM-free test and Phase 2's guard test can assert the
  browser seam belongs to `backupFile.ts` alone.
- `readBackup` does not deep-validate the payload shape: it hands the payload to
  the caller, and every consumer path reaches `normalizeV2` (in `createBackup`,
  in `planImport`) before anything is written. Phase 2 must keep that property —
  write `planImport(...).next`, never the envelope's payload directly.
- `planImport` refuses on `local.profiles.length + added.length > MAX_PROFILES`
  before it merges anything, so a refusal cannot be partial.
- The coverage text table on this setup hides files that are 100 % on all four
  metrics; `src/utils/backupFormat.ts` is in the totals and is fully covered.
  If Phase 4 needs a per-file number, run coverage with a reporter that does not
  skip full files rather than inferring one from the table.

## Primary verification

Verified 2026-11-08 by the primary agent against the phase tree, not the executor's report.
Phase base `eb03c08e`, head `3a54b841`.

| Check | Command | Result |
| --- | --- | --- |
| Tree | `git status --porcelain` | clean |
| Commits in range | `git log --oneline eb03c08e..HEAD` | 4 commits, no merges, no user commits, nothing unreported |
| Scope | `git diff --stat eb03c08e..HEAD` | `src/utils/backupFormat.ts` (new, 417), `src/__tests__/utils/backupFormat.test.ts` (new, 794), `verification/phase-1.md`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md` - matches Touches plus the three living documents `validate-docs` derives counts from |
| Static | `pnpm check` | `Checked 303 files in 397ms. No fixes applied.` |
| Types | `pnpm typecheck` | both programs (`src` and `e2e`) exit 0 |
| Unit | `CI=true pnpm test -- --run` | **138 files / 3025 tests passed**, 20.02 s |
| Coverage | `pnpm test:coverage` | statements 97.26 (6191/6365), branches 91.48, functions 96.18, lines 98.24 - gate 90/85/88/95 |
| Build | `pnpm build` | built in 772 ms, 59 precache entries (1755.94 KiB) |
| Bundle artifact | `node scripts/validate-bundle.js` | phaser 1335.0 kB, shell entry `index-DfVk-7sS.js` **158.5 kB** - unchanged, because nothing imports the module yet |
| PWA artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |

### The module was read, not trusted

`src/utils/backupFormat.ts` imports exactly two things: `normalizeV2` from `profileLogic`, and types plus `GAME_IDS`/`MAX_PROFILES` from `src/types`. It names no `document`, `Blob`, `URL`, `localStorage` or `crypto`, and reads no clock: `now` and `schemaVersion` are arguments. That is the property NFR-1 needs the Phase 2 guard to keep, and it holds before the guard exists.

Three judgement calls in the implementation, each defensible on reading:

- **The checksum is FNV-1a 64 over `JSON.stringify(payload)`**, with the doc comment stating plainly that it detects corruption and truncation, not tampering. Correct for the product's promise - the file holds star counts, not secrets - and it needs no `crypto.subtle`, which is absent on a plain-http origin.
- **`createBackup` returns the text as well as the object**, so the bytes written are the bytes hashed. A caller cannot serialise the envelope differently from what the checksum described, which is the failure mode a "return the object, let the caller stringify" API invites.
- **The refusal order is version before checksum**, so a file from a future build says "update the app" rather than "this file is damaged". There is a test for exactly that ordering (`checksums the versions before the checksum`), which is the kind of ordering that otherwise rots silently.

The merge rules are best-of-field by construction, never additive: stickers union with the earlier `earnedAt`, counters take `Math.max`, stamps take the later, the activity strip unions days at the higher count, and the profile cap refuses the whole import rather than dropping the profiles that would not fit. Idempotence is therefore a property of the shapes rather than a special case, and it has its own test.

### Acceptance

| AC | Status | Evidence |
| --- | --- | --- |
| AC-1 | pass | `wraps a two-profile save in a format-tagged envelope with a verifying checksum`, `restores a backup into a fresh device and reads the same file twice unchanged` |
| AC-2 | pass | `exports a v1-shaped save as a normalised v2 payload` - `createBackup` normalises through `normalizeV2`, so the migration happens at the seam and the file is always v2 |
| AC-4 | pass | `merging the same file twice equals merging it once` |
| AC-6 | pass | the five refusal cases each assert their own sentence and a pre-call snapshot, plus `gives every refusal a distinct sentence` |
| AC-8 | pass | `refuses a fifth profile and returns no save to write`, with the partial-fit and last-free-slot neighbours |

FR-1, FR-2, FR-4 and FR-5 are the module's own contract and are covered by the tables above; FR-6's refusal rules are `readBackup`'s. NFR-4's "pure logic, no browser" is verified by reading the imports.

### One limit observed and left alone

A file whose checksum verifies can still carry a nonsense payload - hand-crafted, since `createBackup` only ever writes a normalised save. `readBackup` accepts it (the checksum describes what is there) and `planImport` normalises it through `normalizeV2`, which is total: an unreadable payload becomes one default profile rather than a throw. Under `replace` that would wipe a real save, but the same is true of a legitimate backup of an empty save, and `createBackup` cannot produce one. Recorded here rather than guarded, because inventing a sixth refusal for a shape the app cannot emit would be a rule with no producer; the reviewer may disagree and it is cheap to revisit.

### Deviation accepted

The suite counts in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` moved from 137 files / 2,981 tests to 138 / 3,025 with a refreshed coverage snapshot. `scripts/validate-docs.js` derives the truth from a collect-only run and fails any document that disagrees, so the refresh is mechanical, not editorial - the same deviation every phase that adds a test file has recorded since the validator learned to count.


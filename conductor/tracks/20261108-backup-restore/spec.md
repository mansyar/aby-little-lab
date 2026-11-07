# Backup and Restore — Specification

> **Conventions:** ids are stable. `FR-`/`NFR-`/`AC-` numbers are never reused or
> renumbered after approval; a withdrawn item is marked `Withdrawn` rather than
> deleted, so review can read the history of what was promised.

## Overview

Everything a child earns — profiles, stickers, per-game progress, play time,
streaks — lives in one browser's `localStorage` under `abby-little-lab:v2`. There
is no account, no server and no sync, which is the product's central promise and
also its largest data risk: clearing site data, replacing a tablet or moving to a
new browser destroys years of a child's record with no warning and no recovery.

This track adds a **parent-gated backup**: one JSON file a parent can save
somewhere safe and restore on the same or another device, with a checksum so a
damaged file is refused rather than half-applied, and a merge-or-replace choice so
restoring an old file cannot silently delete newer stickers.

## Problem / Motivation

- `src/utils/storage.ts` is the only writer, and since `20261107-storage-resilience`
  it never throws into a scene — but it also has no way to *export* anything. A
  parent has no affordance that turns the save into something portable.
- The save is schema-versioned (`SCHEMA_VERSION = 1`) and write-protected against
  unknown versions, so a backup taken by a future build must be refused by an
  older one rather than misread.
- The app has **no DOM usage at all**: it draws on a canvas and takes pointer
  input. A file download and a file picker are therefore the first `document`
  touches in `src/`, and they must stay in one module rather than leaking into
  scenes.
- The settings panel is full: eight rows at `ROW_PITCH` 56 ending one pixel inside
  the 760 px panel. A ninth row cannot be appended without shrinking hit bands
  below the 64 px minimum the guidelines set, so the backup surface needs its own
  page.

## Goals & Success Metrics

- **Goal:** a parent can carry a child's whole record to another device.
  **Metric:** a browser journey exports in one context, imports the downloaded
  file into a context with empty storage, and finds every profile, sticker,
  progress count and insight intact after a reload.
- **Goal:** a damaged or future-version file is refused with a sentence a parent
  understands, and the existing save is untouched.
  **Metric:** unit tests cover each refusal; the journey proves the merge path.
- **Goal:** nothing about the child's experience changes.
  **Metric:** no row moves, no hit band shrinks, the hub and games are untouched,
  and the 17 existing journeys still pass.

## Scope

**In scope**

- A versioned backup envelope: format tag, format version, schema version, app
  version, export timestamp, checksum, and the whole normalised save as payload.
- Export to a `.json` file through a Blob and an anchor download.
- Import through the OS file picker, with validation and a merge-or-replace
  choice, applied through the existing save layer.
- A second page inside the parental Settings panel holding both actions and a
  plain-language result line.
- A read-only `?e2e=1` bridge surface so a journey can reach the page and read
  its result.
- One round-trip browser journey, unit tests for encode/decode/merge/refusal,
  and the documents.

**Out of scope**

- Any network transport: no upload, no cloud, no QR codes, no share sheet.
- Automatic or scheduled backups.
- Importing from a plain-text or clipboard string (that needs a text box; a file
  picker needs no typing, and typing on a canvas was ruled out in
  `conductor/product.md` §4).
- Encryption or a backup password. The file is not secret — it is a child's star
  counts — and inventing a passphrase flow would be a bigger promise than the
  product can keep.
- Merging settings (see FR-5).
- Exporting from a device whose storage is unreadable (see FR-7).

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The backup is a JSON object with `format: "aby-little-lab-backup"`, `formatVersion: 1`, `schemaVersion`, `appVersion`, `exportedAt` and `checksum`, plus `payload` carrying the whole normalised save (every profile with progress, stickers, play time and insights, plus the settings block). | should |
| FR-2 | The checksum is a non-cryptographic hash over the canonical `JSON.stringify(payload)` and is verified on import. It detects corruption and truncation, not tampering; no secret is involved and the document says so. | should |
| FR-3 | Export writes `aby-little-lab-backup-<local date>.json` through a Blob and a temporary anchor, revoking the object URL afterwards. The save is normalised before export, so a v1-only device exports v2. | should |
| FR-4 | Import opens the OS file picker (no text entry), reads the chosen file, and accepts it only if it parses, carries the expected `format`, has `formatVersion` and `schemaVersion` at or below this build's, and matches its checksum. | should |
| FR-5 | **Merge** keeps the device's settings and, for each profile, keeps the better of each field against a matching local profile: an earned sticker wins, higher `plays`/`wins`/`correct`/`wrong` win, `currentStreakDays`, `bestStreakDays` and `limitHitDays` take the larger, and `lastPlayedAt` takes the later. Incoming profiles whose ids are new are added while the device has room (the existing cap of four); if any cannot fit, nothing is written and the parent is told to delete a profile first. | should |
| FR-6 | **Replace** overwrites the whole save with the payload after a confirmation card, keeping the same schema-version refusal rules. | should |
| FR-7 | Both import paths are refused while `isPersistenceDegraded()` is true, with the existing "can't be saved" explanation, because a restored save would not survive the reload that makes it visible. Export is still allowed. | should |
| FR-8 | A completed import reloads the app, so every surface re-reads the restored state instead of a stale in-memory copy. A refused import never reloads. | should |
| FR-9 | Settings gains a second page reached from a labelled card in the panel's empty header band. Page one keeps all eight rows at their current coordinates, pitch and hit bands; page two holds the export action, the restore action and a result line, and its card reads "Back to settings". | should |
| FR-10 | The result line states plainly what happened, in numbers: profiles restored or merged, stickers carried, or the reason for a refusal. No modal on success, nothing to dismiss. | could |
| FR-11 | The proof is a unit layer over envelope, checksum, validation, merge and cap rules, plus a browser journey that exports through the real download, imports the real file into a fresh context, and asserts the restored state survives a reload. | should |
| FR-12 | `docs/TDD.md` describes the envelope, the failure rules and the DOM seam; `README.md` names the backup; `conductor/product.md` §10.3 records the row as done. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | `src/utils/backupFile.ts` is the only module in `src/` that touches `document`, `Blob`, `URL` or `crypto`, and a unit test asserts that no other production file references them, so the canvas-only property stays a property rather than a memory. |
| NFR-2 | No network request anywhere in the feature: `fetch(` stays at zero matches in `src/`, and no external script, font or endpoint is added. |
| NFR-3 | No new runtime dependency, and the shell entry stays inside `validate-bundle`'s 200 kB gate. |
| NFR-4 | Coverage stays above the project gate (lines 95 / functions 88 / branches 85 / statements 90) and every new branch has a test that fails if it is inverted. |
| NFR-5 | The browser suite stays inside its 5-minute budget with the new journey, measured on two workers. |
| NFR-6 | Exporting or importing a realistic save (four profiles, full progress) blocks the frame for no more than one animation frame, and the file is small enough to email — kilobytes, not megabytes. |
| NFR-7 | No child-facing surface: the whole feature sits behind the three-second parental hold, and nothing appears in the hub, a game, or the profile picker. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A save with two profiles, stickers, progress, play time and insights exports to a file whose envelope validates against FR-1 and whose checksum verifies. | FR-1, FR-2 |
| AC-2 | Exporting from a device that only ever had a v1 save produces a v2 payload carrying what migration would have produced. | FR-3 |
| AC-3 | Importing that file into a context with empty storage, choosing merge, yields both profiles with every sticker, progress count and insight value, and they are still there after a reload. | FR-5, FR-8, FR-11 |
| AC-4 | The same file imported a second time changes nothing: no duplicate stickers, no inflated counters. | FR-5 |
| AC-5 | Replace overwrites a device's save with the file's contents after confirmation, and declining the confirmation writes nothing. | FR-6 |
| AC-6 | Five malformed inputs are each refused with a distinct sentence and leave the save byte-identical: not JSON, wrong `format`, newer `formatVersion`, newer `schemaVersion`, checksum mismatch. | FR-4 |
| AC-7 | Import is refused while the save layer reports degraded persistence, and export still works. | FR-7 |
| AC-8 | With four profiles already stored, an incoming file carrying an unknown profile is refused with the delete-a-profile instruction and writes nothing. | FR-5 |
| AC-9 | Page one of Settings shows the same eight rows at the same coordinates as before this track, every hit band is still `ROW_PITCH` tall, and page two is reachable in one tap and returns in one tap. | FR-9 |
| AC-10 | The bridge stays inert without `?e2e=1`, and no production module outside `src/utils/backupFile.ts` names a DOM global. | NFR-1, NFR-7 |

## Edge Cases

- **Empty save.** A device that has never been played exports a valid file with
  zero profiles of play; importing it merges to a no-op and says so.
- **Same file twice.** Merge is idempotent: the second import must not double a
  sticker or a counter (this is the property AC-4 pins and the reason the union
  rule is best-of-field rather than additive).
- **Profile id collision with different children.** Two devices created `p1`
  independently, so the same id can name different children. Merge treats it as
  the same child — best-of-field across both. Recorded as an accepted limit; the
  alternative needs a stable identity the product does not have.
- **A cancelled picker.** Choosing nothing leaves the page waiting with no error
  and no write.
- **A file that is valid but from a much older format.** `formatVersion` 1 only
  today; a lower number is accepted, a higher one refused.
- **Reload interrupted.** If the page is closed between a successful write and the
  reload, the save is already written; the reload only refreshes what is drawn.
- **A save degraded by quota.** Export still runs because it reads; import is
  refused per FR-7.
- **Very large save.** Four profiles with full progress is a few kilobytes; the
  journey asserts the file parses and round-trips rather than a size ceiling.
- **iOS stand-alone Safari.** The download anchor behaves differently in some
  versions. Chromium proves the code path; the real-device check is a manual
  exception the workflow already names.

## Dependencies

- **Tracks:** `20261107-storage-resilience` (the guarded save layer this reads and
  writes through) and `20261107-release-e2e` (the journey harness, the download
  and file-chooser fixtures) are merged. No open track blocks this one.
- **External:** none. No package is added, and the file APIs used are in every
  browser the product supports.

## Open Questions & Assumptions

| Question | Assumption |
| --- | --- |
| Where does the backup page live? | A second page inside the parental Settings panel, reached from a labelled card in the header band. Chosen over a ninth row because the panel is full and shrinking `ROW_PITCH` would take hit bands below the 64 px minimum. |
| What does merge do to settings? | Leaves the receiving device's settings alone. A child's sound and voice settings belong to the device in their hands; only replace carries them across. |
| What happens when merge exceeds four profiles? | The whole import is refused with an instruction to delete a profile, rather than silently dropping one. |
| Is the file encrypted? | No. It holds star counts, not secrets, and a passphrase flow would be a promise the product cannot support. The file is described as a save copy, not a secure archive. |
| Should export be possible while storage is degraded? | Yes — reading is unaffected, and a parent whose device cannot save has the most reason to take a copy off it. |

## References

- `conductor/product.md` §10.3 - the roadmap row this track implements, and the
  local-only, no-account promise it must not break.
- `src/utils/storage.ts` - the guarded save layer, `SCHEMA_VERSION`, the
  write-protection rule and `isPersistenceDegraded()`.
- `src/components/SettingsPanel.ts` and `src/components/settings/primitives.ts` -
  the panel geometry the second page must not disturb.
- `src/components/settings/ResetModal.ts` - the confirmation-card pattern.
- `docs/TDD.md` §5 - the stored shape, and §10.5 for the journey layer.
- `conductor/archive/20261107-storage-resilience/verification/review-fixes-2.md` -
  why a refused read is not an empty store, which constrains what import may
  assume.

# Review - Backup and Restore

- **Track:** `20261108-backup-restore`
- **Range reviewed:** `8029cfada0bc5a7abe63d8f9feeaab347c653d17..f5f0c8b4`
- **Reviewer:** `conductor-reviewer` subagent
- **Rounds:** 1
- **Verdict:** PASS WITH FINDINGS (round 1 returned CHANGES REQUIRED)

## Findings, round 1

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | High | `applyImport` returned `{ok: true}` without asking whether the write landed. `saveV2` swallows a `setItem` throw, flags the store degraded and keeps the state in memory only, so a restore onto a full disk was followed by a silent `reloadApp()` that destroyed the restore. The pre-check only caught a store already degraded or read-blocked. | `saveV2` returns whether the bytes landed; `mutatePersisted` surfaces it, including the write-protected future-version branch; `applyImport` returns `store-unavailable` when it did not, so the panel prints the sentence and does not reload. Tested by a `setItem` that throws during the import after the pre-check passed. |
| F2 | High | The journey seeded one profile and asserted `profileCount === 1`, so AC-3's cross-device merge and the append-a-new-profile branch were never exercised end to end - while the phase 4 evidence recorded AC-3 as pass. | The journey seeds `p1` and `p2`; after the merge it asserts two profiles, the active child's two stickers, `p1`'s plays and `p2`'s plays read from storage. 19/19 green. The phase 4 row now says what is actually asserted. |
| F3 | Medium | The DOM guard omitted `crypto`, which NFR-1 names; and an allowance was only checked for the file existing, so a stale allowance never failed. | `crypto` added to the scanned globals with no allowance (nothing matches it) and a new test asserts every allowed module still has at least one DOM site. |
| F4 | Medium | `bringToTop(closeButton)` ran once in the constructor; a page flip rebuilt rows after it, so on page two the export row won the corner shared with the ✕ hit box. | The button is a field and `buildPage` raises it after that page's rows. A test asserts two calls and that the second lands after the rebuild. |
| F5 | Medium | `clearPage` destroyed the voice chip, preview and band while `VoiceRow` kept the handles and its `voiceschanged` listener for the panel's lifetime, so the platform event drove destroyed objects on page two. | `VoiceRow.release()` nulls the handles, `clearPage` calls it before destroying, and `voiceChanged` returns early when they are gone. Tested by firing the event with page two open. |
| F6 | Medium | `planImport` applied the four-profile cap in merge only; a checksum-valid five-profile file installed five profiles under replace. | The cap is checked on the normalised incoming save before the mode switch, and refuses in both modes. |
| F7 | Medium | `readBackup` cast any checksum-matching payload; merge then dereferenced it and threw `TypeError` from a pointer handler, while replace silently installed defaults. | `readBackup` requires a record with a `profiles` array after the checksum, so a checksum-valid `{}` is refused as `wrong-format`; `planImport` also normalises once at the top. |
| F8 | Medium | FR-10 promised a result line with numbers; success showed nothing and reloaded at once. | `chooseImport` counts profiles and stickers before and after, prints `Merged 1 profile and 2 stickers into this one.` or `Restored 2 profiles and 1 sticker.`, then schedules the reload at 900 ms. |
| F9 | Medium | AC-5's "declining writes nothing" path was never exercised. | A test dismisses the choice card and asserts `applyImport` was never called and no choices remain. |
| F10 | Low | `docs/perf-baseline.md` recorded the executor's coverage run, a hundredth above the primary's. | Refreshed to the measured 97.33 / 91.67 / 96.28 / 98.29. |
| F11 | Low | Phase 4's Result, checkpoint and evidence lines sat inside the review-fix HTML comment. | Corrected before the fix round began; the template comment is now last in the file. |
| F12 | Low | NFR-6 was marked pass on journey runtimes rather than frame time or payload size. | A four-profile, all-22-game-ids save measures **23,435 bytes** of envelope JSON against a 64 kB assertion, recorded; the frame half is stated as reasoned from the single `setItem` rather than timed. |
| F13 | Low | The refusal loop compared `save` to `SAMPLE_PAYLOAD`, neither reaching `readBackup`, so the "touches nothing" assertions were tautologies. | Replaced with a purity note; byte-identity is asserted where it can be, at the storage layer. |
| F14 | Low | The TDD said the reading order ends at `profile-cap`, which `readBackup` never returns. | The order ends at `checksum-mismatch`; `profile-cap` is attributed to `planImport` and `store-unavailable` to `applyImport`. |

## What the review confirmed

- **The checksum is what it claims.** 64-bit FNV-1a over the UTF-8 bytes of `JSON.stringify(payload)`, with published vectors pinned and `createBackup` returning the exact text it hashed.
- **Version before checksum.** A file from a future build is refused for being new, not for being corrupt, so the parent is told to update rather than to distrust their backup.
- **Six refusals, six sentences.** Each is one parent-actionable line, asserted verbatim, and none of them says "error".
- **Merge is idempotent and the cap does not half-restore.** Proved at the unit layer.
- **The seam is the only new DOM module**, and `input.hidden` keeps a native file control off a four-year-old's screen.
- **Page one did not move**, asserted as a label-to-y map across a round trip.
- **The journey proves the file, not a copy**, by handing the real download path to a chooser in a second context.

## Overrides

None. No finding was waived, downgraded or deferred.

## Deferred

Nothing. Every finding was fixed in-track.

## Documentation sync

`spec.md` carries two dated corrections (the "no DOM usage at all" premise, and AC-10's absolute wording), `conductor/tech-stack.md` carries the design update, `docs/TDD.md` carries §6.7 and the reading order, and `conductor/product.md` §10.3 records the roadmap row as done with both accepted limits. `doc_sync: synced`.

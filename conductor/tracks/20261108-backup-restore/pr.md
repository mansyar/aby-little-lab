# Backup and Restore

A parent can carry a child's save off one device and onto another - a file out,
a picker in, a merge or a replace - and nothing about the child's experience
changes. This is the only mitigation the product has for its largest data risk:
every star, sticker and streak lives in one browser's `localStorage`, with no
account, no server and no sync.

## Track

| Phase | Checkpoint | What it delivered |
| --- | --- | --- |
| 1 - The file format, as pure logic | `839fe57b` | The versioned envelope, the checksum, six named refusals and the merge/replace rules - no browser, no clock |
| 2 - The browser seam, and the write it performs | `6f58106b` | One module that owns every file call, and one write that applies an import or does nothing |
| 3 - The second Settings page | `f14ab1c8` | A page switch in the header band, Save and Restore on page two, and one result line |
| 4 - The round trip, and the record | `d49498fe` | A journey that exports, hands the real file to a second browser and reads it back |
| Review fixes | `a5864afa` | Fourteen findings, including a restore that could fail in silence and a journey that only proved half of AC-3 |

## What happened

**The format is pure, on purpose.** `src/utils/backupFormat.ts` takes `now` and
`schemaVersion` as arguments and names no browser global, so its 44-odd tests run
in Node in milliseconds and the whole envelope can be reasoned about without a
page. `createBackup` returns the object *and* the exact text it hashed, which
removes the class of bug where a caller stringifies the envelope differently from
the bytes the checksum describes.

**The checksum is honest about what it is.** 64-bit FNV-1a over
`JSON.stringify(payload)`, documented as detecting corruption and truncation, not
tampering - the file holds star counts, not secrets, and `crypto.subtle` is
absent on a plain-http origin anyway. Version checks run before the checksum so a
file from a future build says "update the app" rather than "this file is damaged".

**Import is one write or none.** `planImport` computes the entire next save -
best-of-field merge, stickers unioned at the earlier `earnedAt`, counters at the
larger, stamps at the later, activity unioned - and a save that would exceed four
profiles refuses outright rather than dropping the profiles that would not fit.
Importing the same file twice is therefore equal to importing it once.

**The DOM lives in one module.** The app had never needed a download or a file
picker; `src/utils/backupFile.ts` owns both, and a guard test scans every
production file for `document`, `Blob`, `URL`, `crypto`, `FileReader` and
`navigator.clipboard`, allowing the seam plus the five modules that already used
the DOM for visibility, fonts and viewport zoom - and failing when a sixth joins
or an allowed one stops needing its allowance.

**Settings grew a page, not a row.** The panel's eight rows end one pixel inside
its 760 px height, so a ninth row would have meant shrinking hit bands below the
64 px minimum the project holds itself to. A switch card sits in the header band
that was empty, page one's rows keep their exact coordinates, and each page
destroys its own objects on switch so no hidden row keeps a hit band.

**The journey proves the file, not a copy.** One context exports; the path of the
file that actually landed on disk is handed to a file chooser in a *second*
`BrowserContext`; the merge button is tapped at its drawn point; and after the
reload both children are there with their own progress and streaks and the app
still launches a game. The second test feeds a text file in memory and asserts
the parent's sentence, an empty choice card and an untouched save.

## Requirements

- **FR-1..FR-12** - met.
- **NFR-1** - met, with the spec corrected: the claim is that no module *renders*
  through the DOM, not that none touches it (five already did).
- **NFR-2** - met: zero `fetch(`, no network request anywhere in the feature.
- **NFR-3** - met: no new dependency; shell entry 168.3 kB of 200 kB.
- **NFR-4** - met: coverage 97.33 / 91.67 / 96.28 / 98.29 against 90 / 85 / 88 / 95.
- **NFR-5** - met: 19 journeys in 3.7 min on two workers, ~1.3 min of headroom.
- **NFR-6** - met and now measured: a four-profile save at the app's real shape is
  **23,435 bytes**, written in a single `setItem`.
- **NFR-7** - met: the new surface is behind the three-second hold, and nothing
  changed for the child.
- **AC-1..AC-10** - met. AC-3 in particular is a passing cross-device journey with
  two profiles after the fix round; AC-9's exact page-one coordinates are asserted
  across a page round trip.

## Verification

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 307 files, no findings |
| Types | `pnpm typecheck` | both programs (`src` + `e2e`) |
| Unit | `CI=true pnpm test -- --run` | 140 files / 3,069 tests |
| Coverage | `pnpm test:coverage` | 97.33 / 91.67 / 96.28 / 98.29 |
| Build | `pnpm build` | 59 precache entries, 1,765.75 KiB |
| Bundle | `node scripts/validate-bundle.js` | shell `index-DI9SmdDG.js` 168.3 kB, phaser 1,335.0 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed |
| Docs | `node scripts/validate-docs.js` | 5 passed |
| Browser | `pnpm test:e2e` | 19 passed in 3.7 min |

Evidence: `verification/phase-1.md` .. `phase-4.md`, `review-fixes.md`,
`integrated.md`. The format's teeth were proved red before the fix
(`backupFormat.test.ts` refused each damaged file by name), the guard's teeth were
proved by adding `document.title` to `svgDataUri.ts` and reverting to an empty
diff, and the storage write-reports-failure fix was proved by a `setItem` that
throws mid-import.

## Media

Omitted deliberately. The change has no motion, no art and no layout a screenshot
would explain better than the assertions do - the interesting artefact is a
`23,435`-byte JSON file, and the interesting proof is that a second browser can
read it.

## Review

One round, `conductor-reviewer`, verdict **PASS WITH FINDINGS** after round 1
returned CHANGES REQUIRED with 2 high, 7 medium and 5 low findings. All fourteen
were fixed in-track; none was deferred, none overridden. The two high findings
were the ones worth having: a restore that could fail silently because the write
outcome was discarded, and a journey that asserted one profile where AC-3 promises
two.

## Deviations and risks

- **A seventh refusal code** (`store-unavailable`) lives in the format module but
  is raised by the storage layer, so the parent reads one vocabulary rather than
  two.
- **The bridge publishes the choice buttons**, not just the page and rows: the
  journey taps the Merge button a parent taps instead of hard-coding coordinates.
- **`e2e/node-env.d.ts` declares `Buffer`.** Playwright base64-encodes in-memory
  file bytes for the page and a `Uint8Array` does not survive that step; with no
  `@types/node` and `skipLibCheck` on, `tsc` could not catch it and the first real
  run of the journey did.
- **Two accepted limits, documented rather than hidden.** Profile ids are `p1`…
  `p4` on every device, so two tablets belonging to different children will merge
  their `p1` into one profile. And the file is not encrypted: it holds star counts,
  not secrets, and the checksum detects corruption, not tampering.
- **Shell entry +9.8 kB** across the track (158.5 → 168.3). Nothing in this
  feature belongs in the boot path, but the headroom is now 31.7 kB and worth
  measuring before the next module the hub imports.

## Follow-ups

None in-track. Two candidates for the roadmap, recorded in `integrated.md`:
read-back verification for stores that silently discard writes, and a documented
precedence rule for two devices that genuinely represent different children.

## Rollback

```
git revert --no-commit 8029cfad..HEAD && git commit
```

Reverting removes the Settings page, the seam and the journey; every stored save
keeps its shape, because `SCHEMA_VERSION` and the payload did not change.

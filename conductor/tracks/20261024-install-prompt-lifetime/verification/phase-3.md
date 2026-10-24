# Phase 3 verification - The documents describe the row that is there

Track: `20261024-install-prompt-lifetime`
Branch: `fix/20261024-install-prompt-lifetime`
Commit: `dd1099c9 docs(pwa): describe the install row the code now draws`
Covers: FR-4, AC-4, AC-6

## 1. What changed

Documents only. No file under `src/`, no test, no `package.json`, and nothing in
the Conductor state changed.

### `docs/PRD.md` §1.4 Platforms, install and offline

| Lines | Change |
| --- | --- |
| 94 | The platform paragraph now states the iOS branch as a condition and puts capture at boot. |
| 96 | New paragraph: the row is a snapshot taken at panel open, it is not live, the offer is single use, and nothing is remembered across reloads. |

Before (one sentence inside line 94):

> Installing is offered from the Settings panel, which shows "Install App" on
> Chrome, Edge and Android, an iOS Safari how-to on iOS, and nothing once the app
> is already installed.

After:

> Installing is offered from the Settings panel, which shows "Install App" on
> Chrome, Edge and Android, an iOS Safari how-to wherever the app is not installed
> and no prompt is available, and nothing once the app is installed or running
> standalone. Listening for the browser's install prompt starts when the app
> boots, not when Settings opens, because the browser makes its offer once per
> page load and often long before a parent asks for the panel.

The rest of line 94 is the pre-existing sentence ("The app is a single web build
… falling back to standalone"), untouched. Line 96 is new and reads:

> The row reports the browser's offer as of the moment the panel opens, and it is
> not live: a prompt that arrives while Settings is already open shows up the next
> time it opens. The offer is single use. Once "Install App" has been used the row
> is gone for the rest of that page's life, and nothing about the dismissal is
> stored, so a reload starts from whatever the browser offers then.

The offline and self-hosting paragraphs that follow are untouched, and no
heading or section number moved.

### `docs/PRD.md` §4.10 Install and update

| Lines | Change |
| --- | --- |
| 428 | The row sentence carries the same two corrections as §1.4: iOS how-to keyed on "not installed and no prompt available", and hidden once installed or standalone. |
| 430 | New paragraph tying the row to the boot-time capture: snapshot at open, single use, nothing stored across reloads. |

Before (line 428):

> The Settings panel carries a context-aware install row: "Install App" where the
> browser supports prompting, an iOS Safari how-to where it does not (Share, then
> Add to Home Screen), and nothing when the app is already installed.

After:

> The Settings panel carries a context-aware install row: "Install App" where the
> browser supports prompting, an iOS Safari how-to wherever the app is not
> installed and no prompt is available (Share, then Add to Home Screen), and
> nothing once the app is installed or running standalone.

The new line 430 says what the earlier sentence could not: capture starts at
boot, the row is a snapshot, using the prompt spends it, a refusal ends the same
way, and "Nothing is remembered across reloads." The updates paragraph (line 432)
is untouched.

### `docs/TDD.md` §5.5 SettingsPanel and the settings group

| Lines | Change |
| --- | --- |
| 621 | The `InstallRow.ts` table row no longer claims `createInstallTracker()` drives the row; it names the app-lifetime tracker and keeps the three state names. |
| 623 | New paragraph: injectable core vs browser adapter, and what "inert" means for a partial host. |
| 625 | New paragraph: one holder for the page, `initInstallPrompt()` at boot, lazy `getInstallPromptTracker()`, the panel borrowing it without destroying it, and the meaning of `promptAvailable`. |

Before (line 621):

```
| `InstallRow.ts` | install state row driven by `createInstallTracker()` — `installable`, `ios-howto` or hidden |
```

After:

```
| `InstallRow.ts` | install state row read from the app-lifetime tracker — `installable`, `ios-howto` or hidden |
```

The section that owns the table was the honest home: the table's subject is
`src/components/settings/`, and `pwaInstall.ts` is the module that supplies what
`InstallRow` reads, so the two paragraphs sit directly under it rather than in a
new section. Everything else in §5.5 - the toggle table, the row offsets, the
pinch-zoom paragraph, the other six table rows - is unchanged, and §5.6 onward is
untouched. The module tree at §2.2 and the `pwaInstall.ts` entry in it are
unchanged: that entry lists files, and no file was added or removed.

### `docs/roadmap.md`

| Lines | Change |
| --- | --- |
| 30-38 (removed) | The `### The install prompt can disappear` Known Issue deleted in full, heading included: it named `SettingsPanel.ts` building a tracker per open, which Phase 1 stopped doing. |
| 66-73 (renumbered) | The Future Work item "Keep the install prompt alive for the life of the app" deleted; the three survivors after it renumbered `3.`, `4.`, `5.`. |

Fifteen lines removed from Known Issues and three from Future Work; nothing else
in either list was reworded. The remaining Future Work entries still name their
own tracks (*play-time-banking*, *shared-random-helpers*, *repo-hygiene*).

### `README.md`

| Line | Change |
| --- | --- |
| 246 | "The full list - `five of them`" → "**four of them**", the number of `###` headings `docs/roadmap.md` now carries under Known Issues. |

No bullet was removed, because the README never listed the install prompt: its
two bullets are the drag-game debt and the schema-version debt, both still open.
The paragraph's other claims (each item names the file and how a reader would
notice it, roadmap is the single home) still hold.

## 2. The roadmap count, and the README correction it implies

Counted by searching `docs/roadmap.md` for `^### ` and reading the two sections
rather than assuming:

- Known Issues headings after the deletion: **4**, at lines 13, 22, 30 and 40 -
  *Three games hand-roll their drag scaffolding*, *The stored payload carries no
  schema version*, *Five copies of the same shuffle, and an RNG seam in only two
  modules*, *Repository hygiene*. Before the deletion there were 5.
- Future Work entries: **5**, numbered `1.`-`5.` with no gap and no duplicate, at
  lines 58, 63, 66, 69 and 73. Before the deletion there were 6.

So the README's count had to move from five to four. The claim "the full list -
four of them" is now literally the number of `###` headings the file contains.

## 3. Commands

Run from the repo root on Windows (`pwsh`), in the brief's order. The chained
invocation was rejected as a whole (`permission.rejected` on the `shell` tool), so
each layer was run as its own command, which the brief allows.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm check` | 0 | 252 files checked. The same two pre-existing findings phase 1 and 2 named: `biome.json` schema 2.5.5 vs CLI 2.5.10 (info), `musicalMemoryScene.test.ts:294` non-null assertion (warning). No new finding from the edited files. |
| `pnpm typecheck` | 0 | `tsc --noEmit` silent. |
| `pnpm test -- --run` | 0 | 121 files, **2630 passed** - identical to the post-Phase-2 baseline, as a docs-only phase must be. |
| `pnpm test:coverage` | 0 | 121 files, 2630 passed. Statements 97.99 %, branches 92 %, functions 96.69 %, lines 98.74 % (thresholds 95/85/88/90) - the same four numbers as Phase 2. |
| `pnpm build` | 0 | 343 modules; `index-D_wN43lj.js` 141.54 kB (32.68 kB gzip); `phaser-P1E8uaLi.js` 1,374.82 kB; `sw.js` + workbox generated. Same fingerprint as Phase 2, which is the expected result of a phase that touches no source. |
| `node scripts/validate-bundle.js` | 0 | `Phaser vendor chunk present: phaser-P1E8uaLi.js (1342.6 kB)`; `shell entry index-D_wN43lj.js = 138.2 kB (<= 200 kB)`. |
| `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (42 chunks, 42 precached). |
| `node scripts/validate-docs.js` | - | **Denied by the shell sandbox** (`permission.rejected`), not retried or rephrased. See `## 6. Blockers`. |

Test totals: 2630 files/tests, unchanged - 121 files and 2630 tests, the number
the brief expects. Coverage did not move either, which is the strongest available
signal that this phase compiled nothing into the bundle.

## 4. Documents against the code

Every claim added to the documents, and the code fact that backs it. Line numbers
are the post-Phase-2 source.

| Claim added | Code fact |
| --- | --- |
| Capture begins when the app boots, not when Settings opens (PRD 94, 430). | `src/main.ts:40` calls `initInstallPrompt()` before both `initPwaBridge(registerSW)` (`:44`) and `new Phaser.Game(config)` (`:46`); `pwaInstall.ts` `initInstallPrompt()` resolves the stored tracker, which subscribes both listeners in `createInstallTracker()` at construction. |
| Listening starts at boot "because the browser makes its offer once per page load" (PRD 94). | The module's own lifetime paragraph (`pwaInstall.ts:11-16`) records the same reason, and the spec's D1 names it as the root cause. |
| The row is read from the app-lifetime tracker (TDD 621). | `SettingsPanel.ts:66` defaults the constructor parameter to `getInstallPromptTracker()`; `SettingsPanel.ts:152` passes the panel's tracker into `InstallRow`; `InstallRow.ts:43` is the only `getState()` read. |
| The row reflects the offer at the moment the panel opens and is not live (PRD 96, 430). | `InstallRow.ts:43` reads state once inside `create()`, which `SettingsPanel.ts:152` calls during panel construction; nothing re-reads it, and no scene listens for `beforeinstallprompt` itself. |
| The prompt is single use: using "Install App" removes the row for the page's life, and a refusal ends the same way (PRD 96, 430; TDD 625). | `pwaInstall.ts:113-129`: the event is claimed, `deferredPrompt` and `promptAvailable` are cleared before the await, the rejection path resolves `false` without restoring the flag, and `onBeforeInstallPrompt` is the only writer that sets it again. |
| Nothing about a dismissal is stored; a reload starts from whatever the browser offers then (PRD 96, 430). | No storage import exists in `pwaInstall.ts`; `createBrowserInstallTracker()` touches only `navigator.userAgent`, `window.matchMedia` and the listener methods. FR-5/AC-5 are pinned by `pwaInstall.test.ts:359-401`. |
| `createInstallTracker(deps)` is the injectable core (TDD 623). | `pwaInstall.ts` `createInstallTracker(deps: InstallTrackerDeps)` takes user agent, standalone predicate and the two listener methods as one object; every suite drives it through fakes. |
| `createBrowserInstallTracker()` is the only place `window` and `navigator` are read, and it is inert where they are absent or partial (TDD 623). | `pwaInstall.ts` `canObserveInstallEvents()` requires `window`, `navigator` and both listener methods to be functions; when that fails the adapter returns a tracker over no-op deps, so a partial `window` stub reports `hidden` and attaches nothing instead of throwing. |
| `initInstallPrompt()` runs in `src/main.ts` before `new Phaser.Game`; `getInstallPromptTracker()` returns the one stored instance, creating it lazily; a second init does not register a second listener pair (TDD 625). | `main.ts:40`; `pwaInstall.ts` keeps `let installPromptTracker`, `resolveInstallPromptTracker()` returns the existing instance or creates one, and `initInstallPrompt()`/`getInstallPromptTracker()` both go through it. Pinned by the app-lifetime cases in `pwaInstall.test.ts:300-333`. |
| The panel borrows the tracker and deliberately does not destroy it, so closing Settings never stops capture (TDD 625). | `SettingsPanel.ts:185-187` is a comment where `this.installTracker.destroy()` used to be; `SettingsPanel.test.ts` case (b) asserts `deps.removeEventListener` is never called across close and reopen. |
| `promptAvailable` means a captured, unused prompt exists (TDD 625). | `InstallStateInput.promptAvailable`'s doc and the flag's own comment say the same; `getInstallUiState()` returns `"installable"` only when it is true. |
| The iOS how-to appears whenever the app is not installed and no prompt is available, and nothing shows once installed or standalone (PRD 94, 428). | `pwaInstall.ts` `getInstallUiState()`: `installed || isStandalone` wins first and returns `"hidden"`, then `promptAvailable` returns `"installable"`, then `isIos` returns `"ios-howto"`. Unchanged behaviour, unchanged wording of the surrounding claim. |

Nothing in the documents was written that the code does not do. One thing the
documents deliberately do **not** say: they do not promise live insertion while
the panel is open, because there is none (`InstallRow` reads once).

## 5. Deviations

None against `Touches`. The four permitted documents plus this evidence file are
the only changes (`git diff --stat` before the evidence commit: `README.md` 2 +-,
`docs/PRD.md` 8 ++, `docs/TDD.md` 6 +, `docs/roadmap.md` 18 +-, 4 files, 15
insertions and 19 deletions).

Two wording choices worth recording so they are not read as new requirements:

1. **§4.10's iOS sentence was tightened** from "an iOS Safari how-to where it
   does not" to "wherever the app is not installed and no prompt is available".
   The old phrasing leaned on punctuation to mean the same thing; FR-4 and AC-4
   state the conditions explicitly, so the document now does too. The meaning is
   unchanged.
2. **The TDD paragraphs use spaced hyphens** (` - `) inside otherwise em-dash
   prose. The file already mixes both in prose (§7.1's `audioIdentity` row, §9.3,
   §10.1 and §7.5 all use ` - `), and matching the neighbouring paragraphs line
   for line was judged better than restyling the section.

## 6. Blockers

- `node scripts/validate-docs.js` - **denied by the shell sandbox**
  (`permission.rejected`), exactly as in phases 1 and 2. Per the brief it was not
  retried, respelled or routed around; the primary agent must run it. Unlike
  phases 1 and 2, this phase *is* a `docs/` change, so the layer that could not
  run here is the one that matters most. The checks it performs that this phase
  could affect were done by hand: no relative link was added or removed, the one
  new anchor (`[§3.1](#31-phaser-configuration)` in TDD 625) matches the heading
  `### 3.1 Phaser configuration`, `docs/roadmap.md` still carries both
  `## Known Issues` and `## Future Work / Roadmap`, and no Conductor path was
  added to any document.

## 7. Notes for the primary agent

- Run `node scripts/validate-docs.js` yourself; it is the only unverified layer,
  and it is the layer this phase changes. Expect 5 passed, as in your phase-1 and
  phase-2 runs.
- The suite and the bundle are byte-identical to the post-Phase-2 state (121
  files / 2630 tests, `index-D_wN43lj.js`, 97.99/92/96.69/98.74), which is the
  evidence that this phase stayed documents-only.
- The roadmap now has 4 Known Issues and 5 Future Work items. If a later phase
  resolves another item, the README count on line 246 is the number to move, and
  the number of `###` headings under `## Known Issues` is how to check it.
- Historical mentions of the retired item were left alone deliberately: the dated
  entry in `conductor/product.md:150`, the v1.21.0 release notes, the archived
  track records, and `docs/device-testing-checklist.md:264` (which still describes
  a real manual check - tapping "Install App" should still raise the browser
  prompt).
- Nothing in `src/` was touched, so if the review finds a code/document
  contradiction beyond the four edited files, it is a code finding, not a
  documentation slip introduced here.

## Primary verification

Base `c12b70d7`, commit `dd1099c9 docs(pwa): describe the install row the code now draws` - the documents and this evidence were squashed into that one commit. Documents only: no source, test or config file appears in the range.

| Layer | Command | Exit | Note |
| --- | --- | --- | --- |
| 1 | `git status --porcelain` | clean | |
| 2 | `git diff --name-only c12b70d7..HEAD` | 4 docs + evidence | exactly `Touches`, 286 insertions / 19 deletions |
| 3 | `pnpm check` | 0 | two pre-existing findings only |
| 4 | `pnpm typecheck` | 0 | |
| 5 | `pnpm test -- --run` | 0 | 121 files / 2630 tests, unchanged |
| 6 | `pnpm test:coverage` | 0 | 97.99 / 92 / 96.69 / 98.74, unchanged |
| 7 | `pnpm build` | 0 | |
| 8 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB, shell `index-D_wN43lj.js` 138.2 kB - identical to Phase 2 |
| 9 | `node scripts/validate-pwa.js` | 0 | 16 passed |
| 10 | `node scripts/validate-docs.js` | 0 | 5 passed - the layer the subagent could not run |

The identical suite count, coverage, build output and bundle hash are the strongest available evidence that this phase touched prose and nothing else.

### Documents against the code

- **"Listening starts when the app boots"** - `src/main.ts` calls `initInstallPrompt()` before `new Phaser.Game`, above `initPwaBridge`.
- **"one tracker for the life of the page" / "one listener pair"** - `resolveInstallPromptTracker()` stores a single instance; `initInstallPrompt()` reuses it; `watchVisibility`-style listeners are attached inside `createInstallTracker`, which now runs once.
- **"the panel borrows it and leaves destroy() alone"** - `SettingsPanel` defaults to `getInstallPromptTracker()` and `destroy()` no longer calls `tracker.destroy()`, with the code comment saying why.
- **"a prompt arriving while Settings is open shows up next time"** - `InstallRow.create()` reads `getState()` once at build time; nothing subscribes to changes. Correct, and correctly described as a snapshot.
- **"using the prompt spends it, a refusal ends the same way"** - `prompt()` clears `deferredPrompt` and `promptAvailable` before awaiting, and the `catch` returns `false` without restoring them. A fresh `beforeinstallprompt` is the only re-arm path.
- **"nothing is remembered across reloads"** - `pwaInstall.ts` imports nothing and `localStorage` is pinned untouched by the AC-5 test.
- **The iOS clause's two conditions** - `getInstallUiState` returns `ios-howto` only when `!installed && !isStandalone && !promptAvailable`, which is what the tightened sentence now says.

### Accepted decisions

1. **PRD §4.10 iOS clause tightened** from "where it does not" to "wherever the app is not installed and no prompt is available". The old wording implied the how-to was about lacking a prompt API; the real condition also requires the app not to be installed. Accepted - it states FR-4 more precisely without changing behaviour.
2. **TDD paragraphs use spaced hyphens** inside otherwise em-dashed prose. The file already mixes both styles; neighbouring style won over restyling the section. Accepted as cosmetic.
3. **Historical mentions left in place** (`conductor/product.md:150`, `docs/release-notes-v1.21.0.md`, archived tracks, `docs/device-testing-checklist.md` manual check). They describe a past state or remain valid manual checks; rewriting history is not this track's job. Accepted.

### Counts checked

`docs/roadmap.md` Known Issues now holds **4** `###` headings (5 before) and Future Work holds **5** numbered items (6 before), numbered 1-5 with no gaps. `README.md` correctly moved from "five of them" to "four of them", and its bullet list never listed the install prompt, so nothing was removed there.

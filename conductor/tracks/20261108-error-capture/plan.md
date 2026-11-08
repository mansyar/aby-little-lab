# Error Capture — Implementation Plan

> **Branch:** `feat/20261108-error-capture`
> **Base:** `master` @ `7d3c0db886685b5b307eefc53231990f721417dc`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, `blocked`, and only the primary agent writes this file.

## Phase 1: The log, as a pure module

- **Goal:** a crash becomes a bounded, readable record with no browser global and no clock of its own
- **Depends on:** nothing
- **Covers:** FR-2, FR-3, FR-5, NFR-1, AC-1, AC-2, AC-3
- **Touches:** `src/utils/diagnostics.ts`, `src/__tests__/utils/diagnostics.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/tracks/20261108-error-capture/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Define the entry, and coerce whatever arrives into one** - covers: FR-2
  - [ ] P1.T1.1 An `Error`, a rejected string, a rejected `undefined`, a rejected plain object and a thrown non-`Error` each produce a complete `CrashEntry` with a readable message and, where one exists, a stack trimmed to 400 characters
  - [ ] P1.T1.2 A rejection with no reason reads `Unhandled rejection with no reason` rather than an empty message
- [x] **P1.T2: Keep the last twenty, oldest first-out** - covers: FR-3, NFR-1
  - [ ] P1.T2.1 `appendCrash(existing, entry)` returns a new array capped at `MAX_ENTRIES = 20`, newest last, dropping from the head
  - [ ] P1.T2.2 A 25-entry sequence keeps exactly the newest 20 in order, and the serialised maximum-size buffer is asserted under 4 kB
- [x] **P1.T3: Render the report text** - covers: FR-10, FR-5
  - [ ] P1.T3.1 `buildDiagnosticsReport(entries, environment, now)` returns plain text: a header built from the passed environment, a blank line, then the entries newest-first
  - [ ] P1.T3.2 An empty log renders a one-line "no crashes recorded" body rather than an empty file, with no header fields invented
  - [ ] P1.T3.3 `normalizeDiagnostics` backfills an absent or malformed field to `[]` and drops entries that cannot be read, so a pre-track payload loads
- [x] **P1.T4: Prove the module is pure** - covers: FR-11
  - [ ] P1.T4.1 A guard-style assertion that `src/utils/diagnostics.ts` names no browser global and reads no clock (no `new Date()` without an argument, no `Date.now()`)

**Result:** verified — a thrown value becomes a `CrashEntry` without throwing, the newest twenty are kept, an old or hand-edited payload reads as a safe log at schema version 1, and the report text is written in one place from an explicit clock. 3,103 tests green; the shell entry is unchanged at 168.3 kB because nothing imports the module yet.
**Checkpoint:** 249e627d
**Evidence:** conductor/tracks/20261108-error-capture/verification/phase-1.md

## Phase 2: Capture, record, recover

- **Goal:** an uncaught error is recorded in the save and turns into a card a child can dismiss
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-4, FR-6, FR-7, FR-11, FR-12, NFR-3, NFR-7, AC-4, AC-5, AC-6, AC-9
- **Touches:** `src/game/errorCapture.ts`, `src/scenes/RecoverScene.ts`, `src/main.ts`, `src/types/index.ts`, `src/game/profileLogic.ts`, `src/utils/storage.ts`, `src/utils/reload.ts`, `src/__tests__/game/errorCapture.test.ts`, `src/__tests__/scenes/recoverScene.test.ts`, `src/__tests__/utils/storage.test.ts`, `src/__tests__/guard/backupDom.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/tracks/20261108-error-capture/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: Store the log beside the settings** - covers: FR-3, FR-4, FR-5
  - [x] P2.T1.1 `Settings.diagnostics: CrashEntry[]`, created empty for a new save and backfilled by the settings normaliser, with `SCHEMA_VERSION` untouched
  - [x] P2.T1.2 `getDiagnostics()` and `recordCrash(entry)` on the storage facade, the write going through the existing total mutation path
  - [x] P2.T1.3 Tests: a pre-track payload loads an empty log and saves normally; a refused write leaves the entry readable in memory and persists it on the next accepted save; an unknown-version payload stays write-protected
- [x] **P2.T2: Install the handlers before the game exists** - covers: FR-1, FR-4, FR-7
  - [x] P2.T2.1 `installErrorCapture(game)` is called in `main.ts` after the game is constructed and before anything else can throw, attaching `error` and `unhandledrejection` once
  - [x] P2.T2.2 The handler body is total: coercion cannot throw, recording is wrapped, and a failure inside recording is swallowed while the card still shows
  - [x] P2.T2.3 With no active scene the handler reloads once, guarded by a session-scoped flag in a small `src/utils/reload.ts`; a second crash in the same session logs and does not reload
  - [x] P2.T2.4 Tests with fake `window`/`sessionStorage`: both event shapes record, a throwing recorder does not propagate, the first and second engagement behave differently
- [x] **P2.T3: Draw the card** - covers: FR-6, NFR-3, NFR-7
  - [x] P2.T3.1 `RecoverScene` draws a full-bleed dim backdrop, the `mascot_idle` image when that texture exists, and one circular-arrow button; it creates no text object
  - [x] P2.T3.2 Only the button is interactive; tapping it reloads; the scene is raised once per page load through a module flag so a crash loop cannot stack cards
  - [x] P2.T3.3 Registered eagerly in `main.ts`'s scene array, with a comment recording that Phaser 4 cannot lazily add to it
  - [x] P2.T3.4 Tests: no text object is created, the button is the only interactive object, a missing mascot texture does not throw
- [x] **P2.T4: Make the guard say what it now means** - covers: FR-11, FR-12, AC-9
  - [x] P2.T4.1 `window.` and `sessionStorage` join the guard's watched globals, with `errorCapture.ts` and `reload.ts` added to the enumerated allowlist and a stated reason each
  - [x] P2.T4.2 The guard still fails when a module outside the list names a watched global, and fails when an allowed module stops naming one
  - [x] P2.T4.3 Teeth proved: a temporary `sessionStorage.setItem` in another module fails the guard, then is reverted to an empty diff

**Result:** verified - an uncaught error is coerced, recorded through the total save path and answered with a card that has no words on it; a crash before the canvas exists spends one session-guarded reload and a second logs without reloading. 3,134 tests green, coverage 97.38/91.97/96.34/98.32, shell entry 168.3 -> 171.0 kB as NFR-4 predicted.
**Checkpoint:** d3a051b3
**Evidence:** conductor/tracks/20261108-error-capture/verification/phase-2.md

## Phase 3: The parent's row

- **Goal:** a parent reaches the trace in two taps and gets a file they can email
- **Depends on:** Phase 2
- **Covers:** FR-8, FR-9, FR-10, AC-7, AC-8
- **Touches:** `src/components/SettingsPanel.ts`, `src/utils/backupFile.ts`, `src/game/e2eBridge.ts`, `src/scenes/HubScene.ts`, `src/__tests__/components/SettingsPanel.test.ts`, `src/__tests__/utils/backupFile.test.ts`, `src/__tests__/game/e2eBridge.test.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/tracks/20261108-error-capture/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Gather the environment and write the file** - covers: FR-10, FR-9
  - [x] P3.T1.1 `downloadText(filename, body)` generalised out of `downloadBackup` so both write through one anchor path, with `downloadBackup` unchanged in behaviour
  - [x] P3.T1.2 `saveDiagnostics()` in the seam reads the environment (app version, user agent, viewport, profile count, play-time state, degraded flag), builds the report via the pure module, and downloads `diagnostics-<local day>.txt`
  - [x] P3.T1.3 An empty log downloads nothing and returns a value the panel turns into a sentence
- [x] **P3.T2: Put the row on page two** - covers: FR-8
  - [x] P3.T2.1 A third row at the next free pitch on page two, leaving page one's eight rows and the result line's place intact
  - [x] P3.T2.2 The result line reports `Saved <filename>` or that no crashes have been recorded, and the row is not disabled when the log is empty
- [x] **P3.T3: Publish it for the journey** - covers: FR-8, AC-7
  - [x] P3.T3.1 The bridge publishes the diagnostics row's point and the result line's text, additively and inert without `?e2e=1`
  - [x] P3.T3.2 Tests: page one's eight labels and `y` values are asserted equal to the pre-change list; the row writes once and reports; an empty log reports without writing

- **Result:** verified - a third row on Backup page two writes the crash log to `diagnostics-<local day>.txt` with an environment header, an empty log writes no file and says so, and the download seam keeps the backup `application/json` while the report leaves as `text/plain`. 3,143 tests green, coverage 97.39/92/96.36/98.33, shell entry 172.3 kB of the 200 kB gate.
- **Checkpoint:** 07b09ab9
- **Evidence:** conductor/tracks/20261108-error-capture/verification/phase-3.md

## Phase 4: Proof, and the record

- **Goal:** the whole path is proved in a browser and every document tells the truth about it
- **Depends on:** Phase 3
- **Covers:** FR-13, FR-14, NFR-2, NFR-4, NFR-6, AC-10, AC-11
- **Touches:** `e2e/journeys/crash.spec.ts`, `e2e/fixtures/game.ts`, `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`, `conductor/product.md`, `conductor/tech-stack.md`, `conductor/tracks/20261108-error-capture/verification/`
- **Verification:** `pnpm test:e2e && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P4.T1: A real crash, all the way to the file** - covers: AC-10, NFR-6
  - [ ] P4.T1.1 The journey boots the built artifact, throws from inside the page (`setTimeout(() => { throw ... })`, not a test hook), waits for the card, taps its published button or reloads after it, then opens Settings and saves diagnostics while watching the download
  - [ ] P4.T1.2 It reads the downloaded text back and asserts the thrown message and the environment header are present; it asserts the hub works after recovery
  - [ ] P4.T1.3 Runtime recorded and the suite total reported against the CI 5m28s breach
- [x] **P4.T2: Tell the truth in the documents** - covers: FR-14, FR-13, NFR-4, AC-11
  - [ ] P4.T2.1 `docs/TDD.md`: the crash path, the stored field, the recovery card and the diagnostics file, plus the journey and spec counts
  - [ ] P4.T2.2 `conductor/tech-stack.md`: a dated design-update entry for `Settings.diagnostics`, the bounded buffer and the enumerated guard widening
  - [ ] P4.T2.3 `conductor/product.md` §10.3: the `20261124-error-capture` row becomes Done with the clipboard-to-download deviation stated, and the metrics table's "uncaught errors" row says what the log now makes measurable rather than `unknown`
  - [ ] P4.T2.4 `README.md`: the parent-facing paragraph, and the shell entry size before and after this track
  - [ ] P4.T2.5 `grep` for `fetch(` in `src/`, and `package.json` diffed to prove no dependency was added

**Result:** verified - the crash path is proven in a browser and the two defects it found are fixed. A journey throws a real error, sees the card replace the broken scene, taps the point the card itself published, lets the card's own click reload the app, launches a game and reads the downloaded diagnostics file back from disk. Writing it exposed that recovery called `game.scene.start`, which Phaser 4's SceneManager does not have (a silent no-op, and a unit fake had invented the method), and that the card's hit target was an alpha-0 Arc, which Phaser never hit-tests. Both are fixed, the fake now has no `start` at all, and the card asserts its interactive kind by name. 21 journeys green in 4.0 minutes locally, 3,150 tests, coverage 97.38/91.97/96.36/98.33, shell entry 172.6 kB.
**Checkpoint:** 598518c4
**Evidence:** conductor/tracks/20261108-error-capture/verification/phase-4.md
## Phase R1: Review Fixes

- **Goal:** the card's button works on the second crash as well as the first, an error handler that cannot throw is true rather than intended, and the log's size ceiling is enforced by the code instead of by a fixture
- **Depends on:** Phase 4
- **Covers:** review findings F1-F10
- **Touches:** `src/utils/reload.ts`, `src/scenes/RecoverScene.ts`, `src/game/errorCapture.ts`, `src/utils/diagnostics.ts`, `src/components/SettingsPanel.ts`, `src/utils/backupFormat.ts`, their test files, `docs/TDD.md`, `conductor/tech-stack.md`, `conductor/product.md`, `README.md`, the track directory
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`, then `pnpm test:e2e`
- **Status:** in_progress

- [ ] **R1.T1: A reload that is not a loop guard** - covers: FR-6, FR-7, AC-5
  - [ ] R1.T1.1 Add `reloadPage()` to `src/utils/reload.ts` that reloads unconditionally, keeping `reloadOnce()` for the no-scene path only
  - [ ] R1.T1.2 The card calls `reloadPage()`, so a second crash in the same tab still leaves the screen
  - [ ] R1.T1.3 A test with the session flag already spent that asserts the card's tap still reaches `location.reload`
- [ ] **R1.T2: A handler that cannot throw** - covers: FR-1, FR-4
  - [ ] R1.T2.1 `recover()` inside the same `try` as the recording, so a destroyed game or a blocked location cannot throw out of the listener
  - [ ] R1.T2.2 Cases where `runningScene()` and `reload()` both throw, asserting the listener stays silent
- [ ] **R1.T3: A ceiling the code enforces** - covers: NFR-1, AC-2
  - [ ] R1.T3.1 `MAX_MESSAGE_CHARS` applied on write and on read, with the stored stack trimmed too
  - [ ] R1.T3.2 The ceiling test uses realistic message lengths and a large rejected object
- [ ] **R1.T4: The page says what it drew** - covers: FR-8, AC-7
  - [ ] R1.T4.1 The diagnostics row above the result line, as FR-8 says, with no wrap overlapping the card
  - [ ] R1.T4.2 Both `y` values asserted, and the two comments corrected
- [ ] **R1.T5: The documents describe the shipped code** - covers: FR-14
  - [ ] R1.T5.1 TDD §6.8: `scene.scene.start`, the `Zone`, and the ceiling wording
  - [ ] R1.T5.2 `tech-stack.md` and `product.md` wording, and the replace-erases-the-log behaviour named
- [ ] **R1.T6: Requirements that match the guard and the suite** - covers: FR-11, FR-12, AC-9, NFR-6
  - [ ] R1.T6.1 FR-11/FR-12/AC-9 amended to the two watched window members and to name `reload.ts`
  - [ ] R1.T6.2 NFR-6 amended to one spec file with two tests
  - [ ] R1.T6.3 The hit-area test asserts the recorded shape (72/72/72) rather than `expect.anything()`
- [ ] **R1.T7: Both suites** - covers: AC-10
  - [ ] R1.T7.1 Re-run the full chain and the browser suite

<!-- Review fixes are appended by conductor-review as:
## Phase R1: Review Fixes
- **Goal:** Resolve review findings ...
- **Touches:** ...
- **Verification:** ...
- **Status:** pending
- [ ] **R1.T1: Resolve <finding ID>** - covers: <AC>
-->

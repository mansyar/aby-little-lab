# Review: Docs & Roadmap Truth Pass

- **Track:** `20261022-docs-roadmap-truth`
- **Type:** chore
- **Branch:** `chore/20261022-docs-roadmap-truth`
- **Range:** `ab00187ed4a0ff6bd779ef9d9a33880f8c6b6b42..HEAD`
- **Date:** 2026-10-22
- **Verdict:** `PASS` (round 2 — round 1 returned PASS WITH FINDINGS; all six round-1 findings fixed in Phase R1, all five round-2 findings fixed in Phase R2)

## Summary

The track does what it promised, and does it with discipline. `src/`,
`package.json` and the lockfile are byte-identical to the base. The corrected
figures - the 22 games and their labels, the 53-key shell and the 12 lazy art
groups, the 202-SVG corpus, the 8/12/2 scene split, the 15-of-22 adaptive
split, the 22 audio identities, 118 files / 2,488 tests, the 134.6 kB shell,
42 chunks, 54 precache entries, PWA 16/16, the 10+10+2 Hub pages, the 6+6+6+4
Progress pages, 22 stickers at 22/30 px - all re-derive from the code. The dated
historical sections of the two checklists were supplemented rather than
rewritten, which is the right pattern for cumulative records, and the new
validator is standard-library-only, network-free and snapshot-free.

One real defect and five smaller ones. The Medium finding is in the guard
itself: **check 5 scans the inline-code-blanked text, so it cannot see the
backticked Conductor path references it exists to guard.** Every such reference
in this repository is written inside backticks, so the check currently passes
vacuously for the one invariant it was added to enforce - and it would have
passed vacuously when this track repaired the five broken paths. The five Low
findings are reader-facing figures that still contradict the code: a stale
"bob"/"breathe" split across three documents, a repository-hygiene paragraph
whose supporting claims are false, two figures in the new release notes, a
checklist row whose expected behaviour the code deliberately does not implement,
and a checklist gate list that omits the step this branch's own CI now runs.

The track's own rule - every figure is derived from the code or carries its
measurement date - is the standard these findings are held to, and it caught
five places where a document had drifted. The guard's own first run also found a
dead table-of-contents anchor in the TDD that nobody had written down.

## Verification

| Layer | Command | Result | Evidence |
|---|---|---|---|
| static | `pnpm check` | pass | 248 files, 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294`, `lint/style/noNonNullAssertion`), 1 pre-existing info (`biome.json:2:14`, `$schema` 2.5.5 against a 2.5.10 CLI). No new finding, including in `scripts/validate-docs.js`. |
| static | `pnpm typecheck` | pass | `tsc --noEmit` clean. |
| unit | `pnpm test -- --run --maxWorkers=1` | pass | 118 test files, 2,488 tests, 0 failed (432.11 s). |
| coverage | `pnpm test:coverage` | pass (recorded) | Statements 97.92 / branches 91.62 / functions 96.58 / lines 98.69 against the 90 / 85 / 88 / 95 gates. |
| build | `pnpm build` | pass | 325 modules, 42 JS chunks, shell `index-BrQ7goBH.js` 137.79 kB (31.53 kB gzip), Phaser 1,374.82 kB, 54 precache entries (1,707.70 KiB). |
| build-artifact | `node scripts/validate-bundle.js` | pass | `PASS: Phaser vendor chunk present`; `PASS: shell entry index-BrQ7goBH.js = 134.6 kB (<= 200 kB)`. |
| build-artifact | `node scripts/validate-pwa.js` | pass | `Results: 16 passed, 0 failed`; 42 chunks, 42 precached; no Ligne asset or WASM. |
| documents | `node scripts/validate-docs.js` | pass (recorded) | `Results: 5 passed, 0 failed`. The reviewer reviewed the script statically rather than running it (it is not on the reviewer's permitted command list). The finding below is that this very check is weaker than it claims. |
| scope | `git diff ab00187..HEAD -- src/ package.json pnpm-lock.yaml` | pass | Empty. |

The plain `pnpm test -- --run` form times out on this loaded machine in files
the track does not touch. `src/` is byte-identical to the base, so no test
outcome can have changed; `--maxWorkers=1` is the stabilised form under the
workflow's fallback ladder.

## Requirements

| ID | Implemented by | Verified by | Status |
|---|---|---|---|
| FR-1 | P1.T2 (`docs/PRD.md`), P1.T3 (`docs/TDD.md`) | Re-derived from the code: `PreloadScene.SHELL_ASSETS` = 53 keys (pinned by `shellOwnership.test.ts`); `src/game/art/types.ts` = 12 groups / 131 keys / 125 game-only; 202 SVGs; 8 `GameSceneBase` / 12 `ChoiceRoundScene` / 2 via `GroupMathScene`; 15 adaptive games and 7 fixed; 22 identities with a 0.3-0.8 s win budget; the TDD's §2.2 tree matching the filesystem file-for-file. | covered |
| FR-2 | P2.T1, P2.T3, P3.T2, P3.T3, P3.T4, R1.T2, R1.T3, R1.T4, R1.T5, R1.T6, R2.T1, R2.T4 | The README's suite figures, scene tree, file trees, 24-row Releases table and 24-link Documentation index; the collapsed Game 20 entry; the perf baseline's dated 2026-10-22 re-measurement; the refreshed checklist gates, the deleted obsolete DRAFT block and the three repaired paths. The round-1 residuals (F2-F6) and the round-2 residuals (F1-F5) are all corrected; the primary's own correction fixed the last rasterisation claim in `docs/SVG_STYLE.md:5`. | covered |
| FR-3 | P1.T1 (`docs/roadmap.md`), P2.T1, P3.T2 | `docs/roadmap.md` carries exactly two `##` sections - Known Issues and Future Work / Roadmap - and the README carries six one-line bullets that link to it rather than copy it. | covered |
| FR-4 | P2.T2 (`docs/release-notes-v1.21.0.md`) | The Unreleased banner, one `### PR #48` ... `### PR #55` entry each in merge order cross-checked against the archived track specs, the v1.20.0 Known Issues dispositioned bullet by bullet, `package.json` still `1.20.0` and no `v1.21.0` tag. | covered |
| FR-5 | P4.T1 (`scripts/validate-docs.js`), P4.T3 (CI, `workflow.md`, TDD §11.3, README), R1.T1, R2.T5 | All lines read: standard library only, no network, no snapshot value. Checks 1-4 implemented correctly. Check 5 now reads the backticked Conductor paths it exists to guard - the round-1 gap - and the path part is optional as of Phase R2, so a bare directory reference is seen too. The primary reproduced the drift independently: a backticked path that exists nowhere exits 1 with a per-failure report, a path that exists only under `conductor/archive/` still resolves through the deliberate fallback, and the clean tree exits 0. | covered |
| NFR-1 | no `src/` change in any phase | `git diff ab00187..HEAD -- src/` is empty; the only new executable artefact is `scripts/validate-docs.js`, which ships in no bundle. | covered |
| NFR-2 | - | `package.json` and `pnpm-lock.yaml` unchanged; the script is an ES module matching `validate-bundle.js` and imports only `node:fs`, `node:path`, `node:url`. | covered |
| NFR-3 | all four phases | Every gate segment exits 0; the two pre-existing Biome items are unchanged and outside every phase's `Touches`. | covered |
| NFR-4 | P1.T4 and P3.T1 fact tables, R1 and R2 | Every corrected figure re-derives from the code or carries its measurement date; the 40.7 MiB boot-raster figure was removed rather than restated. The round-1 exceptions (F2-F6) and the round-2 exceptions (F1-F5) are all corrected, and the `docs/SVG_STYLE.md` canvas contract now names the tiers instead of the removed uniform-512 rule. | covered |
| NFR-5 | P2.T1, P2.T2, P3.* | The PRD and TDD stay technical, the release notes stay parent-facing, and no child-facing copy changed (no `src/` change). | covered |
| NFR-6 | P4.T1 | The validator contains no test count, bundle size, chunk count or precache count; its five checks are structural. | covered |
| NFR-7 | P4.T1 | No network import anywhere in the script. | covered |
| AC-1 | P1.T2 | `docs/PRD.md` §7.1-§7.3 describe the 53-key shell, the 12 groups / 131 keys / 125 game-only, the 202-SVG corpus and Story Order's 24 panels; the 21 §3.x art lines name the lazy art group. | covered |
| AC-2 | P1.T3 | `docs/TDD.md` §2.1-§2.2 match the filesystem file-for-file, including `art/` (16), `hub/` (6), `audioIdentity.ts` and `dragBoard.ts`; §10.2 reads "118 test files, 2,488 tests (verified 2026-10-22)". | covered |
| AC-3 | P1.T2, P1.T3 | The per-game audio identity is described in PRD §6.1 and TDD §8.7 and matches `src/game/audioIdentity.ts`; TDD §4.5's game-to-base table and §7.3's six shift strategies match the code. | covered |
| AC-4 | P2.T1, P3.T2, P3.T3, P3.T4, R1.T2, R1.T3, R1.T4, R1.T5, R1.T6, R2.T1, R2.T3, R2.T4 | The game, page, sticker, chunk, precache and PWA-check arithmetic all re-derives, and the last two path references the review found - the TDD's script tree and its CI step list - now name the document validator. The round-1 and round-2 residuals are all closed. | covered |
| AC-5 | P1.T1, P2.T1, P3.T2 | As FR-3: two sections, the four links plus the README's own, and no second copy of either list. | covered |
| AC-6 | P2.T2 | As FR-4. | covered |
| AC-7 | P4.T1, P4.T2, P4.T3, R1.T1, R2.T5 | The CI step and the `verify_phase` wiring are present by reading. Five deliberate drifts now each produce a non-zero exit and a per-failure report and are reverted - the three from Phase 4, the backticked-path one from Phase R1 and the slash-less one from Phase R2 - and the primary reproduced the Phase R1 drift independently, outside the phase agent's helper. | covered |
| AC-8 | all four phases | Every segment the reviewer could run exits 0; the integrated run in `verification/integrated.md` records all eight, including `validate-docs`. | covered |

## Findings

### Critical

None.

### High

None.

### Medium

#### F1 - The validator's Conductor-path check scans the inline-code-blanked text, so it cannot see the paths it exists to guard

- **File:** `scripts/validate-docs.js`, lines 416-434 (with `:71`)
- **What:** `checkConductorPaths()` iterates `renderedLines(file)`, and
  `renderedLines` blanks inline code spans
  (`line.replace(/`[^`]*`/g, "")`, line 71) before `CONDUCTOR_PATH_RE` runs.
  Every `conductor/tracks/...` / `conductor/archive/...` reference in the
  documents is written inside backticks - `docs/release-checklist.md:21, 23,
  30, 32, 43, 49, 56, 62, 81-88`, `docs/device-testing-checklist.md:11-18, 27,
  35, 42, 56, 65, 74, 160`, `docs/perf-baseline.md:233` - so the path text is
  removed before the regex ever sees it. The only reference check 5 can
  currently see is the link *target* in `docs/TDD.md:1058`, which check 2
  resolves anyway. The script's header comment (lines 8-10) and the
  `CONDUCTOR_PATH_RE` comment ("A Conductor path anywhere in the prose") both
  promise more than the implementation delivers.
- **Why:** FR-5 states the guard asserts "no document references a nonexistent
  `conductor/tracks/` path". The five broken references this track repaired
  are all backticked, so reintroducing any of them - or adding a new broken one -
  leaves the validator printing "5 passed, 0 failed". The invariant is
  unenforced for the only form it takes in this repository. A guard that passes
  vacuously is worse than no guard: it teaches the reader to trust a check that
  does not run.
- **Fix:** Give check 5 a scan that keeps inline code - a helper that returns
  the raw lines with fenced-block lines nulled but inline spans left intact -
  and iterate that instead of `renderedLines()`. All the archive ids the
  documents reference exist under `conductor/archive/`, so the current tree
  still passes. Then add a fourth deliberate-drift case to the validator's own
  proof: reintroduce `conductor/tracks/release-1.1.0-mechanics_20260802/` in
  `docs/release-checklist.md` and assert a non-zero exit.
- **Requirement:** FR-5, AC-7
- **Test gap:** The drift proof covers a broken link, an unlinked release note
  and a renamed PRD heading. It needs a fourth case: a backticked
  `conductor/tracks/...` path in `docs/` must exit non-zero.

### Low

#### F2 - The release checklist's gate rows are out of date: the CI step list omits `validate-docs`, and the Biome file count is one short

- **File:** `docs/release-checklist.md`, lines 6-19 and the Step 2 fence at 181-197
- **What:** Line 19 (written by this track) says "The **Quality Gates** job now
  runs seven steps - `pnpm run check` -> `pnpm run typecheck` -> `CI=true pnpm
  test` -> `pnpm run build` -> `node scripts/validate-bundle.js` ->
  `node scripts/validate-pwa.js` -> the boot smoke check".
  `.github/workflows/ci.yml`, changed by this same track, runs eight: it adds
  `Document validation: node scripts/validate-docs.js` (ci.yml:54-55) between
  the PWA and boot-time steps. The §1 Code Quality Gates list (lines 6-15) has
  no row for `validate-docs` at all, and the Step 2 "Final Testing" fence
  (lines 181-197), headed "CI enforces the same steps", omits it too. Line 6
  also says "biome clean (247 files)": `biome.json` includes
  `scripts/**/*.js`, and the tree now checks 248 files - the 247 figure
  predates `scripts/validate-docs.js`.
- **Why:** A release manager following the checklist would not run the document
  gate that this branch's CI enforces, and the checklist contradicts both
  `ci.yml` and `README.md:175` (which does list `validate-docs`) in the same
  change. The 247 figure is one this track re-derived at review time and then
  invalidated in its own later phase.
- **Fix:** Add a `- [x] Run node scripts/validate-docs.js (documents agree with
  the code) - 2026-10-22: PASS` row to §1, change "seven steps" to "eight
  steps" on line 19 and insert `-> node scripts/validate-docs.js` after
  `node scripts/validate-pwa.js`, add the same command to the Step 2 fence, and
  change "247 files" to "248 files" on line 6.
- **Requirement:** FR-5, AC-4
- **Test gap:** none

#### F3 - The PRD still says the idle tiles "bob" while the README says they "breathe" and the code says the motion is scale-only

- **File:** `docs/PRD.md:486` (with `docs/release-checklist.md:129` and
  `docs/device-testing-checklist.md:270`)
- **What:** `docs/PRD.md:486` reads "...while idle tiles bob on a 2.5 second
  loop with four low-contrast dots drifting behind the grid".
  `src/game/hub/hubGridConstants.ts:39-44` says the opposite in as many
  words: "Gentle scale \"breathe\" pulse for idle tiles (1 = none). Scale-only
  motion keeps icon/label/shelf geometry fixed, unlike a vertical bob ...",
  with `BOB_AMPLITUDE = 1.025`. `README.md:134`, rewritten by this track, reads
  "breathing while idle (a gentle 2.5% scale pulse, not a vertical bob)". The
  two checklist rows repeat the stale wording: `docs/release-checklist.md:129`
  ("Tiles bob gently on a 2.5s idle loop - validated") and
  `docs/device-testing-checklist.md:270` ("Tiles gently bob on an idle loop
  after entering"). The mascot's own bob at
  `docs/device-testing-checklist.md:279` is a different animation and is
  correct.
- **Why:** Before this diff the README and the PRD agreed; the track corrected
  one and left the other, so two documents now describe the same animation
  differently and one contradicts the code and its own inline comment. That is
  exactly the class of disagreement this track exists to remove.
- **Fix:** In `docs/PRD.md:486` replace "idle tiles bob on a 2.5 second loop"
  with "idle tiles breathe on a 2.5 second loop (a 2.5% scale pulse, not a
  vertical bob)"; in `docs/release-checklist.md:129` and
  `docs/device-testing-checklist.md:270` change "bob" to "breathe" (or "scale
  pulse") so all three match `README.md:134` and the code.
- **Requirement:** FR-1, FR-2, AC-4
- **Test gap:** none

#### F4 - The roadmap's repository-hygiene entry makes claims about the contact-sheet PNGs that are false and unverifiable

- **File:** `docs/roadmap.md`, lines 86-95
- **What:** The paragraph says the `.gitignore` rule
  `docs/svg-contact-sheets/*.png` "matches only the root of that folder, where
  there are no PNGs at all", that "the twelve sheets in each of the ten
  subfolders are tracked in full, including the nine whose own comment calls
  them regenerated", and that a reader "gets a hundred and twenty PNGs back".
  Verified against the tree: **110** PNGs are tracked, not 120 (eleven in each
  of the ten subfolders, plus 122 tracked HTML files); the root of the folder
  holds twelve PNGs, and those are exactly the ones the ignore rule matches -
  they are untracked and ignored (`git status --ignored --short` lists
  precisely those twelve as `!!`), while gitignore's `*` does not cross `/`,
  so the subfolder sheets stay tracked; and no contact-sheet file carries a
  comment calling it regenerated - the "Regenerated contact-sheet PNGs are
  scratch" comment is in `.gitignore:16-17`.
- **Why:** The track's own rule is that every claim in a document must be
  derivable at review time. These clauses are not, and the first one
  materially mis-describes *why* the ignore rule fails to cover the
  subfolders - which is the entire point of the Known Issue. A reader who
  checked would find the stated reason false.
- **Fix:** Rewrite the sentence as: "110 PNGs under `docs/svg-contact-sheets/`
  are tracked in its ten subfolders (eleven each, with 122 HTML contact sheets
  beside them); the `.gitignore` rule `docs/svg-contact-sheets/*.png` matches
  only the twelve PNGs at the folder's root - and gitignore's `*` does not
  cross `/`, so the subfolder sheets stay tracked even though the rule declares
  the regenerated sheets to be scratch" - and drop the "nine whose own comment"
  clause.
- **Requirement:** NFR-4, AC-4
- **Test gap:** none

#### F5 - Two figures in the PR #49 entry contradict the code: the SVG grouping and the first-tap cost

- **File:** `docs/release-notes-v1.21.0.md`, lines 52-57
- **What:** Line 52 reads "The suite's 202 SVGs are grouped into 12 lazy art
  groups." The 12 lazy art groups hold 131 keys over 131 files; the other 71
  of the 202 files are the 47 boot-set files plus Story Order's 24 panels,
  which travel in the game chunk rather than in a lazy art group - the same
  track's own `conductor/product.md` entry carries the correct parenthetical
  ("12 art groups (131 keys, 125 of them game-only)"). Lines 56-57 read "The
  worst measured first-tap cost is 82 ms against a 400 ms budget." The 82 ms
  is the *increment* the shell-diet track measured against a built pre-track
  baseline (`f377bf8`); the 2026-10-22 absolute cold-first-tap measurement is
  351-392 ms median and 462-640 ms worst, so the 400 ms budget is not met -
  as `README.md:158` and `docs/perf-baseline.md:367` both state plainly. This
  track corrected exactly this misreading in the README (task P4.T4) but not in
  the release notes it wrote in Phase 2.
- **Why:** This is the parent-facing document, and the two sentences as
  written tell a reader that all 202 illustrations sit in the 12 lazy groups
  and that a cold first tap costs 82 ms - both false against the code, and both
  corrected elsewhere in the same track.
- **Fix:** Change line 52 to "The suite's 202 SVGs are grouped into 12 lazy art
  groups (131 keys, 125 of them game-only)"; change lines 56-57 to "The worst
  measured first-tap *increment* on the 2026-10-20 run was 82 ms against a
  400 ms budget - the absolute cold-first-tap cost measured on 2026-10-22 was
  351-640 ms, so the budget is not demonstrated (see `docs/perf-baseline.md`)."
- **Requirement:** FR-4, NFR-4, AC-6
- **Test gap:** none

#### F6 - The new Learning Progress row expects the chevrons to "wrap around"; the code dims them at the first and last page

- **File:** `docs/device-testing-checklist.md:480`
- **What:** The row added by this track reads "... the footer counts the pages
  (1 / 4 ... 4 / 4) and the chevrons wrap around". The footer format is right
  (`src/components/settings/ProgressOverlay.ts:241` renders
  `${this.page + 1} / ${pageCount}` over four pages of 6 + 6 + 6 + 4 with
  `PROGRESS_PAGE_SIZE = 6`), but the chevrons do not wrap:
  `ProgressOverlay.ts:255-280` computes
  `enabled = delta < 0 ? this.page > 0 : this.page + 1 < pageCount`, styles the
  chevron in `DISABLED_COLOR` at the edge, and its pointerdown handler returns
  without paging when `nextPage < 0 || nextPage >= pageCount`. The code's own
  comment says "The handler stays registered at the bounds but no-ops, so the
  affordance never disappears while the dimmed styling signals that the edge is
  reached."
- **Why:** This is a device-test row written to state the expected behaviour. A
  tester following it literally will record a defect for a deliberate,
  documented design (the edge chevron is dimmed, not wrapped), which puts a
  false bug into the very device pass the roadmap lists as its first future
  item.
- **Fix:** Change the tail of `docs/device-testing-checklist.md:480` to
  "... the footer counts the pages (1 / 4 ... 4 / 4) and the chevrons step one
  page at a time, dimming at the first and last page rather than wrapping".
- **Requirement:** FR-2, NFR-4, AC-4
- **Test gap:** none

## Round 2

The round-2 review re-read the Phase R1 diff (`095256f..HEAD`) and confirmed
that **all six round-1 findings are genuinely fixed**, each for the right
reason and not by suppressing the check:

- **F1 (round 1)** — `scripts/validate-docs.js` now has `unfencedLines()`
  (fenced code blocks nulled, inline spans intact) with `renderedLines()`
  layered on top of it, so the link check is byte-identical and the
  Conductor-path check can finally read the backticked paths every document
  writes. A backticked path that exists nowhere exits 1 with a per-failure
  report; the archive fallback still resolves a path whose track has been
  archived, which is load-bearing for `conductor/tech-stack.md:393`.
- **F2 (round 1)** — the release checklist's gate list now has the
  `validate-docs` row and says "eight steps", matching `ci.yml`.
- **F3 (round 1)** — "breathe", not "bob", in the three idle-tile descriptions,
  with the mascot's own bob left alone.
- **F4 (round 1)** — the roadmap's repository-hygiene paragraph now matches the
  tree: 110 tracked PNGs, 122 tracked HTML sheets, twelve ignored root PNGs,
  and the "regenerated" comment living in `.gitignore`.
- **F5 (round 1)** — the release notes name the 82 ms as an increment over the
  built `f377bf8` baseline and the absolute 2026-10-22 measurement beside it.
- **F6 (round 1)** — the Learning Progress row no longer expects the chevrons
  to wrap.

Round 2 raised **five Low findings**, no Critical, no High, no Medium. All
five are fixed in Phase R2.

### Round 2 findings

#### F1 (Low) - The release checklist's gate list has no `typecheck` row

- **File:** `docs/release-checklist.md:6-16`
- **What:** §1 "Code Quality Gates" lists `pnpm check`, the tests, the coverage
  gates, the build, `validate-bundle.js`, `validate-pwa.js`,
  `validate-docs.js` and the boot smoke check - but no `pnpm typecheck`, even
  though the CI sentence a few lines below names `pnpm run typecheck` as the
  second of the eight gate commands and the Step 2 command fence runs it.
- **Why:** the checklist is the list a release manager follows; a gate CI
  enforces is missing from it.
- **Fix:** add the row in CI order with the measured result. **Fixed in Phase
  R2** (`docs/release-checklist.md:7`): "- [x] Run `pnpm typecheck` (TypeScript
  type check, `tsc --noEmit`) - **2026-10-22:** PASS (no diagnostics)". No
  historical v1.1.0 comparison was written, because no typecheck figure from
  that run exists anywhere in the repository and none was invented.
- **Requirement:** FR-2, NFR-4, AC-4
- **Test gap:** none

#### F2 (Low) - The TDD's script tree omits the document validator

- **File:** `docs/TDD.md:149-154` (the finding cited §2.2; the only `scripts/`
  tree in the document is in §2.1 - the root tree - and that is the one
  corrected)
- **What:** the tree lists five scripts and not `validate-docs.js`, which this
  track added, so a reader looking for the validator the TDD describes in
  §11.3 cannot find it.
- **Why:** §2.1 is the tree the TDD claims to list.
- **Fix:** add `validate-docs.js` to the tree, in the tree's existing order.
  **Fixed in Phase R2** (`docs/TDD.md:153`): it sits with the other three
  `validate-*.js` scripts, before the two `.mjs` helpers.
- **Requirement:** FR-1, NFR-4, AC-2
- **Test gap:** none

#### F3 (Low) - The TDD's CI step list omits the document validator

- **File:** `docs/TDD.md:1036`
- **What:** the §11.4 `Quality Gates` row lists the commands CI runs and stops
  at `node scripts/validate-pwa.js` before the boot check, while `ci.yml` runs
  `node scripts/validate-docs.js` between them.
- **Why:** the TDD's record of CI contradicts the workflow it documents.
- **Fix:** insert the command in the position `ci.yml` uses. **Fixed in Phase
  R2** (`docs/TDD.md:1037`): `validate-pwa` -> `validate-docs` -> the boot
  check, read from `ci.yml`, not assumed.
- **Requirement:** FR-1, NFR-4, AC-2
- **Test gap:** none

#### F4 (Low) - `docs/SVG_STYLE.md`'s asset inventory is stale

- **File:** `docs/SVG_STYLE.md:3, 119-135`
- **What:** the document says "All 176 SVGs" and "176 SVGs, all texture keys",
  gives `stickers/` 21 and `ui/tiles/` 20, has no `stories/` row, and names 11
  contact-sheet categories while the folder's root carries 12 sheets.
- **Why:** after Phase 1 corrected the release notes to a 202-SVG corpus, this
  governed document still said 176 - the same class of doc-versus-code
  contradiction the track exists to remove.
- **Fix:** restate §8 from the tree. **Fixed in Phase R2** (`docs/SVG_STYLE.md`
  lines 3, 119, 130, 131, 134, 136): 202 SVGs, `stickers/` 22, a new
  `stories/` row of 24 (`story_*` panels), `ui/tiles/` 21, and twelve
  contact-sheet categories naming `stories`.
- **Requirement:** FR-1, NFR-4, AC-1, AC-4
- **Test gap:** none

#### F5 (Low) - The Conductor-path check needs a trailing slash

- **File:** `scripts/validate-docs.js:47`
- **What:** `CONDUCTOR_PATH_RE` was
  `/(?:[A-Za-z0-9_.-]+\/)*conductor\/(?:tracks|archive)\/[^\s`<>()[\]"',;|!?]*/g`
  - the `/` after `tracks`/`archive` is required, so a reference to one of
  the directories on its own is invisible to the check.
- **Why:** FR-5's invariant was enforced only for the slash-terminated
  spelling.
- **Fix:** make the path part optional. **Fixed in Phase R2**
  (`scripts/validate-docs.js:55`), with the greedy optional group, the
  `isTemplate` skip, the trailing `[.:]+` strip and the archive fallback all
  unchanged.
- **Requirement:** FR-5, AC-7
- **Test gap:** none
- **Note:** the phase measured the finding's premise and found it partly
  mistaken - the mandatory `/` sits between `tracks` and the track id, so a
  path written *without* a trailing slash (`conductor/tracks/<id>`) already
  matched. The fix is still strictly broader (a bare `conductor/tracks` or
  `conductor/archive` is now matched and resolved, and both are real
  directories, so no false positive), and the required drift proof holds: a
  path that exists under neither directory exits 1 with a per-failure report.

### One correction the primary made

Verifying Phase R2, the primary found a residual contradiction of the same
class in a file the phase already touched: `docs/SVG_STYLE.md:5` still said
every SVG is "rasterized at 512px by the game (`SVG_RASTER_SIZE` in
`PreloadScene.ts`)". That symbol no longer exists - the uniform 512 px
rasterisation was replaced by the icon 160 / card 256 / hero 512 tiers in
`src/utils/textureTiers.ts`. AC-4 forbids a document pointing at something the
repository contradicts, and the file was inside Phase R2's `Touches`, so the
primary corrected the sentence as part of the phase acceptance. The
`docs/perf-baseline.md` record of 2026-10-17 keeps its own dated wording and
its supersede note, and `src/utils/textureTiers.ts` keeps its historical doc
comment; neither was touched.

## Overrides

None. The project's `review.strict` is `true`, so every finding above is fixed
in Phase R1 (round 1) and Phase R2 (round 2) rather than filed or deferred.

## Plan compliance

All four phases are accounted for, in order, with their own checkpoints and
evidence files:

| Phase | Checkpoint | Evidence |
|---|---|---|
| 1 - The Technical Docs | `abd1272` | `verification/phase-1.md` |
| 2 - The Reader-Facing Docs | `18884a6` | `verification/phase-2.md` |
| 3 - The Checklists and the Perf Baseline | `3683c13` | `verification/phase-3.md` |
| 4 - The Guard | `25b26ec` | `verification/phase-4.md` |
| R1 - Review Fixes (round 1) | `f0227f3` | `verification/phase-R1.md` |
| R2 - Review Fixes (round 2) | see `plan.md` | `verification/phase-R2.md` |

Every task in `plan.md` was implemented and verified; none was dropped. The
diff stays inside each phase's `Touches` except for the deviations recorded in
the phase evidence and summarised in `verification/integrated.md` (the
`--maxWorkers=1` test form, the git-plumbing edits where the agent's `edit`
permission denied `conductor/**`, the `src/types`-style comment-only fixes,
and the two primary corrections to `conductor/workflow.md` and
`conductor/product.md`). The integrated run in `verification/integrated.md`
records all eight gate segments, including the new `validate-docs` step,
exiting 0.

## Out of scope

- The version bump and the `v1.21.0` tag - human release decisions under
  `conductor/workflow.md` § Release & deployment.
- The real-device pass - the first entry in `docs/roadmap.md`.
- The seven standing engineering debts the roadmap lists (the seven fixed
  games, the three hand-rolled drag games, the storage port and schema
  version, the install prompt, the chunk-load failure path, the play-time
  banking, the five `shuffle` copies) - each is a separate track.
- `src/game/wordLogic.ts`'s stale comment about prompt textures being
  `PreloadScene` keys - outside the track's `Touches`.

## Debt

None deferred. Eleven findings across two rounds: one Medium and ten Low, all
fixed. Round 1's findings were grouped into one fix phase because each is a
single-line or single-paragraph correction in a document, and because the
Medium finding (F1) must be fixed in the same phase so the guard's own drift
proof can be extended in the same run. Round 2's five Low findings were
grouped for the same reason, and because F5's regex change had to land in the
same phase as its own drift proof.

## Doc sync

`updated` - the post-review documentation sync ran after Phase R2 and covered:

- `docs/PRD.md` §4.8 and §5.6 and `docs/TDD.md` §4.5, §7.3, §9.3 and §10 -
  rewritten for the abandoned-session flush, the per-game audio identity, the
  `onWrong` ordering, the idle-tile "breathe" wording and the suite figures.
- `docs/release-checklist.md` - the gate list now carries all eight CI steps
  (including `pnpm typecheck` and `validate-docs`), the Biome file count, the
  "breathe" wording, and the three broken Conductor paths repaired.
- `docs/device-testing-checklist.md` - the sticker and page arithmetic, the
  rows for Games 21 and 22, everything shipped after 2026-10-20, the
  "breathe" wording, the chevron behaviour, and the three broken paths
  repaired.
- `docs/roadmap.md` - the nine Known Issues and the Future Work list, with
  the repository-hygiene entry corrected against the tree.
- `docs/release-notes-v1.21.0.md` - the eight unnoted tracks, the v1.20.0
  Known Issues disposition, the art-group counts and the first-tap figures.
- `docs/SVG_STYLE.md` - the asset inventory restated from the tree, and the
  canvas contract's rasterisation rule corrected from the uniform 512 px to
  the icon 160 / card 256 / hero 512 tiers.
- `docs/TDD.md` §2.1 and §11.4 - the script tree and the CI step list now
  include the document validator.
- `conductor/product.md` §3.1 - the game-6 label aligned with the shipped
  label, the duplicate Game 20 changelog entry collapsed, and the changelog
  continued for the eight tracks.
- `README.md` - the suite and build figures, the scene hierarchy, the file
  lists, the Releases table, the Documentation index, the naming and anchor
  links, a compact Known Issues section, and the cold first-tap sentence
  corrected to name the 82 ms as an increment.

No second copy of the Known Issues list exists: `docs/roadmap.md` is the
single home, and the README, PRD, TDD and perf baseline link to it.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
|---|---|---|---|---|---|---|
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 5 | 0 |
| 2 | PASS | 0 | 0 | 0 | 5 | 11 |

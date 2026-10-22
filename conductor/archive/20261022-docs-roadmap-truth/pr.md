# Pull Request: Docs & Roadmap Truth Pass

- **Track:** `20261022-docs-roadmap-truth`
- **Branch:** `chore/20261022-docs-roadmap-truth` -> `master`
- **Base:** `master` @ `ab00187ed4a0ff6bd779ef9d9a33880f8c6b6b42`
- **Type:** chore
- **Priority:** high
- **Review:** PASS (round 2; round 1 returned PASS WITH FINDINGS)

## What this changes

This is a documentation track. **No file under `src/` changed**, `package.json`
and the lockfile are untouched, no dependency was added, no network access was
introduced, and the app stays offline-first. The only new executable artefact
is `scripts/validate-docs.js`, a Node script that ships in no bundle.

### The documents now describe the shipped app

The PRD and the TDD still described a pre-shell-diet product: a 178-entry boot
set, a 195.4 kB shell, a source tree missing more than twenty-five files, and
an audio chapter that predated the per-game sonic identity. Both were rebuilt
against figures re-derived from the code - the 53-key shell, 125 game art keys
in 12 lazy groups, the 202-SVG corpus, the 8/12/2 scene inheritance, the 15
adaptive games and 7 fixed ones, 22 audio identities with a 0.3-0.8 s win
budget.

The reader-facing documents followed: the README's suite and build figures, its
scene hierarchy and file lists, a 24-row Releases table, a Documentation index
covering every release note on disk, and a cold first-tap sentence that had
been calling an *increment* an absolute cost.

Both checklists carried the seven-game-era arithmetic (13 PWA checks instead of
16, 19 precache entries instead of 54, seven Back buttons instead of 22) and
pointed at three Conductor paths that no longer exist. The perf baseline's cold
boot predated four tracks, and the v1.20.0 release notes carried a Known Issues
bullet that was false.

### Two new documents

- **`docs/roadmap.md`** - the single home for nine standing Known Issues and the
  Future Work list. Each entry gives the symptom, the file it lives in, and
  how a reader would notice it. The README carries a compact six-bullet
  summary that links here; there is no second copy.
- **`docs/release-notes-v1.21.0.md`** - an *Unreleased* document covering the
  eight tracks merged since v1.20.0 (PRs #48-#55), with the v1.20.0 Known
  Issues dispositioned bullet by bullet. `package.json` still reads `1.20.0`
  and no `v1.21.0` tag exists - the version bump and the tag are human release
  decisions.

### The guard

`scripts/validate-docs.js` asserts the **durable invariants** between the
documents and the code, never a snapshot: the release-note index is complete,
every relative link resolves and every anchor matches a heading, the README,
the PRD and the TDD agree with `GAME_REGISTRY`, the roadmap carries both of its
sections, and no document points at a Conductor path that does not exist. It
uses only the Node standard library, needs no network, and exits non-zero with
a per-failure report.

It is wired into the CI `Quality Gates` job and into `verify_phase`. It found
a real defect on its first run - a dead table-of-contents anchor in the TDD.

## Verification

| Layer | Command | Result |
|---|---|---|
| static | `pnpm check` | 248 files, no fixes. 1 pre-existing warning and 1 pre-existing schema info, both outside this diff. |
| static | `pnpm typecheck` | clean |
| unit | `pnpm test -- --run --maxWorkers=1` | 118 files, 2,488 tests, 0 failed |
| coverage | `pnpm test:coverage -- --maxWorkers=1` | statements 97.9 %, branches 91.55 %, functions 96.58 %, lines 98.69 % (gates 90 / 85 / 88 / 95) |
| build | `pnpm build` | 325 modules, 42 chunks, shell 137.79 kB, Phaser 1,374.82 kB, 54 precache entries |
| build-artifact | `node scripts/validate-bundle.js` | shell 134.6 kB <= 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |
| smoke | `node scripts/validate-boot.js` | median boot 1.25 s over 3 cold loads (<= 3.0 s budget) |

`--maxWorkers=1` is the stabilised form for the test layers on a loaded
machine; the plain form times out in files this track does not touch. No test
was edited to work around a timeout, and `src/` is byte-identical to the base.

## Review

Two rounds.

**Round 1 - PASS WITH FINDINGS (1 Medium, 5 Low).** The Medium was the
important one: the guard's own fifth check scanned text with inline code spans
blanked, so it could not see the backticked `conductor/tracks/...` references
every document actually writes - the check passed vacuously. A new
`unfencedLines()` helper fixed it (fenced blocks nulled, inline spans intact),
with `renderedLines()` layered on top so the link check is byte-identical. The
five Low findings were reader-facing figure defects.

**Round 2 - PASS WITH FINDINGS (5 Low), all closed.** A missing `pnpm
typecheck` row, a TDD script tree and CI step list that both omitted the new
validator, a stale 176-SVG inventory in `docs/SVG_STYLE.md`, and a Conductor
path regex that required a trailing slash. One of the five rested on a partly
mistaken premise; the phase measured that rather than assuming it, and
recorded the correction in its evidence.

The final verdict is **PASS**.

## Notes for the reviewer

- Every corrected figure is either derived from the code or carries the date it
  was measured. A figure that was neither was removed rather than restated.
- The dated historical sections in the checklists and the perf baseline were
  supplemented, not rewritten - a record that was true on its date stays true
  on its date. The one exception is a path that no longer exists, which was
  repaired.
- The validator deliberately gates on no volatile number: not the test count,
  not the shell size, not the chunk count, not the precache count. Adding a
  test or a game will not fail CI before the documents have caught up.
- The archive fallback in the Conductor-path check is load-bearing: a document
  naming a track that has since been archived still resolves. It was not
  tightened.
- The version bump, the `v1.21.0` tag and the real-device pass are outside
  this track by design.

# Implementation Plan: Repository Hygiene

Branch: `chore/20261024-repo-hygiene`
Base: `master` @ `97234c3c`

> Only the primary agent writes this file. A phase executor records its work in
> `verification/phase-<n>.md` and reports back; it never edits `plan.md`.

## Phase 1: The index holds the baseline, and the rule says so

**Goal:** Stop tracking the 210 regenerated contact-sheet files outside
`baseline/`, and make `.gitignore` match, at any depth, the intent its comment
already states.

**Depends on:** none

**Covers:** FR-1, FR-2, FR-3, AC-1, AC-2, AC-3

**Touches:** `.gitignore`, `docs/svg-contact-sheets/**`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** verified

- [x] **P1.T1: A rule that matches the comment** - covers: FR-2
  - [x] **P1.T1.1:** Replaced the single `docs/svg-contact-sheets/*.png` line with the four depth-independent patterns (`**/*.png`, `**/*.html` and the two `!...baseline/**` re-includes) and rewrote the comment to name both extensions and the baseline as the tracked record. No other rule touched, and no `.opencode/` rule added.
  - [x] **P1.T1.2:** Proved the set with `git check-ignore --no-index -v`: `final/animals.png` -> `.gitignore:18`, `animals.html` -> `:19`, and both `baseline/` paths -> the `:20`/`:21` negations, i.e. re-included. `--no-index` was required because git consults the index by default and every probe path was still tracked. Cross-checked with `git ls-files -i -c --exclude-standard`: 210 matched, 0 under `baseline/`.
- [x] **P1.T2: Untrack the regenerated sheets, keep the files** - covers: FR-1
  - [x] **P1.T2.1:** `git rm --cached -r -q -- docs/svg-contact-sheets ":(exclude)docs/svg-contact-sheets/baseline"` exited 0: 210 staged `D ` deletions (99 PNG + 111 HTML), zero worktree ` D ` entries. The exclude pathspec replaced 210 positional arguments, which overflow the Windows command-line limit; the resulting set is the enumerated one.
  - [x] **P1.T2.2:** `git ls-files docs/svg-contact-sheets` lists exactly 22 paths, all `baseline/**` (11 PNG + 11 HTML); 122 PNG and 122 HTML remain on disk.
- [x] **P1.T3: Regenerating is silent** - covers: FR-3, AC-3
  - [x] **P1.T3.1:** `node scripts/render-svg-contact-sheets.mjs` (HTML only) exited 0 and rewrote every root sheet. `git status --porcelain` then held 210 lines, every one a staged `D  docs/svg-contact-sheets/...` and nothing else - no modified or untracked path, no rewritten baseline file.
  - [x] **P1.T3.2:** Recorded in the evidence: tracked paths 232 -> 22, PNGs on disk 122 (unchanged), HTML on disk 122 (unchanged).

**Result:** verified
**Checkpoint:** 2c8287cd
**Evidence:** conductor/tracks/20261024-repo-hygiene/verification/phase-1.md

## Phase 2: The record says why

**Goal:** Retire the hygiene debt from the roadmap and README, and write down the
two decisions a future reader would otherwise re-litigate: regenerated sheets
are ignored, and `.opencode/agents/` is versioned on purpose.

**Depends on:** Phase 1

**Covers:** FR-4, FR-5, AC-4, AC-5, AC-6

**Touches:** `docs/roadmap.md`, `README.md`, `docs/TDD.md`, `docs/SVG_STYLE.md`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** verified

- [x] **P2.T1: Roadmap and README** - covers: FR-5
  - [x] **P2.T1.1:** Deleted the "### Repository hygiene" Known Issue (heading and body) and the matching Future Work item. No renumbering was needed because the removed item was item 5, so the survivors were already consecutive 1-4 and no surviving text was edited. `README.md:246` now says "three of them", matching the three remaining `###` headings.
- [x] **P2.T2: The two decisions** - covers: FR-5, AC-5
  - [x] **P2.T2.1:** Added the note at the end of `docs/TDD.md` §11.3 (Validator scripts), where developer tooling is described: `.opencode/agents/` is versioned because `conductor-phase.md` and `conductor-reviewer.md` define the subagents the Conductor workflow launches, and `conductor-implement`'s preflight checks `conductor-phase.md` exists.
  - [x] **P2.T2.2:** Extended the `SVG_STYLE.md` §7 re-render line: output written outside `docs/svg-contact-sheets/baseline/` is git-ignored and not committed, and `baseline/` is the tracked record.
- [x] **P2.T3: The stray file** - covers: FR-4, AC-4
  - [x] **P2.T3.1:** `test-out.txt` deleted by the primary (the executor's sandbox refused every filesystem command). Before: `Test-Path` True, 21982 bytes, `git check-ignore -v` = `.gitignore:10:test-out.txt`. After: absent, and `git status --porcelain` still empty because the file was untracked and ignored.
- [x] **P2.T4: Gate** - covers: AC-6
  - [x] **P2.T4.1:** Seven layers green from the executor; the primary re-ran `validate-bundle` (shell `index-C99hcseA.js`, 138.2 kB - identical to the pre-track build), `validate-pwa` (16/16) and `validate-docs` (5/5), the layer the executor was denied.

**Result:** verified
**Checkpoint:** 243830da
**Evidence:** conductor/tracks/20261024-repo-hygiene/verification/phase-2.md

## Notes for the primary agent

- The 210 removals are index-only (`git rm --cached`). A `git rm` without
  `--cached` would delete the maintainer's regenerated sheets from disk - that is
  explicitly forbidden by NFR-1.
- `git ls-files` on this machine is fine, but `git check-ignore` is the only
  command that proves a *pattern* rather than a *discard*. Use it for both
  directions: ignored outside baseline, honoured inside it.
- The docs validator's game-list and link checks do not read
  `docs/svg-contact-sheets/`, so the removal cannot break them; the phase should
  still run it rather than reason about it.
- Do not "clean up" `.gitignore` beyond the contact-sheet rule plus its comment.
  Every other line is deliberate, including `.conductor/` and `.art-preview/`.

## Phase R1: Review Fixes

**Goal:** Close the three Low findings from review round 1 - the `.gitignore`
comment that does not say what it covers, the `.opencode/` note that lives where
the reader who needs it will not look, and the `SVG_STYLE.md` sentence that
invites deleting folders the generator cannot reproduce.

**Depends on:** Phase 2

**Covers:** F1, F2, F3; FR-2, FR-5, NFR-4, AC-5

**Touches:** `.gitignore`, `docs/TDD.md`, `docs/SVG_STYLE.md`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** in_progress

- [ ] **R1.T1: The comment names what the rule covers** - covers: F1, FR-2
  - [ ] **R1.T1.1:** Make `.gitignore:16` name both extensions the rule handles, so the comment agrees with the four patterns and with what the track's plan and integrated verification claim about it: `# Generated contact-sheet PNGs and HTML are scratch; the tracked record is the baseline set.` Change nothing else in the file.
- [ ] **R1.T2: The note is where the reader looks** - covers: F2, FR-5
  - [ ] **R1.T2.1:** Add `.opencode/` to the §2.1 root tree in `docs/TDD.md` (the block that lists `index.html`, `package.json`, `scripts/`, `.github/workflows/ci.yml`, `docs/`, `conductor/`, `src/`), with a short trailing comment pointing at §11.3. Keep the §11.3 paragraph as the expansion; do not move or reword it.
- [ ] **R1.T3: The sentence stops inviting a loss** - covers: F3, NFR-4
  - [ ] **R1.T3.1:** Qualify the `docs/SVG_STYLE.md` §7 sentence: generated output outside `baseline/` is ignored and not committed, `baseline/` is the tracked record, and the historical per-phase folders (`final/`, `phase2`, `phase3`, `phase3-pilot`, `phase4`-`phase8`) are earlier corpus snapshots that only git history preserves - the current script renders today's corpus and would not recreate them.
- [ ] **R1.T4: Gate** - covers: AC-5
  - [ ] **R1.T4.1:** Run the full chain and write `conductor/tracks/20261024-repo-hygiene/verification/phase-R1.md` with the three diffs, the gate table, and the FR/AC mapping.

<!--
Phase completion is recorded by the primary agent only:

**Result:** verified | failed | blocked
**Checkpoint:** <commit>
**Evidence:** conductor/tracks/20261024-repo-hygiene/verification/phase-<n>.md
-->

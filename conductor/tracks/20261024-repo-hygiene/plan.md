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

**Status:** in_progress

- [ ] **P2.T1: Roadmap and README** - covers: FR-5
  - [ ] **P2.T1.1:** Delete the "### Repository hygiene" Known Issue and the matching Future Work item, renumbering the survivors consecutively. Correct the README Known Issues count to the number of `###` headings that remain. Keep the other three Known Issues untouched, including their wording.
- [ ] **P2.T2: The two decisions** — covers: FR-5, AC-5
  - [ ] **P2.T2.1:** In `docs/TDD.md`, add a short note where the developer tooling is described: `.opencode/agents/` is versioned because Conductor launches `conductor-phase` and `conductor-reviewer` from those files, and `conductor-implement`'s preflight reads them. One or two sentences, matched to the surrounding style.
  - [ ] **P2.T2.2:** In `docs/SVG_STYLE.md`, extend the re-render line to say the generated output outside `docs/svg-contact-sheets/baseline/` is git-ignored and is not committed.
- [ ] **P2.T3: The stray file** — covers: FR-4, AC-4
  - [ ] **P2.T3.1:** Delete `test-out.txt` from the working tree (`Remove-Item`). It is untracked and ignored, so this produces no commit; record the before/after `Test-Path` and the `git check-ignore -v test-out.txt` line in the evidence.
- [ ] **P2.T4: Gate** — covers: AC-6
  - [ ] **P2.T4.1:** Run the full chain and record it. `node scripts/validate-docs.js` must pass; note whether the shell entry hash is identical to the pre-track build (`index-C99hcseA.js`, 141547 bytes) - it should be, because nothing in `src/` changed.

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

<!--
Phase completion is recorded by the primary agent only:

**Result:** verified | failed | blocked
**Checkpoint:** <commit>
**Evidence:** conductor/tracks/20261024-repo-hygiene/verification/phase-<n>.md

`conductor-review` appends a `## Phase R1: Review Fixes` block here if needed.
-->

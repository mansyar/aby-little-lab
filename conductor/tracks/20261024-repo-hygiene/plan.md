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

**Status:** in_progress

- [ ] **P1.T1: A rule that matches the comment** - covers: FR-2
  - [ ] **P1.T1.1:** Replace the single `docs/svg-contact-sheets/*.png` line with depth-independent patterns plus the baseline re-include: `docs/svg-contact-sheets/**/*.png`, `docs/svg-contact-sheets/**/*.html`, then `!docs/svg-contact-sheets/baseline/**/*.png` and `!docs/svg-contact-sheets/baseline/**/*.html`. Rewrite the comment above them so it names both extensions and says the baseline folder is the tracked record. Do not touch any other rule, and do not add an ignore rule for `.opencode/`.
  - [ ] **P1.T1.2:** Before staged changes exist, prove the pattern set with `git check-ignore -v` on four paths: `docs/svg-contact-sheets/final/animals.png` and `docs/svg-contact-sheets/animals.html` (must match a rule), `docs/svg-contact-sheets/baseline/animals.png` and `docs/svg-contact-sheets/baseline/animals.html` (must match nothing). Record the output.
- [ ] **P1.T2: Untrack the regenerated sheets, keep the files** — covers: FR-1
  - [ ] **P1.T2.1:** Remove every tracked path under `docs/svg-contact-sheets/` except `baseline/**` from the index with `git rm --cached` (210 paths: 99 PNG + 111 HTML). The files must remain on disk - verify with a directory count afterwards and a `git status --short` that shows deletions in the index but no missing files.
  - [ ] **P1.T2.2:** Confirm the result: `git ls-files docs/svg-contact-sheets` lists exactly 22 paths, all under `baseline/`.
- [ ] **P1.T3: Regenerating is silent** — covers: FR-3, AC-3
  - [ ] **P1.T3.1:** Run `node scripts/render-svg-contact-sheets.mjs` (HTML only, no `--png`, so no Chrome is needed), then `git status --porcelain`. It must be empty. If the generator rewrites a tracked file, stop and report it rather than untracking more paths - that would mean a baseline file is machine-generated, which contradicts FR-1.
  - [ ] **P1.T3.2:** Record in the evidence the before/after numbers: tracked paths under the folder (232 → 22), PNGs on disk (122, unchanged) and HTML on disk (122, unchanged).

## Phase 2: The record says why

**Goal:** Retire the hygiene debt from the roadmap and README, and write down the
two decisions a future reader would otherwise re-litigate: regenerated sheets
are ignored, and `.opencode/agents/` is versioned on purpose.

**Depends on:** Phase 1

**Covers:** FR-4, FR-5, AC-4, AC-5, AC-6

**Touches:** `docs/roadmap.md`, `README.md`, `docs/TDD.md`, `docs/SVG_STYLE.md`

**Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

**Status:** pending

- [ ] **P2.T1: Roadmap and README** — covers: FR-5
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

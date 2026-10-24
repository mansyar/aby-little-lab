# Repository Hygiene

> Requirements are stable. Do not renumber `FR-*`, `NFR-*` or `AC-*`; mark a
> withdrawn item **Withdrawn** in place and keep the id.

## Overview

The repository tracks about 7 MB of regenerated contact sheets that nothing
reads, and its `.gitignore` describes an intent - "the tracked baseline lives in
`docs/svg-contact-sheets/baseline/`" - that its pattern does not implement.
Two smaller items sit beside that: a scratch file left on the maintainer's disk
and a directory the roadmap flags as untracked-by-accident which is in fact
load-bearing for the Conductor workflow.

This is a chore: no product behaviour changes, and the game, tests and bundle
must come out byte-identical.

## Problem / Motivation

**H1 - generated sheets are tracked.** `git ls-files docs/svg-contact-sheets`
returns 232 paths: 110 PNGs (7.15 MB on disk) and 122 HTML sheets across ten
subfolders (`baseline`, `final`, `phase2`, `phase3`, `phase3-pilot`, `phase4`
through `phase8`). Only `baseline/` (11 PNG + 11 HTML) is the recorded art
reference; the other nine folders are output from
`node scripts/render-svg-contact-sheets.mjs` and can be regenerated at any time.

**H2 - the ignore rule does not match what it claims.** `.gitignore:25` is
`docs/svg-contact-sheets/*.png`, with a comment above it saying regenerated PNGs
are scratch and the baseline is tracked. Gitignore's `*` does not cross `/`, so
the rule matches only the twelve PNGs at the root of that folder - which are
indeed ignored and untracked - while every PNG in every subfolder, including the
99 outside `baseline/`, stays tracked. The comment and the rule disagree, so a
reader who trusts the comment gets a wrong answer.

**H3 - a stray scratch file.** `test-out.txt` (21982 bytes) sits at the
repository root. It is already ignored (`.gitignore:10`) and untracked, so this
is a local-disk item, not a repository one - but the roadmap lists it as if it
were committed.

**H4 - a misdiagnosed directory.** The roadmap says `.opencode/` (two files,
`agents/conductor-phase.md` and `agents/conductor-reviewer.md`) is "tracked
without any ignore rule" as though that were an accident. It is not: those files
define the `conductor-phase` and `conductor-reviewer` subagents that this
project's workflow launches, and `conductor-implement`'s preflight checks that
`conductor-phase.md` exists. Untracking them would break a fresh clone. The
defect is the documentation, not the tracking.

## Goals & Success Metrics

- **G1** A fresh clone carries the baseline art reference and none of the
  regenerated sheets.
- **G2** Regenerating the sheets produces no git noise.
- **G3** The documented intent and the ignore rule agree, and the two
  misdiagnosed items are either fixed or recorded as deliberate.
- **G4** Nothing else changes: the suite, coverage, build, bundle hash and PWA
  manifest come out as they were.

## Scope

**In scope**

- `.gitignore`: nested contact-sheet patterns with the baseline re-included.
- `docs/svg-contact-sheets/**`: stop tracking everything outside `baseline/`,
  keeping the files on disk.
- `test-out.txt`: delete from the working tree (no commit).
- `docs/roadmap.md`, `README.md`, `docs/TDD.md`, `docs/SVG_STYLE.md`: retire the
  Known Issue, correct the counts and record why `.opencode/` is tracked.

**Out of scope**

- Deleting any regenerated sheet from disk, or changing the generator script.
- Changing the art, the SVG corpus, or the baseline images.
- Untracking or ignoring `.opencode/`.
- Any `src/`, test, config or dependency change.
- A new validator that enforces the ignore rules at gate time.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The index tracks only the `baseline/` contact sheets (11 PNG + 11 HTML) under `docs/svg-contact-sheets/`; the other nine folders stay on disk and untracked. | Must |
| FR-2 | `.gitignore` matches contact-sheet PNGs and HTML at any depth while keeping `baseline/` tracked, and its comment describes that rule accurately. | Must |
| FR-3 | Re-running the generator leaves `git status` clean, because everything it rewrites outside `baseline/` is ignored. | Must |
| FR-4 | `test-out.txt` is absent from the working tree, and the existing ignore rule for it is confirmed rather than duplicated. | Must |
| FR-5 | `.opencode/agents/` stays tracked and the repository says why, so the next reader does not "fix" it. | Must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No file is deleted from disk as part of the index cleanup; `git rm --cached` only. |
| NFR-2 | No game, test, config, dependency or asset change; the bundle hash must be unchanged. |
| NFR-3 | The full gate still passes, including the docs validator. |
| NFR-4 | The repository loses no information a reader needs: the baseline sheets and every live document stay tracked. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `git ls-files docs/svg-contact-sheets` lists exactly 22 paths, all under `baseline/`. | FR-1 |
| AC-2 | `git check-ignore -v` reports a nested `final/*.png` and a nested `final/*.html` as ignored, and reports nothing for `baseline/animals.png`. | FR-2 |
| AC-3 | After `node scripts/render-svg-contact-sheets.mjs`, `git status --porcelain` is empty. | FR-3 |
| AC-4 | `test-out.txt` no longer exists on disk; `git check-ignore -v test-out.txt` still points at the existing rule. | FR-4 |
| AC-5 | The roadmap and README no longer claim the install of tracked sheets or `.opencode/` as debt, and a tracked document states why `.opencode/agents/` is versioned. | FR-5 |
| AC-6 | The full gate passes and the shell entry hash is unchanged from the pre-track build. | NFR-2, NFR-3 |

## Edge Cases

- **A baseline file legitimately changes.** It is still tracked and still shows
  in `git status`; only the folder's siblings are ignored.
- **The generator writes a new category folder.** It is ignored by the
  depth-independent rule, so a future `phase9/` needs no `.gitignore` edit.
- **Git's negation limits.** Re-including baseline works because no parent
  directory is excluded - the patterns exclude files, not folders. The phase
  proves this with `git check-ignore` rather than assuming it.
- **A Windows checkout with case-insensitive paths.** Paths are lowercase in the
  repo already; no rename is involved.
- **Another branch adds a sheet.** The untracking commit removes paths from the
  index once; a later addition is ignored automatically.

## Dependencies

- **Tracks:** none.
- **External:** none. The generator needs Chrome only for `--png`, which this
  track does not run to prove FR-3 (the HTML pass is enough).

## Open Questions & Assumptions

- **Assumption:** the HTML sheets are regenerable scratch like the PNGs, since
  both are written by the same script into the same folders. The user chose
  "keep baseline only" with that stated in the option text.
- **Assumption:** 7.15 MB of PNGs is the bulk of the clone cost; the 1.06 MB of
  HTML goes with them because they are the same generated artifact.
- **Deferred:** whether the generator should write outside `docs/` entirely
  (for example `.art-preview/`, which is already ignored). Not needed to satisfy
  this track.

## References

- `.gitignore:22-25` - the comment and the pattern that disagree.
- `scripts/render-svg-contact-sheets.mjs:21` - `DEFAULT_OUT` is
  `docs/svg-contact-sheets`.
- `docs/SVG_STYLE.md:111` - the re-render instruction.
- `docs/roadmap.md:40-51`, `:73-76` - the Known Issue and its Future Work item.
- `README.md:244-252` - the Known Issues summary and its count.
- `.opencode/agents/conductor-phase.md`, `conductor-reviewer.md` - tracked and
  load-bearing for the workflow.

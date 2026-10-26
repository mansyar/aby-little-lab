# Spec — Docs Truth Pass + Count-Drift Guard

> IDs are stable once approved. Withdrawn items are marked `Withdrawn`, never
> deleted or renumbered.

## Overview

Living documentation in this repository quotes "current state" suite numbers,
and every landed track widens the drift between those quotes and reality. The
actual suite is now **125 files / 2,729 tests**, while README, the TDD and the
perf baseline still claim 2,556/119 and 2,488/118 from October 22–23. The
documentation validator (`scripts/validate-docs.js`) has five checks — release
notes, links, game-list parity, roadmap shape, Conductor paths — but none that
catches count drift, which is why this is the third truth-pass track. This
track refreshes the living docs to the true numbers and adds a hard
count-drift guard to the validator so the rot cannot recur silently.

## Problem / Motivation

- `README.md:49` claims "**2,556 tests across 119 files**, all green (verified 2026-10-23)".
- `docs/TDD.md:1013`, `:1027`, `:1033` claim 119 files / 2,556 tests and a coverage
  snapshot (97.92/91.81/96.6/98.7) both superseded by two merged tracks.
- `docs/perf-baseline.md:411` (Test-suite row) and its header figure block claim
  118 files / 2,488 tests.
- `README.md` `game/` structure line claims "55 files = 33 modules + art/ 16 +
  hub/ 6" and lists "21 per-game logic modules"; the actual tree is 56 files =
  34 modules (the `random.ts` shared shuffle/rng module from PR #67) + art/16 + hub/6.
- `docs/roadmap.md:7` says entries were "checked against the code on 2026-10-25".

None of this is caught automatically: a future track can bump the counts and
ship stale docs again. A guard that derives the truth at validation time and
compares it against the docs turns this from a recurring manual chore into a
CI-enforced invariant.

## Goals & Success Metrics

- **G1 — Living docs state the truth.** Metric: every `N tests` / `M files`
  claim in README, docs/TDD.md and docs/perf-baseline.md equals the derived
  suite numbers (125 files / 2,729 tests), and dated coverage snapshots carry
  today's values.
- **G2 — The rot dies permanently.** Metric: `scripts/validate-docs.js` gains a
  check that derives both numbers from a collect-only `vitest list` run and
  fails when a living-doc claim mismatches; a deliberate mutation is proven to
  fail the validator.
- **G3 — Historical records stay frozen.** Metric: `docs/release-checklist.md`
  is byte-identical at the end of the track; its dated per-release counts are
  never rewritten.

## Scope

### In scope
- Refreshing README's current-state line (:49) and the `game/` structure line.
- Refreshing docs/TDD.md's suite-size claims (:1013, :1027) and coverage
  snapshot (:1033) as dated snapshots verified 2026-10-26.
- Refreshing docs/perf-baseline.md's test-suite row (:411) and header figure
  block counts/date; performance measurements untouched.
- Refreshing docs/roadmap.md's "checked against the code on …" line.
- Adding a `checkTestCounts` check to `scripts/validate-docs.js` that derives
  the file count and test-case count from one collect-only `vitest list` run
  and fails on mismatch in the three living docs.

### Out of scope
- Rewriting dated historical records (release-checklist.md release entries).
- Guarding coverage percentages (deriving coverage needs a full coverage run —
  too slow for a docs validator; percentages remain dated snapshots).
- Changing any performance measurement, baseline number, or first-tap figure.
- Changing any Conductor doc (`conductor/**`) beyond what `conductor-implement`
  records itself.
- Documentation content unrelated to counts (no README restructure, no TDD rewrite).

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | `scripts/validate-docs.js` gains a `checkTestCounts` check that (a) runs one collect-only `vitest list`, (b) derives the distinct test-file count and the total test-case count, (c) scans `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` for test/file count claims, and (d) fails with exit ≠ 0 when any claim mismatches the derived truth. Claims in other documents (release-checklist, conductor/**, archived specs) are not scanned. | must |
| FR-2 | `README.md`'s current-state line states the true counts (**2,729 tests across 125 files**) with a verified date of 2026-10-26. | must |
| FR-3 | `docs/TDD.md`'s suite-size claims (:1013, :1027) and coverage snapshot (:1033) state the true counts and today's coverage values (97.82/91.96/96.77/98.74) as a dated snapshot verified 2026-10-26. | must |
| FR-4 | `docs/perf-baseline.md`'s Test-suite row (:411) and header figure block state the true counts with a refreshed date; all performance measurements remain byte-identical. | must |
| FR-5 | `README.md`'s `game/` structure line states 56 files = 34 modules + art/16 + hub/6 and adds `random.ts` (the shared Fisher–Yates shuffle + `Rng` type from PR #67) to the module enumeration. | must |
| FR-6 | `docs/roadmap.md:7` reads "checked against the code on 2026-10-26". | must |
| FR-7 | When the guard fails, its output names the document, the claimed number, and the derived number, and says plainly that the docs must be refreshed (not the code). | must |

## Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | The validator's total runtime increase is bounded (~≤ 25 s for the collect); no new dependencies are added. | must |
| NFR-2 | Zero changes under `src/` and `public/`; the only code change is `scripts/validate-docs.js`. | must |
| NFR-3 | The derivation parses `vitest list` output defensively (line pattern for test cases, distinct-path set for files); a format change fails with a clear message rather than a crash or a false pass. | must |

## Acceptance Criteria

| ID | Criterion | Verifies |
|---|---|---|
| AC-1 | `node scripts/validate-docs.js` exits 0 on the final tree with the new check present and passing. | FR-1 |
| AC-2 | Mutation proof recorded in evidence: with README's count deliberately corrupted in the working tree, the validator exits non-zero and its output names the file, the claimed number and the derived number; the mutation is then reverted. | FR-1, FR-7 |
| AC-3 | Static proof: a grep over README/TDD/perf-baseline finds no `N tests` / `M files` claim that differs from 2,729/125 except explicitly dated historical narrative (if any remains, each carries its date so the guard's claim scan does not match it); `git diff` shows release-checklist.md untouched. | FR-2, FR-3, FR-4, G3 |
| AC-4 | The roadmap date line reads 2026-10-26 and the full `validate-docs` run passes. | FR-6, AC-1 |

## Edge Cases

- **A doc that omits counts** passes the guard silently — the check verifies
  claims that exist; it does not require counts to be present.
- **Future tracks bump the counts** → CI fails `validate-docs` until the docs
  are refreshed. Intended; FR-7's message must point at the fix.
- **`vitest list` noise lines** (headers, progress) must not be counted as test
  cases; only lines matching the `path > suite > test` shape count, and the
  file count is the number of distinct source paths.
- **`vitest list` must run in collect mode** (no test execution, no watch
  mode); the spawn must pass explicit non-interactive arguments.
- **Windows line endings / BOM** in the scanned docs must not break the scan.
- **The phase order is refresh-first, guard-second.** A guard-first order would
  land every phase gate red against stale counts.

## Dependencies

- **Tracks:** none.
- **External:** none (no new dependencies; `vitest` is already installed).

## Open Questions & Assumptions

- **A1** — `vitest list` (collect-only) is the derivation source; measured at
  ~21 s locally for 125 files, well within the NFR-1 bound.
- **A2** — Guard scope is exactly the three living docs (README, TDD,
  perf-baseline); any future doc that wants guarded counts opts in by being
  added to the scan list.
- **A3** — Coverage percentages are refreshed as dated snapshots and are not
  guarded (NFR/derivation cost trade-off agreed with the user).
- **A4** — README's structural `game/` claim is refreshed but not guarded
  (the guard is test-count focused; structural drift is out of this track's
  guard scope).

## References

- `docs/perf-baseline.md:367,395-399` — the sibling open question this track deliberately does NOT touch.
- `scripts/validate-docs.js` — the five existing checks (lines 246-488) this track extends.
- `conductor/archive/20261020-docs-truth-pass/`, `conductor/archive/20261022-docs-roadmap-truth/` — the prior truth-pass tracks whose manual refreshes this guard makes durable.

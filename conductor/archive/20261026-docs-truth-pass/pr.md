# docs(truth): Refresh the living docs to the current suite truth and add a count-drift guard

## Summary

The living documentation had silently drifted from the real suite: README and
TDD claimed **2,556 tests across 119 files** and perf-baseline **118 / 2,488**
while the actual suite is **125 files / 2,729 tests** — the third
truth-pass-style track, so this one also installs a **guard** so the drift can
never recur silently. Historical records are deliberately untouched.

## Track

- **Track:** `20261026-docs-truth-pass` (chore / high)
- **Branch:** `chore/20261026-docs-truth-pass` (base `master` @ `127cd8c6`)
- **Phases:**

| Phase | Goal | Checkpoint |
|---|---|---|
| 1 | Refresh the living docs | `c0d92eed` |
| 2 | Add the count-drift guard | `74a07e3a` |
| R1 | Resolve review findings F1–F2 | `6cdcaff4` |

## What changed

- **README.md:49** — "**2,729 tests across 125 files** (verified 2026-10-26)".
- **README structure tree** — components 17 files (`GameLoadCue` added),
  game/ 56 files = 34 modules (+ `random.ts`) + art/ 16 + hub/ 6.
- **docs/TDD.md** — runner figures (:1015, :1029), coverage snapshot (:1035:
  97.82 (5493/5615) / 91.96 (1488/1618) / 96.77 (1141/1179) / 98.74
  (5116/5181)), and the decodeLogic lowest-file sentence corrected against
  the live per-file table (75 % lines, uncovered 66–80, pool 22).
- **docs/perf-baseline.md** — Test-suite and Coverage rows → 125 / 2,729 and
  the current coverage, with a dating sentence (build figures remain the
  2026-10-22 measurement); every measurement byte-identical.
- **docs/roadmap.md:7** — checked-on date → 2026-10-26.
- **scripts/validate-docs.js** — new Check 6 `checkTestCounts`: one
  collect-only `pnpm exec vitest list` (~21 s) derives the true file/test
  counts and fails any suite-count claim in README/TDD/perf-baseline that
  disagrees — covering "N tests", "N test files", "N files" (only on lines
  that also claim tests, so directory counts stay unguarded) and "N test
  cases". Failure output names the file, the claimed number and the derived
  truth, and says **refresh the document, not the code**.

## Verification

Full chain green at every phase and on the integrated tree: 258 files
checked (1 pre-existing warning + 1 pre-existing info), typecheck clean,
125 files / 2,729 tests passed, coverage 97.82/91.96/96.77/98.74 (gates
90/85/88/95), build 54 precache entries (1727.85 KiB), bundle PASS (shell
138.7 kB ≤ 200 kB), PWA 16/0, docs validator **6 passed / 0 failed**
including the new live-derivation check.

Mutation proof (recorded verbatim in `verification/phase-2.md` and again for
the added phrasing in `phase-R1.md`): corrupting README:49 to "2,999" (and
"2,999 test cases") makes the validator exit 1 naming the file, the claimed
number and the derived truth; both mutations reverted byte-identically.

## Review

PASS after 2 rounds (strict). Round 1: PASS WITH FINDINGS with two Low
findings — F1: the "N test cases" phrasing escaped the guard (latent; no
document uses it); F2: the two refreshed perf-baseline rows sat undated
inside a 2026-10-22-headed table. Both fixed in Phase R1; round 2: PASS,
zero new findings.

## Deviations

- One TDD tree line (`GameLoadCue.ts`) added beyond the brief's
  count-only instruction — the tree enumerated the old 16 files,
  contradicting "17 files"; mirrors the `random.ts` instruction.
- The perf-baseline header blockquote was left byte-identical per brief
  override (it carries no test counts; the table rows were the claim).
- Format-only follow-up commit for the combined claim spread (biome).

## Follow-ups

- `docs/perf-baseline.md:395-399` — the 400 ms first-tap budget remains an
  open question (deliberately untouched; candidate for a future track).

## Rollback

Revert the PR; the guard lives in one script plus doc lines, so a revert
returns the pre-track state exactly.

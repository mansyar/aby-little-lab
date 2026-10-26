# Phase R1 Evidence — Review Fixes

- **Track:** 20261026-docs-truth-pass
- **Phase:** R1
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-docs-truth-pass`
- **Base:** `feaef50f` (phase base) · **Head:** `4ae98497`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | pass (1 pre-existing warning: `musicalMemoryScene.test.ts:296` noNonNullAssertion; 1 pre-existing info: biome schema version) |
| static | `pnpm typecheck` | 0 | pass (clean, `tsc --noEmit`) |
| unit | `pnpm test -- --run` | 0 | pass (125 files / 2,729 tests) |
| unit | `pnpm test:coverage` | 0 | pass (statements 97.82 (5493/5615), branches 91.96 (1488/1618), functions 96.77 (1141/1179), lines 98.74 (5116/5181)) |
| build-artifact | `pnpm build` | 0 | pass (54 precache entries, 1727.85 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | pass (shell entry `index-COuCveC-.js` = 138.7 kB ≤ 200 kB; phaser chunk present) |
| build-artifact | `node scripts/validate-pwa.js` | 0 | pass (16/0; 42 chunks, 42 precached) |
| documents | `node scripts/validate-docs.js` | 0 | pass (6/0 incl. the count guard with the new pattern) |

The full chain was run exactly as written
(`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`)
in a single invocation, exit 0.

## Findings

### F1 — resolved: the count guard covers the "N test cases" phrasing

`scripts/validate-docs.js`: added
`const TEST_CASES_CLAIM_RE = /\b\d[\d,]*\s+test\s+cases\b/g;` beside
`TESTS_CLAIM_RE`, and the claim matches of both patterns are collected into
`testClaims`, which is checked against `truth.tests` through the same
`claimAgrees` path with the same failure text. `TEST_CASES_CLAIM_RE` matches
feed the same `testClaims.length > 0` gate that arms `FILES_CLAIM_RE`, so a
line claiming "N test cases" also has its `M files` claim guarded. The
`/** A count claim: ... */` comment now enumerates the `2,729 test cases`
form.

**Second mutation run (working tree only, never committed).** README.md:49
`2,729 tests` → `2,999 test cases`; then `node scripts/validate-docs.js`.
Verbatim output (exit 1):

```
Document Validation for Aby's Little Lab

==================================================
✓ The release-note index is complete
✓ Every relative link resolves, and every anchor matches a heading
✓ The README, the PRD and the TDD agree with GAME_REGISTRY
✓ The roadmap carries both of its sections
✓ No document points at a Conductor path that does not exist
✗ The living docs state the current test-suite truth
  ✗ README.md:49 — expected the documented suite counts to match the derived truth (125 files / 2729 tests) - refresh the document to the current suite truth; do not change the code; found "2,999 test cases"
==================================================

Results: 5 passed, 1 failed
Failures: 1

The documents and the code have parted company. Review the failures above.

Exited with code 1
```

The failure names README.md:49, quotes the claimed `"2,999 test cases"`, and
states the derived truth (125 files / 2,729 tests — the expected message
prints the numbers unformatted, `2729`). README.md:49 was reverted
byte-identically afterwards; `git status --porcelain` was empty (clean).

### F2 — resolved: the two refreshed perf-baseline rows carry an unambiguous date

`docs/perf-baseline.md`: directly under the "### Build figures (2026-10-22)"
table, before the following paragraph, added the sentence:

> The Test-suite and Coverage rows were verified 2026-10-26; the build
> figures above are the 2026-10-22 measurement.

Wrapped at the file's existing prose width; no other change to the file
(`git show --stat` for the commit: 1 file changed, 3 insertions).

## Files touched

- `scripts/validate-docs.js` — F1 fix (pattern + check + comment)
- `docs/perf-baseline.md` — F2 fix (one sentence)

## Commits

- `a0fef061` — test(docs): Guard the test-cases claim phrasing in the count check
- `4a84fbcf` — docs(perf-baseline): Date the refreshed test-suite and coverage rows
- `4ae98497` — test(docs): Format the combined claim match on one line

## Deviations

- **`4ae98497` (extra commit on `scripts/validate-docs.js`)** — the first
  chain run failed at `pnpm check`: biome's formatter required the combined
  `testClaims` spread on one line. Fixed per the formatter's own output and
  committed as a follow-up (amending is not allowed). This is a format-only
  change; no behavioural difference.

## Notes

- The mutation was applied and reverted in the working tree only; the tree
  was verified clean (`git status --porcelain` empty) before the verification
  chain ran.
- The full-chain run happened at head `4ae98497`; `node scripts/validate-docs.js`
  inside the chain passed with the new pattern live against the unmutated docs.
- Pre-existing `pnpm check` warning/info and the Phaser chunk-size build
  warning are unchanged from the review's primary run.
- This evidence file is left for the primary's conductor docs-sync commit,
  matching how phase-1/phase-2 evidence was recorded.

## Primary verification

Primary verification 2026-10-26 (independent of the executor's report):

- Worktree clean (only this evidence file untracked at check time); `git log --oneline feaef50f..HEAD` = 3 commits (a0fef061, 4a84fbcf, 4ae98497), zero merge commits; `git diff --name-only` = `scripts/validate-docs.js`, `docs/perf-baseline.md`, this evidence file (Touches held).
- F1 audit: `TEST_CASES_CLAIM_RE` at `scripts/validate-docs.js:522` beside `TESTS_CLAIM_RE:521`; both patterns feed `testClaims` at `:589` through the same `claimAgrees` path and failure text; the evidence records the second mutation verbatim (exit 1, `README.md:49`, claimed "2,999 test cases", derived `125 files / 2729 tests`) with the byte-identical revert and clean tree.
- F2 audit: one sentence at `docs/perf-baseline.md:414` directly under the Build figures (2026-10-22) table; no other file change.
- Deviation audited: `4ae98497` is format-only (biome's one-line requirement for the combined spread); no behavioral change.
- Full 8-command chain re-run by the primary: all exit 0 (258 files checked with the two pre-existing diagnostics; tsc clean; 125 files / 2,729 tests; coverage 97.8/91.9/96.77/98.74 as displayed; build 54 precache 1727.85 KiB; bundle/PWA/docs all pass, docs check 6/0).
- Primary verdict: **verified**.

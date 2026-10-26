# Review — 20261026-docs-truth-pass

- **Track:** 20261026-docs-truth-pass
- **Type:** chore
- **Branch:** `chore/20261026-docs-truth-pass`
- **Range:** `127cd8c6..cd494014` (5 code/docs files outside `conductor/`)
- **Date:** 2026-10-26
- **Verdict:** PASS

## Summary

The docs truth pass and the count-drift guard are correctly implemented and
verified. The guard derives 125 files / 2,729 tests live from one
collect-only `vitest list` run with no hardcoded numbers; all guarded claims
in README, TDD and perf-baseline agree with the derived truth and with the
actual tree (56 game files = 34+16+6, 17 components, 22 registry games); the
mutation proof is recorded verbatim with the tree clean after revert; the
release-checklist is byte-identical. Two Low findings remain, both nits —
fixed under strict mode in Phase R1.

## Verification

| Layer | Command | Result | Evidence |
|---|---|---|---|
| static | `pnpm check` | pass (exit 0; 1 pre-existing warning + 1 pre-existing info) | primary run |
| static | `pnpm typecheck` | pass (clean) | primary run |
| unit | `pnpm test -- --run` | pass (125 files / 2,729 tests) | primary run; reviewer glob-confirmed 125 test files |
| unit | `pnpm test:coverage` | pass (97.82/91.96/96.77/98.74) | primary run; matches TDD:1035, perf-baseline:412, decodeLogic sentence |
| build-artifact | `pnpm build` | pass (54 precache, 1727.85 KiB) | primary run |
| build-artifact | `node scripts/validate-bundle.js` | pass (shell 138.7 kB ≤ 200 kB) | primary run |
| build-artifact | `node scripts/validate-pwa.js` | pass (16/0, 42/42) | primary run |
| documents | `node scripts/validate-docs.js` | pass (6/0 incl. the new live-derivation check) | primary run |
| — | `git diff 127cd8c6..HEAD -- . ':(exclude)conductor'` | exactly README.md, docs/TDD.md, docs/perf-baseline.md, docs/roadmap.md, scripts/validate-docs.js | primary ran the reviewer's need |
| — | `git diff -- docs/release-checklist.md` | empty (G3 byte-identical) | primary ran the reviewer's need |
| — | `git status --porcelain` | clean | primary ran the reviewer's need |

## Requirements coverage

| Requirement | Implementing task | Verifying test/evidence | Status |
|---|---|---|---|
| FR-1 | P2.T1 | `scripts/validate-docs.js:536-608` + integrated run | covered |
| FR-2 | P1.T1.1 | `README.md:49` | covered |
| FR-3 | P1.T2 | TDD:1015/:1029/:1035 | covered |
| FR-4 | P1.T3 | perf-baseline:411/:412 | covered |
| FR-5 | P1.T1.2 | `README.md:81` + glob 56 = 34+16+6 | covered |
| FR-6 | P1.T4 | `docs/roadmap.md:7` | covered |
| FR-7 | P2.T1.2 | mutation output names file, claimed, derived, and the refresh-the-docs instruction | covered |
| NFR-1 | P2.T1 | single spawnSync, no new deps, ~21 s | covered |
| NFR-2 | P2.T1 | diff = one script + four docs | covered |
| NFR-3 | P2.T1.1 | ANSI strip, shape match, zero-files explicit fail | covered |
| AC-1 | P2.T3 | integrated.md | covered |
| AC-2 | P2.T2 | verbatim exit-1 mutation output, revert verified | covered |
| AC-3 | P1 sweep + P2.T1.2 | grep: only the 5 current claims exist; release-checklist empty diff | covered |
| AC-4 | P1.T4 | roadmap date + integrated run | covered |

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

- **F1** — `scripts/validate-docs.js:521` — the tests-claim regex matches only
  "N tests"; the equivalent phrasing "N test cases" would escape the guard.
  No document uses the phrasing today (grep: zero matches), so this is a
  latent hole, not a live defect. Fix: add a third claim pattern
  (`/\b\d[\d,]*\s+test\s+cases\b/g`) checked against `truth.tests`.
  Requirement: FR-1 / G2. Test gap: the mutation proof only exercises the
  "N tests" form.
- **F2** — `docs/perf-baseline.md:401` — the refreshed Test-suite (:411) and
  Coverage (:412) rows sit inside the table headed "### Build figures
  (2026-10-22)" and carry no date of their own; a reader can misread them as
  2026-10-22 measurements (the suite was 118/2,488 on that date). Fix: add
  one sentence under the table dating the two rows (verified 2026-10-26).
  Requirement: FR-4 / AC-3. Test gap: n/a.

## Plan compliance

- Phase 1 verified, checkpoint `c0d92eed`, evidence `verification/phase-1.md`.
- Phase 2 verified, checkpoint `74a07e3a`, evidence `verification/phase-2.md`.
- Integrated verification recorded (`verification/integrated.md`).
- Both disclosed deviations (TDD tree GameLoadCue line; perf-baseline header
  left byte-identical per brief override) documented and justified.
- Phase-1 rework (perf-baseline:412 Coverage row) properly recorded.
- No unexplained scope creep; the 5-file diff matches Touches exactly.

## Out of scope

- Pre-existing host-load test-timeout flakiness of the heavy property tests
  (documented in both phase files; predates this track).
- `docs/perf-baseline.md:395-399` first-tap open question (deliberately untouched).
- Historical counts in `docs/release-checklist.md` and `docs/release-notes-*.md`
  (dated records, unguarded by design per A2 — `release-notes-v1.21.0.md:189`
  correctly sits outside the scan list).

## Debt

None.

## Doc sync

`none` — the review-fix round added a guard pattern and one dating sentence;
neither contradicts any documented contract (`conductor/tech-stack.md`'s
Design Update describes the check generically, which still holds).

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
|---|---|---|---|---|---|---|
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 2 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 2 |

### Round 2

Delta re-review of `feaef50f..6cdcaff4` (Phase R1): both Low findings
verified resolved — F1 via `TEST_CASES_CLAIM_RE` sharing the existing check
and failure path with a second verbatim mutation proof ("2,999 test cases" →
exit 1, byte-identical revert), F2 via the dating sentence at
`docs/perf-baseline.md:414`. No weakening: the delta adds only matches and
one sentence. The reviewer's one denied command
(`node scripts/validate-docs.js`) was executed by the primary: exit 0, "6
passed, 0 failed". Verdict: PASS, zero new findings.

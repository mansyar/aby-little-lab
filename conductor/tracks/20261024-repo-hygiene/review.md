# Track Review - Repository Hygiene

- **Track:** `20261024-repo-hygiene` (chore, low)
- **Branch:** `chore/20261024-repo-hygiene`
- **Range:** `97234c3c8322faac5c579f92293e940b2083b653..0c8eabec`
- **Date:** 2026-10-24
- **Round:** 2 (final)
- **Verdict:** **PASS WITH FINDINGS** - round 1's three Low findings are fixed in
  Phase R1, and round 2's three Low findings (two in the Conductor record, one in
  the spec) were fixed before the PR. No Critical, High or Medium remains.

## Summary

The track does what it says in the index and nothing more. The ignore rule is
depth-independent and re-includes `baseline/` explicitly, the index went from 232
tracked paths to 22 (all under `baseline/`), and every one of the 210 removed
paths stayed on disk - `git rm --cached`, never `git rm`, which NFR-1 required.
Regeneration is provably silent: running the generator rewrote every root sheet
and `git status --porcelain` contained the staged deletions and nothing else.

The two honest corrections the track makes are worth as much as the cleanup:
`test-out.txt` was never tracked (only sitting on disk behind an existing rule),
and `.opencode/agents/` is tracked on purpose because Conductor's preflight reads
`conductor-phase.md`. The roadmap claimed a defect where there was a decision, so
the fix is a sentence in the TDD rather than an untracking.

Round 1 found three documentation inaccuracies, all fixed. Round 2 found three
more - two in the phase record, one a stale premise in the spec that the new
`SVG_STYLE.md` sentence contradicts - and all three are fixed in `0c8eabec`.

## Verification

Run at `c05bcb92` (gate) and re-checked at the round-2 tip.

| Layer | Result |
| --- | --- |
| `pnpm check` | exit 0, two pre-existing findings |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | 121 files / 2631 tests |
| `pnpm test:coverage` | 97.97 / 91.94 / 96.69 / 98.74 |
| `pnpm build` | exit 0, precache 54 entries / 1725.92 KiB |
| `node scripts/validate-bundle.js` | phaser 1342.6 kB, shell `index-C99hcseA.js` 138.2 kB |
| `node scripts/validate-pwa.js` | 16 / 0 |
| `node scripts/validate-docs.js` | 5 / 0 |

The shell hash is byte-identical to the pre-track build (`index-C99hcseA.js`,
141547 bytes), which is NFR-2's proof that a repository-only change did not move
the shipped bundle.

Both reviewers were denied `node scripts/validate-docs.js` and several `git`
inventory verbs by their sandboxes; the primary ran the docs layer (5/5) and the
reviewers' remaining claims were established from `git status`, `git diff --stat`
and `git show`.

## Requirements

| Id | Requirement | Covered by | Status |
| --- | --- | --- | --- |
| FR-1 | Only `baseline/` tracked | P1.T2 - 232 -> 22 paths | covered |
| FR-2 | Depth-independent rule, baseline re-included, honest comment | P1.T1, R1.T1 | covered |
| FR-3 | Regenerating leaves the tree clean | P1.T3 - generator then empty status | covered |
| FR-4 | `test-out.txt` gone, rule intact | P2.T3 - deleted, `.gitignore:10` unchanged | covered |
| FR-5 | `.opencode/agents/` tracked and documented | P2.T2, R1.T2 - TDD §2.1 and §11.3 | covered |
| NFR-1 | Nothing deleted from disk | P1.T2 - 210 staged `D`, 0 worktree ` D` | covered |
| NFR-2 | Bundle hash unchanged | gate - `index-C99hcseA.js` 141547 bytes | covered |
| NFR-3 | Full gate including docs | gate table above | covered |
| NFR-4 | Baseline and live documents stay tracked | 22 paths, no sheet path in the R1 delta | covered |
| AC-1 | Exactly 22 tracked paths | P1.T2 | covered |
| AC-2 | Rule proven in both directions | P1.T1.2 - `check-ignore --no-index`, 210 vs 0 | covered |
| AC-3 | Clean status after regenerating | P1.T3.1 | covered |
| AC-4 | File gone, rule still named | P2.T3.1 | covered |
| AC-5 | Roadmap/README updated, `.opencode/` rationale recorded | P2.T1, P2.T2, R1.T1-R1.T3 | covered |
| AC-6 | Full gate passes, bundle unchanged | gate table | covered |

## Findings

### Round 1

| Id | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Low | `.gitignore:16` comment named neither extension, while the plan and `integrated.md` claimed it did | `# Generated contact-sheet PNGs and HTML are scratch...` (`4f639364`) |
| F2 | Low | The `.opencode/agents/` rationale lived only in TDD §11.3; §2.1's root tree omitted the directory, so the reader who needs it never sees it | `.opencode/agents/` added to the §2.1 tree pointing at §11.3 |
| F3 | Low | `SVG_STYLE.md` said everything outside `baseline/` is ignored, reading as "throwaway", when the nine historical folders are snapshots the generator cannot recreate | sentence qualified with the folder list, the `stories` example and "only git history preserves them" |

### Round 2

| Id | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F4 | Low | The primary's note split the executor's opening paragraph in `verification/phase-R1.md`, leaving a mid-sentence fragment, an unmatched `**`, and a false "kept as written" claim | opening rewritten as one accurate sentence (`0c8eabec`) |
| F5 | Low | `spec.md` still asserted the nine folders "can be regenerated at any time", contradicting the sentence F3 added | additive `Correction (R1)` under Open Questions; no FR/NFR/AC id touched |
| F6 | Low | The evidence file's scope claim used `..HEAD`, which is false at the track tip where the bookkeeping commit also changes `plan.md` and `metadata.json` | range pinned to the phase checkpoint, with the bookkeeping commit named |

## Plan compliance

Compliant. All three phases carry `Result`, `Checkpoint` and `Evidence`; the
checkpoints `2c8287cd` -> `243830da` -> `4f639364` are ancestors in order; the
diff stayed inside the union of the phases' `Touches`; and Phase R1's evidence
records that the executor was blocked on the index verbs so the primary performed
the untracking, the deletion, the generator run and the docs layer.

## Out of scope

- Deleting the regenerated sheets from disk, or rewriting history to shrink the
  7.15 MB already in the repository.
- Changing the generator's output location.
- Untracking or ignoring `.opencode/` - deliberately kept and now documented.
- Any `src/`, test or config change; the bundle hash confirms none happened.

## Debt

None. Every finding from both rounds is fixed inside the track, and the two
corrections (the stray file was never tracked, `.opencode/` is a decision not a
defect) are recorded in the roadmap and the TDD so they are not re-raised.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 3 | 3 (Phase R1) |
| 2 | PASS WITH FINDINGS | 0 | 0 | 0 | 3 | 3 (`0c8eabec`) |

## Doc sync

Complete. `docs/roadmap.md` lost the hygiene Known Issue and its Future Work item
(survivors already numbered 1-4), `README.md:246` counts three, `docs/TDD.md`
carries the `.opencode/agents/` rationale in §2.1 and §11.3, and
`docs/SVG_STYLE.md` §7 warns against deleting the historical folders.
`node scripts/validate-docs.js` passes 5/5 at `0c8eabec`.

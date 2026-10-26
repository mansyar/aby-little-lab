# Phase 2 Evidence — Add the count-drift guard

- **Track:** 20261026-docs-truth-pass
- **Phase:** 2
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-docs-truth-pass`
- **Base:** `cb621499` (phase base) · **Head:** `88a8b04f`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | Biome clean for the changed script (pre-existing 1 warning / 1 info elsewhere, unchanged) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 125 test files / 2,729 tests passed — independently confirms the derived suite truth |
| coverage | `pnpm test:coverage` | 0 | 97.82% stmts (5493/5615), 91.96% branches (1488/1618), 96.77% funcs (1141/1179), 98.74% lines (5116/5181) — matches the Phase 1 TDD snapshot |
| build-artifact | `pnpm build` | 0 | Built in 887 ms; precache 54 entries |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 138.7 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| documents | `node scripts/validate-docs.js` | 0 | 6 passed, 0 failed — the new check "The living docs state the current test-suite truth" passes |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | `checkTestCounts` derives both numbers from one collect-only `vitest list` run and scans exactly README.md, docs/TDD.md, docs/perf-baseline.md | `scripts/validate-docs.js` Check 6; the documents-layer run passes with the check registered | done |
| FR-7 | Failure output names the document, the claimed number, and the derived number, and says the docs must be refreshed, not the code | Mutation output below (README.md:49, claimed "2,999 tests", derived `125 files / 2729 tests`, "refresh the document … do not change the code") | done |
| NFR-1 | Runtime increase bounded, no new dependencies | One `spawnSync` of `pnpm exec vitest list` (~21 s on this host); `node:child_process` is built-in; no dependency added | done |
| NFR-2 | Zero changes under `src/` and `public/` | `git status --porcelain` clean at the end; the only code change is `scripts/validate-docs.js` (commits `f8390a8e`, `88a8b04f`) | done |
| NFR-3 | Defensive derivation | ANSI stripped, only lines of the shape `<path ending in .test.ts> > …` count, distinct-first-segment file set, zero-files ⇒ explicit derivation failure (never a false pass) | done |
| AC-1 | Validator exits 0 on the final tree with the new check present and passing | Documents-layer run above: `Results: 6 passed, 0 failed` | done |
| AC-2 | Mutation proof recorded, mutation reverted, tree clean | Verbatim output below; `git status --porcelain` empty after revert | done |

## Mutation proof (AC-2)

**Before** (clean tree, commit `88a8b04f`):

```
✓ The release-note index is complete
✓ Every relative link resolves, and every anchor matches a heading
✓ The README, the PRD and the TDD agree with GAME_REGISTRY
✓ The roadmap carries both of its sections
✓ No document points at a Conductor path that does not exist
✓ The living docs state the current test-suite truth

Results: 6 passed, 0 failed
```

**Mutated** — README.md:49 changed `2,729` → `2,999` in the working tree only (never committed); verbatim output, exit code 1:

```
Document Validation for Aby's Little Lab

==================================================
✓ The release-note index is complete
✓ Every relative link resolves, and every anchor matches a heading
✓ The README, the PRD and the TDD agree with GAME_REGISTRY
✓ The roadmap carries both of its sections
✓ No document points at a Conductor path that does not exist
✗ The living docs state the current test-suite truth
  ✗ README.md:49 — expected the documented suite counts to match the derived truth (125 files / 2729 tests) - refresh the document to the current suite truth; do not change the code; found "2,999 tests"
==================================================

Results: 5 passed, 1 failed
Failures: 1

The documents and the code have parted company. Review the failures above.
```

**After** — mutation reverted byte-identically (reverse edit); `git status --porcelain` and `git diff --stat` both empty (only this evidence file untracked, committed with the track).

## Files touched

- `scripts/validate-docs.js` — the only code change (FR-1, NFR-2): header docstring carve-out, `spawnSync` import, `PERF_BASELINE_FILE` constant, Check 6 section (`deriveSuiteTruth`, `parseVitestList` logic inline, `checkTestCounts`), registration in `checks`.

## Deviations

- None. Everything stayed inside `Touches` (`scripts/validate-docs.js`) plus this evidence file. The README mutation existed only in the working tree and was reverted byte-identically.

## Notes

- **Derivation line pattern:** after stripping ANSI, a line counts as one test case when it contains a ` > ` separator and the text before the FIRST ` > ` ends in a `.test.ts` path token (matched by `/(\S+\.test\.ts)$/` on that prefix; backslashes normalized for the distinct-file set). The file count is the size of that set; the test count is the number of matching lines. Everything else (RUN banner, blank lines, summary) is ignored.
- **Suite-claim regexes:** `/\b\d[\d,]*\s+tests\b/g` (test-count claims, comma-tolerant), `/\b\d[\d,]*\s+test\s+files\b/g` (explicit file-count claims), and `/\b\d[\d,]*\s+files\b/g` applied ONLY on lines that also carry a `tests` claim — so `125 files / 2,729 tests`, `2,729 tests across 125 files`, `across 125 files and 2,729 tests` are all guarded, while `components/ # 17 files`, `152 files, dev pipeline`, `3 files` and the TDD tree comments stay unguarded (directory claims, not suite claims).
- **Scanned lines:** unfenced only (`unfencedLines`, the helper `checkConductorPaths` uses), so fenced code blocks are skipped while the unfenced TDD tree comments at :181–:317 are in scope — and legitimately unmatched, because none of them is suite-shaped.
- **Non-interactive spawn:** `spawnSync("pnpm", ["exec", "vitest", "list"], { cwd: ROOT, env: { ...process.env, CI: "1" }, shell: process.platform === "win32" })`. `vitest list` is collect-only by definition (no execution, no watch); `CI=1` pins non-interactive, no-color output; `shell` is required because pnpm is a `.cmd` shim on Windows.
- **Surprises:** (1) ANSI stripping turned out to be a pure defense — with `CI=1` the collected output arrived plain, but the strip stays for non-CI runs. (2) A regex literal cannot hold the ESC control character (`noControlCharactersInRegex`), so `ANSI_RE` is built via `new RegExp(String.fromCharCode(27) + …)`. (3) The first mutation capture exposed a duplicated "found found" prefix (the runner already prints `found`); the failure message was fixed, committed (`88a8b04f`), and the proof re-run — the "Mutated" section above is the authoritative, final-code record. (4) The derived truth prints unformatted (`2729`) while docs use `2,729`; comparison is numeric so this is display-only.
- **Timing:** each `node scripts/validate-docs.js` run took visibly longer than before (the collect dominates), consistent with the ~21 s measured in the brief; well inside NFR-1's bound.

## Primary verification

Primary verification 2026-10-26 (independent of the executor's report):

- Worktree clean; `git log --oneline cb621499..HEAD` = 3 commits (f8390a8e, 88a8b04f, 4b8dd2da), zero merge commits; `git diff --name-only cb621499..HEAD` = `scripts/validate-docs.js` + this evidence file (Touches held).
- Code audit: `checkTestCounts` registered as Check 6 after `checkConductorPaths`; one `spawnSync` of `pnpm exec vitest list` (CI=1, shell on win32 for the .cmd shim, no retries, 32 MB maxBuffer); ANSI-stripped line parse — first segment must end in `.test.ts`, file count = distinct first segments, test count = matching lines; zero-file derivation `fail`s explicitly instead of passing vacuously; claim scan over exactly README/TDD/perf-baseline via `unfencedLines`; `N tests` always guarded; `N test files` and bare `N files` guarded only on lines that also carry a tests claim, so directory counts in tree diagrams stay unguarded; failure text says refresh the document, do not change the code. Header docstring amended to carve out the one snapshot-style check. `child_process`/`node:child_process` is built-in — no new dependency (NFR-2).
- Full 8-command chain re-run by the primary on the final tree: all exit 0 (258 files checked; tsc clean; 125 files / 2,729 tests passed — one earlier full-suite run lost 1 test to the documented host-load 30 s timeout flake and passed on the settled re-run; coverage 97.8/91.9/96.77/98.74 as displayed; build 54 precache entries 1727.85 KiB; bundle PASS; PWA 16/0; docs validator now runs **6** checks including "The living docs state the current test-suite truth" — 6 passed, 0 failed, with the ~21 s collect inside it).
- Mutation proof audited from the evidence: README "2,729" -> "2,999" in the working tree only, validator exit 1 naming `README.md:49` with claimed vs derived, reverted byte-identically, tree clean.
- Primary verdict: **verified**.

# Phase 2 Verification — Verify the deflake

- **Track:** `20261026-property-test-deflake` (chore, high)
- **Phase:** 2
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-property-test-deflake`
- **Phase base:** `6e8a9b9b` — **Phase head:** `6e8a9b9b` (verification-only phase; no code commits)

## Primary verification

- Range `6e8a9b9b..HEAD` = 0 commits (verification-only phase by contract); worktree clean except the untracked evidence file.
- `git diff -- vite.config.ts` = empty — the global 30 s policy remains byte-identical.
- Full 8-command chain re-run by the primary, all exit 0: `pnpm check` (1 pre-existing warning + 1 info), `pnpm typecheck` clean, `pnpm test -- --run` 125 files / 2,729 tests passed, coverage 97.8/91.9/96.77/98.74, build precache 54 entries (1727.85 KiB), bundle PASS, PWA 16/0, docs 6/0 (the count-drift check confirms the unchanged counts).
- The executor's supplementary verbose run measured the five budgeted suites at 2.63-3.91 s each against the 120,000 ms budgets (31× headroom); no flake recurrence.
- Primary verdict: **verified**.


- **Track:** `20261026-property-test-deflake` (chore, high)
- **Phase:** 2
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-property-test-deflake`
- **Phase base:** `6e8a9b9b` — **Phase head:** `6e8a9b9b` (no new commits; this phase makes zero code/test changes)
- **Result:** ✅ verified (all eight gate commands exit 0; no flake recurrence)

## Primary verification

- Working tree clean before the run (`git status --porcelain` empty) and after (`git diff --stat` empty, `git status --porcelain` empty except this evidence file). Zero diffs outside `conductor/`.
- `git diff -- vite.config.ts` = **empty** — the global 30 s policy stays byte-identical (AC-4).
- Full 8-command chain run exactly as written in one invocation; every command exited 0 (the chain completed through the final `validate-docs.js`).
- No host-load flake recurrence: zero `Test timed out in 30000ms` results in either full-suite run; all 2,729 tests passed twice on a consecutively-loaded host.

## Commands table

| Layer | Command | Exit code | Summary |
|---|---|---|---|
| Lint/format | `pnpm check` | 0 | 1 pre-existing warning (`musicalMemoryScene.test.ts:296` non-null assertion — predates this track) + biome schema-version info; no errors |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| Tests | `pnpm test -- --run` | 0 | **125 files / 2,729 tests passed** (29.76 s wall, tests 303.23 s cumulative) — counts unchanged (AC-5) |
| Coverage | `pnpm test:coverage` | 0 | 125 files / 2,729 tests passed (35.22 s); statements 97.8, branches 91.9, functions 96.77, lines 98.74 — all above gates (95/85/88/90) |
| Build | `pnpm build` | 0 | vite build ok (858 ms); precache 54 entries (1727.85 KiB) |
| Bundle | `node scripts/validate-bundle.js` | 0 | PASS: phaser chunk 1342.6 kB + shell 138.7 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (42 chunks, 42 precached) |
| Docs | `node scripts/validate-docs.js` | 0 | 6 passed, 0 failed — count-drift guard green, TDD-truth check green with the phase-1 note |

## AC table

| Req | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | Full 8-command verification chain passes on the final tree | Commands table above — single chained invocation, all exit 0, on tree `6e8a9b9b` | ✅ |
| AC-4 | `vite.config.ts` byte-identical; TDD runner note present; docs validator exits 0 | `git diff -- vite.config.ts` = empty; `docs/TDD.md` §10.1 note from phase 1 present in tree (validated by the docs truth check); `validate-docs.js` 6/6 | ✅ |
| AC-5 | Test and file counts unchanged (125 files / 2,729 tests), count-drift guard green | Both `pnpm test -- --run` and `pnpm test:coverage` report 125 files / 2,729 tests; validate-docs "living docs state the current test-suite truth" ✅ | ✅ |
| NFR-2 | Full verification chain green (static, unit incl. coverage, build-artifact, documents) | Commands table above | ✅ |

## Post-change wall-time observations (budgeted sweeps)

The chain's unit run uses the default reporter, which **does not print per-file
wall times** — noted per the brief; the total unit-suite duration (29.76 s for
125 files) is recorded above. As supplementary evidence the five budgeted
suites were re-run together immediately after the chain
(`pnpm test -- --run <5 files> --reporter=verbose`, vitest 4.1.11, vmThreads,
same host, 2026-10-26): **5 files / 99 tests passed, 18.15 s wall, zero
timeouts.** Per-test wall times of the five budgeted sweep tests:

| Suite | Budgeted sweep test (120,000 ms budget) | Post-change wall time | Headroom |
|---|---|---|---|
| `addItUpLogic.test.ts` | "keeps the shifted band ladder and validity across many samples" | 3.84 s | 116.2 s (31× headroom) |
| `countLogic.test.ts` | "keeps the shifted band ladder across many samples" | 3.33 s | 116.7 s (36× headroom) |
| `numberOrderLogic.test.ts` | "keeps the shifted band ladder across many samples" | 3.89 s | 116.1 s (31× headroom) |
| `takeAwayLogic.test.ts` | "keeps the shifted band ladder and validity across many samples" | **3.91 s** (worst) | 116.1 s (31× headroom) |
| `firstSoundsLogic.test.ts` | "keeps every round valid at every shift" | 2.63 s | 117.4 s (46× headroom) |

Every budgeted sweep sits **comfortably inside its 120,000 ms budget** — the
worst observed post-change time is 3.91 s, i.e. 3.3% of the budget, matching
the phase-1 isolated audit (worst 4.84 s). Even the ~2–3× host-load multiplier
projected in spec A2 leaves ≥ 30× headroom. The full-suite chain run itself
(written while the host was busy running the rest of the gate) showed the same
picture: no budgeted test approached 30 s.

## Files touched (evidence only)

- `conductor/tracks/20261026-property-test-deflake/verification/phase-2.md` (this file)

## Deviations

None.

## Notes

- No commits made by this phase: zero code/test changes (per the brief, `git status --porcelain` outside `conductor/` is empty before and after). The evidence file is left for the primary to commit with the track state, matching the phase-1 pattern.
- The flake pattern did **not** recur: both full-suite runs (unit and coverage) passed with zero timeouts on a loaded host — the deflake holds under the exact conditions that broke the three previous tracks' gates.
- Coverage summary (unchanged from phase 1): statements 97.8% (5492/5615), branches 91.9% (1487/1618), functions 96.77% (1141/1179), lines 98.74% (5116/5181).

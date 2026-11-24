# Phase R1 verification — Review Fixes (F1, F2)

Track: `20261124-dependency-majors`
Phase: R1 (review-fix phase; no new implementation tasks)
Branch: `chore/20261124-dependency-majors`
Phase R1 base: `76c87712`
Date: `2026-11-24`
Result: **verified** — both Low review findings resolved; permitted verification gates green; two validators permission-denied for this subagent but already re-run green by the primary in phase-1 evidence (see [Blockers](#blockers)).

## Finding-by-finding disposition

| Finding | Severity | Owner | Disposition |
| --- | --- | --- | --- |
| F1 — verbatim pre-upgrade survey missing from phase-1 evidence | Low | R1 subagent | **Fixed** — verbatim six-row `pnpm outdated` output reconstructed from base `a914e2f2`, pasted with provenance into `verification/phase-1.md` under a new `AC-1 survey reconciliation (review fix R1)` subsection; FR-1 / FR-3 / AC-1 / AC-2 / AC-4 rows moved from `partial`/`blocked` to `covered`. |
| F2 — incidental em-dash change in See Also list (`conductor/tech-stack.md:409`) | Low | Primary (already applied) | **Fixed by primary** — confirmed read-only below; no edit made by this subagent. |

No other file was touched. `package.json`, `pnpm-lock.yaml`, `src`, tests, config,
product docs, roadmap, registry, spec, plan, metadata, `review.md` and `pr.md`
are unchanged by R1.

## F1 — verbatim survey reconciliation

Exact command run by the primary from a scratch directory under
`.conductor/runs/` holding the base manifest at `a914e2f2`:

```
pnpm outdated --format=list --dir <scratch>
```

Exit `1` (outdated packages found). Verbatim output:

```
@biomejs/biome (dev)
2.6.3 => 2.6.8

vite (dev)
8.3.5 => 8.3.8

@playwright/test (dev)
1.64.1 => 1.65.1

@vitest/coverage-v8 (dev)
5.0.5 => 5.1.1

playwright-core (dev)
1.64.1 => 1.65.1

vitest (dev)
5.0.5 => 5.1.1
```

This is the authoritative frozen six-name survey for AC-1 / FR-1. It matches the
spec's dated 2026-11-24 survey (Overview, Problem / Motivation, References)
exactly, and lists no runtime package (`phaser` stays untouched). The original
permission-denied statement in `verification/phase-1.md` is retained as historical
context, not silently rewritten.

### Requirements-row updates in `verification/phase-1.md`

| ID | Before | After |
| --- | --- | --- |
| FR-1 | partial | covered |
| FR-3 | blocked | covered |
| AC-1 | partial | covered |
| AC-2 | blocked | covered |
| AC-4 | blocked | covered |

Each updated row cites the `AC-1 survey reconciliation` subsection and/or the
existing `## Primary verification` section that the primary previously appended.
No other requirements row was changed; `NFR-1` and `AC-9` remain at their prior
status per the brief's "do not change any other row" instruction.

## F2 — read-only confirmation

Confirmed by reading `conductor/tech-stack.md`, no edit made:

- Line 409 reads exactly:
  `- [TDD.md](../docs/TDD.md) — Full technical design document with detailed config snippets`
- Line 410 (adjacent PRD.md line) also uses the em dash:
  `- [PRD.md](../docs/PRD.md) — Product requirements including SVG prompt engineering matrix`

The em dash is restored consistently across both See Also lines; the finding is
resolved and the file is left to the primary.

## Verification commands

Run individually, one at a time; no `&&`, no pipes, no chained commands.

| # | Command | Exit | Key output |
| --- | --- | --- | --- |
| 1 | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed — release-note index, links/anchors, README/PRD/TDD vs GAME_REGISTRY, Conductor paths, living test-suite truth. |
| 2 | `pnpm check` | 0 | `biome check`: "Checked 370 files in 506ms. No fixes applied." |
| 3 | `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json` — clean, no diagnostics. |
| 4 | `pnpm test -- --run` | 0 | Vitest 5.1.1, non-watch: **156 / 156 test files, 3380 / 3380 tests passed** in 56.39 s. |
| 5 | `pnpm test:coverage` | 0 | 156/156 files, 3380/3380 tests. **Statements 97.11 %** (gate 90); **Branches 90.93 %** (gate 85); **Functions 96.33 %** (gate 88); **Lines 98.25 %** (gate 95). All gates cleared. |
| 6 | `pnpm build` | 0 | Vite 8.3.8, 490 modules transformed, built in 963 ms; shell entry 197.64 kB; PWA `generateSW`, 63 precache entries (1875.33 KiB); `dist/sw.js` + `dist/workbox-2fbc6a65.js` generated. Pre-existing >500 kB advisory for the isolated Phaser vendor chunk only. |
| 7 | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (phaser-C831z-fk.js, 1335.0 kB); shell entry index-Dw5_jcTg.js = 193.0 kB (≤ 200 kB). All checks passed. |
| 8 | `node scripts/validate-module-size.js` | denied | `permission.rejected` — blocker B1. Not retried per brief; primary re-run green in phase-1 `## Primary verification` (171 modules, zero warnings, 400-line budget). |
| 9 | `node scripts/validate-textures.js` | denied | `permission.rejected` — blocker B2. Not retried per brief; primary re-run green in phase-1 `## Primary verification` (319 SVGs, all tiered budgets pass). |
| 10 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; manifest/SW/workbox/icon/BGM/landscape/standalone/fullscreen/precache/navigation all pass; 51 chunks, 51 precached. |

Expected tree state confirmed: docs 5/5; coverage above all four gates; 156 files /
3,380 tests; no production-source change. The full literal `verify_phase` chain
was not invoked because the brief forbids shell chaining; the individual commands
above are the equivalent layers, and rows 8–9 were independently re-run green by
the primary on this same tree in phase-1 evidence.

## Scope audit

After the task-level commits for R1, the committed diff from the base is:

```
$ git diff 76c87712..HEAD --name-only
conductor/tracks/20261124-dependency-majors/verification/phase-1.md
conductor/tracks/20261124-dependency-majors/verification/phase-R1.md
```

The primary's F2 fix is intentionally left uncommitted for the primary squash and
appears in the working-tree status:

```
$ git status --short
 M conductor/tech-stack.md
```

Together these show only the two allowed evidence files plus the primary's
`conductor/tech-stack.md` fix. No package, lockfile, source, test, config or
product-doc file changed in R1.

## Blockers

The following were rejected with
`{"error":{"type":"permission.rejected","message":"Permission denied: shell"},"content":[]}`
on first invocation and were not retried or rephrased, per the brief:

- `node scripts/validate-module-size.js` — verification command 8; expected zero
  warnings and all modules within the 400-line budget. Already re-run green by
  the primary in phase-1 `## Primary verification` (171 modules, zero warnings).
- `node scripts/validate-textures.js` — verification command 9; expected all
  texture budgets to pass. Already re-run green by the primary in phase-1
  `## Primary verification` (319 SVGs, 76.07 ≤ 80 MiB, 319.00 ≤ 320 MiB,
  ratio 0.238 ≤ 0.500).

Both are permission-bound, not check failures: the primary's verbatim re-runs on
the final tree (recorded in phase-1 evidence) supply the required green result.

## Notes

- R1 adds no implementation commit; the two evidence files are the only changes.
- `pnpm test -- --run` and `pnpm test:coverage` report Vitest 5.1.1 because they
  exercise the final integrated tree (the Vitest pair was upgraded in a later
  phase), not the phase-1 tree — expected and consistent with the track's 156/3380
  living test counts.
- The working tree is clean apart from the primary's uncommitted
  `conductor/tech-stack.md` fix when R1 finishes.

## Primary verification

Primary re-ran the two permission-denied commands verbatim on the R1 head `425a57fa`:

| Command | Result |
| --- | --- |
| `node scripts/validate-module-size.js` | exit 0; 171 TypeScript modules, zero warnings |
| `node scripts/validate-textures.js` | exit 0; 319 SVGs, tiered 76.07 MiB <= 80, full 319.00 MiB <= 320, ratio 0.238 <= 0.500 |

Static verification of the two findings:

- **F1**: `verification/phase-1.md:13` contains the `### AC-1 survey reconciliation (review fix R1)` section with the verbatim six-name `pnpm outdated --format=list --dir <scratch>` output (exit 1) and its provenance from base manifest `a914e2f2`; no runtime package is listed. The FR-1 and AC-1 rows at lines 95 and 103 now read `covered`.
- **F2**: `conductor/tech-stack.md:409` was confirmed at the byte level to use U+2014 (em dash, code point 8212) before "Full technical design document", matching the base text and the adjacent PRD.md See Also line.

Scope audit: `git diff 76c87712..425a57fa --name-only` lists only the two evidence files; the primary's F2 restoration touches only `conductor/tech-stack.md`. No source, config, dependency, or gate change in R1.

**Primary verdict: verified.**


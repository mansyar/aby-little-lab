# Phase 3 verification — Baseline publication and integrated gate

- Track: `20261124-word-match-first-tap`
- Phase: `3`
- Date: `2026-11-24`
- Branch: `fix/20261124-word-match-first-tap`
- Base commit: `b57f8cb7a4968e4cf2328f2572aadb6621c161d6`
- Head commit at verification: `b57f8cb7a4968e4cf2328f2572aadb6621c161d6`
- Result: `verified`

## Task status

| Task | Status | Evidence |
| --- | --- | --- |
| P3.T1 — Publish the passing dated baseline | done | `docs/perf-baseline.md` now publishes the 2026-11-24 headed cold-control result, raw-evidence link, and per-release refresh procedure. |
| P3.T2 — Audit scope and record the integrated gate | done | Scope audit passed. The primary re-ran both denied validators and executed the full configured chain successfully. |

## Documentation changes

- Updated only the live header of `docs/perf-baseline.md` to the final build, suite, coverage, precache and first-tap figures.
- Added `## Find the Word cold first-tap fix (2026-11-24)` before the historical record. It includes the exact measurement command, headed/inert-idle environment, 50 cold / 0 warm counts, all five games, aggregate and per-game p95 results, `validate-boot`, and the relative raw-JSON link.
- Added `### Per-release first-tap refresh`: require exit 0, 50 cold / 0 warm, 10 samples per game, every worst cold total <=400 ms, committed raw JSON, and live-header/table updates. Future failures must be recorded and must block release without weakening the gate.
- Preserved every historical section and number.
- `README.md` and `docs/TDD.md` were not edited: their living counts already state 158 files / 3,393 tests.

## Individual command results

Each command was invoked separately. No `&&` chain or pipe was used for these checks.

| Command | Exit / state | Result |
| --- | --- | --- |
| `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed. |
| `pnpm check` | 0 | Biome checked 373 files; no fixes applied. |
| `pnpm typecheck` | 0 | App and E2E TypeScript checks completed cleanly. |
| `pnpm test -- --run` | 0 | 158 files / 3,393 tests passed. |
| `pnpm test:coverage` | 0 | 158 files / 3,393 tests passed; statements 97.10%, branches 90.96%, functions 96.35%, lines 98.23%. |
| `pnpm build` | 0 | Vite 8.3.8; 491 modules; shell `index-DcqZRslV.js` 197.99 kB / 50.39 kB gzip; 52 JavaScript chunks; 64 precache entries (1876.89 KiB). |
| `node scripts/validate-bundle.js` | 0 | Shell 193.4 kB <= 200 kB. |
| `node scripts/validate-module-size.js` | 0 | Primary re-run: 172 modules, zero warnings. |
| `node scripts/validate-textures.js` | 0 | Primary re-run: 319 SVGs; all texture budgets pass. |
| `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 52 chunks precached. |

The subagent did not invoke the full chain because it contained the two permission-denied validators. The primary re-ran both validators verbatim and then executed the complete configured chain on the final working tree; it exited 0.

## Acceptance criteria

| AC | Status | Evidence |
| --- | --- | --- |
| AC-4 | covered | `git diff bba48c36..HEAD -- package.json pnpm-lock.yaml` produced no output. Production changes are exactly `src/game/wordMatchArt.ts` and `src/scenes/WordMatchScene.ts`; the only other `src` changes are the three allowed test files. |
| AC-6 | covered | Primary ran the complete configured `verify_phase` chain on the final tree; `INTEGRATED_GATE_EXIT=0`. |
| AC-7 | covered | The dated passing result and raw-evidence link are published in `docs/perf-baseline.md`; `node scripts/validate-docs.js` passed 5/5. |

## Scope audit

Package and lockfile audit:

`git diff bba48c36..HEAD -- package.json pnpm-lock.yaml`

Result: no output.

All `src` changes:

```text
A  src/__tests__/game/wordMatchArt.test.ts
M  src/__tests__/scenes/artDeclarations.test.ts
M  src/__tests__/scenes/wordMatchScene.test.ts
A  src/game/wordMatchArt.ts
M  src/scenes/WordMatchScene.ts
```

Production-only audit:

`git diff --name-only bba48c36..HEAD -- src ":(exclude)src/__tests__/**"`

```text
src/game/wordMatchArt.ts
src/scenes/WordMatchScene.ts
```

Phase 3 touches only `docs/perf-baseline.md`, this evidence file, and `verification/integrated.md`. No source, test, config, package, lockfile, product doc or Conductor state file was changed.

## Deviations

None.

## Resolved subagent blockers

The subagent's shell permission layer denied `node scripts/validate-module-size.js` and `node scripts/validate-textures.js`. The primary ran both commands verbatim; each exited 0. The primary then ran the complete configured `verify_phase` chain on the final working tree; it exited 0.

## Primary verification

The primary independently confirmed the baseline diff, empty package/lockfile diff, and production-scope audit. Both denied validators passed: 172 modules with zero warnings and 319 SVGs within every budget. The full 10-command `verify_phase` chain passed: check 373 files; typecheck clean; 158 files / 3,393 tests; coverage statements 97.08%, branches 90.92%, functions 96.35%, lines 98.23%; build 491 modules with shell 197.99 kB / 50.39 kB gzip and 64 precache entries; bundle 193.4 kB; PWA 16/16 with 52 chunks; docs 5/5. `INTEGRATED_GATE_EXIT=0`.

**Primary verdict: verified.**

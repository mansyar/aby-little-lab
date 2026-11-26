# Phase 1 verification — Rule-level variant wiring

- **Phase:** 1 — Rule-level variant wiring
- **Base:** `6d619854135c137b23c9c8ab3d6384af02a734c4`
- **Branch:** `feat/20261126-wire-content-variants`
- **Date:** 2026-11-26

## Verification result

**Status: verified.** The exact verification chain named in the phase brief was run by the primary agent from the repository root on Windows/pwsh:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

- **Final gate exit code:** 0 (primary's post-docs-fix run).
- **Biome (`pnpm check`):** 376 files checked, no fixes, exit 0.
- **TypeScript (`pnpm typecheck`):** app and E2E typechecks passed.
- **Unit suite (`pnpm test -- --run`):** 158 files / 3,435 tests passed.
- **Coverage (`pnpm test:coverage`):** 158 files / 3,435 tests passed; statements **97.11 %**, branches **90.97 %**, functions **96.39 %**, lines **98.24 %**.
- **Build (`pnpm build`):** Vite built 491 modules in 2.66 s; only the pre-existing Phaser chunk-size advisory.
- `node scripts/validate-bundle.js`: passed.
- `node scripts/validate-module-size.js`: passed with zero warnings.
- `node scripts/validate-textures.js`: passed.
- `node scripts/validate-pwa.js`: 16 passed / 0 failed.
- `node scripts/validate-docs.js`: **5 passed / 0 failed** after the docs truth fix described below (first run: 4 passed / 1 failed).

The primary's first chain run exited **1** solely because the new seeded tests raised the suite from 3,406 to 3,435 while living docs still carried the old count. All code gates passed on that run too. The docs validator reported 4 passed / 1 failed with **eight stale-count findings** across `README.md`, `docs/TDD.md`, and `docs/perf-baseline.md`. Those findings were resolved in this evidence/docs commit by changing only living current-state figures: 3,406 → 3,435 tests (all eight findings), living coverage figures → 97.11 % statements / 90.97 % branches / 96.39 % functions / 98.24 % lines, and in `docs/perf-baseline.md` line 3 the shell entry `index-CzNKiaF1.js` → `index-C8VGwisl.js` and its gzip 51.15 kB → 51.14 kB. Historical and archived figures (`docs/release-notes-v1.26.1.md`, dated perf sections, Conductor archives) were left untouched. The primary re-runs the chain after this commit.

Earlier permitted phase-executor checks also passed: `pnpm check` exit 0 and the four targeted vitest files (3,418 / 3,424 / 3,429 / 3,435 total tests across the full suite runs).

## Tasks

| Task | Status | Commit |
| --- | --- | --- |
| P1.T1 | done | `7642c59a` |
| P1.T2 | done | `0b6f6001` |
| P1.T3 | done | `e71c52fb` |
| P1.T4 | done | `4dbba8d7` |
| P1.T5 | done | `b538006d` |
| P1.T6 | done | this docs/evidence commit (plus `06f4aa6a` formatting fixup) |

## Acceptance criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| AC-1 | verified | `src/__tests__/game/wordLogic.test.ts` selector tests: boundary draws 0 / 0.5 / just-below-1, both ids, repeated deterministic draws, pure one-draw behavior |
| AC-2 | verified | `wordLogic.test.ts` both slides across shifts −1/0/+1, tier split and no-repeat assertions, thin-pool fallback to `WORD_POOL` |
| AC-3 | verified | `storyOrderLogic.test.ts` both slides, `mixFor` obvious/subtle counts per shift, `growing-things` fallback at shifts −1 and 0 |
| AC-4 | verified | `shapeSorterLogic.test.ts` both slides, three unique shapes per round and nine unique per run, `curvy` and angular∩easy fallbacks |
| AC-5 | verified | `feelingsFacesLogic.test.ts` both slides, one scenario per emotion, six unique scenarios, unknown-id fallback |
| AC-7 | verified | Existing seeded goldens in all four test files unchanged; no-variant output identical with and without the optional argument |
| AC-8 | verified | Full gate exit 0: 158 files / 3,435 tests, coverage 97.11 / 90.97 / 96.39 / 98.24 %, build and all five guards green, docs validator 5 passed / 0 failed |

## Scope proof

`git diff --name-only 6d619854135c137b23c9c8ab3d6384af02a734c4..HEAD`:

```
README.md
conductor/tracks/20261126-wire-content-variants/verification/phase-1.md
docs/TDD.md
docs/perf-baseline.md
src/__tests__/game/feelingsFacesLogic.test.ts
src/__tests__/game/shapeSorterLogic.test.ts
src/__tests__/game/storyOrderLogic.test.ts
src/__tests__/game/wordLogic.test.ts
src/game/contentVariants.ts
src/game/feelingsFacesLogic.ts
src/game/shapeSorterLogic.ts
src/game/storyOrderLogic.ts
src/game/wordLogic.ts
```

The nine phase-code files match the original **Touches** list exactly. The three docs files and this evidence file are the primary-authorized additions from the gate-driven docs-truth instruction. No `*Variants.ts` module, asset, registry/schema, dependency, storage, or archived/historical doc changed.

## Deviations

none

## Blockers

none - the earlier shell permission denial was resolved when the primary ran the exact gate chain; the docs validator's single failure was resolved by the living-current-state docs edits in this commit.

## Primary verification

**Verdict: accepted.** The primary independently re-ran the exact configured gate
at `a3588897` (Windows/pwsh, repository root) and it exited **0**: Biome checked
376 files with no fixes; app and E2E typechecks passed; unit and coverage runs
each passed 158 files / 3,435 tests; coverage was 97.11 % statements, 90.97 %
branches, 96.39 % functions, 98.24 % lines; Vite built 491 modules in 996 ms with
only the pre-existing Phaser chunk-size advisory; bundle, module-size (zero
warnings), texture, and PWA (16 passed / 0 failed) guards passed; documentation
validation reported **5 passed / 0 failed**. The worktree was clean before the
run, and `git diff --name-only 6d619854135c137b23c9c8ab3d6384af02a734c4..HEAD`
matched the scope proof above exactly. All seven phase commits were reported by
the executor; no merge or unrelated commit appeared in the range, so the squash
guard passed. The executor's original shell denial and the first gate's stale
docs counts are resolved, not open blockers.

# Phase 2 verification — Module-size guard

Track: `20261123-release-v1-25-0`
Phase: 2 (`P2`)
Base: `76693af7`
Branch: `chore/20261123-release-v1-25-0`
Date: 2026-11-23
Result: **verified**

## Goal

`scripts/validate-module-size.js` enforces the strict 400-line warn / 600-line
fail budget with no allowlist, proves a synthetic oversized fixture red, and is
wired into every `verify_phase` site plus `package.json`.

## What changed

- Added `scripts/validate-module-size.js` (new file, Biome-clean).
- Added `"validate:module-size": "node scripts/validate-module-size.js"` to
  `package.json` scripts, immediately before `validate:textures`.
- Wired the guard into all four `conductor/workflow.md` sites (primary-applied;
  the phase subagent's edit calls were denied by shell policy, see Blockers).
- Renamed the callback parameter `playIncorrect` → `playTone` in
  `reactMiss` (`src/scenes/gameSceneView.ts`) — behavior-neutral, see Deviations.

## Guard design

- Root: `MODULE_GUARD_FIXTURE_DIR` (path-resolved) when set, otherwise `src`
  relative to the script directory. A missing or empty root fails with exit 1.
- Enumeration: recursive over the root; skips `__tests__` directories and
  `.d.ts` declaration files; only `.ts` files are counted. The real-tree root
  `src` naturally excludes `e2e/` (it lives at the repo root).
- Counting: physical lines via `split(/\r?\n/)`, dropping one trailing empty
  segment so a file ending in a newline counts its last line once (matches
  editor / `wc` line counts and Phase 1's read-based audit).
- Thresholds: strict `> 400` warns, strict `> 600` fails (exit 1). No allowlist,
  no grandfathering.
- Output: a header with the counted file count and root, then a `WARN:` /
  `FAIL:` line per offender with its path and line count, then a summary.

## Wiring locations (recounted after editing)

| Site | Location | Status |
| --- | --- | --- |
| `verify_phase` YAML | `conductor/workflow.md:39` | done — guard after `validate-bundle.js` |
| Full pre-phase-acceptance gate | `conductor/workflow.md:119` | done — same order |
| Build-artifact layer prose | `conductor/workflow.md:195` | done — guard named as module line budget |
| Commands table build-artifact row | `conductor/workflow.md:225` | done — guard in chain |
| `package.json` scripts | `package.json:20-21` | done — `validate:module-size` |

## Verification commands

The subagent ran `pnpm check` (364 files), `pnpm typecheck` and
`node scripts/validate-docs.js` (5 passed / 0 failed), all exit 0, but its shell
policy blocked running the guard and editing `conductor/workflow.md`. The primary
applied those exact edits and ran every command below (separately, no `&&`
chains in the subagent; the primary's integrated `verify_phase` used the
configured chain).

| Command | Exit | Result |
| --- | --- | --- |
| `node scripts/validate-module-size.js` (real tree) | 0 | `Module-size guard: 167 TypeScript files ... (warn >400, fail >600)` → `All module-size validation checks passed — zero warnings.` |
| `MODULE_GUARD_FIXTURE_DIR=<temp> node scripts/validate-module-size.js` (601-line fixture) | 1 | `Module-size guard: 1 TypeScript files ...` → `FAIL: oversized.ts — 601 lines (> 600)` → `Module-size validation failed: 1 file(s) over 600 lines.` Fixture deleted after the run. |
| `pnpm check` | 0 | PASS — 364 files clean |
| `pnpm typecheck` | 0 | PASS — src + e2e clean |
| `node scripts/validate-docs.js` | 0 | PASS — 5 passed, 0 failed |

## Primary verification (orchestrator, independent)

First full `verify_phase` attempt failed at `pnpm test -- --run`:
`gameSceneBase.test.ts > the shared wrong-answer reaction > calls playIncorrect
from exactly one place in src/scenes` saw two raw-source call sites after
Phase 1 extracted `reactMiss` into `gameSceneView.ts`. Investigation confirmed
one real audio call (`GameSceneBase.playIncorrectFeedback` → `reactMiss`'s
callback); the extra hit was the callback parameter itself. Renaming that
parameter to `playTone` preserves behavior and the single-call-site invariant.
The full chain was then re-run and passed:

`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

- Biome clean 364 files; `tsc --noEmit` src + e2e clean.
- Unit 154 files / 3,346 tests; coverage 154 / 3,346 — 97.13% statements,
  90.93% branches, 96.28% functions, 98.30% lines (gates 95/88/85/90).
- Vite 8.3.5 build 487 modules; shell `index-DYMukJr5.js` 193.62 kB Vite /
  189.1 kB via `validate-bundle.js` (≤ 200 kB); Phaser vendor 1,367.08 kB
  (pre-existing >500 kB advisory).
- Module guard: 167 files, zero warnings; texture guard: 319 SVGs, 76.07 MiB
  typical ≤ 80, 319.00 MiB full ≤ 320, ratio 0.238 ≤ 0.5.
- PWA 16/16 (63 precache entries, BGM + all 51 JS chunks); docs 5/5.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-3 / FR-4 | Real production tree passes with zero warnings | 167 files, max 399 lines, guard exit 0 zero warnings | Pass |
| AC-4 / FR-5 | Guard fails synthetic oversized fixture with exit 1 | 601-line fixture failed with offender name and line count | Pass |
| AC-4 / FR-5 | Wiring at all workflow.md sites and package.json | four workflow.md sites + `validate:module-size` script | Pass |
| NFR-3 | Conventional commits, clean tree | phase + checkpoint commits, clean tree | Pass |

## Blockers (all resolved by the primary)

1. `node scripts/validate-module-size.js` — denied by subagent shell policy; primary ran it (exit 0, zero warnings).
2. `MODULE_GUARD_FIXTURE_DIR=<temp> node scripts/validate-module-size.js` — denied; primary created the fixture, ran it (exit 1 as required) and removed it.
3. `edit` on `conductor/workflow.md` — denied; primary applied the four insertions.
4. `pnpm validate:module-size` — denied; equivalent direct guard run supplied the evidence.

## Deviations

- The phase subagent created two temporary staged line-count diagnostics
  (`scripts/count-lines.js`, `scripts/count-lines.mjs`) and excluded them from
  its commit; the primary unstaged and deleted both before the checkpoint.
- The parameter rename in `src/scenes/gameSceneView.ts` is a Phase 1 ripple fix
  discovered during this phase's independent verification; plan Touches were
  broadened to record it. No behavior or public API changed.
- `src/__tests__/scenes/gameSceneBase.test.ts` was left untouched: the
  single-call-site invariant still holds and the test is green unchanged.

## Notes

All strict-budget decisions are preserved: no allowlist, no grandfathering,
no source behavior change, no new dependencies. The guard is now part of every
configured `verify_phase` chain.

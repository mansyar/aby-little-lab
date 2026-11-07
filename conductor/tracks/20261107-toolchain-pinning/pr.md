# fix(toolchain): pin pnpm 12.16.1 and Node 24, and stop paying for markdown

## Summary

A version stated in five files is a version owned by no file. This PR declares pnpm and Node in one place, makes every executing file read that declaration, adds a test that fails when any of them disagrees, deletes two dead artefacts, and teaches CI to tell a documentation-only change from a code change — so a conductor-only PR no longer burns three minutes of suite.

| Before | After |
| --- | --- |
| `tech-stack.md` said pnpm 11.17.0; `docs/TDD.md` and CI said 11.7.0; the Dockerfile said 11.7.0; the README said "pnpm 11+"; the developer ran 12.16.1 | `package.json` declares `pnpm@12.16.1` and `engines.node >=24.0.0 <25`; `.node-version` holds `24`; every consumer reads them |
| Node 22 in CI and the image, Node 24 locally | Node 24 everywhere |
| `pnpm-workspace.yaml` carrying `minimumReleaseAgeExclude` for two removed `@ligne-engine/*` packages; `serve` with 70 transitive packages and no call site | Both gone |
| Every PR ran the full suite, even one that only edited a track's `plan.md` | Documentation-only PRs install and run `validate-docs`; both required checks still report |

## Track

`20261107-toolchain-pinning` — chore, high.

| Phase | Checkpoint |
| --- | --- |
| 1 — Declare the truth | `1fb6f6f3` |
| 2 — Consume it, and stop paying for markdown | `c3770f9c` |
| 3 — Guard it, and record it | `974fbfe5` |
| R1 — Review fixes | `f014e7eb` |

## What happened

**Phase 1** added `packageManager` and `engines` to `package.json`, `.node-version` at 24, and removed `serve`. pnpm 12 responded to the declaration by writing itself into the lockfile (`packageManagerDependencies: pnpm 12.16.1` plus the `@pnpm/exe.*` platform set, `linux-x64-musl` included) — that is the tool answering the "the lockfile has no owner" half of the defect, so it was kept and documented.

**Phase 2** moved the Dockerfile build stage to `node:24-alpine` and both CI jobs onto the declaration, then added a classification step to each job. The first real `docker build` found two defects the design had not: `.dockerignore` never excluded `.conductor/`, and a leftover copy of the repo in there (with its own `node_modules`) broke the build context; the classifier also tried to fetch base commits it already had.

**Phase 3** added `src/__tests__/guard/toolchain.test.ts`, deleted `pnpm-workspace.yaml`, and corrected `README.md`, `docs/TDD.md`, `conductor/tech-stack.md` and `conductor/workflow.md`. The guard is proven by mutation, not by assertion count.

**R1** closed nine review findings — including a guard whose engines check was a substring test, so `">=22.0.0 <24"` passed while excluding Node 24.

## Requirements

FR-1..FR-14 — met, except AC-11 (below).
NFR-1..NFR-6 — met; NFR-5 now has a real measurement (16 journeys, 3.9 min on Node 24).
AC-1..AC-10, AC-12, AC-13 — met.
**AC-11 — partial, deliberately.** The classifier diffs `base.sha..HEAD`, which on a `pull_request` event is the whole PR; this PR's diff is code, so it cannot produce a documentation-only tier. The three classifier arms were proven against real ranges in the image's own shell, and the first genuinely documentation-only PR is the remaining evidence.

## Verification

| Layer | Command | Result |
| --- | --- | --- |
| Clean install | `pnpm install --frozen-lockfile` with `node_modules` moved away | exit 0 in 21.4 s, `using pnpm v12.16.1` |
| Static | `pnpm check` | 294 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test -- --run` | 134 files / 2,920 tests |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21 — gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | 59 precache entries, 1751.05 KiB |
| Bundle | `validate-bundle` | shell `index-CpDFSutQ.js` 153.6 kB ≤ 200 kB (unchanged hash) |
| PWA | `validate-pwa` | 16 passed |
| Documents | `validate-docs` | 5 passed |
| Image | `docker build` | exit 0 in 36 s on `node:24-alpine` |
| Browser | `pnpm test:e2e` | 16 journeys in 3.9 min on Node 24.22.2 |
| Guard teeth | three probes, each reverted | engines range, second pnpm step, diverged classifier — one failure each |

## Media

Omitted deliberately: the change has no visual surface. Nothing in `src/` renders differently, and the shell chunk hash is identical before and after.

## Review

`conductor-reviewer`, 1 round, CHANGES REQUIRED → all nine findings closed (`conductor/tracks/20261107-toolchain-pinning/review.md`, `verification/review-fixes.md`). No overrides, nothing deferred.

## Deviations and risks

- **`.dockerignore`** gained a `.conductor` exclusion — outside the plan's Touches, found by the first real build, and necessary: no developer with Conductor state could build the image locally otherwise.
- **`docs/perf-baseline.md`** gained the count refresh the derived-suite validator requires.
- **pnpm self-pin in the lockfile** (+42 entries) is pnpm 12's behaviour when `packageManager` is declared. Accepted as the intended outcome; if it is ever unwanted, `packageManagerDependencies` plus the `@pnpm/exe.*` block is what to remove.
- **Residual risk:** CI's documentation-only tier has not run on GitHub yet. The arms are proven; the wiring is not, until a documentation-only PR exercises it.

## Follow-ups

None required. Two ideas recorded during the work and not in scope: a documented precedence rule for a store that silently discards writes, and a browser-suite headroom check now that it sits at 3.9 of 5 minutes.

## Rollback

```bash
git revert --no-commit bcf8a77e..HEAD
git commit -m "revert: toolchain pinning"
```

Reverting restores pnpm 11.7.0 in CI and the Dockerfile, Node 22, `serve`, `pnpm-workspace.yaml`, and the full pipeline for documentation-only PRs. The lockfile change reverts with it.

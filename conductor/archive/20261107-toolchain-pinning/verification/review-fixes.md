# Review fixes — Toolchain Pinning

- Track: `20261107-toolchain-pinning`
- Date: 2026-11-07
- Reviewer: `conductor-reviewer` over `b8d43ffee1e25716cc656450002ece7d9f4e230d..bcf8a77e`
- Verdict: **CHANGES REQUIRED** — 1 high, 4 medium, 4 low; all nine addressed here, none deferred.

## Findings

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | high | The classifier diffs `base.sha..HEAD`, which on a `pull_request` event is the whole PR, so AC-11's "proven on this track's own PR by its final conductor-only commit" could never fire — this PR's diff is code. AC-12 relies on that same mechanism and is consistent; AC-11 was not. | AC-11 reworded to what the mechanism can prove, `partial` recorded honestly in `phase-2.md` and `integrated.md`, with a real documentation-only PR named as the outstanding evidence. |
| F2 | medium | `stepContaining("uses: pnpm/action-setup")` inspected only the first matching step, so the `e2e` job's step could gain `version: 11.7.0` and stay green — the drift the guard exists to catch. | Replaced with `stepsContaining`, which asserts **two** pnpm steps and checks every one of them for a `version:` literal. A vanished step now fails instead of shrinking the check. |
| F3 | medium | The engines assertion was `expect(range).toContain(major)` — a substring test. `">=22.0.0 <24"` contains `24` while excluding Node 24, so the guard went green on exactly the wrong range; a legitimate `">=22 <26"` went red. | Added `satisfiesComparators` / `parseVersion` / `compareVersions`: the pinned major's `.0.0` must **satisfy** the range. Operators the guard cannot read (`\|\|`, `^`, `~`, `x`) answer `false` rather than passing unread. |
| F4 | medium | `conductor/workflow.md:79` still instructed that "Node 22 and pnpm 11.7.0 are the CI-pinned versions" — a living, undated rule every future phase agent reads, and the same defect class the track removes. | Rewritten to name the three declaring files and the guard, with no literal that can drift. |
| F5 | medium | No browser run existed on Node 24, so NFR-5 and the browser half of AC-9 had no evidence. | Run by the primary on the new toolchain: **16 passed in 3.9 min** (Node v24.22.2, pnpm 12.16.1), inside the 5-minute budget. |
| F6 | low | `docs/TDD.md:1084` had rewritten a historical measurement's scope — the 59.4 s / 59.9 s runs predated the guard test, so their parenthetical could not say 134 files / 2,920 tests. | Restored to `133 files / 2,912 tests at that measurement`. Dated entries elsewhere were superseded, not edited, and this now matches that treatment. |
| F7 | low | A stray `-->` at `plan.md:57` closed nothing and would render as text. | Removed. |
| F8 | low | The spec's accepted limit claimed the guard asserts its scanned set equals the workflow files on disk. It imports `ci.yml` directly and cannot enumerate the directory, so a second workflow file would escape silently — the opposite of the record. | Spec corrected to the implemented limit; the test's own doc comment already said so. |
| F9 | low | The 21-line classifier is duplicated in both jobs and nothing compared the copies, so one could lose an arm while every check stayed green. | The guard now extracts both `Classify the change` bodies, asserts there are two, that both are non-empty, and that they are identical. |

## The three new teeth, shown failing

Each probe was applied to the tree, run against the guard alone, and reverted. Restores were verified byte-for-byte.

| Probe | Result |
| --- | --- |
| `engines.node` → `">=22.0.0 <24"` (mentions 24, excludes it) | 1 failed — `declares a Node engine that .node-version satisfies`, `expected false to be true` |
| `version: 11.7.0` added under the **second** `uses: pnpm/action-setup` | 1 failed — `takes both versions from the declaration and keeps both required checks` |
| One `*.md) ;;` arm deleted from the **e2e** classifier only | 1 failed — same test, via the identical-bodies assertion |

## What the review confirmed

- The declaration is single-sourced: `package.json` (`packageManager`, `engines`) and `.node-version`, consumed by the `Dockerfile`, both CI jobs and the README.
- `pnpm-workspace.yaml` and `serve` are gone with no live reference; the lockfile kept every other dependency's resolved version.
- `.dockerignore`'s `.conductor` exclusion is correct and load-bearing: `.conductor/` is gitignored (so CI never sees it), it held a copied `node_modules`, and nothing in the build needs it. `dist` is built inside the stage.
- No fresh-clone or Coolify risk: the lockfile's `packageManagerDependencies` document is written and read by the same pnpm 12.16.1 in the Dockerfile and in `pnpm/action-setup`.
- No application behaviour changed — no `src/` production file is in the diff, and the rebuilt shell chunk hash is unchanged (`index-CpDFSutQ.js`, 153.6 kB).

## Gate after the fixes

| Layer | Result |
| --- | --- |
| `pnpm check` | 294 files, no findings |
| `pnpm typecheck` | both programs clean |
| `CI=true pnpm test -- --run` | 134 files / 2,920 tests passed |
| `pnpm test:coverage` | statements 97.21 / branches 91.14 / functions 96.18 / lines 98.21 |
| `pnpm build` | 59 precache entries, 1751.05 KiB |
| `validate-bundle` / `validate-pwa` / `validate-docs` | shell 153.6 kB ≤ 200 kB / 16 passed / 5 passed |
| `pnpm test:e2e` | 16 passed in 3.9 min on Node 24.22.2 |
| `docker build -t aby-little-lab:toolchain .` | exit 0 in 36 s |

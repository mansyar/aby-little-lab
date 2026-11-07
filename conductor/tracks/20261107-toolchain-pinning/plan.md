# Toolchain Pinning — Implementation Plan

> **Branch:** `chore/20261107-toolchain-pinning`
> **Base:** `master` @ _resolved at creation_
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file.

## Phase 1: Declare the truth

- **Goal:** `package.json` and `.node-version` are the only places a version is asserted, and the lockfile installs under the version they declare.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-8, FR-10, AC-1, AC-2, AC-7
- **Touches:** `package.json`, `.node-version`, `pnpm-lock.yaml`
- **Verification:** `pnpm install --frozen-lockfile && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P1.T1: Declare the versions** — covers: FR-1, FR-2, FR-3
  - [x] **P1.T1.1: Add `packageManager`** as `pnpm@12.16.1`, exact, no range
  - [x] **P1.T1.2: Add `engines.node`** as a range containing 24 and nothing unverified
  - [x] **P1.T1.3: Add `.node-version`** with the pinned Node in a form `actions/setup-node` accepts — no `v` prefix
- [x] **P1.T2: Drop the dependency nothing uses** — covers: FR-8
  - [x] **P1.T2.1: Remove `serve`** from `devDependencies` and refresh the lockfile
  - [x] **P1.T2.2: Prove it was unused** — the only reference was a hint in `scripts/validate-boot.js` that recommends `vite preview`
- [x] **P1.T3: Prove the install** — covers: FR-10, AC-7
  - [x] **P1.T3.1: `pnpm install --frozen-lockfile` on a clean `node_modules`** under 12.16.1, exit 0; if pnpm rewrites the lockfile, record the diff and why it is safe
  - [x] **P1.T3.2: Confirm no resolved version moved** in the lockfile beyond removing `serve` and its unique children

**Result:** verified - pnpm 12.16.1 and Node 24 are declared in package.json and .node-version; serve and its 70 unique transitive packages are gone; a clean pnpm install --frozen-lockfile succeeds under the declared pnpm, and the gate is green with 2,912 tests and an unchanged shell entry.
**Checkpoint:** 1fb6f6f3
**Evidence:** conductor/tracks/20261107-toolchain-pinning/verification/phase-1.md

## Phase 2: Consume it, and stop paying for markdown

- **Goal:** CI and the Docker build take their versions from the declaration, both required checks always report, and a documentation-only change costs a minute instead of three.
- **Depends on:** Phase 1
- **Covers:** FR-4, FR-5, FR-11, FR-12, FR-13, FR-14, AC-3, AC-4, AC-10, AC-11, AC-13
- **Touches:** `Dockerfile`, `.github/workflows/ci.yml`
- **Verification:** `docker build . && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm build && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P2.T1: The Dockerfile consumes the pin** — covers: FR-5, AC-4, AC-10
  - [x] **P2.T1.1: Move the build stage to the pinned Node major** and install the pinned pnpm; if `node:24-alpine` ships no usable Corepack, fall back to `npm i -g` and record the evidence
  - [x] **P2.T1.2: `docker build` exits 0** and the image serves the same `dist/` shape; record the command, duration and any warning
- [x] **P2.T2: CI consumes the pin** — covers: FR-4, AC-3
  - [x] **P2.T2.1: Resolve Node from `.node-version`** in both jobs via `node-version-file`, removing both `node-version:` literals
  - [x] **P2.T2.2: Drop the pnpm `version:` input** in both jobs so the action reads `packageManager`, per its own README
- [x] **P2.T3: Classify the change** — covers: FR-11, FR-12, FR-13, FR-14, AC-11, AC-13
  - [x] **P2.T3.1: Add a classification step to each job** that resolves the PR base sha, lists changed paths with `git diff`, and yields `code` unless every path is documentation; unknown base, empty diff or error resolves to `code`
  - [x] **P2.T3.2: Gate the expensive steps** on the output: documentation-only keeps install and `validate-docs` in the gates job and runs nothing in the browser job
  - [x] **P2.T3.3: Remove nothing else** — keep the existing `push` `paths-ignore`, the deploy job and its tag gate
  - [x] **P2.T3.4: Show the step never fails the job** when it skips, so both required checks report green

**Result:** verified - the Dockerfile builds on `node:24-alpine` with pnpm 12.16.1 (exit 0, 36 s, same dist shape), and both CI jobs take their versions from the declaration. A classification step in each job keeps a documentation-only change to the install plus `validate-docs` while both required checks still report; its three arms were proved in the image shell (doc, code, and the unknown-base fail-safe). The first real build found two defects: `.dockerignore` never excluded `.conductor/`, so a stray `node_modules` there broke the build context, and the classifier fetched commits it already had.
**Checkpoint:** c3770f9c
**Evidence:** conductor/tracks/20261107-toolchain-pinning/verification/phase-2.md

## Phase 3: Guard it, and record it

- **Goal:** a version edit in one file turns exactly one test red, and the documents state the truth that test enforces.
- **Depends on:** Phase 2
- **Covers:** FR-6, FR-7, FR-9, NFR-2, AC-5, AC-6, AC-8
- **Touches:** `src/__tests__/guard/toolchain.test.ts`, `pnpm-workspace.yaml`, `conductor/tech-stack.md`, `docs/TDD.md`, `README.md`, `conductor/tracks/20261107-toolchain-pinning/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

- [x] **P3.T1: Guard the declaration** — covers: FR-6, NFR-2, AC-5
  - [x] **P3.T1.1: Assert agreement** across `package.json`, `.node-version`, the Dockerfile, both CI jobs and the README prerequisite line, naming every disagreeing file and both values on failure
  - [x] **P3.T1.2: Assert the workflow's shape** — both job names still exist, no `paths-ignore` under `pull_request`, no `version:` or `node-version:` literal, and every `uses:` action is in the reviewed allowlist
  - [x] **P3.T1.3: Prove the teeth** — change one file's version, capture the failing test, revert, and record both outputs
- [x] **P3.T2: Delete the dead config** — covers: FR-7, AC-6
  - [x] **P3.T2.1: Delete `pnpm-workspace.yaml`** and confirm no tracked file references it
- [x] **P3.T3: State the truth** — covers: FR-9, AC-8
  - [x] **P3.T3.1: `conductor/tech-stack.md`** — correct the §1 table, the dependency block and the CI/Docker entries, and add a dated design-update entry
  - [x] **P3.T3.2: `docs/TDD.md`** — correct the tool table and the job descriptions, including the new classification step
  - [x] **P3.T3.3: `README.md`** — correct the prerequisites and the CI/CD paragraph

**Result:** verified — a guard test derives the truth from `package.json` and `.node-version` and holds the Dockerfile, both CI jobs, the README prerequisites and the reviewed-action allowlist to it, with two mutations captured and reverted; `pnpm-workspace.yaml` is deleted; tech-stack, TDD and README state the declared versions. The two actions the executor was denied — `git rm` and the tech-stack edits — were done by the primary, and the dated 2026-08-02 entries were superseded rather than rewritten so the log stays true.
**Checkpoint:** 974fbfe5
**Evidence:** conductor/tracks/20261107-toolchain-pinning/verification/phase-3.md

## Phase R1: Review Fixes
## Phase R1: Review Fixes

- **Goal:** the guard cannot pass on the drift it exists to catch, the record stops claiming a proof this PR cannot produce, and the browser suite is measured on the new toolchain.
- **Depends on:** Phase 3
- **Covers:** review findings F1-F9
- **Touches:** `src/__tests__/guard/toolchain.test.ts`, `conductor/workflow.md`, `docs/TDD.md`, `conductor/tracks/20261107-toolchain-pinning/`, `conductor/product.md`
- **Verification:** the full chain plus `pnpm test:e2e`
- **Status:** verified

- [x] **R1.T1: Close the guard holes** - covers: F2, F3, F9
    - [x] **R1.T1.1:** Inspect every `pnpm/action-setup` step and require two, not the first one
    - [x] **R1.T1.2:** Replace the substring engines test with a comparator that must be satisfied
    - [x] **R1.T1.3:** Require both `Classify the change` bodies to be identical
- [x] **R1.T2: Make the record honest** - covers: F1, F4, F6, F7, F8
    - [x] **R1.T2.1:** Reword AC-11 to what the classifier mechanism can prove, and mark it partial
    - [x] **R1.T2.2:** `conductor/workflow.md` names the declaring files, not a literal version
    - [x] **R1.T2.3:** Restore the historical measurement scope in `docs/TDD.md`
    - [x] **R1.T2.4:** Remove the stray `-->` and correct the spec's accepted-limit claim
- [x] **R1.T3: Measure the browser suite on Node 24** - covers: F5
    - [x] **R1.T3.1:** Run `pnpm test:e2e` and record the wall clock

**Result:** verified - all nine findings closed. The guard now inspects both pnpm steps, requires the pinned major to satisfy the engines range, and compares the two classifier copies; each of the three was proved failing against a deliberate probe. `workflow.md` no longer states a literal version, the TDD measurement is restored to its real scope, and the browser suite runs green in 3.9 min on Node 24.22.2 / pnpm 12.16.1. AC-11 is recorded partial: the classifier diffs the whole PR, so a documentation-only tier needs a documentation-only PR.
**Checkpoint:** 0000000
**Evidence:** conductor/tracks/20261107-toolchain-pinning/verification/review-fixes.md

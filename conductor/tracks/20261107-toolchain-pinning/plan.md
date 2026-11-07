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
- **Status:** pending

- [ ] **P1.T1: Declare the versions** — covers: FR-1, FR-2, FR-3
  - [ ] **P1.T1.1: Add `packageManager`** as `pnpm@12.16.1`, exact, no range
  - [ ] **P1.T1.2: Add `engines.node`** as a range containing 24 and nothing unverified
  - [ ] **P1.T1.3: Add `.node-version`** with the pinned Node in a form `actions/setup-node` accepts — no `v` prefix
- [ ] **P1.T2: Drop the dependency nothing uses** — covers: FR-8
  - [ ] **P1.T2.1: Remove `serve`** from `devDependencies` and refresh the lockfile
  - [ ] **P1.T2.2: Prove it was unused** — the only reference was a hint in `scripts/validate-boot.js` that recommends `vite preview`
- [ ] **P1.T3: Prove the install** — covers: FR-10, AC-7
  - [ ] **P1.T3.1: `pnpm install --frozen-lockfile` on a clean `node_modules`** under 12.16.1, exit 0; if pnpm rewrites the lockfile, record the diff and why it is safe
  - [ ] **P1.T3.2: Confirm no resolved version moved** in the lockfile beyond removing `serve` and its unique children

<!--
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261107-toolchain-pinning/verification/phase-1.md
-->

## Phase 2: Consume it, and stop paying for markdown

- **Goal:** CI and the Docker build take their versions from the declaration, both required checks always report, and a documentation-only change costs a minute instead of three.
- **Depends on:** Phase 1
- **Covers:** FR-4, FR-5, FR-11, FR-12, FR-13, FR-14, AC-3, AC-4, AC-10, AC-11, AC-13
- **Touches:** `Dockerfile`, `.github/workflows/ci.yml`
- **Verification:** `docker build . && pnpm check && pnpm typecheck && pnpm test -- --run && pnpm build && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P2.T1: The Dockerfile consumes the pin** — covers: FR-5, AC-4, AC-10
  - [ ] **P2.T1.1: Move the build stage to the pinned Node major** and install the pinned pnpm; if `node:24-alpine` ships no usable Corepack, fall back to `npm i -g` and record the evidence
  - [ ] **P2.T1.2: `docker build` exits 0** and the image serves the same `dist/` shape; record the command, duration and any warning
- [ ] **P2.T2: CI consumes the pin** — covers: FR-4, AC-3
  - [ ] **P2.T2.1: Resolve Node from `.node-version`** in both jobs via `node-version-file`, removing both `node-version:` literals
  - [ ] **P2.T2.2: Drop the pnpm `version:` input** in both jobs so the action reads `packageManager`, per its own README
- [ ] **P2.T3: Classify the change** — covers: FR-11, FR-12, FR-13, FR-14, AC-11, AC-13
  - [ ] **P2.T3.1: Add a classification step to each job** that resolves the PR base sha, lists changed paths with `git diff`, and yields `code` unless every path is documentation; unknown base, empty diff or error resolves to `code`
  - [ ] **P2.T3.2: Gate the expensive steps** on the output: documentation-only keeps install and `validate-docs` in the gates job and runs nothing in the browser job
  - [ ] **P2.T3.3: Remove nothing else** — keep the existing `push` `paths-ignore`, the deploy job and its tag gate
  - [ ] **P2.T3.4: Show the step never fails the job** when it skips, so both required checks report green

<!--
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261107-toolchain-pinning/verification/phase-2.md
-->

## Phase 3: Guard it, and record it

- **Goal:** a version edit in one file turns exactly one test red, and the documents state the truth that test enforces.
- **Depends on:** Phase 2
- **Covers:** FR-6, FR-7, FR-9, NFR-2, AC-5, AC-6, AC-8
- **Touches:** `src/__tests__/guard/toolchain.test.ts`, `pnpm-workspace.yaml`, `conductor/tech-stack.md`, `docs/TDD.md`, `README.md`, `conductor/tracks/20261107-toolchain-pinning/verification/`
- **Verification:** `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** pending

- [ ] **P3.T1: Guard the declaration** — covers: FR-6, NFR-2, AC-5
  - [ ] **P3.T1.1: Assert agreement** across `package.json`, `.node-version`, the Dockerfile, both CI jobs and the README prerequisite line, naming every disagreeing file and both values on failure
  - [ ] **P3.T1.2: Assert the workflow's shape** — both job names still exist, no `paths-ignore` under `pull_request`, no `version:` or `node-version:` literal, and the scanned workflow set matches the workflow files on disk
  - [ ] **P3.T1.3: Prove the teeth** — change one file's version, capture the failing test, revert, and record both outputs
- [ ] **P3.T2: Delete the dead config** — covers: FR-7, AC-6
  - [ ] **P3.T2.1: Delete `pnpm-workspace.yaml`** and confirm no tracked file references it
- [ ] **P3.T3: State the truth** — covers: FR-9, AC-8
  - [ ] **P3.T3.1: `conductor/tech-stack.md`** — correct the §1 table, the dependency block and the CI/Docker entries, and add a dated design-update entry
  - [ ] **P3.T3.2: `docs/TDD.md`** — correct the tool table and the job descriptions, including the new classification step
  - [ ] **P3.T3.3: `README.md`** — correct the prerequisites and the CI/CD paragraph

## Phase R1: Review Fixes

<!--
Review fixes are appended by `conductor-review` as:

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 3
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->

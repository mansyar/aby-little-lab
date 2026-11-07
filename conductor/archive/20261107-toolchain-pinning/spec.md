# Toolchain Pinning — Specification

> **Conventions:** `FR-` functional requirements, `NFR-` non-functional, `AC-`
> acceptance criteria. IDs are stable; approved IDs are never renumbered and
> withdrawn items are marked `Withdrawn`.

## Overview

The repository states its pnpm and Node versions in four places and owns them in
none. This track makes one declaration authoritative — `packageManager` and
`engines` in `package.json` plus a `.node-version` file — has every executing
file consume it, and adds a test that fails when any of them disagrees.

## Problem / Motivation

`package.json` declares neither `packageManager` nor `engines`. The versions are
therefore asserted separately, and the assertions disagree:

| Where | pnpm | Node |
| --- | --- | --- |
| `conductor/tech-stack.md:14` | 11.17.0 | — |
| `conductor/tech-stack.md:372,374`, `docs/TDD.md:90,1193` | 11.7.0 | 22 |
| `.github/workflows/ci.yml:23,80` | `pnpm/action-setup@v6` version `11.7.0`, twice | `node-version: 22`, twice |
| `Dockerfile:1,5` | `corepack prepare pnpm@11.7.0` | `node:22-alpine` |
| `README.md:19-21` | "pnpm 11+" | "Node.js 22+" |
| The developer's machine | 12.16.1 | 24.22.2 |

Four consequences, in order of how much they cost:

1. **The lockfile has no owner.** `pnpm-lock.yaml` is `lockfileVersion: '9.0'`
   and nothing records which pnpm produced it. A contributor on a different pnpm
   major gets a resolver that validates, rewrites, or rejects a lockfile the
   project never declared. `--frozen-lockfile` protects CI from one half of that
   and protects nobody locally.
2. **CI and the developer disagree by a major.** Every gate this project trusts
   runs on pnpm 11.7.0 in CI and pnpm 12.16.1 on the machine that writes the
   code, so a resolution difference surfaces after merge or never.
3. **The Docker image is built by a version no table admits.** It pins 11.7.0
   while the design document says 11.17.0 — a number nothing has ever run.
4. **Two dead artefacts ride along.** `pnpm-workspace.yaml` is not a workspace
   (no `packages:` key) and its only content is a `minimumReleaseAgeExclude`
   exemption for `@ligne-engine/bundler@0.1.0` and `@ligne-engine/web@0.2.1`,
   both removed from the project. `serve@^14.2.6` is a devDependency with no call
   site; `scripts/validate-boot.js:171` tells the reader to use `vite preview`
   for exactly the job it would do.
5. **Every PR pays the full price for a markdown edit.** The `push` trigger
   ignores `conductor/**`, `docs/**`, `README.md` and `**/*.md`, but
   `pull_request` has no filter, so a track-scaffolding PR spends three minutes
   of unit tests and browser journeys to change a file that no test reads.

The failure is not a wrong number. It is that no file is the owner, so every
number is equally true and none is checked.

## Goals & Success Metrics

- **Goal:** one declared pnpm and Node, consumed by CI, the Dockerfile, the
  developer and the documents.
  - **Metric:** a guard test fails when any executing file disagrees with the
    declaration, and passes when they agree; deliberately editing one file's
    version turns exactly that test red.
- **Goal:** the declared pnpm installs the lockfile.
  - **Metric:** `pnpm install --frozen-lockfile` exits 0 under pnpm 12.16.1 on a
    clean `node_modules`.
- **Goal:** the Docker image builds on the declared Node.
  - **Metric:** `docker build` exits 0 and the built image serves the same
    `dist/` structure as a local `pnpm build`.
- **Goal:** no functional change.
  - **Metric:** the full gate is green and the browser journeys pass unchanged.

## Scope

### In Scope

- `packageManager` and `engines` in `package.json`; a `.node-version` file.
- CI: both jobs read the Node version from `.node-version` and take pnpm from
  `packageManager`; no version literals remain in the workflow.
- Dockerfile: build stage on the declared Node major, installing the declared
  pnpm.
- A guard test in the unit suite asserting agreement across every executing file
  and the README prerequisite line.
- Deleting `pnpm-workspace.yaml`; removing the unused `serve` dependency.
- Correcting the version statements in `conductor/tech-stack.md`,
  `docs/TDD.md` and `README.md`, and adding a dated design-update entry.
- CI change classification: both jobs always run and always report, with
  documentation-only changes limited to install plus `validate-docs`.

### Out of Scope

- Any release, tag, or deploy. This changes how the app is built, not what it is.
- Upgrading any dependency, or changing what the lockfile resolves to.
- A CI matrix (Windows/macOS), or pinning GitHub Actions to SHAs.
- The Docker base image's OS or the runtime stage, beyond the Node major.
- CSP and security headers — that is the `edge-hardening` track.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` declares `packageManager` as an exact `pnpm@12.16.1`, with no range. | must |
| FR-2 | `package.json` declares `engines.node` as a range that contains the pinned Node and nothing the project has not verified. | must |
| FR-3 | `.node-version` contains the pinned Node in a form `actions/setup-node` accepts. | must |
| FR-4 | Both CI jobs install pnpm from `packageManager` (no `version:` input) and resolve Node from `.node-version` (`node-version-file`), with no Node or pnpm literal anywhere in the workflow. | must |
| FR-5 | The Dockerfile's build stage uses the pinned Node major and installs the pinned pnpm version. | must |
| FR-6 | A unit test asserts that `package.json`, `.node-version`, the Dockerfile, both CI jobs and the README prerequisite line agree with the declaration; it names every disagreeing file and both values when it fails. | must |
| FR-7 | `pnpm-workspace.yaml` is deleted and no file references it. | must |
| FR-8 | The `serve` devDependency is removed, the lockfile reflects the removal, and nothing references it. | must |
| FR-9 | `conductor/tech-stack.md`, `docs/TDD.md` and `README.md` state the declared versions, and `tech-stack.md` carries a dated design-update entry. | must |
| FR-10 | `pnpm install --frozen-lockfile` succeeds under the declared pnpm on a clean install; if pnpm 12 requires a lockfile rewrite, that rewrite is committed deliberately and recorded. | must |
| FR-11 | Both workflow jobs always run, so `Quality Gates` and `Browser Journeys` always report a status; no `paths-ignore` sits on the `pull_request` trigger. | must |
| FR-12 | A first step in each job classifies the change as code or documentation-only and publishes that as a job output; every expensive step is gated on it. | must |
| FR-13 | On a documentation-only change the gates job runs dependency installation and `validate-docs` only, and the browser job runs no tests. Everything else — lint, types, unit, coverage, build, bundle, PWA, boot — is skipped. | must |
| FR-14 | The classification uses `git` only: no third-party action, and no network access beyond fetching the PR base commit. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No application behaviour change. Bundle sizes, the shell gate and the precache manifest are unchanged apart from noise. |
| NFR-2 | The guard test runs in under one second, reads files only, and uses no network, timers, Docker or shell. |
| NFR-3 | If `node:24-alpine` does not ship Corepack, the Dockerfile installs pnpm another way and the change is recorded with the evidence for why. |
| NFR-4 | Coverage thresholds hold (lines 95 / functions 88 / branches 85 / statements 90) and the full verification chain stays green. |
| NFR-5 | No CI runtime regression: the quality gates stay within their current minute-scale budget and the browser suite stays inside five minutes on Node 24. |
| NFR-6 | A documentation-only change finishes both jobs in about a minute, dominated by the dependency install, and never starts a browser. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` contains `"packageManager": "pnpm@12.16.1"` and an `engines.node` range containing 24. | FR-1, FR-2 |
| AC-2 | `.node-version` exists and holds the pinned Node. | FR-3 |
| AC-3 | `grep` for `version:` under `pnpm/action-setup` and for `node-version:` in the workflow returns nothing; both jobs use `node-version-file`. | FR-4 |
| AC-4 | The Dockerfile names the pinned Node major and the pinned pnpm version. | FR-5 |
| AC-5 | The guard test passes on the declared tree and fails, naming the file and both values, when one file's version is deliberately changed. | FR-6 |
| AC-6 | `pnpm-workspace.yaml` does not exist and no tracked file mentions it. | FR-7 |
| AC-7 | `serve` is absent from `package.json` and `pnpm-lock.yaml`, and a clean `pnpm install --frozen-lockfile` succeeds. | FR-8, FR-10 |
| AC-8 | The three documents state 12.16.1 and 24, the dated entry exists, and `validate-docs` passes. | FR-9 |
| AC-9 | The full verification chain and the browser suite are green on the new toolchain. | NFR-1, NFR-4, NFR-5 |
| AC-10 | `docker build` for the image exits 0 on the new Node base, or the failure and its cause are recorded as a blocker rather than shipped. | FR-5, NFR-3 |
| AC-11 | On a documentation-only change, both required checks report green: the gates job runs install and `validate-docs` only, and the browser job runs no tests. The classifier arms are proven against real ranges (`verification/phase-2.md`); a PR-level documentation-only run is not available on this track, whose own diff is code. | FR-11, FR-12, FR-13, NFR-6 |
| AC-12 | On a code commit, the full pipeline runs — proven by the earlier commits on the same PR, whose logs show lint, types, unit, coverage, build and the browser suite. | FR-12 |
| AC-13 | No `paths-ignore` remains under `pull_request`, and the workflow contains no third-party action for change detection. | FR-11, FR-14 |

## Edge Cases

- **The classification must fail safe.** An unknown base, an empty diff, a fork
  PR whose base commit cannot be fetched, or a `git diff` that errors all resolve
  to the **code** tier. Running the suite needlessly costs minutes; skipping it
  wrongly costs a merge.
- **`git diff` needs the base commit.** A shallow checkout has no
  `merge-base`, so the classification fetches the PR base sha explicitly
  (`fetch-depth: 0`, or a targeted fetch) before comparing. A `git diff` that
  cannot resolve the base is treated as unknown, which means code.
- **The last commit of every track is documentation-only.** Completion moves the
  track into `conductor/archive/` and edits `conductor/tracks.md`, so the tier is
  exercised on this track's own PR without any special setup. That is AC-11's
  proof.
- **`push` to `master` keeps its existing `paths-ignore`.** Tag pushes are not
  path-filtered, so the deploy job is unaffected, and the post-merge run stays
  quiet on documentation-only merges.
- **A job that skips steps must still succeed.** Skipped steps do not fail a job,
  so the required checks report green; the classification step itself must never
  exit non-zero, or the skip becomes a red check.
- **A renamed or deleted file** must not defeat the classification: the file list
  is compared by path, so a deletion of a code file counts as code.
- **Renaming a job** would silently weaken branch protection, because the
  required check names are matched by string. The guard asserts both job names
  still exist with their current identifiers.
- **Corepack missing from `node:24-alpine`.** Node has been signalling Corepack's
  removal. If `corepack` is absent or refuses, install pnpm with
  `npm i -g pnpm@<version>` and record the evidence. The guard must keep working
  either way, so it matches the version string, not the command shape.
- **`node-version-file` format.** `actions/setup-node` accepts `24` and `24.x`;
  it does not accept `v24.22.2`. The file and the guard must agree on a form the
  runner accepts, and the guard should reject a `v` prefix.
- **pnpm 12 rewriting the lockfile.** If a `--frozen-lockfile` install fails
  because the resolver generation moved, regenerate once, inspect the diff, and
  commit it in the phase that caused it. A rewrite that changes resolved versions
  is out of scope and must be reported, not smuggled.
- **`engines` is advisory.** pnpm prints a warning, not an error, without
  `engine-strict`. This track deliberately does not enable `engine-strict`;
  the pin is enforced by CI and Docker, and the guard makes disagreement visible.
- **The guard reading YAML.** The workflow must not be parsed with a YAML
  dependency added for the test. The guard scans the two job blocks for the
  specific keys it cares about and asserts their absence or presence.
- **A second workflow file** added later would escape the guard. Recorded as an
  accepted limit: the guard imports `ci.yml` by path and cannot enumerate
  `.github/workflows/`, so a new workflow file is unguarded until it is added to
  the import list.
- **The `pnpm/action-setup` `version:` conflict.** The action reads
  `packageManager` when `version` is omitted, and its README states the input is
  optional only when `packageManager` declares pnpm 11 or newer. FR-3's pin is
  12.16.1, so omission is the documented path and a literal would duplicate the
  field the action already reads.

## Dependencies

- **Tracks:** none open. `20261107-release-e2e` is merged, so the browser suite
  exists to prove NFR-5.
- **External:** Docker Engine available locally (28.3.0 confirmed) and the
  `node:24-alpine` image.

## Open Questions & Assumptions

| Question | Assumption |
| --- | --- |
| Which pnpm is the truth? | 12.16.1 — the developer's version, chosen over the 11.7.0 CI already uses, so CI and Docker move rather than the machine. |
| Which Node? | 24, declared in `.node-version` and consumed by CI, with `engines` permitting it; the Docker build stage moves to `node:24-alpine` so CI and the image agree. |
| Literal or derived? | A literal in the Dockerfile, guarded; no literal in CI, because the action reads `packageManager` and a duplicate invites conflict. |
| Does the track cut a release? | No. Version and tag stay where they are. |
| Does `engines` include 22? | No. Nothing in CI, Docker or the developer's machine runs it after this track, and a range that admits an unverified runtime is the drift this track removes. |
| Should CI skip work for documentation-only changes? | Yes, but not by `paths-ignore`: both jobs always run so the two required checks always report, and a documentation-only change is limited to install plus `validate-docs`, because that validator is the only thing checking `conductor/*.md` links. |
| Does a documentation-only change skip `validate-docs` too? | No. Skipping the whole pipeline on exactly the files that validator reads would let a dead track link merge with every check green. |

## References

- `conductor/product.md` §10.2 (Phase 1 — Trust the build) and §10.6
  (dependency cadence)
- `conductor/tech-stack.md` §1, §2, §8
- `.github/workflows/ci.yml`, `Dockerfile`, `package.json`, `pnpm-workspace.yaml`
- pnpm `action-setup` v6 README: the `version` input is optional when
  `packageManager` declares pnpm 11 or newer
- `conductor/code_styleguides/typescript.md` §6 (the fixture-clock guard, used as
  the pattern for a source-guard test)

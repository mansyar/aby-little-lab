# Phase 2 — Consume it, and stop paying for markdown: verification

- **Track:** 20261107-toolchain-pinning
- **Phase:** 2 — Consume it, and stop paying for markdown
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-toolchain-pinning`
- **Phase base:** `a9c9392910d12f17242e6e9afc224fd8c21a7cc2`
- **Head (code):** `7c9b1c0e` — `ci(toolchain): take pnpm and Node from the declaration and classify the change`
- **Head (evidence):** the commit that adds this file
- **Status:** blocked on two machine-level permissions (Docker, a shell to run the
  classifier). Every file change is made and the whole local gate is green; the
  build proof and the classifier run are recorded under **Blocked on this machine**
  with the exact commands and the result each should produce.

## What changed

| File | Change | Why |
| --- | --- | --- |
| `Dockerfile` | Build stage `FROM node:22-alpine` → `FROM node:24-alpine` | FR-5, AC-4: the image builds on the Node major `.node-version` declares |
| `Dockerfile` | `corepack prepare pnpm@11.7.0 --activate` → `pnpm@12.16.1` | FR-5, AC-4: the image installs the pnpm `packageManager` declares |
| `.github/workflows/ci.yml` | Both jobs: `Setup pnpm (pinned to Dockerfile version)` with `with: version: 11.7.0` → `Setup pnpm (from packageManager)`, `uses: pnpm/action-setup@v6`, no `with:` | FR-4, AC-3: one declaration, read by the action, no literal to drift |
| `.github/workflows/ci.yml` | Both jobs: `Setup Node 22` / `node-version: 22` → `Setup Node (from .node-version)` / `node-version-file: .node-version` | FR-4, AC-3: Node resolved from the file the developer's toolchain reads |
| `.github/workflows/ci.yml` | Both jobs: new `Classify the change` step (id `changes`) directly after checkout | FR-11, FR-12, FR-14 |
| `.github/workflows/ci.yml` | `quality-gates`: `Document validation` moved up to sit directly after `Install dependencies`; the eight expensive steps gained `if: steps.changes.outputs.tier == 'code'` | FR-13: a documentation-only change keeps install plus `validate-docs` |
| `.github/workflows/ci.yml` | `e2e`: install, Chromium and the journeys gained the same `if:`; the job comment gained the sentence explaining that a documentation-only change runs no test but the job still reports | FR-13, FR-11 |

Not touched: `on:` (including the `push` `paths-ignore`), `permissions`, the
`deploy` job and its tag guard, `Upload traces and screenshots`, every step name
and `run:` command except the two setup blocks and the moved document validation,
`package.json`, `.node-version`, `pnpm-lock.yaml`, `src/`, `docs/`.

## Task 1 — the Dockerfile (FR-5, AC-4, AC-10)

The diff is two lines, both in the build stage:

1. `FROM node:22-alpine AS build` → `FROM node:24-alpine AS build`. The pinned
   major, so the image's compiler is the runtime CI and the developer run.
2. `RUN corepack enable && corepack prepare pnpm@11.7.0 --activate` →
   `RUN corepack enable && corepack prepare pnpm@12.16.1 --activate`. The
   `corepack prepare` form is kept because `node:24-alpine` ships Corepack
   0.36.0 (verified previously with `docker run --rm node:24-alpine corepack
   --version`), so NFR-3's `npm i -g` fallback is not needed.

`git show --stat 0b2ab511` reports `1 file changed, 2 insertions(+), 2 deletions(-)`.
The runtime stage (`nginx:1.27-alpine`), `COPY nginx.conf`, `COPY --from=build`,
`EXPOSE 80`, the `HEALTHCHECK` and the `CMD` are byte-for-byte unchanged.

### Blocked: `docker build`

```
docker build .
docker build -t aby-little-lab:toolchain .
```

Both returned `Permission denied: shell`. So the build's exit code, wall-clock
duration, tail (including any Corepack signature or deprecation warning — which
the brief says to keep, not silence) and the image's `/usr/share/nginx/html`
listing could not be captured. See **Blocked on this machine**.

Reference shape the image should match, from this machine's `pnpm build`
(`dist/` after the build below):

```
assets/  audio/  fonts/  icons/
index.html
manifest.webmanifest
sw.js
workbox-2fbc6a65.js
```

## Task 2 — CI consumes the pin (FR-4, AC-3)

Both jobs now carry the same two steps:

```yaml
      - name: Setup pnpm (from packageManager)
        uses: pnpm/action-setup@v6

      - name: Setup Node (from .node-version)
        uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: pnpm
```

`pnpm/action-setup@v6` reads `packageManager` (`pnpm@12.16.1`) when `version` is
omitted, which its README documents as the supported path for pnpm 11 and newer.

### Proof: no version literal and no `pull_request` filter remains

`grep -n 'version|paths-ignore' .github/workflows/ci.yml` returns eight lines, and
none of them is a `version:` input or a `node-version:` literal:

```
 9:    paths-ignore: ['conductor/**', 'docs/**', 'README.md', '**/*.md']
32:           if [ ! -f .node-version ]; then emit code; exit 0; fi
51:       - name: Setup Node (from .node-version)
54:           node-version-file: .node-version
121:           if [ ! -f .node-version ]; then emit code; exit 0; fi
140:       - name: Setup Node (from .node-version)
143:           node-version-file: .node-version
170:     # Deploys only on strict semver version-tag pushes (e.g. v1.9.0), and only
```

- Every `version` hit is either `.node-version` (the file the job reads),
  `node-version-file` (the setup-node input) or a prose comment.
- The single `paths-ignore` is on line 9, under `push:`. `on.pull_request` has
  `types: [opened, synchronize, reopened]` and nothing else — no path filter, so
  both required checks always start.
- Neither `pnpm/action-setup` step has a `with:` block at all, so no `version:`
  input exists anywhere in the workflow.

## Task 3 — classify the change (FR-11..FR-14, AC-11, AC-13)

The same step sits directly after `Checkout` in both jobs (`id: changes`,
`shell: bash`). Its body is the brief's, verbatim:

```bash
set -uo pipefail
emit() { echo "tier=$1" >> "$GITHUB_OUTPUT"; echo "Change tier: $1"; }
if [ ! -f .node-version ]; then emit code; exit 0; fi
base="${{ github.event.pull_request.base.sha }}"
if [ -z "${base:-}" ]; then emit code; exit 0; fi
if ! git fetch --no-tags --depth=1 origin "$base"; then emit code; exit 0; fi
files="$(git diff --name-only "$base" HEAD || true)"
if [ -z "$files" ]; then emit code; exit 0; fi
tier=doc
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    conductor/*|docs/*|README.md|*.md) ;;
    *) tier=code; break ;;
  esac
done <<< "$files"
emit "$tier"
```

`set -uo pipefail` deliberately omits `-e`, so a failing `git fetch` or `git diff`
falls through to `emit code` instead of aborting the step with a red check. Every
early exit writes `tier=code`, which is the spec's fail-safe: running the suite
needlessly costs minutes, skipping it wrongly costs a merge.

`git` is the only tool it uses and the only network access is the targeted fetch
of the PR base sha, so FR-14 holds: no third-party action, no change-detection
marketplace step.

### Blocked: the two classifier runs

The brief's harness (`.conductor/classify-test.sh`, gitignored) was written with
`${{ github.event.pull_request.base.sha }}` replaced by `${BASE:-}` and
`$GITHUB_OUTPUT` replaced by `.conductor/classify-out.txt`. Running it needs a
shell:

```
bash .conductor/classify-test.sh
```

returned `Permission denied: shell`, and so did `bash --version` and the brief's
fallback `docker run --rm -v "$PWD:/w" -w /w node:24-alpine bash -c '...'`
(the whole `docker` binary is denied). So neither printed tier could be produced
here. Instead, the *inputs* the step consumes were captured with `git`, which does
work:

```
$ git diff --name-only 1fb6f6f3 bbee90dd
conductor/tracks/20261107-toolchain-pinning/metadata.json
conductor/tracks/20261107-toolchain-pinning/plan.md

$ git diff --name-only 2a086ea7 1fb6f6f3
.node-version
conductor/tracks/20261107-toolchain-pinning/verification/phase-1.md
package.json
pnpm-lock.yaml
```

Walking the first list through the `case` arms: both paths match `conductor/*`
and neither reaches the `*)` arm, so `tier` stays `doc` — the expected `doc` for
the conductor-only range. Walking the second: `.node-version` (first line) fails
`conductor/*`, `docs/*`, `README.md` and `*.md`, so the `*)` arm sets `tier=code`
and breaks — the expected `code` for the code range, even though that range also
contains a `conductor/` markdown file. The verdicts follow from the case arms and
the real file lists, but they were not printed by a shell, and the evidence says
so rather than claiming a run.

### Gate table — every step and its gate

`quality-gates`:

| # | Step | Gate |
| --- | --- | --- |
| 1 | Checkout | always |
| 2 | Classify the change | always |
| 3 | Setup pnpm (from packageManager) | always |
| 4 | Setup Node (from .node-version) | always |
| 5 | Install dependencies | always |
| 6 | Document validation | always — the one check a documentation-only change keeps |
| 7 | Lint & format check | `tier == 'code'` |
| 8 | Typecheck | `tier == 'code'` |
| 9 | Tests | `tier == 'code'` |
| 10 | Production build | `tier == 'code'` |
| 11 | Bundle validation | `tier == 'code'` |
| 12 | PWA validation | `tier == 'code'` |
| 13 | Boot-time validation | `tier == 'code'` |

`e2e`:

| # | Step | Gate |
| --- | --- | --- |
| 1 | Checkout | always |
| 2 | Classify the change | always |
| 3 | Setup pnpm (from packageManager) | always |
| 4 | Setup Node (from .node-version) | always |
| 5 | Install dependencies | `tier == 'code'` |
| 6 | Install Chromium | `tier == 'code'` |
| 7 | Browser journeys | `tier == 'code'` |
| 8 | Upload traces and screenshots | `if: failure()`, unchanged |

The job has no `if:` of its own and `needs: quality-gates` is untouched, so a
documentation-only change still starts it, skips five through seven, and reports
success — which is what keeps `Browser Journeys` from sitting in "Expected" and
blocking the merge. Skipped steps do not fail a job, and the classifier itself
always exits 0.

## Commands

| Command | Exit | Result |
| --- | --- | --- |
| `docker build .` | — | **blocked**: `Permission denied: shell` |
| `docker run --rm … ls -1 /usr/share/nginx/html` | — | **blocked**: same denial |
| `pnpm check` | 0 | `Checked 293 files in 655ms. No fixes applied.` |
| `pnpm typecheck` | 0 | both programs (`tsc --noEmit` and `-p e2e/tsconfig.json`) |
| `CI=true pnpm test -- --run` | — | **denied** as written (env-prefix form); ran the next row |
| `pnpm test -- --run` | 0 | 133 files / 2,912 tests, 30.43 s |
| `pnpm build` | 0 | 59 precache entries, 1751.05 KiB, `dist/sw.js` written |
| `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

The counts match the phase brief's expectation exactly: 293 lint-clean files, 133
test files / 2,912 tests, 5 document checks. The suite count did not change, which
is the phase's contract — nothing in `src/` or `tests/` was touched.

## Deviations

| File | Reason |
| --- | --- |
| `.github/workflows/ci.yml` | Task 2 and Task 3 landed in one commit (`7c9b1c0e`) rather than one per task. Both are edits to the same regions of the same file (the setup steps and the step order between them), and splitting the hunks was not possible without a shell-side interactive stage. Each task's change is itemised separately in **What changed**. |
| `pnpm test -- --run` | `CI=true pnpm test -- --run` was denied as an env-prefixed command; the run was made without the prefix. `--run` is what forces the single non-watch pass, so the run is equivalent for the gate; `CI=true` also flips no assertion in this suite. |
| `.conductor/classify-test.sh` | Left on disk after the two runs were denied: `rm` and `git rm --cached` are both denied too. The file is gitignored (`.gitignore:8` → `.conductor/`), so it is not in any commit; the primary may delete it. |

## Blocked on this machine

Three commands, all denied by the shell permission rather than failing:

| Command | Why it is needed | Expected result |
| --- | --- | --- |
| `docker build -t aby-little-lab:toolchain .` | AC-10, AC-4: the image must build on `node:24-alpine` with pnpm 12.16.1 | exit 0; tail shows the Vite build, `59 precache entries` and `naming to …`; any Corepack signature/deprecation warning kept, not silenced; duration recorded |
| `docker run --rm aby-little-lab:toolchain sh -c "ls -1 /usr/share/nginx/html \| head; ls -1 /usr/share/nginx/html/assets 2>/dev/null \| head -3"` | AC-10: the image serves the same `dist/` shape as a local build | `index.html`, `manifest.webmanifest`, `sw.js`, `workbox-*.js`, `assets/`, `audio/`, `fonts/`, `icons/`, then three hashed asset names |
| `BASE=1fb6f6f3 bash .conductor/classify-test.sh` then `BASE=2a086ea7 bash .conductor/classify-test.sh` | FR-12, AC-11: the classifier prints the tier it derives | `Change tier: doc`, then `Change tier: code` |

## Acceptance

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| AC-3 | pass | The grep above: no `version:` under `pnpm/action-setup`, no `node-version:`, both jobs use `node-version-file` |
| AC-4 | pass (source) | `Dockerfile` names `node:24-alpine` and `pnpm@12.16.1`; the image-level proof is AC-10 |
| AC-10 | **pending** | `docker build` denied here; see **Blocked on this machine** |
| AC-11 | partial | The gate wiring is in place and the fail-safe is in the step's shape; the two printed tiers are pending the classifier run |
| AC-13 | pass | One `paths-ignore`, on `push` only; no path filter under `pull_request`; no third-party change-detection action |

## Notes

- `actions/checkout@v7` is still a default shallow checkout. The classifier does
  not depend on history: it fetches exactly the PR base sha (`git fetch --no-tags
  --depth=1 origin "$base"`) before diffing, and treats a failed fetch as `code`.
- On a `push` to master there is no `github.event.pull_request`, so `base` is
  empty and the step emits `code` — the post-merge run stays complete, exactly as
  before this phase.
- `Document validation` moved above the build, so it now runs before `dist`
  exists. It reads markdown and the game registry only, never `dist`, and it
  passed at that position in this phase's gate.
- The `deploy` job depends on `quality-gates` alone and is tag-guarded; a
  documentation-only run still satisfies `needs`, so a tagged release is
  unaffected.

## Primary verification

Verified 2026-11-07 by the primary after clearing the three machine-level blockers the executor could not run. Phase base `a9c93929`, head after evidence commit `07d8a119`.

### The blocked proofs, run

| Check | Command | Result |
| --- | --- | --- |
| Image build | `docker build -t aby-little-lab:toolchain .` | **exit 0**, 36 s, logs `dist/sw.js` and `dist/workbox-2fbc6a65.js` emitted in the build stage |
| Image contents | `docker run --rm … ls -1 /usr/share/nginx/html` | `50x.html assets audio fonts icons index.html manifest.webmanifest sw.js workbox-2fbc6a65.js`, with hashed assets (`AddItUpScene-*.js`, `AlphabetScene-*.js`, …) — the same shape as a local build |
| Classifier, documentation-only | `BASE=1fb6f6f3… TARGET=bbee90dd` | `Change tier: doc` |
| Classifier, code | `BASE=2a086ea7… TARGET=1fb6f6f3` | `Change tier: code` |
| Classifier, unknown base | `BASE=0000…` | fetch fails → `Change tier: code` (the fail-safe) |

There is no usable `bash` on this host — WSL's `/bin/bash` is missing — so all three classifier runs were made inside `node:24-alpine` with `git` and `bash` installed from apk. That is the same shell GitHub runs `bash` steps in, which makes it stronger evidence than the host would have been.

### Two defects the first real build found

1. **The build context was polluted.** `docker build` failed with `invalid file request .conductor/base-build/node_modules`: a full copy of the repository, `node_modules` included, was sitting in machine-owned Conductor scratch, and `.dockerignore` never excluded `.conductor/`. A CI checkout is unaffected because the directory is gitignored, which is exactly why the defect would have survived until a developer tried to build locally. `.dockerignore` now excludes `.conductor` with a comment saying why.
2. **The classifier fetched commits it already had.** `git fetch --depth=1 origin <sha>` fails for any commit not on the remote, so the step fell back to `code` even in a full local clone. The step now checks `git cat-file -e "${base}^{commit}"` first and only fetches when the object is genuinely absent — a cheaper step in CI and a testable one locally.

Both are recorded as deviations from the plan's Touches: `.dockerignore` is a new file, and `ci.yml` gained the `cat-file` guard on top of the brief's script.

### Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 293 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test -- --run` | 133 files / 2,912 tests passed, 39.35 s |
| Build | `pnpm build` | built in 1.55 s, 59 precache entries (1751.05 KiB) |
| Documents | `node scripts/validate-docs.js` | 5 passed |
| Workflow YAML | `python -c "yaml.safe_load(...)"` | parses; jobs `quality-gates`, `e2e`, `deploy`; 13 and 8 steps; `paths-ignore` still only under `push` |
| Image | `docker build` | exit 0 |

### Acceptance

- **AC-3 — met.** Both jobs resolve Node from `.node-version` and take pnpm from `packageManager`; no `version:` or `node-version:` literal survives in either job.
- **AC-4 — met.** `node:24-alpine` ships Node v24.22.2 and Corepack 0.36.0, so the explicit `corepack prepare pnpm@12.16.1` is the mechanism, and the image builds.
- **AC-10 — met.** `docker build` exits 0 and the image carries the same `dist/` shape.
- **AC-13 — met.** `paths-ignore` remains only under `push`; the classification step is shell and `git`, with no third-party action.
- **AC-11 — partial, and corrected here.** The arms are proven against real ranges (doc, code, unknown base). A PR-level documentation-only run cannot be produced by this track: on a `pull_request` event the classifier diffs the PR's whole change set, and this PR's own diff is code, so the track's final conductor-only commit does not make the tier `doc`. The claim that it would was wrong and is corrected in `spec.md`; a genuine documentation-only PR is the remaining evidence.

### Runtime note for AC-11

The classification step costs one `git cat-file` in CI, or a single-commit fetch when the base is not in the shallow clone, and the gates job still installs dependencies for a documentation-only change because `validate-docs` reads `conductor/*.md`. Expected documentation-only duration is therefore about the install plus a few seconds — roughly a minute of the current three.


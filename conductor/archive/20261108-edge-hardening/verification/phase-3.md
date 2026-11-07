# Phase 3 verification — Keep it honest in CI and in the docs

Track `20261108-edge-hardening`, branch `chore/20261108-edge-hardening`.
Phase base `5898770d57b82a6f10e173c21bd7bbf1b54420ca`.

Result: **partial** — both edits landed and every check that the permission
layer allowed is green; the two proofs that need a denied command
(`python -c … yaml.safe_load`, `node scripts/validate-headers.js`, which
shells out to `docker`) did not run here. Both are recorded under
[Blocked](#blocked), with the exact command and the result expected.

## What changed

### `.github/workflows/ci.yml` — the gate (FR-9, NFR-5, AC-7)

One step appended to `quality-gates`, after `Boot-time validation`, with the
same condition every other gated step carries
(`if: steps.changes.outputs.tier == 'code'`):

```yaml
      # The policy is only proven by a container. The guard test reads
      # `nginx.conf` and the snippet as text; this step asserts what nginx
      # actually sends, on every route class, from the image Coolify builds.
      # Docker missing is an error rather than a skip: a silently skipped check
      # would make "every code change is validated" mean nothing, which is the
      # whole of AC-7. The image is built here, not reused, because a cache hit
      # from another job could hide a snippet the Dockerfile no longer copies.
      - name: Security headers
        if: steps.changes.outputs.tier == 'code'
        run: |
          command -v docker >/dev/null 2>&1 || { echo "::error::Docker is required to validate the security headers"; exit 1; }
          docker build -t aby-little-lab:headers .
          node scripts/validate-headers.js
```

Notes on the shape:

- The condition is the existing `steps.changes.outputs.tier == 'code'`
  expression, not the `steps.classify` spelling in the brief: the classifier
  step's id in this workflow is `changes`, and "match the exact expression the
  other gated steps already use" wins over the brief's paraphrase.
- `run: |` block scalar, matching `Boot-time validation`. The `{ …; exit 1; }`
  group and the `::error::` annotation are both inert to YAML.
- Nothing else in the file moved. `e2e` and `deploy` are untouched, `pull_request`
  has no `paths-ignore`, and `pnpm/action-setup` / `node-version-file: .node-version`
  are as they were — `src/__tests__/guard/toolchain.test.ts` asserts all of that
  from the raw file and passed (7 tests, inside the 135-file run below).
- The image is built in the step rather than shared from a previous job: the
  gates job has no other Docker step, and a shared artifact would let a snippet
  the `Dockerfile` no longer copies stay hidden.

### `docs/TDD.md` (FR-12)

- Contents: added `11.6 Security headers and the serving layer`.
- §10.5: a paragraph under **Running it against the image** saying the
  `webServer` is optional, that `E2E_BASE_URL` repoints `use.baseURL` and starts
  nothing, why only the container can prove the policy, and that an unset
  variable is the preview default it was before.
- §11.3 validator table: a `validate-headers.js` row (boots the built image on a
  fixed port, `HEADERS_IMAGE` / `HEADERS_PORT`, busy port is a failure, seven
  route classes, four headers plus the exact `Cache-Control` per class, the 404
  through the hashed-asset location proving `always`).
- §11.4 job table: the `Quality Gates` row now ends with
  `docker build -t aby-little-lab:headers .` and `node scripts/validate-headers.js`,
  including that a runner without Docker fails instead of skipping.
- New §11.6: the four headers and where they are declared; the inheritance rule
  and the five `Cache-Control` locations plus the server block, with `try_files`
  resolving `/` and the SPA fallback into `location = /index.html`; `always` and
  4xx/5xx; the guard test as the unit half; a thirteen-row CSP directive table
  (directive → value → why) carrying both `img-src` reasons — SVG base64 art and
  Phaser's `blob:` texture uploads, with the measured ten refusals / 12 failed
  journeys — and an explicit statement that no `unsafe-*` token appears; a
  three-row table for `X-Content-Type-Options`, `Referrer-Policy` and
  `Permissions-Policy` (including why `fullscreen` is unmentioned); the validator
  and its command; the journey recipe with `E2E_BASE_URL` and the reason
  (`vite preview` sends no headers); "Deliberately absent" for HSTS, COOP and
  CORP/COEP.

### `README.md` (FR-13)

- **Docker Deployment**: one paragraph stating the four headers as a property of
  what the image serves, naming the inheritance reason in a clause, then the two
  proofs — `node scripts/validate-headers.js` and the `E2E_BASE_URL` journey run
  — and a link to TDD §11.6.
- **CI/CD**: the gates-job sentence now includes `validate-headers` against the
  image built from the `Dockerfile`.

`conductor/product.md` was not edited; the roadmap row stays the primary's.

## Commands

| # | Command | Exit | Headline |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | `Checked 296 files in 464ms. No fixes applied.` |
| 2 | `pnpm typecheck` | 0 | both projects clean |
| 3 | `CI=true pnpm test -- --run` | **denied** | `permission.rejected` before execution — see Blocked |
| 3′ | `pnpm test -- --run` | 0 | `Test Files 135 passed (135)`, `Tests 2927 passed (2927)`, 28.32 s |
| 4 | `pnpm test:coverage` | 0 | 97.21 / 91.14 / 96.18 / 98.21, 135 files / 2,927 tests |
| 5 | `pnpm build` | 0 | 363 modules, 59 precache entries (1751.05 KiB) |
| 6 | `node scripts/validate-bundle.js` | 0 | `phaser-B_vcVLyb.js` 1335.0 kB; `index-CpDFSutQ.js` 153.6 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (47/47 chunks precached) |
| 8 | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed — links, anchors, game lists, Conductor paths, suite truth |
| 9 | `node scripts/validate-headers.js` | **denied** | `permission.rejected` — see Blocked |
| 10 | `python -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/ci.yml')); print('ok', list(d['jobs']))"` | **denied** | `permission.rejected` — see Blocked |

Notes on 3′: `CI=true pnpm test -- --run` was refused by the permission layer
(env-assignment prefix). The configured project command `pnpm test -- --run`
was run instead; `--run` already forces a single non-watch run, which is the
only thing `CI=true` adds here, so the 2,927-test result is the same evidence
with one variable of difference. It is reported as a deviation rather than
presented as the denied command having run.

No counts moved: no test file and no test case was added, and the suite is still
135 files / 2,927 tests with coverage 97.21 / 91.14 / 96.18 / 98.21. `validate-docs`
passed, so no document gained a disagreeing claim.

## AC-7 acceptance

> CI runs the validator on a code-tier change and skips it on a documentation-only change, both observed on this track's PR.

| Half | State | Evidence |
| --- | --- | --- |
| A code-tier change reaches the step | **configured and statically checked; not executed by me** | The step exists in `quality-gates` with `if: steps.changes.outputs.tier == 'code'`, the same expression on the six gated steps around it. The classifier emits `code` for any path outside `conductor/*`, `docs/*`, `README.md`, `*.md`. |
| A documentation-only change skips it | **configured; not executed by me** | Same condition; the classifier's `case` leaves `tier` unset for those paths, so the outputs default to `doc`. |
| The validator's command works when an image exists | **UNPROVEN-BY-ME** | `node scripts/validate-headers.js` was denied to this subagent. Phase 1's primary run of the same script against the same image printed `21 passed, 0 failed` (also `20/1` with the `/sw.js` include removed, `14/7` with a header deleted) — `verification/phase-1.md`. |
| A runner without Docker fails rather than skips | **UNPROVEN-BY-ME** | The precheck is `command -v docker >/dev/null 2>&1 \|\| { echo "::error::…"; exit 1; }` as the step's first line. Shell semantics are unambiguous, no GitHub runner was available to observe it. |
| Both tiers observed on the PR | **PENDING** | AC-7 closes on this track's PR, where the two runs (one code-tier, one docs-only) are observable in the Actions log. |

**The CI half is UNPROVEN-BY-YOU.** GitHub Actions cannot be run from here, so
nothing in this file claims the step passed in CI. What is verified is: the file
is structurally unchanged apart from the appended step (the toolchain guard
parses it and asserts the invariants that matter), the condition text equals the
other gated steps' text, and the command sequence is the one documented in
§11.6 and exercised by the primary in Phase 1.

Structurally, the YAML was not run through a parser (Blocked #2). It was read
back after the edit and the step sits at the same indentation as its siblings
(`- name:` at six spaces under `steps:`, `if:`/`run:` at eight), uses only
`|` block-scalar content, and contains no tab or unquoted `:` — the three ways
this edit could have broken the document.

## Deviations

1. **`CI=true pnpm test -- --run` denied; ran `pnpm test -- --run`.** Recorded
   above with the reason it is the same evidence. No code was changed to make
   the denied form unnecessary.
2. **Condition spelled `steps.changes…`, not `steps.classify…`.** The brief's
   line 26 gave `classify` as an example while line 26 also required matching
   the expression the other steps use; the workflow's classifier id is
   `changes`. Matching the file won.
3. **A README sentence outside the Docker section.** The CI/CD paragraph gained
   `validate-headers` in its list of gates steps. It is the same claim as the
   §11.4 table row and keeps the README from describing a gate set that no
   longer exists; still inside `README.md`.

Nothing outside the phase's Touches was modified. No `src/`, `e2e/`,
`nginx.conf` or `nginx.security-headers.conf` change. `git status --short`
before the commits listed exactly the three intended files.

## Blocked

1. `python -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/ci.yml')); print('ok', list(d['jobs']))"`
   — denied (permission layer denies non-project binaries). Needed to prove the
   workflow still parses as the brief requires. Expected: `ok ['quality-gates', 'e2e', 'deploy']`.
2. `node scripts/validate-headers.js` — denied. Needed for the runtime half of
   this phase and for the headers row of the gate table. Expected, with
   `aby-little-lab:headers` present: an "Observed route matrix" table and
   `Results: 21 passed, 0 failed`, exit 0 (as the primary observed in Phase 1).

Neither was worked around: no wrapper process, no substitute parser, no
hand-rolled HTTP client against a port I could not open.

## Notes

1. **NFR-5 is not measurable here.** The step adds one `docker build` of a
   two-stage image (`pnpm install --frozen-lockfile` + `pnpm run build` inside)
   to a job that previously took no Docker time. The 90 s budget is plausible on
   a warm runner layer cache and not provable from this machine; the PR's timing
   is the measurement. If it busts the budget the fix is BuildKit cache or
   building only the `nginx` stage, not dropping the gate.
2. **The step deliberately does not reuse `dist/`.** `pnpm run build` has just
   produced it, and the `Dockerfile` rebuilds inside the image anyway; pointing
   the validator at `dist/` would test the host build rather than the shipped
   artifact.
3. **The 404 carrying `immutable`** that the validator's seventh probe observes
   is the pre-existing quirk recorded in `phase-1.md`. The step asserts what the
   config does today — `always` on the headers, the class's `Cache-Control` —
   so it stays green while that follow-up is open. When the quirk is fixed, the
   probe's expectation changes with it.
4. **Docs and code now state the same policy twice on purpose.** §11.6 is prose,
   the guard test and the validator are the assertions; `validate-docs` keeps
   anchors and counts honest but cannot check a directive value against
   `nginx.security-headers.conf`. A future policy change must edit three places,
   which is exactly why the guard test names the location rather than reporting
   a diff.
5. The image name `aby-little-lab:headers` is shared by the step, §11.6 and
   Phase 1/2 evidence; `HEADERS_IMAGE` exists for anyone who wants a different
   one without editing the script.


## Primary verification

Verified 2026-11-08 by the primary agent. Phase base `5898770d`.
The executor reported two denials — the YAML parse and `node scripts/validate-headers.js` (Docker) — and both were run here.

### The CI step, read rather than trusted

```yaml
      - name: Security headers
        if: steps.changes.outputs.tier == 'code'
        run: |
          command -v docker >/dev/null 2>&1 || { echo "::error::Docker is required to validate the security headers"; exit 1; }
          docker build -t aby-little-lab:headers .
          node scripts/validate-headers.js
```

Three properties matter and all hold:

- **The condition matches the other gated steps.** The executor used `steps.changes.outputs.tier` where the brief said `steps.classify…`; the classifier's id in this workflow is `changes`, and line 107 is identical to lines 69–93 and 165–173, which is what the brief actually required. The deviation is correct and was reported.
- **Docker missing is an error, not a skip.** `exit 1` with an `::error::` annotation. A silently skipped check would make AC-7 mean nothing.
- **The image is built in this job.** Not reused from elsewhere, so a cache hit cannot hide a snippet the Dockerfile stopped copying.

`python -c "import yaml; …"` → `jobs ['quality-gates', 'e2e', 'deploy']`, `step Security headers | if: steps.changes.outputs.tier == 'code'`.

### Commands the executor was denied

| Command | Result |
| --- | --- |
| YAML parse of `.github/workflows/ci.yml` | `ok` — three jobs, step present with the code-tier condition |
| `node scripts/validate-headers.js` | **21 passed, 0 failed**, exit 0 |

### Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 296 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `pnpm test -- --run` | 135 files / 2,927 tests |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21 |
| Build | `pnpm build` | built in 958 ms |
| Bundle | `node scripts/validate-bundle.js` | shell `index-CpDFSutQ.js` 153.6 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed |
| Documents | `node scripts/validate-docs.js` | 5 passed |
| Headers | `node scripts/validate-headers.js` | 21 passed |

No test file or case was added, so the counts are unchanged from Phase 2 by construction — `validate-docs` confirms no document gained a disagreeing claim.

### Acceptance

**AC-7 is partial, and deliberately so.** The step exists, is gated on the code tier, and errors when Docker is absent; the command it runs is proven green locally. What no local run can prove is that GitHub executes it on a `pull_request` and that the docs-only tier skips it. That is observed on this track's PR, and the phase record says so rather than implying otherwise.

### Documentation

`docs/TDD.md` gained §11.6 (the serving layer), a directive table with the reason for each value, the inheritance rule and why the guard test exists, the validator command, and the `E2E_BASE_URL` journey recipe with the note that `vite preview` sends no headers. HSTS, COOP and CORP/COEP are recorded as out of scope with their reasons. `README.md` lists the four headers as a property of what ships and names both proofs. `conductor/product.md` §10.2 records the roadmap row as done with the measured concession and the two demonstrated failures.


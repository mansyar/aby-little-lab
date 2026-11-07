# Phase 3 — Guard it, and record it: verification

- **Track:** `20261107-toolchain-pinning`
- **Phase:** 3 — Guard it, and record it
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-toolchain-pinning`
- **Phase base:** `8da86361`
- **Head (code and documents):** `e6203b05` — `docs(toolchain): state the declared pnpm and Node versions and the CI tiers`, corrected by `76f0d32b` (`docs(toolchain): keep the coverage line at the figure the final chain printed`)
- **Head (guard):** `190387cb` — `test(toolchain): guard the declared pnpm and Node versions across every consumer`
- **Head (evidence):** the commit that adds this file
- **Status:** verified with two blocked actions — the `pnpm-workspace.yaml` deletion and the `conductor/tech-stack.md` edit were both denied by the tool permissions, and are recorded under **Blocked** below.

## Task 1 — the guard (`src/__tests__/guard/toolchain.test.ts`)

Eight assertions in seven `it` blocks, each deriving the truth from `package.json`
(`packageManager`, `engines.node`) and `.node-version`, then making one consumer answer
to it. Every message names the file and both values, so a failure says which file
disagrees and what it says.

| Rule | Asserts | Caught in the mutation proof |
| --- | --- | --- |
| `packageManager` is exact | matches `/^pnpm@\d+\.\d+\.\d+$/`; reports the actual string | — (the declaration is the truth nothing else compares to) |
| `engines.node` admits the pin | the range's text contains the `.node-version` major | **mutation A**: `>=24.0.0 <25` does not contain `22` |
| `.node-version` is usable | one trimmed line, no `v`, matches `/^\d+(\.\d+){0,2}$/` | — (malformation, not drift) |
| Dockerfile agrees | `FROM node:<major>-alpine AS build` and `corepack prepare pnpm@<version>` | **mutation A** (`node:24` vs `22`) and **mutation B** (`node:23` vs `24`) |
| CI reads the declaration | no `version:` under the pnpm step, no `node-version:` literal, `node-version-file: .node-version` twice | — (drift guard for a hand-added literal) |
| Both required checks survive | `quality-gates`/`Quality Gates` and `e2e`/`Browser Journeys`, a `Classify the change` step in each, no `paths-ignore` under `pull_request` | — (a rename would silently weaken branch protection) |
| README agrees | prerequisites state the declared Node major and pnpm version | **mutation A** (`Node.js 24` vs `22`) |
| Only reviewed actions | every `uses:` is in `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `pnpm/action-setup` | — (FR-14: a new third-party action fails here, not review) |

A ninth block asserts every imported file is non-empty, so a broken import cannot make
the negative assertions pass vacuously.

### Mutation proof

Both mutations were applied to the working tree, the suite was run, and the probe was
reverted. `git status --short` after the second revert listed only `README.md` and the
new test file, and no probe appears in any commit.

**Mutation A — `.node-version` set to `22`:**

```
$ pnpm test -- --run

 RUN  v5.0.5 C:/Users/Ansyar/Documents/Upskilling/games/aby-little-lab

 ❯ src/__tests__/guard/toolchain.test.ts (8 tests | 3 failed) 68ms
   ❯ toolchain guard (8)
     × declares a Node engine that .node-version satisfies 36ms
     × builds the image on the declared Node and installs the declared pnpm 4ms
     × states the same versions in the README prerequisites 3ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/guard/toolchain.test.ts > toolchain guard > declares a Node engine that .node-version satisfies
AssertionError: package.json allows node ">=24.0.0 <25" but .node-version says 22: a range that admits a runtime nothing verifies is the drift this pin removes: expected '>=24.0.0 <25' to contain '22'

Expected: "22"
Received: ">=24.0.0 <25"

 ❯ src/__tests__/guard/toolchain.test.ts:165:7
    163|       `package.json allows node "${range}" but .node-version says ${ma…
    164|         "admits a runtime nothing verifies is the drift this pin remov…
    165|     ).toContain(major);
       |       ^
    166|   });
    167|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯

 FAIL  src/__tests__/guard/toolchain.test.ts > toolchain guard > builds the image on the declared Node and installs the declared pnpm
AssertionError: Dockerfile builds on node:24 but .node-version says 22: expected '24' to be '22' // Object.is equality

Expected: "22"
Received: "24"

 ❯ src/__tests__/guard/toolchain.test.ts:196:7
    194|       `Dockerfile builds on node:${dockerMajor || "<no node build stag…
    195|         `says ${nodeMajor}`,
    196|     ).toBe(nodeMajor);
       |       ^
    197|
    198|     const dockerPnpm = /corepack prepare pnpm@(\d+\.\d+\.\d+)/.exec(do…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯

 FAIL  src/__tests__/guard/toolchain.test.ts > toolchain guard > states the same versions in the README prerequisites
AssertionError: README prerequisites say Node.js 24 but .node-version says 22: expected '24' to be '22' // Object.is equality

Expected: "22"
Received: "24"

 ❯ src/__tests__/guard/toolchain.test.ts:268:7
    266|       `README prerequisites say Node.js ${readmeNode || "<nothing>"} b…
    267|         `${nodeMajor}`,
    268|     ).toBe(nodeMajor);
       |       ^
    269|     const readmePnpm = /^-\s+pnpm\s+(\d+\.\d+\.\d+)/m.exec(readmeRaw)?…
    270|     expect(

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/3]⎯


 Test Files  1 failed | 133 passed (134)
      Tests  3 failed | 2917 passed (2920)
   Start at  21:14:17
   Duration  30.65s (tests 54%, transform 16%, environment 13%, import 11%, worker 7%)

[ELIFECYCLE] Test failed. See above for more details.

Exited with code 1
```

**Mutation B — one Dockerfile digit (`FROM node:24-alpine` → `FROM node:23-alpine`):**

```
$ pnpm test -- --run

 RUN  v5.0.5 C:/Users/Ansyar/Documents/Upskilling/games/aby-little-lab

 ❯ src/__tests__/guard/toolchain.test.ts (8 tests | 1 failed) 42ms
   ❯ toolchain guard (8)
     × builds the image on the declared Node and installs the declared pnpm 14ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/guard/toolchain.test.ts > toolchain guard > builds the image on the declared Node and installs the declared pnpm
AssertionError: Dockerfile builds on node:23 but .node-version says 24: expected '23' to be '24' // Object.is equality

Expected: "24"
Received: "23"

 ❯ src/__tests__/guard/toolchain.test.ts:196:7
    194|       `Dockerfile builds on node:${dockerMajor || "<no node build stag…
    195|         `says ${nodeMajor}`,
    196|     ).toBe(nodeMajor);
       |       ^
    197|
    198|     const dockerPnpm = /corepack prepare pnpm@(\d+\.\d+\.\d+)/.exec(do…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 133 passed (134)
      Tests  1 failed | 2919 passed (2920)
   Start at  21:15:08
   Duration  24.03s (tests 62%, environment 13%, import 9%, transform 8%, worker 8%)

[ELIFECYCLE] Test failed. See above for more details.

Exited with code 1
```

Both blocks are the terminal output as printed, with the ANSI colour escapes removed
(the `Expected:`/`Received:` lines carry them inline in the raw capture, around the
diff-highlighted digit).

## Task 2 — delete the dead config

**Blocked.** `git rm pnpm-workspace.yaml` was denied by the tool permissions, in two
forms:

```
$ git rm pnpm-workspace.yaml
{"error":{"type":"permission.rejected","message":"Permission denied: shell"},"content":[]}

$ git rm --dry-run pnpm-workspace.yaml
{"error":{"type":"permission.rejected","message":"Permission denied: shell"},"content":[]}
```

Nothing was worked around: the file is still present and still tracked. The last
contents are a `minimumReleaseAgeExclude` for `@ligne-engine/bundler@0.1.0` and
`@ligne-engine/web@0.2.1`, packages no manifest names since the Ligne engine was
removed. The reference sweep is below; it was run against the tree as it stands.

## Task 3 — the documents state the truth

| File | Change |
| --- | --- |
| `README.md` | Prerequisites to `Node.js 24+` / `pnpm 12.16.1` (landed with the guard, which reads them); the Docker paragraph to the `node:24-alpine` stage that installs the declared pnpm; the CI/CD paragraph gains the classifier, both tiers, the fail-safe-to-`code` rule and the declaration-never-a-literal rule; the suite snapshot to 134 files / 2,920 tests. |
| `docs/TDD.md` | §1.1 Node row → 24 from `.node-version`, pnpm row → 12.16.1 from `packageManager`; the stale `serve` dev-dependency row removed (it was dropped in phase 1); §2.1 tree loses `pnpm-workspace.yaml`, gains `.node-version`, and the Dockerfile comment reads `node:24-alpine`; §11.4 job table names the classifier, the declaration-driven setup and the gated steps; §11.4 prose replaces the blanket `paths-ignore` sentence with what it actually does (the `push` trigger only) and describes the two tiers; §11.5 container prose reads `node:24-alpine` + `pnpm@12.16.1`. Counts: 134 files / 2,920 tests in three places; the coverage figures were left at what the final chain printed. |
| `docs/perf-baseline.md` | Test-suite row → `134 files / 2,920 tests`; coverage row → `97.19 / 91.09 / 96.18 / 98.21`. |
| `conductor/tech-stack.md` | **Blocked** — `edit` was denied. Line 14 still reads `pnpm | 11.17.0`, lines 372/374 still read `Node 22` and `pnpm 11.7.0`, line 163 still carries the 133/2,912 counts, and the dated `2026-11-07 — Design Update (Toolchain Pinning)` entry does not exist. The text to add is in **Blocked** below. |

## Commands

Run on `f67121e8` with the chain the brief names, in one shell invocation:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Command | Exit | Numbers it printed |
| --- | --- | --- |
| `pnpm check` | 0 | `Checked 294 files in 587ms. No fixes applied.` |
| `pnpm typecheck` | 0 | clean: `tsc --noEmit` over `src`, then `-p e2e/tsconfig.json` |
| `pnpm test -- --run` | 0 | **134 test files, 2,920 tests passed**, 27.93 s |
| `pnpm test:coverage` | 0 | statements 97.21 (5967/6138), branches 91.14 (1658/1819), functions 96.18 (1310/1362), lines 98.21 (5551/5652); 35.29 s; every threshold met |
| `pnpm build` | 0 | 363 modules, `built in 1.25s`, 59 precache entries (1751.05 KiB) |
| `node scripts/validate-bundle.js` | 0 | `PASS: Phaser vendor chunk present: phaser-B_vcVLyb.js (1335.0 kB)`; `PASS: shell entry index-CpDFSutQ.js = 153.6 kB (<= 200 kB)` |
| `node scripts/validate-pwa.js` | 0 | `Results: 16 passed, 0 failed` — 47 chunks, 47 precached |
| `node scripts/validate-docs.js` | 0 | `Results: 5 passed, 0 failed`, including `The living docs state the current test-suite truth` |

The chain was run twice on this phase's tree — once on `e6203b05`, and once again on
`f67121e8` with the evidence file present; the table above is the second run. The two
runs agreed on every count except coverage: the first printed statements 97.19
(5966/6138) and branches 91.09 (1657/1819), the second printed 97.21 (5967/6138) and
91.14 (1658/1819). That is the documented per-run v8 instrumentation variance, and one
branch's worth of difference; the documents state the second run's figures, which are
also the ones the file carried before this phase.

The 153.6 kB shell entry is the figure the brief expected, unchanged from phases 1 and 2:
the guard is a test file and the declaration is data, so no production byte moved.

## Acceptance

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| AC-5 — the guard passes on the declared tree and fails, naming the file and both values, when one file's version changes | met | `pnpm test -- --run` green at 134/2,920; both mutation outputs above, each naming file and both values |
| AC-6 — `pnpm-workspace.yaml` is absent and no tracked file mentions it | **not met here** | deletion blocked; see below |
| AC-8 — the three documents state 12.16.1 and 24, the dated entry exists, `validate-docs` passes | partial | README and TDD corrected, `validate-docs` green (5/5); `tech-stack.md` edit blocked, so its §1 row, its CI/Docker entries and the dated entry are outstanding |

## Deviations

| File | Reason |
| --- | --- |
| `README.md` | Its two prerequisite lines were changed in the **guard** commit rather than the documents commit: the guard asserts them, so the suite cannot be green until they state the declared versions. The rest of the README moved with the documents. |
| `docs/TDD.md` | The `serve` dev-dependency row was also removed from §1.1. It was dropped from `package.json` in phase 1 and the table still listed it; leaving a dependency removal undocumented was the same class of drift this track removes. |
| `docs/perf-baseline.md` | The test-suite row moved to 134 files / 2,920 tests because a new test file changes the counts `validate-docs` derives; the coverage row was re-verified and kept its figures (see the next row). No other line in the file was touched. |
| `docs/TDD.md`, `README.md` | The file and test counts moved to 134 / 2,920. Coverage did not move: two runs printed 97.21 / 91.14 and one 97.19 / 91.09, so the documents keep the figure the final chain printed, which is also the pre-existing one. |

## Blocked

Both commands were denied by the tool permissions and not worked around.

| Command | Why | Expected |
| --- | --- | --- |
| `git rm pnpm-workspace.yaml` | P3.T2.1 / FR-7 / AC-6 — the dead config must leave the tree | `rm 'pnpm-workspace.yaml'`; file gone from index and working copy |
| `edit conductor/tech-stack.md` | P3.T3.1 / FR-9 / AC-8 — the document must state the declared versions and carry the dated entry | the edits listed below |

The `tech-stack.md` edits that remain, exactly as intended:

1. §1 table, line 14 — `| **Package Manager** | pnpm | 11.17.0 | Fast, disk-efficient, strict dependency resolution |` becomes `| **Package Manager** | pnpm | 12.16.1 | Fast, disk-efficient, strict dependency resolution; pinned exactly by `packageManager` in `package.json`, which `pnpm/action-setup` and the `Dockerfile` both read |`.
2. §8, the `2026-08-02 — CI/CD Introduction` entry — `Runner: `ubuntu-latest`, Node 22, pnpm 11.7.0 via corepack` becomes the truth: Node 24 read from `.node-version` by `actions/setup-node@v7`, pnpm 12.16.1 read from `packageManager` by `pnpm/action-setup@v6`, with `--frozen-lockfile` and the Dockerfile building on the same major.
3. §8, the `2026-08-02 — CI/CD Deviation Note` — the `version: 11.7.0` pin is superseded: the action now omits `version:` and reads `packageManager`, which is the documented path for pnpm 11+.
4. §8, a new `> **2026-11-07 — Design Update (Toolchain Pinning):**` entry after the §1 table, describing the declaration (`packageManager`, `engines`, `.node-version`), the guard, the two CI tiers and the fail-safe, the `.dockerignore` exclusion of `.conductor`, the deletion of `pnpm-workspace.yaml` and of `serve`, and the suite at 134 files / 2,920 tests.

The reference sweep for `pnpm-workspace`, run with the repository's own grep over all
tracked files:

| Where | What it says |
| --- | --- |
| `docs/TDD.md` §2.1 tree | **removed in this phase** — the tree no longer lists the file |
| `conductor/tracks/20261107-toolchain-pinning/{spec,plan}.md`, `verification/phase-1.md` | the track's own records: the requirement, the task and the phase-1 note |
| `conductor/archive/20261107-release-e2e/plan.md` | an archived plan, a historical record |

No executable or documentation reference remains; every surviving mention is Conductor
state describing or historicalising the removal, which this phase may not edit.

## Notes

- **The workflow-file limit is real and recorded in the guard's doc comment.** The
  guard imports `ci.yml` by literal path. A second workflow file would not be scanned
  until it is added to the import list, because the project ships no Node type
  declarations and therefore no directory listing (`import.meta.glob` does not collect
  dot-prefixed paths). The spec records this as accepted; the `uses:` allowlist and the
  job-name assertions mean a new action or a renamed job inside `ci.yml` still fails.
- **The guard reads YAML by scanning, not parsing.** `blockUnder` and `stepContaining`
  judge nesting by indentation and never interpret a `run:` block, so no YAML
  dependency enters the suite and there is nothing to keep in step with YAML 1.2
  subtleties.
- **Two `it` blocks would have passed vacuously on an empty import**, which is why the
  last block asserts the raw length of all five files: `not.toContain` and
  `not.toBe(found)` are both satisfied by `""`.
- **`pnpm test -- --run <path>` does not filter.** Appending a path after `--` still
  runs the whole suite, so both mutation proofs are full-suite runs and the guard's
  block is read out of the report.
- **The deletion is the one outstanding action.** Until `git rm pnpm-workspace.yaml`
  runs, the working tree still holds the file while `docs/TDD.md` no longer lists it —
  that line was removed with the documents commit on the understanding that the
  deletion lands next. It is a one-line diff to revert if the deletion is instead
  abandoned.

## Primary verification

Verified 2026-11-07 by the primary. Phase base `a23b9b79`, head after this section `76f0d32b` plus the primary's own commit.

### The two blocked actions, done

| Action | Result |
| --- | --- |
| `git rm pnpm-workspace.yaml` | removed from index and working copy; `git status` shows `D pnpm-workspace.yaml`; no tracked file outside Conductor state references it |
| `conductor/tech-stack.md` | §1 table row now reads pnpm 12.16.1 with the `packageManager` note, and a dated `2026-11-07 — Design Update (Toolchain Pinning)` entry was appended |

One deliberate departure from the executor's proposed edit list: the two `2026-08-02` CI/CD entries and the `2026-10-27` dependency-majors entry were **not** rewritten. Dated entries in this document are a log — rewriting them would say the project ran pnpm 12 on 2026-08-02, which is false. The new entry states the current truth and names the earlier entries it supersedes, which is the same treatment given to the two historical `roadmap.md` mentions on 2026-11-07.

### Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 294 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test -- --run` | 134 files / 2,920 tests passed, 39.77 s |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21 |
| Build | `pnpm build` | 59 precache entries (1751.05 KiB) |
| Bundle | `node scripts/validate-bundle.js` | phaser 1,335.0 kB; shell `index-CpDFSutQ.js` 153.6 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed |
| Documents | `node scripts/validate-docs.js` | 5 passed |

### Acceptance

- **AC-5 — met.** The guard derives the truth from `package.json` and `.node-version` and holds the Dockerfile, both CI jobs, the README prerequisites and the action allowlist to it. Proven with two mutations, both captured and reverted: `.node-version` → `22` produced three failures (engine range, Dockerfile base, README) and `FROM node:23` produced one.
- **AC-6 — met.** `pnpm-workspace.yaml` is gone.
- **AC-8 — met.** The three living documents state the declared truth, and `validate-docs` passes at the new counts.

### What the guard does not cover

A second workflow file escapes the guard until it is added to its import list — no Node type declarations means no directory listing, and `import.meta.glob` does not collect dot-prefixed paths. Recorded in the guard's doc comment, in the phase notes and as an accepted limit. A renamed job or a new third-party action inside `ci.yml` still fails, so the escape is narrow: it would take a brand-new file to hide drift.


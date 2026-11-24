# Phase 2 verification — Headed 10x5 measurement evidence

## Result

**Phase result: blocked — the existing worst-cold 400 ms gate failed.**

Phase base: `2f24ddb4`.

No headless or historical data was substituted. Every reported measurement below came from headed Chromium (`TAP_HEADED=1`) against the local production preview.

## Environment

| Check | Result |
|---|---|
| `node --version` | `v24.22.2` |
| `pnpm exec playwright --version` | `Version 1.65.1` |
| Display session | `UserInteractive=True`, `SessionName=Console`, process session `1` |
| Port 4173 before runs | free |
| `git merge-base --is-ancestor 2f24ddb4 HEAD` | exit 0 |

## Task status

| Task | Status | Evidence |
|---|---|---|
| P2.T1 — headed environment | done | versions, interactive session, free port and ancestry above |
| P2.T2 — headed 10x5 evidence | partial | natural and cold-control runs executed and raw JSON committed; AC-2 worst-cold budget failed |
| P2.T3 — project verification | partial | full configured `verify_phase` chain passed; phase remains blocked by the measurement gate |

## Measurement runs

### Natural headed warm-aware run

Command:

`TAP_HEADED=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`

- Exit code: **1**
- Total fresh-context taps: **50**
- Tap kinds: **24 cold / 26 warm**
- Cold aggregate p95: **498.0 ms**
- Worst cold: **Find the Word — 703.8 ms**
- `validate-boot`: exit 0
- Per-game cold p95:
  - Shape Sorter: no cold samples
  - Find the Letter: 199.5 ms (1 cold sample)
  - Find the Word: 703.8 ms (4 cold samples)
  - Add It Up: 359.1 ms (9 cold samples)
  - Memory Match: 279.0 ms (10 cold samples)

This run proved headed warm-aware classification worked, but idle prewarm left only 24 of the 50 taps cold and the worst-cold gate failed.

### Headed cold-control run — attempt 1

Command:

`TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`

- Exit code: **1**
- Total taps: **50**
- Tap kinds: **50 cold / 0 warm**
- Cold aggregate p95: **401.7 ms**
- Cold median: **247.9 ms**
- Worst cold: **Find the Word — 406.9 ms**
- `validate-boot`: exit 0
- Per-game p95: Shape Sorter 342.3 ms; Find the Letter 308.8 ms; Find the Word 406.9 ms; Add It Up 154.8 ms; Memory Match 264.6 ms.

The existing gate failed by 6.9 ms.

### Headed cold-control verification retry — attempt 2 (committed raw artifact)

Command:

`TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`

- Exit code: **1**
- Total taps: **50**
- Tap kinds: **50 cold / 0 warm**
- Cold aggregate p95: **339.3 ms**
- Cold median: **257.2 ms**
- Worst cold: **Find the Word — 507.4 ms**
- `validate-boot`: exit 0
- Per-game p95:
  - Shape Sorter: **339.3 ms** (10 samples)
  - Find the Letter: **304.6 ms** (10 samples)
  - Find the Word: **507.4 ms** (10 samples)
  - Add It Up: **171.5 ms** (10 samples)
  - Memory Match: **293.1 ms** (10 samples)

Raw stdout is committed at `verification/first-tap-headed.json`. It contains the JSON object followed by the script's existing human `FAIL` status line. The committed artifact is the retry run; the natural run and first cold-control attempt were retained as transient diagnostics under `.conductor/runs/` and are summarized above.

## Project verification

The full configured `verify_phase` chain passed on the final tree with exit 0:

| Gate | Result |
|---|---|
| `pnpm check` | 371 files, no fixes |
| `pnpm typecheck` | app + E2E clean |
| `pnpm test -- --run` | 157 files / 3,385 tests |
| `pnpm test:coverage` | statements 97.11%, branches 90.93%, functions 96.33%, lines 98.25% |
| `pnpm build` | Vite 8.3.8, 490 modules, shell 197.64 kB / 50.27 kB gzip, 63 precache entries |
| `validate-bundle` | 193.0 kB <= 200 kB |
| `validate-module-size` | 171 modules, zero warnings |
| `validate-textures` | 319 SVGs, all budgets pass |
| `validate-pwa` | 16/16, 51 chunks precached |
| `validate-docs` | 5/5 |

## Acceptance-criteria status

| AC | Status | Evidence |
|---|---|---|
| AC-2 — 50 cold samples, per-game p95, raw JSON, exit 0 only when worst <=400 | **not met** | 50 cold samples and per-game p95 exist, but the committed run exits 1 because Find the Word is 507.4 ms |
| AC-3 — headed evidence and warm-aware comparison | covered | `TAP_HEADED=1` commands above; natural run shows 24 cold / 26 warm; both cold-control passes are headed |
| AC-8 — full `verify_phase` exit 0 | covered | full project chain above |
| AC-9 — living counts and docs guard | covered | 157 / 3,385; `validate-docs` 5/5 |
| AC-10 — budget logic unchanged | covered | `tapExitCode` remains solely `worst.totalMs > 400`; p95 is report-only |

## Blocking conclusion

The implementation works and produces deterministic cold p95 evidence, but the current measured first-tap path does **not** satisfy the existing 400 ms worst-cold product gate. The natural run failed at 703.8 ms; the 50-cold verification retry failed at 507.4 ms. This is not a headed-environment or tooling failure, and suppressing or averaging it away would violate FR-6 / AC-2 / AC-10.

Phase 2 must remain blocked. Do not open the track PR until the performance breach is resolved in a separate, explicitly scoped performance track or the product owner changes the gate through the proper spec process.

## Primary verification

The phase subagent's shell permission layer denied all preflight diagnostics and the natural measurement command. The primary independently cleared the diagnostics, then executed both headed measurement passes and the verification retry, ran the full project gate, and inspected the raw JSON counts and per-game p95 values. The failure is reproducible across two 50-cold headed runs.

**Primary verdict: blocked — worst-cold 400 ms gate failed.**

## Resumed headed run — 2026-11-24

**Resumed phase result: blocked — the shell permission layer denied the headed measurement and two project validators before execution.** No replacement measurement was attempted, and no headless or historical number is presented as a resumed result.

| Item | Value |
|---|---|
| Track | `20261124-first-tap-p95-baseline` |
| Branch | `chore/20261124-first-tap-p95-baseline` |
| Phase base / HEAD | `c24aaad0` |
| Reviewed dependency | `20261124-word-match-first-tap` / PR #97, merged at `025b037f` |
| Node (primary preflight) | `v24.22.2` |
| Playwright (primary preflight) | `Version 1.65.1` |
| Display (primary preflight) | `UserInteractive=True`, `SessionName=Console` |
| Port 4173 (primary preflight) | free |
| Pre-fix ancestry (primary preflight) | `git merge-base --is-ancestor c24aaad0 HEAD` exit 0 |

The primary supplied these preflight results; this subagent did not repeat the diagnostics. `verification/integrated.md` was not present at this phase base and was read-only for this attempt.

### Task status

| Task | Status | Evidence |
|---|---|---|
| P2.T1 — headed environment | done | primary preflight values above |
| P2.T2 — headed 10x5 evidence | partial | exact natural command denied before execution; no resumed JSON or counts produced |
| P2.T3 — project verification | partial | eight configured commands passed; `validate-module-size.js` and `validate-textures.js` were denied before execution |

### Measurement commands

| Command | Exit | Result |
|---|---|---|
| `TAP_HEADED=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | not executed | `permission.rejected`: `Permission denied: shell` |
| `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | not attempted | the brief permits this control only after a natural run fails to produce 50 cold samples; the denied natural command produced no run, and permission denial requires stopping that command path |

- Stdout/stderr locations: **none created**; the permission layer rejected both the command and any execution before output could be captured.
- `verification/first-tap-headed.json`: **unchanged**. It remains the historical pre-fix failed artifact and is not reused as resumed evidence.
- No raw JSON was generated under `.conductor/runs/20261124-first-tap-p95-baseline/` by this attempt.

Consequently, resumed cold/warm counts, aggregate cold p95, per-game cold p95, worst game, worst total and the unchanged 400 ms gate result are **unavailable**. The historical figures above belong to the preserved failed run only.

### Project verification

Each command was invoked separately, without a shell `&&` chain or pipe. Successful tool invocations exited 0.

| Gate | Exit | Summary |
|---|---|---|
| `pnpm check` | 0 | Biome checked 373 files; no fixes applied |
| `pnpm typecheck` | 0 | app and E2E TypeScript checks clean |
| `pnpm test -- --run` | 0 | 158 files / 3,393 tests passed |
| `pnpm test:coverage` | 0 | statements 97.10%, branches 90.96%, functions 96.35%, lines 98.23%; all thresholds cleared |
| `pnpm build` | 0 | Vite 8.3.8; 491 modules; shell entry 197.99 kB / 50.39 kB gzip; 64 precache entries |
| `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell entry 193.4 kB <= 200 kB |
| `node scripts/validate-module-size.js` | not executed | `permission.rejected`: `Permission denied: shell` |
| `node scripts/validate-textures.js` | not executed | `permission.rejected`: `Permission denied: shell` |
| `node scripts/validate-pwa.js` | 0 | 16 passed / 0 failed; 52 emitted JavaScript chunks precached |
| `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed |

Per the resumed brief, the chained `verify_phase` command was not run; the primary owns the independent integrated gate. AC-8 cannot be marked complete until the denied validators and integrated gate are run successfully.

### Acceptance-criteria status

| AC | Status | Evidence |
|---|---|---|
| AC-2 — 50 cold samples, per-game p95, raw JSON and budget-governed exit | blocked | natural headed command was denied before execution; no resumed artifact exists |
| AC-3 — headed warm-aware evidence | blocked | `TAP_HEADED=1` was requested, but permission denial prevented browser launch and data collection |
| AC-5 — published p95 demonstrates the budget or records a breach | blocked | no resumed measurement is available |
| AC-8 — full configured gate | partial | eight commands passed; two validators were denied; primary integrated verification remains outstanding |
| AC-10 — budget logic unchanged | covered by static review | `tapExitCode` still gates only `worst.totalMs > budgetMs`; p95 remains report-only, and this phase changed no source |

### Blockers

1. Command: `TAP_HEADED=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`
   - Why needed: produce the required headed, warm-aware 10x5 raw JSON evidence and exit status.
   - Expected: execute against the local production preview and return the unchanged JSON object plus the script's PASS/FAIL line; exit 0 only when the worst cold total is <= 400 ms.
   - Actual: `permission.rejected` — `Permission denied: shell`.
2. Command: `node scripts/validate-module-size.js`
   - Why needed: complete the configured Phase 2 project gate.
   - Expected: exit 0 with the module-size validation result.
   - Actual: `permission.rejected` — `Permission denied: shell`.
3. Command: `node scripts/validate-textures.js`
   - Why needed: complete the configured Phase 2 project gate.
   - Expected: exit 0 with the texture-budget validation result.
   - Actual: `permission.rejected` — `Permission denied: shell`.

No denied command was retried or rephrased.

### Scope audit and deviations

- `git status --short` before verification: no output (clean tree).
- `git diff --stat` before evidence editing: no output.
- This resumed attempt changes only `conductor/tracks/20261124-first-tap-p95-baseline/verification/phase-2.md`.
- `verification/first-tap-headed.json` remains byte-unchanged; no source, tests, config, package/lockfiles, product docs or other Conductor state were edited.
- Deviations: none.

The primary must run the three denied commands itself, capture the natural headed stdout/stderr under `.conductor/runs/20261124-first-tap-p95-baseline/`, use the approved cold control only if the natural run does not yield exactly 50 cold / 0 warm samples, and append its verification below.

## Primary verification

### Primary resumed measurements

The primary ran the three denied commands verbatim on phase base `c24aaad0`.

| Command | Exit | Result |
|---|---:|---|
| `TAP_HEADED=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | 0 | 50 taps, but only 1 cold / 49 warm; natural run retained as supporting evidence |
| `TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10` | 0 | 50 cold / 0 warm; committed resumed raw evidence |
| `node scripts/validate-module-size.js` | 0 | 172 TypeScript modules, zero warnings |
| `node scripts/validate-textures.js` | 0 | 319 SVGs; tiered 76.07/80 MiB, full 319.00/320 MiB, ratio 0.238/0.500 |

Raw resumed output:

- Natural: `.conductor/runs/20261124-first-tap-p95-baseline/resumed-natural.stdout.txt`
- Cold control: `.conductor/runs/20261124-first-tap-p95-baseline/resumed-cold.stdout.txt`
- Stderr: empty for both runs
- Committed unchanged JSON object: `verification/first-tap-headed.json`
- Historical pre-fix raw JSON preserved at
  `.conductor/runs/20261124-first-tap-p95-baseline/pre-fix-first-tap-headed.json`

Cold-control aggregate cold p95:

| Stage | p95 |
|---|---:|
| Response | 63.3 ms |
| Finished | 45.2 ms |
| Total | 270.1 ms |

Per-game cold p95 totals:

| Game | Samples | Response | Finished | Total |
|---|---:|---:|---:|---:|
| Shape Sorter | 10 | 53.6 ms | 43.5 ms | 277.5 ms |
| Find the Letter | 10 | 51.1 ms | 45.2 ms | 241.4 ms |
| Find the Word | 10 | 97.2 ms | 38.1 ms | **249.6 ms** |
| Add It Up | 10 | 68.4 ms | 48.3 ms | 270.1 ms |
| Memory Match | 10 | 53.8 ms | 50.0 ms | 223.5 ms |

Worst cold total: **Shape Sorter — 277.5 ms**, below the unchanged 400 ms gate.
Find the Word p95 and worst are both below 400 ms. The raw JSON assertions
verified exactly five games, 10 cold samples each, 50 cold / 0 warm overall, all
five per-game p95 rows, and `worst.totalMs <= 400`.

### Primary project verification

The primary ran the complete configured `verify_phase` chain on the final tree:

`PHASE2_VERIFY_PHASE_EXIT=0`

| Gate | Result |
|---|---|
| `pnpm check` | 373 files, no fixes |
| `pnpm typecheck` | app + E2E clean |
| `pnpm test -- --run` | 158 files / 3,393 tests |
| `pnpm test:coverage` | statements 97.10%, branches 90.96%, functions 96.35%, lines 98.23% |
| `pnpm build` | Vite 8.3.8, 491 modules, shell 197.99 kB / 50.39 kB gzip, 64 precache entries |
| `validate-bundle` | shell 193.4 kB <= 200 kB |
| `validate-module-size` | 172 modules, zero warnings |
| `validate-textures` | 319 SVGs, all budgets pass |
| `validate-pwa` | 16/16, 52 chunks precached |
| `validate-docs` | 5/5 |

### Scope and acceptance

- The resumed phase changes only `verification/phase-2.md` and
  `verification/first-tap-headed.json`.
- No source, test, config, package, lockfile, product doc or other Conductor
  state changed during the resumed measurement.
- The approved dependency is exactly the reviewed PR #97 Word Match fix.
- AC-2, AC-3, AC-5 and AC-8 are covered by the resumed raw JSON and full gate.
- The failed pre-fix measurements remain preserved as historical evidence.

**Primary verdict: verified.**

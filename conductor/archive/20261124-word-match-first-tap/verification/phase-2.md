# Phase 2 verification — Headed performance proof

- Track: `20261124-word-match-first-tap`
- Phase: `2`
- Date: `2026-11-24T19:56:38+11:00`
- Branch: `fix/20261124-word-match-first-tap`
- Base commit: `c8665276481e08a8a35c3d66865872f40f5f76ed`
- Head commit: `c8665276481e08a8a35c3d66865872f40f5f76ed` (evidence uncommitted at verification time)
- Result: `verified`

## Environment

| Item | Value |
| --- | --- |
| Node | `v24.22.2` |
| Playwright | `Version 1.65.1` |
| Interactive session | `UserInteractive=True`, `SessionName=Console`, `ProcessSessionId=1` |
| Port 4173 | free before the run |
| Chromium mode | headed (`TAP_HEADED=1`) |
| Cold control | `TAP_INERT_IDLE=1` |

## Measurement

Exact logical command:

`TAP_HEADED=1 TAP_INERT_IDLE=1 node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10`

PowerShell invocation used by the primary:

`$env:TAP_HEADED="1"; $env:TAP_INERT_IDLE="1"; $process = Start-Process -FilePath "node" -ArgumentList @("scripts/measure-first-tap.mjs", "--with-preview", "--json", "--warm-aware", "--samples", "10") -RedirectStandardOutput "...\phase-2-measure.stdout.txt" -RedirectStandardError "...\phase-2-measure.stderr.txt" -NoNewWindow -Wait -PassThru`

- Exit code: `0`
- Raw stdout: `.conductor/runs/20261124-word-match-first-tap/phase-2-measure.stdout.txt`
- Raw stderr: `.conductor/runs/20261124-word-match-first-tap/phase-2-measure.stderr.txt` (empty)
- Committed JSON artifact: `conductor/tracks/20261124-word-match-first-tap/verification/first-tap-word-match.json`
- Human status line: `PASS: worst cold game Find the Word total 251.2 ms (cold median across games 185.1 ms)`

The script appends that human line after the JSON object. The committed artifact contains the unchanged JSON object; no measurement values were altered.

## Results

| Metric | Result |
| --- | --- |
| Cold samples | 50 |
| Warm samples | 0 |
| Samples per game | 10 |
| Aggregate cold p95 total | 237.4 ms |
| Aggregate cold median total | 185.1 ms |
| Worst cold game | Find the Word |
| Worst cold total | 251.2 ms |
| `validate-boot` exit | 0 |
| Boot median / throttled median | 407.9 ms / 1295.0 ms |

| Game | Cold samples | p95 response | p95 finished | p95 total |
| --- | ---: | ---: | ---: | ---: |
| Shape Sorter | 10 | 55.6 ms | 47.0 ms | 235.1 ms |
| Find the Letter | 10 | 66.7 ms | 59.2 ms | 181.6 ms |
| Find the Word | 10 | 71.6 ms | 54.5 ms | 251.2 ms |
| Add It Up | 10 | 43.0 ms | 31.7 ms | 242.4 ms |
| Memory Match | 10 | 59.6 ms | 50.2 ms | 200.8 ms |

Find the Word p95 and worst are both 251.2 ms, within the unchanged 400 ms gate. The worst non-Find-the-Word sample is 242.4 ms, also within budget.

## Project verification

| Command | Exit code | Summary |
| --- | --- | --- |
| `pnpm check` | 0 | 373 files, no fixes. |
| `pnpm typecheck` | 0 | App and E2E clean. |
| `pnpm test -- --run` | 0 | 158 files / 3,393 tests. |
| `pnpm test:coverage` | 0 | Statements 97.10%, branches 90.96%, functions 96.35%, lines 98.23%. |
| `pnpm build` | 0 | 491 modules; shell 197.99 kB; 64 precache entries. |
| `node scripts/validate-bundle.js` | 0 | Shell 193.4 kB <= 200 kB. |
| `node scripts/validate-module-size.js` | 0 | 172 modules, zero warnings. |
| `node scripts/validate-textures.js` | 0 | 319 SVGs, all budgets pass. |
| `node scripts/validate-pwa.js` | 0 | 16/16; 52 chunks precached. |
| `node scripts/validate-docs.js` | 0 | 5/5. |
| Full configured `verify_phase` chain | 0 | `VERIFY_PHASE_EXIT=0`. |

## Acceptance criteria

| AC | Status | Evidence |
| --- | --- | --- |
| AC-5 | covered | Raw JSON contains 50 cold / 0 warm samples, 10 per game, five p95 rows, Find the Word p95/worst 251.2 ms and all other worst values <=400 ms; command exit 0. |
| AC-8 | covered | The headed run succeeded on the first scoped implementation; no gate change, headless substitution, target change or scope expansion was used. |

## Static scope audit

Phase 2 changed only:

- `conductor/tracks/20261124-word-match-first-tap/verification/first-tap-word-match.json`
- `conductor/tracks/20261124-word-match-first-tap/verification/phase-2.md`

No source, test, config, package, lockfile, product doc or other Conductor state changed in this phase. `git diff -- package.json pnpm-lock.yaml` remains empty.

## Deviations

- The Phase 2 subagent's headed command and optional ancestry check were permission-denied. The primary ran both verbatim. The measurement completed with exit 0; ancestry exit was 0. No retry or headless substitution was used by the subagent.
- The script's trailing human PASS line was separated from the JSON object when writing the committed artifact. The JSON object and every measurement value are unchanged.

## Primary verification

The primary independently parsed the committed JSON and asserted: 50 cold samples, 0 warm samples, exactly 10 cold samples for each of the five games, five p95 rows, Find the Word p95/worst <=400 ms, all other cold totals <=400 ms, and `validate-boot` exit 0. The primary then ran the full configured `verify_phase` chain on the final tree; it exited 0.

**Primary verdict: verified.**

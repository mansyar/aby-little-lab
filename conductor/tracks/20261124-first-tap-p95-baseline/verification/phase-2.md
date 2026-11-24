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

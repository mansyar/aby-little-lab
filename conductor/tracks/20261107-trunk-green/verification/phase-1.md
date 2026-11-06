# Phase 1 — Audit and convert the clock stand-ins

- **Track:** `20261107-trunk-green` — Trunk Green — Wall-Clock-Safe Test Fixtures
- **Phase:** 1 — Audit and convert the clock stand-ins
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-trunk-green`
- **Phase base:** `697ed5f6889f0983cf38ec00d52121c8db0102f9`
- **Head (code + audit):** `a7977db0` — this report is committed directly after it and changes no code
- **Result:** **verified**
- **Covers:** FR-1, FR-3, AC-1, AC-3

## What the phase established

Every bare `YYYY-MM-DD` literal in the test tree now has a recorded verdict, and
no fixture writes a literal into a field that production compares against today.
The classification lives in **`verification/date-literal-audit.md`**, which is the
artifact AC-1 is satisfied by: 29 rows, one per matching line, each naming the
file, line, field, the API that consumes the value, the verdict (`data` or
`clock stand-in`), and the reason.

Five rows are clock stand-ins — every one of them an assignment to
`lastUsedDate`, the field `normalizePlayTime` compares with `todayKey()`:

| Site | Conversion |
|------|------------|
| `PlayTimeIndicator.test.ts:51` | `"2026-01-01"` → `TODAY`, derived as `todayKey(FIXED_NOW)` from a clock captured once at module load |
| `storage.test.ts:911` | `"2026-08-05"` → `todayKey()` |
| `playTimeLogic.test.ts:23` (fixture default) | `"2026-08-05"` → `todayKey(DAY)` |
| `playTimeLogic.test.ts:40` (expected value) | `"2026-08-05"` → `todayKey(DAY)` |
| `playTimeLogic.test.ts:64` (expected value) | `"2026-08-05"` → `todayKey(DAY)` |

The other 24 rows are data: `hubPrewarm`'s `lastPlayedAt` stamps are only
compared with each other (descending), and `progressLogic`'s `activity[].day`
payloads and expectations are evaluated against an explicitly injected
`DAY` / `NEXT_DAY` / `THREE_DAYS_LATER`, so `pruneActivity`'s 7-day cutoff is
relative to the fixture day, not the host calendar.

## Commands

| Layer | Command | Exit | Summary |
|-------|---------|------|---------|
| inventory (native search) | `pattern: "\"\d{4}-\d{2}-\d{2}\""`, `path: src/__tests__`, `include: *.ts` | 0 | 29 matching lines / 31 quoted day-key literals across 5 files — matches the brief's count |
| AC-3 scan (native search) | `pattern: lastUsedDate:\s*"\d{4}-\d{2}-\d{2}"`, `path: src/__tests__`, `include: *.ts` | 0 | **no matches** — no quoted date is assigned to `lastUsedDate` anywhere in the test tree |
| unit | `pnpm test -- --run` | 0 | 131 test files / 2829 tests passed; 24.39 s |

The phase brief names `pnpm test -- --run` as this phase's verification command,
so the static, coverage, build-artifact and documents layers are not part of
this record: they are Phase 2's gate (AC-6). The test count is unchanged from the
pre-phase baseline (131 files / 2829 tests), which is the NFR-4 property this
phase could affect.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|----|-----------|----------|--------|
| AC-1 | The evidence table lists all 29 literals with a verdict | `verification/date-literal-audit.md` — 29 rows, each with file, line, field, consuming API, verdict and reason | met |
| AC-3 | A grep for a quoted date on `lastUsedDate` in the test tree returns nothing | the AC-3 scan above returns no matches, after the five conversions | met |
| FR-1 | Every date literal is classified as data or clock stand-in, with file, line and verdict recorded | the same audit table | met |
| FR-3 | Every clock stand-in derives its date from an explicit clock | all five converted sites now call `todayKey(...)`; no suite-wide fake timer was introduced | met |

AC-2, AC-4, AC-5 and AC-6 belong to Phase 2 and are not claimed here.

## Evidence paths

- `conductor/tracks/20261107-trunk-green/verification/date-literal-audit.md` — the
  per-literal audit (the AC-1 artifact)
- `conductor/tracks/20261107-trunk-green/verification/phase-1.md` — this report

## Deviations

| File | Reason |
|------|--------|
| `src/__tests__/game/playTimeLogic.test.ts` | Outside the brief's `Touches`. Three `lastUsedDate:` literals there would otherwise fail AC-3's "grep returns nothing" and, in Phase 2, the guard that scans every `.ts` under `src/__tests__` (FR-2). The change is the minimum: the fixture default and two expectations now derive from the `DAY` clock they already receive. |

`storage.test.ts:911` is inside `Touches`; the brief's "keep as data if nothing
compares it to today" conditional resolved to *convert*, because the payload is
read through `normalizeV2` → `normalizePlayTime`, which does compare the value
with today. No assertion observed the rollover, but the field is date-typed and
the scan requirement is unconditional, so it became `todayKey()`.

`hubPrewarm.test.ts` was inspected and left unchanged, as the brief directs: its
two literals are `lastPlayedAt` stamps used only for relative ordering.

## Notes

- The brief's per-file split of the 29 (`playTimeLogic.test.ts` 6,
  `progressLogic.test.ts` 20) does not match a fresh scan: it is 7 lines in
  `playTimeLogic.test.ts` and 19 in `progressLogic.test.ts`. The **total of 29
  matching lines is exact**; the audit lists all 29 and notes the two lines that
  carry two literals each (31 quoted literals in total). Those two figures are
  the only inventory deltas, and they change no verdict.
- The spec's Open Questions assumed "26 of the 29 literals are data". The audit
  supersedes that with **24 data rows / 5 stand-ins**: the fourth line the
  assumption missed is `storage.test.ts:911`, which reaches `normalizePlayTime`
  through `normalizeV2`.
- `FIXED_NOW` is the current time captured at module load, not a hardcoded date.
  A hardcoded date would make the fixture stale relative to the real clock and
  reintroduce the bug; capturing the clock once keeps the fixture genuinely
  "today" while making a run that straddles midnight deterministic.
- No production file was touched, and no vulnerability, secret, or dependency
  change was introduced.

## Primary verification

- **Date:** 2026-11-07
- **Verified by:** primary agent, independently of the phase subagent
- **Head at verification:** `63f6716d`

| Check | Command | Exit | Result |
|-------|---------|------|--------|
| Tree clean | `git status --porcelain` | 0 | empty |
| Commits in range | `git log --oneline 697ed5f6..HEAD` | 0 | 3 commits, all reported, none a merge |
| Scope | `git diff --name-only 697ed5f6..HEAD` | 0 | 2 test files + 2 evidence files; `playTimeLogic.test.ts` is the reported deviation |
| AC-3 scan | `lastUsedDate:\s*"20\d\d-\d\d-\d\d"` over `src/__tests__` | 0 | 0 matches |
| Lint | `pnpm check` | 0 | 270 files, no findings |
| Typecheck | `pnpm typecheck` | 0 | clean |
| Unit | `CI=true pnpm test -- --run` | 0 | 131 files / 2829 tests passed |
| Coverage | `CI=true pnpm test:coverage` | 0 | statements 97.87 / branches 92.16 / functions 97.01 / lines 98.76 |
| Build | `pnpm build` | 0 | succeeded |
| Bundle artifact | `node scripts/validate-bundle.js` | 0 | phaser 1335.0 kB, shell 150.0 kB <= 200 kB |
| PWA artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 47 chunks precached |
| Documents | `node scripts/validate-docs.js` | 0 | 5 passed |

**Deviation accepted.** `src/__tests__/game/playTimeLogic.test.ts` sits outside
the plan's Touches, but it carries three bare `lastUsedDate` literals that would
fail AC-3 against this phase's own scan and Phase 2's guard. Converting them to
`todayKey(DAY)` is inside the phase goal, and the conversion is visible in the
squashed phase commit.


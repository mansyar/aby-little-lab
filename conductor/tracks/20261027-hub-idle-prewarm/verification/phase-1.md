# Phase 1 — Prewarm module with an injected scheduler

- **Track:** 20261027-hub-idle-prewarm — Hub Idle Chunk Prewarm
- **Phase:** 1
- **Date:** 2026-10-27
- **Branch:** `feat/20261027-hub-idle-prewarm`
- **Base commit:** `300f98dc`
- **Head commit:** `a76da8e9`
- **Result:** ✅ verified

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Lint/format | `pnpm check` | 0 | 0 errors, 1 pre-existing warning (`musicalMemoryScene.test.ts:296`, file untouched by this phase) |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` clean, tests included |
| Tests | `pnpm test -- --run` | 0 | 126 files / 2,747 tests, all green (16.96 s) |
| Coverage | `pnpm test:coverage` | 0 | stmts 97.79 (5549/5674), branches 91.82 (1516/1651), funcs 96.73 (1154/1193), lines 98.72 (5172/5239) — all above gates (90/85/88/95) |
| Build | `pnpm build` | 0 | shell entry `index-B3pDeagg.js` = 139.0 kB (≤ 200 kB), Phaser vendor chunk present, 42 chunks emitted, precache 54 entries (1720.45 KiB) |
| Bundle guard | `node scripts/validate-bundle.js` | 0 | all checks passed |
| PWA guard | `node scripts/validate-pwa.js` | 0 | 16/16 — 42 chunks, 42 precached, no Ligne assets |
| Docs guard | `node scripts/validate-docs.js` | 0 | 6/6, incl. the count-drift guard against the derived suite truth (126 files / 2,747 tests) |

Full chain run once as a single record:
`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` — exit 0.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 (engine half) | One-at-a-time idle-paced imports through an injected scheduler | `startPrewarm` requests the next idle slot only after the previous import settles (`pump`/`runOne` in `src/game/hub/prewarm.ts`); tests "keeps exactly one import in flight until it settles", "does not request an idle slot while an import is in flight or after the queue drains" | ✅ |
| FR-1 (ordering half) | Recency-first order: `lastPlayedAt` desc, never-played last in grid order, ties by grid order | `recencyFirstOrder` (pure, no imports); tests: desc sort, never-played grid order, ties by grid, all-null → grid order, unparseable → never-played, no input mutation | ✅ |
| FR-3 | Idempotent + silent on failure: imported keys skipped without consuming an idle slot; rejected import swallowed, no unhandled rejection, no retry | `imported` set skip in `startPrewarm`; `catch` block in `runOne`; tests "skips already-imported keys without consuming an idle slot", "swallows a rejected import and continues with the next key" | ✅ |
| AC-1 | Fake scheduler proves recency-first order at idle pace, one at a time, never without an idle slot | `FakeScheduler` manual-queue tests (4 in "idle pacing" describe), integrated with `recencyFirstOrder` | ✅ |
| AC-2 | `cancel()` stops pending work; tap path unaffected | Tests "cancels a pending slot so no further imports fire", "discards the outcome", "a loader cancelled mid-queue still works when called directly" — the direct loader call resolves after cancel | ✅ |
| AC-4 | Rejected import swallowed; later tap still loads (engine poisons nothing) | Rejection swallowed, queue continues, failed key NOT marked imported, retried on the next run (documented choice) — tests in "failure handling" describe | ✅ |
| NFR-3 | TSDoc with contract wording; `pnpm check` / `pnpm typecheck` clean | Module TSDoc states the pacing contract and tap-wins rule; both commands green | ✅ |
| NFR-4 | No new runtime dependencies | `package.json` untouched; engine imports nothing but the platform scheduler | ✅ |
| NFR-3 (counts) | Count-drift guard green | `validate-docs.js` check 6 passed; living-doc counts refreshed to 126 files / 2,747 tests | ✅ |

## Tasks

| Task | Status | Commit |
|---|---|---|
| P1.T1.1 — `src/game/hub/prewarm.ts` engine (`startPrewarm`, `PrewarmController.cancel`, `defaultIdleScheduler` rIC + 16 ms setTimeout fallback) | done | `0be6517a` |
| P1.T1.2 — pure `recencyFirstOrder(progress, gridOrder, allKeys)` | done | `0be6517a` |
| P1.T1.3 — seeded unit tests (18, plain fixtures, no randomness — `mulberry32` not needed) | done | `0be6517a` |
| P1.T2.1 — count claims refreshed (README :49, TDD :1015/:1029, perf-baseline :411); coverage snapshot refreshed because the denominators moved (new source file): TDD :1035, perf-baseline :412/:414, dates → 2026-10-27 | done | `a76da8e9` |

## Design decisions recorded in TSDoc

- **Failed keys are NOT marked imported** (per the brief): the next controller run re-attempts them; each run is one pass over the queue, and the caller re-runs `startPrewarm` with the same shared `imported` set on the next visit.
- **Cancelled in-flight imports are discarded** (spec edge case "shutdown mid-import discards in-flight result"): the module cache side effect is harmless, but the outcome is not recorded and schedules nothing further.
- **Unparseable/empty timestamps count as never-played** in `recencyFirstOrder` (deterministic tie into the never-played bucket, grid order preserved).
- The engine takes an ordered `entries` list; the ordering policy lives at the call site via the exported pure `recencyFirstOrder` (the brief's "ordered list" form; the "re-order callback" alternative was not needed since the caller can recompute per run).

## Deviations

- **Brief said `GameProgress.lastPlayedAt: number | null`; the codebase type is `string | null`** (ISO timestamp, `src/types/index.ts:41`). The ordering helper follows the real type: it takes a structural `Record<string, { lastPlayedAt: string | null }>` and compares via `Date.parse`. No product decision involved — the brief's type was a transcription error.
- Files outside `Touches`: none. All changes are within the declared Touches.

## Evidence paths

- Engine: `src/game/hub/prewarm.ts`
- Tests: `src/__tests__/game/hub/prewarm.test.ts` (18 tests, 1 file)
- Doc count refreshes: `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`
- Commits: `0be6517a` (feat), `a76da8e9` (docs)

## Notes

- Phase 2 integration contract the engine already satisfies: `startPrewarm` accepts an `imported` set so the Hub can share idempotency across visits; `cancel()` is safe to call repeatedly and after drain; the default scheduler is built at module level, tests inject fakes.
- Out-of-scope doc drift observed but deliberately untouched (Phase 3 owns docs truth): the tree-diagram file counts (`56 files` in `src/game`, `hub/ 6` in README:81/TDD:200) now under-count by the new `prewarm.ts`; the count-drift guard does not check those lines, so the gate stays green.
- Pre-existing lint warning in `src/__tests__/scenes/musicalMemoryScene.test.ts:296` (non-null assertion) — not from this phase, left alone per surgical-changes rule.
- Coverage of `prewarm.ts` itself: 94.91 % stmts / 84.84 % branches (uncovered lines 111, 115 — the defensive `!next` guard and the cancelled-after-fire return). Global gates still pass; not required to cover file-locally.

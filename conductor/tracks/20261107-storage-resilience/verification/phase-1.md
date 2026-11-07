# Phase 1 verification — The save layer made total

- Track: `20261107-storage-resilience` — Storage Resilience
- Phase: 1 — The save layer made total
- Date: 2026-11-07
- Branch: `fix/20261107-storage-resilience`
- Phase base: `57f045ce6d889f3cfe5647cd229cc00fc81210e2`
- Head commit: `e7f64b0e` (phase work: `5fd374d7`, `43755a51`, `e7f64b0e`)
- Result: **blocked** — every code layer is green; the final gate command exits 1
  only at `node scripts/validate-docs.js`, because the living docs still state the
  pre-phase suite counts (`133 files / 2,881 tests`) and the suite now holds
  `133 files / 2,902 tests`. `README.md`, `docs/TDD.md` and `docs/perf-baseline.md`
  are product docs, which this phase may not edit (see Deviations).

## Commands

Run as the single verification command from the phase brief:

```
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | `Checked 292 files. No fixes applied.` |
| types | `pnpm typecheck` | 0 | `tsc --noEmit` clean for `src` and `e2e` |
| unit | `pnpm test -- --run` | 0 | `133 passed (133)` files / `2902 passed (2902)` tests, 56.65 s |
| coverage | `pnpm test:coverage` | 0 | statements 97.18 (5940/6112), branches 91.15 (1629/1787), functions 96.17 (1308/1360), lines 98.18 (5526/5628) — thresholds 95/88/85/90 met project-wide; `src/utils/storage.ts` 98.5 statements / 91.42 branches / 100 functions / 98.18 lines |
| build-artifact | `pnpm build` | 0 | 363 modules, PWA `generateSW`, 59 precache entries |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1335.0 kB); shell entry 152.8 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| docs | `node scripts/validate-docs.js` | 1 | 4 checks pass; check 6 "The living docs state the current test-suite truth" fails on 5 count claims (see Blocked) |

Combined command exit: **1**.

## Red run (P1.T1.5)

Command, verbatim, against the **unmodified** `src/utils/storage.ts` (only the
three test files and the new test helper existed in the tree):

```
pnpm test -- --run
```

Exit code **1**. Suite-wide: `Test Files 2 failed | 131 passed (133)`,
`Tests 14 failed | 2881 passed (2895)`. Nothing else in the suite failed.

Failing tests, verbatim names, with their assertion messages:

| # | Test | Message |
| --- | --- | --- |
| 1 | `gameSceneBase.test.ts > GameSceneBase scaffold > completeGame > still celebrates and schedules the way home when the store refuses the write` | `AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown` (`gameSceneBase.test.ts:555`) |
| 2 | `storage.test.ts > when a write cannot be persisted > earnSticker returns normally and the sticker is earned in memory` | `AssertionError: expected [Function] to not throw an error but 'DOMException' was thrown` (`storage.test.ts:1392`) |
| 3 | `… > updateSettings applies the toggle in memory and keeps serving it` | same message (`:1402`) |
| 4 | `… > resetProgress clears the earned stickers in memory` | same message (`:1412`) |
| 5 | `… > addProfile adds the profile and makes it active` | `QuotaExceededError: simulated QuotaExceededError` |
| 6 | `… > deleteProfile removes the profile` | `AssertionError: … 'DOMException' was thrown` (`:1434`) |
| 7 | `… > switchProfile switches the active profile` | `QuotaExceededError: simulated QuotaExceededError` |
| 8 | `… > setPlayTimeLimit stores the limit in memory` | `AssertionError: … 'DOMException' was thrown` (`:1452`) |
| 9 | `… > recordPlayTime accrues the usage in memory` | same message (`:1460`) |
| 10 | `… > recordGamePlay counts the play in memory` | same message (`:1468`) |
| 11 | `… > recordGameResult records the win and the taps in memory` | same message (`:1476`) |
| 12 | `… > recordGameTaps moves the rolling window in memory` | same message (`:1487`) |
| 13 | `storage.test.ts > when a read cannot be performed > serves fresh defaults from every getter and never throws` | `AssertionError: … 'DOMException' was thrown` (`:1511`) |
| 14 | `… > keeps the session usable when reads and writes are both blocked` | same message (`:1536`) |

Full transcript (verbatim, including the failure diffs and code frames):
`.conductor/evidence/phase-1-red-run.md`.

All 14 failures are the defect itself: the `DOMException` from
`localStorage.setItem` (quota) or `localStorage.getItem` (blocked access) escapes
the save layer. After the fix the same command reports `2902 passed (2902)`, so
the tests have teeth in both directions.

## Acceptance

| AC | What it requires | Proving test(s) | Status |
| --- | --- | --- | --- |
| AC-1 | With `setItem` throwing, every write returns normally and a getter reflects the change | `when a write cannot be persisted` — 11 tests, one per mutator: `earnSticker`, `updateSettings`, `resetProgress`, `addProfile`, `deleteProfile`, `switchProfile`, `setPlayTimeLimit`, `recordPlayTime`, `recordGamePlay`, `recordGameResult`, `recordGameTaps` | pass |
| AC-2 | With `setItem` throwing, `completeGame` still runs the celebration and schedules the auto-return | `gameSceneBase.test.ts > completeGame > still celebrates and schedules the way home when the store refuses the write` (win sound, cheer texture, celebration graphics, sticker image, `delayedCall(3000)`, `scene.start("Hub", { justEarned })` after `fireAutoReturn`) | pass |
| AC-3 | With `getItem` throwing, getters return defaults and nothing throws during hub construction | `when a read cannot be performed > serves fresh defaults from every getter and never throws` (all seven exported getters) and `> keeps the session usable when reads and writes are both blocked` | pass |
| AC-4 | Flag false on a working store, true after a failed write, true after a failed read, false after a successful write, false on the unknown-version write-protection path, false for a declined mutator | `degraded persistence flag > stays false while the store accepts every access`; `> is raised by a failed write and cleared by the next accepted one`; `> is raised by a failed read`; `> stays false for a write-protected future payload`; `> stays false when a mutator declines`; `> serves defaults and keeps playing when the global is absent` | pass |
| AC-6 | On a working store the written raw string, the read results, v1 migration, corrupt-JSON fallback and unknown-version protection are unchanged | The pre-existing `schema versioning` (9 tests), `v2 state cache (memoization)` (7), `storage reads` v1-migration set, and the new `degraded persistence flag > hands a recovered device exactly the bytes a healthy one received` (identical raw string after failure + recovery) | pass |
| AC-8 | The new unit tests fail against pre-fix `storage.ts` and pass after, recorded | Red run above: 14 failures pre-fix, 0 after | pass |

Not covered here by design: AC-5 (Settings notice) and AC-7 (browser journey) belong to Phase 2.

## Evidence paths

- `.conductor/evidence/phase-1-red-run.md` — full verbatim pre-fix transcript.
- This file.

## Deviations

| File | Why |
| --- | --- |
| `src/__tests__/helpers/throwingStorage.ts` (new, outside `Touches`) | The brief allows extending a test helper inside `src/__tests__/`. Both touched test files need the same throwing-store harness, and happy-dom makes the naive form wrong: it binds each `Storage` method onto the instance as an own property on first access, so `vi.spyOn(Storage.prototype, "setItem")` never reaches `localStorage.setItem` (proven by the first red attempt, where every write-path test passed vacuously), and the `Storage` proxy's `set` trap discards instance assignment. Re-defining the own property is the only route the proxy honours, so it lives in one shared helper rather than being duplicated. |

## Blocked

`node scripts/validate-docs.js` fails check 6 only. The validator derives the
truth with a collect-only `vitest list` (`133 files / 2,902 tests`) and compares
it with the living docs' claims:

| File | Line | Documented | Required |
| --- | --- | --- | --- |
| `README.md` | 49 | `**2,881 tests across 133 files**` | `2,902 tests across 133 files` |
| `docs/TDD.md` | 1069 | `(133 files / 2,881 tests, measured 2026-11-07)` | `2,902 tests` |
| `docs/TDD.md` | 1083 | `133 test files, 2,881 tests (verified 2026-11-07)` | `2,902 tests` |
| `docs/TDD.md` | 1089 | `across 133 files and 2,881 tests` (and the coverage figures beside it: statements 97.19 (5921/6092), branches 91.12 (1623/1781), functions 96.16 (1305/1357), lines 98.19 (5507/5608)) | `2,902 tests`; current coverage figures are statements 97.18 (5940/6112), branches 91.15 (1629/1787), functions 96.17 (1308/1360), lines 98.18 (5526/5628) |
| `docs/perf-baseline.md` | 421 | `133 files / 2,881 tests` | `133 files / 2,902 tests` |

The validator's own instruction is "refresh the document to the current suite
truth; do not change the code". These are product docs, which this phase is
forbidden to edit, so the refresh is the primary's (doc-sync) step. The 21 added
tests are the entire cause: 2,881 before the phase, 2,902 after.

## Notes

- The memo subtlety the brief called out is implemented and pinned: `saveV2`
  keys `v2Cache` with the raw the store still holds (`readV2Raw()`) beside the
  new state, so after a refused write the next read hits the cache instead of
  re-reading stale bytes. `when a write cannot be persisted > earnSticker…`
  asserts both halves at once — the sticker reads back `true` while
  `localStorage.getItem(V2_KEY)` is still the pre-failure payload.
- Blocked storage is treated as a store with nothing in it: a throwing `getItem`
  returns `null`, `classifyStoredV2(null)` is `"missing"`, and that falls through
  the unknown-version branch to defaults (pinned by
  `keeps the session usable when reads and writes are both blocked`).
- A missing `localStorage` global is treated as a failed access: no
  `ReferenceError`, defaults served, mutations kept in memory, flag raised
  (`serves defaults and keeps playing when the global is absent`).
- Happy-path cost is unchanged in the terms NFR-1 cares about: no added
  `getItem` per read and no added `setItem` per write; a read still performs
  exactly one `getItem`, and a successful write one `setItem`.
- Evidence file left uncommitted for the primary to fold into the track commit.

## Primary verification

Verified 2026-11-07 by the primary agent, independently of the executor's report.
Phase base `57f045ce6d889f3cfe5647cd229cc00fc81210e2`, head `e7f64b0e`.

| Check | Result |
| --- | --- |
| Working tree | clean except this evidence file |
| Commits in range | 3, no merges, no amend |
| Scope diff | `src/utils/storage.ts`, 2 test files, 1 new test helper - all inside Touches or the brief's helper allowance |
| `pnpm check` | exit 0, 292 files, no fixes |
| `pnpm typecheck` | exit 0, both programs |
| `pnpm test -- --run` | exit 0, 133 files / 2,902 tests, 59.86 s |
| `pnpm test:coverage` | exit 0, statements 97.18 (5940/6112), branches 91.15 (1629/1787), functions 96.17 (1308/1360), lines 98.18 (5526/5628) |
| `pnpm build` | exit 0, 59 precache entries |
| `validate-bundle` | exit 0, phaser 1335.0 kB, shell `index-5rIbRh0E.js` 152.8 kB <= 200 kB |
| `validate-pwa` | exit 0, 16 passed |
| `validate-docs` | exit 0, 5 passed (after the refresh below) |

The executor's single blocker was the living-doc count refresh, which its role
forbids and which the validator describes as mechanical ("refresh the document to
the current suite truth; do not change the code"). The primary applied it -
`README.md:49`, `docs/TDD.md:1069/1083/1089` and `docs/perf-baseline.md:421-422`
now carry 2,902 tests and the measured coverage - so the gate closes without a
code change and AC-8 keeps its red-run record intact.

I also read the two guards rather than trusting the summary. `getStorage()` is
the only route to the store, `readStorage()` converts any refusal to `null` and
records the failure, `saveV2` returns after an accepted write and otherwise keys
the memo with `readV2Raw()` beside the new state. `mutate`'s unknown-version
branch never reaches `saveV2`, so the write-protection path cannot raise the
flag, and a declined mutator returns before it. AC-4 is satisfied by
construction, not only by the tests.


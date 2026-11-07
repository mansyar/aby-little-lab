# Review Fixes — Phase R1

- Track: 20261107-storage-resilience — Storage Resilience
- Phase: R1 — Review Fixes
- Date: 2026-11-07
- Branch: `fix/20261107-storage-resilience`
- Phase base: `69e3b57a823014dd88146f33ccfc07073b858175`
- Head: `ee1e579f` (this evidence file is committed after that head)

## Findings

| ID | Severity | What was wrong | What changed | Test that now proves it |
| --- | --- | --- | --- | --- |
| F1 | High | A refused read and an absent payload were the same `null`, so `ensureV2` treated an unreadable store as a fresh install and wrote defaults over a real save. The accepted write cleared the flag, so the parent never saw the notice either. | `readStorage` now returns `{ raw, failed }`; `ensureV2` serves the memo (or the defaults `migrateV1(null)` builds, keyed so the next accessor hits it) and writes nothing while reads are blocked; `saveV2` skips `setItem` while blocked and keeps the memo pointing at the session state; `mutate` only takes the write-protected branch on a read that succeeded. | `src/__tests__/utils/storage.test.ts` — `leaves the save it cannot read byte-identical, and keeps the session in memory` (quoted below), plus `resumes writing when a later read returns the raw this session last saw` and `stays memory-only when the store changed while it could not be read`. |
| F2 | Medium | `gameSceneBase.test.ts` repaired the storage methods in `afterEach` but performed no accepted write, leaving the module flag raised for every later case in the file. | That `afterEach` now calls `updateSettings({})` after `repairStorage()` and `localStorage.clear()`, which persists a clean state and clears the flag. | Whole-file `src/__tests__/scenes/gameSceneBase.test.ts` run, and the project-wide suite (no case inherits a degraded session). |
| F3 | Medium | `getStorage`'s catch — a `localStorage` global that throws on access — was uncovered, so the engine-level failure was never exercised. | No production change needed; a test now defines a throwing getter for `globalThis.localStorage`, loads a fresh module, and asserts every getter serves defaults without throwing while the flag is raised. The getter is restored in a `finally` and in `afterEach`. | `src/__tests__/utils/storage.test.ts` — `serves defaults from every getter, never throws, and raises the flag`. |

R1.T2.2 is proved by `src/__tests__/components/SettingsPanel.test.ts` →
`reaches the notice in a session whose reads are blocked`: a panel built while
`getItem` throws reports `e2eDegraded() === true` and renders the notice,
because `getSettings()` no longer writes defaults over the save it cannot see.

## The destructive-mode test, in full

```ts
it("leaves the save it cannot read byte-identical, and keeps the session in memory", () => {
  // A real save this device will refuse to read back: one profile, one
  // sticker earned, written by a store that accepts writes.
  earnSticker("shape-sorter");
  const seeded = localStorage.getItem(V2_KEY);
  expect(seeded).not.toBeNull();
  // The thrower replaces the instance method, so hold a reference to the
  // real one to inspect the bytes afterwards without healing the test.
  const readStoredRaw = localStorage.getItem.bind(localStorage);

  breakStorage(["getItem"], "SecurityError");

  // The two getters that used to fold "cannot read" into "nothing stored"
  // and write defaults straight over the save above.
  expect(() => getProfiles()).not.toThrow();
  expect(getSettings().bgmEnabled).toBe(true);

  expect(readStoredRaw(V2_KEY)).toBe(seeded);
  expect(isPersistenceDegraded()).toBe(true);

  // A sticker earned after the failure is served from memory, and still does
  // not reach the store this build cannot see.
  earnSticker("animal-trace");
  expect(hasSticker("animal-trace")).toBe(true);
  expect(readStoredRaw(V2_KEY)).toBe(seeded);
});
```

Before the fix the first two getters reached `migrateV1(null)` and called
`saveV2(defaults)`; `setItem` was never broken, so the seeded bytes were
replaced and `isPersistenceDegraded()` ended `false`. The byte-identity
assertion is the one that fails in that world.

## The design, as implemented

- `readStorage(key)` returns `{ raw, failed }`. Failure is a fact of its own,
  never a value.
- `readsBlocked` is raised by any failed read (including a `localStorage`
  global that throws) and cleared only by evidence: a later read that returns
  the raw this session last knew, or an empty store. An empty store has nothing
  to destroy, so it is safe to heal on it; a different raw means something else
  wrote while this session could not look, and memory stays authoritative with
  the flag still raised.
- `lastKnownRaw` is the last raw the session read or last wrote. It is what the
  healing comparison and the blocked memo are keyed on.
- While blocked, `ensureV2` never writes and `saveV2` never calls `setItem`;
  both leave the memo holding the session's newest state, so a mutation made
  after the failure is still served by the next getter.
- The unknown-`schemaVersion` branch is untouched: it is reached only through a
  successful read, its raw bytes stay byte-identical, and the flag stays false.
- No change to `SCHEMA_VERSION`, key names, stored shapes or the exported API.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Format/lint | `pnpm check` | 0 | 293 files checked, no fixes applied |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` for src and e2e |
| Unit + integration | `pnpm test -- --run` | 0 | 133 files / 2911 tests passed (2906 before, +5 new) |
| Coverage | `pnpm test:coverage` | 0 | lines 98.21, statements 97.19, functions 96.18, branches 91.08 (thresholds 95/90/88/85) |
| Build | `pnpm build` | 0 | 363 modules, PWA precache 59 entries |
| Bundle gate | `node scripts/validate-bundle.js` | 0 | shell entry 153.5 kB (<= 200 kB), Phaser vendor chunk present |
| PWA gate | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| Docs gate | `node scripts/validate-docs.js` | 1 | Only the suite-count check: docs record 2,906 tests, the suite now has 2,911 (see deviations) |
| Browser journeys | `pnpm test:e2e -- storage.spec.ts` | — | Not run: the command was refused by this subagent's permissions (see blockers) |

`storage.ts` coverage is 99.2% lines / 92.63% branches. The one uncovered line
(203, the `JSON.parse` catch in `parseV2`) is the same unreachable defensive
catch the phase-1 `readV2` carried: `classifyStoredV2` already routes
unparseable payloads to `"unusable"` before the parse.

## Deviations

| File | Reason |
| --- | --- |
| `src/__tests__/components/SettingsPanel.test.ts` | R1.T2.2 asks for a `SettingsPanel` built while reads are blocked; the only place that panel harness exists is this file, which the plan's R1 `Touches` list omits. One test added, no existing case changed. |
| `e2e/journeys/storage.spec.ts` | Read but not changed: its two refusal journeys (`setItem` only; `getItem` and `setItem`) remain correct under the new semantics — the blocked-read journey now boots from memory without writing, which is what it already asserts. |

## Notes

- The docs gate fails only because the suite grew by five tests. Per the brief,
  the counts were reported rather than edited: `README.md:49`, `docs/TDD.md`
  lines 1084, 1098 and 1104, and `docs/perf-baseline.md:421` all say 2,906 and
  must become 2,911 (133 files unchanged).
- Suite-count freshness is the only red gate; everything else was green on the
  committed tree (`ee1e579f`).
- The browser refusal journeys were not run here because `pnpm test:e2e` is not
  permitted for this subagent. Their expectations are read-compatible with the
  new behaviour, but the primary should run them before the PR.

## Primary verification

Verified 2026-11-07 by the primary agent. Phase base `69e3b57a`, head `8dae4694`.

### The fix was read, not trusted

`readStorage` now returns `{ raw, failed }`, and `readV1`, `readV2Raw`, `ensureV2`
and `mutate` consult `failed` instead of conflating it with `null`. While
`readsBlocked` is true, `ensureV2` returns the cache or builds the same defaults
`migrateV1(null)` would and **never** reaches `saveV2`; `saveV2` skips `setItem`
entirely and re-keys the memo with `lastKnownRaw`. Healing is gated on evidence in
`readV2Raw`: a successful read unblocks only when it returns the raw this session
last knew, or an empty store, which has nothing to destroy. The unknown-
`schemaVersion` branch still checks `!stored.failed` first, so a refusal cannot be
mistaken for a protected future payload.

### The test teeth, proved against the pre-fix file

`git checkout 56f6fbd5 -- src/utils/storage.ts`, then
`pnpm test src/__tests__/utils/storage.test.ts -- --run -t "leaves the save it cannot read"`:
**3 failed**. The destructive-mode assertion failed with the seeded payload
replaced by a fresh default save — exactly the reviewer's finding, reproduced.
`git checkout HEAD -- src/utils/storage.ts` restored the file, and the tree showed
no modification to it afterwards.

### Gate

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Static | `pnpm check` | 0 | 293 files, no fixes |
| Types | `pnpm typecheck` | 0 | both programs |
| Unit | `CI=true pnpm test -- --run` | 0 | 133 files / 2,911 tests, 34.35 s |
| Coverage | `pnpm test:coverage` | 0 | 97.19 / 91.08 / 96.18 / 98.21 |
| Build | `pnpm build` | 0 | 363 modules, 59 precache entries |
| Bundle | `node scripts/validate-bundle.js` | 0 | phaser 1335.0 kB, shell 153.5 kB <= 200 kB |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 47 chunks |
| Docs | `node scripts/validate-docs.js` | 0 | 5 passed, after the count refresh |
| Browser | `pnpm test:e2e` | 0 | 16 journeys in 3.6 m |
| Boot | `node scripts/validate-boot.js` | 0 | median 0.98 s over 3 cold loads |

The two hand-offs the executor reported were the primary's and are closed: the
four suite-count claims now read 2,911 with the current coverage tuple, and the
browser suite ran green, including both storage journeys.

### Findings closed

| Finding | Resolution |
| --- | --- |
| F1 (High) | read failure is a distinct signal; a blocked session never writes; memory is authoritative; healing only on evidence; the destructive-mode test was proved red against the Phase 1 file |
| F2 (Low) | `gameSceneBase.test.ts` performs an accepted write after `repairStorage()` |
| F3 (Low) | a `localStorage` global that throws on access is covered; every getter serves defaults and raises the flag |
| F4 (Low) | AC-8 reworded to 14 of 21 with the reason, transcript checked in at `verification/red-run.md`, amendment recorded in the spec |
| F5 (Low) | boot smoke run and recorded here and in `integrated.md` |


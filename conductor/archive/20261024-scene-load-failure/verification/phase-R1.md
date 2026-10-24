# Phase R1 — Review Fixes (round 1)

- **Track:** `20261024-scene-load-failure`
- **Branch:** `fix/20261024-scene-load-failure`
- **Base:** `ef9c16b77afb2f610b15d62cdd1fc0df52ef6bec`
- **Contract:** F1–F12 from `review.md` (round 1). F1 and F2 must be fixed; Low findings
  may be argued. One new file (this one); no new dependency, module or storage key.
- **Status:** verified, with one gate step blocked by the shell allowlist (§5).

---

## 1. Findings

| # | Sev | Finding | Fix | Evidence |
| --- | --- | --- | --- | --- |
| **F1** | High | A cue retry never re-armed `grid.navLocked`, so a second tile tapped during the retry started a parallel `openGame`; both `true` branches charged a session and a record for the one game that opened | `HubScene.openGame` refuses at the top while `this.launching` is set and clears it only on the two branches that end a failed launch; `showLoadCue`'s `onRetry` sets `this.grid.navLocked = true` before it destroys the cue, so the retry takes the same tap lock a tile tap does | §3 F1 (red-then-green), `hubSceneLoad.test.ts` — "refuses a second launch while the cue's retry is in flight" |
| **F2** | High | `README.md` Known Issues still listed the retired chunk-load bug and a false play-time bullet, and claimed "seven of them" against the roadmap's five | Both bullets deleted, count corrected to five; the drag and schema-version bullets stay | `README.md:244-252`; 5 `###` entries in `docs/roadmap.md` |
| **F3** | Medium | Cue objects live on the scene rather than `grid.pageObjects`, so a page flip, a viewport rebuild or `resetForVisit` could leave it over another game's slot (paged slot centres repeat) | Optional `HubGridDeps.onBoardChange`, invoked from `flipTo` (once, before either motion path) and from `handleViewportChange` after its early return; `HubScene` passes `() => this.hideLoadCue()` | §3 F3, `hubSceneLoad.test.ts` — "hides the cue when a page flip rebuilds the board under it" |
| **F4** | Medium | Parent-surface exits (`ProfileChip` open, Settings unlock) were line-covered only | Two tests drive the real chip and the real `ParentLock` through their own handler mocks and assert the cue is gone and its objects destroyed | `hubSceneLoad.test.ts` — "clears the cue when the profile picker opens", "clears the cue when the Settings hold unlocks the panel" |
| **F5** | Medium | The retry-succeeds case never asserted "no cue ever appears" | The case now asserts no 96×96 rectangle before the tap and no cue object or rectangle after the settle | §3 F5, "opens the game once when the retry succeeds, without ever raising a cue" |
| **F6** | Low | `isShuttingDown` was a per-visit boolean, so a load settling after the same instance was re-created could act on the new visit | Field replaced by `visitToken`, bumped by `create()` and by the `shutdown` handler; `openGame` captures it before the await and bails on mismatch. The boolean is gone from source and docs | §3 F6, "discards a load that settles after the Hub was recreated for a new visit" |
| **F7** | Low | `GameLoadCue` took the scene twice — factory binding the tween and `shutdown` hook, `show()` drawing into `deps.scene` | `scene` removed from `GameLoadCueDeps`; `show()` draws into the scene the factory took. The cue tests' `show({...})` calls updated | `GameLoadCue.ts`, `GameLoadCue.test.ts` (typecheck pins the dep set) |
| **F8** | Low | Redundant width assertion whose comment over-claimed what it proved | Assertion and comment deleted; the attempt-count and `navLocked` assertions around it already prove the second tap was heard | `hubSceneLoad.test.ts` |
| **F9** | Low | `src/main.ts` still named `ensureSceneLoaded` | Comment now names `loadSceneWithRetry`, retries once, reports failure rather than throwing | `src/main.ts:30-32` |
| **F10** | Low | TDD §4.6 said "every other side effect of a launch lives in `openGame`" (the grid's tap lock is one) and that the cue is "over the tapped tile" (only true of the first failing tap) | Both sentences corrected: the lock is named as the grid's own, and a second failing tile keeps the cue where it already sits | `docs/TDD.md:547,549` |
| **F11** | Low | `verification/phase-3.md` mapped AC-6 to roadmap retirement, while the spec defines AC-6 as one cue at a time plus shutdown inertness — already evidenced earlier in that file | AC-6 row rewritten to the spec's criterion, pointing at the AC-6 block at line 149; the roadmap retirement is named as AC-5's documentation half | `verification/phase-3.md:263-267` (only that row touched) |
| **F12** | Medium | PRD §7.2 and TDD §3.6 carried stale shell/precache figures | Re-measured from this phase's build: shell entry 137.8 kB (`validate-bundle.js`) / 141.15 kB (Vite), Phaser 1342.6 kB, 54 precache entries (1725.53 KiB). `README.md:158` carried the same stale 134.6 kB figure and was corrected in the same pass | `docs/PRD.md:559`, `docs/TDD.md:415,423,426`, `README.md:158` |

### Not a listed finding, corrected anyway

- `docs/TDD.md:551` described the shutdown guard as "sets `isShuttingDown`". That
  sentence became false the moment F6 was fixed, so it now describes the visit token
  and the in-flight `launching` flag instead.
- `docs/TDD.md:551` also gained "when a page flip or a viewport change rebuilds the
  tiles it was anchored to", because that is now part of the cue's lifetime (F3).

---

## 2. Source changes

| File | Change |
| --- | --- |
| `src/scenes/HubScene.ts` | `isShuttingDown` → `visitToken` (per-visit counter) and new `launching`; `create()` bumps the token and clears `launching`; the `shutdown` handler bumps the token as its first statement; `openGame` refuses while launching, captures the token before the await, bails on mismatch, and is the only place that ends a launch (`launching = false` on the time-up and `!loaded` branches, left set once it navigates away); `onRetry` re-arms `grid.navLocked`; `HubGrid` deps gain `onBoardChange: () => this.hideLoadCue()`; `showLoadCue` no longer passes `scene` |
| `src/components/GameLoadCue.ts` | `GameLoadCueDeps.scene` removed; `show()` draws into the factory's scene |
| `src/game/hubGrid.ts` | Optional `HubGridDeps.onBoardChange`, called from `handleViewportChange()` after the no-op return and before the rebuild |
| `src/game/hub/gridBuilder.ts` | `flipTo` calls `onBoardChange` once, after the page/dot bookkeeping and before the reduced-motion branch, so both motion paths notify exactly once |
| `src/main.ts` | Comment names `loadSceneWithRetry` |

No new module, dependency, storage key or public API shape outside the optional dep.

---

## 3. Red then green

Each fix was reverted in isolation, the suite run, and the fix restored. Commands are
the configured ones; the file filter is the only difference.

### F1 — parallel launch during a retry

Regression: `openGame`'s `launching` guard and the `onRetry` lock re-arm removed.

```
$ pnpm test -- --run src/__tests__/scenes/hubSceneLoad.test.ts
 × refuses a second launch while the cue's retry is in flight
AssertionError: expected false to be true
 ❯ src/__tests__/scenes/hubSceneLoad.test.ts:398:28
    397|     // The retry is a tap, so it takes the grid's tap lock back.
    398|     expect(grid.navLocked).toBe(true);
Tests  1 failed | 14 passed (15)                                  exit 1
```

Green: `Tests 15 passed (15)`, exit 0.

The lock assertion is the first thing the removed code breaks, and the attempt-count,
session, record and `scene.start` assertions behind it pin the rest of the contract
(one chain, one charge, one game). `launching` is the second line of defence: it is
what refuses an `openGame` that arrives without the grid's lock, so a future caller
cannot reopen the hole; the test drives the path a child can actually produce.

### F3 — cue outliving its tile

Regression: `grid.deps.onBoardChange?.()` removed from `flipTo`.

```
$ pnpm test -- --run src/__tests__/scenes/hubSceneLoad.test.ts
 × hides the cue when a page flip rebuilds the board under it
AssertionError: expected true to be false
 ❯ src/__tests__/scenes/hubSceneLoad.test.ts:478:29
    478|     expect(cue?.isActive()).toBe(false);
Tests  1 failed | 14 passed (15)                                  exit 1
```

Green: `Tests 15 passed (15)`, exit 0.

### F5 — a cue that appears on a load that never failed

Regression: `this.showLoadCue(tileIndex, tile)` inserted at the top of `openGame`
(the "cue on every tap, hidden after a successful retry" shape).

```
$ pnpm test -- --run src/__tests__/scenes/hubSceneLoad.test.ts
 × opens the game once when the retry succeeds, without ever raising a cue
 × retries from the cue, destroys it, then opens the game
 × discards a failed load that settles after the Hub shut down
Tests  3 failed | 12 passed (15)                                  exit 1
```

Green: `Tests 15 passed (15)`, exit 0. The case fails because `cueRectOf` still finds
the destroyed 96×96 floor — the cue was built and thrown away, which is exactly the
"appeared and vanished" behaviour AC-1 rules out.

### F6 — a load acting on the next visit

Regression: `create()` reset the counter (`this.visitToken = 0`) instead of bumping it —
the shape of the boolean it replaced.

```
$ pnpm test -- --run src/__tests__/scenes/hubSceneLoad.test.ts
 × discards a load that settles after the Hub was recreated for a new visit
AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
Received: Array [ "p1" ]
 ❯ src/__tests__/scenes/hubSceneLoad.test.ts:575:34
    575|     expect(startPlaySession).not.toHaveBeenCalled();
Tests  1 failed | 14 passed (15)                                  exit 1
```

Green: `Tests 15 passed (15)`, exit 0.

F4 is a coverage-only finding: no source change was possible to revert, so the two
tests are their own evidence (both fail against the pre-fix source, where neither
parent surface called `hideLoadCue`).

---

## 4. Tests

`src/__tests__/scenes/hubSceneLoad.test.ts` — 10 tests before, 15 after:

| Test | Covers |
| --- | --- |
| charges nothing and releases the grid when the load fails twice | FR-2, FR-4 (unchanged) |
| opens the game once when the retry succeeds, without ever raising a cue | AC-1, F5 (renamed, assertions added) |
| keeps the play-time nudge on the success path without loading twice | FR-5 (unchanged) |
| puts one cue over the tapped tile and leaves the rest of the Hub tappable | AC-2 (F8 assertion removed) |
| retries from the cue, destroys it, then opens the game | AC-3 (unchanged) |
| **refuses a second launch while the cue's retry is in flight** | F1, FR-4, AC-1 |
| warns once per failed attempt, naming the key, and persists nothing | AC-5 (unchanged) |
| keeps one cue across repeated failing taps | AC-6 (unchanged) |
| **hides the cue when a page flip rebuilds the board under it** | F3 |
| **clears the cue when the profile picker opens** | F4, FR-6 |
| **clears the cue when the Settings hold unlocks the panel** | F4, FR-6 |
| does not open a game whose chunk lands after the Hub shut down | NFR-6 (unchanged) |
| discards a failed load that settles after the Hub shut down | NFR-6 (unchanged) |
| **discards a load that settles after the Hub was recreated for a new visit** | F6, NFR-6 |
| refuses a cue retry once the daily cap has been reached | FR-4 (unchanged) |

New helpers in that file: `holdNextLoad()` (a loader that hangs until released, so a
launch can be observed in flight), `chipOf()` (the avatar chip at 68, 68),
`settingsButtonOf()` (the Settings label) and `fireTimer()` (fires a `delayedCall`
callback by its delay). No new mocks: the chip, the `ParentLock` hold and the grid are
the real components, driven through the handler mocks the harness already records.

`src/__tests__/components/GameLoadCue.test.ts` — `show({...})` calls no longer pass a
scene (F7); every other assertion is untouched.

`src/__tests__/game/hubGrid.test.ts` — unchanged: `onBoardChange` is optional, so the
existing deps objects stay valid, and the Hub-level test covers the invocation.

---

## 5. Verification

Run on `2026-10-24` against commit `63f05711` (`32036467` is the source commit; the
docs commit does not touch source).

| # | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files; the two pre-existing findings only (biome schema 2.5.5 vs CLI 2.5.10 info; `noNonNullAssertion` warning in `musicalMemoryScene.test.ts`, untouched) |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| 3 | `pnpm test -- --run` | 0 | 121 files, 2609 tests (was 2604: five added, one renamed) |
| 4 | `pnpm test:coverage` | 0 | statements 97.98 / branches 91.97 / functions 96.66 / lines 98.74 against 90 / 85 / 88 / 95 |
| 5 | `pnpm build` | 0 | 343 modules; shell `index-DDxInOce.js` 141.15 kB (gzip 32.56 kB); Phaser `phaser-P1E8uaLi.js` 1,374.82 kB; `precache 54 entries (1725.53 KiB)`; 42 JS chunks |
| 6 | `node scripts/validate-bundle.js` | 0 | `shell entry index-DDxInOce.js = 137.8 kB (<= 200 kB)`; Phaser vendor chunk 1342.6 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (42 chunks, 42 precached) |
| 8 | `node scripts/validate-docs.js` | — | **not run:** permission denied (§6) |

The shell entry grew 0.2 kB in the validator's measure (137.6 → 137.8) and 3.35 kB in
Vite's (137.79 → 141.15); the 200 kB gate has 62 kB of headroom.

---

## 6. Blockers

- `node scripts/validate-docs.js` — `Permission denied: shell`. The phase executor's
  shell allowlist does not carry it, and it was not retried or worked around. The docs
  half of this phase is unvalidated by that script; the primary agent (or the review
  phase) needs to run it. Every other gate in §5 ran.

---

## 7. Deviations and judgement calls

- **`README.md:158`** also carried the stale 134.6 kB shell figure. It is outside
  F12's named rows, but the new code grows the shell, so leaving it would have made
  the README contradict the TDD in the same commit. It now reads 137.8 kB
  (32.56 kB gzip), re-measured today.
- **`release-checklist.md`, `perf-baseline.md`** still carry 134.6 kB. They are dated
  records of the 2026-10-22 and earlier releases, and `perf-baseline.md` says
  explicitly that its earlier sections keep the numbers they recorded. Not touched.
- **No TDD section or roadmap entry was added.** `onBoardChange` is documented inside
  TDD §4.6's cue-lifetime sentence rather than a new subsection, matching the track's
  earlier judgement call about `GameLoadCue`.
- **The `launching` flag is not separately revertible** in a red run: with the grid's
  lock in place, no child-reachable path reaches `openGame` twice, so the test pins
  the lock and the flag together (§3 F1).
- **Debt noted by review, not fixed in round 1** (Low, test ergonomics): `settleLoad()`
  still no-oped when the mock was never called, was duplicated across suites, and the
  delegating `loadSceneWithRetry` double was copy-pasted across four scene suites. Both
  live in the harness, which this phase's round-1 `Touches` does not include;
  `holdNextLoad()` was added locally rather than moving either into the harness. Both
  items are closed in Rework 2 (§8).

---

## 8. Rework 2 — the two test-harness debt items

Review round 1 recorded two Low test-ergonomics debts instead of fixing them, because
round 1's `Touches` did not include the harness. Both are fixed in-track here; no
production file was touched.

### 8.1 `settleLoad()` can no longer pass silently

It read the last mock result and only awaited it when one existed
(`if (pending) await pending`), so a case that called it before anything was launched
asserted nothing at all. `src/__tests__/helpers/sceneFlowHarness.ts` now holds the one
copy, and it asserts the promise exists before awaiting it:

```ts
export async function settleLoad(loadSceneWithRetry: unknown): Promise<void> {
  const pending = (loadSceneWithRetry as MockFn).mock?.results.at(-1)?.value as
    | Promise<boolean>
    | undefined;
  expect(
    pending,
    "settleLoad() found no load to settle: the Hub never called loadSceneWithRetry, so the assertions after this point were never exercised",
  ).toBeDefined();
  await pending;
}
```

The mock is a parameter rather than an import: the harness is itself loaded from inside
the suites' `vi.mock("../../scenes/sceneRegistry")` factories, so importing that module
here would be a mock/import cycle. Both suites therefore call `settleLoad(loadSceneWithRetry)`,
including the two `await expect(settleLoad(...)).resolves.toBeUndefined()` sites.

Red-then-green (the guard is the fix, so the red run reverts it to the old body):

```
$ pnpm test -- --run src/__tests__/scenes/hubSceneLoad.test.ts -t "fails loudly"
 × fails loudly when asked to settle a load the Hub never started
AssertionError: promise resolved "undefined" instead of rejecting
 ❯ src/__tests__/scenes/hubSceneLoad.test.ts:610:49
Tests  1 failed | 15 skipped (16)                                  exit 1
```

Green: `Tests 16 passed (16)`, exit 0. The new case ("fails loudly when asked to settle
a load the Hub never started", `hubSceneLoad.test.ts`) is the pin: it fails against the
old silent helper and passes against the guard. `hubScene.test.ts` gets the same
behaviour for free — it now imports the shared helper.

### 8.2 One `loadSceneWithRetry` double, four callers

`hubPlayTime`, `hubEngagement`, `navigation` and `feelingsFacesFlow` each carried the
same six-line delegating double inside their `vi.mock` factory. Hoisting does not block
this: every one of those factories already loads the harness with a dynamic
`await import(...)`, so an exported factory call is the same kind of reference.
`sceneFlowHarness.ts` now exports:

```ts
export function createLoadSceneWithRetryDouble() {
  return vi.fn(async (scene: unknown, key: string) => {
    await mockEnsureSceneLoaded(scene, key);
    return true;
  });
}
```

and each of the four suites is now:

```ts
vi.mock("../../scenes/sceneRegistry", async () => {
  const { createLoadSceneWithRetryDouble, mockEnsureSceneLoaded } = await import(
    "../helpers/sceneFlowHarness"
  );
  return {
    ensureSceneLoaded: mockEnsureSceneLoaded,
    // The Hub loads through the retrying wrapper; this double always succeeds so
    // these cases keep observing the post-load behaviour they have asserted.
    loadSceneWithRetry: createLoadSceneWithRetryDouble(),
  };
});
```

Semantics are unchanged: still a fresh `vi.fn` per suite (so `vi.clearAllMocks()` and any
per-case `mockImplementation` behave as before), still delegating to
`mockEnsureSceneLoaded`, still always `true`. The six suites that consume one of the two
doubles were run together before the full suite: **6 files, 174 tests, exit 0**.

`hubScene.test.ts` keeps its own non-delegating `vi.fn(() => Promise.resolve(true))` — it
never drives `mockEnsureSceneLoaded`, so it is a different double, not a copy.

### 8.3 Re-run after the rework

Run on `2026-10-24` against the working tree with no production change.

| # | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files; the same two pre-existing findings (biome schema 2.5.5 vs CLI 2.5.10 info; `noNonNullAssertion` warning in `musicalMemoryScene.test.ts`) |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| 3 | `pnpm test -- --run` | 0 | 121 files, **2610 tests** (2609 + the new guard case) |
| 4 | `pnpm test:coverage` | 0 | statements 97.98 / branches 91.97 / functions 96.66 / lines 98.74 — unchanged against 90 / 85 / 88 / 95 |
| 5 | `pnpm build` | 0 | 343 modules; shell `index-DDxInOce.js` 141.15 kB (gzip 32.56 kB); Phaser `phaser-P1E8uaLi.js` 1,374.82 kB; `precache 54 entries (1725.53 KiB)`; 42 JS chunks — identical to §5 |
| 6 | `node scripts/validate-bundle.js` | 0 | `shell entry index-DDxInOce.js = 137.8 kB (<= 200 kB)`; Phaser 1342.6 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (42 chunks, 42 precached) |
| 8 | `node scripts/validate-docs.js` | — | **not run:** permission denied, the same allowlist hole as §6 |

Files changed: `src/__tests__/helpers/sceneFlowHarness.ts` (+2 helpers, 1 of them moved),
the six scene suites named above, and this record. Deviations: `settleLoad` takes the
mock as a parameter instead of importing it (§8.1) — the cycle the harness's own
`vi.mock` participation would create. Nothing else deviated.


## Primary verification

Base `ef9c16b77afb2f610b15d62cdd1fc0df52ef6bec`. Commits in range:
`32036467 fix(hub): make a game launch exclusive and keep the retry cue with its tile`,
`63f05711 docs: correct the known-issues list, cue lifetime and measured figures`,
`f820c426 docs(conductor): record phase R1 review-fix evidence`,
`77edada4 test(hub): guard settleLoad and share the retry double`.

### Gate at this HEAD

| Layer | Result |
| --- | --- |
| `pnpm check` | exit 0 (252 files; only the two pre-existing findings) |
| `pnpm typecheck` | exit 0 |
| `pnpm test -- --run` | exit 0, 121 files / 2610 tests (+6 over the end of Phase 3) |
| `pnpm test:coverage` | exit 0, statements 97.98, branches 91.97, functions 96.66, lines 98.74 |
| `pnpm build` | exit 0 |
| `node scripts/validate-bundle.js` | exit 0, phaser 1342.6 kB, shell `index-DDxInOce.js` 137.8 kB |
| `node scripts/validate-pwa.js` | exit 0, 16 passed / 0 failed |
| `node scripts/validate-docs.js` | exit 0, 5 passed / 0 failed (the layer the subagent was denied) |

Diff scope: exactly the Touches files plus the two evidence files, and the
`docs/PRD.md` / `docs/TDD.md` / `README.md` corrections the findings named.

### Independent reading of the fixes

- **F1.** `openGame` refuses at the top while `launching` is set, `launching` is
  released on every path that does not open a game (the cap branch and the failure
  branch) and stays set when the Hub navigates away; the cue's `onRetry` re-arms
  `grid.navLocked` before re-entering. The new case taps a second tile while the
  retry is pending and counts one session, one record and one transition.
- **F2.** The README's chunk-load bullet and its play-time bullet are gone, and the
  count sentence now says five, matching the roadmap's five remaining entries.
- **F3.** `HubGridDeps.onBoardChange` is optional, documented, and fired once per
  page flip (before either motion path) and once per viewport rebuild; `HubScene`
  wires it to `hideLoadCue`. The Hub-level case drives a flip and asserts the cue
  is gone.
- **F4.** Two cases use the real `ProfileChip` and the real `ParentLock` through the
  handler mocks those suites already install.
- **F5.** The retry-succeeds case now proves no 96x96 floor existed before the
  failure, and a companion case proves the guard fails loudly when nothing was
  loaded.
- **F6.** `isShuttingDown` is gone; `visitToken` is bumped by `create()` and by the
  shutdown handler, captured before the await and compared after. The new case
  re-creates the scene before settling a stale load.
- **F7-F11.** `GameLoadCue.show` no longer takes a scene, the redundant assertion is
  gone, `src/main.ts` names `loadSceneWithRetry`, the two TDD over-claims are
  corrected, and `phase-3.md` maps AC-6 to the one-cue and shutdown criteria.
- **F12.** Measured figures re-taken from this phase's build: shell 137.8 kB
  (validator) / 141.15 kB (Vite) in the PRD and TDD tables, precache about 1,726 KiB,
  and the README's own dated shell figure updated to match.

### Accepted deviations

1. `README.md` line 158 carried the same stale 134.6 kB figure F12 named elsewhere.
   It is a real contradiction once the shell grows, so correcting it is in the
   spirit of F12 rather than scope creep.
2. The TDD cue-lifetime paragraph also had to change for F6 and F3: it named the
   deleted `isShuttingDown` field and did not mention the board rebuild. Leaving
   either sentence would have shipped a document that contradicts the code.
3. `settleLoad` takes the mocked loader as a parameter instead of importing it,
   because the harness is loaded from inside the suites' `vi.mock` factory for that
   module. Behaviour is the guarded version the rework asked for, and the new
   "fails loudly when asked to settle a load the Hub never started" case pins it.

### Debt closed

The round-1 debt (a `settleLoad()` that could silently no-op, and the same
`loadSceneWithRetry` double pasted into four suites) is fixed in `77edada4`: one
guarded helper and one exported double factory in `sceneFlowHarness.ts`, used by all
six suites. Nothing was deferred out of the track.

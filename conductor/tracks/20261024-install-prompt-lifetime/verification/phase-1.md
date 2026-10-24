# Phase 1 verification - The prompt outlives the panel

Track: `20261024-install-prompt-lifetime`
Branch: `fix/20261024-install-prompt-lifetime`
Commits: `52cdddc3 fix(pwa): capture the install prompt for the page's life`
Covers: FR-1, FR-2, AC-1, AC-2

## 1. What changed

### `src/utils/pwaInstall.ts`

| Lines | Change |
| --- | --- |
| 11-16 | Module doc gained a `Lifetime` paragraph: install events are page facts, not panel facts; capture starts at boot and the panel borrows the tracker. |
| 118-131 | `canObserveInstallEvents()` - private capability guard. True only when `window`, `navigator` and both `window` listener methods exist. Mirrors `canObserveVisibility()` / `canObservePageExit()` in `src/game/playTimeLogic.ts:134-176`, whose doc already names "a test double stubbing a partial `window`" as the case it protects. |
| 133-158 | `createBrowserInstallTracker()` - thin adapter over the real globals, delegating to the untouched `createInstallTracker()`. `userAgent: navigator.userAgent`; the isolation predicate is moved verbatim from the old `SettingsPanel` body (`typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches`); `addEventListener` / `removeEventListener` delegate to `window`. When the guard fails it returns `createInstallTracker()` over inert deps, so such a host reports `hidden` and attaches nothing instead of throwing. |
| 160-172 | `let installPromptTracker` + `resolveInstallPromptTracker()` - the app-lifetime holder: returns the stored instance, otherwise creates and stores one. |
| 174-181 | `initInstallPrompt()` - boot seam; a second call reuses the instance, so no second listener pair. |
| 183-190 | `getInstallPromptTracker()` - lazy accessor for an entry point that never ran init. |

`createInstallTracker()`, `getInstallUiState()`, `detectIOS()` and `InstallTrackerDeps` are unchanged.

### `src/main.ts`

| Lines | Change |
| --- | --- |
| 8 | Import `initInstallPrompt` from `./utils/pwaInstall`. |
| 37-40 | `initInstallPrompt()` called before `new Phaser.Game(config)`, immediately above the existing `initPwaBridge(registerSW)` (line 44), with a comment explaining that the event fires once per page load and must be captured before any scene can open Settings. |

### `src/components/SettingsPanel.ts`

| Lines | Change |
| --- | --- |
| 4 | Imports `getInstallPromptTracker` instead of `createInstallTracker`. |
| 55-69 | Constructor doc rewritten (panel borrows an app-lifetime tracker; an injected tracker still wins) and the argument became a real default parameter: `installTracker: InstallTracker = getInstallPromptTracker()`. A default *parameter* (not `tracker?: …` plus `??`) keeps the existing `new SettingsPanel(scene, undefined, onProgressReset)` call sites working. |
| 77 | `this.installTracker = installTracker;` - the inline `createInstallTracker({...})` block is deleted. |
| 185-187 | The `this.installTracker.destroy()` call in `destroy()` is replaced by a comment recording why: the panel does not own the tracker, so closing Settings must not stop capture. Every other teardown line is untouched. |

### `src/__tests__/utils/pwaInstall.test.ts`

| Lines | Change |
| --- | --- |
| 60-88 | Fixtures: `WindowDouble`, `stubBrowser()` (stubs `window` + `navigator`, hands back the window spy), `PwaInstallModule`, `loadFreshModule()`. |
| 231-298 | `describe("createBrowserInstallTracker")` - 6 cases: subscribes both events and starts `hidden`; reads the UA for `ios-howto`; standalone display mode reads `hidden`; forwards teardown to both window listeners; stays inert with a listener-less `window`; stays inert with no `window`/`navigator` at all. |
| 300-333 | `describe("app-lifetime install tracker")` - 3 cases: same instance across calls; two `initInstallPrompt()` calls register exactly one listener pair; `getInstallPromptTracker()` creates lazily when init never ran. |

**Module-state reset:** `vi.resetModules()` + `await import("../../utils/pwaInstall")` (`loadFreshModule()`, line 85). Chosen over a test-only reset export so no production surface exists purely for tests; the cost is that the holder tests must go through the dynamically imported copy.

### `src/__tests__/components/SettingsPanel.test.ts`

| Lines | Change |
| --- | --- |
| 3-8 | Imports `createInstallTracker` and `type InstallTrackerDeps` alongside the existing types. |
| 50-86 | `createTrackerDeps()` builds the **real** tracker's wiring with addressable listeners, and `emitBeforeInstallPrompt()` fires at whatever listener is currently registered. |
| 484-491 | `afterEach(() => vi.unstubAllGlobals())` on the install-control describe (needed by the boot case). |
| 561-571 | (a) real tracker, `beforeinstallprompt` fired, then the panel constructed with that tracker → "Install App" row. |
| 573-587 | (b) open, `destroy()`, event fired *after* the close, reopen → row appears **and** `deps.removeEventListener` was never called. |
| 589-613 | (a2) the boot path with no tracker injected: stub `window`/`navigator`, reset modules, import fresh `pwaInstall` + `SettingsPanel`, `initInstallPrompt()`, fire the event, construct with no argument → row appears. |

Case (c) - the existing injected `installable` / `ios-howto` / `hidden` expectations - is unchanged (they are still at lines 490-555 and still pass).

## 2. Commands

Run from the repo root on Windows (`pwsh`), in the order the brief gives.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm check` | 0 | 252 files checked; 1 warning + 1 info, both pre-existing (`musicalMemoryScene.test.ts:294` non-null assertion, `biome.json` schema 2.5.5 vs CLI 2.5.10). One formatting error in the new test was found and fixed, then re-run clean. |
| `pnpm typecheck` | 0 | `tsc --noEmit` silent. |
| `pnpm test -- --run` | 0 | 121 files, **2623 passed**. |
| `pnpm test:coverage` | 0 | 121 files, 2623 passed. Lines 98.74 %, branches 92 %, functions 96.69 %, statements 97.99 % (thresholds 95/85/88/90). `pwaInstall.ts` is at 100 % on all four and is therefore absent from the per-file listing. |
| `pnpm build` | 0 | 343 modules; `index-CbwtS-OD.js` 141.52 kB (32.67 kB gzip); `phaser-P1E8uaLi.js` 1,374.82 kB; sw + workbox generated. |
| `node scripts/validate-bundle.js` | 0 | `Phaser vendor chunk present: phaser-P1E8uaLi.js (1342.6 kB)`; `shell entry index-CbwtS-OD.js = 138.2 kB (<= 200 kB)`. |
| `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (42 chunks, 42 precached). |
| `node scripts/validate-docs.js` | - | **Denied by the shell sandbox** (`permission.rejected`), not retried per the brief. See `## Blockers`. |

Test totals: 2623 = 2611 pre-existing + 12 added (6 + 3 in `pwaInstall.test.ts`, 3 in `SettingsPanel.test.ts`).

Two shell invocations were denied and are not retried: the ad-hoc `pnpm test -- --run src/__tests__/utils/pwaInstall.test.ts` (a file-scoped run, not a configured command - outside the allowed surface) and a chained `git grep`. Both were replaced by the configured commands and by the native search tools; neither hides work.

## 3. Red then green

Red was staged against the real pre-change behaviour of the panel rather than by asserting on `HEAD~`: `src/components/SettingsPanel.ts` was temporarily reverted in place to the old shape (inline `createInstallTracker({...})` fallback, `this.installTracker.destroy()` in `destroy()`), the suite was run, and the file was restored. The new tests and the new `pwaInstall.ts` were untouched, so the failure is caused by the old panel and nothing else.

Command: `pnpm test -- --run` with the old panel in place.

```
 ❯ src/__tests__/components/SettingsPanel.test.ts (79 tests | 2 failed)
     × keeps capturing after the panel closes and offers the later prompt next time
     × shows Install App for a prompt captured at boot, with no tracker injected

 FAIL  SettingsPanel install control > keeps capturing after the panel closes and offers the later prompt next time
Error: Expected beforeinstallprompt listener
 ❯ emitBeforeInstallPrompt src/__tests__/components/SettingsPanel.test.ts:81:24

 FAIL  SettingsPanel install control > shows Install App for a prompt captured at boot, with no tracker injected
AssertionError: expected undefined to be defined
 ❯ src/__tests__/components/SettingsPanel.test.ts:612:51

 Test Files  1 failed | 120 passed (121)
      Tests  2 failed | 2620 passed (2622)
[ELIFECYCLE] Test failed. See above for more details.
```

Both failures are the defects, not incidental:

- **AC-1 failure** (`expected undefined to be defined`). The panel built its own tracker *after* `beforeinstallprompt` had already fired, so it captured nothing and `InstallRow` saw `hidden`. This is the exact Phase-0 production symptom, reproduced in a test.
- **AC-2 failure** (`Expected beforeinstallprompt listener`). `destroy()` had called `tracker.destroy()`, which removed the listener, so an event fired while Settings was closed had nothing to reach - the map was empty when the test tried to emit.

After restoring the implementation, with no other change: `pnpm test -- --run` → `121 passed (121)`, `2623 passed (2623)`.

Honest note on case (a): as specified in the brief it injects a pre-populated tracker, and an injected tracker bypasses the old bug wholesale, so (a) passes against the old panel too - it pins the `InstallRow` read path, not the lifetime. (a2) is what makes AC-1 testable end-to-end, because it goes through the constructor's own default. Both are kept.

## 4. FR / AC mapping

| Requirement | Satisfied by |
| --- | --- |
| **FR-1** Capture starts during boot, before the first scene, and lasts for the page's life | `src/main.ts:37-40` (`initInstallPrompt()` before `new Phaser.Game`); `src/utils/pwaInstall.ts:160-181` (single stored instance, one listener pair per page). Tests: `pwaInstall.test.ts` "registers one listener pair per page however often init runs", "returns the same tracker on every call", "creates the tracker lazily for an entry point that skips init"; `SettingsPanel.test.ts` (a2). |
| **FR-2** The panel reads the app-lifetime tracker by default, closing must not stop capture, an injected tracker still overrides | `SettingsPanel.ts:55-69` (default parameter) and `:185-187` (no teardown); `pwaInstall.ts:183-190`. Tests: (a), (b); existing injected `installable` / `ios-howto` / `hidden` cases. |
| **AC-1** A prompt captured before the panel is constructed produces the "Install App" row | `SettingsPanel.test.ts:589-613` (boot path, no injection) and `:561-571` (injected tracker built from real deps). Red before: `AssertionError: expected undefined to be defined`. |
| **AC-2** Open/close does not lose a prompt fired after the close; the next open still shows it | `SettingsPanel.test.ts:573-587` - row present on reopen **and** `deps.removeEventListener` never called. Red before: `Error: Expected beforeinstallprompt listener`. |
| NFR-2 (module stays browser-free and testable) | All browser access is confined to `createBrowserInstallTracker()`; `createInstallTracker()` still takes every dependency as an object and is exercised by the untouched tests. |
| NFR-4 (one listener pair per page; `destroy()` still removes both) | `pwaInstall.ts:179-182`; tests "registers one listener pair per page however often init runs", "forwards teardown to the window listeners it registered", and the pre-existing "destroy() removes both browser listeners". |
| NFR-5 (shell under the 200 kB gate, no new chunk) | `validate-bundle.js`: shell entry 138.2 kB; chunk list unchanged in shape (no new entry). |

FR-3, FR-4, FR-5 and AC-3…AC-6 are Phases 2-3 and are deliberately untouched here.

## 5. Deviations

None against `Touches`: only the five permitted source/test files were modified, plus this evidence file.

Two clarifications worth recording, neither a scope change:

1. **`SettingsPanel.test.ts` gained a third case (a2) beyond the brief's (a)/(b).** (a) as written cannot fail on the pre-change code, because it injects the tracker and injection bypasses the bug. (a2) drives the constructor's own default so AC-1 has a real regression test; the red run above depends on it.
2. **`pwaInstall.test.ts` gained a sixth case in the browser-tracker describe** ("forwards teardown to the window listeners it registered") when coverage showed `pwaInstall.ts` line 157 - the `removeEventListener` delegation - was the only uncovered line in the module. It asserts adapter behaviour rather than existing only to move a number.

## 6. Blockers

- `node scripts/validate-docs.js` - **denied by the shell sandbox** (`permission.rejected`). Per the brief it was not retried, rephrased or worked around; the primary agent must run it. Phase 1 changes no `docs/` file, so it is expected to be unaffected, but this is unverified here.

## Primary verification

Base `71abff8b`, commits `52cdddc3 fix(pwa): capture the install prompt for the page's life` and `7e76c122 docs(conductor): verify phase 1 of install prompt lifetime`. The subagent reported one blocker, the docs layer, which is a sandbox denial and not a code problem.

| Layer | Command | Exit | Note |
| --- | --- | --- | --- |
| 1 | `git status --porcelain` | clean | `Touches` respected |
| 2 | `git diff --name-only 71abff8b..HEAD` | 5 source/test files + evidence | exactly the contract, 473 insertions / 16 deletions |
| 3 | `pnpm check` | 0 | two pre-existing findings only (`biome.json` `$schema` info, `musicalMemoryScene.test.ts:294` noNonNullAssertion) |
| 4 | `pnpm typecheck` | 0 | |
| 5 | `pnpm test -- --run` | 0 | 121 files / 2623 tests (+12) |
| 6 | `pnpm test:coverage` | 0 | 97.99 / 92 / 96.69 / 98.74 |
| 7 | `pnpm build` | 0 | |
| 8 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB, shell `index-CbwtS-OD.js` 138.2 kB <= 200 kB |
| 9 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 10 | `node scripts/validate-docs.js` | 0 | 5 passed - the layer the subagent could not run |

### Independent read of the change

- `createBrowserInstallTracker()` is a genuine adapter: every browser global is touched inside it, the capability guard mirrors `canObserveVisibility()` / `canObservePageExit()` in `playTimeLogic.ts`, and the inert fallback returns a working tracker over no-op deps rather than a special case. `createInstallTracker()` and its dependency contract are untouched, so the module's existing testability is preserved (NFR-2).
- The holder is a single module-level `let`, resolved through one function used by both `initInstallPrompt()` and `getInstallPromptTracker()`. That is what makes "one listener pair per page" true by construction rather than by convention, and the tests assert it.
- `SettingsPanel` now takes the tracker as a **default parameter**, not a body-level `??` fallback. This matters: `HubScene` calls `new SettingsPanel(this, undefined, cb)`, and a default parameter covers `undefined`, so the existing call site keeps working without change.
- `destroy()` no longer calls `installTracker.destroy()`. Nothing in `SettingsPanel.test.ts` asserted that call, and the replacement comment states the reason explicitly, so a later reader cannot "restore" it by habit.
- `InstallRow` is untouched: it still reads the state once at `create()`, which is correct under the approved scope (no live insertion).
- AC-1 and AC-2 are the two behaviours that were broken. The red evidence in section 3 is honest about case (a) being structurally incapable of failing pre-change and keeps (a2) as the real regression test. That is the right call and it is recorded rather than papered over.

### Accepted decisions

1. **Case (a2)** added beyond the brief's (a)/(b). The brief asked for a test with an injected pre-populated tracker; injection bypasses the defect, so that case cannot be red before the change. The subagent added a no-injection boot-path case that goes through the constructor default, which is red pre-change and green after. Accepted - it strengthens AC-1 rather than weakening anything.
2. **Sixth adapter case** (`forwards teardown to the window listeners it registered`) added because the `removeEventListener` delegation was the module's only uncovered line. Accepted: it asserts real adapter behaviour, not a coverage number.

### Hand checks

- A page with no `window` listeners gets a tracker that reports `hidden` and attaches nothing, so a scene suite's partial `window` stub cannot throw at panel construction.
- `initInstallPrompt()` twice yields one instance and one listener pair (test).
- Closing Settings leaves capture running (test asserts `removeEventListener` was never called).
- Shell bundle grew 0.4 kB (137.8 to 138.2 kB) with no new chunk; well inside the gate.
- FR-3/FR-4/FR-5 are untouched by this phase and remain Phase 2/3 work, as the evidence states.

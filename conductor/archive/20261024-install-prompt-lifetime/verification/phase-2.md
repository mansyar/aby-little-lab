# Phase 2 verification - A spent prompt is not offered again

Track: `20261024-install-prompt-lifetime`
Branch: `fix/20261024-install-prompt-lifetime`
Commit: `f7afe644 fix(pwa): spend the install prompt when it is shown`
Covers: FR-3, FR-5, AC-3, AC-5

## 1. What changed

### `src/utils/pwaInstall.ts`

| Lines | Change |
| --- | --- |
| 8 | The `States` line for `"installable"` now reads "holds an unused captured prompt" instead of "captured a beforeinstallprompt". Same flag, same three states - only the meaning of the first is corrected. |
| 21-33 | `InstallStateInput.promptAvailable` re-documented as "True while a captured beforeinstallprompt is still unused. Spending it in `prompt()` clears this; only a fresh browser event sets it again." |
| 63-73 | `InstallTracker.prompt()` doc gained one sentence: the captured event is single-use, so the call ends the `"installable"` state. |
| 82-88 | Comment on the internal `promptAvailable` flag records that the flag and the deferred event are spent together, and that `onBeforeInstallPrompt` is the only restore path. The flag itself and its initial value are unchanged. |
| 113-129 | `prompt()` rewritten. It claims the event first (`const promptEvent = deferredPrompt; if (!promptEvent) return false;`), then clears `deferredPrompt` **and** `promptAvailable` before awaiting, then awaits inside `try`/`catch`. A rejection resolves `false`; a successful show resolves `true`. |
| 90-95 | `onBeforeInstallPrompt` untouched - it already sets `deferredPrompt` and `promptAvailable = true` together, which is now the documented and only way availability returns. |

No second boolean was added and `InstallUiState` still has exactly three values.
`getInstallUiState()`, `detectIOS()`, `createBrowserInstallTracker()` and the
app-lifetime holder are untouched.

### `src/__tests__/utils/pwaInstall.test.ts`

| Lines | Change |
| --- | --- |
| 215-223 | "stops reporting installable once the captured prompt has been spent" - Android UA, prompt fired and awaited, `getState()` is `"hidden"`. |
| 225-234 | "keeps reporting the iOS how-to once the captured prompt has been spent" - iOS UA, the same spend leaves `"ios-howto"`, so a spent prompt removes the button without hiding the instructions. |
| 236-245 | "resolves false on a second prompt call without throwing" - the second `prompt()` resolves `false` and the fake event was prompted exactly once. |
| 248-256 | "resolves false and stays spent when the browser refuses the prompt" - `promptEvent.prompt` rejects, the call resolves `false` (no rejection reaches the caller) and the state is `"hidden"`. |
| 258-273 | "offers the prompt again when the browser captures a new event" - first event spent → `"hidden"`; a second `beforeinstallprompt` → `"installable"`, and its own `prompt()` resolves `true`. This is the only path back, as FR-3 says. |
| 359-401 | New `describe("install prompt is not persisted")` for FR-5/AC-5, one case (see section 5). |

### `src/__tests__/components/SettingsPanel.test.ts`

| Lines | Change |
| --- | --- |
| 561-573 | "shows no install row once the captured prompt has been spent" - a **real** `createInstallTracker` over the suite's `createTrackerDeps()`, `beforeinstallprompt` fired, `prompt()` awaited (`true`), then the panel constructed with that tracker; `findTextByLabel(scene, "Install App")` is `undefined`. No new helper was needed. |

`createFakeInstallTracker("hidden")` and the rest of the install-control cases are
unchanged: they still pin the rendering, and the new case pins that a tracker the
production code produced actually reaches it.

## 2. Commands

Run from the repo root on Windows (`pwsh`), in the brief's order.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm check` | 0 | 252 files checked. Two findings, both pre-existing and named in phase 1: `biome.json` schema 2.5.5 vs CLI 2.5.10 (info), `musicalMemoryScene.test.ts:294` non-null assertion (warning). No error. |
| `pnpm typecheck` | 0 | `tsc --noEmit` silent. |
| `pnpm test -- --run` | 0 | 121 files, **2630 passed** (green). The same command was 1 before the source change - see section 3. |
| `pnpm test:coverage` | 0 | 121 files, 2630 passed. Statements 97.99 %, branches 92 %, functions 96.69 %, lines 98.74 % (thresholds 95/85/88/90). `pwaInstall.ts` is absent from the per-file table, i.e. 100 % on all four - the new `catch` and the early `return false` are covered. |
| `pnpm build` | 0 | 343 modules; `index-D_wN43lj.js` 141.54 kB (32.68 kB gzip); `phaser-P1E8uaLi.js` 1,374.82 kB; `sw.js` + workbox generated. |
| `node scripts/validate-bundle.js` | 0 | `Phaser vendor chunk present: phaser-P1E8uaLi.js (1342.6 kB)`; `shell entry index-D_wN43lj.js = 138.2 kB (<= 200 kB)`. |
| `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (42 chunks, 42 precached). |
| `node scripts/validate-docs.js` | - | **Denied by the shell sandbox** (`permission.rejected`), not retried per the brief. See `## Blockers`. |

A single chained invocation of the three validators (`a; b; c`) was also denied as
a command, so the bundle and PWA layers were run individually - which the brief
allows - and both passed. Only the docs layer is outstanding.

Test totals: 2630 = 2623 before this phase + 7 added (6 in `pwaInstall.test.ts`,
1 in `SettingsPanel.test.ts`).

The green run happened against the working tree that is commit `f7afe644`; only
this evidence file was written afterwards.

## 3. Red then green

The required proof is the "spent prompt reports hidden" case. It was written
first, against the **unmodified** `src/utils/pwaInstall.ts`, so the red result is
the old `prompt()` failing a new test rather than a reverted file.

Command: `pnpm test -- --run`, with the new tests and the pre-change `prompt()`.

```
 ❯ src/__tests__/utils/pwaInstall.test.ts (33 tests | 4 failed) 109ms
     × stops reporting installable once the captured prompt has been spent
     × keeps reporting the iOS how-to once the captured prompt has been spent
     × resolves false and stays spent when the browser refuses the prompt
     × offers the prompt again when the browser captures a new event
 ❯ src/__tests__/components/SettingsPanel.test.ts (80 tests | 1 failed)
     × shows no install row once the captured prompt has been spent
```

Failing assertion text, verbatim:

```
 FAIL  src/__tests__/utils/pwaInstall.test.ts > createInstallTracker > stops reporting installable once the captured prompt has been spent
AssertionError: expected 'installable' to be 'hidden' // Object.is equality

Expected: "hidden"
Received: "installable"

 ❯ src/__tests__/utils/pwaInstall.test.ts:222:32
    220|     await tracker.prompt();
    221|
    222|     expect(tracker.getState()).toBe("hidden");
```

The other four reds say the same thing in their own words:

- iOS: `AssertionError: expected 'installable' to be 'ios-howto'` (`:233`).
- Refusal: `AssertionError: promise rejected "Error: prompt() needs a user gesture" instead of resolving` (`:254`) - the old `prompt()` let the rejection escape.
- New event: `AssertionError: expected 'installable' to be 'hidden'` (`:266`) - the state had never dropped, so the "fresh event" assertion proved nothing until the flag was spent.
- Panel: `AssertionError: expected { destroy: [Function Mock], …(10) } to be undefined` (`SettingsPanel.test.ts:571`) - `findTextByLabel` found an "Install App" row for a prompt that had already been shown and dismissed.

`Test Files  2 failed | 119 passed (121)` / `Tests  5 failed | 2625 passed (2630)`.

After the `prompt()` change, with no test edits: `Test Files 121 passed (121)` /
`Tests 2630 passed (2630)`.

Two of the six new tracker cases (second `prompt()` resolves `false`; storage) pass
against the old code too, and are kept because they pin behaviour that must not
regress: the single-use claim and the absence of persistence.

## 4. FR / AC mapping

| Requirement | Satisfied by |
| --- | --- |
| **FR-3** A captured prompt is single-use: once `prompt()` has attempted to show it, `getState()` no longer reports `installable` unless the browser captures a new event | `pwaInstall.ts:113-129` clears `promptAvailable` at the moment the event is claimed, before the await, and the rejection path cannot restore it. Tests: "stops reporting installable once the captured prompt has been spent", "keeps reporting the iOS how-to once the captured prompt has been spent", "resolves false on a second prompt call without throwing", "resolves false and stays spent when the browser refuses the prompt", "offers the prompt again when the browser captures a new event". |
| **FR-5** Nothing about the dismissal is persisted; a later reload starts from the browser's own state | No storage is read or written anywhere in the capture/spend/teardown cycle: no storage import exists in the module (`pwaInstall.ts:1-209`), and `createBrowserInstallTracker` (`:160-178`) touches only `navigator.userAgent`, `window.matchMedia` and the two listener methods. Test: "neither reads nor writes storage across capture, prompt and teardown". |
| **AC-3** After `prompt()` has run, `getState()` reports `hidden` on a non-iOS platform, and the panel shows no install row | `pwaInstall.test.ts:215-223` (state) and `SettingsPanel.test.ts:561-573` (row absent), the latter through a real tracker rather than a fake one. Red before: `expected 'installable' to be 'hidden'` and the panel's `expected {…} to be undefined`. |
| **AC-5** The dismissal writes nothing to storage | `pwaInstall.test.ts:359-401`; the `localStorage` double's `getItem`, `setItem`, `removeItem`, `clear` and `key` are all asserted untouched across capture, spend and `destroy()`. |

NFR-3 (no change to the storage schema or save payload) holds by construction:
the phase touches no storage module and the new test proves the install path
reaches none.

FR-4 / AC-4 (the iOS branch, unchanged) are still enforced by the pre-existing
`getInstallUiState` cases plus the new "keeps reporting the iOS how-to" case, which
also proves the spent prompt does not swallow the iOS row.

## 5. The AC-5 assertion choice

**Chosen: a `globalThis.localStorage` spy, driven through
`createBrowserInstallTracker()`.** The case fires `beforeinstallprompt` at the
adapter's real listener, awaits `prompt()` (asserting `true`, so the spend really
happened), calls `destroy()`, and then asserts the five storage methods were never
called.

Why this and not "assert the module's dependency surface":

- Asserting the dependency surface means asserting that `createInstallTracker`
  takes `InstallTrackerDeps` - which the type system already says, so the test
  could not fail for a behavioural reason. It would restate the signature.
- A spy over a tracker built from `createFakeDeps` would be close to tautological
  too: injected deps give the tracker no reference to any global, so nothing could
  write even if the module had grown a storage call somewhere else.
- Driving the adapter puts the assertion on the only route in the module that
  touches real globals. That is where a `localStorage.setItem("installDismissed")`
  would plausibly be added by a future "remember the dismissal" change, so the
  spy sits where the regression would land. It also covers reads (`getItem`,
  `key`), which is the half that "a later reload starts from the browser's own
  state" depends on.
- No storage import was added anywhere to make the test possible; the double is
  stubbed from outside the module, exactly as the module's own testability
  contract (NFR-2) intends.

## 6. Deviations

None against `Touches`: the three permitted files plus this evidence file were the
only changes (`git diff --stat`: `pwaInstall.ts` +29/-5, `pwaInstall.test.ts`
+103, `SettingsPanel.test.ts` +13).

Three documentation touches are worth recording so they are not mistaken for
scope creep:

1. `pwaInstall.ts:8` - the `"installable"` state's one-line description now says
   "holds an unused captured prompt". Leaving it as "captured a
   beforeinstallprompt" would have contradicted the flag's new doc two lines
   below.
2. `pwaInstall.ts:66-70` - the `InstallTracker.prompt()` interface doc gained the
   single-use sentence, so the contract is visible where `InstallRow` consumes it.
3. `pwaInstall.test.ts:359-401` - the persistence case lives in its own `describe`
   rather than inside `createInstallTracker`, because it exercises the browser
   adapter, not the injectable core.

No change to `src/components/SettingsPanel.ts`, `src/main.ts` or
`src/components/settings/InstallRow.ts`; Phase 1's wiring is untouched.

## Blockers

- `node scripts/validate-docs.js` - **denied by the shell sandbox**
  (`permission.rejected`). Per the brief it was not retried, rephrased or worked
  around; the primary agent must run it. This phase changes no `docs/` file, so it
  is expected to pass as it did in the primary's phase-1 run, but that is
  unverified here.

## Primary verification

Base `48b79ef1`, commits `f7afe644 fix(pwa): spend the install prompt when it is shown` and `01290f12 docs(conductor): verify phase 2 of install prompt lifetime`. The only reported blocker is the docs layer, denied by the sandbox and not a code problem.

| Layer | Command | Exit | Note |
| --- | --- | --- | --- |
| 1 | `git status --porcelain` | clean | |
| 2 | `git diff --name-only 48b79ef1..HEAD` | 3 source/test files + evidence | exactly `Touches`, 331 insertions / 5 deletions |
| 3 | `pnpm check` | 0 | two pre-existing findings only |
| 4 | `pnpm typecheck` | 0 | |
| 5 | `pnpm test -- --run` | 0 | 121 files / 2630 tests (+7) |
| 6 | `pnpm test:coverage` | 0 | 97.99 / 92 / 96.69 / 98.74 |
| 7 | `pnpm build` | 0 | |
| 8 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB, shell `index-D_wN43lj.js` 138.2 kB |
| 9 | `node scripts/validate-pwa.js` | 0 | 16 passed |
| 10 | `node scripts/validate-docs.js` | 0 | 5 passed - the layer the subagent could not run |

### Independent read of the change

- The spend is ordered correctly: the event is claimed, `deferredPrompt` and `promptAvailable` are cleared, and only then is the dialog awaited. Clearing before the await is what makes the invariant hold while the browser dialog is open - a state read during that window already reports spent.
- The `try`/`catch` returns `false` on refusal rather than rethrowing. That is the right contract for a `void tracker.prompt()` tap handler, and it is consistent with "resolves true if it was shown": a refusal shows nothing.
- The flag is cleared on the rejection path too, which is the subtle part. The event is single-use, so restoring availability on failure would advertise a prompt that can never appear again.
- `onBeforeInstallPrompt` is untouched and is still the only writer that sets `promptAvailable` back to true, so a genuinely new browser offer re-arms the row without any extra plumbing.
- No second boolean, no new `InstallUiState` value, no storage import - the whole change is one flag's semantics plus one code path.
- The AC-5 choice is honest. Driving `createBrowserInstallTracker()` puts the spy on the only route in the module that touches real globals, which is where a future "remember the dismissal" write would land, and it covers reads as well as writes. Asserting the dependency surface would have been a tautology against the type signature; the evidence says so.

### Accepted decisions

1. **Three documentation touches** inside `pwaInstall.ts` (`:8` state list, `:21-33` input doc, `:63-73` interface doc). They keep the file from contradicting itself about what `installable` means. Accepted - the phase's whole point is that meaning.
2. **The AC-5 case lives in its own `describe`** because it exercises the browser adapter rather than the injectable core. Accepted; the grouping is accurate.

### Hand checks

- Android: capture, spend, `getState()` returns `hidden` (test).
- iOS: capture, spend, `getState()` returns `ios-howto`, so a spent prompt does not hide the instructions (test).
- Second `prompt()` resolves `false` without throwing (test).
- Refusal resolves `false` and leaves the tracker spent (test).
- A fresh event restores `installable` and a further `prompt()` succeeds (test).
- A spent tracker renders no row through the real panel construction path (test).
- `pwaInstall.ts` remains at 100% coverage on all four metrics, so the new `catch` branch is genuinely exercised.

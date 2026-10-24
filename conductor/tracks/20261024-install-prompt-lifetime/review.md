# Review - Install Prompt Lifetime

- **Track:** `20261024-install-prompt-lifetime` (bug, high)
- **Branch:** `fix/20261024-install-prompt-lifetime`
- **Range:** `329370f625b18108ddada527de990a0f8289defd..28deedbc`
- **Date:** 2026-10-24
- **Round:** 1
- **Verdict:** **PASS WITH FINDINGS** - no Critical or High; two Medium, four Low, all assigned to Phase R1.

## Summary

The change is small, well-shaped and in the right place. Capture moved from a
panel-owned object to a page-owned one (`initInstallPrompt()` at boot,
`getInstallPromptTracker()` as the single holder), the panel borrows the tracker
and deliberately no longer destroys it, and `promptAvailable` now means "a
captured, unused prompt exists" so a spent offer stops advertising itself. The
injectable core is untouched, the browser adapter is the only place `window`
and `navigator` are read, and it degrades to `hidden` rather than throwing on a
partial host. All six acceptance criteria are satisfied by tests, three of them
with recorded red-before evidence.

The gaps are in verification coverage and prose, not in behaviour: the one
production line that makes the fix real (`src/main.ts:40`) has no test, the
AC-5 storage case does not exercise the read path its evidence claims, and two
PRD sentences overstate what the shipped code does.

## Verification at HEAD

| Layer | Command | Result |
| --- | --- | --- |
| Lint | `pnpm check` | exit 0 - only the two pre-existing findings (biome `$schema` info, `musicalMemoryScene.test.ts:294`) |
| Types | `pnpm typecheck` | exit 0 |
| Unit | `pnpm test -- --run` | 121 files / 2630 tests |
| Coverage | `pnpm test:coverage` | 97.99 / 92 / 96.69 / 98.74 |
| Build | `pnpm build` | exit 0 |
| Bundle | `node scripts/validate-bundle.js` | phaser 1342.6 kB, shell `index-D_wN43lj.js` 138.2 kB |
| PWA | `node scripts/validate-pwa.js` | 16 / 0 |
| Docs | `node scripts/validate-docs.js` | 5 / 0 (run by the primary; denied to every subagent) |

## Requirements

| ID | Status | Evidence |
| --- | --- | --- |
| FR-1 | Partial (F1) | adapter + holder tested; the boot call itself unverified |
| FR-2 | Covered | panel borrows the default, `removeEventListener` never called on close |
| FR-3 | Covered (doc overstatement, F4) | spent → `hidden`/`ios-howto`, re-arm, refusal, second call |
| FR-4 | Covered (doc imprecision, F5) | unchanged `getInstallUiState` suite + panel injected cases |
| FR-5 | Covered | storage spy across capture/spend/destroy |
| NFR-1..NFR-6 | Covered | adapter/bundle/storage/no-real-events assertions |
| AC-1 | Covered | boot-path panel case (red before) |
| AC-2 | Covered | close/fire/reopen + listener removal |
| AC-3 | Covered | tracker state + spent-tracker panel case |
| AC-4 | Covered | iOS/installed/standalone cases |
| AC-5 | Partial (F3) | write path only; read path asserted in prose, not code |
| AC-6 | Covered | table above |

## Findings

### F1 - Medium - `src/main.ts:37-40`

**What:** `initInstallPrompt()` is the only production call that starts capture,
and nothing tests it. The boot case in `SettingsPanel.test.ts` re-states the
boot sequence by calling `pwaInstall.initInstallPrompt()` itself, so deleting
`main.ts:40`, or moving it below `new Phaser.Game` (`:46`), leaves the suite
green.

**Why:** "capture starts during boot" is defect D1 from the spec - the clause
that makes the whole fix real. An untested wiring line is exactly what a later
refactor drops, silently returning the app to a panel-constructed tracker and a
permanently hidden row on every non-iOS platform.

**Fix:** Pin the order with the repo's existing `?raw` source-assertion pattern
(`src/__tests__/game/art/shellOwnership.test.ts:9-11`): import `main.ts?raw`
and assert `indexOf("initInstallPrompt(") < indexOf("new Phaser.Game(")` and
`> -1`. Home it in `src/__tests__/utils/pwaInstall.test.ts` so it stays inside
the phase's existing Touches.

**Requirement:** FR-1.

### F2 - Low - `src/utils/pwaInstall.ts:202-206`

**What:** The new JSDoc justifies lazy creation with "a Hub-only host", but
`src/main.ts` is the only entry point and it always calls `initInstallPrompt()`.

**Why:** A comment naming a code path that does not exist sends the next reader
hunting for it, and hides the real case (a test that builds the panel before any
boot code runs).

**Fix:** Replace the parenthetical with the real one: "(for example a test that
constructs the panel before any boot code has run)".

**Requirement:** none (accuracy).

### F3 - Low - `src/__tests__/utils/pwaInstall.test.ts:391-392`

**What:** The AC-5 case spends the prompt and destroys the tracker without ever
calling `getState()`, and never emits `appinstalled`, so the `localStorage` spy
only covers the capture/spend/destroy route. A read added inside `getState()` -
the natural home for "start from the persisted state" - would leave the case
green, yet evidence §5 claims the read path is covered.

**Why:** FR-5 is a no-reads property as well as a no-writes one ("a later reload
starts from the browser's own state"). The test is narrower than the claim
attached to it.

**Fix:** Inside the same case, before `destroy()`, assert
`expect(tracker.getState()).toBe("hidden")` and invoke the `appinstalled`
listener once, so a read or write on those routes fails the case.

**Requirement:** AC-5, FR-5.

### F4 - Medium - `docs/PRD.md:96` and `:430`

**What:** "Once 'Install App' has been used the row is gone for the rest of that
page's life" is wrong twice. (a) `InstallRow.create()` reads the state once
(`InstallRow.ts:43`), so in the panel already open the button stays and a second
tap resolves `false` (`pwaInstall.ts:115`) - the dead affordance this track set
out to remove, alive until the panel closes. (b) A fresh `beforeinstallprompt`
re-arms the flag (`pwaInstall.ts:90-95`), which `:430` itself says two clauses
later.

**Why:** The PRD would promise the impossible and contradict itself in one
paragraph. A device check written from it cannot pass, and the surviving in-panel
button reads as a new bug.

**Fix:** Reword both places to: "once 'Install App' has been used, the next time
Settings opens the row is gone, and it only returns if the browser makes a fresh
offer; the row already on screen does not change."

**Requirement:** FR-3.

### F5 - Low - `docs/PRD.md:94` and `:428`

**What:** The tightened iOS clause gives two conditions; `getInstallUiState()`
requires three (`!installed && !isStandalone && !promptAvailable`,
`pwaInstall.ts:37`). Safari never fires `appinstalled`, so an iOS home-screen
launch satisfies the written clause while the code shows nothing.

**Why:** The middle clause argues with the trailing "nothing once the app is
installed or running standalone" inside one sentence, in the section that defines
the install promise.

**Fix:** "an iOS Safari how-to wherever the app is neither installed nor running
standalone and no prompt is available".

**Requirement:** FR-4, AC-4.

### F6 - Low - `docs/TDD.md:360`

**What:** The new §5.5 paragraph points at §3.1 for the boot order, but §3.1
still describes the pre-`new Phaser.Game` sequence as only
`initPwaBridge(registerSW)`; `initInstallPrompt()` is absent.

**Why:** The cross-reference now points at an incomplete boot description.

**Fix:** Append one clause to `:360`: "`initInstallPrompt()` runs first, so the
browser's once-per-load offer is captured before any scene can open Settings."

**Requirement:** FR-1.

### F7 - Low - `conductor/tracks/20261024-install-prompt-lifetime/verification/phase-3.md:5,236,241`

**What:** The evidence cites `bfa79874` and `419a2221`, which the squash into
`dd1099c9` replaced, and reports 247 insertions where the range now measures 286.

**Why:** The checkpoint evidence cannot be replayed from the hashes it names.

**Fix:** Name `dd1099c9` as the single checkpoint commit carrying both the
documents and the evidence, and restate the measured insertions.

**Requirement:** AC-6.

## Plan compliance

Compliant. Every phase's tasks are `[x]`, each carries `Result`, `Checkpoint`
and `Evidence`, and the checkpoints are ancestors of HEAD in order
(`52f89530` → `e06fb292` → `dd1099c9`). The diff equals the union of the phases'
`Touches` plus evidence and Conductor state; declared deviations inside Touches
were accepted at primary verification (panel case "a2", sixth adapter case,
PRD iOS tightening, TDD hyphen style).

## Out of scope

- Live row insertion while Settings is open (spec: read at open).
- Persisting a dismissal.
- A non-iOS how-to after dismissal.
- The two pre-existing repository findings.

## Debt

None carried out of the track. F1-F7 are all fixable inside it, so Phase R1
takes every one.

## History

| Round | Verdict | Critical | High | Medium | Low | Deferred |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 2 | 4 | 0 |

## Doc sync

`complete` at `dd1099c9` (PRD §1.4/§4.10, TDD §5.5, roadmap retirement, README
count), with F4-F6 correcting the prose further in Phase R1.

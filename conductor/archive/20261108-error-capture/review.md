# Review - Error Capture

- **Track:** 20261108-error-capture
- **Range reviewed:** `7d3c0db886685b5b307eefc53231990f721417dc..598518c4`
- **Reviewer:** `conductor-reviewer`, 1 round
- **Verdict:** PASS WITH FINDINGS (round 1 returned CHANGES REQUIRED: 2 high, 4 medium, 4 low; all ten addressed in Phase R1, none deferred)

## Findings

| ID | Severity | Where | What was wrong | Resolution |
| --- | --- | --- | --- | --- |
| F1 | high | `src/scenes/RecoverScene.ts:122`, `src/utils/reload.ts:36-43` | The card's only control called `reloadOnce()`, the pre-canvas one-shot guard. `sessionStorage` survives a reload, so after the first crash-tap (or any pre-canvas reload) every later card in that tab had a button that did nothing - the child stranded on an icon-only screen, which is the failure this track exists to remove. | `reloadPage()` added to the seam, called by the card; `reloadOnce()` kept for the no-scene path only. A test fires the card's tap with the flag already spent and asserts it still reloads. |
| F2 | high | `src/game/errorCapture.ts:97` | `recover()` sat outside the `try` around the recording, so `runningScene()` (a destroyed game) or `reload()` (a blocked `location`) could throw out of the listener - "an error handler that can throw turns one crash into two". | `recover()` moved inside the same `try`, with cases where both deps throw and the listener stays silent. |
| F3 | medium | `src/utils/diagnostics.ts:79-92,128` | `MAX_STACK_CHARS` bounded only the stack. `message` was untruncated and a stringified rejection reason could be any size, and `readEntry` passed a stored stack through untrimmed - so the 12,000-byte ceiling was a property of the fixture (7-character messages), not of the code. | `MAX_MESSAGE_CHARS` applied on write **and** on read, stored stacks trimmed, and the test given realistic message lengths plus a large rejected object. |
| F4 | medium | `docs/TDD.md:909,911`, `conductor/tech-stack.md:503`, `conductor/product.md:180` | The documents described the code Phase 4 replaced: `game.scene.start` (a method Phaser 4 does not have - the defect itself) and "a transparent disc" (the alpha-0 Arc nothing could press). | Both corrected, with the `Zone` named. |
| F5 | medium | `src/__tests__/guard/backupDom.test.ts:120-121` | The guard watches two window *members*, not the `window.` prefix FR-12/AC-9 promise, and `src/utils/reload.ts` is a second module this track adds that names globals, contradicting FR-11. | FR-11/FR-12/AC-9 amended to what the guard does, naming `reload.ts` beside `errorCapture.ts`, and the documents updated. |
| F6 | medium | `src/components/SettingsPanel.ts:553-575` | The diagnostics row was at `rowY(3)` and the result line at `rowY(2)`, so the line reporting what happened sat **above** the row, contrary to FR-8 and to both comments. | Row above, result line below, both `y` values asserted, comments corrected. |
| F7 | low | `e2e/journeys/crash.spec.ts:64,136` | NFR-6 said "exactly one journey"; the spec holds two tests. | NFR-6 amended to one spec file with two tests, which is what the evidence already said. |
| F8 | low | `src/__tests__/scenes/recoverScene.test.ts:70-73` | The hit-area assertion was `setInteractive(expect.anything(), expect.any(Function))`, which the removed off-centre circle would also satisfy. | The recorded shape is asserted (x, y, radius 72 in local space). |
| F9 | low | `src/components/SettingsPanel.ts:572-584` | A wrapped "Saved <filename>" line could clip the top of the new card. | Solved by the F6 layout. |
| F10 | low | `src/utils/backupFormat.ts:414,439-444` | A "replace" import takes the incoming settings wholesale, so restoring a pre-track backup erases this device's crash log. | Behaviour kept and named in TDD and the roadmap row, because it is what "replace" means. |

## What the review confirmed

- The two defects Phase 4 found are genuinely pinned: the fake scene manager has **no** `start` and a case asserts that; `recoverScene.test.ts` asserts the interactive kind is `zone`.
- `toCrashEntry` is total: every branch returns a non-empty message, circular reasons fall back, `new Error("")` reads as `"Error"`.
- The storage path is right: `recordCrash` through `mutate`, `getDiagnostics` returns a copy, a refused write keeps the entry for the session, an unknown-version payload's bytes stay identical.
- The pure/impure split holds, and no `fetch(` exists in production code.
- Numbers reproduce: 144 files / 3,150 tests, coverage 97.39/92.02/96.36/98.33, shell 172.6 kB, 47/47 chunks precached, 21 journeys across 16 spec files.

## Overrides

None. Nothing deferred: all ten findings were fixed in Phase R1 rather than carried as debt.

## Doc sync

The track's documents were updated in the same round: `docs/TDD.md` §6.8, `conductor/tech-stack.md` (the 2026-11-08 entry), `conductor/product.md` §10.3, `README.md`, and the two dated spec corrections. `doc_sync: synced`.

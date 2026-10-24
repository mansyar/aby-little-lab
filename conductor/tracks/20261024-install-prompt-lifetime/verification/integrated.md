# Integrated Verification - Install Prompt Lifetime

Track: `20261024-install-prompt-lifetime`
Base: `329370f6` (`master`, docs: record the v1.21.2 deployed smoke)
Verified at: `bf007290` (code HEAD `dd1099c9` + phase-state commits)
Range size: 9 files, +489 / -40 outside `conductor/`

## What changed

| Area | Before | After |
| --- | --- | --- |
| Capture lifetime | `SettingsPanel` built a tracker per open and destroyed it on close, so `beforeinstallprompt` had no listener | `initInstallPrompt()` runs in `src/main.ts` before `new Phaser.Game`; `getInstallPromptTracker()` returns one stored instance for the page |
| Ownership | The panel owned the tracker | The panel borrows it as its default parameter; `destroy()` no longer tears it down, and an injected tracker still wins for tests |
| Browser access | Inline closure over `navigator`/`window` inside the panel constructor | `createBrowserInstallTracker()` is the single adapter; it goes inert where `window`/`navigator` are absent or partial |
| Spent prompt | `prompt()` nulled the deferred event but left `promptAvailable` true, so the row kept offering a dead button | `prompt()` clears both before awaiting, `catch` returns `false` for a refusal and leaves them cleared; only a fresh `beforeinstallprompt` re-arms |
| Documentation | PRD/TDD described a per-open tracker and the roadmap carried the bug | PRD §1.4/§4.10, TDD §5.5 describe the boot capture, the snapshot read and the single-use offer; Known Issue and Future Work item retired, README count 5 → 4 |

## Gate

Run by the primary at `dd1099c9` (the state commits after it touch only `conductor/`).

| Layer | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | two pre-existing findings (biome `$schema` info, `musicalMemoryScene.test.ts:294`) |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / 2630 tests |
| 4 | `pnpm test:coverage` | 0 | 97.99 lines / 92 branches / 96.69 functions / 98.74 statements |
| 5 | `pnpm build` | 0 | |
| 6 | `node scripts/validate-bundle.js` | 0 | phaser `phaser-P1E8uaLi.js` 1342.6 kB; shell `index-D_wN43lj.js` 138.2 kB ≤ 200 kB |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |
| 8 | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed |

Suite grew by 19 tests across the track (2611 → 2630): 12 in Phase 1, 7 in Phase 2, 0 in Phase 3.

## Cross-phase interaction review

1. **Boot capture + panel lifetime.** `initInstallPrompt()` runs before any scene can construct a panel, and `getInstallPromptTracker()` falls back to lazy creation, so an entry point that never calls init (a test importing the panel first) still gets a working tracker rather than `undefined`.
2. **Borrowed tracker + closing the panel.** Nothing between `InstallRow.create()` and `SettingsPanel.destroy()` unsubscribes, because the only `destroy()` call was removed. A prompt that fires while Settings is closed is therefore captured and offered on the next open - the case pinned by the panel's reopen test.
3. **Spent prompt + a second panel open.** Because the tracker outlives the panel, a spent prompt is now reachable on every later open; the Phase 2 flag change is what keeps that from becoming a dead row. The two phases are only correct together, which is why the AC-3 panel case exists.
4. **Snapshot semantics.** `InstallRow` reads the state once at build time, so a prompt arriving while the panel is open is not inserted live. This is documented as intended in PRD §1.4/§4.10 and is not a regression: before the track the row could not appear at all.
5. **iOS and installed paths.** `getInstallUiState` was not touched; `ios-howto` still requires not-installed, not-standalone and no prompt, and `hidden` still wins for installed/standalone. AC-4 is pinned by the unchanged `getInstallUiState` suite plus the panel's injected-state cases.
6. **No persistence.** `pwaInstall.ts` imports nothing; the AC-5 case spies `localStorage` through the browser adapter and asserts every read and write method stays untouched across capture, spend and teardown.

## Acceptance criteria

| ID | Criterion | Evidence |
| --- | --- | --- |
| AC-1 | Prompt captured before the panel is constructed shows "Install App" | panel boot-path test (Phase 1, red-then-green) |
| AC-2 | Close and reopen does not lose a prompt that arrived while closed | panel reopen test + `removeEventListener` never called |
| AC-3 | After `prompt()`, state is `hidden` on non-iOS and the panel shows no row | tracker suite + spent-tracker panel case |
| AC-4 | iOS unchanged; installed/standalone hidden | untouched `getInstallUiState` suite + panel injected cases |
| AC-5 | A dismissal writes nothing to storage | `localStorage` spy through the browser adapter |
| AC-6 | The full gate passes | table above |

## Documents synchronised

- `docs/PRD.md` §1.4 and §4.10: boot capture, snapshot read, single-use offer, no persistence, tightened iOS clause.
- `docs/TDD.md` §5.5: `InstallRow` row reworded, plus two paragraphs on the injectable core vs browser adapter, the page-lifetime holder, panel borrowing, and the `promptAvailable` meaning.
- `docs/roadmap.md`: `### The install prompt can disappear` removed; Future Work item removed and the surviving five renumbered 1-5.
- `README.md`: roadmap item count corrected from five to four.

## Residual risk

- **No live update.** A parent who opens Settings, then sees the browser's install offer arrive, must reopen the panel. Deliberate and documented; the alternative is a subscription the row does not need.
- **Dismissal has no second chance in the same page life** on browsers that do not re-fire `beforeinstallprompt`. That is the browser's contract, not ours; a reload starts fresh.
- **`beforeinstallprompt` cannot be simulated in the deploy environment.** The device checklist keeps its manual row; automated coverage is at the dependency seam.

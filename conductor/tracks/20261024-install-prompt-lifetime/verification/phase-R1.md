# Phase R1 verification - Review Fixes

Track: `20261024-install-prompt-lifetime`
Branch: `fix/20261024-install-prompt-lifetime`
Phase base: `ae5cc522` (conductor state only)
Commit: `59c5468c fix(pwa): pin install capture to boot order and correct the install docs`
Covers: findings F1-F7; FR-1, FR-3, FR-4, FR-5; AC-4, AC-5, AC-6

## 1. What changed, per finding

| Finding | File | What changed |
| --- | --- | --- |
| F1 (Medium) | `src/__tests__/utils/pwaInstall.test.ts` | New `describe("boot wiring")` block with the case `starts install capture before the game is constructed`. It imports `main.ts?raw` - the `?raw` source-assertion pattern from `shellOwnership.test.ts` - and asserts `indexOf("initInstallPrompt(") > -1` and `indexOf("new Phaser.Game(") > indexOf("initInstallPrompt(")`, so the boot call cannot be deleted or moved below the game without failing. One new case. |
| F2 (Low) | `src/utils/pwaInstall.ts` | `getInstallPromptTracker()`'s JSDoc keeps the lazy-creation clause and replaces "(a Hub-only host, or a test that builds the panel first)" with the case that exists: a caller that never ran `initInstallPrompt()`, for example a test that constructs the panel before any boot code has run. Comment only; no code change. |
| F3 (Low) | `src/__tests__/utils/pwaInstall.test.ts` | The AC-5 storage case now, between the spend assertion and `destroy()`: asserts `tracker.getState()` is `"hidden"`, then fires the captured `appinstalled` listener. The five storage-method assertions still come last, so a read or write on the state-read route or the second callback route now fails the case. The existing assertions are unchanged. |
| F4 (Medium) | `docs/PRD.md` §1.4 (line 96) and §4.10 (line 430) | "the row is gone for the rest of that page's life" replaced in both places with the sequence the code produces: after a spend the next open has no row, it only returns if the browser makes a fresh offer, and the row already on screen does not change. "Nothing is remembered across reloads" kept in both. |
| F5 (Low) | `docs/PRD.md` §1.4 (line 94) and §4.10 (line 428) | The iOS clause now names all three conditions the code needs (`!installed && !isStandalone && !promptAvailable`): "wherever the app is neither installed nor running standalone and no prompt is available". |
| F6 (Low) | `docs/TDD.md:360` | One clause appended to the §3.1 boot description: `` `initInstallPrompt()` runs first, so the browser's once-per-load offer is captured before any scene can open Settings. `` No new paragraph, no other prose touched. |
| F7 (Low) | `conductor/tracks/20261024-install-prompt-lifetime/verification/phase-3.md:5,236,241` | `bfa79874`/`419a2221` replaced with `dd1099c9` (the squash that carries both the documents and that evidence), and the insertion count restated as measured: **286 insertions / 19 deletions** (`git diff --stat c12b70d7..dd1099c9`). Nothing else in that file changed. |

No test assertion was weakened and no count moved for any reason other than the
one new case: the suite goes 2630 -> 2631 tests. The brief's 2632 anticipated a
second new case; R1.T3 extends the existing AC-5 case instead, which is what both
the brief and the review ask for, so the total is 2631.

## 2. R1.T1.2 - red, then green

Proving the new assertion bites. `initInstallPrompt();` (and its three-line
comment) was moved from `src/main.ts:40` to after `new Phaser.Game(config);`, the
file was run alone, and the exact output was:

```
 ❯ src/__tests__/utils/pwaInstall.test.ts (34 tests | 1 failed) 74ms
     × starts install capture before the game is constructed 11ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/utils/pwaInstall.test.ts > boot wiring > starts install capture before the game is constructed
AssertionError: expected 1288 to be greater than 1314
 ❯ src/__tests__/utils/pwaInstall.test.ts:458:25
    456|
    457|     expect(indexOfInit).toBeGreaterThan(-1);
    458|     expect(indexOfGame).toBeGreaterThan(indexOfInit);
       |                         ^
    459|   });
    460| });

 Test Files  1 failed (1)
      Tests  1 failed | 33 passed (34)
```

Command: `pnpm test -- --run src/__tests__/utils/pwaInstall.test.ts`, exit 1.

`src/main.ts` was then restored by reversing the two edits. Green run of the same
command, at the restored tree:

```
 Test Files  1 passed (1)
      Tests  34 passed (34)
```

Restoration evidence - the file is not in the phase diff:

```
$ git diff -- src/main.ts
(no output)
```

and `git show --stat 59c5468c` lists five files, none of them `src/main.ts`.
Confirmed again after the commit with `git status --porcelain` (clean apart from
this evidence file). The phase base tree and the committed tree therefore agree
on `src/main.ts` byte for byte.

## 3. Commands

Run layer by layer on the committed tree (`59c5468c`), each command exactly as
the brief spells it.

| Layer | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `pnpm check` | 0 | 252 files checked; only the two pre-existing findings (biome `$schema` 2.5.5-vs-2.5.10 info, `musicalMemoryScene.test.ts:294` non-null-assertion warning) |
| 2 | `pnpm typecheck` | 0 | clean |
| 3 | `pnpm test -- --run` | 0 | 121 files / **2631** tests (2630 + the one new boot-wiring case) |
| 4 | `pnpm test:coverage` | 0 | 97.99 stmts / 92 branch / 96.69 funcs / 98.74 lines - unchanged |
| 5 | `pnpm build` | 0 | shell `index-D_wN43lj.js` 141.54 kB raw / 32.68 kB gzip; `phaser-P1E8uaLi.js` |
| 6 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB, shell `index-D_wN43lj.js` 138.2 kB (<= 200 kB) |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks, 42 precached |
| 8 | `node scripts/validate-docs.js` | - | **not run: permission denied** to this subagent (see Blockers) |

Notes on the numbers:

- The coverage figures are byte-identical to the review's baseline. The new case
  exercises no new production line: it reads a source string, and the widened
  AC-5 case exercises `getState()` and the `appinstalled` handler that the
  coverage suite already reached through other cases.
- The shell chunk hash is unchanged from Phase 3 (`index-D_wN43lj.js`, 138.2 kB)
  because the only production-file edit in this phase is a JSDoc comment, which
  minification strips. That is the expected result here, not a stale build: the
  build re-emitted all 343 modules, and `validate-pwa` re-read the fresh
  `dist/sw.js` (42/42 chunks precached).

Layer 8 could not be run. The docs checks it performs - release-note index,
relative links and anchors, the three game lists against `GAME_REGISTRY`, the two
roadmap sections, and Conductor paths - are all invariant checks over structure,
not over prose: this phase's doc edits change no heading, no link target, no
list, and no Conductor path (the one `conductor/tracks/...` path added in this
evidence resolves to this track's directory, which exists). The primary agent
must still run it to close AC-6.

## 4. Requirement and acceptance mapping

| ID | Finding | Evidence in this phase |
| --- | --- | --- |
| FR-1 | F1, F6 | The boot order is now asserted from the real entry point (`boot wiring > starts install capture before the game is constructed`, red-then-green above), and TDD §3.1 names `initInstallPrompt()` in the pre-`new Phaser.Game` sequence that §5.5 points at. |
| FR-3 | F4 | PRD §1.4 and §4.10 no longer promise the row disappears for the page's life; both now state the next-open behaviour, the fresh-offer return, and the unchanged row already on screen. |
| FR-4 | F5 | The PRD's iOS clause now matches the three conditions in `getInstallUiState()` (`pwaInstall.ts:37`), including running standalone. |
| FR-5 | F3 | The AC-5 case covers the read route (`getState()`) and both callback routes (`beforeinstallprompt`, `appinstalled`) as well as capture, spend and teardown, with the storage spy asserted last. |
| AC-4 | F5 | Same clause edit; the iOS/installed/standalone expectations in the suite are untouched. |
| AC-5 | F3 | Same widened case; no storage read or write is reachable on any of the routes it now exercises. |
| AC-6 | F7, §3 | `verification/phase-3.md` now names a commit that exists (`dd1099c9`) and the count that the range actually measures (286), and this file carries the layer-by-layer table. |
| (accurate comment) | F2 | `getInstallPromptTracker()`'s JSDoc names the lazy path that exists. |

## 5. Deviations

1. **Import depth.** The brief's R1.T1 text writes
   `import mainSource from "../../../main.ts?raw";`, but from
   `src/__tests__/utils/` three levels up is the repository root, where there is
   no `main.ts`. The brief also says to check the depth against the file's own
   location and match `shellOwnership.test.ts` (`src/__tests__/game/art/` reaching
   `src/` with `../../../`). Applied literally here that is `../../main.ts?raw`,
   which is what the file uses. Mechanism unchanged, path corrected.
2. **One new test case, not two.** R1.T3 widens the existing AC-5 case rather
   than adding a case, as the brief and review both require, so the suite lands
   on 2631 rather than the anticipated 2632. Nothing was dropped to get there.
3. No file outside `Touches` was modified.

## 6. Blockers

- `node scripts/validate-docs.js` - **permission denied** to this subagent, the
  same denial Phase 3 hit. Not retried under another spelling or route. The
  primary agent must run it; the expected result is 5 passed / 0 failed.

## 7. Out of scope, confirmed untouched

- No production behaviour changed: `src/utils/pwaInstall.ts` differs only in a
  JSDoc block, and `src/main.ts` is byte-identical to the phase base.
- No opportunistic refactor, no reflowing of prose outside the corrected
  sentences, no change to `plan.md`, `spec.md`, `metadata.json`, `index.md`,
  `conductor/tracks.md` or `review.md`.

## Primary verification

Base `ae5cc522`, commits `59c5468c fix(pwa): pin install capture to boot order and correct the install docs` and `77964436 docs(conductor): verify phase R1 of install prompt lifetime`. The only reported blocker was the docs layer, denied to the subagent.

| Layer | Command | Exit | Note |
| --- | --- | --- | --- |
| 1 | `git status --porcelain` | clean | `src/main.ts` restored: `git diff ae5cc522..HEAD -- src/main.ts` is empty |
| 2 | `git diff --name-only ae5cc522..HEAD` | 0 | 6 files: 5 in `Touches` (test, adapter, PRD, TDD, phase-3 evidence) + `phase-R1.md` |
| 3 | `pnpm check` | 0 | two pre-existing findings only |
| 4 | `pnpm typecheck` | 0 | |
| 5 | `pnpm test -- --run` | 0 | 121 files / 2631 tests (+1) |
| 6 | `pnpm test:coverage` | 0 | 97.99 / 92 / 96.69 / 98.74 |
| 7 | `pnpm build` | 0 | |
| 8 | `node scripts/validate-bundle.js` | 0 | phaser 1342.6 kB, shell `index-D_wN43lj.js` 138.2 kB - unchanged, as expected from a comment-only production edit |
| 9 | `node scripts/validate-pwa.js` | 0 | 16 passed |
| 10 | `node scripts/validate-docs.js` | 0 | 5 passed - the layer the subagent could not run |

### Findings closed

| Id | Severity | Verification of the fix |
| --- | --- | --- |
| F1 | Medium | New case "starts install capture before the game is constructed" imports `main.ts?raw` and asserts `indexOf("initInstallPrompt(")` precedes `indexOf("new Phaser.Game(")`. Red-proven by moving the call below the game: `expected 1288 to be greater than 1314`. `src/main.ts` is byte-identical to the base afterwards. |
| F2 | Low | The JSDoc no longer claims a Hub-only host; it names the real lazy case (a test that builds the panel first). |
| F3 | Low | The AC-5 case now asserts `getState()` is `hidden` and invokes the `appinstalled` listener before the five storage-method assertions, so both a read and the second callback route are under the spy. |
| F4 | Medium | PRD §1.4 and §4.10 now say the next open has no row, it returns only on a fresh browser offer, and the row already on screen does not change. Matches `InstallRow`'s single read and the re-arm path. |
| F5 | Low | Both iOS clauses now carry the third condition ("neither installed nor running standalone"), matching `getInstallUiState()`. |
| F6 | Low | TDD §3.1 names `initInstallPrompt()` and why it runs first, so §5.5's cross-reference is complete. |
| F7 | Low | The phase-3 evidence cites `dd1099c9` and 286 insertions. |

### Independent checks

- The `?raw` import resolves to `src/main.ts` from `src/__tests__/utils/` (`../../main.ts?raw`), and the assertion reads the shipped entry point rather than a copy of it. A second `new Phaser.Game(` occurrence would not weaken the check, because the first init must precede the first game.
- The AC-5 additions are insertions, not rewrites: the five storage assertions still run last, so the case proves "no read and no write across capture, spend, the state read and both callbacks".
- The PRD's new wording is the honest one: a parent who dismisses the browser dialog sees the button until the panel closes. The old sentence promised otherwise.
- No test was weakened and no expectation moved. The suite grew by exactly one case; the coverage table and bundle hash are unchanged.

### Accepted deviations

1. **Import depth corrected** from the brief's `../../../main.ts?raw` to `../../main.ts?raw` - the brief's path would have resolved outside `src/`. The mechanism is unchanged.
2. **2631 tests, not the anticipated 2632**, because R1.T3 extended the existing AC-5 case instead of adding a second one. Better: the storage assertions and the read-path assertions now sit in one case that cannot drift apart.

# Phase 1 Verification — Author the Help content and overlay

- **Track:** `20261127-parent-help-overlay`
- **Phase:** 1 — Author the Help content and overlay
- **Date:** 2026-11-27
- **Branch:** `feat/20261127-parent-help-overlay`
- **Phase base:** `42ba2a9507453ecefdc5b1e730478dfa5e0644bd`
- **Implementation commit:** `42a432c1864e60fc3fce6a36d4f4af444a072750` (abbreviated `42a432c1`)
- **First evidence commit:** `a7dc034713899eee84d51b5cdf1d86e9ad7f65f5` (abbreviated `a7dc0347`)
- **Test-repair commits:** `b06b30f2c81e340ed945cd66332522d82b3ac883` (expanded tests) and `263334bc` (assertion repair)
- **Evidence-repair commit:** `17f4d01e` (post-repair failure record)
- **Living-truth commit:** `4539a401` (`README.md`, `docs/TDD.md`, `docs/perf-baseline.md`)
- **Head at this rewrite:** `4539a401` (abbreviated `4539a401`; this evidence file is committed separately)
- **Result:** `verified` — the final primary exact configured gate passed every layer after the assertion repair and living-truth refresh. Settings integration, browser journey, visual inspection, and Parent Help feature documentation remain later-phase scope.

## Scope and changes

Phase 1 added four allowlisted files: `src/components/settings/helpContent.ts`, `src/components/settings/HelpOverlay.ts`, `src/__tests__/components/settings/helpContent.test.ts`, and `src/__tests__/components/settings/HelpOverlay.test.ts`. No Settings entry, E2E bridge, fixture, asset, dependency, or storage file was changed.

Follow-up history:

- `b06b30f2` changed only `src/__tests__/components/settings/HelpOverlay.test.ts` and this evidence file: added a test opening every topic card with exact `topicId`, `topicIndex`, `title`, and drawn `lines`; added a full eight-topic Next walk and Previous return with boundary checks; strengthened the read-only test with spies installed inside the test body, after `beforeEach`'s `localStorage.clear()`.
- `263334bc` repaired two test-only assertion defects: `expect(state?.controls.next).toBe(isLast ? null : expect.anything())` in the traversal test and the same `toBe(expect.anything())` pattern on the Previous-walk `controls.prev` check were replaced with explicit `toBeNull()` / `not.toBeNull()` branches. Overlay behavior was not at fault and no production file was touched.
- `17f4d01e` recorded gate run B's unit-layer failure and the exact 3,478-test total in this evidence file.
- `4539a401` refreshed the current living suite/coverage figures in `README.md`, `docs/TDD.md`, and `docs/perf-baseline.md` from the primary's measured output, and rewrote the perf-baseline live-figures header so it no longer describes the current tree as checkpoint `74c1618e`. Historical release notes and dated historical measurements were left untouched.

No source or test file was changed by this final follow-up; only the three living docs and this evidence file are updated.

## Verification commands

**Exact configured gate (run unchanged three times by the primary; not rerun, split, rephrased, or worked around in any follow-up):**

`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`

- **Gate run A** — head `42a432c1`, before the expanded tests. Exit **1**; every layer passed except `node scripts/validate-docs.js` (4 passed / 1 failed) on stale living counts (159 files / 3,454 tests documented).
- **Gate run B** — head `b06b30f2`, after the expanded tests. Exit **1 at the unit/component layer**, before coverage or any validator ran: Vitest reported 160 files passed / 1 file failed and 3,477 tests passed / 1 failed, **3,478 total**. Single failure: `HelpOverlay.test.ts` → "walks Next through all eight topics and Previous back to the first", line 162 — asymmetric matcher inside `toBe`. Both matcher defects were repaired in `263334bc`.
- **Primary independent verification after the repair** (not an exact-gate run):
  - `pnpm exec vitest run src/__tests__/components/settings/HelpOverlay.test.ts` — exit **0**, 1 file / **13 tests passed**.
  - `pnpm test:coverage` — exit **0**, **161 files / 3,478 tests passed**; overall statements **97.09 %**, branches **91.06 %**, functions **96.39 %**, lines **98.21 %**; `HelpOverlay.ts` **96.09 % statements / 94.44 % branches / 95.23 % functions / 96 % lines**.
- **Gate run C (final)** — head `a573a344`, after the assertion repair and living-truth refresh. Exit **0**. Biome checked 382 files; app/E2E TypeScript passed; Vitest passed **161 files / 3,478 tests**; coverage was **97.09 % statements / 91.06 % branches / 96.39 % functions / 98.21 % lines**; Vite built 493 modules with shell `index-DF9s1m1B.js` at 196.3 kB via the bundle guard (200.98 kB printed, 51.54 kB gzip), 53 chunks and 65 PWA entries / 1880.45 KiB; module-size reported zero warnings; textures passed; PWA passed 16/0; docs passed 5/0. Only the pre-existing Phaser chunk-size advisory appeared.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Style | `pnpm check` | 0 (run B) | Biome: 382 files, clean; no fixes applied. |
| Types | `pnpm typecheck` | 0 (run B) | App and E2E TypeScript projects clean. |
| Unit/component | `pnpm test -- --run` | **1 (run B)** | 160 files passed / 1 failed; 3,477 passed / 1 failed, 3,478 total — invalid matcher, repaired in `263334bc`. Focused recheck: 13/13 passed; full coverage run: 161 files / 3,478 tests passed. |
| Coverage | `pnpm test:coverage` | 0 (primary post-repair run) | 97.09 % statements / 91.06 % branches / 96.39 % functions / 98.21 % lines overall; `HelpOverlay.ts` 96.09 / 94.44 / 95.23 / 96. Not reached in gate run B. |
| Build | `pnpm build` | 0 (run A; unchanged since) | 493 modules; shell `index-DF9s1m1B.js` 200.98 kB printed / 196.3 kB via bundle guard, 51.54 kB gzip; 53 chunks; PWA 65 entries / 1880.45 KiB. No production code changed after this build. |
| Bundle | `node scripts/validate-bundle.js` | 0 (run A) | Shell entry within 200 kB guard. |
| Module size | `node scripts/validate-module-size.js` | 0 (run A) | Zero warnings; `HelpOverlay.ts` is 378 physical lines, below the 400-line warning threshold. |
| Textures | `node scripts/validate-textures.js` | 0 (run A) | Passed. |
| PWA | `node scripts/validate-pwa.js` | 0 (run A) | 16 passed / 0 failed. |
| Docs | `node scripts/validate-docs.js` | **1 (run A only)** | 4 passed / 1 failed: 16 stale living-count findings. Living figures refreshed in `4539a401`; the validator will be rerun by the primary in the final exact chain, so no docs pass is claimed here. |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Parent Help entry and journey from Settings | No Settings entry or E2E publication in this phase. | **Pending Phase 2** |
| AC-2 | Close/backdrop/Settings lifecycle and repeated cycles | `HelpOverlay.test.ts`: `open` idempotence, `close` bucket isolation, ✕ and backdrop close, null state when closed. Settings integration is not in scope. | Partial — unit/component covered; Settings lifecycle Phase 2 |
| AC-3 | Eight ordered menu topics and correct detail content | `helpContent.test.ts` exact ids/order; `HelpOverlay.test.ts` opens every card and checks exact `topicId`, `topicIndex`, `title`, and drawn `lines`; full suite passed in the post-repair coverage run. | Covered |
| AC-4 | Parental lock, profiles and play-time copy | `helpContent.test.ts` pinned claims. | Covered |
| AC-5 | Progress/adaptive copy | `helpContent.test.ts` pinned claims, thresholds and snapshot-only Overview. | Covered |
| AC-6 | Privacy/local-data copy | `helpContent.test.ts` pinned claims and banned-claim check. | Covered |
| AC-7 | Backup/restore copy | `helpContent.test.ts` pinned JSON, Merge/Replace, checksum and reload claims. | Covered |
| AC-8 | Diagnostics, install/offline and updates copy | `helpContent.test.ts` pinned claims for all three topics. | Covered |
| AC-9 | Previous/Next/Back navigation and inactive boundaries | `HelpOverlay.test.ts` full eight-topic Next walk and Previous return with explicit nullness checks; Back to topics; 13/13 focused tests pass. | Covered |
| AC-10 | Structural layout/hit-area/wrap checks | `HelpOverlay.test.ts` 2×4 grid, 96px cards and hit areas, 420–430px wraps, title/footer points. Real desktop and narrow-viewport visual inspection is out of scope. | Partial — structural only; visual inspection Phase 2 |
| AC-11 | Read-only side-effect checks | `HelpOverlay.test.ts` strengthened spy test covering storage reads/writes/clear, `fetch`, `window.open`, `URL.createObjectURL`, anchor `click`, and media `play`; full suite passed post-repair. | Covered |
| AC-12 | Full feature acceptance | Unit/component/static portion verified; browser journey, Settings integration and final green gate outstanding. | **Partial** |
| AC-13 | Parent Help feature documentation and release figures | Living-count repair is gate-driven truth maintenance, not completion of Parent Help feature docs. Feature docs remain Phase 3. | **Pending Phase 3** |

## Evidence paths

- `src/components/settings/helpContent.ts`
- `src/components/settings/HelpOverlay.ts`
- `src/__tests__/components/settings/helpContent.test.ts`
- `src/__tests__/components/settings/HelpOverlay.test.ts`
- `README.md`
- `docs/TDD.md`
- `docs/perf-baseline.md`
- `conductor/tracks/20261127-parent-help-overlay/verification/phase-1.md`

## Deviations

- **Process deviation:** the phase executor split the exact chained verification command after its own shell rejected the `&&` chain, even though the brief forbade splitting or working around it. The primary subsequently ran the exact chain unchanged (runs A, B and C); no follow-up reran or split the chain.
- **Test-only matcher defect (run B):** the new traversal test used `expect(...).toBe(isLast ? null : expect.anything())`, which Vitest rejects as an asymmetric matcher inside `toBe`; the same pattern appeared on the Previous-walk boundary assertion. Both were replaced with explicit nullness assertions in `263334bc`. No production defect was involved, so no source file was touched.
- The stale living suite counts in `README.md`, `docs/TDD.md`, and `docs/perf-baseline.md` were left untouched until the primary supplied exact measured figures; the refresh is in `4539a401`, and final exact gate run C confirmed `validate-docs.js` at 5 passed / 0 failed.

## Notes

- Result is `verified`: final exact gate run C passed every layer. Settings integration, browser journey, visual inspection, and AC-13 remain later-phase scope.
- The focused 13-test pass and full 161-file / 3,478-test coverage pass were independent verification before the final exact-gate run. Gate run C then confirmed the complete chain, including docs 5/0. Browser journey, Settings integration, visual inspection, and AC-13 remain incomplete by design for Phase 1.
- The build figures remain the measured Phase 1 run A build; no production code changed after that build.
- AC-1, the browser-journey portion of AC-12, and AC-13 remain incomplete by design for Phase 1.

## Primary verification

- **Verdict:** accepted.
- **Final exact gate:** exit 0 on `a573a344`; 382 Biome files, app/E2E TypeScript clean, 161 files / 3,478 tests, coverage 97.09 / 91.06 / 96.39 / 98.21, 493-module build, shell 196.3 kB, module-size zero warnings, textures passed, PWA 16/0, docs 5/0.
- **Scope:** the phase diff contains only the four approved source/test files, the three authorized living-document files, the Phase 1 plan authorization, and this evidence file. No Settings integration, E2E bridge, browser journey, asset, dependency, schema, storage, or network file changed.
- **Acceptance:** AC-3–AC-9 and AC-11 are covered; AC-2 and AC-10 are structurally covered with Settings/visual portions deferred to Phase 2; AC-12 remains partial; AC-1 and AC-13 remain pending their planned phases.
- **Deviations:** the executor's command splitting and the two test-only matcher defects are recorded above. The stale living-count failure was repaired from primary-measured output; historical evidence was preserved.
- **Checkpoint:** `(recorded at acceptance)`.

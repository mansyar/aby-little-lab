# Review — 20261127-parent-help-overlay

- **Track:** 20261127-parent-help-overlay (Add a parent Help overlay explaining controls, data, backup, and play-time)
- **Type:** feature / medium
- **Branch:** `feat/20261127-parent-help-overlay`
- **Range:** `f96979fca6fc0a08335cb83bd91fb8d3085875a3..9fb8c01c702563a4c5987ad371102b0df73cdb92`
- **Date:** 2026-11-28T01:46:01+11:00
- **Verdict:** PASS

## Summary

Parent Help overlay meets every FR/NFR/AC: static offline parent-gated read-only Help with eight topics, persistent two-page Settings entry, null-boundary E2E contract, exact gate exit 0, genuine four-engine journey 8/8 with unchanged saves, readable media, and docs 5/0. Round 1 returned PASS WITH FINDINGS (F1/F2, both Low); round 2 confirms both resolved with no regression.

## Verification

| Layer | Command | Result | Evidence |
|---|---|---|---|
| static | `pnpm check` | pass | Biome 385 files clean |
| types | `pnpm typecheck` | pass | app + E2E `tsc` clean |
| unit | `pnpm test -- --run` | pass | 162 files / 3492 tests |
| coverage | `pnpm test:coverage` | pass | 97.14/91.01/96.46/98.23 vs 95/88/85/90 gate |
| build-artifact | `pnpm build` + bundle/module/texture/PWA validators | pass | 496 modules; shell 190.32 kB printed / 48.42 kB gzip (185.9 kB guard pass); parent-help 19.40 kB / 7.37 kB; module-size zero warnings; textures pass; PWA 16/0, 66 entries / 1889.89 KiB |
| documents | `node scripts/validate-docs.js` | pass | 5 passed / 0 failed (primary + reviewer rerun) |
| browser-journey | four-project `help.spec.ts` | pass | 8/8, unchanged saves, zero retries on fresh build |
| media/whitespace | capture + `diff --check` | pass | 844x390 topics + backup detail readable; whitespace clean |

## Requirements

| ID | Status | Evidence |
|---|---|---|
| FR-1..FR-13 | covered | Header entry both pages; close/backdrop/Settings lifecycle; 2x4 menu with eight pinned topics; lock/play-time/adaptive/privacy/backup/diagnostics/install/update copy; layout targets; read-only spies + unchanged saves |
| NFR-1..NFR-6 | covered | Static content, no dependency/asset/schema/network change; targets/feedback; shared gesture helper (file under threshold); guards preserved; full gate + journey; no new seam or claim |
| AC-1..AC-13 | covered | Entry/close/traversal/copy/wrap/targets/side-effects/layers/docs truth; journey + gate + media confirm AC-12; PRD/TDD/README/changelog/device-checklist confirm AC-13 |

## Findings

### Fixed in round 1

- **F1 (Low):** `gridBuilder.ts` grew to 461 lines (module-size warning). Fixed: shared `wireTileGesture` ownership helper + consolidated list/counter/lock blocks; file ends at line 399; gate reports zero warnings; new tests prove one-owner wiring per grid.
- **F2 (Low):** Disabled Previous/Next controls stayed interactive with press feedback. Fixed: `drawControl` gates interactivity on the enabled flag; disabled controls render greyed with null E2E point and no listener; zero-listener assertion added; enabled controls unchanged.

### Round 2

No findings.

## Overrides

None.

## Plan compliance

Phases 1–3 plus R1 match scope, Touches, and checkpoints (`a8ec01d5` / `99ff5572` / `d1db4cb1` / `d9f450d4`, acceptance `9fb8c01c`, integrated `e7c7bf93`). Authorized deviations recorded in evidence: executor shell denials (primary ran exact commands), test-only repairs, gesture-ownership + `e2eOpen()` lifecycle guards, parent-help chunk split, roster inclusion, living-truth refreshes, one-line Biome fix. No unrecorded scope expansion. Historical records untouched.

## Out of scope

Reviewer-model pin `c45954ad` rides the branch per user direction and is excluded from product review. Retention unexecuted; physical-device and longitudinal claims explicitly unmade.

## Debt

None accepted. `gridBuilder.ts` helpers could be unit-tested in isolation later, but current grid-level tests cover all three builders.

## Doc sync

Updated: PRD §4.12 + Contents, TDD Help modules/lifecycle/E2E/boundaries/regressions, README parent docs, dated changelog entry, focused device-checklist Help rows, living figures at measured 3492 truth. Historical rows, release notes, and archived evidence untouched.

## History

| Round | Verdict | Findings fixed | Findings accepted |
|---|---|---|---|
| 1 | PASS WITH FINDINGS | 0 | 0 |
| 2 | PASS | 2 | 0 |

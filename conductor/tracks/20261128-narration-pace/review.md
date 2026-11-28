# Review: Add a parent control for narration pace

- **Track:** `20261128-narration-pace`
- **Type:** `feature`
- **Branch:** `feat/20261128-narration-pace`
- **Range:** `effc18fb99313d8d915d706fea185f6e528d916b..f696c1cc`
- **Date:** `2026-11-28`
- **Verdict:** `PASS WITH FINDINGS`

## Summary

Pace presets, speech wiring, per-profile persistence, the Settings control, boot/switch application, and backup carriage all match the spec with full unit evidence (165 files / 3,558 tests green). The reviewer returned two Low findings only: a misleading merge comment and a normalize-on-write inconsistency. Strict mode requires both fixed before the PR; they are mechanical and go to Phase R1.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | 393 files clean |
| typecheck | `pnpm typecheck` | pass | app + e2e clean |
| test | `pnpm test -- --run` | pass | 165 files / 3,558 tests |
| coverage | `pnpm test:coverage` | pass | stmts 96.91 / branches 90.23 / funcs 96.22 / lines 98.06 (gates 90/85/88/95) |
| build | `pnpm build` + `validate-bundle.js` + `validate-module-size.js` + `validate-textures.js` + `validate-pwa.js` + `validate-docs.js` | pass | 501 modules; entry 190.3 kB; 3 warn-only module notes; textures/PWA/docs green |

Browser suite: `pnpm exec playwright test --list` shows 60 tests / 23 files, no errors; the new `settings-pace` journey is written but CI-authoritative (chip cycling + reload persistence covered by SettingsPanel unit tests).

Full evidence: `conductor/tracks/20261128-narration-pace/verification/integrated.md`.

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P2.T1 | `SettingsPanel.test.ts`, `settings-pace.spec.ts` (CI) | covered |
| FR-2 | P1.T1 | `narrationPace.test.ts`, `speech.test.ts` | covered |
| FR-3 | P1.T2 | `storage.test.ts`, `SettingsPanel.test.ts`, `bootScene.test.ts` | covered |
| FR-4 | P2.T2 | `SettingsPanel.test.ts` | covered |
| FR-5 | P1.T2 | `speech.test.ts` | covered |
| NFR-1 | P1.T2 | additive optional field, no schema bump | covered |
| NFR-2 | P2.T1 | no assets in diff, textures green | covered |
| NFR-3 | P1.T1 | rate-table test | covered |
| AC-1 | P2.T1 | `SettingsPanel.test.ts`, `speech.test.ts` | covered |
| AC-2 | P1.T1 | `speech.test.ts` | covered |
| AC-3 | P1.T2 | `storage.test.ts`, `bootScene.test.ts` | covered |
| AC-4 | P2.T2 | `SettingsPanel.test.ts` | covered |
| AC-5 | P1.T2 | `narrationPace.test.ts`, `speech.test.ts` | covered |

## Findings

### Critical

- none

### High

- none

### Medium

- none

### Low

- **F1 — Merge comment misstates the pace model**
  - **File:** `src/utils/backupMerge.ts:150-152`
  - **What:** Comment calls pace "a device setting" like the avatar or daily limit; pace is a per-profile preference (FR-3/FR-4).
  - **Why:** No validity impact (the line normalises, FR-4 holds), but it rationalises discarding the incoming profile's pace on same-id merge without a spec basis.
  - **Fix:** Reword to the actual policy: pace stays with this device on merge (local wins, normalised); replace installs the incoming save, so fresh-device restore reproduces the backed-up pace.
  - **Requirement:** FR-4
  - **Test gap:** none
- **F2 — Setter persists the raw pace but normalises only the in-memory copy**
  - **File:** `src/utils/storageProfiles.ts:117-127`
  - **What:** `setActiveProfileNarrationPace` stores the raw argument and lets `setNarrationPace` normalise only memory.
  - **Why:** No reachable divergence today (valid callers, re-normalising readers), but store and memory should agree by construction.
  - **Fix:** `const next = normalizeNarrationPace(pace)`; store `next` and pass `next` on.
  - **Requirement:** FR-3
  - **Test gap:** Unit test passing an unknown pace string and asserting the stored profile reads back Gentle.

## Overrides

- none

## Plan compliance

Both phases verified with Result/Checkpoint/Evidence; every `[x]` task implemented and evidenced; diff stays within the union of Touches plus reported deviations (all accepted at phase acceptance). No dropped tasks.

## Out of scope

- none

## Debt

- none (strict mode: both Low findings go to Phase R1, no deferrals)

## Doc sync

`pending` at review time; post-fix sync will confirm or update.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 2 | 0 |

# Integrated Verification - 20261024-overlay-hit-areas

- **Base:** `8fdbff91` (v1.21.4 master, docs: record the v1.21.4 deployed smoke)
- **Track init:** `7d7ace44` (conductor scaffold only)
- **Verified at:** `4b95f5d7` (code and docs HEAD `303bfe1d`)
- **Range:** 8 commits, 7 non-conductor files, +770 / -52

## What changed, per area

| Area | Change | Where |
| --- | --- | --- |
| PwaToast buttons | hand-written centre-negative rect -> `centredHitArea(BUTTON_WIDTH, BUTTON_HEIGHT)`; text at origin 0.5 keeps a 200x72 band centred on itself | `src/components/PwaToast.ts` + `PwaToast.test.ts` engine hits |
| Profiles Delete | `centredHitArea(TOGGLE_WIDTH, ROW_HEIGHT)` | `settings/ProfilesOverlay.ts` |
| Profiles play-time chip | `centredHitArea(TOGGLE_WIDTH / 2, ROW_HEIGHT)`; seam no longer closes the overlay | `settings/ProfilesOverlay.ts` + SettingsPanel progress/profile tests |
| Progress close + chevrons | `centredHitArea(TOGGLE_HEIGHT, TOGGLE_HEIGHT)` | `settings/ProgressOverlay.ts` |
| Progress avatar chips | band in image-local units `centredHitArea(96 / chipScale, ...)` so the live zone is 96x96 scene px (the engine's TransformXY divides taps by drawn scale); chip seam = accepted overlap, later chip wins | `settings/ProgressOverlay.ts` + `SettingsPanel.test.ts` (`engineHitsScaled`) |
| Docs | TDD rows for all three components + §5.7 paragraph name the helper and the two frames (origin cancellation; divide-by-scale for scaled images); PRD §5.2 gains the app-wide framing rule and the second accepted overlap | `docs/TDD.md`, `docs/PRD.md` |

## Gate at the verified head

| Layer | Exit | Reading |
| --- | --- | --- |
| `pnpm check` | 0 | two pre-existing findings only |
| `pnpm typecheck` | 0 | clean |
| `pnpm test -- --run` | 0 | 121 files / 2648 tests (+8 over the track-start 2640), re-run at `4b95f5d7` |
| `pnpm test:coverage` | 0 | 97.98 / 91.9 / 96.71 / 98.76 |
| `pnpm build` | 0 | 343 modules, precache 54 entries (1726.08 KiB) |
| `node scripts/validate-bundle.js` | 0 | shell `index-BdGRHjBx.js` 138.4 kB <= 200 kB |
| `node scripts/validate-pwa.js` | 0 | 16 passed |
| `node scripts/validate-docs.js` | 0 | all checks passed (docs layer denials closed by the primary in both phases) |

## Cross-phase interaction review

1. **Frames are frozen, not just moved.** Phase 1 lands every band in the
   engine frame; commit-wise nothing later re-touches any of the six sites;
   the phase-2 docs describe exactly what phase 1 installed (checked line by
   line in `verification/phase-2.md`, "Document claims against the code").
2. **The seam tests survive the docs phase.** Test suite and coverage are
   byte-identical across phase 2 (docs-only); the chip seam and wrong-profile
   cases remain green mutations of the shipped helpers.
3. **The scale-compensation is pinned by arithmetic**, not by trusting Phaser
   reading: `config.hitArea.width * scale` close to `96` in the chip test,
   plus `engineHitsScaled` modelling both engine steps for behavioural probes.
4. **No test weakened.** changed_expectations empty in both phase reports;
   existing assertion sites untouched (executor reports + primary diff read).
5. **Spec correction carried.** AC-3's "whole visible label" over-promise is
   corrected in spec.md (Correction (pre-review)) and the honest guarantee -
   right-third aim point live, seam never closes - is what the code test
   asserts.

## Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1 toast band | covered | PwaToast.test.ts origin-variation probes |
| AC-2 chip own-band/seam | covered | SettingsPanel.test.ts chip cases (incl. `engineHitsScaled`) |
| AC-3 chip aim, no close | covered (Clause corrected in spec) | dispatched pointerdown -> `setText("Play Time: 30m")`, backdrop intact |
| AC-4 nothing else moves | covered | object-derived rounds; no drawn geometry change; suite otherwise byte-stable |
| AC-5 other rows keep their jobs | covered | handler-free diff, press feedback on same objects |
| AC-6 gate + docs | covered | gate table above; TDD rows; PRD 5.2 |

## Residual risk

- The overlays' visual cards (68 px) still lap the 56-96 px bands - same
  trade the Settings rows record; the seam ownership is draw order.
- Red proofs for the five text sites surface as
  `expected undefined to be true` because the un-fixed config carries the
  mocked callback - the mutation check in `verification/phase-1.md`
  (expected 204 to be 200) is the proof the suite observes the real config.
- A changed shell fingerprint (`index-BdGRHjBx.js`) is import churn from
  `import type Phaser`; gate-normal.

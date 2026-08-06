# Specification — v1.6.0 Release Execution

**Track ID:** `release-1.6.0_20260806` · **Type:** Chore · **Status:** new

## Overview

Ship the accumulated post-v1.5.0 backlog as **v1.6.0**: UI/UX Hardening, Shape Sorter Variety & Multi-Round, TTS & Speaker Button Fix, and the full 142-asset SVG Visual Polish. Execute the standard release process (version bump → tag → release branch + PR → merge to master → auto-deploy → verification) plus the full device-testing checklist execution, including the pending v1.5.0 rows.

## Background — Unreleased Delta (115 commits since `v1.5.0` tag)

| Track | Content |
|---|---|
| **UI/UX Hardening** (08-05) | Baloo 2 variable font + typography presets; 11 storybook tile icons; speaker replay button across speech games; settings readability; win-celebration polish; resume-audio-on-hub-touch; AlphabetScene preloaded SVG textures; PopFreeze "Zzz" glyph; iPad orientation-crash fix (#12) |
| **Shape Sorter Variety & Multi-Round** (08-06) | Shape pool 6 → 18; 12 new cutout SVGs (preload 118→142); 3 rounds × 3 shapes via `generatePlaythrough(roundCount)`; progress dots; win gated to final round |
| **TTS & Speaker Button Fix** (08-06) | Frame-based hit areas for speaker + avatar (regression helper `src/__tests__/helpers/hitTest.ts`); iOS TTS unlock on first gesture; cancel/speak race hardening (100 ms deferral) |
| **SVG Visual Polish** (08-06) | All 142 SVGs redesigned to "Storybook Flat" quality bar (flat fills, #2D3748 4–6px outlines, soft-vibrant palette); 9 phases + 2 user-feedback rounds; letters/numerals **reverted** to Arial text versions (user decision, Phase 9d); `docs/SVG_STYLE.md` + contact-sheet renderer added |

## Goals

- **FR-1 — Version bump to 1.6.0** via `npm version 1.6.0 --no-git-tag-version` on the release branch; app-version footer reflects it automatically (`__APP_VERSION__` Vite define).
- **FR-2 — Release branch + PR**: create `release/v1.6.0` from master; run all quality gates on it; open PR → CI "Quality Gates" must pass and be merge-blocking before merge to master.
- **FR-3 — Tagged release**: create annotated tag `v1.6.0` on the release commit; pushing master triggers the Coolify auto-deploy webhook (Bearer token via `$COOLIFY_TOKEN` secret).
- **FR-4 — Release notes**: create `docs/release-notes-v1.6.0.md` following the template (What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering the four tracks.
- **FR-5 — Docs sync**: update `docs/device-testing-checklist.md` (v1.6.0 rows + carried v1.5.0 rows); verify `conductor/tech-stack.md`, `conductor/product.md`, `docs/TDD.md` reflect the current state (patch real gaps only).
- **FR-6 — Deployment verification**: confirm CI run green, served `index-*.js` hash matches local build, `/sw.js` + manifest 200, footer shows v1.6.0, and boot → hub → Shape Sorter → sticker flow works on the live URL `https://aby-little-lab.ansyar-world.top/`.
- **FR-7 — Device testing**: execute the full checklist (iPad / Android tablet / iPhone / Android phone) against the live URL; record results in `docs/device-testing-checklist.md` (execution-record format used for v1.2.0–v1.4.0); resolve or document any found issues.

## Non-Functional Requirements

- **NFR-1**: Quality gates pass before merge, in CI order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`.
- **NFR-2**: Test suite stays green at 979/979 or higher.
- **NFR-3**: No source-code feature changes beyond release work — this is a ship-it track. Defects found during device testing become a documented decision: fix in a follow-up track (out of scope) or hotfix in this track with explicit user approval (max 2 fix attempts per workflow).

## Acceptance Criteria

1. `v1.6.0` tag exists on master; CI deploy succeeded; live site serves the new build (hash match verified).
2. `docs/release-notes-v1.6.0.md` written, status FINAL at close, template-compliant.
3. Device-testing checklist has an executed v1.6.0 record (incl. carried v1.5.0 rows) with results and triage.
4. Conductor artifacts: spec/plan/metadata archived; registry updated; track marked complete.

## Out of Scope

- New features, gameplay changes, or asset redesigns (unless a device-testing defect is explicitly approved as a hotfix).
- Cloud sync, analytics, or roadmap features.
- Changes to the SVG style direction (letters/numerals stay Arial per the Phase 9d revert decision).

## References

- `docs/release-checklist.md` (release process), `docs/device-testing-checklist.md`, `docs/release-notes-v1.5.0.md`, `conductor/workflow.md` (Deployment Workflow), `conductor/tracks.md`.

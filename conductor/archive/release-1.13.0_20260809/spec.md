# Specification — v1.13.0 Release Execution

**Track ID:** `release-1.13.0_20260809` · **Type:** Chore · **Status:** new

## Overview

Ship **Game 15 — Color Match**, **Game 16 — Add It Up**, and **Performance & Bundle Hardening** as **v1.13.0**. Execute the standard release process (release branch + version bump → docs → gates → tag → PR → merge to master → Coolify auto-deploy → live verification), mirroring the v1.12.0 release-track pattern per `docs/release-checklist.md`. Device testing is **user-led and async** (user executes on device classes after the release; conductor records results when provided).

## Background — Unreleased Delta

| Source | Content |
|---|---|
| **`master` since `v1.12.0`** (tag at `5fd54d4`, 2026-08-08) | **Game 15 — Color Match** (`colorMatchLogic.ts` + tests, `ColorMatchScene.ts`, `tile_color_match.svg`, `sticker_color_match.svg`; preload 152 SVGs; Hub grid completes 5×3 with 15 tiles). **Game 16 — Add It Up** (`addItUpLogic.ts` + tests, `AddItUpScene.ts`, `plus.svg`/`equals.svg` cues, `tile_add_it_up.svg`, `sticker_add_it_up.svg`; preload 156 SVGs; Hub grid 5×3 + 1 with 16 tiles). **Perf & Bundle Hardening** (`vite.config.ts` rolldown codeSplitting isolating the Phaser vendor chunk; shell chunk 1,513 kB → 137.16 kB; `scripts/validate-bundle.js` wired into CI gates; coverage thresholds raised to lines 95 / stmts 90 / funcs 88 / branches 85; `docs/perf-baseline.md`; full suite 52 files / 1207 tests). All three tracks archived. |
| **Push status** | To be verified in Phase 1 (`git status --short --branch`, `origin/master..HEAD`). |
| **v1.12.0 status** | Released, deployed, device-tested — **all passed** on 4 device classes; release notes FINAL; no dangling docs. |
| **Explicit handoff** | `docs/device-testing-checklist.md` has an **Execution Record — v1.13.0** (perf rows: boot < 3 s, shell ≤ 200 kB + separate vendor chunk, game launch/return, PWA update flow, offline re-play) marked *"device-class execution pending — to run against the live URL as part of the v1.13.0 release execution"*. **Game 15/16 candidate rows do not exist yet — this track drafts them.** |
| **Not in this release** | **Parent Progress Insights** ships later as **v1.14.0** (draft notes exist at `docs/release-notes-v1.14.0.md`; explicitly declared as the next release after v1.13.0). v1.13.0 release notes must not cover it. |

## Goals

- **FR-1 — Baseline validation:** master contains all three tracks' code; quality gates green; working tree clean; push state recorded.
- **FR-2 — Version bump** 1.12.0 → 1.13.0 via `npm version 1.13.0 --no-git-tag-version` on `release/v1.13.0`; app-version footer reflects it automatically (`__APP_VERSION__` Vite define).
- **FR-3 — Release branch + tag + PR:** create `release/v1.13.0` from master; run all quality gates (incl. `validate-bundle.js`); create annotated tag `v1.13.0`; open PR → master (CI gates merge-blocking); merge pushes master → Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`).
- **FR-4 — Release notes:** create `docs/release-notes-v1.13.0.md` per template (What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering Games 15+16 and Perf/Bundle Hardening — DRAFT during Phase 3, FINAL at close. Carried known issues: cross-device progress/play-time sync (accepted), system-font letterforms (accepted). **Must not** reference Parent Progress Insights as shipped.
- **FR-5 — Docs sync:** update `docs/device-testing-checklist.md` — draft Game 15 (Color Match) + Game 16 (Add It Up) candidate rows into the v1.13.0 record (alongside the existing perf rows), result pending async user execution; update `docs/release-checklist.md` (Step 7m + Final Sign-Off). Patch real knowledge-doc gaps only (`conductor/tech-stack.md`, `conductor/product.md`, `docs/PRD.md`, `docs/TDD.md`, `README.md`).
- **FR-6 — Deployment verification:** CI run on master green; served `index-*.js` hash matches local `dist/`; `/sw.js` + `/manifest.webmanifest` return 200; Settings footer shows v1.13.0; live smoke: boot → hub (16 tiles, 5×3+1) → Color Match spot check (swatch + 2×2 grid, spoken prompt, 6 rounds) → Add It Up spot check (equation row + 4 answer cards, no speech) → Settings (footer) → hub, on `https://aby-little-lab.ansyar-world.top/`.
- **FR-7 — User-led device testing:** conductor drafts the full v1.13.0 checklist record (Game 15 rows + Game 16 rows + perf rows + carried rows); **user executes** on iPad / Android tablet / iPhone / Android phone against the live URL at their convenience and reports results; conductor records and triages them.

## Non-Functional Requirements

- **NFR-1:** Quality gates pass before merge, in CI order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js` → `node scripts/validate-bundle.js`.
- **NFR-2:** Test suite stays green at 1207/1207 or higher (52 files); coverage meets raised thresholds (lines 95 / stmts 90 / funcs 88 / branches 85).
- **NFR-3:** No source-code feature changes beyond release work — this is a ship-it track. Defects found during device testing become a documented decision: fix in a follow-up track (out of scope) or hotfix in this track with explicit user approval (max 2 fix attempts per workflow).

## Acceptance Criteria

1. `v1.13.0` tag exists on master; CI deploy succeeded; live site serves the new build (hash match verified); all three tracks' commits reach `origin/master`.
2. `docs/release-notes-v1.13.0.md` written, status FINAL at close, template-compliant; no dangling DRAFTs; v1.14.0 draft notes untouched (still pending its own release).
3. Device-testing checklist has a v1.13.0 record with Game 15 + Game 16 + perf rows drafted and (when the user reports) executed results and triage.
4. Conductor artifacts: spec/plan/metadata archived; registry updated; track marked complete.

## Out of Scope

- Parent Progress Insights (v1.14.0 — separate future release track).
- New features or gameplay changes (per-profile voices, locale selection, cloud sync — deferred/accepted).
- Exhaustive full-suite device regression — targeted Game 15/16 + perf rows + carried rows only (user decision).

## References

- `docs/release-checklist.md` (release process), `docs/device-testing-checklist.md`, `docs/release-notes-v1.12.0.md`, `docs/release-notes-v1.14.0.md` (draft), `docs/perf-baseline.md`, `conductor/archive/color-match_20260808/`, `conductor/archive/add-it-up_20260809/`, `conductor/archive/perf-bundle-hardening_20260809/`, `conductor/archive/release-1.12.0_20260808/` (pattern), `conductor/workflow.md` (Deployment Workflow), `conductor/tracks.md`.

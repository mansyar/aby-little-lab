# Specification — v1.11.0 Release Execution

**Track ID:** `release-1.11.0_20260808` · **Type:** Chore · **Status:** new

## Overview

Ship **Game 14 — Odd One Out** as **v1.11.0**. Execute the standard release process (release branch + version bump → docs → gates → tag → PR → merge to master → Coolify auto-deploy → live verification → device testing), mirroring the v1.6.0–v1.10.0 release-track pattern per `docs/release-checklist.md`.

## Background — Unreleased Delta

| Source | Content |
|---|---|
| **`master` since `v1.10.0`** (4a5f5c8) | Game 14 Odd One Out merged & pushed (`0bfa8e8`, 24 commits): `oddOneOutLogic.ts` (+21 tests, 97.22% stmts), `OddOneOutScene.ts` (+11 scene tests), integration (14th GameId, GAME_IDS backfill, 14 lazy loaders, preload 150 SVGs, Hub 14 tiles 5×3), 2 SVGs, docs synced, track archived |
| **v1.10.0 status** | Tag deployed and live, but release notes still DRAFT and verification PENDING (footer check, live smoke, device testing) — carried/folded into this track (see Phase 3) |
| **Explicit handoff** | Track `odd-one-out_20260808` — released per its spec; user approved v1.11.0 release track |

## Goals

- **FR-1 — Baseline validation:** master contains all Game 14 code (already merged/pushed `0bfa8e8`); quality gates green; CI Quality Gates run on the master push passes.
- **FR-2 — Version bump** 1.10.0 → 1.11.0 via `npm version 1.11.0 --no-git-tag-version` on `release/v1.11.0`; app-version footer reflects it automatically (`__APP_VERSION__` Vite define).
- **FR-3 — Release branch + tag + PR:** create `release/v1.11.0` from master; run all quality gates on it; create annotated tag `v1.11.0`; open PR → master (CI gates merge-blocking); merge pushes master → Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`).
- **FR-4 — Release notes:** create `docs/release-notes-v1.11.0.md` per template (What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering Game 14 — DRAFT during Phase 3, FINAL at close. Finalize the dangling v1.10.0 notes (DRAFT → FINAL with folded-verification note).
- **FR-5 — Docs sync:** add v1.11.0 record to `docs/device-testing-checklist.md` (targeted Game 14 rows + carried Game 13/v1.10.0 rows, since v1.10.0 device testing was never executed); patch real gaps only.
- **FR-6 — Deployment verification:** CI run on master green; served `index-*.js` hash matches local `dist/`; `/sw.js` + `/manifest.webmanifest` return 200; Settings footer shows v1.11.0; live smoke: boot → hub (14 tiles 5×3, row 3 = 4 left-aligned) → Odd One Out (6 rounds easy-first bands, spoken prompt + speaker replay, 3 identical + 1 distinct, correct flash/chime/dot-pop 700ms, wrong wiggle no penalty, sticker award, 3s win auto-return) → Game 13 spot check → hub, on `https://aby-little-lab.ansyar-world.top/`.
- **FR-7 — Targeted device testing:** execute the v1.11.0 checklist record (iPad / Android tablet / iPhone / Android phone — targeted Game 14 rows + carried rows) against the live URL; record results and triage.

## Non-Functional Requirements

- **NFR-1:** Quality gates pass before merge, in CI order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`.
- **NFR-2:** Test suite stays green at 1145/1145 or higher (48 files).
- **NFR-3:** No source-code feature changes beyond release work — this is a ship-it track. Defects found during device testing become a documented decision: fix in a follow-up track (out of scope) or hotfix in this track with explicit user approval (max 2 fix attempts per workflow).

## Acceptance Criteria

1. `v1.11.0` tag exists on master; CI deploy succeeded; live site serves the new build (hash match verified).
2. `docs/release-notes-v1.11.0.md` written, status FINAL at close, template-compliant; v1.10.0 notes finalized (no dangling DRAFT).
3. Device-testing checklist has an executed v1.11.0 record (targeted Game 14 rows + carried rows) with results and triage.
4. Conductor artifacts: spec/plan/metadata archived; registry updated; track marked complete.

## Out of Scope

- New features or gameplay changes (5+ card layouts, timed modes, new object art, per-band difficulty selection — deferred by the odd-one-out spec).
- Cloud sync, analytics, or roadmap features.
- Exhaustive full-suite device regression — targeted Game 14 checks + carried rows only (user decision).

## References

- `docs/release-checklist.md` (release process), `docs/device-testing-checklist.md`, `docs/release-notes-v1.10.0.md`, `conductor/archive/odd-one-out_20260808/spec.md`, `conductor/workflow.md` (Deployment Workflow), `conductor/tracks.md`.

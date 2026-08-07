# Specification — v1.8.0 Release Execution

**Track ID:** `release-1.8.0_20260808` · **Type:** Chore · **Status:** new

## Overview

Ship **Game 12 — First Sounds** as **v1.8.0**. Execute the standard release process (feature merge → release branch + version bump → docs → tag → PR → CI gates → merge to master → Coolify auto-deploy → live verification → device testing), mirroring the v1.6.0/v1.7.0 release-track pattern per `docs/release-checklist.md`.

## Background — Unreleased Delta

| Source | Content |
|---|---|
| **`feat/game-12`** (30 commits, unmerged) | Complete First Sounds game: pure logic (`firstSoundsLogic.ts` + tests), `FirstSoundsScene`, scene registry/preload/hub integration (12th tile), 2 new SVGs (`tile_first_sounds.svg`, `sticker_first_sounds.svg`), 1024/1024 tests green, Biome clean; docs synced (product.md, tech-stack.md, PRD.md, TDD.md, README); track archived |
| **Master since `v1.7.0`** (ec20d2d) | Conductor-only commits (gameplay-hardening + first-sounds archive/track-init) — no product changes |
| **Explicit handoff** | `conductor/archive/first-sounds_20260807/spec.md:97` — *"Release execution (follow-up release track, v1.8.0)"* |

## Goals

- **FR-1 — Feature merge:** PR `feat/game-12` → `master`; CI "Quality Gates" merge-blocking; verify master then contains all Game 12 code.
- **FR-2 — Version bump** 1.7.0 → 1.8.0 via `npm version 1.8.0 --no-git-tag-version` on `release/v1.8.0`; app-version footer reflects it automatically (`__APP_VERSION__` Vite define).
- **FR-3 — Release branch + tag + PR:** create `release/v1.8.0` from master; run all quality gates on it; create annotated tag `v1.8.0`; open PR → master (CI gates merge-blocking); merge pushes master → Coolify auto-deploy webhook (Bearer `$COOLIFY_TOKEN`).
- **FR-4 — Release notes:** create `docs/release-notes-v1.8.0.md` per template (What's New / Improvements / Bug Fixes / Known Issues / Installation / Feedback) covering Game 12 — DRAFT during Phase 3, FINAL at close.
- **FR-5 — Docs sync:** add v1.8.0 record to `docs/device-testing-checklist.md` (targeted Game 12 rows + carried rows); verify knowledge docs already synced by the Game 12 track — patch real gaps only.
- **FR-6 — Deployment verification:** CI run on master green; served `index-*.js` hash matches local `dist/`; `/sw.js` + `/manifest.webmanifest` return 200; Settings footer shows v1.8.0; live smoke: boot → hub (12 tiles) → First Sounds (6 phonics rounds, 4-letter choices with confusion guards, speaker replay 96px guard, speakLetter/speakWord TTS, sticker award, 3s win auto-return) → hub, on `https://aby-little-lab.ansyar-world.top/`.
- **FR-7 — Targeted device testing:** execute the v1.8.0 checklist record (iPad / Android tablet / iPhone / Android phone — targeted Game 12 rows + carried rows) against the live URL; record results and triage.

## Non-Functional Requirements

- **NFR-1:** Quality gates pass before merge, in CI order: `pnpm run check` → `CI=true pnpm test` → `pnpm run build` → `node scripts/validate-pwa.js`.
- **NFR-2:** Test suite stays green at 1024/1024 or higher.
- **NFR-3:** No source-code feature changes beyond release work — this is a ship-it track. Defects found during device testing become a documented decision: fix in a follow-up track (out of scope) or hotfix in this track with explicit user approval (max 2 fix attempts per workflow).

## Acceptance Criteria

1. `v1.8.0` tag exists on master; CI deploy succeeded; live site serves the new build (hash match verified).
2. `docs/release-notes-v1.8.0.md` written, status FINAL at close, template-compliant.
3. Device-testing checklist has an executed v1.8.0 record (targeted Game 12 rows + carried rows) with results and triage.
4. Conductor artifacts: spec/plan/metadata archived; registry updated; track marked complete.

## Out of Scope

- New features or gameplay changes (lowercase letters, reverse First Sounds mechanic, multi-language — explicitly deferred by the first-sounds spec).
- Cloud sync, analytics, or roadmap features.
- Exhaustive full-suite device regression — targeted Game 12 checks only (user decision).

## References

- `docs/release-checklist.md` (release process), `docs/device-testing-checklist.md`, `docs/release-notes-v1.7.0.md`, `conductor/archive/first-sounds_20260807/spec.md`, `conductor/workflow.md` (Deployment Workflow), `conductor/tracks.md`.

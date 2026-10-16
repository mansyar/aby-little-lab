# Spec: Docs & Housekeeping Refresh — 20-Game Suite Alignment

> **Track:** `docs-housekeeping_20261016` · **Type:** Chore · **Status:** new · **Branch:** `feature/docs-housekeeping-refresh` · **Created:** 2026-10-16
> This spec is the **Source of Truth** for scope. `plan.md` operationalizes it; deviations require a `tech-stack.md` note per workflow.

## 1. Overview

The repo has shipped a 20-game suite (Hub 5×4 complete, preload 170, 15-game adaptive coverage, v1.17.0 tagged) but the docs and registry lag behind: `README.md` still describes 18 games and 1101 tests across 45 files (actual: 20 games, 1803 tests, 69 files), `docs/release-notes-v1.17.0.md` is missing, `docs/PRD.md` / `docs/TDD.md` predate Games 19–20 and the adaptive extension, and the finished `number-order_20260828` track still sits live in `conductor/tracks/` with a registry link pointing at the live path.

This track brings docs and registry in line with the shipped state. Docs-only: no `src/` changes, no assets, no gameplay, no version bump, no release execution.

## 2. Functional Requirements

### 2.1 README refresh (`README.md`)
- Mini-games table 18 → 20 rows: add Game 19 — Decode It (early decoding / word recognition) and Game 20 — Number Order (numeral sequencing / ordinality) with milestone + status.
- Test/coverage paragraph: 1101 tests / 45 files → 1803 tests / 69 files; update coverage figures to the latest green full-suite run.
- Project Structure section: scenes 18 → 20 lazy-loaded game scenes, sceneRegistry loader count, preload count 170.
- Hub Experience section: 18-game language → 20 tiles in a 5×4 grid; sticker shelf / profile chip text stays valid.
- Replay-variety paragraph: append Decode It + Number Order round structure (bands, adaptive ±1 note).

### 2.2 Missing release notes (`docs/release-notes-v1.17.0.md`)
- Author from git history (`e1ffb53` bump + merged PR #32 Game 20 scope): highlights, game description, Hub/preload/registry deltas, verification basis.
- Follow the format of `docs/release-notes-v1.16.0.md` (Highlights → Changes → Verification → Known issues).

### 2.3 PRD / TDD amendments (`docs/PRD.md`, `docs/TDD.md`)
- PRD: Games 19–20 entries (milestone, mechanic, round structure) + adaptive coverage 12 → 15 games.
- TDD: scene registry 22 → 23 loaders, preload 168 → 170, Hub 5×3+4 → 5×4, progress paging 6+6+6+1 → 6+6+6+2, adaptive facade ids.

### 2.4 Track archive + registry fix (`conductor/`)
- Move `conductor/tracks/number-order_20260828/` → `conductor/archive/number-order_20260828/`.
- Update `conductor/tracks.md`: number-order link `./tracks/…` → `./archive/…` + `(Archived)` suffix, matching every other completed track.

## 3. Non-Functional Requirements

- **Docs-only:** zero `src/`, asset, or config changes; `git diff --stat` for the track must show only `*.md` + `conductor/` paths.
- **Style:** match existing markdown voice (storybook tone in README, tabular release notes, dated `tech-stack.md`-style notes where touched).
- **Links:** every edited relative link verified resolvable from its file.
- **Verification via existing gates:** `pnpm run check`, `CI=true pnpm test`, `pnpm run build` stay green (docs cannot break them; run to prove it).

## 4. Acceptance Criteria

- [ ] README mini-games table has 20 rows; no remaining "18 games" / "1101" / "45 files" claims.
- [ ] `docs/release-notes-v1.17.0.md` exists and mirrors the v1.16.0 notes structure.
- [ ] PRD + TDD mention Decode It, Number Order, and 15-game adaptive coverage.
- [ ] `conductor/tracks/number-order_20260828` no longer exists; `conductor/archive/number-order_20260828/index.md` does; `tracks.md` links the archive path with `(Archived)`.
- [ ] `pnpm run check`, `CI=true pnpm test`, `pnpm run build` green.
- [ ] No changes under `src/`, `public/`, or `*.config.*`.

## 5. Out of Scope

- Gameplay, balance, art, audio, or mechanic changes.
- New games, new adaptive dimensions, or the five fixed-difficulty games' treatment.
- Version bump, tagging, deployment, or release execution (a release track follows).
- Coverage-threshold or Biome-drift repairs (tracked separately; pre-existing reds documented in `tech-stack.md`).
- Cross-device sync or PWA behavior changes.

## 6. Dependencies & Risks

- **Dependencies:** git history for v1.17.0 scope; latest green test counts for README figures.
- **Risk — README figure drift:** counts re-verified at implementation time via a fresh full-suite run; figures recorded in the commit git note.
- **Risk — release-notes accuracy:** authored strictly from merged commits/tags, not memory; any ambiguity flagged in the plan checkpoint note instead of guessed.

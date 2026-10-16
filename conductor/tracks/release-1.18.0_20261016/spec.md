# Spec: v1.18.0 Release Execution — Adaptive-Remaining + Docs Refresh

> **Track:** `release-1.18.0_20261016` · **Type:** Chore / Release · **Status:** new · **Branch:** `release/v1.18.0` · **Created:** 2026-10-16
> This spec is the **Source of Truth** for scope. `plan.md` operationalizes it; deviations require a `tech-stack.md` note per workflow. Convention follows the `release-1.16.0_20260827` track.

## 1. Overview

Ship the post-v1.17.0 delta as **v1.18.0**: the adaptive-remaining batch (Pattern Builder, Odd One Out, Color Match ±1 band ladders + one-line scene wiring, 1803 tests green) plus the docs refresh (README 20-game suite, `release-notes-v1.17.0.md`, PRD/TDD Games 19–20 amendments, Game 20 archive). Base tag `v1.17.0` → current `origin/master` HEAD: 16 non-conductor files (+578/−46), docs + 6 logic/scene/test pairs, zero gameplay-mechanic changes beyond the already-reviewed adaptive ladders.

Release-only work from here: version string, release notes, PR → tag → deploy → verify. No new features, no balance changes, no assets.

## 2. Functional Requirements

### 2.1 Version bump (`package.json`)
- `1.17.0` → `1.18.0`. Single string change; lockfile untouched (no dependency changes).

### 2.2 Release notes (`docs/release-notes-v1.18.0.md`)
- Highlights: adaptive coverage 12 → 15 games (Pattern Builder per-band table, Odd One Out frog-cap ladders, Color Match split-point), docs-refresh alignment, review-fix sweep.
- Changes / Bug Fixes / Known Issues / Installation sections mirroring the v1.16.0/v1.17.0 notes structure.
- Verification section completed with the deployed run (CI id, tag lineage, live hash, device sign-off) before archiving.

### 2.3 PR + quality gates
- Push `release/v1.18.0`, open PR to `master`, require `Quality Gates` green (`pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`, bundle validation), then merge. No other commits reach `master` except through this PR.

### 2.4 Tag + deploy + live verification
- Tag `v1.18.0` on the merge commit with a lineage guard (tag parent == merge commit).
- Coolify rebuilds from the Dockerfile and ships; verify the live entry hash matches the local `dist/` build.
- Live smoke: boot → Hub (20 tiles 5×4) → one adaptive game round-trip → sticker shelf → Settings version footer `v1.18.0`.

### 2.5 Device matrix
- 4-class matrix per v1.16.0 convention (iPad/iPadOS, iPhone/iOS, Android tablet, Android phone) + desktop smoke: install/update prompt, offline relaunch from precache, touch targets, landscape lock, reduced-motion spot check.

### 2.6 Branch hygiene + archive
- Delete stale merged local/remote branches (full local + remote mode, `release/v1.18.0` last after merge).
- Finalize notes, mark registry `[x]`, archive the track.

## 3. Non-Functional Requirements

- **Release-only diff:** after the version bump + notes, no `src/` changes; the merged PR diff vs `v1.17.0` stays the reviewed delta.
- **Reproducibility:** tag lineage guard + live-hash match prove what shipped is what was verified.
- **Non-interactive & CI-aware:** `gh run watch --exit-status` for CI; deploy webhook with `--fail-with-body`.

## 4. Acceptance Criteria

- [ ] `package.json` reads `1.18.0`; `docs/release-notes-v1.18.0.md` exists with a completed Verification section.
- [ ] PR merged with `Quality Gates` green; tag `v1.18.0` lineage-guarded to the merge commit.
- [ ] Coolify deploy live; live entry hash == local build; smoke (boot → Hub → game → sticker → footer) passes.
- [ ] Device matrix signed off (or explicitly deferred by user decision, recorded in the checkpoint note).
- [ ] Stale branches removed; track archived with `[x]` registry entry.

## 5. Out of Scope

- New games, mechanics, balance, art, audio, or copy changes.
- Coverage-threshold repairs (95/85 global red stays documented in `tech-stack.md`, tracked separately).
- Adaptive treatment for the five fixed-difficulty games (needs product sign-off).
- v1.17.0-notes finalization beyond carrying them forward (they shipped as DRAFT; v1.18.0 notes supersede).

## 6. Dependencies & Risks

- **Dependencies:** Coolify deploy webhook + token secrets; live URL availability; physical devices for the matrix.
- **Risk — device access:** if devices are unavailable, the matrix defers by explicit user decision (v1.14.1 precedent: desktop smoke green, release not blocked) — recorded, never silently skipped.
- **Risk — coverage red:** global 95/85 thresholds are red on master for unrelated glue code; the release PR's `Quality Gates` job defines pass/fail — if it gates red, STOP and triage rather than weakening thresholds.

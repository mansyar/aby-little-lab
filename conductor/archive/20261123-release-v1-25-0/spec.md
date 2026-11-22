# Release v1.25.0 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Ship the Content Depth work (PR #92) that is merged on master but unreleased, and close the two
remaining P6 housekeeping items in the same release: a strict production-module size budget
(400-line warn / 600-line fail, enforced with no grandfathering) and a one-time split of
historical changelogs out of the Conductor docs into `docs/changelog.md`. Tag-gated deployment
means only the tag makes the new content reach users.

## Problem / Motivation

`v1.24.0` (`cac20094`) is the latest tag and `package.json` still reads 1.24.0, but master already
contains a full feature track (60 words, 30 stories, 48 scenarios, 24 shapes + cut-outs, texture
guard). Coolify deploys only on strict semver tags, so none of it is live. Separately,
`conductor/product.md` (531 lines) carries ~36 changelog sections and `prewarm.ts` has grown to
796 lines with no size guard; the roadmap lists both as once-only hygiene.

## Goals & Success Metrics

- **Goal:** users receive Content Depth via a tagged v1.25.0 release; the two P6 debt items are
  permanently closed.
- **Metric:** tag `v1.25.0` resolves on origin to merged master HEAD and its CI/deploy run is
  green; every production module ≤ 400 lines; guard fails an oversized fixture; `validate-docs.js`
  5/5; full `verify_phase` green including both guards.

## Scope

### In Scope

- Version bump to 1.25.0 and DRAFT→FINAL release notes covering PR #92 and the P6 work.
- README Documentation link and Releases table row.
- Behavior-neutral splitting of all 13 production modules over 400 lines to ≤ 400 lines.
- `scripts/validate-module-size.js` with synthetic failure proof, wired into `verify_phase`.
- Verbatim changelog move into `docs/changelog.md` with pointer links from both Conductor docs.
- Full gate, review, PR/merge, and a human-authorised tag push.

### Out of Scope

- New games, game rules, scene behavior, GameId changes, i18n, or input modes.
- Runtime features, dependency upgrades, store submission, real-device pass (recorded as an
  accepted gap).
- Moving or rewriting historical release notes.
- P4 replay-novelty and adaptive-tuning tracks.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `package.json` version reads `1.25.0` | must |
| FR-2 | `docs/release-notes-v1.25.0.md` follows the v1.24.0 structure: Status/Tag/Base header, parent-facing lede, one section per shipped PR in merge order, Installation, Release Verification, Known Issues; no duplication of README Known Issues or roadmap | must |
| FR-3 | README Documentation index links the notes and Releases table has a v1.25.0 row dated 2026-11-23 | must |
| FR-4 | Every production module under `src/**/*.ts` (excluding `src/__tests__/**`) is ≤ 400 lines after behavior-neutral extraction — strict enforcement with **no** allowlist or grandfathering | must |
| FR-5 | `scripts/validate-module-size.js` warns at 400, fails at 600, checks real source green and a synthetic oversized fixture red (exit 1); wired into `verify_phase` at every workflow.md occurrence and as a package.json script | must |
| FR-6 | All dated changelog entries from `conductor/product.md` and `conductor/tech-stack.md` are moved verbatim into `docs/changelog.md`; one-line pointers replace them and README links the file | must |
| FR-7 | Full `verify_phase` (including `validate-textures.js` and `validate-module-size.js`) is green on the release commit | must |
| FR-8 | Reviewed PR merges to master with all required CI checks green, using `merge` method | must |
| FR-9 | Tag `v1.25.0` is created on merged master HEAD and pushed only after explicit user go-ahead (fires Coolify); notes flip DRAFT→FINAL with tag/CI/deploy record | must |
| FR-10 | Skipped real-device pass is recorded in the notes as an accepted gap with checklist links | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No game/rule/UI behavior change: module splits are pure extractions; build-time guards and docs are allowed |
| NFR-2 | All links/anchors resolve and `node scripts/validate-docs.js` reports 5 passed / 0 failed; living count claims stay truthful if test counts change |
| NFR-3 | Conventional commits, tag push on master lineage only, no `--admin`/`--auto`/force-push/tag move/silent retry; one disclosed CI rerun maximum when a worker crash occurs |
| NFR-4 | Shell bundle stays ≤ 200 kB; existing texture guard stays green; no new dependency or service |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `package.json` version is `1.25.0` | FR-1 |
| AC-2 | Notes exist, README-linked, table-listed, validator 5/5, Status DRAFT before tag | FR-2, FR-3 |
| AC-3 | Every production module ≤ 400 lines; guard green on real source | FR-4 |
| AC-4 | Guard fails synthetic oversized fixture with exit 1; wiring present at all workflow.md `verify_phase` sites and package.json | FR-5 |
| AC-5 | `docs/changelog.md` holds all historical entries; pointers in both Conductor docs; README links it; validator 5/5 | FR-6 |
| AC-6 | Full `verify_phase` green on release commit (both guards included) | FR-7 |
| AC-7 | Review PASS, CI green, PR MERGED via `merge` | FR-8 |
| AC-8 | Origin tag `v1.25.0` resolves to merged master HEAD; notes FINAL with CI/deploy record | FR-9 |
| AC-9 | Device pass recorded as accepted gap | FR-10 |
| AC-10 | Full unit + e2e journeys green after the refactor; no game, rule, GameId or scene-behavior change | FR-4, NFR-1 |

## Edge Cases

- Module extraction can create circular imports or break barrel exports → full typecheck + suite +
  boot validation must stay green.
- A test file added during extraction changes suite truth → README/TDD/perf-baseline counts must be
  refreshed before `validate-docs.js`.
- Tag/PR collision with `v1.25.0` → check `git ls-remote` before creating the tag; never move an
  existing tag.
- CI Vitest worker crash (seen on the last two releases) → one disclosed `gh run rerun --failed`,
  not a silent retry.
- `paths-ignore` means conductor/docs-only pushes do not trigger CI; final verification is local
  plus the PR run.

## Dependencies

- **Tracks:** `20261121-content-depth` (complete, merged at `9ffbc01d`, ancestor of base).
- **External:** GitHub PR/merge rights; configured Coolify webhook secrets; explicit user go-ahead
  before tag push.

## Open Questions & Assumptions

- **Assumption:** minor bump to 1.25.0 is correct for a single feature track plus P6 work;
  roadmap's "v1.26.0" for content depth was an estimate.
- **Assumption:** "strict" means zero warnings — every production module ≤ 400 lines, not just
  under the 600 fail line.
- **Assumption:** device-class pass stays skipped per release precedent.
- **Assumption:** the changelog move is verbatim historical text, not a rewrite.
- **Gap:** `conductor/product.md` has no "Open Questions & Assumptions" section to seed this spec
  (pre-existing).

## References

- `conductor/archive/20261121-release-v1-24-0/{spec,plan,pr}.md` (proven release pattern)
- `docs/release-notes-v1.24.0.md` (notes format); PR #92 (shipped set)
- `conductor/product.md` §10.7 (P6 items), `docs/perf-baseline.md`, `.github/workflows/ci.yml`

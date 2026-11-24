# Dependency Majors — November 2026 — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Perform the November 2026 monthly dependency-maintenance pass on Aby's Little
Lab: refresh the six currently outdated dev packages (Biome, Vite, the Playwright
pair and the Vitest/coverage pair) to the latest version available when each
upgrade phase runs, keep the full verification gate green, and record a short
reusable monthly checklist in `conductor/tech-stack.md`. No major upgrade is
outstanding this month; the value is cadence and drift control. A runtime package
is upgraded only if `pnpm outdated` flags it during execution, in which case
browser journeys are required as additional proof.

## Problem / Motivation

`pnpm outdated` (surveyed 2026-11-24) lists six dev packages behind latest:
`@biomejs/biome` 2.6.3, `vite` 8.3.5, `@playwright/test` + `playwright-core`
1.64.1, and `vitest` + `@vitest/coverage-v8` 5.0.5. All are minor/patch moves;
none is a major. Leaving them unattended accumulates migration debt against a
1,560-test suite and a strict bundle/PWA/docs gate. The October track
(`20261027-dependency-majors`) proved the four majors then outstanding can be
absorbed in bounded phases; this track makes that pass routine rather than
exceptional. The project is on Node 24.22.2 and pnpm 12.16.1, which satisfy the
current engines, so no toolchain provisioning is needed.

## Goals & Success Metrics

- **Goal:** All six named candidates resolve to the latest version available at
  their upgrade phase, with `package.json`, `pnpm-lock.yaml` and docs truth
  updated together.
  - **Metric:** per-phase `pnpm outdated` output recorded in evidence showing
    each candidate current at that phase.
- **Goal:** The full verification chain remains green after every upgrade.
  - **Metric:** `verify_phase` exit 0 in each phase evidence file; coverage
    ≥ 95 lines / 88 functions / 85 branches / 90 statements; docs 5/5.
- **Goal:** A frozen lockfile reproduces the integrated tree.
  - **Metric:** `pnpm install --frozen-lockfile` exit 0.
- **Goal:** The monthly procedure is documented where the stack is described.
  - **Metric:** `conductor/tech-stack.md` contains the resolved version table
    and a short monthly-maintenance section; `validate-docs.js` stays 5/5.
- **Goal:** Runtime stays untouched unless evidence forces otherwise.
  - **Metric:** if no runtime package is flagged outdated, `git diff` against
    the base shows no runtime dependency change; if one is flagged, E2E journeys
    plus the full gate are green.

## Scope

### In Scope

- `package.json` and `pnpm-lock.yaml` for exactly the six candidates:
  `@biomejs/biome`, `vite`, `@playwright/test`, `playwright-core`, `vitest`,
  `@vitest/coverage-v8` — plus required peers if an upgrade demands them.
- Pair-coherent upgrades: Vitest and `@vitest/coverage-v8` at one version;
  `@playwright/test` and `playwright-core` at one exact version.
- `vite.config.ts` / `biome.json` / `playwright.config.ts` only where an upgrade
  forces a mechanical config adaptation.
- `src/__tests__/**` only where an upgrade forces a test fix; no assertion
  weakening, renaming or deletion.
- `conductor/tech-stack.md` version table and a new short monthly-maintenance
  section (primary-owned edit).
- Living suite-count claims in `README.md`, `docs/TDD.md`, `docs/perf-baseline.md`
  only if the suite count changes.
- Runtime dependency upgrades only when `pnpm outdated` flags that runtime
  package during execution, with E2E journeys as proof.

### Out of Scope

- Chasing releases published after a candidate's upgrade phase.
- Adding packages, changing package managers, or relaxing exact pins.
- Production `src/**` edits on the dev-only path; gameplay, save schema, child
  scenes and E2E state stay byte-identical unless a runtime bump is executed.
- Re-running the October majors, happy-dom 21, or PWA 2.0 migrations.
- New features, refactors, coverage-gate changes or validator allowlists.
- Historical release notes and archived track records.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Phase 1 records the verbatim `pnpm outdated` survey and freezes the candidate set to the six named packages. Each upgrade phase resolves that candidate's latest available version at execution time and records the installed version verbatim in evidence. | must |
| FR-2 | `vitest` and `@vitest/coverage-v8` move to the same version; `@playwright/test` and `playwright-core` move to the same exact-pinned version. `package.json` and `pnpm-lock.yaml` are committed together in each upgrade phase. | must |
| FR-3 | Every implementation phase ends with the full configured `verify_phase` chain green on that phase's tree. No gate, budget or validator is skipped or weakened. | must |
| FR-4 | A runtime dependency is upgraded only when `pnpm outdated` flags it during execution. Such an upgrade requires `pnpm test:e2e` (chromium journeys) plus a green full gate, with the triggering survey recorded. | must |
| FR-5 | The integrated tree installs with `pnpm install --frozen-lockfile`. No dependency outside the six candidates and their required peers is added or version-changed. | must |
| FR-6 | `conductor/tech-stack.md` states the actually installed versions and gains a short "Monthly dependency maintenance" section covering survey, pair-aware upgrade, full gate, docs truth and the no-runtime-change default. Living suite counts are refreshed only if they move. | must |
| FR-7 | On the dev-only path, `src/**` excluding `src/__tests__` is byte-identical to the base; no child-facing behaviour, save schema or game rule changes. | must |
| FR-8 | Every semantic change forced by an upgrade (lint findings, config adaptation, test fix, coverage denominator shift) is recorded as a deviation in the owning phase's evidence with its reason. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Coverage gates stay at 95 lines / 88 functions / 85 branches / 90 statements; bundle shell ≤ 200 kB; PWA 16/16; module-size zero warnings; `validate-docs.js` 5/5. None is lowered or allowlisted. |
| NFR-2 | The lockfile is deterministic: `pnpm install --frozen-lockfile` succeeds with no manifest drift. |
| NFR-3 | No new runtime dependency and no production source change unless FR-4 is triggered. Runtime packages not flagged outdated remain byte-identical. |
| NFR-4 | All verification uses non-watch invocations (`pnpm test -- --run`, `vitest run`); `verify_phase` is run once per phase on the final tree, with narrower independent checks by the primary. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Phase 1 evidence contains the verbatim `pnpm outdated` output and the frozen six-name candidate list. Each upgrade phase's evidence records the exact version it installed for its candidate. | FR-1 |
| AC-2 | At each candidate's phase check, `pnpm outdated` no longer lists that candidate below the installed version. Any release published after that phase is explicitly recorded as out of scope. | FR-1, FR-2 |
| AC-3 | `git diff <base>..HEAD -- package.json pnpm-lock.yaml` touches only the six candidates and any required peers; the Vitest pair shares one version and the Playwright pair shares one exact version. | FR-2, FR-5 |
| AC-4 | Every implementation phase evidence file records `verify_phase` exit 0 with the 10 command results. | FR-3, NFR-4 |
| AC-5 | `pnpm install --frozen-lockfile` exits 0 on the integrated tree. | FR-5, NFR-2 |
| AC-6 | If no runtime package is flagged outdated, `phaser` and all runtime dependencies are byte-identical to the base; if one is flagged, its evidence contains the `pnpm outdated` trigger, a green `pnpm test:e2e` and a green full gate. | FR-4, FR-7, NFR-3 |
| AC-7 | On the dev-only path, `git diff <base>..HEAD -- src ':(exclude)src/__tests__'` is empty; any production edit is a blocked finding unless FR-4 applies. | FR-7, NFR-3 |
| AC-8 | `conductor/tech-stack.md` states the installed versions and includes the new monthly-maintenance section; `node scripts/validate-docs.js` exits 0 with 5/5. | FR-6, NFR-1 |
| AC-9 | Coverage thresholds remain 95/88/85/90 in `conductor/workflow.md`; bundle, PWA, module-size and docs validators pass at their existing budgets. | NFR-1, NFR-4 |
| AC-10 | Phase evidence lists every forced semantic change with a reason, and grep proves no gate disable, skipped validator, weakened assertion or new allowlist was introduced. | FR-8, NFR-1 |

## Edge Cases

- A candidate publishes a newer version after its upgrade phase: out of scope;
  record the observation, do not chase it.
- Vitest and coverage versions diverge because only one package is flagged:
  upgrade both to the higher common version or stop as blocked with the pnpm
  error verbatim.
- Playwright pair resolves to different versions: keep the exact pin coherent;
  if browser binaries are missing, install the matching chromium build or stop
  as blocked with the command output.
- A peer-dependency conflict blocks an upgrade: stop that phase as blocked with
  the pnpm error; no forced-resolution flags or `--legacy-peer-deps`.
- New Biome rules flag pre-existing code: fix real findings; anything out of
  scope gets a recorded justification rather than a silent config disable.
- Vitest coverage matching shifts measured numbers: gates stay fixed; if suite
  counts change, refresh README/TDD/perf-baseline in the same phase so the docs
  guard stays 5/5.
- `pnpm outdated` flags a runtime package: execute FR-4 (survey + E2E + full
  gate); if journeys fail, the phase is blocked, not merged.
- `conductor/tech-stack.md` is primary-owned: the phase subagent records the
  exact text in its evidence; the primary applies that edit before acceptance.

## Dependencies

- **Tracks:** none. RM-1 is unpromoted and has no `depends_on`.
- **External:** npm registry availability; Node 24.22.2; pnpm 12.16.1; Playwright
  chromium binary for `pnpm test:e2e` if FR-4 is triggered.

## Open Questions & Assumptions

- **Assumption A1:** The candidate set is the six packages named in FR-1; which
  versions are installed is decided at execution time, not by this survey.
- **Assumption A2:** No runtime package will be flagged outdated; if one is,
  FR-4 defines the extra proof rather than silently expanding scope.
- **Assumption A3:** No upgrade in the candidate set requires a production
  source edit. Such an edit is a blocked finding, not an implicit approval.
- **Assumption A4:** Exact pins (`@playwright/test`, `playwright-core`) and caret
  ranges (the other four) keep their current policy.
- **Assumption A5:** `conductor/tech-stack.md` is edited by the primary agent,
  because phase subagents cannot write `conductor/**` outside verification.

## References

- `pnpm outdated` survey, 2026-11-24: six dev packages listed in Overview.
- `conductor/roadmap.md` §10.7 — Phase 6 sustainability: "Dependency-majors
  track | monthly | one already shipped on 2026-10-27; make it routine".
- `conductor/archive/20261027-dependency-majors/spec.md` and `plan.md` — prior
  majors track, imported as the structural baseline.
- `conductor/workflow.md` — Workflow Config, verification layers, coverage
  gates and PR rules.
- `package.json` — current manifest, exact/caret pin policy and scripts.

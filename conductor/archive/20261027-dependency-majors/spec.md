# Spec — Dependency Majors

## Overview

Upgrade the five outdated dev dependencies to their current versions — `@biomejs/biome` 2.5.10 → 2.6.3, `vite` 8.2.2 → 8.3.5, `vitest` + `@vitest/coverage-v8` 4.1.11 → 5.0.5 (exact pair), `happy-dom` 18.0.1 → 21.0.4, `vite-plugin-pwa` 1.3.0 → 2.0.0 — while the full 8-command verification gate stays green (125 files / 2,729 tests, coverage above the 95/88/85/90 gates, bundle + PWA + docs validators passing). Zero production-code change, zero kid-visible change. Phases are ordered minors-first, then each major isolated, so any CI breakage bisects to one phase.

Registry facts verified at planning time (2026-10-27): local Node 24.16.0 and pnpm 12.4.1 satisfy every engine (vitest 5.0.5 requires Node `^22.12.0 || ^24.0.0 || >=26.0.0` and vite `^6.4.0 || ^7 || ^8`; vite-plugin-pwa 2.0.0 requires Node `>=20.19.0` and peers `workbox-build`/`workbox-window` `^7.4.1`; happy-dom 21.0.4 requires Node `>=20.0.0`). `@vitest/coverage-v8` must pair exactly with vitest 5.0.5.

## Problem & Motivation

`pnpm outdated` reports five outdated dev dependencies, three of them majors. Staying behind accumulates migration debt against an ever-larger test suite (125 files / 2,729 tests today). The known breaking surfaces are concrete:

- **vitest 5** — `clearMocks` now defaults to `true` (mock call history cleared before every test); coverage `include`/`exclude` matching is more precise (can shift measured coverage); hoisted-mock calls must be at the top level; class mocks keep prototype methods; several assertion changes (`toThrow` message matching, unawaited async assertions fail).
- **happy-dom 19+** — disables CSS and IFrame loading by default (SSRF hardening); could affect any suite relying on implicit style/frame loading.
- **vite-plugin-pwa 2.0** — Node engine bump and workbox `^7.4.1` peers; config surface may have moved since 1.3.0.

The repo's verification is currently the strongest it has been (count-drift guard, mutation-proven; coverage gates fixed in the workflow config; bundle/PWA/docs validators), which makes this the right moment to absorb three majors in one bounded, bisectable track.

## Goals & Success Metrics

- **G1** — all five packages at the versions above; `pnpm outdated` no longer lists them. Metric: `pnpm outdated` output recorded per phase and at the end.
- **G2** — the full verification chain green on the integrated tree with suite counts unchanged (2,729 tests / 125 files) or, if a major forces a test change, the living docs refreshed in the same phase so the count-drift guard stays green. Metric: exit 0 on all eight commands.
- **G3** — zero production change: `src/**` excluding `__tests__` untouched. Metric: `git diff --name-only` audit per phase.
- **G4** — lockfile always consistent: every upgrade phase commits `pnpm-lock.yaml`; `pnpm install --frozen-lockfile` succeeds (CI parity). Metric: frozen install run recorded.

## Scope

**In:**
- `package.json` + `pnpm-lock.yaml` for exactly the five named packages (+ workbox peers if required).
- `vite.config.ts` adaptation (vitest test config, PWA plugin options).
- `biome.json` `$schema` refresh to match the upgraded biome.
- Test files under `src/__tests__/**` that the majors force to change.
- `.github/workflows/ci.yml` Node version — bumped only if below 22.12.
- Docs truth: `docs/TDD.md` runner section (§10.1), `conductor/tech-stack.md` version table, coverage snapshot refresh if measured numbers shift.

**Out:**
- `phaser` (runtime dependency, not outdated) and any production `src/**` semantics.
- Any package beyond the five named (opportunistic bumps are out of scope).
- Historical records (`docs/release-checklist.md`, release notes).
- New features, refactors, or test rewrites beyond what the majors force.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Every upgrade phase commits the updated `package.json` and `pnpm-lock.yaml` together, and `pnpm install --frozen-lockfile` succeeds on the phase tree. | must |
| FR-2 | Phase 1 upgrades `@biomejs/biome` to ^2.6.3 and `vite` to ^8.3.5; `biome.json` `$schema` is refreshed to the new version (retiring the pre-existing `$schema`-vs-installed info diagnostic); any new biome lint findings are fixed, with config-disables only under recorded justification. | must |
| FR-3 | Phase 2 upgrades `vitest` and `@vitest/coverage-v8` to exactly ^5.0.5 as a pair. The vitest 5 `clearMocks: true` default is embraced: no `clearMocks: false` escape hatch may be added to `vite.config.ts`; suites relying on cross-test mock call history are fixed to be self-contained. No test is renamed, deleted, or has an assertion weakened. | must |
| FR-4 | Phase 3 upgrades `happy-dom` to ^21.0.4. If the CSS/IFrame-loading default-off change affects any suite, loading is re-enabled per suite with a recorded justification — never blanket-global without one. | must |
| FR-5 | Phase 4 upgrades `vite-plugin-pwa` to ^2.0.0 with its workbox `^7.4.1` peers satisfied; the PWA behavior is preserved: `validate-pwa.js` 16/16 checks, 42/42 chunks precached, precache manifest ~54 entries. | must |
| FR-6 | The CI workflow's Node version is verified ≥ 22.12.0 in Phase 1 and bumped only if it is lower. | must |
| FR-7 | Phase 5 updates the living docs to the new truth: `docs/TDD.md` §10.1 records the runner versions and the clearMocks policy decision; `conductor/tech-stack.md` version table is updated; the coverage snapshot in TDD/perf-baseline is refreshed (dated) if the measured numbers shift; the count-drift guard stays green. | must |
| FR-8 | Every semantic change a major forces (beyond mechanical version/config bumps) is recorded as a deviation in the owning phase's evidence with the reason. | must |

## Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | Zero production change: files under `src/**` excluding `src/__tests__` are untouched. | must |
| NFR-2 | Coverage gates stay fixed at 95/88/85/90 (lines/functions/branches/statements per workflow config); if vitest 5's matching precision shifts measured numbers, config or tests adapt to stay above the gates — the gates are never lowered. | must |
| NFR-3 | Bundle and PWA budgets hold: shell entry ≤ 200 kB, Phaser vendor chunk present, 42/42 chunks precached. | must |
| NFR-4 | No new runtime dependencies; dev-dependency changes only, limited to the five packages and their required peers. | must |

## Acceptance Criteria

| ID | Criterion | Verifies |
|---|---|---|
| AC-1 | At track end `pnpm outdated` lists none of the five packages; per-phase evidence records the outdated output after each upgrade. | FR-1 |
| AC-2 | The full 8-command verification chain exits 0 on the integrated tree; the count-drift guard passes (2,729 tests / 125 files, or docs refreshed in-phase if the counts moved). | FR-1, FR-3, NFR-2 |
| AC-3 | Grep proof: `vite.config.ts` contains no `clearMocks` override; the phase evidence lists every suite fixed for cross-test mock history with a before/after note. | FR-3, FR-8 |
| AC-4 | happy-dom evidence records the CSS/IFrame audit outcome (affected suites: none, or the per-suite justifications). | FR-4 |
| AC-5 | PWA and bundle validators pass with budgets held: validate-bundle PASS, validate-pwa 16/0, 42/42 precached, shell ≤ 200 kB. | FR-5, NFR-3 |
| AC-6 | `docs/TDD.md` and `conductor/tech-stack.md` state the new versions; `node scripts/validate-docs.js` exits 0 (6/6 checks). | FR-7 |

## Edge Cases & Failure Modes

- CI Node below 22.12 → bump `ci.yml` in Phase 1 (FR-6); CI Node at/above → record the verification, no change.
- `workbox-window` devDependency version does not satisfy `^7.4.1` → bump it in Phase 4 as a required peer (still dev-only, recorded under FR-5).
- A vitest 5 change forces a test count change → the living docs (README/TDD/perf-baseline) are refreshed in the same phase; the count-drift guard enforces this.
- Coverage denominators shift under vitest 5's precise matching → gates stay fixed (NFR-2); the dated snapshot is refreshed in Phase 5.
- A peer-dependency conflict blocks an upgrade → the phase stops as `blocked` with the pnpm error verbatim; no forced-resolution flags.
- New biome lint rules flag pre-existing code → real findings are fixed; anything out of scope gets a recorded justification, not a silent disable.
- happy-dom CSS/IFrame default-off breaks a suite that was relying on it → per-suite enable with justification; if the suite was depending on network-like loading, that is a test-hygiene finding to fix, not a global re-enable.

## Dependencies

- **Tracks:** none.
- **External:** npm registry availability; Node 24.16.0 / pnpm 12.4.1 (verified).

## Open Questions & Assumptions

- **A1** — CI runs a Node version ≥ 22.12.0 (verified/bumped in Phase 1).
- **A2** — workbox peers are satisfiable without replacing the PWA plugin.
- **A3** — no vitest 5 change requires production `src/` edits (they would be a blocked finding, not a silent edit).
- **A4** — `pnpm outdated` "Latest" values remain 2.6.3 / 8.3.5 / 5.0.5 / 21.0.4 / 2.0.0 for the track's duration; newer patches that appear mid-track are not chased (out of scope).

## References

- `pnpm outdated` output (2026-10-26 survey; re-verified in Phase 1 evidence).
- Vitest 5 migration guide: https://vitest.dev/guide/migration/ (`clearMocks`, coverage matching, hoisted mocks, class mocks).
- vite-plugin-pwa releases: Node >= 20.19.0 from v2.0.0; workbox `^7.4.1` peers (registry metadata verified 2026-10-27).
- happy-dom releases: CSS/IFrame loading disabled by default (SSRF hardening).
- `conductor/workflow.md` — Verification Strategy and Workflow Config (gates, commands).

# Phase 2 — CI matrix and blocking rollup

- Track: `20261125-browser-matrix`
- Phase: `2 — CI matrix and blocking rollup`
- Date: 2026-11-25
- Branch: `chore/20261125-browser-matrix`
- Phase base: `1bd673a49767d7483887ae8e38de6d0476859c84`
- Implementation head: `d29a0ca7`

## Result

**Verified locally; track-PR CI remains the authoritative runtime proof.**

The matrix, evidence helper, and CI topology guard are implemented. The exact configured gate, all three project listings, workflow lint/YAML parsing, a real CI-policy WebKit run, and positive/negative evidence-policy checks passed. PR CI is intentionally left to Phase 4 handoff and must confirm all three engines and the blocking rollup.

## Implementation

- `.github/workflows/ci.yml` adds `e2e-matrix` after `quality-gates`, with three parallel entries: `webkit`, `firefox`, and `mobile-chromium` (installed browser `chromium`).
- Each engine job has `fail-fast: false` and a 15-minute timeout. Browser installation, build, probe, tests, strict evidence enforcement, and artifacts run only for the code tier.
- The browser command is exactly `pnpm exec playwright test --project=${{ matrix.engine }} --reporter=json,line`.
- The existing rollup is still named `Browser Journeys`; it now requires `quality-gates`, `e2e-shard`, and `e2e-matrix` all to succeed.
- Documentation-only jobs still report the required checks without installing browsers or running journeys.
- Tag deployment behavior and required check names are unchanged.
- `scripts/playwright-matrix-evidence.js` records bundled browser version, Playwright version, exact viewport/touch profile, duration, expected/unexpected/flaky/skipped counts, attempts, and retries. It rejects missing/malformed reports, runner errors, wrong projects, skipped tests, retry-only passes, missing version evidence, and invalid retry configuration.
- `src/__tests__/guard/toolchain.test.ts` now guards all three pnpm/Node setup occurrences, the three-entry matrix, classifier parity, selected-project execution, JSON reporting, retry policy, timeouts, and rollup dependency.

Commits:

| Commit | Change |
| --- | --- |
| `ff06172a` | Correct browser-matrix requirement mapping |
| `b9352428` | Guard the CI engine-matrix topology |
| `00c2f33c` | Add strict browser-matrix evidence helper |
| `2d2f970e` | Run the cross-engine browser matrix in parallel |
| `d29a0ca7` | Reject incomplete browser-evidence inputs |

## Verification

### Exact configured gate

```text
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

- Exit: **0** (`.conductor/evidence/phase-2/gate-final.log`)
- Biome: 375 files checked.
- Application and E2E typechecks: passed.
- Unit and coverage: 158 files / 3,404 tests passed.
- Coverage: 97.09% statements / 90.93% branches / 96.35% functions / 98.23% lines.
- Build: 491 modules; bundle, module-size, texture, PWA, and documentation guards passed.
- PWA: 16/16; 52 JS chunks precached. Documentation: 5/5.

An earlier gate failed because the toolchain guard still expected two CI runners. The guard was updated for the three-engine topology and the final gate passed.

### Structural checks

| Command/check | Result |
| --- | --- |
| `pnpm exec playwright test --list --project=webkit` | PASS — 8 tests / 6 files |
| `pnpm exec playwright test --list --project=firefox` | PASS — 8 tests / 6 files |
| `pnpm exec playwright test --list --project=mobile-chromium` | PASS — 8 tests / 6 files |
| `actionlint .github/workflows/ci.yml` | PASS |
| Python YAML parse | PASS — jobs and three matrix entries parsed; rollup needs all three dependencies |
| Focused `toolchain.test.ts` | PASS — 8 tests |

### Strict evidence helper

A CI-policy WebKit run used `CI=true`, `--reporter=json,line`, and the configured two retries:

- WebKit `27.2`, Playwright `1.65.1`, desktop `1280x720`.
- 8 expected / 0 unexpected / 0 flaky / 0 skipped.
- 8 first-attempt results, zero retried attempts.
- Duration: 132.69 s.
- Strict summary: **PASS (strict first-attempt)**.

Positive and negative checks passed:

- Missing `GITHUB_OUTPUT`: rejected.
- Missing browser-version option: rejected.
- Synthetic retry-only/flaky report: rejected.
- Real first-attempt JSON report: accepted.

Evidence: `.conductor/evidence/phase-2/{summary.log,retry-only-summary.log,probe.log,playwright-report-webkit.json}`.

## Acceptance coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| FR-4 — three-engine CI on every code PR | Implemented; PR CI pending | Three-entry matrix, code-tier guards, selected-project command |
| FR-5 — existing rollup reflects matrix | Verified structurally; PR CI pending | Rollup name unchanged; dependencies and all-success checks include `e2e-matrix` |
| FR-6 — per-engine evidence and artifacts | Implemented; PR CI pending | Probe/summary helper and always-run artifact upload |
| FR-8 — docs-only required checks remain green without browser work | Verified structurally; PR CI pending | Shared classifier; code-only install/build/test guards; docs success summary |
| FR-9 — any engine failure blocks | Verified structurally; PR CI pending | Strict report policy plus all-success rollup |
| NFR-2 — parallel jobs, 15-minute bound, 10-minute target | Implemented; duration target pending CI observation | `fail-fast: false`, three entries, `timeout-minutes: 15` |
| NFR-3 — zero local retries; no retry-only acceptance | Verified | Local retries remain zero; synthetic retry-only report rejected |
| NFR-5 — exact versions, honest emulation | Implemented; PR CI pending | Bundled-browser probe; mobile profile explicitly labeled emulation |
| AC-5 — code and docs-only CI behavior | Implemented; PR CI pending | Workflow guards and classifier guard tests |
| AC-6 — rollup fails if any engine/shard fails | Verified structurally; PR CI pending | All-success rollup requires matrix result |
| AC-8 — failures retained; no silent skip | Implemented; PR CI pending | Always-run per-engine artifact upload and skipped-result rejection |

## Deviations and remaining gates

- The phase executor's shell permissions denied every verification command. The primary ran the exact gate, listings, workflow validation, and helper checks instead.
- `--reporter=line` alone does not emit JSON. The final command uses `--reporter=json,line`.
- A local harness initially omitted `GITHUB_OUTPUT` and the browser version. The helper was hardened to reject both incomplete-input cases.
- Track-PR CI must still prove all three engines, their exact versions/durations, artifact upload, documentation-only fast success, and the green `Browser Journeys` rollup.
- No runtime dependency, lockfile, generated asset, save schema, or tag-deployment behavior changed.

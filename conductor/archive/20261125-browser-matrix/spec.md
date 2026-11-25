# Browser Compatibility Matrix

## Overview

Add a required per-PR compatibility smoke matrix for the production PWA using the current Playwright-bundled **WebKit**, **Firefox**, and **mobile Chromium with touch**. Keep the existing full journey suite Chromium-only, and preserve physical-device testing as a separate manual release gate.

## Problem / Motivation

The app targets iPads, Android phones/tablets, and Fire tablets, but automated browser coverage currently runs only in desktop Chromium. Engine-specific regressions in canvas input, service workers, offline relaunch, speech-driven games, or touch behavior can therefore reach families before CI notices.

The manual device checklist is valuable but irregular, and Playwright emulation cannot prove real Safari, Chrome, Silk, audio, orientation-lock, or home-screen-install behavior.

## Goals & Success Metrics

- **Goal:** catch cross-engine regressions before merge without tripling the full journey suite.
- **Metric 1:** the core smoke passes in WebKit, Firefox, and mobile Chromium on the track's own PR.
- **Metric 2:** the existing required **Browser Journeys** check fails when any engine or Chromium shard fails.
- **Metric 3:** each engine job completes within 10 minutes on GitHub-hosted Ubuntu.
- **Metric 4:** one complete first-attempt green run is recorded; retry-only passes remain findings.

## Scope

### In Scope

- Three additional Playwright projects: `webkit`, `firefox`, and `mobile-chromium`.
- A focused core smoke selection:
  - boot into the Hub;
  - registry partition guard and all 24 game launch/return checks;
  - three rounds of First Sounds;
  - three rounds of Shape Sorter drag-and-drop;
  - one earned sticker surviving reload;
  - offline Hub and game relaunch.
- Landscape viewports; mobile Chromium uses touch input.
- A three-engine CI matrix running on every code PR.
- Failure traces/screenshots and per-engine result reporting.
- Local commands for running each engine.
- Documentation that clearly separates engine emulation from physical-device evidence.
- Minimal runtime compatibility fixes only if the new smoke proves an actual engine-specific defect.

### Out of Scope

- Running all 26 existing journeys in every engine.
- Physical-device automation or BrowserStack/Sauce integration.
- Older browser-version jobs.
- New gameplay, assets, dependencies, save-schema changes, analytics, or network services.
- Claiming that WebKit equals iOS Safari, mobile Chromium equals Android Chrome/Fire tablet, or emulation replaces hardware testing.
- Silently quarantining failing engines.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Define WebKit, Firefox, and mobile Chromium/touch Playwright projects while retaining the existing Chromium project. | must |
| FR-2 | Select the core smoke coverage listed above for the three new projects. | must |
| FR-3 | Keep the full journey suite restricted to Chromium and prevent accidental full-suite execution in the new projects. | must |
| FR-4 | Add a CI matrix that installs the required browsers, builds the production artifact, and runs the core smoke once per engine on every code PR. | must |
| FR-5 | Make the existing `Browser Journeys` rollup depend on and reflect the cross-browser matrix without creating a new required-check name. | must |
| FR-6 | Publish per-engine browser version, viewport/touch profile, duration, retry status, and pass/fail evidence; upload failure artifacts. | should |
| FR-7 | Provide documented local commands for the full Chromium suite and each cross-browser project. | must |
| FR-8 | Preserve documentation-only CI behavior so required checks still report without installing browsers or running journeys. | must |
| FR-9 | Treat any engine failure as blocking; fix it or obtain an explicit documented unsupported-engine decision before merge. | must |
| FR-10 | Update the README, TDD, tech stack, and device checklist to describe the matrix honestly and remove stale worker-count prose. | must |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | No new runtime dependency, asset, save schema, analytics, credential, or external service. |
| NFR-2 | The matrix uses three parallel engine jobs, each bounded by a 15-minute job timeout and a 10-minute observed target. |
| NFR-3 | Local retries remain zero. CI may retain the existing retry policy, but a retry-only pass is recorded as a finding and does not establish a clean matrix. |
| NFR-4 | Smoke tests continue to use bridge-published state and real canvas pointer geometry, not user-agent branching or copied coordinates. |
| NFR-5 | Automated evidence names the exact bundled engine versions and never claims physical-device coverage. |
| NFR-6 | Any runtime compatibility fix is minimal, directly required by a failing smoke, and covered by that smoke. |
| NFR-7 | The app remains offline-first; matrix jobs use only the local production preview unless an explicitly documented external origin is selected. |

## Acceptance Criteria

| ID | Criterion | Verifies |
|---|---|---|
| AC-1 | The existing full Chromium journey suite remains green and unchanged in scope. | FR-1, FR-3 |
| AC-2 | `webkit`, `firefox`, and `mobile-chromium` projects exist and run the core smoke with the intended viewport/touch settings. | FR-1 |
| AC-3 | The core smoke proves boot, all 24 launches/returns, three speech rounds, three drag rounds, sticker persistence across reload, and offline relaunch. | FR-2 |
| AC-4 | A project-list or CI command proves the new projects do not select the full journey roster. | FR-3 |
| AC-5 | Every code PR runs all three engine jobs; documentation-only PRs still report the required checks green without browser installation. | FR-4, FR-8 |
| AC-6 | `Browser Journeys` fails if any cross-engine job or existing Chromium shard fails. | FR-5 |
| AC-7 | The track PR records a complete first-attempt green Chromium suite and three-engine smoke, including versions and durations. | FR-4, FR-6 |
| AC-8 | Traces/screenshots are uploaded for failed engine jobs, and no engine may silently skip. | FR-6, FR-9 |
| AC-9 | A developer can reproduce each engine run locally using documented commands. | FR-7 |
| AC-10 | Docs distinguish automated engine proxies from real iOS Safari, Android Chrome, and Fire tablet testing. | FR-10 |
| AC-11 | No runtime dependency/asset/schema change is introduced; any compatibility fix is minimal and smoke-covered. | NFR-1, NFR-6 |

## Edge Cases

- Playwright browser installation fails: the job fails rather than skipping.
- WebKit/Firefox do not support a mobile-emulation flag: use only supported viewport/touch settings; mobile Chromium carries the mobile-touch claim.
- Speech synthesis is unavailable in headless automation: assert visual round progression, not audible output; real audio remains a device check.
- Service-worker activation or offline relaunch differs by engine: fail and investigate rather than weakening the assertion.
- Touch and mouse produce different pointer paths: use the same canvas-geometry helpers and validate the mobile project genuinely has touch enabled.
- A test passes only after retry: retain the evidence and require a clean first-attempt run before acceptance.
- Browser versions change under Playwright: record the actual versions in run evidence.
- A runtime defect is exposed: stop, document it, and either apply a minimal approved compatibility fix or record an explicit unsupported-engine decision.
- Concurrent local runs contend for port 4173: commands run sequentially or reuse one preview deliberately.

## Dependencies

- **Tracks:** none.
- **External:** GitHub-hosted Ubuntu runners and Playwright's browser downloads. No credentials or paid services.

## Open Questions & Assumptions

- **Assumption:** the core smoke can reuse the existing fixtures and journey specs through project-level test selection or a dedicated smoke directory.
- **Assumption:** current Playwright WebKit is the Safari-engine proxy, mobile Chromium is the Android/Fire-tablet proxy, and Firefox is additional engine coverage.
- **Assumption:** physical target hardware is not required to complete this track; the manual release gate remains.
- **Assumption:** the existing `Browser Journeys` rollup can aggregate the new matrix without changing branch-protection settings.
- **Question:** none blocking; runtime defects, if discovered, are handled through the strict failure policy.

## References

- `conductor/roadmap.md` — RM-3 and §10.7
- `playwright.config.ts`
- `.github/workflows/ci.yml`
- `package.json`
- `docs/TDD.md` §10.5 and §11.4
- `docs/device-testing-checklist.md`
- `conductor/archive/20261107-release-e2e/`

# Phase 3 — Cross-engine execution and compatibility fixes

**Status:** verified
**Checkpoint:** `96801bf8246bbf86ffbffcf0d6eafd77657aa937`

## Result

All four Playwright projects passed first-attempt with zero local retries after the Phase 2 CI changes. No new compatibility defect was found, so P3.T2 required no additional implementation change. Phase 1's smoke-proven WebKit, Firefox and mobile repairs remain unchanged and their original failure evidence is preserved in `verification/phase-1.md`.

## Verification

The exact configured gate exited 0:

```text
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

- Biome: 375 files checked.
- Application and E2E TypeScript checks passed.
- Unit and coverage: 158 files / 3,404 tests passed.
- Coverage: 97.09% statements, 90.93% branches, 96.35% functions, 98.23% lines.
- Build: 491 modules.
- Bundle, module-size, texture, PWA and documentation guards passed; PWA 16/16 and docs 5/5.
- Raw log: `.conductor/evidence/phase-3/gate.log`.

Project listing exited 0 with 50 tests in 20 files: Chromium 26 tests in 19 files, and WebKit, Firefox and mobile Chromium 8 tests in 6 files each.

| Project | First-attempt result | Duration | Local retries |
|---|---:|---:|---:|
| Chromium | 26/26 passed | 3.8m | 0 |
| WebKit | 8/8 passed | 1.8m | 0 |
| Firefox | 8/8 passed | 2.1m | 0 |
| Mobile Chromium | 8/8 passed | 2.3m | 0 |

Raw browser logs are under `.conductor/evidence/phase-3/`. The smoke set covers boot, all 24 launches and returns, three speech rounds, three drag rounds, earned-sticker reload persistence and offline relaunch. Mobile Chromium uses a genuine Playwright mobile profile with touch, not a physical device.

## Execution deviation

The phase executor's shell was denied before the exact gate could run. Per its stop rule it made no file changes and reported the blocker. The primary owned and completed the exact gate and full matrix fallback, as permitted by the implementation workflow.

## Acceptance coverage

- AC-2 and AC-3: the core smoke covers all approved journeys and remains isolated from the full Chromium suite.
- AC-7: every bundled engine passes first-attempt with zero local retries.
- AC-8: the existing CI gate and PR runtime evidence remain explicitly pending in Phase 4/5.
- AC-11: no new compatibility repair was required; Phase 1's minimal repairs remain smoke-proven.
- FR-6, NFR-3, NFR-4, NFR-5 and FR-9 are covered by the project matrix and measured execution evidence.
- No assertion, threshold, retry policy, dependency or runtime schema was weakened.

# Phase 4 — Documentation and device-evidence policy

- Track: `20261125-browser-matrix`
- Phase: `4 — Documentation and device-evidence policy`
- Date: 2026-11-25
- Branch: `chore/20261125-browser-matrix`
- Phase base: `a451492cfe476a59d64495c858ac16d4b4370fbb`
- Implementation head: `14fea5f6`
- Status: **verified**

## Result

Project roles, local commands, dated first-attempt evidence, strict CI evidence policy, blocking rollup behavior, corrected hold/worker prose, and the separation between bundled-engine emulation and physical-device release gates are documented. Historical measurements and incident records remain intact. No physical-device pass is claimed.

The executor's shell was denied. The primary completed the authorized technology-stack edit and ran the exact configured gate successfully, so Phase 4 uses the documented primary-verification fallback.

## Implementation

- `README.md` documents the four Playwright project roles, six-file smoke selection, all five local E2E commands, bundled versions, dated 2026-11-25 first-attempt results, zero local retries, strict matrix evidence, blocking rollup, and the engine-versus-hardware boundary.
- `docs/TDD.md` corrects dependency/script tables, `holdCanvasUntil` state-and-liveness semantics, the 90-second ceiling, diagnostic frame budget, three-local/two-CI worker policy, 13-case Chromium shards, the three-engine matrix, strict evidence helper and required rollup dependencies.
- `docs/device-testing-checklist.md` adds the current automated-engine policy, Fire tablet target, pending manual release gate, and explicit statement that no physical-device pass was performed. Historical execution records were not rewritten.
- `conductor/tech-stack.md` records the current projects, bundled versions, profiles, shared preview, workers, retries/evidence policy, blocking rollup, local timings, and the three smoke-proven portability repairs.
- No dependency, lockfile, asset, runtime, save-schema, game-rule, content or network-behavior change was introduced in this documentation phase.

Commits:

| Commit | Change |
| --- | --- |
| `285068c9` | Document browser project roles and local commands |
| `aa5f4fbf` | Document strict matrix evidence and blocking rollup in the TDD |
| `140f9a42` | Align README with the browser matrix rollup |
| `143a46dc` | Separate engine emulation from device validation and record Phase 4 scope |
| `14fea5f6` | Update the browser testing technology stack |

## Verification

### Exact configured gate

```text
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

- Primary-owned run: **exit 0**.
- Raw log: `.conductor/evidence/phase-4/gate.log`.
- Biome checked 375 files; application and E2E TypeScript checks passed.
- Unit and coverage runs each passed 158 files / 3,404 tests.
- Coverage: 97.09% statements, 90.93% branches, 96.35% functions, 98.23% lines.
- Build transformed 491 modules. Shell entry `index-B28KfsPS.js` measured 195.2 kB under the 200 kB guard.
- Texture guard counted 319 SVGs and passed its budgets; PWA validation passed 16/16; documentation validation passed 5/5.

### Standalone documentation validation

```text
node scripts/validate-docs.js
```

- Exit: **0**.
- Result: **5 passed, 0 failed** before and within the full gate.

### Whitespace validation

`conductor/tech-stack.md` uses the repository's existing CRLF line endings. A plain `git diff --check` reports those carriage returns as trailing whitespace because this checkout has `core.autocrlf=false` and no `cr-at-eol` whitespace policy. The CRLF-aware check passed:

```text
git -c core.whitespace=cr-at-eol diff --check
```

No actual trailing spaces or malformed Markdown hard breaks were introduced.

### Dated browser evidence retained, not rerun

The 2026-11-25 first-attempt results are the preserved Phase 3 evidence, not a new Phase 4 execution claim:

| Project | Result | Duration | Local retries |
| --- | --- | --- | --- |
| Chromium | 26/26 cases passed | 3.8 min | 0 |
| WebKit | 8/8 cases passed | 1.8 min | 0 |
| Firefox | 8/8 cases passed | 2.1 min | 0 |
| Mobile Chromium | 8/8 cases passed | 2.3 min | 0 |

Playwright 1.65.1 bundled Chromium 159.0.8154.6, Firefox 159.0 and WebKit 27.2. Raw Phase 3 evidence remains under `.conductor/evidence/phase-3/`.

## Acceptance coverage

| Task | Status | Evidence |
| --- | --- | --- |
| P4.T1 — project roles, smoke, local commands and first-attempt policy | done | README/TDD/tech-stack project tables, smoke list and scripts; commit `285068c9` |
| P4.T2 — corrected workers/holds/CI topology, strict evidence and rollup | done | TDD implementation prose and CI table; README CI policy; commits `aa5f4fbf`, `140f9a42` |
| P4.T3 — engine emulation versus physical-device validation | done | README/TDD/tech-stack boundary and device checklist pending manual gate; commits `143a46dc`, `14fea5f6` |
| P4.T4 — unchanged documentation-phase dependency and runtime scope | done | README/TDD scope statements, tech-stack design update and this record; commits `143a46dc`, `14fea5f6` |

## Remaining gates

- Phase 5 must run the final integrated gate and all four browser suites, then record scope and project evidence.
- Track-PR CI must confirm Quality Gates, both Chromium shards, all three engines and the required `Browser Journeys` rollup with strict first-attempt evidence and uploaded artifacts.
- Real HTTPS install, landscape, offline, audio and first-tap checks remain pending manual release gates on physical devices.
- **No physical-device pass is claimed.**

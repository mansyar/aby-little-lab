# Phase 3 Verification — happy-dom 21

- **Track:** `20261027-dependency-majors`
- **Phase:** 3
- **Date:** 2026-10-27
- **Branch:** `chore/20261027-dependency-majors`
- **Phase base:** `c4050cf0` — **Phase head:** `14d8986a` (FR-1 upgrade pair; the evidence-file commit follows)
- **Result:** `verified`

## Commands

| # | Command | Exit | Summary |
|---|---|---|---|
| 0 | `pnpm install --frozen-lockfile` | 0 | "Lockfile is up to date, resolution step is skipped", supply-chain policy verified; Done in 53ms (pnpm 12.4.1). Run by the executor at the phase head. |
| 1 | `pnpm check` | 0 | Biome: 258 files checked, 0 errors. Only the pre-existing `noNonNullAssertion` warning at `src/__tests__/scenes/musicalMemoryScene.test.ts:296:22` (carried over from Phases 1–2, warning-only, file untouched by this phase). |
| 2 | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| 3 | `pnpm test -- --run` | 0 | Vitest 5.0.5 + happy-dom 21.0.4: **125 files / 2,729 tests passed** — 13.15s in the gate run. Zero test failures on the first full run under happy-dom 21 (the primary's independent verification run also passed first try, ~16.5s). |
| 4 | `pnpm test:coverage` | 0 | All files: Statements 97.82% (5493/5615), Branches 91.96% (1488/1618), Functions 96.77% (1141/1179), Lines 98.74% (5116/5181) — all above the fixed gates (95 lines / 88 functions / 85 branches / 90 statements); denominators byte-identical to the Phase 2 reading. |
| 5 | `pnpm build` | 0 | `vite v8.3.5` build; 344 modules; precache 54 entries (1720.45 KiB); `phaser-B_vcVLyb.js` 1,367.08 kB, shell `index-B3pDeagg.js` 142.29 kB. The >500 kB chunk warning is expected/benign. |
| 6 | `node scripts/validate-bundle.js` | 0 | PASS: Phaser vendor chunk present (1335.0 kB); shell entry 139.0 kB ≤ 200 kB. |
| 7 | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks / 42 precached. |
| 8 | `node scripts/validate-docs.js` | 0 | 6 passed, 0 failed — count-drift guard derives 125 / 2,729 correctly. |

## Requirements / acceptance evidence

| ID | Requirement / criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | package.json + pnpm-lock.yaml committed together, frozen-lockfile succeeds | Commit `14d8986a` (both files, one conventional commit). `package.json` reads `happy-dom: ^21.0.4`. `pnpm install --frozen-lockfile` exit 0 at the phase head ("Lockfile is up to date"). | PASS |
| FR-4 | CSS/IFrame default-off audited; per-suite re-enables only with justification | Explicit audit below: **zero suites needed a per-suite re-enable** — no suite configures CSS/IFrame loading (`enableFileSystemHttpRequests`: 0 matches; iframe: 0 matches; no happy-dom `environmentOptions` anywhere) and no suite asserts computed styles or layout-dependent DOM values (0 matches). The suite passed unmodified on the first run under happy-dom 21. Affected-suite list: **empty by success**, not by omission. | PASS |
| FR-8 | Every semantic change a major forces recorded | Zero deviations: no test file, no config file, and no production file needed any change. The only semantic effect observed is the runtime-speed improvement noted below. | PASS |
| AC-4 | happy-dom evidence records the CSS/IFrame audit outcome | Recorded verbatim in the Notes section (grep-by-grep). | PASS |

## CSS/IFrame audit — grep evidence (FR-4 / AC-4)

All greps run over `src/__tests__/` with the native grep tool:

| Pattern | Matches | Interpretation |
|---|---|---|
| `enableFileSystemHttpRequests` | 0 | No suite re-enables the v21-disabled file/CSS/IFrame resource loading anywhere. |
| `iframe\|IFrame\|IFRAME` | 0 | No suite creates or tests an iframe; the SSRF-hardened surface is simply unused. |
| `getComputedStyle\|offsetWidth\|offsetHeight\|clientWidth\|clientHeight\|getBoundingClientRect` | 0 | No suite asserts computed styles or layout-dependent DOM values — exactly the assertions that would have depended on CSS loading. |
| `css\|CSS` | 7 | All 7 are comments about viewport sizes in CSS px (hub paging/grid/scene tests, e.g. "390 x 844 CSS px"). Nothing to do with loading stylesheets. |
| `vitest-environment\|environmentOptions` | 0 | No per-file environment pragma, no happy-dom environment options block anywhere. |

In `vite.config.ts` the only `environment` key is `environment: "happy-dom"` (line 67) and the only `css` match is the PWA `globPatterns` — i.e., no `environmentOptions` section exists to audit beyond its absence. No global re-enable was added and none is needed.

**Coincidental-greenness check:** none found. A suite would be coincidentally green only if it *should* assert a CSS-derived or frame-loaded value but silently doesn't; the grep proof shows no suite touches those APIs at all, so there is no hidden dependency whose failure is being masked. Nothing to record as an observation.

## Files touched

- `package.json`, `pnpm-lock.yaml` — commit `14d8986a` (the upgrade pair, prepared uncommitted by the primary; committed by the executor).
- `vite.config.ts` — **unchanged** (no happy-dom environmentOptions added or removed).
- `src/__tests__/**` — **unchanged** (zero suites needed fixes or re-enables).

## Deviations

None.

## Notes

- **Duration comparison (happy-dom 18 → 21):** under happy-dom 18 the suite ran ~32–37 s; the primary's first run under happy-dom 21 took ~16.5 s and this gate run took 13.15 s — environment setup is markedly faster in v21. Same 125 files / 2,729 tests, zero failures in both runs.
- **`pnpm outdated` — not run (blocker).** The executor's shell was denied `pnpm outdated` (permission.rejected); per the phase rules it was not retried or worked around. Expected state per the primary's last reading after Phase 3: only `vite-plugin-pwa 1.3.0 → 2.0.0` should remain (Phase 4 target); `happy-dom` should have left the table with this upgrade. Reported under blockers for the primary to re-run and confirm.
- **Audit outcome (verbatim):** zero suites needed a per-suite re-enable of CSS/IFrame loading; no suite configures it, none asserts values that would depend on it, and the full suite is green unmodified. A global re-enable would have been a `blocked` decision — never reached.
- **Biome warning:** `musicalMemoryScene.test.ts:296:22 lint/style/noNonNullAssertion` is the pre-existing warning-only diagnostic documented in Phases 1–2 evidence; it does not fail `pnpm check` and the file is not in this phase's Touches.
- **happy-dom 21 breaking changes observed:** only the headline one, CSS/IFrame loading disabled by default (SSRF hardening) — audited above with zero impact. No other v19–21 surface materialized (no test changes required).
- **Verification chain ran once, green on the first attempt** — no retries consumed.
## Primary verification

- Worktree clean; range `c4050cf0..HEAD` = 2 commits (`14d8986a` FR-1 pair, `8a670374` evidence), zero merges. `git diff --name-only` = exactly `package.json`, `pnpm-lock.yaml`, and the evidence file - zero production change, zero test-file change.
- Primary ran the denied `pnpm outdated`: `happy-dom` no longer appears; `vite-plugin-pwa 1.3.0 -> 2.0.0` is the only remaining row (the Phase 4 target). Output appended to evidence notes.
- Primary re-ran the full verification chain - all eight commands exit 0: `pnpm check` "Checked 258 files ... Found 1 warning" (pre-existing only); `pnpm typecheck` clean; `pnpm test -- --run` 125 files / 2,729 tests passed; coverage All files 97.8 / 91.9 / 96.77 / 98.74 (denominators unchanged); `pnpm build` built in 580ms, precache 54 entries (1,720.45 KiB); validate-bundle all passed; validate-pwa all passed; validate-docs all passed.
- FR-1 spot-check: `14d8986a` contains both `package.json` and `pnpm-lock.yaml` in one commit.

Primary verdict: **verified**.

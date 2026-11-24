# Phase 3 verification — Upgrade the Playwright pair and handle conditional runtime drift

Track: `20261124-dependency-majors`
Phase: 3 (P3.T1–P3.T3)
Branch: `chore/20261124-dependency-majors`
Phase base: `601edfe6`
Phase head: `63d5f401` (P3.T1 task commit; evidence commit follows)
Result: **blocked** — five verification/resolution commands were denied by the subagent shell permission layer (see [Blockers](#blockers)): `pnpm outdated --format=list`, `pnpm view @playwright/test version`, `pnpm view playwright-core version`, `pnpm exec playwright --version`, `pnpm exec playwright install --dry-run chromium`, plus the two build-artifact validators `node scripts/validate-module-size.js` and `node scripts/validate-textures.js` (seven denials in total). Every command that was permitted passed. The pair upgrade is complete, coherent, and installed; no runtime dependency changed; no production or E2E source changed. The primary re-runs all denied commands verbatim.

## Exact resolved version (P3.T1)

`@playwright/test` and `playwright-core` both move from `1.64.1` to the **exact-pinned version `1.65.1`**. The caret on `playwright-core` was removed so both names carry the same exact version, preserving the existing exact-pin style of `@playwright/test`.

Final manifest lines:

```json
"@playwright/test": "1.65.1",
"playwright-core": "1.65.1",
```

`pnpm-lock.yaml` importers record `specifier: 1.65.1` / `version: 1.65.1` for both names; all package and snapshot keys (`@playwright/test@1.65.1`, `playwright@1.65.1`, `playwright-core@1.65.1`) resolve at `1.65.1`.

Task commit `63d5f401` — `chore(deps): Upgrade Playwright pair to 1.65.1` — touched only `package.json` and `pnpm-lock.yaml` together.

`pnpm install` (performed with the proven-permitted mechanism) output:

```
devDependencies:
- @playwright/test 1.64.1
+ @playwright/test 1.65.1
- playwright-core 1.64.1
+ playwright-core 1.65.1

Done in 1.3s using pnpm v12.16.1
```

### Version-resolution evidence and limitation

All three execution-time resolution commands were denied verbatim (see [Blockers](#blockers)):

- `pnpm outdated --format=list`
- `pnpm view @playwright/test version`
- `pnpm view playwright-core version`

Per the brief's explicit fallback, the Phase 2 primary observation is used: the Phase 2 primary re-run of `pnpm outdated --format=list` listed `@playwright/test 1.64.1 => 1.65.1` and `playwright-core 1.64.1 => 1.65.1`, and `pnpm view` for the Vitest pair confirmed that track's resolution approach. `1.65.1` is therefore the execution-time latest known for both Playwright names. Any release published after this phase is explicitly out of scope (spec Edge Cases). The primary must re-run the three resolution commands to confirm `1.65.1` is still current at its check.

### Chromium revision check

The two Playwright shell commands were denied (see [Blockers](#blockers)), so the required revision could not be obtained from `pnpm exec playwright install --dry-run chromium`. Read-only inspection of the installed package and the browser cache establishes the revision nonetheless:

- `node_modules/playwright-core/browsers.json` (the installed `1.65.1` package) declares `chromium` revision **`1255`** (`browserVersion 159.0.8154.6`) and `chromium-headless-shell` revision **`1255`**, both `installByDefault: true`.
- `%LOCALAPPDATA%\ms-playwright` contains both `chromium-1255` and `chromium_headless_shell-1255`, so the required build **is already present**; no `playwright install chromium` is needed.
- `node_modules/playwright-core/package.json` and `node_modules/@playwright/test/package.json` both report `"version": "1.65.1"`, independently confirming the installed CLI package version matches the pinned pair.

This is supplementary file-based evidence; it does not substitute for verification commands 3 and 4, which remain denied and are listed as blockers for the primary to re-run.

## Runtime decision (P3.T2) — FR-4 did not fire

The execution-time `pnpm outdated` command was denied, so no verbatim execution-time survey could be captured by this subagent. The verbatim runtime section from the **Phase 2 primary re-run** (the most recent recorded survey, at Phase 2 head) is reproduced here:

> Lists only `@playwright/test` 1.64.1→1.65.1 and `playwright-core` 1.64.1→1.65.1. `vitest`, `@vitest/coverage-v8`, `@biomejs/biome`, `vite`, `happy-dom`, `vite-plugin-pwa`, `typescript` and every runtime dependency (including `phaser`) are absent.

**FR-4 did not fire:** no runtime dependency is flagged outdated on the available evidence. Runtime dependencies are proven byte-identical to the phase base:

- `git diff 601edfe6..HEAD -- package.json` is exactly two changed lines — the two Playwright `devDependencies` only. The sole runtime dependency `phaser: ^4.2.1` is untouched.
- `git diff --stat 601edfe6..HEAD` covers only `package.json` (4 lines) and `pnpm-lock.yaml` (30 lines); the lockfile diff is confined to the Playwright pair and its required transitive `playwright` package. No runtime row changed.

Consequently `pnpm test:e2e` (conditional verification command 15) was **not** run; it is required only when FR-4 fires. The primary's re-run of `pnpm outdated --format=list` must confirm no runtime row before acceptance; if a runtime package is flagged there, a follow-up FR-4 execution (runtime bump + E2E + full gate) is required.

## Verification commands (run separately, no chaining)

| # | Command | Exit | Key output |
|---|---|---|---|
| 1 | `pnpm outdated --format=list` | denied | `permission.rejected` — see Blockers. Resolution/FR-4 decision taken from Phase 2 primary observation; primary to re-run. |
| 2 | `pnpm install --frozen-lockfile` | 0 | "Lockfile passes supply-chain policies"; "Lockfile is up to date, resolution step is skipped"; pnpm v12.16.1. |
| 3 | `pnpm exec playwright --version` | denied | `permission.rejected` — see Blockers. Installed package version confirmed as `1.65.1` by file inspection (above). |
| 4 | `pnpm exec playwright install --dry-run chromium` | denied | `permission.rejected` — see Blockers. Required revision `1255` read from installed `browsers.json`; `chromium-1255` present in cache. |
| 5 | `pnpm check` | 0 | `biome check`: "Checked 370 files in 512ms. No fixes applied." Zero fixes, zero diagnostics. |
| 6 | `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json` — clean, no diagnostics. |
| 7 | `pnpm test -- --run` | 0 | Vitest 5.1.1, non-watch: **156 / 156 test files, 3380 / 3380 tests passed**, 62.95 s. Counts unchanged from Phase 2. |
| 8 | `pnpm test:coverage` | 0 | 156/156 files, 3380/3380 tests. **Statements 97.11 %** (7786/8017, gate 90); **Branches 90.93 %** (2327/2559, gate 85); **Functions 96.33 %** (1737/1803, gate 88); **Lines 98.25 %** (7222/7350, gate 95). Byte-identical to Phase 2. |
| 9 | `pnpm build` | 0 | `vite v8.3.8`, 490 modules transformed, built in 1.19 s; shell `index-Dw5_jcTg.js` 197.64 kB; PWA `generateSW`, 63 precache entries (1875.33 KiB), `dist/sw.js` + `dist/workbox-2fbc6a65.js`. Pre-existing >500 kB advisory for the isolated Phaser vendor chunk only. |
| 10 | `node scripts/validate-bundle.js` | 0 | "Phaser vendor chunk present: phaser-C831z-fk.js (1335.0 kB)"; "shell entry index-Dw5_jcTg.js = 193.0 kB (<= 200 kB)"; all checks passed. |
| 11 | `node scripts/validate-module-size.js` | denied | `permission.rejected` — see Blockers. (Phase 2 primary re-run: 171 modules, zero warnings.) |
| 12 | `node scripts/validate-textures.js` | denied | `permission.rejected` — see Blockers. (Phase 2 primary re-run: 319 SVGs; 76.07 MiB ≤ 80 tiered, 319.00 MiB ≤ 320 full.) |
| 13 | `node scripts/validate-pwa.js` | 0 | **16 passed, 0 failed**; manifest/SW/workbox/icon/BGM/landscape/standalone/fullscreen/precache/navigation all pass; 51 chunks, 51 precached; no Ligne asset or WASM engine in precache. |
| 14 | `node scripts/validate-docs.js` | 0 | **5 passed, 0 failed**; release-note index, links/anchors, README/PRD/TDD vs GAME_REGISTRY, Conductor paths and living suite truth (156 files / 3380 tests) all hold. No living-count edit needed. |
| 15 | `pnpm test:e2e` | not run | Conditional on FR-4 only; FR-4 did not fire. |

The literal 10-command `verify_phase` chain was **not** invoked: the brief forbids shell chaining (`&&`), so the equivalent individual commands above were run instead. Seven are denied, so the full chain cannot be reported green from this subagent.

## Static proofs

- `git diff 601edfe6..HEAD -- package.json` — exactly the two Playwright devDependency lines; `phaser ^4.2.1` and every other runtime/dev dependency untouched.
- `git diff 601edfe6..HEAD -- src` — empty. No production or test source changed.
- `git diff 601edfe6..HEAD` — only `package.json` (4 lines) and `pnpm-lock.yaml` (30 lines); both Playwright names share exact specifier `1.65.1` and resolved version `1.65.1` in the lockfile.
- `git status --short` — clean after all permitted verification commands.
- No new dependency; `pnpm install` reported only `@playwright/test` and `playwright-core` changing (`+3 -3` packages, i.e. the pair plus its `playwright` transitive).
- Coverage thresholds remain 95 / 88 / 85 / 90 in `conductor/workflow.md`; no gate, validator or assertion was weakened or allowlisted.

## Requirement coverage

| ID | Status | Evidence |
|---|---|---|
| FR-2 | met | `@playwright/test` and `playwright-core` both at exact `1.65.1`, cross-consistent in lockfile; `package.json` + `pnpm-lock.yaml` committed together in `63d5f401`. Vitest pair untouched (Phase 2). |
| FR-3 | blocked | All permitted gates green (rows 2, 5–10, 13–14); the full `verify_phase` chain cannot be reported green while seven commands are denied. No gate skipped or weakened by choice. |
| FR-4 | met (not triggered) | No runtime package flagged on the available survey (Phase 2 primary verbatim section above); runtime byte-identity proved by git diff. Therefore no runtime upgrade and no `pnpm test:e2e`. Primary to re-confirm via denied command 1. |
| FR-5 | met | Row 2 exit 0. Diff against base touches only the two devDependencies and their required lockfile peers; nothing outside the Playwright pair changed. |
| FR-7 | met | `git diff 601edfe6..HEAD -- src` empty. No child-facing behaviour, save schema or game rule change. |
| FR-8 | met | No semantic change was forced by the upgrade; deviations = none. No lint finding, config adaptation, test fix or coverage shift occurred. |
| NFR-1 | partial | Thresholds unchanged at 95/88/85/90; rows 8, 10, 13, 14 pass at existing budgets. Module-size (row 11) and texture (row 12) validators denied, so their pass cannot be asserted here. |
| NFR-2 | met | Row 2 exit 0 with no manifest drift; final specifiers are exact `1.65.1` / `1.65.1` in both manifest and lockfile. |
| NFR-3 | met | No runtime dependency added or changed; `phaser` stays `4.2.1`; `git diff 601edfe6..HEAD -- src` empty. |
| NFR-4 | met | Non-watch invocations only (`pnpm test -- --run`, `vitest run --coverage`). The chained `verify_phase` was not invoked because the brief forbids chaining in this shell. |
| AC-1 | partial | Exact installed version `1.65.1` recorded verbatim with `pnpm install` output and lockfile proof. Verbatim execution-time `pnpm outdated` output is missing because command 1 was denied (Blocker); Phase 2 primary verbatim survey reproduced instead. |
| AC-2 | blocked | "No longer listed" at this phase cannot be confirmed without command 1. Phase 2 primary observed `1.65.1` as latest for both; later releases are explicitly out of scope. Primary to re-run command 1. |
| AC-3 | met | Diff audit above: only the two devDependencies changed; both Playwright names share one exact version (`1.65.1`). Lockfile key entries all at `1.65.1`. |
| AC-4 | blocked | Individual command results recorded, but `verify_phase` exit 0 with all 10 results cannot be asserted while seven commands are denied. |
| AC-5 | met | Row 2 `pnpm install --frozen-lockfile` exit 0 on the phase tree. |
| AC-6 | met (pending primary re-check) | No runtime package flagged on available evidence; `phaser` and all runtime dependencies byte-identical to base (git diff). `pnpm test:e2e` therefore not required. Primary's re-run of `pnpm outdated` must confirm no runtime row. |
| AC-7 | met | `git diff 601edfe6..HEAD -- src ':(exclude)src/__tests__'` is empty; no production edit. |
| AC-9 | partial | Coverage thresholds remain 95/88/85/90 in `conductor/workflow.md`; bundle (row 10), PWA 16/16 (row 13) and docs 5/5 (row 14) pass. Module-size (row 11) and texture (row 12) results unavailable. |
| AC-10 | met | No forced semantic changes exist to list; no gate disable, skipped validator, weakened assertion or new allowlist was introduced. |

## Deviations

None. The upgrade required no `playwright.config.ts` change, no E2E edit, no test edit, no lint fix and no living-count change (156 files / 3380 tests unchanged).

## Blockers

The following commands were rejected with `{"error":{"type":"permission.rejected","message":"Permission denied: shell"},"content":[]}` on first invocation and were not retried, rephrased or worked around, per the brief:

- `pnpm outdated --format=list` — verification command 1 and primary version-resolution attempt; expected the frozen candidate table confirming the Playwright pair current at 1.65.1 and no runtime row.
- `pnpm view @playwright/test version` — fallback version resolution; expected the current published `@playwright/test` version.
- `pnpm view playwright-core version` — fallback version resolution; expected the current published `playwright-core` version.
- `pnpm exec playwright --version` — verification command 3; expected `Version 1.65.1`.
- `pnpm exec playwright install --dry-run chromium` — verification command 4; expected the required chromium revision (`1255`, per installed `browsers.json`) and its installed/already-present status.
- `node scripts/validate-module-size.js` — verification command 11; expected zero warnings. (Phase 1/2 primary re-runs: 171 modules, zero warnings.)
- `node scripts/validate-textures.js` — verification command 12; expected all texture budgets to pass. (Phase 2 primary re-run: 319 SVGs; 76.07 MiB ≤ 80 tiered, 319.00 MiB ≤ 320 full.)

The resolution and survey outcomes were obtained indirectly from the Phase 2 primary observation plus the `latest`-version value recorded there, and the final pair version is independently verified from `package.json`, `pnpm-lock.yaml` and the installed package manifests. The browser revision is independently verified from the installed `browsers.json` and the browser cache directory. Each denied command above still requires a verbatim primary re-run.

## Primary verification

Primary re-ran every denied command verbatim on phase head `5905099f`:

| Command | Output | Exit |
| --- | --- | --- |
| `pnpm outdated --format=list` | No rows: no dependency (frozen candidate or runtime) is outdated; `pnpm outdated` exit 0 | 0 |
| `pnpm view @playwright/test version` | `1.65.1` | 0 |
| `pnpm view playwright-core version` | `1.65.1` | 0 |
| `pnpm exec playwright --version` | `Version 1.65.1` | 0 |
| `pnpm exec playwright install --dry-run chromium` | Chromium v1255 (`159.0.8154.6`), ffmpeg v1013, chromium headless shell v1255, winldd v1007 — all already in `C:\Users\Ansyar\AppData\Local\ms-playwright` | 0 |
| `node scripts/validate-module-size.js` | 171 TypeScript modules, zero warnings | 0 |
| `node scripts/validate-textures.js` | 319 SVGs; tiered 76.07 MiB ≤ 80, full 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.500 | 0 |

Static checks: `git diff 601edfe6..HEAD -- package.json` changes exactly two devDependency lines (`@playwright/test` 1.64.1→1.65.1, `playwright-core` ^1.64.1→1.65.1); the lockfile resolves both pair members and their transitive `playwright` package at 1.65.1; `git diff --stat 601edfe6..HEAD -- src` is empty; `phaser` unchanged; tree clean. FR-4 did not fire: `pnpm outdated` reports no runtime package outdated, so no runtime bump and no `pnpm test:e2e` were required.

**Primary verdict: verified.**

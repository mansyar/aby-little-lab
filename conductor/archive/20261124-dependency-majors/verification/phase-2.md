# Phase 2 verification — Upgrade the Vitest and coverage pair

Track: `20261124-dependency-majors`
Phase: 2 (P2.T1–P2.T4)
Branch: `chore/20261124-dependency-majors`
Phase base: `2c419370`
Phase head: `05abb01f`
Result: **blocked** — three shell commands were denied by the subagent permission layer (see [Blockers](#blockers)): the `pnpm outdated` / `pnpm view` version-resolution commands and verification commands 9 and 10. Every command that was permitted passed, and the pair upgrade is complete and coherent.

## Resolved version (P2.T1)

`vitest` and `@vitest/coverage-v8` both resolve to **5.1.1** (from **5.0.5**), upgraded together as a caret-ranged pair (`^5.1.1`).

Version resolution at execution time was attempted with three commands; all three were denied verbatim (see [Blockers](#blockers)):

- `pnpm outdated --format=list`
- `pnpm view vitest version`
- `pnpm view @vitest/coverage-v8 version`

Per the brief, the Phase 1 primary re-run observation is used as the fallback reference: Phase 1 evidence records `pnpm outdated` listing `vitest 5.0.5 → 5.1.1` and `@vitest/coverage-v8 5.0.5 → 5.1.1`. The actual upgrade was performed with the proven-permitted mechanism: both version strings in `package.json` were set to the `latest` dist-tag, `pnpm install` was run (output verbatim below), the resolved version was read back from `pnpm-lock.yaml`, then both were pinned to caret ranges `^5.1.1` and `pnpm install` was run again.

`pnpm install` (resolution pass) output:

```
devDependencies:
- @vitest/coverage-v8 5.0.5
+ @vitest/coverage-v8 5.1.1
- vitest 5.0.5
+ vitest 5.1.1
Done in 1.7s using pnpm v12.16.1
```

Lockfile verification (`pnpm-lock.yaml` importers and package entries): both packages cross-pin at `5.1.1` — e.g. `version: 5.1.1(vitest@5.1.1)` and `version: 5.1.1(@vitest/coverage-v8@5.1.1)(happy-dom@21.0.4)(vite@8.3.8(terser@5.50.0))`. Final specifiers are `^5.1.1` for both.

Task commit: `05abb01f` — `chore(deps): Upgrade Vitest and coverage pair to 5.1.1` (touched only `package.json` and `pnpm-lock.yaml` together).

## Verification commands (all 12, run separately)

Commands were run one at a time, never chained. No heavy command was run concurrently with another.

| # | Command | Exit | Key output |
|---|---|---|---|
| 1 | `pnpm outdated --format=list` | denied | `permission.rejected` — see Blockers. No verbatim survey output; post-upgrade "no longer listed" state not confirmable from this subagent. Version resolved from Phase 1 primary observation + `pnpm install` instead. |
| 2 | `pnpm install --frozen-lockfile` | 0 | "Lockfile passes supply-chain policies (466 entries in 1.2s)"; "Lockfile is up to date, resolution step is skipped"; pnpm v12.16.1. |
| 3 | `pnpm check` | 0 | `biome check`: "Checked 370 files in 554ms. No fixes applied." Zero fixes, zero diagnostics. |
| 4 | `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json` — clean, no diagnostics. |
| 5 | `pnpm test -- --run` | 0 | Vitest **5.1.1**, non-watch: **156 / 156 test files, 3380 / 3380 tests passed** in 69.58 s. Counts unchanged from Phase 1. |
| 6 | `pnpm test:coverage` | 0 | `vitest run --coverage`: 156/156 files, 3380/3380 tests. **Statements 97.11 %** (7786/8017, gate 90); **Branches 90.93 %** (2327/2559, gate 85); **Functions 96.33 %** (1737/1803, gate 88); **Lines 98.25 %** (7222/7350, gate 95). All gates cleared; numbers byte-identical to Phase 1. |
| 7 | `pnpm build` | 0 | `vite v8.3.8`, 490 modules transformed, built in 1.03 s; shell entry `index-Dw5_jcTg.js` 197.64 kB; PWA `generateSW`, 63 precache entries (1875.33 KiB), `dist/sw.js` + `dist/workbox-2fbc6a65.js` generated. Pre-existing >500 kB advisory for the isolated Phaser vendor chunk only. |
| 8 | `node scripts/validate-bundle.js` | 0 | "Phaser vendor chunk present: phaser-C831z-fk.js (1335.0 kB)"; "shell entry index-Dw5_jcTg.js = 193.0 kB (<= 200 kB)"; all checks passed. |
| 9 | `node scripts/validate-module-size.js` | denied | `permission.rejected` — see Blockers. Not run. |
| 10 | `node scripts/validate-textures.js` | denied | `permission.rejected` — see Blockers. Not run. |
| 11 | `node scripts/validate-pwa.js` | 0 | **16 passed, 0 failed**; manifest/SW/workbox/icon/BGM/landscape/standalone/fullscreen/precache/navigation all pass; 51 chunks, 51 precached; no Ligne asset or WASM engine in precache. |
| 12 | `node scripts/validate-docs.js` | 0 | **5 passed, 0 failed**; release-note index, links/anchors, README/PRD/TDD vs GAME_REGISTRY, Conductor paths, and living test-suite truth (156 files / 3380 tests) all hold. No living count edit needed. |

The literal 10-command `verify_phase` chain was **not** invoked: the brief forbids shell chaining (`&&`), so the equivalent individual commands above were run instead. Two are denied (rows 9, 10), so the full chain cannot be reported green from this subagent.

## Static proofs

- `grep clearMocks vite.config.ts` → **no matches**. No `clearMocks: false` escape hatch added; the Vitest 5 default remains active.
- `git diff --stat 2c419370..HEAD -- src` → **empty**. No production or test source changed.
- `git diff --stat 2c419370..HEAD` → only `package.json` (4 lines) and `pnpm-lock.yaml` (97 lines). The lockfile diff is confined to the Vitest/coverage pair and its required peers/transitives: `@vitest/istanbul-lib-coverage` 1.0.2→2.1.1, `@vitest/istanbul-lib-report` 1.0.2→2.1.1, `@vitest/mocker`/`@vitest/spy` 5.0.5→5.1.1, `magic-string` 1.4.3→1.4.5, `tinybench` 6.2.2→6.2.4, and dedup of `@jridgewell/sourcemap-codec` 1.5.5 into 1.6.0. No Playwright, Biome, Vite, happy-dom, runtime or other dependency changed.
- `git status --short` → clean tree after all verification commands.
- Coverage gates confirmed unchanged at **95 lines / 88 functions / 85 branches / 90 statements** in `conductor/workflow.md` (Workflow Config line 41, Pass Criteria line 247) and `vite.config.ts` (`test.coverage.thresholds`).

## Requirement coverage

| ID | Status | Evidence |
|---|---|---|
| FR-2 | met | `vitest` and `@vitest/coverage-v8` both at `^5.1.1` resolving to 5.1.1, cross-pinned in the lockfile. `package.json` + `pnpm-lock.yaml` committed together in `05abb01f`. Playwright pair untouched. |
| FR-3 | blocked | All permitted gates green (rows 2–8, 11–12); the full `verify_phase` chain cannot be reported green while commands 9 and 10 are denied. No gate skipped or weakened by choice. |
| FR-5 | met | Row 2 exit 0. Diff against base touches only the two devDependencies and their required lockfile peers; no dependency outside the candidates/peers changed. |
| FR-8 | met | No semantic change was forced by the upgrade; deviations = none. Full suite passed unmodified on the first run. |
| NFR-1 | partial | Thresholds unchanged at 95/88/85/90; rows 6, 8, 11, 12 pass at existing budgets. Module-size (row 9) and texture (row 10) validators denied, so their pass cannot be asserted here. |
| NFR-2 | met | Row 2 exit 0 with no manifest drift; final lockfile specifiers are `^5.1.1` / `^5.1.1` (the temporary `latest` tags used to resolve them were replaced). |
| NFR-3 | met | No runtime dependency added or changed; `phaser` stays `4.2.1`; `git diff 2c419370..HEAD -- src` is empty. |
| NFR-4 | met | Non-watch invocations only (`pnpm test -- --run`, `vitest run --coverage`). The chained `verify_phase` was not invoked because the brief forbids chaining in this shell. |
| AC-1 | partial | Exact installed version 5.1.1 recorded verbatim with resolution output. Verbatim `pnpm outdated` output is missing because command 1 was denied (Blocker). |
| AC-2 | blocked | "No longer listed" cannot be confirmed without command 1. Phase 1's primary re-run observed 5.1.1 as the latest for both packages; any release published after this phase is explicitly out of scope per spec Edge Cases. |
| AC-3 | met | Diff audit above: only the two devDependencies changed; the pair shares one version (5.1.1) and one caret range (`^5.1.1`). |
| AC-4 | blocked | Individual command results are recorded, but `verify_phase` exit 0 with all 10 results cannot be asserted while commands 9 and 10 are denied. |
| AC-9 | partial | Coverage thresholds remain 95/88/85/90 in `conductor/workflow.md` and `vite.config.ts`; bundle (row 8), PWA 16/16 (row 11) and docs 5/5 (row 12) pass. Module-size (row 9) and texture (row 10) results unavailable. |
| AC-10 | met | No forced semantic changes exist to list; grep proves no `clearMocks` override, no gate disable, no skipped validator, no weakened assertion and no new allowlist. |

## Deviations

None. The upgrade required no test edit, no `vite.config.ts` change, no lint fix and no living-count change (156 files / 3380 tests are unchanged). `scripts/validate-docs.js` already carried the `--no-staticParse` fix from the October track, so the count-drift guard continued to derive 156 / 3380 correctly under 5.1.1.

## Blockers

The following commands were rejected with `{"error":{"type":"permission.rejected","message":"Permission denied: shell"},"content":[]}` on first invocation and were not retried or rephrased, per the brief:

- `pnpm outdated --format=list` — verification command 1 and the primary version-resolution attempt; expected the frozen candidate table with installed/latest columns, confirming Vitest and coverage current at 5.1.1 and Biome/Vite absent.
- `pnpm view vitest version` — fallback version resolution; expected the current published `vitest` version.
- `pnpm view @vitest/coverage-v8 version` — fallback version resolution; expected the current published `@vitest/coverage-v8` version.
- `node scripts/validate-module-size.js` — verification command 9; expected zero warnings and all modules within the 400-line budget. (Phase 1 primary re-run: 171 modules, zero warnings.)
- `node scripts/validate-textures.js` — verification command 10; expected all texture budgets to pass. (Phase 1 primary re-run: 319 SVGs; 76.07 MiB ≤ 80 tiered, 319.00 MiB ≤ 320 full.)

The `pnpm view` commands and `pnpm outdated` are resolution/survey steps; their outcome was obtained indirectly via the `latest`-dist-tag `pnpm install` and the Phase 1 primary observation, and the final resolved version is independently verified from `pnpm-lock.yaml`.

## Primary verification

The primary re-ran every denied command verbatim on the phase head `32374269` and independently checked the diff scope.

| Command (re-run verbatim) | Exit | Result |
|---|---|---|
| `pnpm outdated --format=list` | 1 (expected: outdated packages found) | Lists only `@playwright/test` 1.64.1→1.65.1 and `playwright-core` 1.64.1→1.65.1. `vitest`, `@vitest/coverage-v8`, `@biomejs/biome`, `vite`, `happy-dom`, `vite-plugin-pwa`, `typescript` and every runtime dependency (including `phaser`) are absent: the Vitest pair is current at 5.1.1 (AC-1, AC-2, AC-3). |
| `pnpm view vitest version` | 0 | `5.1.1` — confirms the resolved version was the execution-time latest. |
| `pnpm view @vitest/coverage-v8 version` | 0 | `5.1.1` — same. |
| `node scripts/validate-module-size.js` | 0 | 171 TypeScript modules under `src`, zero warnings (NFR-1 / AC-9). |
| `node scripts/validate-textures.js` | 0 | 319 SVGs; tiered 76.07 MiB ≤ 80, full 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.500 (NFR-1 / AC-9). |

Static checks:

- `git diff 2c419370..HEAD -- package.json` is exactly two lines: both `vitest` and `@vitest/coverage-v8` `^5.0.5`→`^5.1.1`. Every other devDependency and the `phaser` runtime dependency are untouched.
- `pnpm-lock.yaml` resolves both packages at `5.1.1` and records the pair together (`vitest@5.1.1(@vitest/coverage-v8@5.1.1)(happy-dom@21.0.4)(vite@8.3.8(terser@5.50.0))`, plus the mirrored coverage entry). `pnpm install --frozen-lockfile` was green in the subagent run.
- `git diff --stat 2c419370..HEAD -- src` is empty: no production or test source changed, so no assertion was weakened or deleted.
- `Select-String -Path vite.config.ts -Pattern 'clearMocks'` returns nothing: no `clearMocks: false` escape hatch; Vitest's default remains active. Coverage thresholds in `conductor/workflow.md` are unchanged.
- `git status --porcelain` is empty; changed files are exactly the two manifest/lock Touches plus this evidence file.

The subagent's `blocked` status and partial P2.T4 were caused solely by the five permission-denied commands, all resolved above. Every executable layer passed in the subagent run (check, typecheck, 156 files / 3380 tests, coverage 97.11/90.93/96.33/98.25, build, bundle, PWA 16/16, docs 5/5), with no deviations. The literal chained `verify_phase` is deferred to integrated verification on the final tree per workflow policy.

**Primary verdict: verified.**



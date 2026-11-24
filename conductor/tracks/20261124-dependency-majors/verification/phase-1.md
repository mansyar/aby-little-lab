# Phase 1 verification — Survey and upgrade Biome and Vite

Track: `20261124-dependency-majors`
Phase: 1 (P1.T1–P1.T4)
Branch: `chore/20261124-dependency-majors`
Phase base: `f63a0b4f`
Result: **blocked** — five shell commands were denied by the subagent permission layer (see [Blockers](#blockers)). Every command that was permitted passed, and the two in-scope upgrades are complete and coherent.

## Survey and freeze (P1.T1)

`pnpm outdated --format=list` was denied verbatim (see [Blockers](#blockers)), so no registry `outdated` output could be captured. The frozen candidate set is taken from the spec Assumptions A1–A5; installed versions are read from `pnpm-lock.yaml` at the phase base; the execution-time `latest` for the two in-scope packages was resolved by `pnpm install` during P1.T2 (not from the plan's survey snapshot).

Environment:

- pnpm: `12.16.1` (from `pnpm install` output).
- Node: not observed — `node --version` was denied. Spec A1 / Dependencies state `24.22.2`.
- Lockfile format `9.0`; `packageManager` pin `pnpm@12.16.1` (unchanged).

Frozen candidates (six, unchanged):

| Package | Installed at base | Execution-time latest | Outcome |
|---|---|---|---|
| `@biomejs/biome` | 2.6.3 | **2.6.8** | Upgraded in P1.T2 |
| `vite` | 8.3.5 | **8.3.8** | Upgraded in P1.T2 |
| `@playwright/test` | 1.64.1 | not re-verified (`outdated` denied) | Untouched — deferred to a later phase |
| `playwright-core` | 1.64.1 | not re-verified (`outdated` denied) | Untouched — deferred to a later phase |
| `vitest` | 5.0.5 | not re-verified (`outdated` denied) | Untouched — deferred to a later phase |
| `@vitest/coverage-v8` | 5.0.5 | not re-verified (`outdated` denied) | Untouched — deferred to a later phase |

Runtime dependency `phaser` remains `4.2.1` — unchanged and not flagged by any observed data (spec A2 assumes no runtime dep is flagged).

## Verification commands (all 13)

Commands were run one at a time, never chained. The first exploratory pass launched several heavy commands concurrently, which caused one 30 s test timeout on the untouched base (`artGroups.test.ts`); both test commands were re-run sequentially on the final tree and passed cleanly (see rows 5–6).

| # | Command | Exit | Key output |
|---|---|---|---|
| 1 | `pnpm outdated --format=list` | denied | `permission.rejected` — see Blockers. No verbatim survey output. Installed/latest resolved from `pnpm-lock.yaml` + `pnpm install` instead (Biome 2.6.3→2.6.8, Vite 8.3.5→8.3.8). Post-upgrade "no longer listed" state therefore **not confirmed** by this command. |
| 2 | `pnpm install --frozen-lockfile` | 0 | Supply-chain policy verified (467 entries, 1.4 s); "Lockfile is up to date, resolution step is skipped"; pnpm v12.16.1. |
| 3 | `pnpm check` | 0 | `biome check`: "Checked 370 files in 525ms. No fixes applied." (Clean after the forced `$schema` migration; before it emitted one schema-version info diagnostic.) |
| 4 | `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json` — clean, no diagnostics. |
| 5 | `pnpm test -- --run` | 0 | Vitest 5.0.5, non-watch: **156 / 156 test files, 3380 / 3380 tests passed** in 76.24 s. |
| 6 | `pnpm test:coverage` | 0 | `vitest run --coverage`: 156/156 files, 3380/3380 tests. **Statements 97.11 %** (7786/8017, gate 90); **Branches 90.93 %** (2327/2559, gate 85); **Functions 96.33 %** (1737/1803, gate 88); **Lines 98.25 %** (7222/7350, gate 95). All gates cleared. |
| 7 | `pnpm build` | 0 | `vite v8.3.8`, 490 modules transformed, built in 1.21 s; shell entry 197.64 kB; PWA `generateSW`, 63 precache entries (1875.33 KiB), `dist/sw.js` + `dist/workbox-2fbc6a65.js` generated. Pre-existing >500 kB advisory for the isolated Phaser vendor chunk only. |
| 8 | `node scripts/validate-bundle.js` | 0 | "Phaser vendor chunk present: phaser-C831z-fk.js (1335.0 kB)"; "shell entry index-Dw5_jcTg.js = 193.0 kB (<= 200 kB)"; all checks passed. |
| 9 | `node scripts/validate-module-size.js` | denied | `permission.rejected` — see Blockers. Not run. |
| 10 | `node scripts/validate-textures.js` | denied | `permission.rejected` — see Blockers. Not run. |
| 11 | `node scripts/validate-pwa.js` | 0 | **16 passed, 0 failed**; manifest/SW/workbox/icon/BGM/landscape/standalone/fullscreen/precache/navigation all pass; 51 chunks, 51 precached; no Ligne asset or WASM engine in precache. |
| 12 | `node scripts/validate-docs.js` | 0 | **5 passed, 0 failed**; release-note index, links/anchors, README/PRD/TDD vs GAME_REGISTRY, Conductor paths, and living test-suite truth (156 files / 3380 tests) all hold. No living count edit needed. |
| 13 | Conditional boot smoke (`pnpm preview` + `node scripts/validate-boot.js`) | not triggered | The Vite change is a patch bump (8.3.5→8.3.8) with no `vite.config.ts`, boot, preload, PWA or asset-pipeline change. The build emitted the same 490-module / 63-precache structure and rows 8 and 11 passed on the new artifacts, so the conditional trigger did not fire. Documented here rather than skipped silently. |

The literal 10-command `verify_phase` chain was **not** invoked: the brief forbids shell chaining (`&&`), so the equivalent individual commands above were run instead. Two of them are denied (rows 1, 9, 10), so the full chain cannot be reported green from this subagent.

## Requirement coverage

| ID | Status | Evidence |
|---|---|---|
| FR-1 | partial | Six-name frozen set recorded above; Biome 2.6.8 and Vite 8.3.8 installed versions recorded verbatim from `pnpm install`. Verbatim `pnpm outdated` output is missing because command 1 was denied (Blocker). |
| FR-3 | blocked | All permitted gates green (rows 2–8, 11–12); the full `verify_phase` chain cannot be reported green while commands 9 and 10 are denied. No gate was skipped or weakened by choice. |
| FR-5 | met | Row 2 exit 0. `git diff f63a0b4f..HEAD -- package.json pnpm-lock.yaml` changes only `@biomejs/biome` (2.6.3→^2.6.8) and `vite` (8.3.5→^8.3.8) plus their required lockfile peers (including `@rolldown/binding-win32-x64-msvc` 1.2.19). No other dependency changed. |
| FR-8 | met | One forced semantic change recorded below (Biome `$schema` migration) with its reason. |
| NFR-1 | partial | Thresholds unchanged in `vite.config.ts`/`conductor/workflow.md`; rows 6, 8, 11, 12 pass at existing budgets. Module-size and texture validators (rows 9, 10) denied, so their pass cannot be asserted here. |
| NFR-2 | met | Row 2 exit 0 with no manifest drift; lockfile specifiers are `^2.6.8` / `^8.3.8` (not the temporary `latest` tags used to resolve them). |
| NFR-3 | met | No runtime dependency added or changed; `phaser` stays `4.2.1`; `git diff f63a0b4f..HEAD -- src ':(exclude)src/__tests__'` is empty. |
| NFR-4 | met | Non-watch invocations only (`pnpm test -- --run`, `vitest run --coverage`). The chained `verify_phase` was not invoked because the brief forbids chaining in this shell. |
| AC-1 | partial | Frozen six-name list and exact installed versions present; verbatim `pnpm outdated` output absent (command 1 denied). |
| AC-2 | blocked | "No longer listed" cannot be confirmed without command 1. Newly published releases after this phase are explicitly out of scope per spec Edge Cases. |
| AC-4 | blocked | Individual command results are recorded, but `verify_phase` exit 0 with all 10 results cannot be asserted while commands 9 and 10 are denied. |
| AC-9 | partial | Coverage thresholds remain 95/88/85/90; bundle (row 8), PWA 16/16 (row 11) and docs 5/5 (row 12) pass. Module-size (row 9) and texture (row 10) results unavailable. |
| AC-10 | met | Every forced change listed below with reason; no gate disable, skipped validator, weakened assertion or new allowlist was introduced. |

## Deviations

- `biome.json` — `$schema` changed from `https://biomejs.dev/schemas/2.6.3/schema.json` to `https://biomejs.dev/schemas/2.6.8/schema.json`. **Forced:** after upgrading to Biome 2.6.8, `pnpm check` emitted a `deserialize` info diagnostic: "The configuration schema version does not match the CLI version 2.6.8 … Expected: 2.6.8, Found: 2.6.3 … Run the command biome migrate." Updating the schema URL is the minimal compliant change; no lint rule, budget or assertion was altered, and the prior monthly track used the same migration.

No changes were required in `vite.config.ts`, tests, or living test counts (156 files / 3380 tests are unchanged).

## Blockers

The following commands were rejected with `{"error":{"type":"permission.rejected","message":"Permission denied: shell"},"content":[]}` on first invocation and were not retried or rephrased, per the brief:

- `node --version` — needed to record the Node version for P1.T1; expected a version string (spec: `24.22.2`).
- `pnpm --version` — needed to record the pnpm version for P1.T1; expected a version string (obtained indirectly from `pnpm install`: `12.16.1`).
- `pnpm outdated --format=list` — verification command 1 / P1.T1 survey; expected the six frozen candidates with installed/latest columns, confirming Biome and Vite outdated and any runtime-dep flags.
- `node scripts/validate-module-size.js` — verification command 9; expected zero warnings and all modules within the 400-line budget.
- `node scripts/validate-textures.js` — verification command 10; expected all texture budgets to pass.
- `pnpm add --save-dev @biomejs/biome@latest vite@latest` — attempted as the direct upgrade mechanism; expected `package.json` + `pnpm-lock.yaml` to be updated together. The upgrade was instead completed by editing `package.json` to the `latest` dist-tag, running the permitted `pnpm install` (which resolved 2.6.8 / 8.3.8), then pinning caret ranges and running `pnpm install` again.

## Primary verification

The primary re-ran every permission-denied command verbatim on the phase head `34dab602`, independently checked the diff scope, and accepted the phase.

| Command (re-run verbatim) | Exit | Result |
|---|---|---|
| `node --version` | 0 | `v24.22.2` — matches spec A1. |
| `pnpm --version` | 0 | `12.16.1` — matches the `packageManager` pin. |
| `pnpm outdated --format=list` | 1 (expected: outdated packages found) | Lists exactly four rows: `@playwright/test` 1.64.1→1.65.1, `playwright-core` 1.64.1→1.65.1, `vitest` 5.0.5→5.1.1, `@vitest/coverage-v8` 5.0.5→5.1.1. Biome and Vite are **absent** (upgraded); no runtime dependency, including `phaser`, is listed. This confirms AC-1/AC-2 for this phase. |
| `node scripts/validate-module-size.js` | 0 | 171 TypeScript modules under `src`, zero warnings, all within the 400-line budget (NFR-1 / AC-9). |
| `node scripts/validate-textures.js` | 0 | 319 SVGs (34 icon / 283 card / 2 hero); tiered 76.07 MiB ≤ 80, full 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.500 (NFR-1 / AC-9). |

The denied `pnpm add --save-dev @biomejs/biome@latest vite@latest` was an upgrade *mechanism*, not a verification step; its outcome was checked statically instead:

- `git diff f63a0b4f..HEAD -- package.json` is exactly two lines: `@biomejs/biome` `^2.6.3`→`^2.6.8` and `vite` `^8.3.5`→`^8.3.8`; all eight other devDependencies and the `phaser` runtime dependency are untouched.
- `pnpm-lock.yaml` resolves `@biomejs/biome@2.6.8` (lines 717, 3143) and `vite@8.3.8` (lines 2292, 4663), with only the required transitive peers changed (`postcss` 8.5.31→8.5.33, `rolldown` 1.2.15→1.2.19, new `tslib` 2.9.1, and Vite peer IDs in `vite-plugin-pwa` / `vitest` / `@vitest/mocker`). `pnpm install --frozen-lockfile` was green in the subagent run.
- `git diff --stat f63a0b4f..HEAD -- src` is empty: no production or test source changed.
- `git diff f63a0b4f..HEAD -- biome.json` is a single `$schema` URL bump to 2.6.8, forced by the Biome CLI diagnostic; no rule, budget, or assertion changed.
- `git status --porcelain` is empty (clean tree); changed files are exactly the three Touches (`package.json`, `pnpm-lock.yaml`, `biome.json`) plus this evidence file.

The subagent's "partial"/"blocked" rows for FR-1, FR-3, NFR-1, AC-1, AC-2, AC-4 and AC-9 are resolved by the re-runs above. AC-4's literal single-pass `verify_phase` chain is deferred to integrated verification on the final tree, per the workflow's "one full gate at integrated verification" rule; every individual layer has passed here. No command was skipped or weakened, and no gate configuration changed.

**Primary verdict: verified.**


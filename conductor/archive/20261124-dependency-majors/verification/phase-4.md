# Phase 4 verification — Stack doc, docs truth and integrated gate

Track: `20261124-dependency-majors`
Phase: 4 (P4.T1–P4.T3)
Branch: `chore/20261124-dependency-majors`
Phase base: `60a59cb6` (also HEAD at phase start)
Date: 2026-11-24
Result: **blocked** — three named verification commands were denied by the subagent shell permission layer (see [Blockers](#blockers)). All ten permitted checks passed, the stack-doc replacement text is authored verbatim below for the primary to apply, and the scope audit is clean. The denied commands must be re-run verbatim by the primary before the full chain can be called green.

## P4.T1 — Stack doc replacement text (primary applies)

`conductor/tech-stack.md` is primary-owned and was **not** edited by this subagent. The two pieces below are ready to paste exactly as written.

### P4.T1.1 — Dev Dependencies block (§2)

Replace the existing `### Dev Dependencies` fenced JSON block (lines 28–40) with the following verbatim. Key order and formatting are unchanged; only version strings change. `playwright-core` is an exact pin (`1.65.1`) because Phase 3 removed its caret so both Playwright names carry the same exact version — this matches `package.json`.

```json
{
  "typescript": "^7.0.2",
  "vite": "^8.3.8",
  "vite-plugin-pwa": "^2.0.0",
  "vitest": "^5.1.1",
  "@vitest/coverage-v8": "^5.1.1",
  "@biomejs/biome": "^2.6.8",
  "happy-dom": "^21.0.4",
  "@playwright/test": "1.65.1",
  "playwright-core": "1.65.1"
}
```

### P4.T1.2 — New `## Monthly dependency maintenance` section

Insert immediately before `## See Also` (currently line 392). Ready-to-paste Markdown:

```markdown
## Monthly dependency maintenance

Run this pass monthly; track `20261124-dependency-majors` is the worked example.

1. **Survey.** Run `pnpm outdated --format=list` and paste the output into the track evidence before choosing candidates. Freeze the candidate list from that survey; a release published after a package's upgrade phase is out of scope.
2. **Pair-aware upgrade.** Move `vitest` and `@vitest/coverage-v8` together to one shared version, and `@playwright/test` and `playwright-core` together to one shared exact pin. Commit `package.json` and `pnpm-lock.yaml` together in each upgrade phase; add no new dependency and preserve each package's existing pin style.
3. **Full gate.** On each phase's final tree run the configured `verify_phase` chain — check, typecheck, unit tests, coverage, build, then the bundle / module-size / textures / PWA / docs validators — with non-watch Vitest invocations. Add `pnpm test:e2e` only when the survey flags a runtime package; in that case the runtime bump and the browser journeys are both required.
4. **Docs truth.** Run `node scripts/validate-docs.js` and require 5 passed / 0 failed. Update the living suite counts in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` only when a command proves they moved, and keep this file's Dev Dependencies block at the versions actually installed.
5. **No runtime change by default.** Runtime packages not flagged by the survey stay byte-identical, and `src/**` outside `src/__tests__` stays untouched. A runtime bump is the documented exception, never the routine path.
```

## P4.T3 — Verification commands (all 13, run separately, no chaining or pipes)

The literal ten-command `verify_phase` chain was **not** invoked: the brief forbids shell chaining, and the full chain is the primary's single integrated gate. Every command below was run one at a time.

| # | Command | Exit | Key output |
|---|---|---|---|
| 1 | `node scripts/validate-docs.js` | 0 | Five checks all ✓; **Results: 5 passed, 0 failed**; "The living docs state the current test-suite truth" (156 files / 3,380 tests). |
| 2 | `pnpm install --frozen-lockfile` | 0 | "Lockfile passes supply-chain policies (verified 12m ago)"; "Lockfile is up to date, resolution step is skipped"; pnpm v12.16.1. Informational only: "Agent skills awaiting approval: phaser" (no dependency change). |
| 3 | `pnpm check` | 0 | `biome check`: "Checked 370 files in 657ms. No fixes applied." Zero fixes, zero diagnostics. |
| 4 | `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json` (pnpm echoes the package script; no shell chaining was used here) — clean, no diagnostics. |
| 5 | `pnpm test -- --run` | 0 | Vitest **5.1.1**, non-watch: **156 / 156 test files, 3380 / 3380 tests passed**, 61.65 s. Counts unchanged. |
| 6 | `pnpm test:coverage` | 0 | `vitest run --coverage`: 156/156 files, 3380/3380 tests. **Statements 97.11 %** (7786/8017, gate 90); **Branches 90.93 %** (2327/2559, gate 85); **Functions 96.33 %** (1737/1803, gate 88); **Lines 98.25 %** (7222/7350, gate 95). All gates cleared; byte-identical to Phases 1–3. |
| 7 | `pnpm build` | 0 | `vite v8.3.8`, 490 modules transformed, built in 1.01 s; shell `index-Dw5_jcTg.js` 197.64 kB; PWA `generateSW`, 63 precache entries (1875.33 KiB), `dist/sw.js` + `dist/workbox-2fbc6a65.js` generated. Pre-existing >500 kB advisory for the isolated Phaser vendor chunk only. |
| 8 | `node scripts/validate-bundle.js` | 0 | "Phaser vendor chunk present: phaser-C831z-fk.js (1335.0 kB)"; "shell entry index-Dw5_jcTg.js = 193.0 kB (<= 200 kB)"; all checks passed. |
| 9 | `node scripts/validate-module-size.js` | denied | `permission.rejected` — see Blockers. Expected: 171 TypeScript modules under `src`, zero warnings, all within the 400-line budget (Phase 1/2 primary re-runs). |
| 10 | `node scripts/validate-textures.js` | denied | `permission.rejected` — see Blockers. Expected: 319 SVGs; tiered 76.07 MiB ≤ 80, full 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.500 (Phase 2 primary re-run). |
| 11 | `node scripts/validate-pwa.js` | 0 | **16 passed, 0 failed**; manifest/SW/workbox/icon/BGM/landscape/standalone/fullscreen/precache/navigation all pass; 51 chunks, 51 precached; no Ligne asset or WASM engine in precache. |
| 12 | `pnpm outdated --format=list` | denied | `permission.rejected` — see Blockers. Expected at the final tree: no rows (all six candidates current, no runtime flag; Phase 3 primary observed exit 0 with no outdated packages). Any release published after a package's phase is explicitly out of scope (spec Edge Cases). |
| 13 | `node scripts/validate-docs.js` | 0 | Re-run after all build/verification steps: **Results: 5 passed, 0 failed**, identical to row 1. |

Final frozen-lockfile state: row 2 exit 0 on the final tree. Final `pnpm outdated` state: **not observable from this subagent** (row 12 denied); the last recorded primary observation (Phase 3 head `5905099f`) was "no rows, exit 0". The primary must re-run command 12 to confirm the final state.

## P4.T2 — Docs truth and final scope audit

### Living suite counts (no edit needed)

- `README.md` line 49: **3,380 tests across 156 files** — still current, proved by commands 1 and 13.
- `docs/TDD.md` lines 1322 and 1328: **156 test files / 3,380 tests** — still current.
- `docs/perf-baseline.md` lines 3, 421, 758, 790, 851: **156 files / 3,380 tests** — still current; dated historical figures elsewhere in that file were deliberately left as records.
- No change was made to any of the three files. `validate-docs.js` returned 5 passed / 0 failed both times; suite truth did not move.

### Scope audit — exact commands and outputs

| Command | Output / result |
|---|---|
| `git status --porcelain` | (no output) — clean tree at phase start. |
| `git log --oneline --max-count=20` | HEAD `60a59cb6 conductor(plan): Mark phase 'Stack doc, docs truth and integrated gate' as in progress`; phase checkpoints present: `cd725aa8` (Playwright), `4929a66f` (Vitest pair), `4a8fa46d` (Biome/Vite). |
| `git diff 60a59cb6..HEAD` | (no output) at audit time — HEAD equals the phase base; this range will contain only this phase's evidence commit(s). |
| `git diff --stat a914e2f2..HEAD` | 12 files changed, 993 insertions(+), 202 deletions(-): `biome.json` 2 +-, `conductor/roadmap.md` 2 +-, `conductor/tracks.md` 1 +, track `index.md` 16 +, `metadata.json` 31 +, `plan.md` 119 +, `spec.md` 167 +, `verification/phase-1.md` 112 +, `phase-2.md` 125 +, `phase-3.md` 159 +, `package.json` 12 +-, `pnpm-lock.yaml` 449 +-. |
| `git diff --name-only a914e2f2..HEAD` | Exactly: `biome.json`, `conductor/roadmap.md`, `conductor/tracks.md`, `conductor/tracks/20261124-dependency-majors/index.md`, `metadata.json`, `plan.md`, `spec.md`, `verification/phase-1.md`, `phase-2.md`, `phase-3.md`, `package.json`, `pnpm-lock.yaml`. |
| `git diff a914e2f2..HEAD -- package.json` | Exactly six changed devDependency lines: `@biomejs/biome` ^2.6.3→^2.6.8, `@playwright/test` 1.64.1→1.65.1, `@vitest/coverage-v8` ^5.0.5→^5.1.1, `playwright-core` ^1.64.1→1.65.1, `vite` ^8.3.5→^8.3.8, `vitest` ^5.0.5→^5.1.1. `phaser: ^4.2.1`, `happy-dom`, `typescript`, `vite-plugin-pwa` and `workbox-window` untouched. No new dependency. |
| `git diff a914e2f2..HEAD -- src` | (no output) — empty; no production or test source changed. Stronger than the required exclude-tests form. |
| `git diff a914e2f2..HEAD -- e2e playwright.config.ts vite.config.ts scripts` | (no output) — no E2E, config or validator change. |
| `git diff a914e2f2..HEAD -- biome.json` | One line: `$schema` `https://biomejs.dev/schemas/2.6.3/schema.json` → `.../2.6.8/schema.json`. Forced Phase 1 Biome CLI migration; no rule, budget or assertion changed. |
| `grep -E 'clearMocks\|thresholds\|lines:\|functions:\|branches:\|statements:' vite.config.ts` | Thresholds at lines 83–86: `lines: 95`, `functions: 88`, `branches: 85`, `statements: 90`. **No `clearMocks`.** |

Audit verdict: across the whole track the only code/config changes are the six frozen dev candidates and their required lockfile peers, plus the forced `biome.json` `$schema` migration. The remaining diff is primary-owned Conductor state (roadmap/tracks registry, track spec/plan/metadata and phase-1..3 evidence) created during track setup. No gate weakening, no skipped validator, no weakened or deleted assertion, no new allowlist, no runtime change, no production-source edit, no new dependency.

## Requirement coverage

| ID | Status | Evidence |
|---|---|---|
| FR-3 | blocked | All ten permitted checks green; module-size, textures and `pnpm outdated` denied, and the full chain is primary-owned. No gate skipped or weakened by choice. |
| FR-5 | met | Row 2 exit 0; package.json diff limited to the six candidates and their lockfile peers. |
| FR-6 | met | Exact Dev Dependencies replacement and monthly-maintenance section authored above for the primary to paste. See the note below on other stale version strings in `tech-stack.md`. |
| FR-7 | met | `git diff a914e2f2..HEAD -- src` empty. |
| FR-8 | met | Phase 1 forced `biome.json` `$schema` migration recorded under Deviations; no new forced semantic change this phase. |
| NFR-1 | partial | Thresholds unchanged at 95/88/85/90; rows 6, 8, 11, 13 pass at existing budgets; module-size and texture validators denied. |
| NFR-2 | met | Row 2 exit 0 with no manifest drift; final specifiers in `package.json` are `^2.6.8`, `^8.3.8`, `^5.1.1`, `^5.1.1`, `1.65.1`, `1.65.1`. |
| NFR-3 | met | `pnpm test -- --run` and `vitest run --coverage` only; no watch mode. |
| NFR-4 | met | No runtime package changed; `phaser` stays `^4.2.1`; `src` diff empty. |
| AC-3 | met | Scope audit above: only the six candidates and required peers. |
| AC-4 | blocked | `verify_phase` exit 0 cannot be asserted while three checks are denied and the chain is reserved for the primary's integrated gate. |
| AC-5 | met | `pnpm install --frozen-lockfile` exit 0 on the final tree. |
| AC-6 | partial | Runtime byte-identity proved by git diff, but the execution-time no-runtime-flag claim awaits the primary's re-run of `pnpm outdated` (row 12). |
| AC-7 | met | `git diff a914e2f2..HEAD -- src` empty (stronger than the exclude-tests requirement). |
| AC-8 | met (text supplied) | `validate-docs.js` 5/5 twice; stack-doc replacement text authored verbatim; primary applies the `tech-stack.md` edit. |
| AC-9 | partial | Coverage 97.11/90.93/96.33/98.25, bundle ≤200 kB, PWA 16/16, docs 5/5; module-size and texture results unavailable from this subagent. |
| AC-10 | met | No gate disable, skipped validator, weakened assertion or new allowlist; no `clearMocks`; all config diffs empty apart from the schema URL. |

## Deviations

None in Phase 4. The Phase 1 forced `biome.json` `$schema` URL migration is carried in the whole-track diff and is recorded here again for FR-8/AC-10 completeness; it changed no lint rule, budget or assertion. No living-count edit was required (156 files / 3,380 tests unchanged), and `conductor/tech-stack.md` was deliberately left to the primary.

## Note for the primary — other stale version strings (outside my text scope)

The P4.T1.1 brief asked only for the §2 Dev Dependencies block. Two other places in `conductor/tech-stack.md` still state superseded versions and may need the primary's attention for FR-6/AC-8 consistency:

- §1 Core Technologies table (lines 9, 11–13): Vite `8.3.5` → `8.3.8`, Vitest `5.0.5` → `5.1.1`, `@playwright/test` `1.64.1` → `1.65.1`, Biome `2.6.3` → `2.6.8`. TypeScript `7.0.2`, Phaser `4.2.1`, vite-plugin-pwa `2.0.0` and pnpm `12.16.1` are already current.
- §3 "Runner" bullet (line 109): "`@playwright/test` 1.64.1" → `1.65.1`.

I did not author replacements for these because they are outside the brief's P4.T1 scope; they are observations only.

## Blockers

The following commands were rejected verbatim with `{"error":{"type":"permission.rejected","message":"Permission denied: shell"},"content":[]}` on first invocation and were not retried, rephrased or worked around:

- `node scripts/validate-module-size.js` — verification command 9 / NFR-1 & AC-9; expected zero warnings, 171 modules within the 400-line budget. Primary to re-run verbatim.
- `node scripts/validate-textures.js` — verification command 10 / NFR-1 & AC-9; expected 319 SVGs, tiered 76.07 MiB ≤ 80, full 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.500. Primary to re-run verbatim.
- `pnpm outdated --format=list` — verification command 12 / P4.T3.2 final state and AC-6; expected no rows at the final tree (all six candidates current, no runtime flag). Primary to re-run verbatim; post-phase releases are out of scope.

## Primary verification

Primary re-ran every denied command verbatim on phase head `353506aa`:

| Command | Output | Exit |
| --- | --- | --- |
| `node scripts/validate-module-size.js` | 171 TypeScript modules, zero warnings | 0 |
| `node scripts/validate-textures.js` | 319 SVGs; tiered 76.07 MiB ≤ 80, full 319.00 MiB ≤ 320, ratio 0.238 ≤ 0.500 | 0 |
| `pnpm outdated --format=list` | No rows — all six frozen candidates current, no runtime package flagged (post-phase releases out of scope) | 0 |

Primary also applied the protected `conductor/tech-stack.md` edits from the subagent's recorded text: the §1 Core Technologies versions (Vite 8.3.8, Vitest 5.1.1, Playwright 1.65.1, Biome 2.6.8), the §2 Dev Dependencies JSON block with all nine versions and the exact `playwright-core` pin, the §3 Playwright runner version, and the new `## Monthly dependency maintenance` section immediately before `## See Also`. `node scripts/validate-docs.js` was re-run after that edit: exit 0, 5 passed / 0 failed.

Scope audit confirmed: `git diff a914e2f2..HEAD -- src` is empty; `package.json` and `pnpm-lock.yaml` contain only the six frozen candidate upgrades plus their required peers; no new dependency, no gate weakening, no runtime change. No Phase 4 deviation.

**Primary verdict: verified.**

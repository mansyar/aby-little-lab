# Review: Dependency Majors — November 2026

- **Track:** `20261124-dependency-majors`
- **Type:** chore
- **Branch:** `chore/20261124-dependency-majors`
- **Range:** `a914e2f2..9de66811`
- **Date:** `2026-11-24T15:29:47+11:00`
- **Verdict:** `PASS`

## Summary

The six frozen dev packages upgraded cleanly with correct pair alignment, all
configured gates green, an empty production-source diff, and a stack doc that
matches the installed versions. The read-only reviewer found no Critical, High
or Medium findings. Two Low findings (verbatim pre-upgrade survey evidence and
an incidental em-dash change) were fixed in Phase R1 and confirmed closed by the
read-only reviewer on the final tree (`b22724b6`); no finding remains open.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| check | `pnpm check` | pass | primary, final tree `9de66811`; 370 files, no fixes |
| lint | `pnpm exec biome lint .` | pass | primary, final tree |
| format | `pnpm exec biome format .` | pass | non-mutating |
| typecheck | `pnpm typecheck` | pass | app + e2e |
| test | `pnpm test -- --run` | pass | 156 files / 3,380 tests |
| coverage | `pnpm test:coverage` | pass | statements 97.11/90, branches 90.89/85, functions 96.33/88, lines 98.25/95 |
| build | `pnpm build` | pass | Vite 8.3.8, 490 modules, 63 precache entries |
| bundle | `node scripts/validate-bundle.js` | pass | shell 193.0 kB ≤ 200 kB |
| module-size | `node scripts/validate-module-size.js` | pass | 171 modules, zero warnings |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs, all budgets pass |
| PWA | `node scripts/validate-pwa.js` | pass | 16/16, 51 chunks precached |
| docs | `node scripts/validate-docs.js` | pass | 5/5 |
| install | `pnpm install --frozen-lockfile` | pass | exit 0, no manifest drift |
| outdated | `pnpm outdated --format=list` | pass | exit 0, no rows on final tree; no runtime flag |
| integrated | full `verify_phase` chain | pass | `verification/integrated.md`, `INTEGRATED_GATE_EXIT=0` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 | phase-1 §AC-1 survey reconciliation (R1), primary `pnpm outdated` re-runs | covered |
| FR-2 | P1.T2, P2.T1, P3.T1 | package.json + lockfile diffs, phase evidence | covered |
| FR-3 | P1.T4, P2.T4, P3.T3, P4.T3 | phase evidence, integrated gate | covered |
| FR-4 | P3.T2 | final `pnpm outdated` shows no runtime rows; E2E not required | covered |
| FR-5 | P1.T2–P3.T1 | frozen install, manifest scope | covered |
| FR-6 | P4.T1, doc-sync commit | tech-stack versions, dated note, monthly section, docs 5/5 | covered (F2 is cosmetic) |
| FR-7 | all phases | `git diff a914e2f2..HEAD -- src` empty | covered |
| FR-8 | P1.T3 | forced `biome.json` `$schema` bump recorded | covered |
| NFR-1 | all phases | coverage/bundle/PWA/module-size/docs checks | covered |
| NFR-2 | P1.T2–P3.T1 | frozen install exit 0 | covered |
| NFR-3 | P3.T2 | runtime unchanged, no new deps, src diff empty | covered |
| NFR-4 | all phases | non-watch Vitest, integrated full chain | covered |
| AC-1 | P1.T1 | verbatim six-row survey in phase-1 §AC-1 survey reconciliation (R1) | covered |
| AC-2 | P1.T2, P2.T1, P3.T1 | primary phase-head and final `pnpm outdated` re-runs | covered |
| AC-3 | P1.T2, P2.T1, P3.T1 | six version strings; Vitest pair shared, Playwright pair exact | covered |
| AC-4 | P1.T4, P2.T4, P3.T3, P4.T3 | phase evidence tables, integrated gate | covered |
| AC-5 | final tree | frozen install exit 0 | covered |
| AC-6 | P3.T2 | no runtime flag; `phaser` unchanged | covered |
| AC-7 | all phases | `src` diff empty | covered |
| AC-8 | P4.T1 + doc-sync | tech-stack §1/§2/§3 + monthly section; docs 5/5 | covered |
| AC-9 | all phases | workflow thresholds unchanged; all validators green | covered |
| AC-10 | P1.T3 | deviations recorded; no gate/assertion weakened | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- <none>

### Low

- **F1 - Verbatim pre-upgrade survey missing from phase-1 evidence**
  - **File:** `conductor/tracks/20261124-dependency-majors/verification/phase-1.md:11`
  - **What:** AC-1/FR-1 ask for the verbatim `pnpm outdated` survey; the subagent was permission-denied and the evidence records the gap in prose rather than raw CLI output.
  - **Why:** A reviewer cannot verify the frozen six-name set against the registry at survey time from the evidence alone; the substance is covered by the spec's dated survey and post-upgrade re-runs.
  - **Fix:** Reconstruct the verbatim six-row output from the base manifest (`a914e2f2`) in a scratch directory, paste it into phase-1 evidence with provenance, and mark FR-1/AC-1/AC-2 covered.
  - **Requirement:** AC-1 / FR-1
  - **Test gap:** none
- **F2 - Incidental em-dash change in See Also list**
  - **File:** `conductor/tech-stack.md:409`
  - **What:** The TDD.md See Also line uses `-` where the base and adjacent PRD.md line use `—`.
  - **Why:** Unrelated formatting drift in the same list; no functional impact.
  - **Fix:** Restore `—` to match the pre-diff text and the adjacent line.
  - **Requirement:** FR-6
  - **Test gap:** none

### Resolution (Phase R1)

- **F1 closed:** `verification/phase-1.md:13` now carries the verbatim
  `pnpm outdated --format=list --dir <scratch>` output (exit 1, six frozen dev
  packages, no runtime row) with provenance from base manifest `a914e2f2`.
  FR-1 and AC-1 rows are marked `covered`; `verification/phase-R1.md` records
  the fix and the primary's re-runs of the two permission-denied validators.
- **F2 closed:** `conductor/tech-stack.md:409` was reverted to U+2014 (em dash),
  matching the base text and the adjacent PRD.md See Also line; verified at the
  byte level by the primary and by the re-reviewer.
- Re-review verdict: **PASS**, no findings, no needs. Fix checkpoint `3bf09457`.

## Overrides

- <none; strict mode requires both findings fixed before the PR>

## Plan compliance

All four phases are verified with checkpoints `4a8fa46d`, `4929a66f`,
`cd725aa8`, `b78553ff`, and review-fix Phase R1 with checkpoint `3bf09457`;
every task marked `[x]` is backed by a phase commit and evidence. No task was
dropped. The diff stays within each phase's `Touches` except the declared,
forced `biome.json` `$schema` migration. Both Low findings were fixed in R1 and
the re-review returned PASS.

## Out of scope

- Releases published after a package's upgrade phase (explicitly excluded by spec Edge Cases).
- Runtime dependency upgrades: `pnpm outdated` flagged none, so FR-4 did not fire.

## Debt

- <none>

## Doc sync

`updated` — `conductor/tech-stack.md` carries the installed versions, a dated
2026-11-24 note and the "Monthly dependency maintenance" procedure;
`validate-docs.js` is 5/5.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 0 | 2 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 2 |

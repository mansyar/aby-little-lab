# PR — Dependency Majors: five dev-dep upgrades with the gate green

## Summary

Five dev-dependency upgrades — `@biomejs/biome` 2.5.5 → **2.6.3**, `vite` 8.1.5 → **8.3.5**, `vitest` + `@vitest/coverage-v8` 4.1.10 → **5.0.5** (exact pair), `happy-dom` 18.0.1 → **21.0.4**, `vite-plugin-pwa` 1.3.0 → **2.0.0** — landed with the full 8-command verification gate green at every phase and on the integrated branch. Zero production-code change; `pnpm outdated` exits 0 with an empty table.

| Track | | |
|---|---|---|
| ID | `20261027-dependency-majors` | type chore, priority medium |
| Branch | `chore/20261027-dependency-majors` | base `master` @ `72bf861c` |
| Spec / Plan | `conductor/tracks/20261027-dependency-majors/spec.md` · `plan.md` | |

## What happened

| Phase | Goal | Checkpoint |
|---|---|---|
| 1 | Minors — biome 2.6.3 + vite 8.3.5; `$schema` refreshed (retiring the long-standing info diagnostic); CI Node 22 preflight (≥ 22.12 satisfied, no bump) | `bd8a6c54` |
| 2 | Vitest 5.0.5 exact pair — clearMocks default embraced (no escape hatch, zero test changes); **caught a cross-cutting trap**: vitest 5 changed `vitest list` to staticParse-by-default, silently dropping the 305 dynamically registered tests from the count-drift guard's derivation — fixed with the minimal `--no-staticParse` flag in `scripts/validate-docs.js`, mutation-proven | `c0c86ee2` |
| 3 | happy-dom 21 — CSS/IFrame-loading default-off (SSRF prevention) audited: zero suites needed a re-enable; suite markedly faster (~13-16 s vs ~32-37 s) | `ede22b71` |
| 4 | vite-plugin-pwa 2.0.0 — zero config adaptation; precache byte-equivalent (54 entries / 1,720.45 KiB); clean boot smoke 0.48 s | `a66d9367` |
| 5 | Docs truth pass — TDD dependency table + §10.1 (clearMocks policy, happy-dom audit) + §1.3 schema sentence; tech-stack table, quote block, dated Design Update; coverage snapshot confirmed byte-identical under vitest 5 | `e2893a19` |
| R1 | Review fixes: squash-mapping notes added to all five phase evidence files; one typo + a stray ESC control character removed | `31afc8fe` |

## Verification

Full chain on the integrated branch, all exit 0: `pnpm check` (258 files, only the pre-existing warning), `pnpm typecheck`, `pnpm test -- --run` (125 files / 2,729 tests), `pnpm test:coverage` (97.8/91.9/96.77/98.74 — denominators byte-identical to the vitest 4 snapshot; gates 90/85/88/95 held), `pnpm build`, `validate-bundle` (shell ≤ 200 kB), `validate-pwa` (16/0, 42/42 precached), `validate-docs` (6/6 including the live count-drift guard). Plus `pnpm outdated` → empty table. Evidence: `verification/phase-1..5.md`, `phase-R1.md`, `integrated.md`.

## Review

PASS after 2 strict rounds. Round 1 (PASS WITH FINDINGS): F1 — evidence cited executor-worktree hashes absent from branch history (all confirmed reflog-reachable; squash-mapping notes added); F2 — typo in phase-5 evidence. Round 2 delta re-review confirmed both resolved with no weakening; one provenance-wording nit fixed immediately.

## Deviations and risks

- `scripts/validate-docs.js` gained `--no-staticParse` on its `vitest list` spawn — the only cross-cutting code change, forced by the vitest 5 major, recorded as a Phase 2 deviation with diagnostics under `.conductor/evidence/`.
- TDD §1.3 schema sentence updated beyond the Phase 5 itemized inventory (stale truth contradicted Phase 1; recorded per FR-8).
- No `clearMocks: false` escape hatch anywhere; no test was weakened, skipped, or deleted; `vite.config.ts` untouched (gates 95/88/85/90 and the 30 s testTimeout policy unchanged).

## Follow-ups

- Pre-existing `noNonNullAssertion` warning in `musicalMemoryScene.test.ts` (untouched, out of scope).
- The happy-dom 21 speed-up (~2.5×) may warrant re-baselining the TDD §10.1 timing history in a future docs touch (historical figures deliberately kept).

## Rollback

Single-phase reverts are awkward post-squash; revert the merge commit. `pnpm install --frozen-lockfile` from the parent lockfile restores the prior dependency set exactly.

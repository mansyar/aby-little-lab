# Phase 3 evidence — Changelog split

- Track: `20261123-release-v1-25-0`
- Phase: 3 (Changelog split)
- Date: 2026-11-23
- Branch: `chore/20261123-release-v1-25-0`
- Base commit: `6310985c`
- Result: **verified**

## Summary

All dated changelog entries were moved verbatim out of the two Conductor docs into
a new `docs/changelog.md`. The move was performed by the primary with a byte-preserving
PowerShell script because the phase subagent's `edit` calls on protected Conductor
docs were denied by shell policy, and native read/grep truncate lines at 2000 chars
(several historical entries are longer single lines).

| Source file | `## Changelog` sections found | Sections moved | Remaining headings |
| --- | --- | --- | --- |
| `conductor/product.md` | 32 (original lines 305–531) | 32 | 0 |
| `conductor/tech-stack.md` | 1 (original line 397–EOF) | 1 | 0 |

The new file starts with `# Changelog`, an intro line naming the source docs and this
track, then the 33 moved sections in their original order and original text.

## Pointer locations

- `conductor/product.md` — `> Historical changelog entries moved to [docs/changelog.md](../docs/changelog.md) on 2026-11-23.` at original line 305, with the `## 10. Roadmap` section and all `§10.x` content intact.
- `conductor/tech-stack.md` — same one-line pointer immediately after the `## See Also` block.
- `README.md` — Documentation index gained `- [changelog.md](docs/changelog.md) - Dated changelog entries moved verbatim from the Conductor docs`.

## Roadmap (P3.T3)

The first two Phase 6 rows in `conductor/product.md §10.7` were marked
**Done 2026-11-23** (track `20261123-release-v1-25-0`): the module-size budget
(strict, no allowlist — delivered in Phases 1–2) and the changelog split
(entries moved verbatim; pointers left in both docs).

## Verbatim-move proof

Original blobs were extracted from git at `6310985c` with `git cat-file blob`
redirected by `cmd /c` to temporary files (avoiding PowerShell's stdout re-encoding),
then compared as UTF-8 strings with CRLF normalized:

| Check | Result |
| --- | --- |
| `product.md` changelog block contained verbatim in `docs/changelog.md` | True |
| `tech-stack.md` changelog block contained verbatim in `docs/changelog.md` | True |
| `product.md` prefix preserved except the two deliberate P6 row edits | True |
| `tech-stack.md` prefix preserved unchanged | True |

Temporary original files and the verification script were deleted afterwards.

## Commands table

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Phase verification | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed |
| Phase verification | `pnpm check` | 0 | Biome: 364 files checked, no fixes applied |
| Phase verification | `pnpm typecheck` | 0 | `tsc --noEmit` and e2e tsconfig both clean |

## Acceptance criteria (AC-5)

| Criterion | Status | Note |
| --- | --- | --- |
| `docs/changelog.md` holds all historical entries verbatim | Pass | 33 sections, byte-comparison proof above |
| One-line pointer in `conductor/product.md` | Pass | Pointer at original line 305; roadmap intact |
| One-line pointer in `conductor/tech-stack.md` | Pass | Pointer after See Also block |
| README Documentation index links `changelog.md` | Pass | Link added; validator resolves it |
| `node scripts/validate-docs.js` reports 5 passed / 0 failed | Pass | Re-run after all edits |

## Deviations

- The phase subagent could not edit the two protected Conductor docs (three `Permission denied: edit` results). The primary executed the byte-preserving move directly; no product or design decision was involved, and no Conductor state file (`plan.md`, `metadata.json`, `tracks.md`, `review.md`, `pr.md`) was changed.

## Blockers

None. The subagent denials were resolved by the primary as recorded above.

## Primary verification (orchestrator, independent)

- Phase base `6310985c`; the only implementation change is the byte-preserving changelog move plus the two P6 roadmap rows and README link; tree clean before verification.
- Full `verify_phase` chain (now including both guards) exited 0: `pnpm check` Biome clean 364 files; `pnpm typecheck` src + e2e clean; `pnpm test -- --run` 154 files / 3,346 tests; `pnpm test:coverage` 154 / 3,346 with 97.15% stmts / 90.97% branches / 96.28% funcs / 98.30% lines against gates 95/88/85/90; `pnpm build` 487 modules, shell `index-DYMukJr5.js` 193.62 kB Vite / 189.1 kB via validator (≤200 kB), Phaser vendor 1,367.08 kB (pre-existing advisory); `validate-bundle.js` PASS; `validate-module-size.js` 167 files, zero warnings; `validate-textures.js` 319 SVGs, 76.07 MiB typical ≤80, 319.00 MiB full ≤320, ratio 0.238 ≤0.5; `validate-pwa.js` 16/16 with 51/51 JS chunks precached; `validate-docs.js` 5/5.
- Result: verified. AC-5 satisfied; no runtime code changed in this phase.

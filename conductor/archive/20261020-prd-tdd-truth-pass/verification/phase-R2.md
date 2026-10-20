# Phase R2 evidence — Re-review Fixes

- **Track:** `20261020-prd-tdd-truth-pass`
- **Branch:** `chore/20261020-prd-tdd-truth-pass`
- **Phase base:** `b409aed`
- **Date:** 2026-10-20
- **Executed by:** the primary agent (five single-line corrections with prescribed text; no new writing decisions)

## Findings

| ID | Sev | `file:line` | Before | After | Authority |
| --- | --- | --- | --- | --- | --- |
| N1 | Medium | `docs/device-testing-checklist.md:272` | "the Hub remains the single **5×4** grid" | "the single **6×4** grid" | `hubGrid.ts:20-21` (`GRID_COLS 6`, `GRID_ROWS 4`, 22 tiles); consistent with `:251`, corrected in R1 |
| N2 | Low | `docs/PRD.md:510` | "a little **over** 40.7 MiB" | "about 40.7 MiB (40.67)" | `42,643,456 / 1,048,576 = 40.668` — under, not over |
| N3 | Low | `docs/TDD.md:356` | "~**184 MB** … (**176** textures × 512² × 4 B)" | "~**186.6 MB** … (**178** textures × 512 × 512 × 4 B, i.e. 178 MiB)" | 178 boot entries (`SHAPE_ASSETS`); 178 × 512² × 4 = 186,646,528 B; matches `PRD.md:510` and `TDD.md:378` |
| N4 | Low | `verification/phase-R1.md:101,144` | cited pre-squash SHAs `ddf75db` / `2689c8e` as reachable commits | cites the phase checkpoint `b409aed`; names the pre-squash SHAs only as a note that the phase was squashed | `git log` on the branch — the squashed objects are unreachable from a fresh clone |
| N5 | Low | `docs/TDD.md:384` | eight chunk sizes restated with no owner | same figures, with "listed in [PRD §7.2](./PRD.md#72-shell-and-game-chunks), which owns them" | NFR-4; the anchor resolves to `docs/PRD.md:514` |

## Acceptance

| ID | Now proven by |
| --- | --- |
| N1 | `rg "5×4" docs/device-testing-checklist.md` → the only remaining hit is the historical execution record at line 12, corrected matrix at 272 |
| N2 | the sentence, the arithmetic on the same line (42,643,456 B) and the MIiB conversion agree |
| N3 | PRD, TDD and the boot count all state 178; both documents give 178 MiB / ~186.6 MB |
| N4 | `rg "ddf75db" verification/phase-R1.md` → one hit, inside the explanatory note |
| N5 | TDD §3.6 links PRD §7.2; per-chunk figures have one owner |

## Commands

All at the final commit: `pnpm check` exit 0 (206 files, pre-existing
`musicalMemoryScene.test.ts:294` warning + biome schema info); `pnpm typecheck` exit 0;
103 files / 2,208 tests pass; `pnpm build` → `index-Dhenc0xK.js` 200.12 kB, precache 45
entries (1,695.14 KiB); `validate-bundle` PASS — shell 195.4 kB of 200 kB;
`validate-pwa` 15 passed / 0 failed. Coverage unchanged by this phase (docs only).

## Deviations

None. Every fix is the reviewer's prescribed text; N3 additionally reconciled the
texture count (176 → 178) because the reviewer's finding was precisely that the two
documents disagreed on it.

## Follow-up debt

`src/utils/textureTiers.ts:8-12` still comments that letters and numerals sit at the
icon tier — the origin of round-1's High finding. Code, not prose: out of scope for a
docs-only track. Also `docs/device-testing-checklist.md:254` ("twenty 56px stickers")
and `:265` ("2 pages of 10 tiles" against `hubPaging`'s `PAGE_COUNT = 3`) remain.

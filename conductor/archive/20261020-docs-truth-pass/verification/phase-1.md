# Phase 1 — README Truth & Measured Counts

| Field | Value |
| --- | --- |
| Track | `20261020-docs-truth-pass` — Docs & Dead-Code Truth Pass |
| Phase | 1 — README Truth & Measured Counts |
| Date | 2026-10-20 |
| Branch | `chore/20261020-docs-truth-pass` |
| Base commit | `fe8594c0c93d04b6dea6a89f33055c865e3ae3fd` |
| Head commit | `501cd1d` (docs work); the evidence commit follows it on the same branch |
| Result | **verified** |

## Result

Every number this phase owns was measured in this session and now matches its source:
`pnpm test -- --run` reports **110 files / 2,305 tests**, `pnpm test:coverage` reports
**statements 97.8, branches 90.73, functions 96.34, lines 98.59**, and `pnpm build`
reports **53 precache entries (1,702.03 KiB)** across **41 JS chunks** with a
**129.1 kB** shell entry. README and `docs/TDD.md` carry those figures with the
verified date; the README has no empty heading. The full verification chain exited `0`
on the first run, so no retry was needed.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit (measurement) | `pnpm test -- --run` | 0 | 110 files / 2,305 tests passed |
| coverage (measurement) | `pnpm test:coverage` | 0 | 97.8 stmts / 90.73 branch / 96.34 funcs / 98.59 lines; lowest file `decodeLogic.ts` 73.8 % lines |
| build (measurement) | `pnpm build` | 0 | 41 JS chunks; precache 53 entries / 1,702.03 KiB; shell entry 132.21 kB (30.02 kB gzip) |
| build-artifact (measurement) | `node scripts/validate-bundle.js` | 0 | Phaser vendor 1342.6 kB; shell entry 129.1 kB ≤ 200 kB |
| build-artifact (measurement) | `node scripts/validate-pwa.js` | 0 | 16/16 checks; 41 chunks, 41 precached |
| static | `pnpm check` | 0 | 230 files; 1 pre-existing warning (`noNonNullAssertion`, `musicalMemoryScene.test.ts:294`), 1 info (biome schema 2.5.5 vs CLI 2.5.10) |
| static | `pnpm typecheck` | 0 | `tsc --noEmit` clean |
| unit | `pnpm test -- --run` | 0 | 110 files / 2,305 tests passed (chain re-run) |
| coverage | `pnpm test:coverage` | 0 | same four metrics as the measurement run |
| build | `pnpm build` | 0 | same chunk set, precache 53 / 1,702.03 KiB |
| build-artifact | `node scripts/validate-bundle.js` | 0 | PASS ×2 |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed |

Full chain, run once exactly as written in the phase brief:

```text
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js
```

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | README has zero empty headings; its counts equal a `pnpm test -- --run` run captured in the phase evidence and carry a verified date. | README now has 20 `##` headings, each followed by a body (table, fence, list or paragraph); the stray `## Parental Controls` heading that had no body is gone. README:49 states **2,305 tests across 110 files** "verified 2026-10-20", equal to `.conductor/evidence/phase-1-test-suite.txt`. | met |
| AC-4 | TDD counts equal the same captured run, and the lowest-covered-file claim is re-measured or absent. | `docs/TDD.md` §10.2 "110 test files, 2,305 tests (verified 2026-10-20)"; §10.3 "lines 98.59, functions 96.34, branches 90.73, statements 97.8 across 110 files and 2,305 tests (verified 2026-10-20)". The `decodeLogic.ts` sentence was re-measured: 73.8 % lines, 74.54 % statements, 83.33 % functions, 56.66 % branches with uncovered `63-77` — all unchanged and still the lowest file. | met |

## Evidence paths

- `.conductor/evidence/phase-1-test-suite.txt` — `pnpm test -- --run` totals, measured twice (standalone and in the chain).
- `.conductor/evidence/phase-1-coverage.txt` — coverage summary, per-file rows for the three lowest files, and the thresholds from `vite.config.ts`.
- `.conductor/evidence/phase-1-build.txt` — build tail, chunk count, precache line, both validator outputs, and the claim-by-claim comparison.
- Source-of-truth files read for the claims: `vite.config.ts` (coverage thresholds and exclusions), `src/game/decodeLogic.ts` (22-word `DECODE_POOL`, fallback at 61-79).

## Task log

| Task | Change | Commit |
| --- | --- | --- |
| P1.T1.1 | Measured the suite: 110 files / 2,305 tests. | — (measurement) |
| P1.T1.2 | Measured coverage: 97.8 / 90.73 / 96.34 / 98.59; lowest file `decodeLogic.ts` 73.8 % lines. | — (measurement) |
| P1.T2.1, P1.T2.2 | README:49 now reads "2,305 tests across 110 files" with `verified 2026-10-20`, and names the `vite.config.ts` thresholds and CI as the authority. | `35270da` |
| P1.T3.1 | The empty `## Parental Controls` heading was folded into the existing parental content: parental controls are already documented in `## Parental Lock & Touch UX`, the stray heading had no body and no inbound anchor (`rg "README.md#"` finds only the plan's own check), so it was removed instead of duplicated. | `a005686` |
| P1.T4.1 | TDD §10.2 counts and §10.3 coverage snapshot updated to the measured values, each carrying `verified 2026-10-20`. | `a3f490f` |
| P1.T4.2 | Re-measured the lowest-file claim: the numbers are still exactly `decodeLogic.ts` 73.8 / 74.54 / 83.33 / 56.66 with uncovered `63-77`; the "22-word pool" clause is true (`DECODE_POOL` = shared 18 + 4 CVC words). Sentence kept unchanged. | `a3f490f` |
| P1.T5.1 | Checked the build numbers. One correction: precache KiB 1,701.34 → 1,702.03 in README and in TDD §3.6 (both cite the same `precache` line). | `501cd1d` |
| P1.T5.2 | Verified-unchanged list recorded below. | `501cd1d` |
| — | Evidence file and artifacts. | (evidence commit) |

## Verified-unchanged claims (P1.T5.2)

| Claim (README / TDD) | Measured this phase | Source |
| --- | --- | --- |
| Shell entry 129.1 KiB against the 200 kB gate | `PASS: shell entry index-DkSW5M3z.js = 129.1 kB (<= 200 kB)` | `node scripts/validate-bundle.js` |
| 132.21 kB minified, 30.02 kB gzip | `dist/assets/index-DkSW5M3z.js 132.21 kB │ gzip: 30.02 kB` | `pnpm build` |
| 41 JavaScript chunks | 41 emitted `dist/assets/*.js`; validator prints `41 chunks, 41 precached` | build output + `validate-pwa.js` |
| 53 precache entries | `precache  53 entries` | `pnpm build` (PWA step) |
| Precache 1,701.34 KiB | **1,702.03 KiB** — CORRECTED in README:222 and TDD §3.6 | `pnpm build` (PWA step) |
| 1.37 MB Phaser vendor chunk | 1,374.82 kB (Vite) / 1342.6 kB (validator) — same bytes, decimal vs binary units, as TDD §3.6 already explains | `pnpm build`, `validate-bundle.js` |
| 53-key shell set = 22 tiles + 22 stickers + 2 mascot poses + `icon_speaker` + 6 avatars | 22+22+2+1+6 = 53; asserted by `src/__tests__/game/art/shellOwnership.test.ts:234-236`, `scenes/preloadScene.test.ts:75-76`, `scenes/navigation.test.ts:192-197`, `utils/textureTiers.test.ts:121` — all green | passing suite |
| 178 texture keys = 53 shell + 125 game-only | asserted by `game/art/groupIntegrity.test.ts:188-192` (`TOTAL_APP_ASSETS = 178`), `scenes/preloadScene.test.ts:91`, `utils/textureTiers.test.ts:52-53` — all green | passing suite |
| 12 art groups, 131 keys, 125 game-only, 24 story panels | 18+18+26+10+6+6+16+8+7+4+4+8 = 131; 131 − 6 shared avatars = 125 | `docs/TDD.md` §3.5 arithmetic + `shellOwnership.test.ts` count assertions |
| Story Order chunk ~33.9 kB | `dist/assets/StoryOrderScene-Bj8q1Pnw.js 33.92 kB` | `pnpm build` |
| Coverage thresholds 95 / 88 / 85 / 90 | `thresholds: { lines: 95, functions: 88, branches: 85, statements: 90 }` | `vite.config.ts:75-80` |
| `decodeLogic.ts` is the lowest-covered file | 73.8 % lines, next lowest are two 75 % config scenes (Add It Up, Take Away) | `pnpm test:coverage` |
| `sceneRegistry.ts` fully covered | absent from the per-file table, i.e. no uncovered line/branch/function/statement | `pnpm test:coverage` |

Not re-measured in this phase, and deliberately not edited: the cold-boot and cold-first-tap
figures (README:220, TDD §3.5 — those come from `scripts/validate-boot.js` and
`scripts/measure-first-tap.mjs`, which the phase brief does not list and which need a
preview server + browser), and the "22 lazy-loaded game scenes" wording at README:78
(explicitly out of this phase's scope).

## Deviations

None. Both edited files are inside `Touches`. `.conductor/evidence/` artifacts and this
evidence file are the only other writes.

## Notes

- **Counts are measured, not carried.** Both runs (standalone and inside the chain) reported
  the same 110 / 2,305 and the same four coverage metrics, so the stamped numbers are stable
  for this tree. Coverage's second decimal has moved between identical runs in earlier tracks;
  the values here come from this phase's two runs, both identical.
- **`pnpm check` is green with one pre-existing warning** — `noNonNullAssertion` at
  `src/__tests__/scenes/musicalMemoryScene.test.ts:294` — plus a biome schema-version info
  (config 2.5.5, CLI 2.5.10). Both exist on the base commit and are untouched by a docs-only
  change; Phase 5 owns source edits, so neither was "fixed" here.
- **Heading fix was a deletion, not an addition.** Parental behaviour is documented in full in
  `## Parental Lock & Touch UX` (hold-for-3s gate, 96×96 targets, settings rows, profiles,
  play-time limits) and the PRD owns the product rule (§5.3, "the parental lock"). A second
  `## Parental Controls` heading would have restated that content, which FR-2 trims in
  Phase 2. Nothing links to the removed anchor.
- **The precache delta is real, not cosmetic.** The same 53 entries measured 1,701.34 KiB at
  the shell-diet track (`conductor/archive/20261020-shell-diet-lazy-art/verification/integrated.md`)
  and 1,702.03 KiB here; the chunk list and every individual chunk size match, so the
  difference sits inside the emitted payload, not in the entry count. Both docs now quote the
  measured line.
- Line counts after this phase: `README.md` 286 lines (trimming to ≤170 is Phase 2's AC-2),
  `docs/TDD.md` unchanged in length.

## Primary verification

- Date: 2026-10-20
- Command: `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js`
- Exit code: 0
- Result: verified independently by the primary agent after the phase report.
- Measured: 110 test files / 2,305 tests passing; coverage statements 97.8, branches 90.73, functions 96.34, lines 98.59; precache 53 entries (1,702.03 KiB); bundle gate 129.1 kB shell (<= 200 kB); PWA validator 16/16.
- Additional check: README has 31 headings and 0 with an empty body (script over heading spans).

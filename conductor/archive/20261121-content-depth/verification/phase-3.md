# Phase 3 verification — Budget guard & no-repeat (2026-11-21)

- Phase base: `77501a25`
- Branch: `feat/20261121-content-depth`
- Result: **PASS** — all six verification commands green; synthetic fixtures prove both failure paths.

## User decision (recorded as instructed)

The spec's 39 MiB typical / 178 MiB full caps came from a 2026-10-17 measurement of 170 SVGs
(`docs/perf-baseline.md:206`). The tree now ships 313 SVGs. The user explicitly chose
**re-baseline + ratio**: measure the real tree, set round-number caps with small headroom, and keep
the hard structural `typical <= full / 2` ratio as the anti-bloat guard. This overrides the stale
FR-7 figures; no historical measurement was rewritten. A dated 2026-11-21 section was appended to
`docs/perf-baseline.md` with the explicit "supersedes the 39/178 MiB figures on line 206 after pool
expansion" line.

## Commands and exit codes (each run separately, no `&&` chains)

| # | Command | Exit | Evidence |
| --- | --- | --- | --- |
| 1 | `node scripts/validate-textures.js` | 0 | 313 SVGs (34 icon / 277 card / 2 hero); typical 74.57 MiB <= 80; full 313.00 MiB <= 320; ratio 0.238 <= 0.5; "All texture validation checks passed!" |
| 2a | `TEXTURE_GUARD_FIXTURE_DIR=…/texture-guard-fixtures/caps node scripts/validate-textures.js` | 1 | 400 card-tier SVGs: typical 100.00 MiB > 80 FAIL, full 400.00 MiB > 320 FAIL, ratio 0.250 PASS — "Texture validation failed: 2 check(s) failed." |
| 2b | `TEXTURE_GUARD_FIXTURE_DIR=…/texture-guard-fixtures/ratio node scripts/validate-textures.js` | 1 | 12 hero-tier SVGs: caps PASS (12.00 / 12.00), ratio 1.000 > 0.5 FAIL — "Texture validation failed: 1 check(s) failed." |
| 3 | `pnpm exec vitest run src/__tests__/game` | 0 | 60 files / 1224 tests passed |
| 4 | `pnpm exec vitest run` | 0 | 154 files / 3345 tests passed |
| 5 | `node scripts/validate-docs.js` | 0 | Results: 5 passed, 0 failed (incl. "The living docs state the current test-suite truth") |
| 6 | `pnpm check` | 0 | Checked 343 files, no fixes applied (two Biome formatter findings fixed manually before the green run) |
| 7 | `pnpm typecheck` | 0 | `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json` clean |

## Re-baselined numbers

| Measure | Value | Cap |
| --- | --- | --- |
| SVG files by basename | 313 (34 icon / 277 card / 2 hero) | unique-key guard |
| Typical tiered GPU bytes | 74.57 MiB | 80 MiB |
| Full uniform 512² bytes | 313.00 MiB | 320 MiB |
| Tier ratio typical/full | 0.238 | 0.5 (hard) |

The guard mirrors `src/utils/textureTiers.ts` ordered prefix rules (icon: `tile_`, `group_`,
`sm_shadow_`, exact `minus|plus|equals|sleep_zzz|icon_speaker`; hero: `mascot_`; default card)
against SVG basenames and also fails on duplicate keys.

## AC verdicts

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-6 Seeded-RNG tests assert no repeated item per playthrough in all four games | **PASS** | New `src/__tests__/game/noRepeatScheduling.test.ts`: 5 degenerate seeds + 128 deterministic sweep seeds × shifts -1/0/1 across Decode/Word (6 and 50 rounds), Build-the-Word (3 and 30), Shape Sorter (short and full-band), Story Order (ids and 3-panel permutations), Feelings & Faces (ids + all four emotions); 5 tests pass. No rule logic changed. |
| AC-7 Guard passes real assets, fails synthetic over-budget fixture, is in `verify_phase` | **PASS** | Commands 1/2a/2b above; `conductor/workflow.md` chain at lines 39 and 119, verification-layer table at line 224 and layer description at 194 all include `node scripts/validate-textures.js` after `validate-bundle.js`; `package.json` gained `validate:textures`. |

## Deviations

- Spec FR-7 / plan P3.T1.1 still name the stale 39/178 MiB caps; the user decision overrides them.
  Conductor state files were not edited.
- Added one test file (`noRepeatScheduling.test.ts`), changing the suite truth from 153/3,340 to
  154/3,345; living counts in `README.md`, `docs/TDD.md` and `docs/perf-baseline.md` were refreshed
  and `validate-docs` re-run green.

## Blockers

None.

## Primary verification (orchestrator, independent)

- Working tree clean before verification; `git diff --name-only 77501a25..HEAD` confined to
  authorized Phase 3 Touches (guard script, package.json, workflow.md, no-repeat test, living
  test-count docs, this evidence). Four commits: `ab2bd677`, `c67d1b1d`, `f5002e87`, `676f4397`.
- Full `verify_phase` chain re-run by the primary and passed (exit 0): `pnpm check` (Biome clean,
  343 files) → `pnpm typecheck` clean → `pnpm test -- --run` (154 files / 3,345 tests) →
  `pnpm test:coverage` (154 files / 3,345 tests; 97.14/90.97/96.25/98.31% above gates 95/88/85/90)
  → `pnpm build` (462 modules; shell `index-Bkt6cIfM.js` 192.39 kB Vite / 187.9 kB via validator
  ≤ 200 kB; Phaser vendor 1,367.08 kB pre-existing advisory) → `validate-bundle.js` PASS →
  `validate-pwa.js` 16/16 → `validate-docs.js` 5/5.
- Guard re-run by primary: `node scripts/validate-textures.js` PASS — 313 SVGs (34/277/2), typical
  74.57 MiB ≤ 80, full 313.00 MiB ≤ 320, ratio 0.238 ≤ 0.5. Confirmed wired into `verify_phase`
  at workflow.md lines 39/119/194/224 and package.json `validate:textures`.
- Synthetic failure re-produced by primary with a fresh 400-card-SVG fixture: exit 1, "typical
  100.00 MiB (> 80)" and "full 400.00 MiB (> 320)" both FAIL — AC-7 failure path proven.
- User decision (re-baseline + ratio overriding stale FR-7 caps) confirmed recorded in evidence
  and as a dated supersession note in docs/perf-baseline.md.
- Result: **verified**.

# Integrated Verification — Adaptive Difficulty Completion

- **Track:** 20261023-adaptive-banding-completion
- **Branch:** `feat/20261023-adaptive-banding-completion`
- **Base:** `master` @ `a054e5a86af2790cafad68b9121afcd23c5aa046`
- **Head:** `38bd03b` (the post-phase state; the last code commit is `e437dcd`, the last product-doc commit `38bd03b`)
- **Date:** 2026-10-23
- **Result:** verified

The four phases were executed sequentially and each was independently
verified; the figures below are the primary's own runs of the full
eight-segment `verify_phase` command on the final tree (2026-10-23).

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| static | `pnpm check` | 0 | 249 files; 1 pre-existing warning (`src/__tests__/scenes/musicalMemoryScene.test.ts:294` noNonNullAssertion), 1 pre-existing info (`biome.json` `$schema` 2.5.5 vs CLI 2.5.10) — both predate the track, neither in a changed file |
| static | `pnpm typecheck` | 0 | no diagnostics |
| unit | `pnpm test -- --run --maxWorkers=1` | 0 | 119 files / 2,556 tests |
| coverage | `pnpm test:coverage -- --maxWorkers=1` | 0 (after one retry) | statements 97.92% (5241/5352), branches 91.81% (1312/1429), functions 96.6% (1110/1149), lines 98.7% (4862/4926) — gates 90/85/88/95 all hold |
| build-artifact | `pnpm build` | 0 | 342 modules; 42 JS chunks; shell `index-5BMI4mqt.js` 137.79 kB / 134.6 kB gate-measured; PWA precache 54 entries (1722.25 KiB) |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present; shell 134.6 kB ≤ 200 kB |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed; 42 chunks, 42 precached |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed — run by the primary in every phase where the subagent allowlist denied it |
| smoke | `node scripts/validate-boot.js` (Phase 3) | 0 | three cold loads 1547/1036/1104 ms, median 1.10 s ≤ 3.0 s — required because the phase added assets |

### The test-run form

The plain `pnpm test -- --run` layer times out on this loaded host in files the
track does not touch (5,000 ms wall-clock per-test budgets under load). The
sanctioned form for both test layers is `--maxWorkers=1`, recorded as a
deviation in every phase. The final coverage run needed one additional retry
with `--testTimeout=30000` after a single wall-clock timeout in
`patternBuilderLogic.test.ts` (an untouched pure-logic file); the file passes
in isolation, `src/` was byte-identical at the time, and no test was edited to
work around a timeout.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-1 | One seeded shifted-vs-classic difference test per game (seven new) | `verification/phase-1.md`, `phase-2.md`, `phase-3.md` — failing-first confirmed against unmodified logic in all three phases | pass |
| AC-2 | Existing tests keep their outcomes; shift-0 regression pins | every phase's full-suite run; classic byte-identity pinned per game | pass |
| AC-3 | New content landed: 12 objects / 12 shadows, 5+6 stories / 33 panels, 24 scenarios; ownership tests updated; no boot-shell key; contact sheets regenerated | `verification/phase-3.md` + the user's visual review (PASSED) | pass |
| AC-4 | The documents describe the shipped system; roadmap entry removed; README headline updated; `validate-docs` green | `verification/phase-4.md`; the primary's own validate-docs run exit 0 after the changelog edit | pass |
| AC-5 | The full `verify_phase` including the boot smoke check passes | the commands table above | pass |

## Evidence paths

- `conductor/tracks/20261023-adaptive-banding-completion/verification/phase-1.md` (the three compose-only knobs)
- `conductor/tracks/20261023-adaptive-banding-completion/verification/phase-2.md` (the scale and scenario games)
- `conductor/tracks/20261023-adaptive-banding-completion/verification/phase-3.md` (the two art games)
- `conductor/tracks/20261023-adaptive-banding-completion/verification/phase-4.md` (the documentation truth pass)
- Raw outputs under the gitignored `.conductor/evidence/20261023-adaptive-banding-completion/`

## Deviations

1. The `--maxWorkers=1` test form in every phase, plus the final coverage
   retry with `--testTimeout=30000` — both under the workflow's fallback
   ladder and retry policy; no test edited.
2. `src/__tests__/game/storyOrderArt.test.ts`, `src/__tests__/scenes/preloadScene.test.ts`,
   `src/__tests__/utils/textureTiers.test.ts` — count-literal updates outside
   the phase-3 Touches (24→33 panels, 178→186 canonical keys), the sanctioned
   class the pool growth requires.
3. `src/game/art/items.ts` + `src/game/art/shadows.ts` — the plan omitted the
   art-group modules from Phase 3's Touches; registering the eight new keys is
   the necessary home for the new SVGs.
4. Two pre-existing test files edited beyond count literals:
   `feelingsFacesLogic.test.ts` pool-count literals (16→24, 4→6, sanctioned);
   `gameSceneBase.test.ts`/`choiceRoundScene.test.ts` untouched (no edits this
   track — none needed).
5. `docs/TDD.md` and `README.md` count-bearing suite/coverage/chunk snapshots
   refreshed beyond the phase-4 brief's anchor list — every replacement
   re-measured in the phase's own runs.
6. The subagent shell allowlist denied `node scripts/validate-docs.js` (and
   once `render-svg-contact-sheets.mjs` and the preview-stop commands) in
   phases 2–4; the primary ran each denied command directly, all exit 0.

## Notes

- No behaviour changed at the classic band: shift 0 draws are byte-identical,
  and `getAdaptiveBandShift` returns 0 when the parent toggle is off or the
  window holds fewer than six taps — so a child with the toggle off, a fresh
  profile, or a legacy save plays exactly the shipped game.
- The seven new participants' strategies are deliberately single-dimension
  (pool, waypoints, sleeping bounds, cluster draw, scale gap, contrast split,
  story mix) — no round counts, win targets, or reaction flows changed.
- The new art (8 shadow-match SVGs, 9 story panels) is agent-authored against
  `docs/SVG_STYLE.md`, lives in the lazy art groups and Story Order's own
  chunk, passed the user's visual review, and leaves the boot shell at
  exactly 53 keys.
- `conductor/product.md`'s changelog entry was written by the primary after
  Phase 4 (the phase executor cannot edit `conductor/**`).
- The version bump, the tag, the release notes, and any device pass remain
  outside the track — human release decisions.

# Phase 1 — Shared random module + seeded test helper

- **Track**: 20261025-shared-random-helpers
- **Phase**: 1
- **Date**: 2026-10-25
- **Branch**: `refactor/20261025-shared-random-helpers`
- **Base commit**: `ca8eefb8` (phase base)
- **Head commit**: `33c26ade`

## Result

**verified**

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Lint/format | `pnpm check` | 0 | 256 files checked; 1 pre-existing warning (`musicalMemoryScene.test.ts:294` noNonNullAssertion) + 1 pre-existing info (biome schema 2.5.5 vs CLI 2.5.10), both outside this phase's Touches and present at base. |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit` clean. |
| Unit tests | `pnpm test -- --run` | 0 | 123 files, 2687 tests, all passed (includes the 8 new `random.test.ts` + 6 new `randomHelper.test.ts`). |
| Coverage | `pnpm test:coverage` | 0 | 123 files / 2687 tests passed; `src/game/random.ts` instrumented (`coverage/src/game/random.ts.html` present). Totals 97.84% stmts / 91.63% branches / 96.79% funcs / 98.75% lines — above all configured gates (90/85/88/95). |
| Build | `pnpm build` | 0 |Built in 2.13s, 343 modules. |
| Bundle | `node scripts/validate-bundle.js` | 0 | Phaser vendor chunk present (1342.6 kB); shell entry 138.7 kB ≤ 200 kB; all checks passed. |
| PWA | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed. |
| Docs | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed. |
| Targeted | `pnpm test -- --run src/__tests__/game/random.test.ts src/__tests__/helpers/randomHelper.test.ts` | 0 | 2 files, 14 tests passed. |

## Evidence produced

| Item | Path |
| --- | --- |
| Shared module | `src/game/random.ts` |
| Module suite | `src/__tests__/game/random.test.ts` |
| Seeded helper | `src/__tests__/helpers/randomHelper.ts` |
| Helper suite | `src/__tests__/helpers/randomHelper.test.ts` |
| Coverage HTML for random.ts | `coverage/src/game/random.ts.html` (gitignored coverage/ output of `pnpm test:coverage`) |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1/B.1 | `Rng` type alias exported | `src/game/random.ts:6-11` (`export type Rng = () => number`) | ✅ |
| FR-1/B.2 | `shuffle<T>(items: readonly T[], rng?: Rng): T[]` Fisher–Yates over a copy | `src/game/random.ts:21-28` (copy first, `j = Math.floor(rng() * (i + 1))`, swap, return copy) | ✅ |
| FR-1 | `rng` parameter defaults to `Math.random` | `src/game/random.ts:21` (`rng: Rng = Math.random`) | ✅ |
| NFR-2 | TSDoc: phase goal contract | `src/game/random.ts:1-20` + `randomHelper.ts` TSDoc | ✅ |
| FR-5 | `mulberry32` single definition in `src/__tests__/helpers/` | `src/__tests__/helpers/randomHelper.ts` | ✅ |
| — (P1.T2.1) | Helper has no dependencies, named export, TSDoc seed contract, no export of an `Rng` mirror (seam lives in `random.ts`) | `randomHelper.ts` imports nothing; single `export function mulberry32` | ✅ |
| AC-1a | Input array untouched | `random.test.ts:26-33` ("returns a permutation without touching the input array") | ✅ |
| AC-1b | Empty input → `[]` | `random.test.ts:49-54` (also asserts rng never called) | ✅ |
| AC-1c | Single element → copy, never the same reference | `random.test.ts:56-62` (`expect(result).not.toBe(input)`) | ✅ |
| AC-1d | Two-element ordering under a fixed seed | `random.test.ts:64-69` (seed 1234 first draw 0.073294978… → `["b","a"]`; seed 42 first draw 0.601103751… → `["a","b"]`) | ✅ |
| AC-1e | Full-sequence determinism for a fixed seed | `random.test.ts:35-40` (two independent `mulberry32(1234)` runs deep-equal over the 24-item pool) | ✅ |
| AC-1f | Boundary rng values 0.0 and `1 - Number.EPSILON` keep every index in range over a ≥ 24-item realistic pool | `random.test.ts:71-84` (0.0 → `j = 0` left rotation; near-1 → identity permutation in a fresh copy) over the 24-item POOL | ✅ |
| AC-1g | Default wiring works when no rng is passed | `random.test.ts:86-93` (scoped `vi.spyOn(Math, "random")` fallback wiring assertion, labelled as the FR-6 exception) | ✅ |
| AC-1h | Seeded generator accepted through the `Rng` seam | `random.test.ts:42-47` (`CONSTANT_RNG: Rng` + per-test `mulberry32(...)` calls) | ✅ |
| AC-4 (helper half) | Exactly one seeded-helper definition | `git grep mulberry32 -- src/` → `randomHelper.ts` (definition) + `random.test.ts` (consumption); no LCG or Park–Miller bodies exist in the new phase files | ✅ |
| NFR-4 | No new dependencies; budgets unbroken | `package.json` untouched; `validate-bundle.js` passed | ✅ |

## Verify evidence

| Item | Path |
| --- | --- |
| This report | `conductor/tracks/20261025-shared-random-helpers/verification/phase-1.md` |
| Track spec | `conductor/tracks/20261025-shared-random-helpers/spec.md` |
| Track plan | `conductor/tracks/20261025-shared-random-helpers/plan.md` |
| Module | `src/game/random.ts` |
| Suite | `src/__tests__/game/random.test.ts` |
| Helper | `src/__tests__/helpers/randomHelper.ts` |
| Helper suite | `src/__tests__/helpers/randomHelper.test.ts` |
| Coverage artifact | `coverage/src/game/random.ts.html` |

## Deviations

- **`src/__tests__/game/random.test.ts` keeps a `CONSTANT_RNG: Rng` seam-consumer constant** after adopting `mulberry32`: the file imports `type Rng` to prove in-file (AC-1h) that any injected generator satisfies the seam, which keeps the `Rng` import deliberately used and satisfies `noUnusedLocals`. Not a product/design decision — a mechanical refactor choice within Touches.
- **Coverage text summary groups `random.ts` under "All files"** rather than printing per-file rows for 100%-covered files, so the module's coverage is confirmed via the generated HTML artifact (`coverage/src/game/random.ts.html`) and the gated totals (all above thresholds, chain exit 0).

## Notes

- Phase 1 intentionally touches nothing outside `Touches`: no production module consumes the new `shuffle` yet; importers re-point in Phase 2.
- The helper's TSDoc carries implementation-derived mulberry32 constants (seed 1234 first draws 0.073294978…073294978, 0.703411989…, 0.902856019…; seed 0 → 0.266429208…; seed 2026 → 0.455407699…). The helper test suite (P1.T2.2) pins these so accidental helper drift is caught; if the helper ever changes, the constants are regenerated from the implementation and updated in both `randomHelper.ts` docstring and `randomHelper.test.ts`.
- The exact mulberry32 body: `a = (a + 0x6d2b79f5) | 0` (mod 2^32),
  `t = Math.imul(a ^ (a >>> 15), 1 | a)`, `t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t`,
  return `((t ^ (t >>> 14)) >>> 0) / 0x100000000`.
- Biome lint notes: my own file (random.test.ts) initially had an import-order (organizeImports) fixable error, which I fixed immediately; remaining `pnpm check` output is a pre-existing warning (`musicalMemoryScene.test.ts:294` noNonNullAssertion) and a pre-existing info (biome schema 2.5.5 vs CLI 2.5.10) both outside my Touches and both present at the phase base — not mine to fix, recorded here for the primary.
- Pre-existing warning/info reproduce at base commit `ca8eefb8`, confirming they predate Phase 1.

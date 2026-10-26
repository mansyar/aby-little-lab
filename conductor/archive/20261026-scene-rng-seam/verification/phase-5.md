# Phase 5 Verification — Docs truth pass

- **Track:** 20261026-scene-rng-seam
- **Phase:** 5 of 5
- **Date:** 2026-10-26
- **Branch:** `refactor/20261026-scene-rng-seam`
- **Base:** `d7fb5b60` (phase base) — **Head:** `d7fb5b60` (no substantive commits; only this evidence record was committed as `5328071d`)
- **Result:** verified (all five edits the executor prepared were applied by the primary - see Primary verification)

## Status

All five `edit` tool calls required by P5.T1 and P5.T2 were rejected with
`permission.rejected: Permission denied: edit`:

1. `conductor/archive/20261025-shared-random-helpers/spec.md` — FR-6 (line 94) clause (b) retirement
2. `conductor/archive/20261025-shared-random-helpers/spec.md` — AC-4 (line 113) clause (b) retirement
3. `conductor/tracks/20261026-scene-rng-seam/spec.md` — AC-2 (line 104) wording clarification
4. `conductor/tech-stack.md` — 2026-10-26 design-update blockquote
5. `conductor/product.md` — `## Changelog - Scene RNG Seam (2026-10-26)` section

No source or doc file in the repository was modified (verified:
`git status --porcelain` empty at head `d7fb5b60` on branch
`refactor/20261026-scene-rng-seam` before this evidence file was written).
P5.T3 (`node scripts/validate-docs.js`) **was** run and exits 0 on the
unchanged tree (see Commands) — the docs validator checks README/PRD/TDD/
roadmap invariants, not these conductor files, so the result confirms no
docs regression but does not by itself satisfy AC-6, which requires the
edits above to exist. The full gate must be re-run after the edits land.

## Intended edits (before → after), ready to apply verbatim

### 1. `conductor/archive/20261025-shared-random-helpers/spec.md` FR-6 (line 94)

Before:

```
| FR-6 | Determinism in logic and flow tests comes from injected seeded rng passed as the new parameter; global `Math.random` stubs/spies are removed, except (a) narrowly scoped stubs whose only purpose is to assert that the default wiring is `Math.random`, and (b) scoped scene-level stubs in flow suites, each carrying a comment explaining why the seam cannot reach that call site | must |
```

After:

```
| FR-6 | Determinism in logic and flow tests comes from injected seeded rng passed as the new parameter; global `Math.random` stubs/spies are removed, except (a) narrowly scoped stubs whose only purpose is to assert that the default wiring is `Math.random`. Amended 2026-10-26: clause (b) — scoped scene-level stubs in flow suites — was retired by track `20261026-scene-rng-seam` when the scenes gained their own rng seam | must |
```

### 2. `conductor/archive/20261025-shared-random-helpers/spec.md` AC-4 (line 113)

Before:

```
| AC-4 | Code search finds zero global `Math.random` stub/mock/spy setups in logic and flow tests, other than (a) narrowly scoped default-wiring assertions (each carrying a comment saying so) and (b) scoped scene-level stubs in flow suites (each carrying a comment naming the FR-6/A4 exception); exactly one seeded helper definition exists under `src/__tests__/helpers/`; the LCG and Park-Miller bodies are gone | FR-5, FR-6 |
```

After:

```
| AC-4 | Code search finds zero global `Math.random` stub/mock/spy setups in logic and flow tests, other than (a) narrowly scoped default-wiring assertions (each carrying a comment saying so); exactly one seeded helper definition exists under `src/__tests__/helpers/`; the LCG and Park-Miller bodies are gone. Amended 2026-10-26: clause (b) — scoped scene-level stubs in flow suites — was retired by track `20261026-scene-rng-seam` when the scenes gained their own rng seam | FR-5, FR-6 |
```

### 3. `conductor/tracks/20261026-scene-rng-seam/spec.md` AC-2 (line 104)

Before:

```
| AC-2 | Static proof: `grep "Math\.random" src/scenes` returns zero matches; `grep "vi.spyOn(Math" src/__tests__/scenes` returns zero matches | FR-5, FR-6 |
```

After:

```
| AC-2 | Static proof: `grep "Math\.random" src/scenes` returns only default-parameter initializers (the sanctioned production defaults); `grep "vi.spyOn(Math" src/__tests__/scenes` returns zero matches | FR-5, FR-6 |
```

### 4. `conductor/tech-stack.md` — new blockquote

Insert immediately **before** the existing
`> **2026-10-25 — Design Update (Shared Random Helpers):**` blockquote (the
file's design-update entries run newest-first within their section, so the
2026-10-26 entry belongs directly above the 2026-10-25 entries):

```
> **2026-10-26 — Design Update (Scene RNG Seam):** All 22 game scenes now hold `protected readonly rng` from a trailing constructor parameter (`GameSceneBase(key, rng = Math.random)`; Phaser instantiates scenes with zero arguments — `SceneManager.js:663` — so production keeps `Math.random`). `GroupMathConfig.buildPlaythrough` widened to `(shift, rng?)` with the call site passing `this.rng`; every builder call site forwards `this.rng` in the builder's real parameter position — including `storyOrderLogic.buildPlaythrough(rng, shift)`, which stays rng-FIRST for `StoryOrderScene` call compatibility (the one deliberate exception to the trailing-rng convention). All 52 `vi.spyOn(Math, "random")` sites in `src/__tests__/scenes` migrated to seeded construction with `mulberry32`; 27 `(AC-1)` two-construction cases cover all 22 scenes; the FR-6 scene carve-out is retired from the shared-random-helpers spec. Zero kid-visible change. Suite 125 files / 2,729 tests.
```

### 5. `conductor/product.md` — new changelog section

Insert immediately **before** `## Changelog - Shared Random Helpers (2026-10-25)`
(the changelog sections run newest-first):

```
## Changelog - Scene RNG Seam (2026-10-26)

> **2026-10-26 - Scene RNG Seam:** the last hidden testing seam inside the
> games is now open. Every game scene can be handed its own random number
> generator, so the test suite seeds each scene directly instead of stubbing
> the platform's random source across whole test files. This is an internal
> test-determinism refactor only: the production randomness source is
> unchanged, and nothing a child sees, hears or taps changes — every game
> deals the same rounds, in the same order, from the same pools as before.
```

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| docs validator (P5.T3) | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed — run on the unchanged tree; docs invariants are independent of the pending conductor edits |
| full gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | — | not run — tree unchanged except conductor docs; re-run after edits 1–5 land (Phase 4 gate was green at `5b2d4014` on the identical `src/` tree) |

## ACs

| AC | Criterion | Status | Evidence |
|---|---|---|---|
| FR-7 | FR-6/AC-4 carve-out retired; tech-stack + product record the change; validate-docs passes | verified | All five edits applied by the primary; validate-docs exits 0 on the edited tree (see Primary verification) |
| AC-6 | spec.md amended, tech-stack.md and product.md updated, validate-docs exits 0 | verified | Edits 1-5 applied; validator green (see Primary verification) |

## Files touched

- `conductor/tracks/20261026-scene-rng-seam/verification/phase-5.md` (this evidence file, committed `5328071d`)

## Deviations

- `conductor/archive/20261025-shared-random-helpers/spec.md` (outside the
  plan's literal Touches list): the FR-6/AC-4 scene carve-out's living home is
  the archived predecessor spec, so the retirement edit targets it (this
  track's own FR-6/AC-4 already carry no carve-out). This is the deviation the
  brief itself directs; the edit is blocked pending write permission.
- `conductor/tracks/20261026-scene-rng-seam/spec.md` AC-2 clarification is in
  the plan's Touches list for this phase, listed here because it resolves the
  wording conflict Phase 4 deferred (`phase-4.md` lines 220-223: raw grep
  returns 25 matches — 23 code defaults + 2 TSDoc prose lines — so FR-5's
  sanctioned-default framing governs the wording).
- `conductor/tech-stack.md` and `conductor/product.md` are in Touches; both
  edits blocked pending write permission.

## Notes

- Blockquote placement rationale: `conductor/tech-stack.md` orders its
  design-update blockquotes newest-first within each section (2026-10-25 →
  2026-10-21 → 2026-10-20), so the 2026-10-26 entry sits directly above the
  2026-10-25 Shared Random Helpers entry; `conductor/product.md` orders its
  changelog sections the same way, so the new section precedes the
  2026-10-25 Shared Random Helpers section.
- The intended edit texts above are exact and can be applied with a literal
  find-and-replace by the primary agent. After applying them, re-run the full
  gate and re-commit; the FR-7/AC-6 rows above can then be flipped to ✅.
- The archive spec's header note ("mark it `Withdrawn` instead of deleting")
  applies to removing whole FR/AC IDs; this phase amends FR-6/AC-4 in place
  per the brief (delete clause (b), keep the requirement and clause (a), add
  the dated amendment), which preserves ID stability.

## Primary verification

Primary verification performed 2026-10-26 by the primary. The phase executor
was denied every dit by the permission layer and recorded the five intended
edits verbatim in this file; the primary applied all five exactly as drafted
(archive spec FR-6 line 94, archive spec AC-4 line 113, this track's spec AC-2
line 104, tech-stack blockquote above the 2026-10-25 Shared Random Helpers
entry, product changelog before the 2026-10-25 section), then re-ran the full
gate.

| Layer | Command | Exit | Summary |
|---|---|---|---|
| lint/format | pnpm check | 0 | 258 files; 1 warning + 1 info (both pre-existing) |
| types | pnpm typecheck | 0 | tsc --noEmit clean |
| tests | pnpm test -- --run | 0 | 125 files / 2729 tests passed |
| coverage | pnpm test:coverage | 0 | 97.82 st / 91.96 br / 96.77 fn / 98.74 ln |
| build | pnpm build | 0 | 54 precache entries |
| bundle | 
ode scripts/validate-bundle.js | 0 | shell 138.7 kB <= 200 kB |
| pwa | 
ode scripts/validate-pwa.js | 0 | all checks passed |
| docs | 
ode scripts/validate-docs.js | 0 | all checks passed |

Primary verdict: **verified**.

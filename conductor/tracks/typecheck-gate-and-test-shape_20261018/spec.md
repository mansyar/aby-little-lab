# Specification: Typecheck Gate + Test Suite Shape

## Overview

CI currently cannot fail on a type error. `pnpm build` is `vite build` (rolldown, no
`tsc`), there is no `typecheck` script, and TypeScript is only exercised incidentally by
editors. As a result **~116 type errors have accumulated in `src/__tests__/`** and 7 more
live in the two shared test helpers, all invisible to the pipeline. Production `src/` is
already clean today, which makes this the cheapest moment to lock the gate in place.

This track makes TypeScript a first-class gate, clears the debt the gate would immediately
surface (without weakening any assertion), and reshapes the test suite so the gate and the
suite stay affordable as the project grows:

- the 5,842-line `navigation.test.ts` splits into four focused suites;
- `BigSmallScene`, `BootScene`, and `ShadowMatchScene` gain their first tests.

No user-facing behaviour changes. If resolving a type error reveals a genuine runtime bug,
that bug is reported to the user rather than silenced with a cast.

## Functional Requirements

1. **Typecheck script**
   - Add `"typecheck": "tsc --noEmit"` to `package.json`.
   - Uses the existing single `tsconfig.json` (strict, `noUnusedLocals`,
     `noUnusedParameters`, `verbatimModuleSyntax`); no new config files, no relaxed flags.
   - Exits non-zero on any error in `src/` or `src/__tests__/`.

2. **Zero type errors**
   - `pnpm typecheck` reports no errors.
   - Forbidden solutions: `@ts-nocheck`, `@ts-ignore`, introducing `any`, blanket
     `as unknown as` casts, or deleting assertions to dodge a type complaint.
   - Where a cast remains genuinely necessary (Phaser mock shims), it must be narrow,
     local, and carry a one-line comment explaining why.

3. **Typed mock utilities**
   - `MockFn` must be genuinely callable under Vitest 4's
     `Mock<Procedure | Constructable>`; today it resolves to a `new`-only type and causes
     the majority of the errors.
   - `MatchMediaStub` becomes a type alias (an interface cannot extend a `Mock` type) that
     exposes `mockImplementation`, so the three call sites in scene tests type-check.
   - `phaserMock` factories type their captured `args` and registry entries instead of
     relying on casts at every consumer.

4. **CI gate**
   - `.github/workflows/ci.yml` gains a dedicated **Typecheck** step, ordered before the
     test step, so a type failure is visibly distinct from a test failure in PR checks.
   - The existing Quality Gates job continues to run lint → test → build → bundle → PWA →
     boot validation unchanged.

5. **`navigation.test.ts` split**
   - Four suites by concern: hub navigation/entry, profile switching, settings wiring,
     game launch & return.
   - Test bodies move **unchanged**; only shared fixtures (hub scene harness, handler
     accessors) are extracted into a helper.
   - The original file is deleted only after the assertion count is verified equal.

6. **Missing scene suites**
   - `BigSmallScene` — round progression, win and lose paths, adaptive band application.
   - `ShadowMatchScene` — matching taps, wrong-answer feedback, completion.
   - `BootScene` — `create()` routes to Preload with a fade, first-gesture audio unlock,
     reduced-motion path.

7. **Documentation**
   - README development commands list `pnpm typecheck`.
   - `conductor/tech-stack.md` CI section records the typecheck gate and the new suite
     layout.

## Non-Functional Requirements

- **No behavioural change** to the app: no production module is refactored in this track.
- **No coverage regression**: the split preserves every existing assertion, and test count
  must not decrease.
- **Performance**: full suite runtime within ~10% of the current baseline (≈4 min).
- **Maintainability**: no test file exceeds ~1,600 lines after the split.

## Acceptance Criteria

- [ ] `pnpm typecheck` exits 0 with the current codebase.
- [ ] Deliberately introducing a type error in `src/` **and** separately in
      `src/__tests__/` makes `pnpm typecheck` fail (verified, then reverted).
- [ ] `.github/workflows/ci.yml` runs Typecheck before tests; PR checks show it.
- [ ] `pnpm check` and `pnpm test` are green; test count is greater than or equal to the
      pre-track count of 1,980.
- [ ] `navigation.test.ts` no longer exists; four replacement suites pass, and their
      combined assertion count equals the original.
- [ ] `BigSmallScene`, `BootScene`, and `ShadowMatchScene` each have a passing suite.
- [ ] Bundle, PWA, and boot validators still pass unchanged.

## Out of Scope

- New features or gameplay changes.
- Coverage threshold changes.
- Refactoring production modules (including the deferred review nits from the
  god-file-decomposition track).
- Changing the test runner, environment, or mocking library.
- Adding visual/regression testing infrastructure.

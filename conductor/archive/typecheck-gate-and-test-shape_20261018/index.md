# Track: Typecheck Gate + Test Suite Shape

- **ID:** `typecheck-gate-and-test-shape_20261018`
- **Type:** Chore
- **Status:** New
- **Branch:** `chore/typecheck-gate-and-test-shape`

## Documents

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

## Summary

Make TypeScript a real gate: add a `typecheck` script and a dedicated CI step, then clear
the ~116 type errors currently hidden in `src/__tests__/` by typing the shared mock
helpers properly rather than casting around them. Reshape the suite so the gate stays
affordable — split the 5,842-line `navigation.test.ts` into four focused suites and add
first coverage for `BigSmallScene`, `BootScene`, and `ShadowMatchScene`. No user-facing
behaviour changes.

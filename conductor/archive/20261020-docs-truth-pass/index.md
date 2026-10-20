# Docs & Dead-Code Truth Pass

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** `chore`
**Priority:** `medium`
**Branch:** `chore/20261020-docs-truth-pass`
**Depends on:** none

## Goal

Make the repository's prose match the app that ships: corrected test counts and
current-state claims in `README.md`, `docs/TDD.md` and `conductor/product.md`,
a de-duplicated README that links to the PRD/TDD instead of restating them, no
refactor-leftover comments or orphan JSDoc, no Vite config warning, and the
executed `drop-ligne-mascot` track archived instead of sitting as `new`.

## Artifacts

- `verification/` — phase evidence, created during implementation
- `review.md` — created by `conductor-review`
- `pr.md` — created by `conductor-implement` before opening a PR

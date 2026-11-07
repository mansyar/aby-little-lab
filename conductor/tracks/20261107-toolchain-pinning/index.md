# Toolchain Pinning

## Specification

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

## Status

- **Type:** chore
- **Priority:** high
- **Branch:** `chore/20261107-toolchain-pinning`
- **Base:** `master` @ `b8d43ffe`
- **Depends on:** none

## Summary

The repository states its pnpm and Node versions in four places and owns them in
none: `package.json` declares neither `packageManager` nor `engines`, the design
document says pnpm 11.17.0, CI and the Dockerfile pin 11.7.0, and the developer
runs 12.16.1. This track makes `package.json` plus a `.node-version` file the
single declaration, has CI, the Docker build stage and the documents consume it,
and adds a guard test that fails when any of them disagrees. It also stops CI
paying three minutes of unit tests and browser journeys for a markdown-only
change, without ever leaving a required check unreported.

## Artifacts

- `verification/phase-1.md`, `phase-2.md`, `phase-3.md` — per-phase evidence
- `verification/integrated.md` — cross-phase verification
- `review.md` — review verdict and any overrides
- `pr.md` — pull request record

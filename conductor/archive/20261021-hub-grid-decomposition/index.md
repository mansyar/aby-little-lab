# Track: Hub Grid Decomposition

- **Spec:** [./spec.md](./spec.md)
- **Plan:** [./plan.md](./plan.md)
- **Metadata:** [./metadata.json](./metadata.json)

## Overview

Decompose the 773-line `src/game/hubGrid.ts` god file into focused concern modules under `src/game/hub/` behind a thin orchestrator (≤200 lines), with behavior parity and only visually-indistinguishable cleanups.

| Field | Value |
| --- | --- |
| Type | refactor |
| Priority | medium |
| Branch | `refactor/20261021-hub-grid-decomposition` |
| Depends on | none |

## Artifacts

- `verification/` — created during implementation (phase evidence)
- `review.md` — written by conductor-review after implementation
- `pr.md` — written by conductor-implement at PR time

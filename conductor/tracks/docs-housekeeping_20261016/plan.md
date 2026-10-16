# Implementation Plan: Docs & Housekeeping Refresh

> **Track:** `docs-housekeeping_20261016` · **Spec:** [spec.md](./spec.md) (Source of Truth)
> Docs-only chore — TDD N/A per workflow §Task Workflow step 3 (no logic-bearing code). Verification via existing gates: `pnpm run check` · `CI=true pnpm test` · `pnpm run build` + manual doc/link review.
> Commit style `<type>(<scope>): <desc>` (`docs()` for prose, `chore(conductor)` for registry/archive).

## Phase 1 — README refresh

- [x] Task 1.1: Mini-games table 18 → 20 rows (Decode It + Number Order with milestone + ✅ status; replay-variety paragraph appended). [1534a68]
- [x] Task 1.2: Counts + structure (1101/45 → fresh full-suite figures; scenes/registry/preload/Hub 5×4 text). [a2a2f8e]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [16be6a3]

## Phase 2 — v1.17.0 release notes

- [x] Task 2.1: Author `docs/release-notes-v1.17.0.md` from git history (v1.16.0 notes structure: Highlights → Changes → Verification → Known issues). [5313155]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [0894492]

## Phase 3 — PRD / TDD amendments

- [x] Task 3.1: `docs/PRD.md` — Games 19–20 entries + adaptive coverage 12 → 15. [007a318]
- [x] Task 3.2: `docs/TDD.md` — registry 22 → 23 loaders, preload 168 → 170, Hub 5×3+4 → 5×4, paging 6+6+6+1 → 6+6+6+2, adaptive facade ids. [007a318]
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [dbbe5d8]

## Phase 4 — Archive, registry fix & full verification

- [~] Task 4.1: Archive `number-order_20260828` (`conductor/tracks/` → `conductor/archive/`) + fix `tracks.md` link to `./archive/…` with `(Archived)`.
- [ ] Task 4.2: Full gates — `pnpm run check` · `CI=true pnpm test` · `pnpm run build` + relative-link review (`tracks.md` → archive `index.md`, README anchors, notes cross-links).
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Checkpoints

- Phase 1: `[checkpoint: 16be6a3]`
- Phase 2: `[checkpoint: 0894492]`
- Phase 3: `[checkpoint: dbbe5d8]`
- Phase 4: `[checkpoint: pending]`
- Track: `[checkpoint: pending]`

## Verification Notes

- `git diff --stat` for the track must show only `*.md` + `conductor/` paths (no `src/`, `public/`, configs).
- README figures re-verified by a fresh full-suite run at implementation time; figures recorded in the git note.
- Release-notes claims traceable to merged commits/tags; ambiguities flagged, never guessed.

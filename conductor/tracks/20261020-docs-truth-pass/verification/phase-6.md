# Phase 6 — Close the Executed Ligne Track

- **Track:** `20261020-docs-truth-pass` — Docs & Dead-Code Truth Pass
- **Phase:** 6 — Close the Executed Ligne Track
- **Date:** 2026-10-20
- **Branch:** `chore/20261020-docs-truth-pass`
- **Base:** `bd35e19`
- **Result:** verified

## 1. Covers

FR-9, AC-9. Executed by the primary (Conductor state edits, not a phase subagent run).

## 2. Proof that Ligne is absent (P6.T1)

| Check | Command | Result |
| --- | --- | --- |
| Dependencies | `rg "@ligne-engine" package.json pnpm-lock.yaml` | 0 hits |
| Engine assets on disk | `Get-ChildItem -Recurse dist -Include *.ligne,*.wasm` | 0 files |
| Build-time assertion | `node scripts/validate-pwa.js` | pass — the script asserts no `.ligne` asset and no `ligne_wasm_bg` chunk in the precache |
| Deletion commit | `git log --diff-filter=D -- src/components/LigneMascot.ts` | `755d575` "refactor(mascot): single-path tween Hoot — strip Ligne, add curious/flap tweens, delete engine files", 2026-10-17 |
| Source references | `rg "activateLigne|LigneMascotLoader|pendingLigneReaction" src` | 0 hits |

## 3. Archive move (P6.T2)

- `git mv conductor/tracks/drop-ligne-mascot_20261016 conductor/archive/drop-ligne-mascot_20261016` — four files moved with history: `index.md`, `metadata.json`, `plan.md`, `spec.md`.
- `conductor/tracks/` now holds only the live track (`20261020-docs-truth-pass`).
- `metadata.json`: `status` `new` → `complete`, `archived_at` → `2026-10-20`, `archive_path` → `conductor/archive/drop-ligne-mascot_20261016`, `doc_sync` → `updated`.
- `index.md`: the header status line now reads "complete — archived 2026-10-20", and a new `## Archive note` records that the work landed in `755d575` before the track was executed, lists what that commit deleted, and states what this phase verified.

## 4. Registry ledger (P6.T3)

`conductor/tracks.md` line 186, rewritten in place, never removed:

Before:

```
- [x] **Track: Drop Ligne Engine — Tween/SVG-Only Mascot** *Link: [./tracks/drop-ligne-mascot_20261016/index.md](./tracks/drop-ligne-mascot_20261016/index.md)*
```

After:

```
- [x] **Track: Drop Ligne Engine — Tween/SVG-Only Mascot** *Link: [./archive/drop-ligne-mascot_20261016/index.md](./archive/drop-ligne-mascot_20261016/index.md)* (Archived)
```

The marker was already `[x]` (the v1.x registry recorded it as done); what changed is the link target and the `(Archived)` suffix.

## 5. State verification (P6.T4)

| Check | Result |
| --- | --- |
| No track folder remains under `conductor/tracks/` | pass — only `20261020-docs-truth-pass` |
| Registry link resolves | pass — `conductor/archive/drop-ligne-mascot_20261016/index.md` exists |
| Metadata fields | pass — `complete`, `2026-10-20`, archive path, `doc_sync: updated` |
| Stale path references inside live (non-dated) docs | 0 |

Two references to the old path remain, both deliberately:

1. `conductor/tech-stack.md:381` — a dated `> **2026-10-16 — Design Update …**` entry that records where the track and branch stood when the code landed. Dated entries are frozen by this track's policy (NFR-4 and Phase 4); the path is history, and the archive note in the track's index is the pointer a reader needs.
2. `conductor/tracks/20261020-docs-truth-pass/spec.md:28,158` and `plan.md:134` — the audit row that describes the defect being fixed ("is `status: \"new\"` although Ligne was deleted in `755d575`") and the scope line naming the folder this phase moved. A spec that describes the before-state must keep describing it.

## 6. Commands

| Step | Command | Exit |
| --- | --- | --- |
| `pnpm check` | `biome check` | 0 |
| `pnpm typecheck` | `tsc --noEmit` | 0 |
| Tests | `CI=true pnpm test -- --run` | 0 — 110 files, 2,305 tests |
| Coverage | `pnpm test:coverage` | 0 — statements 97.8, branches 90.73, functions 96.34, lines 98.59 |
| Build | `pnpm build` | 0 |
| Bundle gate | `node scripts/validate-bundle.js` | 0 |
| PWA gate | `node scripts/validate-pwa.js` | 0 |

Raw output: `.conductor/evidence/phase-6-*.txt`.

## 7. Notes

- No source or build file changed in this phase; the diff is Conductor state only (track folder move, metadata, index, registry).
- The archived track's `legacy: true` marker and v1-style fields were left intact so the archive still reads as what it was.

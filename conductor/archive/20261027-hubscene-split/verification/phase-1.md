# Phase 1 — Art Tables Extraction: Phase Report (BLOCKED on verification)

- Track: 20261027-hubscene-split — HubScene Decomposition
- Phase: 1 — Art Tables Extraction
- Date: 2026-10-27
- Branch: refactor/20261027-hubscene-split
- Base commit: 3f7b1b4f61f03cb95956742e1ba1f59d3f5f9ee9
- Head commit: 6a9cd14e (see commits below; this report left uncommitted)
- Result: blocked (implementation complete and committed; `pnpm` denied to
  this executor, so verification is delegated to the primary per the brief)

## Summary

Art-group tables, loaders, types, and the resolve/cache logic now live in
`src/game/hub/artGroups.ts`; `HubScene` keeps only delegation (a
`createArtResolver()` instance plus a `resolveArtSvg` wrapper with the
unchanged signature the parity test pins). New parity/unknown-key/cache-reuse
tests live at `src/game/hub/__tests__/artGroups.test.ts`. The dynamic-import
source-guard positives in `hubScene.test.ts` were retargeted to the new
module's raw source (the only change to that file, as authorized); negatives
stay on `HubScene.ts`. All 13 dynamic `import()`s are preserved verbatim
(12 `../art/<group>` + `../storyOrderArt`, now relative to `src/game/hub/`);
no static art imports were introduced anywhere. `pnpm` is permission-denied
for this executor, so the three verification commands below must be run by
the primary.

## Commits

- `7ca876cb` — `refactor(hubscene-split): extract art tables and resolver
  into game/hub/artGroups` (P1.T1: new module + `HubScene` import swap,
  member removal, delegation)
- `6a9cd14e` — `test(hubscene-split): add artGroups parity tests and retarget
  source guard` (P1.T2: new test + guard retarget only)

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| review | read brief, spec, plan (Phase 1), tech-stack, workflow, style guides, `HubScene.ts`, `hubScene.test.ts`, `prewarm.ts`, `art/registry.ts`, `art/types.ts` | 0 | Contract + seam review; design matches precedent (`prewarm.ts` factory style) |
| git | `git status` / `git add` / `git commit` (two task commits) | 0 | `7ca876cb`, `6a9cd14e`; tree clean after commits |
| unit | `pnpm vitest run src/game/hub/__tests__/artGroups.test.ts src/__tests__/scenes/hubScene.test.ts` | denied | `Permission denied: shell` — delegated to primary (blocker 1) |
| static | `pnpm typecheck` | denied | Not attempted after denial (blocker 2; same root cause) |
| static | `pnpm check` | denied | Not attempted after denial (blocker 3; same root cause) |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | Art tables + resolver extracted to `src/game/hub/`; `HubScene` imports them | `src/game/hub/artGroups.ts` (new, commit `7ca876cb`); `HubScene.ts` keeps delegating `resolveArtSvg(entry)` with unchanged signature | done, pending test run |
| NFR-2 | All 13 `import()`s stay dynamic; no static art imports | Loaders moved verbatim; `grep` shows zero `from "../art`/`from "../game/art` static imports in either file; retargeted guard asserts 12 + story panels on the new module | done, pending test run |
| AC-1 | Resolver parity test passes; `hubScene.test.ts` green with guard retarget only | `src/game/hub/__tests__/artGroups.test.ts` (parity mirrors `:1393-1419` incl. `shape_circle` fallback, unknown-key, cache reuse); guard diff limited to 1 import + 3 positive-assertion lines | blocked on `pnpm` run |

## Evidence paths

- This report:
  `conductor/tracks/20261027-hubscene-split/verification/phase-1.md`
  (uncommitted; left for the primary state commit)
- New module: `src/game/hub/artGroups.ts`
- Rewired scene: `src/scenes/HubScene.ts`
  (import `:10`; delegation field `:151-157`; wrapper `:605-613`)
- New tests: `src/game/hub/__tests__/artGroups.test.ts`
- Guard retarget: `src/__tests__/scenes/hubScene.test.ts`
  (`:207` new raw-source import; `:1214-1216` positives on `artGroupsSource`;
  negatives `:1212-1213` untouched)

## Deviations

- `src/__tests__/scenes/hubScene.test.ts` — TOUCHED, but strictly within the
  corrected brief's authorization: 1 added raw-source import + 3 retargeted
  positive-assertion lines; negatives and everything else unchanged. Also
  reflected in amended plan Phase 1 Touches (commit `b728b928`).
- New test placed at `src/game/hub/__tests__/artGroups.test.ts` per
  brief/plan (colocated hub tests, matching the track's Phase 4 precedent
  `src/game/hub/__tests__/playTimeUi.test.ts`), not under `src/__tests__/`.
- Resolver exposes injectable loaders
  (`createArtResolver(loaders = ART_GROUP_LOADERS)`) so the cache-reuse test
  can count table loads without touching real chunks; default wiring is
  byte-identical logic to the old method.

## Notes

- For the primary's verification run: the retargeted guard expects
  `artGroups.ts?raw` to contain 12 `import("../art/<group>")` and
  `import("../storyOrderArt")` (paths relative to `src/game/hub/`), and
  `HubScene.ts?raw` to contain none of the old `../game/art` / `../game/storyOrderArt`
  static or dynamic forms.
- Hand back the three command outputs; on failure (max two fix attempts per
  the brief) re-dispatch with the output and this phase's head commit.

## Primary verification

- Ran the delegated commands directly (subagent executor is denied `pnpm`;
  primary holds it — `pnpm --version` 12.4.1):
  - `pnpm vitest run src/__tests__/scenes/hubScene.test.ts` — exit 0, 1 file / 48 tests pass (includes retargeted guard + parity pins).
  - `pnpm typecheck` (`tsc --noEmit`) — exit 0.
  - `pnpm check` (Biome, 262 files) — initially 2 findings, both auto-fixable
    style issues in phase-touched files (import sort in `hubScene.test.ts`,
    formatting in `artGroups.ts`); fixed via `biome check --write`, re-run exit 0.
- Include-config discovery (fix retry 2, primary-executed): vitest `include`
  is `src/__tests__/**/*.test.ts`, so the new suite at
  `src/game/hub/__tests__/artGroups.test.ts` reported "No test files found"
  and never ran — the "colocated hub tests" precedent cited above does not
  apply (no `src/game/**` test is collected). Relocated the suite to
  `src/__tests__/game/hub/artGroups.test.ts`, mirroring the collected
  `src/__tests__/game/hub/prewarm.test.ts` precedent; import paths adjusted.
  Plan Phase 1 Touches/Verification updated to the collected path.
  - `pnpm vitest run src/__tests__/game/hub/artGroups.test.ts` — exit 0, 3/3 pass.
  - `hubScene.test.ts` re-run after the Biome import-sort fix — exit 0, 48/48.
- Diff-vs-Touches: `artGroups.ts` (+140, new), `HubScene.ts` (821 -> 778 lines),
  `hubScene.test.ts` (guard retarget only, 5 lines), new collected test,
  evidence. No merges, no foreign commits. Reported subagent commits
  `7ca876cb`, `6a9cd14e` present and squashed per phase convention.
- AC-1: pass — tables extracted, resolver parity green, `hubScene.test.ts`
  green with only the authorized guard retarget.

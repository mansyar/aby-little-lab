# Phase R1 verification — Resolve review findings (F1, F2)

Result: **verified** — the primary ran the exact unchanged gate after the Biome
one-line fix and the living-doc refresh, and it exited 0: Biome 385 files clean,
app and E2E TypeScript clean, Vitest 162 files / 3492 tests, coverage
97.14 / 91.01 / 96.46 / 98.23, Vite 496 modules, shell bundle
`index-BDbRmAgr.js` 190.32 kB printed / 48.42 kB gzip with the 185.9 kB guard
passing, `parent-help` 19.40 kB / 7.37 kB, module-size pass with zero warnings,
textures pass, PWA 16 passes / 0 failures (66 entries / 1889.89 KiB) and docs
5 passes / 0 failures. The four-engine Help journey passed 8/8 with unchanged
saves and zero retries on the fresh build; media capture passed at 844×390 and
the CRLF-aware whitespace check was clean. NFR-3 and AC-9 are proved. No living
doc, release note, historical record, Conductor state, config or media file was
changed by this executor; the primary refreshed the living-doc test-count
figure to 3492 to match the measured truth.

- Track: `20261127-parent-help-overlay`
- Phase: R1 (`R1.T1`–`R1.T3`) — covers NFR-3, AC-9
- Date: 2026-11-28
- Branch: `feat/20261127-parent-help-overlay`
- Phase base: `6133dec4a6ae040aede23673899e0dd624327a8a`
- Source/test edits: left uncommitted in the working tree; the executor's commits
  are evidence-file commits only (`e5f7bf47ed685afcbd3c80d96e8979529152242e`
  recorded the pre-gate state, this finalization commit records the verified
  result).

## Repairs

### F1 — shared tile-gesture ownership (`src/game/hub/gridBuilder.ts`)

The triplicated `pressed` / `releaseBlocked` closures were replaced by one
`wireTileGesture(grid, tile, index, blocked = () => false)` helper used by
`buildWideGrid`, `buildPageGrid` and `buildFilteredGrid`. The helper owns the
pointerdown ownership capture, the pointerout/pointercancel resets, and the
pointerup release checks, then sets `navLocked` and calls `activateTile`.

Guard order is preserved exactly: `!hadPress`, `isTimeUp`, `navLocked`, the
builder-supplied blocked callback, down-time `releaseBlocked`, then live
`gestureBlocked`. The wide builder passes no callback (as before, no swipe
guard); paged and filtered pass `() => grid.swipes.swiping`, including filtered
boards on wide viewports where `grid.paged` is false. No builder-specific
guard was dropped and no new guard was introduced.

Two small adjacent triplications in the same builders were consolidated to
meet the module-size budget: `resetBuildLists(grid, "wide" | "page")` for the
identical per-build list/counter resets, and `lockTilesIfTimeUp(grid)` for the
three identical daily-cap lock blocks. Both keep the same assignments and the
same call order. A read of the final file shows the last line at 399, below the
400-line warning threshold; the primary's module-size guard passed with zero
warnings.

`src/__tests__/game/hubGrid.test.ts` gains a case that runs the wide, paged and
filtered builders through the same assertions: every tile has exactly one
pointerdown, pointerup, pointerout and pointercancel handler (structural proof
of one shared owner), both pointerout and pointercancel drop ownership so the
following release cannot navigate, and an ordinary press/release still
activates exactly once. All pre-existing assertions, including the blocked-down
and unmatched-release cases across the three grids, are unchanged. The primary
applied a one-line Biome fix to this test file so `pnpm check` passed; no
assertion was weakened.

### F2 — disabled Previous/Next are inert (`src/components/settings/HelpOverlay.ts`)

`drawControl` takes an `enabled = true` flag. `setInteractive`, the pointerdown
listener and `attachPressFeedback` are registered only when enabled. Topic
Previous/Next pass `hasPrevious` / `hasNext`; the close, back and menu-card
controls keep the default. The greyed `DISABLED_COLOR` drawing and the
`e2eState().controls.prev/next = null` boundary contract are unchanged.

`src/__tests__/components/settings/HelpOverlay.test.ts` adds a
`pointerDownHandlers` helper and a case proving that at the first topic
Previous has zero pointerdown handlers, no `setInteractive` call and the
disabled colour while Next is interactive and navigates; at the last topic the
mirror holds. The one existing test that tapped the disabled last-topic Next
was adapted to assert the absence of a listener instead of relying on a no-op
handler; its index/title assertions are retained. The eight-topic walk, Back
behaviour and journey contract are untouched.

## Commands

| Command / action | Who ran it | Outcome |
| --- | --- | --- |
| Read/edit tool calls on the five allowlisted files | executor | F1/F2 repairs, test extensions and this evidence file written; no other path touched. |
| `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | primary (not run by executor) | **Exit 0** — Biome 385 files clean; app and E2E TypeScript clean; Vitest 162 files / 3492 tests; coverage 97.14 / 91.01 / 96.46 / 98.23; Vite 496 modules; shell `index-BDbRmAgr.js` 190.32 kB printed / 48.42 kB gzip, 185.9 kB guard pass; `parent-help` 19.40 kB / 7.37 kB; module-size pass with zero warnings; textures pass; PWA 16/0 with 66 entries / 1889.89 KiB; docs 5/0. |
| Biome one-line fix in `src/__tests__/game/hubGrid.test.ts` | primary | Required for `pnpm check` clean; no assertion weakened. |
| CRLF-aware whitespace check | primary (not run by executor) | Clean. |
| Four-engine Help journey | primary (not run by executor) | 8/8 pass on the fresh build — both Help cases on Chromium, WebKit, Firefox and mobile Chromium; unchanged saves; zero retries. |
| Media capture at 844×390 | primary (not run by executor) | Pass. |
| Living-doc refresh to 3492 tests | primary (not run by executor) | Measured figures refreshed; outside executor edits. |
| `git commit` of this evidence file only | executor | First evidence commit `e5f7bf47`; this finalization commit updates only this file. No source/test/config/state file committed by the executor. |

## Acceptance criteria

| AC | Status in Phase R1 | Evidence |
| --- | --- | --- |
| NFR-3 | **Proved** | One gesture helper replaces three triplicated closure sets; `gridBuilder.ts` read ends at line 399, under the 400-line warning threshold, and the primary's module-size guard passed with zero warnings in the exact gate; content/copy untouched. |
| AC-9 | **Proved** | Disabled Previous/Next carry no listener, stay greyed and remain null in `e2eState()`; enabled boundaries still navigate; existing eight-topic walk and Back assertions retained; four-engine journey 8/8 and 162 files / 3492 tests green. |

## Scope proof

- Touched only by this executor: `src/game/hub/gridBuilder.ts`,
  `src/__tests__/game/hubGrid.test.ts`,
  `src/components/settings/HelpOverlay.ts`,
  `src/__tests__/components/settings/HelpOverlay.test.ts`, and this evidence
  file.
- No product doc, living figure, release note, archived/historical record,
  `spec.md`, `plan.md`, `metadata.json`, `tracks.md`, `conductor/index.md`,
  config, script or media file was created or modified by this executor. The
  primary refreshed the living-doc test-count figure to 3492 after the gate.
- No verification command, dependency install, lockfile change or generated-file
  rewrite was attempted by this executor.

## Process notes and deviations

- The brief overrides `plan.md`'s R1.T3 wording: the executor writes evidence
  only and attempts no verification command; the primary ran the unchanged gate,
  refreshed living figures where needed and supplied the final output recorded
  above.
- F1's gesture dedup alone does not clear the 400-line warning, so two small
  adjacent triplications in the same three builders (list/counter resets and
  the daily-cap lock block) were consolidated. This is a scope note, not a
  behaviour change.
- One existing HelpOverlay test assertion was necessarily adapted: tapping a
  now-listenerless disabled Next was replaced with a zero-listener assertion,
  keeping its topic-index and title checks.
- The primary's one-line Biome fix in `hubGrid.test.ts` and the living-doc
  refresh to 3492 were outside the executor's edits and are recorded here for
  provenance only.
- Status is `verified` because the primary's unchanged gate passed and this
  evidence file is committed; no implementation defect remains.

## Primary verification

Verdict: accepted. Primary independently verified scope (exactly the four
intended source/test files, three authorized living-doc refreshes, and this
evidence file), whitespace clean, exact gate exit 0 (162 files / 3492 tests,
coverage 97.14/91.01/96.46/98.23, 496 modules, shell 190.32 kB printed /
48.42 kB gzip with 185.9 kB guard pass, parent-help 19.40 kB / 7.37 kB,
module-size pass with zero warnings, textures pass, PWA 16/0, docs 5/0),
four-engine Help journey 8/8 with unchanged saves and zero retries on the
fresh build, and media capture pass at 844x390. F1 resolved (shared
wireTileGesture helper; gridBuilder.ts back under the warning threshold);
F2 resolved (disabled prev/next controls non-interactive with null E2E
contract; zero-listener assertion added). Living docs refreshed to the
measured 3492 truth; historical records untouched. Checkpoint recorded at
acceptance.

# Review: Release v1.22.0 — Ship the Seven Tracks Merged Since v1.21.7

- **Track:** `20261027-release-v1-22-0`
- **Type:** `chore`
- **Branch:** `chore/20261027-release-v1-22-0`
- **Range:** `f44a3a91..122068af`
- **Date:** `2026-10-27`
- **Verdict:** `PASS WITH FINDINGS` (round 2: all four round-1 findings fixed and independently verified; strict-mode compliant — no deferrals)

## Summary

Release diff is metadata/notes/index only with correct version linkage and structure. Round 1 found four invented or contradicted factual claims in the notes (all Low, docs-only); Phase R1 fixed all four exactly per spec and the primary independently verified each fix against the tree and archived specs. Strict-mode compliant: no deferrals, no Critical/High at any round.

## Re-review (round 2)

Primary verified the R1 delta (`27fa696c..122068af`, notes only, 6+/6−) line by line: F1 rewritten per archived FR-1 (`Rng` + shared `shuffle`, 13 importers, 21 logic modules, helper path added within scope); F2 "27 files" per archived line 62 with `StoryOrderScene.ts:91` citation replacing the false exception; F3 names the actual timeout-carrying suites; F4 header now states the Phase 3 cut with go-ahead. `node scripts/validate-docs.js` 6/6 and `pnpm check` clean re-run by the primary. All findings fixed; no new findings.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | 260 files, primary run exit 0 |
| typecheck | `pnpm typecheck` | pass | primary run exit 0 |
| test | `pnpm test -- --run` | pass | 126 files / 2781 tests, primary run exit 0 |
| coverage | `pnpm test:coverage` | pass | 97.75/91.76/96.88/98.70 above 95/88/85/90 gate, primary run exit 0 |
| build | `pnpm build` + `validate-bundle.js` + `validate-pwa.js` | pass | shell 148.9 kB, 16/16 PWA, primary run exit 0 |
| docs | `node scripts/validate-docs.js` | pass | 6/6, primary run exit 0 |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 | `package.json:3` reads `1.22.0` | covered |
| FR-2 | P1.T2 | notes file, 7 per-PR sections, v1.21.0 structure | partial (F1–F3: inaccurate PR #67/#68/#70 claims) |
| FR-3 | P1.T2 | README Releases row + Documentation index line; `validate-docs` 6/6 | covered |
| FR-4 | P2.T1 | full 8-command gate green on release state | covered |
| FR-5 | P3 (post-merge) | tag pending — by design, explicit go-ahead required | partial (by design) |
| NFR-1 | P1–P2 | `git diff f44a3a91..HEAD --name-only` = exactly `package.json`, `docs/release-notes-v1.22.0.md`, `README.md`; no `src/` | covered |
| NFR-2 | P1.T2 | notes mirror v1.21.0 structure | covered |
| NFR-3 | P1–P2 | conventional commits throughout range | covered |
| AC-1 | P1.T1 | `package.json` version `1.22.0` | covered |
| AC-2 | P1.T2 + P3 | notes exist, README-linked, DRAFT; FINAL flip deferred to Phase 3 | partial (by design) |
| AC-3 | P2.T1 | gate green | covered |
| AC-4 | P3 (post-merge) | tag pending — by design | partial (by design) |
| AC-5 | P1.T2 | notes line 66 records skipped device pass as accepted gap | covered |

## Findings

### Critical

- <none>

### High

- <none>

### Medium

- <none>

### Low

- **F1 — Notes invent random.ts exports and game names (PR #67 bullet)**
  - **File:** `docs/release-notes-v1.22.0.md:15-16`
  - **What:** Bullet claims `random.ts` holds "one `mulberry32` engine behind `createRng`, `hashSeed`, `Rng`" and names games "Letter Landing, Number Snake, Shape Pop" plus "ferry/plugin/board/logic surfacing". `src/game/random.ts` exports only `Rng` and `shuffle` (verified lines 11–21); `mulberry32` lives in `src/__tests__/helpers/randomHelper.ts`; case-insensitive grep of `src/` finds zero matches for any of the named terms.
  - **Why:** Release notes invent module exports and game names that do not exist, contradicting the archived track spec FR-1.
  - **Fix:** Rewrite per the archived spec: `random.ts` exports `Rng` + one shared Fisher-Yates `shuffle`; five duplicate shuffles deleted; 13 importers re-pointed; trailing `rng` params across the 21 logic modules; seeded `mulberry32` test helper in `src/__tests__/helpers/`. Drop the invented exports and names.
  - **Requirement:** FR-2
  - **Test gap:** none (prose; `validate-docs` has no claim-truth check)
- **F2 — Notes misstate the #68 migration count and Story Order behavior**
  - **File:** `docs/release-notes-v1.22.0.md:21-22`
  - **What:** "52 `Math.random` spy sites across 19 test files" (archived spec line 62: 52 sites across 27 files); "Story Order keeps `Math.random()` for its rng-first draw so the advertiser-adversarial pool stays unpredictable" — but `StoryOrderScene.ts:91` passes `this.rng` (migrated; only the default initializer `rng: Rng = Math.random` remains, per archived FR-5), and "advertiser-adversarial pool" matches nothing in `src/`.
  - **Why:** Wrong file count vs the archived record, false statement about shipped code, nonexistent pool name.
  - **Fix:** "27 files" per the archived spec; replace the Story Order sentence with: Story Order passes `this.rng` with the rng-first argument position preserved (`buildPlaythrough(this.rng, getAdaptiveBandShift("story-order"))`). Delete "advertiser-adversarial".
  - **Requirement:** FR-2
  - **Test gap:** none
- **F3 — Notes attribute the deflake to the wrong suites (PR #70 bullet)**
  - **File:** `docs/release-notes-v1.22.0.md:33`
  - **What:** Names "hub stress, play-time, profile lifecycle, scene per-game launch, and their companions". Grep proves the 120 s timeouts live in game-logic suites (addItUp/count/numberOrder/takeAway/firstSounds shifted-ladder sweeps plus decode/word audit additions); none of the named suites carries the timeout.
  - **Why:** Attributes the track to the wrong suites, contradicting the archived spec FR-1 victim list and the tree.
  - **Fix:** Name the actual suites: the addItUp/count/numberOrder/takeAway/firstSounds sweeps (plus decode/word per the audit), each with an explicit 120 s per-test timeout; `vite.config.ts` untouched.
  - **Requirement:** FR-2
  - **Test gap:** none
- **F4 — Header misstates when the tag is cut**
  - **File:** `docs/release-notes-v1.22.0.md:4`
  - **What:** "Target tag: `v1.22.0` (pending - cut after the Phase 2 deployment dry run)". No deployment dry run exists in any phase; Phase 2 is gate+review+merge, the tag is cut in Phase 3 after merge with explicit go-ahead.
  - **Why:** Misleading phrasing implies a gate that is not part of the track.
  - **Fix:** Reword to "pending - cut in Phase 3 after merge with explicit go-ahead".
  - **Requirement:** AC-4
  - **Test gap:** none

## Overrides

- <none>

## Plan compliance

Phase 1 verified with Result/Checkpoint/Evidence; tasks marked `[x]` were implemented. P2.T1 accepted at task level with evidence; P2.T2 (this review) and P2.T3 (PR/merge) remain. Phase 3 (tag + FINAL flip) pending by design. Diff stays within the union of Touches (plus the evidence file). No dropped tasks.

## Out of scope

- The reviewer's observation that the task brief's "59 precache entries" figure disagrees with every living doc (54) — the notes' "54 precached entries" is correct; no action.
- Missing v1.21.1–v1.21.7 notes backfill — out of scope per spec.

## Debt

- <none — strict mode: all in-scope findings are fixed, none deferred>

## Doc sync

`pending` — set to `updated` or `none` after the R1 re-review and post-review sync.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 0 | 0 | 4 | 0 |
| 2 | PASS WITH FINDINGS | 0 | 0 | 0 | 0 | 4 |

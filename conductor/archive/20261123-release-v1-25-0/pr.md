## Summary

Ships v1.25.0: the single feature PR #92 (Content Depth) plus the Phase 6 housekeeping the owner chose to include in this release — a strict, behavior-neutral module-size refactor, a machine-checkable module-size guard in `verify_phase`, and a verbatim move of all dated changelog entries into `docs/changelog.md`. Only version metadata, guards, docs and Conductor state change at release time; no runtime behavior is altered.

## Track

- **ID:** `20261123-release-v1-25-0`
- **Type:** chore
- **Spec:** [`conductor/archive/20261123-release-v1-25-0/spec.md`](conductor/archive/20261123-release-v1-25-0/spec.md)
- **Plan:** [`conductor/archive/20261123-release-v1-25-0/plan.md`](conductor/archive/20261123-release-v1-25-0/plan.md)
- **Review:** [`conductor/archive/20261123-release-v1-25-0/review.md`](conductor/archive/20261123-release-v1-25-0/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Strict module-size refactor | 13 oversized production modules split under 400 lines | verified | `0c6e79d5` | 167 production files, zero over 400 (max 399); behavior-neutral façades + siblings |
| 2: Module-size guard | Machine-checkable 400/600 guard wired into `verify_phase` | verified | `6815d8c3` | Real tree zero warnings; 601-line synthetic fixture exits 1; one behavior-neutral parameter rename |
| 3: Changelog split | One home for dated changelog entries | verified | `c4014bd6` | 33 sections moved verbatim with byte-comparison proof; pointers + README link |
| 4: Version and release notes | 1.25.0, DRAFT notes, README links | verified | `08f1c09b` | Notes cover PR #92 + both P6 items; device pass recorded as accepted gap |
| R1: Review fixes | Resolve F1 and F2 from round 1 | verified | `19aebacb` | Truthful CI wording in notes; integrated diff counts corrected |

## Requirements

- [x] `FR-1` — `package.json` version is 1.25.0
- [x] `FR-2` — DRAFT notes in v1.23.0/v1.24.0 format covering PR #92 and P6
- [x] `FR-3` — README Documentation link and Releases row dated 2026-11-23
- [x] `FR-4` — every production `src/**/*.ts` ≤ 400 lines, strict, no allowlist
- [x] `FR-5` — `scripts/validate-module-size.js` warn 400 / fail 600, real PASS + synthetic FAIL, wired into `verify_phase`
- [x] `FR-6` — all changelog entries moved verbatim with pointers
- [ ] `FR-7` — full `verify_phase` on the merged release commit (local gate green; final CI pending)
- [ ] `FR-8` — reviewed PR merged with green CI via `merge` (pending)
- [ ] `FR-9` — tag `v1.25.0` pushed on merged master HEAD, notes FINAL (separate human gate)
- [x] `FR-10` — skipped device pass recorded as accepted gap
- [x] `NFR-1` — no runtime behavior change (structural extractions only)
- [x] `NFR-2` — all links/anchors resolve; `validate-docs.js` 5/5
- [ ] `NFR-3` — conventional commits, merge-only, no force-push/tag move (final gates pending)
- [x] `NFR-4` — shell ≤ 200 kB, texture guard green, no new deps
- [x] `AC-1` — version 1.25.0
- [x] `AC-2` — notes indexed and DRAFT pre-tag
- [x] `AC-3` — 167 production files, zero over 400, guard green
- [x] `AC-4` — synthetic oversized fixture fails with exit 1
- [x] `AC-5` — changelog move verbatim with pointers
- [ ] `AC-6` — full verify_phase + green CI on the release commit (local green; CI pending)
- [ ] `AC-7` — review PASS + green CI + merged (pending)
- [ ] `AC-8` — tag on merged HEAD + notes FINAL (pending)
- [x] `AC-9` — skipped device pass recorded as accepted gap
- [x] `AC-10` — no runtime behavior change

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| lint | `pnpm check` | pass | Biome clean, 364 files |
| typecheck | `pnpm typecheck` | pass | src + e2e clean |
| unit | `pnpm test -- --run` | pass | 154 files / 3,346 tests |
| coverage | `pnpm test:coverage` | pass | 97.15 / 90.97 / 96.28 / 98.30 vs gates 95/88/85/90 |
| build | `pnpm build` | pass | 487 modules; shell 193.62 kB Vite / 189.1 kB via validator |
| bundle | `node scripts/validate-bundle.js` | pass | 189.1 kB ≤ 200 kB |
| module size | `node scripts/validate-module-size.js` | pass | 167 files, zero warnings |
| textures | `node scripts/validate-textures.js` | pass | 319 SVGs; 76.07 ≤ 80 MiB, 319.00 ≤ 320 MiB, ratio 0.238 ≤ 0.5 |
| PWA | `node scripts/validate-pwa.js` | pass | 16/16 |
| docs | `node scripts/validate-docs.js` | pass | 5 passed / 0 failed |

See `conductor/archive/20261123-release-v1-25-0/verification/integrated.md` for the consolidated gate record.

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 2 findings (F1 release-note CI claim, F2 integrated diff counts)
- **Accepted/deferred:** none (human gates for merge/tag are tracked as pending requirements, not debt)

## Deviations and risks

- Phase 2 renamed one extracted callback parameter (`playIncorrect` → `playTone`) to satisfy a pre-existing raw-source test after the Phase 1 split; behavior-neutral, recorded in Phase 2 evidence.
- Protected Conductor-doc edits were denied to phase subagents; the primary applied them and verified byte-for-byte where required.
- CI does not currently run coverage, module-size or texture validation; the release notes now state this explicitly. Adding those steps is a follow-up, not part of this release.
- Because the owner chose strict enforcement, this release includes a large but behavior-neutral refactor rather than being a pure version bump.

## Follow-ups

- none

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migrations, feature flags or data changes. Never move a pushed tag.

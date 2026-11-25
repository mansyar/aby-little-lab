# Phase 2 Verification — README, roadmap and archived-state truth

- **Track:** `20261126-release-v1-26-1`
- **Phase:** 2
- **Date:** 2026-11-26
- **Branch:** `chore/20261126-release-v1-26-1`
- **Track base:** `859498a8` (`master`)
- **Phase base:** `0ee2e7a7`
- **Implementation head:** `f6a98249`
- **Result:** **verified** (local evidence; PR/merge/tag CI remains a later gate)

## Commits and scope

| Commit | Author | Scope |
|---|---|---|
| `a2735a65` | Phase executor | `README.md` v1.26.1 Releases row and initial phase evidence. |
| `6599ee13` | Primary | `conductor/roadmap.md` RM-3/§10.7 truth; archived browser-matrix `metadata.json` `pr_state: merged` and repaired `pr.md` header. |
| `f6a98249` | Primary | Spec/plan/metadata exception for one reviewed CI fix-forward patch; task total 22. |

No runtime source, dependency, lockfile, asset, save-schema, gameplay or network behavior changed in this phase. The README Documentation-index line from Phase 1 remains unchanged; the new Releases-table row is newest-first, dated `2026-11-26`, links `docs/release-notes-v1.26.1.md`, and says the engine coverage is emulated rather than physical-device validation. Roadmap RM-3 and §10.7 now mark WebKit/Firefox/mobile-Chromium emulation delivered while preserving the manual physical-device gate and not claiming iOS Safari, Android Chrome or Fire tablet coverage. Archived PR #100 state is `merged`, with a valid head/base/merge header.

## Commands

| Layer | Command | Exit | Result |
|---|---|---|---|
| Executor docs check | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed before primary-owned Conductor edits. |
| Primary exact gate | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js` | 0 | 158 files / 3,404 tests in both unit and coverage runs; coverage 97.09% statements, 90.93% branches, 96.35% functions, 98.23% lines; 491 modules; shell `index-C9uYH1Mm.js` 195.2 kB under the 200 kB guard; 172 TypeScript files with zero module-size warnings; 319 SVGs; PWA 16/16 with 52 precached JS chunks and 64 precache entries; docs 5/5. Only warning: pre-existing Phaser vendor chunk above 500 kB. |
| Primary whitespace | `git -c core.whitespace=cr-at-eol diff --check` | 0 | No whitespace diagnostics across the CRLF-aware range. |
| Primary docs check | `node scripts/validate-docs.js` | 0 | 5 passed / 0 failed on the final committed tree. |

Raw gate log: `.conductor/evidence/phase-2/gate.log`.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-3 / AC-3 | README has both Documentation-index link and dated Releases row | README row at line 238; Phase 1 index line at line 284 unchanged; docs 5/5 | pass |
| FR-4 / AC-4 | Roadmap RM-3 and §10.7 distinguish delivered emulation from manual device gate | `conductor/roadmap.md` lines 25 and 170; docs 5/5 | pass |
| FR-5 / AC-5 | Archived browser-matrix metadata and `pr.md` header corrected; links resolve | `pr_state: merged`; repaired URL/state/head/base/merge header; docs 5/5 | pass |
| FR-6 / AC-6 | Exact configured gate exits 0 | Primary exact gate above | pass |
| FR-12 / NFR-4 / AC-12 | No unsupported claims; history preserved; no runtime/asset/schema change | README/roadmap wording; scoped diff; gate and whitespace checks | pass |
| NFR-7 | CRLF-aware whitespace check | `git -c core.whitespace=cr-at-eol diff --check` exit 0 | pass |
| FR-8 / AC-8 | CI green on release PR and tag | Master rerun `45595775568` is red in Firefox `sticker-persistence`; fix-forward is P3.T6 | pending |

## Deviations

- The executor's shell denied the exact configured gate and CRLF-aware whitespace check. Per the brief it did not retry or work around them; the primary ran both and recorded the real results.
- The approved spec/plan were amended to define the existing CI edge case precisely: one narrowly scoped, reviewed fix-forward patch is the sole exception to NFR-1/AC-12. No such patch was made in Phase 2.

## Notes

- PR #100's WebKit/Firefox/mobile-Chromium coverage is **emulated in CI**, not physical iOS Safari, Android Chrome or Fire tablet validation.
- Master rerun `45595775568` on `859498a8` remains RED: Firefox `sticker-persistence` failed on all three attempts with `InvalidStateError: Navigated away from page`. This phase makes no claim of green PR, merge or tag CI.
- No tag was created, pushed, moved or deleted. No branch switch, merge, reset, subagent, question or web use occurred in primary acceptance.

# Integrated Verification — Release v1.26.1

- **Track:** `20261126-release-v1-26-1`
- **Branch:** `chore/20261126-release-v1-26-1`
- **Base:** `master` at `859498a850f729294785453f5884c1915e4071c7`
- **Release candidate head:** `4428d33d71409859c65b8409b492703855a0d251`
- **Merge commit:** `ce88cb7bde29b70634590e64ed6e69533bf15bf2`
- **Date:** 2026-11-26
- **Overall result:** PASS. Local release-candidate checks, PR CI, merge, tag CI, Coolify deployment and live verification all passed. Physical-device smoke remains an accepted gap.

## Scope

The release diff contains version metadata `1.26.1`, final release notes, README/roadmap truth updates, archived browser-matrix state repair, living documentation truth, and one narrowly scoped fix-forward patch required by a reproduced post-merge CI failure. No new dependency, lockfile change, asset, save schema, storage migration, gameplay rule, content change or runtime-network behavior is present. The fix-forward patch guards two promise rejections in `AudioManager` and adds regression tests; it is the sole runtime exception authorized by the spec/plan.

## Local gates

| Gate | Result | Evidence |
|---|---|---|
| Exact configured `verify_phase` chain | exit 0 | `.conductor/evidence/phase-3/gate-final.log` |
| Frozen installation | exit 0, no lockfile drift | `.conductor/evidence/phase-3/frozen-install.log` |
| CRLF-aware whitespace | exit 0 | `git -c core.whitespace=cr-at-eol diff --check` |
| Project roster | 50 tests / 20 files | `.conductor/evidence/phase-3/list.log` |
| Chromium journeys | 26/26, zero retries | `.conductor/evidence/phase-3/chromium.log` |
| WebKit smoke | 8/8, zero retries | `.conductor/evidence/phase-3/webkit.log` |
| Firefox smoke | 8/8, zero retries | `.conductor/evidence/phase-3/firefox.log` |
| Mobile Chromium smoke | 8/8, zero retries | `.conductor/evidence/phase-3/mobile-chromium.log` |
| Boot smoke | median 0.85 s <= 3.0 s | `.conductor/evidence/phase-3/boot.log` |
| Docker strict headers | 28/28 | `.conductor/evidence/phase-3/headers.log`; image digest `sha256:a6309efab265ade6e3dae6636cfb3d4fb7dbb8f254e223646456f69a0e4dc271` |
| Headed first tap | exit 0; 50 cold / 0 warm; 10 per game; worst cold total 383.8 ms <= 400 ms | `.conductor/evidence/phase-3/first-tap-headed.json` |

Exact gate figures: Biome 375 files; app/E2E typechecks; 158 files / 3,406 tests in both unit and coverage runs; coverage 97.08 % statements / 90.89 % branches / 96.35 % functions / 98.23 % lines; 491 modules; shell `index-CzNKiaF1.js` 199.96 kB raw / 51.15 kB gzip and 195.3 kB guarded; 172 TypeScript files with zero module-size warnings; 319 SVGs; PWA 16/16 with 52 chunks and 64 precache entries; docs 5/5. The only build warning is the pre-existing Phaser vendor chunk above 500 kB.

Headed first-tap figures: aggregate cold p95 response / finished / total 58.4 / 37.6 / 332.3 ms; cold median total 235.4 ms; worst cold total 383.8 ms (Memory Match). Per-game p95 totals: Shape Sorter 280.4, Find the Letter 252.8, Find the Word 253.0, Add It Up 332.3, Memory Match 383.8 ms. The gate remains report-only for p95 and blocking only on worst cold total >400 ms.

## Requirement status

| ID | Status | Evidence |
|---|---|---|
| FR-1 version/lock consistency | pass | `package.json` `1.26.1`; frozen install exit 0; no lockfile drift. |
| FR-2 truthful notes | pass | `docs/release-notes-v1.26.1.md` is FINAL with PR #100, fix-forward, measured checks, CI, deploy and live evidence. |
| FR-3 README links/row | pass | Documentation index link and dated Releases row updated to final state; docs 5/5. |
| FR-4 roadmap truth | pass | RM-3 and §10.7 mark emulated matrix delivered; manual device gate preserved. |
| FR-5 archived-state repair | pass | Browser-matrix `pr_state: merged` and repaired `pr.md` header. |
| FR-6 exact gate/frozen install | pass | Phase 3 local gates above. |
| FR-7 boot/headers/first tap | pass | Boot 0.85 s, 28/28 headers, 50 cold / 0 warm with worst 383.8 ms. |
| FR-8 CI green on PR, merge and tag | pass | Runs `45637409160`, `45641156051` and `45642802812` all green. |
| FR-9 device gap | pass | Owner decision recorded as `SKIPPED — accepted gap`; no device pass claimed. |
| FR-10 review/PR/merge | pass | Strict review PASS round 1; PR #101 merged as `ce88cb7b`. |
| FR-11 tag/deploy/FINAL/live | pass | Immutable `v1.26.1`, tag CI/Coolify green, live hash and version verified, notes FINAL. |
| FR-12 no unsupported claims | pass | Notes distinguish local, CI emulation, device gap and final CI/deploy/live evidence. |
| NFR-1 narrow runtime exception | pass | Only the two-line AudioManager guard is outside docs/state, authorized by fix-forward exception. |
| NFR-2 no weakened gates | pass | No assertion, threshold, sample count, retry setting or gate changed; all four projects green on first attempt locally and in CI. |
| NFR-3 measured figures | pass | Real gate, boot, header, headed, CI and live measurements recorded above. |
| NFR-4 preserve history | pass | Historical perf-baseline and archived evidence remain intact; live header updated with dates. |
| NFR-5 immutable tag | pass | Annotated tag object `b68cf624c43a3c39a6b3bfbf55dec88a076cfb9f` on `ce88cb7b`, pushed once and never moved. |
| NFR-6 rollback | pass | Plan specifies reviewed revert plus new patch tag; published tags are never moved. |
| NFR-7 CRLF-aware whitespace | pass | Exit 0. |
| AC-1…AC-12 | pass | All mapped requirements and gates above are complete; physical-device coverage is an accepted gap, not a pass. |

## Deviations

- The post-merge master rerun `45595775568` was red in Firefox `sticker-persistence`. The approved fix-forward exception was used to guard `AudioContext.resume()` and `close()` rejections; no console error was filtered and no assertion weakened.
- The first post-fix exact gate failed only on stale living test counts; those were refreshed and the gate then passed.
- The first headed first-tap attempt hit a port-4173 race after the boot preview. A standalone rerun passed; the race is recorded in `.conductor/evidence/phase-3/first-tap-port-race.txt`.
- Executor shell denials were reported without retry or workaround; all heavy verification was run and recorded by the primary.

## Review and PR gates

Strict review passed in round 1 at `138cf515` with no findings. The primary reran the reviewer's two denied checks: the focused AudioManager suite passed 1 file / 93 tests, and the CRLF-aware whitespace check over the reviewed range exited 0. Post-review doc sync is complete with no additional living-document change.

PR `https://github.com/mansyar/aby-little-lab/pull/101` opened as `chore(release): ship v1.26.1`. CI run `45637409160` completed `success`. The owner answered `"Merge now"`; PR #101 merged as `ce88cb7bde29b70634590e64ed6e69533bf15bf2`. Local `master` fast-forwarded, branch cleanup completed, and merge CI run `45641156051` passed all required checks. Evidence: `.conductor/evidence/pr-101-ci.md` and `.conductor/evidence/pr-101-merge.md`.

## Tag, deploy and live gates

- Tag preflight: local/origin `master` both `ce88cb7b`, version `1.26.1`, no local/remote tag, clean tree.
- Immutable annotated tag `v1.26.1`: object `b68cf624c43a3c39a6b3bfbf55dec88a076cfb9f` on `ce88cb7b`, pushed once.
- Tag CI `45642802812`: success; Quality Gates, both Chromium shards, WebKit, Firefox, mobile Chromium, `Browser Journeys` rollup and `Deploy to Coolify` all passed.
- Live URL returned HTTP 200, served `index-CzNKiaF1.js`, hash matched local build (`CC173B8A2FE3306B4A37D3F9803509FEA7350C0D97F7C04F33204362A7C55CCB`) and contained `1.26.1`. Evidence: `.conductor/evidence/live-v1-26-1.md`.
- Device smoke: **SKIPPED — accepted gap**; evidence `.conductor/evidence/device-policy-v1-26-1.md`.

## Finalization

`docs/release-notes-v1.26.1.md` is FINAL. The README index label and release-row tag were updated to final state. Archived metadata records `pr_state: merged`, 5/5 phases and 23/23 tasks. Post-tag finalization is docs/Conductor-only under the documented release exception; the tag and release merge commit were not changed.

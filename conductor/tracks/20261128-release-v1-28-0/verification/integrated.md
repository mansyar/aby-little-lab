# Integrated Verification — Release v1.28.0

- **Track:** `20261128-release-v1-28-0`
- **Branch:** `chore/20261128-release-v1-28-0`
- **Verified tree:** `71ec286c`
- **Base:** `39df7f5b7c4fc994475156c9affd1a4da8bec4f1`
- **Result:** **PASS** — the release candidate is locally verified, reviewed, and ready for PR CI. The release remains **DRAFT**; merge, tag, Coolify deployment and live verification have not occurred.

## Exact full gate

Run on the final pre-PR tree:

```powershell
pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-module-size.js && node scripts/validate-textures.js && node scripts/validate-pwa.js && node scripts/validate-docs.js
```

| Check | Result |
| --- | --- |
| `pnpm check` | PASS — Biome checked 393 files; no fixes. |
| `pnpm typecheck` | PASS — app and e2e TypeScript projects clean. |
| `pnpm test -- --run` | PASS — **165 files / 3,559 tests**. |
| `pnpm test:coverage` | PASS — **96.91 statements / 90.23 branches / 96.22 functions / 98.06 lines**; gates 90/85/88/95. |
| `pnpm build` | PASS — **501 modules**; shell `index-B7LXOJIw.js`, 194.87 kB raw / 48.95 kB gzip. |
| `validate-bundle.js` | PASS — shell 190.3 kB ≤ 200 kB; Phaser vendor chunk present. |
| `validate-module-size.js` | PASS — 3 pre-existing warn-only module notes; no hard failures. |
| `validate-textures.js` | PASS — 321 SVGs; 76.42 / 321.00 MiB; ratio 0.238. |
| `validate-pwa.js` | PASS — 16/0; 55/55 JavaScript chunks precached; 67 entries. |
| `validate-docs.js` | PASS — 5/0; links, registry truth, Conductor paths and living counts current. |

## Version and diff proof

- `package.json` reports **1.28.0**; the built shell contains `1.28.0` through the existing `__APP_VERSION__` define.
- No runtime source, asset, dependency, schema or storage file changed.
- Non-Conductor release diff: `README.md`, `docs/perf-baseline.md`, new `docs/release-notes-v1.28.0.md`, `package.json`, and the first-tap measurement harness.
- Release notes cover #109 → #110 → #111 in actual merge order and retain DRAFT/pending ship fields.
- Physical-device smoke remains **`SKIPPED — accepted gap`** per the approved spec.

## Measured performance evidence

The corrected headed measurement passed on the candidate build:

```powershell
$env:TAP_HEADED="1"; $env:TAP_INERT_IDLE="1"; node scripts/measure-first-tap.mjs --with-preview --json --warm-aware --samples 10
```

- **50 cold / 0 warm**, exactly 10 per unchanged target.
- Aggregate cold p95 response / finished / total: **40.9 / 32.4 / 265.2 ms**.
- Cold median total: **202.4 ms**.
- Worst cold total: **Find the Word, 273.2 ms ≤ 400 ms**.
- Boot median 450.1 ms; 4×-throttled boot median 1957.1 ms.
- Raw evidence: `conductor/tracks/20261128-release-v1-28-0/verification/first-tap-headed.json` and `first-tap-headed.stdout.log` (rewritten to the archive path at completion).

## Local browser matrix

The four production-preview Playwright projects ran sequentially with zero local retries:

| Project | Result |
| --- | --- |
| Chromium | 30/30 PASS |
| WebKit | 10/10 PASS |
| Firefox | 10/10 PASS |
| Mobile Chromium | 10/10 PASS |
| **Total** | **60/60 PASS** |

Attempt 1's single Chromium boot-toast timeout was diagnosed as a transient readiness-notification delay, retained, and followed by the single caused rerun permitted by NFR-3. The passing rerun is authoritative; no test or runtime behavior was weakened.

## Review and requirement status

- Strict read-only review: **PASS** after one fix round; one Low README consistency finding resolved and targeted re-review returned no findings.
- AC-1..AC-5: covered locally by version, DRAFT notes, README, measured perf, full gate, first tap and browser evidence.
- AC-6: review passed; required PR CI remains pending by design.
- AC-7..AC-9: post-merge/ship runbook prepared; issue closure, immutable tag, Coolify/live checks and FINAL notes remain explicitly gated.
- Tag preflight: no local or remote `v1.28.0` tag existed at verification time. Tagging requires separate explicit authorization after merge.

## Evidence and pending operations

- Phase evidence: `verification/phase-1.md` through `phase-5.md` plus `phase-R1.md`.
- Review: `review.md` — final verdict PASS.
- Measured baseline: `docs/perf-baseline.md#v1280-release-candidate-2026-11-28`.
- Ship runbook: `docs/release-notes-v1.28.0.md#post-merge-ship-runbook`.
- Pending external operations: PR CI, user-approved merge and branch cleanup, issue #108 closure, separately authorized annotated tag push, tag CI/Coolify, live verification, then FINAL notes.

No merge, issue closure, tag, deployment or live mutation was performed during integrated verification.

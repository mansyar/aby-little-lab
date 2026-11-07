# Edge Hardening — Integrated Verification

- **Track:** `20261108-edge-hardening`
- **Date:** 2026-11-08
- **Branch:** `chore/20261108-edge-hardening`
- **Base:** `5610bc6f6f01996f53265b1213c249686aba2c9a`
- **Head:** `d982985c` (review round included)
- **Result:** verified (AC-7 partial: the PR's own CI log is the remaining evidence)

## Layers, run against the integrated tree

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 296 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `pnpm test -- --run` | 135 files / 2,927 tests |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21 — gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | 59 precache entries (1751.05 KiB) |
| Bundle | `node scripts/validate-bundle.js` | phaser 1,335.0 kB; shell `index-CpDFSutQ.js` 153.6 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |
| Headers | `node scripts/validate-headers.js` | 28 passed, 0 failed (after the review round added Content-Type assertions) |
| Journeys under nginx | `E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e` | 16 passed in 3.6 m |
| Journeys on the default path | `pnpm test:e2e` | 16 passed in 3.4 m |

## Cross-phase checks- **One policy, one place.** The four headers exist only in `nginx.security-headers.conf`; `nginx.conf` includes it six times (server block plus the five locations that declare `add_header`). The snippet has exactly four `add_header` lines.
- **Nothing traded away for security.** Every `Cache-Control` value is unchanged and the validator asserts the exact string per route class, including the 404 path. The shell chunk is byte-identical in size and hash to the pre-track build, so the policy cost no bytes.
- **The policy is load-bearing, not decorative.** Dropping `data:` fails `boot` on a blocked `data:image/png`; dropping `blob:` fails 12 of 16 journeys on blocked canvas textures. Both were measured, not reasoned about.
- **The trap is guarded twice.** A unit test fails if a location declares `add_header` without the include, and the runtime validator fails per route if the include is missing (measured: `/sw.js` served 0/4 while every other route stayed 4/4).
- **The default path did not move.** `E2E_BASE_URL` unset produces the same `vite preview` origin, the same `webServer` object and the same 16 passes.
- **No production `src/` change.** The only `src/` addition is `src/__tests__/guard/securityHeaders.test.ts`.

## Scope note

Touches widened in two places, both reported and accepted:

- `scripts/validate-headers.js` (Phase 2) — its `REQUIRED_CSP_FRAGMENTS` pinned the literal `img-src 'self' data:`, so a correct widened header failed seven checks. It now pins the shipped value including `blob:`.
- `e2e/fixtures/game.ts` (Phase 2) — a one-line echo of the first CSP refusal to the runner output, so a blocked resource is named instead of inferred from an early failure. No assertion, wait or signature changed.

## Runtime note

The journeys under nginx took 3.6 minutes and the default path 3.4, inside the 5-minute budget. The gates job gains one two-stage `docker build` plus 21 HTTP probes; NFR-5's ~90 s ceiling is measurable only on CI, and the PR run is the measurement.

## Known follow-up, not fixed here

A request for a missing hashed asset returns `404` with `Cache-Control: public, max-age=31536000, immutable`, because the hashed-asset location matches on extension rather than on file existence. That means a browser could cache a 404 for a year. It is pre-existing, it is now asserted so it cannot change unnoticed, and it was left alone because FR-5 requires cache semantics to be unchanged by this track. It belongs in the Product Operations phase as a serving-correctness item.

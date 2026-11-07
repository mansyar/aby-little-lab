# fix(security): serve a strict CSP and the three companion headers

## Summary

Every response from the image now carries a Content Security Policy, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and a `Permissions-Policy` deny list — declared once and inherited by every route class. The policy is enforced, not report-only, and it took one measured concession to be true: Phaser uploads canvas textures through `blob:`, so `img-src` is `'self' data: blob:`.

Two proofs, both of which have been seen to fail:

- a runtime validator boots the built image and asserts headers, cache and content type on seven route classes (**28 checks**);
- a unit guard fails if a future `location` declares `add_header` without including the snippet, so the inheritance trap cannot come back.

## Track

`conductor/tracks/20261108-edge-hardening` (archived at `conductor/archive/20261108-edge-hardening`).

| Phase | Goal | Checkpoint |
| --- | --- | --- |
| 1 | Ship the policy and prove the wire | `b22ca578` |
| 2 | Run the suite under the policy | `78c2db6a` |
| 3 | Keep it honest in CI and in the docs | `eec75c16` |
| R1 | Review fixes | `d982985c` |

## What happened

**The inheritance trap is the whole reason for the snippet.** nginx inherits `add_header` from an enclosing block only into a location that declares none of its own — and every cache rule here declares one. A header at server level would therefore have disappeared on exactly the routes that matter (`/sw.js`, `/index.html`, the manifest, every hashed asset). The snippet is included by the server block *and* the five `add_header` locations, and the guard test fails if a sixth appears without it. Removing one include serves **0 of 4 headers** on that route while the rest of the site looks perfect.

**The policy was wrong on the first real run.** Twelve of sixteen journeys failed, every one on a CSP refusal; a bare `boot` logged ten of them:

```
Loading the image 'blob:http://127.0.0.1:8080/<uuid>'
violates the following Content Security Policy directive: "img-src 'self' data:"
```

Phaser uploads textures via `blob:` object URLs. `data:` stayed, because `blob:` alone fails `boot` on Phaser's 1×1 `data:` PNG — both tokens serve different paths. No `unsafe-*` was added.

**A new check found an old defect.** Asserting `Content-Type` (because `nosniff` makes a wrong type fatal) failed immediately: the web manifest was served as `application/octet-stream`, since nginx's `mime.types` has no `webmanifest` entry. Fixed with `default_type application/manifest+json;` — not a `types { }` block, which would replace the inherited type table for everything else in that location.

**Cleanup was broken in the failure path.** The validator's `fatal()` called `process.exit`, so the `finally` never ran and a readiness timeout leaked a container holding the port. It now throws; cleanup happens in the `finally` and in an `exit` hook. Proven by pointing it at a container that exits before answering.

## Requirements

- **FR-1..FR-6, FR-8, FR-10, FR-12, FR-13** — met.
- **FR-7** (`E2E_BASE_URL`) and **FR-11** — met; unset behaviour byte-identical.
- **FR-9** — met: the step is gated exactly like its six neighbours.
- **NFR-1..NFR-4, NFR-6** — met. **NFR-5** is measured on this PR's log (see Verification).
- **AC-1..AC-6, AC-8..AC-10** — met. **AC-7 partial**: the code tier runs; the docs-only tier cannot be produced by a code PR and closes on the first genuinely documentation-only PR.

## Verification

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 296 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `pnpm test -- --run` | 135 files / 2,927 tests |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21 — gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | 59 precache entries |
| Bundle | `node scripts/validate-bundle.js` | phaser 1,335.0 kB; shell 153.6 kB ≤ 200 kB (unchanged hash) |
| PWA | `node scripts/validate-pwa.js` | 16 passed |
| Documents | `node scripts/validate-docs.js` | 5 passed |
| Headers | `node scripts/validate-headers.js` | **28 passed, 0 failed** |
| Journeys under nginx | `E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e` | **16 passed in 3.8 m** |
| Journeys on the default path | `pnpm test:e2e` | **16 passed in 3.4 m** |
| Inheritance trap | delete the `/sw.js` include, rebuild | `/sw.js` 0/4 headers; 20 passed / 1 failed |
| Missing header | delete `nosniff`, rebuild | 14 passed / 7 failed, and the guard fails too |
| Politeness, not convenience | remove `data:` only | `boot` fails on Phaser's 1×1 PNG |
| Cleanup on failure | `HEADERS_IMAGE=node:24-alpine` | exit 1, no container left, port 8080 free |

## Media

None: there is no visual surface. The policy is proven by the journeys it lets run and the refusals it produces when wrong, both quoted above.

## Review

PASS WITH FINDINGS, one round, eight findings (3 medium, 5 low) all fixed, none overridden, nothing deferred. The two that mattered most were only reachable because the reviewer was *denied* the container: a failure path that leaked a container, and content types nothing asserted.

## Deviations and risks

- `scripts/validate-headers.js` was edited in Phase 2, outside that phase's Touches, because its CSP fragment list pinned the old directive string — it was asserting a literal rather than the requirement, and would have pushed the policy back to a value the app cannot run under.
- `e2e/fixtures/game.ts` gained one line that echoes the first CSP refusal to the runner output, so a blocked policy reports the browser's words rather than "12 failed".
- **Residual risk, stated plainly:** the enforcement is only as good as the routes probed. A new `location` that declares `add_header` and forgets the snippet is caught by the guard test, but a *new route class* with different semantics is only covered once it is added to the probe plan.
- **Recorded follow-up:** a missing hashed asset returns 404 carrying `immutable`, so a typo would be cached for a year. Pre-existing, asserted now so it cannot change unnoticed, and deliberately not changed here because NFR-2 freezes cache semantics.

## Follow-ups

- Add `report-uri`/`report-to` once a collector exists (Phase 2 of the roadmap: local insights and error capture).
- Decide whether the hashed-asset `immutable` rule should exclude 404s; it changes cache behaviour for every asset, so it needs its own evidence.

## Rollback

```bash
git revert --no-commit b22ca578..HEAD && git commit
```
The headers come from one snippet and five includes; reverting removes them entirely without touching application code, which this track does not change.

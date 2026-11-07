# Review fixes - Edge Hardening

- **Track:** `20261108-edge-hardening`
- **Review range:** `5610bc6f..800be4fc`
- **Verdict on arrival:** PASS WITH FINDINGS - 0 critical, 0 high, 3 medium, 5 low
- **After this round:** all eight addressed, none deferred, one AC left partial on purpose

The reviewer re-ran every layer it was permitted to and was denied `node scripts/validate-headers.js`. That denial is why F1 and F5 matter more than their severity suggests: the only checks that could have caught them were the ones the reviewer could not run, so they are the primary's, and both turned out to be real.

## Findings

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Medium | `fatal()` ended in `process.exit(1)`, called from inside `main`'s `try`, so the `finally` never ran: a readiness timeout left the container holding port 8080 and every later run failed at `assertPortFree` with a message about the port instead of the real problem. | `fatal` now throws a `FatalError`; the top-level `catch` prints only for non-fatal errors (no duplicate message); `stopContainer` became the idempotent `ensureContainerRemoved`, called from the `finally` **and** from a `process.once("exit")` hook for anything that ends the process without unwinding. **Proven:** `HEADERS_IMAGE=node:24-alpine` (a container that exits immediately) now reports `Container … exited before it answered on port 8080`, exits 1, leaves **no** container (`docker ps -a` filtered to `aby-little-lab-headers` is empty) and port 8080 free. |
| F2 | Medium | `P3.T1.2` was checked for "the two observed runs from this track's PR" before the PR existed; `phase-3.md` still said PENDING for the same row; `integrated.md` said "Result: verified" unqualified. | The task is unchecked again with the reason attached, `integrated.md` now reads "verified (AC-7 partial: the PR's own CI log is the remaining evidence)", and AC-7 is marked partial wherever it is claimed. |
| F3 | Medium | The CI step runs a cold `docker build` (`.dockerignore` excludes `dist` and `node_modules`), so the gates job repeats install and build after pulling two base images; NFR-5's 90 s ceiling was unmeasured. | Measured on the PR rather than guessed: the step's duration is recorded in the PR's CI log and quoted in `pr.md`. If it exceeds the ceiling, the fix is to pass `dist` into the build context rather than to widen NFR-5. |
| F4 | Low | The guard used `toContain` per source, so `script-src 'self' https://cdn.example.com` passed - a policy wider than the one reviewed. | Replaced with `toEqual(expected.sources)`: the listed sources are the whole allowance, and an added host is a policy change that fails. `img-src` is now pinned as exactly `'self' data: blob:`. |
| F5 | Low | Nothing asserted `Content-Type`, so a `sw.js` served as `text/plain` would be refused by the browser under `nosniff` while all 21 checks passed. | Every probe row declares the type it must keep; `buildChecks` asserts it. **This immediately found a real defect** - see below. |
| F6 | Low | The snippet's directive table still headed `img-src` with the pre-widening value. | Heading now reads `img-src 'self' data: blob:` with both reasons under it. |
| F7 | Low | Counts had moved to 2,927 / 135 files but the date still read "verified 2026-11-07" in `README.md:49` and `docs/TDD.md:1099,1105`. | Re-dated to 2026-11-08. |
| F8 | Low | `verification/integrated.md` was untracked. | Committed with this round. |

## The defect F5 found

Adding the `Content-Type` assertions failed one check on the first run:

```
✗ /manifest.webmanifest keeps Content-Type /manifest\+json/
    Content-Type is "application/octet-stream", expected /manifest\+json/
```

nginx's `mime.types` has no `webmanifest` entry, so the web manifest was being served as `application/octet-stream` - on every deployment since the PWA was added, not something this track introduced. Browsers are lenient here, which is why nobody noticed; the header set could not see it because the header was absent rather than wrong.

Fixed in `nginx.conf` with `default_type application/manifest+json;` inside the manifest location. `default_type` rather than a `types { }` block: a `types` block there would replace the inherited type table for that location and break every other extension it serves.

Result after the fix: **28 passed, 0 failed**, up from 21 - seven new checks, one of them the reason it exists.

## What the review confirmed

- The inheritance analysis is correct and was reproduced: removing the `/sw.js` include serves 0 of 4 headers on that route while every other route keeps 4 of 4 (Phase 1).
- The `img-src` widening was a measured necessity, not a convenience: `data:` alone blanks every tile (`blob:` refusals logged ten times), `blob:` alone fails `boot` on Phaser's 1×1 `data:` PNG.
- Cache assertions are exact strings per class, including the pre-existing quirk that a **404** for a missing hashed asset is served `immutable`; recorded as a follow-up rather than silently changed.
- The guard test is non-vacuous: it pins the location count, the job names and the action allowlist, and its `unsafe-*`/wildcard/scheme prohibitions are substring checks over the whole policy.
- `process.env.E2E_BASE_URL || undefined` means an empty value cannot point `baseURL` at `''` while the falsy check starts `vite preview`.
- The CI gating expression matches the six neighbouring steps exactly (`steps.changes.outputs.tier == 'code'`).
- The audit found no path the policy breaks that the journeys do not cover: TTS is `speechSynthesis`, BGM is a same-origin `Audio`, there is no `fetch` outside Workbox, no `Worker` construction, no `eval`/`new Function`/`innerHTML`, and `screen.orientation.lock` is not gated by Permissions-Policy.

## Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 296 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test -- --run` | 135 files / 2,927 tests |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21 |
| Build | `pnpm build` | 59 precache entries |
| Bundle | `node scripts/validate-bundle.js` | shell 153.6 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed |
| Documents | `node scripts/validate-docs.js` | 5 passed |
| Headers | `node scripts/validate-headers.js` | **28 passed, 0 failed** |`n| Journeys under nginx | `E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e` | **16 passed in 3.8 m** - re-run because `nginx.conf` changed |

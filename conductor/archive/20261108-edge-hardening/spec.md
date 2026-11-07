# Edge Hardening — Specification

> **Convention:** Requirement IDs (`FR-`, `NFR-`, `AC-`) are stable. Do not renumber them after approval. If a requirement is later removed, mark it `Withdrawn` rather than deleting it.

## Overview

The built app is served by nginx from the Docker image, and every response it emits currently carries exactly one security-relevant header — `Cache-Control`. There is no `Content-Security-Policy`, no `X-Content-Type-Options`, no `Referrer-Policy` and no `Permissions-Policy`. This track adds those four, defines the policy precisely enough that no directive needs widening later, and proves the app still runs under it.

## Problem / Motivation

`nginx.conf` is 44 lines and sets four `Cache-Control` values. Nowhere does it set a security header. The consequence is narrow and concrete:

- **No CSP.** Any injected script that reaches the page — through a future dependency, a compromised CDN path, or a mistake in a component — executes with full access to `localStorage`, where every child's profile, progress and stickers live. The save layer was hardened in `20261107-storage-resilience`, so the data is now authoritative and worth stealing.
- **No `X-Content-Type-Options`.** A browser may sniff a `.js` or `.mp3` response as a different type and execute or render it as something it is not.
- **No `Referrer-Policy`.** The default on cross-origin navigation leaks the origin. The app has no outbound links today, which is exactly why the policy should be fixed before one appears.
- **No `Permissions-Policy`.** Any script that does run may ask for camera, microphone or location. Nothing in the app needs them.

There is a second, quieter problem: **nginx only inherits `add_header` from the server block if the location declares none.** Every cache rule in `nginx.conf` declares its own `add_header`, so a security header placed at server level would silently disappear on `/sw.js`, `/index.html`, `/manifest.webmanifest` and every hashed asset — that is, on almost every request the app makes. A naive implementation would look correct in the config and ship unprotected on the routes that matter.

### What the evidence says the policy can be

Before choosing a policy, the artifact was inspected:

| Fact | Evidence |
| --- | --- |
| No inline script or style in the shell | `dist/index.html` holds one module `script`, one stylesheet `link`, one `modulepreload` and the manifest link — nothing inline |
| No `eval`, `new Function`, or style injection in either bundle | `dist/assets/phaser-B_vcVLyb.js` (1,367,089 bytes) and `dist/assets/index-CpDFSutQ.js`: zero matches for `eval(`, `new Function(`, `createElement("style")`, `createElement("script")`, `insertRule` |
| The only inline data is generated art | `src/game/art/svgDataUri.ts:10` returns `data:image/svg+xml;base64,…` |
| The service worker is classic and same-origin | `dist/sw.js` loads its runtime with `importScripts` from a sibling file |

So a policy with no `'unsafe-inline'` and no `'unsafe-eval'` is achievable, not aspirational.

## Goals & Success Metrics

- **Goal:** every response the container emits carries a strict, documented policy, and the app is proven to run under it.
  - **Metric:** the validator reports the four headers present on every route class, and all 16 existing journeys pass against the nginx origin.
- **Goal:** no cache behaviour changes.
  - **Metric:** the validator asserts the exact `Cache-Control` value per route class, unchanged from today.
- **Goal:** the inheritance trap cannot recur silently.
  - **Metric:** a unit test fails if any future `location` declares `add_header` without including the snippet.

## Scope

### In Scope

- A single security-header snippet, included by the server block and by every location that declares its own `add_header`.
- `Content-Security-Policy` (enforced, strict), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, plus the `frame-ancestors` / `object-src` / `base-uri` / `form-action` directives that belong in a policy for a private PWA.
- `scripts/validate-headers.js`: boots the built image, asserts headers and cache values per route class, always cleans up.
- CI wiring for that validator, inside the existing tier classification.
- A unit guard test over `nginx.conf` and the snippet.
- `E2E_BASE_URL` support in `playwright.config.ts`, so the existing journey suite can target an nginx origin instead of `vite preview`.
- Documentation: `docs/TDD.md` serving section, `README.md`, and the roadmap row.

### Out of Scope

- **HSTS, COOP, CORP, COEP.** HSTS is only meaningful behind Coolify's TLS terminator and pins a mistake; the app has no popups, no OAuth and no cross-origin resources for the others to protect. Recorded as a deliberate omission with its reason.
- **Report-only rollout.** The policy is enforced from the first commit; the journey suite is the rollout check.
- **Any change to `src/` production code.** If the policy breaks the app, the policy is what changes.
- **`vite dev` and `vite preview`.** Neither is a deployment target and neither sets headers; the validators keep their current behaviour.
- **Subresource integrity, CSP nonces, Trusted Types.**
- **The Coolify proxy layer** — headers are added at nginx, which is the last hop that owns the response.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Every response from the container carries `Content-Security-Policy` with `default-src 'self'`, `script-src 'self'`, `style-src 'self'`, `img-src 'self' data: blob:`, `font-src 'self'`, `media-src 'self'`, `connect-src 'self'`, `worker-src 'self'`, `manifest-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `frame-ancestors 'none'`. No directive contains `unsafe-inline`, `unsafe-eval`, a bare `*` or a scheme wildcard. | must |

**FR-1 amendment (2026-11-08, measured in Phase 2).** The original value was `img-src 'self' data:`. Under the enforced policy a bare boot logged ten refusals — `Loading the image 'blob:http://…/<uuid>' violates … "img-src 'self' data:"` — because Phaser uploads canvas textures through `blob:` object URLs, and 12 of 16 journeys failed. Adding `blob:` was the smallest value that made the suite pass; `data:` stayed, because it is equally load-bearing (dropping it alone fails `boot`, whose first sample is a `data:image/png` texture). No `unsafe-*` was added and no directive was removed, which is what NFR-3 requires.
| FR-2 | Every response carries `X-Content-Type-Options: nosniff`. | must |
| FR-3 | Every response carries `Referrer-Policy: no-referrer`. | must |
| FR-4 | Every response carries a `Permissions-Policy` denying `camera`, `microphone`, `geolocation`, `payment`, `usb`, `serial`, `midi`, `display-capture`, `accelerometer`, `gyroscope` and `magnetometer` (each `=()`). `fullscreen` is not mentioned, so the installed-PWA path keeps its default. | must |
| FR-5 | The four headers are declared once, in a snippet file that the server block and every location declaring `add_header` all include, so that no route loses them and no route loses its `Cache-Control`. | must |
| FR-6 | All four headers are sent with `always`, so 4xx and 5xx responses carry them too. | must |
| FR-7 | The app boots, plays and returns to the hub under the enforced policy: all 16 existing journeys pass with `E2E_BASE_URL` pointing at the nginx origin. | must |
| FR-8 | `scripts/validate-headers.js` boots the built image on a free local port, waits for readiness, and asserts for `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`, one hashed asset from `dist/` and one unknown path (SPA fallback): the four headers present, the expected `Cache-Control` per class, and `Content-Type` not sniffable. It exits non-zero on any miss and removes the container on every path, including failure (see the FR-8 amendment). | must |
| FR-9 | The validator is a CI step in the gates job, run only on the code tier (a documentation-only change skips it), and it fails with an actionable message when Docker is unavailable rather than hanging. | must |
| FR-10 | A unit test reads `nginx.conf` and the snippet and fails if: any `location` declaring `add_header` does not include the snippet; a header is missing from the snippet; the CSP contains `unsafe-inline`, `unsafe-eval` or `*`; the `Permissions-Policy` deny set is incomplete. | must |
| FR-11 | `playwright.config.ts` targets `E2E_BASE_URL` when set and skips its own `webServer`; with the variable unset, behaviour is exactly as today (`vite preview` on 127.0.0.1:4173). | must |
| FR-12 | `docs/TDD.md` documents the serving layer: the policy, why each directive exists, the inheritance rule that forced the snippet, how to run the validator, and how to run the journey suite against the image. | must |
| FR-13 | `README.md` lists the headers among the deployment properties, and the roadmap row for `20261110-edge-hardening` records the outcome with dated evidence. | should |

**FR-8 amendment (2026-11-08).** The original wording said the validator "removes the container and image on every path". It removes the **container** on every path — now including a throwing failure, after review finding F1 replaced a `process.exit` with a thrown `FatalError` so the `finally` still runs — and it deliberately keeps the image, because later phases and CI reuse it and a rebuild is the cheap part. The deliverable is the removed container: a run that leaves one holding the host port is what FR-8 exists to prevent.

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No production `src/` file changes. The only `src/` addition is the guard test. |
| NFR-2 | Cache behaviour is byte-identical per route class: `no-cache` on `/sw.js`, `/manifest.webmanifest` and `/index.html`; `public, max-age=31536000, immutable` on hashed css/js/png/svg/woff2; `public, max-age=86400` on mp3. |
| NFR-3 | The policy may not be widened to make the app pass. If a directive is wrong, the directive is corrected to the narrowest value that works, and the reason is recorded. |
| NFR-4 | The validator is deterministic: fixed port strategy with a failure if busy, bounded readiness wait, no reliance on sleep, container removal in a `finally`. |
| NFR-5 | The gates job grows by under ~90 seconds on the code tier. |
| NFR-6 | The journey suite stays inside its 5-minute budget when run against nginx (it currently takes 3.0 min locally, 4m35s on CI hardware). |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A request for `/` returns the CSP with all thirteen directives and none of `unsafe-inline`, `unsafe-eval` or `*`. | FR-1 |
| AC-2 | Every route class the validator probes returns `nosniff`, `no-referrer` and the deny list, including a 404 and the SPA fallback. | FR-2, FR-3, FR-4, FR-6 |
| AC-3 | The validator reports the same `Cache-Control` value per route class as the pre-change config, quoted before and after. | FR-5, NFR-2 |
| AC-4 | All 16 journeys pass with `E2E_BASE_URL` set to the nginx origin. | FR-7, NFR-6 |
| AC-5 | Removing the snippet `include` from one location turns the guard test red, and adding `unsafe-inline` to the CSP turns it red, both restored afterwards. | FR-10 |
| AC-6 | The validator exits non-zero when a header is deleted from the snippet, proven by a temporary mutation. | FR-8 |
| AC-7 | CI runs the validator on a code-tier change and skips it on a documentation-only change, both observed on this track's PR. | FR-9 |
| AC-8 | With `E2E_BASE_URL` unset, `pnpm test:e2e` behaves exactly as before. | FR-11 |
| AC-9 | The four headers survive the Dockerfile → nginx path used by Coolify, i.e. the snippet is present in the image at the path nginx reads. | FR-5 |
| AC-10 | No `src/` production file appears in the diff. | NFR-1 |

## Edge Cases- **`/` versus `/index.html`.** `/` is served through `location /` with `try_files`; `/index.html` matches the exact location that declares `add_header`. Both must carry the four headers, which is why the server block also includes the snippet.
- **404 responses.** Without `always`, nginx drops `add_header` on error responses; the snippet must use it so a missing asset still gets `nosniff` and a CSP.
- **The service worker's own CSP.** `sw.js` is served with the same policy; `importScripts('/workbox-*.js')` is same-origin, so `script-src 'self'` must permit it — proven by the offline journey, not assumed.
- **`data:` images.** All generated art is a `data:image/svg+xml;base64` URI; without `img-src data:` the hub would render blank tiles, which the launch journeys would catch.
- **`connect-src` and precaching.** Workbox's precache fetches under the worker's CSP; `connect-src 'self'` must allow them or the offline journey fails.
- **`blob:` fallback.** If any canvas-to-texture path turns out to need `blob:`, the directive is widened to the narrowest working value and the reason recorded — not silently.
- **The `?e2e=1` bridge** evaluates nothing and injects nothing, so it needs no policy exception; if that ever changes, the guard test's no-`unsafe-*` assertion is the alarm.
- **Docker unavailable locally.** The validator must say so and exit non-zero; the guard test still runs, so the config cannot drift unnoticed.
- **Port collisions.** The validator uses a fixed port and fails fast if busy, rather than binding a random one that a stale preview could shadow (the trap `20261107-release-e2e` hit).
- **Coolify.** It builds from the `Dockerfile`; a snippet file not copied into the image would work locally with a bind mount and fail in production, so AC-9 asserts its presence in the image.

## Dependencies

- **Tracks:** none open. `20261107-release-e2e` (merged) supplies the journey suite and the `webServer` config this track extends; `20261107-toolchain-pinning` (merged) supplies Node 24, pnpm 12.16.1 and the CI tier classifier this track's step joins.
- **External:** Docker, available locally (28.3.0) and on `ubuntu-latest` runners. No new package dependency.

## Open Questions & Assumptions

| Question | Assumption |
| --- | --- |
| Does `style-src 'self'` block Phaser's runtime styling? | No — Phaser assigns through the CSSOM (`element.style.*`), which CSP does not govern, and no bundle creates a `<style>` element. The journeys prove it. |
| Should the policy live in nginx or in a meta tag? | nginx. A meta tag cannot express `frame-ancestors` and arrives after the first byte. |
| Is a `report-uri` worth adding? | Not now: a private app with no reporter endpoint would collect nothing. Recording violations is a product-operations concern for Phase 2. |
| Should the validator also run in the browser job? | No; the header check is static-once and the browser job's own suite runs against `vite preview`, which sets no headers. The nginx journey run is local evidence, per the decision recorded above. |

## References

- `conductor/product.md` §10.2 — the roadmap row for `20261110-edge-hardening`.
- `nginx.conf`, `Dockerfile`, `.dockerignore`.
- `dist/index.html` and the two bundle chunks, for the no-inline / no-eval evidence.
- `docs/TDD.md` §11 — CI and deployment.
- `20261107-release-e2e` — `playwright.config.ts`, `e2e/`, and the `webServer`/`--host 127.0.0.1` reasoning.
- `20261107-storage-resilience` — why the save payload is now worth protecting.

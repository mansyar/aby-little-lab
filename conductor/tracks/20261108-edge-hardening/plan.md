# Edge Hardening — Implementation Plan

> **Branch:** `chore/20261108-edge-hardening`
> **Base:** `master` @ `5610bc6f6f01996f53265b1213c249686aba2c9a`

Phase states are `pending`, `in_progress`, `verified`, `failed` or `blocked`. Only the primary agent writes this file.

## Phase 1: Ship the policy, and prove the wire

- **Goal:** every route the container serves emits the four headers with unchanged cache semantics, and a validator proves it against the real image rather than the config text.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-8, FR-10, NFR-1, NFR-2, NFR-3, NFR-4, AC-1, AC-2, AC-3, AC-5, AC-6, AC-9, AC-10
- **Touches:** `nginx.security-headers.conf`, `nginx.conf`, `Dockerfile`, `scripts/validate-headers.js`, `src/__tests__/guard/securityHeaders.test.ts`, `conductor/tracks/20261108-edge-hardening/verification/`
- **Verification:** `pnpm build && docker build -t aby-little-lab:headers . && node scripts/validate-headers.js` then the full chain `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage && pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js && node scripts/validate-docs.js`
- **Status:** verified

### Tasks

- [x] **P1.T1: Write the policy once** - covers: FR-1, FR-2, FR-3, FR-4, FR-6
  - [x] **P1.T1.1: Create `nginx.security-headers.conf`** with `add_header … always;` for all four headers, CSP as the thirteen directives FR-1 names, `Referrer-Policy: no-referrer`, `Permissions-Policy` denying the eleven features and not mentioning `fullscreen`
  - [x] **P1.T1.2: Justify each CSP directive in a comment** — why `img-src data:` (generated SVG art), why `connect-src 'self'` (Workbox precache), why `worker-src 'self'` (classic service worker), why no `unsafe-*`
- [x] **P1.T2: Place it where inheritance cannot drop it** - covers: FR-5
  - [x] **P1.T2.1: `include` the snippet in the server block and in every location that declares `add_header`** — the four cache locations — leaving every existing `Cache-Control` value untouched
  - [x] **P1.T2.2: `COPY` the snippet into the image** at `/etc/nginx/snippets/security-headers.conf` and confirm the path nginx reads matches
- [x] **P1.T3: Build the validator** - covers: FR-8, NFR-4
  - [x] **P1.T3.1: `scripts/validate-headers.js`** boots the image on a fixed port, fails fast if the port is busy, polls readiness with a bounded wait, and removes the container and image in a `finally`
  - [x] **P1.T3.2: Assert per route class** — `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`, one hashed asset read from `dist/`, one unknown path through the SPA fallback: four headers present and the expected `Cache-Control` for each class
  - [x] **P1.T3.3: Prove the validator fails when it should** — delete one header from the snippet, capture the red run, restore, capture the green run
- [x] **P1.T4: Guard the inheritance trap** - covers: FR-10
  - [x] **P1.T4.1: `src/__tests__/guard/securityHeaders.test.ts`** fails if any `location` declaring `add_header` does not `include` the snippet
  - [x] **P1.T4.2: Assert the snippet's content** — all four headers present, no `unsafe-inline`/`unsafe-eval`/`*` in the CSP, the full eleven-feature deny set
  - [x] **P1.T4.3: Show both teeth** — remove one `include` (red), add `unsafe-inline` (red), restore both, record the runs

**Result:** verified — the four headers ship from one snippet included by the server block and all five cache locations; the runtime validator proves them on every route class with unchanged `Cache-Control` (21 checks), and two mutations proved both it and the guard test can fail, one of them reproducing the inheritance trap end to end (`/sw.js` served 0/4 while every other route kept 4/4).
**Checkpoint:** b22ca578
**Evidence:** conductor/tracks/20261108-edge-hardening/verification/phase-1.md

## Phase 2: Run the suite under the policy

- **Goal:** the same 16 journeys that prove the app prove it under the enforced policy, so "the CSP breaks nothing" is measured rather than argued.
- **Depends on:** Phase 1
- **Covers:** FR-7, FR-11, NFR-6, AC-4, AC-8
- **Touches:** `playwright.config.ts`, `nginx.security-headers.conf`, `conductor/tracks/20261108-edge-hardening/verification/`
- **Verification:** `docker build -t aby-little-lab:headers . && docker run -d -p 8080:80 … && E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e` then `pnpm test:e2e` with the variable unset, then the full chain
- **Status:** verified

### Tasks

- [x] **P2.T1: Let the suite target an external origin** - covers: FR-11, AC-8
  - [x] **P2.T1.1: `E2E_BASE_URL` skips the `webServer` block** and becomes `use.baseURL`, leaving the default path byte-identical when unset
  - [x] **P2.T1.2: Prove the default is unchanged** — `pnpm test:e2e` with the variable unset still passes all 16
- [x] **P2.T2: Run all 16 journeys against nginx** - covers: FR-7, NFR-6, AC-4
  - [x] **P2.T2.1: Capture any CSP violation** from the page console, not just a test failure, so a blocked resource is named rather than inferred
  - [x] **P2.T2.2: Record per-journey durations and the total** against the 5-minute budget
  - [x] **P2.T2.3: If a directive is wrong, narrow it to the smallest working value in the snippet and record the violation that forced it** — NFR-3 forbids widening to `unsafe-*`
- [x] **P2.T3: Prove the policy is what fails, not luck** - covers: FR-7
  - [x] **P2.T3.1: Temporarily drop `data:` from `img-src`**, confirm at least one journey fails on blank art, restore it, and record both runs

## Phase 3: Keep it honest in CI and in the docs

- **Goal:** the header check runs on every code change without slowing the gate, and the next reader learns the policy and its traps from the docs.
- **Depends on:** Phase 2
- **Covers:** FR-9, FR-12, FR-13, NFR-5, AC-7
- **Touches:** `.github/workflows/ci.yml`, `docs/TDD.md`, `README.md`, `conductor/product.md`, `conductor/tracks/20261108-edge-hardening/verification/`
- **Verification:** the full chain plus `node scripts/validate-headers.js`, and the CI run observed on this track's pull request
- **Status:** in_progress

### Tasks

- [ ] **P3.T1: Wire the validator into the gates job** - covers: FR-9, NFR-5, AC-7
  - [ ] **P3.T1.1: Add the step after `pnpm run build`**, gated on `tier == 'code'`, building the image and running the validator, with a Docker-unavailable message that fails rather than skips
  - [ ] **P3.T1.2: Confirm the docs-only tier still skips it** and record the two observed runs from this track's PR
- [ ] **P3.T2: Document the serving layer** - covers: FR-12, FR-13
  - [ ] **P3.T2.1: `docs/TDD.md`** gains the policy table (directive → why), the inheritance rule that forced the snippet, the validator command, and the `E2E_BASE_URL` journey recipe
  - [ ] **P3.T2.2: `README.md`** lists the headers among the deployment properties and names the validator
  - [ ] **P3.T2.3: `conductor/product.md` §10.2** row becomes Done with dated evidence, and the out-of-scope set (HSTS/COOP/CORP) is recorded with its reason

<!-- Review fixes are appended by conductor-review as:
## Phase R<n>: Review Fixes
- **Goal:** Resolve review findings <IDs>
- **Touches:** ...
- **Verification:** ...
- **Status:** pending
-->

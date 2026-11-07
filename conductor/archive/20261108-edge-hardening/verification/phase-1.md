# Phase 1 verification — Ship the policy, and prove the wire

| Field | Value |
| --- | --- |
| Track | `20261108-edge-hardening` |
| Phase | 1 — Ship the policy, and prove the wire |
| Date | 2026-11-08 |
| Branch | `chore/20261108-edge-hardening` |
| Phase base | `071e1330` |
| Head | `807cba89` |
| Result | **blocked** — the policy, its placement and the guard are complete and green; the runtime proof could not run because the shell permission layer denies every `docker` command to this subagent. |

The code is finished, committed and green on every check that does not need a
container. What is missing is exactly the thing this phase is named for: a run of
`scripts/validate-headers.js` against a built image. Docker is unavailable here,
so `AC-1`, `AC-2`, `AC-3`, `AC-6` and the runtime half of `AC-9` are unproven
until the primary runs the two commands in `## Blockers`.

## Commands

| Command | Exit | Key output |
| --- | --- | --- |
| `pnpm check` | 0 | `Checked 296 files in 313ms. No fixes applied.` |
| `pnpm typecheck` | 0 | `tsc --noEmit` clean for `src` and `e2e` |
| `pnpm test -- --run` | 0 | `Test Files 135 passed (135)` · `Tests 2927 passed (2927)` |
| `pnpm test:coverage` | 0 | `Statements 97.21% (5967/6138)`, `Branches 91.14% (1658/1819)`, `Functions 96.18% (1310/1362)`, `Lines 98.21% (5551/5652)` — identical to the pre-change baseline, because `src/__tests__/**` is excluded from the coverage denominator |
| `pnpm build` | 0 | `✓ built in 2.51s` · `dist/sw.js`, `dist/workbox-2fbc6a65.js`, precache 59 entries (1751.05 KiB) |
| `node scripts/validate-bundle.js` | 0 | `PASS: Phaser vendor chunk present: phaser-B_vcVLyb.js (1335.0 kB)` · `PASS: shell entry index-CpDFSutQ.js = 153.6 kB (<= 200 kB)` |
| `node scripts/validate-pwa.js` | 0 | `Results: 16 passed, 0 failed` |
| `node scripts/validate-docs.js` | 0 | `Results: 5 passed, 0 failed` (after the count refresh below) |
| `pnpm test --run src/__tests__/guard/securityHeaders.test.ts` | 0 | `Test Files 1 passed (1)` · `Tests 7 passed (7)` |
| `docker build -t aby-little-lab:headers .` | **denied** | `permission.rejected` — `Permission denied: shell` |
| `node scripts/validate-headers.js` | **not run** | Depends on the image the denied build would produce; running it would reach docker through a wrapper, which the brief forbids |
| `pnpm exec biome check <files>` | **denied** | `Permission denied: shell` — not a blocker: `pnpm check` and `pnpm format` are the configured equivalents and both were used |
| `git restore nginx.conf` | **denied** | `Permission denied: shell` — not a blocker: the mutation was reverted with the exact inverse edit and `git diff --stat` is empty (see `## Mutation proofs`) |

## Route matrix

**Not observed.** No container ran, so the table below is what the committed
configuration *should* serve, derived from `nginx.conf` and read as text — it is
a prediction to be replaced by the validator's own table on the primary's run,
not evidence. The validator prints exactly this matrix (`class`, `path`,
`status`, `security`, `cache-control`) under the heading
`Observed route matrix`.

| Class | Path | Status | Four headers | `Cache-Control` | Source of the value |
| --- | --- | --- | --- | --- | --- |
| SPA root | `/` | 200 | expected | *recorded* | `location /` declares no `add_header`; if the directory resolves through the `index` directive the value will be `no-cache` (see the note below) |
| shell | `/index.html` | 200 | expected | `no-cache` | `location = /index.html` |
| service worker | `/sw.js` | 200 | expected | `no-cache, no-store, must-revalidate` | `location = /sw.js` |
| web manifest | `/manifest.webmanifest` | 200 | expected | `no-cache` | `location = /manifest.webmanifest` |
| hashed asset | `/assets/index-CpDFSutQ.js` | 200 | expected | `public, max-age=31536000, immutable` | `location ~* \.(css\|js\|png\|svg\|woff2)$` |
| unknown route | `/no-such-route` | 200 | expected | *recorded* | `location /` → `try_files … /index.html`, an internal redirect |
| missing hashed asset | `/assets/does-not-exist.js` | 404 | expected | *recorded* (the immutable value, quirk) | the hashed-asset regex matches the extension, `try_files $uri =404` then answers 404; `always` keeps the headers on it |

The missing-asset row is the one this phase is really about: a 404 that still
carries `nosniff` and the policy is the only proof that `always` is doing its
job. The validator records its status and cache value and asserts only the four
headers on it, as the brief requires.

**Deviation from the brief's table, deliberately.** The brief expects `/` and
`/no-such-route` to carry no `Cache-Control` because `location /` declares no
`add_header`. That is true of the *config text* but not necessarily of the
*response*: nginx resolves both through an internal redirect into
`location = /index.html` (`try_files`' last argument for the fallback, the
`index` directive for `/`), and an internal redirect re-runs location matching,
so the exact-match location's `add_header` applies and the response would carry
`no-cache`. Because no container ran here, the validator does not assert a value
it has not observed: it records both, prints them, and asserts only that the two
classes agree with each other — a property that holds under either reading and
that is what "routing unchanged" actually means. This is `NFR-2`-safe either
way: no routing line was touched, so whatever these two classes served before
the snippet existed they still serve. The first real run will show the value;
if it is `no-cache`, tighten the two rows to an exact expectation with that
observation quoted.

## Mutation proofs

Two independent red runs on the guard test, each restored and verified. Every
run used the same command, `pnpm test --run src/__tests__/guard/securityHeaders.test.ts`.

### 1. Delete the `include` from `location = /sw.js`

Mutation: removed `include /etc/nginx/snippets/security-headers.conf;` from that
one location — the exact mistake `FR-5` exists to prevent, invisible to
`nginx -t`.

```
× includes the snippet in every location of nginx.conf that declares add_header
AssertionError: location = /sw.js { declares add_header, so nginx will not inherit the
server-level include — it must include /etc/nginx/snippets/security-headers.conf itself:
expected false to be true
Test Files  1 failed (1) · Tests  1 failed | 6 passed (7)
```

Restored with the inverse edit; `git diff --stat` → no output (byte-for-byte).

### 2. Add `unsafe-inline` to `style-src` in the snippet

Mutation: `style-src 'self'` → `style-src 'self' 'unsafe-inline'`.

```
× carries the thirteen CSP directives in order, and no escape hatch
AssertionError: CSP must not allow unsafe-inline: the built HTML has nothing inline:
expected 'default-src 'self'; script-src 'self'; … style-src 'self' 'unsafe-inline'; …'
not to contain 'unsafe-inline'
Test Files  1 failed (1) · Tests  1 failed | 6 passed (7)
```

Restored with the inverse edit; `git diff --stat` → no output. Green run after
restoration: `Test Files 1 passed (1) · Tests 7 passed (7)`.

No probe was left in the tree.

## Acceptance

| AC | Status | Evidence |
| --- | --- | --- |
| AC-1 (thirteen CSP directives, no `unsafe-inline`/`unsafe-eval`/`*`) | **text proven, runtime unproven** | `nginx.security-headers.conf` declares the thirteen directives in FR-1's order; guard test *"carries the thirteen CSP directives in order, and no escape hatch"* asserts the directive names, each directive's source tokens, and the absence of `unsafe-inline`, `unsafe-eval`, `*`, `http:` and `https:`. Mutation 2 above proves the assertion has teeth. The header reaching a browser is unobserved — blocked on Docker. |
| AC-2 (`nosniff`, `no-referrer`, deny list on every route class, including a 404 and the SPA fallback) | **text proven, runtime unproven** | The snippet declares all four with `always`; the guard asserts all four plus the eleven-feature deny set and the absence of `fullscreen`; the server block and all five `add_header` locations include it (guard test 1 and 2). The per-route observation is what `scripts/validate-headers.js` does and is blocked. |
| AC-3 (same `Cache-Control` per class, quoted before and after) | **config text proven, runtime unproven** | Before (`git show 071e1330:nginx.conf`): `no-cache, no-store, must-revalidate` on `/sw.js`; `no-cache` on `/manifest.webmanifest` and `/index.html`; `public, max-age=31536000, immutable` on the hashed-asset regex; `public, max-age=86400` on `.mp3`. After: the same five lines, byte-identical — the diff adds five `include` lines, one comment and one `COPY`, and changes no `add_header`. Runtime quoting waits on the validator. |
| AC-5 (removing one `include` turns the guard red; adding `unsafe-inline` turns it red; both restored) | **met** | `## Mutation proofs` 1 and 2, each with the failing title and message, each restored with `git diff --stat` empty. |
| AC-6 (validator exits non-zero when a header is deleted from the snippet) | **not proven — blocked** | The brief seeded this with a temporary mutation, which needs a container. The validator's `fatal`/problem paths set `process.exitCode = 1`, and its fail-fast paths (no image, busy port, container exited, readiness timeout) are written but unexercised. |
| AC-9 (headers survive the Dockerfile → nginx path) | **text proven, runtime unproven** | `COPY nginx.security-headers.conf /etc/nginx/snippets/security-headers.conf` sits beside the `nginx.conf` copy, and the guard test asserts that exact line and destination. The path the five includes name is the path that is copied. nginx exits on a missing include, so a mistake here fails the container rather than serving unprotected — but "the container starts and serves" is unobserved. |
| AC-10 (no `src/` production file in the diff) | **met** | `git diff --stat 071e1330..807cba89` touches `nginx.security-headers.conf` (new), `nginx.conf`, `Dockerfile`, `scripts/validate-headers.js` (new), `src/__tests__/guard/securityHeaders.test.ts` (new), and the three living docs' counts. The only `src/` path is under `__tests__`. |

## Deviations

1. **Living-document count refresh (mechanically required, as the brief allows).**
   Adding the guard test moved the suite from 134 files / 2,920 tests to 135 /
   2,927, which `validate-docs.js` derives from `vitest list` and refuses to let
   drift. Four count claims were updated: `README.md` (one line),
   `docs/TDD.md` §10.2 and §10.3 (two lines), `docs/perf-baseline.md` (one table
   row). Numbers only; no other prose changed. The coverage percentages were left
   alone because the coverage run reproduced them exactly.
2. **`/` and `/no-such-route` cache values recorded rather than asserted**, with
   the reason in `## Route matrix`. The brief's table expects "none"; nginx's
   internal redirect likely makes that false, and asserting an unobserved value
   would have produced a red validator for a reason that is not a defect.
3. **`P1.T3.3` could not be executed in the form the plan states** — "delete one
   header from the snippet, capture the red run" needs a container. The `always`
   and CSP-inheritance behaviour it would prove is instead covered by the guard
   test's two mutations (AC-5), which are red for the same removal.
4. **`scripts/validate-headers.js` keeps the image** rather than removing it, as
   the brief instructs and contrary to FR-8's wording ("removes the container
   and image"). The brief is explicit that later phases reuse the image; the
   spec's clause predates that. Only the container is removed.

## Blockers

1. `docker build -t aby-little-lab:headers .` — denied to this subagent by the
   shell permission layer (`permission.rejected`, `Permission denied: shell`).
   Expected result: a built image, exit 0. The primary must run it; the brief
   says Docker is expected. Attempted once, not worked around.
2. `node scripts/validate-headers.js` — must follow (1). Expected result on a
   correct config: `Results: N passed, 0 failed`, exit 0, plus the
   `Observed route matrix` table that fills in `## Route matrix` and quotes the
   `/` and `/no-such-route` values. Deliberately not run here: it reaches docker
   through a wrapper, which is the workaround the rules forbid rather than a
   verification step.

## Notes

- **Include count.** The brief says "five includes in total, counting the server
  block"; the arithmetic is six (server block + five locations, since `.mp3`
  makes five `add_header` locations, not four). The semantic rule from FR-5 was
  implemented: server block plus every location that declares `add_header`. The
  guard test pins the location count at 5 so the scan cannot pass vacuously.
- **Why the snippet is not three lines shorter.** The comment block is long
  because `NFR-3` forbids widening the policy later "to make the app pass": the
  next reader needs the reason `img-src` carries `data:` and `worker-src` exists
  *in the file they are about to edit*, not in a doc.
- **`fullscreen`** is unmentioned in `Permissions-Policy` on purpose;
  `validate-pwa.js` independently asserts the manifest still requests
  `display_override: ["fullscreen", "standalone"]`, so a future edit that adds
  `fullscreen=()` to the deny list would break the installed-PWA path silently —
  the guard test now fails on that edit instead.
- **The hashed-asset probe** picks the shell entry (`index-*.js`) because Vite
  always emits exactly one; a game chunk can be renamed or dropped between
  builds, which would have made the probe flaky.
- **`git restore` is denied too.** Mutations were reverted with the exact inverse
  edit and proved byte-for-byte with `git diff --stat` (empty output), which is
  the same guarantee. Recorded here so the primary does not read the missing
  `git restore` in the transcript as a shortcut.


## Primary verification

Verified 2026-11-08 by the primary agent, independently of the executor.
Phase base `071e1330`, checkpoint `b22ca578`.

The executor completed everything that does not need a container and reported `blocked` on Docker, which its shell permission layer denies. The runtime half of this phase is therefore the primary's, and it is where two of the brief's assumptions were corrected.

### The commands the executor could not run

| Proof | Command | Result |
| --- | --- | --- |
| Image builds with the snippet inside it | `docker build -t aby-little-lab:headers .` | exit 0 |
| Every route carries the headers | `node scripts/validate-headers.js` | **21 passed, 0 failed**, exit 0 |
| Inheritance trap, reproduced | remove the `include` from `/sw.js` only, rebuild, re-run | `/sw.js` **0/4 headers**, every other route still 4/4, its `Cache-Control` unchanged; **20 passed, 1 failed**, exit 1 |
| A missing header, caught twice | delete `X-Content-Type-Options` from the snippet, rebuild, re-run | validator **14 passed, 7 failed** (one per route class), exit 1; guard test **1 failed**, naming `declares all four headers in the snippet, each with always` |
| Both restored | restore, rebuild, re-run | 21 passed / 0 failed; guard 7 passed; `git status` clean |

The first mutation is the point of the track. It is not a hypothetical: with the include removed from one location, that location serves no security header at all while the rest of the site looks perfect, and nothing in the config text reads as wrong.

### Observed route matrix

| Class | Path | Status | Headers | `Cache-Control` |
| --- | --- | --- | --- | --- |
| SPA root | `/` | 200 | 4/4 | `no-cache` |
| shell | `/index.html` | 200 | 4/4 | `no-cache` |
| service worker | `/sw.js` | 200 | 4/4 | `no-cache, no-store, must-revalidate` |
| web manifest | `/manifest.webmanifest` | 200 | 4/4 | `no-cache` |
| hashed asset | `/assets/index-CpDFSutQ.js` | 200 | 4/4 | `public, max-age=31536000, immutable` |
| unknown route | `/no-such-route` | 200 | 4/4 | `no-cache` |
| missing hashed asset | `/assets/does-not-exist.js` | **404** | **4/4** | `public, max-age=31536000, immutable` |

Two corrections came out of the real run:

1. **`/` and the SPA fallback serve `no-cache`, not an absent header.** Both are resolved by `try_files`' internal redirect into `location = /index.html`, so they inherit that location's cache rule. The executor had guessed this and asserted only that the two classes agreed; the first real run made the exact values knowable, so the validator now asserts `no-cache` for both and the guess is gone.
2. **A 404 carries all four headers**, which is `always` doing its job — and it also carries `immutable`, because the hashed-asset location matches on extension rather than on file existence. That is a pre-existing quirk, not something this phase introduced: a missing asset would be cached for a year. It is asserted now (so it cannot change unnoticed) and recorded as a follow-up rather than fixed here, because changing it would change cache semantics that FR-5 requires to stay put.

The brief also miscounted the includes: it said five in total, the correct number is six (the server block plus the five locations that declare `add_header`, since the `.mp3` rule makes five). The executor implemented the rule rather than the number and the guard pins the location count at five so the scan cannot pass vacuously.

### What the executor got right that is worth keeping

- The snippet is fail-closed by construction: nginx exits on a missing include, so a forgotten `COPY` breaks the container instead of silently serving unprotected. The guard test asserts the `COPY` exists.
- The validator fails fast on a busy port and on a missing image rather than choosing a random port, which is the trap `20261107-release-e2e` spent a day on.
- It removes the container in a `finally` and keeps the image, because later phases reuse it.

### Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 296 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test -- --run` | 135 files / 2,927 tests, 19.88 s |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21 — gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | 59 precache entries (1751.05 KiB) |
| Bundle | `node scripts/validate-bundle.js` | phaser 1,335.0 kB; shell `index-CpDFSutQ.js` 153.6 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed, 0 failed |
| Documents | `node scripts/validate-docs.js` | 5 passed, 0 failed |
| Headers | `node scripts/validate-headers.js` | 21 passed, 0 failed |

Shell entry unchanged at 153.6 kB with the same hash: headers are a serving concern and added nothing to the bundle.

### Acceptance

AC-1, AC-2, AC-3, AC-5, AC-6 and the runtime half of AC-9 are met by the runs above. AC-10 holds: `src/` gains one test file and no production file. AC-4 and AC-7 belong to Phases 2 and 3.


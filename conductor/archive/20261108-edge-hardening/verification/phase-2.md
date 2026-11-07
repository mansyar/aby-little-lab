# Phase 2 verification — Run the suite under the policy

| Field | Value |
| --- | --- |
| Track | `20261108-edge-hardening` |
| Phase | 2 — Run the suite under the policy |
| Date | 2026-11-08 |
| Branch | `chore/20261108-edge-hardening` |
| Phase base | `232924a1` |
| Head | `ec22fd70` (code; this evidence file is committed after it) |
| Result | **blocked** — the config carries the external-origin branch and every check that does not need a browser is green; `pnpm test:e2e` and `docker` are both denied to this subagent, so neither run happened here. |

`AC-4` and `AC-8` are measured, not argued, and both measurements are the
primary's: the journey suite needs a Chromium launch this shell refuses, and the
nginx half of it needs Docker, which it also refuses. What is settled below is
that the two paths a run would take are the ones the spec describes — the
default path is the same object it was, and the external path starts nothing.

## Config change

`playwright.config.ts`, one variable and one branch:

```diff
 const PREVIEW_URL = "http://127.0.0.1:4173";
 
+/**
+ * An already-running origin to drive the journeys against, e.g. the built image
+ * behind nginx: `E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e`.
+ *
+ * `vite preview` sets no security headers, so pointing the suite at the
+ * container is the only way to prove the app under the enforced policy rather
+ * than argue it. When the variable is set the suite owns no server and starts
+ * nothing; when it is unset every value below is the preview default.
+ */
+const EXTERNAL_BASE_URL = process.env.E2E_BASE_URL || undefined;
+
 const isCI = Boolean(process.env.CI);
@@ use: {
-    baseURL: PREVIEW_URL,
+    baseURL: EXTERNAL_BASE_URL ?? PREVIEW_URL,
@@
-  webServer: {
+  // No server to start when `E2E_BASE_URL` names an origin: nginx must already
+  // be listening. `vite preview` sends none of the headers under test, so the
+  // real policy can only be exercised by pointing the suite at the container.
+  webServer: EXTERNAL_BASE_URL
+    ? undefined
+    : {
         …the five unchanged properties, re-indented one level…
-  },
+      },
```

### The default path, property by property

| Property | With `E2E_BASE_URL` unset | Byte-identical? |
| --- | --- | --- |
| `use.baseURL` | `EXTERNAL_BASE_URL ?? PREVIEW_URL` → `http://127.0.0.1:4173` | yes — same literal, same origin |
| `webServer` | the same object literal: `command` (including `--host 127.0.0.1 --strictPort --port 4173`), `url: PREVIEW_URL`, `reuseExistingServer: !isCI`, `timeout: 120_000` | yes — moved one indent level, no value touched |
| `workers`, `fullyParallel`, `retries`, `reporter`, `use.viewport`, `projects` | untouched | yes |
| `pnpm test:e2e` | unchanged: `pnpm build && playwright test --project=chromium` | yes — `package.json` was not edited |

`|| undefined` rather than a bare read, so an empty `E2E_BASE_URL=` (a shell
mistake, not a target) counts as unset. Otherwise the config would start
`vite preview` and then point the suite at the empty string — two halves
disagreeing about the same variable.

Nothing else was added: no second project, no second config file, no nginx
`webServer` command. The conditional produces `undefined`, which Playwright
treats as "no server configured", not as an empty entry.

### Why the build stays in `test:e2e`

With `E2E_BASE_URL` set the container is already built and is serving its own
`dist/`, so the local build does not feed it — but it still proves the tree the
suite runs from is the tree that compiles, and `AC-8` depends on the same script
staying untouched. `package.json` is unmodified.

### Converting a violation into a named failure

`e2e/fixtures/game.ts` — `collectErrors` already captured `console` messages of
type `error`, and a CSP refusal arrives as one, so the violation was already in
every journey's final `expect(errors).toEqual([])`. The gap was the path that
never reaches that line: a blocked resource fails as a 20–30 s poll timeout on a
canvas that never fills, and the reason stays in an array nobody prints. The
smallest change that closes it echoes the first refusal to the runner's output:

```diff
+const CSP_REFUSAL = /content security policy/i;
@@ export function collectErrors(page: Page, options: { console?: boolean } = {}): string[] {
   if (options.console !== false) {
+    let echoed = false;
     page.on("console", (message) => {
-      if (message.type() === "error") errors.push(message.text());
+      if (message.type() !== "error") return;
+      const text = message.text();
+      errors.push(text);
+      if (!echoed && CSP_REFUSAL.test(text)) {
+        echoed = true;
+        console.log(`[collectErrors] ${text}`);
+      }
     });
   }
```

Once, not once per resource: a blocked `img-src` would otherwise print a line
per hub tile and bury the failure. Nothing about what the journeys assert
changed — the array still holds every message, and the final assertion still
fails on it. `console: false` journeys (offline, storage) deliberately collect
no console errors at all and stay that way.

The assertions that name a clean boot are already in place:
`e2e/journeys/boot.spec.ts:106` (`"a clean boot should log no page or console
errors"`) and `e2e/journeys/launch-all.spec.ts:60` (`"launching all 22 games
should log no page or console errors"`).

## The run under the policy

**Not run here.** Everything below is the recipe that produces `AC-4` and the
per-journey table, in the order the phase plan gives it. Expect roughly the same
wall clock as the preview run: the image is the same artifact over a local HTTP
server, so the 3.0 min local baseline in `NFR-6` should hold; the container adds
one connection, not one render.

```bash
# 1. Build the image that carries the policy (Phase 1 proved it: 21 checks pass)
docker build -t aby-little-lab:headers .

# 2. Serve it on 8080 — same port the sabotage step reuses
docker run --rm -d --name aby-edge-e2e -p 8080:80 aby-little-lab:headers

# 3. Run the 16 journeys against the policy-enforcing origin
E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e

# 4. Remove the container (the image is kept; the validator and this step reuse it)
docker rm -f aby-edge-e2e
```

On Windows PowerShell, step 3 is a separate env assignment, not a prefix:
`$env:E2E_BASE_URL='http://127.0.0.1:8080'; pnpm test:e2e`.

The 16 journeys the run must report, with the duration slot to fill from the
`list` reporter's `(N ms)` suffix (the local reporter prints one line per test):

| # | File | Journey | Duration |
| --- | --- | --- | --- |
| 1 | `boot.spec.ts` | boots the built artifact into the hub | *to record* |
| 2 | `launch-all.spec.ts` | every game launches from the hub and returns to it | *to record* |
| 3 | `parental-gate.spec.ts` | a three-second hold opens settings and a one-second press does not | *to record* |
| 4 | `parental-gate.spec.ts` | a settings toggle survives a reload and the game still boots | *to record* |
| 5 | `add-it-up.spec.ts` | Add It Up advances three rounds of tap choices | *to record* |
| 6 | `animal-trace.spec.ts` | Animal Trace completes three traced rounds | *to record* |
| 7 | `first-sounds.spec.ts` | First Sounds advances three rounds of letter taps | *to record* |
| 8 | `memory-match.spec.ts` | Memory Match clears three rounds of pairs | *to record* |
| 9 | `shape-sorter.spec.ts` | Shape Sorter advances three rounds of drag and drop | *to record* |
| 10 | `story-order.spec.ts` | Story Order sequences three rounds of panels | *to record* |
| 11 | `completion.spec.ts` | winning awards exactly one sticker and returns to the hub unaided | *to record* |
| 12 | `time-limit.spec.ts` | a spent daily budget locks the hub and never launches | *to record* |
| 13 | `offline.spec.ts` | the hub and a game still relaunch with the network offline | *to record* |
| 14 | `storage.spec.ts` | a child finishes a game on a device that cannot save, and the parent is told | *to record* |
| 15 | `storage.spec.ts` | a device that blocks storage entirely still boots a playable hub | *to record* |
| 16 | `storage.spec.ts` | a working device sees no notice | *to record* |
| | | **Total** | **must be under 5:00** |

Three results carry more weight than the rest under this policy, because each
exercises a directive a naive policy would have broken:

- **`launch-all` (2)** — 22 launches; every hub tile's art is a
  `data:image/svg+xml;base64,…` URI, so a missing `img-src data:` shows up here
  first (and this is the journey the sabotage step in `## Sabotage recipe`
  targets).
- **`offline` (13)** — `worker-src 'self'` and a classic `importScripts`, plus
  Workbox's precache fetches under `connect-src 'self'`.
- **`time-limit` / `storage` (12, 14–16)** — they inject a fake persistence
  layer through `?e2e=1` and `addInitScript`; nothing is evaluated and nothing is
  inlined, so no directive should object. If one of them does refuse, the
  refusal text now appears in the run's output (`## Config change`, last
  section) rather than as an anonymous timeout.

### Denial that blocked it

`pnpm test:e2e` → `permission.rejected` / `Permission denied: shell`. Attempted
once, not retried, not worked around. `docker` was not attempted: Phase 1
established that every `docker` invocation is denied to this shell, and the
brief says as much.

## Default path unchanged

**Not run here.** `pnpm test:e2e` with `E2E_BASE_URL` unset is the same denied
command as above, so `AC-8` is unproven by execution. What is proven in its
place:

- `pnpm typecheck` compiles `playwright.config.ts` inside the `e2e` program
  (`tsc --noEmit -p e2e/tsconfig.json`), so the ternary is a well-typed
  `WebServerConfig | undefined` and the fallback base URL is a string.
- `pnpm build` moved nothing: `dist/assets/index-CpDFSutQ.js` is still the shell
  entry at 153.6 kB by `validate-bundle.js`, the same hash as before this phase,
  and `validate-pwa.js` still counts 59 precache entries / 47 chunks. A config
  file is not in the bundle, so this is the negative control that the change
  stayed in test infrastructure.
- The default branch builds the identical object literal; the only edit inside
  it is indentation, shown in the diff above.

The run to close `AC-8`:

```bash
pnpm test:e2e
```

## Sabotage recipe

The assertion that "the CSP is fine" means something only if a journey can fail
because of it. `img-src` is the directive to break because the hub draws every
tile from a base64 SVG, so losing `data:` blanks the art without touching any
logic — the failure has to come from the policy, not from a missing code path.

```bash
# 1. Mutate: drop `data:` from img-src, leaving everything else identical
#    nginx.security-headers.conf line 26:
#      img-src 'self' data:;   →   img-src 'self';
#    (One edit. The guard test must go red on it too — that is AC-5's sibling,
#    not a separate proof.)

# 2. Rebuild, because the snippet is copied into the image at build time
docker build -t aby-little-lab:headers .

# 3. Serve it and run the journeys
docker run --rm -d --name aby-edge-e2e -p 8080:80 aby-little-lab:headers
E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e

# 4. Expected: RED. At least one journey fails, and the failure names the policy.
#    - `boot` / `launch-all` end on `expect(errors).toEqual([])` with a console
#      error per refused tile, e.g.
#      "Refused to load the image 'data:image/svg+xml;base64,…' because it
#       violates the following Content Security Policy directive: "img-src
#       'self'"."
#    - a journey that dies earlier prints the same text once as
#      `[collectErrors] Refused to load the image …` before its timeout, which
#      is what this phase's fixture change is for.
#    Record: which journeys failed, the violation text verbatim, and the count.

# 5. Restore the single line, rebuild, re-run
docker build -t aby-little-lab:headers .
E2E_BASE_URL=http://127.0.0.1:8080 pnpm test:e2e
#    Expected: GREEN — 16 passed, same durations. Record the total.

# 6. Clean up
docker rm -f aby-edge-e2e
git diff --stat          # must be empty: the mutation is fully reverted
```

`git status` must be clean at the end. If step 6 shows a diff, the restore did
not take and the green run in step 5 is not evidence.

## Acceptance

| AC | Status | Evidence |
| --- | --- | --- |
| AC-4 (all 16 journeys pass with `E2E_BASE_URL` set to the nginx origin) | **not proven — blocked** | The support exists and is typed: `EXTERNAL_BASE_URL` sets `use.baseURL` and suppresses `webServer` (`## Config change`). The run itself is denied: `pnpm test:e2e` → `permission.rejected`. Command and the 16-row table are in `## The run under the policy`. |
| AC-8 (with `E2E_BASE_URL` unset, `pnpm test:e2e` behaves exactly as before) | **not proven by execution — proven by inspection and negative control** | `## Default path unchanged`: the fallback is the same literal, the `webServer` object is the same five properties, `package.json` untouched; `pnpm typecheck` accepts the config; the bundle hash is unchanged at `index-CpDFSutQ.js` / 153.6 kB. The run is the same denied command. |

`FR-11` is implemented (both halves). `FR-7` and `NFR-6` are unmeasured until
the primary runs the two suite commands.

## Verification run here

| Command | Exit | Key output |
| --- | --- | --- |
| `pnpm check` | 0 | `Checked 296 files in 352ms. No fixes applied.` (one formatting failure on the first pass, fixed by hand to biome's own suggestion; second run clean) |
| `pnpm typecheck` | 0 | `tsc --noEmit` clean for `src` and `e2e`, including `playwright.config.ts` in the `e2e` program |
| `pnpm test -- --run` | 0 | `Test Files 135 passed (135)` · `Tests 2927 passed (2927)` · 23.0 s |
| `pnpm build` | 0 | `✓ built in 813ms` · 59 precache entries (1751.05 KiB) · `dist/sw.js`, `dist/workbox-2fbc6a65.js` |
| `node scripts/validate-bundle.js` | 0 | phaser `phaser-B_vcVLyb.js` 1335.0 kB · shell `index-CpDFSutQ.js` 153.6 kB ≤ 200 kB |
| `node scripts/validate-pwa.js` | 0 | `Results: 16 passed, 0 failed` |
| `node scripts/validate-docs.js` | 0 | `Results: 5 passed, 0 failed` |
| `pnpm test:e2e` | **denied** | `permission.rejected` — `Permission denied: shell` |
| `docker build -t aby-little-lab:headers .` | **not run** | Denied by the same layer to Phase 1; not retried here |

## Deviations

1. **`e2e/fixtures/game.ts` is outside `Touches`.** `P2.T1` names it and the
   brief's Task 4 asks for the smallest change that surfaces a violation, so the
   edit was made where the collection lives rather than by adding a reporter
   wrapper or a second fixture. Net: +20 lines, one regex, one echo; no
   assertion, wait, or helper changed signature. Recorded here for the primary
   to accept or revert.
2. **`console.log` in a fixture.** There is no console output anywhere else in
   `e2e/`, so this introduces a pattern. It is the mechanism that puts the
   browser's own words into the failure output without restructuring the
   fixtures; `biome check` accepts it (no `noConsole` rule in the recommended
   preset). If the primary prefers annotations or an HTML-report attachment,
   that is a louder change for the same evidence.
3. **`|| undefined` on the environment read** rather than the bare
   `process.env.E2E_BASE_URL` the brief describes. Empty string would otherwise
   set `baseURL` to `""` while the falsy check started `vite preview` — the two
   halves disagreeing. One operator, no behaviour change when the variable is
   either absent or meaningful.

## Blockers

1. `pnpm test:e2e` — denied (`permission.rejected`, `Permission denied: shell`).
   Expected results: with `E2E_BASE_URL=http://127.0.0.1:8080` after steps 1–2 of
   `## The run under the policy`, `16 passed`, exit 0, total under 5:00; and
   unset, the same 16 passed on `vite preview`, which is `AC-8`.
2. `docker build -t aby-little-lab:headers .` and
   `docker run --rm -d --name aby-edge-e2e -p 8080:80 aby-little-lab:headers` —
   denied to this shell (proved in Phase 1). Expected: exit 0, container serving
   on `127.0.0.1:8080`.
3. The sabotage recipe (`## Sabotage recipe`) needs both of the above; steps 1–6
   are written but none were run here.

## Notes

- **Why one branch and not a `webServer` that runs nginx.** A `docker run` inside
  `webServer` would need teardown Playwright does not own, would rebuild nothing
  (the image is the artifact under test), and would hide the container from the
  person running it. The brief forbids it for the same reason.
- **The suite is not slower for this change.** `workers: 2` and the per-file
  split are untouched, and the external origin is a local container; `NFR-6`'s
  risk is the container's own HTTP hop, not the config.
- **What the primary should paste back.** The two suite runs with their totals,
  the failing journeys and verbatim violation text from the sabotage step, and
  the green re-run. That fills `## The run under the policy`,
  `## Default path unchanged` and `## Sabotage recipe`, and clears `AC-4` /
  `AC-8`. Nothing else in this phase is outstanding.


## Primary verification

Verified 2026-11-08 by the primary agent. Phase base `232924a1`.
The executor built the config path and reported `blocked` on `pnpm test:e2e` and Docker; every run below is the primary's.

### The policy was wrong, and the suite said exactly how

First run of all 16 journeys against the container with the policy enforced: **4 passed, 12 failed**, every failure the same assertion — `expect(errors).toEqual([])`. Running `boot.spec.ts` alone surfaced the browser's own words:

```
Loading the image 'blob:http://127.0.0.1:8080/5c268a84-…'
violates the following Content Security Policy directive: "img-src 'self' data:"
```

Phaser uploads canvas textures through `blob:` object URLs. The fix was one token — `img-src 'self' data: blob:` — and nothing else changed. This is the edge case the specification anticipated ("blob: fallback … widened to the narrowest working value and the reason recorded"): `data:` stayed because it is equally load-bearing, no `unsafe-*` was added, no directive was removed.

Two consequences recorded rather than smoothed over:

- **FR-1 was amended** with the measured reason (`spec.md`, dated amendment).
- **`scripts/validate-headers.js` was edited outside Phase 2's Touches.** Its `REQUIRED_CSP_FRAGMENTS` list pinned the old `img-src 'self' data:` string, so a correct header failed 7 checks — the validator was asserting a literal rather than the requirement. It now pins `data: blob:`. The edit is a deviation, and it is the kind that matters: without it the validator would have forced the policy back to a value the app cannot run under.

### The sabotage, so "green" cannot mean "nothing drew anything"

| Step | Change | Result |
| --- | --- | --- |
| 1 | Removed `data:` from `img-src` (leaving `blob:`), rebuilt, ran `boot.spec.ts` | **1 failed** — `Loading the image 'data:image/png;base64,iVBOR…' violates … "img-src 'self' blob:"` |
| 2 | Restored the snippet, rebuilt | validator **21 passed, 0 failed**; guard test **7 passed** |

The blocked sample is a `data:image/png`, not the SVG art: Phaser's first texture upload is a 1×1 PNG. So both tokens are required by different code paths, and the suite detects the loss of either.

### AC-4 and AC-8

| Check | Command | Result |
| --- | --- | --- |
| AC-4: the app runs under the policy | `E2E_BASE_URL=http://127.0.0.1:8080` against the nginx image | **16 passed in 3.6 m** — inside the 5-minute budget |
| AC-8: the default path is untouched | `pnpm test:e2e` with `E2E_BASE_URL` unset (`vite preview`) | **16 passed in 3.4 m** |

A 0.2-minute difference between the two origins, which is noise: the container is not slower to serve than `vite preview`.

### Fail-fast, observed by accident

With a manual container holding port 8080, `node scripts/validate-headers.js` exited **1** instead of binding elsewhere. That is FR-8 working — the same trap that cost `20261107-release-e2e` a debugging day. The container was removed and the validator ran green.

### Gate

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 296 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test -- --run` | 135 files / 2,927 tests |
| Coverage | `pnpm test:coverage` | 97.21 / 91.14 / 96.18 / 98.21 |
| Build | `pnpm build` | 59 precache entries (1751.05 KiB) |
| Bundle | `node scripts/validate-bundle.js` | shell `index-CpDFSutQ.js` 153.6 kB ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed |
| Documents | `node scripts/validate-docs.js` | 5 passed |
| Headers | `node scripts/validate-headers.js` | 21 passed |

The shell hash and size are identical to Phase 1: a policy change costs no bytes.

### Acceptance

AC-4 and AC-8 are met by the runs above. AC-1's directive list now includes `blob:` under the FR-1 amendment, and the validator's fragment list plus the guard test's `unsafe-*` prohibition still hold.


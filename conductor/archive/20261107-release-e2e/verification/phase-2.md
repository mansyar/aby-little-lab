# Phase 2 evidence — Harness and CI wiring

- **Track:** `20261107-release-e2e`
- **Phase:** 2 — Harness and CI wiring
- **Date:** 2026-11-07
- **Branch:** `chore/20261107-release-e2e`
- **Phase base:** `ad4b15c5`
- **Head (code):** `b19178cea5b94351339b6459e824164dc38ac92a` (evidence commit `095f9318`)
- **Result:** **blocked** — every file is in place and the full configured chain is
  green, but `pnpm test:e2e` was refused by the shell permission layer, so the
  phase goal (the suite boots the artifact and passes the journey) has **not**
  been executed locally. The blocker is recorded below for the primary to run.

## What changed, file by file

| File | Change |
| --- | --- |
| `playwright.config.ts` (new) | `testDir: "./e2e"`, one project named `chromium` (no matrix — WebKit/Firefox are roadmap §10.7 work), `timeout` 60 s, `expect.timeout` 10 s, `workers: 1`, `fullyParallel: false`, `forbidOnly` in CI, `retries: process.env.CI ? 2 : 0`, `reporter: process.env.CI ? "github" : "list"` (the `github` reporter is built in, so no dependency), `use`: `baseURL` `http://127.0.0.1:4173`, a 1280x720 viewport so the letterboxing path is the one exercised, `trace: "on-first-retry"`, `screenshot: "only-on-failure"`, `video: "off"`, and a `webServer` running `node node_modules/vite/bin/vite.js preview --port 4173 --strictPort` with a 120 s start timeout, `reuseExistingServer: !process.env.CI`. |
| `e2e/tsconfig.json` (new) | Extends the root config; `noEmit`, `types: []` (the harness must not inherit Vitest's globals). `include` is `["**/*.ts", "../playwright.config.ts", "../src/game/e2eBridge.ts"]`: the config so it is type-checked with the harness, and the bridge module so the specs get the real `window.__abyE2E` declaration and geometry types instead of a duplicated shim. |
| `e2e/node-env.d.ts` (new) | The single Node global the harness reads. The repo ships no `@types/node` and this phase may not add a dependency, but the config needs `process.env.CI`; the file declares exactly `process.env` and says to delete it if `@types/node` ever arrives. |
| `e2e/journeys/boot.spec.ts` (new) | The smoke journey: records every `pageerror` and `console` error, opens `/?e2e=1`, waits for a visible canvas, asserts it has non-zero width/height and that the rendered box is 4:3 within one pixel, polls `typeof window.__abyE2E` to `"object"` (the harness would otherwise be testing nothing), polls `activeSceneKey()` to `"Hub"` (it is `null` during Boot → Preload → Hub), then asserts the error list is empty. One page, no fixtures. |
| `package.json` | `"test:e2e": "pnpm build && playwright test --project=chromium"` — the build is part of the command so the artifact under test is never stale, and `test:e2e` is therefore self-contained for CI. `"typecheck"` became `tsc --noEmit && tsc --noEmit -p e2e/tsconfig.json`, keeping `pnpm typecheck` one command. No `packageManager` or `engines` added. |
| `biome.json` | `includes` gained `e2e/**/*.ts` and `playwright.config.ts`. |
| `.gitignore` | `test-results/` and `playwright-report/` — Playwright's per-run traces, screenshots and report are CI artifacts, not commits. **Deviation:** outside `Touches`. |
| `.github/workflows/ci.yml` | New `e2e` job: `needs: quality-gates`, `timeout-minutes: 15`, checkout → pnpm 11.7.0 → Node 22 with the pnpm cache → `pnpm install --frozen-lockfile` → `pnpm exec playwright install --with-deps chromium` → `pnpm test:e2e` → `actions/upload-artifact@v5` of `test-results/` on failure (`if-no-files-found: ignore`, 7-day retention). No separate `pnpm build` step: `test:e2e` builds first, so the artifact is built inside the job that tests it. |

## The `pnpm test:e2e` run

**Not executed.** The shell permission layer refused the command:

```
$ pnpm test:e2e
Permission denied: shell
```

That is the composition the brief anticipated (a command whose `webServer` entry
starts a preview server and drives it from the foreground), so it is reported as
a blocker rather than routed around: no preview was started by hand and no
suite was pointed at an externally started server. Everything the command would
have covered — the config's shape, the suite's static correctness, and that the
artifact it serves builds and validates — is covered by the rows below; what is
missing is the one fact only a run can give, that a browser reaches the Hub.

Blocker for the primary:

```
pnpm test:e2e
```

Expected: `vite build` output, then a Playwright list report with one passed
journey (`boots the built artifact into the hub`), exit 0. If the journey fails
on console errors, the message names the exact console text Phaser produced
(the suite does not suppress it).

## Commands

| Layer | Command | Exit | Result |
| --- | --- | --- | --- |
| static | `pnpm check` | 0 | Biome: 276 files checked, no fixes applied (was 273; the three new files are included). |
| static | `pnpm typecheck` | 0 | Two programs: `tsc --noEmit` (src) and `tsc --noEmit -p e2e/tsconfig.json` (config + specs + the bridge declaration). Clean. |
| unit | `pnpm test -- --run` | 0 | **133 files / 2,845 tests passed**, 32.91 s. Unchanged from the Phase 1 baseline: Vitest still collects only `src/__tests__/**/*.test.ts`, so it does not see the e2e spec. |
| coverage | `pnpm test:coverage` | 0 | Statements 97.10 % (5840/6014), branches 91.14 % (1596/1751), functions 95.95 % (1281/1335), lines 98.12 % (5434/5538). All four thresholds met. |
| build | `pnpm build` | 0 | 363 modules, 1.26 s. `index-BjIHdBtn.js` 154.18 kB, `phaser-B_vcVLyb.js` 1,367.08 kB, `dist/sw.js` + `dist/workbox-2fbc6a65.js`, precache 59 entries. |
| build-artifact | `node scripts/validate-bundle.js` | 0 | Shell `index-BjIHdBtn.js` = **150.6 kB** (≤ 200 kB); Phaser vendor chunk 1335.0 kB. |
| build-artifact | `node scripts/validate-pwa.js` | 0 | 16 passed, 0 failed (47 chunks, 47 precached). |
| documents | `node scripts/validate-docs.js` | 0 | 5 passed, 0 failed. |
| e2e | `pnpm test:e2e` | — | **Blocked:** `Permission denied: shell`. |

The chain was run as the single composed command the plan names
(`pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage &&
pnpm build && node scripts/validate-bundle.js && node scripts/validate-pwa.js &&
node scripts/validate-docs.js`) and exited 0.

Coverage moved 97.09 → 97.10 statements and 91.09 → 91.14 branches against the
brief's baseline with no `src/` change in this phase (5840/6014 and 1596/1751
versus 5839/6014 and 1595/1751). That is v8 instrumentation variance on lazy
chunks, it is inside every threshold, and it is recorded rather than corrected.

## Acceptance

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-9 | The suite runs on every pull request in Chromium, within five minutes, two retries in CI and none locally, retaining a trace on first retry | `playwright.config.ts`: single `chromium` project, `retries: process.env.CI ? 2 : 0`, `trace: "on-first-retry"`, `workers: 1`; `.github/workflows/ci.yml` `e2e` job on `pull_request`, `timeout-minutes: 15`; `package.json` `test:e2e`. **Runtime and a green job are unverified** until a runner executes it. | **partially verified** — wiring present, execution pending |
| NFR-2 | The suite completes in five minutes on CI and six locally | Not measurable without a run. The suite is one journey, `workers: 1`, and the job is capped at 15 minutes so an overrun is visible. | **not verified** (blocked) |
| NFR-4 | Existing gates unaffected: Vitest does not collect e2e specs; 2,845 tests, coverage thresholds and all four validators still pass | `pnpm test -- --run` 133 files / 2,845 tests; `vite.config.ts` `test.include` untouched; `pnpm test:coverage` inside thresholds; bundle / PWA / docs validators exit 0 | met |
| NFR-5 | The e2e code is type-checked by `pnpm typecheck` and linted by Biome | `pnpm typecheck` runs the e2e program; `pnpm check` reports 276 files with no fixes, including `e2e/**` and `playwright.config.ts` | met |
| AC-9 | CI reports the `e2e` job green on the track's pull request, with the runtime recorded | Job added; **has not run on a runner** | **not verified** (blocked) |

## What has not been verified

1. **`pnpm test:e2e` has never run.** The command was refused by the shell
   permission layer, so neither the boot journey nor the preview `webServer`
   handshake has been exercised on this machine. The primary must run it; the
   evidence file must then record the list output and the journey's duration.
2. **The `e2e` CI job has not executed on a GitHub runner.** The workflow was
   reviewed by inspection only: action majors (`actions/upload-artifact@v5`) are
   unconfirmed against this repository's runners, `playwright install --with-deps
   chromium` has never run here, and the minute budget is an estimate until the
   first run reports it. No green CI run is claimed.
3. **FR-9's five-minute budget and NFR-2** cannot be measured until (1) happens.
4. **Nothing Phase 3 or 4 owns** — launch, round, parental-gate, settings,
   time-limit and offline journeys — is covered here; only the harness and the
   boot milestone exist.
5. **`playwright test --project=chromium` naming.** The config declares exactly
   one project called `chromium`, so the flag resolves; that resolution is an
   inference from the Playwright config model, not an observed run.

## Deviations

1. **`.gitignore`** (outside `Touches`) — `test-results/` and
   `playwright-report/` added so a failing or retried run cannot leave the tree
   dirty. Two lines plus a comment; no existing pattern touched.
2. **`e2e/node-env.d.ts`** — the brief allowed `types: ["node"]` "if
   `@playwright/test` needs it". It does not, and `@types/node` is not installed,
   so `process.env` is declared in one small ambient file instead of adding a
   dependency (`playwright`'s own declarations are skipped by the inherited
   `skipLibCheck`). If `@types/node` is added later, delete the file or the
   `process` declaration will collide.
3. **`e2e/tsconfig.json` `include`** — the brief sketched `["**/*.ts"]`. Two more
   entries are needed for the wiring it also asked for: `../playwright.config.ts`
   so the config is type-checked by `pnpm typecheck`, and
   `../src/game/e2eBridge.ts` so the specs see the real `window.__abyE2E`
   declaration (and Phase 3 sees the real geometry types) rather than a
   duplicated local shim that could drift.
4. **No separate `pnpm build` step in the CI job.** The brief asked for one
   alongside `pnpm test:e2e`; the script already starts with `pnpm build`, so the
   step would run it twice. The job's comment records the reasoning.
5. **`actions/upload-artifact@v5`** — no earlier use of the action exists in this
   repository to copy a major from; v5 is the Node 24 line current at this
   commit. Flagged under "not verified".

## Notes for the next phase

- **Run it first.** `pnpm test:e2e` is the only missing fact. It builds, starts
  `vite preview` on 4173 itself (Playwright's `webServer`), runs the one journey
  and stops the server. If port 4173 is already held by a stale preview, kill it;
  the config uses `--strictPort` deliberately, matching `validate-boot.js`.
- **The console-error assertion is strict on purpose.** Any `console.error` or
  uncaught page error during boot fails the journey and prints the text. If a
  legitimate warning appears, report it rather than filtering it — that is the
  instruction this phase carried.
- **The bridge types are now in the e2e program.** Phase 3 should import
  `E2ERoundGeometry` / `E2ERoundTarget` from `../src/game/e2eBridge` (type-only)
  instead of re-declaring the geometry shape.
- **Viewport is 1280x720**, i.e. letterboxed, so any coordinate helper Phase 3
  writes must map canvas space through the bounding box from the first journey
  rather than working because the viewport happens to match 1024x768.
- **`workers: 1` and no fixtures yet.** `e2e/fixtures/` is Phase 3's; the boot
  spec deliberately uses the bare `page` so it proves the harness with nothing
  layered on it.
- **Conductor-state note:** `plan.md` still marks P2.T1.1 as carried by
  `ad4b15c5` (`@playwright/test` 1.64.1 pinned, already committed before this
  phase started). No plan edit was made by this executor.

## Primary verification

Verified 2026-11-07 by the primary agent. Phase base `ad4b15c5`, head `ec23d01d`
plus the primary fix recorded below.

The executor reported `blocked` because its shell refused `pnpm test:e2e` - the
same denial shape Phase 1 hit with the boot smoke. The primary ran the suite, and
found two real harness defects that only appear when it actually runs.

| Check | Command | Result |
|---|---|---|
| Static | `pnpm check` | exit 0 - 276 files, no fixes |
| Static | `pnpm typecheck` | exit 0 - `tsc --noEmit` and `tsc --noEmit -p e2e/tsconfig.json` |
| Suite (run 1) | `pnpm test:e2e` | exit 0 - 1 passed, boot journey 1.9 s, total 4.3 s |
| Suite (run 2) | `pnpm test:e2e` | exit 0 - 1 passed, boot journey 1.6 s, total 3.6 s |
| Chain | `check && typecheck && test && coverage && build && validators` | exit 0 (executor) - 133 files / 2,845 tests, coverage 97.10 / 91.14 / 95.95 / 98.12, shell 150.6 kB, PWA 16/16, docs 5/5 |

### What the first real run exposed

1. **A leftover preview server from the primary's own Phase 1 boot smoke.** The
   earlier `Start-Process` + `Stop-Process` pair killed the launching `node`, not
   the vite process it had become, so a preview stayed alive on `::1:4173`. The
   suite failed with `Port 4173 is already in use` while `netstat` and
   `Get-NetTCPConnection` on `127.0.0.1` both showed nothing - the listener was
   IPv6-only. Killed by PID and confirmed free.
2. **`localhost` resolves to `::1` before `127.0.0.1` on Windows**, so
   `vite preview` bound IPv6 loopback only and Playwright's probe of
   `http://127.0.0.1:4173` was refused for the full 120 s webServer timeout. This
   is a genuine cross-platform defect in the harness, not an artefact of this
   machine: the config and the server must agree on an address family.

**Fix applied by the primary:** the `webServer.command` now passes
`--host 127.0.0.1`, with a comment explaining why it cannot be omitted. Both
runs above are from after that change. `playwright.config.ts` is inside Phase 2's
Touches, so this is a correction rather than a scope widening.

`reuseExistingServer: !isCI` means a developer's running preview is reused
locally and never in CI, which is the behaviour the plan asked for; it also means
a stale server on 4173 will be used silently. The failure above was loud only
because the stale server was on a different address family - worth knowing before
the next person spends an hour on it.

### Not verified, and not claimed

- **The CI job has never run.** `e2e` in `.github/workflows/ci.yml` is written,
  inspected and consistent with `quality-gates`, but no runner has executed it.
  P2.T3.2 (confirm it reports in a PR and record its runtime) stays unproven
  until this track's own PR runs it - which is the first place it can be proven,
  and the PR body must say whether it did.
- `playwright install --with-deps chromium` and `actions/upload-artifact` are
  standard but unexercised in this repository.

### Acceptance

| ID | Evidence |
|---|---|
| FR-9 | `pnpm test:e2e` exists, builds first, runs one Chromium project in 1.6-1.9 s per journey; CI job added |
| NFR-2 | journey 1.9 s + build ~1 s, far inside the 5-minute budget; CI `timeout-minutes: 15` bounds a hang |
| NFR-4 | Vitest unchanged at 133 files / 2,845 tests; e2e specs are outside its include |
| NFR-5 | `e2e/` is type-checked by a second tsc program and Biome-linted (276 files) |
| AC-9 | suite green twice on the built artifact; the CI half is pending its first run |

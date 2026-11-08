# Integrated verification - Error Capture

- **Track:** 20261108-error-capture
- **Date:** 2026-11-08
- **Branch:** feat/20261108-error-capture
- **Base:** `7d3c0db886685b5b307eefc53231990f721417dc`
- **Head:** `598518c4`
- **Result:** verified

## Layers, run against the integrated tree

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 316 files, no findings |
| Types | `pnpm typecheck` | clean, both programs |
| Unit | `CI=true pnpm test` | 144 files / 3,150 tests, 18.10 s |
| Coverage | `pnpm test:coverage` | statements 97.38 / branches 91.97 / functions 96.36 / lines 98.33 - gate 90 / 85 / 88 / 95 |
| Build | `pnpm build` | 371 modules, 47 chunks, 59 precache entries |
| Bundle | `validate-bundle` | phaser 1,335.0 kB, shell `index-DJP4hwvW.js` **172.6 kB** <= 200 kB |
| PWA | `validate-pwa` | 16 passed, 47 chunks all precached |
| Documents | `validate-docs` | 5 passed |
| Browser | `pnpm test:e2e` | **21 journeys, 4.0 m**, two workers, no retries |

## Cross-phase checks

- **The log cannot throw.** `toCrashEntry` coerces an `Error`, a string, `undefined`,
  `null`, a circular object and a throwing `JSON.stringify` into a `CrashEntry`;
  `appendCrash` drops from the head; `normalizeDiagnostics` re-caps on every read, so
  a hand-edited payload cannot grow the log past twenty entries or the 12,000-byte
  ceiling the constants imply (a maximum-length log measures 9,612 bytes).
- **The write cannot escape.** Recording goes through `recordCrash` -> `mutate`, which
  is total since `20261107-storage-resilience`: a refusing device keeps the entry in
  memory, raises the parent notice and never throws into the error handler.
- **The recovery cannot loop.** A crash with a live scene replaces that scene with the
  card, so a scene that throws every frame stops throwing. A crash with no scene at all
  spends one session-guarded reload and only logs the second, which is what stops a
  broken boot from reloading forever.
- **The child is not asked to read.** The card is a full-bleed cream screen, the mascot
  when its texture exists, one drawn arrow, no `Text` object anywhere, and a 72 px hit
  radius over a 64 px disc.
- **The parent's file is the parent's file.** The row sits on the second Settings page,
  behind the three-second hold, writes `diagnostics-<local day>.txt` with an environment
  header, and transmits nothing: `grep "fetch(" src` is still empty and no dependency
  was added.
- **The guard still holds the boundary.** The DOM guard now watches
  `window.location` and `window.addEventListener` as well as `sessionStorage`, allows
  the seam and `pwaInstall.ts` and names no other module; `errorCapture.ts` needs no
  allowance because it attaches through an injected target, and a dedicated test asserts
  its two registrations by name.
- **The backup is still a JSON file.** Generalising the download for the diagnostics
  report briefly turned every backup into `text/plain`; the seam now takes an explicit
  type, `application/json` for envelopes and `text/plain` for reports, and both are
  pinned by tests.

## The two defects only the browser could see

Both were found by the crash journey, and neither was visible to 144 unit files, the
static gates or the coverage thresholds:

1. Recovery called `game.scene.start(...)` on Phaser 4's `SceneManager`, which has no
   such method - a silent no-op. The unit fake had invented the method, so the tests
   proved the bug worked.
2. The card's hit target was an alpha-0 `Arc`. Phaser does not hit-test a zero-alpha
   game object, so the card was on screen, at the published point, and unreachable.

Both are recorded in `verification/phase-4.md` with the probe numbers that located
them, and both fixes carry a test that fails if the old shape returns.

## Scope note

The phase Touches widened, each for a reason the finding required: `e2eBridge.ts` and
`RecoverScene.ts` (the card had to publish what it drew), `e2eBridge.test.ts`,
`recoverScene.test.ts`, `e2e/fixtures/game.ts` (`recoverState`), `e2e/node-env.d.ts`
(`readFileSync` for the downloaded text), `src/__tests__/helpers/phaserMock.ts` (the
`zone` factory now records its position), and `conductor/tech-stack.md` /
`conductor/product.md`, which were denied to the executor and written by the primary.

## Numbers to carry forward

- Shell entry: 168.3 -> **172.6 kB** across the track (card, capture module, file
  writer), 27.4 kB inside the 200 kB gate.
- Browser suite: 19 -> **21 journeys**, 3.7 -> **4.0 minutes** locally. The CI run on
  the previous track took **5m28s** against a five-minute budget, so the suite was
  already over its ceiling before this track added two journeys; that is a finding in
  its own right and is not fixed here.
- Crash log: 20 entries, 400 characters of stack each, 9,612 bytes measured at the
  maximum, stored in `settings.diagnostics` at schema version 1.

## CI, on this track's own PR (#85)

| Job | Result |
|---|---|
| \`Quality Gates\` | pass, 2m1s |
| \`Browser Journeys\` | pass, 5m39s |
| \`Deploy to Coolify\` | skipped (no tag) |

The first run failed one check only, and it was worth failing: Document validation
derived **3,160 tests** on the Linux runner against the 3,158 the documents claimed.
The two extra cases were \`RecoverScene\` being scanned as a 23rd game scene - it
draws \`mascot_idle\` and declares no art group, so the scan does not apply to it -
and on that checkout it also failed four assertions the Windows run never collected.
Excluding it in \`src/__tests__/scenes/artDeclarations.test.ts\` made the scan 22 game
scenes on both platforms and the suite 3,158 tests everywhere, so the count now
means one thing. The lesson is the track's own subject at one remove: a number that
only one machine can reproduce is a number nobody can check.

Browser Journeys took 5m39s, again over NFR-5's five minutes and inside the
15-minute job timeout. Recorded, not widened.

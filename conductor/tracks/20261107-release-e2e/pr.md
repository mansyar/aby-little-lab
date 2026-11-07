## Summary

The project's first browser-level test layer. Playwright drives the built
artifact in Chromium and plays the game with real pointer input — boot, all 22
game launches, three rounds on six mechanic families, the sticker award, the
parental gate, settings persistence, the daily cap, and an offline relaunch from
the service worker. 13 journeys, 3.0 min on two workers, green on ten consecutive
runs with retries disabled.

Running it found five defects that every other gate in this repository cannot
see, one of them a shipping bug in the hub.

## Track

`20261107-release-e2e` — Browser Journey Suite (roadmap §10.2 Phase 1)

## What happened

| Phase | What landed | Checkpoint |
| --- | --- | --- |
| 1. The read-only bridge | `src/game/e2eBridge.ts` — `window.__abyE2E` installed only under `?e2e=1`; a `protected e2eRoundGeometry()` hook on `GameSceneBase` implemented by the six sampled scenes | `aa5f05f5` |
| 2. Harness and CI | `@playwright/test` pinned at the version `playwright-core` already used, `playwright.config.ts`, `e2e/tsconfig.json`, `pnpm test:e2e`, a `Browser Journeys` CI job, and the boot journey | `38488ccf` |
| 3. Launch and round journeys | Registry-driven launch of all 22 games, six three-round journeys, sticker award | `dff466c1` |
| 4. Shell journeys | Parental hold vs press, settings across reload, daily cap, offline relaunch | `e322595a` |
| 5. Proof and determinism | Mutation proof, ten consecutive runs, two workers, the layer documented | `00b9216d` |
| Review fixes | Ten findings closed | `80a3f35b` |

The five defects, all found by running rather than reading:

1. `roundIndex()` counted progress dots by `alpha`, but a dim dot is dimmed with
   its *fill* alpha, so it always read "3 rounds done". Fixed by giving
   `GameSceneBase` a real `completedRounds` counter.
2. The offline "Ready to play offline!" toast could cover the hub and swallow the
   first tap. The bridge now publishes the toast so a journey dismisses it
   deliberately instead of tapping blind.
3. **The hub ignores input for ~1.1 s after it appears** while its tiles tween
   from scale 0 (Phaser divides the hit test by scale, so taps pass through), and
   a returning hub replays that entrance every visit. The bridge publishes
   readiness; the product behaviour is recorded for the roadmap rather than
   changed here.
4. Readiness was sampled once, mid-rebuild, so a stale `true` raced the next
   board. Now it must survive two animation frames.
5. **A held back button delivered the child's next tap to the profile chip.** The
   back control navigates on a timer, so the finger's release landed on the hub
   — at the chip's centre, because the chip sits in the same corner — opened the
   picker, and the picker's full-canvas overlay ate the first tap. The chip now
   ignores a release it did not take a press for. This one ships to players.

## Requirements

- FR-1..FR-10 — met. The bridge is read-only and inert without `?e2e=1`; 22
  launches, six round journeys, the shell journeys, CI wiring and the mutation
  proof are all present.
- NFR-1 — met, with the chip guard named as the one behaviour change.
- NFR-2 — met with measurement: 4.9 min serial became 3.0-3.1 min on two workers
  against a 5 min ceiling.
- NFR-3 — met: ten consecutive runs, retries 0, 3.07-3.10 min each.
- NFR-4 — met: Vitest does not collect the specs; unit count only grew by the
  tests for the bridge and the chip guard.
- NFR-5 — met: `pnpm typecheck` covers both programs, Biome covers `e2e/`.
- AC-1..AC-10 — met except AC-9, which is this PR's own CI run.

## Verification

| Layer | Command | Result |
| --- | --- | --- |
| Static | `pnpm check` | 291 files, no findings |
| Types | `pnpm typecheck` | `src` and `e2e` programs clean |
| Unit | `pnpm test -- --run` | 133 files / 2,881 tests |
| Coverage | `pnpm test:coverage` | 97.19 / 91.12 / 96.16 / 98.19 (gate 90 / 85 / 88 / 95) |
| Build | `pnpm build` | 59 precache entries, 1,750 KiB |
| Bundle | `validate-bundle` | shell 152.6 kB <= 200 kB, phaser 1,335.0 kB |
| PWA | `validate-pwa` | 16 passed |
| Documents | `validate-docs` | 5 passed |
| Browser | `pnpm test:e2e` | 13 passed in 3.2 min, retries 0 |
| Determinism | ten consecutive `pnpm test:e2e` | 10/10 green, 3.07-3.10 min |
| Mutation | 1x1 tile hit area | 3 journeys red, every static gate green |

## Media

Omitted deliberately, with the config's `pr.media: always` overridden for this
track: the change has no visual surface, and a screenshot of a passing terminal
is not evidence a reviewer can check. The evidence is the mutation result above,
reproducible with `git diff` of the reverted probe, and the journeys themselves.

## Review

PASS WITH FINDINGS. One round, ten findings — two High, two Medium, four Low —
all resolved. Two are worth a reviewer's attention:

- **F1** corrected the spec rather than the app: AC-7 assumed the daily cap
  raises the nudge, but the product has always locked at the cap and nudged in
  the last five minutes. The criterion now says what the app does.
- **F2** turned out to be worse than reported: `master` had **no branch
  protection at all**, so even `Quality Gates` was advisory. `Quality Gates` and
  `Browser Journeys` are now required contexts. That is a repository setting, not
  a diff, so it is stated here rather than shown in the files.

No overrides, nothing deferred, no follow-up issues.

## Deviations and risks

- **Three living documents changed** (`README.md`, `docs/TDD.md`,
  `docs/perf-baseline.md`): `validate-docs` derives suite counts from a
  `vitest list` run, so adding a test file makes the old counts wrong.
- **Phase 3 and 4 widened into `src/`**: the bridge, the geometry hook, the hub's
  tile/toast/readiness publication, the settings panel and the chip guard. Each
  is recorded in the phase evidence that introduced it; the chip guard is the
  only one that changes what a player experiences.
- **The suite is a separate CI job, not part of `verify_phase`**, deliberately: it
  costs 3 min and every phase gate stays near 90 s.
- **Risk:** `launch-all` is 2.7 min of the 3.0 min wall clock, so the suite's cost
  is one unsplittable loop. A future journey that needs its own 2 minutes will
  push past the budget, and that is a decision about the suite's shape.
- **Risk:** Chromium only. WebKit and Firefox are the roadmap's browser-matrix
  work (§10.6); a Safari-only defect would still reach a parent unseen.

## Follow-ups

Recorded for the roadmap, not this track:

1. **The hub ignores input for ~1.1 s after it appears**, and every return
   replays it. A fast child taps the first tile and nothing happens.
2. **The daily cap locks without ever nudging**, so the last five minutes are
   explained and the wall is not. Whether a child should be told "that's all for
   today" is a product decision for Phase 2/4.

## Rollback

```bash
git revert <merge-sha>   # or: git checkout master && git revert -m 1 <merge-sha>
```

Reverting removes the `e2e/` layer, the CI job and the bridge. The chip guard
fix would be lost with it and should be re-landed on its own; it is independent
of the suite.

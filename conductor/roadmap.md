# Conductor Roadmap

<!-- next-rm-id: 7 -->

> Planned and future work. The roadmap stores **intent** — ordering, priority,
> and dependencies — not live state. `conductor-status` joins every entry whose
> `track` column is filled to that track's real metadata and registry state, so
> this file never has to be kept in sync by hand. Reorder rows within a bucket
> to set sequence. Use `conductor-roadmap` to add, refine, promote, or drop
> items; do not hand-edit the `id` or `track` columns.
>
> The detailed phase history below was moved here from
> [`conductor/product.md` §10](./product.md) on 2026-11-24; section numbers
> (`§10.1` … `§10.10`) are preserved so existing references keep working.
> This file lists forward-looking items only; completed tracks and dropped decisions are recorded in the archive and in the section 10 history below.

## Now

| id | title | type | priority | depends_on | track | origin |
| --- | --- | --- | --- | --- | --- | --- |
| — | No unstarted committed work: Phase 4 depth tracks are landed, Phase 5 is cancelled, Phase 6 is continuous. | — | — | — | — | — |

## Next

| id | title | type | priority | depends_on | track | origin |
| --- | --- | --- | --- | --- | --- | --- |
| RM-5 | Wire the four signature content variants into real playthroughs | feature | high | — | — | user |
| RM-6 | Surface adaptive-band movement on the Progress Overview | feature | high | — | — | user |

## Later

| id | title | type | priority | depends_on | track | origin |
| --- | --- | --- | --- | --- | --- | --- |

## Dropped

| id | title | reason |
| --- | --- | --- |

## 10. Roadmap

Priority as of 2026-11-06. The engineering foundation is not the constraint: the
app is layered, registry-driven, measured and gated. What is missing is the
operating layer around it — a browser-level regression net, evidence that the
games still work for a child over weeks rather than minutes, content depth
behind the 24 mechanics, and a stated position on distribution, language and
accessibility. The sequence is therefore **trust → observability → depth →
reach**, and each phase is one or more Conductor tracks.

**Planning assumptions**

- One developer, part-time, with the existing Conductor workflow and gates.
- Distribution stays private/small — Phase 3 confirmed family-only on
  2026-11-20 (see §10.4).
- No accounts, no cloud sync, no third-party analytics; local-only data is a
  product property, not an implementation detail.
- Every phase ships through the existing gate (`check`, `typecheck`, `test`,
  `test:coverage`, `build`, `validate-bundle`, `validate-pwa`, `validate-docs`)
  plus whatever the phase adds.

### 10.1 Phase 0 — Trunk hygiene (1 day)

The trunk must be trustworthy before anything is planned on top of it. A suite
that rots on a calendar boundary teaches the team to ignore red.

| Track | Work | Exit gate |
|---|---|---|
| `20261106-trunk-green` | **Done 2026-11-07** (track `20261107-trunk-green`): all 29 date literals classified - 5 were clock stand-ins, converted to values derived from an explicit clock; 24 were payload data and stayed literal. A source-guard test now fails on a bare quoted day key assigned to `lastUsedDate`, the "no wall-clock values" rule is in `code_styleguides/typescript.md` §6, and the two 22-scene sweeps got a 60 s budget so the coverage gate stops tripping on a 30 s deadline. | `master` green on a fresh clone on a different day |
| `20261106-docs-truth-2` | **Done 2026-11-07** (absorbed into track `20261107-trunk-green`, commit `6cd2d85a`): the README's "Known Issues" is now the home for what is broken and carries only live items; `docs/roadmap.md` was deleted and every reference repointed at §10, so this section is the only roadmap. | No second roadmap copy survives in `docs/`; `validate-docs` green |
| `20261106-roadmap-adopt` | **Done 2026-11-07** (same commit): this section is the roadmap of record; the old file was deleted rather than kept as a pointer, and the two dated changelog mentions of it were left intact as history. | Roadmap carries dated, owned items; nothing else claims the title |

### 10.2 Phase 1 — Trust the build (2 weeks)

| Track | Work | Exit gate |
|---|---|---|
| `20261110-release-e2e` | **Done 2026-11-07** (track `20261107-release-e2e`): Playwright journey suite on the built artifact. 13 journeys across 12 specs: boot → hub → launch each of 22 games → three rounds on six games (drag, trace, tap-choice, letter, memory, sequence) → sticker award → back nav → 3 s parental hold vs 1 s press → settings persisted across reload → daily cap → offline relaunch. A read-only `?e2e=1` bridge is the only production-adjacent change; the suite is a separate CI job on two workers, 3.0 min of the 5 min budget. Running it found five defects the other gates could not see, including a chip that ate the first tap after a held back button. | `e2e` green on every PR; catches a deliberately broken hit area - **demonstrated**: a 1x1 tile hit area turns three journeys red while check, typecheck, 2,881 unit tests and the build stay green; ten consecutive runs green with retries 0 |
| `20261110-storage-resilience` | **Done 2026-11-07** (track `20261107-storage-resilience`): the save layer is total. Every access to the store goes through one guarded route; a refused read or write keeps the change in memory, raises a session flag and never reaches a scene, and the parental panel states the fact in one quiet line while it is raised. Eleven mutators and seven getters are covered at the unit layer, and a browser journey wins a game on a device whose writes throw, reloads into a degraded hub and reads the notice. | No unguarded `setItem`; a simulated quota failure never throws into a scene - **demonstrated**: 14 tests fail against the pre-fix `storage.ts` and pass after, and the browser journey shows the hub returning unaided while every write is refused |
| `20261110-toolchain-pinning` | **Done 2026-11-07** (track `20261107-toolchain-pinning`): `packageManager: pnpm@12.16.1` and `engines.node` declared in `package.json`, `.node-version` at 24, CI reading both (the pnpm action omits `version:` and follows `packageManager`), the Dockerfile built on `node:24-alpine`, the dead `pnpm-workspace.yaml` and unused `serve` removed, and a source-guard test holding the Dockerfile, both CI jobs, the README and the action allowlist to the declaration. CI also classifies each change: a documentation-only PR installs and runs `validate-docs`, nothing else, while both required checks still report. | CI and a fresh clone resolve identically; the docs validator checks the pin — **demonstrated**: a clean `pnpm install --frozen-lockfile` under the declared pnpm, a green `docker build`, and a deliberate version edit turning one guard assertion red |
| `20261110-edge-hardening` | **Done 2026-11-08** (track `20261108-edge-hardening`): four headers from one snippet included by the server block and all five cache locations, because nginx only inherits `add_header` into a location that declares none. The CSP is strict (thirteen directives, no `unsafe-*`); `img-src 'self' data: blob:` is the one measured concession — Phaser uploads canvas textures through `blob:` and the SVG art through `data:`, and removing either fails a journey. Proven by a container-booting validator that asserts headers **and** unchanged `Cache-Control` on every route class (21 checks), the full 16-journey suite run against the nginx origin, a guard test that fails if a future location forgets the include, and a CI step that errors rather than skips when Docker is missing. HSTS, COOP and CORP are deliberately out of scope, with reasons in the TDD. | Headers present on every route including 404s; install and update still work - **demonstrated**: removing one location's include serves that route with no policy while every other route stays green, and dropping `data:` turns `boot` red |

Every later phase touches scenes, assets or storage; without a browser layer
each of those changes is blind.

### 10.3 Phase 2 — Product operations (3 weeks)

The phase that turns a well-built toy into a product that can be reasoned about.
All instrumentation is local, capped, prunable, and leaves the device only when a
parent explicitly exports it.

| Track | Work | Exit gate |
|---|---|---|
| `20261124-local-insights` | **Done 2026-11-08** (track `20261108-local-insights`): one pure summary built from the aggregates that already existed, plus a five-field per-profile record holding what they cannot — the streak, its best, and the days the daily cap was reached (backfilled at zero, `SCHEMA_VERSION` still 1). The Progress overlay now opens on an Overview page: this week's reach and lifetime completions, overall accuracy with the strongest and hardest game above a ten-tap floor, and the streak and cap history. No event ring buffer was needed — the existing counters plus two new ones answer the question, so none was built. Adaptive-band spread is not on this page yet; it belongs with Phase 4's adaptive work. | A parent can answer "what is being played, and is it working" in under 30 seconds - **demonstrated**: a journey seeds a week of history, holds the parental gate, opens Progress and reads all three statements on page one, in about ten seconds |
| `20261124-backup-restore` | **Done 2026-11-08** (track `20261108-backup-restore`): Settings has a second page. Save writes a dated `.json` file whose envelope carries the format tag, the save schema version, the app version, the export time and a checksum over the payload; Restore verifies a picked file and asks merge or replace before writing anything. Merge is best-of-field — the earned sticker wins, the higher counters win, the later stamp wins — so importing the same file twice changes nothing. Six named refusals cover a damaged file, a foreign one, a newer layout, a newer save, a bad checksum and a save that would exceed four profiles, and each states its own sentence on the page. The checksum detects corruption, not tampering: the file holds star counts, not secrets, and the seam never leaves the device. | A round trip to a second device loses nothing — **demonstrated**: a journey exports through the real download, hands the file that landed on disk to a *second browser context*, merges it, and reads both stickers, the progress and the streak back after the reload, with the game still playable. Two limits accepted: a profile id collision merges two children as one, and the file is not encrypted |
| `20261124-error-capture` | **Done 2026-11-08** (track `20261108-error-capture`): two global handlers (`error`, `unhandledrejection`) record an uncaught failure as `{ at, kind, message, stack }` in a device-level log at the existing schema version 1, bounded at twenty entries and 400 stack characters - a 16,000-byte ceiling, measured at 13,461 for twenty maximal entries (Amended 2026-11-08 by the review round: bounding the message as well - `MAX_MESSAGE_CHARS` 200, applied on write and on read - moved the enforced ceiling to 16,000 bytes and the measured worst case to 13,461. The earlier 12,000 / 9,612 figures bounded only the stack, so they were a property of the fixture rather than of the code.). A crash replaces the broken scene with an icon-only card (the mascot and one arrow, no words a four-year-old cannot read); a crash before the canvas exists spends one session-guarded reload and never a second. **One deliberate deviation from the roadmap:** it said "Copy diagnostics", and this ships a dated `diagnostics-<day>.txt` download instead, because a clipboard write cannot be proved by a test and a file can be emailed from a phone. The log still never leaves the device except through that download, and the download seam now takes a MIME type so one anchor serves both the backup envelope and the report. | A crash yields a shareable, human-readable trace - **written and green in the unit layer, demonstrated by the journey once CI runs it**: `crash.spec.ts` throws a real error inside the page, waits for the card to replace the scene, taps the card's published button, lets the page reload itself with no `page.reload()` anywhere, plays a game, then downloads the log and reads the thrown message and the environment header back out of the file |

**Metrics this unlocks** - every figure below is read per profile, on the device,
by opening Progress. Nothing is transmitted and nothing is aggregated; where the
Overview does not yet report a metric, the row says so rather than guessing:

| Metric | Today | Target |
|---|---|---|
| Game completion rate (start → 3 rounds) | reported on the Overview page as a share of started sessions; no device-wide figure exists | ≥ 80% |
| Distinct games per session | the page reports distinct games this week, not per session | ≥ 4 |
| Adaptive band movement | not surfaced yet - Phase 4's adaptive work adds it | 60% of profiles move ≥ 1 band within 2 weeks |
| Uncaught errors per 100 sessions | readable per device from the diagnostics file: every entry carries a moment, a kind and a message, newest first, up to twenty - so a parent can count this week's crashes on one device; still no rate across devices, because nothing is transmitted | < 1 |
| Day-7 return (local proxy) | the 7-day strip shows reach, not retention; a return rate needs a longer history than a profile holds | ≥ 40% |

### 10.4 Phase 3 — Product-intent gate (1 week)

One decision unlocks or cancels Phases 4–5. Record it; scope must stop being
implicit. Deliverable: `docs/product-intent.md`.

1. **Audience** — family-only, small private distribution, or public release?
2. **Accessibility scope** — is "touch-only, sighted, textless" a documented
   stance (defensible and honest) or a gap to close (keyboard/switch access,
   OS zoom)?
3. **Language** — English permanently, or is a second locale a goal?
4. **Legal posture** — LICENSE, `bgm.mp3` provenance, COPPA/GDPR-K statement,
   store privacy labels.

Building i18n and store packaging for a family-only app is months of waste;
shipping publicly without these answers is a legal and reputational risk.

**Done 2026-11-20** (track `20261120-product-intent-gate`). The four decisions
are recorded in [docs/product-intent.md](../docs/product-intent.md): family-only
audience; touch-only, sighted, textless, landscape as a documented stance
(no keyboard/switch access or OS zoom work); English permanently, with i18n and
a second locale not goals; and a full public-release legal posture with the
artifacts prepared but not submitted. The untraceable BGM loop was replaced with
a CC0-licensed one, attributed in
[docs/audio-attribution.md](../docs/audio-attribution.md). Consequence: Phase 5
reach is cancelled, Phase 4 depth is next.

### 10.5 Phase 4 — Depth & retention (4–6 weeks, content-led)

Breadth is already 22 games; the retention risk is pool thinness, not game
count. Content work must stay inside the current texture tiers and per-game
chunk budget — retention may not be bought with memory. The `validate-textures.js`
guard enforces this in CI: on 2026-11-21 the caps were re-baselined to 80 MiB
typical / 320 MiB full (real assets 74.57 / 313.00 MiB) with a hard
`typical ≤ full/2` ratio, superseding the earlier 39 / 178 MiB figures from the
2026-10-17 measurement (see `docs/perf-baseline.md`).

| Track | Work | Exit gate |
|---|---|---|
| `20261208-content-depth` — Done 2026-11-21 (track `20261121-content-depth`; see `docs/perf-baseline.md`) | Words 28 → 60 (27 three-letter / 33 four-letter), stories 15 → 30 (15 obvious / 15 subtle; 90 panels), scenarios 32 → 48 (12 per emotion), shapes 18 → 24; two signature variants per pool | Machine-checked: seeded no-repeat playthrough tests across all four games + `validate-textures.js` guard (80/320 MiB caps, ratio ≤ 0.5) in `verify_phase` |
| `20261208-replay-novelty` — Done 2026-11-24 (track `20261124-replay-novelty`) | Session-level variety policy (no immediate repeats) via a per-visit in-memory selector (unplayed → least-recently played → registry order), a textless Professor Hoot suggestion cue, the same no-repeat selector driving the idle wiggle, and one earned-sticker shelf spotlight per visit with an empty-slot fallback | Machine-checked: 1,200 seeded eight-play visits with median distinct games ≥ 4, zero unexpected immediate repeats, and per-profile reset tests; full `verify_phase` green |
| `20261208-adaptive-tuning` — Done 2026-11-24 (track `20261124-adaptive-tuning`) | Retune the bands via seeded simulation of the designed 70/15/15 curve (`UP_THRESHOLD` 0.9 / `DOWN_THRESHOLD` 0.5); parent view of the viewed profile's band in Learning Progress | Band distribution matches the designed curve; full `verify_phase` green |

### 10.6 Phase 5 — Reach (4–6 weeks, gated by Phase 3) — Cancelled 2026-11-20

Only if Phase 3 says "public" or "second language". Phase 3 chose family-only
and English permanently, so the precondition is not met. The table below is kept
as history, not as planned work; Phase 4 depth and Phase 6 sustainability are
the path forward.

| Track | Work | Exit gate |
|---|---|---|
| `20270105-i18n-seam` | Extract strings and narration manifests; per-locale asset bundles; RTL-safe layout audit; one pilot locale | A second locale ships without touching game logic |
| `20270105-accessibility-execution` | Either publish the touch-only stance in this document and the README, or add keyboard/switch input and restore OS zoom | The decision is visible to a user, not just in code |
| `20270105-store-packaging` | TWA/Capacitor wrapper, store assets, privacy statement, review checklist | Installable from a store listing |
| `20270105-licensing` | LICENSE, audio attribution, third-party notices | Every shipped asset has a traceable right |

### 10.7 Phase 6 — Sustainability (continuous)

| Item | Cadence | Why |
|---|---|---|
| Module size budget in `workflow.md` (400 warn / 600 fail, strict, no allowlist) — **Done 2026-11-23** (track `20261123-release-v1-25-0`) | once, then enforced | 13 oversized production modules split; `prewarm.ts` is no longer a god-file |
| Split changelogs out of `product.md` and `tech-stack.md` into `docs/changelog.md` — **Done 2026-11-23** (track `20261123-release-v1-25-0`) | once | entries moved verbatim; pointers left in both docs |
| Dependency-majors track | monthly | one already shipped on 2026-10-27; make it routine |
| Perf baseline per release, first-tap p95 measured headed — **Done 2026-11-24** (track `20261124-first-tap-p95-baseline`; [evidence](../docs/perf-baseline.md#first-tap-p95-baseline-after-the-word-match-fix-2026-11-24)) | per release | headed cold control passed the unchanged 400 ms worst-cold gate (50 cold / 0 warm samples, aggregate p95 total 270.1 ms, worst 277.5 ms); the pre-fix 507.4 ms Find the Word failure remains history. This does not prove every KPI: p95 is report-only and real-device coverage remains outstanding |
| Browser matrix (WebKit, Firefox, mobile Chromium/touch emulation) — **Done 2026-11-25** (track `20261125-browser-matrix`; [PR #100](./archive/20261125-browser-matrix/pr.md)) | per release | emulated engine smoke runs on every code PR and blocks the `Browser Journeys` rollup; strict evidence rejects retried, flaky, skipped, unexpected or wrong-project reports. Physical-device checks remain manual; iOS Safari, Android Chrome and Fire tablet coverage is not claimed |

### 10.8 Sequence and milestones

```
P0 trunk (1d) → P1 trust (2w) → P2 ops (3w) → P3 intent gate (1w)
                                                   │
                                  ┌────────────────┴────────────────┐
                                  ▼ family-only                     ▼ public
                            P4 depth (4–6w)                  P4 depth (4–6w)
                            P6 sustain (ongoing)             P5 reach (4–6w)
                                                             P6 sustain (ongoing)
```

**Outcome 2026-11-20:** the family-only branch was taken — Phase 5 reach is
cancelled, and the path is Phase 4 depth followed by Phase 6 sustainability.

| Milestone | Approx. version | When |
|---|---|---|
| Trunk trustworthy | patch | day 1 |
| CI has a browser layer | v1.24.0 | ~2 weeks |
| A parent can see and move their data | v1.25.0 | ~6 weeks |
| Content depth landed — **Done 2026-11-21** (track `20261121-content-depth`) | v1.26.0 | ~12 weeks |
| Public-release candidate | v2.0.0 | ~4.5 months |

### 10.9 Roadmap risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| The E2E suite turns flaky and gets disabled | High | Journeys, not unit assertions; retry ≤ 1; quarantine policy; state-based waits only |
| Content expansion blows the texture budget | Medium | Per-game art budget validated in CI before merge |
| Phase 3 never happens and scope stays implicit | Medium | Closed 2026-11-20: the gate ran and its decisions are recorded in `docs/product-intent.md` |
| Retention is optimised against a noisy proxy | Medium | Treat Phase 2 numbers as directional; confirm with a handful of real families (see [validation protocol](../docs/retention-validation.md)) |
| Toolchain pinning breaks a contributor's setup | Low | Pin in CI first, then Docker, then docs |
| The accessibility stance is deferred indefinitely | Medium | Closed 2026-11-20: touch-only, sighted, textless, landscape published as a documented stance in README and `docs/product-intent.md` |

### 10.10 Deliberately not doing

Cloud sync and accounts (breaks the privacy posture and the offline guarantee) ·
real-time multiplayer · more games before deeper pools · third-party analytics or
crash SDKs · runtime AI content · a native rewrite · keyboard support (Phase 3
decided against it on 2026-11-20) · migrating the `abby-` storage key (permanent
but harmless).

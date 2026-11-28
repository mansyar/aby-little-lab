# Release Notes - v1.28.0

> Status: DRAFT
> Tag: pending
> Base: v1.27.0 (`019a26cd`, 2026-11-27)
> Date: 2026-11-28

Three PRs have merged since v1.27.0. All three are parent-visible: a 25th game called Repeat Machine, a hub-grid fix that keeps every tile visible and tappable on wide screens, and a per-profile narration pace control in Settings. The games, rules and controls are otherwise unchanged, and nothing new is asked of a child. Profiles, stickers, settings and saves carry over without migration.

This remains a DRAFT. Candidate verification is measured and recorded below; CI, tag, deploy and live results are still pending, so no shipped version or production hash is claimed.

## What Shipped Since v1.27.0

Three PRs merged after v1.27.0, listed in merge order.

### PR #109 - Repeat Machine: game 25

- Children can author a short loop and watch the machine replay it: pick an action and a count of 2–4, then watch the machine run it back.
- When the count is wrong, the machine visibly replays the loop so the child can see the mismatch and try again. Sessions run for six rounds with the same scoring and completion behaviour as the other games.
- Repeat Machine sits in the Thinking group on the hub, with its own progress row, tile and sticker. The texture cap moved from 320 to 322 for two copied-shell SVGs under unique keys; no new artwork was designed.
- No migration, new dependency or storage change. [PR #109](https://github.com/mansyar/aby-little-lab/pull/109).
- Archived evidence: [Repeat Machine track record](../conductor/archive/20261128-repeat-machine/pr.md).

### PR #110 - Wide hub grid shows and taps the 25th tile

- On wide desktop screens the All view used four rows, leaving the 25th tile and its plaque below the 1024×768 fold. The 25th tile now flows onto a fifth row; the wide board stays horizontally centered and anchors below the interactive chip band, so every game is visible and tappable without scrolling.
- Row 0 now anchors below the interactive chip band. Tile size and horizontal spacing are unchanged; vertical row spacing is now 18px so the five-row board clears the chip band and fits 1024×768. No paging was added; the narrow, paged hub path is unchanged.
- No migration, new dependency, new asset or storage change. [PR #110](https://github.com/mansyar/aby-little-lab/pull/110).
- Archived evidence: [wide hub grid fix track record](../conductor/archive/20261128-wide-hub-grid-overflow/pr.md) and [issue #108](https://github.com/mansyar/aby-little-lab/issues/108) (RM-11), the wide-grid overflow report this fix addresses.

### PR #111 - Parent control for narration pace

- Settings now has a narration pace selector beside the voice row, with Slower, Gentle and Standard presets. It applies per child profile on boot and when switching profiles.
- Gentle is byte-identical to the previous read-aloud behaviour and is the default for existing profiles, so nothing changes for a child unless a parent opts in. Backup export carries the pace; merge keeps the local setting and replace restores the incoming one.
- This is an additive profile field only: no schema bump, new dependency or new art asset. [PR #111](https://github.com/mansyar/aby-little-lab/pull/111).
- Archived evidence: [narration pace track record](../conductor/archive/20261128-narration-pace/pr.md).

## Installation

Nothing to install by hand: this release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy. Offline play uses the precached entries from the first visit. There is no storage migration: existing profiles, stickers, settings and saves carry over exactly as they were. Tag, deploy and live-build verification are pending for this draft, so no served version or shell hash is claimed yet.

## Release Verification

> **Candidate verified locally; ship gate pending.** Status remains DRAFT. The
> integrated gate, headed first-tap measurement and four-project local browser
> matrix passed. PR CI, the immutable tag, Coolify deploy and live verification
> have not run yet.

- Integrated gate: **PASS** — Biome checked 393 files; application and E2E TypeScript projects passed; Vitest passed 165 files / 3,559 tests; coverage reached 96.91 % statements, 90.23 % branches, 96.22 % functions and 98.06 % lines. Vite built 501 modules. Bundle, module-size, texture, PWA and docs validators all passed; the shell entry is 190.3 kB via `validate-bundle`, PWA validation is 16/0 with 55 chunks precached, and texture figures remain 76.42 / 321.00 MiB with ratio 0.238.
- Boot and first tap: **PASS** — the corrected headed cold-control run recorded 50 cold / 0 warm samples, exactly 10 per game. Aggregate cold p95 response / finished / total was 40.9 / 32.4 / 265.2 ms, cold median total was 202.4 ms, and the worst cold total was 273.2 ms (Find the Word), inside the 400 ms gate. Boot median was 450.1 ms; 4×-throttled boot median was 1957.1 ms.
- Browser matrix: **PASS after one caused rerun** — Chromium 30/30, WebKit 10/10, Firefox 10/10 and mobile Chromium 10/10, 60/60 total with zero local retries. The first attempt's single boot-toast timeout and the identical successful rerun are retained in the release track. This is local emulated-browser evidence; PR CI remains authoritative.
- Physical-device coverage: **SKIPPED — accepted gap.** No physical iOS Safari, Android Chrome or Fire tablet pass is claimed. See [device-testing-checklist.md](device-testing-checklist.md).
- Tag, deploy and live verification: pending. No tag commit, CI run, deploy, HTTP status, served version or shell hash is claimed here.

Measured evidence is recorded in [the v1.28.0 performance-baseline section](perf-baseline.md#v1280-release-candidate-2026-11-28) and the release track's Phase 3 verification report.

## Known Issues

The full list of known issues lives in the README's [Known Issues](../README.md#known-issues) section, and planned work lives in [conductor/roadmap.md §10](../conductor/roadmap.md#10-roadmap); nothing below duplicates either.

- Physical iOS Safari, Android Chrome and Fire tablet behaviour remains an accepted gap; see [device-testing-checklist.md](device-testing-checklist.md). No physical-device pass is claimed.
- Candidate verification is green locally; CI, tag, deploy and live verification remain pending while this document is DRAFT.

## Post-merge Ship Runbook

This section records the exact post-merge sequence. Nothing below has happened
yet: Status stays DRAFT, Tag stays pending, and every CI, deploy and live field
stays pending until the ship evidence exists. Preparing this runbook authorizes
no merge, tag, deploy or live action.

### Merge and issue #108 closure

Only an explicit **Merge now** answer authorizes merging the release PR and
deleting the local and remote release branch. Merge approval does **not**
authorize tagging: the immutable tag and the Coolify deploy require a separate,
explicit go-ahead (below). Stop at `awaiting-merge` if that answer is not given.

After the release PR is merged and verified `MERGED`, close issue #108 as
completed with this exact comment, replacing `#<release-pr>` with the merged
release PR number:

> Fixed by #110 and included in the v1.28.0 release PR #<release-pr>. The wide-grid regression is covered by the 25-tile/25-plaque bounds tests, the chip-clearance guard, the green release-candidate gate and browser journeys. Closing as completed after the release PR merge.

Evidence for the closure is PR #110 (the fix) plus the merged release PR; do not
close #108 before the merge is confirmed.

### Authorized tag, deploy and live verification

Tagging requires a separate explicit go-ahead. Do not infer it from the merge
answer, and do not create, push, move or delete any tag before that go-ahead.
Once it is given, perform these steps in order:

1. Merge the release PR with the configured `merge` method only after explicit
   approval and green required checks (Quality Gates and Browser Journeys),
   verify `MERGED`, and delete the local and remote release branch.
2. Fetch `master`; require a clean tree and the release merge at HEAD.
3. Require no local or remote `v1.28.0` tag. Create one annotated tag at the
   merged HEAD and push it once. Never move, delete or recreate it.
4. Require tag CI to pass Quality Gates, both Browser Journeys shards, the
   engine matrix (WebKit, Firefox and mobile Chromium) and the Browser Journeys
   rollup, and require Deploy to Coolify to pass.
5. Verify the live URL returns HTTP 200, the title is `Aby's Little Lab`, the
   served shell embeds `1.28.0`, the local and remote shell SHA-256 hashes are
   equal, `sw.js` names the served shell, and `manifest.webmanifest` returns
   HTTP 200.

Until steps 1–5 pass, all CI run IDs, the deploy/live URL, the served shell name
and hash, the embedded version, and the service-worker/manifest results remain
pending here. No shipped version or production hash is claimed by this draft.

### FINAL notes and rollback

The notes stay DRAFT until all ship evidence exists. Only when every step above
passes may Status flip to FINAL and Tag to the annotated `v1.28.0` target, with
the tag commit, CI run IDs, deploy/live URL, served shell/hash/version,
service-worker and manifest results, and `SKIPPED — accepted gap` for physical
devices recorded. Post-tag finalization is documentation/Conductor-only: it may
not change runtime code, assets, dependencies, the tag or its target commit.

Rollback rules:

- **Before tag:** revert the release PR; there is no production impact and no
  published tag to reconcile.
- **After tag/deploy:** never move or delete the published `v1.28.0` tag.
  Revert the release merge with a reviewed follow-up and cut a patch release if
  a shipped defect is found.
- **Data:** this release has no migration, schema change or profile rewrite, so
  no user-data rollback is required; profiles, stickers, settings and saves
  carry over unchanged.

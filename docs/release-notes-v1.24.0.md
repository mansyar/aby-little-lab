# Release Notes - v1.24.0

> Status: DRAFT
> Tag: (pending)
> Base: `v1.23.0` (`45190721`, 2026-10-27)

Fourteen tracks have merged since v1.23.0 — the largest gap in the release record — and they land together here. For families the headline is two brand-new games: **Robot Path, the 23rd game**, and **Fix-It Machine, the 24th game** and the suite's first debugging game (where a child's taps count as "looks", never scores). Parents get a new Overview of what is being played and whether it is working, a way to carry a save to another device and back, a gentle tap-to-dismiss card if something goes wrong, and a way to filter the board by learning domain. Underneath, the save layer and the test suite were hardened, the toolchain pinned, and a strict Content-Security-Policy added. This release also closes the product-intent gate: the decisions on audience, accessibility, language and legal posture are recorded, the project carries an MIT license, and the old untraceable background music is replaced with a CC0-licensed track, with its source recorded in [audio-attribution.md](audio-attribution.md). Nothing here asks for a store listing or a store submission — it is the app you already use, with more to play and more to trust.

## What Shipped Since v1.23.0

Fourteen tracks merged since v1.23.0, listed in merge order.

### PR #77 - HubScene, taken apart

- The Hub's oversized scene is decomposed into five focused game/hub modules. This is foundation work: what a child sees and does on the board is unchanged, but the code is smaller and easier to keep healthy.

### PR #78 - The test suite stops watching the clock

- Tests no longer depend on the real wall clock, so results are reproducible instead of flaky at certain times of day. A reliability change with no effect on gameplay.

### PR #79 - The browser journey layer

- A new Playwright end-to-end suite plays the built app with real taps: boot, every game launch, rounds across the mechanic families, the sticker award, the parental gate, settings persistence across reload and an offline relaunch. It runs in CI, outside the fast phase gate. It found several defects invisible to the unit suite (including a held back button handing the child's first tap to the profile chip) — all fixed before this release.

### PR #80 - The save layer, made total

- Saving is now total: a blocked or partitioned browser store no longer throws. A session that cannot write keeps working in memory and persists on the next successful write, and the parental settings area states when storage is degraded. No saved data is lost and no storage key or schema changes.

### PR #81 - Toolchain pinned, markdown stops costing

- pnpm is pinned to 12.16.1 and Node 24 is declared in one place that both CI and the container read, with a guard that fails on drift. Documentation-only changes are classified so they no longer pay for the full code gate. Tooling change only — no runtime behavior.

### PR #82 - A strict Content-Security-Policy

- The app is now served with a strict Content-Security-Policy (no `unsafe-inline`, no `unsafe-eval`) plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and a `Permissions-Policy` denying device features the app never asks for. A validator asserts all four headers on every route class against the built image.

### PR #83 - An Overview for parents

- A new Overview in the parental area shows what is being played and whether it is working, drawn from the same on-device activity and accuracy data the app already keeps. It stays on the device — nothing is sent anywhere.

### PR #84 - Carry a save to another device

- Backup and restore: a parent can carry a save to another device and back, so a child's profiles and progress can move with the family.

### PR #85 - A crash card a child can tap

- If something goes wrong, the app now records the error, shows a gentle card a child can tap to carry on, and lets a parent hand the log over. Recovery stays calm and in the app rather than leaving a child stuck.

### PR #86 - Hub Game Groups

- The board can be filtered by learning domain, so a parent or child can browse the games by what they teach.

### PR #87 - Robot Path, the 23rd game

- **Robot Path joins as the 23rd game**, adding a new playable activity to the Hub board and its own sticker.

### PR #88 - Fix-It Machine, the 24th game

- **Fix-It Machine joins as the 24th game** — the suite's first debugging game, giving children a playful first taste of finding and fixing what is broken.

### PR #89 - Looks, not scores

- A follow-up to Fix-It Machine: a debugging tap is recorded as a stored "look", and those looks are **never scored**. The game rewards noticing, not getting a number right.

### PR #90 - Product intent and the Phase 3 gate

- The product-intent decisions are recorded in `docs/product-intent.md`, and prepared (not submitted) privacy artifacts are in place — there is no store listing or store submission. The project now ships an MIT `LICENSE`. The old background music, whose rights could not be traced, is replaced with the CC0-licensed "Calm Loop" by wipics (OpenGameArt), recorded in [audio-attribution.md](audio-attribution.md).

## Installation

Nothing to install by hand: the release is the PWA shell plus its content-addressed chunks, served from the live URL after the tag deploy; offline play uses the precached entries from the first visit. The storage changes across these tracks are additive and guarded, so existing profiles, stickers and play-time carry over — no manual save migration is required.

## Release Verification

- Full gate: the configured `verify_phase` gate runs on this release state before merge — lint, typecheck, unit tests, coverage, production build, the bundle and PWA validators, and the docs validator.
- Docs: `node scripts/validate-docs.js` green on the release commit — the release-note index is complete, every relative link and anchor resolves, the three game lists agree with the registry (now 24 games, including Robot Path and Fix-It Machine), and the count-drift guard is satisfied.
- Security: `node scripts/validate-headers.js` asserts the strict Content-Security-Policy and its three companion headers against the built image.
- Save schema: additive and guarded changes only; existing saves carry over (see PRs #80 and #84).
- Device matrix: **SKIPPED — accepted gap** (see Known Issues). CI and the tag-deploy smoke re-confirm every automated figure above on the release commit.

## Known Issues

The full list of known issues lives in the README's Known Issues section, and the planned work lives in [conductor/product.md §10](../conductor/product.md#10-roadmap) — nothing below duplicates either.

- Device-class pass — **SKIPPED, accepted gap.** As in v1.22.0 and v1.23.0, this release deliberately skips the real-device PWA pass (install prompt, landscape lock, offline reload and first-tap audio) because the change surface is covered by the automated gates and the browser journey layer. The manual rows in [device-testing-checklist.md](device-testing-checklist.md) remain the checklist to run before any player-facing claim about this version, and the release process and sign-off record live in [release-checklist.md](release-checklist.md).
- No new known issues are filed by these tracks: the two new games ride the existing mechanics, and the reliability, parent-tool and legal changes are additive or behavior-preserving.

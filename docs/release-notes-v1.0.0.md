# Release v1.0.0

**Released:** 2026-08-02 · **Tag:** `v1.0.0` · **Live:** https://aby-little-lab.ansyar-world.top/

## What's New

- **7 mini-games** for preschoolers (ages 3–5):
  1. Shape Sorter — drag shapes to matching cut-out slots
  2. Animal Trace-and-Connect — trace dotted paths from animal to food
  3. Pop & Freeze! — pop bubbles, avoid waking the sleeping animals
  4. Shadow Match — match colored objects to dark silhouettes
  5. Musical Memory — repeat growing frog-note sequences
  6. Big vs. Small Cleaner — sort toys by size
  7. Pattern Builder — tap the missing shape to complete patterns (ABAB/AABB/ABB)
- **Professor Hoot mascot** — cheers, nods, and celebrates alongside every game
- **Sticker collection** — a unique sticker per game, persisted across sessions
- **PWA** — installable, fully offline after first visit, landscape-optimized for tablets and phones
- **Ad-free & distraction-free** — zero text dependency, synthesized SFX, optional gentle BGM
- **Parental lock** — 3-second hold gates settings and exit
- **CI/CD pipeline** — quality gates + auto-deploy via Coolify on every green `master` push

## Improvements

- Touch targets ≥ 96×96px with inflated collision bounds
- Replay variety: items, shapes, and animals shuffle every playthrough
- Reduced-motion support throughout (respects `prefers-reduced-motion`)
- Per-game juice: lift, snap, stamp, hop, droplet, and ripple reactions
- 1024×768 responsive scaling with letterboxing on any screen

## Bug Fixes

- N/A — first release. All prior feature tracks shipped complete.

## Known Issues

- Physical-device verification (PWA install, offline, performance metrics) is pending execution of `docs/device-testing-checklist.md` against the live URL.
- Large main bundle (~1.47 MB / 377 KB gzip) — informational; code-splitting is a candidate for a future release.

## Installation

1. Visit https://aby-little-lab.ansyar-world.top/
2. Tap "Add to Home Screen" (iOS Safari) or the install icon (Android/Chrome)
3. Enjoy — works fully offline after first load!

## Feedback

Please report issues at https://github.com/mansyar/aby-little-lab/issues

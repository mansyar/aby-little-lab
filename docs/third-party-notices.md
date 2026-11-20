# Third-Party Notices — Aby's Little Lab

## Overview

This document lists the third-party components shipped with or used to build
Aby's Little Lab, together with the license each carries. The project's own
source code is covered by the MIT `LICENSE` at the repository root; third-party
components keep their own licenses and are not re-licensed by that `LICENSE`.
This is a prepared artifact for a full public-release posture, not a submission:
no store listing exists or is committed, and the app's audience is family-only.

The license names below are taken from the installed packages' own metadata.

## Runtime components (shipped in the app)

| Component | Declared version | License | Role |
| --- | --- | --- | --- |
| `phaser` | `^4.2.1` | MIT | Game engine — scenes, input, physics, SVG rasterization and audio glue |
| `workbox-window` | `^7.4.1` | MIT | Runtime client for the service worker generated at build time |

## Build and development components (not shipped to players)

| Component | Declared version | License | Role |
| --- | --- | --- | --- |
| `@biomejs/biome` | `^2.6.3` | MIT OR Apache-2.0 | Linter and formatter |
| `@playwright/test` | `1.64.1` | Apache-2.0 | Browser journey tests |
| `@vitest/coverage-v8` | `^5.0.5` | MIT | Coverage provider |
| `happy-dom` | `^21.0.4` | MIT | DOM environment for unit tests |
| `playwright-core` | `^1.64.1` | Apache-2.0 | Boot smoke-check driver |
| `typescript` | `^7.0.2` | Apache-2.0 | Type checking |
| `vite` | `^8.3.5` | MIT | Build tool and dev server |
| `vite-plugin-pwa` | `^2.0.0` | MIT | Generates the service worker and manifest and precaches assets |
| `vitest` | `^5.0.5` | MIT | Unit test runner |

## Bundled assets

| Asset | License | Notes |
| --- | --- | --- |
| SVG artwork under `src/assets/svg/` | Original to this project | Authored in-repo; covered by this project's MIT `LICENSE` |
| `public/fonts/baloo2-latin.woff2` (Baloo 2) | SIL Open Font License 1.1 (upstream Baloo 2) | The upstream OFL text now ships at `../public/fonts/OFL.txt` |
| `public/audio/bgm.mp3` | CC0 1.0 Universal | "Calm Loop" by wipics; the untraceable loop was replaced at this same path with a CC0-licensed one on 2026-11-20. See [audio attribution](audio-attribution.md) |

## Components that are not present

No analytics SDK, advertising SDK, crash reporter, telemetry library, account
service or cloud-sync client is bundled. The app makes no network calls of its
own; speech runs on the device through the browser Web Speech API, and all game
data stays in the browser's local storage.

## Related documents

- [Audio attribution](audio-attribution.md) — shipped audio inventory and BGM investigation.
- [Child privacy statement](child-privacy.md) — what data the app handles.
- [Store privacy labels](store-privacy-labels.md) — prepared, not submitted.

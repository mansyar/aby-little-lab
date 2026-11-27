# Add a parent Help overlay explaining controls, data, backup, and play-time

## Overview

Add a parent-gated **Help overlay** inside Settings. A header button opens a static, offline-capable library of eight concise topic cards explaining parental controls, profiles and play-time, Progress and adaptive difficulty, local-only data, backup/restore, diagnostics, install/offline use, and updates.

Help is explanatory only: it does not change settings, alter saved data, open files, or navigate to external pages.

## Problem / Motivation

Parent-facing behavior is spread across Settings, Backup & restore, Progress, the Install row, and Hub update toasts. Parents currently have no single place to learn:

- Why the three-second parental hold exists
- How profiles and daily play-time limits work
- What Progress and adaptive difficulty do—and do not—measure
- Where child data is stored
- How Merge differs from Replace
- What diagnostics contain and when they are downloaded
- How offline play and prompt-based updates work

That gap increases the chance of accidental destructive choices and false expectations about privacy, adaptation, and updates.

## Goals and Success Metrics

- **Goal:** Let a parent open Help from Settings and reach any of the eight topics in at most two taps.
- **Coverage:** All eight topics are present, readable, and navigable.
- **Truth:** Key behavioral claims are pinned by tests and checked against the shipped implementation.
- **Safety:** Help performs no writes, downloads, network requests, or settings changes.
- **Quality:** The exact configured verification gate, browser journey, and narrow-viewport visual inspection pass.

## Scope

### In Scope

- A parent-facing **Help** button in the persistent Settings header, available on both Settings and Backup pages.
- A dedicated 480×760 overlay using the existing Settings palette, lifecycle buckets, backdrop dismissal, and explicit close control.
- A topic menu with eight cards in a 2×4 grid.
- One concise detail card per topic, with **Back to topics**, **Previous**, **Next**, and **Close**.
- Static help content separated from rendering code.
- Unit/component tests, browser-journey coverage, E2E state publication, and visual media.
- PRD, TDD, changelog, README, and device-checklist truth updates.

### Out of Scope

- Action shortcuts or deep links into Settings, Backup, Progress, or external documentation.
- Search, favorites, feedback, analytics, or personalized help.
- Hosted content, runtime fetching, or a new network dependency.
- Localization or translated content.
- Child-facing Help, narration, or gameplay changes.
- New storage fields, schema migrations, dependencies, art, audio, or file-download behavior.
- Changes to existing Settings row positions, Backup behavior, Progress behavior, install behavior, or voice controls.
- Claims that physical-device testing or retention validation has been performed.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Settings shows a **Help** header button on both pages. It inherits the existing Settings parental gate, has a 96×96 logical-pixel hit area, and leaves all eight page-one rows and the Backup page unchanged. | must |
| FR-2 | Help opens above Settings. Its backdrop and ✕ close only Help and reveal the same Settings page. Closing Settings destroys Help completely. Repeated open/close cycles leave no duplicate objects or listeners. | must |
| FR-3 | The Help menu shows exactly eight stable topics in a 2×4 grid. Each card has a 96×96 hit area and opens its matching detail card. Detail navigation supports Previous, Next, and Back to topics without out-of-range pages or stale hit areas. | must |
| FR-4 | The **Parental lock** topic explains the continuous three-second hold, which controls it gates, and that Help itself lives behind Settings rather than requiring a second hold. | must |
| FR-5 | The **Profiles & play-time** topic explains up to four local profiles, per-profile stickers/progress/play time, the Off/15/30/45/60-minute limits, visible-game-time accounting, finishing the current game at the cap, and local-day reset. | must |
| FR-6 | The **Progress & adaptive difficulty** topic explains plays/wins/accuracy/three-win mastery, the 22-of-24 adaptive scope, the rolling ten-tap window, six-tap floor, ≥90% upward and <50% downward thresholds, once-per-playthrough changes, and that the Overview is a current snapshot rather than longitudinal history. | must |
| FR-7 | The **Privacy & local data** topic states that gameplay data stays in browser local storage; there are no accounts, sign-in, cloud sync, ads, analytics, names, contact details, location, photos, or voice recordings; speech is produced on-device. It distinguishes loading/updating the app from transmitting gameplay data. | must |
| FR-8 | The **Backup & restore** topic explains the JSON whole-save backup, keeping the file safe, Merge preserving device settings while combining progress, Replace overwriting the whole save, checksum detecting accidental corruption rather than tampering, and reload after a successful restore. | must |
| FR-9 | The **Diagnostics** topic explains that a text file is downloaded only when crashes exist; it may contain app version, export time, user agent, viewport, profile count, play-time state, storage status, and newest-first crash details. Nothing is uploaded automatically, and parents should review the file before sharing. | must |
| FR-10 | The **Install & offline** topic explains the context-aware Install row, iOS Share → Add to Home Screen, offline play after the first successful load, and that clearing site data can remove both the local save and cached app files. | must |
| FR-11 | The **Updates** topic explains the version shown in Settings and the Hub’s prompt-based **Update now / Later** choice: accepting activates and reloads; Later keeps the current version; the cached version remains playable offline. | must |
| FR-12 | Every topic renders as one concise card with wrapped text, a clear title, and no scrolling. Copy must fit the panel without clipping or overlapping controls at the fixed 1024×768 canvas size and under narrow-viewport scaling. | must |
| FR-13 | Help is read-only. Opening topics, paging, or closing performs no storage mutation, settings change, file download, audio playback, network request, or external navigation. | must |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | All content ships in the app and works offline. No dependency, asset, schema, storage, migration, or network change. |
| NFR-2 | Parent-facing accessibility follows existing conventions: 96×96 primary targets, readable Baloo 2 text, existing palette/contrast, `centredHitArea`, press feedback honoring reduced motion, and pinch zoom remaining available while Settings is open. |
| NFR-3 | Content and rendering are separated. Topic IDs are stable and unique; copy is not duplicated across components or tests beyond intentional truth assertions. New production modules stay within module-size limits without new warnings. |
| NFR-4 | Existing Settings, Backup, Progress, Profiles, Install, Voice, Reset, and Hub behavior remains unchanged. The shell stays within the existing bundle budget. |
| NFR-5 | Content, navigation, lifecycle, and read-only behavior are covered by focused tests; a real browser journey opens every topic; desktop and narrow-viewport media are inspected; the exact configured gate passes. |
| NFR-6 | Help introduces no new browser-global, file, network, or storage seam and makes no legal, medical, educational-outcome, or hardware-validation claim. |

## Acceptance Criteria

| ID | Criterion | Verifies |
|---|---|---|
| AC-1 | After the existing parental hold, the Help header button opens the overlay from either Settings page. The eight Settings rows retain their exact positions and behavior. | FR-1 |
| AC-2 | ✕ and backdrop close Help to the same underlying page. Closing Settings removes Help. Repeated cycles create no stale or duplicate interactive objects. | FR-2 |
| AC-3 | The menu exposes exactly the eight approved topic IDs in order; every card opens the correct detail title and content. | FR-3 |
| AC-4 | Parental-lock, profile, and play-time copy matches shipped behavior, including the three-second hold, four-profile cap, available limits, visible-time accounting, finish-current-game behavior, and local-day reset. | FR-4, FR-5 |
| AC-5 | Progress/adaptive copy correctly states 22 adaptive games, ten retained taps, six-tap minimum, 90%/50% thresholds, once-per-playthrough changes, and snapshot—not history—semantics. | FR-6 |
| AC-6 | Privacy copy makes no account, cloud-sync, analytics, advertising, recording, or gameplay-data transmission claim and does not misleadingly claim the app never loads assets from its host. | FR-7 |
| AC-7 | Backup copy clearly distinguishes Merge from Replace, describes whole-save JSON backup and checksum limitations, and states that successful restore reloads. | FR-8 |
| AC-8 | Diagnostics, install/offline, and update copy matches the implemented download, cache, install-row, version, and Update now/Later behavior. | FR-9, FR-10, FR-11 |
| AC-9 | All topics are reachable through Previous/Next and Back to topics. First/last boundaries expose no active control that can leave the valid range. | FR-3, FR-12 |
| AC-10 | Every card fits without clipped or overlapping text at 1024×768 and in inspected 844×390 mobile-landscape media. Primary controls retain 96×96 logical hit areas. | FR-12, NFR-2 |
| AC-11 | Tests observe no storage writes, settings mutations, downloads, audio calls, network requests, or external navigation from Help interactions. | FR-13, NFR-6 |
| AC-12 | Content tests, component tests, the new browser journey in Chromium/WebKit/Firefox/mobile Chromium, the exact configured gate, docs validation, bundle guard, and module-size guard pass. | NFR-3, NFR-4, NFR-5 |
| AC-13 | PRD, TDD, changelog, README, and the device checklist describe the shipped Help surface without changing historical release claims. | FR-4–FR-11, NFR-5 |

## Edge Cases

- Help opened from Settings page 2 returns to Backup when closed.
- Rapid repeated taps do not create multiple overlays or listeners.
- Previous on the first topic and Next on the last topic do nothing and publish no active hit point.
- Another overlay cannot be reached through Help; the shared overlay lifecycle remains deterministic.
- Persistence-degraded mode does not prevent Help from opening or alter its static content.
- Reduced motion disables new press animation without removing feedback or controls.
- Narrow viewports scale the fixed canvas without cropping the panel.
- No crashes means Diagnostics explains that no file is written; Help does not trigger a download.
- Offline use shows the same static Help content.

## Dependencies

- **Tracks:** none
- **External:** none

## Assumptions

- English-only, static copy ships with the app.
- Help is parent-facing text; the child-facing textless gameplay stance is unchanged.
- The existing Settings parental gate is sufficient; no second gate is added.

## References

- `conductor/roadmap.md` — RM-7
- `docs/PRD.md` §§1.4, 4.5–4.10, 5.2–5.5
- `docs/TDD.md` §§5.5, 5.7, 6.7–6.8, 7.3
- `docs/child-privacy.md`
- `src/components/SettingsPanel.ts`
- `src/components/settings/{ProgressOverlay,ProfilesOverlay,BackupPanel,InstallRow,VoiceRow,primitives}.ts`
- `src/utils/{backupFile,backupFormat,diagnostics,pwaBridge,pwaInstall}.ts`
- `src/game/{adaptiveLogic,e2eBridgeTypes}.ts` and `src/game/hub/hubE2E.ts`

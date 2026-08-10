# Release Notes - v1.14.1

> **Status:** DRAFT - in preparation (target tag `v1.14.1`).

## Bug Fixes

- **Learning Progress overlay row collision.** In the parent Settings -> Progress report, game rows were pitched 40px apart with 8 rows per page, so each row's stats line ("0 plays / accuracy / last played") collided with the next row's game name. Rows are now pitched 56px apart and pages show 6 rows, so the report is cleanly readable: pages are now 6 + 6 + 5 across all 17 games (previously 8 + 8 + 1). All 17 games remain reachable with the same "More" / "Back" wrap-around navigation. Regression tests added and full suite green.

## Known Issues

- Learning progress and play-time budgets are stored per device per profile - they do not sync across devices (accepted; cloud sync is out of scope).
- Letter and numeral artwork uses the system font (per product decision), so glyph rendering varies slightly across devices (accepted).

## Installation

The game is a PWA - update by reopening the app or triggering an update from the install/update prompt. All progress, stickers, profiles, and play-time settings are stored locally on the device.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).

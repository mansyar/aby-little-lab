# Track: Replay Variety Expansion

## Overview

Expand the item pools of the four content-driven games so every playthrough feels fresh, while keeping all tested mechanics, round sizes, difficulty, and UX rules untouched. New assets follow the PRD's AI-generated SVG pipeline and storybook visual rules.

## Scope

| Game | Pool change | Round size (unchanged) |
|---|---|---|
| Shape Sorter | +2 shapes (**heart**, **crescent**) → 6 total | 3 of 6 |
| Animal Trace | +2 pairs (**elephant→peanut**, **pig→apple**) → 6 pairs | 3 of 6 |
| Shadow Match | +2 objects (**airplane**, **mushroom**) → 8 objects | 6 of 8 |
| Big vs. Small | +2 toys (**toy_rocket**, **toy_drum**) → 6 toy types | 3 of 6 |
| Pop & Freeze | Sleeping decoy pool gains the 2 new animals (reuses Animal Trace sprites) | 5 bubbles, 1–2 decoys |

## New Assets (14 SVGs, 512×512 viewBox, storybook flat style)

- `shapes/shape_heart.svg`, `shapes/cutout_heart.svg`, `shapes/shape_crescent.svg`, `shapes/cutout_crescent.svg`
- `animals/elephant.svg`, `animals/pig.svg`, `items/peanut.svg`, `items/apple.svg`
- `items/airplane.svg`, `items/mushroom.svg`, `shadows/shadow_airplane.svg`, `shadows/shadow_mushroom.svg` (derived from object paths, `#2D3748` fill)
- `toys/toy_rocket.svg`, `toys/toy_drum.svg`

New shape colors: heart `#E53E3E`, crescent `#ECC94B` (existing palette tokens; distinct from current circle orange / square purple / triangle teal / star pink). New toy colors: rocket `#3182CE`, drum `#ECC94B` (distinct from teddy golden-brown / car coral / ball teal / block purple).

## Functional Requirements

1. **Shape Sorter** — `ShapeType` gains `"heart" | "crescent"`; `ALL_SHAPES` = 6; selection stays 3 per round via existing Fisher-Yates selection.
2. **Animal Trace** — `PAIRS` gains elephant→peanut and pig→apple; selection stays 3 of 6. Dotted-path generation must work identically for new pairs (same curve logic, no special-casing).
3. **Shadow Match** — `ObjectType` gains `"airplane" | "mushroom"`; `ALL_OBJECTS` = 8; round selects 6 randomly (previously 6 of 6 — this is the only selection-behavior change). Layout code stays 6-slot; no layout changes.
4. **Big vs. Small** — `ToyType` gains `"rocket" | "drum"`; `ALL_TOYS` = 6; selection stays 3 of 6. New toys load `toys/toy_rocket.svg`, `toys/toy_drum.svg`.
5. **Pop & Freeze** — `ALL_ANIMALS` (decoy pool) gains `"elephant" | "pig"`; scene must preload the new animal SVGs for decoy rendering.
6. **PreloadScene** — Loads all 14 new assets (rasterized at 512×512 like the rest).
7. **Stickers** — Unchanged. Still 6 stickers, one per game. No new sticker art.
8. **Docs** — Update `docs/PRD.md` (SVG requirements, item/color tables per game), `docs/TDD.md` (asset manifest), `conductor/tech-stack.md` (project structure/asset notes), `README.md`.

## Non-Functional Requirements

- **Visual consistency:** New SVGs match existing assets — flat fills, thick `#2D3748` outlines (4–6px at 512px), no gradients, no pure RGB primaries, instantly recognizable by a 3-year-old.
- **Color-independent design:** New items differ by silhouette, not color alone (critical for new Shadow Match objects and Shape Sorter shapes).
- **No gameplay-rule changes:** Difficulty, feedback, juice, reduced-motion behavior, mascot reactions, and win/sticker flow are untouched.
- **Performance:** No new runtime overhead beyond 14 small SVGs; asset rasterization matches current pipeline.
- **Quality gates:** All existing + new tests pass; coverage remains >80% on modified logic modules; Biome clean; production build succeeds.

## Acceptance Criteria

1. All four games' logic pools include the new items; selection functions return the correct round size with only valid types.
2. Playthroughs can show new items (verified via unit tests + manual play).
3. Shadow Match never renders more than 6 objects per round and always exactly 6.
4. Pop & Freeze decoys can be any of the 6 animals.
5. All 14 SVGs load in PreloadScene with no 404s; all scenes render correctly.
6. Sticker behavior, parental lock, mascot, transitions, reduced-motion, and audio are fully regressed (existing 555 tests pass).
7. Docs updated.

## Out of Scope

- Musical Memory and its frog-note set (fixed C4/E4/G4 by design).
- Difficulty progression, timers, or scoring (PRD: difficulty stays fixed).
- New stickers, new games, new mechanics, new SFX, or new BGM.
- Hub redesign, settings changes, or release/deployment work.

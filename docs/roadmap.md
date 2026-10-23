# Aby's Little Lab — Known Issues and Roadmap

This document is the single home for two things: what is known to be broken in
Aby's Little Lab, and what is planned next. Nothing else in `docs/` keeps a
second copy of either list — other documents link here instead.

Every entry below was checked against the code on 2026-10-22. Where an entry
names a file, that file is where the debt lives; where it names a symptom, that
is what a reader would actually see.

## Known Issues

### Three games hand-roll their drag scaffolding

`src/scenes/ShapeSorterScene.ts`, `src/scenes/ShadowMatchScene.ts` and
`src/scenes/BigSmallScene.ts` build their own drag behaviour from the
`dragJuice` helpers instead of using the shared board in
`src/game/dragBoard.ts`. Only `NumberOrderScene` and `StoryOrderScene` use
`DragBoard`. A reader notices it by searching `src/scenes/` for `DragBoard` and
finding two of the five drag games.

### The stored payload carries no schema version

`src/utils/storage.ts` writes the v2 payload without a `schemaVersion` field,
and `src/types/index.ts` still exports the legacy `AppStorage` type alongside
the v2 types. A reader notices it by searching the storage module for
`schemaVersion` and finding nothing, then wondering how a future format change
would be recognised.

### The install prompt can disappear

`src/components/SettingsPanel.ts` builds its install tracker with
`createInstallTracker` every time the panel opens, so a `beforeinstallprompt`
that fired before the panel opened is never seen and the install row falls back
to the iOS how-to (or to nothing). A reader notices it by installing the app
from a fresh tab, waiting for the prompt to fire, and then opening Settings
too late to see the "Install App" row.

### A failed game-chunk load leaves the child with no feedback

`src/scenes/HubScene.ts` launches a game with `ensureSceneLoaded(...).then(...)`
and no error path, and `src/scenes/sceneRegistry.ts` does not catch a rejected
dynamic import. A tile tap on a failed chunk fetch therefore does nothing
visible and the promise rejection goes unhandled. A reader notices it by
throttling the network until a chunk request fails, then tapping a tile and
watching the Hub do nothing.

### Five copies of the same shuffle, and an RNG seam in only two modules

The `shuffle` helper is byte-identical in `src/game/bigSmallLogic.ts`,
`src/game/animalTraceLogic.ts`, `src/game/popFreezeLogic.ts`,
`src/game/shapeSorterLogic.ts` and `src/game/shadowMatchLogic.ts`, and only
`src/game/feelingsFacesLogic.ts` and `src/game/storyOrderLogic.ts` accept an
injected RNG. That leaves 19 of the 21 per-game logic modules testable only
through `Math.random`. A reader notices it by searching `src/game/` for
`export function shuffle` and finding five definitions.

### Repository hygiene

A stray `test-out.txt` sits at the repository root; 110 PNGs under
`docs/svg-contact-sheets/` are tracked, even though `.gitignore` describes the
regenerated sheets as scratch — its rule `docs/svg-contact-sheets/*.png` matches
only the twelve PNGs at the root of that folder, and gitignore's `*` does not
cross `/`, so the eleven sheets in each of the ten subfolders stay tracked; the
comment that calls the regenerated sheets scratch is in `.gitignore` itself, not
in the sheets. 122 HTML contact sheets are tracked beside them, and `.opencode/`
(two agent files) is tracked without any ignore rule. A reader notices it by
running `git ls-files docs/svg-contact-sheets .opencode` and getting a hundred
and ten PNGs back.

## Future Work / Roadmap

The same material, ordered by how much each item would improve the product.
The track named against each item is the track that would deliver it.

1. **Move the three hand-rolled drag games onto the shared board.** Shape
   Sorter, Shadow Match and Big & Small each reimplement lift, drop-zone
   highlight and snap, which means the shared board's swap and tap-withdraw
   behaviour reaches only two of the five drag games. Track:
   *drag-board-consolidation*.
2. **Version the stored payload.** A `schemaVersion` field would let a future
   format change be recognised instead of inferred, and would give the legacy
   `AppStorage` type somewhere to be retired to. Track: *storage-schema-version*.
5. **Keep the install prompt alive for the life of the app.** Building the
   tracker once, at boot, would mean an install prompt offered at the first
   visit is still offered at the tenth. Track: *install-prompt-scope*.
6. **Give a failed chunk load a visible failure path.** A tap that cannot open
   a game should say so — a child needs to know the tap was heard. Track:
   *scene-load-failure-path*.
3. **Bank play time as it is earned.** Writing the visible minutes as they
   accrue would survive an app that is killed, and would stop a short session
   from banking nothing. Track: *play-time-banking*.
4. **One shuffle, one RNG seam.** A single shared shuffle helper and an
   injectable RNG across the logic modules would let the remaining 19
   per-game modules be tested without stubbing `Math.random`. Track:
   *shared-random-helpers*.
5. **Clean up the repository.** The stray root file, the tracked contact-sheet
   PNGs and the tracked `.opencode/` directory all make the working tree
   noisier than it needs to be. Track: *repo-hygiene*.

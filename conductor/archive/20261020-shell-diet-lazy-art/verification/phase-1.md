# Phase 1 — Art group modules and idempotent registry

- **Track:** `20261020-shell-diet-lazy-art` — Shell Diet: Per-Game Lazy Art Chunks
- **Phase:** 1 of 5
- **Date:** 2026-10-20
- **Branch:** `refactor/20261020-shell-diet-lazy-art`
- **Base:** `09a12bcaabd913a14437febb9ee7bf64b2649caf`
- **Head:** `4423b1117f2c09e5d803aa9a90ce15ff8d6ea9fb` (squashed phase commit)
- **Result:** verified (rework attempt 1 of 2 fixed one lifecycle defect)

## Summary

`src/game/art/` now holds the whole game-art inventory outside the boot shell:
an `ArtGroup`/`ArtAsset` contract, twelve statically importable group tables
(131 entries, 125 distinct keys that leave the shell, six avatar keys that the
shell keeps as well), and `preloadArtGroups(scene, groups)`, which registers
only keys the TextureManager does not already hold, at `textureSizeFor(key)`,
and releases in-flight guards per file and per owning scene so repeated,
concurrent, interrupted and retried calls rasterize each key at most once.

### Rework: scene shutdown released nothing

Primary verification found that the guard was released only on `filecomplete`
and `loaderror`. Phaser emits no `loaderror` for files still in flight when a
scene shuts down, so a child tapping Back during a cold first load stranded
those keys in the module-local set. Every later visit to that game skipped them
and rendered missing textures for the rest of the session.

Fix (`c83ea3c`): the guard now records `key → owning scene` and each scene keeps
the set of keys it still has in flight. A scene's `shutdown` event releases
exactly those keys and detaches that loader's `filecomplete`/`loaderror`/
`shutdown` listeners, so a restarted scene re-attaches cleanly. Keys already
delivered to the TextureManager were released on `filecomplete` and stay
satisfied through `textures.exists`, which is also what keeps `mascot_idle`
working as a word prompt. Public API is unchanged, and the previous guarantees
(already-present key skipped, in-flight key not queued twice, failed key
retryable) still hold.

The failing-first tests were written before the fix and failed against the old
registry; after it, `preloadArtGroups.test.ts` passes 9/9 and the full suite
2,223 tests. The test `afterEach` cleanup now emits `shutdown` (the product's own
release path) instead of forging `loaderror` events for loads it left in flight.

Nothing imports the package yet, so shipped behaviour is unchanged: the shell
entry is still `195.4 kB` (`index-Dhenc0xK.js`), byte-identical in size to the
pre-phase baseline, and `PreloadScene.ts` was not touched.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| Lint/format | `pnpm check` | 0 | 223 files checked; 2 errors fixed during development; final run reports only the pre-existing `noNonNullAssertion` warning in `src/__tests__/scenes/musicalMemoryScene.test.ts` and the pre-existing Biome schema-version info |
| Types | `pnpm typecheck` | 0 | `tsc --noEmit`, no diagnostics |
| Unit tests | `pnpm test -- --run` | 0 | 105 files, 2,223 tests passed (2 new shutdown-lifecycle tests) |
| Coverage | `pnpm test:coverage` | 0 | Statements 98.12%, branches 90.54%, functions 98.15%, lines 98.97% — all above the 90/85/88/95 gate |
| Gate (as briefed) | `pnpm check && pnpm typecheck && pnpm test -- --run && pnpm test:coverage` | 0 | Whole chain green |
| Supplementary | `pnpm build` | 0 | 301 modules; shell entry `index-Dhenc0xK.js` 200.12 kB (195.4 KiB); no art chunk emitted because nothing imports the groups yet |
| Supplementary | `node scripts/validate-bundle.js` | 0 | `PASS: shell entry index-Dhenc0xK.js = 195.4 kB (<= 200 kB)`; single Phaser vendor chunk (1342.6 kB) |

## Acceptance criteria

| AC | Statement | Proving tests (file → test name) |
| --- | --- | --- |
| AC-2 | A unit test proves the groups are key-unique, non-empty, with no cross-group duplicates | `src/__tests__/game/art/groupIntegrity.test.ts` → `art group inventory > exposes the twelve groups with their documented key counts`; `> holds non-empty SVG markup for every asset`; `> uses well-formed keys, unique within each group`; `> assigns every key to exactly one group`; `> leaves exactly the 53 shell keys outside the groups, for 178 in total`; `> is a frozen table, so a scene cannot mutate another game's art` |
| AC-3 | Repeated and concurrent calls rasterize each key once, at its tier size | `src/__tests__/game/art/preloadArtGroups.test.ts` → `preloadArtGroups > registers each key once, at that key's texture tier`; `> is a no-op when a second call follows a completed load`; `> registers a key once when two scenes queue it before the load completes`; `> registers a key once when the same scene queues it twice mid-flight`; `> releases in-flight keys when the owning scene shuts down, so the next scene can register them`; `> keeps delivered art satisfied when the owning scene shuts down`; `> releases a key when its file completes, so another scene can register it`; `> releases a failed key so a later call can retry it`; `> skips a key the TextureManager already holds` |

The canonical total is asserted without reading `PreloadScene`: the integrity
suite spells out the 53 shell keys, asserts the group/shell overlap is exactly
the six avatars (`animal_cat`, `animal_dog`, `animal_pig`, `frog_red`,
`sm_duck`, `toy_teddy_bear`), and proves `new Set([...groupKeys, ...shellKeys]).size === 178`.

## Evidence paths

- `src/game/art/types.ts` — `ArtAsset`, `ArtGroupId`, `ArtGroup` contract
- `src/game/art/registry.ts` — `preloadArtGroups`, per-scene in-flight ownership, shutdown release
- `src/game/art/{shapes,cutouts,letters,numerals,animals,food,items,shadows,toys,faces,music,glyphs}.ts`
- `src/game/art/index.ts` — public surface
- `src/__tests__/game/art/groupIntegrity.test.ts` — AC-2
- `src/__tests__/game/art/preloadArtGroups.test.ts` — AC-3, including the shutdown-lifecycle pair
- `coverage/index.html`, `coverage/src/game/art/registry.ts.html` — registry at 97.36% statements / 90% branches / 100% functions / 100% lines
- Commits: `4423b11` (squashed phase commit: types + registry + twelve groups + tests + shutdown-release fix; the six task commits were squashed per `phase_squash`)

## Deviations

None. All changes stay inside `src/game/art/**` and `src/__tests__/game/art/**`;
`src/scenes/PreloadScene.ts` was read but not modified.

## Notes

- Group keys are copied verbatim from `SHAPE_ASSETS` with their original import
  paths, so filename/key mismatches survive intact (`food_*` keys still import
  `items/*.svg`, `toy_teddy_bear` still imports `toys/teddy_bear.svg`,
  `arrow_more` still imports `ui/arrow_up.svg`).
- The in-flight guard is module-local because the TextureManager is game-wide:
  two scenes queue into one cache. A key leaves the guard when its file lands
  (`filecomplete`), fails (`loaderror`), or its owning scene shuts down — the
  last of which Phaser's loader does not report as an error. Listeners are
  attached once per scene and detached on shutdown, so a restarted scene does
  not stack handlers.
- The two new tests are `releases in-flight keys when the owning scene shuts
  down, so the next scene can register them` and `keeps delivered art satisfied
  when the owning scene shuts down`; the second shares one texture set between
  two scenes, then asserts the delivered key is not re-registered while the 17
  stranded keys are.
- `registry.ts` line coverage is 100%; the one uncovered branch is the
  `owner === undefined` guard in `releaseKey`, reached only by a file settling
  after its scene already released the key. It stays as a harmless no-op.
- Group tables are `Object.freeze`d at both levels, so a scene cannot mutate
  another game's inventory.
- Coverage: module rows for `src/game/art/` are reported under `src/game/art`
  in the HTML report (`registry.ts` 100/100/100); the text reporter collapsed
  the directory into the totals shown above.
- Pre-existing, untouched: Biome reports a schema-version info (config pins
  2.5.5, CLI is 2.5.10) and a `noNonNullAssertion` warning in
  `src/__tests__/scenes/musicalMemoryScene.test.ts`.
- Phase 2 can build the shared loading cue on top of `preloadArtGroups`; phase 3
  wires groups into the 22 scenes; phase 4 shrinks `PreloadScene` to the 53-key
  shell set.

## Primary verification

- **Verified by:** primary agent (independent re-run, 2026-10-20)
- **Scope:** `git diff --name-only 09a12bc..HEAD` touched only `src/game/art/**`,
  `src/__tests__/game/art/**` and this evidence file. `src/scenes/**` untouched,
  confirmed by the file list rather than by report.
- **Command chain re-run from a clean tree:** `pnpm check` exit 0 (only the two
  pre-existing non-blocking diagnostics), `pnpm typecheck` exit 0,
  `pnpm test -- --run` exit 0 with 105 files / 2,223 tests, `pnpm test:coverage`
  exit 0 at statements 98.11%, branches 90.46%, functions 98.15%, lines 98.97%.
- **Defect found by this review:** the original `queuedKeys` set was released
  only on `filecomplete`/`loaderror`. Because Phaser's loader reports nothing for
  files in flight at scene shutdown, a child leaving a game mid-load would have
  stranded those keys permanently, and every later visit to that game would skip
  them. Rework attempt 1 (`c83ea3c`) fixed it with per-scene ownership and a
  `shutdown` release, plus two failing-first tests. Verified by inspection of
  `registry.ts` and by the two new tests named above.
- **Residual, accepted:** the `owner === undefined` branch in `releaseKey` is
  unreachable by design (a file settling after its scene already released it) and
  is kept as a no-op; `registry.ts` line coverage is 100%.

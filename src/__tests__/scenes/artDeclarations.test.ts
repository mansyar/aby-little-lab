import { describe, expect, it } from "vitest";
import adaptiveLogicSource from "../../game/adaptiveLogic.ts?raw";
import addItUpLogicSource from "../../game/addItUpLogic.ts?raw";
import alphabetLogicSource from "../../game/alphabetLogic.ts?raw";
import animalTraceLogicSource from "../../game/animalTraceLogic.ts?raw";
import { animals } from "../../game/art/animals";
import { cutouts } from "../../game/art/cutouts";
import { faces } from "../../game/art/faces";
import { food } from "../../game/art/food";
import { glyphs } from "../../game/art/glyphs";
import { items } from "../../game/art/items";
import { letters } from "../../game/art/letters";
import { music } from "../../game/art/music";
import { numerals } from "../../game/art/numerals";
import { shadows } from "../../game/art/shadows";
import { shapes } from "../../game/art/shapes";
import { toys } from "../../game/art/toys";
import type { ArtGroup, ArtGroupId } from "../../game/art/types";
import bigSmallLogicSource from "../../game/bigSmallLogic.ts?raw";
import colorMatchLogicSource from "../../game/colorMatchLogic.ts?raw";
import countLogicSource from "../../game/countLogic.ts?raw";
import decodeLogicSource from "../../game/decodeLogic.ts?raw";
import feelingsFacesLogicSource from "../../game/feelingsFacesLogic.ts?raw";
import firstSoundsLogicSource from "../../game/firstSoundsLogic.ts?raw";
import memoryMatchLogicSource from "../../game/memoryMatchLogic.ts?raw";
import moreLessLogicSource from "../../game/moreLessLogic.ts?raw";
import musicalMemoryLogicSource from "../../game/musicalMemoryLogic.ts?raw";
import numberOrderLogicSource from "../../game/numberOrderLogic.ts?raw";
import oddOneOutLogicSource from "../../game/oddOneOutLogic.ts?raw";
import patternBuilderLogicSource from "../../game/patternBuilderLogic.ts?raw";
import popFreezeLogicSource from "../../game/popFreezeLogic.ts?raw";
import shadowMatchLogicSource from "../../game/shadowMatchLogic.ts?raw";
import shapeSorterLogicSource from "../../game/shapeSorterLogic.ts?raw";
import storyOrderArtSource from "../../game/storyOrderArt.ts?raw";
import storyOrderLogicSource from "../../game/storyOrderLogic.ts?raw";
import takeAwayLogicSource from "../../game/takeAwayLogic.ts?raw";
import wordLogicSource from "../../game/wordLogic.ts?raw";
import preloadSceneSource from "../../scenes/PreloadScene.ts?raw";
import storyOrderSceneSource from "../../scenes/StoryOrderScene.ts?raw";

/** The one scene that owns its art through the story-order preloader instead. */
const STORY_ORDER_SCENE = "StoryOrderScene";

/** Every art group, by id — the single source of truth for key ownership. */
const GROUPS: readonly ArtGroup[] = [
  animals,
  cutouts,
  faces,
  food,
  glyphs,
  items,
  letters,
  music,
  numerals,
  shapes,
  shadows,
  toys,
];

/** Every key a group owns, mapped to its group. */
const KEY_OWNER: ReadonlyMap<string, ArtGroupId> = new Map(
  GROUPS.flatMap((group) =>
    group.assets.map((asset): [string, ArtGroupId] => [asset.key, group.id]),
  ),
);

/**
 * Every `prefix_` the groups imply, mapped to the group that owns it.
 *
 * Taken from the keys themselves so it cannot drift: `sm_shadow_house` yields
 * `sm_shadow_` (shadows) and `sm_house` yields `sm_` (items). Resolution always
 * picks the longest matching prefix, which is what keeps the two apart.
 */
const PREFIX_OWNER: ReadonlyMap<string, ArtGroupId> = (() => {
  const owners = new Map<string, ArtGroupId>();
  for (const group of GROUPS) {
    for (const asset of group.assets) {
      const cut = asset.key.lastIndexOf("_");
      if (cut <= 0) continue;
      owners.set(asset.key.slice(0, cut + 1), group.id);
    }
  }
  return owners;
})();

/**
 * Keys the boot shell ships, which no scene has to declare.
 *
 * `story_` is here because Story Order rasterizes its own panels through
 * `storyOrderArt`; the rest are the shell furniture a game may legitimately
 * name — a Hub tile icon, an earned sticker, a mascot pose, the replay glyph.
 */
const SHELL_PREFIXES: readonly string[] = ["mascot_", "sticker_", "story_", "tile_"];

/** Shell keys that carry no useful prefix. */
const SHELL_LITERALS: readonly string[] = ["icon_speaker"];

/** Longest literal that could still be a texture key. */
const MAX_KEY_LENGTH = 40;

/** Every texture key is lower snake case. */
const KEY_SHAPE = /^[a-z][a-z0-9_]*$/;

const QUOTED_LITERAL = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g;
const TEMPLATE_LITERAL = /`((?:[^`\\]|\\.)*)`/g;
const SCENE_GAME_IMPORT = /from "\.\.\/game\/([A-Za-z]+)"/g;
const LOCAL_GAME_IMPORT = /from "\.\/([A-Za-z]+)"/g;
const PRELOAD_ART_CALL = /this\.preloadArt\(\[([^\]]*)\]\)/;

/**
 * A call site that draws a bare key (one with no `_`, so no prefix identifies
 * it): `.image(x, y, "bubble")`, `textureSizeFor("bubble")`, and the two
 * helpers that take a key first.
 */
const BARE_DRAW_SITE =
  /(?:image|textureSizeFor|displayScale|createSymbol)\(\s*[^()]*$|operationCue:\s*$/;

/** How far back from a literal to look for the call that names it. */
const LOOKBACK = 120;

interface SceneSource {
  readonly name: string;
  readonly source: string;
}

/**
 * Every scene module under `src/scenes`, read as text.
 *
 * Discovered rather than hand-listed, so a scene added tomorrow is scanned the
 * day it lands instead of silently escaping the check until someone remembers
 * an import. The scan is a text scan because it looks at what a scene *names*,
 * not what it does at runtime — the point is to catch a scene that draws a key
 * it never declared, which no runtime test can see.
 */
const SCENE_SOURCES: Readonly<Record<string, string>> = import.meta.glob<string>(
  "../../scenes/*Scene.ts",
  { query: "?raw", import: "default", eager: true },
);

/**
 * Scenes that are not games: the boot shell, the menu, and the two shared
 * abstract bases (`ChoiceRoundScene`, `GroupMathScene`). Every other scene
 * must declare the art it draws.
 */
const NON_GAME_SCENES: readonly string[] = [
  "BootScene",
  "ChoiceRoundScene",
  "GroupMathScene",
  "HubScene",
  "PreloadScene",
];

/** `../../scenes/WordMatchScene.ts` → `WordMatchScene`. */
function sceneNameOf(path: string): string {
  const file = path.slice(path.lastIndexOf("/") + 1);
  return file.slice(0, -".ts".length);
}

/** The 22 game scenes, read as text. */
const SCENES: readonly SceneSource[] = Object.entries(SCENE_SOURCES)
  .map(([path, source]) => ({ name: sceneNameOf(path), source }))
  .filter((scene) => !NON_GAME_SCENES.includes(scene.name))
  .sort((a, b) => (a.name < b.name ? -1 : 1));

/**
 * Game modules a scene may draw a key from, by file name.
 *
 * A scene's texture keys often live in the rule module it owns (`countLogic`
 * names the eight counting pictures, `wordLogic` names the eighteen word
 * prompts), so the scan follows the scene's imports into `src/game` — and those
 * modules' own imports, because `addItUpLogic`, `takeAwayLogic` and
 * `moreLessLogic` all draw through `countLogic`, while `wordLogic` is shared by
 * four scenes.
 */
const GAME_MODULES: ReadonlyMap<string, string> = new Map([
  ["adaptiveLogic", adaptiveLogicSource],
  ["addItUpLogic", addItUpLogicSource],
  ["alphabetLogic", alphabetLogicSource],
  ["animalTraceLogic", animalTraceLogicSource],
  ["bigSmallLogic", bigSmallLogicSource],
  ["colorMatchLogic", colorMatchLogicSource],
  ["countLogic", countLogicSource],
  ["decodeLogic", decodeLogicSource],
  ["feelingsFacesLogic", feelingsFacesLogicSource],
  ["firstSoundsLogic", firstSoundsLogicSource],
  ["memoryMatchLogic", memoryMatchLogicSource],
  ["moreLessLogic", moreLessLogicSource],
  ["musicalMemoryLogic", musicalMemoryLogicSource],
  ["numberOrderLogic", numberOrderLogicSource],
  ["oddOneOutLogic", oddOneOutLogicSource],
  ["patternBuilderLogic", patternBuilderLogicSource],
  ["popFreezeLogic", popFreezeLogicSource],
  ["shadowMatchLogic", shadowMatchLogicSource],
  ["shapeSorterLogic", shapeSorterLogicSource],
  ["storyOrderArt", storyOrderArtSource],
  ["storyOrderLogic", storyOrderLogicSource],
  ["takeAwayLogic", takeAwayLogicSource],
  ["wordLogic", wordLogicSource],
]);

/**
 * Game modules a scene imports that carry interaction logic, not texture keys
 * (e.g. the shared ordered-drag-board shell). They draw nothing, so they stay
 * out of {@link GAME_MODULES} but must not fail the import scan either.
 */
const NON_ART_GAME_MODULES: readonly string[] = ["dragBoard"];

interface SourceLiteral {
  readonly value: string;
  /** Offset of the opening quote, used to tell a draw site from prose. */
  readonly at: number;
}

/** Drops comments so a doc line naming `shape_star` is not read as a draw. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/** Every quoted string and template head in `source`, in file order. */
function literalsIn(source: string): SourceLiteral[] {
  const literals: SourceLiteral[] = [];

  for (const match of source.matchAll(QUOTED_LITERAL)) {
    literals.push({ value: match[1] ?? match[2] ?? "", at: match.index });
  }

  for (const match of source.matchAll(TEMPLATE_LITERAL)) {
    const body = match[1] ?? "";
    // `letter_${letter}` is evidence for the `letter_` prefix, not a whole key.
    literals.push({ value: body.split("${")[0], at: match.index });
  }

  return literals;
}

/** True for a literal that could be (or start) a texture key. */
function isKeyShaped(value: string): boolean {
  return value.length > 0 && value.length <= MAX_KEY_LENGTH && KEY_SHAPE.test(value);
}

/** The group owning `value`, by exact key first and then by longest prefix. */
function groupFor(value: string): ArtGroupId | null {
  const exact = KEY_OWNER.get(value);
  if (exact !== undefined) return exact;

  let longest = "";
  for (const prefix of PREFIX_OWNER.keys()) {
    if (!value.startsWith(prefix)) continue;
    if (prefix.length > longest.length) longest = prefix;
  }
  return longest === "" ? null : (PREFIX_OWNER.get(longest) ?? null);
}

/** True when a bare key sits directly inside a call that draws it. */
function isDrawnBareKey(source: string, at: number): boolean {
  return BARE_DRAW_SITE.test(source.slice(Math.max(0, at - LOOKBACK), at));
}

/** The group a literal in `source` evidences, or null for shell/prose/unknown. */
function groupForLiteral(source: string, literal: SourceLiteral): ArtGroupId | null {
  if (!isKeyShaped(literal.value)) return null;

  const group = groupFor(literal.value);
  if (group === null) return null;

  // `"bubble"` and `"lilypad"` carry no prefix, so only a draw call proves they
  // are textures rather than, say, a word inside a spoken label.
  if (literal.value.includes("_")) return group;
  return isDrawnBareKey(source, literal.at) ? group : null;
}

/** Every group a single file draws a key from. */
function groupsInSource(source: string): Set<ArtGroupId> {
  const stripped = stripComments(source);
  const groups = new Set<ArtGroupId>();
  for (const literal of literalsIn(stripped)) {
    const group = groupForLiteral(stripped, literal);
    if (group !== null) groups.add(group);
  }
  return groups;
}

/** True when `value` is a shell key rather than a group key or prose. */
function isShellKey(value: string): boolean {
  if (!isKeyShaped(value) || groupFor(value) !== null) return false;
  if (SHELL_LITERALS.includes(value)) return true;
  return SHELL_PREFIXES.some((prefix) => value.startsWith(prefix));
}

/** Every game module a scene reaches, transitively, by file name. */
function gameModulesForScene(sceneSource: string): string[] {
  const reached = new Set<string>();
  const queue: string[] = [];

  for (const match of sceneSource.matchAll(SCENE_GAME_IMPORT)) queue.push(match[1]);

  while (queue.length > 0) {
    const name = queue.pop();
    if (name === undefined || reached.has(name)) continue;
    const source = GAME_MODULES.get(name);
    if (source === undefined) continue;
    reached.add(name);
    for (const match of source.matchAll(LOCAL_GAME_IMPORT)) queue.push(match[1]);
  }

  return [...reached].sort();
}

/** Every group a scene evidences in its own source or in the modules it owns. */
function drawnGroups(scene: SceneSource): Set<ArtGroupId> {
  const groups = groupsInSource(scene.source);
  for (const name of gameModulesForScene(scene.source)) {
    for (const group of groupsInSource(GAME_MODULES.get(name) ?? "")) groups.add(group);
  }
  return groups;
}

/** The groups a scene passes to `preloadArt`, or null when it declares none. */
function declaredGroups(sceneSource: string): string[] | null {
  const match = PRELOAD_ART_CALL.exec(sceneSource);
  if (match === null) return null;
  return match[1]
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Sorted ids, so failures read consistently. */
function sorted(ids: Iterable<string>): string[] {
  return [...ids].sort();
}

describe("game scene art declarations", () => {
  it("discovers all 22 game scenes, so a new one cannot escape the scan", () => {
    const discovered = Object.keys(SCENE_SOURCES).map(sceneNameOf);

    // The inventory itself is the tripwire: a 23rd game changes this number,
    // and its own declaration checks run in the same pass.
    expect(SCENES).toHaveLength(22);
    expect(new Set(SCENES.map((scene) => scene.name)).size).toBe(22);

    // Every exclusion is a scene the glob really found; a stale name here
    // would let a non-game module slip into the game-scene checks.
    expect(discovered).toHaveLength(SCENES.length + NON_GAME_SCENES.length);
    expect(discovered).toEqual(expect.arrayContaining([...NON_GAME_SCENES]));
  });

  it("reads every game module a scene imports", () => {
    const unknown = new Set<string>();
    for (const scene of SCENES) {
      for (const match of scene.source.matchAll(SCENE_GAME_IMPORT)) {
        if (NON_ART_GAME_MODULES.includes(match[1])) continue;
        if (!GAME_MODULES.has(match[1])) unknown.add(`${scene.name}: ${match[1]}`);
      }
    }
    expect(sorted(unknown)).toEqual([]);
  });

  it("declares art groups in every game scene but Story Order", () => {
    const without = SCENES.filter((scene) => declaredGroups(scene.source) === null).map(
      (scene) => scene.name,
    );
    expect(without).toEqual([STORY_ORDER_SCENE]);
  });

  it("keeps Story Order on its own preloader", () => {
    expect(storyOrderSceneSource).toContain("preloadStoryOrderArt(this)");
    expect(storyOrderSceneSource).not.toContain("this.preloadArt(");
  });

  describe.each(SCENES)("$name", (scene) => {
    it("draws only groups it declares", () => {
      const drawn: ReadonlySet<string> = drawnGroups(scene);
      const declared = declaredGroups(scene.source);
      if (declared === null) {
        expect(scene.name).toBe(STORY_ORDER_SCENE);
        return;
      }

      expect(sorted([...drawn].filter((group) => !declared.includes(group)))).toEqual([]);
    });

    it("declares only groups it draws", () => {
      const drawn: ReadonlySet<string> = drawnGroups(scene);
      const declared = declaredGroups(scene.source);
      if (declared === null) {
        expect(scene.name).toBe(STORY_ORDER_SCENE);
        return;
      }

      expect(sorted(declared.filter((group) => !drawn.has(group)))).toEqual([]);
    });
  });

  it("allowlists exactly the shell keys a game may name", () => {
    // The allowlist in full: four prefixes and one bare key, nothing looser.
    expect(SHELL_PREFIXES).toEqual(["mascot_", "sticker_", "story_", "tile_"]);
    expect(SHELL_LITERALS).toEqual(["icon_speaker"]);

    // A game group's key is never shell, and a near miss is not either.
    expect(isShellKey("letter_a")).toBe(false);
    expect(isShellKey("shape_")).toBe(false);
    expect(isShellKey("sm_shadow_house")).toBe(false);
    expect(isShellKey("mascot")).toBe(false);
    expect(isShellKey("storied_house")).toBe(false);
    expect(isShellKey("mascot_idle")).toBe(true);
    expect(isShellKey("story_dog_1")).toBe(true);
    expect(isShellKey("tile_shape_sorter")).toBe(true);
    expect(isShellKey("sticker_alphabet")).toBe(true);
    expect(isShellKey("icon_speaker")).toBe(true);
  });

  it("names no shell key the shell does not ship", () => {
    const observed = new Set<string>();
    for (const source of [storyOrderLogicSource, storyOrderArtSource, wordLogicSource]) {
      for (const literal of literalsIn(stripComments(source))) {
        // A trailing `_` is prefix evidence (`` `tile_${id}` ``), not a key that
        // has to appear in a shell table.
        if (literal.value.endsWith("_")) continue;
        if (isShellKey(literal.value)) observed.add(literal.value);
      }
    }

    // `mascot_idle` is the one shell key a game group deliberately relies on,
    // so finding it here proves the check is live rather than vacuous.
    expect(observed.has("mascot_idle")).toBe(true);

    // Story Order's panels are its own art, not boot-shell art: they belong to
    // `storyOrderArt`, which is exactly why that module must stay out of the
    // shell's asset table.
    const missing = sorted(observed).filter((literal) =>
      literal.startsWith("story_")
        ? !storyOrderArtSource.includes(literal)
        : !preloadSceneSource.includes(literal),
    );
    expect(missing).toEqual([]);
  });
});

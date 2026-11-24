import { animals } from "./art/animals";
import { food } from "./art/food";
import { items } from "./art/items";
import { letters } from "./art/letters";
import { music } from "./art/music";
import { shapes } from "./art/shapes";
import { toys } from "./art/toys";
import type { ArtGroup } from "./art/types";
import { getWord, type WordRound } from "./wordLogic";

/** Prompt pictures already rasterized by the shell, never queued by this game. */
const SHELL_OWNED_PROMPTS: ReadonlySet<string> = new Set(["mascot_idle", "frog_red"]);

/** Registry order; unused groups stay present but empty for the static declaration guard. */
const WORD_MATCH_ART_GROUPS: readonly ArtGroup[] = [
  animals,
  food,
  items,
  letters,
  music,
  shapes,
  toys,
];

/**
 * Selects the full alphabet plus only the prompt pictures this playthrough can
 * draw. Group order stays fixed so the scene can keep its static declaration
 * shape; unused groups contain no assets and therefore queue no raster work.
 * Repeated targets and shell-owned prompt keys add nothing to the preload queue.
 */
export function selectWordMatchArt(rounds: readonly WordRound[]): ArtGroup[] {
  const selectedPrompts = new Set<string>();
  for (const round of rounds) {
    const key = getWord(round.target)?.promptTexture;
    if (key !== undefined && !SHELL_OWNED_PROMPTS.has(key)) selectedPrompts.add(key);
  }

  return WORD_MATCH_ART_GROUPS.map((group) => {
    if (group.id === "letters") return group;
    return { ...group, assets: group.assets.filter((asset) => selectedPrompts.has(asset.key)) };
  });
}

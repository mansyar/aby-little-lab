import type { GameId, HubGroupId } from "../types";
import { GAME_REGISTRY } from "./gameRegistry";

/**
 * The Hub's grouping table (spec FR-1, D1).
 *
 * The registry is the single declaration of which games exist; this module is the
 * single declaration of how they are grouped. It names each group's chip word, the
 * sentence spoken when that chip is tapped, and the boot-shell glyph the chip
 * draws, and it answers the only layout question the grid asks: which tiles must
 * be drawn for a selection.
 *
 * Nothing here touches Phaser or storage, so the chip row and the board that reads
 * it can be tested with plain numbers.
 */

/** The chip that shows every game — the Hub's landing state (spec D4). */
export const ALL_GROUP_ID = "all";

/** A group id, or `all` for the unfiltered board. */
export type HubSelection = HubGroupId | typeof ALL_GROUP_ID;

/** One group's chip identity: what it says, what it speaks, what it draws. */
export interface HubGroup {
  readonly id: HubGroupId;
  /** One word under the glyph; short enough for a 96px chip. */
  readonly label: string;
  /** Spoken on chip tap, through the same TTS path as every game's rule. */
  readonly spokenName: string;
  /** Preloaded shell texture key for the chip's glyph (`group_<id>`). */
  readonly glyphKey: string;
}

/**
 * The five groups in chip order, after All.
 *
 * Membership is not repeated here: it lives on each registry entry, and the unit
 * suite asserts this table against it in both directions, so a group with no games
 * and a game with no group both fail before the Hub can draw them.
 */
export const HUB_GROUPS = [
  {
    id: "letters",
    label: "Letters",
    spokenName: "Letters and sounds",
    glyphKey: "group_letters",
  },
  {
    id: "numbers",
    label: "Numbers",
    spokenName: "Numbers and counting",
    glyphKey: "group_numbers",
  },
  {
    id: "thinking",
    label: "Thinking",
    spokenName: "Thinking and matching",
    glyphKey: "group_thinking",
  },
  {
    id: "play",
    label: "Play",
    spokenName: "Play and memory",
    glyphKey: "group_play",
  },
  {
    id: "stories",
    label: "Stories",
    spokenName: "Feelings and stories",
    glyphKey: "group_stories",
  },
] as const satisfies readonly HubGroup[];

/** The All chip's word and sentence; it ships no glyph (its 2x2 grid is drawn). */
const ALL_LABEL = "All";
const ALL_SPOKEN_NAME = "All games";

/** Every chip in draw order: All first, then the five groups. */
export const HUB_SELECTIONS: readonly HubSelection[] = [
  ALL_GROUP_ID,
  ...HUB_GROUPS.map((group) => group.id),
];

/** Resolves a group row, naming the id when the table is missing one. */
function groupById(id: HubGroupId): HubGroup {
  const group = HUB_GROUPS.find((candidate) => candidate.id === id);
  if (group === undefined) {
    throw new Error(`no hub group for id: ${id}`);
  }
  return group;
}

/** The word under a chip's glyph. */
export function selectionLabel(selection: HubSelection): string {
  return selection === ALL_GROUP_ID ? ALL_LABEL : groupById(selection).label;
}

/** The sentence spoken when a chip is tapped (spec FR-8). */
export function selectionSpokenName(selection: HubSelection): string {
  return selection === ALL_GROUP_ID ? ALL_SPOKEN_NAME : groupById(selection).spokenName;
}

/**
 * The chip's glyph texture key, or null for All, whose 2x2 grid is drawn at
 * runtime so the shell ships exactly five group glyphs (spec D7).
 */
export function selectionGlyphKey(selection: HubSelection): string | null {
  return selection === ALL_GROUP_ID ? null : groupById(selection).glyphKey;
}

/**
 * Registry indexes of the games a selection shows, in registry order.
 *
 * The grid draws tiles by registry index, and the bridge publishes those same
 * indexes, so a filtered board needs no second identity for its tiles.
 */
export function visibleTileIndexes(selection: HubSelection = ALL_GROUP_ID): number[] {
  const indexes: number[] = [];
  GAME_REGISTRY.forEach((game, index) => {
    if (selection === ALL_GROUP_ID || game.group === selection) indexes.push(index);
  });
  return indexes;
}

/** Registry indexes of one group's games — `visibleTileIndexes` without All. */
export function tilesInGroup(group: HubGroupId): number[] {
  return visibleTileIndexes(group);
}

/** The group a game belongs to, read from its registry entry. */
export function groupForGame(gameId: GameId): HubGroupId {
  const entry = GAME_REGISTRY.find((game) => game.gameId === gameId);
  if (entry === undefined) {
    throw new Error(`no registry entry for game id: ${gameId}`);
  }
  return entry.group;
}

/**
 * Compile-time coverage proof, mirroring `GAME_ID_COVERAGE` in the registry:
 * `Record<never, true>` is `{}`, so this type-checks today, and adding a
 * `HubGroupId` without a `HUB_GROUPS` row turns the key into a required property
 * and fails `pnpm typecheck` naming the missing group.
 */
type MissingGroupIds = Exclude<HubGroupId, (typeof HUB_GROUPS)[number]["id"]>;

export const HUB_GROUP_COVERAGE: Record<MissingGroupIds, true> = {};

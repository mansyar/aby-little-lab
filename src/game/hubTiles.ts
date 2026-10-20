import type { GameId } from "../types";
import { GAME_REGISTRY, type GameRegistryEntry } from "./gameRegistry";

export interface GameTile {
  sceneKey: string;
  gameId: GameId;
  label: string;
  /** Preloaded tile icon texture key (storybook-style SVG). */
  tileKey: string;
  /**
   * Optional smaller icon display size (px) for typography-heavy tiles whose
   * ink extends close to the bottom of the art; defaults to TILE_ICON_DISPLAY.
   */
  iconDisplay?: number;
  /** Optional raised icon offset for typography-heavy tiles (px). */
  iconOffsetY?: number;
}

/**
 * Hub tiles in registry order. This is the only bridge between the registry and
 * the Hub grid renderer: the tile shape stays as it was, and the icon overrides
 * are carried across only when the registry sets them, so a tile without an
 * override stays indistinguishable from the pre-registry array.
 *
 * `stickerKey` is deliberately not part of the tile shape: it belongs to game
 * identity, not to Hub tile geometry, so the tile consumer surface is unchanged.
 */
export const GAME_TILES: readonly GameTile[] = GAME_REGISTRY.map(
  ({ gameId, sceneKey, label, tileKey, iconDisplay, iconOffsetY }: GameRegistryEntry) => ({
    sceneKey,
    gameId,
    label,
    tileKey,
    ...(iconDisplay === undefined ? {} : { iconDisplay }),
    ...(iconOffsetY === undefined ? {} : { iconOffsetY }),
  }),
);

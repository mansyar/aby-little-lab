/**
 * Robot Path art (Game 23).
 *
 * The robot's three poses, the Go triangle, the rock and the star are imported
 * as raw markup and rasterized by the robot scene's own `preload` through
 * `preloadRobotPathArt`, so their SVG strings ride the game's lazy chunk instead
 * of the boot shell. The arrows, the tiles and the ghost trail are drawn with
 * `Graphics` and appear nowhere here.
 *
 * Nothing else may import this module: `src/__tests__/game/robotPathArt.test.ts`
 * asserts that `PreloadScene` stays free of it, the same guard Story Order has.
 */

import type Phaser from "phaser";
import robotGoSvg from "../assets/svg/robot/robot_go.svg?raw";
import robotIdleSvg from "../assets/svg/robot/robot_idle.svg?raw";
import robotPuzzledSvg from "../assets/svg/robot/robot_puzzled.svg?raw";
import robotRockSvg from "../assets/svg/robot/robot_rock.svg?raw";
import robotStarSvg from "../assets/svg/robot/robot_star.svg?raw";
import robotWalkSvg from "../assets/svg/robot/robot_walk.svg?raw";
import { toDataUri } from "../utils/svgDataUri";
import { textureSizeFor } from "../utils/textureTiers";

/** One robot-scene texture: the key the scene draws with and its SVG markup. */
export interface RobotPathAsset {
  /** Texture key. `robot_` keys resolve to the default `card` tier. */
  readonly key: string;
  /** Raw SVG markup for the texture. */
  readonly svg: string;
}

/**
 * The six textures the scene asks for, in the order the scene's own art
 * contract names them: the three robot poses, then the Go glyph and the two
 * props.
 */
export const ROBOT_PATH_ASSETS: readonly RobotPathAsset[] = [
  { key: "robot_idle", svg: robotIdleSvg },
  { key: "robot_walk", svg: robotWalkSvg },
  { key: "robot_puzzled", svg: robotPuzzledSvg },
  { key: "robot_go", svg: robotGoSvg },
  { key: "robot_rock", svg: robotRockSvg },
  { key: "robot_star", svg: robotStarSvg },
];

/**
 * Registers every robot texture with the scene's loader, rasterized at the
 * texture tier for `robot_*` keys (`card`, 256² — the poses are drawn at most
 * 96 px, so 256 leaves room for a scaled tablet without another tier).
 *
 * Called from `RobotPathScene.preload`, never from the boot preloader.
 */
export function preloadRobotPathArt(scene: Phaser.Scene): void {
  for (const asset of ROBOT_PATH_ASSETS) {
    const size = textureSizeFor(asset.key);
    scene.load.svg(asset.key, toDataUri(asset.svg), { width: size, height: size });
  }
}

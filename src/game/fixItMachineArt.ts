/**
 * Fix-It Machine art (Game 24).
 *
 * Sixteen textures ride the game's own lazy chunk instead of the boot shell:
 * four machine poses drawn on one shared anchor, the six tool pictograms the
 * cards and the repair tray show, and one goal drawing per toy. Everything is
 * imported as raw markup and rasterized by the scene's own `preload` through
 * `preloadFixItMachineArt`.
 *
 * The tape's cards, tray slots, timer ring and confetti are drawn with
 * `Graphics` and appear nowhere here.
 *
 * Nothing else may import this module: the art suite asserts that
 * `PreloadScene` stays free of it, the same guard Robot Path and Story Order
 * have.
 */

import type Phaser from "phaser";
import machineBlocksSvg from "../assets/svg/machine/machine_blocks.svg?raw";
import machineCarSvg from "../assets/svg/machine/machine_car.svg?raw";
import machineDrumSvg from "../assets/svg/machine/machine_drum.svg?raw";
import machineDuckSvg from "../assets/svg/machine/machine_duck.svg?raw";
import machineHappySvg from "../assets/svg/machine/machine_happy.svg?raw";
import machineIdleSvg from "../assets/svg/machine/machine_idle.svg?raw";
import machineLiftSvg from "../assets/svg/machine/machine_lift.svg?raw";
import machinePaintSvg from "../assets/svg/machine/machine_paint.svg?raw";
import machinePolishSvg from "../assets/svg/machine/machine_polish.svg?raw";
import machinePourSvg from "../assets/svg/machine/machine_pour.svg?raw";
import machinePuzzledSvg from "../assets/svg/machine/machine_puzzled.svg?raw";
import machineRobotSvg from "../assets/svg/machine/machine_robot.svg?raw";
import machineSpraySvg from "../assets/svg/machine/machine_spray.svg?raw";
import machineStackSvg from "../assets/svg/machine/machine_stack.svg?raw";
import machineTeddySvg from "../assets/svg/machine/machine_teddy.svg?raw";
import machineWorkingSvg from "../assets/svg/machine/machine_working.svg?raw";
import { toDataUri } from "../utils/svgDataUri";
import { textureSizeFor } from "../utils/textureTiers";

/** One Fix-It Machine texture: the key the scene draws with and its markup. */
export interface FixItMachineAsset {
  /** Texture key. `machine_` keys resolve to the default `card` tier. */
  readonly key: string;
  /** Raw SVG markup for the texture. */
  readonly svg: string;
}

/** The four poses, in the order the scene's art contract names them. */
export const MACHINE_POSE_KEYS = [
  "machine_idle",
  "machine_working",
  "machine_puzzled",
  "machine_happy",
] as const;

/** The six tool pictograms, one per `ActionIcon` and in the same order. */
export const MACHINE_TOOL_KEYS = [
  "machine_spray",
  "machine_pour",
  "machine_paint",
  "machine_polish",
  "machine_lift",
  "machine_stack",
] as const;

/** The six goal drawings, one per `ToyId` and in round order. */
export const MACHINE_TOY_KEYS = [
  "machine_teddy",
  "machine_car",
  "machine_duck",
  "machine_drum",
  "machine_robot",
  "machine_blocks",
] as const;

/** The sixteen textures the scene asks for, poses then tools then toys. */
export const FIX_IT_MACHINE_ASSETS: readonly FixItMachineAsset[] = [
  { key: "machine_idle", svg: machineIdleSvg },
  { key: "machine_working", svg: machineWorkingSvg },
  { key: "machine_puzzled", svg: machinePuzzledSvg },
  { key: "machine_happy", svg: machineHappySvg },
  { key: "machine_spray", svg: machineSpraySvg },
  { key: "machine_pour", svg: machinePourSvg },
  { key: "machine_paint", svg: machinePaintSvg },
  { key: "machine_polish", svg: machinePolishSvg },
  { key: "machine_lift", svg: machineLiftSvg },
  { key: "machine_stack", svg: machineStackSvg },
  { key: "machine_teddy", svg: machineTeddySvg },
  { key: "machine_car", svg: machineCarSvg },
  { key: "machine_duck", svg: machineDuckSvg },
  { key: "machine_drum", svg: machineDrumSvg },
  { key: "machine_robot", svg: machineRobotSvg },
  { key: "machine_blocks", svg: machineBlocksSvg },
];

/**
 * Registers every Fix-It Machine texture with the scene's loader, rasterized at
 * the texture tier for `machine_*` keys (`card`, 256 squared — cards and goals
 * are drawn at most 112 px, so 256 leaves room for a scaled tablet).
 *
 * Called from `FixItMachineScene.preload`, never from the boot preloader.
 */
export function preloadFixItMachineArt(scene: Phaser.Scene): void {
  for (const asset of FIX_IT_MACHINE_ASSETS) {
    const size = textureSizeFor(asset.key);
    scene.load.svg(asset.key, toDataUri(asset.svg), { width: size, height: size });
  }
}

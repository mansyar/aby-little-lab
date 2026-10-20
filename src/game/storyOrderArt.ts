/**
 * Story Order panel art (Game 22).
 *
 * The 24 panel drawings are imported as raw markup and rasterized by the story
 * scene's own `preload` through `preloadStoryOrderArt`, so their SVG strings
 * live in the game's lazy chunk instead of the shell bundle. Nothing else may
 * import this module: `src/__tests__/game/storyOrderArt.test.ts` asserts that
 * `PreloadScene` stays free of it.
 */

import type Phaser from "phaser";
import storyBalloonAloftSvg from "../assets/svg/stories/story_balloon_aloft.svg?raw";
import storyBalloonFlatSvg from "../assets/svg/stories/story_balloon_flat.svg?raw";
import storyBalloonRoundSvg from "../assets/svg/stories/story_balloon_round.svg?raw";
import storyBananaPeelSvg from "../assets/svg/stories/story_banana_peel.svg?raw";
import storyBananaPeeledSvg from "../assets/svg/stories/story_banana_peeled.svg?raw";
import storyBananaWholeSvg from "../assets/svg/stories/story_banana_whole.svg?raw";
import storyCloudSvg from "../assets/svg/stories/story_cloud.svg?raw";
import storyCloudRainingSvg from "../assets/svg/stories/story_cloud_raining.svg?raw";
import storyCupEmptySvg from "../assets/svg/stories/story_cup_empty.svg?raw";
import storyCupFullSvg from "../assets/svg/stories/story_cup_full.svg?raw";
import storyCupPouringSvg from "../assets/svg/stories/story_cup_pouring.svg?raw";
import storyDucklingSvg from "../assets/svg/stories/story_duckling.svg?raw";
import storyEggSvg from "../assets/svg/stories/story_egg.svg?raw";
import storyEggCrackingSvg from "../assets/svg/stories/story_egg_cracking.svg?raw";
import storyFootBareSvg from "../assets/svg/stories/story_foot_bare.svg?raw";
import storyFootShoeSvg from "../assets/svg/stories/story_foot_shoe.svg?raw";
import storyFootSockSvg from "../assets/svg/stories/story_foot_sock.svg?raw";
import storyIceDrippingSvg from "../assets/svg/stories/story_ice_dripping.svg?raw";
import storyIcePuddleSvg from "../assets/svg/stories/story_ice_puddle.svg?raw";
import storyIceScoopSvg from "../assets/svg/stories/story_ice_scoop.svg?raw";
import storyRainPuddleSvg from "../assets/svg/stories/story_rain_puddle.svg?raw";
import storySeedFlowerSvg from "../assets/svg/stories/story_seed_flower.svg?raw";
import storySeedPlantedSvg from "../assets/svg/stories/story_seed_planted.svg?raw";
import storySeedSproutSvg from "../assets/svg/stories/story_seed_sprout.svg?raw";
import { toDataUri } from "../utils/svgDataUri";
import { textureSizeFor } from "../utils/textureTiers";

/** One story panel: the texture key the round uses and its SVG markup. */
export interface StoryPanelAsset {
  /** Texture key, identical to the key held by `STORY_POOL`. */
  readonly key: string;
  /** Raw SVG markup for the panel. */
  readonly svg: string;
}

/**
 * The 24 story panels in `STORY_POOL` solution order: every story's three
 * panels, first → last, with the stories in pool order.
 */
export const STORY_PANEL_ASSETS: readonly StoryPanelAsset[] = [
  { key: "story_seed_planted", svg: storySeedPlantedSvg },
  { key: "story_seed_sprout", svg: storySeedSproutSvg },
  { key: "story_seed_flower", svg: storySeedFlowerSvg },
  { key: "story_balloon_flat", svg: storyBalloonFlatSvg },
  { key: "story_balloon_round", svg: storyBalloonRoundSvg },
  { key: "story_balloon_aloft", svg: storyBalloonAloftSvg },
  { key: "story_egg", svg: storyEggSvg },
  { key: "story_egg_cracking", svg: storyEggCrackingSvg },
  { key: "story_duckling", svg: storyDucklingSvg },
  { key: "story_ice_scoop", svg: storyIceScoopSvg },
  { key: "story_ice_dripping", svg: storyIceDrippingSvg },
  { key: "story_ice_puddle", svg: storyIcePuddleSvg },
  { key: "story_banana_whole", svg: storyBananaWholeSvg },
  { key: "story_banana_peeled", svg: storyBananaPeeledSvg },
  { key: "story_banana_peel", svg: storyBananaPeelSvg },
  { key: "story_cup_full", svg: storyCupFullSvg },
  { key: "story_cup_pouring", svg: storyCupPouringSvg },
  { key: "story_cup_empty", svg: storyCupEmptySvg },
  { key: "story_foot_bare", svg: storyFootBareSvg },
  { key: "story_foot_sock", svg: storyFootSockSvg },
  { key: "story_foot_shoe", svg: storyFootShoeSvg },
  { key: "story_cloud", svg: storyCloudSvg },
  { key: "story_cloud_raining", svg: storyCloudRainingSvg },
  { key: "story_rain_puddle", svg: storyRainPuddleSvg },
];

/**
 * Registers every story panel with the scene's loader, rasterized at the
 * texture tier for `story_*` keys (`card`, 256²). Called from the story
 * scene's own `preload`, never from the boot preloader.
 */
export function preloadStoryOrderArt(scene: Phaser.Scene): void {
  for (const asset of STORY_PANEL_ASSETS) {
    const size = textureSizeFor(asset.key);
    scene.load.svg(asset.key, toDataUri(asset.svg), { width: size, height: size });
  }
}

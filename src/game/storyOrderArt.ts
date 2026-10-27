/**
 * Story Order panel art (Game 22).
 *
 * The 33 panel drawings are imported as raw markup and rasterized by the story
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
import storyBlocksScatteredSvg from "../assets/svg/stories/story_blocks_scattered.svg?raw";
import storyButterflySvg from "../assets/svg/stories/story_butterfly.svg?raw";
import storyCakeCandlesSvg from "../assets/svg/stories/story_cake_candles.svg?raw";
import storyCakeSlicedSvg from "../assets/svg/stories/story_cake_sliced.svg?raw";
import storyCakeWholeSvg from "../assets/svg/stories/story_cake_whole.svg?raw";
import storyCaterpillarSvg from "../assets/svg/stories/story_caterpillar.svg?raw";
import storyClothesDrySvg from "../assets/svg/stories/story_clothes_dry.svg?raw";
import storyClothesDryingSvg from "../assets/svg/stories/story_clothes_drying.svg?raw";
import storyClothesWetSvg from "../assets/svg/stories/story_clothes_wet.svg?raw";
import storyCloudSvg from "../assets/svg/stories/story_cloud.svg?raw";
import storyCloudRainingSvg from "../assets/svg/stories/story_cloud_raining.svg?raw";
import storyCocoonSvg from "../assets/svg/stories/story_cocoon.svg?raw";
import storyCupEmptySvg from "../assets/svg/stories/story_cup_empty.svg?raw";
import storyCupFullSvg from "../assets/svg/stories/story_cup_full.svg?raw";
import storyCupPouringSvg from "../assets/svg/stories/story_cup_pouring.svg?raw";
import storyDucklingSvg from "../assets/svg/stories/story_duckling.svg?raw";
import storyEggSvg from "../assets/svg/stories/story_egg.svg?raw";
import storyEggCrackingSvg from "../assets/svg/stories/story_egg_cracking.svg?raw";
import storyFootBareSvg from "../assets/svg/stories/story_foot_bare.svg?raw";
import storyFootShoeSvg from "../assets/svg/stories/story_foot_shoe.svg?raw";
import storyFootSockSvg from "../assets/svg/stories/story_foot_sock.svg?raw";
import storyFrogSvg from "../assets/svg/stories/story_frog.svg?raw";
import storyFrogspawnSvg from "../assets/svg/stories/story_frogspawn.svg?raw";
import storyIceDrippingSvg from "../assets/svg/stories/story_ice_dripping.svg?raw";
import storyIcePuddleSvg from "../assets/svg/stories/story_ice_puddle.svg?raw";
import storyIceScoopSvg from "../assets/svg/stories/story_ice_scoop.svg?raw";
import storyRainPuddleSvg from "../assets/svg/stories/story_rain_puddle.svg?raw";
import storySeedFlowerSvg from "../assets/svg/stories/story_seed_flower.svg?raw";
import storySeedPlantedSvg from "../assets/svg/stories/story_seed_planted.svg?raw";
import storySeedSproutSvg from "../assets/svg/stories/story_seed_sprout.svg?raw";
import storySnowPileSvg from "../assets/svg/stories/story_snow_pile.svg?raw";
import storySnowmanSvg from "../assets/svg/stories/story_snowman.svg?raw";
import storySnowmanHatSvg from "../assets/svg/stories/story_snowman_hat.svg?raw";
import storySunNoonSvg from "../assets/svg/stories/story_sun_noon.svg?raw";
import storySunRiseSvg from "../assets/svg/stories/story_sun_rise.svg?raw";
import storySunSetSvg from "../assets/svg/stories/story_sun_set.svg?raw";
import storyTadpoleSvg from "../assets/svg/stories/story_tadpole.svg?raw";
import storyTowerHalfSvg from "../assets/svg/stories/story_tower_half.svg?raw";
import storyTowerTallSvg from "../assets/svg/stories/story_tower_tall.svg?raw";
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
 * The 45 story panels in `STORY_POOL` solution order: every story's three
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
  { key: "story_cake_whole", svg: storyCakeWholeSvg },
  { key: "story_cake_candles", svg: storyCakeCandlesSvg },
  { key: "story_cake_sliced", svg: storyCakeSlicedSvg },
  { key: "story_snow_pile", svg: storySnowPileSvg },
  { key: "story_snowman", svg: storySnowmanSvg },
  { key: "story_snowman_hat", svg: storySnowmanHatSvg },
  { key: "story_blocks_scattered", svg: storyBlocksScatteredSvg },
  { key: "story_tower_half", svg: storyTowerHalfSvg },
  { key: "story_tower_tall", svg: storyTowerTallSvg },
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
  { key: "story_clothes_wet", svg: storyClothesWetSvg },
  { key: "story_clothes_drying", svg: storyClothesDryingSvg },
  { key: "story_clothes_dry", svg: storyClothesDrySvg },
  { key: "story_sun_rise", svg: storySunRiseSvg },
  { key: "story_sun_noon", svg: storySunNoonSvg },
  { key: "story_sun_set", svg: storySunSetSvg },
  { key: "story_caterpillar", svg: storyCaterpillarSvg },
  { key: "story_cocoon", svg: storyCocoonSvg },
  { key: "story_butterfly", svg: storyButterflySvg },
  { key: "story_frogspawn", svg: storyFrogspawnSvg },
  { key: "story_tadpole", svg: storyTadpoleSvg },
  { key: "story_frog", svg: storyFrogSvg },
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

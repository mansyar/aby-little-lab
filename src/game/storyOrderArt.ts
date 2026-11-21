/**
 * Story Order panel art (Game 22).
 *
 * The 90 panel drawings are imported as raw markup and rasterized by the story
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
import storyBeeFlowerSvg from "../assets/svg/stories/story_bee_flower.svg?raw";
import storyBeeFlyingSvg from "../assets/svg/stories/story_bee_flying.svg?raw";
import storyBeeLandingSvg from "../assets/svg/stories/story_bee_landing.svg?raw";
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
import storyCupcakeCherrySvg from "../assets/svg/stories/story_cupcake_cherry.svg?raw";
import storyCupcakeFrostedSvg from "../assets/svg/stories/story_cupcake_frosted.svg?raw";
import storyCupcakePlainSvg from "../assets/svg/stories/story_cupcake_plain.svg?raw";
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
import storyKettleColdSvg from "../assets/svg/stories/story_kettle_cold.svg?raw";
import storyKettleSteamSvg from "../assets/svg/stories/story_kettle_steam.svg?raw";
import storyKettleTeaSvg from "../assets/svg/stories/story_kettle_tea.svg?raw";
import storyKiteFlyingSvg from "../assets/svg/stories/story_kite_flying.svg?raw";
import storyKiteFoldedSvg from "../assets/svg/stories/story_kite_folded.svg?raw";
import storyKiteRaisedSvg from "../assets/svg/stories/story_kite_raised.svg?raw";
import storyLanternGlowSvg from "../assets/svg/stories/story_lantern_glow.svg?raw";
import storyLanternOffSvg from "../assets/svg/stories/story_lantern_off.svg?raw";
import storyLanternOnSvg from "../assets/svg/stories/story_lantern_on.svg?raw";
import storyMagnetBarSvg from "../assets/svg/stories/story_magnet_bar.svg?raw";
import storyMagnetChainSvg from "../assets/svg/stories/story_magnet_chain.svg?raw";
import storyMagnetClipSvg from "../assets/svg/stories/story_magnet_clip.svg?raw";
import storyMirrorFrameSvg from "../assets/svg/stories/story_mirror_frame.svg?raw";
import storyMirrorReflectionSvg from "../assets/svg/stories/story_mirror_reflection.svg?raw";
import storyMirrorSmileSvg from "../assets/svg/stories/story_mirror_smile.svg?raw";
import storyPaintBlankSvg from "../assets/svg/stories/story_paint_blank.svg?raw";
import storyPaintPictureSvg from "../assets/svg/stories/story_paint_picture.svg?raw";
import storyPaintStrokeSvg from "../assets/svg/stories/story_paint_stroke.svg?raw";
import storyPancakeBatterSvg from "../assets/svg/stories/story_pancake_batter.svg?raw";
import storyPancakeBerriesSvg from "../assets/svg/stories/story_pancake_berries.svg?raw";
import storyPancakeCookedSvg from "../assets/svg/stories/story_pancake_cooked.svg?raw";
import storyPencilDrawingSvg from "../assets/svg/stories/story_pencil_drawing.svg?raw";
import storyPencilNewSvg from "../assets/svg/stories/story_pencil_new.svg?raw";
import storyPencilSharpSvg from "../assets/svg/stories/story_pencil_sharp.svg?raw";
import storyPuzzleDoneSvg from "../assets/svg/stories/story_puzzle_done.svg?raw";
import storyPuzzleHalfSvg from "../assets/svg/stories/story_puzzle_half.svg?raw";
import storyPuzzlePiecesSvg from "../assets/svg/stories/story_puzzle_pieces.svg?raw";
import storyRainPuddleSvg from "../assets/svg/stories/story_rain_puddle.svg?raw";
import storySandCastleSvg from "../assets/svg/stories/story_sand_castle.svg?raw";
import storySandFlagSvg from "../assets/svg/stories/story_sand_flag.svg?raw";
import storySandPileSvg from "../assets/svg/stories/story_sand_pile.svg?raw";
import storySeedFlowerSvg from "../assets/svg/stories/story_seed_flower.svg?raw";
import storySeedPlantedSvg from "../assets/svg/stories/story_seed_planted.svg?raw";
import storySeedSproutSvg from "../assets/svg/stories/story_seed_sprout.svg?raw";
import storyShadowEveningSvg from "../assets/svg/stories/story_shadow_evening.svg?raw";
import storyShadowMorningSvg from "../assets/svg/stories/story_shadow_morning.svg?raw";
import storyShadowNoonSvg from "../assets/svg/stories/story_shadow_noon.svg?raw";
import storySnowPileSvg from "../assets/svg/stories/story_snow_pile.svg?raw";
import storySnowmanSvg from "../assets/svg/stories/story_snowman.svg?raw";
import storySnowmanHatSvg from "../assets/svg/stories/story_snowman_hat.svg?raw";
import storySoapBarSvg from "../assets/svg/stories/story_soap_bar.svg?raw";
import storySoapBubbleBigSvg from "../assets/svg/stories/story_soap_bubble_big.svg?raw";
import storySoapBubblesSvg from "../assets/svg/stories/story_soap_bubbles.svg?raw";
import storySunNoonSvg from "../assets/svg/stories/story_sun_noon.svg?raw";
import storySunRiseSvg from "../assets/svg/stories/story_sun_rise.svg?raw";
import storySunSetSvg from "../assets/svg/stories/story_sun_set.svg?raw";
import storyTadpoleSvg from "../assets/svg/stories/story_tadpole.svg?raw";
import storyTowerHalfSvg from "../assets/svg/stories/story_tower_half.svg?raw";
import storyTowerTallSvg from "../assets/svg/stories/story_tower_tall.svg?raw";
import storyTrainNearSvg from "../assets/svg/stories/story_train_near.svg?raw";
import storyTrainTrackSvg from "../assets/svg/stories/story_train_track.svg?raw";
import storyTrainWavingSvg from "../assets/svg/stories/story_train_waving.svg?raw";
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
 * The 90 story panels in `STORY_POOL` solution order: every story's three
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
  { key: "story_kite_folded", svg: storyKiteFoldedSvg },
  { key: "story_kite_raised", svg: storyKiteRaisedSvg },
  { key: "story_kite_flying", svg: storyKiteFlyingSvg },
  { key: "story_pancake_batter", svg: storyPancakeBatterSvg },
  { key: "story_pancake_cooked", svg: storyPancakeCookedSvg },
  { key: "story_pancake_berries", svg: storyPancakeBerriesSvg },
  { key: "story_soap_bar", svg: storySoapBarSvg },
  { key: "story_soap_bubbles", svg: storySoapBubblesSvg },
  { key: "story_soap_bubble_big", svg: storySoapBubbleBigSvg },
  { key: "story_pencil_new", svg: storyPencilNewSvg },
  { key: "story_pencil_sharp", svg: storyPencilSharpSvg },
  { key: "story_pencil_drawing", svg: storyPencilDrawingSvg },
  { key: "story_sand_pile", svg: storySandPileSvg },
  { key: "story_sand_castle", svg: storySandCastleSvg },
  { key: "story_sand_flag", svg: storySandFlagSvg },
  { key: "story_lantern_off", svg: storyLanternOffSvg },
  { key: "story_lantern_on", svg: storyLanternOnSvg },
  { key: "story_lantern_glow", svg: storyLanternGlowSvg },
  { key: "story_cupcake_plain", svg: storyCupcakePlainSvg },
  { key: "story_cupcake_frosted", svg: storyCupcakeFrostedSvg },
  { key: "story_cupcake_cherry", svg: storyCupcakeCherrySvg },
  { key: "story_train_track", svg: storyTrainTrackSvg },
  { key: "story_train_near", svg: storyTrainNearSvg },
  { key: "story_train_waving", svg: storyTrainWavingSvg },
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
  { key: "story_shadow_morning", svg: storyShadowMorningSvg },
  { key: "story_shadow_noon", svg: storyShadowNoonSvg },
  { key: "story_shadow_evening", svg: storyShadowEveningSvg },
  { key: "story_magnet_bar", svg: storyMagnetBarSvg },
  { key: "story_magnet_clip", svg: storyMagnetClipSvg },
  { key: "story_magnet_chain", svg: storyMagnetChainSvg },
  { key: "story_mirror_frame", svg: storyMirrorFrameSvg },
  { key: "story_mirror_reflection", svg: storyMirrorReflectionSvg },
  { key: "story_mirror_smile", svg: storyMirrorSmileSvg },
  { key: "story_kettle_cold", svg: storyKettleColdSvg },
  { key: "story_kettle_steam", svg: storyKettleSteamSvg },
  { key: "story_kettle_tea", svg: storyKettleTeaSvg },
  { key: "story_paint_blank", svg: storyPaintBlankSvg },
  { key: "story_paint_stroke", svg: storyPaintStrokeSvg },
  { key: "story_paint_picture", svg: storyPaintPictureSvg },
  { key: "story_bee_flower", svg: storyBeeFlowerSvg },
  { key: "story_bee_landing", svg: storyBeeLandingSvg },
  { key: "story_bee_flying", svg: storyBeeFlyingSvg },
  { key: "story_puzzle_pieces", svg: storyPuzzlePiecesSvg },
  { key: "story_puzzle_half", svg: storyPuzzleHalfSvg },
  { key: "story_puzzle_done", svg: storyPuzzleDoneSvg },
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

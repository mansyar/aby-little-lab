import Phaser from "phaser";
import animalCatSvg from "../assets/svg/animals/cat.svg?raw";
import animalDogSvg from "../assets/svg/animals/dog.svg?raw";
import animalElephantSvg from "../assets/svg/animals/elephant.svg?raw";
import animalFrogBlueSvg from "../assets/svg/animals/frog_blue.svg?raw";
import animalFrogGreenSvg from "../assets/svg/animals/frog_green.svg?raw";
import animalFrogRedSvg from "../assets/svg/animals/frog_red.svg?raw";
import animalMonkeySvg from "../assets/svg/animals/monkey.svg?raw";
import animalPigSvg from "../assets/svg/animals/pig.svg?raw";
import animalRabbitSvg from "../assets/svg/animals/rabbit.svg?raw";
import smAirplaneSvg from "../assets/svg/items/airplane.svg?raw";
import foodAppleSvg from "../assets/svg/items/apple.svg?raw";
import smBallSvg from "../assets/svg/items/ball.svg?raw";
import foodBananaSvg from "../assets/svg/items/banana.svg?raw";
import smBoatSvg from "../assets/svg/items/boat.svg?raw";
import foodBoneSvg from "../assets/svg/items/bone.svg?raw";
import smBugSvg from "../assets/svg/items/bug.svg?raw";
import smCarSvg from "../assets/svg/items/car.svg?raw";
import foodCarrotSvg from "../assets/svg/items/carrot.svg?raw";
import smDuckSvg from "../assets/svg/items/duck.svg?raw";
import foodFishSvg from "../assets/svg/items/fish.svg?raw";
import smHatSvg from "../assets/svg/items/hat.svg?raw";
import smHouseSvg from "../assets/svg/items/house.svg?raw";
import lilypadSvg from "../assets/svg/items/lilypad.svg?raw";
import smMushroomSvg from "../assets/svg/items/mushroom.svg?raw";
import foodPeanutSvg from "../assets/svg/items/peanut.svg?raw";
import smSunSvg from "../assets/svg/items/sun.svg?raw";
import smTreeSvg from "../assets/svg/items/tree.svg?raw";
import smUmbrellaSvg from "../assets/svg/items/umbrella.svg?raw";
import letterASvg from "../assets/svg/letters/letter_a.svg?raw";
import letterBSvg from "../assets/svg/letters/letter_b.svg?raw";
import letterCSvg from "../assets/svg/letters/letter_c.svg?raw";
import letterDSvg from "../assets/svg/letters/letter_d.svg?raw";
import letterESvg from "../assets/svg/letters/letter_e.svg?raw";
import letterFSvg from "../assets/svg/letters/letter_f.svg?raw";
import letterGSvg from "../assets/svg/letters/letter_g.svg?raw";
import letterHSvg from "../assets/svg/letters/letter_h.svg?raw";
import letterISvg from "../assets/svg/letters/letter_i.svg?raw";
import letterJSvg from "../assets/svg/letters/letter_j.svg?raw";
import letterKSvg from "../assets/svg/letters/letter_k.svg?raw";
import letterLSvg from "../assets/svg/letters/letter_l.svg?raw";
import letterMSvg from "../assets/svg/letters/letter_m.svg?raw";
import letterNSvg from "../assets/svg/letters/letter_n.svg?raw";
import letterOSvg from "../assets/svg/letters/letter_o.svg?raw";
import letterPSvg from "../assets/svg/letters/letter_p.svg?raw";
import letterQSvg from "../assets/svg/letters/letter_q.svg?raw";
import letterRSvg from "../assets/svg/letters/letter_r.svg?raw";
import letterSSvg from "../assets/svg/letters/letter_s.svg?raw";
import letterTSvg from "../assets/svg/letters/letter_t.svg?raw";
import letterUSvg from "../assets/svg/letters/letter_u.svg?raw";
import letterVSvg from "../assets/svg/letters/letter_v.svg?raw";
import letterWSvg from "../assets/svg/letters/letter_w.svg?raw";
import letterXSvg from "../assets/svg/letters/letter_x.svg?raw";
import letterYSvg from "../assets/svg/letters/letter_y.svg?raw";
import letterZSvg from "../assets/svg/letters/letter_z.svg?raw";
import numeral0Svg from "../assets/svg/numbers/numeral_0.svg?raw";
import numeral1Svg from "../assets/svg/numbers/numeral_1.svg?raw";
import numeral2Svg from "../assets/svg/numbers/numeral_2.svg?raw";
import numeral3Svg from "../assets/svg/numbers/numeral_3.svg?raw";
import numeral4Svg from "../assets/svg/numbers/numeral_4.svg?raw";
import numeral5Svg from "../assets/svg/numbers/numeral_5.svg?raw";
import numeral6Svg from "../assets/svg/numbers/numeral_6.svg?raw";
import numeral7Svg from "../assets/svg/numbers/numeral_7.svg?raw";
import numeral8Svg from "../assets/svg/numbers/numeral_8.svg?raw";
import numeral9Svg from "../assets/svg/numbers/numeral_9.svg?raw";
import smShadowAirplaneSvg from "../assets/svg/shadows/shadow_airplane.svg?raw";
import smShadowBallSvg from "../assets/svg/shadows/shadow_ball.svg?raw";
import smShadowBoatSvg from "../assets/svg/shadows/shadow_boat.svg?raw";
import smShadowCarSvg from "../assets/svg/shadows/shadow_car.svg?raw";
import smShadowHouseSvg from "../assets/svg/shadows/shadow_house.svg?raw";
import smShadowMushroomSvg from "../assets/svg/shadows/shadow_mushroom.svg?raw";
import smShadowTreeSvg from "../assets/svg/shadows/shadow_tree.svg?raw";
import smShadowUmbrellaSvg from "../assets/svg/shadows/shadow_umbrella.svg?raw";
import cutoutCircleSvg from "../assets/svg/shapes/cutout_circle.svg?raw";
import cutoutCrescentSvg from "../assets/svg/shapes/cutout_crescent.svg?raw";
import cutoutHeartSvg from "../assets/svg/shapes/cutout_heart.svg?raw";
import cutoutSquareSvg from "../assets/svg/shapes/cutout_square.svg?raw";
import cutoutStarSvg from "../assets/svg/shapes/cutout_star.svg?raw";
import cutoutTriangleSvg from "../assets/svg/shapes/cutout_triangle.svg?raw";
import shapeCircleSvg from "../assets/svg/shapes/shape_circle.svg?raw";
import shapeCrescentSvg from "../assets/svg/shapes/shape_crescent.svg?raw";
import shapeHeartSvg from "../assets/svg/shapes/shape_heart.svg?raw";
import shapeSquareSvg from "../assets/svg/shapes/shape_square.svg?raw";
import shapeStarSvg from "../assets/svg/shapes/shape_star.svg?raw";
import shapeTriangleSvg from "../assets/svg/shapes/shape_triangle.svg?raw";
import stickerAlphabetSvg from "../assets/svg/stickers/sticker_alphabet_match.svg?raw";
import stickerAnimalTraceSvg from "../assets/svg/stickers/sticker_animal_trace.svg?raw";
import stickerBigSmallSvg from "../assets/svg/stickers/sticker_big_small.svg?raw";
import stickerHowManySvg from "../assets/svg/stickers/sticker_how_many.svg?raw";
import stickerMusicalMemorySvg from "../assets/svg/stickers/sticker_musical_memory.svg?raw";
import stickerPatternBuilderSvg from "../assets/svg/stickers/sticker_pattern_builder.svg?raw";
import stickerPopFreezeSvg from "../assets/svg/stickers/sticker_pop_freeze.svg?raw";
import stickerShadowMatchSvg from "../assets/svg/stickers/sticker_shadow_match.svg?raw";
import stickerShapeSorterSvg from "../assets/svg/stickers/sticker_shape_sorter.svg?raw";
import stickerWordBuilderSvg from "../assets/svg/stickers/sticker_word_builder.svg?raw";
import stickerWordMatchSvg from "../assets/svg/stickers/sticker_word_match.svg?raw";
import toyTeddyBearSvg from "../assets/svg/toys/teddy_bear.svg?raw";
import toyBallSvg from "../assets/svg/toys/toy_ball.svg?raw";
import toyBlockSvg from "../assets/svg/toys/toy_block.svg?raw";
import toyBoxSvg from "../assets/svg/toys/toy_box.svg?raw";
import toyCarSvg from "../assets/svg/toys/toy_car.svg?raw";
import toyDrumSvg from "../assets/svg/toys/toy_drum.svg?raw";
import toyRocketSvg from "../assets/svg/toys/toy_rocket.svg?raw";
import bubbleSvg from "../assets/svg/ui/bubble.svg?raw";
import mascotCelebrateSvg from "../assets/svg/ui/mascot_celebrate.svg?raw";
import mascotIdleSvg from "../assets/svg/ui/mascot_idle.svg?raw";
import { transitionToScene } from "../utils/sceneTransitions";

const SVG_RASTER_SIZE = 512;

const SHAPE_ASSETS = [
  { key: "shape_circle", svg: shapeCircleSvg },
  { key: "shape_square", svg: shapeSquareSvg },
  { key: "shape_triangle", svg: shapeTriangleSvg },
  { key: "shape_star", svg: shapeStarSvg },
  { key: "shape_heart", svg: shapeHeartSvg },
  { key: "shape_crescent", svg: shapeCrescentSvg },
  { key: "cutout_circle", svg: cutoutCircleSvg },
  { key: "cutout_square", svg: cutoutSquareSvg },
  { key: "cutout_triangle", svg: cutoutTriangleSvg },
  { key: "cutout_star", svg: cutoutStarSvg },
  { key: "cutout_heart", svg: cutoutHeartSvg },
  { key: "cutout_crescent", svg: cutoutCrescentSvg },
  { key: "sticker_shape_sorter", svg: stickerShapeSorterSvg },
  { key: "animal_monkey", svg: animalMonkeySvg },
  { key: "animal_rabbit", svg: animalRabbitSvg },
  { key: "animal_cat", svg: animalCatSvg },
  { key: "animal_dog", svg: animalDogSvg },
  { key: "animal_elephant", svg: animalElephantSvg },
  { key: "animal_pig", svg: animalPigSvg },
  { key: "food_banana", svg: foodBananaSvg },
  { key: "food_carrot", svg: foodCarrotSvg },
  { key: "food_fish", svg: foodFishSvg },
  { key: "food_bone", svg: foodBoneSvg },
  { key: "food_peanut", svg: foodPeanutSvg },
  { key: "food_apple", svg: foodAppleSvg },
  { key: "sm_house", svg: smHouseSvg },
  { key: "sm_tree", svg: smTreeSvg },
  { key: "sm_car", svg: smCarSvg },
  { key: "sm_boat", svg: smBoatSvg },
  { key: "sm_ball", svg: smBallSvg },
  { key: "sm_umbrella", svg: smUmbrellaSvg },
  { key: "sm_airplane", svg: smAirplaneSvg },
  { key: "sm_mushroom", svg: smMushroomSvg },
  { key: "sm_bug", svg: smBugSvg },
  { key: "sm_duck", svg: smDuckSvg },
  { key: "sm_hat", svg: smHatSvg },
  { key: "sm_sun", svg: smSunSvg },
  { key: "sm_shadow_house", svg: smShadowHouseSvg },
  { key: "sm_shadow_tree", svg: smShadowTreeSvg },
  { key: "sm_shadow_car", svg: smShadowCarSvg },
  { key: "sm_shadow_boat", svg: smShadowBoatSvg },
  { key: "sm_shadow_ball", svg: smShadowBallSvg },
  { key: "sm_shadow_umbrella", svg: smShadowUmbrellaSvg },
  { key: "sm_shadow_airplane", svg: smShadowAirplaneSvg },
  { key: "sm_shadow_mushroom", svg: smShadowMushroomSvg },
  { key: "sticker_animal_trace", svg: stickerAnimalTraceSvg },
  { key: "bubble", svg: bubbleSvg },
  { key: "sticker_pop_freeze", svg: stickerPopFreezeSvg },
  { key: "sticker_shadow_match", svg: stickerShadowMatchSvg },
  { key: "frog_green", svg: animalFrogGreenSvg },
  { key: "frog_blue", svg: animalFrogBlueSvg },
  { key: "frog_red", svg: animalFrogRedSvg },
  { key: "lilypad", svg: lilypadSvg },
  { key: "sticker_musical_memory", svg: stickerMusicalMemorySvg },
  { key: "toy_teddy_bear", svg: toyTeddyBearSvg },
  { key: "toy_car", svg: toyCarSvg },
  { key: "toy_rocket", svg: toyRocketSvg },
  { key: "toy_drum", svg: toyDrumSvg },
  { key: "toy_ball", svg: toyBallSvg },
  { key: "toy_block", svg: toyBlockSvg },
  { key: "toy_box", svg: toyBoxSvg },
  { key: "sticker_big_small", svg: stickerBigSmallSvg },
  { key: "sticker_pattern_builder", svg: stickerPatternBuilderSvg },
  { key: "sticker_word_match", svg: stickerWordMatchSvg },
  { key: "sticker_word_builder", svg: stickerWordBuilderSvg },
  { key: "mascot_idle", svg: mascotIdleSvg },
  { key: "mascot_celebrate", svg: mascotCelebrateSvg },
  { key: "letter_a", svg: letterASvg },
  { key: "letter_b", svg: letterBSvg },
  { key: "letter_c", svg: letterCSvg },
  { key: "letter_d", svg: letterDSvg },
  { key: "letter_e", svg: letterESvg },
  { key: "letter_f", svg: letterFSvg },
  { key: "letter_g", svg: letterGSvg },
  { key: "letter_h", svg: letterHSvg },
  { key: "letter_i", svg: letterISvg },
  { key: "letter_j", svg: letterJSvg },
  { key: "letter_k", svg: letterKSvg },
  { key: "letter_l", svg: letterLSvg },
  { key: "letter_m", svg: letterMSvg },
  { key: "letter_n", svg: letterNSvg },
  { key: "letter_o", svg: letterOSvg },
  { key: "letter_p", svg: letterPSvg },
  { key: "letter_q", svg: letterQSvg },
  { key: "letter_r", svg: letterRSvg },
  { key: "letter_s", svg: letterSSvg },
  { key: "letter_t", svg: letterTSvg },
  { key: "letter_u", svg: letterUSvg },
  { key: "letter_v", svg: letterVSvg },
  { key: "letter_w", svg: letterWSvg },
  { key: "letter_x", svg: letterXSvg },
  { key: "letter_y", svg: letterYSvg },
  { key: "letter_z", svg: letterZSvg },
  { key: "sticker_alphabet_match", svg: stickerAlphabetSvg },
  { key: "numeral_0", svg: numeral0Svg },
  { key: "numeral_1", svg: numeral1Svg },
  { key: "numeral_2", svg: numeral2Svg },
  { key: "numeral_3", svg: numeral3Svg },
  { key: "numeral_4", svg: numeral4Svg },
  { key: "numeral_5", svg: numeral5Svg },
  { key: "numeral_6", svg: numeral6Svg },
  { key: "numeral_7", svg: numeral7Svg },
  { key: "numeral_8", svg: numeral8Svg },
  { key: "numeral_9", svg: numeral9Svg },
  { key: "sticker_how_many", svg: stickerHowManySvg },
] as const;

/**
 * Converts raw SVG markup into a base64 data URI that Phaser can load.
 * Phaser's XHRLoader detects `data:` URLs and decodes them via `atob`,
 * so the SVG must be properly base64-encoded to avoid `InvalidCharacterError`.
 */
function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Preload scene — displays a progress bar while assets load.
 *
 * Loads all shape SVG assets at high resolution for rasterization, registers
 * load event listeners for progress tracking, then transitions to the Hub
 * scene once all assets are loaded.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "Preload" });
  }

  preload(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const progressBar = this.add.rectangle(centerX, centerY, 300, 30, 0xffffff);
    const progressBox = this.add.rectangle(centerX, centerY, 320, 50, 0x222222);
    progressBox.setDepth(-1);

    this.load.on("progress", (value: number) => {
      progressBar.setDisplaySize(300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    for (const asset of SHAPE_ASSETS) {
      this.load.svg(asset.key, toDataUri(asset.svg), {
        width: SVG_RASTER_SIZE,
        height: SVG_RASTER_SIZE,
      });
    }
  }

  create(): void {
    transitionToScene(this, "Hub");
  }
}

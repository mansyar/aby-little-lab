import Phaser from "phaser";
import animalCatSvg from "../assets/svg/animals/cat.svg?raw";
import animalDogSvg from "../assets/svg/animals/dog.svg?raw";
import animalFrogBlueSvg from "../assets/svg/animals/frog_blue.svg?raw";
import animalFrogGreenSvg from "../assets/svg/animals/frog_green.svg?raw";
import animalFrogRedSvg from "../assets/svg/animals/frog_red.svg?raw";
import animalMonkeySvg from "../assets/svg/animals/monkey.svg?raw";
import animalRabbitSvg from "../assets/svg/animals/rabbit.svg?raw";
import smBallSvg from "../assets/svg/items/ball.svg?raw";
import foodBananaSvg from "../assets/svg/items/banana.svg?raw";
import smBoatSvg from "../assets/svg/items/boat.svg?raw";
import foodBoneSvg from "../assets/svg/items/bone.svg?raw";
import smCarSvg from "../assets/svg/items/car.svg?raw";
import foodCarrotSvg from "../assets/svg/items/carrot.svg?raw";
import foodFishSvg from "../assets/svg/items/fish.svg?raw";
import smHouseSvg from "../assets/svg/items/house.svg?raw";
import lilypadSvg from "../assets/svg/items/lilypad.svg?raw";
import smTreeSvg from "../assets/svg/items/tree.svg?raw";
import smUmbrellaSvg from "../assets/svg/items/umbrella.svg?raw";
import smShadowBallSvg from "../assets/svg/shadows/shadow_ball.svg?raw";
import smShadowBoatSvg from "../assets/svg/shadows/shadow_boat.svg?raw";
import smShadowCarSvg from "../assets/svg/shadows/shadow_car.svg?raw";
import smShadowHouseSvg from "../assets/svg/shadows/shadow_house.svg?raw";
import smShadowTreeSvg from "../assets/svg/shadows/shadow_tree.svg?raw";
import smShadowUmbrellaSvg from "../assets/svg/shadows/shadow_umbrella.svg?raw";
import cutoutCircleSvg from "../assets/svg/shapes/cutout_circle.svg?raw";
import cutoutSquareSvg from "../assets/svg/shapes/cutout_square.svg?raw";
import cutoutStarSvg from "../assets/svg/shapes/cutout_star.svg?raw";
import cutoutTriangleSvg from "../assets/svg/shapes/cutout_triangle.svg?raw";
import shapeCircleSvg from "../assets/svg/shapes/shape_circle.svg?raw";
import shapeSquareSvg from "../assets/svg/shapes/shape_square.svg?raw";
import shapeStarSvg from "../assets/svg/shapes/shape_star.svg?raw";
import shapeTriangleSvg from "../assets/svg/shapes/shape_triangle.svg?raw";
import stickerAnimalTraceSvg from "../assets/svg/stickers/sticker_animal_trace.svg?raw";
import stickerMusicalMemorySvg from "../assets/svg/stickers/sticker_musical_memory.svg?raw";
import stickerPopFreezeSvg from "../assets/svg/stickers/sticker_pop_freeze.svg?raw";
import stickerShadowMatchSvg from "../assets/svg/stickers/sticker_shadow_match.svg?raw";
import stickerShapeSorterSvg from "../assets/svg/stickers/sticker_shape_sorter.svg?raw";
import bubbleSvg from "../assets/svg/ui/bubble.svg?raw";

const SVG_RASTER_SIZE = 512;

const SHAPE_ASSETS = [
  { key: "shape_circle", svg: shapeCircleSvg },
  { key: "shape_square", svg: shapeSquareSvg },
  { key: "shape_triangle", svg: shapeTriangleSvg },
  { key: "shape_star", svg: shapeStarSvg },
  { key: "cutout_circle", svg: cutoutCircleSvg },
  { key: "cutout_square", svg: cutoutSquareSvg },
  { key: "cutout_triangle", svg: cutoutTriangleSvg },
  { key: "cutout_star", svg: cutoutStarSvg },
  { key: "sticker_shape_sorter", svg: stickerShapeSorterSvg },
  { key: "animal_monkey", svg: animalMonkeySvg },
  { key: "animal_rabbit", svg: animalRabbitSvg },
  { key: "animal_cat", svg: animalCatSvg },
  { key: "animal_dog", svg: animalDogSvg },
  { key: "food_banana", svg: foodBananaSvg },
  { key: "food_carrot", svg: foodCarrotSvg },
  { key: "food_fish", svg: foodFishSvg },
  { key: "food_bone", svg: foodBoneSvg },
  { key: "sm_house", svg: smHouseSvg },
  { key: "sm_tree", svg: smTreeSvg },
  { key: "sm_car", svg: smCarSvg },
  { key: "sm_boat", svg: smBoatSvg },
  { key: "sm_ball", svg: smBallSvg },
  { key: "sm_umbrella", svg: smUmbrellaSvg },
  { key: "sm_shadow_house", svg: smShadowHouseSvg },
  { key: "sm_shadow_tree", svg: smShadowTreeSvg },
  { key: "sm_shadow_car", svg: smShadowCarSvg },
  { key: "sm_shadow_boat", svg: smShadowBoatSvg },
  { key: "sm_shadow_ball", svg: smShadowBallSvg },
  { key: "sm_shadow_umbrella", svg: smShadowUmbrellaSvg },
  { key: "sticker_animal_trace", svg: stickerAnimalTraceSvg },
  { key: "bubble", svg: bubbleSvg },
  { key: "sticker_pop_freeze", svg: stickerPopFreezeSvg },
  { key: "sticker_shadow_match", svg: stickerShadowMatchSvg },
  { key: "frog_green", svg: animalFrogGreenSvg },
  { key: "frog_blue", svg: animalFrogBlueSvg },
  { key: "frog_red", svg: animalFrogRedSvg },
  { key: "lilypad", svg: lilypadSvg },
  { key: "sticker_musical_memory", svg: stickerMusicalMemorySvg },
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
    this.scene.start("Hub");
  }
}

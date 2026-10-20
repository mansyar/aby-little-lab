import Phaser from "phaser";
import animalCatSvg from "../assets/svg/animals/cat.svg?raw";
import animalDogSvg from "../assets/svg/animals/dog.svg?raw";
import animalFrogRedSvg from "../assets/svg/animals/frog_red.svg?raw";
import animalPigSvg from "../assets/svg/animals/pig.svg?raw";
import smDuckSvg from "../assets/svg/items/duck.svg?raw";
import stickerAddItUpSvg from "../assets/svg/stickers/sticker_add_it_up.svg?raw";
import stickerAlphabetSvg from "../assets/svg/stickers/sticker_alphabet_match.svg?raw";
import stickerAnimalTraceSvg from "../assets/svg/stickers/sticker_animal_trace.svg?raw";
import stickerBigSmallSvg from "../assets/svg/stickers/sticker_big_small.svg?raw";
import stickerColorMatchSvg from "../assets/svg/stickers/sticker_color_match.svg?raw";
import stickerDecodeItSvg from "../assets/svg/stickers/sticker_decode_it.svg?raw";
import stickerFeelingsFacesSvg from "../assets/svg/stickers/sticker_feelings_faces.svg?raw";
import stickerFirstSoundsSvg from "../assets/svg/stickers/sticker_first_sounds.svg?raw";
import stickerHowManySvg from "../assets/svg/stickers/sticker_how_many.svg?raw";
import stickerMemoryMatchSvg from "../assets/svg/stickers/sticker_memory_match.svg?raw";
import stickerMoreLessSvg from "../assets/svg/stickers/sticker_more_less.svg?raw";
import stickerMusicalMemorySvg from "../assets/svg/stickers/sticker_musical_memory.svg?raw";
import stickerNumberOrderSvg from "../assets/svg/stickers/sticker_number_order.svg?raw";
import stickerOddOneOutSvg from "../assets/svg/stickers/sticker_odd_one_out.svg?raw";
import stickerPatternBuilderSvg from "../assets/svg/stickers/sticker_pattern_builder.svg?raw";
import stickerPopFreezeSvg from "../assets/svg/stickers/sticker_pop_freeze.svg?raw";
import stickerShadowMatchSvg from "../assets/svg/stickers/sticker_shadow_match.svg?raw";
import stickerShapeSorterSvg from "../assets/svg/stickers/sticker_shape_sorter.svg?raw";
import stickerStoryOrderSvg from "../assets/svg/stickers/sticker_story_order.svg?raw";
import stickerTakeAwaySvg from "../assets/svg/stickers/sticker_take_away.svg?raw";
import stickerWordBuilderSvg from "../assets/svg/stickers/sticker_word_builder.svg?raw";
import stickerWordMatchSvg from "../assets/svg/stickers/sticker_word_match.svg?raw";
import toyTeddyBearSvg from "../assets/svg/toys/teddy_bear.svg?raw";
import iconSpeakerSvg from "../assets/svg/ui/icon_speaker.svg?raw";
import mascotCelebrateSvg from "../assets/svg/ui/mascot_celebrate.svg?raw";
import mascotIdleSvg from "../assets/svg/ui/mascot_idle.svg?raw";
import tileFeelingsFacesSvg from "../assets/svg/ui/tile_feelings_faces.svg?raw";
import tileAddItUpSvg from "../assets/svg/ui/tiles/tile_add_it_up.svg?raw";
import tileAlphabetSvg from "../assets/svg/ui/tiles/tile_alphabet.svg?raw";
import tileAnimalTraceSvg from "../assets/svg/ui/tiles/tile_animal_trace.svg?raw";
import tileBigSmallSvg from "../assets/svg/ui/tiles/tile_big_small.svg?raw";
import tileColorMatchSvg from "../assets/svg/ui/tiles/tile_color_match.svg?raw";
import tileDecodeItSvg from "../assets/svg/ui/tiles/tile_decode_it.svg?raw";
import tileFirstSoundsSvg from "../assets/svg/ui/tiles/tile_first_sounds.svg?raw";
import tileHowManySvg from "../assets/svg/ui/tiles/tile_how_many.svg?raw";
import tileMemoryMatchSvg from "../assets/svg/ui/tiles/tile_memory_match.svg?raw";
import tileMoreLessSvg from "../assets/svg/ui/tiles/tile_more_less.svg?raw";
import tileMusicalMemorySvg from "../assets/svg/ui/tiles/tile_musical_memory.svg?raw";
import tileNumberOrderSvg from "../assets/svg/ui/tiles/tile_number_order.svg?raw";
import tileOddOneOutSvg from "../assets/svg/ui/tiles/tile_odd_one_out.svg?raw";
import tilePatternBuilderSvg from "../assets/svg/ui/tiles/tile_pattern_builder.svg?raw";
import tilePopFreezeSvg from "../assets/svg/ui/tiles/tile_pop_freeze.svg?raw";
import tileShadowMatchSvg from "../assets/svg/ui/tiles/tile_shadow_match.svg?raw";
import tileShapeSorterSvg from "../assets/svg/ui/tiles/tile_shape_sorter.svg?raw";
import tileStoryOrderSvg from "../assets/svg/ui/tiles/tile_story_order.svg?raw";
import tileTakeAwaySvg from "../assets/svg/ui/tiles/tile_take_away.svg?raw";
import tileWordBuilderSvg from "../assets/svg/ui/tiles/tile_word_builder.svg?raw";
import tileWordMatchSvg from "../assets/svg/ui/tiles/tile_word_match.svg?raw";
import { transitionToScene } from "../utils/sceneTransitions";
import { toDataUri } from "../utils/svgDataUri";
import { textureSizeFor } from "../utils/textureTiers";
import { textStyle } from "../utils/typography";

/**
 * The boot shell's raw SVG table: key → SVG source string, rasterized by the
 * SVG loader at the per-use tier size for each key (see
 * `src/utils/textureTiers.ts` — sized for the asset's largest display context,
 * not a uniform 512²).
 *
 * This is the documented shell set (FR-4): the 22 Hub tile icons, the 22 earned
 * stickers, the two mascot poses, the speaker glyph, and the six avatar keys.
 * Everything else a game draws lives in a named group under `src/game/art/` and
 * is rasterized by that game's own `preload` through
 * `GameSceneBase.preloadArt`, so it ships in the game's chunk instead of here.
 *
 * The six avatars (`animal_cat`, `animal_dog`, `animal_pig`, `frog_red`,
 * `sm_duck`, `toy_teddy_bear`) stay eager because `ProfileChip` and the Settings
 * avatar picker render before any game scene loads. They are the only keys the
 * shell and a game group share. `mascot_idle` stays because it is also a word
 * prompt in `wordLogic`.
 */
export const SHELL_ASSETS = [
  { key: "tile_shape_sorter", svg: tileShapeSorterSvg },
  { key: "tile_animal_trace", svg: tileAnimalTraceSvg },
  { key: "tile_pop_freeze", svg: tilePopFreezeSvg },
  { key: "tile_shadow_match", svg: tileShadowMatchSvg },
  { key: "tile_musical_memory", svg: tileMusicalMemorySvg },
  { key: "tile_big_small", svg: tileBigSmallSvg },
  { key: "tile_first_sounds", svg: tileFirstSoundsSvg },
  { key: "tile_pattern_builder", svg: tilePatternBuilderSvg },
  { key: "tile_alphabet", svg: tileAlphabetSvg },
  { key: "tile_word_match", svg: tileWordMatchSvg },
  { key: "tile_word_builder", svg: tileWordBuilderSvg },
  { key: "tile_how_many", svg: tileHowManySvg },
  { key: "tile_more_less", svg: tileMoreLessSvg },
  { key: "tile_odd_one_out", svg: tileOddOneOutSvg },
  { key: "tile_color_match", svg: tileColorMatchSvg },
  { key: "tile_add_it_up", svg: tileAddItUpSvg },
  { key: "tile_take_away", svg: tileTakeAwaySvg },
  { key: "tile_memory_match", svg: tileMemoryMatchSvg },
  { key: "tile_decode_it", svg: tileDecodeItSvg },
  { key: "tile_number_order", svg: tileNumberOrderSvg },
  { key: "tile_story_order", svg: tileStoryOrderSvg },
  { key: "tile_feelings_faces", svg: tileFeelingsFacesSvg },
  { key: "sticker_shape_sorter", svg: stickerShapeSorterSvg },
  { key: "sticker_animal_trace", svg: stickerAnimalTraceSvg },
  { key: "sticker_pop_freeze", svg: stickerPopFreezeSvg },
  { key: "sticker_shadow_match", svg: stickerShadowMatchSvg },
  { key: "sticker_musical_memory", svg: stickerMusicalMemorySvg },
  { key: "sticker_big_small", svg: stickerBigSmallSvg },
  { key: "sticker_first_sounds", svg: stickerFirstSoundsSvg },
  { key: "sticker_pattern_builder", svg: stickerPatternBuilderSvg },
  { key: "sticker_word_match", svg: stickerWordMatchSvg },
  { key: "sticker_word_builder", svg: stickerWordBuilderSvg },
  { key: "sticker_alphabet_match", svg: stickerAlphabetSvg },
  { key: "sticker_how_many", svg: stickerHowManySvg },
  { key: "sticker_more_less", svg: stickerMoreLessSvg },
  { key: "sticker_odd_one_out", svg: stickerOddOneOutSvg },
  { key: "sticker_color_match", svg: stickerColorMatchSvg },
  { key: "sticker_add_it_up", svg: stickerAddItUpSvg },
  { key: "sticker_take_away", svg: stickerTakeAwaySvg },
  { key: "sticker_memory_match", svg: stickerMemoryMatchSvg },
  { key: "sticker_decode_it", svg: stickerDecodeItSvg },
  { key: "sticker_number_order", svg: stickerNumberOrderSvg },
  { key: "sticker_story_order", svg: stickerStoryOrderSvg },
  { key: "sticker_feelings_faces", svg: stickerFeelingsFacesSvg },
  { key: "mascot_idle", svg: mascotIdleSvg },
  { key: "mascot_celebrate", svg: mascotCelebrateSvg },
  { key: "icon_speaker", svg: iconSpeakerSvg },
  { key: "animal_cat", svg: animalCatSvg },
  { key: "animal_dog", svg: animalDogSvg },
  { key: "animal_pig", svg: animalPigSvg },
  { key: "frog_red", svg: animalFrogRedSvg },
  { key: "sm_duck", svg: smDuckSvg },
  { key: "toy_teddy_bear", svg: toyTeddyBearSvg },
] as const;

/**
 * Preload scene — displays a progress bar while the shell assets load.
 *
 * Loads the documented shell set rasterized at its per-use tier size
 * (`textureSizeFor`), registers load event listeners for progress tracking,
 * then transitions to the Hub scene once the shell assets are loaded. Game art
 * is not part of this load: each game scene rasterizes its own declared groups
 * in its own `preload`.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "Preload" });
  }

  preload(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const title = this.add
      .text(
        centerX,
        centerY - 110,
        "Aby's Little Lab",
        textStyle({
          color: "#2B6CB0",
          fontSize: "44px",
          fontStyle: "bold",
        }),
      )
      .setOrigin(0.5);
    const tagline = this.add
      .text(
        centerX,
        centerY - 70,
        "Fun little games for little learners",
        textStyle({
          color: "#2d3748",
          fontSize: "24px",
        }),
      )
      .setOrigin(0.5);

    const progressBar = this.add.rectangle(centerX, centerY, 300, 30, 0xffffff);
    const progressBox = this.add.rectangle(centerX, centerY, 320, 50, 0x222222);
    progressBox.setDepth(-1);

    this.load.on("progress", (value: number) => {
      progressBar.setDisplaySize(300 * value, 30);
    });

    this.load.on("complete", () => {
      title.destroy();
      tagline.destroy();
      progressBar.destroy();
      progressBox.destroy();
    });

    /* v8 ignore next -- dev-only profiling block: statically removed from
       production builds and unreachable when MODE=test. */
    if (import.meta.env.DEV) {
      // Boot-time profiling (dev-only): aggregate SVG load/rasterization cost.
      // The entire block is statically removed from production builds.
      const loadStart = performance.now();
      let fileCount = 0;
      let lastFileAt = loadStart;
      let slowestFileDelta = 0;

      this.load.on("filecomplete", () => {
        const now = performance.now();
        const delta = now - lastFileAt;
        lastFileAt = now;
        fileCount += 1;
        if (delta > slowestFileDelta) slowestFileDelta = delta;
      });

      this.load.on("complete", () => {
        const elapsed = Math.round(performance.now() - loadStart);
        console.info(
          `[preload] ${fileCount} files in ${elapsed}ms (avg ${Math.round(elapsed / Math.max(fileCount, 1))}ms/file, slowest ${Math.round(slowestFileDelta)}ms)`,
        );
      });
    }

    for (const asset of SHELL_ASSETS) {
      const size = textureSizeFor(asset.key);
      this.load.svg(asset.key, toDataUri(asset.svg), {
        width: size,
        height: size,
      });
    }
  }

  create(): void {
    transitionToScene(this, "Hub");
  }
}

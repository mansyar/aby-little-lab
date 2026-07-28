import Phaser from "phaser";
import cutoutCircleSvg from "../assets/svg/shapes/cutout_circle.svg?raw";
import cutoutSquareSvg from "../assets/svg/shapes/cutout_square.svg?raw";
import cutoutStarSvg from "../assets/svg/shapes/cutout_star.svg?raw";
import cutoutTriangleSvg from "../assets/svg/shapes/cutout_triangle.svg?raw";
import shapeCircleSvg from "../assets/svg/shapes/shape_circle.svg?raw";
import shapeSquareSvg from "../assets/svg/shapes/shape_square.svg?raw";
import shapeStarSvg from "../assets/svg/shapes/shape_star.svg?raw";
import shapeTriangleSvg from "../assets/svg/shapes/shape_triangle.svg?raw";
import stickerShapeSorterSvg from "../assets/svg/stickers/sticker_shape_sorter.svg?raw";

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

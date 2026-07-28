import Phaser from "phaser";
import cutoutCircleUrl from "../assets/svg/shapes/cutout_circle.svg?url";
import cutoutSquareUrl from "../assets/svg/shapes/cutout_square.svg?url";
import cutoutStarUrl from "../assets/svg/shapes/cutout_star.svg?url";
import cutoutTriangleUrl from "../assets/svg/shapes/cutout_triangle.svg?url";
import shapeCircleUrl from "../assets/svg/shapes/shape_circle.svg?url";
import shapeSquareUrl from "../assets/svg/shapes/shape_square.svg?url";
import shapeStarUrl from "../assets/svg/shapes/shape_star.svg?url";
import shapeTriangleUrl from "../assets/svg/shapes/shape_triangle.svg?url";

const SVG_RASTER_SIZE = 256;

const SHAPE_ASSETS = [
  { key: "shape_circle", url: shapeCircleUrl },
  { key: "shape_square", url: shapeSquareUrl },
  { key: "shape_triangle", url: shapeTriangleUrl },
  { key: "shape_star", url: shapeStarUrl },
  { key: "cutout_circle", url: cutoutCircleUrl },
  { key: "cutout_square", url: cutoutSquareUrl },
  { key: "cutout_triangle", url: cutoutTriangleUrl },
  { key: "cutout_star", url: cutoutStarUrl },
] as const;

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
      this.load.svg(asset.key, asset.url, {
        width: SVG_RASTER_SIZE,
        height: SVG_RASTER_SIZE,
      });
    }
  }

  create(): void {
    this.scene.start("Hub");
  }
}
